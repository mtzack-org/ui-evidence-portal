# GitHub Marketplace release

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

- [ ] Decide the source-code license before making the repository public.
- [ ] Confirm the public product and GitHub organization names.
- [ ] Replace placeholder or organization-specific values in documentation.
- [ ] Enable GitHub private vulnerability reporting.
- [ ] Configure a public support channel and verify that GitHub Issues is enabled.
- [ ] Deploy a clean Portal from the Vercel button and connect a Private Blob store.
- [ ] Run `examples/playwright.yml` from a separate test repository.
- [ ] Verify create, upload, finalize, authenticated viewing, and retention behavior.
- [ ] Run `npm ci && npm run lint && npm run typecheck && npm test`.
- [ ] Run `npm run test:action && npm run build:action` and commit `action/dist`.
- [ ] Create a `v1.0.0` release and point the moving `v1` tag to the same commit.
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
