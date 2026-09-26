-- Run this in your Supabase SQL Editor to support the new Meal Request system

-- 1. Create the meal_requests table
create table if not exists public.meal_requests (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    date date not null default current_date,
    breakfast boolean default false,
    lunch boolean default false,
    dinner boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(student_id, date)
);

-- 2. Enable RLS
alter table public.meal_requests enable row level security;

-- 3. Policies for Meal Requests
-- Admin access
create policy "Allow authenticated users full access to meal_requests"
on public.meal_requests for all to authenticated using (true) with check (true);

-- Public (anon) access so students can submit without logging in
create policy "Allow anon insert meal_requests"
on public.meal_requests for insert to anon with check (true);

create policy "Allow anon update meal_requests"
on public.meal_requests for update to anon using (true) with check (true);

create policy "Allow anon select meal_requests"
on public.meal_requests for select to anon using (true);

-- 4. Allow public to read the students table (needed to search by room number)
-- Note: If a policy already exists, this might throw a warning, which is safe to ignore.
create policy "Allow anon read students"
on public.students for select to anon using (true);
