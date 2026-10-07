<#
  Rebuild assets/Ossian_Dackfors_Resume.pdf from resume/resume.html, using the
  headless mode of Microsoft Edge (or Chrome). Nothing to install.

    pwsh resume/build.ps1
    pwsh resume/build.ps1 -OutFile somewhere/else.pdf
#>
param(
  [string] $OutFile = (Join-Path (Split-Path $PSScriptRoot -Parent) "assets\Ossian_Dackfors_Resume.pdf")
)
$ErrorActionPreference = "Stop"

$html = Join-Path $PSScriptRoot "resume.html"
$pdf = [System.IO.Path]::GetFullPath($OutFile)

$browser = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw "Couldn't find Microsoft Edge or Google Chrome." }

# The browser won't load font files from disk for a page opened from disk, so print a temporary
# copy of the page with the fonts inlined as data URLs.
$work = Join-Path ([System.IO.Path]::GetTempPath()) "resume-pdf"
New-Item -ItemType Directory -Force $work | Out-Null
$page = Get-Content -Raw -Encoding utf8 $html
$page = [regex]::Replace($page, 'url\("(\.\./assets/fonts/[^"]+\.woff2)"\)', {
  param($m)
  $font = Join-Path $PSScriptRoot $m.Groups[1].Value
  'url("data:font/woff2;base64,' + [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($font)) + '")'
})
$tempHtml = Join-Path $work "resume.html"
Set-Content -Path $tempHtml -Value $page -Encoding utf8

# A throwaway profile keeps this from attaching to a browser window that's already open.
$before = if (Test-Path $pdf) { (Get-Item $pdf).LastWriteTimeUtc } else { [datetime]::MinValue }
$arguments = @(
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-pdf-header-footer",
  "--virtual-time-budget=5000",
  "--user-data-dir=`"$(Join-Path $work 'profile')`"",
  "--print-to-pdf=`"$pdf`"",
  ([System.Uri]$tempHtml).AbsoluteUri
)
Start-Process -FilePath $browser -ArgumentList $arguments -Wait -WindowStyle Hidden

if (-not (Test-Path $pdf) -or (Get-Item $pdf).LastWriteTimeUtc -le $before) {
  throw "The PDF wasn't written. Close any browser windows using '$work' and try again."
}
"Wrote {0} ({1:N0} KB)" -f $pdf, ((Get-Item $pdf).Length / 1KB)
