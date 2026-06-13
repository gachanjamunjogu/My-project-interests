@echo off
REM Create components directory using Node.js
node create-dirs.js

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo Components created successfully!
) ELSE (
    echo.
    echo Error creating components. Please ensure Node.js is installed.
    echo You can also run: npm run setup:components
)
