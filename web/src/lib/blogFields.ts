import { type BlogPost, type GeneratedFields } from "@/lib/blogTypes";

const maxExcerptLength = 200;
const maxTags = 7;
const maxSlugLength = 80;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxSlugLength);
}

export function normalizeGeneratedFields(
  fields: Partial<GeneratedFields>
): GeneratedFields {
  const title = String(fields.title ?? "").trim();
  const excerpt = String(fields.excerpt ?? "").trim();
  const tags = Array.isArray(fields.tags)
    ? fields.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const slug = slugify(String(fields.slug ?? title));

  if (!title || !excerpt || !slug || tags.length === 0) {
    throw new Error("invalid_payload");
  }

  return {
    title,
    excerpt: excerpt.slice(0, maxExcerptLength),
    tags: tags.slice(0, maxTags),
    slug,
  };
}

export function mergeGeneratedFields(
  form: BlogPost,
  generated: GeneratedFields
): BlogPost {
  return {
    ...form,
    slug: form.slug.trim() ? form.slug : generated.slug,
    title: form.title.trim() ? form.title : generated.title,
    excerpt: form.excerpt.trim() ? form.excerpt : generated.excerpt,
    tags: form.tags?.length ? form.tags : generated.tags,
  };
}
