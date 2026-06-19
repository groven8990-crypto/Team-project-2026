/* 업무 공유 - 메인 앱 (라우터 + 화면) */

const NAV = [
  { id: "home", label: "홈", icon: "🏠" },
  { id: "dashboard", label: "할일 대시보드", icon: "🗂️" },
  { id: "goals", label: "업무 목표", icon: "🎯" },
  { id: "docs", label: "업무 문서", icon: "📄" },
  { id: "calendar", label: "캘린더", icon: "📅" },
  { id: "payments", label: "결제 일정", icon: "💰" },
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
// 'paused'(잠깐 멈춤)는 칸반 별도 컬럼은 아니고 진행 중 칸에 멈춤 배지로 표시
const STATUS_LABEL = { todo: "할 일", doing: "진행 중", paused: "⏸ 멈춤", done: "완료" };
function taskStatusLabel(status) {
  return STATUS_LABEL[status] || "할 일";
}

const GOAL_STATUS = [
  { key: "planned", label: "예정", color: "#94a3b8" },
  { key: "doing", label: "진행 중", color: "#3b82f6" },
  { key: "done", label: "완료", color: "#16a34a" },
  { key: "hold", label: "보류", color: "#f59e0b" },
];
const GRADES = ["미평가", "S", "A", "B", "C"];
/* 휴무/부재 구분 (캘린더 일정에 설정 → 일일보고 자동 기입) */
const LEAVE_TYPES = ["연차", "오전반차", "오후반차", "병가", "외근", "교육", "출장"];

/* 발주처(업체) 계좌·결제조건 마스터 (업로드 엑셀 기준 2026-06-17) */
const VENDORS = [
  { name: "공덕농협", bank: "농협", account: "351-0852-6200-13", holder: "공덕농협농산물가공사업소", terms: "즉시결제", proof: "세금계산서" },
  { name: "㈜렉스팜", bank: "하나", account: "128-910026-24404", holder: "㈜렉스팜", terms: "즉시결제", proof: "세금계산서" },
  { name: "충남마른김가공수산업협동조합", bank: "농협", account: "301-02031-2984-21", holder: "충남마른김가공수산업협동조합", terms: "즉시결제", proof: "세금계산서" },
  { name: "생선상록", bank: "농협", account: "301-0330-4278-51", holder: "생선상록(구인자)", terms: "즉시결제", proof: "계산서" },
  { name: "비셀러", bank: "기업은행", account: "05000-13379-7381", holder: "나은인터내셔널", terms: "즉시결제", proof: "현금영수증" },
  { name: "㈜푸드엔드베스트", bank: "농협", account: "707016-55-000088", holder: "㈜푸드엔드베스트", terms: "주결제", proof: "계산서", payDow: 1 },
  { name: "일해수산", bank: "농협", account: "302-0984-6683-31", holder: "한상철(일해수산)", terms: "주결제", proof: "계산서", payDow: 5 },
  { name: "거풍푸드", bank: "광주", account: "1107-021-507090", holder: "거풍푸드", terms: "주결제", proof: "계산서", payDow: 5 },
  { name: "최고집", bank: "농협", account: "301-0347-7156-01", holder: "농업회사법인㈜디자인", terms: "선급", proof: "계산서" },
  { name: "도매꽃이머니충전", bank: "국민", account: "401390-13-683328", holder: "도매꽃이머니충전", terms: "선급", proof: "현금영수증" },
  { name: "눈푸른우리", bank: "카카오", account: "3333-3133-01762", holder: "김귀현(눈푸른우리)", terms: "선급", proof: "계산서" },
  { name: "십일번가(주)", bank: "기업은행", account: "593-00324-197778", holder: "십일번가(주)", terms: "선급", proof: "세금계산서" },
  { name: "한미당식품(다모아식품)", bank: "하나은행", account: "646-910094-04705", holder: "박미숙", terms: "15일결제", proof: "세금계산서" },
  { name: "일비", bank: "신협", account: "131-021-728087", holder: "주식회사 일비", terms: "15일결제", proof: "계산서" },
  { name: "해담별", bank: "기업은행", account: "052-120877-04-015", holder: "주식회사 해담별", terms: "15일결제", proof: "계산서" },
  { name: "남부파머스", bank: "농협은행", account: "301-2021-0226-31", holder: "농업회사법인 남부파머스", terms: "당월말결제", proof: "계산서" },
  { name: "동일", bank: "농협은행", account: "355-0022-2153-53", holder: "농업회사법인 주식회사 동일", terms: "익일결제", proof: "계산서" },
];
const VENDOR_TERM_ORDER = ["즉시결제", "주결제", "선급", "15일결제", "당월말결제", "익일결제"];
/* 업체 목록은 docs에 JSON으로 저장(팀 공유). 없으면 하드코딩 기본값 사용 */
const VENDOR_DOC_TITLE = "__vendor_master__";
function getVendors() {
  const rec = Store.list("docs").find((d) => d.title === VENDOR_DOC_TITLE);
  if (rec && rec.body) {
    try {
      const arr = JSON.parse(rec.body);
      if (Array.isArray(arr)) return arr;
    } catch (e) {}
  }
  return VENDORS;
}
async function saveVendors(list) {
  const rec = Store.list("docs").find((d) => d.title === VENDOR_DOC_TITLE);
  const body = JSON.stringify(list);
  if (rec) await Store.update("docs", rec.id, { body });
  else
    await Store.add("docs", {
      title: VENDOR_DOC_TITLE,
      category: "__system__",
      body,
      is_template: false,
    });
}
/* 결제조건 → 반복 주기 */
function termToRecur(terms) {
  if (terms === "주결제") return "weekly";
  if (terms === "15일결제" || terms === "당월말결제") return "monthly";
  return "once";
}

/* 대한민국 공휴일 (대체공휴일·임시공휴일 포함). 음력 기반 날짜는 연도별로 직접 기재 */
const HOLIDAYS = {
  // 2025
  "2025-01-01": "신정",
  "2025-01-27": "임시공휴일",
  "2025-01-28": "설날 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날 연휴",
  "2025-03-01": "삼일절",
  "2025-03-03": "대체공휴일",
  "2025-05-05": "어린이날·부처님오신날",
  "2025-05-06": "대체공휴일",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2025-10-08": "대체공휴일",
  "2025-10-09": "한글날",
  "2025-12-25": "성탄절",
  // 2026
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  // 2027
  "2027-01-01": "신정",
  "2027-02-06": "설날 연휴",
  "2027-02-07": "설날",
  "2027-02-08": "설날 연휴",
  "2027-02-09": "대체공휴일",
  "2027-03-01": "삼일절",
  "2027-05-05": "어린이날",
  "2027-05-13": "부처님오신날",
  "2027-06-06": "현충일",
  "2027-08-15": "광복절",
  "2027-08-16": "대체공휴일",
  "2027-09-14": "추석 연휴",
  "2027-09-15": "추석",
  "2027-09-16": "추석 연휴",
  "2027-10-03": "개천절",
  "2027-10-04": "대체공휴일",
  "2027-10-09": "한글날",
  "2027-10-11": "대체공휴일",
  "2027-12-25": "성탄절",
  "2027-12-27": "대체공휴일",
};
function holidayName(ds) {
  return HOLIDAYS[ds] || null;
}

/* 보고서 종류별 라벨 (주간/월간은 '계획' 중심) */
const REPORT_META = {
  daily: {
    title: "일일 업무 보고서",
    periodLabel: "작성일",
    s1: "오늘 한 일",
    s2: "내일 할 일",
    s3: "특이사항 / 공유사항",
    progressLabel: "진행률",
  },
  weekly: {
    title: "주간 업무 계획 보고서",
    periodLabel: "기간",
    s1: "이번 주 계획 / 목표",
    s2: "주요 추진 업무 · 일정",
    s3: "비고 / 특이사항",
    progressLabel: "주간 목표 진행률",
  },
  monthly: {
    title: "월간 업무 계획 보고서",
    periodLabel: "기간",
    s1: "이달 계획 / 목표",
    s2: "주요 추진 업무 · 일정",
    s3: "비고 / 특이사항",
    progressLabel: "월간 목표 진행률",
  },
};
function reportMeta(r) {
  return REPORT_META[r && r.kind] || REPORT_META.daily;
}
function isDailyReport(r) {
  return !r.kind || r.kind === "daily";
}

/* 페이지별 사용법 (하단 안내) */
const HELP = {
  home: {
    title: "홈 사용법",
    items: [
      "팀 업무 현황을 한눈에 모아 보는 대시보드예요. 할 일·일정·보고서 현황이 카드로 표시돼요.",
      "상단 버튼(+ 할 일 추가 / + 일정 추가 / + 오늘 보고)으로 자주 쓰는 항목을 바로 추가할 수 있어요.",
      "각 카드의 '더보기 ›'를 누르면 해당 탭으로 이동해요.",
      "우측 상단에서 본인 이름을 선택하면 보고서·회고·일정 작성 시 작성자가 자동으로 지정돼요.",
      "화면 우측 하단의 💬 버튼을 누르면 AI 내장 비서가 열려요. 할 일·일정·보고서 등을 텍스트로 검색할 수 있어요.",
    ],
  },
  dashboard: {
    title: "할일 대시보드 사용법",
    items: [
      "'+ 할 일 추가'로 업무를 등록하고, 담당자·마감일·진행률을 함께 지정해요.",
      "상단 필터 칩(전체 / 내 할일 / 팀원 이름)으로 특정 사람의 업무만 골라서 볼 수 있어요.",
      "【사람별 보기】 팀원마다 '할 일 → 진행 중 → 완료' 업무가 한 화면에 모여요.",
      "  · 업무 제목을 클릭하면 상세 내용 팝업이 열려요 (설명·마감일·진행률 확인).",
      "  · 진행률 슬라이더를 움직이면 값이 즉시 저장되고, 1% 이상이면 자동으로 '진행 중'으로 변경돼요.",
      "  · 100%로 올리면 자동으로 '완료' 처리되고 완료 날짜가 기록돼요.",
      "  · 완료된 업무는 당일 이후에는 '완료 ▼' 접힌 섹션 안에 숨겨져요. 클릭하면 펼칠 수 있어요.",
      "  · 어제 이전에 완료한 일은 '🗂️ 지난 완료한 일 ▼'을 눌러 따로 모아볼 수 있어요.",
      "【전체 보기】 할 일 / 진행 중 / 완료 3단 칸반 레이아웃이에요.",
      "  · 카드의 ▶ 버튼으로 '진행 중'으로, ✓ 버튼으로 '완료'로 상태를 바꿔요.",
      "  · 진행 중인 업무는 '⏸ 멈춤'으로 잠깐 멈췄다가, '▶ 재개'로 다시 진행할 수 있어요(진행률은 그대로 유지). 멈춤 업무는 진행 중 칸에 ⏸ 배지로 표시돼요.",
      "  · 완료 칸 맨 아래 '🗂️ 지난 완료한 일 ▼'으로 예전에 끝낸 업무도 다시 볼 수 있어요.",
      "우측 상단 '📌 내 할일'을 누르면 내 할일 목록이 작은 창으로 떠서 어느 페이지에서나 따라다녀요. 드래그로 옮기고, 🗗 버튼으로 새 창에 띄우면 작업표시줄에서 최소화했다가 다시 띄울 수 있어요.",
    ],
  },
  goals: {
    title: "업무 목표 사용법",
    items: [
      "연간·분기별 중점 과제와 평가지표를 한곳에서 관리해요.",
      "【테이블 보기】와 【상태별 보기(보드)】를 상단 버튼으로 토글할 수 있어요.",
      "비중(%)을 입력하면 비중 막대로 시각화되고, 진행률(%)은 진행률 막대로 표시돼요.",
      "평가등급은 미평가 / S / A / B / C 중에서 고를 수 있어요.",
      "상태는 예정 / 진행 중 / 완료 / 보류로 구분하고, 상태별 보기에서는 칸별로 묶여 보여요.",
      "연도 필터로 작년·올해·내년 목표를 따로 볼 수 있어요.",
    ],
  },
  docs: {
    title: "업무 문서(SOP) 사용법",
    items: [
      "업무 표준(SOP)·매뉴얼·공지사항을 카테고리별로 정리하는 문서함이에요.",
      "왼쪽 목록에서 카테고리를 누르면 폴더처럼 펼쳐지고, 문서 제목을 누르면 내용이 바로 열려요.",
      "상단 검색창으로 제목·내용 키워드로 빠르게 문서를 찾을 수 있어요.",
      "'⭐ 양식으로 만들기'를 누르면 SOP 기본 틀을 불러와 빠르게 작성할 수 있어요.",
      "'📑 복제'로 기존 문서를 복사해 비슷한 양식을 여러 개 만들 수 있어요.",
      "내용 작성 시 간단한 서식을 지원해요: # 큰 제목 / ## 중간 제목 / - 항목 목록 / **굵게** / `코드`",
    ],
  },
  calendar: {
    title: "캘린더 사용법",
    items: [
      "달력의 날짜 칸을 클릭하면 그 날의 일정을 잘림 없이 모아 볼 수 있는 창이 열려요. 거기서 바로 일정 추가·수정·삭제도 가능해요.",
      "달력 위에는 '월별 일정 · 이번 주 일정'이 나란히, 그 아래에 '오늘의 일정'이 한 줄로 펼쳐져 한눈에 보여요.",
      "【여러 날 일정】 시작일과 종료일을 모두 입력하면 달력에서 날짜 범위로 표시돼요.",
      "【구분 설정】 '주별'로 등록하면 달력 위 주별 일정 영역에, '월별'로 등록하면 월별 일정 영역에 표시돼요.",
      "  · '주별+월별' 둘 다 체크하면 양쪽에 모두 나타나요.",
      "  · 주별 일정 영역은 현재 주(이번 주)에 해당하는 일정만 강조되어 표시돼요.",
      "【참여자 지정】 일정 등록 시 '참여자 검색'에 이름을 입력해 팀원을 추가할 수 있어요.",
      "  · 주별 일정 카드에는 참여자의 성(姓)이 색상 원으로 표시돼요.",
      "  · 참여자가 많으면 '+N명' 형식으로 줄여서 보여요.",
      "토요일은 파란색, 일요일·공휴일은 빨간색으로 표시돼요. 대한민국 공휴일은 날짜 칸에 이름이 함께 나와요.",
      "【연차·휴무】 일정 추가 시 '휴무/부재 구분'에서 연차·반차·병가·외근 등을 고르고 대상자를 '참여자'에 넣으면, 그 날 일일보고 자동생성 시 '오늘 한 일'에 [연차]처럼 자동으로 들어가고 날짜별 취합에도 표시돼요.",
      "‹ › 화살표로 한 달씩, « » 화살표로 한 해씩 이동할 수 있어요. '오늘'을 누르면 이번 달로 돌아와요.",
    ],
  },
  payments: {
    title: "결제 일정 사용법",
    items: [
      "업체 결제조건이 달력에 자동으로 떠요 — 주결제는 '주 결제일'(매주), 15일결제는 '정산서 전달일'(매월 15일·말일 두 번), 당월말결제는 '결제일'(말일)로 표시돼요.",
      "즉시·익일·선급처럼 주문마다 결제하는 업체는 고정일이 없어, 달력 아래 '🧾 건별 결제 업체' 참고 카드로 모아 보여줘요.",
      "'+ 결제 건 추가'로 개별 결제(금액 포함)도 등록할 수 있어요. 반복 주기·결제일·세부 내역을 넣어요.",
      "【반복】 '매주'로 하면 기준일의 요일마다, '매월'로 하면 기준일의 날짜마다 자동으로 반복 표시돼요. 한 번만 결제면 '한 번만'을 고르세요. (주결제 업체는 매주 그 요일에 자동으로 떠요!)",
      "달력에 날짜별 결제 합계(💰)가 보이고, 날짜 칸을 클릭하면 그 날짜로 결제를 바로 추가할 수 있어요.",
      "【일별 보기】 결제 발생 날짜별로, 【업체별 보기】 업체별로 묶어 합계·건수를 보여줘요(반복 결제는 그 달에 발생하는 만큼 펼쳐서 합산돼요).",
      "등록한 결제는 메인 캘린더에도 💰 업체·금액으로 함께 표시돼요. 결제일/주기를 바꾸려면 '수정'에서 고치면 일정이 그에 맞게 조절돼요.",
    ],
  },
  databoard: {
    title: "데이터 보드 사용법",
    items: [
      "【자료실】 팀이 함께 쓰는 이미지와 링크를 올려두는 공간이에요.",
      "  · 이미지는 파일을 직접 업로드할 수 있어요 (로컬 모드에서는 3MB 이하 권장).",
      "  · 올린 이미지를 클릭하면 크게 볼 수 있고, '⬇ 저장'으로 내 기기에 내려받을 수 있어요.",
      "  · 링크(URL)도 제목과 함께 저장해 바로 클릭해 열 수 있어요.",
      "【아이디어 노트】 회의 중 떠오른 아이디어나 메모를 자유롭게 기록해요.",
      "【링크 모음】 자주 방문하는 사이트·참고 문서를 모아두는 북마크예요.",
      "각 항목 우측의 '삭제' 버튼으로 언제든지 제거할 수 있어요.",
    ],
  },
  minutes: {
    title: "회의록 사용법",
    items: [
      "'+ 회의록 작성'으로 회의 구분·일시·장소·참석자·비고를 기록해요.",
      "【안건 및 결과 표】 안건마다 담당자·기한·완료 여부를 행으로 추가할 수 있어요. '+ 행 추가'로 늘려요.",
      "  · '📋 텍스트로 붙여넣기'를 누르고 액션아이템을 한 줄에 하나씩 붙여넣으면 자동으로 표 행이 만들어져요. 탭이나 | 로 칸을 나누면 담당·기한도 함께 인식돼요(예: 홍보물 리스트 수령 | 김수영 | 2026-06-20). 기한은 '오늘·내일·금주' 같은 말도 날짜로 바꿔줘요.",
      "  · 텍스트가 없고 사진(캡처)만 있으면 '🖼️ 사진에서 가져오기'로 글자를 읽어올 수 있어요. 인식한 글자를 붙여넣기 칸에서 다듬어(칸은 | 로 구분) '표로 변환'하세요. (한글 표 인식은 완벽하지 않아 일부 수정이 필요할 수 있어요)",
      "  · 회의록 카드의 '📋 할일로 보내기'를 누르면 액션아이템이 할일 대시보드에 자동으로 추가돼요. 담당자 이름은 멤버와 자동 매칭되고, 기한은 마감일로 들어가요(이미 보낸 항목은 '📋 할일' 표시로 중복 방지).",
      "회의록 카드의 '완료' 칸 ⬜/✅를 바로 클릭하면 수정 화면에 들어가지 않고도 처리 여부가 즉시 토글돼요.",
      "F/u(후속 과제) 완료 체크박스로 회의 후 후속 과제 처리 여부를 관리해요.",
      "'📑 복제'로 같은 양식의 회의록을 빠르게 재사용할 수 있어요.",
      "'🖼️ 이미지'를 누르면 회의록을 깔끔한 양식의 PNG 이미지로 저장할 수 있어요.",
      "상단 검색창으로 제목·내용·날짜를 키워드로 검색해 원하는 회의록을 바로 찾아요.",
      "회의록 카드를 클릭하면 전체 내용을 펼쳐 볼 수 있어요.",
    ],
  },
  kpt: {
    title: "KPT 회고 사용법",
    items: [
      "Keep(계속 유지할 것) · Problem(문제점·개선 필요) · Try(다음에 시도할 것) 세 항목으로 팀 회고를 기록해요.",
      "'내가 쓴 회고만 보기' 체크박스를 켜면 본인이 작성한 회고만 필터링해서 볼 수 있어요.",
      "이 필터가 동작하려면 우측 상단에서 본인 이름을 먼저 선택해야 해요.",
      "회고는 날짜와 작성자가 함께 기록되니, 팀 전체 회고 흐름을 시간순으로 볼 수 있어요.",
      "정기 회고(주간·월간)마다 팀원 모두가 한 건씩 작성하는 것을 권장해요.",
    ],
  },
  reports: {
    title: "보고서 사용법",
    items: [
      "【일일 보고】 오늘 한 일·내일 할 일·특이사항을 작성해요.",
      "  · '⚡ 자동생성'을 누르면 선택 창이 떠요. '오늘 한 일'·'내일 할 일'에 넣을 업무를 체크로 직접 고르고(기본 전체 선택, 빼고 싶은 건 해제), 상세내용까지 넣을 업무도 따로 고를 수 있어요.",
      "  · 상세를 고른 업무는 제목(-) 아래에 상세가 '•'로 한 번만 붙어요(내일 할 일은 항상 제목만).",
      "  · 작성 후 '📄 제출 양식'을 누르면 양식 미리보기가 열리고, 'PNG 이미지 저장'으로 내려받을 수 있어요.",
      "  · 날짜별 취합에서 각 보고 카드 아래 '💬 피드백' 칸에 직접 의견을 적고 '피드백 저장'을 누르면 팀원과 공유돼요(칸 밖을 눌러도 자동 저장).",
      "【주간 계획】 이번 주에 할 계획을 미리 작성하는 보고서예요 (지난 주 실적 정리가 아니에요!).",
      "  · '⚡ 자동생성'을 누르면 이번 주 등록된 업무·일정이 초안으로 채워져요.",
      "  · 주간 목표 진행률은 본인의 전체 업무 평균 진행률을 자동으로 계산해 넣어요.",
      "【월간 계획】 이번 달 계획을 미리 작성하는 보고서예요. 자동생성으로 이달 업무·일정 초안이 만들어져요.",
      "【날짜별 취합】 달력에서 날짜를 선택하면 그날 팀원 4명의 일일 보고가 한 화면에 모여요.",
      "  · '취합 제출 양식 열기'를 누르면 2×2 격자 레이아웃으로 보이고, 'PNG 이미지 저장'으로 한 장의 이미지로 내려받을 수 있어요.",
      "  · 취합 양식의 팀원 순서는 멤버 탭에서 지정한 순서를 따라요.",
    ],
  },
  members: {
    title: "멤버 관리 사용법",
    items: [
      "'+ 멤버 추가'로 팀원 이름과 대표 색상을 등록해요.",
      "【색상 선택】 색상 동그라미를 클릭하면 파스텔 색상표가 열려요. 원하는 색을 클릭해 지정하세요.",
      "이름과 색상은 할 일 담당자·일정 참여자·보고서 작성자 표시 등 모든 탭에서 사용돼요.",
      "【순서 변경】 각 멤버 카드의 ▲ / ▼ 버튼으로 순서를 바꿀 수 있어요.",
      "  · 변경한 순서는 이 브라우저에 저장되며, 사람별 보기·취합 양식 등 모든 보기에 반영돼요.",
      "  · 취합 양식 팀원 순서도 여기서 지정한 순서를 따라요.",
      "본인 정보를 바꾸려면 본인 카드의 '수정'을 눌러 이름·색상을 편집하세요.",
      "우측 상단 이름 선택과 멤버 탭 등록은 별개예요. 이름 선택은 현재 사용 중인 사용자를 지정하는 것이에요.",
    ],
  },
};

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
    taskView: "people", // 대시보드 보기: kanban | people
    goalView: "table", // 업무 목표 보기: table | board
    docSelectedId: null, // 선택한 업무 문서
    docSearch: "", // 문서 검색어
    helpOpen: true, // 페이지 하단 사용법 표시
    reportTab: "collect", // 보고서 보기: collect | weekly | monthly
    minutesSearch: "", // 회의록 검색어
    reportSearch: "", // 보고서 검색어
    doneExpanded: {}, // 사람별 보기: 완료 목록 펼침 상태 (memberId→bool)
    pastDoneExpanded: {}, // 지난(어제 이전) 완료 목록 펼침 상태 (memberId|"kanban"→bool)
    assistantOpen: false, // 업무 비서 열림
    assistantMsgs: [], // 비서 대화 내역
    reportDate: null, // 취합 보기 선택 날짜
    reportCalRef: new Date(), // 취합 캘린더 기준 월
    payView: "daily", // 결제 일정 보기: daily | monthly
    payRef: new Date(), // 결제 일정 기준 월
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
        <button class="btn ghost sm ${FloatTodo.isOn() ? "on" : ""}" data-act="float-todo-toggle" title="내 할일을 화면에 띄워 따라다니게 해요">📌 내 할일</button>
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
/* 매일 바뀌는 응원 인사말 (같은 날엔 고정) */
const GREETINGS = [
  "오늘도 화이팅이에요",
  "오늘도 좋은 하루 보내요",
  "할 수 있어요, 오늘도 파이팅",
  "오늘도 한 걸음씩 나아가요",
  "당신의 하루를 응원해요",
  "오늘도 멋진 하루 만들어요",
  "차근차근, 오늘도 잘 될 거예요",
  "오늘도 우리 팀 최고예요",
  "기분 좋은 하루 되세요",
  "오늘도 수고가 많아요",
  "작은 진전도 큰 성과예요",
  "오늘도 활기차게 시작해요",
  "좋은 일이 가득할 거예요",
  "오늘도 즐겁게 일해봐요",
  "한 주도 알차게 채워가요",
  "오늘의 노력이 내일을 만들어요",
  "커피 한 잔의 여유도 잊지 마세요",
  "오늘도 반가워요, 함께 달려요",
];
function dailyGreeting() {
  const dayIndex = Math.floor(Date.now() / 86400000); // 날짜(일) 단위
  return GREETINGS[dayIndex % GREETINGS.length];
}

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
  const greet = dailyGreeting();

  // 통계
  const counts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing" || t.status === "paused").length,
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
            <span class="cal-ev ${scopeClass(e)} inline">${
            eventScopes(e).includes("month")
              ? "월"
              : eventScopes(e).includes("week")
              ? "주"
              : "일"
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
        .map((r) => `<div class="home-thumb clickable" data-act="res-view" data-id="${r.id}" title="클릭하면 크게 보기"><img src="${UI.esc(r.image_data)}" alt=""></div>`)
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
    doing: tasks.filter((t) => t.status === "doing" || t.status === "paused").length,
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
    let items = tasks
      // '진행 중' 칸에는 멈춤(paused) 업무도 함께 표시(멈춤 배지로 구분)
      .filter((t) => t.status === col.key || (col.key === "doing" && t.status === "paused"))
      .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
    let pastBlock = "";
    // 완료 칸: 오늘 완료만 기본 노출, 지난 완료는 토글로 펼치기
    if (col.key === "done") {
      const past = items
        .filter((t) => isHiddenDone(t))
        .sort((a, b) => (b.done_at || "").localeCompare(a.done_at || ""));
      items = items.filter((t) => !isHiddenDone(t));
      if (past.length) {
        const open = !!App.state.pastDoneExpanded.kanban;
        pastBlock = `
          <button class="done-toggle past" data-act="toggle-past-done" data-member="kanban">
            <span>🗂️ 지난 완료한 일 ${past.length}개</span>
            <span>${open ? "▲ 접기" : "▼ 보기"}</span>
          </button>
          ${open ? past.map((t) => taskCard(t)).join("") : ""}`;
      }
    }
    const cards = items.length
      ? items.map((t) => taskCard(t)).join("")
      : `<div class="empty-mini">${
          col.key === "done" ? "오늘 완료한 일 없음" : "항목 없음"
        }</div>`;
    return `
      <div class="kanban-col" data-status="${col.key}">
        <div class="kanban-head">
          <span>${col.label} <b>${items.length}</b></span>
        </div>
        <div class="kanban-body">${cards}${pastBlock}</div>
      </div>`;
  }).join("");

  const view = App.state.taskView;
  const toggle = `
    <div class="view-toggle">
      <button class="vt ${view === "people" ? "active" : ""}" data-act="task-view" data-view="people">👥 사람별 보기</button>
      <button class="vt ${view === "kanban" ? "active" : ""}" data-act="task-view" data-view="kanban">📋 전체 보기</button>
    </div>`;

  const body =
    view === "people"
      ? dashboardPeople(allTasks)
      : `${filterBar}<div class="kanban">${columns}</div>`;

  return `
    <section class="view">
      <div class="view-head">
        <h2>할일 대시보드</h2>
        <button class="btn primary" data-act="task-add">+ 할 일 추가</button>
      </div>
      ${toggle}
      ${stats}
      ${body}
    </section>`;
}

