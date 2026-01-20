export type JsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: Response };

export async function readJson<T>(request: Request): Promise<JsonResult<T>> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, response: new Response("Invalid JSON", { status: 400 }) };
  }
}
