import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonsProps {
  videoData: any;
  comments: any[];
  disabled?: boolean;
}

export const ExportButtons = ({ videoData, comments, disabled }: ExportButtonsProps) => {
  const exportToJSON = () => {
    const data = {
      video: videoData,
      comments: comments,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-data-${videoData.title.substring(0, 30)}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    // Create CSV header
    const headers = ['Author', 'Comment', 'Likes', 'Published Date'];
    
    // Create CSV rows
    const rows = comments.map(comment => [
      `"${comment.authorName.replace(/"/g, '""')}"`,
      `"${comment.textDisplay.replace(/<[^>]*>/g, '').replace(/"/g, '""')}"`,
      comment.likeCount,
      new Date(comment.publishedAt).toLocaleDateString(),
    ]);
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-comments-${videoData.title.substring(0, 30)}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={exportToJSON}
        disabled={disabled}
        variant="outline"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Export JSON
      </Button>
      <Button
        onClick={exportToCSV}
        disabled={disabled}
        variant="outline"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </Button>
    </div>
  );
};