/* 사람별 보기: 멤버마다 본인 할일을 한 줄씩 모아서 표시 */
function dashboardPeople(allTasks) {
  const me = curUser();
  const members = Store.list("members")
    .slice()
    .sort((a, b) => {
      if (a.id === me) return -1; // 본인을 맨 위로
      if (b.id === me) return 1;
      return 0;
    });

  // 미지정(담당자 없음/삭제된 멤버) 그룹
  const memberIds = new Set(members.map((m) => m.id));
  const orphan = allTasks.filter((t) => !memberIds.has(t.assignee_id));

  const sections = [];

  members.forEach((m) => {
    const mine = allTasks.filter((t) => t.assignee_id === m.id);
    sections.push(personSection(m.name, m.color, m.id, mine, m.id === me));
  });
  if (orphan.length) sections.push(personSection("미지정", "#94a3b8", "orphan", orphan, false));

  if (!members.length && !orphan.length)
    return `<div class="empty">멤버를 등록하고 할 일을 추가해보세요.</div>`;

  return `<div class="people-list">${sections.join("")}</div>`;
}

/* 어제 이전에 완료한 일은 대시보드에서 숨김 */
function isHiddenDone(t) {
  return t.status === "done" && t.done_at && t.done_at < UI.todayInput();
}

/* 상태 변경 시 완료 일자(done_at) 함께 설정/해제 */
function statusPatch(status, existing) {
  const patch = { status: status };
  if (status === "done") {
    patch.done_at = existing && existing.done_at ? existing.done_at : UI.todayInput();
    patch.progress = "100";
  } else {
    patch.done_at = "";
  }
  return patch;
}

/* 진행률 슬라이더 변경 적용 (대시보드·플로팅 위젯·팝업 공용)
   진행률 값에 따라 상태(할 일/진행 중/완료)도 자동 변경 */
function applyProgressChange(id, value) {
  if (!id) return;
  const v = Math.max(0, Math.min(100, parseInt(value) || 0));
  const cur = Store.list("tasks").find((x) => x.id === id);
  if (!cur) return;
  let patch, statusLabel;
  if (v >= 100) {
    patch = statusPatch("done", cur);
    statusLabel = " · 완료";
  } else if (v > 0) {
    patch = { status: "doing", done_at: "", progress: String(v) };
    statusLabel = " · 진행 중";
  } else {
    patch = { status: "todo", done_at: "", progress: "0" };
    statusLabel = " · 할 일";
  }
  Store.update("tasks", id, patch);
  UI.toast("진행률 " + v + "%" + statusLabel);
}

function personSection(name, color, memberId, tasks, isMe) {
  const today = UI.todayInput();
  // 진행/할일(미완료) + 오늘 완료만 노출, 이전 완료는 숨김
  const active = tasks
    .filter((t) => t.status !== "done")
    .sort(
      (a, b) =>
        ({ doing: 0, todo: 1 }[a.status] - { doing: 0, todo: 1 }[b.status]) ||
        (a.due_date || "9999").localeCompare(b.due_date || "9999")
    );
  const doneToday = tasks.filter(
    (t) => t.status === "done" && (!t.done_at || t.done_at === today)
  );
  const pastDone = tasks
    .filter((t) => isHiddenDone(t))
    .sort((a, b) => (b.done_at || "").localeCompare(a.done_at || ""));

  const doing = tasks.filter((t) => t.status === "doing").length;
  const todo = tasks.filter((t) => t.status === "todo").length;

  const activeRows = active.length
    ? active.map((t) => personTaskRow(t)).join("")
    : `<div class="empty-mini">진행 중인 할 일이 없습니다</div>`;

  const open = !!App.state.doneExpanded[memberId];
  const doneBlock = doneToday.length
    ? `
      <button class="done-toggle" data-act="toggle-done" data-member="${memberId}">
        <span>✓ 오늘 완료한 일 ${doneToday.length}개</span>
        <span>${open ? "▲ 접기" : "▼ 펼치기"}</span>
      </button>
      ${open ? doneToday.map((t) => personTaskRow(t)).join("") : ""}`
    : "";

  const pastOpen = !!App.state.pastDoneExpanded[memberId];
  const pastBlock = pastDone.length
    ? `
      <button class="done-toggle past" data-act="toggle-past-done" data-member="${memberId}">
        <span>🗂️ 지난 완료한 일 ${pastDone.length}개</span>
        <span>${pastOpen ? "▲ 접기" : "▼ 보기"}</span>
      </button>
      ${pastOpen ? pastDone.map((t) => personTaskRow(t)).join("") : ""}`
    : "";

  return `
    <div class="person-block">
      <div class="person-head">
        <span class="chip" style="--c:${UI.esc(color || "#64748b")}">${UI.esc(name)}</span>
        ${isMe ? `<span class="chip chip-me">나</span>` : ""}
        <span class="person-counts">진행 ${doing} · 할일 ${todo} · 오늘 완료 ${doneToday.length}</span>
      </div>
      <div class="person-tasks">${activeRows}${doneBlock}${pastBlock}</div>
    </div>`;
}

function personTaskRow(t) {
  const overdue = t.status !== "done" && t.due_date && t.due_date < UI.todayInput();
  const next =
    t.status === "todo" ? "doing" : t.status === "doing" ? "done" : t.status === "paused" ? "doing" : "todo";
  const nextLabel =
    t.status === "todo" ? "▶" : t.status === "doing" ? "✓" : t.status === "paused" ? "▶" : "↺";
  const nextTip =
    t.status === "todo" ? "시작" : t.status === "doing" ? "완료" : t.status === "paused" ? "재개" : "되돌리기";
  return `
    <div class="ptask ${t.status === "done" ? "is-done" : ""} ${t.status === "paused" ? "is-paused" : ""}">
      <span class="pt-dot status-${t.status}"></span>
      <span class="pt-title clickable" data-act="task-detail" data-id="${t.id}">${UI.esc(t.title)}</span>
      ${
        t.due_date
          ? `<span class="pt-due ${overdue ? "overdue" : ""}">${UI.fmtDate(t.due_date)}</span>`
          : ""
      }
      <span class="pt-lead"></span>
      ${
        t.status === "done"
          ? `<span class="pt-progbox done">✅ ${t.done_at ? UI.fmtDate(t.done_at).slice(5) + " 완료" : "완료"}</span>`
          : `<span class="pt-progbox" title="진행률">
               <input type="range" min="0" max="100" step="5" value="${
                 parseInt(t.progress) || 0
               }" class="prog-range mini" data-id="${t.id}">
               <span class="prog-edit-num">${parseInt(t.progress) || 0}%</span>
             </span>`
      }
      <span class="pt-status status-${t.status}">${taskStatusLabel(t.status)}</span>
      <span class="pt-actions">
        <button class="btn xs primary" data-act="task-move" data-id="${t.id}" data-to="${next}" title="${nextTip}">${nextLabel}</button>
        ${
          t.status === "doing"
            ? `<button class="btn xs ghost" data-act="task-move" data-id="${t.id}" data-to="paused" title="잠깐 멈춤">⏸</button>`
            : ""
        }
        <button class="btn xs ghost" data-act="task-edit" data-id="${t.id}">수정</button>
        <button class="btn xs danger" data-act="task-del" data-id="${t.id}">삭제</button>
      </span>
    </div>`;
}

function taskCard(t) {
  const overdue =
    t.status !== "done" && t.due_date && t.due_date < UI.todayInput();
  const next =
    t.status === "todo" ? "doing" : t.status === "doing" ? "done" : t.status === "paused" ? "doing" : "todo";
  const nextLabel =
    t.status === "todo" ? "▶ 시작" : t.status === "doing" ? "✓ 완료" : t.status === "paused" ? "▶ 재개" : "↺ 되돌리기";
  return `
    <div class="card task-card ${t.status === "done" ? "is-done" : ""} ${t.status === "paused" ? "is-paused" : ""}">
      <div class="card-top">
        <strong class="clickable" data-act="task-detail" data-id="${t.id}">${UI.esc(t.title)}</strong>
        ${t.status === "paused" ? `<span class="paused-badge">⏸ 멈춤</span>` : ""}
        ${UI.memberChip(t.assignee_id)}
      </div>
      ${t.detail ? `<p class="card-desc">${UI.nl2br(t.detail)}</p>` : ""}
      ${
        t.status === "done"
          ? progressBar(100)
          : `<div class="prog-edit">
               <span class="prog-edit-label">진행률</span>
               <input type="range" min="0" max="100" step="5" value="${
                 parseInt(t.progress) || 0
               }" class="prog-range" data-id="${t.id}">
               <span class="prog-edit-num">${parseInt(t.progress) || 0}%</span>
             </div>`
      }
      <div class="card-meta">
        ${
          t.status === "done" && t.done_at
            ? `<span class="done-date">✅ ${UI.fmtDate(t.done_at)} 완료</span>`
            : t.due_date
            ? `<span class="due ${overdue ? "overdue" : ""}">📅 ${UI.fmtDate(
                t.due_date
              )}</span>`
            : ""
        }
      </div>
      <div class="card-actions">
        <button class="btn xs primary" data-act="task-move" data-id="${t.id}" data-to="${next}">${nextLabel}</button>
        ${
          t.status === "doing"
            ? `<button class="btn xs ghost" data-act="task-move" data-id="${t.id}" data-to="paused" title="잠깐 멈춤">⏸ 멈춤</button>`
            : ""
        }
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
      { name: "progress", label: "진행률 (%)", type: "text", placeholder: "예: 50" },
    ],
  });
  if (!res) return;
  // 완료 상태면 완료일자 설정, 아니면 해제
  if (res.status === "done") {
    res.done_at = existing && existing.done_at ? existing.done_at : UI.todayInput();
  } else {
    res.done_at = "";
  }
  if (existing) {
    await Store.update("tasks", existing.id, res);
    UI.toast("수정되었습니다");
  } else {
    await Store.add("tasks", res);
    UI.toast("추가되었습니다");
  }
}

/* 할 일 상세 보기 (읽기 전용) */
function openTaskDetail(t) {
  if (!t) return;
  const meta = { label: taskStatusLabel(t.status) };
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head"><h3>할 일 상세</h3><button class="icon-btn" data-close>✕</button></div>
      <div class="modal-body detail-body-wrap">
        <div class="detail-title">${UI.esc(t.title)}</div>
        <div class="detail-meta">
          ${UI.memberChip(t.assignee_id)}
          <span class="pt-status status-${t.status}">${meta.label}</span>
          ${t.due_date ? `<span class="muted">📅 마감 ${UI.fmtDate(t.due_date)}</span>` : ""}
          ${
            t.status === "done" && t.done_at
              ? `<span class="done-date">✅ ${UI.fmtDate(t.done_at)} 완료</span>`
              : ""
          }
        </div>
        ${progressBar(t.status === "done" ? 100 : parseInt(t.progress) || 0)}
        <div class="detail-content">${
          t.detail ? UI.nl2br(t.detail) : '<span class="muted">상세 내용이 없습니다.</span>'
        }</div>
      </div>
      <div class="modal-foot">
        <button class="btn ghost" data-edit>✎ 수정</button>
        <button class="btn primary" data-close2>닫기</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("[data-close]").onclick = close;
  overlay.querySelector("[data-close2]").onclick = close;
  overlay.querySelector("[data-edit]").onclick = () => {
    close();
    taskForm(t);
  };
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
/* 진행률 바 (녹색). label 옵션으로 앞에 라벨 표시 */
function progressBar(v, label) {
  const n = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
  const cls = n >= 100 ? " full" : "";
  return `<div class="progress${cls}">${
    label ? `<span class="progress-label">${label}</span>` : ""
  }<div class="progress-track"><span style="width:${n}%"></span></div><span class="progress-num">${n}%</span></div>`;
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
        <td style="min-width:110px">${weightBar(g.weight)}</td>
        <td style="min-width:120px">${progressBar(g.status === "done" ? 100 : g.progress)}</td>
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
            <th>대상년도</th><th>상태</th><th>중점추진과제</th><th>비중</th><th>진행률</th>
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
      ${progressBar(g.status === "done" ? 100 : g.progress, "진행률")}
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
      { name: "progress", label: "진행률 (%)", type: "text", placeholder: "예: 60" },
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

/* ============ 업무 문서 (SOP 문서함) ============ */
const SOP_TEMPLATE = `# 목적
이 업무(SOP)의 목적을 한두 문장으로 적습니다.

# 적용 범위
이 절차가 적용되는 업무/대상/상황을 적습니다.

# 용어 정의
- 용어: 설명

# 담당자 및 역할
- 담당자:
- 역할:

# 업무 절차
1. (단계 1) 무엇을, 어떻게
2. (단계 2) 무엇을, 어떻게
3. (단계 3) 무엇을, 어떻게

# 주의사항 / 체크포인트
-

# 관련 문서 / 링크
-

