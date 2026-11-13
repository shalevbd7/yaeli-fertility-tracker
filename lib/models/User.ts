import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    trackerUserId: {
      type: String,
      required: true,
      unique: true,
    },
    // Added for partner linking. Existing users have no value → treated as 'owner'.
    // 'partner' = signed up through an invite link (never owns a tracker).
    accountType: {
      type: String,
      enum: ['owner', 'partner'],
      default: 'owner',
    },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model('User', UserSchema);
