import mongoose from 'mongoose';
import User from '../models/User';
import Favorite from '../models/Favorite';
import { CategoryModel } from '../models/Category';
import createLogger from '../utils/logger.js';

const logger = createLogger('DBProvision');

/**
* drop the current database. Use with caution, this removes all data
* intended for ephemeral/dev environments only and triggered via env var (see readme)
*/
export const resetDatabase = async (): Promise<void> => {
  try {
    logger.warn('Resetting database - dropping the current database (ALL data will be removed)');
    const db = mongoose.connection.db;
    if (!db) {
      logger.warn('No active DB connection available to reset');
      return;
    }
    await db.dropDatabase();
    logger.info('Database dropped successfully');
  } catch (err: any) {
    logger.error('Error while resetting the database:', err?.message || err);
    throw err;
  }
};

export const provisionSampleData = async (): Promise<void> => {
  try {
    logger.debug('Provisioning sample data...');
    
    const usersToEnsure = [
      { firstname: 'Alice', lastname: 'Anderson', username: 'alice', email: 'alice@example.com', password: 'password123' },
      { firstname: 'Bob', lastname: 'Baker', username: 'bob', email: 'bob@example.com', password: 'password123' },
      { firstname: 'Carol', lastname: 'Clark', username: 'carol', email: 'carol@example.com', password: 'password123' },
      { firstname: 'Dave', lastname: 'Dawson', username: 'dave', email: 'dave@example.com', password: 'password123' },
      { firstname: 'Eve', lastname: 'Evans', username: 'eve', email: 'eve@example.com', password: 'password123' },
      { firstname: 'Frank', lastname: 'Foster', username: 'frank', email: 'frank@example.com', password: 'password123' },
    ];
    
    const createdUsers: { [k: string]: any } = {};
    
    for (const u of usersToEnsure) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = new User(u);
        await user.save();
        logger.debug(`Created user: ${u.email}`);
      } else {
        logger.debug(`User exists: ${u.email}`);
      }
      createdUsers[u.username] = user;
    }
    
    const categories = await CategoryModel.find();
    if (!categories || categories.length === 0) {
      logger.debug('No categories found, skipping favorite creation.');
      logger.debug('Provisioning finished.');
      return;
    }
    
    const categoryMap: Record<string, any> = {};
    for (const c of categories) {
      categoryMap[String(c.name)] = c;
    }
    
    const categoryPalettes: Record<string, Array<{ name: string; hex: string }>> = {
      Song: [
        { name: 'dodgerblue', hex: '1E90FF' },
        { name: 'deepskyblue', hex: '00BFFF' },
        { name: 'royalblue', hex: '4169E1' },
        { name: 'steelblue', hex: '4682B4' }
      ],
      Artist: [
        { name: 'orange', hex: 'FFA500' },
        { name: 'darkorange', hex: 'FF8C00' },
        { name: 'coral', hex: 'FF7F50' },
        { name: 'goldenrod', hex: 'DAA520' }
      ],
      Book: [
        { name: 'crimson', hex: 'DC143C' },
        { name: 'firebrick', hex: 'B22222' },
        { name: 'indianred', hex: 'CD5C5C' },
        { name: 'darkred', hex: '8B0000' }
      ],
      Movie: [
        { name: 'seagreen', hex: '2E8B57' },
        { name: 'mediumseagreen', hex: '3CB371' },
        { name: 'forestgreen', hex: '228B22' },
        { name: 'limegreen', hex: '32CD32' }
      ]
    };
    
    const hashString = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0; // convert to 32bit integer
      }
      return Math.abs(h);
    };
    
    const luminance = (hex: string) => {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    };
    
    const contrastTextColorName = (bgHex: string) => {
      const lum = luminance(bgHex);
      return lum > 0.179 ? 'black' : 'white';
    };
    
    const deterministicPaletteColor = (text: string, categoryName: string) => {
      const palette = categoryPalettes[categoryName] || categoryPalettes['Song'];
      const idx = hashString(text) % palette.length;
      return palette[idx];
    };
    
    const placeholderFor = (text: string, categoryName: string) => {
      const entry = deterministicPaletteColor(text, categoryName);
      const txtName = contrastTextColorName(entry.hex);
      return `https://placehold.co/300x300/${entry.name}/${txtName}?text=${encodeURIComponent(text)}`;
    };
    
    const createAndAttachFavorite = async (user: any, catName: string, favName: string, cover?: string) => {
      if (!user) return null;
      const cat = categoryMap[catName];
      if (!cat) return null;
      const exists = await Favorite.findOne({ name: favName, user: user._id });
      if (exists) return exists;
      const fav = new Favorite({ type: cat._id, name: favName, coverArtUrl: cover || placeholderFor(favName, catName), user: user._id });
      await fav.save();
      // ensure the user's favorites array contains this favorite
      user.favorites = user.favorites || [];
      if (!user.favorites.map((id: any) => id.toString()).includes(fav._id.toString())) {
        user.favorites.push(fav._id);
        await user.save();
      }
      logger.debug(`Created favorite '${favName}' for user ${user.username}`);
      return fav;
    };
    
    const alice = createdUsers['alice'];
    const bob = createdUsers['bob'];
    const carol = createdUsers['carol'];
    const dave = createdUsers['dave'];
    const eve = createdUsers['eve'];
    const frank = createdUsers['frank'];
    
    await createAndAttachFavorite(alice, 'Song', 'Bohemian Rhapsody');
    await createAndAttachFavorite(alice, 'Artist', 'Queen');
    
    await createAndAttachFavorite(bob, 'Book', 'To Kill a Mockingbird');
    await createAndAttachFavorite(bob, 'Song', 'Bohemian Rhapsody');
    
    await createAndAttachFavorite(carol, 'Movie', 'Inception');
    await createAndAttachFavorite(carol, 'Artist', 'Nirvana');
    
    await createAndAttachFavorite(dave, 'Song', 'Smells Like Teen Spirit');
    await createAndAttachFavorite(dave, 'Book', '1984');
    
    await createAndAttachFavorite(eve, 'Artist', 'Adele');
    await createAndAttachFavorite(eve, 'Movie', 'The Matrix');
    
    await createAndAttachFavorite(frank, 'Book', 'The Hobbit');
    await createAndAttachFavorite(frank, 'Song', 'Hotel California');
    
    const follow = async (fromUser: any, toUser: any) => {
      if (!fromUser || !toUser) return;
      fromUser.followedUsers = fromUser.followedUsers || [];
      const ids = fromUser.followedUsers.map((id: any) => id.toString());
      if (!ids.includes(toUser._id.toString())) {
        fromUser.followedUsers.push(toUser._id);
        await fromUser.save();
        logger.debug(`${fromUser.username} now follows ${toUser.username}`);
      }
    };
    
    await follow(alice, bob);
    await follow(alice, carol);
    await follow(bob, dave);
    await follow(carol, alice);
    await follow(carol, eve);
    await follow(dave, frank);
    await follow(eve, alice);
    await follow(frank, bob);
    
    logger.debug('Provisioning finished.');
  } catch (err: any) {
    logger.error('Error provisioning sample data:', err?.message || err);
  }
};

