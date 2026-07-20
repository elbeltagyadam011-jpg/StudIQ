import React, { useState, useEffect, useRef } from "react";
import { AppLanguage, SavedSession, OcrResult, Quiz, ChatMessage, RevisionPack } from "./types";
import { translations } from "./translations";
import Header from "./components/Header";
import OcrUploader from "./components/OcrUploader";
import StudyPanel from "./components/StudyPanel";
import QuizPanel from "./components/QuizPanel";
import ChatPanel from "./components/ChatPanel";
import RevisionPanel from "./components/RevisionPanel";
import StatisticsPanel from "./components/StatisticsPanel";
import RecentSessions from "./components/RecentSessions";
import { BookOpen, HelpCircle, MessageSquare, Sparkles, BookOpenCheck, ArrowRight, Zap, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>("en");
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"study" | "quiz" | "chat" | "revision" | "stats">("study");
  const [isThinking, setIsThinking] = useState(false);
  const [lowConfidenceError, setLowConfidenceError] = useState<{ reason: string; image: string } | null>(null);

  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleTabsScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 1) {
        setShowLeftFade(false);
        setShowRightFade(false);
        return;
      }
      const absScrollLeft = Math.abs(scrollLeft);
      
      if (currentLanguage === "ar") {
        const isAtStart = absScrollLeft < 8;
        const isAtEnd = absScrollLeft > maxScroll - 8;
        setShowLeftFade(!isAtEnd);
        setShowRightFade(!isAtStart);
      } else {
        setShowLeftFade(scrollLeft > 8);
        setShowRightFade(scrollLeft < maxScroll - 8);
      }
    }
  };

  useEffect(() => {
    const tabsEl = tabsRef.current;
    if (tabsEl) {
      tabsEl.addEventListener("scroll", handleTabsScroll);
      // Run immediately and also a brief moment after to catch mount sizes
      handleTabsScroll();
      const t = setTimeout(handleTabsScroll, 200);
      window.addEventListener("resize", handleTabsScroll);
      return () => {
        tabsEl.removeEventListener("scroll", handleTabsScroll);
        window.removeEventListener("resize", handleTabsScroll);
        clearTimeout(t);
      };
    }
  }, [activeSessionId, currentLanguage]);

  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";

  // Load saved sessions on startup
  useEffect(() => {
    const stored = localStorage.getItem("studymind_sessions");
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored sessions:", e);
      }
    }
  }, []);

  // Auto-scroll active tab into view when activeTab or activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      const timer = setTimeout(() => {
        const activeElement = document.getElementById(`tab-btn-${activeTab}`);
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
        // update fade visibility after scrolling completes
        setTimeout(handleTabsScroll, 300);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, activeSessionId]);

  // Update study streak on session activation
  useEffect(() => {
    if (!activeSessionId) return;

    const todayStr = new Date().toDateString();
    const storedStreak = localStorage.getItem("studymind_streak");
    
    let currentStreak = { count: 0, lastDate: "" };
    if (storedStreak) {
      try {
        currentStreak = JSON.parse(storedStreak);
      } catch (e) {
        console.error("Failed to parse stored streak:", e);
      }
    }

    if (!currentStreak.lastDate) {
      const newStreak = { count: 1, lastDate: todayStr };
      localStorage.setItem("studymind_streak", JSON.stringify(newStreak));
    } else if (currentStreak.lastDate !== todayStr) {
      const lastDateObj = new Date(currentStreak.lastDate);
      const diffTime = Math.abs(new Date(todayStr).getTime() - lastDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let newCount = 1;
      if (diffDays === 1) {
        newCount = currentStreak.count + 1;
      }
      const newStreak = { count: newCount, lastDate: todayStr };
      localStorage.setItem("studymind_streak", JSON.stringify(newStreak));
    }
  }, [activeSessionId]);

  // Track active study seconds dynamically (lag-free, updates localStorage only)
  useEffect(() => {
    if (!activeSessionId) return;

    const interval = setInterval(() => {
      const storedTime = localStorage.getItem("studymind_total_study_time");
      const currentSeconds = storedTime ? parseInt(storedTime) || 0 : 0;
      localStorage.setItem("studymind_total_study_time", (currentSeconds + 1).toString());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSessionId]);

  // Save sessions to localStorage whenever they change
  const saveSessionsToStorage = (updatedSessions: SavedSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem("studymind_sessions", JSON.stringify(updatedSessions));
  };

  const getActiveSession = (): SavedSession | undefined => {
    return sessions.find((s) => s.id === activeSessionId);
  };

  const handleLanguageChange = (lang: AppLanguage) => {
    setCurrentLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  // Handle parallel multi-image upload & merged session creation
  const handleOcrUploadSuccess = (mergedResult: OcrResult, base64Images: string[]) => {
    // Create new Study Session
    const newSession: SavedSession = {
      id: `session_${Date.now()}`,
      title: mergedResult.title || (currentLanguage === "ar" ? "مستند دراسي جديد" : "New Study Document"),
      timestamp: new Date().toISOString(),
      language: mergedResult.detectedLanguage || currentLanguage,
      ocrResult: mergedResult,
      quiz: null,
      chatHistory: [],
      imageSrc: base64Images[0], // Save the first page thumbnail as cover preview
    };

    // Auto-switch locale if the book is primarily in a different language
    if (mergedResult.detectedLanguage && mergedResult.detectedLanguage !== currentLanguage) {
      handleLanguageChange(mergedResult.detectedLanguage);
    }

    const updated = [newSession, ...sessions];
    saveSessionsToStorage(updated);
    setActiveSessionId(newSession.id);
    setActiveTab("study");
  };

  // Save generated quiz to active session
  const handleSaveQuiz = (generatedQuiz: Quiz) => {
    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, quiz: generatedQuiz };
      }
      return s;
    });
    saveSessionsToStorage(updated);
  };

  // Save completed quiz score to active session
  const handleSaveQuizResult = (score: number, totalQuestions: number) => {
    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { 
          ...s, 
          quizScore: score, 
          quizTotalQuestions: totalQuestions, 
          quizCompleted: true 
        };
      }
      return s;
    });
    saveSessionsToStorage(updated);
  };

  // Save generated revision pack to active session
  const handleSaveRevision = (generatedRevision: RevisionPack) => {
    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, revision: generatedRevision };
      }
      return s;
    });
    saveSessionsToStorage(updated);
  };

  // Chat message submission
  const handleSendMessage = async (text: string) => {
    const activeSession = getActiveSession();
    if (!activeSession) return;

    // Append user message immediately
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newChatHistory = [...activeSession.chatHistory, userMsg];

    // Update state synchronously for snappier feedback
    const updatedSessionsWithUserMsg = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, chatHistory: newChatHistory };
      }
      return s;
    });
    setSessions(updatedSessionsWithUserMsg);

    setIsThinking(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contextText: activeSession.ocrResult.extractedText,
          messages: newChatHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language: currentLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat assistant response failed");
      }

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "model",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      const finalHistory = [...newChatHistory, botMsg];

      const updatedSessionsWithBotMsg = sessions.map((s) => {
        if (s.id === activeSessionId) {
          return { ...s, chatHistory: finalHistory };
        }
        return s;
      });
      saveSessionsToStorage(updatedSessionsWithBotMsg);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: "model",
        content: `⚠️ ${t.errorChatFailed || t.errorGeneral}`,
        timestamp: new Date().toISOString(),
      };
      const finalHistory = [...newChatHistory, errorMsg];
      const updatedSessionsWithBotMsg = sessions.map((s) => {
        if (s.id === activeSessionId) {
          return { ...s, chatHistory: finalHistory };
        }
        return s;
      });
      saveSessionsToStorage(updatedSessionsWithBotMsg);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const selected = sessions.find((s) => s.id === id);
    if (selected) {
      handleLanguageChange(selected.language);
    }
    setActiveTab("study");
    setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    saveSessionsToStorage([]);
    setActiveSessionId(null);
    setIsHistoryOpen(false);
  };

  const activeSession = getActiveSession();

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12 font-sans transition-all duration-150">
      {/* Universal Sticky Header */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onNewSession={() => {
          setActiveSessionId(null);
          setActiveTab("study");
        }}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        onToggleStats={() => {
          setActiveTab((prev) => (prev === "stats" ? "study" : "stats"));
        }}
        isStatsActive={activeTab === "stats"}
        hasActiveSession={!!activeSession}
        historyCount={sessions.length}
      />

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <AnimatePresence mode="wait">
          {!activeSession ? (
            activeTab === "stats" ? (
              <motion.div
                key="global-stats"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                {/* Header title for Statistics page */}
                <div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${isRtl ? "md:flex-row-reverse" : ""}`}>
                  <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                      <BarChart3 className="h-5.5 w-5.5" />
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h2 className="font-sans text-lg font-bold text-gray-900">
                        {isRtl ? "لوحة الإحصائيات الشاملة" : "Your Performance Analytics"}
                      </h2>
                      <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase mt-0.5">
                        {isRtl ? "تتبع مستوى تقدمك الأكاديمي للثانوية العامة" : "Monitor your academic achievements & active streak"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("study")}
                    className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition-colors"
                  >
                    {isRtl ? "العودة للرئيسية" : "Back to Dashboard"}
                  </button>
                </div>
                
                <StatisticsPanel currentLanguage={currentLanguage} sessions={sessions} />
              </motion.div>
            ) : (
              /* ========================================= */
              /* 1. INITIAL LANDING & UPLOADER SCREEN     */
              /* ========================================= */
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-8 text-center"
              >
              {/* Title Greeting Section */}
              <div className="mx-auto max-w-2xl py-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 mb-4 shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  <span>{t.tagline}</span>
                </div>
                <h2 className="font-sans text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl leading-tight">
                  {t.welcomeBack}
                </h2>
                <p className="mt-4 font-sans text-base leading-relaxed text-gray-500">
                  {t.welcomeSubtitle}
                </p>
              </div>

              {/* Central Interactive Book Uploader */}
              <div className="mx-auto w-full max-w-3xl">
                <OcrUploader
                  currentLanguage={currentLanguage}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  onUploadSuccess={handleOcrUploadSuccess}
                  setLowConfidenceError={setLowConfidenceError}
                />
              </div>

              {/* Low Confidence warning card */}
              {lowConfidenceError && (
                <div className="mx-auto w-full max-w-3xl rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-left animate-slide-up">
                  <div className={`flex flex-col sm:flex-row gap-4 items-start ${isRtl ? "sm:flex-row-reverse text-right" : "text-left"}`}>
                    {lowConfidenceError.image && (
                      <img
                        src={lowConfidenceError.image}
                        alt="Low Confidence Preview"
                        className="w-20 h-28 object-cover rounded-xl border border-amber-200/50 shadow-sm shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-sans text-base font-bold text-amber-900 mb-1">
                        ⚠️ {isRtl ? "تنبيه: دقة قراءة ضعيفة للمعادلات أو النصوص" : "Warning: Low quality or low confidence scan"}
                      </h4>
                      <p className="font-sans text-sm text-amber-800 leading-relaxed">
                        {lowConfidenceError.reason}
                      </p>
                      <button
                        onClick={() => setLowConfidenceError(null)}
                        className="mt-3 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-1.5 text-xs font-bold text-white transition-colors shadow-sm"
                      >
                        {isRtl ? "فهمت، سأعيد التصوير بوضوح أكثر" : "Understood, I will recapture"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Historic sessions grid quick shortcuts */}
              {!isProcessing && sessions.length > 0 && (
                <div className="mt-6 mx-auto w-full max-w-3xl text-left">
                  <h3 className={`font-sans text-base font-bold text-gray-800 mb-4 ${isRtl ? "text-right" : "text-left"}`}>
                    {isRtl ? "استئناف دراسة سابقة" : "Resume studying"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sessions.slice(0, 4).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s.id)}
                        className={`group relative flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-indigo-100 hover:shadow-sm ${
                          isRtl ? "flex-row-reverse text-right" : "text-left"
                        }`}
                      >
                        <div className="flex flex-col gap-1 truncate max-w-[80%]">
                          <span className="font-sans font-bold text-sm text-gray-900 group-hover:text-indigo-600 truncate">
                            {s.title}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                            {s.ocrResult.keyConcepts.length} {isRtl ? "مصطلحات" : "terms"}
                          </span>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0">
                          <ArrowRight className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
            )
          ) : (
            /* ========================================= */
            /* 2. DYNAMIC ACTIVE STUDY SESSION PANEL    */
            /* ========================================= */
            <motion.div
              key="active-session"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              {/* Textbook Session Title Card */}
              <div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${
                isRtl ? "md:flex-row-reverse" : ""
              }`}>
                <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <Sparkles className="h-5.5 w-5.5" />
                  </div>
                  <div className="truncate">
                    <h2 className="font-sans text-lg font-bold text-gray-900 truncate">
                      {activeSession.title}
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase mt-0.5">
                      {isRtl ? "جلسة نشطة" : "Active study session"}
                    </p>
                  </div>
                </div>

                {/* Sub Tab Headers inside Active Session */}
                <div className="relative w-full md:w-auto overflow-hidden rounded-xl">
                  {/* Left Fade Indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-200/90 via-gray-100/40 to-transparent pointer-events-none z-10 rounded-l-xl transition-opacity duration-300 ${
                    showLeftFade ? "opacity-100" : "opacity-0"
                  }`} />

                  {/* Right Fade Indicator */}
                  <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-200/90 via-gray-100/40 to-transparent pointer-events-none z-10 rounded-r-xl transition-opacity duration-300 ${
                    showRightFade ? "opacity-100" : "opacity-0"
                  }`} />

                  <div
                    ref={tabsRef}
                    className={`w-full overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory flex flex-nowrap gap-1.5 bg-gray-100/60 p-1.5 rounded-xl ${
                      isRtl ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <button
                      id="tab-btn-study"
                      onClick={() => setActiveTab("study")}
                      className={`snap-start shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "study"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      } ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span>{t.tabStudy}</span>
                    </button>

                    <button
                      id="tab-btn-quiz"
                      onClick={() => setActiveTab("quiz")}
                      className={`snap-start shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "quiz"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      } ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                      <BookOpenCheck className="h-4 w-4 shrink-0" />
                      <span>{t.tabQuiz}</span>
                    </button>

                    <button
                      id="tab-btn-chat"
                      onClick={() => setActiveTab("chat")}
                      className={`snap-start shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "chat"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      } ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span>{t.tabChat}</span>
                    </button>

                    <button
                      id="tab-btn-revision"
                      onClick={() => setActiveTab("revision")}
                      className={`snap-start shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "revision"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      } ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                      <Zap className="h-4 w-4 shrink-0" />
                      <span>{t.tabRevision}</span>
                    </button>

                    <button
                      id="tab-btn-stats"
                      onClick={() => setActiveTab("stats")}
                      className={`snap-start shrink-0 whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeTab === "stats"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      } ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                      <BarChart3 className="h-4 w-4 shrink-0" />
                      <span>{t.tabStats}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Tab Render Body */}
              <div className="w-full">
                {activeTab === "study" && (
                  <StudyPanel
                    currentLanguage={currentLanguage}
                    ocrResult={activeSession.ocrResult}
                    imageSrc={activeSession.imageSrc}
                  />
                )}

                {activeTab === "quiz" && (
                  <QuizPanel
                    currentLanguage={currentLanguage}
                    studyText={activeSession.ocrResult.extractedText}
                    savedQuiz={activeSession.quiz}
                    onSaveQuiz={handleSaveQuiz}
                    onSaveQuizResult={handleSaveQuizResult}
                    subject={activeSession.ocrResult.subject}
                    lessonTitle={activeSession.title}
                  />
                )}

                {activeTab === "chat" && (
                  <ChatPanel
                    currentLanguage={currentLanguage}
                    chatHistory={activeSession.chatHistory}
                    isThinking={isThinking}
                    onSendMessage={handleSendMessage}
                  />
                )}

                {activeTab === "revision" && (
                  <RevisionPanel
                    currentLanguage={currentLanguage}
                    studyText={activeSession.ocrResult.extractedText}
                    savedRevision={activeSession.revision}
                    onSaveRevision={handleSaveRevision}
                  />
                )}

                {activeTab === "stats" && (
                  <StatisticsPanel
                    currentLanguage={currentLanguage}
                    sessions={sessions}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Slide-out History Sidebar Drawer Overlay */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 z-40 bg-gray-900"
            />
            <RecentSessions
              currentLanguage={currentLanguage}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onClearHistory={handleClearHistory}
              onClose={() => setIsHistoryOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
