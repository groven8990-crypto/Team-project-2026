/* 업무 공유 - 메인 앱 (라우터 + 화면) */

const NAV = [
  { id: "home", label: "홈", icon: "🏠" },
  { id: "dashboard", label: "할일 대시보드", icon: "🗂️" },
  { id: "goals", label: "업무 목표", icon: "🎯" },
  { id: "calendar", label: "캘린더", icon: "📅" },
  { id: "databoard", label: "데이터 보드", icon: "📚" },
  { id: "minutes", label: "회의록", icon: "📝" },
  { id: "kpt", label: "KPT 회고", icon: "🔁" },
  { id: "reports", label: "일일 보고서", icon: "📈" },
  { id: "members", label: "멤버", icon: "👥" },
];

const TASK_STATUS = [
  { key: "todo", label: "할 일" },
  { key: "doing", label: "진행 중" },
  { key: "done", label: "완료" },
];

const GOAL_STATUS = [
  { key: "planned", label: "예정", color: "#94a3b8" },
  { key: "doing", label: "진행 중", color: "#3b82f6" },
  { key: "done", label: "완료", color: "#16a34a" },
  { key: "hold", label: "보류", color: "#f59e0b" },
];
const GRADES = ["미평가", "S", "A", "B", "C"];

const MEMBER_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b",
];

const App = {
  route: location.hash.replace("#", "") || "home",
  // 화면별 임시 상태 보관
  state: {
    databoardTab: "resources",
    kptMineOnly: false,
    calendarRef: new Date(),
    taskMember: "all", // 대시보드 멤버 필터: all | mine | <memberId>
    goalView: "table", // 업무 목표 보기: table | board
  },
};

/* ============ 공통 헬퍼 ============ */
function $(sel, root) {
  return (root || document).querySelector(sel);
}
function curUser() {
  return Store.getCurrentUserId();
}
function requireUser() {
  if (!curUser()) {
    UI.toast("먼저 우측 상단에서 본인 이름을 선택/등록하세요", "warn");
    return false;
  }
  return true;
}

/* ============ 헤더 / 사용자 선택 ============ */
function renderHeader() {
  const members = Store.list("members");
  const cur = curUser();
  const modeBadge =
    Store.mode === "cloud"
      ? `<span class="mode-badge cloud" title="Supabase 실시간 공유 중">● 실시간 공유</span>`
      : `<span class="mode-badge local" title="이 브라우저에만 저장됩니다">● 로컬 모드</span>`;

  const userSelect = `
    <select id="userSelect" class="user-select" title="본인 이름">
      <option value="">이름 선택…</option>
      ${members
        .map(
          (m) =>
            `<option value="${m.id}" ${m.id === cur ? "selected" : ""}>${UI.esc(
              m.name
            )}</option>`
        )
        .join("")}
    </select>`;

  return `
    <header class="app-header">
      <div class="brand">
        <span class="logo">🤝</span>
        <h1>${UI.esc(window.APP_CONFIG.APP_TITLE)}</h1>
        ${modeBadge}
      </div>
      <div class="header-right">
        ${userSelect}
        <button class="btn ghost sm" id="addMemberQuick">+ 이름 등록</button>
        <button class="icon-btn" id="dataMenuBtn" title="데이터 백업/복원">⚙️</button>
      </div>
    </header>`;
}

