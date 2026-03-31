import { createHmac } from "crypto";
import { spawn } from "child_process";
import WebSocket from "ws";
import { ObjectStorageService } from "./replit_integrations/object_storage";
import type { CharacterRating } from "@shared/schema";

const ISE_HOST = "ise-api-sg.xf-yun.com";
const ISE_PATH = "/v2/ise";
const ISE_WSS = `ws://${ISE_HOST}${ISE_PATH}`;

const CHUNK_SIZE = 1280;
const CHUNK_INTERVAL_MS = 40;

const INITIAL_CONSONANTS = new Set([
  "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h",
  "j", "q", "x", "zh", "ch", "sh", "r", "z", "c", "s",
  "y", "w",
]);

function isInitialPhone(content: string): boolean {
  return INITIAL_CONSONANTS.has(content.toLowerCase());
}

function mapScore(score: number): 0 | 50 | 100 {
  if (score < 40) return 0;
  if (score < 75) return 50;
  return 100;
}

function mapFluency(score: number): number {
  if (score < 20) return 1;
  if (score < 40) return 2;
  if (score < 60) return 3;
  if (score < 80) return 4;
  return 5;
}

function buildSignedUrl(appKey: string, apiSecret: string): string {
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${ISE_HOST}\ndate: ${date}\nGET ${ISE_PATH} HTTP/1.1`;
  const signature = createHmac("sha256", apiSecret)
    .update(signatureOrigin)
    .digest("base64");
  const authorizationOrigin = `api_key="${appKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString("base64");
  const query = `authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(ISE_HOST)}`;
  return `${ISE_WSS}?${query}`;
}

export interface ISEResult {
  characterRatings: CharacterRating[];
  fluencyScore: number;
  overallScore: number;
}

/** Extract the value of a named XML attribute from a tag's attribute string, regardless of order. */
function attr(tagAttrs: string, name: string): string | undefined {
  const m = tagAttrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

/** Extract all immediate-child elements of a given tag name from an XML fragment. */
function extractElements(xml: string, tag: string): { attrs: string; inner: string }[] {
  const results: { attrs: string; inner: string }[] = [];
  const re = new RegExp(`<${tag}([^>]*)>([\s\S]*?)<\\/${tag}>`, "g");
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push({ attrs: m[1], inner: m[2] });
  }
  return results;
}

/** Extract self-closing or paired elements and their attribute strings. */
function extractSelfClosing(xml: string, tag: string): string[] {
  const results: string[] = [];
  const re = new RegExp(`<${tag}([^>]*)\\s*/?>`, "g");
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1]);
  }
  return results;
}

function parseISEXml(xml: string, sentenceText: string): ISEResult {
  const fluencyMatch = xml.match(/\bfluency_score="([^"]+)"/);
  const fluencyRaw = fluencyMatch ? parseFloat(fluencyMatch[1]) : 50;
  const fluencyScore = mapFluency(fluencyRaw);

  const chineseChars = Array.from(sentenceText).filter(ch =>
    /[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)
  );

  const syllables: { tone: number; initial: number; final: number }[] = [];

  for (const word of extractElements(xml, "word")) {
    for (const syll of extractElements(word.inner, "syll")) {
      const toneScore = parseFloat(attr(syll.attrs, "tone_score") ?? "70");

      const initials: number[] = [];
      const finals: number[] = [];

      for (const phoneAttrs of extractSelfClosing(syll.inner, "phone")) {
        const phoneContent = attr(phoneAttrs, "content") ?? "";
        const phoneScore = parseFloat(attr(phoneAttrs, "score") ?? "70");
        if (isInitialPhone(phoneContent)) {
          initials.push(phoneScore);
        } else {
          finals.push(phoneScore);
        }
      }

      const initialAvg =
        initials.length > 0
          ? initials.reduce((a, b) => a + b, 0) / initials.length
          : finals.length > 0
          ? finals[0]
          : 70;
      const finalAvg =
        finals.length > 0
          ? finals.reduce((a, b) => a + b, 0) / finals.length
          : initialAvg;

      syllables.push({
        tone: toneScore,
        initial: initialAvg,
        final: finalAvg,
      });
    }
  }

  const characterRatings: CharacterRating[] = chineseChars.map((char, idx) => {
    const syll = syllables[idx];
    if (!syll) {
      return { character: char, initial: 50, final: 50, tone: 50 };
    }
    return {
      character: char,
      initial: mapScore(syll.initial),
      final: mapScore(syll.final),
      tone: mapScore(syll.tone),
    };
  });

  const fluencyPct = fluencyScore * 20;
  let overallScore: number;
  if (characterRatings.length > 0) {
    const charTotal = characterRatings.reduce(
      (sum, cr) => sum + cr.initial + cr.final + cr.tone,
      0
    );
    const charScore = charTotal / (characterRatings.length * 3);
    overallScore = Math.round(charScore * 0.8 + fluencyPct * 0.2);
  } else {
    overallScore = fluencyPct;
  }

  return { characterRatings, fluencyScore, overallScore };
}

async function fetchAudioBuffer(audioUrl: string): Promise<Buffer> {
  const objService = new ObjectStorageService();
  const file = await objService.getObjectEntityFile(audioUrl);
  const [buffer] = await file.download();
  return buffer as Buffer;
}

