import express from 'express';
import userController from '../controllers/UserController';

const userRouter = express.Router();

userRouter.post('/', userController.createUser);
userRouter.get('/', userController.getUsers);
userRouter.get('/:username', userController.getOneUser);
userRouter.put('/:username', userController.updateUser);

export default userRouter;
