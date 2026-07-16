# Worklog — Extraction & Processing Checklist

## Direct files (52)

- [x] Lec_10 _11.pptx — extracted
- [x] Lec_12.pptx — extracted
- [x] Lec_1_2.pptx — extracted
- [x] lec_3.pptx — extracted
- [x] Lec_4.pptx — extracted
- [x] Lec_5.pptx — extracted
- [x] Lec_6.pptx — extracted
- [x] Lec_7.pptx — extracted
- [x] Lec_8.pptx — extracted
- [x] Lec_9.pptx — extracted
- [x] Lab 1.pptx — extracted
- [x] Lab 10.pptx — extracted
- [x] Lab 2.pptx — extracted
- [x] Lab 4-prod.pptx — extracted
- [x] Lab 7.pptx — extracted
- [x] Lab-5.pptx — extracted
- [x] Lab11-s.pptx — extracted
- [x] Lab3_Upd.pptx — extracted
- [x] Lab6n.pptx — extracted
- [x] Presentation8.pptx — extracted
- [x] Lab exercise 2.pdf — extracted
- [x] Lab5_exercise3.pdf — extracted
- [x] main.pdf — extracted
- [x] AdvancedProgramming.zip — extracted
- [x] ATP2021_Lab12.zip — extracted
- [x] ATP2021_Lab3.zip — extracted
- [x] ATP2026_Lab1.zip — extracted
- [x] ATP2026_Lab10.zip — extracted
- [x] ATP2026_Lab2.zip — extracted
- [x] Lab5.zip — extracted
- [x] Lab6.zip — extracted
- [x] Lab7.zip — extracted
- [x] IsoCountries.csv — extracted
- [x] Advanced Topics in Programming - Part A - Student Solution 2.pdf — extracted
- [x] Advanced Topics in Programming - Part A - Student Solution.pdf — extracted
- [x] Advanced topics in programming - Reconstruction of Part A - including answers.pdf — extracted
- [x] Advanced topics in programming - Reconstruction of Time A.pdf — extracted
- [x] Date 2018 without answers.pdf — extracted
- [x] Date 2025 without answers.pdf — extracted
- [x] Grade 100, Term A.pdf — extracted
- [x] Sample test.pdf — extracted
- [x] Student Solution 2024 First Term Score 75.pdf — extracted
- [x] Test 2024 Version A.pdf — extracted
- [x] 2018 Semester B Exam - Version 1 - Advanced Topics in Advanced Programming - Blank Copy.docx — extracted
- [x] Restoration 2023 Version A.docx — extracted
- [x] Advanced topics in DZ programming.pdf — extracted
- [x] Programming Summary - Neta.pdf — extracted
- [x] Summary of Advanced Programming Topics 2022 - Shai Giladi.pdf — extracted
- [x] Summary of advanced programming topics.pdf — extracted
- [x] Summary of all lectures.pdf — extracted
- [x] ATP Summary.docx — extracted
- [x] quizme.txt — empty_skip

## Zip-internal content (9 archives)

- [x] advancedprogramming — 31 java files, 32 total
- [x] atp2021_lab12 — 12 java files, 18 total
- [x] atp2021_lab3 — 12 java files, 12 total
- [x] atp2026_lab1 — 3 java files, 3 total
- [x] atp2026_lab10 — 4 java files, 6 total
- [x] atp2026_lab2 — 9 java files, 10 total
- [x] lab5 — 10 java files, 11 total
- [x] lab6 — 11 java files, 13 total
- [x] lab7 — 11 java files, 13 total

## Next phases

- [x] Phase 2: manual vision transcription of flagged scanned/garbled PDFs
- [x] Phase 3: topic map (16 topics) + exam structure reference — see study_content/topic_map.json, topic_map.md, full_study_guide.md, must_know_definitions.md, common_traps.md, extracted_materials/exam_structure_reference.json
- [x] Phase 4: past-exam question extraction — see extracted_materials/clusters/pastexam_questions.json (73 verified questions), study_content/past_exam_analysis.md, topic_frequency.json, high_yield_topics.md, repeated_questions.md, rejected_questions.json (7 rejected)
- [x] Phase 5: cluster study content + questions + flashcards — 5 clusters, 53 study sections, 221 authored questions, 188 flashcards (see extracted_materials/clusters/cluster{1-5}_*.json)
- [x] Phase 6-7: merge (scripts/mergeContent.py) + assemble 7 mock exams (scripts/assembleMockExams.ts, incl. 1 authentic 2025 past exam) — see src/data/*.json
- [x] Phase 8: validation (scripts/validateQuestionBank.ts) — 0 errors, 4 expected warnings (legitimate cross-year past-exam question repeats); see question_validation_report.md
- [x] Phase 9-11: React/TS app built (10 screens), progress persistence, adaptive selector, study plan generator, shuffle/scoring logic
- [x] Phase 12-13: 76 Vitest tests passing, ESLint clean, build clean, full manual browser walkthrough of all 10 screens (2 real bugs found and fixed: shuffled-option id mismatch in practice mode, missing mistake-log entries + setState-during-render warning in mock/diagnostic/past-exam results)
- [x] Phase 14: README.md, setup.bat, start.bat, final report