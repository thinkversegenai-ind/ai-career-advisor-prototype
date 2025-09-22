import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Bearer token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = await auth.api.getSession({ headers: { authorization: `Bearer ${token}` } });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if profile exists
    let profile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      // Create default profile
      const now = new Date();
      const newProfile = await db.insert(userProfiles)
        .values({
          userId: userId,
          name: session.user.name || null,
          language: 'en',
          skills: {},
          interests: [],
          profile: {},
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      profile = newProfile;
    }

    return NextResponse.json({ data: profile[0] });

  } catch (error) {
    console.error('GET profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Bearer token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = await auth.api.getSession({ headers: { authorization: `Bearer ${token}` } });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Security: Reject userId in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate inputs
    const updates: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.language !== undefined) {
      if (typeof body.language !== 'string') {
        return NextResponse.json({ error: 'Language must be a string' }, { status: 400 });
      }
      updates.language = body.language.trim();
    }

    if (body.skills !== undefined) {
      if (typeof body.skills !== 'object' || Array.isArray(body.skills)) {
        return NextResponse.json({ error: 'Skills must be an object' }, { status: 400 });
      }
      try {
        JSON.stringify(body.skills);
        updates.skills = body.skills;
      } catch (e) {
        return NextResponse.json({ error: 'Skills must be JSON serializable' }, { status: 400 });
      }
    }

    if (body.interests !== undefined) {
      if (!Array.isArray(body.interests)) {
        return NextResponse.json({ error: 'Interests must be an array' }, { status: 400 });
      }
      try {
        JSON.stringify(body.interests);
        updates.interests = body.interests;
      } catch (e) {
        return NextResponse.json({ error: 'Interests must be JSON serializable' }, { status: 400 });
      }
    }

    if (body.profile !== undefined) {
      if (typeof body.profile !== 'object' || Array.isArray(body.profile)) {
        return NextResponse.json({ error: 'Profile must be an object' }, { status: 400 });
      }
      try {
        JSON.stringify(body.profile);
        updates.profile = body.profile;
      } catch (e) {
        return NextResponse.json({ error: 'Profile must be JSON serializable' }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updatedAt = new Date();

    // Update profile
    const updatedProfile = await db.update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, userId))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedProfile[0] });

  } catch (error) {
    console.error('PUT profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}