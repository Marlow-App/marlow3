import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import {
  Timer, CheckCircle2, RotateCcw, Trophy,
  Copy, Grid3X3,
} from "lucide-react";
import { SiX, SiFacebook, SiWhatsapp, SiThreads } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CrosswordGrid, cellKey } from "@/components/CrosswordGrid";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrosswordWord {
  number: number;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  length: number;
  clue: string;
}

interface CrosswordPuzzle {
  id: number;
  puzzleIndex: number;
  title: string;
  grid: boolean[][];
  words: CrosswordWord[];
  wordCount: number;
  status: {
    cells: Record<string, string>;
    elapsedSeconds: number | null;
    isComplete: boolean;
    completedAt: string | null;
  } | null;
}

type GamePhase = "pre-start" | "playing" | "completed";

// ─── Helpers ─────────────────────────────────────────────────────────────────



function getWordCells(word: CrosswordWord) {
  return Array.from({ length: word.length }, (_, i) => ({
    row: word.direction === "across" ? word.startRow : word.startRow + i,
    col: word.direction === "across" ? word.startCol + i : word.startCol,
  }));
}

function buildCellNumberMap(words: CrosswordWord[]): Record<string, number> {
  const map: Record<string, number> = {};
  const sorted = [...words].sort((a, b) => a.number - b.number);
  for (const w of sorted) {
    const k = cellKey(w.startRow, w.startCol);
    if (!map[k]) map[k] = w.number;
  }
  return map;
}