function renderNav() {
  return `
    <nav class="app-nav">
      ${NAV.map(
        (n) =>
          `<a href="#${n.id}" class="nav-item ${
            App.route === n.id ? "active" : ""
          }"><span class="nav-icon">${n.icon}</span>${n.label}</a>`
      ).join("")}
    </nav>`;
}

/* ============ 홈 (전체 한눈에 보기) ============ */
function renderHome() {
  const today = UI.todayInput();
  const tasks = Store.list("tasks");
  const events = Store.list("events");
  const meetings = Store.list("meetings");
  const ideas = Store.list("ideas");
  const resources = Store.list("resources");
  const retros = Store.list("retros");
  const reports = Store.list("reports");
  const members = Store.list("members");

  const me = curUser();
  const greetName = me ? UI.memberName(me) + "님" : "";
  const hour = new Date().getHours();
  const greet = hour < 11 ? "좋은 아침이에요" : hour < 18 ? "오늘도 화이팅이에요" : "오늘도 수고하셨어요";

  // 통계
  const counts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  // 진행중/예정 할일 (완료 제외, 마감 임박 우선)
  const myTasks = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"))
    .slice(0, 6);

  // 다가오는 일정 (오늘 이후)
  const upcoming = events
    .filter((e) => e.date && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  // 최근 항목들
  const recentMeetings = meetings
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 3);
  const recentIdeas = ideas.slice().reverse().slice(0, 3);
  const recentResources = resources
    .filter((r) => r.kind === "image" && r.image_data)
    .slice()
    .reverse()
    .slice(0, 4);
  const recentRetro = retros
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];

  // 오늘 보고 현황
  const reportStatus = members.map((m) => ({
    m,
    done: reports.some((r) => r.member_id === m.id && r.date === today),
  }));

  const sec = (title, route, body, addAct) => `
    <div class="home-card">
      <div class="home-card-head">
        <h3>${title}</h3>
        <div class="home-card-actions">
          ${addAct ? `<button class="btn xs primary" data-act="${addAct}">+ 추가</button>` : ""}
          <a class="more-link" href="#${route}">더보기 ›</a>
        </div>
      </div>
      <div class="home-card-body">${body}</div>
    </div>`;

  // --- 위젯: 할일 ---
  const tasksBody = myTasks.length
    ? `<div class="mini-list">${myTasks
        .map((t) => {
          const overdue = t.due_date && t.due_date < today;
          return `<div class="mini-row">
            <span class="dot status-${t.status}"></span>
            <span class="mini-title">${UI.esc(t.title)}</span>
            ${UI.memberChip(t.assignee_id)}
            ${
              t.due_date
                ? `<span class="mini-due ${overdue ? "overdue" : ""}">${UI.fmtDate(
                    t.due_date
                  )}</span>`
                : ""
            }
            <button class="btn xs ghost" data-act="task-move" data-id="${t.id}" data-to="${
            t.status === "todo" ? "doing" : "done"
          }">${t.status === "todo" ? "▶" : "✓"}</button>
          </div>`;
        })
        .join("")}</div>`
    : `<div class="empty-mini">진행 중인 할 일이 없습니다</div>`;

  // --- 위젯: 일정 ---
  const eventsBody = upcoming.length
    ? `<div class="mini-list">${upcoming
        .map(
          (e) => `<div class="mini-row">
            <span class="mini-date">${UI.fmtDate(e.date)}</span>
            <span class="cal-ev scope-${e.scope || "day"} inline">${
            e.scope === "month" ? "월" : e.scope === "week" ? "주" : "일"
          }</span>
            <span class="mini-title">${UI.esc(e.title)}</span>
          </div>`
        )
        .join("")}</div>`
    : `<div class="empty-mini">예정된 일정이 없습니다</div>`;

  // --- 위젯: 회의록 ---
  const meetingsBody = recentMeetings.length
    ? `<div class="mini-list">${recentMeetings
        .map(
          (m) => `<div class="mini-row">
            <span class="mini-date">${UI.fmtDate(m.date)}</span>
            <span class="mini-title">${UI.esc(m.title)}</span>
          </div>`
        )
        .join("")}</div>`
    : `<div class="empty-mini">회의록이 없습니다</div>`;

  // --- 위젯: 아이디어 ---
  const ideasBody = recentIdeas.length
    ? `<div class="mini-list">${recentIdeas
        .map(
          (i) => `<div class="mini-row">
            <span class="mini-title">💡 ${UI.esc(i.title)}</span>
            ${UI.memberChip(i.member_id)}
          </div>`
        )
        .join("")}</div>`
    : `<div class="empty-mini">아이디어가 없습니다</div>`;

  // --- 위젯: 자료실 ---
  const resBody = recentResources.length
    ? `<div class="home-thumbs">${recentResources
        .map((r) => `<div class="home-thumb"><img src="${UI.esc(r.image_data)}" alt=""></div>`)
        .join("")}</div>`
    : `<div class="empty-mini">올라온 자료가 없습니다</div>`;

  // --- 위젯: 회고 ---
  const retroBody = recentRetro
    ? `<div class="mini-kpt">
        <div><b>👍 Keep</b> ${UI.esc((recentRetro.keep || "-").slice(0, 60))}</div>
        <div><b>⚠️ Problem</b> ${UI.esc((recentRetro.problem || "-").slice(0, 60))}</div>
        <div><b>🚀 Try</b> ${UI.esc((recentRetro.try_ || "-").slice(0, 60))}</div>
        <div class="muted">${UI.memberName(recentRetro.member_id)} · ${UI.fmtDate(
        recentRetro.date
      )}</div>
      </div>`
    : `<div class="empty-mini">작성된 회고가 없습니다</div>`;

  // --- 위젯: 오늘 보고 현황 ---
  const reportBody = members.length
    ? `<div class="report-status">${reportStatus
        .map(
          (s) =>
            `<span class="rs-item ${s.done ? "ok" : ""}">${
              s.done ? "✅" : "⬜"
            } ${UI.esc(s.m.name)}</span>`
        )
        .join("")}</div>`
    : `<div class="empty-mini">멤버를 먼저 등록하세요</div>`;

  return `
    <section class="view">
      <div class="home-banner">
        <div>
          <div class="home-greet">${greet}${greetName ? ", " + UI.esc(greetName) : ""} 👋</div>
          <div class="home-date">${new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}</div>
        </div>
        <div class="home-quick">
          <button class="btn primary sm" data-act="task-add">+ 할 일</button>
          <button class="btn ghost sm" data-act="event-add">+ 일정</button>
          <button class="btn ghost sm" data-act="report-auto">+ 오늘 보고</button>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat"><div class="stat-num">${tasks.length}</div><div class="stat-label">전체 할일</div></div>
        <div class="stat"><div class="stat-num">${counts.doing}</div><div class="stat-label">진행 중</div></div>
        <div class="stat"><div class="stat-num">${counts.todo}</div><div class="stat-label">할 일</div></div>
        <div class="stat"><div class="stat-num">${counts.done}</div><div class="stat-label">완료</div></div>
      </div>

      <div class="home-grid">
        ${sec("🗂️ 할 일 / 진행 중", "dashboard", tasksBody, "task-add")}
        ${sec("📅 다가오는 일정", "calendar", eventsBody, "event-add")}
        ${sec("📈 오늘 일일 보고 현황", "reports", reportBody, "report-auto")}
        ${sec("📝 최근 회의록", "minutes", meetingsBody, "meeting-add")}
        ${sec("💡 아이디어 노트", "databoard", ideasBody, "idea-add")}
        ${sec("🖼️ 최근 자료실", "databoard", resBody, "res-add")}
        ${sec("🔁 최근 KPT 회고", "kpt", retroBody, "kpt-add")}
      </div>
    </section>`;
}

/* ============ 대시보드 (칸반 + 통계) ============ */
function renderDashboard() {
  const members = Store.list("members");
  const filter = App.state.taskMember;

  // 멤버 필터 적용
  const allTasks = Store.list("tasks");
  const tasks = allTasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "mine") return t.assignee_id === curUser();
    return t.assignee_id === filter;
  });

  const counts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  // 멤버별 보기 필터 바 (각 멤버 옆에 담당 할일 수 표시)
  const chip = (key, label, active) =>
    `<button class="member-filter ${active ? "active" : ""}" data-act="task-filter" data-member="${key}">${label}</button>`;
  const filterBar = `
    <div class="member-filter-bar">
      ${chip("all", `전체 <b>${allTasks.length}</b>`, filter === "all")}
      ${
        curUser()
          ? chip("mine", "내 할일", filter === "mine")
          : ""
      }
      ${members
        .map((m) => {
          const n = allTasks.filter((t) => t.assignee_id === m.id).length;
          return `<button class="member-filter ${
            filter === m.id ? "active" : ""
          }" data-act="task-filter" data-member="${m.id}" style="--c:${UI.esc(
            m.color || "#64748b"
          )}"><span class="mf-dot"></span>${UI.esc(m.name)} <b>${n}</b></button>`;
        })
        .join("")}
    </div>`;

  const who =
    filter === "all"
      ? "전체"
      : filter === "mine"
      ? "내 할일"
      : UI.memberName(filter) + "님";

  const stats = `
    <div class="stat-row">
      <div class="stat"><div class="stat-num">${tasks.length}</div><div class="stat-label">${who} 할일</div></div>
      <div class="stat"><div class="stat-num">${counts.todo}</div><div class="stat-label">할 일</div></div>
      <div class="stat"><div class="stat-num">${counts.doing}</div><div class="stat-label">진행 중</div></div>
      <div class="stat"><div class="stat-num">${counts.done}</div><div class="stat-label">완료</div></div>
    </div>`;

  const columns = TASK_STATUS.map((col) => {
    const items = tasks
      .filter((t) => t.status === col.key)
      .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
    const cards = items.length
      ? items.map((t) => taskCard(t)).join("")
      : `<div class="empty-mini">항목 없음</div>`;
    return `
      <div class="kanban-col" data-status="${col.key}">
        <div class="kanban-head">
          <span>${col.label} <b>${items.length}</b></span>
        </div>
        <div class="kanban-body">${cards}</div>
      </div>`;
  }).join("");

  return `
    <section class="view">
      <div class="view-head">
        <h2>할일 대시보드</h2>
        <button class="btn primary" data-act="task-add">+ 할 일 추가</button>
      </div>
      ${filterBar}
      ${stats}
      <div class="kanban">${columns}</div>
    </section>`;
}

function taskCard(t) {
  const overdue =
    t.status !== "done" && t.due_date && t.due_date < UI.todayInput();
  const next = t.status === "todo" ? "doing" : t.status === "doing" ? "done" : "todo";
  const nextLabel =
    t.status === "todo" ? "▶ 시작" : t.status === "doing" ? "✓ 완료" : "↺ 되돌리기";
  return `
    <div class="card task-card ${t.status === "done" ? "is-done" : ""}">
      <div class="card-top">
        <strong>${UI.esc(t.title)}</strong>
        ${UI.memberChip(t.assignee_id)}
      </div>
      ${t.detail ? `<p class="card-desc">${UI.nl2br(t.detail)}</p>` : ""}
      <div class="card-meta">
        ${
          t.due_date
            ? `<span class="due ${overdue ? "overdue" : ""}">📅 ${UI.fmtDate(
                t.due_date
              )}</span>`
            : ""
        }
      </div>
      <div class="card-actions">
        <button class="btn xs primary" data-act="task-move" data-id="${t.id}" data-to="${next}">${nextLabel}</button>
        <button class="btn xs ghost" data-act="task-edit" data-id="${t.id}">수정</button>
        <button class="btn xs danger" data-act="task-del" data-id="${t.id}">삭제</button>
      </div>
    </div>`;
}

async function taskForm(existing) {
  const values = existing || { assignee_id: curUser(), status: "todo" };
  const res = await UI.formModal({
    title: existing ? "할 일 수정" : "할 일 추가",
    submitText: existing ? "수정" : "추가",
    values,
    fields: [
      { name: "title", label: "제목", type: "text", required: true, full: true },
      { name: "detail", label: "내용", type: "textarea", full: true },
      {
        name: "assignee_id",
        label: "담당자",
        type: "select",
        options: UI.memberOptions(false),
      },
      {
        name: "status",
        label: "상태",
        type: "select",
        options: TASK_STATUS.map((s) => ({ value: s.key, label: s.label })),
      },
      { name: "due_date", label: "마감일", type: "date" },
    ],
  });
  if (!res) return;
  if (existing) {
    await Store.update("tasks", existing.id, res);
    UI.toast("수정되었습니다");
  } else {
    await Store.add("tasks", res);
    UI.toast("추가되었습니다");
  }
}

/* ============ 업무 목표 및 평가 ============ */
function goalStatusMeta(key) {
  return GOAL_STATUS.find((s) => s.key === key) || GOAL_STATUS[1];
}
function statusBadge(key) {
  const s = goalStatusMeta(key);
  return `<span class="status-badge" style="--c:${s.color}"><span class="sb-dot"></span>${s.label}</span>`;
}
function weightBar(w) {
  const n = Math.max(0, Math.min(100, parseInt(w, 10) || 0));
  return `<div class="weight"><div class="weight-bar"><span style="width:${n}%"></span></div><span class="weight-num">${n}%</span></div>`;
}
function gradeBadge(g) {
  if (!g || g === "미평가") return `<span class="grade none">미평가</span>`;
  return `<span class="grade g-${g}">${UI.esc(g)}</span>`;
}

function renderGoals() {
  const view = App.state.goalView;
  const toggle = `
    <div class="view-toggle">
      <button class="vt ${view === "table" ? "active" : ""}" data-act="goal-view" data-view="table">▦ 테이블 보기</button>
      <button class="vt ${view === "board" ? "active" : ""}" data-act="goal-view" data-view="board">▢ 상태별 보기</button>
    </div>`;

  return `
    <section class="view">
      <div class="view-head">
        <h2>📌 업무 목표 및 평가</h2>
        <button class="btn primary" data-act="goal-add">+ 목표 추가</button>
      </div>
      ${toggle}
      ${view === "table" ? goalsTable() : goalsBoard()}
    </section>`;
}

function goalsTable() {
  const goals = Store.list("goals")
    .slice()
    .sort(
      (a, b) =>
        (b.year || "").localeCompare(a.year || "") ||
        (a.status || "").localeCompare(b.status || "")
    );
  if (!goals.length)
    return `<div class="empty">등록된 업무 목표가 없습니다. "+ 목표 추가"로 시작하세요.</div>`;

  const rows = goals
    .map(
      (g) => `
      <tr>
        <td class="ta-c"><span class="year-tag">${UI.esc(g.year || "-")}</span></td>
        <td>${statusBadge(g.status)}</td>
        <td><strong>${UI.esc(g.title)}</strong></td>
        <td style="min-width:120px">${weightBar(g.weight)}</td>
        <td class="ta-l">${g.metric ? UI.nl2br(g.metric) : "<span class='muted'>-</span>"}</td>
        <td>${UI.memberChip(g.member_id)}</td>
        <td class="ta-c">${gradeBadge(g.grade)}</td>
        <td class="ta-c nowrap">
          <button class="btn xs ghost" data-act="goal-edit" data-id="${g.id}">수정</button>
          <button class="btn xs danger" data-act="goal-del" data-id="${g.id}">삭제</button>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div class="table-wrap">
      <table class="goal-table">
        <thead>
          <tr>
            <th>대상년도</th><th>상태</th><th>중점추진과제</th><th>비중</th>
            <th class="ta-l">평가지표</th><th>담당</th><th>평가</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function goalsBoard() {
  const goals = Store.list("goals");
  const cols = GOAL_STATUS.map((s) => {
    const items = goals
      .filter((g) => (g.status || "doing") === s.key)
      .sort((a, b) => (parseInt(b.weight) || 0) - (parseInt(a.weight) || 0));
    const cards = items.length
      ? items.map((g) => goalCard(g)).join("")
      : `<div class="empty-mini">항목 없음</div>`;
    return `
      <div class="kanban-col">
        <div class="kanban-head"><span style="color:${s.color}">● ${s.label} <b>${items.length}</b></span></div>
        <div class="kanban-body">${cards}</div>
      </div>`;
  }).join("");
  return `<div class="kanban goal-kanban">${cols}</div>`;
}

