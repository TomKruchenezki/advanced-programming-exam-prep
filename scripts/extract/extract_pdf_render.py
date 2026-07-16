"""Render every page of the manual-vision-queue PDFs to PNG images at 200 DPI for Claude to read directly."""
import json
from pathlib import Path

import fitz

from config import EXTRACTED, STUDY_CONTENT, slugify

# Manually confirmed via spot-check to have genuinely garbled/unusable text extraction
# despite not tripping the automatic charCount/replacementChar heuristic (custom font
# encoding produces plausible-looking but wrong Latin-lookalike gibberish).
MANUAL_OVERRIDE_PATHS = [
    r"Summaries and supporting materials\Summary of advanced programming topics.pdf",
]


def render_pdf(pdf_path: Path, dpi=200):
    file_id = slugify(pdf_path.name)
    img_dir = EXTRACTED / "images" / file_id / "rendered_pages"
    img_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(str(pdf_path))
    zoom = dpi / 72
    mat = fitz.Matrix(zoom, zoom)
    pages = []
    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=mat)
        out_path = img_dir / f"page_{i:03d}.png"
        pix.save(str(out_path))
        pages.append(str(out_path))
    return pages


def main():
    manifest_path = STUDY_CONTENT / "source_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    queue = list(manifest.get("manualVisionQueue", []))

    root = manifest_path.parents[2]
    for rel in MANUAL_OVERRIDE_PATHS:
        full = root / rel
        if full.exists():
            queue.append({
                "id": slugify(full.name),
                "sourcePath": str(rel),
                "fileName": full.name,
                "manualOverride": True,
            })

    render_index = []
    for entry in queue:
        full_path = root / entry["sourcePath"]
        if not full_path.exists():
            print(f"MISSING: {full_path}")
            continue
        pages = render_pdf(full_path)
        render_index.append({
            "id": entry["id"],
            "fileName": entry["fileName"],
            "sourcePath": entry["sourcePath"],
            "renderedPages": pages,
            "pageCount": len(pages),
        })
        print(f"Rendered {entry['fileName']} -> {len(pages)} pages")

    out_path = EXTRACTED / "manual_vision_render_index.json"
    out_path.write_text(json.dumps(render_index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nWrote {out_path} with {len(render_index)} files queued for vision transcription")


if __name__ == "__main__":
    main()
