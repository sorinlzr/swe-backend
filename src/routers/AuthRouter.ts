import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import express from 'express';
import { login, logout } from '../controllers/AuthController';

const authRouter = express.Router();
authRouter.post("/login", login);
authRouter.post("/logout", logout);

export default authRouter;
