import { customFetch } from "@workspace/api-client-react";

function triggerDownload(blob: Blob, filename: string) {
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

export async function downloadReceiptPdf(requestId: number, filename?: string) {
  const blob = await customFetch<Blob>(`/api/rental-requests/${requestId}/receipt`, {
    responseType: "blob",
  });

  triggerDownload(blob, filename || `receipt-${String(requestId).padStart(6, "0")}.pdf`);
}
