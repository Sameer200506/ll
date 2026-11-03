"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Static exports can only emit one html file for a dynamic route. The site
 * maps every real URL such as /courses/abc to the generated /courses/default.html,
 * so the `params` prop still contains the build-time "default" value.
 *
 * Read the last URL segment on the client instead. This keeps the real
 * quiz/course/certificate id available after hydration and on hard refreshes.
 */
export function useStaticRouteParam(
  params: Promise<Record<string, string>> | undefined,
  key: string
) {
  const pathname = usePathname();
  const [value, setValue] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const segments = (pathname || "").split("/").filter(Boolean);
      const lastSegment = segments.length
        ? decodeURIComponent(segments[segments.length - 1])
        : "";

      if (lastSegment && lastSegment !== "default") {
        if (!cancelled) setValue(lastSegment);
        return;
      }

      try {
        const resolved = params ? await params : {};
        const fromParams = resolved?.[key] || "";
        if (!cancelled) setValue(fromParams === "default" ? "" : fromParams);
      } catch {
        if (!cancelled) setValue("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, params, key]);

  return value;
}
