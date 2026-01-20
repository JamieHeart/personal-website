import { type BlogPost, type BlogPostSummary } from "@/lib/blogTypes";

const fallbackBaseUrl = "http://localhost:3000";

export function getSiteBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? fallbackBaseUrl;
}

export async function fetchPosts(): Promise<BlogPostSummary[]> {
  const res = await fetch(`${getSiteBaseUrl()}/api/posts`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return (await res.json()) as BlogPostSummary[];
}

export async function fetchPost(slug: string): Promise<BlogPost | null> {
  const res = await fetch(
    `${getSiteBaseUrl()}/api/posts/${encodeURIComponent(slug)}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as BlogPost;
}
