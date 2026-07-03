/* UI 공통 헬퍼: 요소 생성, 모달, 토스트, 확인창, 포맷 */

const UI = (function () {
  /* HTML 이스케이프 */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* 줄바꿈 유지 텍스트 */
  function nl2br(s) {
    return esc(s).replace(/\n/g, "<br>");
  }

  /* 다양한 날짜 표기를 YYYY-MM-DD로 정규화 (못 읽으면 "") */
  function normalizeDate(s) {
    s = (s || "").trim();
    if (!s) return "";
    const p = (n) => String(n).padStart(2, "0");
    const fmt = (dt) => `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
    // 상대 표현 키워드
    const today = new Date();
    const addDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d;
    };
    if (/^(오늘|당일|금일|즉시|바로)/.test(s)) return fmt(today);
    if (/^(내일|익일)/.test(s)) return fmt(addDays(1));
    if (/^(모레)/.test(s)) return fmt(addDays(2));
    if (/(금주|이번\s*주|이번주|주중|이주|이번주말|금주말)/.test(s)) {
      // 이번 주 금요일
      const d = new Date(today);
      d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7));
      return fmt(d);
    }
    let m = s.match(/(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/);
    if (m) return `${m[1]}-${p(m[2])}-${p(m[3])}`;
    m = s.match(/^(\d{1,2})[.\-/월\s]+(\d{1,2})/); // MM-DD → 올해
    if (m) return `${today.getFullYear()}-${p(m[1])}-${p(m[2])}`;
    return "";
  }

  /* 붙여넣은 텍스트를 안건 표 행 배열로 변환
     한 줄 = 한 항목. 탭 또는 | 로 칸 구분. 맨 앞 'No.' 번호열·헤더 줄 자동 처리 */
  function parseItemsText(text) {
    const rows = [];
    String(text || "")
      .split(/\r?\n/)
      .forEach((raw) => {
        const line = raw.replace(/\s+$/, "");
        if (!line.trim()) return;
        let cols;
        if (line.includes("\t")) cols = line.split("\t");
        else if (line.includes("|")) cols = line.split("|");
        else cols = [line];
        cols = cols.map((c) => c.trim()).filter((c, i) => c !== "" || i === 0);
        // 헤더 줄(예: No. 내용 담당자 기한) 건너뛰기
        const norm = cols.map((c) => c.replace(/\s/g, ""));
        const hasOwnerHdr = norm.some((c) => /^(담당자?|담당부서)$/.test(c));
        const hasDueHdr = norm.some((c) => /^(기한|마감일?|일정|완료일?)$/.test(c));
        const hasContHdr = norm.some((c) => /^(no\.?|번호|순번|내용|안건|안건및결과|항목|업무)$/i.test(c));
        if ((hasOwnerHdr || hasDueHdr) && hasContHdr) return;
        // 맨 앞이 순번(숫자)만 있는 칸이면 제거 (No. 열)
        if (cols.length >= 2 && /^\d+\.?$/.test(cols[0])) cols = cols.slice(1);
        // 안건 머리표(- • 1. 등) 제거
        const agenda = (cols[0] || "").replace(/^([-•▪◦*·]|\d+[.)])\s*/, "").trim();
        if (!agenda && !(cols[1] || "").trim()) return;
        rows.push({
          agenda,
          owner: (cols[1] || "").trim(),
          due: normalizeDate(cols[2] || ""),
          done: false,
        });
      });
    return rows.filter((x) => x.agenda || x.owner);
  }

  /* 날짜 포맷 */
  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }
  function fmtDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  }
  function todayInput() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }

  /* 토스트 */
  let toastTimer = null;
  function toast(msg, type) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = "toast show " + (type || "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.className = "toast";
    }, 2200);
  }

  /* 확인창 (Promise<boolean>) */
  function confirmBox(message) {
    return new Promise((resolve) => {
      const ok = window.confirm(message);
      resolve(ok);
    });
  }

  /*
   * 모달 폼.
   * fields: [{name, label, type, value, options?, required?, placeholder?, accept?, full?}]
   * type: text | textarea | date | select | url | image | static
   * 반환: Promise<values|null>
   */
  function formModal({ title, fields, submitText = "저장", values = {} }) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";

      const box = document.createElement("div");
      box.className = "modal";

      const head = document.createElement("div");
      head.className = "modal-head";
      head.innerHTML = `<h3>${esc(title)}</h3>`;
      const closeBtn = document.createElement("button");
      closeBtn.className = "icon-btn";
      closeBtn.innerHTML = "✕";
      head.appendChild(closeBtn);

      const form = document.createElement("form");
      form.className = "modal-body";

      function itemRowHTML(r) {
        r = r || {};
        return `<div class="item-row">
          <input class="ir-agenda" placeholder="안건 및 결과" value="${esc(r.agenda || "")}">
          <input class="ir-owner" placeholder="담당(부서/자)" value="${esc(r.owner || "")}">
          <input class="ir-due" type="date" value="${esc(r.due || "")}">
          <label class="ir-done"><input type="checkbox" ${r.done ? "checked" : ""}></label>
          <button type="button" class="icon-btn ir-del" title="행 삭제">✕</button>
        </div>`;
      }

      const inputs = {};
      fields.forEach((f) => {
        const wrap = document.createElement("div");
        wrap.className = "field" + (f.full ? " full" : "");
        const initial = values[f.name] != null ? values[f.name] : f.value;

        if (f.type === "static") {
          wrap.innerHTML = `<label>${esc(f.label)}</label><div class="static-val">${
            f.html || esc(initial || "")
          }</div>`;
          form.appendChild(wrap);
          return;
        }

        const id = "f_" + f.name;
        let html = `<label for="${id}">${esc(f.label)}${
          f.required ? ' <span class="req">*</span>' : ""
        }</label>`;
        if (f.type === "textarea") {
          html += `<textarea id="${id}" name="${f.name}" rows="${
            f.rows || 4
          }" placeholder="${esc(f.placeholder || "")}">${esc(initial || "")}</textarea>`;
        } else if (f.type === "select") {
          const opts = (f.options || [])
            .map(
              (o) =>
                `<option value="${esc(o.value)}" ${
                  String(initial) === String(o.value) ? "selected" : ""
                }>${esc(o.label)}</option>`
            )
            .join("");
          html += `<select id="${id}" name="${f.name}">${opts}</select>`;
        } else if (f.type === "image") {
          html += `<input id="${id}" name="${f.name}" type="file" accept="image/*">
                   <div class="img-preview" id="${id}_preview">${
            initial ? `<img src="${esc(initial)}">` : ""
          }</div>`;
        } else if (f.type === "checks") {
          const sel = Array.isArray(initial) ? initial : [];
          const opts = f.options || [];
          html += `<div class="checks" id="${id}">
            ${
              opts.length > 8
                ? `<input type="text" class="checks-search" placeholder="🔍 검색…">`
                : ""
            }
            <div class="checks-list">
            ${
              opts.length
                ? opts
                    .map(
                      (o) =>
                        `<label class="check-item"><input type="checkbox" value="${esc(
                          o.value
                        )}" ${sel.includes(o.value) ? "checked" : ""}> ${esc(
                          o.label
                        )}</label>`
                    )
                    .join("")
                : `<span class="muted">선택지가 없습니다 (멤버를 먼저 등록하세요)</span>`
            }
            </div>
          </div>`;
        } else if (f.type === "memsearch") {
          // 검색해서 추가하는 멀티 선택 (체크 목록 없음)
          html += `<div class="memsearch" id="${id}">
            <div class="ms-chips"></div>
            <input type="text" class="ms-input" placeholder="🔍 이름 검색해서 추가…" autocomplete="off">
            <div class="ms-results"></div>
          </div>`;
        } else if (f.type === "color") {
          const colors = f.options || [];
          html += `<div class="color-picker" id="${id}">
            ${colors
              .map(
                (c) =>
                  `<button type="button" class="swatch ${
                    String(initial) === c ? "active" : ""
                  }" data-color="${esc(c)}" style="background:${esc(c)}" title="${esc(
                    c
                  )}"></button>`
              )
              .join("")}
          </div>`;
        } else if (f.type === "imgpaste") {
          const initImgs = Array.isArray(initial) ? initial : [];
          html += `<div class="imgpaste-zone" id="${id}" tabindex="0">
            <div class="imgpaste-hint">📷 이미지를 복사한 뒤 이 영역을 클릭하고 <kbd>Ctrl+V</kbd>로 붙여넣으세요</div>
            <div class="imgpaste-previews">${initImgs.map((src, i) => `<div class="imgpaste-item"><img src="${esc(src)}"><button type="button" class="imgpaste-remove" data-idx="${i}" data-field="${esc(f.name)}">✕</button></div>`).join("")}</div>
          </div>`;
        } else if (f.type === "items") {
          const rows = Array.isArray(initial) && initial.length ? initial : [{}];
          html += `<div class="items-editor" id="${id}">
            <div class="items-head"><span>안건 및 결과</span><span>담당</span><span>기한</span><span>완료</span><span></span></div>
            ${rows.map((r) => itemRowHTML(r)).join("")}
            <div class="items-tools">
              <button type="button" class="btn ghost sm add-item-row" data-target="${id}">+ 행 추가</button>
            </div>
          </div>`;
        } else if (f.type === "wordfile") {
          const initHtml = (typeof initial === "string" && initial.startsWith("__html__:")) ? initial.slice(9) : "";
          html += `<div class="wordfile-field" id="${id}" data-html="${esc(initHtml)}">
            <div class="wordfile-controls">
              <label class="btn ghost sm wordfile-btn" for="${id}_input">📄 Word 파일 선택 (.docx)</label>
              <input type="file" id="${id}_input" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none">
              <span class="wordfile-name muted">${initHtml ? "✅ 기존 Word 내용 로드됨" : ""}</span>
              <button type="button" class="btn ghost sm wordfile-clear" style="display:${initHtml ? "" : "none"}">✕ 초기화</button>
            </div>
            <div class="wordfile-preview" ${initHtml ? "" : "hidden"}>${initHtml}</div>
          </div>`;
        } else {
          const t = f.type === "date" ? "date" : f.type === "url" ? "url" : "text";
          html += `<input id="${id}" name="${f.name}" type="${t}" placeholder="${esc(
            f.placeholder || ""
          )}" value="${esc(initial || "")}">`;
        }
        wrap.innerHTML = html;
        form.appendChild(wrap);
        inputs[f.name] = f;
      });

      // Word 파일(.docx) → HTML 변환 (표 포함) 후 미리보기 + submit 시 target 필드 주입
      fields
        .filter((f) => f.type === "wordfile")
        .forEach((f) => {
          const wrap = form.querySelector(`#f_${f.name}`);
          const input = wrap.querySelector(`#f_${f.name}_input`);
          const nameEl = wrap.querySelector(".wordfile-name");
          const clearBtn = wrap.querySelector(".wordfile-clear");
          const preview = wrap.querySelector(".wordfile-preview");
          const targetEl = f.target ? form.querySelector(`#f_${f.target}`) : null;

          // 기존 Word 내용이 있으면 target textarea 숨김
          if (wrap.dataset.html && targetEl) targetEl.closest(".field").style.display = "none";

          const setHtml = (html, label) => {
            wrap.dataset.html = html;
            preview.innerHTML = html;
            preview.hidden = !html;
            nameEl.textContent = label;
            clearBtn.style.display = html ? "" : "none";
            if (targetEl) targetEl.closest(".field").style.display = html ? "none" : "";
          };

          input.addEventListener("change", async () => {
            const file = input.files[0];
            if (!file) return;
            nameEl.textContent = "읽는 중…";
            try {
              if (typeof mammoth === "undefined") {
                toast("Word 파서가 아직 로딩 중이에요. 잠시 후 다시 시도하세요", "warn");
                nameEl.textContent = "";
                return;
              }
              const arrayBuffer = await file.arrayBuffer();
              const result = await mammoth.convertToHtml({
                arrayBuffer,
                convertImage: mammoth.images.imgElement((img) =>
                  img.read("base64").then((b64) => ({ src: `data:${img.contentType};base64,${b64}` }))
                ),
              });
              setHtml(result.value, `✅ ${file.name} 불러옴`);
            } catch (_) {
              toast("Word 파일을 읽을 수 없습니다", "error");
              nameEl.textContent = "";
            }
          });

          clearBtn.addEventListener("click", () => {
            setHtml("", "");
            input.value = "";
          });
        });

      // 이미지 미리보기 + base64 저장
      const imageData = {};
      fields
        .filter((f) => f.type === "image")
        .forEach((f) => {
          const el = form.querySelector(`#f_${f.name}`);
          const prev = form.querySelector(`#f_${f.name}_preview`);
          imageData[f.name] = values[f.name] || f.value || "";
          el.addEventListener("change", () => {
            const file = el.files[0];
            if (!file) return;
            if (file.size > 3 * 1024 * 1024 && Store.mode === "local") {
              toast("로컬 모드에서는 3MB 이하 이미지를 권장합니다", "warn");
            }
            const reader = new FileReader();
            reader.onload = () => {
              imageData[f.name] = reader.result;
              prev.innerHTML = `<img src="${reader.result}">`;
            };
            reader.readAsDataURL(file);
          });
        });

      // 이미지 붙여넣기(imgpaste)
      const imgPasteData = {};
      fields
        .filter((f) => f.type === "imgpaste")
        .forEach((f) => {
          const zone = form.querySelector(`#f_${f.name}`);
          imgPasteData[f.name] = Array.isArray(values[f.name]) ? [...values[f.name]] : [];
          const redraw = () => {
            const previews = zone.querySelector(".imgpaste-previews");
            const hint = zone.querySelector(".imgpaste-hint");
            previews.innerHTML = imgPasteData[f.name]
              .map(
                (src, i) =>
                  `<div class="imgpaste-item"><img src="${esc(src)}"><button type="button" class="imgpaste-remove" data-idx="${i}" data-field="${esc(f.name)}">✕</button></div>`
              )
              .join("");
            hint.style.display = imgPasteData[f.name].length ? "none" : "";
          };
          redraw();
          zone.addEventListener("paste", (e) => {
            const cd = e.clipboardData;
            if (!cd) return;
            const imgItem = [...cd.items].find((it) => it.type.startsWith("image/"));
            if (!imgItem) return;
            e.preventDefault();
            const file = imgItem.getAsFile();
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              imgPasteData[f.name].push(reader.result);
              redraw();
            };
            reader.readAsDataURL(file);
          });
        });

      // 검색형 멀티 선택(memsearch)
      const memSel = {};
      fields
        .filter((f) => f.type === "memsearch")
        .forEach((f) => {
          const wrap = form.querySelector(`#f_${f.name}`);
          const chips = wrap.querySelector(".ms-chips");
          const input = wrap.querySelector(".ms-input");
          const results = wrap.querySelector(".ms-results");
          const opts = f.options || [];
          const initSel = Array.isArray(values[f.name])
            ? values[f.name]
            : Array.isArray(f.value)
            ? f.value
            : [];
          memSel[f.name] = initSel.slice();

          const labelOf = (id) => {
            const o = opts.find((o) => String(o.value) === String(id));
            return o ? o.label : id;
          };
          const drawChips = () => {
            chips.innerHTML = memSel[f.name].length
              ? memSel[f.name]
                  .map(
                    (id) =>
                      `<span class="ms-chip">${esc(labelOf(id))}<button type="button" class="ms-remove" data-id="${esc(
                        id
                      )}">×</button></span>`
                  )
                  .join("")
              : `<span class="ms-hint">아직 선택한 참여자가 없어요</span>`;
          };
          const drawResults = (q) => {
            const ql = q.trim().toLowerCase();
            if (!ql) {
              results.classList.remove("show");
              results.innerHTML = "";
              return;
            }
            const matches = opts.filter(
              (o) =>
                !memSel[f.name].some((id) => String(id) === String(o.value)) &&
                o.label.toLowerCase().includes(ql)
            );
            results.innerHTML = matches.length
              ? matches
                  .map(
                    (o) =>
                      `<button type="button" class="ms-opt" data-id="${esc(
                        o.value
                      )}">${esc(o.label)}</button>`
                  )
                  .join("")
              : `<div class="ms-empty">검색 결과가 없어요</div>`;
            results.classList.add("show");
          };
          drawChips();
          input.addEventListener("input", () => drawResults(input.value));
          input.addEventListener("focus", () => drawResults(input.value));
          wrap.addEventListener("click", (e) => {
            const opt = e.target.closest(".ms-opt");
            if (opt) {
              memSel[f.name].push(opt.getAttribute("data-id"));
              input.value = "";
              drawChips();
              drawResults("");
              input.focus();
              return;
            }
            const rm = e.target.closest(".ms-remove");
            if (rm) {
              const id = rm.getAttribute("data-id");
              memSel[f.name] = memSel[f.name].filter((x) => String(x) !== String(id));
              drawChips();
            }
          });
        });

      const foot = document.createElement("div");
      foot.className = "modal-foot";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "btn ghost";
      cancel.textContent = "취소";
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "btn primary";
      submit.textContent = submitText;
      foot.appendChild(cancel);
      foot.appendChild(submit);
      form.appendChild(foot);

      box.appendChild(head);
      box.appendChild(form);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      // 안건 행 추가/삭제 + 색상 선택 + 이미지 제거
      form.addEventListener("click", (e) => {
        const add = e.target.closest(".add-item-row");
        if (add) {
          const editor = form.querySelector("#" + add.getAttribute("data-target"));
          editor
            .querySelector(".items-tools")
            .insertAdjacentHTML("beforebegin", itemRowHTML({}));
          return;
        }
        const del = e.target.closest(".ir-del");
        if (del) {
          del.closest(".item-row").remove();
          return;
        }
        const sw = e.target.closest(".swatch");
        if (sw) {
          const picker = sw.closest(".color-picker");
          picker.querySelectorAll(".swatch").forEach((s) => s.classList.remove("active"));
          sw.classList.add("active");
          return;
        }
        const rm = e.target.closest(".imgpaste-remove");
        if (rm) {
          const fieldName = rm.getAttribute("data-field");
          const idx = parseInt(rm.getAttribute("data-idx"), 10);
          if (imgPasteData[fieldName]) {
            imgPasteData[fieldName].splice(idx, 1);
            const zone = form.querySelector(`#f_${fieldName}`);
            const previews = zone.querySelector(".imgpaste-previews");
            const hint = zone.querySelector(".imgpaste-hint");
            previews.innerHTML = imgPasteData[fieldName]
              .map(
                (src, i) =>
                  `<div class="imgpaste-item"><img src="${esc(src)}"><button type="button" class="imgpaste-remove" data-idx="${i}" data-field="${esc(fieldName)}">✕</button></div>`
              )
              .join("");
            hint.style.display = imgPasteData[fieldName].length ? "none" : "";
          }
        }
      });

      // 안건 칸에 표(여러 줄/탭/|)를 붙여넣으면 자동으로 여러 행으로 변환
      form.addEventListener("paste", (e) => {
        const inp = e.target.closest(".ir-agenda");
        if (!inp) return;
        const cd = e.clipboardData || window.clipboardData;
        const text = cd ? cd.getData("text") : "";
        if (!text || !/[\n\t|]/.test(text)) return; // 한 칸짜리면 그냥 붙여넣기
        e.preventDefault();
        const parsed = parseItemsText(text);
        if (!parsed.length) return;
        const editor = inp.closest(".items-editor");
        // 비어있는 행 제거 후 변환된 행 추가
        editor.querySelectorAll(".item-row").forEach((row) => {
          const a = row.querySelector(".ir-agenda").value.trim();
          const o = row.querySelector(".ir-owner").value.trim();
          if (!a && !o) row.remove();
        });
        const tools = editor.querySelector(".items-tools");
        parsed.forEach((r) => tools.insertAdjacentHTML("beforebegin", itemRowHTML(r)));
        toast(`${parsed.length}개 항목을 표로 만들었어요`);
      });

      // 참여자 검색 필터
      form.addEventListener("input", (e) => {
        if (e.target.classList.contains("checks-search")) {
          const q = e.target.value.trim().toLowerCase();
          const list = e.target.parentElement.querySelector(".checks-list");
          list.querySelectorAll(".check-item").forEach((item) => {
            item.style.display = item.textContent.toLowerCase().includes(q) ? "" : "none";
          });
        }
      });

      const first = form.querySelector("input,textarea,select");
      if (first) setTimeout(() => first.focus(), 50);

      function close(result) {
        overlay.remove();
        resolve(result);
      }
      closeBtn.onclick = () => close(null);
      cancel.onclick = () => close(null);
      overlay.addEventListener("mousedown", (e) => {
        if (e.target === overlay) close(null);
      });
      document.addEventListener("keydown", function onKey(e) {
        if (e.key === "Escape") {
          document.removeEventListener("keydown", onKey);
          close(null);
        }
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const out = {};
        for (const f of fields) {
          if (f.type === "static") continue;
          if (f.type === "wordfile") {
            // Word HTML이 있으면 target 필드 값을 __html__: 인코딩으로 덮어쓴다
            const wrap = form.querySelector(`#f_${f.name}`);
            const html = wrap ? wrap.dataset.html || "" : "";
            if (html && f.target) {
              const targetEl = form.querySelector(`#f_${f.target}`);
              if (targetEl) targetEl.value = "__html__:" + html;
            }
            continue;
          }
          if (f.type === "image") {
            out[f.name] = imageData[f.name] || "";
            continue;
          }
          if (f.type === "imgpaste") {
            out[f.name] = imgPasteData[f.name] || [];
            continue;
          }
          if (f.type === "checks") {
            const box = form.querySelector(`#f_${f.name}`);
            out[f.name] = [...box.querySelectorAll("input:checked")].map((i) => i.value);
            continue;
          }
          if (f.type === "memsearch") {
            out[f.name] = (memSel[f.name] || []).slice();
            continue;
          }
          if (f.type === "color") {
            const picker = form.querySelector(`#f_${f.name}`);
            const active = picker.querySelector(".swatch.active");
            out[f.name] = active
              ? active.getAttribute("data-color")
              : values[f.name] || f.value || "";
            continue;
          }
          if (f.type === "items") {
            const editor = form.querySelector(`#f_${f.name}`);
            out[f.name] = [...editor.querySelectorAll(".item-row")]
              .map((row) => ({
                agenda: row.querySelector(".ir-agenda").value.trim(),
                owner: row.querySelector(".ir-owner").value.trim(),
                due: row.querySelector(".ir-due").value,
                done: row.querySelector(".ir-done input").checked,
              }))
              .filter((x) => x.agenda || x.owner);
            continue;
          }
          const el = form.querySelector(`#f_${f.name}`);
          out[f.name] = el ? el.value.trim() : "";
          if (f.required && !out[f.name]) {
            el.focus();
            toast(`${f.label} 항목을 입력하세요`, "warn");
            throw new Error("validation");
          }
        }
        close(out);
      });
    });
  }

  /* 멤버 이름/색 칩 */
  function memberChip(memberId) {
    const m = Store.list("members").find((x) => x.id === memberId);
    if (!m) return `<span class="chip chip-muted">미지정</span>`;
    return `<span class="chip" style="--c:${esc(m.color || "#64748b")}">${esc(
      m.name
    )}</span>`;
  }
  function memberName(memberId) {
    const m = Store.list("members").find((x) => x.id === memberId);
    return m ? m.name : "미지정";
  }
  function memberOptions(includeAll) {
    const opts = Store.list("members").map((m) => ({ value: m.id, label: m.name }));
    return includeAll ? [{ value: "", label: "전체" }, ...opts] : opts;
  }

  return {
    esc,
    nl2br,
    fmtDate,
    fmtDateTime,
    todayInput,
    toast,
    confirmBox,
    formModal,
    memberChip,
    memberName,
    memberOptions,
  };
})();

window.UI = UI;
