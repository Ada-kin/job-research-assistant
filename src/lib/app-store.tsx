'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction, ReactNode } from 'react';
import type { AppState } from './types';
import { createInitialState, loadState, persistState } from './storage';

interface AppStoreContextValue {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  ready: boolean;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Chargement...');

  useEffect(() => {
    if (window.location.pathname === '/login') {
      setReady(true);
      setStatus('Pret.');
      return;
    }

    let active = true;

    loadState().then((nextState) => {
      if (!active) {
        return;
      }
      setState(nextState);
      setReady(true);
      setStatus('Pret.');
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (window.location.pathname === '/login') {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        await persistState(state);
        setStatus(`Sauvegarde: ${new Date().toLocaleTimeString()}`);
      } catch {
        setStatus('Erreur de sauvegarde.');
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [state, ready]);

  const value = useMemo(() => ({ state, setState, ready, status, setStatus }), [state, ready, status]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return ctx;
}
