# ⬡ Sentinel — Agentic Honeypot

> **Security-as-an-Agent.** Instead of a static firewall, an AI agent monitors live traffic, detects attacks, and autonomously spins up a mirror honeypot environment — rerouting the attacker there while keeping the primary app fully protected.

Built for hackathon. Powered by Claude (Anthropic) + Locus API.

---

## How it works

```
Incoming traffic
      │
      ▼
┌─────────────────┐
│  Traffic Monitor │  ← streams HTTP requests in real time
└────────┬────────┘
         │ 3+ anomalies
         ▼
┌─────────────────┐
│   Claude Agent   │  ← analyzes patterns, decides: attack or benign?
└────────┬────────┘
         │ verdict: attack
         ▼
┌─────────────────┐
│   Locus API      │  ← spins up mirror environment in seconds
└────────┬────────┘
         │ env ready
         ▼
┌─────────────────┐
│  BGP Reroute     │  ← attacker traffic silently redirected
└─────────────────┘
         │
         ▼
    🍯 Honeypot        ← attacker trapped, primary app safe
```

The agent makes the entire decision autonomously — no human in the loop.

---

## Quickstart

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/sentinel-honeypot.git
cd sentinel-honeypot
npm install
```

### 2. Add your API key

```bash
cp .env.example .env
# Edit .env and paste your Anthropic API key
```

Get your key at [console.anthropic.com](https://console.anthropic.com).

### 3. Run

```bash
npm start
# → http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev
```

---

## Project structure

```
sentinel-honeypot/
├── server.js          # Express server + Claude API proxy + Locus API sim
├── public/
│   └── index.html     # Full dashboard (HTML/CSS/JS, zero dependencies)
├── .env.example       # Environment variable template
├── .gitignore
└── package.json
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/`  | Serves the dashboard |
| `POST` | `/api/analyze` | Proxies traffic sample to Claude for threat analysis |
| `POST` | `/api/locus/create-environment` | Locus API simulation (replace with real calls) |

### `/api/analyze` payload

```json
{
  "trafficSample": [
    { "method": "POST", "path": "';DROP TABLE users;--", "ip": "185.220.101.47" },
    { "method": "GET",  "path": "/../../../etc/passwd",  "ip": "185.220.101.47" }
  ]
}
```

### Response

```json
{
  "verdict": "attack",
  "confidence": 96,
  "attack_type": "SQL Injection + Path Traversal",
  "reasoning": "Classic multi-vector probe targeting DB and filesystem simultaneously.",
  "action": "deploy_honeypot"
}
```

---

## Deploying to production

### Render (free tier)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add `ANTHROPIC_API_KEY` in Environment Variables

### Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway variables set ANTHROPIC_API_KEY=sk-ant-...
```

### Vercel (serverless)

Not ideal for this setup (long-polling). Use Render or Railway instead.

---

## Replacing the Locus API simulation

In `server.js`, find the `/api/locus/create-environment` handler and replace the simulated response with real Locus API calls:

```js
app.post('/api/locus/create-environment', async (req, res) => {
  const response = await fetch('https://api.locus.io/v2/environments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LOCUS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });
  const data = await response.json();
  res.json(data);
});
```

Add `LOCUS_API_KEY` to your `.env`.

---

## Built with

- [Claude (Anthropic)](https://anthropic.com) — AI threat analysis agent
- [Locus API](https://locus.io) — instant environment provisioning
- Express.js — lightweight backend / API proxy
- Vanilla JS — zero-dependency frontend
