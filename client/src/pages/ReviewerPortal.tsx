import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { usePendingRecordings, useAllRecordings } from "@/hooks/use-recordings";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, PlayCircle, ArrowRight, User as UserIcon, GraduationCap, ArrowUpDown, MessageSquare, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    <span className={`text-xs font-semibold ${c.textColor}`} data-testid={`rating-label-${rating}`}>{c.label}</span>
  );
}

function RecordingCard({ recording, showReviewButton = true }: { recording: any; showReviewButton?: boolean }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary-foreground flex items-center justify-center shrink-0">
              {showReviewButton ? <Mic className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-medium">{recording.sentenceText}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="font-medium text-foreground/80">
                    {recording.user?.firstName || recording.user?.email?.split('@')[0] || "Learner"}
                  </span>
                </div>
                {recording.user?.chineseLevel && (
                  <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span className="font-medium text-xs">{recording.user.chineseLevel}</span>
                  </div>
                )}
                <span>{showReviewButton ? 'Submitted' : 'Reviewed'} {formatDistanceToNow(new Date(!showReviewButton && recording.feedback?.[0]?.createdAt ? recording.feedback[0].createdAt : recording.createdAt), { addSuffix: true })}</span>
                {!showReviewButton && (recording.feedback?.[0]?.rating || recording.feedback?.[0]?.overallScore) && (
                  <RatingBadge rating={recording.feedback[0].rating} overallScore={recording.feedback[0].overallScore} />
                )}
                {!showReviewButton && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Reviewed</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link href={`/recordings/${recording.id}`}>
              <Button className={`w-full md:w-auto ${showReviewButton ? '' : ''}`} variant={showReviewButton ? 'default' : 'outline'}>
                {showReviewButton ? (
                  <>Review Now <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  'View Feedback'
                )}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  "Technical Issue": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  "Bug Report": "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  "Feature Request": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "Billing Question": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  "Other": "bg-muted text-muted-foreground border-border",
};

function TicketCard({ ticket, onResolve, resolving }: { ticket: any; onResolve: (id: number) => void; resolving: boolean }) {
  const isOpen = ticket.status === "open";
  const submitterName = ticket.user?.firstName
    ? `${ticket.user.firstName}${ticket.user.lastName ? " " + ticket.user.lastName : ""}`
    : ticket.user?.email?.split("@")[0] || "Unknown user";
  const resolverName = ticket.resolvedBy?.firstName
    ? `${ticket.resolvedBy.firstName}${ticket.resolvedBy.lastName ? " " + ticket.resolvedBy.lastName : ""}`
    : ticket.resolvedBy?.email?.split("@")[0] || "Reviewer";

  return (
    <Card className={`transition-shadow duration-200 ${isOpen ? "hover:shadow-md" : "opacity-75"}`} data-testid={`ticket-card-${ticket.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
                <span className="font-medium text-sm text-foreground/80">{submitterName}</span>
              </div>
              <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[ticket.category] ?? CATEGORY_COLORS["Other"]}`}>
                {ticket.category}
              </Badge>
              {isOpen ? (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                  Open
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                  Completed
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0 mt-1">
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{ticket.message}</p>

          {!isOpen && ticket.resolvedAt && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Marked complete by {resolverName} on {format(new Date(ticket.resolvedAt), "MMM d, yyyy")}
            </p>
          )}

          {isOpen && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
                onClick={() => onResolve(ticket.id)}
                disabled={resolving}
                data-testid={`button-resolve-ticket-${ticket.id}`}
              >
                {resolving ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Resolving…</>
                ) : (
                  <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Mark as Completed</>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewerPortal() {
  const { data: pendingRecordings, isLoading: loadingPending } = usePendingRecordings();
  const { data: allRecordings, isLoading: loadingAll } = useAllRecordings();
  const { data: tickets, isLoading: loadingTickets } = useQuery<any[]>({
    queryKey: ["/api/support/tickets"],
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const reviewedRecordings = allRecordings?.filter((r: any) => r.status === 'reviewed') || [];

  const sortRecordings = (list: any[], useFeedbackDate = false) => {
    return [...list].sort((a, b) => {
      const dateA = new Date(useFeedbackDate && a.feedback?.[0]?.createdAt ? a.feedback[0].createdAt : a.createdAt).getTime();
      const dateB = new Date(useFeedbackDate && b.feedback?.[0]?.createdAt ? b.feedback[0].createdAt : b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const allPending = useMemo(() => sortRecordings(pendingRecordings || []), [pendingRecordings, sortOrder]);
  const sortedReviewed = useMemo(() => sortRecordings(reviewedRecordings, true), [reviewedRecordings, sortOrder]);

  const openTickets = useMemo(() => (tickets || []).filter((t: any) => t.status === "open"), [tickets]);
  const completedTickets = useMemo(() => (tickets || []).filter((t: any) => t.status === "completed"), [tickets]);

  const resolveMutation = useMutation({
    mutationFn: (ticketId: number) => apiRequest("PATCH", `/api/support/tickets/${ticketId}/resolve`, {}),
    onMutate: (ticketId) => setResolvingId(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      toast({ title: "Ticket marked as completed" });
    },
    onError: () => {
      toast({ title: "Failed to resolve ticket", variant: "destructive" });
    },
    onSettled: () => setResolvingId(null),
  });

  if (loadingPending || loadingAll) {
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
      <div className="max-w-3xl mx-auto space-y-8 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Reviewer Portal</h1>
            <p className="text-muted-foreground mt-1">Manage learner recordings and feedback</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            data-testid="sort-toggle"
          >
            <ArrowUpDown className="w-4 h-4 mr-1.5" />
            {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 rounded-xl">
            <TabsTrigger value="pending" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-pending">
              Waiting
              <Badge variant="secondary" className="ml-auto text-xs" data-testid="pending-count">
                {allPending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-reviewed">
              Completed
              <Badge variant="outline" className="ml-auto text-xs" data-testid="reviewed-count">
                {sortedReviewed.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-support">
              <MessageSquare className="w-4 h-4" />
              Support
              {openTickets.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" data-testid="open-tickets-count">
                  {openTickets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4">
              {allPending.map((recording: any) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
              {allPending.length === 0 && (
                <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlayCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-medium">All caught up!</h3>
                  <p className="text-muted-foreground mt-2">No pending recordings to review.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviewed" className="mt-6">
            <div className="grid gap-4">
              {sortedReviewed.map((recording: any) => (
                <RecordingCard key={recording.id} recording={recording} showReviewButton={false} />
              ))}
              {sortedReviewed.length === 0 && (
                <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                  <h3 className="text-xl font-medium">No reviewed clips yet</h3>
                  <p className="text-muted-foreground mt-2">Start reviewing to see your completed work here.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            {loadingTickets ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                {openTickets.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Open ({openTickets.length})
                    </h3>
                    <div className="grid gap-3">
                      {openTickets.map((ticket: any) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onResolve={(id) => resolveMutation.mutate(id)}
                          resolving={resolvingId === ticket.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {completedTickets.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Resolved ({completedTickets.length})
                    </h3>
                    <div className="grid gap-3">
                      {completedTickets.map((ticket: any) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onResolve={(id) => resolveMutation.mutate(id)}
                          resolving={resolvingId === ticket.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {openTickets.length === 0 && completedTickets.length === 0 && (
                  <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-medium">No support tickets yet</h3>
                    <p className="text-muted-foreground mt-2">Tickets submitted by users will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
