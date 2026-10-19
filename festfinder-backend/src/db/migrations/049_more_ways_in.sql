-- More ways in (design v2 phase 17, owner 2026-10-19): TikTok as a linked account, and a guest who
-- bought a ticket with an email and a phone, whose account is made silently (signup_method 'guest')
-- and taken over the first time they prove that email with a code or a link.
alter table social_connections drop constraint if exists social_connections_provider_check;
alter table social_connections add constraint social_connections_provider_check check (provider in ('google', 'fb', 'ig', 'zalo', 'wa', 'tiktok'));
alter table users drop constraint if exists users_signup_method_check;
alter table users add constraint users_signup_method_check check (signup_method in ('email', 'google', 'zalo', 'wa', 'sms', 'fb', 'ig', 'tiktok', 'guest', 'staff'));
