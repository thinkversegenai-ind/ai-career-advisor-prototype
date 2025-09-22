import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recommendations } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { careers, resources } = body;

    // SECURITY: Reject if userId provided in body
    if ('userId' in body || 'user_id' in body || 'userID' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate careers array
    if (!Array.isArray(careers)) {
      return NextResponse.json({ 
        error: "Careers must be an array",
        code: "INVALID_CAREERS" 
      }, { status: 400 });
    }

    // Validate each career object
    for (const career of careers) {
      if (
        !career ||
        typeof career !== 'object' ||
        typeof career.id !== 'string' ||
        typeof career.title !== 'string' ||
        typeof career.summary !== 'string' ||
        typeof career.match !== 'string'
      ) {
        return NextResponse.json({ 
          error: "Each career must have valid id, title, summary, and match fields",
          code: "INVALID_CAREER_FORMAT" 
        }, { status: 400 });
      }
    }

    // Validate resources array
    if (!Array.isArray(resources)) {
      return NextResponse.json({ 
        error: "Resources must be an array",
        code: "INVALID_RESOURCES" 
      }, { status: 400 });
    }

    // Validate each resource object
    for (const resource of resources) {
      if (
        !resource ||
        typeof resource !== 'object' ||
        typeof resource.id !== 'string' ||
        typeof resource.title !== 'string' ||
        typeof resource.url !== 'string' ||
        typeof resource.type !== 'string'
      ) {
        return NextResponse.json({ 
          error: "Each resource must have valid id, title, url, and type fields",
          code: "INVALID_RESOURCE_FORMAT" 
        }, { status: 400 });
      }
    }

    // Serialize JSON data
    const careersJson = JSON.stringify(careers);
    const resourcesJson = JSON.stringify(resources);
    const now = new Date();

    // Check if user has existing recommendation
    const existingRecommendation = await db
      .select()
      .from(recommendations)
      .where(and(eq(recommendations.userId, user.id)));

    let result;

    if (existingRecommendation.length > 0) {
      // Update existing recommendation
      const updated = await db
        .update(recommendations)
        .set({
          careers: careersJson,
          resources: resourcesJson,
          updatedAt: now,
        })
        .where(eq(recommendations.userId, user.id))
        .returning();

      result = updated[0];
    } else {
      // Create new recommendation
      const created = await db
        .insert(recommendations)
        .values({
          userId: user.id,
          careers: careersJson,
          resources: resourcesJson,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      result = created[0];
    }

    // Parse JSON fields for response
    const responseData = {
      ...result,
      careers: JSON.parse(result.careers),
      resources: JSON.parse(result.resources),
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('POST recommendations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get latest recommendation for user
    const recommendation = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, user.id))
      .orderBy(desc(recommendations.createdAt))
      .limit(1);

    if (recommendation.length === 0) {
      return NextResponse.json({ data: null });
    }

    // Parse JSON fields for response
    const responseData = {
      ...recommendation[0],
      careers: JSON.parse(recommendation[0].careers),
      resources: JSON.parse(recommendation[0].resources),
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('GET recommendations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}