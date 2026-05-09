"use client";

import { VaultItem, SearchResult, api } from "@/lib/api";

interface Props {
  item: VaultItem | SearchResult;
  onDelete?: (id: string) => void;
  showSimilarity?: boolean;
}

function FileIcon({ category }: { category: string }) {
  switch (category) {
    case "image": return <span className="text-3xl">🖼️</span>;
    case "pdf":   return <span className="text-3xl">📄</span>;
    case "audio": return <span className="text-3xl">🎵</span>;
    case "text":  return <span className="text-3xl">📝</span>;
    default:      return <span className="text-3xl">📁</span>;
  }
}

function SimilarityBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-yellow-400" :
                  "bg-slate-400";
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Similarity</span>
        <span className="font-semibold text-slate-700">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function ItemCard({ item, onDelete, showSimilarity }: Props) {
  const similarity = (item as SearchResult).similarity;
  const isImage = item.type_category === "image";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Preview */}
      <div className="h-36 bg-slate-50 flex items-center justify-center relative">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={api.fileUrl(item.file_url)}
            alt={item.original_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileIcon category={item.type_category} />
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            title="Remove from vault"
          >
            ✕
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-slate-800 truncate" title={item.original_name}>
          {item.original_name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">
          {item.type_category}
        </p>
        {showSimilarity && similarity !== undefined && (
          <SimilarityBar score={similarity} />
        )}
      </div>
    </div>
  );
}
