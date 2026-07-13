@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Stadium Copilot Backend Test Suite
echo ========================================
echo.

set BASE_URL=http://localhost:3001

echo [1/8] Testing Health Endpoint...
curl -s "%BASE_URL%/api/health" | findstr /r "status" >nul && echo ✅ PASS || echo ❌ FAIL

echo [2/8] Testing Gates Data...
curl -s "%BASE_URL%/api/stadium/gates" | findstr /r "gates" >nul && echo ✅ PASS || echo ❌ FAIL

echo [3/8] Testing Occupancy Data...
curl -s "%BASE_URL%/api/stadium/occupancy" | findstr /r "sections" >nul && echo ✅ PASS || echo ❌ FAIL

echo [4/8] Testing Weather Data...
curl -s "%BASE_URL%/api/stadium/weather" | findstr /r "wbgt" >nul && echo ✅ PASS || echo ❌ FAIL

echo [5/8] Testing Match Status...
curl -s "%BASE_URL%/api/match/status" | findstr /r "team1" >nul && echo ✅ PASS || echo ❌ FAIL

echo [6/8] Testing Heat Advisory...
curl -s -X POST "%BASE_URL%/api/advisories/heat" -H "Content-Type: application/json" -d "{\"ageGroup\":\"65+\",\"healthFlag\":\"none\"}" | findstr /r "message" >nul && echo ✅ PASS || echo ❌ FAIL

echo [7/8] Testing AI Query...
curl -s -X POST "%BASE_URL%/api/ai/query" -H "Content-Type: application/json" -d "{\"prompt\":\"What is the gate status?\"}" | findstr /r "response" >nul && echo ✅ PASS || echo ❌ FAIL

echo [8/8] Testing Scenarios...
curl -s "%BASE_URL%/api/scenarios" | findstr /r "scenarios" >nul && echo ✅ PASS || echo ❌ FAIL

echo.
echo ========================================
echo   Test Suite Complete
echo ========================================
echo.

pause
