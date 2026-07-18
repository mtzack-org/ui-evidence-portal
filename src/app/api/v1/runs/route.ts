import { NextResponse } from "next/server";
import { calculateExpiry } from "@/lib/retention";
import { createRunSchema, type EvidenceRun } from "@/lib/model";
import { saveRun } from "@/lib/blob-store";
import {
  bearerToken,
  isValidIngestToken,
  issueUploadToken,
} from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isValidIngestToken(bearerToken(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createRunSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid run payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const id = `${Date.now()}-${parsed.data.workflowRunId}-${crypto.randomUUID()}`;
  const run: EvidenceRun = {
    ...parsed.data,
    schemaVersion: 1,
    id,
    expiresAt: calculateExpiry(parsed.data.retention, parsed.data.startedAt),
  };
  await saveRun(run);
  const uploadToken = await issueUploadToken(id);

  return NextResponse.json(
    {
      id,
      uploadToken,
      uploadTokenExpiresIn: 900,
      uploadUrl: "/api/v1/uploads",
      finalizeUrl: `/api/v1/runs/${id}`,
    },
    { status: 201 },
  );
}
