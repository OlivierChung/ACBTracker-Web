# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start dev server (proxies /api and /health to http://localhost:5000)
npm run dev

# Type-check without emitting
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Architecture

React + Vite + TypeScript SPA that consumes the ACBTracker API (`OlivierChung/ACBTracker`).

**Stack:** React Router v6, TanStack Query v5, React Hook Form + Zod, Zustand (persist), Axios, Tailwind CSS v4.

**Key directories:**

- `src/lib/api.ts` — Axios instance with JWT request interceptor and auto-logout on 401
- `src/store/authStore.ts` — Zustand store (persisted to `localStorage` under `acb-auth`); holds `token`, `userId`, `email`
- `src/types/index.ts` — All TypeScript interfaces and enums mirroring the backend domain
- `src/lib/queryKeys.ts` — Centralized TanStack Query key factory; always use these, never inline keys
- `src/hooks/` — One file per resource (`usePortfolios`, `useAccounts`, `useTransactions`, `useExchangeRate`)
- `src/pages/` — Route-level components (one per route)
- `src/components/` — Shared components: `Layout` (nav + outlet), `ProtectedRoute` (redirects to `/login` if no token)

**Route tree** (defined in `src/App.tsx`):
```
/login              → LoginPage (public)
/register           → RegisterPage (public)
/                   → ProtectedRoute → Layout → PortfoliosPage
/portfolios/:id     → PortfolioPage
/portfolios/:id/accounts/:accountId → AccountPage
```

## Data fetching conventions

- Use TanStack Query for all server state; never store server data in component state
- `staleTime: Infinity` for immutable data (e.g., historical exchange rates)
- Invalidate parent + child query keys after mutations (see `useTransactions.ts` for the pattern)
- The `useExchangeRate` hook is `enabled: false` by default; callers pass `enabled = !!tradeDate && currency !== 'CAD'`

## Auth flow

1. `LoginPage` POSTs to `/api/auth/login`, receives `{ token, userId, email }`
2. Calls `useAuthStore.login(token, userId, email)` which persists to localStorage
3. Axios interceptor reads `token` from the store on every request
4. On 401, interceptor calls `logout()` and redirects to `/login`

## Git workflow — non-negotiable

**Never commit directly to `master`.** All work goes on a feature branch.

```bash
git checkout master && git pull
git checkout -b feature/<short-description>   # e.g. feature/profile-page

# When done — run the pre-PR checklist below, then:
git push -u origin feature/<short-description>
gh pr create --repo OlivierChung/ACBTracker-Web ...
# Wait for the user to merge — never merge yourself unless explicitly told to
```

- Branch names: `feature/<kebab-case>` for new work, `fix/<kebab-case>` for bug fixes
- One logical change per branch
- Always include the co-author trailer:
  ```
  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  ```

## Pre-PR checklist

Both steps must pass before `gh pr create`:

```bash
# 1. Type-check
npx tsc --noEmit

# 2. Lint
npm run lint
```

## Proxy

The dev server proxies `/api/*` and `/health` to `http://localhost:5000` (the ACBTracker API). No CORS config is needed in dev. In production, configure the reverse proxy (Caddy) to route these paths to the API server.
