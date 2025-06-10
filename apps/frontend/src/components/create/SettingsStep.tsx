"use client";

import React, { useRef, useState, useEffect } from "react";
import { type UseFormReturn } from "react-hook-form";
import type { CompleteVideoForm } from "@/lib/zod/create-video";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Info,
  Edit,
  Settings,
  Users,
  Palette,
  Upload,
  X,
  Camera,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Character } from "@video-venture/shared";
import { FAL_VIDEO_MODELS } from "@video-venture/shared";

const styleCardWidth = 96;

interface SettingsStepProps {
  form: UseFormReturn<CompleteVideoForm>;
}

const aspectRatios = [
  {
    label: "16:9",
    value: "16:9" as const,
    icon: "▭",
    description: "Landscape (YouTube, TV)",
  },
  {
    label: "1:1",
    value: "1:1" as const,
    icon: "◼",
    description: "Square (Instagram)",
  },
  {
    label: "9:16",
    value: "9:16" as const,
    icon: "▯",
    description: "Portrait (TikTok, Stories)",
  },
];

const videoStyles = [
  {
    label: "None",
    value: "none" as const,
    description: "No style applied",
    color: "bg-gray-200",
  },
  {
    label: "Boost",
    value: "boost" as const,
    description: "Enhanced colors and contrast",
    color: "bg-gradient-to-br from-orange-400 to-red-500",
  },
  {
    label: "Scribble",
    value: "scribble" as const,
    description: "Artistic hand-drawn look",
    color: "bg-gradient-to-br from-purple-400 to-pink-500",
  },
  {
    label: "Film Noir",
    value: "filmnoir" as const,
    description: "Classic black & white contrast",
    color: "bg-gradient-to-br from-gray-800 to-black",
  },
  {
    label: "Dreamy",
    value: "dreamy" as const,
    description: "Soft focus with ethereal lighting",
    color: "bg-gradient-to-br from-blue-300 to-purple-400",
  },
  {
    label: "Vintage",
    value: "vintage" as const,
    description: "Retro film grain effects",
    color: "bg-gradient-to-br from-yellow-600 to-orange-700",
  },
  {
    label: "Neon",
    value: "neon" as const,
    description: "Vibrant colors with glow effects",
    color: "bg-gradient-to-br from-cyan-400 to-purple-600",
  },
];

