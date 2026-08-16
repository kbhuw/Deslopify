"use client";

import { useMemo, useState } from "react";

const EXAMPLE = `I’m thrilled to share that our team has embarked on an exciting journey to revolutionize the way teams collaborate. This isn’t just an update; it’s a pivotal step toward a more seamless and impactful future.`;

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState("");

  const wordCount = useMemo(
    () => input.trim().split(/\s+/).filter(Boolean).length,
    [input],
  );

  async function deslopify() {
    if (!input.trim() || isWorking) return;

    setIsWorking(true);
    setError("");

    try {
      const response = await fetch("/api/deslopify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const body = (await response.json()) as { text?: string; error?: string };

      if (!response.ok || !body.text) {
        throw new Error(body.error ?? "Couldn’t deslop that right now.");
      }

      setOutput(body.text);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Couldn’t deslop that right now.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  function loadExample() {
    setInput(EXAMPLE);
    setOutput("");
    setError("");
  }

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">DESLOPIFY</p>
        <h1 id="page-title">Make it sound like you wrote it.</h1>
        <p className="lede">
          Paste the draft. Keep the point. Lose the robotic rhythm, fake warmth,
          and “I’m thrilled to share” energy.
        </p>
      </section>

      <section className="workspace" aria-label="Text editor">
        <div className="editor-column">
          <div className="panel-heading">
            <label htmlFor="input">Your draft</label>
            <span>{wordCount ? `${wordCount} words` : "Paste anything"}</span>
          </div>
          <textarea
            id="input"
            className="editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste the text you want to deslop…"
            aria-describedby="input-help"
            maxLength={12000}
          />
          <div className="input-footer">
            <p id="input-help" className="hint">
              Your meaning stays intact. The prose gets less AI-shaped.
            </p>
            <button type="button" className="text-button" onClick={loadExample}>
              Try an example
            </button>
          </div>
        </div>

        <div className="editor-column output-column">
          <div className="panel-heading">
            <label htmlFor="output">Deslopified</label>
            {output ? (
              <button type="button" className="text-button" onClick={copyOutput}>
                Copy
              </button>
            ) : (
              <span>Ready to use</span>
            )}
          </div>
          <textarea
            id="output"
            className="editor output"
            value={output}
            placeholder="Your cleaner version will show up here."
            readOnly
            aria-live="polite"
          />
        </div>
      </section>

      <div className="actions">
        <button
          type="button"
          className="deslopify-button"
          onClick={deslopify}
          disabled={!input.trim() || isWorking}
        >
          {isWorking ? "Deslopifying…" : "Deslopify it"} <span aria-hidden="true">↗</span>
        </button>
        <p>No em dashes. No corporate mist. No invented personality.</p>
      </div>

      {error ? <p className="error" role="alert">{error}</p> : null}

      <section className="rules" aria-label="What the editor changes">
        <p><span>01</span> More specific, less generic</p>
        <p><span>02</span> Natural sentence rhythm</p>
        <p><span>03</span> Direct instead of sycophantic</p>
      </section>
    </main>
  );
}
