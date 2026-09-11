$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$dest = "$env:TEMP\jdk21"
if (-not (Test-Path $dest)) {
    Write-Host "Downloading JDK 21..."
    Invoke-WebRequest -Uri "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse" -OutFile "$env:TEMP\jdk21.zip"
    Write-Host "Extracting JDK 21..."
    Expand-Archive -Path "$env:TEMP\jdk21.zip" -DestinationPath $dest
}
$jdkDir = Get-ChildItem -Path $dest | Select-Object -First 1
$env:JAVA_HOME = $jdkDir.FullName
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "Using Java version:"
& "$env:JAVA_HOME\bin\java.exe" -version

Write-Host "Building APK..."
cd android
.\gradlew assembleRelease

Write-Host "Done! Your APK should be in android\app\build\outputs\apk\release\"
