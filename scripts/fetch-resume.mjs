import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const profilePath = path.join(rootDir, "config", "profile.json");
const outputMarkdown = path.join(rootDir, "web", "src", "content", "resume.md");
const outputPdf = path.join(rootDir, "web", "public", "resume.pdf");

if (!fs.existsSync(profilePath)) {
  throw new Error("Missing config/profile.json");
}

const profile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
const resumeRepo = profile.resumeRepo ?? {};

const owner = process.env.RESUME_REPO_OWNER ?? resumeRepo.owner;
const repo = process.env.RESUME_REPO_NAME ?? resumeRepo.repo;
const readmePath = process.env.RESUME_REPO_README_PATH ?? resumeRepo.readmePath;
const pdfPath = process.env.RESUME_REPO_PDF_PATH ?? resumeRepo.pdfPath;
const ref = process.env.RESUME_REPO_REF ?? resumeRepo.ref ?? "main";
const token = process.env.RESUME_REPO_TOKEN;

if (!owner || !repo || !readmePath || !pdfPath) {
  throw new Error("Resume repo config is incomplete.");
}

if (!token) {
  throw new Error("Missing RESUME_REPO_TOKEN env var.");
}

const apiBase = "https://api.github.com";
const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

async function fetchContent(filePath) {
  const url = `${apiBase}/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
  }
  return response.json();
}

async function main() {
  const readme = await fetchContent(readmePath);
  const pdf = await fetchContent(pdfPath);

  const readmeContent = Buffer.from(readme.content, "base64").toString("utf-8");
  fs.mkdirSync(path.dirname(outputMarkdown), { recursive: true });
  fs.writeFileSync(outputMarkdown, readmeContent);

  const pdfContent = Buffer.from(pdf.content, "base64");
  fs.writeFileSync(outputPdf, pdfContent);

  console.log(`Wrote resume markdown to ${outputMarkdown}`);
  console.log(`Wrote resume PDF to ${outputPdf}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
