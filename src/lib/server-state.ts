import type { AppState, Language, Tone } from './types';
import type { Prisma } from '@prisma/client';
import { decryptSecret, encryptSecret } from './crypto';
import { prisma } from './prisma';
import { createInitialState, normalizeAppState } from './storage';

interface PersistResult {
  state: AppState;
}

function sanitizeStateForStorage(state: AppState): AppState {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
    settings: {
      ...state.settings,
      openaiApiKey: ''
    }
  };
}

function toPrismaJson(state: AppState): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(state)) as Prisma.InputJsonValue;
}

function mergeWithSettings(state: AppState, settings: {
  defaultLanguage: string;
  defaultTone: string;
  storeApiKey: boolean;
}): AppState {
  return {
    ...state,
    settings: {
      ...state.settings,
      openaiApiKey: '',
      defaultLanguage: (settings.defaultLanguage || 'fr') as Language,
      defaultTone: (settings.defaultTone || 'NEUTRE') as Tone,
      storeApiKey: settings.storeApiKey
    }
  };
}

async function ensureUserSettings(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      defaultLanguage: 'fr',
      defaultTone: 'NEUTRE',
      storeApiKey: false
    },
    update: {}
  });
}

export async function getUserState(userId: string): Promise<AppState> {
  const [snapshot, settings] = await Promise.all([
    prisma.appStateSnapshot.findUnique({ where: { userId } }),
    ensureUserSettings(userId)
  ]);

  if (!snapshot) {
    const initial = createInitialState();
    const sanitized = sanitizeStateForStorage(initial);

    await prisma.appStateSnapshot.create({
      data: {
        userId,
        data: toPrismaJson(sanitized)
      }
    });

    return mergeWithSettings(sanitized, settings);
  }

  const normalized = normalizeAppState(snapshot.data as Partial<AppState>);
  return mergeWithSettings(normalized, settings);
}

export async function persistUserState(userId: string, rawState: Partial<AppState>): Promise<PersistResult> {
  const normalized = normalizeAppState(rawState);

  const existingSettings = await ensureUserSettings(userId);
  const shouldStoreApiKey = Boolean(normalized.settings.storeApiKey);
  const nextKey = normalized.settings.openaiApiKey.trim();

  const updateSettings: {
    defaultLanguage: string;
    defaultTone: string;
    storeApiKey: boolean;
    encryptedOpenAiKey?: string | null;
    openAiKeyIv?: string | null;
    openAiKeyTag?: string | null;
    openAiKeyVersion?: number;
  } = {
    defaultLanguage: normalized.settings.defaultLanguage,
    defaultTone: normalized.settings.defaultTone,
    storeApiKey: shouldStoreApiKey
  };

  if (!shouldStoreApiKey) {
    updateSettings.encryptedOpenAiKey = null;
    updateSettings.openAiKeyIv = null;
    updateSettings.openAiKeyTag = null;
  } else if (nextKey) {
    const encrypted = encryptSecret(nextKey);
    updateSettings.encryptedOpenAiKey = encrypted.ciphertext;
    updateSettings.openAiKeyIv = encrypted.iv;
    updateSettings.openAiKeyTag = encrypted.tag;
    updateSettings.openAiKeyVersion = encrypted.keyVersion;
  } else if (!existingSettings.storeApiKey) {
    updateSettings.encryptedOpenAiKey = null;
    updateSettings.openAiKeyIv = null;
    updateSettings.openAiKeyTag = null;
  }

  await prisma.userSettings.update({
    where: { userId },
    data: updateSettings
  });

  const sanitized = sanitizeStateForStorage({
    ...normalized,
    settings: {
      ...normalized.settings,
      storeApiKey: shouldStoreApiKey,
      openaiApiKey: ''
    }
  });

  await prisma.appStateSnapshot.upsert({
    where: { userId },
    create: {
      userId,
      data: toPrismaJson(sanitized)
    },
    update: {
      data: toPrismaJson(sanitized)
    }
  });

  return { state: sanitized };
}

export async function resolveUserOpenAiApiKey(userId: string, requestApiKey?: string): Promise<string> {
  const provided = requestApiKey?.trim();
  if (provided) {
    return provided;
  }

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings?.storeApiKey || !settings.encryptedOpenAiKey || !settings.openAiKeyIv || !settings.openAiKeyTag) {
    return '';
  }

  try {
    return decryptSecret({
      ciphertext: settings.encryptedOpenAiKey,
      iv: settings.openAiKeyIv,
      tag: settings.openAiKeyTag,
      keyVersion: settings.openAiKeyVersion
    });
  } catch {
    return '';
  }
}
