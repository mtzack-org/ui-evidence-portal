import { NextResponse } from "next/server";
import { getRun, saveRun } from "@/lib/blob-store";
import { finalizeRunSchema } from "@/lib/model";
import {
  bearerToken,
  isValidIngestToken,
  verifyUploadToken,
} from "@/lib/tokens";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const token = bearerToken(request);
  let authorized = isValidIngestToken(token);
  if (!authorized && token) {
    authorized = await verifyUploadToken(token)
      .then((claims) => claims.runId === runId)
      .catch(() => false);
  }
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [run, body] = await Promise.all([
    getRun(runId),
    request.json().catch(() => null),
  ]);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  const parsed = finalizeRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const updated = {
    ...run,
    ...parsed.data,
    completedAt: parsed.data.completedAt ?? new Date().toISOString(),
    platforms: parsed.data.platforms ?? run.platforms,
  };
  await saveRun(updated);
  return NextResponse.json(updated);
}
