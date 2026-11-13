param(
    [string]$Action = "read", # "list", "read", "zero", "tare", "detect"
    [string]$Port = "COM3",
    [int]$BaudRate = 9600,
    [int]$DataBits = 8,
    [string]$Parity = "None",
    [string]$StopBits = "One",
    [string]$PollHex = "05",
    [string]$ZeroHex = "5A,0D",
    [string]$TareHex = "54,0D",
    [int]$TimeoutMs = 1200
)

# 1. Action: List available COM ports
if ($Action -eq "list") {
    $ports = [System.IO.Ports.SerialPort]::GetPortNames()
    if (-not $ports -or $ports.Count -eq 0) {
        $ports = @("COM1", "COM2", "COM3")
    }
    $json = $ports | ConvertTo-Json
    Write-Output "RESULT:$json"
    exit 0
}

# Helper to parse hex string into byte array
function Parse-Hex([string]$hexStr) {
    $clean = $hexStr -replace "[^0-9A-Fa-f]", ""
    $bytes = @()
    for ($i = 0; $i -lt $clean.Length; $i += 2) {
        $bytes += [Convert]::ToByte($clean.Substring($i, 2), 16)
    }
    return [byte[]]$bytes
}

# 2. Open serial port and communicate
try {
    $parityObj = [System.IO.Ports.Parity]::$Parity
} catch {
    $parityObj = [System.IO.Ports.Parity]::None
}

try {
    $stopBitsObj = [System.IO.Ports.StopBits]::$StopBits
} catch {
    $stopBitsObj = [System.IO.Ports.StopBits]::One
}

$serial = New-Object System.IO.Ports.SerialPort $Port, $BaudRate, $parityObj, $DataBits, $stopBitsObj
$serial.ReadTimeout = $TimeoutMs
$serial.WriteTimeout = $TimeoutMs

try {
    $serial.Open()

    if ($Action -eq "zero") {
        $bytes = Parse-Hex $ZeroHex
        if ($bytes.Length -gt 0) { $serial.Write($bytes, 0, $bytes.Length) }
        $serial.Close()
        Write-Output 'RESULT:{"success":true,"action":"zero"}'
        exit 0
    }

    if ($Action -eq "tare") {
        $bytes = Parse-Hex $TareHex
        if ($bytes.Length -gt 0) { $serial.Write($bytes, 0, $bytes.Length) }
        $serial.Close()
        Write-Output 'RESULT:{"success":true,"action":"tare"}'
        exit 0
    }

    # Action "read" or "detect"
    if ($PollHex) {
        try {
            $pollBytes = Parse-Hex $PollHex
            if ($pollBytes.Length -gt 0) {
                $serial.Write($pollBytes, 0, $pollBytes.Length)
            }
        } catch {}
    }

    # Read line or buffer
    Start-Sleep -Milliseconds 150
    $buffer = ""
    try {
        $buffer = $serial.ReadLine()
    } catch {
        # Fallback to ReadExisting
        $buffer = $serial.ReadExisting()
    }
    $serial.Close()

    # Parse weight from buffer (e.g. "ST,GS,  1.250kg" -> 1.25)
    $cleanBuffer = $buffer.Trim()
    $weight = 0.0
    $stable = $true

    if ($cleanBuffer -match 'US') { $stable = $false } # Unstable flag in Toledo/NCI
    if ($cleanBuffer -match 'ST') { $stable = $true }  # Stable flag

    # Match numeric float (e.g. 1.250 or 0.500)
    if ($cleanBuffer -match '([+-]?\d+[.,]\d+)') {
        $numStr = $matches[1] -replace ',', '.'
        $weight = [double]::Parse($numStr, [System.Globalization.CultureInfo]::InvariantCulture)
    } elseif ($cleanBuffer -match '(\d+)') {
        $weight = [double]::Parse($matches[1]) / 1000.0
    }

    $outObj = @{
        success = $true
        port = $Port
        raw = $cleanBuffer
        weight = $weight
        stable = $stable
    }
    $json = $outObj | ConvertTo-Json -Compress
    Write-Output "RESULT:$json"
    exit 0
} catch {
    if ($serial.IsOpen) { $serial.Close() }
    $errObj = @{
        success = $false
        port = $Port
        error = $_.Exception.Message
        simulated = $true
    }
    $json = $errObj | ConvertTo-Json -Compress
    Write-Output "RESULT:$json"
    exit 0
}
