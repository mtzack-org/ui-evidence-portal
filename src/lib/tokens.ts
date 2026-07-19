import { createHash, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();
const issuer = "ui-evidence-portal";
const audience = "evidence-upload";

function signingKey() {
  const secret = process.env.UPLOAD_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("UPLOAD_SIGNING_SECRET must contain at least 32 characters");
  }
  return encoder.encode(secret);
}

export async function issueUploadToken(runId: string) {
  return new SignJWT({ runId, purpose: "evidence-upload" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience(audience)
    .setJti(crypto.randomUUID())
    .setExpirationTime("15m")
    .sign(signingKey());
}

export async function verifyUploadToken(token: string) {
  const { payload } = await jwtVerify(token, signingKey(), {
    issuer,
    audience,
    algorithms: ["HS256"],
  });
  if (payload.purpose !== "evidence-upload" || typeof payload.runId !== "string") {
    throw new Error("Invalid upload token");
  }
  return { runId: payload.runId };
}

export function isValidIngestToken(value: string | null) {
  const expectedTokens = [
    process.env.EVIDENCE_INGEST_TOKEN,
    process.env.EVIDENCE_DEMO_INGEST_TOKEN,
  ].filter((token): token is string => Boolean(token));
  if (!value || expectedTokens.length === 0) return false;
  const actualDigest = createHash("sha256").update(value).digest();
  return expectedTokens.some((expected) => {
    const expectedDigest = createHash("sha256").update(expected).digest();
    return timingSafeEqual(actualDigest, expectedDigest);
  });
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}
