# Release readiness

Checked on 2026-07-19.

## Ready

- The Portal production build succeeds with Node.js 24.
- Portal unit tests, type checking, and linting pass.
- Action helper tests pass.
- `action.yml` targets the committed Node.js 24 bundle.
- The bundled Action starts successfully and reports missing required inputs as expected.
- CI rebuilds the Action and rejects an out-of-date committed bundle.
- Empty evidence behavior is configurable with `error`, `warn`, or `ignore`.
- Interrupted uploads are finalized as failed when the short-lived token is still valid.
- Ingest and upload tokens are masked from GitHub Actions logs.
- Protected Vercel Previews are supported through an optional Automation Bypass input.
- A Playwright workflow example, Marketplace copy, support policy, and security policy exist.
- The current workspace was deployed successfully to a protected Vercel Preview.
- A real Action run created a Portal run, uploaded one dummy log to Private Blob, finalized the
  result, and generated the Job Summary link successfully.
- The E2E run metadata and evidence, temporary deployment, test secrets, and local temporary
  files were removed after verification.
- The existing production Portal responds successfully at its login route.
- The production run-ingest and retention endpoints reject unauthenticated requests.

## External verification still required

- Run the Action from a GitHub-hosted runner in a separate repository to verify Marketplace-style
  installation rather than local runner emulation.
- Verify GitHub OAuth sign-in and authenticated evidence viewing on a stable Preview callback URL.
- Reauthenticate GitHub CLI before creating releases or managing repository settings.

## Decisions required before public release

- Confirm whether `UI Evidence Portal` and `Upload UI Evidence` are the final public names.
- Decide whether the repository itself becomes public or whether the Action moves to a separate
  public repository.
- Explicitly approve making the repository public, creating the `v1.0.0` release and `v1` tag,
  and accepting the GitHub Marketplace terms.

The detailed publication sequence is in [`marketplace.md`](marketplace.md).

## License

The source code is licensed under the GNU Affero General Public License v3.0 only
(`AGPL-3.0-only`). See [`../LICENSE`](../LICENSE).
