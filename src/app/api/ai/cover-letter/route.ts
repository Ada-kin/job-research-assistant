import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mapOpenAIError, requestCoverLetter } from '@/lib/openai';

const schema = z.object({
  apiKey: z.string().min(20),
  cvData: z.record(z.any()),
  offerText: z.string().min(20).max(100000),
  tone: z.enum(['NEUTRE', 'FORMELLE', 'DYNAMIQUE']),
  language: z.enum(['fr', 'en'])
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const result = await requestCoverLetter(payload);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues[0]?.message }, { status: 400 });
    }
    const mapped = mapOpenAIError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
