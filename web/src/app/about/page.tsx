import MarkdownContent from "@/components/MarkdownContent";

export default async function AboutPage() {
  const aboutMarkdown = `
# About This Site

This site is built to auto-personalize from a private resume repository. It turns your resume into structured content during the build, then serves a fast, personalized site at runtime.

## What happens at build time

- Pull resume README and PDF from a private GitHub repo.
- Use OpenAI to summarize the resume into structured data.
- Generate the site content and assets from that data.

## What happens at runtime

- Serve personalized pages based on the generated data.
- Provide a blog API for posts and updates.
- Support future on-demand personalization via API routes.
`.trim();

  return (
    <section>
      <h1>About This Site</h1>
      <div className="card">
        <MarkdownContent content={aboutMarkdown} />
        <div style={{ overflowX: "auto", marginTop: "16px" }}>
          <svg
            viewBox="0 0 720 180"
            role="img"
            aria-label="Build flow from resume repo to site pages"
            style={{ width: "100%", maxWidth: "720px", height: "auto" }}
          >
            <rect
              x="20"
              y="30"
              width="160"
              height="50"
              rx="8"
              fill="#111827"
              stroke="#1f2937"
            />
            <text x="100" y="60" textAnchor="middle" fill="#e2e8f0" fontSize="12">
              Private Resume Repo
            </text>

            <rect
              x="220"
              y="30"
              width="160"
              height="50"
              rx="8"
              fill="#111827"
              stroke="#1f2937"
            />
            <text x="300" y="60" textAnchor="middle" fill="#e2e8f0" fontSize="12">
              fetch-resume.mjs
            </text>

            <rect
              x="420"
              y="30"
              width="160"
              height="50"
              rx="8"
              fill="#111827"
              stroke="#1f2937"
            />
            <text x="500" y="60" textAnchor="middle" fill="#e2e8f0" fontSize="12">
              personalization.json
            </text>

            <rect
              x="570"
              y="100"
              width="130"
              height="50"
              rx="8"
              fill="#111827"
              stroke="#1f2937"
            />
            <text x="635" y="130" textAnchor="middle" fill="#e2e8f0" fontSize="12">
              Site Pages
            </text>

            <line x1="180" y1="55" x2="220" y2="55" stroke="#93c5fd" strokeWidth="2" />
            <line x1="380" y1="55" x2="420" y2="55" stroke="#93c5fd" strokeWidth="2" />
            <line x1="580" y1="80" x2="635" y2="100" stroke="#93c5fd" strokeWidth="2" />

            <polygon points="220,50 220,60 230,55" fill="#93c5fd" />
            <polygon points="420,50 420,60 430,55" fill="#93c5fd" />
            <polygon points="635,100 625,105 635,110" fill="#93c5fd" />
          </svg>
        </div>
      </div>
    </section>
  );
}
