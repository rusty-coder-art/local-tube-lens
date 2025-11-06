import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface VideoInputProps {
  onSubmit: (videoId: string) => void;
  isLoading: boolean;
}

export const VideoInput = ({ onSubmit, isLoading }: VideoInputProps) => {
  const [input, setInput] = useState("");

  const extractVideoId = (url: string): string | null => {
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVideoId(input);
    if (videoId) {
      onSubmit(videoId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Paste YouTube video URL or ID..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 h-12 bg-secondary border-border focus-visible:ring-accent"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !input}
          className="h-12 px-6 bg-accent hover:bg-accent/90"
        >
          <Search className="w-4 h-4 mr-2" />
          Analyze
        </Button>
      </div>
    </form>
  );
};
