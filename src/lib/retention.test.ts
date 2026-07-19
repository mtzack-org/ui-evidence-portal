import { describe, expect, it } from "vitest";
import { calculateExpiry, isExpired } from "./retention";
import type { EvidenceRun } from "./model";

const baseRun: EvidenceRun = {
  schemaVersion: 1,
  id: "12345678-run",
  source: "github-actions",
  repository: "mtzack-org/example",
  workflow: "UI Tests",
  workflowRunId: 1,
  runNumber: 1,
  runAttempt: 1,
  status: "passed",
  retention: "normal",
  branch: "main",
  commitSha: "abcdef1234567890",
  actor: "octocat",
  event: "push",
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: "2026-01-01T00:05:00.000Z",
  expiresAt: "2026-04-01T00:00:00.000Z",
  platforms: {},
  links: {
    run: "https://github.com/example/actions/runs/1",
    commit: "https://github.com/example/commit/abcdef1",
  },
};

describe("retention", () => {
  it("expires normal runs after 90 days", () => {
    expect(calculateExpiry("normal", baseRun.startedAt)).toBe("2026-04-01T00:00:00.000Z");
    expect(isExpired(baseRun, new Date("2026-04-01T00:00:00.000Z"))).toBe(true);
  });

  it("never expires preserved runs", () => {
    expect(calculateExpiry("release", baseRun.startedAt)).toBeNull();
    expect(calculateExpiry("manual", baseRun.startedAt)).toBeNull();
  });

  it("does not process evidence twice", () => {
    expect(isExpired({ ...baseRun, evidenceDeletedAt: "2026-04-01T01:00:00.000Z" }, new Date("2026-05-01T00:00:00.000Z"))).toBe(false);
  });
});
