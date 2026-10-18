// Gemini REST API bilan ishlash: kalitlar rotatsiyasi, JSON javob, Google Search grounding.
import { config, HttpError } from "../config.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const busy = (status, msg) => status === 429 || status === 503 || /high demand|overloaded|unavailable/i.test(msg);

/* Kalitlar va modellar bo'yicha urinish: band (503/429) bo'lsa biroz kutib qayta urinadi,
   keyin zaxira modelga o'tadi (GEMINI_FALLBACK_MODELS). */
async function callModel(body) {
  const keys = config.gemini.keys;
  if (!keys.length) throw new HttpError(500, "GEMINI_API_KEY sozlanmagan");

  let lastError;
  for (const model of [config.gemini.model, ...config.gemini.fallbacks]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const key of keys) {
        const res = await fetch(`${BASE}/models/${model}:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch((e) => ({ ok: false, status: 0, json: async () => ({ error: { message: e.message } }) }));
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        lastError = { status: res.status, message: data.error?.message || `HTTP ${res.status}` };
        console.warn(`[gemini] ${model}: ${lastError.message}`);
        if (res.status === 400 && !busy(res.status, lastError.message)) break; // so'rov xato — boshqa kalit yordam bermaydi
      }
      if (!busy(lastError?.status, lastError?.message || "")) break;
      await sleep(1200 * (attempt + 1));
    }
  }
  throw new HttpError(502, `AI xizmati javob bermadi: ${lastError?.message || "noma'lum xato"}`);
}

const textOf = (data) =>
  (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();

const sourcesOf = (data) => {
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const seen = new Set();
  return chunks
    .map((c) => c.web)
    .filter((w) => w?.uri && !seen.has(w.uri) && seen.add(w.uri))
    .map((w) => ({ title: w.title || w.uri, url: w.uri }))
    .slice(0, 8);
};

/**
 * system   — tizim ko'rsatmasi (string)
 * contents — Gemini contents massivi yoki oddiy matn
 * json     — true bo'lsa javob JSON sifatida parse qilinadi
 * search   — true bo'lsa Google Search grounding yoqiladi (JSON bilan birga ishlatilmaydi)
 */
export async function generate({ system, contents, json = false, search = false, temperature = 0.7 }) {
  const body = {
    contents: typeof contents === "string" ? [{ role: "user", parts: [{ text: contents }] }] : contents,
    generationConfig: { temperature },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (json) body.generationConfig.responseMimeType = "application/json";
  if (search) body.tools = [{ google_search: {} }];

  const data = await callModel(body);
  const text = textOf(data);
  if (!text) {
    const reason = data.promptFeedback?.blockReason;
    throw new HttpError(502, reason ? `So'rov bloklandi: ${reason}` : "AI bo'sh javob qaytardi");
  }
  if (!json) return { text, sources: sourcesOf(data) };

  try {
    return { data: JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) };
  } catch {
    throw new HttpError(502, "AI javobi noto'g'ri formatda keldi, qayta urinib ko'ring");
  }
}

// data:...;base64,... -> Gemini inline_data qismi
export function imagePart(dataUrl) {
  const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(dataUrl || ""));
  if (!m) return null;
  return { inline_data: { mime_type: m[1], data: m[2] } };
}

/* Skanerlangan (matn qatlami yo'q) darsliklar uchun: PDF'ni Gemini File API'ga yuklash.
   Fayl 48 soat saqlanadi, URI BookText hujjatida keshlanadi. */
export async function uploadFile(buffer, mimeType, displayName) {
  const key = config.gemini.keys[0];
  if (!key) throw new HttpError(500, "GEMINI_API_KEY sozlanmagan");
  const start = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${key}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(buffer.length),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new HttpError(502, "Gemini fayl yuklashni boshlamadi");

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize" },
    body: buffer,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.file?.uri) throw new HttpError(502, "Gemini faylni qabul qilmadi");
  return { uri: data.file.uri, mimeType, expiresAt: Date.now() + 46 * 3600 * 1000 };
}
