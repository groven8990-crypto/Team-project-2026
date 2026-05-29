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
          if (f.type === "image") {
            out[f.name] = imageData[f.name] || "";
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
