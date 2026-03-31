import { createHmac } from "crypto";
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

function parseISEXml(xml: string, sentenceText: string): ISEResult {
  const fluencyMatch = xml.match(/fluency_score="([^"]+)"/);
  const fluencyRaw = fluencyMatch ? parseFloat(fluencyMatch[1]) : 50;
  const fluencyScore = mapFluency(fluencyRaw);

  const chineseChars = Array.from(sentenceText).filter(ch =>
    /[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)
  );

  const syllables: { tone: number; initial: number; final: number }[] = [];

  const wordRegex = /<word[^>]*content="[^"]*"[^>]*>([\s\S]*?)<\/word>/g;
  let wordMatch;
  while ((wordMatch = wordRegex.exec(xml)) !== null) {
    const wordInner = wordMatch[1];

    const syllRegex = /<syll[^>]*tone_score="([^"]+)"[^>]*>([\s\S]*?)<\/syll>/g;
    let syllMatch;
    while ((syllMatch = syllRegex.exec(wordInner)) !== null) {
      const toneScore = parseFloat(syllMatch[1]);
      const syllInner = syllMatch[2];

      const initials: number[] = [];
      const finals: number[] = [];

      const phoneRegex = /<phone[^>]+content="([^"]+)"[^>]+score="([^"]+)"[^>]*\/?>/g;
      let phoneMatch;
      while ((phoneMatch = phoneRegex.exec(syllInner)) !== null) {
        const phoneContent = phoneMatch[1];
        const phoneScore = parseFloat(phoneMatch[2]);
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
      try {
        ws.close();
      } catch {}
      if (err) reject(err);
      else resolve(xmlParts.join(""));
    };

    ws.on("open", () => {
      const textWithBom = "\uFEFF" + sentenceText;
      const firstChunk = audioBuffer.slice(0, CHUNK_SIZE);
      const isOnlyChunk = audioBuffer.length <= CHUNK_SIZE;

      const firstFrame = {
        common: { app_id: appId },
        business: {
          category: "read_sentence",
          rstcd: "utf8",
          ent: "cn_vip",
          sub: "ise",
          aue: "lame",
          text: Buffer.from(textWithBom, "utf8").toString("base64"),
          extra_ability: "syll_phone_err_msg",
          plev: "0",
        },
        data: {
          status: isOnlyChunk ? 2 : 0,
          data: firstChunk.toString("base64"),
        },
      };

      ws.send(JSON.stringify(firstFrame));

      if (!isOnlyChunk) {
        let offset = CHUNK_SIZE;
        const sendNext = () => {
          if (settled) return;
          if (offset >= audioBuffer.length) return;
          const chunk = audioBuffer.slice(offset, offset + CHUNK_SIZE);
          offset += CHUNK_SIZE;
          const isLast = offset >= audioBuffer.length;
          ws.send(
            JSON.stringify({
              data: { status: isLast ? 2 : 1, data: chunk.toString("base64") },
            })
          );
          if (!isLast) setTimeout(sendNext, CHUNK_INTERVAL_MS);
        };
        setTimeout(sendNext, CHUNK_INTERVAL_MS);
      }
    });

    ws.on("message", (raw: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(raw.toString());
        console.log(
          `[iFLYTEK ISE] code=${msg.code} status=${msg.data?.status} sid=${msg.sid}`
        );
        if (msg.code !== 0) {
          done(
            new Error(`iFLYTEK ISE error ${msg.code}: ${msg.message}`)
          );
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

  const audioBuffer = await fetchAudioBuffer(audioUrl);
  const url = buildSignedUrl(apiKey, apiSecret);
  const xml = await assessOverWebSocket(url, audioBuffer, appId, sentenceText);

  if (!xml) {
    throw new Error("iFLYTEK ISE returned empty XML");
  }

  console.log("[iFLYTEK ISE] XML snippet:", xml.slice(0, 300));
  return parseISEXml(xml, sentenceText);
}
