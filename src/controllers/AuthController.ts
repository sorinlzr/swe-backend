import dotenv from 'dotenv';
dotenv.config({ path: './.env' })

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from "express-async-handler"
import User from "../models/User.js";
import { CookieOptions, Request, Response, NextFunction } from "express";

const JWT_TOKEN = "swe-backend-cookie";
export interface ResponseBody {
    id: string;
    username: string;
    firstname?: string;
    lastname?: string;
}

export const login = asyncHandler(async (req, res, next): Promise<void> => {
    try {
        const username = req.body.username;
        const password = req.body.password;

        if (!username || !password) {
            res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ username });

        if (!user) {
            res.status(404).json({ message: "Username not found" });
        } else {
            console.log("user found");

            const auth = await bcrypt.compare(password, user.password)
            if (!auth) {
                res.status(401).json({ message: 'Incorrect password or email' })
            }

            console.log("Matching password");

            const payload: ResponseBody = {
                id: user._id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname
            }

            // Sign token
            const token = createSecretToken(payload);

            console.log("created token");

            const maxAge = Number(process.env.JWT_MAX_AGE) || 3600000;
            const cookieOptions: CookieOptions = {
                httpOnly: false,
                secure: false,
                domain: "localhost",
                sameSite: "lax",
                path: "/",
                maxAge: maxAge
            };

            res.
                status(200)
                .cookie(JWT_TOKEN, token, cookieOptions)
                .json(payload);
        }


    } catch (error) {
        console.log("Error during login");
        console.error(error);
    }
});

export const logout = asyncHandler(async (req, res, next) => {
    try {
        // Clear the token cookie
        res.clearCookie(JWT_TOKEN);

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log("Error during logout");
        console.error(error);
    }
});

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
    // Get the token from the request cookie
    const token = req.cookies?.token;

    if (!token) {
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
                return res.status(401).send('Unauthorized');
            }
            // Token is valid, proceed to the next middleware
            next();
        });
    }
};

export const getUserIdFromJwtToken = (cookieToken: string) => {
    const jwtSecret = process.env.JWT_SECRET || '';
    const jwtPayload = jwt.verify(cookieToken, jwtSecret) as ResponseBody;
    return jwtPayload?.id;
}

const createSecretToken = (payload: {}) => {
    return jwt.sign(
        payload,
        String(process.env.JWT_SECRET),
        {
            expiresIn: Number(process.env.JWT_MAX_AGE) || 3600
        }
    );
}
