// ─── TOSS TOKENS ──────────────────────────────────────

const lightTokens = {
  // ── Accent: Blue (primary) & Red (danger) ──
  blue500:"#2563eb",   blue600:"#2272eb",   blue50:"#e8f3ff",
  white:"#ffffff",

  // ── Monochrome scale (Toss warm grey) ──
  grey900:"#191f28",   grey800:"#333d4b",   grey700:"#4e5968",
  grey600:"#6b7684",   grey500:"#8b95a1",   grey400:"#b0b8c1",
  grey300:"#d1d6db",   grey200:"#e5e8eb",   grey100:"#f2f4f6",  grey50:"#f9fafb",

  // ── Red (danger only) ──
  red500:"#f04452",    red50:"#ffeef0",

  // ── Status tints (used sparingly, very desaturated) ──
  green500:"#03b26c",  green50:"#e6f8f0",
  orange500:"#fe9800", orange50:"#fff3df",
  yellow500:"#ffc342", yellow50:"#fff8df",
  purple500:"#a234c7", purple50:"#f7eafd",
  teal500:"#18a5a5",   teal50:"#e5f7f7",
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
export const monoFont = `"SF Mono",SFMono-Regular,Menlo,Consolas,monospace`;

export const CS = "0px 2px 8px rgba(0,0,0,0.08)";
