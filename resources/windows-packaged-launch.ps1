param(
  [switch]$ResumeThread,
  [Alias("p")][int]$ProcessId,
  [Alias("tid")][int]$ThreadId
)

$ErrorActionPreference = "Stop"

$source = @'
using System;
using System.Runtime.InteropServices;

namespace CodexProfileManager.Windows {
    [ComImport, Guid("2E941141-7F97-4756-BA1D-9DECDE894A3D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IApplicationActivationManager {
        [PreserveSig]
        int ActivateApplication([MarshalAs(UnmanagedType.LPWStr)] string appUserModelId,
            [MarshalAs(UnmanagedType.LPWStr)] string arguments, uint options, out uint processId);
    }

    [ComImport, Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C")]
    class ApplicationActivationManager { }

    [ComImport, Guid("F27C3930-8029-4AD1-94E3-3DBA417810C1"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IPackageDebugSettings {
        [PreserveSig]
        int EnableDebugging([MarshalAs(UnmanagedType.LPWStr)] string packageFullName,
            [MarshalAs(UnmanagedType.LPWStr)] string debuggerCommandLine, IntPtr environment);
        [PreserveSig]
        int DisableDebugging([MarshalAs(UnmanagedType.LPWStr)] string packageFullName);
    }

    [ComImport, Guid("B1AEC16F-2383-4852-B0E9-8F0B1DC66B4D")]
    class PackageDebugSettings { }

    public static class PackagedLauncher {
        public static uint Launch(string packageFullName, string appUserModelId, string arguments, string[] environment, string debuggerCommandLine) {
            var block = string.Join("\0", environment) + "\0\0";
            var environmentBlock = Marshal.StringToHGlobalUni(block);
            var debug = (IPackageDebugSettings)new PackageDebugSettings();
            var debuggingEnabled = false;
            try {
                Marshal.ThrowExceptionForHR(debug.EnableDebugging(packageFullName, debuggerCommandLine, environmentBlock));
                debuggingEnabled = true;
                var manager = (IApplicationActivationManager)new ApplicationActivationManager();
                uint pid;
                Marshal.ThrowExceptionForHR(manager.ActivateApplication(appUserModelId, arguments, 0, out pid));
                return pid;
            } finally {
                if (debuggingEnabled) Marshal.ThrowExceptionForHR(debug.DisableDebugging(packageFullName));
                Marshal.FreeHGlobal(environmentBlock);
            }
        }
    }
}
'@

$threadResumerSource = @'
using System;
using System.Runtime.InteropServices;

public static class PackageThreadResumer {
    const uint THREAD_SUSPEND_RESUME = 0x0002;
    [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr OpenThread(uint access, bool inheritHandle, uint threadId);
    [DllImport("kernel32.dll", SetLastError = true)] static extern uint ResumeThread(IntPtr thread);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);

    public static int Resume(uint threadId) {
        var thread = OpenThread(THREAD_SUSPEND_RESUME, false, threadId);
        if (thread == IntPtr.Zero) return 3;
        try { return ResumeThread(thread) == UInt32.MaxValue ? 4 : 0; }
        finally { CloseHandle(thread); }
    }
}
'@

if ($ResumeThread) {
  Add-Type -TypeDefinition $threadResumerSource -Language CSharp
  exit [PackageThreadResumer]::Resume($ThreadId)
}

try {
  Add-Type -TypeDefinition $source -Language CSharp
  [Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
  $payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
  $environment = @($payload.environment.PSObject.Properties | ForEach-Object { "$($_.Name)=$($_.Value)" })
  $launchedPid = [CodexProfileManager.Windows.PackagedLauncher]::Launch(
    [string]$payload.packageFullName,
    [string]$payload.appUserModelId,
    [string]$payload.arguments,
    [string[]]$environment,
    ('powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -ResumeThread')
  )
  @{ pid = [int]$launchedPid } | ConvertTo-Json -Compress
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
}
