import fs from "node:fs/promises";
import path from "node:path";
import { loadPersonalization } from "@/lib/personalization";
import { loadProfile } from "@/lib/profile";
import MarkdownContent from "@/components/MarkdownContent";

async function loadResumeMarkdown() {
  const resumePath = path.join(process.cwd(), "src", "content", "resume.md");
  return fs.readFile(resumePath, "utf-8");
}

export default async function ResumePage() {
  const profile = loadProfile();
  const personalization = loadPersonalization();
  const resumeMarkdown = await loadResumeMarkdown();
  const summary = personalization?.summary ?? profile.tagline;
  const whatIDo = personalization?.whatIDo ?? profile.tagline;
  const highlights =
    personalization?.highlights ?? [
      "Lead multi-team engineering organizations and platform roadmaps",
      "Deliver reliable, cloud-native services with measurable outcomes",
      "Coach managers and engineers to scale impact",
    ];
  const coreCompetencies =
    personalization?.coreCompetencies ?? [
      "Engineering leadership and operating rhythm",
      "Platform strategy and API-first services",
      "Cloud-native architecture and reliability",
      "Cross-functional alignment and delivery",
    ];
  const leadershipSkills =
    personalization?.skills?.leadership ?? [
      "Coaching and mentorship",
      "Stakeholder alignment",
      "Hiring and team development",
    ];
  const technicalSkills =
    personalization?.skills?.technical ?? [
      "AWS/GCP and cloud-native architecture",
      "API-first services and microservices",
      "Observability and reliability practices",
    ];
  const values =
    personalization?.values ?? [
      "Transparency and accountability",
      "Empathy and collaboration",
      "Continuous learning",
    ];

  return (
    <section>
      <h1>{profile.name}</h1>
      <div className="card">
        <h2>Summary</h2>
        <p>{summary}</p>
        <p>{whatIDo}</p>
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
