import { NextResponse } from 'next/server';
import { getTrackerAccess } from '@/lib/access';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';
import { User } from '@/lib/models/User';
import { Invite } from '@/lib/models/Invite';
import { describeInviteForOwner } from '@/lib/invites';

type UserLean = { _id: { toString(): string }; name?: string; email: string };

/**
 * Who am I, what is my role, and (for the owner) the partner link status,
 * pending join requests and the current invite. Polled by the app (~60s)
 * to show the pending-requests badge.
 */
export async function GET() {
  try {
    const access = await getTrackerAccess();
    if (!access) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    const body: Record<string, unknown> = {
      user: { name: access.user.name, email: access.user.email },
      role: access.role,
      isTestAccount: access.user.isTestAccount,
      partner: null,
      owner: null,
      pendingRequests: [],
      invite: null,
    };

    if (access.role === 'owner' && access.trackerUserId) {
      const tracker = (await Tracker.findOne({ userId: access.trackerUserId })
        .select('memberUserIds')
        .lean()) as { memberUserIds?: string[] } | null;
      const partnerId = tracker?.memberUserIds?.[0];
      if (partnerId) {
        const partner = (await User.findById(partnerId).select('name email').lean()) as UserLean | null;
        if (partner) {
          body.partner = { name: partner.name ?? partner.email, email: partner.email };
        }
      }

      const requests = (await Invite.find({ trackerUserId: access.trackerUserId, status: 'accepted' })
        .sort({ acceptedAt: 1 })
        .lean()) as Array<{ _id: { toString(): string }; acceptedByUserId?: string; acceptedAt?: Date }>;
      const requesterIds = requests.map((r) => r.acceptedByUserId).filter(Boolean);
      const requesters = (await User.find({ _id: { $in: requesterIds } })
        .select('name email')
        .lean()) as UserLean[];
      const byId = new Map(requesters.map((u) => [u._id.toString(), u]));
      body.pendingRequests = requests.flatMap((r) => {
        const u = r.acceptedByUserId ? byId.get(r.acceptedByUserId) : undefined;
        if (!u) return [];
        return [{ id: r._id.toString(), name: u.name ?? u.email, email: u.email, requestedAt: r.acceptedAt ?? null }];
      });

      const latestInvite = (await Invite.findOne({ trackerUserId: access.trackerUserId, status: 'pending' })
        .sort({ createdAt: -1 })
        .lean()) as { status: string; expiresAt: Date } | null;
      const state = describeInviteForOwner(latestInvite);
      body.invite = state === 'none' ? null : { state, expiresAt: latestInvite?.expiresAt ?? null };
    }

    if (access.role === 'partner' && access.trackerUserId) {
      const owner = (await User.findOne({ trackerUserId: access.trackerUserId })
        .select('name email')
        .lean()) as UserLean | null;
      body.owner = owner ? { name: owner.name ?? owner.email } : { name: '' };
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error('GET /api/me failed:', error);
    return NextResponse.json({ error: 'Failed to load account' }, { status: 500 });
  }
}
