import { createClient } from "jsr:@supabase/supabase-js@2";

const HUB_URL = "https://groven8990-crypto.github.io/Team-project-2026/hub/";
const HOLIDAYS = new Set([
  "2026-12-25",
  "2027-01-01", "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09",
  "2027-03-01", "2027-05-05", "2027-05-13", "2027-06-06", "2027-08-16",
  "2027-09-14", "2027-09-15", "2027-09-16", "2027-10-04", "2027-10-11", "2027-12-27",
]);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// ───── 날짜 (한국 시간) ─────
const pad = (n: number) => String(n).padStart(2, "0");
const ymdUTC = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const kstToday = () => ymdUTC(new Date(Date.now() + 9 * 3600e3));
const addDays = (s: string, n: number) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return ymdUTC(d); };
const isBiz = (s: string) => { const w = new Date(s + "T00:00:00Z").getUTCDay(); return w > 0 && w < 6 && !HOLIDAYS.has(s); };
const prevBiz = (s: string) => { let d = addDays(s, -1); while (!isBiz(d)) d = addDays(d, -1); return d; };
const short = (s: string) => `${Number(s.slice(5, 7))}/${Number(s.slice(8, 10))}`;

async function cfg(key: string) {
  const { data } = await db.from("hub_config").select("value").eq("key", key).maybeSingle();
  return (data?.value as string) || "";
}
async function teamUser(req: Request) {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt || !jwt.startsWith("ey")) return null;
  const { data } = await db.auth.getUser(jwt);
  return data.user ?? null;
}

// ───── 카카오 ─────
async function kakaoToken(params: Record<string, string>) {
  const secret = await cfg("kakao_client_secret");
  if (secret) params.client_secret = secret;
  const r = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(params),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`카카오 토큰 오류: ${j.error_description || j.error || r.status}`);
  return j;
}
async function accessFor(member: string) {
  const { data: row } = await db.from("hub_kakao").select("*").eq("member", member).maybeSingle();
  if (!row) throw new Error("카톡 알림이 연결되지 않았어요");
  if (new Date(row.access_expires_at).getTime() > Date.now() + 120e3) return row.access_token as string;
  const t = await kakaoToken({ grant_type: "refresh_token", client_id: await cfg("kakao_rest_key"), refresh_token: row.refresh_token });
  const patch: Record<string, unknown> = { access_token: t.access_token, access_expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString() };
  if (t.refresh_token) {
    patch.refresh_token = t.refresh_token;
    if (t.refresh_token_expires_in) patch.refresh_expires_at = new Date(Date.now() + t.refresh_token_expires_in * 1000).toISOString();
  }
  await db.from("hub_kakao").update(patch).eq("member", member);
  return t.access_token as string;
}
async function sendMemo(member: string, text: string, path = "#today") {
  const access = await accessFor(member);
  const tpl = { object_type: "text", text, link: { web_url: HUB_URL + path, mobile_web_url: HUB_URL + path }, button_title: "업무허브 열기" };
  const r = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({ template_object: JSON.stringify(tpl) }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.result_code !== 0) throw new Error(`카톡 발송 오류: ${j.msg || r.status}`);
}
async function notify(slot: string, member: string, text: string, path?: string) {
  try {
    await sendMemo(member, text, path);
    await db.from("hub_notify_log").insert({ slot, member, ok: true });
    return true;
  } catch (e) {
    await db.from("hub_notify_log").insert({ slot, member, ok: false, detail: String((e as Error).message || e) });
    return false;
  }
}

