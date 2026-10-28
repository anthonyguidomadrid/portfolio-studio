import { describe, expect, it } from "vitest";
import { consentExpiresAt, parseConsent } from "@/lib/consent";

describe("consent storage", () => {
  const record = {
    version: 1,
    timestamp: "2026-08-31T12:00:00.000Z",
    analytics: true,
    youtube: false,
  };
  const now = Date.parse("2026-10-28T12:00:00.000Z");

  it("validates independent saved preferences", () => {
    expect(parseConsent(JSON.stringify(record), now)).toEqual(record);
  });

  it("expires after six calendar months, clamping the last day", () => {
    expect(consentExpiresAt(record.timestamp)).toBe(
      Date.parse("2027-02-28T12:00:00.000Z"),
    );
    expect(
      parseConsent(
        JSON.stringify(record),
        Date.parse("2027-02-28T12:00:00.000Z"),
      ),
    ).toBeNull();
  });

  it.each([
    null,
    "",
    "bad",
    "null",
    "[]",
    "{}",
    JSON.stringify({ ...record, version: 2 }),
    JSON.stringify({ ...record, analytics: "yes" }),
    JSON.stringify({ ...record, timestamp: "bad" }),
    JSON.stringify({ ...record, timestamp: "2027-01-01" }),
  ])("rejects unsafe records: %s", (raw) => {
    expect(parseConsent(raw, now)).toBeNull();
  });
});
