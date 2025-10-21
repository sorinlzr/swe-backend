import asyncHandler from "express-async-handler";
import axios from "axios";
import fs from 'fs';
import path from 'path';
import createLogger from '../utils/logger.js';

const logger = createLogger('SpotifyController');

interface SpotifyController {
    getSongs?: any;
    getArtists?: any;
    spotifyTokenType?: string;
    spotifyAccessToken?: string;
    tokenExpiresIn?: any;
    tokenCreationTime?: number;
    createSpotifyAccessToken?: () => Promise<void>; 
}

const spotifyController: SpotifyController = {};

let refreshingPromise: Promise<void> | null = null;

const retryWithBackoff = async <T>(fn: () => Promise<T>, attempts = 3, baseMs = 200): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            const jitter = Math.floor(Math.random() * 100);
            const delay = Math.pow(2, i) * baseMs + jitter;
            logger.debug(`Retry ${i + 1}/${attempts} failed, sleeping ${delay}ms`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw lastError;
};

const loadTokenFromEnv = (): boolean => {
    try {
    const token = process.env.NODE_SPOTIFY_TOKEN;
    const createdAt = process.env.NODE_SPOTIFY_TOKEN_CREATED_AT;
    const expiresIn = process.env.NODE_SPOTIFY_TOKEN_EXPIRES_IN;
    if (!token || !createdAt || !expiresIn) return false;

    spotifyController.spotifyAccessToken = token;
    spotifyController.spotifyTokenType = process.env.NODE_SPOTIFY_TOKEN_TYPE || 'Bearer';
    spotifyController.tokenExpiresIn = Number(expiresIn);
    spotifyController.tokenCreationTime = Number(createdAt);
        return true;
    } catch (err) {
        logger.debug('Failed to load token from NODE_SPOTIFY_TOKEN env vars', err);
        return false;
    }
};

const isTokenExpired = (): boolean => {
    try {
        if (!spotifyController.tokenCreationTime || !spotifyController.tokenExpiresIn) return true;
        return Date.now() > spotifyController.tokenCreationTime + spotifyController.tokenExpiresIn;
    } catch (err) {
        logger.debug('Failed to compute token expiry', err);
        return true;
    }
};

const upsertEnvFileSpotifyToken = (token: string, createdAt: number, expiresIn: number, type = 'Bearer') => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');

        process.env.NODE_SPOTIFY_TOKEN = token;
        process.env.NODE_SPOTIFY_TOKEN_CREATED_AT = String(createdAt);
        process.env.NODE_SPOTIFY_TOKEN_EXPIRES_IN = String(expiresIn);
        process.env.NODE_SPOTIFY_TOKEN_TYPE = type;

        if (process.env.NODE_ENV === 'production') return;

        let content = '';
        if (fs.existsSync(envPath)) {
            content = fs.readFileSync(envPath, { encoding: 'utf8' });
            const lines = content.split(/\r?\n/);
            const toSet: Record<string,string> = {
                NODE_SPOTIFY_TOKEN: token,
                NODE_SPOTIFY_TOKEN_CREATED_AT: String(createdAt),
                NODE_SPOTIFY_TOKEN_EXPIRES_IN: String(expiresIn),
                NODE_SPOTIFY_TOKEN_TYPE: type,
            };

            const keys = Object.keys(toSet);
            const updated = lines.map((line) => {
                for (const k of keys) {
                    if (line.startsWith(k + '=')) {
                        return `${k}=${toSet[k]}`;
                    }
                }
                return line;
            });

            // make sure all keys exist
            for (const k of keys) {
                if (!updated.some(l => l.startsWith(k + '='))) updated.push(`${k}=${toSet[k]}`);
            }

            fs.writeFileSync(envPath, updated.join('\n'), { encoding: 'utf8' });
        } else {
            const lines = [
                `NODE_SPOTIFY_TOKEN=${token}`,
                `NODE_SPOTIFY_TOKEN_CREATED_AT=${createdAt}`,
                `NODE_SPOTIFY_TOKEN_EXPIRES_IN=${expiresIn}`,
                `NODE_SPOTIFY_TOKEN_TYPE=${type}`,
            ];
            fs.writeFileSync(envPath, lines.join('\n') + '\n', { encoding: 'utf8' });
        }
    } catch (err) {
        logger.error('Failed to upsert .env with spotify token vars', err);
    }
};

if (process.env.NODE_ENV !== 'production') {
    loadTokenFromEnv();
}

