"""WWI Letters archive — local catalogue and transcription viewer."""

from __future__ import annotations

from pathlib import Path

import yaml
from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

ROOT = Path(__file__).resolve().parent.parent
META_DIR = ROOT / "metadata"
DIPLOMATIC = ROOT / "transcripts" / "diplomatic"
READING = ROOT / "transcripts" / "reading"
DERIV = ROOT / "derivatives"

app = FastAPI(title="WWI Letters Archive")
app.mount("/images", StaticFiles(directory=str(DERIV)), name="images")
app.mount("/static", StaticFiles(directory=str(Path(__file__).parent / "static")), name="static")
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))


def load_letters() -> list[dict]:
    letters = []
    for path in sorted(META_DIR.glob("*.yaml")):
        with path.open() as f:
            data = yaml.safe_load(f)
        data["_meta_path"] = str(path)
        letters.append(data)
    letters.sort(key=lambda x: (x.get("date") or "9999", x.get("id") or ""))
    return letters


def letter_by_id(letter_id: str) -> dict:
    path = META_DIR / f"{letter_id}.yaml"
    if not path.exists():
        raise HTTPException(404, f"Letter {letter_id} not found")
    with path.open() as f:
        data = yaml.safe_load(f)
    data["_meta_path"] = str(path)
    return data


def page_images(letter: dict) -> list[dict]:
    pages = []
    for i, rel in enumerate(letter.get("derivative_paths") or [], start=1):
        name = Path(rel).name
        pages.append(
            {
                "n": i,
                "filename": name,
                "url": f"/images/{name}",
                "diplomatic_path": DIPLOMATIC / f"{letter['id']}_p{i:02d}.txt",
            }
        )
    return pages


def read_text(path: Path) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    letters = load_letters()
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "letters": letters},
    )


@app.get("/letter/{letter_id}", response_class=HTMLResponse)
async def letter_detail(request: Request, letter_id: str, page: int = 1):
    letter = letter_by_id(letter_id)
    pages = page_images(letter)
    if not pages:
        raise HTTPException(404, "No page images")
    page = max(1, min(page, len(pages)))
    current = pages[page - 1]
    diplomatic = read_text(current["diplomatic_path"])
    reading = read_text(READING / f"{letter_id}.txt")
    return templates.TemplateResponse(
        "letter.html",
        {
            "request": request,
            "letter": letter,
            "pages": pages,
            "page": page,
            "current": current,
            "diplomatic": diplomatic,
            "reading": reading,
        },
    )


@app.post("/letter/{letter_id}/save")
async def save_transcript(
    letter_id: str,
    page: int = Form(...),
    diplomatic: str = Form(...),
    reading: str = Form(""),
):
    letter_by_id(letter_id)  # validate
    dip_path = DIPLOMATIC / f"{letter_id}_p{page:02d}.txt"
    dip_path.parent.mkdir(parents=True, exist_ok=True)
    dip_path.write_text(diplomatic.strip() + "\n", encoding="utf-8")
    if reading.strip():
        read_path = READING / f"{letter_id}.txt"
        read_path.parent.mkdir(parents=True, exist_ok=True)
        read_path.write_text(reading.strip() + "\n", encoding="utf-8")
    # bump review status hint in yaml if still raw
    meta_path = META_DIR / f"{letter_id}.yaml"
    text = meta_path.read_text(encoding="utf-8")
    if "review_status: raw" in text:
        meta_path.write_text(
            text.replace("review_status: raw", "review_status: corrected", 1),
            encoding="utf-8",
        )
    return RedirectResponse(f"/letter/{letter_id}?page={page}&saved=1", status_code=303)


@app.get("/health")
async def health():
    return {"ok": True, "letters": len(load_letters())}
