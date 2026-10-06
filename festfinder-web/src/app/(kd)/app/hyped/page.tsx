import { appMetadata, appViewport } from '@/kd/app/meta';
import { HypedScreen } from '@/kd/app/screens';

export const metadata = appMetadata;
export const viewport = appViewport;

export default function Page() {
  return <HypedScreen />;
}
