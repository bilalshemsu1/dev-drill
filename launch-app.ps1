$ErrorActionPreference = 'SilentlyContinue'

# 1. Check if server on port 4230 is already listening
$conn = Test-NetConnection -ComputerName localhost -Port 4230 -WarningAction SilentlyContinue

if (-not $conn.TcpTestSucceeded) {
    # Start the server quietly in background
    Start-Process -FilePath "npx.cmd" -ArgumentList "--yes serve D:\ncc_cpd\leetcode\offcode\dist -l 4230" -WorkingDirectory "D:\ncc_cpd\leetcode\offcode" -WindowStyle Hidden
    Start-Sleep -Seconds 1
}

# 2. Try launching as Chrome/Edge App (standalone window mode without URL bar)
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$edgePath64 = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$chromePathLocal = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"

$appUrl = "http://localhost:4230"

if (Test-Path $chromePath) {
    Start-Process -FilePath $chromePath -ArgumentList "--app=$appUrl"
} elseif (Test-Path $chromePathLocal) {
    Start-Process -FilePath $chromePathLocal -ArgumentList "--app=$appUrl"
} elseif (Test-Path $edgePath) {
    Start-Process -FilePath $edgePath -ArgumentList "--app=$appUrl"
} elseif (Test-Path $edgePath64) {
    Start-Process -FilePath $edgePath64 -ArgumentList "--app=$appUrl"
} else {
    # Fallback to default browser
    Start-Process $appUrl
}
