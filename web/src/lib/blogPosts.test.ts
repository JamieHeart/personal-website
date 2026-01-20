import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPostUpdate, normalizePostInput, normalizeTags } from "@/lib/blogPosts";

describe("blogPosts helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("normalizes and validates create payloads", () => {
    const post = normalizePostInput({
      slug: " post-slug ",
      title: " Title ",
      excerpt: " Excerpt ",
      content: " Content ",
      tags: [" tag ", " "],
    });

    expect(post).toEqual({
      slug: "post-slug",
      title: "Title",
      excerpt: "Excerpt",
      content: "Content",
      tags: ["tag"],
      publishedAt: "2024-01-15T00:00:00.000Z",
      updatedAt: "2024-01-15T00:00:00.000Z",
    });
  });

  it("throws when required fields are missing", () => {
    expect(() =>
      normalizePostInput({
        slug: "   ",
        title: "Title",
        excerpt: "Excerpt",
        content: "Content",
      })
    ).toThrow("invalid_payload");
  });

  it("builds trimmed update fields with defaults", () => {
    const update = buildPostUpdate({
      title: " Title ",
      tags: [" one ", ""],
    });

    expect(update).toEqual({
      title: "Title",
      excerpt: "",
      content: "",
      tags: ["one"],
      publishedAt: "2024-01-15T00:00:00.000Z",
      updatedAt: "2024-01-15T00:00:00.000Z",
    });
  });

  it("normalizes tag lists defensively", () => {
    expect(normalizeTags([" one ", 2, "", null])).toEqual(["one"]);
    expect(normalizeTags("not-a-list")).toEqual([]);
  });
});
