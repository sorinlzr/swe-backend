import User from '../models/User';
import { IUser as ResponseBody} from '../interfaces/IUser.js';

import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { getUserIdFromJwtToken } from './AuthController';

interface UserController {
    createUser?: any;
    getUsers?: any;
    getOneUser?: any;
    updateUser?: any;
    getFollowedUsersWithFavorites?: any;
    addFollowedUser?: any;
    deleteFollowedUser?: any;
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

            const payload: ResponseBody = {
                id: newDoc._id,
                username: newDoc.username,
                firstname: newDoc.firstname,
                lastname: newDoc.lastname,
                avatar: newDoc.avatar
            }

            res.status(201).json({ data: payload });
        }
    } catch (error: any) {
        console.error(`There was a problem creating the user\n`, error);
        res.status(400).json({ error: "There was a problem creating the user. Please check your input" });
    }
});

const getUsers = asyncHandler(async (req, res, next) => {
    const document = await User.find().populate({
        path: 'favorites',
        populate: {
            path: 'type',
            model: 'Category'
        },
        model: 'Favorite'
    });;

    const users: ResponseBody[] = document.map(doc => ({
        id: doc._id,
        username: doc.username,
        firstname: doc.firstname,
        lastname: doc.lastname,
        avatar: doc.avatar,
        favorites: doc.favorites
    }));

    res.status(200).json({ size: document.length, data: users });
});

const getOneUser = asyncHandler(async (req, res, next) => {
    const document = await User.findOne({ username: req.params.username })
        .populate({
            path: 'favorites',
            populate: {
                path: 'type',
                model: 'Category'
            },
            model: 'Favorite'
        });
    if (!document) {
        res.status(404).json({ error: "User not found" });
    } else {
        const user: ResponseBody = {
            id: document._id,
            username: document.username,
            firstname: document.firstname,
            lastname: document.lastname,
            avatar: document.avatar,
            email: document.email,
            favorites: document.favorites,
            followedUsers: document.followedUsers
        };
        
        res.status(200).json({ user });
    }

});

const updateUser = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (req.query.update !== 'true') {
        res.status(400).json({ message: "Are you sure you want to update the user?" });
    } else {
        if (req.body.firstname) {
            user.firstname = req.body.firstname;
        }
        if (req.body.lastname) {
            user.lastname = req.body.lastname;
        }
        if (req.body.username) {
            const existingUser = await User.findOne({ "username": req.body.username });
            if (existingUser) {
                console.error(`Error creating user. There is already an user with the same username\n`);
                res.status(400).json({ error: "There is already an user with the same username" });
            } else {
                user.username = req.body.username;
            }
        }
        if (req.body.password) {
            user.password = req.body.password;
        }
        if (req.body.email) {
            const existingUser = await User.findOne({ "email": req.body.email });
            if (existingUser) {
                console.error(`Error creating user. There is already an user with the same email\n`);
                res.status(400).json({ error: "There is already an user with the same email" });
            } else {
                user.email = req.body.email;
            }
        }
        if (req.body.avatar) {
            user.avatar = req.body.avatar;
        }
        await user.save();
        res.status(200).json({ message: "User updated successfully", data: user });
    }
});

const getFollowedUsersWithFavorites = asyncHandler(async (req, res, next) => {
    const jwtUserId = getUserIdFromJwtToken(req);

    if(!jwtUserId) {
        res.status(401).json({ error: "Unautorized." });
        return;
    }

    const user = await User.findById(jwtUserId);
    if (!user) {
        res.status(500).json({ error: "Unexpected Error happened." });
        throw new Error("Current User not found? - Should no be possible!");
    }

    // Ich folge niemandem.
    if(!user?.followedUsers || user?.followedUsers.length === 0){
        res.status(404).json({ error: "Current User is not following anyone." });
        return;
    } 
    
    // Kontrolle, ob FollowedUsers Favoriten haben
    const followedUsersWithFavorites = await User.find({ _id: { $in: user.followedUsers},
        $where: "this.favorites.length > 0"}).populate({
        path: 'favorites',
        populate: {
            path: 'type',
            model: 'Category'
        },
        model: 'Favorite'
    });

    //Kein FollowedUser hat Favoriten
    if (!followedUsersWithFavorites || followedUsersWithFavorites.length === 0) {
        res.status(204).json({message : "None of the followed Users has Favorites."});
        return;
    }

    // Daten zurückliefern
    const usersWithFavorites: ResponseBody[] = followedUsersWithFavorites.map(user => ({
        id: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        avatar: user.avatar,
        favorites: user.favorites
    }));
    res.status(200).json({ size: followedUsersWithFavorites.length, data: usersWithFavorites });
});

const addFollowedUser = asyncHandler(async (req, res, next) => {
    const jwtUserId = getUserIdFromJwtToken(req);

    if(!jwtUserId) {
        res.status(401).json({ error: "Unautorized." });
        return;
    }

    const user = await User.findById(jwtUserId);
    if (!user) {
        res.status(500).json({ error: "Unexpected Error happened." });
        throw new Error("Current User not found? - Should no be possible!");
    } else {
        const userToFollow = await User.findById(req.params.userid);

        if (!userToFollow) {
            res.status(404).json({ error: "Followed user not found" });
            return;
        } 
        if (user._id.toString() === userToFollow._id.toString()) {
            res.status(409).json({ error: "User cannot follow himself" });
            return;
        }
        else {
            if (user.followedUsers?.includes(userToFollow._id)) {
                res.status(409).json({ error: "User is already following this user" });
            } else {
                user.followedUsers?.push(userToFollow._id);
                await user.save();
                res.status(204).json({ message: "Now following the User" });
            }
        }
    }
});

const deleteFollowedUser = asyncHandler(async (req, res, next) => {
    const jwtUserId = getUserIdFromJwtToken(req);

    if(!jwtUserId) {
        res.status(401).json({ error: "Unautorized." });
        return;
    }

    const user = await User.findById(jwtUserId);
    if (!user) {
        res.status(500).json({ error: "Unexpected Error happened." });
        throw new Error("Current User not found? - Should no be possible!");
    }
    else {
        const userToUnfollow = await User.findById(req.params.userid);
        if (!userToUnfollow) {
            res.status(404).json({ error: "Followed user not found" });
        } else {
            if (!user.followedUsers?.includes(userToUnfollow._id)) {
                res.status(409).json({ error: "User is not following this user" });
            } else {
                user.followedUsers = user.followedUsers?.filter(followedUser => followedUser.toString() !== userToUnfollow._id.toString());
                await user.save();
                res.status(204).json({ message: "Unfollowed the User" });
            }
        }
    }
});

userController.getUsers = getUsers;
userController.createUser = createUser;
userController.getOneUser = getOneUser;
userController.updateUser = updateUser;

userController.getFollowedUsersWithFavorites = getFollowedUsersWithFavorites;
userController.addFollowedUser = addFollowedUser;
userController.deleteFollowedUser = deleteFollowedUser;

export default userController;
