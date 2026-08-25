Wiki‑Chatbot‑AI — README

📖 Overview
Wiki‑Chatbot‑AI is a retrieval‑augmented generation (RAG) chatbot that answers natural‑language questions using Wikipedia as its knowledge source.

Frontend – React + Vite UI (styled with Tailwind & custom CSS).
Backend – Supabase Edge Functions written in TypeScript, a PostgreSQL database with the pgvector extension for dense vector storage, and Google Gemini for embeddings and chat generation.
Data flow –
Ingestion – wiki‑ingest fetches a Wikipedia article, splits it into chunks, creates 768‑dim Gemini embeddings and stores them in the wiki_chunks table.
Query – wiki‑chat receives a user question, embeds it, performs a cosine‑similarity search on the vector store, and feeds the top‑k chunks to Gemini to produce a cited answer.
The UI renders the answer as Markdown, shows source links, and includes a visual architecture diagram (ArchitectureView.tsx).

🚀 Quick‑Start (Local Development)
Prerequisites

Node ≥ 18, npm ≥ 10
Supabase CLI (npm i -g supabase)
A Supabase project (you can create a free one at https://supabase.com)
Clone the repo (if you haven’t already)

bash
git clone <repo‑url>
cd wiki-chatbot-ai
Install dependencies

bash
npm ci    # or `npm install`
Configure environment variables

Create two .env files – they are ignored by Git (see the .gitignore below).

Root .env – Vite variables (frontend)

env
VITE_SUPABASE_URL=https://<YOUR‑PROJECT>.supabase.co
VITE_SUPABASE_ANON_KEY=your‑public‑anon‑key
Supabase folder .env – secrets used by edge functions

env
SUPABASE_URL=https://<YOUR‑PROJECT>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your‑service‑role‑key               # **never commit**
GEMINI_API_KEY=your‑gemini‑api‑key
Run Supabase locally (optional)

bash
supabase start                # spins up local Postgres + Edge Function runtime
supabase functions serve --env-file supabase/.env
If you already have a remote Supabase project, you can skip supabase start and just run the function runner as above (pointing at the remote DB via the env values).

Start the React dev server

bash
npm run dev
Open http://localhost:5173 (or the URL shown in the terminal).

Test the flow

In the UI, type a Wikipedia article title and click Add Wikipedia knowledge – this triggers wiki‑ingest.
Then ask a question – the UI calls wiki‑chat and displays a markdown‑formatted answer with source links.
📂 Repository Layout
wiki-chatbot-ai/
├─ src/                     # Front‑end React code
│   ├─ App.tsx              # Main chat UI
│   ├─ ArchitectureView.tsx  # Architecture diagram component
│   ├─ index.css             # Tailwind + custom overrides
│   └─ … (other UI components)
├─ supabase/
│   ├─ functions/
│   │   ├─ wiki‑ingest/
│   │   │   └─ index.ts       # Ingestion Edge Function
│   │   └─ wiki‑chat/
│   │       └─ index.ts       # Query/answer Edge Function
│   ├─ migrations/
│   │   └─ 20260825070417_wiki_vector_store.sql   # pgvector table
│   ├─ .env                  # **secret** file – NOT committed
│   └─ .gitignore           # ignores .env and other artefacts
├─ .gitignore               # repository‑wide ignore (node_modules, dist, etc.)
├─ README.md                # <‑‑ you are reading it!
└─ package.json
🔐 Security & Secrets
Never commit any .env files. Both the repository‑wide .gitignore and the supabase/.gitignore already exclude them.
The anon key (VITE_SUPABASE_ANON_KEY) is public by design – it is sent to the browser and can be inspected. Its permissions are limited by the Row‑Level Security (RLS) policies you define on the tables.
Privileged operations (e.g., writing to the vector store) must use the service‑role key, which lives only in supabase/.env and is never exposed to the client.
🛠️ Common Commands
Command	What it does
npm run dev	Starts Vite dev server (hot‑reload).
supabase functions serve --env-file supabase/.env	Runs the Edge Functions locally, hot‑reloading on changes.
supabase db reset	Drops and recreates the local Postgres DB (useful after schema changes).
supabase functions deploy wiki‑ingest	Deploys the ingestion function to your remote Supabase project.
supabase functions deploy wiki‑chat	Deploys the chat function.
npm run lint (if you have a lint script)	Checks code style / type errors.
📦 Deployment
Push the code to your Git remote (GitHub, GitLab, etc.).

Deploy edge functions

bash
supabase functions deploy wiki-ingest
supabase functions deploy wiki-chat
Set environment variables in the Supabase dashboard (under “Settings → API → Config”):

SUPABASE_URL (auto‑filled)
SUPABASE_SERVICE_ROLE_KEY (copy from your local .env)
GEMINI_API_KEY
Update the Vite env in your hosting platform (e.g., Vercel, Netlify) with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

Now the app is live; the front‑end will call the remote edge functions and the whole RAG pipeline works in production.

🎨 Styling & Design Choices
Background – #d1d1d1 (light gray) set in src/index.css.
Cards – white background with subtle shadow (.card / .message classes) to give a premium, glass‑morphism feel.
Typography – Tailwind’s Inter/Outfit (imported via @import in index.css).
Markdown – rendered with react-markdown + remark-gfm; custom CSS for links (.res-link) and code blocks (.markdown-content code).
Feel free to tweak colors in src/index.css – the utility classes are already scoped to keep the UI consistent.

🐛 Troubleshooting
Symptom	Likely cause	Fix
“NaN” appears instead of loading spinner	m.loading is not a boolean (maybe a number or undefined). Ensure you initialise loading as false and set it to true only while awaiting the API call.	In src/App.tsx, verify const [messages, setMessages] = useState<Message[]>([]); and that each Message has loading: boolean.
API returns 404	Wrong Supabase URL or missing function name.	Double‑check VITE_SUPABASE_URL and that the fetch URL matches /functions/v1/wiki‑chat.
Environment variables show up in the network tab	You’re using the anon key (which is expected).	Ensure no service‑role secrets are referenced in any client‑side code.
Duplicate messages (see earlier)	Two separate JSX blocks rendering the same markdown.	The duplicate block has been removed – keep only one rendering inside the !m.loading branch.
📚 Further Reading
Supabase Edge Functions – https://supabase.com/docs/guides/functions
pgvector – https://github.com/pgvector/pgvector
Google Gemini API – https://ai.google.dev/gemini-api
RAG patterns – “Retrieval‑Augmented Generation” (search for recent papers or blog posts).
🙋‍♀️ Contributing
Fork the repo.
Create a feature branch (git checkout -b feat/your‑feature).
Make sure tests/lints pass (npm run lint).
Open a Pull Request – describe the change and reference any relevant issue.
🎉 Happy hacking!
If you run into any unexpected behaviour (e.g., the loading spinner shows “NaN”), feel free to open an issue or ping the maintainer. The architecture and code are deliberately modular, so extending the chatbot (adding new data sources, changing the embedding model, etc.) should be straightforward.