import mongoose from "mongoose";

export enum Category {
    Song,
    Artist,
    Book,
    Movie
}

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        enum: Object.values(Category),
        required: true,
        unique: true
    }
});


export const CategoryModel = mongoose.model('Category', CategorySchema);