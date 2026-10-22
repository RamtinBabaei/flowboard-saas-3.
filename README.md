![FlowBoard project cover](docs/cover.svg)

# FlowBoard

A React workspace for planning projects, organizing tasks, and tracking progress across Kanban, list, calendar, and analytics views.

[Open demo](https://ramtinbabaei.github.io/flowboard-saas-3./) · [Source](https://github.com/RamtinBabaei/flowboard-saas-3.) · [CI](https://github.com/RamtinBabaei/flowboard-saas-3./actions)

**React · TypeScript · Vite · React Router · Recharts · Zod · IndexedDB**

## Product experience

- Multiple workspaces with projects, members, activities, and notifications.
- Task creation and editing with assignees, priorities, labels, due dates, checklists, and comments.
- Kanban drag-and-drop with keyboard-friendly status controls.
- Searchable and sortable task lists, a monthly calendar, and workspace analytics.
- Light, dark, and system themes, responsive layouts, and a resettable demo.

## Engineering decisions

| Concern | Approach |
| --- | --- |
| Consistent views | Shared typed store keeps board, list, calendar, and dashboard data synchronized |
| Service boundary | An asynchronous mock API separates mutations from the interface |
| Persistence | IndexedDB with localStorage fallback and schema validation on reads |
| Domain logic | Dedicated modules for task filters, progress, dates, validation, and simulated permissions |
| Interaction quality | Labeled forms, focus states, dialogs, live error messages, and pointer-free status changes |

This is a frontend application with simulated accounts and role rules. Data stays in the current browser. It does not provide production authentication, server-enforced authorization, or collaboration between devices.

## Run locally

Use Node.js 24 and npm.

```sh
git clone https://github.com/RamtinBabaei/flowboard-saas-3..git
cd flowboard-saas-3.
npm ci
npm run dev
```

Open the URL printed by Vite, then select **Try demo**.

## Quality checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run preview` serves the production build locally. `npm run format:check` checks formatting.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Routes, composed screens, and interface controls |
| `src/store.tsx` | Hydration, shared application state, and mutation facade |
| `src/domain/` | Permissions, validation, and derived task data |
| `src/services/mockApi.ts` | Asynchronous application operations |
| `src/services/persistence.ts` | Browser storage and fallback handling |
| `tests/domain.test.ts` | Domain regression tests |

## Deployment

The repository includes GitHub Actions validation and Pages deployment workflows. Hash routing supports direct navigation under the repository subpath. Build output is written to `dist/`.

A server-backed version would replace the mock service with HTTP calls and move identity, permissions, and shared data to the server.

## License

Application code is available under the [MIT License](LICENSE).

Maintained by [Ramtin Babaei](https://github.com/RamtinBabaei).
