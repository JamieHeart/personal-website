import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send, requireAdmin } = vi.hoisted(() => ({
  send: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/dynamo", () => ({
  blogTableName: "test-table",
  docClient: { send },
  requireAdmin,
}));

import { DELETE, GET, PUT } from "@/app/api/posts/[slug]/route";

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/posts/[slug]", () => {
  beforeEach(() => {
    send.mockReset();
  });

  it("returns 404 when item is missing", async () => {
    send.mockResolvedValue({});

    const response = await GET(new Request("http://localhost"), {
      params: { slug: "missing" },
    });

    expect(response.status).toBe(404);
  });
});

describe("PUT /api/posts/[slug]", () => {
  beforeEach(() => {
    send.mockReset();
    requireAdmin.mockReset();
  });

  it("returns 401 when admin token is missing", async () => {
    requireAdmin.mockImplementation(() => {
      throw new Error("unauthorized");
    });

    const response = await PUT(new Request("http://localhost"), {
      params: { slug: "post-1" },
    });

    expect(response.status).toBe(401);
  });

  it("returns trimmed updates with timestamps", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    send.mockResolvedValue({});

    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: " Title ",
          tags: [" tag ", ""],
        }),
      }),
      { params: { slug: "post-1" } }
    );

    const payload = await response.json();

    expect(payload).toEqual({
      slug: "post-1",
      title: "Title",
      excerpt: "",
      content: "",
      tags: ["tag"],
      publishedAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });

    vi.useRealTimers();
  });
});

describe("DELETE /api/posts/[slug]", () => {
  beforeEach(() => {
    send.mockReset();
    requireAdmin.mockReset();
  });

  it("returns 401 when admin token is missing", async () => {
    requireAdmin.mockImplementation(() => {
      throw new Error("unauthorized");
    });

    const response = await DELETE(new Request("http://localhost"), {
      params: { slug: "post-1" },
    });

    expect(response.status).toBe(401);
  });

  it("returns 204 on success", async () => {
    send.mockResolvedValue({});

    const response = await DELETE(new Request("http://localhost"), {
      params: { slug: "post-1" },
    });

    expect(response.status).toBe(204);
  });
});
