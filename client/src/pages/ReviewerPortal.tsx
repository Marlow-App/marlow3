import { useState } from "react";
import { Layout } from "@/components/Layout";
import { usePendingRecordings, useAllRecordings } from "@/hooks/use-recordings";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, PlayCircle, ArrowRight, User as UserIcon, GraduationCap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function RatingBadge({ rating }: { rating: number | null | undefined }) {
  if (!rating) return null;
  const config: Record<number, { label: string; dots: string[]; textColor: string }> = {
    1: { label: "Needs Work", dots: ["bg-gray-400", "bg-muted-foreground/15", "bg-muted-foreground/15"], textColor: "text-gray-500" },
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

export default function ReviewerPortal() {
  const { data: pendingRecordings, isLoading: loadingPending } = usePendingRecordings();
  const { data: allRecordings, isLoading: loadingAll } = useAllRecordings();

  const reviewedRecordings = allRecordings?.filter((r: any) => r.status === 'reviewed') || [];

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
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 rounded-xl">
            <TabsTrigger value="pending" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md">
              Pending
              <Badge variant="secondary" className="ml-auto text-xs">
                {pendingRecordings?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg data-[state=active]:shadow-md">
              Completed
              <Badge variant="outline" className="ml-auto text-xs">
                {reviewedRecordings.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4">
              {pendingRecordings?.map((recording) => (
                <Card key={recording.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary-foreground flex items-center justify-center shrink-0">
                          <Mic className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-1">{recording.sentenceText}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                             <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md">
                               <UserIcon className="w-3.5 h-3.5" />
                               <span className="font-medium text-foreground/80">
                                 {(recording as any).user?.firstName || (recording as any).user?.email?.split('@')[0] || "Learner"}
                               </span>
                             </div>
                             {(recording as any).user?.chineseLevel && (
                               <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                                 <GraduationCap className="w-3.5 h-3.5" />
                                 <span className="font-medium text-xs">{(recording as any).user.chineseLevel}</span>
                               </div>
                             )}
                             <span>Submitted {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link href={`/recordings/${recording.id}`}>
                          <Button className="w-full md:w-auto group">
                            Review Now
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {(!pendingRecordings || pendingRecordings.length === 0) && (
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
              {reviewedRecordings.map((recording) => (
                <Card key={recording.id} className="hover:shadow-md transition-shadow duration-200 bg-muted/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <PlayCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-medium mb-1">{recording.sentenceText}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                             <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded-md">
                               <UserIcon className="w-3.5 h-3.5" />
                               <span className="font-medium text-foreground/80">
                                 {(recording as any).user?.firstName || (recording as any).user?.email?.split('@')[0] || "Learner"}
                               </span>
                             </div>
                             {(recording as any).user?.chineseLevel && (
                               <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                                 <GraduationCap className="w-3.5 h-3.5" />
                                 <span className="font-medium text-xs">{(recording as any).user.chineseLevel}</span>
                               </div>
                             )}
                             <span>Reviewed {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
                             {(recording as any).feedback?.[0]?.rating && (
                               <RatingBadge rating={(recording as any).feedback[0].rating} />
                             )}
                             <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Reviewed</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link href={`/recordings/${recording.id}`}>
                          <Button variant="outline" className="w-full md:w-auto">
                            View Feedback
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {reviewedRecordings.length === 0 && (
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
