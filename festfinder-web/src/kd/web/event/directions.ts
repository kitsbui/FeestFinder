/**
 * "Chỉ đường" (owner, 2026-10-17): Google Maps' route to the venue, opened at once. On a phone the
 * link opens the Maps app when it is installed. The pin is exact when the venue has one; otherwise
 * the venue's name and address are searched.
 */
export function directionsUrl(venue: { name: string | null; lat: number | null; lng: number | null }, address: string): string {
  const destination = venue.lat != null && venue.lng != null ? `${venue.lat},${venue.lng}` : [venue.name, address].filter(Boolean).join(', ');
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination);
}
