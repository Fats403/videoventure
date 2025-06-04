"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface MobileMenuProps {
  onClose: () => void;
  isSignedIn?: boolean;
}

export default function MobileMenu({ onClose, isSignedIn }: MobileMenuProps) {
  const { setTheme, theme } = useTheme();

  const handleLinkClick = (href: string) => {
    onClose();
    if (href.startsWith("#")) {
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-background/95 fixed inset-0 top-0 z-50 flex h-screen flex-col overflow-y-auto px-6 py-8 pt-[72px] backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        className="border-border bg-card/30 text-foreground hover:bg-muted/10 absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
        aria-label="Close menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="mt-4 flex flex-col space-y-4 text-lg">
        <button
          onClick={toggleTheme}
          className="text-foreground hover:bg-muted/5 flex items-center rounded-lg px-4 py-3 transition-colors hover:text-green-400"
        >
          {theme === "dark" ? <>Toggle Light Theme</> : <>Toggle Dark Theme</>}
        </button>
        <Link
          href="#features"
          onClick={() => handleLinkClick("#features")}
          className="text-foreground hover:bg-muted/5 flex items-center rounded-lg px-4 py-3 transition-colors hover:text-green-400"
        >
          Features
        </Link>
        <Link
          href="#how-it-works"
          onClick={() => handleLinkClick("#how-it-works")}
          className="text-foreground hover:bg-muted/5 flex items-center rounded-lg px-4 py-3 transition-colors hover:text-green-400"
        >
          How it Works
        </Link>
        <Link
          href="#testimonials"
          onClick={() => handleLinkClick("#testimonials")}
          className="text-foreground hover:bg-muted/5 flex items-center rounded-lg px-4 py-3 transition-colors hover:text-green-400"
        >
          Testimonials
        </Link>
        <Link
          href="#pricing"
          onClick={() => handleLinkClick("#pricing")}
          className="text-foreground hover:bg-muted/5 flex items-center rounded-lg px-4 py-3 transition-colors hover:text-green-400"
        >
          Pricing
        </Link>
        <Link
          href="#faq"
          onClick={() => handleLinkClick("#faq")}
          className="text-foreground hover:bg-muted/5 flex items-center rounded-lg px-4 py-3 transition-colors hover:text-green-400"
        >
          FAQ
        </Link>
      </div>

      <div className="mt-auto flex flex-col space-y-4 pt-6">
        {!isSignedIn ? (
          <>
            <Link href="/sign-in">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted/10 w-full cursor-pointer py-5"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="w-full cursor-pointer bg-green-600 py-5 hover:bg-green-700">
                Get Started
              </Button>
            </Link>
          </>
        ) : (
          <Link href="/dashboard">
            <Button className="w-full cursor-pointer bg-green-600 py-5 hover:bg-green-700">
              Go To Dashboard
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
