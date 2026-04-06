import { createHash } from "crypto";
import { spawn } from "child_process";
import { ObjectStorageService } from "./replit_integrations/object_storage";
import type { CharacterRating } from "@shared/schema";

export interface ISEResult {
  characterRatings: CharacterRating[];
  fluencyScore: number;
  overallScore: number;
}

// ─── Score mapping ────────────────────────────────────────────────────────────

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

// ─── Pronunciation error library IDs ─────────────────────────────────────────

const INITIAL_PHONE_TO_ERROR: Record<string, string> = {
  zh: "I001", ch: "I001", sh: "I001",
  q:  "I002",
  x:  "I003",
  r:  "I004",
  c:  "I005",
  z:  "I006",
  j:  "I007",
  b:  "I008", p: "I008",
};

const FINAL_PHONE_TO_ERROR: Record<string, string> = {
  v:   "F001",
  e:   "F002",
  eng: "F003", ing: "F003",
  ian: "F004",
  uo:  "F005",
  ong: "F006",
  ai:  "F007",
  iao: "F008",
  er:  "F009",
};

const LIKELY_TONE_ERROR: Record<number, string> = {
  1: "T006",
  2: "T002",
  3: "T010",
  4: "T003",
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

function buildSig(appId: string, secretKey: string, timestamp: string): string {
  return createHash("md5")
    .update(appId + secretKey + timestamp, "utf8")
    .digest("hex");
}

// ─── Audio helpers ────────────────────────────────────────────────────────────

async function fetchAudioBuffer(audioUrl: string): Promise<Buffer> {
  const objService = new ObjectStorageService();
  const file = await objService.getObjectEntityFile(audioUrl);
  const [buffer] = await file.download();
  return buffer as Buffer;
}

/**
 * Transcode any audio format to 16kHz 16-bit mono WAV via ffmpeg.
 * SpeechSuper accepts audioType:"wav" with these parameters.
 */
async function transcodeToWav(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-hide_banner",
      "-loglevel", "error",
      "-i", "pipe:0",
      "-ar", "16000",
      "-ac", "1",
      "-f", "wav",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];
    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stdout.on("end", () => {
      if (chunks.length === 0) {
        reject(new Error("ffmpeg produced no WAV output"));
        return;
      }
      resolve(Buffer.concat(chunks));
    });

    const stderrChunks: Buffer[] = [];
    proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));
    proc.on("error", (err) => reject(new Error(`ffmpeg spawn error: ${err.message}`)));
    proc.on("close", (code) => {
      if (code !== 0) {
        const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}

// ─── SpeechSuper HTTP request ─────────────────────────────────────────────────

interface SSWord {
  word: string;
  tone: string;           // "tone1" | "tone2" | "tone3" | "tone4" | "tone5"
  charType: number;       // 0 = Chinese, 1 = punctuation
  scores: {
    pronunciation: number;
    tone: number;
    overall_pron?: number;
  };
  phonemes?: {
    phone: string;
    tone_index: string;   // "0" = initial, "1"/"2" = final
    pronunciation: number;
  }[];
}

interface SSResponse {
  eof: number;
  errId?: string;
  result?: {
    overall: number;
    fluency: number;
    words: SSWord[];
  };
}

async function callSpeechSuper(
  wavBuffer: Buffer,
  appId: string,
  secretKey: string,
  refText: string
): Promise<SSResponse> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const sig = buildSig(appId, secretKey, timestamp);

  const param = JSON.stringify({
    app: {
      userId: "marlow",
      applicationId: appId,
      timestamp,
      sig,
    },
    audio: {
      audioType: "wav",
      channel: 1,
      sampleBytes: 2,
      sampleRate: 16000,
    },
    request: {
      coreType: "sent.eval.cn",
      refText,
      phoneme_output: 1,
      tone_weight: 0.2,
    },
  });

  const form = new FormData();
  form.append("param", param);
  form.append(
    "audio",
    new Blob([wavBuffer], { type: "audio/wav" }),
    "audio.wav"
  );

  const response = await fetch("https://api.speechsuper.com/cn.sent.eval", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`SpeechSuper HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<SSResponse>;
}

// ─── Response parsing ─────────────────────────────────────────────────────────

function parseSpeechSuperResult(
  res: SSResponse,
  sentenceText: string
): ISEResult {
  const result = res.result!;
  const overallScore = Math.round(result.overall ?? 0);
  const fluencyScore = mapFluency(result.fluency ?? 50);

  const chineseChars = Array.from(sentenceText).filter((ch) =>
    /[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)
  );

  // Filter to Chinese-only words (charType 0), skip punctuation
  const chineseWords = result.words.filter((w) => w.charType === 0);

  const characterRatings: CharacterRating[] = chineseChars.map((char, idx) => {
    const w = chineseWords[idx];
    if (!w) {
      return { character: char, initial: 50, final: 50, tone: 50 };
    }

    const toneScoreRaw = Math.round(w.scores.tone ?? 50);
    const phoneScoreRaw = Math.round(w.scores.pronunciation ?? 50);

    // Expected tone from "tone3" → 3, skip neutral (5)
    const toneNumStr = w.tone?.replace("tone", "");
    const expectedToneNum = toneNumStr ? parseInt(toneNumStr, 10) : undefined;
    const expectedTone =
      expectedToneNum && expectedToneNum >= 1 && expectedToneNum <= 4
        ? expectedToneNum
        : undefined;

    // Phoneme breakdown
    const phonemes = w.phonemes ?? [];
    const initialPhonemes = phonemes.filter((p) => p.tone_index === "0");
    const finalPhonemes = phonemes.filter((p) => p.tone_index !== "0");

    // Initial score
    const initialAvg =
      initialPhonemes.length > 0
        ? initialPhonemes.reduce((s, p) => s + p.pronunciation, 0) / initialPhonemes.length
        : phoneScoreRaw;
    const initial = mapScore(initialAvg);

    // Final score
    const finalAvg =
      finalPhonemes.length > 0
        ? finalPhonemes.reduce((s, p) => s + p.pronunciation, 0) / finalPhonemes.length
        : phoneScoreRaw;
    const final = mapScore(finalAvg);

    // Tone score
    const tone = mapScore(toneScoreRaw);

    // Symbols for error lookup
    const initialSymbol = initialPhonemes[0]?.phone;
    const finalSymbol = finalPhonemes[0]?.phone;

    // Error IDs — only flag when score is "poor" or "ok" (< 75)
    const initialError =
      initialAvg < 75 && initialSymbol
        ? INITIAL_PHONE_TO_ERROR[initialSymbol]
        : undefined;
    const finalError =
      finalAvg < 75 && finalSymbol
        ? FINAL_PHONE_TO_ERROR[finalSymbol]
        : undefined;
    const toneError =
      toneScoreRaw < 75 && expectedTone !== undefined
        ? LIKELY_TONE_ERROR[expectedTone]
        : undefined;

    return {
      character: char,
      initial,
      final,
      tone,
      expectedTone,
      toneScoreRaw,
      phoneScoreRaw,
      initialError,
      finalError,
      toneError,
      initialSymbol: initialAvg < 75 ? initialSymbol : undefined,
      finalSymbol: finalAvg < 75 ? finalSymbol : undefined,
    };
  });

  return { characterRatings, fluencyScore, overallScore };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function scoreMandarin(
  audioUrl: string,
  sentenceText: string
): Promise<ISEResult> {
  const appId = process.env.SPEECHSUPER_APP_ID;
  const secretKey = process.env.SPEECHSUPER_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error("SPEECHSUPER_APP_ID and SPEECHSUPER_SECRET_KEY must be set");
  }

  const rawAudio = await fetchAudioBuffer(audioUrl);
  const wavAudio = await transcodeToWav(rawAudio);

  const res = await callSpeechSuper(wavAudio, appId, secretKey, sentenceText);

  if (res.errId && res.errId !== "0") {
    throw new Error(`SpeechSuper error ${res.errId}`);
  }

  if (!res.result) {
    throw new Error("SpeechSuper returned no result");
  }

  console.log("[SpeechSuper] overall:", res.result.overall, "fluency:", res.result.fluency);
  console.log("[SpeechSuper] words:", JSON.stringify(res.result.words?.map(w => ({
    word: w.word,
    tone: w.tone,
    scores: w.scores,
    phonemes: w.phonemes,
  }))));

  const result = parseSpeechSuperResult(res, sentenceText);
  console.log("[SpeechSuper] characterRatings:", JSON.stringify(result.characterRatings));
  return result;
}
