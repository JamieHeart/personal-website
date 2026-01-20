import { beforeEach, describe, expect, it, vi } from "vitest";

const { send, requireAdmin } = vi.hoisted(() => ({
  send: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/dynamo", () => ({
  blogTableName: "test-table",
  docClient: { send },
  requireAdmin,
}));

import { GET, POST } from "@/app/api/posts/route";

describe("POST /api/posts", () => {
  beforeEach(() => {
    send.mockReset();
    requireAdmin.mockReset();
  });

  it("returns 401 when admin token is missing", async () => {
    requireAdmin.mockImplementation(() => {
      throw new Error("unauthorized");
    });
    const request = new Request("http://localhost/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "test-slug",
        title: "Title",
        excerpt: "Excerpt",
        content: "Content",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 when JSON is invalid", async () => {
    const request = new Request("http://localhost/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad-json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 409 when slug already exists", async () => {
    send.mockRejectedValue({ name: "ConditionalCheckFailedException" });
    const request = new Request("http://localhost/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: "existing-slug",
        title: "Title",
        excerpt: "Excerpt",
        content: "Content",
        tags: ["tag"],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
  });
});

describe("GET /api/posts", () => {
  beforeEach(() => {
    send.mockReset();
  });

  it("returns sorted summaries", async () => {
    send.mockResolvedValue({
      Items: [
        {
          slug: "post-1",
          title: "Post 1",
          excerpt: "Excerpt 1",
          publishedAt: "2024-01-01T10:00:00Z",
        },
        {
          slug: "post-2",
          title: "Post 2",
          excerpt: "Excerpt 2",
          tags: ["tag"],
          publishedAt: "2024-02-01T10:00:00Z",
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(data[0].slug).toBe("post-2");
    expect(data[0].tags).toEqual(["tag"]);
    expect(data[1].tags).toEqual([]);
  });
});
