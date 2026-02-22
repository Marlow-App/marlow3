import { Layout } from "@/components/Layout";
import { useRecordings } from "@/hooks/use-recordings";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic2, MessageCircle, Clock, CheckCircle2, ChevronRight, ChevronLeft, Crown, Loader2, MapPin, Calendar } from "lucide-react";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isToday, isBefore, startOfDay, isThisWeek, isThisMonth, differenceInMonths } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
    if (ratio >= 0.25) return "bg-primary/40 text-primary-foreground";
    return "bg-primary/20 text-foreground";
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
            <span className="text-xs font-medium min-w-[100px] text-center" data-testid="calendar-month-label">
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
        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-[11px] text-center font-medium text-muted-foreground py-0.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7" />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = countsByDay.get(key) || 0;
            const today = isToday(day);
            const future = isBefore(new Date(), startOfDay(day));
            const entries = recordingsByDay.get(key) || [];

            const dayCell = (
              <div
                className={`h-7 rounded flex items-center justify-center text-xs relative transition-colors ${
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
                <span className="text-xs font-medium leading-none">{format(day, "d")}</span>
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

function GroupedRecordingsList({ recordings }: { recordings: any[] }) {
  const grouped = useMemo(() => {
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
    return groups;
  }, [recordings]);

  if (recordings.length === 0) return null;

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" data-testid={`group-header-${group.label}`}>
            {group.label}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.items.map((recording: any) => (
              <RecordingCard key={recording.id} recording={recording} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordingCard({ recording }: { recording: any }) {
  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors" data-testid={`recording-card-${recording.id}`}>
      <CardContent className="p-4 space-y-2.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{recording.sentenceText}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Badge
            variant={recording.status === "reviewed" ? "default" : "secondary"}
            className="rounded-full px-2 shrink-0 text-[10px]"
          >
            {recording.status === "reviewed" ? (
              <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Reviewed</span>
            ) : (
              "Pending"
            )}
          </Badge>
        </div>
        <div className="bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50">
          <audio
            key={recording.audioUrl}
            src={recording.audioUrl}
            controls
            className="w-full h-7"
            preload="metadata"
          />
        </div>
        {recording.status === "reviewed" && recording.feedback?.[0] ? (
          <div className="space-y-2">
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
                  <p className="text-xs text-foreground/80 mt-1 italic truncate">
                    &ldquo;{recording.feedback[0].textFeedback}&rdquo;
                  </p>
                </div>
              </div>
            </div>
            <Link href={`/recordings/${recording.id}`}>
              <Button variant="outline" size="sm" className="w-full text-xs h-7">
                View Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
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
  );
}

export default function LearnerPortal() {
  const { data: recordings, isLoading } = useRecordings() as { data: any[]; isLoading: boolean };
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const searchString = useSearch();

  const { data: products } = useQuery<any[]>({
    queryKey: ["/api/stripe/products"],
  });

  const { data: subscriptionData } = useQuery<any>({
    queryKey: ["/api/stripe/subscription"],
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("checkout") === "success") {
      toast({ title: "Subscription activated!", description: "Welcome to your new plan." });
    } else if (params.get("checkout") === "cancel") {
      toast({ title: "Checkout cancelled", description: "No charges were made.", variant: "destructive" });
    }
  }, [searchString]);

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const res = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await apiRequest("POST", "/api/stripe/portal", {});
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Error", description: "Unable to open billing portal.", variant: "destructive" });
    }
  };

  const hasSubscription = !!subscriptionData?.subscription;

  const getProductPrice = (productName: string) => {
    const product = products?.find((p: any) => p.name === productName);
    return product?.prices?.[0];
  };

  const pendingRecordings = useMemo(
    () => recordings?.filter((r: any) => r.status === "pending") || [],
    [recordings]
  );

  const reviewedRecordings = useMemo(
    () => recordings?.filter((r: any) => r.status === "reviewed") || [],
    [recordings]
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

        <Tabs defaultValue="waiting" className="w-full" data-testid="recordings-tabs">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 rounded-xl">
            <TabsTrigger value="waiting" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-waiting">
              Waiting Review
              <Badge variant="secondary" className="ml-auto text-xs">
                {pendingRecordings.length}
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
            {pendingRecordings.length > 0 ? (
              <GroupedRecordingsList recordings={pendingRecordings} />
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
              <GroupedRecordingsList recordings={reviewedRecordings} />
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

        <div className="mt-10 relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/6 to-transparent" />
          <div
            className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -top-20 -left-20 w-56 h-56 rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)" }}
          />
          <div className="relative p-6 space-y-5">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">Level Up Your Practice</p>
              <h2 className="text-xl font-display font-bold">Go Pro</h2>
            </div>

            {hasSubscription ? (
              <Card className="border-green-500/30 bg-background/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-green-600 fill-green-600" />
                    <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">Active</span>
                  </div>
                  <CardTitle className="text-xl font-display">
                    {subscriptionData?.subscription?.product_name || "Pro Plan"}
                  </CardTitle>
                  <CardDescription className="text-sm">Your subscription is active.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleManageSubscription}
                    data-testid="manage-subscription-btn"
                  >
                    Manage Subscription
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <Card className="border-secondary/30 bg-background/80 backdrop-blur-sm shadow-lg relative overflow-hidden">
                  <div
                    className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)" }}
                  />
                  <CardHeader className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-secondary fill-secondary" />
                      <span className="text-secondary font-bold uppercase tracking-widest text-[10px]">Starter</span>
                    </div>
                    <CardTitle className="text-xl font-display">Pro Starter</CardTitle>
                    <CardDescription className="text-sm">Perfect for consistent daily practice.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 relative">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                      <p className="text-sm">Up to 5 recordings / day</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                      <p className="text-sm">24h feedback guarantee</p>
                    </div>
                  </CardContent>
                  <CardFooter className="relative">
                    <Button
                      className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold shadow-sm"
                      disabled={!!checkoutLoading}
                      onClick={() => {
                        const price = getProductPrice("Pro Starter");
                        if (price) handleCheckout(price.id);
                      }}
                      data-testid="checkout-starter-btn"
                    >
                      {checkoutLoading === getProductPrice("Pro Starter")?.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                        </>
                      ) : (
                        "Upgrade $4.99/mo"
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border-primary/30 bg-background/80 backdrop-blur-sm shadow-lg relative overflow-hidden ring-2 ring-primary/20">
                  <div
                    className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
                  />
                  <CardHeader className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-primary fill-primary" />
                      <span className="text-primary font-bold uppercase tracking-widest text-[10px]">Advanced</span>
                    </div>
                    <CardTitle className="text-xl font-display">Pro Max</CardTitle>
                    <CardDescription className="text-sm">For serious learners seeking immersion.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 relative">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                      <p className="text-sm">Up to 15 recordings / day</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                      <p className="text-sm">Priority 24h feedback</p>
                    </div>
                  </CardContent>
                  <CardFooter className="relative">
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                      disabled={!!checkoutLoading}
                      onClick={() => {
                        const price = getProductPrice("Pro Max");
                        if (price) handleCheckout(price.id);
                      }}
                      data-testid="checkout-max-btn"
                    >
                      {checkoutLoading === getProductPrice("Pro Max")?.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                        </>
                      ) : (
                        "Upgrade $9.99/mo"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
