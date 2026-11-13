import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Tracker } from '@/lib/models/Tracking';
import { Invite } from '@/lib/models/Invite';
import { isTestAccountEmail } from '@/lib/test-accounts';

export type TrackerRole =
  | 'owner'    // owns the tracker (every existing/seeded user)
  | 'partner'  // approved partner of another user's tracker
  | 'pending'  // partner account waiting for the owner's approval
  | 'none';    // partner account with no linked tracker (rejected / unlinked)

export type AccessUser = {
  id: string;
  email: string;
  name: string;
  trackerUserId: string;
  accountType: 'owner' | 'partner';
  isTestAccount: boolean;
};

export type TrackerAccess = {
  user: AccessUser;
  role: TrackerRole;
  /** The tracker this user may read/write, or null for pending/none. */
  trackerUserId: string | null;
};

type UserLean = {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  trackerUserId: string;
  accountType?: string;
};

function toAccessUser(u: UserLean): AccessUser {
  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name ?? u.email,
    trackerUserId: u.trackerUserId,
    accountType: u.accountType === 'partner' ? 'partner' : 'owner',
    isTestAccount: isTestAccountEmail(u.email),
  };
}

/**
 * Resolves who the caller is and which tracker they may access. This always
 * reads the database (not the JWT), so unlinking takes effect immediately.
 * Sessions issued before this change carry only `trackerUserId`; we fall back
 * to looking the user up by it so nobody is logged out.
 */
export async function getTrackerAccess(): Promise<TrackerAccess | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  await connectDB();

  const sessionUserId = session.user.id;
  let user: UserLean | null = null;
  if (sessionUserId && mongoose.isValidObjectId(sessionUserId)) {
    user = (await User.findById(sessionUserId).lean()) as UserLean | null;
  }
  if (!user && session.user.trackerUserId) {
    user = (await User.findOne({ trackerUserId: session.user.trackerUserId }).lean()) as UserLean | null;
  }
  if (!user) return null;

  const accessUser = toAccessUser(user);

  // Linked as a partner of someone else's tracker?
  const linked = (await Tracker.findOne({ memberUserIds: accessUser.id })
    .select('userId')
    .lean()) as { userId: string } | null;
  if (linked) {
    return { user: accessUser, role: 'partner', trackerUserId: linked.userId };
  }

  if (accessUser.accountType === 'owner') {
    return { user: accessUser, role: 'owner', trackerUserId: accessUser.trackerUserId };
  }

  // Partner account without a link: waiting for approval, or no access.
  const pendingInvite = await Invite.exists({ acceptedByUserId: accessUser.id, status: 'accepted' });
  return { user: accessUser, role: pendingInvite ? 'pending' : 'none', trackerUserId: null };
}

/** Email of the user who owns a tracker (null if no such user record). */
export async function ownerEmailForTracker(trackerUserId: string): Promise<string | null> {
  await connectDB();
  const owner = (await User.findOne({ trackerUserId }).select('email').lean()) as { email: string } | null;
  return owner?.email ?? null;
}
