# Push committed M47 source to its existing private GitHub repository.
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  $m47Remote = git remote get-url origin
  if ($LASTEXITCODE -ne 0 -or $m47Remote -ne 'https://github.com/petehottelet/m47.git') {
    throw 'Expected the configured petehottelet/m47 origin. Inspect git remote -v.'
  }
  $m47MetadataText = gh repo view petehottelet/m47 --json isPrivate
  if ($LASTEXITCODE -ne 0) { throw 'Could not verify GitHub repository visibility.' }
  $m47Metadata = $m47MetadataText | ConvertFrom-Json
  if (-not $m47Metadata.isPrivate) { throw 'Repository must remain private.' }
  $m47Changes = git status --porcelain
  if ($m47Changes) { throw 'Review and commit your changes before publishing source.' }
  git push origin main
  if ($LASTEXITCODE -ne 0) { throw 'Git push failed.' }
  Write-Host 'Committed source pushed to the private M47 repository.'
} finally { Pop-Location }
