import { T } from "./colors";

// ─── 권한 ─────────────────────────────────────────────
export const PERMS = {
  owner:     { items:true, staff:true, orders_approve:true,  stats:true  },
  manager:   { items:true, staff:true, orders_approve:true,  stats:true  },
  hygienist: { items:true, staff:false,orders_approve:false, stats:false },
};

export const can = (role, p) => PERMS[role]?.[p] ?? false;

export const ROLE_META = {
  owner:     { label:"원장",       color:T.purple500, bg:T.purple50 },
  manager:   { label:"매니저",     color:T.blue500,   bg:T.blue50   },
  hygienist: { label:"치과위생사", color:T.green500,  bg:T.green50  },
};
