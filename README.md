# 🎴 Zuhaari — Real-Time Multiplayer Card Game

A complete, full-stack, real-time multiplayer card game built with **React**, **Node.js**, **Express**, and **Socket.IO**.

Zuhaari is a 4-player, team-based trick-taking card game played online with friends.

---

## 👥 Teams & Game Overview

- **Players:** 4 Players (Player A, Player B, Player C, Player D)
- **Teams:**
  - **Team AC:** Player A + Player C
  - **Team BD:** Player B + Player D
- **Deck:** 36 cards (ranks 6 through Ace in all 4 suits: ♠, ♥, ♣, ♦)
- **Dealing:** Two-stage dealing (5 cards dealt initially, then remaining 4 after Cutt decision)
- **Cutt Mechanics:** Player B gets first opportunity to declare the Trump suit (Target: 6 hands) or pass. If all players pass, default Cutt is triggered (Target: 5 hands).
- **Trick-Taking Rules:** Players must follow lead suit if held. Highest trump wins; if no trump is played, highest lead suit card wins.
- **Rounds:** 9 hands per round. The declaring team wins if they achieve their target!

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Zustand, Web Audio API
- **Backend:** Node.js, Express, Socket.IO, TypeScript, Zod
- **Testing:** Vitest (60 automated unit and integration tests)

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
# In the root directory:
npm install

# In the client directory:
cd client && npm install && cd ..

# In the server directory:
cd server && npm install && cd ..
```

### 2. Run Both Server & Client
```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Backend Health Check:** http://localhost:3001/health

### 3. Run Automated Tests
```bash
npm test
```

---

## ☁️ Deployment Guide

### A. Deploy Backend (e.g. Render / Railway / Fly.io)

1. Create a **New Web Service** on [Render.com](https://render.com) or [Railway.app](https://railway.app).
2. Connect your GitHub repository: `https://github.com/Sagar-Bawankule/Zuhaari-.git`.
3. Configure the service:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start` (or `node dist/server/src/index.js`)
4. Set Environment Variables:
   - `SERVER_PORT`: `3001` (or `$PORT` on Render)
   - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app`

### B. Deploy Frontend (e.g. Vercel / Netlify)

1. Create a **New Project** on [Vercel](https://vercel.com).
2. Import the repository: `https://github.com/Sagar-Bawankule/Zuhaari-.git`.
3. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Set Environment Variables:
   - `VITE_SERVER_URL`: `https://your-backend-service.onrender.com`
5. Click **Deploy**!
