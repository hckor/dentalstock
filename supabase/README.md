# DentalStock Supabase Setup

This folder keeps the database setup versioned with the app.

## 1. Run the initial schema

1. Open Supabase Dashboard.
2. Go to SQL Editor.
3. Create a new query.
4. Paste `supabase/migrations/20260520_initial_dentalstock_schema.sql`.
5. Run it.

Then run all later migration files in filename order.

Current required order:

1. `20260520_initial_dentalstock_schema.sql`
2. `20260520_rls_hardening.sql`
3. `20260520_items_bridge_and_seed.sql`
4. `20260520_stock_transaction_rpc.sql`
5. `20260520_orders_bridge_and_seed.sql`
6. `20260520_order_receipt_rpc.sql`
7. `20260520_surgeries_bridge_and_usage_rpc.sql`
8. `20260520_activity_bridge.sql`

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

## 4. Auth hardening before sharing

Before sharing the Vercel app outside the project team:

1. Go to Authentication > Providers > Email.
2. Disable public self-signup if the pilot should be invite-only.
3. Enable email confirmation for production use.
4. Create users manually or through an invite flow.
5. Add each user to `public.profiles` with the correct `clinic_id` and role.

Recommended roles:

- `owner`: clinic owner, can manage staff and settings.
- `manager`: can approve orders and manage inventory workflows.
- `hygienist` or `staff`: day-to-day stock and surgery workflow user.

## 5. Vercel variables

For the frontend deployment, set only these variables:

```bash
VITE_DENTALSTOCK_API_MODE=supabase
VITE_SUPABASE_URL=https://tausnjxzqmnhoeslgbmc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Do not add `SUPABASE_SERVICE_ROLE_KEY` to the frontend deployment. Use it only in a server-only environment after backend persistence or order workers are implemented.
