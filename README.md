# WWI Letters Archive

Local catalogue for scanning, transcribing, and documenting World War I–era correspondence.

## Quick start (no Docker)

```bash
cd ~/Projects/wwi-letters
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000

## Docker

```bash
docker compose up --build
```

> On this machine, the bundled Docker binary reported `bad CPU type in executable` (architecture mismatch). Use the Python venv method until Docker Desktop matches your CPU (Apple Silicon vs Intel).

## Layout

```
masters/       Archival PNG + original HEIC
derivatives/   JPEG viewing copies
transcripts/diplomatic/   Line-faithful drafts ([?uncertain])
transcripts/reading/      Lightly normalized reading copies
metadata/      Per-letter YAML catalogue records
app/           FastAPI viewer (image + editable transcript)
```

## Handwriting recognition notes

- Apple Vision OCR on these samples read **only** the printed YMCA letterhead — not the pencil cursive.
- Drafts here were produced with vision-language transcription; treat `[?…]` as needs human check.
- For collection-scale accuracy: Transkribus public English handwriting models, then a custom model on this hand after ~25–75 corrected pages.

## First letter

**L-00001** — 1919-04-10 — to Blanche — Army & Navy YMCA stationery — Nashville / discharge.
