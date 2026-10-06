import { appMetadata, appViewport } from '@/kd/app/meta';
import { SettingsScreen } from '@/kd/app/screens';

export const metadata = appMetadata;
export const viewport = appViewport;

export default function Page() {
  return <SettingsScreen />;
}
