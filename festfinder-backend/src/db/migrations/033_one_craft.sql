-- One craft per account. Every account attends (tickets, saves, follows); besides that it either
-- performs (artist) or organises (organizer), never both at once (services/roles.ts). Someone who
-- had both keeps the one they used last; the other is turned off, its profile and history kept,
-- and they can switch back. When both changed at the same moment, organising stays.
update user_roles r set status = 'disabled', updated_at = now()
 where r.status <> 'disabled'
   and exists (
     select 1 from user_roles o
      where o.user_id = r.user_id and o.role <> r.role and o.status <> 'disabled'
        and (o.updated_at > r.updated_at or (o.updated_at = r.updated_at and o.role = 'organizer')));

create unique index user_roles_one_craft on user_roles (user_id) where status <> 'disabled';
