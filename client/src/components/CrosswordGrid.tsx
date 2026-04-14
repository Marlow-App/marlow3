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
  gridRef: React.RefObject<HTMLDivElement>;
  onCellClick: (row: number, col: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onStart: () => void;
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
  gridRef,
  onCellClick,
  onKeyDown,
  onStart,
}: CrosswordGridProps) {
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

      {/* Interactive grid */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="outline-none focus:ring-2 focus:ring-primary/30 rounded-xl"
        data-testid="crossword-grid"
      >
        <div
          className="grid gap-1 p-2 bg-foreground/5 rounded-xl border border-border"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
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
                  onClick={() => phase !== "pre-start" && onCellClick(r, c)}
                  className={cn(
                    "w-14 h-14 md:w-16 md:h-16 rounded-md border-2 relative cursor-pointer select-none transition-all duration-100 flex items-center justify-center",
                    isSelected
                      ? "border-primary bg-primary/15 shadow-sm"
                      : isHighlighted
                        ? "border-primary/40 bg-primary/8"
                        : "border-border bg-card hover:border-primary/30",
                    checkResult === true && "border-green-500 bg-green-50 dark:bg-green-950/30",
                    checkResult === false && "border-red-500 bg-red-50 dark:bg-red-950/30",
                  )}
                  data-testid={`cell-${k}`}
                >
                  {num && (
                    <span className="absolute top-0.5 left-1 text-[9px] font-bold text-muted-foreground leading-none">
                      {num}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-sm font-bold font-mono tracking-tight",
                      value.length > 4 ? "text-[10px]" : value.length > 2 ? "text-xs" : "text-sm",
                      checkResult === true && "text-green-700 dark:text-green-400",
                      checkResult === false && "text-red-600 dark:text-red-400",
                    )}
                  >
                    {value}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
