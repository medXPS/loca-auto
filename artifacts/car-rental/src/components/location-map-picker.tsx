"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPinned, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER = {
  latitude: 33.5731,
  longitude: -7.5898,
};

type Point = {
  latitude: number;
  longitude: number;
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

declare global {
  interface Window {
    google?: any;
    __locationAutoGoogleMapsPromise?: Promise<void>;
  }
}

function getGoogleMapsKey() {
  return (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";
}

function buildMapUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

function hasCoordinates(latitude: number | null, longitude: number | null) {
  return latitude !== null && longitude !== null;
}

function loadGoogleMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is available only in the browser."));
  }

  if (window.google?.maps?.Map) {
    return Promise.resolve();
  }

  if (window.__locationAutoGoogleMapsPromise) {
    return window.__locationAutoGoogleMapsPromise;
  }

  const apiKey = getGoogleMapsKey();

  if (!apiKey) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY."));
  }

  window.__locationAutoGoogleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-location-auto-google-maps]");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.locationAutoGoogleMaps = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=fr&region=MA`;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
    document.head.appendChild(script);
  });

  return window.__locationAutoGoogleMapsPromise;
}

export function LocationMapPicker({
  latitude,
  longitude,
  initialQuery = "",
  onChange,
  className,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);
  const placesListenerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Point | null>(
    hasCoordinates(latitude, longitude)
      ? { latitude: latitude ?? DEFAULT_CENTER.latitude, longitude: longitude ?? DEFAULT_CENTER.longitude }
      : null,
  );
  const [selectedLabel, setSelectedLabel] = useState(
    hasCoordinates(latitude, longitude) ? "Position selectionnee" : "",
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const selectPoint = (point: Point, label?: string) => {
    const next = {
      latitude: point.latitude,
      longitude: point.longitude,
    };

    setSelected(next);
    setSelectedLabel(label || `${next.latitude.toFixed(6)}, ${next.longitude.toFixed(6)}`);
    onChange({
      latitude: next.latitude,
      longitude: next.longitude,
      mapUrl: buildMapUrl(next.latitude, next.longitude),
    });

    if (mapRef.current) {
      const latLng = new window.google.maps.LatLng(next.latitude, next.longitude);
      mapRef.current.panTo(latLng);
      mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || 15, 15));

      if (!markerRef.current) {
        markerRef.current = new window.google.maps.Marker({
          map: mapRef.current,
          draggable: true,
        });

        markerRef.current.addListener("dragend", () => {
          const position = markerRef.current?.getPosition();
          if (!position) return;
          selectPoint({ latitude: position.lat(), longitude: position.lng() });
        });
      }

      markerRef.current.setPosition(latLng);
      markerRef.current.setTitle(label || "Position selectionnee");
    }
  };

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return;

        const initialPoint = hasCoordinates(latitude, longitude)
          ? { latitude: latitude ?? DEFAULT_CENTER.latitude, longitude: longitude ?? DEFAULT_CENTER.longitude }
          : DEFAULT_CENTER;

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: initialPoint.latitude, lng: initialPoint.longitude },
          zoom: hasCoordinates(latitude, longitude) ? 15 : 12,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          },
          streetViewControl: true,
          fullscreenControl: true,
        });

        mapRef.current = map;
        geocoderRef.current = new window.google.maps.Geocoder();

        clickListenerRef.current = map.addListener("click", (event: any) => {
          if (!event.latLng) return;

          const next = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
          };

          geocoderRef.current.geocode({ location: event.latLng }, (results: any[], status: string) => {
            const label = status === "OK" && results?.[0]?.formatted_address ? results[0].formatted_address : undefined;
            selectPoint(next, label);
          });
        });

        if (searchInputRef.current && window.google.maps.places?.SearchBox) {
          const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
          map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));

          placesListenerRef.current = searchBox.addListener("places_changed", () => {
            const places = searchBox.getPlaces();
            const place = places?.[0];
            const location = place?.geometry?.location;

            if (!location) return;

            selectPoint(
              {
                latitude: location.lat(),
                longitude: location.lng(),
              },
              place.formatted_address || place.name,
            );
          });
        }

        if (hasCoordinates(latitude, longitude)) {
          selectPoint(
            {
              latitude: latitude ?? DEFAULT_CENTER.latitude,
              longitude: longitude ?? DEFAULT_CENTER.longitude,
            },
            "Position selectionnee",
          );
        }

        setIsReady(true);
        setLoadError("");
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setLoadError(error.message);
        setIsReady(false);
      });

    return () => {
      isMounted = false;
      clickListenerRef.current?.remove?.();
      placesListenerRef.current?.remove?.();
    };
  }, []);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!isReady || !hasCoordinates(latitude, longitude)) {
      if (!hasCoordinates(latitude, longitude)) {
        setSelected(null);
        setSelectedLabel("");
        markerRef.current?.setMap?.(null);
        markerRef.current = null;
      }
      return;
    }

    selectPoint({
      latitude: latitude ?? DEFAULT_CENTER.latitude,
      longitude: longitude ?? DEFAULT_CENTER.longitude,
    }, selectedLabel || "Position selectionnee");
  }, [isReady, latitude, longitude]);

  return (
    <div className={cn("rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-34px_rgba(16,23,34,0.28)]", className)}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Google Maps</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher une agence, adresse ou quartier"
                className="h-11 border-slate-200 bg-white pl-9 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {selected && (
            <Button asChild type="button" variant="outline" className="mt-auto h-11 rounded-full border-slate-200 bg-white px-4">
              <a href={buildMapUrl(selected.latitude, selected.longitude)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Maps
              </a>
            </Button>
          )}
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Ajoutez `VITE_GOOGLE_MAPS_API_KEY` avec Maps JavaScript API et Places API activees.
          </div>
        )}

        <div className="relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-100">
          <div ref={mapContainerRef} className="h-[360px] w-full md:h-[460px]" />

          {!isReady && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-slate-500 backdrop-blur-sm">
              Chargement de Google Maps...
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-[1.15rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Position selectionnee</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
              {selectedLabel || "Aucune position selectionnee"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {selected
                ? `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`
                : "Selectionnez un resultat Google Maps ou cliquez sur la carte."}
            </p>
          </div>

          <MapPinned className={cn("h-5 w-5 shrink-0", selected ? "text-primary" : "text-slate-300")} />
        </div>
      </div>
    </div>
  );
}
