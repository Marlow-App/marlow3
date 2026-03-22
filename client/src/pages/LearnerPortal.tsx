import { Layout } from "@/components/Layout";
import { useRecordings } from "@/hooks/use-recordings";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic2, MessageCircle, Clock, CheckCircle2, ChevronRight, ChevronLeft, Loader2, MapPin, Calendar, Trash2, RotateCcw } from "lucide-react";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isToday, isBefore, startOfDay, isThisWeek, isThisMonth, differenceInMonths } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function RatingBadge({ rating, overallScore }: { rating?: number | null; overallScore?: number | null }) {
  if (overallScore !== null && overallScore !== undefined) {
    let color = "text-red-600 dark:text-red-400";
    if (overallScore >= 70) color = "text-emerald-600 dark:text-emerald-400";
    else if (overallScore >= 40) color = "text-amber-600 dark:text-amber-400";
    return (
      <div className="flex items-center gap-1" data-testid={`score-badge-${overallScore}`}>
        <span className={`text-xs font-bold ${color}`}>{overallScore}%</span>
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

interface RecordingEntry {
  id: number;
  sentenceText: string;
}

function JournalCalendar({ recordings }: { recordings: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    // Look for children in the broader set (cross-status) when provided
    const source = childLookup ?? recordings;

    // Build children map: anything in source whose parent is one of our roots
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

    // Sort roots newest-first
    const sorted = [...recordings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Time-group the roots
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
                    <div className="ml-5 mt-2 pl-4 border-l-2 border-primary/25 space-y-2">
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

  return (
    <>
    <Link href={`/recordings/${recording.id}`}>
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer" data-testid={`recording-card-${recording.id}`}>
      <CardContent className="p-4 space-y-2.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{recording.sentenceText}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isRefunded && (
              <Badge variant="secondary" className="rounded-full px-2 text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200" data-testid={`refunded-badge-${recording.id}`}>
                <RotateCcw className="w-2.5 h-2.5 mr-1" />
                Refunded
              </Badge>
            )}
            <Badge
              variant={recording.status === "reviewed" ? "default" : "secondary"}
              className="rounded-full px-2 text-[10px]"
            >
              {recording.status === "reviewed" ? (
                <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Reviewed</span>
              ) : recording.parentRecordingId ? (
                "Re-recording pending"
              ) : (
                "Pending"
              )}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteDialog(true); }}
              className="h-6 w-6 text-muted-foreground"
              data-testid={`delete-recording-${recording.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50" onClick={(e) => e.stopPropagation()}>
          <audio
            key={recording.audioUrl}
            src={recording.audioUrl}
            controls
            className="w-full h-7"
            preload="metadata"
          />
        </div>
        {recording.status === "reviewed" && recording.feedback?.[0] ? (
          <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10">
            <div className="flex items-start gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-primary">
                    {recording.feedback[0].reviewer
                      ? `${recording.feedback[0].reviewer.firstName || ""} ${recording.feedback[0].reviewer.lastName || ""}`.trim() || "Reviewer"
                      : "Native Speaker Feedback"}
                  </p>
                  {recording.feedback[0].reviewer?.city && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MapPin className="w-2.5 h-2.5" />
                      {recording.feedback[0].reviewer.city}
                    </span>
                  )}
                </div>
                <RatingBadge rating={recording.feedback[0].rating} overallScore={recording.feedback[0].overallScore} />
                <p className="text-xs text-foreground/80 mt-1 italic truncate">
                  &ldquo;{recording.feedback[0].textFeedback}&rdquo;
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1 justify-center">
            <Clock className="w-4 h-4 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground italic">
              Waiting for review...
            </p>
          </div>
        )}
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

export default function LearnerPortal() {
  const { data: recordings, isLoading } = useRecordings() as { data: any[]; isLoading: boolean };
  const { toast } = useToast();
  const searchString = useSearch();

  const initialTab = useMemo(() => {
    const params = new URLSearchParams(searchString);
    const tab = params.get("tab");
    return tab === "completed" ? "completed" : "waiting";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("checkout") === "success") {
      toast({ title: "Credits added!", description: "Your purchase was successful." });
    } else if (params.get("checkout") === "cancel") {
      toast({ title: "Checkout cancelled", description: "No charges were made.", variant: "destructive" });
    }
  }, [searchString]);

  const allRecordingsList = recordings || [];

  const pendingRecordings = useMemo(
    () => recordings?.filter((r: any) => r.status === "pending") || [],
    [recordings]
  );

  const reviewedRecordings = useMemo(
    () => recordings?.filter((r: any) => r.status === "reviewed") || [],
    [recordings]
  );

  // Pending re-recordings whose parent is already reviewed are shown nested
  // in the Completed tab — hide them from Waiting Review to avoid duplication
  const reviewedIds = useMemo(
    () => new Set(reviewedRecordings.map((r: any) => r.id)),
    [reviewedRecordings]
  );

  const visiblePendingRecordings = useMemo(
    () => pendingRecordings.filter(
      (r: any) => !(r.parentRecordingId && reviewedIds.has(r.parentRecordingId))
    ),
    [pendingRecordings, reviewedIds]
  );

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
      <div className="space-y-5 animate-in">
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

        <JournalCalendar recordings={recordings || []} />

        <Tabs defaultValue={initialTab} className="w-full" data-testid="recordings-tabs">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 rounded-xl">
            <TabsTrigger value="waiting" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-waiting">
              Waiting Review
              <Badge variant="secondary" className="ml-auto text-xs">
                {visiblePendingRecordings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-completed">
              Completed
              <Badge variant="outline" className="ml-auto text-xs">
                {reviewedRecordings.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waiting" className="mt-4">
            {visiblePendingRecordings.length > 0 ? (
              <GroupedRecordingsList recordings={visiblePendingRecordings} />
            ) : (
              <div className="text-center py-10 bg-muted/10 rounded-2xl border border-dashed border-border">
                <CheckCircle2 className="w-8 h-8 text-green-500/40 mx-auto mb-2" />
                <h3 className="text-base font-medium">All caught up!</h3>
                <p className="text-sm text-muted-foreground mt-1">No recordings waiting for review.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {reviewedRecordings.length > 0 ? (
              <GroupedRecordingsList recordings={reviewedRecordings} childLookup={allRecordingsList} />
            ) : (
              <div className="text-center py-10 bg-muted/10 rounded-2xl border border-dashed border-border">
                <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <h3 className="text-base font-medium">No feedback yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Your reviewed recordings will appear here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {(!recordings || recordings.length === 0) && (
          <div className="text-center py-14 bg-muted/10 rounded-2xl border border-dashed border-border">
            <Mic2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-medium">No recordings yet</h3>
            <p className="text-muted-foreground mt-2 mb-5 text-sm">Start your journey by recording your first sentence!</p>
            <Link href="/record">
              <Button data-testid="first-recording-btn">Record Now</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
