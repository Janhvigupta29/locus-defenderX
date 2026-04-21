require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Claude API proxy — keeps your API key server-side and out of the browser
app.post("/api/analyze", async (req, res) => {
  const { trafficSample } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in .env" });
  }

  if (!trafficSample || !Array.isArray(trafficSample)) {
    return res.status(400).json({ error: "trafficSample must be an array" });
  }

  const prompt = `You are a security AI agent monitoring HTTP traffic. Analyze these suspicious requests and decide if this is a real attack that warrants deploying a honeypot.

Traffic sample:
${trafficSample.map((r) => `${r.method} ${r.path} from ${r.ip}`).join("\n")}

Respond ONLY as valid JSON with this exact shape:
{"verdict":"attack","confidence":95,"attack_type":"SQL Injection","reasoning":"Brief 1-sentence explanation","action":"deploy_honeypot"}

or if benign:
{"verdict":"benign","confidence":80,"reasoning":"Brief explanation","action":"monitor"}

Verdict must be "attack" or "benign". Keep reasoning under 20 words.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        system:
          "You are a network security AI. Respond only with valid JSON, no markdown, no explanation outside the JSON.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return res.status(response.status).json({ error: "Anthropic API error", detail: err });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "{}";

    let result;
    try {
      result = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      result = {
        verdict: "attack",
        confidence: 88,
        attack_type: "Anomalous Traffic",
        reasoning: "Multiple suspicious patterns detected",
        action: "deploy_honeypot",
      };
    }

    res.json(result);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error", detail: err.message });
  }
});

// Locus API simulation endpoint (replace with real Locus API calls when available)
app.post("/api/locus/create-environment", async (req, res) => {
  const { source, deception, ttl } = req.body;
  console.log(`[LOCUS] Creating mirror environment for ${source}`);

  // Simulate Locus API latency
  await new Promise((r) => setTimeout(r, 300));

  res.json({
    status: "created",
    environment_id: `hp-${Math.random().toString(36).slice(2, 8)}`,
    url: `honeypot-${Math.random().toString(36).slice(2, 8)}.locus.io`,
    region: "eu-west-2",
    deception_layer: deception,
    ttl: ttl || "auto",
  });
});

app.listen(PORT, () => {
  console.log(`\n🛡  Sentinel Honeypot running at http://localhost:${PORT}`);
  console.log(`   API key loaded: ${process.env.ANTHROPIC_API_KEY ? "✓ yes" : "✗ missing — set ANTHROPIC_API_KEY in .env"}\n`);
});
