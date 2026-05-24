const SIZE_ALIASES = [
  ["extra small", "xs"],
  ["x-small", "xs"],
  ["x small", "xs"],
  ["small", "s"],
  ["medium", "m"],
  ["large", "l"],
  ["x-large", "xl"],
  ["x large", "xl"],
  ["extra large", "xl"],
  ["미디움", "m"],
  ["라지", "l"],
];

const SIZE_SUFFIX_PATTERN = /(xxl|xl|xs|s|m|l)$/;
const SEPARATED_SIZE_PATTERN = /(^|[\s._\-\\/{}[\]()（）<>])(xxl|xl|xs|s|m|l)$/;
const HANGUL_SIZE_SUFFIX_PATTERN = /\p{Script=Hangul}.+(xxl|xl|xs|s|m|l)$/u;

export function getItemIdentityKey(name = "") {
  let normalized = String(name)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[{}[\]()（）<>]/g, " ");

  SIZE_ALIASES.forEach(([from, to]) => {
    normalized = normalized.replace(new RegExp(from, "g"), to);
  });

  return normalized
    .replace(/[\s._\-\\/]+/g, "")
    .replace(/[^\p{L}\p{N}%]+/gu, "")
    .trim();
}

export function getItemBaseIdentityKey(name = "") {
  const key = getItemIdentityKey(name);
  const original = String(name).normalize("NFKC").toLowerCase().trim().replace(/[)）\]}>]+$/g, "").trim();
  const hasSizeSuffix = SEPARATED_SIZE_PATTERN.test(original) || HANGUL_SIZE_SUFFIX_PATTERN.test(original);
  if (!hasSizeSuffix) return key;
  const base = key.replace(SIZE_SUFFIX_PATTERN, "");
  return base.length >= 2 ? base : key;
}

export function findSimilarInventoryItem(items = [], candidateName = "") {
  const candidateKey = getItemIdentityKey(candidateName);
  if (!candidateKey) return null;

  const exactMatch = items.find(item => getItemIdentityKey(item?.name) === candidateKey);
  if (exactMatch) return { item: exactMatch, kind: "exact" };

  const candidateBaseKey = getItemBaseIdentityKey(candidateName);
  if (candidateBaseKey.length < 3) return null;

  const similarMatch = items.find(item => {
    const itemKey = getItemIdentityKey(item?.name);
    if (!itemKey || itemKey === candidateKey) return false;
    const itemBaseKey = getItemBaseIdentityKey(item?.name);
    return candidateBaseKey === candidateKey
      ? itemBaseKey === candidateKey
      : itemBaseKey === candidateBaseKey;
  });

  return similarMatch ? { item: similarMatch, kind: "similar" } : null;
}
