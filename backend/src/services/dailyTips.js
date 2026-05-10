const cron = require("node-cron");
const Groq = require("groq-sdk");
const { Document } = require("../models/Document");
const { Chunk } = require("../models/Chunk");
const sharp = require("sharp");
const { sendTelegramMessage, sendTelegramPhoto } = require("./telegram");

const enabled = process.env.TELEGRAM_TIPS_ENABLED === "true";
const cronExpr = process.env.TELEGRAM_TIPS_CRON || "* * * * *";
const timezone = process.env.TELEGRAM_TIPS_TIMEZONE || "";
const groqApiKey = process.env.GROQ_API_KEY;
const groqTipsModel = process.env.GROQ_TIPS_MODEL || process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant";
const GroqClient = Groq?.default || Groq;
const groqClient = groqApiKey ? new GroqClient({ apiKey: groqApiKey }) : null;

const buildTipText = (text) => {
  const normalized = (text || "")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/[\[\]{}|*_~`^<>]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const picked = [];
  let total = 0;

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 30) {
      continue;
    }

    if (!/^[A-Z]/.test(trimmed)) {
      continue;
    }

    if (total + trimmed.length > 360 && picked.length) {
      break;
    }

    picked.push(trimmed);
    total += trimmed.length;

    if (picked.length >= 3) {
      break;
    }
  }

  const excerpt = picked.length ? picked.join(" ") : normalized.slice(0, 320);
  return excerpt.replace(/\s{2,}/g, " ").trim();
};

const fetchRandomChunk = async (documentId) => {
  const count = await Chunk.countDocuments({ documentId });
  if (!count) {
    return null;
  }

  const skip = Math.floor(Math.random() * count);
  return Chunk.findOne({ documentId })
    .skip(skip)
    .select("text")
    .lean();
};

const fetchContextChunks = async (documentId, limit) => {
  const chunks = await Chunk.find({ documentId })
    .sort({ index: 1 })
    .limit(limit)
    .select("text")
    .lean();

  return chunks.map((chunk) => chunk.text).join("\n\n");
};

const wrapText = (text, maxCharsPerLine) => {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharsPerLine && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = next;
  });

  if (line) {
    lines.push(line);
  }

  return lines;
};

const hashToPalette = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }

  const hue1 = hash;
  const hue2 = (hash + 40) % 360;
  const hue3 = (hash + 80) % 360;

  return {
    bg1: `hsl(${hue1}, 85%, 96%)`,
    bg2: `hsl(${hue2}, 90%, 92%)`,
    accent: `hsl(${hue3}, 75%, 45%)`
  };
};

const pickEmoji = (text) => {
  const lower = (text || "").toLowerCase();
  const rules = [
    { emoji: "📘", keys: ["study", "learn", "lesson", "chapter"] },
    { emoji: "🧠", keys: ["think", "brain", "memory", "cognitive"] },
    { emoji: "📊", keys: ["data", "statistics", "analysis", "chart"] },
    { emoji: "🧮", keys: ["equation", "formula", "math", "calculation"] },
    { emoji: "🧪", keys: ["experiment", "lab", "chemical"] },
    { emoji: "🌍", keys: ["history", "world", "society", "culture"] },
    { emoji: "💡", keys: ["idea", "concept", "insight", "principle"] },
    { emoji: "🧭", keys: ["method", "approach", "framework", "strategy"] }
  ];

  for (const rule of rules) {
    if (rule.keys.some((key) => lower.includes(key))) {
      return rule.emoji;
    }
  }

  return "✨";
};

const xmlEscape = (str) => {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const buildTipBanner = async (title, excerpt) => {
  const width = 1200;
  const height = 630;
  const safeTitle = (title || "Daily Tip").slice(0, 80);
  const safeExcerpt = (excerpt || "").slice(0, 320);
  const titleLines = wrapText(safeTitle, 26).slice(0, 2);
  const excerptLines = wrapText(safeExcerpt, 46).slice(0, 6);
  const palette = hashToPalette(safeTitle);
  const emoji = pickEmoji(safeExcerpt || safeTitle);

  const titleSvg = titleLines
    .map((line, idx) => `<text x="96" y="${190 + idx * 56}" font-size="44" font-weight="700" fill="#111827">${xmlEscape(line)}</text>`)
    .join("");

  const excerptSvg = excerptLines
    .map((line, idx) => `<text x="96" y="${320 + idx * 40}" font-size="28" fill="#1f2937">${xmlEscape(line)}</text>`)
    .join("");

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${palette.bg1}" />
          <stop offset="100%" stop-color="${palette.bg2}" />
        </linearGradient>
        <linearGradient id="accent" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="${palette.accent}" />
          <stop offset="100%" stop-color="#111827" stop-opacity="0.05" />
        </linearGradient>
        <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#94a3b8" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <rect width="100%" height="100%" fill="url(#dots)" />
      <rect x="60" y="60" width="${width - 120}" height="${height - 120}" rx="36" fill="#ffffff" opacity="0.94" />
      <rect x="60" y="60" width="${width - 120}" height="10" rx="8" fill="url(#accent)" />
      <text x="96" y="132" font-size="18" font-weight="700" fill="${palette.accent}" letter-spacing="3">DAILY TIP</text>
      <circle cx="1030" cy="140" r="28" fill="${palette.accent}" opacity="0.12" />
      <text x="1018" y="150" font-size="28">${emoji}</text>
      ${titleSvg}
      ${excerptSvg}
      <text x="96" y="${height - 88}" font-size="16" fill="#64748b">From your study notes</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
};

const normalizeAiTip = (text) => {
  const cleaned = (text || "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  const maxLen = 360;
  if (cleaned.length <= maxLen) {
    return cleaned;
  }

  const trimmed = cleaned.slice(0, maxLen);
  const lastStop = trimmed.lastIndexOf(". ");
  if (lastStop > 120) {
    return trimmed.slice(0, lastStop + 1).trim();
  }

  return trimmed.trim();
};

const generateTipWithGroq = async (contextText, filename) => {
  if (!groqClient) {
    return "";
  }

  const prompt = `You are a study assistant. Write one concise, professional tip based on the context.
Rules:
- One short paragraph, 2-3 sentences max.
- No emojis, no bullet points, no quotes.
- Keep it grounded in the context only.

Document: ${filename}
Context:
${contextText}`;

  const result = await groqClient.chat.completions.create({
    model: groqTipsModel,
    messages: [{ role: "user", content: prompt }]
  });

  const raw = result?.choices?.[0]?.message?.content || "";
  return normalizeAiTip(raw);
};

const sendDailyTip = async () => {
  const count = await Document.countDocuments({});
  if (count === 0) {
    return;
  }

  const skip = Math.floor(Math.random() * count);
  const doc = await Document.findOne({}).skip(skip).lean();
  
  if (!doc) {
    return;
  }

  const contextText = await fetchContextChunks(doc._id, 8);
  let tip = await generateTipWithGroq(contextText, doc.filename);

  if (!tip) {
    const chunk = await fetchRandomChunk(doc._id);
    tip = buildTipText(chunk?.text || "");
  }
  if (!tip) {
    return;
  }

  const message = `Daily tip from "${doc.filename}"`;
  const banner = await buildTipBanner(doc.filename, tip);
  await sendTelegramPhoto(banner, message).catch(async () => {
    await sendTelegramMessage(`${message}:\n\n${tip}`);
  });
};

const startDailyTips = () => {
  if (!enabled) {
    console.log("Daily tips disabled");
    return;
  }

  const options = timezone ? { timezone } : undefined;
  cron.schedule(cronExpr, async () => {
    try {
      await sendDailyTip();
    } catch (error) {
      console.warn("Daily tip failed", error.message);
    }
  }, options);

  console.log(`Daily tips scheduled: ${cronExpr}${timezone ? ` (${timezone})` : ""}`);
};

module.exports = { startDailyTips, sendDailyTip };
