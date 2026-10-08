# FlowBoard




**Live Demo:** [Open FlowBoard](https://ramtinbabaei.github.io/flowboard-saas-3./)


https://ramtinbabaei.github.io/flowboard-saas-3./

Modern project management SaaS frontend for individuals and small teams.

FlowBoard is a portfolio-ready React application that helps teams plan projects, move work through a workflow, and understand progress without a noisy dashboard. It is intentionally frontend-only: the mock API layer simulates asynchronous requests and persists demo data locally in IndexedDB, with a localStorage fallback.

## Features

- Demo authentication flow with protected app routes and session persistence.
- Multi-workspace data model with isolated members, projects, tasks, activities, and notifications.
- Project CRUD, statuses, favorites, dates, progress, and detail views.
- Task CRUD with priorities, labels, assignees, due dates, checklists, comments, activity history, and duplication.
- Interactive Kanban board with pointer drag-and-drop plus keyboard-friendly status controls.
- List view with sorting, search, and responsive task rows.
- Calendar view with month navigation, due dates, overdue styling, and date-based task creation.
- Dashboard metrics and charts derived from the active workspace state.
- Members and simulated roles: Owner, Admin, Member, Viewer.
- Inbox notifications with read state and task navigation.
- Light, dark, and system themes, compact preference, and demo reset.
- Validation with Zod, typed mock API, IndexedDB persistence, error banner, and accessible dialogs.

## Technology stack

React, TypeScript, Vite, React Router, Recharts, Lucide React, Zod, IndexedDB via `idb`, Vitest, Testing Library, ESLint, and Prettier.

## Getting started

```bash
npm install
npm run dev
```

Open the local Vite URL, select **Try demo**, and explore the workspace. The demo account is simulated; no real password or identity verification is used.

## Available scripts

| Script                 | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the development server                 |
| `npm run build`        | Run TypeScript and create a production build |
| `npm run preview`      | Serve the production build locally           |
| `npm run typecheck`    | Run strict TypeScript validation             |
| `npm run lint`         | Run ESLint                                   |
| `npm test`             | Run unit/domain tests                        |
| `npm run format:check` | Check formatting                             |

## Architecture

```text
src/
├── App.tsx                 # Routes, product surfaces, and composed UI
├── types.ts                # Shared domain types and labels
├── store.tsx               # Hydrated application state and mutation facade
├── domain/
│   ├── permissions.ts      # Centralized simulated role rules
│   ├── schema.ts           # Persisted data and form validation
│   └── selectors.ts        # Filtering, sorting, dates, progress
├── services/
│   ├── mockApi.ts          # Async mock endpoints and optimistic-friendly mutations
│   └── persistence.ts      # IndexedDB with localStorage fallback
└── mock/seed.ts             # Consistent initial demo data
```

Views read from the same centralized store. Mutations flow through the typed mock API, which checks workspace permissions, records activity, updates notifications, and persists the result. This keeps dashboard, Kanban, list, calendar, and detail surfaces synchronized.

## Accessibility

FlowBoard uses semantic controls, visible focus states, labeled forms, dialog roles, keyboard-operable filters, responsive touch targets, status controls as a pointer-free Kanban alternative, and live error messaging. Frontend role checks are a product demonstration, not a production security boundary.

## Deployment

For GitHub Pages, build the project and publish `dist/` from the `main` branch or connect the repository to the included CI workflow. The app uses hash routing so direct navigation works under a repository subpath.

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

## Known limitations

- No real backend, multi-user synchronization, email delivery, push notifications, or production authentication.
- Browser storage is device-local and can be cleared by the user or browser policy.
- The visual preview in this environment may not be reachable from the isolated browser runner; the production build remains locally verifiable with `npm run preview`.

## Future backend integration

Replace `MockApi` with typed HTTP calls, retain the domain schemas at the API boundary, move permissions to server-side authorization, add real session handling, and use TanStack Query for server cache and mutation invalidation.

## License

MIT
