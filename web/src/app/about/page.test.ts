import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AboutPage from "@/app/about/page";

describe("AboutPage", () => {
  it("renders the about content and diagram", async () => {
    const element = await AboutPage();
    const html = renderToStaticMarkup(
      React.createElement(React.Fragment, null, element)
    );

    expect(html).toContain("About This Site");
    expect(html).toContain("Build flow from resume repo to site pages");
    expect(html).toContain("fetch-resume.mjs");
  });
});
