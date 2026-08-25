import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Send, BookPlus, Loader2, Sparkles, ExternalLink, MessageSquare, Database, Network } from 'lucide-react';
import ArchitectureView from '@/ArchitectureView';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  sources?: { title: string; url: string }[];
  matches?: number;
  loading?: boolean;
  error?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      text: 'Ask me anything! I answer from Wikipedia data stored in a vector database. First, ingest one or more Wikipedia topics below, then ask your question.',
    },
  ]);
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState('');
  const [busy, setBusy] = useState(false);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [showArch, setShowArch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleIngest(e: FormEvent) {
    e.preventDefault();
    const t = topic.trim();
    if (!t || ingestBusy) return;
    setIngestBusy(true);
    setIngestStatus(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/wiki-ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ topic: t }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Ingest failed (${res.status})`);
      setIngestStatus({ ok: true, text: `Indexed "${data.title}" — ${data.chunks_stored} chunks stored.` });
      setTopic('');
    } catch (err) {
      setIngestStatus({ ok: false, text: err instanceof Error ? err.message : 'Failed to ingest topic.' });
    } finally {
      setIngestBusy(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: q };
    const loadingMsg: Message = { id: 'loading', role: 'assistant', text: '', loading: true };
    setMessages((m) => [...m, userMsg, loadingMsg]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/wiki-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Chat failed (${res.status})`);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === 'loading'
            ? { ...msg, id: crypto.randomUUID(), loading: false, text: data.answer, sources: data.sources, matches: data.matches }
            : msg,
        ),
      );
    } catch (err) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === 'loading'
            ? { ...msg, id: crypto.randomUUID(), loading: false, error: true, text: err instanceof Error ? err.message : 'Something went wrong.' }
            : msg,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">WikiRAG</h1>
            <p className="text-xs text-slate-400">Wikipedia-powered Q&amp;A with vector search</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setShowArch(true)}
              className="inline-flex show-arch items-center gap-2 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Network className="w-4 h-4" />
              Show Architecture
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Database className="w-4 h-4" />
              <span>pgvector</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Ingest panel */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookPlus className="w-4 h-4 text-sky-400" />
            <h2 className="add-wiki font-medium text-slate-200">Add Wikipedia knowledge</h2>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Enter a Wikipedia article title to fetch, split into chunks, embed, and store in the vector database.
          </p>
          <form onSubmit={handleIngest} className="flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Albert Einstein, Quantum mechanics, Roman Empire"
              className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-custom focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={ingestBusy || !topic.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed py-2 text-sm font-medium text-white transition-colors"
            >
              {ingestBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookPlus className="w-4 h-4" />}
              Ingest
            </button>
          </form>
          {ingestStatus && (
            <p className={`mt-3 text-xs ${ingestStatus.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ingestStatus.text}
            </p>
          )}
        </section>

        {/* Chat */}
        <section className="flex-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden min-h-[400px]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user'
                    ? ' text-white rounded-br-sm message'
                    : m.error
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-bl-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                    }`}
                >
                  {m.loading ? (
                    <span className="flex items-center gap-2 text-slate-200">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching Wikipedia &amp; generating answer…
                    </span>
                  ) : (
                    <>
                      {/* Single markdown rendering */}
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.text}
                        </ReactMarkdown>
                      </div>

                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-1">
                          <p className="text-xs text-slate-200 font-medium">Sources</p>
                          {m.sources.map((s, i) => (
                            <a
                              key={i}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs res-link hover:text-sky-300 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{s.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-lg bg-slate-800 border-custom border-slate-700 px-3 focus-within:ring-2 focus-within:ring-sky-500/50">
              <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about the ingested Wikipedia topics…"
                className="flex-1 placeholder-custom bg-transparent py-2.5 text-sm text-slate-100 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        Built with OpenAI embeddings + pgvector similarity search
      </footer>

      {showArch && <ArchitectureView onClose={() => setShowArch(false)} />}
    </div>
  );
}

export default App;
