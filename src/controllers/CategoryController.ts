import { CategoryModel } from "../models/Category";
import asyncHandler from "express-async-handler";

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
            res.status(404);
            throw new Error("No categories found");
        }
    }
    const size = Array.isArray(document) ? document.length : 1;
    res.status(200).json({ size, data: document });
});

categoryController.getCategories = getCategories;

export default categoryController;