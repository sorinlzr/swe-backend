import express from 'express';
import spotifyController from '../controllers/SpotifyController';

const spotifyRouter = express.Router();

spotifyRouter.get('/songs', spotifyController.getSongs);
spotifyRouter.get('/artists', spotifyController.getArtists);

export default spotifyRouter;