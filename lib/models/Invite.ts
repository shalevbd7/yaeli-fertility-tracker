import mongoose from 'mongoose';

/**
 * Partner invitation. The raw token is never stored, only its SHA-256 hash.
 * Lifecycle: pending → accepted (partner used the link) → approved | rejected,
 * or pending → revoked (owner cancelled / created a newer link).
 */
const InviteSchema = new mongoose.Schema(
  {
    trackerUserId: { type: String, required: true, index: true },
    createdByUserId: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'approved', 'rejected', 'revoked'],
      default: 'pending',
      index: true,
    },
    acceptedByUserId: { type: String },
    acceptedAt: { type: Date },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

export const Invite =
  mongoose.models.Invite || mongoose.model('Invite', InviteSchema);
