import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadProfile } from "@/lib/profile";

async function loadResumeMarkdown() {
  const resumePath = path.join(process.cwd(), "src", "content", "resume.md");
  return fs.readFile(resumePath, "utf-8");
}

export default async function ResumePage() {
  const profile = loadProfile();
  const resumeMarkdown = await loadResumeMarkdown();

  return (
    <section>
      <h1>{profile.name}</h1>
      <div className="card">
        <h2>Summary</h2>
        <p>{profile.tagline}</p>
      </div>
      <div className="card">
        <h2>Resume Content</h2>
        <div className="resume-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {resumeMarkdown}
          </ReactMarkdown>
        </div>
      </div>
      <div className="card">
        <h2>Download</h2>
        <p>
          <a href="/resume.pdf">Download PDF</a>
        </p>
      </div>
    </section>
  );
}
