import MarkdownContent from "@/components/MarkdownContent";
import TagList from "@/components/TagList";
import { fetchPost } from "@/lib/blogApi";
import { formatDate } from "@/lib/blogFormat";

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);

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
        <MarkdownContent content={post.content} />
      </div>
      <TagList tags={post.tags} />
    </section>
  );
}
