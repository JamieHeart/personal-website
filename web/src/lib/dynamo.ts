import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION ?? "us-east-1";
const endpoint = process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient({
  region,
  endpoint,
});

export const docClient = DynamoDBDocumentClient.from(client);

export const blogTableName =
  process.env.BLOG_TABLE_NAME ?? "personal-website-blog-posts";

export function requireAdmin(request: Request): void {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected) {
    return;
  }
  const provided = request.headers.get("x-admin-token")?.trim();
  if (provided !== expected) {
    throw new Error("unauthorized");
  }
}
