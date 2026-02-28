# Live Polling System

Resilient live polling platform with Teacher and Student personas, real-time results, persistence, and recovery after refresh.

## Features
- **Teacher**
  - Create a poll with question, 2–4 options, and time limit (10–60s).
  - Live results dashboard with percentage bars.
  - Ask a new question only after the previous poll ends or all students submit.
  - Poll history page (DB-backed).
  - Kick out participants.
- **Student**
  - Enter name on first visit (per tab/session).
  - Receive questions instantly and vote once per poll.
  - Timer synchronized with server (late joiners see remaining time).
  - View results after submission.
  - Poll history page with PDF download.
- **Resilience**
  - Refreshing teacher/student restores current poll state from backend.
- **Integrity**
  - Server blocks multiple votes per student per poll.

## Bonus Features
- **Ask AI** (Teacher): generate questions + options by topic and difficulty using Groq.
- **Chat popup** between students and teacher.
- **Poll history PDF download** for students.

---

## Tech Stack
- Frontend: React + TypeScript (Vite)
- Backend: Node.js + Express + Socket.io (TypeScript)
- DB: MongoDB (Atlas or local)

---

## Running Locally

### 1) Backend
```
cd backend
copy .env.example .env
```
Update `.env`:
```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/live-polling
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL=llama-3.1-8b-instant
```
Run:
```
npm install
npm run dev
```

### 2) Frontend
```
cd frontend
copy .env.example .env
```
Update `.env`:
```
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```
Run:
```
npm install
npm run dev
```

Open: `http://localhost:5173`

---

## Deployment Notes
- Backend: Render (root = `backend`)
  - Build: `npm install && npm run build`
  - Start: `npm run start`
  - Env: `MONGO_URI`, `CLIENT_ORIGIN`, `GROQ_API_KEY`, `GROQ_MODEL`
- Frontend: Vercel (root = `frontend`)
  - Env: `VITE_API_URL`, `VITE_SOCKET_URL`

---

## Key Behaviors
- If a student joins late, their timer starts with remaining time.
- Refreshing any page restores current poll state.
- Duplicate voting is blocked at DB level.
