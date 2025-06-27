"use client";

import React, { useRef, useState, useEffect } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  X,
  Camera,
  ImageIcon,
  Trash2,
  Loader2,
  ChevronDown,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
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
import { toast } from "sonner";
import { api } from "@/trpc/react";

const styleCardWidth = 96;

interface SettingsStepProps {
  form: UseFormReturn<CompleteVideoForm>;
}

// Character form schema - simplified
const characterFormSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  appearance: z.string().optional(),
  age: z.string().optional(),
});

type CharacterFormData = z.infer<typeof characterFormSchema>;

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
  const [showLeftBlur, setShowLeftBlur] = useState(false);
  const [showRightBlur, setShowRightBlur] = useState(true);
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null,
  );
  const [isCharacterSelectorOpen, setIsCharacterSelectorOpen] = useState(false);

  // tRPC queries and mutations with better cache management
  const { data: allCharacters = [], refetch: refetchCharacters } =
    api.character.getAll.useQuery(undefined, {
      // Only refetch on window focus if data is stale
      refetchOnWindowFocus: false,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    });

  const createCharacterMutation = api.character.create.useMutation({
    onSuccess: () => {
      refetchCharacters();
    },
  });

  const updateCharacterMutation = api.character.update.useMutation({
    onSuccess: () => {
      refetchCharacters();
    },
  });

  const deleteCharacterMutation = api.character.delete.useMutation({
    onSuccess: () => {
      refetchCharacters();
    },
  });

  // Get selected character IDs from form
  const selectedCharacterIds = form.watch("settings.characters") ?? [];

  // Get full character objects for selected IDs
  const selectedCharacters = allCharacters.filter((char) =>
    selectedCharacterIds.includes(char.id),
  );

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

  const handleCreateNewCharacter = () => {
    setEditingCharacter(null);
    setIsCharacterDialogOpen(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setIsCharacterDialogOpen(true);
  };

  const handleCharacterSaved = async (character: Character) => {
    if (!editingCharacter) {
      // Auto-select the new character
      const currentIds = form.getValues("settings.characters") ?? [];
      form.setValue("settings.characters", [...currentIds, character.id]);
    }

    setIsCharacterDialogOpen(false);
    toast.success(
      editingCharacter ? "Character updated!" : "Character created!",
    );
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      await deleteCharacterMutation.mutateAsync({ id: characterId });

      // Remove from selected characters
      const currentIds = form.getValues("settings.characters") ?? [];
      form.setValue(
        "settings.characters",
        currentIds.filter((id) => id !== characterId),
      );

      toast.success("Character deleted!");
    } catch {
      toast.error("Failed to delete character");
    }
  };

  const handleCharacterToggle = (characterId: string, checked: boolean) => {
    const currentIds = form.getValues("settings.characters") ?? [];
    if (checked) {
      form.setValue("settings.characters", [...currentIds, characterId]);
    } else {
      form.setValue(
        "settings.characters",
        currentIds.filter((id) => id !== characterId),
      );
    }
  };

  const handleRemoveCharacterFromProject = (characterId: string) => {
    const currentIds = form.getValues("settings.characters") ?? [];
    form.setValue(
      "settings.characters",
      currentIds.filter((id) => id !== characterId),
    );
  };

  const handleDelete = () => {
    if (!editingCharacter) return;
    handleDeleteCharacter(editingCharacter.id);
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
                Select characters for your video project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Character Multi-Select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">SELECT CHARACTERS</Label>
                <div className="flex gap-2">
                  <Popover
                    open={isCharacterSelectorOpen}
                    onOpenChange={setIsCharacterSelectorOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-between border-2"
                        disabled={allCharacters.length === 0}
                      >
                        <span className="text-left">
                          {selectedCharacterIds.length === 0
                            ? allCharacters.length === 0
                              ? "No characters available"
                              : "Select characters"
                            : `${selectedCharacterIds.length} character${
                                selectedCharacterIds.length === 1 ? "" : "s"
                              } selected`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-3">
                        <div className="space-y-3">
                          {allCharacters.map((character) => (
                            <div
                              key={character.id}
                              className="flex items-center space-x-3"
                            >
                              <Checkbox
                                id={character.id}
                                checked={selectedCharacterIds.includes(
                                  character.id,
                                )}
                                onCheckedChange={(checked: boolean) =>
                                  handleCharacterToggle(
                                    character.id,
                                    checked === true,
                                  )
                                }
                              />
                              <div className="flex flex-1 items-center space-x-2">
                                {character.imageUrl && (
                                  <div className="h-8 w-8 overflow-hidden rounded">
                                    <Image
                                      src={character.imageUrl}
                                      alt={character.name}
                                      width={32}
                                      height={32}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <label
                                    htmlFor={character.id}
                                    className="cursor-pointer text-sm font-medium"
                                  >
                                    {character.name}
                                  </label>
                                  <p className="text-muted-foreground line-clamp-1 text-xs">
                                    {character.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {allCharacters.length === 0 && (
                            <p className="text-muted-foreground py-4 text-center text-sm">
                              No characters available. Create one below.
                            </p>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    onClick={handleCreateNewCharacter}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </div>
              </div>

              {/* Selected Characters List */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  SELECTED CHARACTERS ({selectedCharacters.length})
                </Label>

                <AnimatePresence>
                  {selectedCharacters.map((character, index) => (
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
                            <div className="aspect-square h-auto w-[80px] overflow-hidden">
                              {character.imageUrl ? (
                                <Image
                                  width={80}
                                  height={80}
                                  src={character.imageUrl}
                                  alt={character.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="bg-muted flex h-full w-full items-center justify-center">
                                  <Camera className="text-muted-foreground h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 p-3">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="mb-1 text-sm font-semibold">
                                    {character.name}
                                  </h3>
                                  <p className="text-muted-foreground mb-1 line-clamp-2 text-xs">
                                    {character.description}
                                  </p>
                                  {character.age && (
                                    <p className="text-muted-foreground text-xs">
                                      <span className="font-medium">Age:</span>{" "}
                                      {character.age}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-2 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() =>
                                      handleEditCharacter(character)
                                    }
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive h-7 w-7 p-0"
                                    onClick={() =>
                                      handleRemoveCharacterFromProject(
                                        character.id,
                                      )
                                    }
                                  >
                                    <X className="h-3 w-3" />
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

                {selectedCharacters.length === 0 && (
                  <div className="py-6 text-center">
                    <Users className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                    <p className="text-muted-foreground text-sm">
                      No characters selected for this project
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Use the selector above to choose characters
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Character Dialog */}
      <Dialog
        open={isCharacterDialogOpen}
        onOpenChange={setIsCharacterDialogOpen}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-[95vw] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingCharacter ? "Edit Character" : "Create New Character"}
            </DialogTitle>
            <DialogDescription>
              {editingCharacter
                ? "Update your character's details and appearance"
                : "Create a new character for your video projects"}
            </DialogDescription>
          </DialogHeader>

          <CharacterForm
            character={editingCharacter}
            onSave={handleCharacterSaved}
            onDelete={handleDelete}
            onCancel={() => setIsCharacterDialogOpen(false)}
            createMutation={createCharacterMutation}
            updateMutation={updateCharacterMutation}
            deleteMutation={deleteCharacterMutation}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simplified Character Form Component
function CharacterForm({
  character,
  onSave,
  onDelete,
  onCancel,
  createMutation,
  updateMutation,
  deleteMutation,
}: {
  character: Character | null;
  onSave: (character: Character) => void;
  onDelete: () => void;
  onCancel: () => void;
  createMutation: ReturnType<typeof api.character.create.useMutation>;
  updateMutation: ReturnType<typeof api.character.update.useMutation>;
  deleteMutation?: ReturnType<typeof api.character.delete.useMutation>;
}) {
  const characterForm = useForm<CharacterFormData>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: character?.name ?? "",
      description: character?.description ?? "",
      appearance: character?.appearance ?? "",
      age: character?.age ?? "",
    },
  });

  const [generatedImageUrl, setGeneratedImageUrl] = useState(
    character?.imageUrl ?? "",
  );

  const handleSubmit = async (data: CharacterFormData) => {
    try {
      let savedCharacter: Character;

      if (character) {
        // Update existing character (will regenerate image)
        savedCharacter = await updateMutation.mutateAsync({
          id: character.id,
          data,
        });
        // Update the preview image
        setGeneratedImageUrl(savedCharacter.imageUrl ?? "");
      } else {
        // Create new character
        savedCharacter = await createMutation.mutateAsync(data);
        setGeneratedImageUrl(savedCharacter.imageUrl ?? "");
      }

      onSave(savedCharacter);
    } catch {
      toast.error(
        character ? "Failed to update character" : "Failed to create character",
      );
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(); // Simple callback - no async handling needed
  };

  const isLoading = createMutation.isPending ?? updateMutation.isPending;
  const isDeleting = deleteMutation?.isPending ?? false;
  const isAnyLoading = isLoading ?? isDeleting;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      {/* Left Side - Form */}
      <Form {...characterForm}>
        <form
          onSubmit={characterForm.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={characterForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    CHARACTER NAME *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter character name"
                      className="border-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={characterForm.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">AGE</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 25, Ancient, Young adult"
                      className="border-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={characterForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  DESCRIPTION *
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your character's personality, role, and any specific details"
                    className="min-h-[100px] border-2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={characterForm.control}
            name="appearance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  APPEARANCE
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Physical characteristics, clothing, hair, height, etc."
                    className="min-h-[80px] border-2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Form Actions - Only visible on mobile */}
          <div className="flex gap-3 lg:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isAnyLoading}
            >
              Cancel
            </Button>
            {character && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
                disabled={isAnyLoading}
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 flex-1"
              disabled={isAnyLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {character ? "Update Character" : "Create Character"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Right Side - Character Preview */}
      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">CHARACTER PREVIEW</Label>

          {/* Image Preview */}
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg">
                {generatedImageUrl ? (
                  <Image
                    src={generatedImageUrl}
                    alt="Character preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                      <p className="text-muted-foreground text-sm">
                        {character
                          ? "Character image"
                          : "Image will be generated"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {character && (
            <p className="text-muted-foreground text-center text-xs">
              Updating any field will regenerate the character image
            </p>
          )}
        </div>

        {/* Form Actions - Desktop */}
        <div className="hidden space-y-2 lg:block">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 w-full"
            onClick={characterForm.handleSubmit(handleSubmit)}
            disabled={isAnyLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {character ? "Update Character" : "Create Character"}
          </Button>
          {character && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="w-full gap-2"
              disabled={isAnyLoading}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Character"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full"
            disabled={isAnyLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
