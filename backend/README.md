# Study Agent Backend

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Endpoints

- `POST /api/ingest` (multipart form, field: `file`)
- `POST /api/ingest-url` (json: `{ "url": "...", "filename": "..." }`)
