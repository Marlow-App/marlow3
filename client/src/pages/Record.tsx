import { useState } from "react";
import { Layout } from "@/components/Layout";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useUpload } from "@/hooks/use-upload";
import { useCreateRecording } from "@/hooks/use-recordings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ChevronLeft, Info } from "lucide-react";

const SUGGESTED_SENTENCES = [
  "你好，很高兴认识你。(Nǐ hǎo, hěn gāoxìng rènshí nǐ.)",
  "我要去北京学习中文。(Wǒ yào qù Běijīng xuéxí Zhōngwén.)",
  "请问，洗手间在哪里？(Qǐngwèn, xǐshǒujiān zài nǎlǐ?)",
  "这个菜有点辣。(Zhège cài yǒudiǎn là.)"
];

export default function RecordPage() {
  const [text, setText] = useState("");
  const { uploadFile, isUploading } = useUpload();
  const createRecording = useCreateRecording();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleRecordingComplete = async (file: File) => {
    if (!text.trim()) {
      toast({
        title: "Sentence Required",
        description: "Please enter or select a sentence before recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Upload file
      const uploadRes = await uploadFile(file);
      if (!uploadRes) throw new Error("Upload failed");

      // 2. Create DB record
      await createRecording.mutateAsync({
        audioUrl: uploadRes.objectPath, // Always use the normalized /objects/ path
        sentenceText: text,
      });

      toast({
        title: "Success!",
        description: "Your recording has been submitted for review.",
      });

      setLocation("/");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 animate-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold font-display">New Recording</h1>
        </div>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sentence" className="text-base font-medium">
                    What sentence are you practicing?
                  </Label>
                  <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setText(SUGGESTED_SENTENCES[Math.floor(Math.random() * SUGGESTED_SENTENCES.length)])}>
                    Random Suggestion
                  </Button>
                </div>
                
                <Textarea
                  id="sentence"
                  placeholder="Type the Chinese sentence here..."
                  className="min-h-[100px] text-lg resize-none bg-muted/20 focus:bg-background transition-colors"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <div className="flex flex-wrap gap-2 mt-2">
                  {SUGGESTED_SENTENCES.slice(0, 2).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setText(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors border border-secondary/20 truncate max-w-full"
                    >
                      {s.slice(0, 20)}...
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted/30 p-4 border-b border-border/50 flex gap-3 items-start">
                 <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                 <p className="text-sm text-muted-foreground">
                   Ensure your microphone is close. Speak naturally and clearly.
                 </p>
              </div>
              <AudioRecorder 
                onRecordingComplete={handleRecordingComplete} 
                isUploading={isUploading || createRecording.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
