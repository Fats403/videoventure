"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Grid,
  List,
  MoreVertical,
  Play,
  Download,
  Share,
  Trash,
  Eye,
  Edit,
  Copy,
  Star,
  Calendar,
  Video,
  Plus,
  BarChart3,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type VideoStatus = "published" | "draft" | "processing" | "failed";
type SortOption = "newest" | "oldest" | "most-viewed" | "alphabetical";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  createdAt: string;
  views: number;
  status: VideoStatus;
  tags: string[];
  aspectRatio: "16:9" | "1:1" | "9:16";
  videoModel: string;
  isFavorite: boolean;
}

const getStatusColor = (status: VideoStatus) => {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "draft":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "processing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export default function VideoLibraryPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterStatus, setFilterStatus] = useState<VideoStatus | "all">("all");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Enhanced mock data
  const videos: Video[] = [
    {
      id: "v1",
      title: "Amazing Ocean Wildlife Documentary",
      description:
        "A stunning exploration of marine life featuring octopuses, butterflies, and elephants in their natural habitats",
      thumbnail:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
      duration: "2:34",
      createdAt: "2024-01-15",
      views: 1245,
      status: "published",
      tags: ["Documentary", "Wildlife", "Nature"],
      aspectRatio: "16:9",
      videoModel: "Cinematic",
      isFavorite: true,
    },
    {
      id: "v2",
      title: "Product Launch Commercial",
      description:
        "High-energy commercial showcasing our latest product features with dynamic visuals",
      thumbnail:
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
      duration: "0:47",
      createdAt: "2024-01-12",
      views: 892,
      status: "published",
      tags: ["Commercial", "Product", "Marketing"],
      aspectRatio: "16:9",
      videoModel: "Standard",
      isFavorite: false,
    },
    {
      id: "v3",
      title: "Tutorial: Getting Started",
      description:
        "Step-by-step walkthrough for new users to understand our platform",
      thumbnail:
        "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800&h=600&fit=crop",
      duration: "3:15",
      createdAt: "2024-01-10",
      views: 567,
      status: "draft",
      tags: ["Tutorial", "Education", "Onboarding"],
      aspectRatio: "16:9",
      videoModel: "Standard",
      isFavorite: false,
    },
    {
      id: "v4",
      title: "Social Media Story",
      description:
        "Vertical format story for Instagram and TikTok featuring trending content",
      thumbnail:
        "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop",
      duration: "0:15",
      createdAt: "2024-01-08",
      views: 2103,
      status: "published",
      tags: ["Social Media", "Story", "Vertical"],
      aspectRatio: "9:16",
      videoModel: "Experimental",
      isFavorite: true,
    },
    {
      id: "v5",
      title: "Brand Showcase Video",
      description:
        "Professional brand video highlighting company values and mission statement",
      thumbnail:
        "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&h=600&fit=crop",
      duration: "1:58",
      createdAt: "2024-01-05",
      views: 334,
      status: "processing",
      tags: ["Brand", "Corporate", "About"],
      aspectRatio: "16:9",
      videoModel: "Cinematic",
      isFavorite: false,
    },
    {
      id: "v6",
      title: "Failed Generation Test",
      description: "Test video that encountered processing errors",
      thumbnail:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
      duration: "0:00",
      createdAt: "2024-01-03",
      views: 0,
      status: "failed",
      tags: ["Test", "Debug"],
      aspectRatio: "16:9",
      videoModel: "Standard",
      isFavorite: false,
    },
  ];

  const sortVideos = (videos: Video[], sortBy: SortOption) => {
    switch (sortBy) {
      case "newest":
        return [...videos].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case "oldest":
        return [...videos].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case "most-viewed":
        return [...videos].sort((a, b) => b.views - a.views);
      case "alphabetical":
        return [...videos].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return videos;
    }
  };

  const filteredAndSortedVideos = sortVideos(
    videos.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesStatus =
        filterStatus === "all" || video.status === filterStatus;

      return matchesSearch && matchesStatus;
    }),
    sortBy,
  );

  const handleDeleteVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    // In real app, this would call an API to delete the video
    console.log("Deleting video:", selectedVideo?.id);
    setIsDeleteDialogOpen(false);
    setSelectedVideo(null);
  };

  const toggleFavorite = (videoId: string) => {
    // In real app, this would update the favorite status via API
    console.log("Toggling favorite for video:", videoId);
  };

  const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
  const publishedCount = videos.filter((v) => v.status === "published").length;

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Video Library</h1>
          <p className="text-muted-foreground">
            Manage and organize all your created videos
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = "/dashboard/create")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Video
        </Button>
      </div>

      {/* Filters and Controls */}
      <Card className="border-2 p-0">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search videos, tags, or descriptions..."
                className="border-2 pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters and View Controls */}
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <Select
                value={filterStatus}
                onValueChange={(value: VideoStatus | "all") =>
                  setFilterStatus(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most-viewed">Most Viewed</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex rounded-md border-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none border-r",
                    view === "grid" && "bg-primary/10 text-primary",
                  )}
                  onClick={() => setView("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none",
                    view === "list" && "bg-primary/10 text-primary",
                  )}
                  onClick={() => setView("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Grid/List */}
      <AnimatePresence mode="wait">
        {view === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredAndSortedVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <VideoCardGrid
                  video={video}
                  onDelete={handleDeleteVideo}
                  onToggleFavorite={toggleFavorite}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {filteredAndSortedVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <VideoCardList
                  video={video}
                  onDelete={handleDeleteVideo}
                  onToggleFavorite={toggleFavorite}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredAndSortedVideos.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Video className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No videos found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first video to get started"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button
                onClick={() => (window.location.href = "/dashboard/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Video
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedVideo?.title}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Enhanced Video Card Components
interface VideoCardProps {
  video: Video;
  onDelete: (video: Video) => void;
  onToggleFavorite: (videoId: string) => void;
}

function VideoCardGrid({ video, onDelete, onToggleFavorite }: VideoCardProps) {
  return (
    <Card className="hover:border-primary/50 group overflow-hidden border-2 p-0 transition-all duration-200 hover:shadow-lg">
      <div className="relative aspect-video">
        <Image
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover"
          fill
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            size="lg"
            className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
          >
            <Play className="h-6 w-6" />
          </Button>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge className={cn("text-xs", getStatusColor(video.status))}>
            {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
          </Badge>
        </div>

        {/* Duration */}
        <div className="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
          {video.duration}
        </div>

        {/* Favorite button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 bg-black/20 backdrop-blur-sm hover:bg-black/40"
          onClick={() => onToggleFavorite(video.id)}
        >
          <Star
            className={cn(
              "h-4 w-4",
              video.isFavorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-white",
            )}
          />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 truncate font-semibold">{video.title}</h3>
            <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
              {video.description}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Play className="mr-2 h-4 w-4" />
                Play Video
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(video)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-1">
          {video.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {video.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{video.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(video.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.views.toLocaleString()} views
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VideoCardList({ video, onDelete, onToggleFavorite }: VideoCardProps) {
  return (
    <Card className="hover:border-primary/50 border-2 p-0 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={video.thumbnail}
              alt={video.title}
              className="object-cover"
              fill
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 hover:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute right-1 bottom-1 rounded bg-black/80 px-1 py-0.5 text-xs text-white">
              {video.duration}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="truncate font-semibold">{video.title}</h3>
                  <Badge
                    className={cn("text-xs", getStatusColor(video.status))}
                  >
                    {video.status.charAt(0).toUpperCase() +
                      video.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2 line-clamp-1 text-sm">
                  {video.description}
                </p>

                {/* Tags */}
                <div className="mb-2 flex flex-wrap gap-1">
                  {video.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Meta info */}
                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(video.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {video.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {video.aspectRatio}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onToggleFavorite(video.id)}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      video.isFavorite ? "fill-yellow-400 text-yellow-400" : "",
                    )}
                  />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4" />
                      Play Video
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(video)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