function goalCard(g) {
  return `
    <div class="card goal-card">
      <div class="card-top">
        <strong>${UI.esc(g.title)}</strong>
        ${gradeBadge(g.grade)}
      </div>
      ${weightBar(g.weight)}
      ${g.plan ? `<p class="card-desc"><b class="lbl">실행계획</b> ${UI.nl2br(g.plan)}</p>` : ""}
      ${g.metric ? `<p class="card-desc"><b class="lbl">평가지표</b> ${UI.nl2br(g.metric)}</p>` : ""}
      <div class="card-meta">
        <span class="year-tag">${UI.esc(g.year || "-")}</span>
        ${UI.memberChip(g.member_id)}
      </div>
      <div class="card-actions">
        <button class="btn xs ghost" data-act="goal-edit" data-id="${g.id}">수정</button>
        <button class="btn xs danger" data-act="goal-del" data-id="${g.id}">삭제</button>
      </div>
    </div>`;
}

async function goalForm(existing) {
  const values = existing || {
    member_id: curUser(),
    status: "doing",
    year: String(new Date().getFullYear()),
    grade: "미평가",
  };
  const res = await UI.formModal({
    title: existing ? "업무 목표 수정" : "업무 목표 추가",
    submitText: existing ? "수정" : "추가",
    values,
    fields: [
      { name: "title", label: "중점추진과제", type: "text", required: true, full: true },
      { name: "year", label: "대상년도", type: "text", placeholder: "예: 2025" },
      {
        name: "status",
        label: "상태",
        type: "select",
        options: GOAL_STATUS.map((s) => ({ value: s.key, label: s.label })),
      },
      { name: "weight", label: "비중 (%)", type: "text", placeholder: "예: 30" },
      {
        name: "member_id",
        label: "담당자",
        type: "select",
        options: UI.memberOptions(false),
      },
      { name: "metric", label: "평가지표", type: "textarea", rows: 3, full: true },
      { name: "plan", label: "실행계획", type: "textarea", rows: 3, full: true },
      {
        name: "grade",
        label: "평가등급",
        type: "select",
        options: GRADES.map((g) => ({ value: g, label: g })),
      },
    ],
  });
  if (!res) return;
  if (existing) await Store.update("goals", existing.id, res);
  else await Store.add("goals", res);
  UI.toast("저장되었습니다");
}

