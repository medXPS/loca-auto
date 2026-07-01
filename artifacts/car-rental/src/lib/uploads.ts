import { customFetch } from "@workspace/api-client-react";

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function resolveUploadUrl(fileUrl: string) {
  if (!fileUrl) return fileUrl;

  if (fileUrl.startsWith("data:")) return fileUrl;

  if (/^https?:\/\//i.test(fileUrl)) {
    try {
      const url = new URL(fileUrl);
      if (url.pathname.startsWith("/uploads/")) {
        return `${url.origin}/api/upload/${url.pathname.slice("/uploads/".length)}`;
      }
    } catch {
      return fileUrl;
    }

    return fileUrl;
  }

  if (fileUrl.startsWith("/api/upload/")) return fileUrl;
  if (fileUrl.startsWith("/uploads/")) {
    return `/api/upload/${fileUrl.slice("/uploads/".length)}`;
  }

  return fileUrl;
}

export function fileNameFromUrl(fileUrl: string) {
  if (!fileUrl) return fileUrl;
  if (fileUrl.startsWith("data:")) return fileUrl;

  try {
    const url = new URL(fileUrl, "http://localhost");
    const fileName = url.pathname.split("/").pop();
    return fileName && fileName.trim() ? safeDecodeURIComponent(fileName) : fileUrl;
  } catch {
    const cleanedUrl = fileUrl.split(/[?#]/, 1)[0];
    const fileName = cleanedUrl.split("/").pop();
    return fileName && fileName.trim() ? safeDecodeURIComponent(fileName) : fileUrl;
  }
}

export async function downloadUploadedFile(fileUrl: string, filename?: string) {
  const resolvedUrl = resolveUploadUrl(fileUrl);

  if (!resolvedUrl) {
    throw new Error("Fichier introuvable");
  }

  const blob =
    resolvedUrl.startsWith("data:")
      ? await fetch(resolvedUrl).then((response) => {
          if (!response.ok) {
            throw new Error("Fichier introuvable");
          }

          return response.blob();
        })
      : await customFetch<Blob>(resolvedUrl, {
          responseType: "blob",
        });

  triggerDownload(blob, filename || fileNameFromUrl(fileUrl));
}
