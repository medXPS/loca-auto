"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactElement } from "react";
import { MapPinned, Minus, Plus, Search } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TILE_SIZE = 256;
const MAX_LATITUDE = 85.05112878;
const DEFAULT_CENTER = {
  latitude: 33.5731,
  longitude: -7.5898,
};

type Point = {
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
};

export type LocationMapValue = {
  latitude: number;
  longitude: number;
  mapUrl: string;
};

export type LocationMapPickerProps = {
  latitude: number | null;
  longitude: number | null;
  initialQuery?: string;
  onChange: (value: LocationMapValue) => void;
  className?: string;
};

function clampLatitude(latitude: number) {
  return Math.min(MAX_LATITUDE, Math.max(-MAX_LATITUDE, latitude));
}

function normalizeLongitude(longitude: number) {
  const wrapped = ((longitude + 180) % 360 + 360) % 360 - 180;
  return wrapped;
}

function buildMapUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

function latLngToWorld(point: Point, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const latitude = clampLatitude(point.latitude);
  const longitude = normalizeLongitude(point.longitude);
  const x = ((longitude + 180) / 360) * scale;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latitudeRadians) + 1 / Math.cos(latitudeRadians)) / Math.PI) / 2) *
    scale;

  return { x, y };
}

function worldToLatLng(x: number, y: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(Math.sinh(n));

  return {
    latitude: clampLatitude(latitude),
    longitude: normalizeLongitude(longitude),
  };
}

function isSelectable(latitude: number | null, longitude: number | null) {
  return latitude !== null && longitude !== null;
}

