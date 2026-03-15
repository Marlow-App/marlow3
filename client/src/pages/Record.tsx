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
import { useLocation } from "wouter";
import { ChevronLeft, Info, Volume2, X, Loader2, Crown } from "lucide-react";
import { getPhrasesForLevel, phraseToText, PHRASE_BANK, type Phrase, type ToneChar } from "@/data/phrases";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

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

function ToneCharacter({ toneChar, size = "lg" }: { toneChar: ToneChar; size?: "sm" | "lg" }) {
  const isPunctuation = !toneChar.pinyin || /[，。！？、；：]/.test(toneChar.char);
  const charSize = size === "lg" ? "text-3xl" : "text-lg";
  const pinyinSize = size === "lg" ? "text-base" : "text-sm";

  return (
    <span className="inline-flex flex-col items-center mx-[1px]">
      {!isPunctuation && (
        <span className={`${pinyinSize} leading-tight font-medium ${TONE_PINYIN_COLORS[toneChar.tone]}`}>
          {toneChar.pinyin}
        </span>
      )}
      <span className={`${charSize} font-medium leading-tight ${isPunctuation ? "text-foreground/60" : TONE_COLORS[toneChar.tone]}`}>
        {toneChar.char}
      </span>
    </span>
  );
}

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
          <div className="flex items-end gap-x-0 whitespace-nowrap">
            {phrase.characters.map((tc, i) => (
              <ToneCharacter key={i} toneChar={tc} size="sm" />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">{phrase.english}</p>
        </div>
        <button
          onClick={handlePlay}
          className="shrink-0 p-1 rounded-full hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
          title="Listen (ElevenLabs)"
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
  const { data: remainingData } = useQuery<{ dailyLimit: number; used: number; remaining: number; tier: string }>({
    queryKey: ['/api/recordings/remaining'],
  });

  const dailyPhrases = getPhrasesForLevel(userLevel, 10);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const phraseParam = params.get("phrase");
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

  const handleRecordingComplete = async (file: File) => {
    if (!text.trim()) {
      toast({
        title: "Sentence Required",
        description: "Please enter or select a sentence before recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      const uploadRes = await uploadFile(file);
      if (!uploadRes) throw new Error("Upload failed");

      await createRecording.mutateAsync({
        audioUrl: uploadRes.objectPath,
        sentenceText: text,
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
            <button onClick={() => setLocation("/")} className="p-1 -ml-1 rounded-md hover:bg-muted transition-colors" data-testid="back-btn">
              <ChevronLeft className="w-9 h-9 text-foreground" strokeWidth={3} />
            </button>
            <h1 className="text-3xl font-bold font-display">New Recording</h1>
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
            {remainingData && (
              <div className="flex items-center gap-1.5" data-testid="recording-limit-info">
                <span className="text-sm text-muted-foreground" data-testid="remaining-count">
                  {remainingData.tier === 'unlimited' ? 'Unlimited' : `${remainingData.remaining} remaining`}
                </span>
                <Link href="/profile?highlight=subscription">
                  <Badge
                    variant={remainingData.tier === 'pro' || remainingData.tier === 'unlimited' ? 'default' : 'outline'}
                    className={`cursor-pointer ${remainingData.tier === 'pro' || remainingData.tier === 'unlimited' ? 'bg-primary text-primary-foreground' : ''}`}
                    data-testid="tier-badge"
                  >
                    {(remainingData.tier === 'pro' || remainingData.tier === 'unlimited') && <Crown className="w-3 h-3 mr-1" />}
                    {remainingData.tier === 'pro' || remainingData.tier === 'unlimited' ? 'Pro' : 'Free'}
                  </Badge>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
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
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Or type your own sentence
            </label>
            <div className="relative">
              <Input
                placeholder="Type Chinese here (max 40 characters)..."
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

          {(selectedPhrase || text.trim()) && (
            <Card className="border-primary/30 bg-primary/5 shadow-sm sticky top-0 z-10" data-testid="active-phrase-display">
              <CardContent className="py-5 px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">Recording</p>
                    {selectedPhrase ? (
                      <div>
                        <div className="flex flex-wrap items-end gap-x-0.5">
                          {selectedPhrase.characters.map((tc, i) => (
                            <ToneCharacter key={i} toneChar={tc} size="lg" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{selectedPhrase.english}</p>
                      </div>
                    ) : (
                      <p className="text-2xl font-medium text-foreground">{text}</p>
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
                  Speak naturally and clearly with your microphone close.
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
