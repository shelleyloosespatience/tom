# Launch Roblox Player or Studio
# Adjust paths if necessary based on installation
$robloxPath = "C:\Program Files (x86)\Roblox\Versions"

# Find the Roblox Player executable
$versionFolder = Get-ChildItem $robloxPath | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$playerExecutable = "$($versionFolder.FullName)\RobloxPlayerBeta.exe"

# Start Roblox Player with custom arguments (e.g., joining a server)
Start-Process -FilePath $playerExecutable -ArgumentList "-j https://www.roblox.com/share?code=181d839952915346bcd093fd0ffb6c63&type=Server"

# Keep the container running
Start-Sleep -Seconds 3600