export function LocationMapPicker({
  latitude,
  longitude,
  initialQuery = "",
  onChange,
  className,
}: LocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [center, setCenter] = useState<Point>(
    isSelectable(latitude, longitude)
      ? { latitude: latitude ?? DEFAULT_CENTER.latitude, longitude: longitude ?? DEFAULT_CENTER.longitude }
      : DEFAULT_CENTER,
  );
  const [zoom, setZoom] = useState(isSelectable(latitude, longitude) ? 15 : 13);
  const [selected, setSelected] = useState<Point | null>(
    isSelectable(latitude, longitude)
      ? { latitude: latitude ?? DEFAULT_CENTER.latitude, longitude: longitude ?? DEFAULT_CENTER.longitude }
      : null,
  );
  const [selectedLabel, setSelectedLabel] = useState<string | null>(
    isSelectable(latitude, longitude) ? "Position selectionnee" : null,
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searchMessage, setSearchMessage] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isSelectable(latitude, longitude)) {
      const next = {
        latitude: clampLatitude(latitude as number),
        longitude: normalizeLongitude(longitude as number),
      };

      setCenter(next);
      setSelected(next);
      setSelectedLabel((current) => current ?? "Position selectionnee");
      setZoom((current) => Math.max(current, 15));
      return;
    }

    setCenter(DEFAULT_CENTER);
    setSelected(null);
    setSelectedLabel(null);
  }, [latitude, longitude]);

  useEffect(() => {
    const measure = () => {
      const element = containerRef.current;
      if (!element) return;
      setSize({ width: element.clientWidth, height: element.clientHeight });
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(() => {
      measure();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const applySelection = (point: Point, label?: string) => {
    const next = {
      latitude: clampLatitude(point.latitude),
      longitude: normalizeLongitude(point.longitude),
    };

    setCenter(next);
    setSelected(next);
    setSelectedLabel(label ?? `${next.latitude.toFixed(6)}, ${next.longitude.toFixed(6)}`);
    setZoom((current) => Math.max(current, 15));
    setResults([]);
    setSearchMessage("");
    onChange({
      latitude: next.latitude,
      longitude: next.longitude,
      mapUrl: buildMapUrl(next.latitude, next.longitude),
    });
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();

    if (query.length < 3) {
      setResults([]);
      setSearchMessage("Entrez au moins 3 caracteres.");
      return;
    }

    setIsSearching(true);
    setSearchMessage("");

    try {
      const data = await customFetch<NominatimResult[]>(
        `/api/map-search?q=${encodeURIComponent(query)}&limit=6`,
      );
      setResults(data);

      if (data.length === 0) {
        setSearchMessage("Aucun resultat trouve.");
      }
    } catch {
      setResults([]);
      setSearchMessage("Recherche indisponible pour le moment.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || size.width === 0 || size.height === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerWorld = latLngToWorld(center, zoom);
    const leftWorld = centerWorld.x - size.width / 2;
    const topWorld = centerWorld.y - size.height / 2;
    const point = worldToLatLng(leftWorld + x, topWorld + y, zoom);

    applySelection(point);
  };

  const centerWorld = latLngToWorld(center, zoom);
  const leftWorld = centerWorld.x - size.width / 2;
  const topWorld = centerWorld.y - size.height / 2;
  const totalTiles = 2 ** zoom;
  const startTileX = Math.floor(leftWorld / TILE_SIZE) - 1;
  const endTileX = Math.ceil((leftWorld + size.width) / TILE_SIZE) + 1;
  const startTileY = Math.floor(topWorld / TILE_SIZE) - 1;
  const endTileY = Math.ceil((topWorld + size.height) / TILE_SIZE) + 1;
  const markerWorld = selected ? latLngToWorld(selected, zoom) : null;
  const markerLeft = markerWorld ? markerWorld.x - leftWorld : 0;
  const markerTop = markerWorld ? markerWorld.y - topWorld : 0;

  const renderedTiles: ReactElement[] = [];

  for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
    if (tileY < 0 || tileY >= totalTiles) continue;

    for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
      const wrappedX = ((tileX % totalTiles) + totalTiles) % totalTiles;
      const left = tileX * TILE_SIZE - leftWorld;
      const top = tileY * TILE_SIZE - topWorld;

      renderedTiles.push(
        <img
          key={`${tileX}-${tileY}`}
          src={`https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`}
          alt=""
          className="absolute h-64 w-64 select-none object-cover"
          style={{ left, top, width: TILE_SIZE, height: TILE_SIZE }}
          draggable={false}
        />,
      );
    }
  }

  return (
    <div className={cn("rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,31,0.96),rgba(4,7,18,0.94))] p-4 text-white shadow-[0_24px_60px_-36px_rgba(16,23,34,0.45)]", className)}>
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Carte de l'agence</p>
          <h3 className="text-lg font-semibold text-white">Cherchez un lieu puis cliquez sur la carte.</h3>
          <p className="text-sm leading-6 text-white/70">
            La position est definie uniquement par la carte. Pas de lien a coller.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">
              Recherche
            </label>
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
              placeholder="Ville, quartier ou adresse"
              className="border-white/10 bg-white/8 text-white placeholder:text-white/35"
            />
          </div>

          <Button
            type="button"
            className="mt-auto rounded-full bg-[#F04B45] px-5 text-white hover:bg-[#f03b33]"
            onClick={() => void handleSearch()}
            disabled={isSearching}
          >
            <Search className="h-4 w-4" />
            {isSearching ? "Recherche..." : "Rechercher"}
          </Button>
        </div>

        {searchMessage && <p className="text-sm text-white/65">{searchMessage}</p>}

        {results.length > 0 && (
          <div className="grid gap-2 rounded-[1.35rem] border border-white/10 bg-white/6 p-3">
            {results.map((result) => (
              <button
                key={result.place_id}
                type="button"
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/10"
                onClick={() => {
                  const nextPoint = {
                    latitude: Number(result.lat),
                    longitude: Number(result.lon),
                  };

                  setSearchQuery(result.display_name);
                  applySelection(nextPoint, result.display_name);
                }}
              >
                <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-[#F04B45]" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium text-white">{result.display_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
                    {result.class || result.type || "Lieu"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950">
          <div
            ref={containerRef}
            role="button"
            tabIndex={0}
            aria-label="Carte interactive de selection"
            className="relative h-[340px] cursor-crosshair overflow-hidden outline-none md:h-[420px]"
            onClick={handleMapClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" && selected) {
                onChange({
                  latitude: selected.latitude,
                  longitude: selected.longitude,
                  mapUrl: buildMapUrl(selected.latitude, selected.longitude),
                });
              }
            }}
          >
            {size.width > 0 && size.height > 0 ? (
              <>
                {renderedTiles}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.1),rgba(2,6,23,0.22))]" />

                {selected ? (
                  <div
                    className="absolute z-10 -translate-x-1/2 -translate-y-full"
                    style={{
                      left: markerLeft,
                      top: markerTop,
                    }}
                  >
                    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/90 px-3 py-2 text-xs font-medium text-white shadow-[0_14px_30px_-16px_rgba(16,23,34,0.45)]">
                      <MapPinned className="h-4 w-4 text-[#F04B45]" />
                      Position selectionnee
                    </div>
                    <div className="mx-auto mt-1 h-5 w-5 rounded-full border-4 border-[#F04B45] bg-white shadow-[0_8px_24px_-10px_rgba(240,75,69,0.8)]" />
                  </div>
                ) : (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="rounded-full border border-white/15 bg-slate-950/55 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur">
                      Cliquez sur la carte pour placer l'agence
                    </div>
                  </div>
                )}

                <div className="absolute left-3 top-3 z-20 rounded-full border border-white/10 bg-slate-950/75 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur">
                  {zoom}x zoom
                </div>

                <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 rounded-full border-white/10 bg-slate-950/75 p-0 text-white hover:bg-slate-900 hover:text-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      setZoom((current) => Math.min(18, current + 1));
                    }}
                    aria-label="Zoom avant"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 rounded-full border-white/10 bg-slate-950/75 p-0 text-white hover:bg-slate-900 hover:text-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      setZoom((current) => Math.max(3, current - 1));
                    }}
                    aria-label="Zoom arriere"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/60">
                Chargement de la carte...
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">Position selectionnee</p>
            <p className="mt-1 truncate text-sm font-medium text-white">
              {selectedLabel || "Aucune position selectionnee"}
            </p>
            <p className="mt-1 text-xs text-white/65">
              {selected
                ? `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`
                : "Utilisez la recherche ou cliquez sur la carte."}
            </p>
          </div>

          {selected && (
            <Button
              type="button"
              asChild
              variant="outline"
              className="rounded-full border-white/12 bg-white/8 px-4 text-white hover:bg-white/12 hover:text-white"
            >
              <a href={buildMapUrl(selected.latitude, selected.longitude)} target="_blank" rel="noopener noreferrer">
                Ouvrir dans Maps
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
