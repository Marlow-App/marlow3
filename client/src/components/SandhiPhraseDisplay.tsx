import { useState, useMemo } from "react";
import type { ToneChar } from "@/data/phrases";
import {
  applyToneSandhi,
  detectSandhiRules,
  pinyinCharsToToneChars,
  type SandhiChar,
} from "@/lib/toneSandhi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";

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

function SandhiExplainerPopover({ t3, bu, yi }: { t3: boolean; bu: boolean; yi: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium hover:text-foreground transition-colors leading-none"
          data-testid="sandhi-label"
          aria-label="Learn why tones change"
        >
          As spoken
          <Info className="w-3 h-3 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="max-w-xs text-sm space-y-3 p-4" data-testid="sandhi-explainer-popover">
        <p className="font-semibold text-foreground text-sm">Why do some tones change?</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          In natural speech, certain tones shift depending on what comes before or after them. This is called <em>tone sandhi</em>.
        </p>
        {t3 && !bu && !yi && (
          <div className="space-y-0.5">
            <p className="font-medium text-foreground text-xs">Third-tone sandhi</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              When two third-tone (T3) syllables appear in a row, the first changes to second tone (T2) before it is spoken.
              <br />
              <span className="font-mono text-foreground">T3 + T3 → T2 + T3</span>
              <br />
              e.g. 你好 (nǐ hǎo) is spoken as <span className="font-mono text-foreground">níhǎo</span>
            </p>
          </div>
        )}
        {bu && (
          <div className="space-y-0.5">
            <p className="font-medium text-foreground text-xs">不 (bù) sandhi</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              不 is normally fourth tone (bù), but changes to second tone (bú) when the following syllable is also fourth tone.
              <br />
              <span className="font-mono text-foreground">不 + T4 → bú + T4</span>
            </p>
          </div>
        )}
        {yi && (
          <div className="space-y-0.5">
            <p className="font-medium text-foreground text-xs">一 (yī) sandhi</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              一 is normally first tone (yī), but its tone shifts based on what follows:
              <br />
              <span className="font-mono text-foreground">一 + T4 → yí + T4</span>
              <br />
              <span className="font-mono text-foreground">一 + T1/T2/T3 → yì + T1/T2/T3</span>
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
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
  const hasChanges = useMemo(() => sandhiResult.some(c => c.changed), [sandhiResult]);
  const rules = useMemo(() => detectSandhiRules(toneChars), [toneChars]);

  if (!showSandhiRow || !hasChanges) {
    return (
      <div data-testid="sandhi-phrase-display">
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
    );
  }

  return (
    <div className="flex items-end gap-3" data-testid="sandhi-phrase-display">
      <div className="flex-shrink-0 flex flex-col">
        <span
          className="h-4 flex items-center text-[10px] uppercase tracking-wider text-muted-foreground font-medium"
          data-testid="sandhi-original-label"
        >
          Original
        </span>
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

      <div className="w-px bg-border flex-shrink-0 self-stretch" />

      <div className="flex-shrink-0 flex flex-col">
        <div className="h-4 flex items-center">
          <SandhiExplainerPopover t3={rules.t3} bu={rules.bu} yi={rules.yi} />
        </div>
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
    </div>
  );
}
