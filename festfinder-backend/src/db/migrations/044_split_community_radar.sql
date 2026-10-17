-- Two organisers hold the events nobody runs yet (owner, 2026-10-17): Feest Radar holds what
-- ingestion finds (origin radar), and Cộng đồng FeestFinder, back at /o/cong-dong, holds what
-- people send in. Both stay placeholders (is_community: anyone can claim their events, nobody is
-- warned or told); `placeholder` says which is which, one of each at most. The events someone
-- posted that 043 left with Feest Radar move to the community organiser; Radar's finds stay.
-- On an empty database nothing is created: each appears with its first event.

alter table organizers add column if not exists placeholder text check (placeholder in ('community', 'radar'));
create unique index if not exists organizers_placeholder on organizers (placeholder) where placeholder is not null;

-- The organiser 043 renamed is Feest Radar's.
update organizers set placeholder = 'radar' where is_community and placeholder is null
   and not exists (select 1 from organizers o where o.placeholder = 'radar');
update organizers set slug = 'feest-radar', name = 'Feest Radar', initials = 'FR'
 where placeholder = 'radar' and slug = 'cong-dong' and not exists (select 1 from organizers o where o.slug = 'feest-radar');
update organizers set bio = '{"en":"Electronic nights and festivals Feest Radar found on public pages. A moderator checks each one before it goes live.","vi":"Đêm nhạc điện tử và lễ hội do Feest Radar tìm thấy trên các trang công khai. Mỗi tin đều được kiểm duyệt trước khi lên sóng."}'::jsonb
 where placeholder = 'radar';

-- The community's own organiser, where there is data to hold.
insert into organizers (slug, name, initials, type, bio, art, is_community, placeholder)
select 'cong-dong', 'Cộng đồng FeestFinder', 'CĐ', 'public',
       '{"en":"Events people found and sent in. Each one is checked by a moderator before it goes live.","vi":"Sự kiện do mọi người phát hiện và gửi lên. Mỗi tin đều được kiểm duyệt trước khi lên sóng."}'::jsonb,
       'linear-gradient(135deg,#0AE448,#ABFF84)', true, 'community'
 where exists (select 1 from organizers where placeholder = 'radar')
   and not exists (select 1 from organizers where placeholder = 'community')
   and not exists (select 1 from organizers where slug = 'cong-dong');

update events set organizer_id = (select id from organizers where placeholder = 'community')
 where organizer_id = (select id from organizers where placeholder = 'radar')
   and origin = 'posted'
   and exists (select 1 from organizers where placeholder = 'community');
