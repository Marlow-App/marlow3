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
  // Refs to the invisible input overlays — uncontrolled so React never touches their value
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Focus the selected cell's input when selectedKey changes
  useEffect(() => {
    if (!selectedKey || phase !== "playing" || readOnly) return;
    const input = inputRefs.current[selectedKey];
    if (input && document.activeElement !== input) {
      input.focus({ preventScroll: true });
    }
  }, [selectedKey, phase, readOnly]);

  return (
    <div className="relative">
      {/* Blur overlay + start gate */}
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
            const charValue = cells[k] ?? "";

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
                  "w-14 h-14 md:w-16 md:h-16 rounded-md border-2 relative transition-all duration-100 cursor-pointer select-none",
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
                onClick={() => {
                  if (phase === "playing") {
                    onCellFocus(r, c);
                    inputRefs.current[k]?.focus({ preventScroll: true });
                  }
                }}
              >
                {/* Cell number */}
                {num && (
                  <span className="absolute top-0.5 left-1 text-[9px] font-bold text-muted-foreground leading-none z-10 pointer-events-none">
                    {num}
                  </span>
                )}

                {/* Character display — always visible, React-controlled */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      checkResult === true && "text-green-700 dark:text-green-400",
                      checkResult === false && "text-red-600 dark:text-red-400",
                    )}
                  >
                    {charValue}
                  </span>
                </div>

                {/*
                  Invisible, UNCONTROLLED input overlay.
                  No `value` prop — React never touches the input's content,
                  so the browser's IME composition flow is never interrupted.
                  We read the confirmed character only from compositionEnd.
                */}
                {!readOnly && (
                  <input
                    key={k}
                    ref={el => { inputRefs.current[k] = el; }}
                    type="text"
                    inputMode="text"
                    lang="zh-CN"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    tabIndex={phase === "playing" ? 0 : -1}
                    readOnly={phase !== "playing"}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 caret-transparent"
                    data-testid={`input-${k}`}
                    onFocus={() => {
                      if (phase === "playing") onCellFocus(r, c);
                    }}
                    onCompositionEnd={(e) => {
                      // IME confirmed: e.data contains the composed character(s)
                      const composed = (e.data || "").trim();
                      const char = [...composed][0]; // safe Unicode-aware first char
                      if (char) {
                        onCellChar(k, char);
                      }
                      // Clear the raw input buffer so it's ready for the next character
                      if (e.currentTarget) {
                        e.currentTarget.value = "";
                      }
                    }}
                    onKeyDown={(e) => {
                      // Skip navigation shortcuts while IME is still composing
                      if (e.nativeEvent.isComposing) return;
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
