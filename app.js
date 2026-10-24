/* 말랑대학 — 고1 정윤 대시보드 (숙제 · 오답 · 성적 · 생기부 · 입시 소식)
   기록은 서버(univ_get/univ_put)에 학생 이름으로 저장하고, 이 기기에도 같이 둡니다.
   화면 결은 토스 앱: 회색 바탕 · 흰 카드 · 파랑 하나. 화면 글자에 줄표를 쓰지 않습니다. */
(() => {
  const U = window.UNIV, D = U.data || {};
  const TEACHER = U.role === 'teacher' || U.role === 'admin';
  const KEY = 'mallang-univ:state:' + U.who;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IC = { home: '1f3e0', hw: '1f4dd', wrong: '1f4d2', score: '1f4ca', sgb: '1f4cb', target: '1f3af', sci: '1f9ea', eng: '1f4d6', fire: '1f525', x: '274c', ok: '2705', up: '1f4c8', down: '1f4c9', star: '2b50', trophy: '1f3c6', cal: '1f4c5', retry: '1f501', bulb: '1f4a1', school: '1f3eb', grad: '1f393', ghost: '1f47b', party: '1f389', pin: '1f4cc', compass: '1f9ed', muscle: '1f4aa', brain: '1f9e0', clock: '23f0', hundred: '1f4af', think: '1f914', spark: '2728', mic: '1f3a4', books: '1f4da', pencil: '270f', write: '270d', dna: '1f9ec', pill: '1f48a', news: '1f4f0', bell: '1f514', mega: '1f4e2', memo: '1f5d2', flag: '1f6a9', q: '2753', globe: '1f30f', math: '1f4d0', abacus: '1f9ee', bank: '1f3db', run: '1f3c3', heart: '1f499', medal: '1f3c5', eyes: '1f440', scroll: '1f4dc' };
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
  const hwNow = () => (S.hw || []).filter((h) => !h.done && (!h.due || h.due <= today()));
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
    { id: 'skku', name: '성균관대학교', short: '성균관대', color: '#2b5d3a', pharm: true },
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
  const blank = () => ({ profile: { name: U.who, school: (D.school && D.school.name) || '경화여자고등학교', grade: 1, cls: '', uni: '', major: '생명공학과', goalMock: 2, goalNaesin: 2 }, mock: {}, mockManual: [], naesin: {}, sci: { days: {} }, eng: { unit: 0, wordDay: 0, days: {} }, wrong: {}, hw: [], sgb: [], _at: {} });
  let S = blank();
  try { const l = JSON.parse(localStorage.getItem(KEY)); if (l) S = Object.assign(blank(), l); } catch (e) {}
  const UI = { tab: 'home', view: null, scoreSeg: 'mock', mockId: null, mockSubj: 'kor', wrongSubj: 'all', chartSubj: 'avg', run: null, sgbArea: 'all', semester: '1-2', newsAll: false };
  let pushT = null;
  function save(...keys) {
    const now = Date.now(); S._at = S._at || {}; for (const k of keys) S._at[k] = now;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    clearTimeout(pushT); pushT = setTimeout(sync, 1200);
  }
  async function rpc(fn, body) {
    const r = await fetch(`${U.sync.url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: U.sync.key, Authorization: `Bearer ${U.sync.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(fn + ' ' + r.status);
    const t = await r.text(); return t ? JSON.parse(t) : null;
  }
  let syncing = false;
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
      if (changed && redraw) render();
    } catch (e) { /* 연결이 안 되면 이 기기에만 저장하고, 다음에 다시 맞춤 */ }
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
  function engToday(force) {
    const t = today(); S.eng = S.eng || { unit: 0, wordDay: 0, days: {} }; S.eng.days = S.eng.days || {};
    if (!S.eng.days[t] && !anyEng() && !force) return { off: true, unit: S.eng.unit || 0, words: S.eng.wordDay || 0, g3: S.eng.g3 || 0, uans: {}, wans: {} };
    if (!S.eng.days[t]) { S.eng.days[t] = { unit: S.eng.unit || 0, words: S.eng.wordDay || 0, g3: S.eng.g3 || 0, uans: {}, wans: {} }; save('eng'); }
    if (S.eng.days[t].g3 == null) S.eng.days[t].g3 = S.eng.g3 || 0;
    return S.eng.days[t];
  }
  const wordsFor = (k) => WORDS.slice(k * 10, k * 10 + 10);

  // ───────── 공통 조각 ─────────
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 1800); }
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
      s += `<path class="ln ${k.dim ? 'dim' : ''}" stroke="${k.dim ? '' : k.color}" d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}"/>`;
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
  function sheet(html, onMount) {
    const root = $('#sheet-root');
    root.innerHTML = `<div class="sheet-bg"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    const close = () => { root.innerHTML = ''; document.body.style.overflow = ''; };
    $('.sheet-bg', root).onclick = close;
    document.body.style.overflow = 'hidden';
    if (onMount) onMount($('.sheet', root), close);
    return close;
  }
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
        Object.assign(S.profile, { name: $('#pf-name', el).value.trim() || U.who, school: $('#pf-school', el).value.trim(), grade: +$('#pf-grade', el).value, cls: $('#pf-cls', el).value.trim(), uni: pick, major: $('#pf-major', el).value.trim(), goalMock: +$('#pf-gm', el).value, goalNaesin: +$('#pf-gn', el).value });
        save('profile'); close(); render(); toast('저장했어요');
      };
    });
  }

  // ───────── 홈 (대시보드) ─────────
  const CSAT = (D.events || []).find((e) => e.kind === 'csat') || { date: '2028-11-16', title: '수능 (예정)' };
  function home() {
    const p = S.profile, u = uniOf(p.uni);
    const lm = lastMock(), mAvg = lm ? avgOf(lm.g) : null, nAvg = nsTotal();
    const ev = (D.events || []).filter((e) => e.kind !== 'csat' && dday(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
    const next = ev.find((e) => e.kind === 'exam') || ev[0];
    const hero = `<section class="card hero link c7" id="hero">
      <div class="hero-band" style="background:${u ? esc(u.color) : 'var(--blue)'}"></div>
      <div class="who">${emb(u, 'xl')}<div style="min-width:0"><div class="goal-t">${esc(p.name)}의 목표${p.mbti ? ` · ${esc(p.mbti)}` : ''}</div><div class="goal-n">${u ? esc(u.name) : '목표 대학을 골라 주세요'}</div><div class="goal-m">${u ? esc(p.major || '') : '눌러서 고르기'}</div></div><span class="tag" style="margin-left:auto;flex:none">${u ? '바꾸기' : '고르기'}</span></div>
      <div class="dday"><div><span>수능까지</span><b class="num">D-${dday(CSAT.date)}</b></div><div><span>${next ? esc(next.title) : '다음 일정'}</span><b class="num">${next ? 'D-' + dday(next.date) : '-'}</b></div><div><span>${esc(p.school || '')}</span><b>${p.grade}학년${p.cls ? ' ' + esc(p.cls) + '반' : ''}</b></div></div>
    </section>`;
    const pos = `<section class="card c5"><div class="card-h"><h2>지금 내 위치</h2><button class="more" id="qg-open" type="button">등급 적기</button></div>
      <div class="rings">${ringSVG(mAvg ? (9 - mAvg) / 8 : 0, 'var(--blue)', '모의고사', mAvg ? fmt1(mAvg) : '-', '등급', lm ? `${esc(lm.title)} 평균<br>${goalLine(mAvg, p.goalMock)}` : '채점 전')}${ringSVG(nAvg ? (5 - nAvg) / 4 : 0, 'var(--green)', '내신', nAvg ? fmt1(nAvg) : '-', '등급', nAvg ? `5등급제 평균<br>${goalLine(nAvg, p.goalNaesin)}` : '아직 안 넣었어요')}</div></section>`;
    // 등급 추이
    const rows = examRows().map((r) => ({ label: r.title.replace(/학력평가|모의고사/g, '').trim() || md(r.date), v: { avg: avgOf(r.g), ...r.g } }));
    const ck = UI.chartSubj;
    const keys = ck === 'avg' ? [...MAIN.map((k) => ({ key: k, dim: true })), { key: 'avg', color: 'var(--blue)' }] : [{ key: 'avg', dim: true }, { key: ck, color: SUBJ_COLOR[ck] }];
    const trend = `<section class="card c12" data-trend><div class="card-h"><h2>모의고사 등급 추이</h2><div class="seg" style="flex:0 1 auto">${[['avg', '평균'], ...MAIN.map((k) => [k, SUBJ_NAMES[k]])].map(([k, n]) => `<button type="button" class="${ck === k ? 'on' : ''}" data-cs="${k}">${n}</button>`).join('')}</div></div>${tossLine(rows.map((r) => ({ label: r.label, v: ck === 'avg' ? r.v.avg : r.v[ck] })), { goal: p.goalMock, id: 'h', color: ck === 'avg' ? '#3182f6' : SUBJ_COLOR[ck] })}</section>`;
    // 약한 영역
    const ow = openWrong(); const byArea = {};
    for (const w of ow) { const k = `${w.subjName || SUBJ_NAMES[w.subj] || w.subj}·${w.area || '기타'}`; byArea[k] = (byArea[k] || 0) + 1; }
    const areas = Object.entries(byArea).sort((a, b) => b[1] - a[1]); const tot = areas.reduce((a, b) => a + b[1], 0);
    const pal = ['var(--blue)', 'var(--red)', 'var(--amber)', 'var(--green)', 'var(--t4)'];
    const weak = `<section class="card c6"><div class="card-h"><h2>약한 영역</h2><button class="more" data-go="wrong">오답 보기</button></div>${areas.length ? `<p class="h1" style="font-size:20px;margin:0 0 16px"><em>${esc(areas[0][0].replace('·', ' '))}</em>에서<br>가장 많이 틀렸어요</p><div class="stack">${areas.slice(0, 4).map(([, n], i) => `<span style="width:${(n / tot) * 100}%;background:${pal[i]}"></span>`).join('')}${areas.length > 4 ? `<span style="width:${(areas.slice(4).reduce((a, b) => a + b[1], 0) / tot) * 100}%;background:${pal[4]}"></span>` : ''}</div><div class="list" style="margin-top:12px">${areas.slice(0, 4).map(([k, n], i) => `<div class="li" style="padding:8px 0"><div class="body"><span class="dot" style="background:${pal[i]}"></span>${esc(k.replace('·', ' · '))}</div><div class="end num">${n}문제</div></div>`).join('')}${areas.length > 4 ? `<div class="li" style="padding:8px 0"><div class="body"><span class="dot" style="background:${pal[4]}"></span>그 외 ${areas.length - 4}개 영역</div><div class="end num">${areas.slice(4).reduce((a, b) => a + b[1], 0)}문제</div></div>` : ''}</div>` : `<div class="empty">${ic('muscle')}<b>쌓인 오답이 없어요</b><span>모의고사를 채점하거나 매일 문제를 풀면 약한 영역이 보여요</span></div>`}</section>`;
    // 과목별 오답 표
    const subjRows = Object.entries(SUBJ_NAMES).map(([k, n]) => { const all = wrongList().filter((w) => w.subj === k); return { k, n, all: all.length, open: all.filter((w) => !w.cleared).length }; }).filter((r) => r.all);
    const wtab = `<section class="card c6"><div class="card-h"><h2>과목별 오답 쌓인 것</h2><button class="more" data-go="wrong">전체</button></div>${subjRows.length ? `<table class="tbl"><thead><tr><th>과목</th><th class="r">쌓인 오답</th><th class="r">다시 맞힘</th><th class="r">남은 것</th></tr></thead><tbody>${subjRows.map((r) => `<tr><td><span class="dot" style="background:${SUBJ_COLOR[r.k]}"></span>${r.n}</td><td class="r num">${r.all}</td><td class="r num blue">${r.all - r.open}</td><td class="r num"><b class="${r.open ? 'red' : ''}">${r.open}</b></td></tr>`).join('')}</tbody></table>` : `<div class="empty">${ic('memo')}<b>아직 없어요</b></div>`}</section>`;
    // 내신 학기별
    const nsRows = SEMS.map((sem) => ({ label: sem.replace('-', '학년 ') + '학기', v: { n: nsAvg(sem) } })).filter((r) => r.v.n != null);
    const nscard = `<section class="card c6"><div class="card-h"><h2>내신 등급</h2><button class="more" data-go="score" data-seg="naesin">입력하기</button></div>${nsRows.length ? tossLine(nsRows.map((r) => ({ label: r.label, v: r.v.n })), { maxG: 5, h: 180, id: 'n1', color: '#03b26c', goal: p.goalNaesin }) : `<div class="empty">${ic('pencil')}<b>내신 등급을 넣어 주세요</b><span>학기마다 과목 등급을 넣으면 평균이 계산돼요</span></div>`}</section>`;
    const sgbc = sgbSummary('c6');
    const main = `<h1 class="h1">${bdayLeft() === 0 ? `${ic('party')} ${nameCall()}, 생일 축하해` : `${nameCall()}, ${greet()}`}</h1><p class="sub">${todayLine()}</p>
      <div class="grid">${qlogCard()}${hero}${pos}${insightCard('c7')}${picksCard('c5')}${admitCard('c12')}${trend}${railCards(true)}${weak}${wtab}${nscard}${sgbc}</div>`;
    return `<div class="layout has-rail"><div>${main}</div><aside class="rail">${railCards(false)}</aside></div>`;
  }
  // 날마다 바뀌는 응원 한마디 (하루 동안은 같은 말)
  const CHEER = ['오늘도 정말 수고했어', '한 문제씩 쌓이는 게 다 실력이야', '어제보다 한 걸음 더 왔어', '지금 하는 게 다 남아, 잘하고 있어', '천천히 가도 괜찮아, 멈추지만 않으면 돼', '오늘 한 줄 기록이 나중에 큰 힘이 돼', '틀린 문제는 내 편이야, 다시 풀면 내 거야', '너는 생각보다 훨씬 잘하고 있어', '꾸준함이 제일 센 무기야', '힘들면 쉬어도 돼, 그래도 내일은 또 해 보자', '오늘의 노력은 절대 사라지지 않아', '목표 대학이 조금씩 가까워지고 있어', '작은 걸 해낸 것도 꼭 칭찬해 주자', '오늘도 끝까지 해낸 거 멋있어', '모르는 걸 아는 게 공부의 시작이야', '하루 30분이 1년이면 엄청난 차이야', '네가 하는 질문 하나가 세특이 돼', '조급해하지 마, 지금 속도도 충분해', '어려운 문제 앞에서 버틴 시간이 실력이야', '선생님은 늘 정윤이 편이야', '오늘 공부한 너, 진짜 대단해', '실수는 연습일 뿐이야, 시험 땐 안 하면 돼', '한 번 더 보는 게 합격을 만들어', '지금의 너를 믿어 봐', '잘 쉬는 것도 실력이야, 푹 자', '오늘 배운 거 하나만 기억해도 성공이야'];
  function nameCall() { const n = S.profile.name || U.who; const c = n.charCodeAt(n.length - 1); const jong = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; return `우리 ${esc(n)}${jong ? '이' : ''}`; }
  function cheer() { const t = today(); let h = 0; for (const ch of t + (S.profile.name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return CHEER[h % CHEER.length]; }
  function greet() { return cheer(); }
  function todayLine() {
    const sd = sciToday(), st = dayStat(sd), ed = engToday();
    const left = [];
    const dr = openDrills().length; if (dr) left.push(`약한 영역 문제 ${dr}세트`);
    if (!ed.off && G3.length && !ed.g3done) left.push('고3 영어 1문제');
    if (SCI.concepts.length && st.done < st.n) left.push(`과학 ${st.n - st.done}문제`);
    if (!ed.off && WORDS.length && !Object.keys(ed.wans || {}).length) left.push('단어 10개');
    const hw = hwNow().length; if (hw) left.push(`선생님 숙제 ${hw}개`);
    return left.length ? `오늘 남은 것: ${left.join(', ')}` : ed.off && !onDay('sci') ? '오늘은 정해 둔 매일 과제가 없는 날이에요' : '오늘 할 일을 다 끝냈어요';
  }
  // 오른쪽 칸 (PC) · 휴대폰에서는 본문 안에
  function railCards(inline) {
    const cls = inline ? 'rail-inline c12' : '';
    const sd = sciToday(), st = dayStat(sd), ed = engToday();
    const wordsDone = Object.keys(ed.wans || {}).length >= Math.min(10, wordsFor(ed.words).length) && wordsFor(ed.words).length;
    const unitDone = ed.udone;
    const tasks = [];
    const off = !anyTask(new Date()) && !S.sci.days[today()] && !S.eng.days[today()];
    const has = (k) => !off && (onDay(k) || (k === 'sci' ? !!S.sci.days[today()] : !!S.eng.days[today()]));
    if (off) tasks.push({ k: 'hw', icon: 'party', t: '오늘은 매일 과제가 쉬는 날이에요', d: '요일은 숙제 탭의 「숙제 요일」에서 바꿀 수 있어요', done: true });
    for (const d of openDrills().slice(0, 4)) tasks.push({ k: 'drill:' + d.id, icon: 'target', t: `${d.title || d.area} ${d.qs.length}문제`, d: '선생님이 낸 약한 영역 문제', done: false });
    if (has('g3') && G3.length) { const g = G3[ed.g3 || 0]; tasks.push({ k: 'g3', icon: 'eng', t: '고3 영어 한 문제', d: ed.g3done ? '다 풀었어요 · 문장 분석 보기' : g ? `${g.type || ''} · 문장 분석과 천일문 연결` : '', done: !!ed.g3done }); }
    if (has('sci') && SCI.concepts.length) tasks.push({ k: 'sci', icon: 'sci', t: sd.one ? `과학 개념: ${(SCI.concepts.find((x) => x.id === sd.c) || {}).title || ''}` : `오늘의 과학 ${st.n}문제`, d: sd.one && !sd.read ? `교과서 개념 보고 문제 ${st.n}개` : st.done >= st.n ? `${st.ok}/${st.n} 맞힘${st.all > st.n ? ` · 깊게 ${st.all - st.n}문제 더` : ''}` : `${st.done}/${st.n} 풀었어요`, done: st.done >= st.n });
    if (has('unit') && CH_UNITS.length) { const un = CH_UNITS[ed.unit] || CH_UNITS[CH_UNITS.length - 1]; tasks.push({ k: 'unit', icon: 'eng', t: `천일문 ${un.unit ? 'Unit ' + un.unit : ''} ${un.title || ''}`.trim(), d: unitDone ? '다 했어요' : '개념 · 문장 · 문제', done: !!unitDone }); }
    if (has('words') && WORDS.length) tasks.push({ k: 'words', icon: 'books', t: '워드마스터 단어 10개 시험', d: wordsDone ? `${Object.values(ed.wans).filter((x) => x.ok).length}/10 맞힘` : `Day ${(wordsFor(ed.words)[0] || {}).day || ''}`, done: !!wordsDone });
    for (const h of hwNow().slice(0, 3)) tasks.push({ k: 'hw', icon: 'pin', t: h.title, d: h.due && h.due < today() ? `${md(h.due)} 숙제 · 아직 안 했어요` : '오늘 선생님 숙제', done: false });
    const real = tasks.filter((t) => t.icon !== 'party'); const doneN = real.filter((t) => t.done).length, frac = real.length ? doneN / real.length : (off ? 1 : 0);
    const R = 80, L = Math.PI * R;
    const todo = `<section class="card tight ${cls}"><div class="card-h"><h3>오늘 할 일</h3><button class="more" data-go="hw">숙제</button></div>
      <div class="arch"><svg viewBox="0 0 200 100"><path d="M20 96 A80 80 0 0 1 180 96" fill="none" stroke="var(--fill)" stroke-width="12" stroke-linecap="round"/><path class="ring-arc" d="M20 96 A80 80 0 0 1 180 96" fill="none" stroke="var(--blue)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - frac)}"/></svg><div class="c"><span class="tiny">오늘</span><br><b class="num">${Math.round(frac * 100)}%</b> <span class="muted">완료</span></div></div>
      <div class="list">${tasks.length ? tasks.map((t) => `<div class="li btnlike" data-task="${t.k}"><div class="ico">${ic(t.done ? 'ok' : t.icon)}</div><div class="body"><div class="t">${esc(t.t)}</div><div class="d">${esc(t.d)}</div></div><span class="chev"></span></div>`).join('') : `<div class="empty">${ic('party')}<b>오늘 할 일이 없어요</b></div>`}</div></section>`;
    const news = newsCard(cls);
    return todo + news;
  }
  function newsCard(cls) {
    const N = (D.news && D.news.items) || [];
    const p = S.profile;
    const mine = N.slice().sort((a, b) => (b.level === '중요') - (a.level === '중요') || String(b.date).localeCompare(String(a.date)));
    const top = mine.filter((n) => !n.uni || n.uni === p.uni || n.scope !== '대학').slice(0, 4);
    return `<section class="card tight ${cls}"><div class="card-h"><h3>입시 소식</h3><button class="more" data-news="all">전체 ${N.length}</button></div>
      ${top.length ? `<div class="list">${top.map((n) => `<div class="li btnlike" data-news="${esc(n.id)}"><div class="ico">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'sm') : ic(n.scope === '교육부' ? 'bank' : 'news')}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${md(n.date)} · ${esc(n.scope || '')}${n.level === '중요' ? ' · <b class="red">중요</b>' : ''}</div></div></div>`).join('')}</div>` : `<div class="empty">${ic('news')}<b>소식을 모으는 중이에요</b></div>`}
      ${D.news && D.news.updated ? `<p class="tiny" style="margin:8px 0 0">${md(D.news.updated)} 업데이트</p>` : ''}</section>`;
  }
  function newsSheet(id) {
    const N = (D.news && D.news.items) || [];
    if (id === 'all') {
      sheet(`<h2>입시 소식</h2><p class="sub">${D.news && D.news.updated ? md(D.news.updated) + ' 업데이트 · ' : ''}선생님이 확인한 정확한 소식만 모았어요</p><div class="chips" id="nw-f"></div><div class="list" id="nw-l" style="margin-top:12px"></div>`, (el) => {
        let f = 'all'; const scopes = ['all', ...new Set(N.map((n) => n.scope).filter(Boolean))];
        const draw = () => { $('#nw-f', el).innerHTML = scopes.map((s) => `<button type="button" class="chip ${f === s ? 'on' : ''}" data-f="${esc(s)}">${s === 'all' ? '전체' : esc(s)}</button>`).join(''); $$('[data-f]', el).forEach((b) => (b.onclick = () => { f = b.dataset.f; draw(); }));
          $('#nw-l', el).innerHTML = N.filter((n) => f === 'all' || n.scope === f).sort((a, b) => String(b.date).localeCompare(String(a.date))).map((n) => `<div class="li btnlike" data-n="${esc(n.id)}"><div class="ico">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'sm') : ic(n.scope === '교육부' ? 'bank' : 'news')}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${md(n.date)}${n.level === '중요' ? ' · <b class="red">중요</b>' : ''}</div></div><span class="chev"></span></div>`).join('');
          $$('[data-n]', el).forEach((b) => (b.onclick = () => newsSheet(b.dataset.n))); };
        draw();
      });
      return;
    }
    const n = N.find((x) => x.id === id); if (!n) return;
    sheet(`<div class="row" style="margin-bottom:12px">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'md') : `<span class="ico">${ic(n.scope === '교육부' ? 'bank' : 'news')}</span>`}<span class="tag ${n.level === '중요' ? 'red' : ''}">${esc(n.level || '참고')}</span><span class="tiny">${md(n.date)} · ${esc(n.scope || '')}</span></div>
      <h2>${esc(n.title)}</h2><p style="line-height:1.8;color:var(--t2)">${esc(n.body)}</p>
      ${n.you ? `<div class="deep"><div class="eyebrow">${esc(S.profile.name)}에게는</div><p>${esc(n.you)}</p></div>` : ''}
      <div class="list" style="margin-top:16px">${(n.src || []).map((s) => `<a class="li btnlike" href="${esc(s.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><div class="ico">${ic('pin')}</div><div class="body"><div class="t">${esc(s.name)}</div><div class="d">원문 보기</div></div><span class="chev"></span></a>`).join('')}</div>
      <button class="btn big block" style="margin-top:16px" data-back type="button">목록으로</button>`, (el) => { $('[data-back]', el).onclick = () => newsSheet('all'); });
  }

  // ───────── 숙제 탭 ─────────
  function hwView() {
    const sd = sciToday(), st = dayStat(sd), ed = engToday();
    const un = CH_UNITS[ed.unit];
    const wl = wordsFor(ed.words), wdone = Object.keys(ed.wans || {}).length;
    // 꾸준히 (최근 28일)
    const days = []; for (let i = 27; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); }
    const lvl = (d) => { const s = S.sci.days[d], e = S.eng.days[d]; let n = 0; if ((S.logs || []).some((x) => x.date === d)) n++; if (s && dayStat(s).done >= dayStat(s).n && dayStat(s).n) n++; if (e && e.udone) n++; if (e && Object.keys(e.wans || {}).length >= 10) n++; return n; };
    const streak = (() => { let n = 0; for (let i = days.length - 1; i >= 0; i--) { const wk = new Date(days[i] + 'T00:00:00'); if (lvl(days[i])) n++; else if (!anyTask(wk)) continue; else if (i !== days.length - 1) break; } return n; })();
    const hwList = S.hw || [];
    const planTxt = PLAN_KINDS.map((x) => planOf(x.k).length).every((n, i, a) => n === a[0]) ? `${planOf('sci').length === 5 && planOf('sci').every((d) => d >= 1 && d <= 5) ? '평일 매일' : planOf('sci').slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DOW[d]).join('') + ` 주${planOf('sci').length}회`}` : '과제마다 다르게';
    return `<h1 class="h1">오늘의 숙제</h1><div class="row between wrap" style="gap:8px;margin-bottom:16px"><p class="sub" style="margin:0">${todayLine()}</p><button class="btn sm" id="plan-open" type="button">${ic('cal')} 숙제 요일 · ${esc(planTxt)}</button></div>
    <div class="grid">
      <section class="card c12"><div class="card-h"><h2>선생님 숙제</h2>${TEACHER ? '<button class="btn sm soft" id="hw-add" type="button">숙제 내기</button>' : ''}</div>
        ${hwList.length ? (() => {
          const row = (h, later) => `<div class="li btnlike" data-hwopen="${esc(h.id)}"><button class="ico" data-hwdone="${esc(h.id)}" style="border:0;cursor:pointer" aria-label="완료">${ic(h.done ? 'ok' : 'pin')}</button><div class="body"><div class="t" style="${h.done ? 'color:var(--t3);text-decoration:line-through' : later ? 'color:var(--t2);font-weight:500' : ''}">${esc(h.title)}</div><div class="d">${[h.subj, h.due ? md(h.due) + (later ? ' 숙제' : '') : '', later ? '' : h.memo].filter(Boolean).map(esc).join(' · ')}</div></div>${!h.done && !later && h.due && h.due < today() ? '<span class="tag red">밀림</span>' : ''}${TEACHER ? `<button class="btn sm" data-hwdel="${esc(h.id)}" type="button">지우기</button>` : ''}<span class="chev"></span></div>`;
          const by = (a, b) => String(a.due || '').localeCompare(String(b.due || ''));
          const now = hwNow().sort(by), later = hwList.filter((h) => !h.done && h.due && h.due > today()).sort(by), done = hwList.filter((h) => h.done).sort(by).reverse();
          return `${now.length ? `<div class="list">${now.map((h) => row(h)).join('')}</div>` : `<div class="empty" style="padding:16px 0">${ic('party')}<b>오늘 숙제는 끝!</b>${later.length ? `<span>다음 숙제는 ${md(later[0].due)}에 나와요</span>` : ''}</div>`}
            ${later.length ? `<details class="hw-more" ontoggle="this.firstElementChild.textContent=this.open?'미리 보기 접기':'다음 숙제 ${later.length}개 미리 보기'"><summary>다음 숙제 ${later.length}개 미리 보기</summary><div class="list">${later.map((h) => row(h, true)).join('')}</div></details>` : ''}
            ${done.length ? `<details class="hw-more" ontoggle="this.firstElementChild.textContent=this.open?'끝낸 숙제 접기':'끝낸 숙제 ${done.length}개 보기'"><summary>끝낸 숙제 ${done.length}개 보기</summary><div class="list">${done.map((h) => row(h)).join('')}</div></details>` : ''}`;
        })() : `<div class="empty">${ic('party')}<b>받은 숙제가 없어요</b>${TEACHER ? '<span>위의 「숙제 내기」로 낼 수 있어요</span>' : ''}</div>`}</section>
      <section class="card c4 link" data-task="sci"><div class="row between"><span class="eyebrow">${ic('sci')} 오늘의 과학</span><span class="tag ${st.done >= st.n && st.n ? 'blue' : ''}">${st.done}/${st.n}</span></div><p class="big" style="margin:12px 0 4px">${sd.one ? esc((SCI.concepts.find((x) => x.id === sd.c) || {}).title || '') : st.n ? (st.done >= st.n ? `${st.ok}문제 맞혔어요` : `${st.n - st.done}문제 남았어요`) : !onDay('sci') ? '오늘은 쉬는 날' : '문제 준비 중'}</p><p class="muted" style="margin:0 0 16px">${sd.one ? (sd.read ? (st.done >= st.n ? `${st.ok}/${st.n} 맞혔어요` : `개념 봤어요 · 문제 ${st.n - st.done}개 남았어요`) : '교과서 개념 먼저 보고, 그 개념 문제를 풀어요') : !onDay('sci') ? '눌러서 들어가면 오늘 개념이 열려요' : '교과서 개념 먼저 보고, 그 개념 문제를 풀어요'}</p><div class="progress-dots">${(sd.list || []).map((x) => `<i class="${sd.ans[x.q] ? (sd.ans[x.q].ok ? 'ok' : 'no') : ''}"></i>`).join('')}</div></section>
      <section class="card c4 link" data-task="unit"><div class="row between"><span class="eyebrow">${ic('eng')} 천일문</span>${ed.udone ? '<span class="tag blue">완료</span>' : ''}</div><p class="big" style="margin:12px 0 4px">${un ? `Unit ${esc(un.unit)}` : '준비 중'}</p><p class="muted" style="margin:0">${un ? esc(un.title) : '자료를 넣는 중이에요'}</p></section>
      <section class="card c4 link" data-task="words"><div class="row between"><span class="eyebrow">${ic('books')} 워드마스터 하이스트</span>${wdone >= 10 ? '<span class="tag blue">완료</span>' : ''}</div><p class="big" style="margin:12px 0 4px">${wl.length ? (wdone >= wl.length ? `${Object.values(ed.wans).filter((x) => x.ok).length}/${wl.length} 맞힘` : '단어 10개 시험') : '준비 중'}</p><p class="muted" style="margin:0">${wl.length ? `Day ${wl[0].day} · 외우고 바로 시험` : '단어장을 넣는 중이에요'}</p></section>
      ${G3.length ? (() => { const g = G3[ed.g3 || 0]; return `<section class="card c12 link" data-task="g3"><div class="row between"><span class="eyebrow">${ic('eng')} 고3 영어 하루 한 문제</span>${ed.g3done ? '<span class="tag blue">완료</span>' : ed.off ? '<span class="tag">주말</span>' : ''}</div><p class="big" style="margin:12px 0 4px">${g ? esc(g.type || '독해') + ' · ' + esc(g.src || '') : '준비 중'}</p><p class="muted" style="margin:0">풀고 나면 문장마다 해석·구문 분석이 나오고, 천일문 그 유닛으로 바로 가요</p></section>`; })() : ''}
      ${drillCard()}
      ${libCard()}
      <section class="card c4"><div class="card-h"><h2>꾸준히</h2><span class="tag blue">${streak}일 연속</span></div><div class="streak">${days.map((d) => `<i class="${lvl(d) ? 'l' + lvl(d) : ''} ${d === today() ? 'today' : ''}" title="${d}"></i>`).join('')}</div><p class="tiny" style="margin:12px 0 0">최근 4주 · 진할수록 많이 했어요</p></section>
    </div>`;
  }
  function planSheet() {
    const P = {}; for (const x of PLAN_KINDS) P[x.k] = planOf(x.k).slice();
    const order = [1, 2, 3, 4, 5, 6, 0];
    const PRE = [{ t: '평일 매일', d: [1, 2, 3, 4, 5] }, { t: '월수금 (주3회)', d: [1, 3, 5] }, { t: '화목 (주2회)', d: [2, 4] }, { t: '매일', d: [0, 1, 2, 3, 4, 5, 6] }];
    const draw = (el) => {
      $('#pl-body', el).innerHTML = PLAN_KINDS.map((x) => `<div class="pl-row"><div class="row between"><b>${esc(x.t)}</b><span class="tag ${P[x.k].length ? 'blue' : ''}">${P[x.k].length ? `주 ${P[x.k].length}회` : '안 함'}</span></div>
        <div class="pl-days">${order.map((d) => `<button type="button" class="${P[x.k].includes(d) ? 'on' : ''} ${d === 0 || d === 6 ? 'we' : ''}" data-pd="${x.k}:${d}">${DOW[d]}</button>`).join('')}</div>
        <div class="row wrap" style="gap:6px;margin-top:8px">${PRE.map((p, i) => `<button type="button" class="chip sm ${p.d.length === P[x.k].length && p.d.every((d) => P[x.k].includes(d)) ? 'on' : ''}" data-pp="${x.k}:${i}">${p.t}</button>`).join('')}</div></div>`).join('');
      $$('[data-pd]', el).forEach((b) => (b.onclick = () => { const [k, d] = b.dataset.pd.split(':'); const n = +d; P[k] = P[k].includes(n) ? P[k].filter((y) => y !== n) : [...P[k], n]; draw(el); }));
      $$('[data-pp]', el).forEach((b) => (b.onclick = () => { const [k, i] = b.dataset.pp.split(':'); P[k] = PRE[+i].d.slice(); draw(el); }));
    };
    sheet(`<h2>숙제 요일</h2><p class="sub">과제마다 하는 요일을 골라요. 고른 요일에만 「오늘 할 일」에 나와요</p>
      <div class="row wrap" style="gap:8px;margin-bottom:12px;align-items:center"><span class="tiny">한 번에 바꾸기</span>${PRE.map((p, i) => `<button type="button" class="chip" data-all="${i}">${p.t}</button>`).join('')}</div>
      <div id="pl-body"></div><button class="btn primary big block" id="pl-ok" type="button" style="margin-top:16px">저장하기</button>`, (el, close) => {
      draw(el);
      $$('[data-all]', el).forEach((b) => (b.onclick = () => { for (const x of PLAN_KINDS) P[x.k] = PRE[+b.dataset.all].d.slice(); draw(el); }));
      $('#pl-ok', el).onclick = () => { S.plan = P; save('plan'); close(); render(); toast('숙제 요일을 바꿨어요'); };
    });
  }
  function hwSheet(id) {
    const h = (S.hw || []).find((x) => x.id === id); if (!h) return;
    const key = Object.keys(SUBJ_NAMES).find((k) => SUBJ_NAMES[k] === h.subj || (h.subj === '한국사' && k === 'hist'));
    const mock = /모의/.test(h.title) && key;
    const late = !h.done && h.due && h.due < today();
    sheet(`<div class="row" style="gap:6px;margin-bottom:8px"><span class="tag">${esc(h.subj || '숙제')}</span>${h.due ? `<span class="tag ${late ? 'red' : ''}">${md(h.due)}${late ? ' · 밀림' : ''}</span>` : ''}${h.done ? '<span class="tag blue">다 했어요</span>' : ''}</div>
      <h2 style="line-height:1.45">${esc(h.title)}</h2>
      ${h.memo ? `<div class="deep" style="margin:12px 0"><div class="eyebrow">이렇게 해요</div><p style="margin:4px 0 0">${esc(h.memo)}</p></div>` : ''}
      ${mock ? `<p class="sub" style="margin:12px 0">10월 모의고사 ${esc(h.subj)} 문제는 오답 노트에 다 들어 있어요. 지문과 문제를 앱에서 바로 다시 풀 수 있어요</p><button class="btn soft big block" id="hs-wrong" type="button">${ic('retry')} 오답 노트에서 ${esc(SUBJ_NAMES[key])} 풀기</button>` : ''}
      <div class="row" style="margin-top:16px"><button class="btn big" style="flex:1" data-x type="button">닫기</button><button class="btn ${h.done ? '' : 'primary'} big" style="flex:1" id="hs-done" type="button">${h.done ? '안 한 걸로 되돌리기' : '다 했어요'}</button></div>`, (el, close) => {
      $('[data-x]', el).onclick = close;
      $('#hs-done', el).onclick = () => { h.done = !h.done; h.doneAt = Date.now(); save('hw'); close(); render(); if (h.done) toast('잘했어요'); };
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
  function verdict(ok, extra = '') { return `<div class="verdict ${ok ? 'ok' : 'no'}">${ic(ok ? 'hundred' : 'think')}<span>${ok ? '정답이에요' : '아쉬워요, 다시 볼게요'}</span>${extra}</div>`; }
  function addWrong(id, w) { S.wrong = S.wrong || {}; const old = S.wrong[id]; S.wrong[id] = { ...(old || {}), ...w, at: Date.now(), times: ((old && old.times) || 0) + 1, cleared: false }; save('wrong'); }
  function clearWrong(id) { if (S.wrong && S.wrong[id]) { S.wrong[id].cleared = true; S.wrong[id].clearedAt = Date.now(); save('wrong'); } }

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
    if (!UI.run.read) return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}<p class="eyebrow" style="margin:16px 0 4px">${ic('books')} 개념 · ${c.lesson && c.lesson.src ? esc(c.lesson.src) : '교과서'}</p><h1 class="h1" style="margin:0 0 16px">${esc(c.title)}</h1>${lessonHtml(c)}<div class="cta-bar"><button class="btn primary big block" id="cr-go" type="button">개념 다 봤어요, 문제 ${qs.length}개 풀기</button></div></div>`;
    let i = UI.run.i != null ? UI.run.i : qs.findIndex((q) => !ans[q.id]);
    if (i < 0) { const ok = qs.filter((q) => ans[q.id] && ans[q.id].ok).length; return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}<div class="card"><h1 class="h1">${ok}/${qs.length} 맞혔어요</h1><p class="sub">틀린 문제는 오답 노트에 들어갔어요</p><div class="row"><button class="btn primary big" data-lib="sci" type="button">다른 개념 보기</button><button class="btn big" id="cr-redo" type="button">처음부터 다시</button></div></div></div>`; }
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
      if (ok) { if (S.wrong[wid]) clearWrong(wid); } else addWrong(wid, { src: 'sci', subj: 'sci', subjName: '통합과학', area: unitOf(c.unit).title.replace(/^[ⅠⅡⅢⅣⅤⅥ]+\.\s*/, ''), sub: c.title, concept: c.id, qid: q.id });
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
        <h1 class="h1" style="margin:0 0 16px">${esc(c.title || '')}</h1>
        ${lessonHtml(c)}
        <div class="cta-bar"><button class="btn primary big block" id="ls-done" type="button">개념 다 봤어요, 문제 ${list.length}개 풀기</button></div>
      </div>`;
    }
    let i = list.findIndex((x) => !d.ans[x.q]);
    if (UI.run && UI.run.i != null && d.ans[list[UI.run.i] && list[UI.run.i].q] && UI.run.showing) i = UI.run.i;
    if (i < 0) { const st = dayStat(d); return `<div class="qwrap card" style="max-width:720px;margin:0 auto">${ic('party', 'ic')}<h1 class="h1">오늘의 과학 끝!</h1><p class="sub">${st.ok}/${st.n} 맞혔어요${st.all > st.n ? `, 깊게 ${st.all - st.n}문제를 더 풀었어요` : ''}. 틀린 문제는 오답 노트에 쌓였어요.</p><div class="row"><button class="btn soft big" data-go="wrong" type="button">오답 노트 보기</button><button class="btn big" data-go="home" type="button">홈으로</button></div></div>`; }
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
      if (ok) { if (S.wrong[wid]) clearWrong(wid); }
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
      return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}<div class="card">${verdict(ok === qs.length, '')}<p class="sub" style="margin:12px 0 0">${ok}/${qs.length} 맞혔어요. 내일은 다음 유닛이에요.</p><div class="row" style="margin-top:16px"><button class="btn primary big" data-task="words" type="button">단어 시험 보러 가기</button><button class="btn big" data-go="home" type="button">홈으로</button></div></div></div>`;
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
    const mark = (ok, extra) => { ed.uans[cur] = { ok, at: Date.now(), ...extra }; if (!ok) addWrong(`eng:${un.ch}-${un.unit}-${cur}`, { src: 'eng', subj: 'eng', subjName: '영어', area: '천일문 ' + (un.chTitle || ''), sub: un.title, ref: { ch: un.ch, unit: un.unit, i: cur } }); else clearWrong(`eng:${un.ch}-${un.unit}-${cur}`); save('eng'); render(); };
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
      return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}<div class="card"><p class="big">${ok}/${wl.length} 맞혔어요</p><div class="list">${wl.map((w, k) => `<div class="li"><div class="ico">${ic(wans[k] && wans[k].ok ? 'ok' : 'x')}</div><div class="body"><div class="t">${esc(w.en)}</div><div class="d">${esc(w.ko)}</div></div></div>`).join('')}</div><button class="btn big block" style="margin-top:16px" data-go="home" type="button">홈으로</button></div></div>`;
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
      const wid = 'word:' + w.en; if (!ok) addWrong(wid, { src: 'word', subj: 'eng', subjName: '영어', area: '단어', sub: `${w.en} · ${w.ko}`, word: w }); else if (S.wrong[wid]) clearWrong(wid);
      save('eng'); setTimeout(render, ok ? 450 : 1100);
    }));
  }

  // ───────── 오답 탭 ─────────
  function wrongView() {
    const all = wrongList(); const f = UI.wrongSubj;
    const subs = Object.entries(SUBJ_NAMES).filter(([k]) => all.some((w) => w.subj === k));
    const L = all.filter((w) => f === 'all' || w.subj === f);
    const open = L.filter((w) => !w.cleared), done = L.filter((w) => w.cleared);
    // 영역별 표
    const area = {}; for (const w of L) { const k = (w.subjName || SUBJ_NAMES[w.subj]) + '|' + (w.area || '기타'); area[k] = area[k] || { all: 0, open: 0 }; area[k].all++; if (!w.cleared) area[k].open++; }
    const ar = Object.entries(area).sort((a, b) => b[1].open - a[1].open || b[1].all - a[1].all);
    const item = (w) => `<div class="li btnlike" data-wr="${esc(w.id)}"><div class="ico">${ic(w.cleared ? 'ok' : w.src === 'mock' ? 'score' : w.src === 'word' ? 'books' : w.src === 'eng' ? 'eng' : 'sci')}</div><div class="body"><div class="t">${esc(w.title || w.sub || '')}</div><div class="d">${esc(w.subjName || SUBJ_NAMES[w.subj] || '')} · ${esc(w.area || '')}${w.times > 1 ? ` · ${w.times}번 틀림` : ''}</div></div>${w.cleared ? '<span class="tag blue">다시 맞힘</span>' : '<span class="tag red">다시 풀기</span>'}</div>`;
    return `<h1 class="h1">오답 노트</h1><p class="sub">틀린 문제는 다 여기에 쌓여요. 다시 맞히면 파란색이 돼요</p>
      <div class="chips" style="margin-bottom:16px"><button class="chip ${f === 'all' ? 'on' : ''}" data-ws="all" type="button">전체 ${all.length}</button>${subs.map(([k, n]) => `<button class="chip ${f === k ? 'on' : ''}" data-ws="${k}" type="button">${n} ${all.filter((w) => w.subj === k).length}</button>`).join('')}</div>
      <div class="grid">
        <section class="card c7"><div class="card-h"><h2>다시 풀 문제 <span class="red">${open.length}</span></h2>${open.length ? '<button class="btn sm primary" id="wr-all" type="button">차례로 풀기</button>' : ''}</div>${open.length ? `<div class="list">${open.slice(0, 60).map(item).join('')}</div>` : `<div class="empty">${ic('party')}<b>다시 풀 문제가 없어요</b></div>`}</section>
        <section class="card c5"><div class="card-h"><h2>영역별</h2></div>${ar.length ? `<table class="tbl"><thead><tr><th>영역</th><th class="r">쌓임</th><th class="r">남음</th></tr></thead><tbody>${ar.map(([k, v]) => { const [s, a] = k.split('|'); return `<tr><td><div style="font-weight:600">${esc(a)}</div><div class="tiny">${esc(s)}</div></td><td class="r num">${v.all}</td><td class="r num"><b class="${v.open ? 'red' : 'blue'}">${v.open}</b></td></tr>`; }).join('')}</tbody></table>` : `<div class="empty">${ic('memo')}<b>아직 없어요</b></div>`}</section>
        ${done.length ? `<section class="card c12"><div class="card-h"><h2>다시 맞힌 문제 ${done.length}</h2></div><div class="list">${done.slice(0, 40).map(item).join('')}</div></section>` : ''}
      </div>`;
  }
  // 오답 하나 다시 풀기
  function retryRun() {
    const id = UI.run.id, w = S.wrong[id]; if (!w) { UI.run = null; return wrongView(); }
    const queue = UI.run.queue || [];
    const head = `<div class="row between"><button class="btn sm" data-go="wrong" type="button">‹ 오답 노트</button><span class="tiny">${esc(w.subjName || '')} · ${esc(w.area || '')}${queue.length ? ` · 남은 ${queue.length}` : ''}</span></div>`;
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
    const n = $('#next'); if (n) n.onclick = () => { if (r.queue && r.queue.length) { const [nx, ...rest] = r.queue; UI.run = { kind: 'retry', id: nx, queue: rest }; } else { UI.run = null; UI.tab = 'wrong'; } render(); window.scrollTo(0, 0); };
  }

  // ───────── 성적 탭 (모의고사 · 내신) ─────────
  function scoreView() {
    const seg = UI.scoreSeg;
    const top = `<h1 class="h1">성적</h1><p class="sub">모의고사는 틀린 번호만 누르면 점수·등급·약한 영역이 나와요</p><div class="row wrap between" style="gap:12px;margin-bottom:16px"><div class="seg" style="max-width:360px;flex:1 1 240px"><button type="button" class="${seg === 'mock' ? 'on' : ''}" data-seg="mock">모의고사</button><button type="button" class="${seg === 'naesin' ? 'on' : ''}" data-seg="naesin">내신</button></div>${seg === 'mock' ? '<button class="btn primary" id="qg-open" type="button">내 등급 바로 적기</button>' : ''}</div>`;
    return top + (seg === 'mock' ? (UI.mockId ? mockDetail() : reportSection() + mockList()) : naesinView());
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
      <section class="card c12"><div class="card-h"><h2>과목별 입력</h2><div class="seg" style="flex:0 1 auto">${SEMS.map((s) => `<button type="button" class="${sem === s ? 'on' : ''}" data-sem="${s}">${s.replace('-', '학년 ')}학기</button>`).join('')}</div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>과목</th><th class="r">단위</th>${split ? '<th class="r">중간 점수</th><th class="r">중간 등급</th><th class="r">기말 점수</th><th class="r">기말 등급</th><th class="r">학기 최종 등급</th>' : '<th class="r">원점수</th><th class="r">과목 평균</th><th class="r">등급 (1~5)</th>'}<th class="r">성취도</th></tr></thead><tbody>
        ${subs.map((s) => { const r = rec[s.name] || {}; return `<tr><td style="font-weight:600">${esc(s.name)}${s.noGrade ? '<div class="tiny">등급 없음</div>' : ''}</td><td class="r"><input class="inp sm num" style="width:56px" data-ns="${esc(s.name)}" data-f="credits" value="${esc(r.credits || s.credits || '')}" inputmode="numeric"></td>${split ? [['mid', 'midG'], ['fin', 'finG'], [null, 'grade']].map(([sc, gf]) => (sc ? `<td class="r"><input class="inp sm num" style="width:64px" data-ns="${esc(s.name)}" data-f="${sc}" value="${esc(r[sc] ?? '')}" inputmode="decimal" placeholder="점수"></td>` : '') + `<td class="r">${s.noGrade ? '-' : gsel(s.name, gf, r[gf])}</td>`).join('') : `<td class="r"><input class="inp sm num" style="width:72px" data-ns="${esc(s.name)}" data-f="raw" value="${esc(r.raw || '')}" inputmode="decimal"></td><td class="r"><input class="inp sm num" style="width:72px" data-ns="${esc(s.name)}" data-f="avg" value="${esc(r.avg || '')}" inputmode="decimal"></td><td class="r">${s.noGrade ? '-' : gsel(s.name, 'grade', r.grade)}</td>`}<td class="r"><select class="inp sm" style="width:64px" data-ns="${esc(s.name)}" data-f="ach"><option value="">-</option>${['A', 'B', 'C', 'D', 'E', 'P'].map((g) => `<option ${r.ach === g ? 'selected' : ''}>${g}</option>`).join('')}</select></td></tr>`; }).join('')}
        </tbody></table></div>
        ${split ? `<p class="tiny" style="margin:12px 0 0">중간고사·기말고사 점수와 등급을 시험마다 따로 적어요. 학기 최종 등급이 나오면 그걸로 평균을 내고, 아직이면 중간·기말 등급 평균으로 계산해요${mAvg != null || fAvg != null ? ` · 평균 중간 <b class="num">${mAvg != null ? fmt1(mAvg) : '-'}</b>점, 기말 <b class="num">${fAvg != null ? fmt1(fAvg) : '-'}</b>점` : ''}</p>` : ''}
        <div class="row between" style="margin-top:16px"><span class="muted">${sem.replace('-', '학년 ')}학기 평균 <b class="num" style="color:var(--t1)">${av ? fmt1(av) : '-'}</b>등급</span><button class="btn sm" id="ns-add" type="button">과목 더하기</button></div></section>
    </div>`;
  }
  function bindNaesin() {
    $$('[data-sem]').forEach((b) => (b.onclick = () => { UI.semester = b.dataset.sem; render(); }));
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
        <section class="card c8"><div class="card-h"><h2>영역별로 모으기</h2><button class="more" id="sg-pick" type="button">최종 고르기</button></div><p class="tiny" style="margin:-4px 0 12px">많이 적어 두고, 학기 끝에 실제로 넣을 것만 골라요. 고른 글이 칸 글자 수 안에 들어가야 해요</p>
          <div class="sgb-area">${AREAS.map((a) => { const n = items.filter((x) => x.area === a.key).length, ch = pickedLen(a.key); return `<button class="a" style="border:0;text-align:left;cursor:pointer;${f === a.key ? 'outline:2px solid var(--blue)' : ''}" data-sa="${a.key}" type="button"><span>${esc(a.name)}</span><b class="num">${n}<small>개 기록</small></b><div class="bar" style="margin:8px 0 6px"><span style="width:${Math.min(100, (ch / a.limit) * 100)}%;${ch > a.limit ? 'background:var(--red)' : ''}"></span></div><span>${a.key === 'setuk' ? `고른 과목 ${pickedSubjs()}개` : `고른 글 ${ch} / ${a.limit}자`}</span></button>`; }).join('')}</div>
          <div class="row" style="gap:8px;margin-top:16px"><button class="btn primary big" style="flex:2" id="sg-new" type="button">${ic('write')} 새 활동 기록하기</button><button class="btn big" style="flex:1" id="sg-pick2" type="button">최종 고르기</button></div></section>
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
  const G3 = (ENG.g3 && ENG.g3.items) || [];
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
      const wid = 'g3:' + it.id; if (!ok) addWrong(wid, { src: 'g3', subj: 'eng', subjName: '영어', area: '고3 ' + (it.type || '독해'), sub: it.src, g3: it.id }); else if (S.wrong[wid]) clearWrong(wid);
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
    if (i < 0) { const ok = Object.values(ans).filter((x) => x.ok).length; return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}<div class="card"><h1 class="h1">${ok}/${d.qs.length} 맞혔어요</h1><p class="sub">${ok === d.qs.length ? '이 영역은 이제 괜찮아요' : '틀린 문제는 오답 노트에 들어갔어요'}</p><div class="row"><button class="btn primary big" data-go="hw" type="button">숙제로</button><button class="btn big" data-go="wrong" type="button">오답 노트</button></div></div></div>`; }
    const q = d.qs[i], a = ans[i]; UI.run.i = i;
    return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}<div class="progress-dots">${d.qs.map((_, k) => `<i class="${ans[k] ? (ans[k].ok ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card"><div class="q-no">${i + 1}번 <span class="tag blue">${esc(d.title || '선생님이 낸 문제')}</span></div>${q.img ? `<img class="q-img" style="margin-top:12px" src="${esc(q.img)}" alt="">` : ''}<div style="margin-top:8px">${qBody(q)}</div></div>
      ${choicesHtml(q, a ? a.pick : null)}${a ? verdict(a.ok) + (q.exp ? `<div class="explain"><b>해설</b><br>${esc(q.exp)}</div>` : '') + `<div class="cta-bar"><button class="btn primary big block" id="next" type="button">${d.qs.some((_, k) => !ans[k]) ? '다음 문제' : '결과 보기'}</button></div>` : ''}</div>`;
  }
  function bindDrill() {
    const d = allDrills().find((x) => x.id === UI.run.id); if (!d) return; const i = UI.run.i, q = d.qs[i];
    $$('[data-pick]').forEach((b) => (b.onclick = () => { const k = +b.dataset.pick, ok = k === q.answer; S.drillAns = S.drillAns || {}; (S.drillAns[d.id] = S.drillAns[d.id] || {})[i] = { pick: k, ok, at: Date.now() }; const wid = `drill:${d.id}:${i}`; if (!ok) addWrong(wid, { src: 'drill', subj: d.subj, subjName: SUBJ_NAMES[d.subj], area: d.area || '기타', sub: (q.q || '').slice(0, 40), title: `${d.title || d.area} ${i + 1}번`, set: d.id, i }); else if (S.wrong[wid]) clearWrong(wid); save('drillAns'); render(); }));
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
    return `<section class="card c8"><div class="card-h"><h2>매일 기록 ${L.length}</h2></div>
        <div class="chips" style="margin-bottom:12px"><button class="chip ${f === 'all' ? 'on' : ''}" data-lf="all" type="button">전체</button>${[...new Set(L.map((x) => x.subj))].map((s) => `<button class="chip ${f === s ? 'on' : ''}" data-lf="${esc(s)}" type="button">${esc(s)}</button>`).join('')}</div>
        ${LL.length ? Object.entries(byDate).map(([d, xs]) => `<div class="eyebrow" style="margin:12px 0 4px">${md(d)}</div><div class="list">${xs.map((x) => `<div class="li"><div class="body"><div class="t" style="font-size:15px;font-weight:500;line-height:1.6">${esc(x.text)}</div><div class="d">${esc(x.subj)}${x.kind ? ' · ' + esc(x.kind) : ''}${x.used ? ' · <span class="blue">세특으로 키움</span>' : ''}</div></div><button class="btn sm soft" type="button" data-grow="${esc(x.id)}">세특으로 키우기</button><button class="btn sm" type="button" data-ldel="${esc(x.id)}" aria-label="지우기">지우기</button></div>`).join('')}</div>`).join('') : `<div class="empty">${ic('write')}<b>아직 기록이 없어요</b><span>홈 맨 위 칸에 오늘 한 것을 한 줄씩 적어 보세요</span></div>`}</section>
      <section class="card c4"><div class="card-h"><h2>${sem}학기 과목별 기록</h2></div><p class="tiny" style="margin:-4px 0 8px">공통과목 세특은 1·2학기가 500자 한 칸을 나눠 써요. 학기마다 거리가 있어야 해요</p><div class="list">${cover.map((c) => `<div class="li" style="padding:8px 0"><div class="body"><span class="t" style="font-size:14px">${esc(c.s)}</span></div><span class="tag ${c.n ? 'blue' : 'red'}">${c.n ? c.n + '개' : '아직 없음'}</span></div>`).join('')}</div></section>`;
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
    if (top && top[1] >= 2) out.push({ icon: 'down', tone: 'red', t: `${top[0]} 영역이 아직 부족해요`, d: `오답 ${top[1]}문제가 남아 있어요. 다시 풀어서 파란색으로 바꿔요`, act: 'go:wrong' });
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
  // ───────── 대학별 합격선 (생명 계열, 9등급제 지난 입결) ─────────
  const ADMIT = D.admit || null;
  const admitOf = (id) => (ADMIT && ADMIT.unis.find((x) => x.id === id)) || null;
  const g2 = (v) => (v == null ? '-' : (+v).toFixed(2));
  function trackRow(t) {
    const cut = t.type === '정시' ? (t.pct70 != null ? `백분위 ${t.pct70}` : '-') : t.cut70 != null ? `70% ${g2(t.cut70)}` : t.avg != null ? `평균 ${g2(t.avg)}` : '-';
    const noMin = !t.min || /^(없음|해당 없음)/.test(t.min);
    return `<div class="li btnlike" data-du="${esc(t._u || '')}" style="align-items:flex-start"><span class="tag ${t.type === '교과' ? 'blue' : t.type === '종합' ? 'green' : ''}" style="flex:none">${esc(t.type)}</span><div class="body"><div class="t" style="font-size:15px">${esc(t.name)}${t.seats ? ` <span class="tiny">${t.seats}명</span>` : ''}</div>${t.type === '정시' ? '' : `<div class="d" style="line-height:1.6">${noMin ? '수능최저 없음' : '수능최저 ' + esc(t.min)}</div>`}</div><b class="num" style="flex:none;font-size:15px">${cut}</b><span class="chev"></span></div>`;
  }
  function admitCard(cls) {
    if (!ADMIT) return '';
    const u = uniOf(S.profile.uni), a = u && admitOf(u.id);
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('target')} ${a ? `${esc(u.short || u.name)} ${esc(a.dept)} 합격선` : '대학별 합격선'}</h2><button class="more" id="ad-all" type="button">24개 대학 비교</button></div>
      ${a ? `<p class="tiny" style="margin:0 0 8px">${esc(a.year)} 입결 · 9등급제 기준이라 참고용이에요</p><div class="list">${a.tracks.map((t) => trackRow({ ...t, _u: a.id })).join('')}</div>` : `<div class="empty">${ic('target')}<b>목표 대학을 고르면 그 대학 합격선이 나와요</b></div>`}</section>`;
  }
  function admitSheet() {
    const f = { v: '교과' };
    sheet(`<h2>생명 계열 대학별 합격선</h2><p class="sub">${esc(ADMIT.note)}</p><div class="chips" id="ad-t"></div><div id="ad-b" style="margin-top:12px"></div>`, (el) => {
      const draw = () => {
        $('#ad-t', el).innerHTML = ['교과', '종합', '정시'].map((k) => `<button class="chip ${f.v === k ? 'on' : ''}" type="button" data-at="${k}">${k}</button>`).join('');
        $$('[data-at]', el).forEach((b) => (b.onclick = () => { f.v = b.dataset.at; draw(); }));
        const key = (t) => (f.v === '정시' ? (t.pct70 != null ? -t.pct70 : 999) : t.cut70 != null ? t.cut70 : t.avg != null ? t.avg : 999);
        const rows = ADMIT.unis.flatMap((x) => x.tracks.filter((t) => t.type === f.v).map((t) => ({ x, t }))).sort((p, q) => key(p.t) - key(q.t));
        $('#ad-b', el).innerHTML = rows.length ? `<div class="list">${rows.map(({ x, t }) => { const u = uniOf(x.id); return `<div class="li btnlike" data-du="${esc(x.id)}" style="align-items:flex-start">${u ? emb(u, 'sm') : ''}<div class="body"><div class="t" style="font-size:15px">${esc((u && u.short) || x.name)} <span class="tiny">${esc(x.dept)}</span></div><div class="d" style="line-height:1.6">${esc(t.name)}${t.seats ? ` · ${t.seats}명` : ''}${f.v === '정시' ? '' : `<br>${!t.min || /^(없음|해당 없음)/.test(t.min) ? '수능최저 없음' : '수능최저 ' + esc(t.min)}`}</div></div><b class="num" style="flex:none;font-size:15px">${f.v === '정시' ? (t.pct70 != null ? t.pct70 : '-') : t.cut70 != null ? g2(t.cut70) : t.avg != null ? '평균 ' + g2(t.avg) : '-'}</b><span class="chev"></span></div>`; }).join('')}</div><p class="tiny" style="margin-top:12px">눌러서 대학별 자세히 보기 · ${f.v === '정시' ? '국·수·탐 백분위 70%컷이에요. 높을수록 어려워요' : '숫자는 합격자 내신 70%컷(없으면 평균)이에요. 낮을수록 어려워요'} · ${esc(ADMIT.updated)} 조사</p>` : '<div class="empty"><b>자료가 없어요</b></div>';
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
    const nm = (u && u.short) || a.name.replace('대학교', '대');
    const subs = (PICKS.subjects || []).filter((x) => (x.unis || []).some((t) => t.startsWith(nm)));
    const tr = (t) => { const noMin = !t.min || /^(없음|해당 없음)/.test(t.min); const nums = t.type === '정시' ? [['백분위 70%', t.pct70]] : [['50%컷', t.cut50], ['70%컷', t.cut70], ['평균', t.avg]]; return `<div class="ad-tr"><div class="row between" style="gap:8px"><b style="font-size:16px">${esc(t.name)}</b><span class="tag ${t.type === '교과' ? 'blue' : t.type === '종합' ? 'green' : ''}">${esc(t.type)}</span></div>
      <div class="ad-nums">${nums.map(([k, v]) => `<div><span>${k}</span><b class="num">${v == null ? '-' : t.type === '정시' ? v : g2(v)}</b></div>`).join('')}${t.seats ? `<div><span>모집</span><b class="num">${t.seats}명</b></div>` : ''}</div>
      ${t.type === '정시' ? '' : `<p class="ad-min ${noMin ? '' : 'on'}"><b>수능최저</b> ${noMin ? '없음' : esc(t.min)}</p>`}${t.memo ? `<p class="ad-memo-t">${esc(t.memo)}</p>` : ''}${t.src ? `<a class="tiny" href="${esc(t.src)}" target="_blank" rel="noopener">입시 결과 원문</a>` : ''}</div>`; };
    sheet(`<div class="row" style="gap:12px;margin-bottom:8px">${u ? emb(u, 'md') : ''}<div><h2 style="margin:0">${esc(a.name)}</h2><p class="tiny" style="margin:2px 0 0">${esc(a.dept)} · ${esc(a.year)} 입결</p></div></div>
      <div class="deep" style="margin:12px 0 16px"><p style="margin:0">${esc(ADMIT.note)}</p></div>
      ${a.tracks.map(tr).join('')}
      ${subs.length ? `<div class="eyebrow" style="margin-top:20px">이 대학이 권하는 고2 과목</div><div class="list">${subs.map((x) => `<div class="li"><div class="body"><div class="t" style="font-size:15px">${esc(x.name)}</div><div class="d">${esc((x.unis || []).find((t) => t.startsWith(nm)) || '')}</div></div><span class="tag ${x.level === '핵심' ? 'blue' : ''}">${esc(x.level || '')}</span></div>`).join('')}</div>` : ''}
      ${newsRows(NEWS_ALL().filter((n) => n.uni === id).sort((p, q) => String(q.date).localeCompare(String(p.date))))}
      <div class="row" style="margin-top:20px"><button class="btn big" style="flex:1" data-back type="button">‹ 대학 비교</button>${S.profile.uni === id ? '' : `<button class="btn primary big" style="flex:1" id="ud-goal" type="button">목표로 정하기</button>`}</div>`, (el, close) => {
      bindDetail(el, admitSheet);
      const g = $('#ud-goal', el); if (g) g.onclick = () => { S.profile.uni = id; save('profile'); close(); render(); toast(`${nm} 목표, 응원해요`); };
    });
  }
  function pickDetail(kind, i) {
    const x = (PICKS[kind] || [])[i]; if (!x) return;
    const T = { subjects: '고2 과목 선택', topics: '탐구 주제', timeline: '일정', checklist: '채울 것', books: '책' };
    let body = '';
    if (kind === 'subjects') body = `<h2>${esc(x.name)} <span class="tag ${x.level === '핵심' ? 'blue' : ''}">${esc(x.level || '')}</span></h2><p class="ls-p">${esc(x.why || '')}</p>${x.school ? `<div class="deep"><div class="eyebrow">경화여고에서는</div><p style="margin:4px 0 0">${esc(x.school)}</p></div>` : ''}
      ${(x.unis || []).length ? `<div class="eyebrow" style="margin-top:20px">대학마다</div><div class="list">${x.unis.map((t) => { const a = ADMIT && ADMIT.unis.find((y) => t.startsWith((uniOf(y.id) || {}).short || '@')); return `<div class="li ${a ? 'btnlike' : ''}" ${a ? `data-du="${esc(a.id)}"` : ''}>${a && uniOf(a.id) ? emb(uniOf(a.id), 'sm') : ''}<div class="body"><div class="t" style="font-size:15px">${esc(t)}</div>${a ? '<div class="d">눌러서 합격선 보기</div>' : ''}</div>${a ? '<span class="chev"></span>' : ''}</div>`; }).join('')}</div>` : ''}${newsRows(newsLike([x.name, '권장과목', '권장 과목']))}`;
    else if (kind === 'topics') body = `<p class="tiny" style="margin:0 0 4px">${esc(x.subj)} · ${esc(x.unit)}</p><h2>${esc(x.idea)}</h2>${x.how ? `<div class="eyebrow" style="margin-top:16px">어떻게 해요</div><p class="ls-p">${esc(x.how)}</p>` : ''}${x.link ? `<div class="deep"><div class="eyebrow">생명공학과 이어지는 점</div><p style="margin:4px 0 0">${esc(x.link)}</p></div>` : ''}<p class="tiny" style="margin-top:16px">수업 발표·보고서·수행평가로 해야 세특에 적혀요. 해 본 뒤 생기부 탭에 기록해 두면 좋아요</p>`;
    else if (kind === 'timeline') body = `<span class="tag">${esc(x.when)}</span><h2 style="margin-top:8px">${esc(x.title)}</h2><p class="ls-p">${esc(x.what || '')}</p>${x.why ? `<div class="deep"><div class="eyebrow">왜 중요해요</div><p style="margin:4px 0 0">${esc(x.why)}</p></div>` : ''}${newsRows(newsLike((x.title || '').split(/[ ·,()]+/).filter((w) => w.length >= 3)))}`;
    else if (kind === 'checklist') body = `<span class="tag">${esc(x.area || '')}${x.term ? ' · ' + esc(x.term) : ''}</span><h2 style="margin-top:8px">${esc(x.title)}</h2><p class="ls-p">${esc(x.detail || '')}</p>`;
    else body = `<h2>${esc(x.title)}</h2><p class="tiny" style="margin:-4px 0 12px">${esc(x.author || '')}${x.level ? ' · ' + esc(x.level) : ''}${x.popular ? ' · ' + esc(x.popular) : ''}</p><p class="ls-p">${esc(x.why || '')}</p>${x.seteuk ? `<div class="deep"><div class="eyebrow">세특으로 잇기</div><p style="margin:4px 0 0">${esc(x.seteuk)}</p></div>` : ''}${x.subj ? `<p class="tiny" style="margin-top:12px">관련 과목: ${esc(x.subj)}</p>` : ''}`;
    sheet(`<p class="eyebrow" style="margin:0 0 8px">${ic('pill')} 생명공학 픽 · ${T[kind]}</p>${body}${srcList(x.src)}<button class="btn big block" style="margin-top:20px" data-back type="button">‹ ${T[kind]} 목록</button>`, (el) => bindDetail(el, () => picksSheet(kind)));
  }

  // ───────── 생명공학 픽 ─────────
  function picksCard(cls) {
    const subs = (PICKS.subjects || []).slice(0, 6), tops = (PICKS.topics || []).filter((x) => /중화|산과 염기|전기|전자기|발전|대한민국/.test((x.unit || '') + (x.idea || ''))).slice(0, 2);
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('pill')} 생명공학 픽</h2><button class="more" id="pk-all" type="button">전체 보기</button></div>
      ${subs.length ? `<div class="eyebrow">고2에 고르면 좋은 과목</div><div class="row wrap" style="margin:8px 0 16px">${subs.map((x, i) => `<button type="button" class="tag tag-btn ${x.level === '핵심' ? 'blue' : ''}" data-pk="subjects:${i}">${esc(x.name)}${x.level ? ' · ' + esc(x.level) : ''}</button>`).join('')}</div>` : ''}
      ${tops.length ? `<div class="eyebrow">이번 시험 범위로 해 볼 탐구</div><div class="list">${tops.map((x) => `<div class="li btnlike" data-pk="topics:${(PICKS.topics || []).indexOf(x)}" style="align-items:flex-start"><div class="body"><div class="t" style="font-size:15px">${esc(x.idea)}</div><div class="d">${esc(x.subj)} · ${esc(x.unit)}</div></div><span class="chev"></span></div>`).join('')}</div>` : ''}
      ${!subs.length && !tops.length ? `<div class="empty">${ic('pill')}<b>생명공학 준비 자료를 모으는 중이에요</b></div>` : ''}</section>`;
  }
  function picksSheet(start) {
    const P = PICKS; const tab = { v: typeof start === 'string' ? start : 'subjects' };
    const T = [['subjects', '과목 선택'], ['topics', '탐구 주제'], ['timeline', '일정'], ['checklist', '채울 것'], ['books', '책']];
    sheet(`<h2>생명공학 픽</h2><p class="sub">생명공학과 가려면 무엇을 언제 챙기는지 모았어요${P.updated ? ` · ${md(P.updated)} 기준` : ''}</p><div class="chips" id="pk-t"></div><div id="pk-b" style="margin-top:12px"></div>`, (el) => {
      const draw = () => {
        $('#pk-t', el).innerHTML = T.map(([k, n]) => `<button class="chip ${tab.v === k ? 'on' : ''}" type="button" data-pt="${k}">${n}</button>`).join('');
        $$('[data-pt]', el).forEach((b) => (b.onclick = () => { tab.v = b.dataset.pt; draw(); }));
        const L = P[tab.v] || [];
        const row = (t, d, tag) => `<div class="li btnlike" data-pd="${L.indexOf(cur)}" style="align-items:flex-start"><div class="body"><div class="t" style="line-height:1.5">${t}</div>${d ? `<div class="d" style="line-height:1.6;margin-top:2px">${d}</div>` : ''}</div>${tag || ''}</div>`;
        let cur; $('#pk-b', el).innerHTML = L.length ? `<div class="list">${L.map((x) => (cur = x, tab.v === 'subjects') ? row(esc(x.name), esc(x.why || '') + (x.unis && x.unis.length ? `<br><span class="tiny">${esc(x.unis.join(', '))}</span>` : ''), `<span class="tag ${x.level === '핵심' ? 'blue' : ''}">${esc(x.level || '')}</span>`)
          : tab.v === 'topics' ? row(esc(x.idea), `${esc(x.subj)} · ${esc(x.unit)}${x.how ? '<br>' + esc(x.how) : ''}${x.link ? `<br><span class="blue">${esc(x.link)}</span>` : ''}`)
          : tab.v === 'timeline' ? row(esc(x.title), esc(x.what || '') + (x.why ? '<br>' + esc(x.why) : ''), `<span class="tag">${esc(x.when)}</span>`)
          : tab.v === 'checklist' ? row(esc(x.title), esc(x.detail || ''), `<span class="tag">${esc(x.area || '')}</span>`)
          : row(`${esc(x.title)} <span class="tiny">${esc(x.author || '')}</span>`, esc(x.why || '') + (x.seteuk ? `<br><span class="tiny"><b>세특으로</b> ${esc(x.seteuk)}</span>` : '') + (x.subj ? `<br><span class="tiny">${esc(x.subj)}${x.popular ? ' · ' + esc(x.popular) : ''}</span>` : ''), x.level ? `<span class="tag ${x.level === '쉬움' ? 'green' : x.level === '도전' ? 'red' : 'blue'}">${esc(x.level)}</span>` : '')).join('')}</div>` : `<div class="empty"><b>준비 중이에요</b></div>`;
        $$('[data-pd]', el).forEach((b) => (b.onclick = () => pickDetail(tab.v, +b.dataset.pd)));
      };
      draw();
    });
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
  function editField(k) {
    const p = S.profile; const F = {
      name: ['이름', 'text'], birth: ['생일', 'date'], mbti: ['MBTI', 'mbti'], motto: ['나의 한마디', 'text', '예) 오늘 한 줄이 내일의 세특'], likes: ['좋아하는 과목', 'text', '예) 통합과학, 영어'], school: ['학교', 'text'], grade: ['학년·반', 'grade'], major: ['목표 학과', 'text', '예) 생명공학과'],
      goalMock: ['모의고사 목표 등급', 'sel', [1, 1.5, 2, 2.5, 3, 3.5, 4]], goalNaesin: ['내신 목표 등급', 'sel', [1, 1.2, 1.5, 1.8, 2, 2.5, 3]] }[k];
    if (!F) return;
    const [label, type, opt] = F;
    const body = type === 'mbti' ? `<div class="mbti-grid">${MBTI.map((m) => `<button type="button" class="${p.mbti === m ? 'on' : ''}" data-mb="${m}">${m}</button>`).join('')}</div>`
      : type === 'grade' ? `<div class="row" style="gap:12px"><div class="field" style="flex:1"><label>학년</label><select class="inp" id="ef-g">${[1, 2, 3].map((g) => `<option ${+p.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>반</label><input class="inp" id="ef-c" inputmode="numeric" value="${esc(p.cls)}"></div></div>`
      : type === 'sel' ? `<div class="chips" style="flex-wrap:wrap">${opt.map((g) => `<button type="button" class="chip ${+p[k] === g ? 'on' : ''}" data-sv="${g}">${g}등급</button>`).join('')}</div>`
      : `<input class="inp" id="ef-v" type="${type}" value="${esc(p[k] || '')}" placeholder="${esc(opt || '')}">`;
    sheet(`<h2>${label}</h2>${body}<div class="row" style="margin-top:20px"><button class="btn big" style="flex:1" data-x type="button">닫기</button>${type === 'mbti' || type === 'sel' ? '' : '<button class="btn primary big" style="flex:1" id="ef-ok" type="button">저장</button>'}</div>`, (el, close) => {
      const done = () => { save('profile'); close(); render(); toast('바꿨어요'); };
      $('[data-x]', el).onclick = close;
      $$('[data-mb]', el).forEach((b) => (b.onclick = () => { p.mbti = b.dataset.mb; done(); }));
      $$('[data-sv]', el).forEach((b) => (b.onclick = () => { p[k] = +b.dataset.sv; done(); }));
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
    s += `<path d="${area}" fill="url(#tg${opt.id || ''})"/><path d="${line}" class="main-l" stroke="${opt.color || '#3182f6'}"/>`;
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
    return `<section class="card c6"><div class="card-h"><h2>한 등급 올리려면</h2></div><div class="list">${rows.map(({ ms, r, next, need }) => `<div class="li" style="flex-direction:column;align-items:stretch;gap:8px;padding:12px 0"><div class="row between"><b style="font-size:15px">${esc(ms.name)} <span class="muted" style="font-weight:500">${r.grade}등급 · ${r.raw}점</span></b><span class="${need ? 'blue' : 'muted'}" style="font-size:14px;font-weight:700">${r.grade === 1 ? '1등급이에요' : need != null ? `${r.grade - 1}등급까지 ${need}점` : ''}</span></div><div class="range"><span class="fill" style="width:${(r.raw / r.total) * 100}%"></span>${next != null ? `<i class="cut" style="left:${(next / r.total) * 100}%"></i>` : ''}<i class="dot" style="left:${(r.raw / r.total) * 100}%"></i></div><div class="row between tiny"><span>0점</span><span>${r.total}점</span></div></div>`).join('')}</div></section>`;
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
      ${cur ? `<section class="card c6"><div class="card-h"><h2>과목별 등급</h2><span class="tiny">${esc(cur.title)}</span></div>${gradeBars(cur.g, goal)}</section>` : ''}
      ${m ? cutBars(m) : ''}
    </div>`;
  }

  // ───────── 틀 · 메뉴 ─────────
  const TABS = [['home', '홈', 'home'], ['hw', '숙제', 'hw'], ['wrong', '오답', 'wrong'], ['score', '성적', 'score'], ['sgb', '생기부', 'sgb']];
  function nav() {
    const cnt = { hw: (() => { const st = dayStat(sciToday()); return (st.n - st.done > 0 ? 1 : 0) + hwNow().length; })(), wrong: openWrong().length };
    const btn = (t, bottom) => `<button type="button" class="${UI.tab === t[0] ? 'on' : ''}" data-go="${t[0]}">${bottom ? `<img src="icons/${IC[t[2]]}.svg" alt="">` : ''}${t[1]}${cnt[t[0]] ? `<span class="cnt">${cnt[t[0]] > 99 ? '99+' : cnt[t[0]]}</span>` : ''}</button>`;
    $('#tabs-top').innerHTML = TABS.map((t) => btn(t, false)).join('');
    $('#tabs-bottom').innerHTML = TABS.map((t) => btn(t, true)).join('');
    const u = uniOf(S.profile.uni);
    $('#me').innerHTML = `<span>${esc(S.profile.name)}${TEACHER ? ' · 선생님 보기' : ''}</span>${avatarHtml('sm')}`;
  }
  const main = $('#main');
  function render() {
    // 1학년 2학기는 아직 학기 최종 등급이 없어서, 먼저 넣은 등급은 중간고사 등급으로 옮겨요 (한 번만)
    if (S.naesin && S.naesin['1-2'] && !S.naesin._mid12) { for (const r of Object.values(S.naesin['1-2'])) if (r && r.grade && r.midG == null && r.finG == null) { r.midG = r.grade; delete r.grade; } S.naesin._mid12 = 1; save('naesin'); }
    nav();
    let html = '';
    if (UI.run) html = UI.run.kind === 'sci' ? sciRun() : UI.run.kind === 'unit' ? unitRun() : UI.run.kind === 'words' ? wordsRun() : UI.run.kind === 'retry' ? retryRun() : UI.run.kind === 'g3' ? g3Run() : UI.run.kind === 'drill' ? drillRun() : UI.run.kind === 'concept' ? conceptRun() : '';
    else html = UI.tab === 'home' ? home() : UI.tab === 'hw' ? (UI.lib ? libView() : hwView()) : UI.tab === 'wrong' ? wrongView() : UI.tab === 'score' ? scoreView() : UI.tab === 'me' ? meView() : sgbView();
    main.innerHTML = (TEACHER ? `<div class="teacher-band">선생님 보기 · ${esc(U.who)}의 기록을 보고 고칠 수 있어요</div>` : '') + html;
    bind();
  }
  function go(tab) { UI.tab = tab; UI.run = null; UI.lib = null; if (tab !== 'score') UI.mockId = null; render(); window.scrollTo(0, 0); }
  function startTask(k) {
    if (k === 'sci') { UI.tab = 'hw'; UI.run = { kind: 'sci' }; }
    else if (k === 'unit') { UI.tab = 'hw'; UI.run = { kind: 'unit' }; }
    else if (k === 'words') { UI.tab = 'hw'; UI.run = { kind: 'words' }; }
    else if (k === 'g3') { UI.tab = 'hw'; UI.run = { kind: 'g3' }; }
    else if (k.startsWith('drill:')) { UI.tab = 'hw'; UI.run = { kind: 'drill', id: k.slice(6) }; }
    else { UI.tab = 'hw'; UI.run = null; }
    render(); window.scrollTo(0, 0);
  }
  function bind() {
    $$('[data-go]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); if (b.dataset.seg) UI.scoreSeg = b.dataset.seg; go(b.dataset.go); }));
    $$('[data-task]').forEach((b) => (b.onclick = () => startTask(b.dataset.task)));
    $$('[data-news]').forEach((b) => (b.onclick = () => newsSheet(b.dataset.news)));
    $$('[data-cs]').forEach((b) => (b.onclick = () => { UI.chartSubj = b.dataset.cs; render(); }));
    const h = $('#hero'); if (h) h.onclick = uniSheet;
    if (!UI.run && UI.tab === 'me') bindMe();
    $$('[data-seg]').forEach((b) => { if (!b.dataset.go) b.onclick = () => { UI.scoreSeg = b.dataset.seg; UI.mockId = null; render(); }; });
    $$('[data-mock]').forEach((b) => (b.onclick = () => { UI.mockId = b.dataset.mock; render(); window.scrollTo(0, 0); }));
    $$('[data-mdel]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); S.mockManual = (S.mockManual || []).filter((x) => x.id !== b.dataset.mdel); save('mockManual'); render(); }));
    const ma = $('#mk-add'); if (ma) ma.onclick = () => quickGradeSheet('__new');
    $$('#qg-open').forEach((b) => (b.onclick = () => quickGradeSheet()));
    $$('[data-ws]').forEach((b) => (b.onclick = () => { UI.wrongSubj = b.dataset.ws; render(); }));
    $$('[data-wr]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'retry', id: b.dataset.wr, queue: [] }; render(); window.scrollTo(0, 0); }));
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
    if (UI.run) { if (UI.run.kind === 'sci') bindSci(); if (UI.run.kind === 'unit') bindUnit(); if (UI.run.kind === 'words') bindWords(); if (UI.run.kind === 'retry') bindRetry(); if (UI.run.kind === 'g3') bindG3(); if (UI.run.kind === 'drill') bindDrill(); if (UI.run.kind === 'concept') bindConcept(); }
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
    $$('main [data-du]').forEach((b) => (b.onclick = () => uniDetail(b.dataset.du)));
    $$('[data-pk]').forEach((b) => (b.onclick = () => { const [k, i] = b.dataset.pk.split(':'); pickDetail(k, +i); }));
    if (!UI.run && UI.tab === 'sgb') bindLogs();
    if (!UI.run && UI.tab === 'score') { if (UI.scoreSeg === 'mock' && UI.mockId) bindMock(); if (UI.scoreSeg === 'naesin') bindNaesin(); }
  }
  $('#brand').onclick = () => go('home');
  let rsT = 0, lastW = window.innerWidth; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (Math.abs(window.innerWidth - lastW) > 80 && !$('.sheet')) { lastW = window.innerWidth; render(); } }, 250); });
  $('#me').onclick = () => go('me');

  // ───────── 시작 ─────────
  window.__univStarted = true;
  render();
  const sp = $('#splash'); if (sp) { sp.style.opacity = 0; setTimeout(() => sp.remove(), 320); }
  const bm = $('#boot-msg'); if (bm) bm.remove();
  if (!S.profile.uni && !TEACHER) setTimeout(uniSheet, 600);
  sync(true);
  setInterval(() => sync(true), 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(true); });
  // 선생님 보기에서 테마 확인용: ?theme=dark
})();
