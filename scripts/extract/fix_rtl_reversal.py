"""Fix PDFs where PyMuPDF extracted Hebrew lines in reversed (visual) character order.

Heuristic: for each line, if the majority of its characters are in the Hebrew
Unicode block (U+0590-05FF), the line was very likely extracted in reversed
order (a known artifact for some Hebrew-authored PDFs) -> reverse the whole
line. Lines that are mostly Latin/English/digits are left untouched, since
those already extract in correct logical order.

This is NOT applied blindly to every PDF -- only to files explicitly listed
in TARGET_IDS below, after a manual spot-check confirmed the reversal
hypothesis holds consistently across multiple pages of that specific file.
"""
import json
from config import EXTRACTED

HEBREW_RANGE = (0x0590, 0x05FF)

TARGET_IDS = [
    ("summaries", "summary_of_advanced_programming_topics_2022_shai_giladi"),
]


def is_hebrew_char(ch):
    return HEBREW_RANGE[0] <= ord(ch) <= HEBREW_RANGE[1]


def fix_line(line: str) -> str:
    letters = [c for c in line if c.isalpha()]
    if not letters:
        return line
    hebrew_count = sum(1 for c in letters if is_hebrew_char(c))
    if hebrew_count / len(letters) > 0.55:
        return line[::-1]
    return line


def fix_text(text: str) -> str:
    lines = text.split("\n")
    return "\n".join(fix_line(l) for l in lines)


def main():
    for category, file_id in TARGET_IDS:
        path = EXTRACTED / category / f"{file_id}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        for page in data["pages"]:
            page["text"] = fix_text(page["text"])
            page["rtlReversalFixApplied"] = True
        data["rtlReversalFixApplied"] = True
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Fixed RTL reversal in {path}")


if __name__ == "__main__":
    main()
