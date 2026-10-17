/* Braille Quiz — learn to read Braille, one row of the alphabet at a time. */
(() => {
  "use strict";

  // Dot numbers per letter (left column 1-2-3, right column 4-5-6).
  const BRAILLE = {
    a: "1", b: "12", c: "14", d: "145", e: "15", f: "124", g: "1245", h: "125", i: "24", j: "245",
    k: "13", l: "123", m: "134", n: "1345", o: "135", p: "1234", q: "12345", r: "1235", s: "234", t: "2345",
    u: "136", v: "1236", w: "2456", x: "1346", y: "13456", z: "1356",
  };
  const AJ = "abcdefghij", KT = "klmnopqrst", UZ = "uvwxyz";
  // Row 3 lines up under row 1: u=a, v=b, x=c, y=d, z=e … and w=j (+ dot 6).
  const ROW3 = { a: "u", b: "v", c: "x", d: "y", e: "z", j: "w" };

  const LEVELS = [
    { id: 1, range: "a – j", letters: AJ, fresh: AJ, cheat: true },
    { id: 2, range: "a – j", letters: AJ, fresh: AJ, cheat: false },
    { id: 3, range: "a – t", letters: AJ + KT, fresh: KT, cheat: true },
    { id: 4, range: "a – t", letters: AJ + KT, fresh: KT, cheat: false },
    { id: 5, range: "a – z", letters: AJ + KT + UZ, fresh: UZ, cheat: true },
    { id: 6, range: "a – z", letters: AJ + KT + UZ, fresh: UZ, cheat: false },
  ];
  const ROUND = 10;
  const PENALTY = { skip: 10000, peek: 5000 };
  const STORE = "braille-quiz-best";

  const $ = (s) => document.querySelector(s);
  const pool = (lvl) =>
    [...new Set(window.BRAILLE_WORDS)].filter(
      (w) => [...w].every((c) => lvl.letters.includes(c)) && [...w].some((c) => lvl.fresh.includes(c))
    );

  // ---------- storage (best scores) ----------
  function loadBest() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
  }
  function saveBest(b) {
    try { localStorage.setItem(STORE, JSON.stringify(b)); } catch { /* private mode */ }
  }

  // ---------- rendering helpers ----------
  const fmt = (ms) => {
    const s = ms / 1000;
    if (s < 60) return s.toFixed(1) + "s";
    const m = Math.floor(s / 60);
    return m + ":" + (s - m * 60).toFixed(1).padStart(4, "0");
  };

  // A Braille cell. `extra` = dots to highlight (the ones added to row 1).
  function cell(ch, extra = "") {
    const dots = BRAILLE[ch] || "";
    let h = '<span class="cell" aria-hidden="true">';
    for (const d of "142536") {
      const on = dots.includes(d);
      h += `<i class="dot${on ? " on" : ""}${on && extra.includes(d) ? " extra" : ""}"></i>`;
    }
    return h + "</span>";
  }
  const extraDots = (ch, base) => [...BRAILLE[ch]].filter((d) => !BRAILLE[base].includes(d)).join("");

  // Cheat sheet: rows aligned so the pattern (row 1 + dot 3, + dots 3 & 6) is visible.
  function cheatSheet(letters) {
    const rows = [];
    const item = (ch, base) =>
      ch ? `<div class="cs-item">${cell(ch, base ? extraDots(ch, base) : "")}<b>${ch}</b></div>`
         : '<div class="cs-item empty"></div>';
    rows.push({ label: "a – j", html: [...AJ].map((c) => item(c)).join("") });
    if (letters.includes("k"))
      rows.push({ label: "+ dot 3", html: [...KT].map((c, i) => item(c, AJ[i])).join("") });
    if (letters.includes("u"))
      rows.push({ label: "+ dots 3 & 6", html: [...AJ].map((b) => item(ROW3[b], ROW3[b] && b)).join("") });
    return (
      '<div class="cs">' +
      rows.map((r) => `<div class="cs-row"><span class="cs-label">${r.label}</span><div class="cs-cells">${r.html}</div></div>`).join("") +
      "</div>"
    );
  }

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
  }

  // ---------- home ----------
  function renderHome() {
    const best = loadBest();
    const myName = loadName() || "braille";
    const zero = `<button class="level level-zero" data-id="0">
        <span class="lv-num">Level 0</span>
        <span class="lv-range">Your name in Braille</span>
        <span class="lv-preview">${[...myName.toLowerCase()].filter((c) => BRAILLE[c]).slice(0, 6).map((c) => cell(c)).join("")}</span>
        <span class="lv-mode">See how your name is written — no timer</span>
      </button>`;
    $("#levels").innerHTML = zero + LEVELS.map((l) => {
      const b = best[l.id];
      const preview = [...l.fresh.slice(0, 3)].map((c) => cell(c)).join("");
      return `<button class="level${l.cheat ? "" : " hard"}" data-id="${l.id}">
        <span class="lv-num">Level ${l.id}</span>
        <span class="lv-range">${l.range}</span>
        <span class="lv-preview">${preview}</span>
        <span class="lv-mode">${l.cheat ? "With cheat sheet" : "No cheat sheet"}</span>
        <span class="lv-best">${b ? "Best " + fmt(b.score) : pool(l).length + " words"}</span>
      </button>`;
    }).join("");
    $("#alphabet").innerHTML = cheatSheet(AJ + KT + UZ);
    show("home");
  }
  $("#levels").addEventListener("click", (e) => {
    const btn = e.target.closest(".level");
    if (!btn) return;
    if (btn.dataset.id === "0") return openName();
    start(LEVELS.find((l) => l.id === +btn.dataset.id));
  });

  // ---------- level 0: your name in Braille ----------
  const NAME_KEY = "braille-quiz-name";
  function loadName() {
    try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; }
  }
  const nameInput = $("#name-input");
  function renderName() {
    const v = nameInput.value;
    try { localStorage.setItem(NAME_KEY, v); } catch { /* private mode */ }
    const words = v.toLowerCase().split(/\s+/).filter(Boolean);
    $("#name-braille").innerHTML = words.length
      ? words.map((w) =>
          '<div class="nb-word">' +
          [...w].map((c) => BRAILLE[c]
              ? `<div class="nb-letter">${cell(c)}<b>${c}</b><small>${[...BRAILLE[c]].join("-")}</small></div>`
              : `<div class="nb-letter skip"><span class="nb-other">${c}</span><b>&nbsp;</b><small>not a–z</small></div>`
          ).join("") + "</div>"
        ).join("")
      : '<p class="muted">Your name will appear here.</p>';
  }
  function openName() {
    nameInput.value = loadName();
    renderName();
    show("name");
    nameInput.focus();
  }
  nameInput.addEventListener("input", renderName);
  $("#name .back").addEventListener("click", renderHome);
  $("#name-start").addEventListener("click", () => start(LEVELS[0]));

  // ---------- game ----------
  let G = null, raf = 0, pending = 0;
  const input = $("#guess");

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function start(level) {
    clearTimeout(pending);
    const words = shuffle(pool(level)).slice(0, ROUND);
    G = { level, words, i: 0, mistakes: 0, skips: 0, peeks: 0, penalty: 0, log: [], start: performance.now(), wordStart: 0, busy: false, peeked: false };
    $("#g-level").textContent = `Level ${level.id} · ${level.range}${level.cheat ? "" : " · no cheat sheet"}`;
    $("#cheat").innerHTML = cheatSheet(level.letters);
    $("#peek").hidden = level.cheat;
    show("game");
    nextWord();
    cancelAnimationFrame(raf);
    tick();
  }

  function nextWord() {
    if (!G) return;
    if (G.i >= G.words.length) return finish();
    const w = G.words[G.i];
    $("#word").innerHTML = [...w].map((c) => cell(c)).join("");
    $("#word").className = "word";
    $("#word").setAttribute("aria-label", `Braille word, ${w.length} letters`);
    $("#answer").textContent = "";
    $("#answer").className = "answer";
    $("#cheat").classList.toggle("open", G.level.cheat);
    $("#peek").disabled = false;
    G.peeked = false;
    G.busy = false;
    G.wordStart = performance.now();
    input.value = "";
    input.disabled = false;
    input.focus();
    updateStats();
  }

  function updateStats() {
    $("#g-progress").textContent = `${Math.min(G.i + 1, G.words.length)} / ${G.words.length}`;
    $("#g-mistakes").textContent = G.mistakes ? `✕ ${G.mistakes}` : "";
  }

  function tick() {
    if (!G) return;
    const now = performance.now();
    $("#timer").textContent = fmt(now - G.start + G.penalty);
    $("#word-timer").textContent = G.busy ? "" : "this word " + fmt(now - G.wordStart);
    raf = requestAnimationFrame(tick);
  }

  function endWord(result) {
    G.busy = true;
    const w = G.words[G.i];
    G.log.push({ word: w, ms: performance.now() - G.wordStart, result });
    input.disabled = true;
    $("#answer").textContent = w;
    $("#answer").className = "answer show " + result;
    $("#word").classList.add(result);
    G.i++;
    pending = setTimeout(nextWord, result === "ok" ? 550 : 1400);
  }

  input.addEventListener("input", () => {
    if (!G || G.busy) return;
    if (input.value.trim().toLowerCase() === G.words[G.i]) endWord("ok");
  });
  $("#guess-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!G || G.busy) return;
    const v = input.value.trim().toLowerCase();
    if (!v) return;
    if (v === G.words[G.i]) return endWord("ok");
    G.mistakes++;
    updateStats();
    const b = $(".board");
    b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
    input.select();
  });
  $("#skip").addEventListener("click", () => {
    if (!G || G.busy) return;
    G.skips++;
    G.penalty += PENALTY.skip;
    endWord("skip");
  });
  $("#peek").addEventListener("click", () => {
    if (!G || G.busy || G.peeked) return;
    G.peeked = true;
    G.peeks++;
    G.penalty += PENALTY.peek;
    $("#cheat").classList.add("open");
    $("#peek").disabled = true;
    input.focus();
  });
  $("#quit").addEventListener("click", quit);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if ($("#game").classList.contains("active")) quit();
    else if ($("#name").classList.contains("active")) renderHome();
  });
  function quit() {
    clearTimeout(pending);
    G = null;
    cancelAnimationFrame(raf);
    renderHome();
  }

  // ---------- results ----------
  function finish() {
    cancelAnimationFrame(raf);
    const time = performance.now() - G.start;
    const score = time + G.penalty;
    const best = loadBest();
    const prev = best[G.level.id];
    const record = !prev || score < prev.score;
    if (record) { best[G.level.id] = { score, date: new Date().toISOString() }; saveBest(best); }

    $("#r-title").textContent = `Level ${G.level.id} complete`;
    $("#r-score").textContent = fmt(score);
    $("#r-best").innerHTML = record
      ? (prev ? `<span class="record">New best!</span> (was ${fmt(prev.score)})` : `<span class="record">First best time</span>`)
      : `Best: ${fmt(prev.score)}`;
    const okWords = G.log.filter((l) => l.result === "ok");
    $("#r-grid").innerHTML = [
      ["Time", fmt(time)],
      ["Penalties", G.penalty ? "+" + fmt(G.penalty) : "—"],
      ["Per word", fmt(time / G.log.length)],
      ["Correct", `${okWords.length} / ${G.log.length}`],
      ["Wrong guesses", G.mistakes],
      ["Skips / peeks", `${G.skips} / ${G.peeks}`],
    ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("");
    $("#r-words").innerHTML = G.log
      .map((l) => `<li class="${l.result}"><span class="rw-cells">${[...l.word].map((c) => cell(c)).join("")}</span><span class="rw-word">${l.word}</span><span class="rw-time">${l.result === "skip" ? "skipped" : fmt(l.ms)}</span></li>`)
      .join("");
    const next = LEVELS.find((l) => l.id === G.level.id + 1);
    $("#r-next").hidden = !next;
    const level = G.level;
    $("#r-retry").onclick = () => start(level);
    $("#r-next").onclick = () => next && start(next);
    G = null;
    show("results");
  }
  $("#r-home").addEventListener("click", renderHome);

  renderHome();
})();
