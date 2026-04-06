import { Layout } from "@/components/Layout";
import { getScoreBgColor, getScoreTextColor } from "@/lib/scoreColor";
import { useRecordings } from "@/hooks/use-recordings";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mic2, Mic, MessageCircle, Clock, ChevronRight, ChevronLeft, Loader2,
  Calendar, Trash2, RotateCcw, TrendingUp, TrendingDown, Minus,
  Award, Activity, Target, Star, AlertTriangle, Check,
} from "lucide-react";
import {
  format, formatDistanceToNow, startOfMonth, endOfMonth, eachDayOfInterval,
  subMonths, addMonths, isToday, isBefore, startOfDay, isThisWeek,
  isThisMonth, differenceInMonths, isSameDay, parseISO,
} from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation } from "@tanstack/react-query";
import { getPhraseEnglish } from "@/data/phrases";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── Sub-components ────────────────────────────────────────────────────────────

function RatingBadge({ rating, overallScore }: { rating?: number | null; overallScore?: number | null }) {
  if (overallScore !== null && overallScore !== undefined) {
    return (
      <div className="flex items-center gap-1" data-testid={`score-badge-${overallScore}`}>
        <span className={`text-xs font-bold ${getScoreTextColor(overallScore)}`}>{overallScore}%</span>
      </div>
    );
  }
  if (!rating) return null;
  const config: Record<number, { label: string; textColor: string }> = {
    1: { label: "Needs Improvement", textColor: "text-gray-500" },
    2: { label: "Good", textColor: "text-amber-600" },
    3: { label: "Excellent", textColor: "text-emerald-600" },
  };
  const c = config[rating];
  if (!c) return null;
  return (
    <div className="flex items-center gap-1" data-testid={`rating-badge-${rating}`}>
      <span className={`text-[10px] font-semibold ${c.textColor}`}>{c.label}</span>
    </div>
  );
}

