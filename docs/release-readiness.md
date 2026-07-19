# Release readiness

Checked on 2026-07-19.

## Ready

- The Portal production build succeeds with Node.js 24.
- Portal unit tests, type checking, and linting pass.
- The Action is published from the dedicated public repository
  [`mtzack-org/upload-ui-evidence`](https://github.com/mtzack-org/upload-ui-evidence).
- The dedicated repository contains the Node.js 24 bundle, source, tests, support policy, and
  security policy without Portal code or workflow files.
- A separate private repository loaded the public Action from a GitHub-hosted runner successfully.
- The same repository loaded the published `v1` tag successfully on a GitHub-hosted runner.
- The `v1.0.0` release and moving `v1` tag point to the tested Action commit.
- Empty evidence behavior is configurable with `error`, `warn`, or `ignore`.
- Interrupted uploads are finalized as failed when the short-lived token is still valid.
- Ingest and upload tokens are masked from GitHub Actions logs.
- Protected Vercel Previews are supported through an optional Automation Bypass input.
- A Playwright workflow example and Marketplace copy exist.
- The current workspace was deployed successfully to a protected Vercel Preview.
- A real Action run created a Portal run, uploaded one dummy log to Private Blob, finalized the
  result, and generated the Job Summary link successfully.
- The E2E run metadata and evidence, temporary deployment, test secrets, and local temporary
  files were removed after verification.
- The existing production Portal responds successfully at its login route.
- The production run-ingest and retention endpoints reject unauthenticated requests.

## External verification still required

- Verify GitHub OAuth sign-in and authenticated evidence viewing on a stable Preview callback URL.
- Deploy a clean Portal from the Vercel button after the Portal repository is public.

## Decisions required before public release

- Decide when to make the Portal repository public so the Vercel deploy button works for new users.
- Accept the GitHub Marketplace Developer Agreement and publish the existing `v1.0.0` release to
  Marketplace.

The detailed publication sequence is in [`marketplace.md`](marketplace.md).

## Public names

- Product: `UI Evidence Portal`
- GitHub Action: `Upload UI Evidence`

## License

The source code is licensed under the GNU Affero General Public License v3.0 only
(`AGPL-3.0-only`). See [`../LICENSE`](../LICENSE).