# 개정 이력
- (날짜) 최초 작성 (작성자: )`;

/* 아주 가벼운 마크다운 렌더러 (제목/목록/굵게/구분선) */
function mdToHtml(src) {
  const lines = String(src || "").split("\n");
  let html = "";
  let listType = null; // 'ul' | 'ol'
  const closeList = () => {
    if (listType) {
      html += listType === "ul" ? "</ul>" : "</ol>";
      listType = null;
    }
  };
  const inline = (s) =>
    UI.esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>'
      );

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      closeList();
      continue;
    }
    let m;
    if ((m = line.match(/^###\s+(.*)/))) {
      closeList();
      html += `<h5>${inline(m[1])}</h5>`;
    } else if ((m = line.match(/^##\s+(.*)/))) {
      closeList();
      html += `<h4>${inline(m[1])}</h4>`;
    } else if ((m = line.match(/^#\s+(.*)/))) {
      closeList();
      html += `<h3>${inline(m[1])}</h3>`;
    } else if (/^[-*]\s+/.test(line)) {
      if (listType !== "ul") {
        closeList();
        html += "<ul>";
        listType = "ul";
      }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (listType !== "ol") {
        closeList();
        html += "<ol>";
        listType = "ol";
      }
      html += `<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`;
    } else if (/^---+$/.test(line)) {
      closeList();
      html += "<hr>";
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
  }
  closeList();
  return html || `<p class="muted">내용이 비어 있습니다.</p>`;
}

function docMatches(d, q) {
  if (!q) return true;
  const s = (d.title + " " + (d.category || "") + " " + (d.body || "")).toLowerCase();
  return s.includes(q.toLowerCase());
}

function docTreeHTML() {
  const q = App.state.docSearch;
  const all = Store.list("docs").filter((d) => d.title !== VENDOR_DOC_TITLE);
  const docs = all.filter((d) => !d.is_template && docMatches(d, q));
  const templates = all.filter((d) => d.is_template && docMatches(d, q));

  // 카테고리별 그룹
  const groups = {};
  docs.forEach((d) => {
    const c = d.category || "미분류";
    (groups[c] = groups[c] || []).push(d);
  });
  const catNames = Object.keys(groups).sort((a, b) => a.localeCompare(b, "ko"));

  const sel = App.state.docSelectedId;
  let html = "";

  if (!catNames.length && !templates.length) {
    html += `<div class="empty-mini">${
      q ? "검색 결과가 없습니다" : "문서가 없습니다"
    }</div>`;
  }

  catNames.forEach((c) => {
    const items = groups[c]
      .slice()
      .sort((a, b) => (a.title || "").localeCompare(b.title || "", "ko"));
    html += `<div class="doc-group">
      <div class="doc-group-head">📁 ${UI.esc(c)} <span>${items.length}</span></div>
      ${items
        .map(
          (d) =>
            `<div class="doc-item ${d.id === sel ? "active" : ""}" data-act="doc-select" data-id="${
              d.id
            }">📄 ${UI.esc(d.title)}</div>`
        )
        .join("")}
    </div>`;
  });

  if (templates.length) {
    html += `<div class="doc-group templates">
      <div class="doc-group-head">⭐ 양식(템플릿) <span>${templates.length}</span></div>
      ${templates
        .map(
          (d) =>
            `<div class="doc-item ${d.id === sel ? "active" : ""}" data-act="doc-select" data-id="${
              d.id
            }">📋 ${UI.esc(d.title)}</div>`
        )
        .join("")}
    </div>`;
  }
  return html;
}

function docMainHTML() {
  const docs = Store.list("docs").filter((d) => d.title !== VENDOR_DOC_TITLE);
  if (!docs.length) {
    return `<div class="doc-empty">
      <div class="doc-empty-icon">📄</div>
      <h3>업무 표준 문서함</h3>
      <p class="muted">SOP·업무 매뉴얼·체크리스트 등을 한곳에 모아두고, 신입도 한눈에 보게 만드세요.<br>
      기본 양식을 만든 뒤 <b>복제</b>해서 다양한 문서로 활용할 수 있어요.</p>
      <div class="doc-empty-cta">
        <button class="btn primary" data-act="doc-new-template">⭐ SOP 기본 양식으로 시작</button>
        <button class="btn ghost" data-act="doc-new">빈 문서 만들기</button>
      </div>
    </div>`;
  }

  let id = App.state.docSelectedId;
  if (!id || !docs.some((d) => d.id === id)) {
    App.state.docSelectedId = id = docs[0].id;
  }
  const d = docs.find((x) => x.id === id);

  return `
    <div class="doc-view-head">
      <div>
        ${d.is_template ? `<span class="tpl-tag">⭐ 양식</span>` : ""}
        <span class="year-tag">${UI.esc(d.category || "미분류")}</span>
        <h2>${UI.esc(d.title)}</h2>
        <div class="muted doc-byline">작성: ${UI.memberName(d.member_id)} · 수정: ${UI.fmtDateTime(
    d.updated_at || d.created_at
  )}</div>
      </div>
      <div class="doc-view-actions">
        <button class="btn ghost sm" data-act="doc-duplicate" data-id="${d.id}">📑 복제</button>
        <button class="btn ghost sm" data-act="doc-edit" data-id="${d.id}">✎ 수정</button>
        <button class="btn danger sm" data-act="doc-del" data-id="${d.id}">삭제</button>
      </div>
    </div>
    <article class="doc-body">${mdToHtml(d.body)}</article>`;
}

function renderDocs() {
  return `
    <section class="view">
      <div class="view-head">
        <h2>업무 문서 (SOP)</h2>
        <div class="head-btns">
          <button class="btn ghost" data-act="doc-new-template">⭐ 양식으로 만들기</button>
          <button class="btn primary" data-act="doc-new">+ 새 문서</button>
        </div>
      </div>
      <div class="doc-layout">
        <aside class="doc-sidebar">
          <input id="docSearch" class="doc-search" type="search" placeholder="🔍 문서 검색…" value="${UI.esc(
            App.state.docSearch
          )}">
          <div id="docTree" class="doc-tree">${docTreeHTML()}</div>
        </aside>
        <main class="doc-main" id="docMain">${docMainHTML()}</main>
      </div>
    </section>`;
}

async function docForm(existing, useTemplate) {
  const values = existing || {
    member_id: curUser(),
    category: useTemplate ? "SOP" : "",
    body: useTemplate ? SOP_TEMPLATE : "",
    is_template: false,
  };
  // 기존 카테고리 추천 목록
  const cats = Array.from(
    new Set(
      Store.list("docs")
        .filter((d) => d.title !== VENDOR_DOC_TITLE)
        .map((d) => d.category)
        .filter(Boolean)
    )
  );
  const res = await UI.formModal({
    title: existing ? "문서 수정" : useTemplate ? "양식으로 새 문서" : "새 문서",
    submitText: existing ? "수정" : "만들기",
    values,
    fields: [
      { name: "title", label: "문서 제목", type: "text", required: true, full: true },
      {
        name: "category",
        label: "카테고리(폴더)",
        type: "text",
        placeholder: cats.length ? "예: " + cats.slice(0, 3).join(", ") : "예: SOP, 매뉴얼, 체크리스트",
      },
      {
        name: "is_template",
        label: "양식(템플릿)으로 저장",
        type: "select",
        options: [
          { value: "", label: "일반 문서" },
          { value: "yes", label: "양식으로 저장 (복제용)" },
        ],
      },
      {
        name: "body",
        label: "내용 (# 제목, - 목록, **굵게** 사용 가능)",
        type: "textarea",
        rows: 16,
        full: true,
      },
    ],
  });
  if (!res) return;
  res.is_template = res.is_template === "yes";
  if (existing) {
    await Store.update("docs", existing.id, res);
    UI.toast("문서가 수정되었습니다");
  } else {
    const created = await Store.add("docs", res);
    App.state.docSelectedId = created.id;
    UI.toast("문서가 생성되었습니다");
  }
}

async function duplicateDoc(id) {
  const d = Store.list("docs").find((x) => x.id === id);
  if (!d) return;
  const copy = {
    title: d.title + " (복사본)",
    category: d.category,
    body: d.body,
    is_template: false,
    member_id: curUser() || d.member_id,
  };
  const created = await Store.add("docs", copy);
  App.state.docSelectedId = created.id;
  UI.toast("복제되었습니다. 수정해서 사용하세요");
}

/* ============ 캘린더 ============ */
function renderCalendar() {
  const ref = App.state.calendarRef;
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const events = Store.list("events");

  // 주별/월별 별도 표시용 (한 일정이 둘 다 가능)
  const monthly = events
    .filter((e) => eventScopes(e).includes("month") && belongsToMonth(e.date, year, month))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  // 주별 강조는 '이번 주(오늘 기준 월~일)'에 해당하는 일정만
  const wk = thisWeekRange();
  const weekly = events
    .filter(
      (e) =>
        eventScopes(e).includes("week") &&
        (e.date || "") <= wk.end &&
        (e.end_date || e.date || "") >= wk.start
    )
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  // 오늘의 일정 (오늘 날짜가 기간에 포함되는 모든 일정)
  const todayStr = UI.todayInput();
  const todayEvents = events
    .filter((e) => {
      if (isPayment(e)) return false; // 결제 건은 결제 일정 탭에서 관리
      const s = e.date;
      const en = e.end_date || e.date;
      return s && todayStr >= s && todayStr <= en;
    })
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
        <h4>🗓️ 이번 주 일정 <span class="hl-range">${UI.fmtDate(wk.start).slice(5)}~${UI.fmtDate(
    wk.end
  ).slice(5)}</span></h4>
        ${
          weekly.length
            ? weekly.map((e) => highlightItem(e)).join("")
            : `<div class="empty-mini">이번 주 주별 일정이 없습니다</div>`
        }
      </div>
      <div class="hl-box hl-today">
        <h4>📍 오늘의 일정 <span class="hl-range">${UI.fmtDate(todayStr).slice(5)}</span></h4>
        ${
          todayEvents.length
            ? todayEvents.map((e) => highlightItem(e)).join("")
            : `<div class="empty-mini">오늘 등록된 일정이 없습니다</div>`
        }
      </div>
    </div>`;

  return `
    <section class="view">
      <div class="view-head">
        <h2>캘린더</h2>
        <div class="head-btns">
          <button class="btn ghost" data-act="leave-add">🌴 연차 추가</button>
          <button class="btn primary" data-act="event-add">+ 일정 추가</button>
        </div>
      </div>
      ${highlight}
      <div class="cal-toolbar">
        <button class="icon-btn" data-act="cal-year-prev" title="이전 연도">«</button>
        <button class="icon-btn" data-act="cal-prev" title="이전 달">‹</button>
        <strong>${year}년 ${month + 1}월</strong>
        <button class="icon-btn" data-act="cal-next" title="다음 달">›</button>
        <button class="icon-btn" data-act="cal-year-next" title="다음 연도">»</button>
        <button class="btn ghost sm" data-act="cal-today">오늘</button>
      </div>
      ${calendarGrid(year, month, events)}
    </section>`;
}

function memberDots(ids) {
  if (!Array.isArray(ids) || !ids.length) return "";
  const dots = ids
    .map((id) => {
      const m = Store.list("members").find((x) => x.id === id);
      const color = m ? m.color || "#64748b" : "#cbd5e1";
      const name = m ? m.name : "?";
      const initial = (name.trim()[0] || "?");
      return `<span class="mavatar" style="--c:${UI.esc(color)}" title="${UI.esc(
        name
      )}">${UI.esc(initial)}</span>`;
    })
    .join("");
  return `<span class="mdots">${dots}</span>`;
}

/* 멤버 등록 순서 인덱스 (취합/목록 정렬용) */
function memberOrder(memberId) {
  const idx = Store.list("members").findIndex((m) => m.id === memberId);
  return idx < 0 ? 9999 : idx;
}

function participantChips(ids) {
  if (!Array.isArray(ids) || !ids.length) return "";
  return (
    `<span class="participants">👥 ` +
    ids.map((id) => UI.memberChip(id)).join("") +
    `</span>`
  );
}

function highlightItem(e) {
  return `
    <div class="hl-item">
      <span class="hl-date">${UI.fmtDate(e.date)}${
    e.end_date && e.end_date !== e.date ? " ~ " + UI.fmtDate(e.end_date) : ""
  }</span>
      <span class="hl-title">${UI.esc(e.title)}</span>
      ${memberDots(e.participants)}
      <span class="hl-actions">
        <button class="btn xs ghost" data-act="event-edit" data-id="${e.id}">수정</button>
        <button class="btn xs danger" data-act="event-del" data-id="${e.id}">삭제</button>
      </span>
    </div>`;
}

/* 특정 날짜의 일정 전체 보기 모달 (잘림 없이 모두 표시, 추가/수정/삭제 가능) */
function openDayDetail(dateStr) {
  if (!dateStr) return;
  const WD = ["일", "월", "화", "수", "목", "금", "토"];
  const dow = WD[new Date(dateStr).getDay()] || "";
  const hol = holidayName(dateStr);
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay day-detail";
  overlay.innerHTML = `
    <div class="dd-box">
      <div class="dd-head">
        <div class="dd-title">
          <strong>${UI.fmtDate(dateStr)} (${dow})</strong>
          ${hol ? `<span class="dd-hol">${UI.esc(hol)}</span>` : ""}
          <span class="dd-count muted"></span>
        </div>
        <div class="dd-head-actions">
          <button class="btn ghost sm" data-act="leave-add-on" data-date="${dateStr}">🌴 연차 추가</button>
          <button class="btn primary sm" data-act="event-add-on" data-date="${dateStr}">+ 일정 추가</button>
          <button class="icon-btn" data-close title="닫기">✕</button>
        </div>
      </div>
      <div class="dd-body"></div>
    </div>`;
  document.body.appendChild(overlay);

  const paint = () => {
    const events = Store.list("events")
      .filter((e) => {
        const pay = eventPayment(e);
        if (pay) return payOccursOn(e, pay, dateStr); // 결제는 반복 규칙으로
        const s = e.date;
        const en = e.end_date || e.date;
        return s && dateStr >= s && dateStr <= en;
      })
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    const cnt = overlay.querySelector(".dd-count");
    if (cnt) cnt.textContent = `· 일정 ${events.length}건`;
    const body = overlay.querySelector(".dd-body");
    if (body)
      body.innerHTML = events.length
        ? events.map((e) => dayDetailItem(e)).join("")
        : `<div class="empty-mini">이 날짜에 등록된 일정이 없습니다. '+ 이 날짜에 일정 추가'로 등록해보세요.</div>`;
  };
  paint();
  const unsub = Store.subscribe(paint); // 추가/수정/삭제 시 목록 자동 갱신

  const close = () => {
    unsub();
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("[data-close]").onclick = close;
}

function dayDetailItem(e) {
  const pay = eventPayment(e);
  const scopes = eventScopes(e);
  const tags = scopes
    .map((s) =>
      s === "month"
        ? `<span class="dd-tag month">월별</span>`
        : `<span class="dd-tag week">주별</span>`
    )
    .join("");
  const range =
    e.end_date && e.end_date !== e.date
      ? `${UI.fmtDate(e.date)} ~ ${UI.fmtDate(e.end_date)}`
      : UI.fmtDate(e.date);
  // 결제 건은 결제 전용 액션으로 라우팅
  const editAct = pay ? "pay-edit" : "event-edit";
  const delAct = pay ? "pay-del" : "event-del";
  return `
    <div class="dd-item">
      <div class="dd-item-top">
        <span class="dd-dot ${pay ? "" : scopeClass(e)}"></span>
        <strong>${pay ? "💰 " : eventLeave(e) ? "🌴 " : ""}${UI.esc(e.title)}</strong>
        ${pay ? `<span class="dd-tag pay">${payRecurLabel(pay.recur)} ${fmtWon(pay.amount)}</span>` : ""}
        ${eventLeave(e) ? `<span class="dd-tag leave">${UI.esc(eventLeave(e))}</span>` : ""}
        ${tags}
      </div>
      <div class="dd-item-meta">
        <span>📅 ${range}</span>
        ${e.member_id ? `<span>✍ ${UI.esc(UI.memberName(e.member_id))}</span>` : ""}
      </div>
      ${
        Array.isArray(e.participants) && e.participants.length
          ? `<div class="dd-parts">${participantChips(e.participants)}</div>`
          : ""
      }
      ${e.note ? `<div class="dd-note">${UI.nl2br(e.note)}</div>` : ""}
      <div class="dd-item-actions">
        <button class="btn xs ghost" data-act="${editAct}" data-id="${e.id}">수정</button>
        <button class="btn xs danger" data-act="${delAct}" data-id="${e.id}">삭제</button>
      </div>
    </div>`;
}

function belongsToMonth(dateStr, y, m) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === y && d.getMonth() === m;
}

/* 일정의 강조 구분 배열 ('week','month'). 옛 데이터(scope 문자열)도 지원 */
function eventScopes(e) {
  if (Array.isArray(e.scopes)) return e.scopes;
  const raw = e.scope || "";
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x === "week" || x === "month");
}
function scopeClass(e) {
  const s = eventScopes(e);
  return s.includes("month") ? "scope-month" : s.includes("week") ? "scope-week" : "scope-day";
}

/* 일정의 휴무/부재 구분명 반환. 신규는 scope에 'leave:연차' 토큰으로 저장,
   구버전(leave_type 컬럼)도 호환 */
function eventLeave(e) {
  if (e.leave_type) return e.leave_type;
  const tok = (e.scope || "")
    .split(",")
    .map((x) => x.trim())
    .find((x) => x.startsWith("leave:"));
  if (tok) return tok.slice(6);
  // 폴백: 제목이 휴무 구분명과 정확히 같으면 휴무로 인식
  // (예전에 leave_type 컬럼이 누락돼 제목만 저장된 데이터 복구)
  const title = (e.title || "").trim();
  return LEAVE_TYPES.includes(title) ? title : "";
}

/* 특정 멤버가 그 날짜에 등록된 휴무/부재 구분명 반환 (없으면 "") */
function leaveLabelFor(memberId, dateStr) {
  if (!memberId || !dateStr) return "";
  const labels = Store.list("events")
    .filter((e) => {
      if (!eventLeave(e)) return false;
      const s = e.date;
      const en = e.end_date || e.date;
      if (!s || dateStr < s || dateStr > en) return false;
      const parts = Array.isArray(e.participants) ? e.participants : [];
      // 휴무 대상자는 '참여자' 기준. 참여자가 비었을 때만 작성자를 대상으로 봄
      // (작성자는 단지 등록한 사람일 수 있으므로 참여자가 있으면 작성자는 제외)
      return parts.length ? parts.includes(memberId) : e.member_id === memberId;
    })
    .map((e) => eventLeave(e));
  return [...new Set(labels)].join("·");
}

/* ===== 결제(지출) 일정 — events에 'pay:반복:금액' 토큰으로 인코딩 저장 ===== */
/* 결제 정보 파싱: { recur:'once'|'weekly'|'monthly', amount:Number } 또는 null */
function eventPayment(e) {
  const tok = (e.scope || "")
    .split(",")
    .map((x) => x.trim())
    .find((x) => x.startsWith("pay:"));
  if (!tok) return null;
  const parts = tok.split(":");
  let recur = parts[1] || "once";
  // 구버전 호환(일별/월별/주별)
  if (recur === "일별") recur = "once";
  else if (recur === "월별") recur = "monthly";
  else if (recur === "주별") recur = "weekly";
  return { recur, amount: parseInt(parts[2]) || 0 };
}
function isPayment(e) {
  return !!eventPayment(e);
}
function payRecurLabel(recur) {
  return { once: "한 번만", weekly: "매주", monthly: "매월" }[recur] || "한 번만";
}
/* YYYY-MM-DD → 요일/일 (타임존 영향 없이) */
function ymd(ds) {
  const [y, m, d] = (ds || "").split("-").map(Number);
  if (!y) return null;
  return { y, m, d, dow: new Date(y, m - 1, d).getDay() };
}
/* 결제 e가 dateStr에 발생하는지(반복 규칙 적용) */
function payOccursOn(e, p, dateStr) {
  const anchor = e.date;
  if (!anchor || !dateStr || dateStr < anchor) return false; // 시작(기준)일 이전엔 없음
  if (p.recur === "weekly") return ymd(dateStr).dow === ymd(anchor).dow;
  if (p.recur === "monthly") return ymd(dateStr).d === ymd(anchor).d;
  return dateStr === anchor; // once
}
/* 결제 e가 해당 연·월에 발생하는 날짜 목록 */
function payOccurrencesInMonth(e, p, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const out = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (payOccursOn(e, p, ds)) out.push(ds);
  }
  return out;
}

