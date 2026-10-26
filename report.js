'use strict';

/* ────────────────────────────────────────────────
   과외 일일 리포트 — 캔버스 렌더러 (웹앱·CLI 공용)

   설계 전제: 학부모는 이 이미지를 휴대폰 메신저 말풍선 안에서 봅니다.
   그래서 여백을 줄이고 글자를 키웠으며, 학부모가 가장 먼저 찾는 숫자
   (회차 · 진도율 · 시험 · 단어)를 상단 타일로 분리했습니다.
   ──────────────────────────────────────────────── */

(function (root) {

const W = 720;          // 논리 너비(px). 실제 출력은 SCALE 배
const M = 36;           // 바깥 여백
const CW = W - M * 2;   // 콘텐츠 너비
const SCALE = 2;

const C = {
  ink: '#191627',
  mid: '#4a4560',
  sub: '#7d7793',
  line: '#eae7f4',
  tile: '#f7f5fd',
  accent: '#7a5af5',
  accentSoft: '#f0ecfe',
  track: '#e9e3fc',
  white: '#ffffff',
  ghostInk: '#141220',
};

/* 유령 마크 — assets/ghost.svg 와 같은 도형입니다.
   1회차(새 사이클) 리포트에만 붙습니다. */
const GHOST_BODY = 'M -288 -50 C -288 -300, -152 -404, 0 -404 C 152 -404, 288 -300, 288 -50 ' +
  'L 288 205 C 288 338, 96 338, 96 212 C 96 348, -96 348, -96 212 C -96 352, -288 358, -288 205 Z';
const RAD = Math.PI / 180;
let ghostPath = null;

function drawGhost(c, cx, cy, h, body, eye) {
  if (!ghostPath) ghostPath = new Path2D(GHOST_BODY);
  const s = h / 800;

  c.save();
  c.translate(cx, cy);
  c.rotate(38 * RAD);
  c.scale(s, s);

  c.fillStyle = body;
  c.fill(ghostPath);

  c.translate(26, -212);
  c.rotate(-38 * RAD);
  c.fillStyle = eye;
  for (const dx of [-76, 76]) {
    c.beginPath();
    c.ellipse(dx, 0, 47, 60, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

const SANS = '"Apple SD Gothic Neo", "Pretendard", system-ui, sans-serif';
const font = (w, s) => `${w} ${s}px ${SANS}`;

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const DEFAULT_NOTE = '금일 테스트 점수와 진도를 확인해주세요 :)';

/* 섹션 라벨 — 학부모가 읽는 말로.

   말랑 단어·말랑 1001 은 글이 아니라 점수로 들어옵니다 — 위쪽 '단어' · '시험'
   타일입니다. vocab 은 예전에 「단어 학습」 을 글로 적던 리포트를 위해 남겨
   둔 자리입니다. 지금 폼에는 그 칸이 없고, 옛 기록을 다시 그릴 때만 씁니다. */
const SECTION_LABELS = {
  lesson: '오늘 수업', vocab: '단어 학습', homework: '숙제', comment: '선생님 한마디',
};

const ITEM_SIZE = 17;
const ITEM_LH = 31;
const SEC_GAP = 26;      // 섹션 사이 간격
const SEC_HEAD = 30;     // 라벨이 차지하는 높이

const measurer = document.createElement('canvas').getContext('2d');

/* ── 유틸 ───────────────────────────────────── */

function wrapText(c, text, maxW) {
  const lines = [];
  let line = '';
  for (const ch of text) {
    if (line && c.measureText(line + ch).width > maxW) {
      const sp = line.lastIndexOf(' ');
      if (sp > 0) {
        lines.push(line.slice(0, sp));
        line = line.slice(sp + 1) + ch;
      } else {
        lines.push(line);
        line = ch;
      }
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* ── 입력 정규화 ────────────────────────────── */

function toItems(v) {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : String(v).split('\n');
  return arr.map((s) => String(s).trim().replace(/^[-•*]\s*/, '')).filter(Boolean);
}

const str = (v) => (v == null ? '' : String(v).trim());

function normalize(raw) {
  const date = str(raw.date) ? new Date(str(raw.date) + 'T00:00:00') : new Date();
  const nth = str(raw.nth);
  const total = str(raw.total);
  const score = str(raw.score);
  const scoreTotal = str(raw.scoreTotal);
  const vocabScore = str(raw.vocabScore);
  const vocabTotal = str(raw.vocabTotal);
  const progress = str(raw.progress);

  const pair = (got, of) => (got ? (of ? `${got} / ${of}` : got) : '—');

  return {
    name: str(raw.name) || '학생',
    date,
    dateText: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY[date.getDay()]})`,
    nth,
    nthTitle: nth ? `${nth}회차` : '',
    isNewCycle: nth === '1',
    nthValue: nth ? (total ? `${nth} / ${total}` : nth) : '—',
    book: str(raw.book),
    progress,
    progressValue: progress ? `${progress}%` : '—',
    progressRatio: progress ? Math.max(0, Math.min(100, Number(progress))) / 100 : null,
    scoreValue: pair(score, scoreTotal),
    /* 단어 시험은 본 날에만 칸이 생깁니다 — 안 봤으면 타일 자체가 안 나옵니다. */
    vocabValue: vocabScore ? pair(vocabScore, vocabTotal) : '',
    note: str(raw.note) || DEFAULT_NOTE,
    sections: [
      { label: SECTION_LABELS.lesson, items: toItems(raw.lesson) },
      { label: SECTION_LABELS.vocab, items: toItems(raw.vocab) },
      { label: SECTION_LABELS.homework, items: toItems(raw.homework) },
      { label: SECTION_LABELS.comment, items: toItems(raw.comment) },
    ].filter((s) => s.items.length),
  };
}

/* ── 레이아웃 계산 ──────────────────────────── */

function layoutSections(sections) {
  const maxW = CW - 24;
  measurer.font = font(500, ITEM_SIZE);
  return sections.map((s) => {
    const wrapped = s.items.map((t) => wrapText(measurer, t, maxW));
    const lineCount = wrapped.reduce((n, ls) => n + ls.length, 0);
    return { ...s, wrapped, height: SEC_HEAD + lineCount * ITEM_LH };
  });
}

/* ── 그리기 조각 ────────────────────────────── */

function drawHeader(c, d, y) {
  c.textBaseline = 'alphabetic';

  /* 브랜드 마크는 검정. 연보라 유령은 1회차에만 나옵니다. */
  drawGhost(c, M + 10, y + 15, 25, C.ghostInk, C.white);
  c.fillStyle = C.mid;
  c.font = font(700, 13);
  c.fillText('영어 과외 일일 리포트', M + 28, y + 21);

  c.fillStyle = C.ink;
  c.font = font(700, 34);
  const name = d.name;
  c.fillText(name, M, y + 66);

  if (d.nthTitle) {
    const nameW = c.measureText(name).width;
    const nthX = M + nameW + 14;
    c.fillStyle = C.accent;
    c.font = font(700, 20);
    c.fillText(d.nthTitle, nthX, y + 66);

    /* 새 사이클의 첫 수업에만 유령이 따라붙습니다. */
    if (d.isNewCycle) {
      const nthW = c.measureText(d.nthTitle).width;
      drawGhost(c, nthX + nthW + 22, y + 56, 30, C.accent, C.white);
    }
  }

  c.fillStyle = C.sub;
  c.font = font(500, 15);
  c.fillText(d.dateText, M, y + 94);

  return 112;
}

/* 상단 타일 — 학부모가 가장 먼저 찾는 숫자들.
   단어 시험을 본 날은 네 칸, 안 본 날은 예전처럼 세 칸입니다.
   점수 칸(시험 · 단어)은 연보라로 묶어 한눈에 짝으로 읽히게 합니다. */
function drawTiles(c, d, y) {
  const H = 84;
  const gap = 12;
  const tiles = [
    ['회차', d.nthValue, false],
    ['진도율', d.progressValue, false],
    ['시험', d.scoreValue, true],
  ];
  if (d.vocabValue) tiles.push(['단어', d.vocabValue, true]);

  const w = (CW - gap * (tiles.length - 1)) / tiles.length;

  tiles.forEach(([label, value, isScore], i) => {
    const x = M + (w + gap) * i;

    c.fillStyle = isScore ? C.accentSoft : C.tile;
    roundRect(c, x, y, w, H, 14);
    c.fill();

    c.textAlign = 'center';
    c.fillStyle = C.sub;
    c.font = font(600, 13);
    c.textBaseline = 'alphabetic';
    c.fillText(label, x + w / 2, y + 30);

    c.fillStyle = value === '—' ? C.sub : (isScore ? C.accent : C.ink);
    /* 칸이 좁아질수록 글자도 줄입니다 — "17 / 20" 이 벽에 닿으면 안 됩니다. */
    const big = tiles.length > 3 ? 23 : 26;
    c.font = font(700, value.length > 6 ? big - 4 : big);
    c.fillText(value, x + w / 2, y + 64);
    c.textAlign = 'left';
  });

  return H;
}

function drawProgress(c, d, y) {
  const H = 54;
  c.fillStyle = C.mid;
  c.font = font(600, 15);
  c.textBaseline = 'alphabetic';
  c.fillText(d.book || '교재', M, y + 18);

  if (d.progressRatio != null) {
    c.textAlign = 'right';
    c.fillStyle = C.accent;
    c.font = font(700, 15);
    c.fillText(d.progressValue, M + CW, y + 18);
    c.textAlign = 'left';
  }

  const barY = y + 32;
  c.fillStyle = C.track;
  roundRect(c, M, barY, CW, 10, 5);
  c.fill();

  if (d.progressRatio) {
    const g = c.createLinearGradient(M, 0, M + CW, 0);
    g.addColorStop(0, '#6d79e0');
    g.addColorStop(1, C.accent);
    c.fillStyle = g;
    roundRect(c, M, barY, Math.max(10, CW * d.progressRatio), 10, 5);
    c.fill();
  }

  return H;
}

function drawSection(c, s, y) {
  /* 라벨 앞의 짧은 강조 선 */
  c.fillStyle = C.accent;
  roundRect(c, M, y + 3, 3, 15, 1.5);
  c.fill();

  c.fillStyle = C.ink;
  c.font = font(700, 16);
  c.textBaseline = 'alphabetic';
  c.fillText(s.label, M + 13, y + 16);

  let ty = y + SEC_HEAD + ITEM_LH / 2;
  c.font = font(500, ITEM_SIZE);
  for (const lines of s.wrapped) {
    lines.forEach((ln, li) => {
      /* 불릿은 라벨 앞 강조선과 같은 열에 둡니다 */
      if (li === 0) {
        c.fillStyle = C.accent;
        c.beginPath();
        c.arc(M + 1.5, ty, 2.6, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = C.ink;
      c.textBaseline = 'middle';
      c.fillText(ln, M + 13, ty);
      ty += ITEM_LH;
    });
  }
  c.textBaseline = 'alphabetic';
  return s.height;
}

function drawNote(c, d, y) {
  const H = 50;
  c.fillStyle = C.tile;
  roundRect(c, M, y, CW, H, 12);
  c.fill();

  c.fillStyle = C.sub;
  c.font = font(500, 14);
  c.textBaseline = 'middle';
  c.fillText(d.note, M + 18, y + H / 2);
  c.textBaseline = 'alphabetic';
  return H;
}

/* ── 렌더링 ─────────────────────────────────── */

function drawReport(canvas, raw) {
  const d = normalize(raw);
  const c = canvas.getContext('2d');
  const secs = layoutSections(d.sections);

  const showProgress = Boolean(d.book || d.progress);

  /* 높이 계산 */
  let H = M + 112 + 20 + 84;                     /* 여백 + 헤더 + 간격 + 타일 */
  if (showProgress) H += 22 + 54;
  H += 28;                                        /* 구분선 위아래 */
  H += secs.reduce((n, s) => n + s.height, 0) + Math.max(0, secs.length - 1) * SEC_GAP;
  H += 26 + 50 + M;                               /* 안내 문구 + 아래 여백 */
  if (!secs.length) H += 40;

  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  canvas.style.width = W + 'px';
  c.setTransform(SCALE, 0, 0, SCALE, 0, 0);

  c.fillStyle = C.white;
  c.fillRect(0, 0, W, H);

  let y = M;
  y += drawHeader(c, d, y) + 20;
  y += drawTiles(c, d, y);
  if (showProgress) { y += 22; y += drawProgress(c, d, y); }

  /* 구분선 */
  y += 6;
  c.strokeStyle = C.line;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(M, y + 0.5);
  c.lineTo(M + CW, y + 0.5);
  c.stroke();
  y += 22;

  secs.forEach((s, i) => {
    y += drawSection(c, s, y);
    if (i < secs.length - 1) y += SEC_GAP;
  });

  y += 26;
  drawNote(c, d, y);

  return d;
}

root.Report = { drawReport, normalize, W, SCALE };

})(typeof window !== 'undefined' ? window : globalThis);
