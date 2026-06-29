import { cn } from "@/lib/utils";

type SiteLogoProps = {
  tone?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
};

export function SiteLogo({ tone = "dark", className, showTagline = true }: SiteLogoProps) {
  const isLight = tone === "light";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 124 46"
        aria-hidden="true"
        className="h-8 w-auto shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 29.5C14.6 24.9 21.8 20.9 29.7 17.8C37.4 14.7 43.8 13.2 48.8 13.2H62.7C67.8 13.2 71.9 14.1 75 15.8"
          stroke="#FF4D43"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M20.4 31.4H78.6C81.1 31.4 83.5 32.3 85.4 34"
          stroke="#FF4D43"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M27.5 18.8L18.9 19.2C16.2 19.3 13.8 20.9 12.6 23.2L9.2 29.6"
          stroke="#FF4D43"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M81.5 18.6L96.4 21.9C100.1 22.7 103.4 24.6 106.1 27.2L116 36.8"
          stroke="#FF4D43"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="29" cy="33.8" r="4" fill="#FF4D43" />
        <circle cx="84.7" cy="33.8" r="4" fill="#FF4D43" />
      </svg>

      <div className="min-w-0 leading-none">
        <div className={cn("text-[1.02rem] font-extrabold uppercase tracking-[0.02em]", isLight ? "text-white" : "text-slate-950")}>
          Location Auto Maroc
        </div>
        {showTagline && (
          <div
            className={cn(
              "mt-1 text-[0.63rem] font-semibold uppercase tracking-[0.32em]",
              isLight ? "text-white/70" : "text-slate-500",
            )}
          >
            Location simple et rapide
          </div>
        )}
      </div>
    </div>
  );
}