/* 결제조건 → 마커 분류(색/라벨용): weekly | settle(정산서) | monthend | order(건별) */
function termKind(terms) {
  if (terms === "주결제") return "weekly";
  if (terms === "15일결제") return "settle";
  if (terms === "당월말결제") return "monthend";
  return "order"; // 즉시/익일/선급 = 주문건별
}
/* 그 날짜에 표시할 업체 결제 마커 목록(주결제/15일/당월말 자동) */
function vendorMarkersOn(dateStr) {
  const t = ymd(dateStr);
  if (!t) return [];
  const lastDay = new Date(t.y, t.m, 0).getDate();
  const out = [];
  getVendors().forEach((v) => {
    if (v.terms === "주결제" && v.payDow != null && t.dow === v.payDow)
      out.push({ v, kind: "weekly", label: `${v.name} 주 결제일` });
    else if (v.terms === "15일결제" && (t.d === 15 || t.d === lastDay))
      out.push({ v, kind: "settle", label: `${v.name} 정산서 전달일` });
    else if (v.terms === "당월말결제" && t.d === lastDay)
      out.push({ v, kind: "monthend", label: `${v.name} 결제일` });
  });
  return out;
}
/* 금액 포맷: 1200000 → "1,200,000원" */
function fmtWon(n) {
  const v = parseInt(n) || 0;
  return v.toLocaleString("ko-KR") + "원";
}
/* 달력 칸용 짧은 금액: 1200000 → "120만", 5000 → "5천", 작은 값은 그대로 */
function shortWon(n) {
  const v = parseInt(n) || 0;
  if (v >= 10000) {
    const man = v / 10000;
    return (Number.isInteger(man) ? man : Math.round(man)).toLocaleString("ko-KR") + "만";
  }
  if (v >= 1000) return Math.round(v / 1000) + "천";
  return v.toLocaleString("ko-KR");
}

/* 결제 일정 월 달력: 날짜별 결제 합계 표시, 칸 클릭 시 그 날짜로 결제 추가 */
function paymentCalendar(year, month, payList) {
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = UI.todayInput();
  const sumByDate = {};
  const cntByDate = {};
  payList.forEach((x) => {
    sumByDate[x.date] = (sumByDate[x.date] || 0) + x.p.amount;
    cntByDate[x.date] = (cntByDate[x.date] || 0) + 1;
  });
  const wd = ["일", "월", "화", "수", "목", "금", "토"]
    .map((d, i) => `<div class="cal-wd ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${d}</div>`)
    .join("");
  let cells = "";
  for (let i = 0; i < startDay; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = (startDay + d - 1) % 7;
    const hol = holidayName(ds);
    const dayCls = hol || dow === 0 ? "sun" : dow === 6 ? "sat" : "";
    const amt = sumByDate[ds];
    // 업체 결제조건 자동 마커 (주결제/15일 정산서/당월말)
    const markers = vendorMarkersOn(ds)
      .map((m) => `<div class="vmark ${m.kind}" title="${UI.esc(m.label)}">${UI.esc(m.label)}</div>`)
      .join("");
    cells += `
      <div class="cal-cell pay-cell ${ds === today ? "today" : ""}" data-act="pay-add-on" data-date="${ds}" title="이 날짜에 결제 추가">
        <div class="cal-daynum ${dayCls}">${d}</div>
        ${markers}
        ${amt ? `<div class="pay-cell-amt">💰 ${shortWon(amt)}<span class="pay-cell-cnt">${cntByDate[ds]}건</span></div>` : ""}
      </div>`;
  }
  return `<div class="cal-grid pay-cal">${wd}${cells}</div>
    <div class="cal-legend">
      <span><i class="vdot weekly"></i>주 결제일</span>
      <span><i class="vdot settle"></i>정산서 전달일(15일)</span>
      <span><i class="vdot monthend"></i>당월말 결제일</span>
      <span class="muted">날짜 칸을 클릭하면 그 날짜로 (개별) 결제를 추가할 수 있어요</span>
    </div>`;
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
    const dow = (startDay + d - 1) % 7; // 0=일, 6=토
    const hol = holidayName(ds);
    const dayCls = hol || dow === 0 ? "sun" : dow === 6 ? "sat" : "";
    const dayEvents = events.filter((e) => {
      const pay = eventPayment(e);
      if (pay) return payOccursOn(e, pay, ds); // 결제는 반복 규칙으로 표시
      const start = e.date;
      const end = e.end_date || e.date;
      return start && ds >= start && ds <= end;
    });
    const evHtml = dayEvents
      .slice(0, 4)
      .map((e) => {
        const pay = eventPayment(e);
        if (pay) {
          // 결제 건은 💰 업체 + 금액으로 표시, 클릭 시 결제 수정
          return `<div class="cal-ev-wrap">
             <div class="cal-ev is-pay" data-act="pay-edit" data-id="${e.id}" title="${UI.esc(e.title)} ${fmtWon(pay.amount)}">💰 ${UI.esc(e.title)} <b>${fmtWon(pay.amount)}</b></div>
           </div>`;
        }
        return `<div class="cal-ev-wrap">
             <div class="cal-ev ${scopeClass(e)} ${eventLeave(e) ? "is-leave" : ""}" data-act="event-edit" data-id="${
          e.id
        }" title="${UI.esc(e.title)}">${eventLeave(e) ? "🌴 " : ""}${UI.esc(e.title)}</div>
             ${
               Array.isArray(e.participants) && e.participants.length
                 ? `<div class="cal-ev-dots">${memberDots(e.participants)}</div>`
                 : ""
             }
           </div>`;
      })
      .join("");
    const more =
      dayEvents.length > 4
        ? `<div class="cal-more">+${dayEvents.length - 4}</div>`
        : "";
    cells += `
      <div class="cal-cell ${ds === today ? "today" : ""} ${
      hol ? "holiday" : ""
    }" data-act="day-view" data-date="${ds}" title="클릭하면 이 날짜의 일정 전체 보기">
        <div class="cal-daynum ${dayCls}">${d}</div>
        ${hol ? `<div class="cal-holiday" title="${UI.esc(hol)}">${UI.esc(hol)}</div>` : ""}
        ${evHtml}${more}
      </div>`;
  }

  return `<div class="cal-grid">${wd}${cells}</div>
    <div class="cal-legend">
      <span><i class="dot scope-day"></i>일반</span>
      <span><i class="dot scope-week"></i>주별</span>
      <span><i class="dot scope-month"></i>월별</span>
      <span class="muted">날짜 칸을 클릭하면 그 날의 일정을 모아 볼 수 있어요</span>
    </div>`;
}

async function eventForm(existing, presetDate, isLeave) {
  const values = existing
    ? { ...existing, scopes: eventScopes(existing), leave_type: eventLeave(existing) }
    : {
        member_id: curUser(),
        date: presetDate || UI.todayInput(),
        scopes: [],
        // 연차 추가로 열었으면 구분=연차, 대상자=본인 기본 세팅
        leave_type: isLeave ? "연차" : "",
        participants: isLeave && curUser() ? [curUser()] : undefined,
      };
  const res = await UI.formModal({
    title: existing ? "일정 수정" : isLeave ? "연차/휴무 추가" : "일정 추가",
    submitText: existing ? "수정" : "추가",
    values,
    fields: [
      { name: "title", label: "일정 제목 (연차 등은 비워두면 구분명으로 채워짐)", type: "text", full: true },
      { name: "date", label: "시작 날짜", type: "date", required: true },
      { name: "end_date", label: "종료 날짜 (여러 날이면)", type: "date" },
      {
        name: "leave_type",
        label: "휴무/부재 구분 (연차·반차 등 / 일반 일정이면 비움)",
        type: "select",
        options: [
          { value: "", label: "— 일반 일정 —" },
          ...LEAVE_TYPES.map((x) => ({ value: x, label: x })),
        ],
      },
      {
        name: "scopes",
        label: "상단 강조 (둘 다 선택 가능)",
        type: "checks",
        full: true,
        options: [
          { value: "week", label: "주별 일정" },
          { value: "month", label: "월별 일정" },
        ],
      },
      {
        name: "member_id",
        label: "작성자",
        type: "select",
        options: UI.memberOptions(false),
      },
      {
        name: "participants",
        label: "참여자 / 휴무 대상자 (이름 검색해서 추가)",
        type: "memsearch",
        full: true,
        options: UI.memberOptions(false),
      },
      { name: "note", label: "메모", type: "textarea", full: true },
    ],
  });
  if (!res) return;
  // 제목 비었으면 휴무 구분명(또는 '일정')으로 채움
  if (!res.title || !res.title.trim()) res.title = res.leave_type || "일정";
  // 강조(week/month) + 휴무(leave:연차)를 scope 문자열 하나에 인코딩
  // → Supabase에 별도 컬럼 없이도 저장됨(클라우드 모드 호환)
  const tokens = Array.isArray(res.scopes) ? res.scopes.slice() : [];
  if (res.leave_type) tokens.push("leave:" + res.leave_type);
  res.scope = tokens.length ? tokens.join(",") : "day";
  delete res.scopes;
  delete res.leave_type; // 별도 컬럼 저장 안 함(scope에 인코딩됨)
  if (existing) {
    await Store.update("events", existing.id, res);
    UI.toast("일정이 수정되었습니다");
  } else {
    await Store.add("events", res);
    UI.toast("일정이 추가되었습니다");
  }
}

/* ============ 결제(지출) 일정 ============ */
function renderPayments() {
  const ref = App.state.payRef;
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const view = App.state.payView;

  // 이번 달 결제 발생분 (반복 규칙 적용해 occurrence로 펼침)
  const all = [];
  Store.list("events").forEach((e) => {
    const p = eventPayment(e);
    if (!p) return;
    payOccurrencesInMonth(e, p, year, month).forEach((date) => all.push({ e, p, date }));
  });
  all.sort((a, b) => a.date.localeCompare(b.date));

  const monthTotal = all.reduce((s, x) => s + x.p.amount, 0);

  const toggle = `
    <div class="view-toggle">
      <button class="vt ${view === "daily" ? "active" : ""}" data-act="pay-view" data-view="daily">📆 일별 보기</button>
      <button class="vt ${view === "monthly" ? "active" : ""}" data-act="pay-view" data-view="monthly">🏢 업체별 보기</button>
      <button class="vt ${view === "vendors" ? "active" : ""}" data-act="pay-view" data-view="vendors">📇 업체 목록</button>
    </div>`;

  const nav = `
    <div class="cal-toolbar">
      <button class="icon-btn" data-act="pay-year-prev" title="이전 연도">«</button>
      <button class="icon-btn" data-act="pay-prev" title="이전 달">‹</button>
      <strong>${year}년 ${month + 1}월</strong>
      <button class="icon-btn" data-act="pay-next" title="다음 달">›</button>
      <button class="icon-btn" data-act="pay-year-next" title="다음 연도">»</button>
      <button class="btn ghost sm" data-act="pay-today">이번 달</button>
      <span class="pay-total">합계 <b>${fmtWon(monthTotal)}</b> · ${all.length}건</span>
    </div>`;

  let body;
  if (view === "vendors") {
    body = vendorListHTML();
  } else if (!all.length) {
    body = `<div class="empty">${year}년 ${month + 1}월에 등록된 결제 건이 없습니다. '+ 결제 건 추가'로 등록하거나, '📇 업체 목록'에서 업체를 골라 추가하세요.</div>`;
  } else if (view === "daily") {
    // 일별: 발생 날짜별 그룹
    const byDate = {};
    all.forEach((x) => ((byDate[x.date] = byDate[x.date] || []).push(x)));
    body = Object.keys(byDate)
      .sort()
      .map((d) => {
        const items = byDate[d];
        const dayTotal = items.reduce((s, x) => s + x.p.amount, 0);
        const wd = ["일", "월", "화", "수", "목", "금", "토"][ymd(d).dow] || "";
        return `
        <div class="pay-group">
          <div class="pay-group-head">
            <span>📆 ${UI.fmtDate(d)} (${wd})</span>
            <span class="pay-group-sum">${fmtWon(dayTotal)} · ${items.length}건</span>
          </div>
          ${items.map((x) => payRow(x.e, x.p)).join("")}
        </div>`;
      })
      .join("");
  } else {
    // 업체별: 업체(title)별 그룹
    const byVendor = {};
    all.forEach((x) => ((byVendor[x.e.title || "(미지정)"] = byVendor[x.e.title || "(미지정)"] || []).push(x)));
    body = Object.keys(byVendor)
      .sort((a, b) => a.localeCompare(b, "ko"))
      .map((v) => {
        const items = byVendor[v].sort((a, b) => a.date.localeCompare(b.date));
        const vTotal = items.reduce((s, x) => s + x.p.amount, 0);
        return `
        <div class="pay-group">
          <div class="pay-group-head">
            <span>🏢 ${UI.esc(v)}</span>
            <span class="pay-group-sum">${fmtWon(vTotal)} · ${items.length}건</span>
          </div>
          ${items.map((x) => payRow(x.e, x.p, x.date)).join("")}
        </div>`;
      })
      .join("");
  }

  return `
    <section class="view">
      <div class="view-head">
        <h2>💰 결제 일정</h2>
        <button class="btn primary" data-act="pay-add">+ 결제 건 추가</button>
      </div>
      <p class="muted">업체 결제조건이 달력에 자동으로 표시돼요(주 결제일 / 정산서 전달일 / 당월말 결제일). 건별(즉시·익일·선급) 업체는 아래 참고 카드로 확인하세요.</p>
      ${toggle}
      ${
        view === "vendors"
          ? ""
          : `${nav}${paymentCalendar(year, month, all)}${perOrderVendorsCard()}`
      }
      <div class="pay-list">${body}</div>
    </section>`;
}

/* 건별 결제(즉시·익일·선급) 업체 참고 카드 — 고정 결제일이 없어 달력에 안 띄움 */
function perOrderVendorsCard() {
  const groups = ["즉시결제", "익일결제", "선급"]
    .map((term) => {
      const list = getVendors().filter((v) => v.terms === term);
      if (!list.length) return "";
      return `<div class="po-group"><span class="po-term">${term}</span> ${list
        .map((v) => UI.esc(v.name))
        .join(" · ")}</div>`;
    })
    .join("");
  return `
    <div class="per-order-card">
      <div class="po-head">🧾 건별 결제 업체 <span class="muted">(주문마다 결제 · 고정 결제일 없음)</span></div>
      ${groups}
    </div>`;
}

/* 업체 계좌 목록 (결제조건별 그룹) — 각 업체에서 바로 결제 추가 / 수정·삭제 */
function vendorListHTML() {
  const vendors = getVendors();
  const WD = ["일", "월", "화", "수", "목", "금", "토"];
  const groups = VENDOR_TERM_ORDER.map((term) => {
    const list = vendors.map((v, i) => ({ v, i })).filter((x) => x.v.terms === term);
    if (!list.length) return "";
    const recur = termToRecur(term);
    const badgeCls = recur === "monthly" ? "m" : recur === "weekly" ? "w" : "o";
    return `
      <div class="pay-group">
        <div class="pay-group-head">
          <span>◆ ${term} <span class="pay-badge ${badgeCls}">${payRecurLabel(recur)}</span></span>
          <span class="pay-group-sum">${list.length}개 업체</span>
        </div>
        ${list
          .map(
            (x) => `
          <div class="vendor-row">
            <div class="vendor-info">
              <strong>${UI.esc(x.v.name)}</strong>${
              x.v.terms === "주결제" && x.v.payDow != null
                ? ` <span class="vendor-dow">매주 ${WD[x.v.payDow]}요일</span>`
                : ""
            }
              <div class="vendor-acct">🏦 ${UI.esc(x.v.bank || "")} ${UI.esc(x.v.account || "")} <span class="muted">(${UI.esc(x.v.holder || "")})</span></div>
              <div class="vendor-proof muted">증빙: ${UI.esc(x.v.proof || "-")}</div>
            </div>
            <div class="vendor-btns">
              <button class="btn xs primary" data-act="pay-add-vendor" data-idx="${x.i}">+ 결제</button>
              <button class="btn xs ghost" data-act="vendor-edit" data-idx="${x.i}">수정</button>
              <button class="btn xs danger" data-act="vendor-del" data-idx="${x.i}">삭제</button>
            </div>
          </div>`
          )
          .join("")}
      </div>`;
  }).join("");
  return `
    <div class="vendor-listhead">
      <p class="muted">총 ${vendors.length}개 업체 · 결제조건별 정리 — 이름·계좌·결제조건을 직접 수정할 수 있어요</p>
      <button class="btn primary sm" data-act="vendor-add">+ 업체 추가</button>
    </div>
    ${groups}`;
}

/* 업체 추가/수정 폼 (idx=null이면 신규) */
async function vendorForm(idx) {
  const vendors = getVendors().map((v) => ({ ...v }));
  const existing = idx != null ? vendors[idx] : null;
  const values = existing || { terms: "즉시결제", payDow: "" };
  const res = await UI.formModal({
    title: existing ? "업체 수정" : "업체 추가",
    submitText: existing ? "수정" : "추가",
    values: { ...values, payDow: values.payDow == null ? "" : String(values.payDow) },
    fields: [
      { name: "name", label: "업체명", type: "text", required: true, full: true },
      { name: "bank", label: "은행" },
      { name: "account", label: "계좌번호" },
      { name: "holder", label: "예금주", full: true },
      {
        name: "terms",
        label: "결제조건",
        type: "select",
        options: VENDOR_TERM_ORDER.map((t) => ({ value: t, label: t })),
      },
      {
        name: "proof",
        label: "증빙",
        type: "select",
        options: ["세금계산서", "계산서", "현금영수증", "없음"].map((t) => ({ value: t, label: t })),
      },
      {
        name: "payDow",
        label: "주 결제 요일 (주결제만)",
        type: "select",
        options: [
          { value: "", label: "지정 안함" },
          ...["일", "월", "화", "수", "목", "금", "토"].map((d, i) => ({ value: String(i), label: d + "요일" })),
        ],
      },
    ],
  });
  if (!res) return;
  const v = {
    name: (res.name || "").trim(),
    bank: (res.bank || "").trim(),
    account: (res.account || "").trim(),
    holder: (res.holder || "").trim(),
    terms: res.terms || "즉시결제",
    proof: res.proof || "없음",
  };
  if (res.terms === "주결제" && res.payDow !== "") v.payDow = parseInt(res.payDow);
  if (existing) vendors[idx] = v;
  else vendors.push(v);
  await saveVendors(vendors);
  UI.toast(existing ? "업체 정보를 수정했어요" : "업체를 추가했어요");
}

async function deleteVendor(idx) {
  const vendors = getVendors().map((v) => ({ ...v }));
  if (idx < 0 || idx >= vendors.length) return;
  if (!(await UI.confirmBox(`'${vendors[idx].name}' 업체를 목록에서 삭제할까요?`))) return;
  vendors.splice(idx, 1);
  await saveVendors(vendors);
  UI.toast("업체를 삭제했어요");
}

/* 결제 건 한 줄 (occDate가 주어지면 업체명 대신 그 발생 날짜를 앞세움) */
function payRow(e, p, occDate) {
  const head = occDate ? UI.fmtDate(occDate) : UI.esc(e.title || "(업체 미지정)");
  const badgeCls = p.recur === "monthly" ? "m" : p.recur === "weekly" ? "w" : "o";
  return `
    <div class="pay-row">
      <span class="pay-badge ${badgeCls}">${payRecurLabel(p.recur)}</span>
      <span class="pay-vendor clickable" data-act="pay-edit" data-id="${e.id}">${head}</span>
      <span class="pay-amount">${fmtWon(p.amount)}</span>
      ${e.note ? `<span class="pay-note">${UI.esc(e.note)}</span>` : ""}
      <span class="pay-actions">
        <button class="btn xs ghost" data-act="pay-edit" data-id="${e.id}">수정</button>
        <button class="btn xs danger" data-act="pay-del" data-id="${e.id}">삭제</button>
      </span>
    </div>`;
}

