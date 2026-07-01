export function resolveUploadUrl(fileUrl: string) {
  if (!fileUrl) return fileUrl;
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("data:")) return fileUrl;
  if (fileUrl.startsWith("/api/upload/")) return fileUrl;
  if (fileUrl.startsWith("/uploads/")) {
    return `/api/upload/${fileUrl.slice("/uploads/".length)}`;
  }
  return fileUrl;
}

export function fileNameFromUrl(fileUrl: string) {
  const fileName = fileUrl.split("/").pop();
  return fileName && fileName.trim() ? fileName : fileUrl;
}
