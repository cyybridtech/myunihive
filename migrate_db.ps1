$HostName = "gateway01.eu-central-1.prod.aws.tidbcloud.com"
$Port = 4000
$Username = "3kBDbpwqLJVraMm.root"
$Database = "test"

$Password = Read-Host -Prompt "Please enter your TiDB Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "Connecting to TiDB and migrating data... Please wait..."
Get-Content unihive_dump.sql | c:\xampp\mysql\bin\mysql.exe -h $HostName -P $Port -u $Username -p$PlainPassword --ssl-mode=REQUIRED $Database

Write-Host "Migration Complete!"
