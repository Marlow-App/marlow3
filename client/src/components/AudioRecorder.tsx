import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, RotateCcw, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  isUploading?: boolean;
}

export function AudioRecorder({ onRecordingComplete, isUploading }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
  };

  const handleSubmit = () => {
    if (audioBlob) {
      const mimeType = audioBlob.type || 'audio/webm';
      const extension = mimeType.includes('wav') ? 'wav' : 'webm';
      const file = new File([audioBlob], `recording-${Date.now()}.${extension}`, { type: mimeType });
      onRecordingComplete(file);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-card rounded-2xl border border-border/50 shadow-sm animate-in">
      {/* Visualizer / Status Area */}
      <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-muted/30">
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        )}
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
          isRecording ? "bg-red-50 text-primary scale-110 shadow-lg shadow-red-500/10" : "bg-muted text-muted-foreground"
        )}>
          {isRecording ? (
            <span className="font-mono font-bold text-xl">{formatTime(duration)}</span>
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!audioBlob ? (
          !isRecording ? (
            <Button 
              size="lg" 
              onClick={startRecording}
              className="h-12 px-8 rounded-full font-semibold text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5"
            >
              Start Recording
            </Button>
          ) : (
            <Button 
              size="lg" 
              variant="destructive"
              onClick={stopRecording}
              className="h-12 px-8 rounded-full font-semibold text-lg animate-pulse"
            >
              <Square className="w-4 h-4 mr-2" fill="currentColor" />
              Stop
            </Button>
          )
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <audio src={audioUrl!} controls className="w-full max-w-md h-10 rounded-full" />
            
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={resetRecording} disabled={isUploading}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Redo
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-green-500/20"
              >
                {isUploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Submit Recording
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground max-w-xs text-center">
        {isRecording ? "Speak clearly into your microphone..." : audioBlob ? "Listen to your recording or submit it for review." : "Press start when you are ready."}
      </p>
    </div>
  );
}
