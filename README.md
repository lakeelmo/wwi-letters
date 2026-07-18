# WWI Letters Archive

Handwritten WWI-era correspondence — scanned, transcribed, and browsable.

## Live site

**https://lakeelmo.github.io/wwi-letters/**

Static SPA (hash-routed). The GitHub repo is currently **public** so Pages can host on a free plan. Treat content as visible on the open web until you add access control.

## Local SPA preview

```bash
python scripts/build_spa_data.py
python3 -m http.server 8765 --directory docs
```

## Local editor (saves transcript files)

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

After editing metadata/transcripts, rebuild `docs/` before pushing:

```bash
python scripts/build_spa_data.py
rm -rf docs && cp -R web docs
mkdir -p docs/data docs/images
cp web/data/* docs/data/
cp web/images/* docs/images/
touch docs/.nojekyll
```

## Layout

```
masters/       Archival PNG
derivatives/   JPEG sources for the SPA
transcripts/   Diplomatic + reading copies
metadata/      Per-letter YAML
app/           FastAPI editor (local)
web/           SPA source
docs/          Published SPA (GitHub Pages)
```

## First letter

**L-00001** — 1919-04-10 — to Blanche — Army & Navy YMCA — Nashville / discharge.
