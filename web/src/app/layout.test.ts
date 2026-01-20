import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { loadProfile, loadPersonalization } = vi.hoisted(() => {
  const loadProfile = vi.fn(() => ({
    name: "Jamie Hartman",
    title: "Engineering Leader",
    tagline: "Building great teams.",
    linkedinUrl: "https://example.com/linkedin",
    githubUrl: "https://example.com/github",
  }));
  const loadPersonalization = vi.fn(() => ({
    title: "Personalized Title",
    tagline: "Personalized Tagline",
  }));
  return { loadProfile, loadPersonalization };
});

vi.mock("@/lib/profile", () => ({
  loadProfile,
}));

vi.mock("@/lib/personalization", () => ({
  loadPersonalization,
}));

vi.mock("next/image", async () => {
  const ReactModule = await import("react");
  return {
    default: (props: Record<string, unknown>) =>
      ReactModule.createElement("img", props),
  };
});

import RootLayout, { metadata } from "@/app/layout";

describe("RootLayout", () => {
  it("builds metadata from personalization values", () => {
    expect(metadata.title).toBe("Jamie Hartman - Personalized Title");
    expect(metadata.description).toBe("Personalized Tagline");
  });

  it("renders header, footer, and children", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        RootLayout,
        null,
        React.createElement("div", null, "Child content")
      )
    );

    expect(html).toContain("Jamie Hartman");
    expect(html).toContain("Child content");
    expect(html).toContain("site-header");
    expect(html).toContain("site-footer");
  });
});
