"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { api, SearchResult } from "@/lib/api";
import ItemCard from "@/components/ItemCard";

type Mode = "text" | "image";

export default function SearchPage() {
  const [mode, setMode] = useState<Mode>("text");
  const [query, setQuery] = useState("");
  const [queryImage, setQueryImage] = useState<File | null>(null);
  const [queryImagePreview, setQueryImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runTextSearch = async (q: string) => {
    if (!q.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await api.searchText(q);
      setResults(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed. Is the backend running?");
      setResults([]);
    }
    setSearching(false);
  };

  const runImageSearch = async (file: File) => {
    setSearching(true);
    setError(null);
    try {
      const res = await api.searchImage(file);
      setResults(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed. Is the backend running?");
      setResults([]);
    }
    setSearching(false);
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    const file = accepted[0];
    setQueryImage(file);
    setQueryImagePreview(URL.createObjectURL(file));
    setResults(null);
    runImageSearch(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runTextSearch(query);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setResults(null);
    setError(null);
    setQuery("");
    setQueryImage(null);
    setQueryImagePreview(null);
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
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
          >
            ← Back to Vault
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Mode Toggle */}
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 mb-6 w-fit shadow-sm">
          <button
            onClick={() => switchMode("text")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "text"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            🔤 Search by Text
          </button>
          <button
            onClick={() => switchMode("image")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "image"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            🖼️ Search by Image
          </button>
        </div>

        {/* Text Search */}
        {mode === "text" && (
          <form onSubmit={handleTextSubmit} className="mb-8">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder='Try: "tropical beach vacation" or "a dog playing outside"'
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!query.trim() || searching}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                {searching ? "…" : "Search"}
              </button>
            </div>

            {/* Example queries */}
            <div className="mt-3 flex flex-wrap gap-2">
              {["sunny outdoor adventure", "official document or certificate", "relaxing music", "handwritten notes"].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setQuery(s); runTextSearch(s); }}
                  className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full border border-indigo-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>
        )}

        {/* Image Search */}
        {mode === "image" && (
          <div className="mb-8">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
              }`}
            >
              <input {...getInputProps()} />
              {queryImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={queryImagePreview}
                  alt="Query"
                  className="max-h-48 mx-auto rounded-xl object-contain"
                />
              ) : (
                <>
                  <div className="text-4xl mb-3">🖼️</div>
                  <p className="text-slate-600 font-medium">Drop an image here to find similar items</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Upload a photo and MemoryVault will find everything in your vault with similar meaning
                  </p>
                </>
              )}
            </div>
            {queryImage && (
              <p className="text-sm text-slate-400 mt-2 text-center">
                Searching for items similar to <span className="font-medium text-slate-600">{queryImage.name}</span>…
              </p>
            )}
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 animate-bounce">🔍</div>
            <p className="text-slate-500">Gemini is computing similarity…</p>
          </div>
        )}

        {/* Error */}
        {error && !searching && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-6">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs text-red-500">Make sure the backend is running: <code>cd backend && uvicorn main:app --reload</code></p>
          </div>
        )}

        {/* Results */}
        {!searching && results !== null && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-700">
                {results.length > 0
                  ? `Found ${results.length} match${results.length !== 1 ? "es" : ""}`
                  : "No matches found"}
              </h2>
              {results.length > 0 && (
                <p className="text-xs text-slate-400">Ranked by semantic similarity</p>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">🤷</div>
                <p className="font-medium">No similar items in your vault</p>
                <p className="text-sm mt-1">Try a different query, or add more files to your vault</p>
                <Link href="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
                  ← Add more files
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {results.map(r => (
                  <ItemCard key={r.id} item={r} showSimilarity />
                ))}
              </div>
            )}

            {/* Explain the magic */}
            {results.length > 0 && (
              <div className="mt-10 bg-white rounded-2xl border border-slate-100 p-5 text-sm text-slate-500">
                <p className="font-medium text-slate-600 mb-1">✨ Why did these results match?</p>
                <p>
                  Gemini Embedding 2 converted your query into 3,072 numbers. It did the same for every
                  file in your vault when you uploaded them. The results you see are the files whose
                  numbers are closest to your query&apos;s numbers — meaning their <em>semantic meaning</em> is
                  most similar, even if no keywords match.
                </p>
              </div>
            )}
          </>
        )}

        {/* Empty state before first search */}
        {!searching && results === null && mode === "text" && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-6xl mb-4">🧭</div>
            <p className="text-lg font-medium text-slate-500">What are you looking for?</p>
            <p className="text-sm mt-2">
              Type anything — a feeling, a description, a memory. <br />
              Gemini understands meaning, not just keywords.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
