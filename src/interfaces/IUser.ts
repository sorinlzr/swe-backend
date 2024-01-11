export interface IUser {
    id: string;
    username: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    avatar?: string;
    followedUsers?: any;
    favorites?: any    
}