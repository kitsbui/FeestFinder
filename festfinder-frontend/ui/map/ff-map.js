/*
 * FeestFinder's map loader (FFMap.load): MapLibre, its stylesheet and the PMTiles protocol,
 * once per page, for the Kính đêm map (festfinder-web/src/kd/map/kd-map.ts). It is loaded only
 * when someone opens a map.
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
      // Side by side: the PMTiles protocol is small, MapLibre is not.
      const [m] = await Promise.all([
        import(at('/ui/vendor/maplibre/maplibre-gl.mjs')),
        window.pmtiles ? null : loadScript(at('/ui/vendor/maplibre/pmtiles.js')),
      ]);
      m.setWorkerUrl(new URL(at('/ui/vendor/maplibre/maplibre-gl-worker.mjs'), location.href).href);
      const protocol = new window.pmtiles.Protocol();
      m.addProtocol('pmtiles', protocol.tile);
      lib = m;
      return m;
    })();
    loading.catch(() => { loading = null; });
    return loading;
  };
})();
