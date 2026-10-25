/* 말랑대학 「선생님께 말하기」 · 선생님 「쪽지함」
   말랑 내신(web/chat.js)과 같은 대화를 말랑대학 화면 결로 옮겼어요. 대화는 말랑 내신과 같은 naesin_msgs 에 모여요.
   학생(정윤): univ_msg_send / univ_msg_list (학생 이름 + 말랑대학 학생 코드가 맞아야만 읽고 씀)
   선생님: naesin_msg_inbox / thread / reply / read (선생님 키). 키는 선생님 코드로만 풀리는 내용 묶음(U.data.msgKey)에만 있어요.
   loader.js 가 app.js 다음에 붙여요. app.js 는 고치지 않아요. */
(function () {
  const U = window.UNIV; if (!U || !U.sync || window.__univChat) return;
  window.__univChat = true;
  const CFG = U.sync, ROLE_T = U.role === 'teacher' || U.role === 'admin';
  const PEEK = (() => { try { return sessionStorage.getItem('mu:peek') === '1'; } catch (e) { return false; } })();
  const TKEY = ROLE_T ? (U.data && U.data.msgKey) || '' : '';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // 테스트 출처(mu:offline=1)에서는 서버에 안 가요. 대화만 시험할 때는 mu:chat-test=1 을 따로 켜요
  const off = () => { try { return localStorage.getItem('mu:offline') === '1' && localStorage.getItem('mu:chat-test') !== '1'; } catch (e) { return false; } };

  async function rpc(fn, body) {
    if (off()) { const er = new Error('offline test'); throw er; }
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000);
    try {
      const r = await fetch(`${CFG.url}/rest/v1/rpc/${fn}`, { signal: ac.signal, method: 'POST', headers: { apikey: CFG.key, Authorization: `Bearer ${CFG.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const txt = await r.text();
      if (!r.ok) { let m = String(r.status); try { m = JSON.parse(txt).message || m; } catch (e) {} const er = new Error(m); er.status = r.status; throw er; }
      return txt ? JSON.parse(txt) : null;
    } finally { clearTimeout(t); }
  }

  // 사진 → 긴 쪽 1280px 이하 jpeg, 300KB 안쪽 data URL
  function shrink(file, max = 1280, limit = 300 * 1024) {
    return new Promise((ok, no) => {
      const url = URL.createObjectURL(file); const im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(url);
        const w = im.naturalWidth, h = im.naturalHeight; let sc = Math.min(1, max / Math.max(w, h));
        const cv = document.createElement('canvas'); const cx = cv.getContext('2d');
        for (let tries = 0; tries < 8; tries++) {
          cv.width = Math.max(1, Math.round(w * sc)); cv.height = Math.max(1, Math.round(h * sc));
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
          for (const q of [0.82, 0.7, 0.58, 0.46]) { const d = cv.toDataURL('image/jpeg', q); if ((d.length - 23) * 0.75 <= limit) return ok(d); }
          sc *= 0.75;
        }
        no(new Error('too big'));
      };
      im.onerror = () => { URL.revokeObjectURL(url); no(new Error('not image')); };
      im.src = url;
    });
  }

  const pad = (n) => String(n).padStart(2, '0');
  const hm = (at) => { const d = new Date(at); const h = d.getHours(); return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(d.getMinutes())}`; };
  const dayLabel = (at) => { const d = new Date(at); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일`; };
  const dayKey = (at) => { const d = new Date(at); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  const linkify = (s) => esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
  const ago = (at) => { if (!at) return ''; const d = new Date(at), n = new Date(); return d.toDateString() === n.toDateString() ? hm(at) : `${d.getMonth() + 1}/${d.getDate()}`; };

  // 말풍선 그리기. mine = 오른쪽에 둘 쪽('student' 또는 'teacher')
  function renderMsgs(box, msgs, mine, seenUpto, otherName) {
    let html = '', lastDay = '';
    msgs.forEach((m, i) => {
      const dk = dayKey(m.at); if (dk !== lastDay) { html += `<div class="nc-day"><span>${dayLabel(m.at)}</span></div>`; lastDay = dk; }
      const me = m.sender === mine, nx = msgs[i + 1], pv = msgs[i - 1];
      const tail = !nx || nx.sender !== m.sender || hm(nx.at) !== hm(m.at) || dayKey(nx.at) !== dk; // 같은 분에 이어 보낸 말은 시각을 마지막에만
      const first = !pv || pv.sender !== m.sender || dayKey(pv.at) !== dk;
      html += `<div class="nc-row ${me ? 'nc-me' : 'nc-you'}${first ? ' first' : ''}">` +
        (!me && first ? `<div class="nc-who">${esc(otherName)}</div>` : '') +
        `<div class="nc-line"><div class="nc-bub${m.img && !m.body ? ' pic' : ''}">` +
        (m.img ? `<img class="nc-img" src="${esc(m.img)}" alt="보낸 사진">` : '') +
        (m.body ? `<div class="nc-tx">${linkify(m.body)}</div>` : '') +
        `</div>${tail ? `<div class="nc-meta">${me && m.id <= seenUpto ? '<b>읽음</b>' : me && m.id > 0 && !m.pending ? '<b class="un">1</b>' : ''}${m.pending ? '보내는 중' : hm(m.at)}</div>` : ''}</div></div>`;
    });
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = html || `<div class="nc-empty">${esc(box.dataset.empty || '아직 주고받은 말이 없어요')}</div>`;
    if (atBottom || box.dataset.stick !== '0') { box.scrollTop = box.scrollHeight; box.querySelectorAll('img').forEach((im) => { if (!im.complete) im.addEventListener('load', () => { box.scrollTop = box.scrollHeight; }, { once: true }); }); }
    box.dataset.stick = '0';
  }

  function viewer(src) {
    const v = document.createElement('div'); v.className = 'nc-view';
    v.innerHTML = `<img src="${esc(src)}" alt="사진 크게 보기"><button type="button" class="nc-view-x" aria-label="닫기">✕</button>`;
    v.onclick = () => v.remove(); document.body.appendChild(v);
  }
  document.addEventListener('click', (e) => { const im = e.target.closest && e.target.closest('.nc-img'); if (im) viewer(im.src); });

  // 입력칸: Enter 보내기 · Shift+Enter 줄바꿈 · 글 길이에 맞춰 높이
  function wireInput(ta, send) {
    const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; };
    ta.addEventListener('input', fit);
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); send(); } });
    return fit;
  }

  // 사진 고르기 · 붙여넣기 · 미리보기 · 보내기 단추를 한 번에 엮어요
  function composer(root, onSend, onErr) {
    const ta = root.querySelector('textarea'), btn = root.querySelector('.nc-send'), pb = root.querySelector('.nc-pic'), fi = root.querySelector('input[type=file]');
    let pic = null;
    const can = () => { btn.disabled = !(ta.value.trim() || pic); };
    const setPic = (d) => { pic = d; pb.hidden = !d; if (d) pb.querySelector('img').src = d; can(); };
    ta.addEventListener('input', can);
    fi.onchange = async () => { const f = fi.files[0]; fi.value = ''; if (!f) return; try { setPic(await shrink(f)); ta.focus(); } catch (e) { onErr('이 사진은 보낼 수 없어요. 다른 사진을 골라 주세요.'); } };
    pb.querySelector('.nc-pic-x').onclick = () => setPic(null);
    ta.addEventListener('paste', async (e) => { const it = [...((e.clipboardData || {}).items || [])].find((v) => v.type.startsWith('image/')); if (!it) return; e.preventDefault(); try { setPic(await shrink(it.getAsFile())); } catch (er) {} });
    const go = () => { const body = ta.value.trim(), img = pic; if (!body && !img) return; ta.value = ''; fit(); setPic(null); onSend(body, img, (b, i) => { if (!ta.value) { ta.value = b; fit(); } if (i && !pic) setPic(i); can(); }); };
    const fit = wireInput(ta, go);
    root.querySelector('.nc-form').onsubmit = (e) => { e.preventDefault(); go(); };
    return { ta, focus: () => ta.focus() };
  }
  const FORM = (ph) => `<div class="nc-pic" hidden><img alt="보낼 사진"><button type="button" class="nc-pic-x">사진 빼기</button></div>
    <form class="nc-form"><label class="nc-attach" title="사진 보내기" aria-label="사진 보내기"><input type="file" accept="image/*" hidden><span aria-hidden="true"></span></label>
    <textarea rows="1" placeholder="${ph}" aria-label="${ph}"></textarea><button type="submit" class="nc-send" disabled>보내기</button></form>`;
  function flash(host, t) { const d = document.createElement('div'); d.className = 'nc-flash'; d.textContent = t; host.appendChild(d); setTimeout(() => d.remove(), 2600); }

  const SVG = (p) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='${p}'/%3E%3C/svg%3E") center/contain no-repeat`;
  const BUBBLE = SVG('M12 3C6.5 3 2 6.6 2 11c0 2.6 1.6 4.9 4 6.4L5 21l4.3-2.4c.9.2 1.8.4 2.7.4 5.5 0 10-3.6 10-8s-4.5-8-10-8z');
  const PHOTO = SVG('M4 5h3l2-2h6l2 2h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm8 3.5A4.5 4.5 0 1 0 12 17.5 4.5 4.5 0 0 0 12 8.5zm0 2A2.5 2.5 0 1 1 12 15.5 2.5 2.5 0 0 1 12 10.5z');

  const CSS = `
.nc-fab[hidden],.nc-pane[hidden],.nc-pic[hidden],.nc-badge[hidden],.nc-top [hidden]{display:none!important}
.nc-fab{position:fixed;right:16px;bottom:calc(var(--tab-h,64px) + 16px + env(safe-area-inset-bottom) + var(--nc-lift,0px));z-index:61;display:flex;align-items:center;justify-content:center;gap:8px;width:56px;height:56px;padding:0;font:inherit;font-size:15px;font-weight:700;color:#fff;background:var(--blue);border:0;border-radius:99px;box-shadow:0 4px 14px rgba(49,130,246,.35),0 2px 6px rgba(0,27,55,.12);cursor:pointer;transition:transform .15s ease,background .15s,bottom .25s cubic-bezier(.1,.76,.55,.9)}
.nc-fab:hover{background:var(--blue-d)}.nc-fab:active{transform:scale(.96)}
.nc-fab.on{background:var(--t1)}
.nc-fab-tx{display:none}
.nc-fab-ic{width:24px;height:24px;background:currentColor;-webkit-mask:${BUBBLE};mask:${BUBBLE}}
.nc-badge{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;padding:0 6px;display:grid;place-items:center;font-size:12px;font-weight:700;line-height:1;color:#fff;background:var(--red,#f04452);border:2px solid var(--bg);border-radius:99px;font-variant-numeric:tabular-nums}
.nc-fab.has-new{animation:nc-bump 2.4s ease-in-out infinite}
@keyframes nc-bump{0%,86%,100%{transform:none}90%{transform:translateY(-4px)}95%{transform:none}}
html.nc-lift{--nc-lift:56px}
html.nc-has-fab .main{padding-bottom:calc(var(--tab-h,64px) + 104px + env(safe-area-inset-bottom))}
.nc-pane{position:fixed;right:24px;bottom:96px;z-index:90;width:min(380px,calc(100vw - 32px));height:min(600px,calc(100vh - 130px));display:flex;flex-direction:column;background:var(--card);border-radius:var(--r-card,20px);box-shadow:0 12px 40px rgba(0,27,55,.18),0 2px 8px rgba(0,27,55,.06);overflow:hidden;animation:nc-in .2s cubic-bezier(.1,.76,.55,.9)}
@keyframes nc-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
.nc-head{display:flex;align-items:center;gap:10px;padding:16px 14px 14px 20px;border-bottom:1px solid var(--line)}
.nc-head .nc-ht{flex:1;min-width:0}
.nc-head b{display:block;font-size:17px;font-weight:700;color:var(--t1)}
.nc-head span{display:block;font-size:13px;color:var(--t3);margin-top:1px}
.nc-x,.nc-back{flex:none;width:36px;height:36px;display:grid;place-items:center;font:inherit;font-size:15px;color:var(--t2);background:var(--fill);border:0;border-radius:99px;cursor:pointer}
.nc-back{font-size:20px;line-height:1}
.nc-list{flex:1;overflow-y:auto;padding:12px 16px 8px;background:var(--bg);overscroll-behavior:contain}
.nc-empty{margin:48px 16px;text-align:center;font-size:14px;line-height:1.6;color:var(--t3)}
.nc-day{display:flex;justify-content:center;margin:12px 0 8px}
.nc-day span{padding:3px 12px;font-size:12px;font-weight:600;color:var(--t3);background:var(--card);border-radius:99px}
.nc-row{display:flex;flex-direction:column;margin-top:3px}.nc-row.first{margin-top:12px}
.nc-row.nc-me{align-items:flex-end}.nc-row.nc-you{align-items:flex-start}
.nc-who{font-size:12px;font-weight:600;color:var(--t2);margin:0 0 4px 2px}
.nc-line{display:flex;align-items:flex-end;gap:6px;max-width:82%}
.nc-row.nc-me .nc-line{flex-direction:row-reverse}
.nc-bub{padding:9px 14px;font-size:15px;line-height:1.5;color:var(--t1);background:var(--card);border-radius:18px;word-break:keep-all;overflow-wrap:anywhere;min-width:0}
.nc-row.nc-you.first .nc-bub{border-top-left-radius:6px}
.nc-row.nc-me .nc-bub{color:#fff;background:var(--blue)}
.nc-row.nc-me.first .nc-bub{border-top-right-radius:6px}
.nc-row.nc-me .nc-bub a{color:#fff}
.nc-bub.pic{padding:0;background:transparent!important}
.nc-img{display:block;max-width:100%;max-height:260px;border-radius:14px;cursor:zoom-in;object-fit:cover}
.nc-img+.nc-tx{margin-top:7px}
.nc-meta{flex:none;display:flex;flex-direction:column;align-items:flex-end;font-size:11px;line-height:1.3;color:var(--t3);white-space:nowrap;padding-bottom:2px}
.nc-row.nc-you .nc-meta{align-items:flex-start}
.nc-meta b{font-weight:600;font-size:11px;color:var(--t3)}.nc-meta b.un{color:var(--blue)}
.nc-pic{display:flex;align-items:center;gap:10px;padding:8px 14px;border-top:1px solid var(--line);background:var(--card)}
.nc-pic img{width:56px;height:56px;object-fit:cover;border-radius:10px}
.nc-pic-x{font:inherit;font-size:13px;font-weight:600;color:var(--t2);background:var(--fill);border:0;border-radius:99px;padding:6px 12px;cursor:pointer}
.nc-form{display:flex;align-items:flex-end;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:var(--card)}
.nc-attach{flex:none;width:40px;height:40px;display:grid;place-items:center;color:var(--t3);background:var(--fill);border-radius:99px;cursor:pointer}
.nc-attach span{width:20px;height:20px;background:currentColor;-webkit-mask:${PHOTO};mask:${PHOTO}}
.nc-form textarea{flex:1;min-width:0;resize:none;height:40px;max-height:120px;padding:9px 14px;font:inherit;font-size:15px;line-height:1.45;color:var(--t1);background:var(--fill);border:0;border-radius:var(--r-btn,14px);outline:2px solid transparent}
.nc-form textarea:focus{outline-color:var(--blue);background:var(--card)}
.nc-send{flex:none;height:40px;padding:0 16px;font:inherit;font-size:15px;font-weight:600;color:#fff;background:var(--blue);border:0;border-radius:var(--r-sm,10px);cursor:pointer}
.nc-send:disabled{opacity:.35;cursor:default}
.nc-flash{position:absolute;left:50%;bottom:76px;transform:translateX(-50%);max-width:88%;padding:10px 16px;font-size:13px;font-weight:600;color:#fff;background:#191f28;border-radius:99px;text-align:center}
.nc-view{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.82);cursor:zoom-out}
.nc-view img{max-width:100%;max-height:100%;border-radius:12px}
.nc-view-x{position:absolute;top:calc(16px + env(safe-area-inset-top));right:16px;width:40px;height:40px;font-size:18px;color:#fff;background:rgba(255,255,255,.16);border:0;border-radius:99px;cursor:pointer}
/* 선생님 쪽지함 */
.nc-top{flex:none;position:relative;margin-left:auto;margin-right:-8px;display:flex;align-items:center;gap:6px;height:40px;padding:0 12px 0 10px;font:inherit;font-size:14px;font-weight:700;color:var(--t2);background:var(--card);border:0;border-radius:99px;cursor:pointer}
.nc-top img{width:22px;height:22px}
.nc-top .cnt{min-width:18px;padding:0 5px;font-size:11px;font-weight:700;line-height:18px;color:#fff;background:var(--red,#f04452);border-radius:9px;text-align:center;font-variant-numeric:tabular-nums}
.nc-top + .bell-top{margin-left:0}
.nc-box{width:min(760px,calc(100vw - 48px));height:min(640px,calc(100vh - 120px));right:32px;top:84px;bottom:auto}
.nc-box .nc-body{flex:1;min-height:0;display:grid;grid-template-columns:260px 1fr}
.nc-stus{overflow-y:auto;padding:8px;border-right:1px solid var(--line)}
.nc-stu{width:100%;display:flex;align-items:center;gap:12px;padding:12px 10px;font:inherit;text-align:left;color:var(--t1);background:none;border:0;border-radius:14px;cursor:pointer}
.nc-stu:hover{background:var(--fill2)}.nc-stu.on{background:var(--blue-soft)}
.nc-av{flex:none;width:42px;height:42px;display:grid;place-items:center;font-size:16px;font-weight:700;color:var(--blue);background:var(--blue-soft);border-radius:14px}
.nc-stu.on .nc-av{color:#fff;background:var(--blue)}
.nc-sm{flex:1;min-width:0}
.nc-sn{display:flex;justify-content:space-between;gap:8px;font-size:15px;font-weight:700}
.nc-sn small{font-size:12px;font-weight:500;color:var(--t3);white-space:nowrap}
.nc-sl{margin-top:2px;font-size:13px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nc-un{flex:none;min-width:22px;height:22px;padding:0 6px;display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff;background:var(--red,#f04452);border-radius:99px;font-variant-numeric:tabular-nums}
.nc-th{display:flex;flex-direction:column;min-width:0;min-height:0}
.nc-th .nc-sub{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line)}
.nc-th .nc-sub b{font-size:16px;font-weight:700}.nc-th .nc-sub span{font-size:13px;color:var(--t3)}
.nc-th .nc-sub .nc-back{display:none}
.nc-th .nc-line{max-width:74%}
.nc-none{margin:auto;text-align:center;color:var(--t3);font-size:14px;line-height:1.7;padding:24px}
.nc-tools{display:flex;gap:6px;align-items:center;padding:10px 16px;border-top:1px solid var(--line);font-size:12px;color:var(--t3)}
.nc-tools .nc-chip{font:inherit;font-size:12.5px;font-weight:600;color:var(--t2);background:var(--fill);border:0;border-radius:99px;padding:6px 11px;cursor:pointer}
.nc-tools .nc-chip.on{color:var(--blue);background:var(--blue-soft)}
.nc-tools .nc-st{margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (min-width:900px){
  html.nc-has-fab .main{padding-bottom:104px}
  .nc-fab{right:24px;bottom:calc(24px + var(--nc-lift,0px));width:auto;padding:0 20px 0 16px}
  .nc-fab-tx{display:inline}
  .nc-badge{top:-6px;right:-4px}
  .nc-top{background:var(--fill)}
}
@media (max-width:899px){
  .nc-pane{inset:0;width:auto;height:auto;border-radius:0;z-index:120}
  .nc-pane .nc-head{padding-top:calc(14px + env(safe-area-inset-top))}
  html.nc-open body{overflow:hidden}
  .nc-top{padding:0 10px}.nc-top .nc-tl{display:none}
  .nc-box .nc-body{grid-template-columns:1fr}
  .nc-box.thread .nc-stus{display:none}
  .nc-box:not(.thread) .nc-th{display:none}
  .nc-box .nc-stus{border-right:0}
  .nc-th .nc-sub .nc-back{display:grid}
  .nc-th .nc-line{max-width:84%}
}
`;
  if (!document.getElementById('nc-css')) { const st = document.createElement('style'); st.id = 'nc-css'; st.textContent = CSS; document.head.appendChild(st); }
  const root = document.documentElement;

  // ───────── 학생(정윤): 떠 있는 단추 + 대화창 ─────────
  function student() {
    const who = U.who, code = U.key;
    let msgs = [], lastId = 0, unread = 0, seenUpto = 0, open = false, timer = null, busy = false;
    const fab = document.createElement('button'); fab.type = 'button'; fab.className = 'nc-fab'; fab.hidden = true; fab.setAttribute('aria-label', '선생님께 말하기');
    fab.innerHTML = '<span class="nc-fab-ic" aria-hidden="true"></span><span class="nc-fab-tx">선생님께 말하기</span><span class="nc-badge" hidden></span>';
    const pane = document.createElement('section'); pane.className = 'nc-pane'; pane.hidden = true; pane.setAttribute('aria-label', '선생님께 말하기');
    pane.innerHTML = `<header class="nc-head"><div class="nc-ht"><b>선생님께 말하기</b><span>궁금한 거, 숙제 사진, 뭐든 보내 주세요</span></div><button type="button" class="nc-x" aria-label="닫기">✕</button></header>
      <div class="nc-list" data-empty="선생님께 하고 싶은 말을 아래에 써 보세요. 사진도 보낼 수 있어요."></div>${FORM('메시지를 입력해요')}`;
    document.body.append(fab, pane);
    const list = pane.querySelector('.nc-list');
    const draw = () => renderMsgs(list, msgs, 'student', seenUpto, '선생님');
    const cmp = composer(pane, send, (t) => flash(pane, t));

    // 토마토 타이머 알약이 떠 있으면 그 위로 올라가요
    const lift = () => root.classList.toggle('nc-lift', !!document.getElementById('pomo-pill'));
    new MutationObserver(lift).observe(document.body, { childList: true }); lift();

    function badge() {
      const b = fab.querySelector('.nc-badge');
      b.hidden = !unread || open; b.textContent = unread > 9 ? '9+' : String(unread);
      fab.classList.toggle('has-new', !!unread && !open);
      fab.setAttribute('aria-label', unread && !open ? `선생님께 말하기, 새 답장 ${unread}개` : '선생님께 말하기');
    }
    async function poll(first) {
      if (busy) return; busy = true;
      try {
        const r = await rpc('univ_msg_list', { p_student: who, p_code: code, p_after: lastId, p_seen: open && !document.hidden });
        fab.hidden = false; root.classList.add('nc-has-fab');
        const fresh = (r.msgs || []).filter((m) => !msgs.some((x) => x.id === m.id));
        const changed = fresh.length || r.seen_upto !== seenUpto;
        if (fresh.length) { msgs = msgs.filter((x) => !x.pending).concat(fresh).sort((a, b) => a.id - b.id); lastId = Math.max(lastId, ...fresh.map((m) => m.id)); }
        seenUpto = r.seen_upto || 0; unread = open && !document.hidden ? 0 : r.unread || 0; badge();
        if (open && (changed || first)) draw();
      } catch (e) { if (e.status && /denied/.test(e.message)) { fab.hidden = true; root.classList.remove('nc-has-fab'); } }
      busy = false;
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(async () => { await poll(); schedule(); }, open ? 5000 : 30000); }
    function setOpen(v) {
      open = v; pane.hidden = !v; fab.classList.toggle('on', v); root.classList.toggle('nc-open', v);
      if (v) { list.dataset.stick = '1'; draw(); poll(true); if (matchMedia('(min-width:900px)').matches) setTimeout(cmp.focus, 30); }
      badge(); schedule();
    }
    fab.onclick = () => setOpen(!open);
    pane.querySelector('.nc-x').onclick = () => setOpen(false);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open && !document.querySelector('.nc-view')) setOpen(false); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { poll(); schedule(); } });

    async function send(body, img, restore) {
      const tmp = { id: 1e15 + Date.now(), sender: 'student', body, img, at: new Date().toISOString(), pending: true };
      msgs.push(tmp); list.dataset.stick = '1'; draw();
      try {
        const m = await rpc('univ_msg_send', { p_student: who, p_code: code, p_body: body, p_img: img });
        msgs = msgs.filter((x) => x !== tmp); if (!msgs.some((x) => x.id === m.id)) msgs.push(m); msgs.sort((a, b) => a.id - b.id);
      } catch (er) {
        msgs = msgs.filter((x) => x !== tmp); restore(body, img);
        flash(pane, /slow/.test(er.message) ? '너무 빨리 보내고 있어요. 잠깐 뒤에 다시 보내 주세요.' : '인터넷이 끊겨서 못 보냈어요. 다시 보내 주세요.');
      }
      list.dataset.stick = '1'; draw();
    }
    poll(true).then(schedule);
  }

  // ───────── 선생님: 위 메뉴 「쪽지함」 + 학생별 대화 ─────────
  function teacher() {
    const KN = 'mu:chat-known';
    let inbox = [], cur = null, msgs = [], lastId = 0, seenUpto = 0, busy = false, open = false, known = null, cmp = null;
    const total = () => inbox.reduce((n, x) => n + (x.unread || 0), 0);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nc-top'; btn.id = 'nc-top'; btn.setAttribute('aria-label', '쪽지함');
    btn.innerHTML = '<img src="icons/1f4ac.svg" alt=""><span class="nc-tl">쪽지함</span><span class="cnt" hidden></span>';
    const topIn = document.querySelector('.top-in'), bell = document.getElementById('bell-top');
    if (bell && bell.parentNode === topIn) topIn.insertBefore(btn, bell); else if (topIn) topIn.insertBefore(btn, document.getElementById('me')); else return;
    const box = document.createElement('section'); box.className = 'nc-pane nc-box'; box.hidden = true; box.setAttribute('aria-label', '쪽지함');
    box.innerHTML = `<header class="nc-head"><div class="nc-ht"><b>쪽지함</b><span>학생이 「선생님께 말하기」로 보낸 말이에요</span></div><button type="button" class="nc-x" aria-label="닫기">✕</button></header>
      <div class="nc-body"><div class="nc-stus"></div><div class="nc-th"><div class="nc-none">왼쪽에서 학생을 골라 주세요</div></div></div>
      <div class="nc-tools"><button type="button" class="nc-chip" data-noti>알림 켜기</button><span class="nc-st"></span></div>`;
    document.body.appendChild(box);
    const $b = (s) => box.querySelector(s), stus = $b('.nc-stus'), th = $b('.nc-th'), st = $b('.nc-st');

    // 탭 제목 앞에 안 읽은 수. 앱(토마토 타이머)이 제목을 바꿔도 1초마다 다시 붙여요
    setInterval(() => { const n = total(), base = document.title.replace(/^\(\d+\+?\) /, ''), want = (n ? `(${n > 99 ? '99+' : n}) ` : '') + base; if (document.title !== want) document.title = want; }, 1000);
    function paintBtn() { const n = total(), c = btn.querySelector('.cnt'); c.hidden = !n; c.textContent = n > 99 ? '99+' : String(n); btn.setAttribute('aria-label', n ? `쪽지함, 안 읽은 ${n}개` : '쪽지함'); }

    function drawSide() {
      stus.innerHTML = inbox.length ? inbox.map((x) => `<button type="button" class="nc-stu ${cur === x.student ? 'on' : ''}" data-s="${esc(x.student)}">
        <span class="nc-av">${esc(x.student.slice(0, 1))}</span><span class="nc-sm"><span class="nc-sn">${esc(x.student)}<small>${ago(x.last_at)}</small></span>
        <span class="nc-sl">${x.last_body ? (x.last_sender === 'teacher' ? '나: ' : '') + esc(x.last_body) : '아직 대화가 없어요'}</span></span>${x.unread ? `<span class="nc-un">${x.unread > 99 ? '99+' : x.unread}</span>` : ''}</button>`).join('') : '<div class="nc-none">아직 학생이 없어요</div>';
      stus.querySelectorAll('.nc-stu').forEach((b) => (b.onclick = () => openStu(b.dataset.s)));
      paintBtn();
    }
    function notify(fresh) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      fresh.forEach((x) => { try { const n = new Notification(`${x.student}: 새 메시지`, { body: x.last_body || '', tag: 'univ-msg-' + x.student, icon: 'assets/favicon.svg' }); n.onclick = () => { window.focus(); setOpen(true); openStu(x.student); n.close(); }; } catch (e) {} });
    }
    async function pollInbox() {
      try {
        const r = await rpc('naesin_msg_inbox', { p_key: TKEY });
        if (!known) { try { known = JSON.parse(localStorage.getItem(KN)) || null; } catch (e) {} }
        const prev = known; known = {}; r.forEach((x) => (known[x.student] = x.max_id || 0)); try { localStorage.setItem(KN, JSON.stringify(known)); } catch (e) {}
        if (prev) notify(r.filter((x) => x.last_sender === 'student' && (x.max_id || 0) > (prev[x.student] || 0) && !(open && x.student === cur && !document.hidden)));
        inbox = r; if (open && cur && !document.hidden) { const me = inbox.find((x) => x.student === cur); if (me) me.unread = 0; }
        drawSide(); st.textContent = '10초마다 새 메시지를 확인해요 · ' + hm(new Date());
      } catch (e) { st.textContent = e.status ? '쪽지함을 열 수 없어요. 선생님 코드로 다시 들어와 주세요' : '연결이 끊겼어요. 다시 시도하는 중이에요'; }
    }
    async function pollThread(first) {
      if (!open || !cur || busy) return; busy = true; const s = cur;
      try {
        const r = await rpc('naesin_msg_thread', { p_key: TKEY, p_student: s, p_after: lastId });
        if (s !== cur) return;
        const fresh = (r.msgs || []).filter((m) => !msgs.some((x) => x.id === m.id));
        const ch = fresh.length || r.seen_upto !== seenUpto;
        if (fresh.length) { msgs = msgs.filter((x) => !x.pending).concat(fresh).sort((a, b) => a.id - b.id); lastId = Math.max(lastId, ...fresh.map((m) => m.id)); }
        seenUpto = r.seen_upto || 0;
        if (!document.hidden && msgs.some((m) => m.sender === 'student' && !m.read)) { await rpc('naesin_msg_read', { p_key: TKEY, p_student: s }); msgs.forEach((m) => { if (m.sender === 'student') m.read = m.read || true; }); }
        const lb = th.querySelector('.nc-list'); if (lb && (ch || first)) renderMsgs(lb, msgs, 'teacher', seenUpto, s);
      } catch (e) {} finally { busy = false; }
    }
    function openStu(s) {
      cur = s; msgs = []; lastId = 0; seenUpto = 0; box.classList.add('thread');
      const x = inbox.find((y) => y.student === s); if (x) x.unread = 0; drawSide();
      th.innerHTML = `<div class="nc-sub"><button type="button" class="nc-back" aria-label="목록으로">‹</button><div><b>${esc(s)}</b> <span>학생</span></div></div>
        <div class="nc-list" data-empty="${esc(s)}에게 먼저 말을 걸어 보세요" data-stick="1"><div class="nc-empty">불러오는 중이에요</div></div>${FORM('답장을 입력해요')}`;
      th.querySelector('.nc-back').onclick = () => { box.classList.remove('thread'); cur = null; drawSide(); };
      cmp = composer(th, async (body, img, restore) => {
        const lb = th.querySelector('.nc-list'), tmp = { id: 1e15 + Date.now(), sender: 'teacher', body, img, at: new Date().toISOString(), pending: true };
        msgs.push(tmp); lb.dataset.stick = '1'; renderMsgs(lb, msgs, 'teacher', seenUpto, s);
        try { const m = await rpc('naesin_msg_reply', { p_key: TKEY, p_student: s, p_body: body, p_img: img }); msgs = msgs.filter((y) => y !== tmp); if (!msgs.some((y) => y.id === m.id)) msgs.push(m); msgs.sort((a, b) => a.id - b.id); }
        catch (e) { msgs = msgs.filter((y) => y !== tmp); restore(body, img); flash(box, '못 보냈어요. 인터넷을 확인하고 다시 보내 주세요.'); }
        if (cur === s) { lb.dataset.stick = '1'; renderMsgs(lb, msgs, 'teacher', seenUpto, s); } pollInbox();
      }, (t) => flash(box, t));
      pollThread(true); if (matchMedia('(min-width:900px)').matches) setTimeout(cmp.focus, 30);
    }
    function setOpen(v) {
      open = v; box.hidden = !v; root.classList.toggle('nc-open', v);
      if (v) { pollInbox(); if (cur) pollThread(true); }
    }
    btn.onclick = () => setOpen(!open);
    $b('.nc-x').onclick = () => setOpen(false);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open && !document.querySelector('.nc-view')) setOpen(false); });

    const nb = $b('[data-noti]');
    function notiState() {
      if (!('Notification' in window)) { nb.hidden = true; return; }
      const p = Notification.permission; nb.textContent = p === 'granted' ? '알림 켜짐' : p === 'denied' ? '알림 막힘 (브라우저 설정)' : '알림 켜기'; nb.classList.toggle('on', p === 'granted');
    }
    nb.onclick = async () => { if (Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) {} } notiState(); };
    notiState();

    // 앱이 열려 있는 동안 10초마다 확인 (쪽지함을 닫아 둬도 숫자와 알림은 와요)
    pollInbox();
    setInterval(() => { pollInbox(); pollThread(); }, 10000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { pollInbox(); if (open && cur) pollThread(true); } });
  }

  if (ROLE_T) { if (!PEEK && TKEY) teacher(); }
  else if (U.role === 'student' && U.who && U.key) student();
})();
