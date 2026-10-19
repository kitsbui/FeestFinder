-- Access tokens a provider hands out and rotates (Zalo ZNS: an hour-long access token and a
-- refresh token that changes on every refresh), kept here so every instance uses the newest one.
create table if not exists provider_tokens (
  provider      text primary key,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  updated_at    timestamptz not null default now()
);

-- An account made by proving a phone with an SMS code (phase 17).
alter table users drop constraint if exists users_signup_method_check;
alter table users add constraint users_signup_method_check check (signup_method in ('email', 'google', 'zalo', 'wa', 'sms', 'fb', 'ig', 'staff'));
