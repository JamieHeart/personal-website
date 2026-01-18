import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

const allowedProtocols = new Set(["http:", "https:", "mailto:"]);

function sanitizeUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url, "https://example.com");
    if (allowedProtocols.has(parsed.protocol)) return url;
    if (parsed.origin === "https://example.com") return url;
  } catch {
    return "";
  }
  return "";
}

export default function MarkdownContent({
  content,
  className = "markdown-content",
}: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={sanitizeUrl}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
