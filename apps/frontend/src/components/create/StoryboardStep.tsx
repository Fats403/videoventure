"use client";

import React, { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import type { CompleteVideoForm } from "@/lib/zod/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, FileText, Edit3, Sparkles, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface StoryboardStepProps {
  form: UseFormReturn<CompleteVideoForm>;
}

export function StoryboardStep({ form }: StoryboardStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Get storyboard data from form
  const storyboardData = form.watch("storyboard");
  const variants = storyboardData?.variants ?? [];
  const selectedVariantId = storyboardData?.selectedVariantId;

  // Find the selected variant or default to first one
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  const handleSelectVariant = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId);
    if (variant) {
      form.setValue("storyboard.selectedVariantId", variantId);
      form.setValue("storyboard.customContent", variant.content);
    }
  };

  const handleGenerateMore = async () => {
    setIsGenerating(true);
    // TODO: Call API to generate more variants
    // For now, just simulate loading
    setTimeout(() => {
      setIsGenerating(false);
      // In real app, would update form with new variants
    }, 2000);
  };

  // If no variants available, show loading or empty state
  if (!variants.length) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold">Review Your Storyboard</h1>
          <p className="text-muted-foreground text-lg">
            Generating your storyboard variants...
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
              <p className="text-muted-foreground">
                Creating storyboard variants based on your concept...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold">Review Your Storyboard</h1>
        <p className="text-muted-foreground text-lg">
          Choose from AI-generated storylines or edit to match your vision
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[30%_70%]">
        {/* Selected Story Overview */}
        <div className="lg:col-span-2">
          {selectedVariant && (
            <Card className="border-primary/20 bg-primary/5 border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="text-primary h-5 w-5" />
                      {selectedVariant.title}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">
                      {selectedVariant.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedVariant.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Left Sidebar - Alternative Storylines */}
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary h-5 w-5" />
                Alternative Stories
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Explore different narrative approaches
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[400px] space-y-3 overflow-auto">
                <AnimatePresence>
                  {variants.map((variant, index) => (
                    <motion.div
                      key={variant.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={cn(
                          "cursor-pointer p-0 transition-all duration-200 hover:shadow-md",
                          selectedVariantId === variant.id
                            ? "border-primary/70 bg-primary/10 shadow-sm"
                            : "hover:border-primary/30 hover:bg-primary/5",
                        )}
                        onClick={() => handleSelectVariant(variant.id)}
                      >
                        <CardContent className="p-4">
                          <div className="mb-2 flex items-start justify-between">
                            <h3 className="line-clamp-1 text-sm font-semibold">
                              {variant.title}
                            </h3>
                            {selectedVariantId === variant.id && (
                              <div className="bg-primary mt-1 h-2 w-2 flex-shrink-0 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-3 line-clamp-2 text-xs">
                            {variant.description}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                type="button"
                variant="outline"
                className="hover:border-primary/50 flex w-full items-center justify-center gap-2 border-2"
                onClick={handleGenerateMore}
                disabled={isGenerating}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
                />
                {isGenerating ? "Generating..." : "Generate More"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Story Editor */}
        <div className="space-y-6">
          <Card className="border-2 pb-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="text-primary h-5 w-5" />
                Edit Your Story
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Customize the narrative to perfectly match your vision
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <FormField
                control={form.control}
                name="storyboard.customContent"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          {...field}
                          value={field.value}
                          className="min-h-[400px] w-full resize-none border-0 bg-transparent p-6 pb-16 text-base leading-relaxed focus-visible:ring-0"
                          placeholder="Your story content will appear here..."
                        />
                        <div className="bg-background absolute right-0 bottom-0 left-0 border-t p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-muted-foreground flex items-center gap-4 text-xs">
                              <span>Auto-saved</span>
                              <span>•</span>
                              <span>Last edited: just now</span>
                            </div>
                            <span className="text-muted-foreground text-xs font-medium">
                              {field.value?.length ?? 0} / 2000
                            </span>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="hover:border-primary/50 border-2"
              onClick={() => {
                // TODO: Regenerate story based on current content
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate Story
            </Button>
            <Button
              type="button"
              variant="outline"
              className="hover:border-primary/50 border-2"
              onClick={() => {
                // TODO: Enhance story with AI
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Enhance with AI
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
