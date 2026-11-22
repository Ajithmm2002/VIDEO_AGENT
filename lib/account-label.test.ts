import { describe, expect, it } from "vitest";
import { accountInitials, accountLabel } from "@/lib/account-label";

describe("account labels", () => {
  it("prefers the display name, then the email local part", () => {
    expect(accountLabel("Ajith M", "ajith@example.com")).toBe("Ajith M");
    expect(accountLabel("  ", "ajith@example.com")).toBe("ajith");
    expect(accountLabel(null, null)).toBe("Workspace");
  });

  it("builds initials from the visible name", () => {
    expect(accountInitials("Ajith M")).toBe("AM");
    expect(accountInitials("ajith")).toBe("AJ");
  });
});
