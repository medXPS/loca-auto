import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  deadline: string;
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({ deadline, className, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.hours < 2 && !isExpired;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center",
      isExpired 
        ? "border-destructive/20 bg-destructive/5 text-destructive" 
        : isUrgent 
          ? "border-amber-500/30 bg-amber-500/5 text-amber-700 animate-pulse-slow" 
          : "border-primary/20 bg-primary/5 text-primary",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className={cn("w-5 h-5", isUrgent && "animate-pulse")} />
        <span className="font-medium">
          {isExpired ? "Délai expiré" : "Délai de paiement"}
        </span>
      </div>
      
      {!isExpired ? (
        <>
          <div className="text-3xl font-mono font-bold tracking-tight mb-1">
            {String(timeLeft.hours).padStart(2, "0")}:
            {String(timeLeft.minutes).padStart(2, "0")}:
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <p className="text-sm opacity-80 max-w-[250px]">
            Vous avez ce temps pour passer à l'agence et effectuer le paiement
          </p>
        </>
      ) : (
        <p className="text-sm opacity-80">
          Le délai de paiement est dépassé. La réservation peut être annulée.
        </p>
      )}
    </div>
  );
}
