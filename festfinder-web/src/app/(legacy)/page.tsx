import WebScreen from '@/surfaces/web';
import { EventList } from '@/components/summaries';
import { apiOr, type EventCard } from '@/lib/api';

// The listing changes as events are added and approved; a minute is fresh enough.
export const revalidate = 60;

export default async function Home() {
  // Built ahead of time, possibly before the API is up: an empty list is refreshed a minute later.
  const list = await apiOr<{ items: EventCard[] }>('/events?time=weekend&limit=24', { items: [] });
  return (
    <WebScreen>
      <EventList
        title="Sự kiện ở TP.HCM cuối tuần này"
        intro="Lễ hội, show nhạc và chợ đêm ở TP.HCM: giờ diễn, địa điểm, giá vé và ai sẽ đi."
        events={list.items}
      />
    </WebScreen>
  );
}
