#SSO
$accountofinterest = "innovation-nonprod"
aws sso login --profile my-sso-profile
#Reads all the cached AWS SSO JSON files and converts them into PowerShell objects. | #Filters out objects that do not have an accessToken or have already expired. 
$tokens = Get-Content "$env:USERPROFILE\.aws\sso\cache\*.json" | ConvertFrom-Json | Where-Object { $_.accessToken -and (Get-Date $_.expiresAt) -gt (Get-Date) }
#Sorts the remaining objects by expiresAt in descending order (latest first). | Picks the first result (latest valid token) and outputs just the accessToken.
$latestToken = $tokens | Sort-Object expiresAt -Descending | Select-Object -First 1 -ExpandProperty accessToken
aws sso list-accounts --profile my-sso-profile --access-token $latestToken | ConvertFrom-Json | Select-Object -ExpandProperty accountList | Where-Object { $_.accountName -eq $accountofinterest }
#aws sso get-role-credentials --account-id 069705096352 --role-name innovation --profile my-sso-profile --access-token $latestToken
# Capture the raw output firs | Convert JSON to PowerShell object
$assumed_creds = aws sso get-role-credentials --account-id 069705096352 --role-name innovation --profile my-sso-profile --access-token $latestToken | ConvertFrom-Json
# Ensure correct variable assignment
$env:AWS_ACCESS_KEY_ID = $assumed_creds.roleCredentials.accessKeyId
$env:AWS_SECRET_ACCESS_KEY = $assumed_creds.roleCredentials.secretAccessKey
$env:AWS_SESSION_TOKEN = $assumed_creds.roleCredentials.sessionToken
# Verify if they were set correctly
Write-Host "AWS_ACCESS_KEY_ID: $env:AWS_ACCESS_KEY_ID"
Write-Host "AWS_SECRET_ACCESS_KEY: $env:AWS_SECRET_ACCESS_KEY"
Write-Host "AWS_SESSION_TOKEN: $env:AWS_SESSION_TOKEN"
Write-Host "Credentials successfully set!"



#Single Acloud guru account


# Retrieve AWS credentials using AWS CLI
aws configure

# Set the account of interest
$accountnumber = "975050248899"
$rolename = "Terraform"
$roleArn = "arn:aws:iam::" + $accountnumber + ":role/" + $rolename

# output resultant arn
Write-Host "Using role ARN: $roleArn"

# Capture the raw output firs | Convert JSON to PowerShell object
$assumed_creds = aws sts assume-role --role-arn $roleArn --role-session-name AWSCLI-Session | ConvertFrom-Json

# Ensure correct variable assignment
$env:AWS_ACCESS_KEY_ID = $assumed_creds.Credentials.AccessKeyId
$env:AWS_SECRET_ACCESS_KEY = $assumed_creds.Credentials.SecretAccessKey
$env:AWS_SESSION_TOKEN = $assumed_creds.Credentials.SessionToken

# Verify if they were set correctly
Write-Host "AWS_ACCESS_KEY_ID: $env:AWS_ACCESS_KEY_ID"
Write-Host "AWS_SECRET_ACCESS_KEY: $env:AWS_SECRET_ACCESS_KEY"
Write-Host "AWS_SESSION_TOKEN: $env:AWS_SESSION_TOKEN"
Write-Host "Credentials successfully set!"





  