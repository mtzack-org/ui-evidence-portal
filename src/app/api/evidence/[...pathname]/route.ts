import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRun, readArtifact } from "@/lib/blob-store";
import { contentTypeFor, parseArtifactPath } from "@/lib/upload-policy";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pathname: string[] }> },
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pathname = (await params).pathname.join("/");
  let parsed: ReturnType<typeof parseArtifactPath>;
  try {
    parsed = parseArtifactPath(pathname);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const run = await getRun(parsed.runId);
  if (!run || run.evidenceDeletedAt) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  const range = request.headers.get("range");
  const result = await readArtifact(pathname, range);
  if (!result || !result.stream || ![200, 206].includes(result.statusCode)) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  const safeInline = parsed.policy.inline;
  const headers = new Headers({
    "Content-Type": safeInline
      ? contentTypeFor(parsed.filename)
      : "application/octet-stream",
    "Content-Disposition": `${safeInline ? "inline" : "attachment"}; filename="${parsed.filename}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  });
  if (range) headers.set("Accept-Ranges", "bytes");
  for (const name of ["content-range", "content-length", "etag"]) {
    const value = result.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(result.stream, { status: result.statusCode, headers });
}
