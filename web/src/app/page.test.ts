import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPosts } = vi.hoisted(() => ({
  fetchPosts: vi.fn(),
}));

vi.mock("@/lib/blogApi", () => ({
  fetchPosts,
}));

import HomePage from "@/app/page";

describe("HomePage", () => {
  beforeEach(() => {
    fetchPosts.mockReset();
  });

  it("renders latest posts and tag cloud", async () => {
    fetchPosts.mockResolvedValue([
      {
        slug: "post-1",
        title: "Post 1",
        excerpt: "Excerpt 1",
        tags: ["tag-a", "tag-b"],
        publishedAt: "2024-01-01T00:00:00Z",
      },
      {
        slug: "post-2",
        title: "Post 2",
        excerpt: "Excerpt 2",
        tags: ["tag-a"],
        publishedAt: "2024-01-02T00:00:00Z",
      },
    ]);

    const element = await HomePage();
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, element)
    );

    expect(html).toContain("Latest Posts");
    expect(html).toContain("Post 1");
    expect(html).toContain("Post 2");
    expect(html).toContain("Tag Cloud");
    expect(html).toContain('class="tag-cloud-item"');
    expect(html).toContain("tag-a");
  });
});
