"""Consolidate all per-format manifests into one master manifest covering all 52 direct
source files (+ zip-internal contents), and emit source_audit.md / extraction_issues.md / worklog.md.
"""
import json
from pathlib import Path

from config import EXTRACTED, STUDY_CONTENT, ROOT, LECTURES_DIR, LABS_DIR, EXAMS_DIR, SUMMARIES_DIR, slugify

CATEGORY_HIERARCHY_NOTE = {
    "lecture": "1-official-lecture",
    "lab": "2-official-lab",
    "past_exam": "3-6-past-exam (see docType)",
    "summary": "7-student-summary",
}


def load_json(p: Path):
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return []


def classify_exam_doc(filename: str) -> str:
    lower = filename.lower()
    if "blank copy" in lower or "without answers" in lower or ("version a" in lower and "student" not in lower and "grade" not in lower):
        return "official_no_answers"
    if "reconstruction" in lower or "restoration" in lower:
        return "reconstruction"
    if "student solution" in lower or "grade" in lower:
        return "student_solution"
    if "sample test" in lower:
        return "handwritten_notes"
    return "official_no_answers"


def guess_year(filename: str) -> str:
    for token in ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]:
        if token in filename:
            return token
    return "unknown"


def main():
    pptx = {e["id"]: e for e in load_json(EXTRACTED / "pptx_manifest.json")}
    docx_m = {e["id"]: e for e in load_json(EXTRACTED / "docx_manifest.json")}
    pdf_m = {e["id"]: e for e in load_json(EXTRACTED / "pdf_manifest.json")}
    zip_m = {e["id"]: e for e in load_json(EXTRACTED / "zip_manifest.json")}

    all_direct_files = []
    for f in sorted(LECTURES_DIR.glob("*.pptx")):
        all_direct_files.append((f, "lecture"))
    for pattern in ["*.pptx", "*.pdf", "*.zip", "*.csv"]:
        for f in sorted(LABS_DIR.glob(pattern)):
            all_direct_files.append((f, "lab"))
    for pattern in ["*.pdf", "*.docx"]:
        for f in sorted(EXAMS_DIR.glob(pattern)):
            all_direct_files.append((f, "past_exam"))
    for pattern in ["*.pdf", "*.docx", "*.txt"]:
        for f in sorted(SUMMARIES_DIR.glob(pattern)):
            all_direct_files.append((f, "summary"))

    manifest_files = []
    needs_vision_list = []
    error_list = []
    empty_list = []

    for path, category in all_direct_files:
        file_id = slugify(path.name)
        ext = path.suffix.lower()
        size = path.stat().st_size
        entry = {
            "id": file_id,
            "sourcePath": str(path.relative_to(ROOT)),
            "fileName": path.name,
            "category": category,
            "reliabilityTier": CATEGORY_HIERARCHY_NOTE.get(category, "unknown"),
            "extension": ext,
            "sizeBytes": size,
            "status": "unknown",
        }

        if ext == ".pptx":
            src = pptx.get(file_id)
            if src:
                entry.update({
                    "status": src.get("status", "extracted"),
                    "slideCount": src.get("slideCount"),
                    "totalImages": src.get("totalImages"),
                    "outputPath": src.get("outputPath"),
                })
            else:
                entry["status"] = "not_processed"
                error_list.append(entry)
        elif ext == ".docx":
            src = docx_m.get(file_id)
            if src:
                entry.update({
                    "status": src.get("status", "extracted"),
                    "wordCount": src.get("wordCount"),
                    "outputPath": src.get("outputPath"),
                })
            else:
                entry["status"] = "not_processed"
                error_list.append(entry)
        elif ext == ".pdf":
            src = pdf_m.get(file_id)
            if src:
                entry.update({
                    "status": src.get("status", "extracted"),
                    "pageCount": src.get("pageCount"),
                    "needsManualVision": src.get("needsManualVision", False),
                    "outputPath": src.get("outputPath"),
                })
                if src.get("needsManualVision"):
                    needs_vision_list.append(entry)
            else:
                entry["status"] = "not_processed"
                error_list.append(entry)
        elif ext == ".zip":
            src = zip_m.get(file_id)
            if src:
                entry.update({
                    "status": src.get("status", "extracted"),
                    "javaFileCount": src.get("javaFileCount"),
                    "totalFileCount": src.get("totalFileCount"),
                    "outputPath": src.get("outputPath"),
                })
            else:
                entry["status"] = "not_processed"
                error_list.append(entry)
        elif ext == ".csv":
            out_path = EXTRACTED / "labs" / f"{file_id}.json"
            if out_path.exists():
                entry["status"] = "extracted"
                entry["outputPath"] = str(out_path)
            else:
                entry["status"] = "not_processed"
        elif ext == ".txt":
            if size == 0:
                entry["status"] = "empty_skip"
                empty_list.append(entry)
            else:
                entry["status"] = "not_processed"

        if category == "past_exam":
            entry["docType"] = classify_exam_doc(path.name)
            entry["examYear"] = guess_year(path.name)

        manifest_files.append(entry)

    # cross-check count
    assert len(manifest_files) == 52, f"Expected 52 direct files, found {len(manifest_files)}"

    manifest = {
        "generatedAt": __import__("datetime").datetime.now().isoformat(),
        "totalDirectFiles": len(manifest_files),
        "files": manifest_files,
        "manualVisionQueue": needs_vision_list,
        "zipContents": load_json(EXTRACTED / "zip_manifest.json"),
    }

    out_path = STUDY_CONTENT / "source_manifest.json"
    out_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # source_audit.md
    lines = ["# Source Audit — All 52 Direct Files\n"]
    lines.append(f"Generated: {manifest['generatedAt']}\n")
    lines.append("| # | File | Category | Reliability | Status | Notes |")
    lines.append("|---|---|---|---|---|---|")
    for i, e in enumerate(manifest_files, 1):
        notes = ""
        if e.get("needsManualVision"):
            notes = "NEEDS MANUAL VISION"
        if e["status"] == "empty_skip":
            notes = "EMPTY FILE — nothing to extract"
        if e["status"] == "not_processed":
            notes = "NOT YET PROCESSED"
        lines.append(f"| {i} | {e['fileName']} | {e['category']} | {e['reliabilityTier']} | {e['status']} | {notes} |")
    (STUDY_CONTENT / "source_audit.md").write_text("\n".join(lines), encoding="utf-8")

    # extraction_issues.md
    issue_lines = ["# Extraction Issues\n"]
    issue_lines.append("## Files requiring manual vision transcription (scanned or badly-encoded PDFs)\n")
    for e in needs_vision_list:
        issue_lines.append(f"- **{e['fileName']}** ({e['sourcePath']}) — {e.get('pageCount')} pages, flagged as scanned/low-text-density. Requires Claude vision pass on rendered page images.")
    issue_lines.append("\n## Known additional encoding issue (caught by manual review, not automatic heuristic)\n")
    issue_lines.append("- **Summary of advanced programming topics.pdf** — text layer exists but uses a non-standard font encoding; pdftotext/PyMuPDF both yield garbled Latin-lookalike gibberish (not real Hebrew). Lowest-priority source (student summary); requires manual vision pass, not naive text extraction.")
    issue_lines.append("- **Summary of Advanced Programming Topics 2022 - Shai Giladi.pdf** — Hebrew lines extracted in reversed (visual) character order. Fixed automatically via scripts/extract/fix_rtl_reversal.py (per-line reversal when line is majority-Hebrew). Fix verified by spot-check but not perfect for mixed Hebrew/English lines — treat as lower-confidence source per source hierarchy (student summary, tier 7).")
    if error_list:
        issue_lines.append("\n## Processing errors\n")
        for e in error_list:
            issue_lines.append(f"- {e['fileName']}: {e['status']}")
    if empty_list:
        issue_lines.append("\n## Empty files (skipped)\n")
        for e in empty_list:
            issue_lines.append(f"- {e['fileName']} — 0 bytes, nothing to extract.")
    (STUDY_CONTENT / "extraction_issues.md").write_text("\n".join(issue_lines), encoding="utf-8")

    # worklog.md checklist
    work_lines = ["# Worklog — Extraction & Processing Checklist\n"]
    work_lines.append("## Direct files (52)\n")
    for e in manifest_files:
        box = "x" if e["status"] in ("extracted", "empty_skip") else " "
        work_lines.append(f"- [{box}] {e['fileName']} — {e['status']}")
    work_lines.append("\n## Zip-internal content (9 archives)\n")
    for e in manifest["zipContents"]:
        box = "x" if e.get("status") == "extracted" else " "
        work_lines.append(f"- [{box}] {e['id']} — {e.get('javaFileCount', '?')} java files, {e.get('totalFileCount', '?')} total")
    work_lines.append("\n## Next phases\n")
    work_lines.append("- [ ] Phase 2: manual vision transcription of flagged scanned/garbled PDFs")
    work_lines.append("- [ ] Phase 3: topic map")
    work_lines.append("- [ ] Phase 4: past-exam question extraction")
    work_lines.append("- [ ] Phase 5: cluster study content + questions + flashcards")
    work_lines.append("- [ ] Phase 6-7: merge + mock exams")
    work_lines.append("- [ ] Phase 8: validation")
    (STUDY_CONTENT / "worklog.md").write_text("\n".join(work_lines), encoding="utf-8")

    print(f"Manifest: {len(manifest_files)} direct files (expected 52)")
    print(f"Manual vision queue: {len(needs_vision_list)}")
    print(f"Errors: {len(error_list)}, Empty: {len(empty_list)}")
    print("Wrote source_manifest.json, source_audit.md, extraction_issues.md, worklog.md")


if __name__ == "__main__":
    main()
