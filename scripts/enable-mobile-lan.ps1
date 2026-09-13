$ErrorActionPreference = 'Stop'
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $PSCommandPath + '"'))
    exit
}
$nodeProgram = (Get-Command node).Source
# Preserve existing TCP blocks except the single game port on private networks.
$rules = Get-NetFirewallApplicationFilter -Program $nodeProgram | Get-NetFirewallRule | Where-Object { $_.Action -eq 'Block' -and $_.Profile -eq 'Private' }
foreach ($rule in $rules) {
    $filter = $rule | Get-NetFirewallPortFilter
    if ($filter.Protocol -eq 'TCP' -and $filter.LocalPort -eq 'Any') {
        $filter | Set-NetFirewallPortFilter -LocalPort @('1-5179', '5181-65535')
    }
}
if (-not (Get-NetFirewallRule -DisplayName 'COSMII Mobile LAN 5180' -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName 'COSMII Mobile LAN 5180' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5180 -RemoteAddress LocalSubnet -Profile Private -Program $nodeProgram | Out-Null
}
'Mobile LAN enabled on TCP 5180 (Private / LocalSubnet only).' | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'mobile-lan-status.txt')
