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
  Calendar,
  Video,
  Plus,
  BarChart3,
  Loader2,
  X,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { VideoProject, ProjectStatus } from "@video-venture/shared";
import { useRouter } from "next/navigation";

type DisplayStatus = "draft" | "generating" | "completed" | "failed";
type SortOption = "newest" | "oldest" | "most-viewed" | "alphabetical";

// Map project status to display status
const getDisplayStatus = (status: ProjectStatus): DisplayStatus => {
  switch (status) {
    case "storyboard":
    case "settings":
    case "breakdown":
      return "draft";
    case "generating":
      return "generating";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    default:
      return "draft";
  }
};

const getStatusColor = (status: DisplayStatus) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "draft":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "generating":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

const getStatusIcon = (status: DisplayStatus) => {
  switch (status) {
    case "generating":
      return <Loader2 className="h-3 w-3 animate-spin" />;
    case "completed":
      return <Play className="h-3 w-3" />;
    case "failed":
      return <X className="h-3 w-3" />;
    default:
      return <Edit className="h-3 w-3" />;
  }
};

const getProjectTags = (project: VideoProject): string[] => {
  const storyboard = project.storyboard?.selectedVariantId
    ? project.storyboard?.variants.find(
        (variant) => variant.id === project.storyboard?.selectedVariantId,
      )
    : null;
  const tags = storyboard?.tags || [];
  return tags;
};

const getProjectName = (project: VideoProject): string => {
  if (project?.settings?.projectName) {
    return project.settings.projectName;
  }

  if (project?.storyboard?.variants[0]?.title) {
    return project.storyboard.variants[0]?.title;
  }

  return "Untitled Project";
};

// Default placeholder image (you can replace this with your own)
const DEFAULT_THUMBNAIL = "/draft_video.png"; // or a local image

// Helper functions for project data
const getThumbnail = (project: VideoProject): string => {
  // Priority: video thumbnail > first scene image > default
  if (project.video?.thumbnailUrl) {
    return project.video.thumbnailUrl;
  }

  if (project.breakdown?.scenes && project.breakdown.scenes.length > 0) {
    return project.breakdown.scenes[0]?.imageUrl || DEFAULT_THUMBNAIL;
  }

  return DEFAULT_THUMBNAIL;
};

