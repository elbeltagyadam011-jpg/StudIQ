import React, { useState } from "react";
import { AppLanguage, SavedSession } from "../types";
import { translations } from "../translations";
import { BookOpen, Calendar, Clock, Search, Trash2, X } from "lucide-react";

interface RecentSessionsProps {
  currentLanguage: AppLanguage;
  sessions: SavedSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export default function RecentSessions({
  currentLanguage,
  sessions,
  activeSessionId,
  onSelectSession,
  onClearHistory,
  onClose,
}: RecentSessionsProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ocrResult.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ocrResult.extractedText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(currentLanguage === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-100 bg-white shadow-2xl animate-slide-left ${
      isRtl ? "right-auto left-0 border-l-0 border-r text-right" : "text-left"
    }`}>
      {/* 1. DRAWER HEADER */}
      <div className={`flex items-center justify-between border-b border-gray-100 px-5 py-4 ${
        isRtl ? "flex-row-reverse" : ""
      }`}>
        <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-sans text-base font-bold text-gray-900">
            {t.historyTitle}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 2. SEARCH HISTORIC SESSIONS */}
      <div className="p-4 border-b border-gray-50">
        <div className="relative">
          <Search className={`absolute top-2.5 h-4 w-4 text-gray-400 ${isRtl ? "right-3" : "left-3"}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? "البحث في الجلسات السابقة..." : "Search past sessions..."}
            className={`w-full rounded-xl border border-gray-200 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isRtl ? "pr-9 pl-4 text-right" : "pl-9 pr-4 text-left"
            }`}
          />
        </div>
      </div>

      {/* 3. SESSIONS LIST FEED */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/20">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  isRtl ? "text-right" : "text-left"
                } ${
                  isActive
                    ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <div className={`flex items-start justify-between gap-2 mb-2 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}>
                  <h4 className={`font-sans font-bold text-sm text-gray-900 truncate flex-grow ${
                    isActive ? "text-indigo-600" : ""
                  }`}>
                    {session.title}
                  </h4>
                  <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {session.language === "ar" ? "AR" : "EN"}
                  </span>
                </div>

                <div className={`flex items-center gap-4 text-[11px] font-semibold text-gray-400 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(session.timestamp)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {session.ocrResult.keyConcepts.length} {isRtl ? "مصطلحات" : "terms"}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">
            {isRtl ? "لا توجد جلسات مطابقة." : "No matching sessions found."}
          </div>
        )}
      </div>

      {/* 4. ACTIONS FOOTER */}
      {sessions.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          {!isConfirmingClear ? (
            <button
              onClick={() => setIsConfirmingClear(true)}
              id="clear-history-btn"
              className={`w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 hover:text-red-700 ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <Trash2 className="h-4.5 w-4.5" />
              <span>{t.clearHistory}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2 bg-red-50/50 p-3 rounded-xl border border-red-100">
              <p className="text-xs text-red-600 text-center font-bold">
                {t.confirmClearHistory}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    setIsConfirmingClear(false);
                  }}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
                >
                  {t.yesClear}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
