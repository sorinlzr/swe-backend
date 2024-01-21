import asyncHandler from "express-async-handler";
import { XMLHttpRequest } from "xmlhttprequest-ts";

interface SpotifyController {
    getSongs?: any;
    getArtists?: any;
    spotifyTokenType? : any;
    spotifyAccessToken? : any;
    createSpotifyAccessToken? : any;
}

const spotifyController: SpotifyController = {};

function createSpotifyAccessToken () {
    // Token Holen - gehört dann zwar ins Backend, und wird dem Client nach der Anmeldung mitgeschickt, aber vorerst
    // kann ich es so machen.
    // Daten vom Backend.
    const client_id = "a77c30d64c6e4f448693b864b9fa0ce8";
    const client_secret = "7fe3fb3fb288461e8dd8949659f42971";

    let authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
        Authorization: "Basic " + btoa(client_id + ":" + client_secret),
        },
        form: {
        grant_type: "client_credentials",
        },
        json: true,
    };

    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        let response = JSON.parse(xhr.responseText);
        spotifyController.spotifyTokenType = response.token_type;
        spotifyController.spotifyAccessToken = response.access_token;
    };

    const url = "https://accounts.spotify.com/api/token";
    xhr.open("POST", authOptions.url);
    xhr.setRequestHeader("Authorization", authOptions.headers.Authorization);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    var formData = [];
    for (var key in authOptions.form) {
        var encodedKey = encodeURIComponent(key);
        var encodedValue = encodeURIComponent(authOptions.form[key as keyof typeof authOptions.form]);
        formData.push(encodedKey + "=" + encodedValue);
    }
    var requestBody = formData.join("&");

    xhr.send(requestBody);

};

createSpotifyAccessToken();



const getSongs = asyncHandler(async (req, res) => {
    
    let url = "https://api.spotify.com/v1/search?q=";
    let searchText = req.query.searchText;
    let searchparamsURIEncoded = "&type=track&market=AT&limit=5";
  
    if (!searchText) {
        res.status(404).json({ error: "No search text provided" });
        return;
    }

    let finalURL =
      url + encodeURIComponent(searchText.toString()) + searchparamsURIEncoded;
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
        let response = JSON.parse(xhr.responseText);
        let tracks = [];
        for(let item of response.tracks.items) {
            tracks.push({
                name: item?.name + " - " + item?.artists[0]?.name,
                image: item?.album?.images[0]?.url
            });
        }
        res.status(200).json( tracks);
    };
    xhr.open("GET", finalURL);
    xhr.setRequestHeader("Authorization", spotifyController.spotifyTokenType + " " + 
    spotifyController.spotifyAccessToken);
    xhr.send();

});

const getArtists = asyncHandler(async (req, res) => {

    let url = "https://api.spotify.com/v1/search?q=";
    let searchText = req.query.searchText;
    let searchparamsURIEncoded = "&type=artist&market=AT&limit=5";
  
    if (!searchText) {
            res.status(404).json({ error: "No search text provided" });
            return;
    }

    let finalURL =
        url + encodeURIComponent(searchText.toString()) + searchparamsURIEncoded;
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
        let response = JSON.parse(xhr.responseText);
        let artists = [];
        for(let item of response.artists.items) {
            artists.push({
                name: item?.name,
                image: item?.images[0]?.url
            });
        }
        res.status(200).json( artists);
    };
    xhr.open("GET", finalURL);
    xhr.setRequestHeader("Authorization", spotifyController.spotifyTokenType + " " + 
    spotifyController.spotifyAccessToken);
    xhr.send();

});

spotifyController.getSongs = getSongs;
spotifyController.getArtists = getArtists;

export default spotifyController;