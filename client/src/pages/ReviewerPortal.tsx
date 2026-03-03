import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { usePendingRecordings, useAllRecordings } from "@/hooks/use-recordings";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, PlayCircle, ArrowRight, User as UserIcon, GraduationCap, Crown, ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function RatingBadge({ rating }: { rating: number | null | undefined }) {
  if (!rating) return null;
  const config: Record<number, { label: string; dots: string[]; textColor: string }> = {
    1: { label: "Needs Improvement", dots: ["bg-gray-400", "bg-muted-foreground/15", "bg-muted-foreground/15"], textColor: "text-gray-500" },
    2: { label: "Good", dots: ["bg-gray-400", "bg-amber-400", "bg-muted-foreground/15"], textColor: "text-amber-600" },
    3: { label: "Excellent", dots: ["bg-gray-400", "bg-amber-400", "bg-emerald-400"], textColor: "text-emerald-600" },
  };
  const c = config[rating];
  if (!c) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {c.dots.map((dot, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${dot}`} />
        ))}
      </div>
      <span className={`text-[10px] font-semibold ${c.textColor}`}>{c.label}</span>
    </div>
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
                {recording.isPro && (
                  <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] py-0 px-1.5" data-testid={`pro-badge-${recording.id}`}>
                    <Crown className="w-2.5 h-2.5 mr-0.5" />
                    Pro
                  </Badge>
                )}
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
                <span>{showReviewButton ? 'Submitted' : 'Reviewed'} {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
                {!showReviewButton && recording.feedback?.[0]?.rating && (
                  <RatingBadge rating={recording.feedback[0].rating} />
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

export default function ReviewerPortal() {
  const { data: pendingRecordings, isLoading: loadingPending } = usePendingRecordings();
  const { data: allRecordings, isLoading: loadingAll } = useAllRecordings();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const reviewedRecordings = allRecordings?.filter((r: any) => r.status === 'reviewed') || [];

  const sortRecordings = (list: any[]) => {
    return [...list].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const proPending = useMemo(() => {
    const filtered = pendingRecordings?.filter((r: any) => r.isPro) || [];
    return sortRecordings(filtered);
  }, [pendingRecordings, sortOrder]);

  const freePending = useMemo(() => {
    const filtered = pendingRecordings?.filter((r: any) => !r.isPro) || [];
    return sortRecordings(filtered);
  }, [pendingRecordings, sortOrder]);

  const sortedReviewed = useMemo(() => sortRecordings(reviewedRecordings), [reviewedRecordings, sortOrder]);

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
      <div className="space-y-8 animate-in">
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

        <Tabs defaultValue="pro-pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 rounded-xl">
            <TabsTrigger value="pro-pending" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-pro-pending">
              <Crown className="w-3.5 h-3.5" />
              Pro Waiting
              <Badge variant="secondary" className="ml-auto text-xs" data-testid="pro-pending-count">
                {proPending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-pending">
              Waiting
              <Badge variant="secondary" className="ml-auto text-xs" data-testid="pending-count">
                {freePending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md" data-testid="tab-reviewed">
              Completed
              <Badge variant="outline" className="ml-auto text-xs" data-testid="reviewed-count">
                {sortedReviewed.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pro-pending" className="mt-6">
            <div className="grid gap-4">
              {proPending.map((recording: any) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
              {proPending.length === 0 && (
                <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-medium">No Pro recordings waiting</h3>
                  <p className="text-muted-foreground mt-2">Pro subscriber recordings will appear here for priority review.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4">
              {freePending.map((recording: any) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
              {freePending.length === 0 && (
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
        </Tabs>
      </div>
    </Layout>
  );
}
