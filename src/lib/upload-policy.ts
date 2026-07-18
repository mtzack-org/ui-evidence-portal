import path from "node:path";
import {
  artifactKindSchema,
  platformSchema,
  type ArtifactKind,
  type Platform,
} from "./model";

type Policy = {
  extensions: readonly string[];
  contentTypes: readonly string[];
  maxBytes: number;
  inline: boolean;
};

export const uploadPolicies: Record<ArtifactKind, Policy> = {
  screenshot: {
    extensions: [".png", ".jpg", ".jpeg", ".webp"],
    contentTypes: ["image/png", "image/jpeg", "image/webp"],
    maxBytes: 20 * 1024 * 1024,
    inline: true,
  },
  video: {
    extensions: [".mp4", ".webm"],
    contentTypes: ["video/mp4", "video/webm"],
    maxBytes: 500 * 1024 * 1024,
    inline: true,
  },
  "html-report": {
    extensions: [".html", ".htm", ".zip"],
    contentTypes: ["text/html", "application/zip", "application/octet-stream"],
    maxBytes: 100 * 1024 * 1024,
    inline: false,
  },
  trace: {
    extensions: [".zip", ".trace"],
    contentTypes: ["application/zip", "application/octet-stream"],
    maxBytes: 500 * 1024 * 1024,
    inline: false,
  },
  log: {
    extensions: [".log", ".txt", ".json"],
    contentTypes: ["text/plain", "application/json", "application/octet-stream"],
    maxBytes: 50 * 1024 * 1024,
    inline: false,
  },
};

const safeId = /^[a-zA-Z0-9][a-zA-Z0-9._-]{7,159}$/;
const safeFilename = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/;

export function buildArtifactPath(
  runId: string,
  platform: Platform,
  kind: ArtifactKind,
  filename: string,
) {
  if (!safeId.test(runId) || !safeFilename.test(filename) || filename.includes("..")) {
    throw new Error("Unsafe evidence path");
  }
  const parsedPlatform = platformSchema.parse(platform);
  const parsedKind = artifactKindSchema.parse(kind);
  const extension = path.extname(filename).toLowerCase();
  if (!uploadPolicies[parsedKind].extensions.includes(extension)) {
    throw new Error(`Unsupported file extension for ${parsedKind}`);
  }
  return `runs/${runId}/evidence/${parsedPlatform}/${parsedKind}/${filename}`;
}

export function parseArtifactPath(pathname: string) {
  const match = pathname.match(
    /^runs\/([^/]+)\/evidence\/(web|android|ios)\/(screenshot|video|html-report|trace|log)\/([^/]+)$/,
  );
  if (!match) throw new Error("Invalid evidence path");
  const [, runId, platform, kind, filename] = match;
  const canonical = buildArtifactPath(
    runId,
    platform as Platform,
    kind as ArtifactKind,
    filename,
  );
  if (canonical !== pathname) throw new Error("Non-canonical evidence path");
  return {
    runId,
    platform: platform as Platform,
    kind: kind as ArtifactKind,
    filename,
    policy: uploadPolicies[kind as ArtifactKind],
  };
}

export function contentTypeFor(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".html": "text/html",
    ".htm": "text/html",
    ".zip": "application/zip",
    ".trace": "application/octet-stream",
    ".log": "text/plain; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".json": "application/json",
  };
  return types[extension] ?? "application/octet-stream";
}
