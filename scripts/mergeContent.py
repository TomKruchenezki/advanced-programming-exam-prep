"""Merge all cluster + past-exam content into the final src/data/*.json files consumed by the app."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLUSTERS = ROOT / "extracted_materials" / "clusters"
STUDY_CONTENT = ROOT / "study_content"
DATA = ROOT / "src" / "data"

CLUSTER_IDS = [1, 2, 3, 4, 5]


def load(path: Path, default=None):
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    print(f"WARNING: missing {path}")
    return default if default is not None else []


def main():
    all_sections = []
    all_questions = []
    all_flashcards = []

    for n in CLUSTER_IDS:
        all_sections.extend(load(CLUSTERS / f"cluster{n}_sections.json"))
        all_questions.extend(load(CLUSTERS / f"cluster{n}_questions.json"))
        all_flashcards.extend(load(CLUSTERS / f"cluster{n}_flashcards.json"))

    past_exam_questions = load(CLUSTERS / "pastexam_questions.json")
    all_questions.extend(past_exam_questions)

    # ---- de-dupe by id (last write wins), report collisions ----
    def dedupe(items, label):
        by_id = {}
        collisions = []
        for item in items:
            iid = item["id"]
            if iid in by_id:
                collisions.append(iid)
            by_id[iid] = item
        if collisions:
            print(f"WARNING: {len(collisions)} duplicate {label} ids collapsed: {collisions[:10]}{'...' if len(collisions) > 10 else ''}")
        return list(by_id.values())

    all_sections = dedupe(all_sections, "section")
    all_questions = dedupe(all_questions, "question")
    all_flashcards = dedupe(all_flashcards, "flashcard")

    # ---- topics: trim rich topic_map.json down to the app's Topic interface ----
    topic_map = load(STUDY_CONTENT / "topic_map.json")
    sections_by_topic: dict[str, list[str]] = {}
    for s in all_sections:
        sections_by_topic.setdefault(s["topicId"], []).append(s["id"])

    app_topics = []
    for t in topic_map:
        app_topics.append({
            "id": t["id"],
            "order": t["order"],
            "titleHe": t["titleHe"],
            "titleEn": t["titleEn"],
            "lectureRefs": t.get("lectureRefs", []),
            "examFrequency": t["examFrequency"],
            "summary": t.get("definitionHe", t.get("intuitiveExplanationHe", "")),
            "sectionIds": sections_by_topic.get(t["id"], []),
        })

    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "topics.json").write_text(json.dumps(app_topics, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "questions.json").write_text(json.dumps(all_questions, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "flashcards.json").write_text(json.dumps(all_flashcards, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA / "studySections.json").write_text(json.dumps(all_sections, ensure_ascii=False, indent=2), encoding="utf-8")

    active_questions = [q for q in all_questions if q.get("active") and not q.get("needsReview")]

    print(f"Topics: {len(app_topics)}")
    print(f"Study sections: {len(all_sections)}")
    print(f"Questions total: {len(all_questions)} (active: {len(active_questions)})")
    print(f"Flashcards: {len(all_flashcards)}")

    # ---- past exam index: group past-exam-sourced questions by year for the Past Exams screen ----
    by_year: dict[str, list[str]] = {}
    for q in past_exam_questions:
        if not q.get("active") or q.get("needsReview"):
            continue
        year = str(q.get("pastExamYear") or "unknown")
        by_year.setdefault(year, []).append(q["id"])

    past_exam_index = []
    for year, qids in sorted(by_year.items()):
        past_exam_index.append({
            "id": f"pastexam-{year}",
            "fileName": f"מבחן {year}",
            "year": int(year) if year.isdigit() else year,
            "docType": "reconstruction",
            "isScanned": True,
            "questionIds": qids,
        })
    (DATA / "pastExamIndex.json").write_text(json.dumps(past_exam_index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Past exam years indexed: {[e['year'] for e in past_exam_index]}")


if __name__ == "__main__":
    main()
