-- "Đi cùng bạn bè" is private by default (owner, 2026-10-18): a friend sees the nights someone goes
-- to (their going, their saves, where they are on site, the nights they shared in a recap) only
-- once that person said yes. Null: not asked yet, asked the first time they save, join a plan or buy;
-- true: friends see; false: kept private. Everyone starts unasked, so nothing shows until each says.
alter table users add column if not exists share_nights boolean;
