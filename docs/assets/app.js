(function () {
  const base = window.__BASE__ || "/";
  const app = document.getElementById("app");
  let catalog = null;

  function asset(path) {
    return base + String(path || "").replace(/^\//, "");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function route() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const path = raw.split("?")[0];
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "letter" && parts[1]) {
      const id = decodeURIComponent(parts[1]);
      const page = parts[2] && /^\d+$/.test(parts[2]) ? parseInt(parts[2], 10) : 1;
      return { name: "letter", id, page };
    }
    return { name: "home" };
  }

  function senderLabel(letter) {
    const s = letter.sender || {};
    return s.normalized || s.as_written || "Unknown writer";
  }

  function listTitle(letter) {
    const r = letter.recipient || {};
    const to = r.normalized || r.as_written;
    if (to && /circular|family update/i.test(to)) {
      return senderLabel(letter).split("(")[0].trim() + " — family update";
    }
    if (to) return "To " + to;
    return letter.id;
  }

  function detailTitle(letter) {
    const r = letter.recipient || {};
    const to = r.normalized || r.as_written;
    if (to && /circular|family update/i.test(to)) return "Family update";
    return "To " + (to || letter.id);
  }

  function placeLabel(letter) {
    const p = (letter.place_mentioned || [])[0];
    if (!p) return "";
    return p.normalized || p.as_written || "";
  }

  /** Turn plain transcript text into readable HTML paragraphs / headings. */
  function formatText(raw, mode) {
    if (!raw || !String(raw).trim()) {
      return '<p class="empty-copy">No transcript yet.</p>';
    }
    let text = String(raw).replace(/\r\n/g, "\n").trim();

    // Drop editorial footer from reading copies
    text = text.replace(/\n---\n[\s\S]*$/, "").trim();

    // Strip letterhead clutter from diplomatic view
    if (mode === "diplomatic") {
      text = text.replace(/^\[Letterhead:[^\]]*\]\s*/i, "");
    }

    const blocks = text.split(/\n\s*\n/);
    return blocks
      .map(function (block) {
        const lines = block.split("\n").map(function (l) {
          return l.trim();
        }).filter(Boolean);
        if (!lines.length) return "";

        // Single short line that looks like a section heading
        if (
          lines.length === 1 &&
          lines[0].length < 48 &&
          !/[.!?]$/.test(lines[0]) &&
          (/^[A-Z]/.test(lines[0]) || /:$/.test(lines[0]) || /continued/i.test(lines[0]))
        ) {
          return "<h3>" + escapeHtml(lines[0].replace(/:$/, "")) + "</h3>";
        }

        // Diplomatic: preserve soft line breaks inside a paragraph
        if (mode === "diplomatic") {
          return (
            "<p>" +
            lines
              .map(function (l) {
                return escapeHtml(l);
              })
              .join("<br>") +
            "</p>"
          );
        }

        // Reading: join wrapped lines into flowing prose
        return "<p>" + escapeHtml(lines.join(" ")) + "</p>";
      })
      .join("");
  }

  function shell(crumb, body) {
    return (
      '<header class="shell-header">' +
      '<p class="mark"><a href="#/">Family Archive</a></p>' +
      '<p class="crumb">' +
      escapeHtml(crumb) +
      "</p></header>" +
      body
    );
  }

  function renderHome() {
    const letters = catalog.letters || [];
    app.innerHTML =
      '<main class="home">' +
      '<p class="home-meta"><span>Private collection</span><span>' +
      letters.length +
      " item" +
      (letters.length === 1 ? "" : "s") +
      "</span></p>" +
      '<h1 class="home-brand">Family Archive</h1>' +
      '<p class="home-lead">Letters and family papers — scanned, transcribed, and kept together. Open any item to read the page beside the words.</p>' +
      '<ul class="letter-rows">' +
      letters
        .map(function (letter) {
          const raw = (letter.review_status || "raw") === "raw";
          return (
            "<li><a href=\"#/letter/" +
            encodeURIComponent(letter.id) +
            '">' +
            '<span class="when">' +
            escapeHtml(letter.date || "undated") +
            "</span>" +
            '<span class="title">' +
            escapeHtml(listTitle(letter)) +
            "</span>" +
            '<span class="status' +
            (raw ? " is-raw" : "") +
            '">' +
            escapeHtml(letter.review_status || "raw") +
            "</span></a></li>"
          );
        })
        .join("") +
      "</ul></main>";
  }

  function renderLetter(id, page) {
    const letter = (catalog.letters || []).find(function (l) {
      return l.id === id;
    });
    if (!letter) {
      app.innerHTML = shell(
        "Missing",
        '<main class="home"><p class="error">Item not found. <a href="#/">Return home</a></p></main>'
      );
      return;
    }

    const pages = letter.pages || [];
    const pageNum = Math.max(1, Math.min(page || 1, pages.length || 1));
    const current = pages[pageNum - 1] || { image: "", diplomatic: "" };
    const place = placeLabel(letter);

    const pager = pages
      .map(function (p) {
        return (
          '<a class="' +
          (p.n === pageNum ? "is-on" : "") +
          '" href="#/letter/' +
          encodeURIComponent(letter.id) +
          "/" +
          p.n +
          '">Page ' +
          p.n +
          "</a>"
        );
      })
      .join("");

    app.innerHTML = shell(
      (letter.date || "undated") + " · " + letter.id,
      '<div class="letter">' +
        '<figure class="stage">' +
        '<div class="stage-toolbar"><span>Original</span><nav class="pager">' +
        pager +
        "</nav></div>" +
        '<div class="stage-frame"><img src="' +
        asset(current.image) +
        '" alt="Page ' +
        pageNum +
        '" /></div></figure>' +
        '<aside class="side">' +
        "<h1>" +
        escapeHtml(detailTitle(letter)) +
        "</h1>" +
        '<p class="meta">' +
        escapeHtml(senderLabel(letter)) +
        (place ? " · " + escapeHtml(place) : "") +
        (letter.stationery ? "<br>" + escapeHtml(letter.stationery) : "") +
        "</p>" +
        '<div class="copy-block">' +
        "<h2>This page</h2>" +
        '<div class="prose">' +
        formatText(current.diplomatic, "diplomatic") +
        "</div></div>" +
        '<div class="copy-block">' +
        "<h2>Reading copy</h2>" +
        '<div class="prose reading">' +
        formatText(letter.reading || "", "reading") +
        "</div></div>" +
        (letter.notes
          ? '<div class="note">' + escapeHtml(letter.notes) + "</div>"
          : "") +
        "</aside></div>"
    );
  }

  function render() {
    if (!catalog) return;
    const r = route();
    if (r.name === "letter") renderLetter(r.id, r.page);
    else renderHome();
    window.scrollTo(0, 0);
  }

  fetch(asset("data/catalog.json"))
    .then(function (res) {
      if (!res.ok) throw new Error("Catalog missing (" + res.status + ")");
      return res.json();
    })
    .then(function (data) {
      catalog = data;
      render();
    })
    .catch(function (err) {
      app.innerHTML =
        '<main class="home"><p class="error">' +
        escapeHtml(err.message) +
        "</p></main>";
    });

  window.addEventListener("hashchange", render);
})();
