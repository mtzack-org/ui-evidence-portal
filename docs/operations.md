# Operations

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth App |
| `AUTH_SECRET` | Auth.js session encryption/signing secret |
| `GITHUB_ORG` | Organization allowed to sign in (`mtzack-org`) |
| `ALLOWED_GITHUB_USERS` | Optional comma-separated GitHub logins |
| `EVIDENCE_INGEST_TOKEN` | Dedicated secret used by Actions to create runs |
| `UPLOAD_SIGNING_SECRET` | Signs 15-minute, run-bound upload sessions |
| `BLOB_READ_WRITE_TOKEN` | Added by the connected private Blob store; server only |
| `CRON_SECRET` | Secures the retention endpoint |

GitHub OAuth Appのcallback URLは次です。

```text
https://<production-domain>/api/auth/callback/github
```

OAuth AppではOrganization accessを許可し、`read:org` scopeで非公開membershipも確認できるようにします。

## Register a run

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $EVIDENCE_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d @run.json \
  https://ui-evidence-portal.vercel.app/api/v1/runs
```

Example `run.json`:

```json
{
  "repository": "mtzack-org/example-app",
  "workflow": "UI Tests",
  "workflowRunId": 123456789,
  "runNumber": 42,
  "runAttempt": 1,
  "status": "running",
  "retention": "normal",
  "branch": "main",
  "commitSha": "0123456789abcdef0123456789abcdef01234567",
  "commitMessage": "Verify checkout flow",
  "actor": "octocat",
  "event": "pull_request",
  "pullRequest": 314,
  "startedAt": "2026-07-19T00:00:00.000Z",
  "platforms": {},
  "links": {
    "run": "https://github.com/mtzack-org/example-app/actions/runs/123456789",
    "commit": "https://github.com/mtzack-org/example-app/commit/0123456789abcdef0123456789abcdef01234567",
    "pullRequest": "https://github.com/mtzack-org/example-app/pull/314",
    "artifacts": "https://github.com/mtzack-org/example-app/actions/runs/123456789#artifacts"
  }
}
```

レスポンスの`uploadToken`を`@vercel/blob/client`の`clientPayload`に渡します。pathnameは以下の形式に限定されます。

```text
runs/<id>/evidence/<web|android|ios>/<screenshot|video|html-report|trace|log>/<safe-filename>
```

```ts
import { upload } from "@vercel/blob/client";

await upload(pathname, file, {
  access: "private",
  handleUploadUrl: `${portalUrl}/api/v1/uploads`,
  clientPayload: JSON.stringify({ uploadToken }),
});
```

全ファイルのアップロード後、登録レスポンスの`finalizeUrl`へ`PATCH`します。

```json
{
  "status": "passed",
  "completedAt": "2026-07-19T00:05:00.000Z",
  "platforms": {
    "web": { "status": "passed", "total": 28, "passed": 28, "failed": 0, "skipped": 0, "durationMs": 92000 }
  }
}
```

Authorizationには同じ短命`uploadToken`、または登録用tokenを使用できます。Bibliofolio側の具体的なworkflow変更はPortal稼働確認後に別途行います。

## Register a local run

ローカル実行は`source: "local"`と安定した`localRunId`を送り、GitHub Actions固有の
`workflowRunId`、`runNumber`、`links.run`を省略できます。`environment`、`machine`、
`devices`は履歴の再現性確認に使用します。

```json
{
  "source": "local",
  "localRunId": "20260719-090000-a1b2c3d4",
  "repository": "mtzack-org/example-app",
  "workflow": "Local UI Tests",
  "status": "running",
  "retention": "normal",
  "environment": "staging",
  "machine": "developer-mac",
  "devices": {
    "web": "Google Chrome",
    "android": "Pixel 9 Pro XL",
    "ios": "iPhone Simulator"
  },
  "branch": "develop",
  "commitSha": "0123456789abcdef0123456789abcdef01234567",
  "actor": "mtzack",
  "event": "local",
  "startedAt": "2026-07-19T00:00:00.000Z",
  "platforms": {},
  "links": {
    "commit": "https://github.com/mtzack-org/example-app/commit/0123456789abcdef0123456789abcdef01234567"
  }
}
```

## Retention operations

Vercel Cronが`GET /api/cron/retention`を1日1回呼び出します。手動確認時も次の形式で実行できます。

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<production-domain>/api/cron/retention
```
