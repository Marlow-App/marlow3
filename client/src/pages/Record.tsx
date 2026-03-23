import { useState, useCallback, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useUpload } from "@/hooks/use-upload";
import { useCreateRecording } from "@/hooks/use-recordings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation, Link } from "wouter";
import { ChevronLeft, Info, Volume2, X, Loader2, CircleDollarSign } from "lucide-react";
import { getPhrasesForLevel, phraseToText, PHRASE_BANK, type Phrase } from "@/data/phrases";
import { apiRequest } from "@/lib/queryClient";
import { SandhiPhraseDisplay } from "@/components/SandhiPhraseDisplay";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { countChineseChars, MAX_CHARS, REFUND_THRESHOLD } from "@shared/credits";


function usePhraseAudio() {
  const [loadingPhrase, setLoadingPhrase] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());

  const playPhrase = useCallback(async (text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const cached = audioCache.current.get(text);
    if (cached) {
      const audio = new Audio(cached);
      audioRef.current = audio;
      audio.play().catch(console.error);
      return;
    }

    setLoadingPhrase(text);
    try {
      const res = await apiRequest("POST", "/api/phrase-audio/generate", { text });
      const data = await res.json();
      audioCache.current.set(text, data.audioUrl);
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      audio.play().catch(console.error);
    } catch (err) {
      console.error("Failed to generate phrase audio:", err);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } finally {
      setLoadingPhrase(null);
    }
  }, []);

  return { playPhrase, loadingPhrase };
}

