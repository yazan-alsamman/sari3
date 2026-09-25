# Build + install debug APK on a connected Android emulator/device
$ErrorActionPreference = "Stop"

$StudioJbr = "C:\Program Files\Android\Android Studio\jbr"
$Sdk = "$env:LOCALAPPDATA\Android\Sdk"
$Client = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Client "package.json"))) {
  $Client = "c:\Users\LOQ\Desktop\sari3 app1\client"
}

$env:JAVA_HOME = $StudioJbr
$env:ANDROID_HOME = $Sdk
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"

Write-Host "==> Building web + Capacitor sync"
Set-Location $Client
npm run mobile:build

Write-Host "==> Gradle assembleDebug"
Set-Location (Join-Path $Client "android")
.\gradlew.bat assembleDebug --quiet

$apk = Join-Path $Client "android\app\build\outputs\apk\debug\app-debug.apk"
$devices = & adb devices | Select-String "`tdevice$"
if (-not $devices) {
  Write-Host "No device. Starting Pixel_7_Pro emulator..."
  Start-Process -FilePath "$env:ANDROID_HOME\emulator\emulator.exe" -ArgumentList "-avd","Pixel_7_Pro" -WindowStyle Normal
  adb wait-for-device
  $t = 0
  while ($t -lt 180) {
    $boot = adb shell getprop sys.boot_completed 2>$null
    if ($boot -match "1") { break }
    Start-Sleep 5
    $t += 5
  }
}

Write-Host "==> Installing $apk"
adb install -r $apk
adb shell am start -n com.hoshblass.sareee.client/.MainActivity
Write-Host "Done. Allow microphone when prompted, then test Voice Order."
