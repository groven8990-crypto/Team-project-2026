/*
 * 데이터 저장소 (Store)
 * - 로컬 모드: 브라우저 localStorage 에 저장
 * - 클라우드 모드: Supabase 실시간 DB 사용 (config.js 에 키가 있을 때)
 *
 * 두 모드 모두 동일한 비동기 인터페이스를 제공합니다.
 *   Store.list(collection)            -> 배열(캐시)
 *   Store.add(collection, obj)        -> Promise
 *   Store.update(collection, id, patch)-> Promise
 *   Store.remove(collection, id)      -> Promise
 *   Store.subscribe(fn)               -> 데이터 변경 시 호출
 *   Store.ready                       -> 최초 로딩 완료 Promise
 */

const COLLECTIONS = [
  "members",
  "tasks",
  "events",
  "resources",
  "meetings",
  "ideas",
  "links",
  "retros",
  "reports",
  "goals",
];

const LS_KEY = "work-share-db-v1";
const LS_USER = "work-share-current-user";

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function nowISO() {
  return new Date().toISOString();
}

const Store = (function () {
  const cache = {};
  COLLECTIONS.forEach((c) => (cache[c] = []));

  const subscribers = new Set();
  let supa = null;
  const mode = window.IS_CLOUD ? "cloud" : "local";

  function notify() {
    subscribers.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
  }

  /* ---------------- 로컬 모드 ---------------- */
  function lsLoad() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        COLLECTIONS.forEach((c) => {
          cache[c] = Array.isArray(data[c]) ? data[c] : [];
        });
      }
    } catch (e) {
      console.error("로컬 데이터 로드 실패", e);
    }
  }
  function lsSave() {
    const data = {};
    COLLECTIONS.forEach((c) => (data[c] = cache[c]));
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }

  /* ---------------- 클라우드 모드 ---------------- */
  async function cloudInit() {
    // supabase-js 는 index.html 의 CDN 스크립트로 로드됨
    supa = window.supabase.createClient(
      window.APP_CONFIG.SUPABASE_URL,
      window.APP_CONFIG.SUPABASE_ANON_KEY
    );
    await Promise.all(
      COLLECTIONS.map(async (c) => {
        const { data, error } = await supa
          .from(c)
          .select("*")
          .order("created_at", { ascending: true });
        if (error) console.error("로드 실패:", c, error.message);
        cache[c] = data || [];
      })
    );
    // 실시간 구독
    COLLECTIONS.forEach((c) => {
      supa
        .channel("rt-" + c)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: c },
          (payload) => {
            const row = payload.new && payload.new.id ? payload.new : payload.old;
            if (!row) return;
            const arr = cache[c];
            const idx = arr.findIndex((x) => x.id === row.id);
            if (payload.eventType === "DELETE") {
              if (idx >= 0) arr.splice(idx, 1);
            } else if (idx >= 0) {
              arr[idx] = payload.new;
            } else {
              arr.push(payload.new);
            }
            notify();
          }
        )
        .subscribe();
    });
  }

  /* ---------------- 공개 API ---------------- */
  function list(collection) {
    return cache[collection] || [];
  }

  async function add(collection, obj) {
    const row = Object.assign(
      { id: uid(), created_at: nowISO() },
      obj
    );
    if (mode === "cloud") {
      const { data, error } = await supa
        .from(collection)
        .insert(row)
        .select()
        .single();
      if (error) {
        alert("저장 실패: " + error.message);
        throw error;
      }
      // 실시간 이벤트가 늦을 수 있으니 즉시 반영
      if (!cache[collection].some((x) => x.id === data.id)) {
        cache[collection].push(data);
        notify();
      }
      return data;
    } else {
      cache[collection].push(row);
      lsSave();
      notify();
      return row;
    }
  }

  async function update(collection, id, patch) {
    const merged = Object.assign({}, patch, { updated_at: nowISO() });
    if (mode === "cloud") {
      const { data, error } = await supa
        .from(collection)
        .update(merged)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        alert("수정 실패: " + error.message);
        throw error;
      }
      const idx = cache[collection].findIndex((x) => x.id === id);
      if (idx >= 0) cache[collection][idx] = data;
      notify();
      return data;
    } else {
      const idx = cache[collection].findIndex((x) => x.id === id);
      if (idx >= 0) {
        cache[collection][idx] = Object.assign({}, cache[collection][idx], merged);
      }
      lsSave();
      notify();
      return cache[collection][idx];
    }
  }

  async function remove(collection, id) {
    if (mode === "cloud") {
      const { error } = await supa.from(collection).delete().eq("id", id);
      if (error) {
        alert("삭제 실패: " + error.message);
        throw error;
      }
    }
    const idx = cache[collection].findIndex((x) => x.id === id);
    if (idx >= 0) cache[collection].splice(idx, 1);
    if (mode === "local") lsSave();
    notify();
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  /* 현재 사용자(선택한 멤버) */
  function getCurrentUserId() {
    return localStorage.getItem(LS_USER) || "";
  }
  function setCurrentUserId(id) {
    localStorage.setItem(LS_USER, id || "");
    notify();
  }

  /* 데이터 내보내기 / 가져오기 (로컬 모드 공유용) */
  function exportJSON() {
    const data = {};
    COLLECTIONS.forEach((c) => (data[c] = cache[c]));
    return JSON.stringify(data, null, 2);
  }
  async function importJSON(text) {
    const data = JSON.parse(text);
    for (const c of COLLECTIONS) {
      if (!Array.isArray(data[c])) continue;
      for (const row of data[c]) {
        const exists = cache[c].some((x) => x.id === row.id);
        if (!exists) await add(c, row);
      }
    }
    notify();
  }

  const ready = (async function init() {
    if (mode === "cloud") {
      await cloudInit();
    } else {
      lsLoad();
    }
  })();

  return {
    COLLECTIONS,
    mode,
    list,
    add,
    update,
    remove,
    subscribe,
    getCurrentUserId,
    setCurrentUserId,
    exportJSON,
    importJSON,
    uid,
    ready,
  };
})();

window.Store = Store;
