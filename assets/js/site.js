// ossian.games — progressive enhancement. Every page reads fine without this file.

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const icon = {
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  };

  // ---------- Mobile nav ----------

  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- Headings: ids, numbering, table of contents ----------

  const prose = $(".prose");
  const toc = $(".toc");
  if (prose) {
    const used = new Set();
    const slug = (text) => {
      let base = text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
      let id = base, n = 2;
      while (used.has(id) || document.getElementById(id)) id = `${base}-${n++}`;
      used.add(id);
      return id;
    };

    const heads = $$(":scope > h2, :scope > h3", prose);
    let h2n = 0;
    heads.forEach((h) => {
      if (!h.id) h.id = slug(h.textContent);
      if (h.tagName === "H2") h.dataset.num = String(++h2n).padStart(2, "0");
    });

    if (toc && heads.length > 2) {
      const list = document.createElement("ol");
      heads.forEach((h) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `#${h.id}`;
        a.textContent = h.textContent.trim();
        li.appendChild(a);
        if (h.tagName === "H3") li.className = "toc__sub";
        list.appendChild(li);
      });
      toc.appendChild(list);

      const links = new Map($$("a", toc).map((a) => [a.hash.slice(1), a]));
      const setActive = (id) => {
        links.forEach((a) => a.classList.remove("is-active"));
        const a = links.get(id);
        if (a) {
          a.classList.add("is-active");
          const top = a.offsetTop - toc.clientHeight / 2;
          toc.scrollTo({ top, behavior: "auto" });
        }
      };
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActive(visible[0].target.id);
        }, { rootMargin: "-72px 0px -72% 0px" });
        heads.forEach((h) => io.observe(h));
      }
    } else if (toc) {
      toc.remove();
    }
  }

  // ---------- Figures: numbering + lightbox ----------

  const figs = $$(".fig");
  $$(".fig figcaption").forEach((cap, i) => { cap.dataset.n = String(i + 1).padStart(2, "0"); });

  if (figs.length && typeof HTMLDialogElement === "function") {
    const box = document.createElement("dialog");
    box.className = "lightbox";
    box.setAttribute("aria-label", "Image viewer");
    box.innerHTML = `<button class="lightbox__close" type="button" aria-label="Close">${icon.close}</button><img alt=""><p></p>`;
    document.body.appendChild(box);
    const boxImg = $("img", box);
    const boxCap = $("p", box);

    box.addEventListener("click", (e) => {
      if (e.target === box || e.target.closest(".lightbox__close")) box.close();
    });
    box.addEventListener("close", () => { boxImg.removeAttribute("src"); document.body.style.overflow = ""; });

    figs.forEach((fig) => {
      const cap = $("figcaption", fig);
      $$(".fig__frame img", fig).forEach((img) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", `Enlarge image: ${img.alt}`);
        img.replaceWith(btn);
        btn.appendChild(img);
        btn.addEventListener("click", () => {
          boxImg.src = img.currentSrc || img.src;
          boxImg.alt = img.alt;
          boxCap.textContent = cap ? cap.textContent : "";
          boxCap.hidden = !cap;
          document.body.style.overflow = "hidden";
          box.showModal();
        });
      });
    });
  }

  // ---------- Code: highlighting, header bar, copy ----------

  const KEYWORDS = new Set(("void float int bool double char long short unsigned if else return const constexpr for foreach in " +
    "var new public private protected internal static class struct enum switch case break default continue while do " +
    "true false null nullptr this auto out ref using namespace override virtual string delete typeof sizeof").split(" "));
  const TYPES = new Set("Dictionary SerializableDictionary GameData ISave SkillTypes Vector2Int Vector3Int Vector3 List Stack".split(" "));
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])')|(\b\d+(?:\.\d+)?f?\b)|([A-Za-z_]\w*)|([{}()[\];,.<>:=+\-*/&|!?%^~]+)/g;

  const highlight = (src) => {
    let out = "", last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(src))) {
      out += esc(src.slice(last, m.index));
      const [tok, comment, str, num, ident, punct] = m;
      if (comment) out += `<span class="tok-c">${esc(tok)}</span>`;
      else if (str) out += `<span class="tok-s">${esc(tok)}</span>`;
      else if (num) out += `<span class="tok-n">${tok}</span>`;
      else if (ident) {
        const next = src.slice(TOKEN.lastIndex).match(/^\s*(\S)/);
        if (KEYWORDS.has(tok)) out += `<span class="tok-k">${tok}</span>`;
        else if (next && next[1] === "(") out += `<span class="tok-f">${tok}</span>`;
        else if (TYPES.has(tok) || /^[FUAETI][A-Z][a-z]/.test(tok)) out += `<span class="tok-t">${tok}</span>`;
        else out += tok;
      } else if (punct) out += `<span class="tok-p">${esc(tok)}</span>`;
      last = TOKEN.lastIndex;
    }
    return out + esc(src.slice(last));
  };

  $$("pre code").forEach((code) => { code.innerHTML = highlight(code.textContent); });

  $$("figure.code").forEach((fig) => {
    const pre = $("pre", fig);
    const bar = document.createElement("div");
    bar.className = "code__bar";
    const label = document.createElement("span");
    label.innerHTML = `<span class="code__lang"></span> <span class="code__name"></span>`;
    $(".code__lang", label).textContent = fig.dataset.lang || "code";
    $(".code__name", label).textContent = fig.dataset.name ? `· ${fig.dataset.name}` : "";
    label.style.minWidth = "0";
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";
    label.style.whiteSpace = "nowrap";
    bar.appendChild(label);

    if (navigator.clipboard) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code__copy";
      btn.innerHTML = `${icon.copy}<span>Copy</span>`;
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.textContent);
          btn.innerHTML = `${icon.check}<span>Copied</span>`;
        } catch {
          btn.innerHTML = `${icon.copy}<span>Failed</span>`;
        }
        setTimeout(() => { btn.innerHTML = `${icon.copy}<span>Copy</span>`; }, 1600);
      });
      bar.appendChild(btn);
    }
    fig.insertBefore(bar, pre);
  });

  // ---------- Video facade: nothing loads from YouTube until clicked ----------

  $$(".video[data-yt]").forEach((wrap) => {
    const btn = $("button", wrap);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(wrap.dataset.yt)}?autoplay=1&rel=0`;
      iframe.title = wrap.dataset.title || "Video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      btn.replaceWith(iframe);
    });
  });

  // ---------- Footer year ----------

  $$("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
