"use client";

import { RefreshCw } from "lucide-react";

interface LoadingAnimationProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingAnimation({
  message = "Loading...",
  size = "md",
}: LoadingAnimationProps) {
  const sizes = {
    sm: {
      icon: "w-8 h-8",
      text: "text-base",
    },
    md: {
      icon: "w-12 h-12",
      text: "text-lg",
    },
    lg: {
      icon: "w-16 h-16",
      text: "text-xl",
    },
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <RefreshCw
        className={`${sizes[size].icon} text-green-500 animate-spin`}
      />
      <p className={`${sizes[size].text} text-muted-foreground text-center`}>
        {message}
      </p>
    </div>
  );
}
