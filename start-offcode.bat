@echo off
title OffCode Launcher
cd /d "D:\ncc_cpd\leetcode\offcode"
start "" http://localhost:4230
npx --yes serve dist -l 4230
