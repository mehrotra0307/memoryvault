"""
vector_store.py — Stores and searches embeddings using ChromaDB.

Simple mental model:
  - Think of it as a special database where each "row" is a 3,072-number vector
  - Instead of "WHERE name = 'beach'", you ask "find me the 5 rows closest to THIS vector"
  - ChromaDB does the math (cosine similarity) for you instantly
"""

import chromadb
from chromadb.config import Settings

_client = None
_collection = None

COLLECTION_NAME = "memoryvault"


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_item(
    item_id: str,
    embedding: list[float],
    metadata: dict,
):
    col = _get_collection()
    col.add(
        ids=[item_id],
        embeddings=[embedding],
        metadatas=[metadata],
    )


def search(
    query_embedding: list[float],
    n_results: int = 5,
) -> list[dict]:
    col = _get_collection()
    count = col.count()
    if count == 0:
        return []
    actual_n = min(n_results, count)
    results = col.query(
        query_embeddings=[query_embedding],
        n_results=actual_n,
        include=["metadatas", "distances"],
    )
    items = []
    for i, item_id in enumerate(results["ids"][0]):
        meta = results["metadatas"][0][i]
        distance = results["distances"][0][i]
        # ChromaDB cosine distance: 0 = identical, 2 = opposite
        # Convert to similarity percentage: higher is better
        similarity = round((1 - distance / 2) * 100, 1)
        items.append({
            "id": item_id,
            "similarity": similarity,
            **meta,
        })
    return items


def get_all_items() -> list[dict]:
    col = _get_collection()
    count = col.count()
    if count == 0:
        return []
    results = col.get(include=["metadatas"])
    items = []
    for i, item_id in enumerate(results["ids"]):
        meta = results["metadatas"][i]
        items.append({"id": item_id, **meta})
    return items


def delete_item(item_id: str):
    col = _get_collection()
    col.delete(ids=[item_id])


def count() -> int:
    return _get_collection().count()
