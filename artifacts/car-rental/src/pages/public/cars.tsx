import { useState } from "react";
import { useListCars } from "@workspace/api-client-react";
import { CarCard } from "@/components/car-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Cars() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [transmission, setTransmission] = useState<string>("all");
  const [fuelType, setFuelType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState([0, 2000]);

  // Use debounced search for API calls in a real app, simplified here
  const { data, isLoading } = useListCars({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    transmission: transmission !== "all" ? transmission : undefined,
    fuelType: fuelType !== "all" ? fuelType : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] < 2000 ? priceRange[1] : undefined,
    limit: 50
  });

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Recherche</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Marque, modèle..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Catégorie</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            <SelectItem value="ECONOMY">Économique</SelectItem>
            <SelectItem value="COMPACT">Compacte</SelectItem>
            <SelectItem value="SEDAN">Berline</SelectItem>
            <SelectItem value="SUV">SUV</SelectItem>
            <SelectItem value="LUXURY">Luxe</SelectItem>
            <SelectItem value="VAN">Van / Utilitaire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Boîte de vitesses</Label>
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="MANUAL">Manuelle</SelectItem>
            <SelectItem value="AUTOMATIC">Automatique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Carburant</Label>
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger>
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="DIESEL">Diesel</SelectItem>
            <SelectItem value="PETROL">Essence</SelectItem>
            <SelectItem value="HYBRID">Hybride</SelectItem>
            <SelectItem value="ELECTRIC">Électrique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <Label>Prix par jour (MAD)</Label>
          <span className="text-sm text-muted-foreground">
            {priceRange[0]} - {priceRange[1] >= 2000 ? "2000+" : priceRange[1]}
          </span>
        </div>
        <Slider 
          defaultValue={[0, 2000]} 
          max={2000} 
          step={50} 
          value={priceRange}
          onValueChange={setPriceRange}
        />
      </div>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setSearch("");
          setCategory("all");
          setTransmission("all");
          setFuelType("all");
          setPriceRange([0, 2000]);
        }}
      >
        Réinitialiser les filtres
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
          Nos Voitures
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Découvrez notre flotte de véhicules régulièrement révisés et prêts pour votre aventure au Maroc.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-card p-6 rounded-xl border">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </h2>
            <FilterContent />
          </div>
        </aside>

        {/* Mobile Filter Button */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <span className="font-medium">{data?.total || 0} résultats</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtrer
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filtres de recherche</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="hidden md:flex justify-between items-center mb-6">
            <span className="font-medium text-muted-foreground">{data?.total || 0} véhicules trouvés</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col h-[400px]">
                  <Skeleton className="w-full h-[200px] rounded-t-xl" />
                  <div className="p-4 space-y-4 border border-t-0 rounded-b-xl flex-1">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="grid grid-cols-2 gap-4 mt-auto">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : data?.cars && data.cars.length > 0 ? (
              data.cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-card rounded-xl border border-dashed">
                <CarCard className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Aucune voiture trouvée</h3>
                <p className="text-muted-foreground mb-6">
                  Modifiez vos critères de recherche pour voir plus de résultats.
                </p>
                <Button 
                  onClick={() => {
                    setCategory("all");
                    setTransmission("all");
                    setFuelType("all");
                    setPriceRange([0, 2000]);
                    setSearch("");
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
