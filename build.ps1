$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  node scripts/build.js
  if ($LASTEXITCODE -ne 0) { throw 'M47 build failed.' }
} finally { Pop-Location }
