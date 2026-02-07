const OPENAI_URL = 'https://api.openai.com/v1/responses';

export class OpenAIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface OpenAIResponse {
  output_text?: string;
}

async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 20000);

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }]
        }
      ]
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => 'OpenAI request failed');
    throw new OpenAIError(detail.slice(0, 500), response.status);
  }

  const payload = (await response.json()) as OpenAIResponse;
  if (!payload.output_text || !payload.output_text.trim()) {
    throw new OpenAIError('Empty response from OpenAI.', 502);
  }

  return payload.output_text.trim();
}

export async function requestFeedback(args: {
  apiKey: string;
  section: string;
  sectionData: unknown;
  jobContext?: { title?: string; company?: string; offerText?: string };
}): Promise<{ feedback: string; suggestedRewrite?: string }> {
  const systemPrompt =
    'You are a senior CV reviewer. Reply in French. Be concise, concrete, and avoid inventing facts.';

  const userPrompt = `Analyze this CV section and provide JSON only with keys: feedback (string), suggestedRewrite (string, optional).
Section: ${args.section}
Section data: ${JSON.stringify(args.sectionData)}
Job context: ${JSON.stringify(args.jobContext || {})}`;

  const raw = await callOpenAI(args.apiKey, systemPrompt, userPrompt);
  try {
    const parsed = JSON.parse(raw) as { feedback?: string; suggestedRewrite?: string };
    return {
      feedback: parsed.feedback?.trim() || raw,
      suggestedRewrite: parsed.suggestedRewrite?.trim() || undefined
    };
  } catch {
    return { feedback: raw };
  }
}

export async function requestCvOptimization(args: {
  apiKey: string;
  cvData: unknown;
  offerText: string;
  targetRole?: string;
}): Promise<{
  alignmentScore: number;
  strengths: string[];
  gaps: string[];
  sectionRecommendations: Array<{ section: string; actions: string[]; rewrite?: string }>;
}> {
  const systemPrompt =
    'You are a hiring coach. Reply in French. Return strict JSON only and do not invent candidate experience.';

  const userPrompt = `Optimize this CV against the job offer and return JSON with keys: alignmentScore(number 0-100), strengths(string[]), gaps(string[]), sectionRecommendations([{section,actions,rewrite?}]).
Target role: ${args.targetRole || ''}
CV data: ${JSON.stringify(args.cvData)}
Offer text: ${args.offerText}`;

  const raw = await callOpenAI(args.apiKey, systemPrompt, userPrompt);
  try {
    const parsed = JSON.parse(raw) as {
      alignmentScore?: number;
      strengths?: string[];
      gaps?: string[];
      sectionRecommendations?: Array<{ section?: string; actions?: string[]; rewrite?: string }>;
    };

    const sectionRecommendations = (parsed.sectionRecommendations || [])
      .filter((entry) => entry.section)
      .map((entry) => ({
        section: String(entry.section),
        actions: Array.isArray(entry.actions) ? entry.actions.map((x) => String(x)) : [],
        rewrite: entry.rewrite ? String(entry.rewrite) : undefined
      }));

    return {
      alignmentScore: Number.isFinite(parsed.alignmentScore) ? Math.max(0, Math.min(100, Number(parsed.alignmentScore))) : 0,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((x) => String(x)) : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map((x) => String(x)) : [],
      sectionRecommendations
    };
  } catch {
    return {
      alignmentScore: 0,
      strengths: [],
      gaps: [],
      sectionRecommendations: [{ section: 'profile', actions: [raw] }]
    };
  }
}

export async function requestCoverLetter(args: {
  apiKey: string;
  cvData: unknown;
  offerText: string;
  tone: string;
  language: string;
}): Promise<{ letter: string }> {
  const systemPrompt =
    'You are a professional cover letter writer. Do not invent facts. Keep a realistic and concise style.';

  const userPrompt = `Write a cover letter in ${args.language} with tone ${args.tone}. Return plain text only.
CV data: ${JSON.stringify(args.cvData)}
Offer text: ${args.offerText}`;

  const letter = await callOpenAI(args.apiKey, systemPrompt, userPrompt);
  return { letter };
}

export function mapOpenAIError(error: unknown): { status: number; message: string } {
  if (error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'TimeoutError') {
    return { status: 504, message: 'AI request timed out.' };
  }

  if (error instanceof OpenAIError) {
    if (error.status === 401 || error.status === 403) {
      return { status: 401, message: 'Invalid OpenAI API key.' };
    }
    if (error.status === 429) {
      return { status: 429, message: 'OpenAI rate limit reached.' };
    }
    return { status: 502, message: 'AI provider error.' };
  }

  return { status: 500, message: 'Internal server error.' };
}
