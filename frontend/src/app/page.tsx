"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { api, VaultItem } from "@/lib/api";
import ItemCard from "@/components/ItemCard";

const ACCEPTED = {
  "image/jpeg": [], "image/png": [], "image/gif": [], "image/webp": [],
  "application/pdf": [],
  "text/plain": [], "text/markdown": [],
  "audio/mpeg": [], "audio/wav": [], "audio/mp4": [], "audio/ogg": [],
};

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const data = await api.listItems();
      setItems(data);
    } catch {
      // backend might not be running yet
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setUploading(true);
    setError(null);
    setUploadProgress([]);

    const messages: string[] = [];
    for (const file of accepted) {
      messages.push(`Embedding "${file.name}"…`);
      setUploadProgress([...messages]);
      try {
        const item = await api.upload(file);
        setItems(prev => [item, ...prev]);
        messages[messages.length - 1] = `✓ "${file.name}" added`;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        messages[messages.length - 1] = `✗ "${file.name}": ${msg}`;
        setError(msg);
      }
      setUploadProgress([...messages]);
    }
    setUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
  });

  const handleDelete = async (id: string) => {
    await api.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-none">MemoryVault</h1>
              <p className="text-xs text-slate-400 mt-0.5">Powered by Gemini Embedding 2</p>
            </div>
          </div>
          {items.length > 0 && (
            <Link
              href="/search"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <span>🔍</span> Search Vault
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-10 ${
            isDragActive
              ? "border-indigo-400 bg-indigo-50"
              : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-5xl mb-4">{isDragActive ? "📥" : "☁️"}</div>
          <p className="text-lg font-semibold text-slate-700">
            {isDragActive ? "Drop to add to your vault" : "Drop files here, or click to upload"}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Supports images (JPG, PNG, WebP), PDFs, text files, and audio (MP3, WAV)
          </p>
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-8">
            <p className="text-sm font-medium text-slate-600 mb-2">
              {uploading ? "Generating embeddings…" : "Done!"}
            </p>
            <ul className="space-y-1">
              {uploadProgress.map((msg, i) => (
                <li key={i} className="text-sm text-slate-500 font-mono">{msg}</li>
              ))}
            </ul>
            {uploading && (
              <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-1 bg-indigo-400 rounded-full animate-pulse w-3/4" />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Vault Grid */}
        {items.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg font-medium">Your vault is empty</p>
            <p className="text-sm mt-1">Upload some files above to get started</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-700">
                Your Vault
                <span className="ml-2 text-sm font-normal text-slate-400">({items.length} items)</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map(item => (
                <ItemCard key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}

        {/* Explainer */}
        <div className="mt-16 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-700 mb-3">💡 How does this work?</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-slate-500">
            <div>
              <p className="font-medium text-slate-600 mb-1">Step 1: You upload files</p>
              <p>Images, PDFs, text notes, audio clips — anything goes.</p>
            </div>
            <div>
              <p className="font-medium text-slate-600 mb-1">Step 2: Gemini converts them</p>
              <p>Each file becomes 3,072 numbers that capture its meaning — called an embedding.</p>
            </div>
            <div>
              <p className="font-medium text-slate-600 mb-1">Step 3: You search by meaning</p>
              <p>Type a description or upload a query image. Similar embeddings = similar meaning = matching results.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