async function paymentForm(existing, presetDate, vendor) {
  const p = existing ? eventPayment(existing) || { recur: "once", amount: 0 } : null;
  let values;
  if (existing) {
    values = {
      title: existing.title,
      date: existing.date,
      recur: p.recur,
      amount: String(p.amount || ""),
      note: existing.note || "",
      member_id: existing.member_id || curUser(),
    };
  } else if (vendor) {
    // 업체 목록에서 선택 → 계좌·결제조건 자동 입력
    const recur = termToRecur(vendor.terms);
    let date = UI.todayInput();
    const now = new Date();
    if (vendor.terms === "15일결제") date = fmtYMD(new Date(now.getFullYear(), now.getMonth(), 15));
    else if (vendor.terms === "당월말결제") date = fmtYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    values = {
      title: vendor.name,
      date,
      recur,
      member_id: curUser(),
      note: `${vendor.bank} ${vendor.account} (${vendor.holder})\n증빙: ${vendor.proof} · 조건: ${vendor.terms}`,
    };
  } else {
    values = {
      date: presetDate || UI.todayInput(),
      recur: "monthly",
      member_id: curUser(),
    };
  }
  const res = await UI.formModal({
    title: existing ? "결제 건 수정" : "결제 건 추가",
    submitText: existing ? "수정" : "추가",
    values,
    fields: [
      { name: "title", label: "업체명", type: "text", required: true, full: true },
      { name: "amount", label: "금액 (숫자)", type: "text", required: true, placeholder: "예: 1200000" },
      {
        name: "recur",
        label: "반복 (결제 주기)",
        type: "select",
        options: [
          { value: "once", label: "한 번만 (지정한 날짜에)" },
          { value: "weekly", label: "매주 (기준일의 요일마다)" },
          { value: "monthly", label: "매월 (기준일의 날짜마다)" },
        ],
      },
      { name: "date", label: "결제일 / 반복 기준일", type: "date", required: true },
      { name: "note", label: "세부 내역 (품목·계좌 등)", type: "textarea", full: true },
    ],
  });
  if (!res) return;
  const amount = parseInt(String(res.amount).replace(/[^0-9]/g, "")) || 0;
  const payload = {
    title: (res.title || "").trim() || "(업체 미지정)",
    date: res.date,
    note: res.note || "",
    member_id: res.member_id || curUser(),
    scope: `pay:${res.recur || "once"}:${amount}`,
  };
  if (existing) {
    await Store.update("events", existing.id, payload);
    UI.toast("결제 건이 수정되었습니다");
  } else {
    await Store.add("events", payload);
    UI.toast("결제 건이 추가되었습니다");
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
              ? `<div class="res-thumb clickable" data-act="res-view" data-id="${r.id}" title="클릭하면 크게 보기"><img src="${UI.esc(r.image_data)}" alt=""></div>`
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

/* data URL(MIME)에서 다운로드용 확장자 추출 */
function dataUrlExt(dataUrl) {
  const m = /^data:image\/([a-zA-Z0-9.+-]+)/.exec(dataUrl || "");
  if (!m) return ".png";
  let ext = m[1].toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  if (ext === "svg+xml") ext = "svg";
  return "." + ext;
}

/* 자료실 이미지 크게 보기 + 저장(다운로드) 뷰어 */
function openImageViewer(r) {
  if (!r || !r.image_data) return;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay img-viewer";
  overlay.innerHTML = `
    <div class="img-viewer-box">
      <div class="img-viewer-head">
        <strong>${UI.esc(r.title || "이미지")}</strong>
        <div class="img-viewer-actions">
          <button class="btn ghost sm" data-download>⬇ 저장</button>
          <button class="icon-btn" data-close title="닫기">✕</button>
        </div>
      </div>
      <div class="img-viewer-body"><img src="${UI.esc(r.image_data)}" alt="${UI.esc(r.title || "")}"></div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("[data-close]").onclick = close;
  overlay.querySelector("[data-download]").onclick = () => {
    const a = document.createElement("a");
    a.href = r.image_data;
    a.download = (r.title || "이미지").replace(/[\\/:*?"<>|]/g, "_") + dataUrlExt(r.image_data);
    document.body.appendChild(a);
    a.click();
    a.remove();
    UI.toast("이미지를 저장했어요");
  };
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
    ? items.map((m) => meetingCard(m)).join("")
    : `<div class="empty">미팅 기록이 없습니다.</div>`;
  return `
    <div class="sub-head">
      <p class="muted">상단 '회의록' 탭과 같은 데이터입니다. 여기서도 추가/수정할 수 있어요.</p>
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
/* meetingId를 넘기면 '완료' 칸이 클릭 가능한 토글 버튼으로 렌더됨(카드용).
   넘기지 않으면 정적 아이콘으로 렌더(PNG 시트/캡처용). */
function meetingItemsTable(items, meetingId) {
  if (!Array.isArray(items) || !items.length) return "";
  const rows = items
    .map((it, i) => {
      const check = meetingId
        ? `<button type="button" class="mi-check ${it.done ? "on" : ""}" data-act="meeting-item-toggle" data-id="${meetingId}" data-idx="${i}" aria-pressed="${it.done ? "true" : "false"}" title="완료 표시 전환">${it.done ? "✅" : "⬜"}</button>`
        : it.done ? "✅" : "⬜";
      return `
      <tr class="${it.done ? "done" : ""}">
        <td class="ta-c">${check}</td>
        <td>${UI.esc(it.agenda || "")}${it.sent ? ` <span class="mi-sent" title="할일로 보냄">📋 할일</span>` : ""}</td>
        <td class="ta-c">${it.owner ? UI.esc(it.owner) : "-"}</td>
        <td class="ta-c nowrap">${it.due ? UI.fmtDate(it.due) : "-"}</td>
      </tr>`;
    })
    .join("");
  return `
    <table class="meeting-items">
      <thead><tr><th>완료</th><th>안건 및 결과</th><th>담당</th><th>기한</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function meetingCard(m) {
  return `
    <div class="card meeting-card">
      <div class="meeting-head">
        <div class="meeting-title-row">
          ${m.category ? `<span class="meeting-cat">${UI.esc(m.category)}</span>` : ""}
          <strong>${UI.esc(m.title)}</strong>
        </div>
        <span class="muted">📅 ${UI.fmtDate(m.date)}${m.time ? " " + UI.esc(m.time) : ""}</span>
      </div>
      <div class="meeting-fields">
        ${m.location ? `<span><b>장소</b> ${UI.esc(m.location)}</span>` : ""}
        ${m.attendees ? `<span><b>참석자</b> ${UI.esc(m.attendees)}</span>` : ""}
        <span><b>F/u</b> ${m.fu_status ? "✅ 완료" : "⬜ 미완료"}</span>
      </div>
      ${meetingItemsTable(m.items, m.id)}
      ${m.agenda ? `<div class="meeting-row"><b>안건</b><div>${UI.nl2br(m.agenda)}</div></div>` : ""}
      ${m.body ? `<div class="meeting-row"><b>내용</b><div>${UI.nl2br(m.body)}</div></div>` : ""}
      ${m.remarks ? `<div class="meeting-row"><b>비고</b><div>${UI.nl2br(m.remarks)}</div></div>` : ""}
      <div class="card-meta">작성: ${UI.memberChip(m.member_id)}</div>
      <div class="card-actions">
        ${
          Array.isArray(m.items) && m.items.some((it) => (it.agenda || "").trim())
            ? `<button class="btn xs primary" data-act="meeting-to-tasks" data-id="${m.id}">📋 할일로 보내기</button>`
            : ""
        }
        <button class="btn xs ghost" data-act="meeting-image" data-id="${m.id}">🖼️ 이미지</button>
        <button class="btn xs ghost" data-act="meeting-duplicate" data-id="${m.id}">📑 복제</button>
        <button class="btn xs ghost" data-act="meeting-edit" data-id="${m.id}">수정</button>
        <button class="btn xs danger" data-act="meeting-del" data-id="${m.id}">삭제</button>
      </div>
    </div>`;
}

/* 담당자 텍스트(예: '김수영 사원') → 멤버 id 매칭 (직급 제거 후 이름 매칭) */
function matchMemberByName(owner) {
  const raw = (owner || "").trim();
  if (!raw) return "";
  const cleaned = raw
    .replace(/(사원|주임|대리|과장|차장|부장|팀장|실장|이사|대표이사|대표|사장|전무|상무|선임|책임|수석|님)/g, "")
    .trim();
  const members = Store.list("members");
  let m = members.find((x) => x.name === cleaned);
  if (m) return m.id;
  m = members.find((x) => x.name && (cleaned.includes(x.name) || raw.includes(x.name)));
  return m ? m.id : "";
}

/* 회의록 액션아이템 → 할일로 추가 (이미 보낸 항목은 건너뜀) */
async function meetingToTasks(meeting) {
  if (!meeting || !Array.isArray(meeting.items)) return;
  const targets = meeting.items
    .map((it, i) => ({ it, i }))
    .filter((x) => (x.it.agenda || "").trim() && !x.it.done && !x.it.sent);
  if (!targets.length) {
    UI.toast("할일로 보낼 새 액션아이템이 없어요(이미 보냈거나 완료됨)", "warn");
    return;
  }
  if (!(await UI.confirmBox(`액션아이템 ${targets.length}개를 할일로 추가할까요?`))) return;
  const sentIdx = new Set(targets.map((x) => x.i));
  for (const { it } of targets) {
    const assignee = matchMemberByName(it.owner);
    const ref = `회의: ${meeting.title || ""}${meeting.date ? " (" + UI.fmtDate(meeting.date) + ")" : ""}`;
    const detail = !assignee && it.owner ? `${ref}\n담당(미매칭): ${it.owner}` : ref;
    await Store.add("tasks", {
      title: it.agenda.trim(),
      assignee_id: assignee,
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(it.due || "") ? it.due : "",
      status: "todo",
      detail,
    });
  }
  // 보낸 항목 표시(중복 방지)
  const newItems = meeting.items.map((it, i) =>
    sentIdx.has(i) ? { ...it, sent: true } : it
  );
  await Store.update("meetings", meeting.id, { items: newItems });
  UI.toast(`${targets.length}개를 할일로 추가했어요`);
}

/* 회의록 제출/저장용 시트 (PNG 캡처 대상) */
function meetingSheetHTML(m) {
  const itemsTable = meetingItemsTable(m.items);
  const metaRows = [
    `<div><span>일시</span><b>${UI.fmtDate(m.date)}${m.time ? " " + UI.esc(m.time) : ""}</b></div>`,
    m.category ? `<div><span>구분</span><b>${UI.esc(m.category)}</b></div>` : "",
    m.location ? `<div><span>장소</span><b>${UI.esc(m.location)}</b></div>` : "",
    m.attendees ? `<div><span>참석자</span><b>${UI.esc(m.attendees)}</b></div>` : "",
    `<div><span>F/u</span><b>${m.fu_status ? "✅ 완료" : "⬜ 미완료"}</b></div>`,
  ]
    .filter(Boolean)
    .join("");
  return `
    <div class="report-sheet">
      <h1>회의록</h1>
      <div class="rs-meta">${metaRows}</div>
      <section><h3>${UI.esc(m.title)}</h3>${itemsTable || ""}</section>
      ${m.agenda ? `<section><h3>안건</h3><div>${UI.nl2br(m.agenda)}</div></section>` : ""}
      ${m.body ? `<section><h3>내용</h3><div>${UI.nl2br(m.body)}</div></section>` : ""}
      ${m.remarks ? `<section><h3>비고</h3><div>${UI.nl2br(m.remarks)}</div></section>` : ""}
    </div>`;
}

function meetingToText(m) {
  const lines = [`[회의록] ${m.title || ""}`];
  lines.push(`일시: ${UI.fmtDate(m.date)}${m.time ? " " + m.time : ""}`);
  if (m.category) lines.push(`구분: ${m.category}`);
  if (m.location) lines.push(`장소: ${m.location}`);
  if (m.attendees) lines.push(`참석자: ${m.attendees}`);
  lines.push(`F/u: ${m.fu_status ? "완료" : "미완료"}`);
  if (Array.isArray(m.items) && m.items.length) {
    lines.push("\n[안건 및 결과]");
    m.items.forEach((it) =>
      lines.push(
        `- ${it.done ? "[완료] " : ""}${it.agenda || ""}` +
          `${it.owner ? ` (담당: ${it.owner})` : ""}` +
          `${it.due ? ` (기한: ${UI.fmtDate(it.due)})` : ""}`
      )
    );
  }
  if (m.agenda) lines.push(`\n[안건]\n${m.agenda}`);
  if (m.body) lines.push(`\n[내용]\n${m.body}`);
  if (m.remarks) lines.push(`\n[비고]\n${m.remarks}`);
  return lines.join("\n");
}

function openMeetingImage(m) {
  if (!m) return;
  const fname = `회의록_${(m.title || "").slice(0, 30)}_${m.date || ""}`;
  openSheetModal(meetingSheetHTML(m), meetingToText(m), fname, "회의록 이미지 저장");
}

function meetingListHTML(q) {
  const ql = (q || "").trim().toLowerCase();
  const items = Store.list("meetings")
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .filter((m) => {
      if (!ql) return true;
      const items = Array.isArray(m.items)
        ? m.items.map((it) => (it.agenda || "") + " " + (it.owner || "")).join(" ")
        : "";
      const hay = [
        m.title, m.category, m.location, m.attendees, m.agenda, m.body, m.remarks,
        items, m.date, UI.fmtDate(m.date),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(ql);
    });
  return items.length
    ? items.map((m) => meetingCard(m)).join("")
    : `<div class="empty">${
        ql ? "검색 결과가 없습니다." : '작성된 회의록이 없습니다. "+ 회의록 작성"으로 양식을 불러와 작성하세요.'
      }</div>`;
}

function renderMinutes() {
  return `
    <section class="view">
      <div class="view-head">
        <h2>회의록</h2>
        <button class="btn primary" data-act="meeting-add">+ 회의록 작성</button>
      </div>
      <p class="muted">모든 회의에는 목적이 있죠. 회의가 끝나면 안건·결과·후속과제(담당/기한)까지 기록해 챙겨보세요.</p>
      <input id="minutesSearch" class="search-box" type="search" placeholder="🔍 제목·내용·날짜로 검색…" value="${UI.esc(
        App.state.minutesSearch
      )}">
      <div class="list" id="minutesList">${meetingListHTML(App.state.minutesSearch)}</div>
    </section>`;
}

async function meetingForm(existing) {
  const values = existing
    ? { ...existing, fu_status: existing.fu_status ? "yes" : "" }
    : {
        member_id: curUser(),
        date: UI.todayInput(),
        attendees: Store.list("members")
          .map((m) => m.name)
          .join(", "),
        items: [{}, {}],
      };
  const res = await UI.formModal({
    title: existing ? "회의록 수정" : "회의록 작성",
    submitText: existing ? "수정" : "저장",
    values,
    fields: [
      { name: "title", label: "회의명", type: "text", required: true, full: true },
      { name: "category", label: "구분", type: "text", placeholder: "예: 정기회의 / 업무1" },
      { name: "date", label: "회의일시 (날짜)", type: "date", required: true },
      { name: "time", label: "시간", type: "text", placeholder: "예: 오전 10:00" },
      { name: "location", label: "회의장소", type: "text" },
      {
        name: "member_id",
        label: "작성자",
        type: "select",
        options: UI.memberOptions(false),
      },
      { name: "attendees", label: "참석자", type: "text", full: true },
      { name: "items", label: "안건 및 결과", type: "items", full: true },
      { name: "body", label: "회의 내용 / 메모", type: "textarea", rows: 4, full: true },
      { name: "remarks", label: "비고", type: "text", full: true },
      {
        name: "fu_status",
        label: "F/u 상태 (후속과제 완료)",
        type: "select",
        options: [
          { value: "", label: "⬜ 미완료" },
          { value: "yes", label: "✅ 완료" },
        ],
      },
    ],
  });
  if (!res) return;
  res.fu_status = res.fu_status === "yes";
  if (existing) await Store.update("meetings", existing.id, res);
  else await Store.add("meetings", res);
  UI.toast("회의록이 저장되었습니다");
}

async function duplicateMeeting(id) {
  const m = Store.list("meetings").find((x) => x.id === id);
  if (!m) return;
  const copy = {
    title: m.title + " (복사본)",
    category: m.category,
    date: UI.todayInput(),
    time: m.time,
    location: m.location,
    attendees: m.attendees,
    items: Array.isArray(m.items) ? m.items.map((it) => ({ ...it, done: false })) : [],
    body: m.body,
    remarks: m.remarks,
    fu_status: false,
    member_id: curUser() || m.member_id,
  };
  await Store.add("meetings", copy);
  UI.toast("복제되었습니다");
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
function reportListHTML(tab, q) {
  const ql = (q || "").trim().toLowerCase();
  const items = Store.list("reports")
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .filter((r) =>
      tab === "weekly"
        ? r.kind === "weekly"
        : tab === "monthly"
        ? r.kind === "monthly"
        : isDailyReport(r)
    )
    .filter((r) => {
      if (!ql) return true;
      const hay = [
        r.done, r.todo, r.note, r.period, r.date, UI.fmtDate(r.date),
        UI.memberName(r.member_id),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(ql);
    });
  const cardFn = tab === "daily" ? dailyCard : planCard;
  return items.length
    ? items.map((r) => cardFn(r)).join("")
    : `<div class="empty">${ql ? "검색 결과가 없습니다." : "작성된 보고서가 없습니다."}</div>`;
}

function renderReports() {
  const tab = App.state.reportTab;
  const toggle = `
    <div class="view-toggle">
      <button class="vt ${tab === "collect" ? "active" : ""}" data-act="report-tab" data-tab="collect">📅 일일 보고 (날짜별 취합)</button>
      <button class="vt ${tab === "weekly" ? "active" : ""}" data-act="report-tab" data-tab="weekly">🗓️ 주간 계획</button>
      <button class="vt ${tab === "monthly" ? "active" : ""}" data-act="report-tab" data-tab="monthly">📆 월간 계획</button>
    </div>`;

  // 일일 보고 (날짜별 취합) - 기본 탭
  if (tab === "collect") {
    return `
      <section class="view">
        <div class="view-head">
          <h2>일일 보고 (날짜별 취합)</h2>
          <div class="head-btns">
            <button class="btn ghost" data-act="report-auto">⚡ 오늘 활동으로 자동생성</button>
            <button class="btn primary" data-act="report-add">+ 보고서 작성</button>
          </div>
        </div>
        <p class="muted">'자동생성'은 오늘 완료/진행한 업무로 초안을 만들어요. 달력에서 날짜를 클릭하면 그날 팀원들의 일일보고를 모아 보고, 한 장의 PNG로 저장할 수 있어요.</p>
        ${toggle}
        ${renderReportsCollect()}
      </section>`;
  }

  let head;
  if (tab === "weekly") {
    head = `
      <div class="view-head">
        <h2>주간 계획 보고서</h2>
        <div class="head-btns">
          <button class="btn ghost" data-act="wreport-auto">⚡ 이번 주 일정·업무로 자동생성</button>
          <button class="btn primary" data-act="wreport-add">+ 주간 계획 작성</button>
        </div>
      </div>
      <p class="muted">이번 주에 할 일을 미리 계획해 작성/공유하세요. '자동생성'은 이번 주 일정과 미완료 업무를 모아 초안을 만듭니다.</p>`;
  } else if (tab === "monthly") {
    head = `
      <div class="view-head">
        <h2>월간 계획 보고서</h2>
        <div class="head-btns">
          <button class="btn ghost" data-act="mreport-auto">⚡ 이달 일정·업무로 자동생성</button>
          <button class="btn primary" data-act="mreport-add">+ 월간 계획 작성</button>
        </div>
      </div>
      <p class="muted">이달에 할 일을 미리 계획해 작성/공유하세요. '자동생성'은 이달 일정과 목표·미완료 업무를 모아 초안을 만듭니다.</p>`;
  } else {
    head = `
      <div class="view-head">
        <h2>일일 보고서</h2>
        <div class="head-btns">
          <button class="btn ghost" data-act="report-auto">⚡ 오늘 활동으로 자동생성</button>
          <button class="btn primary" data-act="report-add">+ 보고서 작성</button>
        </div>
      </div>
      <p class="muted">하루 동안 한 일을 보고서 형태로 기록하고 공유하세요. '자동생성'은 오늘 완료/진행한 업무를 모아 초안을 만듭니다.</p>`;
  }

  return `
    <section class="view">
      ${head}
      ${toggle}
      <input id="reportSearch" class="search-box" type="search" placeholder="🔍 내용·날짜·작성자로 검색…" value="${UI.esc(
        App.state.reportSearch
      )}">
      <div class="list" id="reportList">${reportListHTML(tab, App.state.reportSearch)}</div>
    </section>`;
}

function dailyCard(r) {
  const fb = reportFeedback(r);
  return `
    <div class="card report-card">
      <div class="card-top">
        <strong>${UI.fmtDate(r.date)} 일일 보고</strong>
        ${UI.memberChip(r.member_id)}
      </div>
      ${r.done ? `<div class="report-row"><b>오늘 한 일</b><div>${reportRich(r.done)}</div></div>` : ""}
      ${r.todo ? `<div class="report-row"><b>내일 할 일</b><div>${reportRich(r.todo)}</div></div>` : ""}
      ${r.note ? `<div class="report-row"><b>특이사항</b><div>${reportRich(r.note)}</div></div>` : ""}
      <div class="report-feedback">
        <label class="fb-label">💬 피드백</label>
        <textarea class="fb-input" data-fb-id="${r.id}" rows="2" placeholder="이 보고서에 대한 피드백을 직접 입력하세요…">${UI.esc(fb)}</textarea>
        <button class="btn xs primary fb-save" data-act="report-feedback-save" data-id="${r.id}">피드백 저장</button>
      </div>
      <div class="card-actions">
        <button class="btn xs primary" data-act="report-submit" data-id="${r.id}">📄 제출 양식</button>
        <button class="btn xs ghost" data-act="report-copy" data-id="${r.id}">📋 복사</button>
        <button class="btn xs ghost" data-act="report-edit" data-id="${r.id}">수정</button>
        <button class="btn xs danger" data-act="report-del" data-id="${r.id}">삭제</button>
      </div>
    </div>`;
}

/* 일일보고 피드백 저장 위치: daily 보고가 쓰지 않는 period 칸을 재활용
   → 클라우드(Supabase) 스키마 변경 없이 실시간 공유됨 */
function reportFeedback(r) {
  return (r && isDailyReport(r) && r.period) || "";
}

/* 휴무(연차 등)인 사람의 자동 보고 카드 — 보고서 작성 없이 캘린더 연차로 자동 표시 */
function leaveCard(m, lv, date) {
  return `
    <div class="card report-card leave-card">
      <div class="card-top">
        <strong>${UI.fmtDate(date)} 일일 보고</strong>
        ${UI.memberChip(m.id)}
      </div>
      <div class="report-row"><b>오늘 한 일</b><div>🌴 ${UI.esc(lv)}</div></div>
      <div class="card-meta muted">캘린더 연차 등록으로 자동 표시돼요</div>
    </div>`;
}

function planCard(r) {
  const meta = reportMeta(r);
  const editAct = r.kind === "monthly" ? "mreport-edit" : "wreport-edit";
  const icon = r.kind === "monthly" ? "📆" : "🗓️";
  return `
    <div class="card report-card weekly">
      <div class="card-top">
        <strong>${icon} ${UI.esc(r.period || UI.fmtDate(r.date))} ${
    r.kind === "monthly" ? "월간 계획" : "주간 계획"
  }</strong>
        ${UI.memberChip(r.member_id)}
      </div>
      ${r.progress ? progressBar(r.progress, meta.progressLabel) : ""}
      ${r.done ? `<div class="report-row"><b>${meta.s1}</b><div>${reportRich(r.done)}</div></div>` : ""}
      ${r.todo ? `<div class="report-row"><b>${meta.s2}</b><div>${reportRich(r.todo)}</div></div>` : ""}
      ${r.note ? `<div class="report-row"><b>${meta.s3}</b><div>${reportRich(r.note)}</div></div>` : ""}
      <div class="card-actions">
        <button class="btn xs primary" data-act="report-submit" data-id="${r.id}">📄 제출 양식</button>
        <button class="btn xs ghost" data-act="report-copy" data-id="${r.id}">📋 복사</button>
        <button class="btn xs ghost" data-act="${editAct}" data-id="${r.id}">수정</button>
        <button class="btn xs danger" data-act="report-del" data-id="${r.id}">삭제</button>
      </div>
    </div>`;
}

/* ===== 날짜별 취합 보기 ===== */
function renderReportsCollect() {
  const date = App.state.reportDate || UI.todayInput();
  const dayReports = Store.list("reports")
    .filter((r) => isDailyReport(r) && r.date === date)
    .sort((a, b) => memberOrder(a.member_id) - memberOrder(b.member_id));
  const reportedIds = new Set(dayReports.map((r) => r.member_id));

  // 그 날 휴무(연차 등)인데 보고서를 안 쓴 사람 → 자동 '연차' 카드 생성
  const leaveMembers = Store.list("members")
    .map((m) => ({ m, lv: leaveLabelFor(m.id, date) }))
    .filter((x) => x.lv && !reportedIds.has(x.m.id))
    .sort((a, b) => memberOrder(a.m.id) - memberOrder(b.m.id));

  const total = dayReports.length + leaveMembers.length;
  const cards = total
    ? dayReports.map((r) => dailyCard(r)).join("") +
      leaveMembers.map((x) => leaveCard(x.m, x.lv, date)).join("")
    : `<div class="empty">${UI.fmtDate(date)}에 작성된 일일보고가 없습니다.</div>`;

  const leaveNote = leaveMembers.length
    ? ` <span class="muted" style="font-weight:600">(🌴 연차 ${leaveMembers.length}명 자동 포함)</span>`
    : "";

  return `
    ${reportCollectCalendar()}
    <div class="collect-head">
      <h3>📅 ${UI.fmtDate(date)} · 일일보고 ${total}건${leaveNote}</h3>
      <button class="btn primary" data-act="report-combine" data-date="${date}" ${
    total ? "" : "disabled"
  }>📄 취합 제출 양식 (${total}명)</button>
    </div>
    <div class="list">${cards}</div>`;
}

function reportCollectCalendar() {
  const ref = App.state.reportCalRef;
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const selected = App.state.reportDate || UI.todayInput();
  const today = UI.todayInput();

  // 날짜별 일일보고 개수
  const countByDate = {};
  Store.list("reports")
    .filter((r) => isDailyReport(r) && r.date)
    .forEach((r) => (countByDate[r.date] = (countByDate[r.date] || 0) + 1));

  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const wd = ["일", "월", "화", "수", "목", "금", "토"]
    .map((d, i) => `<div class="cal-wd ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${d}</div>`)
    .join("");

  let cells = "";
  for (let i = 0; i < startDay; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const n = countByDate[ds] || 0;
    cells += `
      <div class="cal-cell collect-cell ${ds === selected ? "selected" : ""} ${
      ds === today ? "today" : ""
    }" data-act="report-date" data-date="${ds}">
        <div class="cal-daynum">${d}</div>
        ${n ? `<div class="collect-badge">📄 ${n}</div>` : ""}
      </div>`;
  }

  return `
    <div class="cal-toolbar">
      <button class="icon-btn" data-act="report-cal-prev">‹</button>
      <strong>${year}년 ${month + 1}월</strong>
      <button class="icon-btn" data-act="report-cal-next">›</button>
      <button class="btn ghost sm" data-act="report-cal-today">오늘</button>
    </div>
    <div class="cal-grid collect-grid">${wd}${cells}</div>`;
}

