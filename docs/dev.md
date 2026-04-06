# Development Guide

This guide is for contributors working on Wixxie Home locally.

## Requirements

- Bun 1.3+

## Install Dependencies

```bash
bun install
```

## Run in Development Mode

Run backend and frontend together:

```bash
bun run dev
```

App endpoints:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

## Build

```bash
bun run build
```

## Run Production Backend Locally

Serves frontend build from `frontend/dist`:

```bash
bun run start
```

## Environment Variables

- `PORT` (default `3000`)
- `POLL_INTERVAL_MS` (default `300000`)
- `JWT_SECRET` (required in production)
- `DISABLE_REGISTRATION` (`true` or `false`)
