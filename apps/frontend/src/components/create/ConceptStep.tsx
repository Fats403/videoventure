"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  Wand,
  Film,
  Megaphone,
  Sparkles,
  Users,
  MessageSquare,
  Building,
  Target,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SelectionCard } from "@/components/ui/selection-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type UseFormReturn } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import type { CompleteVideoForm } from "@/lib/zod/create-video";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

interface ConceptStepProps {
  form: UseFormReturn<CompleteVideoForm>;
}

export function ConceptStep({ form }: ConceptStepProps) {
  const selectedFormat = form.watch("concept.format");
  const selectedVoiceId = form.watch("concept.voiceId");
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: voicesData, isLoading: voicesLoading } =
    api.voice.getVoices.useQuery(
      { pageSize: 50 },
      {
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    );

  // Get the selected voice data
  const selectedVoice = voicesData?.voices.find(
    (voice) => voice.voice_id === selectedVoiceId,
  );

  // Handle audio play/pause with proper cleanup
  const handlePlayToggle = useCallback(
    (voiceId: string, previewUrl?: string, event?: React.MouseEvent) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!previewUrl) return;

      // If same voice is playing, pause it
      if (currentPlayingId === voiceId) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setCurrentPlayingId(null);
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Start new audio
      try {
        const audio = new Audio(previewUrl);
        audioRef.current = audio;

        audio.addEventListener("ended", () => {
          setCurrentPlayingId(null);
          audioRef.current = null;
        });

        audio.addEventListener("error", () => {
          setCurrentPlayingId(null);
          audioRef.current = null;
        });

        audio
          .play()
          .then(() => {
            setCurrentPlayingId(voiceId);
          })
          .catch((error) => {
            console.error("Error playing audio:", error);
            setCurrentPlayingId(null);
            audioRef.current = null;
          });
      } catch (error) {
        console.error("Error creating audio:", error);
      }
    },
    [currentPlayingId],
  );

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold">Create Your Concept</h1>
        <p className="text-muted-foreground text-lg">
          Tell us about your vision and we&apos;ll help bring it to life
        </p>
      </div>

      <div className="space-y-8">
        {/* Creation Method Selection */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              How would you like to create your video?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="concept.option"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectionCard
                      icon={Wand}
                      title="Develop concept with AI"
                      isSelected={field.value === "ai"}
                      onClick={() => field.onChange("ai")}
                      className="h-auto flex-col items-start space-y-3 space-x-0"
                    />
                    <SelectionCard
                      icon={Upload}
                      title="Stick to the script"
                      isSelected={field.value === "script"}
                      onClick={() => field.onChange("script")}
                      className="h-auto flex-col items-start space-y-3 space-x-0"
                    />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Main Concept Input */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Your Concept</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="concept.content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Textarea
                        placeholder="Describe your video concept... You can input anything from a full script, a few scenes, or just a story idea. The more detail you provide, the better we can bring your vision to life."
                        className="focus-visible:ring-primary/40 focus-visible:border-primary/50 bg-background/80 min-h-[200px] resize-none rounded-lg border-2 p-6 text-base leading-relaxed"
                        {...field}
                      />
                      <div className="text-muted-foreground absolute right-4 bottom-4 text-sm">
                        {field.value?.length || 0} / 3000
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Format Selection */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Video Format</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="concept.format"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SelectionCard
                      icon={Sparkles}
                      title="Custom"
                      isSelected={field.value === "custom"}
                      onClick={() => field.onChange("custom")}
                      className="h-auto flex-col items-start space-y-3 space-x-0"
                    />
                    <SelectionCard
                      icon={Film}
                      title="Short Film"
                      isSelected={field.value === "shortFilm"}
                      onClick={() => field.onChange("shortFilm")}
                      className="h-auto flex-col items-start space-y-3 space-x-0"
                    />
                    <SelectionCard
                      icon={Megaphone}
                      title="Commercial"
                      isSelected={field.value === "commercial"}
                      onClick={() => field.onChange("commercial")}
                      className="h-auto flex-col items-start space-y-3 space-x-0"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Commercial-specific Questions */}
        <AnimatePresence>
          {selectedFormat === "commercial" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-primary/20 bg-primary/5 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="text-primary h-5 w-5" />
                    Commercial Details
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Help us create a more targeted commercial by answering these
                    questions
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="concept.commercialTargetAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            <Users className="h-4 w-4" />
                            TARGET AUDIENCE
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Young professionals aged 25-35, Parents with children, Tech enthusiasts..."
                              className="focus-visible:border-primary/50 focus-visible:ring-primary/30 border-2"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="concept.commercialBrand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            <Building className="h-4 w-4" />
                            BRAND/COMPANY
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brand name or company"
                              className="focus-visible:border-primary/50 focus-visible:ring-primary/30 border-2"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="concept.commercialMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <MessageSquare className="h-4 w-4" />
                          KEY MESSAGE
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What's the main message you want to convey? What problem does your product/service solve?"
                            className="focus-visible:border-primary/50 focus-visible:ring-primary/30 min-h-[100px] resize-none border-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="concept.commercialCallToAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <Target className="h-4 w-4" />
                          CALL TO ACTION
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Visit our website, Download the app, Call now, Sign up today..."
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional Settings */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Optional Settings</CardTitle>
            <p className="text-muted-foreground text-sm">
              Fine-tune your video with these additional options
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                {selectedFormat === "custom" && (
                  <FormField
                    control={form.control}
                    name="concept.customFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          CUSTOM FORMAT
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="How should the AI shape your story?"
                            className="focus-visible:border-primary/50 focus-visible:ring-primary/30 border-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="concept.tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        TONE
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="This shapes the mood and emotional impact of your story"
                          className="focus-visible:border-primary/50 focus-visible:ring-primary/30 border-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="w-full space-y-6">
                <FormField
                  control={form.control}
                  name="concept.genre"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-sm font-medium">
                        GENRE
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="focus-visible:border-primary/50 focus-visible:ring-primary/30 w-full border-2">
                            <SelectValue placeholder="Select a genre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="comedy">Comedy</SelectItem>
                          <SelectItem value="drama">Drama</SelectItem>
                          <SelectItem value="fantasy">Fantasy</SelectItem>
                          <SelectItem value="horror">Horror</SelectItem>
                          <SelectItem value="scifi">Science Fiction</SelectItem>
                          <SelectItem value="thriller">Thriller</SelectItem>
                          <SelectItem value="documentary">
                            Documentary
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="concept.voiceId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-sm font-medium">
                        VOICE ACTOR
                      </FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={voicesLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="focus-visible:border-primary/50 focus-visible:ring-primary/30 flex-1 border-2">
                              <SelectValue
                                placeholder={
                                  voicesLoading
                                    ? "Loading voices..."
                                    : "Select voice"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {voicesData?.voices.map((voice) => {
                              const isPlaying =
                                currentPlayingId === voice.voice_id;
                              return (
                                <SelectItem
                                  key={voice.voice_id}
                                  value={voice.voice_id}
                                  className="flex items-center justify-between p-3"
                                >
                                  <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Volume2 className="text-muted-foreground h-4 w-4" />
                                      <span>{voice.name}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                            {!voicesLoading &&
                              (!voicesData?.voices ||
                                voicesData.voices.length === 0) && (
                                <SelectItem value="" disabled>
                                  No voices available
                                </SelectItem>
                              )}
                          </SelectContent>
                        </Select>

                        {/* Play button for selected voice */}
                        {selectedVoice?.preview_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) =>
                              handlePlayToggle(
                                selectedVoice.voice_id,
                                selectedVoice.preview_url,
                                e,
                              )
                            }
                          >
                            {currentPlayingId === selectedVoice.voice_id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
