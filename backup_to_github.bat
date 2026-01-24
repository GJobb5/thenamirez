@echo off
echo ==========================================
echo      NAMIREZ SYSTEM BACKUP UTILITY
echo ==========================================
echo.
echo [1/3] Staging files...
git add .

echo [2/3] Committing changes...
set "timestamp=%date% %time%"
git commit -m "System Backup: %timestamp%"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ==========================================
echo      BACKUP COMPLETE
echo ==========================================
pause
