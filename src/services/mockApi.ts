import type {
  AppData,
  Project,
  Task,
  TaskComment,
  Workspace,
  WorkspaceMember,
} from "../types";
import { requirePermission } from "../domain/permissions";
import { seedData } from "../mock/seed";
import { localDate } from "../domain/selectors";
const clone = <T>(v: T): T => structuredClone(v);
const pause = (ms = 170) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const randomId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
export class MockApi {
  constructor(
    private data: AppData,
    private save: (data: AppData) => Promise<void>,
  ) {}
  snapshot() {
    return clone(this.data);
  }
  private async commit(next: AppData) {
    this.data = next;
    await this.save(this.data);
    return this.snapshot();
  }
  async reset() {
    await pause(260);
    return this.commit(seedData());
  }
  async setWorkspace(id: string) {
    if (!this.data.workspaces.some((w) => w.id === id))
      throw new Error("Workspace was not found.");
    return this.commit({ ...this.data, activeWorkspaceId: id });
  }
  async updateSettings(patch: Partial<AppData["settings"]>) {
    return this.commit({
      ...this.data,
      settings: { ...this.data.settings, ...patch },
    });
  }
  async createWorkspace(
    input: Pick<Workspace, "name" | "description" | "color">,
  ) {
    requirePermission(this.data, "workspace");
    await pause();
    const workspace: Workspace = {
      ...input,
      id: randomId("w"),
      ownerId: this.data.user.id,
    };
    const member: WorkspaceMember = {
      ...this.data.user,
      workspaceId: workspace.id,
      role: "Owner",
      joinedAt: localDate(),
    };
    return this.commit({
      ...this.data,
      workspaces: [...this.data.workspaces, workspace],
      members: [...this.data.members, member],
      activeWorkspaceId: workspace.id,
    });
  }
  async updateWorkspace(id: string, patch: Partial<Workspace>) {
    requirePermission(this.data, "workspace", id);
    return this.commit({
      ...this.data,
      workspaces: this.data.workspaces.map((w) =>
        w.id === id ? { ...w, ...patch } : w,
      ),
    });
  }
  async deleteWorkspace(id: string) {
    requirePermission(this.data, "workspace", id);
    const remaining = this.data.workspaces.filter((w) => w.id !== id);
    if (!remaining.length) throw new Error("Keep at least one workspace.");
    const projects = this.data.projects.filter((p) => p.workspaceId !== id);
    return this.commit({
      ...this.data,
      workspaces: remaining,
      members: this.data.members.filter((m) => m.workspaceId !== id),
      projects,
      tasks: this.data.tasks.filter((t) => t.workspaceId !== id),
      activities: this.data.activities.filter((a) => a.workspaceId !== id),
      notifications: this.data.notifications.filter(
        (n) => n.workspaceId !== id,
      ),
      activeWorkspaceId:
        this.data.activeWorkspaceId === id
          ? remaining[0].id
          : this.data.activeWorkspaceId,
    });
  }
  async createProject(
    input: Omit<Project, "id" | "workspaceId" | "memberIds"> & {
      memberIds?: string[];
    },
  ) {
    requirePermission(this.data, "projects");
    await pause();
    const p: Project = {
      ...input,
      id: randomId("p"),
      workspaceId: this.data.activeWorkspaceId,
      memberIds: input.memberIds ?? [this.data.user.id],
    };
    return this.commit({
      ...this.data,
      projects: [...this.data.projects, p],
      activities: [
        {
          id: randomId("a"),
          workspaceId: p.workspaceId,
          projectId: p.id,
          actorId: this.data.user.id,
          type: "create-project",
          message: `created “${p.name}”`,
          createdAt: new Date().toISOString(),
        },
        ...this.data.activities,
      ],
    });
  }
  async updateProject(id: string, patch: Partial<Project>) {
    const p = this.data.projects.find((x) => x.id === id);
    if (!p) throw new Error("Project was not found.");
    requirePermission(this.data, "projects", p.workspaceId);
    return this.commit({
      ...this.data,
      projects: this.data.projects.map((x) =>
        x.id === id ? { ...x, ...patch } : x,
      ),
    });
  }
  async deleteProject(id: string) {
    const p = this.data.projects.find((x) => x.id === id);
    if (!p) return this.snapshot();
    requirePermission(this.data, "projects", p.workspaceId);
    return this.commit({
      ...this.data,
      projects: this.data.projects.filter((x) => x.id !== id),
      tasks: this.data.tasks.filter((t) => t.projectId !== id),
    });
  }
  async createTask(input: Partial<Task> & Pick<Task, "title" | "projectId">) {
    const project = this.data.projects.find((p) => p.id === input.projectId);
    if (!project) throw new Error("Choose a valid project.");
    requirePermission(this.data, "tasks", project.workspaceId);
    await pause();
    const status = input.status ?? "todo";
    const task: Task = {
      id: randomId("t"),
      workspaceId: project.workspaceId,
      projectId: project.id,
      title: input.title,
      description: input.description ?? "",
      status,
      priority: input.priority ?? "medium",
      assigneeId: input.assigneeId,
      creatorId: this.data.user.id,
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      labels: input.labels ?? [],
      comments: [],
      checklist: input.checklist ?? [],
      estimate: input.estimate,
      order: this.data.tasks.filter(
        (t) => t.workspaceId === project.workspaceId && t.status === status,
      ).length,
    };
    return this.commit({
      ...this.data,
      tasks: [...this.data.tasks, task],
      activities: [
        {
          id: randomId("a"),
          taskId: task.id,
          workspaceId: task.workspaceId,
          actorId: this.data.user.id,
          type: "create-task",
          message: `created “${task.title}”`,
          createdAt: new Date().toISOString(),
        },
        ...this.data.activities,
      ],
    });
  }
  async updateTask(id: string, patch: Partial<Task>) {
    const old = this.data.tasks.find((t) => t.id === id);
    if (!old) throw new Error("Task was not found.");
    requirePermission(this.data, "tasks", old.workspaceId);
    const updated = { ...old, ...patch, updatedAt: new Date().toISOString() };
    const events = this.data.activities;
    let message = `updated “${old.title}”`,
      type = "update-task";
    if (patch.status && patch.status !== old.status) {
      message = `moved “${old.title}” to ${patch.status}`;
      type = patch.status === "done" ? "completion" : "status";
    }
    if (patch.priority && patch.priority !== old.priority) {
      message = `changed “${old.title}” priority`;
      type = "priority";
    }
    if (patch.assigneeId !== undefined && patch.assigneeId !== old.assigneeId) {
      message = `reassigned “${old.title}”`;
      type = "assignment";
    }
    return this.commit({
      ...this.data,
      tasks: this.data.tasks.map((t) => (t.id === id ? updated : t)),
      activities: [
        {
          id: randomId("a"),
          taskId: id,
          workspaceId: old.workspaceId,
          actorId: this.data.user.id,
          type,
          message,
          createdAt: new Date().toISOString(),
        },
        ...events,
      ],
    });
  }
  async deleteTask(id: string) {
    const old = this.data.tasks.find((t) => t.id === id);
    if (!old) return this.snapshot();
    requirePermission(this.data, "tasks", old.workspaceId);
    return this.commit({
      ...this.data,
      tasks: this.data.tasks.filter((t) => t.id !== id),
    });
  }
  async duplicateTask(id: string) {
    const old = this.data.tasks.find((t) => t.id === id);
    if (!old) throw new Error("Task was not found.");
    return this.createTask({
      ...old,
      id: undefined,
      title: `${old.title} (copy)`,
      comments: [],
      createdAt: undefined,
      updatedAt: undefined,
      order: undefined,
    });
  }
  async addComment(taskId: string, body: string) {
    const old = this.data.tasks.find((t) => t.id === taskId);
    if (!old) throw new Error("Task was not found.");
    requirePermission(this.data, "comments", old.workspaceId);
    const c: TaskComment = {
      id: randomId("c"),
      authorId: this.data.user.id,
      body,
      createdAt: new Date().toISOString(),
    };
    return this.commit({
      ...this.data,
      tasks: this.data.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [...t.comments, c],
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
      activities: [
        {
          id: randomId("a"),
          taskId,
          workspaceId: old.workspaceId,
          actorId: this.data.user.id,
          type: "comment",
          message: "commented on a task",
          createdAt: new Date().toISOString(),
        },
        ...this.data.activities,
      ],
      notifications: [
        {
          id: randomId("n"),
          workspaceId: old.workspaceId,
          userId: this.data.user.id,
          title: "Comment added",
          body,
          type: "comment",
          read: false,
          createdAt: new Date().toISOString(),
          taskId,
        },
        ...this.data.notifications,
      ],
    });
  }
  async addMember(input: Omit<WorkspaceMember, "id" | "joinedAt">) {
    requirePermission(this.data, "members");
    return this.commit({
      ...this.data,
      members: [
        ...this.data.members,
        { ...input, id: randomId("u"), joinedAt: localDate() },
      ],
    });
  }
  async updateMember(id: string, patch: Partial<WorkspaceMember>) {
    const m = this.data.members.find((x) => x.id === id);
    if (!m) throw new Error("Member was not found.");
    requirePermission(this.data, "members", m.workspaceId);
    return this.commit({
      ...this.data,
      members: this.data.members.map((x) =>
        x.id === id ? { ...x, ...patch } : x,
      ),
    });
  }
  async removeMember(id: string) {
    const m = this.data.members.find((x) => x.id === id);
    if (!m) return this.snapshot();
    requirePermission(this.data, "members", m.workspaceId);
    if (m.role === "Owner")
      throw new Error("Transfer ownership before removing the owner.");
    return this.commit({
      ...this.data,
      members: this.data.members.filter((x) => x.id !== id),
      tasks: this.data.tasks.map((t) =>
        t.assigneeId === id ? { ...t, assigneeId: undefined } : t,
      ),
    });
  }
  async markNotificationRead(id: string) {
    return this.commit({
      ...this.data,
      notifications: this.data.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    });
  }
  async markAllRead() {
    return this.commit({
      ...this.data,
      notifications: this.data.notifications.map((n) => ({ ...n, read: true })),
    });
  }
}
