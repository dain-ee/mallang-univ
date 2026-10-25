/* 말랑대학 — 고1 정윤 대시보드 (숙제 · 오답 · 성적 · 생기부 · 입시 소식)
   기록은 서버(univ_get/univ_put)에 학생 이름으로 저장하고, 이 기기에도 같이 둡니다.
   화면 결은 토스 앱: 회색 바탕 · 흰 카드 · 파랑 하나. 화면 글자에 줄표를 쓰지 않습니다. */
(() => {
  const U = window.UNIV, D = U.data || {};
  const TEACHER = U.role === 'teacher' || U.role === 'admin';
  const KEY = 'mallang-univ:state:' + U.who;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tap = { el: null, at: 0 };  // 마지막으로 누른 것 (뒤로 가기 방향 · 고른 칸 톡 튀기)
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IC = { home: '1f3e0', hw: '1f4dd', wrong: '1f4d2', score: '1f4ca', sgb: '1f4cb', target: '1f3af', sci: '1f9ea', eng: '1f4d6', fire: '1f525', x: '274c', ok: '2705', up: '1f4c8', down: '1f4c9', star: '2b50', trophy: '1f3c6', cal: '1f4c5', retry: '1f501', bulb: '1f4a1', school: '1f3eb', grad: '1f393', ghost: '1f47b', party: '1f389', pin: '1f4cc', compass: '1f9ed', muscle: '1f4aa', brain: '1f9e0', clock: '23f0', hundred: '1f4af', think: '1f914', spark: '2728', mic: '1f3a4', books: '1f4da', pencil: '270f', write: '270d', dna: '1f9ec', pill: '1f48a', news: '1f4f0', bell: '1f514', mega: '1f4e2', memo: '1f5d2', flag: '1f6a9', q: '2753', globe: '1f30f', math: '1f4d0', abacus: '1f9ee', bank: '1f3db', run: '1f3c3', heart: '1f499', medal: '1f3c5', eyes: '1f440', scroll: '1f4dc', tomato: '1f345', gold: '1f947', coffee: '2615', timer: '23f1', glow: '1f31f', herb: '1f33f', leaf: '1f343', headph: '1f3a7', piano: '1f3b9', violin: '1f3bb', sax: '1f3b7', rain: '1f327', wave: '1f30a', coin: '1f4b0', bag: '1f4b0', gift: '1f381', cash: '1f4b5' };
  const ic = (k, cls = 'ic') => `<img class="${cls}" src="icons/${IC[k] || k}.svg" alt="">`;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const md = (s) => { const [, m, d] = String(s).split('-').map(Number); return `${m}월 ${d}일`; };
  const dday = (s) => Math.ceil((new Date(s + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 864e5);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const isWeekend = (d = new Date()) => d.getDay() === 0 || d.getDay() === 6;
  // 숙제 요일: 과제마다 요일을 골라요 (0=일 … 6=토). 기본은 평일 매일
  const PLAN_KINDS = [{ k: 'sci', t: '오늘의 과학' }, { k: 'unit', t: '천일문 유닛' }, { k: 'words', t: '워드마스터 단어 시험' }, { k: 'g3', t: '고3 영어 하루 한 문제' }];
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const planOf = (k) => { const p = (S.plan || {})[k]; return Array.isArray(p) ? p : [1, 2, 3, 4, 5]; };
  const onDay = (k, d = new Date()) => planOf(k).includes(d.getDay());
  const anyEng = (d) => ['unit', 'words', 'g3'].some((k) => onDay(k, d));
  const anyTask = (d) => PLAN_KINDS.some((x) => onDay(x.k, d));
  // 선생님 숙제는 날짜가 된 것만 오늘 할 일에 보여요 (하루 한 개씩)
  // 오답 숙제는 거기 든 문제를 다 다시 풀면(맞혔든 또 틀렸든) 끝난 걸로 봐요
  const hwWr = (h) => (h.wr || []).filter((id) => S.wrong && S.wrong[id]);
  const wrTried = (h, id) => { const w = S.wrong[id]; return w.cleared || (w.at || 0) > (h.at || 0); };
  const hwDone = (h) => !!h.done || (hwWr(h).length > 0 && hwWr(h).every((id) => wrTried(h, id)));
  // 오늘 풀 오답: 오늘까지 낸 오답 숙제에서 아직 안 푼 것만 (전체 개수는 보여 주지 않아요)
  const todayWr = () => { const out = []; for (const h of (S.hw || []).filter((x) => !x.done && (!x.due || x.due <= today()))) for (const id of hwWr(h)) if (!wrTried(h, id) && !out.includes(id)) out.push(id); return out; };
  const hwNow = () => (S.hw || []).filter((h) => !hwDone(h) && (!h.due || h.due <= today()));
  const rich = (t) => esc(t).replace(/&lt;(\/?)(b|u|i|em|strong)&gt;/g, '<$1$2>').replace(/&lt;br\s*\/?&gt;/g, '<br>');
  const fmt1 = (x) => (x == null || isNaN(x) ? '-' : (Math.round(x * 10) / 10).toFixed(1));

  // ───────── 과목 · 대학 기본값 (내용 파일이 없을 때도 화면이 서게) ─────────
  const MOCK_SUBJ = [
    { key: 'kor', name: '국어', total: 100, abs: null },
    { key: 'math', name: '수학', total: 100, abs: null },
    { key: 'eng', name: '영어', total: 100, abs: [90, 80, 70, 60, 50, 40, 30, 20] },
    { key: 'hist', name: '한국사', total: 50, abs: [40, 35, 30, 25, 20, 15, 10, 5] },
    { key: 'soc', name: '통합사회', total: 50, abs: null },
    { key: 'sci', name: '통합과학', total: 50, abs: null },
  ];
  const SUBJ_COLOR = { kor: '#3182f6', math: '#f04452', eng: '#03b26c', hist: '#8b95a1', soc: '#ffb331', sci: '#a234c7' };
  const UNIS = D.unis && D.unis.length ? D.unis : [
    { id: 'snu', name: '서울대학교', short: '서울대', color: '#0f0f70', pharm: true },
    { id: 'yonsei', name: '연세대학교', short: '연세대', color: '#003876', pharm: true },
    { id: 'korea', name: '고려대학교', short: '고려대', color: '#8b0029', pharm: true },
    { id: 'skku', name: '성균관대학교', short: '성균관대', color: '#6aab2e', pharm: true },
    { id: 'hanyang', name: '한양대학교', short: '한양대', color: '#0e4a84', pharm: true },
    { id: 'ewha', name: '이화여자대학교', short: '이화여대', color: '#00462a', pharm: true },
    { id: 'cau', name: '중앙대학교', short: '중앙대', color: '#2a4fa1', pharm: true },
    { id: 'khu', name: '경희대학교', short: '경희대', color: '#8f1d2c', pharm: true },
    { id: 'sookmyung', name: '숙명여자대학교', short: '숙명여대', color: '#004f9f', pharm: true },
    { id: 'duksung', name: '덕성여자대학교', short: '덕성여대', color: '#8a1538', pharm: true },
    { id: 'dongduk', name: '동덕여자대학교', short: '동덕여대', color: '#5a2a82', pharm: true },
    { id: 'sahmyook', name: '삼육대학교', short: '삼육대', color: '#00539c', pharm: true },
  ];
  const uniOf = (id) => UNIS.find((u) => u.id === id) || null;
  const emb = (u, size = '') => !u ? `<span class="emb ${size}" style="background:var(--t4)">?</span>`
    : u.logo ? `<span class="emb ${size}"><img src="${esc(u.logo)}" alt=""></span>`
    : `<span class="emb ${size}" style="background:${esc(u.color)}">${esc((u.short || u.name).replace(/대학교|대$/, '').slice(0, 3))}</span>`;

  // ───────── 상태 ─────────
  const blank = () => ({ profile: { name: U.who, school: (D.school && D.school.name) || '경화여자고등학교', grade: 1, cls: '', uni: '', major: '생명공학과', goalMock: 2, goalNaesin: 2 }, mock: {}, mockManual: [], naesin: {}, sci: { days: {} }, eng: { unit: 0, wordDay: 0, days: {} }, wrong: {}, hw: [], sgb: [], pomo: { days: {}, goal: 4 }, wallet: { log: [], paid: [], req: null, seen: {} }, book: { marks: {}, seen: {}, pin: {}, last: {} }, _at: {} });
  let S = blank();
  try { const l = JSON.parse(localStorage.getItem(KEY)); if (l) S = Object.assign(blank(), l); } catch (e) {}
  const UI = { tab: 'home', view: null, scoreSeg: 'mock', mockId: null, mockSubj: 'kor', wrongSubj: 'all', chartSubj: 'avg', run: null, sgbArea: 'all', semester: '1-2', newsAll: false };
  let pushT = null;
  function save(...keys) {
    const now = Date.now(); S._at = S._at || {}; for (const k of keys) S._at[k] = now;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    clearTimeout(pushT); pushT = setTimeout(() => { pushT = null; sync(); }, 1200);
  }
  async function rpc(fn, body) {
    if (localStorage.getItem('mu:offline') === '1') throw new Error('offline test');  // 테스트: 서버를 건드리지 않아요
    const r = await fetch(`${U.sync.url}/rest/v1/rpc/${fn}`, { method: 'POST', keepalive: true, headers: { apikey: U.sync.key, Authorization: `Bearer ${U.sync.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(fn + ' ' + r.status);
    const t = await r.text(); return t ? JSON.parse(t) : null;
  }
  let syncing = false;
  // 저장 상태 표시 (내신 입력처럼 저장 단추가 없는 곳)
  const saveSt = { at: 0, off: false, wait: false };
  const saveStText = () => saveSt.wait ? '저장하는 중' : saveSt.off ? '인터넷이 안 돼 이 기기에만 저장했어요' : saveSt.at ? `저장됐어요 · ${String(new Date(saveSt.at).getHours()).padStart(2, '0')}:${String(new Date(saveSt.at).getMinutes()).padStart(2, '0')}` : '적으면 바로 저장돼요';
  function paintSaveSt() { if (!saveSt.off && saveSt.at) saveSt.wait = false; $$('[data-savest]').forEach((x) => { x.textContent = saveStText(); x.classList.toggle('ok', !saveSt.wait && !saveSt.off && !!saveSt.at); x.classList.toggle('off', saveSt.off); }); }
  // 화면을 닫거나 다른 앱으로 넘어가면 기다리던 저장을 바로 보냄
  const flush = () => { if (pushT) { clearTimeout(pushT); pushT = null; sync(); } };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  async function sync(redraw) {
    if (syncing) { clearTimeout(pushT); pushT = setTimeout(sync, 1500); return; }
    syncing = true;
    try {
      const remote = await rpc('univ_get', { p_student: U.who, p_code: U.key });
      let changed = false;
      if (remote && remote._at) {
        for (const k of Object.keys(remote._at)) if ((remote._at[k] || 0) > ((S._at || {})[k] || 0)) { S[k] = remote[k]; S._at[k] = remote._at[k]; changed = true; }
      }
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
      await rpc('univ_put', { p_student: U.who, p_code: U.key, p_data: S });
      saveSt.at = Date.now(); saveSt.off = false; paintSaveSt();
      if (changed && redraw) render();
    } catch (e) { /* 연결이 안 되면 이 기기에만 저장하고, 다음에 다시 맞춤 */ saveSt.off = true; saveSt.wait = false; paintSaveSt(); }
    syncing = false;
  }

  // ───────── 계산 ─────────
  const MOCKS = (D.mocks || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const mockSubj = (m, key) => (m.subjects || []).find((s) => s.key === key);
  const subjInfo = (key) => MOCK_SUBJ.find((s) => s.key === key) || { key, name: key, total: 100 };
  function gradeFrom(subj, raw, cuts) {
    const c = (cuts && cuts.length ? cuts : subjInfo(subj).abs) || null;
    if (!c || raw == null) return null;
    for (let i = 0; i < c.length; i++) if (raw >= c[i]) return i + 1;
    return 9;
  }
  function mockResult(m, key) {
    const r = ((S.mock[m.id] || {})[key]) || null; const ms = mockSubj(m, key);
    if (!r || !r.done || !ms) return null;
    const wrong = new Set(r.wrong || []);
    const total = ms.total || subjInfo(key).total;
    const lost = (ms.qs || []).filter((q) => wrong.has(q.no)).reduce((a, q) => a + (q.points || 0), 0);
    const raw = total - lost;
    return { raw, grade: gradeFrom(key, raw, ms.cuts), wrong: [...wrong], total, n: (ms.qs || []).length };
  }
  // 회차별 성적: 문항 채점한 것 + 손으로 넣은 지난 회차
  function examRows() {
    const rows = MOCKS.map((m) => ({ id: m.id, title: m.title, date: m.date, g: Object.fromEntries(MOCK_SUBJ.map((s) => [s.key, (mockResult(m, s.key) || {}).grade || ((S.mockGrades || {})[m.id] || {})[s.key] || null])) }));
    for (const x of S.mockManual || []) rows.push({ id: x.id, title: x.title, date: x.date, g: x.g || {}, manual: true });
    return rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }
  const MAIN = ['kor', 'math', 'eng', 'soc', 'sci'];
  const avgOf = (g, keys = MAIN) => { const v = keys.map((k) => g[k]).filter((x) => x); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const lastMock = () => { const r = examRows().filter((x) => avgOf(x.g) != null); return r[r.length - 1] || null; };
  // 내신 (2022 개정: 5등급)
  const SEMS = ['1-1', '1-2', '2-1', '2-2', '3-1'];
  const NS_SUBJ = (D.school && D.school.subjects && D.school.subjects.length) ? D.school.subjects : [
    { name: '공통국어', credits: 4 }, { name: '공통수학', credits: 4 }, { name: '공통영어', credits: 4 }, { name: '한국사', credits: 3 }, { name: '통합사회', credits: 4 }, { name: '통합과학', credits: 4 }, { name: '과학탐구실험', credits: 1, noGrade: true }, { name: '정보', credits: 2 },
  ];
  const nsSubjects = (sem) => { const [gy, sm] = sem.split('-'); const L = NS_SUBJ.filter((s) => (!s.grade || String(s.grade) === gy) && (!s.semester || String(s.semester) === sm)).filter((s) => s.grade || gy === '1'); const extra = Object.keys(S.naesin[sem] || {}).filter((n) => !L.some((s) => s.name === n)).map((n) => ({ name: n, credits: (S.naesin[sem][n] || {}).credits || 1 })); return [...L, ...extra]; };
  const nsG = (r) => { if (!r) return null; if (+r.grade) return +r.grade; const g = ['midG', 'finG'].map((f) => +r[f]).filter((x) => x > 0); return g.length ? g.reduce((a, b) => a + b, 0) / g.length : null; };
  function nsAvg(sem) {
    let a = 0, c = 0; const rec = S.naesin[sem] || {};
    for (const s of nsSubjects(sem)) { const r = rec[s.name]; const g = nsG(r); if (!g) continue; const cr = +(r.credits || s.credits || 1); a += g * cr; c += cr; }
    return c ? a / c : null;
  }
  function nsTotal() {
    let a = 0, c = 0;
    for (const sem of SEMS) { const rec = S.naesin[sem] || {}; for (const s of nsSubjects(sem)) { const r = rec[s.name]; const g = nsG(r); if (!g) continue; const cr = +(r.credits || s.credits || 1); a += g * cr; c += cr; } }
    return c ? a / c : null;
  }
  // 오답 묶음
  const wrongList = () => Object.entries(S.wrong || {}).map(([id, w]) => ({ id, ...w })).sort((a, b) => (b.at || 0) - (a.at || 0));
  const openWrong = () => wrongList().filter((w) => !w.cleared);
  const SUBJ_NAMES = { kor: '국어', math: '수학', eng: '영어', hist: '한국사', soc: '통합사회', sci: '통합과학' };

  // ───────── 과학 매일 (3~5문제 · 틀리면 더 깊게) ─────────
  const SCI = D.science || { units: [], concepts: [] };
  const conceptOf = (qid) => SCI.concepts.find((c) => (c.base || []).some((q) => q.id === qid) || (c.deep || []).some((q) => q.id === qid));
  const qById = (qid) => { for (const c of SCI.concepts) for (const q of [...(c.base || []), ...(c.deep || [])]) if (q.id === qid) return q; return null; };
  const unitOf = (id) => SCI.units.find((u) => u.id === id) || { title: '' };
  function sciToday(force) {
    const t = today(); S.sci = S.sci || { days: {} }; S.sci.days = S.sci.days || {};
    if (!S.sci.days[t] && SCI.concepts.length && (onDay('sci') || force)) {
      const seen = new Set(Object.values(S.sci.days).filter((d) => d.one).map((d) => d.c));
      const ord = (c) => (c.lesson && c.lesson.order) || 999;
      const exam = SCI.concepts.filter((c) => c.exam).sort((a, b) => ord(a) - ord(b));
      const weak = SCI.concepts.filter((c) => openWrong().some((w) => w.src === 'sci' && w.concept === c.id));
      const c = exam.find((x) => !seen.has(x.id)) || weak[0] || exam.find((x) => (x.base || []).length) || SCI.concepts[0];
      S.sci.days[t] = { one: true, c: c.id, read: false, list: (c.base || []).map((q) => ({ c: c.id, q: q.id, kind: 'base' })), ans: {} };
      save('sci');
    }
    return S.sci.days[t] || { list: [], ans: {} };
  }
  const dayStat = (d) => { const base = (d.list || []).filter((x) => x.kind === 'base'); const done = base.filter((x) => d.ans[x.q]); return { n: base.length, done: done.length, ok: done.filter((x) => d.ans[x.q].ok).length, all: (d.list || []).length, allDone: (d.list || []).filter((x) => d.ans[x.q]).length }; };

  // ───────── 영어 매일 (천일문 유닛 1개 + 단어 10개 시험) ─────────
  const ENG = D.english || {};
  const CH_UNITS = (ENG.cheonil || []).flatMap((ch) => (ch.units || []).map((u) => ({ ...u, ch: ch.ch, chTitle: ch.title })));
  // 정답이 앞쪽 보기에 몰려 있어서, 문제마다 늘 같은 순서로 섞어 보여 줌
  const seeded = (str) => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
  for (const u of CH_UNITS) (u.questions || []).forEach((q, k) => { if (!q.choices || typeof q.answer !== 'number' || q._mixed || q.choices.every((c) => /^[①②③④⑤]/.test(String(c).trim()))) return; const r = seeded(`${u.ch}-${u.unit}-${k}`); const perm = q.choices.map((_, i) => i); for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; } q.choices = perm.map((i) => q.choices[i]); q.answer = perm.indexOf(q.answer); q._mixed = 1; });
  const WORDS = (ENG.words && ENG.words.days ? ENG.words.days : []).flatMap((d) => (d.words || []).map((w) => ({ ...w, day: d.day })));
  const G3 = (ENG.g3 && ENG.g3.items) || [];
  function engToday(force) {
    const t = today(); S.eng = S.eng || { unit: 0, wordDay: 0, days: {} }; S.eng.days = S.eng.days || {};
    if (!S.eng.days[t] && !anyEng() && !force) return { off: true, unit: S.eng.unit || 0, words: S.eng.wordDay || 0, g3: S.eng.g3 || 0, uans: {}, wans: {} };
    if (!S.eng.days[t]) { S.eng.days[t] = { unit: S.eng.unit || 0, words: S.eng.wordDay || 0, g3: S.eng.g3 || 0, uans: {}, wans: {} }; save('eng'); }
    if (S.eng.days[t].g3 == null) S.eng.days[t].g3 = S.eng.g3 || 0;
    engSkip(t);
    return S.eng.days[t];
  }
  const wordsFor = (k) => WORDS.slice(k * 10, k * 10 + 10);
  // 지난 날 못 한 것은 이어 하지 않고 날짜대로 다음 것으로 넘어가요 (선생님 결정 10/25). 오늘 것을 하나도 안 풀었을 때만 옮겨요
  function engSkip(t) {
    const d = S.eng.days[t], prev = Object.keys(S.eng.days).filter((k) => k < t).map((k) => S.eng.days[k]); let ch = false;
    const top = (f) => Math.max(...prev.map((v) => +v[f] || 0));
    if (!prev.length) return;
    if (!Object.keys(d.wans || {}).length && !d.wdone && prev.some((v) => v.words === d.words) && WORDS.length) { d.words = Math.min(top('words') + 1, Math.ceil(WORDS.length / 10) - 1); S.eng.wordDay = Math.max(S.eng.wordDay || 0, d.words); ch = true; }
    if (!Object.keys(d.uans || {}).length && !d.udone && prev.some((v) => v.unit === d.unit) && CH_UNITS.length) { d.unit = Math.min(top('unit') + 1, CH_UNITS.length - 1); S.eng.unit = Math.max(S.eng.unit || 0, d.unit); ch = true; }
    const g3a = (i) => G3[i] && (S.eng.g3ans || {})[G3[i].id];
    if (!d.g3done && !g3a(d.g3) && prev.some((v) => v.g3 === d.g3) && G3.length) { d.g3 = Math.min(top('g3') + 1, G3.length - 1); S.eng.g3 = Math.max(S.eng.g3 || 0, d.g3); ch = true; }
    if (ch) save('eng');
  }

  // ───────── 공통 조각 ─────────
  function toast(t) { const el = $('#toast'); if (el.classList.contains('on') && !RM()) el.animate([{ scale: 1.06 }, { scale: 1 }], { duration: 260, easing: 'cubic-bezier(.3,1.5,.5,1)' }); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 1800); }
  function ringSVG(frac, color, label, val, unit, cap) {
    const r = 56, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac || 0));
    return `<div class="ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="${r}" fill="none" stroke="var(--fill)" stroke-width="12"/><circle class="ring-arc" cx="66" cy="66" r="${r}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 66 66)"/><text x="66" y="58" text-anchor="middle" style="font-size:13px;font-weight:600;fill:var(--t3)">${esc(label)}</text><text x="66" y="86" text-anchor="middle" style="font-size:26px;font-weight:800;fill:var(--t1)">${esc(val)}<tspan style="font-size:14px;font-weight:700"> ${esc(unit)}</tspan></text></svg><div class="cap">${cap || ''}</div></div>`;
  }
  // 등급 추이 (1등급이 위)
  function lineChart(rows, keys, opt = {}) {
    const W = 640, H = opt.h || 220, P = { l: 32, r: 24, t: 28, b: 32 };
    const maxG = opt.maxG || 9;
    if (!rows.length) return `<div class="empty">${ic('up')}<b>아직 성적이 없어요</b><span>모의고사를 채점하면 여기에 그래프가 생겨요</span></div>`;
    const x = (i) => P.l + (rows.length === 1 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (rows.length - 1));
    const y = (g) => P.t + ((g - 1) * (H - P.t - P.b)) / (maxG - 1);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="등급 추이">`;
    for (let g = 1; g <= maxG; g += (maxG > 5 ? 2 : 1)) s += `<line class="grid-l" x1="${P.l}" x2="${W - P.r}" y1="${y(g)}" y2="${y(g)}"/><text x="${P.l - 10}" y="${y(g) + 4}" text-anchor="end">${g}</text>`;
    rows.forEach((r, i) => { s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(r.label)}</text>`; });
    for (const k of keys) {
      const pts = rows.map((r, i) => (r.v[k.key] != null ? [x(i), y(r.v[k.key]), r.v[k.key]] : null)).filter(Boolean);
      if (!pts.length) continue;
      s += `<path class="ln ${k.dim ? 'dim' : ''}" pathLength="1" stroke"${k.dim ? '' : k.color}" d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}"/>`;
      if (!k.dim) {
        pts.forEach((p) => { s += `<circle class="pt" cx="${p[0]}" cy="${p[1]}" r="6" fill="${k.color}"/>`; });
        const L = pts[pts.length - 1], tx = fmt1(L[2]) + '등급', w = tx.length * 8 + 16;
        s += `<g class="tip"><rect x="${Math.min(W - w, Math.max(0, L[0] - w / 2))}" y="${L[1] - 34}" width="${w}" height="24" rx="12"/><text x="${Math.min(W - w / 2, Math.max(w / 2, L[0]))}" y="${L[1] - 18}" text-anchor="middle">${tx}</text></g>`;
      }
    }
    return s + '</svg>';
  }
  const goalLine = (cur, goal) => cur == null ? '' : cur <= goal ? `<span class="blue">목표 ${goal}등급 달성</span>` : `목표까지 <b class="red">${fmt1(cur - goal)}등급</b>`;

  // ───────── 바텀시트 ─────────
  // 열려 있으면 내용만 옆으로 넘기고(뒤로 가기면 왼쪽에서), 닫을 땐 내려가며 사라져요
  // 시트 위에 시트가 열리면 앞 시트를 쌓아 두고, 맨 위 줄에 「‹ 뒤로」와 닫기(✕)를 늘 붙여요
  function sheet(html, onMount) {
    const root = $('#sheet-root'), old = $('.sheet', root), swap = old && !root.classList.contains('out');
    clearTimeout(closeSheet.t); root.classList.remove('out');
    const tapBack = !!(tap.el && tap.el.closest('[data-back]') && Date.now() - tap.at < 800), goBack = sheet.back || tapBack; sheet.back = false;
    if (!swap) sheet.stack = []; else if (tapBack) sheet.stack.pop(); else if (!goBack && sheet.cur) sheet.stack.push(sheet.cur);
    sheet.cur = { html, onMount };
    html = `<div class="sh-nav">${sheet.stack.length ? '<button class="sh-back" type="button" aria-label="뒤로">‹ 뒤로</button>' : '<span></span>'}<button class="sh-x" type="button" aria-label="닫기"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button></div>` + html;
    if (swap) {
      const back = goBack || !!(tap.el && tap.el.closest('[data-back]') && Date.now() - tap.at < 800), h0 = old.offsetHeight;
      old.innerHTML = html; old.scrollTop = 0; old.classList.remove('swap-f', 'swap-b'); void old.offsetWidth; old.classList.add(back ? 'swap-b' : 'swap-f');
      const h1 = old.offsetHeight; if (!RM() && Math.abs(h1 - h0) > 4) old.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
    } else root.innerHTML = `<div class="sheet-bg"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    const close = closeSheet;
    $('.sheet-bg', root).onclick = close;
    $('.sh-x', root).onclick = close;
    const sb = $('.sh-back', root); if (sb) sb.onclick = () => { const p = sheet.stack.pop(); sheet.back = true; sheet.cur = null; sheet(p.html, p.onMount); };
    document.body.style.overflow = 'hidden';
    if (onMount) onMount($('.sheet', root), close);
    startReads($('.sheet', root));
    return close;
  }
  function closeSheet() {
    const root = $('#sheet-root'); if (!root.firstChild || root.classList.contains('out')) return;
    document.body.style.overflow = '';
    if (RM()) { root.innerHTML = ''; return; }
    root.classList.add('out'); closeSheet.t = setTimeout(() => { root.innerHTML = ''; root.classList.remove('out'); }, 230);
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#sheet-root .sheet')) closeSheet(); });
  function profileSheet() {
    const p = S.profile; let pick = p.uni;
    sheet(`<h2>내 정보</h2><p class="sub">목표 대학을 고르면 홈 맨 위에 크게 붙어 있어요</p>
      <div class="field"><label>이름</label><input class="inp" id="pf-name" value="${esc(p.name)}"></div>
      <div class="row" style="gap:12px"><div class="field" style="flex:2"><label>학교</label><input class="inp" id="pf-school" value="${esc(p.school)}"></div><div class="field" style="flex:1"><label>학년</label><select class="inp" id="pf-grade">${[1, 2, 3].map((g) => `<option ${+p.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>반</label><input class="inp" id="pf-cls" value="${esc(p.cls)}" inputmode="numeric"></div></div>
      <div class="field"><span class="lb">목표 대학</span><input class="inp" id="pf-q" placeholder="대학 이름 찾기"><div class="uni-grid" id="pf-unis"></div></div>
      <div class="field"><label>목표 학과</label><input class="inp" id="pf-major" value="${esc(p.major)}"></div>
      <div class="row" style="gap:12px"><div class="field" style="flex:1"><label>모의고사 목표 등급</label><select class="inp" id="pf-gm">${[1, 1.5, 2, 2.5, 3, 3.5, 4].map((g) => `<option ${+p.goalMock === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>내신 목표 등급</label><select class="inp" id="pf-gn">${[1, 1.2, 1.5, 1.8, 2, 2.5, 3].map((g) => `<option ${+p.goalNaesin === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div></div>
      <button class="btn primary big block" id="pf-save" type="button">저장하기</button>`, (el, close) => {
      const draw = () => { const q = $('#pf-q', el).value.trim(); $('#pf-unis', el).innerHTML = UNIS.filter((u) => !q || u.name.includes(q) || (u.short || '').includes(q)).map((u) => `<button type="button" class="${u.id === pick ? 'on' : ''}" data-u="${u.id}">${emb(u, 'md')}<span>${esc(u.short || u.name)}</span></button>`).join(''); $$('[data-u]', el).forEach((b) => (b.onclick = () => { pick = b.dataset.u; draw(); })); };
      $('#pf-q', el).oninput = draw; draw();
      $('#pf-save', el).onclick = () => {
        Object.assign(S.profile, { name: $('#pf-name', el).value.trim() || U.who, school: $('#pf-school', el).value.trim(), grade: +$('#pf-grade', el).value, cls: $('#pf-cls', el).value.trim(), uni: pick, major: $('#pf-major', el).value.trim(), goalMock: +$('#pf-gm', el).value, goalNaesin: +$('#pf-gn', el).value, goalSet: { ...(S.profile.goalSet || {}), ...(+$('#pf-gm', el).value !== +S.profile.goalMock ? { goalMock: true } : {}), ...(+$('#pf-gn', el).value !== +S.profile.goalNaesin ? { goalNaesin: true } : {}) } });
        save('profile'); close(); render(); toast('저장했어요');
      };
    });
  }

  // ───────── 홈 (대시보드) ─────────
  const CSAT = (D.events || []).find((e) => e.kind === 'csat') || { date: '2028-11-16', title: '수능 (예정)' };
  // 5등급제 ↔ 9등급제: 교육부 등급 비율(누적 %)로 같은 위치끼리 맞춘 대략값. 공식 환산표는 없어요
  const CUM5 = [10, 34, 66, 90, 100], CUM9 = [4, 11, 23, 40, 60, 77, 89, 96, 100];
  const mids = (c) => c.map((v, i) => ((i ? c[i - 1] : 0) + v) / 2);
  const lerpMid = (m, x) => { const i = Math.min(Math.max(Math.floor(x) - 1, 0), m.length - 2); return m[i] + (m[i + 1] - m[i]) * (x - 1 - i); };
  function g5to9(g) {
    const p = lerpMid(mids(CUM5), Math.min(Math.max(g, 1), 5)), m9 = mids(CUM9);
    if (p <= m9[0]) return 1; if (p >= m9[8]) return 9;
    const i = m9.findIndex((v, k) => p >= v && p <= m9[k + 1]); return i + 1 + (p - m9[i]) / (m9[i + 1] - m9[i]);
  }
  function g9to5(g9) {
    const m9 = mids(CUM9), m5 = mids(CUM5), p = lerpMid(m9, Math.min(Math.max(g9, 1), 9));
    if (p <= m5[0]) return 1; if (p >= m5[4]) return 5;
    const i = m5.findIndex((v, k) => p >= v && p <= m5[k + 1]); return i + 1 + (p - m5[i]) / (m5[i + 1] - m5[i]);
  }
  // 목표 등급: 직접 정하지 않았으면 목표 대학 합격선에 맞춰요 (내신은 9등급제 합격선을 5등급제로, 모의고사는 수능최저 평균)
  function autoGoals(track) {
    const u = uniOf(S.profile.uni), a = u && admitOf(u.id); if (!a) return null;
    const T = adMain(a).tracks || [], pick = (ty) => T.find((t) => t.type === ty && (t.cut70 || t.cut50));
    const want = track || S.profile.goalTrack || '종합';
    const tr = pick(want) || pick(want === '종합' ? '교과' : '종합'), c9 = tr && (tr.cut70 || tr.cut50);
    const mm = (t) => String((t && t.min) || '').match(/(\d)개[^\d합]*합\s*(\d+)/);
    let m = mm(tr); if (!m) for (const t of T) { const x = mm(t); if (x && (!m || +x[2] / +x[1] < +m[2] / +m[1])) m = x; }
    const mock = m ? +m[2] / +m[1] : null;
    return { naesin: c9 ? Math.round(g9to5(c9) * 10) / 10 : null, mock: mock ? Math.floor(mock * 10) / 10 : null, uni: u.short || u.name, c9, tr: tr && tr.type, pct: c9 ? Math.round(lerpMid(mids(CUM9), c9)) : null, minTxt: m ? `수능최저 ${m[1]}개 합 ${m[2]}` : '' };
  }
  function syncGoals() {
    const p = S.profile, a = autoGoals(), set = p.goalSet || {}; if (!a) return;
    if (!set.goalMock && a.mock) p.goalMock = a.mock; if (!set.goalNaesin && a.naesin) p.goalNaesin = a.naesin;
  }
  const goalWhy = () => { const a = autoGoals(), set = S.profile.goalSet || {}; if (!a) return '직접 정한 목표'; return set.goalMock || set.goalNaesin ? '직접 정한 목표' : `${a.uni} ${a.tr} 기준`; };
  function gradeMapCard(cls) {
    const my = nsTotal(), to9 = my ? g5to9(my) : null;
    const R5 = [['1', '상위 10%', '1등급 ~ 2등급'], ['2', '10 ~ 34%', '2등급 끝 ~ 4등급'], ['3', '34 ~ 66%', '4등급 ~ 6등급'], ['4', '66 ~ 90%', '6등급 ~ 8등급'], ['5', '90 ~ 100%', '8등급 ~ 9등급']];
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('abacus')} 5등급제와 9등급제</h2></div>
      <p class="sub" style="margin:0 0 12px">${nameCall().replace(/^우리 /, '')} 학년부터 내신은 5등급제예요. 합격선 숫자는 아직 9등급제라 같은 위치끼리 맞춰 봤어요</p>
      <div class="gm-wrap"><div>${my ? `<div class="gm-me"><div><span class="tiny">내 내신 (5등급제)</span><b class="num">${fmt1(my)}</b></div><span class="gm-arr">→</span><div><span class="tiny">9등급제로 치면 약</span><b class="num blue">${fmt1(to9)}</b></div></div>` : ''}<p class="tiny" style="margin:0;line-height:1.6">교육부가 정한 등급 비율로 맞춘 대략값이에요. 9등급제는 4·11·23·40·60·77·89·96%, 5등급제는 10·34·66·90%에서 끊어요. 공식 환산표는 아직 없고 대학마다 반영 방식이 달라요</p></div>
      <table class="tbl"><thead><tr><th>5등급제</th><th>누적 비율</th><th class="r">9등급제로 치면</th></tr></thead><tbody>${R5.map(([g, p, n]) => `<tr${my && Math.round(my) === +g ? ' class="gm-on"' : ''}><td><b>${g}등급</b></td><td class="num">${p}</td><td class="r">${n}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  function nsCard(cls) {
      const p = S.profile;
      const sems = SEMS.filter((sem) => nsAvg(sem) != null);
      const body = sems.length ? `<div class="list">${sems.map((sem) => { const rec = S.naesin[sem] || {}; const subs = nsSubjects(sem).filter((x) => nsG(rec[x.name])); const onlyMid = sem !== '1-1' && subs.every((x) => !+rec[x.name].grade && !+rec[x.name].finG); return `<div class="ns-sem"><div class="row between"><div><b>${sem.replace('-', '학년 ')}학기</b>${onlyMid ? '<span class="tiny"> · 중간고사까지</span>' : ''}</div><b class="num ns-big">${fmt1(nsAvg(sem))}<small>등급</small></b></div><div class="ns-subs">${subs.map((x) => { const g = nsG(rec[x.name]); return `<span class="ns-sub ${g <= 1 ? 'best' : ''}">${esc(x.name.replace(/[12]$/, ''))} <b class="num">${fmt1(g).replace(/\.0$/, '')}</b></span>`; }).join('')}</div></div>`; }).join('')}</div>${sems.length >= 3 ? tossLine(sems.map((sem) => ({ label: sem.replace('-', '학년 ') + '학기', v: nsAvg(sem) })), { maxG: 5, h: 160, id: 'n1', color: '#03b26c', goal: p.goalNaesin }) : ''}${p.goalNaesin ? `<p class="tiny" style="margin:12px 0 0">목표 ${p.goalNaesin}등급 · 5등급제 단위 수 가중 평균이에요</p>` : ''}` : `<div class="empty">${ic('pencil')}<b>내신 등급을 넣어 주세요</b><span>학기마다 과목 등급을 넣으면 평균이 계산돼요</span></div>`;
      return `<section class="card ${cls}"><div class="card-h"><h2>내신 등급</h2><button class="more" data-go="score" data-seg="naesin">입력하기</button></div>${body}</section>`;
  }
  function home() {
    const p = S.profile, u = uniOf(p.uni);
    const lm = lastMock(), mAvg = lm ? avgOf(lm.g) : null, nAvg = nsTotal();
    const ev = (D.events || []).filter((e) => e.kind !== 'csat' && dday(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
    const next = ev.find((e) => e.kind === 'exam') || ev[0];
    const hero = `<section class="card hero link c7" id="hero">
      <div class="hero-band" style="background:${u ? esc(u.color) : 'var(--blue)'}"></div>
      <div class="who">${emb(u, 'xl')}<div style="min-width:0"><div class="goal-t">${esc(p.name)}의 목표${p.mbti ? ` · ${esc(p.mbti)}` : ''}</div><div class="goal-n">${u ? esc(u.name) : '목표 대학을 골라 주세요'}</div><div class="goal-m">${u ? esc(p.major || '') : '눌러서 고르기'}</div></div><span class="tag" style="margin-left:auto;flex:none">${u ? '바꾸기' : '고르기'}</span></div>
      <div class="dday"><div><span>수능까지</span><b class="num">D-${dday(CSAT.date)}</b></div><div><span>${next ? esc(next.title) : '다음 일정'}</span><b class="num">${next ? 'D-' + dday(next.date) : '-'}</b></div><div><span>${esc(p.school || '')}</span><b>${p.grade}학년${p.cls ? ' ' + esc(p.cls) + '반' : ''}</b></div></div>
      <button type="button" class="hero-goal" data-goalset><span class="hg-l">${ic('target')} 목표 등급</span><b>모의고사 ${S.profile.goalMock}등급</b><b>내신 ${S.profile.goalNaesin}등급</b><span class="hg-why">${goalWhy()} ›</span></button>
    </section>`;
    const pos = `<section class="card c5 col-card mid"><div class="card-h"><h2>지금 내 위치</h2><button class="more" id="qg-open" type="button">등급 적기</button></div>
      <div class="rings"><button type="button" class="ring-go" data-go="score" data-seg="mock" aria-label="모의고사 성적 보기">${ringSVG(mAvg ? (9 - mAvg) / 8 : 0, 'var(--blue)', '모의고사', mAvg ? fmt1(mAvg) : '-', '등급', lm ? `${esc(lm.title)} 평균<br>${goalLine(mAvg, p.goalMock)}` : '채점 전')}</button><button type="button" class="ring-go" data-go="score" data-seg="naesin" aria-label="내신 성적 보기">${ringSVG(nAvg ? (5 - nAvg) / 4 : 0, 'var(--green)', '내신', nAvg ? fmt1(nAvg) : '-', '등급', nAvg ? `5등급제 평균<br>${goalLine(nAvg, p.goalNaesin)}` : '아직 안 넣었어요')}</button></div></section>`;
    // 등급 추이
    const rows = examRows().map((r) => ({ label: r.title.replace(/학력평가|모의고사/g, '').trim() || md(r.date), v: { avg: avgOf(r.g), ...r.g } }));
    const ck = UI.chartSubj;
    const keys = ck === 'avg' ? [...MAIN.map((k) => ({ key: k, dim: true })), { key: 'avg', color: 'var(--blue)' }] : [{ key: 'avg', dim: true }, { key: ck, color: SUBJ_COLOR[ck] }];
    const trend = `<section class="card c12" data-trend><div class="card-h"><h2>모의고사 등급 추이</h2><div class="seg" style="flex:0 1 auto">${[['avg', '평균'], ...MAIN.map((k) => [k, SUBJ_NAMES[k]])].map(([k, n]) => `<button type="button" class="${ck === k ? 'on' : ''}" data-cs="${k}">${n}</button>`).join('')}</div></div>${tossLine(rows.map((r) => ({ label: r.label, v: ck === 'avg' ? r.v.avg : r.v[ck] })), { goal: p.goalMock, id: 'h', color: ck === 'avg' ? '#3182f6' : SUBJ_COLOR[ck] })}</section>`;
    // 내신 학기별
    const nsRows = SEMS.map((sem) => ({ label: sem.replace('-', '학년 ') + '학기', v: { n: nsAvg(sem) } })).filter((r) => r.v.n != null);
    const nscard = nsCard('c6');
    const sgbc = sgbSummary('c6');
    const main = `<h1 class="h1">${bdayLeft() === 0 ? `${ic('party')} ${nameCall()}, 생일 축하해` : `${nameCall()}, ${greet()}`}</h1><p class="sub">${todayLine()}</p>
      <div class="grid">${hero}${pos}${walletCard('c12')}${pomoCard('c12 rail-inline')}${hotCard('c12 rail-inline')}${qlogCard()}${insightCard('c7')}${schedCard('c5')}${picksCard('c5')}${admitCard('c7')}${gradeMapCard('c12')}${trend}${railCards(true)}${nscard}${sgbc}</div>`;
    return `<div class="layout has-rail"><div>${main}</div><aside class="rail">${railCards(false)}</aside></div>`;
  }
  // 날마다 바뀌는 응원 한마디 (하루 동안은 같은 말)
  const CHEER = ['오늘도 정말 수고했어', '한 문제씩 쌓이는 게 다 실력이야', '어제보다 한 걸음 더 왔어', '지금 하는 게 다 남아, 잘하고 있어', '천천히 가도 괜찮아, 멈추지만 않으면 돼', '오늘 한 줄 기록이 나중에 큰 힘이 돼', '틀린 문제는 내 편이야, 다시 풀면 내 거야', '너는 생각보다 훨씬 잘하고 있어', '꾸준함이 제일 센 무기야', '힘들면 쉬어도 돼, 그래도 내일은 또 해 보자', '오늘의 노력은 절대 사라지지 않아', '목표 대학이 조금씩 가까워지고 있어', '작은 걸 해낸 것도 꼭 칭찬해 주자', '오늘도 끝까지 해낸 거 멋있어', '모르는 걸 아는 게 공부의 시작이야', '하루 30분이 1년이면 엄청난 차이야', '네가 하는 질문 하나가 세특이 돼', '조급해하지 마, 지금 속도도 충분해', '어려운 문제 앞에서 버틴 시간이 실력이야', '선생님은 늘 정윤이 편이야', '오늘 공부한 너, 진짜 대단해', '실수는 연습일 뿐이야, 시험 땐 안 하면 돼', '한 번 더 보는 게 합격을 만들어', '지금의 너를 믿어 봐', '잘 쉬는 것도 실력이야, 푹 자', '오늘 배운 거 하나만 기억해도 성공이야'];
  function nameCall() { const n = S.profile.name || U.who; const c = n.charCodeAt(n.length - 1); const jong = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; return `우리 ${esc(n)}${jong ? '이' : ''}`; }
  function cheer() { const t = today(); let h = 0; for (const ch of t + (S.profile.name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return CHEER[h % CHEER.length]; }
  function greet() { return cheer(); }
  // 오늘 남은 것: 홈 문구 · 숙제 탭 배지 · 숙제 탭 맨 위 단추가 모두 이 목록 하나를 써요
  function leftItems() {
    return todayTasks().tasks.filter((t) => !t.done && t.icon !== 'party').map((t) => ({ t: t.t, ic: t.icon, task: t.k, hw: t.hw }));
  }
  function todayLine() {
    const ed = engToday(), L = leftItems(), hw = L.filter((x) => x.hw).length;
    const parts = [...(hw ? [`선생님 숙제 ${hw}개`] : []), ...L.filter((x) => !x.hw).map((x) => x.t)];
    return parts.length ? `오늘 남은 것: ${parts.join(', ')}` : ed.off && !onDay('sci') ? '오늘은 정해 둔 매일 과제가 없는 날이에요' : '오늘 할 일을 다 끝냈어요';
  }
  // 오른쪽 칸 (PC) · 휴대폰에서는 본문 안에
  // 오늘 할 일 하나의 목록: 홈 「오늘 할 일」, 숙제 탭, 배지가 모두 이걸 써요
  function todayTasks() {
    const sd = sciToday(), st = dayStat(sd), ed = engToday();
    const wordsDone = Object.keys(ed.wans || {}).length >= Math.min(10, wordsFor(ed.words).length) && wordsFor(ed.words).length;
    const unitDone = ed.udone;
    const tasks = [];
    const off = !anyTask(new Date()) && !S.sci.days[today()] && !S.eng.days[today()];
    const has = (k) => !off && (onDay(k) || !!(k === 'sci' ? S.sci.days[today()] : S.eng.days[today()]));
    // 지난번에 다 못 한 건 그대로 이어서 나와요 · 어제와 같은 숙제처럼 보이지 않게 알려 줘요
    const prevEng = Object.entries(S.eng.days).filter(([dk]) => dk < today()).sort().map(([, v]) => v);
    const carried = (k) => k === 'unit' ? !unitDone && prevEng.some((v) => v.unit === ed.unit) : k === 'words' ? !wordsDone && prevEng.some((v) => v.words === ed.words) : !ed.g3done && prevEng.some((v) => v.g3 === ed.g3);
    const cdesc = (k, d) => (carried(k) ? `지난번에 못 한 것 · 이어서 해요 · ${d}` : d);
    if (off) tasks.push({ k: 'hw', icon: 'party', t: '오늘은 매일 과제가 쉬는 날이에요', d: '요일은 숙제 탭의 「숙제 설정」에서 바꿀 수 있어요', done: true });
    for (const d of openDrills().slice(0, 4)) tasks.push({ k: 'drill:' + d.id, icon: 'target', t: `${d.title || d.area} ${d.qs.length}문제`, d: '선생님이 낸 약한 영역 문제', done: false });
    if (has('g3') && G3.length) { const g = G3[ed.g3 || 0]; tasks.push({ k: 'g3', icon: 'eng', t: '고3 영어 한 문제', d: ed.g3done ? '다 풀었어요 · 문장 분석 보기' : cdesc('g3', g ? `${g.type || ''} · 문장 분석과 천일문 연결` : ''), done: !!ed.g3done }); }
    if (has('sci') && SCI.concepts.length) tasks.push({ k: 'sci', icon: 'sci', t: sd.one ? `과학 개념: ${(SCI.concepts.find((x) => x.id === sd.c) || {}).title || ''}` : `오늘의 과학 ${st.n}문제`, d: sd.one && !sd.read ? `교과서 개념 보고 문제 ${st.n}개` : st.done >= st.n ? `${st.ok}/${st.n} 맞힘${st.all > st.n ? ` · 깊게 ${st.all - st.n}문제 더` : ''}` : `${st.done}/${st.n} 풀었어요`, done: st.done >= st.n });
    if (has('unit') && CH_UNITS.length) { const un = CH_UNITS[ed.unit] || CH_UNITS[CH_UNITS.length - 1]; tasks.push({ k: 'unit', icon: 'eng', t: `천일문 ${un.unit ? 'Unit ' + un.unit : ''} ${un.title || ''}`.trim(), d: unitDone ? '다 했어요' : cdesc('unit', '개념 · 문장 · 문제'), done: !!unitDone }); }
    if (has('words') && WORDS.length) tasks.push({ k: 'words', icon: 'books', t: '워드마스터 단어 10개 시험', d: wordsDone ? `${Object.values(ed.wans).filter((x) => x.ok).length}/10 맞힘` : cdesc('words', `Day ${(wordsFor(ed.words)[0] || {}).day || ''}`), done: !!wordsDone });
    { const wk = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10); for (const n of ((D.news && D.news.items) || []).filter((n) => n.must && n.date >= wk && !wHas('news:' + n.id)).slice(0, 2)) tasks.push({ k: 'news:' + n.id, icon: 'fire', t: `꼭 읽기: ${n.title}`, d: '요즘 대이슈 · 읽으면 50원', done: false }); }
    tasks.push(...inkTasks());
    for (const h of hwNow()) tasks.push({ k: 'hw', hw: h.id, icon: 'pin', t: h.title, d: h.due && h.due < today() ? `${md(h.due)} 숙제 · 아직 안 했어요` : '오늘 선생님 숙제', done: false });
    for (const h of (S.hw || []).filter((x) => hwDone(x) && x.due === today())) tasks.push({ k: 'hw', hw: h.id, icon: 'pin', t: h.title, d: '선생님 숙제 · 끝냈어요', done: true });
    return { tasks, off, sd, st, ed, wordsDone, unitDone };
  }
  // 오른쪽 칸 위젯: 지금 시각 · 디데이
  const WK = '일월화수목금토';
  function clockWidget() {
    const d = new Date(), pm = pDay().min || 0;
    return `<section class="card tight w-clock"><div><div class="w-date">${d.getMonth() + 1}월 ${d.getDate()}일 ${WK[d.getDay()]}요일</div><div class="w-sub">${pm ? `오늘 집중 ${pm}분` : greetTime(d)}</div></div><b class="w-time num" data-clock>${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</b></section>`;
  }
  const greetTime = (d) => { const h = d.getHours(); return h < 6 ? '늦었어요, 조금만 하고 자요' : h < 12 ? '좋은 아침이에요' : h < 18 ? '오후도 힘내요' : h < 22 ? '저녁 공부 시간이에요' : '오늘도 수고했어요'; };
  function ddayWidget() {
    const t = today(), ev = [{ title: CSAT.title || '수능', date: CSAT.date, big: true }, ...[...(D.events || []), ...(S.myEvents || []).map((e) => ({ ...e, mine: true }))].filter((e) => e.date >= t && e.kind !== 'csat')].sort((a, b) => a.date.localeCompare(b.date));
    const L = [ev[0], ...ev.slice(1).slice(0, 3)].filter(Boolean);
    return `<section class="card tight w-dday"><div class="card-h"><h3>디데이</h3><button class="more" type="button" id="w-sched">일정</button></div>
      <div class="w-dl">${L.map((e) => { const n = dday(e.date); return `<div class="w-di ${e.big ? 'big' : ''}"><span class="w-dn">${esc(e.title)}</span><span class="w-dd">${md(e.date)}</span><b class="num ${n <= 7 ? 'red' : n <= 30 ? 'blue' : ''}">${n === 0 ? 'D-DAY' : 'D-' + n}</b></div>`; }).join('')}</div></section>`;
  }
  setInterval(() => { const d = new Date(), v = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; $$('[data-clock]').forEach((x) => { if (x.textContent !== v) x.textContent = v; }); }, 5000);
  function railCards(inline) {
    const cls = inline ? 'rail-inline c12' : '';
    const { tasks, off } = todayTasks();
    const real = tasks.filter((t) => t.icon !== 'party'); const doneN = real.filter((t) => t.done).length, frac = real.length ? doneN / real.length : (off ? 1 : 0);
    const R = 80, L = Math.PI * R;
    const todo = `<section class="card tight ${cls}"><div class="card-h"><h3>오늘 할 일</h3><button class="more" data-go="hw">숙제</button></div>
      <div class="arch"><svg viewBox="0 0 200 100"><path d="M20 96 A80 80 0 0 1 180 96" fill="none" stroke="var(--fill)" stroke-width="12" stroke-linecap="round"/><path class="ring-arc" d="M20 96 A80 80 0 0 1 180 96" fill="none" stroke="var(--blue)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - frac)}"/></svg><div class="c"><span class="tiny">오늘</span><br><b class="num">${Math.round(frac * 100)}%</b> <span class="muted">완료</span></div></div>
      <div class="list">${tasks.length ? tasks.map((t) => `<div class="li btnlike" data-task="${t.k}"><div class="ico">${ic(t.done ? 'ok' : t.icon)}</div><div class="body"><div class="t">${esc(t.t)}</div><div class="d">${esc(t.d)}</div></div><span class="chev"></span></div>`).join('') : `<div class="empty">${ic('party')}<b>오늘 할 일이 없어요</b></div>`}</div></section>`;
    return inline ? todo : clockWidget() + pomoCard('pm-rail') + hotCard('') + todo + ddayWidget();
  }
  const nIcon = (n) => (n.scope === '교육부' ? 'bank' : /과학|바이오/.test(n.scope || '') ? 'sci' : 'news');
  // 소식 탭: 입시 · 과학 · 시사 상식
  const nGrp = (n) => (/과학|바이오/.test(n.scope || '') ? '과학' : n.scope === '시사 상식' ? '시사 상식' : '입시');
  function newsView() {
    const N = (D.news && D.news.items) || [], f = UI.newsF || 'all';
    const groups = ['입시', '과학', '시사 상식'].filter((g) => N.some((n) => nGrp(n) === g));
    const L = N.filter((n) => f === 'all' || nGrp(n) === f).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const KK = { ...(S.keep || {}) }; for (const [k, v] of Object.entries(S.notes || {})) KK[k] = { ...(KK[k] || {}), ...v, kept: !!(S.keep || {})[k] };
    for (const k of Object.keys(S.keep || {})) KK[k].kept = true;
    const KL = Object.entries(KK).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)), KN = { news: '소식', uni: '대학', pick: '진로' };
    const kept = KL.length ? `<div class="list">${KL.map(([k, v]) => `<div class="li btnlike" data-kopen="${esc(v.kind)}|${esc(v.ref)}"><div class="ico">${ic(v.kind === 'uni' ? 'school' : v.kind === 'pick' ? 'dna' : 'news')}</div><div class="body"><div class="t">${v.kept ? '★ ' : ''}${esc(v.t || '')}</div><div class="d">${KN[v.kind] || ''}${v.text ? ` · <span class="kp-note">${esc(v.text.replace(/\s+/g, ' ').slice(0, 60))}${v.text.length > 60 ? '…' : ''}</span>` : ''}</div></div><span class="chev"></span></div>`).join('')}</div>` : `<div class="empty">${gh('idle', 'gh-empty')}<b>아직 담은 게 없어요</b><span>소식·대학·진로 픽에서 「☆ 담기」를 누르거나 내 생각을 남겨 보세요</span></div>`;
    const read = (n) => wHas('news:' + n.id);
    const item = (n) => `<div class="li btnlike ${read(n) ? 'nw-read' : ''}" data-news="${esc(n.id)}"><div class="ico">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'sm') : ic(nIcon(n))}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${md(n.date)} · ${esc(nGrp(n))}${n.must ? '' : n.level === '중요' ? ' · <b class="red">중요</b>' : ''}${read(n) ? '' : ' · <b class="blue">새 소식</b>'}</div></div>${n.must ? '<span class="tag must">꼭 읽기</span>' : ''}<span class="chev"></span></div>`;
    const MUST = N.filter((n) => n.must).sort((a, b) => read(a) - read(b) || String(b.date).localeCompare(String(a.date))).slice(0, 5);
    return `<h1 class="h1">소식</h1><p class="sub">${D.news && D.news.updated ? md(D.news.updated) + ' 업데이트 · ' : ''}입시 · 과학 · 시사 상식, 출처를 확인한 것만 모았어요. 하나 읽으면 50원</p>
      <div class="chips" style="margin-bottom:16px">${['all', ...groups].map((g) => `<button type="button" class="chip ${f === g ? 'on' : ''}" data-nf="${esc(g)}">${g === 'all' ? '전체' : esc(g)} <span class="tiny">${g === 'all' ? N.length : N.filter((n) => nGrp(n) === g).length}</span></button>`).join('')}<button type="button" class="chip ${f === 'keep' ? 'on' : ''}" data-nf="keep">★ 담은 것 · 내 생각 <span class="tiny">${KL.length}</span></button></div>
      <div class="grid">${f !== 'keep' && MUST.length ? `<section class="card c12 nw-must"><div class="card-h"><h2>${ic('fire')} 꼭 읽어야 할 대이슈</h2><span class="tiny">${MUST.filter((n) => !read(n)).length ? `안 읽은 것 ${MUST.filter((n) => !read(n)).length}개` : '다 읽었어요'}</span></div><div class="list">${MUST.map(item).join('')}</div></section>` : ''}<section class="card c12">${f === 'keep' ? kept : L.length ? `<div class="list">${L.map(item).join('')}</div>` : `<div class="empty">${gh('idle', 'gh-empty')}<b>소식을 모으는 중이에요</b></div>`}</section></div>`;
  }
  function newsCard(cls) {
    const N = (D.news && D.news.items) || [];
    const p = S.profile;
    const mine = N.slice().sort((a, b) => (!!b.must - !!a.must) || (b.level === '중요') - (a.level === '중요') || String(b.date).localeCompare(String(a.date)));
    const top = mine.filter((n) => !n.uni || n.uni === p.uni || n.scope !== '대학').slice(0, 4);
    return `<section class="card tight ${cls}"><div class="card-h"><h3>소식</h3><button class="more" data-news="all">전체 ${N.length}</button></div>
      ${top.length ? `<div class="list">${top.map((n) => `<div class="li btnlike" data-news="${esc(n.id)}"><div class="ico">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'sm') : ic(nIcon(n))}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${md(n.date)} · ${esc(n.scope || '')}${n.level === '중요' && !n.must ? ' · <b class="red">중요</b>' : ''}</div></div>${n.must ? '<span class="tag must">꼭 읽기</span>' : ''}</div>`).join('')}</div>` : `<div class="empty">${ic('news')}<b>소식을 모으는 중이에요</b></div>`}
      ${D.news && D.news.updated ? `<p class="tiny" style="margin:8px 0 0">${md(D.news.updated)} 업데이트</p>` : ''}</section>`;
  }
  // 담기 · 내 생각: 소식·대학·진로 픽마다 담아 두고 짧게 생각을 남겨요 (나중에 세특·면접 소재)
  function keepBox(key, t, kind, ref, asks = []) {
    const k = (S.keep || {})[key], n = (S.notes || {})[key];
    return `<div class="keep" data-kk="${esc(key)}" data-kt="${esc(t)}" data-kind="${esc(kind)}" data-ref="${esc(ref)}">
      <div class="keep-h"><b>${ic('write')} 내 생각</b><button type="button" class="keep-btn ${k ? 'on' : ''}" data-keep>${k ? '★ 담았어요' : '☆ 담기'}</button></div>
      ${asks.length ? `<div class="keep-ask">${asks.map((q) => `<button type="button" data-ask>${esc(q)}</button>`).join('')}</div>` : ''}
      <textarea class="inp keep-ta" data-note rows="3" placeholder="짧게 내 생각을 남겨요. 나중에 세특·면접 소재가 돼요">${esc((n && n.text) || '')}</textarea>
      <p class="tiny keep-st">${n && n.text ? `${md(new Date(n.at).toLocaleDateString('sv'))}에 남겼어요` : '처음 남기면 +100원'}</p></div>`;
  }
  function keepMeta(box) { return { t: box.dataset.kt, kind: box.dataset.kind, ref: box.dataset.ref }; }
  document.addEventListener('click', (e) => {
    const kb = e.target.closest('[data-keep]'); if (kb) { const box = kb.closest('.keep'), key = box.dataset.kk; S.keep = S.keep || {}; if (S.keep[key]) delete S.keep[key]; else S.keep[key] = { ...keepMeta(box), at: Date.now() }; save('keep'); const on = !!S.keep[key]; kb.classList.toggle('on', on); kb.textContent = on ? '★ 담았어요' : '☆ 담기'; if (on && !RM()) bump(kb, 'pm-pop'); toast(on ? '담았어요 · 소식 탭 「담은 것」에서 다시 봐요' : '담기를 뺐어요'); return; }
    const qa = e.target.closest('[data-ask]'); if (qa) { const ta = $('[data-note]', qa.closest('.keep')); ta.value = (ta.value ? ta.value.trimEnd() + '\n\n' : '') + 'Q. ' + qa.textContent + '\n'; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); ta.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  let noteT = 0;
  document.addEventListener('input', (e) => {
    const ta = e.target.closest && e.target.closest('[data-note]'); if (!ta) return;
    clearTimeout(noteT); noteT = setTimeout(() => {
      const box = ta.closest('.keep'), key = box.dataset.kk, v = ta.value.trim(); S.notes = S.notes || {};
      if (v) S.notes[key] = { ...keepMeta(box), text: v, at: Date.now() }; else delete S.notes[key];
      save('notes'); const st = $('.keep-st', box); if (st) st.textContent = v ? '저장했어요' : '처음 남기면 +100원';
      if (v.length >= 15) earn('note:' + key, 100, '내 생각 남기기', { from: st });
    }, 700);
  });
  function openKept(kind, ref) { if (kind === 'news') newsSheet(ref); else if (kind === 'uni') uniDetail(ref); else if (kind === 'pick') { const [k, i] = String(ref).split(':'); pickDetail(k, +i); } }
  function newsSheet(id) {
    const N = (D.news && D.news.items) || [];
    if (id === 'all') { closeSheet(); UI.run = null; UI.tab = 'news'; render(); scrollTo(0, 0); return; }
    const n = N.find((x) => x.id === id); if (!n) return;
    sheet(`<div class="row" style="margin-bottom:12px">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'md') : `<span class="ico">${ic(nIcon(n))}</span>`}${n.must ? '<span class="tag must">꼭 읽기 · 대이슈</span>' : `<span class="tag ${n.level === '중요' ? 'red' : ''}">${esc(n.level || '참고')}</span>`}<span class="tiny">${md(n.date)} · ${esc(n.scope || '')}</span></div>
      <h2>${esc(n.title)}</h2>${readPill('news:' + n.id, 50, '소식 읽기')}<p style="line-height:1.8;color:var(--t2)">${esc(n.body)}</p>
      ${n.you ? `<div class="deep"><div class="eyebrow">${esc(S.profile.name)}에게는</div><p>${esc(n.you)}</p></div>` : ''}
      ${(n.more || []).length ? `<div class="nw-more"><div class="eyebrow">${ic('bulb')} 더 깊이 알아보기</div><ul>${n.more.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
      ${keepBox('news:' + n.id, n.title, 'news', n.id, n.ask || [])}
      <div class="list" style="margin-top:16px">${(n.src || []).map((s) => `<a class="li btnlike" href="${esc(s.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><div class="ico">${ic('pin')}</div><div class="body"><div class="t">${esc(s.name)}</div><div class="d">원문 보기</div></div><span class="chev"></span></a>`).join('')}</div>
      <button class="btn big block" style="margin-top:16px" data-close type="button">목록으로</button>`, (el) => { $('[data-close]', el).onclick = closeSheet; });
  }

  // ───────── 숙제 탭 ─────────
  // ───────── 기말 교과서 e-book: 쪽 그림 위에 단어 위치를 겹쳐 형광펜·밑줄·질문·나중에 보기 ─────────
  const EB = D.ebook || { books: [] };
  const EB_EXAM = ((D.events || []).find((e) => /기말/.test(e.title || '') && e.date >= '2026-11-01') || {}).date || '2026-12-10';
  // ───────── 인강: 정윤이가 고른 강의를 요일·하루 몇 강으로 나눠 오늘 할 일에 넣어요 (2026-10-25) ─────────
  // 강의 상태는 사이트에서 읽어 온 진도로 시작하고, 앱에서 「들었어요 / 안 들을래요」로 바꿔요. 순서대로 안 들어도 돼요
  const INK = (D.inkang && D.inkang.courses) || [];
  const INK_IC = { kor: 'write', sci: 'sci', hist: 'scroll', hist2: 'scroll', soc: 'globe', soc2: 'globe' };
  const inkS = () => { S.ink = S.ink || {}; for (const k of ['cfg', 'st', 'at', 'days', 'q']) S.ink[k] = S.ink[k] || {}; return S.ink; };
  const inkC = (id) => INK.find((c) => c.id === id);
  const inkL = (c, no) => c && c.lectures.find((l) => l.no === +no);
  const inkCfg = (c) => inkS().cfg[c.id] || { on: c.pick.length > 0, days: [1, 2, 3, 4, 5], per: 1, pick: c.pick.slice() };
  const inkSt = (c, l) => { const v = inkS().st[c.id + ':' + l.no]; return v === 'none' ? '' : v || (l.done ? 'done' : ''); };
  const inkQueue = (c, cf = inkCfg(c)) => c.lectures.filter((l) => cf.pick.includes(l.no) && !inkSt(c, l));
  function inkToday() {
    const s = inkS(), t = today(), dw = new Date().getDay();
    if (!s.days[t]) {
      const d = {};
      for (const c of INK) { const cf = inkCfg(c); const L = c.lectures.filter((l) => s.at[c.id + ':' + l.no] === t).map((l) => l.no); if (cf.on && cf.days.includes(dw)) L.push(...inkQueue(c).slice(0, Math.max(0, cf.per - L.length)).map((l) => l.no)); if (L.length) d[c.id] = L; }
      s.days[t] = d; if (Object.keys(d).length) save('ink');
    }
    return s.days[t];
  }
  // 이대로 들으면 언제 끝나나 (오늘부터 고른 요일마다 per 강씩)
  function inkFinish(c, cf) {
    let n = inkQueue(c, cf).length; if (!n) return { n: 0, date: null };
    if (!cf.on || !cf.days.length) return { n, date: null };
    const d = new Date(); for (let i = 0; i < 400 && n > 0; i++) { if (cf.days.includes(d.getDay())) n -= cf.per; if (n > 0) d.setDate(d.getDate() + 1); }
    return { n: inkQueue(c, cf).length, date: d.toISOString().slice(0, 10) };
  }
  const inkTasks = () => { const out = []; for (const [cid, nos] of Object.entries(inkToday() || {})) { const c = inkC(cid); if (!c) continue; for (const no of nos) { const l = inkL(c, no); if (!l) continue; const k = cid + ':' + no, st = inkSt(c, l), q = inkS().q[k]; out.push({ k: 'ink:' + k, icon: INK_IC[cid] || 'books', t: `${c.subj} 인강 · ${l.title}`, d: st === 'done' ? `들었어요${q ? ` · 퀴즈 ${q.ok}/${q.n}` : ''}` : st === 'skip' ? '안 듣기로 했어요' : `${c.teacher} · ${l.min ? l.min + '분 · ' : ''}눌러서 ${c.siteName}에서 듣기`, done: !!st }); } } return out; };
  function inkMark(c, l, st) { const s = inkS(), k = c.id + ':' + l.no; if (st) { s.st[k] = st; s.at[k] = today(); } else { s.st[k] = 'none'; delete s.at[k]; } save('ink'); }
  // 한 강의: 사이트로 가기 → 다 들었어요 → 미니 퀴즈
  function inkLec(cid, no) {
    const c = inkC(cid), l = inkL(c, no); if (!l) return;
    const k = cid + ':' + no, Q = l.quiz || [];
    const st = () => inkSt(c, l);
    sheet('<div id="ik-b"></div>', (el, close) => {
      const home = () => {
        const s = st(), q = inkS().q[k];
        $('#ik-b', el).innerHTML = `<p class="tiny" style="margin:0 0 4px">${esc(c.subj)} · ${esc(c.teacher)} · ${esc(c.siteName)}</p><h2 style="line-height:1.4">${esc(l.title)}</h2>
          <p class="sub">${esc(c.title)}${l.min ? ` · ${l.min}분` : ''}${l.page ? ` · 교재 ${esc(l.page)}` : ''}</p>
          ${s === 'done' ? `<div class="deep"><b>들었어요</b>${q ? ` · 미니 퀴즈 ${q.n}문제 중 ${q.ok}개 맞혔어요` : ''}</div>` : l.pct ? `<div class="deep">사이트에서 ${l.pct}%까지 들었어요. 이어서 들어요</div>` : ''}
          <a class="btn primary big block" href="${esc(c.url)}" target="_blank" rel="noopener" style="margin-top:12px">${esc(c.siteName)}에서 듣기</a>
          <p class="tiny" style="margin:8px 0 16px">로그인돼 있으면 강좌 페이지가 바로 열려요. 목록에서 <b>${c.site === 'etoos' ? esc(l.title.split(' ')[0]) : 'No.' + l.no}</b> ${c.site === 'etoos' ? '▶' : '「영상보기」'}를 눌러요</p>
          ${s === 'done' ? (Q.length ? '<button class="btn big block" id="ik-quiz" type="button">미니 퀴즈 다시 풀기</button>' : '') : `<button class="btn big block" id="ik-done" type="button">${Q.length ? `다 들었어요 · 미니 퀴즈 ${Q.length}문제` : '다 들었어요'}</button>`}
          <div class="row" style="gap:8px;margin-top:8px">${s === 'skip' ? '<button class="btn sm" id="ik-undo" type="button">다시 들을 목록에 넣기</button>' : s === 'done' ? '<button class="btn sm" id="ik-undo" type="button">아직 안 들은 걸로 바꾸기</button>' : '<button class="btn sm" id="ik-skip" type="button">이 강의는 안 들을래요</button>'}</div>`;
        const on = (id, f) => { const b = $(id, el); if (b) b.onclick = f; };
        on('#ik-done', () => (Q.length ? quiz(0, []) : (inkMark(c, l, 'done'), close(), render(), toast('들었어요, 잘했어요'))));
        on('#ik-quiz', () => quiz(0, []));
        on('#ik-skip', () => { inkMark(c, l, 'skip'); close(); render(); toast('이 강의는 빼 둘게요'); });
        on('#ik-undo', () => { inkMark(c, l, ''); home(); render(); });
      };
      const quiz = (i, ans) => {
        if (i >= Q.length) {
          const ok = ans.filter(Boolean).length; inkS().q[k] = { n: Q.length, ok, at: Date.now() }; inkMark(c, l, 'done');
          earn('ink:' + k, 100, `인강 퀴즈 · ${c.subj}`);
          $('#ik-b', el).innerHTML = `<h2>미니 퀴즈 끝</h2><p class="sub">${Q.length}문제 중 <b class="${ok === Q.length ? 'blue' : ''}">${ok}개</b> 맞혔어요${ok === Q.length ? '. 완벽해요' : '. 틀린 건 강의 그 부분을 한 번 더 봐요'}</p><button class="btn primary big block" id="ik-end" type="button">닫기</button>`;
          $('#ik-end', el).onclick = () => { close(); render(); }; return;
        }
        const x = Q[i];
        $('#ik-b', el).innerHTML = `<p class="tiny" style="margin:0 0 4px">미니 퀴즈 ${i + 1}/${Q.length} · ${esc(l.title)}</p><h2 style="line-height:1.5;font-size:19px">${esc(x.q)}</h2><div class="list" id="ik-c">${x.c.map((t, j) => `<button type="button" class="li btnlike ik-ch" data-j="${j}" style="width:100%;text-align:left;border:0;background:none"><div class="ico"><b>${j + 1}</b></div><div class="body"><div class="t" style="font-size:15.5px;font-weight:500">${esc(t)}</div></div></button>`).join('')}</div><div id="ik-x"></div>`;
        $$('.ik-ch', el).forEach((b) => (b.onclick = () => {
          const j = +b.dataset.j, ok = j === x.a; ans.push(ok);
          $$('.ik-ch', el).forEach((y) => { y.disabled = true; const jj = +y.dataset.j; if (jj === x.a) y.classList.add('ik-ok'); else if (jj === j) y.classList.add('ik-no'); });
          $('#ik-x', el).innerHTML = `<div class="explain"><b>${ok ? '맞았어요' : `정답은 ${x.a + 1}번`}</b><br>${esc(x.exp || '')}</div><button class="btn primary big block" id="ik-next" type="button" style="margin-top:12px">${i + 1 < Q.length ? '다음 문제' : '결과 보기'}</button>`;
          $('#ik-next', el).onclick = () => quiz(i + 1, ans);
        }));
      };
      home();
    });
  }
  // 인강 설정: 강좌마다 듣기 · 요일 · 하루 몇 강 · 들을 강의 고르기
  function inkSettings() {
    const P = {}; for (const c of INK) { const cf = inkCfg(c); P[c.id] = { ...cf, days: cf.days.slice(), pick: cf.pick.slice() }; }
    const order = [1, 2, 3, 4, 5, 6, 0], open = {};
    const draw = (el) => {
      $('#ik-set', el).innerHTML = INK.map((c) => {
        const cf = P[c.id], f = inkFinish(c, cf), late = f.date && f.date > EB_EXAM;
        const sum = !cf.on ? '안 들어요' : !f.n ? '고른 강의를 다 들었어요' : !cf.days.length ? `남은 ${f.n}강 · 요일을 골라요` : `남은 ${f.n}강 · ${md(f.date)}에 끝나요 · ${late ? `<b class="red">기말(${md(EB_EXAM)})보다 늦어요</b>` : '<b class="blue">기말 전에 끝나요</b>'}`;
        return `<div class="pl-item ik-item"><div class="row between" style="gap:8px"><div class="pl-h">${ic(INK_IC[c.id] || 'books')}<div><b>${esc(c.subj)} · ${esc(inkName(c))}</b><span class="tiny">${esc(c.teacher)} · ${esc(c.range)}</span></div></div><button type="button" class="ik-sw ${cf.on ? 'on' : ''}" data-ion="${c.id}" aria-pressed="${cf.on}">${cf.on ? '듣는 중' : '안 들어요'}</button></div>
          <div class="ik-in">${cf.on ? `<div class="pl-dots">${order.map((d) => `<button type="button" class="${cf.days.includes(d) ? 'on' : ''} ${d === 0 ? 'sun' : d === 6 ? 'sat' : ''}" data-idw="${c.id}:${d}">${DOW[d]}</button>`).join('')}</div>
          <div class="row" style="gap:6px;margin-top:10px;align-items:center"><span class="tiny">하루에</span>${[1, 2, 3].map((n) => `<button type="button" class="chip sm ${cf.per === n ? 'on' : ''}" data-iper="${c.id}:${n}">${n}강</button>`).join('')}</div>` : ''}
          <p class="tiny" style="margin:10px 0 0">${sum}</p>
          <button type="button" class="btn sm" data-ipk="${c.id}" style="margin-top:8px">${open[c.id] ? '강의 목록 접기' : `들을 강의 고르기 · ${cf.pick.length}강 골랐어요`}</button>
          ${open[c.id] ? `<div class="ik-lecs">${c.lectures.map((l) => { const s = inkSt(c, l), on = cf.pick.includes(l.no); return `<button type="button" class="ik-lec ${on ? 'on' : ''}" data-ilp="${c.id}:${l.no}"><i>${on ? '✓' : ''}</i><span><b>${esc(l.title)}</b><em>${l.min ? l.min + '분' : ''}${s === 'done' ? ' · 들었어요' : s === 'skip' ? ' · 안 들어요' : l.pct ? ` · ${l.pct}% 들음` : ''}</em></span></button>`; }).join('')}</div>` : ''}</div></div>`;
      }).join('');
      $$('[data-ion]', el).forEach((b) => (b.onclick = () => { const x = P[b.dataset.ion]; x.on = !x.on; draw(el); }));
      $$('[data-idw]', el).forEach((b) => (b.onclick = () => { const [id, d] = b.dataset.idw.split(':'), x = P[id], n = +d; x.days = x.days.includes(n) ? x.days.filter((y) => y !== n) : [...x.days, n]; draw(el); }));
      $$('[data-iper]', el).forEach((b) => (b.onclick = () => { const [id, n] = b.dataset.iper.split(':'); P[id].per = +n; draw(el); }));
      $$('[data-ipk]', el).forEach((b) => (b.onclick = () => { open[b.dataset.ipk] = !open[b.dataset.ipk]; draw(el); }));
      $$('[data-ilp]', el).forEach((b) => (b.onclick = () => { const [id, no] = b.dataset.ilp.split(':'), x = P[id], n = +no; x.pick = x.pick.includes(n) ? x.pick.filter((y) => y !== n) : [...x.pick, n].sort((p, q) => p - q); draw(el); }));
    };
    sheet(`<h2>인강 설정</h2><p class="sub">강좌마다 듣는 요일과 하루에 몇 강 들을지 정해요. 들을 강의만 골라 두면 안 들은 것부터 「오늘 할 일」에 나와요. 순서대로 안 들어도 괜찮아요</p><div id="ik-set"></div><button class="btn primary big block" id="ik-ok" type="button" style="margin-top:20px">저장하기</button>`, (el, close) => {
      draw(el);
      $('#ik-ok', el).onclick = () => {
        // 바꾼 설정으로 오늘 들을 강의가 새로 생기면 오늘부터 할지 물어요
        const s = inkS(), t = today(), before = inkToday(), cnt = (d) => Object.values(d || {}).reduce((a, x) => a + x.length, 0);
        s.cfg = P; delete s.days[t]; const after = inkToday();
        const added = Object.entries(after).flatMap(([cid, nos]) => nos.filter((no) => !(before[cid] || []).includes(no)).map((no) => ({ c: inkC(cid), l: inkL(inkC(cid), no) }))).filter((a) => a.l && !inkSt(a.c, a.l));
        close();
        if (!added.length) { save('ink'); render(); toast('인강 계획을 바꿨어요'); return; }
        s.days[t] = before; save('ink'); render();
        setTimeout(() => sheet(`<h2>오늘부터 할까요?</h2><p class="sub">오늘(${DOW[new Date().getDay()]}요일)도 듣는 날로 골랐어요. 오늘부터 하면 아래 ${added.length}강이 「오늘 할 일」에 들어가요</p>
          <div class="list">${added.map((a) => `<div class="li"><div class="ico">${ic(INK_IC[a.c.id] || 'books')}</div><div class="body"><div class="t">${esc(a.l.title)}</div><div class="d">${esc(a.c.subj)} · ${esc(inkName(a.c))}</div></div></div>`).join('')}</div>
          <button class="btn primary big block" id="ik-now" type="button" style="margin-top:20px">오늘부터 할게요</button><button class="btn big block" id="ik-later" type="button" style="margin-top:8px">내일부터 할게요</button>`, (el2, close2) => {
          $('#ik-now', el2).onclick = () => { s.days[t] = after; save('ink'); close2(); render(); toast(`오늘 인강 ${cnt(after)}강이 들어갔어요`); };
          $('#ik-later', el2).onclick = () => { close2(); toast('내일부터 할게요'); };
        }), 250);
      };
    });
  }
  const INK_NM = { kor: '공통국어2 내신', sci: 'AXIS 개념완성', hist: '내신완성', hist2: '라디오북', soc: '올인원 개념완성', soc2: '고양이 기출분석' };
  const inkName = (c) => INK_NM[c.id] || c.teacher;
  function inkCard(cls) {
    if (!INK.length) return '';
    const L = INK.filter((c) => inkCfg(c).on);
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('1f3a7')} 인강</h2><button class="btn sm" id="ink-set" type="button"><svg class="gear" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#8b95a1" stroke="#8b95a1" stroke-width="1.8" stroke-linejoin="round" fill-rule="evenodd" d="M10.3 2h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.6.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6L2 13.7v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7zM12 15.9a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8z"/></svg> 인강 설정</button></div>
      ${L.length ? `<div class="list ik-list">${L.map((c) => { const cf = inkCfg(c), P = c.lectures.filter((l) => cf.pick.includes(l.no)), dn = P.filter((l) => inkSt(c, l)).length, nx = inkQueue(c)[0], f = inkFinish(c, cf); return `<div class="li btnlike" ${nx ? `data-task="ink:${c.id}:${nx.no}"` : 'data-inkset'}><div class="ico">${ic(INK_IC[c.id] || 'books')}</div><div class="body"><div class="t">${esc(c.subj)} · ${esc(inkName(c))} <span class="tiny">${esc(c.teacher)} · ${dn}/${P.length}강</span></div><div class="d">${nx ? `다음: ${esc(nx.title)}` : '고른 강의를 다 들었어요'}${f.date && f.date > EB_EXAM ? ' · <b class="red">기말보다 늦어요</b>' : ''}</div><div class="ik-bar"><i style="width:${P.length ? (dn / P.length) * 100 : 0}%"></i></div></div></div>`; }).join('')}</div>` : `<div class="empty"><b>듣는 인강이 없어요</b><span>「인강 설정」에서 골라요</span></div>`}</section>`;
  }
  const bkS = () => { S.book = S.book || {}; S.book.marks = S.book.marks || {}; S.book.seen = S.book.seen || {}; S.book.pin = S.book.pin || {}; S.book.last = S.book.last || {}; return S.book; };
  const ebFind = (cid) => { for (const b of EB.books) { const c = b.ch.find((x) => x.id === cid); if (c) return { b, c }; } return null; };
  let ebKeyP = null;
  const ebKey = () => ebKeyP || (ebKeyP = crypto.subtle.importKey('raw', new Uint8Array(EB.key.match(/../g).map((x) => parseInt(x, 16))), 'AES-CTR', false, ['decrypt']));
  async function ebGet(f) { const r = await fetch(f); if (!r.ok) throw new Error(f); const buf = new Uint8Array(await r.arrayBuffer()); return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CTR', counter: buf.slice(0, 16), length: 64 }, await ebKey(), buf.slice(16))); }
  const ebC = new Map();
  const ebMemo = (k, fn) => { if (!ebC.has(k)) ebC.set(k, fn().catch((e) => { ebC.delete(k); throw e; })); return ebC.get(k); };
  const ebUrl = new Map();
  const ebImg = (f) => ebMemo(f, () => ebGet(f).then((u) => { const x = URL.createObjectURL(new Blob([u], { type: 'image/webp' })); ebUrl.set(f, x); return x; }));
  // 한 단원의 쪽별 단어: [{x0,x1,y0,y1,t,l}] (쪽 크기 대비 0~10000, l = 줄 번호)
  const ebTx = (c) => ebMemo(c.tx, () => ebGet(c.tx).then((u) => new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).json()).then((j) => { const o = {}; for (const [n, lines] of Object.entries(j)) { const W = []; lines.forEach(([y0, y1, f], l) => { for (let i = 0; i < f.length; i += 3) W.push({ x0: f[i], x1: f[i + 1], y0, y1, t: f[i + 2], l }); }); o[n] = W; } return o; }));
  const bkMarks = (cid, n) => Object.entries(bkS().marks).filter(([, m]) => m.c === cid && m.p === n);
  const bkProg = (b) => { const all = b.ch.filter((c) => !c.ref).flatMap((c) => c.pages.map((p) => `${b.id}:${p.n}`)); const seen = all.filter((k) => bkS().seen[k]).length; return { seen, all: all.length, pct: all.length ? Math.round((seen / all.length) * 100) : 0 }; };
  const BK_IC = { hist: 'scroll', sci: 'sci', eng: 'eng', eng2: 'books', kor: 'write', math: 'math', soc: 'globe' };
  function bookCard() {
    if (!EB.books.length) return '';
    const s = bkS(), M = Object.values(s.marks), n = M.length, qn = M.filter((m) => m.q).length, qa = M.filter((m) => m.q && (TEACHER ? !m.ans : m.ans && !m.ansSeen)).length, ln = M.filter((m) => m.later).length + Object.keys(s.pin).length;
    const book = (b) => { const p = bkProg(b), last = s.last[b.id]; return `<button class="lib-it bk-it" data-book="${b.id}" type="button"><span class="ico">${ic(BK_IC[b.id] || 'books')}</span><b>${esc(b.title)}</b><span class="tiny">${esc(b.pub)}</span><span class="bk-rg">${esc(b.range)}</span><span class="bk-pr"><i style="width:${p.pct}%"></i></span><span class="tiny">${p.seen ? `${p.pct}% 읽음${last ? ` · ${last.n}쪽부터` : ''}` : `${p.all}쪽 · 처음부터 읽기`}</span></button>`; };
    const row = (k, icn, t, d, cnt, red) => `<div class="li btnlike" data-bklist="${k}"><div class="ico">${ic(icn)}</div><div class="body"><div class="t">${t}</div><div class="d">${d}</div></div>${cnt ? `<span class="tag ${red ? 'red' : 'blue'}">${cnt}</span>` : ''}</div>`;
    return `<section class="card c8"><div class="card-h"><h2>시험 범위 책</h2><span class="tiny">기말고사 <b class="blue">D-${dday(EB_EXAM)}</b> · ${md(EB_EXAM)}부터</span></div>
      <div class="lib-grid bk-grid">${EB.books.map(book).join('')}</div></section>
      <section class="card c4"><div class="card-h"><h2>내 표시</h2></div><div class="list">${row('all', 'pencil', '칠한 곳', n ? `형광펜·밑줄 ${n}곳` : '단어를 끌어서 칠해요', n)}${row('later', 'star', '나중에 다시 보기', ln ? `${ln}곳 모아 뒀어요` : '☆ 를 누르면 모여요', ln)}${row('q', 'q', TEACHER ? '학생 질문' : '선생님께 질문', TEACHER ? (qa ? `답할 질문 ${qa}개` : qn ? '다 답했어요' : '아직 없어요') : qa ? `새 답 ${qa}개` : qn ? `질문 ${qn}개` : '칠한 곳을 눌러 물어봐요', qa, true)}</div></section>`;
  }
  // ───────── 기말 범위: 학교 교과서 목록으로 출판사를 미리 채우고, 범위는 학생이 들은 대로 적어요 ─────────
  // (선생님이 나중에 이걸 보고 교과서 PDF·문제를 맞춰요)
  const EX_DEF = [
    ['kor', '공통국어2', '비상교육 · 강호영', ''],
    ['math', '공통수학2', '동아출판 · 고호경', ''],
    ['eng', '공통영어2', '비상교육 · 홍민표', ''],
    ['soc', '통합사회2', '천재교과서 · 박윤경', ''],
    ['hist', '한국사2', '미래엔 · 강승호', ''],
    ['sci', '통합과학2', '동아출판 · 김호련', ''],
  ];
  const EX_IC = { kor: 'write', math: 'math', eng: 'eng', soc: 'globe', hist: 'scroll', sci: 'sci' };
  function exS() {
    if (!S.exam) S.exam = { subs: EX_DEF.map(([id, name, pub, range]) => ({ id, name, pub, range, by: 't' })), memo: '' };
    return S.exam;
  }
  function examCard() {
    const x = exS();
    const row = (u) => `<div class="li btnlike ex-row" data-exsub="${esc(u.id)}"><div class="ico">${ic(EX_IC[u.id] || 'books')}</div><div class="body"><div class="t">${esc(u.name)}${u.pub ? ` <span class="tiny">${esc(u.pub)}</span>` : ''}</div><div class="d ${u.range ? 'ex-rg' : ''}">${u.range ? esc(u.range) : '범위를 아직 몰라요 · 눌러서 적어요'}</div></div>${u.by === 's' ? `<span class="tag blue">${TEACHER ? '학생이 적음' : '내가 적음'}</span>` : u.range ? '<span class="tag">맞는지 확인</span>' : ''}</div>`;
    return `<section class="card c12"><div class="card-h"><h2>${ic('cal')} 기말 범위</h2><span class="tiny">기말고사 <b class="blue">D-${dday(EB_EXAM)}</b></span></div>
      <p class="sub" style="margin:0 0 8px">${TEACHER ? '「학생이 적음」 과목을 보고 교과서·문제를 맞춰요. 선생님이 고치면 학생에게 「맞는지 확인」으로 보여요' : '선생님이 말한 범위를 들은 대로 적어 주세요. 대충 줄글로 써도 돼요'}</p>
      <div class="list">${x.subs.map(row).join('')}</div>
      <div class="ex-memo li btnlike" data-exmemo><div class="ico">${ic('memo')}</div><div class="body"><div class="t">그 밖에 들은 것</div><div class="d ${x.memo ? 'ex-rg' : ''}">${x.memo ? esc(x.memo) : '수행평가, 서술형, 프린트처럼 과목에 안 맞는 것도 여기 적어요'}</div></div></div>
      <button class="btn block" type="button" data-exadd style="margin-top:12px">＋ 과목 더하기</button></section>`;
  }
  function exSheet(id) {
    const x = exS(), add = !id, u = add ? { id: 'x' + Date.now().toString(36), name: '', pub: '', range: '' } : id === '_memo' ? null : x.subs.find((y) => y.id === id);
    if (id !== '_memo' && !u) return;
    const html = id === '_memo'
      ? `<h2>그 밖에 들은 것</h2><div class="field"><textarea class="inp" id="ex-memo" rows="6" placeholder="예) 국어 수행평가 다음 주 화요일, 영어 서술형은 본문 그대로 나온대">${esc(x.memo || '')}</textarea></div>`
      : `<h2>${add ? '과목 더하기' : esc(u.name)}</h2>
        <div class="field"><label>과목</label><input class="inp" id="ex-name" value="${esc(u.name)}" placeholder="예) 과학탐구실험2"></div>
        <div class="field"><label>교과서 · 출판사</label><input class="inp" id="ex-pub" value="${esc(u.pub)}" placeholder="몰라도 괜찮아요"></div>
        <div class="field"><label>시험 범위</label><textarea class="inp" id="ex-range" rows="5" placeholder="선생님이 말한 대로 대충 적어도 돼요. 예) 3과 본문이랑 올림포스 1~2강, 프린트 7장까지">${esc(u.range)}</textarea></div>`;
    const btns = `<div class="row" style="gap:8px">${!add && id !== '_memo' ? '<button class="btn" type="button" id="ex-del">빼기</button>' : ''}<button class="btn primary block" type="button" id="ex-ok" style="flex:1">저장</button></div>`;
    sheet(html + btns, (el, close) => {
      const ok = $('#ex-ok', el); if (ok) ok.onclick = () => {
        if (id === '_memo') x.memo = $('#ex-memo', el).value.trim();
        else {
          const name = $('#ex-name', el).value.trim(); if (!name) { toast('과목 이름을 적어 주세요'); return; }
          const nu = { ...u, name, pub: $('#ex-pub', el).value.trim(), range: $('#ex-range', el).value.trim(), by: TEACHER ? 't' : 's', at: Date.now() };
          if (add) x.subs.push(nu); else x.subs[x.subs.indexOf(u)] = nu;
        }
        save('exam'); close(); render(); toast(TEACHER ? '저장했어요' : '저장했어요 · 선생님도 볼 수 있어요');
      };
      const del = $('#ex-del', el); if (del) del.onclick = () => { if (del.dataset.sure) { x.subs.splice(x.subs.indexOf(u), 1); save('exam'); close(); render(); toast('뺐어요'); } else { del.dataset.sure = '1'; del.textContent = '정말 빼기'; } };
    });
  }
  document.addEventListener('click', (e) => { const r = e.target.closest('[data-exsub]'); if (r) return exSheet(r.dataset.exsub); if (e.target.closest('[data-exmemo]')) return exSheet('_memo'); if (e.target.closest('[data-exadd]')) exSheet(); });
  function bookView() {
    return `<h1 class="h1">기말 교과서</h1><p class="sub">기말 범위를 적고, 시험 범위 교과서를 읽으면서 형광펜·밑줄을 긋고, 모르는 곳은 선생님께 물어봐요</p><div class="grid">${examCard()}${bookCard() || `<section class="card c12"><div class="empty">${gh('sleepy', 'gh-empty')}<b>아직 교과서가 없어요</b></div></section>`}</div>`;
  }
  function bookOpen(id, cid, n, mk) {
    const b = EB.books.find((x) => x.id === id); if (!b) return;
    const last = bkS().last[id], c = cid && ebFind(cid) ? ebFind(cid).c : null;
    const pn = n != null ? n : c ? c.pages[0].n : last && last.n ? last.n : (b.ch.find((x) => !x.ref) || b.ch[0]).pages[0].n;
    UI.run = { kind: 'book', b: id, n: pn, mk, back: UI.run && UI.run.kind === 'book' ? UI.run.back : UI.tab };
    render(); window.scrollTo(0, 0);
  }
  // 책 한 권의 쪽을 단원 구분 없이 이어서 (넘기면 다음 단원으로 그대로 이어짐)
  const bkPages = (b) => b.ch.flatMap((c) => c.pages.map((p) => ({ ...p, c })));
  const bkOne = () => { if (UI.bkOne == null) { try { UI.bkOne = localStorage.getItem('mu:bk1') === '1'; } catch (e) { UI.bkOne = false; } } return UI.bkOne; };
  const bkWide = () => innerWidth >= 1100 && !bkOne();
  // 펼침: 짝수 쪽이 왼쪽 (교과서처럼), 바로 다음 쪽이 이어질 때만 두 쪽
  function bkSpread(P, i) {
    if (!bkWide()) return [i];
    if (P[i].n % 2 && P[i - 1] && P[i - 1].n === P[i].n - 1) i -= 1;
    return P[i + 1] && P[i + 1].n === P[i].n + 1 && P[i].n % 2 === 0 ? [i, i + 1] : [i];
  }
  const bkHint = (tool) => tool === 'read' ? '옆으로 밀거나 ‹ › 로 넘겨요 · 칠한 곳을 누르면 질문을 남겨요' : `단어 위를 쭉 끌어 ${tool === 'hl' ? '칠해요' : '밑줄을 그어요'} · 끄려면 ${tool === 'hl' ? '형광펜' : '밑줄'}을 한 번 더 눌러요`;
  function bookRun() {
    const r = UI.run, b = EB.books.find((x) => x.id === r.b); if (!b) return '';
    const P = bkPages(b), i = Math.max(0, P.findIndex((p) => p.n === r.n)), sp = bkSpread(P, i), c = P[sp[0]].c, tool = UI.bkTool || 'read';
    const toc = b.ch.map((x) => { const sn = x.pages.filter((p) => bkS().seen[`${b.id}:${p.n}`]).length, mk = Object.values(bkS().marks).filter((m) => m.c === x.id).length; return `<button type="button" class="bk-ti ${x.id === c.id ? 'on' : ''} ${x.ref ? 'ref' : ''}" data-bkn="${x.pages[0].n}"><span class="bk-tn">${esc(x.no)}</span><span class="bk-tt">${esc(x.t)}<span class="tiny">${x.a}~${x.b}쪽${mk ? ` · 칠한 곳 ${mk}` : ''}</span></span><span class="bk-td ${sn >= x.pages.length ? 'all' : sn ? 'some' : ''}"></span></button>`; }).join('');
    const pg = (p) => { const pin = bkS().pin[`${p.c.id}:${p.n}`]; const u = ebUrl.get(p.f); return `<div class="bk-pg ${u ? 'ok' : ''}" data-pg="${p.n}" data-r="${p.r}"><img alt="${p.n}쪽" draggable="false" ${u ? `src="${u}"` : ''}><div class="bk-ly" data-ly="${p.n}"></div><button type="button" class="bk-pin ${pin ? 'on' : ''}" data-pin="${p.n}" aria-label="이 쪽 나중에 다시 보기">${pin ? '★' : '☆'}</button><span class="bk-no">${p.n}쪽</span></div>`; };
    const first = sp[0] === 0, last = sp[sp.length - 1] >= P.length - 1;
    return `<div class="bk-wrap ${tool !== 'read' ? 'pen' : ''} ${bkOne() && innerWidth >= 1100 ? 'one' : ''}">
      <div class="bk-top"><button class="btn sm" type="button" data-bkback>‹ ${esc((TABS.find((t) => t[0] === (r.back || 'book')) || ['', '교과서'])[1])}</button><div class="bk-hd"><b>${esc(b.title)}</b><span>${esc(c.no)} ${esc(c.t)}${c.ref ? ' <span class="tag">참고</span>' : ''}</span></div>${innerWidth >= 1100 ? `<button class="btn sm" type="button" id="bk-one">${bkOne() ? '두 쪽 보기' : '한 쪽 크게'}</button>` : ''}<button class="btn sm" type="button" id="bk-toc">목차</button></div>
      <aside class="bk-side"><div class="row between" style="padding:0 8px 8px"><span class="tiny">${esc(b.pub)} · ${esc(b.range)}</span><button class="btn sm" type="button" id="bk-tocx">닫기</button></div>${toc}</aside>
      <div class="bk-stage" id="bk-stage"><button type="button" class="bk-arr l" data-turn="-1" ${first ? 'disabled' : ''} aria-label="앞 쪽">‹</button><div class="bk-spread ${sp.length > 1 ? 'two' : ''}" id="bk-spread">${sp.map((k) => pg(P[k])).join('')}</div><button type="button" class="bk-arr r" data-turn="1" ${last ? 'disabled' : ''} aria-label="다음 쪽">›</button></div>
      <div class="bk-bar"><input type="range" class="bk-sl" id="bk-sl" min="0" max="${P.length - 1}" value="${sp[0]}" aria-label="쪽 고르기"><span class="bk-pn num">${sp.map((k) => P[k].n).join('~')}쪽 <span class="tiny">/ ${P.length}쪽 중 ${sp[sp.length - 1] + 1}</span></span></div>
      <div class="bk-tools" role="toolbar" aria-label="읽기 도구">${[['hl', '형광펜'], ['ul', '밑줄']].map(([k, t]) => `<button type="button" class="bk-tl ${tool === k ? 'on' : ''}" data-tool="${k}" aria-pressed="${tool === k}"><i class="bk-sw ${k}"></i>${t}</button>`).join('')}<span class="bk-sep"></span><button type="button" class="bk-tl" data-bklist="all">모아 보기</button></div>
      <p class="bk-hint">${bkHint(tool)}</p></div>`;
  }
  function bkDraw(ly, W, cid, n, tmp) {
    const seg = (s, e) => { const L = {}; for (let i = Math.min(s, e); i <= Math.max(s, e); i++) { const w = W[i]; if (!w) continue; const o = L[w.l] || (L[w.l] = { x0: w.x0, x1: w.x1, y0: w.y0, y1: w.y1 }); o.x0 = Math.min(o.x0, w.x0); o.x1 = Math.max(o.x1, w.x1); o.y0 = Math.min(o.y0, w.y0); o.y1 = Math.max(o.y1, w.y1); } return Object.values(L); };
    const box = (o, cls, id, last, badge) => `<div class="bk-mk ${cls}" ${id ? `data-mk="${id}"` : ''} style="left:${o.x0 / 100 - 0.3}%;top:${o.y0 / 100 - 0.2}%;width:${(o.x1 - o.x0) / 100 + 0.6}%;height:${(o.y1 - o.y0) / 100 + 0.4}%">${last && badge ? `<span class="bk-bd">${badge}</span>` : ''}</div>`;
    let h = '';
    for (const [id, m] of bkMarks(cid, n)) { const sg = seg(m.s, m.e); sg.forEach((o, k) => (h += box(o, m.k + (UI.run && UI.run.mk === id ? ' flash' : ''), id, k === sg.length - 1, (m.later ? '★' : '') + (m.q ? '?' : m.note ? '✎' : '') + (m.ans ? '✓' : '')))); }
    if (tmp) seg(tmp.s, tmp.e).forEach((o) => (h += box(o, tmp.k + ' tmp')));
    ly.innerHTML = h;
  }
  // 칠한 글자: 단어 사이가 좁으면 붙여 쓰고(1945년), 넓으면 띄움, 줄이 바뀌면 띄움
  const bkTxt = (W, a, z) => { let t = ''; for (let i = a; i <= z; i++) { const w = W[i], p = W[i - 1]; if (i > a) t += p.l !== w.l || w.x0 - p.x1 > (w.y1 - w.y0) * 0.1 ? ' ' : ''; t += w.t; } return t.slice(0, 300); };
  function bkHit(W, x, y) {
    let best = -1, bd = 1e9;
    for (let i = 0; i < W.length; i++) { const w = W[i]; const dy = y < w.y0 ? w.y0 - y : y > w.y1 ? y - w.y1 : 0; const dx = x < w.x0 ? w.x0 - x : x > w.x1 ? x - w.x1 : 0; const d = dy * 4 + dx; if (d < bd) { bd = d; best = i; } }
    return bd < 600 ? best : -1;
  }
  function bindBook() {
    const r = UI.run, b = EB.books.find((x) => x.id === r.b); if (!b) return;
    const s = bkS(), P = bkPages(b), i0 = Math.max(0, P.findIndex((p) => p.n === r.n)), sp = bkSpread(P, i0);
    s.last[b.id] = { c: P[sp[0]].c.id, n: P[sp[0]].n };
    const go = (n, dir) => { if (n === r.n) return; UI.run = { ...r, n, mk: null, dir }; const y = scrollY; render(); window.scrollTo(0, bkOne() && innerWidth >= 1100 ? 0 : y); };
    const turn = (d) => { const k = d > 0 ? sp[sp.length - 1] + 1 : sp[0] - 1; if (P[k]) go(P[k].n, d); };
    $('[data-bkback]').onclick = () => { UI.run = null; UI.tab = r.back || 'book'; document.onkeydown = null; render(); };
    $$('[data-bkn]').forEach((x) => (x.onclick = () => go(+x.dataset.bkn, 0)));
    $('#bk-toc').onclick = () => $('.bk-side').classList.toggle('open');
    const one = $('#bk-one'); if (one) one.onclick = () => { UI.bkOne = !bkOne(); try { localStorage.setItem('mu:bk1', UI.bkOne ? '1' : '0'); } catch (e) {} render(); };
    $('#bk-tocx').onclick = () => $('.bk-side').classList.remove('open');
    $$('[data-turn]').forEach((x) => (x.onclick = () => turn(+x.dataset.turn)));
    const sl = $('#bk-sl'); sl.oninput = () => { $('.bk-pn').firstChild.textContent = `${P[+sl.value].n}쪽 `; }; sl.onchange = () => go(P[+sl.value].n, 0);
    document.onkeydown = (e) => { if (!UI.run || UI.run.kind !== 'book' || $('.sheet') || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) return; if (e.key === 'ArrowRight') turn(1); if (e.key === 'ArrowLeft') turn(-1); };
    $$('[data-tool]').forEach((x) => (x.onclick = () => {
      UI.bkTool = (UI.bkTool || 'read') === x.dataset.tool ? 'read' : x.dataset.tool;
      const t = UI.bkTool; $('.bk-wrap').classList.toggle('pen', t !== 'read');
      $$('[data-tool]').forEach((y) => { y.classList.toggle('on', y.dataset.tool === t); y.setAttribute('aria-pressed', y.dataset.tool === t); });
      $('.bk-hint').textContent = bkHint(t);
    }));
    $$('[data-pin]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); const p = P.find((q) => q.n === +x.dataset.pin), k = `${p.c.id}:${p.n}`; if (s.pin[k]) delete s.pin[k]; else s.pin[k] = Date.now(); save('book'); const on = !!s.pin[k]; x.classList.toggle('on', on); x.textContent = on ? '★' : '☆'; toast(on ? `${p.n}쪽을 나중에 다시 볼게요` : '뺐어요'); }));
    // 화면에 꼭 맞게 쪽 크기 정하기
    const stage = $('#bk-stage'), spread = $('#bk-spread');
    const fit = () => { if (!stage.isConnected) { removeEventListener('resize', fit); return; } const pgs = $$('.bk-pg', spread), W = stage.clientWidth - (bkWide() ? 112 : 0), H = Math.max(320, innerHeight - stage.getBoundingClientRect().top - (innerWidth < 900 ? 230 : 150)); for (const pg of pgs) { const rr = +pg.dataset.r, w = bkOne() && innerWidth >= 1100 ? Math.min(W, 1000) : Math.min(W / pgs.length, H / rr); pg.style.width = w + 'px'; pg.style.height = w * rr + 'px'; } };
    fit(); addEventListener('resize', fit);
    if (r.dir && !RM()) { spread.classList.add(r.dir > 0 ? 'in-r' : 'in-l'); r.dir = 0; }
    // 쪽 그림·글자 불러오기 (앞뒤 쪽은 미리)
    for (const k of sp) {
      const p = P[k], pg = $(`.bk-pg[data-pg="${p.n}"]`);
      if (!pg.classList.contains('ok')) ebImg(p.f).then((u) => { const im = $('img', pg); im.onload = () => pg.classList.add('ok'); im.src = u; }).catch(() => pg.classList.add('err'));
      ebTx(p.c).then((T) => { pg.W = T[p.n] || []; bkDraw($('.bk-ly', pg), pg.W, p.c.id, p.n); });
    }
    for (const k of [sp[0] - 2, sp[0] - 1, sp[sp.length - 1] + 1, sp[sp.length - 1] + 2]) if (P[k]) ebImg(P[k].f).catch(() => {});
    clearTimeout(bindBook.seen); bindBook.seen = setTimeout(() => { let ch = false; for (const k of sp) { const key = `${b.id}:${P[k].n}`; if (!s.seen[key]) { s.seen[key] = 1; ch = true; } } if (ch) save('book'); }, 1200);
    // 밀어서 넘기기 (읽기 모드)
    let sw = null;
    stage.onpointerdown = (e) => { if ((UI.bkTool || 'read') !== 'read' || e.target.closest('[data-mk],button,input') || e.pointerType === 'mouse' && e.button) return; sw = { x: e.clientX, y: e.clientY, id: e.pointerId }; };
    stage.onpointermove = (e) => { if (!sw || e.pointerId !== sw.id) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) spread.style.transform = `translateX(${dx * 0.6}px)`; };
    stage.onpointerup = stage.onpointercancel = (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; spread.style.transform = ''; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) turn(dx < 0 ? 1 : -1); };
    // 칠하기
    $$('.bk-ly').forEach((ly) => {
      const pg = ly.closest('.bk-pg'), n = +ly.dataset.ly, c = P.find((q) => q.n === n).c;
      ly.onclick = (e) => { const mk = e.target.closest('[data-mk]'); if (mk && (UI.bkTool || 'read') === 'read') bkMarkSheet(mk.dataset.mk, null); };
      let drag = null;
      const pos = (e) => { const rc = ly.getBoundingClientRect(); return [((e.clientX - rc.left) / rc.width) * 10000, ((e.clientY - rc.top) / rc.height) * 10000]; };
      ly.onpointerdown = (e) => { const tool = UI.bkTool || 'read'; if (tool === 'read' || !pg.W || !pg.W.length) return; const i = bkHit(pg.W, ...pos(e)); if (i < 0) return; e.preventDefault(); e.stopPropagation(); ly.setPointerCapture(e.pointerId); drag = { s: i, e: i, k: tool }; bkDraw(ly, pg.W, c.id, n, drag); };
      ly.onpointermove = (e) => { if (!drag) return; const i = bkHit(pg.W, ...pos(e)); if (i >= 0 && i !== drag.e) { drag.e = i; bkDraw(ly, pg.W, c.id, n, drag); } };
      ly.onpointerup = ly.onpointercancel = (e) => {
        if (!drag) return; e.stopPropagation(); const d = drag; drag = null;
        const a = Math.min(d.s, d.e), z = Math.max(d.s, d.e), id = 'm' + Date.now().toString(36);
        if (a === z) { const hit = bkMarks(c.id, n).find(([, m]) => a >= m.s && a <= m.e); if (hit) { bkDraw(ly, pg.W, c.id, n); bkMarkSheet(hit[0], null); return; } }
        s.marks[id] = { b: b.id, c: c.id, p: n, s: a, e: z, k: d.k, txt: bkTxt(pg.W, a, z), at: Date.now() };
        save('book'); bkDraw(ly, pg.W, c.id, n); toast(d.k === 'hl' ? '칠했어요 · 칠한 곳을 누르면 질문을 남길 수 있어요' : '밑줄 그었어요');
      };
    });
  }
  function bkMarkSheet(id, onBack) {
    const s = bkS(), m = s.marks[id]; if (!m) return;
    const f = ebFind(m.c), b = f && f.b;
    if (!TEACHER && m.ans && !m.ansSeen) { m.ansSeen = true; save('book'); nav(); }
    sheet(`<p class="eyebrow" style="margin:0 0 8px">${esc(b ? b.title : '')} · ${esc(f ? f.c.no + ' ' + f.c.t : '')} · ${m.p}쪽</p>
      <blockquote class="bk-quote ${m.k}">${esc(m.txt)}</blockquote>
      <div class="chips multi" style="flex-wrap:wrap;margin:12px 0"><button type="button" class="chip ${m.k === 'hl' ? 'on' : ''}" data-mkk="hl">형광펜</button><button type="button" class="chip ${m.k === 'ul' ? 'on' : ''}" data-mkk="ul">밑줄</button><button type="button" class="chip ${m.later ? 'on' : ''}" data-mkl>★ 나중에 다시 보기</button><button type="button" class="chip ${m.q ? 'on' : ''}" data-mkq>? 선생님께 질문</button></div>
      <div class="field"><label>${m.q ? '선생님께 물어볼 것' : '내 생각 · 메모'}</label><textarea class="inp" id="mk-note" rows="3" placeholder="${m.q ? '예) 신탁 통치 반대와 찬성이 왜 갈렸는지 모르겠어요' : '예) 이 부분은 연표로 외우기'}" ${TEACHER ? 'readonly' : ''}>${esc(m.note || '')}</textarea></div>
      ${TEACHER ? `<div class="field"><label>선생님 답</label><textarea class="inp" id="mk-ans" rows="3" placeholder="답을 적으면 학생 화면에 보여요">${esc(m.ans || '')}</textarea></div>` : m.ans ? `<div class="explain"><b>선생님 답</b><br>${esc(m.ans)}</div>` : ''}
      <div class="row" style="margin-top:20px"><button class="btn big" style="flex:1" id="mk-del" type="button">지우기</button><button class="btn primary big" style="flex:1" id="mk-ok" type="button">저장</button></div>
      ${onBack ? '' : `<button class="btn block" style="margin-top:8px" type="button" id="mk-go">교과서에서 이 부분 보기</button>`}`, (el, close) => {
      const keep = () => { const nt = $('#mk-note', el); if (nt && !TEACHER) m.note = nt.value.trim(); const an = $('#mk-ans', el); if (an && an.value.trim() !== (m.ans || '')) { m.ans = an.value.trim(); m.ansSeen = false; } };
      const redraw = () => { const ly = $(`.bk-ly[data-ly="${m.p}"]`), pg = ly && ly.closest('.bk-pg'); if (ly && pg.W) bkDraw(ly, pg.W, m.c, m.p); };
      $$('[data-mkk]', el).forEach((x) => (x.onclick = () => { m.k = x.dataset.mkk; $$('[data-mkk]', el).forEach((y) => y.classList.toggle('on', y === x)); }));
      $('[data-mkl]', el).onclick = (e) => { m.later = !m.later; e.currentTarget.classList.toggle('on', m.later); };
      $('[data-mkq]', el).onclick = (e) => { m.q = !m.q; e.currentTarget.classList.toggle('on', m.q); };
      $('#mk-ok', el).onclick = () => { keep(); save('book'); close(); redraw(); if (onBack) onBack(); else if (!UI.run || UI.run.kind !== 'book') render(); toast(m.q && !TEACHER ? '질문을 남겼어요. 선생님이 답하면 여기 보여요' : '저장했어요'); };
      $('#mk-del', el).onclick = () => { delete s.marks[id]; save('book'); close(); redraw(); if (onBack) onBack(); else if (!UI.run || UI.run.kind !== 'book') render(); toast('지웠어요'); };
      const go = $('#mk-go', el); if (go) go.onclick = () => { keep(); save('book'); close(); bookOpen(m.b, m.c, m.p, id); };
    });
  }
  function bkListSheet(flt0) {
    const s = bkS(), T = { all: '칠한 곳', later: '나중에 다시 보기', q: TEACHER ? '학생 질문' : '선생님께 질문' };
    const body = (flt) => {
      const items = [...Object.entries(s.marks).map(([id, m]) => ({ id, ...m })), ...Object.entries(s.pin).map(([k, at]) => { const cid = k.slice(0, k.lastIndexOf(':')), n = +k.slice(k.lastIndexOf(':') + 1), f = ebFind(cid); return f ? { pin: true, b: f.b.id, c: cid, p: n, at, later: true } : null; }).filter(Boolean)]
        .filter((x) => flt === 'all' ? !x.pin : flt === 'later' ? x.later : x.q)
        .sort((a, b) => a.b.localeCompare(b.b) || a.p - b.p || a.at - b.at);
      return items.length ? `<div class="list bk-list">${items.map((x) => { const f = ebFind(x.c); return `<button type="button" class="li btnlike" ${x.pin ? `data-bkpg="${esc(x.c)}|${x.p}"` : `data-bkmk="${esc(x.id)}"`}><div class="body"><div class="tiny">${esc(f.b.title)} · ${esc(f.c.no)} · ${x.p}쪽${x.later ? ' · ★' : ''}${x.q ? (x.ans ? ' · <b class="blue">답 왔어요</b>' : ' · <b class="red">질문</b>') : ''}</div><div class="t">${x.pin ? '이 쪽 전체' : `<span class="bk-qt ${x.k}">${esc(x.txt)}</span>`}</div>${x.note ? `<div class="d">${esc(x.note)}</div>` : ''}${x.ans ? `<div class="d blue">선생님: ${esc(x.ans)}</div>` : ''}</div></button>`; }).join('')}</div>`
        : `<div class="empty">${gh('idle', 'gh-empty')}<b>아직 없어요</b><span>${flt === 'q' ? '칠한 곳을 눌러 「선생님께 질문」을 고르면 여기 모여요' : flt === 'later' ? '쪽 오른쪽 위 ☆ 이나 칠한 곳의 「나중에 다시 보기」를 누르면 모여요' : '교과서에서 형광펜이나 밑줄을 고르고 단어를 끌어 보세요'}</span></div>`;
    };
    sheet(`<h2 id="bkl-h">${T[flt0]}</h2><div class="chips" style="margin:0 0 12px">${Object.entries(T).map(([k, t]) => `<button type="button" class="chip ${flt0 === k ? 'on' : ''}" data-bkf="${k}">${t}</button>`).join('')}</div><div id="bkl">${body(flt0)}</div>`, (el, close) => {
      const bindL = () => {
        $$('[data-bkmk]', el).forEach((x) => (x.onclick = () => { const m = s.marks[x.dataset.bkmk]; close(); bookOpen(m.b, m.c, m.p, x.dataset.bkmk); }));
        $$('[data-bkpg]', el).forEach((x) => (x.onclick = () => { const [cid, n] = x.dataset.bkpg.split('|'); const f = ebFind(cid); close(); bookOpen(f.b.id, cid, +n); }));
      };
      $$('[data-bkf]', el).forEach((x) => (x.onclick = () => { const f = x.dataset.bkf; $$('[data-bkf]', el).forEach((y) => y.classList.toggle('on', y === x)); segRe(x.parentNode); $('#bkl-h', el).textContent = T[f]; $('#bkl', el).innerHTML = body(f); bindL(); }));
      bindL();
    });
  }
  document.addEventListener('click', (e) => { const bl = e.target.closest('[data-bklist]'); if (bl) { e.stopPropagation(); bkListSheet(bl.dataset.bklist); return; } const bb = e.target.closest('[data-book]'); if (bb) bookOpen(bb.dataset.book); });
  function hwView() {
    const sd = sciToday(), st = dayStat(sd), ed = engToday();
    const un = CH_UNITS[ed.unit];
    const wl = wordsFor(ed.words), wdone = Object.keys(ed.wans || {}).length;
    // 꾸준히 (최근 28일)
    const days = []; for (let i = 27; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); }
    const lvl = (d) => { const s = S.sci.days[d], e = S.eng.days[d]; let n = 0; if ((S.logs || []).some((x) => x.date === d)) n++; if (s && dayStat(s).done >= dayStat(s).n && dayStat(s).n) n++; if (e && e.udone) n++; if (e && Object.keys(e.wans || {}).length >= 10) n++; return n; };
    const streak = (() => { let n = 0; for (let i = days.length - 1; i >= 0; i--) { const wk = new Date(days[i] + 'T00:00:00'); if (lvl(days[i])) n++; else if (!anyTask(wk)) continue; else if (i !== days.length - 1) break; } return n; })();
    const hwList = S.hw || [];
    return `<h1 class="h1">오늘의 숙제</h1><div class="row between wrap" style="gap:8px;margin-bottom:16px"><p class="sub" style="margin:0">${todayLine()}</p><button class="btn sm" id="plan-open" type="button"><svg class="gear" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#8b95a1" stroke="#8b95a1" stroke-width="1.8" stroke-linejoin="round" fill-rule="evenodd" d="M10.3 2h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.6.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6L2 13.7v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7zM12 15.9a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8z"/></svg> 숙제 설정</button></div>
    <div class="grid">
      ${(() => {
        const { tasks } = todayTasks(), real = tasks.filter((t) => t.icon !== 'party'), dn = real.filter((t) => t.done).length;
        const by = (a, b) => String(a.due || '').localeCompare(String(b.due || ''));
        const later = TEACHER ? hwList.filter((h) => !hwDone(h) && h.due && h.due > today()).sort(by) : [], done = hwList.filter((h) => hwDone(h)).sort(by).reverse();
        const hrow = (h, later) => `<div class="li btnlike" data-hwopen="${esc(h.id)}"><button class="ico" data-hwdone="${esc(h.id)}" style="border:0;cursor:pointer" aria-label="완료">${ic(hwDone(h) ? 'ok' : 'pin')}</button><div class="body"><div class="t" style="${hwDone(h) ? 'color:var(--t3);text-decoration:line-through' : later ? 'color:var(--t2);font-weight:500' : ''}">${esc(h.title)}</div><div class="d">${[h.subj, h.due ? md(h.due) + (later ? ' 숙제' : '') : ''].filter(Boolean).map(esc).join(' · ')}</div></div>${TEACHER ? `<button class="btn sm" data-hwdel="${esc(h.id)}" type="button">지우기</button>` : ''}<span class="chev"></span></div>`;
        const row = (t) => `<div class="li btnlike ${t.done ? 'is-done' : ''}" ${t.hw ? `data-hwopen="${esc(t.hw)}"` : `data-task="${esc(t.k)}"`}><div class="ico">${ic(t.done ? 'ok' : t.icon)}</div><div class="body"><div class="t">${esc(t.t)}${t.hw ? ' <span class="tag">선생님</span>' : ''}</div><div class="d">${esc(t.d)}</div></div>${t.done ? '<span class="tag blue">끝</span>' : '<span class="chev"></span>'}</div>`;
        const tog = (pn, label, n) => n ? `<button type="button" data-pn="${pn}" data-lb="${label} <b>${n}</b>" onclick="const s=this.closest('section'),p=s.querySelector('[data-pane='+this.dataset.pn+']'),o=p.hidden;s.querySelectorAll('.hw-pane').forEach(x=>x.hidden=true);this.parentNode.querySelectorAll('button[data-lb]').forEach(b=>{b.classList.remove('on');b.innerHTML=b.dataset.lb});if(o){p.hidden=false;this.classList.add('on');this.textContent='접기'}">${label} <b>${n}</b></button>` : '';
        return `<section class="card c12"><div class="card-h"><h2>오늘 할 것</h2>${real.length ? `<span class="tiny">${real.length}개 중 <b class="${dn === real.length ? 'blue' : ''}">${dn}개</b> 끝</span>` : ''}${TEACHER ? '<button class="btn sm soft" id="hw-add" type="button">숙제 내기</button>' : ''}</div>
          ${real.length ? `<div class="td-prog"><i style="width:${(dn / real.length) * 100}%"></i></div>` : ''}
          ${real.length ? `<div class="list">${[...real.filter((t) => !t.done), ...real.filter((t) => t.done)].map(row).join('')}</div>${dn === real.length ? `<div class="td-all">${gh('yay', 'gh-td')}<span>오늘 할 것을 다 끝냈어요</span></div>` : ''}` : `<div class="empty" style="padding:16px 0">${gh('sleepy', 'gh-empty')}<b>오늘은 쉬는 날이에요</b></div>`}
          ${later.length || done.length ? `<div class="hw-tog">${tog('later', '앞으로 낼 숙제', later.length)}${tog('done', '끝낸 숙제', done.length)}</div>
          ${later.length ? `<div class="hw-pane list" data-pane="later" hidden>${later.map((h) => hrow(h, true)).join('')}</div>` : ''}${done.length ? `<div class="hw-pane list" data-pane="done" hidden>${done.map((h) => hrow(h)).join('')}</div>` : ''}` : ''}</section>`;
      })()}
      ${inkCard('c12')}
      ${drillCard()}
      ${libCard()}
      <section class="card c4 col-card mid"><div class="card-h"><h2>꾸준히</h2><span class="tag blue">${streak}일 연속</span></div><div class="streak">${days.map((d) => `<i class="${lvl(d) ? 'l' + lvl(d) : ''} ${d === today() ? 'today' : ''}" title="${d}" data-day="${d}" role="button" tabindex="0"></i>`).join('')}</div><p class="tiny" style="margin:12px 0 0">최근 4주 · 진할수록 많이 했어요 · 날짜를 누르면 그날 한 것이 보여요</p></section>
    </div>`;
  }
  function planSheet() {
    const P = {}; for (const x of PLAN_KINDS) P[x.k] = planOf(x.k).slice();
    const order = [1, 2, 3, 4, 5, 6, 0];
    const PRE = [{ t: '평일', d: [1, 2, 3, 4, 5] }, { t: '월수금', d: [1, 3, 5] }, { t: '화목', d: [2, 4] }, { t: '매일', d: [0, 1, 2, 3, 4, 5, 6] }];
    const PIC = { sci: 'sci', unit: 'eng', words: 'books', g3: 'write' };
    const sum = (k) => P[k].length ? (P[k].length === 7 ? '매일' : P[k].length === 5 && order.slice(0, 5).every((d) => P[k].includes(d)) ? '평일 매일' : order.filter((d) => P[k].includes(d)).map((d) => DOW[d]).join(' ') + ` · 주 ${P[k].length}회`) : '쉬어요';
    const draw = (el) => {
      $('#pl-body', el).innerHTML = PLAN_KINDS.map((x) => `<div class="pl-item"><div class="pl-h">${ic(PIC[x.k] || 'pin')}<div><b>${esc(x.t)}</b><span class="${P[x.k].length ? 'blue' : ''}">${sum(x.k)}</span></div></div>
        <div class="pl-dots">${order.map((d) => `<button type="button" class="${P[x.k].includes(d) ? 'on' : ''} ${d === 0 ? 'sun' : d === 6 ? 'sat' : ''}" data-pd="${x.k}:${d}" aria-pressed="${P[x.k].includes(d)}">${DOW[d]}</button>`).join('')}</div></div>`).join('');
      $$('[data-pd]', el).forEach((b) => (b.onclick = () => { const [k, d] = b.dataset.pd.split(':'); const n = +d; P[k] = P[k].includes(n) ? P[k].filter((y) => y !== n) : [...P[k], n]; draw(el); }));
    };
    sheet(`<h2>숙제 설정</h2><p class="sub">과제마다 하는 요일을 골라요. 고른 날에만 「오늘 할 일」에 나와요</p>
      <div class="pl-all"><span class="tiny">모두 한 번에</span><div class="row" style="gap:6px">${PRE.map((p, i) => `<button type="button" class="chip sm" data-all="${i}">${p.t}</button>`).join('')}</div></div>
      <div id="pl-body"></div><button class="btn primary big block" id="pl-ok" type="button" style="margin-top:20px">저장하기</button>`, (el, close) => {
      draw(el);
      $$('[data-all]', el).forEach((b) => (b.onclick = () => { for (const x of PLAN_KINDS) P[x.k] = PRE[+b.dataset.all].d.slice(); draw(el); }));
      $('#pl-ok', el).onclick = () => { S.plan = P; save('plan'); close(); render(); toast('숙제 설정을 바꿨어요'); };
    });
  }
  // 지난 기록: 꾸준히 칸의 날짜를 누르면 그날 한 것
  function daySheet(d) {
    const out = [], s = (S.sci.days || {})[d], e = (S.eng.days || {})[d];
    if (s) { const st = dayStat(s), c = SCI.concepts.find((x) => x.id === s.c); if (st.done) out.push({ i: 'sci', t: c ? `과학 · ${c.title}` : '오늘의 과학', d: `${st.n}문제 중 ${st.done}개 풀고 ${st.ok}개 맞힘` }); }
    if (e) {
      if (e.udone) { const un = CH_UNITS[e.unit]; out.push({ i: 'eng', t: `천일문 ${un ? 'Unit ' + un.unit + ' ' + (un.title || '') : ''}`.trim(), d: '다 했어요' }); }
      const wn = Object.keys(e.wans || {}).length; if (wn) out.push({ i: 'books', t: '워드마스터 단어 시험', d: `${wn}개 중 ${Object.values(e.wans).filter((x) => x.ok).length}개 맞힘` });
      if (e.g3done) { const g = G3[e.g3 || 0]; out.push({ i: 'write', t: '고3 영어 한 문제', d: g ? `${g.type || ''} · ${g.src || ''}` : '풀었어요' }); }
    }
    for (const h of S.hw || []) if (hwDone(h) && (h.doneAt ? new Date(h.doneAt).toLocaleDateString('sv') === d : h.due === d)) out.push({ i: 'pin', t: h.title, d: '선생님 숙제 · 끝냄' });
    const pd = (pomo().days || {})[d]; if (pd && pd.n) out.push({ i: 'tomato', t: `토마토 ${pd.n}개`, d: `집중 ${pd.min || pd.n * 25}분` });
    for (const l of (S.logs || []).filter((x) => x.date === d)) out.push({ i: 'write', t: '학교에서 한 것', d: l.text || l.t || '' });
    const won = W().log.filter((x) => x.date === d).reduce((a, x) => a + x.amt, 0);
    const dt = new Date(d + 'T00:00:00'), wk = '일월화수목금토'[dt.getDay()];
    sheet(`<h2>${md(d)} (${wk})</h2><p class="sub">${d === today() ? '오늘 지금까지 한 것' : '이날 한 것'}${won ? ` · 용돈 +${won.toLocaleString()}원` : ''}</p>
      ${out.length ? `<div class="list">${out.map((x) => `<div class="li"><div class="ico">${ic('ok')}</div><div class="body"><div class="t">${esc(x.t)}</div><div class="d">${esc(x.d)}</div></div>${ic(x.i)}</div>`).join('')}</div>` : `<div class="empty">${gh('sleepy', 'gh-empty')}<b>이날은 기록이 없어요</b><span>쉬는 날도 필요해요</span></div>`}`);
  }
  function hwSheet(id) {
    const h = (S.hw || []).find((x) => x.id === id); if (!h) return;
    const key = Object.keys(SUBJ_NAMES).find((k) => SUBJ_NAMES[k] === h.subj || (h.subj === '한국사' && k === 'hist'));
    const mock = /모의/.test(h.title) && key;
    const ids = hwWr(h), left = ids.filter((id) => !wrTried(h, id)), fin = hwDone(h);
    const late = !fin && h.due && h.due < today();
    sheet(`<div class="row" style="gap:6px;margin-bottom:8px"><span class="tag">${esc(h.subj || '숙제')}</span>${h.due ? `<span class="tag ${late ? 'red' : ''}">${md(h.due)}${late ? ' · 밀림' : ''}</span>` : ''}${fin ? '<span class="tag blue">다 했어요</span>' : ''}</div>
      <h2 style="line-height:1.45">${esc(h.title)}</h2>
      ${h.memo ? `<div class="deep" style="margin:12px 0"><div class="eyebrow">이렇게 해요</div><p style="margin:4px 0 0">${esc(h.memo)}</p></div>` : ''}
      ${ids.length ? `<div class="list" style="margin:8px 0">${ids.map((id) => { const w = S.wrong[id], t = wrTried(h, id); return `<div class="li"><div class="ico">${ic(w.cleared || t ? 'ok' : 'pin')}</div><div class="body"><div class="t" style="font-size:15px">${esc(w.subjName || '')} ${w.no}번</div><div class="d">${esc(w.sub || w.area || '')}${t && !w.cleared ? ' · 나중에 한 번 더 나와요' : ''}</div></div><span class="tag ${w.cleared ? 'blue' : t ? '' : ''}">${w.cleared ? '맞혔어요' : t ? '풀었어요' : '아직'}</span></div>`; }).join('')}</div>
        <button class="btn primary big block" id="hs-go" type="button">${left.length ? `${left.length}문제 풀기` : '한 번 더 풀어 보기'}</button>` : mock ? `<p class="sub" style="margin:12px 0">10월 모의고사 ${esc(h.subj)} 문제는 오답 노트에 다 들어 있어요. 지문과 문제를 앱에서 바로 다시 풀 수 있어요</p><button class="btn soft big block" id="hs-wrong" type="button">${ic('retry')} 오답 노트에서 ${esc(SUBJ_NAMES[key])} 풀기</button>` : ''}
      <div class="row" style="margin-top:16px"><button class="btn big" style="flex:1" data-x type="button">닫기</button>${ids.length ? '' : `<button class="btn ${h.done ? '' : 'primary'} big" style="flex:1" id="hs-done" type="button">${h.done ? '안 한 걸로 되돌리기' : '다 했어요'}</button>`}</div>`, (el, close) => {
      $('[data-x]', el).onclick = close;
      const go = $('#hs-go', el); if (go) go.onclick = () => { const q = left.length ? left : ids; close(); UI.tab = 'hw'; UI.run = { kind: 'retry', id: q[0], queue: q.slice(1), back: 'hw' }; render(); window.scrollTo(0, 0); };
      const dn = $('#hs-done', el); if (dn) dn.onclick = () => { h.done = !h.done; h.doneAt = Date.now(); save('hw'); close(); render(); if (h.done) toast('잘했어요'); };
      const w = $('#hs-wrong', el); if (w) w.onclick = () => { close(); UI.wrongSubj = key; go('wrong'); };
    });
  }
  function hwAddSheet() {
    sheet(`<h2>숙제 내기</h2><p class="sub">${esc(U.who)}의 숙제 목록에 바로 보여요</p>
      <div class="field"><label>무엇을</label><input class="inp" id="h-t" placeholder="예) 수학 RPM 120~135쪽"></div>
      <div class="row" style="gap:12px"><div class="field" style="flex:1"><label>과목</label><select class="inp" id="h-s">${['국어', '수학', '영어', '한국사', '통합사회', '통합과학', '생기부', '기타'].map((s) => `<option>${s}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>언제까지</label><input class="inp" type="date" id="h-d"></div></div>
      <div class="field"><label>메모</label><input class="inp" id="h-m" placeholder="선택"></div>
      <button class="btn primary big block" id="h-ok" type="button">내기</button>`, (el, close) => {
      $('#h-ok', el).onclick = () => { const t = $('#h-t', el).value.trim(); if (!t) return; S.hw = S.hw || []; S.hw.push({ id: 'h' + Date.now(), title: t, subj: $('#h-s', el).value, due: $('#h-d', el).value, memo: $('#h-m', el).value.trim(), done: false, at: Date.now() }); save('hw'); close(); render(); toast('숙제를 냈어요'); };
    });
  }

  // ───────── 문제 풀기 화면 (과학 · 영어 · 오답 다시 풀기 공용) ─────────
  function qBody(q) {
    return `${q.q ? `<div class="q-text">${rich(q.q)}</div>` : ''}${q.box && q.box.length ? `<div class="q-box">${q.box.map((b) => `<div>${esc(b)}</div>`).join('')}</div>` : ''}${q.table && q.table.length ? `<div class="tbl-wrap"><table class="q-tbl">${q.table.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}`;
  }
  function choicesHtml(q, pick) {
    const done = pick != null;
    return `<div class="choices">${(q.choices || []).map((c, k) => `<button class="choice ${done ? (k === q.answer ? 'right' : k === pick ? 'wrong' : '') : ''}" data-pick="${k}" type="button" ${done ? 'disabled' : ''}><span class="n">${k + 1}</span><span>${rich(c)}</span></button>`).join('')}</div>`;
  }
  // 다 풀었을 때: 큰 흰 카드 가운데 아이콘 · 점수 · 한마디, 버튼은 아래에 크게
  // 3D 유령: 한 번만 도는 동작은 볼 때마다 처음부터 다시 돌도록 매번 새 주소(blob)로 붙여요
  const GH_NEXT = { hello: ['idle', 2000] }, GH_BLOB = {};
  const gh = (n, cls = '') => `<img class="gh ${cls}" data-gh="${n}" src="assets/ghost/${n}.png" alt="">`;
  function ghFill(root) {
    for (const img of (root || document).querySelectorAll('img[data-gh]:not([data-ghd])')) {
      const n = img.dataset.gh; img.dataset.ghd = '1'; if (RM()) continue;
      (GH_BLOB[n] = GH_BLOB[n] || fetch(`assets/ghost/${n}.webp`).then((r) => r.blob())).then((b) => { const u = URL.createObjectURL(b); img.src = u; setTimeout(() => URL.revokeObjectURL(u), 8000); const nx = GH_NEXT[n]; if (nx) setTimeout(() => { if (img.isConnected) { img.dataset.gh = nx[0]; delete img.dataset.ghd; ghFill(img.parentNode); } }, nx[1]); }).catch(() => {});
    }
  }
  new MutationObserver(() => ghFill(document)).observe(document.body, { childList: true, subtree: true });
  // ───────── 다 푼 뒤 「다시 풀기」 ─────────
  // 푼 답은 S.redo 에 잠깐 맡겨 두고 처음부터 다시 풀어요. 끝까지 다시 풀면 새 답이 남고,
  // 중간에 나가면 안 푼 문제는 맡겨 둔 답으로 되돌려요 (숙제가 「안 함」으로 바뀌지 않게)
  const redoKey = () => { const r = UI.run; if (!r) return ''; if (r.kind === 'sci') return 'sci:' + today(); if (r.kind === 'drill') return 'dr:' + r.id; if (r.kind === 'unit') { const un = CH_UNITS[r.ref != null ? r.ref : engToday(true).unit]; return r.ref != null ? 'ua:' + un.ch + '-' + un.unit : 'ud:' + today(); } if (r.kind === 'words') return r.day != null ? 'wa:' + r.day : 'wd:' + today(); return ''; };
  function redoStore(key) {
    const i = key.indexOf(':'), k = key.slice(0, i), a = key.slice(i + 1);
    return k === 'sci' ? [(S.sci.days[a] || {}).ans, 'sci'] : k === 'dr' ? [(S.drillAns || {})[a], 'drillAns'] : k === 'ud' ? [(S.eng.days[a] || {}).uans, 'eng'] : k === 'ua' ? [(S.eng.ua || {})[a], 'eng'] : k === 'wd' ? [(S.eng.days[a] || {}).wans, 'eng'] : k === 'wa' ? [(S.eng.wa || {})[a], 'eng'] : [null];
  }
  function redoStart() {
    const key = redoKey(), [st, sk] = redoStore(key); if (!st) return;
    S.redo = S.redo || {}; S.redo[key] = { ...(S.redo[key] || {}), ...st };
    for (const k of Object.keys(st)) delete st[k];
    UI.redoKey = key; UI.run = { ...UI.run, i: null, show: null, showing: false, mode: UI.run.kind === 'words' ? 'test' : UI.run.mode };
    save(sk, 'redo'); render(); window.scrollTo(0, 0);
  }
  // 지금 다시 푸는 중이 아닌 것은 안 푼 칸만 맡겨 둔 답으로 채우고 정리해요
  function redoFix() {
    if (!S.redo) return; let ch = false;
    for (const key of Object.keys(S.redo)) {
      if (key === UI.redoKey && redoKey() === key) continue;
      const [st, sk] = redoStore(key); if (st) { for (const [k, v] of Object.entries(S.redo[key])) if (!st[k]) st[k] = v; save(sk); }
      delete S.redo[key]; ch = true;
    }
    if (ch) save('redo');
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-redo-run]')) redoStart(); });
  function doneCard(ok, n, sub, btns, extra = '') {
    if (redoKey() && !TEACHER) { btns = btns.replace(/(<\/button>)/, '$1<button class="btn big block" data-redo-run type="button">다시 풀기</button>'); if (S.redo && S.redo[redoKey()]) { delete S.redo[redoKey()]; UI.redoKey = null; save('redo'); } }
    const all = n && ok === n, icon = all ? 'trophy' : ok / (n || 1) >= 0.6 ? 'party' : 'muscle';
    const title = all ? '다 맞혔어요!' : ok / (n || 1) >= 0.6 ? '잘했어요!' : '끝까지 풀었어요!';
    return `<div class="done-card card" data-done="${all ? 2 : ok / (n || 1) >= 0.6 ? 1 : 0}"><div class="done-ic gh-wrap">${gh(ok / (n || 1) >= 0.6 ? 'yay' : 'oops', 'gh-done')}</div><h1 class="h1">${title}</h1><div class="done-score"><b class="num">${ok}</b><span>/ ${n} 맞힘</span></div><p class="sub">${sub}</p>${extra}<div class="done-btns">${btns}</div></div>`;
  }
  function verdict(ok, extra = '') { return `<div class="verdict ${ok ? 'ok' : 'no'}">${ic(ok ? 'hundred' : 'think')}<span>${ok ? '정답이에요' : '아쉬워요, 다시 볼게요'}</span>${extra}</div>`; }
  function addWrong(id, w) { S.wrong = S.wrong || {}; const old = S.wrong[id]; S.wrong[id] = { ...(old || {}), ...w, at: Date.now(), times: ((old && old.times) || 0) + 1, cleared: false }; save('wrong'); }
  function clearWrong(id) { if (S.wrong && S.wrong[id]) { if (!S.wrong[id].cleared) earn('wr:' + id, 100, '오답 다시 맞힘'); S.wrong[id].cleared = true; S.wrong[id].clearedAt = Date.now(); save('wrong'); } }

  // 과학 풀기
  function lessonHtml(c) {
    const L = c.lesson;
    if (!L) return `<div class="card lesson"><p class="ls-body">${esc(c.summary || '')}</p></div>`;
    return `<div class="card lesson">
      ${L.intro ? `<p class="ls-intro">${esc(L.intro)}</p>` : ''}
      ${(L.points || []).map((p, k) => `<div class="ls-pt"><span class="ls-n">${k + 1}</span><div><b>${esc(p.t)}</b><p>${esc(p.d)}</p></div></div>`).join('')}
      ${L.table && L.table.length ? `<div class="tbl-wrap"><table class="q-tbl ls-tbl">${L.table.map((r, k) => `<tr>${r.map((x) => k ? `<td>${esc(x)}</td>` : `<th>${esc(x)}</th>`).join('')}</tr>`).join('')}</table></div>` : ''}
      ${L.terms && L.terms.length ? `<div class="ls-terms">${L.terms.map((x) => `<div><b>${esc(x.w)}</b><span>${esc(x.m)}</span></div>`).join('')}</div>` : ''}
      ${L.lab ? `<div class="ls-box"><b>교과서 탐구</b><p>${esc(L.lab)}</p></div>` : ''}
      ${L.trap && L.trap.length ? `<div class="ls-box warn"><b>시험에서 헷갈리는 것</b>${L.trap.map((x) => `<p>· ${esc(x)}</p>`).join('')}</div>` : ''}
      ${L.check && L.check.length ? `<div class="ls-box"><b>바로 확인</b>${L.check.map((x, k) => `<details class="ls-chk"><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}</div>` : ''}
    </div>`;
  }
  // 목록에서 고른 과학 개념: 교과서 개념 → 기본 문제 → 깊게
  function conceptRun() {
    const c = SCI.concepts.find((x) => x.id === UI.run.cid); if (!c) { UI.run = null; return libView(); }
    S.sci.cans = S.sci.cans || {}; const ans = (S.sci.cans[c.id] = S.sci.cans[c.id] || {});
    const qs = [...(c.base || []), ...(c.deep || [])];
    const head = `<div class="row between"><button class="btn sm" data-lib="sci" type="button">‹ 과학 목록</button><span class="tiny">${esc(unitOf(c.unit).title)}</span></div>`;
    if (!UI.run.read) return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}<p class="eyebrow" style="margin:16px 0 4px">${ic('books')} 개념 · ${c.lesson && c.lesson.src ? esc(c.lesson.src) : '교과서'}</p><h1 class="h1" style="margin:0 0 8px">${esc(c.title)}</h1>${readPill('read:' + c.id, 100, '과학 개념 읽기', 10)}${lessonHtml(c)}<div class="cta-bar"><button class="btn primary big block" id="cr-go" type="button">개념 다 봤어요, 문제 ${qs.length}개 풀기</button></div></div>`;
    let i = UI.run.i != null ? UI.run.i : qs.findIndex((q) => !ans[q.id]);
    if (i < 0) { const ok = qs.filter((q) => ans[q.id] && ans[q.id].ok).length; return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}${doneCard(ok, qs.length, ok === qs.length ? '이 개념은 이제 내 거예요' : '틀린 문제는 오답 노트에 들어갔어요', '<button class="btn primary big block" data-lib="sci" type="button">다른 개념 보기</button><button class="btn big block" id="cr-redo" type="button">처음부터 다시</button>')}</div>`; }
    const q = qs[i], a = ans[q.id];
    return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}<details class="hw-more" style="margin:8px 0 0"><summary>개념 다시 보기</summary>${lessonHtml(c)}</details>
      <div class="progress-dots">${qs.map((x, k) => `<i class="${ans[x.id] ? (ans[x.id].ok ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card"><div class="q-no">${i + 1}번 ${i >= (c.base || []).length ? '<span class="tag">깊게</span>' : ''}</div><div style="margin-top:8px">${qBody(q)}</div></div>${choicesHtml(q, a ? a.pick : null)}${a ? verdict(a.ok) + (q.exp ? `<div class="explain"><b>해설</b><br>${esc(q.exp)}</div>` : '') + '<div class="cta-bar"><button class="btn primary big block" id="cr-next" type="button">다음</button></div>' : ''}</div>`;
  }
  function bindConcept() {
    const r = UI.run, c = SCI.concepts.find((x) => x.id === r.cid); if (!c) return;
    const ans = S.sci.cans[c.id], qs = [...(c.base || []), ...(c.deep || [])];
    const g = $('#cr-go'); if (g) g.onclick = () => { r.read = true; r.i = null; render(); window.scrollTo(0, 0); };
    const rd = $('#cr-redo'); if (rd) rd.onclick = () => { S.sci.cans[c.id] = {}; save('sci'); UI.run = { kind: 'concept', cid: c.id }; render(); window.scrollTo(0, 0); };
    const nx = $('#cr-next'); if (nx) nx.onclick = () => { r.i = null; render(); window.scrollTo(0, 0); };
    const i = r.i != null ? r.i : qs.findIndex((q) => !ans[q.id]); const q = qs[i];
    $$('[data-pick]').forEach((b) => (b.onclick = () => {
      const k = +b.dataset.pick, ok = k === q.answer; ans[q.id] = { pick: k, ok, at: Date.now() }; r.i = i;
      const wid = 'sci:' + q.id;
      if (ok) { gotIt(wid); if (S.wrong[wid]) clearWrong(wid); } else addWrong(wid, { src: 'sci', subj: 'sci', subjName: '통합과학', area: unitOf(c.unit).title.replace(/^[ⅠⅡⅢⅣⅤⅥ]+\.\s*/, ''), sub: c.title, concept: c.id, qid: q.id });
      save('sci'); render();
    }));
  }
  // ───────── 전체 목록 (오늘 것 말고도 골라서) ─────────
  function libView() {
    const k = UI.lib;
    const T = { cheonil: '천일문 전체', sci: '통합과학 개념 전체', words: '워드마스터 전체', g3: '고3 영어 전체' };
    const head = `<div class="row between" style="margin-bottom:8px"><button class="btn sm" data-lib="" type="button">‹ 숙제</button></div><h1 class="h1">${T[k]}</h1>`;
    const ed = engToday();
    if (k === 'cheonil') {
      const chs = [...new Set(CH_UNITS.map((u) => u.ch))];
      return head + `<p class="sub">아무 유닛이나 눌러서 공부할 수 있어요. 오늘 숙제는 Unit ${esc((CH_UNITS[S.eng.unit || 0] || {}).unit || '')}이에요</p><div class="grid">${chs.map((ch) => { const L = CH_UNITS.map((u, i) => ({ u, i })).filter((x) => x.u.ch === ch); return `<section class="card c6"><div class="card-h"><h3>Ch.${esc(ch)} ${esc(L[0].u.chTitle || '')}</h3><span class="tiny">${L.length}유닛</span></div><div class="list">${L.map(({ u, i }) => { const st = (S.eng.ua || {})[u.ch + '-' + u.unit] || {}; const n = Object.keys(st).length, tot = (u.questions || []).length; const done = n >= tot && tot || (i < (S.eng.unit || 0)); return `<div class="li btnlike" data-lu="${i}"><div class="ico">${ic(done ? 'ok' : i === (S.eng.unit || 0) ? 'pin' : 'eng')}</div><div class="body"><div class="t">Unit ${esc(u.unit)} ${esc(u.title || '')}</div><div class="d">${i === (S.eng.unit || 0) ? '오늘 숙제 · ' : ''}문제 ${tot}개${n && !done ? ` · ${n}개 풀었어요` : ''}</div></div><span class="chev"></span></div>`; }).join('')}</div></section>`; }).join('')}</div>`;
    }
    if (k === 'sci') {
      const done = (c) => { const a = (S.sci.cans || {})[c.id] || {}; const inDay = Object.values(S.sci.days || {}).some((d) => d.one && d.c === c.id && d.read); return Object.keys(a).length || inDay; };
      const ord = (c) => (c.lesson && c.lesson.order) || 999;
      const exam = SCI.concepts.filter((c) => c.exam).sort((a, b) => ord(a) - ord(b)), rest = SCI.concepts.filter((c) => !c.exam);
      const row = (c) => `<div class="li btnlike" data-lc="${esc(c.id)}"><div class="ico">${ic(done(c) ? 'ok' : 'sci')}</div><div class="body"><div class="t">${esc(c.title)}</div><div class="d">${esc(c.lesson && c.lesson.src ? c.lesson.src : c.sub || '')} · 문제 ${(c.base || []).length + (c.deep || []).length}개</div></div><span class="chev"></span></div>`;
      const byUnit = (L) => [...new Set(L.map((c) => c.unit))].map((u) => `<section class="card c6"><div class="card-h"><h3>${esc(unitOf(u).title)}</h3></div><div class="list">${L.filter((c) => c.unit === u).map(row).join('')}</div></section>`).join('');
      return head + `<p class="sub">개념을 먼저 보고 그 개념 문제를 풀어요. 기말 범위는 경화여고 교과서(비상) 순서예요</p><h2 class="h2" style="margin:8px 0 12px">2학기 기말 범위 ${exam.length}개</h2><div class="grid">${byUnit(exam)}</div><h2 class="h2" style="margin:24px 0 12px">1학기 · 그 밖의 개념 ${rest.length}개</h2><div class="grid">${byUnit(rest)}</div>`;
    }
    if (k === 'words') {
      const days = (ENG.words && ENG.words.days) || [];
      let idx = 0;
      return head + `<p class="sub">Day마다 10개씩 세 묶음이에요. 오늘 숙제는 ${Math.floor((ed.words || 0) / 3) + 1}일차 ${(ed.words || 0) % 3 + 1}번째 묶음이에요</p><section class="card tight"><div class="wd-list">${days.map((d) => { const n = Math.ceil((d.words || []).length / 10); const btns = Array.from({ length: n }, () => idx++).map((k2, j) => { const a = (S.eng.wa || {})[k2] || {}; const did = Object.keys(a).length >= 10 || k2 < (S.eng.wordDay || 0); return `<button class="chip sm ${k2 === (ed.words || 0) ? 'on' : ''}" data-lw="${k2}" type="button">${did ? '✓ ' : ''}${j * 10 + 1}~${j * 10 + 10}</button>`; }).join(''); return `<div class="wd-row"><b>Day ${esc(d.day)}</b><div class="chips">${btns}</div></div>`; }).join('')}</div></section>`;
    }
    if (k === 'g3') {
      return head + `<p class="sub">풀고 나면 문장마다 해석·구문 분석이 나와요</p><section class="card"><div class="list">${G3.map((g, i) => { const a = (S.eng.g3ans || {})[g.id]; return `<div class="li btnlike" data-lg="${i}"><div class="ico">${ic(a ? (a.ok ? 'ok' : 'x') : i === (S.eng.g3 || 0) ? 'pin' : 'eng')}</div><div class="body"><div class="t">${i + 1}. ${esc(g.type || '독해')}${g.level ? ' ' + '★'.repeat(g.level) : ''}</div><div class="d">${esc(g.src || '')}${i === (S.eng.g3 || 0) ? ' · 오늘 숙제' : ''}</div></div><span class="chev"></span></div>`; }).join('')}</div></section>`;
    }
    return '';
  }
  function libCard() {
    const it = (k, icn, t, d) => `<button class="lib-it" data-lib="${k}" type="button"><span class="ico">${ic(icn)}</span><b>${t}</b><span class="tiny">${d}</span></button>`;
    return `<section class="card c8"><div class="card-h"><h2>전체 목록</h2><span class="tiny">오늘 것 말고도 골라서 공부해요</span></div><div class="lib-grid">${it('cheonil', 'eng', '천일문', `${CH_UNITS.length}유닛`)}${it('sci', 'sci', '통합과학 개념', `${SCI.concepts.length}개 · 기말 ${SCI.concepts.filter((c) => c.exam).length}개`)}${it('words', 'books', '워드마스터', `${((ENG.words && ENG.words.days) || []).length}일`)}${it('g3', 'target', '고3 영어', `${G3.length}문제`)}</div></section>`;
  }
  function sciRun() {
    const d = sciToday(true); const list = d.list || [];
    if (d.one && !d.read) {
      const c = SCI.concepts.find((x) => x.id === d.c) || {};
      return `<div class="qwrap" style="max-width:760px;margin:0 auto">
        <div class="row between"><button class="btn sm" data-go="hw" type="button">‹ 숙제</button><span class="tiny">${esc(unitOf(c.unit).title)}</span></div>
        <p class="eyebrow" style="margin:16px 0 4px">${ic('books')} 오늘의 개념 · ${c.lesson && c.lesson.src ? esc(c.lesson.src) : '교과서'}</p>
        <h1 class="h1" style="margin:0 0 8px">${esc(c.title || '')}</h1>
        ${readPill('read:' + c.id, 100, '과학 개념 읽기', 10)}${lessonHtml(c)}
        <div class="cta-bar"><button class="btn primary big block" id="ls-done" type="button">개념 다 봤어요, 문제 ${list.length}개 풀기</button></div>
      </div>`;
    }
    let i = list.findIndex((x) => !d.ans[x.q]);
    if (UI.run && UI.run.i != null && d.ans[list[UI.run.i] && list[UI.run.i].q] && UI.run.showing) i = UI.run.i;
    if (i < 0) { const st = dayStat(d); return `<div class="qwrap" style="max-width:720px;margin:0 auto">${doneCard(st.ok, st.n, `오늘의 과학 끝!${st.all > st.n ? ` 깊게 ${st.all - st.n}문제를 더 풀었어요.` : ''} 틀린 문제는 오답 노트에 쌓였어요`, '<button class="btn primary big block" data-go="home" type="button">홈으로</button><button class="btn big block" data-go="wrong" type="button">오답 노트 보기</button>')}</div>`; }
    const it = list[i], q = qById(it.q), c = SCI.concepts.find((x) => x.id === it.c) || {};
    const a = d.ans[it.q];
    UI.run = { kind: 'sci', i, showing: !!a };
    return `<div class="qwrap" style="max-width:720px;margin:0 auto">
      <div class="row between"><button class="btn sm" data-go="hw" type="button">‹ 숙제</button><span class="tiny">${esc(unitOf(c.unit).title)} · ${esc(c.title || '')}</span></div>${d.one ? `<details class="hw-more" style="margin:8px 0 0"><summary>개념 다시 보기</summary>${lessonHtml(c)}</details>` : ''}
      <div class="progress-dots">${list.map((x, k) => `<i class="${d.ans[x.q] ? (d.ans[x.q].ok ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card"><div class="q-no">${it.kind === 'base' ? `${list.slice(0, i + 1).filter((x) => x.kind === 'base').length}번` : '더 깊게'} ${it.kind !== 'base' ? '<span class="tag blue">개념 쪼개 보기</span>' : ''}</div>
        ${it.kind !== 'base' && it.first ? `<div class="deep" style="margin:12px 0"><div class="eyebrow">${ic('bulb')} 개념 다시 보기</div><p>${esc(c.summary || '')}</p></div>` : ''}
        <div style="margin-top:8px">${qBody(q)}</div></div>
      ${choicesHtml(q, a ? a.pick : null)}
      ${a ? `${verdict(a.ok)}${q.exp ? `<div class="explain"><b>해설</b><br>${esc(q.exp)}</div>` : ''}${!a.ok && c.summary && it.kind === 'base' ? `<div class="deep"><div class="eyebrow">${ic('bulb')} 이 개념, 한 번 더</div><p>${esc(c.summary)}</p></div>` : ''}<div class="cta-bar"><button class="btn primary big block" id="next" type="button">${list.slice(i + 1).some((x) => !d.ans[x.q]) ? '다음 문제' : '결과 보기'}</button></div>` : ''}
    </div>`;
  }
  function bindSci() {
    const d = sciToday(true);
    const ld = $('#ls-done'); if (ld) { ld.onclick = () => { d.read = true; save('sci'); UI.run = { kind: 'sci' }; render(); window.scrollTo(0, 0); }; return; }
    const r = UI.run; if (!r || r.kind !== 'sci') return;
    const it = d.list[r.i]; if (!it) return; const q = qById(it.q), c = SCI.concepts.find((x) => x.id === it.c) || {};
    $$('[data-pick]').forEach((b) => (b.onclick = () => {
      const k = +b.dataset.pick, ok = k === q.answer; d.ans[it.q] = { pick: k, ok, at: Date.now() };
      const wid = 'sci:' + it.q;
      if (ok) { gotIt(wid); if (S.wrong[wid]) clearWrong(wid); }
      else {
        addWrong(wid, { src: 'sci', subj: 'sci', subjName: '통합과학', area: unitOf(c.unit).title.replace(/^[ⅠⅡⅢⅣⅤⅥ]+\.\s*/, ''), sub: c.title, concept: c.id, qid: it.q });
        // 틀리면 더 깊게: 같은 개념의 deep 문제를 바로 뒤에 넣음 (오늘 이미 넣었으면 안 넣음)
        if (it.kind === 'base' && !d.list.some((x) => x.from === it.q)) { const deeps = (c.deep || []).slice(0, 2).map((dq, j) => ({ c: c.id, q: dq.id, kind: 'deep', from: it.q, first: j === 0 })); d.list.splice(r.i + 1, 0, ...deeps); }
      }
      save('sci'); render();
    }));
    const n = $('#next'); if (n) n.onclick = () => { UI.run = null; render(); window.scrollTo(0, 0); };
  }

  // 영어: 천일문 유닛
  function unitRun() {
    const ed = engToday(true); const ref = UI.run && UI.run.ref != null ? UI.run.ref : null, back = UI.run && UI.run.back, g3lib = UI.run && UI.run.g3lib; const un = CH_UNITS[ref != null ? ref : ed.unit];
    if (!un) return `<div class="card empty">${ic('eng')}<b>천일문 자료를 넣는 중이에요</b></div>`;
    S.eng.ua = S.eng.ua || {}; const store = ref != null ? (S.eng.ua[un.ch + '-' + un.unit] = S.eng.ua[un.ch + '-' + un.unit] || {}) : ed.uans;
    const qs = un.questions || []; const qi = qs.findIndex((_, k) => !store[k]);
    const cur = UI.run && UI.run.kind === 'unit' && UI.run.show != null ? UI.run.show : qi;
    UI.run = { kind: 'unit', show: cur, ref, back, g3lib };
    const head = `<div class="row between">${back === 'g3' ? (g3lib != null ? `<button class="btn sm" data-lg="${g3lib}" type="button">‹ 고3 문제로</button>` : '<button class="btn sm" data-task="g3" type="button">‹ 고3 문제로</button>') : back === 'lib' ? '<button class="btn sm" data-lib="cheonil" type="button">‹ 천일문 목록</button>' : '<button class="btn sm" data-go="hw" type="button">‹ 숙제</button>'}<span class="tiny">천일문 Ch.${esc(un.ch)} ${esc(un.chTitle || '')}</span></div>
      <div class="card"><div class="q-no">Unit ${esc(un.unit)}</div><h1 class="h1" style="margin-top:4px">${esc(un.title)}</h1><p style="line-height:1.8;color:var(--t2);margin:8px 0 0">${esc(un.concept || '')}</p></div>
      <div class="card"><div class="card-h"><h3>문장으로 이해하기</h3></div><div class="list">${(un.sentences || []).map((s) => `<div class="li" style="align-items:flex-start"><div class="body"><div class="t" style="font-size:16px;line-height:1.6">${esc(s.en)}</div><div class="d" style="margin-top:4px">${esc(s.ko)}</div>${s.point ? `<div class="tiny blue" style="margin-top:4px">${esc(s.point)}</div>` : ''}</div><span class="tag">${esc(s.src || '')}</span></div>`).join('')}</div></div>`;
    if (cur < 0 || cur == null) {
      const ok = Object.values(ed.uans).filter((x) => x.ok).length;
      if (!ed.udone && qs.length) { ed.udone = Date.now(); S.eng.unit = Math.min((S.eng.unit || 0) + 1, CH_UNITS.length - 1); save('eng'); }
      return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}${doneCard(ok, qs.length, '천일문 유닛 끝! 내일은 다음 유닛이에요', '<button class="btn primary big block" data-task="words" type="button">단어 시험 보러 가기</button><button class="btn big block" data-go="home" type="button">홈으로</button>')}</div>`;
    }
    const q = qs[cur], a = ed.uans[cur];
    const isOrder = q.words && q.answerText;
    return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}
      <div class="progress-dots">${qs.map((_, k) => `<i class="${ed.uans[k] ? (ed.uans[k].ok ? 'ok' : 'no') : k === cur ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card"><div class="q-no">문제 ${cur + 1} <span class="tag">${esc(q.type || '')}</span></div><div style="margin-top:8px">${qBody(q)}</div></div>
      ${isOrder ? `<div class="card"><div id="ord-out" class="q-text" style="min-height:32px">${a ? esc(a.text) : ''}</div><div class="chips" style="flex-wrap:wrap;margin-top:12px" id="ord-in">${a ? '' : shuffle(q.words.map((w, k) => [w, k])).map(([w, k]) => `<button class="chip" data-w="${k}" type="button">${esc(w)}</button>`).join('')}</div>${a ? '' : '<div class="row" style="margin-top:12px"><button class="btn" id="ord-reset" type="button">다시</button><button class="btn primary" id="ord-ok" type="button">확인</button></div>'}</div>`
        : q.choices ? choicesHtml(q, a ? a.pick : null) : `<div class="card"><textarea class="inp" id="free" placeholder="답을 써 보세요" ${a ? 'disabled' : ''}>${a ? esc(a.text || '') : ''}</textarea>${a ? '' : '<button class="btn primary block" style="margin-top:12px" id="free-ok" type="button">확인</button>'}</div>`}
      ${a ? `${verdict(a.ok)}${isOrder || !q.choices ? `<div class="explain"><b>정답</b> ${esc(q.answerText || (q.choices ? q.choices[q.answer] : ''))}</div>` : ''}${q.exp ? `<div class="explain"><b>해설</b><br>${esc(q.exp)}</div>` : ''}<div class="cta-bar"><button class="btn primary big block" id="next" type="button">${qs.some((_, k) => !ed.uans[k]) ? '다음 문제' : '결과 보기'}</button></div>` : ''}
    </div>`;
  }
  const normEn = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  function bindUnit() {
    const ed = engToday(true), un = CH_UNITS[ed.unit]; if (!un || !UI.run || UI.run.kind !== 'unit') return; const cur = UI.run.show; const q = (un.questions || [])[cur]; if (!q) { const n = $('#next'); if (n) n.onclick = () => { UI.run = null; render(); }; return; }
    const mark = (ok, extra) => { ed.uans[cur] = { ok, at: Date.now(), ...extra }; if (!ok) addWrong(`eng:${un.ch}-${un.unit}-${cur}`, { src: 'eng', subj: 'eng', subjName: '영어', area: '천일문 ' + (un.chTitle || ''), sub: un.title, ref: { ch: un.ch, unit: un.unit, i: cur } }); else { gotIt(`eng:${un.ch}-${un.unit}-${cur}`); clearWrong(`eng:${un.ch}-${un.unit}-${cur}`); } save('eng'); render(); };
    $$('[data-pick]').forEach((b) => (b.onclick = () => mark(+b.dataset.pick === q.answer, { pick: +b.dataset.pick })));
    const out = $('#ord-out'), picked = [];
    $$('[data-w]').forEach((b) => (b.onclick = () => { picked.push(q.words[+b.dataset.w]); b.remove(); out.textContent = picked.join(' '); }));
    const rs = $('#ord-reset'); if (rs) rs.onclick = () => render();
    const ok = $('#ord-ok'); if (ok) ok.onclick = () => { const t = picked.join(' '); mark(normEn(t) === normEn(q.answerText), { text: t }); };
    const fo = $('#free-ok'); if (fo) fo.onclick = () => { const t = $('#free').value; const ans = q.answerText || ''; mark(normEn(t) === normEn(ans) || (q.accept || []).some((x) => normEn(x) === normEn(t)), { text: t }); };
    const n = $('#next'); if (n) n.onclick = () => { UI.run = { kind: 'unit', show: (un.questions || []).findIndex((_, k) => !ed.uans[k]) }; render(); window.scrollTo(0, 0); };
  }
  // 영어: 단어 10개 (외우기 → 시험)
  function wordsRun() {
    const ed = engToday(true); const day = UI.run && UI.run.kind === 'words' && UI.run.day != null ? UI.run.day : null;
    const wl = wordsFor(day != null ? day : ed.words);
    if (!wl.length) return `<div class="card empty">${ic('books')}<b>단어장을 넣는 중이에요</b></div>`;
    S.eng.wa = S.eng.wa || {}; const wans = day != null ? (S.eng.wa[day] = S.eng.wa[day] || {}) : ed.wans;
    const mode = (UI.run && UI.run.kind === 'words' && UI.run.mode) || (Object.keys(wans || {}).length ? 'test' : 'study');
    UI.run = { kind: 'words', mode, day };
    const head = `<div class="row between">${day != null ? '<button class="btn sm" data-lib="words" type="button">‹ 단어 목록</button>' : '<button class="btn sm" data-go="hw" type="button">‹ 숙제</button>'}<span class="tiny">워드마스터 하이스트 · Day ${esc(wl[0].day)}</span></div>`;
    if (mode === 'study') return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}<h1 class="h1">${day != null ? '단어 10개' : '오늘의 단어 10개'}</h1><p class="sub">한 번 훑고 바로 시험 봐요</p><div class="card"><table class="tbl"><tbody>${wl.map((w, k) => `<tr><td class="num muted" style="width:28px">${k + 1}</td><td><b style="font-size:16px">${esc(w.en)}</b> <span class="tiny">${esc(w.pos || '')}</span>${w.ex ? `<div class="tiny" style="margin-top:2px">${esc(w.ex)}</div>` : ''}</td><td style="color:var(--t2)">${esc(w.ko)}</td></tr>`).join('')}</tbody></table></div><div class="cta-bar"><button class="btn primary big block" id="w-test" type="button">시험 보기</button></div></div>`;
    const i = wl.findIndex((_, k) => !wans[k]);
    if (i < 0) {
      const ok = Object.values(wans).filter((x) => x.ok).length;
      if (day == null && !ed.wdone) { ed.wdone = Date.now(); S.eng.wordDay = (S.eng.wordDay || 0) + 1; save('eng'); }
      return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}${doneCard(ok, wl.length, '단어 시험 끝! 틀린 단어는 오답 노트에 들어갔어요', '<button class="btn primary big block" data-go="home" type="button">홈으로</button>', `<div class="list done-list">${wl.map((w, k) => `<div class="li"><div class="ico">${ic(wans[k] && wans[k].ok ? 'ok' : 'x')}</div><div class="body"><div class="t">${esc(w.en)}</div><div class="d">${esc(w.ko)}</div></div></div>`).join('')}</div>`)}</div>`;
    }
    const w = wl[i];
    const pool = WORDS.filter((x) => x.ko !== w.ko); const opts = shuffle([w.ko, ...shuffle(pool).slice(0, 3).map((x) => x.ko)]);
    UI.run.opts = opts; UI.run.i = i;
    return `<div class="qwrap" style="max-width:640px;margin:0 auto">${head}<div class="progress-dots">${wl.map((_, k) => `<i class="${wans[k] ? (wans[k].ok ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card" style="text-align:center;padding:40px 24px"><div class="tiny">${i + 1} / ${wl.length}</div><div style="font-size:34px;font-weight:800;margin-top:8px;letter-spacing:-0.02em">${esc(w.en)}</div><div class="tiny">${esc(w.pos || '')}</div></div>
      <div class="choices">${opts.map((o, k) => `<button class="choice" data-wo="${k}" type="button"><span class="n">${k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div></div>`;
  }
  function bindWords() {
    const ed = engToday(true); const r = UI.run; if (!r || r.kind !== 'words') return;
    const wl = wordsFor(r.day != null ? r.day : ed.words), wans = r.day != null ? S.eng.wa[r.day] : ed.wans;
    const t = $('#w-test'); if (t) t.onclick = () => { UI.run = { kind: 'words', mode: 'test', day: r.day }; render(); window.scrollTo(0, 0); };
    $$('[data-wo]').forEach((b) => (b.onclick = () => {
      const w = wl[r.i], ok = r.opts[+b.dataset.wo] === w.ko;
      $$('[data-wo]').forEach((x) => { x.disabled = true; if (r.opts[+x.dataset.wo] === w.ko) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      wans[r.i] = { ok, at: Date.now() };
      const wid = 'word:' + w.en; if (!ok) addWrong(wid, { src: 'word', subj: 'eng', subjName: '영어', area: '단어', sub: `${w.en} · ${w.ko}`, word: w }); else { gotIt(wid); if (S.wrong[wid]) clearWrong(wid); }
      save('eng'); setTimeout(render, ok ? 450 : 1100);
    }));
  }

  // ───────── 오답 탭 ─────────
  // 약한 영역 (오답 탭, 고른 과목만)
  function weakCard(ow, cls) {
    const byArea = {};
    for (const w of ow) { const k = `${w.subjName || SUBJ_NAMES[w.subj] || w.subj}·${w.area || '기타'}`; byArea[k] = (byArea[k] || 0) + 1; }
    const areas = Object.entries(byArea).sort((a, b) => b[1] - a[1]); const tot = areas.reduce((a, b) => a + b[1], 0);
    const pal = ['var(--blue)', 'var(--red)', 'var(--amber)', 'var(--green)', 'var(--t4)'];
    const pct = (n) => Math.max(1, Math.round((n / tot) * 100)) + '%';
    return `<section class="card ${cls}"><div class="card-h"><h2>약한 영역</h2></div>${areas.length ? `<p class="h1" style="font-size:20px;margin:0 0 16px"><em>${esc(areas[0][0].replace('·', ' '))}</em>에서<br>가장 많이 틀렸어요</p><div class="stack">${areas.slice(0, 4).map(([, n], i) => `<span style="width:${(n / tot) * 100}%;background:${pal[i]}"></span>`).join('')}${areas.length > 4 ? `<span style="width:${(areas.slice(4).reduce((a, b) => a + b[1], 0) / tot) * 100}%;background:${pal[4]}"></span>` : ''}</div><div class="list" style="margin-top:12px">${areas.slice(0, 4).map(([k, n], i) => `<div class="li" style="padding:8px 0"><div class="body"><span class="dot" style="background:${pal[i]}"></span>${esc(k.replace('·', ' · '))}</div><div class="end num">${pct(n)}</div></div>`).join('')}${areas.length > 4 ? `<div class="li" style="padding:8px 0"><div class="body"><span class="dot" style="background:${pal[4]}"></span>그 외 ${areas.length - 4}개 영역</div><div class="end num">${pct(areas.slice(4).reduce((a, b) => a + b[1], 0))}</div></div>` : ''}</div>` : `<div class="empty">${gh('idle', 'gh-empty')}<b>쌓인 오답이 없어요</b><span>모의고사를 채점하거나 매일 문제를 풀면 약한 영역이 보여요</span></div>`}</section>`;
  }
  // 과목별 오답 표
  function subjWrongCard(cls) {
    const subjRows = Object.entries(SUBJ_NAMES).map(([k, n]) => { const all = wrongList().filter((w) => w.subj === k); return { k, n, all: all.length, open: all.filter((w) => !w.cleared).length }; }).filter((r) => r.all);
    const subjTot = subjRows.reduce((a, r) => a + r.all, 0);
    const mx = Math.max(1, ...subjRows.map((r) => r.all));
    return `<section class="card ${cls}"><div class="card-h"><h2>과목별 오답</h2></div>${subjRows.length ? `<p class="sub" style="margin:-4px 0 16px">막대가 길수록 많이 틀린 과목이에요. 다시 맞히면 진하게 채워져요</p><div class="sw-chart">${subjRows.sort((a, b) => b.all - a.all).map((r) => { const done = r.all - r.open, c = SUBJ_COLOR[r.k]; return `<div class="sw-row"><span class="sw-n"><span class="dot" style="background:${c}"></span>${r.n}</span><div class="sw-track"><div class="sw-bar" style="width:${(r.all / mx) * 100}%;background:color-mix(in srgb, ${c} 22%, #fff)"><i style="width:${(done / r.all) * 100}%;background:${c}"></i></div></div><span class="sw-v">${done ? `<b style="color:${c}">${Math.round((done / r.all) * 100)}%</b> 다시 맞힘` : ''}</span></div>`; }).join('')}</div>` : `<div class="empty">${ic('memo')}<b>아직 없어요</b></div>`}</section>`;
  }
  function wrongView() {
    const all = wrongList(); const f = UI.wrongSubj;
    const subs = Object.entries(SUBJ_NAMES).filter(([k]) => all.some((w) => w.subj === k));
    const L = all.filter((w) => f === 'all' || w.subj === f);
    const open = L.filter((w) => !w.cleared), done = L.filter((w) => w.cleared);
    const item = (w) => `<div class="li btnlike" data-wr="${esc(w.id)}"><div class="ico">${ic(w.cleared ? 'ok' : w.src === 'mock' ? 'score' : w.src === 'word' ? 'books' : w.src === 'eng' ? 'eng' : 'sci')}</div><div class="body"><div class="t">${esc(w.title || w.sub || '')}</div><div class="d">${esc(w.subjName || SUBJ_NAMES[w.subj] || '')} · ${esc(w.area || '')}${w.times > 1 ? ` · ${w.times}번 틀림` : ''}</div></div>${w.cleared ? '<span class="tag blue">다시 맞힘</span>' : '<span class="tag">다시 풀기</span>'}</div>`;
    return `<h1 class="h1">오답 노트</h1><p class="sub">하루에 두세 문제씩만 다시 풀어요. 다시 맞히면 파란색이 돼요</p>
      <div class="chips" style="margin-bottom:16px"><button class="chip ${f === 'all' ? 'on' : ''}" data-ws="all" type="button">전체</button>${subs.map(([k, n]) => `<button class="chip ${f === k ? 'on' : ''}" data-ws="${k}" type="button">${n}</button>`).join('')}</div>
      <div class="grid">
        ${(() => { const td = todayWr().map((id) => S.wrong[id]).filter(Boolean); const nx = (S.hw || []).filter((h) => hwWr(h).length && !hwDone(h) && h.due > today()).sort((a, b) => a.due.localeCompare(b.due))[0];
          return `<section class="card c7 col-card"><div class="card-h"><h2>오늘 풀 오답</h2></div>${td.length ? `<div class="list">${td.map(item).join('')}</div>` : `<div class="empty">${gh('yay', 'gh-empty')}<b>오늘 오답은 끝!</b>${nx ? `<span>다음 오답은 ${md(nx.due)}에 나와요</span>` : ''}</div>`}
          ${td.length || open.length ? `<div class="wr-acts">${td.length ? `<button class="btn primary big" id="wr-today" type="button">${td.length}문제 풀기</button>` : ''}${open.length ? `<button class="btn big soft" type="button" onclick="const l=this.closest('section').querySelector('.wr-all');l.hidden=!l.hidden;this.textContent=l.hidden?'모아 둔 오답 보기':'접기'">모아 둔 오답 보기</button>` : ''}</div>` : ''}
          ${open.length ? `<div class="list wr-all" hidden style="margin-top:12px">${open.slice(0, 60).map(item).join('')}</div>` : ''}</section>`; })()}
        ${weakCard(open, 'c5')}
        ${f === 'all' ? subjWrongCard('c12') : ''}
        ${done.length ? `<section class="card c12"><div class="card-h"><h2>다시 맞힌 문제 ${done.length}</h2></div><div class="list">${done.slice(0, 40).map(item).join('')}</div></section>` : ''}
      </div>`;
  }
  // 오답 하나 다시 풀기
  function retryRun() {
    const id = UI.run.id, w = S.wrong[id]; if (!w) { UI.run = null; return wrongView(); }
    const queue = UI.run.queue || [];
    const head = `<div class="row between">${UI.run.back === 'hw' ? '<button class="btn sm" data-go="hw" type="button">‹ 숙제</button>' : '<button class="btn sm" data-go="wrong" type="button">‹ 오답 노트</button>'}<span class="tiny">${esc(w.subjName || '')} · ${esc(w.area || '')}${queue.length ? ` · 남은 ${queue.length}` : ''}</span></div>`;
    const a = UI.run.ans;
    let body = '', wide = false;
    if (w.src === 'sci') { const q = qById(w.qid); if (!q) return head; body = `<div class="card"><div class="q-no">${esc(w.sub || '')}</div><div style="margin-top:8px">${qBody(q)}</div></div>${choicesHtml(q, a ? a.pick : null)}${a ? verdict(a.ok) + (q.exp ? `<div class="explain"><b>해설</b><br>${esc(q.exp)}</div>` : '') : ''}`; UI.run.q = q; }
    else if (w.src === 'eng') { const un = CH_UNITS.find((u) => u.ch === w.ref.ch && u.unit === w.ref.unit); const q = un && un.questions[w.ref.i]; if (!q) return head; body = `<div class="card"><div class="q-no">천일문 Unit ${esc(un.unit)} · ${esc(un.title)}</div><div style="margin-top:8px">${qBody(q)}</div></div>${q.choices ? choicesHtml(q, a ? a.pick : null) : `<div class="explain"><b>정답</b> ${esc(q.answerText || '')}</div><div class="row"><button class="btn soft" data-self="1" type="button">맞혔어요</button><button class="btn" data-self="0" type="button">아직이에요</button></div>`}${a ? verdict(a.ok) + (q.exp ? `<div class="explain">${esc(q.exp)}</div>` : '') : ''}`; UI.run.q = q; }
    else if (w.src === 'word') { const ww = w.word; const opts = UI.run.opts || (UI.run.opts = shuffle([ww.ko, ...shuffle(WORDS.filter((x) => x.ko !== ww.ko)).slice(0, 3).map((x) => x.ko)])); body = `<div class="card" style="text-align:center;padding:40px"><div style="font-size:32px;font-weight:800">${esc(ww.en)}</div></div><div class="choices">${opts.map((o, k) => `<button class="choice ${a ? (o === ww.ko ? 'right' : k === a.pick ? 'wrong' : '') : ''}" data-pick="${k}" type="button" ${a ? 'disabled' : ''}><span class="n">${k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>${a ? verdict(a.ok) : ''}`; UI.run.q = { answer: opts.indexOf(ww.ko) }; }
    else if (w.src === 'g3') { const it = G3.find((x) => x.id === w.g3); if (!it) return head; body = `<div class="card"><div class="q-no">${esc(it.src || '')} <span class="tag">${esc(it.type || '')}</span></div><div class="q-text" style="margin-top:8px">${esc(it.q)}</div><div class="q-box" style="font-size:15.5px;line-height:1.85;font-weight:400">${esc(it.passage)}</div></div>${choicesHtml(it, a ? a.pick : null)}${a ? verdict(a.ok) + (it.exp ? `<div class="explain">${esc(it.exp)}</div>` : '') : ''}`; UI.run.q = it; }
    else if (w.src === 'drill') { const d = allDrills().find((x) => x.id === w.set), q = d && d.qs[w.i]; if (!q) return head; body = `<div class="card"><div class="q-no">${esc(d.title || '')} ${w.i + 1}번</div><div style="margin-top:8px">${qBody(q)}</div></div>${choicesHtml(q, a ? a.pick : null)}${a ? verdict(a.ok) + (q.exp ? `<div class="explain">${esc(q.exp)}</div>` : '') : ''}`; UI.run.q = q; }
    else if (w.src === 'mock') {
      const m = MOCKS.find((x) => x.id === w.exam), ms = m && mockSubj(m, w.subj), q = ms && ms.qs.find((x) => x.no === w.no);
      if (!q) return head;
      body = `<div class="card"><div class="q-no">${esc(m.title)} · ${esc(ms.name || SUBJ_NAMES[w.subj])} ${q.no}번 <span class="tag">${esc(q.area || '')}${q.sub ? ' · ' + esc(q.sub) : ''}</span> <span class="tag">${q.points}점</span></div>
        ${q.img && q.img.length ? q.img.map((src) => `<img class="q-img" style="margin-top:12px" src="${esc(src)}" alt="${q.no}번 문제" loading="lazy">`).join('') : `<p class="muted" style="margin:12px 0 0">문제지 ${esc(q.page || '')}쪽 ${q.no}번을 펴고 다시 풀어 보세요</p>`}${q.pageImg && !(q.passage && q.passage.length) ? `<button class="btn sm soft" style="margin-top:12px" data-page="${esc(q.pageImg)}" type="button">지문까지 전체 쪽 보기</button>` : ''}</div>
        ${typeof q.answer === 'number' && q.answer <= 5 && !q.short ? `<div class="num5">${[1, 2, 3, 4, 5].map((k) => `<button class="choice ${a ? (k === q.answer ? 'right' : k === a.pick ? 'wrong' : '') : ''}" data-pick="${k}" type="button" ${a ? 'disabled' : ''}>${'①②③④⑤'[k - 1]}</button>`).join('')}</div>` : `<div class="card"><input class="inp" id="short" inputmode="numeric" placeholder="답 (숫자)" ${a ? 'disabled' : ''}>${a ? '' : '<button class="btn primary block" style="margin-top:12px" id="short-ok" type="button">확인</button>'}</div>`}
        ${a ? verdict(a.ok, a.ok ? '' : ` <span style="margin-left:auto">정답 ${typeof q.answer === 'number' && q.answer <= 5 && !q.short ? '①②③④⑤'[q.answer - 1] : esc(q.answer)}</span>`) : ''}`;
      UI.run.q = { answer: q.answer, mock: true };
      if (q.t) {
        const T = q.t, st = (ms.sets || {})[q.set], psg = st ? `${st.head ? `<p class="psg-head">${st.head}</p>` : ''}${st.passage || ''}` : T.passage || '';
        const mc = typeof q.answer === 'number' && q.answer <= 5 && !q.short && T.choices && T.choices.length;
        const qcard = `<div class="card mq"><div class="q-no">${esc(m.title)} · ${esc(ms.name || SUBJ_NAMES[w.subj])} ${q.no}번 <span class="tag">${esc(q.area || '')}${q.sub ? ' · ' + esc(q.sub) : ''}</span> <span class="tag">${q.points}점</span></div>
          <div class="mq-stem">${T.stem || ''}</div>${T.box ? `<div class="mq-box">${T.box}</div>` : ''}</div>
          ${mc ? `<div class="choices mq-ch">${T.choices.map((c, i) => `<button class="choice ${a ? (i + 1 === q.answer ? 'right' : i + 1 === a.pick ? 'wrong' : '') : ''}" data-pick="${i + 1}" type="button" ${a ? 'disabled' : ''}><span class="n">${'①②③④⑤'[i]}</span>${/^[①②③④⑤]$/.test(String(c).replace(/<[^>]+>/g, '').trim()) ? '' : `<span class="ct">${c}</span>`}</button>`).join('')}</div>` : `<div class="card"><input class="inp" id="short" inputmode="numeric" placeholder="답 (숫자)" ${a ? 'disabled' : ''}>${a ? '' : '<button class="btn primary block" style="margin-top:12px" id="short-ok" type="button">확인</button>'}</div>`}
          ${a ? verdict(a.ok, a.ok ? '' : ` <span style="margin-left:auto">정답 ${mc ? '①②③④⑤'[q.answer - 1] : esc(q.answer)}</span>`) : ''}`;
        if (psg) { wide = true; body = `<div class="split"><div class="psg mq-psg" aria-label="지문"><div class="psg-h">지문 <span class="tiny">따로 위아래로 넘겨 읽어요</span></div><div class="psg-body">${psg}</div></div><div class="qside">${qcard}</div></div>`; }
        else body = qcard;
      } else if (q.passage && q.passage.length) { wide = true; body = `<div class="split"><div class="psg" aria-label="지문"><div class="psg-h">[${esc(String(q.set || '').replace('-', '~'))}] 지문 <span class="tiny">위아래로 넘겨 읽어요</span></div>${q.passage.map((src) => `<img src="${esc(src)}" alt="지문" loading="lazy">`).join('')}</div><div class="qside">${body}</div></div>`; }
    }
    return `<div class="qwrap" style="max-width:${wide ? 1240 : 760}px;margin:0 auto">${head}${body}${a ? `<div class="cta-bar"><button class="btn primary big block" id="next" type="button">${queue.length ? '다음 오답' : '오답 노트로'}</button></div>` : ''}</div>`;
  }
  // 수식: 문제에 $…$ 가 있을 때만 KaTeX를 불러와 그려요
  let katexP = null;
  function mathify(el) {
    if (!el || !/\$/.test(el.textContent)) return;
    katexP = katexP || new Promise((ok) => {
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'; document.head.appendChild(css);
      const a = document.createElement('script'); a.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
      a.onload = () => { const b = document.createElement('script'); b.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js'; b.onload = ok; document.head.appendChild(b); };
      document.head.appendChild(a);
    });
    katexP.then(() => window.renderMathInElement && window.renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }));
  }
  function bindRetry() {
    const r = UI.run; if (!r || r.kind !== 'retry') return; const w = S.wrong[r.id];
    mathify($('.qwrap'));
    const done = (ok, pick) => { r.ans = { ok, pick }; w.tries = (w.tries || 0) + 1; if (ok) clearWrong(r.id); else { w.times = (w.times || 1) + 1; w.at = Date.now(); save('wrong'); } render(); };
    $$('[data-pick]').forEach((b) => (b.onclick = () => { const k = +b.dataset.pick; done(k === r.q.answer, k); }));
    $$('[data-self]').forEach((b) => (b.onclick = () => done(b.dataset.self === '1', null)));
    const so = $('#short-ok'); if (so) so.onclick = () => { const v = $('#short').value.trim(); done(String(+v) === String(r.q.answer), v); };
    $$('[data-page]').forEach((b) => (b.onclick = () => sheet(`<h2>문제지 전체 쪽</h2><img class="q-img" src="${esc(b.dataset.page)}" alt="">`)));
    const n = $('#next'); if (n) n.onclick = () => { if (r.queue && r.queue.length) { const [nx, ...rest] = r.queue; UI.run = { kind: 'retry', id: nx, queue: rest, back: r.back }; } else { UI.run = null; UI.tab = r.back || 'wrong'; if (r.back === 'hw') toast('오늘 오답 끝!'); } render(); window.scrollTo(0, 0); };
  }

  // ───────── 성적 탭 (모의고사 · 내신) ─────────
  function scoreView() {
    const seg = UI.scoreSeg;
    const top = `<h1 class="h1">성적</h1><p class="sub">모의고사는 틀린 번호만 누르면 점수·등급·약한 영역이 나와요</p><div class="row wrap between" style="gap:12px;margin-bottom:16px"><div class="seg" style="max-width:360px;flex:1 1 240px"><button type="button" class="${seg === 'mock' ? 'on' : ''}" data-seg="mock">모의고사</button><button type="button" class="${seg === 'naesin' ? 'on' : ''}" data-seg="naesin">내신</button></div>${seg === 'mock' ? '<button class="btn primary" id="qg-open" type="button">내 등급 바로 적기</button>' : ''}</div>`;
    return top + (seg === 'naesin' && SEMS.some((x) => nsAvg(x) != null) ? `<div class="grid" style="margin-bottom:16px">${nsCard('c12')}</div>` : '') + (seg === 'mock' ? (UI.mockId ? mockDetail() : reportSection() + mockList()) : naesinView());
  }
  function mockList() {
    const rows = examRows().slice().reverse();
    const card = (r) => { const m = MOCKS.find((x) => x.id === r.id); const av = avgOf(r.g); return `<section class="card c6 ${m ? 'link' : ''}" ${m ? `data-mock="${esc(m.id)}"` : ''}><div class="row between"><div><div class="eyebrow">${md(r.date)}${r.manual ? ' · 직접 입력' : ''}</div><h2 style="margin:4px 0 0;font-size:19px">${esc(r.title)}</h2></div><div style="text-align:right"><div class="tiny">평균</div><div class="big num">${av ? fmt1(av) : '-'}</div></div></div><div class="row wrap" style="margin-top:16px">${MOCK_SUBJ.map((s) => `<span class="tag ${r.g[s.key] ? (r.g[s.key] <= 2 ? 'blue' : r.g[s.key] >= 5 ? 'red' : '') : ''}">${s.name} ${r.g[s.key] ? r.g[s.key] + '등급' : '-'}</span>`).join('')}</div>${m ? `<p class="tiny" style="margin:12px 0 0">${MOCK_SUBJ.filter((s) => mockSubj(m, s.key)).filter((s) => ((S.mock[m.id] || {})[s.key] || {}).done).length}/${(m.subjects || []).length}과목 채점 · 눌러서 열기</p>` : `<div class="row" style="margin-top:12px"><button class="btn sm" data-mdel="${esc(r.id)}" type="button">지우기</button></div>`}</section>`; };
    return `<div class="grid">${rows.length ? rows.map(card).join('') : ''}<section class="card c6 link" id="mk-add" style="display:grid;place-items:center;min-height:160px;border:2px dashed var(--line);background:transparent"><div style="text-align:center">${ic('pencil', 'ic')}<div class="t" style="font-weight:700;margin-top:8px">지난 모의고사 등급 넣기</div><div class="tiny">3월 · 6월 · 9월처럼 문항이 없는 회차</div></div></section></div>`;
  }
  function quickGradeSheet(mid) {
    const opts = [...MOCKS.map((m) => [m.id, `${m.title} (${md(m.date)})`]), ['__new', '다른 회차 (이름 직접 쓰기)']];
    let cur = mid || (MOCKS[MOCKS.length - 1] || {}).id || '__new';
    sheet(`<h2>모의고사 등급 바로 적기</h2><p class="sub">성적표에 나온 등급만 넣으면 돼요. 그래프와 내 위치에 바로 들어가요</p>
      <div class="field"><label>회차</label><select class="inp" id="qg-m">${opts.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></div>
      <div class="row" style="gap:12px" id="qg-new"><div class="field" style="flex:2"><label>이름</label><input class="inp" id="qg-t" placeholder="예) 9월 학력평가"></div><div class="field" style="flex:1"><label>날짜</label><input class="inp" type="date" id="qg-d"></div></div>
      <div id="qg-g"></div>
      <button class="btn primary big block" style="margin-top:20px" id="qg-ok" type="button">저장하기</button>`, (el, close) => {
      const draw = () => {
        cur = $('#qg-m', el).value; $('#qg-new', el).style.display = cur === '__new' ? '' : 'none';
        const have = cur === '__new' ? {} : (S.mockGrades || {})[cur] || {}; const m = MOCKS.find((x) => x.id === cur);
        $('#qg-g', el).innerHTML = MOCK_SUBJ.map((sj) => { const omr = m && mockResult(m, sj.key); const v = omr ? omr.grade : have[sj.key]; return `<div class="field"><label>${sj.name}${omr ? ' <span class="tiny">(문항 채점으로 나온 등급)</span>' : ''}</label><div class="gpick" data-gk="${sj.key}">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => `<button type="button" class="${+v === g ? 'on' : ''}" data-g="${g}" ${omr ? 'disabled' : ''}>${g}</button>`).join('')}</div></div>`; }).join('');
        $$('.gpick', el).forEach((row) => $$('[data-g]', row).forEach((b) => (b.onclick = () => { const on = b.classList.contains('on'); $$('[data-g]', row).forEach((x) => x.classList.remove('on')); if (!on) b.classList.add('on'); })));
      };
      $('#qg-m', el).value = cur; $('#qg-m', el).onchange = draw; draw();
      $('#qg-ok', el).onclick = () => {
        const g = {}; $$('.gpick', el).forEach((row) => { const b = $('[data-g].on:not([disabled])', row); if (b) g[row.dataset.gk] = +b.dataset.g; });
        if (cur === '__new') { const t = $('#qg-t', el).value.trim(), d = $('#qg-d', el).value; if (!t || !d) { toast('이름과 날짜를 넣어 주세요'); return; } S.mockManual = S.mockManual || []; S.mockManual.push({ id: 'mm' + Date.now(), title: t, date: d, g }); save('mockManual'); }
        else { S.mockGrades = S.mockGrades || {}; S.mockGrades[cur] = g; save('mockGrades'); }
        close(); render(); toast('등급을 적었어요');
      };
    });
  }
  function manualMockSheet() {
    sheet(`<h2>지난 모의고사 등급</h2><p class="sub">그래프에 같이 그려져요</p>
      <div class="row" style="gap:12px"><div class="field" style="flex:2"><label>이름</label><input class="inp" id="mm-t" placeholder="예) 9월 학력평가"></div><div class="field" style="flex:1"><label>날짜</label><input class="inp" type="date" id="mm-d"></div></div>
      <div class="grid" style="grid-template-columns:repeat(3,1fr);gap:8px">${MOCK_SUBJ.map((s) => `<div class="field" style="margin:0"><label>${s.name}</label><select class="inp" data-mg="${s.key}"><option value="">-</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => `<option>${g}</option>`).join('')}</select></div>`).join('')}</div>
      <button class="btn primary big block" style="margin-top:20px" id="mm-ok" type="button">저장하기</button>`, (el, close) => {
      $('#mm-ok', el).onclick = () => { const t = $('#mm-t', el).value.trim(), d = $('#mm-d', el).value; if (!t || !d) { toast('이름과 날짜를 넣어 주세요'); return; } const g = {}; $$('[data-mg]', el).forEach((x) => { if (x.value) g[x.dataset.mg] = +x.value; }); S.mockManual = S.mockManual || []; S.mockManual.push({ id: 'mm' + Date.now(), title: t, date: d, g }); save('mockManual'); close(); render(); };
    });
  }
  function mockDetail() {
    const m = MOCKS.find((x) => x.id === UI.mockId); if (!m) { UI.mockId = null; return mockList(); }
    const subs = (m.subjects || []); if (!subs.some((s) => s.key === UI.mockSubj)) UI.mockSubj = subs[0] && subs[0].key;
    const ms = mockSubj(m, UI.mockSubj); const rec = ((S.mock[m.id] = S.mock[m.id] || {})[UI.mockSubj] = S.mock[m.id][UI.mockSubj] || { wrong: [], done: false });
    const wrong = new Set(rec.wrong); const res = mockResult(m, UI.mockSubj);
    const total = ms.total || subjInfo(ms.key).total; const lost = ms.qs.filter((q) => wrong.has(q.no)).reduce((a, q) => a + (q.points || 0), 0);
    const raw = total - lost, g = gradeFrom(ms.key, raw, ms.cuts);
    // 영역 분석
    const area = {}; for (const q of ms.qs) { const k = q.area || '기타'; area[k] = area[k] || { n: 0, x: 0, pts: 0 }; area[k].n++; if (wrong.has(q.no)) { area[k].x++; area[k].pts += q.points || 0; } }
    const ar = Object.entries(area);
    const worst = ar.filter(([, v]) => v.x).sort((a, b) => b[1].x / b[1].n - a[1].x / a[1].n)[0];
    return `<div class="row" style="margin-bottom:12px"><button class="btn sm" id="mk-back" type="button">‹ 회차 목록</button><b style="font-size:17px">${esc(m.title)}</b><span class="tiny">${md(m.date)}</span></div>
      <div class="chips" style="margin-bottom:16px">${subs.map((s) => { const r = mockResult(m, s.key); return `<button class="chip ${UI.mockSubj === s.key ? 'on' : ''}" data-ms="${s.key}" type="button">${esc(s.name || SUBJ_NAMES[s.key])}${r ? ` ${r.grade || ''}${r.grade ? '등급' : ''}` : ''}</button>`; }).join('')}</div>
      <div class="grid">
        <section class="card c7"><div class="card-h"><h2>틀린 번호를 눌러 주세요</h2><span class="tiny">${ms.qs.length}문항 · ${total}점 만점</span></div>
          <div class="omr">${ms.qs.map((q) => `<button type="button" class="${wrong.has(q.no) ? 'x' : rec.done ? 'ok' : ''}" data-q="${q.no}">${q.no}<small>${q.points}점</small></button>`).join('')}</div>
          <div class="cta-bar"><button class="btn primary big block" id="mk-done" type="button">${rec.done ? '다시 채점하기' : wrong.size ? `틀린 ${wrong.size}문제로 채점하기` : '다 맞았어요'}</button></div></section>
        <section class="card c5"><div class="card-h"><h2>결과</h2>${rec.done ? '<span class="tag blue">채점함</span>' : '<span class="tag">미리 보기</span>'}</div>
          <div class="scorebox"><div><b class="num">${raw}</b><span>원점수</span></div><div><b class="num ${g && g <= 2 ? 'blue' : ''}">${g || '-'}</b><span>${ms.cuts && ms.cuts.length ? '예상 등급' : subjInfo(ms.key).abs ? '등급' : '등급컷 준비 중'}</span></div><div><b class="num red">${wrong.size}</b><span>틀림</span></div></div>
          ${worst ? `<p style="margin:20px 0 8px;font-size:17px;font-weight:700"><span class="red">${esc(worst[0])}</span>이 이번에 가장 약했어요</p>` : '<p class="muted" style="margin:20px 0 8px">틀린 번호를 누르면 영역별로 나눠 보여 줘요</p>'}
          <div class="list">${ar.map(([k, v]) => `<div class="li" style="padding:8px 0"><div class="body"><div class="row between"><span class="t" style="font-size:14px">${esc(k)}</span><span class="tiny num">${v.n - v.x}/${v.n} 맞힘${v.pts ? ` · -${v.pts}점` : ''}</span></div><div class="bar ${v.x ? 'red' : ''}" style="margin-top:6px"><span style="width:${((v.n - v.x) / v.n) * 100}%"></span></div></div></div>`).join('')}</div>
          ${ms.cuts && ms.cuts.length ? `<p class="tiny" style="margin:12px 0 0">등급컷 ${esc(ms.cutSrc || '')} 기준 (1등급 ${ms.cuts[0]}점)</p>` : ''}
          ${rec.done && wrong.size ? `<button class="btn soft block" style="margin-top:16px" id="mk-retry" type="button">틀린 ${wrong.size}문제 다시 풀기</button>` : ''}</section>
      </div>`;
  }
  function bindMock() {
    const m = MOCKS.find((x) => x.id === UI.mockId); if (!m) return; const key = UI.mockSubj, ms = mockSubj(m, key); const rec = S.mock[m.id][key];
    $$('[data-q]').forEach((b) => (b.onclick = () => { const n = +b.dataset.q; const s = new Set(rec.wrong); s.has(n) ? s.delete(n) : s.add(n); rec.wrong = [...s].sort((a, b) => a - b); if (rec.done) rec.dirty = true; save('mock'); render(); }));
    const dn = $('#mk-done'); if (dn) dn.onclick = () => {
      rec.done = true; rec.at = Date.now(); rec.dirty = false;
      // 오답 노트에 넣고, 이번에 안 틀린 번호는 빼기
      for (const q of ms.qs) { const id = `mock:${m.id}:${key}:${q.no}`; if (rec.wrong.includes(q.no)) { if (!S.wrong[id]) S.wrong[id] = { src: 'mock', exam: m.id, subj: key, subjName: ms.name || SUBJ_NAMES[key], area: q.area || '기타', sub: q.sub || '', no: q.no, title: `${m.title.replace(/학력평가/, '학평')} ${ms.name || SUBJ_NAMES[key]} ${q.no}번`, at: Date.now(), times: 1, cleared: false }; } else if (S.wrong[id] && !S.wrong[id].tries) delete S.wrong[id]; }
      save('mock', 'wrong'); render(); toast('채점했어요. 틀린 문제는 오답 노트에 들어갔어요');
    };
    const rt = $('#mk-retry'); if (rt) rt.onclick = () => { const ids = rec.wrong.map((n) => `mock:${m.id}:${key}:${n}`).filter((id) => S.wrong[id]); if (!ids.length) return; UI.tab = 'wrong'; UI.run = { kind: 'retry', id: ids[0], queue: ids.slice(1) }; render(); window.scrollTo(0, 0); };
    const bk = $('#mk-back'); if (bk) bk.onclick = () => { UI.mockId = null; render(); };
    $$('[data-ms]').forEach((b) => (b.onclick = () => { UI.mockSubj = b.dataset.ms; render(); }));
  }
  function naesinView() {
    const sem = UI.semester; const rec = S.naesin[sem] || {};
    const subs = nsSubjects(sem); const av = nsAvg(sem), tot = nsTotal();
    const split = sem !== '1-1'; // 1학기는 최종만 받아 둠. 2학기부터 중간·기말을 따로 적고, 학기 끝나면 합산 원점수·등급
    const ex = (f) => { const v = subs.map((s) => +(rec[s.name] || {})[f]).filter((x) => x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const mAvg = ex('mid'), fAvg = ex('fin');
    const gsel = (n, f, v) => `<select class="inp sm" style="width:64px" data-ns="${esc(n)}" data-f="${f}"><option value="">-</option>${[1, 2, 3, 4, 5].map((g) => `<option ${+v === g ? 'selected' : ''}>${g}</option>`).join('')}</select>`;
    const rows = SEMS.map((s) => ({ label: s.replace('-', '-') + '학기', v: { n: nsAvg(s) } })).filter((r) => r.v.n != null);
    return `<div class="grid">
      <section class="card c4"><div class="eyebrow">전체 평균 (단위 수 반영)</div><div class="big num" style="font-size:40px;margin:8px 0 4px">${tot ? fmt1(tot) : '-'}<span style="font-size:18px"> 등급</span></div><p class="muted" style="margin:0">${goalLine(tot, S.profile.goalNaesin) || '과목 등급을 넣으면 계산돼요'}</p><hr class="sep"><div class="tiny">2022 개정 교육과정은 내신이 <b>5등급</b>이에요. 1등급은 상위 10%, 2등급은 34%까지예요.</div></section>
      <section class="card c8"><div class="card-h"><h2>학기별 평균</h2></div>${rows.length ? tossLine(rows.map((r) => ({ label: r.label, v: r.v.n })), { maxG: 5, h: 180, id: 'n2', color: '#03b26c', goal: S.profile.goalNaesin }) : `<div class="empty">${ic('up')}<b>아직 없어요</b></div>`}</section>
      <section class="card c12"><div class="card-h"><h2>과목별 입력 <span class="save-st" data-savest>${saveStText()}</span></h2><div class="seg" style="flex:0 1 auto">${SEMS.map((s) => `<button type="button" class="${sem === s ? 'on' : ''}" data-sem="${s}">${s.replace('-', '학년 ')}학기</button>`).join('')}</div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>과목</th><th class="r">단위</th>${split ? '<th class="r">중간 점수</th><th class="r">중간 등급</th><th class="r">기말 점수</th><th class="r">기말 등급</th><th class="r">학기 최종 등급</th>' : '<th class="r">원점수</th><th class="r">과목 평균</th><th class="r">등급 (1~5)</th>'}<th class="r">성취도</th></tr></thead><tbody>
        ${subs.map((s) => { const r = rec[s.name] || {}; return `<tr><td style="font-weight:600">${esc(s.name)}${s.noGrade ? '<div class="tiny">등급 없음</div>' : ''}</td><td class="r"><input class="inp sm num" style="width:56px" data-ns="${esc(s.name)}" data-f="credits" value="${esc(r.credits || s.credits || '')}" inputmode="numeric"></td>${split ? [['mid', 'midG'], ['fin', 'finG'], [null, 'grade']].map(([sc, gf]) => (sc ? `<td class="r"><input class="inp sm num" style="width:64px" data-ns="${esc(s.name)}" data-f="${sc}" value="${esc(r[sc] ?? '')}" inputmode="decimal" placeholder="점수"></td>` : '') + `<td class="r">${s.noGrade ? '-' : gsel(s.name, gf, r[gf])}</td>`).join('') : `<td class="r"><input class="inp sm num" style="width:72px" data-ns="${esc(s.name)}" data-f="raw" value="${esc(r.raw || '')}" inputmode="decimal"></td><td class="r"><input class="inp sm num" style="width:72px" data-ns="${esc(s.name)}" data-f="avg" value="${esc(r.avg || '')}" inputmode="decimal"></td><td class="r">${s.noGrade ? '-' : gsel(s.name, 'grade', r.grade)}</td>`}<td class="r"><select class="inp sm" style="width:64px" data-ns="${esc(s.name)}" data-f="ach"><option value="">-</option>${['A', 'B', 'C', 'D', 'E', 'P'].map((g) => `<option ${r.ach === g ? 'selected' : ''}>${g}</option>`).join('')}</select></td></tr>`; }).join('')}
        </tbody></table></div>
        ${split ? `<p class="tiny" style="margin:12px 0 0">중간고사·기말고사 점수와 등급을 시험마다 따로 적어요. 학기 최종 등급이 나오면 그걸로 평균을 내고, 아직이면 중간·기말 등급 평균으로 계산해요${mAvg != null || fAvg != null ? ` · 평균 중간 <b class="num">${mAvg != null ? fmt1(mAvg) : '-'}</b>점, 기말 <b class="num">${fAvg != null ? fmt1(fAvg) : '-'}</b>점` : ''}</p>` : ''}
        <div class="row between" style="margin-top:16px"><span class="muted">${sem.replace('-', '학년 ')}학기 평균 <b class="num" style="color:var(--t1)">${av ? fmt1(av) : '-'}</b>등급</span><button class="btn sm" id="ns-add" type="button">과목 더하기</button></div></section>
    </div>`;
  }
  function bindNaesin() {
    $$('[data-sem]').forEach((b) => (b.onclick = () => { UI.semester = b.dataset.sem; render(); }));
    const nsSet = (x) => { const sem = UI.semester; S.naesin[sem] = S.naesin[sem] || {}; const r = (S.naesin[sem][x.dataset.ns] = S.naesin[sem][x.dataset.ns] || {}); const v = x.value.trim(); r[x.dataset.f] = x.dataset.f === 'ach' ? v : v === '' ? '' : +v; };
    $$('input[data-ns]').forEach((x) => (x.oninput = () => { if (x.value.trim() !== '' && isNaN(+x.value.trim())) return; nsSet(x); saveSt.wait = true; paintSaveSt(); save('naesin'); }));
    $$('[data-ns]').forEach((x) => (x.onchange = () => { const sem = UI.semester; S.naesin[sem] = S.naesin[sem] || {}; const r = (S.naesin[sem][x.dataset.ns] = S.naesin[sem][x.dataset.ns] || {}); const v = x.value.trim(); r[x.dataset.f] = x.dataset.f === 'ach' ? v : v === '' ? '' : +v; save('naesin'); render(); }));
    const a = $('#ns-add'); if (a) a.onclick = () => sheet(`<h2>과목 더하기</h2><div class="field"><label>과목 이름</label><input class="inp" id="na-n"></div><div class="field"><label>단위 수</label><input class="inp" id="na-c" inputmode="numeric" value="2"></div><button class="btn primary big block" id="na-ok" type="button">더하기</button>`, (el, close) => { $('#na-ok', el).onclick = () => { const n = $('#na-n', el).value.trim(); if (!n) return; const sem = UI.semester; S.naesin[sem] = S.naesin[sem] || {}; S.naesin[sem][n] = { credits: +$('#na-c', el).value || 1 }; save('naesin'); close(); render(); }; });
  }

  // ───────── 생기부 ─────────
  const SGB = D.sgb || {};
  const AREAS = (SGB.areas && SGB.areas.length) ? SGB.areas : [
    { key: 'setuk', name: '교과 세특', limit: 500, per: '과목마다' },
    { key: 'auto', name: '자율·자치활동', limit: 500 },
    { key: 'club', name: '동아리활동', limit: 500 },
    { key: 'career', name: '진로활동', limit: 500 },
    { key: 'behav', name: '행동특성 및 종합의견', limit: 300 },
  ];
  const areaOf = (k) => AREAS.find((a) => a.key === k) || AREAS[0];
  const BANNED = (SGB.banned && SGB.banned.length) ? SGB.banned : [
    { w: ['대회', '수상', '경시'], why: '교외 대회·수상 실적은 적을 수 없어요 (교내도 수상경력 칸 외에는 쓰지 않아요)' },
    { w: ['논문', '학회', '학술지', '등재'], why: '논문·학회 발표는 적을 수 없어요' },
    { w: ['특허', '출원'], why: '특허는 적을 수 없어요' },
    { w: ['토익', '토플', 'TOEIC', 'TOEFL', 'TEPS', 'HSK', 'JLPT', '자격증'], why: '공인어학시험·교외 인증은 적을 수 없어요' },
    { w: ['학원', '과외', '인강', '사교육'], why: '사교육 관련 내용은 적을 수 없어요' },
    { w: ['아버지', '어머니', '부모님', '엄마', '아빠'], why: '부모의 직업·지위를 짐작하게 하는 내용은 적을 수 없어요' },
    { w: ['해외', '어학연수'], why: '해외 활동 실적은 적을 수 없어요' },
    { w: ['서울대', '연세대', '고려대', '대학교'], why: '특정 대학명·기관명·상호명은 적을 수 없어요' },
  ];
  // NEIS 글자 수: 한글 3바이트, 영문·숫자·공백 1바이트, 줄바꿈 2바이트. 한도 500자 = 1500바이트
  const neisBytes = (t) => [...String(t || '')].reduce((a, ch) => a + (ch === '\n' ? 2 : ch.charCodeAt(0) > 127 ? 3 : 1), 0);
  const bannedIn = (t) => BANNED.filter((b) => b.w.some((w) => String(t || '').includes(w)));
  // 구조 초안: 동기 → 과정(개념·자료) → 결과·한계 → 후속. 생기부 문체(~함, ~임)로 맞춤
  function toNeis(s) { return String(s || '').trim().replace(/[.。]+$/, '').replace(/했어요$|했다$|했습니다$/, '함').replace(/해요$|한다$|합니다$/, '함').replace(/였어요$|였다$|이었다$/, '였음').replace(/이에요$|예요$|이다$|입니다$/, '임').replace(/있어요$|있다$|있습니다$/, '있음').replace(/알았어요$|알았다$/, '알게 됨').replace(/느꼈어요$|느꼈다$/, '느낌'); }
  function draftOf(it) {
    const parts = [];
    if (it.topic) parts.push(`${toNeis(it.motive) ? toNeis(it.motive).replace(/함$/, '하여') + ' ' : ''}'${it.topic.trim()}'을(를) 주제로 ${it.kind || '발표'}함`);
    if (it.process) parts.push(toNeis(it.process).endsWith('함') || toNeis(it.process).endsWith('임') ? toNeis(it.process) : toNeis(it.process) + '함');
    if (it.concept) parts.push(`이 과정에서 ${it.concept.trim()}의 개념을 활용하여 내용을 논리적으로 구성함`);
    if (it.result) parts.push(toNeis(it.result).match(/[함임음됨김]$/) ? toNeis(it.result) : toNeis(it.result) + '을 이해함');
    if (it.next) parts.push(`이후 ${it.next.trim().replace(/[.。]+$/, '')}(으)로 탐구를 확장하려는 의지를 보임`);
    return parts.map((p) => p.replace(/\s+/g, ' ') + '.').join(' ');
  }
  const sgText = (x) => (x.final || x.draft || draftOf(x) || '').trim();
  const pickedLen = (area, subj) => (S.sgb || []).filter((x) => x.pick && x.area === area && (subj == null || (x.subj || '') === subj)).reduce((a, x) => a + [...sgText(x)].length, 0);
  const pickedSubjs = () => new Set((S.sgb || []).filter((x) => x.pick && x.area === 'setuk').map((x) => x.subj || '')).size;
  function pickSheet(area) {
    let cur = area && area !== 'all' ? area : 'setuk';
    const draw = (el) => {
      const a = areaOf(cur), L = (S.sgb || []).filter((x) => x.area === cur).sort((p, q) => (p.at || 0) - (q.at || 0));
      const groups = cur === 'setuk' ? [...new Set(L.map((x) => x.subj || '과목 없음'))].map((g) => ({ g, L: L.filter((x) => (x.subj || '과목 없음') === g) })) : [{ g: '', L }];
      $('#pk-body', el).innerHTML = `<div class="chips wrap" style="margin-bottom:12px">${AREAS.map((x) => `<button type="button" class="chip sm ${x.key === cur ? 'on' : ''}" data-pa="${x.key}">${esc(x.name.replace(' 및 종합의견', ''))}</button>`).join('')}</div>
        ${L.length ? groups.map(({ g, L: G }) => { const ch = G.filter((x) => x.pick).reduce((s2, x) => s2 + [...sgText(x)].length, 0); const over = ch > a.limit; return `<div class="pk-g">${g ? `<div class="row between" style="margin:12px 0 8px"><b>${esc(g)}</b></div>` : ''}<div class="row between tiny" style="margin-bottom:8px"><span>고른 글 <b class="num" style="color:${over ? 'var(--red)' : 'var(--t1)'}">${ch}</b> / ${a.limit}자${over ? ` · ${ch - a.limit}자 넘어요. 하나를 빼거나 줄여요` : ''}</span></div><div class="bar" style="margin-bottom:8px"><span style="width:${Math.min(100, (ch / a.limit) * 100)}%;${over ? 'background:var(--red)' : ''}"></span></div>${G.map((x) => { const t = sgText(x); return `<button type="button" class="pk-it ${x.pick ? 'on' : ''}" data-pk="${esc(x.id)}"><span class="ck">${x.pick ? '✓' : ''}</span><span class="body"><b>${esc(x.topic || '(제목 없음)')}</b><span class="tiny">${[...t].length}자 · ${x.final ? '다듬음' : '초안'} · ${new Date(x.at).getMonth() + 1}월 ${new Date(x.at).getDate()}일</span><span class="pk-t">${esc(t.slice(0, 90))}${t.length > 90 ? '…' : ''}</span></span></button>`; }).join('')}</div>`; }).join('') : `<div class="empty">${ic('write')}<b>${esc(a.name)} 기록이 아직 없어요</b><span>먼저 기록을 모아 두면 여기서 고를 수 있어요</span></div>`}`;
      $$('[data-pa]', el).forEach((b) => (b.onclick = () => { cur = b.dataset.pa; draw(el); }));
      $$('[data-pk]', el).forEach((b) => (b.onclick = () => { const x = S.sgb.find((y) => y.id === b.dataset.pk); x.pick = !x.pick; save('sgb'); draw(el); }));
    };
    sheet(`<h2>최종 고르기</h2><p class="sub">생기부에 실제로 넣을 기록만 골라요. 다 넣을 수는 없어서, 진로와 잘 이어지고 내 생각이 잘 보이는 것을 먼저 골라요</p><div id="pk-body"></div><button class="btn primary big block" id="pk-ok" type="button" style="margin-top:16px">다 골랐어요</button>`, (el, close) => { draw(el); $('#pk-ok', el).onclick = () => { close(); render(); }; });
  }
  function sgbSummary(cls) {
    const items = S.sgb || [];
    const byArea = AREAS.map((a) => ({ ...a, n: items.filter((x) => x.area === a.key).length, fin: items.filter((x) => x.area === a.key && x.final).length }));
    return `<section class="card ${cls}"><div class="card-h"><h2>생기부 기록</h2><button class="more" data-go="sgb">기록하기</button></div><div class="list">${byArea.map((a) => `<div class="li" style="padding:8px 0"><div class="body"><div class="row between"><span class="t" style="font-size:14px">${esc(a.name)}</span><span class="tiny num">${a.n}개 · 다듬음 ${a.fin}</span></div><div class="bar" style="margin-top:6px"><span style="width:${Math.min(100, a.n * 20)}%"></span></div></div></div>`).join('')}</div></section>`;
  }
  function sgbView() {
    const items = (S.sgb || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0));
    const f = UI.sgbArea; const L = items.filter((x) => f === 'all' || x.area === f);
    const rules = SGB.rules || [];
    return `<h1 class="h1">생기부</h1><p class="sub">학교에서 한 발표·탐구를 적으면, 합격 생기부 구조로 다듬어 줘요</p>
      <div class="grid">
        ${logsSection()}
        <section class="card c8 col-card"><div class="card-h"><h2>영역별로 모으기</h2></div><p class="tiny" style="margin:-4px 0 12px">많이 적어 두고, 학기 끝에 실제로 넣을 것만 골라요. 고른 글이 칸 글자 수 안에 들어가야 해요</p>
          <div class="sgb-area">${AREAS.map((a) => { const n = items.filter((x) => x.area === a.key).length, ch = pickedLen(a.key); return `<button class="a" style="border:0;text-align:left;cursor:pointer;${f === a.key ? 'outline:2px solid var(--blue)' : ''}" data-sa="${a.key}" type="button"><span>${esc(a.name)}</span><b class="num">${n}<small>개 기록</small></b><div class="bar" style="margin:8px 0 6px"><span style="width:${Math.min(100, (ch / a.limit) * 100)}%;${ch > a.limit ? 'background:var(--red)' : ''}"></span></div><span>${a.key === 'setuk' ? `고른 과목 ${pickedSubjs()}개` : `고른 글 ${ch} / ${a.limit}자`}</span></button>`; }).join('')}</div>
          <div class="row" style="gap:8px;margin-top:auto;padding-top:16px"><button class="btn primary big" style="flex:2" id="sg-new" type="button">${ic('write')} 새 활동 기록하기</button><button class="btn big" style="flex:1" id="sg-pick2" type="button">최종 고르기</button></div></section>
        <section class="card c4"><div class="card-h"><h2>꼭 지킬 것</h2></div><div class="list">${(rules.length ? rules : [{ t: '교외 활동·수상·논문·자격증은 적지 않아요' }, { t: '부모 직업, 사교육, 특정 대학·기관 이름은 쓰지 않아요' }, { t: '세특은 과목마다 500자(1,500바이트)까지예요' }, { t: '한 일보다 「어떻게 생각했고 무엇을 배웠는지」가 중요해요' }]).slice(0, 6).map((r) => `<div class="li" style="padding:8px 0;align-items:flex-start"><div class="body"><div class="t" style="font-size:14px;font-weight:500;line-height:1.6">${esc(r.t)}</div>${r.d ? `<div class="d">${esc(r.d)}</div>` : ''}</div></div>`).join('')}</div>${SGB.src ? `<p class="tiny" style="margin:8px 0 0">${esc(SGB.src)}</p>` : ''}</section>
        <section class="card c12"><div class="card-h"><h2>${f === 'all' ? '모든 기록' : esc(areaOf(f).name)} ${L.length}</h2>${f !== 'all' ? '<button class="more" data-sa="all">전체</button>' : ''}</div>
          ${L.length ? `<div class="list">${L.map((x) => `<div class="li btnlike" data-sg="${esc(x.id)}"><div class="ico">${ic(x.final ? 'star' : 'memo')}</div><div class="body"><div class="t">${esc(x.topic || '(제목 없음)')}</div><div class="d">${esc(areaOf(x.area).name)}${x.subj ? ' · ' + esc(x.subj) : ''} · ${new Date(x.at).getMonth() + 1}월 ${new Date(x.at).getDate()}일</div></div>${x.pick ? '<span class="tag green">넣을 것</span> ' : ''}${x.final ? '<span class="tag blue">다듬음</span>' : '<span class="tag">초안</span>'}</div>`).join('')}</div>` : `<div class="empty">${ic('write')}<b>아직 기록이 없어요</b><span>발표나 수행평가를 하면 바로 적어 두세요. 기억이 생생할 때가 제일 좋아요</span></div>`}</section>
        ${SGB.patterns && SGB.patterns.length ? `<section class="card c12"><div class="card-h"><h2>합격 생기부는 이렇게 써요</h2></div><div class="grid">${SGB.patterns.slice(0, 6).map((p) => `<div class="c4" style="padding:16px;background:var(--fill2);border-radius:16px"><div class="eyebrow">${esc(p.subj || p.t || '')}</div>${p.from ? `<p class="tiny" style="margin:8px 0">발표: ${esc(p.from)}</p>` : ''}<p style="margin:8px 0 0;line-height:1.7;font-size:14px">${esc(p.to || p.d || '')}</p></div>`).join('')}</div></section>` : ''}
      </div>`;
  }
  function sgbSheet(id, pre) {
    const it = id ? (S.sgb || []).find((x) => x.id === id) : { id: 'g' + Date.now(), area: UI.sgbArea !== 'all' ? UI.sgbArea : 'setuk', subj: '', kind: '발표', topic: '', motive: '', process: '', concept: '', result: '', next: '', final: '', at: Date.now(), ...(pre || {}) };
    const subjOpts = ['국어', '수학', '영어', '한국사', '통합사회', '통합과학', '과학탐구실험', '정보', '기타'];
    sheet(`<h2>${id ? '활동 기록' : '새 활동 기록'}</h2><p class="sub">편하게 말하듯 적으면 초안이 생겨요</p>
      <div class="row" style="gap:12px"><div class="field" style="flex:1"><label>영역</label><select class="inp" id="g-area">${AREAS.map((a) => `<option value="${a.key}" ${it.area === a.key ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div><div class="field" style="flex:1" id="g-subj-w"><label>과목</label><select class="inp" id="g-subj"><option value="">-</option>${subjOpts.map((s) => `<option ${it.subj === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <div class="row" style="gap:12px"><div class="field" style="flex:2"><label>주제</label><input class="inp" id="g-topic" value="${esc(it.topic)}" placeholder="예) 효소의 작용과 온도"></div><div class="field" style="flex:1"><label>무엇을</label><select class="inp" id="g-kind">${['발표', '탐구 보고서', '토론', '실험', '독서 활동', '프로젝트', '글쓰기'].map((k) => `<option ${it.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div></div>
      <div class="field"><label>왜 이 주제를 골랐어요?</label><input class="inp" id="g-motive" value="${esc(it.motive)}" placeholder="예) 수업에서 효소를 배우며 온도가 바뀌면 어떻게 될지 궁금했어요"></div>
      <div class="field"><label>어떻게 했어요?</label><textarea class="inp" id="g-process" placeholder="찾아본 자료, 실험, 정리한 방법을 적어요">${esc(it.process)}</textarea></div>
      <div class="field"><label>수업에서 배운 어떤 개념을 썼어요?</label><input class="inp" id="g-concept" value="${esc(it.concept)}" placeholder="예) 중화 반응, 작용기"></div>
      <div class="field"><label>무엇을 알게 됐어요?</label><textarea class="inp" id="g-result" style="min-height:80px">${esc(it.result)}</textarea></div>
      <div class="field"><label>더 알아보고 싶은 것</label><input class="inp" id="g-next" value="${esc(it.next)}" placeholder="예) 산업에서 효소를 쓰는 방법"></div>
      <div class="field"><span class="lb">구조 초안</span><div class="draft" id="g-draft"></div><div class="count" id="g-count"></div><div id="g-warn"></div></div>
      <div class="field"><span class="lb">${TEACHER ? '선생님이 다듬은 문장' : '선생님이 다듬은 문장'}</span>${TEACHER ? `<textarea class="inp" id="g-final" style="min-height:160px">${esc(it.final || '')}</textarea><div class="count" id="g-fcount"></div>` : it.final ? `<div class="draft final">${esc(it.final)}</div><button class="btn soft sm" id="g-copy" type="button" style="margin-top:8px">복사하기</button>` : '<p class="muted" style="margin:0">저장하면 선생님이 다듬어 줄 거예요</p>'}</div>
      <div class="row"><button class="btn primary big" style="flex:1" id="g-save" type="button">저장하기</button>${id ? '<button class="btn big" id="g-del" type="button">지우기</button>' : ''}</div>`, (el, close) => {
      const val = () => ({ area: $('#g-area', el).value, subj: $('#g-subj', el).value, kind: $('#g-kind', el).value, topic: $('#g-topic', el).value, motive: $('#g-motive', el).value, process: $('#g-process', el).value, concept: $('#g-concept', el).value, result: $('#g-result', el).value, next: $('#g-next', el).value });
      const upd = () => {
        const v = val(); const dr = draftOf(v); const a = areaOf(v.area); $('#g-subj-w', el).style.display = v.area === 'setuk' ? '' : 'none';
        $('#g-draft', el).textContent = dr || '위 칸을 채우면 여기에 초안이 생겨요';
        const b = neisBytes(dr), lim = a.limit * 3; $('#g-count', el).textContent = `${b.toLocaleString()} / ${lim.toLocaleString()}바이트 (${a.limit}자)`; $('#g-count', el).className = 'count' + (b > lim ? ' over' : '');
        const bad = bannedIn(Object.values(v).join(' ') + ' ' + ((el.querySelector('#g-final') || {}).value || ''));
        $('#g-warn', el).innerHTML = bad.length ? `<div class="warn" style="margin-top:8px">${bad.map((x) => esc(x.why)).join('<br>')}</div>` : '';
        const fc = $('#g-fcount', el); if (fc) { const fb = neisBytes($('#g-final', el).value); fc.textContent = `${fb.toLocaleString()} / ${lim.toLocaleString()}바이트`; fc.className = 'count' + (fb > lim ? ' over' : ''); }
      };
      $$('input,textarea,select', el).forEach((x) => (x.oninput = upd)); upd();
      $('#g-save', el).onclick = () => { const v = val(); Object.assign(it, v, { draft: draftOf(v), at: it.at || Date.now(), upd: Date.now() }); if (TEACHER) { const fv = $('#g-final', el).value.trim(); if (fv !== (it.final || '')) { it.final = fv; it.finalAt = Date.now(); } } S.sgb = S.sgb || []; if (!S.sgb.includes(it)) S.sgb.push(it); if (it.fromLog) { const lg = (S.logs || []).find((l) => l.id === it.fromLog); if (lg) { lg.used = true; save('logs'); } } save('sgb'); close(); render(); toast('저장했어요'); };
      const dl = $('#g-del', el); if (dl) dl.onclick = () => { S.sgb = S.sgb.filter((x) => x.id !== it.id); save('sgb'); close(); render(); };
      const cp = $('#g-copy', el); if (cp) cp.onclick = () => { navigator.clipboard.writeText(it.final).then(() => toast('복사했어요')); };
    });
  }

  // ───────── 고3 영어 하루 한 문제 (문장 분석 · 천일문 연결) ─────────
  const unitIdx = (ch, unit) => CH_UNITS.findIndex((u) => +u.ch === +ch && String(u.unit) === String(unit));
  function g3Run() {
    const ed = engToday(true); const li = UI.run && UI.run.kind === 'g3' && UI.run.lib != null ? UI.run.lib : null; const it = G3[li != null ? li : ed.g3 != null ? ed.g3 : 0];
    if (!it) return `<div class="card empty">${ic('eng')}<b>고3 문제를 준비하는 중이에요</b></div>`;
    S.eng.g3ans = S.eng.g3ans || {}; const a = S.eng.g3ans[it.id];
    const showWords = UI.run && UI.run.words;
    UI.run = { kind: 'g3', id: it.id, words: showWords, lib: li };
    const head = `<div class="row between">${li != null ? '<button class="btn sm" data-lib="g3" type="button">‹ 고3 목록</button>' : '<button class="btn sm" data-go="hw" type="button">‹ 숙제</button>'}<span class="tiny">${esc(it.src || '')} · ${esc(it.type || '')}</span></div>`;
    const words = `<div class="card"><div class="card-h"><h3>이 글의 단어 ${(it.words || []).length}개</h3>${a ? '' : `<button class="more" id="g3-w" type="button">${showWords ? '접기' : '먼저 보기'}</button>`}</div>${a || showWords ? `<table class="tbl"><tbody>${(it.words || []).map((w) => `<tr><td><b>${esc(w.en)}</b></td><td style="color:var(--t2)">${esc(w.ko)}</td></tr>`).join('')}</tbody></table>` : '<p class="tiny" style="margin:0">모르는 단어가 많으면 먼저 보고 풀어도 돼요</p>'}</div>`;
    const prob = `<div class="card"><div class="q-no">오늘의 고3 문제 <span class="tag">${esc(it.type || '')}</span>${it.level ? ` <span class="tag">${'★'.repeat(it.level)}</span>` : ''}</div><div class="q-text" style="margin-top:8px">${esc(it.q)}</div>${it.given ? `<div class="q-box" style="font-size:15.5px;line-height:1.75;border:1.5px solid var(--t2)">${esc(it.given)}</div>` : ''}<div class="q-box" style="font-size:15.5px;line-height:1.85;font-weight:400">${esc(it.passage)}</div>${it.notes ? `<p class="tiny" style="margin:8px 0 0;white-space:pre-wrap">${esc(Array.isArray(it.notes) ? it.notes.join('\n') : it.notes)}</p>` : ''}</div>`;
    const sents = a ? `<div class="card"><div class="card-h"><h3>문장마다 뜯어보기</h3><span class="tiny">파란 칸을 누르면 천일문 그 부분으로 가요</span></div><div class="list">${(it.sentences || []).map((s, k) => `<div class="li" style="align-items:flex-start;flex-direction:column;gap:6px"><div class="t" style="font-size:15.5px;line-height:1.65"><span class="tiny num" style="margin-right:6px">${k + 1}</span>${esc(s.en)}</div><div class="d" style="font-size:14px">${esc(s.ko)}</div>${s.analysis ? `<div class="explain" style="margin:0;width:100%">${esc(s.analysis)}</div>` : ''}${(s.cheonil || []).filter((c) => unitIdx(c.ch, c.unit) >= 0).map((c) => `<button class="btn sm soft" type="button" data-cu="${c.ch}|${c.unit}">천일문 Unit ${esc(c.unit)} ${esc((CH_UNITS[unitIdx(c.ch, c.unit)] || {}).title || '')} 공부하기</button>${c.why ? `<span class="tiny">${esc(c.why)}</span>` : ''}`).join('')}</div>`).join('')}</div></div>` : '';
    return `<div class="qwrap" style="max-width:820px;margin:0 auto">${head}${prob}${choicesHtml({ choices: it.choices, answer: it.answer }, a ? a.pick : null)}${a ? verdict(a.ok) + (it.exp ? `<div class="explain"><b>해설</b><br>${esc(it.exp)}</div>` : '') : ''}${words}${sents}${a ? '<div class="cta-bar"><button class="btn primary big block" data-go="hw" type="button">숙제로 돌아가기</button></div>' : ''}</div>`;
  }
  function bindG3() {
    const ed = engToday(true), li = UI.run && UI.run.lib != null ? UI.run.lib : null, it = G3[li != null ? li : ed.g3 || 0]; if (!it) return;
    $$('[data-pick]').forEach((b) => (b.onclick = () => {
      const k = +b.dataset.pick, ok = k === it.answer; S.eng.g3ans[it.id] = { pick: k, ok, at: Date.now() };
      if (li == null && !ed.g3done) { ed.g3done = Date.now(); S.eng.g3 = (S.eng.g3 || 0) + 1; }
      const wid = 'g3:' + it.id; if (!ok) addWrong(wid, { src: 'g3', subj: 'eng', subjName: '영어', area: '고3 ' + (it.type || '독해'), sub: it.src, g3: it.id }); else { gotIt(wid); if (S.wrong[wid]) clearWrong(wid); }
      save('eng'); render();
    }));
    const w = $('#g3-w'); if (w) w.onclick = () => { UI.run.words = !UI.run.words; render(); };
    $$('[data-cu]').forEach((b) => (b.onclick = () => { const [ch, un] = b.dataset.cu.split('|'); UI.run = { kind: 'unit', ref: unitIdx(ch, un), back: 'g3', g3lib: li }; render(); window.scrollTo(0, 0); }));
  }

  // ───────── 선생님이 내는 약한 영역 문제 ─────────
  const allDrills = () => [...(D.drills || []), ...(S.drills || [])].filter((d) => d.qs && d.qs.length).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const drillAns = (id) => ((S.drillAns || {})[id] || {});
  const drillDone = (d) => Object.keys(drillAns(d.id)).length >= d.qs.length;
  const openDrills = () => allDrills().filter((d) => !drillDone(d) && (!d.date || d.date <= today()));
  const weakAreas = (subj) => { const m = {}; for (const w of openWrong()) if (!subj || w.subj === subj) m[w.area || '기타'] = (m[w.area || '기타'] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k]) => k); };
  function drillRun() {
    const d = allDrills().find((x) => x.id === UI.run.id); if (!d) { UI.run = null; return hwView(); }
    const ans = drillAns(d.id); let i = UI.run.i != null ? UI.run.i : d.qs.findIndex((_, k) => !ans[k]);
    const head = `<div class="row between"><button class="btn sm" data-go="hw" type="button">‹ 숙제</button><span class="tiny">${esc(SUBJ_NAMES[d.subj] || d.subj)} · ${esc(d.area || '')}</span></div>`;
    if (i < 0) { const ok = Object.values(ans).filter((x) => x.ok).length; return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}${doneCard(ok, d.qs.length, ok === d.qs.length ? '이 영역은 이제 괜찮아요' : '틀린 문제는 오답 노트에 들어갔어요', '<button class="btn primary big block" data-go="hw" type="button">숙제로</button><button class="btn big block" data-go="wrong" type="button">오답 노트</button>')}</div>`; }
    const q = d.qs[i], a = ans[i]; UI.run.i = i;
    return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}<div class="progress-dots">${d.qs.map((_, k) => `<i class="${ans[k] ? (ans[k].ok ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card"><div class="q-no">${i + 1}번 <span class="tag blue">${esc(d.title || '선생님이 낸 문제')}</span></div>${q.img ? `<img class="q-img" style="margin-top:12px" src="${esc(q.img)}" alt="">` : ''}<div style="margin-top:8px">${qBody(q)}</div></div>
      ${choicesHtml(q, a ? a.pick : null)}${a ? verdict(a.ok) + (q.exp ? `<div class="explain"><b>해설</b><br>${esc(q.exp)}</div>` : '') + `<div class="cta-bar"><button class="btn primary big block" id="next" type="button">${d.qs.some((_, k) => !ans[k]) ? '다음 문제' : '결과 보기'}</button></div>` : ''}</div>`;
  }
  function bindDrill() {
    const d = allDrills().find((x) => x.id === UI.run.id); if (!d) return; const i = UI.run.i, q = d.qs[i];
    $$('[data-pick]').forEach((b) => (b.onclick = () => { const k = +b.dataset.pick, ok = k === q.answer; S.drillAns = S.drillAns || {}; (S.drillAns[d.id] = S.drillAns[d.id] || {})[i] = { pick: k, ok, at: Date.now() }; const wid = `drill:${d.id}:${i}`; if (!ok) addWrong(wid, { src: 'drill', subj: d.subj, subjName: SUBJ_NAMES[d.subj], area: d.area || '기타', sub: (q.q || '').slice(0, 40), title: `${d.title || d.area} ${i + 1}번`, set: d.id, i }); else { gotIt(wid); if (S.wrong[wid]) clearWrong(wid); } save('drillAns'); render(); }));
    const n = $('#next'); if (n) n.onclick = () => { UI.run = { kind: 'drill', id: d.id }; render(); window.scrollTo(0, 0); };
  }
  // 붙여넣기 형식: 1. 문제 / ① … ⑤ … / 정답 3 / 해설 …
  function parseDrill(text) {
    const qs = []; let cur = null, mode = 'q';
    const CIR = '①②③④⑤';
    for (let line of String(text).split('\n')) {
      line = line.trim(); if (!line) continue;
      let m;
      if ((m = line.match(/^(\d{1,2})\s*[.)]\s*(.*)$/)) && !(cur && mode === 'q' && cur.choices.length === 0 && /^\d+\)/.test(line))) { cur = { q: m[2], choices: [], answer: null, exp: '' }; qs.push(cur); mode = 'q'; continue; }
      if (!cur) { cur = { q: '', choices: [], answer: null, exp: '' }; qs.push(cur); }
      if ((m = line.match(/^(정답|답)\s*[:：]?\s*([①-⑤1-5])/))) { const c = m[2]; cur.answer = CIR.includes(c) ? CIR.indexOf(c) : +c - 1; mode = 'a'; continue; }
      if ((m = line.match(/^해설\s*[:：]?\s*(.*)$/))) { cur.exp = m[1]; mode = 'e'; continue; }
      if (/[①②③④⑤]/.test(line[0])) { line.split(/(?=[①②③④⑤])/).forEach((p) => { const t = p.replace(/^[①②③④⑤]\s*/, '').trim(); if (t) cur.choices.push(t); }); mode = 'c'; continue; }
      if (mode === 'e') cur.exp += (cur.exp ? '\n' : '') + line; else if (mode === 'q') cur.q += (cur.q ? '\n' : '') + line;
    }
    return qs.filter((q) => q.q && q.choices.length >= 2 && q.answer != null && q.answer < q.choices.length);
  }
  function drillAddSheet() {
    const subs = Object.entries(SUBJ_NAMES);
    sheet(`<h2>약한 영역 문제 내기</h2><p class="sub">${esc(U.who)}의 오늘 할 일에 바로 떠요. 틀리면 오답 노트로 가요</p>
      <div class="row" style="gap:12px"><div class="field" style="flex:1"><label>과목</label><select class="inp" id="dr-s">${subs.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>언제 풀까요</label><input class="inp" type="date" id="dr-d" value="${today()}"></div></div>
      <div class="field"><label>영역</label><input class="inp" id="dr-a" list="dr-al" placeholder="예) 중화 반응"><datalist id="dr-al"></datalist><div class="chips" id="dr-weak" style="margin-top:8px"></div></div>
      <div class="field"><label>문제 붙여넣기</label><textarea class="inp" id="dr-t" style="min-height:220px" placeholder="1. 문제\n① 보기 ② 보기 ③ 보기 ④ 보기 ⑤ 보기\n정답 3\n해설 왜 3번인지\n\n2. 다음 문제 …"></textarea><div class="count" id="dr-c"></div></div>
      <button class="btn primary big block" id="dr-ok" type="button">내기</button>`, (el, close) => {
      const upd = () => { const w = weakAreas($('#dr-s', el).value); $('#dr-al', el).innerHTML = w.map((x) => `<option value="${esc(x)}">`).join(''); $('#dr-weak', el).innerHTML = w.slice(0, 6).map((x) => `<button class="chip" type="button" data-wa="${esc(x)}">약한 영역 · ${esc(x)}</button>`).join(''); $$('[data-wa]', el).forEach((b) => (b.onclick = () => { $('#dr-a', el).value = b.dataset.wa; })); };
      $('#dr-s', el).onchange = upd; upd();
      $('#dr-t', el).oninput = () => { const n = parseDrill($('#dr-t', el).value).length; $('#dr-c', el).textContent = n ? `${n}문제를 읽었어요` : '형식을 확인해 주세요 (번호. 문제 / ①~⑤ / 정답 N)'; };
      $('#dr-ok', el).onclick = () => { const qs = parseDrill($('#dr-t', el).value); if (!qs.length) { toast('문제를 읽지 못했어요'); return; } const subj = $('#dr-s', el).value, area = $('#dr-a', el).value.trim() || '기타'; S.drills = S.drills || []; S.drills.push({ id: 'd' + Date.now(), date: $('#dr-d', el).value || today(), subj, area, title: `${SUBJ_NAMES[subj]} ${area}`, qs, at: Date.now() }); save('drills'); close(); render(); toast(`${qs.length}문제를 냈어요`); };
    });
  }
  function drillCard() {
    const L = allDrills(); if (!L.length && !TEACHER) return '';
    return `<section class="card c12"><div class="card-h"><h2>약한 영역 문제</h2>${TEACHER ? '<button class="btn sm soft" id="dr-add" type="button">문제 내기</button>' : ''}</div>
      ${L.length ? `<div class="list">${L.slice(0, 20).map((d) => { const an = drillAns(d.id), n = Object.keys(an).length, ok = Object.values(an).filter((x) => x.ok).length; return `<div class="li btnlike" data-task="drill:${esc(d.id)}"><div class="ico">${ic(drillDone(d) ? 'ok' : 'target')}</div><div class="body"><div class="t">${esc(d.title || d.area)}</div><div class="d">${d.date ? md(d.date) + ' · ' : ''}${d.qs.length}문제${n ? ` · ${ok}/${d.qs.length} 맞힘` : ''}</div></div>${drillDone(d) ? '<span class="tag blue">완료</span>' : '<span class="tag red">풀기</span>'}${TEACHER && (S.drills || []).some((x) => x.id === d.id) ? `<button class="btn sm" type="button" data-drdel="${esc(d.id)}">지우기</button>` : ''}</div>`; }).join('')}</div>` : `<div class="empty">${ic('target')}<b>아직 낸 문제가 없어요</b><span>${TEACHER ? '약한 영역을 보고 「문제 내기」로 3문제씩 내 주세요' : '선생님이 약한 영역 문제를 내 주실 거예요'}</span></div>`}</section>`;
  }

  // ───────── 매일 한 줄 기록 (생기부 재료) ─────────
  const LOG_SUBJ = ['국어', '수학', '영어', '한국사', '통합사회', '통합과학', '과학탐구실험', '정보', '자율·자치', '동아리', '진로', '기타'];
  const LOG_KIND = ['발표', '토론', '모둠활동', '수행평가', '질문', '실험', '글쓰기', '그냥 든 생각'];
  const semOf = (d) => { const [y, m] = String(d).split('-').map(Number); return m >= 8 || m <= 1 ? '2' : '1'; };
  const logAreaOf = (s) => (s === '자율·자치' ? 'auto' : s === '동아리' ? 'club' : s === '진로' ? 'career' : 'setuk');
  function qlogCard() {
    const L = (S.logs || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0)); const todayN = L.filter((x) => x.date === today()).length;
    const pick = UI.qlSubj || '';
    return `<section class="card c12 qlog"><div class="card-h"><h2>${ic('write')} 오늘 학교에서 한 것</h2><span class="tiny">${todayN ? `오늘 ${todayN}개 적었어요` : '한 줄이면 충분해요'}</span></div>
      <p class="tiny" style="margin:-4px 0 12px">발표·토론에서 잠깐 생각한 것도 좋아요. 나중엔 기억이 안 나서 못 써요</p>
      <div class="chips wrap" style="margin-bottom:8px">${LOG_SUBJ.map((s) => `<button class="chip ${pick === s ? 'on' : ''}" type="button" data-qls="${s}">${s}</button>`).join('')}</div>
      <div class="ql-row"><textarea class="inp" id="ql-t" rows="2" placeholder="예) 국어 조별 토론에서 「SNS 실명제」 반대 쪽을 맡아, 표현의 자유와 사생활을 근거로 반박했다"></textarea><button class="btn primary" id="ql-ok" type="button">적기</button></div>
      <div class="chips wrap" style="margin-top:8px">${LOG_KIND.map((k) => `<button class="chip sm ${UI.qlKind === k ? 'on' : ''}" type="button" data-qlk="${k}">${k}</button>`).join('')}</div>
      ${L.length ? `<div class="list" style="margin-top:12px">${L.slice(0, 3).map((x) => `<div class="li" style="padding:8px 0"><div class="body"><div class="t" style="font-size:14px;font-weight:500">${esc(x.text)}</div><div class="d">${md(x.date)} · ${esc(x.subj || '')}${x.kind ? ' · ' + esc(x.kind) : ''}</div></div></div>`).join('')}</div><button class="more" data-go="sgb" style="margin-top:8px">기록 ${L.length}개 모두 보기</button>` : ''}</section>`;
  }
  function bindQlog() {
    $$('[data-qls]').forEach((b) => (b.onclick = () => { UI.qlSubj = UI.qlSubj === b.dataset.qls ? '' : b.dataset.qls; const t = $('#ql-t').value; render(); $('#ql-t').value = t; $('#ql-t').focus(); }));
    $$('[data-qlk]').forEach((b) => (b.onclick = () => { UI.qlKind = UI.qlKind === b.dataset.qlk ? '' : b.dataset.qlk; const t = $('#ql-t').value; render(); $('#ql-t').value = t; }));
    const ok = $('#ql-ok'); if (ok) ok.onclick = () => { const t = $('#ql-t').value.trim(); if (!t) { $('#ql-t').focus(); return; } S.logs = S.logs || []; S.logs.push({ id: 'l' + Date.now(), date: today(), subj: UI.qlSubj || '기타', kind: UI.qlKind || '', text: t, at: Date.now() }); UI.qlKind = ''; save('logs'); render(); toast('적어 뒀어요. 생기부 탭에 쌓여요'); };
  }
  function logsSection() {
    const L = (S.logs || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0));
    const f = UI.logSubj || 'all'; const LL = L.filter((x) => f === 'all' || x.subj === f);
    const sem = semOf(today()); const yr = today().slice(0, 4);
    const cover = LOG_SUBJ.filter((s) => s !== '기타').map((s) => ({ s, n: L.filter((x) => x.subj === s && x.date.startsWith(yr.slice(0, 4)) && semOf(x.date) === sem).length }));
    const byDate = {}; for (const x of LL) (byDate[x.date] = byDate[x.date] || []).push(x);
    return `<section class="card c12"><div class="card-h"><h2>매일 기록 ${L.length}</h2></div>
        <div class="chips" style="margin-bottom:12px"><button class="chip ${f === 'all' ? 'on' : ''}" data-lf="all" type="button">전체</button>${[...new Set(L.map((x) => x.subj))].map((s) => `<button class="chip ${f === s ? 'on' : ''}" data-lf="${esc(s)}" type="button">${esc(s)}</button>`).join('')}</div>
        ${LL.length ? Object.entries(byDate).map(([d, xs]) => `<div class="eyebrow" style="margin:12px 0 4px">${md(d)}</div><div class="list">${xs.map((x) => `<div class="li"><div class="body"><div class="t" style="font-size:15px;font-weight:500;line-height:1.6">${esc(x.text)}</div><div class="d">${esc(x.subj)}${x.kind ? ' · ' + esc(x.kind) : ''}${x.used ? ' · <span class="blue">세특으로 키움</span>' : ''}</div></div><button class="btn sm soft" type="button" data-grow="${esc(x.id)}">세특으로 키우기</button><button class="btn sm" type="button" data-ldel="${esc(x.id)}" aria-label="지우기">지우기</button></div>`).join('')}</div>`).join('') : `<div class="empty">${ic('write')}<b>아직 기록이 없어요</b><span>홈 맨 위 칸에 오늘 한 것을 한 줄씩 적어 보세요</span></div>`}</section>
      <section class="card c12"><div class="card-h"><h2>${sem}학기 과목별 기록</h2></div><p class="tiny" style="margin:-4px 0 8px">공통과목 세특은 1·2학기가 500자 한 칸을 나눠 써요. 학기마다 거리가 있어야 해요</p><div class="list two-col">${cover.map((c) => `<div class="li" style="padding:8px 0"><div class="body"><span class="t" style="font-size:14px">${esc(c.s)}</span></div><span class="tag ${c.n ? 'blue' : 'red'}">${c.n ? c.n + '개' : '아직 없음'}</span></div>`).join('')}</div></section>`;
  }
  function bindLogs() {
    $$('[data-lf]').forEach((b) => (b.onclick = () => { UI.logSubj = b.dataset.lf; render(); }));
    $$('[data-ldel]').forEach((b) => (b.onclick = () => { S.logs = S.logs.filter((x) => x.id !== b.dataset.ldel); save('logs'); render(); }));
    $$('[data-grow]').forEach((b) => (b.onclick = () => { const x = S.logs.find((l) => l.id === b.dataset.grow); const subj = ['자율·자치', '동아리', '진로', '기타'].includes(x.subj) ? '' : x.subj; sgbSheet(null, { area: logAreaOf(x.subj), subj, kind: LOG_KIND.slice(0, 7).includes(x.kind) ? ({ 모둠활동: '프로젝트', 수행평가: '발표', 질문: '발표' }[x.kind] || x.kind) : '발표', process: x.text, fromLog: x.id }); }));
  }

  // ───────── 놓치지 않게 (토스 알림처럼 한 줄씩) ─────────
  const PICKS = D.picks || {};
  const CORE = ['국어', '수학', '영어', '한국사', '통합사회', '통합과학'];
  function insights() {
    const out = [], t = today(), sem = semOf(t), yr = t.slice(0, 4);
    const L = (S.logs || []).filter((x) => x.date.startsWith(yr) && semOf(x.date) === sem);
    if (!S.profile.uni) out.push({ icon: 'target', tone: 'blue', t: '목표 대학을 골라 주세요', d: '홈 맨 위에 늘 크게 붙어 있어요', act: 'profile' });
    const ex = (D.events || []).filter((e) => e.kind === 'exam' && dday(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (ex && dday(ex.date) <= 60) out.push({ icon: 'cal', tone: dday(ex.date) <= 21 ? 'red' : 'blue', t: `${ex.title}까지 D-${dday(ex.date)}`, d: '약한 영역 문제부터 풀어 두면 좋아요', act: 'go:wrong' });
    const empty = CORE.filter((s) => !L.some((x) => x.subj === s));
    if (empty.length) out.push({ icon: 'write', tone: 'red', t: `${empty.slice(0, 3).join(' · ')}${empty.length > 3 ? ` 외 ${empty.length - 3}과목` : ''}은 ${sem}학기 세특 거리가 아직 없어요`, d: '수업 시간에 발표·질문한 것을 한 줄만 적어 두세요', act: 'log:' + empty[0] });
    const ca = ['자율·자치', '동아리', '진로'].filter((s) => !(S.logs || []).some((x) => x.subj === s && x.date.startsWith(yr)));
    if (ca.length) out.push({ icon: 'memo', tone: '', t: `${ca.join(' · ')} 활동 기록이 아직 없어요`, d: '창체도 담임·동아리 선생님이 써 주시는 칸이에요. 한 일을 적어 두면 드리기 쉬워요', act: 'log:' + ca[0] });
    for (const m of MOCKS) { const left = (m.subjects || []).filter((s) => !(((S.mock[m.id] || {})[s.key]) || {}).done); if (left.length) { out.push({ icon: 'score', tone: 'blue', t: `${m.title} ${left.map((s) => s.name).slice(0, 3).join(' · ')}${left.length > 3 ? ' 외' : ''} 채점이 남았어요`, d: '틀린 번호만 누르면 약한 영역이 나와요', act: 'mock:' + m.id }); break; } }
    const wa = {}; for (const w of openWrong()) { const k = `${w.subjName || SUBJ_NAMES[w.subj]} · ${w.area || '기타'}`; wa[k] = (wa[k] || 0) + 1; }
    const top = Object.entries(wa).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) out.push({ icon: 'down', tone: 'red', t: `${top[0]} 영역을 조금씩 채워 가요`, d: '하루 두세 문제씩 다시 풀면 금방 파란색이 돼요', act: 'go:wrong' });
    if (!Object.keys(S.naesin['1-1'] || {}).some((k) => (S.naesin['1-1'][k] || {}).grade)) out.push({ icon: 'pencil', tone: '', t: '1학기 내신 등급을 넣어 주세요', d: '넣으면 내 위치와 목표까지 남은 등급이 보여요', act: 'naesin' });
    for (const x of (PICKS.timeline || [])) { const d0 = /^\d{4}-\d{2}$/.test(x.when) ? x.when + '-01' : x.when; if (/^\d{4}-\d{2}-\d{2}$/.test(d0) && dday(d0) >= -31 && dday(d0) <= 60) { out.push({ icon: 'bell', tone: 'blue', t: x.title, d: x.what || '', act: 'picks' }); break; } }
    return out;
  }
  function insightCard(cls) {
    const L = insights();
    return `<section class="card ${cls}"><div class="card-h"><h2>놓치지 않게</h2><span class="tiny">${L.length ? `챙길 것 ${L.length}개` : ''}</span></div>${L.length ? `<div class="list">${L.map((x, i) => `<div class="li btnlike" data-ins="${esc(x.act)}"><div class="ico ${x.tone ? 'tone-' + x.tone : ''}">${ic(x.icon)}</div><div class="body"><div class="t">${esc(x.t)}</div><div class="d">${esc(x.d)}</div></div><span class="chev"></span></div>`).join('')}</div>` : `<div class="empty">${ic('party')}<b>지금은 다 잘 채워지고 있어요</b></div>`}</section>`;
  }
  function doInsight(a) {
    if (a === 'profile') return uniSheet();
    if (a === 'naesin') { UI.scoreSeg = 'naesin'; return go('score'); }
    if (a === 'picks') return picksSheet();
    if (a.startsWith('go:')) return go(a.slice(3));
    if (a.startsWith('mock:')) { UI.scoreSeg = 'mock'; UI.mockId = a.slice(5); UI.tab = 'score'; UI.run = null; render(); return window.scrollTo(0, 0); }
    if (a.startsWith('log:')) { UI.qlSubj = a.slice(4); UI.tab = 'home'; UI.run = null; render(); const t = $('#ql-t'); if (t) { t.scrollIntoView({ block: 'center' }); t.focus(); } }
  }
  // ───────── 대학별 합격선 (생명 계열, 2026 수시 결과 9등급제 · 2026-10-25 공식 자료로 다시 확인) ─────────
  const ADMIT = D.admit || null;
  const admitOf = (id) => (ADMIT && ADMIT.unis.find((x) => x.id === id)) || null;
  const adMain = (a) => (a && a.depts && a.depts[0]) || { dept: '', tracks: [] };
  const g2 = (v) => (v == null ? '-' : (+v).toFixed(2));
  const shortDept = (d) => String(d || '').replace(/\s*\(.*$/, '');
  // 대학마다 넣는 과목이 달라서 정윤이 등급도 전형마다 달라요 (2028 시행계획 기준으로 맞춘 규칙)
  const JY_RULE = {
    all: { g: ['국', '수', '영', '한', '사', '과'], t: '국·수·영·사·과·한국사를 학점 곱해 평균' },
    'all-s': { g: ['국', '수', '영', '한', '사', '과'], simple: true, t: '국·수·영·사·과·한국사를 과목 수로 평균' },
    kesm: { g: ['국', '수', '영', '과'], t: '국·수·영·과만 학점 곱해 평균' },
    kesmh: { g: ['국', '수', '영', '한', '과'], t: '국·수·영·과·한국사 (사회 빼고)' },
    kesms: { g: ['국', '수', '영', '사', '과'], t: '국·수·영·사·과 (한국사 빼고)' },
    'all+lab': { g: ['국', '수', '영', '한', '사', '과'], lab: true, t: '6과목 + 과학탐구실험(A를 1등급으로)' },
  };
  const subjGrp = (n) => /과학탐구실험/.test(n) ? 'lab' : /^한국사/.test(n) ? '한' : /국어|문학|독서|화법|작문|매체/.test(n) ? '국' : /수학|미적분|확률|기하/.test(n) ? '수' : /영어/.test(n) ? '영' : /사회|지리|역사|윤리|정치|경제|법과/.test(n) ? '사' : /과학|물리|화학|생명|지구/.test(n) ? '과' : '';
  function jyOf(rule) {
    const R = JY_RULE[rule]; if (!R) return null; let a = 0, c = 0;
    for (const sem of SEMS) { const rec = S.naesin[sem] || {}; for (const s of nsSubjects(sem)) {
      const r = rec[s.name], grp = subjGrp(s.name);
      if (grp === 'lab') { const g = R.lab && r && { A: 1, B: 2, C: 3, D: 4, E: 5 }[r.ach]; if (g) { a += g; c += 1; } continue; }
      if (!R.g.includes(grp)) continue; const g = nsG(r); if (!g) continue; const w = R.simple ? 1 : +(r.credits || s.credits || 1); a += g * w; c += w;
    } }
    return c ? a / c : null;
  }
  const SRC_T = { official: '대학 공식 자료', adiga: '대학어디가', other: '다른 사이트 값' };
  const cutOf = (t) => (t.cut70 != null ? t.cut70 : t.avg != null ? t.avg : null);
  const cutLbl = (t) => (t.cut70 != null ? `70% ${g2(t.cut70)}` : t.avg != null ? `평균 ${g2(t.avg)}` : '비공개');
  const noMinOf = (t) => !t.min || /^(없음|해당 없음)/.test(t.min);
  function trackRow(t) {
    const jy = jyOf(t.rule);
    return `<div class="li btnlike" data-du="${esc(t._u || '')}" style="align-items:flex-start"><span class="tag ${t.type === '교과' ? 'blue' : 'green'}" style="flex:none">${esc(t.type)}</span><div class="body"><div class="t" style="font-size:15px">${esc(t.name)}${t.seats ? ` <span class="tiny">${t.seats}명</span>` : ''}</div><div class="d" style="line-height:1.6">${noMinOf(t) ? '수능최저 없음' : '수능최저 있음'}${jy ? ` · 내 등급 9등급으로 <b>약 ${fmt1(g5to9(jy))}</b> <span class="tiny">(5등급제 ${g2(jy)})</span>` : ''}</div></div><b class="num" style="flex:none;font-size:15px">${cutLbl(t)}</b><span class="chev"></span></div>`;
  }
  function admitCard(cls) {
    if (!ADMIT) return '';
    const u = uniOf(S.profile.uni), a = u && admitOf(u.id), m = adMain(a);
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('target')} ${a ? `${esc(u.short || u.name)} ${esc(shortDept(m.dept))} 합격선` : '대학별 합격선'}</h2><button class="more" id="ad-all" type="button">${ADMIT.unis.length}개 대학 비교</button></div>
      ${a ? `<p class="tiny" style="margin:0 0 8px">2026 수시 결과 · 9등급제라 참고용이에요</p><div class="list">${m.tracks.map((t) => trackRow({ ...t, _u: a.id })).join('')}</div>` : `<div class="empty">${ic('target')}<b>목표 대학을 고르면 그 대학 합격선이 나와요</b></div>`}</section>`;
  }
  // 숫자 읽는 법: 70%컷 · 대학마다 다른 내 등급 · 소수점 · A=1등급
  function adGuide() {
    const ns = nsTotal(), j1 = jyOf('all'), j2 = jyOf('kesm');
    const A = ADMIT.unis.filter((x) => x.careerA);
    return `<details class="ad-guide"><summary>${ic('bulb')} 숫자 읽는 법 · 내 등급이 대학마다 다른 까닭</summary>
      <h3>70%컷은 1차 합격선이 아니에요</h3><p>그 전형에 <b>최종 등록한 학생</b>을 내신 좋은 순서로 세웠을 때 70% 자리 학생의 등급이에요. 10명이면 7번째예요. 50%컷은 가운데 학생이에요. 이 숫자보다 좋으면 붙은 학생들 사이에서도 앞쪽이라는 뜻이에요. 몇몇 대학은 컷을 안 내고 평균만 내서 「평균」으로 적었어요.</p>
      <h3>내 등급은 대학마다 달라요</h3><p>대학은 학교에서 낸 평균을 쓰지 않고, 과목별 등급에 학점을 곱해서 자기 방식으로 다시 계산해요. 1학기만 보면 그냥 평균은 1.67, 학점을 곱하면 1.65, 국·수·영·과만 보는 대학에서는 1.50이에요.${j1 ? ` 2학기 중간 등급까지 넣은 지금 성적으로는 6과목 ${g2(j1)}${j2 ? `, 국·수·영·과 ${g2(j2)}` : ''}이에요.` : ''} 그래서 전형마다 내 등급을 따로 적었어요. 성적을 새로 넣으면 저절로 다시 계산돼요.</p>
      <h3>5등급제와 9등급제는 바로 견주면 안 돼요</h3><p>입결 숫자는 모두 9등급제예요. 정윤이 1.5(5등급제)는 9등급제로 치면 2점대 중반이에요. 그래서 목록에는 <b>9등급으로 바꾼 내 등급</b>을 크게, 원래 5등급제 값은 괄호에 적었어요. 바꾼 값은 교육부 등급 비율로 맞춘 대략값이에요.</p><h3>1.67을 1.6으로 쳐 주나요?</h3><p>아니에요. 이번에 찾은 대학 중 소수 첫째 자리에서 자르는 곳은 없어요. 서강대는 소수 둘째 자리 반올림, 숭실대는 넷째 자리 버림, 세종대는 여덟째 자리까지 쓰는 식이라 1.65는 1.65 그대로 들어가요.</p>
      <h3>A를 1등급으로 쳐 주는 대학</h3><p>1학년 과목(공통과목)은 5등급 석차가 나와서 해당이 없어요. 2·3학년 진로선택 과목에서 쓰여요.</p>${A.length ? `<ul>${A.map((x) => `<li><b>${esc(x.short)}</b> ${esc(x.careerA)}</li>`).join('')}</ul>` : ''}
      <h3>정윤이는 2029학년도 입시예요</h3><p>그 해 규칙은 2027년 봄에 나와요. 지금은 5등급제 첫해인 2028학년도 시행계획으로 맞춰 두었어요. 내 등급은 9등급제로 치면 대략 ${ns ? fmt1(g5to9(ns)) : '-'}등급이에요(교육부 비율로 맞춘 대략값).</p></details>`;
  }
  function admitSheet() {
    const f = { v: '교과' };
    sheet(`<h2>생명 계열 대학별 합격선</h2><p class="sub">${esc(ADMIT.note)}</p>${adGuide()}<div class="chips" id="ad-t" style="margin-top:12px"></div><div id="ad-b" style="margin-top:12px"></div>`, (el) => {
      const draw = () => {
        $('#ad-t', el).innerHTML = ['교과', '종합'].map((k) => `<button class="chip ${f.v === k ? 'on' : ''}" type="button" data-at="${k}">${k}</button>`).join('');
        segRe($('#ad-t', el));
        $$('[data-at]', el).forEach((b) => (b.onclick = () => { f.v = b.dataset.at; draw(); }));
        const rows = ADMIT.unis.flatMap((x) => x.depts.flatMap((d) => d.tracks.filter((t) => t.type === f.v).map((t) => ({ x, d, t })))).sort((p, q) => (cutOf(p.t) ?? 99) - (cutOf(q.t) ?? 99));
        $('#ad-b', el).innerHTML = rows.length ? `<div class="list">${rows.map(({ x, d, t }) => { const u = uniOf(x.id), jy = jyOf(t.rule); return `<div class="li btnlike" data-du="${esc(x.id)}" style="align-items:flex-start">${u ? emb(u, 'sm') : ''}<div class="body"><div class="t" style="font-size:15px">${esc(x.short)} <span class="tiny">${esc(shortDept(d.dept))}</span></div><div class="d" style="line-height:1.6">${esc(t.name)}${t.seats ? ` · ${t.seats}명` : ''} · ${noMinOf(t) ? '수능최저 없음' : '수능최저 있음'}${jy ? `<br>내 등급 9등급으로 <b>약 ${fmt1(g5to9(jy))}</b> <span class="tiny">(5등급제 ${g2(jy)})</span>` : ''}</div></div><b class="num" style="flex:none;font-size:15px">${cutLbl(t)}</b><span class="chev"></span></div>`; }).join('')}</div><p class="tiny" style="margin-top:12px">눌러서 대학별 자세히 보기 · 숫자는 합격자 내신 70%컷(없으면 평균, 9등급제)이에요. 낮을수록 어려워요 · ${esc(ADMIT.updated)} 조사</p>` : '<div class="empty"><b>자료가 없어요</b></div>';
        $$('[data-du]', el).forEach((b) => (b.onclick = () => uniDetail(b.dataset.du)));
      };
      draw();
    });
  }

  // ───────── 상세 화면 (픽·합격선을 누르면) ─────────
  const NEWS_ALL = () => (D.news && D.news.items) || [];
  const srcList = (src) => (src || []).length ? `<div class="eyebrow" style="margin-top:20px">출처</div><div class="list">${src.map((x) => `<a class="li btnlike" href="${esc(x.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><div class="ico">${ic('pin')}</div><div class="body"><div class="t" style="font-size:14px">${esc(x.name)}</div><div class="d">원문 보기</div></div><span class="chev"></span></a>`).join('')}</div>` : '';
  const newsRows = (L) => L.length ? `<div class="eyebrow" style="margin-top:20px">관련 소식</div><div class="list">${L.slice(0, 5).map((n) => `<div class="li btnlike" data-dn="${esc(n.id)}"><div class="ico">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'sm') : ic('news')}</div><div class="body"><div class="t" style="font-size:15px">${esc(n.title)}</div><div class="d">${md(n.date)} · ${esc(n.scope || '')}</div></div><span class="chev"></span></div>`).join('')}</div>` : '';
  const newsLike = (words) => NEWS_ALL().filter((n) => words.some((w) => w && (n.title + ' ' + n.body).includes(w))).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  function bindDetail(el, back) {
    $$('[data-dn]', el).forEach((b) => (b.onclick = () => newsSheet(b.dataset.dn)));
    $$('[data-du]', el).forEach((b) => (b.onclick = () => uniDetail(b.dataset.du)));
    const bk = $('[data-back]', el); if (bk) bk.onclick = back;
  }
  function uniDetail(id) {
    const u = uniOf(id), a = admitOf(id); if (!a) return;
    const nm = (u && u.short) || a.short;
    const subs = (PICKS.subjects || []).filter((x) => (x.unis || []).some((t) => t.startsWith(nm)));
    const tr = (t) => {
      const jy = jyOf(t.rule), R = JY_RULE[t.rule], c = t.calc || {};
      const nums = [['50%컷', t.cut50], ['70%컷', t.cut70], ['평균', t.avg]].filter(([, v]) => v != null);
      return `<div class="ad-tr"><div class="row between" style="gap:8px"><b style="font-size:16px">${esc(t.name)}</b><span class="tag ${t.type === '교과' ? 'blue' : 'green'}">${esc(t.type)}</span></div>
      <div class="ad-nums">${nums.length ? nums.map(([k, v]) => `<div><span>${k}</span><b class="num">${g2(v)}</b></div>`).join('') : '<div><span>컷</span><b>비공개</b></div>'}${t.seats ? `<div><span>모집</span><b class="num">${t.seats}명</b></div>` : ''}${t.rate ? `<div><span>경쟁률</span><b class="num">${t.rate}</b></div>` : ''}</div>
      ${t.cutNote ? `<p class="ad-memo-t">${esc(t.year || '')} ${esc(t.cutNote)}</p>` : ''}
      <div class="ad-jy">${jy ? `<b>내 등급 9등급으로 바꾸면 약 ${fmt1(g5to9(jy))}</b><span>위 컷(9등급제)과 이 숫자를 견줘요 · 5등급제 원래 값 ${g2(jy)} · ${esc(R.t)}</span>` : `<b>이 전형에서 내 등급은 계산 못 해요</b><span>${t.type === '종합' ? '종합은 서류를 사람이 읽고 평가해서 정해진 계산식이 없어요' : '1학년 공통과목이 안 들어가거나, 성취도 점수표가 아직 안 나왔어요'}</span>`}</div>
      <p class="ad-min ${noMinOf(t) ? '' : 'on'}"><b>수능최저</b> ${noMinOf(t) ? '없음' : esc(t.min)}</p>${t.min2028 ? `<p class="ad-memo-t"><b>2028 바뀌는 점</b> ${esc(t.min2028)}</p>` : ''}
      ${c.subjects || c.career ? `<p class="ad-memo-t"><b>성적 계산</b> ${esc([c.subjects, c.career, c.fusion].filter(Boolean).join(' · '))}${c.basis ? ` (${esc(c.basis)})` : ''}</p>` : ''}
      ${t.memo ? `<p class="ad-memo-t">${esc(t.memo)}</p>` : ''}
      <p class="tiny" style="margin:6px 0 0"><span class="tag ${t.srcType === 'other' ? 'red' : ''}">${esc(SRC_T[t.srcType] || '출처')}</span> ${(Array.isArray(t.src) ? t.src : t.src ? [t.src] : []).map((s, k) => `<a href="${esc(s)}" target="_blank" rel="noopener">원문 ${k + 1}</a>`).join(' · ')}</p></div>`;
    };
    sheet(`<div class="row" style="gap:12px;margin-bottom:8px">${u ? emb(u, 'md') : ''}<div><h2 style="margin:0">${esc(a.name)}</h2><p class="tiny" style="margin:2px 0 0">생명 계열 ${a.depts.length}개 학과 · 2026 수시 결과</p></div></div>
      <div class="deep" style="margin:12px 0 16px"><p style="margin:0">${esc(ADMIT.note)}</p>${a.careerA ? `<p style="margin:8px 0 0"><b>A를 1등급으로</b> ${esc(a.careerA)}</p>` : ''}${a.rounding ? `<p style="margin:8px 0 0"><b>소수점</b> ${esc(a.rounding)}</p>` : ''}</div>
      ${a.depts.map((d) => `<h3 class="ad-dept">${esc(d.dept)}</h3>${d.tracks.map(tr).join('')}`).join('')}
      ${a.notes ? `<div class="eyebrow" style="margin-top:20px">알아 둘 것</div><p class="ad-memo-t" style="font-size:14px">${esc(a.notes)}</p>` : ''}
      ${subs.length ? `<div class="eyebrow" style="margin-top:20px">이 대학이 권하는 고2 과목</div><div class="list">${subs.map((x) => `<div class="li"><div class="body"><div class="t" style="font-size:15px">${esc(x.name)}</div><div class="d">${esc((x.unis || []).find((t) => t.startsWith(nm)) || '')}</div></div><span class="tag ${x.level === '핵심' ? 'blue' : ''}">${esc(x.level || '')}</span></div>`).join('')}</div>` : ''}
      ${newsRows(NEWS_ALL().filter((n) => n.uni === id).sort((p, q) => String(q.date).localeCompare(String(p.date))))}
      ${keepBox('uni:' + id, `${nm} ${shortDept(adMain(a).dept)}`, 'uni', id, ['이 대학·학과에 끌리는 점은 무엇인가요?', '합격선까지 무엇을 더 채우면 될까요?'])}
      <div class="row" style="margin-top:20px"><button class="btn big" style="flex:1" data-back type="button">다른 대학도 보기</button>${S.profile.uni === id ? '' : `<button class="btn primary big" style="flex:1" id="ud-goal" type="button">목표로 정하기</button>`}</div>`, (el, close) => {
      bindDetail(el, admitSheet);
      const g = $('#ud-goal', el); if (g) g.onclick = () => { S.profile.uni = id; save('profile'); close(); render(); toast(`${nm} 목표, 응원해요`); };
    });
  }
  // 탐구 주제 상세: 이야기로 끌어들이고 → 질문 → 따라 하는 순서(체크) → 경화여고 수업 연결 → 생기부 예시
  const LV = { 쉬움: 'green', 보통: 'blue', 도전: 'red' };
  function topicBody(x, i) {
    const dn = ((S.tp || {})[i] || {}).s || [], st = x.steps || [];
    const sch = (x.school || []).map((c) => `<div class="tp-sc"><div class="tp-sc-h"><b>${c.grade}학년${c.sem ? ` ${c.sem}학기` : ''}</b><span>${esc(c.subj)}</span>${c.group ? `<em>${esc(c.group)}</em>` : ''}</div>${c.unit ? `<div class="tiny">${esc(c.unit)}</div>` : ''}${c.perf ? `<div class="tp-perf">${ic('pencil')} 수행평가 「${esc(c.perf)}」</div>` : ''}${c.use ? `<p>${esc(c.use)}</p>` : ''}</div>`).join('');
    return `<p class="tiny" style="margin:0 0 6px">${esc(x.subj)} · ${esc(x.unit)}</p><h2 style="line-height:1.4">${esc(x.idea)}</h2>
      <div class="tp-meta">${x.level ? `<span class="tag ${LV[x.level] || ''}">${esc(x.level)}</span>` : ''}${x.time ? `<span class="tag">${ic('clock')} ${esc(x.time)}</span>` : ''}${x.kind ? `<span class="tag">${esc(x.kind)}</span>` : ''}</div>
      ${x.hook ? `<div class="tp-hook"><div class="eyebrow">${ic('bulb')} 이런 얘기 들어 봤어요?</div><p>${esc(x.hook)}</p></div>` : ''}
      ${x.question ? `<div class="tp-q"><span>탐구 질문</span><b>${esc(x.question)}</b></div>` : ''}
      ${(x.need || []).length ? `<div class="tp-sec"><h3>준비물</h3><div class="row wrap" style="gap:6px">${x.need.map((n) => `<span class="tp-need">${esc(n)}</span>`).join('')}</div></div>` : ''}
      ${st.length ? `<div class="tp-sec"><div class="row between"><h3>이렇게 해요</h3><span class="tiny" id="tp-n">${dn.length}/${st.length} 했어요</span></div><div class="tp-steps">${st.map((t, k) => `<button type="button" class="tp-step ${dn.includes(k) ? 'on' : ''}" data-tps="${k}"><i>${k + 1}</i><span>${esc(t)}</span></button>`).join('')}</div></div>` : x.how ? `<div class="tp-sec"><h3>어떻게 해요</h3><p class="ls-p">${esc(x.how)}</p></div>` : ''}
      ${x.expect ? `<div class="deep"><div class="eyebrow">이런 결과가 나올 거예요</div><p style="margin:4px 0 0">${esc(x.expect)}</p></div>` : ''}
      ${sch ? `<div class="tp-sec"><h3>${ic('school')} 경화여고 수업과 이어져요</h3><div class="tp-scs">${sch}</div></div>` : ''}
      ${(x.deeper || []).length ? `<div class="tp-sec"><h3>더 파고들기</h3><div class="tp-deeper">${x.deeper.map((d) => `<p>${ic('q')}<span>${esc(d)}</span></p>`).join('')}</div></div>` : ''}
      ${x.link || x.career ? `<div class="tp-sec"><h3>${ic('dna')} 생명공학으로 이어지면</h3>${x.link ? `<p class="ls-p" style="margin:0 0 6px">${esc(x.link)}</p>` : ''}${x.career ? `<p class="ls-p" style="margin:0">${esc(x.career)}</p>` : ''}</div>` : ''}
      ${x.seteuk ? `<div class="tp-sec"><h3>생기부에 이렇게 적힐 수 있어요</h3><div class="tp-seteuk"><span class="tag">예시</span><p>${esc(x.seteuk.replace(/^\(예시\)\s*/, ''))}</p></div><p class="tiny" style="margin:8px 0 0">수업 발표·보고서·수행평가로 해야 세특에 적혀요. 해 본 뒤 생기부 탭에 기록해 둬요</p></div>` : ''}
      ${(x.report || []).length ? `<div class="tp-sec"><h3>보고서 목차</h3><ol class="tp-ol">${x.report.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></div>` : ''}
      ${(x.read || []).length ? `<div class="tp-sec"><h3>${ic('books')} 같이 읽으면 좋아요</h3><div class="list">${x.read.map((r) => `<div class="li"><div class="body"><div class="t" style="font-size:15px">${esc(r.title)} <span class="tiny">${esc(r.by || '')}</span></div><div class="d">${esc(r.why || '')}</div></div></div>`).join('')}</div></div>` : ''}`;
  }
  function bindTopic(el, i) {
    $$('[data-tps]', el).forEach((b) => (b.onclick = () => {
      S.tp = S.tp || {}; const o = (S.tp[i] = S.tp[i] || { s: [] }), k = +b.dataset.tps;
      o.s = o.s.includes(k) ? o.s.filter((y) => y !== k) : [...o.s, k]; save('tp');
      b.classList.toggle('on', o.s.includes(k)); const n = $('#tp-n', el), tot = $$('[data-tps]', el).length; if (n) n.textContent = `${o.s.length}/${tot} 했어요`;
      if (o.s.length === tot && o.s.includes(k)) { toast('탐구 순서를 다 해냈어요! 생기부에 기록해 둬요'); const r = b.getBoundingClientRect(); boom(r.left + 20, r.top, 2); }
    }));
  }
  function pickDetail(kind, i) {
    const x = (PICKS[kind] || [])[i]; if (!x) return;
    const T = { subjects: '고2 과목 선택', topics: '탐구 주제', timeline: '일정', checklist: '채울 것', books: '책' };
    let body = '';
    if (kind === 'subjects') body = `<h2>${esc(x.name)} <span class="tag ${x.level === '핵심' ? 'blue' : ''}">${esc(x.level || '')}</span></h2><p class="ls-p">${esc(x.why || '')}</p>${x.school ? `<div class="deep"><div class="eyebrow">경화여고에서는</div><p style="margin:4px 0 0">${esc(x.school)}</p></div>` : ''}
      ${(x.unis || []).length ? `<div class="eyebrow" style="margin-top:20px">대학마다</div><div class="list">${x.unis.map((t) => { const a = ADMIT && ADMIT.unis.find((y) => t.startsWith((uniOf(y.id) || {}).short || '@')); return `<div class="li ${a ? 'btnlike' : ''}" ${a ? `data-du="${esc(a.id)}"` : ''}>${a && uniOf(a.id) ? emb(uniOf(a.id), 'sm') : ''}<div class="body"><div class="t" style="font-size:15px">${esc(t)}</div>${a ? '<div class="d">눌러서 합격선 보기</div>' : ''}</div>${a ? '<span class="chev"></span>' : ''}</div>`; }).join('')}</div>` : ''}${newsRows(newsLike([x.name, '권장과목', '권장 과목']))}`;
    else if (kind === 'topics') body = topicBody(x, i);
    else if (kind === 'timeline') body = `<span class="tag">${esc(x.when)}</span><h2 style="margin-top:8px">${esc(x.title)}</h2><p class="ls-p">${esc(x.what || '')}</p>${x.why ? `<div class="deep"><div class="eyebrow">왜 중요해요</div><p style="margin:4px 0 0">${esc(x.why)}</p></div>` : ''}${newsRows(newsLike((x.title || '').split(/[ ·,()]+/).filter((w) => w.length >= 3)))}`;
    else if (kind === 'checklist') body = `<span class="tag">${esc(x.area || '')}${x.term ? ' · ' + esc(x.term) : ''}</span><h2 style="margin-top:8px">${esc(x.title)}</h2><p class="ls-p">${esc(x.detail || '')}</p>`;
    else body = `<h2>${esc(x.title)}</h2><p class="tiny" style="margin:-4px 0 12px">${esc(x.author || '')}${x.level ? ' · ' + esc(x.level) : ''}${x.popular ? ' · ' + esc(x.popular) : ''}</p><p class="ls-p">${esc(x.why || '')}</p>${x.seteuk ? `<div class="deep"><div class="eyebrow">세특으로 잇기</div><p style="margin:4px 0 0">${esc(x.seteuk)}</p></div>` : ''}${x.subj ? `<p class="tiny" style="margin-top:12px">관련 과목: ${esc(x.subj)}</p>` : ''}`;
    sheet(`<p class="eyebrow" style="margin:0 0 8px">${ic('pill')} 생명공학 픽 · ${T[kind]}</p>${readPill(`pick:${kind}:${i}`, 50, '진로 픽 읽기')}${body}${keepBox(`pick:${kind}:${i}`, x.title || x.name || '', 'pick', `${kind}:${i}`, kind === 'topics' ? ['이 탐구를 한다면 무엇을 바꿔 보고 싶나요?'] : kind === 'books' ? ['읽고 나서 가장 남는 한 문장은?'] : [])}${srcList(x.src)}<button class="btn big block" style="margin-top:20px" data-back type="button">${kind === 'timeline' ? '일정 전체 보기' : T[kind] + ' 더 보기'}</button>`, (el) => { bindDetail(el, () => (kind === 'timeline' ? schedSheet() : picksSheet(kind))); if (kind === 'topics') bindTopic(el, i); });
  }

  // 다가오는 일정: 토스처럼 가로로 넘기는 날짜 줄 + 고른 날의 일정
  function schedItems() {
    const ev = (D.events || []).filter((e) => e.kind !== 'csat').map((e) => ({ date: e.date, t: e.title, tag: e.kind === 'exam' ? '시험' : e.kind === 'mock' ? '모의고사' : '학교', k: e.kind }));
    const tl = (PICKS.timeline || []).map((x, i) => ({ date: x.when, month: x.when.length === 7, t: x.title, tag: x.kind || '입시', pi: i, k: 'pick' })).filter((o) => /^\d{4}-\d{2}/.test(o.date));
    // 같은 날 수능이 두 번 나오지 않게
    const out = ev.filter((e) => !(/수학능력/.test(e.t) && tl.some((o) => o.date === e.date && /수능/.test(o.t))));
    const mine = (S.myEvents || []).map((e) => ({ date: e.date, t: e.t, tag: e.kind || '내 일정', k: 'mine', mid: e.id }));
    return [...out, ...tl, ...mine];
  }
  const schedRow = (e) => `<div class="li ${e.pi != null || e.mid ? 'btnlike' : ''}" ${e.pi != null ? `data-pk="timeline:${e.pi}"` : e.mid ? `data-me-ev="${esc(e.mid)}"` : ''}><span class="cal-bar k-${e.k}"></span><div class="body"><div class="t" style="font-size:15px">${esc(e.t)}</div><div class="d">${esc(e.tag)}</div></div>${e.pi != null || e.mid ? '<span class="chev"></span>' : ''}</div>`;
  function myEventSheet(id, date) {
    const ev = id ? (S.myEvents || []).find((x) => x.id === id) : null; let kind = (ev && ev.kind) || '수행평가';
    const K = ['수행평가', '시험', '학원', '약속', '기타'];
    sheet(`<h2>${ev ? '일정 고치기' : '내 일정 추가'}</h2><p class="sub">추가한 일정은 홈 날짜 줄에 보라색 점으로 나와요</p>
      <div class="field"><label>무엇을</label><input class="inp" id="me-t" placeholder="예) 영어 수행평가 발표" value="${esc(ev ? ev.t : '')}"></div>
      <div class="field"><label>언제</label><input class="inp" type="date" id="me-d" value="${esc(ev ? ev.date : date || today())}"></div>
      <div class="field"><label>종류</label><div class="chips" id="me-k"></div></div>
      <div class="row" style="margin-top:8px">${ev ? '<button class="btn big" style="flex:1" id="me-del" type="button">지우기</button>' : ''}<button class="btn primary big" style="flex:2" id="me-ok" type="button">${ev ? '저장' : '추가하기'}</button></div>`, (el, close) => {
      const drawK = () => { $('#me-k', el).innerHTML = K.map((k) => `<button type="button" class="chip ${k === kind ? 'on' : ''}" data-k="${k}">${k}</button>`).join(''); $$('[data-k]', el).forEach((b) => (b.onclick = () => { kind = b.dataset.k; drawK(); })); };
      drawK(); $('#me-t', el).focus();
      $('#me-ok', el).onclick = () => { const t = $('#me-t', el).value.trim(), d = $('#me-d', el).value; if (!t || !d) return; S.myEvents = S.myEvents || []; if (ev) Object.assign(ev, { t, date: d, kind }); else S.myEvents.push({ id: 'e' + Date.now(), t, date: d, kind }); save('myEvents'); UI.calSel = d; close(); render(); toast(ev ? '일정을 고쳤어요' : '일정을 추가했어요'); };
      const dl = $('#me-del', el); if (dl) dl.onclick = () => { S.myEvents = S.myEvents.filter((x) => x.id !== id); save('myEvents'); close(); render(); toast('일정을 지웠어요'); };
    });
  }
  function schedCard(cls) {
    const all = schedItems(), days = [], t0 = new Date(today() + 'T00:00:00');
    for (let i = 0; i < 42; i++) { const d = new Date(t0); d.setDate(d.getDate() + i); days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); }
    const on = (d) => all.filter((e) => !e.month && e.date === d);
    if (!UI.calSel || !days.includes(UI.calSel)) UI.calSel = days[0];
    const sel = UI.calSel, L = on(sel);
    const strip = days.map((d, i) => { const dt = new Date(d + 'T00:00:00'), w = dt.getDay(), es = on(d); return `${i > 0 && dt.getDate() === 1 ? `<span class="cal-m">${dt.getMonth() + 1}월</span>` : ''}<button type="button" class="cal-d ${d === sel ? 'sel' : ''} ${i === 0 ? 'today' : ''} ${w === 0 ? 'sun' : w === 6 ? 'sat' : ''}" data-cd="${d}"><span>${i === 0 ? '오늘' : DOW[w]}</span><b class="num">${dt.getDate()}</b><i>${es.slice(0, 3).map((e) => `<em class="k-${e.k}"></em>`).join('')}</i></button>`; }).join('');
    const month = all.filter((e) => e.month && e.date === sel.slice(0, 7));
    const row = schedRow;
    const dd = dday(sel), [, mm, dn] = sel.split('-');
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('cal')} 다가오는 일정</h2><div class="row" style="gap:4px"><button class="btn sm soft" id="sc-add" type="button">+ 추가</button><button class="more" id="sc-all" type="button">전체</button></div></div>
      <div class="cal-strip" id="cal-strip">${strip}</div>
      <div class="cal-day"><b>${+mm}월 ${+dn}일</b><span class="tiny">${dd === 0 ? '오늘' : 'D-' + dd}</span></div>
      ${L.length ? `<div class="list">${L.map(row).join('')}</div>` : (() => { const nx = days.find((d) => d > sel && on(d).length); return `<p class="tiny" style="margin:4px 0 8px">이날은 일정이 없어요</p>${nx ? `<button type="button" class="cal-next" data-cd="${nx}"><span class="tiny">다음 일정 · ${md(nx)} · D-${dday(nx)}</span><b>${esc(on(nx)[0].t)}</b><span class="chev"></span></button>` : ''}`; })()}
      ${month.length ? `<div class="eyebrow" style="margin-top:16px">${+mm}월 중에 할 것</div><div class="list">${month.map(row).join('')}</div>` : ''}</section>`;
  }
  function schedSheet() {
    const L = schedItems().map((e) => ({ ...e, sort: e.month ? e.date + '-00' : e.date })).filter((e) => (e.month ? e.sort.slice(0, 7) >= today().slice(0, 7) : e.date >= today())).sort((a, b) => a.sort.localeCompare(b.sort));
    const months = [...new Set(L.map((e) => e.sort.slice(0, 7)))];
    sheet(`<div class="row between"><h2 style="margin:0">일정 전체</h2><button class="btn sm soft" id="ss-add" type="button">+ 내 일정 추가</button></div><p class="sub" style="margin-top:6px">학교 일정, 진학 일정, 내가 넣은 일정을 날짜 순서로 모았어요</p>
      ${months.map((m) => `<div class="ss-mon">${m.slice(0, 4)}년 ${+m.slice(5)}월</div><div class="list">${L.filter((e) => e.sort.slice(0, 7) === m).map((e) => { const dt = e.month ? null : new Date(e.date + 'T00:00:00'); return `<div class="li ${e.pi != null || e.mid ? 'btnlike' : ''}" ${e.pi != null ? `data-pk="timeline:${e.pi}"` : e.mid ? `data-me-ev="${esc(e.mid)}"` : ''}><div class="ss-d ${dt && dt.getDay() === 0 ? 'sun' : dt && dt.getDay() === 6 ? 'sat' : ''}"><b class="num">${dt ? dt.getDate() : +e.sort.slice(5, 7) + '월'}</b><span>${dt ? DOW[dt.getDay()] : '중'}</span></div><span class="cal-bar k-${e.k}"></span><div class="body"><div class="t" style="font-size:15px">${esc(e.t)}</div><div class="d">${esc(e.tag)}${dt && dday(e.date) >= 0 ? ` · ${dday(e.date) === 0 ? '오늘' : 'D-' + dday(e.date)}` : ''}</div></div>${e.pi != null || e.mid ? '<span class="chev"></span>' : ''}</div>`; }).join('')}</div>`).join('')}`, (el, close) => {
      $$('[data-pk]', el).forEach((b) => (b.onclick = () => { const [k, i] = b.dataset.pk.split(':'); pickDetail(k, +i); }));
      $$('[data-me-ev]', el).forEach((b) => (b.onclick = () => myEventSheet(b.dataset.meEv)));
      $('#ss-add', el).onclick = () => myEventSheet(null);
    });
  }


  // ───────── 생명공학 픽 ─────────
  function picksCard(cls) {
    const subs = (PICKS.subjects || []).slice(0, 6), tops = (PICKS.topics || []).filter((x) => /중화|산과 염기|전기|전자기|발전|대한민국/.test((x.unit || '') + (x.idea || ''))).slice(0, 3);
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('pill')} 생명공학 픽</h2><button class="more" id="pk-all" type="button">전체 보기</button></div>
      ${subs.length ? `<div class="eyebrow">고2에 고르면 좋은 과목</div><div class="row wrap" style="margin:8px 0 16px">${subs.map((x, i) => `<button type="button" class="tag tag-btn ${x.level === '핵심' ? 'blue' : ''}" data-pk="subjects:${i}">${esc(x.name)}${x.level ? ' · ' + esc(x.level) : ''}</button>`).join('')}</div>` : ''}
      ${tops.length ? `<div class="eyebrow">이번 시험 범위로 해 볼 탐구</div><div class="list">${tops.map((x, ti) => `<div class="li btnlike ${ti === 2 ? 'pk-3' : ''}" data-pk="topics:${(PICKS.topics || []).indexOf(x)}" style="align-items:flex-start"><div class="body"><div class="t" style="font-size:15px">${esc(x.idea)}</div><div class="d">${esc(x.subj)} · ${esc(x.unit)}</div></div><span class="chev"></span></div>`).join('')}</div>` : ''}
      ${!subs.length && !tops.length ? `<div class="empty">${ic('pill')}<b>생명공학 준비 자료를 모으는 중이에요</b></div>` : ''}</section>`;
  }
  const PK_T = [['subjects', '과목 선택'], ['topics', '탐구 주제'], ['checklist', '채울 것'], ['books', '책']];
  function picksBody(kind) {
    const L = PICKS[kind] || [];
    const row = (i, t, d, tag) => `<div class="li btnlike" data-pd="${i}" style="align-items:flex-start"><div class="body"><div class="t" style="line-height:1.5">${t}</div>${d ? `<div class="d" style="line-height:1.6;margin-top:2px">${d}</div>` : ''}</div>${tag || ''}<span class="chev"></span></div>`;
    return L.length ? `<div class="list">${L.map((x, i) => kind === 'subjects' ? row(i, esc(x.name), esc(x.why || '') + (x.unis && x.unis.length ? `<br><span class="tiny">${esc(x.unis.join(', '))}</span>` : ''), `<span class="tag ${x.level === '핵심' ? 'blue' : ''}">${esc(x.level || '')}</span>`)
      : kind === 'topics' ? row(i, esc(x.idea), `${esc(x.subj)} · ${esc(x.unit)}${x.how ? '<br>' + esc(x.how) : ''}${x.link ? `<br><span class="blue">${esc(x.link)}</span>` : ''}`)
      : kind === 'checklist' ? row(i, esc(x.title), esc(x.detail || ''), `<span class="tag">${esc(x.area || '')}</span>`)
      : row(i, `${esc(x.title)} <span class="tiny">${esc(x.author || '')}</span>`, esc(x.why || '') + (x.seteuk ? `<br><span class="tiny"><b>세특으로</b> ${esc(x.seteuk)}</span>` : '') + (x.subj ? `<br><span class="tiny">${esc(x.subj)}${x.popular ? ' · ' + esc(x.popular) : ''}</span>` : ''), x.level ? `<span class="tag ${x.level === '쉬움' ? 'green' : x.level === '도전' ? 'red' : 'blue'}">${esc(x.level)}</span>` : '')).join('')}</div>` : `<div class="empty"><b>준비 중이에요</b></div>`;
  }
  function picksView() {
    const k = UI.pkTab || 'subjects';
    return `<div style="max-width:880px;margin:0 auto"><h1 class="h1" style="margin:0 0 4px">${ic('dna')} 생명공학 픽</h1><p class="sub">생명공학과 가려면 무엇을 언제 챙기는지 모았어요${PICKS.updated ? ` · ${md(PICKS.updated)} 기준` : ''}</p>
      <div class="chips pk-tabs">${PK_T.map(([t, n]) => `<button class="chip ${k === t ? 'on' : ''}" type="button" data-pt="${t}">${n}<span class="pk-n">${(PICKS[t] || []).length}</span></button>`).join('')}</div>
      <section class="card pk-body" style="margin-top:12px">${picksBody(k)}</section></div>`;
  }
  function bindPicks() {
    $$('[data-pt]').forEach((b) => (b.onclick = () => { UI.pkTab = b.dataset.pt; render(); }));
    $$('main [data-pd]').forEach((b) => (b.onclick = () => pickDetail(UI.pkTab || 'subjects', +b.dataset.pd)));
  }
  // 예전 「픽 전체」 시트 자리: 이제 탭으로 가요
  function picksSheet(start) {
    closeSheet();
    if (typeof start === 'string') UI.pkTab = start;
    go('picks');
  }

  // ───────── 내 정보 (토스 「내 정보」처럼 큰 프로필 + 한 줄씩) ─────────
  const AVATARS = [['1f43b', '#ffe8c8'], ['1f43c', '#e5e8eb'], ['1f428', '#dfe6ee'], ['1f430', '#ffe4ec'], ['1f431', '#fff1cc'], ['1f436', '#f6e7d8'], ['1f98a', '#ffe3d1'], ['1f427', '#dceeff'], ['1f425', '#fff6c2'], ['1f984', '#f1e5ff'], ['1f439', '#ffeedd'], ['1f42f', '#ffefd0'], ['1f433', '#d9efff'], ['1f337', '#ffe2e8'], ['1f338', '#ffe8f0'], ['1f340', '#ddf6e6'], ['1f9ec', '#e8f3ff'], ['1f60a', '#fff3c4']];
  const MBTI = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
  const avatarHtml = (cls = '') => { const p = S.profile, a = AVATARS.find((x) => x[0] === p.avatar); return a ? `<span class="avatar ${cls}" style="background:${a[1]}"><img src="icons/${a[0]}.svg" alt=""></span>` : `<span class="avatar ${cls}" style="background:var(--blue);color:#fff">${esc((p.name || '나').slice(-2))}</span>`; };
  const bdayLeft = () => { const b = S.profile.birth; if (!b) return null; const [, m, d] = b.split('-').map(Number); const t = new Date(today() + 'T00:00:00'); let n = new Date(t.getFullYear(), m - 1, d); if (n < t) n = new Date(t.getFullYear() + 1, m - 1, d); return Math.round((n - t) / 864e5); };
  function meView() {
    const p = S.profile, u = uniOf(p.uni), bl = bdayLeft();
    const row = (k, label, val, empty = '없음') => `<button class="li btnlike me-row" type="button" data-me="${k}"><div class="body"><div class="t" style="font-weight:500;color:var(--t2)">${label}</div></div><span class="me-v ${val ? '' : 'muted'}">${val ? esc(val) : empty}</span><span class="chev"></span></button>`;
    return `<div style="max-width:640px;margin:0 auto">
      <div class="me-head"><button type="button" class="me-av" id="me-av" aria-label="프로필 그림 바꾸기">${avatarHtml('xl')}<span class="me-edit">${ic('pencil')}</span></button><h1 class="h1" style="margin:16px 0 4px;text-align:center">${esc(p.name)}</h1><div class="row" style="justify-content:center;gap:6px">${p.mbti ? `<span class="tag blue">${esc(p.mbti)}</span>` : ''}${bl != null ? `<span class="tag ${bl === 0 ? 'red' : ''}">${bl === 0 ? '오늘 생일' : `생일까지 D-${bl}`}</span>` : ''}${u ? `<span class="tag">${esc(u.short || u.name)} ${esc(p.major || '')}</span>` : ''}</div>${p.motto ? `<p class="sub" style="text-align:center;margin:12px 0 0">「${esc(p.motto)}」</p>` : ''}</div>
      <section class="card tight" style="margin-top:20px"><div class="list">
        ${row('name', '이름', p.name)}${row('birth', '생일', p.birth ? (() => { const [y, m, d] = p.birth.split('-'); return `${y}년 ${+m}월 ${+d}일`; })() : '')}${row('mbti', 'MBTI', p.mbti)}${row('motto', '나의 한마디', p.motto)}${row('likes', '좋아하는 과목', p.likes)}
      </div></section>
      <section class="card tight"><div class="card-h"><h3>학교</h3></div><div class="list">${row('school', '학교', p.school)}${row('grade', '학년·반', `${p.grade}학년${p.cls ? ' ' + p.cls + '반' : ''}`)}</div></section>
      <section class="card tight"><div class="card-h"><h3>목표</h3></div><div class="list">
        <button class="li btnlike me-row" type="button" data-me="uni"><div class="body"><div class="t" style="font-weight:500;color:var(--t2)">목표 대학</div></div>${u ? emb(u, 'sm') : ''}<span class="me-v ${u ? '' : 'muted'}">${u ? esc(u.short || u.name) : '골라 주세요'}</span><span class="chev"></span></button>
        ${row('major', '목표 학과', p.major)}${row('goalMock', '모의고사 목표', p.goalMock ? p.goalMock + '등급' : '')}${row('goalNaesin', '내신 목표', p.goalNaesin ? p.goalNaesin + '등급' : '')}</div></section>
      ${TEACHER ? '' : '<button class="btn big block ghost-red" id="me-out" type="button" style="margin-top:8px">로그아웃</button>'}
      <p class="tiny" style="text-align:center;margin:16px 0 0">기록은 선생님 서버에 저장돼요. 로그아웃해도 코드를 다시 넣으면 그대로예요</p></div>`;
  }
  // 목표 등급 설정: 목표 대학 합격선(종합·교과)으로 정하거나 직접 0.1씩 맞춤
  function goalSheet() {
    const p = S.profile, set = p.goalSet || {};
    let mode = set.goalMock || set.goalNaesin ? 'self' : (p.goalTrack || '종합'), gm = +p.goalMock || 2, gn = +p.goalNaesin || 2;
    const A = { 종합: autoGoals('종합'), 교과: autoGoals('교과') };
    const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
    const draw = (el) => {
      const a = mode !== 'self' && A[mode];
      $('#gs-body', el).innerHTML = `<div class="chips" style="flex-wrap:wrap;margin-bottom:16px">${['종합', '교과'].filter((t) => A[t] && A[t].tr === t).map((t) => `<button type="button" class="chip ${mode === t ? 'on' : ''}" data-gt="${t}">${esc(A[t].uni)} ${t} 합격선</button>`).join('')}<button type="button" class="chip ${mode === 'self' ? 'on' : ''}" data-gt="self">직접 정하기</button></div>
        ${[['gm', '모의고사', gm, 1, 9, a ? `${esc(a.minTxt)} → 과목마다 ${f1(a.mock)}등급 안쪽` : '수능최저를 맞추려면 과목 평균이 이 정도여야 해요'], ['gn', '내신', gn, 1, 5, a ? `합격선 ${a.c9}등급(9등급제) = 상위 약 ${a.pct}% → 5등급제 약 ${f1(a.naesin)}등급` : '5등급제: 1등급 상위 10%, 2등급 34%, 3등급 66%']].map(([id, nm, v, lo, hi, why]) => `<div class="gs-row"><div class="gs-l"><b>${nm}</b><span class="tiny">${why}</span></div><div class="gs-step"><button type="button" class="btn sm" data-st="${id}" data-d="-0.1" ${v <= lo ? 'disabled' : ''} aria-label="${nm} 목표 올리기">−</button><b class="num">${f1(v)}<small>등급</small></b><button type="button" class="btn sm" data-st="${id}" data-d="0.1" ${v >= hi ? 'disabled' : ''} aria-label="${nm} 목표 내리기">+</button></div></div>`).join('')}`;
      $$('[data-gt]', el).forEach((b) => (b.onclick = () => { mode = b.dataset.gt; if (mode !== 'self') { const x = A[mode]; if (x.mock) gm = x.mock; if (x.naesin) gn = x.naesin; } draw(el); }));
      $$('[data-st]', el).forEach((b) => (b.onclick = () => { const d = +b.dataset.d; if (b.dataset.st === 'gm') gm = Math.min(9, Math.max(1, Math.round((gm + d) * 10) / 10)); else gn = Math.min(5, Math.max(1, Math.round((gn + d) * 10) / 10)); mode = 'self'; draw(el); }));
    };
    sheet(`<h2>목표 등급</h2><p class="muted" style="margin:-4px 0 16px">목표 대학 합격선으로 정하거나, 직접 맞춰요</p><div id="gs-body"></div><div class="row" style="margin-top:20px"><button class="btn big" style="flex:1" data-x type="button">닫기</button><button class="btn primary big" style="flex:1" id="gs-ok" type="button">저장</button></div>`, (el, close) => {
      draw(el);
      $('[data-x]', el).onclick = close;
      $('#gs-ok', el).onclick = () => { const self = mode === 'self'; if (!self) p.goalTrack = mode; p.goalSet = { goalMock: self, goalNaesin: self }; p.goalMock = gm; p.goalNaesin = gn; save('profile'); close(); render(); toast('목표를 바꿨어요'); };
    });
  }
  function editField(k) {
    if (k === 'goalMock' || k === 'goalNaesin') return goalSheet();
    const p = S.profile; const F = {
      name: ['이름', 'text'], birth: ['생일', 'date'], mbti: ['MBTI', 'mbti'], motto: ['나의 한마디', 'text', '예) 오늘 한 줄이 내일의 세특'], likes: ['좋아하는 과목', 'text', '예) 통합과학, 영어'], school: ['학교', 'text'], grade: ['학년·반', 'grade'], major: ['목표 학과', 'text', '예) 생명공학과'],
      goalMock: ['모의고사 목표 등급', 'sel', [1, 1.5, 2, 2.5, 3, 3.5, 4]], goalNaesin: ['내신 목표 등급', 'sel', [1, 1.2, 1.5, 1.8, 2, 2.5, 3]] }[k];
    if (!F) return;
    const [label, type, opt] = F;
    const body = type === 'mbti' ? `<div class="mbti-grid">${MBTI.map((m) => `<button type="button" class="${p.mbti === m ? 'on' : ''}" data-mb="${m}">${m}</button>`).join('')}</div>`
      : type === 'grade' ? `<div class="row" style="gap:12px"><div class="field" style="flex:1"><label>학년</label><select class="inp" id="ef-g">${[1, 2, 3].map((g) => `<option ${+p.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>반</label><input class="inp" id="ef-c" inputmode="numeric" value="${esc(p.cls)}"></div></div>`
      : type === 'sel' ? `${(() => { const a = autoGoals(), v = a && (k === 'goalMock' ? a.mock : a.naesin); return v ? `<button type="button" class="li btnlike" data-sauto style="width:100%;margin:0 0 12px;padding:12px 16px;box-sizing:border-box;border:0;background:var(--blue-soft);border-radius:14px;text-align:left;font:inherit"><div class="body"><div class="t">${esc(a.uni)} 합격선에 맞추기 · ${v}등급</div><div class="d">${k === 'goalMock' ? '수시 수능최저를 과목 평균으로 바꾼 값' : `${a.tr} 합격선 ${a.c9}등급(9등급제)을 5등급제로 바꾼 값`}</div></div>${!(p.goalSet || {})[k] ? '<span class="tag blue">지금</span>' : ''}</button>` : ''; })()}<div class="chips" style="flex-wrap:wrap">${opt.map((g) => `<button type="button" class="chip ${(p.goalSet || {})[k] && +p[k] === g ? 'on' : ''}" data-sv="${g}">${g}등급</button>`).join('')}</div>`
      : `<input class="inp" id="ef-v" type="${type}" value="${esc(p[k] || '')}" placeholder="${esc(opt || '')}">`;
    sheet(`<h2>${label}</h2>${body}<div class="row" style="margin-top:20px"><button class="btn big" style="flex:1" data-x type="button">닫기</button>${type === 'mbti' || type === 'sel' ? '' : '<button class="btn primary big" style="flex:1" id="ef-ok" type="button">저장</button>'}</div>`, (el, close) => {
      const done = () => { save('profile'); close(); render(); toast('바꿨어요'); };
      $('[data-x]', el).onclick = close;
      $$('[data-mb]', el).forEach((b) => (b.onclick = () => { p.mbti = b.dataset.mb; done(); }));
      $$('[data-sv]', el).forEach((b) => (b.onclick = () => { p[k] = +b.dataset.sv; p.goalSet = { ...(p.goalSet || {}), [k]: true }; done(); }));
      const sa = $('[data-sauto]', el); if (sa) sa.onclick = () => { p.goalSet = { ...(p.goalSet || {}), [k]: false }; syncGoals(); done(); };
      const ok = $('#ef-ok', el); if (ok) ok.onclick = () => { if (type === 'grade') { p.grade = +$('#ef-g', el).value; p.cls = $('#ef-c', el).value.trim(); } else { const v = $('#ef-v', el).value.trim(); if (k === 'name' && !v) return; p[k] = v; } done(); };
      const inp = $('#ef-v', el); if (inp) { inp.focus(); inp.onkeydown = (e) => { if (e.key === 'Enter') ok.click(); }; }
    });
  }
  function avatarSheet() {
    let pick = S.profile.avatar;
    sheet(`<h2>프로필 그림 선택</h2><div style="display:grid;place-items:center;margin:8px 0 16px" id="av-big"></div><div class="av-grid" id="av-g"></div><div class="row" style="margin-top:20px"><button class="btn big" style="flex:1" data-x type="button">닫기</button><button class="btn primary big" style="flex:1" id="av-ok" type="button">선택</button></div>`, (el, close) => {
      const draw = () => { const a = AVATARS.find((x) => x[0] === pick); $('#av-big', el).innerHTML = a ? `<span class="avatar xl" style="background:${a[1]}"><img src="icons/${a[0]}.svg" alt=""></span>` : avatarHtml('xl'); $('#av-g', el).innerHTML = AVATARS.map(([c, bg]) => `<button type="button" class="${pick === c ? 'on' : ''}" data-av="${c}" style="background:${bg}"><img src="icons/${c}.svg" alt=""></button>`).join(''); $$('[data-av]', el).forEach((b) => (b.onclick = () => { pick = b.dataset.av; draw(); })); };
      draw(); $('[data-x]', el).onclick = close;
      $('#av-ok', el).onclick = () => { S.profile.avatar = pick; save('profile'); close(); render(); };
    });
  }
  function logoutSheet() {
    sheet(`<h2>로그아웃할까요?</h2><p class="sub">이 기기에서만 나가요. 기록은 그대로 남아 있어서 코드를 다시 넣으면 이어서 할 수 있어요</p><div class="row"><button class="btn big" style="flex:1" data-x type="button">취소</button><button class="btn big danger" style="flex:1" id="lo-ok" type="button">로그아웃</button></div>`, (el, close) => {
      $('[data-x]', el).onclick = close;
      $('#lo-ok', el).onclick = async () => { clearTimeout(pushT); try { await sync(); } catch (e) {} ['mallang-univ:v1', 'mallang-univ:content', KEY].forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} }); location.replace(location.pathname); };
    });
  }
  function bindMe() {
    const av = $('#me-av'); if (av) av.onclick = avatarSheet;
    $$('[data-me]').forEach((b) => (b.onclick = () => (b.dataset.me === 'uni' ? uniSheet() : editField(b.dataset.me))));
    const lo = $('#me-out'); if (lo) lo.onclick = logoutSheet;
  }
  function uniSheet() {
    let pick = S.profile.uni;
    sheet(`<h2>목표 대학</h2><p class="sub">고른 대학이 홈 맨 위에 늘 크게 붙어 있어요</p><input class="inp" id="un-q" placeholder="대학 이름 찾기"><div class="uni-grid" id="un-g" style="margin-top:12px"></div><button class="btn primary big block" style="margin-top:16px" id="un-ok" type="button">이 대학으로 할게요</button>`, (el, close) => {
      const draw = () => { const q = $('#un-q', el).value.trim(); $('#un-g', el).innerHTML = UNIS.filter((u) => !q || u.name.includes(q) || (u.short || '').includes(q)).map((u) => `<button type="button" class="${u.id === pick ? 'on' : ''}" data-u="${u.id}">${emb(u, 'md')}<span>${esc(u.short || u.name)}</span>${u.dept ? `<span class="ph">${esc(u.dept)}</span>` : ''}</button>`).join(''); $$('[data-u]', el).forEach((b) => (b.onclick = () => { pick = b.dataset.u; draw(); })); };
      $('#un-q', el).oninput = draw; draw();
      $('#un-ok', el).onclick = () => { if (!pick) { toast('대학을 골라 주세요'); return; } S.profile.uni = pick; save('profile'); close(); render(); toast(`${(uniOf(pick) || {}).short || ''} 목표, 응원해요`); };
    });
  }

  // ───────── 성적 리포트 (토스 소비 리포트·시세 화면 결) ─────────
  function tossLine(rows, opt = {}) {
    // rows: [{label, v}] v = 등급(작을수록 위). 이전 값은 회색, 마지막 점에 말풍선
    const W = opt.w || Math.round(Math.max(320, Math.min(1000, (window.innerWidth >= 1200 ? window.innerWidth - 420 : window.innerWidth) - 80))), H = opt.h || 220, P = { l: 16, r: 16, t: 44, b: 28 }, maxG0 = opt.maxG || 9;
    const pts = rows.map((r, i) => ({ ...r, i })).filter((r) => r.v != null);
    if (!pts.length) return `<div class="empty">${ic('up')}<b>아직 그래프가 없어요</b><span>${opt.empty || '채점하면 여기에 그려져요'}</span></div>`;
    const vs = pts.map((p) => p.v).concat(opt.goal ? [opt.goal] : []); const lo = Math.max(1, Math.floor(Math.min(...vs)) - 1), hi = Math.min(maxG0, Math.ceil(Math.max(...vs)) + 1), span = Math.max(1, hi - lo);
    const n = rows.length, x = (i) => P.l + (n === 1 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (n - 1)), y = (g) => P.t + ((g - lo) * (H - P.t - P.b)) / span;
    const line = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(pts[pts.length - 1].i).toFixed(1)} ${H - P.b} L${x(pts[0].i).toFixed(1)} ${H - P.b} Z`;
    const L = pts[pts.length - 1], tip = `${fmt1(L.v)}등급`, tw = tip.length * 9 + 20;
    const tx = Math.min(W - tw / 2, Math.max(tw / 2, x(L.i)));
    let s = `<svg class="tchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || '등급 추이')}"><defs><linearGradient id="tg${opt.id || ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${opt.color || '#3182f6'}" stop-opacity=".16"/><stop offset="1" stop-color="${opt.color || '#3182f6'}" stop-opacity="0"/></linearGradient></defs>`;
    if (opt.goal) s += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(opt.goal)}" y2="${y(opt.goal)}" class="goal-l"/><text x="${P.l}" y="${y(opt.goal) - 6}" class="goal-t">목표 ${opt.goal}등급</text>`;
    if (opt.prev) { const pp = opt.prev.map((r, i) => (r.v != null ? `${x(i).toFixed(1)} ${y(r.v).toFixed(1)}` : null)).filter(Boolean); if (pp.length > 1) s += `<path d="M${pp.join(' L')}" class="prev-l"/>`; }
    s += `<path class="area" d="${area}" fill="url(#tg${opt.id || ''})"/><path d="${line}" class="main-l" pathLength="1" stroke="${opt.color || '#3182f6'}"/>`;
    pts.slice(0, -1).forEach((p) => { s += `<circle cx="${x(p.i)}" cy="${y(p.v)}" r="4" fill="var(--card)" stroke="${opt.color || '#3182f6'}" stroke-width="2.5"/>`; });
    s += `<circle cx="${x(L.i)}" cy="${y(L.v)}" r="12" fill="${opt.color || '#3182f6'}" opacity=".18"/><circle cx="${x(L.i)}" cy="${y(L.v)}" r="6" fill="${opt.color || '#3182f6'}"/>`;
    s += `<text x="${tx}" y="${y(L.v) - 20}" text-anchor="middle" class="tip-t">${tip}</text>`;
    rows.forEach((r, i) => { s += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="ax-t">${esc(r.label)}</text>`; });
    return s + '</svg>';
  }
  function cutBars(m) {
    // 시세의 「최저·최고」 막대처럼: 0점 ~ 만점 위에 내 점수 점, 다음 등급컷 눈금
    const rows = (m.subjects || []).map((ms) => { const r = mockResult(m, ms.key); if (!r) return null; const c = (ms.cuts && ms.cuts.length ? ms.cuts : subjInfo(ms.key).abs) || null; const next = c && r.grade > 1 ? c[r.grade - 2] : null; return { ms, r, next, need: next != null ? Math.max(0, +(next - r.raw).toFixed(1)) : null }; }).filter(Boolean);
    if (!rows.length) return '';
    return `<section class="card c12"><div class="card-h"><h2>한 등급 올리려면</h2></div><div class="list two-col">${rows.map(({ ms, r, next, need }) => `<div class="li" style="flex-direction:column;align-items:stretch;gap:8px;padding:12px 0"><div class="row between"><b style="font-size:15px">${esc(ms.name)} <span class="muted" style="font-weight:500">${r.grade}등급 · ${r.raw}점</span></b><span class="${need ? 'blue' : 'muted'}" style="font-size:14px;font-weight:700">${r.grade === 1 ? '1등급이에요' : need != null ? `${r.grade - 1}등급까지 ${need}점` : ''}</span></div><div class="range"><span class="fill" style="width:${(r.raw / r.total) * 100}%"></span>${next != null ? `<i class="cut" style="left:${(next / r.total) * 100}%"></i>` : ''}<i class="dot" style="left:${(r.raw / r.total) * 100}%"></i></div><div class="row between tiny"><span>0점</span><span>${r.total}점</span></div></div>`).join('')}</div></section>`;
  }
  function gradeBars(g, goal) {
    const L = MOCK_SUBJ.filter((s) => g[s.key]);
    if (!L.length) return '';
    return `<div class="list">${L.map((s) => `<div class="li" style="padding:10px 0"><span style="width:64px;flex:none;font-size:14px;color:var(--t2)">${s.name}</span><div class="hbar"><span style="width:${((10 - g[s.key]) / 9) * 100}%;background:${g[s.key] <= goal ? 'var(--blue)' : g[s.key] >= 5 ? 'var(--red)' : 'var(--t4)'}"></span></div><b class="num" style="width:52px;text-align:right;flex:none">${g[s.key]}등급</b></div>`).join('')}</div>`;
  }
  function reportSection() {
    const rows = examRows().filter((r) => avgOf(r.g) != null);
    const p = S.profile, goal = p.goalMock || 2;
    const cur = rows[rows.length - 1], prev = rows[rows.length - 2];
    const common = cur && prev ? MAIN.filter((k) => cur.g[k] && prev.g[k]) : [];
    const ca = cur ? avgOf(cur.g) : null, pa = prev ? avgOf(prev.g) : null;
    const nCur = cur ? MAIN.filter((k) => cur.g[k]).length : 0;
    const diff = common.length >= 2 ? +(avgOf(prev.g, common) - avgOf(cur.g, common)).toFixed(1) : null;
    const head = !cur ? '모의고사를 채점하면<br>여기에 리포트가 생겨요' : nCur < 3 && prev ? `${esc(cur.title)} 다른 과목도 채점하면<br>지난번과 <em>비교</em>해 줄게요` : diff == null ? `첫 기록은<br>평균 <em>${fmt1(ca)}등급</em>이에요` : diff > 0 ? `지난번보다<br>평균 <em>${diff}등급</em> 올랐어요` : diff < 0 ? `지난번보다<br>평균 <em class="red">${-diff}등급</em> 내려갔어요` : '지난번과<br>평균 등급이 같아요';
    const ck = UI.chartSubj, key = ck === 'avg' ? null : ck;
    const series = examRows().map((r) => ({ label: r.title.replace(/학력평가|모의고사/g, '').trim() || md(r.date), v: key ? r.g[key] || null : avgOf(r.g) }));
    const m = MOCKS.slice().reverse().find((x) => (x.subjects || []).some((s) => mockResult(x, s.key)));
    return `<div class="grid" style="margin-bottom:16px">
      <section class="card c12"><div class="row between wrap" style="gap:12px"><p class="report-h">${head}</p><div class="seg" style="flex:0 1 auto">${[['avg', '평균'], ...MAIN.map((k) => [k, SUBJ_NAMES[k]])].map(([k, n]) => `<button type="button" class="${ck === k ? 'on' : ''}" data-cs="${k}">${n}</button>`).join('')}</div></div>
        <div class="stat-row"><div><span>이번</span><b class="num">${ca != null ? fmt1(ca) : '-'}<small>등급</small></b></div><div><span>지난번</span><b class="num">${pa != null ? fmt1(pa) : '-'}<small>등급</small></b></div><div><span>목표</span><b class="num blue">${goal}<small>등급</small></b></div></div>
        ${tossLine(series, { goal, id: 'm', label: '모의고사 등급 추이', empty: '틀린 번호만 누르면 등급이 그려져요' })}</section>
      ${cur ? `<section class="card c12"><div class="card-h"><h2>과목별 등급</h2><span class="tiny">${esc(cur.title)}</span></div>${gradeBars(cur.g, goal)}</section>` : ''}
      ${m ? cutBars(m) : ''}
    </div>`;
  }

  // ───────── 토마토 타이머 (뽀모도로) ─────────
  // 집중 25·45분을 끝내면 토마토 하나. 하루 기록은 S.pomo(서버), 도는 타이머는 이 기기에 둬서 새로 고쳐도 이어져요
  // 남은 시간은 끝나는 시각(endAt)으로 계산해서, 탭을 가려 두거나 다른 화면에 가도 틀리지 않아요
  const PKEY = 'mallang-univ:pomo:' + U.who, TITLE = document.title, PR = 116, PC = 2 * Math.PI * PR;
  const PM = { f25: { t: '25분', min: 25, mode: 'focus' }, f45: { t: '45분', min: 45, mode: 'focus' }, br: { t: '쉬는 시간 5분', min: 5, mode: 'break' }, br15: { t: '쉬는 시간 15분', min: 15, mode: 'break' } };
  const PM_SUBJ = ['오답', '숙제', '과학', '영어', '단어', '내신', '자유'];
  const PM_FOCUS = ['폰은 잠깐 뒤집어 둬요', '지금 이 집중이 실력이 돼요', '딱 이것만 생각해요', '모르는 건 표시만 하고 넘어가요', '거의 다 왔어요, 조금만 더'];
  const PM_BREAK = ['물 한 잔 마셔요', '창밖 먼 곳을 봐요', '기지개 한 번 쭉 켜요', '눈 감고 숨 크게 쉬어요'];
  const pRead = () => { try { return JSON.parse(localStorage.getItem(PKEY)) || null; } catch (e) { return null; } };
  let P = Object.assign({ pick: 'f25', subj: '자유', run: null, offer: null }, pRead() || {});
  if (!PM[P.pick]) P.pick = 'f25'; if (P.lastFocus && !PM[P.lastFocus]) P.lastFocus = 'f25';  // 예전 50분 고른 기기
  const pSave = () => { try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch (e) {} };
  const pomo = () => { S.pomo = S.pomo || { days: {}, goal: 4 }; S.pomo.days = S.pomo.days || {}; return S.pomo; };
  const pGoal = () => +pomo().goal || 4;
  const pDay = (d = today()) => pomo().days[d] || { n: 0, min: 0, subj: {} };
  const pBack = (i) => { const d = new Date(); d.setDate(d.getDate() - i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  // 연속: 오늘 아직 안 했으면 어제까지 이어진 날 (오늘 하나 하면 이어져요)
  const pStreak = () => { let n = 0, i = pDay().n ? 0 : 1; while (pDay(pBack(i)).n) { n++; i++; } return n; };
  const pBest = () => { let best = 0, run = 0, prev = null; for (const d of Object.keys(pomo().days).filter((k) => pomo().days[k].n).sort()) { run = prev && Math.round((new Date(d + 'T00:00:00') - new Date(prev + 'T00:00:00')) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; } return best; };
  const pTotal = () => Object.values(pomo().days).reduce((a, x) => a + (x.n || 0), 0);
  const BADGES = [
    { id: 'first', w: 300, i: 'tomato', t: '첫 토마토', d: '토마토 1개', ok: () => pTotal() >= 1 },
    { id: 't10', w: 500, i: 'glow', t: '토마토 10개', d: '모두 10개', ok: () => pTotal() >= 10 },
    { id: 't30', w: 1000, i: 'gold', t: '토마토 30개', d: '모두 30개', ok: () => pTotal() >= 30 },
    { id: 't100', w: 3000, i: 'hundred', t: '토마토 100개', d: '모두 100개', ok: () => pTotal() >= 100 },
    { id: 's3', w: 500, i: 'fire', t: '3일 연속', d: '3일 이어서', ok: () => pBest() >= 3 },
    { id: 's7', w: 1000, i: 'herb', t: '7일 연속', d: '일주일 내내', ok: () => pBest() >= 7 },
    { id: 's14', w: 2000, i: 'trophy', t: '14일 연속', d: '2주 내내', ok: () => pBest() >= 14 },
    { id: 'goal', w: 500, i: 'target', t: '하루 목표 달성', d: '목표만큼 하루에', ok: () => Object.values(pomo().days).some((x) => x.n >= pGoal()) },
    { id: 'h2', w: 1000, i: 'brain', t: '하루 2시간', d: '하루 집중 120분', ok: () => Object.values(pomo().days).some((x) => x.min >= 120) },
  ];
  // 배지 획득: 화면 가운데 큰 배지가 튀어나오고, 배지마다 용돈(하루 한도와 따로)
  function badgePop(list) {
    const b = list[0]; if (!b) return;
    const all = BADGES.every(pHas);
    const el = document.createElement('div'); el.className = 'bdg-pop';
    el.innerHTML = `<div class="bdg-card"><div class="bdg-rays"></div><div class="bdg-ic">${ic(b.i)}</div><p class="bdg-eb">배지 획득!</p><h3>${esc(b.t)}</h3><p class="bdg-d">${esc(b.d)}</p><p class="bdg-won">+${b.w.toLocaleString()}원</p>${all && list.length === 1 ? '<p class="bdg-all">배지를 모두 모았어요! 보너스 +5,000원</p>' : ''}<button class="btn primary big block" type="button">${list.length > 1 ? '다음 배지 보기' : '좋아요'}</button></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    setTimeout(() => { const r = $('.bdg-ic', el).getBoundingClientRect(); boom(r.left + r.width / 2, r.top + r.height / 2, 6); ding(8); if (navigator.vibrate) navigator.vibrate([60, 40, 120]); }, 380);
    setTimeout(() => { earn('badge:' + b.id, b.w, `배지 · ${b.t}`, { bonus: true, from: $('.bdg-won', el) }); if (all && list.length === 1) earn('badge:all', 5000, '배지 모두 모음', { bonus: true, from: $('.bdg-won', el) }); }, 900);
    const close = () => { el.classList.remove('on'); setTimeout(() => { el.remove(); badgePop(list.slice(1)); }, 260); };
    $('button', el).onclick = close; el.onclick = (e) => { if (e.target === el) close(); };
  }
  const pHas = (b) => !!(pomo().badges || {})[b.id] || b.ok();
  const pDur = () => (P.run ? P.run.dur : PM[P.pick].min * 60);
  const pLeft = () => { const r = P.run; if (!r) return pDur(); return r.paused ? r.left : Math.max(0, Math.ceil((r.endAt - Date.now()) / 1000)); };
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const tomRow = (n, g, cls = '') => `<div class="pm-row ${cls}">${Array.from({ length: Math.max(g, n) }, (_, i) => `<img class="${i < n ? 'on' : ''}" src="icons/${IC.tomato}.svg" alt="">`).join('')}</div>`;
  function pLine() {
    const r = P.run, n = pDay().n, g = pGoal(), st = pStreak();
    if (r && r.paused) return '잠깐 멈췄어요, 준비되면 이어 해요';
    if (r && r.mode === 'break') return PM_BREAK[Math.floor((r.dur - pLeft()) / 75) % PM_BREAK.length];
    if (r) return PM_FOCUS[Math.min(PM_FOCUS.length - 1, Math.floor((1 - pLeft() / r.dur) * PM_FOCUS.length))];
    if (P.offer === 'break') return '토마토 하나 완성! 5분 쉬어 가요';
    if (P.offer === 'focus') return '잘 쉬었어요, 다음 토마토 갈까요?';
    if (!n && st) return `오늘 토마토 하나면 ${st + 1}일 연속이에요`;
    if (!n) return '25분만 집중해 봐요, 첫 토마토가 기다려요';
    if (n >= g) return `오늘 목표 ${g}개 달성! 정말 잘했어요`;
    return `목표까지 토마토 ${g - n}개 남았어요`;
  }
  // 홈 핫뉴스 한 개: 안 읽은 대이슈 → 안 읽은 최신 → 최신
  function hotCard(cls) {
    const N = ((D.news && D.news.items) || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const un = N.filter((n) => !wHas('news:' + n.id)), n = un.find((x) => x.must) || un[0] || N[0];
    if (!n) return '';
    const rd = wHas('news:' + n.id);
    return `<section class="card ${cls} hot-card link" data-news="${esc(n.id)}"><div class="hot-ic">${ic('fire')}</div><div class="hot-b"><div class="eyebrow">핫뉴스${n.must ? ' · <b class="red">꼭 읽기</b>' : ''}</div><b class="hot-t">${esc(n.title)}</b><p class="tiny" style="margin:2px 0 0">${md(n.date)} · ${esc(n.scope || '')}${rd ? ' · 읽었어요' : ' · 읽으면 50원'}</p></div></section>`;
  }
  function pomoCard(cls) {
    const n = pDay().n, g = pGoal(), st = pStreak(), r = P.run;
    return `<section class="card ${cls} pm-home link" data-pomo><div class="pm-h-ic">${ic('tomato')}</div>
      <div class="pm-h-b"><div class="eyebrow">토마토 타이머${st ? ` · ${ic('fire')} ${st}일 연속` : ''}</div><b class="pm-h-t">${r ? `${r.mode === 'break' ? '쉬는 중' : '집중하는 중'} <span class="num blue" data-pmt>${mmss(pLeft())}</span>` : n ? `오늘 토마토 ${n}개${n >= g ? ', 목표 달성!' : ''}` : '오늘 첫 토마토를 키워 봐요'}</b><p class="tiny" style="margin:2px 0 0">${esc(pLine())}</p></div>
      ${tomRow(n, g, 'sm')}${TEACHER ? '' : `<button class="btn primary" type="button" data-pomo>${r ? '타이머 보기' : '집중 시작'}</button>`}</section>`;
  }
  function pomoRun() {
    const r = P.run, mode = r ? r.mode : PM[P.pick].mode, n = pDay().n, g = pGoal(), st = pStreak(), td = pDay();
    const lv = (d) => { const x = pDay(d).n; return !x ? '' : x >= g ? 'l3' : x >= 2 ? 'l2' : 'l1'; };
    const days = Array.from({ length: 28 }, (_, i) => pBack(27 - i));
    const ctl = TEACHER ? '<p class="tiny" style="margin:0">선생님 보기에서는 기록만 볼 수 있어요</p>'
      : !r ? `<div class="pm-btns ${P.offer ? '' : 'one'}">${P.offer ? `<button class="btn big" id="pm-skip" type="button">${P.offer === 'break' ? '바로 집중' : '더 쉬기'}</button>` : ''}<button class="btn primary big" id="pm-start" type="button">${mode === 'break' ? '쉬는 시간 시작' : '집중 시작'}</button></div>`
      : `<div class="pm-btns"><button class="btn big" id="pm-stop" type="button">그만하기</button><button class="btn big ${r.paused ? 'primary' : 'soft'}" id="pm-pause" type="button">${r.paused ? '이어 하기' : '일시정지'}</button></div>`;
    return `<div class="qwrap" style="max-width:760px;margin:0 auto">
      <div class="row between"><button class="btn sm" data-go="home" type="button">‹ 홈</button><div class="row" style="gap:8px">${st ? `<span class="tag red">${ic('fire')} ${st}일 연속</span>` : ''}<button class="bell-btn ${SOUND ? 'on' : ''}" type="button" data-bell aria-label="${SOUND ? '소리 켜짐, 눌러서 무음' : '무음, 눌러서 소리 켜기'}">${bellSVG(SOUND)}</button></div></div>
      <div><h1 class="h1" style="margin:4px 0 4px">토마토 타이머</h1><p class="sub" id="pm-line" style="margin:0">${esc(pLine())}</p></div>
      <section class="card pm-card ${mode} ${r && !r.paused ? 'running' : ''}">
        <div class="chips">${Object.entries(PM).map(([k, m]) => `<button class="chip ${(r ? r.pick : P.pick) === k ? 'on' : ''}" type="button" data-pm="${k}" ${r || TEACHER ? 'disabled' : ''}>${m.t}</button>`).join('')}</div>
        <div class="pm-ring"><svg viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="${PR}" fill="none" stroke="var(--fill)" stroke-width="14"/><circle id="pm-arc" cx="130" cy="130" r="${PR}" fill="none" stroke="${mode === 'break' ? 'var(--green)' : 'var(--red)'}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${PC}" stroke-dashoffset="${PC * (1 - pLeft() / pDur())}" transform="rotate(-90 130 130)"/></svg>
          <div class="pm-c">${r && !r.paused && mode === 'focus' ? gh('focus', 'pm-tom pm-gh') : ic(mode === 'break' ? 'coffee' : 'tomato', 'pm-tom')}<b class="num" id="pm-time">${mmss(pLeft())}</b><span>${r ? (r.paused ? '잠깐 멈춤' : mode === 'break' ? '쉬는 중' : '집중하는 중') : mode === 'break' ? '쉬는 시간' : '집중 준비'}</span></div></div>
        ${mode === 'focus' ? `<div class="pm-subj"><span class="eyebrow">무엇을 공부해요?</span><div class="chips">${PM_SUBJ.map((s) => `<button class="chip sm ${(r ? r.subj : P.subj) === s ? 'on' : ''}" type="button" data-psj="${s}" ${TEACHER ? 'disabled' : ''}>${s}</button>`).join('')}</div></div>` : ''}
        ${ctl}
      </section>
      <div class="grid">${soundCards()}
        <section class="card c6 col-card mid"><div class="card-h"><h2>오늘 토마토</h2><span class="tag ${n >= g ? 'blue' : ''}">${n}/${g}</span></div>${tomRow(n, g)}
          <p class="tiny" style="margin:12px 0 0">오늘 집중 ${td.min || 0}분${Object.keys(td.subj || {}).length ? ' · ' + Object.entries(td.subj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${esc(k)} ${v}개`).join(' · ') : ''}</p>
          <div class="row between wrap" style="margin-top:16px;gap:8px"><span class="eyebrow">하루 목표</span><div class="chips">${[2, 4, 6, 8].map((k) => `<button class="chip sm ${g === k ? 'on' : ''}" type="button" data-pg="${k}">${k}개</button>`).join('')}</div></div></section>
        <section class="card c6"><div class="card-h"><h2>토마토 밭</h2><span class="tag ${st ? 'red' : ''}">${st ? `${ic('fire')} ${st}일 연속` : '오늘 첫 칸을 채워요'}</span></div><div class="streak pm-field">${days.map((d) => `<i class="${lv(d)} ${d === today() ? 'today' : ''}" title="${md(d)} 토마토 ${pDay(d).n}개"></i>`).join('')}</div><p class="tiny" style="margin:12px 0 0">최근 4주 · 모두 ${pTotal()}개 · 가장 길게 ${pBest()}일 연속</p></section>
        <section class="card c12"><div class="card-h"><h2>배지</h2><span class="tiny">${BADGES.filter(pHas).length}/${BADGES.length}개 모았어요</span></div><div class="pm-badges">${BADGES.map((b) => `<div class="pm-bd ${pHas(b) ? 'on' : ''}">${ic(b.i)}<b>${b.t}</b><span>${pHas(b) ? '획득!' : b.d}</span><em class="pm-bw">${pHas(b) ? '받았어요' : '+' + b.w.toLocaleString() + '원'}</em></div>`).join('')}</div></section>
      </div></div>`;
  }
  function pPaint() {
    const r = P.run, left = pLeft(), on = UI.run && UI.run.kind === 'pomo';
    const t = $('#pm-time'); if (t) t.textContent = mmss(left);
    const a = $('#pm-arc'); if (a) a.style.strokeDashoffset = PC * (1 - left / pDur());
    const ln = $('#pm-line'); if (ln && r) ln.textContent = pLine();
    $$('[data-pmt]').forEach((ht) => (ht.textContent = mmss(left)));
    let pill = $('#pomo-pill');
    if ((r || listening()) && !on && !(r && ht) && !TEACHER) {
      const k = r ? r.mode + (r.paused ? 'p' : '') + (listening() ? 'h' : '') : 'h';
      if (!pill) { pill = document.createElement('button'); pill.id = 'pomo-pill'; pill.type = 'button'; pill.className = 'pomo-pill'; pill.setAttribute('aria-label', '토마토 타이머 열기'); pill.onclick = openPomo; document.body.appendChild(pill); }
      if (pill.dataset.k !== k) { pill.dataset.k = k; pill.innerHTML = r ? `${ic(r.mode === 'break' ? 'coffee' : 'tomato')}<b class="num"></b><span>${r.paused ? '멈춤' : r.mode === 'break' ? '쉬는 중' : '집중 중'}</span>${listening() ? ic('headph', 'pm-hp') : ''}` : `${ic('headph')}<span>${MUS ? '음악 듣는 중' : '집중 소리 켜짐'}</span>`; }
      if (r) $('b', pill).textContent = mmss(left);
    } else if (pill) pill.remove();
    document.title = r ? `${r.paused ? '⏸' : r.mode === 'break' ? '☕' : '🍅'} ${mmss(left)} · 말랑대학` : TITLE;
  }
  let pT = 0;
  function pTick() { const r = P.run; if (r && !r.paused && Date.now() >= r.endAt) return pFinish(); pPaint(); }
  function pLoop() { clearInterval(pT); pT = 0; if (P.run && !P.run.paused) pT = setInterval(pTick, 500); pTick(); }
  const pRedraw = () => { if ((UI.run && UI.run.kind === 'pomo') || (!UI.run && UI.tab === 'home')) render(); else nav(); };
  function openPomo() { UI.run = { kind: 'pomo' }; render(); window.scrollTo(0, 0); }
  function pStart() {
    if (TEACHER) return; const m = PM[P.pick], dur = m.min * 60;
    P.run = { mode: m.mode, pick: P.pick, dur, endAt: Date.now() + dur * 1000, left: dur, paused: false, subj: P.subj }; P.offer = null;
    pSave(); ding(1); if (navigator.vibrate) navigator.vibrate(20); render(); pLoop();
  }
  function pPause() { const r = P.run; if (!r) return; if (r.paused) { r.endAt = Date.now() + r.left * 1000; r.paused = false; } else { r.left = pLeft(); r.paused = true; } pSave(); render(); pLoop(); }
  function pStop() { P.run = null; P.offer = null; pSave(); pLoop(); render(); }
  function pStopAsk() {
    const r = P.run; if (!r) return;
    if (r.mode === 'break' || r.dur - pLeft() < 60) return pStop();
    sheet(`<h2>그만할까요?</h2><p class="sub">지금 멈추면 이번 토마토는 안 익어요. ${mmss(pLeft())}만 더 하면 토마토 하나예요</p><div class="pm-btns"><button class="btn big" id="ps-no" type="button">그만하기</button><button class="btn primary big" id="ps-go" type="button">계속하기</button></div>`, (el, close) => { $('#ps-go', el).onclick = close; $('#ps-no', el).onclick = () => { close(); pStop(); }; });
  }
  function pFinish() {
    const r = P.run; if (!r) return;
    const cur = pRead(); if (cur && (!cur.run || cur.run.endAt !== r.endAt)) { P = Object.assign(P, cur); pLoop(); pRedraw(); return; }  // 다른 탭에서 이미 끝냈어요
    P.run = null; clearInterval(pT); pT = 0;
    const cx = innerWidth / 2, cy = innerHeight * 0.4; let nb = [], x = null;
    if (r.mode === 'focus') {
      const po = pomo(), d = today(); x = po.days[d] = po.days[d] || { n: 0, min: 0, subj: {} }; x.subj = x.subj || {};
      x.n = (x.n || 0) + 1; x.min = (x.min || 0) + Math.round(r.dur / 60); x.subj[r.subj] = (x.subj[r.subj] || 0) + 1;
      po.badges = po.badges || {}; nb = BADGES.filter((b) => b.ok() && !po.badges[b.id]); for (const b of nb) po.badges[b.id] = d;
      save('pomo'); P.offer = 'break'; P.lastFocus = PM[r.pick] ? r.pick : 'f25'; P.pick = r.dur >= 45 * 60 ? 'br15' : 'br';
    } else { P.offer = 'focus'; P.pick = P.lastFocus || 'f25'; }
    pSave(); pRedraw(); pPaint();
    if (r.mode === 'focus') {
      boom(cx, cy, 5); ding(8); if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 160]);
      toast(x.n === pGoal() ? `오늘 목표 ${x.n}개 달성!` : `토마토 ${x.n}개째예요! 5분 쉬어 가요`);
      const big = r.dur >= 45 * 60; setTimeout(() => earn('pomo:' + r.endAt, big ? 600 : 300, big ? '토마토 45분' : '토마토 25분', { from: $('.pm-tom') || $('.pm-h-ic') }), 600);
      const tm = $('.pm-tom'); if (tm && !RM()) bump(tm, 'pm-pop');
      if (nb.length) setTimeout(() => badgePop(nb), 2200);
    } else { ding(3); if (navigator.vibrate) navigator.vibrate([60, 40, 60]); toast('쉬는 시간 끝! 다음 토마토 가요'); }
  }
  function bindPomo() {
    $$('[data-pm]').forEach((b) => (b.onclick = () => { if (P.run) return; P.pick = b.dataset.pm; P.offer = null; pSave(); render(); }));
    $$('[data-psj]').forEach((b) => (b.onclick = () => { P.subj = b.dataset.psj; if (P.run) P.run.subj = P.subj; pSave(); render(); }));
    $$('[data-pg]').forEach((b) => (b.onclick = () => { pomo().goal = +b.dataset.pg; save('pomo'); render(); }));
    const s = $('#pm-start'); if (s) s.onclick = pStart;
    const k = $('#pm-skip'); if (k) k.onclick = () => { P.pick = P.offer === 'break' ? (P.lastFocus || 'f25') : (P.lastFocus === 'f45' ? 'br15' : 'br'); P.offer = null; pSave(); render(); };
    const p = $('#pm-pause'); if (p) p.onclick = pPause;
    const x = $('#pm-stop'); if (x) x.onclick = pStopAsk;
  }
  // ───────── 소리 (벨) · 집중 소리 · 공부 음악 ─────────
  // 독서실에서 공부해서 효과음은 처음엔 무음이에요 (진동은 그대로). 집중 소리·음악은 직접 눌러야만 나와서 벨과 따로예요
  const SKEY = 'mallang-univ:sound', AKEY = 'mallang-univ:amb';
  let SOUND = false; try { SOUND = localStorage.getItem(SKEY) === '1'; } catch (e) {}
  const bellSVG = (on) => `<svg class="bell" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${on ? '' : '<mask id="bell-m"><rect width="24" height="24" fill="#fff"/><path d="M3.5 2.5l17 19" stroke="#000" stroke-width="4.6" stroke-linecap="round"/></mask>'}<g ${on ? '' : 'mask="url(#bell-m)"'} fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2.8c.8 0 1.4.6 1.4 1.4v.6a6 6 0 0 1 4.6 5.8v3.6l1.5 2.2c.4.6 0 1.4-.7 1.4H5.2c-.7 0-1.1-.8-.7-1.4L6 14.2v-3.6a6 6 0 0 1 4.6-5.8v-.6c0-.8.6-1.4 1.4-1.4z"/><path d="M9.6 19.6h4.8a2.4 2.4 0 0 1-4.8 0z"/></g>${on ? '' : '<path d="M3.5 2.5l17 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'}</svg>`;
  function toggleBell() {
    SOUND = !SOUND; try { localStorage.setItem(SKEY, SOUND ? '1' : '0'); } catch (e) {}
    if (SOUND) ding(2); toast(SOUND ? '소리 켰어요' : '무음으로 바꿨어요');
    nav(); $$('[data-bell]').forEach((b) => { b.innerHTML = bellSVG(SOUND); b.classList.toggle('on', SOUND); b.setAttribute('aria-label', SOUND ? '소리 켜짐, 눌러서 무음' : '무음, 눌러서 소리 켜기'); });
  }
  const audio = () => { const A = ding.a || (ding.a = new (window.AudioContext || window.webkitAudioContext)()); if (A.state === 'suspended') A.resume(); return A; };
  const AMB = [['off', '끄기', ''], ['white', '백색소음', 'leaf'], ['rain', '빗소리', 'rain'], ['brown', '갈색소음', 'books'], ['wave', '파도', 'wave']];
  const AMB_LV = { white: 0.16, rain: 0.5, brown: 0.9, wave: 0.75 };
  const AM = { on: null, nodes: [], out: null, vol: 0.5, last: 'brown' };
  try { Object.assign(AM, JSON.parse(localStorage.getItem(AKEY)) || {}, { on: null, nodes: [], out: null }); } catch (e) {}
  const amSave = () => { try { localStorage.setItem(AKEY, JSON.stringify({ vol: AM.vol, last: AM.last })); } catch (e) {} };
  const noiseBuf = (A, brown) => { const n = A.sampleRate * 4, b = A.createBuffer(1, n, A.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } return b; };
  function ambStop() { for (const x of AM.nodes) { try { if (x.stop) x.stop(); x.disconnect(); } catch (e) {} } AM.nodes = []; AM.out = null; AM.on = null; }
  function ambPlay(k) {
    ambStop(); if (k === 'off') { pPaint(); return; }
    let A; try { A = audio(); } catch (e) { toast('이 브라우저에서는 소리를 낼 수 없어요'); return; }
    const keep = (...x) => (AM.nodes.push(...x), x[0]);
    const out = keep(A.createGain()); out.gain.value = 0; out.connect(A.destination); out.gain.setTargetAtTime(AM.vol * AMB_LV[k], A.currentTime, 0.5);
    const src = (brown) => { const s = keep(A.createBufferSource()); s.buffer = noiseBuf(A, brown); s.loop = true; s.start(); return s; };
    const flt = (type, f, q) => { const x = keep(A.createBiquadFilter()); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; };
    const gain = (v) => { const g = keep(A.createGain()); g.gain.value = v; return g; };
    const lfo = (hz, depth, param) => { const o = keep(A.createOscillator()), g = gain(depth); o.frequency.value = hz; o.connect(g).connect(param); o.start(); };
    if (k === 'white') src(false).connect(flt('lowpass', 9000)).connect(out);
    if (k === 'brown') src(true).connect(flt('lowpass', 600)).connect(out);
    if (k === 'rain') { const g = gain(0.8); src(false).connect(flt('highpass', 900)).connect(flt('lowpass', 6500)).connect(g).connect(out); lfo(0.21, 0.12, g.gain); src(true).connect(flt('lowpass', 250)).connect(gain(0.5)).connect(out); }
    if (k === 'wave') { const f = flt('lowpass', 700), g = gain(0.55); src(true).connect(f).connect(g).connect(out); src(false).connect(flt('lowpass', 1200)).connect(gain(0.05)).connect(g); lfo(0.085, 450, f.frequency); lfo(0.085, 0.45, g.gain); }
    AM.out = out; AM.on = k; AM.last = k; amSave(); pPaint();
  }
  const ambVol = (v) => { AM.vol = v; amSave(); if (AM.out && AM.on) AM.out.gain.setTargetAtTime(v * AMB_LV[AM.on], ding.a.currentTime, 0.1); };
  // 공부 음악: 광고 없는 SomaFM 라디오(청취자 후원으로만 운영). 눌러야 틀고, 화면을 옮겨도 끊기지 않게 본문 밖 작은 막대에서 틀어요
  const MUSIC = [
    { id: 'fluid', i: 'headph', t: 'lofi 힙합', d: '가사 없는 잔잔한 비트' },
    { id: 'groovesalad', i: 'sax', t: '잔잔한 일렉트로닉', d: '공부할 때 많이 듣는 느린 비트' },
    { id: 'dronezone', i: 'wave', t: '앰비언트', d: '박자 없이 공간을 채우는 소리' },
    { id: 'deepspaceone', i: 'glow', t: '우주 앰비언트', d: '아주 조용한 배경 소리' },
  ];
  let MUS = null;
  function musPlay(id) {
    const m = MUSIC.find((x) => x.id === id); let dock = $('#yt-dock');
    if (!m || MUS === id) { if (dock) { const a = $('audio', dock); if (a) a.pause(); dock.remove(); } MUS = null; pPaint(); return; }
    if (!dock) { dock = document.createElement('div'); dock.id = 'yt-dock'; dock.className = 'yt-dock'; document.body.appendChild(dock); }
    dock.innerHTML = `<div class="yt-h">${ic(m.i)}<b>${esc(m.t)}</b><span class="eq"><i></i><i></i><i></i></span><button type="button" class="yt-x" aria-label="음악 끄기">끄기</button></div><audio src="https://ice2.somafm.com/${m.id}-128-mp3" preload="none"></audio>`;
    const au = $('audio', dock); au.volume = 0.7;
    au.play().catch(() => { dock.classList.add('err'); $('b', dock).textContent = '음악을 못 불러왔어요'; });
    au.onwaiting = () => dock.classList.add('wait'); au.onplaying = () => dock.classList.remove('wait', 'err');
    $('.yt-x', dock).onclick = () => { musPlay(null); if (UI.run && UI.run.kind === 'pomo') render(); };
    MUS = id; pPaint();
  }
  const listening = () => !!(AM.on || MUS);
  function soundCards() {
    return `<section class="card c12"><div class="card-h"><h2>집중 소리</h2>${AM.on ? `<span class="tag blue">${ic('headph')} 듣는 중</span>` : ''}</div>
      <div class="chips">${AMB.map(([k, t, i]) => `<button class="chip sm ${(AM.on || 'off') === k ? 'on' : ''}" type="button" data-amb="${k}">${i ? ic(i) + ' ' : ''}${t}</button>`).join('')}</div>
      <div class="pm-vol"><span class="tiny">작게</span><input type="range" min="0" max="100" value="${Math.round(AM.vol * 100)}" id="amb-vol" aria-label="집중 소리 크기"><span class="tiny">크게</span></div>
      <p class="tiny" style="margin:8px 0 0">독서실에서는 꼭 이어폰을 끼고 들어요. 갈색소음은 낮고 웅웅해서 독서실 소리랑 비슷해요</p></section>
      <section class="card c12"><div class="card-h"><h2>공부 음악</h2>${MUS ? `<button class="more" type="button" data-mus="${MUS}">음악 끄기</button>` : '<span class="tiny">광고 없는 라디오예요</span>'}</div>
      <div class="list two-col">${MUSIC.map((m) => `<div class="li btnlike" data-mus="${m.id}"><div class="ico">${ic(m.i)}</div><div class="body"><div class="t">${esc(m.t)}</div><div class="d">${esc(m.d)}</div></div>${MUS === m.id ? '<span class="tag blue">재생 중</span>' : '<span class="chev"></span>'}</div>`).join('')}</div></section>`;
  }
  function bindSound() {
    $$('[data-amb]').forEach((b) => (b.onclick = () => { ambPlay(b.dataset.amb); render(); }));
    const v = $('#amb-vol'); if (v) v.oninput = () => ambVol(v.value / 100);
    $$('[data-mus]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); musPlay(b.dataset.mus); render(); }));
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && P.run) pTick(); });
  window.addEventListener('storage', (e) => { if (e.key !== PKEY) return; const cur = pRead(); if (cur) { P = Object.assign(P, cur); pLoop(); pRedraw(); } });

  // ───────── 말랑 용돈 ─────────
  // 공부하면 1원씩 쌓이고, 5만원이 되면 선생님이 진짜 돈으로 바꿔 줘요 (1포인트 = 1원)
  // 한 가지 일에는 한 번만 줘요(key). 다시 그리거나 다시 풀어도 두 번 쌓이지 않아요. 하루 2,000원까지 (보너스는 따로)
  const W_GOAL = 50000, W_CAP = 2000, W_LOGMAX = 3, W_PACE = 1100;
  const EARN = [
    { i: 'tomato', t: '토마토 25분', a: '300원' }, { i: 'tomato', t: '토마토 45분', a: '600원' },
    { i: 'pin', t: '선생님 숙제 하나 끝내기', a: '200원' }, { i: 'sci', t: '매일 과제 끝내기', d: '과학 · 천일문 · 단어 시험 · 고3 영어 · 약한 영역', a: '하나에 200원' },
    { i: 'retry', t: '오답 다시 맞히기', a: '100원' }, { i: 'hundred', t: '문제 맞히기', a: '20원' },
    { i: 'books', t: '과학 교과서 개념 읽기', d: '10초 넘게 읽으면', a: '100원' }, { i: 'news', t: '소식 하나 읽기', d: '8초 넘게 읽으면', a: '50원' }, { i: 'dna', t: '진로 픽 하나 읽기', d: '8초 넘게 읽으면', a: '50원' },
    { i: 'write', t: '오늘 학교에서 한 것 한 줄', d: '하루 3개까지', a: '100원' },
    { i: 'trophy', t: '토마토 배지 하나 따기', d: '배지마다 300~3,000원 · 하루 한도와 따로', a: '보너스' }, { i: 'gold', t: '토마토 배지 모두 모으기', d: '하루 한도와 따로', a: '보너스 5,000원' },
    { i: 'fire', t: '3일 연속 공부', d: '하루 한도와 따로', a: '보너스 300원' }, { i: 'trophy', t: '7일 연속 공부', d: '7일마다 · 하루 한도와 따로', a: '보너스 1,000원' },
  ];
  const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
  const dateOf = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const W = () => { const w = (S.wallet = S.wallet || {}); w.log = w.log || []; w.paid = w.paid || []; w.seen = w.seen || {}; if (w.req === undefined) w.req = null; return w; };
  const wHas = (key) => { const w = W(); return !!w.seen[key] || w.log.some((x) => x.key === key); };
  const wBal = () => { const w = W(); return w.log.reduce((a, x) => a + x.amt, 0) - w.paid.reduce((a, x) => a + x.amt, 0); };
  const wDay = (d = today()) => W().log.filter((x) => x.date === d && !x.bonus).reduce((a, x) => a + x.amt, 0);
  const wLeft = () => Math.max(0, W_CAP - wDay());
  const wLogs = () => W().log.filter((x) => x.date === today() && x.key.startsWith('log:')).length;
  const wStreak = () => { const days = new Set(W().log.filter((x) => !x.bonus).map((x) => x.date)); let n = 0, i = days.has(today()) ? 0 : 1; while (days.has(pBack(i))) { n++; i++; } return n; };
  // 지금 속도: 처음 모은 날부터 오늘까지 하루 평균 (기록이 적으면 1,100원으로 어림)
  function wPace() {
    const L = W().log.filter((x) => !x.teacher); if (!L.length) return W_PACE;
    const first = L.reduce((a, x) => (x.date < a ? x.date : a), today());
    const days = Math.max(1, Math.round((new Date(today() + 'T00:00:00') - new Date(first + 'T00:00:00')) / 864e5) + 1);
    const avg = L.reduce((a, x) => a + x.amt, 0) / days;
    return days < 3 ? Math.max(avg, W_PACE) : Math.max(avg, 100);
  }
  function wEta() { const rem = W_GOAL - wBal(); if (rem <= 0) return null; const d = new Date(); d.setDate(d.getDate() + Math.ceil(rem / wPace())); return md(dateOf(d)); }
  function earn(key, amt, why, opt = {}) {
    if ((TEACHER && !opt.teacher) || !key || wHas(key)) return 0;
    const w = W(); if (!w.since) w.since = Date.now();
    const a = opt.bonus ? amt : Math.min(amt, wLeft());
    if (a <= 0) { capNote(); return 0; }
    const first = !opt.bonus && !w.log.some((x) => x.date === today() && !x.bonus);
    w.log.push({ id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), key, date: today(), amt: a, why, at: Date.now(), ...(opt.bonus ? { bonus: 1 } : {}), ...(opt.teacher ? { teacher: 1 } : {}) });
    coinPend = true; save('wallet'); coinFx(a, why, opt.from);
    if (first) { const n = wStreak(); if (n === 3) earn(`streak3:${today()}`, 300, '3일 연속 보너스', { bonus: true }); else if (n >= 7 && n % 7 === 0) earn(`streak7:${today()}`, 1000, `${n}일 연속 보너스`, { bonus: true }); }
    return a;
  }
  // 정답: 처음 틀렸던 문제면 오답 다시 맞히기(clearWrong)에서 100원, 아니면 20원
  function gotIt(wid) { const w = S.wrong && S.wrong[wid]; if (!(w && !w.cleared)) earn('ok:' + wid, 20, '문제 맞힘'); }
  function capNote() { if (capNote.d === today() || TEACHER) return; capNote.d = today(); coinToast(`${ic('party')}<span>오늘은 다 모았어요, 내일 또 만나요</span>`); }
  // 상태를 보고 끝낸 것에 용돈을 줘요. silent면 지갑을 처음 만들 때라 이미 끝낸 것만 표시해 둬요 (예전 것까지 한꺼번에 주지 않게)
  function walletScan(silent) {
    if (TEACHER) return;
    const w = W(), t = today(), give = (key, amt, why) => { if (silent) { if (!wHas(key)) w.seen[key] = 1; } else earn(key, amt, why); };
    for (const h of S.hw || []) if (hwDone(h)) give('hw:' + h.id, 200, '숙제 끝');
    for (const b of BADGES) if (((pomo().badges || {})[b.id]) && !wHas('badge:' + b.id)) { if (silent) w.seen['badge:' + b.id] = 1; else earn('badge:' + b.id, b.w, `배지 · ${b.t}`, { bonus: true }); }
    const sd = S.sci && S.sci.days && S.sci.days[t]; if (sd) { const st = dayStat(sd); if (st.n && st.done >= st.n) give(`set:sci:${t}`, 200, '오늘의 과학 끝'); }
    const ed = S.eng && S.eng.days && S.eng.days[t];
    if (ed) { if (ed.udone) give(`set:unit:${t}`, 200, '천일문 끝'); const wl = wordsFor(ed.words).length; if (wl && Object.keys(ed.wans || {}).length >= Math.min(10, wl)) give(`set:words:${t}`, 200, '단어 시험 끝'); if (ed.g3done) give(`set:g3:${t}`, 200, '고3 영어 끝'); }
    for (const d of allDrills()) if (drillDone(d)) give('set:drill:' + d.id, 200, '약한 영역 문제 끝');
    const logs = [...(S.logs || []).filter((x) => x.date === t).map((x) => 'log:' + x.id), ...(S.sgb || []).filter((x) => x.at && dateOf(x.at) === t).map((x) => 'log:sgb:' + x.id)];
    for (const k of logs) { if (wHas(k)) continue; if (!silent && wLogs() >= W_LOGMAX) break; give(k, 100, '오늘 한 것 기록'); }
  }
  // 동전이 눌린 자리에서 위 지갑으로 날아가고, 위에 「+100원 · 소식 읽기」가 떠요
  let wFx = null, coinShown = null, coinPend = false;
  function coinFx(a, why, from) {
    const f = wFx || (wFx = { a: 0, whys: [], from: null });
    f.a += a; if (!f.whys.includes(why)) f.whys.push(why); if (from && !f.from) f.from = from;
    clearTimeout(f.t); f.t = setTimeout(() => { wFx = null; coinShow(f); }, 150);
  }
  function coinToast(html) {
    let el = $('#coin-toast'); if (!el) { el = document.createElement('div'); el.id = 'coin-toast'; el.className = 'coin-toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
    el.innerHTML = html; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); clearTimeout(el.t); el.t = setTimeout(() => el.classList.remove('on'), 2400);
  }
  function coinShow(f) {
    const top = $('#coin-top'), tr = top && top.getClientRects().length ? top.getBoundingClientRect() : null;
    const fr = f.from && f.from.isConnected ? f.from.getBoundingClientRect() : null;
    const x0 = fr ? fr.left + Math.min(fr.width / 2, 24) : innerWidth / 2, y0 = fr ? fr.top + fr.height / 2 : innerHeight * 0.45;
    const x1 = tr ? tr.left + 19 : innerWidth / 2, y1 = tr ? tr.top + tr.height / 2 : 30;
    if (!RM()) for (let k = 0; k < Math.min(4, 1 + Math.floor(f.a / 150)); k++) {
      const c = document.createElement('i'); c.className = 'coin-fly'; document.body.appendChild(c);
      const dx = (k - 1) * 14;
      c.animate([{ transform: `translate(${x0 - 14}px,${y0 - 14}px) scale(.5)`, opacity: 0 }, { transform: `translate(${x0 - 14 + dx}px,${y0 - 70}px) scale(1.2) rotate(20deg)`, opacity: 1, offset: 0.35 }, { transform: `translate(${x1 - 14}px,${y1 - 14}px) scale(.6) rotate(-10deg)`, opacity: 0.9 }], { duration: 850, delay: k * 90, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' }).onfinish = () => c.remove();
    }
    coinToast(`${ic('coin')}<b class="num">+${won(f.a)}</b><span>${esc(f.whys.slice(0, 2).join(' · '))}</span>`);
    coinSound();
    setTimeout(() => { if (top && !RM()) bump(top, 'coin-hit'); walletCount(); }, RM() ? 0 : 820);
  }
  // 위 지갑 · 홈 카드 · 지갑 화면의 금액을 지금 금액까지 세어 올려요
  function walletCount() {
    const to = wBal(), from = coinShown == null ? to : coinShown; coinShown = to; coinPend = false;
    const els = $$('#coin-top b, [data-wbal]'); if (from === to || RM()) { els.forEach((e) => (e.textContent = won(to))); return; }
    const t0 = performance.now(), D = 700;
    const step = (now) => { const k = Math.min(1, (now - t0) / D), v = from + (to - from) * (1 - Math.pow(1 - k, 3)); els.forEach((e) => (e.textContent = won(v))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function coinSound() {
    if (!SOUND) return;
    try {
      const A = ding.a || (ding.a = new (window.AudioContext || window.webkitAudioContext)());
      [[1568, 0], [2093, 0.08]].forEach(([fq, d]) => { const o = A.createOscillator(), g = A.createGain(), t = A.currentTime + d; o.type = 'triangle'; o.frequency.value = fq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g).connect(A.destination); o.start(t); o.stop(t + 0.32); });
    } catch (e) {}
  }
  // 읽기: 그 화면을 몇 초 그대로 두고 읽어야 쌓여요 (다른 데로 가면 멈춰요)
  const readProg = {};
  const readPill = (key, amt, why, sec = 8) => TEACHER ? '' : `<div class="rd-pill" data-rd="${esc(key)}" data-amt="${amt}" data-why="${esc(why)}" data-sec="${sec}">${ic('coin')}<span class="rd-t"></span><i class="rd-bar"><b></b></i></div>`;
  function startReads(root) {
    if (!root) return;
    $$('.rd-pill:not(.go)', root).forEach((p) => {
      p.classList.add('go'); const key = p.dataset.rd, amt = +p.dataset.amt, sec = +p.dataset.sec, t = $('.rd-t', p), bar = $('.rd-bar b', p);
      const set = (cls, txt, f) => { p.className = 'rd-pill go ' + cls; t.textContent = txt; bar.style.width = f * 100 + '%'; };
      if (wHas(key)) return set('done', `읽기 용돈 ${won(amt)} 받았어요`, 1);
      if (!wLeft()) return set('cap', '오늘 용돈은 다 모았어요, 내일 또 만나요', 1);
      const paint = () => { const s = readProg[key] || 0, f = Math.min(1, s / sec); bar.style.width = f * 100 + '%'; t.textContent = `읽는 중… ${Math.max(1, Math.ceil(sec - s))}초 더 읽으면 +${won(amt)}`; };
      set('', '', 0); paint();
      const iv = setInterval(() => {
        if (!p.isConnected) return clearInterval(iv);
        if (document.hidden) return;
        readProg[key] = (readProg[key] || 0) + 0.25; paint();
        if (readProg[key] >= sec) { clearInterval(iv); const got = earn(key, amt, p.dataset.why, { from: p }); set(got ? 'done' : 'cap', got ? `+${won(got)} 받았어요 · ${p.dataset.why}` : '오늘 용돈은 다 모았어요, 내일 또 만나요', 1); if (got && !RM()) bump(p, 'tap-pop'); }
      }, 250);
    });
  }
  // 지금 모을 수 있는 것 (홈 카드에서 바로 가요)
  function wNext() {
    const out = [], t = today();
    const N = (D.news && D.news.items) || [], unread = N.filter((n) => !wHas('news:' + n.id));
    if (!P.run) out.push({ i: 'tomato', t: '토마토 하나 키우기', a: 300, act: 'pomo' });
    const sd = S.sci.days[t], st = sd ? dayStat(sd) : null;
    if ((onDay('sci') || sd) && SCI.concepts.length && !wHas(`set:sci:${t}`) && !(st && st.n && st.done >= st.n)) out.push({ i: 'sci', t: '오늘의 과학 끝내기', a: 200 + (sd && sd.one && !wHas('read:' + sd.c) ? 100 : 0), act: 'sci' });
    const wr = todayWr().length; if (wr) out.push({ i: 'retry', t: `오늘 오답 ${wr}문제 다시 맞히기`, a: wr * 100, act: 'wrong' });
    const hn = hwNow().filter((h) => !(h.wr || []).length).length; if (hn) out.push({ i: 'pin', t: `선생님 숙제 ${hn}개 끝내기`, a: hn * 200, act: 'hw' });
    if (unread.length) out.push({ i: 'news', t: `소식 ${Math.min(3, unread.length)}개 읽기`, a: Math.min(3, unread.length) * 50, act: 'news' });
    if (wLogs() < W_LOGMAX) out.push({ i: 'write', t: '오늘 학교에서 한 것 한 줄', a: 100, act: 'log' });
    return out.slice(0, 3);
  }
  function walletCard(cls) {
    const bal = wBal(), day = wDay(), pct = Math.min(100, Math.floor((bal / W_GOAL) * 100)), nx = wNext(), req = W().req;
    const shown = coinPend && coinShown != null ? coinShown : bal;
    return `<section class="card ${cls} wl-home link" data-wallet>
      <div class="wl-top"><div class="wl-ic">${ic('coin')}</div><div class="wl-b"><div class="eyebrow">말랑 용돈 · 1원 = 진짜 1원</div><b class="wl-bal num" data-wbal>${won(shown)}</b></div>
        <div class="wl-today"><span class="tiny">오늘 모은 돈</span><b class="num">${won(day)}</b><span class="tiny">하루 ${won(W_CAP)}까지</span></div></div>
      <div><div class="wl-bar"><span style="width:${Math.max(pct, bal > 0 ? 1.5 : 0)}%"></span></div>
        <div class="row between" style="margin-top:8px;gap:8px"><span class="tiny">${req ? `${ic('gift')} 선생님께 바꿔 달라고 했어요` : bal >= W_GOAL ? `${ic('party')} 5만원 모았어요! 눌러서 바꿔요` : '5만원이 되면 선생님이 진짜 돈으로 바꿔 줘요'}</span><span class="tiny num" style="flex:none"><b style="color:var(--t2)">${pct}%</b> / ${won(W_GOAL)}</span></div></div>
      ${TEACHER ? '' : !wLeft() ? `<div class="wl-capped">${ic('party')}<span>오늘은 다 모았어요, 내일 또 만나요</span></div>` : nx.length ? `<div><div class="eyebrow" style="margin-bottom:8px">지금 모을 수 있는 것</div><div class="wl-acts">${nx.map((x) => `<button class="wl-act" type="button" data-wact="${x.act}">${ic(x.i)}<span>${esc(x.t)}</span><b class="num">+${won(Math.min(x.a, wLeft()))}</b></button>`).join('')}</div></div>` : ''}
    </section>`;
  }
  function walletAct(a) {
    if (a === 'pomo') return openPomo();
    if (a === 'sci') return startTask('sci');
    if (a === 'hw') return go('hw');
    if (a === 'news') return newsSheet('all');
    if (a === 'wrong') { const q = todayWr(); if (q.length) { UI.tab = 'wrong'; UI.run = { kind: 'retry', id: q[0], queue: q.slice(1), back: 'wrong' }; render(); window.scrollTo(0, 0); } return; }
    if (a === 'log') { if (UI.run || UI.tab !== 'home') go('home'); const t = $('#ql-t'); if (t) { t.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'center' }); setTimeout(() => t.focus({ preventScroll: true }), 300); } }
  }
  function openWallet() { UI.run = { kind: 'wallet' }; render(); window.scrollTo(0, 0); }
  function walletRun() {
    const w = W(), bal = wBal(), rem = Math.max(0, W_GOAL - bal), pct = Math.min(100, Math.floor((bal / W_GOAL) * 100)), day = wDay(), st = wStreak(), eta = wEta();
    const shown = coinPend && coinShown != null ? coinShown : bal;
    const by = {}; for (const x of w.log) (by[x.date] = by[x.date] || []).push(x);
    const dates = Object.keys(by).sort().reverse();
    const dayBlock = (d) => { const L = by[d].slice().sort((a, b) => b.at - a.at), sum = L.reduce((a, x) => a + x.amt, 0); return `<div class="wl-day"><div class="row between"><b>${d === today() ? '오늘' : md(d)}</b><span class="num blue" style="font-weight:700">+${won(sum)}</span></div><div class="list">${L.map((x) => `<div class="li" style="padding:6px 0"><div class="body"><div class="t" style="font-size:14px;font-weight:500">${esc(x.why)}${x.bonus ? ' <span class="tag amber">보너스</span>' : ''}</div></div><span class="num wl-plus">+${won(x.amt)}</span></div>`).join('')}</div></div>`; };
    const paidRows = w.paid.slice().sort((a, b) => b.at - a.at);
    const ex = w.req ? `<div class="deep wl-req">${ic('gift')}<div><b>선생님께 바꿔 달라고 했어요</b><p style="margin:2px 0 0">${md(dateOf(w.req.at))}에 ${won(w.req.amt)}을 신청했어요. 선생님이 진짜 돈으로 주시면 여기서 빠져요</p></div></div>`
      : `<button class="btn ${bal >= W_GOAL ? 'primary' : ''} big block" id="wl-ex" type="button" ${bal >= W_GOAL && !TEACHER ? '' : 'disabled'}>${ic('cash')} ${bal >= W_GOAL ? '5만원 바꾸기' : `5만원 바꾸기 · 앞으로 ${won(rem)}`}</button>`;
    const teach = TEACHER ? `<section class="card c12"><div class="card-h"><h2>${ic('bank')} 선생님</h2><span class="tiny">학생은 이 칸이 안 보여요</span></div>
        <div class="row wrap" style="gap:12px;align-items:flex-end"><button class="btn ${w.req ? 'primary' : 'soft'} big" id="wl-pay" type="button" ${w.req || bal >= W_GOAL ? '' : 'disabled'} style="flex:1 1 220px">${w.req ? `${won(w.req.amt)} 지급 완료` : bal >= W_GOAL ? `${won(W_GOAL)} 지급 완료` : `지급 완료 · ${won(W_GOAL)}부터`}</button></div>
        <div class="wl-bonus"><div class="field" style="flex:1 1 120px;margin:0"><label>보너스 금액</label><input class="inp num" id="wl-ba" inputmode="numeric" placeholder="예) 500"></div><div class="field" style="flex:2 1 200px;margin:0"><label>이유</label><input class="inp" id="wl-bm" placeholder="예) 중간고사 수학 올랐어요"></div><button class="btn soft" id="wl-bonus" type="button" style="height:52px">${ic('gift')} 보너스 주기</button></div></section>` : '';
    return `<div class="qwrap wl-wrap">
      <div class="row between"><button class="btn sm" data-go="home" type="button">‹ 홈</button><span class="tag amber">1포인트 = 진짜 1원</span></div>
      <div><h1 class="h1" style="margin:4px 0 4px">말랑 용돈</h1><p class="sub" style="margin:0">공부한 만큼 쌓여요. 5만원이 되면 선생님이 진짜 돈으로 바꿔 줘요</p></div>
      <div class="grid">
      <section class="card c12 wl-hero"><img class="wl-coin" src="icons/${IC.cash}.svg" alt=""><span class="eyebrow">지금 모은 돈</span><b class="wl-bal num" data-wbal>${won(shown)}</b>
        <div class="wl-bar"><span style="width:${Math.max(pct, bal > 0 ? 1.5 : 0)}%"></span></div>
        <div class="wl-meta"><span>${rem ? `5만원까지 앞으로 <b>${won(rem)}</b>` : '<b>5만원을 다 모았어요!</b>'}</span><span class="num">${pct}%</span></div>
        <p class="tiny" style="margin:0">${rem && eta ? `지금 속도면 <b style="color:var(--t2)">${eta}쯤</b> 5만원이 돼요` : rem || w.req || TEACHER ? '' : '아래 버튼을 누르면 선생님께 알려요'}</p>
        ${ex}</section>
      <section class="card c12 wl-today"><div class="card-h"><h2>오늘</h2>${st ? `<span class="tag red">${ic('fire')} ${st}일 연속</span>` : ''}</div>
        <div class="row between" style="align-items:baseline"><b class="num" style="font-size:24px">${won(day)}</b><span class="tiny">하루 ${won(W_CAP)}까지</span></div>
        <div class="wl-bar sm" style="margin:10px 0 12px"><span style="width:${Math.min(100, (day / W_CAP) * 100)}%"></span></div>
        <p class="tiny" style="margin:0">${!wLeft() ? '오늘은 다 모았어요, 내일 또 만나요' : `오늘 최대 ${won(W_CAP)}까지 모을 수 있어요. ${won(wLeft())} 남았어요`}</p>
        <p class="tiny" style="margin:8px 0 0">${st >= 3 ? `연속 7일이 되면 보너스 1,000원이에요` : `3일 연속 공부하면 보너스 300원, 7일이면 1,000원이에요`}</p></section>
      <section class="card c12"><div class="card-h"><h2>이렇게 모아요</h2><span class="tiny">한 가지는 한 번만 쌓여요</span></div>
        <div class="list earn-grid">${EARN.map((x) => `<div class="li" style="padding:8px 0"><div class="ico">${ic(x.i)}</div><div class="body"><div class="t" style="font-size:15px">${esc(x.t)}</div>${x.d ? `<div class="d">${esc(x.d)}</div>` : ''}</div><span class="num wl-plus">${esc(x.a)}</span></div>`).join('')}</div></section>
      ${teach}
      <section class="card c12"><div class="card-h"><h2>모은 기록</h2><span class="tiny">${dates.length ? `${dates.length}일 동안 ${won(w.log.reduce((a, x) => a + x.amt, 0))}` : ''}</span></div>
        ${dates.length ? dates.slice(0, 7).map(dayBlock).join('') + (dates.length > 7 ? `<details class="hw-more"><summary>지난 기록 ${dates.length - 7}일 더 보기</summary>${dates.slice(7).map(dayBlock).join('')}</details>` : '') : `<div class="empty">${ic('coin')}<b>아직 모은 돈이 없어요</b><span>토마토 하나, 소식 하나부터 시작해요</span></div>`}</section>
      ${paidRows.length ? `<section class="card c12"><div class="card-h"><h2>진짜 돈으로 바꾼 기록</h2></div><div class="list">${paidRows.map((x) => `<div class="li" style="padding:8px 0"><div class="ico">${ic('cash')}</div><div class="body"><div class="t" style="font-size:15px">${won(x.amt)} 받았어요</div><div class="d">${md(dateOf(x.at))}${x.memo ? ' · ' + esc(x.memo) : ''}</div></div></div>`).join('')}</div></section>` : ''}
      </div></div>`;
  }
  // 학생 기기에서 올린 최신 지갑을 먼저 받아 와요 (선생님이 옛 기록 위에 덮어쓰지 않게)
  async function freshWallet() {
    try { const r = await rpc('univ_get', { p_student: U.who, p_code: U.key }); if (r && r._at && r.wallet && (r._at.wallet || 0) > ((S._at || {}).wallet || 0)) { S.wallet = r.wallet; S._at.wallet = r._at.wallet; } } catch (e) {}
  }
  function bindWallet() {
    const ex = $('#wl-ex'); if (ex) ex.onclick = () => {
      if (wBal() < W_GOAL || TEACHER) return;
      sheet(`<div class="wl-sh-ic">${ic('cash')}</div><h2 style="text-align:center">5만원을 진짜 돈으로 바꿀까요?</h2><p class="sub" style="text-align:center">선생님께 알려 드려요. 선생님이 주시면 ${won(W_GOAL)}이 지갑에서 빠져요</p><div class="pm-btns"><button class="btn big" data-x type="button">다음에</button><button class="btn primary big" id="wx-ok" type="button">바꿔 주세요</button></div>`, (el, close) => {
        $('[data-x]', el).onclick = close;
        $('#wx-ok', el).onclick = async () => { await freshWallet(); W().req = { at: Date.now(), amt: W_GOAL }; save('wallet'); close(); render(); boom(innerWidth / 2, innerHeight * 0.35, 4); ding(6); toast('선생님께 바꿔 달라고 했어요'); };
      });
    };
    const pay = $('#wl-pay'); if (pay) pay.onclick = () => {
      const amt = (W().req && W().req.amt) || W_GOAL;
      sheet(`<h2>${won(amt)}을 줬나요?</h2><p class="sub">「지급 완료」를 누르면 ${esc(U.who)}의 지갑에서 ${won(amt)}이 빠지고, 바꾼 기록에 남아요</p><div class="pm-btns"><button class="btn big" data-x type="button">아직이요</button><button class="btn primary big" id="wp-ok" type="button">지급 완료</button></div>`, (el, close) => {
        $('[data-x]', el).onclick = close;
        $('#wp-ok', el).onclick = async () => { await freshWallet(); const w = W(); const a = (w.req && w.req.amt) || W_GOAL; w.paid.push({ at: Date.now(), amt: a, memo: '선생님이 진짜 돈으로 바꿔 줬어요' }); w.req = null; save('wallet'); close(); render(); toast(`${won(a)} 지급 완료로 적었어요`); };
      });
    };
    const bb = $('#wl-bonus'); if (bb) bb.onclick = async () => {
      const a = Math.round(+String($('#wl-ba').value).replace(/[^\d]/g, '')), m = $('#wl-bm').value.trim();
      if (!a || a < 1 || a > 50000) { $('#wl-ba').focus(); toast('금액을 숫자로 넣어 주세요'); return; }
      await freshWallet();
      earn('bonus:' + Date.now(), a, m ? `선생님 보너스 · ${m}` : '선생님 보너스', { bonus: true, teacher: true, from: bb }); render();
    };
  }

  // ───────── 틀 · 메뉴 ─────────
  const TABS = [['home', '홈', 'home'], ['hw', '숙제', 'hw'], ['wrong', '오답', 'wrong'], ['book', '교과서', 'books'], ['score', '성적', 'score'], ['sgb', '생기부', 'sgb'], ['picks', '진로', 'dna'], ['news', '소식', 'news']];
  function nav() {
    const bm = Object.values(bkS().marks), cnt = { hw: leftItems().length, wrong: todayWr().length, book: TEACHER ? bm.filter((m) => m.q && !m.ans).length : bm.filter((m) => m.q && m.ans && !m.ansSeen).length };
    const btn = (t, bottom) => `<button type="button" class="${UI.tab === t[0] ? 'on' : ''}" data-go="${t[0]}">${bottom ? `<img src="icons/${IC[t[2]]}.svg" alt="">` : ''}${t[1]}${cnt[t[0]] ? `<span class="cnt">${cnt[t[0]] > 99 ? '99+' : cnt[t[0]]}</span>` : ''}</button>`;
    $('#tabs-top').innerHTML = TABS.map((t) => btn(t, false)).join('');
    const tb = $('#tabs-bottom'), sl = tb.scrollLeft; tb.innerHTML = TABS.map((t) => btn(t, true)).join(''); tb.scrollLeft = sl;
    const on = $('button.on', tb); if (on && (on.offsetLeft < tb.scrollLeft || on.offsetLeft + on.offsetWidth > tb.scrollLeft + tb.clientWidth)) tb.scrollTo({ left: on.offsetLeft - (tb.clientWidth - on.offsetWidth) / 2, behavior: RM() ? 'auto' : 'smooth' });
    const u = uniOf(S.profile.uni);
    const bt = $('#bell-top'); if (bt) { bt.innerHTML = bellSVG(SOUND); bt.classList.toggle('on', SOUND); bt.setAttribute('aria-label', SOUND ? '소리 켜짐, 눌러서 무음' : '무음, 눌러서 소리 켜기'); }
    const ct = $('#coin-top'); if (ct) { if (!coinPend) coinShown = wBal(); ct.innerHTML = `${ic('coin')}<b class="num">${won(coinShown)}</b>`; ct.setAttribute('aria-label', `말랑 용돈 ${won(coinShown)}`); ct.classList.toggle('on', UI.run && UI.run.kind === 'wallet'); }
    const pt = $('#pomo-top'); if (pt) { const n = pDay().n; pt.innerHTML = `${ic('tomato')}<b class="num">${n}</b>`; pt.classList.toggle('on', !!n); pt.setAttribute('aria-label', `토마토 타이머 · 오늘 ${n}개`); }
    $('#me').innerHTML = `<span>${esc(S.profile.name)}${TEACHER ? ' · 선생님 보기' : ''}</span>${avatarHtml('sm')}`;
  }
  const main = $('#main');

  // 실루엣: 카드는 흰 그대로 두고, 글줄·아이콘·단추 자리만 재서 둥근 회색 막대로 그려요
  function skelPaint(main) {
    $('.skel-ov', main)?.remove();
    const base = main.getBoundingClientRect(), H = innerHeight + 120, bars = [];
    const add = (r, rad, k) => { if (r.width < 3 || r.height < 3 || r.bottom < 0 || r.top > H || bars.length > 500) return; bars.push(`<i class="${k || ''}" style="left:${r.left - base.left}px;top:${r.top - base.top}px;width:${r.width}px;height:${r.height}px;border-radius:${rad}"></i>`); };
    const cards = $$('.card', main), rg = document.createRange();
    cards.forEach((c) => {
      $$('img, svg, canvas, .ic, .avatar, .logo', c).forEach((e) => { if (e.closest('.skel-skip')) return; const r = e.getBoundingClientRect(); add(r, Math.abs(r.width - r.height) < 4 && r.width < 64 ? '50%' : '10px'); });
      $$('button, .btn, .chip, input, select, textarea', c).forEach((e) => { const r = e.getBoundingClientRect(); if (r.height < 60) add(r, getComputedStyle(e).borderRadius, 'ghost'); });
      const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.nodeValue.trim() && !n.parentElement.closest('button, .btn, .chip, svg, style, script') ? 1 : 2 });
      for (let n; (n = w.nextNode()); ) { rg.selectNodeContents(n); for (const r of rg.getClientRects()) { const h = Math.min(r.height * 0.62, 18); add({ left: r.left, top: r.top + (r.height - h) / 2, width: r.width, height: h, right: r.right, bottom: r.bottom }, '6px'); } }
    });
    main.insertAdjacentHTML('beforeend', `<div class="skel-ov" aria-hidden="true">${bars.join('')}</div>`);
  }
  function render() {
    // 1학년 2학기는 아직 학기 최종 등급이 없어서, 먼저 넣은 등급은 중간고사 등급으로 옮겨요 (한 번만)
    if (S.naesin && S.naesin['1-2'] && !S.naesin._mid12) { for (const r of Object.values(S.naesin['1-2'])) if (r && r.grade && r.midG == null && r.finG == null) { r.midG = r.grade; delete r.grade; } S.naesin._mid12 = 1; save('naesin'); }
    nav();
    let html = '';
    syncGoals();
    redoFix();
    if (UI.run) html = UI.run.kind === 'sci' ? sciRun() : UI.run.kind === 'unit' ? unitRun() : UI.run.kind === 'words' ? wordsRun() : UI.run.kind === 'retry' ? retryRun() : UI.run.kind === 'g3' ? g3Run() : UI.run.kind === 'drill' ? drillRun() : UI.run.kind === 'concept' ? conceptRun() : UI.run.kind === 'pomo' ? pomoRun() : UI.run.kind === 'wallet' ? walletRun() : UI.run.kind === 'book' ? bookRun() : '';
    else html = UI.tab === 'home' ? home() : UI.tab === 'hw' ? (UI.lib ? libView() : hwView()) : UI.tab === 'wrong' ? wrongView() : UI.tab === 'score' ? scoreView() : UI.tab === 'me' ? meView() : UI.tab === 'picks' ? picksView() : UI.tab === 'news' ? newsView() : UI.tab === 'book' ? bookView() : sgbView();
    // 화면 이동 방향: 문제·상세로 들어가면 오른쪽에서, 나오면 왼쪽에서, 탭은 탭 순서대로
    const view = UI.run ? 'run:' + UI.run.kind : UI.tab + (UI.lib || '') + (UI.tab === 'picks' ? UI.pkTab || '' : '') + (UI.tab === 'score' ? UI.scoreSeg + (UI.mockId || '') : '');
    const depth = UI.run ? 2 : UI.lib || (UI.tab === 'score' && UI.mockId) ? 1 : 0, ti = TABS.findIndex((t) => t[0] === UI.tab);
    const qm = html.match(/class="q-no">([\s\S]*?)<\/div>/), qk = UI.run ? (qm ? qm[1] : html.includes('done-card') ? 'done' : html.includes('class="lesson"') ? 'lesson' : '') : '';
    const sub = [UI.wrongSubj, UI.sgbArea, UI.semester, UI.chartSubj, UI.mockSubj].join('|');
    let dir = '';
    if (view !== render.view) dir = render.view == null ? 'boot' : depth > render.depth ? 'push' : depth < render.depth ? 'pop' : ti !== render.ti ? ((ti < 0 ? 9 : ti) > (render.ti < 0 ? 9 : render.ti) ? 'tabR' : 'tabL') : 'side';
    else if (qk && render.qk && qk !== render.qk) dir = 'push';
    if (dir === 'push' || dir === 'pop') ghost(dir);
    main.classList.remove('enter', 'soft', 'boot', 'push', 'pop', 'tabL', 'tabR', 'side');
    main.innerHTML = (TEACHER ? `<div class="teacher-band">선생님 보기 · ${esc(U.who)}의 기록을 보고 고칠 수 있어요</div>` : '') + html;
    // 탭·칸 바꿀 때는 밀지 않고, 카드 자리만 회색 실루엣으로 잠깐 보였다가 내용이 스르륵 떠요
    if (dir === 'side' || dir === 'tabL' || dir === 'tabR') { dir = ''; if (!RM()) { clearTimeout(render.sk); main.classList.remove('skel-out'); skelPaint(main); main.classList.add('skel'); render.sk = setTimeout(() => { main.classList.remove('skel'); $('.skel-ov', main)?.remove(); main.classList.add('skel-out'); setTimeout(() => main.classList.remove('skel-out'), 260); }, 280); } if (view !== render.view) cheerCheck.combo = 0; setTimeout(() => countUp(main), 300); }
    if (dir) { $$('main .card, main .h1, main .sub, main .seg, main .chips').forEach((c, i) => c.style.setProperty('--i', Math.min(i, 10))); void main.offsetWidth; main.classList.add('enter', dir); if (view !== render.view) cheerCheck.combo = 0; setTimeout(() => countUp(main), dir === 'boot' ? 260 : 120); }
    else if (sub !== render.sub) { void main.offsetWidth; main.classList.add('soft'); }
    Object.assign(render, { view, depth, ti, qk, sub });
    bind();
    segSlide();
    cheerCheck();
    startReads(main);
    walletScan();
  }
  // 나가는 화면: 지금 내용을 그대로 떼어 위에 띄운 채 옆으로 밀어 내요
  function ghost(dir) {
    if (RM() || !main.firstChild) return;
    const r = main.getBoundingClientRect(), g = document.createElement('div');
    g.className = 'main page-ghost ' + dir; g.setAttribute('aria-hidden', 'true'); g.style.top = r.top + 'px';
    while (main.firstChild) g.appendChild(main.firstChild);
    document.body.appendChild(g); setTimeout(() => g.remove(), 320);
  }
  // 같은 화면 안에서 세그먼트·칩을 바꿨을 때: 고른 칸이 오른쪽이면 +1
  function segDir() {
    const sg = $('main .seg, main .pk-tabs'); if (!sg || !segSlide.m) return 1;
    const on = sg.querySelector('button.on'), fr = segSlide.m[segKey(sg)];
    return on && fr && on.offsetLeft < fr.x ? -1 : 1;
  }
  // 큰 숫자는 0부터 세어 올라가요 (토스 금액처럼)
  function countUp(root) {
    if (RM()) return;
    $$(':is(.done-score b, .arch .c b, .scorebox b, .stat-row b, .sgb-area .a b)', root).forEach((el) => {
      const t = [...el.childNodes].find((n) => n.nodeType === 3 && /\d/.test(n.nodeValue)); if (!t || el.closest('.page-ghost') || /등급/.test(el.parentNode.textContent)) return;  // 등급은 0부터 세면 이상해요
      if (el.dataset.cu) return; // 이미 세는 중이거나 센 숫자 — 다시 세면 중간값을 끝값으로 읽어요
      const m = t.nodeValue.match(/^(\s*)(\d+(?:\.\d+)?)(?![\d,])([\s\S]*)$/); if (!m || !+m[2]) return;
      el.dataset.cu = '1';
      const end = +m[2], dec = (m[2].split('.')[1] || '').length, t0 = performance.now(), D = 650;
      const step = (now) => { const k = Math.min(1, (now - t0) / D); t.nodeValue = m[1] + (end * (1 - Math.pow(1 - k, 3))).toFixed(dec) + m[3]; if (k < 1 && t.isConnected) requestAnimationFrame(step); };
      t.nodeValue = m[1] + (0).toFixed(dec) + m[3]; requestAnimationFrame(step); setTimeout(() => { if (t.isConnected) t.nodeValue = m[1] + m[2] + m[3]; }, D + 150); // 탭이 가려져 그리기가 멈춰도 끝값은 꼭
    });
  }
  function go(tab) { UI.tab = tab; UI.run = null; UI.lib = null; if (tab !== 'score') UI.mockId = null; render(); window.scrollTo(0, 0); }
  function startTask(k) {
    if (k === 'sci') { UI.tab = 'hw'; UI.run = { kind: 'sci' }; }
    else if (k === 'unit') { UI.tab = 'hw'; UI.run = { kind: 'unit' }; }
    else if (k === 'words') { UI.tab = 'hw'; UI.run = { kind: 'words' }; }
    else if (k === 'g3') { UI.tab = 'hw'; UI.run = { kind: 'g3' }; }
    else if (k.startsWith('news:')) return newsSheet(k.slice(5));
    else if (k.startsWith('ink:')) { const [, c, n] = k.split(':'); return inkLec(c, n); }
    else if (k.startsWith('drill:')) { UI.tab = 'hw'; UI.run = { kind: 'drill', id: k.slice(6) }; }
    else { UI.tab = 'hw'; UI.run = null; }
    render(); window.scrollTo(0, 0);
  }
  function bind() {
    $$('[data-go]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); if (b.dataset.seg) UI.scoreSeg = b.dataset.seg; go(b.dataset.go); }));
    $$('[data-goalset]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); goalSheet(); }));
    $$('[data-task]').forEach((b) => (b.onclick = () => startTask(b.dataset.task)));
    $$('#ink-set, [data-inkset]').forEach((b) => (b.onclick = inkSettings));
    $$('[data-news]').forEach((b) => (b.onclick = () => newsSheet(b.dataset.news)));
    $$('[data-day]').forEach((b) => (b.onclick = () => daySheet(b.dataset.day)));
    $$('#w-sched').forEach((b) => (b.onclick = () => schedSheet()));
    $$('[data-kopen]').forEach((b) => (b.onclick = () => { const [k, r] = b.dataset.kopen.split('|'); openKept(k, r); }));
    $$('[data-nf]').forEach((b) => (b.onclick = () => { UI.newsF = b.dataset.nf; render(); }));
    $$('[data-cs]').forEach((b) => (b.onclick = () => { UI.chartSubj = b.dataset.cs; render(); }));
    const h = $('#hero'); if (h) h.onclick = uniSheet;
    if (!UI.run && UI.tab === 'me') bindMe();
    if (!UI.run && UI.tab === 'picks') bindPicks();
    $$('[data-seg]').forEach((b) => { if (!b.dataset.go) b.onclick = () => { UI.scoreSeg = b.dataset.seg; UI.mockId = null; render(); }; });
    $$('[data-mock]').forEach((b) => (b.onclick = () => { UI.mockId = b.dataset.mock; render(); window.scrollTo(0, 0); }));
    $$('[data-mdel]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); S.mockManual = (S.mockManual || []).filter((x) => x.id !== b.dataset.mdel); save('mockManual'); render(); }));
    const ma = $('#mk-add'); if (ma) ma.onclick = () => quickGradeSheet('__new');
    $$('#qg-open').forEach((b) => (b.onclick = () => quickGradeSheet()));
    $$('[data-ws]').forEach((b) => (b.onclick = () => { UI.wrongSubj = b.dataset.ws; render(); }));
    $$('[data-wr]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'retry', id: b.dataset.wr, queue: [] }; render(); window.scrollTo(0, 0); }));
    const wt = $('#wr-today'); if (wt) wt.onclick = () => { const q = todayWr(); if (q.length) { UI.run = { kind: 'retry', id: q[0], queue: q.slice(1), back: 'wrong' }; render(); window.scrollTo(0, 0); } };
    const wa = $('#wr-all'); if (wa) wa.onclick = () => { const ids = openWrong().filter((w) => UI.wrongSubj === 'all' || w.subj === UI.wrongSubj).map((w) => w.id); if (ids.length) { UI.run = { kind: 'retry', id: ids[0], queue: ids.slice(1) }; render(); window.scrollTo(0, 0); } };
    const ha = $('#hw-add'); if (ha) ha.onclick = hwAddSheet;
    const po = $('#plan-open'); if (po) po.onclick = planSheet;
    $$('[data-hwopen]').forEach((b) => (b.onclick = () => hwSheet(b.dataset.hwopen)));
    $$('[data-hwdone]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const x = S.hw.find((h) => h.id === b.dataset.hwdone); x.done = !x.done; x.doneAt = Date.now(); save('hw'); render(); if (x.done) toast('잘했어요'); }));
    $$('[data-hwdel]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); S.hw = S.hw.filter((h) => h.id !== b.dataset.hwdel); save('hw'); render(); }));
    $$('[data-sa]').forEach((b) => (b.onclick = () => { UI.sgbArea = b.dataset.sa; render(); }));
    const sn = $('#sg-new'); if (sn) sn.onclick = () => sgbSheet(null);
    $$('#sg-pick, #sg-pick2').forEach((b) => (b.onclick = () => pickSheet(UI.sgbArea)));
    $$('[data-sg]').forEach((b) => (b.onclick = () => sgbSheet(b.dataset.sg)));
    if (UI.run) { if (UI.run.kind === 'sci') bindSci(); if (UI.run.kind === 'unit') bindUnit(); if (UI.run.kind === 'words') bindWords(); if (UI.run.kind === 'retry') bindRetry(); if (UI.run.kind === 'g3') bindG3(); if (UI.run.kind === 'drill') bindDrill(); if (UI.run.kind === 'concept') bindConcept(); if (UI.run.kind === 'book') bindBook(); if (UI.run.kind === 'pomo') { bindPomo(); bindSound(); } }
    $$('main [data-bell]').forEach((b) => (b.onclick = toggleBell));
    $$('[data-pomo]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); openPomo(); }));
    $$('main [data-wallet]').forEach((b) => (b.onclick = openWallet));
    $$('[data-wact]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); walletAct(b.dataset.wact); }));
    if (UI.run && UI.run.kind === 'wallet') bindWallet();
    pPaint();
    $$('[data-lib]').forEach((b) => (b.onclick = () => { UI.lib = b.dataset.lib || null; UI.run = null; UI.tab = 'hw'; render(); window.scrollTo(0, 0); }));
    $$('[data-lu]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'unit', ref: +b.dataset.lu, back: 'lib' }; render(); window.scrollTo(0, 0); }));
    $$('[data-lc]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'concept', cid: b.dataset.lc }; render(); window.scrollTo(0, 0); }));
    $$('[data-lw]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'words', day: +b.dataset.lw }; render(); window.scrollTo(0, 0); }));
    $$('[data-lg]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'g3', lib: +b.dataset.lg }; render(); window.scrollTo(0, 0); }));
    const da = $('#dr-add'); if (da) da.onclick = drillAddSheet;
    $$('[data-drdel]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); S.drills = (S.drills || []).filter((x) => x.id !== b.dataset.drdel); save('drills'); render(); }));
    if (!UI.run && UI.tab === 'home') bindQlog();
    $$('[data-ins]').forEach((b) => (b.onclick = () => doInsight(b.dataset.ins)));
    const pk = $('#pk-all'); if (pk) pk.onclick = picksSheet;
    const ad = $('#ad-all'); if (ad) ad.onclick = admitSheet;
    const sca = $('#sc-all'); if (sca) sca.onclick = schedSheet;
    const scd = $('#sc-add'); if (scd) scd.onclick = () => myEventSheet(null, UI.calSel);
    $$('main [data-me-ev]').forEach((b) => (b.onclick = () => myEventSheet(b.dataset.meEv)));
    $$('[data-cd]').forEach((b) => (b.onclick = () => { const st = $('#cal-strip'), x = st ? st.scrollLeft : 0; UI.calSel = b.dataset.cd; render(); const st2 = $('#cal-strip'); if (st2) { st2.scrollLeft = x; const se = $('.cal-d.sel', st2); if (se) { const l = se.offsetLeft - st2.offsetLeft; if (l < st2.scrollLeft || l + se.offsetWidth > st2.scrollLeft + st2.clientWidth) st2.scrollTo({ left: l, behavior: 'smooth' }); } } }));
    $$('main [data-du]').forEach((b) => (b.onclick = () => uniDetail(b.dataset.du)));
    $$('[data-pk]').forEach((b) => (b.onclick = () => { const [k, i] = b.dataset.pk.split(':'); pickDetail(k, +i); }));
    if (!UI.run && UI.tab === 'sgb') bindLogs();
    if (!UI.run && UI.tab === 'score') { if (UI.scoreSeg === 'mock' && UI.mockId) bindMock(); if (UI.scoreSeg === 'naesin') bindNaesin(); }
  }
  $('#brand').onclick = () => go('home');
  let rsT = 0, lastW = window.innerWidth; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (Math.abs(window.innerWidth - lastW) > 80 && !$('.sheet')) { lastW = window.innerWidth; render(); } }, 250); });
  $('#me').onclick = () => go('me');
  $('#pomo-top').onclick = openPomo;
  $('#coin-top').onclick = openWallet;
  $('#bell-top').onclick = toggleBell;

  // ───────── 세그먼트 · 칩: 고른 칸으로 미끄러지기 ─────────
  // 다시 그리면 DOM이 새로 생겨서, 이전 자리를 기억해 두었다가 거기서 새 자리로 옮겨요
  // 위 탭 · 아래 탭바 · 세그먼트 · 한 개만 고르는 칩 줄 모두 같은 방식이에요. 가로로 넘기는 줄은 넘긴 자리도 기억해요
  const SEG_SEL = '#tabs-top, #tabs-bottom, main .seg, main .pk-tabs, main .chips, .sheet .chips';
  const segKey = (sg) => (sg.id || (UI.run ? 'run' : UI.tab)) + ':' + (sg.id ? '' : [...sg.querySelectorAll('button')].map((b) => b.textContent).join('|'));
  const segOk = (sg) => sg.id || !sg.matches('.chips') || !sg.matches('.multi') && sg.matches('.pk-tabs') || sg.querySelectorAll(':scope > .chip.on').length === 1 && sg.querySelectorAll(':scope > .chip').length > 1;
  const segPut = (ind, p) => { ind.style.transform = `translate(${p.x}px,${p.y}px)`; ind.style.width = p.w + 'px'; ind.style.height = p.h + 'px'; };
  const segAt = (on) => ({ x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight });
  function segSlide(root = document) {
    segSlide.m = segSlide.m || {};
    $$(SEG_SEL, root).forEach((sg) => {
      const on = sg.querySelector(':scope > button.on'); if (!on || !segOk(sg) || sg.querySelector(':scope > .seg-ind')) return;
      const key = segKey(sg), fr = segSlide.m[key];
      if (fr && fr.sl) sg.scrollLeft = fr.sl;
      const ind = document.createElement('i'); ind.className = 'seg-ind'; sg.prepend(ind); sg.classList.add('slid');
      const to = segAt(on); to.sl = sg.scrollLeft;
      segPut(ind, fr || to); segSlide.m[key] = to;
      if (sg.scrollWidth > sg.clientWidth + 2 && (to.x < sg.scrollLeft || to.x + to.w > sg.scrollLeft + sg.clientWidth)) sg.scrollTo({ left: to.x - 16, behavior: RM() ? 'auto' : 'smooth' });
      if (fr && (fr.x !== to.x || fr.y !== to.y || fr.w !== to.w) && !RM()) { on.classList.add('pre'); requestAnimationFrame(() => requestAnimationFrame(() => { ind.classList.add('go'); segPut(ind, to); on.classList.remove('pre'); })); }
    });
  }
  // 그 자리에서 on 만 바꾼 줄: 표시를 새 칸으로 옮겨요
  function segRe(sg) { const ind = sg.querySelector(':scope > .seg-ind'); if (ind) ind.remove(); sg.classList.remove('slid'); segSlide(sg.parentNode); }
  // 창 크기 · 글꼴이 바뀌면 자리만 다시 맞춰요 (움직임 없이)
  function segFix() { $$('.slid').forEach((sg) => { const on = sg.querySelector(':scope > button.on'), ind = sg.querySelector(':scope > .seg-ind'); if (!on || !ind) return; ind.classList.remove('go'); const p = segAt(on); p.sl = sg.scrollLeft; segPut(ind, p); segSlide.m[segKey(sg)] = p; }); }
  let sfT = 0; window.addEventListener('resize', () => { cancelAnimationFrame(sfT); sfT = requestAnimationFrame(segFix); });
  if (document.fonts) document.fonts.ready.then(segFix);
  document.addEventListener('scroll', (e) => { const sg = e.target; if (sg.classList && sg.classList.contains('slid') && segSlide.m) { const p = segSlide.m[segKey(sg)]; if (p) p.sl = sg.scrollLeft; } }, true);

  new MutationObserver(() => requestAnimationFrame(() => segSlide($('#sheet-root')))).observe($('#sheet-root'), { childList: true, subtree: true });
  // ───────── 누른 것 톡 · 접는 칸 스르륵 ─────────
  // 다시 그려도 같은 칸을 찾아서, 새로 고른 칸·완료 동그라미·보기 정답(톡)/오답(흔들)을 움직여요
  const tapSel = (b) => { if (b.id) return '#' + CSS.escape(b.id); const a = [...b.attributes].find((x) => x.name.startsWith('data-')); return a ? `[${a.name}="${CSS.escape(a.value)}"]` : ''; };
  const bump = (n, cls) => { n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); n.addEventListener('animationend', () => n.classList.remove(cls), { once: true }); };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button, [data-hwopen], .li.btnlike'); tap.el = b; tap.at = Date.now();
    if (!b || RM()) return; const sel = tapSel(b); if (!sel) return;
    setTimeout(() => {
      const n = b.isConnected && !b.closest('.page-ghost') ? b : $('main ' + sel) || $('#sheet-root ' + sel); if (!n || n.closest('.slid')) return;
      if (n.matches('.choice.wrong')) bump(n, 'shake-x');
      else if (n.matches('.choice.right, .on, .sel, [data-hwdone], .pk-it')) bump(n, 'tap-pop');
    }, 0);
  }, true);
  document.addEventListener('click', (e) => {
    const s = e.target.closest('details > summary'); if (!s || RM()) return;
    const d = s.parentElement; e.preventDefault(); if (d._anim) return;
    const h0 = d.offsetHeight, opening = !d.open; if (opening) d.open = true;
    const h1 = opening ? d.offsetHeight : s.offsetHeight;
    d.style.overflow = 'hidden';
    d._anim = d.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: opening ? 320 : 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
    [...d.children].filter((c) => c !== s).forEach((c) => c.animate(opening ? [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }] : [{ opacity: 1 }, { opacity: 0 }], { duration: opening ? 320 : 180, easing: 'ease-out' }));
    d._anim.onfinish = () => { d._anim = null; d.style.overflow = ''; if (!opening) d.open = false; };
  });

  // ───────── 정답 축하 (팡팡) ─────────
  // 화면에 「정답이에요」가 새로 뜨면 터뜨려요. 연속으로 맞히면 점점 크게
  const CHEER2 = ['좋아요!', '정확해요!', '센스 있어요!', '바로 그거예요!', '완벽해요!'];
  function cheerCheck() {
    const dc = $('main .done-card');
    if (dc && !cheerCheck.done) { $$('.combo-pop').forEach((x) => x.remove()); dc.classList.add('in'); setTimeout(() => countUp(dc), 200); const lv = +dc.dataset.done, r = $('.done-ic', dc).getBoundingClientRect(); if (lv) { boom(r.left + r.width / 2, r.top + r.height / 2, lv === 2 ? 5 : 2); ding(lv === 2 ? 8 : 3); } }
    cheerCheck.done = !!dc;
    const v = $('main .verdict'); const was = cheerCheck.had; cheerCheck.had = !!v;
    if (!v || was) return;
    if (!v.classList.contains('ok')) { cheerCheck.combo = 0; v.classList.add('shake'); return; }
    const c = (cheerCheck.combo = (cheerCheck.combo || 0) + 1);
    const r = v.getBoundingClientRect();
    boom(r.left + 40, r.top + r.height / 2, c);
    const sp = v.querySelector('span'); if (sp) sp.textContent = c >= 2 ? `${c}연속 정답! ${CHEER2[Math.min(c - 2, CHEER2.length - 1)]}` : '정답이에요!';
    if (c >= 3) { $$('.combo-pop').forEach((x) => x.remove()); const b = document.createElement('div'); b.className = 'combo-pop'; b.innerHTML = `${ic('fire')}<b>${c} COMBO</b>`; document.body.appendChild(b); setTimeout(() => b.remove(), 1400); }
    if (navigator.vibrate) navigator.vibrate(c >= 3 ? [30, 40, 30] : 25);
    ding(c);
  }
  function ding(c) {
    if (!SOUND) return;
    try {
      const A = ding.a || (ding.a = new (window.AudioContext || window.webkitAudioContext)());
      [523, 659, 784, 1047].slice(0, Math.min(2 + Math.floor(c / 2), 4)).forEach((f, i) => {
        const o = A.createOscillator(), g = A.createGain(), t = A.currentTime + i * 0.07;
        o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.connect(g).connect(A.destination); o.start(t); o.stop(t + 0.3);
      });
    } catch (e) {}
  }
  function boom(x, y, power = 1) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.createElement('canvas'); cv.className = 'boom'; const dpr = devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; document.body.appendChild(cv);
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const COL = ['#3182f6', '#ffc342', '#ff6b8b', '#2ec27e', '#a77bff', '#ff8a3d'];
    const P = []; const add = (cx, cy, n, sp) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random()); P.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.5, r: 4 + Math.random() * 5, c: COL[i % COL.length], s: Math.random() < 0.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 1 }); } };
    const n = Math.min(40 + power * 15, 110);
    add(x, y, n, 9 + power);  // 팡
    setTimeout(() => add(innerWidth / 2, innerHeight * 0.35, Math.round(n * 0.8), 11 + power), 160);  // 팡!
    if (power >= 3) setTimeout(() => { add(innerWidth * 0.2, innerHeight * 0.3, 40, 10); add(innerWidth * 0.8, innerHeight * 0.3, 40, 10); }, 320);
    const t0 = performance.now();
    (function tick(t) {
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of P) { p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.009;
        g.globalAlpha = Math.max(p.life, 0); g.fillStyle = p.c; g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        if (p.s) g.fillRect(-p.r, -p.r / 2.5, p.r * 2, p.r / 1.25); else { g.beginPath(); g.arc(0, 0, p.r / 1.6, 0, 7); g.fill(); } g.restore(); }
      if (t - t0 < 2200) requestAnimationFrame(tick); else cv.remove();
    })(t0);
  }

  // ───────── 시작 ─────────
  window.__univStarted = true;
  if (!TEACHER && !W().since) { W().since = Date.now(); walletScan(true); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  document.body.classList.add('booting'); setTimeout(() => document.body.classList.remove('booting'), 1200);
  render();
  // 새 버전이 올라오면 알아서 바뀌어요: 앱으로 돌아올 때와 10분마다 확인하고, 푸는 중이 아니면 바로 새로 고쳐요
  (function autoUpdate() {
    const cur = (document.querySelector('link[href*="app.css?v="]') || {}).href?.match(/v=(\d+)/)?.[1]; if (!cur) return;
    let pending = false;
    const safe = () => !UI.run && !$('.sheet') && !P.run && ![...document.querySelectorAll('audio')].some((a) => !a.paused) && !document.activeElement?.matches('input, textarea');
    const apply = () => { if (!pending) return; if (safe()) location.reload(); };
    const check = async () => {
      if (pending) return apply();
      try { const h = await (await fetch('./?t=' + Date.now(), { cache: 'no-store' })).text(); const v = h.match(/app\.css\?v=(\d+)/)?.[1]; if (v && v !== cur) { pending = true; if (!safe()) toast('새 버전이 있어요 · 끝나면 알아서 바뀌어요'); apply(); } } catch (e) {}
    };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    setInterval(check, 10 * 60 * 1000); setTimeout(check, 15000);
    setInterval(apply, 20000);
  })();
  if (P.run) pLoop();
  // 첫 화면: 유령이 쑝 하고 나오는 걸 끝까지 보고 들어가요 (세션마다 한 번만)
  const sp = $('#splash'); if (sp) { let first = true; try { first = !sessionStorage.getItem('mu:sp'); sessionStorage.setItem('mu:sp', '1'); } catch (e) {} const wait = first && !RM() ? Math.max(0, 1900 - (Date.now() - (window.__t0 || 0))) : 0; setTimeout(() => { sp.classList.add('out'); setTimeout(() => sp.remove(), 320); }, wait); }
  const bm = $('#boot-msg'); if (bm) bm.remove();
  if (!S.profile.uni && !TEACHER) setTimeout(uniSheet, 600);
  sync(true);
  setInterval(() => sync(true), 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(true); });
  // 선생님 보기에서 테마 확인용: ?theme=dark
})();
