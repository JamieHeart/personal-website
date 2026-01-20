export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
};

export type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  tags?: string[];
  publishedAt?: string;
};

export type BlogPostCreatePayload = Partial<
  Pick<BlogPost, "slug" | "title" | "excerpt" | "content" | "tags" | "publishedAt">
>;

export type BlogPostUpdatePayload = Partial<
  Pick<BlogPost, "title" | "excerpt" | "content" | "tags" | "publishedAt">
>;

export type GeneratedFields = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
};
