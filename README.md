![FlowBoard project cover](docs/cover.svg)

# FlowBoard

FlowBoard is a full-stack project management workspace for teams that plan work, organize tasks, and track progress across Kanban, list, calendar, and analytics views.

**[Live demo](https://ramtinbabaei.github.io/flowboard-saas-3./)** · **[API health](https://flowboard-api.ramtinbabaei-portfolio.workers.dev/api/v1/health)** · [Architecture](docs/ARCHITECTURE.md) · [API reference](docs/API.md)

## Product capabilities

- Multi-workspace project management with Owner, Admin, Member, and Viewer roles.
- Task creation, editing, assignment, priorities, labels, checklists, due dates, comments, and activity history.
- Kanban, list, calendar, dashboard, analytics, settings, and notification views.
- Server-side authentication with secure session cookies and password hashing.
- Database-backed workspaces, members, projects, tasks, comments, activities, notifications, and user settings.
- Server-enforced workspace permissions and object-level access checks.
- Validated API requests, consistent JSON errors, request IDs, and no client-trusted permissions.
- Responsive React interface with accessible forms, focus states, reduced-motion support, and resilient loading/error states.

## Technology stack

| Layer          | Technology                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Interface      | React 18, TypeScript, Vite, React Router, Tailwind-compatible design tokens                    |
| State          | Typed application store with a remote API adapter and a local demo fallback                    |
| API            | TypeScript Cloudflare Worker with versioned REST endpoints                                     |
| Database       | Cloudflare D1 SQLite with foreign keys, indexes, constraints, and migrations                   |
| Validation     | Zod schemas at the application boundary                                                        |
| Authentication | PBKDF2 password hashing, SHA-256 session digests, HttpOnly cookies, expiration, and revocation |
| Hosting        | GitHub Pages for the interface and Cloudflare Workers for the API                              |
| Testing        | Vitest, Testing Library, Wrangler local checks, and Playwright-ready workflows                 |
| Delivery       | GitHub Actions for quality checks, Pages deployment, and API deployment                        |

## Architecture

FlowBoard uses a modular monolith. The browser owns presentation and typed client state; the Worker owns authentication, authorization, business rules, and persistence. D1 is accessed through prepared statements and versioned SQL migrations. The API and frontend use a same-contract `AppData` bootstrap response so all views remain synchronized after mutations.

```text
React + TypeScript UI
        │ HTTPS / JSON
        ▼
Cloudflare Worker REST API
        │ prepared SQL
        ▼
Cloudflare D1
```

The API is deployed separately so the static interface remains cacheable on GitHub Pages. Production builds point to the Worker through `VITE_API_BASE_URL`; local development can use the local demo fallback or a Wrangler Worker.

## Local development

Requirements: Node.js 24 and npm.

```sh
git clone https://github.com/RamtinBabaei/flowboard-saas-3..git
cd flowboard-saas-3.
npm ci
npm run dev
```

The interface runs on the Vite URL. Without `VITE_API_BASE_URL`, it uses the original local demo adapter. To run the API locally:

```sh
npm run db:migrate:local
npm run dev:api
```

Create `.env.local` from `.env.example` and set `VITE_API_BASE_URL=http://localhost:8787`. Run the frontend and API in separate terminals. Local D1 state is stored by Wrangler under `.wrangler/` and is ignored by Git.

## Quality checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run build:api
npm run format:check
```

The CI workflow runs these checks on pushes and pull requests. The API health endpoint is `GET /api/v1/health`.

## Deployment

The interface deploys through GitHub Pages using `.github/workflows/deploy.yml`. The workflow injects the public API base URL at build time.

The API uses `wrangler.jsonc`, D1 migrations, and `.github/workflows/deploy-api.yml`. Configure these GitHub Actions secrets before enabling automatic API deployment:

- `CLOUDFLARE_API_TOKEN` with Workers and D1 deployment permissions.
- `CLOUDFLARE_ACCOUNT_ID` for the Cloudflare account.

Production migrations are applied before the Worker deployment. Secrets are never committed to the repository.

## Demo account

Use **Try demo** on the landing page. The demo endpoint provisions the sample workspace data and starts a server-side session. The public demo uses fictional data.

## Security notes

- Passwords are hashed with PBKDF2-SHA-256 and independent salts.
- Session values are random opaque tokens; only SHA-256 digests are stored.
- Cookies are HttpOnly and use Secure/SameSite settings in HTTPS deployments.
- Workspace permissions are checked on the server for every mutation.
- SQL uses prepared statements and foreign-key constraints.
- Request bodies are validated with Zod and response errors avoid leaking internal details.
- Production secrets belong in Cloudflare or GitHub Actions secret storage.

## Known limitations

- Password reset emails, email verification, MFA, and invitation emails require an email provider configuration.
- Realtime collaboration is not enabled; the current interface refreshes its bootstrap after mutations.
- The public demo uses fictional data and is intended for portfolio evaluation rather than commercial operation.

## License

Application code is available under the MIT License.

Maintained by [Ramtin Babaei](https://github.com/RamtinBabaei).
