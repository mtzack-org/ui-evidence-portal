import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getRun } from "@/lib/blob-store";
import { parseArtifactPath } from "@/lib/upload-policy";
import { verifyUploadToken } from "@/lib/tokens";

type ClientPayload = { uploadToken?: string };

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const parsed = parseArtifactPath(pathname);
        const payload = JSON.parse(clientPayload ?? "{}") as ClientPayload;
        if (!payload.uploadToken) throw new Error("Missing upload token");
        const claims = await verifyUploadToken(payload.uploadToken);
        if (claims.runId !== parsed.runId) throw new Error("Run mismatch");
        if (!(await getRun(parsed.runId))) throw new Error("Unknown run");
        return {
          access: "private" as const,
          allowedContentTypes: [...parsed.policy.contentTypes],
          maximumSizeInBytes: parsed.policy.maxBytes,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ runId: parsed.runId, pathname }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as {
          runId: string;
          pathname: string;
        };
        const parsed = parseArtifactPath(blob.pathname);
        if (parsed.runId !== payload.runId || blob.pathname !== payload.pathname) {
          throw new Error("Upload callback mismatch");
        }
      },
    });
    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload rejected" },
      { status: 400 },
    );
  }
}
