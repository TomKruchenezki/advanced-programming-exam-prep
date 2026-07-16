# Extraction Issues

## Files requiring manual vision transcription (scanned or badly-encoded PDFs)

- **Advanced Topics in Programming - Part A - Student Solution 2.pdf** (Sample past exams\Advanced Topics in Programming - Part A - Student Solution 2.pdf) — 14 pages, flagged as scanned/low-text-density. Requires Claude vision pass on rendered page images.
- **Advanced Topics in Programming - Part A - Student Solution.pdf** (Sample past exams\Advanced Topics in Programming - Part A - Student Solution.pdf) — 14 pages, flagged as scanned/low-text-density. Requires Claude vision pass on rendered page images.
- **Grade 100, Term A.pdf** (Sample past exams\Grade 100, Term A.pdf) — 19 pages, flagged as scanned/low-text-density. Requires Claude vision pass on rendered page images.
- **Sample test.pdf** (Sample past exams\Sample test.pdf) — 6 pages, flagged as scanned/low-text-density. Requires Claude vision pass on rendered page images.
- **Student Solution 2024 First Term Score 75.pdf** (Sample past exams\Student Solution 2024 First Term Score 75.pdf) — 23 pages, flagged as scanned/low-text-density. Requires Claude vision pass on rendered page images.
- **Programming Summary - Neta.pdf** (Summaries and supporting materials\Programming Summary - Neta.pdf) — 25 pages, flagged as scanned/low-text-density. Requires Claude vision pass on rendered page images.

## Known additional encoding issue (caught by manual review, not automatic heuristic)

- **Summary of advanced programming topics.pdf** — text layer exists but uses a non-standard font encoding; pdftotext/PyMuPDF both yield garbled Latin-lookalike gibberish (not real Hebrew). Lowest-priority source (student summary); requires manual vision pass, not naive text extraction.
- **Summary of Advanced Programming Topics 2022 - Shai Giladi.pdf** — Hebrew lines extracted in reversed (visual) character order. Fixed automatically via scripts/extract/fix_rtl_reversal.py (per-line reversal when line is majority-Hebrew). Fix verified by spot-check but not perfect for mixed Hebrew/English lines — treat as lower-confidence source per source hierarchy (student summary, tier 7).

## Empty files (skipped)

- quizme.txt — 0 bytes, nothing to extract.