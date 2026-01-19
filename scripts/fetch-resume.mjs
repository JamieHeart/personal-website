import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const envPath = path.join(rootDir, ".env");
const outputMarkdown = path.join(rootDir, "web", "src", "content", "resume.md");
const outputPdf = path.join(rootDir, "web", "public", "resume.pdf");
const outputPersonalization = path.join(
  rootDir,
  "web",
  "src",
  "content",
  "personalization.json"
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

function normalizeStringArray(value, { min = 1, max = 8 } = {}) {
  const items = Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
  if (items.length < min) return [];
  return items.slice(0, max);
}

function normalizePersonalization(payload) {
  const title = String(payload?.title ?? "").trim();
  const tagline = String(payload?.tagline ?? "").trim();
  const summary = String(payload?.summary ?? "")
    .replace(/\s*\n\s*/g, " ")
    .trim();
  const whatIDo = String(payload?.whatIDo ?? "")
    .replace(/\s*\n\s*/g, " ")
    .trim();
  const featured = normalizeStringArray(payload?.featured, { min: 5, max: 5 });
  const coreCompetencies = normalizeStringArray(payload?.coreCompetencies, {
    min: 4,
    max: 8,
  });
  const values = normalizeStringArray(payload?.values, { min: 3, max: 6 });
  const highlights = normalizeStringArray(payload?.highlights, { min: 3, max: 8 });
  const leadershipSkills = normalizeStringArray(
    payload?.skills?.leadership,
    { min: 3, max: 10 }
  );
  const technicalSkills = normalizeStringArray(payload?.skills?.technical, {
    min: 3,
    max: 12,
  });

  if (
    !title ||
    !tagline ||
    !summary ||
    !whatIDo ||
    featured.length < 5 ||
    coreCompetencies.length < 4 ||
    values.length < 3 ||
    highlights.length < 3 ||
    leadershipSkills.length < 3 ||
    technicalSkills.length < 3
  ) {
    throw new Error("OpenAI personalization response is incomplete.");
  }

  return {
    title,
    tagline,
    summary,
    whatIDo,
    featured,
    coreCompetencies,
    values,
    highlights,
    skills: {
      leadership: leadershipSkills,
      technical: technicalSkills,
    },
  };
}

async function generatePersonalization(readmeContent) {
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
            "- summary: 1-2 sentence overview",
            "- whatIDo: one-paragraph summary",
            "- featured: array of 5 concise bullet strings",
            "- coreCompetencies: array of 4-8 concise items",
            "- skills: object with leadership (3-10 items) and technical (3-12 items)",
            "- values: array of 3-6 leadership values",
            "- highlights: array of 3-8 measurable outcomes or differentiators",
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
  return normalizePersonalization(summary);
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
  const cached = readJsonIfExists(outputPersonalization);
  if (cached?.readmeHash === readmeHash) {
    console.log("Personalization data is up to date; skipping generation.");
  } else {
    const summary = await generatePersonalization(readmeContent);
    const payload = {
      readmeHash,
      model: openAiModel,
      generatedAt: new Date().toISOString(),
      ...summary,
    };
    fs.mkdirSync(path.dirname(outputPersonalization), { recursive: true });
    fs.writeFileSync(
      outputPersonalization,
      `${JSON.stringify(payload, null, 2)}\n`
    );
    updateProfileSummary(summary);
    console.log(`Wrote personalization summary to ${outputPersonalization}`);
  }

  console.log(`Wrote resume markdown to ${outputMarkdown}`);
  console.log(`Wrote resume PDF to ${outputPdf}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
