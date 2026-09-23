'use client';
/** The internal admin console. */
import type { ReactNode } from 'react';
import View from '@/screens/admin/view';
import Head from '@/screens/admin/head';
import createLogic from '@/screens/admin/logic.js';
import installData from '@/screens/admin/data.js';
import { defaultProps } from '@/screens/admin/props';
import { ScreenHost, type SurfaceModules } from '@/runtime/screen';

const surface: SurfaceModules = {
  name: 'admin',
  base: '/console',
  View,
  Head,
  createLogic: createLogic as SurfaceModules['createLogic'],
  installData: installData as SurfaceModules['installData'],
  defaultProps,
};

export default function AdminScreen({ children }: { children?: ReactNode }) {
  return <ScreenHost surface={surface}>{children}</ScreenHost>;
}