// ───── 예약 알림 ─────
async function remind(slot: string) {
  const today = kstToday();
  if (!isBiz(today)) return { skipped: "휴일" };
  const date = slot === "morning" ? prevBiz(today) : today;
  const [{ data: members }, { data: logs }, { data: leaves }, { data: links }] = await Promise.all([
    db.from("hub_members").select("name, role").eq("active", true).order("sort"),
    db.from("hub_logs").select("member").eq("log_date", date),
    db.from("hub_leaves").select("member, kind").eq("leave_date", date),
    db.from("hub_kakao").select("member"),
  ]);
  const linked = new Set((links || []).map((l) => l.member));
  const staff = (members || []).filter((m) => m.role === "staff");
  const lines: string[] = [];
  const sent: string[] = [];
  for (const s of staff) {
    const lv = (leaves || []).find((l) => l.member === s.name);
    const n = (logs || []).filter((l) => l.member === s.name).length;
    if (lv) { lines.push(`🌴 ${s.name} ${lv.kind}`); continue; }
    if (n) { lines.push(`✓ ${s.name} ${n}건`); continue; }
    lines.push(`✗ ${s.name} 미기록`);
    if (!linked.has(s.name)) continue;
    const text = slot === "morning"
      ? `📝 어제(${short(date)}) 업무 기록이 비어 있어요.\n오늘 기록 화면에서 ‹ 버튼을 눌러 어제 날짜로 넣을 수 있어요.`
      : `📝 오늘(${short(date)}) 업무 기록이 아직 없어요.\n업무 버튼만 누르면 3분이면 끝나요!`;
    if (await notify(slot, s.name, text)) sent.push(s.name);
  }
  if (slot === "evening") {
    const admins = (members || []).filter((m) => m.role === "admin" && linked.has(m.name));
    for (const a of admins) await notify(slot, a.name, `📊 ${short(date)} 업무 기록 현황\n${lines.join("\n")}`, "#board");
  }
  return { date, sent, lines };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "remind") {
      const secret = await cfg("cron_secret");
      if (!secret || req.headers.get("x-hub-cron") !== secret) return json({ error: "forbidden" }, 403);
      return json(await remind(body.slot === "morning" ? "morning" : "evening"));
    }

    if (action === "connect") {
      const { data: p } = await db.from("hub_kakao_pending").select("*").eq("nonce", String(body.state || "")).maybeSingle();
      if (!p || Date.now() - new Date(p.created_at).getTime() > 30 * 60e3) return json({ error: "연결 요청이 만료됐어요. 앱에서 다시 눌러 주세요." }, 400);
      await db.from("hub_kakao_pending").delete().eq("nonce", p.nonce);
      const t = await kakaoToken({ grant_type: "authorization_code", client_id: await cfg("kakao_rest_key"), redirect_uri: HUB_URL, code: String(body.code || "") });
      if (!String(t.scope || "").includes("talk_message")) return json({ error: "'카카오톡 메시지 전송'에 동의해야 알림을 받을 수 있어요." }, 400);
      const now = Date.now();
      await db.from("hub_kakao").upsert({
        member: p.member, access_token: t.access_token, refresh_token: t.refresh_token,
        access_expires_at: new Date(now + t.expires_in * 1000).toISOString(),
        refresh_expires_at: t.refresh_token_expires_in ? new Date(now + t.refresh_token_expires_in * 1000).toISOString() : null,
        connected_at: new Date(now).toISOString(),
      });
      await db.from("hub_members").update({ kakao_at: new Date(now).toISOString() }).eq("name", p.member);
      await notify("connect", p.member, "✅ 업무허브 카톡 알림이 연결됐어요.\n평일 17:50에 그날 기록이 없으면 알려 드릴게요.");
      return json({ ok: true, member: p.member });
    }

    const user = await teamUser(req);
    if (!user) return json({ error: "로그인이 필요해요" }, 401);
    const member = String(body.member || "");
    const { data: m } = await db.from("hub_members").select("name").eq("name", member).eq("active", true).maybeSingle();
    if (!m) return json({ error: "담당자를 찾을 수 없어요" }, 400);

    if (action === "authorize_url") {
      const key = await cfg("kakao_rest_key");
      if (!key) return json({ error: "카카오 앱 연결 준비 중이에요. 관리자에게 알려 주세요." }, 400);
      await db.from("hub_kakao_pending").delete().lt("created_at", new Date(Date.now() - 3600e3).toISOString());
      const nonce = crypto.randomUUID();
      await db.from("hub_kakao_pending").insert({ nonce, member });
      const url = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(key)}&redirect_uri=${encodeURIComponent(HUB_URL)}&scope=talk_message&state=${nonce}`;
      return json({ url });
    }
    if (action === "test") {
      const ok = await notify("test", member, "🔔 업무허브 시험 알림이에요. 잘 받으셨다면 연결 완료!");
      return ok ? json({ ok }) : json({ error: "보내지 못했어요. 다시 연결해 주세요." }, 400);
    }
    if (action === "disconnect") {
      await db.from("hub_kakao").delete().eq("member", member);
      await db.from("hub_members").update({ kakao_at: null }).eq("name", member);
      return json({ ok: true });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
