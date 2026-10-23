/**
 * Demo headlines for the news feed (SEED_NEWS=1: the screen tests and the local preview): two
 * publications whose next read is years away, so no request leaves the machine, and a few
 * headlines with the pictures the fake network answers. Never production data.
 */
import type { Db } from '../../src/db/index.ts';
import { json } from '../../src/db/index.ts';

const SOURCES = [
  { name: 'Mixmag (demo)', site: 'https://mixmag.example/', feed: 'https://mixmag.example/rss.xml', region: 'global', lang: 'en' },
  { name: 'Vietcetera (demo)', site: 'https://vietcetera.example/', feed: 'https://vietcetera.example/rss', region: 'vietnam', lang: 'vi' },
];

const ITEMS = [
  { source: 0, guid: 'demo-1', url: 'https://mixmag.example/news/tomorrowland-2027-dates', title: 'Tomorrowland announces 2027 dates and pre-registration', summary: 'The Belgian festival returns to Boom over two weekends in July; pre-registration opens next week.', image: 'https://mixmag.example/images/tomorrowland-2027.jpg', topic: 'festival', region: 'global', styles: ['mainstage'], hoursAgo: 3,
    digest: { en: 'Tomorrowland has set its 2027 dates in Boom and opens pre-registration next week.', vi: 'Tomorrowland đã chốt ngày tổ chức năm 2027 tại Boom và mở đăng ký trước vào tuần sau.' } },
  { source: 0, guid: 'demo-2', url: 'https://mixmag.example/feature/hard-techno-beatport-report', title: 'Hard techno keeps rising: what Beatport’s mid-year report says', summary: 'Hard techno and hard dance grew fastest on the store in the first half of the year.', image: 'https://mixmag.example/images/beatport-report.jpg', topic: 'industry', region: 'global', styles: ['hard-techno', 'hard-dance'], hoursAgo: 9,
    digest: { en: 'Beatport’s mid-year report shows hard techno and hard dance as its fastest-growing genres.', vi: 'Báo cáo giữa năm của Beatport cho thấy hard techno và hard dance tăng nhanh nhất.' } },
  { source: 0, guid: 'demo-3', url: 'https://mixmag.example/news/rekordbox-stems', title: 'rekordbox adds stem separation on the CDJ-3000', summary: 'The update brings stems to the players themselves, no laptop needed.', image: null, topic: 'tech', region: 'global', styles: [], hoursAgo: 26, digest: null },
  { source: 1, guid: 'demo-4', url: 'https://vietcetera.example/vn/ha-noi-gio-mo-cua', title: 'Hà Nội thí điểm kéo dài giờ mở cửa quán bar ở phố cổ đến 2 giờ sáng', summary: 'Quận Hoàn Kiếm cho phép các quán bar, club trong khu phố cổ mở cửa đến 2 giờ sáng vào cuối tuần.', image: 'https://vietcetera.example/images/pho-co.jpg', topic: 'industry', region: 'vietnam', styles: [], hoursAgo: 30,
    digest: { en: 'Hanoi’s Hoàn Kiếm district lets Old Quarter bars and clubs stay open until 2 am at weekends in a pilot.', vi: 'Quận Hoàn Kiếm thí điểm cho bar và club ở phố cổ mở cửa đến 2 giờ sáng cuối tuần.' } },
  { source: 0, guid: 'demo-5', url: 'https://mixmag.example/news/boiler-room-bangkok', title: 'Boiler Room returns to Bangkok with a Thai line-up', summary: 'The first Boiler Room in Bangkok since 2019 lands in November.', image: 'https://mixmag.example/images/boiler-room-bkk.jpg', topic: 'festival', region: 'asia', styles: ['techno', 'house'], hoursAgo: 50, digest: null },
];

export async function seedNews(db: Db, now: Date): Promise<{ newsSources: number; newsItems: number }> {
  const far = new Date(now.getTime() + 10 * 365 * 24 * 3600_000);
  const ids: string[] = [];
  for (const s of SOURCES) {
    const row = await db.query<{ id: string }>(
      `insert into news_sources (name, site_url, feed_url, lang, region, enabled, interval_minutes, next_run_at, last_run_at, last_count, created_at, updated_at)
       values ($1,$2,$3,$4,$5,true,60,$6,$7,$8,$7,$7) on conflict (feed_url) do update set name = excluded.name returning id`,
      [s.name, s.site, s.feed, s.lang, s.region, far, now, ITEMS.filter((i) => SOURCES[i.source] === s).length]);
    ids.push(row.rows[0].id);
  }
  for (const it of ITEMS) {
    const at = new Date(now.getTime() - it.hoursAgo * 3600_000);
    await db.query(
      `insert into news_items (source_id, guid, url, title, summary, digest, image_url, image_from, topic, region, styles, published_at, fetched_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) on conflict (source_id, guid) do nothing`,
      [ids[it.source], it.guid, it.url, it.title, it.summary, json(it.digest), it.image, it.image ? 'feed' : 'none', it.topic, it.region, it.styles, at, now]);
  }
  return { newsSources: SOURCES.length, newsItems: ITEMS.length };
}
