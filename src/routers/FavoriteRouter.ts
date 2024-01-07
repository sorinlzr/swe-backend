import express from 'express';
import favoriteController from '../controllers/FavoritesController';

const favoriteRouter = express.Router();

favoriteRouter.get('/search', favoriteController.searchFavorite);
favoriteRouter.get('/', favoriteController.getFavorites);
favoriteRouter.post('/', favoriteController.createFavorite);
favoriteRouter.put('/:id', favoriteController.updateFavorite);
favoriteRouter.delete('/:id', favoriteController.deleteFavorite);

export default favoriteRouter;
