import { requireAdmin } from "@/lib/dynamo";

export function requireAdminAccess(request: Request): Response | null {
  try {
    requireAdmin(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
