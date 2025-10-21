import express from "express";
import 'dotenv/config'
import cors from "cors";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { connectToDatabase, initializeCategories } from './config/dbconnection';
import { provisionSampleData, resetDatabase } from './config/dbprovsion';
import userRouter from './routers/userRouter';
import categoryRouter from './routers/CategoryRouter';
import favoriteRouter from "./routers/FavoriteRouter";
import passport from "./config/passport";
import authRouter from "./routers/AuthRouter";
import spotifyRouter from "./routers/SpotifyRouter";
import createLogger from './utils/logger';
import mongoose from 'mongoose';

const logger = createLogger('Server');

const port = process.env.SWE_BACKEND_PORT || 5000;
const corsOptions = {
    origin: `http://localhost:${process.env.SWE_FRONTEND_PORT}`,
    credentials: true,
};

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(passport.initialize());


app.get("/", function (request: any, response: any) {
    response.send("Hello World!")
})

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/spotify", spotifyRouter);

// global error handler
app.use((err: any, req: any, res: any, next: any) => {
    logger.error('Unhandled error:', err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const server = app.listen(port, () => {
    logger.info(`Now listening on port ${port}`);
});

const shutdown = async (signal?: string) => {
    try {
        logger.info(`Received ${signal || 'shutdown'} signal. Stopping server...`);
        // stop accepting new connections
        await new Promise<void>((resolve, reject) => {
            server.close(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        
        if (mongoose.connection && mongoose.connection.readyState !== 0) {
            logger.info('Closing DB connection...');
            await mongoose.disconnect();
        }

        logger.info('Shutdown complete. Exiting process.');
        process.exit(0);
    } catch (err: any) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
};

if (process.env.NODE_ENV === 'production') {
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

async function main() {
    await connectToDatabase();
    
    if (process.env.PROVISION_CLEAN_DB) {
        logger.warn('PROVISION_CLEAN_DB is set - the database will be reset before provisioning');
        await resetDatabase();
    }
    
    await initializeCategories();

    if (process.env.PROVISION_SAMPLE_DATA) {
        logger.info('PROVISION_SAMPLE_DATA is set, running sample data provisioning');
        await provisionSampleData();
    }
}

main();