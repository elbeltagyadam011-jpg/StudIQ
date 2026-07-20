import React, { useState } from "react";
import { BookOpen, Copy, Check, Search, FileText, Sparkles, Image as ImageIcon } from "lucide-react";
import { AppLanguage, OcrResult } from "../types";
import { translations } from "../translations";
import ReactMarkdown from "react-markdown";

interface StudyPanelProps {
  currentLanguage: AppLanguage;
  ocrResult: OcrResult;
  imageSrc?: string;
}

export default function StudyPanel({ currentLanguage, ocrResult, imageSrc }: StudyPanelProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "text" | "image">("summary");

  const handleCopyText = () => {
    navigator.clipboard.writeText(ocrResult.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredConcepts = ocrResult.keyConcepts.filter(
    (c) =>
      c.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.explanation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`grid grid-cols-1 gap-6 lg:grid-cols-3 ${isRtl ? "text-right" : "text-left"}`}>
      {/* Left Column: Original Image & Verbatim Text Tabs */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          {/* Sub Tab Headers */}
          <div className={`flex border-b border-gray-100 pb-3 gap-4 mb-4 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
            <button
              onClick={() => setActiveTab("summary")}
              className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "summary"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.conceptsSummary}
            </button>
            {imageSrc && (
              <button
                onClick={() => setActiveTab("image")}
                className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "image"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t.originalImage}
              </button>
            )}
            <button
              onClick={() => setActiveTab("text")}
              className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "text"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.extractedVerbatim}
            </button>
          </div>

          {/* Active Tab Body */}
          <div className="mt-2">
            {activeTab === "summary" && (
              <div className="prose max-w-none text-gray-700 leading-relaxed text-sm">
                <div className={`flex items-center gap-2 mb-3 text-indigo-600 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold text-xs tracking-wider uppercase">{t.conceptsSummary}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{ocrResult.title}</h3>
                <div className="markdown-body font-sans space-y-4">
                  <ReactMarkdown>{ocrResult.summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === "image" && imageSrc && (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center p-1">
                <img
                  src={imageSrc}
                  alt="Textbook Page"
                  className="max-h-[450px] w-auto object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {activeTab === "text" && (
              <div className="flex flex-col gap-4">
                <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex items-center gap-2 text-indigo-600 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold text-xs tracking-wider uppercase">{t.extractedVerbatim}</span>
                  </div>
                  <button
                    onClick={handleCopyText}
                    id="copy-text-btn"
                    className={`flex items-center gap-1.5 rounded-lg border border-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-indigo-600 ${
                      isRtl ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-600">{t.copiedText}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>{t.copyText}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="max-h-[350px] overflow-y-auto rounded-xl bg-gray-50/50 p-4 border border-gray-100 font-sans text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {ocrResult.extractedText}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Key Concepts Flashcards Bento Board */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col h-full">
          {/* Header & Search */}
          <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 ${
            isRtl ? "sm:flex-row-reverse" : ""
          }`}>
            <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-sans text-lg font-bold text-gray-900">
                {t.keyConceptsList}
              </h3>
            </div>

            {/* Search Input */}
            <div className={`relative max-w-xs w-full ${isRtl ? "text-right" : ""}`}>
              <Search className={`absolute top-2.5 h-4 w-4 text-gray-400 ${isRtl ? "right-3" : "left-3"}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchConcepts}
                className={`w-full rounded-xl border border-gray-200 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isRtl ? "pr-9 pl-4 text-right" : "pl-9 pr-4 text-left"
                }`}
              />
            </div>
          </div>

          {/* Grid list of concepts */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 flex-grow overflow-y-auto max-h-[500px] pr-1">
            {filteredConcepts.length > 0 ? (
              filteredConcepts.map((item, idx) => (
                <div
                  key={idx}
                  className="group rounded-xl border border-gray-100 bg-gray-50/30 p-4 transition-all hover:border-indigo-100 hover:bg-indigo-50/10 hover:shadow-sm"
                >
                  <h4 className="font-sans font-bold text-gray-900 text-base mb-1.5 group-hover:text-indigo-600">
                    {item.concept}
                  </h4>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-400">
                {t.noConceptsFound}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
