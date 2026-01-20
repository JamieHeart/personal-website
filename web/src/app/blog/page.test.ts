import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPosts } = vi.hoisted(() => ({
  fetchPosts: vi.fn(),
}));

vi.mock("@/lib/blogApi", () => ({
  fetchPosts,
}));

import BlogPage from "@/app/blog/page";

describe("BlogPage", () => {
  beforeEach(() => {
    fetchPosts.mockReset();
  });

  it("renders empty state when there are no posts", async () => {
    fetchPosts.mockResolvedValue([]);

    const element = await BlogPage();
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, element)
    );

    expect(html).toContain("No posts yet.");
  });

  it("renders posts with tags", async () => {
    fetchPosts.mockResolvedValue([
      {
        slug: "first-post",
        title: "First Post",
        excerpt: "Excerpt",
        tags: ["leadership"],
        publishedAt: "2024-01-01T00:00:00Z",
      },
    ]);

    const element = await BlogPage();
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, element)
    );

    expect(html).toContain("First Post");
    expect(html).toContain("Excerpt");
    expect(html).toContain('class="badge"');
    expect(html).toContain("leadership");
  });
});
