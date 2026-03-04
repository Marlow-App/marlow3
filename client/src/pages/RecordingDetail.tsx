import { useParams, Link, useLocation } from "wouter";
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
import { ChevronLeft, MessageSquare, Mic, GraduationCap, MapPin, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type User as SharedUser, type CharacterRating } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function extractChineseChars(text: string): string[] {
  const matches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  return matches || [];
}

const RATING_OPTIONS = [
  { value: 0, label: "Poor", shortLabel: "差", color: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", activeColor: "bg-red-500 text-white border-red-500" },
  { value: 50, label: "OK", shortLabel: "可", color: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800", activeColor: "bg-amber-500 text-white border-amber-500" },
  { value: 100, label: "Great", shortLabel: "优", color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", activeColor: "bg-emerald-500 text-white border-emerald-500" },
];

const DIMENSIONS = [
  { key: "initial" as const, chinese: "声母", english: "Initial" },
  { key: "final" as const, chinese: "韵母", english: "Final" },
  { key: "tone" as const, chinese: "声调", english: "Tone" },
];

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return null;
  let color = "text-red-600 dark:text-red-400";
  if (score >= 70) color = "text-emerald-600 dark:text-emerald-400";
  else if (score >= 40) color = "text-amber-600 dark:text-amber-400";
  return (
    <span className={`text-lg font-bold ${color}`} data-testid={`score-badge-${score}`}>
      {score}%
    </span>
  );
}

function OldRatingDisplay({ rating }: { rating: number | null | undefined }) {
  if (!rating) return null;
  const labels: Record<number, string> = { 1: "Needs Improvement", 2: "Good", 3: "Excellent" };
  const colors: Record<number, string> = { 1: "text-gray-600", 2: "text-amber-600", 3: "text-emerald-600" };
  return <span className={`text-sm font-semibold ${colors[rating] || ""}`}>{labels[rating] || ""}</span>;
}

function CharacterRatingDisplay({ ratings, isReviewer }: { ratings: CharacterRating[]; isReviewer?: boolean }) {
  return (
    <div className="space-y-2 mt-2" data-testid="character-ratings-display">
      <div className="grid gap-2">
        {ratings.map((cr, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
            <span className="text-lg font-bold w-8 text-center" data-testid={`char-display-${idx}`}>{cr.character}</span>
            <div className="flex gap-2 flex-1 flex-wrap">
              {DIMENSIONS.map((dim) => {
                const val = cr[dim.key];
                const opt = RATING_OPTIONS.find(o => o.value === val);
                return (
                  <div key={dim.key} className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">{isReviewer ? dim.chinese : dim.english}</span>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                      val === 100 ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" :
                      val === 50 ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" :
                      "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                    }`} data-testid={`char-rating-${idx}-${dim.key}`}>
                      {opt?.label || val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CharacterRatingInput({
  characters,
  ratings,
  onChange,
}: {
  characters: string[];
  ratings: CharacterRating[];
  onChange: (ratings: CharacterRating[]) => void;
}) {
  const handleChange = (charIdx: number, dim: "initial" | "final" | "tone", value: number) => {
    const updated = [...ratings];
    updated[charIdx] = { ...updated[charIdx], [dim]: value };
    onChange(updated);
  };

  const overallScore = useMemo(() => {
    if (ratings.length === 0) return null;
    const allSet = ratings.every(r => r.initial !== -1 && r.final !== -1 && r.tone !== -1);
    if (!allSet) return null;
    const total = ratings.reduce((sum, r) => sum + r.initial + r.final + r.tone, 0);
    return Math.round(total / (ratings.length * 3));
  }, [ratings]);

  if (characters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic p-3 bg-muted/20 rounded-lg">
        No Chinese characters found in the sentence text.
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="character-rating-input">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Character Ratings</label>
        {overallScore !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Overall:</span>
            <span className={`text-sm font-bold ${
              overallScore >= 70 ? "text-emerald-600 dark:text-emerald-400" :
              overallScore >= 40 ? "text-amber-600 dark:text-amber-400" :
              "text-red-600 dark:text-red-400"
            }`} data-testid="overall-score-live">{overallScore}%</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {characters.map((char, charIdx) => (
          <div key={charIdx} className="border border-border/50 rounded-lg p-3 bg-card" data-testid={`char-input-${charIdx}`}>
            <div className="text-2xl font-bold text-center mb-2" data-testid={`char-label-${charIdx}`}>{char}</div>
            <div className="space-y-2">
              {DIMENSIONS.map((dim) => {
                const currentVal = ratings[charIdx]?.[dim.key] ?? -1;
                return (
                  <div key={dim.key} className="flex items-center gap-2">
                    <span className="text-sm font-medium shrink-0">
                      {dim.chinese}
                    </span>
                    <div className="flex gap-1 flex-1">
                      {RATING_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleChange(charIdx, dim.key, opt.value)}
                          className={`flex-1 text-xs font-medium py-1.5 px-1 rounded border transition-all ${
                            currentVal === opt.value ? opt.activeColor : opt.color
                          } hover:opacity-80`}
                          data-testid={`rate-${charIdx}-${dim.key}-${opt.value}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
  const [isRecordingFeedback, setIsRecordingFeedback] = useState(false);

  const [, navigate] = useLocation();
  const isLoading = loadingRecording || loadingUser;
  const backUrl = user?.role === 'reviewer' ? "/reviewer-hub" : "/learner-portal";

  const characters = useMemo(() => {
    if (!recording) return [];
    return extractChineseChars(recording.sentenceText);
  }, [recording]);

  const [charRatings, setCharRatings] = useState<CharacterRating[]>([]);

  useMemo(() => {
    if (characters.length > 0 && charRatings.length !== characters.length) {
      setCharRatings(characters.map(c => ({ character: c, initial: -1 as any, final: -1 as any, tone: -1 as any })));
    }
  }, [characters]);

  const canDelete = user && recording && (
    recording.userId === user.id || user.role === "reviewer"
  );

  const deleteRecording = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/recordings/${recordingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      toast({ title: "Recording deleted", description: "The recording has been removed." });
      navigate(backUrl);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete the recording.", variant: "destructive" });
    },
  });

  const allRated = charRatings.length > 0 && charRatings.every(r => r.initial !== -1 && r.final !== -1 && r.tone !== -1);

  const handleFeedbackSubmit = async (audioFile?: File) => {
    if (!feedbackText.trim() && !audioFile) {
      toast({
        title: "Empty Feedback",
        description: "Please provide either text or audio feedback.",
        variant: "destructive",
      });
      return;
    }

    if (characters.length > 0 && !allRated) {
      toast({
        title: "Ratings Incomplete",
        description: "Please rate all characters before submitting.",
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

      const validRatings = charRatings.filter(r => r.initial !== -1 && r.final !== -1 && r.tone !== -1);

      await createFeedback.mutateAsync({
        recordingId,
        textFeedback: feedbackText,
        audioFeedbackUrl: audioUrl,
        characterRatings: validRatings.length > 0 ? validRatings : undefined,
      } as any);

      toast({
        title: "Feedback Sent",
        description: "Your feedback has been saved.",
      });
      
      setFeedbackText("");
      setCharRatings(characters.map(c => ({ character: c, initial: -1 as any, final: -1 as any, tone: -1 as any })));
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
        <div className="flex items-center justify-between">
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
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive" data-testid="delete-recording-btn">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Recording</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this recording and any associated feedback. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteRecording.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="confirm-delete-btn"
                  >
                    {deleteRecording.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
                              {item.overallScore !== null && item.overallScore !== undefined ? (
                                <ScoreBadge score={item.overallScore} />
                              ) : (
                                <OldRatingDisplay rating={item.rating} />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                          
                          {item.characterRatings && Array.isArray(item.characterRatings) && item.characterRatings.length > 0 && (
                            <CharacterRatingDisplay ratings={item.characterRatings as CharacterRating[]} isReviewer={user?.role === 'reviewer'} />
                          )}

                          {item.textFeedback && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Overall Comments</p>
                              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {item.textFeedback}
                              </p>
                            </div>
                          )}
                          
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
                  <CharacterRatingInput
                    characters={characters}
                    ratings={charRatings}
                    onChange={setCharRatings}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Detailed Comments</label>
                    <Textarea 
                      placeholder="Provide specific feedback on tones and pronunciation..."
                      className="min-h-[150px] resize-none"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      data-testid="feedback-text-input"
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
                        data-testid="record-audio-btn"
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
                      disabled={createFeedback.isPending || !feedbackText.trim() || (characters.length > 0 && !allRated)}
                      data-testid="submit-feedback-btn"
                    >
                      {createFeedback.isPending ? "Submitting..." : "Submit Text Feedback"}
                    </Button>
                  )}
                  
                  {isRecordingFeedback && (
                     <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setIsRecordingFeedback(false)} data-testid="cancel-recording-btn">
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
