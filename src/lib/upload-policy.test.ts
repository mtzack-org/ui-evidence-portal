import { describe, expect, it } from "vitest";
import { buildArtifactPath, parseArtifactPath } from "./upload-policy";

describe("upload policy", () => {
  it("builds and parses canonical evidence paths", () => {
    const pathname = buildArtifactPath("12345678-run", "web", "screenshot", "home.png");
    expect(pathname).toBe("runs/12345678-run/evidence/web/screenshot/home.png");
    expect(parseArtifactPath(pathname)).toMatchObject({ runId: "12345678-run", platform: "web", kind: "screenshot", filename: "home.png" });
  });

  it.each([
    ["../secret.png", "screenshot"],
    ["payload.svg", "screenshot"],
    ["report.html", "screenshot"],
    ["script.js", "html-report"],
  ] as const)("rejects unsafe or mismatched file %s", (filename, kind) => {
    expect(() => buildArtifactPath("12345678-run", "web", kind, filename)).toThrow();
  });

  it("rejects path traversal and unknown folders", () => {
    expect(() => parseArtifactPath("runs/12345678-run/evidence/web/log/../secret.txt")).toThrow();
    expect(() => parseArtifactPath("runs/12345678-run/evidence/web/executable/test.js")).toThrow();
  });
});
