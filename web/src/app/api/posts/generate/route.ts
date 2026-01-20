import { requireAdminAccess } from "@/lib/apiAuth";
import { readJson } from "@/lib/apiRequest";
import { normalizeGeneratedFields } from "@/lib/blogFields";

type GenerateRequest = {
  content?: string;
};

const defaultModel = "gpt-4o-mini";

export async function POST(request: Request) {
  const unauthorized = requireAdminAccess(request);
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await readJson<GenerateRequest>(request);
  if (!payload.ok) {
    return payload.response;
  }

  const content = payload.data.content?.trim();
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

  let fields: ReturnType<typeof normalizeGeneratedFields>;
  try {
    fields = normalizeGeneratedFields(JSON.parse(raw));
  } catch {
    return new Response("Invalid OpenAI response.", { status: 502 });
  }

  return Response.json(fields);
}
