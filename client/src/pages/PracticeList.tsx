import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trash2, Volume2, ChevronDown, ChevronUp } from "lucide-react";
import { pinyin } from "pinyin-pro";
import { useState } from "react";
import { type PronunciationError, type PracticeListItem } from "@shared/schema";

type PracticeItem = PracticeListItem & { error: PronunciationError };

const CATEGORY_COLORS: Record<string, string> = {
  tone: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
  initial: "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300",
  final: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  tone: "Tone",
  initial: "Initial",
  final: "Final",
};

function speakText(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "zh-CN";
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

function PracticeCard({ item, onRemove }: { item: PracticeItem; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { error } = item;
  const categoryColor = CATEGORY_COLORS[error.category] ?? "";
  const categoryLabel = CATEGORY_LABELS[error.category] ?? error.category;

  const charPinyin = item.character ? pinyin(item.character, { toneType: "symbol", type: "string" }) : null;

  return (
    <Card className="border border-border/60 shadow-sm" data-testid={`practice-card-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Character display */}
          {item.character && (
            <div className="flex flex-col items-center shrink-0 bg-muted/30 rounded-lg px-3 py-2 min-w-[52px]">
              {charPinyin && (
                <span className="text-xs text-muted-foreground font-medium">{charPinyin}</span>
              )}
              <span className="text-2xl font-bold leading-tight">{item.character}</span>
              <button
                type="button"
                onClick={() => speakText(item.character!)}
                className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                aria-label={`Pronounce ${item.character}`}
                data-testid={`speak-char-${item.id}`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${categoryColor}`}>{categoryLabel}</span>
              <span className="text-xs font-mono text-muted-foreground">{error.id}</span>
            </div>
            <p className="font-semibold text-sm leading-snug">{error.commonError}</p>

            {error.simpleExplanation && (
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`expand-${item.id}`}
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? "Less" : "Details"}
              </button>
            )}

            {expanded && (
              <div className="mt-3 space-y-3">
                {error.simpleExplanation && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">What's happening</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{error.simpleExplanation}</p>
                  </div>
                )}
                {error.howToFix && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">How to fix it</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{error.howToFix}</p>
                  </div>
                )}
                {error.practiceWords && error.practiceWords.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Practice words</p>
                    <div className="flex flex-wrap gap-2">
                      {error.practiceWords.map((word, i) => {
                        const py = pinyin(word, { toneType: "symbol", type: "string" });
                        return (
                          <div key={i} className="flex flex-col items-center bg-muted/30 rounded-lg px-2.5 py-1.5 min-w-[44px]">
                            <span className="text-xs text-muted-foreground">{py}</span>
                            <span className="text-base font-bold">{word}</span>
                            <button
                              type="button"
                              onClick={() => speakText(word)}
                              className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                              data-testid={`speak-word-${item.id}-${i}`}
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Remove from practice list"
            data-testid={`remove-${item.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PracticeList() {
  const { toast } = useToast();
  const { data: items = [], isLoading } = useQuery<PracticeItem[]>({
    queryKey: ["/api/practice-list"],
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/practice-list/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/practice-list"] });
      toast({ title: "Removed", description: "Item removed from your practice list." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove item.", variant: "destructive" });
    },
  });

  const grouped = {
    tone: items.filter(i => i.error.category === "tone"),
    initial: items.filter(i => i.error.category === "initial"),
    final: items.filter(i => i.error.category === "final"),
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold">Practice List</h1>
            <p className="text-sm text-muted-foreground">Errors saved from your feedback for focused study</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground" data-testid="practice-list-empty">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium text-base mb-1">Your practice list is empty</p>
            <p className="text-sm max-w-xs mx-auto">
              When a reviewer links an error to your recording, tap the error badge to view details and save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {(["tone", "initial", "final"] as const).map(cat => {
              const catItems = grouped[cat];
              if (catItems.length === 0) return null;
              return (
                <section key={cat}>
                  <h2 className={`text-xs font-black uppercase tracking-widest mb-3 ${
                    cat === "tone" ? "text-blue-600 dark:text-blue-400" :
                    cat === "initial" ? "text-violet-600 dark:text-violet-400" :
                    "text-orange-600 dark:text-orange-400"
                  }`}>
                    {CATEGORY_LABELS[cat]} errors · {catItems.length}
                  </h2>
                  <div className="space-y-3">
                    {catItems.map(item => (
                      <PracticeCard
                        key={item.id}
                        item={item}
                        onRemove={() => removeMutation.mutate(item.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
