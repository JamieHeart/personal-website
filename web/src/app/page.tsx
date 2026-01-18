import fs from "node:fs/promises";
import path from "node:path";
import { loadProfile } from "@/lib/profile";

type WhatIDoSummary = {
  title: string;
  tagline: string;
  whatIDo: string;
  featured: string[];
};

async function loadWhatIDo() {
  const summaryPath = path.join(process.cwd(), "src", "content", "what-i-do.json");
  try {
    const raw = await fs.readFile(summaryPath, "utf-8");
    const parsed = JSON.parse(raw) as WhatIDoSummary;
    if (
      !parsed?.title ||
      !parsed?.tagline ||
      !parsed?.whatIDo ||
      !Array.isArray(parsed?.featured)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const profile = loadProfile();
  const summary = await loadWhatIDo();
  const title = summary?.title ?? profile.title ?? "Software Engineering Leader";
  const tagline =
    summary?.tagline ??
    profile.tagline ??
    "Building high-performing teams and scalable systems.";
  const whatIDo =
    summary?.whatIDo ??
    "Engineering management, technical strategy, and product delivery with an emphasis on AI-enabled workflows and reliability.";
  const featured =
    summary?.featured ?? [
      "Operational excellence and delivery leadership",
      "Cross-functional alignment and roadmap execution",
      "Coaching engineers into strong technical leaders",
      "AI-enabled process improvement and automation",
      "Scalable systems and reliability practices",
    ];

  return (
    <section className="hero">
      <h1>{title}</h1>
      <p>{tagline}</p>
      <div className="card">
        <h2>What I Do</h2>
        <p>{whatIDo}</p>
      </div>
      <div className="card">
        <h2>Featured</h2>
        <ul>
          {featured.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
