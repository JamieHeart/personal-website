import {
  type BlogPost,
  type BlogPostCreatePayload,
  type BlogPostUpdatePayload,
} from "@/lib/blogTypes";

function normalizeRequiredText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim();
}

export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

export function normalizePostInput(input: BlogPostCreatePayload): BlogPost {
  const slug = normalizeRequiredText(input.slug);
  const title = normalizeRequiredText(input.title);
  const excerpt = normalizeRequiredText(input.excerpt);
  const content = normalizeRequiredText(input.content);

  if (!slug || !title || !excerpt || !content) {
    throw new Error("invalid_payload");
  }

  const now = new Date().toISOString();
  const tags = normalizeTags(input.tags);

  return {
    slug,
    title,
    excerpt,
    content,
    tags: tags.length ? tags : undefined,
    publishedAt:
      typeof input.publishedAt === "string" ? input.publishedAt : now,
    updatedAt: now,
  };
}

export type BlogPostUpdateFields = {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
};

export function buildPostUpdate(
  payload: BlogPostUpdatePayload
): BlogPostUpdateFields {
  const updatedAt = new Date().toISOString();

  return {
    title: normalizeOptionalText(payload.title) ?? "",
    excerpt: normalizeOptionalText(payload.excerpt) ?? "",
    content: normalizeOptionalText(payload.content) ?? "",
    tags: normalizeTags(payload.tags),
    publishedAt:
      typeof payload.publishedAt === "string"
        ? payload.publishedAt
        : updatedAt,
    updatedAt,
  };
}
