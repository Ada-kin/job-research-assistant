import type { CvData } from './types';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function section(title: string, content: string): string {
  if (!content.trim()) {
    return '';
  }
  return `<section class="cv-section"><h2>${title}</h2>${content}</section>`;
}

export function renderCvHtml(cv: CvData): string {
  const contacts = [cv.personal.email, cv.personal.phone, cv.personal.location, cv.personal.website, cv.personal.linkedin, cv.personal.github]
    .filter(Boolean)
    .map((value) => `<span>${esc(value)}</span>`)
    .join('<span class="sep">|</span>');

  const experiencesHtml = cv.experiences
    .map((item) => {
      const highlights = item.highlights.map((h) => `<li>${esc(h)}</li>`).join('');
      return `
        <article class="entry avoid-break">
          <div class="entry-head">
            <strong>${esc(item.role)}</strong>
            <span>${esc(item.startDate)} - ${esc(item.endDate || 'Present')}</span>
          </div>
          <div class="entry-sub">${esc(item.company)}${item.location ? `, ${esc(item.location)}` : ''}</div>
          ${item.description ? `<p>${esc(item.description)}</p>` : ''}
          ${highlights ? `<ul>${highlights}</ul>` : ''}
        </article>
      `;
    })
    .join('');

  const educationHtml = cv.education
    .map(
      (item) => `
        <article class="entry avoid-break">
          <div class="entry-head">
            <strong>${esc(item.degree)}${item.field ? ` - ${esc(item.field)}` : ''}</strong>
            <span>${esc(item.startDate)} - ${esc(item.endDate || 'Present')}</span>
          </div>
          <div class="entry-sub">${esc(item.institution)}</div>
          ${item.description ? `<p>${esc(item.description)}</p>` : ''}
        </article>
      `
    )
    .join('');

  const skillsHtml = cv.skills
    .filter((s) => s.name)
    .map((s) => `<li>${esc(s.name)}${s.level ? ` (${esc(s.level)})` : ''}</li>`)
    .join('');

  const languagesHtml = cv.languages
    .filter((s) => s.name)
    .map((s) => `<li>${esc(s.name)}${s.level ? ` (${esc(s.level)})` : ''}</li>`)
    .join('');

  const interestsHtml = cv.interests.filter((s) => s.name).map((s) => `<li>${esc(s.name)}</li>`).join('');

  const body = `
    <header class="cv-header avoid-break">
      <h1>${esc(cv.personal.fullName || '')}</h1>
      ${cv.personal.title ? `<p class="headline">${esc(cv.personal.title)}</p>` : ''}
      ${contacts ? `<p class="contacts">${contacts}</p>` : ''}
    </header>

    ${section('Profil', cv.profile ? `<p>${esc(cv.profile)}</p>` : '')}
    ${section('Experiences', experiencesHtml)}
    ${section('Formation', educationHtml)}
    ${section('Competences', skillsHtml ? `<ul>${skillsHtml}</ul>` : '')}
    ${section('Langues', languagesHtml ? `<ul>${languagesHtml}</ul>` : '')}
    ${section('Interets', interestsHtml ? `<ul>${interestsHtml}</ul>` : '')}
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
  .entry { margin-bottom: 8px; }
  .entry-head { display: flex; justify-content: space-between; gap: 8px; }
  .entry-sub { color: #444; margin-bottom: 4px; }
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
