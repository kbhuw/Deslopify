import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the rewrite engine keeps the API key server-side and only uses a free model", async () => {
  const [route, prompt, page] = await Promise.all([
    readFile(new URL("app/api/deslopify/route.ts", root), "utf8"),
    readFile(new URL("lib/deslopify-prompt.ts", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
  ]);

  assert.match(route, /process\.env\.OPENROUTER_API_KEY/);
  assert.match(route, /openai\/gpt-oss-20b:free/);
  assert.match(route, /allow_fallbacks: false/);
  assert.doesNotMatch(route, /anthropic\/claude-haiku-4\.5/);
  assert.match(route, /MAX_OUTPUT_TOKENS = 2048/);
  assert.match(route, /replaceAll\("—", " - "\)/);
  assert.match(prompt, /HUMAN_STYLE_EXAMPLES/);
  assert.match(prompt, /The meeting was useful because we finally stopped talking about the plan/);
  assert.match(prompt, /Never invent anecdotes/);
  assert.match(prompt, /DESLOPIFY_REFINEMENT_INSTRUCTIONS/);
  assert.match(prompt, /Never use these wrappers/);
  assert.match(prompt, /The cheap suitcase survived exactly one trip/);
  assert.match(prompt, /Return only the revised text/);
  assert.doesNotMatch(page, /OPENAI_API_KEY/);
});

test("the product page is no longer the starter preview", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);

  assert.match(page, /Make it sound like you wrote it\./);
  assert.match(page, /\/api\/deslopify/);
  assert.match(layout, /openGraph/);
  assert.doesNotMatch(page, /SkeletonPreview/);
});
