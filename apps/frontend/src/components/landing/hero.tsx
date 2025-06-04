"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuroraText } from "@/components/ui/aurora-text";
import { BorderBeam } from "@/components/ui/border-beam";
import { WordRotate } from "@/components/ui/word-flip";
import HeroBg from "@/components/ui/hero-bg";

// Extracted form component to prevent re-renders of the entire Hero
const VideoIdeaForm = React.memo(() => {
  const [videoIdea, setVideoIdea] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the video idea submission
    console.log("Video idea submitted:", videoIdea);
    // You would typically redirect to creation page or open a modal here
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="bg-card/70 border-border relative flex flex-col items-center overflow-hidden rounded-2xl border p-3 shadow-lg backdrop-blur-sm sm:flex-row">
        <div className="w-full flex-1 bg-transparent px-2">
          <Input
            type="text"
            value={videoIdea}
            onChange={(e) => setVideoIdea(e.target.value)}
            placeholder="Type your video idea here..."
            className="text-foreground placeholder-muted-foreground border-0 bg-transparent py-6 font-sans text-lg shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ background: "transparent" }}
          />
        </div>
        <Button
          type="submit"
          className="font-heading mt-2 flex w-full items-center justify-center px-5 py-4 text-sm font-medium shadow-sm sm:mt-0 sm:ml-2 sm:w-auto"
        >
          Create Video <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {/* BorderBeam properly configured */}
        <BorderBeam
          colorFrom="#10b981"
          colorTo="#059669"
          size={120}
          duration={5}
        />
      </div>

      <WordRotate
        duration={5000}
        className="text-muted-foreground mt-3 font-sans"
        words={[
          'Example: "A documentary about Australian kangaroos with aerial drone footage"',
          'Example: "A commercial for handcrafted leather wallets with soft lighting"',
          'Example: "A tutorial on how to make chocolate chip cookies with close-up shots"',
          'Example: "A montage of Eiffel Tower from sunrise to sunset with time-lapse"',
          'Example: "An explainer about how solar panels work with simple animations"',
          'Example: "A retro-style video tour of Route 66 landmarks with film grain effect"',
          'Example: "A cyberpunk visualization of Tokyo streets at night with neon effects"',
          'Example: "A stop-motion animation of flowers blooming in spring"',
          'Example: "A Halloween makeup tutorial with dramatic lighting"',
          'Example: "A documentary about polar bears with snow-covered landscapes"',
          'Example: "A Mediterranean cooking demonstration with seaside background"',
          'Example: "A short film about Amazon rainforest wildlife with macro shots"',
          'Example: "A vintage-style jazz club performance with sepia tone effects"',
          'Example: "A skateboarding sequence in an urban park with slow-motion jumps"',
        ]}
      />
    </motion.form>
  );
});

// Adding display name to fix linter error
VideoIdeaForm.displayName = "VideoIdeaForm";

export default function Hero() {
  return (
    <div className="border-border relative flex h-screen items-center justify-center border-b">
      <HeroBg />

      <div className="relative z-10 container mx-auto mt-24 px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-foreground font-heading mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Start Your <AuroraText>Video Venture</AuroraText>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mb-10 font-sans text-lg md:text-xl"
            >
              Transform your ideas into videos in minutes. Our AI generates
              stunning visuals, animations, background music and narration from
              your simple text prompts.
            </motion.p>

            <VideoIdeaForm />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
