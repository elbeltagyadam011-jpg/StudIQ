import React, { useState, useMemo, useEffect } from "react";
import { AppLanguage, Quiz, QuizQuestion } from "../types";
import { translations } from "../translations";
import { 
  Award, CheckCircle, HelpCircle, Loader2, Play, RefreshCw, XCircle, ArrowRight, Eye,
  Calculator, Atom, Zap, Dna, PenTool, Languages, Sparkles, BookOpen, Info,
  Clock, Target, TrendingUp, AlertTriangle, CheckCircle2, ThumbsUp, ChevronRight,
  Trash2, Search, Layers, BookOpenCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";

interface BankQuestion extends QuizQuestion {
  lessonTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  subject: string;
  timestamp: string;
}

interface QuizPanelProps {
  currentLanguage: AppLanguage;
  studyText: string;
  savedQuiz: Quiz | null;
  onSaveQuiz: (quiz: Quiz) => void;
  onSaveQuizResult?: (score: number, totalQuestions: number) => void;
  subject?: "Mathematics" | "Chemistry" | "Physics" | "Biology" | "Arabic" | "English";
  lessonTitle?: string;
}

// Fallback client-side subject detection in case backend session value is legacy or missing
export function fallbackDetectSubject(text: string): "Mathematics" | "Chemistry" | "Physics" | "Biology" | "Arabic" | "English" {
  const lowercaseText = (text || "").toLowerCase();
  
  // Arabic markers (Nahu, Belaqah, etc.)
  const arabicKeywords = ["اللغة العربية", "النحو", "البلاغة", "اعراب", "الفاعل", "المفعول", "قصيدة", "أبيات", "البيت", "الشاعر", "النصوص", "الأدب", "مبتدأ", "خبر", "مجرور", "منصوب", "مرفوع", "كان وأخواتها", "إن وأخواتها"];
  if (arabicKeywords.some(keyword => lowercaseText.includes(keyword))) {
    return "Arabic";
  }

  // Chemistry markers
  const chemistryKeywords = ["chemistry", "chemical", "reaction", "molecule", "atom", "periodic table", "valence", "covalent", "ionic", "acid", "base", "solution", "تفاعل", "كيمياء", "ذرة", "حمض", "قلوي", "عنصر", "مركب", "معادلة كيميائية", "روابط", "جدول دوري"];
  if (chemistryKeywords.some(keyword => lowercaseText.includes(keyword))) {
    return "Chemistry";
  }

  // Mathematics markers
  const mathKeywords = ["mathematics", "math", "calculus", "algebra", "geometry", "derivative", "integral", "equation", "matrix", "vectors", "theorem", "رياضيات", "تكامل", "تفاضل", "مصفوفة", "معادلة", "هندسة", "جبر", "تفاضل وتكامل", "زاوية", "دالة", "متجهات"];
  if (mathKeywords.some(keyword => lowercaseText.includes(keyword))) {
    return "Mathematics";
  }

  // Physics markers
  const physicsKeywords = ["physics", "velocity", "acceleration", "force", "gravity", "energy", "quantum", "thermodynamics", "circuit", "ohm", "volt", "ampere", "magnetic", "فيزياء", "قوة", "جاذبية", "طاقة", "سرعة", "مقاومة", "نيوتن", "تسارع", "كهرباء", "حركة", "طيف"];
  if (physicsKeywords.some(keyword => lowercaseText.includes(keyword))) {
    return "Physics";
  }

  // Biology markers
  const biologyKeywords = ["biology", "cell", "dna", "rna", "organism", "evolution", "photosynthesis", "mitosis", "gene", "chromosome", "respiration", "بيولوجيا", "أحياء", "خلية", "وراثة", "جين", "انقسام", "خلية حية", "نبات", "حيوان", "أعضاء", "هرمون", "إنزيم"];
  if (biologyKeywords.some(keyword => lowercaseText.includes(keyword))) {
    return "Biology";
  }

  // English markers
  const englishKeywords = ["english", "grammar", "verb", "noun", "adjective", "pronoun", "sentence", "preposition", "tense", "vocabulary", "translation", "shakespeare", "poetry", "literature", "comprehension", "adverb", "conjunction"];
  if (englishKeywords.some(keyword => lowercaseText.includes(keyword))) {
    return "English";
  }

  // Default alphabetic heuristics
  const arabicCharRegex = /[\u0600-\u06FF]/;
  if (arabicCharRegex.test(text)) {
    return "Arabic";
  }
  
  return "English";
}

export default function QuizPanel({
  currentLanguage,
  studyText,
  savedQuiz,
  onSaveQuiz,
  onSaveQuizResult,
  subject: propSubject,
  lessonTitle,
}: QuizPanelProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";

  // Determine the subject using property or fallback algorithm
  const detectedSubject = useMemo(() => {
    if (propSubject) return propSubject;
    return fallbackDetectSubject(studyText);
  }, [propSubject, studyText]);

  // Subject Theme specifications mapping
  const theme = useMemo(() => {
    switch (detectedSubject) {
      case "Mathematics":
        return {
          name: "Mathematics",
          arabicName: "الرياضيات",
          icon: <Calculator className="h-5 w-5 text-teal-600" />,
          accentColor: "teal",
          primaryText: "text-teal-900",
          accentBg: "bg-teal-50",
          lightBg: "bg-teal-50/40",
          accentText: "text-teal-700",
          accentBorder: "border-teal-200",
          accentRing: "focus:ring-teal-500",
          buttonBg: "bg-teal-600 hover:bg-teal-700",
          buttonText: "text-white",
          activeOptionBg: "bg-teal-50 border-teal-500 text-teal-800",
          accentBadge: "bg-teal-100 text-teal-800",
          progressBg: "bg-teal-600",
          ringStroke: "stroke-teal-600",
          accentShadow: "shadow-teal-100",
          bgStyle: {
            backgroundImage: "linear-gradient(to right, #0d94880a 1px, transparent 1px), linear-gradient(to bottom, #0d94880a 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }
        };
      case "Chemistry":
        return {
          name: "Chemistry",
          arabicName: "الكيمياء",
          icon: <Atom className="h-5 w-5 text-emerald-600" />,
          accentColor: "emerald",
          primaryText: "text-emerald-900",
          accentBg: "bg-emerald-50",
          lightBg: "bg-emerald-50/40",
          accentText: "text-emerald-700",
          accentBorder: "border-emerald-200",
          accentRing: "focus:ring-emerald-500",
          buttonBg: "bg-emerald-600 hover:bg-emerald-700",
          buttonText: "text-white",
          activeOptionBg: "bg-emerald-50 border-emerald-500 text-emerald-800",
          accentBadge: "bg-emerald-100 text-emerald-800",
          progressBg: "bg-emerald-600",
          ringStroke: "stroke-emerald-600",
          accentShadow: "shadow-emerald-100",
          bgStyle: {
            backgroundImage: "radial-gradient(#0596690f 2px, transparent 2px)",
            backgroundSize: "24px 24px"
          }
        };
      case "Physics":
        return {
          name: "Physics",
          arabicName: "الفيزياء",
          icon: <Zap className="h-5 w-5 text-violet-600" />,
          accentColor: "violet",
          primaryText: "text-violet-900",
          accentBg: "bg-violet-50",
          lightBg: "bg-violet-50/40",
          accentText: "text-violet-700",
          accentBorder: "border-violet-200",
          accentRing: "focus:ring-violet-500",
          buttonBg: "bg-violet-600 hover:bg-violet-700",
          buttonText: "text-white",
          activeOptionBg: "bg-violet-50 border-violet-500 text-violet-800",
          accentBadge: "bg-violet-100 text-violet-800",
          progressBg: "bg-violet-600",
          ringStroke: "stroke-violet-600",
          accentShadow: "shadow-violet-100",
          bgStyle: {
            backgroundImage: "linear-gradient(45deg, #7c3aed06 25%, transparent 25%), linear-gradient(-45deg, #7c3aed06 25%, transparent 25%)",
            backgroundSize: "30px 30px"
          }
        };
      case "Biology":
        return {
          name: "Biology",
          arabicName: "الأحياء",
          icon: <Dna className="h-5 w-5 text-green-600" />,
          accentColor: "green",
          primaryText: "text-green-900",
          accentBg: "bg-green-50",
          lightBg: "bg-green-50/40",
          accentText: "text-green-700",
          accentBorder: "border-green-200",
          accentRing: "focus:ring-green-500",
          buttonBg: "bg-green-600 hover:bg-green-700",
          buttonText: "text-white",
          activeOptionBg: "bg-green-50 border-green-500 text-green-800",
          accentBadge: "bg-green-100 text-green-800",
          progressBg: "bg-green-600",
          ringStroke: "stroke-green-600",
          accentShadow: "shadow-green-100",
          bgStyle: {
            backgroundImage: "radial-gradient(circle, #16a34a0a 10%, transparent 11%)",
            backgroundSize: "40px 40px"
          }
        };
      case "Arabic":
        return {
          name: "Arabic",
          arabicName: "اللغة العربية",
          icon: <PenTool className="h-5 w-5 text-amber-600" />,
          accentColor: "amber",
          primaryText: "text-amber-900",
          accentBg: "bg-amber-50",
          lightBg: "bg-amber-50/40",
          accentText: "text-amber-700",
          accentBorder: "border-amber-200",
          accentRing: "focus:ring-amber-500",
          buttonBg: "bg-amber-600 hover:bg-amber-700",
          buttonText: "text-white",
          activeOptionBg: "bg-amber-50 border-amber-500 text-amber-800",
          accentBadge: "bg-amber-100 text-amber-800",
          progressBg: "bg-amber-600",
          ringStroke: "stroke-amber-600",
          accentShadow: "shadow-amber-100",
          bgStyle: {
            backgroundImage: "linear-gradient(135deg, #d9770607 25%, transparent 25%), linear-gradient(225deg, #d9770607 25%, transparent 25%)",
            backgroundSize: "20px 20px"
          }
        };
      case "English":
      default:
        return {
          name: "English",
          arabicName: "اللغة الإنجليزية",
          icon: <Languages className="h-5 w-5 text-blue-600" />,
          accentColor: "blue",
          primaryText: "text-blue-900",
          accentBg: "bg-blue-50",
          lightBg: "bg-blue-50/40",
          accentText: "text-blue-700",
          accentBorder: "border-blue-200",
          accentRing: "focus:ring-blue-500",
          buttonBg: "bg-blue-600 hover:bg-blue-700",
          buttonText: "text-white",
          activeOptionBg: "bg-blue-50 border-blue-500 text-blue-800",
          accentBadge: "bg-blue-100 text-blue-800",
          progressBg: "bg-blue-600",
          ringStroke: "stroke-blue-600",
          accentShadow: "shadow-blue-100",
          bgStyle: {
            backgroundImage: "linear-gradient(transparent 95%, #2563eb07 95%)",
            backgroundSize: "100% 28px"
          }
        };
    }
  }, [detectedSubject]);

  // Config States
  const [questionCount, setQuestionCount] = useState(5);
  const [quizType, setQuizType] = useState<"multiple-choice" | "true-false" | "mixed">("mixed");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [configSubTab, setConfigSubTab] = useState<"ai" | "bank">("ai");
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Quiz States
  const [quiz, setQuiz] = useState<Quiz | null>(savedQuiz);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]); // indexes of user selections

  // Summary States
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time tracking states
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Question Bank States
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [selectedLessonFilter, setSelectedLessonFilter] = useState<string>("all");
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  
  // Custom Exam Generator States
  const [customExamCount, setCustomExamCount] = useState<number>(5);
  const [customExamTitle, setCustomExamTitle] = useState<string>("");

  // Sync Question Bank from LocalStorage
  useEffect(() => {
    const bankStr = localStorage.getItem("studymind_question_bank");
    if (bankStr) {
      try {
        setBankQuestions(JSON.parse(bankStr));
      } catch (e) {
        console.error("Failed to load question bank:", e);
      }
    }
  }, [quiz]);

  const handleDeleteQuestion = (id: string) => {
    const updated = bankQuestions.filter(q => q.id !== id);
    setBankQuestions(updated);
    localStorage.setItem("studymind_question_bank", JSON.stringify(updated));
  };

  const uniqueLessons = useMemo(() => {
    const lessons = new Set<string>();
    bankQuestions.forEach(q => {
      if (q.subject === detectedSubject && q.lessonTitle) {
        lessons.add(q.lessonTitle);
      }
    });
    return Array.from(lessons);
  }, [bankQuestions, detectedSubject]);

  const filteredQuestions = useMemo(() => {
    return bankQuestions.filter((q) => {
      if (q.subject !== detectedSubject) return false;
      if (selectedLessonFilter !== "all" && q.lessonTitle !== selectedLessonFilter) return false;
      if (selectedDifficultyFilter !== "all" && q.difficulty !== selectedDifficultyFilter) return false;
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesText = q.questionText.toLowerCase().includes(query);
        const matchesExplanation = q.explanation?.toLowerCase().includes(query) || false;
        if (!matchesText && !matchesExplanation) return false;
      }
      return true;
    });
  }, [bankQuestions, selectedLessonFilter, selectedDifficultyFilter, searchQuery, detectedSubject]);

  // Adjust custom exam count slider/input max boundary on filters change
  useEffect(() => {
    if (filteredQuestions.length > 0) {
      setCustomExamCount((prev) => Math.min(prev, filteredQuestions.length));
    }
  }, [filteredQuestions]);

  const handleStartCustomExam = () => {
    if (filteredQuestions.length === 0) return;
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const countToTake = Math.min(customExamCount, shuffled.length);
    const selected = shuffled.slice(0, countToTake);
    
    const quizTitle = customExamTitle.trim() 
      ? customExamTitle.trim() 
      : (isRtl 
          ? `امتحان مخصص - ${selectedLessonFilter === "all" ? t.allLessons : selectedLessonFilter}` 
          : `Custom Exam - ${selectedLessonFilter === "all" ? t.allLessons : selectedLessonFilter}`);
          
    const customQuiz: Quiz = {
      quizTitle,
      questions: selected.map((q, idx) => ({
        id: q.id || `q_${idx}`,
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation,
        topic: q.topic,
        optionsExplanations: q.optionsExplanations,
        textbookParagraph: q.textbookParagraph,
        suggestedReview: q.suggestedReview
      }))
    };
    
    setQuiz(customQuiz);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setHasSubmittedAnswer(false);
    setUserAnswers([]);
    setShowResults(false);
    setReviewMode(false);
    setStartTime(Date.now());
    setTimeSpent(0);
  };

  // Auto-start timer when quiz starts
  useEffect(() => {
    if (quiz && !showResults && !startTime) {
      setStartTime(Date.now());
    }
  }, [quiz, showResults]);

  // Trigger Quiz API
  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const bankStr = localStorage.getItem("studymind_question_bank");
      let excludeQuestions: string[] = [];
      if (bankStr) {
        try {
          const bank: BankQuestion[] = JSON.parse(bankStr);
          excludeQuestions = bank
            .filter((q) => q.subject === detectedSubject)
            .map((q) => q.questionText);
        } catch (e) {
          console.error("Failed to parse question bank for exclusion:", e);
        }
      }

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: studyText,
          count: questionCount,
          language: currentLanguage,
          type: quizType,
          subject: detectedSubject,
          difficulty: difficulty,
          excludeQuestions: excludeQuestions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const generatedQuiz: Quiz = await response.json();
      setQuiz(generatedQuiz);
      onSaveQuiz(generatedQuiz);

      // Save every generated question to the Question Bank!
      if (generatedQuiz && generatedQuiz.questions && generatedQuiz.questions.length > 0) {
        const bankQuestions: BankQuestion[] = generatedQuiz.questions.map((q) => ({
          ...q,
          id: q.id || `bq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          lessonTitle: lessonTitle || detectedSubject || "General",
          difficulty: difficulty,
          subject: detectedSubject,
          timestamp: new Date().toISOString()
        }));

        const existingBankStr = localStorage.getItem("studymind_question_bank");
        let currentBank: BankQuestion[] = [];
        if (existingBankStr) {
          try {
            currentBank = JSON.parse(existingBankStr);
          } catch (e) {
            console.error(e);
          }
        }

        const existingTexts = new Set(currentBank.map(bq => bq.questionText.trim().toLowerCase()));
        const uniqueNewQuestions = bankQuestions.filter(bq => !existingTexts.has(bq.questionText.trim().toLowerCase()));

        if (uniqueNewQuestions.length > 0) {
          const updatedBank = [...currentBank, ...uniqueNewQuestions];
          localStorage.setItem("studymind_question_bank", JSON.stringify(updatedBank));
        }
      }

      setCurrentQuestionIndex(0);
      setSelectedOptionIndex(null);
      setHasSubmittedAnswer(false);
      setUserAnswers([]);
      setShowResults(false);
      setReviewMode(false);
      setStartTime(Date.now());
      setTimeSpent(0);
    } catch (err) {
      console.error(err);
      setError(t.errorGeneral);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (hasSubmittedAnswer) return;
    setSelectedOptionIndex(idx);
    setHasSubmittedAnswer(true);

    const isCorrect = idx === quiz?.questions[currentQuestionIndex].correctAnswerIndex;
    setUserAnswers((prev) => [...prev, idx]);

    // If correct, play a small light confetti splash matching the active subject's palette
    if (isCorrect) {
      let colors = ["#6366f1", "#10b981", "#34d399"];
      if (detectedSubject === "Mathematics") colors = ["#0d9488", "#14b8a6", "#2dd4bf"];
      if (detectedSubject === "Chemistry") colors = ["#059669", "#10b981", "#34d399"];
      if (detectedSubject === "Physics") colors = ["#7c3aed", "#8b5cf6", "#a78bfa"];
      if (detectedSubject === "Biology") colors = ["#16a34a", "#22c55e", "#4ade80"];
      if (detectedSubject === "Arabic") colors = ["#d97706", "#f59e0b", "#fbbf24"];
      if (detectedSubject === "English") colors = ["#2563eb", "#3b82f6", "#60a5fa"];

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors,
      });
    }
  };

  const handleNextQuestion = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setHasSubmittedAnswer(false);
    } else {
      // Quiz complete!
      setShowResults(true);
      const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 15;
      setTimeSpent(elapsed);

      // Evaluate score and fire a major confetti burst if perfect score
      const score = calculateScore();
      if (onSaveQuizResult) {
        onSaveQuizResult(score, quiz.questions.length);
      }
      if (score === quiz.questions.length) {
        const duration = 2 * 1000;
        const end = Date.now() + duration;

        let colors = ["#6366f1", "#10b981", "#34d399"];
        if (detectedSubject === "Mathematics") colors = ["#0d9488", "#14b8a6", "#2dd4bf"];
        if (detectedSubject === "Chemistry") colors = ["#059669", "#10b981", "#34d399"];
        if (detectedSubject === "Physics") colors = ["#7c3aed", "#8b5cf6", "#a78bfa"];
        if (detectedSubject === "Biology") colors = ["#16a34a", "#22c55e", "#4ade80"];
        if (detectedSubject === "Arabic") colors = ["#d97706", "#f59e0b", "#fbbf24"];
        if (detectedSubject === "English") colors = ["#2563eb", "#3b82f6", "#60a5fa"];

        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      }
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    return quiz.questions.reduce((score, q, idx) => {
      return score + (userAnswers[idx] === q.correctAnswerIndex ? 1 : 0);
    }, 0);
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setHasSubmittedAnswer(false);
    setUserAnswers([]);
    setShowResults(false);
    setReviewMode(false);
    setStartTime(Date.now());
    setTimeSpent(0);
  };

  const handleResetQuizConfig = () => {
    setQuiz(null);
    setShowResults(false);
    setReviewMode(false);
  };

  const score = calculateScore();
  const totalQuestions = quiz?.questions.length || 0;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getScoreGreeting = () => {
    if (percentage === 100) return t.scoreGreetingPerfect;
    if (percentage >= 80) return t.scoreGreetingGood;
    if (percentage >= 50) return t.scoreGreetingPass;
    return t.scoreGreetingRetry;
  };

  const getScoreColor = () => {
    if (percentage >= 80) {
      if (detectedSubject === "Mathematics") return "text-teal-700 border-teal-200 bg-teal-50/50";
      if (detectedSubject === "Chemistry") return "text-emerald-700 border-emerald-200 bg-emerald-50/50";
      if (detectedSubject === "Physics") return "text-violet-700 border-violet-200 bg-violet-50/50";
      if (detectedSubject === "Biology") return "text-green-700 border-green-200 bg-green-50/50";
      if (detectedSubject === "Arabic") return "text-amber-700 border-amber-200 bg-amber-50/50";
      return "text-blue-700 border-blue-200 bg-blue-50/50";
    }
    if (percentage >= 50) {
      return "text-indigo-600 border-indigo-200 bg-indigo-50/40";
    }
    return "text-red-600 border-red-200 bg-red-50/40";
  };

  const gradeInfo = useMemo(() => {
    const pct = percentage;
    if (pct >= 85) {
      return { 
        name: isRtl ? "امتياز" : "Excellent", 
        desc: isRtl ? "ممتاز! لقد أظهرت تمكناً استثنائياً وفهماً عميقاً للمادة." : "Masterful! You have demonstrated exceptional command of this topic.", 
        color: "text-emerald-700 bg-emerald-50 border-emerald-200", 
        badgeColor: "bg-emerald-100 text-emerald-800",
        rating: 5
      };
    }
    if (pct >= 75) {
      return { 
        name: isRtl ? "جيد جداً" : "Very Good", 
        desc: isRtl ? "جيد جداً! بعض الأخطاء البسيطة، لكن لديك أساس قوي ممتاز." : "Great job! A few minor gaps, but you have a strong foundation.", 
        color: "text-blue-700 bg-blue-50 border-blue-200", 
        badgeColor: "bg-blue-100 text-blue-800",
        rating: 4
      };
    }
    if (pct >= 65) {
      return { 
        name: isRtl ? "جيد" : "Good", 
        desc: isRtl ? "جيد! مجهود رائع، مراجعة التفسيرات ستدفعك نحو الامتياز." : "Solid effort! Reviewing the explanations will push you to excellence.", 
        color: "text-indigo-700 bg-indigo-50 border-indigo-200", 
        badgeColor: "bg-indigo-100 text-indigo-800",
        rating: 3
      };
    }
    if (pct >= 50) {
      return { 
        name: isRtl ? "مقبول" : "Fair", 
        desc: isRtl ? "مقبول! لقد نجحت، لكن بعض المفاهيم الأساسية تحتاج إلى مراجعة وتثبيت." : "Passed! Some core concepts need review to build confidence.", 
        color: "text-amber-700 bg-amber-50 border-amber-200", 
        badgeColor: "bg-amber-100 text-amber-800",
        rating: 2
      };
    }
    return { 
      name: isRtl ? "ضعيف" : "Weak", 
      desc: isRtl ? "ضعيف! استمر في المحاولة، راجع التفسيرات بعناية وأعد المحاولة للتحسين." : "Keep practicing! Analyze your mistakes and try again to improve.", 
      color: "text-rose-700 bg-rose-50 border-rose-200", 
      badgeColor: "bg-rose-100 text-rose-800",
      rating: 1
    };
  }, [percentage, isRtl]);

  const formatTimeSpent = (secs: number) => {
    const s = secs || 15; // default fallback
    if (s < 60) {
      return isRtl ? `${s} ثانية` : `${s} seconds`;
    }
    const mins = Math.floor(s / 60);
    const remainingSecs = s % 60;
    if (remainingSecs === 0) {
      return isRtl ? `${mins} دقيقة` : `${mins} min`;
    }
    return isRtl ? `${mins} دقيقة و ${remainingSecs} ثانية` : `${mins}m ${remainingSecs}s`;
  };

  const topicStats = useMemo(() => {
    if (!quiz) return { strong: [], weak: [], rawStats: {} };
    const stats: Record<string, { total: number; correct: number }> = {};
    
    quiz.questions.forEach((q, idx) => {
      let topic = q.topic;
      if (!topic) {
        // Fallback heuristics
        const text = q.questionText.toLowerCase();
        if (text.includes("equation") || text.includes("math") || text.includes("calculus") || text.includes("معادلة") || text.includes("تفاضل") || text.includes("جبر")) {
          topic = isRtl ? "العمليات الحسابية" : "Algebra & Operations";
        } else if (text.includes("cell") || text.includes("dna") || text.includes("rna") || text.includes("خلية") || text.includes("وراثة") || text.includes("جين")) {
          topic = isRtl ? "البيولوجيا الخلوية" : "Cellular Biology";
        } else if (text.includes("force") || text.includes("gravity") || text.includes("سرعة") || text.includes("فيزياء") || text.includes("قوة")) {
          topic = isRtl ? "الميكانيكا والقوى" : "Mechanics & Forces";
        } else if (text.includes("reaction") || text.includes("molecule") || text.includes("تفاعل") || text.includes("كيمياء") || text.includes("مركب")) {
          topic = isRtl ? "التفاعلات والمركبات" : "Chemical Reactions";
        } else if (text.includes("اعراب") || text.includes("النحو") || text.includes("مرفوع") || text.includes("منصوب")) {
          topic = isRtl ? "قواعد النحو العربي" : "Arabic Grammar Rules";
        } else if (isRtl) {
          topic = "الفهم والتحليل";
        } else {
          topic = "Reading Comprehension";
        }
      }
      
      topic = topic.trim();
      if (!stats[topic]) {
        stats[topic] = { total: 0, correct: 0 };
      }
      stats[topic].total += 1;
      
      const userAns = userAnswers[idx];
      const isCorrect = userAns === q.correctAnswerIndex;
      if (isCorrect) {
        stats[topic].correct += 1;
      }
    });

    const strong: string[] = [];
    const weak: string[] = [];

    Object.entries(stats).forEach(([topic, data]) => {
      const topicAccuracy = data.correct / data.total;
      if (topicAccuracy >= 0.7) {
        strong.push(topic);
      } else {
        weak.push(topic);
      }
    });

    return { strong, weak, rawStats: stats };
  }, [quiz, userAnswers, isRtl]);

  const pieData = useMemo(() => {
    return [
      { name: isRtl ? "إجابات صحيحة" : "Correct", value: score, color: "#10b981" },
      { name: isRtl ? "إجابات خاطئة" : "Incorrect", value: totalQuestions - score, color: "#ef4444" }
    ].filter(d => d.value > 0);
  }, [score, totalQuestions, isRtl]);

  const renderExplanationDetails = (q: any, userSelection: number | null) => {
    const isCorrect = userSelection === q.correctAnswerIndex;
    
    // If high-fidelity fields are present
    if (q.optionsExplanations && q.textbookParagraph && q.suggestedReview) {
      return (
        <div className="space-y-4 mt-4 animate-fade-in text-left rtl:text-right">
          {/* Case 1: Incorrect Choice */}
          {userSelection !== null && !isCorrect && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/20 p-3.5 space-y-3">
              {/* Why student's answer is wrong */}
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 font-bold text-rose-700 text-xs uppercase tracking-wide">
                  <XCircle className="h-3.5 w-3.5" />
                  {t.evalWrongAnswer}
                </span>
                <p className="text-xs text-gray-700 font-medium pl-5 pr-5 leading-relaxed">
                  {q.optionsExplanations[userSelection] || (isRtl ? "هذه الإجابة غير صحيحة بناءً على المعطيات والدرس." : "This option is incorrect based on the lesson details.")}
                </p>
              </div>

              {/* Why correct answer is correct */}
              <div className="space-y-1 pt-2 border-t border-rose-100/40">
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 text-xs uppercase tracking-wide">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t.evalCorrectAnswer}
                </span>
                <p className="text-xs text-gray-700 font-medium pl-5 pr-5 leading-relaxed">
                  {q.optionsExplanations[q.correctAnswerIndex]}
                </p>
              </div>
            </div>
          )}

          {/* Case 2: Correct Choice */}
          {(userSelection === null || isCorrect) && (
            <div className="rounded-xl border border-emerald-100 bg-green-50/15 p-3.5 space-y-1">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 text-xs uppercase tracking-wide">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t.evalCorrectAnswer}
              </span>
              <p className="text-xs text-gray-700 font-medium pl-5 pr-5 leading-relaxed">
                {q.optionsExplanations[q.correctAnswerIndex]}
              </p>
            </div>
          )}

          {/* Exact textbook paragraph */}
          <div className="rounded-xl border border-indigo-50 bg-white p-3.5 space-y-2 shadow-sm">
            <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 text-xs uppercase tracking-wide">
              <BookOpen className="h-3.5 w-3.5" />
              {t.lessonParagraph}
            </span>
            <blockquote className={`text-xs text-gray-600 font-medium leading-relaxed italic border-gray-200 bg-gray-50/50 p-2.5 rounded-lg ${
              isRtl ? "border-r-4 pr-3 text-right" : "border-l-4 pl-3 text-left"
            }`}>
              "{q.textbookParagraph}"
            </blockquote>
          </div>

          {/* Suggested Review */}
          {userSelection !== null && !isCorrect && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/35 p-3.5 space-y-1.5">
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 text-xs uppercase tracking-wide">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t.suggestedReviewTitle}
              </span>
              <p className="text-xs text-amber-900 font-semibold pl-5 pr-5 leading-relaxed">
                {q.suggestedReview}
              </p>
            </div>
          )}
        </div>
      );
    }

    // Fallback to legacy format
    return (
      <div className="space-y-3 mt-4 text-left rtl:text-right">
        <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100 text-xs text-gray-600 leading-relaxed">
          <span className="font-bold text-gray-800 block mb-1">{t.explanationTitle}</span>
          {q.explanation}
        </div>
      </div>
    );
  };

  return (
    <div className={`mx-auto max-w-6xl w-full ${isRtl ? "text-right" : "text-left"}`}>
      
      {/* 1. QUIZ GENERATING OVERLAY */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className={`relative mb-6 flex h-16 w-16 items-center justify-center rounded-full ${theme.accentBg} ${theme.accentText}`}>
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h3 className="font-sans text-xl font-bold text-gray-900">{t.processingQuiz}</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">{t.processingQuizSubtitle}</p>
        </div>
      )}

      {/* Grid containing Main Quiz Area + Side Study helper */}
      {!isGenerating && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT/MAIN QUIZ PLAYING OR SETUP AREA (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 2. CONFIGURATION MODE (If no quiz active/generated) */}
            {!quiz && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm relative overflow-hidden" style={theme.bgStyle}>
                <div className={`flex items-center justify-between mb-6 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.accentBg}`}>
                      {theme.icon}
                    </div>
                    <div>
                      <h3 className="font-sans text-lg font-bold text-gray-900">
                        {isRtl ? `مراجعة ${theme.arabicName}` : `${theme.name} Practice Exam`}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {isRtl ? "اختبار مخصص لتقييم فهمك ونقاط قوتك." : "Custom challenge engineered for high comprehension study."}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${theme.accentBadge}`}>
                    {isRtl ? theme.arabicName : theme.name}
                  </span>
                </div>

                {/* Sub-tabs Selector: AI Quiz vs saved Question Bank */}
                <div className={`flex items-center gap-1.5 border-b border-gray-100 pb-3.5 mb-6 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <button
                    onClick={() => setConfigSubTab("ai")}
                    className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      configSubTab === "ai"
                        ? `${theme.accentBg} ${theme.accentText} border border-indigo-100 shadow-sm`
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    } ${isRtl ? "flex-row-reverse" : ""}`}
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>{t.generateWithAiTab}</span>
                  </button>

                  <button
                    onClick={() => setConfigSubTab("bank")}
                    className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      configSubTab === "bank"
                        ? `${theme.accentBg} ${theme.accentText} border border-indigo-100 shadow-sm`
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    } ${isRtl ? "flex-row-reverse" : ""}`}
                  >
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>{t.questionBankTab}</span>
                    {bankQuestions.filter(bq => bq.subject === detectedSubject).length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${theme.accentBadge}`}>
                        {bankQuestions.filter(bq => bq.subject === detectedSubject).length}
                      </span>
                    )}
                  </button>
                </div>

                {configSubTab === "ai" ? (
                  <div className="space-y-5">
                    {/* Question count selector */}
                    <div>
                      <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                        {t.numberOfQuestions}
                      </label>
                      <div className={`flex gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        {[3, 5, 10].map((num) => (
                          <button
                            key={num}
                            onClick={() => setQuestionCount(num)}
                            className={`flex-1 rounded-xl py-3 px-4 border text-sm font-semibold transition-all ${
                              questionCount === num
                                ? `${theme.accentBorder} ${theme.accentBg} ${theme.accentText} font-bold`
                                : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quiz Type Selector */}
                    <div>
                      <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                        {t.quizType}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setQuizType("mixed")}
                          className={`rounded-xl py-3 px-4 border text-sm font-semibold transition-all ${
                            quizType === "mixed"
                              ? `${theme.accentBorder} ${theme.accentBg} ${theme.accentText} font-bold`
                              : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                          }`}
                        >
                          {t.mixedType}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizType("multiple-choice")}
                          className={`rounded-xl py-3 px-4 border text-sm font-semibold transition-all ${
                            quizType === "multiple-choice"
                              ? `${theme.accentBorder} ${theme.accentBg} ${theme.accentText} font-bold`
                              : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                          }`}
                        >
                          {t.multipleChoice}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizType("true-false")}
                          className={`rounded-xl py-3 px-4 border text-sm font-semibold transition-all ${
                            quizType === "true-false"
                              ? `${theme.accentBorder} ${theme.accentBg} ${theme.accentText} font-bold`
                              : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                          }`}
                        >
                          {t.trueFalse}
                        </button>
                      </div>
                    </div>

                    {/* Difficulty Selection */}
                    <div>
                      <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRtl ? "text-right" : "text-left"}`}>
                        {t.difficulty}
                      </label>
                      <div className={`flex gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                        {(["Easy", "Medium", "Hard"] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setDifficulty(level)}
                            className={`flex-1 rounded-xl py-3 px-4 border text-sm font-semibold transition-all ${
                              difficulty === level
                                ? `${theme.accentBorder} ${theme.accentBg} ${theme.accentText} font-bold`
                                : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                            }`}
                          >
                            {level === "Easy" ? t.difficultyEasy : level === "Medium" ? t.difficultyMedium : t.difficultyHard}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="rounded-xl bg-red-50 p-3 border border-red-100 text-xs font-semibold text-red-600">
                        ⚠️ {error}
                      </div>
                    )}

                    {/* Launch Button */}
                    <button
                      onClick={handleGenerateQuiz}
                      className={`mt-4 w-full rounded-xl ${theme.buttonBg} ${theme.buttonText} py-3.5 text-sm font-bold shadow-md ${theme.accentShadow} transition-all active:scale-95 flex items-center justify-center gap-2`}
                    >
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span>{t.generateQuizButton}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Filters bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Filter by Lesson */}
                      <div>
                        <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ${isRtl ? "text-right" : "text-left"}`}>
                          {t.lessonFilter}
                        </label>
                        <select
                          value={selectedLessonFilter}
                          onChange={(e) => setSelectedLessonFilter(e.target.value)}
                          className={`w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3.5 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 ${theme.accentRing} focus:border-transparent ${
                            isRtl ? "text-right" : "text-left"
                          }`}
                        >
                          <option value="all">{t.allLessons}</option>
                          {uniqueLessons.map((les) => (
                            <option key={les} value={les}>{les}</option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Difficulty */}
                      <div>
                        <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ${isRtl ? "text-right" : "text-left"}`}>
                          {t.difficultyFilter}
                        </label>
                        <select
                          value={selectedDifficultyFilter}
                          onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
                          className={`w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3.5 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 ${theme.accentRing} focus:border-transparent ${
                            isRtl ? "text-right" : "text-left"
                          }`}
                        >
                          <option value="all">{t.allDifficulties}</option>
                          <option value="Easy">{t.difficultyEasy}</option>
                          <option value="Medium">{t.difficultyMedium}</option>
                          <option value="Hard">{t.difficultyHard}</option>
                        </select>
                      </div>
                    </div>

                    {/* Search bar */}
                    <div className="relative">
                      <div className={`absolute inset-y-0 ${isRtl ? "right-3.5" : "left-3.5"} flex items-center pointer-events-none`}>
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder={t.searchQuestionsPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 ${isRtl ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${theme.accentRing} focus:border-transparent focus:bg-white transition-all`}
                      />
                    </div>

                    {/* Exam Assembly Box */}
                    {filteredQuestions.length > 0 ? (
                      <div className={`rounded-xl border ${theme.accentBorder} ${theme.lightBg} p-4 space-y-4`}>
                        <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                          <div className={`p-1.5 rounded-lg ${theme.accentBg} ${theme.accentText}`}>
                            <BookOpenCheck className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="font-sans font-bold text-sm text-gray-900">
                              {t.assembleExam}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {isRtl 
                                ? `لديك ${filteredQuestions.length} سؤال متاح بناءً على تصفيتك الحالية.` 
                                : `You have ${filteredQuestions.length} questions available based on your filters.`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Exam Question Count Input */}
                          <div>
                            <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ${isRtl ? "text-right" : "text-left"}`}>
                              {t.numberOfQuestions} (Max {filteredQuestions.length})
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={filteredQuestions.length}
                              value={customExamCount}
                              onChange={(e) => setCustomExamCount(Math.max(1, Math.min(filteredQuestions.length, parseInt(e.target.value) || 1)))}
                              className={`w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 ${theme.accentRing}`}
                            />
                          </div>

                          {/* Custom Exam Title */}
                          <div>
                            <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ${isRtl ? "text-right" : "text-left"}`}>
                              {isRtl ? "عنوان الامتحان المخصص" : "Custom Exam Title"}
                            </label>
                            <input
                              type="text"
                              placeholder={isRtl ? "مثال: مراجعة الفيزياء الشاملة" : "e.g. Comprehensive Physics Review"}
                              value={customExamTitle}
                              onChange={(e) => setCustomExamTitle(e.target.value)}
                              className={`w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 ${theme.accentRing} ${isRtl ? "text-right" : "text-left"}`}
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleStartCustomExam}
                          className={`w-full rounded-xl ${theme.buttonBg} ${theme.buttonText} py-3 text-sm font-bold shadow-md ${theme.accentShadow} transition-all active:scale-95 flex items-center justify-center gap-2`}
                        >
                          <Play className="h-4 w-4 shrink-0" />
                          <span>{t.startCustomExam}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
                        <Info className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-semibold">{t.noQuestionsFound}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {isRtl 
                            ? "جرّب تغيير التصفية، أو قم بتوليد أسئلة جديدة عبر الذكاء الاصطناعي لحفظها بالبنك!" 
                            : "Try changing your filters, or generate new quizzes via AI to add questions to your bank!"}
                        </p>
                      </div>
                    )}

                    {/* Question List Accordion */}
                    {filteredQuestions.length > 0 && (
                      <div className="space-y-3">
                        <h4 className={`text-xs font-bold text-gray-400 uppercase tracking-wider ${isRtl ? "text-right" : "text-left"}`}>
                          {t.matchingInBank} ({filteredQuestions.length})
                        </h4>

                        <div className="max-h-[350px] overflow-y-auto pr-1 pl-1 space-y-3 scrollbar-thin">
                          {filteredQuestions.map((q) => {
                            const isExpanded = expandedQuestionId === q.id;
                            return (
                              <div key={q.id} className="rounded-xl border border-gray-100 bg-gray-50/35 p-3.5 space-y-3.5 hover:border-gray-200 transition-all text-left rtl:text-right">
                                <div className={`flex items-start justify-between gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                                  <div className="space-y-1 flex-1">
                                    {/* Question Text */}
                                    <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                                      {q.questionText}
                                    </p>
                                    
                                    {/* Badges */}
                                    <div className={`flex flex-wrap gap-1.5 pt-1.5 ${isRtl ? "justify-end" : "justify-start"}`}>
                                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        q.difficulty === "Easy" 
                                          ? "bg-green-100 text-green-800" 
                                          : q.difficulty === "Hard" 
                                            ? "bg-red-100 text-red-800" 
                                            : "bg-blue-100 text-blue-800"
                                      }`}>
                                        {q.difficulty === "Easy" ? t.difficultyEasy : q.difficulty === "Hard" ? t.difficultyHard : t.difficultyMedium}
                                      </span>
                                      {q.lessonTitle && (
                                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                                          {q.lessonTitle}
                                        </span>
                                      )}
                                      {q.topic && (
                                        <span className={`text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full`}>
                                          #{q.topic}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                                      title={isRtl ? "عرض التفاصيل" : "Toggle details"}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuestion(q.id)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50/50 transition-all"
                                      title={t.deleteQuestion}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Accordion Expended Details */}
                                {isExpanded && (
                                  <div className="pt-3 border-t border-gray-100 space-y-3 animate-fade-in text-left rtl:text-right">
                                    {/* Options list */}
                                    <div className="space-y-1.5">
                                      {q.options.map((opt, oIdx) => {
                                        const isCorrect = oIdx === q.correctAnswerIndex;
                                        return (
                                          <div
                                            key={oIdx}
                                            className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${
                                              isCorrect
                                                ? "border-emerald-200 bg-emerald-50/30 text-emerald-800 font-bold"
                                                : "border-gray-100 bg-white text-gray-600"
                                            } ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}
                                          >
                                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                                              isCorrect ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 font-semibold"
                                            }`}>
                                              {isCorrect ? "✓" : String.fromCharCode(65 + oIdx)}
                                            </span>
                                            <span className="truncate">{opt}</span>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Detailed explanation fields */}
                                    {renderExplanationDetails(q, null)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. ACTIVE QUIZ PLAY */}
            {quiz && !showResults && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm relative overflow-hidden" style={theme.bgStyle}>
                
                {/* Quiz Play Header */}
                <div className={`flex items-center justify-between border-b border-gray-100 pb-4 mb-6 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${theme.accentBadge}`}>
                    {quiz.quizTitle || (isRtl ? "امتحان وزاري مخصص" : "Ministry Exam Practice")}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    {t.questionOf
                      .replace("{current}", String(currentQuestionIndex + 1))
                      .replace("{total}", String(quiz.questions.length))}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden mb-6">
                  <div
                    className={`h-full ${theme.progressBg} transition-all duration-300`}
                    style={{
                      width: `${((currentQuestionIndex) / quiz.questions.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Question Box */}
                <div className="mb-6">
                  <h4 className="font-sans text-base sm:text-lg font-bold text-gray-900 leading-relaxed">
                    {quiz.questions[currentQuestionIndex].questionText}
                  </h4>
                </div>

                {/* Options Grid */}
                <div className="space-y-3">
                  {quiz.questions[currentQuestionIndex].options.map((option, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    const isCorrectAnswer = idx === quiz.questions[currentQuestionIndex].correctAnswerIndex;
                    const isWrongAnswer = isSelected && !isCorrectAnswer;

                    // Styles after user submits selection
                    let optionStyles = "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50/50";
                    if (hasSubmittedAnswer) {
                      if (isCorrectAnswer) {
                        optionStyles = "border-green-500 bg-green-50/80 text-green-800 font-semibold";
                      } else if (isWrongAnswer) {
                        optionStyles = "border-red-500 bg-red-50/80 text-red-800 font-semibold";
                      } else {
                        optionStyles = "border-gray-100 bg-gray-50/20 text-gray-400";
                      }
                    } else if (isSelected) {
                      optionStyles = `${theme.accentBorder} ${theme.accentBg} ${theme.accentText} font-semibold`;
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={hasSubmittedAnswer}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-all ${
                          isRtl ? "flex-row-reverse text-right" : "text-left"
                        } ${optionStyles}`}
                      >
                        <span>{option}</span>

                        {/* Feedback icon indicators */}
                        {hasSubmittedAnswer && isCorrectAnswer && (
                          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                        )}
                        {hasSubmittedAnswer && isWrongAnswer && (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Real-time Explanations Area */}
                {hasSubmittedAnswer && (
                  <div className={`mt-6 rounded-xl bg-gray-50 p-4 border border-gray-100 animate-slide-up ${
                    isRtl ? "text-right" : "text-left"
                  }`}>
                    <h5 className="font-sans font-bold text-gray-900 text-sm mb-1.5 flex items-center gap-1.5 pb-2 border-b border-gray-200/50">
                      <HelpCircle className="h-4 w-4 text-indigo-500" />
                      {t.explanationTitle}
                    </h5>
                    
                    {renderExplanationDetails(quiz.questions[currentQuestionIndex], selectedOptionIndex)}

                    {/* Next Question Control */}
                    <div className={`mt-4 flex ${isRtl ? "justify-start" : "justify-end"}`}>
                      <button
                        onClick={handleNextQuestion}
                        className={`flex items-center gap-2 rounded-lg ${theme.buttonBg} ${theme.buttonText} px-4 py-2 text-xs font-bold shadow-sm transition-all active:scale-95 ${
                          isRtl ? "flex-row-reverse" : ""
                        }`}
                      >
                        <span>
                          {currentQuestionIndex === quiz.questions.length - 1 ? t.finishQuiz : t.nextQuestion}
                        </span>
                        <ArrowRight className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. RESULTS DASHBOARD */}
            {quiz && showResults && !reviewMode && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Header Banner */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden" style={theme.bgStyle}>
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.accentBg} ${theme.accentText} shadow-md shadow-gray-100`}>
                        <Award className="h-7 w-7 animate-pulse" />
                      </div>
                      <div className={isRtl ? "text-right" : "text-left"}>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isRtl ? "تم اكتمال الاختبار بنجاح" : "Quiz Finished Successfully"}</span>
                        <h3 className="font-sans text-2xl font-bold text-gray-900 leading-tight mt-0.5">
                          {isRtl ? "تقرير الأداء الشامل" : "Comprehensive Performance Report"}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500">{isRtl ? "المادة الدراسيّة:" : "Subject:"}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${theme.accentBadge}`}>
                        {theme.icon}
                        {isRtl ? theme.arabicName : theme.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Column 1: Academic Grade & Radial score */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[340px]">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-sans font-bold text-gray-900 text-sm">{isRtl ? "التقدير والتقييم" : "Academic Assessment"}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border ${gradeInfo.color}`}>
                        {gradeInfo.name}
                      </span>
                    </div>

                    {/* Radial Progress Ring */}
                    <div className="relative my-6 flex flex-col items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <svg className="h-36 w-36 -rotate-90">
                          <circle
                            cx="72"
                            cy="72"
                            r="58"
                            className="stroke-gray-100 fill-transparent"
                            strokeWidth="11"
                          />
                          <circle
                            cx="72"
                            cy="72"
                            r="58"
                            className={`fill-transparent ${theme.ringStroke} transition-all duration-1000`}
                            strokeWidth="11"
                            strokeDasharray="364.4"
                            strokeDashoffset={364.4 - (364.4 * percentage) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="font-sans text-4xl font-extrabold text-gray-900">{percentage}%</span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                            {score} / {totalQuestions}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grade Text Description */}
                    <div className={`rounded-xl border p-3.5 text-center ${gradeInfo.color}`}>
                      <p className="text-xs font-semibold leading-relaxed">
                        {gradeInfo.desc}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Detailed Stats Bento Grid */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    
                    {/* Stat Card 1: Time Spent */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500">{isRtl ? "الوقت المستغرق" : "Time Spent"}</span>
                        <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                          <Clock className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-sans text-xl sm:text-2xl font-extrabold text-gray-900">
                          {formatTimeSpent(timeSpent)}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {isRtl ? "منذ بدء الإجابة حتى التسليم" : "From start to submission"}
                        </p>
                      </div>
                    </div>

                    {/* Stat Card 2: Overall Accuracy */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500">{isRtl ? "معدل الدقة" : "Overall Accuracy"}</span>
                        <div className={`rounded-lg p-1.5 ${theme.accentBg} ${theme.accentText}`}>
                          <Target className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-sans text-xl sm:text-2xl font-extrabold text-gray-900">
                          {percentage}%
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {isRtl ? "نسبة التوفيق والإصابة" : "Ratio of correct attempts"}
                        </p>
                      </div>
                    </div>

                    {/* Stat Card 3: Correct Answers */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500">{isRtl ? "الإجابات الصحيحة" : "Correct Answers"}</span>
                        <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-sans text-xl sm:text-2xl font-extrabold text-emerald-600">
                          {score} <span className="text-xs text-gray-400 font-bold">/ {totalQuestions}</span>
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {isRtl ? `${score} أسئلة صحيحة تماماً` : `${score} perfectly correct`}
                        </p>
                      </div>
                    </div>

                    {/* Stat Card 4: Wrong Answers */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500">{isRtl ? "الإجابات الخاطئة" : "Wrong Answers"}</span>
                        <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                          <XCircle className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-sans text-xl sm:text-2xl font-extrabold text-rose-600">
                          {totalQuestions - score} <span className="text-xs text-gray-400 font-bold">/ {totalQuestions}</span>
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {isRtl ? `${totalQuestions - score} أسئلة لم تُوفق بها` : `${totalQuestions - score} incorrect attempts`}
                        </p>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Sub Bento Grid: Charts & Analytical Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Beautiful Charts Section */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[280px]">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-gray-500" />
                      <h4 className="font-sans font-bold text-gray-900 text-sm">{isRtl ? "تحليل البيانات والنتائج" : "Analytical Insights & Charts"}</h4>
                    </div>

                    {/* Pie Chart and legend container */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center my-auto">
                      <div className="w-[160px] h-[160px] flex items-center justify-center relative shrink-0">
                        {pieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={70}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: any, name: any) => [`${value} ${isRtl ? "سؤال" : "question(s)"}`, name]}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-xs text-gray-400">{isRtl ? "لا توجد بيانات" : "No data available"}</div>
                        )}
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-gray-400">{isRtl ? "إجمالي الأسئلة" : "Total Qs"}</span>
                          <span className="text-lg font-black text-gray-800">{totalQuestions}</span>
                        </div>
                      </div>

                      {/* Custom Legend */}
                      <div className="flex flex-col gap-3 w-full max-w-[200px] text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                            <span className="font-medium text-gray-600">{isRtl ? "إجابات صحيحة" : "Correct"}</span>
                          </div>
                          <span className="font-bold text-emerald-700">{score}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 border border-rose-100/50">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                            <span className="font-medium text-gray-600">{isRtl ? "إجابات خاطئة" : "Incorrect"}</span>
                          </div>
                          <span className="font-bold text-rose-700">{totalQuestions - score}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Topic Mastery & Breakdown (Strengths & Weaknesses) */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4 justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        <h4 className="font-sans font-bold text-gray-900 text-sm">
                          {isRtl ? "تحليل مستوى فهم الموضوعات الفرعية" : "Topic Mastery & Skill Breakdown"}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-4 my-2">
                      {/* Topic Progress Bars (Dynamic based on topicStats) */}
                      {Object.entries(topicStats.rawStats).map(([topic, data]: [string, any]) => {
                        const accuracy = Math.round((data.correct / data.total) * 100);
                        const isMastered = accuracy >= 70;
                        return (
                          <div key={topic} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-800">{topic}</span>
                              <span className={`font-semibold px-1.5 py-0.5 rounded ${isMastered ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                                {data.correct}/{data.total} ({accuracy}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  isMastered ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                                style={{ width: `${accuracy}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Strong / Weak Topics Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                      
                      {/* Strong Topics */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg p-1.5">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{isRtl ? "مواطن القوة والتميز" : "Strong Topics"}</span>
                        </div>
                        {topicStats.strong.length > 0 ? (
                          <ul className="text-xs text-gray-600 space-y-1 pl-1">
                            {topicStats.strong.map((t) => (
                              <li key={t} className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="truncate max-w-[150px]">{t}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic pl-2">{isRtl ? "أنجز المزيد لتحديد مواطن تميزك" : "Keep improving to build strong areas"}</p>
                        )}
                      </div>

                      {/* Weak Topics */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-lg p-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{isRtl ? "موضوعات تحتاج تركيزاً" : "Needs Practice"}</span>
                        </div>
                        {topicStats.weak.length > 0 ? (
                          <ul className="text-xs text-gray-600 space-y-1 pl-1">
                            {topicStats.weak.map((t) => (
                              <li key={t} className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="truncate max-w-[150px]">{t}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic pl-2">{isRtl ? "لا توجد نقاط ضعف ملموسة! رائع!" : "No critical weaknesses found!"}</p>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

                {/* Actions Controls Panel */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row justify-center">
                    <button
                      onClick={handleRetakeQuiz}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-95 ${
                        isRtl ? "flex-row-reverse" : ""
                      }`}
                    >
                      <RefreshCw className="h-4 w-4" />
                      {t.retakeQuiz}
                    </button>

                    <button
                      onClick={() => setReviewMode(true)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-95 ${
                        isRtl ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      {t.reviewIncorrect}
                    </button>

                    <button
                      onClick={handleResetQuizConfig}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl ${theme.buttonBg} ${theme.buttonText} py-3 text-sm font-bold shadow-sm transition-all active:scale-95 ${
                        isRtl ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      {t.tryAnotherQuiz}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 5. REVIEW ANSWERS BOARD */}
            {quiz && showResults && reviewMode && (
              <div className="space-y-6">
                <div className={`flex items-center justify-between rounded-xl bg-gray-50 p-4 border border-gray-100 ${
                  isRtl ? "flex-row-reverse" : ""
                }`}>
                  <span className="font-sans text-sm font-bold text-gray-700">
                    {t.reviewIncorrect} ({score}/{totalQuestions})
                  </span>
                  <button
                    onClick={() => setReviewMode(false)}
                    className={`text-xs font-bold ${theme.accentText} hover:underline`}
                  >
                    {isRtl ? "العودة للنتائج" : "Back to results"}
                  </button>
                </div>

                {quiz.questions.map((q, qIdx) => {
                  const userSelection = userAnswers[qIdx];
                  const isCorrect = userSelection === q.correctAnswerIndex;

                  return (
                    <div key={qIdx} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      {/* Question title */}
                      <h4 className="font-sans font-bold text-gray-900 text-sm mb-3">
                        {qIdx + 1}. {q.questionText}
                      </h4>

                      {/* Question options review */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {q.options.map((option, oIdx) => {
                          const isCorrectOption = oIdx === q.correctAnswerIndex;
                          const isUserSelection = oIdx === userSelection;

                          let oStyles = "border-gray-100 bg-gray-50/20 text-gray-500";
                          if (isCorrectOption) {
                            oStyles = "border-green-200 bg-green-50/30 text-green-700 font-semibold";
                          } else if (isUserSelection && !isCorrectOption) {
                            oStyles = "border-red-200 bg-red-50/30 text-red-700 font-semibold";
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                isRtl ? "flex-row-reverse text-right" : "text-left"
                              } ${oStyles}`}
                            >
                              <span>{option}</span>
                              {isCorrectOption && <CheckCircle className="h-4.5 w-4.5 text-green-500 shrink-0" />}
                              {isUserSelection && !isCorrectOption && <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation text */}
                      {renderExplanationDetails(q, userSelection)}
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* RIGHT/SIDEBAR - INTEGRATED SUBJECT STUDY WIDGET (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <StudyHelperWidget subject={detectedSubject} isRtl={isRtl} />
          </div>

        </div>
      )}

    </div>
  );
}

/* ==========================================================================
   SUBJECT STUDY HELPER WIDGETS
   ========================================================================== */

function StudyHelperWidget({ subject, isRtl }: { subject: string; isRtl: boolean }) {
  const [activeTab, setActiveTab] = useState<string>("default");

  // Render Chemistry Periodic Table variables
  const [selectedChemElement, setSelectedChemElement] = useState<any>(null);

  // Render Biology Cell organelle explorer
  const [selectedOrganelle, setSelectedOrganelle] = useState<any>(null);

  // Render Physics force input parameters
  const [physicsMass, setPhysicsMass] = useState<number>(10);
  const [physicsAcc, setPhysicsAcc] = useState<number>(9.8);

  switch (subject) {
    case "Mathematics":
      return (
        <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 border-b border-teal-50 pb-3">
            <div className="bg-teal-50 p-2 rounded-lg text-teal-600">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-gray-900 text-sm">
                {isRtl ? "مساعد الرياضيات" : "Mathematics Hub"}
              </h4>
              <p className="text-[10px] text-teal-600 font-semibold">
                {isRtl ? "مفكرة رسم تفاعلية للمعادلات" : "Interactive scratchpad & workspace"}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              {isRtl 
                ? "استخدم هذه السبورة لمسودة خطوات الحل، أو رسم الهندسة وحساب التكامل والتفاضل:" 
                : "Sketch steps, write fractions, calculate derivatives, or solve geometry coordinates below:"}
            </p>
            
            <MathScratchpad isRtl={isRtl} />

            <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100 text-xs">
              <h5 className="font-bold text-teal-800 mb-1 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                {isRtl ? "مفاتيح الحل السريع" : "Quick Calculation Tips"}
              </h5>
              <ul className="list-disc pl-4 space-y-1 text-teal-900/80 text-[11px] rtl:pl-0 rtl:pr-4">
                <li>{isRtl ? "تذكر: تفاضل الجيب (sin) هو جيب التمام (cos)." : "Derivative of sin(x) is cos(x)."}</li>
                <li>{isRtl ? "مساحة الدائرة = ط نق² (πr²)." : "Area of a Circle = πr²."}</li>
                <li>{isRtl ? "المصفوفات: ترتيب الضرب غير تبديلي (A×B ≠ B×A)." : "Matrix multiplication order matters (AB ≠ BA)."}</li>
              </ul>
            </div>
          </div>
        </div>
      );

    case "Chemistry":
      const chemElements = [
        { symbol: "H", name: "Hydrogen", arName: "هيدروجين", mass: 1.008, valency: 1, desc: "Lightest element, highly flammable." },
        { symbol: "He", name: "Helium", arName: "هيليوم", mass: 4.003, valency: 0, desc: "Noble gas, non-reactive." },
        { symbol: "C", name: "Carbon", arName: "كربون", mass: 12.011, valency: 4, desc: "Backbone of organic life molecules." },
        { symbol: "N", name: "Nitrogen", arName: "نيتروجين", mass: 14.007, valency: 3, desc: "78% of Earth's atmosphere." },
        { symbol: "O", name: "Oxygen", arName: "أكسجين", mass: 15.999, valency: 2, desc: "Essential element for aerobic respiration." },
        { symbol: "Na", name: "Sodium", arName: "صوديوم", mass: 22.990, valency: 1, desc: "Highly reactive alkali metal." },
        { symbol: "Cl", name: "Chlorine", arName: "كلور", mass: 35.45, valency: 1, desc: "Greenish halogen gas used in sanitation." },
        { symbol: "Fe", name: "Iron", arName: "حديد", mass: 55.845, valency: "2, 3", desc: "Key transition metal in hemoglobin." },
      ];

      return (
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 border-b border-emerald-50 pb-3">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              <Atom className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-gray-900 text-sm">
                {isRtl ? "مساعد الكيمياء" : "Chemistry Desk"}
              </h4>
              <p className="text-[10px] text-emerald-600 font-semibold">
                {isRtl ? "الجدول الدوري المصغر ومفاتيح التفاعل" : "Mini interactive element explorer"}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              {isRtl 
                ? "اضغط على أحد العناصر الكيميائية الشائعة لمعاينة الكتلة والذرة والتكافؤ المعتمد:" 
                : "Click on any element in this quick chemical tray to inspect valency, molar mass, and details:"}
            </p>

            <div className="grid grid-cols-4 gap-1.5">
              {chemElements.map((el) => (
                <button
                  key={el.symbol}
                  onClick={() => setSelectedChemElement(el)}
                  className={`border p-2 rounded-lg text-center font-bold text-xs transition-all ${
                    selectedChemElement?.symbol === el.symbol
                      ? "bg-emerald-600 text-white border-emerald-600 scale-105"
                      : "bg-emerald-50/40 text-emerald-800 border-emerald-100 hover:bg-emerald-100/50"
                  }`}
                >
                  <div className="text-[9px] text-emerald-500/80 font-normal">{el.mass.toFixed(1)}</div>
                  <div className="text-sm font-extrabold">{el.symbol}</div>
                  <div className="text-[8px] tracking-tight truncate">{isRtl ? el.arName : el.name}</div>
                </button>
              ))}
            </div>

            {selectedChemElement ? (
              <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100 text-xs animate-fade-in">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-extrabold text-emerald-800 text-sm">🧪 {selectedChemElement.symbol} - {isRtl ? selectedChemElement.arName : selectedChemElement.name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {isRtl ? `تكافؤ: ${selectedChemElement.valency}` : `Valence: ${selectedChemElement.valency}`}
                  </span>
                </div>
                <div className="text-emerald-900/80 text-[11px] leading-relaxed">
                  <div className="mb-1"><strong>Molar Mass:</strong> {selectedChemElement.mass} g/mol</div>
                  <div>{selectedChemElement.desc}</div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-400 border border-dashed">
                {isRtl ? "اختر عنصراً من الأعلى لاستكشاف خصائصه" : "Select an element above to inspect"}
              </div>
            )}
          </div>
        </div>
      );

    case "Physics":
      return (
        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 border-b border-violet-50 pb-3">
            <div className="bg-violet-50 p-2 rounded-lg text-violet-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-gray-900 text-sm">
                {isRtl ? "مكتبة الثوابت الفيزيائية" : "Physics Constant Desk"}
              </h4>
              <p className="text-[10px] text-violet-600 font-semibold">
                {isRtl ? "الثوابت وحساب القوة التفاعلية" : "Physical constants & force calculator"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Quick calculations */}
            <div className="bg-violet-50/40 rounded-xl p-3 border border-violet-100 text-xs">
              <h5 className="font-bold text-violet-800 mb-2 flex items-center gap-1">
                ⚙️ {isRtl ? "حاسبة القوة النيوتنية (F = m × a)" : "Force Simulator (Newton: F = m · a)"}
              </h5>
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] text-violet-700 font-medium mb-1">
                    <span>{isRtl ? "الكتلة (m)" : "Mass (m)"}: <strong>{physicsMass} kg</strong></span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={physicsMass}
                    onChange={(e) => setPhysicsMass(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-violet-700 font-medium mb-1">
                    <span>{isRtl ? "التسارع (a)" : "Acceleration (a)"}: <strong>{physicsAcc} m/s²</strong></span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={physicsAcc}
                    onChange={(e) => setPhysicsAcc(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>
                <div className="border-t border-violet-100 pt-2 flex justify-between items-center text-[11px] font-bold text-violet-950">
                  <span>{isRtl ? "القوة الناتجة (F):" : "Resulting Force (F):"}</span>
                  <span className="text-sm text-violet-700 bg-violet-100 px-2 py-0.5 rounded">{(physicsMass * physicsAcc).toFixed(1)} N (نيوتن)</span>
                </div>
              </div>
            </div>

            {/* Scientific Constants Reference */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 block">{isRtl ? "ثوابت أساسية مبرهنة" : "Universal Constants"}</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border border-violet-50 rounded-lg bg-white text-xs">
                  <div className="font-semibold text-gray-500 text-[9px]">{isRtl ? "سرعة الضوء (c)" : "Speed of Light (c)"}</div>
                  <div className="font-bold text-violet-800 text-[11px]">3 × 10⁸ m/s</div>
                </div>
                <div className="p-2 border border-violet-50 rounded-lg bg-white text-xs">
                  <div className="font-semibold text-gray-500 text-[9px]">{isRtl ? "ثابت الجاذبية (g)" : "Gravity (g)"}</div>
                  <div className="font-bold text-violet-800 text-[11px]">9.81 m/s²</div>
                </div>
                <div className="p-2 border border-violet-50 rounded-lg bg-white text-xs">
                  <div className="font-semibold text-gray-500 text-[9px]">{isRtl ? "ثابت بلانك (h)" : "Planck Constant (h)"}</div>
                  <div className="font-bold text-violet-800 text-[11px]">6.63 × 10⁻³⁴ J·s</div>
                </div>
                <div className="p-2 border border-violet-50 rounded-lg bg-white text-xs">
                  <div className="font-semibold text-gray-500 text-[9px]">{isRtl ? "شحنة الإلكترون (e)" : "Electron Charge (e)"}</div>
                  <div className="font-bold text-violet-800 text-[11px]">1.6 × 10⁻¹⁹ C</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case "Biology":
      const organelles = [
        { name: "Mitochondria", arName: "الميتوكوندريا", function: "Generates cellular chemical energy (ATP) through respiration.", arFunc: "بيت الطاقة في الخلية، مسؤولة عن إنتاج ATP والتنفس الخلوي." },
        { name: "Nucleus", arName: "النواة", function: "Stores DNA genetics and directs cell replication instructions.", arFunc: "تحتوي على الحمض النووي (DNA) وتدير الأنشطة والوراثة الخلوية." },
        { name: "Chloroplast", arName: "البلاستيدات الخضراء", function: "Performs photosynthesis capturing sunlight in green plants.", arFunc: "توجد في النباتات وتقوم بعملية البناء الضوئي لصناعة الغذاء." },
        { name: "Ribosome", arName: "الريبوسوم", function: "Responsible for translation and synthesis of protein chains.", arFunc: "المصنع الرئيسي لترجمة البروتين وتصنيعه بالخلية." },
        { name: "Cell Wall", arName: "الجدار الخلوي", function: "Provides shape, protective shield, and rigidity in plant cells.", arFunc: "جدار صلب يوفر الحماية والدعم الهيكلي للخلية النباتية." },
      ];

      return (
        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 border-b border-green-50 pb-3">
            <div className="bg-green-50 p-2 rounded-lg text-green-600">
              <Dna className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-gray-900 text-sm">
                {isRtl ? "أطلس الخلية والأحياء" : "Cell Organelle Explorer"}
              </h4>
              <p className="text-[10px] text-green-600 font-semibold">
                {isRtl ? "عضيات الخلية ووظائفها الهامة" : "Key cellular structures & bio-functions"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              {isRtl 
                ? "اختر أحد عضيات الخلية لدراسة وظيفتها الحيوية في امتحانات الأحياء:" 
                : "Select any cellular organelle to review its anatomical role and biological functions:"}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {organelles.map((or) => (
                <button
                  key={or.name}
                  onClick={() => setSelectedOrganelle(or)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                    selectedOrganelle?.name === or.name
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-green-50/30 text-green-800 border-green-100 hover:bg-green-100/40"
                  }`}
                >
                  🌿 {isRtl ? or.arName : or.name}
                </button>
              ))}
            </div>

            {selectedOrganelle ? (
              <div className="bg-green-50/50 rounded-xl p-3.5 border border-green-100 text-xs animate-fade-in">
                <h5 className="font-extrabold text-green-800 mb-1">
                  🔬 {isRtl ? selectedOrganelle.arName : selectedOrganelle.name}
                </h5>
                <p className="text-green-900/80 leading-relaxed text-[11px]">
                  {isRtl ? selectedOrganelle.arFunc : selectedOrganelle.function}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 text-center text-xs text-gray-400 border border-dashed">
                {isRtl ? "اختر مكوناً خلوياً لعرض شرحه الحيوي" : "Select an organelle to show description"}
              </div>
            )}
          </div>
        </div>
      );

    case "Arabic":
      const grammarKeys = [
        { case: "الرفع (Nominative)", markers: "الضمة (الأصلية)، الألف (المثنى)، الواو (جمع المذكر السالم/الأسماء الخمسة)" },
        { case: "النصب (Accusative)", markers: "الفتحة (الأصلية)، الألف (الأسماء الخمسة)، الياء (المثنى والجمع)، الكسرة (جمع المؤنث)" },
        { case: "الجر (Genitive)", markers: "الكسرة (الأصلية)، الياء (المثنى والجمع والأسماء الخمسة)، الفتحة (الممنوع من الصرف)" },
        { case: "الجزم (Jussive)", markers: "السكون (صحيح الآخر)، حذف حرف العلة (معتل الآخر)، حذف النون (الأفعال الخمسة)" },
      ];
      const poeticMetres = [
        { name: "البحر الطويل", weight: "فعولن مفاعيلن فعولن مفاعيلن" },
        { name: "البحر البسيط", weight: "مستفعلن فاعلن مستفعلن فاعلن" },
        { name: "البحر الوافر", weight: "مفاعلتن مفاعلتن فعولن" },
        { name: "البحر الكامل", weight: "متفاعلن متفاعلن متفاعلن" },
      ];

      return (
        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm relative overflow-hidden" dir="rtl">
          <div className="flex items-center gap-2 mb-4 border-b border-amber-50 pb-3">
            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-gray-900 text-sm">مفاتيح الإعراب والعروض</h4>
              <p className="text-[10px] text-amber-600 font-semibold">تسهيل الإعراب وموسيقى بحور الشعر العربي</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 border-b border-gray-100 pb-2">
              <button
                onClick={() => setActiveTab("default")}
                className={`text-xs pb-1 font-bold ${activeTab === "default" ? "border-b-2 border-amber-600 text-amber-700" : "text-gray-400"}`}
              >
                قواعد الإعراب
              </button>
              <button
                onClick={() => setActiveTab("poetry")}
                className={`text-xs pb-1 font-bold ${activeTab === "poetry" ? "border-b-2 border-amber-600 text-amber-700" : "text-gray-400"}`}
              >
                بحور الشعر
              </button>
            </div>

            {activeTab === "poetry" ? (
              <div className="space-y-2 text-xs">
                {poeticMetres.map((m) => (
                  <div key={m.name} className="p-2.5 border border-amber-50 rounded-xl bg-amber-50/20">
                    <div className="font-bold text-amber-900 text-[11px] mb-0.5">{m.name}</div>
                    <div className="text-[10px] text-amber-700 font-mono tracking-wide">{m.weight}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {grammarKeys.map((g) => (
                  <div key={g.case} className="p-2.5 border border-amber-50 rounded-xl bg-amber-50/20">
                    <div className="font-bold text-amber-900 text-[11px] mb-0.5">{g.case}</div>
                    <div className="text-[10px] text-amber-800 leading-relaxed">{g.markers}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case "English":
    default:
      const transitions = [
        { cat: "Contrast", items: ["However", "Nonetheless", "Conversely", "Despite this"] },
        { cat: "Addition", items: ["Furthermore", "Moreover", "In addition", "Likewise"] },
        { cat: "Cause & Effect", items: ["Therefore", "Consequently", "As a result", "Hence"] },
      ];

      return (
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 border-b border-blue-50 pb-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-gray-900 text-sm">
                {isRtl ? "لوحة تراكيب اللغة الإنجليزية" : "English Writing Palette"}
              </h4>
              <p className="text-[10px] text-blue-600 font-semibold">
                {isRtl ? "أدوات الربط وبناء المقالات الأكاديمية" : "Essay transition words & structure guide"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              {isRtl 
                ? "قائمة بالروابط الاحترافية لبناء الإجابات الأكاديمية وصياغة مقالات الثانوية العامة:" 
                : "Perfect your exam essays using high-cohesion transition words categorised below:"}
            </p>

            <div className="space-y-3">
              {transitions.map((t) => (
                <div key={t.cat} className="p-2.5 border border-blue-50 rounded-xl bg-blue-50/20 text-xs">
                  <div className="font-bold text-blue-900 text-[10px] uppercase mb-1.5">{t.cat}</div>
                  <div className="flex flex-wrap gap-1">
                    {t.items.map((word) => (
                      <span
                        key={word}
                        onClick={() => {
                          navigator.clipboard.writeText(word);
                          alert(`${word} copied to clipboard!`);
                        }}
                        className="bg-white px-2 py-0.5 rounded border border-blue-100 text-[10px] font-semibold text-blue-700 hover:bg-blue-50 cursor-pointer transition-all"
                        title="Click to copy"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
  }
}

/* Canvas Draw pad specifically for Mathematics */
function MathScratchpad({ isRtl }: { isRtl: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0d9488";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // account for canvas scale/dimension ratio difference
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="border border-teal-100 rounded-xl bg-teal-50/10 p-2 text-center">
      <div className={`flex items-center justify-between mb-2 ${isRtl ? "flex-row-reverse" : ""}`}>
        <span className="text-[10px] font-bold text-teal-800">✍️ {isRtl ? "لوح الرسم والتجربة" : "Sketch Whiteboard"}</span>
        <button
          onClick={clearCanvas}
          className="text-[9px] bg-white text-teal-700 hover:bg-teal-50 px-2 py-0.5 rounded border border-teal-100 font-bold active:scale-95 transition-all"
        >
          {isRtl ? "مسح اللوح" : "Clear"}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={350}
        height={200}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="border border-teal-100 rounded-lg bg-white cursor-crosshair w-full h-[160px]"
      />
    </div>
  );
}
