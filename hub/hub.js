(() => {
"use strict";

const CFG = {
  url: "https://yksoewfdcykladmsoaqt.supabase.co",
  key: "sb_publishable_AZENTNz_R3CB8KAvAmXaMQ_NIOTknjN",
  teamEmail: "team@ventus-hub.example",
};
const DEMO = new URLSearchParams(location.search).has("demo");
const NOTICE = "기록은 개선에만 쓰고 평가에 쓰지 않습니다.";

// 한국 공휴일 (영업일 계산용)
const HOLIDAYS = new Set([
  "2026-12-25",
  "2027-01-01", "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09",
  "2027-03-01", "2027-05-05", "2027-05-13", "2027-06-06", "2027-08-16",
  "2027-09-14", "2027-09-15", "2027-09-16", "2027-10-04", "2027-10-11", "2027-12-27",
]);
const CYCLES = ["매일", "매주", "매월", "수시"];
const MANUAL = ["없음", "작성중", "있음"];
const LEAVE_KINDS = ["연차", "반차", "출장"];
const DIFF_LABEL = { 1: "쉬움", 2: "보통", 3: "어려움" };
const CLASS_ORDER = ["1순위 자동화", "매뉴얼 + 부분 자동화", "대체자 교육", "체크리스트", "기록 없음"];
const CLASS_KEY = { "1순위 자동화": "c1", "매뉴얼 + 부분 자동화": "c2", "대체자 교육": "c3", "체크리스트": "c4", "기록 없음": "c0" };

// ───────── 날짜 ─────────
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const today = () => ymd(new Date());
const DOW = "일월화수목금토";
const dow = (s) => DOW[parse(s).getDay()];
const isBiz = (s) => { const w = parse(s).getDay(); return w > 0 && w < 6 && !HOLIDAYS.has(s); };
const weekStart = (s) => addDays(s, -((parse(s).getDay() + 6) % 7));
const fmtDay = (s) => { const d = parse(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dow(s)})`; };
const fmtShort = (s) => { const d = parse(s); return `${d.getMonth() + 1}/${d.getDate()}`; };
const monthOf = (s) => s.slice(0, 7);
const addMonth = (m, n) => { const [y, mo] = m.split("-").map(Number); const d = new Date(y, mo - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const fmtMonth = (m) => { const [y, mo] = m.split("-"); return `${y}년 ${Number(mo)}월`; };
function bizDaysOfMonth(m) {
  const out = []; const t = today();
  let s = `${m}-01`;
  while (monthOf(s) === m && s <= t) { if (isBiz(s)) out.push(s); s = addDays(s, 1); }
  return out;
}
const fmtMin = (n) => { n = Math.round(n || 0); if (n < 60) return `${n}분`; const h = Math.floor(n / 60), r = n % 60; return r ? `${h}시간 ${r}분` : `${h}시간`; };

// ───────── 유틸 ─────────
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sum = (arr, k) => arr.reduce((a, r) => a + (Number(r[k]) || 0), 0);
const $ = (sel, root = document) => root.querySelector(sel);
let toastTimer;
function toast(msg, bad) {
  const el = $("#toast");
  el.textContent = msg; el.className = "toast" + (bad ? " bad" : ""); el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 2600);
}
function fail(e) { console.error(e); toast("저장하지 못했어요: " + (e?.message || e), true); }

// ───────── 기본 데이터 (체험 모드용) ─────────
const SEED_MEMBERS = [
  { id: 1, name: "박지수", role: "staff", color: "#2f7d6d", sort: 1, active: true },
  { id: 2, name: "원휘빈", role: "staff", color: "#3c64b1", sort: 2, active: true },
  { id: 3, name: "이세연", role: "staff", color: "#b5577a", sort: 3, active: true },
  { id: 4, name: "Liz", role: "admin", color: "#8a6a2f", sort: 4, active: true },
];
const SEED_TASKS = [
  [1, "박지수", "총무", "총무 일반(비품·문서·우편)", "매일", 30, ""],
  [2, "박지수", "공무", "금속창호 입찰 공고 확인", "수시", 30, "나라장터"],
  [3, "박지수", "공무", "정보통신공사 입찰 공고 확인", "수시", 30, "나라장터"],
  [4, "박지수", "공무", "공무(현장 서류·기성)", "수시", 60, ""],
  [5, "박지수", "인사", "분체도장 직원 관리", "매일", 30, ""],
  [6, "박지수", "인사", "외국인 근로자 관리", "매월", 60, "하이코리아"],
  [7, "박지수", "인사", "근태관리(출퇴근·연차 집계)", "매일", 20, "엑셀"],
  [8, "박지수", "총무", "식수 주문", "매일", 10, ""],
  [9, "박지수", "안전", "위험성평가", "수시", 60, ""],
  [10, "박지수", "안전", "보건관리감독자 업무", "매월", 60, ""],
  [11, "원휘빈", "분체도장", "입고 관리(분체도장)", "매일", 30, ""],
  [12, "원휘빈", "분체도장", "출고 관리(분체도장)", "매일", 30, ""],
  [13, "원휘빈", "분체도장", "거래처 관리(분체도장)", "매일", 20, ""],
  [14, "원휘빈", "회계", "입금결의서 작성", "매일", 15, "엑셀"],
  [15, "원휘빈", "회계", "매출 세금계산서 발행(분체도장)", "매주", 40, "홈택스"],
  [16, "원휘빈", "회계", "출하 운임 정산", "매주", 30, "엑셀"],
  [17, "원휘빈", "구매", "도료 주문", "매주", 30, ""],
  [18, "원휘빈", "구매", "소모자재 주문", "수시", 20, ""],
  [19, "원휘빈", "보고", "일별 매출 보고", "매일", 25, "엑셀"],
  [20, "원휘빈", "보고", "월별 마감보고", "매월", 120, "엑셀"],
  [21, "이세연", "유통", "수주·발주 처리", "매일", 30, "발주자동화"],
  [22, "이세연", "유통", "마케팅(콘텐츠·광고)", "매주", 60, "쿠팡 광고센터"],
  [23, "이세연", "유통", "CS 응대", "매일", 30, "쿠팡 윙·네이버"],
  [24, "이세연", "유통", "플랫폼 관리(쿠팡·네이버 등 6개)", "매일", 30, "쿠팡 윙·네이버"],
  [25, "이세연", "유통", "B2B 업체 관리", "매주", 30, ""],
  [26, "이세연", "유통", "건강기능식품 신상품 런칭", "수시", 60, ""],
  [27, "이세연", "보고", "일일 매입/매출 보고", "매일", 25, "엑셀"],
  [28, "이세연", "회계", "매출 세금계산서·계산서 발행(유통)", "매주", 30, "홈택스"],
  [29, "이세연", "회계", "지출결의서 작성(유통)", "매월", 60, "엑셀"],
  [30, "박지수", "총무", "정기 백업·백업기록", "매월", 60, "외장 SSD"],
].map(([id, owner, field, name, cycle, est_min, tool]) => ({
  id, owner, field, name, cycle, est_min, tool, backup_person: "", manual_status: "없음", manual_link: "", folder: "", active: true,
}));
const SEED_SETTINGS = [
  { id: 1, key: "freq_high", value: 20 }, { id: 2, key: "freq_mid", value: 5 },
  { id: 3, key: "int_high", value: 600 }, { id: 4, key: "int_mid", value: 120 },
  { id: 5, key: "diff_high", value: 2 },
];
const TABLES = ["hub_members", "hub_tasks", "hub_logs", "hub_leaves", "hub_settings", "hub_weekly", "hub_requests"];

// ───────── 저장소 ─────────
function demoBackend() {
  const KEY = "ventus-hub-demo";
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (_) {}
  if (!db) {
    db = { hub_members: SEED_MEMBERS, hub_tasks: SEED_TASKS, hub_settings: SEED_SETTINGS, hub_logs: [], hub_leaves: [], hub_weekly: [], hub_requests: [] };
    let id = 1; const t = today();
    for (let i = 1; i <= 8; i++) {
      const d = addDays(t, -i);
      if (!isBiz(d)) continue;
      SEED_TASKS.filter((x) => x.cycle === "매일" && x.id % 3 !== i % 3).forEach((x) => {
        db.hub_logs.push({ id: id++, log_date: d, member: x.owner, task_id: x.id, count: 1 + (x.id % 3), minutes: x.est_min * (1 + (x.id % 3)), difficulty: 1 + (x.id % 3), blocker: x.id === 23 && i === 2 ? "반품 문의가 몰려 답변이 밀림" : "", idea: x.id === 19 && i === 3 ? "입금결의서에서 자동으로 합계 뽑으면 좋겠음" : "", is_cover: false, created_at: new Date(parse(d).getTime() + 17 * 3600e3).toISOString() });
      });
    }
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (_) {} };
  const nextId = (t) => db[t].reduce((m, r) => Math.max(m, r.id), 0) + 1;
  return {
    async signedIn() { return sessionStorage.getItem("hub-demo-auth") === "1" || localStorage.getItem("hub-demo-auth") === "1"; },
    async signIn(pw) { if (!pw) throw new Error("비밀번호를 입력해 주세요"); localStorage.setItem("hub-demo-auth", "1"); },
    async signOut() { localStorage.removeItem("hub-demo-auth"); },
    async list(t) { return JSON.parse(JSON.stringify(db[t])); },
    async insert(t, row) { const r = { ...row, id: nextId(t), created_at: new Date().toISOString() }; db[t].push(r); save(); return { ...r }; },
    async update(t, id, patch) { const r = db[t].find((x) => x.id === id); Object.assign(r, patch, { updated_at: new Date().toISOString() }); save(); return { ...r }; },
    async remove(t, id) { db[t] = db[t].filter((x) => x.id !== id); save(); },
    async kakao() { throw new Error("체험 모드에서는 카톡 연결을 할 수 없어요"); },
    subscribe() {},
  };
}
function supabaseBackend() {
  const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, storageKey: "ventus-hub-auth", autoRefreshToken: true } });
  const chk = ({ data, error }) => { if (error) throw error; return data; };
  return {
    async signedIn() { const { data } = await sb.auth.getSession(); return Boolean(data.session); },
    async signIn(pw) {
      const { error } = await sb.auth.signInWithPassword({ email: CFG.teamEmail, password: pw });
      if (error) throw new Error(/invalid/i.test(error.message) ? "비밀번호가 맞지 않아요" : error.message);
    },
    async signOut() { await sb.auth.signOut(); },
    async list(t) {
      let out = [], from = 0;
      for (;;) {
        const rows = chk(await sb.from(t).select("*").order("id").range(from, from + 999));
        out = out.concat(rows);
        if (rows.length < 1000) return out;
        from += 1000;
      }
    },
    async insert(t, row) { return chk(await sb.from(t).insert(row).select().single()); },
    async update(t, id, patch) { return chk(await sb.from(t).update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().single()); },
    async remove(t, id) { chk(await sb.from(t).delete().eq("id", id)); },
    async kakao(action, body = {}) {
      const { data, error } = await sb.functions.invoke("hub-kakao", { body: { action, ...body } });
      if (error) {
        let msg = error.message;
        try { msg = (await error.context.json()).error || msg; } catch (_) {}
        throw new Error(msg);
      }
      return data;
    },
    subscribe(onChange) {
      sb.channel("hub-changes")
        .on("postgres_changes", { event: "*", schema: "public" }, (p) => { if (p.table && p.table.startsWith("hub_")) onChange(p.table); })
        .subscribe();
    },
  };
}
const DB = DEMO ? demoBackend() : supabaseBackend();

// ───────── 상태 ─────────
const S = {
  me: localStorage.getItem("hub-me") || "",
  view: "",
  date: today(),
  month: monthOf(today()),
  taskFilter: "",
  feedFilter: "",
  feedDays: 3,
  hub_members: [], hub_tasks: [], hub_logs: [], hub_leaves: [], hub_settings: [], hub_weekly: [], hub_requests: [],
};
const members = () => S.hub_members.filter((m) => m.active).sort((a, b) => a.sort - b.sort);
const staff = () => members().filter((m) => m.role === "staff");
const member = (name) => S.hub_members.find((m) => m.name === name);
const meObj = () => member(S.me);
const isAdmin = () => meObj()?.role === "admin";
const task = (id) => S.hub_tasks.find((t) => t.id === id);
const activeTasks = () => S.hub_tasks.filter((t) => t.active);
const myTasks = (name = S.me) => activeTasks().filter((t) => t.owner === name);
const setting = (k) => Number(S.hub_settings.find((s) => s.key === k)?.value ?? 0);
const leaveOf = (name, date) => S.hub_leaves.find((l) => l.member === name && l.leave_date === date);
const logsOf = (name, date) => S.hub_logs.filter((l) => l.member === name && l.log_date === date);
const colorOf = (name) => member(name)?.color || "#667";

async function loadAll() {
  const res = await Promise.all(TABLES.map((t) => DB.list(t)));
  TABLES.forEach((t, i) => (S[t] = res[i]));
}
const reloadQueue = new Set(); let reloadTimer;
function scheduleReload(t) {
  reloadQueue.add(t); clearTimeout(reloadTimer);
  reloadTimer = setTimeout(async () => {
    const ts = [...reloadQueue]; reloadQueue.clear();
    try { const res = await Promise.all(ts.map((x) => DB.list(x))); ts.forEach((x, i) => (S[x] = res[i])); renderView(); } catch (e) { console.error(e); }
  }, 250);
}
function upsertLocal(t, row) {
  const i = S[t].findIndex((x) => x.id === row.id);
  if (i >= 0) S[t][i] = row; else S[t].push(row);
}
async function save(t, id, row) {
  const r = id ? await DB.update(t, id, row) : await DB.insert(t, row);
  upsertLocal(t, r); return r;
}
async function del(t, id) { await DB.remove(t, id); S[t] = S[t].filter((x) => x.id !== id); }

// ───────── 분석 ─────────
function analyze(month) {
  const fh = setting("freq_high"), fm = setting("freq_mid"), ih = setting("int_high"), im = setting("int_mid"), dh = setting("diff_high");
  const logs = S.hub_logs.filter((l) => l.log_date.startsWith(month));
  const rows = activeTasks().map((t) => {
    const ls = logs.filter((l) => l.task_id === t.id);
    const cnt = sum(ls, "count"), min = sum(ls, "minutes");
    const diff = ls.length ? sum(ls, "difficulty") / ls.length : null;
    const fs = cnt >= fh ? 3 : cnt >= fm ? 2 : 1;
    const is = min >= ih ? 3 : min >= im ? 2 : 1;
    const score = ls.length ? fs + is + (3 - diff) : null;
    const often = fs >= 2, hard = diff != null && diff >= dh;
    const cls = !ls.length ? "기록 없음" : often && !hard ? "1순위 자동화" : often && hard ? "매뉴얼 + 부분 자동화" : hard ? "대체자 교육" : "체크리스트";
    const spof = !t.backup_person && t.manual_status !== "있음" && hard;
    return { t, cnt, min, diff, fs, is, score, cls, spof, n: ls.length };
  });
  rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.min - a.min || a.t.id - b.t.id);
  const biz = bizDaysOfMonth(month);
  const people = staff().map((m) => {
    const ls = logs.filter((l) => l.member === m.name);
    const leaveDays = biz.filter((d) => leaveOf(m.name, d));
    const logDays = new Set(ls.map((l) => l.log_date).filter((d) => biz.includes(d) && !leaveOf(m.name, d)));
    const denom = biz.length - leaveDays.length;
    const own = rows.filter((r) => r.t.owner === m.name);
    return {
      m, ls,
      tasks: myTasks(m.name).length,
      logged: new Set(ls.map((l) => l.task_id)).size,
      cnt: sum(ls, "count"), min: sum(ls, "minutes"),
      diff: ls.length ? sum(ls, "difficulty") / ls.length : null,
      ratio: denom > 0 ? logDays.size / denom : null,
      noManual: own.filter((r) => r.t.manual_status !== "있음").length,
      auto1: own.filter((r) => r.cls === "1순위 자동화").length,
      edu: own.filter((r) => r.cls === "대체자 교육").length,
      spof: own.filter((r) => r.spof).length,
    };
  });
  const avgMin = people.length ? sum(people, "min") / people.length : 0;
  people.forEach((p) => (p.heavy = avgMin > 0 && p.min > avgMin * 1.5));
  return { rows, people, biz, logs };
}

// ───────── 화면 틀 ─────────
const NAV = [
  { id: "today", icon: "✏️", label: "오늘 기록" },
  { id: "tasks", icon: "📋", label: "업무목록" },
  { id: "board", icon: "👥", label: "팀 현황판" },
  { id: "analysis", icon: "📊", label: "월간분석" },
];
function go(view) {
  S.view = view;
  if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
  renderShell();
}
function renderShell() {
  const me = meObj();
  $("#app").innerHTML = `
  <div class="shell">
    <aside class="side">
      <div class="brand"><img src="icons/icon-192.png" alt=""><div><b>벤투스 업무 허브</b><small>${DEMO ? "체험 모드" : "실시간 공유"}</small></div></div>
      <nav class="side-nav">${NAV.map((n) => `<button class="nav-item ${S.view === n.id ? "on" : ""}" data-act="go" data-v="${n.id}"><span>${n.icon}</span>${n.label}</button>`).join("")}</nav>
      <div class="side-foot">
        <button class="install-btn" data-act="install" hidden>📲 앱으로 설치</button>
        <button class="me-chip" data-act="who"><i style="background:${esc(me.color)}"></i>${esc(me.name)}<small>${me.role === "admin" ? "관리자" : "직원"} · 바꾸기</small></button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <b>${NAV.find((n) => n.id === S.view)?.label || ""}</b>
        <div class="topbar-r">
          <button class="install-btn sm" data-act="install" hidden>📲 설치</button>
          <button class="me-chip sm" data-act="who"><i style="background:${esc(me.color)}"></i>${esc(me.name)}</button>
        </div>
      </header>
      <div id="view" class="view"></div>
    </main>
    <nav class="tabbar">${NAV.map((n) => `<button class="${S.view === n.id ? "on" : ""}" data-act="go" data-v="${n.id}"><span>${n.icon}</span>${n.label}</button>`).join("")}</nav>
  </div>`;
  updateInstallButtons();
  renderView();
}
function renderView() {
  const el = $("#view"); if (!el) return;
  const y = window.scrollY;
  el.innerHTML = ({ today: viewToday, tasks: viewTasks, board: viewBoard, analysis: viewAnalysis }[S.view] || viewToday)();
  window.scrollTo(0, y);
}

// ───────── 로그인 ─────────
function renderLogin(err) {
  $("#app").innerHTML = `
  <div class="gate">
    <img src="icons/icon-192.png" alt="" class="gate-logo">
    <h1>벤투스 업무 허브</h1>
    <p class="muted">팀 비밀번호를 넣어 주세요. 이 기기에서는 한 번만 넣으면 돼요.</p>
    <form data-form="login" class="gate-form">
      <input type="password" name="pw" placeholder="팀 비밀번호" autocomplete="current-password" required autofocus>
      <button class="btn primary big">들어가기</button>
    </form>
    ${err ? `<p class="err">${esc(err)}</p>` : ""}
    ${DEMO ? `<p class="muted sm">체험 모드: 아무 비밀번호나 넣으면 들어가요.</p>` : ""}
  </div>`;
}
function renderWho() {
  $("#app").innerHTML = `
  <div class="gate">
    <img src="icons/icon-192.png" alt="" class="gate-logo">
    <h1>누구세요?</h1>
    <p class="muted">이 기기를 쓰는 사람을 골라 주세요.</p>
    <div class="who-grid">${members().map((m) => `<button class="who-btn" data-act="pick-me" data-name="${esc(m.name)}"><i style="background:${esc(m.color)}"></i>${esc(m.name)}<small>${m.role === "admin" ? "관리자" : "직원"}</small></button>`).join("")}</div>
    <p class="notice">${NOTICE}</p>
    ${S.me ? `<button class="btn ghost" data-act="cancel-who">취소</button>` : ""}
    <button class="btn link" data-act="logout">이 기기에서 로그아웃</button>
  </div>`;
}

// ───────── 오늘 기록 ─────────
function taskBtn(t, cover) {
  const lg = S.hub_logs.find((l) => l.member === S.me && l.log_date === S.date && l.task_id === t.id);
  return `<button class="task-btn ${lg ? "done" : ""}" data-act="log" data-task="${t.id}" ${cover ? 'data-cover="1"' : ""}>
    <span class="tb-name">${esc(t.name)}${cover ? ' <em class="tag">대처</em>' : ""}</span>
    <span class="tb-meta">${lg ? `✓ ${lg.count}건 · ${fmtMin(lg.minutes)}` : `약 ${t.est_min}분`}</span>
  </button>`;
}
function kakaoBanner() {
  if (DEMO || meObj()?.kakao_at || setting("kakao_ready") !== 1) return "";
  return `<div class="banner kakao"><span>📩 ${isAdmin() ? "매일 17:50 팀 기록 현황을 카톡으로 받아 보세요." : "평일 17:50에 기록이 없으면 카톡으로 알려 드려요."}</span><button class="btn kakao-btn" data-act="kakao-connect">카톡 알림 받기</button></div>`;
}
function kakaoLine() {
  if (DEMO || !meObj()?.kakao_at) return "";
  return `<p class="kakao-line">🔔 카톡 알림 연결됨 · <button class="btn link" data-act="kakao-test">시험 발송</button> · <button class="btn link" data-act="kakao-off">끄기</button></p>`;
}
function viewToday() {
  const me = meObj();
  const t0 = today();
  const minDate = isAdmin() ? "2000-01-01" : addDays(t0, -7);
  const logs = logsOf(S.me, S.date);
  const leave = leaveOf(S.me, S.date);
  const mine = myTasks();
  const groups = [["매일", mine.filter((t) => t.cycle === "매일")], ["매주·매월", mine.filter((t) => t.cycle === "매주" || t.cycle === "매월")], ["수시", mine.filter((t) => t.cycle === "수시" || !CYCLES.includes(t.cycle))]];
  const nav = `
    <div class="datebar">
      <button class="icon-btn" data-act="date" data-d="-1" ${S.date <= minDate ? "disabled" : ""}>‹</button>
      <div class="datebar-mid"><b>${fmtDay(S.date)}</b>${S.date === t0 ? `<small>오늘</small>` : `<button class="chip" data-act="date-today">오늘로</button>`}</div>
      <button class="icon-btn" data-act="date" data-d="1" ${S.date >= t0 ? "disabled" : ""}>›</button>
    </div>`;
  if (!mine.length && me.role === "admin") {
    return `${nav}<div class="card empty">관리자는 업무 기록을 하지 않아요.<br>직원 기록은 <button class="btn link" data-act="go" data-v="board">팀 현황판</button>에서 볼 수 있어요.</div>`;
  }
  return `
  ${nav}
  <div class="summary card">
    <div><small>${S.date === t0 ? "오늘" : "이날"} 기록</small><b>${logs.length}건 · ${fmtMin(sum(logs, "minutes"))}</b></div>
    <div class="summary-act">
      <button class="btn" data-act="like-yesterday">↺ 어제처럼</button>
      <button class="btn ${leave ? "warn" : ""}" data-act="leave">${leave ? `🌴 ${esc(leave.kind)}` : "🌴 연차"}</button>
    </div>
  </div>
  ${kakaoBanner()}
  ${leave ? `<div class="banner">이날은 <b>${esc(leave.kind)}</b>로 표시됐어요. 미기록으로 세지 않아요. <button class="btn link" data-act="leave">바꾸기</button></div>` : ""}
  <p class="hint">업무를 누르면 건수·시간이 미리 채워져요. 다를 때만 고치고 저장하세요.</p>
  ${groups.filter(([, ts]) => ts.length).map(([label, ts]) => `
    <section class="task-sec"><h3>${label}</h3><div class="task-grid">${ts.map((t) => taskBtn(t)).join("")}</div></section>`).join("")}
  ${(() => {
    const covers = logs.filter((l) => l.is_cover);
    return covers.length ? `<section class="task-sec"><h3>대신 한 업무</h3><div class="task-grid">${covers.map((l) => task(l.task_id)).filter(Boolean).map((t) => taskBtn(t, true)).join("")}</div></section>` : "";
  })()}
  <div class="row-btns">
    <button class="btn dashed" data-act="new-task">＋ 목록에 없는 업무</button>
    <button class="btn dashed" data-act="cover">🤝 다른 사람 업무 대신 했어요</button>
  </div>
  <section class="card">
    <h3 class="card-h">${S.date === t0 ? "오늘" : fmtShort(S.date)} 기록한 것</h3>
    ${logs.length ? `<ul class="log-list">${logs.sort((a, b) => a.id - b.id).map((l) => logRow(l, true)).join("")}</ul>` : `<p class="muted">아직 없어요. 위의 업무 버튼을 눌러 주세요.</p>`}
  </section>
  ${kakaoLine()}
  <p class="notice">${NOTICE}</p>`;
}
function logRow(l, editable, showWho) {
  const t = task(l.task_id);
  return `<li class="log-row" ${editable ? `data-act="log" data-task="${l.task_id}" ${l.is_cover ? 'data-cover="1"' : ""} data-date="${l.log_date}"` : ""}>
    ${showWho ? `<span class="who-dot" style="background:${esc(colorOf(l.member))}"></span><b class="lr-who">${esc(l.member)}</b>` : ""}
    <span class="lr-name">${esc(t?.name || "(삭제된 업무)")}${l.is_cover ? ` <em class="tag">대처${t ? " · " + esc(t.owner) : ""}</em>` : ""}</span>
    <span class="lr-meta">${l.count}건 · ${fmtMin(l.minutes)} · ${DIFF_LABEL[l.difficulty] || "-"}</span>
    ${l.blocker ? `<span class="lr-note">⚠️ ${esc(l.blocker)}</span>` : ""}
    ${l.idea ? `<span class="lr-note idea">💡 ${esc(l.idea)}</span>` : ""}
  </li>`;
}

// ───────── 시트(입력창) ─────────
function openSheet(html) {
  const el = $("#sheet");
  el.innerHTML = `<div class="sheet-bg" data-act="close"></div><div class="sheet" role="dialog">${html}</div>`;
  el.hidden = false;
  document.body.classList.add("sheet-open");
  const f = el.querySelector("[autofocus]"); if (f && matchMedia("(min-width: 900px)").matches) f.focus();
}
function closeSheet() { const el = $("#sheet"); el.hidden = true; el.innerHTML = ""; document.body.classList.remove("sheet-open"); }

function sheetLog(taskId, cover, date = S.date) {
  const t = task(taskId); if (!t) return;
  const lg = S.hub_logs.find((l) => l.member === S.me && l.log_date === date && l.task_id === taskId);
  const count = lg?.count ?? 1, minutes = lg?.minutes ?? t.est_min, diff = lg?.difficulty ?? 0;
  const isCover = lg ? lg.is_cover : Boolean(cover);
  openSheet(`
  <form data-form="log" data-task="${t.id}" data-id="${lg?.id || ""}" data-date="${date}" data-cover="${isCover ? 1 : ""}" data-est="${t.est_min}" data-touched="${lg ? 1 : ""}">
    <div class="sheet-h"><div><b>${esc(t.name)}</b><small>${esc(t.field || "")} · ${esc(t.cycle)} · ${fmtDay(date)}${isCover ? ` · ${esc(t.owner)} 님 업무 대처` : ""}</small></div><button type="button" class="icon-btn" data-act="close">✕</button></div>
    <label class="fl">건수</label>
    <div class="stepper"><button type="button" data-act="step" data-f="count" data-n="-1">−</button><input name="count" type="number" inputmode="numeric" min="1" value="${count}"><button type="button" data-act="step" data-f="count" data-n="1">＋</button></div>
    <label class="fl">소요시간 (분)</label>
    <div class="stepper"><button type="button" data-act="step" data-f="minutes" data-n="-10">−10</button><input name="minutes" type="number" inputmode="numeric" min="0" value="${minutes}"><button type="button" data-act="step" data-f="minutes" data-n="10">＋10</button></div>
    <label class="fl">난이도</label>
    <div class="seg" data-seg="difficulty">${[1, 2, 3].map((d) => `<button type="button" class="${diff === d ? "on" : ""}" data-act="seg" data-v="${d}">${d} ${DIFF_LABEL[d]}</button>`).join("")}</div>
    <input type="hidden" name="difficulty" value="${diff || ""}">
    <details class="more" ${lg?.blocker || lg?.idea ? "open" : ""}>
      <summary>메모 남기기 (선택)</summary>
      <label class="fl">막힌 점</label>
      <input name="blocker" maxlength="200" placeholder="예: 거래처 사업자번호 확인이 오래 걸림" value="${esc(lg?.blocker || "")}">
      <label class="fl">자동화 아이디어</label>
      <input name="idea" maxlength="200" placeholder="예: 출고 기록에서 자동으로 합계를 뽑으면 좋겠음" value="${esc(lg?.idea || "")}">
    </details>
    <div class="sheet-foot">
      ${lg ? `<button type="button" class="btn danger" data-act="del-log" data-id="${lg.id}">삭제</button>` : ""}
      <button class="btn primary big grow">저장</button>
    </div>
  </form>`);
}
async function submitLog(f) {
  const fd = new FormData(f);
  const difficulty = Number(fd.get("difficulty"));
  if (!difficulty) return toast("난이도를 골라 주세요", true);
  const row = {
    log_date: f.dataset.date, member: S.me, task_id: Number(f.dataset.task),
    count: Math.max(1, Number(fd.get("count")) || 1), minutes: Math.max(0, Number(fd.get("minutes")) || 0), difficulty,
    blocker: String(fd.get("blocker") || "").trim(), idea: String(fd.get("idea") || "").trim(), is_cover: Boolean(f.dataset.cover),
  };
  try { await save("hub_logs", Number(f.dataset.id) || null, row); closeSheet(); renderView(); toast("저장했어요"); } catch (e) { fail(e); }
}

async function likeYesterday() {
  const mine = S.hub_logs.filter((l) => l.member === S.me && l.log_date < S.date && !l.is_cover);
  if (!mine.length) return toast("불러올 이전 기록이 없어요", true);
  const prev = mine.reduce((m, l) => (l.log_date > m ? l.log_date : m), "");
  const done = new Set(logsOf(S.me, S.date).map((l) => l.task_id));
  const src = mine.filter((l) => l.log_date === prev && task(l.task_id)?.cycle === "매일" && task(l.task_id)?.active && !done.has(l.task_id));
  if (!src.length) return toast("이미 다 불러왔어요");
  try {
    for (const l of src) await save("hub_logs", null, { log_date: S.date, member: S.me, task_id: l.task_id, count: l.count, minutes: l.minutes, difficulty: l.difficulty, blocker: "", idea: "", is_cover: false });
    renderView(); toast(`${fmtShort(prev)} 기록 ${src.length}건을 불러왔어요. 다르면 눌러서 고치세요.`);
  } catch (e) { fail(e); }
}
function sheetLeave() {
  const lv = leaveOf(S.me, S.date);
  openSheet(`
  <div class="sheet-h"><div><b>휴무 표시</b><small>${fmtDay(S.date)}</small></div><button type="button" class="icon-btn" data-act="close">✕</button></div>
  <p class="muted">휴무로 표시한 날은 미기록으로 세지 않아요.</p>
  <div class="big-choices">${LEAVE_KINDS.map((k) => `<button class="btn big ${lv?.kind === k ? "primary" : ""}" data-act="set-leave" data-k="${k}">${k}</button>`).join("")}</div>
  ${lv ? `<button class="btn danger wide" data-act="set-leave" data-k="">휴무 표시 지우기</button>` : ""}`);
}
async function setLeave(kind) {
  const lv = leaveOf(S.me, S.date);
  try {
    if (!kind && lv) await del("hub_leaves", lv.id);
    else if (kind) await save("hub_leaves", lv?.id || null, { leave_date: S.date, member: S.me, kind });
    closeSheet(); renderView(); toast(kind ? `${kind}로 표시했어요` : "휴무 표시를 지웠어요");
  } catch (e) { fail(e); }
}
function sheetCover() {
  const others = staff().filter((m) => m.name !== S.me);
  openSheet(`
  <div class="sheet-h"><div><b>다른 사람 업무 대신 하기</b><small>누구 업무를 대신 했나요?</small></div><button type="button" class="icon-btn" data-act="close">✕</button></div>
  ${others.map((m) => `<section class="task-sec"><h3><i class="who-dot" style="background:${esc(m.color)}"></i>${esc(m.name)}</h3><div class="task-grid">${myTasks(m.name).map((t) => taskBtn(t, true)).join("") || '<p class="muted">업무 없음</p>'}</div></section>`).join("")}`);
}

// ───────── 업무목록 ─────────
function viewTasks() {
  const owner = isAdmin() ? S.taskFilter : S.me;
  const list = S.hub_tasks.filter((t) => !owner || t.owner === owner).sort((a, b) => Number(b.active) - Number(a.active) || a.id - b.id);
  return `
  ${isAdmin() ? `<div class="filters">${["", ...staff().map((m) => m.name)].map((n) => `<button class="chip ${S.taskFilter === n ? "on" : ""}" data-act="task-filter" data-n="${esc(n)}">${n ? esc(n) : "전체"}</button>`).join("")}</div>` : ""}
  <div class="banner soft">1회 소요시간은 <b>임시값</b>이에요. 실제와 다르면 눌러서 고쳐 주세요. 대체자도 정해 두면 인수인계가 쉬워져요.</div>
  <div class="card tbl-wrap desk">
    <table class="tbl">
      <thead><tr><th>No</th>${owner ? "" : "<th>담당</th>"}<th>분야</th><th>업무명</th><th>주기</th><th class="r">1회(분)</th><th>대체자</th><th>매뉴얼</th><th>주 사용 도구</th><th>저장 폴더</th></tr></thead>
      <tbody>${list.map((t) => `<tr class="${t.active ? "" : "off"}" data-act="edit-task" data-id="${t.id}">
        <td>${t.id}</td>${owner ? "" : `<td><i class="who-dot" style="background:${esc(colorOf(t.owner))}"></i>${esc(t.owner)}</td>`}<td>${esc(t.field)}</td><td><b>${esc(t.name)}</b>${t.active ? "" : ' <em class="tag">사용 안 함</em>'}</td><td>${esc(t.cycle)}</td><td class="r">${t.est_min}</td>
        <td>${t.backup_person ? esc(t.backup_person) : '<span class="miss">없음</span>'}</td><td>${t.manual_link ? `<a href="${esc(t.manual_link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(t.manual_status)}</a>` : `<span class="${t.manual_status === "없음" ? "miss" : ""}">${esc(t.manual_status)}</span>`}</td><td>${esc(t.tool)}</td><td>${esc(t.folder)}</td></tr>`).join("")}</tbody>
    </table>
  </div>
  <ul class="task-cards mob">${list.map((t) => `<li class="card ${t.active ? "" : "off"}" data-act="edit-task" data-id="${t.id}">
    <div class="tc-top"><b>${esc(t.name)}</b><span class="chip sm">${esc(t.cycle)}</span></div>
    <div class="tc-meta">${owner ? "" : `${esc(t.owner)} · `}${esc(t.field)} · 1회 ${t.est_min}분${t.tool ? " · " + esc(t.tool) : ""}</div>
    <div class="tc-meta">대체자 ${t.backup_person ? esc(t.backup_person) : '<span class="miss">없음</span>'} · 매뉴얼 <span class="${t.manual_status === "없음" ? "miss" : ""}">${esc(t.manual_status)}</span>${t.active ? "" : ' · <em class="tag">사용 안 함</em>'}</div>
  </li>`).join("")}</ul>
  <button class="btn dashed wide" data-act="new-task" data-from="tasks">＋ 업무 추가</button>`;
}
function sheetTask(id, from) {
  const t = id ? task(id) : { owner: isAdmin() ? S.taskFilter || staff()[0]?.name : S.me, field: "", name: "", cycle: from === "tasks" ? "매일" : "수시", est_min: 30, backup_person: "", manual_status: "없음", manual_link: "", tool: "", folder: "", active: true };
  const canEdit = isAdmin() || t.owner === S.me;
  const opt = (arr, v) => arr.map((x) => `<option ${x === v ? "selected" : ""}>${esc(x)}</option>`).join("");
  openSheet(`
  <form data-form="task" data-id="${id || ""}" data-from="${from || ""}">
    <div class="sheet-h"><div><b>${id ? "업무 수정" : "업무 추가"}</b>${id ? `<small>No ${id} · ${esc(t.owner)}</small>` : ""}</div><button type="button" class="icon-btn" data-act="close">✕</button></div>
    <fieldset ${canEdit ? "" : "disabled"}>
    <label class="fl">업무명</label><input name="name" required maxlength="60" value="${esc(t.name)}" autofocus>
    <div class="two">
      <div><label class="fl">주기</label><select name="cycle">${opt(CYCLES, t.cycle)}</select></div>
      <div><label class="fl">1회 예상 소요(분)</label><input name="est_min" type="number" inputmode="numeric" min="1" value="${t.est_min}"></div>
    </div>
    ${from === "today" && !id ? "" : `
    <div class="two">
      <div><label class="fl">분야</label><input name="field" maxlength="20" value="${esc(t.field)}"></div>
      <div><label class="fl">대체자</label><select name="backup_person"><option value="">없음</option>${staff().filter((m) => m.name !== t.owner).map((m) => `<option ${m.name === t.backup_person ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></div>
    </div>
    <div class="two">
      <div><label class="fl">매뉴얼</label><select name="manual_status">${opt(MANUAL, t.manual_status)}</select></div>
      <div><label class="fl">매뉴얼 링크</label><input name="manual_link" type="url" placeholder="https://drive.google.com/…" value="${esc(t.manual_link)}"></div>
    </div>
    <div class="two">
      <div><label class="fl">주 사용 도구</label><input name="tool" maxlength="40" value="${esc(t.tool)}"></div>
      <div><label class="fl">저장 폴더</label><input name="folder" maxlength="60" placeholder="예: 02_업무기록" value="${esc(t.folder)}"></div>
    </div>
    ${isAdmin() ? `<label class="fl">담당</label><select name="owner">${staff().map((m) => `<option ${m.name === t.owner ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select>` : ""}
    ${id ? `<label class="check"><input type="checkbox" name="active" ${t.active ? "checked" : ""}> 사용 중 (끄면 기록 버튼에서 사라지고, 지난 기록은 남아요)</label>` : ""}`}
    </fieldset>
    <div class="sheet-foot">${canEdit ? `<button class="btn primary big grow">${from === "today" && !id ? "추가하고 기록하기" : "저장"}</button>` : `<p class="muted">본인 업무만 고칠 수 있어요.</p>`}</div>
  </form>`);
}
async function submitTask(f) {
  const fd = new FormData(f); const id = Number(f.dataset.id) || null;
  const old = id ? task(id) : null;
  const row = { name: String(fd.get("name")).trim(), cycle: fd.get("cycle"), est_min: Math.max(1, Number(fd.get("est_min")) || 30) };
  if (fd.has("field")) Object.assign(row, {
    field: String(fd.get("field") || "").trim(), backup_person: fd.get("backup_person") || "", manual_status: fd.get("manual_status"),
    manual_link: String(fd.get("manual_link") || "").trim(), tool: String(fd.get("tool") || "").trim(), folder: String(fd.get("folder") || "").trim(),
  });
  if (fd.has("owner")) row.owner = fd.get("owner");
  if (id) row.active = fd.has("active"); else { row.owner = row.owner || old?.owner || (isAdmin() ? S.taskFilter || staff()[0].name : S.me); row.active = true; }
  try {
    const r = await save("hub_tasks", id, row);
    closeSheet(); renderView(); toast("저장했어요");
    if (f.dataset.from === "today" && !id) sheetLog(r.id);
  } catch (e) { fail(e); }
}

// ───────── 팀 현황판 ─────────
function statusOf(name, d) {
  const lv = leaveOf(name, d); if (lv) return { k: "leave", t: lv.kind };
  const ls = logsOf(name, d);
  if (ls.length) return { k: "ok", t: `${ls.length}건`, m: sum(ls, "minutes") };
  if (d > today() || !isBiz(d)) return { k: "none", t: "" };
  return { k: "miss", t: "미기록" };
}
function viewBoard() {
  const t0 = today(); const ws = weekStart(t0);
  const days = [0, 1, 2, 3, 4].map((i) => addDays(ws, i));
  const A = analyze(monthOf(t0));
  const feedDays = S.feedDays;
  const since = addDays(t0, -feedDays + 1);
  const feed = S.hub_logs.filter((l) => l.log_date >= since && (!S.feedFilter || l.member === S.feedFilter)).sort((a, b) => (b.log_date.localeCompare(a.log_date)) || (b.id - a.id));
  const byDate = {}; feed.forEach((l) => (byDate[l.log_date] ||= []).push(l));
  const notes = S.hub_logs.filter((l) => l.log_date >= addDays(t0, -13) && (l.blocker || l.idea)).sort((a, b) => b.log_date.localeCompare(a.log_date) || b.id - a.id).slice(0, 12);
  const weekMemos = S.hub_weekly.filter((w) => w.week_start === ws);
  const myMemo = weekMemos.find((w) => w.member === S.me);
  const prevMemos = S.hub_weekly.filter((w) => w.week_start < ws).sort((a, b) => b.week_start.localeCompare(a.week_start));
  const reqs = [...S.hub_requests].sort((a, b) => Number(a.done) - Number(b.done) || b.id - a.id);
  return `
  ${isAdmin() ? kakaoBanner() + kakaoLine() : ""}
  <section class="today-cards">${staff().map((m) => { const s = statusOf(m.name, t0); return `
    <div class="card pcard ${s.k}"><div class="pc-name"><i class="who-dot" style="background:${esc(m.color)}"></i>${esc(m.name)}</div>
    <div class="pc-stat">${s.k === "ok" ? `${s.t} · ${fmtMin(s.m)}` : s.k === "leave" ? `🌴 ${esc(s.t)}` : s.k === "miss" ? "오늘 아직 미기록" : "휴일"}</div></div>`; }).join("")}</section>

  <section class="card">
    <h3 class="card-h">이번 주 기록 현황</h3>
    <div class="tbl-wrap"><table class="tbl grid">
      <thead><tr><th></th>${days.map((d) => `<th class="${d === t0 ? "now" : ""}">${dow(d)}<small>${fmtShort(d)}</small></th>`).join("")}</tr></thead>
      <tbody>${staff().map((m) => `<tr><th><i class="who-dot" style="background:${esc(m.color)}"></i>${esc(m.name)}</th>${days.map((d) => { const s = statusOf(m.name, d); return `<td class="st ${s.k}">${s.k === "ok" ? `✓ ${s.t}` : esc(s.t) || (HOLIDAYS.has(d) ? "공휴일" : "")}</td>`; }).join("")}</tr>`).join("")}</tbody>
    </table></div>
  </section>

  <section class="card">
    <h3 class="card-h">${fmtMonth(monthOf(t0))} 담당자 요약</h3>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>담당자</th><th class="r">등록 업무</th><th class="r">기록된 업무</th><th class="r">총 건수</th><th class="r">총 시간</th><th class="r">평균 난이도</th><th class="r">기록일 비율</th><th class="r">매뉴얼 없음</th><th class="r">1순위 자동화</th><th class="r">대체자 교육</th></tr></thead>
      <tbody>${A.people.map((p) => `<tr><th><i class="who-dot" style="background:${esc(p.m.color)}"></i>${esc(p.m.name)}${p.heavy ? ' <em class="tag red">쏠림</em>' : ""}</th>
        <td class="r">${p.tasks}</td><td class="r">${p.logged}</td><td class="r">${p.cnt}</td><td class="r">${fmtMin(p.min)}</td><td class="r">${p.diff == null ? "-" : p.diff.toFixed(1)}</td>
        <td class="r ${p.ratio != null && p.ratio < 0.8 ? "miss" : ""}">${p.ratio == null ? "-" : Math.round(p.ratio * 100) + "%"}</td><td class="r">${p.noManual}</td><td class="r">${p.auto1}</td><td class="r">${p.edu}</td></tr>`).join("")}</tbody>
    </table></div>
    <p class="muted sm">기록일 비율 = 기록한 날 ÷ (영업일 − 휴무일). 쏠림 = 팀 평균 시간의 1.5배 초과.</p>
  </section>

  <section class="card">
    <h3 class="card-h">막힌 점 · 자동화 아이디어 (최근 2주)</h3>
    ${notes.length ? `<ul class="note-list">${notes.map((l) => `<li><span class="who-dot" style="background:${esc(colorOf(l.member))}"></span><b>${esc(l.member)}</b> <small>${fmtShort(l.log_date)} · ${esc(task(l.task_id)?.name || "")}</small>
      ${l.blocker ? `<div>⚠️ ${esc(l.blocker)}</div>` : ""}${l.idea ? `<div class="idea">💡 ${esc(l.idea)}</div>` : ""}</li>`).join("")}</ul>` : `<p class="muted">아직 없어요. 기록할 때 "메모 남기기"에 적으면 여기 모여요.</p>`}
  </section>

  <section class="card">
    <h3 class="card-h">팀 기록 모아보기 (최근 ${feedDays}일)</h3>
    <div class="filters">${["", ...staff().map((m) => m.name)].map((n) => `<button class="chip ${S.feedFilter === n ? "on" : ""}" data-act="feed-filter" data-n="${esc(n)}">${n ? esc(n) : "전체"}</button>`).join("")}</div>
    ${Object.keys(byDate).length ? Object.entries(byDate).map(([d, ls]) => `<h4 class="feed-date">${fmtDay(d)} <small>${ls.length}건 · ${fmtMin(sum(ls, "minutes"))}</small></h4><ul class="log-list">${ls.map((l) => logRow(l, false, true)).join("")}</ul>`).join("") : `<p class="muted">기록이 없어요.</p>`}
    ${feedDays < 60 ? `<button class="btn dashed wide" data-act="feed-more">이전 기록 더 보기</button>` : ""}
  </section>

  <section class="card">
    <h3 class="card-h">주간 점검 메모 <small>${fmtShort(ws)} 주 · 금요일 10분</small></h3>
    ${meObj().role === "staff" ? `<button class="btn ${myMemo ? "" : "primary"}" data-act="weekly">${myMemo ? "내 메모 고치기" : "✏️ 이번 주 메모 쓰기"}</button>` : ""}
    ${weekMemos.length ? weekMemos.map(memoHTML).join("") : `<p class="muted">이번 주 메모가 아직 없어요.</p>`}
    ${prevMemos.length ? `<details class="more"><summary>지난 메모 ${prevMemos.length}개</summary>${prevMemos.map(memoHTML).join("")}</details>` : ""}
  </section>

  <section class="card">
    <h3 class="card-h">개선 요청 <small>사이트에서 불편한 점을 적어 주세요</small></h3>
    <form data-form="request" class="inline-form"><input name="body" maxlength="200" placeholder="예: 기록 버튼 글씨가 더 컸으면 좋겠어요" required><button class="btn primary">등록</button></form>
    ${reqs.length ? `<ul class="req-list">${reqs.map((r) => `<li class="${r.done ? "done" : ""}"><span>${esc(r.body)}</span><small>${esc(r.member)} · ${r.created_at ? fmtShort(ymd(new Date(r.created_at))) : ""}</small>
      ${isAdmin() ? `<button class="chip sm" data-act="req-done" data-id="${r.id}">${r.done ? "되돌리기" : "반영됨"}</button>` : r.done ? '<em class="tag">반영됨</em>' : ""}</li>`).join("")}</ul>` : ""}
  </section>`;
}
function memoHTML(w) {
  return `<div class="memo"><div class="memo-h"><i class="who-dot" style="background:${esc(colorOf(w.member))}"></i><b>${esc(w.member)}</b><small>${fmtShort(w.week_start)} 주</small></div>
    <dl><dt>잘된 점</dt><dd>${esc(w.good) || "-"}</dd><dt>어려운 점</dt><dd>${esc(w.hard) || "-"}</dd><dt>다음 주 할 일</dt><dd>${esc(w.next) || "-"}</dd></dl></div>`;
}
function sheetWeekly() {
  const ws = weekStart(today());
  const w = S.hub_weekly.find((x) => x.week_start === ws && x.member === S.me) || {};
  openSheet(`
  <form data-form="weekly" data-id="${w.id || ""}" data-ws="${ws}">
    <div class="sheet-h"><div><b>주간 점검 메모</b><small>${fmtShort(ws)} 주</small></div><button type="button" class="icon-btn" data-act="close">✕</button></div>
    <label class="fl">잘된 점</label><textarea name="good" rows="2" maxlength="300">${esc(w.good || "")}</textarea>
    <label class="fl">어려운 점</label><textarea name="hard" rows="2" maxlength="300">${esc(w.hard || "")}</textarea>
    <label class="fl">다음 주 할 일</label><textarea name="next" rows="2" maxlength="300">${esc(w.next || "")}</textarea>
    <div class="sheet-foot"><button class="btn primary big grow">저장</button></div>
  </form>`);
}

// ───────── 월간분석 ─────────
function viewAnalysis() {
  const A = analyze(S.month);
  const counts = {}; A.rows.forEach((r) => (counts[r.cls] = (counts[r.cls] || 0) + 1));
  const lowPeople = A.people.filter((p) => p.ratio != null && p.ratio < 0.8);
  const spof = A.rows.filter((r) => r.spof).length;
  return `
  <div class="datebar">
    <button class="icon-btn" data-act="month" data-d="-1">‹</button>
    <div class="datebar-mid"><b>${fmtMonth(S.month)}</b><small>영업일 ${A.biz.length}일 · 기록 ${A.logs.length}건</small></div>
    <button class="icon-btn" data-act="month" data-d="1" ${S.month >= monthOf(today()) ? "disabled" : ""}>›</button>
  </div>
  <div class="class-chips">${CLASS_ORDER.map((c) => `<span class="cls ${CLASS_KEY[c]}">${c} <b>${counts[c] || 0}</b></span>`).join("")}</div>
  ${lowPeople.length || spof || A.people.some((p) => p.heavy) ? `<div class="warns">
    ${lowPeople.map((p) => `<div class="warn-row">📉 <b>${esc(p.m.name)}</b> 기록일 ${Math.round(p.ratio * 100)}% — 80% 미만이라 이 사람 업무 순위는 <b>참고용</b>이에요.</div>`).join("")}
    ${A.people.filter((p) => p.heavy).map((p) => `<div class="warn-row red">🔥 <b>${esc(p.m.name)}</b> 업무시간이 팀 평균의 1.5배를 넘어요 (${fmtMin(p.min)}).</div>`).join("")}
    ${spof ? `<div class="warn-row">🚧 <b>이 사람이 빠지면 멈춤</b> 업무 ${spof}건 (대체자·매뉴얼 없음 + 어려움)</div>` : ""}
  </div>` : ""}
  <section class="card">
    <div class="card-h-row"><h3 class="card-h">업무별 자동화 순위</h3><button class="btn" data-act="excel">⬇ 엑셀 다운로드</button></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th class="r">순위</th><th>담당</th><th>업무</th><th class="r">건수</th><th class="r">시간</th><th class="r">평균 난이도</th><th class="r">빈도</th><th class="r">강도</th><th class="r">자동화 점수</th><th>분류</th></tr></thead>
      <tbody>${A.rows.map((r, i) => `<tr class="${r.n ? "" : "off"}">
        <td class="r">${r.n ? i + 1 : "-"}</td><td><i class="who-dot" style="background:${esc(colorOf(r.t.owner))}"></i>${esc(r.t.owner)}${lowPeople.some((p) => p.m.name === r.t.owner) ? ' <em class="tag">참고용</em>' : ""}</td>
        <td><b>${esc(r.t.name)}</b>${r.spof ? ' <em class="tag red">빠지면 멈춤</em>' : ""}</td>
        <td class="r">${r.cnt}</td><td class="r">${fmtMin(r.min)}</td><td class="r">${r.diff == null ? "-" : r.diff.toFixed(1)}</td>
        <td class="r">${r.n ? r.fs : "-"}</td><td class="r">${r.n ? r.is : "-"}</td><td class="r"><b>${r.score == null ? "-" : r.score.toFixed(1)}</b></td>
        <td><span class="cls ${CLASS_KEY[r.cls]}">${r.cls}</span></td></tr>`).join("")}</tbody>
    </table></div>
    <p class="muted sm">자동화 점수 = 빈도점수 + 강도점수 + (3 − 평균 난이도), 최대 8점. 자주 = 빈도점수 2 이상, 어려움 = 평균 난이도 ${setting("diff_high")} 이상.</p>
  </section>
  <section class="card">
    <h3 class="card-h">기준값 ${isAdmin() ? "" : "<small>관리자만 바꿀 수 있어요</small>"}</h3>
    <form data-form="settings" class="settings-grid">
      ${[["freq_high", "빈도 3점 (건 이상)"], ["freq_mid", "빈도 2점 (건 이상)"], ["int_high", "강도 3점 (분 이상)"], ["int_mid", "강도 2점 (분 이상)"], ["diff_high", "어려움 (평균 난이도 이상)"]].map(([k, l]) => `
        <label><span>${l}</span><input name="${k}" type="number" step="${k === "diff_high" ? "0.1" : "1"}" value="${setting(k)}" ${isAdmin() ? "" : "disabled"}></label>`).join("")}
      ${isAdmin() ? `<button class="btn primary">기준값 저장</button>` : ""}
    </form>
  </section>`;
}
function exportExcel() {
  if (!window.XLSX) return toast("엑셀 도구를 불러오는 중이에요. 잠시 후 다시 눌러 주세요", true);
  const m = S.month; const A = analyze(m);
  const wb = XLSX.utils.book_new();
  const add = (name, rows, widths) => { const ws = XLSX.utils.json_to_sheet(rows); ws["!cols"] = widths.map((w) => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, name); };
  add("업무목록", S.hub_tasks.map((t) => ({ No: t.id, 담당자: t.owner, 분야: t.field, 업무명: t.name, 주기: t.cycle, "1회 예상 소요(분)": t.est_min, 대체자: t.backup_person, "매뉴얼 유무": t.manual_status, "매뉴얼 링크": t.manual_link, "주 사용 도구": t.tool, "저장 폴더": t.folder, "사용 여부": t.active ? "사용" : "사용 안 함" })), [5, 8, 8, 30, 6, 10, 8, 8, 30, 14, 16, 8]);
  add("업무일지", A.logs.slice().sort((a, b) => a.log_date.localeCompare(b.log_date) || a.id - b.id).map((l) => { const t = task(l.task_id) || {}; return { 날짜: l.log_date, 요일: dow(l.log_date), 담당자: l.member, 분야: t.field, 업무명: t.name, 건수: l.count, "소요시간(분)": l.minutes, 난이도: l.difficulty, "막힌 점": l.blocker, "자동화 아이디어": l.idea, "사용 도구": t.tool, 대처: l.is_cover ? "대처" : "", "저장 시각": l.created_at ? new Date(l.created_at).toLocaleString("ko-KR") : "" }; }), [11, 5, 8, 8, 30, 6, 10, 6, 30, 30, 14, 6, 20]);
  add("월간분석", A.rows.map((r, i) => ({ 순위: r.n ? i + 1 : "", 담당자: r.t.owner, 업무명: r.t.name, "월 건수": r.cnt, "월 소요시간(분)": r.min, "평균 난이도": r.diff == null ? "" : +r.diff.toFixed(2), 빈도점수: r.n ? r.fs : "", 강도점수: r.n ? r.is : "", "자동화 점수": r.score == null ? "" : +r.score.toFixed(2), 분류: r.cls, "단일 장애점": r.spof ? "빠지면 멈춤" : "" })), [5, 8, 30, 8, 12, 10, 8, 8, 10, 18, 12]);
  add("담당자요약", A.people.map((p) => ({ 담당자: p.m.name, "등록 업무 수": p.tasks, "기록된 업무 수": p.logged, "월 총 건수": p.cnt, "월 총 시간(분)": p.min, "평균 난이도": p.diff == null ? "" : +p.diff.toFixed(2), "기록일 비율": p.ratio == null ? "" : Math.round(p.ratio * 100) + "%", "매뉴얼 없는 업무": p.noManual, "1순위 자동화 후보": p.auto1, "대체자 교육 필요": p.edu, 쏠림: p.heavy ? "쏠림" : "" })), [8, 10, 12, 10, 12, 10, 10, 14, 14, 14, 6]);
  XLSX.writeFile(wb, `${m.replace("-", "")}_업무파악체크리스트.xlsx`);
}

// ───────── 앱 설치 ─────────
let installEvt = null;
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function updateInstallButtons() {
  const show = !isStandalone() && (installEvt || isIOS() || /android/i.test(navigator.userAgent));
  document.querySelectorAll(".install-btn").forEach((b) => (b.hidden = !show));
}
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; updateInstallButtons(); });
window.addEventListener("appinstalled", () => { installEvt = null; updateInstallButtons(); toast("설치됐어요! 이제 아이콘으로 여세요"); });
async function doInstall() {
  if (installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; updateInstallButtons(); return; }
  openSheet(`
  <div class="sheet-h"><div><b>앱으로 설치하기</b><small>한 번만 하면 돼요</small></div><button type="button" class="icon-btn" data-act="close">✕</button></div>
  ${isIOS() ? `<ol class="steps"><li>사파리 아래쪽 <b>공유 버튼 (□↑)</b>을 누르세요.</li><li><b>홈 화면에 추가</b>를 누르세요.</li><li>오른쪽 위 <b>추가</b>를 누르면 바탕화면에 아이콘이 생겨요.</li></ol><p class="muted sm">아이폰은 꼭 사파리로 열어야 설치할 수 있어요.</p>`
  : `<ol class="steps"><li>크롬 오른쪽 위 <b>⋮ 메뉴</b>를 누르세요.</li><li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 누르세요.</li><li>바탕화면에 생긴 아이콘으로 여세요.</li></ol>`}`);
}

// ───────── 이벤트 ─────────
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act;
  if (el.tagName === "TR" && e.target.closest("a")) return;
  switch (a) {
    case "go": closeSheet(); go(el.dataset.v); break;
    case "close": closeSheet(); break;
    case "who": renderWho(); break;
    case "cancel-who": renderShell(); break;
    case "pick-me": S.me = el.dataset.name; localStorage.setItem("hub-me", S.me); S.view = location.hash.slice(1) && !location.hash.includes("=") ? location.hash.slice(1) : (isAdmin() ? "board" : "today"); renderShell(); break;
    case "logout": await DB.signOut(); localStorage.removeItem("hub-me"); S.me = ""; renderLogin(); break;
    case "install": doInstall(); break;
    case "date": S.date = addDays(S.date, Number(el.dataset.d)); renderView(); break;
    case "date-today": S.date = today(); renderView(); break;
    case "month": S.month = addMonth(S.month, Number(el.dataset.d)); renderView(); break;
    case "log": {
      const d = el.dataset.date || S.date;
      if (!isAdmin() && d < addDays(today(), -7)) return toast("7일이 지난 기록은 고칠 수 없어요", true);
      sheetLog(Number(el.dataset.task), el.dataset.cover === "1", d); break;
    }
    case "step": {
      const f = el.closest("form"); const inp = f.elements[el.dataset.f];
      const min = el.dataset.f === "count" ? 1 : 0;
      inp.value = Math.max(min, (Number(inp.value) || 0) + Number(el.dataset.n));
      if (el.dataset.f === "count" && !f.dataset.touched) f.elements.minutes.value = Number(f.dataset.est) * Number(inp.value);
      if (el.dataset.f === "minutes") f.dataset.touched = "1";
      break;
    }
    case "seg": {
      const seg = el.closest("[data-seg]");
      seg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === el));
      el.closest("form").elements[seg.dataset.seg].value = el.dataset.v; break;
    }
    case "del-log": if (confirm("이 기록을 지울까요?")) { try { await del("hub_logs", Number(el.dataset.id)); closeSheet(); renderView(); toast("지웠어요"); } catch (err) { fail(err); } } break;
    case "like-yesterday": likeYesterday(); break;
    case "leave": sheetLeave(); break;
    case "set-leave": setLeave(el.dataset.k); break;
    case "cover": sheetCover(); break;
    case "new-task": sheetTask(null, el.dataset.from || "today"); break;
    case "edit-task": sheetTask(Number(el.dataset.id), "tasks"); break;
    case "task-filter": S.taskFilter = el.dataset.n; renderView(); break;
    case "feed-filter": S.feedFilter = el.dataset.n; renderView(); break;
    case "feed-more": S.feedDays += 7; renderView(); break;
    case "weekly": sheetWeekly(); break;
    case "req-done": { const r = S.hub_requests.find((x) => x.id === Number(el.dataset.id)); try { await save("hub_requests", r.id, { done: !r.done }); renderView(); } catch (err) { fail(err); } break; }
    case "excel": exportExcel(); break;
    case "kakao-connect":
      try { el.disabled = true; const { url } = await DB.kakao("authorize_url", { member: S.me }); location.href = url; } catch (err) { el.disabled = false; toast(err.message, true); }
      break;
    case "kakao-test":
      try { await DB.kakao("test", { member: S.me }); toast("시험 알림을 보냈어요. 카톡을 확인해 보세요"); } catch (err) { toast(err.message, true); }
      break;
    case "kakao-off":
      if (!confirm("카톡 알림을 끌까요?")) break;
      try { await DB.kakao("disconnect", { member: S.me }); upsertLocal("hub_members", { ...meObj(), kakao_at: null }); renderView(); toast("카톡 알림을 껐어요"); } catch (err) { toast(err.message, true); }
      break;
  }
});
document.addEventListener("input", (e) => { if (e.target.name === "minutes") e.target.form.dataset.touched = "1"; if (e.target.name === "count") { const f = e.target.form; if (!f.dataset.touched) f.elements.minutes.value = Number(f.dataset.est) * Math.max(1, Number(e.target.value) || 1); } });
document.addEventListener("submit", async (e) => {
  const f = e.target.closest("[data-form]"); if (!f) return;
  e.preventDefault();
  const fd = new FormData(f);
  switch (f.dataset.form) {
    case "login": {
      const btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "확인 중…";
      try { await DB.signIn(String(fd.get("pw"))); await start(); } catch (err) { renderLogin(err.message); }
      break;
    }
    case "log": submitLog(f); break;
    case "task": submitTask(f); break;
    case "weekly":
      try { await save("hub_weekly", Number(f.dataset.id) || null, { week_start: f.dataset.ws, member: S.me, good: fd.get("good").trim(), hard: fd.get("hard").trim(), next: fd.get("next").trim() }); closeSheet(); renderView(); toast("저장했어요"); } catch (err) { fail(err); }
      break;
    case "request":
      try { await save("hub_requests", null, { member: S.me, body: String(fd.get("body")).trim(), done: false }); renderView(); toast("등록했어요"); } catch (err) { fail(err); }
      break;
    case "settings":
      try {
        for (const s of S.hub_settings) { const v = Number(fd.get(s.key)); if (fd.has(s.key) && v !== Number(s.value)) await save("hub_settings", s.id, { value: v }); }
        renderView(); toast("기준값을 저장했어요");
      } catch (err) { fail(err); }
      break;
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });
window.addEventListener("hashchange", () => { const v = location.hash.slice(1); if (NAV.some((n) => n.id === v) && v !== S.view && meObj()) go(v); });

let lastDay = today();
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible" || !meObj()) return;
  if (today() !== lastDay) { if (S.date === lastDay) S.date = today(); lastDay = today(); S.month = monthOf(today()); }
  try { await loadAll(); renderView(); } catch (e) { console.error(e); }
});

// ───────── 시작 ─────────
async function start() {
  await loadAll();
  DB.subscribe(scheduleReload);
  if (!S.me || !meObj()) return renderWho();
  const h = location.hash.slice(1);
  S.view = NAV.some((n) => n.id === h) ? h : isAdmin() ? "board" : "today";
  renderShell();
}
async function kakaoCallback(q) {
  history.replaceState(null, "", location.pathname + location.hash);
  $("#app").innerHTML = `<div class="gate"><img src="icons/icon-192.png" alt="" class="gate-logo"><h1>카톡 알림 연결 중…</h1></div>`;
  if (q.get("error")) return `카카오 연결을 취소했어요.`;
  try { const r = await DB.kakao("connect", { code: q.get("code"), state: q.get("state") }); return { ok: r.member }; } catch (e) { return e.message; }
}
async function boot() {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get("state") && (q.get("code") || q.get("error"))) {
      const res = await kakaoCallback(q);
      const signed = await DB.signedIn();
      if (res && res.ok) {
        if (!signed) {
          $("#app").innerHTML = `<div class="gate"><img src="icons/icon-192.png" alt="" class="gate-logo"><h1>✅ 연결됐어요!</h1><p class="muted">${esc(res.ok)} 님 카톡으로 확인 메시지를 보냈어요.<br>이 창을 닫고 업무허브 앱으로 돌아가세요.</p></div>`;
          return;
        }
        setTimeout(() => toast("카톡 알림이 연결됐어요! 카톡을 확인해 보세요"), 300);
      } else {
        if (!signed) { $("#app").innerHTML = `<div class="gate"><h1>연결하지 못했어요</h1><p class="muted">${esc(res)}</p><p class="muted">업무허브 앱에서 다시 눌러 주세요.</p></div>`; return; }
        setTimeout(() => toast(res, true), 300);
      }
    }
    if (!(await DB.signedIn())) return renderLogin();
    await start();
  } catch (e) {
    console.error(e);
    $("#app").innerHTML = `<div class="gate"><h1>연결하지 못했어요</h1><p class="muted">${esc(e.message || e)}</p><button class="btn primary" onclick="location.reload()">다시 시도</button><button class="btn link" data-act="logout">로그아웃</button></div>`;
  }
}
if ("serviceWorker" in navigator && !DEMO) navigator.serviceWorker.register("sw.js").catch(() => {});
boot();
})();
