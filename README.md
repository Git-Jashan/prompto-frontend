# Prompto — AI Prompt Generation Tool

> Don't guess your prompt. Build it.

Prompto is a conversational web app that helps you get better outputs from AI tools. Instead of staring at a blank input box, Prompto asks you the right questions — then generates a high-quality, structured prompt tailored to your exact need.

**Live:** [prompto-app.vercel.app](https://prompto-app.vercel.app) — sign in with Google to get started.

---

## The Problem

Most people get poor AI outputs because prompting is a skill — one most people haven't developed. Generic prompts produce generic results. Prompto fixes that by guiding you through a structured conversation before anything gets generated.

---

## How It Works

1. **Choose your category** — image, video, code, research, or general
2. **Answer Round 1 questions** — Prompto builds initial context about your goal
3. **Go deeper or generate** — after each round you choose to keep refining or generate immediately
4. **Maximum 3 rounds** — up to 7 questions total, then your prompt is generated
5. **Get your prompt** — copy and use it anywhere

The more context you give, the better the output. But you're never forced to go further than you want.

---

## Features

- **Guided question flow** — 1 to 3 rounds of questions (3–7 questions total)
- **Generate anytime** — say "generate" or "make it" after any round to skip ahead
- **Voice-to-text input** — speak your answers instead of typing
- **Category filters** — image, video, code, research, general
- **Public prompt library** — browse and use prompts shared by the community
- **Private prompt saving** — save your own prompts, visible only to you
- **Google sign-in** — one-click Firebase auth
- **Daily limit** — 5 prompt generations per day per user

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | HTML, CSS, JavaScript              |
| Auth     | Firebase Authentication (Google)   |
| Database | Firebase Firestore                 |
| Hosting  | Vercel                             |
| Backend  | Node.js + Express (separate repo)  |
| AI Model | Groq API — Llama 3.3 70B Versatile |

**Backend repo:** [github.com/Git-Jashan/prompto-backend](https://github.com/Git-Jashan/prompto-backend)

---

## Running Locally

```bash
git clone https://github.com/Git-Jashan/prompto-frontend
cd prompto-frontend
```

Open `index.html` in your browser or use Live Server (VS Code extension).

> You'll need your own Firebase project config and a running instance of [prompto-backend](https://github.com/Git-Jashan/prompto-backend) pointed to in your API calls.

---

## Project Status

Shipped v1, iterated to v2. Got real users, tracked retention, concluded the problem wasn't painful enough at scale — deliberately sunset active development and moved on to a larger problem in fintech. Prompto stays fully live at [prompto-app.vercel.app](https://prompto-app.vercel.app).

---

## Author

**Jashanjeet Singh**
[github.com/Git-Jashan](https://github.com/Git-Jashan) · [linkedin.com/in/jashanjeet-singh-9834bb35a](https://linkedin.com/in/jashanjeet-singh-9834bb35a)
