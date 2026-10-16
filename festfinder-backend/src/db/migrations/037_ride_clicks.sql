-- "Đặt xe" on an event page opens Grab or Green SM with the way to the venue (lib/rides.ts).
-- Each press is counted per event and day, like ticket clicks (one per person per event every
-- 30 minutes, robots left out), so an organiser sees how many people booked a ride to the night.
alter table event_metrics_daily add column ride_clicks int not null default 0 check (ride_clicks >= 0);