/* hex 두 색을 비율로 섞기 (CSS color-mix 대체 — html2canvas 호환용)
   color-mix()는 최신 브라우저에서 oklab/color(srgb)로 계산돼 html2canvas가
   파싱하지 못하므로, 캡처 대상에는 미리 계산한 rgb 값을 인라인으로 넣는다. */
function hexToRgb(h) {
  let s = String(h || "").trim().replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function mixHex(hexA, hexB, pctA) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA; // 파싱 실패 시 원본 색 사용
  const p = Math.max(0, Math.min(100, pctA)) / 100;
  const m = (x, y) => Math.round(x * p + y * (1 - p));
  return `rgb(${m(a.r, b.r)}, ${m(a.g, b.g)}, ${m(a.b, b.b)})`;
}

function combinedSheetHTML(date) {
  const members = Store.list("members"); // 등록 순서
  const reps = Store.list("reports").filter(
    (r) => isDailyReport(r) && r.date === date
  );
  const byMember = {};
  reps.forEach((r) => (byMember[r.member_id] = r));
  const written = members.filter((m) => byMember[m.id]).length;

  const blocks = members
    .map((m) => {
      const r = byMember[m.id];
      const color = m.color || "#64748b";
      const lv = leaveLabelFor(m.id, date);
      const body = r
        ? `
        <div class="cmb-row"><b>오늘 한 일</b><div>${r.done ? reportRich(r.done) : "-"}</div></div>
        <div class="cmb-row"><b>내일 할 일</b><div>${r.todo ? reportRich(r.todo) : "-"}</div></div>
        ${r.note ? `<div class="cmb-row"><b>특이사항</b><div>${reportRich(r.note)}</div></div>` : ""}`
        : lv
        ? `<div class="cmb-empty leave">🌴 ${UI.esc(lv)}</div>`
        : `<div class="cmb-empty">미작성</div>`;
      const nameStyle = `background:${mixHex(color, "#ffffff", 16)};color:${mixHex(color, "#1f2937", 80)}`;
      return `
        <div class="cmb-card ${r ? "" : lv ? "is-leave" : "is-empty"}" style="--c:${UI.esc(color)}">
          <div class="cmb-head"><span class="cmb-name" style="${nameStyle}">${UI.esc(m.name)}</span></div>
          <div class="cmb-body">${body}</div>
        </div>`;
    })
    .join("");

  return `
    <div class="report-sheet combined">
      <h1>일일 업무 보고서</h1>
      <div class="rs-meta">
        <div><span>일자</span><b>${UI.fmtDate(date)}</b></div>
        <div><span>작성</span><b>${written} / ${members.length}명</b></div>
      </div>
      <div class="combined-grid">${blocks}</div>
    </div>`;
}

function openCombinedReport(date) {
  const members = Store.list("members");
  const reps = Store.list("reports").filter((r) => isDailyReport(r) && r.date === date);
  const hasLeave = members.some((m) => leaveLabelFor(m.id, date));
  if (!reps.length && !hasLeave) return;
  const byMember = {};
  reps.forEach((r) => (byMember[r.member_id] = r));
  const text = members
    .map((m) => {
      if (byMember[m.id]) return reportToText(byMember[m.id]);
      const lv = leaveLabelFor(m.id, date);
      return lv
        ? `[${UI.memberName(m.id)}] ${lv}`
        : `[${UI.memberName(m.id)}] 미작성`;
    })
    .join("\n\n────────────\n\n");
  openSheetModal(combinedSheetHTML(date), text, `일일보고_취합_${date}`);
}

/* opts: { doneIds, todoIds, detailIds } 선택 목록.
   doneIds/todoIds가 주어지면 그 업무만 포함, 없으면 전부 포함.
   detailIds는 '오늘 한 일'에서 상세내용까지 넣을 업무 */
function buildAutoReportDraft(opts) {
  opts = opts || {};
  const detailSet = new Set(opts.detailIds || []);
  const doneSel = opts.doneIds ? new Set(opts.doneIds) : null;
  const todoSel = opts.todoIds ? new Set(opts.todoIds) : null;
  const inDone = (t) => !doneSel || doneSel.has(t.id);
  const inTodo = (t) => !todoSel || todoSel.has(t.id);
  const today = UI.todayInput();
  const me = curUser();
  const mineTasks = Store.list("tasks").filter((t) => !me || t.assignee_id === me);
  // 오늘 완료한 일
  const doneToday = mineTasks.filter(
    (t) =>
      t.status === "done" &&
      (t.updated_at || t.created_at || "").slice(0, 10) === today
  );
  // 진행 중인 일 (진행률 포함)
  const doingTasks = mineTasks.filter((t) => t.status === "doing");
  const todoTasks = mineTasks.filter((t) => t.status === "todo");
  const meetingsToday = Store.list("meetings").filter((m) => m.date === today);

  // 오늘 한 일 줄: 제목은 - 로. 선택된 업무의 상세내용은 한 덩어리로 붙이되
  // 맨 첫 줄에만 • 를 한 번 표시하고, 나머지 줄은 들여쓰기만(마커 없음)
  const fmtDone = (t, suffix) => {
    const title = `- ${t.title}${suffix ? " " + suffix : ""}`;
    const detail = (t.detail || "").trim();
    if (!detailSet.has(t.id) || !detail) return title;
    const body = detail
      .split(/\r?\n/)
      .map((s, i) => {
        const line = s.trim();
        if (i === 0) return "  • " + line;
        return line ? "    " + line : "";
      })
      .join("\n");
    return title + "\n" + body;
  };

  const doneLines = [];
  // 휴무/부재(연차 등)면 '오늘 한 일' 맨 위에 자동 기입
  const myLeave = leaveLabelFor(me, today);
  if (myLeave) doneLines.push(`- [${myLeave}]`);
  // 오늘 한 일: 완료한 일 + 실제로 진행한 일(진행률 > 0) — 선택된 것만, 진행률(%) 표기 안 함
  doneToday.filter(inDone).forEach((t) => doneLines.push(fmtDone(t, "완료")));
  doingTasks
    .filter((t) => (parseInt(t.progress) || 0) > 0)
    .filter(inDone)
    .forEach((t) => doneLines.push(fmtDone(t)));
  meetingsToday.forEach((m) => doneLines.push("- (회의) " + m.title));

  // 내일 할 일: '할 일(todo)' + 진행 중 업무(진행률 % 표시) — 선택된 것만 (멈춤 업무는 제외)
  const todoLines = [];
  todoTasks.filter(inTodo).forEach((t) => todoLines.push("- " + t.title));
  doingTasks.filter(inTodo).forEach((t) => {
    const p = parseInt(t.progress) || 0;
    todoLines.push("- " + t.title + (p > 0 ? ` (진행 ${p}%)` : ""));
  });

  return {
    member_id: me,
    date: today,
    done: doneLines.join("\n"),
    todo: todoLines.join("\n"),
    note: "",
  };
}

/* 자동생성: 보고서에 넣을 업무를 직접 골라서 초안 생성 */
async function startAutoReport() {
  const today = UI.todayInput();
  const me = curUser();
  const mine = Store.list("tasks").filter((t) => !me || t.assignee_id === me);

  const doneToday = mine.filter(
    (t) =>
      t.status === "done" &&
      (t.updated_at || t.created_at || "").slice(0, 10) === today
  );
  const doingProg = mine.filter(
    (t) => t.status === "doing" && (parseInt(t.progress) || 0) > 0
  );
  const todoTasks = mine.filter((t) => t.status === "todo");
  const doingAll = mine.filter((t) => t.status === "doing");

  const doneCands = [...doneToday, ...doingProg]; // 오늘 한 일 후보
  const todoCands = [...todoTasks, ...doingAll]; // 내일 할 일 후보 (멈춤은 제외)
  const detailCands = doneCands.filter((t) => (t.detail || "").trim());

  // 넣을 만한 업무가 전혀 없으면 빈 양식으로 바로 작성
  if (!doneCands.length && !todoCands.length) {
    return reportForm(null, buildAutoReportDraft());
  }

  const doneLabel = (t) =>
    t.status === "done"
      ? `${t.title} · 완료`
      : `${t.title} · 진행 ${parseInt(t.progress) || 0}%`;
  const todoLabel = (t) =>
    t.status === "doing" ? `${t.title} · 진행 ${parseInt(t.progress) || 0}%` : t.title;

  const fields = [];
  if (doneCands.length)
    fields.push({
      name: "doneIds",
      label: "📌 오늘 한 일에 넣을 업무 (체크 해제하면 빠져요)",
      type: "checks",
      full: true,
      options: doneCands.map((t) => ({ value: t.id, label: doneLabel(t) })),
    });
  if (todoCands.length)
    fields.push({
      name: "todoIds",
      label: "📋 내일 할 일에 넣을 업무",
      type: "checks",
      full: true,
      options: todoCands.map((t) => ({ value: t.id, label: todoLabel(t) })),
    });
  if (detailCands.length)
    fields.push({
      name: "detailIds",
      label: "📝 상세내용도 함께 넣을 업무 (오늘 한 일 · 기본은 제목만)",
      type: "checks",
      full: true,
      options: detailCands.map((t) => ({ value: t.id, label: t.title })),
    });

  // 기본값: 오늘/내일 업무는 전부 체크, 상세는 비움
  const values = {
    doneIds: doneCands.map((t) => t.id),
    todoIds: todoCands.map((t) => t.id),
    detailIds: [],
  };

  const res = await UI.formModal({
    title: "보고서에 넣을 업무 선택",
    submitText: "보고서 만들기",
    values,
    fields,
  });
  if (!res) return; // 취소
  reportForm(
    null,
    buildAutoReportDraft({
      doneIds: res.doneIds || [],
      todoIds: res.todoIds || [],
      detailIds: res.detailIds || [],
    })
  );
}

