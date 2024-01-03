import { connectToDatabase } from './config/dbconnection';
import express from "express";
import 'dotenv/config'

const port = process.env.SWE_BACKEND_PORT || 5000;

const app = express();

app.get("/", function (request: any, response: any) {
    response.send("Hello World!")
})

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});

async function main() {
    connectToDatabase();
}

main();