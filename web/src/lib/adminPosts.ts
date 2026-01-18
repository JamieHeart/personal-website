export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
};

export type GeneratedFields = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
};

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
