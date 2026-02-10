import { useAuth } from "@/hooks/use-auth";
import { useRecordings } from "@/hooks/use-recordings";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Mic2, PlayCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { user } = useAuth();
  const { data: recordings, isLoading } = useRecordings();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Layout>
      <div className="space-y-8 animate-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {greeting}, {user?.firstName || "Learner"}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Ready to practice your tones today?
            </p>
          </div>
          <Link href="/record">
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90">
              <Mic2 className="mr-2 h-5 w-5" />
              Record New
            </Button>
          </Link>
        </header>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">Your Progress</h2>
            <Link href="/profile" className="text-sm text-primary font-medium hover:underline">View Stats</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary mb-1">
                  {recordings?.filter(r => r.status === 'reviewed').length || 0}
                </div>
                <div className="text-muted-foreground font-medium">Reviewed Recordings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-foreground mb-1">
                  {recordings?.filter(r => r.status === 'pending').length || 0}
                </div>
                <div className="text-muted-foreground font-medium">Pending Review</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-foreground mb-1">
                  {recordings?.length || 0}
                </div>
                <div className="text-muted-foreground font-medium">Total Recordings</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold font-display mb-6">Recent Activity</h2>
          
          <div className="space-y-4">
            {recordings && recordings.length > 0 ? (
              recordings.map((recording) => (
                <Link key={recording.id} href={`/recordings/${recording.id}`}>
                  <div className="group bg-card hover:bg-accent/50 border border-border/50 rounded-xl p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <PlayCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{recording.sentenceText}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      {recording.status === 'reviewed' ? (
                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Reviewed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium text-sm">
                        View Details →
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20">
                <Mic2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No recordings yet</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto mb-6">
                  Start your journey to perfect tones by recording your first sentence.
                </p>
                <Link href="/record">
                  <Button variant="outline">Start Recording</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
