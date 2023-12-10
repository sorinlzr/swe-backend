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


### Environment variables
- `SWE_BACKEND_PORT`: by default the application will be started on the default port 5000. This can be changed if you set the environment variable to some other value, either in an `.env` file or as a system variable