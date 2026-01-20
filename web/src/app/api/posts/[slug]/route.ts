import {
  DeleteCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { requireAdminAccess } from "@/lib/apiAuth";
import { readJson } from "@/lib/apiRequest";
import { buildPostUpdate } from "@/lib/blogPosts";
import { type BlogPostUpdatePayload } from "@/lib/blogTypes";
import { blogTableName, docClient } from "@/lib/dynamo";

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
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await readJson<BlogPostUpdatePayload>(request);
  if (!payload.ok) {
    return payload.response;
  }

  const updateFields = buildPostUpdate(payload.data);

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
        ":title": updateFields.title,
        ":excerpt": updateFields.excerpt,
        ":content": updateFields.content,
        ":tags": updateFields.tags,
        ":publishedAt": updateFields.publishedAt,
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
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  await docClient.send(
    new DeleteCommand({
      TableName: blogTableName,
      Key: { slug: params.slug },
    })
  );

  return new Response(null, { status: 204 });
}
