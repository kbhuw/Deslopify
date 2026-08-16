# Deslopify

Paste in a draft. Get a version that still says what you meant, without the
robotic cadence, generic uplift, or polished-to-death corporate tone.

The app sends the text to a server-side OpenRouter route using Gemini 2.5 Flash
Lite. The browser never receives the API key.

## What it edits

- Em dashes and en dashes
- Generic AI vocabulary and empty scene-setting
- Sycophantic praise, forced contrasts, and fake stakes
- Repetitive sentence cadence and neat-but-boring structure
- Throat-clearing summaries and over-explaining

It does not make up personal stories, facts, opinions, or slang to fake a voice.

## Prompt research

The system prompt is an editorial synthesis of the observed patterns in
[Bloomberry's AI Sentence DNA research](https://www.bloomberry.ai/research/ai-writing-patterns),
[Pangram's writing-pattern guide](https://www.pangram.com/blog/comprehensive-guide-to-spotting-ai-writing-patterns),
and [Microsoft's humanizing guidance](https://www.microsoft.com/en-us/microsoft-365-life-hacks/everyday-ai/creative-inspiration/how-to-humanize-ai-content).
It is deliberately not an instruction to evade AI detectors.

## Local development

Set `OPENROUTER_API_KEY` in your shell and run:

```bash
npm run dev
```
