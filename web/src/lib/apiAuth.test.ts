import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdmin } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/dynamo", () => ({
  requireAdmin,
}));

import { requireAdminAccess } from "@/lib/apiAuth";

describe("requireAdminAccess", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
  });

  it("returns a 401 response when admin check fails", () => {
    requireAdmin.mockImplementation(() => {
      throw new Error("unauthorized");
    });

    const response = requireAdminAccess(new Request("http://localhost"));

    expect(response?.status).toBe(401);
  });

  it("returns null when admin check passes", () => {
    requireAdmin.mockImplementation(() => undefined);

    const response = requireAdminAccess(new Request("http://localhost"));

    expect(response).toBeNull();
  });
});
