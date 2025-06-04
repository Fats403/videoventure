"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface InputPlaceholderProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  rows?: number;
}

export function InputPlaceholder({
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  className = "",
  rows = 5,
}: InputPlaceholderProps) {
  return (
    <Textarea
      className={`w-full resize-none rounded-lg border border-green-500/50 p-4 focus:border-transparent focus:ring-2 focus:ring-green-500/50 focus:outline-none ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      rows={rows}
    />
  );
}
