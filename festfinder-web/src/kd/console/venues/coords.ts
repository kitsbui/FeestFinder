/** Coordinates from a pasted map link, and the check that a pin sits in its city. */

/** Coordinates from a Google Maps / Apple Maps / OSM link, or from "10.77, 106.70". */
export function parseCoords(text: string): { lat: number; lng: number } | null {
  const s = String(text || '').trim();
  const pats = [
    /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /[?&](?:q|ll|query|center)=(-?\d{1,3}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i,
    /#map=\d+\/(-?\d{1,3}\.\d+)\/(-?\d{1,3}\.\d+)/,
    /^(-?\d{1,3}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)$/,
  ];
  for (const p of pats) {
    const m = p.exec(s);
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
}

export const onEarth = (lat: number, lng: number) => Math.abs(lat) <= 85 && Math.abs(lng) <= 180;

/** Inside the city's box [west, south, east, north], the same check the API makes. */
export function inBox(lat: number, lng: number, bbox: number[] | null | undefined): boolean {
  if (!onEarth(lat, lng)) return false;
  if (!bbox || bbox.length !== 4) return true;
  const [w, so, e, n] = bbox;
  return lat >= so && lat <= n && lng >= w && lng <= e;
}
