# PowerShell script to package Fluent Calculator into an MSIX for Microsoft Store / Sideloading
param(
  [switch]$Release,
  [switch]$SignForTesting
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Fluent Calculator - MSIX Packaging Tool " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Find Windows SDK tools
$sdkPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64"
if (-not (Test-Path "$sdkPath\MakeAppx.exe")) {
  $sdkDirs = Get-ChildItem -Path "C:\Program Files (x86)\Windows Kits\10\bin" -Directory -Filter "10.*" | Sort-Object Name -Descending
  if ($sdkDirs.Count -gt 0) {
    $sdkPath = "$($sdkDirs[0].FullName)\x64"
  }
}

$makeAppx = "$sdkPath\MakeAppx.exe"
$signTool = "$sdkPath\signtool.exe"

if (-not (Test-Path $makeAppx)) {
  Write-Error "MakeAppx.exe not found. Please ensure Windows SDK 10/11 is installed."
  exit 1
}

Write-Host "Using Windows SDK from: $sdkPath" -ForegroundColor Green

# Step 1: Ensure executable is built
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$targetDir = "$projectRoot\src-tauri\target\debug"
if ($Release) {
  Write-Host "Building Release binary..." -ForegroundColor Yellow
  cargo build --release --manifest-path "$projectRoot\src-tauri\Cargo.toml"
  $targetDir = "$projectRoot\src-tauri\target\release"
} else {
  if (-not (Test-Path "$targetDir\calculator.exe")) {
    Write-Host "Building Debug binary for fast testing..." -ForegroundColor Yellow
    cargo build --manifest-path "$projectRoot\src-tauri\Cargo.toml"
  }
}

$exePath = "$targetDir\calculator.exe"
if (-not (Test-Path $exePath)) {
  Write-Error "Executable not found at: $exePath"
  exit 1
}

Write-Host "Found binary: $exePath" -ForegroundColor Green

# Step 2: Prepare Staging Layout
$distDir = "$projectRoot\dist-msix"
$layoutDir = "$distDir\layout"

if (Test-Path $layoutDir) {
  Remove-Item -Recurse -Force $layoutDir
}

New-Item -ItemType Directory -Path "$layoutDir\Assets" -Force | Out-Null

Write-Host "Staging files into layout directory..." -ForegroundColor Yellow
Copy-Item -Path $exePath -Destination "$layoutDir\calculator.exe" -Force
Copy-Item -Path "$projectRoot\AppxManifest.xml" -Destination "$layoutDir\AppxManifest.xml" -Force

# Copy Assets / Icons
$iconsSource = "$projectRoot\src-tauri\icons"
Get-ChildItem -Path $iconsSource -Filter "*.png" | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination "$layoutDir\Assets\$($_.Name)" -Force
}

# Step 3: Run MakeAppx
$outputMsix = "$distDir\FluentCalculator.msix"
Write-Host "Creating MSIX package: $outputMsix ..." -ForegroundColor Yellow

& $makeAppx pack /d $layoutDir /p $outputMsix /o /v

if ($LASTEXITCODE -ne 0) {
  Write-Error "MakeAppx failed with exit code $LASTEXITCODE"
  exit 1
}

Write-Host "Package created successfully!" -ForegroundColor Green

# Step 4: Optional signing for local side-loading
if ($SignForTesting) {
  Write-Host "Signing MSIX with local test certificate..." -ForegroundColor Yellow
  $certFile = "$distDir\FluentCalcDevCert.pfx"
  $certPassword = "TestPassword123"

  if (-not (Test-Path $certFile)) {
    Write-Host "Generating local self-signed code signing certificate..." -ForegroundColor Yellow
    $cert = New-SelfSignedCertificate `
      -Type Custom `
      -Subject "CN=FluentCalcDev" `
      -KeyUsage DigitalSignature `
      -FriendlyName "Fluent Calculator Dev Cert" `
      -CertStoreLocation "Cert:\CurrentUser\My" `
      -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3")

    $securePassword = ConvertTo-SecureString -String $certPassword -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $certFile -Password $securePassword | Out-Null
    Write-Host "Exported test certificate to: $certFile" -ForegroundColor Green
  }

  & $signTool sign /fd SHA256 /a /f $certFile /p $certPassword $outputMsix
  if ($LASTEXITCODE -eq 0) {
    Write-Host "MSIX successfully signed! Ready to test locally." -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " SUCCESS: MSIX ready at:" -ForegroundColor Cyan
Write-Host " $outputMsix" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "For Microsoft Store submission:"
Write-Host "1. In Partner Center, create your app submission."
Write-Host "2. Upload '$outputMsix' or standard installer under 'Packages'."
Write-Host "3. See STORE_SUBMISSION_GUIDE.md for step-by-step instructions!"
