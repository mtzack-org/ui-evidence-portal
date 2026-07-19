import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import * as core from "@actions/core";
import * as glob from "@actions/glob";
import { upload } from "@vercel/blob/client";
import {
  artifactInputs,
  evidenceFilename,
  githubRunContext,
  mapStatus,
  normalizePortalUrl,
  parseNonNegativeInteger,
} from "./lib.mjs";

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.error || body?.message || `${response.status} ${response.statusText}`;
    throw new Error(`Portal request failed: ${detail}`);
  }
  return body;
}

async function eventPayload() {
  if (!process.env.GITHUB_EVENT_PATH) return {};
  return JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, "utf8"));
}

async function filesFor(patterns) {
  if (!patterns.trim()) return [];
  const globber = await glob.create(patterns, {
    followSymbolicLinks: false,
    implicitDescendants: false,
  });
  const matches = await globber.glob();
  const files = [];
  for (const match of matches) {
    if ((await stat(match)).isFile()) files.push(path.resolve(match));
  }
  return [...new Set(files)].sort();
}

function assertCreatedRun(value) {
  if (
    !value ||
    typeof value.id !== "string" ||
    typeof value.uploadToken !== "string" ||
    typeof value.uploadUrl !== "string" ||
    typeof value.finalizeUrl !== "string"
  ) {
    throw new Error("Portal returned an invalid run response");
  }
  return value;
}

async function finalizeRun(portalUrl, created, status, platform, result, requestHeaders) {
  return requestJson(`${portalUrl}${created.finalizeUrl}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${created.uploadToken}`,
      "content-type": "application/json",
      ...requestHeaders,
    },
    body: JSON.stringify({
      status,
      completedAt: new Date().toISOString(),
      platforms: { [platform]: { ...result, status } },
    }),
  });
}

async function run() {
  const portalUrl = normalizePortalUrl(core.getInput("portal-url", { required: true }));
  const token = core.getInput("token", { required: true });
  core.setSecret(token);
  const vercelProtectionBypass = core.getInput("vercel-protection-bypass");
  if (vercelProtectionBypass) core.setSecret(vercelProtectionBypass);
  const requestHeaders = vercelProtectionBypass
    ? { "x-vercel-protection-bypass": vercelProtectionBypass }
    : {};
  const platform = core.getInput("platform").toLowerCase();
  if (!new Set(["web", "android", "ios"]).has(platform)) {
    throw new Error("platform must be web, android, or ios");
  }
  const retention = core.getInput("retention").toLowerCase();
  if (!new Set(["normal", "release", "manual"]).has(retention)) {
    throw new Error("retention must be normal, release, or manual");
  }
  const status = mapStatus(core.getInput("status"));
  const ifNoFilesFound = core.getInput("if-no-files-found").toLowerCase();
  if (!new Set(["error", "warn", "ignore"]).has(ifNoFilesFound)) {
    throw new Error("if-no-files-found must be error, warn, or ignore");
  }
  const result = {
    status,
    total: parseNonNegativeInteger("total", core.getInput("total")),
    passed: parseNonNegativeInteger("passed", core.getInput("passed")),
    failed: parseNonNegativeInteger("failed", core.getInput("failed")),
    skipped: parseNonNegativeInteger("skipped", core.getInput("skipped")),
    durationMs: parseNonNegativeInteger("duration-ms", core.getInput("duration-ms")),
  };
  const context = githubRunContext(process.env, await eventPayload());
  const evidence = [];
  for (const [inputName, kind] of artifactInputs) {
    const matches = await filesFor(core.getInput(inputName));
    evidence.push(...matches.map((filePath) => ({ filePath, kind })));
  }
  if (evidence.length === 0) {
    const message = "No UI evidence files matched the configured patterns";
    if (ifNoFilesFound === "error") throw new Error(message);
    if (ifNoFilesFound === "warn") core.warning(message);
    core.setOutput("uploaded-count", "0");
    await core.summary.addHeading("UI Evidence", 2).addRaw(`⚪ ${message}.`).write();
    return;
  }

  const created = assertCreatedRun(await requestJson(`${portalUrl}/api/v1/runs`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...requestHeaders,
    },
    body: JSON.stringify({
      ...context,
      status: "running",
      retention,
      startedAt: new Date().toISOString(),
      platforms: {},
    }),
  }));
  core.setSecret(created.uploadToken);
  const handleUploadUrl = new URL(created.uploadUrl, portalUrl);
  if (vercelProtectionBypass) {
    handleUploadUrl.searchParams.set("x-vercel-protection-bypass", vercelProtectionBypass);
  }

  const usedNames = new Map();
  const uploaded = [];
  try {
    for (const { filePath, kind } of evidence) {
      const kindNames = usedNames.get(kind) || new Set();
      usedNames.set(kind, kindNames);
      const filename = evidenceFilename(filePath, kindNames);
      const pathname = `runs/${created.id}/evidence/${platform}/${kind}/${filename}`;
      const size = (await stat(filePath)).size;
      core.info(`Uploading ${kind}: ${filePath}`);
      await upload(pathname, createReadStream(filePath), {
        access: "private",
        handleUploadUrl: handleUploadUrl.toString(),
        clientPayload: JSON.stringify({ uploadToken: created.uploadToken }),
        headers: requestHeaders,
        multipart: size > 5 * 1024 * 1024,
      });
      uploaded.push({ kind, filename });
    }
  } catch (error) {
    await finalizeRun(portalUrl, created, "failed", platform, result, requestHeaders).catch((finalizeError) => {
      core.warning(`Could not mark the Portal run as failed: ${finalizeError instanceof Error ? finalizeError.message : String(finalizeError)}`);
    });
    throw error;
  }

  await finalizeRun(portalUrl, created, status, platform, result, requestHeaders);

  const runUrl = `${portalUrl}/runs/${encodeURIComponent(created.id)}`;
  core.setOutput("run-id", created.id);
  core.setOutput("run-url", runUrl);
  core.setOutput("uploaded-count", String(uploaded.length));

  await core.summary
    .addHeading("UI Evidence", 2)
    .addRaw(`${status === "passed" ? "✅" : status === "failed" ? "❌" : "⚪"} **${status.toUpperCase()}** · ${uploaded.length} evidence file${uploaded.length === 1 ? "" : "s"}\n\n`)
    .addLink("View test evidence →", runUrl)
    .write();
  core.info(`Uploaded ${uploaded.length} evidence files: ${runUrl}`);
}

run().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
