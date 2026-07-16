Set-Location $PSScriptRoot
Start-Process "http://localhost:8080/index.html"
if (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server 8080
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server 8080
} else {
  Write-Host "Python was not found. Upload this folder to GitHub Pages instead."
  Read-Host "Press Enter to exit"
}
