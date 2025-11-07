import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, PlayCircle, Eye, ThumbsUp } from "lucide-react";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
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
  const [sortBy, setSortBy] = useState<"views" | "comments" | "likes" | "date">("views");
  const [fetchPriority, setFetchPriority] = useState<"views" | "comments" | "likes" | "date">("views");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [cancelBulkDownload, setCancelBulkDownload] = useState(false);
  const videosPerPage = 30;
  const maxVideos = 200;
  
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
      
      const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
      
      setChannelData({
        id: channelId,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails.high.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount).toLocaleString(),
        videoCount: parseInt(channel.statistics.videoCount).toLocaleString(),
        viewCount: parseInt(channel.statistics.viewCount).toLocaleString(),
      });

      // Fetch videos from the uploads playlist (limit to maxVideos)
      let allVideos: any[] = [];
      let nextPageToken: string | undefined = undefined;

      do {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const playlistResponse = await fetch(playlistUrl);
        const playlistJson = await playlistResponse.json();

        if (playlistJson.items) {
          const videoIds = playlistJson.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
          
          // Fetch detailed statistics for these videos
          const statsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
          );
          const statsJson = await statsResponse.json();

          if (statsJson.items) {
            allVideos = [...allVideos, ...statsJson.items];
          }
        }

        nextPageToken = playlistJson.nextPageToken;
        
        // Stop if we've fetched enough videos
        if (allVideos.length >= maxVideos) {
          break;
        }
      } while (nextPageToken);

      // Sort by the selected priority and limit to maxVideos
      const sortedByPriority = allVideos.sort((a, b) => {
        switch (fetchPriority) {
          case "views":
            return parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount);
          case "comments":
            return parseInt(b.statistics.commentCount || 0) - parseInt(a.statistics.commentCount || 0);
          case "likes":
            return parseInt(b.statistics.likeCount || 0) - parseInt(a.statistics.likeCount || 0);
          case "date":
            return new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime();
          default:
            return 0;
        }
      }).slice(0, maxVideos);

      setVideos(sortedByPriority);
      setCurrentPage(1);
      setSortBy(fetchPriority);

      toast({
        title: "Success!",
        description: `Loaded top ${sortedByPriority.length} videos by ${fetchPriority}`,
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

  const downloadCommentsCSV = async (videoId: string, videoTitle: string, showToast = true) => {
    if (!apiKey) return;

    const MAX_COMMENTS = 5000; // Limit to prevent memory/timeout issues

    try {
      if (showToast) {
        toast({
          title: "Fetching comments...",
          description: "This may take a moment",
        });
      }

      // Fetch comments with limit
      let allComments: any[] = [];
      let nextPageToken: string | undefined = undefined;
      let pageCount = 0;

      do {
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
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
        pageCount++;
        
        // Stop if we've reached the limit
        if (allComments.length >= MAX_COMMENTS) {
          break;
        }
        
        // Add delay to avoid rate limiting
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
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

      const limitReached = allComments.length >= MAX_COMMENTS;
      
      if (showToast) {
        toast({
          title: "Success!",
          description: `Downloaded ${allComments.length} comments${limitReached ? ' (limit reached)' : ''}`,
        });
      }
      
      return allComments.length;
    } catch (error: any) {
      console.error('Error downloading comments:', error);
      if (showToast) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch comments. Try again later.",
          variant: "destructive",
        });
      }
      return 0;
    }
  };

  const downloadAllCommentsCSV = async () => {
    if (!apiKey) return;

    const videosWithComments = videos.filter(v => v.statistics.commentCount && v.statistics.commentCount !== "0");
    
    if (videosWithComments.length === 0) {
      toast({
        title: "No Comments",
        description: "None of the videos have comments to export",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingAll(true);
    setCancelBulkDownload(false);
    setDownloadProgress({ current: 0, total: videosWithComments.length });

    let successCount = 0;
    let totalComments = 0;

    for (let i = 0; i < videosWithComments.length; i++) {
      // Check if user cancelled
      if (cancelBulkDownload) {
        toast({
          title: "Download Cancelled",
          description: `Downloaded ${totalComments} comments from ${successCount} videos before cancellation`,
          variant: "destructive",
        });
        break;
      }

      const video = videosWithComments[i];
      setDownloadProgress({ current: i + 1, total: videosWithComments.length });
      
      const count = await downloadCommentsCSV(video.id, video.snippet.title, false);
      if (count > 0) {
        successCount++;
        totalComments += count;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsDownloadingAll(false);
    setDownloadProgress({ current: 0, total: 0 });
    setCancelBulkDownload(false);

    if (!cancelBulkDownload) {
      toast({
        title: "Bulk Download Complete!",
        description: `Downloaded ${totalComments} comments from ${successCount} videos`,
      });
    }
  };

  const getPaginationItems = () => {
    const totalPages = Math.ceil(videos.length / videosPerPage);
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);

      if (currentPage > 3) {
        items.push('ellipsis-start');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (currentPage < totalPages - 2) {
        items.push('ellipsis-end');
      }

      // Always show last page
      items.push(totalPages);
    }

    return items;
  };

  const sortVideos = (videosToSort: any[]) => {
    return [...videosToSort].sort((a, b) => {
      switch (sortBy) {
        case "views":
          return parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount);
        case "comments":
          return parseInt(b.statistics.commentCount || 0) - parseInt(a.statistics.commentCount || 0);
        case "likes":
          return parseInt(b.statistics.likeCount || 0) - parseInt(a.statistics.likeCount || 0);
        case "date":
          return new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime();
        default:
          return 0;
      }
    });
  };

  const sortedVideos = sortVideos(videos);

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
          <div className="flex flex-col gap-4">
            <Input
              type="text"
              placeholder="Enter YouTube channel URL (e.g., youtube.com/@channelname)"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Fetch top 200 by:</span>
                <Select value={fetchPriority} onValueChange={(value: any) => setFetchPriority(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="views">Views</SelectItem>
                    <SelectItem value="comments">Comments</SelectItem>
                    <SelectItem value="likes">Likes</SelectItem>
                    <SelectItem value="date">Upload Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !channelUrl}
                className="sm:w-auto w-full"
              >
                {isLoading ? "Analyzing..." : "Analyze Channel"}
              </Button>
            </div>
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
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">
                  Videos ({videos.length} total)
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={(value: any) => { setSortBy(value); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="views">Popularity (Views)</SelectItem>
                      <SelectItem value="comments">Comments</SelectItem>
                      <SelectItem value="likes">Likes</SelectItem>
                      <SelectItem value="date">Upload Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={downloadAllCommentsCSV}
                  disabled={isDownloadingAll || videos.filter(v => v.statistics.commentCount && v.statistics.commentCount !== "0").length === 0}
                  className="flex-1 sm:flex-initial gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isDownloadingAll 
                    ? `Downloading... (${downloadProgress.current}/${downloadProgress.total})` 
                    : `Download All Comments (${videos.filter(v => v.statistics.commentCount && v.statistics.commentCount !== "0").length} videos)`}
                </Button>
                {isDownloadingAll && (
                  <Button
                    onClick={() => setCancelBulkDownload(true)}
                    variant="destructive"
                    className="gap-2"
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-4">
              {sortedVideos.slice((currentPage - 1) * videosPerPage, currentPage * videosPerPage).map((video, index) => (
                <Card key={video.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {(currentPage - 1) * videosPerPage + index + 1}
                        </span>
                      </div>
                      <img
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        className="w-full md:w-48 h-32 object-cover rounded"
                      />
                    </div>
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
            
            {sortedVideos.length > videosPerPage && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {getPaginationItems().map((item, index) => (
                      <PaginationItem key={index}>
                        {typeof item === 'number' ? (
                          <PaginationLink
                            onClick={() => setCurrentPage(item)}
                            isActive={currentPage === item}
                            className="cursor-pointer"
                          >
                            {item}
                          </PaginationLink>
                        ) : (
                          <PaginationEllipsis />
                        )}
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedVideos.length / videosPerPage), p + 1))}
                        className={currentPage === Math.ceil(sortedVideos.length / videosPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
