import type { AppData, MemberRole } from "../types";
export type Permission =
  "workspace" | "members" | "projects" | "tasks" | "comments" | "read";
export const can = (role: MemberRole | undefined, action: Permission) =>
  action === "read"
    ? Boolean(role)
    : action === "workspace" || action === "members"
      ? role === "Owner"
      : action === "projects"
        ? role === "Owner" || role === "Admin"
        : role === "Owner" || role === "Admin" || role === "Member";
export const roleFor = (data: AppData, workspaceId = data.activeWorkspaceId) =>
  data.members.find(
    (m) => m.id === data.user.id && m.workspaceId === workspaceId,
  )?.role;
export function requirePermission(
  data: AppData,
  action: Permission,
  workspaceId = data.activeWorkspaceId,
) {
  if (!can(roleFor(data, workspaceId), action))
    throw new Error(
      `Your simulated role cannot manage ${action} in this workspace.`,
    );
}
