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
import { ChevronLeft, User, MessageSquare, Play, Mic } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { type User as SharedUser } from "@shared/schema";

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
      });

      toast({
        title: "Feedback Sent",
        description: "Your feedback has been saved.",
      });
      
      setFeedbackText("");
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
           <h1 className="text-xl font-medium text-muted-foreground">Recording #{id}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Audio & Transcript */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-md overflow-hidden">
              <div className="h-2 bg-primary w-full"></div>
              <CardContent className="p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-display font-bold text-foreground mb-4 leading-tight">
                    {recording.sentenceText}
                  </h2>
                  <div className="flex items-center gap-3">
                    <Badge variant={recording.status === 'reviewed' ? 'default' : 'secondary'} className="px-3 py-1">
                      {recording.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Submitted on {format(new Date(recording.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Learner Audio</h3>
                  <audio 
                    src={recording.audioUrl} 
                    controls 
                    className="w-full"
                    preload="auto"
                    playsInline
                    onCanPlay={() => console.log("Audio can play")}
                    onPlay={() => console.log("Audio playing")}
                    onWaiting={() => console.log("Audio waiting")}
                    onStalled={() => console.warn("Audio stalled")}
                    onSuspend={() => console.warn("Audio suspended")}
                    onAbort={() => console.warn("Audio aborted")}
                    onEmptied={() => console.warn("Audio emptied")}
                    onEncrypted={() => console.warn("Audio encrypted")}
                    onError={(e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
                      const target = e.currentTarget;
                      const error = target.error;
                      console.error("Audio playback error details:", {
                        code: error?.code,
                        message: error?.message,
                        networkState: target.networkState,
                        readyState: target.readyState,
                        src: target.src
                      });
                    }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </CardContent>
            </Card>

            {/* Existing Feedback */}
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
                          E
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline mb-2">
                            <span className="font-bold text-foreground">Expert Reviewer</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, HH:mm')}</span>
                          </div>
                          
                          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {item.textFeedback}
                          </p>
                          
                          {item.audioFeedbackUrl && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Audio Correction</p>
                              <audio src={item.audioFeedbackUrl} controls className="w-full h-10" />
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

          {/* Sidebar: Feedback Form (Only visible if not reviewed or for experts) */}
          <div className="space-y-6">
            <Card className="shadow-lg border-t-4 border-t-secondary sticky top-8">
              <CardHeader>
                <CardTitle>Add Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    disabled={createFeedback.isPending || !feedbackText.trim()}
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
        </div>
      </div>
    </Layout>
  );
}
