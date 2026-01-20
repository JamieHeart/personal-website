import { describe, expect, it } from "vitest";

import { readJson } from "@/lib/apiRequest";

describe("readJson", () => {
  it("returns parsed data for valid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: 42 }),
    });

    const result = await readJson<{ value: number }>(request);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.value).toBe(42);
    }
  });

  it("returns error response for invalid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad-json",
    });

    const result = await readJson(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });
});
