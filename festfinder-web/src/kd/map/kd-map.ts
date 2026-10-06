/**
 * The Kính đêm map: MapLibre on the self-hosted PMTiles basemap (GET /map/style.json?theme=kd),
 * with events as glass pills (the family marker and a mono price, the chosen one in paper)
 * and clusters as hairline circles with a count. Like ui/map/ff-map.js it never fetches
 * events itself: the screen asks /events/map when the view opens and on "search this area",
 * then hands the result to setEvents(). Moving the map only says that it moved.
 *
 * MapLibre and the PMTiles protocol come from /ui/vendor/maplibre, loaded once by FFMap.load.
 */
import { FF } from '@/runtime/ff';
import type { Family } from '../genre';

export interface Pin { id: string; lat: number | null; lng: number | null; family: Family; label: string; title?: string }
export type Box = [number, number, number, number];

export interface KdMapOptions {
  bounds?: Box;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  /** The accessible name of a pin: its title by default. */
  pinLabel?: (p: Pin) => string;
  onSelect?: (id: string | null) => void;
  onMove?: () => void;
  zoomLabels?: { in: string; out: string };
}

export interface KdMap {
  ready: Promise<void>;
  setEvents(items: Pin[]): void;
  select(id: string | null): void;
  setMe(at: { lat: number; lng: number } | null): void;
  bounds(): Box;
  fit(box: Box, animate?: boolean): void;
  flyTo(at: { lat: number; lng: number }, zoom?: number): void;
  zoom(by: number): void;
  resize(): void;
  destroy(): void;
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

async function maplibre(): Promise<any> {
  const FFMap = await FF.loadMap();
  return FFMap.load(FF.asset);
}

export async function createKdMap(el: HTMLElement, opts: KdMapOptions): Promise<KdMap> {
  const m = await maplibre();
  const map = new m.Map({
    container: el,
    style: '/map/style.json?theme=kd',
    ...(opts.bounds ? { bounds: opts.bounds, fitBoundsOptions: { padding: 40 } } : { center: opts.center, zoom: opts.zoom ?? 13 }),
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
    renderWorldCopies: false,
    interactive: opts.interactive !== false,
    maxZoom: 17,
    minZoom: 2,
  });
  map.touchZoomRotate?.disableRotation();
  map.keyboard?.disableRotation();

  let items: Pin[] = [];
  let selected: string | null = null;
  const pins = new Map<string, { marker: any; button: HTMLButtonElement }>();
  const counts = new Map<number, any>();
  let me: any = null;

  const geo = () => ({
    type: 'FeatureCollection',
    features: items.filter((x) => x.lat != null && x.lng != null).map((x) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [x.lng, x.lat] }, properties: { id: x.id },
    })),
  });

  const ready = new Promise<void>((resolve) => map.on('load', () => resolve()));
  map.on('load', () => {
    map.addSource('kd-events', { type: 'geojson', data: geo(), cluster: true, clusterRadius: 52, clusterMaxZoom: 14 });
    map.addLayer({
      id: 'kd-clusters', type: 'circle', source: 'kd-events', filter: ['has', 'point_count'],
      paint: {
        'circle-color': 'rgba(15,16,17,0.72)', 'circle-stroke-color': 'rgba(255,255,255,0.22)', 'circle-stroke-width': 1,
        'circle-radius': ['step', ['get', 'point_count'], 17, 10, 21, 50, 27, 200, 33],
      },
    });
    // Invisible: tells which single events are on screen, so their pills can be placed.
    map.addLayer({
      id: 'kd-points', type: 'circle', source: 'kd-events', filter: ['!', ['has', 'point_count']],
      paint: { 'circle-radius': 6, 'circle-opacity': 0 },
    });
    sync();
  });

  const pinFor = (p: Pin) => {
    let pin = pins.get(p.id);
    if (!pin) {
      const wrap = document.createElement('div');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `kd-ppin kd-g-${p.family}`;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', opts.pinLabel ? opts.pinLabel(p) : p.title || p.label);
      const mk = document.createElement('span');
      mk.className = 'kd-mk';
      mk.setAttribute('aria-hidden', 'true');
      button.append(mk, document.createTextNode(p.label));
      button.addEventListener('click', (e) => { e.stopPropagation(); opts.onSelect?.(p.id); });
      wrap.append(button);
      const marker = new m.Marker({ element: wrap }).setLngLat([p.lng, p.lat]).addTo(map);
      pin = { marker, button };
      pins.set(p.id, pin);
    }
    pin.button.setAttribute('aria-pressed', String(p.id === selected));
    pin.marker.getElement().style.zIndex = p.id === selected ? '3' : '1';
    return pin;
  };

  /** Pills for the single events on screen; counts on the clusters. */
  const sync = () => {
    if (!map.getSource('kd-events')) return;
    const byId = new Map(items.map((x) => [x.id, x]));
    const shown = new Set<string>();
    for (const f of map.queryRenderedFeatures({ layers: ['kd-points'] })) {
      const p = byId.get(f.properties.id);
      if (!p || shown.has(p.id)) continue;
      shown.add(p.id);
      pinFor(p);
    }
    // The chosen event keeps its pill even inside a cluster.
    if (selected && byId.has(selected)) { shown.add(selected); pinFor(byId.get(selected)!); }
    for (const [id, pin] of pins) if (!shown.has(id)) { pin.marker.remove(); pins.delete(id); }
    const seen = new Set<number>();
    for (const f of map.queryRenderedFeatures({ layers: ['kd-clusters'] })) {
      const id = f.properties.cluster_id;
      if (seen.has(id)) continue;
      seen.add(id);
      let c = counts.get(id);
      if (!c) {
        const node = document.createElement('span');
        node.className = 'kd-mb kd-num pointer-events-none';
        c = new m.Marker({ element: node }).setLngLat(f.geometry.coordinates).addTo(map);
        counts.set(id, c);
      }
      c.getElement().textContent = f.properties.point_count_abbreviated;
      c.setLngLat(f.geometry.coordinates);
    }
    for (const [id, c] of counts) if (!seen.has(id)) { c.remove(); counts.delete(id); }
  };
  let timer: ReturnType<typeof setTimeout> | null = null;
  map.on('render', () => { if (timer) clearTimeout(timer); timer = setTimeout(sync, 80); });

  map.on('click', 'kd-clusters', async (e: any) => {
    const f = e.features?.[0];
    if (!f) return;
    e.preventDefault();
    const zoom = await map.getSource('kd-events').getClusterExpansionZoom(f.properties.cluster_id);
    map.easeTo({ center: f.geometry.coordinates, zoom: Math.min(zoom, 16) });
  });
  map.on('click', (e: any) => { if (!e.defaultPrevented) opts.onSelect?.(null); });
  map.on('mouseenter', 'kd-clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'kd-clusters', () => { map.getCanvas().style.cursor = ''; });
  // Only the visitor's own moves count; fitting to a city or a cluster does not.
  map.on('moveend', (e: any) => { if (e.originalEvent) opts.onMove?.(); });

  return {
    ready,
    setEvents(next) {
      items = next;
      const src = map.getSource('kd-events');
      if (src) src.setData(geo());
      for (const [id, pin] of pins) if (!next.some((x) => x.id === id)) { pin.marker.remove(); pins.delete(id); }
    },
    select(id) {
      selected = id;
      for (const [pid, pin] of pins) {
        pin.button.setAttribute('aria-pressed', String(pid === id));
        pin.marker.getElement().style.zIndex = pid === id ? '3' : '1';
      }
      sync();
      const p = items.find((x) => x.id === id);
      if (p && p.lat != null && p.lng != null && !map.getBounds().contains([p.lng, p.lat])) map.easeTo({ center: [p.lng, p.lat] });
    },
    setMe(at) {
      if (me) { me.remove(); me = null; }
      if (!at) return;
      const node = document.createElement('span');
      node.className = 'kd-me';
      node.setAttribute('role', 'img');
      me = new m.Marker({ element: node }).setLngLat([at.lng, at.lat]).addTo(map);
    },
    bounds() {
      const b = map.getBounds();
      return [r3(Math.max(-180, b.getWest())), r3(Math.max(-85, b.getSouth())), r3(Math.min(180, b.getEast())), r3(Math.min(85, b.getNorth()))];
    },
    fit(box, animate) { map.fitBounds(box, { padding: 40, animate: animate !== false, duration: 600 }); },
    flyTo(at, zoom) { map.easeTo({ center: [at.lng, at.lat], zoom: zoom ?? Math.max(map.getZoom(), 13) }); },
    zoom(by) { map.easeTo({ zoom: map.getZoom() + by }); },
    resize() { map.resize(); },
    destroy() {
      if (timer) clearTimeout(timer);
      pins.forEach((p) => p.marker.remove());
      counts.forEach((c) => c.remove());
      me?.remove();
      map.remove();
    },
  };
}
