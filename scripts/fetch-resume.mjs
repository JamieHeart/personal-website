import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const envPath = path.join(rootDir, ".env");
const outputMarkdown = path.join(rootDir, "web", "src", "content", "resume.md");
const outputPdf = path.join(rootDir, "web", "public", "resume.pdf");
const outputWhatIDo = path.join(
  rootDir,
  "web",
  "src",
  "content",
  "what-i-do.json"
);
const profilePath = path.join(rootDir, "config", "profile.json");

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
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModelOverride = process.env.OPENAI_MODEL;
const isCi =
  process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const openAiModel = openAiModelOverride ?? (isCi ? "gpt-4o" : "gpt-4o-mini");

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

async function fetchFileBuffer(filePath) {
  const file = await fetchContent(filePath);
  if (file.content && file.encoding === "base64") {
    return Buffer.from(file.content, "base64");
  }
  if (file.download_url) {
    const response = await fetch(file.download_url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download ${filePath}: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  throw new Error(`No content available for ${filePath}.`);
}

async function fetchFileText(filePath) {
  const buffer = await fetchFileBuffer(filePath);
  return buffer.toString("utf-8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to read ${filePath}; regenerating.`, error);
    return null;
  }
}

function normalizeSummary(summary) {
  const title = String(summary?.title ?? "").trim();
  const tagline = String(summary?.tagline ?? "").trim();
  const whatIDo = String(summary?.whatIDo ?? "")
    .replace(/\s*\n\s*/g, " ")
    .trim();
  const featured = Array.isArray(summary?.featured)
    ? summary.featured.map((item) => String(item).trim()).filter(Boolean)
    : [];

  if (!title || !tagline || !whatIDo || featured.length < 5) {
    throw new Error("OpenAI summary response is incomplete.");
  }

  return {
    title,
    tagline,
    whatIDo,
    featured: featured.slice(0, 5),
  };
}

async function generateWhatIDo(readmeContent) {
  if (!openAiApiKey) {
    throw new Error("Missing OPENAI_API_KEY env var.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAiModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a professional resume summarizer. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: [
            "Summarize the following resume README into JSON with these keys:",
            "- title: professional title",
            "- tagline: single-sentence statement",
            "- whatIDo: one paragraph summary",
            "- featured: array of 5 concise bullet strings",
            "Keep tone professional, confident, and concise.",
            "",
            "Resume README:",
            readmeContent,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response missing content.");
  }

  const summary = JSON.parse(content);
  return normalizeSummary(summary);
}

function updateProfileSummary(summary) {
  if (!fs.existsSync(profilePath)) return;
  try {
    const raw = fs.readFileSync(profilePath, "utf-8");
    const profile = JSON.parse(raw);
    profile.title = summary.title;
    profile.tagline = summary.tagline;
    fs.writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  } catch (error) {
    console.warn(`Failed to update ${profilePath}.`, error);
  }
}

async function main() {
  const readmeContent = await fetchFileText(readmePath);
  fs.mkdirSync(path.dirname(outputMarkdown), { recursive: true });
  fs.writeFileSync(outputMarkdown, readmeContent);

  const pdfContent = await fetchFileBuffer(pdfPath);
  fs.mkdirSync(path.dirname(outputPdf), { recursive: true });
  fs.writeFileSync(outputPdf, pdfContent);

  const readmeHash = sha256(readmeContent);
  const cached = readJsonIfExists(outputWhatIDo);
  if (cached?.readmeHash === readmeHash) {
    console.log("What I Do summary is up to date; skipping generation.");
  } else {
    const summary = await generateWhatIDo(readmeContent);
    const payload = {
      readmeHash,
      model: openAiModel,
      generatedAt: new Date().toISOString(),
      ...summary,
    };
    fs.mkdirSync(path.dirname(outputWhatIDo), { recursive: true });
    fs.writeFileSync(outputWhatIDo, `${JSON.stringify(payload, null, 2)}\n`);
    updateProfileSummary(summary);
    console.log(`Wrote What I Do summary to ${outputWhatIDo}`);
  }

  console.log(`Wrote resume markdown to ${outputMarkdown}`);
  console.log(`Wrote resume PDF to ${outputPdf}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
