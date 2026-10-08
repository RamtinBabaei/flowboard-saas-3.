import { describe, expect, it } from "vitest";
import { filterTasks, isOverdue, progress } from "../src/domain/selectors";
import { can } from "../src/domain/permissions";
import { appDataSchema, taskFormSchema } from "../src/domain/schema";
import { seedData } from "../src/mock/seed";

describe("FlowBoard domain rules", () => {
  const data = seedData();
  it("calculates completion from actual task state", () =>
    expect(
      progress(data.tasks.filter((t) => t.workspaceId === "w-product")),
    ).toBe(29));
  it("flags incomplete tasks with past due dates", () =>
    expect(
      isOverdue(
        data.tasks.find((t) => t.id === "t-5")!,
        "2026-10-08",
      ),
    ).toBe(true));
  it("combines task search and priority filters", () =>
    expect(
      filterTasks(data.tasks, { q: "flow", priority: "high" }).map((t) => t.id),
    ).toEqual(["t-1", "t-8"]));
  it("sorts urgent tasks first when priority is selected", () =>
    expect(filterTasks(data.tasks, { sort: "priority" })[0].priority).toBe(
      "urgent",
    ));
  it("enforces simulated role boundaries centrally", () => {
    expect(can("Viewer", "read")).toBe(true);
    expect(can("Viewer", "tasks")).toBe(false);
    expect(can("Member", "tasks")).toBe(true);
    expect(can("Admin", "projects")).toBe(true);
    expect(can("Admin", "members")).toBe(false);
  });
  it("accepts internally consistent seed data", () =>
    expect(appDataSchema.safeParse(data).success).toBe(true));
  it("rejects invalid task form data", () =>
    expect(
      taskFormSchema.safeParse({
        title: "x",
        description: "",
        status: "todo",
        priority: "medium",
        projectId: "p",
        assigneeId: "",
        dueDate: "2026-99-10",
        labels: "",
        estimate: "",
      }).success,
    ).toBe(false));
});
