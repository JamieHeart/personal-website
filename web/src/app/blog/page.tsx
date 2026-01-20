import TagList from "@/components/TagList";
import { fetchPosts } from "@/lib/blogApi";
import { formatDate } from "@/lib/blogFormat";

export default async function BlogPage() {
  const posts = await fetchPosts();

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
          <TagList tags={post.tags} />
        </div>
      ))}
    </section>
  );
}
