# WWI Letters Archive

Local catalogue for scanning, transcribing, and documenting World War I–era correspondence.

## Static SPA (GitHub Pages)

Hash-routed SPA in `web/` — collection list + side-by-side scan/transcript.

```bash
python scripts/build_spa_data.py   # refreshes web/data + web/images
python3 -m http.server 8765 --directory web
```

Open http://127.0.0.1:8765

After push to `main`, GitHub Actions deploys Pages → **https://lakeelmo.github.io/wwi-letters/**

**Privacy:** GitHub Pages sites are **public on the internet** by default, even when this repository is private. Private page access requires GitHub Enterprise Cloud. Do not enable / leave Pages on if the letters must stay family-only.

## Local editor (FastAPI — saves corrections)

```bash
cd ~/Projects/wwi-letters
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000 — editable transcripts (deployed SPA is read-only).

## Docker

```bash
docker compose up --build
```

Optional; not required. Prefer the venv if Docker is unavailable.

## Layout

```
masters/       Archival PNG (+ HEIC ignored by git)
derivatives/   JPEG viewing copies
transcripts/diplomatic/   Line-faithful drafts ([?uncertain])
transcripts/reading/      Lightly normalized reading copies
metadata/      Per-letter YAML catalogue records
app/           FastAPI editor
web/           Static SPA for browsing / Pages
```

## Handwriting recognition notes

- Apple Vision OCR on these samples read **only** the printed YMCA letterhead — not the pencil cursive.
- Drafts here were produced with vision-language transcription; treat `[?…]` as needs human check.
- For collection-scale accuracy: Transkribus public English handwriting models, then a custom model on this hand after ~25–75 corrected pages.

## First letter

**L-00001** — 1919-04-10 — to Blanche — Army & Navy YMCA stationery — Nashville / discharge.
