import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MarkdownContent from "@/components/MarkdownContent";

function render(content: string) {
  return renderToStaticMarkup(
    React.createElement(MarkdownContent, { content })
  );
}

describe("MarkdownContent", () => {
  it("renders basic markdown formatting", () => {
    const html = render("**Bold**\n\n- One\n- Two");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<li>One</li>");
    expect(html).toContain("<li>Two</li>");
  });

  it("escapes raw HTML", () => {
    const html = render('<script>alert("x")</script>');
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("sanitizes dangerous links", () => {
    const html = render("[x](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });
});
