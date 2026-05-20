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
9. `20260520_staff_management.sql`
10. `20260520_price_monitoring.sql`

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
- `vendor_products`
- `price_snapshots`
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

After running `20260520_staff_management.sql`, staff active state and role changes must go through the app's staff management screen or these RPCs:

- `set_profile_active(profile_id, is_active)`
- `set_profile_role(profile_id, role)`
- `update_my_profile(name)`

Only an active `owner` can change another staff member's active state or role. The database also prevents removing the last active owner.

## 5. Vercel variables

For the frontend deployment, set only these variables:

```bash
VITE_DENTALSTOCK_API_MODE=supabase
VITE_SUPABASE_URL=https://tausnjxzqmnhoeslgbmc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Do not add `SUPABASE_SERVICE_ROLE_KEY` to the frontend deployment. Use it only in a server-only environment after backend persistence or order workers are implemented.

## 6. Staff invite Edge Function

The app's staff invite form calls `invite-staff`. Deploy it after running the staff management migration:

```bash
supabase functions deploy invite-staff --project-ref tausnjxzqmnhoeslgbmc
supabase functions deploy price-monitor --project-ref tausnjxzqmnhoeslgbmc --use-api
```

Set these function secrets in Supabase:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key> --project-ref tausnjxzqmnhoeslgbmc
supabase secrets set INVITE_REDIRECT_URL=<your-vercel-or-local-login-url> --project-ref tausnjxzqmnhoeslgbmc
```

Security behavior:

- The browser sends only the signed-in user's JWT.
- The Edge Function checks that the caller is an active `owner`.
- `SUPABASE_SERVICE_ROLE_KEY` is used only inside the Edge Function to send the Auth invite and create the matching `profiles` row.
- Invite roles are limited to `manager`, `hygienist`, or `staff`.

## 7. Price monitor Edge Function

The app's "가격 지금 확인" button calls `price-monitor`. It reads active `vendor_products`, fetches their product pages, extracts a best-effort price, stores `price_snapshots`, and updates the item's `vendor_options`.

Notes:

- This is a best-effort monitor. Vendor pages without public price markup may fail.
- Keep runs small at first. The function caps each run at 50 products.
- For scheduled runs, set an optional `PRICE_MONITOR_SECRET` and call the function with `x-price-monitor-secret`.
