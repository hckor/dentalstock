import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-price-monitor-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ITEM_SELECT = "id, clinic_id, legacy_id, name, category, unit, stock, min_stock, memo, app_data, updated_at";
const MAX_PRODUCTS_PER_RUN = 50;
const MAX_HTML_BYTES = 512 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type VendorOption = {
  vendor_id?: string;
  vendor_name?: string;
  price?: number | string | null;
  shipping_fee?: number | string | null;
  min_order_qty?: number | string | null;
  sku?: string;
  url?: string;
  in_stock?: boolean;
  last_checked_at?: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function env(name: string) {
  return Deno.env.get(name) || "";
}

function toPositiveNumber(value: unknown) {
  const number = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeLimit(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return MAX_PRODUCTS_PER_RUN;
  return Math.min(Math.floor(number), MAX_PRODUCTS_PER_RUN);
}

function isUuid(value: unknown) {
  return UUID_PATTERN.test(String(value || ""));
}

function isPrivateIPv4(hostname: string) {
  const parts = hostname.split(".").map(part => Number(part));
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isIPv6 = host.includes(":");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    (isIPv6 && (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80"))) ||
    isPrivateIPv4(host)
  );
}

function allowedVendorHosts() {
  return env("PRICE_MONITOR_ALLOWED_HOSTS")
    .split(",")
    .map(host => host.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedVendorHost(hostname: string) {
  const allowedHosts = allowedVendorHosts();
  if (!allowedHosts.length) return true;

  const host = hostname.toLowerCase();
  return allowedHosts.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
}

function parseProductUrl(value: unknown) {
  try {
    const url = new URL(String(value || "").trim());
    const hasUnsafePort = url.port && url.port !== "443";
    if (
      url.protocol !== "https:" ||
      hasUnsafePort ||
      isBlockedHostname(url.hostname) ||
      !isAllowedVendorHost(url.hostname)
    ) return null;
    return url;
  } catch {
    return null;
  }
}

async function readLimitedText(response: Response) {
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    received += value.byteLength;
    if (received > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new Error("response_too_large");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function decodeEntities(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractJsonLdPrice(html: string) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const script of scripts) {
    const body = script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(decodeEntities(body));
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        const offers = Array.isArray(node.offers) ? node.offers : node.offers ? [node.offers] : [];
        for (const offer of offers) {
          const price = toPositiveNumber(offer?.price ?? offer?.lowPrice);
          if (price) {
            return {
              price,
              inStock: !String(offer?.availability || "").toLowerCase().includes("outofstock"),
            };
          }
        }
        Object.values(node).forEach(value => {
          if (value && typeof value === "object") queue.push(value);
        });
      }
    } catch {
      // Ignore malformed JSON-LD blocks from vendor sites.
    }
  }
  return null;
}

function extractMetaPrice(html: string) {
  const patterns = [
    /<meta[^>]+(?:property|name|itemprop)=["'](?:product:price:amount|og:price:amount|price)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:product:price:amount|og:price:amount|price)["']/i,
    /"price"\s*:\s*"?([0-9][0-9,\.]*)"?/i,
    /판매가[^0-9]{0,40}([0-9][0-9,]{2,})\s*원/i,
    /([0-9][0-9,]{2,})\s*원/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const price = match ? toPositiveNumber(match[1]) : null;
    if (price) return price;
  }
  return null;
}

function extractStockState(html: string) {
  const lower = html.toLowerCase();
  if (lower.includes("outofstock") || html.includes("품절") || html.includes("일시품절")) return false;
  return true;
}

async function fetchPrice(productUrl: string) {
  const url = parseProductUrl(productUrl);
  if (!url) {
    return { ok: false, status: 0, price: null, inStock: false, error: "invalid_product_url" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "manual",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "DentalStockPriceMonitor/0.1 (+https://dentalstock-nine.vercel.app)",
      },
    });
    const html = await readLimitedText(response);
    const jsonLd = extractJsonLdPrice(html);
    const price = jsonLd?.price || extractMetaPrice(html);

    return {
      ok: response.ok && Boolean(price),
      status: response.status,
      price,
      inStock: jsonLd?.inStock ?? extractStockState(html),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      price: null,
      inStock: false,
      error: error instanceof Error ? error.message : "fetch_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function updateVendorOption(options: VendorOption[], product: Record<string, unknown>, snapshot: Record<string, unknown>) {
  const vendorId = String(product.vendor_id || "");
  const productUrl = String(product.product_url || "");
  return options.map(option => {
    const sameVendor = String(option.vendor_id || "") === vendorId;
    const sameUrl = !option.url || option.url === productUrl;
    if (!sameVendor || !sameUrl) return option;
    return {
      ...option,
      price: snapshot.price,
      shipping_fee: snapshot.shipping_fee,
      in_stock: snapshot.in_stock,
      last_checked_at: snapshot.observed_at,
      url: productUrl,
    };
  });
}

function getAppData(row: Record<string, unknown>) {
  return row?.app_data && typeof row.app_data === "object" ? row.app_data as Record<string, unknown> : {};
}

function buildVendorProductPayload(itemRow: Record<string, unknown>, option: VendorOption) {
  const productUrl = parseProductUrl(option.url);
  if (!productUrl) return null;

  const vendorId = String(option.vendor_id || option.vendor_name || productUrl.hostname).trim();
  if (!vendorId) return null;

  return {
    clinic_id: itemRow.clinic_id,
    item_id: itemRow.id,
    vendor_id: vendorId,
    vendor_name: option.vendor_name || vendorId,
    product_url: productUrl.toString(),
    sku: option.sku || null,
    min_order_qty: Math.max(1, Number(option.min_order_qty) || 1),
    is_active: true,
    app_data: {
      shipping_fee: toPositiveNumber(option.shipping_fee) || 0,
      source: "item_vendor_options",
    },
  };
}

async function syncVendorProductsFromItems(
  adminClient: ReturnType<typeof createClient>,
  clinicId: string,
  itemId: string,
  limit: number,
) {
  let itemQuery = adminClient
    .from("items")
    .select(ITEM_SELECT)
    .eq("is_active", true)
    .limit(limit);

  if (clinicId) itemQuery = itemQuery.eq("clinic_id", clinicId);
  if (itemId) itemQuery = itemQuery.eq("id", itemId);

  const { data: itemRows, error: itemError } = await itemQuery;
  if (itemError) return { synced: 0, error: itemError };

  let synced = 0;
  for (const itemRow of itemRows || []) {
    const appData = getAppData(itemRow);
    const vendorOptions = Array.isArray(appData.vendor_options) ? appData.vendor_options as VendorOption[] : [];
    for (const option of vendorOptions) {
      const payload = buildVendorProductPayload(itemRow, option);
      if (!payload) continue;

      const { data: existingRows, error: lookupError } = await adminClient
        .from("vendor_products")
        .select("id")
        .eq("item_id", payload.item_id)
        .eq("vendor_id", payload.vendor_id)
        .eq("product_url", payload.product_url)
        .limit(1);
      if (lookupError) return { synced, error: lookupError };

      const existing = existingRows?.[0];
      const write = existing
        ? adminClient.from("vendor_products").update(payload).eq("id", existing.id)
        : adminClient.from("vendor_products").insert(payload);
      const { error: writeError } = await write;
      if (writeError) return { synced, error: writeError };
      synced += 1;
      if (synced >= limit) return { synced, error: null };
    }
  }

  return { synced, error: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 500);

  const authorization = req.headers.get("Authorization") || "";
  const monitorSecret = env("PRICE_MONITOR_SECRET");
  const hasCronSecret = monitorSecret && req.headers.get("x-price-monitor-secret") === monitorSecret;
  if (!hasCronSecret && !authorization.startsWith("Bearer ")) return json({ error: "authentication_required" }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let clinicId = "";
  if (!hasCronSecret) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "authentication_required" }, 401);

    const { data: actorProfile, error: actorError } = await userClient
      .from("profiles")
      .select("clinic_id, role, is_active")
      .eq("id", authData.user.id)
      .single();
    if (actorError || !actorProfile?.is_active || !["owner", "manager"].includes(actorProfile.role)) {
      return json({ error: "manager_required" }, 403);
    }
    clinicId = actorProfile.clinic_id;
  }

  const body = await req.json().catch(() => ({}));
  if (hasCronSecret && body.clinic_id) clinicId = String(body.clinic_id);
  const itemId = isUuid(body.item_id) ? String(body.item_id) : "";
  const limit = normalizeLimit(body.limit);

  const syncResult = await syncVendorProductsFromItems(adminClient, clinicId, itemId, limit);
  if (syncResult.error) return json({ error: "products_sync_failed" }, 500);

  let query = adminClient
    .from("vendor_products")
    .select("id, clinic_id, item_id, vendor_id, vendor_name, product_url, sku, min_order_qty, shipping_fee:app_data->shipping_fee, app_data")
    .eq("is_active", true)
    .limit(limit);

  if (clinicId) query = query.eq("clinic_id", clinicId);
  if (itemId) query = query.eq("item_id", itemId);

  const { data: products, error: productError } = await query;
  if (productError) return json({ error: "products_load_failed" }, 500);

  const results = [];
  for (const product of products || []) {
    const observedAt = new Date().toISOString();
    const fetched = await fetchPrice(product.product_url);
    if (!fetched.price) {
      results.push({ vendor_product_id: product.id, ok: false, status: fetched.status, error: fetched.error || "price_not_found" });
      continue;
    }

    const shippingFee = toPositiveNumber(product.app_data?.shipping_fee ?? product.shipping_fee) || 0;
    const snapshot = {
      clinic_id: product.clinic_id,
      vendor_product_id: product.id,
      price: fetched.price,
      shipping_fee: shippingFee,
      in_stock: fetched.inStock,
      observed_at: observedAt,
      source: "edge_fetch",
      raw_data: { status: fetched.status },
    };

    const { error: snapshotError } = await adminClient.from("price_snapshots").insert(snapshot);
    if (snapshotError) {
      results.push({ vendor_product_id: product.id, ok: false, error: "snapshot_insert_failed" });
      continue;
    }

    const { data: itemRow } = await adminClient
      .from("items")
      .select(ITEM_SELECT)
      .eq("id", product.item_id)
      .single();

    const appData = itemRow?.app_data && typeof itemRow.app_data === "object" ? itemRow.app_data : {};
    const vendorOptions = Array.isArray(appData.vendor_options) ? appData.vendor_options : [];
    const nextVendorOptions = updateVendorOption(vendorOptions, product, snapshot);

    await adminClient
      .from("items")
      .update({
        app_data: {
          ...appData,
          vendor_options: nextVendorOptions,
          price_monitor_last_run_at: observedAt,
        },
      })
      .eq("id", product.item_id);

    results.push({
      vendor_product_id: product.id,
      item_id: product.item_id,
      vendor_name: product.vendor_name,
      ok: true,
      price: fetched.price,
      in_stock: fetched.inStock,
      observed_at: observedAt,
    });
  }

  return json({
    checked: results.length,
    updated: results.filter(result => result.ok).length,
    failed: results.filter(result => !result.ok).length,
    synced: syncResult.synced,
    results,
  });
});
