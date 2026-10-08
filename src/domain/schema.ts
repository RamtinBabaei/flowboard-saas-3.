import { z } from "zod";
export const taskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
]);
export const prioritySchema = z.enum([
  "urgent",
  "high",
  "medium",
  "low",
  "none",
]);
export const projectStatusSchema = z.enum([
  "planning",
  "active",
  "on-hold",
  "completed",
  "archived",
]);
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + "T12:00:00");
    return (
      !Number.isNaN(d.valueOf()) &&
      d.getFullYear() === Number(s.slice(0, 4)) &&
      d.getMonth() + 1 === Number(s.slice(5, 7)) &&
      d.getDate() === Number(s.slice(8, 10))
    );
  }, "Enter a valid date");
const timestamp = z.string().datetime();
export const userSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  initials: z.string(),
  avatar: z.string().max(2).optional(),
});
export const memberSchema = userSchema.extend({
  workspaceId: z.string(),
  role: z.enum(["Owner", "Admin", "Member", "Viewer"]),
  joinedAt: z.string(),
});
export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2).max(80),
  description: z.string().max(2000),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  ownerId: z.string(),
});
export const projectSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().trim().min(2).max(100),
  description: z.string().max(5000),
  status: projectStatusSchema,
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  icon: z.enum(["folder", "zap", "code", "palette"]).default("folder"),
  startDate: dateOnly,
  endDate: dateOnly,
  memberIds: z.array(z.string()),
  favorite: z.boolean().optional(),
});
export const commentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  body: z.string().trim().min(1).max(4000),
  createdAt: timestamp,
  updatedAt: timestamp.optional(),
});
export const checklistSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(200),
  completed: z.boolean(),
});
export const taskSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  projectId: z.string(),
  title: z.string().trim().min(2).max(160),
  description: z.string().max(8000),
  status: taskStatusSchema,
  priority: prioritySchema,
  assigneeId: z.string().optional(),
  creatorId: z.string(),
  dueDate: dateOnly.optional(),
  createdAt: timestamp,
  updatedAt: timestamp,
  labels: z.array(z.string().max(40)).max(10),
  comments: z.array(commentSchema),
  checklist: z.array(checklistSchema).max(100),
  estimate: z.number().min(0).max(1000).optional(),
  order: z.number(),
});
export const activitySchema = z.object({
  id: z.string(),
  taskId: z.string().optional(),
  projectId: z.string().optional(),
  workspaceId: z.string(),
  actorId: z.string(),
  type: z.string(),
  message: z.string(),
  createdAt: timestamp,
});
export const notificationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  type: z.enum(["assignment", "deadline", "comment", "completion", "project"]),
  read: z.boolean(),
  createdAt: timestamp,
  taskId: z.string().optional(),
  projectId: z.string().optional(),
});
export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  emailNotifications: z.boolean(),
  compactMode: z.boolean(),
});
export const appDataSchema = z
  .object({
    version: z.literal(2),
    user: userSchema,
    workspaces: z.array(workspaceSchema).min(1),
    members: z.array(memberSchema),
    projects: z.array(projectSchema),
    tasks: z.array(taskSchema),
    activities: z.array(activitySchema),
    notifications: z.array(notificationSchema),
    settings: settingsSchema,
    activeWorkspaceId: z.string(),
  })
  .superRefine((d, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (!d.workspaces.some((w) => w.id === d.activeWorkspaceId))
      fail("Unknown active workspace");
    for (const w of d.workspaces)
      if (
        !d.members.some(
          (m) =>
            m.id === w.ownerId && m.workspaceId === w.id && m.role === "Owner",
        )
      )
        fail("Workspace owner missing");
    for (const p of d.projects) {
      if (!d.workspaces.some((w) => w.id === p.workspaceId))
        fail("Project workspace missing");
      if (p.endDate < p.startDate) fail("Project end date precedes start");
      for (const id of p.memberIds)
        if (
          !d.members.some((m) => m.id === id && m.workspaceId === p.workspaceId)
        )
          fail("Project member missing");
    }
    for (const t of d.tasks) {
      if (
        !d.projects.some(
          (p) => p.id === t.projectId && p.workspaceId === t.workspaceId,
        )
      )
        fail("Task project missing");
      if (
        t.assigneeId &&
        !d.members.some(
          (m) => m.id === t.assigneeId && m.workspaceId === t.workspaceId,
        )
      )
        fail("Task assignee missing");
    }
  });
export const taskFormSchema = z.object({
  title: taskSchema.shape.title,
  description: taskSchema.shape.description,
  status: taskStatusSchema,
  priority: prioritySchema,
  projectId: z.string().min(1, "Choose a project"),
  assigneeId: z.string(),
  dueDate: z.union([dateOnly, z.literal("")]),
  labels: z.string().max(400),
  estimate: z.union([
    z.literal(""),
    z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Enter a non-negative number")
      .refine((s) => Number(s) <= 1000, "Maximum 1000 hours"),
  ]),
});
export const authFormSchema = z.object({
  name: z.string(),
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Use at least six characters"),
});
export const projectFormSchema = projectSchema
  .omit({ id: true, workspaceId: true })
  .refine((d) => d.endDate >= d.startDate, {
    path: ["endDate"],
    message: "End date must follow the start date",
  });
