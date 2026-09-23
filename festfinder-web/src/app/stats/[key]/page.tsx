import WebScreen from '@/surfaces/web';

// The same shell for every path: the screen reads the URL in the browser.
export const dynamic = 'force-static';

export default function Page() {
  return <WebScreen />;
}
