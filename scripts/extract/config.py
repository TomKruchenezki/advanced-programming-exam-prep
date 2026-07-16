"""Shared paths for all extraction scripts."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
APP = ROOT / "exam-prep-app"
EXTRACTED = APP / "extracted_materials"
STUDY_CONTENT = APP / "study_content"
REPORTS = APP / "reports"

LECTURES_DIR = ROOT / "Lecture presentations"
LABS_DIR = ROOT / "Presentations from the exercises with exercises and solutions"
EXAMS_DIR = ROOT / "Sample past exams"
SUMMARIES_DIR = ROOT / "Summaries and supporting materials"

for d in [
    EXTRACTED / "lectures",
    EXTRACTED / "labs",
    EXTRACTED / "exams",
    EXTRACTED / "summaries",
    EXTRACTED / "images",
    EXTRACTED / "manual_vision",
    EXTRACTED / "clusters",
    STUDY_CONTENT,
    REPORTS,
]:
    d.mkdir(parents=True, exist_ok=True)


def slugify(name: str) -> str:
    import re
    s = name.rsplit(".", 1)[0]
    s = re.sub(r"[^a-zA-Z0-9]+", "_", s).strip("_").lower()
    return s or "file"
