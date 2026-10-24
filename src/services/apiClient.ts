import type {
  AppData,
  Project,
  Settings,
  Task,
  Workspace,
  WorkspaceMember,
} from "../types";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);
export const remoteEnabled = Boolean(API_BASE);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}/api/v1${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };
  if (!response.ok)
    throw new Error(payload.error ?? `Request failed (${response.status}).`);
  return payload.data as T;
}

export async function remoteDemo() {
  return request<AppData>("/auth/demo", { method: "POST", body: "{}" });
}

export async function remoteLogin(email: string, password: string) {
  return request<AppData>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function remoteRegister(
  name: string,
  email: string,
  password: string,
) {
  return request<AppData>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function remoteLogout() {
  await request<{ ok: boolean }>("/auth/logout", {
    method: "POST",
    body: "{}",
  });
}

export async function remoteBootstrap() {
  return request<AppData>("/bootstrap");
}

export class RemoteApi {
  constructor(private data: AppData) {}
  snapshot() {
    return structuredClone(this.data);
  }
  private async mutate(path: string, method: string, payload?: unknown) {
    this.data = await request<AppData>(path, {
      method,
      body: payload === undefined ? "{}" : JSON.stringify(payload),
    });
    return this.snapshot();
  }
  reset() {
    return this.mutate("/demo/reset", "POST");
  }
  setWorkspace(id: string) {
    return this.mutate("/settings", "PATCH", { activeWorkspaceId: id });
  }
  updateSettings(settings: Partial<Settings>) {
    return this.mutate("/settings", "PATCH", settings);
  }
  createWorkspace(input: Pick<Workspace, "name" | "description" | "color">) {
    return this.mutate("/workspaces", "POST", input);
  }
  deleteWorkspace(id: string) {
    return this.mutate(`/workspaces/${id}`, "DELETE");
  }
  updateWorkspace(id: string, patch: Partial<Workspace>) {
    return this.mutate(`/workspaces/${id}`, "PATCH", patch);
  }
  createProject(
    input: Omit<Project, "id" | "workspaceId" | "memberIds"> & {
      memberIds?: string[];
    },
  ) {
    return this.mutate("/projects", "POST", {
      ...input,
      workspaceId: this.data.activeWorkspaceId,
    });
  }
  updateProject(id: string, patch: Partial<Project>) {
    return this.mutate(`/projects/${id}`, "PATCH", patch);
  }
  deleteProject(id: string) {
    return this.mutate(`/projects/${id}`, "DELETE");
  }
  createTask(input: Partial<Task> & Pick<Task, "title" | "projectId">) {
    return this.mutate("/tasks", "POST", input);
  }
  updateTask(id: string, patch: Partial<Task>) {
    const allowed = (({
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      labels,
      checklist,
      estimate,
    }) => ({
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      labels,
      checklist,
      estimate,
    }))(patch);
    return this.mutate(`/tasks/${id}`, "PATCH", allowed);
  }
  deleteTask(id: string) {
    return this.mutate(`/tasks/${id}`, "DELETE");
  }
  async duplicateTask(id: string) {
    const original = this.data.tasks.find((task) => task.id === id);
    if (!original) throw new Error("Task was not found.");
    return this.createTask({
      title: `${original.title} (copy)`,
      projectId: original.projectId,
      description: original.description,
      status: original.status,
      priority: original.priority,
      assigneeId: original.assigneeId,
      dueDate: original.dueDate,
      labels: original.labels,
      checklist: [],
      estimate: original.estimate,
    });
  }
  addComment(id: string, body: string) {
    return this.mutate(`/tasks/${id}/comments`, "POST", { body });
  }
  addMember(member: Omit<WorkspaceMember, "id" | "joinedAt">) {
    return this.mutate("/members", "POST", member);
  }
  updateMember(id: string, patch: Partial<WorkspaceMember>) {
    return this.mutate(`/members/${id}`, "PATCH", patch);
  }
  removeMember(id: string) {
    return this.mutate(`/members/${id}`, "DELETE");
  }
  markNotificationRead(id: string) {
    return this.mutate(`/notifications/${id}/read`, "POST");
  }
  markAllRead() {
    return this.mutate("/notifications/read-all", "POST");
  }
}
