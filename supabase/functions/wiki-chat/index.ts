import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const EMBED_MODEL = "gemini-embedding-001";
const CHAT_MODEL = "gemini-3.6-flash";
const TOP_K = 5;

async function embed(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${EMBED_MODEL}:embedContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        output_dimensionality: 768,
      }),
    }
  );
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini embeddings failed (${res.status}): ${detail}`);
  }
  const data = await res.json();
  return data.embedding.values as number[];
}

async function retrieve(supabase: ReturnType<typeof createClient>, queryEmbedding: number[]) {
  const { data, error } = await supabase.rpc("match_wiki_chunks", {
    query_embedding: queryEmbedding,
    match_count: TOP_K,
  });
  if (error) throw new Error(`Vector search failed: ${error.message}`);
  return (data || []) as { content: string; title: string; source_url: string }[];
}

async function generateAnswer(question: string, context: { content: string; title: string; source_url: string }[]) {
  const contextText = context
    .map((c, i) => `[${i + 1}] (${c.title}) ${c.content}`)
    .join("\n\n");

  const systemPrompt =
    "You are a helpful assistant answering questions strictly from the provided Wikipedia context. " +
    "If the context does not contain the answer, say you couldn't find it in the available Wikipedia data. " +
    "Cite sources as [1], [2], etc. matching the context numbering. Be concise and factual.";

  const prompt = `${systemPrompt}\n\nContext:\n${contextText}\n\nQuestion: ${question}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${CHAT_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      }),
    }
  );
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini chat failed (${res.status}): ${detail}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'question' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!GEMINI_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key not configured on the server" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const queryEmbedding = await embed(question);
    const matches = await retrieve(supabase, queryEmbedding);

    if (matches.length === 0) {
      return new Response(
        JSON.stringify({
          answer: "I couldn't find any Wikipedia data to answer that. Try ingesting a relevant article first.",
          sources: [],
          matches: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const answer = await generateAnswer(question, matches);

    return new Response(
      JSON.stringify({
        answer,
        sources: matches.map((m) => ({ title: m.title, url: m.source_url })),
        matches: matches.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
