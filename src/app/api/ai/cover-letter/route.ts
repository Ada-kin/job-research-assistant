import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { mapOpenAIError, requestCoverLetter } from '@/lib/openai';
import { resolveUserOpenAiApiKey } from '@/lib/server-state';

const schema = z.object({
  apiKey: z.string().min(20).optional(),
  cvData: z.record(z.any()),
  offerText: z.string().min(20).max(100000),
  tone: z.enum(['NEUTRE', 'FORMELLE', 'DYNAMIQUE']),
  language: z.enum(['fr', 'en'])
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

    const result = await requestCoverLetter({
      apiKey,
      cvData: payload.cvData,
      offerText: payload.offerText,
      tone: payload.tone,
      language: payload.language
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
