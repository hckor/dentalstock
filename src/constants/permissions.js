import { T } from "./colors";

// ─── 권한 ─────────────────────────────────────────────
export const ROLE_CAPABILITIES = {
  VIEW_COST: "view_cost",
  VIEW_APPROVAL: "view_approval",
  VIEW_STAFF: "view_staff",
  VIEW_ALL_STATUS: "view_all_status",
  VIEW_INVENTORY: "view_inventory",
  APPROVE_ORDER: "approve_order",
  APPROVE_OWNER_REVIEW_ORDER: "approve_owner_review_order",
  MANAGE_INVENTORY: "manage_inventory",
  MANAGE_ORDER: "manage_order",
  MANAGE_STAFF: "manage_staff",
  MANAGE_SURGERY_PREP: "manage_surgery_prep",
  CONFIRM_SURGERY_PREP: "confirm_surgery_prep",
};

const C = ROLE_CAPABILITIES;

export const ROLE_CAPABILITY_MATRIX = {
  owner: {
    [C.VIEW_COST]:true, [C.VIEW_APPROVAL]:true, [C.VIEW_STAFF]:true, [C.VIEW_ALL_STATUS]:true, [C.VIEW_INVENTORY]:true,
    [C.APPROVE_ORDER]:true, [C.APPROVE_OWNER_REVIEW_ORDER]:true,
    [C.MANAGE_INVENTORY]:true, [C.MANAGE_ORDER]:true, [C.MANAGE_STAFF]:true, [C.MANAGE_SURGERY_PREP]:true, [C.CONFIRM_SURGERY_PREP]:true,
    items:true, staff:true, orders_approve:true, stats:true,
    orders_approve_standard:true, orders_approve_owner_review:true, orders_hold:true, orders_reject:true, orders_price_check:true,
    cost_view:true, home_cost:true, home_operations:true, home_stock_work:true,
    surgery_view_all:true, surgery_manage:true, surgery_confirm:true,
  },
  manager: {
    [C.VIEW_COST]:false, [C.VIEW_APPROVAL]:true, [C.VIEW_STAFF]:true, [C.VIEW_ALL_STATUS]:true, [C.VIEW_INVENTORY]:true,
    [C.APPROVE_ORDER]:true, [C.APPROVE_OWNER_REVIEW_ORDER]:false,
    [C.MANAGE_INVENTORY]:true, [C.MANAGE_ORDER]:true, [C.MANAGE_STAFF]:true, [C.MANAGE_SURGERY_PREP]:true, [C.CONFIRM_SURGERY_PREP]:true,
    items:true, staff:true, orders_approve:true, stats:true,
    orders_approve_standard:true, orders_approve_owner_review:false, orders_hold:true, orders_reject:true, orders_price_check:true,
    cost_view:false, home_cost:false, home_operations:true, home_stock_work:true,
    surgery_view_all:true, surgery_manage:true, surgery_confirm:true,
  },
  hygienist: {
    [C.VIEW_COST]:false, [C.VIEW_APPROVAL]:false, [C.VIEW_STAFF]:false, [C.VIEW_ALL_STATUS]:false, [C.VIEW_INVENTORY]:true,
    [C.APPROVE_ORDER]:false, [C.APPROVE_OWNER_REVIEW_ORDER]:false,
    [C.MANAGE_INVENTORY]:false, [C.MANAGE_ORDER]:false, [C.MANAGE_STAFF]:false, [C.MANAGE_SURGERY_PREP]:false, [C.CONFIRM_SURGERY_PREP]:true,
    items:true, staff:false, orders_approve:false, stats:false,
    orders_approve_standard:false, orders_approve_owner_review:false, orders_hold:false, orders_reject:false, orders_price_check:false,
    cost_view:false, home_cost:false, home_operations:false, home_stock_work:true,
    surgery_view_today:true, surgery_manage:false, surgery_confirm:true,
  },
  staff: {
    [C.VIEW_COST]:false, [C.VIEW_APPROVAL]:false, [C.VIEW_STAFF]:false, [C.VIEW_ALL_STATUS]:false, [C.VIEW_INVENTORY]:true,
    [C.APPROVE_ORDER]:false, [C.APPROVE_OWNER_REVIEW_ORDER]:false,
    [C.MANAGE_INVENTORY]:false, [C.MANAGE_ORDER]:false, [C.MANAGE_STAFF]:false, [C.MANAGE_SURGERY_PREP]:false, [C.CONFIRM_SURGERY_PREP]:true,
    items:true, staff:false, orders_approve:false, stats:false,
    orders_approve_standard:false, orders_approve_owner_review:false, orders_hold:false, orders_reject:false, orders_price_check:false,
    cost_view:false, home_cost:false, home_operations:false, home_stock_work:true,
    surgery_view_today:true, surgery_manage:false, surgery_confirm:true,
  },
};

export const PERMS = ROLE_CAPABILITY_MATRIX;

export const can = (role, p) => ROLE_CAPABILITY_MATRIX[role]?.[p] ?? false;

export const ROLE_META = {
  owner:     { label:"원장",       color:T.purple500, bg:T.purple50 },
  manager:   { label:"매니저",     color:T.blue500,   bg:T.blue50   },
  hygienist: { label:"치과위생사", color:T.green500,  bg:T.green50  },
  staff:     { label:"스태프",     color:T.grey700,   bg:T.grey100  },
};