function fmtYMD(x) {
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
    x.getDate()
  ).padStart(2, "0")}`;
}
/* 이번 주(월~일) 범위 - 캘린더 주별 강조용 */
function thisWeekRange() {
  const d = new Date();
  const day = d.getDay();
  const diffMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: fmtYMD(mon), end: fmtYMD(sun) };
}

/* 이번 주(월~금) 범위 */
function currentWeekRange() {
  const d = new Date();
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  return { start: fmtYMD(mon), end: fmtYMD(fri) };
}
/* 이번 달 범위 */
function currentMonthRange() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    start: fmtYMD(first),
    end: fmtYMD(last),
    label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
  };
}

/* 내 전체 업무 평균 진행률(%) — 완료=100, 진행률 없으면 0 */
function myOverallProgress(memberId) {
  const me = memberId || curUser();
  const mine = Store.list("tasks").filter((t) => !me || t.assignee_id === me);
  if (!mine.length) return 0;
  const sum = mine.reduce(
    (s, t) => s + (t.status === "done" ? 100 : parseInt(t.progress) || 0),
    0
  );
  return Math.round(sum / mine.length);
}

/* 주간/월간 '계획' 보고서 자동 초안: 기간 내 일정 + 미완료 업무 */
function buildPlanDraft(kind) {
  const me = curUser();
  const range = kind === "monthly" ? currentMonthRange() : currentWeekRange();
  const period =
    kind === "monthly"
      ? range.label
      : `${UI.fmtDate(range.start)} ~ ${UI.fmtDate(range.end)}`;

  // 계획/목표 = 내 미완료 업무(할일/진행중)
  const mineOpen = Store.list("tasks").filter(
    (t) => t.status !== "done" && (!me || t.assignee_id === me)
  );
  const planLines = mineOpen.map((t) => {
    const p = parseInt(t.progress) || 0;
    return `- ${t.title}${p > 0 ? ` (${p}%)` : ""}`;
  });

  // 주요 일정 = 기간 내 캘린더 일정
  const events = Store.list("events")
    .filter((e) => {
      const s = e.date || "";
      const en = e.end_date || e.date || "";
      return s && s <= range.end && en >= range.start; // 범위 겹침
    })
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const eventLines = events.map(
    (e) => `- [${UI.fmtDate(e.date).slice(5)}] ${e.title}`
  );

  // 월간이면 올해 진행 중인 목표도 참고로
  if (kind === "monthly") {
    Store.list("goals")
      .filter((g) => g.status === "doing")
      .slice(0, 8)
      .forEach((g) => planLines.push(`- (목표) ${g.title}`));
  }

  return {
    kind: kind,
    member_id: me,
    date: range.start,
    period: period,
    progress: String(myOverallProgress(me)),
    done: planLines.join("\n"),
    todo: eventLines.join("\n"),
    note: "",
  };
}

async function planReportForm(kind, existing, preset) {
  const meta = REPORT_META[kind];
  const range = kind === "monthly" ? currentMonthRange() : currentWeekRange();
  const defPeriod =
    kind === "monthly"
      ? range.label
      : `${UI.fmtDate(range.start)} ~ ${UI.fmtDate(range.end)}`;
  const values =
    existing ||
    preset || {
      kind: kind,
      member_id: curUser(),
      date: range.start,
      period: defPeriod,
      progress: String(myOverallProgress(curUser())), // 전체 진행률 자동 입력
    };
  const res = await UI.formModal({
    title: (existing ? "수정 — " : "작성 — ") + meta.title,
    submitText: existing ? "수정" : "저장",
    values,
    fields: [
      {
        name: "member_id",
        label: "작성자",
        type: "select",
        options: UI.memberOptions(false),
      },
      { name: "period", label: "기간", type: "text", placeholder: defPeriod },
      { name: "progress", label: meta.progressLabel + " (% · 전체 진행률 자동)", type: "text", placeholder: "예: 0" },
      { name: "done", label: meta.s1, type: "textarea", rows: 6, full: true },
      { name: "todo", label: meta.s2, type: "textarea", rows: 5, full: true },
      { name: "note", label: meta.s3, type: "textarea", rows: 3, full: true },
    ],
  });
  if (!res) return;
  res.kind = kind;
  if (!res.date) res.date = range.start;
  if (existing) await Store.update("reports", existing.id, res);
  else await Store.add("reports", res);
  UI.toast(meta.title + " 저장됨");
}

async function reportForm(existing, preset) {
  // 새로 작성할 때는 대시보드 업무를 자동으로 채워줍니다.
  const values = existing || preset || buildAutoReportDraft();
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

/* 보고서 본문 렌더: **굵게** 지원 + 줄바꿈 유지 (esc 후 처리해 안전)
   예전 데이터에 남은 ↳ 화살표는 • 점으로 정리 */
function reportRich(s) {
  return UI.esc(String(s || "").replace(/↳/g, "•"))
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");
}
/* 복사/내보내기용 평문: ** 굵게 마커 제거, ↳ → • */
function stripMd(s) {
  return String(s || "")
    .replace(/↳/g, "•")
    .replace(/\*\*(.+?)\*\*/g, "$1");
}

function reportToText(r) {
  const meta = reportMeta(r);
  const period = isDailyReport(r) ? UI.fmtDate(r.date) : r.period || UI.fmtDate(r.date);
  return (
    `[${meta.title}] ${period} / ${UI.memberName(r.member_id)}\n\n` +
    `■ ${meta.s1}\n${stripMd(r.done) || "-"}\n\n` +
    `■ ${meta.s2}\n${stripMd(r.todo) || "-"}\n\n` +
    `■ ${meta.s3}\n${stripMd(r.note) || "-"}`
  );
}

/* 제출용 보고서 양식 HTML */
function reportSheetHTML(r) {
  const meta = reportMeta(r);
  const periodVal = isDailyReport(r)
    ? UI.fmtDate(r.date)
    : UI.esc(r.period || UI.fmtDate(r.date));
  return `
    <div class="report-sheet">
      <h1>${meta.title}</h1>
      <div class="rs-meta">
        <div><span>${meta.periodLabel}</span><b>${periodVal}</b></div>
        <div><span>작성자</span><b>${UI.esc(UI.memberName(r.member_id))}</b></div>
        ${
          r.progress
            ? `<div><span>${meta.progressLabel}</span><b>${parseInt(r.progress) || 0}%</b></div>`
            : ""
        }
      </div>
      <section><h3>${meta.s1}</h3><div>${r.done ? reportRich(r.done) : "-"}</div></section>
      <section><h3>${meta.s2}</h3><div>${r.todo ? reportRich(r.todo) : "-"}</div></section>
      <section><h3>${meta.s3}</h3><div>${r.note ? reportRich(r.note) : "-"}</div></section>
    </div>`;
}

/* 제출용 보고서 미리보기 (복사/인쇄·PDF) */
function openReportPreview(r) {
  if (!r) return;
  const meta = reportMeta(r);
  const fname = `${meta.title}_${UI.memberName(r.member_id)}_${r.date || ""}`;
  openSheetModal(reportSheetHTML(r), reportToText(r), fname);
}

/* 보고서 양식 미리보기 공통 모달 (복사/인쇄·PDF) */
function openSheetModal(sheetHTML, copyText, filename, modalTitle) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal report-modal">
      <div class="modal-head">
        <h3>${UI.esc(modalTitle || "제출용 보고서")}</h3>
        <button class="icon-btn" data-close>✕</button>
      </div>
      <div class="modal-body report-preview-body">${sheetHTML}</div>
      <div class="modal-foot">
        <button class="btn ghost" data-copy>📋 복사</button>
        <button class="btn primary" data-png>🖼️ PNG 이미지 저장</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector("[data-close]").onclick = close;
  overlay.querySelector("[data-copy]").onclick = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      UI.toast("복사되었습니다");
    } catch (e) {
      UI.toast("복사 권한이 없습니다", "warn");
    }
  };
  const sheetEl = overlay.querySelector(".report-sheet");
  overlay.querySelector("[data-png]").onclick = (e) =>
    downloadSheetPNG(sheetEl, filename, e.currentTarget);
}

/* 보고서 시트를 PNG 이미지 파일로 저장 */
async function downloadSheetPNG(sheetEl, filename, btn) {
  if (!window.html2canvas) {
    UI.toast("이미지 변환 모듈을 불러오지 못했어요. 새로고침 후 다시 시도해주세요", "warn");
    return;
  }
  if (!sheetEl) return;
  const label = btn ? btn.textContent : "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "이미지 만드는 중…";
  }
  try {
    const canvas = await html2canvas(sheetEl, {
      backgroundColor: "#ffffff",
      scale: Math.min(window.devicePixelRatio || 1, 2) * 1.5,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = (filename || "보고서") + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    UI.toast("PNG 이미지로 저장했어요");
  } catch (err) {
    console.error(err);
    UI.toast("이미지 저장에 실패했어요", "warn");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = label;
    }
  }
}

/* ============ 멤버 관리 ============ */
function renderMembers() {
  const members = Store.list("members");
  const cur = curUser();
  const list = members.length
    ? members
        .map(
          (m, i) => `
        <div class="card member-card">
          <span class="member-order">
            <button class="ord-btn" data-act="member-up" data-id="${m.id}" ${
            i === 0 ? "disabled" : ""
          } title="위로">▲</button>
            <button class="ord-btn" data-act="member-down" data-id="${m.id}" ${
            i === members.length - 1 ? "disabled" : ""
          } title="아래로">▼</button>
          </span>
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
      <p class="muted">▲▼ 버튼으로 순서를 바꿀 수 있어요. 이 순서가 사람별 보기·취합 보고서 등에 그대로 쓰입니다.</p>
      <div class="member-list">${list}</div>
    </section>`;
}

/* 멤버 순서 이동 (브라우저에 저장, SQL 불필요) */
function moveMember(id, dir) {
  const ms = Store.list("members").slice();
  const i = ms.findIndex((m) => m.id === id);
  if (i < 0) return;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= ms.length) return;
  const tmp = ms[i];
  ms[i] = ms[j];
  ms[j] = tmp;
  Store.setMemberOrder(ms.map((m) => m.id));
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
        label: "색상 (클릭해서 선택)",
        type: "color",
        full: true,
        options: MEMBER_COLORS,
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
    case "docs": view = renderDocs(); break;
    case "calendar": view = renderCalendar(); break;
    case "payments": view = renderPayments(); break;
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
    <main class="app-main">${view}${renderHelp()}</main>
    <footer class="app-footer">업무 공유 · ${
      Store.mode === "cloud" ? "실시간 공유 모드" : "로컬 모드"
    }</footer>
    ${renderAssistant()}`;
}

/* ============ 업무 비서 (내장 검색 챗봇) ============ */
function renderAssistant() {
  const open = App.state.assistantOpen;
  const fab = `<button class="asst-fab" data-act="asst-toggle" title="업무 비서">${
    open ? "✕" : "💬"
  }</button>`;
  if (!open) return fab;
  const msgs = App.state.assistantMsgs;
  const greeting = !msgs.length
    ? `<div class="asst-msg bot">안녕하세요! 업무 비서예요 🤖<br>무엇이든 검색하거나 물어보세요.
        <div class="asst-suggest">
          <button class="asst-chip" data-act="asst-q" data-q="내 할일">내 할일</button>
          <button class="asst-chip" data-act="asst-q" data-q="오늘 일정">오늘 일정</button>
          <button class="asst-chip" data-act="asst-q" data-q="이번주 일정">이번 주 일정</button>
          <button class="asst-chip" data-act="asst-q" data-q="최근 회의">최근 회의</button>
          <button class="asst-chip" data-act="asst-q" data-q="내 진행률">내 진행률</button>
        </div></div>`
    : "";
  const body = msgs.map((m) => `<div class="asst-msg ${m.role}">${m.html}</div>`).join("");
  return `${fab}
    <div class="asst-panel">
      <div class="asst-head"><span>🤖 업무 비서</span><button class="icon-btn" data-act="asst-toggle">✕</button></div>
      <div class="asst-body" id="asstBody">${greeting}${body}</div>
      <div class="asst-input-row">
        <input id="asstInput" class="asst-input" placeholder="검색하거나 물어보세요…" autocomplete="off">
        <button class="btn primary sm" data-act="asst-send">전송</button>
      </div>
    </div>`;
}

function assistantAsk(q) {
  q = (q || "").trim();
  if (!q) return;
  App.state.assistantMsgs.push({ role: "user", html: UI.esc(q) });
  App.state.assistantMsgs.push({ role: "bot", html: answerQuery(q) });
  render();
  setTimeout(() => {
    const b = document.getElementById("asstBody");
    if (b) b.scrollTop = b.scrollHeight;
    const i = document.getElementById("asstInput");
    if (i) i.focus();
  }, 20);
}

function asstLink(route, text) {
  return `<a class="asst-link" href="#${route}">${UI.esc(text)}</a>`;
}
function findMemberInText(q) {
  return Store.list("members").find((m) => {
    const first = (m.name || "").split(/\s+/)[0];
    return m.name && (q.includes(m.name) || (first && q.includes(first)));
  });
}
function assistantHelp() {
  return `이렇게 물어보실 수 있어요:<br>
    • <b>내 할일</b> / <b>김수영 할일</b><br>
    • <b>오늘 일정</b> / <b>이번 주 일정</b><br>
    • <b>최근 회의</b> / <b>회의 OOO</b><br>
    • <b>내 진행률</b><br>
    • <b>OOO 검색</b> (전체에서 찾기)`;
}

function answerQuery(raw) {
  const q = raw.trim();
  const ql = q.toLowerCase();
  const me = curUser();
  const mem = findMemberInText(q);
  const has = (...k) => k.some((x) => ql.includes(x));

  if (has("사용법", "도움", "도와", "help", "뭐할", "뭐 할", "안녕")) return assistantHelp();

  if (has("진행률", "진척")) {
    const mid = mem ? mem.id : me;
    if (!mid) return "먼저 우측 상단에서 본인 이름을 선택하거나, 'OOO 진행률'처럼 이름을 넣어주세요.";
    const p = myOverallProgress(mid);
    return `${mem ? UI.esc(mem.name) : "내"} 평균 진행률은 <b>${p}%</b> 예요. ${asstLink(
      "dashboard",
      "대시보드 열기"
    )}`;
  }
  if (has("일정", "캘린더", "스케줄")) {
    if (has("오늘")) return listEventsAnswer("today");
    if (has("이번주", "이번 주", "주간", "이주")) return listEventsAnswer("week");
    return listEventsAnswer("upcoming");
  }
  if (has("회의", "미팅")) return listMeetingsAnswer(q);
  if (has("보고")) return listReportsAnswer(q);
  if (has("완료", "끝낸", "한 일", "한일")) return listTasksAnswer(mem ? mem.id : me, "done", mem);
  if (has("할일", "할 일", "todo", "업무", "태스크", "진행"))
    return listTasksAnswer(mem ? mem.id : me, "open", mem);
  if (has("목표")) return listGoalsAnswer(q);
  if (has("문서", "sop", "매뉴얼", "양식")) return listDocsAnswer(q);

  return searchAllAnswer(q);
}

function listTasksAnswer(memberId, mode, mem) {
  let tasks = Store.list("tasks");
  if (memberId) tasks = tasks.filter((t) => t.assignee_id === memberId);
  if (mode === "done") {
    tasks = tasks.filter((t) => t.status === "done" && !isHiddenDone(t));
  } else {
    tasks = tasks.filter((t) => t.status !== "done");
  }
  const who = mem ? UI.esc(mem.name) + "님" : memberId ? "내" : "전체";
  if (!tasks.length)
    return `${who} ${mode === "done" ? "오늘 완료한 일" : "할 일"}이 없어요. ${asstLink(
      "dashboard",
      "대시보드"
    )}`;
  const lines = tasks
    .slice(0, 10)
    .map((t) => {
      const st =
        t.status === "done"
          ? "✅ 완료"
          : t.status === "doing"
          ? `진행 ${parseInt(t.progress) || 0}%`
          : "할 일";
      return `• ${UI.esc(t.title)} <span class="asst-tag">${st}</span>`;
    })
    .join("<br>");
  return `${who} ${mode === "done" ? "오늘 완료" : "할 일"} <b>${tasks.length}건</b>:<br>${lines}<br>${asstLink(
    "dashboard",
    "대시보드에서 보기"
  )}`;
}

function listEventsAnswer(kind) {
  const today = UI.todayInput();
  let events = Store.list("events").filter((e) => e.date);
  let title;
  if (kind === "today") {
    events = events.filter((e) => (e.date || "") <= today && (e.end_date || e.date) >= today);
    title = "오늘 일정";
  } else if (kind === "week") {
    const wk = thisWeekRange();
    events = events.filter((e) => (e.date || "") <= wk.end && (e.end_date || e.date) >= wk.start);
    title = "이번 주 일정";
  } else {
    events = events.filter((e) => (e.end_date || e.date) >= today);
    title = "다가오는 일정";
  }
  events.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  if (!events.length) return `${title}이 없어요. ${asstLink("calendar", "캘린더")}`;
  const lines = events
    .slice(0, 10)
    .map((e) => `• ${UI.fmtDate(e.date).slice(5)} ${UI.esc(e.title)}`)
    .join("<br>");
  return `${title} <b>${events.length}건</b>:<br>${lines}<br>${asstLink("calendar", "캘린더에서 보기")}`;
}

function listMeetingsAnswer(q) {
  let ms = Store.list("meetings")
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  // 키워드(회의/미팅 제외 단어)가 있으면 검색
  const term = q.replace(/회의록|회의|미팅|최근|찾아|검색|알려줘|보여줘/g, "").trim();
  if (term) {
    const tl = term.toLowerCase();
    ms = ms.filter((m) =>
      [m.title, m.category, m.body, m.agenda, m.attendees].join(" ").toLowerCase().includes(tl)
    );
  }
  if (!ms.length) return `해당 회의록을 못 찾았어요. ${asstLink("minutes", "회의록")}`;
  const lines = ms
    .slice(0, 8)
    .map((m) => `• ${UI.fmtDate(m.date).slice(0)} ${UI.esc(m.title)}`)
    .join("<br>");
  return `회의록 <b>${ms.length}건</b>:<br>${lines}<br>${asstLink("minutes", "회의록에서 보기")}`;
}

function listReportsAnswer(q) {
  const mem = findMemberInText(q);
  let rs = Store.list("reports")
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (mem) rs = rs.filter((r) => r.member_id === mem.id);
  if (!rs.length) return `보고서가 없어요. ${asstLink("reports", "보고서")}`;
  const lines = rs
    .slice(0, 8)
    .map(
      (r) =>
        `• ${reportMeta(r).title.replace(" 보고서", "")} · ${UI.esc(
          r.period || UI.fmtDate(r.date)
        )} (${UI.memberName(r.member_id)})`
    )
    .join("<br>");
  return `${mem ? UI.esc(mem.name) + "님 " : ""}보고서 <b>${rs.length}건</b>:<br>${lines}<br>${asstLink(
    "reports",
    "보고서에서 보기"
  )}`;
}

function listGoalsAnswer(q) {
  const gs = Store.list("goals");
  if (!gs.length) return `등록된 업무 목표가 없어요. ${asstLink("goals", "업무 목표")}`;
  const lines = gs
    .slice(0, 10)
    .map((g) => `• ${UI.esc(g.title)} <span class="asst-tag">${parseInt(g.progress) || 0}%</span>`)
    .join("<br>");
  return `업무 목표 <b>${gs.length}건</b>:<br>${lines}<br>${asstLink("goals", "업무 목표에서 보기")}`;
}

function listDocsAnswer(q) {
  const term = q.replace(/문서|sop|매뉴얼|양식|찾아|검색|알려줘|보여줘/gi, "").trim().toLowerCase();
  let ds = Store.list("docs").filter((d) => d.title !== VENDOR_DOC_TITLE);
  if (term)
    ds = ds.filter((d) =>
      [d.title, d.category, d.body].join(" ").toLowerCase().includes(term)
    );
  if (!ds.length) return `해당 문서를 못 찾았어요. ${asstLink("docs", "업무 문서")}`;
  const lines = ds
    .slice(0, 8)
    .map((d) => `• ${UI.esc(d.title)} <span class="asst-tag">${UI.esc(d.category || "미분류")}</span>`)
    .join("<br>");
  return `업무 문서 <b>${ds.length}건</b>:<br>${lines}<br>${asstLink("docs", "업무 문서에서 보기")}`;
}

function searchAllAnswer(q) {
  const ql = q.toLowerCase();
  const hit = (s) => (s || "").toString().toLowerCase().includes(ql);
  const groups = [];
  const add = (label, route, arr, fmt) => {
    const m = arr.filter(fmt.match).slice(0, 5);
    if (m.length)
      groups.push(
        `<b>${label}</b> (${arr.filter(fmt.match).length})<br>` +
          m.map((x) => "• " + fmt.line(x)).join("<br>") +
          `<br>${asstLink(route, label + " 열기")}`
      );
  };
  add("할 일", "dashboard", Store.list("tasks"), {
    match: (t) => hit(t.title) || hit(t.detail),
    line: (t) => UI.esc(t.title),
  });
  add("일정", "calendar", Store.list("events"), {
    match: (e) => hit(e.title) || hit(e.note),
    line: (e) => UI.fmtDate(e.date).slice(5) + " " + UI.esc(e.title),
  });
  add("회의록", "minutes", Store.list("meetings"), {
    match: (m) => hit(m.title) || hit(m.body) || hit(m.agenda),
    line: (m) => UI.esc(m.title),
  });
  add("보고서", "reports", Store.list("reports"), {
    match: (r) => hit(r.done) || hit(r.todo) || hit(r.note),
    line: (r) => UI.esc(r.period || UI.fmtDate(r.date)) + " " + UI.memberName(r.member_id),
  });
  add("아이디어", "databoard", Store.list("ideas"), {
    match: (i) => hit(i.title) || hit(i.body),
    line: (i) => UI.esc(i.title),
  });
  add("업무 문서", "docs", Store.list("docs").filter((d) => d.title !== VENDOR_DOC_TITLE), {
    match: (d) => hit(d.title) || hit(d.body),
    line: (d) => UI.esc(d.title),
  });
  add("업무 목표", "goals", Store.list("goals"), {
    match: (g) => hit(g.title) || hit(g.metric),
    line: (g) => UI.esc(g.title),
  });
  if (!groups.length)
    return `'${UI.esc(q)}'에 대한 결과를 못 찾았어요. 다른 단어로 검색하거나 '내 할일', '이번 주 일정'처럼 물어보세요.`;
  return `'${UI.esc(q)}' 검색 결과예요:<br><br>` + groups.join("<br><br>");
}

function renderHelp() {
  const h = HELP[App.route] || HELP.home;
  const open = App.state.helpOpen;
  return `
    <div class="help-box ${open ? "open" : ""}">
      <button class="help-head" data-act="toggle-help">
        <span>ℹ️ ${UI.esc(h.title)}</span>
        <span class="help-arrow">${open ? "▲" : "▼"}</span>
      </button>
      ${
        open
          ? `<ul class="help-list">${h.items
              .map((t) => `<li>${UI.esc(t)}</li>`)
              .join("")}</ul>`
          : ""
      }
    </div>`;
}

