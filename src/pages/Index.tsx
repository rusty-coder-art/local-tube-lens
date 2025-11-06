import { useState } from "react";
import { VideoInput } from "@/components/VideoInput";
import { VideoInfo } from "@/components/VideoInfo";
import { CommentsList } from "@/components/CommentsList";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// You'll need to get your own YouTube Data API v3 key from:
// https://console.cloud.google.com/apis/credentials
const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY_HERE";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchVideoData = async (videoId: string) => {
    setIsLoading(true);
    setVideoData(null);
    setComments([]);

    try {
      // Fetch video details
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      const videoJson = await videoResponse.json();

      if (!videoJson.items || videoJson.items.length === 0) {
        throw new Error("Video not found");
      }

      const video = videoJson.items[0];
      setVideoData({
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
        commentCount: video.statistics.commentCount,
        thumbnailUrl: video.snippet.thumbnails.high.url,
      });

      // Fetch comments
      const commentsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=50&key=${YOUTUBE_API_KEY}`
      );
      const commentsJson = await commentsResponse.json();

      if (commentsJson.items) {
        const formattedComments = commentsJson.items.map((item: any) => ({
          id: item.id,
          authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
          authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
          textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
          likeCount: item.snippet.topLevelComment.snippet.likeCount,
          publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        }));
        setComments(formattedComments);
      }

      toast({
        title: "Success!",
        description: "Video data loaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch video data. Please check your API key and video ID.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">
            YouTube Data Analyzer
          </h1>
          <p className="text-muted-foreground">
            Fetch video statistics and comments from any YouTube video
          </p>
        </div>

        <VideoInput onSubmit={fetchVideoData} isLoading={isLoading} />

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {videoData && !isLoading && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <VideoInfo data={videoData} />
            {comments.length > 0 && <CommentsList comments={comments} />}
          </div>
        )}

        {!videoData && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Enter a YouTube video URL to get started</p>
            <p className="text-sm mt-2">
              Don't forget to add your YouTube API key in the code!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
