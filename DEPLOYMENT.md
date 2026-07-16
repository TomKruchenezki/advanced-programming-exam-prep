# פריסה ל-GitHub Pages

מדריך שלב-אחר-שלב לפרסום האתר בחינם ב-GitHub Pages, כך שתוכל לשתף אותו בקישור ציבורי ולהשתמש בו מכל מכשיר.

## 0. לפני שמתחילים — מבנה הפרויקט (חשוב!)

תיקיית הפרויקט `exam-prep-app` (זו שבה נמצא קובץ זה) היא **שורש ה-repository** שתדחוף ל-GitHub — לא התיקייה שמעליה. התיקייה שמעליה ("Exam preparation folder for the Advanced Topics in Programming course") מכילה גם את 4 תיקיות חומרי המקור המקוריים של הקורס (מצגות הרצאה, מצגות תרגול, מבחני עבר, סיכומים) — **אלה לא הועתקו לתוך `exam-prep-app` בשום שלב**, ואסור להעלות אותן ל-GitHub.

לכן: תמיד עבדו מתוך `exam-prep-app/` עצמה, ולעולם אל תריצו `git init` בתיקייה שמעליה.

## 1. יצירת מאגר (repository) חדש ב-GitHub

1. היכנסו ל-https://github.com/new
2. בחרו שם למאגר (לדוגמה `exam-prep-app`) — שם זה יהפוך לחלק מכתובת האתר: `https://<שם-המשתמש>.github.io/<שם-המאגר>/`
3. בחרו Public (כדי שהאתר יהיה נגיש) או Private (GitHub Pages זמין גם למאגרים פרטיים בחשבונות מסוימים)
4. **אל תסמנו** "Add a README file" / ".gitignore" / "license" — הפרויקט כבר מכיל את כל אלה
5. לחצו "Create repository"

## 2. איזו תיקייה דוחפים?

**רק את `exam-prep-app`**. אחרי יצירת המאגר, ב-GitHub תוצג לכם כתובת כמו:
```
https://github.com/<שם-המשתמש>/<שם-המאגר>.git
```
שמרו אותה — תצטרכו אותה בשלב הבא.

## 3. הפעלת Git ודחיפה ראשונית

פתחו טרמינל **בתוך תיקיית `exam-prep-app`** והריצו, שורה אחר שורה:

```bash
git init
git add .
git commit -m "Initial commit: exam prep app"
git branch -M main
git remote add origin https://github.com/<שם-המשתמש>/<שם-המאגר>.git
git push -u origin main
```

> אם `git` מבקש שם משתמש/סיסמה ודוחה אותה — GitHub דורש כיום Personal Access Token במקום סיסמה רגילה, או שימוש ב-GitHub CLI (`gh auth login`). ראו https://docs.github.com/en/authentication

## 4. הפעלת GitHub Pages

1. במאגר ב-GitHub, לכו ל-**Settings** → **Pages** (בתפריט הצד)
2. תחת "Build and deployment" → "Source", בחרו **"GitHub Actions"** (לא "Deploy from a branch")
3. זהו — אין צורך בהגדרה נוספת. הקובץ `.github/workflows/deploy.yml` שכבר קיים בפרויקט יופעל אוטומטית בכל push ל-`main`, ויבנה ויפרסם את האתר.

## 5. איך מוצאים את כתובת האתר שפורסם

לאחר שה-workflow רץ בהצלחה בפעם הראשונה (לוקח כ-1-3 דקות):
- לכו ל-**Actions** בראש המאגר → תראו ריצה בשם "Deploy to GitHub Pages" — לחצו עליה, ואז על ה-job "deploy" — הכתובת מוצגת שם תחת "Deploy to GitHub Pages" (`environment.url`)
- או: **Settings** → **Pages** — הכתובת מוצגת בראש העמוד ("Your site is live at...")

הכתובת תהיה בפורמט `https://<שם-המשתמש>.github.io/<שם-המאגר>/`.

## 6. איך מעדכנים את האתר בעתיד

כל `git push` ל-branch `main` מפעיל אוטומטית מחדש את ה-workflow, שבונה ומפרסם את הגרסה העדכנית. אין צורך בפעולה ידנית נוספת:

```bash
git add .
git commit -m "תיאור השינוי"
git push
```

## 7. מה עושים אם ה-Action נכשל

1. לכו ל-**Actions** במאגר ולחצו על הריצה שנכשלה (סימון X אדום)
2. פתחו את ה-job שנכשל וקראו את הלוג — השלב שנכשל יהיה מסומן באדום
3. הגורמים הנפוצים ביותר:
   - **`npm run verify` נכשל** — כלומר יש בעיה בבדיקות/lint/build שקיימת גם מקומית. הריצו `npm run verify` אצלכם במחשב לפני push הבא ותקנו את מה שנכשל.
   - **GitHub Pages לא הופעל** — ודאו ש-Settings → Pages → Source מוגדר ל-"GitHub Actions" (שלב 4).
   - **הרשאות (Permissions)** — אם המאגר שייך לארגון (Organization), ייתכן שצריך לאשר הרשאות Pages ברמת הארגון (Settings → Actions → General ברמת הארגון).

## 8. דומיין מותאם אישית (Custom Domain)

לא נדרש כרגע. אם בעתיד תרצו כתובת משלכם (כמו `study.example.com`) במקום `github.io`, ראו את המדריך הרשמי של GitHub: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## 9. אזהרה חשובה — זכויות יוצרים על חומרי הקורס

- תיקיית `extracted_materials/` (חילוץ גולמי מהמצגות/PDF המקוריים, כ-250MB) כבר מוגדרת ב-`.gitignore` ולא תיכנס ל-git — כך צריך להישאר.
- 4 תיקיות חומרי המקור המקוריים (מצגות הרצאה, מצגות תרגול, מבחני עבר, סיכומים) נמצאות **מחוץ** לתיקיית `exam-prep-app` לגמרי ולא הועתקו לתוכה בשום שלב — כך שאין סיכון להעלות אותן בטעות כל עוד אתם דוחפים רק את `exam-prep-app`.
- תיקיית `study_content/` (הסיכומים, מפת הנושאים, ניתוח מבחני העבר) **כן** נכללת ב-git — זהו תוכן שנוצר/עובד במיוחד עבור הפרויקט הזה ולא שכפול ישיר של שקופיות המרצה.
- **לפני שיתוף פומבי**, ודאו שאתם רשאים לפי מדיניות הקורס/האוניברסיטה לשתף ניתוח ותרגול המבוססים על חומרי הקורס. אם לא בטוחים — הגדירו את המאגר כ-Private.

## 10. בדיקה מקומית לפני דחיפה

לפני כל `push`, אפשר לבדוק מקומית שהאתר יעבוד נכון תחת אותו נתיב-משנה (`/exam-prep-app/`) שבו GitHub Pages יגיש אותו בפועל:

```bash
npm run deploy:check
```

זה בונה את האתר עם `base` מדומה של `/exam-prep-app/` ואז מגיש preview מקומי — פתחו את הכתובת שתוצג (בדרך כלל `http://localhost:4173/exam-prep-app/`) ווודאו שהניווט, הגופנים, התמונות ונתוני ה-JSON נטענים כראוי.
