// ─── TOSS TOKENS ──────────────────────────────────────

const lightTokens = {
  blue500:"#2563eb",   blue600:"#2272eb",   blue50:"#e8f3ff",
  white:"#ffffff",
  grey900:"#191f28",   grey800:"#333d4b",   grey700:"#4e5968",
  grey600:"#6b7684",   grey500:"#8b95a1",   grey400:"#b0b8c1",
  grey300:"#d1d6db",   grey200:"#e5e8eb",   grey100:"#f2f4f6",  grey50:"#f9fafb",
  red500:"#f04452",    red50:"#fff0f1",
  green500:"#03b26c",  green50:"#eafaf3",
  orange500:"#fe9800", orange50:"#fff8ec",
  yellow500:"#ffc342", yellow50:"#fff9df",
  purple500:"#a234c7", purple50:"#f8eafd",
  teal500:"#18a5a5",   teal50:"#e6f7f7",
};

// 다크모드 토큰: 명도 반전 + 채도 약간 조정
const darkTokens = {
  blue500:"#4d8cff",   blue600:"#3d7fff",   blue50:"#1a2c4d",
  white:"#1a1d21",                                                // "흰색" 대신 어두운 배경
  grey900:"#f2f4f6",   grey800:"#e5e8eb",   grey700:"#d1d6db",   // 텍스트는 밝게
  grey600:"#b0b8c1",   grey500:"#8b95a1",   grey400:"#6b7684",
  grey300:"#4e5968",   grey200:"#333d4b",   grey100:"#252a31",   grey50:"#1f2329",
  red500:"#ff5b6a",    red50:"#3d1d20",
  green500:"#2dd693",  green50:"#13352a",
  orange500:"#ffac3d", orange50:"#3d2e15",
  yellow500:"#ffd45e", yellow50:"#3d3520",
  purple500:"#c258e6", purple50:"#321a3d",
  teal500:"#3dcecc",   teal50:"#152e2e",
};

export const themeTokens = { light: lightTokens, dark: darkTokens };

// 하위 호환: 기존 import { T } 코드가 작동하도록 light 토큰을 기본 export
export const T = lightTokens;

export const font = `"Toss Product Sans","Tossface","SF Pro KR","SF Pro Display",-apple-system,BlinkMacSystemFont,"Basier Square","Apple SD Gothic Neo",Roboto,"Noto Sans KR",sans-serif`;

export const CS = "0px 2px 8px rgba(0,0,0,0.08)";
