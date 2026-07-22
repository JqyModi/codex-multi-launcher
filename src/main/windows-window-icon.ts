import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface WindowsTaskbarIdentityResult {
  pid: number;
  windowHandle: string;
  appUserModelId: string;
}

export async function restoreWindowsDesktopTaskbarIdentity(
  pid: number,
  appUserModelId: string
): Promise<WindowsTaskbarIdentityResult> {
  const script = buildWindowsTaskbarIdentityScript(pid, appUserModelId);
  const encodedCommand = Buffer.from(script, "utf16le").toString("base64");
  const { stdout } = await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-EncodedCommand",
    encodedCommand
  ], {
    timeout: 35_000,
    windowsHide: true,
    encoding: "utf8"
  });
  const result = JSON.parse(stdout.trim()) as WindowsTaskbarIdentityResult;
  if (!result.pid || !result.windowHandle || !result.appUserModelId) {
    throw new Error("Windows taskbar identity helper returned an invalid result.");
  }
  return result;
}

export function buildWindowsTaskbarIdentityScript(pid: number, appUserModelId: string): string {
  return `
$ErrorActionPreference = "Stop"
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class CodexTaskbarIdentity {
  [StructLayout(LayoutKind.Sequential, Pack = 4)]
  private struct PropertyKey {
    public Guid formatId;
    public uint propertyId;

    public PropertyKey(Guid formatId, uint propertyId) {
      this.formatId = formatId;
      this.propertyId = propertyId;
    }
  }

  [StructLayout(LayoutKind.Explicit)]
  private struct PropVariant {
    [FieldOffset(0)] public ushort valueType;
    [FieldOffset(8)] public IntPtr pointerValue;
  }

  [ComImport]
  [Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")]
  [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  private interface IPropertyStore {
    [PreserveSig] int GetCount(out uint propertyCount);
    [PreserveSig] int GetAt(uint propertyIndex, out PropertyKey key);
    [PreserveSig] int GetValue(ref PropertyKey key, out PropVariant value);
    [PreserveSig] int SetValue(ref PropertyKey key, ref PropVariant value);
    [PreserveSig] int Commit();
  }

  [DllImport("shell32.dll", PreserveSig = true)]
  private static extern int SHGetPropertyStoreForWindow(
    IntPtr windowHandle,
    ref Guid interfaceId,
    [Out, MarshalAs(UnmanagedType.Interface)] out IPropertyStore propertyStore
  );

  [DllImport("ole32.dll", PreserveSig = true)]
  private static extern int PropVariantClear(ref PropVariant value);

  public static void SetWindowAppUserModelId(IntPtr windowHandle, string appUserModelId) {
    Guid interfaceId = new Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99");
    IPropertyStore propertyStore;
    Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(windowHandle, ref interfaceId, out propertyStore));

    PropertyKey appUserModelIdKey = new PropertyKey(
      new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),
      5
    );
    PropVariant value = new PropVariant {
      valueType = 31,
      pointerValue = Marshal.StringToCoTaskMemUni(appUserModelId)
    };

    try {
      Marshal.ThrowExceptionForHR(propertyStore.SetValue(ref appUserModelIdKey, ref value));
      Marshal.ThrowExceptionForHR(propertyStore.Commit());
    } finally {
      PropVariantClear(ref value);
      Marshal.ReleaseComObject(propertyStore);
    }
  }
}
'@

$rootPid = ${pid}
$appUserModelId = ${powershellLiteral(appUserModelId)}
$deadline = [DateTime]::UtcNow.AddSeconds(30)
$target = $null

do {
  $candidate = Get-Process -Id $rootPid -ErrorAction SilentlyContinue
  if ($candidate) {
    $candidate.Refresh()
    if ($candidate.MainWindowHandle -ne 0) {
      $target = $candidate
    }
  }

  if (-not $target) {
    Start-Sleep -Milliseconds 150
  }
} while (-not $target -and [DateTime]::UtcNow -lt $deadline)

if (-not $target -or $target.MainWindowHandle -eq 0) {
  throw "Timed out waiting for the ChatGPT desktop window."
}

[CodexTaskbarIdentity]::SetWindowAppUserModelId($target.MainWindowHandle, $appUserModelId)

[PSCustomObject]@{
  pid = $target.Id
  windowHandle = $target.MainWindowHandle.ToString()
  appUserModelId = $appUserModelId
} | ConvertTo-Json -Compress
`.trim();
}

function powershellLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
