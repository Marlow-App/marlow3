import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useRecording } from "@/hooks/use-recordings";
import { useCreateFeedback } from "@/hooks/use-feedback";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, MessageSquare, Mic, GraduationCap, MapPin } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { type User as SharedUser } from "@shared/schema";

function RatingDisplay({ rating }: { rating: number | null | undefined }) {
  if (!rating) return null;

  const levels = [
    { value: 1, label: "Needs Improvement", color: "bg-gray-400", activeGlow: "shadow-gray-400/40", textColor: "text-gray-600" },
    { value: 2, label: "Good", color: "bg-amber-400", activeGlow: "shadow-amber-400/40", textColor: "text-amber-600" },
    { value: 3, label: "Excellent", color: "bg-emerald-400", activeGlow: "shadow-emerald-400/40", textColor: "text-emerald-600" },
  ];

  const active = levels.find((l) => l.value === rating);

  return (
    <div className="flex items-center gap-1.5" data-testid={`rating-display-${rating}`}>
      <div className="flex items-center gap-1 bg-muted/40 rounded-full px-2 py-1">
        {levels.map((level) => (
          <div
            key={level.value}
            className={`w-3 h-3 rounded-full transition-all ${
              level.value <= rating
                ? `${level.color} ${level.value === rating ? `shadow-md ${level.activeGlow}` : ""}`
                : "bg-muted-foreground/15"
            }`}
          />
        ))}
      </div>
      {active && (
        <span className={`text-[11px] font-semibold ${active.textColor}`}>{active.label}</span>
      )}
    </div>
  );
}

function RatingSelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const levels = [
    { value: 1, label: "Needs Improvement", color: "bg-gray-400", shadow: "shadow-[0_0_8px_rgba(156,163,175,0.6)]", textColor: "text-gray-600 dark:text-gray-400" },
    { value: 2, label: "Good", color: "bg-amber-400", shadow: "shadow-[0_0_8px_rgba(251,191,36,0.6)]", textColor: "text-amber-600 dark:text-amber-400" },
    { value: 3, label: "Excellent", color: "bg-emerald-400", shadow: "shadow-[0_0_8px_rgba(52,211,153,0.6)]", textColor: "text-emerald-600 dark:text-emerald-400" },
  ];

  const activeLevel = levels.find((l) => l.value === value);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Rating</label>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-muted/40 rounded-full px-3 py-2">
          {levels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`w-4 h-4 rounded-full transition-all duration-200 cursor-pointer hover:scale-125 ${
                value === level.value
                  ? `${level.color} ${level.shadow} scale-110`
                  : "bg-muted-foreground/15 hover:bg-muted-foreground/30"
              }`}
              data-testid={`rating-dot-${level.value}`}
              aria-label={level.label}
            />
          ))}
        </div>
        <div className="overflow-hidden min-w-0 flex-1 relative">
          {activeLevel && (
            <span className={`text-sm font-semibold ${activeLevel.textColor} whitespace-nowrap block`}>{activeLevel.label}</span>
          )}
          <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent pointer-events-none" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {levels.map((level) => {
          const isActive = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`text-left px-3 py-2 rounded-lg border transition-all duration-150 ${
                isActive
                  ? `border-current ${level.textColor} bg-current/5`
                  : "border-transparent hover:bg-muted/50"
              }`}
              data-testid={`rating-btn-${level.value}`}
            >
              <span className={`text-sm font-medium ${isActive ? level.textColor : "text-foreground/80"}`}>
                {level.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RecordingDetail() {
  const { id } = useParams<{ id: string }>();
  const recordingId = parseInt(id || "0");
  const { data: recording, isLoading: loadingRecording } = useRecording(recordingId);
  const { data: user, isLoading: loadingUser } = useQuery<SharedUser>({ queryKey: ["/api/auth/user"] });
  const createFeedback = useCreateFeedback(recordingId);
  const { uploadFile, isUploading } = useUpload();
  const { toast } = useToast();
  
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isRecordingFeedback, setIsRecordingFeedback] = useState(false);

  const isLoading = loadingRecording || loadingUser;
  const backUrl = user?.role === 'reviewer' ? "/reviewer-hub" : "/learner-portal";

  const handleFeedbackSubmit = async (audioFile?: File) => {
    if (!feedbackText.trim() && !audioFile) {
      toast({
        title: "Empty Feedback",
        description: "Please provide either text or audio feedback.",
        variant: "destructive",
      });
      return;
    }

    if (!rating) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      let audioUrl = undefined;
      
      if (audioFile) {
        const uploadRes = await uploadFile(audioFile);
        if (uploadRes) {
          audioUrl = uploadRes.objectPath;
        }
      }

      await createFeedback.mutateAsync({
        recordingId,
        textFeedback: feedbackText,
        audioFeedbackUrl: audioUrl,
        rating,
      });

      toast({
        title: "Feedback Sent",
        description: "Your feedback has been saved.",
      });
      
      setFeedbackText("");
      setRating(null);
      setIsRecordingFeedback(false);
      
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to submit feedback.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !recording) {
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
      <div className="max-w-4xl mx-auto space-y-8 animate-in">
        <div className="flex items-center gap-2">
           <Link href={backUrl}>
             <Button variant="ghost" size="sm">
               <ChevronLeft className="w-4 h-4 mr-1" />
               Back
             </Button>
           </Link>
           <h1 className="text-xl font-medium text-muted-foreground">
             Recording #{id} by {recording.user?.firstName || recording.user?.email || "Unknown User"}
           </h1>
        </div>

        <div className={`grid grid-cols-1 ${user?.role === 'reviewer' ? 'lg:grid-cols-3' : ''} gap-8`}>
          <div className={`${user?.role === 'reviewer' ? 'lg:col-span-2' : ''} space-y-6`}>
            <Card className="border-border shadow-md overflow-hidden">
              <div className="h-2 bg-primary w-full"></div>
              <CardContent className="p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-display font-bold text-foreground mb-4 leading-tight">
                    {recording.sentenceText}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={recording.status === 'reviewed' ? 'default' : 'secondary'} className="px-3 py-1">
                      {recording.status.toUpperCase()}
                    </Badge>
                    {recording.user?.chineseLevel && (
                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md" data-testid="learner-level-badge">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="font-medium text-xs">{recording.user.chineseLevel}</span>
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground">
                      Submitted on {format(new Date(recording.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Learner Audio</h3>
                    <audio 
                      key={recording.audioUrl}
                      controls 
                      className="w-full"
                      preload="auto"
                      playsInline
                      onError={(e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
                        const target = e.currentTarget;
                        const error = target.error;
                        console.error("Audio playback error:", {
                          code: error?.code,
                          message: error?.message,
                        });
                      }}
                    >
                      <source src={recording.audioUrl} />
                      Your browser does not support the audio element.
                    </audio>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Feedback History
              </h3>
              
              {recording.feedback && recording.feedback.length > 0 ? (
                recording.feedback.map((item: any) => (
                  <Card key={item.id} className="bg-secondary/5 border-secondary/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                          {item.reviewer?.firstName?.[0] || "R"}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground" data-testid={`reviewer-name-${item.id}`}>
                                  {item.reviewer ? `${item.reviewer.firstName || ''} ${item.reviewer.lastName || ''}`.trim() || 'Reviewer' : 'Reviewer'}
                                </span>
                                {item.reviewer?.city && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`reviewer-city-${item.id}`}>
                                    <MapPin className="w-3 h-3" />
                                    {item.reviewer.city}
                                  </span>
                                )}
                              </div>
                              <RatingDisplay rating={item.rating} />
                            </div>
                            <span className="text-xs text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                          
                          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {item.textFeedback}
                          </p>
                          
                          {item.audioFeedbackUrl && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Audio Correction</p>
                              <audio 
                                controls 
                                className="w-full h-10"
                                preload="auto"
                                playsInline
                              >
                                <source src={item.audioFeedbackUrl} type={item.audioFeedbackUrl.endsWith('.mp4') ? 'audio/mp4' : 'audio/webm'} />
                              </audio>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground italic bg-muted/20 rounded-xl">
                  No feedback provided yet.
                </div>
              )}
            </div>
          </div>

          {user?.role === 'reviewer' && (
            <div className="space-y-6">
              <Card className="shadow-lg border-t-4 border-t-secondary sticky top-8">
                <CardHeader>
                  <CardTitle>Add Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RatingSelector value={rating} onChange={setRating} />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Detailed Comments</label>
                    <Textarea 
                      placeholder="Provide specific feedback on tones and pronunciation..."
                      className="min-h-[150px] resize-none"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                  </div>

                  <Separator />
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Audio Correction (Optional)</label>
                    {isRecordingFeedback ? (
                       <AudioRecorder 
                         onRecordingComplete={handleFeedbackSubmit}
                         isUploading={isUploading || createFeedback.isPending}
                       />
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsRecordingFeedback(true)}
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Record Audio Response
                      </Button>
                    )}
                  </div>

                  {!isRecordingFeedback && (
                    <Button 
                      className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      onClick={() => handleFeedbackSubmit()}
                      disabled={createFeedback.isPending || !feedbackText.trim() || !rating}
                    >
                      {createFeedback.isPending ? "Submitting..." : "Submit Text Feedback"}
                    </Button>
                  )}
                  
                  {isRecordingFeedback && (
                     <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setIsRecordingFeedback(false)}>
                       Cancel Recording
                     </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
