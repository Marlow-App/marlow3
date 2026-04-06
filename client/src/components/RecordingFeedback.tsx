import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, ExternalLink, Loader2, Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getScoreTextColor } from "@/lib/scoreColor";
import { api, buildUrl } from "@shared/routes";
import { useAllErrors, AICharacterRatingDisplay, getCharPinyin, PinyinChar } from "@/components/AIFeedbackDisplay";
import type { CharacterRating } from "@shared/schema";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AiFeedbackItem {
  id: number;
  isAiFeedback: boolean;
  overallScore: number | null;
  fluencyScore: number | null;
  characterRatings: CharacterRating[] | null;
}

interface RecordingResponse {
  id: number;
  status: "pending" | "reviewed";
  sentenceText: string;
  feedback: AiFeedbackItem[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function RecordingFeedback({
  recordingId,
  sentenceText,
  onPracticeAgain,
}: {
  recordingId: number;
  sentenceText: string;
  onPracticeAgain: () => void;
}) {
  const [timedOut, setTimedOut] = useState(false);
  const timedOutRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      timedOutRef.current = true;
      setTimedOut(true);
    }, 10_000);
    return () => clearTimeout(timer);
  }, []);

  // Controlled polling: poll every 2s until feedback arrives or timeout
  const [pollEnabled, setPollEnabled] = useState(true);

  const { data: recording, isLoading, refetch, isFetching } = useQuery<RecordingResponse>({
    queryKey: [api.recordings.get.path, recordingId],
    queryFn: async () => {
      const url = buildUrl(api.recordings.get.path, { id: recordingId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recording");
      return res.json() as Promise<RecordingResponse>;
    },
    refetchInterval: pollEnabled && !timedOut ? 2000 : false,
    staleTime: 0,
  });

  // Stop polling once AI feedback arrives
  useEffect(() => {
    const hasAI = recording?.feedback?.some(f => f.isAiFeedback);
    if (hasAI) {
      setPollEnabled(false);
    }
  }, [recording]);

  const { data: errors = [] } = useAllErrors();

  const pinyinData = useMemo(
    (): PinyinChar[] => getCharPinyin(sentenceText).filter(p => p.py !== ""),
    [sentenceText],
  );

  const aiFeedback = recording?.feedback?.find(f => f.isAiFeedback);
  const isPending = !aiFeedback && recording?.status !== "reviewed";

  // ── Loading / pending state ─────────────────────────────────────────────

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

  // ── Timeout / no feedback state ─────────────────────────────────────────

  if (timedOut && !aiFeedback) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center" data-testid="feedback-timeout">
        <p className="text-base font-medium">Feedback is still processing</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          It's taking longer than expected. You can retry or check your recordings later.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Button
            variant="outline"
            onClick={() => {
              timedOutRef.current = false;
              setTimedOut(false);
              setPollEnabled(true);
              refetch();
            }}
            disabled={isFetching}
            className="gap-2"
            data-testid="retry-feedback-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Checking…" : "Retry"}
          </Button>
          <Button variant="outline" onClick={onPracticeAgain} className="gap-2" data-testid="practice-again-timeout-btn">
            <RotateCcw className="w-4 h-4" />
            Practice again
          </Button>
          <Link href={`/recordings/${recordingId}`}>
            <Button variant="ghost" className="gap-2 text-muted-foreground" data-testid="view-details-timeout-btn">
              View details
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Feedback ready state ────────────────────────────────────────────────

  const ratings = aiFeedback?.characterRatings ?? [];
  const overallScore = aiFeedback?.overallScore ?? null;

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
          {overallScore !== null && (
            <span
              className={`text-2xl font-bold ${getScoreTextColor(overallScore)}`}
              data-testid="inline-overall-score"
            >
              {overallScore}%
            </span>
          )}
        </div>
      </div>

      {/* Character ratings (shared component) */}
      {ratings.length > 0 && (
        <AICharacterRatingDisplay
          ratings={ratings}
          pinyinData={pinyinData}
          fluencyScore={aiFeedback?.fluencyScore}
          errors={errors}
          recordingId={recordingId}
        />
      )}

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
