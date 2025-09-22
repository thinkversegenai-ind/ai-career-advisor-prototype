import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { assessments, userProfiles } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session from token in Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Bearer token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = await auth.api.getSession({ headers: { authorization: `Bearer ${token}` } });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = session.user.id;

    // Validate request body
    const body = await request.json();
    
    // SECURITY: Reject if userId is provided in request body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate answers
    if (!body.answers || (typeof body.answers !== 'object' && !Array.isArray(body.answers))) {
      return NextResponse.json({ 
        error: "Valid answers are required",
        code: "MISSING_ANSWERS" 
      }, { status: 400 });
    }

    // Validate result
    if (!body.result || typeof body.result !== 'object') {
      return NextResponse.json({ 
        error: "Valid result object is required",
        code: "MISSING_RESULT" 
      }, { status: 400 });
    }

    const result = body.result;
    if (!result.strengths || !Array.isArray(result.strengths) ||
        !result.weaknesses || !Array.isArray(result.weaknesses) ||
        !result.scores || typeof result.scores !== 'object') {
      return NextResponse.json({ 
        error: "Result must contain strengths array, weaknesses array, and scores object",
        code: "INVALID_RESULT_STRUCTURE" 
      }, { status: 400 });
    }

    // Ensure JSON fields are serializable
    let answersJson, resultJson;
    try {
      answersJson = JSON.stringify(body.answers);
      resultJson = JSON.stringify(result);
      // Test they're valid JSON by parsing back
      JSON.parse(answersJson);
      JSON.parse(resultJson);
    } catch (jsonError) {
      return NextResponse.json({ 
        error: "Invalid JSON data provided",
        code: "INVALID_JSON" 
      }, { status: 400 });
    }

    // Create assessment
    const newAssessment = await db.insert(assessments)
      .values({
        userId: userId,
        answers: body.answers,
        result: result,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // Update user profile with result data
    const userProfile = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const profileData = {
      profile: result,
      skills: result.scores,
      updatedAt: new Date().toISOString()
    };

    if (userProfile.length === 0) {
      // Create new profile
      await db.insert(userProfiles).values({
        userId: userId,
        ...profileData
      });
    } else {
      // Update existing profile
      await db.update(userProfiles)
        .set(profileData)
        .where(eq(userProfiles.userId, userId));
    }

    return NextResponse.json({ data: newAssessment[0] }, { status: 201 });

  } catch (error) {
    console.error('POST /api/assessments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session from token in Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Bearer token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = await auth.api.getSession({ headers: { authorization: `Bearer ${token}` } });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's assessments ordered by createdAt DESC
    const assessmentsList = await db.select()
      .from(assessments)
      .where(eq(assessments.userId, userId))
      .orderBy(desc(assessments.createdAt));

    return NextResponse.json({ data: assessmentsList });

  } catch (error) {
    console.error('GET /api/assessments error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}