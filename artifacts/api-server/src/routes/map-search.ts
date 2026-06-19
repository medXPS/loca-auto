import { Router } from "express";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
};

const router = Router();

router.get("/", async (req, res) => {
  try {
    const query = String(req.query.q ?? "").trim();
    const limitValue = Number.parseInt(String(req.query.limit ?? "6"), 10);
    const limit = Number.isFinite(limitValue) ? Math.min(Math.max(limitValue, 1), 10) : 6;

    if (query.length < 3) {
      res.json([]);
      return;
    }

    const target = new URL("https://nominatim.openstreetmap.org/search");
    target.searchParams.set("format", "jsonv2");
    target.searchParams.set("addressdetails", "1");
    target.searchParams.set("countrycodes", "ma");
    target.searchParams.set("limit", String(limit));
    target.searchParams.set("q", query);

    const response = await fetch(target, {
      headers: {
        "User-Agent": "LocationAutoMaroc/1.0",
        "Accept-Language": "fr",
      },
    });

    if (!response.ok) {
      res.status(502).json({ error: "Recherche de carte indisponible" });
      return;
    }

    const data = (await response.json()) as NominatimResult[];
    res.json(
      data.slice(0, limit).map((item) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        type: item.type,
        class: item.class,
      })),
    );
  } catch (error) {
    req.log.error(error);
    res.status(502).json({ error: "Recherche de carte indisponible" });
  }
});

export default router;
