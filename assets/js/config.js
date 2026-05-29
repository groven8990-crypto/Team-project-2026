/*
 * 업무 공유 - 환경 설정
 *
 * [실시간 공유를 켜는 방법]
 * 1) https://supabase.com 에서 무료 프로젝트를 만듭니다.
 * 2) Project Settings > API 에서 Project URL 과 anon public key 를 복사합니다.
 * 3) 아래 SUPABASE_URL, SUPABASE_ANON_KEY 에 붙여넣습니다.
 * 4) Supabase SQL Editor 에서 /supabase/schema.sql 내용을 실행합니다.
 * => 키가 채워지면 자동으로 "실시간 공유 모드"로 동작합니다.
 *
 * 키가 비어 있으면 "로컬 모드"(이 브라우저에만 저장)로 동작합니다.
 */
window.APP_CONFIG = {
  // 예: "https://abcdefgh.supabase.co"
  SUPABASE_URL: "https://yksoewfdcykladmsoaqt.supabase.co",
  // 예: "eyJhbGciOiJIUzI1NiIsInR5cCI6..." (또는 sb_publishable_... 공개키)
  SUPABASE_ANON_KEY: "sb_publishable_AZENTNz_R3CB8KAvAmXaMQ_NIOTknjN",

  APP_TITLE: "업무 공유",
};

window.IS_CLOUD = Boolean(
  window.APP_CONFIG.SUPABASE_URL && window.APP_CONFIG.SUPABASE_ANON_KEY
);
