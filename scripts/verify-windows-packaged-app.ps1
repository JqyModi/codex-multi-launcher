param(
  [Parameter(Mandatory = $false)]
  [string]$ExecutablePath = "dist-app\win-unpacked\Codex Profile Manager.exe",

  [Parameter(Mandatory = $false)]
  [string]$ScreenshotPath = "$env:RUNNER_TEMP\codex-profile-manager-windows.png"
)

$ErrorActionPreference = "Stop"
$resolvedExecutable = (Resolve-Path $ExecutablePath).Path
$process = $null

try {
  $process = Start-Process -FilePath $resolvedExecutable -PassThru
  $deadline = (Get-Date).AddSeconds(45)
  $windowReady = $false

  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 500
    $process.Refresh()
    if ($process.HasExited) {
      throw "Packaged app exited before opening a window. Exit code: $($process.ExitCode)"
    }
    if ($process.MainWindowHandle -ne 0 -and -not [string]::IsNullOrWhiteSpace($process.MainWindowTitle)) {
      $windowReady = $true
      break
    }
  }

  if (-not $windowReady) {
    throw "Packaged app did not expose a visible main window within 45 seconds."
  }

  Start-Sleep -Seconds 5
  $process.Refresh()
  if ($process.HasExited) {
    throw "Packaged app exited after its main window appeared. Exit code: $($process.ExitCode)"
  }

  Add-Type -AssemblyName System.Drawing
  Add-Type -AssemblyName System.Windows.Forms
  $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
  $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bitmap.Save($ScreenshotPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }

  Write-Host "WINDOW_SMOKE_PASSED"
  Write-Host "PID=$($process.Id)"
  Write-Host "TITLE=$($process.MainWindowTitle)"
  Write-Host "SCREENSHOT=$ScreenshotPath"
} finally {
  if ($null -ne $process -and -not $process.HasExited) {
    & taskkill.exe /PID $process.Id /T /F | Out-Null
  }
}
