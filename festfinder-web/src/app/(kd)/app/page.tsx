import { appMetadata, appViewport } from '@/kd/app/meta';
import { ExploreScreen } from '@/kd/app/screens';

export const metadata = appMetadata;
export const viewport = appViewport;

export default function Page() {
  return <ExploreScreen />;
}
