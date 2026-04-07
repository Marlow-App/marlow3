import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { pinyin } from "pinyin-pro";
import { Star, Volume2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getScoreTextColor, getScoreBgColor } from "@/lib/scoreColor";
import { getNeutralPatches } from "@/lib/neutralTones";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/use-recordings";
import type { CharacterRating, PronunciationError, SpeechSuperScores } from "@shared/schema";
import { UpsellModal } from "@/components/UpsellModal";
import { useSubscription } from "@/hooks/use-subscription";
import { FREE_ERROR_POPUPS_PER_DAY } from "@shared/credits";

function getPopupCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  const key = `marlow_popups_${today}`;
  return parseInt(localStorage.getItem(key) ?? "0", 10);
}

function incrementPopupCount(): void {
  const today = new Date().toISOString().slice(0, 10);
  const key = `marlow_popups_${today}`;
  localStorage.setItem(key, String(getPopupCount() + 1));
}

// ─── Shared types ──────────────────────────────────────────────────────────

export const TONE_COLORS: Record<number, string> = {
  1: "text-red-600 dark:text-red-400",
  2: "text-orange-500 dark:text-orange-400",
  3: "text-green-600 dark:text-green-400",
  4: "text-blue-500 dark:text-blue-400",
  0: "text-gray-400 dark:text-gray-500",
};

export interface PinyinChar {
  char: string;
  py: string;
  tone: number;
}

export type PracticeListItem = { id: number; errorId: string; character?: string | null };

// ─── Shared helpers ────────────────────────────────────────────────────────

export function getCharPinyin(text: string): PinyinChar[] {
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
  return result;
}

export function useAllErrors() {
  return useQuery<PronunciationError[]>({ queryKey: ["/api/errors"], retry: 3, staleTime: 5 * 60 * 1000 });
}

// ─── ScoreBar ──────────────────────────────────────────────────────────────

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden flex-1 max-w-[72px]">
      <div
        className={`h-full rounded-full transition-all ${getScoreBgColor(score)}`}
        style={{ width: `${Math.max(2, score)}%` }}
      />
    </div>
  );
}

// ─── FluencyDisplay ────────────────────────────────────────────────────────

