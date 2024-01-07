import 'dotenv/config'
import mongoose from 'mongoose';
import { Category }  from '../models/Category';
import { CategoryModel } from '../models/Category';

const mongodbURI: string = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`;

export const connectToDatabase = async (): Promise<void> => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(mongodbURI, {
            user: `${process.env.MONGO_ROOT_USER}`,
            pass: `${process.env.MONGO_ROOT_PASSWORD}`,
            authSource: 'admin'
        });

        console.log('MongoDB is Connected...');
    } catch (err: any) {
        console.log("There was an issue connecting to MongoDB");
        console.error(err.message);
    }
};

export const initializeCategories = async(): Promise<void> => {
    const categoryValues = Object.values(Category).filter(value => typeof value === 'string');
    for (const category of categoryValues) {
      const existingCategory = await CategoryModel.findOne({ name: category });
      if (!existingCategory) {
        const newCategory = new CategoryModel({ name: category });
        await newCategory.save();
        console.log('Category created: ', category);
      }
    }
}