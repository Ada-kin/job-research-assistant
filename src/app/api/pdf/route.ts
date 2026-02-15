import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth-guard';

const schema = z.object({
  html: z.string().min(50).max(900000),
  fileName: z.string().optional()
});

function sanitizeFileName(input?: string): string {
  if (!input) {
    return 'cv.pdf';
  }
  const cleaned = input
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!cleaned) {
    return 'cv.pdf';
  }

  return cleaned.endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

function hasExternalAssets(html: string): boolean {
  return /(src|href)\s*=\s*['"]https?:\/\//i.test(html);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { html, fileName } = schema.parse(await request.json());

    if (hasExternalAssets(html)) {
      return NextResponse.json(
        { error: 'External assets are not allowed in PDF HTML payload.' },
        { status: 400 }
      );
    }

    const gotenbergUrl = (process.env.GOTENBERG_URL || 'http://localhost:3000').replace(/\/$/, '');
    const timeout = Number(process.env.PDF_TIMEOUT_MS || 15000);

    const formData = new FormData();
    formData.append('files', new Blob([html], { type: 'text/html' }), 'index.html');
    formData.append('printBackground', 'true');
    formData.append('paperWidth', '8.27');
    formData.append('paperHeight', '11.69');
    formData.append('marginTop', '0.5');
    formData.append('marginBottom', '0.5');
    formData.append('marginLeft', '0.5');
    formData.append('marginRight', '0.5');

    const response = await fetch(`${gotenbergUrl}/forms/chromium/convert/html`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(timeout)
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'PDF conversion service unavailable.' }, { status: 502 });
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitizeFileName(fileName)}"`
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues[0]?.message }, { status: 400 });
    }

    if (error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'TimeoutError') {
      return NextResponse.json({ error: 'PDF conversion timed out.' }, { status: 504 });
    }

    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
