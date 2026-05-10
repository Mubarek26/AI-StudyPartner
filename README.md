# Study Agent

Study Agent is a full-stack app for uploading PDFs, chatting with a tutor about the content, and generating quizzes.

## Stack

- Frontend: React + Vite + Tailwind
- Backend: Express + MongoDB + Cloudinary + Gemini

## Project structure

- Agent/: frontend app
- backend/: API server

## Setup

1. Install dependencies:
   - Frontend: `cd Agent` then `npm install`
   - Backend: `cd backend` then `npm install`
2. Configure backend environment:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in the values listed below

## Environment variables (backend/.env)

- PORT=4000
- MONGODB_URI=your_mongo_uri
- CLOUDINARY_CLOUD_NAME=your_cloud_name
- CLOUDINARY_API_KEY=your_api_key
- CLOUDINARY_API_SECRET=your_api_secret
- CLOUDINARY_FOLDER=study-agent
- GEMINI_API_KEY=your_gemini_api_key
- GEMINI_CHAT_MODEL=gemini-1.5-flash
- GEMINI_QUIZ_MODEL=gemini-3-flash

## Run the app

1. Start backend:
   - `cd backend`
   - `npm run dev`
2. Start frontend:
   - `cd Agent`
   - `npm run dev`

Frontend runs on Vite default port. Backend defaults to `http://localhost:4000`.

## API endpoints

- `POST /api/ingest` (multipart form, field: `file`)
- `POST /api/ingest-url` (json: `{ "url": "...", "filename": "..." }`)
- `GET /api/documents`
- `DELETE /api/documents/:id`
- `GET /api/models`
- `POST /api/quiz`
- `GET /api/quiz-models`
- `POST /chat` (json: `{ "message": "...", "documentId": "...", "history": [...] }`)
- `POST /api/tips/send` (manual trigger for Telegram tip)
