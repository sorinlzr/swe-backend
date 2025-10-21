import mongoose, { Schema, Types, Document, ObjectId } from 'mongoose';
import bcrypt from 'bcrypt';

interface IUser extends Document<ObjectId> {
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
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Favorite' }],
});

userSchema.pre('save', async function (this: IUser, next: Function) {
    if(this.isModified('password')) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }
    if (!this.avatar) {
        const lockNumber = () => Math.floor(Math.random() * 100) + 1;
        const avatarUrl = await generateRandomUserAvatar(lockNumber());
        this.avatar = avatarUrl;
    }
    next();
});

userSchema.methods.validatePassword = async function (passwordTry: string) {
    return bcrypt.compare(passwordTry, this.password);
  };

async function generateRandomUserAvatar(lockNumber: number): Promise<string> {
    const url = `https://avatar.iran.liara.run/public/${lockNumber}`;
    return url;
}

const User = mongoose.model<IUser>("User", userSchema);
export default User;
