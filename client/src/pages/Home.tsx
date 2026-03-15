import { useState, useCallback, useRef, useEffect } from "react";
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
import { Mic2, PlayCircle, Clock, CheckCircle2, AlertCircle, UserCircle, Zap, Volume2, Loader2, X, Compass } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDailyChallenge, phraseToText, type ToneChar } from "@/data/phrases";
import { apiRequest } from "@/lib/queryClient";

const TONE_COLORS: Record<number, string> = {
  1: "text-red-600 dark:text-red-400",
  2: "text-yellow-600 dark:text-yellow-400",
  3: "text-green-600 dark:text-green-400",
  4: "text-blue-600 dark:text-blue-400",
  0: "text-gray-500 dark:text-gray-400",
};

const TONE_PINYIN_COLORS: Record<number, string> = {
  1: "text-red-500 dark:text-red-400",
  2: "text-yellow-500 dark:text-yellow-400",
  3: "text-green-500 dark:text-green-400",
  4: "text-blue-500 dark:text-blue-400",
  0: "text-gray-400 dark:text-gray-500",
};

function DailyToneChar({ toneChar }: { toneChar: ToneChar }) {
  const isPunctuation = !toneChar.pinyin || /[，。！？、；：]/.test(toneChar.char);
  return (
    <span className="inline-flex flex-col items-center mx-[1px]">
      {!isPunctuation && (
        <span className={`text-xs leading-tight font-medium ${TONE_PINYIN_COLORS[toneChar.tone]}`}>
          {toneChar.pinyin}
        </span>
      )}
      <span className={`text-2xl font-medium leading-tight ${isPunctuation ? "text-foreground/60" : TONE_COLORS[toneChar.tone]}`}>
        {toneChar.char}
      </span>
    </span>
  );
}

function DrawerToneChar({ toneChar }: { toneChar: ToneChar }) {
  const isPunctuation = !toneChar.pinyin || /[，。！？、；：]/.test(toneChar.char);
  return (
    <span className="inline-flex flex-col items-center mx-[1px]">
      {!isPunctuation && (
        <span className={`text-sm leading-tight font-medium ${TONE_PINYIN_COLORS[toneChar.tone]}`}>
          {toneChar.pinyin}
        </span>
      )}
      <span className={`text-2xl font-medium leading-tight ${isPunctuation ? "text-foreground/60" : TONE_COLORS[toneChar.tone]}`}>
        {toneChar.char}
      </span>
    </span>
  );
}

function usePhraseAudio() {
  const [loadingPhrase, setLoadingPhrase] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());

  const playPhrase = useCallback(async (text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const cached = audioCache.current.get(text);
    if (cached) {
      const audio = new Audio(cached);
      audioRef.current = audio;
      audio.play().catch(console.error);
      return;
    }

    setLoadingPhrase(text);
    try {
      const res = await apiRequest("POST", "/api/phrase-audio/generate", { text });
      const data = await res.json();
      audioCache.current.set(text, data.audioUrl);
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      audio.play().catch(console.error);
    } catch (err) {
      console.error("Failed to generate phrase audio:", err);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } finally {
      setLoadingPhrase(null);
    }
  }, []);

  return { playPhrase, loadingPhrase };
}

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
  const { setSpotlightHref } = useTourSpotlight();

  useEffect(() => {
    return () => setSpotlightHref(null);
  }, [setSpotlightHref]);

  const tourItems = [
    { href: "/record", icon: Mic2, label: "Record New", desc: "Record yourself speaking Chinese phrases and submit for review." },
    { href: "/learner-portal", icon: PlayCircle, label: "My Progress", desc: "Track your recordings and see detailed feedback from reviewers." },
    { href: "/profile", icon: UserCircle, label: "Profile", desc: "Set your Chinese level, manage your subscription, and customize your experience." },
  ];

  return (
    <Card className="border-border bg-muted/60" data-testid="app-tour-banner">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-3xl">Welcome to Marlow!</h3>
                <p className="text-base text-muted-foreground mt-1">Here's a quick look at what you can do:</p>
              </div>
              <ul className="space-y-4">
                {tourItems.map(({ href, icon: Icon, label, desc }) => (
                  <li
                    key={href}
                    className="flex items-start gap-3 cursor-default rounded-lg px-3 py-2 -mx-3 transition-colors hover:bg-primary/5"
                    onMouseEnter={() => setSpotlightHref(href)}
                    onMouseLeave={() => setSpotlightHref(null)}
                    data-testid={`tour-item-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Icon className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                    <span className="text-lg"><strong>{label}</strong> — {desc}</span>
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
  const { playPhrase, loadingPhrase } = usePhraseAudio();
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
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
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Link href="/profile?highlight=chineseLevel">
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors" data-testid="daily-challenge-level">
                        {dailyChallenge.level} ✎
                      </Badge>
                    </Link>
                    <button
                      onClick={() => playPhrase(challengeText)}
                      disabled={!!loadingPhrase}
                      className="p-1 rounded-full hover:bg-primary/10 transition-colors"
                      data-testid="daily-challenge-play-btn"
                    >
                      {loadingPhrase === challengeText ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-x-0.5" data-testid="daily-challenge-characters">
                    {dailyChallenge.characters.map((tc, i) => (
                      <DailyToneChar key={i} toneChar={tc} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="daily-challenge-english">
                    {dailyChallenge.english}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="rounded-full shadow-md"
                  data-testid="daily-challenge-record-btn"
                  onClick={() => setDrawerOpen(true)}
                >
                  <Mic2 className="mr-2 h-5 w-5" />
                  Record This
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent data-testid="recording-drawer">
            <DrawerHeader className="text-center">
              <DrawerTitle>Record Daily Challenge</DrawerTitle>
              <DrawerDescription>{dailyChallenge.english}</DrawerDescription>
              <div className="flex flex-wrap items-end justify-center gap-x-0.5 mt-3" data-testid="drawer-phrase-characters">
                {dailyChallenge.characters.map((tc, i) => (
                  <DrawerToneChar key={i} toneChar={tc} />
                ))}
              </div>
            </DrawerHeader>
            <div className="px-4 pb-8">
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
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10 cursor-pointer hover:shadow-md transition-shadow" data-testid="stat-reviewed">
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
