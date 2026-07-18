// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { isValidIngestToken, issueUploadToken, verifyUploadToken } from "./tokens";

afterEach(() => {
  delete process.env.UPLOAD_SIGNING_SECRET;
  delete process.env.EVIDENCE_INGEST_TOKEN;
});

describe("short-lived upload authorization", () => {
  it("binds a signed token to one run", async () => {
    process.env.UPLOAD_SIGNING_SECRET = "x".repeat(48);
    const token = await issueUploadToken("12345678-run");
    await expect(verifyUploadToken(token)).resolves.toEqual({ runId: "12345678-run" });
  });

  it("rejects tampered tokens", async () => {
    process.env.UPLOAD_SIGNING_SECRET = "x".repeat(48);
    const token = await issueUploadToken("12345678-run");
    await expect(verifyUploadToken(`${token}x`)).rejects.toThrow();
  });

  it("compares ingest secrets without direct string comparison", () => {
    process.env.EVIDENCE_INGEST_TOKEN = "correct-secret";
    expect(isValidIngestToken("correct-secret")).toBe(true);
    expect(isValidIngestToken("wrong-secret")).toBe(false);
  });
});
