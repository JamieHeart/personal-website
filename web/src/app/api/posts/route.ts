import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { blogTableName, docClient, requireAdmin } from "@/lib/dynamo";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
};

function isConditionalCheckFailed(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "ConditionalCheckFailedException"
  );
}

function normalizePost(input: Partial<BlogPost>): BlogPost {
  if (!input.slug || !input.title || !input.excerpt || !input.content) {
    throw new Error("invalid_payload");
  }

  const now = new Date().toISOString();
  return {
    slug: input.slug.trim(),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content: input.content.trim(),
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean),
    publishedAt: input.publishedAt ?? now,
    updatedAt: now,
  };
}

export async function GET() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: blogTableName,
    })
  );

  const items = (result.Items ?? []) as BlogPost[];
  items.sort((a, b) =>
    (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
  );

  return Response.json(
    items.map((item) => ({
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      tags: item.tags ?? [],
      publishedAt: item.publishedAt,
    }))
  );
}

export async function POST(request: Request) {
  try {
    requireAdmin(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Partial<BlogPost>;
  try {
    payload = (await request.json()) as Partial<BlogPost>;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  let post: BlogPost;
  try {
    post = normalizePost(payload);
  } catch {
    return new Response("Invalid post payload", { status: 400 });
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: blogTableName,
        Item: post,
        ConditionExpression: "attribute_not_exists(#slug)",
        ExpressionAttributeNames: {
          "#slug": "slug",
        },
      })
    );
  } catch (error) {
    if (isConditionalCheckFailed(error)) {
      return new Response("Slug already exists", { status: 409 });
    }
    throw error;
  }

  return Response.json(post, { status: 201 });
}
