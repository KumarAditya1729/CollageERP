import { Search } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function BarcodeScanner({
  onScan,
  placeholder = "Scan barcode...",
  autoFocus = true,
}: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        onScan(value);
        e.currentTarget.value = "";
      }
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className="pl-9"
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Optional: re-focus aggressively if it's a dedicated terminal
          // if (autoFocus) inputRef.current?.focus();
        }}
      />
    </div>
  );
}
