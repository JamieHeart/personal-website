import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const envPath = path.join(rootDir, ".env");
const outputMarkdown = path.join(rootDir, "web", "src", "content", "resume.md");
const outputPdf = path.join(rootDir, "web", "public", "resume.pdf");

if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const owner = process.env.RESUME_REPO_OWNER;
const repo = process.env.RESUME_REPO_NAME;
const readmePath = process.env.RESUME_REPO_README_PATH;
const pdfPath = process.env.RESUME_REPO_PDF_PATH;
const ref = process.env.RESUME_REPO_REF ?? "main";
const token = process.env.RESUME_REPO_TOKEN;

if (!owner || !repo || !readmePath || !pdfPath) {
  throw new Error(
    "Resume repo config is incomplete. Set RESUME_REPO_* in .env or your environment."
  );
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
