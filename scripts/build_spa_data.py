#!/usr/bin/env python3
"""Build web/data/catalog.json from metadata + transcripts."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
META = ROOT / "metadata"
DIP = ROOT / "transcripts" / "diplomatic"
READ = ROOT / "transcripts" / "reading"
DERIV = ROOT / "derivatives"
WEB = ROOT / "web"
OUT_DATA = WEB / "data"
OUT_IMG = WEB / "images"


def clean(text) -> str:
    if text is None:
        return ""
    return str(text).strip()


def main() -> None:
    OUT_DATA.mkdir(parents=True, exist_ok=True)
    OUT_IMG.mkdir(parents=True, exist_ok=True)

    letters = []
    for path in sorted(META.glob("*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        letter_id = data["id"]
        pages = []
        for i, rel in enumerate(data.get("derivative_paths") or [], start=1):
            src = ROOT / rel
            name = Path(rel).name
            if src.exists():
                shutil.copy2(src, OUT_IMG / name)
            dip = DIP / f"{letter_id}_p{i:02d}.txt"
            pages.append(
                {
                    "n": i,
                    "image": f"images/{name}",
                    "diplomatic": dip.read_text(encoding="utf-8") if dip.exists() else "",
                }
            )
        reading_path = READ / f"{letter_id}.txt"
        date_val = data.get("date")
        if hasattr(date_val, "isoformat"):
            date_val = date_val.isoformat()
        letters.append(
            {
                "id": letter_id,
                "date": date_val,
                "date_as_written": data.get("date_as_written"),
                "sender": data.get("sender") or {},
                "recipient": data.get("recipient") or {},
                "place_mentioned": data.get("place_mentioned") or [],
                "stationery": data.get("stationery"),
                "topics": data.get("topics") or [],
                "page_count": data.get("page_count") or len(pages),
                "review_status": data.get("review_status"),
                "htr_confidence": data.get("htr_confidence"),
                "summary": clean(data.get("summary")),
                "context": clean(data.get("context")),
                "notes": clean(data.get("notes")),
                "reading": reading_path.read_text(encoding="utf-8") if reading_path.exists() else "",
                "pages": pages,
            }
        )

    letters.sort(key=lambda x: (x.get("date") or "9999", x["id"]))
    catalog = {"generated": True, "letters": letters}
    (OUT_DATA / "catalog.json").write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False, default=str) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(letters)} letters → {OUT_DATA / 'catalog.json'}")


if __name__ == "__main__":
    main()
