import { z } from "zod";

export const platformSchema = z.enum(["web", "android", "ios"]);
export type Platform = z.infer<typeof platformSchema>;

export const runStatusSchema = z.enum([
  "queued",
  "running",
  "passed",
  "failed",
  "cancelled",
]);
export type RunStatus = z.infer<typeof runStatusSchema>;

export const artifactKindSchema = z.enum([
  "screenshot",
  "video",
  "html-report",
  "trace",
  "log",
]);
export type ArtifactKind = z.infer<typeof artifactKindSchema>;

export const platformResultSchema = z.object({
  status: runStatusSchema,
  total: z.number().int().nonnegative().default(0),
  passed: z.number().int().nonnegative().default(0),
  failed: z.number().int().nonnegative().default(0),
  skipped: z.number().int().nonnegative().default(0),
  durationMs: z.number().int().nonnegative().default(0),
});

export const runSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(8).max(160),
  repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  workflow: z.string().min(1).max(200),
  workflowRunId: z.number().int().positive(),
  runNumber: z.number().int().positive(),
  runAttempt: z.number().int().positive().default(1),
  status: runStatusSchema,
  retention: z.enum(["normal", "release", "manual"]),
  branch: z.string().min(1).max(255),
  commitSha: z.string().regex(/^[a-f0-9]{7,40}$/i),
  commitMessage: z.string().max(500).optional(),
  actor: z.string().min(1).max(100),
  event: z.string().min(1).max(80),
  pullRequest: z.number().int().positive().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullable(),
  evidenceDeletedAt: z.string().datetime().optional(),
  platforms: z.partialRecord(platformSchema, platformResultSchema),
  links: z.object({
    run: z.string().url(),
    commit: z.string().url(),
    pullRequest: z.string().url().optional(),
    artifacts: z.string().url().optional(),
  }),
});

export type EvidenceRun = z.infer<typeof runSchema>;

export const createRunSchema = runSchema
  .omit({
    schemaVersion: true,
    id: true,
    expiresAt: true,
    evidenceDeletedAt: true,
  })
  .extend({ status: runStatusSchema.default("running") });

export const finalizeRunSchema = z.object({
  status: runStatusSchema.exclude(["queued", "running"]),
  completedAt: z.string().datetime().optional(),
  platforms: z.partialRecord(platformSchema, platformResultSchema).optional(),
});

export type Artifact = {
  pathname: string;
  filename: string;
  platform: Platform;
  kind: ArtifactKind;
  size: number;
  uploadedAt: string;
};
