import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: number | string;
}

export function Spinner({ className, size = 16 }: SpinnerProps) {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      color="currentColor"
      className={cn("animate-spin", className)}
      size={size}
    />
  );
}
