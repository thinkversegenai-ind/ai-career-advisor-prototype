import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { streaks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Validate session using better-auth
    const session = await auth.api.getSession({
      headers: new Headers({ 'Authorization': `Bearer ${token}` })
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if streak record exists for user
    let streak = await db.select()
      .from(streaks)
      .where(eq(streaks.userId, userId))
      .limit(1);

    if (streak.length === 0) {
      // Create default streak record
      const now = new Date().toISOString();
      const newStreak = await db.insert(streaks)
        .values({
          userId,
          currentStreak: 0,
          lastActiveDate: null,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      streak = newStreak;
    }

    const streakData = streak[0];

    return NextResponse.json({
      data: {
        current_streak: streakData.currentStreak || 0,
        last_active_date: streakData.lastActiveDate
      }
    });

  } catch (error) {
    console.error('GET streak error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Validate session using better-auth
    const session = await auth.api.getSession({
      headers: new Headers({ 'Authorization': `Bearer ${token}` })
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get today's date and yesterday's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if streak record exists for user
    let streak = await db.select()
      .from(streaks)
      .where(eq(streaks.userId, userId))
      .limit(1);

    if (streak.length === 0) {
      // Create new streak record
      const now = new Date().toISOString();
      const newStreak = await db.insert(streaks)
        .values({
          userId,
          currentStreak: 1,
          lastActiveDate: today,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return NextResponse.json({
        data: {
          current_streak: 1,
          last_active_date: today
        }
      });
    }

    const streakData = streak[0];
    const lastActive = streakData.lastActiveDate;
    let newStreakCount = streakData.currentStreak || 0;

    // Determine streak logic based on last active date
    if (!lastActive) {
      // No previous activity
      newStreakCount = 1;
    } else if (lastActive === today) {
      // Already active today, no change needed
      return NextResponse.json({
        data: {
          current_streak: newStreakCount,
          last_active_date: today
        }
      });
    } else if (lastActive === yesterday) {
      // Activity was yesterday, increment streak
      newStreakCount += 1;
    } else {
      // Activity was older than yesterday, reset streak
      newStreakCount = 1;
    }

    // Update the streak record
    const updatedStreak = await db.update(streaks)
      .set({
        currentStreak: newStreakCount,
        lastActiveDate: today,
        updatedAt: new Date().toISOString()
      })
      .where(eq(streaks.userId, userId))
      .returning();

    return NextResponse.json({
      data: {
        current_streak: updatedStreak[0].currentStreak,
        last_active_date: updatedStreak[0].lastActiveDate
      }
    });

  } catch (error) {
    console.error('POST streak error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}