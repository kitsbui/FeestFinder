'use client';
/** The organiser back office. */
import type { ReactNode } from 'react';
import View from '@/screens/organizer/view';
import Head from '@/screens/organizer/head';
import createLogic from '@/screens/organizer/logic.js';
import installData from '@/screens/organizer/data.js';
import { defaultProps } from '@/screens/organizer/props';
import { ScreenHost, type SurfaceModules } from '@/runtime/screen';

const surface: SurfaceModules = {
  name: 'organizer',
  base: '/studio',
  View,
  Head,
  createLogic: createLogic as SurfaceModules['createLogic'],
  installData: installData as SurfaceModules['installData'],
  defaultProps,
};

export default function OrganizerScreen({ children }: { children?: ReactNode }) {
  return <ScreenHost surface={surface}>{children}</ScreenHost>;
}
