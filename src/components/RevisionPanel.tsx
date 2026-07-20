import React, { useState, useEffect } from "react";
import { 
  Sparkles, BookOpen, ChevronRight, ChevronLeft, 
  Layers, Award, HelpCircle, FileText, Flame, 
  Zap, RefreshCw, Check, Clipboard, Scale, Hash, Info, Lightbulb
} from "lucide-react";
import { AppLanguage, RevisionPack } from "../types";
import { translations } from "../translations";
import ReactMarkdown from "react-markdown";

interface RevisionPanelProps {
  currentLanguage: AppLanguage;
  studyText: string;
  savedRevision?: RevisionPack | null;
  onSaveRevision: (revision: RevisionPack) => void;
}

export default function RevisionPanel({ 
  currentLanguage, 
  studyText, 
  savedRevision, 
  onSaveRevision 
}: RevisionPanelProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";
  const [isGenerating, setIsGenerating] = useState(false);
  const [revision, setRevision] = useState<RevisionPack | null>(savedRevision || null);
  const [activeSubTab, setActiveSubTab] = useState<"flashcards" | "summary" | "definitions" | "expected">("flashcards");
  
  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Expected questions states
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});

  // Clipboard copies
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load from prop if it changes
  useEffect(() => {
    if (savedRevision) {
      setRevision(savedRevision);
    }
  }, [savedRevision]);

  const generateRevision = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/revision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: studyText,
          language: currentLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate smart revision");
      }

      const data: RevisionPack = await response.json();
      setRevision(data);
      onSaveRevision(data);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setRevealedQuestions({});
    } catch (error) {
      console.error(error);
      setError(t.errorGeneral || "Failed to generate revision pack.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleQuestionReveal = (idx: number) => {
    setRevealedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // If no revision generated yet, show the CTA screen
  if (!revision) {
    return (
      <div className={`rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm ${isRtl ? "text-right" : "text-left"}`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6">
          <Zap className="h-8 w-8 animate-pulse" />
        </div>
        <h3 className="font-sans text-xl font-bold text-gray-900 mb-3 text-center">
          {isRtl ? "المراجعة الذكية للثانوية العامة" : "Smart Revision Pack"}
        </h3>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-500 text-center mb-6">
          {isRtl 
            ? "احصل على كبسولة مراجعة متكاملة يتم توليدها بذكاء بناءً على درسك: فلاش كاردز تفاعلية، أهم القوانين والصيغ، ملخص الصفحة الواحدة، كبسولة مراجعة الـ5 دقائق، والأسئلة الأكثر توقعاً في الامتحان مع شرح كامل."
            : "Get a comprehensive revision pack instantly compiled for your lesson: interactive flashcards, key definitions & laws, a concise summary, 5-minute quick highlights, expected exam questions, and historically high-yield ideas."}
        </p>
        
        {/* Error Message */}
        {error && (
          <div className="mx-auto max-w-md rounded-xl bg-red-50 p-3 border border-red-100 text-xs font-semibold text-red-600 mb-4 text-center">
            ⚠️ {error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={generateRevision}
            disabled={isGenerating}
            id="btn-generate-revision"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-6 py-3 text-sm font-bold text-white transition-all shadow-sm hover:shadow"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{isRtl ? "جاري التوليد بذكاء..." : "Generating Pack..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{isRtl ? "توليد كبسولة المراجعة الذكية" : "Generate Smart Revision Pack"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${isRtl ? "text-right" : "text-left"}`}>
      {/* Tab Selectors & Regenerate Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {/* Sub Tabs */}
        <div className={`flex flex-wrap gap-1.5 p-1 bg-gray-100/70 rounded-xl ${isRtl ? "flex-row-reverse" : ""}`}>
          <button
            onClick={() => setActiveSubTab("flashcards")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "flashcards"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            } ${isRtl ? "flex-row-reverse" : ""}`}
          >
            <Layers className="h-4 w-4" />
            <span>{isRtl ? "بطاقات الاستذكار" : "Flashcards"}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("summary")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "summary"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            } ${isRtl ? "flex-row-reverse" : ""}`}
          >
            <FileText className="h-4 w-4" />
            <span>{isRtl ? "الملخص والكبسولة" : "Summary & Review"}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("definitions")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "definitions"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            } ${isRtl ? "flex-row-reverse" : ""}`}
          >
            <Scale className="h-4 w-4" />
            <span>{isRtl ? "القوانين والمفاهيم" : "Laws & Concepts"}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("expected")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "expected"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            } ${isRtl ? "flex-row-reverse" : ""}`}
          >
            <Award className="h-4 w-4" />
            <span>{isRtl ? "التوقعات والأفكار" : "Exam Expected"}</span>
          </button>
        </div>

        {/* Regenerate Trigger */}
        <button
          onClick={generateRevision}
          disabled={isGenerating}
          id="btn-regenerate-revision"
          className={`inline-flex items-center gap-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 px-4 py-2 text-xs font-bold text-gray-700 transition-colors ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          {isGenerating ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span>{isRtl ? "تحديث المراجعة" : "Refresh Revision"}</span>
        </button>
      </div>

      {/* Main Panel Content Body */}
      <div>
        {/* TAB 1: FLASHCARDS */}
        {activeSubTab === "flashcards" && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-xl text-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {isRtl 
                  ? `بطاقة ${currentCardIndex + 1} من ${revision.flashcards.length}` 
                  : `Flashcard ${currentCardIndex + 1} of ${revision.flashcards.length}`}
              </span>
            </div>

            {/* Flipped Card Component */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="group relative h-80 w-full max-w-xl cursor-pointer perspective-1000"
            >
              <div 
                className={`relative h-full w-full duration-500 transform-style-3d transition-transform ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`flex items-center gap-2 text-indigo-600 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{isRtl ? "السؤال والمفهوم" : "Concept Question"}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-6">
                    <p className="font-sans text-lg font-extrabold text-gray-900 leading-relaxed text-center">
                      {revision.flashcards[currentCardIndex]?.front}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-indigo-500 uppercase bg-indigo-50/70 px-3 py-1 rounded-full">
                      {isRtl ? "اضغط لقلب البطاقة ومعرفة الإجابة 🔄" : "Tap to reveal answer 🔄"}
                    </span>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between rounded-3xl border border-indigo-100 bg-indigo-50/20 p-8 shadow-sm">
                  <div className={`flex items-center gap-2 text-indigo-700 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <Award className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{isRtl ? "الإجابة النموذجية" : "Model Answer"}</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center py-6 overflow-y-auto">
                    <p className="font-sans text-base font-medium text-gray-800 leading-relaxed text-center">
                      {revision.flashcards[currentCardIndex]?.back}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase bg-indigo-100 px-3 py-1 rounded-full">
                      {isRtl ? "اضغط للعودة للسؤال 🔄" : "Tap to return 🔄"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Navigation */}
            <div className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <button
                disabled={currentCardIndex === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setTimeout(() => {
                    setCurrentCardIndex(prev => Math.max(0, prev - 1));
                  }, 150);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(!isFlipped);
                }}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                {isRtl ? "اقلب البطاقة" : "Flip Card"}
              </button>

              <button
                disabled={currentCardIndex === revision.flashcards.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  setTimeout(() => {
                    setCurrentCardIndex(prev => Math.min(revision.flashcards.length - 1, prev + 1));
                  }, 150);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SUMMARY & RAPID REVIEW */}
        {activeSubTab === "summary" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* One Page Summary */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
              <div className={`flex items-center justify-between pb-3 border-b border-gray-50 ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-2 text-indigo-600 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <FileText className="h-5 w-5" />
                  <h4 className="font-sans text-base font-bold text-gray-900">{isRtl ? "ملخص الصفحة الواحدة" : "One-Page Study Sheet"}</h4>
                </div>
                <button
                  onClick={() => handleCopy(revision.onePageSummary, "summary")}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-all"
                >
                  {copiedText === "summary" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="prose max-w-none text-sm text-gray-700 leading-relaxed font-sans max-h-[500px] overflow-y-auto pr-2 markdown-body">
                <ReactMarkdown>{revision.onePageSummary}</ReactMarkdown>
              </div>
            </div>

            {/* Five Minute Quick Review */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
              <div className={`flex items-center justify-between pb-3 border-b border-gray-50 ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-2 text-amber-600 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <Flame className="h-5 w-5 animate-pulse" />
                  <h4 className="font-sans text-base font-bold text-gray-900">{isRtl ? "مراجعة الـ5 دقائق قبل الامتحان" : "5-Minute Eve-of-Exam Review"}</h4>
                </div>
                <button
                  onClick={() => handleCopy(revision.quickReview, "quick")}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-all"
                >
                  {copiedText === "quick" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="prose max-w-none text-sm text-gray-700 leading-relaxed font-sans max-h-[500px] overflow-y-auto pr-2 markdown-body bg-amber-50/20 rounded-xl p-4 border border-amber-100/50">
                <ReactMarkdown>{revision.quickReview}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEFINITIONS, LAWS & FORMULAS */}
        {activeSubTab === "definitions" && (
          <div className="flex flex-col gap-6">
            {/* Key Definitions list */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className={`flex items-center gap-2 pb-4 mb-4 border-b border-gray-50 text-indigo-600 ${isRtl ? "flex-row-reverse" : ""}`}>
                <Info className="h-5 w-5" />
                <h4 className="font-sans text-base font-bold text-gray-900">{isRtl ? "أهم التعريفات والمصطلحات" : "Key Definitions & Terminology"}</h4>
              </div>
              {revision.definitions && revision.definitions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {revision.definitions.map((def, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 font-sans flex flex-col gap-1 hover:border-indigo-100 transition-all">
                      <span className="font-sans font-extrabold text-sm text-gray-900">{def.term}</span>
                      <p className="text-xs text-gray-600 leading-relaxed">{def.meaning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-4">{isRtl ? "لا توجد مصطلحات محددة في هذا المقطع." : "No explicit definitions detected."}</p>
              )}
            </div>

            {/* Laws / Principles and Formulas side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Laws Section */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className={`flex items-center gap-2 pb-4 mb-4 border-b border-gray-50 text-emerald-600 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <Scale className="h-5 w-5" />
                  <h4 className="font-sans text-base font-bold text-gray-900">{isRtl ? "أهم القوانين والنظريات" : "Important Laws & Principles"}</h4>
                </div>
                {revision.laws && revision.laws.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {revision.laws.map((law, idx) => (
                      <div key={idx} className="rounded-xl border border-emerald-50 bg-emerald-50/10 p-4 font-sans flex flex-col gap-2">
                        <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
                          <span className="font-sans font-extrabold text-sm text-emerald-900">{law.name}</span>
                          {law.equation && (
                            <code className="text-[11px] font-bold bg-emerald-100/50 text-emerald-800 px-2 py-0.5 rounded-md font-mono">
                              {law.equation}
                            </code>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{law.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-4">{isRtl ? "لا توجد قوانين أو نظريات في هذا المقطع." : "No specific scientific laws found."}</p>
                )}
              </div>

              {/* Formulas Section */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className={`flex items-center gap-2 pb-4 mb-4 border-b border-gray-50 text-cyan-600 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <Hash className="h-5 w-5" />
                  <h4 className="font-sans text-base font-bold text-gray-900">{isRtl ? "أهم الصيغ والمعادلات" : "Key Formulas & Formulations"}</h4>
                </div>
                {revision.formulas && revision.formulas.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {revision.formulas.map((form, idx) => (
                      <div key={idx} className="rounded-xl border border-cyan-50 bg-cyan-50/10 p-4 font-sans flex flex-col gap-2">
                        <div className={`flex items-center justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
                          <span className="font-sans font-extrabold text-sm text-cyan-900">{form.name}</span>
                          <code className="text-xs font-bold bg-cyan-100/50 text-cyan-800 px-2 py-1 rounded-md font-mono">
                            {form.expression}
                          </code>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{form.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-4">{isRtl ? "لا توجد صيغ أو معادلات في هذا المقطع." : "No specific formulas found."}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXPECTED EXAM QUESTIONS & REPEATED IDEAS */}
        {activeSubTab === "expected" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Expected Exam Questions */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
                <div className={`flex items-center gap-2 pb-3 border-b border-gray-50 text-indigo-600 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <Award className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-sans text-base font-bold text-gray-900">{isRtl ? "الأسئلة الأكثر توقعاً في الامتحان الوزاري" : "Thanaweya Amma High-Probability Expected Questions"}</h4>
                </div>

                <div className="flex flex-col gap-4">
                  {revision.expectedQuestions && revision.expectedQuestions.map((eq, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 p-4 font-sans flex flex-col gap-3">
                      <div className={`flex items-start gap-2.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold mt-0.5 shrink-0">
                          {idx + 1}
                        </span>
                        <p className="font-sans text-sm font-extrabold text-gray-900 leading-normal">
                          {eq.question}
                        </p>
                      </div>

                      {/* Expandable answer container */}
                      {revealedQuestions[idx] ? (
                        <div className="rounded-lg bg-indigo-50/30 border border-indigo-50 p-3.5 flex flex-col gap-2 mt-1 animate-slide-up text-xs">
                          <div>
                            <span className="font-bold text-indigo-900 uppercase tracking-wide text-[10px]">{isRtl ? "الإجابة النموذجية:" : "Model Answer:"}</span>
                            <p className="font-bold text-gray-800 text-xs mt-0.5">{eq.answer}</p>
                          </div>
                          <div className="pt-2 border-t border-indigo-100/40">
                            <span className="font-bold text-indigo-900 uppercase tracking-wide text-[10px]">{isRtl ? "خطوات الحل والتحليل العلمي:" : "Scientific Step-by-Step Rationale:"}</span>
                            <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{eq.rationale}</p>
                          </div>
                        </div>
                      ) : null}

                      <button
                        onClick={() => toggleQuestionReveal(idx)}
                        className={`self-start mt-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline ${isRtl ? "self-end" : ""}`}
                      >
                        {revealedQuestions[idx] 
                          ? (isRtl ? "إخفاء التبرير العلمي وباقي الخطوات ⬆️" : "Hide detailed rationale ⬆️")
                          : (isRtl ? "كشف تبرير الإجابة والخطوات ⬇️" : "Reveal correct answer & rationale ⬇️")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Historically Repeated Ideas */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
                <div className={`flex items-center gap-2 pb-3 border-b border-gray-50 text-amber-500 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <Lightbulb className="h-5 w-5" />
                  <h4 className="font-sans text-base font-bold text-gray-900">{isRtl ? "الأفكار الأكثر تكراراً بالامتحانات السابقة" : "Historically Repeated Exam Themes"}</h4>
                </div>

                <div className="flex flex-col gap-4">
                  {revision.repeatedIdeas && revision.repeatedIdeas.map((idea, idx) => (
                    <div key={idx} className="rounded-xl bg-amber-50/30 border border-amber-100/50 p-4 font-sans flex flex-col gap-1.5">
                      <span className="font-sans font-extrabold text-sm text-amber-900">{idea.idea}</span>
                      <p className="text-xs text-gray-600 leading-relaxed font-sans">{idea.importance}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
