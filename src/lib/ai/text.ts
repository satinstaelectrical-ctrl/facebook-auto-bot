import { env } from "@/lib/env";
import type { ContentProvider, GeneratedContent } from "@/lib/types";

/**
 * Facebook copy generation across free LLM providers, tried in order until
 * one returns usable JSON.
 *
 * Pollinations is the only keyless option, but its text endpoint now answers
 * `402 Payment Required` for anonymous callers — inside a 200 response body,
 * so the status alone does not reveal it. Groq and Gemini both have free tiers
 * that need nothing but a no-cost API key, so they are preferred whenever one
 * is configured. If every provider fails the caller still gets a postable
 * draft from a deterministic template, but the result says so via `provider`:
 * silently shipping template copy as if it were AI copy is worse than an
 * honest warning.
 */

function buildSystemPrompt(tone?: string, language?: string): string {
  let toneGuidance = "Conversational, scroll-stopping, specific, engaging.";
  if (tone === "professional") {
    toneGuidance = "Professional, authoritative, polished, industry-credible and insightful.";
  } else if (tone === "mysterious") {
    toneGuidance = "Mysterious, intriguing, captivating, creating curiosity, curiosity gap, and suspense.";
  } else if (tone === "educational") {
    toneGuidance = "Educational, informative, actionable practical tips and high-value takeaways.";
  } else if (tone === "promotional") {
    toneGuidance = "Promotional, persuasive, highlighting tangible benefits with a compelling call-to-action.";
  }

  let languageGuidance = "English";
  if (language === "fr") {
    languageGuidance = "FRENCH (Français). The title, description, and hashtags MUST be entirely written in natural, fluent, native-level French.";
  } else if (language === "es") {
    languageGuidance = "Spanish (Español). The title, description, and hashtags MUST be written in fluent Spanish.";
  } else if (language === "de") {
    languageGuidance = "German (Deutsch). The title, description, and hashtags MUST be written in fluent German.";
  }

  return `You are an expert Facebook Page copywriter. Given a topic, write a single
high-performing Facebook photo post in strict JSON with this exact shape and nothing else:
{"title": string, "description": string, "hashtags": string[]}

The three parts are joined into one caption, in that order, so they must read as
one post rather than three fragments.

Language requirement: ${languageGuidance}
Tone requirement: ${toneGuidance}

Rules:
- title: the opening hook, <= 80 characters. Conversational, scroll-stopping, specific. At most one emoji. No hashtags.
- description: 2-4 short sentences, <= 400 characters, written to be read on a phone. Plain language. End with an engaging question or soft call to action that invites comments.
- hashtags: 3 to 5 short, highly relevant hashtags in the target language, lowercase, no "#" symbol, no spaces.
- Output ONLY the JSON object. No markdown fences, no commentary.`;
}

const TIMEOUT_MS = 20_000;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object in response");
  return JSON.parse(text.slice(start, end + 1));
}

function parseContent(raw: string): GeneratedContent {
  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Malformed generation payload");
  const o = parsed as Record<string, unknown>;
  if (
    typeof o.title !== "string" ||
    typeof o.description !== "string" ||
    !Array.isArray(o.hashtags) ||
    !o.hashtags.every((h) => typeof h === "string")
  ) {
    throw new Error("Malformed generation payload");
  }
  return {
    title: o.title.trim(),
    description: o.description.trim(),
    hashtags: (o.hashtags as string[]).map((h) => h.replace(/^#/, "").trim()).filter(Boolean),
  };
}

/** Shared call shape for the OpenAI-compatible endpoints (Pollinations, Groq). */
async function chatCompletion(
  url: string,
  model: string,
  topic: string,
  systemPrompt: string,
  apiKey?: string
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Topic: ${topic}` },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const host = new URL(url).host;
  const body = await res.text();
  if (!res.ok) throw new Error(`${host} responded ${res.status}`);

  const data = JSON.parse(body);
  if (data?.error) {
    const message = typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(`${host}: ${message ?? "unknown error"}`);
  }

  const content: unknown = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("Empty completion");
  return content;
}

async function geminiCompletion(
  topic: string,
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: `Topic: ${topic}` }] }],
        generationConfig: { temperature: 0.9, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }
  );

  if (!res.ok) throw new Error(`gemini responded ${res.status}`);
  const data = await res.json();
  const content: unknown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== "string" || !content.trim()) throw new Error("Empty completion");
  return content;
}

function template(topic: string, language?: string): GeneratedContent {
  const clean = topic.trim();
  const words = clean.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  if (language === "fr") {
    return {
      title: `${clean} — À découvrir absolument`,
      description: `Voici des idées inspirantes et des conseils pratiques autour de ${clean.toLowerCase()}. Simple, concret et facile à mettre en place. Et vous, qu'en pensez-vous ?`,
      hashtags: [...new Set(words)].concat(["conseils", "partage"]).slice(0, 5),
    };
  }
  return {
    title: `${clean} — worth a look today`,
    description: `We put together a few ideas around ${clean.toLowerCase()}. Simple things you can actually try this week. Which one would you start with?`,
    hashtags: [...new Set(words)].concat(["ideas"]).slice(0, 5),
  };
}

type Attempt = { provider: ContentProvider; run: () => Promise<string> };

function providerChain(topic: string, systemPrompt: string): Attempt[] {
  const chain: Attempt[] = [];

  const groqKey = env.groqApiKey;
  if (groqKey) {
    for (const model of ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]) {
      chain.push({
        provider: "groq",
        run: () =>
          chatCompletion(
            "https://api.groq.com/openai/v1/chat/completions",
            model,
            topic,
            systemPrompt,
            groqKey
          ),
      });
    }
  }

  const geminiKey = env.geminiApiKey;
  if (geminiKey) {
    chain.push({ provider: "gemini", run: () => geminiCompletion(topic, systemPrompt, geminiKey) });
  }

  chain.push({
    provider: "pollinations",
    run: () =>
      chatCompletion("https://text.pollinations.ai/openai", "openai-fast", topic, systemPrompt),
  });

  return chain;
}

export async function generateContent(
  topic: string,
  opts?: { tone?: string; language?: string }
): Promise<GeneratedContent> {
  const systemPrompt = buildSystemPrompt(opts?.tone, opts?.language);
  const failures: string[] = [];

  for (const { provider, run } of providerChain(topic, systemPrompt)) {
    try {
      return { ...parseContent(await run()), provider };
    } catch (err) {
      failures.push(`${provider}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.warn("[generateContent] every provider failed:", failures.join(" | "));
  return {
    ...template(topic, opts?.language),
    provider: "template",
    providerError: failures[0],
  };
}
