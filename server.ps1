# ==========================================================================
# Blessed Obiora ICT Limited - Native PowerShell HTTP Development Server
# ==========================================================================

$port = 3000
$url = "http://localhost:$port/"
$currentDir = Get-Location

# Initialize HTTP Listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  Blessed Obiora ICT Dev Server Running!" -ForegroundColor Green
    Write-Host "  Local URL: $url" -ForegroundColor Yellow
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Red
    Write-Host "==================================================" -ForegroundColor Cyan
    
    # Open browser automatically
    Start-Process $url

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Resolve request path
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") {
            $urlPath = "/index.html"
        }
        
        # Replace forward slashes with system directory separator
        $subPath = $urlPath.Replace("/", [System.IO.Path]::DirectorySeparatorChar)
        # Ensure it doesn't look up outside current directory
        if ($subPath.StartsWith([System.IO.Path]::DirectorySeparatorChar)) {
            $subPath = $subPath.Substring(1)
        }
        $filePath = Join-Path $currentDir $subPath

        # Check if file exists
        if (Test-Path $filePath -PathType Leaf) {
            try {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                
                # Determine Content-Type
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = "application/octet-stream"
                switch ($ext) {
                    ".html" { $contentType = "text/html; charset=utf-8" }
                    ".css"  { $contentType = "text/css; charset=utf-8" }
                    ".js"   { $contentType = "application/javascript; charset=utf-8" }
                    ".png"  { $contentType = "image/png" }
                    ".jpg"  { $contentType = "image/jpeg" }
                    ".jpeg" { $contentType = "image/jpeg" }
                    ".gif"  { $contentType = "image/gif" }
                    ".svg"  { $contentType = "image/svg+xml; charset=utf-8" }
                    ".ico"  { $contentType = "image/x-icon" }
                    ".json" { $contentType = "application/json; charset=utf-8" }
                }
                
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            catch {
                $response.StatusCode = 500
                $errMsg = "500 Internal Server Error: $_"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($errMsg)
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }
        else {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 File Not Found: $urlPath")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        
        $response.Close()
    }
}
catch {
    Write-Host "Failed to start server: $_" -ForegroundColor Red
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
}
