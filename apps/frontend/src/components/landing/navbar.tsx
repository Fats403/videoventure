"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type React from "react";
import MobileMenu from "./mobile-menu";
import { useUser } from "@clerk/nextjs";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-card/60 fixed top-0 right-0 left-0 z-[100] border-b border-green-500/20 backdrop-blur-md"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center space-x-2">
          <Video className="h-8 w-8 text-green-500" />
          <span className="text-foreground text-xl font-medium">
            VideoVenture AI
          </span>
        </Link>

        <div className="hidden items-center space-x-8 md:flex">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
        </div>

        <div className="hidden items-center space-x-4 md:flex">
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/80 cursor-pointer">
                Go To Dashboard
                <LayoutDashboard className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="text-foreground hover:bg-muted/60 cursor-pointer"
                >
                  Login
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-primary hover:bg-primary/80 cursor-pointer">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground border-border border"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {mobileMenuOpen && (
          <MobileMenu
            onClose={() => setMobileMenuOpen(false)}
            isSignedIn={isSignedIn}
          />
        )}
      </div>
    </motion.nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground group relative transition-colors"
      onClick={(e) => {
        if (href.startsWith("#")) {
          e.preventDefault();
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }
      }}
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-green-500 transition-all group-hover:w-full" />
    </Link>
  );
}
