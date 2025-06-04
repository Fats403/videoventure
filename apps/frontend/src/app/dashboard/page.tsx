"use client";

import { useState, useEffect } from "react";
import {
  Gauge,
  Video,
  BarChart,
  Play,
  TrendingUp,
  Eye,
  Sparkles,
  Plus,
  ArrowRight,
  Star,
  Download,
  Share,
  MoreVertical,
  Activity,
  Target,
  Zap,
  Award,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data - in real app this would come from your API
  const stats = {
    videoCredits: { used: 17, total: 30 },
    videosCreated: 24,
    totalViews: 8547,
    avgEngagement: 73,
    lastActivity: "2 hours ago",
    monthlyGrowth: 12.5,
  };

  const recentVideos = [
    {
      id: "v1",
      title: "Amazing Ocean Wildlife Documentary",
      date: "2024-01-15",
      duration: "2:34",
      views: 1245,
      status: "published" as const,
      thumbnail:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop",
      isFavorite: true,
    },
    {
      id: "v2",
      title: "Product Launch Commercial",
      date: "2024-01-12",
      duration: "0:47",
      views: 892,
      status: "published" as const,
      thumbnail:
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop",
      isFavorite: false,
    },
    {
      id: "v3",
      title: "Tutorial: Getting Started",
      date: "2024-01-10",
      duration: "3:15",
      views: 567,
      status: "draft" as const,
      thumbnail:
        "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&h=300&fit=crop",
      isFavorite: false,
    },
    {
      id: "v4",
      title: "Social Media Story",
      date: "2024-01-08",
      duration: "0:15",
      views: 2103,
      status: "published" as const,
      thumbnail:
        "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop",
      isFavorite: true,
    },
  ];

  const creditsUsagePercentage =
    (stats.videoCredits.used / stats.videoCredits.total) * 100;

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Welcome back! 👋</h1>
          <p className="text-muted-foreground text-lg">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Activity className="h-4 w-4" />
            View Analytics
          </Button>
          <Button asChild className="gap-2">
            <Link href="/dashboard/create">
              <Plus className="h-4 w-4" />
              Create Video
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Video Credits"
          value={`${stats.videoCredits.used}/${stats.videoCredits.total}`}
          description="Available credits this month"
          icon={<Video className="h-5 w-5" />}
          trend={`${stats.videoCredits.total - stats.videoCredits.used} remaining`}
          color="bg-blue-500"
          progress={creditsUsagePercentage}
        />
        <StatsCard
          title="Videos Created"
          value={stats.videosCreated.toString()}
          description="Total videos generated"
          icon={<BarChart className="h-5 w-5" />}
          trend={`+${stats.monthlyGrowth}% this month`}
          color="bg-green-500"
          isPositive
        />
        <StatsCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          description="Across all your videos"
          icon={<Eye className="h-5 w-5" />}
          trend="Trending up"
          color="bg-purple-500"
          isPositive
        />
        <StatsCard
          title="Avg. Engagement"
          value={`${stats.avgEngagement}%`}
          description="Viewer engagement rate"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="Above average"
          color="bg-orange-500"
          isPositive
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick Actions - Takes 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Quick Actions</h2>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Pro Plan
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuickActionCard
              title="Create New Video"
              description="Start the AI video creation process with our guided workflow"
              href="/dashboard/create"
              icon={<Video className="h-6 w-6" />}
              color="bg-gradient-to-br from-green-500/20 to-blue-500/20 hover:from-green-500/30 hover:to-blue-500/30"
              badge="Most Popular"
            />
            <QuickActionCard
              title="Browse Templates"
              description="Use pre-made templates for quick video creation"
              href="/dashboard/templates"
              icon={<Sparkles className="h-6 w-6" />}
              color="bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30"
              badge="New"
            />
            <QuickActionCard
              title="My Library"
              description="View, manage and organize all your created videos"
              href="/dashboard/library"
              icon={<BarChart className="h-6 w-6" />}
              color="bg-gradient-to-br from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30"
            />
            <QuickActionCard
              title="Analytics"
              description="Track performance and engagement metrics"
              href="/dashboard/analytics"
              icon={<Target className="h-6 w-6" />}
              color="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30"
            />
          </div>

          {/* Achievement Section */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:border-yellow-800 dark:from-yellow-950/20 dark:to-orange-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-yellow-500 p-3">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-yellow-800 dark:text-yellow-200">
                    Achievement Unlocked! 🎉
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You&apos;ve created 20+ videos this month! You&apos;re
                    becoming a video creation pro.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Videos Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Recent Videos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/library" className="gap-1">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {recentVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <RecentVideoCard video={video} />
              </motion.div>
            ))}
          </div>

          {/* Usage Summary */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="text-primary h-5 w-5" />
                Usage Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Video Credits</span>
                  <span className="font-medium">
                    {stats.videoCredits.used}/{stats.videoCredits.total}
                  </span>
                </div>
                <Progress value={creditsUsagePercentage} className="h-2" />
                <p className="text-muted-foreground mt-1 text-xs">
                  {stats.videoCredits.total - stats.videoCredits.used} credits
                  remaining
                </p>
              </div>

              <div className="border-t pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Plan Status</span>
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="h-3 w-3" />
                    Pro
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Renews on February 15, 2024
                </p>
              </div>

              <Button className="w-full" variant="outline">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  color,
  isPositive,
  progress,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
  color: string;
  isPositive?: boolean;
  progress?: number;
}) {
  return (
    <Card className="hover:border-primary/50 border-2 transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <div className={cn("rounded-lg p-2 text-white", color)}>{icon}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-muted-foreground text-sm">{description}</p>

        {progress !== undefined && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {trend && (
          <div className="flex items-center gap-1">
            {isPositive && <TrendingUp className="h-3 w-3 text-green-500" />}
            <span
              className={cn(
                "text-xs font-medium",
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground",
              )}
            >
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  color,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "hover:border-primary/50 group h-full cursor-pointer border-2 p-0 transition-all duration-200 hover:shadow-lg",
          color,
        )}
      >
        <CardContent className="p-6">
          <div className="mb-3 flex items-start justify-between">
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm transition-colors group-hover:bg-white/20">
              {icon}
            </div>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <h3 className="group-hover:text-primary mb-2 font-semibold transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
          <div className="text-primary mt-4 flex items-center gap-1 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RecentVideoCard({
  video,
}: {
  video: {
    id: string;
    title: string;
    date: string;
    duration: string;
    views: number;
    status: "published" | "draft" | "processing";
    thumbnail: string;
    isFavorite: boolean;
  };
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card className="hover:border-primary/50 group border-2 p-0 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Play className="h-4 w-4 text-white" />
            </div>
            <div className="absolute right-0.5 bottom-0.5 rounded bg-black/80 px-1 text-xs text-white">
              {video.duration}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between">
              <h3 className="truncate pr-2 text-sm font-medium">
                {video.title}
              </h3>
              <div className="flex items-center gap-1">
                {video.isFavorite && (
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4" />
                      Play
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", getStatusColor(video.status))}>
                  {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {video.views.toLocaleString()} views
                </span>
              </div>
              <span className="text-muted-foreground text-xs">
                {new Date(video.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
