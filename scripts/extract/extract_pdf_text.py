"""Extract text from every PDF using PyMuPDF, auto-detecting scanned/garbled pages.

Detection heuristic per page:
- charsPerPage < 40  -> likely scanned (near-empty text layer)
- replacementCharRatio > 0.03 (control chars / total) -> likely garbled encoding
A file is flagged into manualVisionQueue if a MAJORITY of its pages trip either heuristic.
"""
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

from config import EXTRACTED, EXAMS_DIR, SUMMARIES_DIR, LABS_DIR, slugify

CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f�]")


def analyze_page_text(text: str):
    chars = len(text)
    control = len(CONTROL_RE.findall(text))
    ratio = control / chars if chars else 0.0
    return chars, ratio


def extract_one(pdf_path: Path, out_dir: Path, category: str) -> dict:
    file_id = slugify(pdf_path.name)
    doc = fitz.open(str(pdf_path))
    pages_out = []
    flagged_pages = 0
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text")
        chars, ratio = analyze_page_text(text)
        is_bad = chars < 40 or ratio > 0.03
        if is_bad:
            flagged_pages += 1
        pages_out.append({
            "pageNumber": i,
            "text": text,
            "charCount": chars,
            "replacementCharRatio": round(ratio, 4),
            "flaggedBadText": is_bad,
        })
    page_count = len(pages_out)
    needs_manual_vision = page_count > 0 and (flagged_pages / page_count) >= 0.5

    result = {
        "id": file_id,
        "sourcePath": str(pdf_path),
        "category": category,
        "fileName": pdf_path.name,
        "pageCount": page_count,
        "pages": pages_out,
        "flaggedPageCount": flagged_pages,
        "needsManualVision": needs_manual_vision,
    }

    out_path = out_dir / f"{file_id}.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "id": file_id,
        "sourcePath": str(pdf_path),
        "outputPath": str(out_path),
        "pageCount": page_count,
        "flaggedPageCount": flagged_pages,
        "needsManualVision": needs_manual_vision,
        "status": "extracted",
    }


def main():
    jobs = []
    for f in sorted(EXAMS_DIR.glob("*.pdf")):
        jobs.append((f, EXTRACTED / "exams", "past_exam"))
    for f in sorted(SUMMARIES_DIR.glob("*.pdf")):
        jobs.append((f, EXTRACTED / "summaries", "summary"))
    for f in sorted(LABS_DIR.glob("*.pdf")):
        jobs.append((f, EXTRACTED / "labs", "lab"))

    manifest_entries = []
    for pdf_path, out_dir, category in jobs:
        try:
            entry = extract_one(pdf_path, out_dir, category)
            flag = "NEEDS_VISION" if entry["needsManualVision"] else "ok"
            print(f"OK  {category:10s} {pdf_path.name} -> {entry['pageCount']} pages, {entry['flaggedPageCount']} flagged [{flag}]")
        except Exception as e:
            entry = {"id": slugify(pdf_path.name), "sourcePath": str(pdf_path), "status": "error", "error": str(e)}
            print(f"ERR {category:10s} {pdf_path.name}: {e}", file=sys.stderr)
        manifest_entries.append(entry)

    manifest_path = EXTRACTED / "pdf_manifest.json"
    manifest_path.write_text(json.dumps(manifest_entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nWrote {manifest_path} with {len(manifest_entries)} entries")
    needing_vision = [e for e in manifest_entries if e.get("needsManualVision")]
    print(f"Files needing manual vision: {len(needing_vision)}")
    for e in needing_vision:
        print(f"  - {e['sourcePath']}")


if __name__ == "__main__":
    main()
