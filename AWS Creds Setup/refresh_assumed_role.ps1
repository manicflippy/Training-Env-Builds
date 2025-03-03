$assumed_creds = aws sts assume-role --role-arn $roleArn --role-session-name AWSCLI-Session | ConvertFrom-Json

# Ensure correct variable assignment
$env:AWS_ACCESS_KEY_ID = $assumed_creds.Credentials.AccessKeyId
$env:AWS_SECRET_ACCESS_KEY = $assumed_creds.Credentials.SecretAccessKey
$env:AWS_SESSION_TOKEN = $assumed_creds.Credentials.SessionToken

# Validate
if (-not [string]::IsNullOrEmpty($env:AWS_ACCESS_KEY_ID) -and  
    -not [string]::IsNullOrEmpty($env:AWS_SECRET_ACCESS_KEY) -and  
    -not [string]::IsNullOrEmpty($env:AWS_SESSION_TOKEN)) { 
    Write-Host "AWS credentials are set" -ForegroundColor Green 

} else { 
    Write-Host "AWS credentials are missing or empty" -ForegroundColor Red 
} 
