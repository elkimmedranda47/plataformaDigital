import OpenAI from "openai";
import { z } from "zod";

let client: OpenAI | null = null;

function obtenerCliente(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return client;
}

export type CompletionMeta = {
  modelo: string;
  tokens: number;
};

export async function completeJson<T>(options: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  model?: string;
  temperature?: number;
  imageDataUrls?: string[];
}): Promise<{ data: T; meta: CompletionMeta }> {
  const parts: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: "text", text: options.user },
  ];

  for (const url of options.imageDataUrls ?? []) {
    parts.push({ type: "image_url", image_url: { url, detail: "low" } });
  }

  const response = await obtenerCliente().chat.completions.create({
    model: options.model ?? "gpt-4o-mini",
    temperature: options.temperature ?? 0.35,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: parts },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const data = options.schema.parse(JSON.parse(raw));

  return {
    data,
    meta: {
      modelo: response.model,
      tokens: response.usage?.total_tokens ?? 0,
    },
  };
}
