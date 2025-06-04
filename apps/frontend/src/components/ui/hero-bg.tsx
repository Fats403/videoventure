import { DotPattern } from "../landing/dot-pattern";
import { Spotlight } from "./spotlight";

export default function HeroBg() {
  return (
    <div>
      <Spotlight />

      {/* Enhanced background with theme compatible styling */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Base gradient that works with both themes */}
        <div className="from-card via-background to-card absolute inset-0 bg-gradient-to-br"></div>

        <DotPattern className="text-green-500/20 opacity-60 dark:opacity-30" />

        {/* Symmetrical accent elements */}

        <div className="absolute right-1/3 bottom-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/10 blur-[140px]"></div>

        {/* Theme-appropriate vignette */}
        <div className="from-background/70 via-background/30 absolute inset-0 bg-gradient-to-t to-transparent"></div>
        <div className="bg-radial-gradient absolute inset-0"></div>
      </div>
    </div>
  );
}