/* ============ 캘린더 ============ */
function renderCalendar() {
  const ref = App.state.calendarRef;
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const events = Store.list("events");

  // 주별/월별 별도 표시용
  const monthly = events
    .filter((e) => e.scope === "month" && belongsToMonth(e.date, year, month))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const weekly = events
    .filter((e) => e.scope === "week" && belongsToMonth(e.date, year, month))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const highlight = `
    <div class="cal-highlights">
      <div class="hl-box hl-month">
        <h4>📌 이달의 월별 일정</h4>
        ${
          monthly.length
            ? monthly.map((e) => highlightItem(e)).join("")
            : `<div class="empty-mini">등록된 월별 일정이 없습니다</div>`
        }
      </div>
      <div class="hl-box hl-week">
        <h4>🗓️ 주별 일정</h4>
        ${
          weekly.length
            ? weekly.map((e) => highlightItem(e)).join("")
            : `<div class="empty-mini">등록된 주별 일정이 없습니다</div>`
        }
      </div>
    </div>`;

  return `
    <section class="view">
      <div class="view-head">
        <h2>캘린더</h2>
        <button class="btn primary" data-act="event-add">+ 일정 추가</button>
      </div>
      ${highlight}
      <div class="cal-toolbar">
        <button class="icon-btn" data-act="cal-prev">‹</button>
        <strong>${year}년 ${month + 1}월</strong>
        <button class="icon-btn" data-act="cal-next">›</button>
        <button class="btn ghost sm" data-act="cal-today">오늘</button>
      </div>
      ${calendarGrid(year, month, events)}
    </section>`;
}

function highlightItem(e) {
  return `
    <div class="hl-item">
      <span class="hl-date">${UI.fmtDate(e.date)}</span>
      <span class="hl-title">${UI.esc(e.title)}</span>
      ${UI.memberChip(e.member_id)}
      <span class="hl-actions">
        <button class="btn xs ghost" data-act="event-edit" data-id="${e.id}">수정</button>
        <button class="btn xs danger" data-act="event-del" data-id="${e.id}">삭제</button>
      </span>
    </div>`;
}

function belongsToMonth(dateStr, y, m) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === y && d.getMonth() === m;
}

function calendarGrid(year, month, events) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = UI.todayInput();

  const wd = ["일", "월", "화", "수", "목", "금", "토"]
    .map((d, i) => `<div class="cal-wd ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${d}</div>`)
    .join("");

  let cells = "";
  for (let i = 0; i < startDay; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(
      2,
      "0"
    )}`;
    const dayEvents = events.filter((e) => e.date === ds);
    const evHtml = dayEvents
      .slice(0, 4)
      .map(
        (e) =>
          `<div class="cal-ev scope-${e.scope || "day"}" data-act="event-edit" data-id="${
            e.id
          }" title="${UI.esc(e.title)}">${UI.esc(e.title)}</div>`
      )
      .join("");
    const more =
      dayEvents.length > 4
        ? `<div class="cal-more">+${dayEvents.length - 4}</div>`
        : "";
    cells += `
      <div class="cal-cell ${ds === today ? "today" : ""}" data-act="event-add-on" data-date="${ds}">
        <div class="cal-daynum">${d}</div>
        ${evHtml}${more}
      </div>`;
  }

  return `<div class="cal-grid">${wd}${cells}</div>
    <div class="cal-legend">
      <span><i class="dot scope-day"></i>일반</span>
      <span><i class="dot scope-week"></i>주별</span>
      <span><i class="dot scope-month"></i>월별</span>
      <span class="muted">날짜 칸을 클릭하면 그 날짜로 일정 추가</span>
    </div>`;
}

async function eventForm(existing, presetDate) {
  const values = existing || {
    member_id: curUser(),
    scope: "day",
    date: presetDate || UI.todayInput(),
  };
  const res = await UI.formModal({
    title: existing ? "일정 수정" : "일정 추가",
    submitText: existing ? "수정" : "추가",
    values,
    fields: [
      { name: "title", label: "일정 제목", type: "text", required: true, full: true },
      { name: "date", label: "날짜", type: "date", required: true },
      {
        name: "scope",
        label: "구분",
        type: "select",
        options: [
          { value: "day", label: "일반 일정" },
          { value: "week", label: "주별 일정 (상단 강조)" },
          { value: "month", label: "월별 일정 (상단 강조)" },
        ],
      },
      {
        name: "member_id",
        label: "담당/작성자",
        type: "select",
        options: UI.memberOptions(false),
      },
      { name: "note", label: "메모", type: "textarea", full: true },
    ],
  });
  if (!res) return;
  if (existing) {
    await Store.update("events", existing.id, res);
    UI.toast("일정이 수정되었습니다");
  } else {
    await Store.add("events", res);
    UI.toast("일정이 추가되었습니다");
  }
}

