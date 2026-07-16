@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo  מפעיל את מערכת ההכנה למבחן...
echo ==============================================
echo.
if not exist "node_modules" (
  echo נראה שהתלויות עדיין לא הותקנו.
  echo מריץ תחילה את setup.bat...
  call setup.bat
)
echo.
echo לאחר שהשרת יעלה, פתח דפדפן בכתובת:
echo.
echo     http://localhost:5173
echo.
echo (הכתובת המדויקת תוצג למטה אם הפורט תפוס ו-Vite יבחר פורט אחר)
echo כדי לעצור את השרת, לחץ Ctrl+C בחלון הזה.
echo ==============================================
echo.
call npm run dev
pause
