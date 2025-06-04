"use client";

import { Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Video className="w-8 h-8 text-green-500" />
              <span className="text-foreground font-medium text-xl">
                VideoVenture AI
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              Transform your ideas into professional videos with the power of
              artificial intelligence.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-foreground"
              >
                <Facebook className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-foreground"
              >
                <Instagram className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-foreground font-medium text-lg mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#features"
                  className="text-gray-400 hover:text-foreground transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-gray-400 hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-gray-400 hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#faq"
                  className="text-gray-400 hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-medium text-lg mb-6">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-foreground transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-medium text-lg mb-6">
              Subscribe
            </h3>
            <p className="text-gray-400 mb-4">
              Stay updated with our latest features and releases
            </p>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-card border-border focus:border-green-500"
              />
              <Button className="bg-green-600 hover:bg-green-700">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-gray-500 text-sm">
          <p>
            &copy; {new Date().getFullYear()} VideoVenture AI. All rights
            reserved.
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link href="#" className="hover:text-green-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-green-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-green-400 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
