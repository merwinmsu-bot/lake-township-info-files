/* Lake Township site — shared behavior */
(function () {
  "use strict";

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Dropdown sections (Township, Residents, Community, Departments) */
  document.querySelectorAll(".nav-item").forEach(function (item) {
    var btn = item.querySelector(".nav-parent");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".nav-item.open").forEach(function (other) {
        if (other !== item) { other.classList.remove("open"); }
      });
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-item")) {
      document.querySelectorAll(".nav-item.open").forEach(function (item) {
        item.classList.remove("open");
        var b = item.querySelector(".nav-parent");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }
  });

  /* Mark current top-level link (dropdown items mark themselves via build.py) */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav > a").forEach(function (a) {
    var href = a.getAttribute("href").split("/").pop();
    if (href === here) a.classList.add("current");
  });
})();

/* ----------------------------------------------------------------------
   Form draft autosave (per-form localStorage), print, and clear.
   Include on any page with a <form data-formkey="unique-key">.
   Buttons: [data-action="print"], [data-action="clear"], [data-action="save"]
   Draft banner: .draft-banner with [data-restore] / [data-dismiss]
   ---------------------------------------------------------------------- */
(function () {
  "use strict";
  var form = document.querySelector("form[data-formkey]");
  if (!form) return;

  var key = "laketwp-draft:" + form.getAttribute("data-formkey");
  var statusEl = document.querySelector("[data-save-status]");
  var banner = document.querySelector(".draft-banner");
  var saveTimer = null;

  function fieldsIn(form) {
    return Array.prototype.slice.call(form.elements).filter(function (el) {
      return el.name && !el.disabled;
    });
  }

  function readDraft() {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeDraft() {
    var data = {};
    fieldsIn(form).forEach(function (el) {
      if (el.type === "checkbox" || el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value;
      }
    });
    try {
      localStorage.setItem(key, JSON.stringify(data));
      if (statusEl) {
        statusEl.textContent = "Draft saved " + new Date().toLocaleTimeString();
      }
    } catch (e) {
      /* storage unavailable — ignore silently */
    }
  }

  function applyDraft(data) {
    if (!data) return;
    fieldsIn(form).forEach(function (el) {
      if (!(el.name in data)) return;
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = el.value === data[el.name];
      } else {
        el.value = data[el.name];
      }
    });
  }

  function clearDraft() {
    try { localStorage.removeItem(key); } catch (e) {}
    fieldsIn(form).forEach(function (el) {
      if (el.type === "checkbox" || el.type === "radio") el.checked = false;
      else el.value = "";
    });
    if (statusEl) statusEl.textContent = "Form cleared.";
  }

  /* Offer to restore an existing draft */
  var existing = readDraft();
  var hasContent = existing && Object.keys(existing).some(function (k) { return existing[k]; });
  if (hasContent && banner) {
    banner.classList.add("show");
    var restoreBtn = banner.querySelector("[data-restore]");
    var dismissBtn = banner.querySelector("[data-dismiss]");
    if (restoreBtn) restoreBtn.addEventListener("click", function () {
      applyDraft(existing);
      banner.classList.remove("show");
    });
    if (dismissBtn) dismissBtn.addEventListener("click", function () {
      banner.classList.remove("show");
    });
  }

  /* Autosave on input, debounced */
  form.addEventListener("input", function () {
    clearTimeout(saveTimer);
    if (statusEl) statusEl.textContent = "Editing…";
    saveTimer = setTimeout(writeDraft, 500);
  });
  form.addEventListener("change", function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(writeDraft, 150);
  });

  /* Toolbar actions */
  document.querySelectorAll('[data-action="print"]').forEach(function (btn) {
    btn.addEventListener("click", function () { writeDraft(); window.print(); });
  });
  document.querySelectorAll('[data-action="save"]').forEach(function (btn) {
    btn.addEventListener("click", writeDraft);
  });
  document.querySelectorAll('[data-action="clear"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (confirm("Clear all fields on this form? This cannot be undone.")) clearDraft();
    });
  });

  form.addEventListener("submit", function (e) { e.preventDefault(); writeDraft(); });
})();
