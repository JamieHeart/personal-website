import { loadPersonalization } from "@/lib/personalization";
import { loadProfile } from "@/lib/profile";

type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  tags?: string[];
  publishedAt?: string;
};

async function loadRecentPosts(): Promise<BlogPostSummary[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/posts`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const posts = (await res.json()) as BlogPostSummary[];
  return posts.slice(0, 3);
}

async function loadAllPosts(): Promise<BlogPostSummary[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/posts`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as BlogPostSummary[];
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function HomePage() {
  const recentPosts = await loadRecentPosts();
  const allPosts = await loadAllPosts();
  const tagCounts = allPosts
    .flatMap((post) => post.tags ?? [])
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {});
  const tagEntries = Object.entries(tagCounts);
  const counts = tagEntries.map(([, count]) => count);
  const minCount = counts.length ? Math.min(...counts) : 0;
  const maxCount = counts.length ? Math.max(...counts) : 0;

  return (
    <section className="hero">
      <div className="card">
        <h2>About This Site</h2>
        <p>
          This site auto-builds from a private resume repo. During build, it
          fetches the resume, uses OpenAI to generate personalization data, and
          renders pages from that structured output.
        </p>
        <p>
          At runtime, the site serves those personalized pages and a blog API,
          with profile fallbacks for local development.
        </p>
        <p>
          <a href="/about">Read the project README</a>
        </p>
      </div>
      <div className="card">
        <h2>Latest Posts</h2>
        {recentPosts.length === 0 ? (
          <p>
            No posts yet. Create one via the{" "}
            <a href="/admin/posts">admin editor</a>.
          </p>
        ) : (
          recentPosts.map((post) => (
            <div key={post.slug} className="post-preview">
              <h3>
                <a href={`/blog/${post.slug}`}>{post.title}</a>
              </h3>
              {post.publishedAt && (
                <p className="post-date">{formatDate(post.publishedAt)}</p>
              )}
              <p>{post.excerpt}</p>
              {!!post.tags?.length && (
                <div>
                  {post.tags.map((tag) => (
                    <span className="badge" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="card">
        <h2>Tag Cloud</h2>
        {tagEntries.length === 0 ? (
          <p>No tags yet.</p>
        ) : (
          <div className="tag-cloud">
            {tagEntries
              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
              .map(([tag, count]) => {
                const weight =
                  maxCount === minCount
                    ? 0.5
                    : (count - minCount) / (maxCount - minCount);
                const size = 12 + weight * 12;
                return (
                  <span
                    key={tag}
                    className="tag-cloud-item"
                    style={{ fontSize: `${size}px` }}
                  >
                    {tag}
                  </span>
                );
              })}
          </div>
        )}
      </div>
    </section>
  );
}
