-- Accounts, sign-in and the social graph.

create table users (
  id               uuid primary key default gen_random_uuid(),
  name             text not null default '',
  email            text unique,                    -- lower-cased
  phone            text unique,                    -- E.164, used by Zalo / WhatsApp sign-in
  password_hash    text,
  signup_method    text not null check (signup_method in ('email', 'zalo', 'wa', 'fb', 'ig', 'staff')),
  city             text not null default '',
  photo_url        text,
  locale           text not null default 'vi' check (locale in ('en', 'vi')),
  role             text not null default 'user' check (role in ('user', 'admin')),
  interests        text[] not null default '{}',
  birth_year       int,
  -- Payee details for group-plan VietQR requests.
  payee_bank_bin   text,
  payee_bank_name  text,
  payee_account_no text,
  payee_account_name text,
  created_at       timestamptz not null default now(),
  last_active_at   timestamptz
);

create table user_activity_days (
  user_id uuid not null references users on delete cascade,
  day     date not null,
  primary key (user_id, day)
);

create table social_connections (
  user_id      uuid not null references users on delete cascade,
  provider     text not null check (provider in ('fb', 'ig', 'zalo', 'wa')),
  external_id  text not null,
  display_name text,
  connected_at timestamptz not null default now(),
  primary key (user_id, provider),
  unique (provider, external_id)
);

-- Stored in both directions so "my friends" is a single index lookup.
create table friendships (
  user_id    uuid not null references users on delete cascade,
  friend_id  uuid not null references users on delete cascade,
  source     text not null check (source in ('fb', 'ig', 'zalo', 'wa')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table otp_challenges (
  id          uuid primary key default gen_random_uuid(),
  purpose     text not null check (purpose in ('auth', 'reset', 'connect', 'staff')),
  channel     text not null check (channel in ('email', 'zalo', 'wa', 'sms')),
  identifier  text not null,
  code_hash   text not null,
  attempts    int not null default 0,
  user_id     uuid references users on delete cascade,   -- set for 'connect'
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  resend_at   timestamptz not null,
  consumed_at timestamptz
);
create index otp_challenges_identifier on otp_challenges (identifier, created_at desc);

-- Short-lived tokens issued after an email OTP, exchanged for a password.
create table password_tokens (
  token_hash text primary key,
  purpose    text not null check (purpose in ('signup', 'reset')),
  email      text,
  phone      text,
  user_id    uuid references users on delete cascade,
  expires_at timestamptz not null,
  used_at    timestamptz
);

create table oauth_states (
  state        text primary key,
  provider     text not null check (provider in ('fb', 'ig')),
  user_id      uuid references users on delete cascade,   -- set when connecting, null when signing in
  redirect_uri text not null,
  expires_at   timestamptz not null
);
