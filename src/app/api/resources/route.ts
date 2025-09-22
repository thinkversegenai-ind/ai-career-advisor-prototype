import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resources } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, like, and, desc } from 'drizzle-orm';

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

    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const locale = searchParams.get('locale');
    const type = searchParams.get('type');
    const limitStr = searchParams.get('limit');
    const offsetStr = searchParams.get('offset');

    // Validate query parameters
    const limit = limitStr ? Math.min(parseInt(limitStr), 100) : 50;
    const offset = offsetStr ? parseInt(offsetStr) : 0;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ error: 'Invalid offset parameter' }, { status: 400 });
    }

    if (type && !['course', 'video', 'article', 'book'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    let query = db.select().from(resources);
    const conditions: any[] = [];

    if (tag) {
      conditions.push(like(resources.tags, `%${tag}%`));
    }

    if (locale) {
      conditions.push(eq(resources.locale, locale));
    }

    if (type) {
      conditions.push(eq(resources.type, type));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(resources.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: results });

  } catch (error) {
    console.error('GET resources error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}