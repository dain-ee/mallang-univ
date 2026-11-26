/* 말랑대학 — 시작 코드.
   내용(모의고사·문제은행·학교 정보)은 공개 저장소에 그대로 두지 않고, 학생 비밀 코드로만 풀리게 암호화해 둡니다.
   짧은 코드(…/?0103)를 넣으면 진짜 코드로 바꿔 이 기기에 기억합니다. */
window.__boot = [];
// 새 버전이 올라오면 저절로 바꿔요: GitHub Pages 가 index.html 을 10분 동안 기억해서 배포해도 옛 화면이 남았어요 (10/27)
// 열 때와 다시 볼 때(폰에서 앱으로 돌아올 때) index.html 을 새로 받아 버전이 다르면 한 번 다시 열어요
(function () {
  const mine = ((document.querySelector('script[src*="loader.js?v="]') || {}).src || '').match(/v=(\d+)/);
  if (!mine) return;
  // 11/12 «캐시 좀 서버에서 지울 순 없나, 아이패드는 강력 새로고침도 없는데»: 주소 뒤에 시각을 붙여 받아서 10분 기억을 건너뛰어요
  //   열 때·돌아올 때는 바로 새로 열고, 켜 둔 채로 있을 때는 3분마다 보고 「새 버전」 알약만 띄워요 (하던 걸 끊지 않게)
  if (/^\?_=\d+$/.test(location.search)) history.replaceState(null, '', location.pathname);
  let busy = false;
  const pill = (go) => {
    if (document.getElementById('mu-upd')) return;
    const b = document.createElement('button'); b.id = 'mu-upd'; b.type = 'button'; b.textContent = '새 버전이 나왔어요 · 눌러서 열기';
    b.style.cssText = 'white-space:nowrap;position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top));z-index:300;padding:12px 20px;border:0;border-radius:99px;background:#191f28;color:#fff;font:600 14px/1.3 inherit;font-family:inherit;box-shadow:0 8px 24px rgba(0,27,55,.25);cursor:pointer;opacity:0;transform:translate(-50%,-16px);transition:opacity .25s,transform .45s cubic-bezier(.2,1.2,.3,1)';
    b.onclick = go; document.body.appendChild(b);
    requestAnimationFrame(() => { b.style.opacity = '1'; b.style.transform = 'translate(-50%,0)'; });
  };
  const chk = async (auto) => {
    if (busy || document.hidden) return; busy = true;
    try {
      const h = await (await fetch(location.pathname + '?t=' + Date.now(), { cache: 'no-store' })).text(), m = h.match(/loader\.js\?v=(\d+)/);
      if (m && m[1] !== mine[1]) {
        const go = () => { sessionStorage.setItem('mu:upd', m[1]); location.replace(location.pathname + '?_=' + m[1]); };
        if (auto && sessionStorage.getItem('mu:upd') !== m[1]) go(); else pill(go);
      }
    } catch (e) {}
    busy = false;
  };
  setTimeout(() => chk(true), 1500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) chk(true); });
  setInterval(() => chk(false), 180000);
})();
(function () {
  const C = window.UNIV_SYNC;
  const KEY = 'mallang-univ:v1', CKEY = 'mallang-univ:content';
  const enc = new TextEncoder();
  const hex = async (t) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(t)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const bytes = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
  async function decrypt(buf, keyHex) {
    const key = await crypto.subtle.importKey('raw', bytes(keyHex), 'AES-CTR', false, ['decrypt']);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CTR', counter: buf.slice(0, 16), length: 64 }, key, buf.slice(16)));
  }
  const gunzip = async (u8) => new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  let st = {}; try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  const q = new URLSearchParams(location.search);
  const msg = (t) => { const m = document.getElementById('boot-msg'); if (m) m.textContent = t; };

  function ask(err) {
    window.__univAsk = true;
    const sp = document.getElementById('splash'); if (sp) sp.remove();
    const m = document.getElementById('boot-msg'); if (m) m.remove();
    let f = document.getElementById('code-ask');
    if (!f) {
      f = document.createElement('form'); f.id = 'code-ask'; f.className = 'code-ask';
      f.innerHTML = '<div class="code-box"><img class="code-gh" src="assets/ghost/hello.webp" alt=""><h1>말랑대학</h1><p>선생님이 알려 준 코드를 넣어 주세요</p>' +
        '<input id="code-in" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="코드">' +
        '<p id="code-err" class="code-err"></p><button class="btn primary big" type="submit">시작하기</button></div>';
      document.body.appendChild(f);
      setTimeout(() => { const g = f.querySelector('.code-gh'); if (g) g.src = 'assets/ghost/idle.webp'; }, 2000);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const w = document.getElementById('code-in').value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!w) return;
        try {
          const r = await fetch('a/' + (await hex('alias:' + w)).slice(0, 20) + '.bin?v=' + Date.now());
          if (!r.ok) throw new Error('nf');
          const o = JSON.parse(new TextDecoder().decode(await decrypt(new Uint8Array(await r.arrayBuffer()), await hex('univ-alias:' + w))));
          let cur = {}; try { cur = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e2) {}
          if (cur.syncKey && cur.syncKey !== o.code) { cur = {}; localStorage.removeItem(CKEY); }
          cur.syncKey = o.code; cur.who = o.who; cur.role = o.role || 'student';
          localStorage.setItem(KEY, JSON.stringify(cur));
          location.replace(location.pathname);
        } catch (e2) { document.getElementById('code-err').textContent = '코드가 맞지 않아요'; }
      };
    }
    if (err) document.getElementById('code-err').textContent = err;
    setTimeout(() => { const i = document.getElementById('code-in'); if (i) i.focus(); }, 50);
  }

  (async () => {
    const quick = location.search.replace(/^\?/, '');
    if (quick && /^[A-Za-z0-9０-９]{3,12}$/.test(quick)) { ask(); document.getElementById('code-in').value = quick; document.getElementById('code-ask').requestSubmit(); return; }
    if (q.get('k')) { st = { syncKey: q.get('k'), who: q.get('s') || '정윤', role: q.get('r') || 'student' }; localStorage.setItem(KEY, JSON.stringify(st)); history.replaceState(null, '', location.pathname); }
    if (!st.syncKey) { ask(); return; }
    // 선생님 대시보드에서 학생을 누르면 새 탭(#stu=이름)으로 열려요. 그 탭만 그 학생 (sessionStorage)
    const hs = new URLSearchParams(location.hash.slice(1));
    if (hs.get('stu')) { try { sessionStorage.setItem('mu:who', hs.get('stu')); if (hs.get('do')) sessionStorage.setItem('mu:after', hs.get('do')); if (hs.get('peek')) sessionStorage.setItem('mu:peek', '1'); } catch (e) {} history.replaceState(null, '', location.pathname); }
    const tch = st.role === 'teacher' || st.role === 'admin';
    let tabWho = ''; try { tabWho = tch ? sessionStorage.getItem('mu:who') || '' : ''; } catch (e) {}
    const who = tabWho || st.who || '정윤', CK = tabWho ? CKEY + ':' + who : CKEY;
    let data = null;
    try {
      // 선생님은 고른 학생의 묶음을 받아요 (학생 바꾸기). 없으면 예전 묶음
      let r = tch ? await fetch('c/' + (await hex('univ:' + st.syncKey + ':' + who)).slice(0, 20) + '.bin?v=' + Date.now()) : null;
      if (!r || !r.ok) r = await fetch('c/' + (await hex('univ:' + st.syncKey)).slice(0, 20) + '.bin?v=' + Date.now());
      if (!r.ok) throw new Error('content ' + r.status);
      data = JSON.parse(await gunzip(await decrypt(new Uint8Array(await r.arrayBuffer()), await hex(st.syncKey))));
      // 자리가 모자라면 낡은 사본을 지워 학생 기록 자리를 남겨요 (11/1)
      try { localStorage.setItem(CK, JSON.stringify(data)); } catch (e) { try { localStorage.removeItem(CK); } catch (e2) {} }
    } catch (e) {
      try { data = JSON.parse(localStorage.getItem(CK)); } catch (e2) {}
      if (!data) { if (String(e.message).includes('404')) { ask('저장된 코드가 맞지 않아요. 다시 넣어 주세요.'); return; } msg('인터넷 연결을 확인해 주세요'); return; }
    }
    window.UNIV = { data, sync: C, who, key: st.syncKey, role: st.role || 'student', tabStu: !!tabWho };
    const s = document.createElement('script'); s.src = 'app.js?v=' + (data.version || '') ; document.body.appendChild(s);
    s.onload = () => { if (st.role === 'parent') return; const c = document.createElement('script'); c.src = 'chat.js?v=' + (data.version || ''); document.body.appendChild(c); };  // 「선생님께 말하기」 · 선생님 쪽지함
  })();
})();
