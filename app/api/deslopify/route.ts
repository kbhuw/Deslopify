import { NextResponse } from "next/server";
import {
  DESLOPIFY_INSTRUCTIONS,
  MAX_INPUT_CHARACTERS,
} from "@/lib/deslopify-prompt";

type OpenRouterPayload = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
};

function outputText(payload: OpenRouterPayload): string {
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function POST(request: Request) {
  let body: { text?: unknown };

  try {
    body = (await request.json()) as { text?: unknown };
  } catch {
    return NextResponse.json({ error: "Send the text as JSON." }, { status: 400 });
  }

  if (typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "Paste some text first." }, { status: 400 });
  }

  if (body.text.length > MAX_INPUT_CHARACTERS) {
    return NextResponse.json(
      { error: `Keep it under ${MAX_INPUT_CHARACTERS.toLocaleString()} characters.` },
      { status: 413 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The editor is not configured yet." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: DESLOPIFY_INSTRUCTIONS },
          { role: "user", content: body.text },
        ],
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 4096,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "The editor is busy. Try again in a moment." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const generated = outputText((await response.json()) as OpenRouterPayload)
      .replaceAll("—", " - ")
      .replaceAll("–", " - ");

    if (!generated) {
      return NextResponse.json(
        { error: "The editor returned an empty draft. Try once more." },
        { status: 502 },
      );
    }

    return NextResponse.json({ text: generated });
  } catch {
    return NextResponse.json(
      { error: "Couldn’t reach the editor. Try again in a moment." },
      { status: 502 },
    );
  }
}
