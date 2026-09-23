'use client';
/** The attendee app: feed, tickets, group plans, live mode. */
import type { ReactNode } from 'react';
import View from '@/screens/app/view';
import Head from '@/screens/app/head';
import createLogic from '@/screens/app/logic.js';
import installData from '@/screens/app/data.js';
import { defaultProps } from '@/screens/app/props';
import { ScreenHost, type SurfaceModules } from '@/runtime/screen';
import { enablePush, forgetDevice, registerServiceWorker } from '@/runtime/pwa';

const surface: SurfaceModules = {
  name: 'app',
  base: '/app',
  View,
  Head,
  createLogic: createLogic as SurfaceModules['createLogic'],
  installData: installData as SurfaceModules['installData'],
  defaultProps,
  setup(ff) {
    registerServiceWorker();
    ff.enablePush = enablePush;
    ff.beforeSignOut = forgetDevice;
  },
};

export default function AppScreen({ children }: { children?: ReactNode }) {
  return <ScreenHost surface={surface}>{children}</ScreenHost>;
}
