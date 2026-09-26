create table if not exists public.push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    subscription jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita l'accesso anonimo in modo che chiunque visiti l'app possa salvarsi (inserire)
alter table public.push_subscriptions enable row level security;
create policy "Allow anonymous inserts" on public.push_subscriptions for insert with check (true);
-- Optionally allow users to delete their own, but since there's no auth, we just allow inserting.
