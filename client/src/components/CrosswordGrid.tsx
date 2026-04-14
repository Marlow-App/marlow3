import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type GamePhase = "pre-start" | "playing" | "completed";

interface CrosswordGridWord {
  number: number;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  length: number;
}

interface CrosswordGridPuzzle {
  grid: boolean[][];
  words: CrosswordGridWord[];
  wordCount?: number;
}

export interface CrosswordGridProps {
  puzzle: CrosswordGridPuzzle;
  cells: Record<string, string>;
  checkState: Record<string, boolean | null>;
  phase: GamePhase;
  selectedKey: string | null;
  activeCellKeys: Set<string>;
  cellNumbers: Record<string, number>;
  onCellFocus: (row: number, col: number) => void;
  onCellChar: (key: string, char: string) => void;
  onCellKeyDown: (key: string, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onStart: () => void;
  readOnly?: boolean;
}

export function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function CrosswordGrid({
  puzzle,
  cells,
  checkState,
  phase,
  selectedKey,
  activeCellKeys,
  cellNumbers,
  onCellFocus,
  onCellChar,
  onCellKeyDown,
  onStart,
  readOnly = false,
}: CrosswordGridProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const isComposingRef = useRef(false);
  const justEndedCompositionRef = useRef(false);

  // Focus the selected input whenever selectedKey changes
  useEffect(() => {
    if (!selectedKey || phase !== "playing" || readOnly) return;
    const input = inputRefs.current[selectedKey];
    if (input && document.activeElement !== input) {
      input.focus({ preventScroll: true });
    }
  }, [selectedKey, phase, readOnly]);

  return (
    <div className="relative">
      {/* Blur overlay for pre-start gate */}
      {phase === "pre-start" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-sm bg-background/50 px-4">
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <p className="text-base font-bold mt-0.5">
              {puzzle.wordCount ?? puzzle.words.length} words to solve
            </p>
          </div>
          <Button
            size="lg"
            className="text-base px-7 py-5 rounded-2xl shadow-lg shadow-primary/20 font-bold"
            onClick={onStart}
            data-testid="start-btn"
          >
            Start Puzzle
          </Button>
        </div>
      )}

      {/* Grid */}
      <div
        className="grid gap-1 p-2 bg-foreground/5 rounded-xl border border-border"
        style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
        data-testid="crossword-grid"
      >
        {puzzle.grid.map((row, r) =>
          row.map((isWhite, c) => {
            const k = cellKey(r, c);
            const num = cellNumbers[k];
            const isSelected = selectedKey === k;
            const isHighlighted = activeCellKeys.has(k);
            const checkResult = checkState[k];
            const value = cells[k] ?? "";

            if (!isWhite) {
              return (
                <div
                  key={k}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-md bg-foreground/80 dark:bg-foreground/60"
                  data-testid={`cell-black-${k}`}
                />
              );
            }

            return (
              <div
                key={k}
                className={cn(
                  "w-14 h-14 md:w-16 md:h-16 rounded-md border-2 relative transition-all duration-100",
                  isSelected
                    ? "border-primary bg-primary/15 shadow-sm"
                    : isHighlighted
                      ? "border-primary/40 bg-primary/8"
                      : "border-border bg-card",
                  !readOnly && !isSelected && !isHighlighted && "hover:border-primary/30",
                  checkResult === true && "border-green-500 bg-green-50 dark:bg-green-950/30",
                  checkResult === false && "border-red-500 bg-red-50 dark:bg-red-950/30",
                )}
                data-testid={`cell-${k}`}
              >
                {num && (
                  <span className="absolute top-0.5 left-1 text-[9px] font-bold text-muted-foreground leading-none z-10 pointer-events-none">
                    {num}
                  </span>
                )}

                {readOnly ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className={cn(
                        "text-2xl font-bold select-none",
                        checkResult === true && "text-green-700 dark:text-green-400",
                        checkResult === false && "text-red-600 dark:text-red-400",
                      )}
                    >
                      {value}
                    </span>
                  </div>
                ) : (
                  <input
                    ref={el => { inputRefs.current[k] = el; }}
                    type="text"
                    inputMode="text"
                    lang="zh"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={value}
                    readOnly={phase !== "playing"}
                    tabIndex={phase === "playing" ? 0 : -1}
                    className={cn(
                      "absolute inset-0 w-full h-full bg-transparent border-none outline-none text-center text-2xl font-bold cursor-pointer caret-transparent select-none pt-3",
                      checkResult === true && "text-green-700 dark:text-green-400",
                      checkResult === false && "text-red-600 dark:text-red-400",
                    )}
                    data-testid={`input-${k}`}
                    onFocus={() => {
                      if (phase === "playing") onCellFocus(r, c);
                    }}
                    onCompositionStart={() => {
                      isComposingRef.current = true;
                    }}
                    onCompositionEnd={(e) => {
                      isComposingRef.current = false;
                      justEndedCompositionRef.current = true;
                      const composed = (e.data || "").trim();
                      const char = composed[0];
                      if (char) onCellChar(k, char);
                    }}
                    onChange={(e) => {
                      if (isComposingRef.current) return;
                      if (justEndedCompositionRef.current) {
                        justEndedCompositionRef.current = false;
                        return;
                      }
                      const val = e.target.value.trim();
                      if (val) {
                        const char = val[val.length - 1];
                        onCellChar(k, char);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (isComposingRef.current) return;
                      onCellKeyDown(k, e);
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
