const IMAGE_EXTENSION = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:$|[?#])/i;
const DOCUMENT_EXTENSION = /\.(?:csv|docx?|md|od[ps]|pdf|pptx?|rtf|txt|xlsx?)(?:$|[?#])/i;

const DOCUMENT_HOSTS = [
  "1drv.ms",
  "canva.com",
  "docs.google.com",
  "drive.google.com",
  "dropbox.com",
  "firebasestorage.googleapis.com",
  "mega.nz",
  "notion.site",
  "notion.so",
  "onedrive.live.com",
  "pdfhost.io",
];

function parseUrl(value?: string | null): URL | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function isGoogleHost(hostname: string) {
  return hostname === "google.com" || hostname.endsWith(".google.com");
}

export function extractDriveFileId(value?: string | null): string {
  const url = parseUrl(value);
  if (!url || url.hostname !== "drive.google.com") return "";

  const fromPath = url.pathname.match(/\/file\/d\/([^/]+)/i);
  if (fromPath?.[1]) return fromPath[1];

  return url.searchParams.get("id") || "";
}

function extractGoogleImage(value?: string | null): string {
  const url = parseUrl(value);
  if (!url || !isGoogleHost(url.hostname) || url.pathname !== "/imgres") return "";
  const imageUrl = url.searchParams.get("imgurl") || "";
  if (!imageUrl) return "";
  try {
    return new URL(decodeURIComponent(imageUrl)).toString();
  } catch {
    return "";
  }
}

/**
 * Course thumbnails are entered as free-form URLs. Normalise the common
 * Google Drive / Google Images links and reject values that can never render
 * as an image. The UI still has an onError fallback for everything else.
 */
export function resolveImageUrl(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) return "";

  if (raw.startsWith("data:image/") || raw.startsWith("blob:")) return raw;
  if (raw.startsWith("data:")) return "";

  const googleImage = extractGoogleImage(raw);
  if (googleImage) return googleImage;

  const driveId = extractDriveFileId(raw);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w1200`;
  }

  const url = parseUrl(raw);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return "";

  // Google Docs and other Google landing pages are not image files.
  if (url.hostname === "docs.google.com") return "";
  if (isGoogleHost(url.hostname) && url.pathname === "/url") return "";

  return url.toString();
}

function googleDocumentPreview(url: URL): string {
  if (url.hostname !== "docs.google.com") return "";
  const match = url.pathname.match(/\/document\/d\/([^/]+)/i);
  if (!match?.[1]) return "";
  return `https://docs.google.com/document/d/${match[1]}/preview`;
}

function drivePreview(url: URL): string {
  const driveId = extractDriveFileId(url.toString());
  if (!driveId) return "";
  return `https://drive.google.com/file/d/${driveId}/preview`;
}

/**
 * Resolve a curriculum/lesson/class document link. Returns an empty string
 * when the value is an image, a search page, or another non-document link so
 * the Documents page does not present a broken "PDF" to students.
 */
export function resolveDocumentUrl(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) return "";

  if (raw.startsWith("data:application/pdf")) return raw;
  if (raw.startsWith("data:")) return "";

  const googleImage = extractGoogleImage(raw);
  if (googleImage) return "";

  const url = parseUrl(raw);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return "";

  if (url.hostname === "docs.google.com") return googleDocumentPreview(url);
  if (url.hostname === "drive.google.com") return drivePreview(url);

  if (isGoogleHost(url.hostname)) return "";
  if (IMAGE_EXTENSION.test(url.pathname)) return "";

  if (DOCUMENT_EXTENSION.test(url.pathname)) return url.toString();

  const isKnownDocumentHost = DOCUMENT_HOSTS.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
  );
  return isKnownDocumentHost ? url.toString() : "";
}

/**
 * Resolve a general-purpose resource or class material link. Google Drive
 * view links are converted to preview links; other http(s) links are kept.
 */
export function resolveExternalUrl(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:")) return "";

  const googleImage = extractGoogleImage(raw);
  if (googleImage) return googleImage;

  const url = parseUrl(raw);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return "";
  if (url.hostname === "docs.google.com" || url.hostname === "drive.google.com") {
    return resolveDocumentUrl(raw);
  }
  return url.toString();
}

export function getYouTubeId(value?: string | null): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (url.hostname.endsWith("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0]) && parts[1]) return parts[1];
    }
  } catch {
    const match = raw.match(/(?:youtu\.be\/|[?&]v=)([^&?\s]+)/);
    return match?.[1] || null;
  }
  return null;
}

export function isImageValue(value?: string | null): boolean {
  const raw = (value || "").trim();
  if (!raw) return false;
  if (raw.startsWith("data:image/")) return true;
  const url = parseUrl(raw);
  return !!url && IMAGE_EXTENSION.test(url.pathname);
}
