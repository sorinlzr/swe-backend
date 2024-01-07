import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
    type: Schema.Types.ObjectId;
    name: string;
    coverArtUrl?: string;
}

const favoriteSchema = new Schema<IFavorite>({
    type: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    coverArtUrl: { type: String, required: false },
});

const Favorite = mongoose.model<IFavorite>("Favorite", favoriteSchema);
export default Favorite;
