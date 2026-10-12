Set WshShell = CreateObject("WScript.Shell")
desktop = WshShell.SpecialFolders("Desktop")
Set shortcut = WshShell.CreateShortcut(desktop & "\OffCode.lnk")
shortcut.TargetPath = "powershell.exe"
shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ""D:\ncc_cpd\leetcode\offcode\launch-app.ps1"""
shortcut.WorkingDirectory = "D:\ncc_cpd\leetcode\offcode"
shortcut.Description = "Practice LeetCode & Codeforces Offline"
shortcut.IconLocation = "D:\ncc_cpd\leetcode\offcode\public\favicon.ico, 0"
shortcut.Save

WScript.Echo "Shortcut updated with new icon"