function CompactPhraseChip({ phrase, onSelect, isSelected, onPlay, isLoading }: { phrase: Phrase; onSelect: (phrase: Phrase) => void; isSelected: boolean; onPlay: (text: string) => void; isLoading: boolean }) {
  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay(phraseToText(phrase));
  }, [phrase, onPlay]);

  return (
    <div
      onClick={() => onSelect(phrase)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(phrase); }}
      className={`shrink-0 text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-200 min-w-[160px] cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
      }`}
      data-testid={`phrase-card-${phraseToText(phrase).slice(0, 4)}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="whitespace-nowrap">
            <SandhiPhraseDisplay characters={phrase.characters} charSize="text-lg" pinyinSize="text-sm" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">{phrase.english}</p>
        </div>
        <button
          onClick={handlePlay}
          className="shrink-0 p-1 rounded-full hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
          title="Listen"
          data-testid="phrase-speak-btn"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
      style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
    >
      {children}
    </div>
  );
}

export default function RecordPage() {
  const [text, setText] = useState("");
  const { uploadFile, isUploading } = useUpload();
  const createRecording = useCreateRecording();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase | null>(null);
  const { playPhrase, loadingPhrase } = usePhraseAudio();
  const { user } = useAuth();
  const userLevel = user?.chineseLevel || "Beginner";

  const [rerecordOf, setRerecordOf] = useState<number | null>(null);
  const [redoType, setRedoType] = useState<"free" | "discount" | null>(null);

  const { data: creditData } = useQuery<{ creditBalance: number; freeCreditsBalance: number; isUnlimited: boolean }>({
    queryKey: ['/api/credits/balance'],
  });

  const dailyPhrases = getPhrasesForLevel(userLevel, 10);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phraseParam = params.get("phrase");
    const rerecordOfParam = params.get("rerecordOf");
    const sentenceTextParam = params.get("sentenceText");
    const redoParam = params.get("redo");

    if (rerecordOfParam && sentenceTextParam) {
      const id = parseInt(rerecordOfParam);
      if (!isNaN(id)) {
        setRerecordOf(id);
        setRedoType(redoParam === "free" ? "free" : redoParam === "discount" ? "discount" : null);
        setText(sentenceTextParam);
        return;
      }
    }

    if (phraseParam) {
      const matchedPhrase = PHRASE_BANK.find(p => phraseToText(p) === phraseParam);
      if (matchedPhrase) {
        setSelectedPhrase(matchedPhrase);
        setText(phraseParam);
      } else {
        setText(phraseParam);
      }
    }
  }, []);

  const rows = [
    dailyPhrases.slice(0, 4),
    dailyPhrases.slice(4, 7),
    dailyPhrases.slice(7, 10),
  ];

  const handleSelectPhrase = (phrase: Phrase) => {
    const fullText = phraseToText(phrase);
    setText(fullText);
    setSelectedPhrase(phrase);
  };

  const handleClearPhrase = () => {
    setSelectedPhrase(null);
    setText("");
  };

  const activeText = rerecordOf ? text : (selectedPhrase ? phraseToText(selectedPhrase) : text);
  const charCost = countChineseChars(activeText);
  const discountedCost = rerecordOf
    ? (redoType === "free" ? 0 : Math.ceil(charCost * 0.7))
    : charCost;
  const balance = creditData?.creditBalance ?? 0;
  const isUnlimited = creditData?.isUnlimited ?? false;
  const canAfford = isUnlimited || balance >= discountedCost;
  const tooLong = !isUnlimited && charCost > MAX_CHARS;

  const handleRecordingComplete = async (file: File) => {
    if (!activeText.trim()) {
      toast({
        title: "Sentence Required",
        description: "Please enter or select a sentence before recording.",
        variant: "destructive",
      });
      return;
    }

    if (tooLong) {
      toast({
        title: "Too many characters",
        description: `Maximum ${MAX_CHARS} Chinese characters per recording.`,
        variant: "destructive",
      });
      return;
    }

    if (!canAfford) {
      toast({
        title: "Not enough credits",
        description: `This recording costs ${discountedCost} credit${discountedCost > 1 ? "s" : ""} but you only have ${balance}. Buy more credits in your profile.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const uploadRes = await uploadFile(file);
      if (!uploadRes) throw new Error("Upload failed");

      await createRecording.mutateAsync({
        audioUrl: uploadRes.objectPath,
        sentenceText: activeText,
        ...(rerecordOf ? { rerecordOf } : {}),
      });

      toast({
        title: "Success!",
        description: "Your recording has been submitted for review.",
      });

      setLocation("/");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to submit recording. Please try again.";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-3 animate-in">
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            <button onClick={() => window.history.back()} className="p-1 -ml-1 rounded-md hover:bg-muted transition-colors" data-testid="back-btn">
              <ChevronLeft className="w-9 h-9 text-foreground" strokeWidth={3} />
            </button>
            <h1 className="text-3xl font-bold font-display">{rerecordOf ? "Re-record" : "New Recording"}</h1>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Link href="/profile?highlight=chineseLevel">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-base font-semibold px-5"
                data-testid="level-btn"
              >
                {userLevel} ✎
              </Button>
            </Link>

            {/* Credit balance pill */}
            <Link href="/profile?tab=credits">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer" data-testid="credit-balance-pill">
                <CircleDollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground" data-testid="credit-balance-count">
                  {isUnlimited ? "∞" : balance}
                </span>
                <span className="text-xs text-muted-foreground">credits</span>
              </div>
            </Link>
          </div>
        </div>

        {rerecordOf && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            redoType === "free"
              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              : "bg-primary/5 border-primary/20 text-primary"
          }`} data-testid="rerecord-banner">
            <X className="w-4 h-4 shrink-0 opacity-0 pointer-events-none" aria-hidden />
            {redoType === "free"
              ? "Free redo — no credits deducted"
              : `30% off — costs ${discountedCost} credit${discountedCost !== 1 ? "s" : ""} instead of ${charCost}`}
          </div>
        )}

        <div className="space-y-4">
          {!rerecordOf && <div className="space-y-3">
            <div className="space-y-2">
              <div>
                <h2 className="text-base font-semibold">{userLevel} Phrases</h2>
                <p className="text-sm text-muted-foreground">Scroll to browse, tap to select</p>
              </div>
              <div className="flex gap-3 items-center text-sm text-muted-foreground">
                <span className="font-medium">Tones by Color</span>
                <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>1st
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>2nd
                <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>3rd
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>4th
              </div>
            </div>
            <p className="text-sm text-muted-foreground/70 -mt-1">
              Sample readings currently generated by text-to-speech, so tones may be slightly incorrect.{" "}
              <a href="https://youtu.be/eIP8yVcDZRI?si=yfL6BcmhWmtz7GVv" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 transition-colors">Click here</a> to watch how tones change in context.
            </p>

            <div className="space-y-2" data-testid="phrase-list">
              {rows.map((row, ri) => (
                <ScrollRow key={ri}>
                  {row.map((phrase, i) => (
                    <CompactPhraseChip
                      key={ri * 4 + i}
                      phrase={phrase}
                      onSelect={handleSelectPhrase}
                      isSelected={selectedPhrase === phrase}
                      onPlay={playPhrase}
                      isLoading={loadingPhrase === phraseToText(phrase)}
                    />
                  ))}
                </ScrollRow>
              ))}
            </div>
          </div>}

          {!rerecordOf && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Or type your own sentence
            </label>
            <div className="relative">
              <Input
                placeholder={`Type Chinese here (max ${MAX_CHARS} characters)...`}
                className="text-base bg-muted/20 focus:bg-background transition-colors pr-16"
                value={selectedPhrase ? "" : text}
                onChange={(e) => {
                  if (e.target.value.length <= 40) {
                    setText(e.target.value);
                    setSelectedPhrase(null);
                  }
                }}
                maxLength={40}
                disabled={!!selectedPhrase}
                data-testid="sentence-input"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                {selectedPhrase ? "" : `${text.length}/40`}
              </span>
            </div>
          </div>
          )}

          {(selectedPhrase || text.trim()) && (
            <Card className={`border-primary/30 bg-primary/5 shadow-sm sticky top-0 z-10 ${tooLong ? "border-destructive/50 bg-destructive/5" : ""}`} data-testid="active-phrase-display">
              <CardContent className="py-5 px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">Recording</p>
                    {selectedPhrase ? (
                      <div>
                        <SandhiPhraseDisplay characters={selectedPhrase.characters} charSize="text-3xl" pinyinSize="text-base" />
                        <p className="text-sm text-muted-foreground mt-2">{selectedPhrase.english}</p>
                      </div>
                    ) : (
                      <p className="text-2xl font-medium text-foreground">{text}</p>
                    )}

                    {/* Cost preview */}
                    {charCost > 0 && !isUnlimited && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          tooLong
                            ? "bg-destructive/10 text-destructive"
                            : canAfford
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                        }`} data-testid="credit-cost-preview">
                          <CircleDollarSign className="w-3 h-3" />
                          <span>
                            {tooLong
                              ? `${charCost} chars — max ${MAX_CHARS}`
                              : canAfford
                                ? (redoType === "free"
                                    ? "Free redo"
                                    : `Costs ${discountedCost} credit${discountedCost > 1 ? "s" : ""}`)
                                : `Need ${discountedCost} credits (you have ${balance})`
                            }
                          </span>
                        </div>
                        {canAfford && !tooLong && redoType !== "free" && (
                          <span className="text-[10px] text-muted-foreground">
                            95%+ score → credits refunded
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedPhrase && (
                      <button
                        onClick={() => playPhrase(phraseToText(selectedPhrase))}
                        className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                        data-testid="active-phrase-speak-btn"
                        disabled={loadingPhrase === phraseToText(selectedPhrase)}
                      >
                        {loadingPhrase === phraseToText(selectedPhrase) ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleClearPhrase}
                      className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      data-testid="clear-phrase-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted/30 p-3 border-b border-border/50 flex gap-2 items-center">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Speak naturally and clearly with your microphone close. Score {REFUND_THRESHOLD}%+ and your credits are refunded.
                </p>
              </div>
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                isUploading={isUploading || createRecording.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
