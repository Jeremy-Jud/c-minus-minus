@echo off
rem Startet C--. Ohne Datei: Konsole. Mit Datei: C-- beispiele\hallo.cmm
chcp 65001 >nul
node "%~dp0cmm.js" %*
