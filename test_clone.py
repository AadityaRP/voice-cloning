import os
from io import BytesIO
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv()

client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

with open("sample.mp3", "rb") as f:
    voice = client.voices.ivc.create(
        name="Test Voice Clone",
        files=[BytesIO(f.read())]
    )

print("VOICE ID:", voice.voice_id)