export function FluencyDisplay({ score }: { score: number }) {
  const pct = score * 20;
  const color = getScoreTextColor(pct);
  return (
    <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2 mt-2" data-testid="fluency-display">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Fluency</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-4 h-4 ${s <= score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        <span className={`text-sm font-bold ${color}`}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── SpeechSuperScoreChips ─────────────────────────────────────────────────

const SS_SCORE_LABELS: { key: keyof SpeechSuperScores; label: string }[] = [
  { key: "tone",          label: "Tone" },
  { key: "pronunciation", label: "Pronunciation" },
  { key: "rhythm",        label: "Rhythm" },
  { key: "speed",         label: "Speed" },
];

export function SpeechSuperScoreChips({ scores }: { scores: SpeechSuperScores }) {
  const items = SS_SCORE_LABELS.filter(({ key }) => scores[key] != null);
  if (items.length === 0) return null;
  return (
    <div className="mt-2 bg-muted/30 rounded-lg px-3 py-2.5" data-testid="speechsuper-score-chips">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Sentence-level scores
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {items.map(({ key, label }) => {
          const val = scores[key] as number;
          return (
            <div key={key} className="flex items-center gap-2" data-testid={`ss-score-${key}`}>
              <span className="text-xs text-muted-foreground w-[72px] shrink-0">{label}</span>
              <ScoreBar score={val} />
              <span className={`text-xs font-semibold tabular-nums min-w-[3ch] ${getScoreTextColor(val)}`}>
                {val}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ErrorDetailDialog ─────────────────────────────────────────────────────

export function ErrorDetailDialog({
  error,
  open,
  onClose,
  character,
  recordingId: recordingIdProp,
}: {
  error: PronunciationError | null;
  open: boolean;
  onClose: () => void;
  character?: string;
  recordingId?: number;
}) {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const recordingId = recordingIdProp ?? (params.id ? parseInt(params.id) : undefined);
  const { data: recordingData } = useRecording(recordingId ?? 0);
  const sentenceText = recordingData?.sentenceText;

  const { data: practiceList = [] } = useQuery<PracticeListItem[]>({
    queryKey: ["/api/practice-list"],
  });

  const savedItem = error ? practiceList.find(i => i.errorId === error.id) : undefined;
  const isInList = !!savedItem;

  const addToList = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/practice-list", {
        errorId: error!.id,
        character: character || undefined,
        recordingId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-list"] });
      toast({ title: "Added to Practice List", description: "Find it under Practice List in the sidebar." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add to Practice List.", variant: "destructive" });
    },
  });

  const removeFromList = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/practice-list/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-list"] });
      toast({ title: "Removed from Practice List" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove from Practice List.", variant: "destructive" });
    },
  });

  if (!error) return null;

  const categoryLabel = error.category === "tone" ? "Tone" : error.category === "initial" ? "Initial" : "Final";
  const categoryColor =
    error.category === "tone"
      ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
      : error.category === "initial"
      ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
      : "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300";

  const speakWord = (word: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = "zh-CN";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  };

  const sectionLabel = "text-[12px] font-black uppercase tracking-widest text-primary mb-1.5";
  const sectionBody = "text-base text-foreground/80 whitespace-pre-wrap leading-relaxed";

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="error-detail-dialog">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${categoryColor}`}>{categoryLabel}</span>
            <span className="text-xs font-mono text-muted-foreground">{error.id}</span>
          </div>
          <DialogTitle className="text-xl leading-snug font-bold">{error.commonError}</DialogTitle>
        </DialogHeader>

        {sentenceText && (
          <div className="bg-muted/40 rounded-xl px-4 py-3 mt-2">
            <p className={sectionLabel}>From your recording</p>
            <div className="flex flex-wrap gap-x-2 gap-y-1 items-end">
              {Array.from(sentenceText).map((ch, i) => {
                const isHighlighted = !!character && ch === character;
                const isChinese = /[\u4e00-\u9fff]/.test(ch);
                const py = isChinese ? pinyin(ch, { toneType: "symbol", type: "string" }) : "";
                return (
                  <div key={i} className="flex flex-col items-center min-w-[1.5rem]">
                    <span className="text-[11px] text-muted-foreground leading-none mb-0.5">{py}</span>
                    <span className={`text-2xl font-bold leading-none px-0.5 rounded ${
                      isHighlighted
                        ? "text-primary bg-primary/15 ring-1 ring-primary/30"
                        : "text-foreground"
                    }`}>{ch}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-5 mt-3">
          {error.simpleExplanation && (
            <div>
              <p className={sectionLabel}>What's happening</p>
              <p className={sectionBody}>{error.simpleExplanation}</p>
            </div>
          )}

          {error.howToFix && (
            <div>
              <p className={sectionLabel}>How to fix it</p>
              <p className={sectionBody}>{error.howToFix}</p>
            </div>
          )}

          {error.practiceWords && error.practiceWords.length > 0 && (
            <div>
              <p className={sectionLabel}>Practice words</p>
              <div className="flex flex-wrap gap-3">
                {error.practiceWords.map((word, i) => {
                  const py = pinyin(word, { toneType: "symbol", type: "string" });
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5 bg-muted/30 rounded-lg px-3 py-2 min-w-[56px]">
                      <span className="text-xs text-muted-foreground font-medium tracking-wide">{py}</span>
                      <span className="text-xl font-bold leading-tight">{word}</span>
                      <button
                        type="button"
                        onClick={() => speakWord(word)}
                        className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`Pronounce ${word}`}
                        data-testid={`speak-word-${i}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-5">
          {isInList && savedItem ? (
            <Button
              variant="outline"
              className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => removeFromList.mutate(savedItem.id)}
              disabled={removeFromList.isPending}
              data-testid="remove-from-practice-list-btn"
            >
              <BookOpen className="w-4 h-4" />
              {removeFromList.isPending ? "Removing…" : "Remove from Practice List"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => addToList.mutate()}
              disabled={addToList.isPending}
              data-testid="add-to-practice-list-btn"
            >
              <BookOpen className="w-4 h-4" />
              {addToList.isPending ? "Saving…" : "Add to Practice List"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AIErrorRow ────────────────────────────────────────────────────────────

export function AIErrorRow({
  error,
  character,
  symbol,
  label,
  practiceList,
  addingErrorId,
  onOpen,
  onAdd,
  testId,
}: {
  error: PronunciationError;
  character: string;
  symbol?: string;
  label?: string;
  practiceList: PracticeListItem[];
  addingErrorId: string | null;
  onOpen: () => void;
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
      <button
        type="button"
        onClick={onOpen}
        className={`text-xs ${labelColor} hover:underline text-left leading-snug`}
        data-testid={`${testId}-detail-btn`}
      >
        {label && <span className="font-semibold">{label}{symbol ? ` "${symbol}"` : ""} — </span>}
        {error.commonError}
      </button>
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
        <span className="text-[11px] text-muted-foreground" data-testid={`${testId}-saved-badge`}>✓ In practice list</span>
      )}
    </div>
  );
}

// ─── AICharacterRatingDisplay ──────────────────────────────────────────────

export function AICharacterRatingDisplay({ ratings, pinyinData, fluencyScore, speechSuperScores, errors = [], recordingId }: {
  ratings: CharacterRating[];
  pinyinData?: PinyinChar[];
  fluencyScore?: number | null;
  speechSuperScores?: SpeechSuperScores;
  errors?: PronunciationError[];
  recordingId?: number;
}) {
  const { toast } = useToast();
  const { data: subscription } = useSubscription();
  const isPro = subscription?.tier === "pro" && (subscription?.status === "active" || !!subscription?.isUnlimited);
  const [openError, setOpenError] = useState<PronunciationError | null>(null);
  const [openErrorChar, setOpenErrorChar] = useState<string | undefined>(undefined);
  const [addingErrorId, setAddingErrorId] = useState<string | null>(null);
  const [upsellReason, setUpsellReason] = useState<"popups" | "practice_list" | undefined>(undefined);
  const chinesePinyinOnly = pinyinData?.filter(p => p.py) || [];

  const { data: practiceList = [] } = useQuery<PracticeListItem[]>({ queryKey: ["/api/practice-list"] });

  const lookupError = (errorId: string | undefined) =>
    errorId ? errors.find(e => e.id === errorId) : undefined;

  const openErrorDialog = (errorId: string | undefined, char: string) => {
    const err = lookupError(errorId);
    if (!err) return;
    if (!isPro) {
      const count = getPopupCount();
      if (count >= FREE_ERROR_POPUPS_PER_DAY) {
        setUpsellReason("popups");
        return;
      }
      incrementPopupCount();
    }
    setOpenError(err);
    setOpenErrorChar(char);
  };

  const addToPractice = async (errorId: string, char: string) => {
    if (addingErrorId) return;
    setAddingErrorId(errorId);
    try {
      const res = await fetch("/api/practice-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ errorId, character: char, recordingId }),
      });
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "PRACTICE_LIST_LIMIT") {
          setUpsellReason("practice_list");
          return;
        }
        throw new Error(data.message || "Not authorized.");
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add to Practice List.");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/practice-list"] });
      toast({ title: "Added to Practice List", description: "Find it under Practice List in the sidebar." });
    } catch (err: any) {
      if (err.message !== "PRACTICE_LIST_LIMIT") {
        toast({ title: "Error", description: err.message || "Failed to add to Practice List.", variant: "destructive" });
      }
    } finally {
      setAddingErrorId(null);
    }
  };

  return (
    <div className="space-y-2 mt-2" data-testid="ai-character-ratings-display">
      <div className="grid gap-2">
        {ratings.map((cr, idx) => {
          const charPy = chinesePinyinOnly[idx] || null;
          const toneScore = cr.toneScoreRaw ?? cr.tone;
          const phoneScore = cr.phoneScoreRaw ?? Math.round((cr.initial + cr.final) / 2);
          const toneErr = lookupError(cr.toneError);
          const initErr = lookupError(cr.initialError);
          const finalErr = lookupError(cr.finalError);
          return (
            <div key={idx} className="bg-muted/30 rounded-lg px-3 py-2" data-testid={`ai-char-card-${idx}`}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center w-10 shrink-0 pt-1" data-testid={`char-display-${idx}`}>
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
                      <span className={`text-sm font-semibold tabular-nums min-w-[3ch] ${getScoreTextColor(toneScore)}`} data-testid={`ai-tone-score-${idx}`}>
                        {toneScore}%
                      </span>
                      {(cr.toneScoreRaw ?? cr.tone) < 75 && cr.expectedTone !== undefined && (
                        <span className="text-xs text-muted-foreground" data-testid={`ai-tone-expected-${idx}`}>
                          target T{cr.expectedTone}
                        </span>
                      )}
                    </div>
                    {toneErr && (
                      <AIErrorRow
                        error={toneErr}
                        character={cr.character}
                        practiceList={practiceList}
                        addingErrorId={addingErrorId}
                        onOpen={() => openErrorDialog(cr.toneError, cr.character)}
                        onAdd={() => addToPractice(toneErr.id, cr.character)}
                        testId={`ai-tone-error-${idx}`}
                      />
                    )}
                  </div>
                  {cr.finalScoreRaw !== undefined ? (
                    <>
                      {cr.hasInitial && (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-10 shrink-0">Initial</span>
                            <ScoreBar score={cr.initialScoreRaw ?? cr.initial} />
                            <span className={`text-sm font-semibold tabular-nums min-w-[3ch] ${getScoreTextColor(cr.initialScoreRaw ?? cr.initial)}`} data-testid={`ai-initial-score-${idx}`}>
                              {cr.initialScoreRaw ?? cr.initial}%
                            </span>
                            {cr.initialSymbol && <span className="text-xs text-muted-foreground font-mono">{cr.initialSymbol}-</span>}
                          </div>
                          {initErr && (
                            <AIErrorRow
                              error={initErr}
                              character={cr.character}
                              symbol={cr.initialSymbol}
                              label="Initial"
                              practiceList={practiceList}
                              addingErrorId={addingErrorId}
                              onOpen={() => openErrorDialog(cr.initialError, cr.character)}
                              onAdd={() => addToPractice(initErr.id, cr.character)}
                              testId={`ai-initial-error-${idx}`}
                            />
                          )}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-10 shrink-0">Final</span>
                          <ScoreBar score={cr.finalScoreRaw} />
                          <span className={`text-sm font-semibold tabular-nums min-w-[3ch] ${getScoreTextColor(cr.finalScoreRaw)}`} data-testid={`ai-final-score-${idx}`}>
                            {cr.finalScoreRaw}%
                          </span>
                          {cr.finalSymbol && <span className="text-xs text-muted-foreground font-mono">-{cr.finalSymbol}</span>}
                        </div>
                        {finalErr && (
                          <AIErrorRow
                            error={finalErr}
                            character={cr.character}
                            symbol={cr.finalSymbol}
                            label="Final"
                            practiceList={practiceList}
                            addingErrorId={addingErrorId}
                            onOpen={() => openErrorDialog(cr.finalError, cr.character)}
                            onAdd={() => addToPractice(finalErr.id, cr.character)}
                            testId={`ai-final-error-${idx}`}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-10 shrink-0">Sound</span>
                        <ScoreBar score={phoneScore} />
                        <span className={`text-sm font-semibold tabular-nums min-w-[3ch] ${getScoreTextColor(phoneScore)}`} data-testid={`ai-phone-score-${idx}`}>
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
                          onOpen={() => openErrorDialog(cr.initialError, cr.character)}
                          onAdd={() => addToPractice(initErr.id, cr.character)}
                          testId={`ai-initial-error-${idx}`}
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
                          onOpen={() => openErrorDialog(cr.finalError, cr.character)}
                          onAdd={() => addToPractice(finalErr.id, cr.character)}
                          testId={`ai-final-error-${idx}`}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {fluencyScore != null && <FluencyDisplay score={fluencyScore} />}
      {speechSuperScores && <SpeechSuperScoreChips scores={speechSuperScores} />}
      <ErrorDetailDialog
        error={openError}
        open={!!openError}
        onClose={() => setOpenError(null)}
        character={openErrorChar}
        recordingId={recordingId}
      />
      <UpsellModal
        open={!!upsellReason}
        onClose={() => setUpsellReason(undefined)}
        reason={upsellReason}
      />
    </div>
  );
}
