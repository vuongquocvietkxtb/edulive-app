@echo off
title EduLive - He Thong Giang Day Truc Tuyen
echo ========================================================
echo   EduLive LMS ^& Virtual Classroom
echo   Khoi dong he thong giang day truc tuyen...
echo ========================================================

start "EduLive Backend" cmd /k "cd /d %~dp0server && node index.js"
start "EduLive Frontend" cmd /k "cd /d %~dp0client && npm.cmd run dev"

echo Dang mo trinh duyet tai http://localhost:3000...
timeout /t 3 >nul
start http://localhost:3000

echo He thong da san sang!
pause
