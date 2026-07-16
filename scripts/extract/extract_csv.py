"""Extract column names + sample rows from IsoCountries.csv (background context only, not exam content)."""
import csv
import json
from config import EXTRACTED, LABS_DIR, slugify


def main():
    csv_path = LABS_DIR / "IsoCountries.csv"
    if not csv_path.exists():
        print("IsoCountries.csv not found, skipping")
        return
    with open(csv_path, encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        rows = list(reader)
    header = rows[0] if rows else []
    sample = rows[1:6]
    result = {
        "id": slugify(csv_path.name),
        "sourcePath": str(csv_path),
        "fileName": csv_path.name,
        "header": header,
        "rowCount": len(rows) - 1,
        "sampleRows": sample,
    }
    out_path = EXTRACTED / "labs" / f"{result['id']}.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK  {csv_path.name} -> {result['rowCount']} rows, columns: {header}")


if __name__ == "__main__":
    main()
