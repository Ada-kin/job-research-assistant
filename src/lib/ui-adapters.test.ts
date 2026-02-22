import assert from 'node:assert/strict';
import test from 'node:test';
import { fromUiStatus, patchCvVersionFromUi, toUiCvVersion, withArchivedLabel } from '@/lib/ui-adapters';
import type { CvVersion } from '@/lib/types';

test('status mapping keeps expected backend values', () => {
  assert.equal(fromUiStatus('applied'), 'POSTULE');
  assert.equal(fromUiStatus('interview'), 'ENTRETIEN_PREVU');
  assert.equal(fromUiStatus('offer'), 'OFFRE_RECUE');
  assert.equal(fromUiStatus('rejected'), 'DECLINE');
});

test('archive label toggles prefix', () => {
  const base = 'Backend';
  assert.equal(withArchivedLabel(base, true), '[ARCHIVED] Backend');
  assert.equal(withArchivedLabel('[ARCHIVED] Backend', false), 'Backend');
});

test('cv adapter round-trip preserves key fields', () => {
  const source: CvVersion = {
    id: 'v1',
    label: 'Test CV',
    createdAt: '2026-01-01T00:00:00.000Z',
    aiFeedback: {
      personal: '',
      profile: '',
      experiences: '',
      education: '',
      skills: '',
      languages: '',
      interests: ''
    },
    data: {
      personal: {
        fullName: 'A',
        title: 'B',
        email: 'a@b.com',
        phone: '1',
        location: 'Paris',
        website: 'w',
        linkedin: 'l',
        github: 'g'
      },
      profile: 'summary',
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      interests: []
    }
  };

  const ui = toUiCvVersion(source);
  const patched = patchCvVersionFromUi(source, { ...ui, title: 'Updated', status: 'archived' });

  assert.equal(patched.data.personal.fullName, 'A');
  assert.equal(patched.data.profile, 'summary');
  assert.equal(patched.label, '[ARCHIVED] Updated');
});
