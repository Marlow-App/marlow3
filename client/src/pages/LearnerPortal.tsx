import { Layout } from "@/components/Layout";
import { useRecordings } from "@/hooks/use-recordings";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic2, MessageCircle, Clock, CheckCircle2, ChevronRight, Crown, Zap, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function LearnerPortal() {
  const { data: recordings, isLoading } = useRecordings() as { data: any[], isLoading: boolean };

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
      <div className="space-y-8 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Learner Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your progress and feedback</p>
          </div>
          <Link href="/record">
            <Button className="rounded-full shadow-lg shadow-primary/20">
              <Mic2 className="w-4 h-4 mr-2" />
              New Recording
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {recordings?.map((recording) => (
            <Card key={recording.id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{recording.sentenceText}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={recording.status === "reviewed" ? "default" : "secondary"}
                    className="rounded-full px-3"
                  >
                    {recording.status === "reviewed" ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Reviewed</span>
                    ) : (
                      "Pending"
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                      <audio 
                        key={recording.audioUrl}
                        src={recording.audioUrl} 
                        controls 
                        className="w-full h-10"
                        preload="metadata"
                      />
                    </div>
                    {recording.status === "reviewed" && recording.feedback?.[0] ? (
                  <div className="space-y-4">
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-primary">Native Speaker Feedback</p>
                          <p className="text-sm text-foreground/80 mt-1 italic">
                            "{recording.feedback[0].textFeedback}"
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
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground italic">
                      Waiting for a native speaker to review your recording...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 via-transparent to-transparent relative overflow-hidden mt-8">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Crown className="w-48 h-48 rotate-12 text-secondary" />
            </div>
            
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                 <Crown className="w-6 h-6 text-secondary fill-secondary" />
                 <span className="text-secondary font-bold uppercase tracking-widest text-xs">Premium</span>
              </div>
              <CardTitle className="text-2xl font-display">Upgrade to SixTone Studio Pro</CardTitle>
              <CardDescription className="text-base">Accelerate your learning with faster feedback and more practice.</CardDescription>
            </CardHeader>
            
            <CardContent className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-background shadow-sm text-primary">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Priority Feedback</h4>
                  <p className="text-sm text-muted-foreground">Get reviews within 24 hours guaranteed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-background shadow-sm text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Unlimited Recordings</h4>
                  <p className="text-sm text-muted-foreground">Practice as much as you want every day.</p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4">
               <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold shadow-lg shadow-secondary/20 h-12">
                 Upgrade for $5/month
               </Button>
            </CardFooter>
          </Card>

          {(!recordings || recordings.length === 0) && (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border mt-8">
              <Mic2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium">No recordings yet</h3>
              <p className="text-muted-foreground mt-2 mb-6">Start your journey by recording your first sentence!</p>
              <Link href="/record">
                <Button>Record Now</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
