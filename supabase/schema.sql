-- =====================================================================
-- 업무 공유 - Supabase 스키마
-- 실시간 공유 모드를 켤 때 Supabase SQL Editor 에서 한 번 실행하세요.
-- (Dashboard > SQL Editor > New query > 아래 전체 붙여넣기 > Run)
-- =====================================================================

-- 모든 id 는 앱(브라우저)에서 생성하므로 text 타입을 사용합니다.
-- 날짜는 'YYYY-MM-DD' 문자열로 다루므로 text 로 둡니다(빈 값 허용).

create table if not exists members (
  id text primary key,
  name text not null,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists tasks (
  id text primary key,
  title text not null,
  detail text,
  assignee_id text,
  status text default 'todo',
  due_date text,
  progress text,                     -- 진행률(%)
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists events (
  id text primary key,
  title text not null,
  date text,
  scope text default 'day',          -- day | week | month
  member_id text,
  participants jsonb default '[]'::jsonb,  -- 참여자 멤버 id 배열
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists resources (
  id text primary key,
  kind text default 'image',         -- image | link
  title text not null,
  url text,
  image_data text,                   -- 이미지 base64 또는 Storage URL
  member_id text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists meetings (
  id text primary key,
  title text not null,
  date text,
  time text,                         -- 회의 시간 (예: 오전 10:00)
  category text,                     -- 구분
  location text,                     -- 회의장소
  attendees text,
  agenda text,
  body text,
  remarks text,                      -- 비고
  fu_status boolean default false,   -- F/u(후속과제) 완료 여부
  items jsonb default '[]'::jsonb,   -- 안건 및 결과 [{agenda,owner,due,done}]
  member_id text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists ideas (
  id text primary key,
  title text not null,
  body text,
  member_id text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists links (
  id text primary key,
  title text not null,
  url text,
  member_id text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists retros (
  id text primary key,
  keep text,
  problem text,
  try_ text,                         -- 'try' 는 예약어라 try_ 사용
  member_id text,
  date text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists reports (
  id text primary key,
  date text,
  kind text default 'daily',         -- daily | weekly
  period text,                       -- 주간 보고 기간 표시
  progress text,                     -- 주간 진행률(%)
  member_id text,
  done text,
  todo text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists goals (
  id text primary key,
  year text,
  status text default 'doing',       -- planned | doing | done | hold
  title text not null,
  weight text,                       -- 비중(%) 숫자 문자열
  progress text,                     -- 진행률(%)
  metric text,                       -- 평가지표
  plan text,                         -- 실행계획
  grade text,                        -- 평가등급: 미평가 | S | A | B | C
  member_id text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists docs (
  id text primary key,
  title text not null,
  category text,
  body text,
  is_template boolean default false,
  member_id text,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- =====================================================================
-- 실시간(Realtime) 활성화: 변경 사항이 모든 팀원에게 즉시 반영됩니다.
-- =====================================================================
alter publication supabase_realtime add table
  members, tasks, events, resources, meetings, ideas, links, retros, reports, goals, docs;

-- =====================================================================
-- RLS (행 수준 보안)
-- 사내 팀 도구이므로, anon 키로 누구나 읽기/쓰기가 가능하도록 허용합니다.
-- 외부에 URL 이 공개되면 안 됩니다. (링크를 아는 사람만 접근하도록 관리)
-- 더 강한 보안이 필요하면 Supabase Auth 로그인을 붙여 정책을 좁히세요.
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'members','tasks','events','resources','meetings','ideas','links','retros','reports','goals','docs'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "team_all" on %I;', t);
    execute format(
      'create policy "team_all" on %I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
