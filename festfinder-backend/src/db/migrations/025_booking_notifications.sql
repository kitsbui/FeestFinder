-- Organisers get gig applications and booking answers under a topic of their own, so they
-- can switch them off without losing moderation alerts.
alter table organizer_notification_prefs drop constraint organizer_notification_prefs_topic_check;
alter table organizer_notification_prefs add constraint organizer_notification_prefs_topic_check
  check (topic in ('moderation', 'tickets', 'payouts', 'crew', 'bookings'));
