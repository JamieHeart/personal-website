// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminPostsPage from "@/app/admin/posts/page";

function createJsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status });
}

describe("AdminPostsPage", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads posts and populates the edit form", async () => {
    const fetchMock = vi.fn((input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;
      if (url === "/api/posts") {
        return Promise.resolve(
          createJsonResponse([
            {
              slug: "post-1",
              title: "Post 1",
              excerpt: "Excerpt 1",
              tags: ["tag"],
            },
          ])
        );
      }
      if (url === "/api/posts/post-1") {
        return Promise.resolve(
          createJsonResponse({
            slug: "post-1",
            title: "Post 1",
            excerpt: "Excerpt 1",
            content: "Content",
            tags: ["tag"],
            publishedAt: "2024-01-01T00:00:00Z",
          })
        );
      }
      return Promise.resolve(new Response("Not found", { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(React.createElement(AdminPostsPage));

    expect(await screen.findByText("Post 1")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Update post" })).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("my-post")).toHaveValue("post-1");
    expect(screen.getByPlaceholderText("Post title")).toHaveValue("Post 1");
  });

  it("shows slug conflicts after debounce", async () => {
    const fetchMock = vi.fn((input: RequestInfo) => {
      const url = typeof input === "string" ? input : input.url;
      if (url === "/api/posts") {
        return Promise.resolve(createJsonResponse([]));
      }
      if (url === "/api/posts/conflict-slug") {
        return Promise.resolve(createJsonResponse({ slug: "conflict-slug" }));
      }
      return Promise.resolve(new Response("Not found", { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(React.createElement(AdminPostsPage));

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("my-post"), "conflict-slug");

    expect(
      await screen.findByText("Slug already exists.", {}, { timeout: 2000 })
    ).toBeInTheDocument();
  });

  it("deletes posts and refreshes the list", async () => {
    localStorage.setItem("adminToken", "secret");
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    let listCalls = 0;
    const fetchMock = vi.fn((input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      if (url === "/api/posts") {
        listCalls += 1;
        return Promise.resolve(
          createJsonResponse(
            listCalls === 1
              ? [
                  {
                    slug: "post-1",
                    title: "Post 1",
                    excerpt: "Excerpt 1",
                    tags: [],
                  },
                ]
              : []
          )
        );
      }
      if (url === "/api/posts/post-1" && init?.method === "DELETE") {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(new Response("Not found", { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(React.createElement(AdminPostsPage));

    await waitFor(() => {
      expect(screen.getByLabelText("x-admin-token")).toHaveValue("secret");
    });

    expect(await screen.findByText("Post 1")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Post deleted.")).toBeInTheDocument();
    expect(await screen.findByText("No posts yet.")).toBeInTheDocument();

    const deleteCall = fetchMock.mock.calls.find(
      ([input, init]) =>
        (typeof input === "string" ? input : input.url) === "/api/posts/post-1" &&
        init?.method === "DELETE"
    );
    expect(deleteCall?.[1]?.headers).toMatchObject({
      "Content-Type": "application/json",
      "x-admin-token": "secret",
    });

    confirmSpy.mockRestore();
  });
});
