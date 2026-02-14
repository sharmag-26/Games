# Ultimate Game Hub — Run Locally

Open these games in your browser locally.

Quick: run a local static server from this folder and visit `http://localhost:8000`.

Windows (PowerShell):

```powershell
# from c:\Users\umesh\Games
python -m http.server 8000
# or (PowerShell) if Python not available
Start-Process -FilePath "msedge.exe" -ArgumentList "--app=http://localhost:8000/Home.html"
```

Windows (double-click):

- Run `serve.bat` (requires Python on PATH)

Notes:
- The site files are static HTML/CSS/JS and are playable in modern browsers on desktop, mobile and tablet.
- Touch controls are enabled via `global-touch.js` for touch devices.
