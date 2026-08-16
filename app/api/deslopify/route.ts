import { NextResponse } from "next/server";
import {
  DESLOPIFY_INSTRUCTIONS,
  DESLOPIFY_REFINEMENT_INSTRUCTIONS,
  MAX_INPUT_CHARACTERS,
} from "@/lib/deslopify-prompt";

// The `:free` suffix is intentional: never substitute a paid model if the
// zero-cost route is unavailable.
const MODEL = "openai/gpt-oss-20b:free";
const MAX_OUTPUT_TOKENS = 2048;
const GENERIC_WRAPPER =
  /\b(not just|more than just|not only|go(?:es)? beyond|beyond\s+\w+|a reminder|matters culturally|has a place|plays a real role|serves as)\b/i;
const EXAMPLE_LEAK =
  /cheap suitcase|airport parking lot|dragging it by one handle|pages load when they should|tools that make a small promise|one Tuesday/i;

type OpenRouterPayload = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
};

type ChatMessage = { role: "system" | "user"; content: string };

function outputText(payload: OpenRouterPayload): string {
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

function cleanOutput(text: string): string {
  return text.replaceAll("—", " - ").replaceAll("–", " - ").trim();
}

async function askEditor(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messages,
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: 0.6,
      provider: {
        allow_fallbacks: false,
      },
    }),
  });

  if (!response.ok) throw new Error(`Editor request failed with ${response.status}`);

  return cleanOutput(outputText((await response.json()) as OpenRouterPayload));
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
    let generated = await askEditor(apiKey, [
      { role: "system", content: DESLOPIFY_INSTRUCTIONS },
      { role: "user", content: body.text },
    ]);

    if (GENERIC_WRAPPER.test(generated) || EXAMPLE_LEAK.test(generated)) {
      const refined = await askEditor(apiKey, [
        { role: "system", content: DESLOPIFY_REFINEMENT_INSTRUCTIONS },
        {
          role: "user",
          content: `Original draft:\n${body.text}\n\nFirst-pass rewrite:\n${generated}`,
        },
      ]);
      if (refined) generated = refined;
    }

    if (!generated) {
      return NextResponse.json(
        { error: "The editor returned an empty draft. Try once more." },
        { status: 502 },
      );
    }

    return NextResponse.json({ text: generated });
  } catch {
    return NextResponse.json(
      { error: "The editor is busy. Try again in a moment." },
      { status: 502 },
    );
  }
}
