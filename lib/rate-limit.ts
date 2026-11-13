import { connectDB } from '@/lib/mongodb';
import { RateLimit } from '@/lib/models/RateLimit';
import { rateLimitBucket, type RateLimitRule } from '@/lib/rate-limit-core';

/**
 * Counts one attempt and returns whether it is allowed. Stored in MongoDB
 * because in-memory counters don't survive across serverless instances.
 * If the limiter itself fails we allow the request (and log), so an outage
 * of this collection can't lock the real user out.
 */
export async function consumeRateLimit(rule: RateLimitRule, subject: string): Promise<boolean> {
  try {
    await connectDB();
    const { key, expiresAt } = rateLimitBucket(rule, subject.toLowerCase(), Date.now());
    const doc = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true, lean: true }
    );
    return (doc?.count ?? 0) <= rule.limit;
  } catch (err) {
    console.error('Rate limiter failed (allowing request):', err);
    return true;
  }
}
