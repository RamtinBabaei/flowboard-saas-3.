import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../api/security";

describe("API password security", () => {
  it("hashes with a salt and verifies only the original password", async () => {
    const stored = await hashPassword("flowboard-password");
    expect(stored).toContain(":");
    expect(await verifyPassword("flowboard-password", stored)).toBe(true);
    expect(await verifyPassword("wrong-password", stored)).toBe(false);
  });
});
