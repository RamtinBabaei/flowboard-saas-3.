import type { ActivityEvent, Task, TaskPriority, TaskStatus } from "../types";
export const priorityRank: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const progress = (tasks: Task[]) =>
  tasks.length
    ? Math.round(
        (tasks.filter((t) => t.status === "done").length / tasks.length) * 100,
      )
    : 0;
export const isOverdue = (task: Task, today = localDate()) =>
  Boolean(task.dueDate && task.dueDate < today && task.status !== "done");
export interface TaskFilters {
  q?: string;
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  assignee?: string;
  due?: string;
  sort?: string;
}
export function filterTasks(tasks: Task[], f: TaskFilters) {
  return tasks
    .filter(
      (t) =>
        (!f.q || t.title.toLowerCase().includes(f.q.trim().toLowerCase())) &&
        (!f.status || f.status === "all" || t.status === f.status) &&
        (!f.priority || f.priority === "all" || t.priority === f.priority) &&
        (!f.assignee ||
          f.assignee === "all" ||
          (f.assignee === "unassigned"
            ? !t.assigneeId
            : t.assigneeId === f.assignee)) &&
        (!f.due ||
          f.due === "all" ||
          (f.due === "overdue"
            ? isOverdue(t)
            : f.due === "none"
              ? !t.dueDate
              : t.dueDate === f.due)),
    )
    .sort((a, b) =>
      f.sort === "priority"
        ? priorityRank[a.priority] - priorityRank[b.priority]
        : f.sort === "createdAt"
          ? b.createdAt.localeCompare(a.createdAt)
          : (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
    );
}
export function weeklyActivity(events: ActivityEvent[], now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      completed: events.filter(
        (a) =>
          localDate(new Date(a.createdAt)) === localDate(d) &&
          a.type === "completion",
      ).length,
      created: events.filter(
        (a) =>
          localDate(new Date(a.createdAt)) === localDate(d) &&
          a.type === "create-task",
      ).length,
    };
  });
}
