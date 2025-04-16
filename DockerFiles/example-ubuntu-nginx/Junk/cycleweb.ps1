#!/usr/bin/env pwsh

param (
    [string]$browser = "chrome",
    [int]$waitTime = 1800
)

# Define the three URLs to cycle through
$urls = @(
    "https://learn.acloud.guru/course/160303d7-6947-4fbc-9d19-fa304849f92e/learn/fffedcf5-8b49-4800-a2ed-d43febd5c7fe/6db360f0-6359-4b3a-bb65-47319a9036dd/watch",
    "https://learn.acloud.guru/course/160303d7-6947-4fbc-9d19-fa304849f92e/learn/175d605b-0154-4bb4-b924-8f8358787113/cc7a1225-07fe-4408-92da-697c817321ad/watch",
    "https://learn.acloud.guru/course/160303d7-6947-4fbc-9d19-fa304849f92e/learn/2a7a724c-3025-4e07-80f3-e078f22db40a/826c179a-d9ee-46b0-a5c0-d27170825c37/watch"
)

# Define the wait times for each URL (in seconds)
$waitTimes = @(1800, 1800, 1800)

# Define the browsers for each URL
$browsers = @("chrome", "chrome", "chrome")

# Override with command line parameters if provided
if ($PSBoundParameters.ContainsKey('browser')) {
    $browsers = @($browser, $browser, $browser)
}

if ($PSBoundParameters.ContainsKey('waitTime')) {
    $waitTimes = @($waitTime, $waitTime, $waitTime)
}


Write-Host "Starting web page cycling script"
Write-Host "URLs: $($urls -join ', ')"
Write-Host "Wait times: $($waitTimes -join ', ') seconds"
Write-Host "Browsers: $($browsers -join ', ')"
Write-Host "Press Ctrl+C to stop"
Write-Host ""

# Map browser parameter to process name
$browserProcessMap = @{
    "chrome" = "chrome"
    "edge" = "msedge"
    "firefox" = "firefox"
    "ie" = "iexplore"
}

try {
    $urlIndex = 0
    
    while ($true) {
        # Get the current URL, wait time, and browser
        $currentUrl = $urls[$urlIndex]
        $currentWaitTime = $waitTimes[$urlIndex]
        $currentBrowser = $browsers[$urlIndex]
        
        # Get the browser process name
        $browserProcess = $browserProcessMap[$currentBrowser.ToLower()]
        if (-not $browserProcess) {
            $browserProcess = "chrome"  # Default to Chrome if browser not recognized
        }
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Opening URL #$($urlIndex + 1): $currentUrl"
        Write-Host "Using browser: $currentBrowser, waiting for: $currentWaitTime seconds"
        
        # Close existing browser instances
        Get-Process -Name $browserProcess -ErrorAction SilentlyContinue | ForEach-Object { 
            Write-Host "Closing existing $currentBrowser window..."
            $_.CloseMainWindow() | Out-Null 
        }
        
        # Wait a moment for the browser to close
        Start-Sleep -Seconds 1
        
        # Open the URL in the specified browser
        Start-Process $currentUrl
        
        Write-Host "Waiting for $currentWaitTime seconds..."
        Start-Sleep -Seconds $currentWaitTime
        
        # Move to the next URL in the sequence
        $urlIndex = ($urlIndex + 1) % $urls.Count
    }
}
catch {
    Write-Host "`nScript interrupted. Exiting..."
}
finally {
    Write-Host "Script terminated."
}