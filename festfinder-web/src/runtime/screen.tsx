'use client';
/**
 * Boots one design surface in the browser.
 *
 * In order: the surface's loaders install themselves on FF, FF.boot() fetches the session,
 * the server clock and the current route's data, and only then is the screen's logic
 * created — so, as with the design runtime, the logic's module-level code sees live data
 * and the first frame it renders is a real one. Until then the page shows `children`:
 * whatever the server rendered for this URL.
 */
import * as React from 'react';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { DCHost, DCLogic, type LogicClass } from './dc';
import { FF } from './ff';
import { trackSpotlights } from './motion';

export interface SurfaceModules {
  name: string;
  base: string;
  View: ComponentType<{ s: Record<string, any> }>;
  Head: ComponentType;
  createLogic: (ff: typeof FF, react: typeof React, base: typeof DCLogic) => LogicClass | undefined;
  installData: (ff: typeof FF) => void;
  defaultProps: Record<string, unknown>;
  /** Anything the surface adds to FF before its loaders run. */
  setup?: (ff: typeof FF) => void;
}

export function ScreenHost({ surface, children }: { surface: SurfaceModules; children?: ReactNode }) {
  const [Logic, setLogic] = useState<LogicClass | null>(null);

  useEffect(() => {
    trackSpotlights();
    let live = true;
    (async () => {
      surface.setup?.(FF);
      surface.installData(FF);
      await FF.boot(surface.base);
      const L = surface.createLogic(FF, React, DCLogic);
      if (live && L) setLogic(() => L);
    })();
    return () => {
      live = false;
    };
    // A surface boots once per page; its own router handles every move after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { Head, View, name, defaultProps } = surface;
  return (
    <>
      <Head />
      <div id="dc-root">
        {Logic ? <DCHost name={name} Logic={Logic} View={View} props={defaultProps} /> : children}
      </div>
    </>
  );
}
