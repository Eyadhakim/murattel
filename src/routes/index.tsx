import { Match, onMount, Show } from "solid-js";
import { createSignal, onCleanup, For, Switch } from "solid-js";
import { quran } from "~/constants/quran";
import { surahs } from "~/constants/surahs";
import { readers } from "~/constants/readers";

// ── Types ──────────────────────────────────────────────────────────────
interface Surah {
  id: number;
  name: string;
}

interface Reader {
  name: string;
  server: string;
  readerId: number;
  mushafId: number;
}

interface Ayah {
  verse: number;
  start: number;
  end: number;
  text: string;
}

// ── Component ──────────────────────────────────────────────────────────
export default function QuranPlayer() {
  async function fetchAyat({
    surahId,
    mushafId,
  }: {
    surahId: number;
    mushafId: number;
  }) {
    if (!surahId || !mushafId || surahId > 114 || surahId < 1) return [];
    const res = await fetch(
      `https://mp3quran.net/api/v3/ayat_timing?surah=${surahId}&read=${mushafId}`,
    );
    const data = await res.json();
    const verses = quran[String(surahId) as keyof typeof quran];
    const ayat = verses
      .map((v) => {
        const durationApiAyah = data.find((a) => {
          if (data[0].ayah + 1 === verses[0].verse && surahId === 1)
            return a.ayah + 1 === v.verse;
          return a.ayah === v.verse;
        });
        const ayah: Ayah = {
          verse: v.verse,
          start: durationApiAyah?.start_time,
          end: durationApiAyah?.end_time,
          text: v.text,
        };
        return ayah;
      })
      .filter((a) => a.start !== undefined && a.end !== undefined);
    setAyat(ayat);
  }

  // player state
  const [currentSurah, setCurrentSurah] = createSignal(0);
  const [currentReader, setCurrentReader] = createSignal(0);
  const [ayat, setAyat] = createSignal<Ayah[]>([]);
  const [currentAyah, setCurrentAyah] = createSignal<Ayah | null>(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isRepeat, setIsRepeat] = createSignal(false);
  const [isShuffle, setIsShuffle] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [elapsed, setElapsed] = createSignal(0);
  const [totalTime, setTotalTime] = createSignal(0);
  const [drawerOpen, setDrawerOpen] = createSignal<"surahs" | "readers" | null>(
    null,
  );
  const [surahFilter, setSurahFilter] = createSignal("");
  const [readerFilter, setReaderFilter] = createSignal("");
  const [showDonate, setShowDonate] = createSignal(false);
  const [donateAmount, setDonateAmount] = createSignal("");
  const [copied, setCopied] = createSignal(false);
const [menuOpen, setMenuOpen] = createSignal(false);
  const PHONE = "01148048224";

  // derived
  const filteredSurahs = () =>
    surahs.filter((s) => s.name.includes(surahFilter())) ?? [];
  const filteredReaders = () =>
    readers.filter((r) => r.name.includes(readerFilter())) ?? [];
  const currentSurahName = () => surahs[currentSurah()]?.name ?? "";
  const currentReaderName = () => readers[currentReader()]?.name ?? "";

  function handlePlay() {
    setIsPlaying(true);
  }

  function handlePause() {
    setIsPlaying(false);
  }

  function handleLoadMetaData() {
    setTotalTime(Math.round(audio.duration));
  }

  function handleTimeUpdate() {
    const timeMs = audio.currentTime * 1000;
    setElapsed(Math.round(audio.currentTime));
    if (!ayat()) return;
    const ayah = ayat()?.find((a) => a.start < timeMs && a.end > timeMs);
    setCurrentAyah(ayah || null);
  }

  function handleEnded() {
    const last = surahs.length - 1;
    if (isRepeat()) {
      playSurah(currentSurah());
      return;
    }
    if (isShuffle()) {
      playSurah(Math.round(Math.random() * last));
      return;
    }
    if (currentSurah() < last) selectSurah(currentSurah() + 1);
  }

  // ── Audio ────────────────────────────────────────────────────────────
  let audio!: HTMLAudioElement;
  onMount(() => {
    audio = new Audio();
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("loadedmetadata", handleLoadMetaData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
  });

  onCleanup(() => {
    if (!audio) return;
    audio.removeEventListener("play", handlePlay);
    audio.removeEventListener("pause", handlePause);
    audio.removeEventListener("loadedmetadata", handleLoadMetaData);
    audio.removeEventListener("timeupdate", handleTimeUpdate);
    audio.removeEventListener("ended", handleEnded);
    audio.pause();
    audio.src = "";
  });

  function copyPhone() {
    navigator.clipboard.writeText(PHONE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Actions ──────────────────────────────────────────────────────────
  function playSurah(index: number) {
    setIsLoading(true);
    if (isRepeat() && currentSurah() === index) {
      audio.currentTime = 0;
      audio.play().finally(() => setIsLoading(false));
      return;
    }
    setCurrentSurah(index);
    const s = surahs[index];
    const r = readers[currentReader()];
    if (!s || !r) return;
    fetchAyat({ surahId: s.id, mushafId: r.mushafId }).then(() => {
      audio.src = r.server + String(s.id).padStart(3, "0") + ".mp3";
      audio.play().finally(() => setIsLoading(false));
    }).finally(() => setIsLoading(false));
  }

  function toArabicDigits(ayah: Ayah) {
    return new Intl.NumberFormat("ar-EG").format(ayah.verse);
  }

  function selectSurah(i: number) {
    if (isLoading()) return;
    setElapsed(0);
    setDrawerOpen(null);
    playSurah(i);
  }

  function selectReader(i: number) {
    setCurrentReader(i);
    if (window.innerWidth <= 900) setDrawerOpen(null);
    selectSurah(currentSurah());
  }

  function togglePlay() {
    if (!audio.src) {
      playSurah(currentSurah() || 0);
      return;
    }
    isPlaying() ? audio.pause() : audio.play();
  }

  function prevSurah() {
    if (currentSurah() <= 0) return;
    selectSurah(currentSurah() - 1);
  }

  function nextSurah() {
    if (currentSurah() >= (surahs.length ?? 1) - 1) return;
    selectSurah(currentSurah() + 1);
  }

  function handleRangeInput(e: InputEvent) {
    const el = e.target as HTMLInputElement;
    audio.currentTime = Number(el.value);
    setElapsed(Math.round(audio.currentTime));
  }

  function toggleShuffle() {
    setIsShuffle((v) => !v);
    if (isShuffle()) setIsRepeat(false);
  }

  function toggleRepeat() {
    setIsRepeat((v) => !v);
    if (isRepeat()) setIsShuffle(false);
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  function fmt(s: number) {
    return (
      Math.floor(s / 3600) +
      ":" +
      String(Math.floor((s % 3600) / 60)).padStart(2, "0") +
      ":" +
      String(s % 60).padStart(2, "0")
    );
  }
  // ── JSX ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div
        class={`overlay ${drawerOpen() ? "show" : ""}`}
        onClick={() => setDrawerOpen(null)}
      />

      {/* Drawer: Surahs */}
      <div
        class={`drawer left-side ${drawerOpen() === "surahs" ? "open" : ""}`}
      >
        <div class="sidebar-header">
          <div class="icon">📖</div>
          <h2>السور</h2>
        </div>
        <div class="search-wrap">
          <input
            type="text"
            placeholder="ابحث عن سورة..."
            onInput={(e) => setSurahFilter(e.currentTarget.value)}
          />
        </div>
        <div class="list-scroll">
          <For each={filteredSurahs()}>
            {(s, i) => (
              <div
                class={`list-item ${s.id === surahs[currentSurah()]?.id ? "active" : ""}`}
                onClick={() => selectSurah(surahs.indexOf(s))}
              >
                <span class="num">{s.id}</span>
                <span>{s.name}</span>
                <span class="dot" />
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Drawer: Readers */}
      <div
        class={`drawer right-side ${drawerOpen() === "readers" ? "open" : ""}`}
      >
        <div class="sidebar-header">
          <div class="icon">🎙</div>
          <h2>القراء</h2>
        </div>
        <div class="search-wrap">
          <input
            type="text"
            placeholder="ابحث عن قارئ..."
            onInput={(e) => setReaderFilter(e.currentTarget.value)}
          />
        </div>
        <div class="list-scroll">
          <For each={filteredReaders()}>
            {(r, i) => (
              <div
                class={`list-item ${r.readerId === readers[currentReader()]?.readerId ? "active" : ""}`}
                onClick={() => selectReader(readers.indexOf(r))}
              >
                <span class="num">{i() + 1}</span>
                <span>{r.name}</span>
                <span class="dot" />
              </div>
            )}
          </For>
        </div>
      </div>

      {/* App grid */}
      <div class="app">
        {/* Sidebar: Surahs */}
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="icon">📖</div>
            <h2>السور</h2>
          </div>
          <div class="search-wrap">
            <input
              type="text"
              placeholder="ابحث عن سورة..."
              onInput={(e) => setSurahFilter(e.currentTarget.value)}
            />
          </div>
          <div class="list-scroll">
            <For each={filteredSurahs()}>
              {(s, i) => (
                <div
                  class={`list-item ${s.id === surahs[currentSurah()]?.id ? "active" : ""}`}
                  onClick={() => selectSurah(surahs.indexOf(s))}
                >
                  <span class="num">{s.id}</span>
                  <span>{s.name}</span>
                  <span class="dot" />
                </div>
              )}
            </For>
          </div>
        </aside>

        {/* Sidebar: Readers */}
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="icon">🎙</div>
            <h2>القراء</h2>
          </div>
          <div class="search-wrap">
            <input
              type="text"
              placeholder="ابحث عن قارئ..."
              onInput={(e) => setReaderFilter(e.currentTarget.value)}
            />
          </div>
          <div class="list-scroll">
            <For each={filteredReaders()}>
              {(r, i) => (
                <div
                  class={`list-item ${r.readerId === readers[currentReader()]?.readerId ? "active" : ""}`}
                  onClick={() => selectReader(readers.indexOf(r))}
                >
                  <span class="num">{i() + 1}</span>
                  <span>{r.name}</span>
                  <span class="dot" />
                </div>
              )}
            </For>
          </div>
        </aside>

        {/* Player */}
        <main class="player-area">
          <div
            class={`donate-overlay ${showDonate() ? "show" : ""}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowDonate(false);
            }}
          >
            <div class="donate-modal">
              <button class="donate-close" onClick={() => setShowDonate(false)}>
                ✕
              </button>

              <div class="donate-title">ادعم مُرتّل</div>
              <div class="donate-desc">
                لو مُرتّل نفعك، مبلغ صغير بيساعد في الاستمرار
                <br />
                وبيكون في ميزان حسناتك إن شاء الله
              </div>

              <button
                class={`donate-btn ${copied() ? "copied" : ""}`}
                onClick={copyPhone}
              >
                {copied() ? "✓ اتنسخ!" : `انسخ الرقم — ${PHONE}`}
              </button>

              <div class="donate-note">
                {copied()
                  ? "افتح InstaPay أو فودافون كاش وحول على الرقم ده"
                  : "بيقبل InstaPay وفودافون كاش"}
              </div>
            </div>
          </div>
          <div class="geo-pattern" />
          {/* Mobile bar */}
          <div class="mobile-bar">
  <span class="logo">مُرتّل</span>
  <div class="mobile-menu-wrapper">
    <button
      class={`menu-btn ${menuOpen() ? "open" : ""}`}
      onClick={() => setMenuOpen((v) => !v)}
    >
      <div class="hamburger">
        <span /><span /><span />
      </div>
      القائمة
    </button>

    <div class={`dropdown ${menuOpen() ? "show" : ""}`}>
      <div
        class="menu-item"
        onClick={() => { setDrawerOpen("surahs"); setMenuOpen(false); }}
      >
        <div class="item-icon">📖</div>
        <span>السور</span>
      </div>

      <div
        class="menu-item"
        onClick={() => { setDrawerOpen("readers"); setMenuOpen(false); }}
      >
        <div class="item-icon">🎙</div>
        <span>القراء</span>
      </div>

      <div class="menu-divider" />

      <a
        class="menu-item"
        href="https://github.com/Eyadhakim/murattel/releases/download/MurattelV1.1/Murattel.apk"
        download="Murattel.apk"
        rel="noopener noreferrer"
        target="_blank"
        onClick={() => setMenuOpen(false)}
      >
        <div class="item-icon">📲</div>
        <span>حمل التطبيق</span>
      </a>

      <div class="menu-divider" />

      <div
        class="menu-item donate"
        onClick={() => { setShowDonate(true); setMenuOpen(false); }}
      >
        <div class="item-icon">🤲</div>
        <span>ادعم مُرتّل</span>
      </div>
    </div>
  </div>
</div>

          <button class="btn-donate" onClick={() => setShowDonate(true)}>
            ادعم مُرتّل
          </button>

          {/* Now playing */}currentReader
          <div class="now-playing">
            <div class="surah-name">
              {currentSurahName() ? `سورة ${currentSurahName()}` : "اختر سورة"}
            </div>
            <div class="reader-name">{currentReaderName() || "اختر قارئ"}</div>
          </div>

          {/* Medallion */}
          <div class="medallion-wrap">
            <div class={`medallion ${isPlaying() ? "playing" : ""}`}>☽</div>
          </div>

          <div class="ayah-section">
            <div class="ayah-box">
              <div class="ayah-tag">الآية الحالية</div>
              <div class="ayah-text" id="ayahText">
                <Switch>
                  <Match when={currentAyah()}>{currentAyah()?.text}</Match>
                  <Match when={!currentAyah() && ayat().length !== 0}>
                    بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                  </Match>
                  <Match when={ayat().length === 0}>
                    ------------------------------
                  </Match>
                </Switch>
                <Show when={currentAyah()}>
                  <span class="ayah-num">{toArabicDigits(currentAyah()!)}</span>
                </Show>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div class="progress-section">
            <div class="time-row">
              <span>{fmt(elapsed())}</span>
              <span>{fmt(totalTime())}</span>
            </div>
            <input
              type="range"
              min="0"
              max={totalTime()}
              value={elapsed()}
              class="progress-bar"
              onInput={handleRangeInput}
            />
          </div>

          {/* Controls */}
          <div class="controls">
            <button
              class="ctrl-btn sm"
              style={{ color: isShuffle() ? "var(--gold)" : "" }}
              onClick={toggleShuffle}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
              </svg>
            </button>

            <button
              class="ctrl-btn md"
              onClick={prevSurah}
              disabled={currentSurah() === 0}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>

            <button
              class={`play-btn ${isPlaying() ? "playing" : ""}`}
              onClick={togglePlay}
              disabled={isLoading()}
            >
              <Switch>
                <Match when={isLoading()}>
                  <span class="spinner"></span>
                </Match>
                <Match when={!isPlaying() && !isLoading()}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </Match>
                <Match when={isPlaying() && !isLoading()}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                </Match>
              </Switch>
            </button>

            <button
              class="ctrl-btn md"
              onClick={nextSurah}
              disabled={currentSurah() === 113}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>

            <button
              class="ctrl-btn sm"
              style={{ color: isRepeat() ? "var(--gold)" : "" }}
              onClick={toggleRepeat}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
