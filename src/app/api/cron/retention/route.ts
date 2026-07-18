import { NextResponse } from "next/server";
import { deleteRunEvidence, listRuns } from "@/lib/blob-store";
import { isExpired } from "@/lib/retention";

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const expired = (await listRuns()).filter((run) => isExpired(run, now));
  let deletedFiles = 0;
  for (const run of expired) {
    deletedFiles += await deleteRunEvidence(run, now.toISOString());
  }
  return NextResponse.json({ processedRuns: expired.length, deletedFiles });
}
