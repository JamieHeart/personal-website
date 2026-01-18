import { requireAdmin } from "@/lib/dynamo";

type GenerateRequest = {
  content?: string;
};

type GeneratedFields = {
  title: string;
  excerpt: string;
  tags: string[];
  slug: string;
};

const defaultModel = "gpt-4o-mini";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeFields(fields: Partial<GeneratedFields>): GeneratedFields {
  const title = String(fields.title ?? "").trim();
  const excerpt = String(fields.excerpt ?? "").trim();
  const tags = Array.isArray(fields.tags)
    ? fields.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const slug = slugify(String(fields.slug ?? title));

  if (!title || !excerpt || !slug || tags.length === 0) {
    throw new Error("invalid_payload");
  }

  return {
    title,
    excerpt: excerpt.slice(0, 200),
    tags: tags.slice(0, 7),
    slug,
  };
}

export async function POST(request: Request) {
  try {
    requireAdmin(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: GenerateRequest;
  try {
    payload = (await request.json()) as GenerateRequest;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const content = payload.content?.trim();
  if (!content) {
    return new Response("Missing content", { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  const model = process.env.OPENAI_MODEL ?? defaultModel;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an editor. Respond with valid JSON only. No markdown.",
        },
        {
          role: "user",
          content: [
            "Generate JSON for a blog post based on the content below.",
            "Return keys:",
            "- title: concise professional title",
            "- excerpt: 1-2 sentence summary (max 200 chars)",
            "- tags: array of 3-7 short tags",
            "- slug: kebab-case slug",
            "",
            "Content:",
            content,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(
      `OpenAI request failed (${response.status}): ${errorText}`,
      { status: 502 }
    );
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) {
    return new Response("OpenAI response missing content.", { status: 502 });
  }

  let fields: GeneratedFields;
  try {
    fields = normalizeFields(JSON.parse(raw));
  } catch {
    return new Response("Invalid OpenAI response.", { status: 502 });
  }

  return Response.json(fields);
}
