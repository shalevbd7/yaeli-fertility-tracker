import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';

async function getTrackerUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.trackerUserId ?? null;
}

export async function GET() {
  try {
    const userId = await getTrackerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const data = await Tracker.findOne({ userId }).lean();

    if (!data) {
      return NextResponse.json(null);
    }

    const completedTasks =
      data.completedTasks instanceof Map
        ? Object.fromEntries(data.completedTasks)
        : (data.completedTasks ?? {});

    return NextResponse.json({
      hasActiveCycle: data.hasActiveCycle ?? false,
      cycleStartDate: data.cycleStartDate ?? null,
      stages: data.stages ?? [],
      medications: data.medications ?? [],
      completedTasks,
    });
  } catch (error) {
    console.error('GET /api/tracker failed:', error);
    return NextResponse.json(
      { error: 'Failed to load tracker data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getTrackerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    const update = {
      userId,
      hasActiveCycle: Boolean(body.hasActiveCycle),
      cycleStartDate: body.cycleStartDate ? new Date(body.cycleStartDate) : null,
      stages: Array.isArray(body.stages) ? body.stages : [],
      medications: Array.isArray(body.medications) ? body.medications : [],
      completedTasks: body.completedTasks ?? {},
    };

    const updated = await Tracker.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true, lean: true }
    );

    const completedTasks =
      updated.completedTasks instanceof Map
        ? Object.fromEntries(updated.completedTasks)
        : (updated.completedTasks ?? {});

    return NextResponse.json({
      hasActiveCycle: updated.hasActiveCycle ?? false,
      cycleStartDate: updated.cycleStartDate ?? null,
      stages: updated.stages ?? [],
      medications: updated.medications ?? [],
      completedTasks,
    });
  } catch (error) {
    console.error('POST /api/tracker failed:', error);
    return NextResponse.json(
      { error: 'Failed to save tracker data' },
      { status: 500 }
    );
  }
}
