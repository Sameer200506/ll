"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/media";

interface CourseThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
}

export function CourseThumbnail({
  src,
  alt,
  className,
  fallbackClassName,
  iconClassName,
}: CourseThumbnailProps) {
  const resolved = resolveImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !!resolved && failedSrc === resolved;

  if (!resolved || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-blue-100",
          className,
          fallbackClassName
        )}
        aria-label={alt || "Course thumbnail"}
      >
        <BookOpen
          className={cn("w-10 h-10 text-orange-400/70", iconClassName)}
          strokeWidth={1.5}
        />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt || "Course"}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(resolved)}
    />
  );
}
