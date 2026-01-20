import { describe, expect, it } from "vitest";

import { formatDate } from "@/lib/blogFormat";

describe("formatDate", () => {
  it("returns null for empty input", () => {
    expect(formatDate()).toBeNull();
    expect(formatDate("")).toBeNull();
  });

  it("returns original value for invalid dates", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });

  it("formats valid ISO timestamps", () => {
    const formatted = formatDate("2024-01-15T12:00:00Z");
    expect(formatted).not.toBeNull();
    expect(formatted).not.toBe("2024-01-15T12:00:00Z");
    expect(formatted).toContain("2024");
  });
});
