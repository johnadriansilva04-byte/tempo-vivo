import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useFeatureFlag } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
}

export function VoiceInputButton({ onTranscript, placeholder = "Fale para ditar..." }: VoiceInputButtonProps) {
  const voiceInputEnabled = useFeatureFlag("voice_input");
  const {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      startListening();
    }
  };

  if (!voiceInputEnabled || !isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={toggleListening}
        className="gap-2"
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            Parar
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Ditar
          </>
        )}
      </Button>
      
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{transcript || placeholder}</span>
        </div>
      )}
      
      {error && (
        <div className="text-xs text-destructive">{error}</div>
      )}
    </div>
  );
}