import mongoose, { Schema, Types, Document } from 'mongoose';
import axios from 'axios';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    password: string;
    avatar?: string;
    followedUsers?: Schema.Types.ObjectId[];
    favorites?: Schema.Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, required: false },
    followedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Favorites' }],
});

userSchema.pre('save', async function (this: IUser, next: Function) {
    if(this.isModified('password')) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }
    if (!this.avatar) {
        const lockNumber = () => Math.floor(Math.random() * 99999) + 1;
        const avatarUrl = await generateRandomUserAvatar(lockNumber());
        this.avatar = avatarUrl;
    }
    next();
});

userSchema.methods.validatePassword = async function (passwordTry: string) {
    return bcrypt.compare(passwordTry, this.password);
  };

async function generateRandomUserAvatar(lockNumber: number): Promise<string> {
    try {
        const url = `https://loremflickr.com/640/480/people?lock=${lockNumber}`;
        const response = await axios.get(url);
        const responseUrl = response.request.res.responseUrl;
        return responseUrl;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Network Error: ${error.message}`);
        } else {
            throw error;
        }
    }
}

const User = mongoose.model<IUser>("User", userSchema);
export default User;
