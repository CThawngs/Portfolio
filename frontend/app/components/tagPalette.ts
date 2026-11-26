export interface TagColorScheme {
  pill: string;
  activePill: string;
}

/**
 * 24 distinct, harmonious color schemes inspired by the classic colorful tag UI,
 * tuned for crisp contrast in both Light Mode and Matte Obsidian Dark Mode.
 * Zero duplicate colors across up to 24 unique tags in a filter bar.
 */
export const TAG_COLOR_PALETTE: TagColorScheme[] = [
  {
    // 0: Emerald
    pill: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/14 dark:text-emerald-300 border-emerald-500/28 dark:border-emerald-400/28",
    activePill: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-zinc-950 dark:border-emerald-400 shadow-xs",
  },
  {
    // 1: Sky
    pill: "bg-sky-500/12 text-sky-700 dark:bg-sky-400/14 dark:text-sky-300 border-sky-500/28 dark:border-sky-400/28",
    activePill: "bg-sky-600 text-white border-sky-600 dark:bg-sky-400 dark:text-zinc-950 dark:border-sky-300 shadow-xs",
  },
  {
    // 2: Violet
    pill: "bg-violet-500/12 text-violet-700 dark:bg-violet-400/14 dark:text-violet-300 border-violet-500/28 dark:border-violet-400/28",
    activePill: "bg-violet-600 text-white border-violet-600 dark:bg-violet-400 dark:text-zinc-950 dark:border-violet-300 shadow-xs",
  },
  {
    // 3: Amber
    pill: "bg-amber-500/14 text-amber-800 dark:bg-amber-400/14 dark:text-amber-300 border-amber-500/30 dark:border-amber-400/28",
    activePill: "bg-amber-600 text-white border-amber-600 dark:bg-amber-400 dark:text-zinc-950 dark:border-amber-300 shadow-xs",
  },
  {
    // 4: Rose
    pill: "bg-rose-500/12 text-rose-700 dark:bg-rose-400/14 dark:text-rose-300 border-rose-500/28 dark:border-rose-400/28",
    activePill: "bg-rose-600 text-white border-rose-600 dark:bg-rose-400 dark:text-zinc-950 dark:border-rose-300 shadow-xs",
  },
  {
    // 5: Teal
    pill: "bg-teal-500/12 text-teal-700 dark:bg-teal-400/14 dark:text-teal-300 border-teal-500/28 dark:border-teal-400/28",
    activePill: "bg-teal-600 text-white border-teal-600 dark:bg-teal-400 dark:text-zinc-950 dark:border-teal-300 shadow-xs",
  },
  {
    // 6: Indigo
    pill: "bg-indigo-500/12 text-indigo-700 dark:bg-indigo-400/14 dark:text-indigo-300 border-indigo-500/28 dark:border-indigo-400/28",
    activePill: "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-400 dark:text-zinc-950 dark:border-indigo-300 shadow-xs",
  },
  {
    // 7: Orange
    pill: "bg-orange-500/13 text-orange-700 dark:bg-orange-400/14 dark:text-orange-300 border-orange-500/28 dark:border-orange-400/28",
    activePill: "bg-orange-600 text-white border-orange-600 dark:bg-orange-400 dark:text-zinc-950 dark:border-orange-300 shadow-xs",
  },
  {
    // 8: Cyan
    pill: "bg-cyan-500/13 text-cyan-800 dark:bg-cyan-400/14 dark:text-cyan-300 border-cyan-500/28 dark:border-cyan-400/28",
    activePill: "bg-cyan-600 text-white border-cyan-600 dark:bg-cyan-400 dark:text-zinc-950 dark:border-cyan-300 shadow-xs",
  },
  {
    // 9: Fuchsia
    pill: "bg-fuchsia-500/12 text-fuchsia-700 dark:bg-fuchsia-400/14 dark:text-fuchsia-300 border-fuchsia-500/28 dark:border-fuchsia-400/28",
    activePill: "bg-fuchsia-600 text-white border-fuchsia-600 dark:bg-fuchsia-400 dark:text-zinc-950 dark:border-fuchsia-300 shadow-xs",
  },
  {
    // 10: Lime
    pill: "bg-lime-500/14 text-lime-800 dark:bg-lime-400/14 dark:text-lime-300 border-lime-600/28 dark:border-lime-400/28",
    activePill: "bg-lime-600 text-white border-lime-600 dark:bg-lime-400 dark:text-zinc-950 dark:border-lime-300 shadow-xs",
  },
  {
    // 11: Blue
    pill: "bg-blue-500/12 text-blue-700 dark:bg-blue-400/14 dark:text-blue-300 border-blue-500/28 dark:border-blue-400/28",
    activePill: "bg-blue-600 text-white border-blue-600 dark:bg-blue-400 dark:text-zinc-950 dark:border-blue-300 shadow-xs",
  },
  {
    // 12: Pink
    pill: "bg-pink-500/12 text-pink-700 dark:bg-pink-400/14 dark:text-pink-300 border-pink-500/28 dark:border-pink-400/28",
    activePill: "bg-pink-600 text-white border-pink-600 dark:bg-pink-400 dark:text-zinc-950 dark:border-pink-300 shadow-xs",
  },
  {
    // 13: Green
    pill: "bg-green-500/12 text-green-700 dark:bg-green-400/14 dark:text-green-300 border-green-500/28 dark:border-green-400/28",
    activePill: "bg-green-600 text-white border-green-600 dark:bg-green-400 dark:text-zinc-950 dark:border-green-300 shadow-xs",
  },
  {
    // 14: Purple
    pill: "bg-purple-500/12 text-purple-700 dark:bg-purple-400/14 dark:text-purple-300 border-purple-500/28 dark:border-purple-400/28",
    activePill: "bg-purple-600 text-white border-purple-600 dark:bg-purple-400 dark:text-zinc-950 dark:border-purple-300 shadow-xs",
  },
  {
    // 15: Yellow / Gold
    pill: "bg-yellow-500/16 text-yellow-800 dark:bg-yellow-400/14 dark:text-yellow-200 border-yellow-500/32 dark:border-yellow-400/28",
    activePill: "bg-yellow-600 text-white border-yellow-600 dark:bg-yellow-400 dark:text-zinc-950 dark:border-yellow-300 shadow-xs",
  },
  {
    // 16: Red / Crimson
    pill: "bg-red-500/12 text-red-700 dark:bg-red-400/14 dark:text-red-300 border-red-500/28 dark:border-red-400/28",
    activePill: "bg-red-600 text-white border-red-600 dark:bg-red-400 dark:text-zinc-950 dark:border-red-300 shadow-xs",
  },
  {
    // 17: Emerald-Mint Deep
    pill: "bg-emerald-600/14 text-emerald-800 dark:bg-emerald-300/14 dark:text-emerald-200 border-emerald-600/30 dark:border-emerald-300/28",
    activePill: "bg-emerald-700 text-white border-emerald-700 dark:bg-emerald-300 dark:text-zinc-950 dark:border-emerald-200 shadow-xs",
  },
  {
    // 18: Sky-Cerulean
    pill: "bg-sky-600/14 text-sky-800 dark:bg-sky-300/14 dark:text-sky-200 border-sky-600/30 dark:border-sky-300/28",
    activePill: "bg-sky-700 text-white border-sky-700 dark:bg-sky-300 dark:text-zinc-950 dark:border-sky-200 shadow-xs",
  },
  {
    // 19: Coral / Warm Orange-Red
    pill: "bg-orange-600/12 text-orange-800 dark:bg-orange-300/14 dark:text-orange-200 border-orange-600/28 dark:border-orange-300/28",
    activePill: "bg-orange-700 text-white border-orange-700 dark:bg-orange-300 dark:text-zinc-950 dark:border-orange-200 shadow-xs",
  },
  {
    // 20: Periwinkle / Indigo Soft
    pill: "bg-indigo-600/14 text-indigo-800 dark:bg-indigo-300/14 dark:text-indigo-200 border-indigo-600/28 dark:border-indigo-300/28",
    activePill: "bg-indigo-700 text-white border-indigo-700 dark:bg-indigo-300 dark:text-zinc-950 dark:border-indigo-200 shadow-xs",
  },
  {
    // 21: Seafoam / Teal Soft
    pill: "bg-teal-600/14 text-teal-800 dark:bg-teal-300/14 dark:text-teal-200 border-teal-600/28 dark:border-teal-300/28",
    activePill: "bg-teal-700 text-white border-teal-700 dark:bg-teal-300 dark:text-zinc-950 dark:border-teal-200 shadow-xs",
  },
  {
    // 22: Orchid / Pink-Purple
    pill: "bg-fuchsia-600/14 text-fuchsia-800 dark:bg-fuchsia-300/14 dark:text-fuchsia-200 border-fuchsia-600/28 dark:border-fuchsia-300/28",
    activePill: "bg-fuchsia-700 text-white border-fuchsia-700 dark:bg-fuchsia-300 dark:text-zinc-950 dark:border-fuchsia-200 shadow-xs",
  },
  {
    // 23: Warm Bronze / Amber Deep
    pill: "bg-amber-600/14 text-amber-900 dark:bg-amber-300/14 dark:text-amber-200 border-amber-600/30 dark:border-amber-300/28",
    activePill: "bg-amber-700 text-white border-amber-700 dark:bg-amber-300 dark:text-zinc-950 dark:border-amber-200 shadow-xs",
  },
];

function hashTag(tag: string): number {
  let h = 2166136261;
  for (let i = 0; i < tag.length; i++) {
    h ^= tag.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Builds a collision-free color map so every unique tag in a list or across the portfolio
 * gets its own distinct color scheme without adjacent or duplicate colors.
 */
export function buildTagColorMap(tags: string[]): Map<string, TagColorScheme> {
  const map = new Map<string, TagColorScheme>();
  let idx = 0;
  for (const raw of tags) {
    const key = raw.trim();
    if (!key || map.has(key)) continue;
    map.set(key, TAG_COLOR_PALETTE[idx % TAG_COLOR_PALETTE.length]);
    idx += 1;
  }
  return map;
}

export function getTagColorScheme(
  tag: string,
  colorMap?: Map<string, TagColorScheme>
): TagColorScheme {
  const key = (tag || "").trim();
  if (colorMap && colorMap.has(key)) {
    return colorMap.get(key)!;
  }
  return TAG_COLOR_PALETTE[hashTag(key) % TAG_COLOR_PALETTE.length];
}
