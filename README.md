# Family Archive

Letters and family papers — scanned, transcribed, and browsable.

## Live site

**https://lakeelmo.github.io/wwi-letters/**

Static SPA. The GitHub repo is currently **public** so Pages can host on a free plan. Treat content as visible on the open web until you add access control.

## Local preview

```bash
python scripts/build_spa_data.py
rm -rf docs && cp -R web docs
mkdir -p docs/data docs/images
cp web/data/* docs/data/
cp web/images/* docs/images/
touch docs/.nojekyll
python3 -m http.server 8765 --directory docs
```

## Local editor

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Collection

| ID | Date | Item |
|----|------|------|
| L-00001 | 1919-04-10 | Letter to Blanche (YMCA / Nashville) |
| L-00002 | undated | Uncle Franny — family update circular |
