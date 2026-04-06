import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { pinyin } from "pinyin-pro";
import { Star, RotateCcw, ExternalLink, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getScoreTextColor, getScoreBgColor } from "@/lib/scoreColor";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getNeutralPatches } from "@/lib/neutralTones";
import type { CharacterRating, PronunciationError } from "@shared/schema";

const TONE_COLORS: Record<number, string> = {
  1: "text-red-600 dark:text-red-400",
  2: "text-orange-500 dark:text-orange-400",
  3: "text-green-600 dark:text-green-400",
  4: "text-blue-500 dark:text-blue-400",
  0: "text-gray-400 dark:text-gray-500",
};

interface PinyinChar {
  char: string;
  py: string;
  tone: number;
}

function buildPinyinChars(text: string): PinyinChar[] {
  const chars = Array.from(text);
  const pinyinArr = pinyin(text, { toneType: "symbol", type: "array" });
  const toneArr = pinyin(text, { toneType: "num", type: "array" });
  const result: PinyinChar[] = [];
  let pIdx = 0;
  for (const ch of chars) {
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) {
      const toneStr = toneArr[pIdx] || "";
      const toneNum = parseInt(toneStr.slice(-1)) || 0;
      result.push({ char: ch, py: pinyinArr[pIdx] || "", tone: toneNum });
      pIdx++;
    } else {
      result.push({ char: ch, py: "", tone: 0 });
    }
  }
  const chineseEntries = result.filter(p => p.py !== "");
  const chineseText = chineseEntries.map(p => p.char).join("");
  const patches = getNeutralPatches(chineseText);
  patches.forEach((py, idx) => {
    if (chineseEntries[idx]) {
      chineseEntries[idx].py = py;
      chineseEntries[idx].tone = 0;
    }
  });
  return result.filter(p => p.py !== "");
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden flex-1 max-w-[72px]">
      <div
        className={`h-full rounded-full transition-all ${getScoreBgColor(score)}`}
        style={{ width: `${Math.max(2, score)}%` }}
      />
    </div>
  );
}

function FluencyDisplay({ score }: { score: number }) {
  const pct = score * 20;
  return (
    <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2 mt-2" data-testid="inline-fluency-display">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Fluency</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-4 h-4 ${s <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        <span className={`text-sm font-bold ${getScoreTextColor(pct)}`}>{pct}%</span>
      </div>
    </div>
  );
}

type PracticeItem = { id: number; errorId: string; character?: string | null };

function AIErrorRow({
  error,
  character,
  symbol,
  label,
  practiceList,
  addingErrorId,
  onAdd,
  testId,
}: {
  error: PronunciationError;
  character: string;
  symbol?: string;
  label?: string;
  practiceList: PracticeItem[];
  addingErrorId: string | null;
  onAdd: () => void;
  testId: string;
}) {
  const isInList = practiceList.some(i => i.errorId === error.id);
  const isAdding = addingErrorId === error.id;

  const labelColor =
    error.category === "tone"
      ? "text-blue-600 dark:text-blue-400"
      : error.category === "initial"
      ? "text-violet-600 dark:text-violet-400"
      : "text-orange-600 dark:text-orange-400";

  return (
    <div className="mt-1 ml-12 flex items-center gap-2 flex-wrap" data-testid={testId}>
      <span className={`text-xs ${labelColor} leading-snug`}>
        {label && <span className="font-semibold">{label}{symbol ? ` "${symbol}"` : ""} — </span>}
        {error.commonError}
      </span>
      {!isInList && (
        <button
          type="button"
          onClick={onAdd}
          disabled={isAdding}
          className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium disabled:opacity-50"
          data-testid={`${testId}-add-btn`}
        >
          {isAdding ? "Adding…" : "+ Practice"}
        </button>
      )}
      {isInList && (
        <span className="text-[11px] text-muted-foreground" data-testid={`${testId}-saved`}>✓ In practice list</span>
      )}
    </div>
  );
}

