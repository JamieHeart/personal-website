import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/dynamo", () => ({
  requireAdmin,
}));

import { POST } from "@/app/api/posts/generate/route";

describe("POST /api/posts/generate", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    requireAdmin.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalApiKey) {
      process.env.OPENAI_API_KEY = originalApiKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });

  it("returns 401 when admin token is missing", async () => {
    requireAdmin.mockImplementation(() => {
      throw new Error("unauthorized");
    });

    const response = await POST(new Request("http://localhost"));

    expect(response.status).toBe(401);
  });

  it("returns 400 when content is missing", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns normalized fields for a valid OpenAI response", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "My Post",
                  excerpt: "Excerpt",
                  tags: ["One", "Two"],
                  slug: "My Post",
                }),
              },
            },
          ],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchSpy);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello world" }),
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.slug).toBe("my-post");
    expect(payload.tags).toEqual(["One", "Two"]);
  });
});
