"use client";

import React from "react";
import { motion } from "framer-motion";
import { VideoShowcaseMarquee } from "@/components/ui/marquee";
import { Sparkles, Play } from "lucide-react";

export default function VideoShowcase() {
  return (
    <section className="bg-background relative overflow-hidden px-6 py-20">
      <div className="from-primary/5 absolute inset-0 bg-gradient-to-b to-transparent" />

      <div className="relative z-10 container mx-auto">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-primary/10 text-primary mb-4 inline-flex items-center space-x-2 rounded-full px-4 py-2"
          >
            <Play className="h-4 w-4" />
            <span className="text-sm font-medium">Video Gallery</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-foreground mb-6 text-4xl font-bold md:text-5xl"
          >
            Videos Created with
            <br />
            <span className="text-primary"> VideoVenture AI</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mx-auto max-w-3xl text-lg"
          >
            See what our users have created with the power of AI. From marketing
            campaigns to educational content, these videos showcase the endless
            possibilities.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative"
        >
          <VideoShowcaseMarquee />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Join thousands of creators who are already making amazing videos
            with AI
          </p>
          <div className="text-muted-foreground flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <Sparkles className="text-primary h-4 w-4" />
              <span>No video editing experience required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="text-primary h-4 w-4" />
              <span>Professional results in minutes</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