function getWordsForCell(words: CrosswordWord[], row: number, col: number) {
  const result: { word: CrosswordWord; cellIdx: number }[] = [];
  for (const word of words) {
    const cells = getWordCells(word);
    const idx = cells.findIndex(c => c.row === row && c.col === col);
    if (idx !== -1) result.push({ word, cellIdx: idx });
  }
  return result;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function generateShareText(puzzleIndex: number, grid: boolean[][], elapsedSeconds: number): string {
  const gridEmoji = grid.map(row => row.map(isWhite => isWhite ? "🟩" : "⬛").join("")).join("\n");
  return `Marlow 中文填字游戏 #${puzzleIndex + 1} 🀄\nSolved in ${formatTime(elapsedSeconds)} ✅\n\n${gridEmoji}\n\nPlay Marlow's daily Chinese crossword 👉 marlow.app/crossword`;
}

// ─── Main Crossword Component ─────────────────────────────────────────────────

export default function CrosswordPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: puzzle, isLoading } = useQuery<CrosswordPuzzle>({
    queryKey: ["/api/crossword/today"],
  });

  // Game state
  const [phase, setPhase] = useState<GamePhase>("pre-start");
  const [cells, setCells] = useState<Record<string, string>>({});
  const [checkState, setCheckState] = useState<Record<string, boolean | null>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [activeWordNum, setActiveWordNum] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore saved state from status
  useEffect(() => {
    if (!puzzle) return;
    if (puzzle.status?.isComplete) {
      setCells((puzzle.status.cells as Record<string, string>) ?? {});
      setElapsedSeconds(puzzle.status.elapsedSeconds ?? 0);
      setPhase("completed");
    } else if (puzzle.status?.cells && Object.keys(puzzle.status.cells).length > 0) {
      // Pre-populate cells from saved progress but stay on pre-start gate;
      // the user must click Start to resume (handleStart will restore the timer offset)
      setCells((puzzle.status.cells as Record<string, string>) ?? {});
      setElapsedSeconds(puzzle.status.elapsedSeconds ?? 0);
    }
  }, [puzzle]);

  // Timer
  useEffect(() => {
    if (phase === "playing" && startTime !== null) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startTime]);

  const progressMutation = useMutation({
    mutationFn: (data: { puzzleId: number; cells: Record<string, string>; elapsedSeconds: number }) =>
      apiRequest("POST", "/api/crossword/today/progress", data),
  });

  // Autosave progress after every cell change (debounced 2s) while in playing phase
  useEffect(() => {
    if (phase !== "playing" || !puzzle) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const elapsed = startTime !== null ? Math.floor((Date.now() - startTime) / 1000) : elapsedSeconds;
      progressMutation.mutate({ puzzleId: puzzle.id, cells, elapsedSeconds: elapsed });
    }, 2000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, phase]);

  const checkMutation = useMutation({
    mutationFn: async (data: { puzzleId: number; cells: Record<string, string> }) => {
      const res = await apiRequest("POST", "/api/crossword/check", data);
      return res.json() as Promise<{ results: Record<string, boolean> }>;
    },
  });

  const completeMutation = useMutation({
    mutationFn: (data: { puzzleId: number; cells: Record<string, string>; elapsedSeconds: number }) =>
      apiRequest("POST", "/api/crossword/complete", data),
  });

  const handleStart = useCallback(() => {
    const now = Date.now();
    const resumeElapsed = elapsedSeconds;
    setStartTime(now - resumeElapsed * 1000);
    setPhase("playing");
    setTimeout(() => gridRef.current?.focus(), 50);
  }, [elapsedSeconds]);

  const handleCheck = useCallback(async () => {
    if (!puzzle) return;
    const current = elapsedSeconds;
    progressMutation.mutate({ puzzleId: puzzle.id, cells, elapsedSeconds: current });

    const { results } = await checkMutation.mutateAsync({ puzzleId: puzzle.id, cells });
    setCheckState(results);

    // Check if all white cells are correct
    const whiteCells = puzzle.grid.flatMap((row, r) =>
      row.map((isWhite, c) => isWhite ? cellKey(r, c) : null).filter(Boolean) as string[]
    );
    const allCorrect = whiteCells.every(k => results[k] === true);

    if (allCorrect) {
      if (timerRef.current) clearInterval(timerRef.current);
      await completeMutation.mutateAsync({ puzzleId: puzzle.id, cells, elapsedSeconds: current });
      setPhase("completed");
      toast({ title: "🎉 Puzzle Complete!", description: `Solved in ${formatTime(current)}` });
    } else {
      // After 2 seconds, clear wrong answers
      setTimeout(() => {
        setCells(prev => {
          const next = { ...prev };
          Object.entries(results).forEach(([k, correct]) => {
            if (!correct) delete next[k];
          });
          return next;
        });
        setCheckState({});
      }, 2000);
      toast({ title: "Not quite!", description: "Wrong answers have been cleared. Keep trying!", variant: "destructive" });
    }
  }, [puzzle, cells, elapsedSeconds]);

  const handleReset = useCallback(() => {
    setCells({});
    setCheckState({});
    setSelectedKey(null);
    setActiveWordNum(null);
    setElapsedSeconds(0);
    setPhase("pre-start");
    setStartTime(null);
  }, []);

  // ─── Cell interaction ──────────────────────────────────────────────────────

  const selectCell = useCallback((row: number, col: number, puzzle: CrosswordPuzzle) => {
    const k = cellKey(row, col);
    if (selectedKey === k) {
      // If already selected, try to toggle direction if multiple words
      const wordsHere = getWordsForCell(puzzle.words, row, col);
      if (wordsHere.length > 1) {
        const curIdx = wordsHere.findIndex(w => w.word.number === activeWordNum);
        const next = wordsHere[(curIdx + 1) % wordsHere.length];
        setActiveWordNum(next.word.number);
      }
    } else {
      setSelectedKey(k);
      const wordsHere = getWordsForCell(puzzle.words, row, col);
      if (wordsHere.length > 0) {
        // Prefer current direction if possible
        const preferred = wordsHere.find(w => w.word.number === activeWordNum) ?? wordsHere[0];
        setActiveWordNum(preferred.word.number);
      } else {
        setActiveWordNum(null);
      }
    }
    gridRef.current?.focus();
  }, [selectedKey, activeWordNum]);

  // Returns the next cell key in the word without updating state
  const computeNextCellKey = useCallback((puzzle: CrosswordPuzzle, fromRow: number, fromCol: number, wordNum: number): string | null => {
    const word = puzzle.words.find(w => w.number === wordNum);
    if (!word) return null;
    const wordCells = getWordCells(word);
    const curIdx = wordCells.findIndex(c => c.row === fromRow && c.col === fromCol);
    if (curIdx >= 0 && curIdx < wordCells.length - 1) {
      const next = wordCells[curIdx + 1];
      return cellKey(next.row, next.col);
    }
    return null;
  }, []);

  const advanceToNextCell = useCallback((puzzle: CrosswordPuzzle, fromRow: number, fromCol: number, wordNum: number) => {
    const nextKey = computeNextCellKey(puzzle, fromRow, fromCol, wordNum);
    if (nextKey) setSelectedKey(nextKey);
  }, [computeNextCellKey]);

  const moveToPrevCell = useCallback((puzzle: CrosswordPuzzle, fromRow: number, fromCol: number, wordNum: number) => {
    const word = puzzle.words.find(w => w.number === wordNum);
    if (!word) return;
    const wordCells = getWordCells(word);
    const curIdx = wordCells.findIndex(c => c.row === fromRow && c.col === fromCol);
    if (curIdx > 0) {
      const prev = wordCells[curIdx - 1];
      setSelectedKey(cellKey(prev.row, prev.col));
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!puzzle || phase !== "playing" || !selectedKey) return;
    const [rowStr, colStr] = selectedKey.split("-");
    const row = Number(rowStr);
    const col = Number(colStr);

    if (e.key === "Backspace") {
      e.preventDefault();
      const cur = cells[selectedKey] ?? "";
      if (cur.length > 0) {
        setCells(prev => ({ ...prev, [selectedKey]: cur.slice(0, -1) }));
      } else if (activeWordNum !== null) {
        moveToPrevCell(puzzle, row, col, activeWordNum);
      }
    } else if (e.key === " " || e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (activeWordNum !== null) advanceToNextCell(puzzle, row, col, activeWordNum);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      // Find next white cell to the right
      for (let c = col + 1; c < 5; c++) {
        if (puzzle.grid[row][c]) { setSelectedKey(cellKey(row, c)); break; }
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      for (let c = col - 1; c >= 0; c--) {
        if (puzzle.grid[row][c]) { setSelectedKey(cellKey(row, c)); break; }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      for (let r = row + 1; r < 5; r++) {
        if (puzzle.grid[r][col]) { setSelectedKey(cellKey(r, col)); break; }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      for (let r = row - 1; r >= 0; r--) {
        if (puzzle.grid[r][col]) { setSelectedKey(cellKey(r, col)); break; }
      }
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const cur = cells[selectedKey] ?? "";
      const newChar = e.key.toLowerCase();
      // Auto-advance when typing a new syllable start after a completed syllable.
      // Pinyin syllables end with a vowel, 'n', 'g', or 'r'; new syllables
      // typically begin with a consonant initial (b p m f d t n l g k h j q x r z c s w y).
      const SYLLABLE_ENDERS = new Set(["a","e","i","o","u","ü","n","g","r"]);
      const PINYIN_INITIALS = new Set(["b","p","m","f","d","t","l","g","k","h","j","q","x","r","z","c","s","w","y"]);
      if (
        cur.length >= 2 &&
        activeWordNum !== null &&
        SYLLABLE_ENDERS.has(cur.slice(-1)) &&
        PINYIN_INITIALS.has(newChar) &&
        // 'n' and 'g' can extend the current syllable (e.g. -ng), so don't advance on those
        newChar !== "n" && newChar !== "g"
      ) {
        const nextKey = computeNextCellKey(puzzle, row, col, activeWordNum);
        if (nextKey) {
          setSelectedKey(nextKey);
          setCells(prev => ({ ...prev, [nextKey]: newChar }));
          return;
        }
      }
      if (cur.length < 7) {
        setCells(prev => ({ ...prev, [selectedKey]: cur + newChar }));
      }
    }
  }, [puzzle, phase, selectedKey, cells, activeWordNum, advanceToNextCell, moveToPrevCell, computeNextCellKey]);

  // ─── Rendering ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!puzzle) {
    return (
      <Layout>
        <div className="text-center py-16 text-muted-foreground">
          <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No puzzle available today. Check back soon!</p>
        </div>
      </Layout>
    );
  }

  const cellNumbers = buildCellNumberMap(puzzle.words);
  const activeWord = activeWordNum ? puzzle.words.find(w => w.number === activeWordNum) : undefined;
  const activeCellKeys = activeWord
    ? new Set(getWordCells(activeWord).map(c => cellKey(c.row, c.col)))
    : new Set<string>();

  const acrossWords = puzzle.words.filter(w => w.direction === "across").sort((a, b) => a.number - b.number);
  const downWords = puzzle.words.filter(w => w.direction === "down").sort((a, b) => a.number - b.number);

  return (
    <Layout>
      <div className="space-y-5 animate-in max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display leading-tight flex items-center gap-2">
                <span className="text-2xl">🀄</span> Daily Crossword
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Puzzle #{puzzle.puzzleIndex + 1} · {puzzle.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {phase !== "pre-start" && (
                <div className="flex items-center gap-1.5 text-sm font-mono font-semibold bg-muted px-3 py-1.5 rounded-lg" data-testid="crossword-timer">
                  <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                  {formatTime(elapsedSeconds)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Completed screen (replaces game area) ─────────────────────────────── */}
        {phase === "completed" && puzzle && (() => {
          const text = generateShareText(puzzle.puzzleIndex, puzzle.grid, elapsedSeconds);
          const encodedText = encodeURIComponent(text);
          const url = encodeURIComponent("https://marlow.app/crossword");
          const copy = async () => {
            await navigator.clipboard.writeText(text);
            toast({ title: "Copied!", description: "Share text copied to clipboard" });
          };
          return (
            <Card
              className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-center"
              data-testid="completed-banner"
            >
              <CardContent className="py-10 px-6 space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <Trophy className="w-14 h-14 text-primary" />
                  <div>
                    <p className="font-bold text-2xl font-display">Puzzle Complete! 🎉</p>
                    <p className="text-base text-muted-foreground mt-1">
                      Solved in <span className="font-semibold text-foreground">{formatTime(elapsedSeconds)}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">Come back tomorrow for a new puzzle!</p>
                  </div>
                </div>
                {/* Emoji grid preview */}
                <div className="text-2xl leading-snug whitespace-pre font-mono" data-testid="emoji-grid">
                  {puzzle.grid.map((row, r) => (
                    <div key={r}>{row.map((cell, c) => cell ? "🟩" : "⬛").join("")}</div>
                  ))}
                </div>
                {/* Share row */}
                <div className="flex flex-wrap justify-center gap-2" data-testid="share-row">
                  <a href={`https://twitter.com/intent/tweet?text=${encodedText}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5" data-testid="share-x"><SiX className="w-3.5 h-3.5" />X</Button>
                  </a>
                  <a href={`https://threads.net/intent/post?text=${encodedText}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5" data-testid="share-threads"><SiThreads className="w-3.5 h-3.5" />Threads</Button>
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5" data-testid="share-facebook"><SiFacebook className="w-3.5 h-3.5" />Facebook</Button>
                  </a>
                  <a href={`https://wa.me/?text=${encodedText}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5" data-testid="share-whatsapp"><SiWhatsapp className="w-3.5 h-3.5" />WhatsApp</Button>
                  </a>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={copy} data-testid="share-copy">
                    <Copy className="w-3.5 h-3.5" />Copy (for Instagram &amp; others)
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* ── Game area: grid + clues (hidden when completed) ──────────────────── */}
        {phase !== "completed" && (
        <div className="md:flex md:gap-6 space-y-5 md:space-y-0">
          {/* Grid */}
          <div className="flex flex-col items-center gap-3">
            <CrosswordGrid
              puzzle={puzzle}
              cells={cells}
              checkState={checkState}
              phase={phase}
              selectedKey={selectedKey}
              activeCellKeys={activeCellKeys}
              cellNumbers={cellNumbers}
              gridRef={gridRef}
              onCellClick={(r, c) => selectCell(r, c, puzzle)}
              onKeyDown={handleKeyDown}
              onStart={handleStart}
            />

            {/* Action buttons */}
            {phase === "playing" && (
              <div className="flex gap-2" data-testid="playing-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-1.5 text-muted-foreground"
                  data-testid="reset-btn"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleCheck}
                  disabled={checkMutation.isPending}
                  className="gap-1.5"
                  data-testid="check-btn"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {checkMutation.isPending ? "Checking..." : "Check Answers"}
                </Button>
              </div>
            )}
          </div>

          {/* Clues */}
          <div className="flex-1 space-y-4 min-w-0" data-testid="clues-panel">
            {acrossWords.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Across</h3>
                <div className="space-y-1">
                  {acrossWords.map(word => {
                    const isActiveWord = word.number === activeWordNum;
                    return (
                      <div
                        key={`across-${word.number}`}
                        className={cn(
                          "flex gap-2 text-sm px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                          isActiveWord ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50",
                        )}
                        onClick={() => {
                          if (phase !== "playing") return;
                          const firstCell = getWordCells(word)[0];
                          setSelectedKey(cellKey(firstCell.row, firstCell.col));
                          setActiveWordNum(word.number);
                          gridRef.current?.focus();
                        }}
                        data-testid={`clue-across-${word.number}`}
                      >
                        <span className="font-bold shrink-0 w-5 text-right">{word.number}</span>
                        <span className="leading-snug">{word.clue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {downWords.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Down</h3>
                <div className="space-y-1">
                  {downWords.map(word => {
                    const isActiveWord = word.number === activeWordNum;
                    return (
                      <div
                        key={`down-${word.number}`}
                        className={cn(
                          "flex gap-2 text-sm px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                          isActiveWord ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50",
                        )}
                        onClick={() => {
                          if (phase !== "playing") return;
                          const firstCell = getWordCells(word)[0];
                          setSelectedKey(cellKey(firstCell.row, firstCell.col));
                          setActiveWordNum(word.number);
                          gridRef.current?.focus();
                        }}
                        data-testid={`clue-down-${word.number}`}
                      >
                        <span className="font-bold shrink-0 w-5 text-right">{word.number}</span>
                        <span className="leading-snug">{word.clue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instructions */}
            {phase === "playing" && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 space-y-1">
                <p className="font-semibold">How to play:</p>
                <p>• Click a cell, then type the <strong>pinyin</strong> (e.g. <code className="bg-muted px-1 rounded">bei</code> for 北)</p>
                <p>• Press <kbd className="bg-muted border border-border rounded px-1">Space</kbd> or <kbd className="bg-muted border border-border rounded px-1">→</kbd> to move to the next cell</p>
                <p>• Press <kbd className="bg-muted border border-border rounded px-1">⌫</kbd> to delete</p>
                <p>• Click <strong>Check Answers</strong> when you're ready!</p>
              </div>
            )}

          </div>
        </div>
        )}
      </div>

    </Layout>
  );
}
