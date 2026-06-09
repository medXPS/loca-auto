import type { Car, CarDetail } from "@workspace/api-client-react";

export interface FavoriteCar {
  id: number;
  brand: string;
  model: string;
  year: number;
  dailyPrice: number;
  mainImageUrl?: string | null;
}

const FAVORITES_KEY = "location-auto-maroc:favorites";

export function getFavoriteCars(): FavoriteCar[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as FavoriteCar[]) : [];
  } catch {
    return [];
  }
}

export function isFavoriteCar(carId: number): boolean {
  return getFavoriteCars().some((car) => car.id === carId);
}

export function saveFavoriteCar(car: Car | CarDetail): FavoriteCar[] {
  const summary: FavoriteCar = {
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    dailyPrice: Number(car.dailyPrice),
    mainImageUrl: car.mainImageUrl,
  };
  const next = [
    summary,
    ...getFavoriteCars().filter((favorite) => favorite.id !== car.id),
  ];
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("favorite-cars-change"));
  return next;
}

export function removeFavoriteCar(carId: number): FavoriteCar[] {
  const next = getFavoriteCars().filter((favorite) => favorite.id !== carId);
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("favorite-cars-change"));
  return next;
}
