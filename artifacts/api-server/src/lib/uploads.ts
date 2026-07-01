import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const mimeToExtension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
  "video/ogg": ".ogv",
};

export const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"),
);

export function ensureUploadsDir() {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export function buildStoredUploadFilename(
  originalName: string,
  mimeType?: string | null,
) {
  const originalExtension = path.extname(originalName).toLowerCase();
  const normalizedMimeType = mimeType?.toLowerCase().trim() || "";
  const mimeExtension =
    mimeToExtension[normalizedMimeType] || (normalizedMimeType.startsWith("video/") ? ".mp4" : "");
  const extension = originalExtension || mimeExtension || ".bin";
  const token = crypto.randomBytes(8).toString("hex");

  return `${Date.now()}-${token}${extension}`;
}

export function buildPublicUploadUrl(fileName: string) {
  return `/api/upload/${fileName}`;
}

ensureUploadsDir();
