export const CONSENT_STORAGE_KEY = "portfolio-studio:consent";
export const CONSENT_VERSION = 1;

export interface ConsentChoices {
  analytics: boolean;
  youtube: boolean;
}

export interface ConsentRecord extends ConsentChoices {
  version: typeof CONSENT_VERSION;
  timestamp: string;
}

export const OPTIONAL_DISABLED: ConsentChoices = {
  analytics: false,
  youtube: false,
};

export function consentExpiresAt(timestamp: string): number {
  const date = new Date(timestamp);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 6);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime();
}

export function parseConsent(
  raw: string | null,
  now = Date.now(),
): ConsentRecord | null {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (
      !record ||
      record.version !== CONSENT_VERSION ||
      typeof record.analytics !== "boolean" ||
      typeof record.youtube !== "boolean" ||
      typeof record.timestamp !== "string" ||
      !Number.isFinite(Date.parse(record.timestamp)) ||
      Date.parse(record.timestamp) > now ||
      consentExpiresAt(record.timestamp) <= now
    )
      return null;
    return {
      version: CONSENT_VERSION,
      timestamp: record.timestamp,
      analytics: record.analytics,
      youtube: record.youtube,
    };
  } catch {
    return null;
  }
}

export function createConsent(choices: ConsentChoices): ConsentRecord {
  return {
    ...choices,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
}