/* ============ 데이터 보드 ============ */
function renderDataboard() {
  const tab = App.state.databoardTab;
  const tabs = [
    { id: "resources", label: "자료실", icon: "🖼️" },
    { id: "meetings", label: "미팅", icon: "🤝" },
    { id: "ideas", label: "아이디어 노트", icon: "💡" },
    { id: "links", label: "링크", icon: "🔗" },
  ];
  const sub = tabs
    .map(
      (t) =>
        `<button class="subtab ${tab === t.id ? "active" : ""}" data-act="db-tab" data-tab="${
          t.id
        }">${t.icon} ${t.label}</button>`
    )
    .join("");

  let body = "";
  if (tab === "resources") body = renderResources();
  else if (tab === "meetings") body = renderDBMeetings();
  else if (tab === "ideas") body = renderIdeas();
  else if (tab === "links") body = renderLinks();

  return `
    <section class="view">
      <div class="view-head"><h2>데이터 보드</h2></div>
      <div class="subtabs">${sub}</div>
      ${body}
    </section>`;
}

function renderResources() {
  const items = Store.list("resources").slice().reverse();
  const grid = items.length
    ? items
        .map((r) => {
          const media =
            r.kind === "image" && r.image_data
              ? `<div class="res-thumb"><img src="${UI.esc(r.image_data)}" alt=""></div>`
              : r.kind === "link"
              ? `<div class="res-thumb link"><a href="${UI.esc(
                  r.url
                )}" target="_blank" rel="noopener">🔗 ${UI.esc(r.url)}</a></div>`
              : `<div class="res-thumb file">📄 파일</div>`;
          return `
        <div class="card res-card">
          ${media}
          <div class="res-info">
            <strong>${UI.esc(r.title)}</strong>
            <div class="card-meta">${UI.memberChip(r.member_id)}<span class="muted">${UI.fmtDate(
            r.created_at
          )}</span></div>
          </div>
          <div class="card-actions">
            <button class="btn xs ghost" data-act="res-edit" data-id="${r.id}">수정</button>
            <button class="btn xs danger" data-act="res-del" data-id="${r.id}">삭제</button>
          </div>
        </div>`;
        })
        .join("")
    : `<div class="empty">아직 자료가 없습니다. 사진/이미지나 링크를 올려보세요.</div>`;

  return `
    <div class="sub-head">
      <p class="muted">사진·이미지·링크 등 팀 자료를 모아두는 공간입니다.</p>
      <button class="btn primary" data-act="res-add">+ 자료 올리기</button>
    </div>
    <div class="res-grid">${grid}</div>`;
}

async function resourceForm(existing) {
  const values = existing || { member_id: curUser(), kind: "image" };
  const res = await UI.formModal({
    title: existing ? "자료 수정" : "자료 올리기",
    submitText: existing ? "수정" : "올리기",
    values,
    fields: [
      { name: "title", label: "제목", type: "text", required: true, full: true },
      {
        name: "kind",
        label: "종류",
        type: "select",
        options: [
          { value: "image", label: "사진/이미지" },
          { value: "link", label: "링크" },
        ],
      },
      { name: "image_data", label: "이미지 (사진 선택)", type: "image", full: true },
      { name: "url", label: "링크 주소 (링크일 때)", type: "url", full: true },
      {
        name: "member_id",
        label: "올린 사람",
        type: "select",
        options: UI.memberOptions(false),
      },
    ],
  });
  if (!res) return;
  if (existing) {
    await Store.update("resources", existing.id, res);
    UI.toast("수정되었습니다");
  } else {
    await Store.add("resources", res);
    UI.toast("자료가 등록되었습니다");
  }
}

function renderDBMeetings() {
  const items = Store.list("meetings")
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const list = items.length
    ? items
        .map(
          (m) => `
        <div class="card">
          <div class="card-top"><strong>${UI.esc(m.title)}</strong><span class="muted">${UI.fmtDate(
            m.date
          )}</span></div>
          ${m.attendees ? `<div class="muted">참석: ${UI.esc(m.attendees)}</div>` : ""}
          ${m.body ? `<p class="card-desc">${UI.nl2br(m.body)}</p>` : ""}
          <div class="card-actions">
            <button class="btn xs ghost" data-act="meeting-edit" data-id="${m.id}">수정</button>
            <button class="btn xs danger" data-act="meeting-del" data-id="${m.id}">삭제</button>
          </div>
        </div>`
        )
        .join("")
    : `<div class="empty">미팅 기록이 없습니다.</div>`;
  return `
    <div class="sub-head">
      <p class="muted">간단한 미팅 기록입니다. 정식 회의록은 상단 '회의록' 탭에서 관리하세요. (같은 데이터)</p>
      <button class="btn primary" data-act="meeting-add">+ 미팅 추가</button>
    </div>
    <div class="list">${list}</div>`;
}

function renderIdeas() {
  const items = Store.list("ideas").slice().reverse();
  const grid = items.length
    ? items
        .map(
          (i) => `
        <div class="card idea-card">
          <div class="card-top"><strong>${UI.esc(i.title)}</strong>${UI.memberChip(
            i.member_id
          )}</div>
          ${i.body ? `<p class="card-desc">${UI.nl2br(i.body)}</p>` : ""}
          <div class="card-meta"><span class="muted">${UI.fmtDate(i.created_at)}</span></div>
          <div class="card-actions">
            <button class="btn xs ghost" data-act="idea-edit" data-id="${i.id}">수정</button>
            <button class="btn xs danger" data-act="idea-del" data-id="${i.id}">삭제</button>
          </div>
        </div>`
        )
        .join("")
    : `<div class="empty">아이디어가 없습니다. 자유롭게 메모해보세요.</div>`;
  return `
    <div class="sub-head">
      <p class="muted">떠오르는 아이디어를 자유롭게 기록하세요.</p>
      <button class="btn primary" data-act="idea-add">+ 아이디어 추가</button>
    </div>
    <div class="card-grid">${grid}</div>`;
}

function renderLinks() {
  const items = Store.list("links").slice().reverse();
  const list = items.length
    ? items
        .map(
          (l) => `
        <div class="card link-card">
          <div class="link-main">
            <strong>${UI.esc(l.title)}</strong>
            <a href="${UI.esc(l.url)}" target="_blank" rel="noopener">${UI.esc(l.url)}</a>
          </div>
          <div class="card-meta">${UI.memberChip(l.member_id)}</div>
          <div class="card-actions">
            <button class="btn xs ghost" data-act="link-edit" data-id="${l.id}">수정</button>
            <button class="btn xs danger" data-act="link-del" data-id="${l.id}">삭제</button>
          </div>
        </div>`
        )
        .join("")
    : `<div class="empty">저장된 링크가 없습니다.</div>`;
  return `
    <div class="sub-head">
      <p class="muted">자주 쓰는 링크를 모아두세요.</p>
      <button class="btn primary" data-act="link-add">+ 링크 추가</button>
    </div>
    <div class="list">${list}</div>`;
}

async function ideaForm(existing) {
  const values = existing || { member_id: curUser() };
  const res = await UI.formModal({
    title: existing ? "아이디어 수정" : "아이디어 추가",
    submitText: existing ? "수정" : "추가",
    values,
    fields: [
      { name: "title", label: "제목", type: "text", required: true, full: true },
      { name: "body", label: "내용", type: "textarea", rows: 5, full: true },
      {
        name: "member_id",
        label: "작성자",
        type: "select",
        options: UI.memberOptions(false),
      },
    ],
  });
  if (!res) return;
  if (existing) await Store.update("ideas", existing.id, res);
  else await Store.add("ideas", res);
  UI.toast("저장되었습니다");
}

