/*
 * FeestFinder's map: MapLibre on the Bảng phấn board, shared by both fronts.
 *
 * It is loaded only when someone opens the map view, and it never fetches events itself:
 * the screen asks the API for the events inside the visible box when the map opens and
 * again only when the visitor presses "search this area", then hands the result to
 * setEvents(). Moving the map just says that it moved.
 *
 * Events are one GeoJSON source with clustering, drawn by WebGL (no DOM marker per event).
 * Cluster counts and city names are a few HTML labels, so the map needs no glyph fonts.
 */
(function () {
  const FFMap = (window.FFMap = {});
  let lib = null;
  let loading = null;

  const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });

  /** MapLibre, its stylesheet and the PMTiles protocol, once per page. */
  FFMap.load = function (asset) {
    if (lib) return Promise.resolve(lib);
    if (loading) return loading;
    const at = asset || ((u) => u);
    loading = (async () => {
      if (!document.querySelector('link[data-ff-map]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = at('/ui/vendor/maplibre/maplibre-gl.css');
        link.setAttribute('data-ff-map', '');
        document.head.appendChild(link);
      }
      if (!window.pmtiles) await loadScript(at('/ui/vendor/maplibre/pmtiles.js'));
      const m = await import(at('/ui/vendor/maplibre/maplibre-gl.mjs'));
      m.setWorkerUrl(new URL(at('/ui/vendor/maplibre/maplibre-gl-worker.mjs'), location.href).href);
      const protocol = new window.pmtiles.Protocol();
      m.addProtocol('pmtiles', protocol.tile);
      lib = m;
      return m;
    })();
    loading.catch(() => { loading = null; });
    return loading;
  };

  const r3 = (n) => Math.round(n * 1000) / 1000;
  const EMPTY = { type: 'FeatureCollection', features: [] };

  /**
   * A map in `el`. Options:
   *   bounds [w, s, e, n]   where it opens
   *   hue(genre)            the colour of an event's dot
   *   cities [{ name, center }]  labels shown when zoomed out
   *   onSelect(id|null)     a dot was tapped (null: the map was)
   *   onMove()              the visitor moved the map
   */
  FFMap.create = function (el, opts) {
    const m = lib;
    const map = new m.Map({
      container: el,
      style: '/map/style.json',
      bounds: opts.bounds,
      fitBoundsOptions: { padding: 32 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: false,
      maxZoom: 17,
      minZoom: 2,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new m.NavigationControl({ showCompass: false }), 'top-right');

    let selected = null;
    let pending = EMPTY;
    const clusterLabels = new Map();
    const cityLabels = (opts.cities || []).map((c) => {
      const node = document.createElement('div');
      node.className = 'ff-map-city';
      node.textContent = c.name;
      // Under the point, so a cluster on the city centre keeps its count readable.
      return new m.Marker({ element: node, anchor: 'top', offset: [0, 20] }).setLngLat(c.center).addTo(map);
    });

    const ready = new Promise((resolve) => map.on('load', resolve));
    map.on('load', () => {
      map.addSource('ff-events', { type: 'geojson', data: pending, cluster: true, clusterRadius: 46, clusterMaxZoom: 13 });
      map.addLayer({
        id: 'ff-clusters', type: 'circle', source: 'ff-events', filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(255,252,225,0.12)', 'circle-stroke-color': 'rgba(255,252,225,0.7)', 'circle-stroke-width': 1.5,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26, 200, 32],
        },
      });
      map.addLayer({
        id: 'ff-points', type: 'circle', source: 'ff-events', filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'hue'], 'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 5, 14, 8],
          'circle-stroke-color': '#0E100F', 'circle-stroke-width': 2,
        },
      });
      map.addLayer({
        id: 'ff-selected', type: 'circle', source: 'ff-events', filter: ['==', ['get', 'id'], ''],
        paint: { 'circle-color': ['get', 'hue'], 'circle-radius': 12, 'circle-stroke-color': '#FFFCE1', 'circle-stroke-width': 3 },
      });
    });

    // Counts on the clusters in view: a handful of labels, refreshed as the map settles.
    const syncClusters = () => {
      if (!map.getSource('ff-events')) return;
      const seen = new Set();
      // Rendered clusters only: the source still holds the parent clusters while tiles change.
      for (const f of map.queryRenderedFeatures({ layers: ['ff-clusters'] })) {
        const id = f.properties.cluster_id;
        if (seen.has(id)) continue;
        seen.add(id);
        let mk = clusterLabels.get(id);
        if (!mk) {
          const node = document.createElement('div');
          node.className = 'ff-map-count';
          mk = new m.Marker({ element: node }).setLngLat(f.geometry.coordinates).addTo(map);
          clusterLabels.set(id, mk);
        }
        mk.getElement().textContent = f.properties.point_count_abbreviated;
        mk.setLngLat(f.geometry.coordinates);
      }
      for (const [id, mk] of clusterLabels) if (!seen.has(id)) { mk.remove(); clusterLabels.delete(id); }
    };
    // After the last frame of a move or a re-cluster, whichever comes later.
    let syncTimer = null;
    map.on('render', () => { clearTimeout(syncTimer); syncTimer = setTimeout(syncClusters, 120); });

    // City names help on a bare board, and get in the way once zoomed into a city.
    const syncCities = () => { const show = map.getZoom() < 7; cityLabels.forEach((c) => { c.getElement().style.display = show ? '' : 'none'; }); };
    map.on('zoomend', syncCities);
    syncCities();

    map.on('click', 'ff-points', (e) => {
      const f = e.features && e.features[0];
      if (!f) return;
      e.preventDefault();
      opts.onSelect && opts.onSelect(f.properties.id);
    });
    map.on('click', 'ff-clusters', async (e) => {
      const f = e.features && e.features[0];
      if (!f) return;
      e.preventDefault();
      const zoom = await map.getSource('ff-events').getClusterExpansionZoom(f.properties.cluster_id);
      map.easeTo({ center: f.geometry.coordinates, zoom: Math.min(zoom, 16) });
    });
    map.on('click', (e) => { if (!e.defaultPrevented && opts.onSelect) opts.onSelect(null); });
    for (const layer of ['ff-points', 'ff-clusters']) {
      map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
    }
    // Only the visitor's own moves count; fitting to a city or a cluster does not.
    map.on('moveend', (e) => { if (e.originalEvent && opts.onMove) opts.onMove(); });

    return {
      ready,
      map,
      /** The visible box, west, south, east, north, to three decimals. */
      bounds() {
        const b = map.getBounds();
        return [r3(Math.max(-180, b.getWest())), r3(Math.max(-85, b.getSouth())), r3(Math.min(180, b.getEast())), r3(Math.min(85, b.getNorth()))];
      },
      setEvents(items, hue) {
        pending = {
          type: 'FeatureCollection',
          features: items.filter((x) => x.lat != null && x.lng != null).map((x) => ({
            type: 'Feature', geometry: { type: 'Point', coordinates: [x.lng, x.lat] },
            properties: { id: x.id, hue: (hue || opts.hue)(x.genre) },
          })),
        };
        const src = map.getSource('ff-events');
        if (src) src.setData(pending);
      },
      select(id) {
        selected = id || null;
        if (map.getLayer('ff-selected')) map.setFilter('ff-selected', ['==', ['get', 'id'], selected || '']);
      },
      fit(bounds, animate) { map.fitBounds(bounds, { padding: 32, animate: animate !== false, duration: 700 }); },
      resize() { map.resize(); },
      destroy() { clearTimeout(syncTimer); clusterLabels.forEach((mk) => mk.remove()); map.remove(); },
      get selected() { return selected; },
    };
  };

  /**
   * A map that finds events: what both screens use. It searches when it opens, after a city
   * jump and when asked (search), never on its own after a pan; the visitor's moves only set
   * `dirty`, which shows "search this area". Every change of state goes to onChange.
   *
   *   fetch(bbox) → Promise<{ items, total, truncated }>   the screen's own query, filters included
   *   onChange({ ready, busy, dirty, items, total, truncated, sel, bbox })
   */
  FFMap.session = function (el, opts) {
    let seq = 0;
    const state = { ready: false, busy: false, dirty: false, items: [], total: 0, truncated: false, sel: null, bbox: null };
    const emit = (patch) => { Object.assign(state, patch); opts.onChange(Object.assign({}, state)); };
    const ctrl = FFMap.create(el, {
      bounds: opts.bounds, hue: opts.hue, cities: opts.cities,
      onSelect: (id) => { ctrl.select(id); emit({ sel: id }); },
      onMove: () => emit({ dirty: true }),
    });
    const search = (box) => {
      const bbox = box || ctrl.bounds();
      const n = ++seq;
      emit({ busy: true, dirty: false, bbox });
      return opts.fetch(bbox).then((out) => {
        if (n !== seq) return;
        ctrl.setEvents(out.items);
        const sel = state.sel && out.items.some((x) => x.id === state.sel) ? state.sel : null;
        ctrl.select(sel);
        emit({ items: out.items, total: out.total, truncated: out.truncated, busy: false, sel });
      }, () => { if (n === seq) emit({ busy: false }); });
    };
    ctrl.ready.then(() => { emit({ ready: true }); search(); });
    return {
      search: () => search(),
      /** What is on screen again, for new filters. */
      refresh: () => (state.ready ? search() : undefined),
      /** Go to a box (a city) and show its events. */
      fit: (box) => { ctrl.fit(box, false); if (state.ready) search(box); },
      select: (id) => { ctrl.select(id); emit({ sel: id || null }); },
      destroy: () => { seq++; ctrl.destroy(); },
    };
  };
})();
