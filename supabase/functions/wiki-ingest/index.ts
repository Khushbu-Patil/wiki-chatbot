import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const EMBED_MODEL = "gemini-embedding-001";
const CHUNK_SIZE = 4000;
const CHUNK_OVERLAP = 400;

interface WikiArticle {
  title: string;
  url: string;
  extract: string;
}

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= CHUNK_SIZE) return [clean];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 0);
}

async function fetchArticle(topic: string): Promise<WikiArticle> {
  const introRes = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`,
    { headers: { "User-Agent": "wiki-rag-chatbot/1.0" } },
  );
  if (!introRes.ok) throw new Error(`Wikipedia summary not found for "${topic}" (${introRes.status})`);
  const intro = await introRes.json();

  const extractRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(topic)}`,
    { headers: { "User-Agent": "wiki-rag-chatbot/1.0" } },
  );
  if (!extractRes.ok) throw new Error(`Wikipedia extract failed (${extractRes.status})`);
  const extractJson = await extractRes.json();
  const pages = extractJson?.query?.pages || {};
  const page = Object.values(pages)[0] as { extract?: string; title?: string; fullurl?: string };
  const fullText = page?.extract || intro.extract || "";

  return {
    title: page?.title || intro.title || topic,
    url: page?.fullurl || intro.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
    extract: fullText,
  };
}

async function embed(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  const batchSize = 100;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batchTexts = texts.slice(i, i + batchSize);
    const requests = batchTexts.map((text) => ({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      output_dimensionality: 768,
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${EMBED_MODEL}:batchEmbedContents?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      }
    );
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gemini embeddings failed (${res.status}): ${detail}`);
    }
    const data = await res.json();
    const batchEmbeddings = (data.embeddings as { values: number[] }[]).map((d) => d.values);
    results.push(...batchEmbeddings);
  }

  return results;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'topic' field" }), {
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

    const article = await fetchArticle(topic.trim());
    if (!article.extract) {
      return new Response(JSON.stringify({ error: `No article content found for "${topic}"` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chunks = chunkText(article.extract);
    const embeddings = await embed(chunks);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const rows = chunks.map((content, i) => ({
      title: article.title,
      source_url: article.url,
      chunk_index: i,
      content,
      embedding: embeddings[i],
    }));

    // Remove any existing chunks for this title before inserting (re-ingest updates).
    await supabase.from("wiki_chunks").delete().eq("title", article.title);
    const { error } = await supabase.from("wiki_chunks").insert(rows);
    if (error) throw new Error(`DB insert failed: ${error.message}`);

    return new Response(
      JSON.stringify({
        ok: true,
        title: article.title,
        url: article.url,
        chunks_stored: rows.length,
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
