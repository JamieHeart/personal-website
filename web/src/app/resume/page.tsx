import fs from "node:fs/promises";
import path from "node:path";
import { loadPersonalization } from "@/lib/personalization";
import { loadProfile } from "@/lib/profile";
import MarkdownContent from "@/components/MarkdownContent";

const DEFAULT_HIGHLIGHTS = [
  "Lead multi-team engineering organizations and platform roadmaps",
  "Deliver reliable, cloud-native services with measurable outcomes",
  "Coach managers and engineers to scale impact",
];
const DEFAULT_CORE_COMPETENCIES = [
  "Engineering leadership and operating rhythm",
  "Platform strategy and API-first services",
  "Cloud-native architecture and reliability",
  "Cross-functional alignment and delivery",
];
const DEFAULT_LEADERSHIP_SKILLS = [
  "Coaching and mentorship",
  "Stakeholder alignment",
  "Hiring and team development",
];
const DEFAULT_TECHNICAL_SKILLS = [
  "AWS/GCP and cloud-native architecture",
  "API-first services and microservices",
  "Observability and reliability practices",
];
const DEFAULT_VALUES = [
  "Transparency and accountability",
  "Empathy and collaboration",
  "Continuous learning",
];

async function loadResumeMarkdown() {
  const resumePath = path.join(process.cwd(), "src", "content", "resume.md");
  return fs.readFile(resumePath, "utf-8");
}

export default async function ResumePage() {
  const profile = loadProfile();
  const personalization = loadPersonalization();
  const resumeMarkdown = await loadResumeMarkdown();
  const summary = personalization?.summary ?? profile.tagline;
  const whatIDo = personalization?.whatIDo;
  const highlights =
    personalization?.highlights ?? DEFAULT_HIGHLIGHTS;
  const coreCompetencies =
    personalization?.coreCompetencies ?? DEFAULT_CORE_COMPETENCIES;
  const leadershipSkills =
    personalization?.skills?.leadership ?? DEFAULT_LEADERSHIP_SKILLS;
  const technicalSkills =
    personalization?.skills?.technical ?? DEFAULT_TECHNICAL_SKILLS;
  const values = personalization?.values ?? DEFAULT_VALUES;
  const shouldRenderWhatIDo = whatIDo && whatIDo !== summary;

  return (
    <section>
      <h1>{profile.name}</h1>
      <div className="card">
        <h2>Summary</h2>
        <p>{summary}</p>
        {shouldRenderWhatIDo ? <p>{whatIDo}</p> : null}
      </div>
      <div className="card">
        <h2>Highlights</h2>
        <ul>
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Core Competencies</h2>
        <ul>
          {coreCompetencies.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Skills</h2>
        <h3>Leadership</h3>
        <ul>
          {leadershipSkills.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3>Technical</h3>
        <ul>
          {technicalSkills.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Values</h2>
        <ul>
          {values.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Resume Content</h2>
        <MarkdownContent content={resumeMarkdown} />
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
