# GitHub Marketplace release

Action repository: [`mtzack-org/upload-ui-evidence`](https://github.com/mtzack-org/upload-ui-evidence)

## Listing copy

### Name

Upload UI Evidence

### Short description

Upload UI test screenshots, videos, reports, traces, and logs to a private evidence portal.

### README introduction

Keep UI test evidence beyond the lifetime of a workflow artifact. Upload evidence from Web,
Android, and iOS jobs, then review screenshots, recordings, reports, traces, logs, and the
previous run from one private portal. Every upload adds a direct Portal link to the GitHub
Actions Job Summary.

### Suggested categories

- Continuous integration
- Testing

## Release checklist

- [x] License the source code under `AGPL-3.0-only`.
- [x] Use `UI Evidence Portal` as the product name and `Upload UI Evidence` as the Action name.
- [x] Publish from the `mtzack-org` GitHub organization.
- [x] Replace placeholder values in the Action documentation.
- [x] Enable GitHub private vulnerability reporting.
- [x] Configure GitHub Issues, support guidance, and a bug report form.
- [ ] Deploy a clean Portal from the Vercel button and connect a Private Blob store.
- [ ] Run `examples/playwright.yml` from a separate test repository.
- [ ] Verify create, upload, finalize, authenticated viewing, and retention behavior.
- [ ] Run `npm ci && npm run lint && npm run typecheck && npm test`.
- [x] Run a clean install, Action tests, rebuild the bundle, and verify the committed `dist`.
- [x] Load the Action from a separate repository on a GitHub-hosted runner using `@main`.
- [x] Create a `v1.0.0` release and point the moving `v1` tag to the same commit.
- [x] Confirm the separate GitHub-hosted runner smoke test using the published `@v1` tag.
- [ ] Select “Publish this Action to the GitHub Marketplace” from the release screen.
- [ ] Verify installation from the Marketplace listing in a second repository.

## Release notes draft

### Upload UI Evidence v1.0.0

Initial public release.

- Upload screenshots, MP4/WebM recordings, HTML/ZIP reports, traces, and logs.
- Associate evidence with Web, Android, or iOS test runs.
- Finalize runs as passed, failed, or cancelled.
- Add a direct evidence link to the GitHub Actions Job Summary.
- Avoid empty Portal runs and mark interrupted uploads as failed when possible.
- Support self-hosted UI Evidence Portal deployments.
