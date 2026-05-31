insert into public.admin_users (user_id, email)
select id, email from auth.users
where email = 'mrolayokun@gmail.com'
on conflict do nothing;