@echo off
title Day Ma Nguon Len GitHub
echo ========================================================
echo   EduLive - Day Ma Nguon Len GitHub
echo   https://github.com/vuongquocvietkxtb/edulive-app
echo ========================================================
echo.
echo Dang ket noi va day ma nguon...
echo (Neu co cua so trinh duyet hien ra, ban chi can bam "Authorize" / "Dang nhap")
echo.

cd /d %~dp0
git push -u origin main

echo.
echo ========================================================
echo Hoan tat! Ma nguon da duoc day len GitHub thanh cong.
echo ========================================================
pause
