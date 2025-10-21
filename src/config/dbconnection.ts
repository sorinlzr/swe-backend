import 'dotenv/config'
import mongoose from 'mongoose';
import { Category }  from '../models/Category';
import { CategoryModel } from '../models/Category';
import createLogger from '../utils/logger';

const logger = createLogger('DBConnectionService');

const mongoHost = process.env.MONGO_HOST || 'mongo';
const mongoPort = process.env.MONGO_PORT || '27017';
const mongoDbName = process.env.MONGO_DB_NAME || 'buzz_db';

const mongodbURI: string = `mongodb://${mongoHost}:${mongoPort}/${mongoDbName}`;

export const connectToDatabase = async (): Promise<void> => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(mongodbURI, {
            user: `${process.env.MONGO_ROOT_USER}`,
            pass: `${process.env.MONGO_ROOT_PASSWORD}`,
            authSource: 'admin'
        });

        logger.info('MongoDB is Connected...');
    } catch (err: any) {
        logger.error("There was an issue connecting to MongoDB");
        logger.error(err.message);
    }
};

export const initializeCategories = async(): Promise<void> => {
    const categoryValues = Object.values(Category).filter(value => typeof value === 'string');
    for (const category of categoryValues) {
        const existingCategory = await CategoryModel.findOne({ name: category });
        if (!existingCategory) {
            const newCategory = new CategoryModel({ name: category });
            await newCategory.save();
            logger.info('Category created: ', category);
        }
    }
}