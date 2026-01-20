import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPost, fetchPosts, getSiteBaseUrl } from "@/lib/blogApi";

describe("blogApi", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
    vi.unstubAllGlobals();
  });

  it("returns default base url when env is missing", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteBaseUrl()).toBe("http://localhost:3000");
  });

  it("fetchPosts returns parsed payload on success", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            slug: "post-1",
            title: "Post 1",
            excerpt: "Excerpt",
            tags: ["tag"],
          },
        ]),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchSpy);

    const posts = await fetchPosts();

    expect(fetchSpy).toHaveBeenCalledWith("https://example.test/api/posts", {
      cache: "no-store",
    });
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("post-1");
  });

  it("fetchPost returns null on failure", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response("Not found", { status: 404 }));
    vi.stubGlobal("fetch", fetchSpy);

    const post = await fetchPost("missing slug");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.test/api/posts/missing%20slug",
      { cache: "no-store" }
    );
    expect(post).toBeNull();
  });
});
