import { useState, useEffect } from "react";
import { VideoInput } from "@/components/VideoInput";
import { VideoInfo } from "@/components/VideoInfo";
import { CommentsList } from "@/components/CommentsList";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { CommentFilters } from "@/components/CommentFilters";
import { ExportButtons } from "@/components/ExportButtons";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]); // Store ALL comments for export
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [minLikes, setMinLikes] = useState("");
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("youtube_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("youtube_api_key", key);
    toast({
      title: "API Key Saved",
      description: "Your YouTube API key has been saved locally",
    });
  };

  const fetchVideoData = async (videoId: string) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your YouTube API key first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVideoData(null);
    setComments([]);
    setAllComments([]);

    try {
      // Fetch video details
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
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

      // Fetch ALL comments using pagination
      let allFetchedComments: any[] = [];
      let nextPageToken: string | undefined = undefined;
      
      do {
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const commentsResponse = await fetch(url);
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
          allFetchedComments = [...allFetchedComments, ...formattedComments];
        }

        nextPageToken = commentsJson.nextPageToken;
      } while (nextPageToken);

      // Store all comments for export
      setAllComments(allFetchedComments);
      // Display only first 50 comments
      setComments(allFetchedComments.slice(0, 50));

      toast({
        title: "Success!",
        description: `Loaded ${allFetchedComments.length} comments from video`,
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
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            YouTube Data Analyzer
          </h1>
          <p className="text-muted-foreground">
            Fetch video statistics and comments from any YouTube video
          </p>
          <div className="flex justify-center">
            <ApiKeyDialog apiKey={apiKey} onSave={handleSaveApiKey} />
          </div>
        </div>

        {!apiKey && (
          <Alert className="max-w-3xl mx-auto bg-card border-accent">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertDescription>
              Please set your YouTube API key to start analyzing videos. Click the button above to add your key.
            </AlertDescription>
          </Alert>
        )}

        <VideoInput onSubmit={fetchVideoData} isLoading={isLoading} />

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}

        {videoData && !isLoading && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <VideoInfo data={videoData} />
            {comments.length > 0 && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <ExportButtons 
                    videoData={videoData} 
                    comments={allComments}
                    disabled={false}
                  />
                  <p className="text-sm text-muted-foreground">
                    Showing 50 of {allComments.length} comments • Export includes all comments
                  </p>
                </div>
                <CommentFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  minLikes={minLikes}
                  onMinLikesChange={setMinLikes}
                />
                <CommentsList 
                  comments={comments}
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  minLikes={parseInt(minLikes) || 0}
                />
              </>
            )}
          </div>
        )}

        {!videoData && !isLoading && apiKey && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Enter a YouTube video URL to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
