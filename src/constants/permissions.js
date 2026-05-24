import { T } from "./colors";

// ─── 권한 ─────────────────────────────────────────────
const PERMS = {
  owner: {
    items:true, staff:true, orders_approve:true, stats:true,
    orders_approve_standard:true, orders_approve_owner_review:true, orders_hold:true, orders_reject:true, orders_price_check:true,
    cost_view:true, home_cost:true, home_operations:true, home_stock_work:true,
    surgery_view_all:true, surgery_manage:true, surgery_confirm:true,
  },
  manager: {
    items:true, staff:true, orders_approve:true, stats:true,
    orders_approve_standard:true, orders_approve_owner_review:false, orders_hold:true, orders_reject:true, orders_price_check:true,
    cost_view:false, home_cost:false, home_operations:true, home_stock_work:true,
    surgery_view_all:true, surgery_manage:true, surgery_confirm:true,
  },
  hygienist: {
    items:true, staff:false, orders_approve:false, stats:false,
    orders_approve_standard:false, orders_approve_owner_review:false, orders_hold:false, orders_reject:false, orders_price_check:false,
    cost_view:false, home_cost:false, home_operations:false, home_stock_work:true,
    surgery_view_today:true, surgery_manage:false, surgery_confirm:true,
  },
  staff: {
    items:true, staff:false, orders_approve:false, stats:false,
    orders_approve_standard:false, orders_approve_owner_review:false, orders_hold:false, orders_reject:false, orders_price_check:false,
    cost_view:false, home_cost:false, home_operations:false, home_stock_work:true,
    surgery_view_today:true, surgery_manage:false, surgery_confirm:true,
  },
};

export const can = (role, p) => PERMS[role]?.[p] ?? false;

export const ROLE_META = {
  owner:     { label:"원장",       color:T.purple500, bg:T.purple50 },
  manager:   { label:"매니저",     color:T.blue500,   bg:T.blue50   },
  hygienist: { label:"치과위생사", color:T.green500,  bg:T.green50  },
  staff:     { label:"스태프",     color:T.grey700,   bg:T.grey100  },
};