async function linkForm(existing) {
  const values = existing || { member_id: curUser() };
  const res = await UI.formModal({
    title: existing ? "링크 수정" : "링크 추가",
    submitText: existing ? "수정" : "추가",
    values,
    fields: [
      { name: "title", label: "이름", type: "text", required: true, full: true },
      { name: "url", label: "링크 주소", type: "url", required: true, full: true },
      {
        name: "member_id",
        label: "등록자",
        type: "select",
        options: UI.memberOptions(false),
      },
    ],
  });
  if (!res) return;
  if (existing) await Store.update("links", existing.id, res);
  else await Store.add("links", res);
  UI.toast("저장되었습니다");
}

/* ============ 회의록 ============ */
function renderMinutes() {
  const items = Store.list("meetings")
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const list = items.length
    ? items
        .map(
          (m) => `
        <div class="card meeting-card">
          <div class="card-top">
            <strong>${UI.esc(m.title)}</strong>
            <span class="muted">${UI.fmtDate(m.date)}</span>
          </div>
          ${m.attendees ? `<div class="meeting-row"><b>참석자</b> ${UI.esc(m.attendees)}</div>` : ""}
          ${m.agenda ? `<div class="meeting-row"><b>안건</b><div>${UI.nl2br(m.agenda)}</div></div>` : ""}
          ${m.body ? `<div class="meeting-row"><b>내용</b><div>${UI.nl2br(m.body)}</div></div>` : ""}
          <div class="card-meta">작성: ${UI.memberChip(m.member_id)}</div>
          <div class="card-actions">
            <button class="btn xs ghost" data-act="meeting-edit" data-id="${m.id}">수정</button>
            <button class="btn xs danger" data-act="meeting-del" data-id="${m.id}">삭제</button>
          </div>
        </div>`
        )
        .join("")
    : `<div class="empty">작성된 회의록이 없습니다.</div>`;
  return `
    <section class="view">
      <div class="view-head">
        <h2>회의록</h2>
        <button class="btn primary" data-act="meeting-add">+ 회의록 작성</button>
      </div>
      <div class="list">${list}</div>
    </section>`;
}

async function meetingForm(existing) {
  const values = existing || {
    member_id: curUser(),
    date: UI.todayInput(),
    attendees: Store.list("members")
      .map((m) => m.name)
      .join(", "),
  };
  const res = await UI.formModal({
    title: existing ? "회의록 수정" : "회의록 작성",
    submitText: existing ? "수정" : "저장",
    values,
    fields: [
      { name: "title", label: "회의 제목", type: "text", required: true, full: true },
      { name: "date", label: "날짜", type: "date", required: true },
      {
        name: "member_id",
        label: "작성자",
        type: "select",
        options: UI.memberOptions(false),
      },
      { name: "attendees", label: "참석자", type: "text", full: true },
      { name: "agenda", label: "안건", type: "textarea", rows: 3, full: true },
      { name: "body", label: "회의 내용 / 결정사항", type: "textarea", rows: 6, full: true },
    ],
  });
  if (!res) return;
  if (existing) await Store.update("meetings", existing.id, res);
  else await Store.add("meetings", res);
  UI.toast("회의록이 저장되었습니다");
}

/* ============ KPT 회고 ============ */
function renderKPT() {
  const mineOnly = App.state.kptMineOnly;
  let items = Store.list("retros")
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (mineOnly && curUser()) items = items.filter((r) => r.member_id === curUser());

  const cards = items.length
    ? items
        .map(
          (r) => `
        <div class="card kpt-card">
          <div class="card-top">
            <span>${UI.memberChip(r.member_id)} <span class="muted">${UI.fmtDate(
            r.date
          )}</span></span>
          </div>
          <div class="kpt-grid">
            <div class="kpt-box keep"><h5>👍 Keep (유지할 것)</h5><div>${UI.nl2br(
              r.keep
            )}</div></div>
            <div class="kpt-box problem"><h5>⚠️ Problem (문제점)</h5><div>${UI.nl2br(
              r.problem
            )}</div></div>
            <div class="kpt-box try"><h5>🚀 Try (개선점)</h5><div>${UI.nl2br(
              r.try_
            )}</div></div>
          </div>
          <div class="card-actions">
            <button class="btn xs ghost" data-act="kpt-edit" data-id="${r.id}">수정</button>
            <button class="btn xs danger" data-act="kpt-del" data-id="${r.id}">삭제</button>
          </div>
        </div>`
        )
        .join("")
    : `<div class="empty">${
        mineOnly ? "내가 작성한 회고가 없습니다." : "작성된 회고가 없습니다."
      }</div>`;

  return `
    <section class="view">
      <div class="view-head">
        <h2>KPT 회고</h2>
        <button class="btn primary" data-act="kpt-add">+ 회고 작성</button>
      </div>
      <div class="filter-bar">
        <label class="checkbox">
          <input type="checkbox" id="kptMine" ${mineOnly ? "checked" : ""}>
          내가 쓴 회고만 보기
        </label>
        <span class="muted">유지할 것(Keep) · 문제점(Problem) · 개선점(Try) 을 적는 회고법입니다.</span>
      </div>
      <div class="list">${cards}</div>
    </section>`;
}

async function kptForm(existing) {
  const values = existing
    ? { ...existing, try_: existing.try_ }
    : { member_id: curUser(), date: UI.todayInput() };
  const res = await UI.formModal({
    title: existing ? "회고 수정" : "KPT 회고 작성",
    submitText: existing ? "수정" : "저장",
    values,
    fields: [
      {
        name: "member_id",
        label: "작성자",
        type: "select",
        options: UI.memberOptions(false),
      },
      { name: "date", label: "날짜", type: "date", required: true },
      { name: "keep", label: "👍 Keep — 유지할 것", type: "textarea", full: true },
      { name: "problem", label: "⚠️ Problem — 문제점", type: "textarea", full: true },
      { name: "try_", label: "🚀 Try — 개선점", type: "textarea", full: true },
    ],
  });
  if (!res) return;
  if (existing) await Store.update("retros", existing.id, res);
  else await Store.add("retros", res);
  UI.toast("회고가 저장되었습니다");
}

