import { afterEach, describe, expect, it } from "vitest";

import { requireAdmin } from "@/lib/dynamo";

describe("requireAdmin", () => {
  const originalToken = process.env.ADMIN_TOKEN;

  afterEach(() => {
    if (originalToken) {
      process.env.ADMIN_TOKEN = originalToken;
    } else {
      delete process.env.ADMIN_TOKEN;
    }
  });

  it("allows requests when ADMIN_TOKEN is unset", () => {
    delete process.env.ADMIN_TOKEN;
    const request = new Request("http://localhost");

    expect(() => requireAdmin(request)).not.toThrow();
  });

  it("throws when token does not match", () => {
    process.env.ADMIN_TOKEN = "secret";
    const request = new Request("http://localhost");

    expect(() => requireAdmin(request)).toThrow("unauthorized");
  });

  it("allows when token matches", () => {
    process.env.ADMIN_TOKEN = "secret";
    const request = new Request("http://localhost", {
      headers: { "x-admin-token": "secret" },
    });

    expect(() => requireAdmin(request)).not.toThrow();
  });
});
