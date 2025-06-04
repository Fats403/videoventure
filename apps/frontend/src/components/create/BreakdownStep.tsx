"use client";

import React, { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import type { CompleteVideoForm, Scene } from "@/lib/zod/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Play,
  Pause,
  RefreshCw,
  Edit,
  Plus,
  GripVertical,
  Trash2,
  Eye,
  Clock,
  Volume2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface BreakdownStepProps {
  form: UseFormReturn<CompleteVideoForm>;
}

export function BreakdownStep({ form }: BreakdownStepProps) {
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
  const [playingScene, setPlayingScene] = useState<string | null>(null);

  // Get breakdown data from form
  const breakdownData = form.watch("breakdown");
  const scenes = breakdownData?.scenes ?? [];

  // Get settings data for display
  const settingsData = form.watch("settings");

  const handleEditScene = (scene: Scene) => {
    setSelectedScene(scene);
    setIsEditDialogOpen(true);
  };

  const handleSaveScene = (updatedScene: Partial<Scene>) => {
    if (!selectedScene) return;

    const currentScenes = form.getValues("breakdown.scenes") ?? [];
    const updatedScenes = currentScenes.map((scene) =>
      scene.id === selectedScene.id ? { ...scene, ...updatedScene } : scene,
    );

    form.setValue("breakdown.scenes", updatedScenes);

    setIsEditDialogOpen(false);
    setSelectedScene(null);
  };

  const handleRegenerateImage = async (sceneId: string) => {
    setIsRegenerating(sceneId);
    // TODO: Call API to regenerate scene image
    setTimeout(() => {
      setIsRegenerating(null);
      // In real app, update the scene with new image
    }, 3000);
  };

  const handleDeleteScene = (sceneId: string) => {
    const currentScenes = form.getValues("breakdown.scenes") || [];
    const updatedScenes = currentScenes.filter((scene) => scene.id !== sceneId);

    // Reorder remaining scenes
    const reorderedScenes = updatedScenes.map((scene, index) => ({
      ...scene,
      order: index + 1,
    }));

    form.setValue("breakdown.scenes", reorderedScenes);
  };

  const handleAddScene = () => {
    const currentScenes = form.getValues("breakdown.scenes") || [];
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      imageUrl:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
      imageDescription: "A new scene waiting to be customized",
      voiceOver: "Add your voice-over text here...",
      duration: 5,
      order: currentScenes.length + 1,
    };

    const updatedScenes = [...currentScenes, newScene];
    form.setValue("breakdown.scenes", updatedScenes);
  };

  const handleReorderScenes = (newScenes: Scene[]) => {
    const reorderedScenes = newScenes.map((scene, index) => ({
      ...scene,
      order: index + 1,
    }));

    form.setValue("breakdown.scenes", reorderedScenes);
  };

  const togglePlayScene = (sceneId: string) => {
    if (playingScene === sceneId) {
      setPlayingScene(null);
    } else {
      setPlayingScene(sceneId);
      // In real app, this would trigger audio playback
      setTimeout(() => setPlayingScene(null), 3000); // Auto-stop after 3 seconds for demo
    }
  };

  // If no scenes, show empty state
  if (!scenes.length) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold">Final Storyboard Review</h1>
          <p className="text-muted-foreground text-lg">
            Generate scenes from your storyboard to continue
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground mb-4">
              No scenes generated yet
            </p>
            <Button
              onClick={() => {
                // TODO: Generate scenes from storyboard
                console.log("Generate scenes from storyboard");
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Scenes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold">Final Storyboard Review</h1>
        <p className="text-muted-foreground text-lg">
          Review your generated scenes and make final adjustments before
          creating your video
        </p>
      </div>

      {/* Summary Stats */}
      <Card className="border-primary/20 bg-primary/5 border-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {scenes.length}
              </div>
              <div className="text-muted-foreground text-sm">Total Scenes</div>
            </div>
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {settingsData?.aspectRatio ?? "16:9"}
              </div>
              <div className="text-muted-foreground text-sm">Aspect Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {settingsData?.videoModel ?? "Standard"}
              </div>
              <div className="text-muted-foreground text-sm">Video Model</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scene Management */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="text-primary h-5 w-5" />
              Scene Breakdown
            </CardTitle>
            <Button onClick={handleAddScene} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Scene
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Reorder.Group
            axis="y"
            values={scenes}
            onReorder={handleReorderScenes}
            className="space-y-4"
          >
            <AnimatePresence>
              {scenes.map((scene, index) => (
                <Reorder.Item
                  key={scene.id}
                  value={scene}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-0">
                        {/* Desktop Layout */}
                        <div className="hidden md:flex md:items-center">
                          {/* Drag Handle */}
                          <div className="flex items-center border-r p-4">
                            <GripVertical className="text-muted-foreground h-5 w-5" />
                          </div>

                          {/* Scene Number */}
                          <div className="bg-primary/5 flex w-16 items-center justify-center border-r">
                            <span className="text-primary font-bold">
                              {index + 1}
                            </span>
                          </div>

                          {/* Scene Image */}
                          <div className="flex items-center border-r p-4">
                            <div className="relative h-24 w-32 overflow-hidden rounded-md">
                              {isRegenerating === scene.id ? (
                                <div className="bg-muted flex h-full items-center justify-center">
                                  <RefreshCw className="text-primary h-6 w-6 animate-spin" />
                                </div>
                              ) : (
                                <Image
                                  src={scene.imageUrl}
                                  alt={`Scene ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                          </div>

                          {/* Scene Content */}
                          <div className="flex flex-1 items-center p-6">
                            <div className="flex-1">
                              <p className="text-muted-foreground mb-3 line-clamp-3 text-sm leading-relaxed">
                                {scene.voiceOver}
                              </p>
                              <div className="text-muted-foreground flex items-center gap-6 text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {scene.duration}s
                                </div>
                                <div className="flex items-center gap-1">
                                  <Volume2 className="h-3 w-3" />
                                  Voice-over
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 border-l p-4">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => togglePlayScene(scene.id)}
                              className="h-8 w-8 p-0"
                            >
                              {playingScene === scene.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditScene(scene)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRegenerateImage(scene.id)}
                              disabled={isRegenerating === scene.id}
                              className="h-8 w-8 p-0"
                            >
                              <RefreshCw
                                className={cn(
                                  "h-4 w-4",
                                  isRegenerating === scene.id && "animate-spin",
                                )}
                              />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteScene(scene.id)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="md:hidden">
                          {/* Mobile Header */}
                          <div className="flex items-center justify-between border-b p-4">
                            <div className="flex items-center gap-3">
                              <GripVertical className="text-muted-foreground h-4 w-4" />
                              <span className="text-primary font-bold">
                                Scene {index + 1}
                              </span>
                            </div>
                            <div className="text-muted-foreground flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {scene.duration}s
                            </div>
                          </div>

                          {/* Mobile Image */}
                          <div className="relative aspect-video w-full overflow-hidden">
                            {isRegenerating === scene.id ? (
                              <div className="bg-muted flex h-full items-center justify-center">
                                <div className="text-center">
                                  <RefreshCw className="text-primary mx-auto mb-2 h-6 w-6 animate-spin" />
                                  <p className="text-muted-foreground text-xs">
                                    Regenerating...
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <Image
                                src={scene.imageUrl}
                                alt={`Scene ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>

                          {/* Mobile Content */}
                          <div className="p-4">
                            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                              {scene.voiceOver}
                            </p>

                            {/* Mobile Action Buttons */}
                            <div className="flex items-center justify-between">
                              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                <Volume2 className="h-3 w-3" />
                                Voice-over
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => togglePlayScene(scene.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {playingScene === scene.id ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditScene(scene)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleRegenerateImage(scene.id)
                                  }
                                  disabled={isRegenerating === scene.id}
                                  className="h-8 w-8 p-0"
                                >
                                  <RefreshCw
                                    className={cn(
                                      "h-4 w-4",
                                      isRegenerating === scene.id &&
                                        "animate-spin",
                                    )}
                                  />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteScene(scene.id)}
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </CardContent>
      </Card>

      {/* Final Actions */}
      <Card className="border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Ready to Generate
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Your storyboard is complete with {scenes.length} scenes
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Scene Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Scene{" "}
              {selectedScene
                ? scenes.findIndex((s) => s.id === selectedScene.id) + 1
                : ""}
            </DialogTitle>
            <DialogDescription>
              Customize the image description and voice-over for this scene
            </DialogDescription>
          </DialogHeader>

          {selectedScene && (
            <SceneEditForm
              scene={selectedScene}
              onSave={handleSaveScene}
              onCancel={() => setIsEditDialogOpen(false)}
              onRegenerateImage={() => handleRegenerateImage(selectedScene.id)}
              isRegenerating={isRegenerating === selectedScene.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Scene Edit Form Component
function SceneEditForm({
  scene,
  onSave,
  onCancel,
  onRegenerateImage,
  isRegenerating,
}: {
  scene: Scene;
  onSave: (data: Partial<Scene>) => void;
  onCancel: () => void;
  onRegenerateImage: () => void;
  isRegenerating: boolean;
}) {
  const [formData, setFormData] = useState({
    imageDescription: scene.imageDescription,
    voiceOver: scene.voiceOver,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Image */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">CURRENT IMAGE</Label>
        <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-lg border-2">
          {isRegenerating ? (
            <div className="bg-muted flex h-full items-center justify-center">
              <div className="text-center">
                <RefreshCw className="text-primary mx-auto mb-2 h-8 w-8 animate-spin" />
                <p className="text-muted-foreground text-sm">
                  Regenerating image...
                </p>
              </div>
            </div>
          ) : (
            <Image
              src={scene.imageUrl}
              alt="Scene preview"
              fill
              className="object-cover"
            />
          )}
        </div>
        <div className="text-center">
          <Button
            onClick={onRegenerateImage}
            disabled={isRegenerating}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRegenerating && "animate-spin")}
            />
            {isRegenerating ? "Regenerating..." : "Regenerate Image"}
          </Button>
        </div>
      </div>

      {/* Image Description */}
      <div className="space-y-2">
        <Label htmlFor="imageDescription" className="text-sm font-medium">
          IMAGE DESCRIPTION
        </Label>
        <Textarea
          id="imageDescription"
          value={formData.imageDescription}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              imageDescription: e.target.value,
            }))
          }
          placeholder="Describe what should be shown in this scene..."
          className="min-h-[100px] border-2"
          required
        />
        <p className="text-muted-foreground text-xs">
          This description will be used to generate the visual content for this
          scene.
        </p>
      </div>

      {/* Voice Over */}
      <div className="space-y-2">
        <Label htmlFor="voiceOver" className="text-sm font-medium">
          VOICE-OVER TEXT
        </Label>
        <Textarea
          id="voiceOver"
          value={formData.voiceOver}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, voiceOver: e.target.value }))
          }
          placeholder="Enter the narration text for this scene..."
          className="min-h-[120px] border-2"
          required
        />
        <p className="text-muted-foreground text-xs">
          This text will be converted to speech and played during this scene.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}
