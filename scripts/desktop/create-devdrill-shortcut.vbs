Set WshShell = CreateObject("WScript.Shell")
desktop = WshShell.SpecialFolders("Desktop")
Set shortcut = WshShell.CreateShortcut(desktop & "\DevDrill.lnk")
shortcut.TargetPath = "powershell.exe"
shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ""D:\ncc_cpd\leetcode\offcode\scripts\desktop\launch-app.ps1"""
shortcut.WorkingDirectory = "D:\ncc_cpd\leetcode\offcode"
shortcut.Description = "DevDrill - Practice LeetCode & Codeforces Offline"
shortcut.IconLocation = "D:\ncc_cpd\leetcode\offcode\public\favicon.ico, 0"
shortcut.Save

WScript.Echo "DevDrill shortcut created"
