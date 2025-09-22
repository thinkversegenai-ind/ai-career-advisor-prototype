import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, user } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

function isToday(dateString: string): boolean {
  const today = new Date();
  const taskDate = new Date(dateString);
  return today.getFullYear() === taskDate.getFullYear() &&
         today.getMonth() === taskDate.getMonth() &&
         today.getDate() === taskDate.getDate();
}

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

    const { searchParams } = new URL(request.url);
    const dueDate = searchParams.get('due_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select()
      .from(tasks)
      .where(eq(tasks.userId, user.id))
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    const tasksData = await query;
    let filteredTasks = tasksData;

    if (dueDate === 'today') {
      const today = new Date();
      const todayISO = today.toISOString().split('T')[0];
      filteredTasks = tasksData.filter(task => task.dueDate === todayISO);
    }

    return NextResponse.json({ data: filteredTasks });
  } catch (error) {
    console.error('GET tasks error:', error);
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
    
    let tasksToCreate = Array.isArray(body) ? body : [body];
    
    if (tasksToCreate.length === 0) {
      return NextResponse.json({ error: 'No tasks provided' }, { status: 400 });
    }

    const validatedTasks = tasksToCreate.map(taskData => {
      if (!taskData.label || typeof taskData.label !== 'string' || taskData.label.trim() === '') {
        throw new Error('Label is required and must be a non-empty string');
      }
      
      if (taskData.skill !== undefined && typeof taskData.skill !== 'string') {
        throw new Error('Skill must be a string if provided');
      }
      
      if (taskData.done !== undefined && typeof taskData.done !== 'boolean') {
        throw new Error('Done must be a boolean if provided');
      }
      
      if (taskData.dueDate !== undefined) {
        if (typeof taskData.dueDate !== 'string' || !isValidISODate(taskData.dueDate)) {
          throw new Error('Due date must be a valid ISO date string (YYYY-MM-DD)');
        }
      }
      
      return {
        userId: user.id,
        label: taskData.label.trim(),
        skill: taskData.skill?.trim() || null,
        done: taskData.done || false,
        dueDate: taskData.dueDate || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const createdTasks = await db.insert(tasks)
      .values(validatedTasks)
      .returning();

    return NextResponse.json({ data: Array.isArray(body) ? createdTasks : createdTasks[0] }, { status: 201 });
  } catch (error) {
    console.error('POST tasks error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid task ID is required in query params' }, { status: 400 });
    }

    const body = await request.json();
    const updates: any = {};

    if (body.label !== undefined) {
      if (typeof body.label !== 'string' || body.label.trim() === '') {
        return NextResponse.json({ error: 'Label must be a non-empty string' }, { status: 400 });
      }
      updates.label = body.label.trim();
    }

    if (body.skill !== undefined) {
      if (typeof body.skill !== 'string') {
        return NextResponse.json({ error: 'Skill must be a string' }, { status: 400 });
      }
      updates.skill = body.skill.trim();
    }

    if (body.done !== undefined) {
      if (typeof body.done !== 'boolean') {
        return NextResponse.json({ error: 'Done must be a boolean' }, { status: 400 });
      }
      updates.done = body.done;
    }

    if (body.dueDate !== undefined) {
      if (typeof body.dueDate !== 'string' || !isValidISODate(body.dueDate)) {
        return NextResponse.json({ error: 'Due date must be a valid ISO date string (YYYY-MM-DD)' }, { status: 400 });
      }
      updates.dueDate = body.dueDate;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const task = await db.update(tasks)
      .set(updates)
      .where(and(eq(tasks.id, parseInt(id)), eq(tasks.userId, user.id)))
      .returning();

    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found or not owned by user' }, { status: 404 });
    }

    return NextResponse.json({ data: task[0] });
  } catch (error) {
    console.error('PATCH tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Valid task ID is required in query params' }, { status: 400 });
    }

    const task = await db.delete(tasks)
      .where(and(eq(tasks.id, parseInt(id)), eq(tasks.userId, user.id)))
      .returning();

    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found or not owned by user' }, { status: 404 });
    }

    return NextResponse.json({ data: task[0] });
  } catch (error) {
    console.error('DELETE tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}