export function SettingsStep({ form }: SettingsStepProps) {
  const styleScrollRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [showLeftBlur, setShowLeftBlur] = useState(false);
  const [showRightBlur, setShowRightBlur] = useState(true);
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null,
  );

  // Get characters from form
  const characters = form.watch("settings.characters") || [];

  // Check scroll position when component mounts and on window resize
  useEffect(() => {
    const checkScrollPosition = () => {
      if (!styleScrollRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } = styleScrollRef.current;
      setShowLeftBlur(scrollLeft > 0);
      setShowRightBlur(scrollLeft + clientWidth < scrollWidth - 1);
    };

    checkScrollPosition();
    const scrollElement = styleScrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollPosition);
    }
    window.addEventListener("resize", checkScrollPosition);

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", checkScrollPosition);
      }
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, []);

  const scrollStyles = (direction: "left" | "right") => {
    if (!styleScrollRef.current) return;
    const scrollAmount = styleCardWidth * 2;
    const currentScroll = styleScrollRef.current.scrollLeft;

    styleScrollRef.current.scrollTo({
      left:
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount,
      behavior: "smooth",
    });
  };

  const handleAddCharacter = () => {
    setEditingCharacter(null);
    setIsCharacterDialogOpen(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setIsCharacterDialogOpen(true);
  };

  const handleSaveCharacter = (characterData: Partial<Character>) => {
    const currentCharacters = form.getValues("settings.characters") || [];

    if (editingCharacter) {
      // Update existing character
      const updatedCharacters = currentCharacters.map((char) =>
        char.id === editingCharacter.id ? { ...char, ...characterData } : char,
      );
      form.setValue("settings.characters", updatedCharacters);
    } else {
      // Add new character
      const newCharacter: Character = {
        id: Date.now().toString(),
        name: characterData.name ?? "",
        description: characterData.description,
        image: characterData.image,
        appearance: characterData.appearance,
        clothing: characterData.clothing,
        voice: characterData.voice,
        age: characterData.age,
      };
      form.setValue("settings.characters", [
        ...currentCharacters,
        newCharacter,
      ]);
    }
    setIsCharacterDialogOpen(false);
  };

  const handleDeleteCharacter = (id: string) => {
    const currentCharacters = form.getValues("settings.characters") || [];
    const updatedCharacters = currentCharacters.filter(
      (char) => char.id !== id,
    );
    form.setValue("settings.characters", updatedCharacters);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold">Settings & Cast</h1>
        <p className="text-muted-foreground text-lg">
          Configure your video settings and create your characters
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: Project Settings */}
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="text-primary h-5 w-5" />
                Project Settings
              </CardTitle>
              <CardDescription>
                Configure the basic settings for your video project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Name */}
              <FormField
                control={form.control}
                name="settings.projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      PROJECT NAME *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your project name"
                        className="focus-visible:border-primary/50 focus-visible:ring-primary/30 border-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Video Model Selector */}
              <FormField
                control={form.control}
                name="settings.videoModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      VIDEO MODEL
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="focus-visible:border-primary/50 focus-visible:ring-primary/30 w-full border-2">
                          <SelectValue placeholder="Select a video model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FAL_VIDEO_MODELS).map(([id, model]) => (
                          <SelectItem key={id} value={id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Aspect Ratio */}
              <FormField
                control={form.control}
                name="settings.aspectRatio"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-sm font-medium">
                        ASPECT RATIO
                      </FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-muted-foreground h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Choose the width-to-height ratio of your video
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {aspectRatios.map((ar) => (
                        <Card
                          key={ar.value}
                          className={cn(
                            "cursor-pointer p-0 transition-all duration-200 hover:shadow-md",
                            field.value === ar.value
                              ? "border-primary/70 bg-primary/10 shadow-sm"
                              : "hover:border-primary/30 hover:bg-primary/5",
                          )}
                          onClick={() => field.onChange(ar.value)}
                        >
                          <CardContent className="flex flex-col items-center p-4 text-center">
                            <span className="mb-2 text-2xl">{ar.icon}</span>
                            <span className="text-sm font-medium">
                              {ar.label}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {ar.description}
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cinematic Inspiration */}
              <FormField
                control={form.control}
                name="settings.cinematicInspiration"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-sm font-medium">
                        CINEMATIC INSPIRATION
                      </FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-muted-foreground h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Describe the mood and style you want for your
                              video
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <Input
                        placeholder='E.g. "Retro, gritty, eclectic, stylish, noir..."'
                        className="focus-visible:border-primary/50 focus-visible:ring-primary/30 border-2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Video Style Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="text-primary h-5 w-5" />
                Video Style
              </CardTitle>
              <CardDescription>
                Choose a visual style to enhance your video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="settings.videoStyle"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-4">
                      {/* Video Style Grid */}
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                        {videoStyles.map((style) => (
                          <Card
                            key={style.value}
                            className={cn(
                              "cursor-pointer p-0 transition-all duration-200 hover:shadow-md",
                              field.value === style.value
                                ? "border-primary/70 bg-primary/10 shadow-sm"
                                : "hover:border-primary/30 hover:bg-primary/5",
                            )}
                            onClick={() => field.onChange(style.value)}
                          >
                            <CardContent className="flex flex-col items-center p-3 text-center">
                              <div
                                className={cn(
                                  "mb-2 h-12 w-16 rounded",
                                  style.color,
                                )}
                              ></div>
                              <span className="text-xs font-medium">
                                {style.label}
                              </span>
                              {field.value === style.value && (
                                <div className="bg-primary mt-1 h-1 w-1 rounded-full"></div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Selected style description */}
                      {field.value && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-muted-foreground text-center text-sm"
                        >
                          {
                            videoStyles.find((s) => s.value === field.value)
                              ?.description
                          }
                        </motion.div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Cast Management */}
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-primary h-5 w-5" />
                Cast & Characters
              </CardTitle>
              <CardDescription>
                Create and manage the characters in your video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Character Card */}
              <Card
                className="hover:border-primary/50 hover:bg-primary/5 cursor-pointer border-2 border-dashed p-0 transition-all duration-200"
                onClick={handleAddCharacter}
              >
                <CardContent className="flex items-center p-6">
                  <div className="bg-primary/10 mr-4 flex aspect-square h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg">
                    <Plus className="text-primary h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold">Add Character</h3>
                    <p className="text-muted-foreground text-sm">
                      Create a new cast member for your video
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Character List */}
              <AnimatePresence>
                {characters.map((character, index) => (
                  <motion.div
                    key={character.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:border-primary/50 overflow-hidden p-0 transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="aspect-square h-auto w-[120px] overflow-hidden">
                            {character.image ? (
                              <Image
                                width={120}
                                height={120}
                                src={character.image}
                                alt={character.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="bg-muted flex h-full w-full items-center justify-center">
                                <Camera className="text-muted-foreground h-8 w-8" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="mb-1 text-base font-semibold">
                                  {character.name}
                                </h3>
                                <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                                  {character.description}
                                </p>
                                {character.appearance && (
                                  <p className="text-muted-foreground text-xs">
                                    <span className="font-medium">
                                      Appearance:
                                    </span>{" "}
                                    {character.appearance}
                                  </p>
                                )}
                              </div>
                              <div className="ml-2 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditCharacter(character)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                  onClick={() =>
                                    handleDeleteCharacter(character.id)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {characters.length === 0 && (
                <div className="py-8 text-center">
                  <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground">
                    No characters added yet
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Click &quot;Add Character&quot; to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Character Dialog */}
      <Dialog
        open={isCharacterDialogOpen}
        onOpenChange={setIsCharacterDialogOpen}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-[95vw] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editingCharacter ? "Edit Character" : "Add New Character"}
            </DialogTitle>
            <DialogDescription>
              Define your character&apos;s appearance, personality, and voice
            </DialogDescription>
          </DialogHeader>

          <CharacterForm
            character={editingCharacter}
            onSave={handleSaveCharacter}
            onCancel={() => setIsCharacterDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Character Form Component
function CharacterForm({
  character,
  onSave,
  onCancel,
}: {
  character: Character | null;
  onSave: (data: Partial<Character>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: character?.name ?? "",
    description: character?.description ?? "",
    appearance: character?.appearance ?? "",
    clothing: character?.clothing ?? "",
    voice: character?.voice ?? "",
    age: character?.age ?? "",
    image: character?.image ?? "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image: previewUrl }));
    }
  };

  const handleGenerateCharacter = async () => {
    setIsGenerating(true);
    // TODO: Call your AI service to generate character image
    setTimeout(() => {
      const generatedImageUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=400&fit=crop&auto=format`;
      setFormData((prev) => ({ ...prev, image: generatedImageUrl }));
      setIsGenerating(false);
    }, 3000);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      {/* Left Side - Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              CHARACTER NAME *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter character name"
              className="border-2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium">
              AGE
            </Label>
            <Input
              id="age"
              value={formData.age}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, age: e.target.value }))
              }
              placeholder="e.g., 25, Ancient, Young adult"
              className="border-2"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            DESCRIPTION *
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe your character's personality and role"
            className="min-h-[80px] border-2"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appearance" className="text-sm font-medium">
              APPEARANCE
            </Label>
            <Textarea
              id="appearance"
              value={formData.appearance}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, appearance: e.target.value }))
              }
              placeholder="Physical characteristics, hair, height, etc."
              className="min-h-[80px] border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clothing" className="text-sm font-medium">
              CLOTHING
            </Label>
            <Textarea
              id="clothing"
              value={formData.clothing}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clothing: e.target.value }))
              }
              placeholder="What does your character wear?"
              className="min-h-[80px] border-2"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice" className="text-sm font-medium">
            VOICE CHARACTERISTICS
          </Label>
          <Input
            id="voice"
            value={formData.voice}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, voice: e.target.value }))
            }
            placeholder="e.g., Deep and commanding, High-pitched and cheerful"
            className="border-2"
          />
        </div>

        {/* Form Actions - Only visible on mobile */}
        <div className="flex gap-3 lg:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 flex-1"
          >
            {character ? "Update Character" : "Add Character"}
          </Button>
        </div>
      </form>

      {/* Right Side - Character Preview & Image Management */}
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">CHARACTER IMAGE</Label>

          {/* Image Preview */}
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg">
                {formData.image ? (
                  <>
                    {isGenerating ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <RefreshCw className="text-primary mx-auto mb-2 h-8 w-8 animate-spin" />
                          <p className="text-muted-foreground text-sm">
                            Generating character...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Image
                          src={formData.image}
                          alt="Character preview"
                          fill
                          className="object-cover"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                      <p className="text-muted-foreground text-sm">
                        No image selected
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Actions */}
          <div className="space-y-2">
            {/* Upload Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>

            {/* Generate Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleGenerateCharacter}
              disabled={isGenerating || !formData.name || !formData.description}
            >
              <RefreshCw
                className={cn("h-4 w-4", isGenerating && "animate-spin")}
              />
              {isGenerating ? "Generating..." : "Generate with AI"}
            </Button>

            {/* Helper text */}
            <p className="text-muted-foreground text-center text-xs">
              {!formData.name || !formData.description
                ? "Fill in name and description to generate"
                : "Generate based on character details"}
            </p>
          </div>

          {/* Regenerate Button (only show if image exists and not uploading) */}
          {formData.image && !uploadedFile && (
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2"
              onClick={handleGenerateCharacter}
              disabled={isGenerating}
            >
              <RefreshCw
                className={cn("h-4 w-4", isGenerating && "animate-spin")}
              />
              Regenerate
            </Button>
          )}
        </div>

        {/* Form Actions - Desktop */}
        <div className="hidden space-y-2 lg:block">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 w-full"
            onClick={handleSubmit}
          >
            {character ? "Update Character" : "Add Character"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