/**
 * Transcode any audio format to 16kHz 16-bit mono signed PCM (raw) via ffmpeg.
 * ISE accepts raw PCM with aue:"raw".
 */
async function transcodeToRawPcm(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel", "error",
      "-i", "pipe:0",
      "-ar", "16000",
      "-ac", "1",
      "-f", "s16le",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];

    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stdout.on("end", () => {
      if (chunks.length === 0) {
        reject(new Error("ffmpeg produced no output"));
        return;
      }
      resolve(Buffer.concat(chunks));
    });

    const stderrChunks: Buffer[] = [];
    proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    proc.on("error", (err) => reject(new Error(`ffmpeg spawn error: ${err.message}`)));

    proc.on("close", (code) => {
      if (code !== 0) {
        const stderrText = Buffer.concat(stderrChunks).toString("utf8").trim();
        reject(new Error(`ffmpeg exited with code ${code}: ${stderrText}`));
      }
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}

function assessOverWebSocket(
  url: string,
  audioBuffer: Buffer,
  appId: string,
  sentenceText: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const xmlParts: string[] = [];
    let settled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      try { ws.close(); } catch {}
      if (err) reject(err);
      else resolve(xmlParts.join(""));
    };

    // Audio offset for streaming (starts at 0 since ssb frame carries no audio)
    let audioOffset = 0;
    let audioFrameIndex = 0; // 0 = first, ... = middle, last = when done

    const sendNextAudioChunk = () => {
      if (settled) return;
      if (audioOffset >= audioBuffer.length) {
        // All audio data sent — send final empty sentinel frame (aus=4, status=2, data="")
        ws.send(
          JSON.stringify({
            business: { cmd: "auw", aus: 4, aue: "raw" },
            data: { status: 2, data: "", data_type: 1, encoding: "raw" },
          })
        );
        return;
      }
      const chunk = audioBuffer.slice(audioOffset, audioOffset + CHUNK_SIZE);
      audioOffset += CHUNK_SIZE;
      // aus: 1=first audio frame, 2=middle frames
      const aus = audioFrameIndex === 0 ? 1 : 2;
      audioFrameIndex++;
      ws.send(
        JSON.stringify({
          business: { cmd: "auw", aus, aue: "raw" },
          data: { status: 1, data: chunk.toString("base64"), data_type: 1, encoding: "raw" },
        })
      );
      setTimeout(sendNextAudioChunk, CHUNK_INTERVAL_MS);
    };

    ws.on("open", () => {
      const textWithBom = "\uFEFF" + sentenceText;

      // Phase 1: Send ssb frame with ONLY business params, no audio data
      const ssbFrame = {
        common: { app_id: appId },
        business: {
          cmd: "ssb",
          sub: "ise",
          ent: "cn_vip",
          category: "read_sentence",
          aue: "raw",
          auf: "audio/L16;rate=16000",
          tte: "utf-8",
          ttp_skip: true,
          rstcd: "utf8",
          text: textWithBom,
        },
        data: { status: 0, data: "" },
      };
      ws.send(JSON.stringify(ssbFrame));

      // Phase 2: Start streaming audio right after (server acks ssb quickly)
      setTimeout(sendNextAudioChunk, CHUNK_INTERVAL_MS);
    });

    ws.on("message", (raw: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(raw.toString());
        console.log(
          `[iFLYTEK ISE] code=${msg.code} status=${msg.data?.status} sid=${msg.sid}`
        );
        if (msg.code !== 0) {
          done(new Error(`iFLYTEK ISE error ${msg.code}: ${msg.message}`));
          return;
        }
        if (msg.data?.data) {
          xmlParts.push(
            Buffer.from(msg.data.data, "base64").toString("utf8")
          );
        }
        if (msg.data?.status === 2) {
          done();
        }
      } catch (err) {
        done(err instanceof Error ? err : new Error(String(err)));
      }
    });

    ws.on("error", (err) => done(err));
    ws.on("close", () => {
      if (!settled) done(new Error("iFLYTEK ISE WebSocket closed unexpectedly"));
    });

    timeoutHandle = setTimeout(
      () => done(new Error("iFLYTEK ISE timed out after 60s")),
      60_000
    );
  });
}

export async function scoreMandarin(
  audioUrl: string,
  sentenceText: string
): Promise<ISEResult> {
  const appId = process.env.IFLYTEK_APP_ID;
  const apiKey = process.env.IFLYTEK_API_KEY;
  const apiSecret = process.env.IFLYTEK_API_SECRET;

  if (!appId || !apiKey || !apiSecret) {
    throw new Error("iFLYTEK credentials not set");
  }

  const rawAudio = await fetchAudioBuffer(audioUrl);
  const pcmAudio = await transcodeToRawPcm(rawAudio);

  const url = buildSignedUrl(apiKey, apiSecret);
  const xml = await assessOverWebSocket(url, pcmAudio, appId, sentenceText);

  if (!xml) {
    throw new Error("iFLYTEK ISE returned empty XML");
  }

  console.log("[iFLYTEK ISE] XML snippet:", xml.slice(0, 300));
  return parseISEXml(xml, sentenceText);
}
