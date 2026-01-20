import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import StatusMessage from "@/components/StatusMessage";

describe("StatusMessage", () => {
  it("renders info state by default", () => {
    const html = renderToStaticMarkup(
      React.createElement(StatusMessage, { message: "Saved" })
    );

    expect(html).toContain('class="status-message status-info"');
    expect(html).toContain('role="status"');
    expect(html).toContain("Saved");
  });

  it("renders error state with alert role", () => {
    const html = renderToStaticMarkup(
      React.createElement(StatusMessage, { message: "Failed", variant: "error" })
    );

    expect(html).toContain('class="status-message status-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Failed");
  });
});
