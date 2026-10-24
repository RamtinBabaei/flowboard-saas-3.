# FlowBoard API

Base URL:

```text
https://flowboard-api.ramtinbabaei-portfolio.workers.dev/api/v1
```

All JSON mutation requests use `Content-Type: application/json`. Authenticated requests use the `flowboard_session` HttpOnly cookie. Successful mutations return `{ "data": AppData }`; errors return `{ "error": string, "requestId": string }`.

## Public endpoints

| Method | Path             | Purpose                               |
| ------ | ---------------- | ------------------------------------- |
| GET    | `/health`        | API and database health               |
| POST   | `/auth/demo`     | Start the fictional demo session      |
| POST   | `/auth/register` | Create an account and first workspace |
| POST   | `/auth/login`    | Create an authenticated session       |
| POST   | `/auth/logout`   | Revoke the current session            |

## Authenticated endpoints

| Method            | Path                      | Purpose                                          |
| ----------------- | ------------------------- | ------------------------------------------------ |
| GET               | `/bootstrap`              | Return the current user and workspace projection |
| POST/PATCH/DELETE | `/workspaces`             | Manage workspaces                                |
| POST/PATCH/DELETE | `/projects`               | Manage projects                                  |
| POST/PATCH/DELETE | `/tasks`                  | Manage tasks                                     |
| POST              | `/tasks/:id/comments`     | Add a task comment                               |
| POST/PATCH/DELETE | `/members`                | Manage workspace members                         |
| PATCH             | `/settings`               | Save user preferences and active workspace       |
| POST              | `/notifications/:id/read` | Mark a notification read                         |
| POST              | `/notifications/read-all` | Mark all notifications read                      |
| POST              | `/demo/reset`             | Reset fictional demo workspaces                  |

## Error status codes

- `400` malformed JSON
- `401` missing or expired session
- `403` server-side permission failure
- `404` resource or route not found
- `409` duplicate account or invalid state conflict
- `422` validation failure
- `500` unexpected server error

Every response includes an `X-Request-Id` header for debugging.