function AICharCard({
  cr,
  idx,
  charPy,
  errors,
  practiceList,
  addingErrorId,
  onAdd,
}: {
  cr: CharacterRating;
  idx: number;
  charPy: PinyinChar | null;
  errors: PronunciationError[];
  practiceList: PracticeItem[];
  addingErrorId: string | null;
  onAdd: (errorId: string, char: string) => void;
}) {
  const lookupError = (id?: string) => id ? errors.find(e => e.id === id) : undefined;

  const toneScore = cr.tone;
  const phoneScore = cr.phoneScoreRaw ?? Math.round((cr.initial + cr.final) / 2);
  const toneErr = lookupError(cr.toneError);
  const initErr = lookupError(cr.initialError);
  const finalErr = lookupError(cr.finalError);

  return (
    <div className="bg-muted/30 rounded-lg px-3 py-2" data-testid={`inline-char-card-${idx}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center w-10 shrink-0 pt-1" data-testid={`inline-char-display-${idx}`}>
          {charPy && (
            <span className={`text-sm font-medium leading-tight ${TONE_COLORS[charPy.tone]}`}>{charPy.py}</span>
          )}
          <span className="text-lg font-bold">{cr.character}</span>
        </div>
        <div className="flex-1 space-y-1.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 shrink-0">Tone</span>
              <ScoreBar score={toneScore} />
              <span className={`text-sm font-semibold tabular-nums min-w-[3ch] ${getScoreTextColor(toneScore)}`} data-testid={`inline-tone-score-${idx}`}>
                {toneScore}%
              </span>
              {(cr.toneScoreRaw ?? 90) < 90 && cr.expectedTone !== undefined && (
                <span className="text-xs text-muted-foreground">target T{cr.expectedTone}</span>
              )}
            </div>
            {toneErr && (
              <AIErrorRow
                error={toneErr}
                character={cr.character}
                practiceList={practiceList}
                addingErrorId={addingErrorId}
                onAdd={() => onAdd(toneErr.id, cr.character)}
                testId={`inline-tone-error-${idx}`}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 shrink-0">Sound</span>
              <ScoreBar score={phoneScore} />
              <span className={`text-sm font-semibold tabular-nums min-w-[3ch] ${getScoreTextColor(phoneScore)}`} data-testid={`inline-phone-score-${idx}`}>
                {phoneScore}%
              </span>
            </div>
            {initErr && (
              <AIErrorRow
                error={initErr}
                character={cr.character}
                symbol={cr.initialSymbol}
                label="Initial"
                practiceList={practiceList}
                addingErrorId={addingErrorId}
                onAdd={() => onAdd(initErr.id, cr.character)}
                testId={`inline-initial-error-${idx}`}
              />
            )}
            {finalErr && (
              <AIErrorRow
                error={finalErr}
                character={cr.character}
                symbol={cr.finalSymbol}
                label="Final"
                practiceList={practiceList}
                addingErrorId={addingErrorId}
                onAdd={() => onAdd(finalErr.id, cr.character)}
                testId={`inline-final-error-${idx}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecordingFeedback({
  recordingId,
  sentenceText,
  onPracticeAgain,
}: {
  recordingId: number;
  sentenceText: string;
  onPracticeAgain: () => void;
}) {
  const { toast } = useToast();
  const [timedOut, setTimedOut] = useState(false);
  const timedOutRef = useRef(false);
  const [addingErrorId, setAddingErrorId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      timedOutRef.current = true;
      setTimedOut(true);
    }, 10_000);
    return () => clearTimeout(timer);
  }, []);

  const { data: recording, isLoading } = useQuery({
    queryKey: [api.recordings.get.path, recordingId],
    queryFn: async () => {
      const url = buildUrl(api.recordings.get.path, { id: recordingId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recording");
      return res.json();
    },
    refetchInterval: (query: any) => {
      const data = query.state.data;
      if (data?.status === "reviewed") return false;
      if (timedOutRef.current) return false;
      return 2000;
    },
    staleTime: 0,
  });

  const { data: errors = [] } = useQuery<PronunciationError[]>({
    queryKey: ["/api/errors"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: practiceList = [] } = useQuery<PracticeItem[]>({
    queryKey: ["/api/practice-list"],
  });

  const pinyinChars = useMemo(() => buildPinyinChars(sentenceText), [sentenceText]);

  const aiFeedback = recording?.feedback?.find((f: any) => f.isAiFeedback);
  const isPending = !aiFeedback && recording?.status !== "reviewed";

  const addToPractice = async (errorId: string, char: string) => {
    if (addingErrorId) return;
    setAddingErrorId(errorId);
    try {
      await apiRequest("POST", "/api/practice-list", { errorId, character: char, recordingId });
      queryClient.invalidateQueries({ queryKey: ["/api/practice-list"] });
      toast({ title: "Added to Practice List", description: "Find it under Practice List in the sidebar." });
    } catch {
      toast({ title: "Error", description: "Failed to add to Practice List.", variant: "destructive" });
    } finally {
      setAddingErrorId(null);
    }
  };

  if (isLoading || (isPending && !timedOut)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3" data-testid="feedback-loading">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-base font-medium">Analysing your pronunciation...</p>
        </div>
        <p className="text-sm text-muted-foreground">This usually takes a few seconds</p>
      </div>
    );
  }

  if (timedOut && !aiFeedback) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center" data-testid="feedback-timeout">
        <p className="text-base font-medium">Feedback is still processing</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          It's taking longer than expected. Your recording has been saved — check your recordings later to see the feedback.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button variant="outline" onClick={onPracticeAgain} className="gap-2" data-testid="practice-again-timeout-btn">
            <RotateCcw className="w-4 h-4" />
            Practice again
          </Button>
          <Link href={`/recordings/${recordingId}`}>
            <Button className="gap-2" data-testid="view-details-timeout-btn">
              View details
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const ratings = aiFeedback?.characterRatings as CharacterRating[] | undefined;
  const overallScore = aiFeedback?.overallScore as number | null | undefined;
  const fluencyScore = aiFeedback?.fluencyScore as number | null | undefined;

  return (
    <div className="space-y-4" data-testid="recording-feedback-panel">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">AI Review</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">Auto</Badge>
          </div>
          {overallScore !== null && overallScore !== undefined && (
            <span className={`text-2xl font-bold ${getScoreTextColor(overallScore)}`} data-testid="inline-overall-score">
              {overallScore}%
            </span>
          )}
        </div>
      </div>

      {/* Character ratings */}
      {ratings && ratings.length > 0 && (
        <div className="space-y-2">
          {ratings.map((cr, idx) => (
            <AICharCard
              key={idx}
              cr={cr}
              idx={idx}
              charPy={pinyinChars[idx] ?? null}
              errors={errors}
              practiceList={practiceList}
              addingErrorId={addingErrorId}
              onAdd={addToPractice}
            />
          ))}
        </div>
      )}

      {/* Fluency */}
      {fluencyScore != null && <FluencyDisplay score={fluencyScore} />}

      {/* Actions */}
      <div className="flex gap-3 pt-2 flex-wrap">
        <Button
          onClick={onPracticeAgain}
          variant="outline"
          className="gap-2 flex-1 sm:flex-none"
          data-testid="practice-again-btn"
        >
          <RotateCcw className="w-4 h-4" />
          Practice again
        </Button>
        <Link href={`/recordings/${recordingId}`}>
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
            data-testid="view-full-details-btn"
          >
            View full details
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
