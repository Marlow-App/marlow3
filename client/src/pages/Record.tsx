import { useState, useCallback, useRef } from "react";
import { Layout } from "@/components/Layout";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useUpload } from "@/hooks/use-upload";
import { useCreateRecording } from "@/hooks/use-recordings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft, Info, Volume2, X } from "lucide-react";
import { getDailyPhrases, phraseToText, type Phrase, type ToneChar } from "@/data/phrases";

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
  const pinyinSize = size === "lg" ? "text-xs" : "text-[10px]";

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

function CompactPhraseChip({ phrase, onSelect, isSelected }: { phrase: Phrase; onSelect: (phrase: Phrase) => void; isSelected: boolean }) {
  const speakPhrase = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const text = phraseToText(phrase);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [phrase]);

  return (
    <button
      onClick={() => onSelect(phrase)}
      className={`shrink-0 text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-200 min-w-[160px] ${
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
          onClick={speakPhrase}
          className="shrink-0 p-1 rounded-full hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
          title="Listen"
          data-testid="phrase-speak-btn"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </button>
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

  const dailyPhrases = getDailyPhrases(10);

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
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to submit recording. Please try again.";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} data-testid="back-btn">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold font-display">New Recording</h1>
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold font-display">Today's Phrases</h2>
                <p className="text-xs text-muted-foreground">Scroll to browse, tap to select</p>
              </div>
              <div className="flex gap-1.5 items-center text-[10px] text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>1st
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>2nd
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>3rd
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>4th
              </div>
            </div>

            <div className="space-y-2" data-testid="phrase-list">
              {rows.map((row, ri) => (
                <ScrollRow key={ri}>
                  {row.map((phrase, i) => (
                    <CompactPhraseChip
                      key={ri * 4 + i}
                      phrase={phrase}
                      onSelect={handleSelectPhrase}
                      isSelected={selectedPhrase === phrase}
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
            <Card className="border-primary/30 bg-primary/5 shadow-sm" data-testid="active-phrase-display">
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
                        onClick={() => {
                          const t = phraseToText(selectedPhrase);
                          const utterance = new SpeechSynthesisUtterance(t);
                          utterance.lang = "zh-CN";
                          utterance.rate = 0.8;
                          window.speechSynthesis.cancel();
                          window.speechSynthesis.speak(utterance);
                        }}
                        className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                        data-testid="active-phrase-speak-btn"
                      >
                        <Volume2 className="w-5 h-5" />
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
                <p className="text-xs text-muted-foreground">
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
