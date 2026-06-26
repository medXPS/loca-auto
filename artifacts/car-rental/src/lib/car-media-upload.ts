import type { CarImage } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";

export type CarMediaType = "IMAGE" | "VIDEO" | "IMAGE_360";
export type CarMediaSourceType = "URL" | "UPLOAD";

export type CarMediaUploadInput = {
  url?: string;
  altText?: string;
  isMain?: boolean;
  sortOrder?: number;
  mediaType?: CarMediaType;
  sourceType?: CarMediaSourceType;
  file?: File | null;
};

function getDefaultMediaType(file?: File | null, mediaType?: CarMediaType) {
  if (file?.type.startsWith("video/")) return "VIDEO";
  if (mediaType === "IMAGE_360") return "IMAGE_360";
  if (mediaType === "VIDEO") return "IMAGE";
  return mediaType ?? "IMAGE";
}

export async function uploadCarMedia(
  carId: number,
  input: CarMediaUploadInput,
): Promise<CarImage> {
  const file = input.file ?? null;

  if (file) {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("mediaType", getDefaultMediaType(file, input.mediaType));
    formData.append("sourceType", "UPLOAD");
    formData.append("isMain", String(Boolean(input.isMain)));
    formData.append("sortOrder", String(input.sortOrder ?? 0));

    const altText = input.altText?.trim();
    if (altText) {
      formData.append("altText", altText);
    }

    return customFetch<CarImage>(`/api/cars/${carId}/images`, {
      method: "POST",
      body: formData,
    });
  }

  const url = input.url?.trim();
  if (!url) {
    throw new Error("URL ou fichier requis");
  }

  return customFetch<CarImage>(`/api/cars/${carId}/images`, {
    method: "POST",
    body: JSON.stringify({
      url,
      altText: input.altText?.trim() || undefined,
      isMain: Boolean(input.isMain),
      sortOrder: input.sortOrder ?? 0,
      mediaType: input.mediaType ?? "IMAGE",
      sourceType: input.sourceType ?? "URL",
    }),
  });
}
