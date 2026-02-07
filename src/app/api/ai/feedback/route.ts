import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mapOpenAIError, requestFeedback } from '@/lib/openai';

const schema = z.object({
  apiKey: z.string().min(20),
  section: z.enum(['personal', 'profile', 'experiences', 'education', 'skills', 'languages', 'interests']),
  sectionData: z.any(),
  jobContext: z
    .object({
      title: z.string().optional(),
      company: z.string().optional(),
      offerText: z.string().optional()
    })
    .optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const result = await requestFeedback(payload);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues[0]?.message }, { status: 400 });
    }
    const mapped = mapOpenAIError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
