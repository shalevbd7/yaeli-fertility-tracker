import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';

/**
 * One-time user seeding endpoint.
 * Requires header: x-seed-secret: <SEED_SECRET from .env.local>
 *
 * Example:
 * curl -X POST http://localhost:3000/api/admin/seed-user \
 *   -H "Content-Type: application/json" \
 *   -H "x-seed-secret: YOUR_SEED_SECRET" \
 *   -d '{"email":"yaeli@example.com","password":"YourSecurePassword123","name":"Yaeli","trackerUserId":"yaeli-1"}'
 */
export async function POST(request: Request) {
  try {
    const seedSecret = process.env.SEED_SECRET;
    if (!seedSecret) {
      return NextResponse.json(
        { error: 'SEED_SECRET is not configured on the server' },
        { status: 500 }
      );
    }

    const providedSecret = request.headers.get('x-seed-secret');
    if (providedSecret !== seedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const trackerUserId =
      typeof body.trackerUserId === 'string' ? body.trackerUserId.trim() : 'yaeli-1';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      passwordHash,
      name: name || email,
      trackerUserId,
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          trackerUserId: user.trackerUserId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/seed-user failed:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
