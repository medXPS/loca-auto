import { useState, type MouseEvent } from "react";
import { Download } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadUploadedFile, fileNameFromUrl } from "@/lib/uploads";

type DocumentDownloadButtonProps = Omit<ButtonProps, "onClick"> & {
  fileUrl: string;
  filename?: string;
};

export function DocumentDownloadButton({
  fileUrl,
  filename,
  children,
  disabled,
  variant = "outline",
  size = "sm",
  className,
  ...buttonProps
}: DocumentDownloadButtonProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const label = children ?? (size === "icon" ? null : "Télécharger");

  const handleClick = async (_event: MouseEvent<HTMLButtonElement>) => {
    if (disabled || isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadUploadedFile(fileUrl, filename || fileNameFromUrl(fileUrl));
      toast({
        title: "Téléchargement lancé",
        description: "Le fichier a été préparé pour le téléchargement.",
      });
    } catch (error) {
      toast({
        title: "Téléchargement impossible",
        description:
          error instanceof Error
            ? error.message
            : "Impossible de télécharger ce fichier.",
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
      <Download className="h-4 w-4" />
      {isDownloading ? "Téléchargement..." : label}
    </Button>
  );
}
