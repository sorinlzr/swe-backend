import express from 'express';
import userController from '../controllers/UserController';

const userRouter = express.Router();

userRouter.post('/', userController.createUser);
userRouter.get('/', userController.getUsers);

export default userRouter;
