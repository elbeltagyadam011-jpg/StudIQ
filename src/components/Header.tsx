import React from "react";
import { BookOpen, Globe, History, Plus, BarChart3 } from "lucide-react";
import { AppLanguage } from "../types";
import { translations } from "../translations";

interface HeaderProps {
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  onNewSession: () => void;
  onToggleHistory: () => void;
  onToggleStats: () => void;
  isStatsActive: boolean;
  hasActiveSession: boolean;
  historyCount: number;
}

export default function Header({
  currentLanguage,
  onLanguageChange,
  onNewSession,
  onToggleHistory,
  onToggleStats,
  isStatsActive,
  hasActiveSession,
  historyCount,
}: HeaderProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo and Brand */}
        <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 transition-transform hover:scale-105">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className={isRtl ? "text-right" : "text-left"}>
            <h1 className="font-sans text-xl font-bold tracking-tight text-gray-900">
              {t.appName}
            </h1>
            <p className="hidden font-sans text-xs font-medium text-gray-400 sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center gap-2 sm:gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          {/* New Session Button */}
          {hasActiveSession && (
            <button
              onClick={onNewSession}
              id="new-session-btn"
              className={`flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-100 active:scale-95 ${
                isRtl ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">{t.newSession}</span>
            </button>
          )}

          {/* History Button */}
          <button
            onClick={onToggleHistory}
            id="toggle-history-btn"
            className={`relative flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 ${
              isRtl ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <History className="h-4 w-4" />
            <span className="hidden md:inline">{t.historyTitle}</span>
            {historyCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm">
                {historyCount}
              </span>
            )}
          </button>

          {/* Statistics Button */}
          <button
            onClick={onToggleStats}
            id="toggle-stats-btn"
            className={`flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
              isRtl ? "flex-row-reverse" : "flex-row"
            } ${
              isStatsActive 
                ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-bold" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden md:inline">{t.tabStats}</span>
          </button>

          {/* Bilingual Language Switcher */}
          <button
            onClick={() => onLanguageChange(currentLanguage === "en" ? "ar" : "en")}
            id="language-switch-btn"
            className={`flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 active:scale-95 ${
              isRtl ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <Globe className="h-4 w-4 text-indigo-400" />
            <span>{t.languageToggle}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
