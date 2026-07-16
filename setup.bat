@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo  התקנת מערכת ההכנה למבחן
echo  Advanced Topics in Programming - Exam Prep
echo ==============================================
echo.
echo בודק אם Node.js מותקן...
where node >nul 2>nul
if errorlevel 1 (
  echo שגיאה: Node.js אינו מותקן או לא נמצא ב-PATH.
  echo יש להתקין Node.js גרסה 18 ומעלה מהאתר https://nodejs.org ולנסות שוב.
  pause
  exit /b 1
)
node -v
echo.
echo מתקין תלויות npm, זה עשוי לקחת מספר דקות...
call npm install
if errorlevel 1 (
  echo.
  echo ההתקנה נכשלה. בדוק את הודעת השגיאה למעלה.
  pause
  exit /b 1
)
echo.
echo ==============================================
echo  ההתקנה הושלמה בהצלחה!
echo  כדי להפעיל את המערכת, הרץ את start.bat
echo ==============================================
pause
