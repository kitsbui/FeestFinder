-- Google sign-in: a Gmail account is the main way in; Facebook, Instagram and Zalo are linked accounts.
alter table users drop constraint if exists users_signup_method_check;
alter table users add constraint users_signup_method_check check (signup_method in ('email', 'google', 'zalo', 'wa', 'fb', 'ig', 'staff'));
alter table social_connections drop constraint if exists social_connections_provider_check;
alter table social_connections add constraint social_connections_provider_check check (provider in ('google', 'fb', 'ig', 'zalo', 'wa'));
alter table oauth_states drop constraint if exists oauth_states_provider_check;
alter table oauth_states add constraint oauth_states_provider_check check (provider in ('google', 'fb', 'ig'));
