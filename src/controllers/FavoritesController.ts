import { IFavorite as ResponseBody} from '../interfaces/IFavorite';
import asyncHandler from 'express-async-handler';
import Favorite from '../models/Favorite';
import { CategoryModel } from '../models/Category';
import User from '../models/User';
import { getUserIdFromJwtToken } from './AuthController';

interface FavoriteController {
    getFavorites?: any;
    createFavorite?: any;
    deleteFavorite?: any;
    updateFavorite?: any;
}

const favoriteController: FavoriteController = {};

const createFavorite = asyncHandler(async (req, res) => {
    try {
        const category = await CategoryModel.findOne({ "name": capitalizeFirstLetter(String(req.body.type)) });
        if (!category) {
            res.status(404);
            throw new Error("Category not found");
        }

        const jwtUserId = getUserIdFromJwtToken(req);
        const user = await User.findById(jwtUserId);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        let favorite = await Favorite.findOne({ type: category._id.toString(), _id: { $in: user.favorites } });

        if (favorite) {
            res.status(409).json({ error: "A favorite of this category already exists for this user" });

        } else {
            if (user.favorites && user.favorites.length >= 4) {
                res.status(409).json({ error: "User already has 4 favorites" });
            } else {
                favorite = await Favorite.create({
                    type: category._id.toString(),
                    name: req.body.name,
                    coverArtUrl: req.body.coverArtUrl,
                    user: jwtUserId
                });
                user.favorites?.push(favorite._id);
                await user.save();

                const payload: ResponseBody = {
                    id: favorite._id,
                    name: favorite.name,
                    type: category.name.toString(),
                    coverArtUrl: favorite.coverArtUrl
                }
                res.status(201).json({ data: payload });
            }
        }
    } catch (error: any) {
        console.error(`Could not create the favorite with the specified data ${req.body}\n`, error);
        res.status(404).json({ error: "Could not create the favorite with the specified data. Please check your input" });
    }
});

const deleteFavorite = asyncHandler(async (req, res) => {
    try {
        const jwtUserId = getUserIdFromJwtToken(req);

        let favorite = await Favorite.findById(req.params.id);
        const user = await User.findById(favorite?.user);

        if (user && user._id.toString() === jwtUserId) {
            const favorite = await Favorite.findOneAndDelete({ "_id": req.params.id });
            if (!favorite) {
                res.status(404);
                throw new Error("Favorite not found");
            }

            const index = user?.favorites?.map(favorite => favorite.toString()).indexOf(favorite._id.toString());
            if (index! > -1) {
                user.favorites?.splice(index!, 1);
                await user.save();
            } else {
                console.error("Could not remove the favorite from the user. The Favorite was not found in the favorites list of the user, this should not happen");
            }
            console.log("Deleted Favorite: ", favorite);
            res.status(204).send();
        } else {
            res.status(400).json({ error: "Could not delete the favorite with the specified data. Please check your input" });
        }
    } catch (error: any) {
        console.error(`Could not delete the favorite with id ${req.query.id}\n`, error);
        res.status(404).json({ error: "Could not delete the favorite with the specified id. Id does not exist" });
    }
});

const getFavorites = asyncHandler(async (req, res) => {
    try {
        if (req.query.category) {
            const category = await CategoryModel.findOne({ "name": capitalizeFirstLetter(String(req.query.category)) });

            if (!category) {
                res.status(404).json({ error: "Could not find the category with the specified name" });
            } else {
                const favorites = await Favorite.find({ "type": category._id });
                const size = Array.isArray(favorites) ? favorites.length : 1;
                res.status(200).json({ size, data: favorites });
            }
        } else if (req.query.id) {
            const document = await Favorite.findById(req.query.id);
            console.log(document);
            if (!document) {
                res.status(404).json({ error: "Could not find the favorite with the specified id" });
            }
            res.status(200).json({ data: document });
        } else {
            const document = await Favorite.find();
            if (!document || document.length === 0) {
                res.status(404);
                throw new Error("No favorites found");
            }
            const size = Array.isArray(document) ? document.length : 1;
            res.status(200).json({ size, data: document });
        }
    } catch (error: any) {
        console.error(`Could not retrieve the favorites\n`, error);
        res.status(404).json({ error: "Could not retrieve the favorites" });
    }

});


const updateFavorite = asyncHandler(async (req, res) => {
    try {
        const category = await CategoryModel.findOne({ "name": capitalizeFirstLetter(String(req.body.type)) });
        if (!category) {
            res.status(404).json({ error: "Could not find the category with the specified name" });
        }

        const jwtUserId = getUserIdFromJwtToken(req);

        const user = await User.findById(jwtUserId);
        if (!user) {
            res.status(404).json({ error: "Could not find the user with the specified id" });
        }

        const favorite = await Favorite.findById(req.params.id);
        if (!favorite) {
            res.status(404).json({ error: "Could not find the favorite with the specified id" });
        } else if (String(favorite?.user) === String(user?._id)) {
            if (String(favorite.type) === String(category?._id)) {
                if (req.query.update === 'true') {
                    favorite.name = req.body.name ? req.body.name : favorite.name;
                    favorite.coverArtUrl = req.body.coverArtUrl ? req.body.coverArtUrl : favorite.coverArtUrl;
                    favorite.user = user?._id;
                    await favorite.save();
                    console.log("Updated Favorite: ", favorite);

                    res.status(200).json({ data: favorite });
                } else {
                    res.status(400).json({ message: "Favorite of that type already exists. Are you sure you want to update it?" });
                }
            } else {
                res.status(400).json({ error: "Cannot update the type of the favorite." });
            }
        } else {
            console.log("Cannot update Favorites of other users.")
            res.status(404).json({ error: "Could not find the favorite with the specified id" });
        }
    } catch (error: any) {
        console.error(`Could not update the favorite with id ${req.params.id}\n`, error);
        res.status(404).json({ error: "Could not update the favorite with the specified id. Please check your input" });
    }
});

function capitalizeFirstLetter(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}

favoriteController.createFavorite = createFavorite;
favoriteController.deleteFavorite = deleteFavorite;
favoriteController.getFavorites = getFavorites;
favoriteController.updateFavorite = updateFavorite;

export default favoriteController;
