import type { CvData } from './types';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function listFromLines(raw: string): string {
  const items = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<li>${esc(line)}</li>`)
    .join('');

  return items ? `<ul>${items}</ul>` : '';
}

export function renderCvHtml(cv: CvData): string {
  const contacts = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.website, cv.personal.linkedin, cv.personal.github]
    .filter(Boolean)
    .map((value) => `<span>${esc(value)}</span>`)
    .join('<span class="sep">|</span>');

  const section = (title: string, body: string) => {
    if (!body.trim()) {
      return '';
    }
    return `<section class="cv-section"><h2>${title}</h2>${body}</section>`;
  };

  const body = `
    <header class="cv-header avoid-break">
      <h1>${esc(cv.personal.fullName || '')}</h1>
      ${cv.personal.title ? `<p class="headline">${esc(cv.personal.title)}</p>` : ''}
      ${contacts ? `<p class="contacts">${contacts}</p>` : ''}
    </header>
    ${section('Profil', `<p>${esc(cv.profile)}</p>`)}
    ${section('Experiences', listFromLines(cv.experiences))}
    ${section('Formation', listFromLines(cv.education))}
    ${section('Competences', listFromLines(cv.skills))}
    ${section('Langues', listFromLines(cv.languages))}
    ${section('Interets', listFromLines(cv.interests))}
  `;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CV</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; font-size: 11px; line-height: 1.45; }
  h1,h2,p { margin: 0; }
  .page { width: 186mm; margin: 0 auto; }
  .cv-header { margin-bottom: 12px; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 13px; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .headline { font-size: 14px; margin-bottom: 4px; }
  .contacts { color: #444; word-break: break-word; }
  .sep { margin: 0 6px; color: #999; }
  .cv-section { margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
  ul { margin: 4px 0 0 16px; padding: 0; }
  li { margin-bottom: 2px; }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body>
  <main class="page">${body}</main>
</body>
</html>`;
}
