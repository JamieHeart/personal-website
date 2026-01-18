import { describe, expect, it } from "vitest";
import { mergeGeneratedFields, type BlogPost, type GeneratedFields } from "@/lib/adminPosts";

const baseForm: BlogPost = {
  slug: "",
  title: "",
  excerpt: "",
  content: "Some content",
  tags: [],
  publishedAt: "",
};

const generated: GeneratedFields = {
  slug: "generated-slug",
  title: "Generated Title",
  excerpt: "Generated excerpt.",
  tags: ["leadership", "engineering"],
};

describe("mergeGeneratedFields", () => {
  it("fills only missing fields", () => {
    const form: BlogPost = {
      ...baseForm,
      title: "Custom Title",
      tags: ["custom-tag"],
    };

    const merged = mergeGeneratedFields(form, generated);

    expect(merged.title).toBe("Custom Title");
    expect(merged.tags).toEqual(["custom-tag"]);
    expect(merged.slug).toBe("generated-slug");
    expect(merged.excerpt).toBe("Generated excerpt.");
  });

  it("uses generated values when fields are empty", () => {
    const merged = mergeGeneratedFields(baseForm, generated);

    expect(merged.slug).toBe("generated-slug");
    expect(merged.title).toBe("Generated Title");
    expect(merged.excerpt).toBe("Generated excerpt.");
    expect(merged.tags).toEqual(["leadership", "engineering"]);
  });
});
