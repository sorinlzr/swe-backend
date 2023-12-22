import 'dotenv/config'
import mongoose from 'mongoose';

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