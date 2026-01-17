import fs from "node:fs";
import path from "node:path";

export type ResumeRepoConfig = {
  owner: string;
  repo: string;
  readmePath: string;
  pdfPath: string;
  ref?: string;
};

export type ProfileConfig = {
  name: string;
  title: string;
  tagline: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeRepo?: ResumeRepoConfig;
};

export function loadProfile(): ProfileConfig {
  const configPath = path.join(process.cwd(), "..", "config", "profile.json");
  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = JSON.parse(raw) as ProfileConfig;

  return {
    ...parsed,
    name: process.env.PROFILE_NAME ?? parsed.name,
    title: process.env.PROFILE_TITLE ?? parsed.title,
    tagline: process.env.PROFILE_TAGLINE ?? parsed.tagline,
    linkedinUrl: process.env.PROFILE_LINKEDIN_URL ?? parsed.linkedinUrl,
    githubUrl: process.env.PROFILE_GITHUB_URL ?? parsed.githubUrl,
    resumeRepo: parsed.resumeRepo
      ? {
          ...parsed.resumeRepo,
          owner: process.env.RESUME_REPO_OWNER ?? parsed.resumeRepo.owner,
          repo: process.env.RESUME_REPO_NAME ?? parsed.resumeRepo.repo,
          readmePath:
            process.env.RESUME_REPO_README_PATH ?? parsed.resumeRepo.readmePath,
          pdfPath: process.env.RESUME_REPO_PDF_PATH ?? parsed.resumeRepo.pdfPath,
          ref: process.env.RESUME_REPO_REF ?? parsed.resumeRepo.ref,
        }
      : undefined,
  };
}
