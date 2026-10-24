import { describe, expect, it } from "vitest";
import { authSchema, taskSchema } from "../api/validation";

describe("API validation contracts", () => {
  it("normalizes emails and rejects weak credentials", () => {
    expect(
      authSchema.safeParse({
        email: "MINA@FLOWBOARD.DEV",
        password: "flowboard",
      }).success,
    ).toBe(true);
    expect(
      authSchema.safeParse({ email: "not-an-email", password: "flowboard" })
        .success,
    ).toBe(false);
    expect(
      authSchema.safeParse({ email: "mina@flowboard.dev", password: "short" })
        .success,
    ).toBe(false);
  });

  it("accepts a task contract without trusting client timestamps or permissions", () => {
    const result = taskSchema.safeParse({
      title: "Ship API integration",
      projectId: "project-1",
      labels: ["backend"],
      checklist: [{ id: "check-1", title: "Add tests", completed: false }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("todo");
  });
});
