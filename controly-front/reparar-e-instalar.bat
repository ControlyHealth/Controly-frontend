@echo off
REM ============================================================
REM  Controly - reparar node_modules e instalar do zero
REM  Clique duas vezes neste arquivo (ou rode no terminal).
REM ============================================================
setlocal
cd /d "%~dp0"

echo.
echo === Pasta do projeto: %cd%
echo.

echo [1/4] Removendo node_modules corrompido...
if exist node_modules (
  rmdir /s /q node_modules
)

echo [2/4] Removendo package-lock.json antigo...
if exist package-lock.json del /f /q package-lock.json

echo [3/4] Limpando cache do npm...
call npm cache clean --force

echo [4/4] Instalando dependencias (isso baixa os binarios corretos do Windows)...
call npm install
if errorlevel 1 (
  echo.
  echo *** Falhou o npm install. Se aparecer "arquivo em uso", PAUSE o OneDrive
  echo *** (icone na bandeja - Pausar sincronizacao) e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

echo.
echo === Tudo instalado! Gerando build de producao para validar...
call npm run build
if errorlevel 1 (
  echo.
  echo *** O build falhou. Copie a mensagem de erro acima.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  OK! Para rodar em desenvolvimento, use:  npm run dev
echo ============================================================
pause
