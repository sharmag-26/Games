# Serve current folder on port 8000 (requires Python)
# Start Python http.server in background and open default browser
Start-Process -FilePath python -ArgumentList '-m','http.server','8000'
Start-Sleep -Milliseconds 500
Start-Process 'http://localhost:8000/'
