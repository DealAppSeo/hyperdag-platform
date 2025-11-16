import { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info, PlayCircle, Image as ImageIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultimodalContentType = "gif" | "infographic" | "video" | "text";

export interface MultimodalContent {
  type: MultimodalContentType;
  title: string;
  description?: string;
  mediaUrl?: string;
  textContent?: string;
  duration?: number;
}

interface MultimodalTooltipProps {
  content: MultimodalContent;
  children?: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function MultimodalTooltip({ 
  content, 
  children,
  className,
  side = "top"
}: MultimodalTooltipProps) {
  const getIcon = () => {
    switch (content.type) {
      case "video":
        return <PlayCircle className="h-4 w-4" />;
      case "gif":
      case "infographic":
        return <ImageIcon className="h-4 w-4" />;
      case "text":
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderContent = () => {
    switch (content.type) {
      case "video":
        return (
          <div className="space-y-2">
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
              {content.mediaUrl ? (
                <video
                  src={content.mediaUrl}
                  controls
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover"
                  data-testid="tooltip-video"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <PlayCircle className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            {content.description && (
              <p className="text-sm text-muted-foreground" data-testid="tooltip-video-description">
                {content.description}
              </p>
            )}
            {content.duration && (
              <p className="text-xs text-muted-foreground" data-testid="tooltip-video-duration">
                Duration: {content.duration}s
              </p>
            )}
          </div>
        );

      case "gif":
        return (
          <div className="space-y-2">
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
              {content.mediaUrl ? (
                <img
                  src={content.mediaUrl}
                  alt={content.title}
                  className="w-full h-full object-cover"
                  data-testid="tooltip-gif"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            {content.description && (
              <p className="text-sm text-muted-foreground" data-testid="tooltip-gif-description">
                {content.description}
              </p>
            )}
          </div>
        );

      case "infographic":
        return (
          <div className="space-y-2">
            <div className="relative bg-muted rounded-md overflow-hidden">
              {content.mediaUrl ? (
                <img
                  src={content.mediaUrl}
                  alt={content.title}
                  className="w-full h-auto max-h-96 object-contain"
                  data-testid="tooltip-infographic"
                />
              ) : (
                <div className="flex items-center justify-center h-48">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            {content.description && (
              <p className="text-sm text-muted-foreground" data-testid="tooltip-infographic-description">
                {content.description}
              </p>
            )}
          </div>
        );

      case "text":
      default:
        return (
          <div className="space-y-2">
            {content.textContent && (
              <p className="text-sm leading-relaxed" data-testid="tooltip-text-content">
                {content.textContent}
              </p>
            )}
            {content.description && (
              <p className="text-xs text-muted-foreground" data-testid="tooltip-text-description">
                {content.description}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        {children || (
          <button
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "h-5 w-5 bg-primary/10 hover:bg-primary/20",
              "text-primary transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              className
            )}
            data-testid="tooltip-trigger"
          >
            <Info className="h-3 w-3" />
          </button>
        )}
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        className="w-80 p-4"
        data-testid="tooltip-content"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="rounded-full p-1.5 bg-primary/10 text-primary">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1" data-testid="tooltip-title">{content.title}</h4>
              {renderContent()}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
