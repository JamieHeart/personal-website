import { describe, expect, it } from "vitest";

import { normalizeGeneratedFields } from "@/lib/blogFields";

describe("normalizeGeneratedFields", () => {
  it("normalizes values and enforces limits", () => {
    const result = normalizeGeneratedFields({
      title: " Hello World ",
      excerpt: "x".repeat(250),
      tags: [" one ", "two", "three", "four", "five", "six", "seven", "eight"],
      slug: " Custom Slug ",
    });

    expect(result.slug).toBe("custom-slug");
    expect(result.excerpt.length).toBe(200);
    expect(result.tags).toHaveLength(7);
  });

  it("throws when required fields are missing", () => {
    expect(() => normalizeGeneratedFields({})).toThrow("invalid_payload");
  });
});
