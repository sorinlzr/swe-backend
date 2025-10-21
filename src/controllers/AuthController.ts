import dotenv from 'dotenv';
dotenv.config({ path: './.env' })

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from "express-async-handler"
import User from "../models/User.js";
import { IUser as ResponseBody} from '../interfaces/IUser.js';
import { CookieOptions, Request, Response, NextFunction } from "express";
import createLogger from '../utils/logger.js';

const logger = createLogger('AuthController');

const TOKEN = "swe-backend-cookie";

export const login = asyncHandler(async (req, res, next): Promise<void> => {
    try {
        logger.debug("Login attempt");
        const username = req.body.username;
        const password = req.body.password;

        if (!username || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        const user = await User.findOne({ username });

        if (!user) {
            res.status(404).json({ error: "Username not found" });
            return;
        } else {
            logger.debug("user found");

            const auth = await bcrypt.compare(password, user.password)
            if (!auth) {
                logger.warn("Incorrect password");
                res.status(401).json({ error: 'Incorrect password' })
                return;
            }

            logger.debug("Matching password");

            const payload: ResponseBody = {
                id: user._id.toString(),
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                avatar: user.avatar
            }

            // Sign token
            const token = createSecretToken(payload);
            logger.debug("created token");

            const maxAge = Number(process.env.JWT_MAX_AGE) * 1000 || 3600000;
            const cookieOptions: CookieOptions = {
                httpOnly: process.env.NODE_ENV === 'production',
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
                sameSite: "lax",
                path: "/",
                maxAge: maxAge
            };

            res.
                status(200)
                .cookie(TOKEN, token, cookieOptions)
                .json(payload);
        }


    } catch (error) {
        logger.debug("Error during login", error);
        return next(error);
    }
});

export const logout = asyncHandler(async (req, res, next) => {
    try {
        // Clear the token cookie
        res.clearCookie(TOKEN);

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error("Error during logout", error);
    }
});

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
    // Get the token from the request cookie
    const token: string = req.cookies[TOKEN];
    
    if (!token) {
        logger.debug("Invalid token");
        // Token is missing, return unauthorized
        return res.status(401).send('Unauthorized');
    }

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || '';

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined");
    } else {
        jwt.verify(token, jwtSecret, (err: any) => {
            if (err) {
                // Token is invalid or expired
                logger.debug("Token is invalid or expired");
                return res.status(401).send('Unauthorized');
            }
            // Token is valid, proceed to the next middleware
            next();
        });
    }
};

export const getUserIdFromJwtToken = (req: Request) => {
    logger.debug("Getting user id from jwt token")
    const jwtSecret = process.env.JWT_SECRET || '';
    try {
        const jwtPayload = jwt.verify(req.cookies[TOKEN], jwtSecret) as ResponseBody;
        return jwtPayload?.id;
    }
    catch (error) {
        logger.debug("Failed to get user id from token", error);
        return null;
    }
}

const createSecretToken = (payload: {}) => {
    return jwt.sign(
        payload,
        String(process.env.JWT_SECRET),
        {
            expiresIn: Number(process.env.JWT_MAX_AGE) * 1000 || 3600000
        }
    );
}
