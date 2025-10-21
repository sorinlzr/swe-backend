import { CategoryModel } from "../models/Category";
import asyncHandler from "express-async-handler";
import createLogger from '../utils/logger.js';

const logger = createLogger('CategoryController');

interface CategoryController {
    getCategories?: any;
}

const categoryController: CategoryController = {};

const getCategories = asyncHandler(async (req, res) => {
    let document;
    if (req.query.name) {
        document = await CategoryModel.findOne({ "name": req.query.name });
        if (!document) {
            res.status(404);
            throw new Error("Category not found");
        }
    } else {
        document = await CategoryModel.find();
        if (!document || document.length === 0) {
            logger.warn('No categories found');
            res.status(200).json({ size: 0, data: [] });
            return;
        }
    }
    const size = Array.isArray(document) ? document.length : 1;
    res.status(200).json({ size, data: document });
});

categoryController.getCategories = getCategories;

export default categoryController;