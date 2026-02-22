import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useUpload } from "@/hooks/use-upload";
import { useCreateRecording } from "@/hooks/use-recordings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft, Info, Volume2 } from "lucide-react";
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

function ToneCharacter({ toneChar }: { toneChar: ToneChar }) {
  const isPunctuation = !toneChar.pinyin || /[，。！？、；：]/.test(toneChar.char);

  return (
    <span className="inline-flex flex-col items-center mx-[1px]">
      {!isPunctuation && (
        <span className={`text-[11px] leading-tight font-medium ${TONE_PINYIN_COLORS[toneChar.tone]}`}>
          {toneChar.pinyin}
        </span>
      )}
      <span className={`text-2xl font-medium leading-tight ${isPunctuation ? "text-foreground/60" : TONE_COLORS[toneChar.tone]}`}>
        {toneChar.char}
      </span>
    </span>
  );
}

function PhraseCard({ phrase, onSelect, isSelected }: { phrase: Phrase; onSelect: (phrase: Phrase) => void; isSelected: boolean }) {
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
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border/60 bg-card hover:border-primary/40 hover:shadow-sm"
      }`}
      data-testid={`phrase-card-${phraseToText(phrase).slice(0, 4)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-end gap-x-0.5 mb-2">
            {phrase.characters.map((tc, i) => (
              <ToneCharacter key={i} toneChar={tc} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{phrase.english}</p>
        </div>
        <button
          onClick={speakPhrase}
          className="shrink-0 p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
          title="Listen to pronunciation"
          data-testid="phrase-speak-btn"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
    </button>
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

  const handleSelectPhrase = (phrase: Phrase) => {
    const fullText = phraseToText(phrase);
    setText(fullText);
    setSelectedPhrase(phrase);
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
      <div className="max-w-2xl mx-auto space-y-8 animate-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} data-testid="back-btn">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold font-display">New Recording</h1>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label htmlFor="sentence" className="text-base font-medium">
                  What sentence are you practicing?
                </Label>

                <Textarea
                  id="sentence"
                  placeholder="Type the Chinese sentence here, or pick one below..."
                  className="min-h-[100px] text-lg resize-none bg-muted/20 focus:bg-background transition-colors"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setSelectedPhrase(null);
                  }}
                  data-testid="sentence-input"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold font-display">Today's Suggested Phrases</h2>
                <p className="text-sm text-muted-foreground">Pick a phrase to practice. Tap the speaker icon to hear it.</p>
              </div>
              <div className="flex gap-2 items-center text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span> 1st
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500"></span> 2nd
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span> 3rd
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span> 4th
              </div>
            </div>

            <div className="grid gap-3" data-testid="phrase-list">
              {dailyPhrases.map((phrase, i) => (
                <PhraseCard
                  key={i}
                  phrase={phrase}
                  onSelect={handleSelectPhrase}
                  isSelected={selectedPhrase === phrase}
                />
              ))}
            </div>
          </div>

          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted/30 p-4 border-b border-border/50 flex gap-3 items-start">
                 <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                 <p className="text-sm text-muted-foreground">
                   Ensure your microphone is close. Speak naturally and clearly.
                 </p>
              </div>
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                isUploading={isUploading || createRecording.isPending}
              />
              <div className="p-6 pt-0 text-center border-t border-border/50 bg-muted/5">
                <p className="text-xs text-muted-foreground italic mt-4">
                  Trouble recording? Make sure you've granted microphone permissions in your browser settings and try refreshing the page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
