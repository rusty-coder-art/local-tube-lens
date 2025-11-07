import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, PlayCircle, Eye, ThumbsUp } from "lucide-react";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ChannelAnalysis() {
  const [channelUrl, setChannelUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [channelData, setChannelData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 30;
  
  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("youtube_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);
  const { toast } = useToast();

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("youtube_api_key", key);
    toast({
      title: "API Key Saved",
      description: "Your YouTube API key has been saved locally",
    });
  };

  const extractChannelId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/channel\/([\w-]+)/,
      /youtube\.com\/@([\w-]+)/,
      /youtube\.com\/c\/([\w-]+)/,
      /youtube\.com\/user\/([\w-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your YouTube Data API key first",
        variant: "destructive",
      });
      return;
    }

    const channelIdentifier = extractChannelId(channelUrl);
    if (!channelIdentifier) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube channel URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setChannelData(null);
    setVideos([]);

    try {
      // First, get the channel ID if it's a username/handle
      let channelId = channelIdentifier;
      
      // Try to fetch channel by username/handle first
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${channelIdentifier}&key=${apiKey}`
      );
      let channelJson = await channelResponse.json();

      // If not found by handle, try by channel ID
      if (!channelJson.items || channelJson.items.length === 0) {
        const channelByIdResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelIdentifier}&key=${apiKey}`
        );
        channelJson = await channelByIdResponse.json();
      }

      if (!channelJson.items || channelJson.items.length === 0) {
        throw new Error("Channel not found");
      }

      const channel = channelJson.items[0];
      channelId = channel.id;
      
      setChannelData({
        id: channelId,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails.high.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount).toLocaleString(),
        videoCount: parseInt(channel.statistics.videoCount).toLocaleString(),
        viewCount: parseInt(channel.statistics.viewCount).toLocaleString(),
      });

      // Fetch all videos from the channel
      let allVideos: any[] = [];
      let nextPageToken: string | undefined = undefined;

      do {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const searchResponse = await fetch(searchUrl);
        const searchJson = await searchResponse.json();

        if (searchJson.items) {
          const videoIds = searchJson.items.map((item: any) => item.id.videoId).join(',');
          
          // Fetch detailed statistics for these videos
          const statsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
          );
          const statsJson = await statsResponse.json();

          if (statsJson.items) {
            allVideos = [...allVideos, ...statsJson.items];
          }
        }

        nextPageToken = searchJson.nextPageToken;
      } while (nextPageToken);

      // Sort by view count (popularity)
      const sortedVideos = allVideos.sort((a, b) => 
        parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount)
      );

      setVideos(sortedVideos);
      setCurrentPage(1);

      toast({
        title: "Success!",
        description: `Loaded ${sortedVideos.length} videos from channel`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch channel data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCommentsCSV = async (videoId: string, videoTitle: string) => {
    if (!apiKey) return;

    try {
      toast({
        title: "Fetching comments...",
        description: "This may take a moment",
      });

      // Fetch all comments
      let allComments: any[] = [];
      let nextPageToken: string | undefined = undefined;

      do {
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const response = await fetch(url);
        const json = await response.json();

        if (json.items) {
          const formattedComments = json.items.map((item: any) => ({
            authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
            textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
            likeCount: item.snippet.topLevelComment.snippet.likeCount,
            publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
          }));
          allComments = [...allComments, ...formattedComments];
        }

        nextPageToken = json.nextPageToken;
      } while (nextPageToken);

      // Create CSV
      const headers = ['Author', 'Comment', 'Likes', 'Published Date'];
      const rows = allComments.map(comment => [
        `"${comment.authorName.replace(/"/g, '""')}"`,
        `"${comment.textDisplay.replace(/<[^>]*>/g, '').replace(/"/g, '""')}"`,
        comment.likeCount,
        new Date(comment.publishedAt).toLocaleDateString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoTitle.substring(0, 30)}-comments-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Downloaded ${allComments.length} comments`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch comments",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Channel Analysis
            </h1>
            <Link to="/">
              <Button variant="outline">Back to Video Analyzer</Button>
            </Link>
          </div>
          <p className="text-muted-foreground mb-4">
            Analyze any YouTube channel and export comments from popular videos
          </p>
          <ApiKeyDialog apiKey={apiKey} onSave={handleSaveApiKey} />
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder="Enter YouTube channel URL (e.g., youtube.com/@channelname)"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !channelUrl}
              className="sm:w-auto w-full"
            >
              {isLoading ? "Analyzing..." : "Analyze Channel"}
            </Button>
          </div>
        </Card>

        {channelData && (
          <Card className="p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={channelData.thumbnail}
                alt={channelData.title}
                className="w-32 h-32 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{channelData.title}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-2">{channelData.description}</p>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Subscribers</p>
                    <p className="text-lg font-semibold">{channelData.subscriberCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Videos</p>
                    <p className="text-lg font-semibold">{channelData.videoCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-lg font-semibold">{channelData.viewCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {videos.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Videos by Popularity ({videos.length} total)
            </h2>
            <div className="grid gap-4">
              {videos.slice((currentPage - 1) * videosPerPage, currentPage * videosPerPage).map((video) => (
                <Card key={video.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row gap-4">
                    <img
                      src={video.snippet.thumbnails.medium.url}
                      alt={video.snippet.title}
                      className="w-full md:w-48 h-32 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {video.snippet.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {parseInt(video.statistics.viewCount).toLocaleString()} views
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {parseInt(video.statistics.likeCount).toLocaleString()} likes
                        </div>
                        <div className="flex items-center gap-1">
                          <PlayCircle className="w-4 h-4" />
                          {parseInt(video.statistics.commentCount || 0).toLocaleString()} comments
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadCommentsCSV(video.id, video.snippet.title)}
                        className="gap-2"
                        disabled={!video.statistics.commentCount || video.statistics.commentCount === "0"}
                      >
                        <Download className="w-4 h-4" />
                        Download Comments CSV
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {videos.length > videosPerPage && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(videos.length / videosPerPage) }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(videos.length / videosPerPage), p + 1))}
                        className={currentPage === Math.ceil(videos.length / videosPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
