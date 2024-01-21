import express from 'express';
import userController from '../controllers/UserController';
import { validateToken } from '../controllers/AuthController';

const userRouter = express.Router();

userRouter.post('/', userController.createUser);
userRouter.get('/', userController.getUsers);
userRouter.get('/follow', userController.getFollowedUsersFavorites);
userRouter.post('/follow/:userid', validateToken, userController.addFollowedUser);
userRouter.delete('/follow/:userid', validateToken, userController.deleteFollowedUser);
userRouter.get('/:username', userController.getOneUser);
userRouter.put('/:username', userController.updateUser);

export default userRouter;