function CategoryBar({ label, value }: { label: string; value: number }) {
  const barColor =
    value >= 75 ? "bg-emerald-500 dark:bg-emerald-400"
    : value >= 50 ? "bg-amber-500 dark:bg-amber-400"
    : "bg-primary";
  const textColor =
    value >= 75 ? "text-emerald-600 dark:text-emerald-400"
    : value >= 50 ? "text-amber-600 dark:text-amber-400"
    : "text-primary";
  return (
    <div className="space-y-1.5" data-testid={`category-bar-${label.toLowerCase()}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${textColor}`}>{value}%</span>
      </div>
      <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${value}%` }}
          data-testid={`category-bar-fill-${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

const CATEGORY_TIPS = {
  tone: {
    strong: "Your tone accuracy is solid. Keep listening to natives to internalize the shapes.",
    weak: "Focus on the pitch shape of each tone. T1 is flat-high, T2 rises, T3 dips (or half-dips), T4 falls sharply.",
  },
  initial: {
    strong: "Your initial consonants are accurate — nice work!",
    weak: "Work on aspirated vs unaspirated pairs (b/p, d/t, g/k) and tricky sounds like zh, ch, sh, and x.",
  },
  final: {
    strong: "Your final vowels and endings sound natural.",
    weak: "Pay attention to endings: -in vs -ing, -an vs -ang, and the ü vowel. Exaggerate them until they stick.",
  },
};

function FocusCard({
  catLabel, value, isStrength,
}: { catLabel: "tone" | "initial" | "final"; value: number; isStrength: boolean }) {
  const tips = CATEGORY_TIPS[catLabel];
  const label = catLabel === "tone" ? "Tone" : catLabel === "initial" ? "Initial consonant" : "Final vowel";
  if (isStrength) {
    return (
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40" data-testid={`strength-card-${catLabel}`}>
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{value}%</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{tips.strong}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40" data-testid={`needs-work-card-${catLabel}`}>
      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center shrink-0">
        <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{value}%</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{tips.weak}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="font-bold text-foreground text-sm">{score}%</p>
    </div>
  );
};

function ProgressInsights({ recordings }: { recordings: any[] }) {
  const scoredRecs = useMemo(() =>
    recordings.filter(r => r.feedback?.[0]?.overallScore != null),
    [recordings]
  );

  const sortedByDate = useMemo(() =>
    [...scoredRecs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [scoredRecs]
  );

  const stats = useMemo(() => {
    if (scoredRecs.length === 0) return null;
    const avgScore = Math.round(
      scoredRecs.reduce((s, r) => s + r.feedback[0].overallScore, 0) / scoredRecs.length
    );
    const bestScore = Math.max(...scoredRecs.map(r => r.feedback[0].overallScore));
    const thisMonthCount = scoredRecs.filter(r => isThisMonth(new Date(r.createdAt))).length;
    const recent5 = sortedByDate.slice(-5);
    const prev5 = sortedByDate.slice(-10, -5);
    const recent5Avg = recent5.length > 0
      ? recent5.reduce((s, r) => s + r.feedback[0].overallScore, 0) / recent5.length : null;
    const prev5Avg = prev5.length > 0
      ? prev5.reduce((s, r) => s + r.feedback[0].overallScore, 0) / prev5.length : null;
    const trend = (recent5Avg !== null && prev5Avg !== null) ? recent5Avg - prev5Avg : null;
    return { avgScore, bestScore, thisMonthCount, trend };
  }, [scoredRecs, sortedByDate]);

  const catAvgs = useMemo(() => {
    const allCR = scoredRecs.flatMap(r =>
      (r.feedback[0].characterRatings || []).filter((cr: any) => typeof cr.tone === "number")
    );
    if (allCR.length === 0) return null;
    return {
      tone: Math.round(allCR.reduce((s: number, cr: any) => s + cr.tone, 0) / allCR.length),
      initial: Math.round(allCR.reduce((s: number, cr: any) => s + cr.initial, 0) / allCR.length),
      final: Math.round(allCR.reduce((s: number, cr: any) => s + cr.final, 0) / allCR.length),
      count: allCR.length,
    };
  }, [scoredRecs]);

  const chartData = useMemo(() =>
    sortedByDate.slice(-20).map((r, i) => ({
      idx: i + 1,
      score: r.feedback[0].overallScore,
      date: format(new Date(r.createdAt), "MMM d"),
      sentence: r.sentenceText,
    })),
    [sortedByDate]
  );

  const focusAreas = useMemo(() => {
    if (!catAvgs) return null;
    const cats = [
      { key: "tone" as const, value: catAvgs.tone },
      { key: "initial" as const, value: catAvgs.initial },
      { key: "final" as const, value: catAvgs.final },
    ].sort((a, b) => b.value - a.value);
    const best = cats[0];
    const worst = cats[cats.length - 1];
    return { strength: best, needsWork: worst, showDiff: best.value !== worst.value };
  }, [catAvgs]);

  if (scoredRecs.length === 0) return null;

  const { avgScore, bestScore, thisMonthCount, trend } = stats!;

  return (
    <div className="space-y-4" data-testid="progress-insights">

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Avg score */}
        <Card className="border-border/60" data-testid="stat-avg-score">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Score</span>
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className={`text-3xl font-bold font-display tabular-nums ${getScoreTextColor(avgScore)}`}>{avgScore}%</p>
            {trend !== null && (
              <div className={`flex items-center gap-0.5 mt-1 text-[11px] font-medium ${
                trend > 2 ? "text-emerald-600" : trend < -2 ? "text-primary" : "text-muted-foreground"
              }`}>
                {trend > 2 ? <TrendingUp className="w-3 h-3" /> : trend < -2 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {trend > 2 ? `+${Math.round(trend)}% vs before` : trend < -2 ? `${Math.round(trend)}% vs before` : "Steady"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Best score */}
        <Card className="border-border/60" data-testid="stat-best-score">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Best</span>
              <Award className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className={`text-3xl font-bold font-display tabular-nums ${getScoreTextColor(bestScore)}`}>{bestScore}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">personal best</p>
          </CardContent>
        </Card>

        {/* Total recordings */}
        <Card className="border-border/60" data-testid="stat-total">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Scored</span>
              <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold font-display tabular-nums text-foreground">{scoredRecs.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {recordings.length > scoredRecs.length ? `of ${recordings.length} total` : "recordings"}
            </p>
          </CardContent>
        </Card>

        {/* This month */}
        <Card className="border-border/60" data-testid="stat-this-month">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">This Month</span>
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold font-display tabular-nums text-foreground">{thisMonthCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{format(new Date(), "MMMM")}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Score over time chart ──────────────────────────────── */}
      {chartData.length >= 3 && (
        <Card className="border-border/60" data-testid="score-trend-chart">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <CardTitle className="text-base font-display">Score Trend</CardTitle>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Last {chartData.length} recorded
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <ReferenceLine y={75} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                  dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground text-right pr-3 mt-1">
              Dashed line = 75% target
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Pronunciation breakdown + focus areas ────────────── */}
      {catAvgs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Category bars */}
          <Card className="border-border/60" data-testid="pronunciation-breakdown">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-base font-display">Pronunciation Breakdown</CardTitle>
              <CardDescription>
                Averaged across {catAvgs.count} character{catAvgs.count !== 1 ? "s" : ""} you've recorded
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-5">
              <CategoryBar label="Tone" value={catAvgs.tone} />
              <CategoryBar label="Initial consonant" value={catAvgs.initial} />
              <CategoryBar label="Final vowel" value={catAvgs.final} />

              {/* Legend */}
              <div className="flex items-center gap-4 pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">≥75% Strong</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-muted-foreground">50–74% Developing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-[10px] text-muted-foreground">&lt;50% Needs work</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths and focus */}
          {focusAreas && focusAreas.showDiff && (
            <Card className="border-border/60" data-testid="focus-areas">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-base font-display">What to Focus On</CardTitle>
                <CardDescription>Based on your pronunciation history</CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <FocusCard
                  catLabel={focusAreas.strength.key}
                  value={focusAreas.strength.value}
                  isStrength={true}
                />
                <FocusCard
                  catLabel={focusAreas.needsWork.key}
                  value={focusAreas.needsWork.value}
                  isStrength={false}
                />
                {scoredRecs.length >= 3 && (
                  <div className="pt-2 border-t border-border/40">
                    <Link href="/practice-list">
                      <Button variant="outline" size="sm" className="w-full rounded-full text-xs" data-testid="go-to-practice-list">
                        <Target className="w-3.5 h-3.5 mr-1.5" />
                        View saved error list
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Calendar ──────────────────────────────────────────────────────────────────

interface RecordingEntry {
  id: number;
  sentenceText: string;
}

function JournalCalendar({ recordings, initialDate }: { recordings: any[]; initialDate?: Date }) {
  const [currentMonth, setCurrentMonth] = useState(initialDate ? startOfMonth(initialDate) : new Date());

  const firstRecordingDate = useMemo(() => {
    if (!recordings || recordings.length === 0) return new Date();
    const dates = recordings.map((r: any) => new Date(r.createdAt));
    return dates.reduce((earliest, d) => (d < earliest ? d : earliest), dates[0]);
  }, [recordings]);

  const canGoBack = isBefore(startOfMonth(firstRecordingDate), startOfMonth(currentMonth));
  const canGoForward = isBefore(startOfMonth(currentMonth), startOfMonth(new Date()));

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDayOfWeek = startOfMonth(currentMonth).getDay();

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    recordings?.forEach((r: any) => {
      const key = format(new Date(r.createdAt), "yyyy-MM-dd");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [recordings]);

  const recordingsByDay = useMemo(() => {
    const map = new Map<string, RecordingEntry[]>();
    recordings?.forEach((r: any) => {
      const key = format(new Date(r.createdAt), "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push({ id: r.id, sentenceText: r.sentenceText });
      map.set(key, arr);
    });
    return map;
  }, [recordings]);

  const maxCount = useMemo(() => {
    let max = 0;
    countsByDay.forEach((v) => { if (v > max) max = v; });
    return max;
  }, [countsByDay]);

  const getIntensity = (count: number) => {
    if (count === 0) return "";
    if (maxCount <= 1) return "bg-primary/70 text-primary-foreground";
    const ratio = count / maxCount;
    if (ratio >= 0.75) return "bg-primary text-primary-foreground";
    if (ratio >= 0.5) return "bg-primary/70 text-primary-foreground";
    if (ratio >= 0.25) return "bg-primary/40 text-foreground font-semibold";
    return "bg-primary/20 text-foreground font-bold";
  };

  return (
    <Card className="border-border/60" data-testid="journal-calendar">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-display">Practice Journal</CardTitle>
            <span className="text-xs text-muted-foreground">
              ({recordings?.length || 0} total)
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={!canGoBack}
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              data-testid="calendar-prev-month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-sm font-normal min-w-[100px] text-center" data-testid="calendar-month-label">
              {format(currentMonth, "MMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={!canGoForward}
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              data-testid="calendar-next-month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-3">
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-xs text-center font-normal text-muted-foreground py-0.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = countsByDay.get(key) || 0;
            const today = isToday(day);
            const future = isBefore(new Date(), startOfDay(day));
            const entries = recordingsByDay.get(key) || [];

            const dayCell = (
              <div
                className={`h-9 rounded flex items-center justify-center relative transition-colors ${
                  count > 0 ? "cursor-pointer" : ""
                } ${
                  future
                    ? "text-muted-foreground/30"
                    : count > 0
                      ? getIntensity(count)
                      : "bg-muted/20 text-muted-foreground"
                } ${today ? "ring-1.5 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                data-testid={`calendar-day-${key}`}
              >
                <span className={`text-sm leading-none ${count > 0 ? "font-bold" : "font-normal"}`}>{format(day, "d")}</span>
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none">
                    {count}
                  </span>
                )}
              </div>
            );

            if (count > 0) {
              return (
                <Popover key={key}>
                  <PopoverTrigger asChild>
                    {dayCell}
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-3" side="top" align="center">
                    <p className="text-xs font-semibold mb-1.5">{format(day, "MMM d, yyyy")}</p>
                    <p className="text-[11px] text-muted-foreground mb-2">{count} recording{count > 1 ? "s" : ""}</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {entries.map((entry) => (
                        <Link key={entry.id} href={`/recordings/${entry.id}`}>
                          <div
                            className="text-xs bg-muted/50 hover:bg-primary/10 hover:text-primary rounded px-2 py-1.5 truncate cursor-pointer transition-colors flex items-center gap-1.5"
                            title={entry.sentenceText}
                            data-testid={`popover-recording-${entry.id}`}
                          >
                            <Mic2 className="w-3 h-3 shrink-0 opacity-50" />
                            <span className="truncate">{entry.sentenceText}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            return <div key={key}>{dayCell}</div>;
          })}
        </div>
        <div className="flex items-center justify-end mt-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-muted/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/20" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/40" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/70" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recordings list ───────────────────────────────────────────────────────────

function getTimeGroup(date: Date): string {
  const now = new Date();
  if (isThisWeek(date, { weekStartsOn: 0 })) return "This Week";
  if (isThisMonth(date)) return "Earlier This Month";
  const months = differenceInMonths(now, date);
  if (months <= 1) return "Last Month";
  if (months < 6) return format(date, "MMMM");
  return format(date, "MMMM yyyy");
}

function GroupedRecordingsList({ recordings, childLookup }: { recordings: any[]; childLookup?: any[] }) {
  const { grouped, childrenMap } = useMemo(() => {
    const idSet = new Set(recordings.map((r: any) => r.id));
    const source = childLookup ?? recordings;
    const childrenMap = new Map<number, any[]>();
    for (const rec of source) {
      if (rec.parentRecordingId && idSet.has(rec.parentRecordingId)) {
        const arr = childrenMap.get(rec.parentRecordingId) || [];
        if (!arr.some((x: any) => x.id === rec.id)) {
          arr.push(rec);
          childrenMap.set(rec.parentRecordingId, arr);
        }
      }
    }
    const sorted = [...recordings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const groups: { label: string; items: any[] }[] = [];
    let currentLabel = "";
    for (const rec of sorted) {
      const label = getTimeGroup(new Date(rec.createdAt));
      if (label !== currentLabel) {
        groups.push({ label, items: [] });
        currentLabel = label;
      }
      groups[groups.length - 1].items.push(rec);
    }
    return { grouped: groups, childrenMap };
  }, [recordings, childLookup]);

  if (recordings.length === 0) return null;

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" data-testid={`group-header-${group.label}`}>
            {group.label}
          </h3>
          <div className="space-y-3">
            {group.items.map((recording: any) => {
              const children = (childrenMap.get(recording.id) || []).sort(
                (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
              return (
                <div key={recording.id}>
                  <RecordingCard recording={recording} />
                  {children.length > 0 && (
                    <div className="ml-3 mt-2 pl-3 border-l-2 border-primary/25 space-y-2">
                      {children.map((child: any) => (
                        <RecordingCard key={child.id} recording={child} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordingCard({ recording }: { recording: any }) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteRecording = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/recordings/${recording.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/balance"] });
      toast({ title: "Recording deleted", description: "The recording has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete the recording.", variant: "destructive" });
    },
  });

  const isRefunded = recording.creditsRefunded && recording.creditCost > 0;
  const score = recording.feedback?.[0]?.overallScore ?? null;

  return (
    <>
    <Link href={`/recordings/${recording.id}`}>
    <Card className="hover:shadow-md transition-shadow duration-200 border-border/50 cursor-pointer overflow-hidden" data-testid={`recording-card-${recording.id}`}>
      <div className="h-1 w-full bg-muted/40">
        <div
          className={`h-full transition-all duration-700 ${
            score !== null ? getScoreBgColor(score) : "bg-primary/30 w-full"
          }`}
          style={score !== null ? { width: `${score}%` } : undefined}
        />
      </div>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
              <Mic className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-medium mb-1">{recording.sentenceText}</h3>
              {getPhraseEnglish(recording.sentenceText) && (
                <p className="text-base text-muted-foreground mb-1">{getPhraseEnglish(recording.sentenceText)}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                </span>
                {isRefunded && (
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" data-testid={`refunded-badge-${recording.id}`}>
                    <RotateCcw className="w-3 h-3 mr-1" /> Refunded
                  </Badge>
                )}
                {recording.feedback?.[0] && (
                  <RatingBadge rating={recording.feedback[0].rating} overallScore={recording.feedback[0].overallScore} />
                )}
              </div>
              <div className="mt-3 bg-muted/30 px-3 py-2 rounded-lg border border-border/50" onClick={(e) => e.stopPropagation()}>
                <audio
                  key={recording.audioUrl}
                  src={recording.audioUrl}
                  controls
                  className="w-full h-7"
                  preload="metadata"
                />
              </div>
              {recording.feedback?.[0]?.textFeedback && (
                <div className="mt-2 bg-primary/5 rounded-lg p-2.5 border border-primary/10">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80 italic line-clamp-2">
                      &ldquo;{recording.feedback[0].textFeedback}&rdquo;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteDialog(true); }}
              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              data-testid={`delete-recording-${recording.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Recording</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this recording and any associated feedback. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteRecording.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRecording.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LearnerPortal() {
  const { data: recordings, isLoading } = useRecordings() as { data: any[]; isLoading: boolean };
  const { toast } = useToast();
  const searchString = useSearch();
  const [, navigate] = useLocation();

  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);

  const dateFilter = useMemo(() => {
    const d = params.get("date");
    if (!d) return null;
    try { return parseISO(d); } catch { return null; }
  }, [params]);

  useEffect(() => {
    if (params.get("checkout") === "success") {
      toast({ title: "Credits added!", description: "Your purchase was successful." });
    } else if (params.get("checkout") === "cancel") {
      toast({ title: "Checkout cancelled", description: "No charges were made.", variant: "destructive" });
    }
  }, [searchString]);

  const allRecordingsList = recordings || [];

  const filteredList = useMemo(() => {
    if (!dateFilter) return allRecordingsList;
    return allRecordingsList.filter((r: any) => isSameDay(new Date(r.createdAt), dateFilter));
  }, [allRecordingsList, dateFilter]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-5 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">My Progress</h1>
            <p className="text-muted-foreground mt-1">Track your recordings and feedback</p>
          </div>
          <Link href="/record">
            <Button className="rounded-full shadow-lg shadow-primary/20" data-testid="new-recording-btn">
              <Mic2 className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>

        {/* Stats and charts — only shown when there's scored data */}
        <ProgressInsights recordings={allRecordingsList} />

        <JournalCalendar recordings={recordings || []} initialDate={dateFilter ?? undefined} />

        {dateFilter && (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3" data-testid="date-filter-banner">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">Recordings from {format(dateFilter, "MMMM d, yyyy")}</span>
              <span className="text-muted-foreground">· {filteredList.length} result{filteredList.length !== 1 ? "s" : ""}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => navigate("/learner-portal")} data-testid="clear-date-filter">
              Clear filter
            </Button>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-display">All Recordings</h2>
          </div>
          {filteredList.length > 0 ? (
            <GroupedRecordingsList recordings={filteredList} childLookup={allRecordingsList} />
          ) : (
            <div className="text-center py-14 bg-muted/10 rounded-2xl border border-dashed border-border">
              <Mic2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium">{dateFilter ? "No recordings on this day" : "No recordings yet"}</h3>
              <p className="text-muted-foreground mt-2 mb-5 text-sm">
                {dateFilter ? "Try a different date or clear the filter." : "Start your journey by recording your first sentence!"}
              </p>
              {dateFilter ? (
                <Button variant="outline" onClick={() => navigate("/learner-portal")} data-testid="clear-date-filter-empty">Show all recordings</Button>
              ) : (
                <Link href="/record">
                  <Button data-testid="first-recording-btn">Record Now</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
