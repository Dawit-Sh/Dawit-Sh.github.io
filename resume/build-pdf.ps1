# Prints resume/index.html to assets/dawit-sharon-resume.pdf with headless Edge.
# Serve the repo first (for example: python -m http.server 8240 --bind 127.0.0.1), then run:
#   powershell -File resume/build-pdf.ps1
param([string]$Url = "http://127.0.0.1:8240/resume/")

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
$out = Join-Path $PSScriptRoot "..\assets\dawit-sharon-resume.pdf"
$profile = Join-Path $env:TEMP "resume-pdf-edge"

& $edge --headless=new --disable-gpu --no-first-run --user-data-dir="$profile" `
    --no-pdf-header-footer --virtual-time-budget=8000 `
    --print-to-pdf="$out" $Url | Out-Null

Get-Item $out | Select-Object Name, Length, LastWriteTime
