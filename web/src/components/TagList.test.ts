import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TagList from "@/components/TagList";

describe("TagList", () => {
  it("renders nothing when tags are missing", () => {
    const html = renderToStaticMarkup(React.createElement(TagList));
    expect(html).toBe("");
  });

  it("renders tag badges with a wrapper class", () => {
    const html = renderToStaticMarkup(
      React.createElement(TagList, {
        tags: ["one", "two"],
        className: "tags",
      })
    );

    expect(html).toContain('class="tags"');
    expect(html).toContain('class="badge"');
    expect(html).toContain(">one<");
    expect(html).toContain(">two<");
  });
});
