// ── Favorites localStorage manager ──────────────────────────────────────

const SURAH_FAVS_KEY = "murattel_fav_surahs";
const READER_FAVS_KEY = "murattel_fav_readers";

function getSet(key: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<number>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

// ── Surah favourites ──
export function getFavSurahs(): Set<number> {
  return getSet(SURAH_FAVS_KEY);
}

export function toggleFavSurah(surahId: number): Set<number> {
  const set = getSet(SURAH_FAVS_KEY);
  if (set.has(surahId)) set.delete(surahId);
  else set.add(surahId);
  saveSet(SURAH_FAVS_KEY, set);
  return new Set(set);
}

export function isFavSurah(surahId: number): boolean {
  return getSet(SURAH_FAVS_KEY).has(surahId);
}

// ── Reader favourites ──
export function getFavReaders(): Set<number> {
  return getSet(READER_FAVS_KEY);
}

export function toggleFavReader(readerId: number): Set<number> {
  const set = getSet(READER_FAVS_KEY);
  if (set.has(readerId)) set.delete(readerId);
  else set.add(readerId);
  saveSet(READER_FAVS_KEY, set);
  return new Set(set);
}

export function isFavReader(readerId: number): boolean {
  return getSet(READER_FAVS_KEY).has(readerId);
}
