# DentalStock Supabase Setup

This folder keeps the database setup versioned with the app.

## 1. Run the initial schema

1. Open Supabase Dashboard.
2. Go to SQL Editor.
3. Create a new query.
4. Paste `supabase/migrations/20260520_initial_dentalstock_schema.sql`.
5. Run it.

The migration creates the first production-ready tables with RLS enabled:

- `clinics`
- `profiles`
- `items`
- `txs`
- `orders`
- `surgeries`
- `notifs`
- `settings`
- `audit_logs`
- server-only `vendor_credentials`
- server-only `order_jobs`

## 2. Create the first owner profile

After creating or signing up the first Supabase Auth user, add that user to the demo clinic:

```sql
insert into public.profiles (id, clinic_id, name, role)
values (
  '<auth-user-id>',
  '00000000-0000-0000-0000-000000000001',
  '관리자',
  'owner'
);
```

Replace `<auth-user-id>` with the user's UUID from Authentication > Users.

## 3. Environment values

Browser-safe values:

```bash
VITE_SUPABASE_URL=https://tausnjxzqmnhoeslgbmc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Server-only values:

```bash
SUPABASE_URL=https://tausnjxzqmnhoeslgbmc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-or-secret-key>
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in the frontend or Vercel client variables.
