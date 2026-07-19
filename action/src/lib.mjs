import { createHash } from "node:crypto";
import path from "node:path";

export const artifactInputs = [
  ["screenshots", "screenshot"],
  ["videos", "video"],
  ["reports", "html-report"],
  ["traces", "trace"],
  ["logs", "log"],
];

export function normalizePortalUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("portal-url must use http or https");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("portal-url must not include credentials, a query, or a fragment");
  }
  if (url.pathname !== "/") {
    throw new Error("portal-url must be an origin without a path");
  }
  return url.toString().replace(/\/$/, "");
}

export function mapStatus(value) {
  const statuses = {
    success: "passed",
    passed: "passed",
    failure: "failed",
    failed: "failed",
    cancelled: "cancelled",
    canceled: "cancelled",
  };
  const status = statuses[value.trim().toLowerCase()];
  if (!status) {
    throw new Error(`Unsupported status: ${value}`);
  }
  return status;
}

export function parseNonNegativeInteger(name, value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
}

export function evidenceFilename(filePath, usedNames) {
  const original = path.basename(filePath);
  const extension = path.extname(original).toLowerCase();
  const stem = path.basename(original, path.extname(original));
  const safeStem = stem
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .slice(0, 170) || "evidence";
  let filename = `${safeStem}${extension}`;
  if (usedNames.has(filename)) {
    const digest = createHash("sha256").update(filePath).digest("hex").slice(0, 8);
    filename = `${safeStem.slice(0, 160)}-${digest}${extension}`;
  }
  usedNames.add(filename);
  return filename;
}

export function githubRunContext(env, event = {}) {
  const serverUrl = env.GITHUB_SERVER_URL || "https://github.com";
  const repository = requiredEnv(env, "GITHUB_REPOSITORY");
  const runId = parsePositiveInteger("GITHUB_RUN_ID", env.GITHUB_RUN_ID);
  const runNumber = parsePositiveInteger("GITHUB_RUN_NUMBER", env.GITHUB_RUN_NUMBER);
  const runAttempt = parsePositiveInteger("GITHUB_RUN_ATTEMPT", env.GITHUB_RUN_ATTEMPT || "1");
  const commitSha = requiredEnv(env, "GITHUB_SHA");
  const pullRequest = event.pull_request?.number;
  const pullRequestUrl = event.pull_request?.html_url;

  return {
    source: "github-actions",
    repository,
    workflow: requiredEnv(env, "GITHUB_WORKFLOW"),
    workflowRunId: runId,
    runNumber,
    runAttempt,
    branch: env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME || "unknown",
    commitSha,
    actor: requiredEnv(env, "GITHUB_ACTOR"),
    event: requiredEnv(env, "GITHUB_EVENT_NAME"),
    ...(pullRequest ? { pullRequest } : {}),
    links: {
      run: `${serverUrl}/${repository}/actions/runs/${runId}`,
      commit: `${serverUrl}/${repository}/commit/${commitSha}`,
      ...(pullRequestUrl ? { pullRequest: pullRequestUrl } : {}),
      artifacts: `${serverUrl}/${repository}/actions/runs/${runId}#artifacts`,
    },
  };
}

function requiredEnv(env, name) {
  const value = env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function parsePositiveInteger(name, value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}
