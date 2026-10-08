export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";
export type ProjectStatus =
  "planning" | "active" | "on-hold" | "completed" | "archived";
export type MemberRole = "Owner" | "Admin" | "Member" | "Viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
}
export interface WorkspaceMember extends User {
  workspaceId: string;
  role: MemberRole;
  joinedAt: string;
}
export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
}
export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  icon?: "folder" | "zap" | "code" | "palette";
  startDate: string;
  endDate: string;
  memberIds: string[];
  favorite?: boolean;
}
export interface TaskComment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}
export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}
export interface ActivityEvent {
  id: string;
  taskId?: string;
  projectId?: string;
  actorId: string;
  workspaceId: string;
  type: string;
  message: string;
  createdAt: string;
}
export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  creatorId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  labels: string[];
  comments: TaskComment[];
  checklist: ChecklistItem[];
  estimate?: number;
  order: number;
}
export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  body: string;
  type: "assignment" | "deadline" | "comment" | "completion" | "project";
  read: boolean;
  createdAt: string;
  taskId?: string;
  projectId?: string;
}
export interface Settings {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  compactMode: boolean;
}
export interface AppData {
  version: 2;
  user: User;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  projects: Project[];
  tasks: Task[];
  activities: ActivityEvent[];
  notifications: Notification[];
  settings: Settings;
  activeWorkspaceId: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  "in-progress": "In Progress",
  review: "In Review",
  done: "Done",
};
export const STATUS_ORDER: TaskStatus[] = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "done",
];
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  "on-hold": "On hold",
  completed: "Completed",
  archived: "Archived",
};
