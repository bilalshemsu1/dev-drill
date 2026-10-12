Set WshShell = CreateObject("WScript.Shell")
desktop = WshShell.SpecialFolders("Desktop")
Set shortcut = WshShell.CreateShortcut(desktop & "\DevDrill.lnk")
shortcut.TargetPath = "powershell.exe"
shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ""D:\ncc_cpd\leetcode\offcode\scripts\desktop\launch-app.ps1"""
shortcut.WorkingDirectory = "D:\ncc_cpd\leetcode\offcode"
shortcut.Description = "DevDrill - Practice LeetCode & Codeforces Offline"
shortcut.IconLocation = "D:\ncc_cpd\leetcode\offcode\public\favicon.ico, 0"
shortcut.Save

startup = WshShell.SpecialFolders("Startup")
Set startupShortcut = WshShell.CreateShortcut(startup & "\DevDrill-Server.lnk")
startupShortcut.TargetPath = "powershell.exe"
startupShortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command ""Start-Process npx.cmd -ArgumentList '--yes serve D:\ncc_cpd\leetcode\offcode\dist -l 4230' -WindowStyle Hidden"""
startupShortcut.WorkingDirectory = "D:\ncc_cpd\leetcode\offcode"
startupShortcut.Description = "DevDrill Background Server"
startupShortcut.Save

WScript.Echo "Shortcuts created successfully"
