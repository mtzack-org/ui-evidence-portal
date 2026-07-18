import type { EvidenceRun } from "./model";

export const NORMAL_RETENTION_DAYS = 90;

export function calculateExpiry(
  retention: EvidenceRun["retention"],
  startedAt: string,
): string | null {
  if (retention !== "normal") return null;
  const expires = new Date(startedAt);
  expires.setUTCDate(expires.getUTCDate() + NORMAL_RETENTION_DAYS);
  return expires.toISOString();
}

export function isExpired(run: EvidenceRun, now = new Date()): boolean {
  return Boolean(
    run.expiresAt &&
      !run.evidenceDeletedAt &&
      new Date(run.expiresAt).getTime() <= now.getTime(),
  );
}
