import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, ExternalLink } from "lucide-react";

interface ApiKeyDialogProps {
  apiKey: string;
  onSave: (key: string) => void;
}

export const ApiKeyDialog = ({ apiKey, onSave }: ApiKeyDialogProps) => {
  const [key, setKey] = useState(apiKey);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onSave(key);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Key className="w-4 h-4" />
          {apiKey ? "Update API Key" : "Set API Key"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>YouTube API Key</DialogTitle>
          <DialogDescription>
            Enter your YouTube Data API v3 key to fetch video data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your YouTube API key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg">
            <ExternalLink className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              Get your free API key from{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Google Cloud Console
              </a>
              . Enable YouTube Data API v3 in your project.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!key.trim()}>
              Save API Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
