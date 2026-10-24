import { z } from "zod";

export const authSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z
    .string()
    .trim()
    .email()
    .max(180)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(128),
});

export const workspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000).default(""),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(5000).default(""),
  status: z.enum(["planning", "active", "on-hold", "completed", "archived"]),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  icon: z.enum(["folder", "zap", "code", "palette"]).default("folder"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  memberIds: z.array(z.string()).default([]),
  favorite: z.boolean().optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(8000).default(""),
  projectId: z.string().min(1),
  status: z
    .enum(["backlog", "todo", "in-progress", "review", "done"])
    .default("todo"),
  priority: z
    .enum(["urgent", "high", "medium", "low", "none"])
    .default("medium"),
  assigneeId: z.string().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  labels: z.array(z.string().trim().max(40)).max(10).default([]),
  checklist: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().trim().min(1).max(200),
        completed: z.boolean(),
      }),
    )
    .max(100)
    .default([]),
  estimate: z.number().min(0).max(1000).optional(),
});

export const memberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .trim()
    .email()
    .max(180)
    .transform((value) => value.toLowerCase()),
  role: z.enum(["Owner", "Admin", "Member", "Viewer"]),
  workspaceId: z.string().min(1),
});

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  emailNotifications: z.boolean().optional(),
  compactMode: z.boolean().optional(),
  activeWorkspaceId: z.string().optional(),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});
