import asyncHandler from "express-async-handler";
import axios from "axios";

interface SpotifyController {
    getSongs?: any;
    getArtists?: any;
    spotifyTokenType?: string;
    spotifyAccessToken?: string;
    createSpotifyAccessToken?: () => Promise<void>; // Specify Promise type
}

const spotifyController: SpotifyController = {};

spotifyController.createSpotifyAccessToken = async () => {
    console.debug("creating spotify access token");
    try {
        const client_id = process.env.SPOTIFY_CLIENT_ID;
        const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

        const authOptions = {
            url: "https://accounts.spotify.com/api/token",
            headers: {
                Authorization: "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data: "grant_type=client_credentials", // Use a URL-encoded string
        };

        const response = await axios.post(authOptions.url, authOptions.data, { headers: authOptions.headers });

        spotifyController.spotifyTokenType = response.data.token_type;
        spotifyController.spotifyAccessToken = response.data.access_token;
    } catch (error) {
        console.error('createSpotifyAccessToken failed:', error);
    }
};

spotifyController.createSpotifyAccessToken(); // Call the async function

const getSongs = asyncHandler(async (req, res) => {
    try {
        console.debug("searching: ", req.query.searchText);

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
            name: item?.name,
            image: item?.album?.images[0]?.url,
        }));

        res.status(200).json(songs);
    } catch (error) {
        console.error('getSongs failed:', error);
        res.status(500).json({ error: 'An error occurred while fetching songs' });
    }
});

const getArtists = asyncHandler(async (req, res) => {
    try {
        console.debug("searching: ", req.query.searchText);

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
            console.error('Axios error:', error.response.data);
            throw error;
        });

        let artists = response.data.artists.items.map((item: any) => ({
            name: item?.name,
            image: item?.images[0]?.url,
        }));

        res.status(200).json(artists);
    } catch (error) {
        console.error('getArtists failed:', error);
        res.status(500).json({ error: 'An error occurred while fetching artists' });
    }
});

spotifyController.getSongs = getSongs;
spotifyController.getArtists = getArtists;

export default spotifyController;
