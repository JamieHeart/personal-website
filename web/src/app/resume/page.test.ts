import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { readFile } = vi.hoisted(() => ({
  readFile: vi.fn(),
}));

const { loadProfile } = vi.hoisted(() => ({
  loadProfile: vi.fn(),
}));

const { loadPersonalization } = vi.hoisted(() => ({
  loadPersonalization: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: { readFile },
  readFile,
}));

vi.mock("@/lib/profile", () => ({
  loadProfile,
}));

vi.mock("@/lib/personalization", () => ({
  loadPersonalization,
}));

import ResumePage from "@/app/resume/page";

describe("ResumePage", () => {
  beforeEach(() => {
    readFile.mockResolvedValue("## Resume Content");
    loadProfile.mockReturnValue({
      name: "Alex Morgan",
      title: "Engineering Leader",
      tagline: "Builds reliable platforms.",
      linkedinUrl: "https://example.com/linkedin",
      githubUrl: "https://example.com/github",
    });
    loadPersonalization.mockReturnValue(null);
  });

  it("renders defaults when personalization is missing", async () => {
    const element = await ResumePage();
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, element)
    );

    expect(html).toContain("Alex Morgan");
    expect(html).toContain("Builds reliable platforms.");
    expect(html).toContain("Highlights");
    expect(html).toContain("Lead multi-team engineering organizations");
    expect(html).toContain("Resume Content");
  });

  it("renders personalization summary and what I do", async () => {
    loadPersonalization.mockReturnValue({
      title: "Personalized Title",
      tagline: "Personalized Tagline",
      summary: "Personalized summary",
      whatIDo: "Personalized what I do",
      featured: [],
      coreCompetencies: ["Core competency"],
      values: ["Value"],
      highlights: ["Highlight"],
      skills: { leadership: ["Leadership"], technical: ["Technical"] },
    });

    const element = await ResumePage();
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, element)
    );

    expect(html).toContain("Personalized summary");
    expect(html).toContain("Personalized what I do");
    expect(html).toContain("Highlight");
    expect(html).toContain("Core competency");
  });
});
