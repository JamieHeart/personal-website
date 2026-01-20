import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdminAccess } from "@/lib/apiAuth";
import { readJson } from "@/lib/apiRequest";
import { type BlogPost, type BlogPostCreatePayload } from "@/lib/blogTypes";
import { normalizePostInput } from "@/lib/blogPosts";
import { blogTableName, docClient } from "@/lib/dynamo";

function isConditionalCheckFailed(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "ConditionalCheckFailedException"
  );
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
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await readJson<BlogPostCreatePayload>(request);
  if (!payload.ok) {
    return payload.response;
  }

  let post: BlogPost;
  try {
    post = normalizePostInput(payload.data);
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
