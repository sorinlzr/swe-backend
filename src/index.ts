const express = require('express');

const port = process.env.SWE_BACKEND_PORT || 5000;
const app = express();

app.get("/", function (request: any, response: any) {
    response.send("Hello World!")
})


app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});