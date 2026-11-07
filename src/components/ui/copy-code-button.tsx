"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============ CopyCodeButton ============
//
// A reusable copy-to-clipboard button that renders a small icon next to
// any reference code (order number, gift card code, booking reference).
// Click → copies the code to the clipboard + shows a "Copied to
// clipboard!" toast + briefly swaps the icon from Copy → Check for
// visual confirmation.
//
// Usage:
//   <CopyCodeButton code="TG-ABC12345" />
//   <CopyCodeButton code="BK-2026-XXXXXX" label="booking reference" />
//   <CopyCodeButton code={redemptionCode} className="ml-1" />
//
// Props:
//   code:     The string to copy to the clipboard. Required.
//   label:    Optional label for the toast (e.g. "gift card code",
//             "booking reference"). Defaults to "code".
//   className: Optional extra Tailwind classes for the button.
//   size:     Icon size in px. Defaults to 14 (matches text-[11px] mono
//             codes used across the app).
//
// Accessibility:
//   - The button has aria-label="Copy <label>" so screen readers
//     announce what it does.
//   - When copied, the aria-label switches to "Copied <label>" so
//     screen readers announce the success.

export function CopyCodeButton({
  code,
  label = "code",
  className,
  size = 14,
}: {
  code: string;
  label?: string;
  className?: string;
  size?: number;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: `${label.charAt(0).toUpperCase() + label.slice(1)} copied — paste it anywhere.`,
      });
      // Reset the copied state after 1.8s so the icon reverts to Copy
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail in insecure contexts (non-https) or in
      // older browsers. Fall back to a toast telling the user to copy
      // manually.
      toast({
        title: "Couldn't copy",
        description: "Select the code and copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      title={copied ? "Copied!" : `Copy ${label}`}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1 text-[#F10897] transition-all hover:bg-[#E8B6D5]/30 active:scale-90",
        className,
      )}
    >
      {copied ? (
        <Check
          style={{ width: size, height: size }}
          strokeWidth={2.5}
          className="text-[#2d6e4f]"
        />
      ) : (
        <Copy
          style={{ width: size, height: size }}
          strokeWidth={2.5}
        />
      )}
    </button>
  );
}
