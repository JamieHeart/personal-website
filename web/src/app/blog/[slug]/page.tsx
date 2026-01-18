type BlogPost = {
  slug: string;
  title: string;
  content: string;
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

async function getPost(slug: string): Promise<BlogPost | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/posts/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    return (
      <section>
        <h1>Post not found</h1>
        <p>Return to the blog list to see available posts.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>{post.title}</h1>
      {post.publishedAt && (
        <p className="post-date">{formatDate(post.publishedAt)}</p>
      )}
      <div className="card">
        <p>{post.content}</p>
      </div>
      <div>
        {post.tags?.map((tag) => (
          <span className="badge" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}
