import { describe, expect, it } from "vitest";
import { createRunSchema } from "./model";

const common = {
  repository: "mtzack-org/example-app",
  workflow: "Local UI Tests",
  status: "running" as const,
  retention: "normal" as const,
  branch: "develop",
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  actor: "mtzack",
  event: "local",
  startedAt: "2026-07-19T00:00:00.000Z",
  platforms: {},
  links: {
    commit: "https://github.com/mtzack-org/example-app/commit/0123456789abcdef0123456789abcdef01234567",
  },
};

describe("createRunSchema", () => {
  it("accepts local runs without GitHub Actions identifiers", () => {
    const result = createRunSchema.parse({
      ...common,
      source: "local",
      localRunId: "20260719-090000-abcd1234",
      environment: "staging",
      machine: "developer-mac",
      devices: { android: "Pixel 9 Pro XL", ios: "iPhone Simulator" },
    });

    expect(result.source).toBe("local");
    expect(result.workflowRunId).toBeUndefined();
    expect(result.links.run).toBeUndefined();
  });

  it("keeps GitHub Actions as the compatibility default", () => {
    const result = createRunSchema.parse({
      ...common,
      workflowRunId: 123,
      runNumber: 42,
      links: { ...common.links, run: "https://github.com/mtzack-org/example-app/actions/runs/123" },
    });

    expect(result.source).toBe("github-actions");
  });

  it("requires a stable identifier for local runs", () => {
    const result = createRunSchema.safeParse({
      ...common,
      source: "local",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.localRunId).toBeDefined();
    }
  });

  it("keeps GitHub Actions identifiers and run URL required", () => {
    const result = createRunSchema.safeParse(common);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.workflowRunId).toBeDefined();
      expect(errors.runNumber).toBeDefined();
      expect(errors.links).toBeDefined();
    }
  });
});