const getProjectDuration = (project: VideoProject): string => {
  if (project.video?.duration) {
    const minutes = Math.floor(project.video.duration / 60);
    const seconds = project.video.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (project.breakdown?.scenes) {
    const totalDuration = project.breakdown.scenes.reduce(
      (sum, scene) => sum + (scene.duration || 5), // Default 5 seconds per scene
      0,
    );
    const minutes = Math.floor(totalDuration / 60);
    const seconds = totalDuration % 60;
    return `~${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return "--:--";
};

export default function VideoLibraryPage() {
  const router = useRouter();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterStatus, setFilterStatus] = useState<DisplayStatus | "all">(
    "all",
  );
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: projects = [],
    refetch,
    isLoading,
  } = api.video.getMyProjects.useQuery();

  const sortProjects = (projects: VideoProject[], sortBy: SortOption) => {
    switch (sortBy) {
      case "newest":
        return [...projects].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case "oldest":
        return [...projects].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case "most-viewed":
        return [...projects].sort((a, b) => (b.views || 0) - (a.views || 0));
      case "alphabetical":
        return [...projects].sort((a, b) =>
          (getProjectName(a) || "Untitled").localeCompare(
            getProjectName(b) || "Untitled",
          ),
        );
      default:
        return projects;
    }
  };

  const filteredAndSortedProjects = sortProjects(
    projects.filter((project) => {
      const displayStatus = getDisplayStatus(project.status);
      const projectName = getProjectName(project);
      const description = project.concept?.content || "";

      const matchesSearch =
        projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || displayStatus === filterStatus;

      return matchesSearch && matchesStatus;
    }),
    sortBy,
  );

  const handleDeleteProject = (project: VideoProject) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;

    try {
      // TODO: Add delete mutation to video router
      console.log("Deleting project:", selectedProject.id);
      toast.success("Project deleted successfully");
      await refetch();
    } catch (error) {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const handleEditProject = (project: VideoProject) => {
    router.push(`/dashboard/create?v=${project.id}`);
  };

  const handlePlayVideo = (project: VideoProject) => {
    if (project.status === "completed" && project.video) {
      // TODO: Navigate to video player or open video
      console.log("Playing video:", project.id);
    } else {
      toast.error("Video is not ready yet");
    }
  };

  const handleDuplicateProject = async (project: VideoProject) => {
    try {
      // TODO: Add duplicate mutation to video router
      console.log("Duplicating project:", project.id);
      toast.success("Project duplicated successfully");
      await refetch();
    } catch (error) {
      toast.error("Failed to duplicate project");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Video Library</h1>
          <p className="text-muted-foreground">
            Manage and organize all your video projects
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/create")}
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
                placeholder="Search projects..."
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
                onValueChange={(value: DisplayStatus | "all") =>
                  setFilterStatus(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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

      {/* Projects Grid/List */}
      <AnimatePresence mode="wait">
        {view === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredAndSortedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProjectCardGrid
                  project={project}
                  onDelete={handleDeleteProject}
                  onEdit={handleEditProject}
                  onPlay={handlePlayVideo}
                  onDuplicate={handleDuplicateProject}
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
            {filteredAndSortedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProjectCardList
                  project={project}
                  onDelete={handleDeleteProject}
                  onEdit={handleEditProject}
                  onPlay={handlePlayVideo}
                  onDuplicate={handleDuplicateProject}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredAndSortedProjects.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Video className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first video project to get started"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button onClick={() => router.push("/dashboard/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {getProjectName(selectedProject!)}
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
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Project Card Components
interface ProjectCardProps {
  project: VideoProject;
  onDelete: (project: VideoProject) => void;
  onEdit: (project: VideoProject) => void;
  onPlay: (project: VideoProject) => void;
  onDuplicate: (project: VideoProject) => void;
}

function ProjectCardGrid({
  project,
  onDelete,
  onEdit,
  onPlay,
  onDuplicate,
}: ProjectCardProps) {
  const displayStatus = getDisplayStatus(project.status);
  const thumbnail = getThumbnail(project);
  const duration = getProjectDuration(project);
  const tags = getProjectTags(project);
  const projectName = getProjectName(project);

  return (
    <Card className="hover:border-primary/50 group overflow-hidden border-2 p-0 transition-all duration-200 hover:shadow-lg">
      <div className="relative aspect-video">
        <Image
          src={thumbnail}
          alt={projectName}
          className="h-full w-full object-cover"
          fill
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            size="lg"
            className="rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
            onClick={() =>
              displayStatus === "completed" ? onPlay(project) : onEdit(project)
            }
          >
            {displayStatus === "completed" ? (
              <Play className="h-6 w-6" />
            ) : (
              <Edit className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge
            className={cn(
              "flex items-center gap-1 text-xs",
              getStatusColor(displayStatus),
            )}
          >
            {getStatusIcon(displayStatus)}
            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
          </Badge>
        </div>

        {/* Duration */}
        <div className="absolute right-2 bottom-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
          {duration}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 truncate font-semibold">{projectName}</h3>
            <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
              {project.concept?.content || "No description"}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {displayStatus === "completed" ? (
                <DropdownMenuItem onClick={() => onPlay(project)}>
                  <Play className="mr-2 h-4 w-4" />
                  Play Video
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Continue Editing
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(project)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {displayStatus === "completed" && (
                <>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(project.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {(project.views || 0).toLocaleString()} views
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCardList({
  project,
  onDelete,
  onEdit,
  onPlay,
  onDuplicate,
}: ProjectCardProps) {
  const displayStatus = getDisplayStatus(project.status);
  const thumbnail = getThumbnail(project);
  const duration = getProjectDuration(project);
  const tags = getProjectTags(project);
  const projectName = getProjectName(project);

  return (
    <Card className="hover:border-primary/50 border-2 p-0 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={thumbnail}
              alt={projectName}
              className="object-cover"
              fill
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 hover:opacity-100">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() =>
                  displayStatus === "completed"
                    ? onPlay(project)
                    : onEdit(project)
                }
              >
                {displayStatus === "completed" ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="absolute right-1 bottom-1 rounded bg-black/80 px-1 py-0.5 text-xs text-white">
              {duration}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="truncate font-semibold">{projectName}</h3>
                  <Badge
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      getStatusColor(displayStatus),
                    )}
                  >
                    {getStatusIcon(displayStatus)}
                    {displayStatus.charAt(0).toUpperCase() +
                      displayStatus.slice(1)}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2 line-clamp-1 text-sm">
                  {project.concept?.content || "No description"}
                </p>

                {/* Tags */}
                <div className="mb-2 flex flex-wrap gap-1">
                  {tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Meta info */}
                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {(project.views || 0).toLocaleString()}
                  </div>
                  {project.settings?.aspectRatio && (
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {project.settings.aspectRatio}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {displayStatus === "completed" ? (
                      <DropdownMenuItem onClick={() => onPlay(project)}>
                        <Play className="mr-2 h-4 w-4" />
                        Play Video
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onEdit(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Continue Editing
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDuplicate(project)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {displayStatus === "completed" && (
                      <>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(project)}
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
