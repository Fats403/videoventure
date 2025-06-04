import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef } from "react";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string;
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean;
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean;
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode;
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean;
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex [gap:var(--gap)] overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className,
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
              "animate-marquee flex-row": !vertical,
              "animate-marquee-vertical flex-col": vertical,
              "group-hover:[animation-play-state:paused]": pauseOnHover,
              "[animation-direction:reverse]": reverse,
            })}
          >
            {children}
          </div>
        ))}
    </div>
  );
}

// Video Card Component for the marquee
const VideoCard = ({
  thumbnail,
  title,
  category,
  duration,
}: {
  thumbnail: string;
  title: string;
  category: string;
  duration: string;
}) => {
  return (
    <div className="border-border/50 bg-card/50 hover:border-primary/50 hover:shadow-primary/10 relative h-48 w-80 cursor-pointer overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg">
      {/* Video Thumbnail */}
      <div className="from-primary/20 to-accent/20 relative h-32 w-full overflow-hidden bg-gradient-to-br">
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
        />
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
            <svg
              className="text-primary ml-1 h-6 w-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Duration Badge */}
        <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {duration}
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="text-foreground mt-1 line-clamp-1 text-sm font-semibold">
          {title}
        </h3>
      </div>
    </div>
  );
};

// Video Showcase Marquee Component
export function VideoShowcaseMarquee() {
  const sampleVideos = [
    {
      thumbnail:
        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop",
      title: "Product Launch Campaign for Tech Startup",
      category: "Marketing",
      duration: "1:45",
    },
    {
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      title: "Educational Tutorial: AI Basics",
      category: "Education",
      duration: "3:22",
    },
    {
      thumbnail:
        "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop",
      title: "Social Media Story for Fashion Brand",
      category: "Social Media",
      duration: "0:30",
    },
    {
      thumbnail:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
      title: "Corporate Training Video",
      category: "Corporate",
      duration: "5:00",
    },
    {
      thumbnail:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      title: "Animated Explainer for SaaS Platform",
      category: "Explainer",
      duration: "2:30",
    },
    {
      thumbnail:
        "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=300&fit=crop",
      title: "Event Highlights Reel",
      category: "Event",
      duration: "4:10",
    },
    {
      thumbnail:
        "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
      title: "Restaurant Menu Showcase",
      category: "Food & Beverage",
      duration: "1:20",
    },
    {
      thumbnail:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop",
      title: "Real Estate Property Tour",
      category: "Real Estate",
      duration: "3:45",
    },
  ];

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg">
      <Marquee pauseOnHover className="[--duration:30s]">
        {sampleVideos.map((video, index) => (
          <VideoCard key={`${video.title}-${index}`} {...video} />
        ))}
      </Marquee>

      {/* Gradient fade edges */}
      <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r to-transparent"></div>
      <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l to-transparent"></div>
    </div>
  );
}
