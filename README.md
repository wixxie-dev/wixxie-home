# Wixxie Home

A Bun-based homelab landing dashboard with:

- Multi-user dashboards (each user has isolated services, tags, and settings)
- Drag-and-drop card ordering + pinned section
- Predefined app templates: Immich, Portainer, Home Assistant, Sonarr, Radarr, Uptime Kuma, Jellyfin, SABnzbd
- Optional API-backed stats per predefined app
- Dark/light/system theme
- Settings page for default web search engine, site tab title, and custom favicon upload

## Docs

- User/deploy guide: `README.md`
- Development guide: `docs/dev.md`
- CI and release guide: `docs/release-ci.md`

## Docker

Run using Docker Compose:

```bash
docker compose pull
docker compose up -d
```

Dashboard will be available at:

- `http://localhost` (port `80`)

Data is persisted to:

- SQLite DB: `backend/data/wixxie-home.db`
- Uploaded favicons/icons: `backend/data/uploads/`

## Deploy with GHCR image

The compose file is set up to pull a published image from GitHub Container Registry:

- `ghcr.io/wixxie-dev/wixxie-home:latest`
- `ghcr.io/wixxie-dev/wixxie-home:vX.Y.Z`

Required environment variables:

```bash
export JWT_SECRET="replace-this-with-a-strong-secret"
```

Optional deployment image tag (defaults to `latest`):

```bash
export WIXXIE_TAG="v0.1.0"
```

Pull and run:

```bash
docker compose pull
docker compose up -d
```

### Copy/paste `docker-compose.yml` example

```yaml
services:
  wixxie-home:
    image: ghcr.io/wixxie-dev/wixxie-home:${WIXXIE_TAG:-latest}
    container_name: wixxie-home
    pull_policy: always
    ports:
      - "80:3000"
    environment:
      - PORT=3000
      - POLL_INTERVAL_MS=300000
      - JWT_SECRET=${JWT_SECRET:?JWT_SECRET is required}
      - DISABLE_REGISTRATION=false
    volumes:
      - ./backend/data:/app/backend/data
    restart: unless-stopped
```

If you need HTTPS, terminate TLS at a reverse proxy (for example Caddy, Traefik, or Nginx) and proxy to this container over HTTP on port `3000`. Mapping `443` directly to this container will trigger warnings because the app does not serve TLS by itself.

## Maintainer Docs

For CI, release workflow behavior, and tag strategy, see:

- `docs/release-ci.md`

## Environment Variables

For full development and runtime env var details, see `docs/dev.md`.

## Notes

- Predefined app API endpoints can vary by version and deployment. If a stats call fails, the card still works as a launcher.
- Services can be pinned by toggling pin or dragging into the pinned list.
