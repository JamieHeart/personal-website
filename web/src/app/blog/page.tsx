type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  tags?: string[];
  publishedAt?: string;
};

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

async function getPosts(): Promise<BlogPost[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/posts`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <section>
      <h1>Blog</h1>
      {posts.length === 0 && (
        <div className="card">
          <p>
            No posts yet. Create one via the{" "}
            <a href="/admin/posts">admin editor</a>.
          </p>
        </div>
      )}
      {posts.map((post) => (
        <div className="card" key={post.slug}>
          <h2>
            <a href={`/blog/${post.slug}`}>{post.title}</a>
          </h2>
          {post.publishedAt && (
            <p className="post-date">{formatDate(post.publishedAt)}</p>
          )}
          <p>{post.excerpt}</p>
          <div>
            {post.tags?.map((tag) => (
              <span className="badge" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
