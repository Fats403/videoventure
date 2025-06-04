"use client";

import React, { memo, useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  darkModeColors?: string[];
  lightModeColors?: string[];
  speed?: number;
}

export const AuroraText = memo(
  ({
    children,
    className = "",
    // Default colors for backward compatibility
    colors,
    // Dark mode colors (greens that look good on dark background)
    darkModeColors = ["#4ade80", "#059669", "#a7f3d0", "#10b981"],
    // Light mode colors (darker greens that look good on light background)
    lightModeColors = ["#065f46", "#047857", "#059669", "#10b981"],
    speed = 1,
  }: AuroraTextProps) => {
    // Use next-themes to get the current theme
    const { resolvedTheme } = useTheme();
    // Track mounting state to avoid hydration mismatch
    const [mounted, setMounted] = useState(false);

    // Set mounted to true after component mounts
    useEffect(() => {
      setMounted(true);
    }, []);

    // Choose colors based on theme, defaulting to dark mode colors
    // Only use the resolvedTheme when the component is mounted to prevent hydration mismatch
    const currentColors =
      colors ??
      (!mounted
        ? darkModeColors
        : resolvedTheme === "light"
          ? lightModeColors
          : darkModeColors);

    const gradientStyle = {
      backgroundImage: `linear-gradient(135deg, ${currentColors.join(", ")}, ${
        currentColors[0]
      })`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animationDuration: `${10 / speed}s`,
    };

    return (
      <span className={`relative inline-block ${className}`}>
        <span className="sr-only">{children}</span>
        <span
          className="animate-aurora relative bg-[length:200%_auto] bg-clip-text text-transparent"
          style={gradientStyle}
          aria-hidden="true"
        >
          {children}
        </span>
      </span>
    );
  },
);

AuroraText.displayName = "AuroraText";
