import { del, get, list, put } from "@vercel/blob";
import type { Artifact, EvidenceRun } from "./model";
import { parseArtifactPath } from "./upload-policy";

const metadataPrefix = "metadata/runs/";

function metadataPath(runId: string) {
  return `${metadataPrefix}${runId}.json`;
}

export function blobIsConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return (await new Response(result.stream).json()) as T;
}

export async function saveRun(run: EvidenceRun) {
  if (!blobIsConfigured()) throw new Error("Vercel Blob is not configured");
  await put(metadataPath(run.id), JSON.stringify(run), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function getRun(runId: string) {
  if (!blobIsConfigured()) return null;
  return readJson<EvidenceRun>(metadataPath(runId));
}

async function listAll(prefix: string) {
  const blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export async function listRuns(): Promise<EvidenceRun[]> {
  if (!blobIsConfigured()) return [];
  const blobs = await listAll(metadataPrefix);
  const records = await Promise.all(
    blobs.map((blob) => readJson<EvidenceRun>(blob.pathname)),
  );
  return records
    .filter((run): run is EvidenceRun => Boolean(run))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function listArtifacts(runId: string): Promise<Artifact[]> {
  if (!blobIsConfigured()) return [];
  const blobs = await listAll(`runs/${runId}/evidence/`);
  return blobs.flatMap((blob) => {
    try {
      const parsed = parseArtifactPath(blob.pathname);
      return [
        {
          pathname: blob.pathname,
          filename: parsed.filename,
          platform: parsed.platform,
          kind: parsed.kind,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
        },
      ];
    } catch {
      return [];
    }
  });
}

export async function deleteRunEvidence(run: EvidenceRun, deletedAt: string) {
  const blobs = await listAll(`runs/${run.id}/evidence/`);
  if (blobs.length) await del(blobs.map((blob) => blob.pathname));
  const updated: EvidenceRun = { ...run, evidenceDeletedAt: deletedAt };
  await saveRun(updated);
  return blobs.length;
}

export async function readArtifact(pathname: string, range?: string | null) {
  return get(pathname, {
    access: "private",
    headers: range ? { Range: range } : undefined,
  });
}
