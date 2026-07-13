"""
Voice Note Transcriber Service
Uses OpenAI Whisper to transcribe audio from Instagram/WhatsApp voice notes.
"""

import os
import requests
import tempfile
from pathlib import Path
from openai import OpenAI

def transcribe_voice_note(audio_url: str) -> str:
    """
    Downloads an audio file from a URL and transcribes it using OpenAI Whisper.
    Returns the transcribed text.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("VOICE_TRANSCRIPTION_ERROR: OPENAI_API_KEY missing", flush=True)
        return ""

    client = OpenAI(api_key=api_key)

    try:
        # 1. Download the audio file
        response = requests.get(audio_url, stream=True, timeout=30)
        if response.status_code != 200:
            print(f"VOICE_DOWNLOAD_ERROR: Status {response.status_code}", flush=True)
            return ""

        # 2. Save to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".m4a") as tmp:
            for chunk in response.iter_content(chunk_size=8192):
                tmp.write(chunk)
            tmp_path = tmp.name

        # 3. Transcribe using Whisper
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        
        # 4. Cleanup
        os.unlink(tmp_path)
        
        text = transcript.text.strip()
        print(f"VOICE_TRANSCRIPTION_SUCCESS: {text}", flush=True)
        return text

    except Exception as e:
        print(f"VOICE_TRANSCRIPTION_EXCEPTION: {e}", flush=True)
        return ""
