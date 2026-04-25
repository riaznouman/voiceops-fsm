$ErrorActionPreference = "Stop"
$base = "http://localhost:3000"

function Get-Status {
    param([string]$Url, [Microsoft.PowerShell.Commands.WebRequestSession]$Session)
    try {
        $params = @{ Uri = $Url; MaximumRedirection = 0 }
        if ($Session) { $params.WebSession = $Session }
        $r = Invoke-WebRequest @params
        return [pscustomobject]@{ Code = [int]$r.StatusCode; Location = $r.Headers.Location; Body = $r.Content }
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($resp) {
            $code = [int]$resp.StatusCode
            $loc  = $resp.Headers["Location"]
            $body = ""
            try {
                $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $body = $sr.ReadToEnd()
            } catch {}
            return [pscustomobject]@{ Code = $code; Location = $loc; Body = $body }
        }
        throw
    }
}

function Test-AdminGate {
    param([string]$Email, [string]$Password, [string]$Label)

    $sess = $null
    $csrfRes = Invoke-WebRequest "$base/api/auth/csrf" -SessionVariable sess
    $csrf = ($csrfRes.Content | ConvertFrom-Json).csrfToken

    $body = @{
        email     = $Email
        password  = $Password
        csrfToken = $csrf
        redirect  = "false"
        json      = "true"
    }
    try {
        $null = Invoke-WebRequest "$base/api/auth/callback/credentials" -Method POST -Body $body -WebSession $sess
    } catch [System.Net.WebException] {
        # NextAuth may 302 even on success - that's fine
    }

    $r = Get-Status -Url "$base/admin/dashboard" -Session $sess
    Write-Host "[$Label]  status=$($r.Code)  location=$($r.Location)"
}

Write-Host "--- 1. Unauthenticated /admin/dashboard ---"
$r = Get-Status -Url "$base/admin/dashboard"
Write-Host "[unauth]  status=$($r.Code)  location=$($r.Location)"

Write-Host ""
Write-Host "--- 2. Four-role login tests ---"
Test-AdminGate -Email "admin@voiceops.com"    -Password "Admin@1234"    -Label "ADMIN"
Test-AdminGate -Email "manager@voiceops.com"  -Password "Manager@1234"  -Label "MANAGER"
Test-AdminGate -Email "tech@voiceops.com"     -Password "Tech@1234"     -Label "TECHNICIAN"
Test-AdminGate -Email "customer@voiceops.com" -Password "Customer@1234" -Label "CUSTOMER"

Write-Host ""
Write-Host "--- 3. Regression: /api/work-orders (no auth) ---"
$r = Get-Status -Url "$base/api/work-orders"
Write-Host "[/api/work-orders]  status=$($r.Code)  body=$($r.Body)"