spotifyController.createSpotifyAccessToken = async () => {
    logger.debug("creating spotify access token");
    if (refreshingPromise) return refreshingPromise;

    refreshingPromise = (async () => {
        try {
            const client_id = process.env.SPOTIFY_CLIENT_ID;
            const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

            const authOptions = {
                url: "https://accounts.spotify.com/api/token",
                headers: {
                    Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data: "grant_type=client_credentials",
            };

            const response = await retryWithBackoff(() => axios.post(authOptions.url, authOptions.data, { headers: authOptions.headers }));

            spotifyController.spotifyTokenType = response.data.token_type;
            spotifyController.spotifyAccessToken = response.data.access_token;
            spotifyController.tokenCreationTime = Date.now();
            spotifyController.tokenExpiresIn = response.data.expires_in;

            const token = spotifyController.spotifyAccessToken as string;
            const createdAt = spotifyController.tokenCreationTime as number;
            const expiresIn = spotifyController.tokenExpiresIn as number;
            const type = spotifyController.spotifyTokenType || 'Bearer';

            process.env.NODE_SPOTIFY_TOKEN = token;
            process.env.NODE_SPOTIFY_TOKEN_CREATED_AT = String(createdAt);
            process.env.NODE_SPOTIFY_TOKEN_EXPIRES_IN = String(expiresIn);
            process.env.NODE_SPOTIFY_TOKEN_TYPE = type;

            upsertEnvFileSpotifyToken(token, createdAt, expiresIn, type);
        } catch (error) {
            logger.error('createSpotifyAccessToken failed:', error);
            throw error;
        } finally {
            // clear the refreshing promise so future refreshes can start
            refreshingPromise = null;
        }
    })();

    return refreshingPromise;
};

if (!spotifyController.spotifyAccessToken) {
    spotifyController.createSpotifyAccessToken();
}

const getSongs = asyncHandler(async (req, res) => {
    try {
    logger.debug("searching: ", req.query.searchText);

        if (isTokenExpired()) {
            logger.debug("Spotify access token is expired, creating a new one")
            // if another refresh is ongoing wait for it, otherwise start a refresh
            if (refreshingPromise) {
                await refreshingPromise;
            } else {
                await spotifyController.createSpotifyAccessToken?.();
            }
        }

        let url = "https://api.spotify.com/v1/search?q=";
        let searchText = req.query.searchText;
        let searchparamsURIEncoded = "&type=track&market=AT&limit=5";

        if (!searchText) {
            res.status(404).json({ error: "No search text provided" });
            return;
        }

        let finalURL =
            url + encodeURIComponent(searchText.toString()) + searchparamsURIEncoded;
        const response = await axios.get(finalURL, {
            headers: {
                Authorization: spotifyController.spotifyTokenType + " " + spotifyController.spotifyAccessToken,
            },
        });

        let songs = response.data.tracks.items.map((item: any) => ({
            name: item?.name + " - " + item?.artists[0]?.name,
            image: item?.album?.images[0]?.url,
        }));

        res.status(200).json(songs);
    } catch (error) {
        logger.error('getSongs failed:', error);
        res.status(500).json({ error: 'An error occurred while fetching songs' });
    }
});

const getArtists = asyncHandler(async (req, res) => {
    try {
    logger.debug("searching: ", req.query.searchText);

        if (isTokenExpired()) {
            logger.debug("Spotify access token is expired, creating a new one")
            if (refreshingPromise) {
                await refreshingPromise;
            } else {
                await spotifyController.createSpotifyAccessToken?.();
            }
        }

        let url = "https://api.spotify.com/v1/search?q=";
        let searchText = req.query.searchText;
        let searchparamsURIEncoded = "&type=artist&market=AT&limit=5";

        if (!searchText) {
            res.status(404).json({ error: "No search text provided" });
            return;
        }

        let finalURL =
            url + encodeURIComponent(searchText.toString()) + searchparamsURIEncoded;

        const response = await axios.get(finalURL, {
            headers: {
                Authorization: spotifyController.spotifyTokenType + " " + spotifyController.spotifyAccessToken,
            },
        }).catch(error => {
            logger.error('Axios error:', error.response?.data ?? error);
            throw error;
        });

        let artists = response.data.artists.items.map((item: any) => ({
            name: item?.name,
            image: item?.images[0]?.url,
        }));

        res.status(200).json(artists);
    } catch (error) {
        logger.error('getArtists failed:', error);
        res.status(500).json({ error: 'An error occurred while fetching artists' });
    }
});

spotifyController.getSongs = getSongs;
spotifyController.getArtists = getArtists;

export default spotifyController;
