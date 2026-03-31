import { useState, useRef, useEffect } from "react";
import { getScoreBgColor, getScoreTextColor } from "@/lib/scoreColor";
import { useAuth } from "@/hooks/use-auth";
import { useRecordings, usePendingRecordings, useCreateRecording } from "@/hooks/use-recordings";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { useTourSpotlight } from "@/contexts/TourSpotlightContext";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Link } from "wouter";
import { Mic2, PlayCircle, Clock, CheckCircle2, AlertCircle, UserCircle, Zap, Loader2, X, Compass, BookOpen, Volume2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDailyChallenge, phraseToText, getPhraseEnglish } from "@/data/phrases";
import { SandhiPhraseDisplay } from "@/components/SandhiPhraseDisplay";
import { usePhraseAudio } from "@/hooks/use-phrase-audio";

function useAppTour() {
  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem("appTourSeen");
  });

  const dismissTour = () => {
    localStorage.setItem("appTourSeen", "1");
    setShowTour(false);
  };

  return { showTour, dismissTour };
}

function AppTourBanner({ onDismiss }: { onDismiss: () => void }) {
  const { setSpotlightHref, openMobileMenu } = useTourSpotlight();
  const clickedHref = useRef<string | null>(null);

  useEffect(() => {
    return () => setSpotlightHref(null);
  }, [setSpotlightHref]);

  const tourItems = [
    { href: "/record", icon: Mic2, label: "Record New", desc: "Record yourself speaking Chinese phrases and submit for review." },
    { href: "/learner-portal", icon: PlayCircle, label: "My Progress", desc: "Track your recordings and see detailed feedback from reviewers." },
    { href: "/practice-list", icon: BookOpen, label: "Practice List", desc: "Review your saved errors and drill the sounds you find most challenging." },
    { href: "/profile", icon: UserCircle, label: "Profile", desc: "Set your Chinese level, manage your credits, and customize your experience." },
  ];

  return (
    <Card className="border-border bg-muted/60" data-testid="app-tour-banner">
      <CardContent className="pt-4 pb-4 md:pt-6 md:pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div className="space-y-3 md:space-y-4">
              <div>
                <h3 className="font-semibold text-2xl md:text-3xl font-display">Welcome to Marlow!</h3>
                <p className="text-base text-muted-foreground mt-1">Here's a quick look at what you can do:</p>
              </div>
              <ul className="space-y-1 md:space-y-2">
                {tourItems.map(({ href, icon: Icon, label, desc }) => (
                  <li
                    key={href}
                    className="flex items-start gap-2 md:gap-3 cursor-pointer rounded-lg px-2 py-1 -mx-2 md:px-3 md:py-2 md:-mx-3 transition-colors hover:bg-primary/5"
                    onMouseEnter={() => setSpotlightHref(href)}
                    onMouseLeave={() => setSpotlightHref(clickedHref.current)}
                    onClick={() => { clickedHref.current = href; openMobileMenu(); setSpotlightHref(href); }}
                    data-testid={`tour-item-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-4 h-4 md:w-6 md:h-6 text-primary mt-0.5 shrink-0" />
                    <span className="text-base md:text-lg"><strong>{label}</strong> — {desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full hover:bg-primary/10 transition-colors shrink-0"
            data-testid="tour-dismiss-btn"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { user } = useAuth();
  const isReviewer = user?.role === "reviewer";
  const { data: recordings, isLoading } = useRecordings();
  const { data: pendingRecordings } = usePendingRecordings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();
  const { uploadFile, isUploading } = useUpload();
  const createRecording = useCreateRecording();
  const { playPhrase, isLoading: isPhraseLoading, anyLoading } = usePhraseAudio();
  const { showTour, dismissTour } = useAppTour();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const userLevel = user?.chineseLevel || "Beginner";
  const dailyChallenge = getDailyChallenge(userLevel);
  const challengeText = phraseToText(dailyChallenge);

  const handleRecordingComplete = async (file: File) => {
    try {
      const uploadRes = await uploadFile(file);
      if (!uploadRes) throw new Error("Upload failed");

      await createRecording.mutateAsync({
        audioUrl: uploadRes.objectPath,
        sentenceText: challengeText,
      });

      toast({
        title: "Success!",
        description: "Your recording has been submitted for review.",
      });

      setDrawerOpen(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to submit recording. Please try again.";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  if (isReviewer) {
    return (
      <Layout>
        <div className="space-y-8 animate-in">
          <header>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display">
              {greeting}, {user?.firstName || "Reviewer"}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {pendingRecordings?.length ? `There are ${pendingRecordings.length} recordings waiting for your expertise.` : "All recordings have been reviewed. Great job!"}
            </p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-4xl font-bold text-primary mb-1">
                      {pendingRecordings?.length || 0}
                    </div>
                    <div className="text-muted-foreground font-medium">Pending Reviews</div>
                  </div>
                  <Link href="/reviewer-hub">
                    <Button variant="outline" size="sm">Go to Hub</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-foreground mb-1">
                  {recordings?.filter(r => r.status === 'reviewed').length || 0}
                </div>
                <div className="text-muted-foreground font-medium">Your Completed Reviews</div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-bold font-display mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/reviewer-hub">
                <Button className="w-full justify-start h-16 text-lg" variant="outline">
                  <PlayCircle className="mr-3 h-6 w-6 text-primary" />
                  Start Reviewing
                </Button>
              </Link>
              <Link href="/profile">
                <Button className="w-full justify-start h-16 text-lg" variant="outline">
                  <UserCircle className="mr-3 h-6 w-6 text-primary" />
                  Manage Profile
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display">
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
        {showTour && !isReviewer && <AppTourBanner onDismiss={dismissTour} />}
      </div>

      <div className="space-y-8 mt-8">
        <section data-testid="daily-challenge-section">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-display">Daily Challenge</h2>
          </div>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20" data-testid="daily-challenge-card">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Link href="/profile?highlight=chineseLevel">
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors" data-testid="daily-challenge-level">
                        {dailyChallenge.level} ✎
                      </Badge>
                    </Link>
                    <div className="flex items-center gap-0.5" data-testid="daily-challenge-play-btns">
                      {(["M", "F"] as const).map((gender) => (
                        <button
                          key={gender}
                          onClick={() => playPhrase(challengeText, gender)}
                          disabled={anyLoading}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-primary/10 text-primary/70 hover:text-primary transition-colors text-[15px] font-bold"
                          data-testid={`daily-challenge-play-${gender.toLowerCase()}-btn`}
                        >
                          {isPhraseLoading(challengeText, gender) ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4" />
                              <span>{gender}</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="rounded-full shadow-md shrink-0"
                    data-testid="daily-challenge-record-btn"
                    onClick={() => setDrawerOpen(true)}
                  >
                    <Mic2 className="mr-2 h-5 w-5" />
                    Record This
                  </Button>
                </div>
                <div data-testid="daily-challenge-characters" className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                  <SandhiPhraseDisplay characters={dailyChallenge.characters} charSize="text-2xl" pinyinSize="text-xs" />
                </div>
                <p className="text-base text-muted-foreground" data-testid="daily-challenge-english">
                  {dailyChallenge.english}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="md:left-1/4 md:right-1/4 md:rounded-[10px]" data-testid="recording-drawer">
            <DrawerHeader className="text-center px-8 pt-6">
              <DrawerTitle>Record Daily Challenge</DrawerTitle>
              <DrawerDescription>{dailyChallenge.english}</DrawerDescription>
              <div className="flex justify-center mt-3" data-testid="drawer-phrase-characters">
                <SandhiPhraseDisplay characters={dailyChallenge.characters} charSize="text-2xl" pinyinSize="text-sm" />
              </div>
            </DrawerHeader>
            <div className="px-8 pb-8">
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                isUploading={isUploading || createRecording.isPending}
              />
            </div>
          </DrawerContent>
        </Drawer>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-display">Your Progress</h2>
            <Link href="/learner-portal" className="text-sm text-primary font-medium hover:underline">My Recordings</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/learner-portal?tab=completed">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="stat-reviewed">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-primary mb-1">
                    {recordings?.filter(r => r.status === 'reviewed').length || 0}
                  </div>
                  <div className="text-muted-foreground font-medium">Reviewed Recordings</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/learner-portal?tab=waiting">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="stat-pending">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-foreground mb-1">
                    {recordings?.filter(r => r.status === 'pending').length || 0}
                  </div>
                  <div className="text-muted-foreground font-medium">Pending Review</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/learner-portal?tab=waiting">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="stat-total">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-foreground mb-1">
                    {recordings?.length || 0}
                  </div>
                  <div className="text-muted-foreground font-medium">Total Recordings</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold font-display mb-6">Recent Activity</h2>
          
          <div className="grid gap-4">
            {recordings && recordings.length > 0 ? (
              recordings.map((recording) => {
                const isReviewed = recording.status === 'reviewed';
                const score = recording.feedback?.[0]?.overallScore;
                return (
                  <Link key={recording.id} href={`/recordings/${recording.id}`}>
                    <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden">
                      <div className="h-1 w-full bg-muted/40">
                        <div
                          className={`h-full transition-all duration-700 ${
                            isReviewed && score !== null && score !== undefined
                              ? getScoreBgColor(score)
                              : "bg-primary/30 w-full"
                          }`}
                          style={isReviewed && score !== null && score !== undefined ? { width: `${score}%` } : undefined}
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isReviewed ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}>
                              {isReviewed ? <PlayCircle className="w-6 h-6" /> : <Mic2 className="w-6 h-6" />}
                            </div>
                            <div>
                              <h3 className="text-xl font-medium mb-1">{recording.sentenceText}</h3>
                              {getPhraseEnglish(recording.sentenceText) && (
                                <p className="text-base text-muted-foreground mb-1">{getPhraseEnglish(recording.sentenceText)}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                                </span>
                                {isReviewed ? (
                                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Reviewed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Waiting review
                                  </Badge>
                                )}
                                {isReviewed && score !== null && score !== undefined && (
                                  <span className={`text-xs font-bold ${getScoreTextColor(score)}`}>
                                    {score}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
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
