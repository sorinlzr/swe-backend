import express from "express";
import 'dotenv/config'
import cors from "cors";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { connectToDatabase, initializeCategories } from './config/dbconnection';
import userRouter from './routers/userRouter';
import categoryRouter from './routers/CategoryRouter';
import favoriteRouter from "./routers/FavoriteRouter";
import passport from "./config/passport";
import authRouter from "./routers/AuthRouter";
import spotifyRouter from "./routers/SpotifyRouter";

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

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});

async function main() {
    connectToDatabase();
    initializeCategories();
}

main();