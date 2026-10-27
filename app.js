/* 말랑대학 — 고1 정윤 대시보드 (숙제 · 오답 · 성적 · 생기부 · 입시 소식)
   기록은 서버(univ_get/univ_put)에 학생 이름으로 저장하고, 이 기기에도 같이 둡니다.
   화면 결은 토스 앱: 회색 바탕 · 흰 카드 · 파랑 하나. 화면 글자에 줄표를 쓰지 않습니다. */
(() => {
  const U = window.UNIV, D = U.data || {};
  const ROLE_T = U.role === 'teacher' || U.role === 'admin';
  // 선생님이 「정윤이 화면으로 보기」를 누르면 학생 화면을 그대로 보여 줌. 보기만 하고 아무것도 저장하지 않아요
  const PEEK = ROLE_T && (() => { try { return sessionStorage.getItem('mu:peek') === '1'; } catch (e) { return false; } })();
  const TEACHER = ROLE_T && !PEEK;
  const KEY = 'mallang-univ:state:' + U.who;
  // 학생마다 다른 설정 (content/students.json): 용돈은 정윤만(가족), 보이는 탭, 말랑영어(초등)
  const ST = D.student || { name: U.who, edition: 'univ', wallet: true };
  const WALLET = ST.wallet !== false;
  const TUTOR = !!ST.tutor;  // 과외 학생: 홈이 「다음 수업」 중심, 숙제는 수업 때 정한 천일문 유닛
  const BRAND = ST.edition === 'english' ? '말랑영어' : '말랑대학';
  const NM = () => (typeof S !== 'undefined' && S.profile && S.profile.name) || U.who;
  const jongOf = (n) => { const c = n.charCodeAt(n.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
  const NMI = () => NM() + (jongOf(NM()) ? '이' : '');  // 「정윤이」「지원이」「주아」
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tap = { el: null, at: 0 };  // 마지막으로 누른 것 (뒤로 가기 방향 · 고른 칸 톡 튀기)
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const IC = { home: '1f3e0', hw: '1f4dd', wrong: '1f4d2', score: '1f4ca', sgb: '1f4cb', target: '1f3af', sci: '1f9ea', eng: '1f4d6', fire: '1f525', x: '274c', ok: '2705', up: '1f4c8', down: '1f4c9', star: '2b50', trophy: '1f3c6', cal: '1f4c5', retry: '1f501', bulb: '1f4a1', school: '1f3eb', grad: '1f393', ghost: '1f47b', party: '1f389', pin: '1f4cc', compass: '1f9ed', muscle: '1f4aa', brain: '1f9e0', clock: '23f0', hundred: '1f4af', think: '1f914', spark: '2728', mic: '1f3a4', books: '1f4da', pencil: '270f', write: '270d', dna: '1f9ec', pill: '1f48a', news: '1f4f0', bell: '1f514', mega: '1f4e2', memo: '1f5d2', flag: '1f6a9', q: '2753', globe: '1f30f', math: '1f4d0', abacus: '1f9ee', bank: '1f3db', run: '1f3c3', heart: '1f499', medal: '1f3c5', eyes: '1f440', scroll: '1f4dc', tomato: '1f345', gold: '1f947', coffee: '2615', timer: '23f1', glow: '1f31f', herb: '1f33f', leaf: '1f343', headph: '1f3a7', piano: '1f3b9', violin: '1f3bb', sax: '1f3b7', rain: '1f327', wave: '1f30a', coin: '1f4b0', bag: '1f4b0', gift: '1f381', cash: '1f4b5', pumpkin: '1f383', tree: '1f384', choco: '1f36b', fireworks: '1f386', love: '1f48c', clover: '1f340', crown: '1f451', snow: '2744', cake: '1f382', new: '1f195' };
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
  // W: 그 학생의 오답 기록. 선생님 화면에서는 꼭 학생 것을 넘겨요 (선생님 자기 기록을 보면 늘 「안 했어요」로 떠요 10/26)
  const hwWr = (h, W = S.wrong) => (h.wr || []).filter((id) => W && W[id]);
  const wrTried = (h, id, W = S.wrong) => { const w = W[id]; return w.cleared || (w.at || 0) > (h.at || 0); };
  const hwDone = (h, W = S.wrong) => !!h.done || (hwWr(h, W).length > 0 && hwWr(h, W).every((id) => wrTried(h, id, W))) || (W === S.wrong && hwGoDone(h));
  // 끝낸 때: 오답 숙제는 마지막으로 다시 푼 때
  const hwDoneAt = (h, W = S.wrong) => h.doneAt || Math.max(0, ...hwWr(h, W).map((id) => Math.max(W[id].clearedAt || 0, W[id].at || 0)));
  // 오늘 풀 오답: 오늘까지 낸 오답 숙제에서 아직 안 푼 것만 (전체 개수는 보여 주지 않아요)
  // + 그날 푼 것 중 틀린 건 바로 다 오늘 풀 오답에 (10/27 선생님 «그날그날 틀린 건 바로 다 오답 노트로»)
  //   모의고사(정윤)만 한꺼번에 많으면 힘들어서 하루 3문제씩 (선생님 오답 숙제 그대로)
  const wrFirst = (w) => w.first || w.at || 0;
  const todayWr = () => { const out = [], t = today(); for (const h of (S.hw || []).filter((x) => !x.done && (!x.due || x.due <= t))) for (const id of hwWr(h)) if (!wrTried(h, id) && !out.includes(id)) out.push(id);
    for (const [id, w] of Object.entries(S.wrong || {}).filter(([id, w]) => !w.cleared && w.src !== 'mock' && !String(id).startsWith('mock:') && !out.includes(id)).sort((a, b) => wrFirst(a[1]) - wrFirst(b[1]))) out.push(id); return out; };
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
  const blank = () => ({ profile: { name: U.who, school: ST.school || (TUTOR ? '' : (D.school && D.school.name) || '경화여자고등학교'), grade: ST.grade || 1, cls: '', uni: '', major: TUTOR ? '' : '생명공학과', goalMock: 2, goalNaesin: 2 }, mock: {}, mockManual: [], naesin: {}, sci: { days: {} }, eng: { unit: 0, wordDay: 0, days: {} }, wrong: {}, hw: [], sgb: [], pomo: { days: {}, goal: 4 }, wallet: { log: [], paid: [], req: null, seen: {} }, book: { marks: {}, seen: {}, pin: {}, last: {} }, _at: {} });
  let S = blank();
  try { const l = JSON.parse(localStorage.getItem(KEY)); if (l) S = Object.assign(blank(), l); } catch (e) {}
  const STU_TAB = !!U.tabStu;  // 대시보드에서 연 학생 탭
  const UI = { tab: TEACHER && !STU_TAB && (D.students || []).length > 1 ? 'dash' : 'home', view: null, scoreSeg: 'mock', mockId: null, mockSubj: 'kor', wrongSubj: 'all', chartSubj: 'avg', run: null, sgbArea: 'all', semester: '1-2', newsAll: false };
  let pushT = null;
  // 날짜별 기록은 통째로 바꾸지 않고 합쳐요: 같은 날이면 더 많이 한 쪽, 답은 둘 다
  const nAns = (d) => d ? Object.keys(d.ans || {}).length + Object.keys(d.uans || {}).length + Object.keys(d.uans2 || {}).length + Object.keys(d.wans || {}).length + (d.udone ? 5 : 0) + (d.udone2 ? 5 : 0) + (d.g3done ? 5 : 0) + (d.read ? 1 : 0) : -1;
  const mergeDays = (a = {}, b = {}) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) { const u = o[k]; if (!u) { o[k] = v; continue; } const [hi, lo] = nAns(v) > nAns(u) ? [v, u] : [u, v]; const m = { ...hi }; for (const f of ['ans', 'uans', 'uans2', 'wans']) if (hi[f] || lo[f]) m[f] = (hi.unit === lo.unit && hi.words === lo.words && hi.c === lo.c) ? { ...(lo[f] || {}), ...(hi[f] || {}) } : hi[f]; o[k] = m; } return o; };
  const mergeUa = (a = {}, b = {}) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = { ...(o[k] || {}), ...v }; return o; };
  const jAt = (v) => (v && v.at) || 0;
  const jMerge = (r = {}, l = {}) => { const o = { ...r }; for (const [k, v] of Object.entries(l)) if (!(k in o) || jAt(v) >= jAt(o[k])) o[k] = v; return o; };  // 말랑영어 리스닝·리딩·라이팅: 칸마다 더 새것
  // 학원·과외 숙제: 기기 둘에서 고쳐도 서로 안 지워요. 숙제는 id별로, 날짜 기록은 나중에 적은 쪽, 지운 숙제는 gone에 남겨요
  // (폰에서 범위를 고치니 아이패드에서 적은 「오늘 33문제」가 통째로 사라진 사고 10/26)
  const logMerge = (a = {}, b = {}) => { const o = { ...a }; for (const [d, v] of Object.entries(b)) if (!o[d] || jAt(v) >= jAt(o[d])) o[d] = v; return o; };
  const myMerge = (r, l, rNew) => {
    const [o, n] = rNew ? [l, r] : [r, l], gone = { ...(o.gone || {}), ...(n.gone || {}) }, byO = new Map((o.items || []).map((x) => [x.id, x]));
    const items = (n.items || []).map((x) => { const y = byO.get(x.id); byO.delete(x.id); return y ? { ...y, ...x, log: logMerge(y.log, x.log), skip: { ...(y.skip || {}), ...(x.skip || {}) }, ack: { ...(y.ack || {}), ...(x.ack || {}) } } : x; });
    for (const y of byO.values()) items.push(y);
    const cls = [...(n.cls || [])]; for (const c of o.cls || []) if (!cls.some((x) => x.id === c.id)) cls.push(c);
    const books = [...(n.books || [])]; for (const b of o.books || []) if (!books.some((x) => x.cls === b.cls && x.name === b.name)) books.push(b);
    return { ...o, ...n, cls, books, gone, items: items.filter((x) => !gone[x.id]) };
  };
  const MERGE = {
    my: myMerge,
    fin: (r, l) => { const ans = { ...(r.ans || {}) }; for (const [c, v] of Object.entries(l.ans || {})) ans[c] = jMerge(ans[c] || {}, v); return { ...r, ...l, ans }; },  // 기말 개념: 문제마다 나중에 푼 쪽
    jl: jMerge, jr: jMerge, jw: jMerge,
    // 테마 선물: 두 기기 것을 테마마다 합쳐요. 연 기록이 있으면 그걸, 아니면 나중에 보내거나(at) 취소한(x) 쪽을 써요 (10/27 보낸 쿠로미가 정윤이 기기 옛 기록에 덮여 사라짐)
    gifts: (r, l) => { const by = {}, t = (y) => Math.max(y.at || 0, y.x || 0); for (const y of [...(r || []), ...(l || [])]) { if (!y || !y.skin) continue; const o = by[y.skin]; by[y.skin] = !o ? y : o.open || y.open ? { ...(t(y) > t(o) ? y : o), open: Math.max(o.open || 0, y.open || 0) } : t(y) > t(o) ? y : o; } return Object.values(by); },
    eng: (r, l) => ({ ...r, ...l, unit: Math.max(+r.unit || 0, +l.unit || 0), wordDay: Math.max(+r.wordDay || 0, +l.wordDay || 0), g3: Math.max(+r.g3 || 0, +l.g3 || 0), g3ans: { ...(r.g3ans || {}), ...(l.g3ans || {}) }, ua: mergeUa(r.ua, l.ua), days: mergeDays(r.days, l.days) }),
    sci: (r, l) => ({ ...r, ...l, days: mergeDays(r.days, l.days) }),
    ink: (r, l, rNew) => { const [o, n] = rNew ? [l, r] : [r, l], c = (l._cfgAt || 0) > (r._cfgAt || 0) ? l : (r._cfgAt || 0) > (l._cfgAt || 0) ? r : n; return { ...o, ...n, cfg: c.cfg || {}, _cfgAt: c._cfgAt || 0, st: { ...(o.st || {}), ...(n.st || {}) }, at: { ...(o.at || {}), ...(n.at || {}) }, days: { ...(o.days || {}), ...(n.days || {}) } }; },
  };
  // 서버에서 한 번 받아 오기 전에는 아무것도 「최신」으로 표시하지 않아요.
  // (로그아웃 뒤 빈 기기가 「오늘 과제」를 먼저 만들어 올려서 지난 기록을 덮은 사고 2026-10-26)
  let pulled = false;
  function save(...keys) {
    if (PEEK) return;
    if (keys.includes('profile')) careerMark();
    const now = Date.now(); S._at = S._at || {}; if (pulled) for (const k of keys) S._at[k] = now;
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
  // 서버에서 받은 것을 지금 기록에 그 자리에서 덮어써요. 새 객체로 바꾸면 열려 있는 창·화면이 옛 기록에 적어서
  // 「답해도 안 넘어가요」 「고쳐도 안 바뀌어요」가 나요 (10/26). 배열은 id가 같은 것끼리 이어 줘요
  const isObj = (v) => v && typeof v === 'object';
  function patchIn(t, s) {
    if (t === s || !isObj(t) || !isObj(s) || Array.isArray(t) !== Array.isArray(s)) return s;
    if (Array.isArray(t)) {
      const byId = new Map(t.filter((o) => isObj(o) && o.id != null).map((o) => [o.id, o]));
      const out = s.map((v, i) => { const o = isObj(v) && v.id != null ? byId.get(v.id) : isObj(v) && !Array.isArray(v) && isObj(t[i]) && !Array.isArray(t[i]) && t[i].id == null ? t[i] : null; return o ? patchIn(o, v) : v; });
      t.length = 0; t.push(...out); return t;
    }
    const src = { ...s };
    for (const k of Object.keys(t)) if (!(k in src)) delete t[k];
    for (const [k, v] of Object.entries(src)) t[k] = patchIn(t[k], v);
    return t;
  }
  // 서버에서 바뀐 게 들어오면 꼭 다시 그려요. 안 그리면 풀던 화면이 옛 기록에 답을 적어 「했는데 안 했다고」 떠요 (10/26)
  // 글자를 쓰는 중이면 안 그려요 (쓰던 답이 지워져요). 그때는 단추마다 누를 때 기록을 다시 찾아요
  const typing = () => !!document.activeElement?.matches('input, textarea, select, [contenteditable]');
  function syncRedraw() { if (!typing()) render(); }
  async function sync(redraw) {
    if (syncing) { clearTimeout(pushT); pushT = setTimeout(sync, 1500); return; }
    syncing = true;
    try {
      const remote = await rpc('univ_get', { p_student: U.who, p_code: U.key });
      let changed = false;
      if (remote && remote._at) {
        S._at = S._at || {};
        for (const k of Object.keys(remote._at)) {
          const r = remote._at[k] || 0, l = S._at[k] || 0;
          if (MERGE[k] && remote[k] && S[k]) { const m = MERGE[k](remote[k], S[k], r >= l); if (JSON.stringify(m) !== JSON.stringify(S[k])) { changed = true; S[k] = patchIn(S[k], m); } S._at[k] = Math.max(r, l); }
          else if (r > l) { S[k] = patchIn(S[k], remote[k]); S._at[k] = r; changed = true; }
        }
      }
      pulled = true;
      if (PEEK) { syncing = false; if (changed) syncRedraw(); return; } // 미리보기: 받아 오기만
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
      await rpc('univ_put', { p_student: U.who, p_code: U.key, p_data: S });
      saveSt.at = Date.now(); saveSt.off = false; paintSaveSt();
      if (changed) syncRedraw();
    } catch (e) { /* 연결이 안 되면 이 기기에만 저장하고, 다음에 다시 맞춤 */ if (Object.keys(S._at || {}).length) pulled = true; saveSt.off = true; saveSt.wait = false; paintSaveSt(); }
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
  // 석차 「35(10)/312」 → 등수·동점자·인원·백분위. 백분위는 학교처럼 (등수 + (동점자-1)/2) ÷ 인원 (10/27 정윤 2학기 중간: 국어 35(10)/312 → 12.7%)
  const nsRk = (t) => { const m = String(t || '').replace(/\s/g, '').match(/^(\d+)(?:\((\d+)\))?\/(\d+)$/); if (!m) return null; const rk = +m[1], tie = +(m[2] || 1), n = +m[3]; return { rk, tie, n, pct: ((rk + (tie - 1) / 2) / n) * 100, c1: Math.floor(n * 0.1), c2: Math.floor(n * 0.34), c3: Math.floor(n * 0.66) }; };
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
  const openWrong = () => wrongList().filter((w) => !w.cleared && !(w.src === 'eng' && w.ref && w.ref.v !== 2 && CH_UNITS.some((u) => u.v2)));
  const SUBJ_NAMES = { kor: '국어', math: '수학', eng: '영어', hist: '한국사', soc: '통합사회', sci: '통합과학' };
  if (TUTOR) Object.assign(SUBJ_NAMES, { hist: '역사', sci: '과학' });  // 과외 학생(윤건) 시험 오답은 중학교 역사·과학

  // ───────── 과학 매일 (3~5문제 · 틀리면 더 깊게) ─────────
  const SCI = D.science || { units: [], concepts: [] };
  // ───────── 기말 개념 (정윤): 교과서 개념 읽기 → 확인 3문제. 11/22까지 한 번 다 읽어요 ─────────
  // 한국사는 중간고사 때 마지막에 몰려 포기했어서(74점) 11/12까지 먼저 끝내요. 나머지는 섞어서 고르게
  const FIN = (D.finals || []).filter((f) => f && (f.concepts || []).length);
  const FIN_ON = !TUTOR && U.who === '정윤' && FIN.length > 0;
  const FIN_START = '2026-10-26', FIN_END = '2026-11-22', FIN_DUE = { hist: '2026-11-12', eng: '2026-11-22' }, FIN_FROM = { eng: '2026-10-27' };  // eng = 올림포스 지문 하루 한두 개
  const FIN_ALL = FIN.flatMap((f) => f.concepts.map((c) => ({ ...c, subj: f.subj, sname: f.name, book: f.book })));
  // 날마다: 마감 있는 과목(한국사 11/12 · 올림포스 지문 10/27부터 11/22)은 「남은 것 ÷ 남은 날」만큼 먼저,
  // 나머지 과목은 하루 합이 4~5개를 넘지 않게 「지금쯤 했어야 할 만큼보다 덜 한」 과목부터 (10/26)
  const FIN_ORDER = (() => {
    const Q = Object.fromEntries(FIN.map((f) => [f.subj, FIN_ALL.filter((c) => c.subj === f.subj)])), out = [], N0 = Object.fromEntries(Object.entries(Q).map(([k, v]) => [k, v.length]));
    const dd = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5), endD = dd(FIN_START, FIN_END), put = (sj, d) => { const c = Q[sj].shift(); c.fday = d; out.push(c); };
    for (let d = 0; out.length < FIN_ALL.length && d < 400; d++) {
      const used = {}; let forced = 0;
      for (const sj of Object.keys(FIN_DUE)) { if (!Q[sj] || d < dd(FIN_START, FIN_FROM[sj] || FIN_START)) continue; const k = Math.ceil(Q[sj].length / Math.max(1, dd(FIN_START, FIN_DUE[sj]) + 1 - d)); for (let x = 0; x < k && Q[sj].length; x++) put(sj, d); used[sj] = k; forced += k; }
      const oth = Object.keys(Q).filter((sj) => !(sj in FIN_DUE) && Q[sj].length), rem = oth.reduce((a, sj) => a + Q[sj].length, 0);
      const quota = Math.min(rem, d === 0 ? 1 : d >= endD ? rem : Math.max(1, Math.min(Math.ceil(rem / Math.max(1, endD + 1 - d)), 4 - forced)));
      for (let k = 0; k < quota; k++) { const sc = (sj) => (N0[sj] * (d + 1)) / (endD + 1) - (N0[sj] - Q[sj].length) - (used[sj] || 0) * 2, c = oth.filter((sj) => Q[sj].length).sort((a, b) => sc(b) - sc(a))[0]; if (!c) break; used[c] = (used[c] || 0) + 1; put(c, d); }
    }
    return out;
  })();
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
  // 새 천일문(10/26): 모든 학생. 예전 문제는 버려요. 개념 → 고르기 문제 4 → 짧은 독해 1, 5문제. 수준만 달라요: 윤건(lesson.level basic) 기본, 정윤·지원 수능(std). 빈칸 쓰기는 안 내요
  const CH_LV = TUTOR && (ST.lesson || {}).level === 'basic' ? 'basic' : 'std';
  const ch2Qs = (L) => !L ? [] : [
    // 빈칸 쓰기는 뺐어요: 답이 여러 개라 의미 없다고 하셨어요 (선생님 10/26). 개념 설명 → 그 개념 문제 → 짧은 독해만
    ...(false ? L.blanks || [] : []).map((b) => ({ type: '빈칸', q: `해석을 보고 빈칸에 알맞은 말을 쓰세요<br><b>${String(b.en).replace('___', '______')}</b>`, ko: b.ko, hint: b.hint, answerText: (b.answers || [])[0] || '', accept: b.answers || [], exp: [b.ko, b.hint].filter(Boolean).join(' · '), _mixed: 1 })),
    ...(L.qs || []).slice(0, (L.read && L.read.qs || []).length ? 4 : 5).map((q) => ({ ...q, _mixed: 1 })),  // 다 합쳐 5문제: 고르기 4 + 짧은 독해 1 (선생님 10/26)
    ...((L.read && L.read.qs) || []).slice(0, 1).map((q) => ({ ...q, type: '독해', passage: L.read.passage, ptitle: L.read.title, pko: L.read.ko, _mixed: 1 })),
  ];
  const CH_UNITS = (ENG.cheonil || []).flatMap((ch) => (ch.units || []).map((u) => (u.q2 ? { ...u, questions: ch2Qs(u.q2[CH_LV] || u.q2.std), concept: u.q2.concept || u.concept, v2: 1, ch: ch.ch, chTitle: ch.title } : { ...u, ch: ch.ch, chTitle: ch.title })));
  const uKey = (un) => un.ch + '-' + un.unit + (un.v2 ? ':2' : '');  // 새 문제는 기록 칸을 따로 (예전 기록과 번호가 안 섞이게)
  // 정답이 앞쪽 보기에 몰려 있어서, 문제마다 늘 같은 순서로 섞어 보여 줌
  const seeded = (str) => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
  for (const u of CH_UNITS) (u.questions || []).forEach((q, k) => { if (!q.choices || typeof q.answer !== 'number' || q._mixed || q.choices.every((c) => /^[①②③④⑤]/.test(String(c).trim()))) return; const r = seeded(`${u.ch}-${u.unit}-${k}`); const perm = q.choices.map((_, i) => i); for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; } q.choices = perm.map((i) => q.choices[i]); q.answer = perm.indexOf(q.answer); q._mixed = 1; });
  // 다시 그려도(서버와 맞출 때 등) 보기 순서가 안 바뀌게, 같은 열쇠면 늘 같은 순서로 섞어요 (10/27 정윤: 3초 뒤 보기가 바뀌어 오답)
  const sshuffle = (a, key) => { const r = seeded(String(key)); a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const WORDS = (ENG.words && ENG.words.days ? ENG.words.days : []).flatMap((d) => (d.words || []).map((w) => ({ ...w, day: d.day })));
  const G3 = (ENG.g3 && ENG.g3.items) || [];
  const MM = (ENG.mm && ENG.mm.items) || [];  // 모의고사 묶음 (고1·고2·고3 교육청, 학년 → 회차 → 문제). 푸는 화면은 고3 한 문제와 같아요
  const mmExam = (it) => String(it.src || '').split(' 전국')[0];
  // 모의고사 숙제: 이름이 곧 열쇠예요 「2026년 10월 고1 모의고사 빈칸 4문제」 → 그 회차의 그 유형 문제들 (리포트에서 고르고, 학생은 누르면 바로 풀어요)
  const MM_TY = [['빈칸', ['빈칸']], ['순서·삽입', ['순서', '삽입']], ['어법·어휘', ['어법', '어휘']], ['대의 파악', ['함축', '요지', '주제', '제목', '요약']]];
  const mmPick = (ex, ty) => MM.map((x, i) => ({ x, i })).filter((o) => mmExam(o.x) === ex && (ty === '전체' || (MM_TY.find((t) => t[0] === ty) || [, []])[1].includes(o.x.type))).map((o) => o.i);
  const mmLabel = (ex, ty, n) => `${ex} 모의고사 ${ty === '전체' ? '' : ty + ' '}${n}문제`;
  const mmOf = (title) => { if (title && typeof title === 'object') { if (title.mmq) { const ids = title.mmq.map((id) => MM.findIndex((x) => x.id === id)).filter((i) => i >= 0); return ids.length ? ids : null; } title = title.title; } const m = String(title || '').match(/^(\d{4}년 \d+월 고\d) 모의고사 (?:(빈칸|순서·삽입|어법·어휘|대의 파악) )?\d+문제$/); if (!m || !MM.length) return null; const ids = mmPick(m[1], m[2] || '전체'); return ids.length ? ids : null; };
  const mmLeft = (ids) => ids.filter((i) => !((S.eng || {}).mmans || {})[MM[i].id]);
  // 천일문 숙제: 누르면 그 유닛 문제로, 다 풀면 저절로 「했어요」 (10/26)
  function cuHwStart(h) { const no = cuOf(h.title), i = no ? CH_UNITS.findIndex((u) => +u.unit === no) : -1; if (i < 0) return false; UI.tab = 'hw'; UI.lib = null; UI.run = { kind: 'unit', ref: i, back: 'hw' }; render(); window.scrollTo(0, 0); return true; }
  function mmHwStart(h) { const ids = mmOf(h); if (!ids) return false; const L = mmLeft(ids); UI.tab = 'hw'; UI.lib = null; UI.run = { kind: 'g3', lib: (L[0] != null ? L[0] : ids[0]), mm: true, q: ids }; render(); window.scrollTo(0, 0); return true; }
  function engToday(force) {
    const t = today(); S.eng = S.eng || { unit: 0, wordDay: 0, days: {} }; S.eng.days = S.eng.days || {};
    if (!S.eng.days[t] && !anyEng() && !force) return { off: true, unit: S.eng.unit || 0, words: S.eng.wordDay || 0, g3: S.eng.g3 || 0, uans: {}, wans: {} };
    if (!S.eng.days[t]) { S.eng.days[t] = { unit: S.eng.unit || 0, words: S.eng.wordDay || 0, g3: S.eng.g3 || 0, uans: {}, wans: {} }; save('eng'); }
    if (S.eng.days[t].g3 == null) S.eng.days[t].g3 = S.eng.g3 || 0;
    engSkip(t);
    return S.eng.days[t];
  }
  // 오늘 고3 문제를 풀었나: 표시가 날아가도 답이 있으면 푼 것 (10/26 정윤 「했는데 안 했다고 떠」)
  const g3Did = (e) => !!(e && (e.g3done || (G3[e.g3 || 0] && (S.eng.g3ans || {})[G3[e.g3 || 0].id])));
  // 그날 천일문 기록: 새 문제(v2)는 uans2·udone2 칸에 따로 적어요. 예전 문제에 한 답이 새 문제 답으로 잡히지 않게 (10/26 정윤 「다 안 했는데 다 했다고 나와」)
  const uV2 = (e) => !!(CH_UNITS[(e && e.unit) || 0] || {}).v2;
  const uStore = (e) => (uV2(e) ? (e.uans2 = e.uans2 || {}) : (e.uans = e.uans || {}));
  const uDone = (e) => !!(e && (uV2(e) ? e.udone2 : e.udone));
  const wordsFor = (k) => WORDS.slice(k * 10, k * 10 + 10);
  // 「Day 1 · 21~30번」: 한 Day가 30단어라 Day만 쓰면 처음으로 돌아간 것처럼 보여요
  const wordsLabel = (k) => { const w = wordsFor(k); if (!w.length) return ''; const st = WORDS.findIndex((x) => x.day === w[0].day), a = k * 10 - st + 1; return `Day ${w[0].day} · ${a}~${a + w.length - 1}번`; };
  // 지난 날 못 한 것은 이어 하지 않고 날짜대로 다음 것으로 넘어가요 (선생님 결정 10/25). 오늘 것을 하나도 안 풀었을 때만 옮겨요
  function engSkip(t) {
    const d = S.eng.days[t], prev = Object.keys(S.eng.days).filter((k) => k < t).map((k) => S.eng.days[k]); let ch = false;
    const top = (f) => Math.max(...prev.map((v) => +v[f] || 0));
    if (!prev.length) return;
    if (!Object.keys(d.wans || {}).length && !d.wdone && prev.some((v) => v.words === d.words) && WORDS.length) { d.words = Math.min(top('words') + 1, Math.ceil(WORDS.length / 10) - 1); S.eng.wordDay = Math.max(S.eng.wordDay || 0, d.words); ch = true; }
    if (!Object.keys(uStore(d)).length && !uDone(d) && prev.some((v) => v.unit === d.unit) && CH_UNITS.length) { d.unit = Math.min(top('unit') + 1, CH_UNITS.length - 1); S.eng.unit = Math.max(S.eng.unit || 0, d.unit); ch = true; }
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
    if (sheet.dirty) { sheet.dirty = false; const y = scrollY; render(); scrollTo(0, y); }
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
      ${TUTOR ? (() => { const nx = nextLesson(), dd = nx ? dday(nx.date) : null; return `<div class="dday"><div><span>다음 수업</span><b class="num">${nx ? (dd === 0 ? '오늘' : 'D-' + dd) : '-'}</b></div><div><span>${nx ? esc(md(nx.date)) + ' ' + esc(wdName(nx.date)) : '수업 날'}</span><b class="num">${nx && nx.time ? esc(timeKo(nx.time)) : '-'}</b></div><div><span>${esc(p.school || '학교')}</span><b>${p.grade}학년${p.cls ? ' ' + esc(p.cls) + '반' : ''}</b></div></div>`; })() : `<div class="dday"><div><span>수능까지</span><b class="num">D-${dday(CSAT.date)}</b></div><div><span>${next ? esc(next.title) : '다음 일정'}</span><b class="num">${next ? 'D-' + dday(next.date) : '-'}</b></div><div><span>${esc(String(p.school || '').replace('여자고등학교', '여고').replace('고등학교', '고'))}</span><b>${p.grade}학년${p.cls ? ' ' + esc(p.cls) + '반' : ''}</b></div></div>`}
      ${TUTOR ? '' : `<button type="button" class="hero-goal" data-goalset><span class="hg-l">${ic('target')} 목표 등급</span><b>모의고사 ${S.profile.goalMock}등급</b><b>내신 ${S.profile.goalNaesin}등급</b><span class="hg-why">${goalWhy()} ›</span></button>`}
    </section>`;
    // 숙제하러 가기: 정윤이도 홈 위쪽에 길게 바로 (10/28 선생님 «목표 카드 말고 이쪽 어딘가에 길게»)
    const hwGo = TUTOR ? '' : (() => { const real = todayTasks().tasks.filter((t) => t.icon !== 'party' && !t.memo), dn = real.filter((t) => t.done).length; return real.length ? `<button class="btn primary big block c12 home-hw" data-go="hw" type="button">${dn >= real.length ? '숙제 다 했어요 · 다시 보기' : `숙제하러 가기 · ${real.length - dn}개 남았어요`}</button>` : ''; })();
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
    const sn = seasonNow(), hi = sn && sn.day === today() ? sn.hi : '';
    const main = `<h1 class="h1">${hi ? ic(sn.i) + ' ' : ''}<mark class="hl-g">${nameCall()}</mark>,<br class="br-m"> ${hi || greet()}</h1>
      <div class="row between wrap" style="gap:8px;margin-bottom:16px;min-height:36px"><p class="sub" style="margin:0">${homeLine()}</p></div>
      <div class="grid">${TUTOR ? `${fireNews()}${lessonHero()}${careerCard()}${noteCard()}${giftCard()}${growCard('c12')}${pomoCard('c12 rail-inline')}${tNewsCard('c12')}${railCards(true)}` : `${careerCard()}${missCard()}${hwGo}${giftHome()}${seasonCard()}${noteCard()}${giftCard()}${hero}${pos}${perfCard()}${finCard()}${growCard('c12')}${walletCard('c12')}${pomoCard('c12 rail-inline')}${hotCard('c12 rail-inline')}${qlogCard()}${insightCard('c7')}${schedCard('c5')}${picksCard('c5')}${admitCard('c7')}${gradeMapCard('c12')}${trend}${railCards(true)}${nscard}${sgbc}`}</div>${owned().length ? '<div class="home-set"><button type="button" data-homeset><svg class="gear" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#8b95a1" stroke="#8b95a1" stroke-width="1.8" stroke-linejoin="round" fill-rule="evenodd" d="M10.3 2h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.6.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6L2 13.7v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7zM12 15.9a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8z"/></svg>홈 화면 설정</button></div>' : ''}`;
    return `<div class="layout has-rail"><div>${main}</div><aside class="rail">${railCards(false)}</aside></div>`;
  }
  // 날마다 바뀌는 응원 한마디 (하루 동안은 같은 말)
  const CHEER = ['오늘도 정말 수고했어', '한 문제씩 쌓이는 게 다 실력이야', '어제보다 한 걸음 더 왔어', '지금 하는 게 다 남아, 잘하고 있어', '천천히 가도 괜찮아, 멈추지만 않으면 돼', '오늘 한 줄 기록이 나중에 큰 힘이 돼', '틀린 문제는 내 편이야, 다시 풀면 내 거야', '너는 생각보다 훨씬 잘하고 있어', '꾸준함이 제일 센 무기야', '힘들면 쉬어도 돼, 그래도 내일은 또 해 보자', '오늘의 노력은 절대 사라지지 않아', '목표 대학이 조금씩 가까워지고 있어', '작은 걸 해낸 것도 꼭 칭찬해 주자', '오늘도 끝까지 해낸 거 멋있어', '모르는 걸 아는 게 공부의 시작이야', '하루 30분이 1년이면 엄청난 차이야', '네가 하는 질문 하나가 세특이 돼', '조급해하지 마, 지금 속도도 충분해', '어려운 문제 앞에서 버틴 시간이 실력이야', '선생님은 늘 네 편이야', '오늘 공부한 너, 진짜 대단해', '실수는 연습일 뿐이야, 시험 땐 안 하면 돼', '한 번 더 보는 게 합격을 만들어', '지금의 너를 믿어 봐', '잘 쉬는 것도 실력이야, 푹 자', '오늘 배운 거 하나만 기억해도 성공이야'];
  // 과외 학생 홈 맨 위: 안 읽은 소식이 있으면 불타는 카드 (읽으면 사라지고 불꽃 수만 남아요)
  function fireNews() {
    if (WALLET || TEACHER || U.who !== '윤건') return '';  // 소식 읽기는 윤건이만 (10/27 «주아는 됐어 빼»)
    const N = ((D.news && D.news.items) || []).slice().sort((a, b) => (!!(b.for || []).length - !!(a.for || []).length) || (!!b.must - !!a.must) || String(b.date).localeCompare(String(a.date)));
    const n = N.find((x) => !(S.nr || {})[x.id]), c = Object.keys(S.nr || {}).length, nx = (NR_BADGE.find((x) => x[0] > c) || [0, '', ''])
    if (!n) return '';
    // 10/27 선생님 «핫뉴스 카드처럼, 조금 불타는 정도» → 불꽃 아이콘만 살짝 일렁여요
    return `<section class="card c12 hot-card link fire-lite" data-news="${esc(n.id)}"><div class="hot-ic">${ic('fire')}</div><div class="hot-b"><div class="eyebrow">오늘 꼭 읽기${(n.for || []).includes(U.who) ? ` · <b class="red">${esc(NMI())} 맞춤</b>` : ''}</div><b class="hot-t">${esc(n.title)}</b><p class="tiny" style="margin:2px 0 0">8초 읽으면 🔥 불꽃 +1${nx[0] ? ` · ${nx[0] - c}개 더 읽으면 「${esc(nx[2])}」 배지` : ''}</p><div class="nr-bdgs">${NR_BADGE.map((x) => `<span class="nr-bdg ${c >= x[0] ? 'on' : ''}" title="${esc(x[3])}">${ic(x[1])}<b>${esc(x[2])}</b><small>${x[0]}개</small></span>`).join('')}</div></div></section>`;
  }
  function nameCall() { return TUTOR ? esc(NM() + (jongOf(NM()) ? '아' : '야')) : `우리 ${esc(NMI())}`; }  // 정윤이만 「우리 정윤이」, 과외 학생은 「지원아」「주아야」
  function cheer() { const t = today(); let h = 0; for (const ch of t + (S.profile.name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return CHEER[h % CHEER.length]; }
  function greet() { return cheer(); }
  // 오늘 남은 것: 홈 문구 · 숙제 탭 배지 · 숙제 탭 맨 위 단추가 모두 이 목록 하나를 써요
  function leftItems() {
    return todayTasks().tasks.filter((t) => !t.done && t.icon !== 'party' && !t.memo).map((t) => ({ t: t.t, ic: t.icon, task: t.k, hw: t.hw }));
  }
  // 내가 쌓아 온 것: 지금까지 푼 문제·공부한 날·연속·배지 (포기하지 않게, 쌓인 게 눈에 보이게)
  function growStats() {
    const day = {}, add = (d, n) => { if (d && n > 0) day[d] = (day[d] || 0) + n; };
    let math = 0, eng = 0, sci = 0, pages = 0;
    for (const it of myS().items) for (const [d, x] of Object.entries(it.log || {})) { if (it.unit === '건' || !x.n) continue; if (it.unit === '쪽') { pages += x.n; add(d, 1); continue; } if (/수학/.test(myCls(it.cls).name) || MB_ID(it.book)) math += x.n; add(d, x.n); }
    for (const [d, v] of Object.entries((S.sci || {}).days || {})) { const n = Object.keys(v.ans || {}).length; sci += n; add(d, n); }
    for (const [d, v] of Object.entries((S.eng || {}).days || {})) { const n = Object.keys(v.uans || {}).length + Object.keys(v.wans || {}).length; eng += n; add(d, n); }
    const L = W().log, act = new Set([...Object.keys(day), ...L.filter((x) => !String(x.key).startsWith('badge') && !String(x.key).startsWith('bonus')).map((x) => x.date)]);
    let st = 0, d = act.has(today()) ? today() : addD(today(), -1); while (act.has(d)) { st++; d = addD(d, -1); }
    const wr = Object.values(S.wrong || {}).filter((x) => x.cleared).length + myS().items.reduce((a, it) => a + (it.redo || []).length, 0);
    const keys = (p) => new Set(L.filter((x) => String(x.key).startsWith(p)).map((x) => x.key)).size;
    const wk = (o) => { let n = 0; for (let i = 0; i < 7; i++) n += day[addD(today(), -i - o)] || 0; return n; };
    return { day, act, math, eng, sci, pages, all: math + eng + sci, days: act.size, st, wr, ink: keys('ink:'), news: keys('news:'), min: Object.values(pomo().days || {}).reduce((a, x) => a + (x.min || 0), 0), money: L.reduce((a, x) => a + (x.amt || 0), 0), w0: wk(0), w1: wk(7) };
  }
  const GROW_MS0 = [
    { id: 'g-p50', k: 'all', n: 50, i: 'pencil', t: '문제 50개' }, { id: 'g-p100', k: 'all', n: 100, i: 'hundred', t: '문제 100개' }, { id: 'g-p300', k: 'all', n: 300, i: 'books', t: '문제 300개' }, { id: 'g-p500', k: 'all', n: 500, i: 'glow', t: '문제 500개' }, { id: 'g-p1000', k: 'all', n: 1000, i: 'trophy', t: '문제 1000개' }, { id: 'g-p3000', k: 'all', n: 3000, i: 'crown', t: '문제 3000개' },
    { id: 'g-m100', k: 'math', n: 100, i: 'math', t: '수학 100문제' }, { id: 'g-m500', k: 'math', n: 500, i: 'math', t: '수학 500문제' }, { id: 'g-m1000', k: 'math', n: 1000, i: 'gold', t: '수학 1000문제' },
    { id: 'g-s3', k: 'st', n: 3, i: 'fire', t: '3일 연속' }, { id: 'g-s7', k: 'st', n: 7, i: 'fire', t: '7일 연속' }, { id: 'g-s30', k: 'st', n: 30, i: 'fire', t: '30일 연속' },
    { id: 'g-d10', k: 'days', n: 10, i: 'cal', t: '공부한 날 10일' }, { id: 'g-d50', k: 'days', n: 50, i: 'cal', t: '공부한 날 50일' }, { id: 'g-d100', k: 'days', n: 100, i: 'herb', t: '공부한 날 100일' },
    { id: 'g-w10', k: 'wr', n: 10, i: 'target', t: '오답 10개 정복' }, { id: 'g-w50', k: 'wr', n: 50, i: 'target', t: '오답 50개 정복' },
  ];
  const GROW_MS = TUTOR ? GROW_MS0.filter((m) => m.k !== 'math') : GROW_MS0;
  // 처음 켤 땐 이미 넘은 배지를 조용히 채워 두고, 그다음부터 새로 넘을 때만 크게 축하해요
  function growCheck(g) {
    weekCheck(g);
    S.party = S.party || {}; const fresh = GROW_MS.filter((m) => g[m.k] >= m.n && !S.party['ms:' + m.id]); if (!fresh.length) return;
    fresh.forEach((m) => (S.party['ms:' + m.id] = Date.now())); save('party');
    if (!S.party.msInit) { S.party.msInit = Date.now(); save('party'); return; }
    if (TEACHER) return;
    setTimeout(() => badgePop(fresh.map((m) => ({ id: m.id, w: 300, i: m.i, t: m.t, d: '지금까지 쌓은 게 여기까지 왔어요' }))), 1200);
  }
  function growCard(cls) {
    const g = growStats(); growCheck(g);
    const next = GROW_MS.filter((m) => g[m.k] < m.n).sort((a, b) => a.n - g[a.k] - (b.n - g[b.k]))[0];
    const D7 = Array.from({ length: 7 }, (_, i) => addD(today(), i - 6)), mx = Math.max(5, ...D7.map((d) => g.day[d] || 0));
    const csat = Math.floor(g.all / 45), up = g.w1 ? Math.round(((g.w0 - g.w1) / g.w1) * 100) : null;
    const line = !g.all ? '오늘 한 문제부터 시작해요. 쌓이는 게 여기 다 보여요' : up != null && up > 0 ? `지난주보다 ${up}% 더 했어요. 이 속도면 충분해요` : g.st >= 3 ? `${g.st}일째 이어 가고 있어요. 오늘도 하나만 더` : csat ? `수능 국어 한 회가 45문제예요. 벌써 ${csat}회 분량을 풀었어요` : '조금씩이라도 매일이 제일 세요';
    const T = [['math', '수학 문제', g.math, '문제'], ['eng', '영어 문장·단어', g.eng, '개'], ['sci', '과학 문제', g.sci, '문제'], ['wr', '다시 맞힌 오답', g.wr, '개'], ['days', '공부한 날', g.days, '일'], ['min', '집중한 시간', Math.round(g.min / 6) / 10, '시간'], ['ink', '들은 인강', g.ink, '강'], ['news', '읽은 기사', g.news, '개']];
    return `<section class="card ${cls} grow"><div class="card-h"><h2>${ic('trophy')} ${esc(NMI())}가 쌓아 온 것</h2>${g.st ? `<span class="grow-st">${ic('fire')} ${g.st}일 연속</span>` : ''}</div>
      <div class="grow-top"><div class="grow-big"><span class="tiny">지금까지 푼 문제</span><b class="num">${g.all}</b><span class="grow-u">문제</span><p>${esc(line)}</p></div>
        <div class="grow-wk"><div class="grow-bars">${D7.map((d) => { const n = g.day[d] || 0; return `<div class="grow-bar ${d === today() ? 'on' : ''}"><i style="height:${Math.max(n ? 8 : 3, Math.round((n / mx) * 100))}%"></i><span>${DOW[dowOf(d)]}</span></div>`; }).join('')}</div>${g.w1 ? `<span class="tiny">이번 주 ${g.w0}문제 · 지난주 ${g.w1}문제</span>` : g.w0 && g.w0 !== g.all ? `<span class="tiny">이번 주 ${g.w0}문제</span>` : ''}</div></div>
      <div class="grow-ts">${T.filter((x) => x[2] > 0).map(([k, t, v, u]) => `<div class="grow-t"><span class="tiny">${t}</span><b class="num">${v}<small>${u}</small></b></div>`).join('')}</div>
      ${next ? `<div class="grow-next"><div class="row between"><span>다음 배지 <b>${esc(next.t)}</b></span><span class="tiny">${next.n - g[next.k]}${next.k === 'st' || next.k === 'days' ? '일' : '개'} 남았어요</span></div><div class="ik-bar" style="height:8px;margin-top:8px"><i style="width:${Math.round((g[next.k] / next.n) * 100)}%"></i></div></div>` : ''}
      <div class="grow-bd">${GROW_MS.slice().sort((a, b) => (g[b.k] >= b.n) - (g[a.k] >= a.n)).map((m) => `<span class="grow-b ${g[m.k] >= m.n ? 'on' : ''}" title="${esc(m.t)}">${ic(m.i)}<em>${esc(m.t)}</em></span>`).join('')}</div></section>`;
  }
  // ───────── 늘 같이 바뀌는 앱: 시즌 선물 · 업데이트 소식 · 선생님 한마디 · 목표 준비도 · 주간 기록 (2026-10-25) ─────────
  // 깜짝 선물: 예고 없이 그날(연휴는 그 며칠)에만 홈 맨 위에 카드가 뜨고 「선물 열기」로 용돈(하루 한도와 따로)
  const SEASONS = [
    { id: 'hw26', from: '2026-10-31', to: '2026-10-31', day: '2026-10-31', i: 'pumpkin', t: '할로윈', hi: '해피 할로윈', msg: '사탕 대신 용돈 선물이 왔어요', gift: 500, c: '#ff8a00' },
    { id: 'pp26', from: '2026-11-11', to: '2026-11-11', day: '2026-11-11', i: 'choco', t: '빼빼로데이', hi: '빼빼로데이야', msg: '공부하느라 고생한 너에게 빼빼로 대신 용돈', gift: 500, c: '#b5651d' },
    { id: 'cs26', from: '2026-11-19', to: '2026-11-19', day: '2026-11-19', i: 'flag', t: '선배들 수능날', hi: '오늘은 수능날이야', msg: '2년 뒤엔 네 차례예요. 오늘은 응원 보너스', gift: 300, c: '#3182f6' },
    { id: 'xm26', from: '2026-12-24', to: '2026-12-25', day: '2026-12-25', i: 'tree', t: '크리스마스', hi: '메리 크리스마스', msg: '산타 선생님이 선물을 두고 갔어요', gift: 1000, c: '#03b26c', fx: 'snow' },
    { id: 'ny27', from: '2027-01-01', to: '2027-01-02', day: '2027-01-01', i: 'fireworks', t: '새해', hi: '새해 복 많이 받아', msg: '2027년, 2학년을 향해 같이 가요', gift: 1000, c: '#f04452' },
    { id: 'sl27', from: '2027-02-06', to: '2027-02-08', day: '2027-02-06', i: 'clover', t: '설날', hi: '설날 복 많이 받아', msg: '세뱃돈 조금 넣어 뒀어요', gift: 1000, c: '#f04452' },
    { id: 'vd27', from: '2027-02-14', to: '2027-02-14', day: '2027-02-14', i: 'love', t: '발렌타인데이', hi: '달콤한 하루 보내', msg: '초콜릿 대신 용돈 한 조각', gift: 300, c: '#f06595' },
    { id: 'g2-27', from: '2027-03-02', to: '2027-03-02', day: '2027-03-02', i: 'spark', t: '2학년 시작', hi: '2학년 된 걸 축하해', msg: '새 학년 첫 주, 출발 선물', gift: 500, c: '#3182f6' },
  ];
  function seasonList() {
    const L = SEASONS.slice(), b = S.profile.birth || BIRTH;
    if (b) { const [, m, d] = b.split('-'), y0 = +today().slice(0, 4); for (const y of [y0, y0 + 1]) { const day = `${y}-${m}-${d}`; L.push({ id: 'bd' + y, from: day, to: day, day, i: 'cake', t: '생일', hi: '생일 축하해', msg: '선생님이 생일 선물을 보냈어요', gift: 2000, c: '#f06595' }); } }
    return L.sort((a, b) => a.from.localeCompare(b.from) || (b.id.startsWith('bd') - a.id.startsWith('bd')));
  }
  const BIRTH = U.who === '정윤' ? '2010-01-03' : '';  // 정윤 생일 (내 정보에 안 넣었을 때)
  const seasonNow = () => { const L = seasonList().filter((s) => s.from <= today() && today() <= s.to); return L.find((s) => s.id.startsWith('bd')) || L[0] || null; };
  function seasonCard() {
    const s = seasonNow(); if (!s || !WALLET) return '';
    const got = wHas('season:' + s.id), dd = dday(s.day);
    return `<section class="card c12 ss-card" style="--ss:${s.c}">${s.fx === 'snow' ? '<i class="ss-snow" aria-hidden="true"></i>' : ''}<span class="ss-ic big">${ic(s.i)}</span><div class="body"><span class="eyebrow">${dd > 0 ? `${esc(s.t)} 이브` : dd === 0 ? `오늘은 ${esc(s.t)}` : esc(s.t)}</span><b class="ss-t">${esc(s.hi)}</b><p class="tiny" style="margin:2px 0 0">${got ? '선물 받았어요' : esc(s.msg)}</p></div>${TEACHER ? `<span class="tag">학생 선물 ${won(s.gift)}</span>` : got ? '<span class="tag">받음</span>' : `<button class="btn primary" type="button" data-gift="${s.id}">${ic('gift')} 선물 열기</button>`}</section>`;
  }
  // 앱이 새로워진 것: content/updates.json 맨 위 것을 아직 안 봤으면 홈에, 전체는 소식 탭 맨 아래
  const UPS = () => ((D.updates || {}).items || []);
  function upCard() {
    const u = UPS()[0]; if (!u || ((S.party || {}).upSeen || '') >= u.date || UI.upHide) return '';
    return `<section class="card c12 up-card"><div class="card-h"><h3>${ic('new')} 말랑대학이 새로워졌어요</h3><span class="tiny">${md(u.date)} 업데이트</span></div><ul class="up-l">${u.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" type="button" data-upok>확인했어요</button><button class="btn" type="button" data-upall>지난 업데이트</button></div></section>`;
  }
  const upList = () => UPS().length ? `<section class="card c12 up-all" id="up-all" style="margin-top:16px"><div class="card-h"><h2>${ic('new')} 말랑대학 업데이트</h2><span class="tiny">선생님이 계속 고치고 있어요</span></div>${UPS().map((u) => `<div class="up-day"><b>${md(u.date)}</b><ul class="up-l">${u.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</section>` : '';
  // 선생님 한마디: 선생님이 쓰면 학생 홈 맨 위에. 학생이 「고마워요」를 누르면 선생님 쪽에 「읽었어요」
  function noteCard() {
    const n = S.note || {};
    if (TEACHER) return `<section class="card c12 nt-card"><div class="card-h"><h3>${ic('mega')} ${esc(NMI())}에게 한마디</h3>${n.at ? `<span class="tiny">${n.thx ? `${esc(NMI())}가 「고마워요」 했어요` : n.seen ? `${esc(NMI())}가 봤어요` : '아직 안 봤어요'}</span>` : ''}</div><textarea id="nt-t" class="inp" rows="2" style="min-height:76px" placeholder="오늘 ${esc(NMI())}에게 하고 싶은 말을 적으면 학생 홈 맨 위에 떠요">${esc(n.text || '')}</textarea><div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px">${n.text ? '<button class="btn" type="button" id="nt-del">내리기</button>' : ''}<button class="btn primary" type="button" id="nt-send">홈에 띄우기</button></div></section>`;
    if (!n.text) return '';
    if (!n.seen) { n.seen = Date.now(); save('note'); }
    const fresh = !n.thx;
    return `<section class="card c12 nt-card ${fresh ? 'fresh' : ''}"><div class="nt-from">${gh('hello', 'gh-nt')}<div class="body"><span class="eyebrow">선생님 한마디 · ${md(dateOf(n.at))}${fresh ? ' · <b class="blue">새로</b>' : ''}</span><p class="nt-t">${esc(n.text)}</p></div>${fresh ? `<button class="btn" type="button" id="nt-thx">${ic('heart')} 고마워요</button>` : ''}</div></section>`;
  }
  // 목표 대학까지 준비도: 내신·모의고사는 목표 등급에 닿으면 꽉 차고, 생기부·꾸준함은 쌓은 만큼
  function readyStat() {
    const p = S.profile, lm = lastMock(), m = lm ? avgOf(lm.g) : null, n = nsTotal(), cl = (x) => Math.max(0, Math.min(1, x));
    const g = growStats(); let act = 0; for (let i = 0; i < 28; i++) if (g.act.has(addD(today(), -i))) act++;
    const parts = [['내신', n ? cl((5 - n) / Math.max(0.1, 5 - p.goalNaesin)) : 0, 35], ['모의고사', m ? cl((9 - m) / Math.max(0.1, 9 - p.goalMock)) : 0, 25], ['생기부', cl((S.sgb || []).length / 30), 20], ['꾸준함', cl(act / 20), 20]];
    return { pct: Math.round(parts.reduce((a, [, v, w]) => a + v * w, 0)), parts, act };
  }
  function readySheet() {
    const p = S.profile, r = readyStat(), u = uniOf(p.uni);
    const tip = { 내신: `목표 내신 ${p.goalNaesin}등급에 닿으면 꽉 차요. 학기마다 등급을 넣어 주세요`, 모의고사: `목표 모의고사 ${p.goalMock}등급에 닿으면 꽉 차요`, 생기부: `생기부에 남길 활동 30개를 모으면 꽉 차요. 지금 ${(S.sgb || []).length}개`, 꾸준함: `최근 4주 중 20일 공부하면 꽉 차요. 지금 ${r.act}일` };
    sheet(`<h2>${u ? esc(u.short || u.name) + ' ' : ''}${esc(p.major || '')}까지 ${r.pct}%</h2><p class="sub">내신·모의고사·생기부·꾸준함을 합쳐서 셌어요. 매일 하는 게 다 여기 쌓여요</p><div class="list">${r.parts.map(([k, v, w]) => `<div class="li"><div class="body"><div class="row between"><b>${k}</b><span class="tiny">${Math.round(v * 100)}% · 비중 ${w}%</span></div><span class="hr-bar" style="margin:8px 0 6px"><i style="width:${Math.round(v * 100)}%"></i></span><div class="d">${tip[k]}</div></div></div>`).join('')}</div>`);
  }
  // 이번 주(월요일부터) 푼 문제가 지난 최고 주를 넘으면 한 번 축하 +500원
  const wkStart = (d) => addD(d, -((dowOf(d) + 6) % 7));
  function weekRec(g) {
    const W0 = wkStart(today()), wk = {}; for (const [d, n] of Object.entries(g.day)) { const s = wkStart(d); wk[s] = (wk[s] || 0) + n; }
    return { ws: W0, cur: wk[W0] || 0, best: Math.max(0, ...Object.entries(wk).filter(([s]) => s < W0).map(([, n]) => n)) };
  }
  function weekCheck(g) {
    const r = weekRec(g), k = 'wkrec:' + r.ws;
    if (TEACHER || r.best < 10 || r.cur <= r.best || wHas(k) || weekCheck.ws === r.ws) return;
    weekCheck.ws = r.ws;
    setTimeout(() => badgePop([{ id: 'wk', key: k, w: 500, i: 'crown', eb: '이번 주 기록 경신', t: `${r.cur}문제, 최고 기록!`, d: `지금까지 제일 많이 한 주가 ${r.best}문제였어요` }]), 1600);
  }
  function bindAlive() {
    $$('[data-gift]').forEach((b) => (b.onclick = () => { const s = seasonList().find((x) => x.id === b.dataset.gift); if (!s || wHas('season:' + s.id)) return; badgePop([{ id: s.id, key: 'season:' + s.id, w: s.gift, i: s.i, eb: '선물 도착!', t: s.hi, d: s.msg, done: render }]); }));
    $$('[data-upok]').forEach((b) => (b.onclick = () => { if (TEACHER) UI.upHide = 1; else { S.party = S.party || {}; S.party.upSeen = UPS()[0].date; save('party'); } render(); }));
    $$('[data-upall]').forEach((b) => (b.onclick = () => { UI.tab = 'news'; UI.newsF = 'all'; render(); setTimeout(() => { const el = $('#up-all'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 60); }));
    $$('[data-ready]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); readySheet(); }));
    $$('[data-tgift]').forEach((b) => (b.onclick = () => { const k = b.dataset.tgift; S.gifts = [...gAll().filter((x) => x.skin !== k), { skin: k, at: Date.now() }]; S.gift = {}; save('gifts', 'gift'); toast(`선물을 보냈어요. ${NMI()} 앱에 곧 떠요`); render(); }));
    $$('[data-giftx]').forEach((b) => (b.onclick = () => { const k = b.dataset.giftx; S.gifts = gAll().map((x) => (x.skin === k && !x.open ? { ...x, x: Date.now() } : x)); S.gift = {}; save('gifts', 'gift'); toast('선물을 거둬들였어요'); render(); }));
    $$('[data-giftopen]').forEach((b) => (b.onclick = () => { giftCheck.seen = (gPend()[0] || {}).at; giftPop(); }));
    const ns = $('#nt-send'); if (ns) ns.onclick = () => { const t = $('#nt-t').value.trim(); if (!t) return toast('한마디를 적어 주세요'); S.note = { text: t, at: Date.now() }; save('note'); toast(`${NMI()} 홈 맨 위에 띄웠어요`); render(); };
    const nd = $('#nt-del'); if (nd) nd.onclick = () => { S.note = {}; save('note'); toast('내렸어요'); render(); };
    const nt = $('#nt-thx'); if (nt) nt.onclick = () => { S.note.thx = Date.now(); save('note'); const r = nt.getBoundingClientRect(); boom(r.left + r.width / 2, r.top + r.height / 2, 2); ding(3); setTimeout(render, 500); };
  }
  // 홈 제목 아래 한 줄: 오늘 꼭 할 일 몇 개 끝냈는지 · 기말까지
  function homeLine() {
    const real = todayTasks().tasks.filter((t) => t.icon !== 'party' && !t.memo), dn = real.filter((t) => t.done).length, ex = typeof EB_EXAM === 'string' && EB_EXAM ? dday(EB_EXAM) : null;
    const a = !real.length ? '오늘은 쉬는 날이에요' : dn >= real.length ? `오늘 할 일 ${real.length}개를 다 끝냈어요` : `오늘 할 일 ${real.length}개 중 ${dn}개 끝냈어요, ${real.length - dn}개 남았어요`;
    if (TUTOR) { const nx = nextLesson(); return a + (nx ? ` · 다음 수업 ${lessonWhen(nx)}` : ''); }
    return a + (ex != null && ex >= 0 ? ` · 기말고사까지 ${ex}일` : '');
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
    const unitDone = uDone(ed);
    const tasks = [];
    if (TUTOR) { for (const t of tutorTasks()) tasks.push(t); for (const h of (S.hw || []).filter((x) => !hwDone(x) && !(x.grp && x.due > today()))) tasks.push({ k: 'hw', hw: h.id, icon: 'pin', t: h.title, d: h.due && h.due < today() ? `${md(h.due)} 숙제 · 아직 안 했어요` : `${h.subj && h.subj !== '영어' ? h.subj + ' · ' : ''}${h.due ? md(h.due) + '까지' : '선생님 숙제'}`, done: false }); for (const h of (S.hw || []).filter((x) => hwDone(x) && x.due === today())) tasks.push({ k: 'hw', hw: h.id, icon: 'pin', t: h.title, d: '선생님 숙제 · 끝냈어요', done: true }); return { tasks, off: false }; }
    const off = !anyTask(new Date()) && !S.sci.days[today()] && !S.eng.days[today()];
    const has = (k) => !off && (onDay(k) || !!(k === 'sci' ? S.sci.days[today()] : S.eng.days[today()]));
    // 지난번에 다 못 한 건 그대로 이어서 나와요 · 어제와 같은 숙제처럼 보이지 않게 알려 줘요
    const prevEng = Object.entries(S.eng.days).filter(([dk]) => dk < today()).sort().map(([, v]) => v);
    const carried = (k) => k === 'unit' ? !unitDone && prevEng.some((v) => v.unit === ed.unit) : k === 'words' ? !wordsDone && prevEng.some((v) => v.words === ed.words) : !g3Did(ed) && prevEng.some((v) => v.g3 === ed.g3);
    const cdesc = (k, d) => (carried(k) ? `지난번에 못 한 것 · 이어서 해요 · ${d}` : d);
    if (off) tasks.push({ k: 'hw', icon: 'party', t: '오늘은 매일 과제가 쉬는 날이에요', d: '요일은 숙제 탭의 「매일 과제 요일」에서 바꿀 수 있어요', done: true });
    for (const d of openDrills().slice(0, 4)) tasks.push({ k: 'drill:' + d.id, icon: 'target', t: `${d.title || d.area} ${d.qs.length}문제`, d: '선생님이 낸 약한 영역 문제', done: false });
    if (has('g3') && G3.length) { const g = G3[ed.g3 || 0]; tasks.push({ k: 'g3', icon: 'eng', t: '고3 영어 한 문제', d: g3Did(ed) ? '다 풀었어요 · 문장 분석 보기' : cdesc('g3', g ? `${g.type || ''} · 문장 분석과 천일문 연결` : ''), done: g3Did(ed) }); }
    if (has('sci') && SCI.concepts.length) tasks.push({ k: 'sci', icon: 'sci', t: sd.one ? `과학 개념: ${(SCI.concepts.find((x) => x.id === sd.c) || {}).title || ''}` : `오늘의 과학 ${st.n}문제`, d: sd.one && !sd.read ? `교과서 개념 보고 문제 ${st.n}개` : st.done >= st.n ? `${st.ok}/${st.n} 맞힘${st.all > st.n ? ` · 깊게 ${st.all - st.n}문제 더` : ''}` : `${st.done}/${st.n} 풀었어요`, done: st.done >= st.n });
    // 기말 개념은 과목마다 한 줄, 맨 위에 (한국사가 섞여 안 보인다고 해서 10/26)
    if (FIN_ON) { const L = finToday(), subs = [...new Set(L.map((c) => c.subj))].sort((x, y) => (y === 'hist') - (x === 'hist')); tasks.unshift(...subs.map((sj) => { const M = L.filter((c) => c.subj === sj), n = M.filter(finDone).length, due = FIN_DUE[sj]; return { k: 'fin:' + sj, icon: sj === 'hist' ? 'scroll' : 'books', t: sj === 'eng' ? `올림포스 지문 ${M.length}개` : `${M[0].sname} 기말 예습 ${M.length}개`, d: n >= M.length ? `오늘 것 끝 · ${finEndTxt(sj)}` : `${M.map((c) => c.title).join(' · ')} · ${n}/${M.length} · ${finEndTxt(sj)}`, done: n >= M.length }; })); }
    if (has('unit') && CH_UNITS.length) { const un = CH_UNITS[ed.unit] || CH_UNITS[CH_UNITS.length - 1]; tasks.push({ k: 'unit', icon: 'eng', t: `천일문 ${un.unit ? 'Unit ' + un.unit : ''} ${un.title || ''}`.trim(), d: unitDone ? '다 했어요' : cdesc('unit', '개념 · 문장 · 문제'), done: !!unitDone }); }
    if (has('words') && WORDS.length) tasks.push({ k: 'words', icon: 'books', t: '워드마스터 단어 10개 시험', d: wordsDone ? `${Object.values(ed.wans).filter((x) => x.ok).length}/10 맞힘` : cdesc('words', wordsLabel(ed.words)), done: !!wordsDone });
    // 매일 기사 하나: 오늘 읽은 기사가 있으면 그게 오늘 것(끝), 없으면 안 읽은 대이슈 → 안 읽은 최신 기사
    if (WALLET || U.who === '윤건') { const N = ((D.news && D.news.items) || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))), t = today();
      const rd = WALLET ? W().log.find((x) => x.date === t && String(x.key).startsWith('news:')) : (() => { const e = Object.entries(S.nr || {}).find(([, at]) => dateOf(at) === t); return e ? { key: 'news:' + e[0] } : null; })(), un = N.filter((n) => !wHas('news:' + n.id));
      const n = rd ? N.find((x) => 'news:' + x.id === rd.key) : (un.find((x) => x.must) || un[0]);
      if (n) tasks.push({ k: 'news:' + n.id, icon: n.must ? 'fire' : 'news', t: `${n.must ? '꼭 읽기' : '오늘의 기사'}: ${n.title}`, d: rd ? '읽었어요' : `${n.must ? '요즘 대이슈 · ' : ''}${WALLET ? '읽으면 50원' : '읽으면 🔥 불꽃 +1'}`, done: !!rd }); }
    { const my = myTasks(); tasks.unshift(...my.filter((x) => !x.memo)); tasks.push(...inkTasks()); tasks.__plan = my.filter((x) => x.memo); }
    for (const h of hwNow()) tasks.push({ k: 'hw', hw: h.id, icon: 'pin', t: h.title, d: h.due && h.due < today() ? `${md(h.due)} 숙제 · 아직 안 했어요` : '오늘 선생님 숙제', done: false });
    for (const h of (S.hw || []).filter((x) => hwDone(x) && x.due === today())) tasks.push({ k: 'hw', hw: h.id, icon: 'pin', t: h.title, d: '선생님 숙제 · 끝냈어요', done: true });
    tasks.unshift(...tasks.__plan);  // 일정은 맨 위(셈은 안 해요), 그 다음 학원·학교 숙제
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
    const t = today(), nx0 = TUTOR ? nextLesson() : null, ev = [TUTOR ? (nx0 ? { title: '다음 수업', date: nx0.date, big: true } : null) : { title: CSAT.title || '수능', date: CSAT.date, big: true }, ...[...(D.events || []), ...(S.myEvents || []).map((e) => ({ ...e, mine: true }))].filter((e) => e.date >= t && e.kind !== 'csat')].filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
    const L = [ev[0], ...ev.slice(1).filter(Boolean).slice(0, 3)].filter(Boolean);
    return `<section class="card tight w-dday"><div class="card-h"><h3>디데이</h3><button class="more" type="button" id="w-sched">일정</button></div>
      <div class="w-dl">${L.map((e) => { const n = dday(e.date); return `<div class="w-di ${e.big ? 'big' : ''}"><span class="w-dn">${esc(e.title)}</span><span class="w-dd">${md(e.date)}</span><b class="num ${n <= 7 ? 'red' : n <= 30 ? 'blue' : ''}">${n === 0 ? 'D-DAY' : 'D-' + n}</b></div>`; }).join('')}</div></section>`;
  }
  setInterval(() => { const d = new Date(), v = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; $$('[data-clock]').forEach((x) => { if (x.textContent !== v) x.textContent = v; }); }, 5000);
  function railCards(inline) {
    const cls = inline ? 'rail-inline c12' : '';
    const { tasks, off } = todayTasks();
    const real = tasks.filter((t) => t.icon !== 'party' && !t.memo); const doneN = real.filter((t) => t.done).length, frac = real.length ? doneN / real.length : (off ? 1 : 0);
    const R = 80, L = Math.PI * R;
    const todo = `<section class="card tight ${cls}"><div class="card-h"><h3>오늘 할 일</h3><button class="more" data-go="hw">숙제</button></div>
      <div class="arch"><svg viewBox="0 0 200 100"><path d="M20 96 A80 80 0 0 1 180 96" fill="none" stroke="var(--fill)" stroke-width="12" stroke-linecap="round"/><path class="ring-arc" d="M20 96 A80 80 0 0 1 180 96" fill="none" stroke="var(--blue)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - frac)}"/></svg><div class="c"><span class="tiny">오늘</span><br><b class="num">${Math.round(frac * 100)}%</b> <span class="muted">완료</span></div></div>
      <div class="list">${tasks.length ? tasks.map((t) => `<div class="li btnlike" ${t.hw ? `data-hwopen="${esc(t.hw)}"` : `data-task="${t.k}"`}><div class="ico">${ic(t.done ? 'ok' : t.icon)}</div><div class="body"><div class="t">${esc(t.t)}</div><div class="d">${esc(t.d)}</div></div><span class="chev"></span></div>`).join('') : `<div class="empty">${ic('party')}<b>오늘 할 일이 없어요</b></div>`}</div></section>`;
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
    const item = (n) => `<div class="li btnlike ${read(n) ? 'nw-read' : ''}" data-news="${esc(n.id)}"><div class="ico">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'sm') : ic(nIcon(n))}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${md(n.date)} · ${esc(nGrp(n))}${n.must ? '' : n.level === '중요' ? ' · <b class="red">중요</b>' : ''}${read(n) ? '' : ' · <b class="blue">새 소식</b>'}</div></div>${read(n) ? NW_DONE : n.must ? '<span class="tag must">꼭 읽기</span>' : ''}<span class="chev"></span></div>`;
    const MUST = N.filter((n) => n.must).sort((a, b) => read(a) - read(b) || String(b.date).localeCompare(String(a.date))).slice(0, 5);
    return `<h1 class="h1">소식</h1><p class="sub">${D.news && D.news.updated ? md(D.news.updated) + ' 업데이트 · ' : ''}${TUTOR && !ST.career ? '시사 상식 · 교육 소식' : '입시 · 과학 · 시사 상식'}, 출처를 확인한 것만 모았어요${WALLET && !DASH_ONLY ? '. 하나 읽으면 50원' : ''}</p>
      <div class="chips" style="margin-bottom:16px">${['all', ...groups].map((g) => `<button type="button" class="chip ${f === g ? 'on' : ''}" data-nf="${esc(g)}">${g === 'all' ? '전체' : esc(g)} <span class="tiny">${g === 'all' ? N.length : N.filter((n) => nGrp(n) === g).length}</span></button>`).join('')}<button type="button" class="chip ${f === 'keep' ? 'on' : ''}" data-nf="keep">★ 담은 것 · 내 생각 <span class="tiny">${KL.length}</span></button></div>
      <div class="grid">${f !== 'keep' && MUST.length ? `<section class="card c12 nw-must"><div class="card-h"><h2>${ic('fire')} 꼭 읽어야 할 대이슈</h2><span class="tiny">${MUST.filter((n) => !read(n)).length ? `안 읽은 것 ${MUST.filter((n) => !read(n)).length}개` : '다 읽었어요'}</span></div><div class="list">${MUST.map(item).join('')}</div></section>` : ''}<section class="card c12">${f === 'keep' ? kept : L.length ? `<div class="list">${L.map(item).join('')}</div>` : `<div class="empty">${gh('idle', 'gh-empty')}<b>소식을 모으는 중이에요</b></div>`}</section></div>`;
  }
  const NW_DONE = '<span class="tag nw-done"><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>읽음</span>';
  function newsCard(cls) {
    const N = (D.news && D.news.items) || [];
    const p = S.profile;
    const mine = N.slice().sort((a, b) => (!!b.must - !!a.must) || (b.level === '중요') - (a.level === '중요') || String(b.date).localeCompare(String(a.date)));
    const top = mine.filter((n) => !n.uni || n.uni === p.uni || n.scope !== '대학').slice(0, 4);
    return `<section class="card tight ${cls}"><div class="card-h"><h3>소식</h3><button class="more" data-news="all">전체 ${N.length}</button></div>
      ${top.length ? `<div class="list">${top.map((n) => `<div class="li btnlike" data-news="${esc(n.id)}"><div class="ico">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'sm') : ic(nIcon(n))}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${md(n.date)} · ${esc(n.scope || '')}${n.level === '중요' && !n.must ? ' · <b class="red">중요</b>' : ''}</div></div>${wHas('news:' + n.id) ? NW_DONE : n.must ? '<span class="tag must">꼭 읽기</span>' : ''}</div>`).join('')}</div>` : `<div class="empty">${ic('news')}<b>소식을 모으는 중이에요</b></div>`}
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
      // 질문을 눌러 들어간 「Q. …」 줄은 빼고, 직접 쓴 글만 세요 (질문만 눌러서는 저장도 용돈도 없어요)
      const box = ta.closest('.keep'), key = box.dataset.kk, v = ta.value.trim(), asks = $$('[data-ask]', box).map((x) => 'Q. ' + x.textContent.trim());
      const own = v.split('\n').filter((l) => !asks.includes(l.trim())).join('\n').replace(/\s+/g, ' ').trim(); S.notes = S.notes || {};
      if (own) S.notes[key] = { ...keepMeta(box), text: v, at: Date.now() }; else delete S.notes[key];
      // 생각을 남기면 「담기」도 저절로 돼요 (소식 탭 「담은 것」에서 다시 봐요)
      S.keep = S.keep || {}; if (own && !S.keep[key]) { S.keep[key] = { ...keepMeta(box), at: Date.now() }; save('keep'); const kb = $('[data-keep]', box); if (kb) { kb.classList.add('on'); kb.textContent = '★ 담았어요'; } }
      save('notes'); const st = $('.keep-st', box); if (st) st.textContent = own ? (own.length >= 15 || wHas('note:' + key) ? '저장했어요' : '저장했어요 · 15자 넘게 쓰면 +100원') : '처음 남기면 +100원';
      if (own.length >= 15) earn('note:' + key, 100, '내 생각 남기기', { from: st });
    }, 700);
  });
  function openKept(kind, ref) { if (kind === 'news') newsSheet(ref); else if (kind === 'uni') uniDetail(ref); else if (kind === 'pick') { const [k, i] = String(ref).split(':'); pickDetail(k, +i); } }
  // 소식 읽기 불꽃 (10/27 선생님 «이 나이 땐 안 읽으니까 꼭 읽게, 보상·불타는 애니메이션»)
  // 8초 지나고 맨 아래까지 내려야 「다 읽었어요」가 켜져요 → 불꽃 +1 · 팡팡 · 1·3·5·10·20·30개째 배지
  const NR_BADGE = [[1, 'fire', '첫 불꽃', '첫 소식을 끝까지 읽었어요!'], [3, 'news', '소식 새싹', '소식 3개 읽었어요. 벌써 아는 게 많아졌어요'], [5, 'bulb', '세상 탐험가', '소식 5개! 친구들보다 한 발 앞서 있어요'], [10, 'medal', '소식 박사', '10개나 읽었어요. 진짜 대단해요'], [20, 'trophy', '공대생 예약', '20개! 꿈에 한 걸음 더 가까워졌어요'], [30, 'crown', '소식 왕', '30개! 이제 설명해 주는 사람이에요']];
  // 윤건: 정윤이 동전처럼 기사 맨 위 막대가 8초 차면 불꽃 +1 이 저절로 (10/28 선생님 «몇 초 읽으면 코인처럼»)
  const nrPill = (n) => (WALLET || TEACHER || U.who !== '윤건') ? '' : `<div class="rd-pill nr-pill${(S.nr || {})[n.id] ? ' done' : ''}" data-nrp>🔥<span class="rd-t">${(S.nr || {})[n.id] ? '불꽃 받았어요' : '8초 읽으면 불꽃 +1'}</span><i class="rd-bar"><b></b></i></div>`;
  function nrBind(el, n) {
    const p = $('[data-nrp]', el); if (!p || p.classList.contains('done')) return;
    const t0 = Date.now(), T = 8000, bar = $('.rd-bar b', p), tx = $('.rd-t', p);
    const tm = setInterval(() => { if (!p.isConnected) return clearInterval(tm); if (document.hidden) return; const f = Math.min(1, (Date.now() - t0) / T); bar.style.width = f * 100 + '%'; tx.textContent = f < 1 ? `천천히 읽어요 · ${Math.ceil((T - (Date.now() - t0)) / 1000)}초` : '';
      if (f < 1) return; clearInterval(tm); p.classList.add('done');
      if (PEEK) { tx.textContent = '미리 보기라 불꽃은 안 받아요'; return; }
      S.nr = S.nr || {}; S.nr[n.id] = Date.now(); save('nr'); const c = Object.keys(S.nr).length, r = p.getBoundingClientRect(); boom(r.left + 20, r.top + r.height / 2, 3); ding(8); if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
      tx.textContent = `불꽃 ${c}개째!`; const bd = NR_BADGE.find((x) => x[0] === c);
      if (bd) setTimeout(() => badgePop([{ id: 'nr' + c, key: 'nr:' + c, w: 0, i: bd[1], eb: `🔥 소식 ${c}개 읽기`, t: bd[2], d: bd[3], mega: c >= 10 ? 1 : 0 }]), 500); else toast(`🔥 불꽃 ${c}개! 다음 배지까지 ${((NR_BADGE.find((x) => x[0] > c) || [c])[0]) - c}개`); }, 200);
  }

  function newsSheet(id) {
    const N = (D.news && D.news.items) || [];
    if (id === 'all') { closeSheet(); UI.run = null; UI.tab = 'news'; render(); scrollTo(0, 0); return; }
    const n = N.find((x) => x.id === id); if (!n) return;
    sheet(`<div class="row" style="margin-bottom:12px">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'md') : `<span class="ico">${ic(nIcon(n))}</span>`}${n.must ? '<span class="tag must">꼭 읽기 · 대이슈</span>' : `<span class="tag ${n.level === '중요' ? 'red' : ''}">${esc(n.level || '참고')}</span>`}<span class="tiny">${md(n.date)} · ${esc(n.scope || '')}</span></div>
      <h2>${esc(n.title)}</h2>${readPill('news:' + n.id, 50, '소식 읽기')}${nrPill(n)}<p style="line-height:1.8;color:var(--t2)">${esc(n.body)}</p>
      ${n.you ? `<div class="deep"><div class="eyebrow">${esc(S.profile.name)}에게는</div><p>${esc(n.you)}</p></div>` : ''}
      ${(n.more || []).length ? `<div class="nw-more"><div class="eyebrow">${ic('bulb')} 더 깊이 알아보기</div><ul>${n.more.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''}
      ${keepBox('news:' + n.id, n.title, 'news', n.id, n.ask || [])}
      <div class="list" style="margin-top:16px">${(n.src || []).map((s) => `<a class="li btnlike" href="${esc(s.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><div class="ico">${ic('pin')}</div><div class="body"><div class="t">${esc(s.name)}</div><div class="d">원문 보기</div></div><span class="chev"></span></a>`).join('')}</div>
      <button class="btn big block" style="margin-top:16px" data-close type="button">목록으로</button>`, (el) => { $('[data-close]', el).onclick = closeSheet; nrBind(el, n); });
  }

  // ───────── 숙제 탭 ─────────
  // ───────── 기말 교과서 e-book: 쪽 그림 위에 단어 위치를 겹쳐 형광펜·밑줄·질문·나중에 보기 ─────────
  const EB = D.ebook || { books: [] };
  const MANS = D.mathans || {};
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
  const inkQueue = (c, cf = inkCfg(c)) => cf.pick.map((no) => inkL(c, no)).filter((l) => l && !inkSt(c, l));  // 고른 순서대로 (2026-10-26 정윤: 순서대로 말고 듣고 싶은 것부터)
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
          ${s === 'done' ? (Q.length ? '<button class="btn primary big block" id="ik-view" type="button">문제와 정답 보기</button><button class="btn big block" id="ik-quiz" type="button" style="margin-top:8px">미니 퀴즈 다시 풀기</button>' : '') : `<button class="btn big block" id="ik-done" type="button">${Q.length ? `다 들었어요 · 미니 퀴즈 ${Q.length}문제` : '다 들었어요'}</button>`}
          <div class="row" style="gap:8px;margin-top:8px">${s === 'skip' ? '<button class="btn sm" id="ik-undo" type="button">다시 들을 목록에 넣기</button>' : s === 'done' ? '<button class="btn sm" id="ik-undo" type="button">아직 안 들은 걸로 바꾸기</button>' : '<button class="btn sm" id="ik-skip" type="button">이 강의는 안 들을래요</button>'}</div>`;
        // 오늘 들을 강의 바꾸기 (2026-10-26 정윤: 누르면 목록 보고 들을 걸 고르게)
        const T = inkToday() || {}, mine = (T[cid] || []).includes(l.no), cf = inkCfg(c), alt = c.lectures.filter((x) => !(T[cid] || []).includes(x.no) && x.no !== l.no && !inkSt(c, x));
        alt.sort((a, b) => (cf.pick.includes(b.no) - cf.pick.includes(a.no)) || a.no - b.no);
        if (mine && !s && alt.length) $('#ik-b', el).insertAdjacentHTML('beforeend', `<div class="ik-swap"><b>오늘 다른 강의 들을래요</b><span class="tiny">누르면 오늘 할 일이 그 강의로 바뀌어요</span><div class="ik-lecs" data-ilid="sw">${alt.map((x) => `<button type="button" class="ik-lec ${cf.pick.includes(x.no) ? 'on' : ''}" data-isw="${x.no}"><i>${cf.pick.includes(x.no) ? '★' : ''}</i><span><b>${esc(x.title)}</b><em>${x.min ? x.min + '분' : ''}${x.pct ? ` · ${x.pct}% 들음` : ''}${cf.pick.includes(x.no) ? ' · 고른 강의' : ''}</em></span></button>`).join('')}</div></div>`);
        $$('[data-isw]', el).forEach((b) => (b.onclick = () => { const no2 = +b.dataset.isw, S0 = inkS(), D0 = S0.days[today()] = S0.days[today()] || {}; D0[cid] = (D0[cid] || []).map((n) => (n === l.no ? no2 : n)); if (!cf.pick.includes(no2)) { cf.pick = [...cf.pick, no2]; S0.cfg[cid] = cf; S0._cfgAt = Date.now(); } save('ink'); close(); render(); toast('오늘 들을 강의를 바꿨어요'); setTimeout(() => inkLec(cid, no2), 300); }));
        const on = (id, f) => { const b = $(id, el); if (b) b.onclick = f; };
        on('#ik-done', () => (Q.length ? quiz(0, []) : (inkMark(c, l, 'done'), close(), render(), toast('들었어요, 잘했어요'))));
        on('#ik-quiz', () => quiz(0, []));
        on('#ik-view', () => {
          const pk = (inkS().q[k] || {}).pick || [];
          $('#ik-b', el).innerHTML = `<p class="tiny" style="margin:0 0 4px">${esc(c.subj)} · 미니 퀴즈 ${Q.length}문제</p><h2 style="line-height:1.4">${esc(l.title)}</h2>${Q.map((x, i) => `<div class="deep" style="margin:12px 0"><b>${i + 1}. ${esc(x.q)}</b><div class="list" style="margin:8px 0">${x.c.map((t, j) => `<div class="li ik-ch ${j === x.a ? 'ik-ok' : pk[i] === j ? 'ik-no' : ''}"><div class="ico"><b>${j + 1}</b></div><div class="body"><div class="t" style="font-size:15px;font-weight:500">${esc(t)}${j === x.a ? ' · 정답' : pk[i] === j ? ' · 내가 고른 답' : ''}</div></div></div>`).join('')}</div><p class="tiny" style="margin:0">${esc(x.exp || '')}</p></div>`).join('')}<button class="btn big block" id="ik-back" type="button">돌아가기</button>`;
          $('#ik-back', el).onclick = home; el.scrollTop = 0;
        });
        on('#ik-skip', () => { inkMark(c, l, 'skip'); close(); render(); toast('이 강의는 빼 둘게요'); });
        on('#ik-undo', () => { inkMark(c, l, ''); home(); render(); });
      };
      const quiz = (i, ans) => {
        if (i >= Q.length) {
          const ok = ans.filter((a) => a.ok).length; inkS().q[k] = { n: Q.length, ok, at: Date.now(), pick: ans.map((a) => a.j) }; inkMark(c, l, 'done');
          earn('ink:' + k, 100, `인강 퀴즈 · ${c.subj}`);
          $('#ik-b', el).innerHTML = `<h2>미니 퀴즈 끝</h2><p class="sub">${Q.length}문제 중 <b class="${ok === Q.length ? 'blue' : ''}">${ok}개</b> 맞혔어요${ok === Q.length ? '. 완벽해요' : '. 틀린 건 강의 그 부분을 한 번 더 봐요'}</p><button class="btn primary big block" id="ik-end" type="button">닫기</button>`;
          $('#ik-end', el).onclick = () => { close(); render(); }; return;
        }
        const x = Q[i];
        $('#ik-b', el).innerHTML = `<p class="tiny" style="margin:0 0 4px">미니 퀴즈 ${i + 1}/${Q.length} · ${esc(l.title)}</p><h2 style="line-height:1.5;font-size:19px">${esc(x.q)}</h2><div class="list" id="ik-c">${x.c.map((t, j) => `<button type="button" class="li btnlike ik-ch" data-j="${j}" style="width:100%;text-align:left;border:0;background:none"><div class="ico"><b>${j + 1}</b></div><div class="body"><div class="t" style="font-size:15.5px;font-weight:500">${esc(t)}</div></div></button>`).join('')}</div><div id="ik-x"></div>`;
        $$('.ik-ch', el).forEach((b) => (b.onclick = () => {
          const j = +b.dataset.j, ok = j === x.a; ans.push({ ok, j });
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
    const order = [1, 2, 3, 4, 5, 6, 0], open = {}, before0 = JSON.parse(JSON.stringify(inkToday() || {}));
    const sumOf = (c) => { const cf = P[c.id], f = inkFinish(c, cf), late = f.date && f.date > EB_EXAM; return !cf.on ? '안 들어요' : !f.n ? '고른 강의를 다 들었어요' : !cf.days.length ? `남은 ${f.n}강 · 요일을 골라요` : `남은 ${f.n}강 · ${md(f.date)}에 끝나요 · ${late ? `<b class="red">기말(${md(EB_EXAM)})보다 늦어요</b>` : '<b class="blue">기말 전에 끝나요</b>'}`; };
    const lecMark = (cf, l, c) => { if (!cf.pick.includes(l.no)) return ''; if (inkSt(c, l)) return '✓'; return String(inkQueue(c, cf).indexOf(l) + 1); };  // 안 들은 것만 1·2·3 순서
    // 다시 그려도 보던 자리 그대로 (2026-10-26 정윤: 체크할 때마다 맨 위로 올라가서 힘들어)
    const keep = (el, fn) => { const sc = [el, el.closest('.sheet'), ...$$('.sheet, .sheet-b, .sheet-in', document)].filter(Boolean), at = sc.map((x) => x.scrollTop), li = {}; $$('[data-ilid]', el).forEach((x) => (li[x.dataset.ilid] = x.scrollTop)); fn(); sc.forEach((x, i) => { x.scrollTop = at[i]; }); $$('[data-ilid]', el).forEach((x) => { if (li[x.dataset.ilid]) x.scrollTop = li[x.dataset.ilid]; }); };
    // 누를 때마다 바로 저장 (2026-10-26 정윤: 요일 바꾼 게 저장이 안 돼요 → 저장 단추까지 안 가도 남게)
    const commit = () => { const s = inkS(); s.cfg = JSON.parse(JSON.stringify(P)); s._cfgAt = Date.now(); save('ink'); };
    const draw0 = (el) => { commit(); keep(el, () => draw(el)); };
    const draw = (el) => {
      $('#ik-set', el).innerHTML = INK.map((c) => {
        const cf = P[c.id], sum = sumOf(c);
        return `<div class="pl-item ik-item"><div class="row between" style="gap:8px"><div class="pl-h">${ic(INK_IC[c.id] || 'books')}<div><b>${esc(c.subj)} · ${esc(inkName(c))}</b><span class="tiny">${esc(c.teacher)} · ${esc(c.range)}</span></div></div><button type="button" class="ik-sw ${cf.on ? 'on' : ''}" data-ion="${c.id}" aria-pressed="${cf.on}">${cf.on ? '듣는 중' : '안 들어요'}</button></div>
          <div class="ik-in">${cf.on ? `<div class="pl-dots">${order.map((d) => `<button type="button" class="${cf.days.includes(d) ? 'on' : ''} ${d === 0 ? 'sun' : d === 6 ? 'sat' : ''}" data-idw="${c.id}:${d}">${DOW[d]}</button>`).join('')}</div>
          <div class="row" style="gap:6px;margin-top:10px;align-items:center"><span class="tiny">하루에</span>${[1, 2, 3].map((n) => `<button type="button" class="chip sm ${cf.per === n ? 'on' : ''}" data-iper="${c.id}:${n}">${n}강</button>`).join('')}</div>` : ''}
          <p class="tiny" style="margin:10px 0 0" data-isum="${c.id}">${sum}</p>
          <button type="button" class="btn sm" data-ipk="${c.id}" style="margin-top:8px">${open[c.id] ? '강의 목록 접기' : `들을 강의 고르기 · ${cf.pick.length}강 골랐어요`}</button>${open[c.id] ? '<p class="tiny" style="margin:8px 0 0">누른 순서대로 들어요. 숫자가 듣는 순서예요</p>' : ''}
          ${open[c.id] ? `<div class="ik-lecs" data-ilid="${c.id}">${c.lectures.map((l) => { const s = inkSt(c, l), on = cf.pick.includes(l.no); return `<button type="button" class="ik-lec ${on ? 'on' : ''}" data-ilp="${c.id}:${l.no}"><i>${lecMark(cf, l, c)}</i><span><b>${esc(l.title)}</b><em>${l.min ? l.min + '분' : ''}${s === 'done' ? ' · 들었어요' : s === 'skip' ? ' · 안 들어요' : l.pct ? ` · ${l.pct}% 들음` : ''}</em></span></button>`; }).join('')}</div>` : ''}</div></div>`;
      }).join('');
      $$('[data-ion]', el).forEach((b) => (b.onclick = () => { const x = P[b.dataset.ion]; x.on = !x.on; draw0(el); }));
      $$('[data-idw]', el).forEach((b) => (b.onclick = () => { const [id, d] = b.dataset.idw.split(':'), x = P[id], n = +d; x.days = x.days.includes(n) ? x.days.filter((y) => y !== n) : [...x.days, n]; draw0(el); }));
      $$('[data-iper]', el).forEach((b) => (b.onclick = () => { const [id, n] = b.dataset.iper.split(':'); P[id].per = +n; draw0(el); }));
      $$('[data-ipk]', el).forEach((b) => (b.onclick = () => { open[b.dataset.ipk] = !open[b.dataset.ipk]; draw0(el); }));
      // 강의 체크는 다시 그리지 않고 그 자리에서만 바꿔요
      $$('[data-ilp]', el).forEach((b) => (b.onclick = () => {
        const [id, no] = b.dataset.ilp.split(':'), x = P[id], n = +no, c = inkC(id); x.pick = x.pick.includes(n) ? x.pick.filter((y) => y !== n) : [...x.pick, n];
        $$(`[data-ilp^="${id}:"]`, el).forEach((y) => { const l = inkL(c, y.dataset.ilp.split(':')[1]); y.classList.toggle('on', x.pick.includes(l.no)); y.querySelector('i').textContent = lecMark(x, l, c); });
        const sm = $(`[data-isum="${id}"]`, el); if (sm) sm.innerHTML = sumOf(c);
        commit();
      }));
    };
    sheet(`<h2>인강 설정</h2><p class="sub">강좌마다 듣는 요일과 하루에 몇 강 들을지 정해요. 들을 강의만 골라 두면 안 들은 것부터 「오늘 할 일」에 나와요. 순서대로 안 들어도 괜찮아요</p><div id="ik-set"></div><p class="tiny" style="margin:16px 0 0;text-align:center">누르는 대로 바로 저장돼요</p><button class="btn primary big block" id="ik-ok" type="button" style="margin-top:8px">다 했어요</button>`, (el, close) => {
      draw(el);
      $('#ik-ok', el).onclick = () => {
        // 바꾼 설정으로 오늘 들을 강의가 새로 생기면 오늘부터 할지 물어요
        const s = inkS(), t = today(), before = before0, cnt = (d) => Object.values(d || {}).reduce((a, x) => a + x.length, 0);
        s.cfg = P; s._cfgAt = Date.now(); delete s.days[t]; const after = inkToday();
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
  // ───────── 학원·과외 숙제 (정윤이 직접 넣어요) ─────────
  // 붙여넣으면 줄마다 숙제 하나. 쪽·번호 범위·문제 수를 읽어서 마감까지 남은 날에 고르게 나눠요
  const myS = () => { S.my = S.my || {}; S.my.cls = S.my.cls || [{ id: 'c1', name: '수학 학원', day: 6 }, { id: 'sch', name: '학교 숙제', day: null }, { id: 'perf', name: '수행평가', day: null }, { id: 'club', name: '학생회·동아리', day: null }]; S.my.items = S.my.items || []; return S.my; };
  const addD = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dowOf = (s) => new Date(s + 'T00:00:00').getDay();
  // 수업 전날이 마감 (토요일 수업이면 금요일까지). 오늘이 마감일이면 오늘
  const myDue = (c) => { if (c.day == null) return addD(today(), 3); const dd = (c.day + 6) % 7; let t = today(); for (let i = 0; i < 7; i++) { if (dowOf(t) === dd) return t; t = addD(t, 1); } return t; };
  function myParse(line) {
    const s = line.replace(/[〜∼～]/g, '~').replace(/\s+/g, ' ').trim(); if (!s) return null;
    const rN = s.match(/(\d+)\s*번?\s*[~\-]\s*(\d+)\s*번/), rP = s.match(/p\.?\s*(\d+)\s*[~\-]\s*(\d+)/i) || s.match(/(\d+)\s*[~\-]\s*(\d+)\s*쪽/);
    const cnt = [...s.matchAll(/(\d+)\s*문(?:제|젠)/g)].map((m) => +m[1]);
    let unit = '문제', from = null, to = null, total = 0; const one = () => { unit = '건'; total = 1; };
    if (rN && +rN[2] > +rN[1]) { unit = '번'; from = +rN[1]; to = +rN[2]; total = to - from + 1; }
    else if (cnt.length) total = cnt[cnt.length - 1];
    else if (rP && +rP[2] > +rP[1]) { unit = '쪽'; from = +rP[1]; to = +rP[2]; total = to - from + 1; }
    const tk = []; for (const w of s.replace(/[:：]/g, ' ').split(' ').filter(Boolean)) { if (/^p\.?\d*$|^p\.|^\(|^[+~]|^\d+\s*(?:번|문제|문젠|쪽)|^\d+~/i.test(w)) break; tk.push(w); }
    const book = (tk.join(' ') || s).slice(0, 24);
    if (!total) one();
    return { text: s, book: unit === '건' ? s.slice(0, 40) : book, unit, from, to, total };
  }
  const myDone = (it) => Object.values(it.log || {}).reduce((a, x) => a + (x.n || 0), 0);
  // 할 요일: 수업마다 골라요(기본 월~금). 남은 할 요일 수로 나눠요
  const myStudy = (it) => myCls(it.cls).study || it.days || [1, 2, 3, 4, 5];  // 수업 할 요일을 바꾸면 이미 넣은 숙제도 따라가요
  const myDaysLeft = (due, days, from) => { let n = 0, t = from || today(); for (let i = 0; i < 60 && t <= due; i++, t = addD(t, 1)) if (days.includes(dowOf(t))) n++; return n; };
  const mySkip = (it, d) => !!(it.skip && it.skip[d || today()]);  // 그날은 미뤘어요
  const myLeftDays = (it) => Math.max(1, myDaysLeft(it.due, myStudy(it), mySkip(it) ? addD(today(), 1) : today()));
  // 내 평균: 최근 3주에 숙제를 한 날, 하루에 푼 문제 수
  function myAvg() { const by = {}, from = addD(today(), -21); for (const it of myS().items) if (it.unit !== '건') for (const [d, x] of Object.entries(it.log || {})) if (d >= from && d < today() && x.n) by[d] = (by[d] || 0) + x.n; const v = Object.values(by); return v.length >= 2 ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; }
  // 지난 할 요일에 안 했으면 다음 날 물어봐요: 남은 날에 나눌지, 마감을 미룰지
  function myMissed() {
    const out = [], t = today();
    for (const it of myOpen()) {
      if (it.unit === '건' || !it.at) continue;
      const made = new Date(it.at), md0 = `${made.getFullYear()}-${String(made.getMonth() + 1).padStart(2, '0')}-${String(made.getDate()).padStart(2, '0')}`;
      let d = addD(t, -1); for (let i = 0; i < 7 && !myStudy(it).includes(dowOf(d)); i++) d = addD(d, -1);
      if (d < md0 || d > it.due || (it.log || {})[d] || mySkip(it, d) || (it.ack || {})[d]) continue;
      const left = it.total - myDone(it); if (left <= 0) continue;
      const was = Math.ceil(left / Math.max(1, myDaysLeft(it.due, myStudy(it), d))), now = Math.ceil(left / myLeftDays(it)), nd = myDaysLeft(it.due, myStudy(it));
      out.push({ it, d, was, now, nd });
    }
    return out;
  }
  function missCard() {
    const L = myMissed(); if (!L.length) return '';
    const avg = myAvg(), u = (it) => (it.unit === '쪽' ? '쪽' : '문제'), ds = [...new Set(L.slice(0, 3).map((x) => x.d))];
    const when = ds.length === 1 ? `${md(ds[0])} ${DOW[dowOf(ds[0])]}요일에` : '지난번에';
    return `<section class="card c12 miss-card"><div class="card-h"><h2>${when} 못 한 숙제가 있어요</h2><span class="tiny">${Math.min(L.length, 3)}개</span></div><div class="list">${L.slice(0, 3).map(({ it, d, was, now, nd }) => `<div class="li miss-it"><div class="body"><div class="t">${esc(it.book)}</div>
      <div class="d">${ds.length > 1 ? `${md(d)} · ` : ''}${nd ? `남은 ${nd}일에 나누면 하루 ${was}${u(it)} → <b class="${avg && now > avg ? 'red' : 'blue'}">${now}${u(it)}</b>` : '마감까지 남은 날이 없어요'}</div></div>
      <div class="miss-b"><button class="btn sm primary" type="button" data-miss="split|${esc(it.id)}|${d}">${nd ? '나눠 하기' : '오늘 할게요'}</button><button class="btn sm" type="button" data-miss="push|${esc(it.id)}|${d}">미루기</button><button class="btn sm" type="button" data-miss="did|${esc(it.id)}|${d}|${was}">했어요</button></div></div>`).join('')}</div></section>`;
  }

  // 마감을 다음 할 요일로 하루 미뤄요
  function myPush(it) { const old = it.due; let d = addD(it.due, 1); for (let i = 0; i < 7 && !myStudy(it).includes(dowOf(d)); i++) d = addD(d, 1); it.orig = it.orig || old; it.due = d; return `원래 ${md(it.orig)}까지였는데 ${md(d)} ${DOW[dowOf(d)]}요일까지로 미뤄졌어요`; }
  // 오늘 몫: 남은 양 ÷ 남은 날 (오늘 이미 한 건 빼고 계산해서 오늘 몫이 바뀌지 않게)
  function myToday(it) {
    const t = today(), dn = it.log && it.log[t] ? it.log[t].n : 0, left = it.total - (myDone(it) - dn);
    if (left <= 0) return { n: 0, a: null, b: null, dn };
    if (mySkip(it) && !dn) return { n: 0, a: null, b: null, dn, skip: true };
    const off = dday(it.due) >= 0 && !myStudy(it).includes(dowOf(t)) && myDaysLeft(it.due, myStudy(it)) > 0;  // 오늘은 안 하는 날
    const n = off ? 0 : dday(it.due) < 0 ? left : Math.ceil(left / myLeftDays(it));
    const a = it.from != null ? it.from + (myDone(it) - dn) : null;
    return { n, a, b: a != null ? Math.min(it.to, a + n - 1) : null, dn };
  }
  const myRange = (it, x) => it.unit === '건' ? '하기' : x.a != null ? (it.unit === '쪽' ? `p.${x.a}~${x.b}` : `${x.a}~${x.b}번`) : `${x.n}문제`;
  const isPlan = (it) => it.unit === '건' && it.plan !== false;  // 수행평가·행사 같은 한 번 일은 기본이 일정: 오늘 할 일에 보이지만 셈에 안 들어가요
  const myFin = (it) => it.fin || myDone(it) >= it.total;
  const myCls = (id) => myS().cls.find((c) => c.id === id) || { name: '숙제' };
  const myOpen = () => myS().items.filter((it) => !myFin(it));
  function myTasks() {
    const t = today(), out = [];
    for (const it of myS().items) {
      const x = myToday(it), doneT = !!(it.log && it.log[t]);
      // 수행평가 전날: 「수행 준비하기」가 꼭 할 일로 올라와요
      if (/수행/.test(myCls(it.cls).name + it.book) && !myFin(it) && dday(it.due) === 1) out.push({ k: 'myprep:' + it.id, icon: 'target', t: `수행 준비하기: ${it.book}`, d: `내일 ${myCls(it.cls).name} · 준비 끝나면 눌러요`, done: it.prep === t });
      if (isPlan(it)) { const dd = dday(it.due); if (dd >= 0 && (!myFin(it) || doneT)) out.push({ k: 'my:' + it.id, icon: 'cal', t: it.book, d: `일정 · ${myCls(it.cls).name} · ${dd === 0 ? '오늘' : `${md(it.due)} ${DOW[dowOf(it.due)]}요일 D-${dd}`}`, done: myFin(it), memo: true }); continue; }  // 일정: 끝날 때까지 늘 보이지만 오늘 할 일 셈에는 안 들어가요
      if (myFin(it) && !doneT) continue; if (!x.n && !doneT) continue;
      if (it.unit === '건' && !doneT && dday(it.due) > 1) continue;  // 한 번에 끝내는 일은 마감 전날·당일에만 오늘 할 일로 (그 전엔 「내 숙제」 칸에 D-day로)
      const dd = dday(it.due);
      out.push({ k: 'my:' + it.id, icon: 'write', t: it.unit === '건' ? it.book : `${it.book}: ${doneT ? `오늘 ${it.log[t].n}${it.unit === '쪽' ? '쪽' : '문제'} 했어요` : myRange(it, x)}`, d: `${myCls(it.cls).name} · ${dd < 0 ? '마감 지났어요' : dd === 0 ? '오늘 마감' : `${md(it.due)} ${DOW[dowOf(it.due)]}요일 마감 D-${dd}`}${it.unit === '건' ? '' : ` · ${myDone(it)}/${it.total}`}`, done: doneT });
    }
    return out;
  }
  function myCard(cls) {
    const L = myOpen().sort((a, b) => (!myToday(a).n - !myToday(b).n) || a.due.localeCompare(b.due));
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('write')} 내 숙제</h2><button class="btn sm" type="button" data-myadd>+ 숙제 넣기</button></div>
      ${L.length ? `<div class="list my-list">${L.map((it) => { const x = myToday(it), p = Math.round((myDone(it) / it.total) * 100), dd = dday(it.due); return `<div class="li btnlike" data-task="my:${esc(it.id)}"><div class="ico">${ic('write')}</div><div class="body"><div class="t">${esc(it.unit === '건' ? it.book : it.text)} <span class="tiny">${isPlan(it) ? '일정 · ' : ''}${esc(myCls(it.cls).name)}</span></div><div class="d">${it.unit === '건' ? esc(myCls(it.cls).name) : x.n ? `오늘 ${esc(myRange(it, x))}` : x.dn ? '오늘 몫 끝' : '오늘은 쉬는 요일'} · <b class="${dd <= 1 ? 'red' : ''}">${dd < 0 ? '마감 지남' : dd === 0 ? '오늘 마감' : `${md(it.due)} 마감 D-${dd}`}</b></div><div class="ik-bar"><i style="width:${p}%"></i></div></div></div>`; }).join('')}</div>` : `<p class="tiny" style="margin:12px 0 0">학원·과외·학교 숙제, 수행평가, 학생회 일까지 넣어요. 문제 수가 있으면 마감까지 매일 할 만큼 「오늘 할 일」에 나눠 줘요</p>`}</section>`;
  }
  // 교재: 수업마다 기억해요. 지난번 끝 번호 다음부터 이어서 채워요
  const myBooks = (cid) => { const M = myS(); M.books = M.books || [{ cls: 'c1', name: '마플 시너지' }, { cls: 'c1', name: '마더텅' }, { cls: 'c1', name: '올림포스 기출' }]; return M.books.filter((b) => b.cls === cid); };
  const myLast = (cid, name) => myS().items.filter((it) => it.cls === cid && it.book.startsWith(name) && it.unit !== '건').sort((a, b) => b.at - a.at)[0];
  // 숙제 넣기: 고른 수업의 교재가 줄로 다 펼쳐져요. 줄마다 적어 두면(수업을 바꿔도) 남아 있고, 한 번에 넣어요
  function myAdd() {
    const M = myS(); let cid = (M.last && M.cls.find((c) => c.id === M.last) ? M.last : M.cls[0].id), addCls = false, showDue = false;
    const D0 = {}, dueOf = {};  // D0[cid][name] = {mode,a,b,c,memo}
    const base = (n) => n.replace(/ #\d+$/, '');
    const dr = (c, n) => { D0[c] = D0[c] || {}; if (!D0[c][n]) { const lt0 = myLast(c, base(n)), lt = n === base(n) ? lt0 : lt0 && { ...lt0, to: null }, m = lt ? lt.unit : (myCls(c).day == null ? '건' : '번'); D0[c][n] = { mode: m, a: lt && lt.to != null ? lt.to + 1 : '', b: '', c: '', memo: '', lt }; } return D0[c][n]; };
    const filled = (x) => x.mode === '건' ? !!x.on : x.mode === '문제' ? +x.c > 0 : +x.a > 0 && +x.b >= +x.a;
    const allRows = () => Object.entries(D0).flatMap(([c, o]) => Object.entries(o).filter(([, x]) => filled(x)).map(([n, x]) => ({ c, n, x })));
    const unitOf = (m) => m === '쪽' ? '쪽' : '문제';
    const UL = { '번': '번', '쪽': '쪽', '문제': '문제' }, NX = { '번': '쪽', '쪽': '문제', '문제': '번' };
    const rowHtml = (n, x) => `<div class="my-row ${filled(x) ? 'ok' : ''}" data-rn="${esc(n)}"><b class="my-bn">${filled(x) ? '<i class="my-dot"></i>' : ''}${esc(base(n))}</b>
      ${x.mode === '건' ? `<span class="my-in"><button type="button" class="my-u" data-rplan title="꼭 할 일인지 일정인지">${x.plan !== false ? '일정' : '꼭 할 일'}</button><button type="button" class="my-one ${x.on ? 'on' : ''}" data-ron>${x.on ? '✓ 넣어요' : '넣기'}</button></span>` : `<span class="my-in">${x.mode === '쪽' ? '<span>p.</span>' : ''}${x.mode === '문제' ? `<input class="inp" type="number" inputmode="numeric" data-rf="c" value="${esc(x.c)}" placeholder="몇">` : `<input class="inp" type="number" inputmode="numeric" data-rf="a" value="${esc(x.a)}" placeholder="시작"><span>~</span><input class="inp" type="number" inputmode="numeric" data-rf="b" value="${esc(x.b)}" placeholder="끝">`}<button type="button" class="my-u" data-rm="${NX[x.mode]}" title="번호·쪽·문제 수 바꾸기">${UL[x.mode]}</button></span>
`}
      ${x.mode !== '건' ? `<input class="inp my-ttl" data-rf="memo" value="${esc(x.memo || '')}" placeholder="제목 적기 (안 써도 돼요 · 예: 명제)">` : ''}
      ${x.mode !== '건' ? `<div class="my-ft">${x.lt && n === base(n) ? `<span class="my-prev" role="button" data-rprev="${esc(x.lt.id)}">✎ 지난번 ${x.lt.unit === '쪽' ? `p.${x.lt.from}~${x.lt.to}` : x.lt.from != null ? `${x.lt.from}~${x.lt.to}번` : `${x.lt.total}문제`} · ${md(new Date(x.lt.at).toISOString().slice(0, 10))} 넣음</span>` : ''}<span class="my-ftb">${x.lt && x.lt.to != null && x.mode !== '문제' && !x.b ? `<button type="button" class="my-same" data-rsame>지난번만큼 ${x.lt.total}${unitOf(x.lt.unit)}</button>` : ''}${n === base(n) ? `<button type="button" class="my-more" data-rmore>+ 같은 교재 한 줄 더</button>` : ''}</span></div>` : ''}</div>`;
    const draw = (el) => {
      const due = dueOf[cid] || (dueOf[cid] = myDue(myCls(cid)));
      $('#my-cls', el).innerHTML = M.cls.map((c) => { const k = Object.values(D0[c.id] || {}).filter(filled).length; return `<button type="button" class="chip ${c.id === cid ? 'on' : ''}" data-mc="${c.id}">${esc(c.name)}${k ? ` <b class="my-k">${k}</b>` : ''}</button>`; }).join('') + `<button type="button" class="chip" data-mc="+">+ 수업</button>`;
      $('#my-new', el).hidden = !addCls;
      const ks = Object.keys(D0[cid] || {}), bk = myBooks(cid).map((b) => b.name);
      const names = [...bk, ...ks.filter((n) => n === base(n) && !bk.includes(n))].flatMap((n) => [n, ...ks.filter((k) => k !== n && base(k) === n).sort()]);
      $('#my-rows', el).innerHTML = names.map((n) => rowHtml(n, dr(cid, n))).join('') + `<div class="my-addrow"><input class="inp" id="my-bkn" placeholder="${myCls(cid).day == null ? '할 일 적기 (예: 수행평가 보고서)' : '다른 교재 이름'}"><button type="button" class="btn sm" id="my-bka">+ 추가</button></div>`;
      const sd = myCls(cid).study || [1, 2, 3, 4, 5], nd = myDaysLeft(due, sd);
      const sdT = sd.length === 5 && [1, 2, 3, 4, 5].every((d) => sd.includes(d)) ? '월~금' : [1, 2, 3, 4, 5, 6, 0].filter((d) => sd.includes(d)).map((d) => DOW[d]).join('·');
      $('#my-due', el).innerHTML = `<button type="button" class="my-sum" id="my-sumb"><span>${DOW[dowOf(due)]}요일(${md(due)}) 마감 · ${sdT} <b class="blue">${nd}일</b>에 나눠요</span><span class="blue">${showDue ? '접기' : '바꾸기'}</span></button>
        <div class="my-sd" ${showDue ? '' : 'hidden'}><span class="tiny">마감</span><input type="date" id="my-dd" value="${due}" class="inp sm"><span class="tiny">할 요일</span><div class="pl-dots">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button type="button" data-sd="${d}" class="${sd.includes(d) ? 'on' : ''} ${d === 0 ? 'sun' : d === 6 ? 'sat' : ''}">${DOW[d]}</button>`).join('')}</div></div>`;
      $('#my-sumb', el).onclick = () => { showDue = !showDue; draw(el); };
      $$('[data-sd]', el).forEach((b) => (b.onclick = () => { const c = myCls(cid), d = +b.dataset.sd, cur = c.study || [1, 2, 3, 4, 5]; c.study = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]; if (!c.study.length) c.study = [d]; save('my'); sheet.dirty = true; draw(el); }));
      const n = allRows().length; $('#my-ok', el).textContent = n ? `${n}개 넣기` : '넣기';
      $$('[data-mc]', el).forEach((b) => (b.onclick = () => { if (b.dataset.mc === '+') addCls = !addCls; else cid = b.dataset.mc; draw(el); }));
      $$('.my-row', el).forEach((r) => {
        const x = dr(cid, r.dataset.rn), sync = () => { r.classList.toggle('ok', filled(x)); const bn = $('.my-bn', r), dt = $('.my-dot', bn); if (filled(x) && !dt) bn.insertAdjacentHTML('afterbegin', '<i class="my-dot"></i>'); else if (!filled(x) && dt) dt.remove(); const k = allRows().length; $('#my-ok', el).textContent = k ? `${k}개 넣기` : '넣기'; const cb = $(`[data-mc="${cid}"]`, el); const kk = Object.values(D0[cid]).filter(filled).length; if (cb) cb.innerHTML = `${esc(myCls(cid).name)}${kk ? ` <b class="my-k">${kk}</b>` : ''}`; };
        $$('[data-rf]', r).forEach((inp) => (inp.oninput = () => { x[inp.dataset.rf] = inp.value; sync(); }));
        $$('[data-rm]', r).forEach((b) => (b.onclick = () => { x.mode = b.dataset.rm; if (x.lt && x.lt.to != null && x.lt.unit === x.mode && !x.a) x.a = x.lt.to + 1; draw(el); }));
        const on = $('[data-ron]', r); if (on) on.onclick = () => { x.on = !x.on; draw(el); };
        const pv = $('[data-rprev]', r); if (pv) pv.onclick = () => mySheet(pv.dataset.rprev);
        const mo = $('[data-rmore]', r); if (mo) mo.onclick = () => { const b = r.dataset.rn; let i = 2; while (D0[cid][`${b} #${i}`]) i++; const y = dr(cid, `${b} #${i}`); y.mode = x.mode === '건' ? '번' : x.mode; if (filled(x) && x.b) y.a = ''; draw(el); };
        const pl = $('[data-rplan]', r); if (pl) pl.onclick = () => { x.plan = x.plan === false; x.on = true; draw(el); };
        const sm = $('[data-rsame]', r); if (sm) sm.onclick = () => { if (!x.a) x.a = x.lt.to + 1; x.b = +x.a + x.lt.total - 1; x.mode = x.lt.unit; draw(el); };
      });
      $('#my-bka', el).onclick = () => { const v = $('#my-bkn', el).value.trim(); if (!v) return; const x = dr(cid, v); if (myCls(cid).day == null) { x.mode = '건'; x.on = true; } draw(el); };
      $('#my-bkn', el).onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) $('#my-bka', el).click(); };
      $('#my-dd', el).onchange = (e) => { if (e.target.value) { dueOf[cid] = e.target.value; draw(el); } };
    };
    sheet(`<h2>숙제 넣기</h2>
      <div class="chips multi my-chips" id="my-cls" style="margin-top:12px"></div>
      <div id="my-new" class="my-new" hidden><input class="inp" id="my-nn" placeholder="예: 국어 과외"><div class="pl-dots" style="margin:8px 0 0">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button type="button" data-nd="${d}" class="${d === 0 ? 'sun' : d === 6 ? 'sat' : ''}">${DOW[d]}</button>`).join('')}</div><p class="tiny" style="margin:6px 0 0">수업 요일을 누르면 추가돼요. 그 전날이 마감이에요</p><button type="button" class="btn sm" id="my-nod" style="margin-top:8px">요일 없이 추가 (학교 숙제처럼)</button></div>
      <div class="my-due" id="my-due"></div>
      <div id="my-rows"></div>
      <button class="btn primary big block" id="my-ok" type="button" style="margin-top:16px">넣기</button>
      <details class="my-paste"><summary>여러 줄을 한꺼번에 붙여넣기</summary><textarea class="inp my-ta" id="my-ta" rows="4" placeholder="받은 숙제를 그대로 붙여넣어요. 한 줄에 하나씩"></textarea><button class="btn block" id="my-pok" type="button" style="margin-top:8px">붙여넣은 것 넣기</button></details>`, (el, close) => {
      draw(el);
      const addC = (day) => { const n = $('#my-nn', el).value.trim(); if (!n) { toast('수업 이름을 먼저 적어요'); return; } const c = { id: 'c' + Date.now().toString(36), name: n, day }; M.cls.push(c); cid = c.id; addCls = false; $('#my-nn', el).value = ''; save('my'); draw(el); };
      $$('[data-nd]', el).forEach((b) => (b.onclick = () => addC(+b.dataset.nd)));
      $('#my-nod', el).onclick = () => addC(null);
      const push = (c, due, it) => M.items.push({ id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), cls: c, due, days: (myCls(c).study || [1, 2, 3, 4, 5]).slice(), at: Date.now(), log: {}, wrong: [], ...it });
      $('#my-ok', el).onclick = () => {
        const R = allRows(); if (!R.length) { toast('교재 옆에 번호를 적어요'); return; }
        for (let { c, n, x } of R) {
          const due = dueOf[c] || myDue(myCls(c)); n = base(n); const tt = (x.memo || '').trim(), bn = tt ? `${n} ${tt}` : n;
          if (x.mode !== '건' && !myBooks(c).some((b) => b.name === n)) M.books.push({ cls: c, name: n });
          if (x.mode === '번' || x.mode === '쪽') push(c, due, { book: bn, text: `${bn} ${x.mode === '쪽' ? `p.${x.a}~${x.b}` : `${x.a}~${x.b}번`}`, unit: x.mode, from: +x.a, to: +x.b, total: x.b - x.a + 1 });
          else if (x.mode === '문제') push(c, due, { book: bn, text: `${bn} ${x.c}문제`, unit: '문제', from: null, to: null, total: +x.c });
          else push(c, due, { book: n, text: n, unit: '건', from: null, to: null, total: 1, plan: x.plan !== false });
        }
        for (const k of Object.keys(D0)) for (const [nn, y] of Object.entries(D0[k])) if (filled(y)) delete D0[k][nn];
        M.last = cid; save('my'); sheet.dirty = true; draw(el); toast(`${R.length}개 넣었어요 · 더 넣거나 닫아요`);
      };
      $('#my-pok', el).onclick = () => { const L = $('#my-ta', el).value.split('\n').map(myParse).filter(Boolean); if (!L.length) return; const due = dueOf[cid] || myDue(myCls(cid)); L.forEach((l) => push(cid, due, l)); M.last = cid; save('my'); close(); render(); toast(`${L.length}개 넣었어요`); };
    });
  }
  function mySheet(id) {
    const it = myS().items.find((x) => x.id === id); if (!it) return;
    const t = today(), x = myToday(it), dt = it.log[t];
    sheet(`<div class="row" style="gap:8px;margin-bottom:8px"><span class="tag">${esc(myCls(it.cls).name)}</span><span class="tiny">${md(it.due)} 마감 · D-${Math.max(0, dday(it.due))}</span></div>
      <label class="my-h2"><input id="my-bt" value="${esc(it.book)}" aria-label="제목 바꾸기"><span>수정</span></label><p class="tiny" style="margin:0 0 12px;line-height:1.6">${esc(it.text)}</p>
      <div class="ik-bar" style="height:8px"><i style="width:${Math.round((myDone(it) / it.total) * 100)}%"></i></div><p class="tiny" style="margin:6px 0 16px">${myDone(it)} / ${it.total}${it.unit === '쪽' ? '쪽' : '문제'} 했어요</p>
      ${it.unit === '건' ? '' : `<div class="my-today"><span class="tiny">오늘 할 것${myAvg() ? ` · 보통 하루 ${myAvg()}문제 해요` : ''}</span><b>${x.skip ? '내일로 미뤘어요' : x.n ? esc(myRange(it, x)) : '오늘 몫은 없어요'}</b>${it.orig ? `<span class="tiny">원래 ${md(it.orig)} 마감 → ${md(it.due)}로 미뤄짐</span>` : ''}${!dt && (x.n || x.skip) ? `<button type="button" class="my-skip" id="my-skip">${x.skip ? '미룬 것 취소' : '내일로 미루기'}</button>` : ''}</div>
      <div class="my-amt"><span>오늘 한 만큼</span><button type="button" class="btn sm" data-ma="-1">−</button><input class="inp sm" id="my-n" type="number" inputmode="numeric" min="0" value="${dt ? dt.n : x.n}"><button type="button" class="btn sm" data-ma="1">+</button></div>
      <div class="my-st" id="my-st" hidden><span class="tiny">틀린 번호를 고르려면 오늘 푼 첫 번호를 적어요</span><input class="inp" type="number" inputmode="numeric" id="my-s0" placeholder="예: 1225" value="${dt && dt.s ? dt.s : ''}"></div>
      <div class="my-wcw" id="my-wcw"><div class="tiny" style="margin-top:14px">틀린 번호를 눌러요 · 나중에 오답 탭에서 다시 풀어요</div><div class="my-wc" id="my-wc"></div></div>
      <input type="hidden" id="my-w" inputmode="numeric" placeholder="예: 1225 1231 1240" value="${esc((dt && dt.w || []).join(' '))}">`}
      <button class="btn primary big block" id="my-ok" type="button" style="margin-top:16px">${it.unit === '건' ? (myFin(it) ? '아직 안 끝났어요' : '끝냈어요') : dt ? '고쳐서 저장' : '오늘 것 끝냈어요'}</button>
      <div class="row" style="gap:8px;margin-top:8px">${it.unit === '건' ? `<button class="btn block" id="my-plan" type="button">${isPlan(it) ? '꼭 할 일로 바꾸기' : '일정으로 바꾸기'}</button>` : `<button class="btn block" id="my-fin" type="button">${it.fin ? '다시 하기' : '다 끝났어요'}</button>`}<button class="btn block" id="my-del" type="button">지우기</button></div>
      <details class="my-edit"><summary>범위·마감 고치기</summary><div class="my-ed">${it.unit === '건' ? '' : it.from != null ? `<span class="my-in">${it.unit === '쪽' ? '<span>p.</span>' : ''}<input class="inp" type="number" inputmode="numeric" id="my-ea" value="${it.from}"><span>~</span><input class="inp" type="number" inputmode="numeric" id="my-eb" value="${it.to}"><span>${it.unit === '쪽' ? '쪽' : '번'}</span></span>` : `<span class="my-in"><input class="inp" type="number" inputmode="numeric" id="my-ec" value="${it.total}"><span>문제</span></span>`}
        <label class="my-in"><span>마감</span><input type="date" class="inp sm" id="my-ed" value="${it.due}"></label><button class="btn primary" id="my-es" type="button">고쳐서 저장</button></div></details>`, (el, close) => {
      $('#my-es', el).onclick = () => { const a = $('#my-ea', el), b = $('#my-eb', el), c = $('#my-ec', el), d = $('#my-ed', el).value;
        if (a && b) { const f = +a.value, z = +b.value; if (!(f > 0 && z >= f)) { toast('시작과 끝 번호를 확인해요'); return; } it.from = f; it.to = z; it.total = z - f + 1; it.text = `${it.book} ${it.unit === '쪽' ? `p.${f}~${z}` : `${f}~${z}번`}`; }
        if (c) { if (!(+c.value > 0)) { toast('문제 수를 적어요'); return; } it.total = +c.value; it.text = `${it.book} ${it.total}문제`; }
        if (d) it.due = d; save('my'); sheet.dirty = true; const bb = $('#sheet-root .sh-back'); if (bb) bb.click(); else close(); toast('고쳤어요'); };
      const sk = $('#my-skip', el); if (sk) sk.onclick = () => { const t = today(); it.skip = { ...(it.skip || {}) }; if (it.skip[t]) { it.skip[t] = 0; save('my'); close(); render(); toast('미룬 걸 취소했어요'); return; }
        it.skip[t] = 1; let msg = ''; if (!myDaysLeft(it.due, myStudy(it), addD(t, 1))) msg = myPush(it) + ' · ';
        const n = myToday({ ...it, skip: {} }).n, nd = myDaysLeft(it.due, myStudy(it), addD(t, 1)), left = it.total - myDone(it), per = Math.ceil(left / Math.max(1, nd)), avg = myAvg();
        save('my'); close(); render(); toast(msg + `내일부터 남은 ${nd}일, 하루 ${per}${it.unit === '쪽' ? '쪽' : '문제'}${avg ? ` (보통 하루 ${avg}문제)` : ''}`); };
      $('#my-bt', el).onchange = (e) => { const v = e.target.value.trim(); if (!v || v === it.book) return; it.text = it.text.startsWith(it.book) ? v + it.text.slice(it.book.length) : it.text; it.book = v; save('my'); sheet.dirty = true; toast('제목을 바꿨어요'); };
      $('#my-bt', el).onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) e.target.blur(); };
      const mp = $('#my-plan', el); if (mp) mp.onclick = () => { it.plan = !isPlan(it); save('my'); close(); render(); toast(it.plan ? '일정으로 바꿨어요 · 오늘 할 일 셈에서 빠져요' : '꼭 할 일로 바꿨어요'); };
      // 오늘 한 번호를 단추로 펼쳐서 틀린 것만 눌러요 (스페이스로 치지 않게)
      const wc = () => { const box = $('#my-wc', el), wi = $('#my-w', el); if (!box || !wi) return; const s0 = +($('#my-s0', el) || {}).value || 0, a0 = x.a != null ? x.a : dt && it.from != null ? it.from + myDone(it) - dt.n : s0 || null, n = +($('#my-n', el) || {}).value || 0;
        $('#my-st', el).hidden = it.from != null;
        const has = !(a0 == null || !n || n > 80); $('#my-wcw', el).hidden = !has; 
        if (!has) { box.innerHTML = ''; return; }
        const W = new Set((wi.value.match(/\d+/g) || []).map(Number)), z = Math.min(it.to != null ? it.to : Infinity, a0 + n - 1);
        box.innerHTML = Array.from({ length: z - a0 + 1 }, (_, k) => a0 + k).map((v) => `<button type="button" class="${W.has(v) ? 'on' : ''}" data-wn="${v}">${v}</button>`).join('');
        $$('[data-wn]', box).forEach((b) => (b.onclick = () => { const v = +b.dataset.wn; W.has(v) ? W.delete(v) : W.add(v); wi.value = [...W].sort((p, q) => p - q).join(' '); b.classList.toggle('on', W.has(v)); })); };
      if ($('#my-s0', el)) $('#my-s0', el).addEventListener('input', wc);
      if ($('#my-w', el)) { $('#my-w', el).addEventListener('input', wc); $('#my-n', el).addEventListener('input', wc); wc(); }
      $$('[data-ma]', el).forEach((b) => (b.onclick = () => { const i = $('#my-n', el); i.value = Math.max(0, (+i.value || 0) + +b.dataset.ma); wc(); }));
      $('#my-ok', el).onclick = () => {
        if (it.unit === '건') { if (myFin(it)) { const at = Date.now(); for (const d of Object.keys(it.log || {})) it.log[d] = { n: 0, at }; it.fin = false; } else { it.log[t] = { n: 1, at: Date.now() }; if (!isPlan(it)) earn('my:' + it.id + ':' + t, 100, '내 숙제'); boom(innerWidth / 2, innerHeight * 0.4, 2); } save('my'); close(); render(); return; }
        const n = Math.max(0, +$('#my-n', el).value || 0), w = ($('#my-w', el).value.match(/\d+/g) || []).map(Number);
        it.log[t] = { n, w, at: Date.now(), ...(+($('#my-s0', el) || {}).value ? { s: +$('#my-s0', el).value } : {}) }; it.wrong = [...new Set([...(it.wrong || []).filter((v) => !(dt && (dt.w || []).includes(v))), ...w])].sort((a, b) => a - b);
        save('my'); close(); render(); if (n) earn('my:' + it.id + ':' + t, 100, '학원·과외 숙제'); toast(w.length ? `틀린 ${w.length}문제는 오답 탭에 모아 뒀어요` : '오늘 것 끝! 잘했어요');
        if (myFin(it)) { const r = document.body.getBoundingClientRect(); boom(innerWidth / 2, innerHeight * 0.4, 4); }
      };
      if ($('#my-fin', el)) $('#my-fin', el).onclick = () => { it.fin = !it.fin; save('my'); close(); render(); };
      $('#my-del', el).onclick = () => { if (!$('#my-del', el).dataset.sure) { $('#my-del', el).dataset.sure = 1; $('#my-del', el).textContent = '한 번 더 누르면 지워요'; return; } myS().gone = { ...(myS().gone || {}), [it.id]: Date.now() }; myS().items = myS().items.filter((y) => y !== it); save('my'); close(); render(); toast('지웠어요'); };
    });
  }
  // 오답 탭: 학원·과외에서 틀린 번호 모음. 누르면 다시 맞힌 걸로
  // 수학 문제집: 틀린 번호 → 그 문제 자리(쪽 그림을 잘라 보여 줘요)와 풀이
  const MB_ID = (book) => /마플/.test(book) ? 'mpl' : /마더텅/.test(book) ? 'mdt' : /올림포스/.test(book) ? 'oly' : null;
  function mbKeys(it, v) {
    const b = EB.books.find((x) => x.id === MB_ID(it.book)); if (!b || !b.q) return [];
    if (b.id === 'mpl') { const k = String(v).padStart(4, '0'); return b.q[k] ? [k] : []; }
    const pad = String(v).padStart(b.id === 'mdt' ? 3 : 2, '0'), all = Object.keys(b.q).filter((k) => k.endsWith('-' + pad));
    const HINT = { mdt: [['명제', '명제'], ['유리', '유리식과 유리함수'], ['무리', '무리식과 무리함수'], ['함수', '함수']], oly: [['명제', '09-'], ['유리', '11-'], ['무리', '11-'], ['함수', '10-'], ['개념', '-개념-'], ['유형', '-유형-'], ['도전', '-도전-']] }[b.id];
    let L = all; for (const [w, pre] of HINT) if ((it.book + ' ' + it.text).includes(w)) { const f = L.filter((k) => k.includes(pre)); if (f.length) L = f; }
    return L;
  }
  function mbCrop(bk, k) {
    const q = bk.q[k]; if (!q) return null; const [p, y, x] = q, same = Object.values(bk.q).filter((o) => o[0] === p);
    const below = same.filter((o) => Math.abs(o[2] - x) < 400 && o[1] > y + 60).map((o) => o[1]), right = same.filter((o) => o[2] > x + 400).map((o) => o[2]);
    const pg = bk.ch.flatMap((c) => c.pages).find((g) => g.n === p); if (!pg) return null;
    const T = Math.max(0, y - 120), B = below.length ? Math.min(...below) - 40 : 9800, L = Math.max(0, x - 150), Rr = right.length ? Math.min(...right) - 60 : 9900;
    return { pg, T: T / 1e4, B: Math.max(B, y + 600) / 1e4, L: L / 1e4, R: Rr / 1e4, p };
  }
  const mbCut = (c, id) => `<div class="mb-cut" style="aspect-ratio:${((c.R - c.L) / ((c.B - c.T) * c.pg.r)).toFixed(4)}"><img id="${id}" alt="" style="width:${(100 / (c.R - c.L)).toFixed(3)}%;left:${(-c.L / (c.R - c.L) * 100).toFixed(3)}%;top:${(-c.T / (c.B - c.T) * 100).toFixed(3)}%"></div>`;
  function mbSheet(itId, v) {
    const it = myS().items.find((x) => x.id === itId); if (!it) return;
    const keys = mbKeys(it, v), bk = EB.books.find((x) => x.id === MB_ID(it.book)), sb = bk && (EB.sol || []).find((x) => x.id === bk.id + '-s');
    const open = (k) => {
      const c = mbCrop(bk, k), sc = sb && mbCrop(sb, k), wrong = (it.wrong || []).includes(+v);
      sheet(`<div class="row" style="gap:8px;margin-bottom:8px"><span class="tag">${esc(bk.title)}</span><span class="tiny">${esc(k)}번 · ${c ? c.p + '쪽' : ''}</span></div>
        <h2 style="margin:0 0 12px">${esc(String(v))}번 다시 풀기</h2>
        <div class="chips" id="mb-tab" style="margin:0 0 12px"><button type="button" class="chip on" data-mbt="q">문제</button>${sc ? `<button type="button" class="chip" data-mbt="s">${bk.id === 'mdt' ? '정답' : '풀이'}</button>` : ''}</div>
        <div id="mb-q">${c ? mbCut(c, 'mb-qi') : '<p class="tiny">문제 자리를 못 찾았어요</p>'}</div><div id="mb-s" hidden>${sc ? mbCut(sc, 'mb-si') : ''}</div>
        <button class="btn primary big block" id="mb-ok" type="button" style="margin-top:16px">${wrong ? '다시 풀어서 맞혔어요' : '다시 틀렸어요'}</button>
        ${c ? `<button class="btn block" id="mb-pg" type="button" style="margin-top:8px">쪽 전체 보기</button>` : ''}`, (el, close) => {
        if (c) ebImg(c.pg.f).then((u) => { const i = $('#mb-qi', el); if (i) i.src = u; });
        if (sc) ebImg(sc.pg.f).then((u) => { const i = $('#mb-si', el); if (i) i.src = u; });
        $$('[data-mbt]', el).forEach((b) => (b.onclick = () => { $$('[data-mbt]', el).forEach((y) => y.classList.toggle('on', y === b)); segRe(b.parentNode); $('#mb-q', el).hidden = b.dataset.mbt !== 'q'; $('#mb-s', el).hidden = b.dataset.mbt !== 's'; }));
        $('#mb-ok', el).onclick = () => { myWrongFlip(it, +v); close(); render(); };
        const pg = $('#mb-pg', el); if (pg) pg.onclick = () => { close(); bookOpen(bk.id, null, c.p); };
      });
    };
    if (keys.length === 1) return open(keys[0]);
    if (!keys.length) { myWrongFlip(it, +v); render(); return; }
    sheet(`<h2>${esc(String(v))}번이 어느 단원이에요?</h2><p class="sub">이 책은 단원마다 번호가 다시 시작해요</p><div class="list">${keys.map((k) => `<button type="button" class="li btnlike" data-mbk="${esc(k)}"><div class="body"><div class="t">${esc(k)}</div><div class="d">${bk.q[k][0]}쪽</div></div></button>`).join('')}</div>`, (el) => {
      $$('[data-mbk]', el).forEach((b) => (b.onclick = () => open(b.dataset.mbk)));
    });
  }
  // 문제집 오답 다시 풀기: 모의고사 지문 화면처럼 왼쪽 문제 · 오른쪽 풀이. 맞히면 다음 오답으로 바로 넘어가요
  const mbwList = () => myS().items.filter((it) => MB_ID(it.book)).flatMap((it) => (it.wrong || []).map((v) => ({ id: it.id, v: String(v) })));
  function mbwGo(id, v, k) { UI.run = { kind: 'mbw', id, v: String(v), k: k || null, back: UI.run && UI.run.kind === 'mbw' ? UI.run.back : UI.tab }; render(); scrollTo(0, 0); }
  // 오답 다시 풀기: 답을 먼저 골라요. 맞히면 풀이가 열리고, 틀리면 다시 해보거나 해설을 봐요
  const mbAns = (bk, k) => bk && k && (MANS[bk.id] || {})[k];
  const mbNorm = (x) => String(x).replace(/\s+/g, '').replace(/[①②③④⑤]/g, (c) => '①②③④⑤'.indexOf(c) + 1).replace(/−/g, '-');
  const mbWc = (it, v) => 1 + ((it.wc || {})[v] || 0);
  function mbwRun() {
    const r = UI.run, it = myS().items.find((x) => x.id === r.id), L = mbwList(), i = L.findIndex((x) => x.id === r.id && x.v === r.v);
    const head = `<div class="row between"><button class="btn sm" data-go="${esc(r.back || 'wrong')}" type="button">‹ 돌아가기</button><span class="tiny">${L.length ? (i >= 0 ? `오답 ${i + 1} / ${L.length}` : `남은 오답 ${L.length}개`) : '남은 오답이 없어요'}</span></div>`;
    if (!it) return `<div class="qwrap">${head}</div>`;
    const bk = EB.books.find((x) => x.id === MB_ID(it.book)), sb = bk && (EB.sol || []).find((x) => x.id === bk.id + '-s'), keys = bk ? mbKeys(it, r.v) : [], k = r.k || (keys.length === 1 ? keys[0] : null);
    const wrong = (it.wrong || []).includes(+r.v), nx = r.nx || (L.length ? L[(i + 1) % L.length] : null), pv = i > 0 ? L[i - 1] : null, ans = mbAns(bk, k);
    const nav = `<div class="row" style="gap:8px;margin-top:8px">${pv ? `<button class="btn big" style="flex:1" type="button" data-mbw="${esc(pv.id)}:${esc(pv.v)}">‹ 이전</button>` : ''}${nx && !(nx.id === r.id && nx.v === r.v) ? `<button class="btn big ${r.st === 'ok' || r.show ? 'primary' : ''}" style="flex:1" type="button" data-mbw="${esc(nx.id)}:${esc(nx.v)}">다음 오답 ›</button>` : (r.st === 'ok' || r.show) ? `<button class="btn big primary" style="flex:1" type="button" data-go="${esc(r.back || 'wrong')}">오답 목록으로</button>` : ''}</div>`;
    const wc = mbWc(it, r.v);
    const top = `${head}<div class="mbw-h"><h2>${esc(r.v)}번 다시 풀기</h2><span class="tag">${esc(bk ? bk.title : it.book)}</span>${wrong || r.st ? `<span class="tag mbw-wc">${wc}번 틀림</span>` : ''}${k && k !== String(r.v).padStart(4, '0') ? `<span class="tiny">${esc(k)}</span>` : ''}</div>`;
    let btns;
    if (!ans) btns = `<button class="btn primary big block" id="mbw-ok" type="button">${wrong ? '다시 풀어서 맞혔어요' : '다시 틀렸어요'}</button>${r.show ? '' : `<button class="btn big block" id="mbw-show" type="button" style="margin-top:8px">풀이 보기</button>`}${nav}`;
    else if (r.st === 'ok') btns = `<div class="mbw-res ok"><b>맞았어요!</b><span>정답 ${/^[1-5]$/.test(ans) ? '①②③④⑤'[ans - 1] : esc(ans)} · 풀이로 한 번 더 확인해요</span></div>${wrong ? '' : `<button class="btn big block" id="mbw-keep" type="button">다시 오답노트에 담기</button>`}${nav}`;
    else if (r.st === 'no') btns = `<div class="mbw-res no"><b>아쉬워요, 아직 아니에요</b><span>${r.show ? `정답은 ${/^[1-5]$/.test(ans) ? '①②③④⑤'[ans - 1] : esc(ans)}이에요. 풀이를 보고 다시 풀어 봐요` : '다시 풀어 보거나 해설을 봐요'}</span></div><div class="row" style="gap:8px"><button class="btn primary big" style="flex:1" id="mbw-again" type="button">다시 해보기</button>${r.show ? '' : `<button class="btn big" style="flex:1" id="mbw-show" type="button">해설 보기</button>`}</div>${nav}`;
    else btns = `<div class="mbw-pick"><div class="psg-h" style="padding:0 0 8px">답 고르기</div><div class="mbw-ch">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="mbw-c" data-mba="${n}">${'①②③④⑤'[n - 1]}</button>`).join('')}</div><form class="mbw-in" id="mbw-f"><input class="inp" id="mbw-a" inputmode="text" autocomplete="off" placeholder="주관식이면 답을 적어요"><button class="btn" type="submit">확인</button></form></div>${nav}`;
    if (!k && keys.length > 1) return `<div class="qwrap" style="max-width:720px;margin:0 auto">${top}<p class="sub">이 책은 단원마다 번호가 다시 시작해요. 어느 단원이에요?</p><div class="card tight"><div class="list">${keys.map((x) => `<button type="button" class="li btnlike" data-mbk="${esc(x)}"><div class="body"><div class="t">${esc(x)}</div><div class="d">${bk.q[x][0]}쪽</div></div><span class="chev"></span></button>`).join('')}</div></div></div>`;
    const c = k && mbCrop(bk, k), sc = k && sb && mbCrop(sb, k), open = r.st === 'ok' || r.show;
    if (!c) return `<div class="qwrap" style="max-width:720px;margin:0 auto">${top}<div class="empty">${ic('think')}<b>이 번호는 문제집에서 못 찾았어요</b><span>책을 펴서 풀고 맞혔으면 아래를 눌러요</span></div>${btns}</div>`;
    return `<div class="qwrap mbw" style="max-width:1200px;margin:0 auto">${top}<div class="split mbw-split">
      <div class="psg" aria-label="문제"><div class="psg-h">문제 <span class="tiny">${c.p}쪽</span></div>${mbCut(c, 'mbw-q')}<button class="btn sm" id="mbw-pg" type="button" style="margin-top:8px">쪽 전체 보기</button></div>
      <div class="qside">${btns}${open ? `<div class="card mbw-sol"><div class="psg-h" style="padding:0 0 8px">${bk.id === 'mdt' ? '정답' : '풀이'}</div>${sc ? mbCut(sc, 'mbw-s') : '<p class="tiny">풀이 자리를 못 찾았어요</p>'}</div>` : `<div class="mbw-lock">${ic('think')}<span>답을 맞히면 풀이가 열려요</span></div>`}</div></div></div>`;
  }
  function bindMbw() {
    const r = UI.run, it = myS().items.find((x) => x.id === r.id); if (!it) return;
    const bk = EB.books.find((x) => x.id === MB_ID(it.book)), sb = bk && (EB.sol || []).find((x) => x.id === bk.id + '-s'), keys = bk ? mbKeys(it, r.v) : [], k = r.k || (keys.length === 1 ? keys[0] : null);
    const c = k && mbCrop(bk, k), sc = k && sb && mbCrop(sb, k), ans = mbAns(bk, k);
    if (c) ebImg(c.pg.f).then((u) => { const im = $('#mbw-q'); if (im) im.src = u; });
    if (sc) ebImg(sc.pg.f).then((u) => { const im = $('#mbw-s'); if (im) im.src = u; });
    $$('[data-mbk]').forEach((b) => (b.onclick = () => { UI.run.k = b.dataset.mbk; render(); }));
    $$('[data-mbw]').forEach((b) => (b.onclick = () => { const [id, v] = b.dataset.mbw.split(':'); mbwGo(id, v); }));
    const pg = $('#mbw-pg'); if (pg) pg.onclick = () => bookOpen(bk.id, null, c.p);
    const keep = () => { const y = window.scrollY; render(); scrollTo(0, y); };
    const check = (a) => {
      if (!String(a).trim()) return;
      if (mbNorm(a) === mbNorm(ans)) {
        const L = mbwList(), i = L.findIndex((x) => x.id === r.id && x.v === r.v); r.nx = L.length > 1 ? L[(i + 1) % L.length] : null;
        r.st = 'ok'; if ((it.wrong || []).includes(+r.v)) myWrongFlip(it, +r.v); else toast('맞혔어요!');
        if (navigator.vibrate) navigator.vibrate(20);
      } else { r.st = 'no'; it.wc = { ...(it.wc || {}), [r.v]: ((it.wc || {})[r.v] || 0) + 1 }; save('my'); if (navigator.vibrate) navigator.vibrate([30, 40, 30]); }
      keep();
    };
    $$('[data-mba]').forEach((b) => (b.onclick = () => check(b.dataset.mba)));
    const f = $('#mbw-f'); if (f) f.onsubmit = (e) => { e.preventDefault(); check($('#mbw-a').value); };
    const ag = $('#mbw-again'); if (ag) ag.onclick = () => { r.st = null; r.show = false; keep(); };
    const sh = $('#mbw-show'); if (sh) sh.onclick = () => { r.show = true; keep(); };
    const kp = $('#mbw-keep'); if (kp) kp.onclick = () => { myWrongFlip(it, +r.v); toast('오답노트에 다시 담았어요'); keep(); };
    const ok = $('#mbw-ok'); if (ok) ok.onclick = () => { const was = (it.wrong || []).includes(+r.v), i = mbwList().findIndex((x) => x.id === r.id && x.v === r.v); myWrongFlip(it, +r.v); if (!was) return render();
      const L = mbwList(); if (!L.length) { UI.run = null; UI.tab = r.back || 'wrong'; toast('오답을 다 맞혔어요!'); render(); return; }
      const after = L[i] || L[0]; setTimeout(() => mbwGo(after.id, after.v), 500); };
  }
  function myWrongFlip(it, n) {
    if ((it.wrong || []).includes(n)) { it.wrong = it.wrong.filter((x) => x !== n); it.redo = [...(it.redo || []), n]; earn('myw:' + it.id + ':' + n, 50, '학원 오답 다시 맞힘'); toast(WALLET ? '맞혔어요! 50원' : '맞혔어요!'); }
    else { it.redo = (it.redo || []).filter((x) => x !== n); it.wrong = [...(it.wrong || []), n].sort((a, c) => a - c); }
    save('my');
  }
  function myWrongCard(cls) {
    const L = myS().items.filter((it) => (it.wrong || []).length || (it.redo || []).length); if (!L.length) return '';
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('write')} 학원·과외 틀린 문제</h2><span class="tiny">다시 풀어 맞히면 눌러요</span></div>
      ${L.map((it) => `<div class="my-wr"><b>${esc(it.book)} <span class="tiny">${esc(myCls(it.cls).name)}</span></b><div class="my-wn">${(it.wrong || []).map((v) => `<button type="button" data-mw="${esc(it.id)}:${v}">${v}</button>`).join('')}${(it.redo || []).map((v) => `<button type="button" class="ok" data-mw="${esc(it.id)}:${v}">${v}</button>`).join('')}</div></div>`).join('')}</section>`;
  }
  // 천일문 개념 정리: 한 줄 핵심 · 표 · 포인트(예문 강조) · 꼭 외울 것(가리고 외우기) · 시험 함정
  function chLesson(un) {
    const L = un.lesson, hl = (ex, h) => { const e = esc(ex || ''); if (!h || !ex.includes(h)) return e; return e.replace(esc(h), `<mark>${esc(h)}</mark>`); };
    return `<div class="card cl-top"><div class="q-no">Unit ${esc(un.unit)}</div><h1 class="h1" style="margin-top:4px">${esc(un.title)}</h1><p class="cl-hook">${esc(L.hook || '')}</p></div>
      ${L.table ? `<div class="card"><div class="card-h"><h3>${esc(L.table.cap || '한눈에 보기')}</h3></div><div class="cl-tw"><table class="cl-t"><thead><tr>${L.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${L.table.rows.map((r) => `<tr${r.some((c) => String(c).includes('절대 안 됨')) ? ' class="cl-no"' : ''}>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>` : ''}
      <div class="card"><div class="card-h"><h3>핵심 포인트</h3></div><div class="cl-pts">${(L.points || []).map((p, k) => `<div class="cl-pt"><span class="cl-n">${k + 1}</span><div><b>${esc(p.t)}</b><p>${esc(p.d)}</p>${p.ex ? `<div class="cl-ex"><span>${hl(p.ex, p.hl)}</span>${p.ko ? `<em>${esc(p.ko)}</em>` : ''}</div>` : ''}</div></div>`).join('')}</div></div>
      ${(L.memo || []).length ? `<div class="card cl-memo"><div class="card-h"><h3>${ic('target')} 꼭 외울 것</h3><button class="btn sm" type="button" onclick="const c=this.closest('.cl-memo');c.classList.toggle('hide');c.querySelectorAll('li').forEach(x=>x.classList.remove('show'));this.textContent=c.classList.contains('hide')?'다 보기':'가리고 외우기'">가리고 외우기</button></div><ol>${L.memo.map((m) => `<li onclick="this.classList.toggle('show')"><span>${esc(m)}</span></li>`).join('')}</ol><p class="tiny" style="margin:8px 0 0">가린 다음 하나씩 떠올려 보고 눌러서 확인해요</p></div>` : ''}
      ${(L.trap || []).length ? `<div class="card"><div class="card-h"><h3>시험 함정</h3></div>${L.trap.map((t) => `<div class="cl-trap"><div class="x"><b>✗</b><span>${esc(t.x)}</span></div><div class="o"><b>✓</b><span>${esc(t.o)}</span></div><p>${esc(t.why)}</p></div>`).join('')}</div>` : ''}`;
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
  const ebFind = (cid) => { for (const b of EB.books) { const c = b.ch.find((x) => x.id === cid); if (c) return { b, c }; } const [bid, pn] = String(cid).split(':'), b = EB.books.find((x) => x.id === bid), c = b && b.ch.find((x) => x.pages.some((pg) => pg.n === +pn)); return c ? { b, c } : null; };  // 단원 나눔이 바뀌어도 쪽으로 찾아요
  let ebKeyP = null;
  const ebKey = () => ebKeyP || (ebKeyP = crypto.subtle.importKey('raw', new Uint8Array(EB.key.match(/../g).map((x) => parseInt(x, 16))), 'AES-CTR', false, ['decrypt']));
  async function ebGet(f) { const r = await fetch(f); if (!r.ok) throw new Error(f); const buf = new Uint8Array(await r.arrayBuffer()); return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CTR', counter: buf.slice(0, 16), length: 64 }, await ebKey(), buf.slice(16))); }
  const ebC = new Map();
  const ebMemo = (k, fn) => { if (!ebC.has(k)) ebC.set(k, fn().catch((e) => { ebC.delete(k); throw e; })); return ebC.get(k); };
  const ebUrl = new Map();
  const ebImg = (f) => ebMemo(f, () => ebGet(f).then((u) => { const x = URL.createObjectURL(new Blob([u], { type: 'image/webp' })); ebUrl.set(f, x); return x; }));
  // 한 단원의 쪽별 단어: [{x0,x1,y0,y1,t,l}] (쪽 크기 대비 0~10000, l = 줄 번호)
  const ebTx = (c) => ebMemo(c.tx, () => ebGet(c.tx).then((u) => new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).json()).then((j) => { const o = {}; for (const [n, lines] of Object.entries(j)) { const W = []; lines.forEach(([y0, y1, f], l) => { for (let i = 0; i < f.length; i += 3) W.push({ x0: f[i], x1: f[i + 1], y0, y1, t: f[i + 2], l }); }); o[n] = W; } return o; }));
  const bkMarks = (cid, n) => Object.entries(bkS().marks).filter(([, m]) => m.p === n && (m.c === cid || (ebFind(m.c) || { c: {} }).c.id === cid));
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
    return `<h1 class="h1">기말 교재</h1><p class="sub">기말 범위를 적고, 시험 범위 교과서·문제집을 읽으면서 형광펜·밑줄을 긋고, 모르는 곳은 선생님께 물어봐요</p><div class="grid">${examCard()}${bookCard() || `<section class="card c12"><div class="empty">${gh('sleepy', 'gh-empty')}<b>아직 교과서가 없어요</b></div></section>`}</div>`;
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
      <div class="bk-top"><button class="btn sm" type="button" data-bkback>‹ ${esc((TABS.find((t) => t[0] === (r.back || 'book')) || ['', '교재'])[1])}</button><div class="bk-hd"><b>${esc(b.title)}</b><span>${esc(c.no)} ${esc(c.t)}${c.ref ? ' <span class="tag">참고</span>' : ''}</span></div>${innerWidth >= 1100 ? `<button class="btn sm" type="button" id="bk-one">${bkOne() ? '두 쪽 보기' : '한 쪽 크게'}</button>` : ''}<button class="btn sm" type="button" id="bk-toc">목차</button></div>
      <aside class="bk-side"><div class="row between" style="padding:0 8px 8px"><span class="tiny">${esc(b.pub)} · ${esc(b.range)}</span><button class="btn sm" type="button" id="bk-tocx">닫기</button></div>${toc}</aside>
      <div class="bk-stage" id="bk-stage"><button type="button" class="bk-arr l" data-turn="-1" ${first ? 'disabled' : ''} aria-label="앞 쪽">‹</button><div class="bk-spread ${sp.length > 1 ? 'two' : ''}" id="bk-spread">${sp.map((k) => pg(P[k])).join('')}</div><button type="button" class="bk-arr r" data-turn="1" ${last ? 'disabled' : ''} aria-label="다음 쪽">›</button></div>
      <div class="bk-bar"><input type="range" class="bk-sl" id="bk-sl" min="0" max="${P.length - 1}" value="${sp[0]}" style="--p:${P.length > 1 ? sp[0] / (P.length - 1) * 100 : 0}%" aria-label="쪽 고르기"><span class="bk-pn num">${sp.map((k) => P[k].n).join('~')}쪽 <span class="tiny">/ ${P.length}쪽 중 ${sp[sp.length - 1] + 1}</span></span></div>
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
        .map((x) => { if (!ebFind(x.c)) { const b = EB.books.find((y) => y.id === x.b), c = b && b.ch.find((y) => y.pages.some((pg) => pg.n === x.p)); if (c) x.c = c.id; } return x; })
        .filter((x) => ebFind(x.c) && (flt === 'all' ? !x.pin : flt === 'later' ? x.later : x.q))  // 책이 바뀌어 없어진 단원의 표시는 빼요 (없으면 화면이 안 떴어요)
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
    const hwList = S.hw || [];
    return `<h1 class="h1">오늘의 숙제</h1><div class="row between wrap" style="gap:8px;margin-bottom:16px"><p class="sub" style="margin:0">${TUTOR ? '지난 수업에서 배운 것을 다음 수업 전까지 풀어요' : '꼭 할 일부터 끝내요. 학원·학교 숙제는 마감까지 나눠서 매일 할 만큼만 나와요'}</p>${TUTOR ? '' : `<button class="btn sm" id="plan-open" type="button"><svg class="gear" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#8b95a1" stroke="#8b95a1" stroke-width="1.8" stroke-linejoin="round" fill-rule="evenodd" d="M10.3 2h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.6.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6L2 13.7v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7zM12 15.9a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8z"/></svg> 매일 과제 요일</button>`}</div>${perfLive().length ? `<div style="margin-bottom:16px">${perfCard()}</div>` : ''}
    <div class="grid">${TUTOR ? '' : missCard()}
      ${(() => {
        const { tasks } = todayTasks(), real = tasks.filter((t) => t.icon !== 'party' && !t.memo), dn = real.filter((t) => t.done).length;
        const by = (a, b) => String(a.due || '').localeCompare(String(b.due || ''));
        const later = TEACHER ? hwList.filter((h) => !hwDone(h) && h.due && h.due > today()).sort(by) : [], done = hwList.filter((h) => hwDone(h)).sort(by).reverse();
        const hrow = (h, later) => `<div class="li btnlike" data-hwopen="${esc(h.id)}"><button class="ico" data-hwdone="${esc(h.id)}" style="border:0;cursor:pointer" aria-label="완료">${ic(hwDone(h) ? 'ok' : 'pin')}</button><div class="body"><div class="t" style="${hwDone(h) ? 'color:var(--t3);text-decoration:line-through' : later ? 'color:var(--t2);font-weight:500' : ''}">${esc(h.title)}</div><div class="d">${[h.subj, h.due ? md(h.due) + (later ? ' 숙제' : '') : ''].filter(Boolean).map(esc).join(' · ')}</div></div>${TEACHER ? `<button class="btn sm" data-hwdel="${esc(h.id)}" type="button">지우기</button>` : ''}<span class="chev"></span></div>`;
        const row = (t) => `<div class="li btnlike ${t.done ? 'is-done' : ''}" ${t.hw ? `data-hwopen="${esc(t.hw)}"` : `data-task="${esc(t.k)}"`}><div class="ico">${ic(t.done ? 'ok' : t.icon)}</div><div class="body"><div class="t">${esc(t.t)}${t.hw ? ' <span class="tag">선생님</span>' : ''}</div><div class="d">${esc(t.d)}</div></div>${t.done ? '<span class="tag blue">끝</span>' : '<span class="chev"></span>'}</div>`;
        const tog = (pn, label, n) => n ? `<button type="button" data-pn="${pn}" data-lb="${label} <b>${n}</b>" onclick="const s=this.closest('section'),p=s.querySelector('[data-pane='+this.dataset.pn+']'),o=p.hidden;s.querySelectorAll('.hw-pane').forEach(x=>x.hidden=true);this.parentNode.querySelectorAll('button[data-lb]').forEach(b=>{b.classList.remove('on');b.innerHTML=b.dataset.lb});if(o){p.hidden=false;this.classList.add('on');this.textContent='접기'}">${label} <b>${n}</b></button>` : '';
        return `<section class="card ${TUTOR ? 'c8' : 'c12'}"><div class="card-h"><h2>오늘 할 것</h2>${real.length ? `<span class="tiny">${real.length}개 중 <b class="${dn === real.length ? 'blue' : ''}">${dn}개</b> 끝</span>` : ''}${TEACHER ? '<button class="btn sm soft" id="hw-add" type="button">숙제 내기</button>' : ''}</div>
          ${real.length ? `<div class="td-prog"><i style="width:${(dn / real.length) * 100}%"></i></div>` : ''}
          ${real.length ? `<div class="list">${[...real.filter((t) => !t.done), ...real.filter((t) => t.done)].map(row).join('')}</div>${dn === real.length ? `<div class="td-all">${gh('yay', 'gh-td')}<span>오늘 할 것을 다 끝냈어요</span></div>` : ''}` : `<div class="empty" style="padding:16px 0">${gh('sleepy', 'gh-empty')}<b>오늘은 쉬는 날이에요</b></div>`}
          ${later.length || done.length ? `<div class="hw-tog">${tog('later', '앞으로 낼 숙제', later.length)}${tog('done', '끝낸 숙제', done.length)}</div>
          ${later.length ? `<div class="hw-pane list" data-pane="later" hidden>${later.map((h) => hrow(h, true)).join('')}</div>` : ''}${done.length ? `<div class="hw-pane list" data-pane="done" hidden>${done.map((h) => hrow(h)).join('')}</div>` : ''}` : ''}</section>`;
      })()}
      ${TUTOR ? hwCal() : ''}
      ${TUTOR ? '' : myCard('c12')}
      ${TUTOR ? '' : inkCard('c12')}
      ${drillCard()}
      ${TUTOR ? gramLib() + juaLibs() : ''}
      ${libCard()}
      ${TUTOR ? nxLib() : ''}
      ${TUTOR ? '' : hwCal()}
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
    sheet(`<h2>매일 과제 요일</h2><p class="sub">과제마다 하는 요일을 골라요. 고른 날에만 「오늘 할 일」에 나와요</p>
      <div class="pl-all"><span class="tiny">모두 한 번에</span><div class="row" style="gap:6px">${PRE.map((p, i) => `<button type="button" class="chip sm" data-all="${i}">${p.t}</button>`).join('')}</div></div>
      <div id="pl-body"></div><button class="btn primary big block" id="pl-ok" type="button" style="margin-top:20px">저장하기</button>`, (el, close) => {
      draw(el);
      $$('[data-all]', el).forEach((b) => (b.onclick = () => { for (const x of PLAN_KINDS) P[x.k] = PRE[+b.dataset.all].d.slice(); draw(el); }));
      $('#pl-ok', el).onclick = () => { S.plan = P; save('plan'); close(); render(); toast('매일 과제 요일을 바꿨어요'); };
    });
  }
  // 지난 기록: 꾸준히 칸의 날짜를 누르면 그날 한 것
  function dayItems(d) {
    const out = [], s = (S.sci.days || {})[d], e = (S.eng.days || {})[d];
    if (s) { const st = dayStat(s), c = SCI.concepts.find((x) => x.id === s.c); if (st.done) out.push({ i: 'sci', t: c ? `과학 · ${c.title}` : '오늘의 과학', d: `${st.n}문제 중 ${st.done}개 풀고 ${st.ok}개 맞힘` }); }
    if (e) {
      if (uDone(e)) { const un = CH_UNITS[e.unit]; out.push({ i: 'eng', t: `천일문 ${un ? 'Unit ' + un.unit + ' ' + (un.title || '') : ''}`.trim(), d: '다 했어요' }); }
      const wn = Object.keys(e.wans || {}).length; if (wn) out.push({ i: 'books', t: '워드마스터 단어 시험', d: `${wn}개 중 ${Object.values(e.wans).filter((x) => x.ok).length}개 맞힘` });
      if (g3Did(e)) { const g = G3[e.g3 || 0]; out.push({ i: 'write', t: '고3 영어 한 문제', d: g ? `${g.type || ''} · ${g.src || ''}` : '풀었어요' }); }
    }
    for (const h of S.hw || []) if (hwDone(h) && (h.doneAt ? new Date(h.doneAt).toLocaleDateString('sv') === d : h.due === d)) out.push({ i: 'pin', t: h.title, d: '선생님 숙제 · 끝냄' });
    // 숙제 달력 (10/27 정윤: 날짜 누르면 그날 한 숙제가 쭉) · 누르면 그 숙제로 다시 들어가요
    for (const c of FIN_ALL) if (finDoneDay(c) === d) { const q = c.page || c.text ? null : finPicked(c); out.push({ i: c.subj === 'hist' ? 'scroll' : 'books', t: `${c.subj === 'eng' ? '올림포스 지문' : c.sname + ' 기말 예습'} · ${c.title}`, d: q ? `${q}문제 풀었어요 · 눌러서 다시 보기` : '끝냈어요 · 눌러서 다시 보기', go: 'fincid:' + c.id }); }
    for (const it of myS().items) { const x = (it.log || {})[d]; if (x && (x.n || it.unit === '건')) out.push({ i: 'write', t: it.book, d: `${myCls(it.cls).name}${x.n && it.unit !== '건' ? ` · ${x.n}${it.unit === '쪽' ? '쪽' : '문제'}` : ' · 끝냄'}`, go: 'my:' + it.id }); }
    for (const l of W().log.filter((x) => x.date === d && String(x.key).startsWith('news:'))) { const n = ((D.news && D.news.items) || []).find((y) => 'news:' + y.id === l.key); if (n) out.push({ i: 'news', t: n.title, d: '기사 읽음', go: l.key }); }
    for (const x of PERF) if ((S.perfDone || {})[x.id] === d) out.push({ i: x.icon || 'pencil', t: x.title, d: '수행평가 준비 끝', go: 'perf:' + x.id });
    { const I = inkS(); for (const [k, v] of Object.entries(I.at)) { if (v !== d || I.st[k] !== 'done') continue; const [cid, no] = k.split(':'), c = inkC(cid), l = c && inkL(c, +no); if (!l) continue; const q = I.q[k]; out.push({ i: INK_IC[cid] || 'books', t: `${c.subj} 인강 · ${l.title}`, d: q ? `미니 퀴즈 ${q.n}문제 중 ${q.ok}개 맞힘 · 눌러서 문제 보기` : '들었어요', go: 'ink:' + k }); } }
    const pd = (pomo().days || {})[d]; if (pd && pd.man) out.push({ i: 'clock', t: `공부 시간 ${hm(sMin(d))}`, d: '직접 적은 시간' }); if (pd && pd.n) out.push({ i: 'tomato', t: `토마토 ${pd.n}개`, d: `집중 ${pd.min || pd.n * 25}분` });
    for (const l of (S.logs || []).filter((x) => x.date === d)) out.push({ i: 'write', t: '학교에서 한 것', d: l.text || l.t || '' });
    return out;
  }
  function hwCal() {
    const m = UI.calM || today().slice(0, 7), [Y, M] = m.split('-').map(Number), first = new Date(Y, M - 1, 1), n = new Date(Y, M, 0).getDate(), pad = first.getDay();
    const cells = [...Array(pad).fill(null), ...Array.from({ length: n }, (_, i) => `${m}-${String(i + 1).padStart(2, '0')}`)];
    const cnt = {}; let tot = 0, dn = 0; for (const d of cells) if (d && d <= today()) { cnt[d] = dayItems(d).length; tot += cnt[d]; if (cnt[d]) dn++; }
    const mo = sSum(m + '-01', m + '-31');
    const prev = new Date(Y, M - 2, 1).toLocaleDateString('sv').slice(0, 7), next = new Date(Y, M, 1).toLocaleDateString('sv').slice(0, 7);
    return `<section class="card ${TUTOR ? 'c4' : 'c6'} col-card hcal-card"><div class="card-h"><h2>${ic('cal')} 숙제 달력</h2><div class="row" style="gap:2px"><button class="btn sm ghost" type="button" data-calm="${prev}" aria-label="지난달">‹</button><b class="num" style="min-width:44px;text-align:center">${M}월</b><button class="btn sm ghost" type="button" data-calm="${next}" aria-label="다음 달" ${next > today().slice(0, 7) ? 'disabled' : ''}>›</button></div></div>
      <p class="tiny" style="margin:0 0 12px">${dn ? `이번 달 ${dn}일 동안 ${tot}개 했어요${mo ? ` · 공부 ${hm(mo)}` : ''}` : '숙제를 하면 그날 칸에 쌓여요'} · 날짜를 누르면 그날 한 숙제가 다 나와요</p>
      <div class="hcal-g">${'일월화수목금토'.split('').map((w) => `<span class="hcal-w">${w}</span>`).join('')}${cells.map((d) => { if (!d) return '<i></i>'; const c = cnt[d] || 0, st = sMin(d), fut = d > today(); return `<button type="button" class="hcal-d ${d === today() ? 'today' : ''} ${c ? 'l' + (c >= 8 ? 3 : c >= 4 ? 2 : 1) : ''}" ${fut ? 'disabled' : `data-day="${d}"`}><span class="hc-n num">${+d.slice(8)}</span>${c ? `<span class="hc-c">${c}개</span>` : ''}${st ? `<span class="hc-h">${st >= 60 ? (st / 60).toFixed(1) + '시간' : st + '분'}</span>` : ''}</button>`; }).join('')}</div></section>`;
  }
  function daySheet(d) {
    const out = dayItems(d);
    const won = W().log.filter((x) => x.date === d).reduce((a, x) => a + x.amt, 0);
    const dt = new Date(d + 'T00:00:00'), wk = '일월화수목금토'[dt.getDay()];
    sheet(`<h2>${md(d)} (${wk})</h2><p class="sub">${d === today() ? '오늘 지금까지 한 것' : '이날 한 것'}${won ? ` · 용돈 +${won.toLocaleString()}원` : ''}</p>
      ${out.length ? `<div class="list">${out.map((x) => `<div class="li ${x.go ? 'btnlike' : ''}" ${x.go ? `data-dgo="${esc(x.go)}" role="button" tabindex="0"` : ''}><div class="ico">${ic(x.i)}</div><div class="body"><div class="t">${esc(x.t)}</div><div class="d">${esc(x.d)}</div></div>${x.go ? '<span class="chev"></span>' : ic('ok')}</div>`).join('')}</div>` : `<div class="empty">${gh('sleepy', 'gh-empty')}<b>이날은 기록이 없어요</b><span>쉬는 날도 필요해요</span></div>`}`, (el, close) => {
      $$('[data-dgo]', el).forEach((b) => (b.onclick = () => { const g = b.dataset.dgo; close(); setTimeout(() => {
        if (g.startsWith('fincid:')) { UI.tab = 'hw'; UI.run = { kind: 'fin', cid: g.slice(7), read: true }; render(); window.scrollTo(0, 0); }
        else if (g.startsWith('perf:')) { UI.tab = 'hw'; UI.run = { kind: 'perf', id: g.slice(5) }; render(); window.scrollTo(0, 0); }
        else startTask(g);
      }, 300); }));
    });
  }
  // 주아 숙제: go 에 그래머 섹션·리스닝 쪽을 담으면 누르자마자 그 화면이 열리고, 다 풀면 저절로 끝나요 (10/26)
  function hwGoDone(h) {
    const g = h.go; if (!g) return false;
    if (g.kind === 'gram') { const u = jgU(g.unit), qs = jgQs(u, g.step, g.secs); return !!qs.length && qs.every((q) => jgRec(u, q)); }
    if (g.kind === 'jl') { const u = jlV({ ...g, only: 1 }), T = u && u.tracks[0]; if (!T) return false; const [a, b] = jlTally(u, 'words'), qs = (T.qs || []).map((q, i) => [q, i]).filter(([q]) => jlQOk(q)); return a >= b && qs.every(([, i]) => jGet('jl', jlK(u, T, 'q', i))); }
    return false;
  }
  function hwGoStart(h) { const g = h.go; if (!g || !(g.kind === 'gram' ? jgU(g.unit) : jlU(g.unit))) return false; UI.tab = 'hw'; UI.lib = null; UI.run = { ...g, only: g.kind === 'jl' ? 1 : g.only }; render(); window.scrollTo(0, 0); return true; }
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
        <button class="btn primary big block" id="hs-go" type="button">${left.length ? `${left.length}문제 풀기` : '한 번 더 풀어 보기'}</button>` : mmOf(h) ? `<p class="sub" style="margin:12px 0">모의고사 ${mmOf(h).length}문제예요. 다 풀면 숙제도 끝난 걸로 돼요</p><button class="btn primary big block" id="hs-mm" type="button">${mmLeft(mmOf(h)).length ? `${mmLeft(mmOf(h)).length}문제 풀기` : '다시 보기'}</button>` : h.nx && NXSETS[h.nx] ? `<p class="sub" style="margin:12px 0">${esc(NXSETS[h.nx].title)} ${NXSETS[h.nx].qs.length}${NXSETS[h.nx].kind === 'words' ? '단어' : '문제'}예요. 끝까지 풀면 숙제도 끝난 걸로 돼요</p><button class="btn primary big block" id="hs-nx" type="button">${(() => { const L = nxLast(h.nx); return L ? '한 번 더 풀기' : '시험 보러 가기'; })()}</button>` : mock ? `<p class="sub" style="margin:12px 0">10월 모의고사 ${esc(h.subj)} 문제는 오답 노트에 다 들어 있어요. 지문과 문제를 앱에서 바로 다시 풀 수 있어요</p><button class="btn soft big block" id="hs-wrong" type="button">${ic('retry')} 오답 노트에서 ${esc(SUBJ_NAMES[key])} 풀기</button>` : ''}
      ${h.go ? '<button class="btn primary big block" id="hs-go2" type="button" style="margin-top:12px">풀러 가기</button>' : ''}<div class="row" style="margin-top:16px"><button class="btn big" style="flex:1" data-x type="button">닫기</button>${ids.length || h.go ? '' : `<button class="btn ${h.done ? '' : 'primary'} big" style="flex:1" id="hs-done" type="button">${h.done ? '안 한 걸로 되돌리기' : '다 했어요'}</button>`}</div>`, (el, close) => {
      $('[data-x]', el).onclick = close;
      const hn = $('#hs-nx', el); if (hn) hn.onclick = () => { close(); nxStart(h.nx, 'hw'); };
      const hg = $('#hs-go2', el); if (hg) hg.onclick = () => { close(); hwGoStart(h); };
      const hm = $('#hs-mm', el); if (hm) hm.onclick = () => { close(); mmHwStart(h); };
      const go = $('#hs-go', el); if (go) go.onclick = () => { const q = left.length ? left : ids; close(); UI.tab = 'hw'; UI.run = { kind: 'retry', id: q[0], queue: q.slice(1), back: 'hw' }; render(); window.scrollTo(0, 0); };
      const dn = $('#hs-done', el); if (dn) dn.onclick = () => { h.done = !h.done; h.doneAt = Date.now(); save('hw'); close(); render(); if (h.done) toast('잘했어요'); };
      const w = $('#hs-wrong', el); if (w) w.onclick = () => { close(); UI.wrongSubj = key; go('wrong'); };
    });
  }
  // 선생님 홈(DASH_ONLY)에서는 학생을 골라 그 학생 기록에 바로 넣어요 (여러 명 한 번에)
  // 다른 학생 기록: 서버에서 최신을 받아 고친 뒤 그 칸만 새 시각으로 올려요 (학생 앱이 다음에 받아 감)
  async function dPut(name, key, fn) {
    const d = (await rpc('univ_get', { p_student: name, p_code: U.key })) || {};
    const out = fn(d), now = Date.now(); d._at = { ...(d._at || {}) }; for (const k of [].concat(key)) d._at[k] = now;
    await rpc('univ_put', { p_student: name, p_code: U.key, p_data: d });
    const row = (roster.rows || []).find((x) => x.r.name === name); if (row) row.d = d;
    return out;
  }
  async function hwPush(name, item) {
    if (name === U.who) { S.hw = S.hw || []; S.hw.push(item); save('hw'); return; }
    await dPut(name, 'hw', (d) => { d.hw = [...(d.hw || []), item]; });
  }
  function hwAddSheet(pre) {
    const multi = DASH_ONLY, sel = new Set(pre ? [pre] : []), isT = (n) => !!(ROSTER.find((r) => r.name === n) || {}).tutor;
    const eng = () => (multi ? sel.size && [...sel].every(isT) : TUTOR);
    sheet(`<h2>숙제 내기</h2><p class="sub">${multi ? '고른 학생의 숙제 목록에 바로 보여요' : `${esc(U.who)}의 숙제 목록에 바로 보여요`}</p>
      ${multi ? `<div class="field"><label>누구에게 (여러 명 골라도 돼요)</label><div class="chips" id="h-who">${ROSTER.map((r) => `<button class="chip ${sel.has(r.name) ? 'on' : ''}" data-w="${esc(r.name)}" type="button"><i class="sv-dot" style="--sc:${esc(sColor(r))}"></i>${esc(r.name)}</button>`).join('')}</div></div>` : ''}
      <div class="field"><label>무엇을</label><input class="inp" id="h-t" placeholder="${eng() ? '예) 천일문 60~62 복습' : '예) 수학 RPM 120~135쪽'}"></div>
      <div class="row" style="gap:12px"><div class="field" style="flex:1"><label>과목</label><select class="inp" id="h-s">${['국어', '수학', '영어', '한국사', '통합사회', '통합과학', '생기부', '기타'].map((s) => `<option ${eng() && s === '영어' ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>언제까지</label><input class="inp" type="date" id="h-d"></div></div>
      <div class="field"><label>메모</label><input class="inp" id="h-m" placeholder="선택"></div>
      <button class="btn primary big block" id="h-ok" type="button">내기</button>`, (el, close) => {
      el.querySelectorAll('[data-w]').forEach((b) => (b.onclick = () => { const n = b.dataset.w; sel.has(n) ? sel.delete(n) : sel.add(n); b.classList.toggle('on', sel.has(n)); if (eng()) { $('#h-s', el).value = '영어'; $('#h-t', el).placeholder = '예) 천일문 60~62 복습'; } }));
      $('#h-ok', el).onclick = async () => {
        const t = $('#h-t', el).value.trim(); if (!t) { $('#h-t', el).focus(); return; }
        const item = { id: 'h' + Date.now(), title: t, subj: $('#h-s', el).value, due: $('#h-d', el).value, memo: $('#h-m', el).value.trim(), done: false, at: Date.now() };
        if (!multi) { S.hw = S.hw || []; S.hw.push(item); save('hw'); close(); render(); toast('숙제를 냈어요'); return; }
        if (!sel.size) { toast('누구에게 낼지 골라 주세요'); return; }
        const ok = $('#h-ok', el); ok.disabled = true; ok.textContent = '내는 중…';
        const names = [...sel], bad = [];
        for (const n of names) { try { await hwPush(n, { ...item }); } catch (e) { bad.push(n); } }
        if (bad.length) { ok.disabled = false; ok.textContent = '다시 내기'; sel.clear(); bad.forEach((n) => sel.add(n)); el.querySelectorAll('[data-w]').forEach((b) => b.classList.toggle('on', sel.has(b.dataset.w))); toast(`${bad.join('·')}에게는 못 냈어요. 인터넷을 보고 다시 눌러 주세요`); return; }
        close(); render(); toast(`${names.join('·')}에게 숙제를 냈어요`);
      };
    });
  }


  // ───────── 문제 풀기 화면 (과학 · 영어 · 오답 다시 풀기 공용) ─────────
  function qBody(q) {
    return `${q.q ? `<div class="q-text">${rich(q.q)}</div>` : ''}${q.type === '빈칸' && q.ko ? `<div class="q-ko">${esc(q.ko)}</div>` : ''}${q.passage ? `<div class="q-box" style="font-size:15.5px;line-height:1.85;font-weight:400">${q.ptitle ? `<b>${esc(q.ptitle)}</b><br>` : ''}${rich(q.passage)}</div>` : ''}${q.box && q.box.length ? `<div class="q-box">${q.box.map((b) => `<div>${esc(b)}</div>`).join('')}</div>` : ''}${q.table && q.table.length ? `<div class="tbl-wrap"><table class="q-tbl">${q.table.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}`;
  }
  function choicesHtml(q, pick) {
    const done = pick != null;
    return `<div class="choices">${(q.choices || []).map((c, k) => `<button class="choice ${done ? (k === q.answer ? 'right' : k === pick ? 'wrong' : '') : ''}" data-pick="${k}" type="button" ${done ? 'disabled' : ''}><span class="n">${k + 1}</span><span>${rich(c)}</span></button>`).join('')}</div>`;
  }
  // 다 풀었을 때: 큰 흰 카드 가운데 아이콘 · 점수 · 한마디, 버튼은 아래에 크게
  // 3D 유령: 한 번만 도는 동작은 볼 때마다 처음부터 다시 돌도록 매번 새 주소(blob)로 붙여요
  // ───────── 테마: 색 전체 + 3D 인형 펫 (아직 로컬 시험 중: localStorage mu:themes=1 일 때만 보여요) ─────────
  const SKIN_DEV = (() => { try { return localStorage.getItem('mu:themes') === '1'; } catch (e) { return false; } })();
  const SKINS = { ghost: { n: '말랑 유령', c: '#3182f6', d: '기본' }, kitty: { n: '헬로키티', c: '#e8384f', d: '빨간 리본' }, monchhichi: { n: '몬치치', c: '#a0673d', d: '복슬복슬 갈색' }, melody: { n: '마이멜로디', c: '#e35d93', d: '분홍 두건' }, chiikawa: { n: '치이카와', c: '#e07686', d: '말랑 하양' }, cinnamoroll: { n: '시나모롤', c: '#5aa6e6', d: '하늘 구름' }, kuromi: { n: '쿠로미', c: '#8a63c9', d: '검은 두건 해골' }, bamdol: { n: '밤돌이', c: '#12a594', d: '나뭇잎 셔츠' } };
  const SKIN_Q = new URLSearchParams(location.search).get('skin');  // 시험용: 탭마다 다른 테마 (?skin=kitty)
  const owned = () => (S.profile.skins || []).filter((k) => SKINS[k]);
  // 선생님 내 정보 (이름·생일·MBTI·테마): 학생 기록과 따로 서버 「_선생님」 칸에 저장해요
  const TPK = 'mallang-univ:tprof', TPN = '_선생님';
  const TP = (() => { try { return JSON.parse(localStorage.getItem(TPK) || 'null') || {}; } catch (e) { return {}; } })();
  if (!TP.name) TP.name = '선생님';
  // 선생님 「나의 한마디」: 선생님 홈 펫 말풍선에만 나와요. 학생 펫은 자기 한마디와 선생님이 그 학생에게 보낸 한마디를 번갈아 (10/27)
  function tMottoSave() { tSave(); }
  function tSave() { TP._at = Date.now(); try { localStorage.setItem(TPK, JSON.stringify(TP)); } catch (e) {} rpc('univ_put', { p_student: TPN, p_code: U.key, p_data: { profile: TP } }).catch(() => {}); }
  async function tLoad() { try { const r = await rpc('univ_get', { p_student: TPN, p_code: U.key }); const q = r && r.profile; if (q && (q._at || 0) > (TP._at || 0)) { Object.assign(TP, q); try { localStorage.setItem(TPK, JSON.stringify(TP)); } catch (e) {} render(); } } catch (e) {} }
  const skin = () => DASH_ONLY ? (SKINS[TP.skin] && (TP.skin === 'ghost' || GIFTS.includes(TP.skin)) ? TP.skin : 'ghost') : (SKIN_DEV && SKINS[SKIN_Q] ? SKIN_Q : SKINS[S.profile.skin] && (SKIN_DEV || owned().includes(S.profile.skin)) ? S.profile.skin : 'ghost');
  // 테마 선물: 선생님이 보내면 「띵동!」 → 물음표 상자가 두근두근 → 짜잔. 열심히 하면 하나씩 받아요
  const GIFTS = ['melody', 'kitty', 'chiikawa', 'cinnamoroll', 'kuromi', 'bamdol'];  // 지금 보낼 수 있는 테마 (scripts/build.py PETS_LIVE 와 같게)
  // 테마 선물은 여러 개를 줄 수 있어요: S.gifts = [{ skin, at, open }] (예전 S.gift 하나도 같이 읽음)
  const gAll = () => { const L = [...(S.gifts || [])], g = S.gift || {}; if (g.skin && !L.some((x) => x.skin === g.skin)) L.push(g); return L; };
  const gLive = () => gAll().filter((x) => !x.x || x.open);  // x: 선생님이 거둬들인 선물 (지우지 않고 표시만 해야 다른 기기와 합칠 때 안 되살아나요)
  const gPend = () => gLive().filter((x) => x.skin && !x.open && SKINS[x.skin] && !owned().includes(x.skin));
  const skinPic = (k) => (k === 'ghost' ? 'assets/ghost/idle.png' : `assets/pets/${k}/idle.png`);
  function giftCard() {
    if (!TEACHER) return '';
    const own = owned(), pend = gPend();
    return `<section class="card c12"><div class="card-h"><h3>${ic('gift')} ${esc(NMI())}에게 테마 선물</h3></div><div class="list">${GIFTS.map((k) => { const has = own.includes(k), wait = pend.some((x) => x.skin === k); return `<div class="li"><img src="${skinPic(k)}" alt="" style="width:48px;height:48px;object-fit:contain"><div class="body"><div class="t">${esc(SKINS[k].n)} 테마</div><div class="d">${has ? `${esc(NMI())}가 받았어요` : wait ? '보냈어요 · 아직 안 열어 봤어요' : `보내면 ${esc(NMI())} 앱에 「띵동! 선물이 도착했어요」가 떠요`}</div></div>${has ? `<span class="tag blue">받음</span>` : wait ? `<button class="btn sm" type="button" data-giftx="${k}">취소</button>` : `<button class="btn primary sm" type="button" data-tgift="${k}">선물 보내기</button>`}</div>`; }).join('')}</div></section>`;
  }
  function giftHome() {
    const g = gPend()[0]; if (TEACHER || !g) return '';
    return `<section class="card c12 gift-card"><span class="gift-ic">${ic('gift')}</span><div class="body"><span class="eyebrow">띵동!</span><b>선물이 도착했어요</b><span class="tiny">선생님이 보낸 선물이에요</span></div><button class="btn primary" type="button" data-giftopen>열어 보기</button></section>`;
  }
  function giftCheck() {
    const g = gPend()[0]; if (TEACHER || PEEK || UI.run || !g || giftCheck.on || giftCheck.seen === g.at) return;
    giftCheck.seen = g.at; setTimeout(giftPop, 700);
  }
  function giftPop() {
    const g = gPend()[0] || {}, k = g.skin; if (!k || giftCheck.on) return; giftCheck.on = true;
    const el = document.createElement('div'); el.className = 'gf';
    const close = () => { el.classList.remove('on'); setTimeout(() => { el.remove(); giftCheck.on = false; render(); }, 260); };
    const page = (title, sub, mid, btn, link) => `<div class="gf-top"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><div class="gf-mid">${mid}</div><div class="gf-bot">${btn ? `<button class="btn primary big block" type="button" id="gf-a">${btn}</button>` : ''}${link ? `<button class="gf-link" type="button" id="gf-b">${link}</button>` : ''}</div>`;
    const petals = () => `<div class="gf-burst">${Array.from({ length: 10 }, (_, i) => `<i style="--a:${i * 36 + (i % 2) * 14}deg;--d:${(i % 3) * 60}ms;--l:${70 + (i % 3) * 22}px"></i>`).join('')}</div>`;
    el.innerHTML = `<div class="gf-in">${page('띵동!<br>선물이 도착했어요', '선생님이 보낸 선물이에요', `<div class="gf-box">${ic('gift')}</div>`, '열어 볼게요', '이따 열기')}</div>`;
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on')); ding(3); if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    const inn = $('.gf-in', el);
    $('#gf-b', el).onclick = close;
    $('#gf-a', el).onclick = () => {
      inn.innerHTML = page('두근두근<br>뭐가 들어 있을까요?', '', `<div class="gf-box gf-open">${ic('gift')}</div>`, '', '');
      if (navigator.vibrate) navigator.vibrate(20);
      const reveal = () => {
        S.profile.skins = [...new Set([...(S.profile.skins || []), k])]; S.gifts = gAll().map((x) => (x.skin === k ? { ...x, open: Date.now() } : x)); S.gift = {}; save('profile', 'gifts', 'gift');
        inn.innerHTML = page(`${esc(SKINS[k].n)} 테마를<br>받았어요`, '내 정보에서 언제든 바꿀 수 있어요', `${petals()}<img class="gf-pet" src="assets/pets/${k}/yay.webp" alt="" onerror="this.src='${skinPic(k)}'">`, '바로 써 볼게요', '나중에');
        inn.style.setProperty('--gk', SKINS[k].c); inn.classList.add('won');
        const r = $('.gf-pet', inn).getBoundingClientRect(); boom(r.left + r.width / 2, r.top + r.height / 2, 4); ding(8); if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
        $('#gf-a', inn).onclick = () => { S.profile.skin = k; save('profile'); close(); toast(`${SKINS[k].n} 테마로 바꿨어요`); };
        $('#gf-b', inn).onclick = close;
      };
      setTimeout(reveal, RM() ? 600 : 2200);
    };
  }
  const petBase = () => (skin() === 'ghost' ? 'assets/ghost' : 'assets/pets/' + skin());
  function applySkin() {
    const t = skin();
    if (document.documentElement.dataset.skin !== t) document.documentElement.dataset.skin = t;
    // 로고는 테마와 상관없이 말랑 로고 그대로
    petDock();
  }
  // 펫: 화면 첫 카드 윗변에 창틀처럼 두 팔을 걸치고 있어요. 누르면 폴짝, 밤엔 팔에 얼굴 묻고 졸아요
  const PET_WINK = new Set(['melody', 'cinnamoroll', 'kuromi', 'bamdol']); // 찡긋 표정이 있는 펫
  function petDock() {
    const t = skin(), host = !UI.run && $('#main .card');  // 유령은 걸치는 그림이 없어서 서 있는 그림으로 카드 위에 올라앉아요 (10/27 «다른 애들처럼 그 위에 붙어»)
    const pdir = t === 'ghost' ? 'assets/ghost' : `assets/pets/${t}`, pmap = (n) => (t === 'ghost' ? { perch: 'idle', perch_yay: 'yay', perch_wink: 'yay' }[n] || n : n);
    $$('.pet-perch').forEach((x) => { if (!host || x.parentNode !== host || x.dataset.skin !== t || x.dataset.mo !== petLinesKey()) x.remove(); });
    if (!host || $('.pet-perch', host)) return;
    const base = 'perch'; // 첫 카드 왼쪽 위에 걸침 · 자는 동작은 안 씀 (사용자)
    const el = document.createElement('button'); el.type = 'button'; el.className = 'pet-perch' + (petDock.shown ? ' still' : ''); petDock.shown = true; el.dataset.skin = t; el.dataset.mo = petLinesKey(); el.setAttribute('aria-label', SKINS[t].n);
    const lines = petLines(), motto = lines.length ? 1 : 0; let li = 0; // 말풍선: 선생님 한마디 · 내 한마디 (누가 한 말인지 위에 작게) · 둘 다 있으면 번갈아
    el.innerHTML = `${t === 'kuromi' ? '<span class="pet-hts" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>' : t === 'bamdol' ? '<span class="pet-lvs" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>' : ''}<span class="pet-say ${motto ? 'motto' : ''}" style="visibility:hidden" ${motto ? '' : 'hidden'}>${lines.length ? petSayHtml(lines[0]) : ''}</span><img alt="" src="${pdir}/${pmap('perch')}.png">`;
    const im = $('img', el); im.onerror = () => { el.remove(); host.classList.remove('has-perch'); }; im.onload = () => { if (el.isConnected) host.classList.add('has-perch'); };
    host.appendChild(el); el.dataset.r0 = el.style.right || '';
    // 카드 바로 위 오른쪽에 버튼이 있으면(예: 매일 과제 요일) 그 왼쪽으로 비켜 앉음
    requestAnimationFrame(() => { const hr = host.getBoundingClientRect(), pw = Math.max(el.offsetWidth, $('img', el).getBoundingClientRect().width), spill = (pw - el.offsetWidth) / 2; let lx = Infinity;
      $$('#main button, #main a').forEach((b) => { if (host.contains(b)) return; const r = b.getBoundingClientRect(); if (r.width && r.bottom > hr.top - pw * 0.8 && r.top < hr.top && r.right > hr.right - pw - 40) lx = Math.min(lx, r.left); });
      if (lx < Infinity) { const rr = hr.right - lx + 8 + spill; if (rr + pw > hr.width * 0.5) { el.remove(); host.classList.remove('has-perch'); return; } el.style.right = `${Math.max(16, rr)}px`; el.dataset.r0 = el.style.right; } // 비킬 자리가 없으면(버튼이 줄 전체) 이 화면엔 안 앉아요
      fitSay(); clearTx(); hideHts(); setTimeout(() => { fitSay(); clearTx(); hideHts(); }, 700); document.fonts && document.fonts.ready.then(() => { fitSay(); clearTx(); hideHts(); }); });
    // 쿠로미 하트·밤돌이 나뭇잎: 글자와 겹치는 하트는 숨겨요 (글자를 가리면 안 돼요)
    const hideHts = () => { const hs = $$('.pet-hts i, .pet-lvs i', el); if (!hs.length) return; const tx = [], w = document.createTreeWalker($('#main'), NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) { if (!n.textContent.trim() || el.contains(n)) continue; const rg = document.createRange(); rg.selectNodeContents(n); tx.push(...rg.getClientRects()); }
      hs.forEach((h) => { const r = h.getBoundingClientRect(); h.hidden = tx.some((q) => q.width && r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top); }); };
    // 말풍선이 화면 왼쪽 밖으로 나가면 펫 오른쪽 아래로 옮겨요
    // 말풍선이 글자를 가리거나 화면 밖으로 나가면 왼쪽 → 오른쪽 → 머리 위 순서로 비켜요 (10/27 선생님: 제목을 가렸어요)
    const txRects = () => { const tx = [], w = document.createTreeWalker($('#main'), NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) { if (!n.textContent.trim() || el.contains(n)) continue; const rg = document.createRange(); rg.selectNodeContents(n); tx.push(...rg.getClientRects()); } return tx; };
    // 펫이 위 제목 글자를 가리면 그 카드를 가린 만큼만 아래로 내려요 (선생님 10/27 «가리게 하지 말고»)
    const clearTx = () => { const im = $('img', el); if (!im || !el.isConnected) return; host.style.marginTop = ''; const r = im.getBoundingClientRect(), top = r.top + r.height * 0.12;
      const hit = txRects().filter((q) => q.width && r.left + 8 < q.right && r.right - 8 > q.left && top < q.bottom && r.bottom > q.top && q.bottom < host.getBoundingClientRect().top + 4);
      if (hit.length) host.style.marginTop = `${parseFloat(getComputedStyle(host).marginTop) + Math.max(...hit.map((q) => q.bottom)) - top + 6}px`; };
    // 말풍선은 언제나 펫 오른쪽 옆에 세로로 좁게, 카드 윗변 위에 (10/27 선생님 «위로 말고 옆으로 · 오른쪽 세로로»)
    // 오른쪽 자리가 모자라면 펫을 왼쪽으로 비켜 앉혀 자리를 만들어요
    // 말풍선 자리 규칙 (10/27 선생님 «배치 규칙을 정해»)
    //  1. 펫 바로 옆, 펫 몸(카드 위로 나온 부분) 가운데 높이. 카드 윗변 아래로는 안 내려가요 (머리 위로는 안 가요)
    //  2. 왼쪽 → 오른쪽 순서로 놓아 보고, 글자·다른 카드·위 메뉴·화면 밖에 하나도 안 닿는 첫 자리에 둬요
    //  3. 너비는 옆 칸 카드나 화면 끝 전까지 최대 320px 이라 되도록 한두 줄
    //  4. 한마디는 한 번에 하나씩 7초마다 번갈아 (10/28 «왜 두 개가 한 번에»). 위 메뉴 줄에 닿으면 그만큼만 내려요. 끝까지 닿으면 제일 덜 가리는 옆자리 (카드 안으로는 안 들어가요)
    const fitSay = () => { const sy = $('.pet-say', el); if (!sy || sy.hidden) return;
      if (scrollY > 40) { sy.style.visibility = 'hidden'; if (!el.wt) { el.wt = 1; const on = () => { if (scrollY > 40 || !el.isConnected) return; removeEventListener('scroll', on); el.wt = 0; fitSay(); }; addEventListener('scroll', on, { passive: true }); } return; }  // 내려가 있을 땐 자리를 못 재요(위 메뉴·옆 칸이 따라 내려와서) → 맨 위로 오면 그때 재요
      const er = el.getBoundingClientRect(), ir = er, hr = host.getBoundingClientRect(), y0 = hr.top - 140, y1 = hr.top;  // 그림 칸이 아니라 펫 몸 칸으로 재요 (시나모롤 귀가 넘쳐서 멀리 떴어요)
      const hb = (() => { const h = $('header.top, .top, header'); return h ? h.getBoundingClientRect().bottom : 0; })();
      const cards = $$('#main .card').filter((c) => c !== host && !c.contains(el)).map((c) => c.getBoundingClientRect()), tx = txRects().filter((q) => q.width);
      const near = [...cards.filter((q) => q.top < y1 && q.bottom > y0), ...tx.filter((q) => q.top < hr.top && q.bottom > hb)], lb = Math.max(8, ...near.filter((q) => q.right <= ir.left + 8).map((q) => q.right + 12)), rb = Math.min(innerWidth - 8, ...near.filter((q) => q.left >= ir.right - 8).map((q) => q.left - 12));  // 옆 칸 카드·위 제목 글자 끝까지만 넓혀요
      const ov = (a, q) => Math.max(0, Math.min(a.right, q.right) - Math.max(a.left, q.left)) * Math.max(0, Math.min(a.bottom, q.bottom) - Math.max(a.top, q.top));
      const put = (left, inside) => { sy.classList.remove('side', 'flip'); sy.style.top = 'auto'; sy.style.transform = 'none'; sy.style.bottom = `${er.bottom - hr.top + 6}px`;
        const room = left ? ir.left - 4 - lb : rb - ir.right - 4; sy.style.maxWidth = `${Math.max(inside ? 200 : 110, Math.min(320, inside ? ir.left - hr.left - 40 : room))}px`;
        if (left) { sy.style.left = 'auto'; sy.style.right = `${er.right - ir.left + 4}px`; } else { sy.classList.add('side'); sy.style.right = 'auto'; sy.style.left = `${ir.right - er.left + 4}px`; }
        { const h = sy.offsetHeight, cy = (ir.top + Math.min(ir.bottom, hr.top)) / 2, t = Math.max(hb + 6, Math.min(cy - h / 2, hr.top - 6 - h)); sy.style.bottom = 'auto'; sy.style.top = `${t - er.top}px`; }  // inside: 옆에 자리가 없으면 앉은 카드 안 윗부분 빈 곳에  // 펫 몸 옆 가운데 높이에 (카드 윗변 아래로는 안 내려가요)
        const r = sy.getBoundingClientRect(); return (r.left < 8 || r.right > innerWidth - 8 ? 1e6 : 0) + (r.top < hb + 4 ? 1e6 : 0) + cards.reduce((n, q) => n + ov(r, q), 0) + tx.reduce((n, q) => n + ov(r, q) * 4, 0); };
      const L = petLines(), fill = (one) => { el.single = one; sy.innerHTML = one ? petSayHtml1(L[li % L.length]) : petSayHtml(); };
      let best = null; for (const [one, lf, ins] of [[1, 1, 0], [1, 0, 0]]) { if (!el.t) fill(!!one); const sc = put(!!lf, !!ins); if (!best || sc < best[0]) best = [sc, !!one, !!lf, !!ins]; if (!sc) break; } // 다 담아 왼쪽 → 오른쪽 → 한 줄씩 왼쪽 → 오른쪽
      if (!el.t) fill(best[1]); put(best[2], best[3]);
      const r = sy.getBoundingClientRect(); if (r.top < hb + 4) sy.style.top = `${parseFloat(sy.style.top) + hb + 4 - r.top}px`; sy.style.visibility = ''; };  // 자리 잡기 전엔 숨겨 둬요 (처음 자리에 떴다가 휙 옮겨 가서 버벅여 보였어요 10/28)  // 위 메뉴 줄 밑으로는 절대 안 들어가요
    addEventListener('resize', () => { if (el.isConnected) { fitSay(); hideHts(); } });
    const play = (n) => fetch(`${pdir}/${pmap(n)}.webp`).then((r) => { if (!r.ok) throw 0; return r.blob(); }).then((b) => { const u = URL.createObjectURL(b); im.src = u; setTimeout(() => URL.revokeObjectURL(u), 8000); }).catch(() => {});
    if (!RM()) play(base);
    // 같은 표정만 있으면 심심해서, 가끔 혼자 기뻐해요
    clearInterval(petDock.iv); if (!RM()) petDock.iv = setInterval(() => { if (!el.isConnected) return clearInterval(petDock.iv); if (document.hidden || el.t) return; play(petDock.alt = petDock.alt === 'perch_yay' && PET_WINK.has(t) ? 'perch_wink' : 'perch_yay'); setTimeout(() => { if (el.isConnected && !el.t) play(base); }, 2600); }, 9000 + Math.random() * 8000);
    el.onclick = (e) => { e.stopPropagation(); const say = $('.pet-say', el); play('perch_yay'); say.textContent = cheer(); say.hidden = false; say.classList.remove('motto'); fitSay(); clearTimeout(el.t); el.t = setTimeout(() => { el.t = 0; say.innerHTML = lines.length ? petSayHtml(lines[li]) : ''; say.hidden = !motto; say.classList.toggle('motto', !!motto); fitSay(); play(base); }, 2600); if (navigator.vibrate) navigator.vibrate(20); };
    if (lines.length > 1) { const rot = setInterval(() => { if (!el.isConnected) return clearInterval(rot); if (el.t || !el.single) return; li = (li + 1) % lines.length; const say = $('.pet-say', el); say.classList.remove('motto'); void say.offsetWidth; say.innerHTML = petSayHtml(lines[li]); say.classList.add('motto'); fitSay(); }, 7000); }
  }
  // 펫 말풍선에 띄울 말: 선생님이 쓴 한마디(홈 맨 위 그 글) + 학생이 프로필에 쓴 「나의 한마디」
  // 10/27 선생님: «니 주제를 알라» 는 정윤이가 쓴 말인데 선생님 말처럼 보였어요 → 누가 한 말인지 꼭 붙여요
  function petLines() {
    if (DASH_ONLY) { const tm = (TP.motto || '').trim(); return tm ? [{ who: '내 한마디', t: tm }] : []; }
    const out = [], mo = ((S.profile || {}).motto || '').trim(), tm = ((S.note || {}).text || '').trim();  // 선생님이 이 학생에게 보낸 한마디 (홈 「선생님 한마디」 그 글)
    if (tm) out.push({ who: '선생님 한마디', t: tm });
    if (mo) out.push({ who: '내 한마디', t: mo });
    return out;
  }
  const petLinesKey = () => petLines().map((x) => x.t).join('|');
  const petSayHtml1 = (x) => `<small class="pet-who">${esc(x.who)}</small>${esc(x.t.length > 44 ? x.t.slice(0, 43) + '…' : x.t)}`;
  const petSayHtml = () => petLines().map(petSayHtml1).join('<i class="pet-sep"></i>');  // 선생님 한마디·내 한마디를 한 풍선에 같이 (10/27 «정윤이 선생님 한마디가 안 떠», 7초 번갈아는 놓쳐요)
  function skinSheet() {
    sheet(`<h2>홈 화면 설정</h2><p class="sub">테마를 고르면 앱 색과 따라다니는 인형이 바뀌어요</p><div class="skin-grid">${['ghost', ...owned()].map((k) => `<button type="button" class="skin-it ${skin() === k ? 'on' : ''}" data-skin="${k}" style="--sk:${SKINS[k].c}"><span class="skin-pic"><img src="${skinPic(k)}" alt=""></span><b>${k === 'ghost' ? '기본 테마' : esc(SKINS[k].n) + ' 테마'}</b><i class="skin-sw"></i></button>`).join('')}</div>`, (el, close) => {
      $$('[data-skin]', el).forEach((b) => (b.onclick = () => { const k = b.dataset.skin; close(); if (skin() === k) return; S.profile.skin = k; save('profile'); render(); toast(k === 'ghost' ? '기본 테마로 바꿨어요' : `${SKINS[k].n} 테마로 바꿨어요`); }));
    });
  }
  const GH_NEXT = { hello: ['idle', 2000] }, GH_BLOB = {};
  const gh = (n, cls = '') => `<img class="gh ${cls}" data-gh="${n}" src="${petBase()}/${n}.png" onerror="this.onerror=null;this.src='assets/ghost/${n}.png'" alt="">`;
  function ghFill(root) {
    for (const img of (root || document).querySelectorAll('img[data-gh]:not([data-ghd])')) {
      const n = img.dataset.gh; img.dataset.ghd = '1'; if (RM()) continue;
      (GH_BLOB[petBase() + n] = GH_BLOB[petBase() + n] || fetch(`${petBase()}/${n}.webp`).then((r) => { if (!r.ok) throw 0; return r.blob(); }).catch(() => fetch(`assets/ghost/${n}.webp`).then((r) => r.blob()))).then((b) => { const u = URL.createObjectURL(b); img.src = u; setTimeout(() => URL.revokeObjectURL(u), 8000); const nx = GH_NEXT[n]; if (nx) setTimeout(() => { if (img.isConnected) { img.dataset.gh = nx[0]; delete img.dataset.ghd; ghFill(img.parentNode); } }, nx[1]); }).catch(() => {});
    }
  }
  // 배포 중이거나 인터넷이 잠깐 끊겨 그림을 못 받으면 조금 뒤 두 번까지 다시 받아요 (깨진 그림이 남지 않게)
  document.addEventListener('error', (e) => { const im = e.target; if (!(im instanceof HTMLImageElement) || im.src.startsWith('blob:') || im.src.startsWith('data:')) return; const n = +(im.dataset.retry || 0); if (n >= 2) return; im.dataset.retry = n + 1; const u = im.getAttribute('src').replace(/[?&]r=\d+$/, ''); setTimeout(() => { im.src = u + (u.includes('?') ? '&' : '?') + 'r=' + Date.now(); }, 1200 * (n + 1)); }, true);
  document.addEventListener('input', (e) => { const r = e.target; if (r.type === 'range') r.style.setProperty('--p', `${(r.value - r.min) / ((r.max - r.min) || 1) * 100}%`); });
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
  function addWrong(id, w) { S.wrong = S.wrong || {}; const old = S.wrong[id]; S.wrong[id] = { ...(old || {}), ...w, first: (old && (old.first || old.at)) || Date.now(), at: Date.now(), times: ((old && old.times) || 0) + 1, cleared: false }; save('wrong'); }
  function clearWrong(id) { if (S.wrong && S.wrong[id]) { if (!S.wrong[id].cleared) earn('wr:' + id, 100, '오답 다시 맞힘'); S.wrong[id].cleared = true; S.wrong[id].clearedAt = Date.now(); save('wrong'); mockAllCheck(id); } }
  // 모의고사 한 회차 오답을 전부 다시 맞히면 크게 축하해요 (회차마다 한 번)
  function mockAllCheck(id) {
    if (!String(id).startsWith('mock:') || TEACHER) return;
    const ex = id.split(':')[1], L = Object.entries(S.wrong).filter(([k, w]) => k.startsWith('mock:' + ex + ':'));
    if (!L.length || L.some(([, w]) => !w.cleared)) return;
    S.party = S.party || {}; if (S.party['mock:' + ex]) return; S.party['mock:' + ex] = Date.now(); save('party');
    const m = MOCKS.find((x) => x.id === ex), name = m ? m.name || m.title || ex : ex;
    setTimeout(() => {
      const el = document.createElement('div'); el.className = 'bdg-pop party';
      el.innerHTML = `<div class="bdg-card"><div class="bdg-rays"></div>${gh('yay', 'party-gh')}<p class="bdg-eb">오답 정복!</p><h3>${esc(name)} 오답을 다 풀었어요</h3><p class="bdg-d">틀렸던 ${L.length}문제를 전부 다시 맞혔어요. 정말 대단해요!</p><button class="btn primary big block" type="button">고마워요</button></div>`;
      document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
      const W0 = innerWidth, H0 = innerHeight;
      [[W0 / 2, H0 * 0.4, 6, 300], [W0 * 0.2, H0 * 0.3, 4, 900], [W0 * 0.8, H0 * 0.3, 4, 1300], [W0 / 2, H0 * 0.25, 6, 1900]].forEach(([x, y, p, t]) => setTimeout(() => boom(x, y, p), t));
      ding(8); setTimeout(() => ding(8), 900); if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 200]);
      const close = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 260); };
      $('button', el).onclick = close; el.onclick = (e) => { if (e.target === el) close(); };
    }, 900);
  }

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
  // ───────── 기말 개념 풀기 ─────────
  const finS = () => { S.fin = S.fin || {}; S.fin.ans = S.fin.ans || {}; return S.fin; };
  const finA = (cid) => (finS().ans[cid] = finS().ans[cid] || {});
  const dOf = (at) => { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const finPicked = (c) => (c.qs || []).filter((q, k) => (finS().ans[c.id] || {})[k] && finS().ans[c.id][k].pick != null).length;
  const finDone = (c) => (c.text ? !!(finS().ans[c.id] || {}).q : c.page ? (() => { const A = finS().ans[c.id] || {}; return !!A.done && (!A.undone || A.done.at > A.undone.at); })() : !!(c.qs || []).length && finPicked(c) >= c.qs.length);
  const finDoneDay = (c) => finDone(c) ? dOf(Math.max(...Object.values(finS().ans[c.id]).map((x) => x.at || 0))) : null;
  // 오늘 몫: 어제까지 못 끝낸 것 ÷ 11/22까지 남은 날 (밀리면 하루 몫이 늘어요, 최소 2개)
  // 이 속도면 그 과목이 끝나는 날 (오늘부터 하루 몫씩)
  // 날마다 몫은 FIN_ORDER 가 정한 날(fday)대로: 밀린 건 오늘 몫에 더해요
  const finDay = () => Math.round((new Date(today()) - new Date(FIN_START)) / 864e5);
  function finEndDay(sj) {
    const t = today(), L = FIN_ORDER.filter((c) => c.subj === sj && !finDone(c)); if (!L.length) return null;
    const e = addD(FIN_START, Math.max(...L.map((c) => c.fday))); return e < t ? t : e;
  }
  const finEndTxt = (sj) => { const e = finEndDay(sj); return e ? `${md(e)}이면 다 끝나요` : '다 끝냈어요'; };
  // 홈: 선생님이 매일 내는 기말 예습(구몬처럼) 한눈에 · 과목마다 한 일/전체 · 오늘 남은 것 · 끝나는 날 (10/26)
  // 수행평가 준비 (content/perf.json): 학교 수행평가를 바로 준비하게 모범 답안 · 외울 것 · 빈칸 · 교과서 사진
  const PERF = U.who === '정윤' ? (D.perf || []) : [];
  const perfLive = () => PERF.filter((x) => today() <= (x.until || '9999') && !(S.perfDone || {})[x.id]);  // 「다 했어요」 누르면 목록에서 빠져요 (10/27)
  const perfMark = (id, on) => { S.perfDone = S.perfDone || {}; if (on) S.perfDone[id] = today(); else delete S.perfDone[id]; save('perfDone'); };
  const perfQ = (x) => { const B = x.sum ? finBlanks(x) : [], A = finS().ans[x.id] || {}; return { n: B.length, k: B.filter((b) => A[b.k]).length, ok: B.filter((b) => A[b.k] && A[b.k].ok).length }; };
  function perfCard() {
    const L = perfLive(); if (!L.length) return '';
    return `<section class="card c12"><div class="card-h"><h2>${ic('pencil')} 수행평가 준비</h2></div><div class="list">${L.map((x) => { const q = perfQ(x); return `<div class="li btnlike" data-perf="${esc(x.id)}"><div class="ico">${ic(x.icon || 'books')}</div><div class="body"><div class="t">${esc(x.title)}</div><div class="d">${esc(x.d)}${q.n ? ` · 빈칸 ${q.k}/${q.n}` : ''}</div></div>${TEACHER ? '<span class="chev"></span>' : `<button class="btn sm" type="button" data-perfdone="${esc(x.id)}">다 했어요</button>`}</div>`; }).join('')}</div></section>`;
  }
  function perfRun() {
    const r = UI.run, x = PERF.find((y) => y.id === r.id); if (!x) return '';
    const tab = x.tabs.find((t) => t.k === r.tab) || x.tabs[0];
    let body = '';
    if (tab.html) body = `<section class="card pf-body${tab.wide ? ' pf-wide' : ''}">${tab.html}</section>`;
    else if (tab.rows) body = `<section class="card"><div class="list">${tab.rows.map(([k, v]) => `<div class="sv-row pf-kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></section>`;
    else if (tab.imgs) body = `<section class="card"><div class="card-h"><h2>${esc(tab.n)}</h2><span class="tiny">${esc(tab.cap || '')}</span></div>${tab.imgs.map((s) => `<img class="pf-img" src="${esc(s)}" alt="${esc(tab.cap || '교과서')}" loading="lazy">`).join('')}</section>`;
    else if (tab.k === 'quiz') { const q = perfQ(x); body = `${finBlankHtml(x)}${q.k >= q.n ? `<div class="ls-box" style="margin-top:12px"><b>${q.ok}/${q.n} 맞혔어요</b><p>틀린 것은 「외울 것」에서 한 번 더 보고 다시 풀어요</p><button class="btn soft" id="pf-redo" type="button" style="margin-top:8px">빈칸 다시 풀기</button></div>` : ''}`; }
    return `<div class="qwrap" style="max-width:${tab.wide ? 1100 : 760}px;margin:0 auto"><div class="row between" style="margin-bottom:8px"><button class="btn sm ghost" data-pfback type="button">‹ 숙제</button>${TEACHER ? `<span class="tiny">${esc(x.d)}</span>` : (S.perfDone || {})[x.id] ? `<button class="btn sm" type="button" data-perfundo="${esc(x.id)}">목록에 다시 넣기</button>` : `<button class="btn sm primary" type="button" data-perfdone="${esc(x.id)}">다 했어요</button>`}</div><h1 class="h1" style="margin:8px 0">${esc(x.title)}</h1>${x.tabs.length > 1 ? `<div class="seg" style="margin:0 0 16px">${x.tabs.map((t) => `<button type="button" class="${t === tab ? 'on' : ''}" data-pft="${t.k}">${esc(t.n)}</button>`).join('')}</div>` : ''}${body}</div>`;
  }
  function bindPerf() {
    const r = UI.run, x = PERF.find((y) => y.id === r.id), top = () => { render(); window.scrollTo(0, 0); }; if (!x) return;
    $$('[data-pfback]').forEach((b) => (b.onclick = () => { UI.run = null; UI.tab = 'hw'; top(); }));
    $$('[data-pft]').forEach((b) => (b.onclick = () => { r.tab = b.dataset.pft; top(); }));
    $$('[data-fb]').forEach((b) => (b.onclick = () => { const bk = finBlanks(x).find((y) => y.k === b.dataset.fb), A = finA(x.id); if (!bk || A[bk.k]) return; const p = b.dataset.o; A[bk.k] = { p, ok: p === bk.t, at: Date.now() }; save('fin'); const y = window.scrollY; render(); window.scrollTo(0, y); }));
    const rd = $('#pf-redo'); if (rd) rd.onclick = () => { finS().ans[x.id] = {}; save('fin'); top(); };
  }
  function finCard() {
    if (!FIN_ON) return '';
    const T = finToday();
    return `<section class="card c12"><div class="card-h"><h2>${ic('books')} 매일 기말 예습</h2><span class="tiny">선생님이 날마다 나눠서 내요</span></div><div class="list">${FIN.map((f) => {
      const L = FIN_ALL.filter((x) => x.subj === f.subj), k = L.filter(finDone).length, t = T.filter((x) => x.subj === f.subj), tl = t.filter((x) => !finDone(x)).length, nm = f.subj === 'eng' ? '올림포스 지문' : f.name;
      return `<div class="li btnlike" data-task="fin:${f.subj}"><div class="ico">${ic(k >= L.length ? 'ok' : f.subj === 'hist' ? 'scroll' : 'books')}</div><div class="body"><div class="t">${esc(nm)} <span class="tiny num">${k}/${L.length}</span></div><div class="d">${t.length ? (tl ? `오늘 ${tl}개 남았어요` : '오늘 것 끝') : '오늘은 없어요'} · ${finEndTxt(f.subj)}</div><div class="ik-bar" style="height:6px;margin-top:8px"><i style="width:${Math.round((k / L.length) * 100)}%"></i></div></div></div>`;
    }).join('')}</div></section>`;
  }
  function finToday() {
    const t = today(), L = FIN_ORDER.filter((c) => { const d = finDoneDay(c); return !d || d >= t; });
    const due = L.filter((c) => c.fday <= finDay() || t > FIN_END);
    return due.length >= 2 ? due : L.slice(0, Math.max(2, due.length));
  }
  const finRead = (c) => `<div class="card lesson">${(c.read || []).map((x) => `<p class="ls-body" style="margin:0 0 12px;line-height:1.85">${rich(x)}</p>`).join('')}
      ${(c.points || []).length ? `<div class="ls-box"><b>꼭 외울 것</b>${c.points.map((x) => `<p>· ${rich(x)}</p>`).join('')}</div>` : ''}
      ${c.trap ? `<div class="ls-box warn"><b>시험에서 헷갈리는 것</b><p>${rich(c.trap)}</p></div>` : ''}</div>`;
  // 한 판 정리(sum: 섹션마다 개조식 줄 rows 또는 비교표 tbl) → 빈칸 채우기 → 문제 (10/26 «줄글 말고 한 판 정리, 다음 빈칸, 다음 문제»)
  const finSrc = (c) => c.sum ? c.sum.flatMap((x) => x.rows ? x.rows.map((r) => ({ h: x.h, t: r })) : (x.tbl || []).slice(1).flatMap((row) => row.slice(1).map((v, k) => ({ h: x.h, t: `${row[0] ? row[0] + ' · ' : ''}${x.tbl[0][k + 1] || ''}: ${v}` })))) : (c.read || []).flatMap((p) => p.split(/(?<=[.?!])\s+/).map((t) => ({ h: '', t })));
  function finBlanks(c) {
    const src = finSrc(c), terms = [...new Set(src.flatMap((x) => (x.t.match(/<b>(.*?)<\/b>/g) || []).map((y) => y.slice(3, -4))))], out = [], used = new Set();
    for (const x of src) {
      const t = (x.t.match(/<b>(.*?)<\/b>/g) || []).map((y) => y.slice(3, -4)).find((y) => !used.has(y)); if (!t || out.length >= (c.nb || 6)) continue;
      used.add(t); const others = terms.filter((y) => y !== t), h = [...(c.id + t)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);
      const ds = others.length ? [others[h % others.length], others[(h * 7 + 3) % others.length]].filter((y, i, A) => A.indexOf(y) === i) : [];
      const ops = [t, ...ds]; for (let i = ops.length - 1; i > 0; i--) { const j = (h + i * 13) % (i + 1); [ops[i], ops[j]] = [ops[j], ops[i]]; }
      out.push({ k: 'b' + out.length, t, ops, sen: x.t, h: x.h });
    }
    return out;
  }
  function finSumHtml(c) {
    if (!c.sum) return `<section class="card"><div class="card-h"><h2>주요 개념</h2><span class="tiny">${esc(c.pages || '')}쪽</span></div>${(c.points || []).map((x, k) => `<div class="ls-pt"><span class="ls-n">${k + 1}</span><div><b>${rich(x)}</b></div></div>`).join('')}</section>${finRead(c)}`;
    return `<section class="card fin-sum"><div class="card-h"><h2>한 판 정리</h2><span class="tiny">${esc(c.pages || '')}쪽</span></div>${c.sum.map((x) => `<div class="fs-sec"><h3>${esc(x.h)}</h3>${x.rows ? `<ul>${x.rows.map((r) => `<li>${rich(r)}</li>`).join('')}</ul>` : `<div class="tbl-wrap"><table class="q-tbl ls-tbl">${(x.tbl || []).map((row, k) => `<tr>${row.map((v) => (k ? `<td>${rich(v)}</td>` : `<th>${rich(v)}</th>`)).join('')}</tr>`).join('')}</table></div>`}</div>`).join('')}${c.trap ? `<div class="ls-box warn" style="margin-top:12px"><b>헷갈리는 것</b><p>${rich(c.trap)}</p></div>` : ''}</section>`;
  }
  // 교과서 전문 (c.src 블록: pg 쪽 · h 소제목 · p 문단 · box 자료 상자 · cap 그림 설명)
  function finSrcHtml(c) {
    return `<section class="card fin-src"><div class="card-h"><h2>교과서</h2><span class="tiny">${esc(c.pages || '')}쪽</span></div>${(c.src || []).map((b) => b.t === 'pg' ? `<div class="fsr-pg">${esc(b.s)}쪽</div>` : b.t === 'h' ? `<h3>${esc(b.s)}</h3>` : b.t === 'box' ? `<div class="fsr-box">${b.h ? `<b>${esc(b.h)}</b>` : ''}${(b.s || []).map((x) => `<p>${esc(x)}</p>`).join('')}</div>` : b.t === 'cap' ? `<p class="fsr-cap">${esc(b.s)}</p>` : `<p>${esc(b.s)}</p>`).join('')}</section>`;
  }
  function finBlankHtml(c) {
    const A = finS().ans[c.id] || {}, B = finBlanks(c), nb = B.filter((b) => A[b.k]).length;
    return `<section class="card"><div class="card-h"><h2>빈칸 채우기</h2><span class="tiny">${nb}/${B.length}</span></div><ol class="j-lines fin-bl">${B.map((b) => { const a = A[b.k], sen = rich(b.sen.replace(`<b>${b.t}</b>`, '⟦B⟧')).replace('⟦B⟧', a ? `<b class="j-got ${a.ok ? '' : 'no'}">${esc(b.t)}</b>` : '<span class="j-gap"></span>'); return `<li class="${a ? (a.ok ? 'ok' : 'no') : ''}"><div class="j-tx">${b.h ? `<span class="j-who">${esc(b.h)}</span>` : ''}<p class="j-en" style="font-size:16px;line-height:1.7">${sen}</p><div class="jg-ops j-ops sm">${b.ops.map((o) => `<button type="button" class="chip jg-op ${a && o === b.t ? 'right' : a && o === a.p ? 'wrong' : ''}" data-fb="${b.k}" data-o="${esc(o)}" ${a ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div></div></li>`; }).join('')}</ol></section>`;
  }
  function finRun() {
    const r = UI.run, c = r.cid && FIN_ALL.find((x) => x.id === r.cid);
    if (!c) {
      const T = finToday(), n = FIN_ALL.filter(finDone).length, row = (x, tag) => `<div class="li btnlike" data-fc="${x.id}"><div class="ico">${ic(finDone(x) ? 'ok' : 'books')}</div><div class="body"><div class="t">${esc(x.title)}</div><div class="d">${tag ? esc(x.sname) + ' · ' : ''}${esc(x.pages || '')}쪽 · ${finDone(x) ? `${(x.qs || []).filter((q, k) => (finS().ans[x.id][k] || {}).ok).length}/${x.qs.length} 맞힘` : finPicked(x) ? `${finPicked(x)}/${x.qs.length} 풀었어요` : '읽고 3문제'}</div></div><span class="chev"></span></div>`;
      return `<div class="qwrap" style="max-width:760px;margin:0 auto"><div class="row between"><button class="btn sm" data-finback type="button">‹ 숙제</button><span class="tiny">11월 22일까지 D-${Math.max(0, dday(FIN_END))}</span></div>
        <h1 class="h1" style="margin:16px 0 4px">기말 예습</h1><p class="sub">교과서 개념을 읽고 쉬운 문제 3개로 바로 확인해요. 전체 ${FIN_ALL.length}개 중 ${n}개 했어요</p>
        <div class="ik-bar" style="height:8px;margin:8px 0 16px"><i style="width:${Math.round((n / FIN_ALL.length) * 100)}%"></i></div>
        <section class="card"><div class="card-h"><h2>오늘 할 것 ${T.length}개</h2><span class="tiny">${T.filter(finDone).length}/${T.length}</span></div><div class="list">${T.map((x) => row(x, true)).join('')}</div></section>
        <section class="card" style="margin-top:12px"><div class="card-h"><h2>과목별</h2></div>${FIN.map((f) => { const L = FIN_ALL.filter((x) => x.subj === f.subj), k = L.filter(finDone).length; return `<div class="sv-row"><span>${esc(f.name)} ${k}/${L.length}</span><b>${finEndTxt(f.subj)}</b></div>`; }).join('')}</section></div>`;
    }
    if (c.text) {  // 올림포스 지문: 앱 안에서 읽고 풀기 (단어 → 지문·문제 → 해설·해석) 10/26 «e-book 말고»
      const A = finS().ans[c.id] || {}, a = A.q, u = (t) => esc(t).replace(/&lt;u&gt;/g, '<u>').replace(/&lt;\/u&gt;/g, '</u>');
      return `<div class="qwrap" style="max-width:760px;margin:0 auto"><div class="row between"><button class="btn sm" data-finback type="button">‹ 숙제</button><span class="tiny">올림포스 ${esc(c.pages)}쪽</span></div>
        <p class="eyebrow" style="margin:16px 0 4px">${ic('books')} 올림포스 · ${esc(c.type || '')}</p><h1 class="h1" style="margin:0 0 16px">${esc(c.title)}</h1>
        ${(c.words || []).length ? `<details class="hw-more card" ${a ? '' : 'open'}><summary><b>먼저 단어 ${c.words.length}개</b> <span class="tiny">눌러서 접기</span></summary><div class="oly-w">${c.words.map(([en, ko]) => `<div><b>${esc(en)}</b><span>${esc(ko)}</span></div>`).join('')}</div></details>` : ''}
        <section class="card oly-p" style="margin-top:12px"><p class="oly-q"><b>${esc(c.q)}</b></p>${c.given ? `<div class="oly-given">${u(c.given)}</div>` : ''}${c.text.map((t) => `<p>${u(t)}</p>`).join('')}${(c.notes || []).length ? `<p class="tiny">${c.notes.map((x) => '* ' + esc(x)).join('  ')}</p>` : ''}</section>
        <div class="choices" style="margin-top:12px">${c.choices.map((ch, k) => `<button class="choice ${!a ? '' : k === c.answer ? 'right' : k === a.p ? 'wrong' : ''}" data-olyp="${k}" type="button" ${a ? 'disabled' : ''}><span class="ct">${u(ch)}</span></button>`).join('')}</div>
        ${a ? `${verdict(a.ok)}<div class="explain"><b>해설</b><br>${esc(c.exp || '')}</div>${(c.ko || []).length ? `<details class="hw-more card" style="margin-top:12px" open><summary><b>전체 해석</b></summary>${c.ko.map((t) => `<p style="line-height:1.8">${esc(t)}</p>`).join('')}</details>` : ''}<div class="cta-bar">${(() => { const nx = finToday().find((x) => !finDone(x) && x.id !== c.id); return nx ? `<button class="btn primary big block" data-fc="${nx.id}" type="button">다음: ${esc(nx.title)}</button>` : '<button class="btn primary big block" data-finback type="button">숙제로</button>'; })()}</div>` : ''}</div>`;
    }
    if (c.page) {  // 올림포스 지문: 책에서 풀고 체크
      const dn = finDone(c);
      return `<div class="qwrap" style="max-width:720px;margin:0 auto"><div class="row between"><button class="btn sm" data-finback type="button">‹ 숙제</button><span class="tiny">${esc(c.pages)}쪽</span></div><p class="eyebrow" style="margin:16px 0 4px">${ic('books')} 올림포스 영어독해의 기본2</p><h1 class="h1" style="margin:0 0 16px">${esc(c.title)}</h1>
        <section class="card"><p style="margin:0 0 12px;line-height:1.7">책 <b>${esc(c.pages)}쪽</b> 지문을 읽고 문제를 풀어요. 모르는 단어는 형광펜으로 칠해 두면 선생님이 봐요</p><button class="btn soft big block" id="fp-book" type="button">${ic('books')} 책 ${esc(c.pages)}쪽 펴기</button></section>
        <div class="cta-bar"><button class="btn ${dn ? '' : 'primary'} big block" id="fp-done" type="button">${dn ? '다 푼 걸 취소하기' : '다 풀었어요'}</button></div></div>`;
    }
    const A = finS().ans[c.id] || {}, qs = c.qs || [];
    const head = `<div class="row between"><button class="btn sm" data-finback type="button">‹ 숙제</button><span class="tiny">${esc(c.sname)} · ${esc(c.pages || '')}쪽</span></div>`;
    const st = r.step || (c.src && !Object.keys(finS().ans[c.id] || {}).length ? 'src' : 'sum');
    if (!r.read) return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}<p class="eyebrow" style="margin:16px 0 4px">${ic('books')} ${esc(c.sname)} 기말 예습</p><h1 class="h1" style="margin:0 0 8px">${esc(c.title)}</h1><div class="seg" style="margin:0 0 16px">${(c.src ? [['src', '① 교과서'], ['sum', '② 한 판 정리'], ['blank', '③ 빈칸 채우기'], ['q', '④ 문제']] : [['sum', '① 한 판 정리'], ['blank', '② 빈칸 채우기'], ['q', '③ 문제']]).map(([k, nm]) => `<button type="button" class="${st === k ? 'on' : ''}" data-fst="${k}">${nm}</button>`).join('')}</div>${st === 'blank' ? finBlankHtml(c) : st === 'src' ? finSrcHtml(c) : finSumHtml(c)}<div class="cta-bar">${st === 'blank' ? `<button class="btn primary big block" id="fr-go" type="button">다음: 문제 ${qs.length}개 풀기 ›</button>` : st === 'src' ? `<button class="btn primary big block" data-fst="sum" type="button">다음: 한 판 정리 ›</button>` : `<button class="btn primary big block" data-fst="blank" type="button">다음: 빈칸 채우기 ›</button>`}</div></div>`;
    const i = r.i != null ? r.i : qs.findIndex((q, k) => !(A[k] && A[k].pick != null));
    if (i < 0) {
      const ok = qs.filter((q, k) => A[k] && A[k].ok).length, nx = finToday().find((x) => !finDone(x) && x.id !== c.id) || FIN_ORDER.find((x) => !finDone(x) && x.id !== c.id);
      return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}${doneCard(ok, qs.length, ok === qs.length ? '이 개념은 이제 내 거예요' : '틀린 건 해설을 보고 개념을 한 번 더 읽어요', `${nx ? `<button class="btn primary big block" data-fc="${nx.id}" type="button">다음 개념: ${esc(nx.title)}</button>` : ''}<button class="btn big block" data-finback type="button">숙제로</button><button class="btn big block" id="fr-redo" type="button">개념 다시 읽고 다시 풀기</button>`)}</div>`;
    }
    const q = qs[i], a = A[i] && A[i].pick != null ? A[i] : null;
    return `<div class="qwrap" style="max-width:720px;margin:0 auto">${head}<details class="hw-more" style="margin:8px 0 0"><summary>개념 다시 보기</summary>${finRead(c)}</details>
      <div class="progress-dots">${qs.map((x, k) => `<i class="${A[k] && A[k].pick != null ? (A[k].ok ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card"><div class="q-no">${i + 1}번</div><div style="margin-top:8px">${qBody(q)}</div></div>${choicesHtml(q, a ? a.pick : null)}${a ? verdict(a.ok) + (q.exp ? `<div class="explain"><b>해설</b><br>${rich(q.exp)}</div>` : '') + '<div class="cta-bar"><button class="btn primary big block" id="fr-next" type="button">다음</button></div>' : ''}</div>`;
  }
  function bindFin() {
    const r = UI.run, top = () => { render(); window.scrollTo(0, 0); };
    $$('[data-fc]').forEach((b) => (b.onclick = () => { const c = FIN_ALL.find((x) => x.id === b.dataset.fc); UI.run = { kind: 'fin', cid: b.dataset.fc, read: !!(c && finPicked(c)) && finDone(c) }; top(); }));
    $$('[data-finlist]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'fin' }; top(); }));
    $$('[data-finback]').forEach((b) => (b.onclick = () => { UI.run = null; UI.tab = 'hw'; top(); }));
    const c = r.cid && FIN_ALL.find((x) => x.id === r.cid); if (!c) return;
    const g = $('#fr-go'); if (g) g.onclick = () => { r.read = true; r.i = null; top(); };
    $$('[data-fst]').forEach((x) => (x.onclick = () => { const k = x.dataset.fst; if (k === 'q') { r.read = true; r.i = null; } else { r.read = false; r.step = k; } top(); }));
    $$('[data-olyp]').forEach((b) => (b.onclick = () => { const A = finA(c.id); if (A.q) return; const k = +b.dataset.olyp; A.q = { p: k, ok: k === c.answer, at: Date.now() }; earn('fin:' + c.id, 100, '올림포스 지문'); save('fin'); render(); }));
    const fb = $('#fp-book'); if (fb) fb.onclick = () => bookOpen('eng2', null, c.page);
    const fd = $('#fp-done'); if (fd) fd.onclick = () => { const A = finA(c.id); if (finDone(c)) A.undone = { at: Date.now() }; else { A.done = { ok: 1, at: Date.now() }; earn('fin:' + c.id, 100, '올림포스 지문'); const nx = finToday().find((x) => !finDone(x)); toast('잘했어요'); if (nx) { UI.run = { kind: 'fin', cid: nx.id }; save('fin'); top(); return; } } save('fin'); UI.run = null; UI.tab = 'hw'; top(); };
    $$('[data-fb]').forEach((b) => (b.onclick = () => { const bk = finBlanks(c).find((x) => x.k === b.dataset.fb), A = finA(c.id); if (!bk || A[bk.k]) return; const p = b.dataset.o, ok = p === bk.t; A[bk.k] = { p, ok, at: Date.now() }; save('fin'); const y = window.scrollY; render(); window.scrollTo(0, y); }));
    const nx = $('#fr-next'); if (nx) nx.onclick = () => { r.i = null; render(); const d = $('.progress-dots'); if (d) d.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0); };
    const rd = $('#fr-redo'); if (rd) rd.onclick = () => { const A = finA(c.id), at = Date.now(); c.qs.forEach((q, k) => { A[k] = { at, redo: 1 }; }); save('fin'); UI.run = { kind: 'fin', cid: c.id }; top(); };
    $$('[data-pick]').forEach((b) => (b.onclick = () => {
      const A = finA(c.id), qs = c.qs || [];  // 누를 때 기록을 다시 찾아요
      const i = r.i != null ? r.i : qs.findIndex((q, k) => !(A[k] && A[k].pick != null)), q = qs[i]; if (!q) return;
      const k = +b.dataset.pick; A[i] = { pick: k, ok: k === q.answer, at: Date.now() }; r.i = i;
      if (finDone(c)) { earn('fin:' + c.id, 100, '기말 개념'); if (finToday().every(finDone)) boom(innerWidth / 2, innerHeight * 0.4, 3); }
      save('fin'); render();
    }));
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
      const ans = (S.sci.cans[c.id] = S.sci.cans[c.id] || {});  // 누를 때 다시 찾아요
      const k = +b.dataset.pick, ok = k === q.answer; ans[q.id] = { pick: k, ok, at: Date.now() }; r.i = i;
      const wid = 'sci:' + q.id;
      if (ok) { gotIt(wid); if (S.wrong[wid]) clearWrong(wid); } else addWrong(wid, { src: 'sci', subj: 'sci', subjName: '통합과학', area: unitOf(c.unit).title.replace(/^[ⅠⅡⅢⅣⅤⅥ]+\.\s*/, ''), sub: c.title, concept: c.id, qid: q.id });
      save('sci'); render();
    }));
  }
  // ───────── 전체 목록 (오늘 것 말고도 골라서) ─────────
  function libView() {
    const k = UI.lib;
    const T = { cheonil: '천일문 전체', sci: '통합과학 개념 전체', words: '워드마스터 전체', g3: '고3 영어 전체', mm: '모의고사' };
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
    if (k === 'mm') {
      const gs = [...new Set(MM.map((x) => x.grade))].sort(), g = gs.includes(UI.mmG) ? UI.mmG : (TUTOR ? gs[0] : gs.includes(ST.grade || 1) ? ST.grade || 1 : gs[0]), A = S.eng.mmans || {};
      const L = MM.map((x, i) => ({ x, i })).filter((o) => o.x.grade === g), ex = [...new Set(L.map((o) => mmExam(o.x)))];
      return head + `<p class="sub">교육청 모의고사 독해 문제예요. 풀고 싶은 것만 골라서 풀어요. 풀고 나면 문장마다 해석·구문 분석이 나와요</p><div class="seg" style="max-width:360px;margin-bottom:16px">${gs.map((y) => `<button type="button" class="${y === g ? 'on' : ''}" data-mmg="${y}">고${y}</button>`).join('')}</div><div class="grid">${ex.map((e) => { const R = L.filter((o) => mmExam(o.x) === e), dn = R.filter((o) => A[o.x.id]), ok = dn.filter((o) => A[o.x.id].ok).length; return `<section class="card c6"><div class="card-h"><h3>${esc(e.replace(/ 고\d$/, ''))}</h3><span class="tiny">${dn.length ? `${dn.length}문제 중 ${ok}개 맞음` : `${R.length}문제`}</span></div><div class="list">${R.map((o) => { const a = A[o.x.id], no = (String(o.x.src).match(/(\d+)번/) || [])[1]; return `<div class="li btnlike" data-lmm="${o.i}"><div class="ico">${ic(a ? (a.ok ? 'ok' : 'x') : 'eng')}</div><div class="body"><div class="t">${no ? no + '번 ' : ''}${esc(o.x.type || '독해')}${o.x.level ? ' ' + '★'.repeat(o.x.level) : ''}</div></div><span class="chev"></span></div>`; }).join('')}</div></section>`; }).join('')}</div>`;
    }
    if (k === 'g3') {
      return head + `<p class="sub">풀고 나면 문장마다 해석·구문 분석이 나와요</p><section class="card"><div class="list">${G3.map((g, i) => { const a = (S.eng.g3ans || {})[g.id]; return `<div class="li btnlike" data-lg="${i}"><div class="ico">${ic(a ? (a.ok ? 'ok' : 'x') : i === (S.eng.g3 || 0) ? 'pin' : 'eng')}</div><div class="body"><div class="t">${i + 1}. ${esc(g.type || '독해')}${g.level ? ' ' + '★'.repeat(g.level) : ''}</div><div class="d">${esc(g.src || '')}${i === (S.eng.g3 || 0) ? ' · 오늘 숙제' : ''}</div></div><span class="chev"></span></div>`; }).join('')}</div></section>`;
    }
    return '';
  }
  function libCard() {
    const it = (k, icn, t, d) => `<button class="lib-it" data-lib="${k}" type="button"><span class="ico">${ic(icn)}</span><b>${t}</b><span class="tiny">${d}</span></button>`;
    if (TUTOR) return CH_UNITS.length ? `<section class="card c12"><div class="card-h"><h2>전체 목록</h2><span class="tiny">숙제 말고도 골라서 공부해요</span></div><div class="lib-grid">${it('cheonil', 'eng', '천일문 기본', `${CH_UNITS.length}유닛`)}${MM.length ? it('mm', 'target', '모의고사', `고1~고3 ${MM.length}문제`) : ''}</div></section>` : '';
    return `<section class="card c6"><div class="card-h"><h2>전체 목록</h2><span class="tiny">오늘 것 말고도 골라서 공부해요</span></div><div class="lib-grid">${it('cheonil', 'eng', '천일문', `${CH_UNITS.length}유닛`)}${it('sci', 'sci', '통합과학 개념', `${SCI.concepts.length}개 · 기말 ${SCI.concepts.filter((c) => c.exam).length}개`)}${it('words', 'books', '워드마스터', `${((ENG.words && ENG.words.days) || []).length}일`)}${MM.length ? it('mm', 'target', '모의고사', `고1~고3 ${MM.length}문제`) : ''}${it('g3', 'target', '고3 영어', `${G3.length}문제`)}</div></section>`;
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
    const ld = $('#ls-done'); if (ld) { ld.onclick = () => { sciToday(true).read = true; save('sci'); UI.run = { kind: 'sci' }; render(); window.scrollTo(0, 0); }; return; }
    const r = UI.run; if (!r || r.kind !== 'sci') return;
    const it = d.list[r.i]; if (!it) return; const q = qById(it.q), c = SCI.concepts.find((x) => x.id === it.c) || {};
    $$('[data-pick]').forEach((b) => (b.onclick = () => {
      const d = sciToday(true);  // 누를 때 다시 찾아요
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

  // 영어: 천일문 유닛 (ref 가 있으면 고른 유닛 · 기록은 S.eng.ua 에 유닛마다. 과외 학생은 선생님이 정한 난도의 문제만)
  function unitCtx() {
    const ed = engToday(true), ref = UI.run && UI.run.ref != null && UI.run.ref >= 0 ? UI.run.ref : null, un = CH_UNITS[ref != null ? ref : ed.unit];
    if (!un) return { ed, ref, un };
    S.eng.ua = S.eng.ua || {}; const store = ref != null ? (S.eng.ua[uKey(un)] = S.eng.ua[uKey(un)] || {}) : uStore(ed);
    return { ed, ref, un, store, ids: qIds(un) };
  }
  // 다음 문제로 갈 때 맨 위(뒤로 단추·머리)까지 올라가지 않고 문제 칸이 화면 맨 위에 오게 (선생님 10/26 「자꾸 맨 위로 가서 귀찮아」)
  function toQ() { const el = $('main .progress-dots') || $('main .qwrap'); if (!el) return window.scrollTo(0, 0); const top = ($('.top') || {}).offsetHeight || 0; window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - top - 8), behavior: 'auto' }); }
  function unitRun() {
    const back = UI.run && UI.run.back, g3lib = UI.run && UI.run.g3lib;
    const { ed, ref, un, store, ids } = unitCtx();
    if (!un) return `<div class="card empty">${ic('eng')}<b>천일문 자료를 넣는 중이에요</b></div>`;
    const qs = un.questions || []; const qi = ids.find((k) => !store[k]); const left = qi == null ? -1 : qi;
    const cur = UI.run && UI.run.kind === 'unit' && UI.run.show != null ? UI.run.show : left;
    UI.run = { kind: 'unit', show: cur, ref, back, g3lib };
    const head = `<div class="row between">${back === 'g3' ? (g3lib != null ? (UI.run.mm ? `<button class="btn sm" data-lmm="${g3lib}" type="button">‹ 모의고사 문제로</button>` : `<button class="btn sm" data-lg="${g3lib}" type="button">‹ 고3 문제로</button>`) : '<button class="btn sm" data-task="g3" type="button">‹ 고3 문제로</button>') : back === 'lib' ? '<button class="btn sm" data-lib="cheonil" type="button">‹ 천일문 목록</button>' : '<button class="btn sm" data-go="hw" type="button">‹ 숙제</button>'}<span class="tiny">천일문 Ch.${esc(un.ch)} ${esc(un.chTitle || '')}</span></div>
      ${un.lesson ? chLesson(un) : `<div class="card"><div class="q-no">Unit ${esc(un.unit)}</div><h1 class="h1" style="margin-top:4px">${esc(un.title)}</h1><p style="line-height:1.8;color:var(--t2);margin:8px 0 0">${esc(un.concept || '')}</p></div>`}
      <div class="card"><div class="card-h"><h3>문장으로 이해하기</h3></div><div class="list">${(un.sentences || []).map((s) => `<div class="li" style="align-items:flex-start"><div class="body"><div class="t" style="font-size:16px;line-height:1.6">${esc(s.en)}</div><div class="d" style="margin-top:4px">${esc(s.ko)}</div>${s.point ? `<div class="tiny blue" style="margin-top:4px">${esc(s.point)}</div>` : ''}</div><span class="tag">${esc(s.src || '')}</span></div>`).join('')}</div></div>`;
    if (cur < 0 || cur == null) {
      const ok = ids.filter((k) => store[k] && store[k].ok).length;
      if (ref == null && !uDone(ed) && qs.length) { const again = ed.udone; ed[un.v2 ? 'udone2' : 'udone'] = Date.now(); if (!again) S.eng.unit = Math.min((S.eng.unit || 0) + 1, CH_UNITS.length - 1); save('eng'); }  // 예전 문제로 이미 넘긴 날은 또 넘기지 않아요
      const nextCu = ref != null && TUTOR ? tutorTasks().find((t) => !t.done) : null;
      return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}${ref == null ? doneCard(ok, ids.length, '천일문 유닛 끝! 내일은 다음 유닛이에요', '<button class="btn primary big block" data-task="words" type="button">단어 시험 보러 가기</button><button class="btn big block" data-go="home" type="button">홈으로</button>') : doneCard(ok, ids.length, `Unit ${un.unit} 끝! 틀린 문제는 오답 노트에 들어갔어요`, `${nextCu ? `<button class="btn primary big block" data-task="${esc(nextCu.k)}" type="button">다음: ${esc(nextCu.t)}</button>` : ''}<button class="btn big block" data-go="hw" type="button">숙제로</button>`)}</div>`;
    }
    const q = qs[cur], a = store[cur];
    const isOrder = q.words && q.answerText;
    return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}
      <div class="progress-dots">${ids.map((k) => `<i class="${store[k] ? (store[k].ok ? 'ok' : 'no') : k === cur ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card"><div class="q-no">문제 ${ids.indexOf(cur) + 1} <span class="tag">${esc(q.type || '')}</span></div><div style="margin-top:8px">${qBody(q)}</div></div>
      ${isOrder ? `<div class="card"><div id="ord-out" class="q-text" style="min-height:32px">${a ? esc(a.text) : ''}</div><div class="chips" style="flex-wrap:wrap;margin-top:12px" id="ord-in">${a ? '' : sshuffle(q.words.map((w, k) => [w, k]), 'ord:' + q.words.join(' ')).map(([w, k]) => `<button class="chip" data-w="${k}" type="button">${esc(w)}</button>`).join('')}</div>${a ? '' : '<div class="row" style="margin-top:12px"><button class="btn" id="ord-reset" type="button">다시</button><button class="btn primary" id="ord-ok" type="button">확인</button></div>'}</div>`
        : q.choices ? choicesHtml(q, a ? a.pick : null) : `<div class="card"><textarea class="inp" id="free" placeholder="답을 써 보세요" ${a ? 'disabled' : ''}>${a ? esc(a.text || '') : ''}</textarea>${a ? '' : '<button class="btn primary block" style="margin-top:12px" id="free-ok" type="button">확인</button>'}</div>`}
      ${a ? `${verdict(a.ok)}${isOrder || !q.choices ? `<div class="explain"><b>정답</b> ${esc((q.accept && q.accept.length ? q.accept.join(' / ') : '') || q.answerText || (q.choices ? q.choices[q.answer] : ''))}</div>` : ''}${q.exp ? `<div class="explain"><b>해설</b><br>${esc(q.exp)}</div>` : ''}<div class="cta-bar"><button class="btn primary big block" id="next" type="button">${ids.some((k) => !store[k]) ? '다음 문제' : '결과 보기'}</button></div>` : ''}
    </div>`;
  }
  const normEn = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  function bindUnit() {
    if (!UI.run || UI.run.kind !== 'unit') return;
    const { un, store, ids, ref } = unitCtx(); if (!un) return; const cur = UI.run.show; const q = (un.questions || [])[cur]; if (!q) { const n = $('#next'); if (n) n.onclick = () => { UI.run = null; render(); }; return; }
    const keep = { kind: 'unit', ref, back: UI.run.back, g3lib: UI.run.g3lib };
    const wk = `eng:${uKey(un)}-${cur}`;
    const live = () => unitCtx().store || store;  // 누를 때 다시 찾아요 (서버 맞춤 뒤 옛 기록에 적으면 「확인」해도 안 넘어가요 10/26)
    const mark = (ok, extra) => { const store = live(); store[cur] = { ok, at: Date.now(), ...extra }; if (!ok) addWrong(wk, { src: 'eng', subj: 'eng', subjName: '영어', area: '천일문 ' + (un.chTitle || ''), sub: un.title, ref: { ch: un.ch, unit: un.unit, i: cur, v: un.v2 ? 2 : 0 } }); else { gotIt(wk); clearWrong(wk); } save('eng');
      if (ref != null && ids.every((k) => store[k])) { const t = cuTitle(un.unit), h = (S.hw || []).find((x) => !x.done && x.title === t); if (h) { h.done = true; h.doneAt = Date.now(); save('hw'); toast('천일문 숙제 끝!'); } }
      render(); };
    $$('[data-pick]').forEach((b) => (b.onclick = () => mark(+b.dataset.pick === q.answer, { pick: +b.dataset.pick })));
    const out = $('#ord-out'), picked = [];
    $$('[data-w]').forEach((b) => (b.onclick = () => { picked.push(q.words[+b.dataset.w]); b.remove(); out.textContent = picked.join(' '); }));
    const rs = $('#ord-reset'); if (rs) rs.onclick = () => render();
    const ok = $('#ord-ok'); if (ok) ok.onclick = () => { const t = picked.join(' '); mark(normEn(t) === normEn(q.answerText), { text: t }); };
    const fo = $('#free-ok'); if (fo) fo.onclick = () => { const t = $('#free').value; const ans = q.answerText || ''; mark(normEn(t) === normEn(ans) || (q.accept || []).some((x) => normEn(x) === normEn(t)), { text: t }); };
    const n = $('#next'); if (n) n.onclick = () => { const st = live(), nx = ids.find((k) => !st[k]); UI.run = { ...keep, show: nx == null ? -1 : nx }; render(); toQ(); };
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
    const sk = `w:${today()}:${w.day}:${w.en}`, pool = WORDS.filter((x) => x.ko !== w.ko); const opts = sshuffle([w.ko, ...sshuffle(pool, sk + ':p').slice(0, 3).map((x) => x.ko)], sk);
    UI.run.opts = opts; UI.run.i = i;
    return `<div class="qwrap" style="max-width:640px;margin:0 auto">${head}<div class="progress-dots">${wl.map((_, k) => `<i class="${wans[k] ? (wans[k].ok ? 'ok' : 'no') : k === i ? 'cur' : ''}"></i>`).join('')}</div>
      <div class="card" style="text-align:center;padding:40px 24px"><div class="tiny">${i + 1} / ${wl.length}</div><div style="font-size:34px;font-weight:800;margin-top:8px;letter-spacing:-0.02em">${esc(w.en)}</div><div class="tiny">${esc(w.pos || '')}</div></div>
      <div class="choices">${opts.map((o, k) => `<button class="choice" data-wo="${k}" type="button"><span class="n">${k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div></div>`;
  }
  function bindWords() {
    const ed = engToday(true); const r = UI.run; if (!r || r.kind !== 'words') return;
    const wl = wordsFor(r.day != null ? r.day : ed.words);
    const t = $('#w-test'); if (t) t.onclick = () => { UI.run = { kind: 'words', mode: 'test', day: r.day }; render(); window.scrollTo(0, 0); };
    $$('[data-wo]').forEach((b) => (b.onclick = () => {
      const w = wl[r.i], ok = r.opts[+b.dataset.wo] === w.ko;
      const wans = r.day != null ? ((S.eng.wa = S.eng.wa || {})[r.day] = S.eng.wa[r.day] || {}) : engToday(true).wans;  // 누를 때 다시 찾아요 (서버 맞춤 뒤 옛 칸에 적지 않게)
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
    const item = (w) => `<div class="li btnlike" data-wr="${esc(w.id)}"><div class="ico">${ic(w.cleared ? 'ok' : w.src === 'mock' ? 'score' : w.src === 'word' ? 'books' : w.src === 'eng' || w.src === 'jg' ? 'eng' : w.src === 'nx' ? (w.subj === 'hist' ? 'scroll' : w.subj === 'sci' ? 'sci' : 'eng') : 'sci')}</div><div class="body"><div class="t">${esc(w.title || w.sub || '')}</div><div class="d">${esc(w.subjName || SUBJ_NAMES[w.subj] || '')} · ${esc(w.area || '')}${w.times > 1 ? ` · ${w.times}번 틀림` : ''}</div></div>${w.cleared ? '<span class="tag blue">다시 맞힘</span>' : '<span class="tag">다시 풀기</span>'}</div>`;
    return `<h1 class="h1">오답 노트</h1><p class="sub">하루에 두세 문제씩만 다시 풀어요. 다시 맞히면 파란색이 돼요</p>
      <div class="chips" style="margin-bottom:16px"><button class="chip ${f === 'all' ? 'on' : ''}" data-ws="all" type="button">전체</button>${subs.map(([k, n]) => `<button class="chip ${f === k ? 'on' : ''}" data-ws="${k}" type="button">${n}</button>`).join('')}</div>
      <div class="grid">${myWrongCard('c12')}
        ${(() => { const td = todayWr().filter((id) => S.wrong[id]).map((id) => ({ ...S.wrong[id], id }));  // id 를 꼭 붙여요 (없으면 「다시 풀기」가 안 눌렸어요 10/28) const nx = (S.hw || []).filter((h) => hwWr(h).length && !hwDone(h) && h.due > today()).sort((a, b) => a.due.localeCompare(b.due))[0];
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
    else if (w.src === 'jg') { const u = jgU(w.ref.u), q = u && u.questions.find((x) => x.id === w.ref.id); if (!q) return head; body = `<div class="card"><div class="q-no">Grammar Unit ${esc(u.no)} · ${esc(q.section || '')}</div><div class="q-text jg-q" style="margin-top:8px">${q.prompt}</div>${a ? '' : q.choices ? `<div class="jg-ops">${q.choices.map((c, j) => `<button type="button" class="chip jg-op" data-jro="${j}">${esc(c)}</button>`).join('')}</div>` : '<div class="row" style="gap:8px"><input class="inp" id="jr-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="답을 써요"><button class="btn primary" id="jr-ok" type="button">확인</button></div>'}</div>${a ? verdict(a.ok) + `<div class="explain"><b>정답</b> ${esc(q.answers[0])}${q.why ? '<br>' + esc(q.why) : ''}</div>` : ''}`; UI.run.q = q; }
    else if (w.src === 'eng') { const un = CH_UNITS.find((u) => u.ch === w.ref.ch && u.unit === w.ref.unit); const q = un && (!!un.v2 === (w.ref.v === 2)) && un.questions[w.ref.i]; if (!q) return head; body = `<div class="card"><div class="q-no">천일문 Unit ${esc(un.unit)} · ${esc(un.title)}</div><div style="margin-top:8px">${qBody(q)}</div></div>${q.choices ? choicesHtml(q, a ? a.pick : null) : `<div class="explain"><b>정답</b> ${esc(q.answerText || '')}</div><div class="row"><button class="btn soft" data-self="1" type="button">맞혔어요</button><button class="btn" data-self="0" type="button">아직이에요</button></div>`}${a ? verdict(a.ok) + (q.exp ? `<div class="explain">${esc(q.exp)}</div>` : '') : ''}`; UI.run.q = q; }
    else if (w.src === 'word') { const ww = w.word; const opts = UI.run.opts || (UI.run.opts = sshuffle([ww.ko, ...sshuffle(WORDS.filter((x) => x.ko !== ww.ko), 'wr:' + ww.en).slice(0, 3).map((x) => x.ko)], 'wr:' + ww.en + ':o')); body = `<div class="card" style="text-align:center;padding:40px"><div style="font-size:32px;font-weight:800">${esc(ww.en)}</div></div><div class="choices">${opts.map((o, k) => `<button class="choice ${a ? (o === ww.ko ? 'right' : k === a.pick ? 'wrong' : '') : ''}" data-pick="${k}" type="button" ${a ? 'disabled' : ''}><span class="n">${k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>${a ? verdict(a.ok) : ''}`; UI.run.q = { answer: opts.indexOf(ww.ko) }; }
    else if (w.src === 'g3') { const it = G3.find((x) => x.id === w.g3) || MM.find((x) => x.id === w.g3); if (!it) return head; body = `<div class="card"><div class="q-no">${esc(it.src || '')} <span class="tag">${esc(it.type || '')}</span></div><div class="q-text" style="margin-top:8px">${esc(it.q)}</div><div class="q-box" style="font-size:15.5px;line-height:1.85;font-weight:400">${esc(it.passage)}</div></div>${choicesHtml(it, a ? a.pick : null)}${a ? verdict(a.ok) + (it.exp ? `<div class="explain">${esc(it.exp)}</div>` : '') : ''}`; UI.run.q = it; }
    else if (w.src === 'drill') { const d = allDrills().find((x) => x.id === w.set), q = d && d.qs[w.i]; if (!q) return head; body = `<div class="card"><div class="q-no">${esc(d.title || '')} ${w.i + 1}번</div><div style="margin-top:8px">${qBody(q)}</div></div>${choicesHtml(q, a ? a.pick : null)}${a ? verdict(a.ok) + (q.exp ? `<div class="explain">${esc(q.exp)}</div>` : '') : ''}`; UI.run.q = q; }
    else if (w.src === 'nx') { const z = NXQ[w.qi]; if (!z) return head; const v = nxView(z.q, a ? { ok: a.ok, v: a.pick } : null); wide = !!v.psg; body = v.psg ? `<div class="nx-split">${v.psg}<div class="nx-side">${v.side}</div></div>` : v.side; UI.run.q = z.q; }
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
          ${mc ? `<div class="choices mq-ch">${T.choices.map((c, i) => `<button class="choice ${a ? (i + 1 === q.answer ? 'right' : i + 1 === a.pick ? 'wrong' : '') : ''}" data-pick="${i + 1}" type="button" ${a ? 'disabled' : ''}><span class="n">${i + 1}</span>${/^[①②③④⑤]$/.test(String(c).replace(/<[^>]+>/g, '').trim()) ? '' : `<span class="ct">${c}</span>`}</button>`).join('')}</div>` : `<div class="card"><input class="inp" id="short" inputmode="numeric" placeholder="답 (숫자)" ${a ? 'disabled' : ''}>${a ? '' : '<button class="btn primary block" style="margin-top:12px" id="short-ok" type="button">확인</button>'}</div>`}
          ${a ? verdict(a.ok, a.ok ? '' : ` <span style="margin-left:auto">정답 ${mc ? '①②③④⑤'[q.answer - 1] : esc(q.answer)}</span>`) + mockX(ms, q) : ''}`;
        if (psg) { wide = true; body = `<div class="split"><div class="psg mq-psg" aria-label="지문"><div class="psg-h">지문 <span class="tiny">따로 위아래로 넘겨 읽어요</span></div><div class="psg-body">${psg}</div></div><div class="qside">${qcard}</div></div>`; }
        else body = qcard;
      } else if (q.passage && q.passage.length) { wide = true; body = `<div class="split"><div class="psg" aria-label="지문"><div class="psg-h">[${esc(String(q.set || '').replace('-', '~'))}] 지문 <span class="tiny">위아래로 넘겨 읽어요</span></div>${q.passage.map((src) => `<img src="${esc(src)}" alt="지문" loading="lazy">`).join('')}</div><div class="qside">${body}</div></div>`; }
    }
    return `<div class="qwrap" style="max-width:${wide ? 1240 : 760}px;margin:0 auto">${head}${body}${a ? `<div class="cta-bar"><button class="btn primary big block" id="next" type="button">${queue.length ? '다음 오답' : '오답 노트로'}</button></div>` : ''}</div>`;
  }
  // 모의고사 글자 해설 (틀린 문제 10/27): 지문 흐름 · 문단/문장 분석 · 정답 근거 · 선지 하나씩
  function mockX(ms, q) {
    const rx = (t) => rich(t).replace(/\n/g, '<br>');
    const X = q.t && q.t.x, S0 = q.set && ((ms.sets || {})[q.set] || {}).x; if (!X && !S0) return '';
    const flow = (o) => (o && o.flow ? `<div class="mx-flow">${rx(o.flow)}</div>` : '');
    const parts = (o) => (o && (o.parts || []).length ? `<div class="mx-parts">${o.parts.map((p) => `<div class="mx-part"><b>${rx(p.h || '')}</b><p>${rx(p.s || '')}</p></div>`).join('')}</div>` : '');
    const sents = (o) => (o && (o.sents || []).length ? `<details class="mx-more"><summary>문장마다 뜯어보기 · ${o.sents.length}문장</summary>${o.sents.map((x, k) => `<div class="mx-sent"><div class="mx-en"><span class="num">${k + 1}</span>${rx(x.en || '')}</div><div class="mx-ko">${rx(x.ko || '')}</div>${x.an ? `<div class="mx-an">${rx(x.an)}</div>` : ''}</div>`).join('')}</details>` : '');
    const ctx = [S0, X].map((o) => flow(o) + parts(o) + sents(o)).join('');
    const x = X || {};
    return `<div class="card mx"><div class="card-h"><h3>해설</h3>${x.point ? `<span class="tiny">${rx(x.point)}</span>` : ''}</div>
      ${ctx ? `<div class="mx-sec"><div class="mx-lb">글 흐름</div>${ctx}</div>` : ''}
      ${(x.steps || []).length ? `<div class="mx-sec"><div class="mx-lb">풀이</div><ol class="mx-steps">${x.steps.map((t) => `<li>${rx(t)}</li>`).join('')}</ol></div>` : ''}
      ${x.key ? `<div class="mx-sec"><div class="mx-lb">왜 ${esc(String(q.answer))}${typeof q.answer === 'number' && q.answer <= 5 && !q.short ? '번' : ''}이 답이에요?</div><div class="explain">${rx(x.key)}</div></div>` : ''}
      ${(x.choices || []).length ? `<div class="mx-sec"><div class="mx-lb">선지 하나씩</div><div class="mx-chs">${x.choices.map((t) => `<p>${rx(t)}</p>`).join('')}</div></div>` : ''}
      ${x.tip ? `<div class="mx-tip">${ic('bulb')} ${rx(x.tip)}</div>` : ''}</div>`;
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
    const r = UI.run; if (!r || r.kind !== 'retry') return; const w0 = S.wrong[r.id], w = w0;
    mathify($('.qwrap'));
    const done = (ok, pick) => { const w = S.wrong[r.id] || w0; r.ans = { ok, pick }; w.tries = (w.tries || 0) + 1; if (ok) clearWrong(r.id); else { w.times = (w.times || 1) + 1; w.at = Date.now(); save('wrong'); } render(); };
    $$('[data-pick]').forEach((b) => (b.onclick = () => { const k = +b.dataset.pick; done(k === r.q.answer, k); }));
    if (w.src === 'nx' && r.q && !r.ans) nxBindQ(r.q, (ok, v) => done(ok, v));
    const nself = $('[data-nxself]'); if (nself && w.src === 'nx') nself.onclick = () => { r.ans = { ...r.ans, ok: true, self: 1 }; clearWrong(r.id); render(); };
    $$('[data-self]').forEach((b) => (b.onclick = () => done(b.dataset.self === '1', null)));
    $$('[data-jro]').forEach((b) => (b.onclick = () => done(jgOk(r.q, r.q.choices[+b.dataset.jro]), b.dataset.jro)));
    const jr = $('#jr-ok'), ji = $('#jr-in'); if (jr && ji) { const go = () => ji.value.trim() && done(jgOk(r.q, ji.value), ji.value); jr.onclick = go; ji.onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); go(); } }; }
    const so = $('#short-ok'); if (so) so.onclick = () => { const v = $('#short').value.trim(); done(String(+v) === String(r.q.answer), v); };
    $$('[data-page]').forEach((b) => (b.onclick = () => sheet(`<h2>문제지 전체 쪽</h2><img class="q-img" src="${esc(b.dataset.page)}" alt="">`)));
    const n = $('#next'); if (n) n.onclick = () => { if (r.queue && r.queue.length) { const [nx, ...rest] = r.queue; UI.run = { kind: 'retry', id: nx, queue: rest, back: r.back }; } else { UI.run = null; UI.tab = r.back || 'wrong'; if (r.back === 'hw') toast('오늘 오답 끝!'); } render(); window.scrollTo(0, 0); };
  }

  // ───────── 성적 탭 (모의고사 · 내신) ─────────
  function scoreView() {
    const seg = UI.scoreSeg;
    const top = `<h1 class="h1">성적</h1><p class="sub">모의고사는 틀린 번호만 누르면 점수·등급·약한 영역이 나와요</p><div class="row between gr-top" style="gap:12px;margin-bottom:16px"><div class="seg" style="max-width:360px;flex:1 1 0;min-width:0"><button type="button" class="${seg === 'mock' ? 'on' : ''}" data-seg="mock">모의고사</button><button type="button" class="${seg === 'naesin' ? 'on' : ''}" data-seg="naesin">내신</button></div>${seg === 'mock' ? '<button class="btn primary" id="qg-open" type="button">내 등급 바로 적기</button>' : ''}</div>`;
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
    const m = MOCKS.find((x) => x.id === UI.mockId); if (!m) return; const key = UI.mockSubj, ms = mockSubj(m, key); const rec0 = () => S.mock[m.id][key];  // 누를 때마다 다시 찾아요 (서버 맞춤 뒤 옛 기록에 적지 않게 10/26)
    $$('[data-q]').forEach((b) => (b.onclick = () => { const n = +b.dataset.q; const s = new Set(rec0().wrong); s.has(n) ? s.delete(n) : s.add(n); rec0().wrong = [...s].sort((a, b) => a - b); if (rec0().done) rec0().dirty = true; save('mock'); render(); }));
    const dn = $('#mk-done'); if (dn) dn.onclick = () => {
      rec0().done = true; rec0().at = Date.now(); rec0().dirty = false;
      // 오답 노트에 넣고, 이번에 안 틀린 번호는 빼기
      for (const q of ms.qs) { const id = `mock:${m.id}:${key}:${q.no}`; if (rec0().wrong.includes(q.no)) { if (!S.wrong[id]) S.wrong[id] = { src: 'mock', exam: m.id, subj: key, subjName: ms.name || SUBJ_NAMES[key], area: q.area || '기타', sub: q.sub || '', no: q.no, title: `${m.title.replace(/학력평가/, '학평')} ${ms.name || SUBJ_NAMES[key]} ${q.no}번`, at: Date.now(), times: 1, cleared: false }; } else if (S.wrong[id] && !S.wrong[id].tries) delete S.wrong[id]; }
      save('mock', 'wrong'); render(); toast('채점했어요. 틀린 문제는 오답 노트에 들어갔어요');
    };
    const rt = $('#mk-retry'); if (rt) rt.onclick = () => { const ids = rec0().wrong.map((n) => `mock:${m.id}:${key}:${n}`).filter((id) => S.wrong[id]); if (!ids.length) return; UI.tab = 'wrong'; UI.run = { kind: 'retry', id: ids[0], queue: ids.slice(1) }; render(); window.scrollTo(0, 0); };
    const bk = $('#mk-back'); if (bk) bk.onclick = () => { UI.mockId = null; render(); };
    $$('[data-ms]').forEach((b) => (b.onclick = () => { UI.mockSubj = b.dataset.ms; render(); }));
  }
  // 기말 작전 (10/27 선생님: 상대평가라 어렵지만 기말에 어떻게 하면 어느 정도 나올지): 중간 석차로 지금 자리와 다음 등급까지 몇 등인지
  // 학기 최종 등급은 중간·기말·수행을 합친 점수로 다시 줄을 세워요. 그래서 「지금 내 위에 있는 몇 명보다 기말에서 더 받기」가 목표예요. 점수 커트는 학교마다 달라 지어내지 않아요
  // 점수 감: 이 학교 이 과목에서 몇 점이 몇 등급이었는지 모든 시험(학기·중간·기말)을 모아요. 과목 이름 끝 숫자(공통국어1·2)는 떼고 같은 과목으로 봐요
  const nsBase = (n) => String(n).replace(/\s*\d+$/, '');
  function nsHist(base) {
    const o = [];
    for (const sem of SEMS) { const rec = S.naesin[sem] || {}; for (const [n, r] of Object.entries(rec)) { if (!r || typeof r !== 'object' || nsBase(n) !== base) continue;
      for (const [sc, gf, rf, lb] of [['mid', 'midG', 'midRk', '중간'], ['fin', 'finG', 'finRk', '기말'], ['tot', 'grade', 'totRk', '종합']]) { const k = nsRk(r[rf]); if (+r[sc] > 0 && k) o.push({ sem, ex: lb, l: `${sem.split('-')[1]}학기 ${lb}`, s: +r[sc], p: k.pct, g: +r[gf] || (k.pct <= 10 ? 1 : k.pct <= 34 ? 2 : k.pct <= 66 ? 3 : 4) }); } } }
    return o;
  }
  // 등급 컷 짐작: 받은 점수 중 그 등급 안에 든 가장 낮은 점수 / 못 든 가장 높은 점수 사이. 시험마다 어려움이 달라 엇갈리면 그렇다고 말해요(지어내지 않아요)
  function nsCut(H, g) {
    H = H.filter((x) => x.ex !== '종합'); // 학기 종합은 수행이 섞여 시험 점수와 잣대가 달라요. 칩으로만 보여요
    const lim = [0, 10, 34, 66][g], inn = H.filter((x) => x.p <= lim && x.p > [0, 0, 10, 34][g]).map((x) => x.s), out = H.filter((x) => x.p > lim).map((x) => x.s);
    const lo = out.length ? Math.max(...out) : null, hi = inn.length ? Math.min(...inn) : null;
    if (lo != null && hi != null) return hi > lo ? { t: 'range', lo, hi } : { t: 'mix', lo, hi };
    return lo != null ? { t: 'above', lo } : hi != null ? { t: 'got', hi } : null;
  }
  // 과목 카드 한 장: 맨 위 목표 → 지금 자리 → 시험 기록 표 → 짐작 컷 (10/27 선생님: 알약이 줄줄이라 보기 불편, 정돈해 달라)
  function nsFeel(base, sem, r) {
    const H = nsHist(base), n1 = (v) => String(Math.round(v * 100) / 100);
    const tbl = H.length ? `<div class="np-tb">${H.map((x) => `<div class="${x.sem === sem ? 'cur' : ''}"><span>${esc(x.l)}</span><b class="num">${n1(x.s)}</b><span class="np-gt g${Math.min(3, x.g)}">${x.g}등급</span><span class="num">${fmt1(x.p)}%</span></div>`).join('')}</div>` : '';
    const ct = (c, g) => !c ? '' : c.t === 'range' ? `${g}등급 약 <b>${n1(c.lo)}~${n1(c.hi)}점</b>` : c.t === 'above' ? `${g}등급 <b>${n1(c.lo)}점 초과</b>` : c.t === 'got' ? `${g}등급 <b>${n1(c.hi)}점</b>이면 들어요` : `${g}등급 시험마다 달라요(${n1(c.hi)}점 들고 ${n1(c.lo)}점 놓침)`;
    const cuts = H.length ? [ct(nsCut(H, 1), 1), ct(nsCut(H, 2), 2)].filter(Boolean) : [];
    // 기말 목표: 같은 학기 중간이 기준 (같은 선생님·비슷한 어려움). 못 들었으면 한 문제(약 4점) 더, 들었으면 그 점수 지키기
    const m = +r.mid, mg = +r.midG, tgt = m > 0 && mg && !(+r.fin > 0) ? (mg === 1 ? { v: `${n1(m)}점 지키기`, why: '중간 점수가 1등급이었어요' } : Math.ceil(m + 4) >= 100 ? { v: '만점', why: `중간 ${n1(m)}점도 ${mg}등급이었어요. 실수 하나가 등급을 갈라요` } : { v: `${Math.ceil(m + 4)}점 이상`, why: `중간 ${n1(m)}점은 ${mg}등급이었어요. 한 문제 더` }) : null;
    return { tbl, cut: cuts.length ? `<p class="np-cut">짐작 컷 · ${cuts.join(' · ')}</p>` : '', tgt };
  }
  function nsPlan(sem) {
    const rec = S.naesin[sem] || {}, L = nsSubjects(sem).map((s) => ({ s, r: rec[s.name] || {}, k: nsRk((rec[s.name] || {}).midRk) })).filter((x) => x.k && +x.r.midG);
    if (!L.length) return '';
    const done = L.some((x) => +x.r.fin > 0 && +x.r.grade); // 기말·학기 등급까지 나온 학기는 돌아보기로 보여요
    const x = (p) => Math.min(100, Math.max(0, p));
    const bar = (p) => `<div class="np-bar"><i class="np-z1" style="width:10%"></i><i class="np-z2" style="left:10%;width:24%"></i><em style="left:${x(p)}%"></em><span style="left:10%">10%</span><span style="left:34%">34%</span></div>`;
    const card = (tone, name, g, pct, box, st, F) => `<div class="np-r ${tone}"><div class="np-hd"><b>${esc(name)}</b><span class="np-gb g${Math.min(3, g)}">${g}등급</span><span class="tiny">상위 ${fmt1(pct)}%</span></div>
        ${box}${bar(pct)}<p class="np-st">${st}</p>${F.tbl}${F.cut}</div>`;
    const row = ({ s, r, k }) => {
      const g = +r.midG, F = nsFeel(nsBase(s.name), sem, r);
      if (done) { const t = nsRk(r.totRk), fg = +r.finG, tg = +r.grade || g, tc = t ? Math.floor(t.n * 0.1) : 0; // 끝난 학기: 중간 → 기말 → 학기 종합
        const near = t && tg === 2 && t.rk - tc <= 8;
        const st = t ? (near ? `<b>1등급까지 ${t.rk - tc}등 모자랐어요</b> <span class="tiny">· 학기 ${t.rk}등 / ${t.n}명 · 1등급 ${tc}등까지</span>` : `학기 종합 <b>${t.rk}등</b> <span class="tiny">/ ${t.n}명</span>`) : '';
        return card(tg === 1 ? 'ok' : near ? 'hot' : '', s.name, tg, t ? t.pct : k.pct, `<div class="np-tg"><span class="np-tl">학기 결과</span><b>${tg}등급</b><span class="np-why">중간 ${g}등급 → 기말 ${fg || '-'}등급 → 학기 ${tg}등급</span></div>`, st, F); }
      const up = g === 1 ? null : g === 2 ? k.c1 : g === 3 ? k.c2 : k.c3, gap = up != null ? Math.max(1, k.rk - up) : null, keep = g === 1 ? Math.floor(((10 - k.pct) * k.n) / 100) : null;
      const [tone, msg] = g === 1 ? (keep <= 5 ? ['warn', keep > 0 ? `1등급 경계 · ${keep}명만 앞질러도 2등급` : '아슬아슬 1등급'] : ['ok', `1등급 여유 ${keep}명`]) : gap <= 8 ? ['hot', `${g - 1}등급까지 약 ${gap}등 · 한두 문제면 뒤집어요`] : ['', `${g - 1}등급까지 약 ${gap}등`];
      const st = `<b>${esc(msg)}</b> <span class="tiny">· 중간 ${k.rk}등${k.tie > 1 ? `(동점 ${k.tie})` : ''} / ${k.n}명 · ${g <= 2 ? `1등급 ${k.c1}등까지` : `${g - 1}등급 ${up}등까지`}</span>`;
      return card(tone, s.name, g, k.pct, F.tgt ? `<div class="np-tg"><span class="np-tl">기말 목표</span><b>${esc(F.tgt.v)}</b><span class="np-why">${esc(F.tgt.why)}</span></div>` : '', st, F);
    };
    const pri = L.filter((x) => +x.r.midG > 1).sort((a, b) => (nsRk(a.r.midRk).pct - [0, 10, 34, 66][+a.r.midG - 1]) - (nsRk(b.r.midRk).pct - [0, 10, 34, 66][+b.r.midG - 1]));
    return `<section class="card c12 np-card"><div class="card-h"><h2>${done ? `${sem.split('-')[1]}학기 돌아보기` : '기말 작전'}</h2><span class="tiny">${done ? '중간 · 기말 · 학기 종합 석차로 봤어요' : '중간 석차로 봤어요'}</span></div>
      ${pri.length && !done ? `<div class="explain" style="margin:0 0 12px">학기 등급은 <b>중간·기말·수행 합친 점수</b>로 다시 정해져요. 먼저 챙길 과목은 <b>${pri.slice(0, 3).map((x) => esc(x.s.name)).join(' · ')}</b>예요.</div>` : ''}
      <div class="np-g2">${L.sort((a, b) => nsRk(a.r.midRk).pct - [0, 10, 34, 66][+a.r.midG - 1] - (nsRk(b.r.midRk).pct - [0, 10, 34, 66][+b.r.midG - 1])).map(row).join('')}</div></section>`;
  }
  function naesinView() {
    const sem = UI.semester; const rec = S.naesin[sem] || {};
    const subs = nsSubjects(sem); const av = nsAvg(sem), tot = nsTotal();
    const split = true; // 학기마다 중간·기말을 따로 적고, 학기 끝나면 최종 등급 (10/27 1학기 중간 석차도 받아서 1학기도 나눠요)
    const ex = (f) => { const v = subs.map((s) => +(rec[s.name] || {})[f]).filter((x) => x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const mAvg = ex('mid'), fAvg = ex('fin');
    const gsel = (n, f, v) => `<select class="inp sm" style="width:64px" data-ns="${esc(n)}" data-f="${f}"><option value="">-</option>${[1, 2, 3, 4, 5].map((g) => `<option ${+v === g ? 'selected' : ''}>${g}</option>`).join('')}</select>`;
    const rows = SEMS.map((s) => ({ label: s.replace('-', '-') + '학기', v: { n: nsAvg(s) } })).filter((r) => r.v.n != null);
    return `<div class="grid">
      <section class="card c4"><div class="eyebrow">전체 평균 (단위 수 반영)</div><div class="big num" style="font-size:40px;margin:8px 0 4px">${tot ? fmt1(tot) : '-'}<span style="font-size:18px"> 등급</span></div><p class="muted" style="margin:0">${goalLine(tot, S.profile.goalNaesin) || '과목 등급을 넣으면 계산돼요'}</p><hr class="sep"><div class="tiny">2022 개정 교육과정은 내신이 <b>5등급</b>이에요. 1등급은 상위 10%, 2등급은 34%까지예요.</div></section>
      <section class="card c8"><div class="card-h"><h2>학기별 평균</h2></div>${rows.length ? tossLine(rows.map((r) => ({ label: r.label, v: r.v.n })), { maxG: 5, h: 180, id: 'n2', color: '#03b26c', goal: S.profile.goalNaesin }) : `<div class="empty">${ic('up')}<b>아직 없어요</b></div>`}</section>
      ${split ? nsPlan(sem) : ''}
      <section class="card c12"><div class="card-h"><h2>과목별 입력 <span class="save-st" data-savest>${saveStText()}</span></h2><div class="seg" style="flex:0 1 auto">${SEMS.map((s) => `<button type="button" class="${sem === s ? 'on' : ''}" data-sem="${s}">${s.replace('-', '학년 ')}학기</button>`).join('')}</div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>과목</th><th class="r">단위</th>${split ? '<th class="r">중간 점수</th><th class="r">중간 등급</th><th class="r">중간 석차</th><th class="r">기말 점수</th><th class="r">기말 등급</th><th class="r">기말 석차</th><th class="r">학기 점수</th><th class="r">학기 최종 등급</th><th class="r">학기 석차</th>' : '<th class="r">원점수</th><th class="r">과목 평균</th><th class="r">등급 (1~5)</th>'}<th class="r">성취도</th></tr></thead><tbody>
        ${subs.map((s) => { const r = rec[s.name] || {}; return `<tr><td style="font-weight:600">${esc(s.name)}${s.noGrade ? '<div class="tiny">등급 없음</div>' : ''}</td><td class="r"><input class="inp sm num" style="width:56px" data-ns="${esc(s.name)}" data-f="credits" value="${esc(r.credits || s.credits || '')}" inputmode="numeric"></td>${split ? [['mid', 'midG'], ['fin', 'finG'], ['tot', 'grade']].map(([sc, gf]) => (sc ? `<td class="r"><input class="inp sm num" style="width:64px" data-ns="${esc(s.name)}" data-f="${sc}" value="${esc(r[sc] ?? '')}" inputmode="decimal" placeholder="점수"></td>` : '') + `<td class="r">${s.noGrade ? '-' : gsel(s.name, gf, r[gf])}</td>` + (true ? `<td class="r"><input class="inp sm num" style="width:104px" data-ns="${esc(s.name)}" data-f="${({ midG: 'midRk', finG: 'finRk', grade: 'totRk' })[gf]}" value="${esc(r[({ midG: 'midRk', finG: 'finRk', grade: 'totRk' })[gf]] || '')}" placeholder="35(10)/312"></td>` : '')).join('') : `<td class="r"><input class="inp sm num" style="width:72px" data-ns="${esc(s.name)}" data-f="raw" value="${esc(r.raw || '')}" inputmode="decimal"></td><td class="r"><input class="inp sm num" style="width:72px" data-ns="${esc(s.name)}" data-f="avg" value="${esc(r.avg || '')}" inputmode="decimal"></td><td class="r">${s.noGrade ? '-' : gsel(s.name, 'grade', r.grade)}</td>`}<td class="r"><select class="inp sm" style="width:64px" data-ns="${esc(s.name)}" data-f="ach"><option value="">-</option>${['A', 'B', 'C', 'D', 'E', 'P'].map((g) => `<option ${r.ach === g ? 'selected' : ''}>${g}</option>`).join('')}</select></td></tr>`; }).join('')}
        </tbody></table></div>
        ${split ? `<p class="tiny" style="margin:12px 0 0">중간고사·기말고사 점수와 등급을 시험마다 따로 적어요. 학기 최종 등급이 나오면 그걸로 평균을 내고, 아직이면 중간·기말 등급 평균으로 계산해요${mAvg != null || fAvg != null ? ` · 평균 중간 <b class="num">${mAvg != null ? fmt1(mAvg) : '-'}</b>점, 기말 <b class="num">${fAvg != null ? fmt1(fAvg) : '-'}</b>점` : ''}</p>` : ''}
        <div class="row between" style="margin-top:16px"><span class="muted">${sem.replace('-', '학년 ')}학기 평균 <b class="num" style="color:var(--t1)">${av ? fmt1(av) : '-'}</b>등급</span><button class="btn sm" id="ns-add" type="button">과목 더하기</button></div></section>
    </div>`;
  }
  function bindNaesin() {
    $$('[data-sem]').forEach((b) => (b.onclick = () => { UI.semester = b.dataset.sem; render(); }));
    const nsSet = (x) => { const sem = UI.semester; S.naesin[sem] = S.naesin[sem] || {}; const r = (S.naesin[sem][x.dataset.ns] = S.naesin[sem][x.dataset.ns] || {}); const v = x.value.trim(); r[x.dataset.f] = x.dataset.f === 'ach' || /Rk$/.test(x.dataset.f) ? v : v === '' ? '' : +v; };
    $$('input[data-ns]').forEach((x) => (x.oninput = () => { if (x.value.trim() !== '' && isNaN(+x.value.trim()) && !/Rk$/.test(x.dataset.f)) return; if (/Rk$/.test(x.dataset.f) && x.value.trim() && !nsRk(x.value)) return; nsSet(x); saveSt.wait = true; paintSaveSt(); save('naesin'); }));
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
    const ed = engToday(true); const MMO = !!(UI.run && UI.run.kind === 'g3' && UI.run.mm), SRC = MMO ? MM : G3, AK = MMO ? 'mmans' : 'g3ans'; const li = UI.run && UI.run.kind === 'g3' && UI.run.lib != null ? UI.run.lib : null; const it = SRC[li != null ? li : ed.g3 != null ? ed.g3 : 0];
    if (!it) return `<div class="card empty">${ic('eng')}<b>고3 문제를 준비하는 중이에요</b></div>`;
    S.eng[AK] = S.eng[AK] || {}; const a = S.eng[AK][it.id];
    const showWords = UI.run && UI.run.words;
    const QQ = MMO && UI.run && UI.run.q ? UI.run.q : null;
    UI.run = { kind: 'g3', id: it.id, words: showWords, lib: li, mm: MMO, q: QQ };
    const head = `<div class="row between">${QQ ? `<button class="btn sm" data-go="hw" type="button">‹ 숙제 · ${QQ.length - mmLeft(QQ).length}/${QQ.length}</button>` : MMO ? `<button class="btn sm" data-lib="mm" type="button">‹ ${esc(mmExam(it))}</button>` : li != null ? '<button class="btn sm" data-lib="g3" type="button">‹ 고3 목록</button>' : '<button class="btn sm" data-go="hw" type="button">‹ 숙제</button>'}<span class="tiny">${esc(it.src || '')} · ${esc(it.type || '')}</span></div>`;
    const words = `<div class="card"><div class="card-h"><h3>이 글의 단어 ${(it.words || []).length}개</h3>${a ? '' : `<button class="more" id="g3-w" type="button">${showWords ? '접기' : '먼저 보기'}</button>`}</div>${a || showWords ? `<table class="tbl"><tbody>${(it.words || []).map((w) => `<tr><td><b>${esc(w.en)}</b></td><td style="color:var(--t2)">${esc(w.ko)}</td></tr>`).join('')}</tbody></table>` : '<p class="tiny" style="margin:0">모르는 단어가 많으면 먼저 보고 풀어도 돼요</p>'}</div>`;
    const prob = `<div class="card"><div class="q-no">${MMO ? esc(String(it.src || '').replace(' 전국연합학력평가', '')) : '오늘의 고3 문제'} <span class="tag">${esc(it.type || '')}</span>${it.level ? ` <span class="tag">${'★'.repeat(it.level)}</span>` : ''}</div><div class="q-text" style="margin-top:8px">${esc(it.q)}</div>${it.given ? `<div class="q-box" style="font-size:15.5px;line-height:1.75;border:1.5px solid var(--t2)">${esc(it.given)}</div>` : ''}<div class="q-box" style="font-size:15.5px;line-height:1.85;font-weight:400">${esc(it.passage)}</div>${it.notes ? `<p class="tiny" style="margin:8px 0 0;white-space:pre-wrap">${esc(Array.isArray(it.notes) ? it.notes.join('\n') : it.notes)}</p>` : ''}</div>`;
    const sents = a ? `<div class="card"><div class="card-h"><h3>문장마다 뜯어보기</h3><span class="tiny">파란 칸을 누르면 천일문 그 부분으로 가요</span></div><div class="list">${(it.sentences || []).map((s, k) => `<div class="li" style="align-items:flex-start;flex-direction:column;gap:6px"><div class="t" style="font-size:15.5px;line-height:1.65"><span class="tiny num" style="margin-right:6px">${k + 1}</span>${esc(s.en)}</div><div class="d" style="font-size:14px">${esc(s.ko)}</div>${s.analysis ? `<div class="explain" style="margin:0;width:100%">${esc(s.analysis)}</div>` : ''}${(s.cheonil || []).filter((c) => unitIdx(c.ch, c.unit) >= 0).map((c) => `<button class="btn sm soft" type="button" data-cu="${c.ch}|${c.unit}">천일문 Unit ${esc(c.unit)} ${esc((CH_UNITS[unitIdx(c.ch, c.unit)] || {}).title || '')} 공부하기</button>${c.why ? `<span class="tiny">${esc(c.why)}</span>` : ''}`).join('')}</div>`).join('')}</div></div>` : '';
    return `<div class="qwrap" style="max-width:820px;margin:0 auto">${head}${prob}${choicesHtml({ choices: it.choices, answer: it.answer }, a ? a.pick : null)}${a ? verdict(a.ok) + (it.exp ? `<div class="explain"><b>해설</b><br>${esc(it.exp)}</div>` : '') : ''}${words}${sents}${a ? (QQ ? `<div class="cta-bar">${mmLeft(QQ).length ? `<button class="btn primary big block" data-lmmq="${mmLeft(QQ)[0]}" type="button">다음 문제 · ${mmLeft(QQ).length}개 남았어요</button>` : '<button class="btn primary big block" data-go="hw" type="button">숙제 끝! 숙제로 돌아가기</button>'}</div>` : MMO ? `<div class="cta-bar">${MM[li + 1] && mmExam(MM[li + 1]) === mmExam(it) ? `<button class="btn primary big block" data-lmm="${li + 1}" type="button">다음 문제</button>` : `<button class="btn primary big block" data-lib="mm" type="button">회차 목록으로</button>`}</div>` : '<div class="cta-bar"><button class="btn primary big block" data-go="hw" type="button">숙제로 돌아가기</button></div>') : ''}</div>`;
  }
  function bindG3() {
    const ed = engToday(true), MMO = !!UI.run.mm, li = UI.run && UI.run.lib != null ? UI.run.lib : null, it = (MMO ? MM : G3)[li != null ? li : ed.g3 || 0]; if (!it) return;
    $$('[data-pick]').forEach((b) => (b.onclick = () => {
      const k = +b.dataset.pick, ok = k === it.answer; S.eng[MMO ? 'mmans' : 'g3ans'][it.id] = { pick: k, ok, at: Date.now() };
      if (MMO) { let hd = false; for (const h of S.hw || []) { const ids = !h.done && mmOf(h); if (ids && !mmLeft(ids).length) { h.done = true; h.doneAt = Date.now(); hd = true; } } if (hd) { save('hw'); toast('모의고사 숙제 끝!'); } }
      const et = engToday(true);  // 누를 때 다시 찾아요 (서버 맞춤 뒤 옛 기록에 적지 않게)
      if (!MMO && li == null && !et.g3done) { et.g3done = Date.now(); S.eng.g3 = (S.eng.g3 || 0) + 1; }
      const wid = 'g3:' + it.id; if (!ok) addWrong(wid, { src: 'g3', subj: 'eng', subjName: '영어', area: (MMO ? `고${it.grade} ` : '고3 ') + (it.type || '독해'), sub: it.src, g3: it.id }); else { gotIt(wid); if (S.wrong[wid]) clearWrong(wid); }
      save('eng'); render();
    }));
    const w = $('#g3-w'); if (w) w.onclick = () => { UI.run.words = !UI.run.words; render(); };
    $$('[data-cu]').forEach((b) => (b.onclick = () => { const [ch, un] = b.dataset.cu.split('|'); UI.run = { kind: 'unit', ref: unitIdx(ch, un), back: 'g3', g3lib: li, mm: MMO }; render(); window.scrollTo(0, 0); }));
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
      <h3>5등급제와 9등급제는 바로 견주면 안 돼요</h3><p>입결 숫자는 모두 9등급제예요. 5등급제 1.5는 9등급제로 치면 2점대 중반이에요. 그래서 목록에는 <b>9등급으로 바꾼 내 등급</b>을 크게, 원래 5등급제 값은 괄호에 적었어요. 바꾼 값은 교육부 등급 비율로 맞춘 대략값이에요.</p><h3>1.67을 1.6으로 쳐 주나요?</h3><p>아니에요. 이번에 찾은 대학 중 소수 첫째 자리에서 자르는 곳은 없어요. 서강대는 소수 둘째 자리 반올림, 숭실대는 넷째 자리 버림, 세종대는 여덟째 자리까지 쓰는 식이라 1.65는 1.65 그대로 들어가요.</p>
      <h3>A를 1등급으로 쳐 주는 대학</h3><p>1학년 과목(공통과목)은 5등급 석차가 나와서 해당이 없어요. 2·3학년 진로선택 과목에서 쓰여요.</p>${A.length ? `<ul>${A.map((x) => `<li><b>${esc(x.short)}</b> ${esc(x.careerA)}</li>`).join('')}</ul>` : ''}
      <h3>${esc(NMI())}는 2029학년도 입시예요</h3><p>그 해 규칙은 2027년 봄에 나와요. 지금은 5등급제 첫해인 2028학년도 시행계획으로 맞춰 두었어요. 내 등급은 9등급제로 치면 대략 ${ns ? fmt1(g5to9(ns)) : '-'}등급이에요(교육부 비율로 맞춘 대략값).</p></details>`;
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
  const NEWS_ALL = () => ((D.news && D.news.items) || []).filter((n) => !TUTOR || (!/정윤/.test(n.title + n.body) && !['대학', '바이오', '바이오 산업'].includes(n.scope)));
  if (TUTOR && D.news && D.news.items) D.news.items = NEWS_ALL();  // 소식 탭·홈·대학 탭 어디서든 같은 목록
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
  const bdayLeft = () => { const b = S.profile.birth || BIRTH; if (!b) return null; const [, m, d] = b.split('-').map(Number); const t = new Date(today() + 'T00:00:00'); let n = new Date(t.getFullYear(), m - 1, d); if (n < t) n = new Date(t.getFullYear() + 1, m - 1, d); return Math.round((n - t) / 864e5); };
  // 선생님 내 정보: 이름·생일·MBTI·테마 (학생 화면의 내 정보와 같은 모양)
  const tBday = () => { const b = TP.birth; if (!b) return null; const [, m, d] = b.split('-').map(Number); const t = new Date(today() + 'T00:00:00'); let n = new Date(t.getFullYear(), m - 1, d); if (n < t) n = new Date(t.getFullYear() + 1, m - 1, d); return Math.round((n - t) / 864e5); };
  function tmeView() {
    const p = TP, bl = tBday(), sk = skin();
    const row = (k, label, val, empty = '없음') => `<button class="li btnlike me-row" type="button" data-tme="${k}"><div class="body"><div class="t" style="font-weight:500;color:var(--t2)">${label}</div></div><span class="me-v ${val ? '' : 'muted'}">${val ? esc(val) : empty}</span><span class="chev"></span></button>`;
    return `<div style="max-width:640px;margin:0 auto">
      <div class="me-head"><span class="avatar xl" style="background:var(--t1);color:#fff">${esc((p.name || '선생님').slice(0, 1))}</span><h1 class="h1" style="margin:16px 0 4px;text-align:center">${esc(p.name)}</h1><div class="row" style="justify-content:center;gap:6px">${p.mbti ? `<span class="tag blue">${esc(p.mbti)}</span>` : ''}${bl != null ? `<span class="tag ${bl === 0 ? 'red' : ''}">${bl === 0 ? '오늘 생일' : `생일까지 D-${bl}`}</span>` : ''}</div></div>
      <section class="card tight" style="margin-top:20px"><div class="list">${row('name', '이름', p.name)}${row('birth', '생일', p.birth ? (() => { const [y, m, d] = p.birth.split('-'); return `${y}년 ${+m}월 ${+d}일`; })() : '')}${row('mbti', 'MBTI', p.mbti)}${row('motto', '나의 한마디', p.motto)}</div></section>
      <section class="card tight"><div class="card-h"><h3>테마</h3></div><div class="tsk-grid">${['ghost', ...GIFTS].map((k) => `<button type="button" class="tsk ${sk === k ? 'on' : ''}" data-tsk="${k}"><img src="${skinPic(k)}" alt=""><span>${esc(k === 'ghost' ? '기본' : SKINS[k].n)}</span></button>`).join('')}</div></section>
      <p class="tiny" style="text-align:center;margin:16px 0 0">선생님 정보는 학생 기록과 따로 저장돼요</p></div>`;
  }
  function bindTme() {
    $$('[data-tme]').forEach((b) => (b.onclick = () => editField(b.dataset.tme, TP, b.dataset.tme === 'motto' ? tMottoSave : tSave)));
    $$('[data-tsk]').forEach((b) => (b.onclick = () => { TP.skin = b.dataset.tsk; tSave(); render(); toast('테마를 바꿨어요'); }));
  }
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
      ${owned().length ? `<section class="card tight"><div class="list"><button class="li btnlike me-row" type="button" id="me-skin"><div class="body"><div class="t" style="font-weight:500;color:var(--t2)">테마</div></div><span class="me-v">${skin() === 'ghost' ? '기본' : esc(SKINS[skin()].n)}</span><span class="chev"></span></button></div></section>` : ''}
      ${PEEK ? '' : '<button class="btn big block ghost-red" id="me-out" type="button" style="margin-top:8px">로그아웃</button>'}
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
  function editField(k, p = S.profile, onSave = () => save('profile')) {
    if (k === 'goalMock' || k === 'goalNaesin') return goalSheet();
    const F = {
      name: ['이름', 'text'], birth: ['생일', 'date'], mbti: ['MBTI', 'mbti'], motto: ['나의 한마디', 'text', '예) 오늘 한 줄이 내일의 세특'], likes: ['좋아하는 과목', 'text', '예) 통합과학, 영어'], school: ['학교', 'text'], grade: ['학년·반', 'grade'], major: ['목표 학과', 'text', '예) 생명공학과'],
      goalMock: ['모의고사 목표 등급', 'sel', [1, 1.5, 2, 2.5, 3, 3.5, 4]], goalNaesin: ['내신 목표 등급', 'sel', [1, 1.2, 1.5, 1.8, 2, 2.5, 3]] }[k];
    if (!F) return;
    const [label, type, opt] = F;
    const body = type === 'mbti' ? `<div class="mbti-grid">${MBTI.map((m) => `<button type="button" class="${p.mbti === m ? 'on' : ''}" data-mb="${m}">${m}</button>`).join('')}</div>`
      : type === 'grade' ? `<div class="row" style="gap:12px"><div class="field" style="flex:1"><label>학년</label><select class="inp" id="ef-g">${[1, 2, 3].map((g) => `<option ${+p.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div><div class="field" style="flex:1"><label>반</label><input class="inp" id="ef-c" inputmode="numeric" value="${esc(p.cls)}"></div></div>`
      : type === 'sel' ? `${(() => { const a = autoGoals(), v = a && (k === 'goalMock' ? a.mock : a.naesin); return v ? `<button type="button" class="li btnlike" data-sauto style="width:100%;margin:0 0 12px;padding:12px 16px;box-sizing:border-box;border:0;background:var(--blue-soft);border-radius:14px;text-align:left;font:inherit"><div class="body"><div class="t">${esc(a.uni)} 합격선에 맞추기 · ${v}등급</div><div class="d">${k === 'goalMock' ? '수시 수능최저를 과목 평균으로 바꾼 값' : `${a.tr} 합격선 ${a.c9}등급(9등급제)을 5등급제로 바꾼 값`}</div></div>${!(p.goalSet || {})[k] ? '<span class="tag blue">지금</span>' : ''}</button>` : ''; })()}<div class="chips" style="flex-wrap:wrap">${opt.map((g) => `<button type="button" class="chip ${(p.goalSet || {})[k] && +p[k] === g ? 'on' : ''}" data-sv="${g}">${g}등급</button>`).join('')}</div>`
      : `<input class="inp" id="ef-v" type="${type}" value="${esc(p[k] || '')}" placeholder="${esc(opt || '')}">`;
    sheet(`<h2>${label}</h2>${body}<div class="row" style="margin-top:20px"><button class="btn big" style="flex:1" data-x type="button">닫기</button>${type === 'mbti' || type === 'sel' ? '' : '<button class="btn primary big" style="flex:1" id="ef-ok" type="button">저장</button>'}</div>`, (el, close) => {
      const done = () => { onSave(); close(); render(); toast('바꿨어요'); };
      $('[data-x]', el).onclick = close;
      $$('[data-mb]', el).forEach((b) => (b.onclick = () => { p.mbti = b.dataset.mb; done(); }));
      $$('[data-sv]', el).forEach((b) => (b.onclick = () => { p[k] = +b.dataset.sv; p.goalSet = { ...(p.goalSet || {}), [k]: true }; done(); }));
      const sa = $('[data-sauto]', el); if (sa) sa.onclick = () => { p.goalSet = { ...(p.goalSet || {}), [k]: false }; syncGoals(); done(); };
      const ok = $('#ef-ok', el); if (ok) ok.onclick = () => { if (type === 'grade') { p.grade = +$('#ef-g', el).value; p.cls = $('#ef-c', el).value.trim(); } else { const v = $('#ef-v', el).value.trim(); if (k === 'name' && !v) return; p[k] = v; } done(); };
      const inp = $('#ef-v', el); if (inp) { inp.focus(); inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) ok.click(); }; }
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
    const msk = $('#me-skin'); if (msk) msk.onclick = skinSheet;
    const lo = $('#me-out'); if (lo) lo.onclick = logoutSheet;
    const pk = $('#me-peek'); if (pk) pk.onclick = () => { try { sessionStorage.setItem('mu:peek', '1'); } catch (e) {} location.reload(); };
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
  // 공부 시간 (2026-10-27 정윤: 내 타이머로 재고 숫자만 적고 싶어요) · 직접 적은 시간과 토마토 시간 중 큰 쪽
  const sMin = (d) => { const x = pomo().days[d]; if (!x) return 0; return Math.max(x.man || 0, x.min || 0); };
  const sDays = () => Object.keys(pomo().days).filter((d) => sMin(d) > 0).sort();
  const sSum = (from, to = today()) => sDays().filter((d) => d >= from && d <= to).reduce((a, d) => a + sMin(d), 0);
  const sAll = () => sDays().reduce((a, d) => a + sMin(d), 0);
  const sBestDay = () => sDays().reduce((b, d) => (sMin(d) > (b ? sMin(b) : 0) ? d : b), null);
  const sStreak = () => { let n = 0, i = sMin(today()) ? 0 : 1; while (sMin(pBack(i))) { n++; i++; } return n; };
  const sBestRun = () => { let best = 0, run = 0, prev = null; for (const d of sDays()) { run = prev && Math.round((new Date(d + 'T00:00:00') - new Date(prev + 'T00:00:00')) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; } return best; };
  const hm = (m) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? `${h}시간${r ? ` ${r}분` : ''}` : `${r}분`; };
  const S_GOALS = [10, 30, 50, 100, 200, 300, 500, 700, 1000, 1500, 2000, 3000];
  const SBADGES = [
    { id: 'sf', i: 'pencil', t: '첫 기록', d: '공부 시간 처음 적기', ok: () => sDays().length >= 1 },
    { id: 'sd3', i: 'muscle', t: '하루 3시간', d: '하루 3시간 넘게', ok: () => sDays().some((d) => sMin(d) >= 180) },
    { id: 'sd5', i: 'fire', t: '하루 5시간', d: '하루 5시간 넘게', ok: () => sDays().some((d) => sMin(d) >= 300) },
    { id: 'sd8', i: 'glow', t: '하루 8시간', d: '하루 8시간 넘게', ok: () => sDays().some((d) => sMin(d) >= 480) },
    { id: 'sd10', i: 'crown', t: '하루 10시간', d: '하루 10시간 넘게', ok: () => sDays().some((d) => sMin(d) >= 600) },
    { id: 'sr3', i: 'herb', t: '3일 연속', d: '3일 이어서 기록', ok: () => sBestRun() >= 3 },
    { id: 'sr7', i: 'medal', t: '7일 연속', d: '일주일 내내 기록', ok: () => sBestRun() >= 7 },
    { id: 'sr30', i: 'trophy', t: '30일 연속', d: '한 달 내내 기록', ok: () => sBestRun() >= 30 },
    { id: 'sa10', i: 'clock', t: '누적 10시간', d: '모두 10시간', ok: () => sAll() >= 600 },
    { id: 'sa50', i: 'gold', t: '누적 50시간', d: '모두 50시간', ok: () => sAll() >= 3000 },
    { id: 'sa100', i: 'hundred', t: '누적 100시간', d: '모두 100시간', ok: () => sAll() >= 6000 },
    { id: 'sa300', i: 'grad', t: '누적 300시간', d: '모두 300시간', ok: () => sAll() >= 18000 },
    { id: 'sa1000', i: 'party', t: '누적 1000시간', d: '모두 1000시간', ok: () => sAll() >= 60000 },
  ];
  const sCheer = (m) => m >= 600 ? '10시간 넘게! 오늘의 정윤이는 전설이야' : m >= 480 ? '8시간 넘게 했어! 진짜 대단해' : m >= 300 ? '5시간 넘게! 오늘 정말 많이 했다' : m >= 180 ? '3시간 넘게 집중했어, 멋있어' : m >= 60 ? '한 시간 넘게! 오늘도 쌓였어' : '조금이라도 한 게 다 실력이 돼';
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
    const el = document.createElement('div'); el.className = 'bdg-pop' + (b.mega ? ' mega' : '');
    el.innerHTML = `<div class="bdg-card"><div class="bdg-rays"></div><div class="bdg-ic">${ic(b.i)}</div><p class="bdg-eb">${esc(b.eb || '배지 획득!')}</p><h3>${esc(b.t)}</h3><p class="bdg-d">${esc(b.d)}</p>${b.medals ? `<div class="bdg-medals">${b.medals.map((m) => `<span>🏅<b>${esc(m)}</b></span>`).join('')}</div>` : ''}${WALLET && b.w ? `<p class="bdg-won">+${b.w.toLocaleString()}원</p>` : ''}${all && list.length === 1 && !b.key ? `<p class="bdg-all">배지를 모두 모았어요!${WALLET ? ' 보너스 +5,000원' : ''}</p>` : ''}<button class="btn primary big block" type="button">${list.length > 1 ? '다음 배지 보기' : '좋아요'}</button></div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    setTimeout(() => { const r = $('.bdg-ic', el).getBoundingClientRect(); boom(r.left + r.width / 2, r.top + r.height / 2, 6); ding(8); if (navigator.vibrate) navigator.vibrate([60, 40, 120]); if (b.mega) [700, 1300, 1900, 2600].forEach((ms, i) => setTimeout(() => { if (!el.isConnected) return; boom(innerWidth * [0.2, 0.8, 0.35, 0.65][i], innerHeight * 0.3, 6); ding(8); }, ms)); }, 380);
    setTimeout(() => { if (WALLET && b.w) earn(b.key || 'badge:' + b.id, b.w, b.key ? b.t : `배지 · ${b.t}`, { bonus: true, from: $('.bdg-won', el) }); if (all && list.length === 1 && !b.key) earn('badge:all', 5000, '배지 모두 모음', { bonus: true, from: $('.bdg-won', el) }); }, 900);
    const close = () => { el.classList.remove('on'); setTimeout(() => { el.remove(); if (b.done) b.done(); badgePop(list.slice(1)); }, 260); };
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
  // 과외 학생 홈: 시사 · 교육 소식 3개
  function tNewsCard(cls) {
    const N = ((D.news && D.news.items) || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);
    if (!N.length) return '';
    return `<section class="card ${cls}"><div class="card-h"><h2>${ic('news')} 시사 · 교육 소식</h2><button class="more" data-go="news" type="button">전체 보기</button></div><div class="list">${N.map((n) => `<div class="li btnlike" data-news="${esc(n.id)}"><div class="ico">${ic(nIcon(n))}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${esc(md(n.date))} · ${esc(n.scope === '시사 상식' ? '시사' : '교육')}${wHas('news:' + n.id) ? ' · 읽음' : ''}</div></div><span class="chev"></span></div>`).join('')}</div></section>`;
  }
  function hotCard(cls) {
    const N = ((D.news && D.news.items) || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const un = N.filter((n) => !wHas('news:' + n.id)), n = un.find((x) => x.must) || un[0] || N[0];
    if (!n) return '';
    const rd = wHas('news:' + n.id);
    return `<section class="card ${cls} hot-card link" data-news="${esc(n.id)}"><div class="hot-ic">${ic('fire')}</div><div class="hot-b"><div class="eyebrow">핫뉴스${n.must ? ' · <b class="red">꼭 읽기</b>' : ''}</div><b class="hot-t">${esc(n.title)}</b><p class="tiny" style="margin:2px 0 0">${md(n.date)} · ${esc(n.scope || '')}${rd ? ' · 읽었어요' : WALLET && !DASH_ONLY ? ' · 읽으면 50원' : ''}</p></div></section>`;
  }
  function pomoCard(cls) {
    const n = pDay().n, g = pGoal(), st = pStreak(), r = P.run;
    return `<section class="card ${cls} pm-home link" data-pomo><div class="pm-h-ic">${ic('tomato')}</div>
      <div class="pm-h-b"><div class="eyebrow">토마토 타이머${st ? ` · ${ic('fire')} ${st}일 연속` : ''}</div><b class="pm-h-t">${r ? `${r.mode === 'break' ? '쉬는 중' : '집중하는 중'} <span class="num blue" data-pmt>${mmss(pLeft())}</span>` : sMin(today()) ? `오늘 공부 ${hm(sMin(today()))}` : n ? `오늘 토마토 ${n}개${n >= g ? ', 목표 달성!' : ''}` : '오늘 첫 토마토를 키워 봐요'}</b><p class="tiny" style="margin:2px 0 0">${esc(pLine())}</p></div>
      ${tomRow(n, g, 'sm')}${TEACHER ? '' : `<button class="btn primary" type="button" data-pomo>${r ? '타이머 보기' : '집중 시작'}</button>`}</section>`;
  }
  function studyCard() {
    const t = sMin(today()), all = sAll(), wk = sSum(wkStart(today())), mo = sSum(today().slice(0, 8) + '01'), nd = sDays().length, st = sStreak(), bd = sBestDay();
    const nx = S_GOALS.find((g) => g * 60 > all) || (Math.floor(all / 60000) + 1) * 1000, pv = [0, ...S_GOALS].filter((g) => g < nx).pop() || 0;
    const pct = Math.min(100, ((all / 60 - pv) / (nx - pv)) * 100);
    const days7 = Array.from({ length: 7 }, (_, i) => pBack(6 - i)), mx = Math.max(60, ...days7.map(sMin));
    const wd = (new Date().getDay() + 6) % 7, lw = sSum(pBack(wd + 7), pBack(wd + 1));
    const ed = UI.sDay || today(), ex = pomo().days[ed] || {}, cur = ex.man || 0;
    const fun = [[120, '영화 ', '편'], [150, '서울에서 부산까지 KTX ', '번'], [80, '수능 국어 시험 ', '번']].map(([u, a, b]) => (all >= u ? a + Math.floor(all / u) + b : '')).filter(Boolean).join(' · ');
    const sb = SBADGES.filter((b) => b.ok()).length, lbr = sBestRun();
    return `<section class="card c12 st-card"><div class="card-h"><h2>${ic('clock')} 공부 시간</h2>${st ? `<span class="tag red">${ic('fire')} ${st}일 연속 기록</span>` : '<span class="tag">오늘 첫 기록을 적어요</span>'}</div>
      <div class="st-top"><div><div class="eyebrow">오늘 공부한 시간</div><b class="st-big num">${t ? hm(t) : '아직 0분'}</b><p class="tiny" style="margin:4px 0 0">${t ? esc(sCheer(t)) : '내 타이머로 잰 시간을 숫자로만 적으면 돼요'}${t && bd === today() && nd > 1 ? ' · <b class="red">최고 기록!</b>' : ''}</p></div>
        <div class="st-in">${TEACHER ? '' : `<div class="chips">${[[today(), '오늘'], [pBack(1), '어제'], [pBack(2), '그저께']].map(([d, l]) => `<button class="chip sm ${ed === d ? 'on' : ''}" type="button" data-sday="${d}">${l}</button>`).join('')}</div>
          <div class="st-row"><label class="st-f"><input class="num" id="st-h" type="number" inputmode="numeric" min="0" max="20" value="${cur ? Math.floor(cur / 60) : ''}" placeholder="0" aria-label="시간"><span>시간</span></label><label class="st-f"><input class="num" id="st-m" type="number" inputmode="numeric" min="0" max="59" value="${cur ? cur % 60 : ''}" placeholder="0" aria-label="분"><span>분</span></label><button class="btn primary" id="st-save" type="button">${cur ? '고치기' : '적기'}</button></div>
          <p class="tiny" style="margin:0">${md(ed)} 하루 전체 시간을 적어요${ex.min ? ` · 토마토 ${ex.min}분보다 적으면 토마토 시간으로 쳐요` : ''}</p>`}</div></div>
      <div class="st-tiles"><div><span>이번 주</span><b class="num">${hm(wk)}</b>${lw ? `<em class="${wk >= lw ? 'green' : ''}">${wk >= lw ? `지난주보다 ${hm(wk - lw)} 더` : `지난주까지 ${hm(lw - wk)}`}</em>` : '<em>월요일부터 쌓여요</em>'}</div><div><span>이번 달</span><b class="num">${hm(mo)}</b><em>${nd ? `하루 평균 ${hm(all / nd)}` : '&nbsp;'}</em></div><div><span>지금까지 모두</span><b class="num blue">${hm(all)}</b><em>${nd}일 기록</em></div><div><span>최고 기록</span><b class="num">${bd ? hm(sMin(bd)) : '-'}</b><em>${bd ? md(bd) : '&nbsp;'}${lbr > 1 ? ` · 최장 ${lbr}일 연속` : ''}</em></div></div>
      <div class="st-goal"><div class="row between"><b>다음 목표: 누적 ${nx.toLocaleString()}시간</b><span class="tiny">${hm(nx * 60 - all)} 남았어요</span></div><div class="st-bar"><i style="width:${pct}%"></i></div>${fun ? `<p class="tiny" style="margin:8px 0 0">지금까지 공부한 시간이면 ${fun}이에요</p>` : ''}</div>
      <div class="st-chart">${days7.map((d) => { const m = sMin(d); return `<div class="st-col ${d === today() ? 'today' : ''} ${bd === d ? 'best' : ''}"><em class="num">${m ? (m >= 60 ? (m / 60).toFixed(1) + 'h' : m + 'm') : ''}</em><i style="height:${(m / mx) * 100}%"></i><span>${d === today() ? '오늘' : '일월화수목금토'[new Date(d + 'T00:00:00').getDay()]}</span></div>`; }).join('')}</div>
      <div class="card-h" style="margin-top:16px"><h2 style="font-size:16px">공부 시간 배지</h2><span class="tiny">${sb}/${SBADGES.length}개 모았어요</span></div>
      <div class="pm-badges">${SBADGES.map((b) => `<div class="pm-bd ${b.ok() ? 'on' : ''}">${ic(b.i)}<b>${b.t}</b><span>${b.ok() ? '획득!' : b.d}</span></div>`).join('')}</div></section>`;
  }
  function studySave() {
    const h = Math.max(0, Math.min(20, +($('#st-h') || {}).value || 0)), mi = Math.max(0, Math.min(59, +($('#st-m') || {}).value || 0)), m = h * 60 + mi;
    const d = UI.sDay || today(), po = pomo(), x = po.days[d] = po.days[d] || { n: 0, min: 0, subj: {} };
    const bdM = sBestDay() ? sMin(sBestDay()) : 0, had = SBADGES.filter((b) => b.ok()).map((b) => b.id), allB = sAll();
    if (m) x.man = m; else delete x.man;
    save('pomo'); render();
    if (!m) return toast('기록을 지웠어요');
    const nb = SBADGES.filter((b) => b.ok() && !had.includes(b.id)), crossed = S_GOALS.filter((g) => allB < g * 60 && sAll() >= g * 60).pop();
    const r = ($('.st-big') || document.body).getBoundingClientRect(); boom(r.left + r.width / 2, r.top + r.height / 2, m >= 300 ? 6 : 3); ding(m >= 300 ? 8 : 3); if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
    toast(sMin(d) > bdM && bdM ? `새 최고 기록! ${hm(sMin(d))}` : `${hm(sMin(d))} 적었어요 · ${sCheer(sMin(d))}`);
    const pops = [...(crossed ? [{ i: 'party', t: `누적 ${crossed.toLocaleString()}시간 돌파!`, d: `지금까지 모두 ${hm(sAll())} 공부했어요`, eb: '목표 달성!', w: 0, key: 'study:goal' + crossed }] : []), ...nb.map((b) => ({ ...b, w: 0, eb: '공부 시간 배지!', key: 'study:' + b.id }))];
    if (pops.length) setTimeout(() => badgePop(pops), 1200);
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
      <div class="grid">${studyCard()}${soundCards()}
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
    document.title = r ? `${r.paused ? '⏸' : r.mode === 'break' ? '☕' : '🍅'} ${mmss(left)} · ${BRAND}` : (U.tabStu ? `${U.who} · ${BRAND}` : BRAND);
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
    $$('[data-sday]').forEach((b) => (b.onclick = () => { UI.sDay = b.dataset.sday; render(); }));
    const sv = $('#st-save'); if (sv) sv.onclick = studySave;
    $$('#st-h, #st-m').forEach((i) => (i.onkeydown = (e) => { if (e.key === 'Enter') studySave(); }));
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
      <div class="pm-vol"><span class="tiny">작게</span><input type="range" min="0" max="100" value="${Math.round(AM.vol * 100)}" id="amb-vol" style="--p:${Math.round(AM.vol * 100)}%" aria-label="집중 소리 크기"><span class="tiny">크게</span></div>
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
  const wlIco = (why, bonus) => { const w = String(why); return /토마토/.test(w) ? 'tomato' : /연속/.test(w) ? 'fire' : /배지|최고 기록/.test(w) ? 'trophy' : /오답/.test(w) ? 'retry' : /문제 맞힘|맞힘/.test(w) ? 'hundred' : /소식/.test(w) ? 'news' : /진로/.test(w) ? 'dna' : /개념|교과서|읽기/.test(w) ? 'books' : /한 줄|학교/.test(w) ? 'write' : /숙제/.test(w) ? 'pin' : bonus ? 'gift' : 'sci'; };  // 모은 기록 줄 그림을 「이렇게 모아요」와 같게
  const won = (n) => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
  const dateOf = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const W = () => { const w = (S.wallet = S.wallet || {}); w.log = w.log || []; w.paid = w.paid || []; w.seen = w.seen || {}; if (w.req === undefined) w.req = null; return w; };
  const wHas = (key) => { if (!WALLET && String(key).startsWith('news:')) return !!(S.nr || {})[key.slice(5)]; const w = W(); return !!w.seen[key] || w.log.some((x) => x.key === key); };  // 용돈 없는 학생(과외)은 소식 읽음을 S.nr 에
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
    if (!WALLET) return 0;  // 용돈은 정윤만 (가족)
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
    if (ed) { if (uDone(ed)) give(`set:unit:${t}`, 200, '천일문 끝'); const wl = wordsFor(ed.words).length; if (wl && Object.keys(ed.wans || {}).length >= Math.min(10, wl)) give(`set:words:${t}`, 200, '단어 시험 끝'); if (g3Did(ed)) give(`set:g3:${t}`, 200, '고3 영어 끝'); }
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
  const readPill = (key, amt, why, sec = 8) => TEACHER || !WALLET ? '' : `<div class="rd-pill" data-rd="${esc(key)}" data-amt="${amt}" data-why="${esc(why)}" data-sec="${sec}">${ic('coin')}<span class="rd-t"></span><i class="rd-bar"><b></b></i></div>`;
  function startReads(root) {
    if (!root) return;
    $$('.rd-pill:not(.go):not(.nr-pill)', root).forEach((p) => {
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
        if (readProg[key] >= sec) { clearInterval(iv); const got = earn(key, amt, p.dataset.why, { from: p }); sheet.dirty = true; set(got ? 'done' : 'cap', got ? `+${won(got)} 받았어요 · ${p.dataset.why}` : '오늘 용돈은 다 모았어요, 내일 또 만나요', 1); if (got && !RM()) bump(p, 'tap-pop'); }
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
    if (!WALLET) return '';
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
    // 모은 기록: 하루씩 ‹ › 로 넘겨 보고, 날짜를 골라 바로 가요. 같은 이유는 한 줄로 묶어요 (10/28 선생님 «주르륵 말고»)
    const dayBlock = (d) => { const G = []; for (const x of by[d].slice().sort((a, b) => b.at - a.at)) { const g = G.find((y) => y.why === x.why && !!y.bonus === !!x.bonus); if (g) { g.n++; g.amt += x.amt; } else G.push({ why: x.why, bonus: x.bonus, amt: x.amt, n: 1 }); } const sum = G.reduce((a, x) => a + x.amt, 0);
      return `<div class="wl-day"><div class="wl-sum"><span>이날 모은 돈 <small>${G.reduce((a, x) => a + x.n, 0)}건</small></span><b class="num">+${won(sum)}</b></div><div class="list wl-items">${G.map((x) => `<div class="li" style="padding:8px 0"><div class="ico">${ic(wlIco(x.why, x.bonus))}</div><div class="body"><div class="t" style="font-size:15px">${esc(x.why)}</div>${x.n > 1 || x.bonus ? `<div class="d">${x.n > 1 ? `${x.n}번` : ''}${x.n > 1 && x.bonus ? ' · ' : ''}${x.bonus ? '보너스' : ''}</div>` : ''}</div><span class="num wl-plus">+${won(x.amt)}</span></div>`).join('')}</div></div>`; };
    // 날짜 고르기: 날짜를 누르면 아래에 달력이 열려요. 돈을 모은 날엔 금액이 보여요 (앱을 오래 써도 원하는 날로 바로 가게 10/28)
    const wd = UI.wlSel && UI.wlSel <= today() ? UI.wlSel : dates[0], wi = dates.indexOf(wd), older = dates.find((d) => d < wd), newer = [...dates].reverse().find((d) => d > wd);
    const wlCal = () => { const ym = UI.wlMon || wd.slice(0, 7), [y, m] = ym.split('-').map(Number), n = new Date(y, m, 0).getDate(), off = new Date(y, m - 1, 1).getDay(), cells = [];
      for (let k = 0; k < off; k++) cells.push('<span></span>');
      for (let k = 1; k <= n; k++) { const d = `${ym}-${String(k).padStart(2, '0')}`, L = by[d], amt = L ? L.reduce((a, x) => a + x.amt, 0) : 0, fut = d > today(); cells.push(`<button type="button" class="wc-d${L ? ' has' : ''}${d === wd ? ' on' : ''}${d === today() ? ' td' : ''}" data-wlday="${d}" ${fut ? 'disabled' : ''}><b>${k}</b>${L ? `<small>+${amt.toLocaleString('ko-KR')}</small>` : ''}</button>`); }
      const first = dates.length ? dates[dates.length - 1].slice(0, 7) : ym;
      return `<div class="wl-cal"><div class="wc-h"><button class="btn sm" type="button" data-wlmon="-1" ${ym <= first ? 'disabled' : ''} aria-label="전 달">‹</button><b>${y}년 ${m}월</b><button class="btn sm" type="button" data-wlmon="1" ${ym >= today().slice(0, 7) ? 'disabled' : ''} aria-label="다음 달">›</button></div><div class="wc-g">${'일월화수목금토'.split('').map((x) => `<i>${x}</i>`).join('')}${cells.join('')}</div></div>`; };
    const dayNav = dates.length ? `<div class="wl-nav"><button class="btn sm" type="button" data-wlgo="${older || ''}" ${older ? '' : 'disabled'} aria-label="전날">‹</button><button type="button" class="wl-pick${UI.wlCal ? ' open' : ''}" data-wlcal><b>${wd === today() ? '오늘' : md(wd) + ' ' + wdName(wd)}</b>${ic('cal')}</button><button class="btn sm" type="button" data-wlgo="${newer || ''}" ${newer ? '' : 'disabled'} aria-label="다음 날">›</button></div>${UI.wlCal ? wlCal() : ''}` : '';
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
      <section class="card c12"><div class="card-h"><h2>모은 기록</h2></div>
        ${dates.length ? dayNav + `<div class="wl-slide ${UI.wlDir > 0 ? 'from-r' : UI.wlDir < 0 ? 'from-l' : ''}">` + (by[wd] ? dayBlock(wd) : `<div class="empty" style="padding:24px 0"><b>${md(wd)}엔 모은 돈이 없어요</b></div>`) + '</div>' : `<div class="empty">${ic('coin')}<b>아직 모은 돈이 없어요</b><span>토마토 하나, 소식 하나부터 시작해요</span></div>`}</section>
      ${paidRows.length ? `<section class="card c12"><div class="card-h"><h2>진짜 돈으로 바꾼 기록</h2></div><div class="list">${paidRows.map((x) => `<div class="li" style="padding:8px 0"><div class="ico">${ic('cash')}</div><div class="body"><div class="t" style="font-size:15px">${won(x.amt)} 받았어요</div><div class="d">${md(dateOf(x.at))}${x.memo ? ' · ' + esc(x.memo) : ''}</div></div></div>`).join('')}</div></section>` : ''}
      </div></div>`;
  }
  document.addEventListener('click', (e) => { const g = e.target.closest('[data-wlgo], [data-wlday]'), c = e.target.closest('[data-wlcal]'), mo = e.target.closest('[data-wlmon]'); if (!g && !c && !mo) return;
    UI.wlDir = 0; if (g) { const d = g.dataset.wlgo || g.dataset.wlday; if (!d || g.disabled) return; UI.wlDir = d > (UI.wlSel || today()) ? 1 : -1; UI.wlSel = d; UI.wlMon = d.slice(0, 7); if (g.dataset.wlday) UI.wlCal = false; }
    else if (c) { UI.wlCal = !UI.wlCal; UI.wlMon = null; }
    else if (!mo.disabled) { const [y, m] = (UI.wlMon || (UI.wlSel || today()).slice(0, 7)).split('-').map(Number), t = new Date(y, m - 1 + +mo.dataset.wlmon, 1); UI.wlMon = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; }
    const y0 = scrollY; render(); scrollTo(0, y0); UI.wlDir = 0; });
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

  // ───────── 선생님: 학생 바꾸기 · 학생들 한눈에 · 진로 바뀜 알림 (2026-10-26 여러 학생) ─────────
  const ROSTER = D.students || [];
  // 말랑영어(초등)는 이름만 바꿔 달아요
  if (BRAND !== '말랑대학') { document.title = BRAND; $$('#brand span, #splash b').forEach((e) => (e.textContent = BRAND)); }
  function teacherBand() {
    const chips = ROSTER.length > 1 ? `<div class="tb-stu">${ROSTER.map((r) => `<button type="button" class="${r.name === U.who ? 'on' : ''}" data-stu="${esc(r.name)}">${esc(r.name)}${r.edition === 'english' ? ' <small>영어</small>' : ''}</button>`).join('')}</div>` : '';
    const rep = !TUTOR && ST.edition !== 'english' ? `<button class="btn sm primary" type="button" data-prep>${esc((ST.lesson && ST.lesson.parent) || '어머니')}께 공부 리포트</button>` : '';
    return `<div class="teacher-band"><span>선생님 보기 · ${esc(U.who)}의 기록을 보고 고칠 수 있어요</span>${rep}${chips}</div>`;
  }
  function switchStu(n) {
    if (n === U.who) return;
    clearTimeout(pushT); if (STU_TAB) { sync().finally(() => { try { sessionStorage.setItem('mu:who', n); } catch (e) {} location.reload(); }); return; }
    const go = () => { try { const k = 'mallang-univ:v1', cur = JSON.parse(localStorage.getItem(k)) || {}; cur.who = n; localStorage.setItem(k, JSON.stringify(cur)); localStorage.removeItem('mallang-univ:content'); } catch (e) {} location.reload(); };
    sync().finally(go);
  }
  // 학생들 기록을 선생님 코드로 읽어 와서 한눈에 (보기만, 저장 안 함)
  const roster = { at: 0, rows: null };
  function rosterLoad() {
    if (!TEACHER || ROSTER.length < 2 || Date.now() - roster.at < 60000) return;
    roster.at = Date.now();
    Promise.all(ROSTER.map((r) => rpc('univ_get', { p_student: r.name, p_code: U.key }).then((d) => ({ r, d })).catch(() => ({ r, d: null })))).then((rows) => { roster.rows = rows; if (DASH_ONLY && !UI.run) { const a = document.activeElement; if (a && a.matches && a.matches('#main input, #main textarea')) a.addEventListener('blur', () => render(), { once: true }); else render(); } });
  }
  function rosterCard() {
    rosterLoad(); if (ROSTER.length < 2) return '';
    const rows = roster.rows || ROSTER.map((r) => ({ r, d: undefined }));
    const ago = (t) => { if (!t) return '아직 안 들어왔어요'; const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${Math.max(1, m)}분 전` : m < 1440 ? `${Math.round(m / 60)}시간 전` : `${Math.round(m / 1440)}일 전`; };
    const row = ({ r, d }) => {
      const p = (d && d.profile) || {}, last = d && d._at ? Math.max(...Object.values(d._at)) : 0, u = uniOf(p.uni);
      const pick = [u ? u.short || u.name : '', p.major].filter(Boolean).join(' ');
      const fresh = p._careerAt && p._careerAt > (p._careerSeen || 0);
      return `<button type="button" class="li btnlike" data-stu="${esc(r.name)}"><div class="ico">${avatarFor(r.name)}</div><div class="body"><div class="t">${esc(r.name)} <span class="tag">${esc(r.level || '')}${r.edition === 'english' ? ' · 말랑영어' : ''}</span>${fresh ? ' <span class="tag red">진로 바꿈</span>' : ''}</div><div class="d">${d === undefined ? '불러오는 중' : ago(last)}${pick ? ' · 진로 ' + esc(pick) : ''}${r.alias ? ` · 로그인 코드 <b>${esc(r.alias)}</b>` : ''}</div></div><span class="chev"></span></button>`;
    };
    return `<section class="card c12 roster"><div class="card-h"><h2>${ic('trophy')} 우리 학생들</h2><span class="tiny">누르면 그 학생 화면으로 바뀌어요</span></div><div class="list">${rows.map(row).join('')}</div></section>`;
  }
  const avatarFor = (n) => `<span class="ro-av">${esc(n.slice(-2))}</span>`;
  // 학생이 목표 대학·학과를 바꾸면 표시 → 선생님 홈에 「진로 바꿈」. 맞춤 소식·탐구 주제는 선생님이 Claude에게 말해서 바꿔요
  function careerMark() {
    if (TEACHER || PEEK) return; const p = S.profile || {}, c = `${p.uni || ''}|${p.major || ''}`;
    if (p._career === undefined) { p._career = c; return; }
    if (p._career !== c) { p._career = c; p._careerAt = Date.now(); }
  }
  function careerCard() {
    const p = S.profile || {}; if (!TEACHER || !p._careerAt || p._careerAt <= (p._careerSeen || 0)) return '';
    const u = uniOf(p.uni), pick = [u ? u.name : '', p.major].filter(Boolean).join(' ');
    return `<section class="card c12 career-new"><div class="card-h"><h3>${ic('dna')} ${esc(NMI())}가 진로를 바꿨어요</h3><span class="tiny">${md(dateOf(p._careerAt))}</span></div><p style="margin:0 0 12px"><b>${esc(pick || '아직 안 정했어요')}</b>(으)로 정했어요. 진로 탭의 맞춤 소식·탐구 주제는 Claude에게 「${esc(NM())} 진로 ${esc(pick)}로 바뀜」이라고 말하면 바꿔 줘요</p><button class="btn sm soft" id="career-ok" type="button">확인했어요</button></section>`;
  }

  // ───────── 대학 탭 (과외 중학생 윤건·지원: 목표 대학·학과 고르기 · 우리 학년 입시 길 · 학과별 들으면 좋은 과목) ─────────
  // 고른 값은 S.profile.uni / field / major 에 저장하고 바꾸면 선생님 홈에 「진로를 바꿨어요」가 떠요(careerCard)
  const UT_FIELD = [
    ['인문', ['국어국문학과', '영어영문학과', '사학과', '철학과', '심리학과', '문헌정보학과'], '국어·영어 위주로, 역사·윤리 같은 사회 과목과 제2외국어'],
    ['사회', ['경영학과', '경제학과', '정치외교학과', '행정학과', '미디어커뮤니케이션학과', '사회학과'], '경제·정치·사회와 문화 같은 사회 과목, 경영·경제는 확률과 통계나 미적분'],
    ['교육', ['교육학과', '초등교육과', '영어교육과', '수학교육과', '유아교육과'], '가르치고 싶은 과목을 깊게, 교육학 관련 과목'],
    ['공학', ['컴퓨터공학과', '전기전자공학부', '기계공학부', '화학공학과', '건축학과', '산업공학과'], '미적분·기하 같은 수학과 물리학·화학, 컴퓨터는 정보'],
    ['자연', ['생명과학과', '화학과', '수학과', '물리학과', '통계학과', '지구환경과학과'], '수학을 깊게, 가고 싶은 과의 과학 과목(생명과학·화학·물리학·지구과학)'],
    ['의약', ['의예과', '약학과', '간호학과', '치의예과', '수의예과', '생명공학과'], '화학·생명과학과 미적분, 수학·과학을 고르게'],
    ['예체능', ['디자인학과', '체육교육과', '실용음악과', '미술학과', '연극영화과'], '실기 준비와 함께 미술·음악·체육 관련 과목'],
  ];
  const utRoad = () => {
    // 고등학생(정윤 고1)은 지금 학년부터. 예전엔 중학생 기준만 있어 정윤 화면이 2028년 중3으로 나왔어요 (10/27)
    const lv = String(ST.level || ''), hs = /^고/.test(lv) || (!lv && !TUTOR), g = +(lv.replace(/\D/g, '') || ST.grade || S.profile.grade || (hs ? 1 : 3));
    const y1 = new Date().getFullYear() + (hs ? 1 - g : 4 - g), entry = y1 + 3, now = (y, t) => (y === new Date().getFullYear() ? `지금 · ${t}` : `${y}년 · ${t}`);
    return { y1, entry, steps: [
      ...(hs ? [] : [[g === 3 ? '지금 · 중3' : `${y1 - 1}년 · 중3`, '고등학교 고르기', '특목고·자사고는 일반고보다 먼저 원서를 내요. 2학기 성적까지 들어가요']]),
      [hs && g === 1 ? now(y1, '고1') : `${y1}년 · 고1`, '공통과목 내신', '국어·수학·영어·한국사·통합사회·통합과학을 모두 같이 배워요. 내신은 5등급이에요'],
      [`${y1 + 1}~${y1 + 2}년 · 고2·고3`, '내가 고른 과목', '고교학점제라 가고 싶은 학과에 맞춰 과목을 골라 들어요. 고른 과목이 생기부에 남아요'],
      [`${y1 + 2}년 9월 · 고3`, '수시 원서 6장', '내신·생기부로 가는 길이에요. 학생부교과·학생부종합이 많아요'],
      [`${y1 + 2}년 11월 · 고3`, '수능, 정시 원서 3장', `${entry}학년도 수능이에요. 수능 점수로 가는 길이에요`],
    ] };
  };
  function uniTabView() {
    const p = S.profile, u = uniOf(p.uni), fd = UT_FIELD.find((f) => f[0] === p.field), R = utRoad();
    const regs = [...new Set(UNIS.map((x) => x.region || '기타'))], reg = UI.utReg || (u && u.region) || '서울';
    const news = newsLike([u && u.name, u && u.short, p.major, '대입', '고교학점제', '수능']).slice(0, 5);
    return `<h1 class="h1">대학</h1><p class="sub">가고 싶은 대학과 학과를 눌러서 골라 두면, 맞는 과목과 소식이 나와요</p>
    <div class="grid">
      <section class="card c12 ut-goal"><div class="ut-me">${emb(u, 'lg')}<div><div class="eyebrow">내 목표</div><b>${u ? esc(u.name) : '대학을 아직 안 골랐어요'}</b><span>${p.major ? esc(p.major) : p.field ? esc(p.field) + ' 계열' : '학과도 아래에서 골라요'}</span></div></div></section>
      <section class="card c12"><div class="card-h"><h2>${ic('school')} 대학 고르기</h2><span class="tiny">누르면 목표가 돼요</span></div>
        <div class="chips" id="ut-reg">${regs.map((r) => `<button class="chip sm ${r === reg ? 'on' : ''}" type="button" data-utr="${esc(r)}">${esc(r)}</button>`).join('')}</div>
        <div class="uni-grid ut-unis">${UNIS.filter((x) => (x.region || '기타') === reg).map((x) => `<button type="button" class="${x.id === p.uni ? 'on' : ''}" data-utu="${esc(x.id)}">${emb(x, 'md')}<span>${esc(x.short || x.name)}</span></button>`).join('')}</div></section>
      <section class="card c12"><div class="card-h"><h2>${ic('dna')} 학과 고르기</h2></div>
        <div class="chips">${UT_FIELD.map((f) => `<button class="chip sm ${f[0] === p.field ? 'on' : ''}" type="button" data-utf="${esc(f[0])}">${esc(f[0])}</button>`).join('')}</div>
        ${fd ? `<div class="chips ut-major">${fd[1].map((m) => `<button class="chip sm ${m === p.major ? 'on' : ''}" type="button" data-utm="${esc(m)}">${esc(m)}</button>`).join('')}</div>
        <div class="ut-tip">${ic('bulb')}<div><b>${esc(fd[0])} 계열은 고등학교에서 이런 과목을 들으면 좋아요</b><span>${esc(fd[2])}. 대학마다 권하는 과목이 조금씩 달라서 고1 때 목표 대학 안내를 같이 봐요</span></div></div>` : '<p class="tiny" style="margin:12px 0 0">계열을 누르면 학과가 나와요</p>'}</section>
      <section class="card c12"><div class="card-h"><h2>${ic('cal')} ${esc(NMI())}의 입시 길</h2><span class="tag blue">${R.entry}학년도</span></div>
        <div class="ut-road">${R.steps.map(([w, t, d]) => `<div class="ut-st"><i></i><div><span>${esc(w)}</span><b>${esc(t)}</b><p>${esc(d)}</p></div></div>`).join('')}</div>
        <p class="tiny" style="margin:12px 0 0">2028학년도부터 바뀐 대입 제도(통합형 수능·내신 5등급) 기준이에요. 바뀌면 소식 탭에 올라와요</p></section>
      ${news.length ? `<section class="card c12"><div class="card-h"><h2>${ic('news')} 관련 소식</h2></div><div class="list">${news.map((n) => `<div class="li btnlike" data-news="${esc(n.id)}"><div class="ico">${n.uni && uniOf(n.uni) ? emb(uniOf(n.uni), 'sm') : ic('news')}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${md(n.date)} · ${esc(n.scope || '')}</div></div><span class="chev"></span></div>`).join('')}</div></section>` : ''}
    </div>`;
  }
  function bindUniTab() {
    const p = S.profile, set = (k, v) => { p[k] = v; p._careerAt = Date.now(); save('profile'); render(); };
    $$('[data-utr]').forEach((b) => (b.onclick = () => { UI.utReg = b.dataset.utr; render(); }));
    $$('[data-utu]').forEach((b) => (b.onclick = () => set('uni', p.uni === b.dataset.utu ? '' : b.dataset.utu)));
    $$('[data-utf]').forEach((b) => (b.onclick = () => { if (p.field !== b.dataset.utf) p.major = ''; set('field', b.dataset.utf); }));
    $$('[data-utm]').forEach((b) => (b.onclick = () => set('major', p.major === b.dataset.utm ? '' : b.dataset.utm)));
    $$('main [data-news]').forEach((b) => (b.onclick = () => newsSheet(b.dataset.news)));
  }

  // ───────── 말랑영어 그래머: Grammar Stage Plus 2 (말랑 내신 주아 화면에서 옮김) ─────────
  // 과마다 배우기(2) 25 · 실전(3) 20 · 책 덮고(4) 6. 기록 S.jg['u12:13'] = { ok, v, at }
  const JG = ((D.jua || {}).units || []).slice().sort((a, b) => a.no - b.no);
  const JG_STEP = { 2: '배우기', 3: '실전', 4: '책 덮고' };
  const jgNorm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/won't/g, 'will not').replace(/isn't/g, 'is not').replace(/aren't/g, 'are not').replace(/\bi'm\b/g, 'i am').replace(/'ll\b/g, ' will').replace(/didn't/g, 'did not').replace(/doesn't/g, 'does not').replace(/don't/g, 'do not').replace(/can't/g, 'cannot').replace(/wasn't/g, 'was not').replace(/weren't/g, 'were not').replace(/[.?!,]/g, '').replace(/\s+/g, ' ').trim();
  const jgU = (no) => JG.find((u) => +u.no === +no);
  const jgSec = (q) => String(q.section || '').split(' ')[0];
  const jgQs = (u, step, secs) => (u ? u.questions : []).filter((q) => q.step === +step && (!secs || !secs.length || secs.includes(jgSec(q))));
  const jgRec = (u, q) => (S.jg || {})['u' + u.no + ':' + q.id];
  const jgOk = (q, v) => (q.answers || []).some((a) => jgNorm(a) === jgNorm(v));
  // 숙제 조각: 섹션을 순서대로 모아 10문제 안팎 · 책 덮고는 한 번에
  function jgChunks(no, steps) {
    const u = jgU(no), out = []; if (!u) return out;
    for (const st of steps) {
      if (+st === 4) { const n = jgQs(u, 4).length; if (n) out.push({ unit: u.no, step: 4, secs: [], n }); continue; }
      let cur = null;
      for (const sec of [...new Set(jgQs(u, st).map(jgSec))]) { const n = jgQs(u, st, [sec]).length; if (!cur || cur.n >= 8) out.push((cur = { unit: u.no, step: +st, secs: [], n: 0 })); cur.secs.push(sec); cur.n += n; }
    }
    return out;
  }
  function jgTasks(L, nx) {
    const ch = (L.gram || []).flatMap((g) => jgChunks(g.unit, g.steps || [2, 3, 4])); if (!ch.length) return [];
    const end = nx && nx.date > L.date ? nx.date : addD(L.date, 7);
    let nd = 0; while (addD(L.date, nd + 1) < end) nd++; nd = Math.max(1, nd);
    const t = today();
    return ch.map((c, i) => {
      const day = addD(L.date, 1 + Math.floor((i * nd) / ch.length)), u = jgU(c.unit), qs = jgQs(u, c.step, c.secs), n = qs.filter((q) => jgRec(u, q)).length, ok = qs.filter((q) => (jgRec(u, q) || {}).ok).length, done = n >= qs.length;
      return { k: `jg:${c.unit}:${c.step}:${c.secs.join('')}`, icon: 'pencil', day, t: `Unit ${c.unit} ${JG_STEP[c.step]}${c.secs.length ? ' ' + c.secs.join('·') : ''} (${qs.length}문제)`, d: done ? `${ok}/${qs.length} 맞힘` : `${day < t ? md(day) + ' 숙제 · 아직 안 했어요' : md(day) + ' 숙제'}${n ? ` · ${n}개 풀었어요` : ''}`, done };
    }).filter((x) => x.day <= t && (!x.done || x.day === t));
  }
  function gramRun() {
    const r = UI.run, u = jgU(r.unit);
    if (!u) return `<div class="card empty">${ic('books')}<b>그래머 자료를 넣는 중이에요</b></div>`;
    const step = +r.step || 2, qs = jgQs(u, step, r.secs), left = qs.findIndex((q) => !jgRec(u, q)), cur = r.show != null ? r.show : left;
    r.show = cur;
    const head = `<div class="row between"><button class="btn sm" data-go="hw" type="button">‹ 숙제</button><span class="tiny">📗 Grammar Stage Plus 2</span></div>
      <h1 class="h1" style="margin-top:12px">Unit ${esc(u.no)} · ${esc(u.title)}</h1>
      <div class="seg" style="margin:12px 0 16px">${[2, 3, 4].map((s) => `<button type="button" class="${s === step ? 'on' : ''}" data-jgs="${s}">${JG_STEP[s]}</button>`).join('')}</div>
      ${r.secs && r.secs.length ? `<div class="jg-only"><span>📌 오늘 숙제는 ${esc(r.secs.join('·'))}만</span><button class="btn sm" data-jgall type="button">전체 보기</button></div>` : ''}`;
    const lesson = (u.lessons || {})[step] ? `<div class="jgl">${step === 2 ? u.lessons[step] : `<div class="card"><p style="margin:0">${u.lessons[step]}</p></div>`}</div>` : '';
    if (cur < 0) {
      const ok = qs.filter((q) => (jgRec(u, q) || {}).ok).length;
      const nx = TUTOR ? tutorTasks().find((t) => !t.done) : null;
      return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}${doneCard(ok, qs.length, ok === qs.length ? '다 맞혔어요! 최고예요' : '틀린 문제는 오답 노트에서 다시 풀어요', `${nx ? `<button class="btn primary big block" data-task="${esc(nx.k)}" type="button">다음: ${esc(nx.t)}</button>` : ''}<button class="btn big block" data-jgre type="button">처음부터 다시 보기</button><button class="btn big block" data-go="hw" type="button">숙제로</button>`)}</div>`;
    }
    const q = qs[cur], a = jgRec(u, q);
    const box = q.choices ? `<div class="jg-ops">${q.choices.map((c, j) => `<button type="button" class="chip jg-op ${a && jgNorm(a.v) === jgNorm(c) ? (a.ok ? 'right' : 'wrong') : ''}" data-jo="${j}" ${a ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>` : `<div class="row" style="gap:8px"><input class="inp" id="jg-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="답을 써요" value="${a ? esc(a.v) : ''}" ${a ? 'disabled' : ''}>${a ? '' : '<button class="btn primary" id="jg-ok" type="button">확인</button>'}</div>`;
    return `<div class="qwrap" style="max-width:760px;margin:0 auto">${head}${!qs.some((x) => jgRec(u, x)) ? lesson : ''}
      <div class="row between" style="margin-bottom:8px"><span class="tiny">${qs.filter((x) => jgRec(u, x)).length} / ${qs.length} 풀었어요</span><button class="btn sm ${r.omr ? 'soft' : ''}" data-jgomr type="button" aria-expanded="${!!r.omr}">${r.omr ? '접기' : '전체 문제 보기'}</button></div>
      ${r.omr ? `<div class="card nx-omr"><div class="nb-g">${qs.map((x, k) => { const z = jgRec(u, x); return `<button class="nb ${z ? (z.ok ? 'ok' : 'no') : ''} ${k === cur ? 'cur' : ''}" data-jgj="${k}" type="button">${k + 1}</button>`; }).join('')}</div></div>` : ''}
      <div class="progress-dots">${qs.map((x, k) => { const z = jgRec(u, x); return `<i class="${z ? (z.ok ? 'ok' : 'no') : k === cur ? 'cur' : ''}"></i>`; }).join('')}</div>
      <div class="card"><div class="q-no">${cur + 1} / ${qs.length} <span class="tag">${esc(q.section || '')}</span></div><div class="q-text jg-q">${q.prompt}</div>${box}</div>
      ${a ? `${verdict(a.ok)}${a.ok ? '' : `<div class="explain"><b>정답</b> ${esc(q.answers[0])}</div>`}${q.why ? `<div class="explain"><b>해설</b> ${esc(q.why)}</div>` : ''}<div class="cta-bar jg-cta"><button class="btn primary big block" id="next" type="button">${qs.some((x) => !jgRec(u, x)) ? '다음 문제' : '결과 보기'}</button></div>` : ''}
      ${qs.some((x) => jgRec(u, x)) && lesson ? `<details class="jg-again"><summary>설명 다시 보기</summary>${lesson}</details>` : ''}</div>`;
  }
  function bindGram() {
    const r = UI.run, u = jgU(r.unit); if (!u) return;
    $$('[data-jgs]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'gram', unit: r.unit, step: +b.dataset.jgs }; render(); window.scrollTo(0, 0); }));
    const al = $('[data-jgall]'); if (al) al.onclick = () => { UI.run = { kind: 'gram', unit: r.unit, step: r.step }; render(); };
    const re = $('[data-jgre]'); if (re) re.onclick = () => { S.jg = S.jg || {}; for (const q of jgQs(u, r.step, r.secs)) delete S.jg['u' + u.no + ':' + q.id]; save('jg'); UI.run = { ...r, show: null }; render(); window.scrollTo(0, 0); };
    const qs = jgQs(u, r.step, r.secs), q = qs[r.show]; if (!q) return;
    const mark = (v, el) => {
      if (!String(v).trim()) return; const ok = jgOk(q, v), id = `jg:u${u.no}:${q.id}`;
      S.jg = S.jg || {}; S.jg['u' + u.no + ':' + q.id] = { ok, v: String(v).trim(), at: Date.now() };
      if (ok) { gotIt(id); clearWrong(id); UI.jgRun = (UI.jgRun || 0) + 1; ding(UI.jgRun); if (el) { const b = el.getBoundingClientRect(); boom(b.left + b.width / 2, b.top, UI.jgRun >= 5 ? 2 : 1); } }
      else { UI.jgRun = 0; addWrong(id, { src: 'jg', subj: 'eng', subjName: '영어', area: `Grammar Unit ${u.no}`, sub: q.section, title: String(q.prompt).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60), ref: { u: u.no, id: q.id } }); }
      save('jg'); render(); jgCheer(u, r);
    };
    $$('[data-jo]').forEach((b) => (b.onclick = () => mark(q.choices[+b.dataset.jo], b)));
    const inp = $('#jg-in'), okb = $('#jg-ok');
    if (inp && okb) { okb.onclick = () => mark(inp.value, okb); inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); mark(inp.value, okb); } }; setTimeout(() => inp.focus({ preventScroll: true }), 50); }
    // 이전 문제로 돌아가 보고, 다음은 이미 푼 문제면 차례대로 · 아니면 안 푼 첫 문제로 (10/27 선생님 «이전 문제가 없어»)
    const n = $('#next'); if (n) n.onclick = () => { const k = r.show + 1; UI.run = { ...r, show: k < qs.length && jgRec(u, qs[k]) ? k : qs.findIndex((x) => !jgRec(u, x)) }; render(); window.scrollTo(0, 0); };
    const om = $('[data-jgomr]'); if (om) om.onclick = () => { UI.run = { ...r, omr: !r.omr }; render(); };
    $$('[data-jgj]').forEach((b) => (b.onclick = () => { UI.run = { ...r, show: +b.dataset.jgj }; render(); }));  // 번호를 눌러 아무 문제로나 (10/27 선생님)
  }
  // 그래머 축하 (선생님 10/27 «주아가 그래머 다 풀면 아주 큰 뱃지랑 동기부여 팡팡»)
  // 숙제 한 조각 끝 → 팡팡 · 한 단계(배우기·실전·책 덮고) 끝 → 배지 · 한 과 전부 끝 → 「Unit 마스터」 아주 크게. 한 번만 (S.jgb)
  function jgCheer(u, r) {
    const all = (k) => { const qs = jgQs(u, k); return !qs.length || qs.every((q) => jgRec(u, q)); }, okN = (qs) => qs.filter((q) => (jgRec(u, q) || {}).ok).length;
    const B = (S.jgb = S.jgb || {}), step = +r.step || 2, nm = NM() + (jongOf(NM()) ? '아' : '야');
    if ([2, 3, 4].every(all) && !B['u' + u.no]) {
      const qs = [2, 3, 4].flatMap((k) => jgQs(u, k)); B['u' + u.no] = Date.now(); save('jgb');
      return setTimeout(() => badgePop([{ id: 'jgu' + u.no, key: 'jgu:' + u.no, w: 0, i: 'trophy', mega: 1, eb: '🏆 그래머 마스터', t: `Unit ${u.no} 완전 정복!`, d: `${nm}, 배우기·실전·책 덮고 ${qs.length}문제를 끝까지 다 해냈어! ${okN(qs)}개 맞혔어요. 진짜 대단해, 선생님이 제일 자랑스러워할 거야`, medals: [2, 3, 4].map((k) => JG_STEP[k]) }]), 500);
    }
    if (all(step) && !B[`u${u.no}:${step}`]) {
      const qs = jgQs(u, step); B[`u${u.no}:${step}`] = Date.now(); save('jgb');
      const left = [2, 3, 4].filter((k) => !all(k)).map((k) => JG_STEP[k]);
      return setTimeout(() => badgePop([{ id: `jgs${u.no}-${step}`, key: `jgs:${u.no}:${step}`, w: 0, i: step === 4 ? 'crown' : step === 3 ? 'medal' : 'star', eb: '🎉 배지 획득!', t: `Unit ${u.no} ${JG_STEP[step]} 완주!`, d: `${qs.length}문제 중 ${okN(qs)}개 맞혔어요. ${left.length ? `이제 ${left.join('·')}만 하면 「Unit ${u.no} 마스터」 배지예요!` : ''}` }]), 500);
    }
    if (r.secs && r.secs.length) { const qs = jgQs(u, step, r.secs), k = `u${u.no}:${step}:${r.secs.join('')}`; if (qs.every((q) => jgRec(u, q)) && !B[k]) { B[k] = Date.now(); save('jgb'); setTimeout(() => { boom(innerWidth / 2, innerHeight * 0.4, 4); ding(8); toast(`숙제 하나 끝! ${okN(qs)}/${qs.length} 맞혔어요 🎉`); }, 300); } }
  }
  function gramLib() {
    if (!JG.length) return '';
    const row = (u) => {
      const st = [2, 3, 4].map((k) => { const qs = jgQs(u, k); return { k, all: qs.length, n: qs.filter((q) => jgRec(u, q)).length }; }).filter((x) => x.all);
      const nx = st.find((x) => x.n < x.all), [en, ...ko] = String(u.title).split(' · '), done = !nx, began = st.some((x) => x.n);
      return `<button class="jgu ${done ? 'done' : ''}" data-jgo="${u.no}|${(nx || st[0] || { k: 2 }).k}" type="button"><span class="jgu-no">${esc(u.no)}</span><span class="jgu-b"><b>${esc(ko.join(' · ') || en)}</b><small>${esc(ko.length ? en : '')}</small><span class="jgu-bar">${st.map((x) => `<span><i style="width:${Math.round((x.n / x.all) * 100)}%"></i><em>${JG_STEP[x.k]}</em></span>`).join('')}</span></span><span class="jgu-r">${done ? '<span class="tag blue">다 했어요</span>' : began ? '<span class="tag">이어 하기</span>' : ''}<i class="chev"></i></span></button>`;
    };
    const fin = JG.filter((u) => [2, 3, 4].every((k) => { const qs = jgQs(u, k); return qs.every((q) => jgRec(u, q)); })).length;
    return `<section class="card c12"><div class="card-h"><h2>Grammar Stage Plus 2</h2><span class="tiny">${fin} / ${JG.length}과 끝냈어요</span></div><div class="jgu-l">${JG.slice().reverse().map(row).join('')}</div></section>`;
  }

  // ───────── 말랑영어 Listening · Reading · Writing (말랑 내신 주아 화면 jua.js 에서 옮김) ─────────
  // 기록 S.jl 리스닝 · S.jr 리딩 · S.jw 라이팅 = { 키: { at, ok, p, first, text } }. 체크를 풀면 { off:1, at } 로 남겨 다른 기기 기록이 되살리지 않게 해요
  const JUA = D.jua || {};
  const jNum = (v) => parseInt(String(v).replace(/\D/g, ''), 10) || 0;
  const JL = (JUA.listening || []).slice().sort((a, b) => a.unit - b.unit);
  const JR = (JUA.reading || []).filter((u) => (u.sentences || []).length).sort((a, b) => a.unit - b.unit);  // 책 사진으로 만든 유닛만 (u2·u11)
  const JW = (JUA.writing || []).slice().sort((a, b) => jNum(a.id) - jNum(b.id));
  const jGet = (k, id) => { const r = (S[k] || {})[id]; return r && !r.off ? r : null; };
  const jSet = (k, id, v) => { (S[k] = S[k] || {})[id] = { ...(v || {}), at: Date.now() }; save(k); };
  const jDel = (k, id) => { if ((S[k] || {})[id]) { S[k][id] = { off: 1, at: Date.now() }; save(k); } };
  const jSeed = (arr, seed) => { let h = 7; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const jFx = (ok, el) => { if (!ok) { UI.jRun = 0; return; } UI.jRun = (UI.jRun || 0) + 1; ding(UI.jRun); if (el) { const b = el.getBoundingClientRect(); boom(b.left + b.width / 2, b.top, UI.jRun >= 5 ? 2 : 1); } };
  const jKeep = () => { const y = scrollY; render(); window.scrollTo(0, y); };  // 보던 자리 그대로 다시 그림
  const jSay = (t) => { try { speechSynthesis.cancel(); const x = new SpeechSynthesisUtterance(t); x.lang = 'en-US'; x.rate = 0.85; speechSynthesis.speak(x); } catch (e) {} };
  const jCut = (s, n = 38) => (s.length > n ? s.slice(0, n) + '…' : s);
  const jEmpty = (t) => `<div class="qwrap" style="max-width:760px;margin:0 auto"><div class="row between"><button class="btn sm" data-go="hw" type="button">‹ 숙제</button></div><div class="card empty" style="margin-top:12px">${ic('books')}<b>${esc(t)}</b></div></div>`;
  function jHead(book, title, sub, modes, cur, attr) {
    return `<div class="row between"><button class="btn sm" data-go="hw" type="button">‹ 숙제</button><span class="tiny">${esc(book)}</span></div>
      <h1 class="h1" style="margin-top:12px">${esc(title)}</h1>${sub ? `<p class="eyebrow" style="margin:0">${esc(sub)}</p>` : ''}
      <div class="seg" style="margin:16px 0">${modes.map(([k, nm, tl]) => `<button type="button" class="${k === cur ? 'on' : ''}" ${attr}="${k}">${esc(nm)}${tl ? ` <small class="j-tl">${tl}</small>` : ''}</button>`).join('')}</div>`;
  }
  // 타일: 그래머(gramLib)와 같은 모양 · 유닛 번호 · 제목 · 단계별 진행 막대
  function jTile(attr, go, no, title, sub, st) {
    const nx = st.find((x) => x.n < x.all), done = !nx, began = st.some((x) => x.n);
    return `<button class="jgu ${done ? 'done' : ''}" ${attr}="${esc(go)}|${(nx || st[0]).k}" type="button"><span class="jgu-no">${esc(no)}</span><span class="jgu-b"><b>${esc(title)}</b><small>${esc(sub || '')}</small><span class="jgu-bar n${st.length}">${st.map((x) => `<span><i style="width:${x.all ? Math.round((Math.min(x.n, x.all) / x.all) * 100) : 0}%"></i><em>${esc(x.nm)}</em></span>`).join('')}</span></span><span class="jgu-r">${done ? '<span class="tag blue">다 했어요</span>' : began ? '<span class="tag">이어 하기</span>' : ''}<i class="chev"></i></span></button>`;
  }

  // ── 🎧 Listening Live 2: 통째로 듣기는 어려워서 단어 → 한 문장씩 듣기 → 교과서 문제 → 받아쓰기(고르기)
  const JL_M = { words: '단어', lines: '한 문장씩 듣기', quiz: '교과서 문제', dict: '받아쓰기' };
  const JL_S = { words: '단어', lines: '따라 듣기', quiz: '문제', dict: '받아쓰기' };
  const jlU = (no) => JL.find((u) => +u.unit === +no);
  // 숙제(only)로 열면 그 쪽 하나와 그 쪽에 나오는 단어만 보여요 (주아 51쪽 숙제 10/26)
  const jlPgWords = (u, T) => { const tx = T.lines.map((l) => l.en.toLowerCase()).join(' '); return (u.words || []).filter(([en]) => tx.includes(en.toLowerCase()) || tx.includes(en.toLowerCase().replace(/s$/, ''))); };
  const jlV = (r) => { const u = jlU(r.unit); if (!u || !r.only) return u; const T = u.tracks[Math.max(0, Math.min(r.t || 0, u.tracks.length - 1))]; return { ...u, words: jlPgWords(u, T), tracks: [T] }; };
  const jlQOk = (q) => q && q.ans && (q.ops || []).length && !('pic' in q && !(q.pic && String(q.pic).length));  // 그림 정답이 빈 문항은 빼요
  const jlK = (u, t, x, i) => `${u.unit}:${t.id}:${x}${i}`;
  function jlTally(u, m) {
    let a = 0, b = 0;
    if (m === 'words') { for (const w of u.words || []) { b++; if (jGet('jl', `${u.unit}:w:${w[0]}`)) a++; } return [a, b]; }
    for (const t of u.tracks || []) {
      if (m === 'lines') t.lines.forEach((_, i) => { b++; if (jGet('jl', jlK(u, t, 'l', i))) a++; });
      else if (m === 'quiz') (t.qs || []).forEach((q, i) => { if (!jlQOk(q)) return; b++; if (jGet('jl', jlK(u, t, 'q', i))) a++; });
      else t.lines.forEach((l, i) => { if (!l.key) return; b++; if (jGet('jl', jlK(u, t, 'd', i))) a++; });
    }
    return [a, b];
  }
  var jlAud = null, jlT = null;  // var: render 가 먼저 불려도 괜찮게
  function jlStop() { clearTimeout(jlT); if (jlAud) jlAud.pause(); $$('.jl-play.on').forEach((b) => b.classList.remove('on')); }
  function jlPlay(url, s, e, btn) {  // 한 문장만: s초부터 e초까지 (e 가 없으면 끝까지)
    jlStop(); if (!jlAud) { jlAud = new Audio(); jlAud.preload = 'auto'; }
    if (jlAud.dataset.u !== url) { jlAud.src = url; jlAud.dataset.u = url; }
    const rate = UI.jlSlow ? 0.8 : 1; jlAud.playbackRate = rate;
    const play = () => { jlAud.currentTime = Math.max(0, s - 0.15); jlAud.play().catch(() => {}); if (btn) btn.classList.add('on'); if (e) jlT = setTimeout(jlStop, ((e - s + 0.45) * 1000) / rate); };
    if (jlAud.readyState >= 1) play(); else jlAud.addEventListener('loadedmetadata', play, { once: true });
  }
  function jlRun() {
    const r = UI.run, u = jlV(r); if (!u) return jEmpty('리스닝 자료를 넣는 중이에요');
    const m = JL_M[r.m] ? r.m : 'words', ti = r.only ? 0 : Math.max(0, Math.min(r.t || 0, u.tracks.length - 1)), T = u.tracks[ti], K = (x, i) => jlK(u, T, x, i);
    let h = jHead('🎧 ' + u.book, `Unit ${u.unit} · ${u.title}`, u.pages, Object.entries(JL_M).filter(([k]) => !r.only || k !== 'dict').map(([k, nm]) => { const [a, b] = jlTally(u, k); return [k, nm, b ? `${a}/${b}` : '']; }), m, 'data-jlm');
    if (r.only) h += `<div class="jg-only"><span>📌 오늘 숙제는 ${esc(u.tracks[0].page)}쪽만 · 단어 ${u.words.length}개 → 한 문장씩 듣기 → 교과서 문제</span><button class="btn sm" data-jlwide type="button">전체 보기</button></div>`;
    const tracks = `<div class="row wrap j-chips">${u.tracks.map((t, i) => `<button class="chip sm ${i === ti ? 'on' : ''}" data-jlt="${i}" type="button">${esc(t.page)}쪽 ${esc(t.title)}</button>`).join('')}<button class="chip sm ${UI.jlSlow ? 'on' : ''}" data-jlslow type="button">천천히 듣기</button></div>`;
    const all = `<button class="btn sm soft jl-play" data-jlall type="button">▶ 전체 듣기</button>`;
    if (m === 'words') {
      h += `<section class="card"><div class="card-h"><h3>단어 ${u.words.length}개</h3><div class="seg j-seg"><button type="button" class="${UI.jlHide ? '' : 'on'}" data-jlhide="0">뜻 보기</button><button type="button" class="${UI.jlHide ? 'on' : ''}" data-jlhide="1">뜻 가리기</button></div></div>
        <p class="tiny j-help">단어를 누르면 소리가 나요. 뜻을 떠올려 보고 알면 오른쪽을 체크해요</p>
        <div class="j-list">${u.words.map(([en, ko, em]) => { const on = jGet('jl', `${u.unit}:w:${en}`); return `<div class="j-row ${on ? 'ok' : ''}"><button class="j-say" data-jsay="${esc(en)}" type="button">${em ? `<span class="j-em">${em}</span>` : ''}<b>${esc(en)}</b><span class="j-spk" aria-hidden="true">🔊</span></button><span class="j-ko ${UI.jlHide && !on ? 'hid' : ''}" data-jrev>${esc(ko)}</span><button class="tk j-tk ${on ? 'on' : ''}" data-jlknow="${esc(en)}" type="button"><span>알아요</span><i></i></button></div>`; }).join('')}</div></section>`;
      if (!r.only && (u.pic || []).filter((x) => x && x[1]).length) h += `<section class="card" style="margin-top:16px"><div class="card-h"><h3>그림 맞추기 정답</h3><span class="tiny">${esc(u.tracks[0].page)}쪽</span></div><div class="row wrap">${u.pic.filter((x) => x && x[1]).map(([a, w]) => `<span class="tag"><b>${esc(a)}</b>&nbsp;${esc(w)}</span>`).join('')}</div></section>`;
    } else if (m === 'lines') {
      const sh = UI.jlShow || 'both';
      h += tracks + `<section class="card"><div class="card-h"><h3>${esc(T.title)} <span class="tiny j-sub">${esc(T.sub || '')}</span></h3>${all}</div>
        <div class="seg" style="margin-bottom:8px">${[['both', '영어와 뜻'], ['en', '영어만'], ['none', '듣기만 (도전)']].map(([k, nm]) => `<button type="button" class="${sh === k ? 'on' : ''}" data-jlshow="${k}">${nm}</button>`).join('')}</div>
        <p class="tiny j-help">▶ 를 눌러 한 문장씩 듣고 따라 말해요. 가린 글은 누르면 보여요</p>
        <ol class="j-lines">${T.lines.map((l, i) => { const on = jGet('jl', K('l', i)); return `<li class="${on ? 'ok' : ''}"><button class="jl-play j-pl" data-jlp="${i}" type="button" aria-label="듣기">▶</button><div class="j-tx">${l.who ? `<span class="j-who">${esc(l.who)}</span>` : ''}<p class="j-en ${sh === 'none' ? 'hid' : ''}" data-jrev>${esc(l.en)}</p><p class="j-kol ${sh !== 'both' ? 'hid' : ''}" data-jrev>${esc(l.ko)}</p></div><button class="tk j-tk ${on ? 'on' : ''}" data-jlheard="${i}" type="button"><span>들었어요</span><i></i></button></li>`; }).join('')}</ol></section>`;
    } else if (m === 'quiz') {
      const L = (T.qs || []).map((q, i) => [q, i]).filter(([q]) => jlQOk(q)), done = L.filter(([, i]) => jGet('jl', K('q', i))), right = done.filter(([, i]) => jGet('jl', K('q', i)).ok);
      h += tracks + `<section class="card"><div class="card-h"><h3>${esc(T.page)}쪽 ${esc(T.title)} <span class="tiny j-sub">Track ${esc(T.track)}</span></h3>${all}</div>
        <div class="row between j-help"><p class="tiny" style="margin:0">먼저 전체를 듣고 풀어요. 한 번 고르면 바로 채점돼요${done.length ? ` · <b>${right.length}/${done.length} 맞힘</b>` : ''}</p>${done.length ? '<button class="btn sm" data-jlre="q" type="button">이 쪽 다시 풀기</button>' : ''}</div>
        ${L.length ? `<ol class="j-qs">${L.map(([q, i]) => { const a = jGet('jl', K('q', i)); return `<li><p class="j-q">${q.part ? `<span class="tag">${esc(q.part)}</span> ` : ''}${esc(q.q)}</p><p class="tiny" style="margin:4px 0 10px">${esc(q.ko || '')}</p>
          <div class="jg-ops j-ops">${q.ops.map((o, j) => `<button type="button" class="chip jg-op ${a && o === q.ans ? 'right' : a && o === a.p ? 'wrong' : ''}" data-jlq="${i}" data-o="${j}" ${a ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
          ${a ? `<div class="j-fb">${verdict(a.ok)}<div class="explain">${a.ok ? '' : `<b>정답</b> ${esc(q.ans)}<br>`}${esc(q.why || '')}${(q.ref || []).filter((x) => T.lines[x]).length ? `<div class="row wrap" style="margin-top:10px">${q.ref.filter((x) => T.lines[x]).map((x) => `<button type="button" class="chip sm jl-play" data-jlp="${x}">▶ ${esc(jCut(T.lines[x].en))}</button>`).join('')}</div>` : ''}</div></div>` : ''}</li>`; }).join('')}</ol>` : '<div class="empty"><b>이 쪽은 낼 문제가 없어요</b></div>'}</section>`;
    } else {
      const L = T.lines.map((l, i) => [l, i]).filter(([l]) => l.key), pool = [...new Set(u.tracks.flatMap((t) => t.lines.map((l) => l.key).filter(Boolean)))];
      const done = L.filter(([, i]) => jGet('jl', K('d', i)));
      h += tracks + `<section class="card"><div class="card-h"><h3>${esc(T.page)}쪽 ${esc(T.title)}</h3>${all}</div>
        <div class="row between j-help"><p class="tiny" style="margin:0">▶ 듣고 빈칸에 들어갈 낱말을 골라요${done.length ? ` · <b>${done.filter(([, i]) => jGet('jl', K('d', i)).ok).length}/${done.length} 맞힘</b>` : ''}</p>${done.length ? '<button class="btn sm" data-jlre="d" type="button">이 쪽 다시 하기</button>' : ''}</div>
        <ol class="j-lines">${L.map(([l, i]) => { const a = jGet('jl', K('d', i)), sd = `${u.unit}:${T.id}:${i}`;
          const ops = jSeed([l.key, ...jSeed(pool.filter((x) => x.toLowerCase() !== l.key.toLowerCase()), sd).slice(0, 2)], sd + ':o');
          const rx = new RegExp(`\\b${esc(l.key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`), en = esc(l.en).replace(rx, a ? `<b class="j-got ${a.ok ? '' : 'no'}">${esc(l.key)}</b>` : '<span class="j-gap"></span>');
          return `<li class="${a ? (a.ok ? 'ok' : 'no') : ''}"><button class="jl-play j-pl" data-jlp="${i}" type="button" aria-label="듣기">▶</button><div class="j-tx"><p class="j-en">${en}</p><p class="j-kol">${esc(l.ko)}</p>
            <div class="jg-ops j-ops sm">${ops.map((o) => `<button type="button" class="chip jg-op ${a && o === l.key ? 'right' : a && o === a.p ? 'wrong' : ''}" data-jld="${i}" data-o="${esc(o)}" ${a ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div></div></li>`; }).join('')}</ol></section>`;
    }
    if (r.only) { const nx = { words: ['lines', '다음: 한 문장씩 듣기'], lines: ['quiz', '다음: 교과서 문제'] }[m]; h += `<div class="cta-bar">${nx ? `<button class="btn primary big block" data-jlm="${nx[0]}" type="button">${nx[1]} ›</button>` : '<button class="btn primary big block" data-go="hw" type="button">숙제로</button>'}</div>`; }
    return `<div class="qwrap j-wrap">${h}</div>`;
  }
  function bindJl() {
    const r = UI.run, u = jlV(r); if (!u) return;
    const T = u.tracks[r.only ? 0 : Math.max(0, Math.min(r.t || 0, u.tracks.length - 1))], K = (x, i) => jlK(u, T, x, i);
    $$('[data-jlwide]').forEach((b) => (b.onclick = () => { jlStop(); UI.run = { ...r, only: 0 }; render(); window.scrollTo(0, 0); }));
    $$('[data-jlm]').forEach((b) => (b.onclick = () => { jlStop(); UI.run = { ...r, m: b.dataset.jlm }; render(); window.scrollTo(0, 0); }));
    $$('[data-jlt]').forEach((b) => (b.onclick = () => { jlStop(); UI.run = { ...r, t: +b.dataset.jlt }; jKeep(); }));
    $$('[data-jlslow]').forEach((b) => (b.onclick = () => { UI.jlSlow = !UI.jlSlow; if (jlAud) jlAud.playbackRate = UI.jlSlow ? 0.8 : 1; b.classList.toggle('on', UI.jlSlow); }));
    $$('[data-jlhide]').forEach((b) => (b.onclick = () => { UI.jlHide = b.dataset.jlhide === '1'; jKeep(); }));
    $$('[data-jlshow]').forEach((b) => (b.onclick = () => { UI.jlShow = b.dataset.jlshow; jKeep(); }));
    $$('[data-jrev]').forEach((x) => (x.onclick = () => x.classList.remove('hid')));
    $$('[data-jsay]').forEach((b) => (b.onclick = () => jSay(b.dataset.jsay)));
    $$('[data-jlknow]').forEach((b) => (b.onclick = () => { const k = `${u.unit}:w:${b.dataset.jlknow}`; if (jGet('jl', k)) jDel('jl', k); else { jSet('jl', k, { ok: 1 }); jFx(true, b); } jKeep(); }));
    $$('[data-jlheard]').forEach((b) => (b.onclick = () => { const k = K('l', +b.dataset.jlheard); if (jGet('jl', k)) jDel('jl', k); else { jSet('jl', k, { ok: 1 }); jFx(true, b); } jKeep(); }));
    $$('[data-jlp]').forEach((b) => (b.onclick = () => { const l = T.lines[+b.dataset.jlp]; if (l) jlPlay(T.url, l.s, l.e, b); }));
    $$('[data-jlall]').forEach((b) => (b.onclick = () => { if (b.classList.contains('on')) { jlStop(); return; } jlPlay(T.url, T.lines[0].s, 0, b); }));
    $$('[data-jlq]').forEach((b) => (b.onclick = () => { const i = +b.dataset.jlq, q = T.qs[i], k = K('q', i); if (!q || jGet('jl', k)) return; const p = q.ops[+b.dataset.o], ok = p === q.ans; jSet('jl', k, { p, ok }); jFx(ok, b); jKeep(); }));
    $$('[data-jld]').forEach((b) => (b.onclick = () => { const i = +b.dataset.jld, l = T.lines[i], k = K('d', i); if (!l || jGet('jl', k)) return; const p = b.dataset.o, ok = p.toLowerCase() === l.key.toLowerCase(); jSet('jl', k, { p, ok }); jFx(ok, b); jKeep(); }));
    $$('[data-jlre]').forEach((b) => (b.onclick = () => { const x = b.dataset.jlre; (x === 'q' ? T.qs : T.lines).forEach((_, i) => jDel('jl', K(x, i))); jKeep(); }));
  }

  // ── 📘 Benchmark Reading 5.3: 해석을 잘하는 게 목표 · 단어 → 끊어 읽기 → 해석 고르기 → 해석 해 보기 → 교과서 문제
  const JR_M = { words: '단어', chunk: '끊어 읽기', pick: '해석 고르기', self: '해석 해 보기', quiz: '교과서 문제' };
  const JR_S = { words: '단어', chunk: '끊어 읽기', pick: '고르기', self: '해석', quiz: '문제' };
  const jrU = (no) => JR.find((u) => +u.unit === +no);
  const jrK = (u, kind, id) => `r${u.unit}:${kind}:${id}`;
  const jrPages = (u) => [...new Set(u.sentences.map((x) => x.page))];
  const jrSents = (u, pg) => u.sentences.filter((x) => !pg || pg === 'all' || x.page === +pg);
  const jrOk = (u, kind, id) => (jGet('jr', jrK(u, kind, id)) || {}).ok;
  function jrTally(u, m) {
    if (m === 'words') return [(u.words || []).filter((w) => jGet('jr', jrK(u, 'w', w.id))).length, (u.words || []).length];
    if (m === 'chunk') return [jrPages(u).filter((p) => jGet('jr', jrK(u, 'read', p))).length, jrPages(u).length];
    if (m === 'pick' || m === 'self') return [u.sentences.filter((x) => jrOk(u, m, x.id)).length, u.sentences.length];
    return [(u.questions || []).filter((q) => jrOk(u, 'q', q.id)).length, (u.questions || []).length];
  }
  const jrChunks = (x, hide) => `<div class="j-chunks ${hide ? 'hide-ko' : ''}">${x.chunks.map(([en, ko], i) => `<span class="j-ch" data-jch><b>${esc(en)}</b><small>${esc(ko)}</small></span>${i < x.chunks.length - 1 ? '<i class="j-sl">/</i>' : ''}`).join('')}</div>`;
  function jrQueue(u, r) { r.q = jrSents(u, r.pg).filter((x) => !jrOk(u, r.m, x.id)).map((x) => x.id); r.phase = 'ask'; r.qm = r.m; r.qpg = r.pg; }
  function jrRun() {
    const r = UI.run, u = jrU(r.unit); if (!u) return jEmpty('리딩 자료를 넣는 중이에요');
    const m = JR_M[r.m] ? r.m : 'chunk'; r.m = m; r.pg = r.pg || 'all';
    let h = jHead('📘 ' + u.book, `Unit ${u.unit} · ${u.title}`, [u.subject, u.pages].filter(Boolean).join(' · '), Object.entries(JR_M).map(([k, nm]) => { const [a, b] = jrTally(u, k); return [k, nm, b ? `${a}/${b}` : '']; }), m, 'data-jrm');
    if (m === 'chunk' || m === 'pick' || m === 'self') h += `<div class="row wrap j-chips"><span class="tiny">쪽</span>${['all', ...jrPages(u)].map((p) => `<button class="chip sm ${String(r.pg) === String(p) ? 'on' : ''}" data-jrpg="${p}" type="button">${p === 'all' ? '전체' : p + '쪽'}</button>`).join('')}</div>`;
    if (m === 'words') {
      h += `<section class="card"><div class="card-h"><h3>단어 ${u.words.length}개</h3><div class="seg j-seg"><button type="button" class="${UI.jrHide ? '' : 'on'}" data-jrhidew="0">뜻 보기</button><button type="button" class="${UI.jrHide ? 'on' : ''}" data-jrhidew="1">뜻 가리기</button></div></div>
        <p class="tiny j-help">단어를 누르면 소리가 나요. 뜻을 떠올려 보고 알면 오른쪽을 체크해요</p>
        <div class="j-list">${u.words.map((w) => { const on = jGet('jr', jrK(u, 'w', w.id)); return `<div class="j-row ${on ? 'ok' : ''}"><button class="j-say" data-jsay="${esc(w.en)}" type="button"><b>${esc(w.en)}</b><span class="j-spk" aria-hidden="true">🔊</span></button><span class="j-ko ${UI.jrHide && !on ? 'hid' : ''}" data-jrev>${esc(w.ko)}${w.ex ? `<small>${esc(w.ex)}</small>` : ''}</span><button class="tk j-tk ${on ? 'on' : ''}" data-jrknow="${esc(w.id)}" type="button"><span>알아요</span><i></i></button></div>`; }).join('')}</div></section>`;
    } else if (m === 'chunk') {
      const hide = UI.jrHideKo !== false, pages = r.pg === 'all' ? jrPages(u) : [+r.pg];
      h += `<div class="row wrap j-chips"><button class="chip sm ${hide ? 'on' : ''}" data-jrhide type="button">${hide ? '우리말 가림 · 덩어리를 누르면 보여요' : '우리말 보이는 중'}</button><span class="tiny">빗금(/)마다 끊어서 앞에서부터 차례로 이해해요</span></div>`;
      for (const p of pages) {
        const done = jGet('jr', jrK(u, 'read', p));
        h += `<section class="card j-page"><div class="card-h"><h3>${p}쪽${p === u.sentences[0].page && u.focus ? ` · Focus: ${esc(u.focus)}` : ''}</h3>${done ? '<span class="tag blue">다 읽었어요</span>' : ''}</div>
          ${jrSents(u, p).map((x) => `<div class="j-sent">${jrChunks(x, hide)}<button class="btn sm j-full" data-jrfull type="button">전체 해석 보기</button><div class="explain j-kofull" hidden>${esc(x.ko)}${x.tip ? `<div class="tiny" style="margin-top:6px">💡 ${esc(x.tip)}</div>` : ''}</div></div>`).join('')}
          <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ${done ? '' : 'primary'}" data-jrread="${p}" type="button">${done ? `${p}쪽 다 읽었어요` : `${p}쪽 끊어 읽기 끝`}</button></div></section>`;
      }
    } else if (m === 'pick' || m === 'self') {
      if (!r.q || r.qm !== m || r.qpg !== r.pg) jrQueue(u, r);
      const L = jrSents(u, r.pg), n = L.filter((x) => jrOk(u, m, x.id)).length, cur = u.sentences.find((x) => x.id === (r.phase === 'ask' ? r.q[0] : r.last));
      h += `<section class="card"><div class="card-h"><h3>${m === 'pick' ? '알맞은 해석 고르기' : '속으로 해석해 보고 확인하기'}</h3><span class="tiny">${n}/${L.length}문장</span></div><div class="nx-bar"><i style="width:${L.length ? Math.round((n / L.length) * 100) : 0}%"></i></div>`;
      if (!cur) h += n >= L.length ? `<div class="empty">${ic('party')}<b>${L.length}문장 다 했어요</b></div><button class="btn big block" data-jragain type="button">처음부터 한 번 더 (기록은 그대로)</button>` : `<button class="btn primary big block" data-jrnext type="button">남은 문장 다시</button>`;
      else {
        const rec = jGet('jr', jrK(u, m, cur.id));
        h += `${rec && rec.first === 0 ? '<span class="tag red">틀렸던 문장</span> ' : ''}<span class="tiny">${cur.page}쪽</span><p class="j-big">${esc(cur.en)}</p>`;
        if (m === 'pick') {
          const ops = jSeed([cur.ko, ...(cur.wrong || [])], cur.id);
          if (r.phase === 'ask') h += `<div class="choices">${ops.map((o, i) => `<button class="choice" data-jrop="${i}" type="button"><span class="n">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}</div><button class="btn sm" style="margin-top:12px" data-jrhint type="button">끊어서 보기</button><div class="j-hint" hidden>${jrChunks(cur, false)}</div>`;
          else h += `<div class="choices">${ops.map((o, i) => `<div class="choice ${o === cur.ko ? 'right' : i === r.pick ? 'wrong' : ''}"><span class="n">${i + 1}</span><span>${esc(o)}</span></div>`).join('')}</div><div class="j-fb">${verdict(r.ok)}</div>${jrChunks(cur, false)}${cur.tip ? `<div class="explain">💡 ${esc(cur.tip)}</div>` : ''}${r.ok ? '' : '<p class="tiny">이 문장은 조금 뒤에 또 나와요</p>'}<button class="btn primary big block" style="margin-top:16px" data-jrnext type="button">다음</button>`;
        } else {
          if (r.phase === 'ask') h += `<p class="tiny">우리말로 속으로 해석해 본 다음 확인을 눌러요</p><button class="btn sm" data-jrhint type="button">끊어 읽기 힌트</button><div class="j-hint" hidden>${jrChunks(cur, true)}</div><button class="btn primary big block" style="margin-top:16px" data-jrshow type="button">해석 확인</button>`;
          else h += `<div class="explain"><b>모범 해석</b><br>${esc(cur.ko)}</div>${jrChunks(cur, false)}${cur.tip ? `<div class="explain">💡 ${esc(cur.tip)}</div>` : ''}<div class="row" style="gap:8px;margin-top:16px"><button class="btn primary big" style="flex:1" data-jrself="1" type="button">뜻이 맞았어요</button><button class="btn big" style="flex:1" data-jrself="0" type="button">다시 볼래요</button></div>`;
        }
      }
      h += '</section>';
    } else {
      let sec = null, list = [], no = 0;
      const flush = () => { if (sec !== null) h += `<section class="card j-qsec"><div class="card-h"><h3>${esc(sec)}</h3></div><ol class="j-qs">${list.join('')}</ol></section>`; list = []; };
      for (const q of u.questions || []) {
        if (q.sec !== sec) { flush(); sec = q.sec; no = 0; }
        const a = jGet('jr', jrK(u, 'q', q.id)), see = UI.jrSee && UI.jrSee[q.id];
        const box = q.choices ? `<div class="jg-ops j-ops">${q.choices.map((c, j) => `<button type="button" class="chip jg-op ${a && jgNorm(a.v) === jgNorm(c) ? (a.ok ? 'right' : 'wrong') : a && !a.ok && jgNorm(c) === jgNorm(q.answers[0]) ? 'right' : ''}" data-jrq="${esc(q.id)}" data-o="${j}" ${a ? 'disabled' : ''}>${esc(c)}</button>`).join('')}</div>`
          : a ? '' : see ? `<div class="explain"><b>정답</b> ${esc(q.model || q.answers[0])}</div><p class="tiny" style="margin:8px 0">내 답이 뜻이 같았나요?</p><div class="row" style="gap:8px"><button class="btn soft" data-jrqs="${esc(q.id)}" data-ok="1" type="button">맞혔어요</button><button class="btn" data-jrqs="${esc(q.id)}" data-ok="0" type="button">아직이에요</button></div>` : `<p class="tiny" style="margin:0 0 8px">답을 말해 보거나 공책에 써 본 다음 확인해요</p><button class="btn sm soft" data-jrsee="${esc(q.id)}" type="button">정답 확인</button>`;
        const fb = a ? `<div class="j-fb">${verdict(a.ok)}<div class="explain">${q.choices && a.ok ? '' : `<b>정답</b> ${esc(q.model || q.answers[0])}<br>`}${esc(q.why || '')}</div></div>` : '';
        list.push(`<li><p class="j-q"><span class="nb">${++no}</span> ${esc(q.prompt)}</p>${box}${fb}</li>`);
      }
      flush();
      if ((u.questions || []).some((q) => jGet('jr', jrK(u, 'q', q.id)))) h += `<button class="btn big block" style="margin-top:16px" data-jrqre type="button">교과서 문제 처음부터 다시 풀기</button>`;
    }
    return `<div class="qwrap j-wrap">${h}</div>`;
  }
  function bindJr() {
    const r = UI.run, u = jrU(r.unit); if (!u) return;
    $$('[data-jrm]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'jr', unit: r.unit, m: b.dataset.jrm, pg: r.pg }; render(); window.scrollTo(0, 0); }));
    $$('[data-jrpg]').forEach((b) => (b.onclick = () => { UI.run = { ...r, pg: b.dataset.jrpg, q: null }; jKeep(); }));
    $$('[data-jrhidew]').forEach((b) => (b.onclick = () => { UI.jrHide = b.dataset.jrhidew === '1'; jKeep(); }));
    $$('[data-jrhide]').forEach((b) => (b.onclick = () => { UI.jrHideKo = !(UI.jrHideKo !== false); jKeep(); }));
    $$('[data-jrev]').forEach((x) => (x.onclick = () => x.classList.remove('hid')));
    $$('[data-jsay]').forEach((b) => (b.onclick = () => jSay(b.dataset.jsay)));
    $$('.hide-ko [data-jch]').forEach((c) => (c.onclick = () => c.classList.toggle('show')));
    $$('[data-jrknow]').forEach((b) => (b.onclick = () => { const k = jrK(u, 'w', b.dataset.jrknow); if (jGet('jr', k)) jDel('jr', k); else { jSet('jr', k, { ok: 1 }); jFx(true, b); } jKeep(); }));
    $$('[data-jrfull]').forEach((b) => (b.onclick = () => { const k = b.nextElementSibling; k.hidden = !k.hidden; b.textContent = k.hidden ? '전체 해석 보기' : '해석 접기'; }));
    $$('[data-jrread]').forEach((b) => (b.onclick = () => { const k = jrK(u, 'read', b.dataset.jrread); if (jGet('jr', k)) return; jSet('jr', k, { ok: 1 }); jFx(true, b); toast(`${b.dataset.jrread}쪽 끊어 읽기 끝!`); jKeep(); }));
    $$('[data-jrhint]').forEach((b) => (b.onclick = () => { const x = b.nextElementSibling; x.hidden = !x.hidden; $$('.hide-ko [data-jch]', x).forEach((c) => (c.onclick = () => c.classList.toggle('show'))); }));
    const cur = u.sentences.find((x) => x.id === (r.phase === 'ask' ? (r.q || [])[0] : r.last));
    const rec = (ok) => { const k = jrK(u, r.m, cur.id), p = jGet('jr', k); jSet('jr', k, { ok: ok ? 1 : 0, first: p ? p.first : ok ? 1 : 0 }); r.q.shift(); r.last = cur.id; if (!ok) r.q.splice(Math.min(r.q.length, 3), 0, cur.id); };
    $$('[data-jrop]').forEach((b) => (b.onclick = () => { const ops = jSeed([cur.ko, ...(cur.wrong || [])], cur.id), i = +b.dataset.jrop, ok = ops[i] === cur.ko; rec(ok); r.phase = 'show'; r.pick = i; r.ok = ok; jFx(ok, b); jKeep(); }));
    $$('[data-jrshow]').forEach((b) => (b.onclick = () => { r.phase = 'show'; r.last = cur.id; jKeep(); }));
    $$('[data-jrself]').forEach((b) => (b.onclick = () => { const ok = b.dataset.jrself === '1'; rec(ok); r.phase = 'ask'; jFx(ok, b); jKeep(); }));
    $$('[data-jrnext]').forEach((b) => (b.onclick = () => { if (!r.q.length) jrQueue(u, r); r.phase = 'ask'; jKeep(); }));
    $$('[data-jragain]').forEach((b) => (b.onclick = () => { r.q = shuffle(jrSents(u, r.pg).map((x) => x.id)); r.phase = 'ask'; r.qm = r.m; r.qpg = r.pg; jKeep(); }));
    $$('[data-jrq]').forEach((b) => (b.onclick = () => { const q = u.questions.find((x) => x.id === b.dataset.jrq); if (!q || jGet('jr', jrK(u, 'q', q.id))) return; const v = q.choices[+b.dataset.o], ok = q.answers.some((x) => jgNorm(x) === jgNorm(v)); jSet('jr', jrK(u, 'q', q.id), { v, ok: ok ? 1 : 0 }); jFx(ok, b); jKeep(); }));
    $$('[data-jrsee]').forEach((b) => (b.onclick = () => { UI.jrSee = { ...(UI.jrSee || {}), [b.dataset.jrsee]: 1 }; jKeep(); }));
    $$('[data-jrqs]').forEach((b) => (b.onclick = () => { const ok = b.dataset.ok === '1'; jSet('jr', jrK(u, 'q', b.dataset.jrqs), { ok: ok ? 1 : 0, self: 1 }); jFx(ok, b); jKeep(); }));
    $$('[data-jrqre]').forEach((b) => (b.onclick = () => { for (const q of u.questions) jDel('jr', jrK(u, 'q', q.id)); UI.jrSee = {}; jKeep(); }));
  }

  // ── ✏️ Writing: 아직 「주어 먼저, 동사 다음」 단계 · 색 블록(주어·동사·연결어)으로 문장을 맞춰 보고, 마지막에 100단어 쓰기
  const JW_M = { idea: '생각 정리', build: '문장 만들기', trans: '연결어', write: '100단어 쓰기' };
  const JW_S = { idea: '생각', build: '문장', trans: '연결어', write: '쓰기' };
  const jwU = (id) => JW.find((w) => w.id === id);
  const jwCount = (t) => String(t || '').trim().split(/\s+/).filter((x) => /[A-Za-z]/.test(x)).length;
  const jwText = (w) => (jGet('jw', w.id + ':text') || {}).text || '';
  const jwUsed = (w, t) => (w.trans || []).filter((x) => new RegExp(`(^|[^A-Za-z])${x.replace(/[,.]/g, '').replace(/ /g, '\\s+')}\\b`, 'i').test(t || ''));
  function jwTally(w, m) {
    if (m === 'idea') return [jGet('jw', w.id + ':idea') ? 1 : 0, 1];
    if (m === 'build') return [w.sents.filter((_, i) => jGet('jw', `${w.id}:b${i}`)).length, w.sents.length];
    if (m === 'trans') return [w.tq.filter((_, i) => jGet('jw', `${w.id}:t${i}`)).length, w.tq.length];
    return [Math.min(jwCount(jwText(w)), w.goal), w.goal];
  }
  const jwC = (p) => `<span class="jw-c ${esc(p[1])}">${esc(p[0])}</span>`;
  function jwShuf(n, seed) { const o = jSeed([...Array(n).keys()], seed); if (o.length > 1 && o.every((v, k) => v === k)) o.push(o.shift()); return o; }
  function jwRun() {
    const r = UI.run, w = jwU(r.id); if (!w) return jEmpty('라이팅 주제를 넣는 중이에요');
    const m = JW_M[r.m] ? r.m : 'idea'; r.m = m;
    let h = jHead('✏️ Writing', w.title, `${w.goal}단어 이상`, Object.entries(JW_M).map(([k, nm]) => { const [a, b] = jwTally(w, k); return [k, nm, k === 'idea' ? '' : `${a}/${b}`]; }), m, 'data-jwm');
    h += `<section class="card"><p class="j-big" style="margin-top:0">${esc(w.prompt)}</p><p class="tiny" style="font-size:14px;margin:0">${esc(w.promptKo)}</p></section>`;
    const legend = `<p class="jw-legend"><span class="jw-c s">주어</span> 누가 · <span class="jw-c v">동사</span> 한다 · <span class="jw-c t">연결어</span> · <span class="jw-c x">나머지</span> · 영어는 <b>주어 다음 동사</b> 순서예요</p>`;
    if (m === 'idea') {
      const seen = jGet('jw', w.id + ':idea');
      h += `<section class="card"><div class="card-h"><h3>내 생각 (선생님이랑 정리한 것)</h3></div>${w.ideas.map((g) => `<p class="jw-h">${esc(g.h)}</p><ul class="jw-ul">${g.pts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}</section>
        <section class="card"><div class="card-h"><h3>글 뼈대 · ${w.outline.length}덩어리</h3></div><ol class="jw-ul">${w.outline.map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join('')}</ol><p class="tiny">한 덩어리에 3~4문장씩 쓰면 100단어가 넘어요</p></section>
        <section class="card"><div class="card-h"><h3>꼭 쓸 단어</h3></div><div class="row wrap">${w.words.map(([e, k]) => `<span class="tag"><b>${esc(e)}</b>&nbsp;${esc(k)}</span>`).join('')}</div></section>
        <section class="card"><div class="card-h"><h3>연결어 · 글의 길잡이</h3></div><div class="row wrap">${w.trans.map((x) => `<span class="jw-c t">${esc(x)}</span>`).join('')}</div></section>
        <button class="tk j-tk-big ${seen ? 'on' : ''}" data-jwidea type="button"><span>생각 정리 다 봤어요</span><i></i></button>`;
    } else if (m === 'build') {
      const i = Math.max(0, Math.min(r.bi || 0, w.sents.length - 1)), st = w.sents[i], key = `${w.id}:b${i}`;
      if (!r.bo || r.bo.i !== i) r.bo = { i, got: jGet('jw', key) ? st.parts.map((_, k) => k) : [], mix: jwShuf(st.parts.length, `${w.id}:${i}`) };
      const o = r.bo, full = o.got.length === st.parts.length;
      h += legend + `<section class="card"><div class="jw-dots">${w.sents.map((_, k) => `<button type="button" class="nb ${k === i ? 'cur' : ''} ${jGet('jw', `${w.id}:b${k}`) ? 'ok' : ''}" data-jwbi="${k}">${k + 1}</button>`).join('')}</div>
        <p class="j-big">${esc(st.ko)}</p><div class="jw-line">${o.got.map((k) => jwC(st.parts[k])).join(' ') || '<span class="tiny">아래 블록을 순서대로 눌러요. 주어부터!</span>'}</div>
        <div class="jw-pool">${o.mix.map((k) => o.got.includes(k) ? '' : `<button type="button" class="jw-c ${esc(st.parts[k][1])} jw-pick" data-jwk="${k}">${esc(st.parts[k][0])}</button>`).join('')}</div>
        ${full ? `<div class="j-fb">${verdict(true)}</div>${i + 1 < w.sents.length ? '<button class="btn primary big block" style="margin-top:12px" data-jwnext type="button">다음 문장</button>' : '<p class="tiny" style="margin-top:12px">모든 문장을 만들었어요. 이제 「100단어 쓰기」로 가요</p>'}` : o.got.length ? '<button class="btn sm" style="margin-top:12px" data-jwreset type="button">처음부터</button>' : ''}</section>
        <section class="card"><div class="card-h"><h3>지금까지 만든 글</h3></div><p class="jw-model">${w.sents.map((x, k) => (jGet('jw', `${w.id}:b${k}`) ? x.parts.map(jwC).join(' ') : '')).filter(Boolean).join(' ') || '<span class="tiny">문장을 만들면 여기 차곡차곡 쌓여요</span>'}</p></section>`;
    } else if (m === 'trans') {
      h += `<section class="card"><ol class="j-qs">${w.tq.map((q, i) => { const k = `${w.id}:t${i}`, ok = jGet('jw', k), pk = (UI.jwPick || {})[w.id + i];
        return `<li><p class="tiny" style="margin:0 0 4px">${esc(q.q)} · ${esc(q.ko)}</p><p class="j-q">${esc(q.sent).replace('______', `<b class="j-got ${ok ? '' : 'blank'}">${ok ? esc(q.ans) : '______'}</b>`)}</p><div class="jg-ops j-ops">${q.ops.map((op) => `<button type="button" class="chip jg-op ${ok && op === q.ans ? 'right' : !ok && pk === op ? 'wrong' : ''}" data-jwt="${i}" data-o="${esc(op)}" ${ok ? 'disabled' : ''}>${esc(op)}</button>`).join('')}</div></li>`; }).join('')}</ol></section>`;
    } else {
      const t = jwText(w), n = jwCount(t), used = jwUsed(w, t);
      h += `<section class="card"><div class="jw-meter"><b id="jw-n">${n}</b> / ${w.goal} 단어<span class="jw-bar"><i id="jw-bar" style="width:${Math.min(100, (n / w.goal) * 100)}%"></i></span></div>
        <p class="row wrap" id="jw-used" style="margin:12px 0">${w.trans.map((x) => `<span class="jw-c ${used.includes(x) ? 't' : 'x off'}">${used.includes(x) ? '✓ ' : ''}${esc(x)}</span>`).join('')}</p>
        <textarea class="inp jw-ta" id="jw-ta" rows="12" spellcheck="false" placeholder="If a wizard gives me two magical items, I want ...">${esc(t)}</textarea>
        <p class="tiny">자동 저장돼요. 선생님도 이 글을 볼 수 있어요</p>
        <details class="jg-again"><summary>막히면 문장 틀 보기</summary><ul class="jw-ul">${w.frames.map((f) => `<li>${f.p ? `<b>${esc(f.p)}</b> ` : ''}${esc(f.f)}</li>`).join('')}</ul></details>
        <details class="jg-again"><summary>예시 글 보기 (다 쓴 다음에)</summary><p class="jw-model">${w.sents.map((x) => x.parts.map(jwC).join(' ')).join(' ')}</p></details></section>`;
    }
    return `<div class="qwrap j-wrap">${h}</div>`;
  }
  function bindJw() {
    const r = UI.run, w = jwU(r.id); if (!w) return;
    $$('[data-jwm]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'jw', id: w.id, m: b.dataset.jwm, bi: r.bi }; render(); window.scrollTo(0, 0); }));
    $$('[data-jwidea]').forEach((b) => (b.onclick = () => { const k = w.id + ':idea'; if (jGet('jw', k)) jDel('jw', k); else { jSet('jw', k, { ok: 1 }); jFx(true, b); } jKeep(); }));
    $$('[data-jwbi]').forEach((b) => (b.onclick = () => { r.bi = +b.dataset.jwbi; r.bo = null; jKeep(); }));
    $$('[data-jwk]').forEach((b) => (b.onclick = () => { const st = w.sents[r.bo.i], k = +b.dataset.jwk, need = r.bo.got.length;
      if (k !== need && st.parts[k][0] !== st.parts[need][0]) { b.classList.remove('jw-shake'); void b.offsetWidth; b.classList.add('jw-shake'); jFx(false); return; }
      r.bo.got.push(k === need ? k : need); if (r.bo.got.length === st.parts.length) { jSet('jw', `${w.id}:b${r.bo.i}`, { ok: 1 }); jFx(true, b); } jKeep(); }));
    $$('[data-jwnext]').forEach((b) => (b.onclick = () => { r.bi = (r.bo ? r.bo.i : 0) + 1; r.bo = null; jKeep(); }));
    $$('[data-jwreset]').forEach((b) => (b.onclick = () => { r.bo.got = []; jKeep(); }));
    $$('[data-jwt]').forEach((b) => (b.onclick = () => { const i = +b.dataset.jwt, q = w.tq[i]; UI.jwPick = { ...(UI.jwPick || {}), [w.id + i]: b.dataset.o }; const ok = b.dataset.o === q.ans; if (ok) jSet('jw', `${w.id}:t${i}`, { ok: 1 }); jFx(ok, b); jKeep(); }));
    const ta = $('#jw-ta');
    if (ta) ta.oninput = () => { (S.jw = S.jw || {})[w.id + ':text'] = { text: ta.value, at: Date.now() }; save('jw'); const n = jwCount(ta.value), used = jwUsed(w, ta.value);
      $('#jw-n').textContent = n; $('#jw-bar').style.width = Math.min(100, (n / w.goal) * 100) + '%';
      $('#jw-used').innerHTML = w.trans.map((x) => `<span class="jw-c ${used.includes(x) ? 't' : 'x off'}">${used.includes(x) ? '✓ ' : ''}${esc(x)}</span>`).join(''); };
  }
  // 숙제 탭: 그래머 옆에 책마다 한 칸 (주아 묶음에만 자료가 있어서 다른 학생은 안 보여요)
  function juaLibs() {
    const card = (title, list, fin, all, unit) => `<section class="card c12"><div class="card-h"><h2>${esc(title)}</h2><span class="tiny">${fin} / ${all}${unit} 끝냈어요</span></div><div class="jgu-l">${list.join('')}</div></section>`;
    const st = (tally, names, x) => Object.keys(names).map((k) => { const [n, all] = tally(x, k); return { k, nm: names[k], n, all }; }).filter((s) => s.all);
    let h = '';
    if (JL.length) { const rows = JL.map((u) => [u, st(jlTally, JL_S, u)]); h += card(JL[0].book || 'Listening Live 2', rows.map(([u, s]) => jTile('data-jlo', u.unit, u.unit, u.title, `${u.pages} · 트랙 ${u.tracks.length}개`, s)), rows.filter(([, s]) => s.every((x) => x.n >= x.all)).length, JL.length, '유닛'); }
    if (JR.length) { const rows = JR.map((u) => [u, st(jrTally, JR_S, u)]); h += card(JR[0].book || 'Benchmark Reading 5.3', rows.map(([u, s]) => jTile('data-jro', u.unit, u.unit, u.title, [u.subject, u.pages].filter(Boolean).join(' · '), s)), rows.filter(([, s]) => s.every((x) => x.n >= x.all)).length, JR.length, '유닛'); }
    if (JW.length) { const rows = JW.map((w) => [w, st(jwTally, JW_S, w)]); h += card('Writing', rows.map(([w, s]) => jTile('data-jwo', w.id, jNum(w.id), w.title, `${w.goal}단어 이상${w.date ? ' · ' + md(w.date) : ''}`, s)), rows.filter(([, s]) => s.every((x) => x.n >= x.all)).length, JW.length, '주제'); }
    return h;
  }

  // ───────── 시험 (과외 학생: 윤건 단원·실전 · 지원 고1 모의 빈칸 · 주아 단어) ─────────
  // 문제는 학생 코드로 잠긴 묶음(D.nx)에만 있어요. 기록 S.nx = { a: { 문항: { ok, v, at } }, done: [{ id, title, kind, ok, n, at, ms }], st: { 세트: { t0, fin } }, wd: { 'ko:w1': { s, w } } }
  const NXD = D.nx || {};
  const NX_SN = { eng: '영어', hist: '역사', sci: '과학' };
  const NX_PART = { c: '개념 빈칸', q: '단원 문제', x: '기출' };
  const nxPartName = (u, p) => (p === 'c' && u.subj === 'eng' ? '단어' : NX_PART[p]);
  const NXSETS = {}, NXQ = {}, NXU = {};
  (() => {
    const add = (s) => { NXSETS[s.id] = s; for (const q of s.qs) if (!NXQ[q.i]) NXQ[q.i] = { q, set: s.id }; };
    for (const m of NXD.mocks || []) add({ ...m, kind: 'mock' });
    for (const sb of NXD.subjects || []) for (const u of sb.units) {
      NXU[u.id] = u;
      for (const p of ['c', 'q', 'x']) if (u.parts[p].length) add({ id: `${u.id}:${p}`, title: `${NX_SN[u.subj]} ${u.code} ${nxPartName(u, p)}`, sub: u.title, subj: u.subj, kind: p, unit: u.id, qs: u.parts[p] });
      for (const pp of u.papers) add({ id: `${u.id}:x:${pp.id}`, title: pp.title, sub: `${NX_SN[u.subj]} ${u.code} 기출`, subj: u.subj, kind: 'x', unit: u.id, qs: u.parts.x.filter((q) => q.pp === pp.id) });
    }
    const WD = NXD.words; if (WD) for (const m of ['ko', 'en']) add({ id: 'jw:' + m, title: m === 'ko' ? '단어 시험 뜻 쓰기' : '단어 시험 영어 쓰기', sub: WD.when || '', subj: 'eng', kind: 'words', mode: m, qs: WD.words.map((w) => ({ i: `jw:${m}:${w.id}`, t: 'w' + m, q: m === 'ko' ? w.en : w.ko, w, cat: 'Day ' + w.day })) });
  })();
  // 선생님 숙제가 문제 목록을 직접 담으면(h.nxq) 그 숙제만의 묶음으로 열어요 (예: 어제 틀린 것만, 단원 문제 중 진짜 문제만)
  function nxReg() { for (const h of S.hw || []) if (h.nx && h.nxq && !NXSETS[h.nx]) { const qs = h.nxq.map((i) => (NXQ[i] || {}).q).filter(Boolean); if (!qs.length) continue; const u = (NXSETS[(NXQ[h.nxq[0]] || {}).set] || {}).unit; NXSETS[h.nx] = { id: h.nx, title: h.title, sub: '선생님 숙제', subj: (NXU[u] || {}).subj || 'eng', kind: 'q', unit: u, qs }; } }
  const nxS = () => { const x = (S.nx = S.nx || {}); x.a = x.a || {}; x.done = x.done || []; x.st = x.st || {}; x.wd = x.wd || {}; x.la = x.la || {}; x.lq = x.lq || {}; return x; };
  const plain = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  // 지문·문제 글: 밑줄(<u>)·굵게는 살리고, 빈칸(___)과 (가)·㉠·(A) 표시는 눈에 띄게
  const nxRich = (t) => rich(t).replace(/_{3,}/g, '<span class="nx-gap"></span>').replace(/\(\s*[가나다라마바사아자차카타파하A-E]\s*\)|[㉠-㉭]/g, '<b class="nx-mk">$&</b>');
  const nxKey = (s) => String(s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/\([^)]*\)/g, '').replace(/[^a-z0-9'가-힣]/g, '');
  const nxAlts = (a) => [...new Set([a, ...String(a).split(/\s*\/\s*/)].map(nxKey).filter(Boolean))];
  const nxParts = (q) => { const a = String((q.a || [])[0] || ''); if (!/\(1\)/.test(a)) return null; const ps = a.split(/\(\d\)/).map((t) => t.trim().replace(/[,\s]+$/, '')).filter(Boolean); return ps.length > 1 ? ps : null; };
  const koOk = (w, v) => { const x = String(v).replace(/[~\s.,]/g, ''); if (!x) return false; const parts = w.ko.replace(/\((명|동|형|부)\)/g, '').split(/[,/·]/).map((p) => p.replace(/\([^)]*\)/g, '').replace(/[~\s.]/g, '')).filter(Boolean), stem = (p) => p.replace(/(하다|이다|다|한|는|인|의|은)$/, ''); return parts.some((p) => x.includes(p) || (stem(p).length >= 2 && x.includes(stem(p))) || (x.length >= 2 && p.includes(x) && x.length >= p.length - 2)); };
  function nxCheck(q, vals) {
    if (q.jg) return jgOk(q.jg, vals.join(' '));
    if (q.t === 'wko') return koOk(q.w, vals[0] || '');
    if (q.t === 'wen') return normEn(vals[0]) === normEn(q.w.en);
    if (q.t === 'blank') return q.a.every((a, k) => nxAlts(a).includes(nxKey(vals[k])));
    if (q.t === 'essay') { const v = nxKey(vals.join(' ')); return q.k && q.k.length ? q.k.every((g) => g.some((x) => v.includes(nxKey(x)))) : false; }
    const ps = nxParts(q);
    if (ps) return ps.every((p, k) => nxAlts(p).includes(nxKey(vals[k])));
    const v = nxKey(vals.join(' ')); return q.a.some((a) => nxAlts(a).includes(v));
  }
  // 문제 하나 그리기: 지문이 길면 { psg } 로 따로 돌려줘요 (PC 에서 왼쪽 칸)
  function nxView(q, rec, no) {
    const long = !!q.p && (q.html || q.p.length > 140 || /\n/.test(q.p));
    const ptext = q.p ? (q.html ? q.p : nxRich(q.p)) : '';
    const psg = long ? `<section class="card nx-psg"><div class="eyebrow">${q.html ? '지문' : '지문 · 자료'}</div><div class="nx-ptext ${q.html ? 'html' : ''}">${ptext}</div></section>` : '';
    const meta = `<div class="nx-meta">${no ? `<b class="num">${no}번</b>` : ''}${q.cat ? `<span class="tag">${esc(q.cat)}</span>` : ''}${q.lv ? `<span class="tag ${q.lv === 3 ? 'red' : ''}">${['', '쉬움', '보통', '어려움'][q.lv]}</span>` : ''}${q.src ? `<span class="tiny">${esc(q.src)}</span>` : ''}</div>`;
    let stem, ans = '';
    const typed = rec && rec.v != null ? String(rec.v).split(' ‖ ') : [];
    if (q.t === 'blank') {
      let k = 0; stem = `${q.h ? `<div class="tiny" style="margin-bottom:6px">${esc(q.h)}</div>` : ''}<p class="nx-q nx-blq">${esc(q.q).replace(/\{([^}]+)\}/g, (m, a) => { const i = k++; if (!rec) return `<input class="nx-bl" data-nxin="${i}" autocomplete="off" spellcheck="false" style="width:${Math.max(4, a.length * 1.6 + 1)}em" aria-label="빈칸 ${i + 1}">`; const ok = nxAlts(a).includes(nxKey(typed[i])); return ok ? `<b class="nx-bl-ok">${esc(a)}</b>` : `${typed[i] ? `<s class="nx-bl-x">${esc(typed[i])}</s>` : ''}<b class="nx-bl-no">${esc(a)}</b>`; })}</p>`;
      if (!rec) ans = `<div class="nx-acts"><button class="btn primary big" id="nx-go" type="button">채점하기</button><button class="nx-link" id="nx-give" type="button">모르겠어요</button></div>`;
    } else if (q.t === 'wko' || q.t === 'wen') {
      stem = `<div class="nx-word">${esc(q.q)}</div>${q.t === 'wen' && q.w.ex ? `<p class="nx-wex">${esc(q.w.ex).replace(new RegExp(q.w.en.split(' ')[0].slice(0, Math.max(3, q.w.en.split(' ')[0].length - 2)).replace(/[^a-z]/gi, '') + '\\w*', 'i'), '<span class="nx-gap"></span>')}</p>` : ''}`;
      ans = rec ? '' : `<div class="nx-in-row"><input class="inp" data-nxin="0" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${q.t === 'wko' ? '뜻을 한글로 써요' : '영어로 써요'}"><button class="btn primary" id="nx-go" type="button">확인</button></div>`;
    } else {
      stem = `<h2 class="nx-q">${nxRich(q.q)}</h2>${q.p && !long ? `<div class="nx-box">${nxRich(q.p)}</div>` : ''}`;
      if (q.t === 'mc') {
        const ok = rec && rec.ok, pk = rec ? +rec.v : null;
        ans = `<div class="choices nx-ch">${q.ch.map((c, k) => { const cls = !rec ? '' : k === pk && ok ? 'nx-good' : k === pk ? 'wrong' : k === q.a ? 'right' : 'nx-dim'; return `<button class="choice ${cls}" data-nxp="${k}" type="button" ${rec ? 'disabled' : ''}><span class="n">${k + 1}</span><span class="ct">${q.html ? esc(c) : nxRich(c)}</span>${rec && k === q.a && !ok ? '<em class="nx-ans">정답</em>' : ''}</button>`; }).join('')}</div>`;
      } else {
        const ps = q.t === 'short' ? nxParts(q) : null;
        ans = rec ? (typed.join('').trim() ? `<div class="nx-mine"><span class="tiny">내 답</span> ${esc(typed.join(' / '))}</div>` : '') : `<div class="nx-ins">${(ps || ['']).map((p, i) => `${ps ? `<span class="tiny">(${i + 1})</span>` : ''}${q.t === 'essay' ? `<textarea class="inp" data-nxin="${i}" rows="3" spellcheck="false" placeholder="문장으로 써요"></textarea>` : `<input class="inp" data-nxin="${i}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${ps ? `(${i + 1})의 답` : '답을 써요 · Enter 로 채점'}">`}`).join('')}</div><div class="nx-acts"><button class="btn primary big" id="nx-go" type="button">채점하기</button><button class="nx-link" id="nx-give" type="button">모르겠어요</button></div>`;
      }
    }
    let after = '';
    if (rec) {
      const right = q.t === 'mc' ? `${q.a + 1}번` : q.t === 'blank' ? '' : q.t === 'wko' ? q.w.ko : q.t === 'wen' ? q.w.en : q.a.join(' / ');
      after = `<div class="nx-vd ${rec.ok ? 'ok' : 'no'}"><i aria-hidden="true">${rec.ok ? '✓' : '✕'}</i><span>${rec.ok ? (rec.self ? '맞은 걸로 했어요' : '정답이에요') : '아쉬워요'}</span>${!rec.ok && right ? `<small>정답 ${esc(right)}</small>` : ''}</div>
        ${!rec.ok && q.t !== 'mc' && typed.join('').trim() ? '<button class="nx-link" data-nxself type="button">내 답도 맞아요</button>' : ''}
        ${q.exp || (q.w && q.w.ex) ? `<div class="explain nx-exp"><b>해설</b><br>${q.w ? `${esc(q.w.ex)}<br><span class="tiny">${esc(q.w.exKo || '')}</span>${q.w.extra ? `<br>${esc(q.w.extra)}` : ''}` : nxRich(q.exp)}</div>` : ''}`;
    }
    return { psg, side: `<div class="card nx-qc">${meta}${stem}${ans}</div>${after}` };
  }
  function nxBindQ(q, submit) {
    $$('main [data-nxp]').forEach((b) => (b.onclick = () => submit(+b.dataset.nxp === q.a, +b.dataset.nxp)));
    const ins = $$('main [data-nxin]'), go = $('#nx-go'), gv = $('#nx-give');
    const grade = () => { const v = ins.map((x) => x.value); if (!v.some((x) => x.trim())) { if (ins[0]) ins[0].focus(); return; } if (q.t === 'wen' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(v[0])) return toast('한글 자판이에요. 영어로 바꿔서 써요'); submit(nxCheck(q, v), v.join(' ‖ ')); };
    if (go) go.onclick = grade; if (gv) gv.onclick = () => submit(false, '');
    ins.forEach((x, k) => (x.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); e.stopPropagation(); if (k < ins.length - 1) ins[k + 1].focus(); else grade(); } }));
    if (ins[0] && matchMedia('(hover: hover)').matches) setTimeout(() => ins[0].focus({ preventScroll: true }), 40);
  }
  const nxLast = (id) => nxS().done.filter((x) => x.id === id).slice(-1)[0];
  const nxProg = (s) => { const a = nxStore(s), n = s.qs.length, d = s.qs.filter((q) => a[q.i]).length; return { n, d, ok: s.qs.filter((q) => (a[q.i] || {}).ok).length }; };
  const nxWdGot = (m, id) => { const r = nxS().wd[`${m}:${id}`]; return !!r && r.s >= (r.w ? 2 : 1); };
  const nxTime = (ms) => { if (!ms || ms > 3 * 3600e3) return ''; const m = Math.floor(ms / 60000), s = Math.round((ms % 60000) / 1000); return m ? `${m}분 ${s}초` : `${s}초`; };
  function nxStart(id, back) { if (!NXSETS[id] && /^ls:/.test(id)) nxLesson(id.slice(3)); const s0 = NXSETS[id]; if (!s0) return toast('이 시험은 아직 준비 중이에요');
    if (s0.kind === 'lesson') { const x = nxS(); if (s0.date !== nxDay(nxNow()) && !nxLast(id)) return toast('이 시험은 닫혔어요'); if (!x.lq[id]) { x.lq[id] = s0.qs.map((q) => [q.i, q.perm, q.g]); const ks = Object.keys(x.lq).sort(); for (const k of ks.slice(0, -12)) { delete x.lq[k]; delete x.la[k]; } save('nx'); } }
    UI.tab = back || 'exam'; UI.run = { kind: NXSETS[id].kind === 'words' ? 'nxw' : 'nx', id, back: back || 'exam' }; render(); window.scrollTo(0, 0); }
  function nxFinish(s, ok, n) {
    const x = nxS(), st = (x.st[s.id] = x.st[s.id] || {}); if (st.fin) return; const at = Date.now(); st.fin = at;
    x.done.push({ id: s.id, title: s.title, kind: s.kind, ok, n, at, ms: st.t0 ? at - st.t0 : 0 }); if (x.done.length > 80) x.done = x.done.slice(-80);
    let hw = false; for (const h of S.hw || []) if (h.nx === s.id && !h.done) { h.done = true; h.doneAt = at; hw = true; }
    save('nx', ...(hw ? ['hw'] : []));
    if (!RM() && ok / n >= 0.6) setTimeout(() => boom(innerWidth / 2, innerHeight * 0.35, ok === n ? 3 : 1), 200);
  }
  function nxTop(s, k, n, sub, bar, extra = '') {
    const r = UI.run;
    return `<div class="nx-top"><button class="nx-x" data-nxexit type="button" aria-label="나가기">‹</button><div class="nx-tt"><b>${esc(s.title)}</b><span>${esc(sub)}</span></div><span class="nx-cnt num"><b>${k}</b> / ${n}</span>${extra}</div><div class="nx-bar" role="progressbar" aria-valuenow="${Math.round(bar * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${bar * 100}%"></i></div>`;
  }
  function nxRun() {
    const r = UI.run, s = NXSETS[r.id]; if (!s) { UI.run = null; return examView(); }
    const x = nxS(), store = nxStore(s, r), qs = r.only ? s.qs.filter((q) => r.only.includes(q.i)) : s.qs, n = qs.length;
    let cur = r.cur != null && r.cur < n ? r.cur : qs.findIndex((q) => !store[q.i]);
    const dn = qs.filter((q) => store[q.i]).length, sub = r.only ? '틀린 것만 다시' : s.sub || (s.subj ? NX_SN[s.subj] : '');
    if (cur < 0) {
      const ok = qs.filter((q) => store[q.i].ok).length;
      if (!r.tmp) nxFinish(s, ok, n);
      const st = x.st[s.id] || {}, tm = r.tmp ? '' : nxTime((st.fin || 0) - (st.t0 || 0));
      const by = {}; for (const q of qs) { const c = (s.kind === 'lesson' ? q.ty || q.g : q.cat) || '기타'; by[c] = by[c] || [0, 0]; by[c][1]++; if (store[q.i].ok) by[c][0]++; }
      const areas = Object.entries(by).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]);
      const bars = areas.length > 1 ? `<div class="nx-areas"><div class="eyebrow">영역별로 맞힌 비율</div><div class="sw-chart">${areas.slice(0, 8).map(([c, [o, t]]) => `<div class="sw-row"><span class="sw-n">${esc(c)}</span><div class="sw-track"><div class="sw-bar" style="width:100%;background:var(--fill)"><i style="width:${(o / t) * 100}%;background:${o === t ? 'var(--blue)' : o / t >= 0.6 ? 'var(--blue-l)' : 'var(--red)'}"></i></div></div><span class="sw-v num"><b>${o}</b> / ${t}</span></div>`).join('')}</div></div>` : '';
      const wr = qs.filter((q) => !store[q.i].ok).length, sc = Math.round((ok / n) * 100);
      return `<div class="nx-wrap">${nxTop(s, n, n, sub, 1)}${doneCard(ok, n, `<b class="nx-score num">${sc}점</b>${tm ? ` · 걸린 시간 ${tm}` : ''}${wr && !r.tmp ? ' · 틀린 문제는 오답 노트에 들어갔어요' : ''}`, `${wr ? `<button class="btn primary big block" data-nxwr type="button">틀린 것만 다시 · ${wr}문제</button>` : ''}<button class="btn big block" data-go="wrong" type="button">오답 노트로</button>${s.kind === 'lesson' ? '' : '<button class="btn big block" data-nxre type="button">처음부터 다시</button>'}<button class="btn big block" data-nxexit type="button">${r.back === 'hw' ? '숙제로' : '시험으로'}</button>`, bars)}</div>`;
    }
    const q = qs[cur], rec = store[q.i], v = nxView(q, rec, s.kind === 'mock' ? q.n || cur + 1 : s.kind === 'lesson' ? cur + 1 : null);
    const fresh = render.nxq !== q.i; render.nxq = q.i;
    const left = qs.some((y, k) => k !== cur && !store[y.i]);
    const omr = r.omr ? `<div class="card nx-omr"><div class="nb-g">${qs.map((y, k) => `<button class="nb ${store[y.i] ? (store[y.i].ok ? 'ok' : 'no') : ''} ${k === cur ? 'cur' : ''}" data-nxj="${k}" type="button">${k + 1}</button>`).join('')}</div></div>` : '';
    const cta = rec ? `<div class="cta-bar"><button class="btn primary big block" id="nx-next" type="button">${left ? '다음 문제' : '결과 보기'}</button></div>` : '';
    const side = v.side + (!rec && /^w(ko|en)$/.test(q.t) ? '<div class="nx-acts"><button class="nx-link" id="nx-give" type="button">모르겠어요</button></div>' : '');
    return `<div class="nx-wrap ${v.psg ? 'wide' : ''}">${nxTop(s, cur + 1, n, sub, dn / n, `<button class="btn sm ${r.omr ? 'soft' : ''}" data-nxomr type="button" aria-expanded="${!!r.omr}">${r.omr ? '접기' : '전체 문제 보기'}</button>`)}${omr}
      ${v.psg ? `<div class="nx-split ${fresh ? 'nx-in' : ''}">${v.psg}<div class="nx-side">${side}</div></div>` : `<div class="nx-one ${fresh ? 'nx-in' : ''}">${side}</div>`}${cta}</div>`;
  }
  function nxBind() {
    const r = UI.run;
    $$('[data-nx]').forEach((b) => (b.onclick = () => nxStart(b.dataset.nx, UI.tab === 'hw' ? 'hw' : 'exam')));
    $$('[data-nxu]').forEach((b) => (b.onclick = () => { UI.nxUnit = b.dataset.nxu || null; render(); window.scrollTo(0, 0); }));
    $$('[data-nxs]').forEach((b) => (b.onclick = () => { UI.nxSubj = b.dataset.nxs; UI.nxUnit = null; render(); }));
    $$('[data-nxexit]').forEach((b) => (b.onclick = () => { const bk = (UI.run && UI.run.back) || 'exam'; UI.run = null; UI.tab = bk; render(); window.scrollTo(0, 0); }));
    if (!r || (r.kind !== 'nx' && r.kind !== 'nxw')) return;
    const s = NXSETS[r.id]; if (!s) return;
    if (r.kind === 'nxw') return nxwBind(s);
    const x = nxS(), store = nxStore(s, r), qs = r.only ? s.qs.filter((q) => r.only.includes(q.i)) : s.qs;
    const om = $('[data-nxomr]'); if (om) om.onclick = () => { r.omr = !r.omr; render(); };
    $$('[data-nxj]').forEach((b) => (b.onclick = () => { r.cur = +b.dataset.nxj; render(); }));
    const re = $('[data-nxre]'); if (re) re.onclick = () => { for (const q of s.qs) delete x.a[q.i]; delete x.st[s.id]; save('nx'); UI.run = { kind: 'nx', id: s.id, back: r.back }; render(); window.scrollTo(0, 0); };
    const wr = $('[data-nxwr]'); if (wr) wr.onclick = () => { UI.run = { kind: 'nx', id: s.id, back: r.back, only: qs.filter((q) => !store[q.i].ok).map((q) => q.i), tmp: {} }; render(); window.scrollTo(0, 0); };
    const cur = r.cur != null && r.cur < qs.length ? r.cur : qs.findIndex((q) => !store[q.i]); const q = qs[cur]; if (!q) return;
    const nx = $('#nx-next'); if (nx) nx.onclick = () => { const k = qs.findIndex((y, j) => j > cur && !store[y.i]); r.cur = k >= 0 ? k : qs.findIndex((y) => !store[y.i]); if (r.cur < 0) r.cur = null; render(); window.scrollTo(0, 0); };
    const self = $('[data-nxself]'); if (self) self.onclick = () => { const store = nxStore(s, r); store[q.i] = { ...store[q.i], ok: true, self: 1 }; const wid = 'nx:' + q.i; if (S.wrong && S.wrong[wid]) clearWrong(wid); save('nx'); render(); };
    if (store[q.i]) return;
    r.cur = cur;
    nxBindQ(q, (ok, v) => {
      const store = nxStore(s, r), x = nxS();  // 누를 때 다시 찾아요 (서버 맞춤 뒤 옛 기록에 적지 않게 10/26)
      store[q.i] = { ok, v, at: Date.now() };
      if (!r.tmp) { const st = (x.st[s.id] = x.st[s.id] || {}); if (!st.t0) st.t0 = Date.now(); }
      const wid = 'nx:' + q.i;
      if (!ok) addWrong(wid, { src: 'nx', qi: q.i, set: s.id, subj: q.subj || s.subj, subjName: NX_SN[q.subj || s.subj] || '영어', area: s.kind === 'mock' ? s.title : `${(NXU[s.unit || (NXSETS[(NXQ[q.i] || {}).set] || {}).unit] || {}).code || ''} ${q.cat || ''}`.trim(), sub: plain(q.q).slice(0, 40), title: `${s.title} ${(q.n || s.qs.indexOf(q) + 1)}번` });
      else { gotIt(wid); if (S.wrong && S.wrong[wid]) clearWrong(wid); }
      if (ok) { UI.jgRun = (UI.jgRun || 0) + 1; ding(UI.jgRun); } else UI.jgRun = 0;
      save('nx'); render();
      if (innerWidth < 900) { const vd = $('main .nx-vd'); if (vd) vd.scrollIntoView({ block: 'center', behavior: RM() ? 'auto' : 'smooth' }); }
    });
  }
  // 단어 시험 (주아): 틀린 단어는 몇 장 뒤에 또 나오고, 한 번 틀린 단어는 두 번 연달아 맞혀야 외운 걸로 쳐요
  function nxwRun() {
    const r = UI.run, s = NXSETS[r.id], m = s.mode, x = nxS(), W = s.qs, got = W.filter((q) => nxWdGot(m, q.w.id)).length;
    if (!r.q) r.q = shuffle(W.filter((q) => !nxWdGot(m, q.w.id)).map((q) => q.i));
    const sub = (s.sub || '') + ' · 틀린 단어는 또 나와요';
    if (got === W.length && r.phase !== 'wrong') {
      const ok = W.filter((q) => !(x.wd[`${m}:${q.w.id}`] || {}).w).length;
      nxFinish(s, ok, W.length);
      const st = x.st[s.id] || {}, tm = nxTime((st.fin || 0) - (st.t0 || 0));
      return `<div class="nx-wrap">${nxTop(s, got, W.length, sub, 1)}${doneCard(ok, W.length, `${W.length}개 다 외웠어요${tm ? ` · 걸린 시간 ${tm}` : ''} · 한 번에 맞힌 단어 ${ok}개`, `<button class="btn primary big block" data-nxre type="button">처음부터 한 판 더</button><button class="btn big block" data-go="wrong" type="button">오답 노트로</button><button class="btn big block" data-nxexit type="button">${r.back === 'hw' ? '숙제로' : '시험으로'}</button>`)}</div>`;
    }
    const id = r.phase === 'wrong' ? r.last : r.q[0], q = NXQ[id] ? NXQ[id].q : null;
    if (!q) { r.q = null; return nxwRun(); }
    const rec = x.wd[`${m}:${q.w.id}`], again = rec && rec.w && rec.s === 1;
    const v = nxView(q, null), fresh = render.nxq !== q.i + r.phase; render.nxq = q.i + r.phase;
    let body;
    if (r.phase === 'wrong') body = `<div class="card nx-qc"><div class="nx-meta"><span class="tag">${esc(q.cat)}</span></div><div class="nx-word">${esc(q.q)}</div></div>
      <div class="nx-vd no"><i aria-hidden="true">✕</i><span>정답은 ${esc(m === 'ko' ? q.w.ko : q.w.en)}</span>${r.v ? `<small>내 답 ${esc(r.v)}</small>` : ''}</div>
      <div class="explain nx-exp">${esc(q.w.ex || '')}<br><span class="tiny">${esc(q.w.exKo || '')}</span></div>
      ${m === 'en' ? `<div class="card nx-qc"><div class="tiny" style="margin-bottom:8px">손으로 한 번 따라 써야 다음으로 넘어가요</div><div class="nx-in-row"><input class="inp" id="nxw-copy" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(q.w.en)} 따라 쓰기"><button class="btn primary" id="nxw-cgo" type="button">썼어요</button></div></div>` : `<button class="nx-link" id="nxw-mine" type="button">내 답도 같은 뜻이에요</button><div class="cta-bar"><button class="btn primary big block" id="nx-next" type="button">다음 단어</button></div>`}`;
    else body = `${again ? '<div class="nx-again">한 번 더 맞히면 외운 걸로 쳐요</div>' : rec && rec.w ? '<div class="nx-again">틀렸던 단어예요</div>' : ''}${v.side}${m === 'en' ? `<div class="nx-acts"><button class="nx-link" id="nxw-hint" type="button">첫 글자 보기</button>${r.hint ? `<span class="nx-hint num">${esc(q.w.en.split('').map((c, i) => (c === ' ' ? ' ' : i < r.hint ? c : '_')).join(' '))}</span>` : ''}<button class="nx-link" id="nx-give" type="button">모르겠어요</button></div>` : '<div class="nx-acts"><button class="nx-link" id="nx-give" type="button">모르겠어요</button></div>'}`;
    return `<div class="nx-wrap">${nxTop(s, got, W.length, sub, got / W.length)}<div class="nx-one ${fresh ? 'nx-in' : ''}">${body}</div></div>`;
  }
  function nxwBind(s) {
    const r = UI.run, m = s.mode, x = nxS();
    const re = $('[data-nxre]'); if (re) re.onclick = () => { for (const q of s.qs) delete x.wd[`${m}:${q.w.id}`]; delete x.st[s.id]; save('nx'); UI.run = { kind: 'nxw', id: s.id, back: r.back }; render(); };
    const id = r.phase === 'wrong' ? r.last : (r.q || [])[0], q = NXQ[id] && NXQ[id].q; if (!q) return;
    const k = `${m}:${q.w.id}`;
    const answer = (ok, v) => {
      const x = nxS();  // 누를 때 다시 찾아요
      if (ok && r.hint) ok = false;  // 힌트 보고 맞힌 건 한 번 더
      const w = x.wd[k] || { s: 0, w: 0 }; if (ok) w.s++; else { w.s = 0; w.w++; } w.at = Date.now(); x.wd[k] = w;
      const st = (x.st[s.id] = x.st[s.id] || {}); if (!st.t0) st.t0 = Date.now();
      const wid = 'nx:' + q.i;
      if (!ok) addWrong(wid, { src: 'nx', qi: q.i, set: s.id, subj: 'eng', subjName: '영어', area: '단어 시험', sub: `${q.w.en} · ${q.w.ko}`, title: `${q.w.en} (${m === 'ko' ? '뜻 쓰기' : '영어 쓰기'})` });
      else if (nxWdGot(m, q.w.id) && S.wrong && S.wrong[wid]) clearWrong(wid);
      r.q.shift(); r.last = q.i; r.hint = 0;
      if (ok) { if (!nxWdGot(m, q.w.id)) r.q.splice(Math.min(r.q.length, 3), 0, q.i); UI.jgRun = (UI.jgRun || 0) + 1; ding(UI.jgRun); r.phase = 'ask'; }
      else { UI.jgRun = 0; r.q.splice(Math.min(r.q.length, 3), 0, q.i); r.phase = 'wrong'; r.v = v; }
      if (!r.q.length) r.q = null;
      save('nx'); render();
    };
    if (r.phase !== 'wrong') nxBindQ(q, (ok, v) => answer(ok, String(v || '').trim()));
    const h = $('#nxw-hint'); if (h) h.onclick = () => { r.hint = Math.min((r.hint || 0) + 1, q.w.en.length - 1); render(); };
    const nx = $('#nx-next'); if (nx) nx.onclick = () => { r.phase = 'ask'; r.v = ''; render(); };
    const mine = $('#nxw-mine'); if (mine) mine.onclick = () => { const x = nxS(), w = x.wd[k]; w.w = Math.max(0, w.w - 1); w.s = 1; save('nx'); if (nxWdGot(m, q.w.id) && r.q) r.q = r.q.filter((y) => y !== q.i); r.phase = 'ask'; r.v = ''; render(); };
    const cp = $('#nxw-copy'), cg = $('#nxw-cgo');
    if (cp) { setTimeout(() => cp.focus({ preventScroll: true }), 40); const go = () => { if (normEn(cp.value) === normEn(q.w.en)) { r.phase = 'ask'; r.v = ''; render(); } else { cp.classList.remove('shake-x'); void cp.offsetWidth; cp.classList.add('shake-x'); } }; cg.onclick = go; cp.onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.stopPropagation(); go(); } }; }
  }
  // 1~5 로 고르기 · Enter 로 다음 (글자를 쓰는 중에는 숫자를 가로채지 않아요)
  document.addEventListener('keydown', (e) => {
    if (!UI.run || !['nx', 'nxw', 'retry'].includes(UI.run.kind) || $('.sheet') || e.metaKey || e.ctrlKey || e.altKey) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
    if (!typing && /^[1-5]$/.test(e.key)) { const b = $(`main [data-nxp="${+e.key - 1}"], main [data-pick="${UI.run.kind === 'retry' && UI.run.q && UI.run.q.mock ? +e.key : +e.key - 1}"]`); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
    else if (e.key === 'Enter' && !typing) { const n = $('#nx-next') || $('#next'); if (n) { e.preventDefault(); n.click(); } }
  });
  // 시험 탭
  function nxRow(s, opt = {}) {
    const p = nxProg(s), L = nxLast(s.id), words = s.kind === 'words', got = words ? s.qs.filter((q) => nxWdGot(s.mode, q.w.id)).length : 0;
    const d = words ? (got ? `외움 ${got} / ${s.qs.length}` : `${s.qs.length}개 · 뜻·영어 둘 다 외우면 끝`) : L && p.d >= p.n ? `${md(new Date(L.at).toLocaleDateString('sv'))} · ${L.ok} / ${L.n} 맞힘` : p.d ? `${p.d} / ${p.n} 풀었어요 · 이어서 풀어요` : `${p.n}문제`;
    const tag = L ? `<span class="tag blue">${Math.round((L.ok / L.n) * 100)}점</span>` : p.d || got ? '<span class="tag">이어 풀기</span>' : '';
    return `<div class="li btnlike" data-nx="${esc(s.id)}"><div class="ico">${ic(opt.icon || (s.kind === 'mock' ? 'score' : words ? 'books' : 'pencil'))}</div><div class="body"><div class="t">${esc(opt.title || s.title)}</div><div class="d">${esc(opt.d || d)}</div></div>${tag}<span class="chev"></span></div>`;
  }
  function nxTile(u) {
    const parts = ['c', 'q', 'x'].map((p) => { const s = NXSETS[`${u.id}:${p}`]; if (!s) return null; const g = nxProg(s); return { p, g }; }).filter(Boolean);
    const all = parts.reduce((a, x) => a + x.g.n, 0), dn = parts.reduce((a, x) => a + x.g.d, 0), done = all && dn >= all;
    const no = u.subj === 'eng' ? String(u.no) : u.code;
    return `<button class="jgu ${done ? 'done' : ''}" data-nxu="${esc(u.id)}" type="button"><span class="jgu-no ${no.length > 2 ? 'sm' : ''}">${esc(no)}</span><span class="jgu-b"><b>${esc(u.title)}</b><small>${esc(u.sub || '')}</small><span class="jgu-bar">${['c', 'q', 'x'].map((p) => { const z = parts.find((y) => y.p === p); return `<span><i style="width:${z && z.g.n ? Math.round((z.g.d / z.g.n) * 100) : 0}%"></i><em>${nxPartName(u, p)}${z ? ` ${z.g.d}/${z.g.n}` : ' 없음'}</em></span>`; }).join('')}</span></span><span class="jgu-r">${done ? '<span class="tag blue">다 했어요</span>' : dn ? '<span class="tag">이어 하기</span>' : ''}<i class="chev"></i></span></button>`;
  }
  function nxUnitView() {
    const u = NXU[UI.nxUnit]; if (!u) { UI.nxUnit = null; return hwView(); }
    const rows = ['c', 'q', 'x'].map((p) => NXSETS[`${u.id}:${p}`]).filter(Boolean);
    const pd = { c: u.subj === 'eng' ? '단어·숙어 뜻 고르기' : '교과서 핵심 문장의 빈칸 채우기', q: '단원 개념 문제', x: '학교 기출 · 변형 문제를 다 모아서' };
    return `<div class="row between"><button class="btn sm" data-nxu="" type="button">‹ 숙제</button><span class="tiny">${esc(NX_SN[u.subj])} ${esc(u.code)}</span></div>
      <h1 class="h1">${esc(u.code)} ${esc(u.title)}</h1><p class="sub">${esc(u.sub || '')}</p>
      <div class="grid"><section class="card c12"><div class="card-h"><h2>단원 공부</h2><span class="tiny">개념부터 기출까지 차례로 풀어요</span></div><div class="list">${rows.map((s) => nxRow(s, { title: nxPartName(u, s.kind), icon: s.kind === 'c' ? 'bulb' : s.kind === 'q' ? 'pencil' : 'target', d: `${pd[s.kind]} · ${(() => { const g = nxProg(s); return g.d ? `${g.d} / ${g.n} 풀었어요` : `${g.n}문제`; })()}` })).join('')}</div></section>
      ${u.papers.length ? `<section class="card c12"><div class="card-h"><h2>기출 시험지별로</h2><span class="tiny">${u.papers.length}개</span></div><div class="list">${u.papers.map((pp) => nxRow(NXSETS[`${u.id}:x:${pp.id}`], { icon: 'memo' })).join('')}</div></section>` : ''}</div>`;
  }
  function nxRecent() {
    const L = nxS().done.slice(-5).reverse(); if (!L.length) return '';
    return `<section class="card c12"><div class="card-h"><h2>최근 시험</h2><span class="tiny">선생님 리포트에 점수가 가요</span></div><div class="list">${L.map((x) => `<div class="li btnlike" data-nx="${esc(x.id)}"><div class="ico">${ic(x.ok === x.n ? 'trophy' : 'ok')}</div><div class="body"><div class="t">${esc(x.title)}</div><div class="d">${md(new Date(x.at).toLocaleDateString('sv'))}${nxTime(x.ms) ? ' · ' + nxTime(x.ms) : ''}</div></div><b class="num">${x.ok} / ${x.n}</b></div>`).join('')}</div></section>`;
  }
  // 수업 시험: 수업 날 수업 시간이 되면 열리고 그날 밤 12시에 닫혀요. 그 학생 문제를 늘 섞어서, 같은 날은 같은 시험
  // 시험 구성은 처음 열 때 S.nx.lq[세트] = [[문항, 보기순서, 묶음]] 으로 남겨서 다시 봐도 같아요
  const nxNow = () => { try { if (localStorage.getItem('mu:offline') === '1') { const t = new Date(localStorage.getItem('mu:now') || '').getTime(); if (t) return t; } } catch (e) {} return Date.now(); };  // mu:now 는 테스트 때만
  const nxDay = (ms) => new Date(ms).toLocaleDateString('sv');
  const nxRng = (s) => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  const nxShuf = (a, rnd) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const nxSubjOf = (i) => (NXSETS[(NXQ[i] || {}).set] || {}).subj || 'eng';
  const nxPerm = (q, perm, g) => ({ ...q, ...(perm && q.t === 'mc' && perm.length === q.ch.length ? { ch: perm.map((k) => q.ch[k]), a: perm.indexOf(q.a) } : {}), perm: perm || null, g: g || '', subj: nxSubjOf(q.i) });
  // 천일문(지원) · 그래머 책 덮고(주아) 문제도 시험 문항 꼴로 (오답 노트에서 다시 풀 수 있게 NXQ 에 넣어 둬요)
  const NX_CH = !(NXD.subjects || []).length && !NXD.words && TUTOR ? CH_UNITS.flatMap((u) => (u.questions || []).map((z, k) => [u, k, z]).filter(([, , z]) => z && Array.isArray(z.choices) && z.choices.length > 1 && z.answer != null).map(([u, k, z]) => ({ i: `${u.v2 ? 'ch2' : 'ch'}:${u.unit}:${k}`, t: 'mc', q: z.q, p: z.passage || '', ch: z.choices, a: +z.answer, exp: z.exp || '', cat: `Unit ${u.unit} ${z.type || ''}`.trim(), ty: z.type, unit: u.unit }))) : [];
  const NX_JG = NXD.words ? JG.flatMap((u) => jgQs(u, 4).map((z) => { const a = z.choices ? z.choices.findIndex((c) => jgNorm(c) === jgNorm((z.answers || [])[0])) : -1; return { i: `jg4:${u.no}:${z.id}`, t: a >= 0 ? 'mc' : 'short', q: z.prompt, ch: a >= 0 ? z.choices : undefined, a: a >= 0 ? a : z.answers || [], exp: z.why || '', cat: `Unit ${u.no}${z.tag ? ' ' + z.tag : ''}`, jg: z, unit: u.no }; })) : [];
  for (const q of [...NX_CH, ...NX_JG]) if (!NXQ[q.i]) NXQ[q.i] = { q, set: 'ls' };
  const nxStore = (s, r) => (r && r.tmp) || (s.kind === 'lesson' ? (nxS().la[s.id] = nxS().la[s.id] || {}) : nxS().a);
  // 수업 시간: 오늘 수업이 있고 시간이 됐으면 열림, 아니면 다음 수업 날짜·시간
  function nxSlot() {
    const c = cls(), now = nxNow(), t = nxDay(now);
    if (!(c.wd || []).length && !c.list.some((l) => l.plan)) return null;
    const at = (x) => new Date(`${x.date}T${x.time || '00:00'}:00`).getTime();
    const L = upcoming(c, t, 8).filter((x) => !x.off), td = L.find((x) => x.date === t);
    if (td && now >= at(td)) return { open: true, date: t, time: td.time };
    const nx = td || L.find((x) => x.date > t);
    return nx ? { open: false, date: nx.date, time: nx.time, left: at(nx) - now } : null;
  }
  const nxLeft = (ms) => { const m = Math.max(1, Math.ceil(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60; return d ? `${d}일 ${h}시간` : h ? `${h}시간 ${mm}분` : `${mm}분`; };
  // 섞기: 최근 수업에서 배운 단원은 세 배로 자주, 묶음마다 몫을 정하고 모자라면 다른 묶음에서 채워요
  // 달 마지막 수업(일주일 뒤가 다음 달)은 월말 평가: 그달 배운 것을 30문제로
  const nxMonthly = (date) => ymOf(addD(date, 7)) !== ymOf(date);
  function nxMix(date) {
    const rnd = nxRng(`${ST.name || ''}:${date}`), Ls = lsnSorted().filter((l) => l.date <= date);
    const txt = (l) => [l.lesson, l.hw, l.book, ...(l.units || []).map((u) => 'Unit ' + u)].filter(Boolean).join(' ');
    const hotT = (nxMonthly(date) ? Ls.filter((l) => ymOf(l.date) === ymOf(date)) : Ls.slice(0, 2)).map(txt).join(' '), allT = Ls.map(txt).join(' ');
    const nums = (s, re) => { const o = new Set(); for (const m of String(s).matchAll(re)) { const a = +m[1], b = m[2] ? +m[2] : a; for (let k = a; k <= Math.min(b, a + 40); k++) o.add(k); } return o; };
    const pick = (pool, n) => pool.map((p) => ({ p, k: Math.pow(rnd(), 1 / (p.w || 1)) })).sort((a, b) => b.k - a.k).slice(0, n).map((z) => z.p);
    const G = [];
    const SB = NXD.subjects || [];
    if (SB.length) {
      const hot = (u) => (u.code && hotT.includes(u.code)) || (u.subj === 'eng' && nums(hotT, /(\d+)\s*과/g).has(+u.no));
      const qOk = (q) => q.t !== 'essay';
      for (const sb of SB) {
        const pool = (parts) => sb.units.flatMap((u) => parts.flatMap((p) => (u.parts[p] || []).filter(qOk).map((q) => ({ q, w: hot(u) ? 3 : 1 }))));
        if (sb.key === 'eng') { G.push({ g: '영어 단어', n: 4, pool: pool(['c']) }); G.push({ g: '영어 문제', n: 10, pool: [...pool(['q', 'x']), ...(NXD.mocks || []).flatMap((m) => m.qs.filter(qOk).map((q) => ({ q, w: 1 })))] }); }
        else G.push({ g: NX_SN[sb.key] || sb.name, n: 3, pool: pool(['c', 'q', 'x']) });
      }
    } else if (NXD.words) {
      const gu = (ls) => new Set(ls.flatMap((l) => (l.gram || []).map((g) => +g.unit)));
      const hotU = gu(Ls.slice(0, 2)), allU = gu(Ls);
      const jg = NX_JG.filter((q) => !allU.size || allU.has(+q.unit) || hotU.has(+q.unit));
      G.push({ g: '그래머', n: 10, pool: (jg.length ? jg : NX_JG).map((q) => ({ q, w: hotU.has(+q.unit) ? 3 : 1 })) });
      G.push({ g: '단어', n: 10, pool: (NXD.words.words || []).map((w) => ({ q: NXQ[`jw:${rnd() < 0.5 ? 'ko' : 'en'}:${w.id}`].q, w: 1 })) });
    } else {
      const re = /Unit\s*(\d+)(?:\s*[~\-–]\s*(\d+))?/gi, hotU = nums(hotT, re), allU = nums(allT, re);
      const lv = cls().level === 'basic' && !CH_UNITS.some((u) => u.v2) ? NX_CH.filter((q) => EASY.includes(q.ty)) : NX_CH, base = lv.length >= 20 ? lv : NX_CH, ch = base.filter((q) => allU.has(+q.unit));
      G.push({ g: '천일문', n: 16, pool: (ch.length ? ch : base).map((q) => ({ q, w: hotU.has(+q.unit) ? 3 : 1 })) });
      G.push({ g: '모의 빈칸', n: 4, pool: (NXD.mocks || []).flatMap((m) => m.qs.map((q) => ({ q, w: 1 }))) });
    }
    if (nxMonthly(date)) for (const x of G) x.n = Math.round(x.n * 1.5);
    const total = G.reduce((a, x) => a + x.n, 0), out = [], seen = new Set();
    const take = (x, n) => { for (const p of pick(x.pool.filter((p) => p.q && !seen.has(p.q.i)), n)) { seen.add(p.q.i); out.push({ q: p.q, g: x.g }); } };
    for (const x of G) take(x, x.n);
    for (const x of G) if (out.length < total) take(x, total - out.length);
    const keep = (q) => q.ch.some((c) => /개$|모두|없|^\s*[①-⑤]/.test(String(c))) || q.ch.every((c) => /^\s*\(?[a-eA-E]\)?\s*$/.test(String(c)));  // 보기 순서가 뜻이 있으면 그대로
    return nxShuf(out, rnd).map(({ q, g }) => nxPerm(q, q.t === 'mc' && q.ch && !keep(q) ? nxShuf(q.ch.map((_, k) => k), rnd) : null, g));
  }
  function nxLesson(date) {
    const id = 'ls:' + date; if (NXSETS[id]) return NXSETS[id];
    const saved = nxS().lq[id];
    const qs = saved ? saved.map(([i, perm, g]) => (NXQ[i] ? nxPerm(NXQ[i].q, perm, g) : null)).filter(Boolean) : nxMix(date);
    if (!qs.length) return null;
    const [, m, d] = date.split('-').map(Number), mix = {}; for (const q of qs) mix[q.g || '기타'] = (mix[q.g || '기타'] || 0) + 1;
    return (NXSETS[id] = { id, title: nxMonthly(date) ? `${m}월 월말 평가` : `${m}/${d} 수업 시험`, sub: `${md(date)} ${nxMonthly(date) ? '월말 평가' : '수업 시험'}`, subj: 'eng', kind: 'lesson', date, qs, mix });
  }
  const nxMixTxt = (s) => Object.entries(s.mix || {}).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(' · ');
  function examView() {
    const sl = nxSlot(), x = nxS(), t = nxDay(nxNow());
    let main;
    if (!sl) main = `<div class="card empty c12">${gh('sleepy', 'gh-empty')}<b>수업 날이 정해지면 시험이 열려요</b><span>선생님이 수업 요일을 넣으면 여기에 나와요</span></div>`;
    else if (!sl.open) main = `<section class="card c12 nx-lock"><div class="card-h"><h2>${sl.date === t ? '오늘 수업 시험' : '다음 수업 시험'}</h2><span class="tag">아직 잠겨 있어요</span></div>
      <div class="li"><div class="ico">${ic('clock')}</div><div class="body"><div class="t">${sl.date === t ? '오늘' : `${md(sl.date)}(${WDK[new Date(sl.date + 'T00:00:00').getDay()]})`} ${esc(timeKo(sl.time) || '')}에 열려요</div><div class="d">${nxLeft(sl.left)} 남았어요</div></div></div>
      <p class="tiny nx-lock-p">수업 시간이 되면 배운 것을 섞어서 20문제쯤 나와요. 미리 연습하고 싶으면 숙제 탭 아래 「따로 공부」에서 풀어요</p></section>`;
    else {
      const s = nxLesson(sl.date);
      if (!s) main = `<div class="card empty c12">${gh('sleepy', 'gh-empty')}<b>시험 문제를 준비하고 있어요</b><span>선생님이 곧 넣어 줄 거예요</span></div>`;
      else {
        const g = nxProg(s), L = nxLast(s.id), fin = L && g.d >= g.n;
        main = `<section class="card c12 nx-open"><div class="card-h"><h2>오늘 수업 시험</h2><span class="tag ${fin ? '' : 'blue'}">${fin ? '다 풀었어요' : '열렸어요'}</span></div>
          <div class="li"><div class="ico">${ic(fin ? (L.ok === L.n ? 'trophy' : 'ok') : 'pencil')}</div><div class="body"><div class="t">${esc(s.title)} · ${g.n}문제</div><div class="d">${esc(nxMixTxt(s))}</div></div>${fin ? `<b class="num">${L.ok} / ${L.n}</b>` : g.d ? `<span class="tag">${g.d} / ${g.n}</span>` : ''}</div>
          <p class="tiny nx-lock-p">${fin ? `${nxTime(L.ms) ? '걸린 시간 ' + nxTime(L.ms) + ' · ' : ''}점수는 선생님 리포트에 가요` : '한 문제씩 바로 채점돼요. 오늘 밤 12시까지 풀 수 있어요'}</p>
          <button class="btn ${fin ? '' : 'primary'} big block" data-nx="${esc(s.id)}" type="button">${fin ? '결과 다시 보기' : g.d ? '이어서 풀기' : '시험 시작하기'}</button></section>`;
      }
    }
    const today0 = sl && sl.open ? 'ls:' + sl.date : '';
    const ids = [...new Set([...x.done.filter((d) => d.kind === 'lesson').map((d) => d.id), ...Object.keys(x.lq)])].filter((id) => id !== today0 && id.slice(3) < t).sort().reverse().slice(0, 12);
    const past = ids.map((id) => {
      const L = nxLast(id), s = nxLesson(id.slice(3)), [, m, d] = id.slice(3).split('-').map(Number);
      if (L) return `<div class="li btnlike" data-nx="${esc(id)}"><div class="ico">${ic(L.ok === L.n ? 'trophy' : 'ok')}</div><div class="body"><div class="t">${m}/${d} 수업 시험</div><div class="d">${esc(s ? nxMixTxt(s) : '')}${nxTime(L.ms) ? ' · ' + nxTime(L.ms) : ''}</div></div><b class="num">${L.ok} / ${L.n}</b><span class="chev"></span></div>`;
      const g = s ? nxProg(s) : { d: 0, n: 0 };
      return `<div class="li is-done"><div class="ico">${ic('clock')}</div><div class="body"><div class="t">${m}/${d} 수업 시험</div><div class="d">끝까지 못 풀고 닫혔어요 · ${g.d} / ${g.n}</div></div></div>`;
    }).join('');
    return `<h1 class="h1">시험</h1><p class="sub">수업 시간이 되면 열려요. 배운 것을 늘 섞어서 내요</p><div class="grid">${main}${past ? `<section class="card c12"><div class="card-h"><h2>지난 수업 시험</h2><span class="tiny">점수는 선생님 리포트에 가요</span></div><div class="list">${past}</div></section>` : ''}</div>`;
  }
  // 잠긴 시험은 열릴 시간이 되면 저절로 열려요 (시험 탭을 보고 있을 때만 다시 그려요)
  let nxK = '';
  setInterval(() => { if (UI.run || UI.tab !== 'exam' || document.hidden || $('.sheet')) return; const sl = nxSlot(), k = sl ? `${sl.open}${sl.date}${sl.open ? '' : Math.ceil(sl.left / 60000)}` : ''; if (nxK && k !== nxK) render(); nxK = k; }, 15000);
  // 따로 공부: 숙제 탭 「전체 목록」 아래. 단원·실전·단어·빈칸 세트를 언제든
  function nxLib() {
    const SB = NXD.subjects || [];
    let b = '';
    if (SB.length) {
      if (!SB.some((x) => x.key === UI.nxSubj)) UI.nxSubj = SB[0].key;
      const sb = SB.find((x) => x.key === UI.nxSubj);
      b += `<div class="seg" style="max-width:420px;margin-bottom:12px">${SB.map((x) => `<button type="button" class="${x.key === sb.key ? 'on' : ''}" data-nxs="${x.key}">${esc(x.name)}</button>`).join('')}</div>`;
      if (sb.key === 'eng' && (NXD.mocks || []).length) b += `<div class="eyebrow nx-lh">실전 시험 · 학교 시험처럼 25문제</div><div class="list">${NXD.mocks.map((m) => nxRow(NXSETS[m.id], { d: (() => { const L = nxLast(m.id), g = nxProg(NXSETS[m.id]); return L && g.d >= g.n ? `${md(new Date(L.at).toLocaleDateString('sv'))} · ${L.ok} / ${L.n} 맞힘${nxTime(L.ms) ? ' · ' + nxTime(L.ms) : ''}` : g.d ? `${g.d} / ${g.n} 풀었어요 · 이어서 풀어요` : `${m.sub || ''} · ${g.n}문제`; })() })).join('')}</div>`;
      b += `<div class="eyebrow nx-lh">단원별 · ${esc(sb.name)} ${sb.units.length}단원</div><div class="jgu-l">${sb.units.map(nxTile).join('')}</div>`;
    } else {
      if ((NXD.mocks || []).length) b += `<div class="eyebrow nx-lh">고1 모의고사 빈칸추론 · 한 문제씩 바로 채점</div><div class="list">${NXD.mocks.map((m) => nxRow(NXSETS[m.id])).join('')}</div>`;
      if (NXD.words) b += `<div class="eyebrow nx-lh">${esc(NXD.words.title || '단어')}${NXD.words.when ? ' · ' + esc(NXD.words.when) : ''}</div><p class="tiny" style="margin:0 0 8px">틀린 단어는 몇 장 뒤에 또 나와요. 한 번 틀린 단어는 두 번 연달아 맞혀야 외운 걸로 쳐요</p><div class="list">${['jw:ko', 'jw:en'].map((id) => nxRow(NXSETS[id])).join('')}</div>`;
    }
    return b ? `<section class="card c12 nx-lib"><div class="card-h"><h2>따로 공부</h2><span class="tiny">시험 문제를 언제든 골라서 풀어요</span></div>${b}</section>` : '';
  }
  // 선생님: 리포트 날짜까지 7일 동안 끝낸 시험
  function nxRecs(n, date) {
    const d = dRowD(n), L = (d && d.nx && d.nx.done) || [], t0 = new Date(addD(date, -6) + 'T00:00:00').getTime(), t1 = new Date(addD(date, 1) + 'T00:00:00').getTime();
    return L.filter((x) => x.at >= t0 && x.at < t1).sort((a, b) => b.at - a.at);
  }
  function autoScore(n) {
    const L = nxRecs(n, drOf(n).date || today()), r = L.find((x) => x.kind === 'lesson') || L.find((x) => x.kind === 'mock' || x.kind === 'x' || x.kind === 'words') || L[0];
    return r ? { score: String(r.ok), total: String(r.n), title: r.title } : null;
  }
  const nxPicks = (n) => ((D.nxList || {})[n] || []).map((x) => ({ ...x, t: `${x.title} 풀기` }));
  const nxIdOf = (n, t) => (nxPicks(n).find((x) => x.t === t) || {}).id;

  // ───────── 과외 수업: 수업일자 · 숙제 · 어머니께 리포트 (과외 학생만) ─────────
  // S.cls = { wd: [요일 0=일], time, level: basic|std, off: [쉬는 날], mtot: { '2026-10': 9 }, list: [{ id, date, plan?, nth, book, units, gram: [{ unit, steps }], lesson, hw, score, scoreTotal, progress, comment, sent }] }
  // 회차: count 'month' 이면 그 달 몇 번째 수업(윤건·주아, 달마다 횟수가 달라요), 아니면 total 회 묶음(지원 4회)
  const WDK = ['일', '월', '화', '수', '목', '금', '토'];
  const wdName = (d) => WDK[new Date(d + 'T00:00:00').getDay()] + '요일';
  const timeKo = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${m ? ' ' + m + '분' : ''}`; };
  const LSV = { basic: ['기본', '빈칸·해석·배열 문제만'], std: ['정윤 수준', '어법·고르기까지 전부'] };
  const EASY = ['빈칸', '해석', '배열'];
  const LS0 = ST.lesson || {};
  const MONTHLY = LS0.count === 'month';
  const ymOf = (d) => String(d).slice(0, 7);
  function cls() { if (!S.cls) S.cls = { wd: LS0.wd || [], time: LS0.time || '', level: LS0.level || 'std', off: [], mtot: { ...(LS0.mtot || {}) }, list: (LS0.list || []).map((x, i) => ({ id: 'l' + i, ...x })) }; const c = S.cls; c.off = c.off || []; c.mtot = c.mtot || {}; seedFix(LS0, c.list); return c; }
  function qIds(un) { const all = (un.questions || []).map((_, k) => k); if (!TUTOR || cls().level !== 'basic' || un.v2) return all; const e = all.filter((k) => EASY.includes(un.questions[k].type)); return e.length >= 3 ? e : all; }
  const lsnDone = (l) => !l.plan && !!(l.held || l.lesson || (l.units || []).length || (l.gram || []).length || l.sent);
  const lessonWhen = (l) => `${md(l.date)}(${WDK[new Date(l.date + 'T00:00:00').getDay()]})${l.time ? ' ' + timeKo(l.time) : ''}`;
  // 앞으로의 수업 날: 매주 요일(쉬는 날 빼고) + 따로 넣은 보강·추가 수업
  function upcoming(c, from, n) {
    const out = [];
    for (let i = 0; i < 70 && out.length < n + 8; i++) { const x = addD(from, i); if (c.wd.includes(new Date(x + 'T00:00:00').getDay())) out.push({ date: x, time: c.time, weekly: true, off: c.off.includes(x) }); }
    for (const l of c.list) if (l.plan && l.date >= from && !out.some((o) => o.date === l.date && !o.off)) out.push({ date: l.date, time: l.time || c.time, extra: l.id });
    return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);
  }
  function nextLesson(c = cls()) {
    const t = today(), todayDone = c.list.some((l) => l.date === t && lsnDone(l));
    return upcoming(c, todayDone ? addD(t, 1) : t, 12).filter((x) => !x.off && !c.list.some((l) => l.date === x.date && lsnDone(l)))[0] || null;
  }
  const lsnSorted = (c = cls()) => c.list.filter(lsnDone).sort((a, b) => b.date.localeCompare(a.date));
  const lastLesson = () => lsnSorted().find((l) => l.date <= today());
  function autoNth(date, except) {
    const done = lsnSorted().filter((l) => l.id !== except && l.date <= date);
    if (MONTHLY) return done.filter((l) => ymOf(l.date) === ymOf(date)).length + (+((LS0.monthSeed || {})[ymOf(date)]) || 0) + 1;
    const tot = +LS0.total || 0, prev = done.find((l) => l.nth), base = prev ? +prev.nth : +LS0.nth0 || 0;
    return base ? (tot ? (base % tot) + 1 : base + 1) : '';
  }
  const nthTotal = (date) => (MONTHLY ? cls().mtot[ymOf(date)] || '' : LS0.total || '');
  const cuByNo = (no) => CH_UNITS.find((u) => String(u.unit) === String(no));
  const unitsText = (nos) => { const r = []; for (const n of [...nos].sort((a, b) => a - b)) { const l = r[r.length - 1]; if (l && n === l[1] + 1) l[1] = n; else r.push([n, n]); } return r.map(([a, b]) => (a === b ? a : `${a}~${b}`)).join(', '); };
  const parseUnits = (t) => { const o = []; for (const p of String(t || '').split(/[,\s]+/).filter(Boolean)) { const m = p.match(/^(\d+)(?:[-~](\d+))?$/); if (!m) continue; const a = +m[1], b = +(m[2] || m[1]); for (let i = Math.min(a, b); i <= Math.max(a, b) && o.length < 40; i++) if (cuByNo(i) && !o.includes(i)) o.push(i); } return o; };
  function tutorTasks() {
    const L = lastLesson(); if (!L) return [];
    const nx = nextLesson();
    const cu = (L.units || []).map((no) => {
      const un = cuByNo(no); if (!un) return null;
      const st = (S.eng.ua || {})[uKey(un)] || {}, ids = qIds(un), n = ids.filter((k) => st[k]).length, ok = ids.filter((k) => st[k] && st[k].ok).length;
      return { k: 'cu:' + un.unit, icon: 'eng', t: `천일문 Unit ${un.unit} ${un.title || ''}`.trim(), d: n >= ids.length ? `${ok}/${ids.length} 맞힘` : `${md(L.date)} 수업 · 문제 ${ids.length}개${n ? ` 중 ${n}개 풀었어요` : ''}${nx ? ` · ${md(nx.date)} 수업 전까지` : ''}`, done: n >= ids.length };
    }).filter(Boolean);
    return [...cu, ...jgTasks(L, nx)];
  }
  const lines = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
  function lessonSheet(id) {
    const c = cls(), cur = id ? c.list.find((l) => l.id === id) : null, prev = lsnSorted()[0], books = LS0.books || (LS0.book ? [LS0.book] : []);
    const d0 = cur ? cur.date : today();
    const L = cur || { date: d0, nth: autoNth(d0), book: (prev && prev.book) || LS0.book || '', units: [], gram: [], lesson: '', hw: '', score: '', scoreTotal: '', progress: '', comment: '' };
    const pick = new Set(String(L.book || '').split(' · ').filter(Boolean));
    const g0 = (L.gram || [])[0] || { unit: JG.length ? JG[JG.length - 1].no : 0, steps: [2, 3, 4] };
    sheet(`<h2>${cur ? '수업 기록 고치기' : '수업 적기 · 리포트 쓰기'}</h2><p class="sub">${esc(NM())} 화면의 「수업」과 숙제에 바로 보여요. 「선생님 한마디」는 리포트에만 들어가요</p>
      <div class="row" style="gap:12px"><div class="field" style="flex:2"><label>날짜</label><input class="inp" type="date" id="ls-d" value="${esc(L.date)}"></div><div class="field" style="flex:1"><label>회차</label><input class="inp" id="ls-n" inputmode="numeric" value="${esc(L.nth || '')}"></div>${MONTHLY ? `<div class="field" style="flex:1"><label id="ls-mtl">이달 전체</label><input class="inp" id="ls-mt" inputmode="numeric" placeholder="예) 9" value="${esc(nthTotal(L.date))}"></div>` : ''}</div>
      ${books.length ? `<div class="field"><label>교재 (여러 개 골라도 돼요)</label><div class="chips" id="ls-bk">${[...new Set([...books, ...pick])].map((b) => `<button class="chip sm ${pick.has(b) ? 'on' : ''}" data-bk="${esc(b)}" type="button">${esc(b)}</button>`).join('')}</div></div>` : ''}
      ${CH_UNITS.length ? `<div class="field" id="ls-uf"><label>천일문 유닛 (숙제가 돼요)</label><input class="inp" id="ls-u" placeholder="예) 64-72, 57" value="${esc(unitsText(L.units || []))}"><div class="tiny" id="ls-ut" style="margin-top:6px"></div></div>` : ''}
      ${JG.length ? `<div class="field" id="ls-gf"><label>그래머 (수업 사이에 하루 10문제 안팎으로 나눠 숙제가 돼요)</label><select class="inp" id="ls-gu"><option value="">숙제 없음</option>${JG.map((u) => `<option value="${u.no}" ${(L.gram || []).length && +g0.unit === +u.no ? 'selected' : ''}>Unit ${u.no} · ${esc(u.title)}</option>`).join('')}</select><div class="chips" id="ls-gs" style="margin-top:8px">${[2, 3, 4].map((s) => `<button class="chip sm ${(g0.steps || []).includes(s) ? 'on' : ''}" data-gs="${s}" type="button">${JG_STEP[s]}</button>`).join('')}</div></div>` : ''}
      <div class="field"><label>오늘 수업 (한 줄에 하나)</label><textarea class="inp" id="ls-l" rows="3">${esc(L.lesson || '')}</textarea></div>
      <div class="field"><label>숙제 (한 줄에 하나)</label><textarea class="inp" id="ls-h" rows="2">${esc(L.hw || '')}</textarea></div>
      <div class="row" style="gap:12px"><div class="field" style="flex:1"><label>시험 점수</label><input class="inp" id="ls-s" inputmode="numeric" placeholder="안 봤으면 비워요" value="${esc(L.score || '')}"></div><div class="field" style="flex:1"><label>만점</label><input class="inp" id="ls-st" inputmode="numeric" value="${esc(L.scoreTotal || '')}"></div><div class="field" style="flex:1"><label>진도율 %</label><input class="inp" id="ls-p" inputmode="numeric" value="${esc(L.progress || '')}"></div></div>
      <div class="field"><label>선생님 한마디 (어머니께)</label><textarea class="inp" id="ls-c" rows="2" placeholder="선택">${esc(L.comment || '')}</textarea></div>
      <button class="btn primary big block" id="ls-send" type="button">저장하고 ${esc(LS0.parent || '어머니')}께 보내기</button>
      <button class="btn big block" id="ls-ok" type="button" style="margin-top:8px">저장만 하기</button>
      ${cur ? '<button class="btn sm" id="ls-del" type="button" style="margin-top:12px">이 기록 지우기</button>' : ''}`, (el, close) => {
      const u = $('#ls-u', el), ut = $('#ls-ut', el), la = $('#ls-l', el), ha = $('#ls-h', el), gu = $('#ls-gu', el), dI = $('#ls-d', el), nI = $('#ls-n', el), mt = $('#ls-mt', el);
      let autoL = !L.lesson, autoH = !L.hw, autoN = !cur;
      const gs = new Set(g0.steps || [2, 3, 4]);
      la.oninput = () => (autoL = false); ha.oninput = () => (autoH = false); nI.oninput = () => (autoN = false);
      const bks = () => $$('[data-bk].on', el).map((b) => b.dataset.bk);
      const fill = () => {
        const B = bks(), cuOn = !books.length || B.some((b) => /천일문/.test(b)), gOn = !books.length || B.some((b) => /grammar/i.test(b));
        const uf = $('#ls-uf', el); if (uf) uf.hidden = !cuOn; const gf = $('#ls-gf', el); if (gf) gf.hidden = !gOn;
        const nos = u && cuOn ? parseUnits(u.value) : [], chs = [];
        for (const n of nos) { const x = cuByNo(n); let g = chs.find((y) => y.ch === x.ch); if (!g) chs.push((g = { ch: x.ch, t: x.chTitle, n: [] })); g.n.push(n); }
        if (ut) ut.innerHTML = nos.length ? nos.map((n) => `Unit ${n} ${esc(cuByNo(n).title)}`).join(' · ') : '';
        const gU = gu && gOn && gu.value ? jgU(gu.value) : null, gSt = [2, 3, 4].filter((s) => gs.has(s));
        const L1 = [...chs.map((g) => `천일문 기본 Ch.${g.ch} ${g.t} (Unit ${unitsText(g.n)})`), ...(gU ? [`Grammar Stage Plus 2 Unit ${gU.no} ${gU.title}`] : [])];
        const H1 = [...(nos.length ? [`말랑대학 천일문 Unit ${unitsText(nos)} 문제 풀기`] : []), ...(gU && gSt.length ? [`말랑영어 그래머 Unit ${gU.no} ${gSt.map((s) => JG_STEP[s]).join('·')} (매일 조금씩)`] : [])];
        if (autoL && L1.length) la.value = L1.join('\n');
        if (autoH && H1.length) ha.value = H1.join('\n');
      };
      $$('[data-bk]', el).forEach((b) => (b.onclick = () => { b.classList.toggle('on'); fill(); }));
      $$('[data-gs]', el).forEach((b) => (b.onclick = () => { const s = +b.dataset.gs; gs.has(s) ? gs.delete(s) : gs.add(s); b.classList.toggle('on', gs.has(s)); fill(); }));
      if (u) u.oninput = fill; if (gu) gu.onchange = fill;
      dI.onchange = () => { if (autoN) nI.value = autoNth(dI.value || today(), cur && cur.id); if (mt) { mt.value = nthTotal(dI.value || today()); $('#ls-mtl', el).textContent = `${+String(dI.value).slice(5, 7) || ''}월 전체`; } };
      if (mt) $('#ls-mtl', el).textContent = `${+String(L.date).slice(5, 7)}월 전체`;
      fill();
      const put = () => {
        const B = bks(), cuOn = !books.length || B.some((b) => /천일문/.test(b)), gOn = !books.length || B.some((b) => /grammar/i.test(b));
        const v = { date: dI.value || today(), nth: nI.value.trim(), book: B.join(' · '), units: u && cuOn ? parseUnits(u.value) : [], gram: gu && gOn && gu.value && gs.size ? [{ unit: +gu.value, steps: [2, 3, 4].filter((s) => gs.has(s)) }] : [], lesson: la.value.trim(), hw: ha.value.trim(), score: $('#ls-s', el).value.trim(), scoreTotal: $('#ls-st', el).value.trim(), progress: $('#ls-p', el).value.trim(), comment: $('#ls-c', el).value.trim() };
        if (mt) { if (mt.value.trim()) c.mtot[ymOf(v.date)] = mt.value.trim(); else delete c.mtot[ymOf(v.date)]; }
        let x = cur || c.list.find((l) => l.plan && l.date === v.date); if (!x) { x = { id: 'l' + Date.now() }; c.list.push(x); } delete x.plan; Object.assign(x, v); save('cls'); return x;
      };
      $('#ls-ok', el).onclick = () => { put(); close(); render(); toast('수업을 적었어요'); };
      $('#ls-send', el).onclick = () => { const x = put(); render(); reportSheet(x.id); };
      const dl = $('#ls-del', el); if (dl) dl.onclick = () => { c.list = c.list.filter((l) => l !== cur); save('cls'); close(); render(); toast('지웠어요'); };
    });
  }
  // 수업 날: 매주 요일 · 시간 · 앞으로의 날 하나씩 쉬기/되살리기 · 보강·추가 수업 넣기 · 천일문 난도
  function lessonSetSheet() {
    const c = cls(), P = { wd: [...c.wd], level: c.level };
    const upHtml = () => { const U = upcoming(c, today(), 10); return U.length ? `<div class="list">${U.map((x) => `<div class="li"><div class="body"><div class="t" style="${x.off ? 'color:var(--t3);text-decoration:line-through' : ''}">${esc(md(x.date))} ${esc(wdName(x.date))}${x.time ? ' ' + esc(timeKo(x.time)) : ''}</div><div class="d">${x.extra ? '보강·추가 수업' : x.off ? '이날은 쉬어요' : '매주 수업'}</div></div>${x.extra ? `<button class="btn sm" data-exdel="${esc(x.extra)}" type="button">빼기</button>` : `<button class="btn sm" data-off="${x.date}" type="button">${x.off ? '되살리기' : '쉬기'}</button>`}</div>`).join('')}</div>` : '<p class="tiny">요일을 고르거나 보강 날짜를 넣으면 여기 보여요</p>'; };
    sheet(`<h2>수업 날 · 난도</h2><p class="sub">다음 수업 날짜와 D-day가 여기서 계산돼요. 내신 기간 보강도 여기 넣어요</p>
      <div class="field"><label>매주 수업 요일</label><div class="chips" id="ls-wd">${WDK.map((w, i) => `<button class="chip ${P.wd.includes(i) ? 'on' : ''}" data-wd="${i}" type="button">${w}</button>`).join('')}</div></div>
      <div class="field"><label>시간</label><input class="inp" type="time" id="ls-tm" value="${esc(c.time || '')}"></div>
      <div class="field"><label>보강·추가 수업</label><div class="row" style="gap:8px"><input class="inp" type="date" id="ls-xd" style="flex:2"><input class="inp" type="time" id="ls-xt" style="flex:1" value="${esc(c.time || '')}"><button class="btn soft" id="ls-xa" type="button">넣기</button></div></div>
      <div class="field"><label>앞으로의 수업</label><div id="ls-up">${upHtml()}</div></div>
      ${CH_UNITS.length ? `<div class="field"><label>천일문 문제 난도</label><div class="seg" id="ls-lv">${Object.entries(LSV).map(([k, [t]]) => `<button type="button" class="${P.level === k ? 'on' : ''}" data-lv="${k}">${t}</button>`).join('')}</div><div class="tiny" id="ls-lvd" style="margin-top:6px">${LSV[P.level][1]}</div></div>` : ''}
      <button class="btn primary big block" id="ls-set" type="button">저장</button>`, (el, close) => {
      const reUp = () => { $('#ls-up', el).innerHTML = upHtml(); bindUp(); };
      const bindUp = () => {
        $$('[data-off]', el).forEach((b) => (b.onclick = () => { const d = b.dataset.off; c.off = c.off.includes(d) ? c.off.filter((x) => x !== d) : [...c.off.filter((x) => x >= today()), d]; save('cls'); reUp(); }));
        $$('[data-exdel]', el).forEach((b) => (b.onclick = () => { c.list = c.list.filter((l) => l.id !== b.dataset.exdel); save('cls'); reUp(); }));
      };
      bindUp();
      $$('[data-wd]', el).forEach((b) => (b.onclick = () => { const i = +b.dataset.wd; P.wd = P.wd.includes(i) ? P.wd.filter((x) => x !== i) : [...P.wd, i].sort(); b.classList.toggle('on', P.wd.includes(i)); c.wd = P.wd; save('cls'); reUp(); }));
      $('#ls-tm', el).onchange = () => { c.time = $('#ls-tm', el).value; save('cls'); reUp(); };
      $('#ls-xa', el).onclick = () => { const d = $('#ls-xd', el).value; if (!d) return toast('날짜를 골라 주세요'); if (c.off.includes(d)) c.off = c.off.filter((x) => x !== d); else c.list.push({ id: 'p' + Date.now(), date: d, time: $('#ls-xt', el).value, plan: true }); save('cls'); reUp(); toast(`${md(d)} 수업을 넣었어요`); };
      $$('[data-lv]', el).forEach((b) => (b.onclick = () => { P.level = b.dataset.lv; $$('[data-lv]', el).forEach((y) => y.classList.toggle('on', y === b)); $('#ls-lvd', el).textContent = LSV[P.level][1]; }));
      $('#ls-set', el).onclick = () => { Object.assign(c, { wd: P.wd, time: $('#ls-tm', el).value, level: P.level }); save('cls'); close(); render(); toast('바꿨어요'); };
    });
  }
  // 리포트 그림: 말랑 리포트(tutoring-report)의 renderer.js 를 그대로 써요 → 카톡으로 공유(휴대폰) · 그림 복사(PC)
  const loadReport = () => window.Report ? Promise.resolve() : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'report.js?v=202610280034'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
  async function reportSheet(id) {
    const L = cls().list.find((l) => l.id === id); if (!L) return;
    reportOpen({ name: NM(), L, total: nthTotal(L.date), book: L.book || LS0.book || '', who: LS0.parent || '어머니', sent: () => { L.sent = Date.now(); save('cls'); render(); } });
  }
  async function reportOpen({ name, L, total, book, who, sent, extra, cv0 }) {
    try { await loadReport(); } catch (e) { return toast('리포트를 못 불러왔어요. 인터넷을 확인해 주세요'); }
    const cv = cv0 || document.createElement('canvas');
    if (!cv0) Report.drawReport(cv, { name, date: L.date, nth: L.nth, total, book, progress: L.progress, score: L.score, scoreTotal: L.scoreTotal, lesson: lines(L.lesson), homework: lines(L.hw), comment: lines(L.comment), ...(extra || {}) });
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const file = new File([blob], `${name}_${L.date}${L.nth ? '_' + L.nth + '회차' : ''}.png`, { type: 'image/png' });
    const url = URL.createObjectURL(blob), canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    sheet(`<h2>${esc(who)}께 보내기</h2><p class="sub">${canShare ? '「카톡으로 보내기」를 누르고 카카오톡에서 ' + esc(who) + (jongOf(who) ? '을' : '를') + ' 고르면 돼요' : '「그림 복사」 뒤 카카오톡 ' + esc(who) + ' 방에 붙여 넣으면(⌘V) 돼요'}</p>
      <img class="rp-img" src="${url}" alt="수업 리포트">
      ${canShare ? '<button class="btn primary big block" id="rp-share" type="button">카톡으로 보내기</button>' : ''}
      <button class="btn ${canShare ? '' : 'primary'} big block" id="rp-copy" type="button" style="margin-top:8px">그림 복사</button>
      <a class="btn big block" id="rp-save" style="text-decoration:none;margin-top:8px" href="${url}" download="${esc(file.name)}">그림 저장</a>`, (el) => {
      const sh = $('#rp-share', el); if (sh) sh.onclick = async () => { try { await navigator.share({ files: [file] }); sent(); toast('보냈어요'); } catch (e) { if (e && e.name !== 'AbortError') toast('공유가 안 돼요. 그림 복사로 보내 주세요'); } };
      $('#rp-copy', el).onclick = async () => { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); sent(); toast(`복사했어요. 카톡 ${who} 방에 붙여 넣어요`); } catch (e) { toast('복사가 안 돼요. 그림 저장으로 보내 주세요'); } };
      $('#rp-save', el).onclick = () => setTimeout(sent, 300);
    });
  }

  // ───────── 엄마 리포트 (10/27 선생님: 기간만 고르면 그동안 한 공부와 성장을 그림 한 장으로 · 정윤 엄마가 걱정이 많아요) ─────────
  // 앱에 남은 기록만 써요. 0인 칸은 빼고, 지난 같은 길이 기간과 견줘요. 맨 위 「한눈에 보기」도 기록으로 저절로 써요(선생님이 따로 안 적어요)
  const dSpan = (a, b) => { const o = []; for (let d = a; d <= b && o.length < 400; d = addD(d, 1)) o.push(d); return o; };
  const wdOf = (d) => '일월화수목금토'[new Date(d + 'T00:00:00').getDay()];
  const mdw = (d) => `${md(d)} (${wdOf(d)})`;
  function prPeriods() {
    const t = today(), mon = addD(t, -((new Date(t + 'T00:00:00').getDay() + 6) % 7));
    return [['week', '이번 주', mon, t], ['month', '이번 달', t.slice(0, 8) + '01', t]];
  }
  const prCat = (it) => {
    const g = String(it.go || '');
    if (it.i === 'clock' || it.i === 'tomato') return null;
    if (g.startsWith('fincid:')) return '기말 예습'; if (g.startsWith('ink:')) return '인강'; if (g.startsWith('my:')) return '학원·학교 숙제';
    if (g.startsWith('news:')) return '기사 읽기'; if (g.startsWith('perf:')) return '수행평가 준비'; if (it.i === 'sci') return '과학 문제';
    if (it.i === 'pin') return '선생님 숙제'; if (it.t === '학교에서 한 것') return '학교 기록'; return '영어';
  };
  function prStats(a, b) {
    const days = dSpan(a, b), inR = (d) => !!d && d >= a && d <= b, atR = (at) => !!at && inR(dOf(at));
    const mins = days.map((d) => sMin(d)), tot = mins.reduce((x, y) => x + y, 0);
    const items = days.flatMap((d) => dayItems(d).map((it) => ({ ...it, day: d, cat: prCat(it) }))).filter((x) => x.cat);
    // 공부한 날: 시간을 안 적은 날도 끝낸 공부가 있으면 공부한 날이에요 (시간은 정윤이가 가끔만 적어요)
    const cnt = days.map((d) => items.filter((x) => x.day === d).length), act = days.map((d, k) => mins[k] > 0 || cnt[k] > 0), on = act.filter(Boolean).length;
    let run = 0, best = 0; for (const a of act) { run = a ? run + 1 : 0; best = Math.max(best, run); }
    const cats = {}; for (const it of items) (cats[it.cat] = cats[it.cat] || []).push(it);
    const acc = [], add = (t, n, ok) => { if (n) acc.push({ t, n, ok }); };
    { const I = inkS(); let n = 0, ok = 0; for (const [k, v] of Object.entries(I.at)) if (inR(v) && I.st[k] === 'done' && I.q[k]) { n += I.q[k].n || 0; ok += I.q[k].ok || 0; } add('인강 미니 퀴즈', n, ok); }
    { let n = 0, ok = 0, wn = 0, wok = 0; for (const d of days) { const e = (S.eng.days || {})[d]; if (!e) continue; for (const o of [e.uans, e.uans2]) for (const v of Object.values(o || {})) { n++; if (v && v.ok) ok++; } for (const v of Object.values(e.wans || {})) { wn++; if (v && v.ok) wok++; } } add('천일문 문제', n, ok); add('워드마스터 단어', wn, wok); }
    { let n = 0, ok = 0; for (const v of Object.values(S.eng.g3ans || {})) if (v && atR(v.at)) { n++; if (v.ok) ok++; } add('고3 영어 문제', n, ok); }
    { let n = 0, ok = 0; for (const d of days) for (const v of Object.values(((S.sci.days || {})[d] || {}).ans || {})) { n++; if (v && v.ok) ok++; } add('과학 문제', n, ok); }
    { let n = 0, ok = 0; for (const A of Object.values(finS().ans)) for (const v of Object.values(A || {})) if (v && typeof v === 'object' && atR(v.at) && 'ok' in v) { n++; if (v.ok) ok++; } add('기말 예습 문제', n, ok); }
    const wrOk = Object.values(S.wrong || {}).filter((w) => w.cleared && atR(w.clearedAt)).length;
    const mocks = []; for (const m of MOCKS) for (const s of m.subjects || []) { const r = (S.mock[m.id] || {})[s.key]; if (r && r.done && atR(r.at)) { const x = mockResult(m, s.key); if (x) mocks.push({ t: `${m.title.replace(/학력평가/, '학평')} ${s.name || SUBJ_NAMES[s.key]}`, raw: x.raw, total: x.total, grade: x.grade }); } }
    const perf = PERF.filter((x) => inR((S.perfDone || {})[x.id])).map((x) => x.title);
    const tom = days.reduce((x, d) => x + ((pomo().days[d] || {}).n || 0), 0);
    const qn = acc.reduce((x, r) => x + r.n, 0), qok = acc.reduce((x, r) => x + r.ok, 0);
    return { a, b, days, mins, cnt, tot, on, best, items, cats, acc, qn, qok, wrOk, mocks, perf, tom };
  }
  // 한눈에 보기: 엄마가 맨 먼저 읽는 서너 줄. 기록에서 저절로 만들어요
  function prSum(R, P, name) {
    const one = R.days.length === 1, o = [];
    if (!R.tot && !R.items.length && !R.qn) return [`이 기간에는 ${name}가 앱에 남긴 공부 기록이 없어요.`];
    if (one) { if (R.tot) o.push(`이날 모두 ${hm(R.tot)} 공부했어요.`); }
    else if (R.on) o.push(`${R.days.length}일 중 ${R.on}일 공부했어요${R.tot ? `. 적어 둔 공부 시간만 ${hm(R.tot)}이에요` : ''}.`);
    const top = Object.entries(R.cats).sort((p, q) => q[1].length - p[1].length).slice(0, 2);
    if (top.length) o.push(`${top.map(([c, L]) => `${c} ${L.length}개`).join(', ')}${top.length > 1 ? '를' : (jongOf(top[0][1].length + '개') ? '을' : '를')} 가장 많이 끝냈어요.`);
    if (P.tot && R.tot && !one) { const p = Math.round(((R.tot - P.tot) / P.tot) * 100); if (p >= 5) o.push(`바로 앞 ${R.days.length}일보다 공부 시간이 ${p}% 늘었어요.`); }
    if (R.qn >= 5) o.push(`문제 ${R.qn}개를 풀어 ${Math.round((R.qok / R.qn) * 100)}%를 맞혔어요.`);
    if (R.wrOk) o.push(`틀렸던 문제 ${R.wrOk}개를 다시 풀어 맞혔어요.`);
    if (R.best >= 3) o.push(`${R.best}일 동안 하루도 안 빠지고 이어서 공부했어요.`);
    if (R.mocks.length) o.push(`모의고사 ${R.mocks.length}과목을 풀었어요.`);
    if (R.perf.length) o.push(`수행평가 ${R.perf.length}개 준비를 끝냈어요.`);
    return o.slice(0, 5);
  }
  // 그림: 엄마가 카톡에서 한눈에 보게 (10/27 선생님: 길고 안 예뻐요, 한눈에 안 들어와요, 로고도 없어요 · 너무 짧게 말고 적당히 자세히)
  // 연회색 바탕에 흰 카드: 로고 머리 → 파란 큰 숫자 → 한눈에 보기 세 줄 → 세 칸(맞힌 비율 고리·공부한 날 점·시간/연속) → 날마다 막대 → 한 것(아이콘·개수·예시 한 줄) → 문제 맞힌 비율 → 모의고사 등급
  const PR_IC = { '기말 예습': '1f4da', '인강': '1f3a7', '학원·학교 숙제': '270f', '기사 읽기': '1f4f0', '수행평가 준비': '1f4cb', '과학 문제': '1f9ea', '선생님 숙제': '1f4cc', '학교 기록': '1f3eb', '영어': '1f4d6', '모의고사': '1f4dd', top: '1f3c6', fire: '1f525' };
  const PR_IMG = {};
  const prLoad = () => Promise.all([['mark', 'assets/mark.svg'], ...Object.values(PR_IC).map((k) => [k, `icons/${k}.svg`])].map(([k, src]) => PR_IMG[k] ? null : new Promise((ok) => { const im = new Image(); im.onload = () => { PR_IMG[k] = im; ok(); }; im.onerror = ok; im.src = src; })));
  function prDraw(R, P, name) {
    const W = 720, M = 24, CW = W - M * 2, PD = 24, SC = 2, FF = '"Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif', fnt = (w, s) => `${w} ${s}px ${FF}`;
    const C = { bg: '#f2f4f6', card: '#ffffff', t1: '#191f28', t2: '#4e5968', t3: '#8b95a1', t4: '#b0b8c1', line: '#e5e8eb', fill: '#f2f4f6', blue: '#3182f6', bd: '#1b64da', bl: '#90c2ff', bsoft: '#e8f3ff', green: '#03b26c', gsoft: '#e5f8ef' };
    const mc = document.createElement('canvas').getContext('2d'), ops = []; let y = 0;
    const tw = (t, f) => { mc.font = f; return mc.measureText(t).width; };
    const cut = (t, w, f) => { if (tw(t, f) <= w) return t; let k = t.length; while (k > 1 && tw(t.slice(0, k) + '…', f) > w) k--; return t.slice(0, k) + '…'; };
    const rr = (c, x, yy, w, h, r) => { c.beginPath(); c.moveTo(x + r, yy); c.arcTo(x + w, yy, x + w, yy + h, r); c.arcTo(x + w, yy + h, x, yy + h, r); c.arcTo(x, yy + h, x, yy, r); c.arcTo(x, yy, x + w, yy, r); c.closePath(); };
    const text = (t, x, yy, f, col, al = 'left') => ops.push((c) => { c.font = f; c.fillStyle = col; c.textAlign = al; c.textBaseline = 'alphabetic'; c.fillText(t, x, yy); });
    const box = (x, yy, w, h, r, col) => ops.push((c) => { rr(c, x, yy, w, h, r); c.fillStyle = typeof col === 'function' ? col(c) : col; c.fill(); });
    const card = (yy, h) => ops.push((c) => { c.save(); c.shadowColor = 'rgba(0,27,55,.06)'; c.shadowBlur = 16; c.shadowOffsetY = 4; rr(c, M, yy, CW, h, 24); c.fillStyle = C.card; c.fill(); c.restore(); });
    const img = (k, x, yy, s) => { const im = PR_IMG[k]; if (im) ops.push((c) => c.drawImage(im, x, yy, s, s)); };
    const dot = (x, yy, r, col) => ops.push((c) => { c.beginPath(); c.arc(x, yy, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); });
    const ring = (x, yy, r, p, col) => ops.push((c) => { c.lineWidth = 11; c.lineCap = 'round'; c.strokeStyle = C.fill; c.beginPath(); c.arc(x, yy, r, 0, Math.PI * 2); c.stroke(); if (p > 0) { c.strokeStyle = col; c.beginPath(); c.arc(x, yy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p)); c.stroke(); } });
    const h2 = (t, yy, right) => { text(t, M + PD, yy + 40, fnt(700, 18), C.t1); if (right) text(right, W - M - PD, yy + 40, fnt(600, 14), C.t3, 'right'); };
    const len = R.days.length, one = len === 1, pct = R.qn ? Math.round((R.qok / R.qn) * 100) : null, act = R.days.map((d, k) => R.mins[k] > 0 || R.cnt[k] > 0);
    const per = one ? '하루' : len <= 7 ? '한 주' : R.a.endsWith('-01') && R.a.slice(0, 7) === R.b.slice(0, 7) ? `${+R.a.slice(5, 7)}월` : `${len}일`;
    // 머리: 로고 + 이름
    y = 32; if (PR_IMG.mark) { const y0 = y; ops.push((c) => { c.save(); rr(c, M + 4, y0, 34, 34, 10); c.clip(); c.drawImage(PR_IMG.mark, M + 4, y0, 34, 34); c.restore(); }); } text('말랑대학', M + 48, y + 24, fnt(800, 19), C.t1); text('공부 리포트', M + 48 + tw('말랑대학', fnt(800, 19)) + 8, y + 24, fnt(600, 17), C.t3);
    y += 76; text(`${name}의 ${per}`, M + 4, y, fnt(800, 32), C.t1); text(one ? mdw(R.a) : `${mdw(R.a)} ~ ${mdw(R.b)}`, M + 4, y + 30, fnt(500, 16), C.t3); y += 54;
    // 파란 큰 숫자
    { const h = 172, y0 = y;
      ops.push((c) => { c.save(); c.shadowColor = 'rgba(49,130,246,.28)'; c.shadowBlur = 20; c.shadowOffsetY = 6; rr(c, M, y0, CW, h, 24); const g = c.createLinearGradient(M, y0, W - M, y0 + h); g.addColorStop(0, '#3182f6'); g.addColorStop(1, '#5b9bff'); c.fillStyle = g; c.fill(); c.restore(); });
      const big = R.items.length ? [`${R.items.length}`, '개', `${per} 동안 끝낸 공부`] : R.tot ? [hm(R.tot), '', '공부 시간'] : ['0', '개', '끝낸 공부'];
      text(big[2], M + 28, y + 46, fnt(600, 17), 'rgba(255,255,255,.85)');
      text(big[0], M + 28, y + 124, fnt(800, 66), '#ffffff'); if (big[1]) text(big[1], M + 34 + tw(big[0], fnt(800, 66)), y + 124, fnt(700, 28), '#ffffff');
      const side = [];
      if (!one && R.on) side.push(`${len}일 중 ${R.on}일 공부`);
      if (P.items.length && R.items.length) { const dd = R.items.length - P.items.length; if (dd > 0) side.push(`지난번보다 ${dd}개 더`); }
      if (side.length < 2 && pct != null) side.push(`문제 ${pct}% 맞힘`);
      y += h + 12;
      // 알약은 판 오른쪽에 위아래로
      side.slice(0, 2).forEach((s, k) => { const w = tw(s, fnt(700, 15)) + 28, py = y0 + 48 + k * 46; box(W - M - 24 - w, py, w, 36, 18, 'rgba(255,255,255,.2)'); text(s, W - M - 24 - w / 2, py + 24, fnt(700, 15), '#ffffff', 'center'); });
    }
    // 한눈에 보기
    { const ls = prSum(R, P, name).slice(0, 4), lh = 32, h = 64 + ls.length * lh + 8;
      card(y, h); h2('한눈에 보기', y);
      ls.forEach((t, k) => { const yy = y + 76 + k * lh; dot(M + PD + 7, yy - 6, 4, C.blue); text(cut(t, CW - PD * 2 - 22, fnt(500, 16)), M + PD + 22, yy, fnt(500, 16), C.t2); });
      y += h + 12; }
    // 세 칸
    { const tiles = [];
      if (pct != null) tiles.push('ring');
      if (!one) tiles.push('days');
      if (R.tot && R.items.length) tiles.push('time');
      if (tiles.length < 3 && R.best >= 2) tiles.push('run');
      if (tiles.length < 3 && R.wrOk) tiles.push('wr');
      if (tiles.length) {
        const n = tiles.length, g = 12, w = (CW - g * (n - 1)) / n, h = 176;
        tiles.forEach((k, i) => { const x = M + i * (w + g), cx = x + w / 2, y0 = y;
          ops.push((c) => { c.save(); c.shadowColor = 'rgba(0,27,55,.06)'; c.shadowBlur = 16; c.shadowOffsetY = 4; rr(c, x, y0, w, h, 22); c.fillStyle = C.card; c.fill(); c.restore(); });
          if (k === 'ring') { ring(cx, y + 74, 42, pct / 100, C.blue); text(`${pct}%`, cx, y + 82, fnt(800, 23), C.t1, 'center'); text('맞힌 비율', cx, y + 148, fnt(700, 15), C.t1, 'center'); text(`${R.qn}문제 중 ${R.qok}개`, cx, y + 166, fnt(500, 12), C.t3, 'center'); }
          else if (k === 'days') { if (len <= 7) { const s = Math.min(26, (w - 36) / len), x0 = cx - (s * (len - 1)) / 2; R.days.forEach((d, j) => { dot(x0 + s * j, y + 62, s * 0.38, act[j] ? C.blue : C.fill); text(wdOf(d), x0 + s * j, y + 96, fnt(600, 12), act[j] ? C.t2 : C.t4, 'center'); }); } else text(`${R.on}일`, cx, y + 90, fnt(800, 36), C.t1, 'center');
            text('공부한 날', cx, y + 148, fnt(700, 15), C.t1, 'center'); text(`${len}일 중 ${R.on}일`, cx, y + 166, fnt(500, 12), C.t3, 'center'); }
          else { const [v, l, s, ik] = k === 'time' ? [hm(R.tot), '공부 시간', '직접 적은 시간', null] : k === 'run' ? [`${R.best}일`, '이어서 공부', '하루도 안 빠지고', 'fire'] : [`${R.wrOk}개`, '오답 다시 맞힘', '틀렸던 문제', null];
            if (ik) img(ik, cx - 18, y + 28, 36); text(v, cx, ik ? y + 112 : y + 92, fnt(800, v.length > 6 ? 24 : 32), k === 'wr' ? C.green : C.t1, 'center'); text(l, cx, y + 148, fnt(700, 15), C.t1, 'center'); text(s, cx, y + 166, fnt(500, 12), C.t3, 'center'); }
        });
        y += h + 12;
      } }
    // 날마다 끝낸 공부
    { const V = R.items.length ? R.cnt : R.mins, mx = Math.max(0, ...V);
      if (!one && mx > 0) {
        const h = 214, top = y + 74, ch = 92, base = top + ch, bw = (CW - PD * 2) / len, w0 = Math.min(32, bw * 0.6), lab = len <= 10;
        card(y, h); h2(R.items.length ? '날마다 끝낸 공부' : '날마다 공부 시간', y, `하루 가장 많이 ${R.items.length ? mx + '개' : hm(mx)}`);
        R.days.forEach((d, k) => { const m = V[k], bh = m ? Math.max(6, (m / mx) * ch) : 4, cx = M + PD + bw * k + bw / 2;
          box(cx - w0 / 2, base - bh, w0, bh, Math.min(8, w0 / 2), m === mx && m ? C.blue : m ? C.bl : C.fill);
          if (lab && m) text(R.items.length ? `${m}개` : hm(m).replace(' ', ''), cx, base - bh - 7, fnt(700, 12), m === mx ? C.blue : C.t3, 'center');
          if (lab) text(`${+d.slice(8)}일 ${wdOf(d)}`, cx, base + 24, fnt(600, 12), C.t3, 'center'); else if (k === 0 || k === len - 1 || +d.slice(8) % 7 === 1) text(`${+d.slice(5, 7)}/${+d.slice(8)}`, cx, base + 24, fnt(600, 11), C.t3, 'center'); });
        y += h + 12;
      } }
    // 이런 걸 했어요: 아이콘 · 종류 · 개수 · 예시 한 줄
    { const E = Object.entries(R.cats).sort((p, q) => q[1].length - p[1].length);
      if (E.length) {
        const rh = 66, h = 64 + E.length * rh + 4;
        card(y, h); h2('이런 걸 했어요', y, `모두 ${R.items.length}개`);
        E.forEach(([cat, L], k) => { const yy = y + 62 + k * rh, it = L[L.length - 1], ex = it.t === '학교에서 한 것' ? String(it.d || '') : it.t.replace(/^(국어|과학|한국사|사회|역사|통합사회|통합과학)\s*인강 · /, '$1 · ');
          box(M + PD, yy + 8, 44, 44, 14, C.fill); img(PR_IC[cat] || '1f4da', M + PD + 9, yy + 17, 26);
          text(cat, M + PD + 60, yy + 27, fnt(700, 16), C.t1); text(cut(ex, CW - PD * 2 - 60 - 64, fnt(500, 13)), M + PD + 60, yy + 49, fnt(500, 13), C.t3);
          text(`${L.length}개`, W - M - PD, yy + 37, fnt(800, 17), k === 0 ? C.blue : C.t2, 'right');
          if (k < E.length - 1) box(M + PD + 60, yy + rh - 1, CW - PD * 2 - 60, 1, 0, C.line); });
        y += h + 12;
      } }
    // 문제 맞힌 비율 (종류별)
    if (R.acc.length) {
      const rh = 46, h = 64 + R.acc.length * rh + 8;
      card(y, h); h2('문제 맞힌 비율', y, `${R.qn}문제 중 ${R.qok}개`);
      R.acc.forEach((r, k) => { const yy = y + 66 + k * rh, p = Math.round((r.ok / r.n) * 100), bx = M + PD + 150, bw = CW - PD * 2 - 150 - 92;
        text(r.t, M + PD, yy + 18, fnt(600, 15), C.t2); box(bx, yy + 6, bw, 14, 7, C.fill); box(bx, yy + 6, Math.max(14, (bw * r.ok) / r.n), 14, 7, p >= 80 ? C.blue : C.bl);
        text(`${p}%`, W - M - PD, yy + 19, fnt(800, 16), p >= 80 ? C.blue : C.t2, 'right'); text(`${r.ok}/${r.n}`, W - M - PD - 48, yy + 19, fnt(500, 13), C.t3, 'right'); });
      y += h + 12;
    }
    // 모의고사 등급
    if (R.mocks.length) {
      const L = R.mocks.slice(0, 6), n = Math.min(3, L.length), g = 8, w = (CW - PD * 2 - g * (n - 1)) / n, rows = Math.ceil(L.length / n), h = 64 + rows * 88 + 12;
      card(y, h); h2('모의고사', y, L[0].t.replace(/ \S+$/, ''));
      L.forEach((m, i) => { const x = M + PD + (i % n) * (w + g), yy = y + 62 + Math.floor(i / n) * 88, top2 = m.grade && m.grade <= 2;
        box(x, yy, w, 80, 16, top2 ? C.bsoft : C.fill); text(m.t.split(' ').pop(), x + 16, yy + 30, fnt(600, 14), C.t2);
        text(m.grade ? `${m.grade}등급` : `${m.raw}점`, x + 16, yy + 64, fnt(800, 22), top2 ? C.blue : C.t1); if (m.grade) text(`${m.raw}점`, x + w - 14, yy + 64, fnt(500, 13), C.t3, 'right'); });
      y += h + 12;
    }
    y += 20; text(`${name}가 말랑대학에 남긴 기록으로 만들었어요`, W / 2, y, fnt(500, 13), C.t3, 'center'); y += 32;
    const cv = document.createElement('canvas'); cv.width = W * SC; cv.height = Math.ceil(y) * SC;
    const c = cv.getContext('2d'); c.scale(SC, SC); c.fillStyle = C.bg; c.fillRect(0, 0, W, y);
    for (const f of ops) f(c);
    return cv;
  }
  // 기간: 「이번 주」「이번 달」, 아니면 달력에서 하루(한 번 누름) 또는 시작 날·끝 날(두 번 누름)
  function parentReport() {
    const who = (ST.lesson && ST.lesson.parent) || '어머니', name = NMI(), t = today();
    let sel = UI.prSel || 'week', A = UI.prA || t, B = UI.prB || t, half = false, cm = UI.prM || t.slice(0, 7);
    const range = () => { const p = prPeriods().find((x) => x[0] === sel); if (p) { A = p[2]; B = p[3]; } };
    const cal = () => {
      const [Y, Mo] = cm.split('-').map(Number), pad = new Date(Y, Mo - 1, 1).getDay(), n = new Date(Y, Mo, 0).getDate();
      const prev = new Date(Y, Mo - 2, 1).toLocaleDateString('sv').slice(0, 7), next = new Date(Y, Mo, 1).toLocaleDateString('sv').slice(0, 7);
      const cells = [...Array(pad).fill(null), ...Array.from({ length: n }, (_, i) => `${cm}-${String(i + 1).padStart(2, '0')}`)];
      return `<div class="pr-cal"><div class="pr-cal-h"><button class="btn sm ghost" type="button" data-prm="${prev}" aria-label="지난달">‹</button><b>${Y}년 ${Mo}월</b><button class="btn sm ghost" type="button" data-prm="${next}" aria-label="다음 달" ${next > t.slice(0, 7) ? 'disabled' : ''}>›</button></div>
        <div class="pr-cal-g">${'일월화수목금토'.split('').map((w) => `<span class="pr-w">${w}</span>`).join('')}${cells.map((d) => { if (!d) return '<i></i>'; const on = d >= A && d <= B, fut = d > t, st = !fut && (sMin(d) > 0 || dayItems(d).length);
          return `<button type="button" class="pr-d ${on ? 'in' : ''} ${d === A ? 'a' : ''} ${d === B ? 'b' : ''} ${d === t ? 'today' : ''}" ${fut ? 'disabled' : `data-prd="${d}"`}><span class="num">${+d.slice(8)}</span>${st ? '<em></em>' : ''}</button>`; }).join('')}</div>
        <p class="tiny" style="margin:8px 0 0">${half ? '끝 날을 누르면 기간이 돼요. 같은 날을 한 번 더 누르면 그날 하루예요' : '하루는 한 번, 기간은 시작 날과 끝 날을 눌러요 · 점은 공부한 날'}</p></div>`;
    };
    const body = () => { range(); const R = prStats(A, B), P = prStats(addD(A, -R.days.length), addD(A, -1)), ls = prSum(R, P, name);
      return `<div class="chips" style="margin-bottom:12px">${prPeriods().map((p) => `<button class="chip ${p[0] === sel ? 'on' : ''}" type="button" data-prp="${p[0]}">${p[1]}</button>`).join('')}</div>
        ${cal()}
        <div class="explain" style="margin:12px 0"><b>${A === B ? esc(mdw(A)) : `${esc(mdw(A))} ~ ${esc(mdw(B))} · ${R.days.length}일`}</b><br>${ls.map(esc).join('<br>')}</div>
        <button class="btn primary big block" id="pr-go" type="button">리포트 만들기</button>`; };
    sheet(`<h2>${esc(who)}께 보낼 공부 리포트</h2><p class="sub">기간만 고르면 그동안 ${esc(name)}가 앱에서 한 공부로 그림 한 장을 만들어요</p><div id="pr-body"></div>`, (el) => {
      const draw = () => {
        $('#pr-body', el).innerHTML = body();
        $$('[data-prp]', el).forEach((b) => (b.onclick = () => { sel = UI.prSel = b.dataset.prp; half = false; range(); cm = UI.prM = B.slice(0, 7); draw(); }));
        $$('[data-prm]', el).forEach((b) => (b.onclick = () => { cm = UI.prM = b.dataset.prm; draw(); }));
        $$('[data-prd]', el).forEach((b) => (b.onclick = () => { const d = b.dataset.prd; sel = UI.prSel = 'own';
          if (half) { if (d < A) { B = A; A = d; } else B = d; half = false; } else { A = B = d; half = true; }
          UI.prA = A; UI.prB = B; draw(); }));
        $('#pr-go', el).onclick = async () => {
          range();
          try { await document.fonts.load('800 20px Pretendard'); await document.fonts.load('500 16px Pretendard'); } catch (e) {} await prLoad();
          const len = dSpan(A, B).length, cv = prDraw(prStats(A, B), prStats(addD(A, -len), addD(A, -1)), name);
          const blob = await new Promise((r) => cv.toBlob(r, 'image/png')), file = new File([blob], `${NM()}_공부리포트_${A === B ? A : A + '_' + B}.png`, { type: 'image/png' });
          const url = URL.createObjectURL(blob), canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
          sheet(`<h2>${esc(who)}께 보내기</h2><p class="sub">${canShare ? '「카톡으로 보내기」를 누르고 ' + esc(who) + (jongOf(who) ? '을' : '를') + ' 고르면 돼요' : '「그림 복사」 뒤 카카오톡 ' + esc(who) + ' 방에 붙여 넣으면(⌘V) 돼요'}</p>
            <img class="rp-img" src="${url}" alt="공부 리포트">
            ${canShare ? '<button class="btn primary big block" id="pr-share" type="button">카톡으로 보내기</button>' : ''}
            <button class="btn ${canShare ? '' : 'primary'} big block" id="pr-copy" type="button" style="margin-top:8px">그림 복사</button>
            <a class="btn big block" style="text-decoration:none;margin-top:8px" href="${url}" download="${esc(file.name)}">그림 저장</a>`, (e2) => {
            const sh = $('#pr-share', e2); if (sh) sh.onclick = async () => { try { await navigator.share({ files: [file] }); toast('보냈어요'); } catch (e) { if (e && e.name !== 'AbortError') toast('공유가 안 돼요. 그림 복사로 보내 주세요'); } };
            $('#pr-copy', e2).onclick = async () => { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); toast(`복사했어요. 카톡 ${who} 방에 붙여 넣어요`); } catch (e) { toast('복사가 안 돼요. 그림 저장으로 보내 주세요'); } };
          });
        };
      };
      if (sel === 'own') { const ok = UI.prA && UI.prB; if (!ok) sel = 'week'; }
      draw();
    });
  }

  // ───────── 선생님 화면 (선생님으로 들어오면 첫 화면 · 학생 관리) ─────────
  // 탭: 홈(이번 주 · 할 일 · 학생) · 수업 일정(달력) · 리포트(보낸 것 · 안 보낸 것) · 학생(코드 · 수업 설정). 학생 화면은 새 탭으로 열어요
  // 처음 기록(students.json lesson.list)의 「보냄」은 서버에 먼저 저장된 옛 기록에 없을 수 있어서 같이 읽어요
  function seedFix(lz, list) { (lz.list || []).forEach((s0, i) => { const it = s0.sent && list.find((l) => l.id === 'l' + i && l.date === s0.date); if (it && !it.sent) it.sent = s0.sent; }); (lz.past || []).forEach((s0, i) => { if (!list.some((l) => l.date === s0.date && !l.plan)) list.push({ id: 'p' + i, ...s0 }); }); return list; }
  // past: 앱 전에 리포트 앱·노션에 남은 지난 수업 (같은 날 기록이 있으면 그걸 써요)
  const dCls = (r, d) => { const L = r.lesson || {}, c = d && d.cls; if (c && c.list) seedFix(L, c.list); return { total: (c && c.total) || '', cyc: (c && c.cyc) || '', wd: c ? c.wd || [] : L.wd || [], time: c ? c.time || '' : L.time || '', off: (c && c.off) || [], mtot: (c && c.mtot) || { ...(L.mtot || {}) }, list: c ? c.list || [] : seedFix(L, (L.list || []).map((x, i) => ({ id: 'l' + i, ...x }))) }; };
  function solvedSince(d, t0) {
    if (!d) return 0; let n = 0; const at = (x) => x && typeof x === 'object' && (x.at || 0) >= t0;
    const each = (o) => { for (const v of Object.values(o || {})) if (at(v)) n++; };
    for (const v of Object.values((d.eng && d.eng.ua) || {})) each(v);
    for (const day of Object.values((d.eng && d.eng.days) || {})) { each(day.uans); each(day.wans); }
    for (const day of Object.values((d.sci && d.sci.days) || {})) each(day.ans);
    each(d.jg);
    return n;
  }
  const sColor = (r) => r.color || 'var(--blue)';
  const sAv = (r, big) => `<span class="sv-av ${big ? 'big' : ''}" style="--sc:${esc(sColor(r))}">${esc(r.name.slice(-2))}</span>`;
  const sPill = (r, t) => `<span class="sv-pill" style="--sc:${esc(sColor(r))}">${esc(t || r.name)}</span>`;
  const agoTxt = (x) => { if (!x) return '아직 안 들어왔어요'; const m = Math.round((Date.now() - x) / 60000); return m < 60 ? `${Math.max(1, m)}분 전` : m < 1440 ? `${Math.round(m / 60)}시간 전` : `${Math.round(m / 1440)}일 전`; };
  const wdShort = (d) => `${md(d)}(${WDK[new Date(d + 'T00:00:00').getDay()]})`;
  function dashInfo() {
    rosterLoad();
    const rows = (roster.rows || ROSTER.map((r) => ({ r, d: undefined }))).map(({ r, d }) => ({ r, d: r.name === U.who ? S : d }));
    const t = today(), wk = Date.now() - 7 * 864e5, ym = ymOf(t);
    return rows.map(({ r, d }) => {
      const tutor = !!r.tutor, c = dCls(r, d), last = d && d._at ? Math.max(0, ...Object.values(d._at).map(Number).filter((v) => v > 0)) : 0;
      const done = lsnSorted(c), L = done.find((l) => l.date <= t), nx = tutor ? nextLesson(c) : null, lz = r.lesson || {};
      const mon = lz.count === 'month' ? done.filter((l) => ymOf(l.date) === ym).length + (+((lz.monthSeed || {})[ym]) || 0) : null;
      const p = (d && d.profile) || {}, fresh = p._careerAt && p._careerAt > (p._careerSeen || 0);
      return { r, d, tutor, c, last, done, L, nx, mon, mt: c.mtot[ym], week: solvedSince(d, wk), unsent: done.filter((l) => !l.sent && !l.skip && !(l.held && !l.lesson && !l.hw) && l.date >= addD(t, -21)), fresh, p, lz };
    });
  }
  const loading = (x) => x.d === undefined;
  const hasRep = (x) => x.tutor || !!x.lz.parent;
  function dashUp(info, days) {
    const t = today();
    return info.filter((x) => x.tutor).flatMap((x) => upcoming(x.c, t, 10).filter((u) => !u.off && u.date <= addD(t, days - 1) && !x.c.list.some((l) => l.date === u.date && lsnDone(l))).map((u) => ({ ...u, x }))).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  }
  function dashTodo(info) {
    return [...info.flatMap((x) => x.unsent.map((l) => ({ x, k: `${x.r.name}|send:${l.id}`, t: `${md(l.date)} 수업 리포트`, d: `${x.lz.parent || '어머니'}께 아직 안 보냈어요`, b: '보내기' }))), ...info.filter((x) => x.fresh).map((x) => ({ x, k: `${x.r.name}|home`, t: '진로를 바꿨어요', d: '진로 맞춤 소식은 Claude에게 말해서 바꿔요', b: '보기' }))];
  }
  // 홈: 학생 고르기 → 바로 아래에서 리포트·숙제를 체크로 골라요 (모달 없음, 학생 페이지로 안 넘어감)
  const P_L = ['지난 숙제 확인', '단어 시험', '문법 개념', '독해 문제 풀이', '본문 해석', '서술형 연습', '모의고사 문제 풀이', '오답 정리'];
  const P_H = ['단어 외우기', '본문 해석 연습', '워크북 풀기', '오답 정리', '천일문 복습', '모의고사 문제 풀기'];
  const P_HS = ['교과서 복습', '문제집 풀기', '오답 정리', '수행평가 준비', '시험 범위 정리'];  // 영어 말고 다른 과목 숙제
  const P_LS = ['학교 숙제 확인', '내신 시험 대비', '모의고사 오답 정리', '수행평가 준비', '단어 외우기', '수학 문제집 풀기'];
  const P_CS = ['이번 주도 꾸준히 공부했어요.', '숙제를 빠짐없이 했어요.', '모르는 건 물어보면서 잘 따라오고 있어요.', '걱정 안 하셔도 돼요.', '조금 더 챙겨 볼게요.'];
  const P_C = ['수업 태도가 아주 좋았어요.', '숙제를 성실히 해 왔어요.', '질문을 많이 하며 적극적으로 참여했어요.', '단어 암기를 조금 더 챙겨 주세요.', '어려워한 부분은 다음 수업에 복습할 예정입니다.'];
  const DR = {};
  // 과외가 아닌 학생(정윤) 리포트: 고른 날짜까지 7일 동안 앱에서 한 것
  function wkStat(d, date) {
    const t0 = new Date(addD(date, -6) + 'T00:00:00').getTime(), t1 = new Date(addD(date, 1) + 'T00:00:00').getTime(), H = (d && d.hw) || [];
    const W = (d && d.wrong) || {}, fin = H.filter((h) => hwDone(h, W) && hwDoneAt(h, W) >= t0 && hwDoneAt(h, W) < t1), due = H.filter((h) => !hwDone(h, W) && h.due && h.due >= addD(date, -6) && h.due <= date);
    return { solved: Math.max(0, solvedSince(d, t0) - solvedSince(d, t1)), fin: fin.length, all: fin.length + due.length, finT: fin.map((h) => `${h.subj && h.subj !== '기타' ? h.subj + ' ' : ''}${h.title} 끝냄`) };
  }
  // 학생 기록(d)을 잠깐 S 자리에 놓고 학생 화면 함수(dayItems·sMin)를 그대로 써요
  const asS = (d, f) => { if (!d || d === S) return f(); const S0 = S; S = { ...blank(), ...JSON.parse(JSON.stringify(d)) }; try { return f(); } finally { S = S0; } };
  // 날짜만 고르면 「이번 주 한 것」이 저절로 채워져요 (10/27 선생님: 날짜만 골라도 한 게 나와야지)
  function wkDone(d, date) {
    if (!d) return [];
    return asS(d, () => {
      const days = dSpan(addD(date, -6), date), mins = days.map(sMin), tot = mins.reduce((a, b) => a + b, 0), on = mins.filter((m) => m > 0).length, o = [];
      if (tot) o.push(`공부 시간 ${hm(tot)} (7일 중 ${on}일)`);
      const cats = {}; for (const dd of days) for (const it of dayItems(dd)) { const c = prCat(it); if (c) (cats[c] = cats[c] || []).push(it.t === '학교에서 한 것' ? String(it.d).slice(0, 24) : it.t.replace(/^(국어|과학|한국사|사회|역사|통합사회|통합과학)\s*인강 · /, '$1 · ')); }
      for (const [c, L] of Object.entries(cats).sort((p, q) => q[1].length - p[1].length)) { const u = [...new Set(L)]; o.push(`${c} ${L.length}개 · ${u.slice(0, 2).join(', ')}${u.length > 2 ? ` 외 ${u.length - 2}개` : ''}`); }
      return o;
    });
  }
  // 정윤 주간 리포트 그림: 글 목록 대신 엄마 리포트 그림(한눈에 보기·지난주와 견줌·날짜별 막대·종류별 카드)으로 (10/27 선생님: 엄마가 글을 안 읽어요)
  const wkCanvas = (n, date, d) => asS(d === undefined ? dRowD(n) : d, () => prDraw(prStats(addD(date, -6), date), prStats(addD(date, -13), addD(date, -7)), n + (jongOf(n) ? '이' : '')));
  const rpExtra = (r, L) => r.tutor ? {} : { kicker: '말랑대학 주간 공부 리포트', lessonLabel: '이번 주 한 것', note: '앱에 남은 기록으로 만들었어요 :)', tiles: [['푼 문제', L.stat ? `${L.stat.solved}개` : '—', false], ['끝낸 숙제', L.stat && L.stat.all ? `${L.stat.fin} / ${L.stat.all}` : '—', false], ['시험', L.score ? (L.scoreTotal ? `${L.score} / ${L.scoreTotal}` : L.score) : '—', true]] };
  const dRowD = (n) => (n === U.who ? S : ((roster.rows || []).find((x) => x.r.name === n) || {}).d);
  const cuLine = (nos) => { const chs = []; for (const no of [...nos].sort((a, b) => a - b)) { const x = cuByNo(no); let g = chs.find((y) => y.ch === x.ch); if (!g) chs.push((g = { ch: x.ch, t: x.chTitle, n: [] })); g.n.push(no); } return chs.map((g) => `천일문 기본 Ch.${g.ch} ${g.t} (Unit ${unitsText(g.n)})`); };
  const cuHw = (nos) => `말랑대학 천일문 Unit ${unitsText([...nos])} 문제 풀기`;
  function drOf(n, fresh) {
    const r = rOf(n), d = dRowD(n);
    if (DR[n] && !fresh && (DR[n].loaded || d === undefined || DR[n].touched)) return DR[n];
    const c = dCls(r, d), lz = r.lesson || {}, prev = lsnSorted(c)[0], t = today(), units = [];
    if (prev && (prev.units || []).length) { const mx = Math.max(...prev.units); for (let k = 1; k <= prev.units.length; k++) if (cuByNo(mx + k)) units.push(mx + k); }
    const book = prev && prev.book ? prev.book.split(' · ') : lz.book ? [lz.book] : [];
    return (DR[n] = { id: '', date: t, nth: String(dNth(r, c, t)), book: new Set(book), units: new Set(units), ch: units.length ? cuByNo(units[0]).ch : prev && (prev.units || []).length ? cuByNo(prev.units[0]).ch : (CH_UNITS[0] || {}).ch, L: new Set(), Lx: new Set(), H: new Set(units.length ? ['@cu'] : []), C: new Set(), score: '', scoreTotal: (prev && prev.scoreTotal) || '', progress: '', mt: dTotal(r, c, t), loaded: d !== undefined, touched: false, hw: new Set(), hsj: {}, hwDue: 'next', hwSubj: (r.subjects || [r.tutor ? '영어' : '기타'])[0] });
  }
  function drFrom(n, l) {
    const r = rOf(n), c = dCls(r, dRowD(n)), u = l.units || [];
    const strip = (t) => lines(t).filter((x) => !/^천일문 기본 Ch\.|^말랑대학 천일문 Unit/.test(x));
    DR[n] = { ...drOf(n, true), id: l.id, date: l.date, nth: String(l.nth || ''), book: new Set(String(l.book || '').split(' · ').filter(Boolean)), units: new Set(u), ch: u.length ? cuByNo(u[0]).ch : drOf(n).ch, L: new Set(strip(l.lesson).filter((t) => r.tutor || !wkDone(dRowD(n), l.date).includes(t))), H: new Set([...(u.length && /말랑대학 천일문/.test(l.hw || '') ? ['@cu'] : []), ...strip(l.hw)]), C: new Set(lines(l.comment)), score: l.score || '', scoreTotal: l.scoreTotal || '', progress: l.progress || '', mt: dTotal(r, c, l.date), touched: true, loaded: true };
  }
  const ck = (grp, v, on, label) => `<button class="tk ${on ? 'on' : ''}" data-ck="${grp}" data-v="${esc(v)}" type="button"><span>${esc(label || v)}</span><i></i></button>`;
  const addBox = (grp, ph) => `<div class="tk-add"><input class="inp" data-addv="${grp}" placeholder="${esc(ph)}"><button class="btn sm" data-add="${grp}" type="button">더하기</button></div>`;
  // ───────── 선생님 「숙제」 탭: 영어 숙제를 눌러서 골라 내요 (리포트와 따로, 2026-10-26) ─────────
  // 천일문 유닛 · 모의고사 · 따로 공부는 학생이 누르면 바로 그 문제가 열리고, 다 풀면 저절로 「했어요」. 리포트에는 낸 숙제가 저절로 들어가요
  const HWS = {};
  const hwS = (n) => HWS[n] || (HWS[n] = { cu: new Set(), mm: new Set(), nx: new Set(), tx: new Set(), ch: null, mmG: 1, mmTy: null, mmAmt: null, due: 'next' });
  const cuOf = (t) => { const m = String(t || '').match(/^천일문 Unit (\d+) /); return m && cuByNo(+m[1]) ? +m[1] : null; };
  const cuTitle = (no) => `천일문 Unit ${no} ${(cuByNo(no) || {}).title || ''} 문제 풀기`.replace(/\s+/g, ' ');
  const hwNext = (n) => { const r = rOf(n), c = dCls(r, dRowD(n)), nx = upcoming(c, addD(today(), 1), 3).find((u) => !u.off); return nx ? addD(nx.date, -1) : addD(today(), 6); };
  const hwDueOf = (n, k) => (k === '3' ? addD(today(), 3) : k === '7' ? addD(today(), 7) : hwNext(n));
  // 그 수업 리포트에 들어갈 숙제: 그날부터 다음 수업 전까지 낸 것
  const hwGiven = (n, date) => { const r = rOf(n), d = dRowD(n) || {}, c = dCls(r, d), nx = upcoming(c, addD(date, 1), 3).find((u) => !u.off), end = nx ? nx.date : addD(date, 7); return (d.hw || []).filter((h) => h.at && dateOf(h.at) >= date && dateOf(h.at) < end); };
  const MM_AMT = [['d1', '하루 1개'], ['d2', '하루 2개'], ['o1', '이번에 1개']];
  // 그 학생이 아직 안 푼 · 아직 안 나간 모의고사 문제 (MM 순서 = 최근 회차부터)
  const mmPool = (n, g, ty) => { const d = (dRowD(n) || {}), done = ((d.eng || {}).mmans) || {}, out = new Set((d.hw || []).filter((h) => !hwDone(h, d.wrong || {}) && h.mmq).flatMap((h) => h.mmq)); return MM.filter((q) => q.grade === g && (ty === '전체' || (MM_TY.find((t) => t[0] === ty) || [, []])[1].includes(q.type)) && !done[q.id] && !out.has(q.id)).map((q) => q.id); };
  // [ [{date, ids}], 마감, 설명 ]: 하루 N개면 오늘부터 마감날까지 날마다, 이번에 1개면 한 번
  const mmPlan = (n, H) => {
    if (!H.mmTy || !H.mmAmt) return [[], null, ''];
    const pool = mmPool(n, H.mmG, H.mmTy), due = hwDueOf(n, H.due), per = H.mmAmt === 'd2' ? 2 : 1, out = [];
    if (H.mmAmt === 'o1') { if (pool.length) out.push({ date: due, ids: pool.slice(0, 1) }); }
    else for (let d = today(), k = 0; d <= due && out.length < 14; d = addD(d, 1)) { const ids = pool.slice(k, k + per); if (!ids.length) break; out.push({ date: d, ids }); k += per; }
    const q = out.reduce((a, o) => a + o.ids.length, 0);
    return [out, due, out.length ? (H.mmAmt === 'o1' ? `${md(due)}까지 1문제` : `${md(out[0].date)}~${md(out[out.length - 1].date)} ${out.length}일 · 모두 ${q}문제 (남은 문제 ${pool.length}개 중)`) : ''];
  };
  function thwView() {
    const info = dashInfo().filter((y) => !y.r.edition || y.r.edition !== 'none');
    if (!UI.hStu || !info.some((y) => y.r.name === UI.hStu)) UI.hStu = (info.find((y) => y.r.name === UI.dStu) || info.find((y) => y.tutor) || info[0]).r.name;
    const n = UI.hStu, x = info.find((y) => y.r.name === n), r = x.r, H = hwS(n);
    const sw = `<div class="dsw">${info.map((y) => `<button class="dsw-b ${y.r.name === n ? 'on' : ''}" data-hsw="${esc(y.r.name)}" type="button" style="--sc:${esc(sColor(y.r))}"><b><i class="sv-dot"></i>${esc(y.r.name)}</b><span>${(() => { const k = ((y.d || {}).hw || []).filter((h) => !hwDone(h, (y.d || {}).wrong || {})).length; return k ? `숙제 ${k}개 남음` : '남은 숙제 없음'; })()}</span></button>`).join('')}</div>`;
    const head = `<h1 class="h1">숙제</h1><p class="sub">눌러서 고르고 「숙제 내기」를 누르면 학생 앱에 바로 떠요</p>`;
    if (loading(x) && n !== U.who) return `${head}${sw}<div class="grid"><section class="card c12"><div class="empty"><b>${esc(n)} 기록을 불러오는 중이에요</b></div></section></div>`;
    const d = x.d || {}, eng = r.edition !== 'english' && (!r.content || r.content.includes('english'));
    const secs = [];
    if (eng && CH_UNITS.length) {
      const lastU = lsnSorted(x.c).find((l) => (l.units || []).length), chs = [...new Map(CH_UNITS.map((u) => [u.ch, u.chTitle])).entries()];
      if (H.ch == null) H.ch = lastU ? (cuByNo(Math.max(...lastU.units)) || {}).ch || chs[0][0] : chs[0][0];
      secs.push(`<div class="th-sec"><h3>천일문 <span class="tiny">${lastU ? `지난 수업 Unit ${esc(unitsText(lastU.units))}` : '유닛 번호를 눌러요'}</span></h3><select class="inp sm" data-hch>${chs.map(([no, t]) => `<option value="${no}" ${+no === +H.ch ? 'selected' : ''}>Ch.${no} ${esc(t)}</option>`).join('')}</select>
        <div class="nb-g">${CH_UNITS.filter((u) => +u.ch === +H.ch).map((u) => `<button class="nb ${H.cu.has(+u.unit) ? 'on' : ''}" data-hcu="${u.unit}" type="button" title="${esc(u.title || '')}">${u.unit}</button>`).join('')}</div></div>`);
    }
    if (eng && MM.length) {
      const pool = mmPool(n, H.mmG, H.mmTy || '전체'), plan = mmPlan(n, H), [, , dl] = plan;
      secs.push(`<div class="th-sec"><div class="row between" style="gap:8px"><h3>모의고사 <span class="tiny">안 푼 문제부터 최근 회차 순으로 내요</span></h3><div class="seg sm d-mm-g">${[1, 2, 3].map((y) => `<button type="button" class="${y === H.mmG ? 'on' : ''}" data-hmg="${y}">고${y}</button>`).join('')}</div></div>
        <div class="th-row"><b>유형</b><div class="chips">${['전체', ...MM_TY.map((t) => t[0])].map((ty) => `<button class="chip sm ${H.mmTy === ty ? 'on' : ''}" data-hmt="${esc(ty)}" type="button">${ty} <span class="muted">${mmPool(n, H.mmG, ty).length}</span></button>`).join('')}</div></div>
        <div class="th-row"><b>얼마나</b><div class="chips">${MM_AMT.map(([k, l]) => `<button class="chip sm ${H.mmAmt === k ? 'on' : ''}" data-hma="${k}" type="button">${l}</button>`).join('')}</div></div>
        ${H.mmTy && H.mmAmt ? `<p class="th-sum">${plan[0].length ? esc(dl) : '남은 문제가 없어요. 다른 유형이나 학년을 골라 주세요'}</p>` : ''}</div>`);
    }
    const nxp = nxPicks(n).filter((p) => !/^(역사|과학|국어|수학|사회|도덕|기가|한문)/.test(p.title));
    if (nxp.length) secs.push(`<div class="th-sec"><h3>내신 시험 <span class="tiny">앱에 있는 영어 시험 묶음</span></h3><div class="chips">${nxp.map((p) => `<button class="chip sm ${H.nx.has(p.t) ? 'on' : ''}" data-hnx="${esc(p.t)}" type="button">${esc(p.title)}</button>`).join('')}</div></div>`);
    const pre = [...new Set([...(r.edition === 'english' ? ['그래머 책 풀기', '단어 외우기', '리스닝 다시 듣기', '라이팅 한 편 쓰기'] : ['단어 외우기', '워크북 풀기', '본문 해석 연습', '오답 정리']), ...H.tx])];
    secs.push(`<div class="th-sec"><h3>그 밖에</h3><div class="chips">${pre.map((t) => `<button class="chip sm ${H.tx.has(t) ? 'on' : ''}" data-htx="${esc(t)}" type="button">${esc(t)}</button>`).join('')}</div><div class="tk-add" style="margin-top:8px"><input class="inp" id="th-in" placeholder="없으면 적고 더하기 (예: 워크북 30~35쪽)"><button class="btn sm" id="th-add" type="button">더하기</button></div></div>`);
    const cnt = H.cu.size + (mmPlan(n, H)[0].length ? 1 : 0) + H.nx.size + H.tx.size, dues = [['next', `다음 수업 전 (${md(hwNext(n))})`], ['3', '3일 뒤'], ['7', '1주 뒤']];
    const go = `<div class="th-go"><div class="chips">${dues.map(([k, l]) => `<button class="chip sm ${H.due === k ? 'on' : ''}" data-hdue="${k}" type="button">${l}</button>`).join('')}</div><button class="btn primary big block" id="th-ok" type="button" ${cnt ? '' : 'disabled'}>${cnt ? `숙제 ${cnt}개 내기` : '숙제를 골라 주세요'}</button></div>`;
    const W = d.wrong || {}, H0 = [...(d.hw || []).filter((h) => !hwDone(h, W)).sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9'))), ...(d.hw || []).filter((h) => hwDone(h, W)).sort((a, b) => hwDoneAt(b, W) - hwDoneAt(a, W)).slice(0, 6)], t = today();  // 안 한 것 전부(마감 순) + 최근에 끝낸 6개
    const st = (h) => hwDone(h, W) ? ['ok', '했어요'] : h.due && h.due < t ? ['no', '안 했어요'] : ['wait', h.due ? `${md(h.due)}까지` : '하는 중'];
    const out = `<section class="card th-out"><div class="card-h"><h2>나가 있는 숙제</h2></div>${H0.length ? `<div class="list">${H0.map((h) => { const [k, l] = st(h); return `<div class="li"><div class="body"><div class="t">${esc(h.title)}</div></div><span class="tg-hs ${k}">${l}</span>${hwDone(h, W) ? '' : `<button class="btn sm" data-thdel="${esc(h.id)}" type="button">빼기</button>`}</div>`; }).join('')}</div>` : '<div class="empty"><b>아직 낸 숙제가 없어요</b></div>'}</section>`;
    return `${head}${sw}<div class="d-two"><section class="card th-form">${secs.join('')}${go}</section><aside>${out}</aside></div>`;
  }
  function bindThw() {
    const n = UI.hStu; if (!n) return; const H = hwS(n), tg = (set, v) => { set.has(v) ? set.delete(v) : set.add(v); render(); };
    $$('[data-hsw]').forEach((b) => (b.onclick = () => { UI.hStu = b.dataset.hsw; render(); }));
    const ch = $('[data-hch]'); if (ch) ch.onchange = () => { H.ch = +ch.value; render(); };
    $$('[data-hcu]').forEach((b) => (b.onclick = () => tg(H.cu, +b.dataset.hcu)));
    $$('[data-hmg]').forEach((b) => (b.onclick = () => { H.mmG = +b.dataset.hmg; render(); }));
    $$('[data-hmt]').forEach((b) => (b.onclick = () => { H.mmTy = H.mmTy === b.dataset.hmt ? null : b.dataset.hmt; render(); }));
    $$('[data-hma]').forEach((b) => (b.onclick = () => { H.mmAmt = H.mmAmt === b.dataset.hma ? null : b.dataset.hma; render(); }));
    $$('[data-hnx]').forEach((b) => (b.onclick = () => tg(H.nx, b.dataset.hnx)));
    $$('[data-htx]').forEach((b) => (b.onclick = () => tg(H.tx, b.dataset.htx)));
    $$('[data-hdue]').forEach((b) => (b.onclick = () => { H.due = b.dataset.hdue; render(); }));
    const inp = $('#th-in'), add = () => { const v = inp.value.trim(); if (!v) return inp.focus(); H.tx.add(v); render(); };
    if (inp) { $('#th-add').onclick = add; inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); add(); } }; }
    const ok = $('#th-ok'); if (ok) ok.onclick = async () => {
      const due = hwDueOf(n, H.due), at = Date.now();
      const items = [...[...H.cu].sort((a, b) => a - b).map((no) => ({ title: cuTitle(no) })), ...mmPlan(n, H)[0].map((o) => { const lb = `모의고사 고${H.mmG}${H.mmTy === '전체' ? '' : ' ' + H.mmTy}`; return H.mmAmt === 'o1' ? { title: `${lb} 1문제`, mmq: o.ids } : { title: `${lb} ${o.ids.length}문제 (${md(o.date)})`, mmq: o.ids, due: o.date, grp: `${lb} 하루 ${H.mmAmt === 'd2' ? 2 : 1}문제` }; }), ...[...H.nx].map((t) => ({ title: t, nx: nxIdOf(n, t) })), ...[...H.tx].map((t) => ({ title: t }))].map((o, k) => ({ id: 'h' + (at + k), subj: '영어', due, memo: '', done: false, at, ...o }));
      ok.disabled = true; ok.textContent = '내는 중…';
      try {
        if (n === U.who) { S.hw = [...(S.hw || []), ...items.filter((i) => !(S.hw || []).some((h) => h.title === i.title && !hwDone(h)))]; save('hw'); }
        else await dPut(n, 'hw', (D) => { D.hw = [...(D.hw || []), ...items.filter((i) => !(D.hw || []).some((h) => h.title === i.title && !hwDone(h, D.wrong || {})))]; });
      } catch (e) { ok.disabled = false; return toast('못 냈어요. 인터넷을 확인하고 다시 눌러 주세요'); }
      delete HWS[n]; toast(`${n}에게 숙제 ${items.length}개를 냈어요`); render();
    };
    $$('[data-thdel]').forEach((b) => (b.onclick = async () => { b.disabled = true; try { if (n === U.who) { S.hw = (S.hw || []).filter((h) => h.id !== b.dataset.thdel); save('hw'); } else await dPut(n, 'hw', (D) => { D.hw = (D.hw || []).filter((h) => h.id !== b.dataset.thdel); }); toast('뺐어요'); } catch (e) { toast('못 뺐어요. 다시 눌러 주세요'); } render(); }));
  }
  // 리포트 숙제 칸의 모의고사 고르기: 학년 → 회차마다 유형 칩 (누르면 숙제에 들어가요, 다시 누르면 빠져요)
  function dMmPick(D0) {
    const g = D0.mmG || 1, exs = [...new Set(MM.filter((x) => x.grade === g).map(mmExam))];
    return `<div class="d-mm"><div class="row between" style="gap:8px;margin-bottom:8px"><span class="tiny">모의고사 숙제 · 누르면 숙제에 들어가고, 학생은 누르자마자 풀어요</span><div class="seg sm d-mm-g">${[1, 2, 3].map((y) => `<button type="button" class="${y === g ? 'on' : ''}" data-mmg2="${y}">고${y}</button>`).join('')}</div></div>
      ${exs.map((ex) => `<div class="d-mm-r"><b>${esc(ex.replace(/ 고\d$/, ''))}</b><div class="chips">${['전체', ...MM_TY.map((t) => t[0])].map((ty) => { const k = mmPick(ex, ty).length, L = mmLabel(ex, ty, k); return k ? `<button class="chip sm ${D0.H.has(L) ? 'on' : ''}" data-ck="H" data-v="${esc(L)}" type="button">${ty} ${k}</button>` : ''; }).join('')}</div></div>`).join('')}</div>`;
  }
  function dReportCard(n, x) {
    const tu = x.tutor, r = x.r, lz = r.lesson || {}, D0 = drOf(n), c = x.c, past = lsnSorted(c);
    autoL = tu ? [] : wkDone(x.d, D0.date || today()), pastL = [...new Set(past.flatMap((l) => lines(l.lesson)).filter((t) => !/^천일문 기본 Ch\./.test(t) && t.length <= 30 && !/^말랑대학 문제 \d+개 풀기$/.test(t) && !/ \d+\/\d+$/.test(t)))].slice(0, 8), pastH = [...new Set(past.flatMap((l) => lines(l.hw)).filter((t) => !/^말랑대학 천일문 Unit/.test(t) && t.length <= 30 && !nxIdOf(n, t)))].slice(0, 6);
    const nxL = tu ? nxRecs(n, D0.date || today()).slice(0, 4).map((x) => `${x.title} ${x.ok}/${x.n}`) : [], nxH = nxPicks(n).map((x) => x.t), as = tu ? autoScore(n) : null, useA = !!as && !String(D0.score || '').trim();
    const books = [...new Set([...(lz.books || (lz.book ? [lz.book] : [])), ...D0.book])], cuOn = CH_UNITS.length && [...D0.book].some((b) => /천일문/.test(b));
    const chs = [...new Map(CH_UNITS.map((u) => [u.ch, u.chTitle])).entries()], lastU = past.find((l) => (l.units || []).length), who = lz.parent || '어머니';
    const rep = UI.drep && UI.drep.n === n ? UI.drep : null, subs = r.subjects || [], sj = D0.hwSubj || subs[0] || '영어';
    return `<div class="d-two"><section class="card dform"><div class="card-h"><h2>${D0.id ? `${esc(md(D0.date))} 리포트 고치기` : tu ? '오늘 리포트' : '이번 주 리포트'}</h2>${D0.id ? '<button class="more" data-dnew type="button">새로 쓰기</button>' : ''}</div>
      <div class="d-meta"><label>날짜 <input class="inp sm" type="date" data-df="date" value="${esc(D0.date)}"></label>${tu ? `<label>회차 <input class="inp sm num" data-df="nth" inputmode="numeric" value="${esc(D0.nth)}" style="width:64px"></label>` : '<span class="tiny">이 날까지 7일 동안 한 것을 모아요</span>'}${lz.count === 'month' ? `<label>${+D0.date.slice(5, 7)}월 전체 <input class="inp sm num" data-df="mt" inputmode="numeric" value="${esc(D0.mt || '')}" style="width:64px"></label>` : ''}</div>
      ${books.length ? `<div class="d-sec"><h3>교재</h3><div class="tk-g">${books.map((b) => ck('book', b, D0.book.has(b))).join('')}</div></div>` : ''}
      ${cuOn ? `<div class="d-sec"><h3>천일문 <span class="tiny">${lastU ? `지난번 Unit ${esc(unitsText(lastU.units))}` : ''}</span></h3><select class="inp sm" data-dch>${chs.map(([no, t]) => `<option value="${no}" ${+no === +D0.ch ? 'selected' : ''}>Ch.${no} ${esc(t)}</option>`).join('')}</select>
        <div class="nb-g">${CH_UNITS.filter((u) => +u.ch === +D0.ch).map((u) => `<button class="nb ${D0.units.has(+u.unit) ? 'on' : ''}" data-ck="cu" data-v="${u.unit}" type="button" title="${esc(u.title || '')}">${u.unit}</button>`).join('')}</div>
        ${D0.units.size ? `<p class="tiny" style="margin:8px 0 0">${[...D0.units].sort((a, b) => a - b).map((no) => `${no} ${esc((cuByNo(no) || {}).title || '')}`).join(' · ')}</p>` : ''}</div>` : ''}
      <div class="d-sec"><h3>${tu ? '오늘 한 것' : '이번 주 한 것'}${D0.L.size ? ` <b class="blue">${D0.L.size}</b>` : ''}</h3>${autoL.length ? `<p class="tiny" style="margin:0 0 8px">날짜까지 7일 동안 앱에 남은 기록이에요. 빼려면 눌러요</p><div class="tk-g" style="margin-bottom:8px">${autoL.map((t) => ck('Lx', t, !D0.Lx.has(t))).join('')}</div>` : tu ? '' : '<p class="tiny" style="margin:0 0 8px">이 7일 동안 앱에 남은 기록이 없어요</p>'}<div class="tk-g">${[...new Set([...nxL, ...(tu ? P_L : P_LS), ...[...D0.L]])].filter((t) => !autoL.includes(t)).map((t) => ck('L', t, D0.L.has(t))).join('')}</div>${pastL.filter((t) => !D0.L.has(t)).length ? `<details class="dl-more"><summary>지난 수업에 쓴 것</summary><div class="tk-g">${pastL.filter((t) => !D0.L.has(t)).map((t) => ck('L', t, false)).join('')}</div></details>` : ''}${addBox('L', '없으면 적고 더하기')}</div>
      <div class="d-sec"><h3>숙제 <span class="tiny">「숙제」 탭에서 낸 숙제가 저절로 들어가요</span></h3>${(() => { const G = hwGiven(n, D0.date || today()).filter((h, k, A) => !h.grp || A.findIndex((y) => y.grp === h.grp) === k).map((h) => (h.grp ? { ...h, title: h.grp, done: hwGiven(n, D0.date || today()).filter((y) => y.grp === h.grp).every(hwDone) } : h)); return `${sj === '영어' && cuOn && D0.units.size ? `<div class="tk-g">${ck('H', '@cu', D0.H.has('@cu'), cuHw(D0.units))}</div>` : ''}${G.length ? `<div class="list d-hwl">${G.map((h) => `<div class="li"><div class="body"><div class="t">${esc(h.title)}</div></div><span class="tg-hs ${hwDone(h, (dRowD(n) || {}).wrong || {}) ? 'ok' : 'wait'}">${hwDone(h, (dRowD(n) || {}).wrong || {}) ? '했어요' : h.due ? md(h.due) + '까지' : '냈어요'}</span></div>`).join('')}</div>` : '<p class="tiny" style="margin:0 0 8px">이 수업 뒤로 낸 숙제가 아직 없어요</p>'}<button class="btn sm soft" type="button" data-hgo="${esc(n)}">숙제 내러 가기</button>`; })()}</div>
      <div class="d-sec"><h3>${tu ? '진도율 · 시험' : '시험 점수'}</h3><div class="d-meta">${tu ? `<label>진도율 <input class="inp sm num" data-df="progress" inputmode="numeric" value="${esc(D0.progress || autoProg(n))}" style="width:64px"> %</label>${!D0.progress && autoProg(n) ? '<span class="tiny">천일문 유닛으로 자동</span>' : ''}` : ''}<label>점수 <input class="inp sm num" data-df="score" inputmode="numeric" value="${esc(useA ? as.score : D0.score)}" style="width:64px"></label><label>/ <input class="inp sm num" data-df="scoreTotal" inputmode="numeric" value="${esc(useA ? as.total : D0.scoreTotal)}" style="width:64px"></label>${useA ? `<span class="tiny">${esc(as.title)} 시험에서 자동</span>` : ''}</div></div>
      <div class="d-sec"><h3>${esc(who)}께 한마디</h3><div class="tk-g">${[...new Set([...(tu ? P_C : P_CS), ...D0.C])].map((t) => ck('C', t, D0.C.has(t))).join('')}</div>${addBox('C', '직접 적고 더하기')}</div>
      <div class="d-go"><button class="btn primary big" data-dsave="send" type="button">저장하고 ${esc(who)}께 보내기</button><button class="btn big" data-dsave="" type="button">저장만</button></div>
      </section><aside class="card d-pv">${rep ? `<div class="card-h"><h2>${esc(who)}께 보내요</h2></div><img class="rp-img" src="${rep.url}" alt="리포트"><div class="d-go">${rep.canShare ? '<button class="btn primary" data-rp="share" type="button">카톡으로 보내기</button>' : ''}<button class="btn ${rep.canShare ? '' : 'primary'}" data-rp="copy" type="button">그림 복사</button><a class="btn" data-rp="save" href="${rep.url}" download="${esc(rep.file.name)}" style="text-decoration:none">그림 저장</a></div><p class="tiny">${rep.canShare ? `카톡에서 ${esc(who)}를 고르면 돼요` : `복사한 뒤 카톡 ${esc(who)} 방에 붙여 넣어요(⌘V)`}</p>` : `<div class="card-h"><h2>${esc(who)}께 갈 그림</h2><span class="tiny">고르는 대로 바뀌어요</span></div><img class="rp-img" id="d-pv" alt="리포트 미리보기">`}</aside></div>`;
  }
  function dHwCard(n, x) {
    const D0 = drOf(n), d = x.d || {}, open = (d.hw || []).filter((h) => !hwDone(h, d.wrong || {})), subs = x.r.subjects || [], sj = D0.hwSubj || subs[0] || '영어';
    const past = [...new Set((d.hw || []).filter((h) => !subs.length || h.subj === sj).map((h) => h.title))].slice(-6).reverse(), pre = sj === '영어' ? P_H : P_HS;
    return `<section class="card c12 dform"><div class="card-h"><h2>숙제 내기</h2></div><p class="tiny" style="margin:-8px 0 12px">고르고 「내기」 누르면 ${esc(n)} 앱 숙제에 바로 떠요</p>
      ${subs.length > 1 ? `<div class="sj-g">${subs.map((v) => `<button class="sj ${v === sj ? 'on' : ''}" data-sj="${esc(v)}" type="button">${esc(v)}</button>`).join('')}</div>` : ''}<div class="tk-g">${[...new Set([...pre, ...past, ...D0.hw])].map((t) => ck('hw', t, D0.hw.has(t))).join('')}</div>${addBox('hw', '직접 적고 더하기')}
      <button class="btn primary big block" data-dhw type="button" style="margin-top:16px">내기${D0.hw.size ? ` · ${D0.hw.size}개` : ''}</button>
      ${open.length ? `<details class="dl-more" style="margin:16px 0 0"><summary>나가 있는 숙제 ${open.length}개</summary><div class="list">${open.slice(-8).map((h) => `<div class="li"><div class="body"><div class="t">${esc(h.title)}</div><div class="d">${h.subj && subs.length > 1 ? esc(h.subj) + ' · ' : ''}${h.due ? esc(md(h.due)) + '까지' : '기한 없음'}</div></div><button class="btn sm" data-hwdel="${esc(h.id)}" type="button">빼기</button></div>`).join('')}</div></details>` : ''}</section>`;
  }
  // 선생님 홈: 확인할 것 · 이번 주 수업 · 이번 달 수업료 · 소식, 오른쪽엔 시계 · 핫뉴스 · 학생
  const wonT = (v) => `${Math.round(v).toLocaleString('ko-KR')}원`;
  function dMoney(info) {
    const t = today(), ym = ymOf(t);
    return info.filter((x) => x.tutor).map((x) => {
      const fee = +x.lz.fee || 0, done = x.done.filter((l) => ymOf(l.date) === ym).length + (+((x.lz.monthSeed || {})[ym]) || 0);
      const left = upcoming(x.c, addD(t, 1), 40).filter((u) => !u.off && ymOf(u.date) === ym && !x.c.list.some((l) => l.date === u.date && lsnDone(l))).length;
      return { x, fee, done, plan: Math.max(+(x.mt || 0), done + left) };
    });
  }
  // 선생님 홈: 학생에게 한마디 · 테마 선물 (학생 페이지로 안 가고 여기서, 2026-10-26)
  function dMsgCard(info) {
    if (!UI.mStu || !info.some((x) => x.r.name === UI.mStu)) UI.mStu = info[0].r.name;
    const x = info.find((y) => y.r.name === UI.mStu), d = x.d || {}, n = d.note || {}, nm = x.r.name;
    const own = (d.profile && d.profile.skins) || [], gl = [...(d.gifts || []), ...(d.gift && d.gift.skin ? [d.gift] : [])];
    const st = n.at ? (n.thx ? `${esc(nm)}가 「고마워요」 했어요` : n.seen ? `${esc(nm)}가 봤어요` : '아직 안 봤어요') : '';
    return `<section class="card c12 dm-card"><div class="card-h"><h2>${ic('mega')} 학생에게</h2>${st ? `<span class="tiny">${st}</span>` : ''}</div>
      <div class="chips" style="margin-bottom:12px">${info.map((y) => `<button class="chip sm ${y.r.name === nm ? 'on' : ''}" data-mst="${esc(y.r.name)}" type="button"><i class="sv-dot" style="--sc:${esc(sColor(y.r))}"></i>${esc(y.r.name)}</button>`).join('')}</div>
      ${loading(x) ? '<p class="tiny">불러오는 중이에요</p>' : `<div class="eyebrow" style="margin-bottom:6px">한마디 · 학생 홈 맨 위에 떠요</div><textarea id="dm-t" class="inp" rows="2" style="min-height:72px" placeholder="오늘 ${esc(nm)}에게 하고 싶은 말">${esc(n.text || '')}</textarea>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px">${n.text ? '<button class="btn" type="button" id="dm-del">내리기</button>' : ''}<button class="btn primary" type="button" id="dm-send">홈에 띄우기</button></div>
      <div class="eyebrow" style="margin:16px 0 8px">테마 선물</div><div class="dm-gifts">${GIFTS.map((k) => { const has = own.includes(k), g = gl.find((y) => y.skin === k), wait = g && !g.open && !g.x && !has; return `<div class="dm-g"><img src="${skinPic(k)}" alt=""><b>${esc(SKINS[k].n)}</b>${has ? '<span class="tag blue">받음</span>' : wait ? `<button class="btn sm" type="button" data-dgx="${k}">취소</button>` : `<button class="btn sm primary" type="button" data-dgift="${k}">보내기</button>`}</div>`; }).join('')}</div>`}</section>`;
  }
  function bindDMsg() {
    const nm = UI.mStu, busy = (b) => { if (b) b.disabled = true; };
    $$('[data-mst]').forEach((b) => (b.onclick = () => { UI.mStu = b.dataset.mst; render(); }));
    const put = async (key, fn, msg, b) => { busy(b); try { if (nm === U.who) { fn(S); save(key); } else await dPut(nm, key, fn); toast(msg); } catch (e) { toast('못 보냈어요. 인터넷을 확인해 주세요'); } render(); };
    const sd = $('#dm-send'); if (sd) sd.onclick = () => { const t = $('#dm-t').value.trim(); if (!t) return toast('한마디를 적어 주세요'); put('note', (d) => { d.note = { text: t, at: Date.now() }; }, `${nm} 홈 맨 위에 띄웠어요`, sd); };
    const dl = $('#dm-del'); if (dl) dl.onclick = () => put('note', (d) => { d.note = {}; }, '내렸어요', dl);
    $$('[data-dgift]').forEach((b) => (b.onclick = () => { const k = b.dataset.dgift; put(['gifts', 'gift'], (d) => { const L = [...(d.gifts || [])]; if (d.gift && d.gift.skin && !L.some((y) => y.skin === d.gift.skin)) L.push(d.gift); d.gifts = [...L.filter((y) => y.skin !== k), { skin: k, at: Date.now() }]; d.gift = {}; }, `선물을 보냈어요. ${nm} 앱에 곧 떠요`, b); }));
    $$('[data-dgx]').forEach((b) => (b.onclick = () => { const k = b.dataset.dgx; put(['gifts', 'gift'], (d) => { d.gifts = (d.gifts || []).map((y) => (y.skin === k && !y.open ? { ...y, x: Date.now() } : y)); d.gift = {}; }, '선물을 거둬들였어요', b); }));
  }
  function dashView() {
    const info = dashInfo(), up = dashUp(info, 7), t = today(), asks = dAsks(info); dashView.asks = asks;
    const M = dMoney(info), got = M.reduce((a, m) => a + m.done * m.fee, 0), exp = M.reduce((a, m) => a + m.plan * m.fee, 0), cnt = M.reduce((a, m) => a + m.done, 0), mx = Math.max(1, ...M.map((m) => m.plan * m.fee));
    const askC = asks.length ? `<section class="card c12 d-ask"><div class="card-h"><h2>${ic('bell')} 확인할 것</h2><span class="tag red">${asks.length}</span></div>${asks.map((a, i) => `<div class="d-ask-i"><div><b>${esc(a.t)}</b><span>${esc(a.d)}</span></div><div class="ck-g">${a.opts.map(([v, l]) => `<button class="btn sm ${v === 'y' || v === 's' ? 'soft' : ''}" data-ask="${i}" data-av="${esc(v)}" type="button">${esc(l)}</button>`).join('')}</div></div>`).join('')}</section>` : '';
    const upC = `<section class="card c6"><div class="card-h"><h2>${ic('cal')} 이번 주 수업</h2><button class="more" data-tgo="tsched" type="button">달력</button></div>${up.length ? `<div class="list">${up.slice(0, 5).map((u) => { const dd = dday(u.date); return `<div class="li btnlike" data-dl="${esc(u.x.r.name)}">${sAv(u.x.r)}<div class="body"><div class="t">${esc(u.x.r.name)}</div><div class="d">${esc(wdShort(u.date))} ${esc(timeKo(u.time || u.x.c.time))}</div></div><span class="tag ${dd === 0 ? 'blue' : ''}">${dd === 0 ? '오늘' : 'D-' + dd}</span></div>`; }).join('')}</div>` : `<div class="empty"><b>이번 주 수업이 없어요</b></div>`}</section>`;
    const moneyC = `<section class="card c6"><div class="card-h"><h2>${ic('cash')} ${+t.slice(5, 7)}월 수업료</h2><span class="tiny">${cnt}회 했어요</span></div>
      <div class="d-won"><b class="num">${wonT(got)}</b><span>이번 달 예상 ${wonT(exp)}</span></div>
      <div class="d-bars">${M.map((m) => `<div class="d-bar"><span class="d-bn"><i class="sv-dot" style="--sc:${esc(sColor(m.x.r))}"></i>${esc(m.x.r.name)}</span><span class="d-bt"><i style="width:${Math.round((m.plan * m.fee / mx) * 100)}%;opacity:.25;background:${esc(sColor(m.x.r))}"></i><i style="width:${Math.round((m.done * m.fee / mx) * 100)}%;background:${esc(sColor(m.x.r))}"></i></span><span class="d-bv num">${m.done}/${m.plan}회 · ${wonT(m.done * m.fee)}</span></div>`).join('')}</div></section>`;
    const N = ((D.news && D.news.items) || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
    const newsC = N.length ? `<section class="card c12"><div class="card-h"><h2>${ic('news')} 소식</h2><button class="more" data-tgo="news" type="button">전체 보기</button></div><div class="list d-news">${N.map((n) => `<div class="li btnlike" data-news="${esc(n.id)}"><div class="ico">${ic(nIcon(n))}</div><div class="body"><div class="t">${esc(n.title)}</div><div class="d">${esc(md(n.date))} · ${esc(n.scope || '')}</div></div><span class="chev"></span></div>`).join('')}</div></section>` : '';
    const stuC = `<section class="card tight"><div class="card-h"><h3>학생</h3><button class="more" data-tgo="tstu" type="button">전체</button></div><div class="list">${info.map((x) => `<div class="li btnlike" data-dl="${esc(x.r.name)}">${sAv(x.r)}<div class="body"><div class="t">${esc(x.r.name)}</div><div class="d">${loading(x) ? '불러오는 중' : agoTxt(x.last)}</div></div><b class="num" style="font-size:14px">${loading(x) ? '' : x.week + '문제'}</b></div>`).join('')}</div></section>`;
    const h = new Date().getHours();
    const main = `<h1 class="h1">${tBday() === 0 ? `${esc(TP.name)}, 생일 축하해요` : `${esc(TP.name)}, ${h < 12 ? '좋은 아침이에요' : h < 18 ? '오후도 힘내요' : '오늘도 수고했어요'}`}</h1><p class="sub">${up.some((u) => u.date === t) ? `오늘 ${up.filter((u) => u.date === t).map((u) => u.x.r.name).join(' · ')} 수업이 있어요` : '오늘은 수업이 없어요'}${asks.length ? ` · 확인할 것 ${asks.length}개` : ''}</p>
      <div class="grid">${askC}${upC}${moneyC}${dMsgCard(info)}${newsC}</div>`;
    return `<div class="layout has-rail"><div>${main}</div><aside class="rail">${clockWidget()}${hotCard('')}${stuC}</aside></div>`;
  }
  function drepView() {
    const info = dashInfo(), up = dashUp(info, 7);
    if (!UI.dStu || !info.some((x) => x.r.name === UI.dStu)) UI.dStu = (up[0] && up[0].x.r.name) || (info.find((x) => x.tutor) || info[0]).r.name;
    const n = UI.dStu, x = info.find((y) => y.r.name === n), todo = dashTodo(info).filter((y) => y.b === '보내기');
    const sw = `<div class="dsw">${info.map((y) => `<button class="dsw-b ${y.r.name === n ? 'on' : ''}" data-dsw="${esc(y.r.name)}" type="button" style="--sc:${esc(sColor(y.r))}"><b><i class="sv-dot"></i>${esc(y.r.name)}</b><span>${y.tutor ? (y.nx ? `${esc(wdShort(y.nx.date))}${dday(y.nx.date) === 0 ? ' 오늘' : ''}` : '요일 미정') : y.lz.parent ? '주간 리포트' : '숙제만'}</span></button>`).join('')}</div>`;
    const head = `<h1 class="h1">리포트</h1>${repSeg(info)}<p class="sub">학생을 고르면 바로 아래에서 골라 써요</p>`;
    if (loading(x) && n !== U.who) return `${head}${sw}<div class="grid"><section class="card c12"><div class="empty"><b>${esc(n)} 기록을 불러오는 중이에요</b></div></section></div>`;
    const asks = [];
    const askC = asks.length ? `<section class="card d-ask"><div class="card-h"><h2>${ic('bell')} 확인할 것</h2><span class="tag red">${asks.length}</span></div>${asks.map((a, i) => `<div class="d-ask-i"><div><b>${esc(a.t)}</b><span>${esc(a.d)}</span></div><div class="ck-g">${a.opts.map(([v, l]) => `<button class="btn sm ${v === 'y' || v === 's' ? 'soft' : ''}" data-ask="${i}" data-av="${esc(v)}" type="button">${esc(l)}</button>`).join('')}</div></div>`).join('')}</section>` : '';
    return `${head}${askC}${sw}${hasRep(x) ? dReportCard(n, x) : `<div class="grid">${dHwCard(n, x)}</div>`}`;
  }
  function dashBind() {
    $$('[data-ask]').forEach((b) => (b.onclick = () => { const a = (dashView.asks || [])[+b.dataset.ask]; if (a) dAskDo(a, b.dataset.av, b); }));
    $$('[data-tgo]').forEach((b) => (b.onclick = () => { UI.tab = b.dataset.tgo; render(); scrollTo(0, 0); }));
    if (UI.tab === 'dash') bindDMsg();
    if (UI.tab === 'thw') bindThw();
    const n = UI.dStu; if (!n || UI.tab !== 'treport') return;
    $$('[data-ask]').forEach((b) => (b.onclick = () => { const a = (dashView.asks || [])[+b.dataset.ask]; if (a) dAskDo(a, b.dataset.av, b); }));
    const D0 = drOf(n), touch = () => { D0.touched = true; };
    $$('[data-dsw]').forEach((b) => (b.onclick = () => { UI.dStu = b.dataset.dsw; render(); }));
    $$('[data-mmg2]').forEach((b) => (b.onclick = () => { D0.mmG = +b.dataset.mmg2; render(); }));
    $$('.dform [data-ck]').forEach((b) => (b.onclick = () => {
      const g = b.dataset.ck, v = b.dataset.v; touch();
      if (g === 'cu') { const u = +v; D0.units.has(u) ? D0.units.delete(u) : D0.units.add(u); if (D0.units.size) D0.H.add('@cu'); return render(); }
      const set = g === 'book' ? D0.book : g === 'hw' ? D0.hw : D0[g]; set.has(v) ? set.delete(v) : set.add(v); b.classList.toggle('on', g === 'Lx' ? !set.has(v) : set.has(v));
      if (g === 'H' && set.has(v) && !D0.hsj[v]) D0.hsj[v] = D0.hwSubj || '영어';
      render();
    }));
    $$('.dform [data-add]').forEach((b) => { const g = b.dataset.add, inp = $(`[data-addv="${g}"]`); const add = () => { const v = inp.value.trim(); if (!v) return inp.focus(); touch(); (g === 'hw' ? D0.hw : D0[g]).add(v); if (g === 'H') D0.hsj[v] = D0.hwSubj || '영어'; render(); }; b.onclick = add; inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); add(); } }; });
    $$('.dform [data-df]').forEach((el) => (el.oninput = el.onchange = () => { touch(); D0[el.dataset.df] = el.value; if (el.dataset.df === 'date' && !D0.id) { const r = rOf(n), c = dCls(r, dRowD(n)); D0.nth = String(dNth(r, c, el.value || today())); const ni = $('[data-df="nth"]'); if (ni) ni.value = D0.nth; } if (el.dataset.df === 'date' && el.value && !rOf(n).tutor) { D0.Lx = new Set(); render(); } }));
    $$('[data-sj]').forEach((b) => (b.onclick = () => { D0.hwSubj = b.dataset.sj; render(); }));
    const ch = $('[data-dch]'); if (ch) ch.onchange = () => { touch(); D0.ch = +ch.value; render(); };
    const nw = $('[data-dnew]'); if (nw) nw.onclick = () => { delete DR[n]; UI.drep = null; render(); };
    $$('[data-dsave]').forEach((b) => (b.onclick = () => dSave(n, !!b.dataset.dsave, b)));
    const hb = $('[data-dhw]'); if (hb) hb.onclick = () => dHwSave(n, hb);
    $$('[data-hwdel]').forEach((b) => (b.onclick = async () => { b.disabled = true; try { await dPut(n, 'hw', (d) => { d.hw = (d.hw || []).filter((h) => h.id !== b.dataset.hwdel); }); toast('뺐어요'); } catch (e) { toast('못 뺐어요. 인터넷을 봐 주세요'); } render(); }));
    const rp = UI.drep && UI.drep.n === n ? UI.drep : null;
    if (rp) $$('[data-rp]').forEach((b) => (b.onclick = async (e) => {
      const k = b.dataset.rp;
      if (k === 'share') { try { await navigator.share({ files: [rp.file] }); rp.sent(); toast('보냈어요'); } catch (er) { if (er && er.name !== 'AbortError') toast('공유가 안 돼요. 그림 복사로 보내 주세요'); } }
      else if (k === 'copy') { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': rp.blob })]); rp.sent(); toast('복사했어요. 카톡에 붙여 넣어요'); } catch (er) { toast('복사가 안 돼요. 그림 저장으로 보내 주세요'); } }
      else setTimeout(rp.sent, 300);
    }));
    dPv(n);
  }
  function autoProg(n) {
    const D0 = drOf(n); if (![...D0.book].some((b) => /천일문/.test(b)) || !CH_UNITS.length) return '';
    const past = lsnSorted(dCls(rOf(n), dRowD(n))).filter((l) => l.id !== D0.id && l.date <= D0.date), mx = Math.max(0, ...D0.units, ...past.flatMap((l) => l.units || []));
    return mx ? String(Math.round((mx / CH_UNITS.length) * 100)) : '';
  }
  function drBuild(n) {
    const r = rOf(n), D0 = drOf(n), cuOn = [...D0.book].some((b) => /천일문/.test(b)), units = cuOn ? [...D0.units].sort((a, b) => a - b) : [];
    const lesson = [...new Set([...(units.length ? cuLine(units) : []), ...(r.tutor ? [] : wkDone(dRowD(n), D0.date || today()).filter((t) => !D0.Lx.has(t))), ...D0.L])].join('\n'), hw = [...new Set([...(units.length && D0.H.has('@cu') ? [cuHw(units)] : []), ...hwGiven(n, D0.date || today()).map((h) => (h.subj && h.subj !== '영어' ? `${h.subj} ${h.grp || h.title}` : h.grp || h.title)), ...[...D0.H].filter((t) => t !== '@cu').map((t) => (D0.hsj[t] && D0.hsj[t] !== '영어' ? `${D0.hsj[t]} ${t}` : t))])].join('\n');
    const x = { date: D0.date || today(), nth: String(D0.nth || '').trim(), book: [...D0.book].join(' · '), units: D0.H.has('@cu') ? units : [], lesson, hw, score: String(D0.score || '').trim(), scoreTotal: String(D0.scoreTotal || '').trim(), progress: D0.progress || autoProg(n), comment: [...D0.C].join('\n') };
    if (!r.tutor) { const { finT, ...st } = wkStat(dRowD(n), x.date); x.stat = st; x.nth = ''; }
    else if (!x.score) { const as = autoScore(n); if (as) { x.score = as.score; x.scoreTotal = as.total; } }  // 점수를 안 적었으면 지난 7일 시험 점수 (미리보기 그림과 저장값이 같게)
    return x;
  }
  async function dSave(n, send, btn) {
    const r = rOf(n), lz = r.lesson || {}, D0 = drOf(n), x = drBuild(n);
    if (!x.lesson && !x.hw) return toast(r.tutor ? '오늘 한 것을 하나 이상 골라 주세요' : '이번 주 한 것을 하나 이상 골라 주세요');
    const t0 = btn.textContent; btn.disabled = true; btn.textContent = '저장하는 중…';
    let saved;
    try {
      saved = await dPut(n, ['cls', 'hw'], (D) => {
        if (!D.cls) D.cls = { ...dCls(r, null), level: lz.level || 'std' };
        const C = D.cls; C.list = C.list || []; C.mtot = C.mtot || {};
        if (lz.count === 'month' && String(D0.mt || '').trim()) C.mtot[ymOf(x.date)] = String(D0.mt).trim();
        let y = D0.id ? C.list.find((l) => l.id === D0.id) : C.list.find((l) => l.plan && l.date === x.date);
        if (!y) { y = { id: 'l' + Date.now() }; C.list.push(y); } delete y.plan; Object.assign(y, x);
        const nx = upcoming({ ...dCls(r, D), list: C.list }, addD(x.date, 1), 3).find((u) => !u.off), due = nx ? addD(nx.date, -1) : '', at = Date.now();
        const keep = (D.hw || []).filter((h) => h.src !== y.id), mine = (D.hw || []).filter((h) => h.src === y.id);
        if (false) D.hw = [...keep, ...[...D0.H].filter((t) => t !== '@cu').map((t, k) => { const o = mine.find((h) => h.title === t); return o || { id: 'h' + (at + k), title: t, subj: D0.hsj[t] || '영어', due, memo: '', done: false, at, src: y.id, ...(nxIdOf(n, t) ? { nx: nxIdOf(n, t) } : {}) }; })];
        return { ...y, mt: dTotal(r, C, x.date) };
      });
    } catch (e) { btn.disabled = false; btn.textContent = t0; return toast('저장이 안 됐어요. 인터넷을 보고 다시 눌러 주세요'); }
    D0.id = saved.id;
    if (!send) { UI.drep = null; render(); return toast(r.tutor ? `${n} 수업을 적었어요` : '리포트를 저장했어요'); }
    await dRepShow(n, saved);
  }
  async function dRepShow(n, L) {
    const r = rOf(n), lz = r.lesson || {}, d = dRowD(n);
    try { await loadReport(); await prLoad(); } catch (e) { return toast('리포트를 못 불러왔어요. 인터넷을 확인해 주세요'); }
    const name = (d && d.profile && d.profile.name) || n, cv = r.tutor ? document.createElement('canvas') : wkCanvas(n, L.date, d);
    if (r.tutor) Report.drawReport(cv, { name, date: L.date, nth: L.nth, total: L.mt || dTotal(r, dCls(r, d), L.date), book: L.book || lz.book || '', progress: L.progress, score: L.score, scoreTotal: L.scoreTotal, lesson: lines(L.lesson), homework: lines(L.hw), comment: lines(L.comment), ...rpExtra(r, L) });
    const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png')), file = new File([blob], `${name}_${L.date}${L.nth ? '_' + L.nth + '회차' : ''}.png`, { type: 'image/png' });
    if (UI.drep && UI.drep.url) URL.revokeObjectURL(UI.drep.url);
    UI.drep = { n, blob, file, url: URL.createObjectURL(blob), canShare: !!(navigator.canShare && navigator.canShare({ files: [file] })), sent: () => { dPut(n, 'cls', (D) => { const y = ((D.cls || {}).list || []).find((l) => l.id === L.id); if (y) y.sent = Date.now(); }).then(render).catch(() => toast('보낸 표시를 못 남겼어요')); } };
    UI.dStu = n; UI.tab = 'treport'; UI.repSeg = 'write'; render();
    setTimeout(() => { const e = $('.d-pv'); if (e) e.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'center' }); }, 60);
  }
  function dPv(n) {
    const img = $('#d-pv'); if (!img) return;
    Promise.all([loadReport(), prLoad()]).then(() => {
      if (!img.isConnected) return;
      const r = rOf(n), lz = r.lesson || {}, d = dRowD(n), L = drBuild(n), cv = r.tutor ? document.createElement('canvas') : wkCanvas(n, L.date, d);
      if (r.tutor) Report.drawReport(cv, { name: (d && d.profile && d.profile.name) || n, date: L.date, nth: L.nth, total: drOf(n).mt || dTotal(r, dCls(r, d), L.date), book: L.book || lz.book || '', progress: L.progress, score: L.score, scoreTotal: L.scoreTotal, lesson: lines(L.lesson), homework: lines(L.hw), comment: lines(L.comment), ...rpExtra(r, L) });
      img.src = cv.toDataURL('image/png');
    }).catch(() => {});
  }
  async function dHwSave(n, btn) {
    const D0 = drOf(n), x = dashInfo().find((y) => y.r.name === n) || {};
    if (!D0.hw.size) return toast('숙제를 하나 이상 골라 주세요');
    const due = x.nx ? addD(x.nx.date, -1) : '';
    const subj = D0.hwSubj || (x.tutor ? '영어' : '기타'), at = Date.now(), items = [...D0.hw].map((t, k) => ({ id: 'h' + (at + k), title: t, subj, due, memo: '', done: false, at }));
    btn.disabled = true; btn.textContent = '내는 중…';
    try { if (n === U.who) { S.hw = [...(S.hw || []), ...items]; save('hw'); } else await dPut(n, 'hw', (d) => { d.hw = [...(d.hw || []), ...items]; }); }
    catch (e) { btn.disabled = false; btn.textContent = '다시 내기'; return toast('못 냈어요. 인터넷을 보고 다시 눌러 주세요'); }
    D0.hw = new Set(); render(); toast(`${n}에게 숙제 ${items.length}개를 냈어요`);
  }
  // 수업 일정: 달력 (기록한 수업 ✓ · 앞으로의 수업 · 보강)
  function tschedView() {
    const info = dashInfo(), t = today(), ym = UI.calYm || ymOf(t), [Y, M] = ym.split('-').map(Number);
    const first = new Date(Y, M - 1, 1), days = new Date(Y, M, 0).getDate(), lead = first.getDay();
    const ev = {};
    for (const x of info.filter((y) => y.tutor)) {
      for (const l of x.c.list) if (ymOf(l.date) === ym) (ev[l.date] = ev[l.date] || []).push({ x, l, done: lsnDone(l), extra: !!l.plan, time: l.time || x.c.time });
      for (const u of upcoming(x.c, `${ym}-01`, 40)) if (ymOf(u.date) === ym && u.date >= t && !u.extra && !(ev[u.date] || []).some((e) => e.x === x)) (ev[u.date] = ev[u.date] || []).push({ x, off: u.off, time: u.time });
    }
    const cell = (d) => { const k = `${ym}-${String(d).padStart(2, '0')}`, E = (ev[k] || []).sort((a, b) => String(a.time).localeCompare(String(b.time))); return `<div class="cal-c ${k === t ? 'today' : ''} ${k < t ? 'past' : ''}"><b>${d}</b>${E.map((e) => `<button type="button" class="cal-e ${e.done ? 'done' : ''} ${e.off ? 'off' : ''}" style="--sc:${esc(sColor(e.x.r))}" data-dl="${esc(e.x.r.name)}${e.done ? '|' + e.l.id : ''}" title="${esc(e.x.r.name)}">${e.done ? '✓ ' : ''}${esc(e.x.r.name)}${e.time && !e.done ? `<i>${esc(timeKo(e.time).replace('오후 ', '').replace('오전 ', ''))}</i>` : ''}${e.extra ? '<i>보강</i>' : ''}${e.off ? '<i>쉼</i>' : ''}</button>`).join('')}</div>`; };
    const prev = ymOf(new Date(Y, M - 2, 1).toLocaleDateString('sv')), next = ymOf(new Date(Y, M, 1).toLocaleDateString('sv'));
    const cnt = info.filter((x) => x.tutor).map((x) => { const n = lsnSorted(x.c).filter((l) => ymOf(l.date) === ym).length + (+(((x.lz.monthSeed || {})[ym])) || 0), mt = x.c.mtot[ym]; return `<div class="li">${sAv(x.r)}<div class="body"><div class="t">${esc(x.r.name)}</div><div class="d">${x.c.wd.length ? `매주 ${x.c.wd.map((w) => WDK[w]).join('·')} ${esc(timeKo(x.c.time))}` : '요일 미정'}${x.lz.count === 'month' ? '' : x.lz.total ? ` · ${x.lz.total}회 묶음` : ''}</div></div><b class="num">${n}회${x.lz.count === 'month' && mt ? ` / ${esc(mt)}` : ''}</b></div>`; }).join('');
    return `<h1 class="h1">수업 일정</h1><p class="sub">수업을 누르면 바로 리포트를 써요. ✓는 적은 수업이에요</p>
      <div class="grid"><section class="card c8"><div class="card-h"><button class="btn sm" data-calm="${prev}" type="button">‹</button><h2>${Y}년 ${M}월</h2><button class="btn sm" data-calm="${next}" type="button">›</button></div>
      <div class="cal-g">${WDK.map((w) => `<div class="cal-w">${w}</div>`).join('')}${'<div class="cal-c empty"></div>'.repeat(lead)}${Array.from({ length: days }, (_, i) => cell(i + 1)).join('')}</div></section>
      <section class="card c4"><div class="card-h"><h2>${M}월 수업 횟수</h2></div><div class="list">${cnt}</div></section></div>`;
  }
  // 리포트: 수업 기록마다 보냄/안 보냄
  // 리포트 탭: 「리포트 쓰기 / 쓴 리포트」 하나씩 (2026-10-26 쓴 리포트가 아래에 붙어 있는 게 별로라서)
  const repSeg = (info) => { const un = info.filter(hasRep).reduce((a, x) => a + x.done.filter((l) => !l.sent && !(l.held && !l.lesson && !l.hw)).length, 0); return `<div class="seg rp-seg">${[['write', '리포트 쓰기'], ['list', `쓴 리포트${un ? ` <b class="red">${un}</b>` : ''}`]].map(([k, n]) => `<button type="button" class="${(UI.repSeg || 'write') === k ? 'on' : ''}" data-rps="${k}">${n}</button>`).join('')}</div>`; };
  function treportView() {
    if (UI.repSeg === 'list') return `<h1 class="h1">리포트</h1>${repSeg(dashInfo())}${treportList()}`;
    return drepView();
  }
  function treportList() {
    const info = dashInfo(), f = UI.repF || 'all';
    const L = info.filter((x) => hasRep(x) && (f === 'all' || x.r.name === f)).flatMap((x) => x.done.map((l) => ({ x, l }))).sort((a, b) => b.l.date.localeCompare(a.l.date)).slice(0, 40);
    const un = L.filter((y) => !y.l.sent).length;
    return `<p class="sub">${un ? `<b class="red">안 보낸 리포트 ${un}개</b>` : '밀린 리포트가 없어요'}</p>
      <div class="chips" style="margin-bottom:16px">${[['all', '전체'], ...info.filter(hasRep).map((x) => [x.r.name, x.r.name])].map(([k, n]) => `<button class="chip ${f === k ? 'on' : ''}" data-repf="${esc(k)}" type="button">${esc(n)}</button>`).join('')}</div>
      <section class="card">${L.length ? `<div class="list">${L.map(({ x, l }) => `<div class="li"><span class="ico ${l.sent ? 'tone-blue' : 'tone-red'}">${ic('memo')}</span><div class="body"><div class="t"><i class="sv-dot" style="--sc:${esc(sColor(x.r))}"></i>${esc(x.r.name)} · ${esc(wdShort(l.date))}${l.nth ? ` · ${esc(l.nth)}회차` : ''}</div><div class="d">${esc([l.book, (lines(l.lesson)[0] || '')].filter(Boolean).join(' · '))}</div></div>${l.held && !l.lesson && !l.hw ? '<span class="tag">리포트 안 씀</span>' : l.sent ? `<span class="tag blue">보냄${l.sent > 1e9 ? ' ' + esc(md(dateOf(l.sent))) : ''}</span>` : '<span class="tag red">안 보냄</span>'}<button class="btn sm" data-dl="${esc(x.r.name)}|${esc(l.id)}" type="button">고치기</button><button class="btn sm ${l.sent ? '' : 'primary'}" data-ds="${esc(x.r.name)}|${esc(l.id)}" type="button">${l.sent ? '다시' : '보내기'}</button></div>`).join('')}</div>` : `<div class="empty">${gh('idle', 'gh-empty')}<b>아직 적은 수업이 없어요</b><span>학생 탭에서 「수업 적기」를 눌러요</span></div>`}</section>`;
  }
  // 학생: 학생마다 코드 · 학교 · 수업 · 교재 · 리포트 받는 분
  // ───────── 선생님 「성적」 탭: 학생마다 시험 점수 그래프 · 숙제 했는지 · 주마다 푼 문제 ─────────
  // 점수 = 수업 시험(S.nx.done kind lesson, 월말 평가 포함) + 리포트에 적은 점수(수업 기록 score)
  function tgPts(x) {
    const d = x.d || {}, out = [], seen = new Set();
    for (const r of ((d.nx && d.nx.done) || []).filter((r) => r.kind === 'lesson' && r.n)) { const dt = String(r.id).slice(3); if (seen.has(dt)) continue; seen.add(dt); out.push({ date: dt, pct: Math.round((r.ok / r.n) * 100), txt: `${r.ok}/${r.n}`, big: /월말/.test(r.title || '') }); }
    for (const l of x.done || []) { const s = parseFloat(l.score), T = parseFloat(l.scoreTotal) || 100; if (!isNaN(s) && !seen.has(l.date)) { seen.add(l.date); out.push({ date: l.date, pct: Math.round((s / T) * 100), txt: `${l.score}/${l.scoreTotal || 100}` }); } }
    return out.sort((a, b) => a.date.localeCompare(b.date)).slice(-16);
  }
  function tgChart(P) {
    if (!P.length) return `<div class="empty">${ic('up')}<b>아직 점수가 없어요</b><span>수업 시험을 풀거나 리포트에 점수를 적으면 여기에 그려져요</span></div>`;
    const W = Math.round(Math.max(320, Math.min(1500, innerWidth - 120))), H = 220, l = 36, r = 40, t = 32, b = 30, xs = (i) => P.length === 1 ? W / 2 : l + (i * (W - l - r)) / (P.length - 1), ys = (v) => t + ((100 - v) * (H - t - b)) / 100;
    let s = `<svg class="tg-ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="시험 점수 그래프">`;
    for (const v of [0, 50, 100]) s += `<line x1="${l}" x2="${W - r}" y1="${ys(v)}" y2="${ys(v)}" class="tg-gl"/><text x="${l - 6}" y="${ys(v) + 4}" class="tg-ax" text-anchor="end">${v}</text>`;
    s += `<polyline class="tg-ln" points="${P.map((p, i) => `${xs(i)},${ys(p.pct)}`).join(' ')}"/>`;
    P.forEach((p, i) => { const last = i === P.length - 1; s += `<circle cx="${xs(i)}" cy="${ys(p.pct)}" r="${p.big ? 7 : last ? 6 : 4}" class="tg-dt ${p.big ? 'big' : ''} ${last ? 'last' : ''}"/>${last || p.big ? `<text x="${xs(i)}" y="${ys(p.pct) - 12}" text-anchor="middle" class="tg-v">${p.pct}점</text>` : ''}<text x="${xs(i)}" y="${H - 8}" text-anchor="middle" class="tg-ax">${md(p.date)}</text>`; });
    return s + '</svg>';
  }
  function tgradeView() {
    const info = dashInfo();
    if (!UI.gStu || !info.some((x) => x.r.name === UI.gStu)) UI.gStu = (info.find((x) => x.tutor) || info[0]).r.name;
    const n = UI.gStu, x = info.find((y) => y.r.name === n), t = today();
    const sw = `<div class="dsw">${info.map((y) => `<button class="dsw-b ${y.r.name === n ? 'on' : ''}" data-gsw="${esc(y.r.name)}" type="button" style="--sc:${esc(sColor(y.r))}"><b><i class="sv-dot"></i>${esc(y.r.name)}</b><span>${esc(y.r.level || '')}</span></button>`).join('')}</div>`;
    const head = `<h1 class="h1">성적</h1><p class="sub">시험 점수와 숙제를 학생마다 모아 봐요</p>`;
    if (loading(x) && n !== U.who) return `${head}${sw}<div class="grid"><section class="card c12"><div class="empty"><b>${esc(n)} 기록을 불러오는 중이에요</b></div></section></div>`;
    const d = x.d || {}, P = tgPts(x), last4 = P.slice(-4), avg = last4.length ? Math.round(last4.reduce((a, p) => a + p.pct, 0) / last4.length) : null;
    const mon = P.filter((p) => p.big).slice(-1)[0];
    const H = (d.hw || []).filter((h) => h.due).sort((a, b) => String(b.due).localeCompare(String(a.due)));
    const end = (h) => new Date(h.due + 'T23:59:59').getTime();
    const W = d.wrong || {}, stOf = (h) => hwDone(h, W) ? (hwDoneAt(h, W) > end(h) ? ['late', '늦게 했어요'] : ['ok', '했어요']) : h.due < t ? ['no', '안 했어요'] : ['wait', '하는 중'];
    const H4 = H.filter((h) => h.due >= addD(t, -27) && h.due <= t), h4ok = H4.filter((h) => hwDone(h, W)).length;
    const weeks = [7, 6, 5, 4, 3, 2, 1, 0].map((k) => { const dt = addD(t, -7 * k); return { dt, ...wkStat(d, dt) }; }), wmax = Math.max(1, ...weeks.map((w) => w.solved));
    const tile = (k, v, s, tone = '') => `<div class="tg-t"><span>${k}</span><b class="num ${tone}">${v}</b><small>${s}</small></div>`;
    const recs = ((d.nx && d.nx.done) || []).slice().sort((a, b) => b.at - a.at).slice(0, 10);
    return `${head}${sw}<div class="grid">
      <section class="card c12"><div class="tg-ts">
        ${tile('최근 시험 평균', avg == null ? '-' : avg + '점', last4.length ? `최근 ${last4.length}번` : '시험 기록 없음', avg != null && avg >= 80 ? 'blue' : '')}
        ${tile('월말 평가', mon ? mon.pct + '점' : '-', mon ? md(mon.date) : '달 마지막 수업에 봐요')}
        ${tile('숙제 한 비율', H4.length ? Math.round((h4ok / H4.length) * 100) + '%' : '-', H4.length ? `4주 동안 ${H4.length}개 중 ${h4ok}개` : '낸 숙제 없음', H4.length && h4ok < H4.length ? 'red' : '')}
        ${tile('이번 주 푼 문제', weeks[7].solved + '개', '지난 7일')}
      </div></section>
      <section class="card c12"><div class="card-h"><h2>${ic('up')} 시험 점수</h2><span class="tiny">큰 점은 월말 평가예요</span></div>${tgChart(P)}</section>
      <section class="card c7"><div class="card-h"><h2>${ic('hw')} 숙제 했는지</h2>${H.filter((h) => stOf(h)[0] === 'no').length ? `<span class="tag red">안 한 숙제 ${H.filter((h) => stOf(h)[0] === 'no').length}개</span>` : ''}</div>
        ${H.length ? `<div class="list">${H.slice(0, 12).map((h) => { const [k, lb] = stOf(h); return `<div class="li"><div class="body"><div class="t">${esc(h.title)}</div><div class="d">${[h.subj, md(h.due) + ' 까지'].filter(Boolean).map(esc).join(' · ')}</div></div><span class="tg-hs ${k}">${lb}</span></div>`; }).join('')}</div>` : `<div class="empty"><b>아직 낸 숙제가 없어요</b></div>`}</section>
      <section class="card c5"><div class="card-h"><h2>${ic('fire')} 주마다 푼 문제</h2></div><div class="tg-wk">${weeks.map((w, i) => `<div><b class="num">${w.solved || ''}</b><i style="height:${Math.round((w.solved / wmax) * 100)}%" class="${i === 7 ? 'now' : ''}"></i><span>${md(addD(w.dt, -6))}</span></div>`).join('')}</div></section>
      ${recs.length ? `<section class="card c12"><div class="card-h"><h2>${ic('pencil')} 푼 시험</h2></div><div class="list">${recs.map((r) => `<div class="li"><div class="ico">${ic(r.ok === r.n ? 'trophy' : 'ok')}</div><div class="body"><div class="t">${esc(r.title)}</div><div class="d">${md(dateOf(r.at))}${r.ms ? ' · ' + nxTime(r.ms) : ''}</div></div><b class="num">${r.ok} / ${r.n}</b></div>`).join('')}</div></section>` : ''}
    </div>`;
  }
  function tstuView() {
    const info = dashInfo();
    const sub = (x) => x.tutor ? `${x.c.wd.length ? `매주 ${x.c.wd.map((w) => WDK[w]).join('·')} ${esc(timeKo(x.c.time))}` : '요일 미정'}${x.lz.count === 'month' ? ' · 한 달 단위' : x.lz.total ? ` · ${x.lz.total}회 묶음` : ''}` : esc([(uniOf(x.p.uni) || {}).name, x.p.major].filter(Boolean).join(' ') || '목표 아직 없음');
    const row = (x) => { const r = x.r; return `<div class="st-r">
      <div class="st-who">${sAv(r)}<div><b>${esc(r.name)}</b> <span class="tag">${esc(r.level || '')}</span>${r.edition === 'english' ? ' <span class="tag">말랑영어</span>' : ''}<small>${[`코드 ${esc(r.alias || '-')}`, x.lz.parent ? `리포트 ${esc(x.lz.parent)}` : '', loading(x) ? '불러오는 중' : '접속 ' + agoTxt(x.last)].filter(Boolean).join(' · ')}</small></div></div>
      <div class="st-c st-w"><small>${x.tutor ? '수업' : '목표'}</small><b>${sub(x)}</b></div>
      <div class="st-c st-n"><small>이번 주</small><b>${loading(x) ? '…' : x.week + '문제'}</b></div>
      <div class="st-act">${hasRep(x) ? `<button class="btn sm primary" data-dl="${esc(r.name)}" type="button">리포트</button>` : ''}<button class="btn sm soft" data-dh="${esc(r.name)}" type="button">숙제</button><button class="btn sm" data-dgo="${esc(r.name)}|peek" type="button">화면 보기</button></div></div>`; };
    return `<h1 class="h1">학생</h1><p class="sub">코드는 학생이 처음 들어올 때 넣는 번호예요</p><section class="card st-l">${info.map(row).join('')}</section>`;
  }
  // 선생님 화면에서 학생 탭을 새로 열며 할 일(수업 적기 · 리포트 · 기록 고치기)을 이어서 열어요
  function dashGo(v) {
    const [n, act] = v.split('|');
    const url = act === 'peek' ? `stu=${encodeURIComponent(n)}&peek=1` : `stu=${encodeURIComponent(n)}&do=${encodeURIComponent(act || 'home')}`;  // peek: 학생이 보는 그대로 (선생님 단추 없음)
    if (STU_TAB) { try { sessionStorage.setItem('mu:after', act || 'home'); } catch (e) {} if (n === U.who) afterSwitch(); else switchStu(n); return; }
    const w = window.open(`${location.pathname}#${url}`, '_blank');
    if (!w) { location.hash = url; location.reload(); }  // 새 탭이 막히면 이 탭에서
  }
  // ── 선생님 홈에서 바로: 학생 페이지로 넘어가지 않고 여기서 리포트 · 숙제 ──
  const rOf = (n) => ROSTER.find((r) => r.name === n);
  async function dLoad(n) {
    const row = (roster.rows || []).find((x) => x.r.name === n);
    if (n === U.who) return S;
    if (row && row.d !== undefined) return row.d;
    try { const d = await rpc('univ_get', { p_student: n, p_code: U.key }); if (row) row.d = d; return d; } catch (e) { return null; }
  }
  function dNth(r, c, date, except) {
    const lz = r.lesson || {}, done = lsnSorted(c).filter((l) => l.id !== except && l.date <= date);
    if (lz.count === 'month') return done.filter((l) => ymOf(l.date) === ymOf(date)).length + (+((lz.monthSeed || {})[ymOf(date)]) || 0) + 1;
    const tot = +(c.total || lz.total) || 0, prev = done.find((l) => l.nth), base = prev ? +prev.nth : +lz.nth0 || 0;
    return base ? (tot ? (base % tot) + 1 : base + 1) : '';
  }
  const dTotal = (r, c, date) => ((r.lesson || {}).count === 'month' ? c.mtot[ymOf(date)] || '' : c.total || (r.lesson || {}).total || '');
  // 확인할 것: 이달 수업 횟수 · 묶음 끝 · 수업 날이 지났는데 기록이 없는 날 (앱을 쓰기 시작한 날부터)
  const ASK_FROM = '2026-10-26';
  function dAsks(info) {
    const t = today(), now = new Date(), out = [];
    for (const x of info.filter((y) => y.tutor && !loading(y))) {
      const r = x.r, lz = r.lesson || {}, c = x.c, n = r.name, ym = ymOf(t);
      if (lz.count === 'month' && !c.mtot[ym]) out.push({ n, k: 'mt', t: `${n} ${+ym.slice(5)}월 수업은 몇 번이에요?`, d: '리포트에 「5 / 9회」처럼 들어가요', opts: [4, 5, 6, 7, 8, 9, 10].map((v) => [v, v + '번']) });
      const L = x.done[0], tot = +(c.total || lz.total) || 0;
      if (lz.count !== 'month' && tot && L && +L.nth === tot && c.cyc !== L.id) out.push({ n, k: 'cyc', id: L.id, t: `${n} ${tot}회 묶음이 끝났어요`, d: '다음 묶음은 몇 회예요? 다음 수업이 1회차가 돼요', opts: [[4, '4회'], [8, '8회'], [0, '그만해요']] });
      for (let i = 14; i >= 0; i--) {
        const dd = addD(t, -i); if (dd < ASK_FROM) continue;
        const sched = c.wd.includes(new Date(dd + 'T00:00:00').getDay()) || c.list.some((l) => l.plan && l.date === dd);
        if (!sched || c.off.includes(dd) || c.list.some((l) => l.date === dd && lsnDone(l))) continue;
        if (i === 0) { const [h, m] = String(c.time || '23:00').split(':').map(Number); if (now.getHours() * 60 + now.getMinutes() < h * 60 + (m || 0) + 60) continue; }
        out.push({ n, k: 'did', date: dd, t: `${n} ${wdShort(dd)} 수업했나요?`, d: '「했어요」만 눌러도 회차가 세져요', opts: [['h', '했어요'], ['y', '리포트도 쓸게요'], ['n', '안 했어요']] });
      }
    }
    for (const x of info.filter((y) => hasRep(y) && !loading(y))) for (const l of x.unsent) out.push({ n: x.r.name, k: 'send', id: l.id, t: `${x.r.name} ${wdShort(l.date)} 리포트를 안 보냈어요`, d: `${(x.r.lesson || {}).parent || '어머니'}께 보낼까요?`, opts: [['s', '보내기'], ['k', '안 보내도 돼요']] });
    return out;
  }
  async function dAskDo(a, v, btn) {
    if (a.k === 'send' && v === 's') { const l = dCls(rOf(a.n), dRowD(a.n)).list.find((y) => y.id === a.id); if (l) { drFrom(a.n, l); dRepShow(a.n, l); } return; }
    const r = rOf(a.n); btn.disabled = true;
    if (a.k === 'did' && v === 'y') { UI.dStu = a.n; delete DR[a.n]; const D0 = drOf(a.n, true); D0.date = a.date; D0.nth = String(dNth(r, dCls(r, dRowD(a.n)), a.date)); D0.touched = true; UI.drep = null; render(); return; }
    try {
      await dPut(a.n, 'cls', (D) => {
        if (!D.cls) D.cls = { ...dCls(r, null), level: (r.lesson || {}).level || 'std' };
        const C = D.cls; C.mtot = C.mtot || {}; C.off = C.off || [];
        if (a.k === 'mt') C.mtot[ymOf(today())] = String(v);
        if (a.k === 'cyc') { C.cyc = a.id; if (+v) C.total = String(v); else C.wd = []; }
        if (a.k === 'send') { const y = (C.list || []).find((l) => l.id === a.id); if (y) y.skip = 1; }
        if (a.k === 'did' && v === 'n') C.off = [...new Set([...C.off, a.date])];
        if (a.k === 'did' && v === 'h') { const c0 = dCls(r, D), prev = lsnSorted(c0)[0]; C.list = C.list || []; C.list.push({ id: 'l' + Date.now(), date: a.date, nth: String(dNth(r, c0, a.date)), book: (prev && prev.book) || (r.lesson || {}).book || '', held: 1 }); }
      });
      toast(a.k === 'mt' ? `${a.n} 이달 ${v}번으로 했어요` : a.k === 'cyc' ? (+v ? `다음은 ${v}회 묶음이에요` : '수업 요일을 비웠어요') : a.k === 'send' ? '넘겼어요' : v === 'h' ? `${a.n} 수업으로 셌어요` : '안 한 날로 뺐어요');
    } catch (e) { btn.disabled = false; return toast('저장이 안 됐어요. 인터넷을 봐 주세요'); }
    render();
  }
  // 리포트 쓰기: 오늘 한 것 · 숙제만 쓰면 돼요. 날짜·회차·교재는 알아서, 점수·진도율·한마디는 접어 둠
  async function dLessonSheet(n, id) {
    const r = rOf(n); if (!r) return;
    const d = await dLoad(n), c = dCls(r, d), lz = r.lesson || {}, cur = id ? c.list.find((l) => l.id === id) : null, prev = lsnSorted(c)[0];
    const books = lz.books || (lz.book ? [lz.book] : []), date0 = cur ? cur.date : today();
    const L = cur || { date: date0, nth: dNth(r, c, date0), book: (prev && prev.book) || lz.book || '', units: [], lesson: '', hw: '', score: '', scoreTotal: '', progress: '', comment: '' };
    const pick = new Set(String(L.book || '').split(' · ').filter(Boolean)), monthly = lz.count === 'month', who = lz.parent || '어머니';
    const tutors = ROSTER.filter((x) => x.tutor), hasCu = () => CH_UNITS.length && [...pick].some((b) => /천일문/.test(b));
    sheet(`<div class="chips" style="margin-bottom:16px">${tutors.map((x) => `<button class="chip ${x.name === n ? 'on' : ''}" data-dsw="${esc(x.name)}" type="button"><i class="sv-dot" style="--sc:${esc(sColor(x))}"></i>${esc(x.name)}</button>`).join('')}</div>
      <h2>${esc(n)} 리포트</h2><p class="sub" id="dl-meta"></p>
      <div class="field"><label>오늘 한 것</label><textarea class="inp" id="dl-l" rows="3" placeholder="한 줄에 하나씩 · 예) 관계대명사 what">${esc(L.lesson || '')}</textarea></div>
      <div class="field"><label>숙제</label><textarea class="inp" id="dl-h" rows="2" placeholder="한 줄에 하나씩 · 예) 워크북 40~45쪽">${esc(L.hw || '')}</textarea></div>
      <div class="field" id="dl-uf"><label>천일문 유닛 <span class="tiny">적으면 ${esc(n)} 앱에 문제 숙제로 나가요</span></label><input class="inp" id="dl-u" placeholder="예) 64-72" value="${esc(unitsText(L.units || []))}"></div>
      <details class="dl-more"><summary>날짜 · 회차 · 교재 · 점수 · 한마디</summary>
        <div class="row" style="gap:12px;margin-top:12px"><div class="field" style="flex:2"><label>날짜</label><input class="inp" type="date" id="dl-d" value="${esc(L.date)}"></div><div class="field" style="flex:1"><label>회차</label><input class="inp" id="dl-n" inputmode="numeric" value="${esc(L.nth || '')}"></div>${monthly ? `<div class="field" style="flex:1"><label>이달 전체</label><input class="inp" id="dl-mt" inputmode="numeric" value="${esc(dTotal(r, c, L.date))}"></div>` : ''}</div>
        ${books.length ? `<div class="field"><label>교재</label><div class="chips">${[...new Set([...books, ...pick])].map((b) => `<button class="chip sm ${pick.has(b) ? 'on' : ''}" data-dbk="${esc(b)}" type="button">${esc(b)}</button>`).join('')}</div></div>` : ''}
        <div class="row" style="gap:12px"><div class="field" style="flex:1"><label>시험 점수</label><input class="inp" id="dl-s" inputmode="numeric" value="${esc(L.score || '')}"></div><div class="field" style="flex:1"><label>만점</label><input class="inp" id="dl-st" inputmode="numeric" value="${esc(L.scoreTotal || '')}"></div><div class="field" style="flex:1"><label>진도율 %</label><input class="inp" id="dl-p" inputmode="numeric" value="${esc(L.progress || '')}"></div></div>
        <div class="field"><label>${esc(who)}께 한마디</label><textarea class="inp" id="dl-c" rows="2">${esc(L.comment || '')}</textarea></div>
      </details>
      <button class="btn primary big block" id="dl-send" type="button">저장하고 ${esc(who)}께 보내기</button>
      <button class="btn big block" id="dl-ok" type="button" style="margin-top:8px">저장만</button>`, (el, close) => {
      const v = (k) => ($('#' + k, el) || { value: '' }).value.trim();
      const meta = () => { $('#dl-meta', el).textContent = [md(v('dl-d') || L.date) + ' ' + wdName(v('dl-d') || L.date), v('dl-n') ? v('dl-n') + '회차' : '', [...pick].join(' · ')].filter(Boolean).join(' · '); $('#dl-uf', el).hidden = !hasCu(); };
      meta();
      el.querySelectorAll('[data-dsw]').forEach((b) => (b.onclick = () => { if (b.dataset.dsw !== n) dLessonSheet(b.dataset.dsw); }));
      el.querySelectorAll('[data-dbk]').forEach((b) => (b.onclick = () => { const k = b.dataset.dbk; pick.has(k) ? pick.delete(k) : pick.add(k); b.classList.toggle('on', pick.has(k)); meta(); }));
      $('#dl-d', el).onchange = () => { if (!cur) $('#dl-n', el).value = dNth(r, c, v('dl-d') || today()); meta(); };
      $('#dl-n', el).oninput = meta;
      const go = async (send) => {
        const units = hasCu() ? parseUnits(v('dl-u')) : [];
        let lesson = v('dl-l'), hw = v('dl-h');
        if (units.length && !/천일문/.test(hw)) hw = [hw, `말랑대학 천일문 Unit ${unitsText(units)} 문제 풀기`].filter(Boolean).join('\n');
        if (!lesson && !hw && !units.length) { $('#dl-l', el).focus(); return toast('오늘 한 것을 적어 주세요'); }
        const x = { date: v('dl-d') || today(), nth: v('dl-n'), book: [...pick].join(' · '), units, gram: cur ? cur.gram || [] : [], lesson, hw, score: v('dl-s'), scoreTotal: v('dl-st'), progress: v('dl-p'), comment: v('dl-c') };
        const btn = $(send ? '#dl-send' : '#dl-ok', el), t0 = btn.textContent; btn.disabled = true; btn.textContent = '저장하는 중…';
        let saved;
        try {
          saved = await dPut(n, 'cls', (D) => {
            if (!D.cls) D.cls = { ...dCls(r, null), level: lz.level || 'std' };
            const C = D.cls; C.list = C.list || []; C.mtot = C.mtot || {};
            if (monthly) { const m = v('dl-mt'); if (m) C.mtot[ymOf(x.date)] = m; }
            let y = cur ? C.list.find((l) => l.id === cur.id) : C.list.find((l) => l.plan && l.date === x.date);
            if (!y) { y = { id: 'l' + Date.now() }; C.list.push(y); } delete y.plan; Object.assign(y, x); return { ...y, mt: dTotal(r, C, x.date) };
          });
        } catch (e) { btn.disabled = false; btn.textContent = t0; return toast('저장이 안 됐어요. 인터넷을 보고 다시 눌러 주세요'); }
        render();
        if (!send) { close(); return toast(`${n} 수업을 적었어요`); }
        dReport(n, saved.id, saved);
      };
      $('#dl-send', el).onclick = () => go(true);
      $('#dl-ok', el).onclick = () => go(false);
    });
  }
  async function dReport(n, id, L0) {
    const r = rOf(n), d = await dLoad(n), c = dCls(r, d), L = L0 || c.list.find((l) => l.id === id); if (!L) return toast('그 수업 기록을 못 찾았어요');
    const lz = r.lesson || {}; if (!r.tutor) await prLoad();
    reportOpen({ name: (d && d.profile && d.profile.name) || n, L, total: L.mt || dTotal(r, c, L.date), book: L.book || lz.book || '', who: lz.parent || '어머니', extra: rpExtra(r, L), cv0: r.tutor ? null : wkCanvas(n, L.date, d),
      sent: () => { dPut(n, 'cls', (D) => { const y = ((D.cls || {}).list || []).find((l) => l.id === L.id); if (y) y.sent = Date.now(); }).then(render).catch(() => toast('보낸 표시를 못 남겼어요')); } });
  }
  // 학생을 누르면: 그 학생으로 할 일만 (학생 화면은 여기서 고를 때만 새 탭)
  function dStuSheet(n) {
    const r = rOf(n), x = dashInfo().find((y) => y.r.name === n) || {};
    sheet(`<div class="row" style="gap:12px;align-items:center;margin-bottom:20px">${sAv(r, true)}<div><h2 style="margin:0">${esc(n)}</h2><p class="sub" style="margin:0">${x.tutor ? (x.nx ? `다음 수업 ${esc(wdShort(x.nx.date))}` : '수업 요일 미정') : '학교 숙제·공부'}</p></div></div>
      <div class="qa-pks">${x.tutor ? `<button class="qa-pk" type="button" data-act="lsn"><span class="qa-ic blue">${ic('write')}</span><span class="body"><b>리포트 쓰기</b><small>오늘 한 것 · 숙제 적고 보내기</small></span><span class="chev"></span></button>` : ''}
      <button class="qa-pk" type="button" data-act="hw"><span class="qa-ic green">${ic('hw')}</span><span class="body"><b>숙제 내기</b><small>${esc(n)} 숙제 목록에 바로 떠요</small></span><span class="chev"></span></button>
      ${x.tutor && x.L ? `<button class="qa-pk" type="button" data-act="last"><span class="qa-ic amber">${ic('memo')}</span><span class="body"><b>지난 리포트 고치기</b><small>${esc(wdShort(x.L.date))}${x.L.sent ? ' · 보냄' : ' · 안 보냄'}</small></span><span class="chev"></span></button>` : ''}</div>`, (el) => {
      el.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => { const a = b.dataset.act; if (a === 'lsn') dLessonSheet(n); else if (a === 'hw') hwAddSheet(n); else dLessonSheet(n, x.L.id); }));
    });
  }
  function dashPick(act) {
    const L = ROSTER.filter((r) => act !== 'lsn' || r.tutor), info = dashInfo();
    sheet(`<h2>누구 리포트를 쓸까요?</h2><div class="qa-pks" style="margin-top:16px">${L.map((r) => { const x = info.find((y) => y.r.name === r.name) || {}; return `<button class="qa-pk" type="button" data-pk="${esc(r.name)}">${sAv(r)}<span class="body"><b>${esc(r.name)}</b><small>${x.L ? `지난 수업 ${esc(md(x.L.date))}` : '아직 적은 수업이 없어요'}</small></span><span class="chev"></span></button>`; }).join('')}</div>`, (el) => {
      el.querySelectorAll('[data-pk]').forEach((b) => (b.onclick = () => dLessonSheet(b.dataset.pk)));
    });
  }
  function afterSwitch() {
    let a = ''; try { a = sessionStorage.getItem('mu:after') || ''; sessionStorage.removeItem('mu:after'); } catch (e) {}
    if (!a) return; UI.tab = 'home'; UI.run = null; render();
    if (a === 'lsn') setTimeout(() => lessonSheet(''), 300);
    else if (a.startsWith('lsn:')) setTimeout(() => lessonSheet(a.slice(4)), 300);
    else if (a.startsWith('send:')) setTimeout(() => reportSheet(a.slice(5)), 300);
    else if (a === 'hw') setTimeout(() => hwAddSheet(), 300);
  }
  // 과외 학생 홈 맨 위: 다음 수업 · 지난 수업 · 숙제 (선생님이면 수업 적기 · 리포트 단추)
  function lessonHero() {
    const c = cls(), nx = nextLesson(), L = lastLesson(), tk = [...tutorTasks(), ...(S.hw || []).filter((h) => !(h.grp && h.due > today()) && (!hwDone(h) || h.due === today())).map((h) => ({ done: hwDone(h) }))], dn = tk.filter((x) => x.done).length, dd = nx ? dday(nx.date) : null, p = S.profile, ym = ymOf(today());
    const third = p.school ? [esc(String(p.school).replace('중학교', '중').replace('고등학교', '고')), `${p.grade}학년`] : MONTHLY ? [`${+ym.slice(5)}월 수업`, `${lsnSorted().filter((l) => ymOf(l.date) === ym).length + (+((LS0.monthSeed || {})[ym]) || 0)}회`] : ['회차', L && L.nth ? `${esc(L.nth)}회차` : '-'];
    const u = uniOf(p.uni), tabUni = TABS.some((t) => t[0] === 'uni');
    // 목표 대학: 정윤 홈처럼 로고를 크게 (윤건·지원, 10/26)
    const goal = tabUni ? `<button type="button" class="who ls-goal" data-go="uni">${emb(u, 'xl')}<div style="min-width:0;flex:1"><div class="goal-t">${esc(p.name)}의 목표</div><div class="goal-n">${u ? esc(u.name) : '목표 대학을 골라 주세요'}</div><div class="goal-m">${u ? esc(p.major || (p.field ? p.field + ' 계열' : '')) : '눌러서 고르기'}</div></div><span class="tag" style="flex:none">${u ? '바꾸기' : '고르기'}</span></button>` : '';
    return `<section class="card c12 hero ls-hero"><div class="hero-band" style="background:${u ? esc(u.color) : esc(ST.color || 'var(--blue)')}"></div>${goal}
      <div class="who ${goal ? 'ls-next' : ''}"><div style="min-width:0;flex:1"><div class="goal-t">다음 수업${nx && nx.extra ? ' · 보강' : ''}</div><div class="goal-n">${nx ? `${esc(md(nx.date))} ${esc(wdName(nx.date))}` : TEACHER ? '수업 요일을 정해 주세요' : '선생님이 곧 정해 줘요'}</div><div class="goal-m">${nx && nx.time ? esc(timeKo(nx.time)) : ''}</div></div>${nx ? `<b class="dh-dd num">${dd === 0 ? '오늘' : 'D-' + dd}</b>` : ''}</div>
      ${(() => { const ex = (ST.exams || []).filter((e) => e.date >= today() && dday(e.date) <= 30); return ex.length ? `<div class="ls-exams">${ex.map((e) => `<div class="ls-ex"><span class="ls-ex-t">시험</span><div class="ls-ex-b"><b>${esc(e.title)}</b><span>${esc(md(e.date))} ${esc(wdName(e.date))}</span></div><b class="ls-ex-d num">${dday(e.date) === 0 ? '오늘' : 'D-' + dday(e.date)}</b></div>`).join('')}</div>` : ''; })()}
      <div class="dday"><div><span>지난 수업</span><b class="num">${L ? esc(md(L.date)) : '-'}</b></div><div><span>숙제</span><b class="num ${tk.length && dn === tk.length ? 'blue' : ''}">${tk.length ? `${dn} / ${tk.length}` : '없어요'}</b></div><div><span>${third[0]}</span><b>${third[1]}</b></div></div>
      ${L && (lines(L.lesson).length || lines(L.hw).length) ? `<div class="ls-last"><div class="tiny">${esc(md(L.date))} 수업${L.book ? ' · ' + esc(L.book) : ''}</div>${lines(L.lesson).length ? `<ul class="ls-ul">${lines(L.lesson).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${lines(L.hw).length ? `<div class="tiny" style="margin-top:8px">숙제</div><ul class="ls-ul">${lines(L.hw).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>` : ''}
      ${tk.length ? `<button class="btn primary big block" data-go="hw" type="button">${dn === tk.length ? '숙제 다 했어요 · 다시 보기' : `숙제하러 가기 · ${tk.length - dn}개 남았어요`}</button>` : ''}
      ${TEACHER ? `<div class="ls-tools"><button class="btn primary" data-lsn="" type="button">수업 적기 · 리포트 쓰기</button><button class="btn soft" data-hwadd type="button">숙제 내기</button>${L ? `<button class="btn soft" data-lsnsend="${esc(L.id)}" type="button">${esc(LS0.parent || '어머니')}께 리포트</button>${`<button class="btn" data-lsn="${esc(L.id)}" type="button">지난 기록 고치기</button>`}` : ''}<button class="btn" data-lsnset type="button">수업 날 · 난도</button></div>` : ''}</section>`;
  }

  // ───────── 틀 · 메뉴 ─────────
  const TABS = [['home', '홈', 'home'], ['hw', '숙제', 'hw'], ['exam', '시험', 'pencil'], ['wrong', '오답', 'wrong'], ['book', '교재', 'books'], ['score', '성적', 'score'], ['uni', '대학', 'school'], ['sgb', '생기부', 'sgb'], ['picks', '진로', 'dna'], ['news', '소식', 'news']].filter((t) => (!ST.tabs || ST.tabs.includes(t[0])) && (t[0] !== 'exam' || Object.keys(NXSETS).length || NX_CH.length || NX_JG.length));  // 시험 탭은 시험이 있는 학생만
  const DASH_ONLY = TEACHER && !STU_TAB && ROSTER.length > 1;  // 선생님 첫 탭은 학생 관리만 (학생 화면은 새 탭으로)
  if (DASH_ONLY) TABS.splice(0, TABS.length, ['dash', '홈', 'home'], ['treport', '리포트', 'memo'], ['thw', '숙제', 'hw'], ['tgrade', '성적', 'score'], ['tsched', '수업 일정', 'cal'], ['news', '소식', 'news'], ['tstu', '학생', 'trophy']);
  function nav() {
    const bm = Object.values(bkS().marks), cnt = { hw: leftItems().length, wrong: todayWr().length, book: TEACHER ? bm.filter((m) => m.q && !m.ans).length : bm.filter((m) => m.q && m.ans && !m.ansSeen).length };
    const btn = (t, bottom) => `<button type="button" class="${UI.tab === t[0] ? 'on' : ''}" data-go="${t[0]}">${bottom ? `<img src="icons/${IC[t[2]]}.svg" alt="">` : ''}${t[1]}${cnt[t[0]] ? `<span class="cnt">${cnt[t[0]] > 99 ? '99+' : cnt[t[0]]}</span>` : ''}</button>`;
    $('#tabs-top').innerHTML = TABS.map((t) => btn(t, false)).join('');
    const tb = $('#tabs-bottom'), sl = tb.scrollLeft; tb.innerHTML = TABS.map((t) => btn(t, true)).join(''); tb.scrollLeft = sl;
    const on = $('button.on', tb); if (on && (on.offsetLeft < tb.scrollLeft || on.offsetLeft + on.offsetWidth > tb.scrollLeft + tb.clientWidth)) tb.scrollTo({ left: on.offsetLeft - (tb.clientWidth - on.offsetWidth) / 2, behavior: RM() ? 'auto' : 'smooth' });
    const u = uniOf(S.profile.uni);
    const bt = $('#bell-top'); if (bt) { bt.innerHTML = bellSVG(SOUND); bt.classList.toggle('on', SOUND); bt.setAttribute('aria-label', SOUND ? '소리 켜짐, 눌러서 무음' : '무음, 눌러서 소리 켜기'); }
    const ct = $('#coin-top'); if (ct) ct.hidden = !WALLET || DASH_ONLY; if (ct && WALLET) { if (!coinPend) coinShown = wBal(); ct.innerHTML = `${ic('coin')}<b class="num">${won(coinShown)}</b>`; ct.setAttribute('aria-label', `말랑 용돈 ${won(coinShown)}`); ct.classList.toggle('on', UI.run && UI.run.kind === 'wallet'); }
    const pt = $('#pomo-top'); if (pt) { const n = pDay().n; pt.innerHTML = `${ic('tomato')}<b class="num">${n}</b>`; pt.classList.toggle('on', !!n); pt.setAttribute('aria-label', `토마토 타이머 · 오늘 ${n}개`); }
    { const ptp = $('#pomo-top'); if (ptp) ptp.hidden = TEACHER; }
    $('#me').innerHTML = DASH_ONLY ? `<span>${esc(TP.name)}</span><span class="av" style="background:var(--t1)">${esc(TP.name.slice(0, 1))}</span>` : `<span>${esc(S.profile.name)}</span>${avatarHtml('sm')}`;
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
  // 폰·브라우저 뒤로가기: 문제 화면에 들어가거나 홈에서 다른 탭으로 가면 기록을 하나 쌓고, 뒤로가기는 한 칸씩 빠져나와요 (10/27 주아가 폰에서 뒤로가기가 안 됐어요)
  const navAt = () => (UI.run ? 'run' : UI.tab);
  window.addEventListener('popstate', () => { render.pop = 1; if (UI.run) UI.run = null; else if (UI.tab !== 'home' && !TEACHER) UI.tab = 'home'; render(); window.scrollTo(0, 0); });
  function render() {
    { const k = navAt(), was = render.nav; if (was && k !== was && !render.pop && (k === 'run' || was === 'home')) try { history.pushState({ mu: k }, ''); } catch (e) {} render.nav = k; render.pop = 0; }
    nxReg();
    // 1학년 2학기는 아직 학기 최종 등급이 없어서, 먼저 넣은 등급은 중간고사 등급으로 옮겨요 (한 번만)
    if (S.naesin && S.naesin['1-2'] && !S.naesin._mid12) { for (const r of Object.values(S.naesin['1-2'])) if (r && r.grade && r.midG == null && r.finG == null) { r.midG = r.grade; delete r.grade; } S.naesin._mid12 = 1; save('naesin'); }
    if (!UI.run || UI.run.kind !== 'jl') jlStop();  // 리스닝 화면을 나가면 소리도 멈춰요
    nav(); applySkin();
    let html = '';
    syncGoals();
    redoFix();
    if (UI.run) html = UI.run.kind === 'sci' ? sciRun() : UI.run.kind === 'unit' ? unitRun() : UI.run.kind === 'gram' ? gramRun() : UI.run.kind === 'jl' ? jlRun() : UI.run.kind === 'jr' ? jrRun() : UI.run.kind === 'jw' ? jwRun() : UI.run.kind === 'words' ? wordsRun() : UI.run.kind === 'retry' ? retryRun() : UI.run.kind === 'g3' ? g3Run() : UI.run.kind === 'drill' ? drillRun() : UI.run.kind === 'concept' ? conceptRun() : UI.run.kind === 'fin' ? finRun() : UI.run.kind === 'perf' ? perfRun() : UI.run.kind === 'pomo' ? pomoRun() : UI.run.kind === 'wallet' ? walletRun() : UI.run.kind === 'book' ? bookRun() : UI.run.kind === 'mbw' ? mbwRun() : UI.run.kind === 'nx' ? nxRun() : UI.run.kind === 'nxw' ? nxwRun() : '';
    else html = UI.tab === 'dash' ? dashView() : UI.tab === 'tsched' ? tschedView() : UI.tab === 'treport' ? treportView() : UI.tab === 'tstu' ? tstuView() : UI.tab === 'tgrade' ? tgradeView() : UI.tab === 'thw' ? thwView() : UI.tab === 'home' ? home() : UI.tab === 'hw' ? (UI.lib ? libView() : UI.nxUnit ? nxUnitView() : hwView()) : UI.tab === 'wrong' ? wrongView() : UI.tab === 'score' ? scoreView() : UI.tab === 'me' ? meView() : UI.tab === 'tme' ? tmeView() : UI.tab === 'picks' ? picksView() : UI.tab === 'uni' ? uniTabView() : UI.tab === 'news' ? newsView() : UI.tab === 'book' ? bookView() : UI.tab === 'exam' ? examView() : sgbView();
    // 화면 이동 방향: 문제·상세로 들어가면 오른쪽에서, 나오면 왼쪽에서, 탭은 탭 순서대로
    const view = UI.run ? 'run:' + UI.run.kind : UI.tab + (UI.lib || '') + (UI.tab === 'hw' ? (UI.nxUnit || '') + (UI.nxSubj || '') : '') + (UI.tab === 'picks' ? UI.pkTab || '' : '') + (UI.tab === 'score' ? UI.scoreSeg + (UI.mockId || '') : '');
    const depth = UI.run ? 2 : UI.lib || (UI.tab === 'score' && UI.mockId) || (UI.tab === 'hw' && UI.nxUnit) ? 1 : 0, ti = TABS.findIndex((t) => t[0] === UI.tab);
    const qm = html.match(/class="q-no">([\s\S]*?)<\/div>/), qk = UI.run ? (qm ? qm[1] : html.includes('done-card') ? 'done' : html.includes('class="lesson"') ? 'lesson' : '') : '';
    const sub = [UI.wrongSubj, UI.sgbArea, UI.semester, UI.chartSubj, UI.mockSubj].join('|');
    let dir = '';
    if (view !== render.view) dir = render.view == null ? 'boot' : depth > render.depth ? 'push' : depth < render.depth ? 'pop' : ti !== render.ti ? ((ti < 0 ? 9 : ti) > (render.ti < 0 ? 9 : render.ti) ? 'tabR' : 'tabL') : 'side';
    else if (qk && render.qk && qk !== render.qk) dir = 'push';
    if (dir === 'push' || dir === 'pop') ghost(dir);
    main.classList.remove('enter', 'soft', 'boot', 'push', 'pop', 'tabL', 'tabR', 'side');
    main.innerHTML = (TEACHER && !DASH_ONLY ? teacherBand() : '') + html;
    // 탭·칸 바꿀 때는 밀지 않고, 카드 자리만 회색 실루엣으로 잠깐 보였다가 내용이 스르륵 떠요
    if (dir === 'side' || dir === 'tabL' || dir === 'tabR') { dir = ''; if (!RM()) { clearTimeout(render.sk); main.classList.remove('skel-out'); skelPaint(main); main.classList.add('skel'); render.sk = setTimeout(() => { main.classList.remove('skel'); $('.skel-ov', main)?.remove(); main.classList.add('skel-out'); setTimeout(() => main.classList.remove('skel-out'), 260); }, 280); } if (view !== render.view) cheerCheck.combo = 0; setTimeout(() => countUp(main), 300); }
    if (dir) { $$('main .card, main .h1, main .sub, main .seg, main .chips').forEach((c, i) => c.style.setProperty('--i', Math.min(i, 10))); void main.offsetWidth; main.classList.add('enter', dir); if (view !== render.view) cheerCheck.combo = 0; setTimeout(() => countUp(main), dir === 'boot' ? 260 : 120); }
    else if (sub !== render.sub) { void main.offsetWidth; main.classList.add('soft'); }
    Object.assign(render, { view, depth, ti, qk, sub });
    bind();
    segSlide();
    petDock();
    giftCheck();
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
    $$(':is(.grow-big b, .grow-t b, .done-score b, .arch .c b, .scorebox b, .stat-row b, .sgb-area .a b)', root).forEach((el) => {
      const t = [...el.childNodes].find((n) => n.nodeType === 3 && /\d/.test(n.nodeValue)); if (!t || el.closest('.page-ghost') || /등급/.test(el.parentNode.textContent)) return;  // 등급은 0부터 세면 이상해요
      if (el.dataset.cu) return; // 이미 세는 중이거나 센 숫자 — 다시 세면 중간값을 끝값으로 읽어요
      const m = t.nodeValue.match(/^(\s*)(\d+(?:\.\d+)?)(?![\d,])([\s\S]*)$/); if (!m || !+m[2]) return;
      el.dataset.cu = '1';
      const end = +m[2], dec = (m[2].split('.')[1] || '').length, t0 = performance.now(), D = 650;
      const step = (now) => { const k = Math.min(1, (now - t0) / D); t.nodeValue = m[1] + (end * (1 - Math.pow(1 - k, 3))).toFixed(dec) + m[3]; if (k < 1 && t.isConnected) requestAnimationFrame(step); };
      t.nodeValue = m[1] + (0).toFixed(dec) + m[3]; requestAnimationFrame(step); setTimeout(() => { if (t.isConnected) t.nodeValue = m[1] + m[2] + m[3]; }, D + 150); // 탭이 가려져 그리기가 멈춰도 끝값은 꼭
    });
  }
  function go(tab) { UI.tab = tab; UI.run = null; UI.lib = null; UI.nxUnit = null; if (tab !== 'score') UI.mockId = null; render(); window.scrollTo(0, 0); }
  function startTask(k) {
    if (k === 'sci') { UI.tab = 'hw'; UI.run = { kind: 'sci' }; }
    else if (k === 'unit') { UI.tab = 'hw'; UI.run = { kind: 'unit' }; }
    else if (k === 'words') { UI.tab = 'hw'; UI.run = { kind: 'words' }; }
    else if (k === 'g3') { UI.tab = 'hw'; UI.run = { kind: 'g3' }; }
    else if (k.startsWith('news:')) return newsSheet(k.slice(5));
    else if (k.startsWith('my:')) return mySheet(k.slice(3));
    else if (k.startsWith('myprep:')) { const it = myS().items.find((x) => x.id === k.slice(7)); if (!it) return; const t = today(); if (it.prep === t) { it.prep = null; toast('준비 표시를 지웠어요'); } else { it.prep = t; earn('myprep:' + it.id, 100, '수행 준비'); boom(innerWidth / 2, innerHeight * 0.4, 2); toast('준비 끝! 내일 잘해요'); } save('my'); render(); return; }
    else if (k.startsWith('ink:')) { const [, c, n] = k.split(':'); return inkLec(c, n); }
    else if (k === 'fin' || k.startsWith('fin:')) { const sj = k.slice(4), c = sj && (finToday().find((x) => x.subj === sj && !finDone(x)) || FIN_ORDER.find((x) => x.subj === sj && !finDone(x)) || finToday().find((x) => x.subj === sj)); UI.tab = 'hw'; UI.run = c ? { kind: 'fin', cid: c.id, read: finDone(c) } : { kind: 'fin' }; }
    else if (k.startsWith('drill:')) { UI.tab = 'hw'; UI.run = { kind: 'drill', id: k.slice(6) }; }
    else if (k.startsWith('jg:')) { const [, u, st, sc] = k.split(':'); UI.tab = 'hw'; UI.run = { kind: 'gram', unit: +u, step: +st, secs: sc ? sc.split('') : null }; }
    else if (k.startsWith('cu:')) { UI.tab = 'hw'; UI.run = { kind: 'unit', ref: CH_UNITS.findIndex((u) => String(u.unit) === k.slice(3)), back: 'hw' }; }
    else { UI.tab = 'hw'; UI.run = null; }
    render(); window.scrollTo(0, 0);
  }
  function bind() {
    $$('[data-jgo]').forEach((x) => (x.onclick = () => { const [u, st] = x.dataset.jgo.split('|'); UI.tab = 'hw'; UI.run = { kind: 'gram', unit: +u, step: +st }; render(); window.scrollTo(0, 0); }));
    $$('[data-jlo],[data-jro],[data-jwo]').forEach((x) => (x.onclick = () => { const kind = x.dataset.jlo ? 'jl' : x.dataset.jro ? 'jr' : 'jw', [id, m] = (x.dataset.jlo || x.dataset.jro || x.dataset.jwo).split('|'); UI.tab = 'hw'; UI.run = kind === 'jw' ? { kind, id, m } : { kind, unit: +id, m }; render(); window.scrollTo(0, 0); }));
    $$('[data-calm]').forEach((x) => (x.onclick = () => { UI.calYm = x.dataset.calm; render(); }));
    $$('[data-repf]').forEach((x) => (x.onclick = () => { UI.repF = x.dataset.repf; render(); }));
    $$('[data-rps]').forEach((x) => (x.onclick = () => { UI.repSeg = x.dataset.rps; render(); }));
    $$('[data-dgo]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); dashGo(x.dataset.dgo); }));
    $$('[data-lsn]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); lessonSheet(x.dataset.lsn); }));
    $$('[data-lsnset]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); lessonSetSheet(); }));
    $$('[data-qa]').forEach((x) => (x.onclick = () => (x.dataset.qa === 'hw' ? hwAddSheet() : dashPick(x.dataset.qa))));
    // 선생님 화면 어디서든: 그 학생을 홈에 펴고 바로 아래에서 써요
    const dOpen = (n, id) => { UI.dStu = n; UI.tab = 'treport'; UI.repSeg = 'write'; UI.drep = null; if (id) { const l = dCls(rOf(n), dRowD(n)).list.find((y) => y.id === id); if (l) drFrom(n, l); } render(); scrollTo({ top: 0, behavior: RM() ? 'auto' : 'smooth' }); };
    $$('[data-dl]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); const [n, id] = x.dataset.dl.split('|'); if (!n) { UI.tab = 'treport'; return render(); } dOpen(n, id); }));
    $$('[data-ds]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); const [n, id] = x.dataset.ds.split('|'); const l = dCls(rOf(n), dRowD(n)).list.find((y) => y.id === id); if (l) { drFrom(n, l); dRepShow(n, l); } }));
    $$('[data-dst]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); dOpen(x.dataset.dst); }));
    $$('[data-dh]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); UI.hStu = x.dataset.dh; UI.tab = 'thw'; render(); scrollTo(0, 0); }));
    $$('[data-hgo]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); UI.hStu = x.dataset.hgo; UI.tab = 'thw'; render(); scrollTo(0, 0); }));  // 리포트 「숙제 내러 가기」 (10/26 안 눌리던 것)
    dashBind();
    $$('[data-hwadd]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); hwAddSheet(); }));
    $$('[data-lsnsend]').forEach((x) => (x.onclick = (e) => { e.stopPropagation(); reportSheet(x.dataset.lsnsend); }));
    $$('[data-go]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); if (b.dataset.seg) UI.scoreSeg = b.dataset.seg; go(b.dataset.go); }));
    $$('[data-goalset]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); goalSheet(); }));
    $$('[data-task]').forEach((b) => (b.onclick = () => startTask(b.dataset.task)));
    $$('#ink-set, [data-inkset]').forEach((b) => (b.onclick = inkSettings));
    $$('[data-myadd]').forEach((b) => (b.onclick = myAdd));
    bindAlive();
    $$('[data-skinset]').forEach((b) => (b.onclick = skinSheet));
    $$('[data-homeset]').forEach((b) => (b.onclick = skinSheet));
    $$('[data-miss]').forEach((b) => (b.onclick = () => { const [k, id, d, was] = b.dataset.miss.split('|'), it = myS().items.find((x) => x.id === id); if (!it) return; it.ack = { ...(it.ack || {}), [d]: 1 };
      const u = it.unit === '쪽' ? '쪽' : '문제';
      if (k === 'push') toast(myPush(it));
      else if (k === 'did') { it.log[d] = { n: +was, at: Date.now() }; toast(`${md(d)}에 ${was}${u} 한 걸로 적었어요`); }
      else toast(`남은 날에 다시 나눴어요 · 오늘은 ${myToday(it).n}${u}`);
      save('my'); render(); }));
    $$('[data-mw]').forEach((b) => (b.onclick = () => { const [id, v] = b.dataset.mw.split(':'); const it = myS().items.find((x) => x.id === id); if (it && MB_ID(it.book)) mbwGo(id, v); else mbSheet(id, v); }));
    $$('[data-news]').forEach((b) => (b.onclick = () => newsSheet(b.dataset.news)));
    $$('[data-day]').forEach((b) => (b.onclick = () => daySheet(b.dataset.day)));
    $$('[data-calm]').forEach((b) => (b.onclick = () => { UI.calM = b.dataset.calm; render(); }));
    $$('#w-sched').forEach((b) => (b.onclick = () => schedSheet()));
    $$('[data-kopen]').forEach((b) => (b.onclick = () => { const [k, r] = b.dataset.kopen.split('|'); openKept(k, r); }));
    $$('[data-nf]').forEach((b) => (b.onclick = () => { UI.newsF = b.dataset.nf; render(); }));
    $$('[data-cs]').forEach((b) => (b.onclick = () => { UI.chartSubj = b.dataset.cs; render(); }));
    const h = $('#hero'); if (h) h.onclick = (e) => { if (e.target.closest('[data-go], [data-goalset]')) return; uniSheet(); };
    if (!UI.run && UI.tab === 'me') bindMe();
    if (!UI.run && UI.tab === 'tme') bindTme();
    $$('[data-perf]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'perf', id: b.dataset.perf }; render(); window.scrollTo(0, 0); }));
    $$('[data-perfdone]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const r = b.getBoundingClientRect(); perfMark(b.dataset.perfdone, true); if (UI.run && UI.run.kind === 'perf') UI.run = null; boom(r.left + r.width / 2, r.top + r.height / 2, 3); ding(3); render(); toast('수행평가 끝! 목록에서 뺐어요'); }));
    $$('[data-perfundo]').forEach((b) => (b.onclick = () => { perfMark(b.dataset.perfundo, false); render(); toast('목록에 다시 넣었어요'); }));
    if (!UI.run && UI.tab === 'picks') bindPicks();
    if (!UI.run && UI.tab === 'uni') bindUniTab();
    if (!UI.run && UI.tab === 'tgrade') $$('[data-gsw]').forEach((x) => (x.onclick = () => { UI.gStu = x.dataset.gsw; render(); }));
    $$('[data-seg]').forEach((b) => { if (!b.dataset.go) b.onclick = () => { UI.scoreSeg = b.dataset.seg; UI.mockId = null; render(); }; });
    $$('[data-mock]').forEach((b) => (b.onclick = () => { UI.mockId = b.dataset.mock; render(); window.scrollTo(0, 0); }));
    $$('[data-mdel]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); S.mockManual = (S.mockManual || []).filter((x) => x.id !== b.dataset.mdel); save('mockManual'); render(); }));
    const ma = $('#mk-add'); if (ma) ma.onclick = () => quickGradeSheet('__new');
    $$('#qg-open').forEach((b) => (b.onclick = () => quickGradeSheet()));
    $$('[data-ws]').forEach((b) => (b.onclick = () => { UI.wrongSubj = b.dataset.ws; render(); }));
    $$('[data-wr]').forEach((b) => (b.onclick = () => { const q = todayWr(), i = q.indexOf(b.dataset.wr); UI.run = { kind: 'retry', id: b.dataset.wr, queue: i >= 0 ? q.slice(i + 1) : [], back: 'wrong' }; /* 오늘 풀 오답에서 누르면 다음 문제로 저절로 넘어가요 */ render(); window.scrollTo(0, 0); }));
    const wt = $('#wr-today'); if (wt) wt.onclick = () => { const q = todayWr(); if (q.length) { UI.run = { kind: 'retry', id: q[0], queue: q.slice(1), back: 'wrong' }; render(); window.scrollTo(0, 0); } };
    const wa = $('#wr-all'); if (wa) wa.onclick = () => { const ids = openWrong().filter((w) => UI.wrongSubj === 'all' || w.subj === UI.wrongSubj).map((w) => w.id); if (ids.length) { UI.run = { kind: 'retry', id: ids[0], queue: ids.slice(1) }; render(); window.scrollTo(0, 0); } };
    const ha = $('#hw-add'); if (ha) ha.onclick = hwAddSheet;
    const po = $('#plan-open'); if (po) po.onclick = planSheet;
    $$('[data-hwopen]').forEach((b) => (b.onclick = () => { const h = (S.hw || []).find((x) => x.id === b.dataset.hwopen); if (h && ((h.go && hwGoStart(h)) || !TEACHER && ( (mmOf(h) && mmHwStart(h)) || (cuOf(h.title) && cuHwStart(h))))) return; hwSheet(b.dataset.hwopen); }));
    $$('[data-hwdone]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const x = S.hw.find((h) => h.id === b.dataset.hwdone); x.done = !x.done; x.doneAt = Date.now(); save('hw'); render(); if (x.done) toast('잘했어요'); }));
    $$('[data-hwdel]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); S.hw = S.hw.filter((h) => h.id !== b.dataset.hwdel); save('hw'); render(); }));
    $$('[data-sa]').forEach((b) => (b.onclick = () => { UI.sgbArea = b.dataset.sa; render(); }));
    const sn = $('#sg-new'); if (sn) sn.onclick = () => sgbSheet(null);
    $$('#sg-pick, #sg-pick2').forEach((b) => (b.onclick = () => pickSheet(UI.sgbArea)));
    $$('[data-sg]').forEach((b) => (b.onclick = () => sgbSheet(b.dataset.sg)));
    if (UI.run) { if (UI.run.kind === 'sci') bindSci(); if (UI.run.kind === 'unit') bindUnit(); if (UI.run.kind === 'gram') bindGram(); if (UI.run.kind === 'jl') bindJl(); if (UI.run.kind === 'jr') bindJr(); if (UI.run.kind === 'jw') bindJw(); if (UI.run.kind === 'words') bindWords(); if (UI.run.kind === 'retry') bindRetry(); if (UI.run.kind === 'g3') bindG3(); if (UI.run.kind === 'drill') bindDrill(); if (UI.run.kind === 'concept') bindConcept(); if (UI.run.kind === 'fin') bindFin(); if (UI.run.kind === 'perf') bindPerf(); if (UI.run.kind === 'book') bindBook(); if (UI.run.kind === 'mbw') bindMbw(); if (UI.run.kind === 'pomo') { bindPomo(); bindSound(); } }
    nxBind();
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
    $$('[data-lmm]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'g3', lib: +b.dataset.lmm, mm: true }; render(); window.scrollTo(0, 0); }));
    $$('[data-lmmq]').forEach((b) => (b.onclick = () => { UI.run = { kind: 'g3', lib: +b.dataset.lmmq, mm: true, q: UI.run.q }; render(); window.scrollTo(0, 0); }));
    $$('[data-mmg]').forEach((b) => (b.onclick = () => { UI.mmG = +b.dataset.mmg; render(); }));
    const da = $('#dr-add'); if (da) da.onclick = drillAddSheet;
    $$('[data-drdel]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); S.drills = (S.drills || []).filter((x) => x.id !== b.dataset.drdel); save('drills'); render(); }));
    if (!UI.run && UI.tab === 'home') bindQlog();
    $$('[data-stu]').forEach((b) => (b.onclick = () => switchStu(b.dataset.stu)));
    $$('[data-prep]').forEach((b) => (b.onclick = () => { if (TEACHER) parentReport(); }));
    const co = $('#career-ok'); if (co) co.onclick = () => { S.profile._careerSeen = S.profile._careerAt; save('profile'); render(); };
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
  $('#brand').onclick = () => go(DASH_ONLY ? 'dash' : 'home');  // 선생님 화면엔 「home」 탭이 없어 학생 홈이 뜨던 것
  let rsT = 0, lastW = window.innerWidth; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (Math.abs(window.innerWidth - lastW) > 80 && !$('.sheet')) { lastW = window.innerWidth; render(); } }, 250); });
  $('#me').onclick = () => go(DASH_ONLY ? 'tme' : 'me');
  if (DASH_ONLY) tLoad();
  if (PEEK) { const bar = document.createElement('div'); bar.className = 'peek-bar'; bar.innerHTML = '<span>' + esc(NMI()) + '가 보는 화면 · 눌러도 저장되지 않아요</span><button type="button">' + (STU_TAB ? '닫기' : '선생님 화면으로') + '</button>'; document.body.appendChild(bar); $('button', bar).onclick = () => { if (STU_TAB) { window.close(); return; } try { sessionStorage.removeItem('mu:peek'); } catch (e) {} location.reload(); }; }
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
  // 컨페티는 캔버스 하나에 모아 그려요. 시간 기준으로 움직이고, 다 떨어지면 꼭 지워요(폰에서 남아 쌓이지 않게)
  function boom(x, y, power = 1) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const B = boom.s || (boom.s = { P: [], cv: null, raf: 0, kill: 0 });
    if (!B.cv) { B.cv = document.createElement('canvas'); B.cv.className = 'boom'; document.body.appendChild(B.cv); }
    const dpr = Math.min(devicePixelRatio || 1, 2), W0 = innerWidth, H0 = innerHeight;
    if (B.cv.width !== W0 * dpr || B.cv.height !== H0 * dpr) { B.cv.width = W0 * dpr; B.cv.height = H0 * dpr; }
    const g = B.cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const COL = ['#3182f6', '#ffc342', '#ff6b8b', '#2ec27e', '#a77bff', '#ff8a3d'];
    const add = (cx, cy, n, sp) => { if (B.P.length > 320) return; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random()); B.P.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.5, r: 4 + Math.random() * 5, c: COL[i % COL.length], s: Math.random() < 0.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 1 }); } };
    const n = Math.min(40 + power * 15, 110);
    add(x, y, n, 9 + power);  // 팡
    setTimeout(() => add(innerWidth / 2, innerHeight * 0.35, Math.round(n * 0.8), 11 + power), 160);  // 팡!
    if (power >= 3) setTimeout(() => { add(innerWidth * 0.2, innerHeight * 0.3, 40, 10); add(innerWidth * 0.8, innerHeight * 0.3, 40, 10); }, 320);
    const end = () => { cancelAnimationFrame(B.raf); B.raf = 0; B.P = []; if (B.cv) B.cv.remove(); B.cv = null; };
    clearTimeout(B.kill); B.kill = setTimeout(end, 3200);  // 그리기가 멈춰도 3초 뒤엔 꼭 지워요
    if (B.raf) return;
    let last = performance.now();
    const tick = (t) => {
      const k = Math.min((t - last) / 16.7, 3); last = t;  // 60Hz 기준 걸음, 120Hz 폰에서도 같은 빠르기
      g.clearRect(0, 0, innerWidth, innerHeight);
      B.P = B.P.filter((p) => p.life > 0 && p.y < innerHeight + 40);
      for (const p of B.P) { p.vy += 0.32 * k; p.vx *= Math.pow(0.985, k); p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k; p.life -= 0.009 * k;
        g.globalAlpha = Math.max(p.life, 0); g.fillStyle = p.c; g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        if (p.s) g.fillRect(-p.r, -p.r / 2.5, p.r * 2, p.r / 1.25); else { g.beginPath(); g.arc(0, 0, p.r / 1.6, 0, 7); g.fill(); } g.restore(); }
      if (B.P.length) B.raf = requestAnimationFrame(tick); else { clearTimeout(B.kill); setTimeout(() => { if (!B.P.length) end(); }, 400); B.raf = 0; }
    };
    B.raf = requestAnimationFrame(tick);
  }

  // ───────── 시작 ─────────
  window.__univStarted = true;
  // 예전에 남긴 생각도 담은 것에 넣어요
  if (!TEACHER && S.notes) { S.keep = S.keep || {}; let ch = false; for (const [k, n] of Object.entries(S.notes)) if (n && n.text && !S.keep[k]) { S.keep[k] = { t: n.t, kind: n.kind, ref: n.ref, at: n.at || Date.now() }; ch = true; } if (ch) save('keep'); }
  if (WALLET && !TEACHER && !W().since) { W().since = Date.now(); walletScan(true); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
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
  // 새로 로그인한 기기는 이 기기에 기록이 비어 있어요. 서버에서 받아 온 뒤에도 목표 대학이 없을 때만 고르는 창을 띄워요
  if (STU_TAB) document.title = `${U.who} · ${BRAND}`;
  afterSwitch();
  sync(true).finally(() => { if (!S.profile.uni && !TEACHER && !PEEK && !TUTOR) setTimeout(uniSheet, 600); });
  setInterval(() => sync(true), 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(true); });
  // 선생님 보기에서 테마 확인용: ?theme=dark
})();
