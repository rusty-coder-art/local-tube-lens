import { Card } from "@/components/ui/card";
import { ThumbsUp } from "lucide-react";

interface Comment {
  id: string;
  authorName: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  likeCount: number;
  publishedAt: string;
}

interface CommentsListProps {
  comments: Comment[];
}

export const CommentsList = ({ comments }: CommentsListProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <h3 className="text-xl font-bold mb-4">Comments ({comments.length})</h3>
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4 bg-card border-border">
          <div className="flex gap-3">
            <img 
              src={comment.authorProfileImageUrl} 
              alt={comment.authorName}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.publishedAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: comment.textDisplay }} />
              <div className="flex items-center gap-1 text-muted-foreground">
                <ThumbsUp className="w-3 h-3" />
                <span className="text-xs">{comment.likeCount}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
