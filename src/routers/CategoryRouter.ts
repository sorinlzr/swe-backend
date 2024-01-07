import express from 'express';
import categoryController from '../controllers/CategoryController';

const categoryRouter = express.Router();

categoryRouter.get('/', categoryController.getCategories);

export default categoryRouter;
