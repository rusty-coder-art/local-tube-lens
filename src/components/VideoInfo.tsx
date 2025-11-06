import { Card } from "@/components/ui/card";
import { Eye, ThumbsUp, MessageSquare, Calendar } from "lucide-react";

interface VideoInfoProps {
  data: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    viewCount: string;
    likeCount: string;
    commentCount: string;
    thumbnailUrl: string;
  };
}

export const VideoInfo = ({ data }: VideoInfoProps) => {
  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full max-w-5xl mx-auto p-6 bg-card border-border">
      <div className="flex flex-col md:flex-row gap-6">
        <img 
          src={data.thumbnailUrl} 
          alt={data.title}
          className="w-full md:w-80 rounded-lg object-cover"
        />
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
            <p className="text-muted-foreground font-medium">{data.channelTitle}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-accent" />
              <span>{formatNumber(data.viewCount)} views</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ThumbsUp className="w-4 h-4 text-accent" />
              <span>{formatNumber(data.likeCount)} likes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-accent" />
              <span>{formatNumber(data.commentCount)} comments</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{formatDate(data.publishedAt)}</span>
            </div>
          </div>

          {data.description && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {data.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
