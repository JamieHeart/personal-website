import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadProfile } from "@/lib/profile";

const baseProfile = {
  name: "Jamie Hartman",
  title: "Engineering Leader",
  tagline: "Building teams and platforms.",
  linkedinUrl: "https://example.com/linkedin",
  githubUrl: "https://example.com/github",
  resumeRepo: {
    owner: "resume-owner",
    repo: "resume-repo",
    readmePath: "README.md",
    pdfPath: "resume.pdf",
    ref: "main",
  },
};

describe("loadProfile", () => {
  let tempDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let originalEnv: NodeJS.ProcessEnv;

  function writeProfile(payload: unknown) {
    const filePath = path.join(tempDir, "config", "profile.json");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  }

  beforeEach(() => {
    originalEnv = { ...process.env };
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "profile-test-"));
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempDir);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  it("throws when profile config is missing", () => {
    expect(() => loadProfile()).toThrow("Missing config/profile.json");
  });

  it("loads profile config with environment overrides", () => {
    writeProfile(baseProfile);
    process.env.PROFILE_NAME = "Env Name";
    process.env.PROFILE_TITLE = "Env Title";
    process.env.PROFILE_TAGLINE = "Env Tagline";
    process.env.PROFILE_LINKEDIN_URL = "https://env/linkedin";
    process.env.PROFILE_GITHUB_URL = "https://env/github";
    process.env.RESUME_REPO_OWNER = "env-owner";
    process.env.RESUME_REPO_NAME = "env-repo";
    process.env.RESUME_REPO_README_PATH = "env-readme.md";
    process.env.RESUME_REPO_PDF_PATH = "env-resume.pdf";
    process.env.RESUME_REPO_REF = "env-ref";

    expect(loadProfile()).toEqual({
      ...baseProfile,
      name: "Env Name",
      title: "Env Title",
      tagline: "Env Tagline",
      linkedinUrl: "https://env/linkedin",
      githubUrl: "https://env/github",
      resumeRepo: {
        owner: "env-owner",
        repo: "env-repo",
        readmePath: "env-readme.md",
        pdfPath: "env-resume.pdf",
        ref: "env-ref",
      },
    });
  });
});
