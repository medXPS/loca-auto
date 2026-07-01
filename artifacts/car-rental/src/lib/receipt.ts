import { customFetch } from "@workspace/api-client-react";
import { triggerDownload } from "./uploads";

export async function downloadReceiptPdf(requestId: number, filename?: string) {
  const blob = await customFetch<Blob>(`/api/rental-requests/${requestId}/receipt`, {
    responseType: "blob",
  });

  triggerDownload(blob, filename || `recu-RCPF-${String(requestId).padStart(6, "0")}.pdf`);
}
