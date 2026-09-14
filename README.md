# VITAL-X

SIH26047 — Patient Case-Taking Software

AI-assisted pre-consultation clinical intake and verification platform for AYUSH care.

## v0.1 goal

First working vertical slice:

`Start session → language → consent → patient profile → clinical answer → structured claim → safety check → doctor case → verification`

## Architecture

- Frontend: Next.js + TypeScript
- Backend: FastAPI + Python
- Database: PostgreSQL
- Validation: Pydantic
- AI: provider adapter (not hard-wired into domain logic)
- Interoperability: FHIR-compatible adapter boundary

## Safety boundary

The AI may extract candidate information, classify concepts, generate candidate follow-up questions and draft summaries. It must not diagnose, silently resolve contradictions, or mark a claim clinically verified.

## Run

```bash
docker compose up --build
```

Backend: http://localhost:8000
Backend docs: http://localhost:8000/docs
Frontend: http://localhost:3000

## Environment

Copy `.env.example` to `.env` and add provider credentials only on the server side.
