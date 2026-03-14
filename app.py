import os
import uuid
import mimetypes
from io import BytesIO
from pathlib import Path

mimetypes.init()
mimetypes.types_map['.js'] = 'application/javascript'
mimetypes.types_map['.css'] = 'text/css'

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, send_file
from elevenlabs.client import ElevenLabs

load_dotenv()

app = Flask(__name__)

API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not API_KEY:
    raise ValueError("ELEVENLABS_API_KEY is missing in .env")

client = ElevenLabs(api_key=API_KEY)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/clone-voice", methods=["POST"])
def clone_voice():
    try:
        if "audio" not in request.files:
            return jsonify({"success": False, "error": "No audio file received"}), 400

        audio = request.files["audio"]
        voice_name = request.form.get("voice_name", "").strip() or f"Client-{uuid.uuid4().hex[:6]}"

        if audio.filename == "":
            return jsonify({"success": False, "error": "Empty file selected"}), 400

        ext = Path(audio.filename).suffix or ".webm"
        saved_path = UPLOAD_DIR / f"{uuid.uuid4().hex}{ext}"
        audio.save(saved_path)

        print(f"[INFO] Saved uploaded audio to: {saved_path}")

        with open(saved_path, "rb") as f:
            audio_bytes = BytesIO(f.read())

        voice = client.voices.ivc.create(
            name=voice_name,
            files=[audio_bytes]
        )

        print(f"[INFO] Voice created successfully: {voice.voice_id}")

        return jsonify({
            "success": True,
            "voice_id": voice.voice_id,
            "voice_name": voice_name
        })

    except Exception as e:
        print("[ERROR] clone_voice failed:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/generate-audio", methods=["POST"])
def generate_audio():
    try:
        data = request.get_json()
        text = (data.get("text") or "").strip()
        voice_id = (data.get("voice_id") or "").strip()

        if not text:
            return jsonify({"success": False, "error": "Text is required"}), 400

        if not voice_id:
            return jsonify({"success": False, "error": "voice_id is required"}), 400

        print(f"[INFO] Generating speech for voice_id: {voice_id}")

        audio_stream = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128"
        )

        output_filename = f"{uuid.uuid4().hex}.mp3"
        output_path = OUTPUT_DIR / output_filename

        with open(output_path, "wb") as f:
            for chunk in audio_stream:
                if chunk:
                    f.write(chunk)

        print(f"[INFO] Audio generated: {output_path}")

        return jsonify({
            "success": True,
            "audio_url": f"/audio/{output_filename}"
        })

    except Exception as e:
        print("[ERROR] generate_audio failed:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/audio/<filename>")
def serve_audio(filename):
    path = OUTPUT_DIR / filename
    if not path.exists():
        return jsonify({"success": False, "error": "Audio file not found"}), 404
    return send_file(path, mimetype="audio/mpeg")


if __name__ == "__main__":
    app.run(debug=True)