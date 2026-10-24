import { seedData } from "../src/mock/seed";
import type {
  AppData,
  Project,
  Task,
  User,
  WorkspaceMember,
} from "../src/types";
import {
  commentSchema,
  memberSchema,
  projectSchema,
  settingsSchema,
  taskSchema,
  workspaceSchema,
  authSchema,
} from "./validation";
import {
  digest,
  hashPassword,
  parseCookies,
  sessionCookie,
  token,
  verifyPassword,
} from "./security";

export interface Env {
  DB: D1Database;
  FRONTEND_ORIGIN?: string;
  ENVIRONMENT?: string;
}

type Auth = { user: User; userId: string };
type Row = Record<string, unknown>;

const json = (value: unknown, init: ResponseInit = {}, request?: Request) => {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  const requestId = crypto.randomUUID();
  headers.set("X-Request-Id", requestId);
  if (request)
    headers.set("Access-Control-Allow-Origin", allowedOrigin(request));
  if (request) headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(JSON.stringify(value), { ...init, headers });
};

function allowedOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin) return "*";
  if (
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  )
    return origin;
  return "https://ramtinbabaei.github.io";
}

function withCors(response: Response, request: Request) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", allowedOrigin(request));
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Expose-Headers", "X-Request-Id");
  return new Response(response.body, { status: response.status, headers });
}

async function body(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function userFromRow(row: Row): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    initials: String(row.initials),
    avatar: row.avatar ? String(row.avatar) : undefined,
  };
}

