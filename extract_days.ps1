# Function to calculate working days
function Get-WorkingDaysLeft {
    # Get current date and format it as d1=day&m1=month
    $currentDate = Get-Date
    $today = "d1=" + $currentDate.Day + "&m1=" + $currentDate.Month
    $url = "https://www.timeanddate.com/date/workdays.html?" + $today + "&y1=" + $currentDate.Year + "&d2=5&m2=5&y2=2025&ti=on&"
    
    # Make a single web request
    $response = Invoke-WebRequest -Uri $url
    $pattern = '<h2>Result: (\d+) days</h2>'
    $match = [regex]::Match($response.Content, $pattern)
    
    # Calculate the result
    if($match.Success) {
        $workingDays = [double]$match.Groups[1].Value-1
        $leaves = 9
        
        # Calculate fractional day based on current time
        $workDayStartTime = New-TimeSpan -Hours 8 -Minutes 30
        $workDayEndTime = New-TimeSpan -Hours 17 -Minutes 0
        $totalWorkDayDuration = ($workDayEndTime - $workDayStartTime).TotalHours
        $currentTime = New-TimeSpan -Hours $currentDate.Hour -Minutes $currentDate.Minute -Seconds $currentDate.Second
        
        # Check if current time is within working hours
        if ($currentTime -gt $workDayStartTime -and $currentTime -lt $workDayEndTime) {
            # Calculate position between start and end times
            $timeElapsed = $currentTime - $workDayStartTime
            $fractionUsed = $timeElapsed.TotalHours / $totalWorkDayDuration
            $fractionRemaining = 1 - $fractionUsed
            
            # Adjust working days to include today's remaining fraction
            $workingDays = $workingDays - $leaves - 1 + $fractionRemaining
        } elseif ($currentTime -ge $workDayEndTime) {
            # After work hours, today is fully used
            $workingDays = $workingDays - $leaves
        } elseif ($currentTime -le $workDayStartTime) {
            # Before work hours, full day remains
            $workingDays = $workingDays - $leaves
        }
        
        return $workingDays.ToString('F2')
    }
    return "Unable to calculate working days"
}

# Create a simple HTTP server
$http = [System.Net.HttpListener]::new()
$http.Prefixes.Add("http://localhost:8080/")
$http.Start()

if ($http.IsListening) {
    Write-Host "HTTP server started at http://localhost:8080/"
    Write-Host "Press Ctrl+C to stop the server..."
}

try {
    while ($http.IsListening) {
        $context = $http.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Get working days calculation
        $workingDays = Get-WorkingDaysLeft
        
        # Create HTML response
        $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Working Days Calculator</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #4a6fa5;
            --secondary-color: #166088;
            --accent-color: #4fc3dc;
            --background-color: #f8f9fa;
            --text-color: #333;
            --card-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            padding: 20px;
            overflow: hidden;
            position: relative;
        }
        
        .bubbles {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: -1;
            overflow: hidden;
        }
        
        .bubbles span {
            position: absolute;
            bottom: -50px;
            background: var(--accent-color);
            border-radius: 50%;
            opacity: 0.5;
            animation: rise 15s linear infinite;
        }
        
        .bubbles span:nth-child(1) {
            width: 30px;
            height: 30px;
            left: 10%;
            animation-duration: 8s;
        }
        
        .bubbles span:nth-child(2) {
            width: 20px;
            height: 20px;
            left: 20%;
            animation-duration: 12s;
            animation-delay: 1s;
        }
        
        .bubbles span:nth-child(3) {
            width: 50px;
            height: 50px;
            left: 35%;
            animation-duration: 10s;
            animation-delay: 3s;
        }
        
        .bubbles span:nth-child(4) {
            width: 80px;
            height: 80px;
            left: 50%;
            animation-duration: 14s;
            animation-delay: 6s;
        }
        
        .bubbles span:nth-child(5) {
            width: 35px;
            height: 35px;
            left: 65%;
            animation-duration: 7s;
            animation-delay: 2s;
        }
        
        .bubbles span:nth-child(6) {
            width: 45px;
            height: 45px;
            left: 80%;
            animation-duration: 11s;
            animation-delay: 4s;
        }
        
        .bubbles span:nth-child(7) {
            width: 25px;
            height: 25px;
            left: 90%;
            animation-duration: 9s;
            animation-delay: 5s;
        }
        
        @keyframes rise {
            0% {
                transform: translateY(0) rotate(0);
                opacity: 0.5;
            }
            100% {
                transform: translateY(-1000px) rotate(360deg);
                opacity: 0;
            }
        }
        
        .card {
            position: relative;
            width: 100%;
            max-width: 600px;
            background: var(--background-color);
            border-radius: 20px;
            padding: 30px;
            box-shadow: var(--card-shadow);
            overflow: hidden;
            transform: translateY(20px);
            animation: fadeIn 0.8s forwards ease-out;
        }
        
        @keyframes fadeIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(90deg, var(--accent-color), var(--primary-color));
        }
        
        h1 {
            color: var(--primary-color);
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.2rem;
            position: relative;
            padding-bottom: 15px;
        }
        
        h1::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 4px;
            background: var(--accent-color);
            border-radius: 2px;
        }
        
        .result-container {
            margin: 30px 0;
            text-align: center;
            position: relative;
        }
        
        .result {
            font-size: 3rem;
            font-weight: bold;
            color: var(--secondary-color);
            margin: 20px 0;
            display: inline-block;
            position: relative;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .result::after {
            content: 'working days left';
            display: block;
            font-size: 1rem;
            font-weight: normal;
            color: var(--text-color);
            opacity: 0.7;
            margin-top: 5px;
        }
        
        .target-date {
            font-size: 1.2rem;
            color: var(--primary-color);
            margin: 15px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .target-date i {
            color: var(--accent-color);
        }
        
        .time {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 0.9rem;
            color: var(--text-color);
            opacity: 0.7;
            margin-top: 20px;
        }
        
        .time i {
            color: var(--primary-color);
        }
        
        .refresh-btn {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 25px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .refresh-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        
        .refresh-btn:active {
            transform: translateY(0);
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.8rem;
            color: var(--text-color);
            opacity: 0.6;
        }
        
        /* Responsive adjustments */
        @media (max-width: 600px) {
            .card {
                padding: 20px;
            }
            
            h1 {
                font-size: 1.8rem;
            }
            
            .result {
                font-size: 2.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="bubbles">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
    </div>
    
    <div class="card">
        <h1>Working Days Calculator</h1>
        
        <div class="result-container">
            <div class="result">$workingDays</div>
            <div class="target-date"><i class="fas fa-calendar-alt"></i> Until May 5, 2025</div>
        </div>
        
        <div class="time">
            <i class="fas fa-clock"></i> Last updated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <a href="/" onclick="window.location.reload(); return false;" class="refresh-btn">
                <i class="fas fa-sync-alt"></i> Refresh
            </a>
        </div>
        
        <div class="footer">
            Powered by PowerShell Web Server
        </div>
    </div>
    
    <script>
        // Add a small animation when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelector('.card').style.opacity = '0';
            setTimeout(function() {
                document.querySelector('.card').style.opacity = '1';
            }, 100);
        });
    </script>
</body>
</html>
"@
        
        # Convert the HTML to bytes
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
        
        # Configure response
        $response.ContentLength64 = $buffer.Length
        $response.ContentType = "text/html"
        
        # Write response
        $output = $response.OutputStream
        $output.Write($buffer, 0, $buffer.Length)
        $output.Close()
    }
}
finally {
    # Stop the HTTP server
    $http.Stop()
    $http.Close()
    Write-Host "Server stopped."
}
