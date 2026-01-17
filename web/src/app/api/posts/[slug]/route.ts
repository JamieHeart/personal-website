import {
  DeleteCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { blogTableName, docClient, requireAdmin } from "@/lib/dynamo";

type BlogPost = {
  slug: string;
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const result = await docClient.send(
    new GetCommand({
      TableName: blogTableName,
      Key: { slug: params.slug },
    })
  );

  if (!result.Item) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(result.Item);
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    requireAdmin(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: BlogPost;
  try {
    payload = (await request.json()) as BlogPost;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const updateFields: Partial<BlogPost> = {
    title: payload.title?.trim(),
    excerpt: payload.excerpt?.trim(),
    content: payload.content?.trim(),
    tags: payload.tags?.map((tag) => tag.trim()).filter(Boolean),
    publishedAt: payload.publishedAt,
    updatedAt,
  };

  await docClient.send(
    new UpdateCommand({
      TableName: blogTableName,
      Key: { slug: params.slug },
      UpdateExpression:
        "SET #title = :title, #excerpt = :excerpt, #content = :content, #tags = :tags, #publishedAt = :publishedAt, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#title": "title",
        "#excerpt": "excerpt",
        "#content": "content",
        "#tags": "tags",
        "#publishedAt": "publishedAt",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":title": updateFields.title ?? "",
        ":excerpt": updateFields.excerpt ?? "",
        ":content": updateFields.content ?? "",
        ":tags": updateFields.tags ?? [],
        ":publishedAt": updateFields.publishedAt ?? updatedAt,
        ":updatedAt": updateFields.updatedAt,
      },
    })
  );

  return Response.json({ slug: params.slug, ...updateFields });
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    requireAdmin(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  await docClient.send(
    new DeleteCommand({
      TableName: blogTableName,
      Key: { slug: params.slug },
    })
  );

  return new Response(null, { status: 204 });
}
