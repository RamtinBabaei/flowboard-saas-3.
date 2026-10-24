# FlowBoard architecture

## Runtime boundaries

FlowBoard is a modular monolith split across two deployable surfaces:

1. The React/Vite interface is built as a static application and deployed to GitHub Pages.
2. The TypeScript REST API runs on Cloudflare Workers and persists data in D1.

The frontend calls the API through `src/services/apiClient.ts`. `StoreProvider` selects the remote adapter when `VITE_API_BASE_URL` is present and preserves the local demo adapter for offline exploration.

## Backend modules

`api/worker.ts` owns transport and orchestration. The implementation separates concerns through small functions for authentication, authorization, validation, persistence, bootstrap projection, activity creation, and seed data. The database schema is versioned in `migrations/`.

The main business boundary is a workspace. Every project, task, comment, activity, and notification query is scoped through a workspace or authenticated user. A user can belong to multiple workspaces with one of four roles:

| Role   | Workspace | Members | Projects | Tasks/comments |
| ------ | --------- | ------- | -------- | -------------- |
| Owner  | Manage    | Manage  | Manage   | Manage         |
| Admin  | Read      | Read    | Manage   | Manage         |
| Member | Read      | Read    | Read     | Manage         |
| Viewer | Read      | Read    | Read     | Read           |

## Data flow

```text
React form
  → typed API adapter
  → /api/v1 route
  → Zod validation
  → session + workspace authorization
  → prepared D1 statements
  → bootstrap projection
  → StoreProvider refresh
```

Mutations return the current `AppData` projection. This keeps the dashboard, board, calendar, list, analytics, member, and notification screens consistent without duplicating cache invalidation rules in every component.

## Authentication

Registration creates a user, a first workspace, an Owner membership, and default settings. Login verifies a PBKDF2 password hash and creates a random session token. The raw token is sent in an HttpOnly cookie; only its SHA-256 digest is stored in D1. Session expiry is checked on each authenticated request.

The demo path provisions fictional users and sample workspaces. It is isolated from normal registration behavior and is intended for evaluation.

## Data integrity

Foreign keys and cascading deletes protect workspace-owned data. Indexes cover session expiry, workspace membership, project membership, task board queries, comments, activities, and notifications. JSON fields are limited to small task collections such as labels and checklists; relational entities remain normalized.

## Decisions

- D1 was selected because the application needs relational constraints, transactions, indexes, and a low-operations edge deployment.
- A modular monolith keeps domain rules reviewable and avoids premature service boundaries.
- The frontend retains a local demo adapter so the UI remains usable when backend credentials are unavailable during development.
- The API returns a complete typed projection after mutations to make client state deterministic and easy to test.
