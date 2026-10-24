/* 말랑대학 — 시작 코드.
   내용(모의고사·문제은행·학교 정보)은 공개 저장소에 그대로 두지 않고, 학생 비밀 코드로만 풀리게 암호화해 둡니다.
   짧은 코드(…/?0103)를 넣으면 진짜 코드로 바꿔 이 기기에 기억합니다. */
window.__boot = [];
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
      f.innerHTML = '<div class="code-box"><img src="assets/mark.svg" alt=""><h1>말랑대학</h1><p>선생님이 알려 준 코드를 넣어 주세요</p>' +
        '<input id="code-in" inputmode="numeric" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="코드">' +
        '<p id="code-err" class="code-err"></p><button class="btn primary big" type="submit">시작하기</button></div>';
      document.body.appendChild(f);
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
    let data = null;
    try {
      const fid = (await hex('univ:' + st.syncKey)).slice(0, 20);
      const r = await fetch('c/' + fid + '.bin?v=' + Date.now());
      if (!r.ok) throw new Error('content ' + r.status);
      data = JSON.parse(await gunzip(await decrypt(new Uint8Array(await r.arrayBuffer()), await hex(st.syncKey))));
      try { localStorage.setItem(CKEY, JSON.stringify(data)); } catch (e) {}
    } catch (e) {
      try { data = JSON.parse(localStorage.getItem(CKEY)); } catch (e2) {}
      if (!data) { if (String(e.message).includes('404')) { ask('저장된 코드가 맞지 않아요. 다시 넣어 주세요.'); return; } msg('인터넷 연결을 확인해 주세요'); return; }
    }
    window.UNIV = { data, sync: C, who: st.who || '정윤', key: st.syncKey, role: st.role || 'student' };
    const s = document.createElement('script'); s.src = 'app.js?v=' + (data.version || '') ; document.body.appendChild(s);
  })();
})();
