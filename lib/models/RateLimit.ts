import mongoose from 'mongoose';

/** Fixed-window counters; MongoDB deletes each bucket after it expires (TTL index). */
const RateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const RateLimit =
  mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
