# Backend (FastAPI + Google ADK)

Kurzanleitung für den lokalen Entwicklungsstart.

## .env anlegen

Vor dem Start muss eine `.env` erstellt und befüllt werden.

- `backend/agent4agents/.env`

Minimalinhalt:

```dotenv
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=dein_google_api_key
```

Vorlage: `backend/agent4agents/.env.example`

## Starten

```bash
cd backend
uv sync
uv run main.py
```

Der Backend-Service läuft danach auf `http://localhost:8000`.

## Hinweis

Für die vollständige App muss zusätzlich das Frontend laufen.