async function getAuth(request: Request, env: Env): Promise<Auth | null> {
  const raw = parseCookies(request).flowboard_session;
  if (!raw) return null;
  const tokenHash = await digest(raw);
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`,
  )
    .bind(tokenHash, Date.now())
    .first<Row>();
  if (!row) return null;
  return { user: userFromRow(row), userId: String(row.id) };
}

async function requireAuth(request: Request, env: Env) {
  const auth = await getAuth(request, env);
  if (!auth) throw new HttpError(401, "Sign in is required.");
  return auth;
}

async function query<T extends Row = Row>(
  env: Env,
  sql: string,
  ...values: unknown[]
) {
  return (
    await env.DB.prepare(sql)
      .bind(...values)
      .all<T>()
  ).results;
}

async function one<T extends Row = Row>(
  env: Env,
  sql: string,
  ...values: unknown[]
) {
  return (
    (await env.DB.prepare(sql)
      .bind(...values)
      .first<T>()) ?? null
  );
}

async function run(env: Env, sql: string, ...values: unknown[]) {
  return env.DB.prepare(sql)
    .bind(...values)
    .run();
}

async function roleFor(env: Env, userId: string, workspaceId: string) {
  const row = await one<{ role: string }>(
    env,
    "SELECT role FROM members WHERE user_id=? AND workspace_id=?",
    userId,
    workspaceId,
  );
  return row?.role as WorkspaceMember["role"] | undefined;
}

function can(
  role: WorkspaceMember["role"] | undefined,
  action: "workspace" | "members" | "projects" | "tasks" | "comments",
) {
  if (!role) return false;
  if (action === "workspace" || action === "members") return role === "Owner";
  if (action === "projects") return role === "Owner" || role === "Admin";
  return role === "Owner" || role === "Admin" || role === "Member";
}

async function requirePermission(
  env: Env,
  auth: Auth,
  workspaceId: string,
  action: "workspace" | "members" | "projects" | "tasks" | "comments",
) {
  const role = await roleFor(env, auth.userId, workspaceId);
  if (!can(role, action))
    throw new HttpError(
      403,
      "You do not have permission for this workspace action.",
    );
  return role;
}

async function userRows(env: Env, userIds: string[]) {
  if (!userIds.length) return [];
  const placeholders = userIds.map(() => "?").join(",");
  return query(
    env,
    `SELECT id,name,email,initials,avatar FROM users WHERE id IN (${placeholders})`,
    ...userIds,
  );
}

async function bootstrap(env: Env, auth: Auth): Promise<AppData> {
  const workspaceRows = await query(
    env,
    `SELECT DISTINCT w.* FROM workspaces w JOIN members m ON m.workspace_id=w.id WHERE m.user_id=? ORDER BY w.created_at`,
    auth.userId,
  );
  const workspaceIds = workspaceRows.map((row) => String(row.id));
  if (!workspaceIds.length)
    throw new HttpError(409, "Your account has no workspace.");
  const workspacePlaceholders = workspaceIds.map(() => "?").join(",");
  const memberRows = await query(
    env,
    `SELECT m.id,m.workspace_id,m.role,m.joined_at,u.id user_id,u.name,u.email,u.initials,u.avatar FROM members m JOIN users u ON u.id=m.user_id WHERE m.workspace_id IN (${workspacePlaceholders}) ORDER BY m.joined_at`,
    ...workspaceIds,
  );
  const projectRows = await query(
    env,
    `SELECT * FROM projects WHERE workspace_id IN (${workspacePlaceholders}) ORDER BY created_at`,
    ...workspaceIds,
  );
  const projectIds = projectRows.map((row) => String(row.id));
  const projectMemberRows = projectIds.length
    ? await query(
        env,
        `SELECT project_id,user_id FROM project_members WHERE project_id IN (${projectIds.map(() => "?").join(",")})`,
        ...projectIds,
      )
    : [];
  const taskRows = await query(
    env,
    `SELECT * FROM tasks WHERE workspace_id IN (${workspacePlaceholders}) ORDER BY created_at`,
    ...workspaceIds,
  );
  const taskIds = taskRows.map((row) => String(row.id));
  const commentRows = taskIds.length
    ? await query(
        env,
        `SELECT * FROM comments WHERE task_id IN (${taskIds.map(() => "?").join(",")}) ORDER BY created_at`,
        ...taskIds,
      )
    : [];
  const activities = await query(
    env,
    `SELECT * FROM activities WHERE workspace_id IN (${workspacePlaceholders}) ORDER BY created_at DESC LIMIT 100`,
    ...workspaceIds,
  );
  const notifications = await query(
    env,
    `SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100`,
    auth.userId,
  );
  const settingsRow = await one(
    env,
    "SELECT * FROM settings WHERE user_id=?",
    auth.userId,
  );

  const members: WorkspaceMember[] = memberRows.map((row) => ({
    id: String(row.user_id),
    name: String(row.name),
    email: String(row.email),
    initials: String(row.initials),
    avatar: row.avatar ? String(row.avatar) : undefined,
    workspaceId: String(row.workspace_id),
    role: String(row.role) as WorkspaceMember["role"],
    joinedAt: new Date(Number(row.joined_at)).toISOString(),
  }));
  const projects: Project[] = projectRows.map((row) => ({
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    name: String(row.name),
    description: String(row.description),
    status: String(row.status) as Project["status"],
    color: String(row.color),
    icon: String(row.icon) as Project["icon"],
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    memberIds: projectMemberRows
      .filter((member) => String(member.project_id) === String(row.id))
      .map((member) => String(member.user_id)),
    favorite: Boolean(row.favorite),
  }));
  const tasks: Task[] = taskRows.map((row) => ({
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    projectId: String(row.project_id),
    title: String(row.title),
    description: String(row.description),
    status: String(row.status) as Task["status"],
    priority: String(row.priority) as Task["priority"],
    assigneeId: row.assignee_id ? String(row.assignee_id) : undefined,
    creatorId: String(row.creator_id),
    dueDate: row.due_date ? String(row.due_date) : undefined,
    createdAt: new Date(Number(row.created_at)).toISOString(),
    updatedAt: new Date(Number(row.updated_at)).toISOString(),
    labels: JSON.parse(String(row.labels_json || "[]")),
    comments: commentRows
      .filter((comment) => String(comment.task_id) === String(row.id))
      .map((comment) => ({
        id: String(comment.id),
        authorId: String(comment.author_id),
        body: String(comment.body),
        createdAt: new Date(Number(comment.created_at)).toISOString(),
      })),
    checklist: JSON.parse(String(row.checklist_json || "[]")),
    estimate: row.estimate == null ? undefined : Number(row.estimate),
    order: Number(row.sort_order),
  }));
  return {
    version: 2,
    user: auth.user,
    workspaces: workspaceRows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      description: String(row.description),
      color: String(row.color),
      ownerId: String(row.owner_id),
    })),
    members,
    projects,
    tasks,
    activities: activities.map((row) => ({
      id: String(row.id),
      taskId: row.task_id ? String(row.task_id) : undefined,
      projectId: row.project_id ? String(row.project_id) : undefined,
      workspaceId: String(row.workspace_id),
      actorId: String(row.actor_id),
      type: String(row.type),
      message: String(row.message),
      createdAt: new Date(Number(row.created_at)).toISOString(),
    })),
    notifications: notifications.map((row) => ({
      id: String(row.id),
      workspaceId: String(row.workspace_id),
      userId: String(row.user_id),
      title: String(row.title),
      body: String(row.body),
      type: String(row.type) as AppData["notifications"][number]["type"],
      read: Boolean(row.read),
      createdAt: new Date(Number(row.created_at)).toISOString(),
      taskId: row.task_id ? String(row.task_id) : undefined,
      projectId: row.project_id ? String(row.project_id) : undefined,
    })),
    settings: {
      theme: String(
        settingsRow?.theme ?? "system",
      ) as AppData["settings"]["theme"],
      emailNotifications: Boolean(settingsRow?.email_notifications ?? 1),
      compactMode: Boolean(settingsRow?.compact_mode ?? 0),
    },
    activeWorkspaceId: String(
      settingsRow?.active_workspace_id ?? workspaceRows[0].id,
    ),
  };
}

async function addActivity(
  env: Env,
  workspaceId: string,
  actorId: string,
  message: string,
  type: string,
  taskId?: string,
  projectId?: string,
) {
  await run(
    env,
    "INSERT INTO activities(id,workspace_id,actor_id,task_id,project_id,type,message,created_at) VALUES(?,?,?,?,?,?,?,?)",
    id("activity"),
    workspaceId,
    actorId,
    taskId ?? null,
    projectId ?? null,
    type,
    message,
    Date.now(),
  );
}

async function seedDemo(env: Env) {
  const seed = seedData();
  const passwordHash = await hashPassword("flowboard");
  for (const member of seed.members) {
    await run(
      env,
      "INSERT OR IGNORE INTO users(id,name,email,initials,password_hash,created_at) VALUES(?,?,?,?,?,?)",
      member.id,
      member.name,
      member.email,
      member.initials,
      passwordHash,
      Date.now(),
    );
  }
  for (const workspace of seed.workspaces)
    await run(
      env,
      "INSERT OR IGNORE INTO workspaces(id,name,description,color,owner_id,created_at) VALUES(?,?,?,?,?,?)",
      workspace.id,
      workspace.name,
      workspace.description,
      workspace.color,
      workspace.ownerId,
      Date.now(),
    );
  for (const member of seed.members)
    await run(
      env,
      "INSERT OR IGNORE INTO members(id,workspace_id,user_id,role,joined_at) VALUES(?,?,?,?,?)",
      id("member"),
      member.workspaceId,
      member.id,
      member.role,
      Date.parse(member.joinedAt),
    );
  for (const project of seed.projects) {
    await run(
      env,
      "INSERT OR IGNORE INTO projects(id,workspace_id,name,description,status,color,icon,start_date,end_date,favorite,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      project.id,
      project.workspaceId,
      project.name,
      project.description,
      project.status,
      project.color,
      project.icon ?? "folder",
      project.startDate,
      project.endDate,
      project.favorite ? 1 : 0,
      Date.now(),
    );
    for (const memberId of project.memberIds)
      await run(
        env,
        "INSERT OR IGNORE INTO project_members(project_id,user_id) VALUES(?,?)",
        project.id,
        memberId,
      );
  }
  for (const task of seed.tasks)
    await run(
      env,
      "INSERT OR IGNORE INTO tasks(id,workspace_id,project_id,title,description,status,priority,assignee_id,creator_id,due_date,created_at,updated_at,labels_json,checklist_json,estimate,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      task.id,
      task.workspaceId,
      task.projectId,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.assigneeId ?? null,
      task.creatorId,
      task.dueDate ?? null,
      Date.parse(task.createdAt),
      Date.parse(task.updatedAt),
      JSON.stringify(task.labels),
      JSON.stringify(task.checklist),
      task.estimate ?? null,
      task.order,
    );
  for (const activity of seed.activities)
    await run(
      env,
      "INSERT OR IGNORE INTO activities(id,workspace_id,actor_id,task_id,project_id,type,message,created_at) VALUES(?,?,?,?,?,?,?,?)",
      activity.id,
      activity.workspaceId,
      activity.actorId,
      activity.taskId ?? null,
      activity.projectId ?? null,
      activity.type,
      activity.message,
      Date.parse(activity.createdAt),
    );
  for (const notification of seed.notifications)
    await run(
      env,
      "INSERT OR IGNORE INTO notifications(id,workspace_id,user_id,title,body,type,read,task_id,project_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
      notification.id,
      notification.workspaceId,
      notification.userId,
      notification.title,
      notification.body,
      notification.type,
      notification.read ? 1 : 0,
      notification.taskId ?? null,
      notification.projectId ?? null,
      Date.parse(notification.createdAt),
    );
  await run(
    env,
    "INSERT OR IGNORE INTO settings(user_id,theme,email_notifications,compact_mode,active_workspace_id) VALUES(?,?,?,?,?)",
    "u-me",
    "system",
    1,
    0,
    "w-product",
  );
}

async function resetDemo(env: Env) {
  await run(env, "DELETE FROM workspaces WHERE owner_id=?", "u-me");
  await run(
    env,
    "DELETE FROM users WHERE id NOT IN ('u-me','u-ava','u-noah','u-samira','u-eli') AND id NOT IN (SELECT user_id FROM members)",
  );
  await seedDemo(env);
}

async function authResponse(
  request: Request,
  env: Env,
  userId: string,
  status = 200,
) {
  const session = token();
  await run(
    env,
    "INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)",
    await digest(session),
    userId,
    Date.now() + 7 * 86400000,
    Date.now(),
  );
  const auth = await getAuth(
    new Request(request, {
      headers: new Headers({ Cookie: `flowboard_session=${session}` }),
    }),
    env,
  );
  if (!auth) throw new HttpError(500, "Unable to create a session.");
  const response = json(
    { data: await bootstrap(env, auth) },
    {
      status,
      headers: { "Set-Cookie": sessionCookie(request, session, 7 * 86400) },
    },
    request,
  );
  return response;
}

async function createAccount(request: Request, env: Env, input: unknown) {
  const parsed = authSchema
    .extend({ name: authSchema.shape.name.unwrap() })
    .safeParse(input);
  if (!parsed.success)
    throw new HttpError(
      422,
      parsed.error.issues[0]?.message ?? "Invalid account details.",
    );
  const existing = await one(
    env,
    "SELECT id FROM users WHERE email=?",
    parsed.data.email,
  );
  if (existing)
    throw new HttpError(409, "An account with this email already exists.");
  const userId = id("user");
  await run(
    env,
    "INSERT INTO users(id,name,email,initials,password_hash,created_at) VALUES(?,?,?,?,?,?)",
    userId,
    parsed.data.name,
    parsed.data.email,
    parsed.data.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    await hashPassword(parsed.data.password),
    Date.now(),
  );
  const workspaceId = id("workspace");
  await run(
    env,
    "INSERT INTO workspaces(id,name,description,color,owner_id,created_at) VALUES(?,?,?,?,?,?)",
    workspaceId,
    "My Workspace",
    "A focused space for your work.",
    "#4f46e5",
    userId,
    Date.now(),
  );
  await run(
    env,
    "INSERT INTO members(id,workspace_id,user_id,role,joined_at) VALUES(?,?,?,?,?)",
    id("member"),
    workspaceId,
    userId,
    "Owner",
    Date.now(),
  );
  await run(
    env,
    "INSERT INTO settings(user_id,theme,email_notifications,compact_mode,active_workspace_id) VALUES(?,?,?,?,?)",
    userId,
    "system",
    1,
    0,
    workspaceId,
  );
  return authResponse(request, env, userId, 201);
}

async function login(request: Request, env: Env, input: unknown) {
  const parsed = authSchema.omit({ name: true }).safeParse(input);
  if (!parsed.success)
    throw new HttpError(
      422,
      parsed.error.issues[0]?.message ?? "Invalid credentials.",
    );
  const row = await one<Row>(
    env,
    "SELECT * FROM users WHERE email=?",
    parsed.data.email,
  );
  if (
    !row ||
    !(await verifyPassword(parsed.data.password, String(row.password_hash)))
  )
    throw new HttpError(401, "Email or password is incorrect.");
  return authResponse(request, env, String(row.id));
}

async function mutation(
  request: Request,
  env: Env,
  auth: Auth,
  path: string,
  input: any,
) {
  if (path === "/settings") {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) throw new HttpError(422, "Invalid settings.");
    const existing = await one(
      env,
      "SELECT * FROM settings WHERE user_id=?",
      auth.userId,
    );
    await run(
      env,
      "UPDATE settings SET theme=?,email_notifications=?,compact_mode=?,active_workspace_id=? WHERE user_id=?",
      parsed.data.theme ?? existing?.theme ?? "system",
      parsed.data.emailNotifications == null
        ? (existing?.email_notifications ?? 1)
        : parsed.data.emailNotifications
          ? 1
          : 0,
      parsed.data.compactMode == null
        ? (existing?.compact_mode ?? 0)
        : parsed.data.compactMode
          ? 1
          : 0,
      parsed.data.activeWorkspaceId ?? existing?.active_workspace_id,
      auth.userId,
    );
    return bootstrap(env, auth);
  }
  if (path === "/workspaces" && request.method === "POST") {
    const parsed = workspaceSchema.safeParse(input);
    if (!parsed.success) throw new HttpError(422, "Invalid workspace.");
    const workspaceId = id("workspace");
    await run(
      env,
      "INSERT INTO workspaces(id,name,description,color,owner_id,created_at) VALUES(?,?,?,?,?,?)",
      workspaceId,
      parsed.data.name,
      parsed.data.description,
      parsed.data.color,
      auth.userId,
      Date.now(),
    );
    await run(
      env,
      "INSERT INTO members(id,workspace_id,user_id,role,joined_at) VALUES(?,?,?,?,?)",
      id("member"),
      workspaceId,
      auth.userId,
      "Owner",
      Date.now(),
    );
    await run(
      env,
      "UPDATE settings SET active_workspace_id=? WHERE user_id=?",
      workspaceId,
      auth.userId,
    );
    return bootstrap(env, auth);
  }
  const workspaceMatch = path.match(/^\/workspaces\/([^/]+)$/);
  if (workspaceMatch && request.method === "PATCH") {
    const workspaceId = workspaceMatch[1];
    await requirePermission(env, auth, workspaceId, "workspace");
    const parsed = workspaceSchema.partial().safeParse(input);
    if (!parsed.success) throw new HttpError(422, "Invalid workspace.");
    const current = await one(
      env,
      "SELECT * FROM workspaces WHERE id=?",
      workspaceId,
    );
    if (!current) throw new HttpError(404, "Workspace not found.");
    await run(
      env,
      "UPDATE workspaces SET name=?,description=?,color=? WHERE id=?",
      parsed.data.name ?? current.name,
      parsed.data.description ?? current.description,
      parsed.data.color ?? current.color,
      workspaceId,
    );
    return bootstrap(env, auth);
  }
  if (workspaceMatch && request.method === "DELETE") {
    const workspaceId = workspaceMatch[1];
    await requirePermission(env, auth, workspaceId, "workspace");
    const count = await one<{ count: number }>(
      env,
      "SELECT COUNT(*) count FROM members WHERE user_id=?",
      auth.userId,
    );
    if (Number(count?.count ?? 0) <= 1)
      throw new HttpError(409, "Keep at least one workspace.");
    await run(env, "DELETE FROM workspaces WHERE id=?", workspaceId);
    return bootstrap(env, auth);
  }
  if (path === "/projects" && request.method === "POST") {
    const parsed = projectSchema.safeParse(input);
    if (!parsed.success) throw new HttpError(422, "Invalid project.");
    const workspaceId = String(
      input.workspaceId ??
        (
          await one(
            env,
            "SELECT active_workspace_id FROM settings WHERE user_id=?",
            auth.userId,
          )
        )?.active_workspace_id,
    );
    await requirePermission(env, auth, workspaceId, "projects");
    const projectId = id("project");
    await run(
      env,
      "INSERT INTO projects(id,workspace_id,name,description,status,color,icon,start_date,end_date,favorite,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      projectId,
      workspaceId,
      parsed.data.name,
      parsed.data.description,
      parsed.data.status,
      parsed.data.color,
      parsed.data.icon,
      parsed.data.startDate,
      parsed.data.endDate,
      parsed.data.favorite ? 1 : 0,
      Date.now(),
    );
    for (const memberId of parsed.data.memberIds.length
      ? parsed.data.memberIds
      : [auth.userId])
      await run(
        env,
        "INSERT OR IGNORE INTO project_members(project_id,user_id) VALUES(?,?)",
        projectId,
        memberId,
      );
    await addActivity(
      env,
      workspaceId,
      auth.userId,
      `created “${parsed.data.name}”`,
      `project`,
      undefined,
      projectId,
    );
    return bootstrap(env, auth);
  }
  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const projectId = projectMatch[1];
    const project = await one(
      env,
      "SELECT * FROM projects WHERE id=?",
      projectId,
    );
    if (!project) throw new HttpError(404, "Project not found.");
    await requirePermission(
      env,
      auth,
      String(project.workspace_id),
      "projects",
    );
    if (request.method === "DELETE") {
      await run(env, "DELETE FROM projects WHERE id=?", projectId);
      return bootstrap(env, auth);
    }
    if (request.method === "PATCH") {
      const parsed = projectSchema.partial().safeParse(input);
      if (!parsed.success) throw new HttpError(422, "Invalid project.");
      await run(
        env,
        "UPDATE projects SET name=?,description=?,status=?,color=?,icon=?,start_date=?,end_date=?,favorite=? WHERE id=?",
        parsed.data.name ?? project.name,
        parsed.data.description ?? project.description,
        parsed.data.status ?? project.status,
        parsed.data.color ?? project.color,
        parsed.data.icon ?? project.icon,
        parsed.data.startDate ?? project.start_date,
        parsed.data.endDate ?? project.end_date,
        parsed.data.favorite == null
          ? project.favorite
          : parsed.data.favorite
            ? 1
            : 0,
        projectId,
      );
      return bootstrap(env, auth);
    }
  }
  if (path === "/tasks" && request.method === "POST") {
    const parsed = taskSchema.safeParse(input);
    if (!parsed.success) throw new HttpError(422, "Invalid task.");
    const project = await one(
      env,
      "SELECT * FROM projects WHERE id=?",
      parsed.data.projectId,
    );
    if (!project) throw new HttpError(404, "Project not found.");
    await requirePermission(env, auth, String(project.workspace_id), "tasks");
    const taskId = id("task");
    const sort = await one<{ count: number }>(
      env,
      "SELECT COUNT(*) count FROM tasks WHERE project_id=? AND status=?",
      parsed.data.projectId,
      parsed.data.status,
    );
    await run(
      env,
      "INSERT INTO tasks(id,workspace_id,project_id,title,description,status,priority,assignee_id,creator_id,due_date,created_at,updated_at,labels_json,checklist_json,estimate,sort_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      taskId,
      project.workspace_id,
      parsed.data.projectId,
      parsed.data.title,
      parsed.data.description,
      parsed.data.status,
      parsed.data.priority,
      parsed.data.assigneeId ?? null,
      auth.userId,
      parsed.data.dueDate ?? null,
      Date.now(),
      Date.now(),
      JSON.stringify(parsed.data.labels),
      JSON.stringify(parsed.data.checklist),
      parsed.data.estimate ?? null,
      sort?.count ?? 0,
    );
    await addActivity(
      env,
      String(project.workspace_id),
      auth.userId,
      `created “${parsed.data.title}”`,
      `create-task`,
      taskId,
      parsed.data.projectId,
    );
    return bootstrap(env, auth);
  }
  const taskMatch = path.match(/^\/tasks\/([^/]+)$/);
  if (taskMatch) {
    const taskId = taskMatch[1];
    const task = await one(env, "SELECT * FROM tasks WHERE id=?", taskId);
    if (!task) throw new HttpError(404, "Task not found.");
    await requirePermission(env, auth, String(task.workspace_id), "tasks");
    if (request.method === "DELETE") {
      await run(env, "DELETE FROM tasks WHERE id=?", taskId);
      return bootstrap(env, auth);
    }
    if (request.method === "PATCH") {
      const parsed = taskSchema.partial().safeParse(input);
      if (!parsed.success) throw new HttpError(422, "Invalid task.");
      await run(
        env,
        "UPDATE tasks SET title=?,description=?,status=?,priority=?,assignee_id=?,due_date=?,labels_json=?,checklist_json=?,estimate=?,updated_at=? WHERE id=?",
        parsed.data.title ?? task.title,
        parsed.data.description ?? task.description,
        parsed.data.status ?? task.status,
        parsed.data.priority ?? task.priority,
        parsed.data.assigneeId === undefined
          ? task.assignee_id
          : parsed.data.assigneeId || null,
        parsed.data.dueDate === undefined
          ? task.due_date
          : parsed.data.dueDate || null,
        parsed.data.labels
          ? JSON.stringify(parsed.data.labels)
          : task.labels_json,
        parsed.data.checklist
          ? JSON.stringify(parsed.data.checklist)
          : task.checklist_json,
        parsed.data.estimate === undefined
          ? task.estimate
          : parsed.data.estimate,
        Date.now(),
        taskId,
      );
      await addActivity(
        env,
        String(task.workspace_id),
        auth.userId,
        `updated “${task.title}”`,
        `update-task`,
        taskId,
        String(task.project_id),
      );
      return bootstrap(env, auth);
    }
  }
  const commentMatch = path.match(/^\/tasks\/([^/]+)\/comments$/);
  if (commentMatch && request.method === "POST") {
    const task = await one(
      env,
      "SELECT * FROM tasks WHERE id=?",
      commentMatch[1],
    );
    if (!task) throw new HttpError(404, "Task not found.");
    await requirePermission(env, auth, String(task.workspace_id), "comments");
    const parsed = commentSchema.safeParse(input);
    if (!parsed.success) throw new HttpError(422, "Comment is required.");
    await run(
      env,
      "INSERT INTO comments(id,task_id,author_id,body,created_at) VALUES(?,?,?,?,?)",
      id("comment"),
      commentMatch[1],
      auth.userId,
      parsed.data.body,
      Date.now(),
    );
    await addActivity(
      env,
      String(task.workspace_id),
      auth.userId,
      "commented on a task",
      "comment",
      commentMatch[1],
      String(task.project_id),
    );
    return bootstrap(env, auth);
  }
  if (path === "/members" && request.method === "POST") {
    const parsed = memberSchema.safeParse(input);
    if (!parsed.success) throw new HttpError(422, "Invalid member.");
    await requirePermission(env, auth, parsed.data.workspaceId, "members");
    let member = await one(
      env,
      "SELECT id FROM users WHERE email=?",
      parsed.data.email,
    );
    let userId = member ? String(member.id) : id("user");
    if (!member)
      await run(
        env,
        "INSERT INTO users(id,name,email,initials,password_hash,created_at) VALUES(?,?,?,?,?,?)",
        userId,
        parsed.data.name,
        parsed.data.email,
        parsed.data.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        await hashPassword("flowboard"),
        Date.now(),
      );
    await run(
      env,
      "INSERT OR REPLACE INTO members(id,workspace_id,user_id,role,joined_at) VALUES(?,?,?,?,?)",
      id("member"),
      parsed.data.workspaceId,
      userId,
      parsed.data.role,
      Date.now(),
    );
    return bootstrap(env, auth);
  }
  const memberMatch = path.match(/^\/members\/([^/]+)$/);
  if (memberMatch && request.method === "PATCH") {
    const current = await one(
      env,
      "SELECT * FROM members WHERE user_id=? AND workspace_id=(SELECT workspace_id FROM members WHERE user_id=? LIMIT 1)",
      memberMatch[1],
      auth.userId,
    );
    if (!current) throw new HttpError(404, "Member not found.");
    await requirePermission(env, auth, String(current.workspace_id), "members");
    const role = zRole(input?.role);
    await run(
      env,
      "UPDATE members SET role=? WHERE user_id=? AND workspace_id=?",
      role,
      memberMatch[1],
      current.workspace_id,
    );
    return bootstrap(env, auth);
  }
  if (memberMatch && request.method === "DELETE") {
    const current = await one(
      env,
      "SELECT * FROM members WHERE user_id=? AND workspace_id=(SELECT workspace_id FROM members WHERE user_id=? LIMIT 1)",
      memberMatch[1],
      auth.userId,
    );
    if (!current) throw new HttpError(404, "Member not found.");
    await requirePermission(env, auth, String(current.workspace_id), "members");
    await run(
      env,
      "DELETE FROM members WHERE user_id=? AND workspace_id=?",
      memberMatch[1],
      current.workspace_id,
    );
    return bootstrap(env, auth);
  }
  const readMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (readMatch && request.method === "POST") {
    await run(
      env,
      "UPDATE notifications SET read=1 WHERE id=? AND user_id=?",
      readMatch[1],
      auth.userId,
    );
    return bootstrap(env, auth);
  }
  if (path === "/notifications/read-all" && request.method === "POST") {
    await run(
      env,
      "UPDATE notifications SET read=1 WHERE user_id=?",
      auth.userId,
    );
    return bootstrap(env, auth);
  }
  throw new HttpError(404, "Endpoint not found.");
}

function zRole(value: unknown) {
  if (
    value === "Owner" ||
    value === "Admin" ||
    value === "Member" ||
    value === "Viewer"
  )
    return value;
  throw new HttpError(422, "Invalid role.");
}

async function handle(request: Request, env: Env) {
  const url = new URL(request.url);
  const path =
    url.pathname.replace(/^\/api\/v1/, "").replace(/^\/api/, "") || "/";
  if (request.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin(request),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      },
    });
  if (request.method === "GET" && path === "/health")
    return json(
      { status: "ok", service: "flowboard-api", database: Boolean(env.DB) },
      {},
      request,
    );
  if (request.method === "POST" && path === "/auth/demo") {
    await seedDemo(env);
    return authResponse(request, env, "u-me");
  }
  if (request.method === "POST" && path === "/auth/register")
    return createAccount(request, env, await body(request));
  if (request.method === "POST" && path === "/auth/login")
    return login(request, env, await body(request));
  if (request.method === "POST" && path === "/auth/logout") {
    const raw = parseCookies(request).flowboard_session;
    if (raw)
      await run(
        env,
        "DELETE FROM sessions WHERE token_hash=?",
        await digest(raw),
      );
    return json(
      { ok: true },
      { headers: { "Set-Cookie": sessionCookie(request, "", 0) } },
      request,
    );
  }
  const auth = await requireAuth(request, env);
  if (request.method === "GET" && path === "/bootstrap")
    return json({ data: await bootstrap(env, auth) }, {}, request);
  if (request.method === "POST" && path === "/demo/reset") {
    await resetDemo(env);
    return json({ data: await bootstrap(env, auth) }, {}, request);
  }
  return json(
    { data: await mutation(request, env, auth, path, await body(request)) },
    {},
    request,
  );
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      return withCors(await handle(request, env), request);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message =
        error instanceof Error ? error.message : "Internal server error.";
      return withCors(
        json(
          { error: message, requestId: crypto.randomUUID() },
          { status },
          request,
        ),
        request,
      );
    }
  },
};