/* ============ 일일 보고서 ============ */
function renderReports() {
  const items = Store.list("reports")
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const cards = items.length
    ? items
        .map(
          (r) => `
        <div class="card report-card">
          <div class="card-top">
            <strong>${UI.fmtDate(r.date)} 일일 보고</strong>
            ${UI.memberChip(r.member_id)}
          </div>
          ${r.done ? `<div class="report-row"><b>오늘 한 일</b><div>${UI.nl2br(r.done)}</div></div>` : ""}
          ${r.todo ? `<div class="report-row"><b>내일 할 일</b><div>${UI.nl2br(r.todo)}</div></div>` : ""}
          ${r.note ? `<div class="report-row"><b>특이사항</b><div>${UI.nl2br(r.note)}</div></div>` : ""}
          <div class="card-actions">
            <button class="btn xs ghost" data-act="report-copy" data-id="${r.id}">📋 복사</button>
            <button class="btn xs ghost" data-act="report-edit" data-id="${r.id}">수정</button>
            <button class="btn xs danger" data-act="report-del" data-id="${r.id}">삭제</button>
          </div>
        </div>`
        )
        .join("")
    : `<div class="empty">작성된 보고서가 없습니다.</div>`;

  return `
    <section class="view">
      <div class="view-head">
        <h2>일일 보고서</h2>
        <div class="head-btns">
          <button class="btn ghost" data-act="report-auto">⚡ 오늘 활동으로 자동생성</button>
          <button class="btn primary" data-act="report-add">+ 보고서 작성</button>
        </div>
      </div>
      <p class="muted">하루 동안 한 일을 보고서 형태로 기록하고 공유하세요. '자동생성'은 오늘 완료한 할일과 작성한 기록을 모아 초안을 만듭니다.</p>
      <div class="list">${cards}</div>
    </section>`;
}

function buildAutoReportDraft() {
  const today = UI.todayInput();
  const me = curUser();
  const doneTasks = Store.list("tasks").filter(
    (t) =>
      t.status === "done" &&
      (!me || t.assignee_id === me) &&
      (t.updated_at || t.created_at || "").slice(0, 10) === today
  );
  const todoTasks = Store.list("tasks").filter(
    (t) => t.status !== "done" && (!me || t.assignee_id === me)
  );
  const meetingsToday = Store.list("meetings").filter((m) => m.date === today);

  const doneLines = [];
  doneTasks.forEach((t) => doneLines.push("- " + t.title));
  meetingsToday.forEach((m) => doneLines.push("- (회의) " + m.title));

  const todoLines = todoTasks.slice(0, 10).map((t) => "- " + t.title);

  return {
    member_id: me,
    date: today,
    done: doneLines.join("\n"),
    todo: todoLines.join("\n"),
    note: "",
  };
}

async function reportForm(existing, preset) {
  const values = existing || preset || { member_id: curUser(), date: UI.todayInput() };
  const res = await UI.formModal({
    title: existing ? "보고서 수정" : "일일 보고서 작성",
    submitText: existing ? "수정" : "저장",
    values,
    fields: [
      {
        name: "member_id",
        label: "작성자",
        type: "select",
        options: UI.memberOptions(false),
      },
      { name: "date", label: "날짜", type: "date", required: true },
      { name: "done", label: "오늘 한 일", type: "textarea", rows: 5, full: true },
      { name: "todo", label: "내일 할 일", type: "textarea", rows: 4, full: true },
      { name: "note", label: "특이사항 / 공유사항", type: "textarea", rows: 3, full: true },
    ],
  });
  if (!res) return;
  if (existing) await Store.update("reports", existing.id, res);
  else await Store.add("reports", res);
  UI.toast("보고서가 저장되었습니다");
}

function reportToText(r) {
  return (
    `[일일 업무 보고] ${UI.fmtDate(r.date)} / ${UI.memberName(r.member_id)}\n\n` +
    `■ 오늘 한 일\n${r.done || "-"}\n\n` +
    `■ 내일 할 일\n${r.todo || "-"}\n\n` +
    `■ 특이사항\n${r.note || "-"}`
  );
}

/* ============ 멤버 관리 ============ */
function renderMembers() {
  const members = Store.list("members");
  const cur = curUser();
  const list = members.length
    ? members
        .map(
          (m) => `
        <div class="card member-card">
          <span class="member-dot" style="background:${UI.esc(m.color)}"></span>
          <strong>${UI.esc(m.name)}</strong>
          ${m.id === cur ? `<span class="chip chip-me">나</span>` : ""}
          <div class="card-actions">
            <button class="btn xs ghost" data-act="member-edit" data-id="${m.id}">수정</button>
            <button class="btn xs danger" data-act="member-del" data-id="${m.id}">삭제</button>
          </div>
        </div>`
        )
        .join("")
    : `<div class="empty">등록된 멤버가 없습니다. 팀원 이름을 등록하세요.</div>`;
  return `
    <section class="view">
      <div class="view-head">
        <h2>멤버 관리</h2>
        <button class="btn primary" data-act="member-add">+ 멤버 등록</button>
      </div>
      <p class="muted">팀원 이름을 등록하면 담당자 지정, 작성자 표시, KPT 회고 필터 등에 사용됩니다.</p>
      <div class="member-list">${list}</div>
    </section>`;
}

async function memberForm(existing) {
  const used = Store.list("members").map((m) => m.color);
  const defaultColor =
    MEMBER_COLORS.find((c) => !used.includes(c)) ||
    MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];
  const values = existing || { color: defaultColor };
  const res = await UI.formModal({
    title: existing ? "멤버 수정" : "멤버 등록",
    submitText: existing ? "수정" : "등록",
    values,
    fields: [
      { name: "name", label: "이름", type: "text", required: true, full: true },
      {
        name: "color",
        label: "색상",
        type: "select",
        options: MEMBER_COLORS.map((c) => ({ value: c, label: c })),
      },
    ],
  });
  if (!res) return;
  if (existing) {
    await Store.update("members", existing.id, res);
    UI.toast("멤버 정보가 수정되었습니다");
  } else {
    const m = await Store.add("members", res);
    if (!curUser()) Store.setCurrentUserId(m.id);
    UI.toast("멤버가 등록되었습니다");
  }
}

/* ============ 데이터 백업/복원 메뉴 ============ */
async function openDataMenu() {
  const modeMsg =
    Store.mode === "cloud"
      ? "현재 실시간 공유(Supabase) 모드입니다. 모든 팀원이 같은 데이터를 봅니다."
      : "현재 로컬 모드입니다. 데이터는 이 브라우저에만 저장됩니다. 아래 내보내기로 백업하거나 팀원에게 전달할 수 있습니다.";
  const res = await UI.formModal({
    title: "데이터 백업 / 복원",
    submitText: "JSON 가져오기(병합)",
    fields: [
      { name: "info", label: "모드", type: "static", value: modeMsg },
      {
        name: "export",
        label: "백업 내보내기",
        type: "static",
        full: true,
        html: `<button type="button" class="btn ghost sm" data-act="backup-download">⬇ JSON 파일로 내보내기</button>`,
      },
      {
        name: "import",
        label: "JSON 붙여넣기 → 가져오기",
        type: "textarea",
        rows: 6,
        full: true,
        placeholder: "내보낸 JSON 내용을 여기에 붙여넣고 저장을 누르세요",
      },
    ],
  });
  if (res && res.import) {
    try {
      await Store.importJSON(res.import);
      UI.toast("가져오기 완료");
    } catch (e) {
      UI.toast("JSON 형식이 올바르지 않습니다", "warn");
    }
  }
}

