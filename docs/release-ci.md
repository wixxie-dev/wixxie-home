# Release, CI, and Tag Strategy

This document is for maintainers and contributors who publish images/releases.

## Workflows

This repository uses three GitHub Actions workflows:

- `CI` (`.github/workflows/ci.yml`)
  - Runs on pull requests and pushes to `main`
  - Installs dependencies and runs `bun run build`
- `Release` (`.github/workflows/release.yml`)
  - Runs on version tags like `v1.2.3`
  - Builds and pushes only the matching version tag to GHCR
  - Creates a GitHub Release with generated notes
- `Publish Latest` (`.github/workflows/publish-latest.yml`)
  - Runs on pushes to `main`
  - Builds and pushes only `ghcr.io/wixxie-dev/wixxie-home:latest`

## Release Process

1. Merge your changes to `main`
2. Create and push a semantic version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

3. Wait for the `Release` workflow to finish
4. Deploy that version by setting `WIXXIE_TAG=v0.1.0` in your environment

## Tag Immutability Pattern

- `latest` is published only from `main`
- Version tags (`vX.Y.Z`) are published only from git tags
- Normal branch pushes do not overwrite release tags

## GHCR and GitHub Permissions

Repository settings should allow workflow tokens to write:

- `contents: write` (for creating GitHub Releases)
- `packages: write` (for pushing GHCR images)

If using a Personal Access Token to push workflow changes, include:

- `repo`
- `workflow`
