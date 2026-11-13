param(
    [string]$PrinterName = "",
    [string]$Port = "",
    [string]$BytesCsv = "27,112,0,25,250",
    [string]$Hex = ""
)

$src = @"
using System;
using System.Runtime.InteropServices;

public class RawPrinter {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendBytes(string printer, byte[] bytes) {
        if (string.IsNullOrEmpty(printer) || bytes == null || bytes.Length == 0) return false;
        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
        Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
        IntPtr hPrinter;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "NovaMag Drawer Kick";
        di.pDataType = "RAW";
        bool ok = false;
        if (OpenPrinter(printer, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    int written;
                    ok = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out written);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        Marshal.FreeCoTaskMem(pUnmanagedBytes);
        return ok;
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'RawPrinter').Type) {
    Add-Type -TypeDefinition $src
}

# Parse bytes from Hex or CSV
$byteArray = @()
if ($Hex) {
    $cleanHex = $Hex -replace "[^0-9A-Fa-f]", ""
    for ($i = 0; $i -lt $cleanHex.Length; $i += 2) {
        $byteArray += [Convert]::ToByte($cleanHex.Substring($i, 2), 16)
    }
} elseif ($BytesCsv) {
    $parts = $BytesCsv -split ","
    foreach ($p in $parts) {
        $trimmed = $p.Trim()
        if ($trimmed) {
            $byteArray += [byte]$trimmed
        }
    }
}

if ($byteArray.Count -eq 0) {
    # Default ESC/POS kick: 27, 112, 0, 25, 250
    $byteArray = [byte[]]@(27, 112, 0, 25, 250)
} else {
    $byteArray = [byte[]]$byteArray
}

$sent = $false

# 1. If COM port specified
if ($Port -and ($Port -match "^COM\d+")) {
    try {
        $serial = New-Object System.IO.Ports.SerialPort $Port, 9600, None, 8, one
        $serial.Open()
        $serial.Write($byteArray, 0, $byteArray.Length)
        $serial.Close()
        $sent = $true
        Write-Output "SUCCESS:COM"
        exit 0
    } catch {
        Write-Output "ERROR:COM_PORT_FAILED: $($_.Exception.Message)"
    }
}

# 2. Spooler printer kick
if ($PrinterName) {
    try {
        $sent = [RawPrinter]::SendBytes($PrinterName, $byteArray)
        Write-Output "SUCCESS:PRINTER:$sent"
        exit 0
    } catch {
        Write-Output "ERROR:SPOOLER_FAILED: $($_.Exception.Message)"
    }
}

Write-Output "SUCCESS:SIMULATED"