function downloadBackup() {
  const blob = new Blob([Store.exportJSON()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `업무공유_백업_${UI.todayInput()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ============ 라우팅 / 렌더 ============ */
function render() {
  const root = document.getElementById("app");
  let view = "";
  switch (App.route) {
    case "home": view = renderHome(); break;
    case "dashboard": view = renderDashboard(); break;
    case "goals": view = renderGoals(); break;
    case "calendar": view = renderCalendar(); break;
    case "databoard": view = renderDataboard(); break;
    case "minutes": view = renderMinutes(); break;
    case "kpt": view = renderKPT(); break;
    case "reports": view = renderReports(); break;
    case "members": view = renderMembers(); break;
    default: view = renderHome();
  }
  root.innerHTML = `
    ${renderHeader()}
    ${renderNav()}
    <main class="app-main">${view}</main>
    <footer class="app-footer">업무 공유 · ${
      Store.mode === "cloud" ? "실시간 공유 모드" : "로컬 모드"
    }</footer>`;
}

/* ============ 이벤트 위임 ============ */
async function handleAction(act, el) {
  const id = el.getAttribute("data-id");
  const find = (coll) => Store.list(coll).find((x) => x.id === id);

  switch (act) {
    // 할일
    case "task-filter":
      App.state.taskMember = el.getAttribute("data-member");
      render();
      return;
    case "task-add": return taskForm();
    case "task-edit": return taskForm(find("tasks"));
    case "task-move": {
      const t = find("tasks");
      if (t) await Store.update("tasks", id, { status: el.getAttribute("data-to") });
      return;
    }
    case "task-del":
      if (await UI.confirmBox("이 할 일을 삭제할까요?")) await Store.remove("tasks", id);
      return;

    // 업무 목표
    case "goal-view":
      App.state.goalView = el.getAttribute("data-view");
      render();
      return;
    case "goal-add": return goalForm();
    case "goal-edit": return goalForm(find("goals"));
    case "goal-del":
      if (await UI.confirmBox("이 목표를 삭제할까요?")) await Store.remove("goals", id);
      return;

    // 캘린더
    case "event-add": return eventForm();
    case "event-add-on": return eventForm(null, el.getAttribute("data-date"));
    case "event-edit": return eventForm(find("events"));
    case "event-del":
      if (await UI.confirmBox("이 일정을 삭제할까요?")) await Store.remove("events", id);
      return;
    case "cal-prev":
      App.state.calendarRef = new Date(
        App.state.calendarRef.getFullYear(),
        App.state.calendarRef.getMonth() - 1,
        1
      );
      render();
      return;
    case "cal-next":
      App.state.calendarRef = new Date(
        App.state.calendarRef.getFullYear(),
        App.state.calendarRef.getMonth() + 1,
        1
      );
      render();
      return;
    case "cal-today":
      App.state.calendarRef = new Date();
      render();
      return;

    // 데이터 보드
    case "db-tab":
      App.state.databoardTab = el.getAttribute("data-tab");
      render();
      return;
    case "res-add": return resourceForm();
    case "res-edit": return resourceForm(find("resources"));
    case "res-del":
      if (await UI.confirmBox("이 자료를 삭제할까요?")) await Store.remove("resources", id);
      return;
    case "idea-add": return ideaForm();
    case "idea-edit": return ideaForm(find("ideas"));
    case "idea-del":
      if (await UI.confirmBox("이 아이디어를 삭제할까요?")) await Store.remove("ideas", id);
      return;
    case "link-add": return linkForm();
    case "link-edit": return linkForm(find("links"));
    case "link-del":
      if (await UI.confirmBox("이 링크를 삭제할까요?")) await Store.remove("links", id);
      return;

    // 회의록 / 미팅 (공용)
    case "meeting-add": return meetingForm();
    case "meeting-edit": return meetingForm(find("meetings"));
    case "meeting-del":
      if (await UI.confirmBox("이 기록을 삭제할까요?")) await Store.remove("meetings", id);
      return;

    // KPT
    case "kpt-add": return kptForm();
    case "kpt-edit": return kptForm(find("retros"));
    case "kpt-del":
      if (await UI.confirmBox("이 회고를 삭제할까요?")) await Store.remove("retros", id);
      return;

    // 보고서
    case "report-add": return reportForm();
    case "report-auto": return reportForm(null, buildAutoReportDraft());
    case "report-edit": return reportForm(find("reports"));
    case "report-del":
      if (await UI.confirmBox("이 보고서를 삭제할까요?")) await Store.remove("reports", id);
      return;
    case "report-copy": {
      const r = find("reports");
      if (r) {
        try {
          await navigator.clipboard.writeText(reportToText(r));
          UI.toast("보고서가 복사되었습니다");
        } catch (e) {
          UI.toast("복사 권한이 없습니다", "warn");
        }
      }
      return;
    }

    // 멤버
    case "member-add": return memberForm();
    case "member-edit": return memberForm(find("members"));
    case "member-del":
      if (await UI.confirmBox("이 멤버를 삭제할까요?")) {
        await Store.remove("members", id);
        if (curUser() === id) Store.setCurrentUserId("");
      }
      return;

    // 백업
    case "backup-download":
      downloadBackup();
      UI.toast("백업 파일을 내려받았습니다");
      return;
  }
}

function bindGlobalEvents() {
  // 액션 버튼 위임
  document.body.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (el) {
      e.preventDefault();
      handleAction(el.getAttribute("data-act"), el);
      return;
    }
    if (e.target.id === "addMemberQuick") memberForm();
    if (e.target.id === "dataMenuBtn") openDataMenu();
  });

  // 사용자 선택 / KPT 필터 (change)
  document.body.addEventListener("change", (e) => {
    if (e.target.id === "userSelect") {
      Store.setCurrentUserId(e.target.value);
      UI.toast(
        e.target.value ? UI.memberName(e.target.value) + " 님으로 설정" : "이름 해제"
      );
    }
    if (e.target.id === "kptMine") {
      App.state.kptMineOnly = e.target.checked;
      render();
    }
  });

  // 해시 라우팅
  window.addEventListener("hashchange", () => {
    App.route = location.hash.replace("#", "") || "dashboard";
    render();
  });

  // Store 변경 시 재렌더 (단, 모달 열려있으면 보류)
  Store.subscribe(() => {
    if (!document.querySelector(".modal-overlay")) render();
  });
}

/* ============ 시작 ============ */
(async function start() {
  await Store.ready;
  bindGlobalEvents();
  render();
})();
