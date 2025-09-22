import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ratings, resources } from '@/db/schema';
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

    const ratingsData = await db
      .select({
        id: ratings.id,
        userId: ratings.userId,
        resourceId: ratings.resourceId,
        rating: ratings.rating,
        comment: ratings.comment,
        createdAt: ratings.createdAt,
        updatedAt: ratings.updatedAt,
        resource: {
          id: resources.id,
          title: resources.title,
          url: resources.url,
          type: resources.type,
          tags: resources.tags,
        }
      })
      .from(ratings)
      .innerJoin(resources, eq(ratings.resourceId, resources.id))
      .where(eq(ratings.userId, user.id))
      .orderBy(desc(ratings.updatedAt));

    return NextResponse.json({ data: ratingsData });
  } catch (error) {
    console.error('GET ratings error:', error);
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
    const { resourceId, rating, comment } = body;

    // SECURITY: reject userId injection attempts
    const bodyKeys = Object.keys(body);
    if (bodyKeys.some(key => ['userId', 'user_id', 'authorId'].includes(key))) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validation
    if (!resourceId || isNaN(parseInt(resourceId))) {
      return NextResponse.json({ 
        error: "Valid resourceId is required",
        code: "MISSING_RESOURCE_ID" 
      }, { status: 400 });
    }

    if (rating === undefined || rating === null) {
      return NextResponse.json({ 
        error: "Rating is required",
        code: "MISSING_RATING" 
      }, { status: 400 });
    }

    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ 
        error: "Rating must be an integer between 1 and 5",
        code: "INVALID_RATING" 
      }, { status: 400 });
    }

    const validComment = typeof comment === 'string' ? comment.trim() : undefined;

    // Check if rating exists
    const existingRating = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, user.id), eq(ratings.resourceId, parseInt(resourceId))))
      .limit(1);

    const timestamp = new Date().toISOString();

    let result;

    if (existingRating.length > 0) {
      // Update existing rating
      const [updated] = await db
        .update(ratings)
        .set({
          rating: ratingNum,
          comment: validComment,
          updatedAt: timestamp
        })
        .where(and(eq(ratings.userId, user.id), eq(ratings.resourceId, parseInt(resourceId))))
        .returning();

      result = updated;
    } else {
      // Create new rating
      const [created] = await db
        .insert(ratings)
        .values({
          userId: user.id,
          resourceId: parseInt(resourceId),
          rating: ratingNum,
          comment: validComment,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .returning();

      result = created;
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('POST rating error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}