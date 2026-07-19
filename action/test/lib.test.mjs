import test from "node:test";
import assert from "node:assert/strict";
import {
  evidenceFilename,
  githubRunContext,
  mapStatus,
  normalizePortalUrl,
  parseNonNegativeInteger,
} from "../src/lib.mjs";

test("normalizes the Portal URL", () => {
  assert.equal(normalizePortalUrl("https://evidence.example.com/"), "https://evidence.example.com");
  assert.throws(() => normalizePortalUrl("file:///tmp/portal"), /http or https/);
  assert.throws(() => normalizePortalUrl("https://user:secret@evidence.example.com"), /must not include credentials/);
  assert.throws(() => normalizePortalUrl("https://evidence.example.com/portal"), /without a path/);
});

test("maps GitHub job statuses to Portal statuses", () => {
  assert.equal(mapStatus("success"), "passed");
  assert.equal(mapStatus("failure"), "failed");
  assert.equal(mapStatus("cancelled"), "cancelled");
  assert.throws(() => mapStatus("skipped"), /Unsupported status/);
});

test("validates result counts", () => {
  assert.equal(parseNonNegativeInteger("total", "12"), 12);
  assert.throws(() => parseNonNegativeInteger("total", "-1"), /non-negative/);
  assert.throws(() => parseNonNegativeInteger("total", "1.5"), /non-negative/);
});

test("creates safe and unique evidence filenames", () => {
  const used = new Set();
  assert.equal(evidenceFilename("test results/checkout screen.png", used), "checkout-screen.png");
  assert.match(evidenceFilename("other/checkout screen.png", used), /^checkout-screen-[a-f0-9]{8}\.png$/);
  assert.equal(evidenceFilename("screenshots/日本語.png", new Set()), "evidence.png");
});

test("builds GitHub run context", () => {
  const context = githubRunContext({
    GITHUB_SERVER_URL: "https://github.example.com",
    GITHUB_REPOSITORY: "acme/app",
    GITHUB_WORKFLOW: "UI Tests",
    GITHUB_RUN_ID: "123",
    GITHUB_RUN_NUMBER: "7",
    GITHUB_RUN_ATTEMPT: "2",
    GITHUB_HEAD_REF: "feature/checkout",
    GITHUB_REF_NAME: "main",
    GITHUB_SHA: "0123456789abcdef0123456789abcdef01234567",
    GITHUB_ACTOR: "octocat",
    GITHUB_EVENT_NAME: "pull_request",
  }, {
    pull_request: { number: 42, html_url: "https://github.example.com/acme/app/pull/42" },
  });

  assert.equal(context.branch, "feature/checkout");
  assert.equal(context.pullRequest, 42);
  assert.equal(context.links.run, "https://github.example.com/acme/app/actions/runs/123");
});
