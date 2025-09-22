import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { progress, resources } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const session = await auth.api.getSession({ headers: { authorization: `Bearer ${token}` } });
    if (!session?.user) {
      return null;
    }
    return session.user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const progressEntries = await db
      .select({
        id: progress.id,
        userId: progress.userId,
        resourceId: progress.resourceId,
        completion: progress.completion,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
        resource: {
          id: resources.id,
          title: resources.title,
          url: resources.url,
          type: resources.type,
          tags: resources.tags,
          locale: resources.locale
        }
      })
      .from(progress)
      .leftJoin(resources, eq(progress.resourceId, resources.id))
      .where(eq(progress.userId, user.id))
      .orderBy(desc(progress.updatedAt));

    return NextResponse.json({ data: progressEntries });
  } catch (error) {
    console.error('GET progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED'
      }, { status: 400 });
    }

    const { resourceId, completion } = body;

    // Validation
    if (!resourceId || typeof resourceId !== 'number') {
      return NextResponse.json({
        error: 'Valid resourceId is required',
        code: 'MISSING_RESOURCE_ID'
      }, { status: 400 });
    }

    if (typeof completion !== 'number' || completion < 0 || completion > 100) {
      return NextResponse.json({
        error: 'Completion must be a number between 0 and 100',
        code: 'INVALID_COMPLETION'
      }, { status: 400 });
    }

    // Check if progress entry exists for user + resourceId
    const existingProgress = await db
      .select()
      .from(progress)
      .where(and(eq(progress.userId, user.id), eq(progress.resourceId, resourceId)))
      .limit(1);

    let result;
    const now = new Date().toISOString();

    if (existingProgress.length > 0) {
      // Update existing progress
      result = await db
        .update(progress)
        .set({
          completion,
          updatedAt: now
        })
        .where(and(eq(progress.userId, user.id), eq(progress.resourceId, resourceId)))
        .returning();
    } else {
      // Create new progress entry
      result = await db
        .insert(progress)
        .values({
          userId: user.id,
          resourceId,
          completion,
          createdAt: now,
          updatedAt: now
        })
        .returning();
    }

    return NextResponse.json({ data: result[0] });
  } catch (error) {
    console.error('POST progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}