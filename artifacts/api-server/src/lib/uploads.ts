import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(moduleDir, "..");

export const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR || path.join(packageRoot, "uploads"),
);

const uploadDirCandidates = Array.from(
  new Set([
    uploadsDir,
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "artifacts", "api-server", "uploads"),
    path.join(process.cwd(), "artifacts", "api-server", "dist", "uploads"),
    path.join(process.cwd(), "dist", "uploads"),
  ]),
);

export function ensureUploadsDir() {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export function findStoredUploadPath(fileName: string) {
  const safeFileName = path.basename(fileName);

  for (const candidateDir of uploadDirCandidates) {
    const filePath = path.resolve(candidateDir, safeFileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
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
