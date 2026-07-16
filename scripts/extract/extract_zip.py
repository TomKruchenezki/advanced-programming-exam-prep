"""Extract the 9 lab ZIP archives: unpack, then read all real Java/config/resource source files."""
import json
import zipfile
import sys
from pathlib import Path

from config import EXTRACTED, LABS_DIR, slugify

TEXT_EXTS = {".java", ".xml", ".fxml", ".css", ".properties", ".txt", ".md"}
IGNORE_DIR_PARTS = {"__MACOSX", "target", "out", "build", ".git", ".idea"}
IGNORE_SUFFIXES = {".class", ".DS_Store", ".iml"}


def should_skip(rel_path: Path) -> bool:
    parts = set(rel_path.parts)
    if parts & IGNORE_DIR_PARTS:
        return True
    if rel_path.name in IGNORE_SUFFIXES or rel_path.suffix in IGNORE_SUFFIXES:
        return True
    if rel_path.name == ".DS_Store":
        return True
    return False


def extract_one(zip_path: Path) -> dict:
    file_id = slugify(zip_path.name)
    raw_dir = EXTRACTED / "labs" / file_id / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(raw_dir)

    files_out = []
    skipped = 0
    for p in sorted(raw_dir.rglob("*")):
        if p.is_dir():
            continue
        rel = p.relative_to(raw_dir)
        if should_skip(rel):
            skipped += 1
            continue
        if p.suffix.lower() in TEXT_EXTS or p.name == "pom.xml":
            try:
                content = p.read_text(encoding="utf-8", errors="replace")
            except Exception as e:
                content = f"ERROR reading file: {e}"
            files_out.append({"path": str(rel).replace("\\", "/"), "content": content})
        else:
            # binary/resource (images etc.) - just record presence
            files_out.append({"path": str(rel).replace("\\", "/"), "content": None, "binary": True, "sizeBytes": p.stat().st_size})

    result = {
        "id": file_id,
        "sourcePath": str(zip_path),
        "fileName": zip_path.name,
        "extractedTo": str(raw_dir),
        "files": files_out,
        "javaFileCount": sum(1 for f in files_out if f["path"].endswith(".java")),
        "totalFileCount": len(files_out),
        "skippedNoiseEntries": skipped,
    }

    out_path = EXTRACTED / "labs" / f"{file_id}_zipcontent.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "id": file_id,
        "sourcePath": str(zip_path),
        "outputPath": str(out_path),
        "javaFileCount": result["javaFileCount"],
        "totalFileCount": result["totalFileCount"],
        "status": "extracted",
    }


def main():
    manifest_entries = []
    for zip_path in sorted(LABS_DIR.glob("*.zip")):
        try:
            entry = extract_one(zip_path)
            print(f"OK  {zip_path.name} -> {entry['javaFileCount']} java files, {entry['totalFileCount']} total meaningful files")
        except Exception as e:
            entry = {"id": slugify(zip_path.name), "sourcePath": str(zip_path), "status": "error", "error": str(e)}
            print(f"ERR {zip_path.name}: {e}", file=sys.stderr)
        manifest_entries.append(entry)

    manifest_path = EXTRACTED / "zip_manifest.json"
    manifest_path.write_text(json.dumps(manifest_entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nWrote {manifest_path} with {len(manifest_entries)} entries")


if __name__ == "__main__":
    main()
