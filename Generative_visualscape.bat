@echo off
echo ================================
echo  WebAff Generative Audio Video
echo ================================

echo Installing dependencies...
call npm install

echo Starting Vite server...
start http://localhost:5173

REM Questo comando blocca la finestra finché vite è attivo
call npm run dev

pause