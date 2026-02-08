# Copilot Instructions — agent4agents-google-adk

## Project Overview

**Agent4Agents** is a Bosch-internal AI framework recommendation tool. Users describe a use case via a structured form; a two-agent pipeline (Google ADK `SequentialAgent`) recommends a framework and evaluates the recommendation quality.

The UI language is **German**; all user-facing strings, prompts, and agent outputs are in German.

## Architecture

```
frontend/  → Next.js 16 (App Router, React 19, pnpm)
backend/   → FastAPI wrapping Google ADK (uv, Python ≥3.13)
```

### Backend — Google ADK Pipeline

- **Entry point:** `backend/main.py` — wraps the ADK app (`get_fast_api_app()`) inside a FastAPI wrapper with CORS. Runs on port 8000.
- **Agent module:** `backend/agent4agents/agent.py` — defines `root_agent` (a `SequentialAgent`) with two sub-agents:
  1. `CompassAgent` — recommends exactly one framework. Output key: `recommendation`, schema: `FrameworkRecommendation`.
  2. `JudgeAgent` — evaluates the recommendation quality (LLM-as-a-Judge). Output key: `judge_evaluation`, schema: `JudgeEvaluation`.
- **Prompts:** Plain `.txt` files in `backend/agent4agents/prompts/` (XML-structured system prompts). Loaded at module import time.
- **Infra utilities:** `backend/agent4agents/infra.py` — `SimpleCache`, `memoize`, `async_retry`, `PromptManager` (supports A/B testing via `_v*.txt` variants).
- **ADK discovery convention:** The ADK auto-discovers agents from the `agents_dir`. The package must expose `root_agent` — this is done via `__init__.py → from . import agent`.
- **Model:** Both agents use `gemini-3-flash-preview`.

### Frontend — Next.js 16

- **Single-page app:** `frontend/src/app/page.tsx` — form + recommendation display. Uses `react-hook-form` + `zod` for validation.
- **ADK communication:** The frontend directly calls the ADK REST API at `http://localhost:8000` (session creation → `/run` endpoint). It parses streamed events by `event.author` (`CompassAgent` / `JudgeAgent`).
- **UI components:** shadcn/ui pattern in `frontend/src/components/ui/`. Custom components: `recommendation-card.tsx`, `history-panel.tsx`, `contact-dialog.tsx`.
- **History:** `useRecommendationHistory` hook stores up to 10 entries in `localStorage`.
- **Contact API route:** `frontend/src/app/api/contact/route.ts` — persists contact requests to `frontend/data/contacts.json` (file-based, no DB).

## Data Flow

1. User fills form → frontend sends JSON to ADK `/run` endpoint
2. `CompassAgent` produces `FrameworkRecommendation` JSON → passed to `JudgeAgent` via `{recommendation}` placeholder in judge prompt
3. Frontend parses response events, matches by `event.author`, strips markdown code fences, and JSON-parses both outputs
4. Results rendered in `RecommendationCard`; optionally saved to localStorage history

## Development Commands

```bash
# Backend (from backend/)
uv run main.py              # Start FastAPI+ADK server on :8000

# Frontend (from frontend/)
pnpm install                # Install dependencies
pnpm dev                    # Start Next.js dev server on :3000
```

Both servers must run simultaneously. The frontend expects the backend at `http://localhost:8000`.

## Key Conventions

- **Structured output:** Both agents return **pure JSON** (no markdown wrapping). Pydantic `BaseModel` schemas (`FrameworkRecommendation`, `JudgeEvaluation`) enforce the structure.
- **Framework vocabulary is fixed:** `N8N | Cognigy | Google ADK | CrewAI | OpenAI SDK | Claude SDK | LangChain | LangGraph | Keine KI nötig`. The frontend has metadata (colors, icons, doc URLs) for each in `FRAMEWORK_META`.
- **Prompt format:** XML-structured "COMPASS" methodology in `.txt` files. When editing prompts, preserve the XML structure and the JSON output schema.
- **Form validation:** Zod schemas define form contracts on both ends. Keep `formSchema` in `page.tsx` and `contactPayloadSchema` in `route.ts` in sync with the data model.
- **UI pattern:** shadcn/ui components live in `components/ui/`. Use `cn()` from `lib/utils.ts` for conditional classes. Tailwind CSS 4.
- **No test framework configured yet.**

## Adding a New Framework to the Portfolio

1. Add the framework to both prompt files (`compass.txt` and `judge.txt`)
2. Add Pydantic schema entry if the framework name differs from existing patterns
3. Add entry to `FRAMEWORK_META` in `recommendation-card.tsx` (docs URL, context7 URL, color, icon)
