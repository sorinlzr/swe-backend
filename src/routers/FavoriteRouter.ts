import express from 'express';
import favoriteController from '../controllers/FavoritesController';
import { validateToken } from '../controllers/AuthController';

const favoriteRouter = express.Router();

favoriteRouter.get('/', favoriteController.getFavorites);
favoriteRouter.post('/', validateToken, favoriteController.createFavorite);
favoriteRouter.put('/:id', validateToken, favoriteController.updateFavorite);
favoriteRouter.delete('/:id', validateToken, favoriteController.deleteFavorite);

export default favoriteRouter;
