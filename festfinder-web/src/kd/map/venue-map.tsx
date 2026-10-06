'use client';
/**
 * Small still maps: one place with its pin chosen (VenueMap), or a few events to tease the
 * map view (MiniMap). They load only once they are near the screen.
 */
import { useEffect, useRef, useState } from 'react';
import type { Family } from '../genre';
import { createKdMap, type Box, type KdMap, type Pin } from './kd-map';

function useNear(ref: React.RefObject<HTMLDivElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

/** The box around some points, with a little room. */
export function boxOf(pins: { lat: number | null; lng: number | null }[]): Box | null {
  const pts = pins.filter((p) => p.lat != null && p.lng != null) as { lat: number; lng: number }[];
  if (!pts.length) return null;
  const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
  const pad = 0.01;
  return [Math.min(...lngs) - pad, Math.min(...lats) - pad, Math.max(...lngs) + pad, Math.max(...lats) + pad];
}

export function MiniMap({ pins, selected, className }: { pins: Pin[]; selected?: string | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNear(ref);
  const key = pins.map((p) => p.id).join(',');
  useEffect(() => {
    if (!near || !ref.current || !pins.length) return;
    let map: KdMap | null = null;
    let dead = false;
    const box = boxOf(pins);
    const one = pins.length === 1 && pins[0].lat != null && pins[0].lng != null;
    createKdMap(ref.current, one ? { center: [pins[0].lng!, pins[0].lat!], zoom: 14.5, interactive: false } : { bounds: box ?? undefined, interactive: false }).then(async (mm) => {
      if (dead) { mm.destroy(); return; }
      map = mm;
      await mm.ready;
      mm.setEvents(pins);
      if (selected) mm.select(selected);
    }).catch(() => {});
    return () => { dead = true; map?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, key, selected]);
  // MapLibre makes its container position: relative, so the sizing box is a wrapper.
  return (
    <div className={className} aria-hidden="true">
      <div ref={ref} className="h-full w-full" />
    </div>
  );
}

export function VenueMap({ lat, lng, family, label, className }: { lat: number; lng: number; family: Family; label: string; className?: string }) {
  return <MiniMap pins={[{ id: 'here', lat, lng, family, label }]} selected="here" className={className} />;
}
