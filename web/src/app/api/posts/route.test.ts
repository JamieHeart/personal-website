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

import { POST } from "@/app/api/posts/route";

describe("POST /api/posts", () => {
  beforeEach(() => {
    send.mockReset();
    requireAdmin.mockReset();
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
