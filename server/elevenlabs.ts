import { createHash } from "crypto";
import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
const CHINESE_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku";
const MODEL_ID = "eleven_multilingual_v2";

function parseObjectPath(fullPath: string) {
  const parts = fullPath.replace(/^\//, "").split("/");
  const bucketName = parts[0];
  const objectName = parts.slice(1).join("/");
  return { bucketName, objectName };
}

function textToHash(text: string): string {
  return createHash("md5").update(text).digest("hex").slice(0, 12);
}

function getPhraseAudioPath(hash: string): string {
  const publicPaths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map(p => p.trim()).filter(Boolean);
  if (publicPaths.length === 0) throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
  return `${publicPaths[0]}/phrase-audio/${hash}.mp3`;
}

export async function generatePhraseAudio(text: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

  const hash = textToHash(text);
  const fullPath = getPhraseAudioPath(hash);
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  const [exists] = await file.exists();
  if (exists) {
    return `/api/phrase-audio/${hash}`;
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${CHINESE_VOICE_ID}`, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      language_code: "zh",
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.85,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  await file.save(audioBuffer, {
    metadata: {
      contentType: "audio/mpeg",
    },
  });

  return `/api/phrase-audio/${hash}`;
}

export async function getPhraseAudioFile(hash: string) {
  const fullPath = getPhraseAudioPath(hash);
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  const [exists] = await file.exists();
  if (!exists) return null;

  return file;
}
