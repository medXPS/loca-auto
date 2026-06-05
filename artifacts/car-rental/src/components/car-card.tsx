import { Link } from "wouter";
import { Car } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Users, Fuel, Settings2, DoorClosed } from "lucide-react";

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  const isAvailable = car.status === "AVAILABLE";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {car.mainImageUrl ? (
          <img 
            src={car.mainImageUrl} 
            alt={`${car.brand} ${car.model}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Aucune image
          </div>
        )}
        <div className="absolute top-3 right-3">
          <StatusBadge status={car.status} type="car" />
        </div>
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium uppercase tracking-wider">
          {car.category}
        </div>
      </div>

      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-serif font-bold text-xl line-clamp-1">{car.brand} {car.model}</h3>
            <p className="text-sm text-muted-foreground">{car.year}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-primary">{formatPrice(car.dailyPrice)}</p>
            <p className="text-xs text-muted-foreground">/jour</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto mb-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            <span>{car.transmission === "AUTOMATIC" ? "Automatique" : "Manuelle"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            <span>{car.fuelType === "DIESEL" ? "Diesel" : car.fuelType === "PETROL" ? "Essence" : car.fuelType === "ELECTRIC" ? "Électrique" : "Hybride"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{car.seats} places</span>
          </div>
          <div className="flex items-center gap-2">
            <DoorClosed className="w-4 h-4" />
            <span>{car.doors} portes</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 gap-3 border-t bg-muted/20">
        <Link href={`/voitures/${car.id}`} className="flex-1">
          <Button variant="outline" className="w-full">Voir détails</Button>
        </Link>
        <Link href={`/voitures/${car.id}?reserve=true`} className="flex-1">
          <Button className="w-full" disabled={!isAvailable}>Demander</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
