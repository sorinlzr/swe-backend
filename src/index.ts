import express from "express";
import 'dotenv/config'
import cors from "cors";
import bodyParser from 'body-parser';
import { connectToDatabase, initializeCategories } from './config/dbconnection';
import userRouter from './routers/userRouter';
import categoryRouter from './routers/CategoryRouter';

const port = process.env.SWE_BACKEND_PORT || 5000;
const corsOptions = {
    origin: `http://localhost:${process.env.SWE_FRONTEND_PORT}`,
};

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get("/", function (request: any, response: any) {
    response.send("Hello World!")
})

app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});

async function main() {
    connectToDatabase();
    initializeCategories();
}

main();