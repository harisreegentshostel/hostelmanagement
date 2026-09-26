-- Migration: Secure Student Payments Access for Student Portal
-- Run this in your Supabase SQL Editor

create or replace function get_student_payments(p_student_id uuid, p_email text)
returns setof public.payments
language plpgsql
security definer
as $$
begin
  -- Only return payment records if the student_id and email match an active resident
  if exists (
    select 1 from public.students 
    where id = p_student_id 
    and lower(email) = lower(p_email) 
    and status = 'active'
  ) then
    return query
    select * from public.payments
    where student_id = p_student_id
    order by payment_date desc, created_at desc;
  end if;
end;
$$;

-- Grant execution permission to public and authenticated roles
grant execute on function get_student_payments(uuid, text) to anon, authenticated;
