// ─── TOSS TOKENS ──────────────────────────────────────

const lightTokens = {
  // ── Accent: Blue (primary) & Red (danger) ──
  blue500:"#2563eb",   blue600:"#1d54d4",   blue50:"#eaf2ff",
  white:"#ffffff",

  // ── Monochrome scale (crisp, neutral) ──
  grey900:"#0f172a",   grey800:"#1f2937",   grey700:"#374151",
  grey600:"#52606d",   grey500:"#7b8794",   grey400:"#9aa5b1",
  grey300:"#cbd2d9",   grey200:"#e4e7eb",   grey100:"#f1f3f5",  grey50:"#f7f8fa",

  // ── Red (danger only) ──
  red500:"#f04452",    red50:"#ffeef0",

  // ── Status tints (used sparingly, very desaturated) ──
  green500:"#16a34a",  green50:"#e8f7ee",
  orange500:"#f59e0b", orange50:"#fff5e0",
  yellow500:"#eab308", yellow50:"#fff8db",
  purple500:"#7c3aed", purple50:"#f1ebff",
  teal500:"#0d9488",   teal50:"#e2f5f2",
};

// 다크모드 토큰: 명도 반전 + 채도 약간 조정
const darkTokens = {
  blue500:"#4d8cff",   blue600:"#3d7fff",   blue50:"#15243d",
  white:"#15181c",                                                // "흰색" 대신 어두운 배경
  grey900:"#f4f6f8",   grey800:"#e4e7eb",   grey700:"#cbd2d9",   // 텍스트는 밝게
  grey600:"#9aa5b1",   grey500:"#7b8794",   grey400:"#52606d",
  grey300:"#374151",   grey200:"#1f2937",   grey100:"#1a1f27",   grey50:"#161a20",
  red500:"#ff5b6a",    red50:"#3a1a1f",
  green500:"#34d399",  green50:"#12321f",
  orange500:"#fbbf24", orange50:"#3a2a10",
  yellow500:"#facc15", yellow50:"#3a3416",
  purple500:"#a78bfa", purple50:"#241a3a",
  teal500:"#2dd4bf",   teal50:"#103030",
};

export const themeTokens = { light: lightTokens, dark: darkTokens };

// 하위 호환: 기존 import { T } 코드가 작동하도록 light 토큰을 기본 export
export const T = lightTokens;

export const font = `"Toss Product Sans","Tossface","SF Pro KR","SF Pro Display",-apple-system,BlinkMacSystemFont,"Basier Square","Apple SD Gothic Neo",Roboto,"Noto Sans KR",sans-serif`;

export const CS = "0px 1px 2px rgba(15,23,42,0.04), 0px 4px 16px rgba(15,23,42,0.04)";
