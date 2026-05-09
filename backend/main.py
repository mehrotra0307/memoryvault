"""
main.py — FastAPI server for MemoryVault.

Routes:
  POST /upload          → Upload a file, embed it, store in ChromaDB
  POST /search/text     → Search vault by text query
  POST /search/image    → Search vault by uploading a query image
  GET  /items           → List all items in the vault
  DELETE /items/{id}    → Remove an item from the vault
  GET  /file/{filename} → Serve uploaded files (for previews)
"""

import os
import uuid
import mimetypes
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

import embedder
import vector_store

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

if not os.getenv("GEMINI_API_KEY"):
    raise RuntimeError("GEMINI_API_KEY not set. Add it to the .env file in the project root.")

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="MemoryVault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain", "text/markdown",
    "audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/flac",
}


def _guess_mime(filename: str, declared: str) -> str:
    guessed, _ = mimetypes.guess_type(filename)
    return guessed or declared or "application/octet-stream"


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    mime = _guess_mime(file.filename, file.content_type)
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {mime}. Supported: images, PDFs, text files, audio.",
        )

    item_id = str(uuid.uuid4())
    suffix = Path(file.filename).suffix
    saved_name = f"{item_id}{suffix}"
    saved_path = UPLOAD_DIR / saved_name

    content = await file.read()
    saved_path.write_bytes(content)

    try:
        embedding = embedder.embed_file(str(saved_path), mime)
    except Exception as e:
        saved_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

    metadata = {
        "original_name": file.filename,
        "saved_name": saved_name,
        "mime_type": mime,
        "file_url": f"/file/{saved_name}",
        "type_category": _category(mime),
    }
    vector_store.add_item(item_id, embedding, metadata)

    return {"id": item_id, **metadata}


@app.post("/search/text")
async def search_by_text(query: str = Form(...)):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        embedding = embedder.embed_text(query.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")
    results = vector_store.search(embedding, n_results=8)
    return {"query": query, "results": results}


@app.post("/search/image")
async def search_by_image(file: UploadFile = File(...)):
    mime = _guess_mime(file.filename, file.content_type)
    if not mime.startswith("image/"):
        raise HTTPException(status_code=415, detail="Only image files can be used as query.")

    tmp_path = UPLOAD_DIR / f"query_{uuid.uuid4()}{Path(file.filename).suffix}"
    content = await file.read()
    tmp_path.write_bytes(content)

    try:
        embedding = embedder.embed_image(str(tmp_path))
    except Exception as e:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")
    finally:
        tmp_path.unlink(missing_ok=True)

    results = vector_store.search(embedding, n_results=8)
    return {"results": results}


@app.get("/items")
async def list_items():
    items = vector_store.get_all_items()
    return {"items": items, "count": len(items)}


@app.delete("/items/{item_id}")
async def delete_item(item_id: str):
    all_items = vector_store.get_all_items()
    item = next((i for i in all_items if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    saved_path = UPLOAD_DIR / item["saved_name"]
    saved_path.unlink(missing_ok=True)
    vector_store.delete_item(item_id)
    return {"deleted": item_id}


@app.get("/file/{filename}")
async def serve_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    # Security: ensure path is within UPLOAD_DIR
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(status_code=403, detail="Access denied.")
    return FileResponse(str(file_path))


@app.get("/health")
async def health():
    return {"status": "ok", "vault_count": vector_store.count()}


def _category(mime: str) -> str:
    if mime.startswith("image/"):
        return "image"
    if mime == "application/pdf":
        return "pdf"
    if mime.startswith("audio/"):
        return "audio"
    if mime.startswith("text/"):
        return "text"
    return "other"
