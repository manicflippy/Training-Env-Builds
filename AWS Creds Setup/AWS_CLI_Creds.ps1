# Retrieve AWS credentials using AWS CLI
aws configure

# Set the account
$accountnumber = Read-Host "Enter AWS Account ID"
# Call the script using a relative path and pass the parameter
& "$PSScriptRoot\Create_TerraformRole_with_custom_trust_policy.ps1" -accountnumber $accountnumber

#Set the role to be assumed
$rolename = "TerraformRole"
$roleArn = "arn:aws:iam::" + $accountnumber + ":role/" + $rolename

# output resultant arn
Write-Host "Using role ARN: $roleArn"

# Capture the raw output firs | Convert JSON to PowerShell object
$assumed_creds = aws sts assume-role --role-arn $roleArn --role-session-name AWSCLI-Session | ConvertFrom-Json -Depth 10

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

 