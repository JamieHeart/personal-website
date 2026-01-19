import fs from "node:fs";
import path from "node:path";

export type PersonalizationData = {
  title: string;
  tagline: string;
  summary: string;
  whatIDo: string;
  featured: string[];
  coreCompetencies: string[];
  values: string[];
  highlights: string[];
  skills: {
    leadership: string[];
    technical: string[];
  };
  generatedAt?: string;
  model?: string;
  readmeHash?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function loadPersonalization(): PersonalizationData | null {
  const personalizationPath = path.join(
    process.cwd(),
    "src",
    "content",
    "personalization.json"
  );

  if (!fs.existsSync(personalizationPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(personalizationPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<PersonalizationData>;

    if (
      !isNonEmptyString(parsed?.title) ||
      !isNonEmptyString(parsed?.tagline) ||
      !isNonEmptyString(parsed?.summary) ||
      !isNonEmptyString(parsed?.whatIDo) ||
      !isStringArray(parsed?.featured) ||
      !isStringArray(parsed?.coreCompetencies) ||
      !isStringArray(parsed?.values) ||
      !isStringArray(parsed?.highlights) ||
      !isStringArray(parsed?.skills?.leadership) ||
      !isStringArray(parsed?.skills?.technical)
    ) {
      return null;
    }

    return parsed as PersonalizationData;
  } catch {
    return null;
  }
}
