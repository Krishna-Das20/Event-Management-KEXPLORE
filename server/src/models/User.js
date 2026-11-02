import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatar: String,
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);

export const toUserDTO = (u) =>
  u && { id: String(u._id), name: u.name, email: u.email, avatar: u.avatar, memberSince: u.createdAt };
