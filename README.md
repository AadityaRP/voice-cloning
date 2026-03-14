# Voice Clone Demo

Minimal Flask demo for cloning voices using ElevenLabs.

## Prerequisites
- Python 3.10+ (system or virtualenv)
- An ElevenLabs API key set in `.env` as `ELEVENLABS_API_KEY` or in environment

## Setup (Windows / PowerShell)
```powershell
# create venv (if missing)
c:/python314/python.exe -m venv venv
& .\venv\Scripts\Activate.ps1

# install dependencies
python -m pip install -r requirements.txt

# create .env with your key (or export ELEVENLABS_API_KEY)
# ELEVENLABS_API_KEY=sk_xxx
```

## Run (development)
```powershell
# run with Flask dev server
python app.py
# open http://127.0.0.1:5000/
```

## Run (production / Render start command)

Render expects a start command. Use gunicorn to bind to the provided $PORT:
```bash
gunicorn app:app --bind 0.0.0.0:$PORT
```

If you prefer to run locally with gunicorn:
```powershell
& .\venv\Scripts\python.exe -m gunicorn app:app --bind 0.0.0.0:5000
```

## Notes
- Don't commit `.env`; it's in `.gitignore`.
- The repo already includes `gunicorn` in `requirements.txt`.

## Tests
```powershell
python -m pytest -q
```

---
Created and pushed by assistant.
