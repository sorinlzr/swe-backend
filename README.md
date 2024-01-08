#  BUZZ
## Backend server for the SWE project at FH Campus Wien


### Install dependencies

Make sure that you have [node v20.5.0 and npm 10.2.4](https://nodejs.org/en/download) installed. 
If you do, then run the command below to install the required dependencies:
```
npm install
```

### Scripts overview

- `npm run dev` - Starts the application in development using [tsx](https://github.com/privatenumber/tsx) and automatically rerun on changes
- `npm run start` - Starts the app in production by first building the project with `npm run build`, and then executing the compiled JavaScript in `./build/index.js`
- `npm run build` - Compiles the TypeScript files to vanilla JS and adds them in the `./build` folder, cleaning them first.


### Docker
The project uses docker containers, so you should have the [docker](https://www.docker.com/) engine installed on your machine.<br>

At the moment, there are two services: 
- a `mongo` database
- a `mongo-express` service, which is a web-based MongoDB admin interface

Before starting the containers you need to add some necessary environment variables mentioned below.

### Environment variables
Set the following environment variables in a `.env` file in the root project folder:
```
SWE_BACKEND_PORT            - the backend application server port. If not set it defaults to 5000
JWT_SECRET                  - the secret used to generate the JWT token
JWT_MAX_AGE                 - the expiration time of the token. Also used for the cookie maxAge
MONGO_ROOT_USER             - the db user
MONGO_ROOT_PASSWORD         - the db password
MONGO_HOST                  - the host where the db is running, locally should be set to 'localhost'
MONGO_PORT                  - the port where the mongoDB can service can be reached
MONGO_DB_NAME               - the database name
MONGO_DB_COLLECTION         - the initial collection inside the database specified above
MONGOEXPRESS_LOGIN          - the user for the UI interface login
MONGOEXPRESS_PASSWORD       - the password for the UI interface login
MONGOEXPRESS_PORT           - the port where to access the web UI interface
```
Open a terminal in the repository root directory and run 
```
docker compose up
``` 
to spin up the containers described in the `docker-compose.yml` file. 

The MongoDB service will create a directory `.db` where it stores the database.<br>
The MongoExpress UI takes some time until it can connect to the database service.<br>
<br>
Once you start the application, the `mongoose.connect()` function is called from the `dbconnection.ts` file. This will create the database connection that will be used when the application will save documents to the database. More info in the [Mongoose documentation](https://mongoosejs.com/docs/api/mongoose.html#Mongoose.prototype.connect())
