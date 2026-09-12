# publish.ps1 — turn this folder into a private GitHub repo named "m47"
# Run from this folder:  Right-click > "Run with PowerShell"  (needs Git installed)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git is not installed. Get it from https://git-scm.com/download/win and re-run." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path .git)) {
  git init -b main
  git add -A
  git commit -m "M47 v0.1.0 - retro terminal interface browser extension" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01K5BzdVbSRkpLuiD1xKHALq"
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
  gh repo create m47 --private --source=. --push
} else {
  Write-Host ""
  Write-Host "No GitHub CLI found - manual route:" -ForegroundColor Cyan
  Write-Host "  1. Create a PRIVATE repo named 'm47' at https://github.com/new (no README)."
  $user = Read-Host "  2. Enter your GitHub username"
  git remote remove origin 2>$null
  git remote add origin "https://github.com/$user/m47.git"
  git push -u origin main
}
Write-Host "Done - private repo is live. Invite friends: repo Settings > Collaborators." -ForegroundColor Green
