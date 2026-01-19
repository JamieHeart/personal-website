import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadPersonalization } from "@/lib/personalization";

const basePersonalization = {
  title: "Engineering Leader",
  tagline: "Builds scalable teams and systems.",
  summary: "Leads multi-team engineering organizations with measurable impact.",
  whatIDo:
    "Partners with product and design to deliver reliable platforms and experiences.",
  featured: ["Leadership", "Strategy", "Delivery", "Execution", "Operations"],
  coreCompetencies: [
    "Engineering leadership",
    "Platform strategy",
    "Cloud architecture",
    "Cross-functional alignment",
  ],
  values: ["Transparency", "Empathy", "Ownership"],
  highlights: ["Delivered X", "Improved Y", "Reduced Z"],
  skills: {
    leadership: ["Coaching", "Hiring", "Stakeholder management"],
    technical: ["AWS", "Microservices", "Observability"],
  },
};

describe("loadPersonalization", () => {
  let tempDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  function writePersonalization(payload: unknown) {
    const filePath = path.join(tempDir, "src", "content", "personalization.json");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "personalization-test-"));
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempDir);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns null when personalization file is missing", () => {
    expect(loadPersonalization()).toBeNull();
  });

  it("returns null when personalization payload is incomplete", () => {
    writePersonalization({ ...basePersonalization, summary: "" });
    expect(loadPersonalization()).toBeNull();
  });

  it("returns personalization when payload is valid", () => {
    writePersonalization(basePersonalization);
    expect(loadPersonalization()).toEqual(basePersonalization);
  });
});
