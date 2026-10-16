import type { Metadata } from 'next';
import { directoryRoute } from '@/kd/web/directory/page';

// Rendered on request, like /a.
export const dynamic = 'force-dynamic';

// The names events list that nobody runs yet (lineups, FeestFinder Radar), apart from the
// directory (D13). Kept out of search engines: the artist pages themselves are indexed.
export const metadata: Metadata = { title: { absolute: 'Chưa có người quản lý · Nghệ sĩ · FeestFinder' }, robots: { index: false, follow: true } };

const scope = () => ({ unclaimed: true });
export default directoryRoute(scope, 'vi', { query: true });
