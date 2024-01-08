import User, { IUser } from '../models/User';
import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';

interface UserController {
    createUser?: any;
    getUsers?: any;
    getOneUser?: any;
    updateUser?: any;
}

const userController: UserController = {};

const createUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, email } = req.body;
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.error(`Error creating user. There is already an user with the same email or username\n`);
            res.status(400).json({ error: "There is already an user with the same email or username" });
        } else {
            const newDoc = await User.create(req.body);
            res.status(201).json({ data: newDoc });
        }
    } catch (error: any) {
        console.error(`There was a problem creating the user\n`, error);
        res.status(400).json({ error: "There was a problem creating the user. Please check your input" });
    }
});

const getUsers = asyncHandler(async (req, res, next) => {
    const document = await User.find();

    res.status(200).json({ size: document.length, data: document });
});

const getOneUser = asyncHandler (async (req, res, next) => {
    const document = await User.findById(req.params.id);
    if (!document) {
        res.status(404);
        throw new Error("User not found");
    }
    res.status(200).json({ data: document });
});

const updateUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (req.body.firstname) {
        user.firstname = req.body.firstname;
    }
    if (req.body.lastname) {
        user.lastname = req.body.lastname;
    }
    if (req.body.username) {
        user.username = req.body.username;
    }
    if (req.body.password) {
        user.password = req.body.password;
    }
    if (req.body.email) {
        user.email = req.body.email;
    }
    if (req.body.avatar) {
        user.avatar = req.body.avatar;
    }

    await user.save();

    res.status(200).json({ message: "User updated successfully", data: user });
});

userController.getUsers = getUsers;
userController.createUser = createUser;
userController.getOneUser = getOneUser;
userController.updateUser = updateUser;

export default userController;
