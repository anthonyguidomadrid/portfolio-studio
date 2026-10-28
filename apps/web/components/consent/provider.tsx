"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CONSENT_STORAGE_KEY,
  OPTIONAL_DISABLED,
  consentExpiresAt,
  createConsent,
  parseConsent,
  type ConsentChoices,
  type ConsentRecord,
} from "@/lib/consent";
import { disableAnalytics } from "@/lib/analytics";

interface ConsentContextValue {
  ready: boolean;
  choices: ConsentChoices;
  record: ConsentRecord | null;
  settingsOpen: boolean;
  storageError: boolean;
  savePreferences: (choices: ConsentChoices) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  ready: false,
  choices: OPTIONAL_DISABLED,
  record: null,
  settingsOpen: false,
  storageError: false,
  savePreferences: () => {},
  openSettings: () => {},
  closeSettings: () => {},
});

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const currentRecord = useRef<ConsentRecord | null>(null);
  const volatileRecord = useRef(false);

  useEffect(() => {
    function refresh() {
      let saved: ConsentRecord | null = null;
      try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        saved = parseConsent(
          volatileRecord.current
            ? JSON.stringify(currentRecord.current)
            : stored,
        );
        if (!volatileRecord.current) setStorageError(false);
      } catch {
        saved = parseConsent(JSON.stringify(currentRecord.current));
        setStorageError(true);
      }
      if (!saved?.analytics) disableAnalytics();
      currentRecord.current = saved;
      setRecord(saved);
      setReady(true);
    }
    function onStorage(event: StorageEvent) {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) refresh();
    }
    refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    if (!record) return;
    let timer: number;
    const expiresAt = consentExpiresAt(record.timestamp);
    function scheduleExpiry() {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        disableAnalytics();
        currentRecord.current = null;
        setRecord(null);
        return;
      }
      timer = window.setTimeout(
        scheduleExpiry,
        Math.min(remaining, 2_147_483_647),
      );
    }
    scheduleExpiry();
    return () => window.clearTimeout(timer);
  }, [record]);

  function savePreferences(choices: ConsentChoices) {
    const next = createConsent(choices);
    if (!choices.analytics) disableAnalytics();
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
      volatileRecord.current = false;
      setStorageError(false);
    } catch {
      volatileRecord.current = true;
      setStorageError(true);
    }
    currentRecord.current = next;
    setRecord(next);
    setSettingsOpen(false);
  }

  return (
    <ConsentContext.Provider
      value={{
        ready,
        record,
        choices: record ?? OPTIONAL_DISABLED,
        settingsOpen,
        storageError,
        savePreferences,
        openSettings: () => setSettingsOpen(true),
        closeSettings: () => setSettingsOpen(false),
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  return useContext(ConsentContext);
}
