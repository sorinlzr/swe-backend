import express from 'express';
import userController from '../controllers/UserController';

const userRouter = express.Router();

userRouter.post('/', userController.createUser);
userRouter.get('/', userController.getUsers);
userRouter.get('/:id', userController.getOneUser);
userRouter.put('/:id', userController.updateUser);

export default userRouter;
