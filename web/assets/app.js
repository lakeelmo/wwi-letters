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

  function placeLine(letter) {
    const places = (letter.place_mentioned || [])
      .map(function (p) {
        return p.normalized || p.as_written;
      })
      .filter(Boolean);
    if (!places.length) return "";
    if (places.length <= 2) return places.join(" · ");
    return places.slice(0, 2).join(" · ") + " +";
  }

  function formatText(raw) {
    if (!raw || !String(raw).trim()) {
      return '<p class="empty-copy">No transcript yet.</p>';
    }
    let text = String(raw).replace(/\r\n/g, "\n").trim();
    text = text.replace(/\n---\n[\s\S]*$/, "").trim();
    text = text.replace(/^\[Letterhead:[^\]]*\]\s*/i, "");

    return text
      .split(/\n\s*\n/)
      .map(function (block) {
        const lines = block
          .split("\n")
          .map(function (l) {
            return l.trim();
          })
          .filter(Boolean);
        if (!lines.length) return "";

        if (
          lines.length === 1 &&
          lines[0].length < 48 &&
          !/[.!?]$/.test(lines[0]) &&
          (/^[A-Z.]/.test(lines[0]) || /:$/.test(lines[0]) || /continued/i.test(lines[0]))
        ) {
          return "<h3>" + escapeHtml(lines[0].replace(/:$/, "")) + "</h3>";
        }

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
      '<p class="home-lead">Letters and papers kept together — open one to see the scan, a short summary, and the transcript.</p>' +
      '<ul class="letter-rows">' +
      letters
        .map(function (letter) {
          const blurb = letter.summary || letter.context || "";
          return (
            "<li><a href=\"#/letter/" +
            encodeURIComponent(letter.id) +
            '">' +
            '<span class="when">' +
            escapeHtml(letter.date || "undated") +
            "</span>" +
            '<span class="row-main">' +
            '<span class="title">' +
            escapeHtml(listTitle(letter)) +
            "</span>" +
            (blurb
              ? '<span class="blurb">' + escapeHtml(blurb) + "</span>"
              : "") +
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
    const places = placeLine(letter);

    const pager = pages
      .map(function (p) {
        return (
          '<a class="' +
          (p.n === pageNum ? "is-on" : "") +
          '" href="#/letter/' +
          encodeURIComponent(letter.id) +
          "/" +
          p.n +
          '">' +
          p.n +
          "</a>"
        );
      })
      .join("");

    const summary = letter.summary || "";
    const context = letter.context || "";

    app.innerHTML = shell(
      (letter.date || "undated") + " · " + letter.id,
      '<div class="letter">' +
        '<figure class="stage">' +
        '<div class="stage-toolbar">' +
        '<span class="stage-label">Scan · page ' +
        pageNum +
        " of " +
        pages.length +
        "</span>" +
        (pages.length > 1 ? '<nav class="pager">' + pager + "</nav>" : "") +
        "</div>" +
        '<div class="stage-frame"><img src="' +
        asset(current.image) +
        '" alt="Page ' +
        pageNum +
        '" decoding="async" /></div></figure>' +
        '<aside class="side">' +
        "<h1>" +
        escapeHtml(detailTitle(letter)) +
        "</h1>" +
        '<p class="meta">' +
        escapeHtml(senderLabel(letter)) +
        (letter.date ? " · " + escapeHtml(letter.date) : "") +
        (places ? "<br>" + escapeHtml(places) : "") +
        (letter.stationery ? "<br>" + escapeHtml(letter.stationery) : "") +
        "</p>" +
        (summary || context
          ? '<section class="summary">' +
            "<h2>Summary</h2>" +
            (summary ? "<p>" + escapeHtml(summary) + "</p>" : "") +
            (context ? '<p class="context">' + escapeHtml(context) + "</p>" : "") +
            "</section>"
          : "") +
        '<section class="copy-block">' +
        "<h2>Transcript</h2>" +
        '<div class="prose">' +
        formatText(letter.reading || current.diplomatic || "") +
        "</div></section>" +
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

  fetch(asset("data/catalog.json") + "?v=20260718c")
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
