import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { mapOpenAIError, requestFeedback } from '@/lib/openai';
import { resolveUserOpenAiApiKey } from '@/lib/server-state';

const schema = z.object({
  apiKey: z.string().min(20).optional(),
  section: z.enum(['personal', 'profile', 'experiences', 'education', 'skills', 'languages', 'interests']),
  sectionData: z.unknown(),
  jobContext: z
    .object({
      title: z.string().optional(),
      company: z.string().optional(),
      offerText: z.string().optional()
    })
    .optional()
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = schema.parse(await request.json());
    const apiKey = await resolveUserOpenAiApiKey(session.user.id, payload.apiKey);
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key missing. Save it in settings.' }, { status: 400 });
    }

    const result = await requestFeedback({
      apiKey,
      section: payload.section,
      sectionData: payload.sectionData,
      jobContext: payload.jobContext
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues[0]?.message }, { status: 400 });
    }
    const mapped = mapOpenAIError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