/* ============ 이벤트 위임 ============ */
async function handleAction(act, el) {
  const id = el.getAttribute("data-id");
  const find = (coll) => Store.list(coll).find((x) => x.id === id);

  switch (act) {
    // 공통
    case "toggle-help":
      App.state.helpOpen = !App.state.helpOpen;
      render();
      return;
    case "float-todo-toggle":
      FloatTodo.toggle();
      return;
    case "ft-expand":
      FloatTodo.toggleExpand(el.getAttribute("data-id"));
      return;
    case "asst-toggle":
      App.state.assistantOpen = !App.state.assistantOpen;
      render();
      if (App.state.assistantOpen)
        setTimeout(() => {
          const i = document.getElementById("asstInput");
          if (i) i.focus();
        }, 30);
      return;
    case "asst-send": {
      const i = document.getElementById("asstInput");
      if (i) assistantAsk(i.value);
      return;
    }
    case "asst-q":
      return assistantAsk(el.getAttribute("data-q"));

    // 할일
    case "task-view":
      App.state.taskView = el.getAttribute("data-view");
      render();
      return;
    case "task-filter":
      App.state.taskMember = el.getAttribute("data-member");
      render();
      return;
    case "task-add": return taskForm();
    case "task-detail": return openTaskDetail(find("tasks"));
    case "task-edit": return taskForm(find("tasks"));
    case "task-move": {
      const t = find("tasks");
      if (t) await Store.update("tasks", id, statusPatch(el.getAttribute("data-to"), t));
      return;
    }
    case "toggle-done":
      App.state.doneExpanded[el.getAttribute("data-member")] =
        !App.state.doneExpanded[el.getAttribute("data-member")];
      render();
      return;
    case "toggle-past-done":
      App.state.pastDoneExpanded[el.getAttribute("data-member")] =
        !App.state.pastDoneExpanded[el.getAttribute("data-member")];
      render();
      return;
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

    // 업무 문서
    case "doc-new": return docForm(null, false);
    case "doc-new-template": return docForm(null, true);
    case "doc-select":
      App.state.docSelectedId = id;
      render();
      return;
    case "doc-edit": return docForm(find("docs"), false);
    case "doc-duplicate": return duplicateDoc(id);
    case "doc-del":
      if (await UI.confirmBox("이 문서를 삭제할까요?")) {
        await Store.remove("docs", id);
        if (App.state.docSelectedId === id) App.state.docSelectedId = null;
      }
      return;

    // 캘린더
    case "event-add": return eventForm();
    case "leave-add": return eventForm(null, null, true);
    case "day-view": return openDayDetail(el.getAttribute("data-date"));
    case "event-add-on": return eventForm(null, el.getAttribute("data-date"));
    case "leave-add-on": return eventForm(null, el.getAttribute("data-date"), true);
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
    case "cal-year-prev":
      App.state.calendarRef = new Date(
        App.state.calendarRef.getFullYear() - 1,
        App.state.calendarRef.getMonth(),
        1
      );
      render();
      return;
    case "cal-year-next":
      App.state.calendarRef = new Date(
        App.state.calendarRef.getFullYear() + 1,
        App.state.calendarRef.getMonth(),
        1
      );
      render();
      return;
    case "cal-today":
      App.state.calendarRef = new Date();
      render();
      return;

    // 결제(지출) 일정
    case "pay-add": return paymentForm();
    case "pay-add-on": return paymentForm(null, el.getAttribute("data-date"));
    case "pay-add-vendor":
      return paymentForm(null, null, getVendors()[parseInt(el.getAttribute("data-idx"))]);
    case "vendor-add": return vendorForm(null);
    case "vendor-edit": return vendorForm(parseInt(el.getAttribute("data-idx")));
    case "vendor-del": return deleteVendor(parseInt(el.getAttribute("data-idx")));
    case "pay-edit": return paymentForm(find("events"));
    case "pay-del":
      if (await UI.confirmBox("이 결제 건을 삭제할까요?")) await Store.remove("events", id);
      return;
    case "pay-view":
      App.state.payView = el.getAttribute("data-view");
      render();
      return;
    case "pay-prev":
      App.state.payRef = new Date(App.state.payRef.getFullYear(), App.state.payRef.getMonth() - 1, 1);
      render();
      return;
    case "pay-next":
      App.state.payRef = new Date(App.state.payRef.getFullYear(), App.state.payRef.getMonth() + 1, 1);
      render();
      return;
    case "pay-year-prev":
      App.state.payRef = new Date(App.state.payRef.getFullYear() - 1, App.state.payRef.getMonth(), 1);
      render();
      return;
    case "pay-year-next":
      App.state.payRef = new Date(App.state.payRef.getFullYear() + 1, App.state.payRef.getMonth(), 1);
      render();
      return;
    case "pay-today":
      App.state.payRef = new Date();
      render();
      return;

    // 데이터 보드
    case "db-tab":
      App.state.databoardTab = el.getAttribute("data-tab");
      render();
      return;
    case "res-add": return resourceForm();
    case "res-view": return openImageViewer(find("resources"));
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
    case "meeting-duplicate": return duplicateMeeting(id);
    case "meeting-to-tasks": return meetingToTasks(find("meetings"));
    case "meeting-item-toggle": {
      const m = find("meetings");
      if (!m || !Array.isArray(m.items)) return;
      const idx = parseInt(el.getAttribute("data-idx"));
      if (isNaN(idx) || !m.items[idx]) return;
      const items = m.items.map((it, i) =>
        i === idx ? { ...it, done: !it.done } : it
      );
      await Store.update("meetings", id, { items });
      return;
    }
    case "meeting-image": return openMeetingImage(find("meetings"));
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
    case "report-tab":
      App.state.reportTab = el.getAttribute("data-tab");
      render();
      return;
    case "report-date":
      App.state.reportDate = el.getAttribute("data-date");
      render();
      return;
    case "report-cal-prev":
      App.state.reportCalRef = new Date(
        App.state.reportCalRef.getFullYear(),
        App.state.reportCalRef.getMonth() - 1,
        1
      );
      render();
      return;
    case "report-cal-next":
      App.state.reportCalRef = new Date(
        App.state.reportCalRef.getFullYear(),
        App.state.reportCalRef.getMonth() + 1,
        1
      );
      render();
      return;
    case "report-cal-today":
      App.state.reportCalRef = new Date();
      App.state.reportDate = UI.todayInput();
      render();
      return;
    case "report-combine":
      return openCombinedReport(el.getAttribute("data-date"));
    case "report-add": return reportForm();
    case "report-auto": return startAutoReport();
    case "wreport-add": return planReportForm("weekly");
    case "wreport-auto": return planReportForm("weekly", null, buildPlanDraft("weekly"));
    case "wreport-edit": return planReportForm("weekly", find("reports"));
    case "mreport-add": return planReportForm("monthly");
    case "mreport-auto": return planReportForm("monthly", null, buildPlanDraft("monthly"));
    case "mreport-edit": return planReportForm("monthly", find("reports"));
    case "report-submit": return openReportPreview(find("reports"));
    case "report-edit": return reportForm(find("reports"));
    case "report-feedback-save": {
      const ta = document.querySelector(`.fb-input[data-fb-id="${id}"]`);
      if (ta) {
        await Store.update("reports", id, { period: ta.value.trim() });
        UI.toast("피드백을 저장했어요");
      }
      return;
    }
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
    case "member-up": return moveMember(id, "up");
    case "member-down": return moveMember(id, "down");
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

/* ============ 내 할일 플로팅 위젯 (페이지/화면 따라다니기) ============ */
const FloatTodo = (() => {
  const LS = { on: "floatTodo.on", pos: "floatTodo.pos", min: "floatTodo.min" };
  let el = null; // 본문 위젯 DOM
  let pipWin = null; // Picture-in-Picture 창
  let pipUnsub = null;
  const expanded = new Set(); // 세부사항 펼친 할일 id

  function isOn() {
    return localStorage.getItem(LS.on) === "1";
  }
  function isMin() {
    return localStorage.getItem(LS.min) === "1";
  }

  // 내 미완료 할일 (진행 중 → 할 일, 마감 임박 우선)
  function myTasks() {
    const me = curUser();
    if (!me) return [];
    return Store.list("tasks")
      .filter((t) => t.assignee_id === me && t.status !== "done")
      .sort(
        (a, b) =>
          ({ doing: 0, todo: 1 }[a.status] - { doing: 0, todo: 1 }[b.status]) ||
          (a.due_date || "9999").localeCompare(b.due_date || "9999")
      );
  }

  function listHTML() {
    if (!curUser())
      return `<div class="ft-empty">상단에서 본인 이름을 먼저 선택하세요.</div>`;
    const list = myTasks();
    if (!list.length)
      return `<div class="ft-empty">🎉 처리할 내 할일이 없어요!</div>`;
    const today = UI.todayInput();
    return list
      .map((t) => {
        const overdue = t.due_date && t.due_date < today;
        const next = t.status === "todo" || t.status === "paused" ? "doing" : "done";
        const icon = t.status === "todo" || t.status === "paused" ? "▶" : "✓";
        const tip = t.status === "paused" ? "재개" : t.status === "todo" ? "진행 시작" : "완료 처리";
        const exp = expanded.has(t.id);
        const prog = t.status === "done" ? 100 : parseInt(t.progress) || 0;
        const detail = exp
          ? `
          <div class="ft-detail">
            <div class="ft-prog">
              <span class="ft-prog-label">진행률</span>
              <input type="range" min="0" max="100" step="5" value="${prog}" class="prog-range" data-id="${t.id}">
              <span class="prog-edit-num">${prog}%</span>
            </div>
            ${t.due_date ? `<div class="ft-d-line">📅 마감 ${UI.fmtDate(t.due_date)}</div>` : ""}
            <div class="ft-d-content">${
              t.detail ? UI.nl2br(t.detail) : '<span class="muted">상세 내용이 없습니다.</span>'
            }</div>
            <div class="ft-d-actions">
              <button class="btn xs ghost" data-act="task-edit" data-id="${t.id}">✎ 수정</button>
            </div>
          </div>`
          : "";
        return `
        <div class="ft-item ${exp ? "exp" : ""}">
          <div class="ft-row">
            <button class="ft-check status-${t.status}" data-act="task-move" data-id="${t.id}" data-to="${next}" title="${tip}">${icon}</button>
            <span class="ft-row-title" data-act="ft-expand" data-id="${t.id}" title="클릭하면 세부사항 펼치기">${t.status === "paused" ? "⏸ " : ""}${UI.esc(t.title)}</span>
            ${
              t.due_date
                ? `<span class="ft-due ${overdue ? "overdue" : ""}">${UI.fmtDate(t.due_date).slice(5)}</span>`
                : ""
            }
            <span class="ft-caret" data-act="ft-expand" data-id="${t.id}">${exp ? "▾" : "▸"}</span>
          </div>
          ${detail}
        </div>`;
      })
      .join("");
  }

  function toggleExpand(id) {
    if (!id) return;
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    update();
  }

  // 제목만으로 내 할일에 바로 등록 (본문 위젯·팝업 공용)
  function quickAdd(inputEl) {
    const title = (inputEl.value || "").trim();
    if (!title) {
      inputEl.focus();
      return;
    }
    if (!curUser()) {
      UI.toast("상단에서 본인 이름을 먼저 선택하세요", "warn");
      return;
    }
    Store.add("tasks", { title, assignee_id: curUser(), status: "todo" });
    inputEl.value = "";
    inputEl.focus();
  }

  // 입력칸 + 추가 버튼에 빠른 추가 동작 연결
  function wireQuickAdd(scope) {
    const input = scope.querySelector(".ft-add-input");
    const btn = scope.querySelector("[data-ft-add]");
    if (!input || !btn) return;
    btn.addEventListener("click", () => quickAdd(input));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        quickAdd(input);
      }
    });
  }

  function countText() {
    const list = myTasks();
    const doing = list.filter((t) => t.status === "doing").length;
    return `${list.length}건 · 진행 ${doing}`;
  }

  function ensure() {
    if (el) return el;
    el = document.createElement("div");
    el.id = "floatTodo";
    el.className = "float-todo";
    el.innerHTML = `
      <div class="ft-head" data-ft-drag>
        <span class="ft-title">📌 내 할일 <span class="ft-count"></span></span>
        <span class="ft-head-btns">
          <button class="ft-btn" data-ft-win title="새 창으로 띄우기(작업표시줄에서 최소화 가능)">🗗</button>
          <button class="ft-btn" data-ft-min title="접기/펼치기">▁</button>
          <button class="ft-btn" data-ft-close title="닫기">✕</button>
        </span>
      </div>
      <div class="ft-add">
        <input class="ft-add-input" type="text" placeholder="할일 입력 후 Enter 또는 ＋" maxlength="200">
        <button class="ft-add-btn" data-ft-add title="할일 추가">＋</button>
      </div>
      <div class="ft-body"></div>`;
    document.body.appendChild(el);

    // 헤더 버튼
    el.querySelector("[data-ft-close]").onclick = () => setOn(false);
    el.querySelector("[data-ft-min]").onclick = () => {
      localStorage.setItem(LS.min, isMin() ? "0" : "1");
      applyMin();
    };
    el.querySelector("[data-ft-win]").onclick = openPopup;
    wireQuickAdd(el);
    enableDrag(el.querySelector("[data-ft-drag]"));
    restorePos();
    applyMin();
    return el;
  }

  function applyMin() {
    if (!el) return;
    el.classList.toggle("min", isMin());
  }

  function restorePos() {
    if (!el) return;
    let pos = null;
    try {
      pos = JSON.parse(localStorage.getItem(LS.pos) || "null");
    } catch (e) {}
    const w = 270;
    const left = pos ? pos.left : Math.max(12, window.innerWidth - w - 20);
    const top = pos ? pos.top : 110;
    el.style.left = clampX(left) + "px";
    el.style.top = clampY(top) + "px";
  }
  function clampX(x) {
    return Math.min(Math.max(8, x), window.innerWidth - 80);
  }
  function clampY(y) {
    return Math.min(Math.max(8, y), window.innerHeight - 60);
  }

  function enableDrag(handle) {
    let sx, sy, sl, st, dragging = false;
    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".ft-btn")) return; // 버튼 클릭은 드래그 아님
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      sl = parseInt(el.style.left) || 0;
      st = parseInt(el.style.top) || 0;
      handle.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      el.style.left = clampX(sl + e.clientX - sx) + "px";
      el.style.top = clampY(st + e.clientY - sy) + "px";
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("dragging");
      localStorage.setItem(
        LS.pos,
        JSON.stringify({ left: parseInt(el.style.left), top: parseInt(el.style.top) })
      );
    };
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  // 본문/카운트 갱신 (본문 위젯 + PiP 동기화)
  function update() {
    if (isOn() && el) {
      const body = el.querySelector(".ft-body");
      const cnt = el.querySelector(".ft-count");
      if (body) body.innerHTML = listHTML();
      if (cnt) cnt.textContent = countText();
    }
    if (pipWin && !pipWin.closed) {
      const pb = pipWin.document.querySelector(".ft-body");
      const pc = pipWin.document.querySelector(".ft-count");
      if (pb) pb.innerHTML = listHTML();
      if (pc) pc.textContent = countText();
    }
  }

  function setOn(on) {
    localStorage.setItem(LS.on, on ? "1" : "0");
    if (on) {
      ensure();
      el.style.display = "";
      update();
    } else if (el) {
      el.style.display = "none";
    }
    // 헤더 버튼 활성 상태 반영
    const btn = document.querySelector('[data-act="float-todo-toggle"]');
    if (btn) btn.classList.toggle("on", on);
  }

  function toggle() {
    setOn(!isOn());
  }

  function init() {
    if (isOn()) setOn(true);
    window.addEventListener("resize", () => {
      if (el) restorePos();
    });
  }

  // ---- 새 창으로 띄우기 (작업표시줄에서 최소화 가능) ----
  function copyStylesTo(win) {
    document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
      const nl = win.document.createElement("link");
      nl.rel = "stylesheet";
      nl.href = l.href; // 절대 URL
      if (l.crossOrigin) nl.crossOrigin = l.crossOrigin;
      win.document.head.appendChild(nl);
    });
    document.querySelectorAll("style").forEach((s) => {
      win.document.head.appendChild(s.cloneNode(true));
    });
  }

  // PiP/팝업 창 내부 구성 (접기 버튼 + 클릭 위임)
  function buildExternal(win, fullHeight) {
    win.document.body.className = "pip-body";
    const wrap = win.document.createElement("div");
    wrap.className = "pip-todo";
    wrap.innerHTML = `
      <div class="ft-head static">
        <span class="ft-title">📌 내 할일 <span class="ft-count"></span></span>
        <span class="ft-head-btns">
          <button class="ft-btn" data-ft-extmin title="접기/펼치기">▁</button>
        </span>
      </div>
      <div class="ft-add">
        <input class="ft-add-input" type="text" placeholder="할일 입력 후 Enter 또는 ＋" maxlength="200">
        <button class="ft-add-btn" data-ft-add title="할일 추가">＋</button>
      </div>
      <div class="ft-body"></div>`;
    win.document.body.appendChild(wrap);
    // 접기: 본문 숨기고 창 높이를 헤더만큼 줄임
    wrap.querySelector("[data-ft-extmin]").addEventListener("click", () => {
      const collapsed = wrap.classList.toggle("min");
      try {
        const w = win.outerWidth || win.innerWidth || 280;
        win.resizeTo(w, collapsed ? 92 : fullHeight);
      } catch (e) {}
    });
    // 빠른 추가 (제목만으로 내 할일에 바로 등록)
    wireQuickAdd(wrap);
    // 완료/진행/펼치기 버튼 위임 (wrap에만 부착 → 재빌드 시 누적/잔존 없음)
    wrap.addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]");
      if (a) {
        e.preventDefault();
        handleAction(a.getAttribute("data-act"), a);
      }
    });
    // 진행률 슬라이더: 드래그 중 % 갱신 + 놓으면 저장 (팝업 창 자체 이벤트)
    wrap.addEventListener("input", (e) => {
      if (e.target.classList && e.target.classList.contains("prog-range")) {
        const num = e.target.parentElement.querySelector(".prog-edit-num");
        if (num) num.textContent = (parseInt(e.target.value) || 0) + "%";
      }
    });
    wrap.addEventListener("change", (e) => {
      if (e.target.classList && e.target.classList.contains("prog-range")) {
        applyProgressChange(e.target.getAttribute("data-id"), e.target.value);
      }
    });
  }

  function openPopup() {
    // 이미 떠 있으면 그 창으로 포커스만 이동
    if (pipWin && !pipWin.closed) {
      try {
        pipWin.focus();
        return;
      } catch (e) {}
    }
    const w = window.open("", "myTodoFloat", "width=300,height=470");
    if (!w) {
      UI.toast("팝업이 차단되었어요. 팝업 허용 후 다시 시도하세요", "warn");
      return;
    }
    // 재사용된 창의 이전 내용을 완전히 초기화 (예전 UI/리스너 제거)
    try {
      w.document.open();
      w.document.write(
        '<!doctype html><html><head><meta charset="utf-8"><title>내 할일</title></head><body class="pip-body"></body></html>'
      );
      w.document.close();
    } catch (e) {}
    copyStylesTo(w);
    buildExternal(w, 470);
    pipWin = w;
    update();
    pipUnsub = Store.subscribe(update);
    w.addEventListener("beforeunload", () => {
      if (pipUnsub) pipUnsub();
      pipUnsub = null;
      pipWin = null;
    });
  }

  return { init, toggle, update, isOn, toggleExpand };
})();

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

  // 검색 (입력 중에는 목록만 갱신 → 포커스 유지)
  document.body.addEventListener("input", (e) => {
    if (e.target.id === "docSearch") {
      App.state.docSearch = e.target.value;
      const tree = document.getElementById("docTree");
      if (tree) tree.innerHTML = docTreeHTML();
    }
    if (e.target.id === "minutesSearch") {
      App.state.minutesSearch = e.target.value;
      const list = document.getElementById("minutesList");
      if (list) list.innerHTML = meetingListHTML(App.state.minutesSearch);
    }
    if (e.target.id === "reportSearch") {
      App.state.reportSearch = e.target.value;
      const list = document.getElementById("reportList");
      if (list) list.innerHTML = reportListHTML(App.state.reportTab, App.state.reportSearch);
    }
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
    // 진행률 인라인 수정 (대시보드) — 진행률에 따라 상태도 자동 변경
    if (e.target.classList.contains("prog-range") || e.target.classList.contains("pt-prog")) {
      applyProgressChange(e.target.getAttribute("data-id"), e.target.value);
    }
    // 피드백 칸: 칸 밖을 누르면(blur) 자동 저장
    if (e.target.classList.contains("fb-input")) {
      Store.update("reports", e.target.getAttribute("data-fb-id"), {
        period: e.target.value.trim(),
      });
    }
  });

  // 슬라이더 드래그 중 % 숫자 실시간 갱신 (저장은 change에서)
  document.body.addEventListener("input", (e) => {
    if (e.target.classList.contains("prog-range")) {
      const num = e.target.parentElement.querySelector(".prog-edit-num");
      if (num) num.textContent = (parseInt(e.target.value) || 0) + "%";
    }
  });

  // 해시 라우팅
  // 비서 입력창 Enter 전송
  document.body.addEventListener("keydown", (e) => {
    if (e.target.id === "asstInput" && e.key === "Enter") {
      e.preventDefault();
      assistantAsk(e.target.value);
    }
  });

  window.addEventListener("hashchange", () => {
    App.route = location.hash.replace("#", "") || "dashboard";
    render();
  });

  // Store 변경 시 재렌더 (단, 모달 열려있거나 피드백 입력 중이면 보류)
  Store.subscribe(() => {
    const ae = document.activeElement;
    const editingFb = ae && ae.classList && ae.classList.contains("fb-input");
    if (!document.querySelector(".modal-overlay") && !editingFb) render();
  });
  // 플로팅 '내 할일' 위젯도 항상 최신으로 동기화
  Store.subscribe(() => FloatTodo.update());
}

/* ============ 시작 ============ */
(async function start() {
  await Store.ready;
  bindGlobalEvents();
  render();
  FloatTodo.init();
})();
