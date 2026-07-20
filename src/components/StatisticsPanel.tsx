import React, { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from "recharts";
import { 
  Award, BookOpen, Clock, Flame, Brain, TrendingUp, Sparkles, 
  ShieldAlert, BookCheck, ShieldCheck, ChevronRight, HelpCircle
} from "lucide-react";
import { SavedSession, AppLanguage } from "../types";
import { translations } from "../translations";

// Helper function to extract subject from title/text
export function getSubjectFromSession(title: string, text: string = ""): { en: string; ar: string } {
  const t = (title + " " + text).toLowerCase();
  if (t.includes("chemistry") || t.includes("كيمياء") || t.includes("تفاعل") || t.includes("عنصر") || t.includes("مركب")) {
    return { en: "Chemistry", ar: "الكيمياء" };
  }
  if (t.includes("physics") || t.includes("فيزياء") || t.includes("كهربا") || t.includes("قوة") || t.includes("حركة") || t.includes("موجة")) {
    return { en: "Physics", ar: "الفيزياء" };
  }
  if (t.includes("math") || t.includes("رياضيات") || t.includes("جبر") || t.includes("هندسة") || t.includes("تفاضل") || t.includes("حساب") || t.includes("مثلثات")) {
    return { en: "Mathematics", ar: "الرياضيات" };
  }
  if (t.includes("biology") || t.includes("أحياء") || t.includes("خلية") || t.includes("وراثة") || t.includes("جهاز") || t.includes("تنفس") || t.includes("نبات")) {
    return { en: "Biology", ar: "الأحياء" };
  }
  if (t.includes("history") || t.includes("تاريخ") || t.includes("ثورة") || t.includes("حرب") || t.includes("ملك") || t.includes("عصر") || t.includes("معركة")) {
    return { en: "History", ar: "التاريخ" };
  }
  if (t.includes("geography") || t.includes("جغرافيا") || t.includes("خريطة") || t.includes("تضاريس") || t.includes("طقس") || t.includes("حدود")) {
    return { en: "Geography", ar: "الجغرافيا" };
  }
  if (t.includes("arabic") || t.includes("عربي") || t.includes("نحو") || t.includes("بلاغة") || t.includes("نصوص") || t.includes("إعراب")) {
    return { en: "Arabic", ar: "اللغة العربية" };
  }
  if (t.includes("english") || t.includes("إنجليزي") || t.includes("grammar") || t.includes("vocabulary") || t.includes("tense") || t.includes("verb")) {
    return { en: "English", ar: "اللغة الإنجليزية" };
  }
  return { en: "General Study", ar: "دراسات عامة" };
}

interface StatisticsPanelProps {
  currentLanguage: AppLanguage;
  sessions: SavedSession[];
}

export default function StatisticsPanel({ currentLanguage, sessions }: StatisticsPanelProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";

  // Streak & Study time local state
  const [streakCount, setStreakCount] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    // Load streak from localStorage
    const storedStreak = localStorage.getItem("studymind_streak");
    if (storedStreak) {
      try {
        const parsed = JSON.parse(storedStreak);
        setStreakCount(parsed.count || 0);
      } catch (e) {
        console.error(e);
      }
    }

    // Load total study seconds
    const storedTime = localStorage.getItem("studymind_total_study_time");
    if (storedTime) {
      setTotalSeconds(parseInt(storedTime) || 0);
    }
  }, [sessions]);

  // Calculations
  const totalLessons = sessions.length;
  const completedSessions = sessions.filter(s => s.quizCompleted && s.quizScore !== undefined && s.quizTotalQuestions);
  const examsCount = completedSessions.length;

  // Average Score
  let averageScorePercent = 0;
  if (examsCount > 0) {
    const totalPercentage = completedSessions.reduce((sum, s) => {
      const score = s.quizScore || 0;
      const total = s.quizTotalQuestions || 1;
      return sum + (score / total) * 100;
    }, 0);
    averageScorePercent = Math.round(totalPercentage / examsCount);
  }

  // Format Total Study Time
  const formatStudyTime = (sec: number) => {
    if (sec < 60) {
      return isRtl ? `${sec} ثانية` : `${sec}s`;
    }
    const mins = Math.floor(sec / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hrs > 0) {
      return isRtl 
        ? `${hrs} ساعة و ${remainingMins} دقيقة` 
        : `${hrs}h ${remainingMins}m`;
    }
    return isRtl ? `${mins} دقيقة` : `${mins}m`;
  };

  // Group performance by Subject
  const subjectScores: Record<string, { totalPct: number; count: number; nameAr: string; nameEn: string }> = {};

  completedSessions.forEach((s) => {
    const subj = getSubjectFromSession(s.title, s.ocrResult.extractedText);
    const key = subj.en; // master key
    const score = s.quizScore || 0;
    const total = s.quizTotalQuestions || 1;
    const pct = (score / total) * 100;

    if (!subjectScores[key]) {
      subjectScores[key] = {
        totalPct: 0,
        count: 0,
        nameAr: subj.ar,
        nameEn: subj.en
      };
    }
    subjectScores[key].totalPct += pct;
    subjectScores[key].count += 1;
  });

  const subjectAverages = Object.keys(subjectScores).map((key) => {
    const item = subjectScores[key];
    return {
      subject: isRtl ? item.nameAr : item.nameEn,
      subjectEn: item.nameEn,
      average: Math.round(item.totalPct / item.count),
    };
  });

  // Determine Strongest and Weakest Subject
  let strongestSubj = "-";
  let weakestSubj = "-";

  if (subjectAverages.length > 0) {
    const sorted = [...subjectAverages].sort((a, b) => b.average - a.average);
    strongestSubj = `${sorted[0].subject} (${sorted[0].average}%)`;
    if (sorted.length > 1) {
      weakestSubj = `${sorted[sorted.length - 1].subject} (${sorted[sorted.length - 1].average}%)`;
    } else {
      weakestSubj = sorted[0].average < 60 ? `${sorted[0].subject} (${sorted[0].average}%)` : "-";
    }
  }

  // Generate chart data: last 6 sessions trend
  const trendData = [...completedSessions]
    .reverse()
    .slice(-6)
    .map((s, idx) => {
      const score = s.quizScore || 0;
      const total = s.quizTotalQuestions || 1;
      return {
        name: isRtl ? `امتحان ${idx + 1}` : `Exam ${idx + 1}`,
        score: Math.round((score / total) * 100),
        title: s.title.slice(0, 15) + "..."
      };
    });

  // Topic mastery list for Chart
  const masteryChartData = subjectAverages.length > 0 ? subjectAverages : [
    { subject: isRtl ? "كيمياء" : "Chemistry", average: 85 },
    { subject: isRtl ? "فيزياء" : "Physics", average: 70 },
    { subject: isRtl ? "رياضيات" : "Math", average: 92 },
  ];

  return (
    <div className={`space-y-6 ${isRtl ? "text-right" : "text-left"}`}>
      
      {/* 1. Bento Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Lessons Count */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {isRtl ? "الدروس المرفوعة" : "Total Lessons"}
            </span>
            <p className="font-sans text-2xl font-extrabold text-gray-900">
              {totalLessons}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Exams Completed */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {isRtl ? "الامتحانات المكتملة" : "Exams Completed"}
            </span>
            <p className="font-sans text-2xl font-extrabold text-gray-900">
              {examsCount}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BookCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Average Score */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {isRtl ? "متوسط الدرجات" : "Average Score"}
            </span>
            <p className="font-sans text-2xl font-extrabold text-gray-900">
              {examsCount > 0 ? `${averageScorePercent}%` : "-"}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Daily Streak */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {isRtl ? "السرعة المتتالية" : "Study Streak"}
            </span>
            <p className="font-sans text-2xl font-extrabold text-orange-600 flex items-center gap-1.5 justify-start">
              <Flame className="h-6 w-6 text-orange-500 animate-bounce fill-orange-500" />
              <span>{streakCount} {isRtl ? "أيام" : "Days"}</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* 2. Secondary stats: Study Time, Strongest, Weakest */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Study Time */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
          <div className={`flex items-center gap-2 text-indigo-600 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Clock className="h-4.5 w-4.5" />
            <span className="text-xs font-bold uppercase tracking-wider">{isRtl ? "إجمالي وقت المذاكرة والحل" : "Total Active Study Time"}</span>
          </div>
          <div>
            <p className="font-sans text-xl font-extrabold text-gray-900">
              {formatStudyTime(totalSeconds)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isRtl ? "يتم احتساب الوقت أثناء تشغيل الدروس والأسئلة بنشاط." : "Accrued dynamically during study, quiz, and discussion cycles."}
            </p>
          </div>
        </div>

        {/* Strongest Subject */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
          <div className={`flex items-center gap-2 text-emerald-600 ${isRtl ? "flex-row-reverse" : ""}`}>
            <ShieldCheck className="h-4.5 w-4.5" />
            <span className="text-xs font-bold uppercase tracking-wider">{isRtl ? "المادة الأقوى" : "Strongest Subject"}</span>
          </div>
          <div>
            <p className="font-sans text-xl font-extrabold text-emerald-600">
              {strongestSubj}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isRtl ? "المادة ذات أعلى متوسط درجات في اختباراتك الذكية." : "Derived from your highest-scoring practice sessions."}
            </p>
          </div>
        </div>

        {/* Weakest Subject */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
          <div className={`flex items-center gap-2 text-rose-500 ${isRtl ? "flex-row-reverse" : ""}`}>
            <ShieldAlert className="h-4.5 w-4.5" />
            <span className="text-xs font-bold uppercase tracking-wider">{isRtl ? "المادة الأكثر تحدياً" : "Weakest Subject"}</span>
          </div>
          <div>
            <p className="font-sans text-xl font-extrabold text-rose-500">
              {weakestSubj}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isRtl ? "المادة التي تحتاج لمراجعة إضافية وأسئلة تركيز." : "Needs core review. We recommend using Smart Revision."}
            </p>
          </div>
        </div>

      </div>

      {/* 3. Recharts Graphics section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Exam score trend */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h4 className="font-sans text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600 animate-pulse" />
              <span>{isRtl ? "منحنى تقدم الدرجات" : "Exam Performance Progression"}</span>
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">{isRtl ? "آخر 6 اختبارات تم حلها ونسب درجاتك النموذجية فيها" : "Trend percentage of your last 6 completed practice exams"}</p>
          </div>

          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontFamily: "Inter, sans-serif" }}
                    formatter={(value) => [`${value}%`, isRtl ? "الدرجة" : "Score"]}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Brain className="h-8 w-8 text-indigo-400 mb-2 animate-bounce" />
                <span className="text-sm font-bold text-gray-700">{isRtl ? "لا توجد بيانات اختبار كافية" : "No exam performance data yet"}</span>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">{isRtl ? "أكمل امتحاناً واحداً على الأقل لرسم المخطط البياني." : "Take your first practice quiz from any lesson to see your trends."}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart B: Subject Mastery rates */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h4 className="font-sans text-base font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-500" />
              <span>{isRtl ? "نسبة إتقان المواد" : "Subject Mastery Evaluation"}</span>
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">{isRtl ? "معدل متوسط الدرجات لكل مادة دراسية ترفعها" : "Aggregated average score across your analyzed subjects"}</p>
          </div>

          <div className="h-64 w-full">
            {completedSessions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={masteryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="subject" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontFamily: "Inter, sans-serif" }}
                    formatter={(value) => [`${value}%`, isRtl ? "معدل الإتقان" : "Mastery Rate"]}
                  />
                  <Bar dataKey="average" fill="#10b981" radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Sparkles className="h-8 w-8 text-emerald-400 mb-2 animate-pulse" />
                <span className="text-sm font-bold text-gray-700">{isRtl ? "مستوى مخصص افتراضي" : "Sample Topic Mastery"}</span>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">{isRtl ? "هذه عينة افتراضية. بمجرد إكمال اختبار، ستعرض بياناتك الفعلية." : "This is demonstration data. Real mastery rates will plot after completing a quiz."}</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
