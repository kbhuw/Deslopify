import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the rewrite engine keeps the API key server-side and bans long dashes", async () => {
  const [route, prompt, page] = await Promise.all([
    readFile(new URL("app/api/deslopify/route.ts", root), "utf8"),
    readFile(new URL("lib/deslopify-prompt.ts", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
  ]);

  assert.match(route, /process\.env\.OPENROUTER_API_KEY/);
  assert.match(route, /google\/gemini-2\.5-flash-lite/);
  assert.match(route, /replaceAll\("—", " - "\)/);
  assert.match(prompt, /Do not invent anecdotes/);
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
