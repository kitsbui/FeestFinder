'use client';
/** The public site: discovery, event pages, the map and the city landing pages. */
import type { ReactNode } from 'react';
import View from '@/screens/web/view';
import Head from '@/screens/web/head';
import createLogic from '@/screens/web/logic.js';
import installData from '@/screens/web/data.js';
import { defaultProps } from '@/screens/web/props';
import { ScreenHost, type SurfaceModules } from '@/runtime/screen';

const surface: SurfaceModules = {
  name: 'web',
  base: '/',
  View,
  Head,
  createLogic: createLogic as SurfaceModules['createLogic'],
  installData: installData as SurfaceModules['installData'],
  defaultProps,
};

export default function WebScreen({ children }: { children?: ReactNode }) {
  return <ScreenHost surface={surface}>{children}</ScreenHost>;
}
