"""
embedder.py — Converts files into vectors using Gemini Embedding 2.

Uses the new google-genai SDK (the old google-generativeai is deprecated).
Official docs: https://ai.google.dev/gemini-api/docs/embeddings
"""

import os
from pathlib import Path

from google import genai
from google.genai import types
from pypdf import PdfReader

MODEL = "gemini-embedding-2"

_client = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


def _embed(contents) -> list[float]:
    result = get_client().models.embed_content(
        model=MODEL,
        contents=contents,
    )
    return result.embeddings[0].values


def embed_text(text: str) -> list[float]:
    return _embed(text)


def embed_image(file_path: str) -> list[float]:
    with open(file_path, "rb") as f:
        image_bytes = f.read()
    suffix = Path(file_path).suffix.lower()
    mime_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
    }
    mime = mime_map.get(suffix, "image/jpeg")
    part = types.Part.from_bytes(data=image_bytes, mime_type=mime)
    return _embed(part)


def embed_pdf(file_path: str) -> list[float]:
    reader = PdfReader(file_path)
    pages_text = []
    for page in reader.pages[:6]:
        text = page.extract_text()
        if text:
            pages_text.append(text.strip())
    combined = "\n\n".join(pages_text)
    if not combined.strip():
        combined = f"PDF document: {Path(file_path).name}"
    return _embed(combined)


def embed_audio(file_path: str) -> list[float]:
    with open(file_path, "rb") as f:
        audio_bytes = f.read()
    suffix = Path(file_path).suffix.lower()
    mime_map = {
        ".mp3": "audio/mpeg", ".wav": "audio/wav",
        ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".flac": "audio/flac",
    }
    mime = mime_map.get(suffix, "audio/mpeg")
    part = types.Part.from_bytes(data=audio_bytes, mime_type=mime)
    return _embed(part)


def embed_file(file_path: str, mime_type: str) -> list[float]:
    if mime_type.startswith("image/"):
        return embed_image(file_path)
    elif mime_type == "application/pdf":
        return embed_pdf(file_path)
    elif mime_type.startswith("audio/"):
        return embed_audio(file_path)
    else:
        text = Path(file_path).read_text(encoding="utf-8", errors="replace")
        return embed_text(text[:8000])
