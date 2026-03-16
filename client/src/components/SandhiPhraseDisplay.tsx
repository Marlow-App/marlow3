import type { ToneChar } from "@/data/phrases";
import { applyToneSandhi, hasSandhiChanges, pinyinCharsToToneChars, type SandhiChar } from "@/lib/toneSandhi";
import { useMemo } from "react";

const TONE_COLORS: Record<number, string> = {
  1: "text-red-600 dark:text-red-400",
  2: "text-yellow-600 dark:text-yellow-400",
  3: "text-green-600 dark:text-green-400",
  4: "text-blue-600 dark:text-blue-400",
  0: "text-gray-500 dark:text-gray-400",
};

const TONE_PINYIN_COLORS: Record<number, string> = {
  1: "text-red-500 dark:text-red-400",
  2: "text-yellow-500 dark:text-yellow-400",
  3: "text-green-500 dark:text-green-400",
  4: "text-blue-500 dark:text-blue-400",
  0: "text-gray-400 dark:text-gray-500",
};

interface SandhiPhraseDisplayProps {
  characters?: ToneChar[];
  pinyinChars?: { char: string; py: string; tone: number }[];
  charSize?: string;
  pinyinSize?: string;
  showSandhiRow?: boolean;
}

function CharDisplay({
  char,
  tone,
  pinyin,
  charSize = "text-2xl",
  pinyinSize = "text-xs",
  changed = false,
}: {
  char: string;
  tone: number;
  pinyin: string;
  charSize?: string;
  pinyinSize?: string;
  changed?: boolean;
}) {
  const isPunctuation = !pinyin || /[，。！？、；：]/.test(char);
  return (
    <span className="inline-flex flex-col items-center mx-[1px]">
      {!isPunctuation && (
        <span className={`${pinyinSize} leading-tight font-medium ${TONE_PINYIN_COLORS[tone]}`}>
          {pinyin}
        </span>
      )}
      <span className={`${charSize} font-medium leading-tight ${isPunctuation ? "text-foreground/60" : TONE_COLORS[tone]}`}>
        {char}
      </span>
      {changed && !isPunctuation && (
        <span className="w-1 h-1 rounded-full bg-primary/60 mt-0.5" />
      )}
    </span>
  );
}

export function SandhiPhraseDisplay({
  characters,
  pinyinChars,
  charSize = "text-2xl",
  pinyinSize = "text-xs",
  showSandhiRow = true,
}: SandhiPhraseDisplayProps) {
  const toneChars: ToneChar[] = useMemo(() => {
    if (characters) return characters;
    if (pinyinChars) return pinyinCharsToToneChars(pinyinChars);
    return [];
  }, [characters, pinyinChars]);

  const sandhiResult: SandhiChar[] = useMemo(() => applyToneSandhi(toneChars), [toneChars]);
  const hasChanges = useMemo(() => hasSandhiChanges(toneChars), [toneChars]);

  return (
    <div className="space-y-3" data-testid="sandhi-phrase-display">
      <div>
        <div className="flex flex-wrap items-end gap-x-0.5 gap-y-1" data-testid="sandhi-original-row">
          {toneChars.map((tc, i) => (
            <CharDisplay
              key={i}
              char={tc.char}
              tone={tc.tone}
              pinyin={tc.pinyin}
              charSize={charSize}
              pinyinSize={pinyinSize}
            />
          ))}
        </div>
      </div>
      {showSandhiRow && hasChanges && (
        <div>
          <span className="text-xs text-muted-foreground font-medium mb-1 block" data-testid="sandhi-label">As spoken</span>
          <div className="flex flex-wrap items-end gap-x-0.5 gap-y-1" data-testid="sandhi-spoken-row">
            {sandhiResult.map((sc, i) => (
              <CharDisplay
                key={i}
                char={sc.char}
                tone={sc.tone}
                pinyin={sc.pinyin}
                charSize={charSize}
                pinyinSize={pinyinSize}
                changed={sc.changed}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
