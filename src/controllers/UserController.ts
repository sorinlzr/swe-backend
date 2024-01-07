import User, { IUser } from '../models/User';
import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';

interface UserController {
    createUser?: any;
    getUsers?: any;
}

const userController: UserController = {};

const createUser = asyncHandler(async (req: Request, res: Response) => {
    console.log("create users in the controller")
    console.log(req.body)
    const newDoc = await User.create(req.body);
    res.status(201).json({ data: newDoc });
});

const getUsers = asyncHandler(async (req, res, next) => {
    const document = await User.find();

    res.status(200).json({ size: document.length, data: document });
});

userController.getUsers = getUsers;
userController.createUser = createUser;

export default userController;
