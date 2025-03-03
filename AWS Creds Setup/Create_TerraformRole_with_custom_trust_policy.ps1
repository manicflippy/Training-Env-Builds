# Set user ARN for principal
param (
    [string]$accountnumber
)

# If the parameter is not provided, prompt for input
if (-not $accountnumber) {
    $accountnumber = Read-Host "Enter AWS Account ID"
}

Write-Host "Using AWS Account ID: $accountnumber" -ForegroundColor Green

# Set debug flag (True for debug output, False to suppress)
$debug = $false

# Get the current public IP
$PublicIP = (Invoke-WebRequest -Uri "https://ifconfig.io/" -UseBasicParsing).Content.Trim()

$userarn = "arn:aws:iam::" + $accountnumber + ":user/cloud_user"
if ($debug) {
    Write-Host "Debug Mode On: userarn = " + $userarn 
}

# Define the trust policy as a PowerShell object
$TrustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                AWS = $userarn
            }
            Action = "sts:AssumeRole"
            Condition = @{
                IpAddress = @{
                    "aws:SourceIp" = "$PublicIP/32"
                }
                StringEquals = @{
                    "aws:RequestedRegion" = "us-east-1"
                }
            }
        }
    )
}

# Convert the PowerShell object to a JSON string
$TrustPolicyJson = $TrustPolicy | ConvertTo-Json -Depth 10 -Compress

# Remove any \r\n characters from the JSON string
$TrustPolicyJson = $TrustPolicyJson -replace "`r`n", ""

# Function to check if the IAM role exists
function Test-IAMRole {
    param ([string]$RoleName)
    $roleCheck = aws iam get-role --role-name $RoleName 2>$null
    return $roleCheck -ne $null
}

# Check if the role exists before creating
$RoleName = "TerraformRole"
$PolicyArn = "arn:aws:iam::aws:policy/AdministratorAccess"

if (Test-IAMRole -RoleName $RoleName) {
    Write-Host "IAM Role '$RoleName' already exists. Exiting..." -ForegroundColor Yellow
    exit 0
} else {
    # Create the IAM role and suppress standard output
    aws iam create-role --role-name $RoleName --assume-role-policy-document "$TrustPolicyJson"> $null

    # Attach the AdministratorAccess policy
    aws iam attach-role-policy --role-name $RoleName --policy-arn $PolicyArn

    # Function to check if the policy is attached
    function Test-RolePolicy {
        param ([string]$RoleName, [string]$PolicyArn)
        $policyCheck = aws iam list-attached-role-policies --role-name $RoleName | ConvertFrom-Json -Depth 10
        return $policyCheck.AttachedPolicies.PolicyArn -contains $PolicyArn
    }

    # Wait and verify the IAM role exists before continuing
    $RetryCount = 5
    $Delay = 5

    for ($i = 1; $i -le $RetryCount; $i++) {
        if (Test-IAMRole -RoleName $RoleName) {
            Write-Host "IAM Role '$RoleName' successfully created." -ForegroundColor Green
            break
        }
        Write-Host "Waiting for IAM role '$RoleName' to be available... ($i/$RetryCount)" -ForegroundColor Yellow
        Start-Sleep -Seconds $Delay
    }

    # Exit if the role was not created
    if (-not (Test-IAMRole -RoleName $RoleName)) {
        Write-Host "Error: IAM Role '$RoleName' was not created. Exiting..." -ForegroundColor Red 
        exit 1
    }

    # Wait and verify the policy is attached before continuing
    for ($i = 1; $i -le $RetryCount; $i++) {
        if (Test-RolePolicy -RoleName $RoleName -PolicyArn $PolicyArn) {
            Write-Host "Policy '$PolicyArn' successfully attached to role '$RoleName'." -ForegroundColor Green 
            break
        }
        Write-Host "Waiting for policy attachment... ($i/$RetryCount)" -ForegroundColor Yellow 
        Start-Sleep -Seconds $Delay
    }

    # Exit if the policy was not attached
    if (-not (Test-RolePolicy -RoleName $RoleName -PolicyArn $PolicyArn)) {
        Write-Host "Error: Policy '$PolicyArn' was not attached to IAM Role '$RoleName'. Exiting..." -ForegroundColor Red
        exit 1
    }

    Write-Host "Role and policy successfully verified. Continuing script execution..." -ForegroundColor Green 

    # Cleanup
    # Remove-Item $TrustPolicyFile
}
