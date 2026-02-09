import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserState, persistUserState } from '@/lib/server-state';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = await getUserState(session.user.id);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { state?: unknown };
    if (!payload || typeof payload.state !== 'object' || !payload.state) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await persistUserState(session.user.id, payload.state as Record<string, unknown>);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
