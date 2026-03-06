@echo off
title AttendFlow Launcher

echo.
echo  ========================================
echo    AttendFlow - Starting All Services
echo  ========================================
echo.

set PROJECT=C:\Users\admin\Documents\Projects\attendflow

echo  [1/2] Starting Backend (port 4000)...
start "AttendFlow Backend" cmd /k "cd /d %PROJECT% && npm start"
ping -n 5 127.0.0.1 > nul

echo  [2/2] Starting Frontend (port 5173)...
start "AttendFlow Frontend" cmd /k "cd /d %PROJECT%\frontend && npm run dev"
ping -n 5 127.0.0.1 > nul

echo  Opening browser tabs...
start "" "http://localhost:5173"
start "" "http://localhost:4000/api/health"

echo.
echo  All services started!
echo  Press any key to close this window...
pause > nul
exit
