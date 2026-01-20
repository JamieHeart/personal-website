import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPost } = vi.hoisted(() => ({
  fetchPost: vi.fn(),
}));

vi.mock("@/lib/blogApi", () => ({
  fetchPost,
}));

import BlogPostPage from "@/app/blog/[slug]/page";

describe("BlogPostPage", () => {
  beforeEach(() => {
    fetchPost.mockReset();
  });

  it("renders not found when post is missing", async () => {
    fetchPost.mockResolvedValue(null);

    const element = await BlogPostPage({ params: { slug: "missing" } });
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, element)
    );

    expect(html).toContain("Post not found");
  });

  it("renders post content and tags", async () => {
    fetchPost.mockResolvedValue({
      slug: "post-1",
      title: "Post Title",
      content: "**Bold** text",
      tags: ["tag"],
      publishedAt: "2024-01-01T00:00:00Z",
    });

    const element = await BlogPostPage({ params: { slug: "post-1" } });
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, element)
    );

    expect(html).toContain("Post Title");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain('class="badge"');
    expect(html).toContain("tag");
  });
});
