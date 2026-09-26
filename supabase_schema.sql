-- Hostel Management System Supabase Schema

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Students Table
create table if not exists public.students (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    email text,
    phone text,
    id_proof text,
    room_number text,
    fee_amount numeric not null default 0,
    fee_due_date date, -- Next due date
    status text not null default 'active', -- 'active', 'inactive'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Payments Table
create table if not exists public.payments (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    amount numeric not null,
    payment_date date not null default current_date,
    payment_period text, -- e.g., 'September 2026'
    status text not null default 'completed', -- 'completed', 'pending'
    reference text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Food Records Table
create table if not exists public.food_records (
    id uuid default uuid_generate_v4() primary key,
    date date not null default current_date,
    meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
    student_count integer not null default 0,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(date, meal_type)
);

-- Row Level Security (RLS) setup

-- Enable RLS on all tables
alter table public.students enable row level security;
alter table public.payments enable row level security;
alter table public.food_records enable row level security;

-- Create policies to allow access only to authenticated users (admins)

-- Students
create policy "Allow authenticated users to read students"
on public.students for select
to authenticated
using (true);

create policy "Allow authenticated users to insert students"
on public.students for insert
to authenticated
with check (true);

create policy "Allow authenticated users to update students"
on public.students for update
to authenticated
using (true)
with check (true);

create policy "Allow authenticated users to delete students"
on public.students for delete
to authenticated
using (true);

-- Payments
create policy "Allow authenticated users to read payments"
on public.payments for select
to authenticated
using (true);

create policy "Allow authenticated users to insert payments"
on public.payments for insert
to authenticated
with check (true);

create policy "Allow authenticated users to update payments"
on public.payments for update
to authenticated
using (true)
with check (true);

create policy "Allow authenticated users to delete payments"
on public.payments for delete
to authenticated
using (true);

-- Food Records
create policy "Allow authenticated users to read food_records"
on public.food_records for select
to authenticated
using (true);

create policy "Allow authenticated users to insert food_records"
on public.food_records for insert
to authenticated
with check (true);

create policy "Allow authenticated users to update food_records"
on public.food_records for update
to authenticated
using (true)
with check (true);

create policy "Allow authenticated users to delete food_records"
on public.food_records for delete
to authenticated
using (true);

-- Create a function to automatically update updated_at columns
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_students_updated_at
  before update on public.students
  for each row
  execute function public.handle_updated_at();

create trigger update_food_records_updated_at
  before update on public.food_records
  for each row
  execute function public.handle_updated_at();
