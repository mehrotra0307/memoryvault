import chromadb
from chromadb.config import Settings

client = chromadb.PersistentClient(
    path="./chroma_db",
    settings=Settings(anonymized_telemetry=False)
)
col = client.get_collection("memoryvault")
results = col.get(include=["embeddings", "metadatas"])

print(f"Total items in vault: {len(results['ids'])}\n")

for i, item_id in enumerate(results["ids"]):
    meta = results["metadatas"][i]
    emb = results["embeddings"][i]
    print(f"Item {i+1}: {meta['original_name']}")
    print(f"  Type      : {meta['type_category']}")
    print(f"  MIME      : {meta['mime_type']}")
    print(f"  Dimensions: {len(emb)}  (should be 3072)")
    print(f"  First 5 numbers : {[round(n, 5) for n in emb[:5]]}")
    print(f"  Last  5 numbers : {[round(n, 5) for n in emb[-5:]]}")
    print()
