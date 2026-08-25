import { ArrowRight, ArrowDown, X, Network, FileCode, Layers, Globe, Server, Database, Cpu, Search, MessageSquare, FileText } from 'lucide-react';

interface Props {
  onClose: () => void;
}

function Node({
  icon: Icon,
  label,
  sub,
  color,
  className
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
  color: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 min-w-[180px] ${color} ${className}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold leading-tight">{label}</p>
        {sub && <p className="text-xs opacity-70 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

function FlowArrow({ vertical = false }: { vertical?: boolean }) {
  const Arrow = vertical ? ArrowDown : ArrowRight;
  return (
    <div className={`flex items-center justify-center text-slate-600 ${vertical ? 'py-1' : 'px-1'}`}>
      <Arrow className="w-5 h-5" />
    </div>
  );
}

export default function ArchitectureView({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center arch-title justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">System Architecture</h1>
              <p className="text-xs text-slate-400">WikiRAG — Wikipedia-powered RAG chatbot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg py-2 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>

        {/* Architecture Diagram */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 mb-8">
          <div className="flex items-center gap-2 mb-6 arch-diagram">
            <Layers className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-medium text-slate-200 arch-diagram-title">Architecture Diagram &amp; Data Flow</h2>
          </div>

          {/* Row 1 — Ingestion flow */}
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">Ingestion Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-1 mb-6">
            <Node icon={Globe} className="green-card" label="Wikipedia API" sub="REST + Action API" color="border-emerald-600/40 bg-emerald-600/10 text-emerald-300" />
            <FlowArrow />
            <Node icon={Server} className="blue-card" label="wiki-ingest" sub="Edge Function" color="border-sky-600/40 bg-sky-600/10 text-sky-300" />
            <FlowArrow />
            <Node icon={Cpu} className="purple-card" label="Gemini Embeddings" sub="gemini-embedding-001 (768-dim)" color="border-violet-500/40 bg-violet-500/10 text-violet-300" />
            <FlowArrow />
            <Node icon={Database} className="orange-card" label="pgvector Store" sub="wiki_chunks (768-dim)" color="border-amber-600/40 bg-amber-600/10 text-amber-300" />
          </div>

          <div className="flex justify-center mb-6">
            <FlowArrow vertical />
          </div>

          {/* Row 2 — Query flow */}
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">Query Flow (RAG)</p>
          <div className="flex flex-wrap items-center justify-center gap-1 mb-4">
            <Node icon={MessageSquare} className="gray-card" label="User Question" sub="React UI" color="border-slate-600/40 bg-slate-700/30 text-slate-200" />
            <FlowArrow />
            <Node icon={Server} className="blue-card" label="wiki-chat" sub="Edge Function" color="border-sky-600/40 bg-sky-600/10 text-sky-300" />
            <FlowArrow />
            <Node icon={Cpu} className="purple-card" label="Embed Query" sub="Gemini 768-dim" color="border-violet-500/40 bg-violet-500/10 text-violet-300" />
            <FlowArrow />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1 mb-4">
            <Node icon={Search} className="orange-card" label="Similarity Search" sub="match_wiki_chunks() cosine" color="border-amber-600/40 bg-amber-600/10 text-amber-300" />
            <FlowArrow />
            <Node icon={FileText} className="purple-card" label="Gemini 3.6-flash" sub="context-augmented" color="border-violet-500/40 bg-violet-500/10 text-violet-300" />
            <FlowArrow />
            <Node icon={MessageSquare} className="gray-card" label="Cited Answer" sub="React UI" color="border-slate-600/40 bg-slate-700/30 text-slate-200" />
          </div>
        </section>

        {/* HLD */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-medium text-slate-200">High-Level Design (HLD)</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
            <div>
              <p className="text-slate-100 font-medium mb-1">Overview</p>
              <p className="">
                WikiRAG is a retrieval-augmented generation (RAG) chatbot. It fetches Wikipedia articles, breaks them into
                text chunks, generates vector embeddings, and stores them in a PostgreSQL database with the pgvector
                extension. When a user asks a question, the system embeds the query, finds the most similar chunks via
                cosine similarity, and passes them as context to a language model that generates a cited answer.
              </p>
            </div>
            <div>
              <p className="text-slate-100 font-medium mb-1">Core Components</p>
              <ul className="list-disc list-inside  space-y-1">
                <li><span className="text-slate-200">Frontend</span> — React + Tailwind chat interface (single page).</li>
                <li><span className="text-slate-200">wiki-ingest Edge Function</span> — orchestrates fetch → chunk → embed → store.</li>
                <li><span className="text-slate-200">wiki-chat Edge Function</span> — orchestrates embed query → retrieve → generate.</li>
                <li><span className="text-slate-200">Supabase Postgres + pgvector</span> — durable vector store and similarity search.</li>
                <li><span className="text-slate-200">Google Gemini API</span> — embeddings (gemini-embedding-001) and chat (gemini-3.6-flash).</li>
                <li><span className="text-slate-200">Wikipedia REST + Action APIs</span> — source of article text.</li>
              </ul>
            </div>
            <div>
              <p className="text-slate-100 font-medium mb-1">Data Flow Summary</p>
              <ol className="list-decimal list-inside  space-y-1">
                <li>User submits a Wikipedia topic → ingest function fetches &amp; embeds it.</li>
                <li>Chunks with 768-dim vectors (Gemini embeddings) are stored in <code className="text-cyan-300">wiki_chunks</code>.</li>
                <li>User asks a question → chat function embeds the question.</li>
                <li>Cosine similarity search returns top-5 relevant chunks.</li>
                <li>Chunks are injected as context into Gemini 3.6-flash → cited answer returned.</li>
              </ol>
            </div>
            <div>
              <p className="text-slate-100 font-medium mb-1">Non-Functional Considerations</p>
              <ul className="list-disc list-inside  space-y-1">
                <li><span className="text-slate-200">Scalability</span> — HNSW provides approximate nearest-neighbor search and can significantly improve vector retrieval performance as the dataset grows.</li>
                <li><span className="text-slate-200">Security</span> — GEMINI_API_KEY stored as edge-function secret; never exposed to client.</li>
                <li><span className="text-slate-200">Statelessness</span> — both functions are stateless; all durable state lives in Postgres.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* LLD */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileCode className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-medium text-slate-200">Low-Level Design (LLD)</h2>
          </div>

          {/* Database schema */}
          <div className="mb-5">
            <p className="text-slate-100 font-medium text-sm mb-2">Database Schema</p>
            <div className="rounded-lg lld-card bg-slate-950/60 border border-slate-800 p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className=" border-b">
                    <th className="text-left py-2 pr-4 font-medium">Column</th>
                    <th className="text-left py-2 pr-4 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800/60"><td className="py-2 pr-4 text-cyan-300">id</td><td className="py-2 pr-4">uuid PK</td><td className="py-2 text-slate-500">default gen_random_uuid()</td></tr>
                  <tr className="border-b border-slate-800/60"><td className="py-2 pr-4 text-cyan-300">title</td><td className="py-2 pr-4">text</td><td className="py-2 text-slate-500">article title</td></tr>
                  <tr className="border-b border-slate-800/60"><td className="py-2 pr-4 text-cyan-300">source_url</td><td className="py-2 pr-4">text</td><td className="py-2 text-slate-500">Wikipedia URL</td></tr>
                  <tr className="border-b border-slate-800/60"><td className="py-2 pr-4 text-cyan-300">chunk_index</td><td className="py-2 pr-4">int</td><td className="py-2 text-slate-500">position in article</td></tr>
                  <tr className="border-b border-slate-800/60"><td className="py-2 pr-4 text-cyan-300">content</td><td className="py-2 pr-4">text</td><td className="py-2 text-slate-500">the text chunk</td></tr>
                  <tr className="border-b border-slate-800/60"><td className="py-2 pr-4 text-cyan-300">embedding</td><td className="py-2 pr-4">vector(768)</td><td className="py-2 text-slate-500">HNSW index, cosine ops</td></tr>
                  <tr><td className="py-2 pr-4 text-cyan-300">created_at</td><td className="py-2 pr-4">timestamptz</td><td className="py-2 text-slate-500">default now()</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Functions detail */}
          <div className=" grid sm:grid-cols-2 gap-4 mb-5">
            <div className="rounded-lg bg-slate-950/60 border lld-card border-slate-800 p-4">
              <p className="text-sky-300 font-medium text-sm mb-2">wiki-ingest (Edge Function)</p>
              <ol className="list-decimal list-inside text-xs  space-y-1">
                <li>Receive <code className="text-cyan-300">{"{ topic }"}</code> from client.</li>
                <li>Fetch summary via Wikipedia REST API.</li>
                <li>Fetch full plaintext via Action API (extracts).</li>
                <li>Chunk text: 800 chars, 120 overlap.</li>
                <li>Batch embed all chunks via Gemini.</li>
                <li>Delete old chunks for title, insert new rows.</li>
                <li>Return <code className="text-cyan-300">{"{ title, url, chunks_stored }"}</code>.</li>
              </ol>
            </div>
            <div className="rounded-lg bg-slate-950/60 border lld-card border-slate-800 p-4">
              <p className="text-sky-300 font-medium text-sm mb-2">wiki-chat (Edge Function)</p>
              <ol className="list-decimal list-inside text-xs  space-y-1">
                <li>Receive <code className="text-cyan-300">{"{ question }"}</code> from client.</li>
                <li>Embed question with Gemini (768-dim).</li>
                <li>RPC <code className="text-cyan-300">match_wiki_chunks</code> (top-5).</li>
                <li>Build context block from matched chunks.</li>
                <li>Call gemini-3.6-flash with system + context prompt.</li>
                <li>Return <code className="text-cyan-300">{"{ answer, sources[], matches }"}</code>.</li>
              </ol>
            </div>
          </div>

          {/* Config table */}
          <div className="mb-5">
            <p className="text-slate-100 font-medium text-sm mb-2">Key Configuration</p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs ">
              <div className="rounded-lg lld-card bg-slate-950/60 border border-slate-800 p-3">
                <p className="text-slate-500">Embedding model</p>
                <p className="text-slate-200">gemini-embedding-001 (768 dim)</p>
              </div>
              <div className="rounded-lg lld-card bg-slate-950/60 border border-slate-800 p-3">
                <p className="text-slate-500">Chat model</p>
                <p className="text-slate-200">gemini-3.6-flash (temperature 0.2)</p>
              </div>
              <div className="rounded-lg lld-card bg-slate-950/60 border border-slate-800 p-3">
                <p className="text-slate-500">Chunk size / overlap</p>
                <p className="text-slate-200">800 chars / 120 overlap</p>
              </div>
              <div className="rounded-lg lld-card bg-slate-950/60 border border-slate-800 p-3">
                <p className="text-slate-500">Retrieval (top-k)</p>
                <p className="text-slate-200">5 chunks, cosine distance</p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <p className="text-slate-100 font-medium text-sm mb-2">Security &amp; Access Control</p>
            <ul className="list-disc list-inside text-xs  space-y-1">
              <li>RLS enabled on <code className="text-cyan-300">wiki_chunks</code>; anon + authenticated CRUD (single-tenant demo).</li>
              <li><code className="text-cyan-300">match_wiki_chunks</code> is SECURITY DEFINER with fixed search_path.</li>
              <li>Edge functions use the service role key for DB writes (bypasses RLS).</li>
              <li>GEMINI_API_KEY stored as edge-function secret — never sent to the browser.</li>
              <li>Both functions enforce mandatory CORS headers on all responses.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
