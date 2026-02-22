import { Layout } from "@/components/Layout";
import { useRecordings } from "@/hooks/use-recordings";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic2, MessageCircle, Clock, CheckCircle2, ChevronRight, ChevronLeft, Crown, Loader2, MapPin, Calendar } from "lucide-react";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <CardTitle className="text-base font-display">Practice Journal</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canGoBack}
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              data-testid="calendar-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center" data-testid="calendar-month-label">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canGoForward}
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              data-testid="calendar-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-[10px] text-center font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = countsByDay.get(key) || 0;
            const today = isToday(day);
            const future = isBefore(new Date(), startOfDay(day));

            return (
              <div
                key={key}
                className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs relative transition-colors ${
                  future
                    ? "text-muted-foreground/30"
                    : count > 0
                      ? getIntensity(count)
                      : "bg-muted/30 text-muted-foreground"
                } ${today ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                title={count > 0 ? `${count} recording${count > 1 ? "s" : ""} on ${format(day, "MMM d")}` : format(day, "MMM d")}
                data-testid={`calendar-day-${key}`}
              >
                <span className="text-[11px] font-medium leading-none">{format(day, "d")}</span>
                {count > 0 && (
                  <span className="text-[9px] leading-none mt-0.5 font-bold">{count}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {recordings?.length || 0} total recordings
          </span>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary/70" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecordingCard({ recording }: { recording: any }) {
  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors" data-testid={`recording-card-${recording.id}`}>
      <CardHeader className="bg-muted/30 pb-3 pt-4 px-5">
        <div className="flex justify-between items-start">
          <div className="space-y-0.5 flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{recording.sentenceText}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge
            variant={recording.status === "reviewed" ? "default" : "secondary"}
            className="rounded-full px-2.5 shrink-0 ml-2"
          >
            {recording.status === "reviewed" ? (
              <span className="flex items-center gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Reviewed</span>
            ) : (
              <span className="text-xs">Pending</span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
          <audio
            key={recording.audioUrl}
            src={recording.audioUrl}
            controls
            className="w-full h-10"
            preload="metadata"
          />
        </div>
        {recording.status === "reviewed" && recording.feedback?.[0] ? (
          <div className="space-y-3">
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-primary">
                      {recording.feedback[0].reviewer
                        ? `${recording.feedback[0].reviewer.firstName || ""} ${recording.feedback[0].reviewer.lastName || ""}`.trim() || "Reviewer"
                        : "Native Speaker Feedback"}
                    </p>
                    {recording.feedback[0].reviewer?.city && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {recording.feedback[0].reviewer.city}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 mt-1 italic truncate">
                    &ldquo;{recording.feedback[0].textFeedback}&rdquo;
                  </p>
                </div>
              </div>
            </div>
            <Link href={`/recordings/${recording.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Full Details <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-2 text-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground italic">
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
      <div className="space-y-6 animate-in">
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
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="waiting" className="flex items-center gap-2" data-testid="tab-waiting">
              Waiting Review
              <Badge variant="secondary" className="ml-auto text-xs">
                {pendingRecordings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2" data-testid="tab-completed">
              Completed
              <Badge variant="outline" className="ml-auto text-xs">
                {reviewedRecordings.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waiting" className="mt-4">
            <div className="grid gap-4">
              {pendingRecordings.map((recording: any) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
              {pendingRecordings.length === 0 && (
                <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border">
                  <CheckCircle2 className="w-10 h-10 text-green-500/40 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-sm text-muted-foreground mt-1">No recordings waiting for review.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <div className="grid gap-4">
              {reviewedRecordings.map((recording: any) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
              {reviewedRecordings.length === 0 && (
                <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed border-border">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="text-lg font-medium">No feedback yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">Your reviewed recordings will appear here.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {(!recordings || recordings.length === 0) && (
          <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed border-border">
            <Mic2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium">No recordings yet</h3>
            <p className="text-muted-foreground mt-2 mb-6">Start your journey by recording your first sentence!</p>
            <Link href="/record">
              <Button data-testid="first-recording-btn">Record Now</Button>
            </Link>
          </div>
        )}

        {hasSubscription ? (
          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 via-transparent to-transparent">
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
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 via-transparent to-transparent relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-secondary fill-secondary" />
                  <span className="text-secondary font-bold uppercase tracking-widest text-[10px]">Starter</span>
                </div>
                <CardTitle className="text-xl font-display">Pro Starter</CardTitle>
                <CardDescription className="text-sm">Perfect for consistent daily practice.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                  <p className="text-sm">Up to 5 recordings / day</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                  <p className="text-sm">24h feedback guarantee</p>
                </div>
              </CardContent>
              <CardFooter>
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

            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent relative overflow-hidden ring-2 ring-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary fill-primary" />
                  <span className="text-primary font-bold uppercase tracking-widest text-[10px]">Advanced</span>
                </div>
                <CardTitle className="text-xl font-display">Pro Max</CardTitle>
                <CardDescription className="text-sm">For serious learners seeking immersion.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                  <p className="text-sm">Up to 15 recordings / day</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                  <p className="text-sm">Priority 24h feedback</p>
                </div>
              </CardContent>
              <CardFooter>
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
    </Layout>
  );
}
