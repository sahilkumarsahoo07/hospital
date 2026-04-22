@echo off
echo ====================================================
echo  Aspire Reporting Hub - Backend Setup
echo ====================================================
echo.

REM Check Python
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.11+
    pause
    exit /b
)

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate and install
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

REM Create DB (psql must be in PATH)
echo.
echo Creating database 'aspire_db' (if not exists)...
psql -U postgres -c "CREATE DATABASE aspire_db;" 2>nul
echo (Ignore error if DB already exists)

echo.
echo ====================================================
echo  Starting server on http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  Seed credentials:
echo    admin@aspire.local / admin123
echo    rad@aspire.local   / rad123
echo    hospital@aspire.local / hospital123
echo ====================================================
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
