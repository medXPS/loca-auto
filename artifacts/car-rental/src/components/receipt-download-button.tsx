import { useState, type MouseEvent } from "react";
import { FileDown } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadReceiptPdf } from "@/lib/receipt";

type ReceiptDownloadButtonProps = Omit<ButtonProps, "onClick"> & {
  requestId: number;
  filename?: string;
};

export function ReceiptDownloadButton({
  requestId,
  filename,
  children,
  disabled,
  variant = "outline",
  size = "sm",
  className,
  ...buttonProps
}: ReceiptDownloadButtonProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClick = async (_event: MouseEvent<HTMLButtonElement>) => {
    if (disabled || isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadReceiptPdf(requestId, filename);
      toast({
        title: "Reçu téléchargé",
        description: `Le PDF de la demande #${requestId} a été généré.`,
      });
    } catch (error) {
      toast({
        title: "Téléchargement impossible",
        description: error instanceof Error ? error.message : "Impossible de générer le reçu PDF.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      {...buttonProps}
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isDownloading}
      onClick={handleClick}
    >
      <FileDown className="h-4 w-4" />
      {isDownloading ? "Téléchargement..." : children ?? "Télécharger le reçu"}
    </Button>
  );
}
