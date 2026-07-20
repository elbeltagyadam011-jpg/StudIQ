import React, { useRef, useState, useEffect } from "react";
import { 
  Camera, 
  Image as ImageIcon, 
  Loader2, 
  Sparkles, 
  UploadCloud, 
  X, 
  ArrowUp, 
  ArrowDown, 
  GripVertical, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Trash2, 
  Plus
} from "lucide-react";
import { AppLanguage, OcrResult } from "../types";
import { translations } from "../translations";
import { motion, AnimatePresence } from "motion/react";

// Configurable image limit in one central place
export const MAX_IMAGES = 100;

interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  progress: number;
  status: "idle" | "compressing" | "processing" | "completed" | "failed";
  error?: string;
  sizeBefore: number;
  sizeAfter: number;
}

interface OcrUploaderProps {
  currentLanguage: AppLanguage;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  onUploadSuccess: (mergedResult: OcrResult, base64Images: string[]) => void;
  setLowConfidenceError: (err: { reason: string; image: string } | null) => void;
}

export default function OcrUploader({
  currentLanguage,
  isProcessing,
  setIsProcessing,
  onUploadSuccess,
  setLowConfidenceError,
}: OcrUploaderProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === "ar";
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Sync ref to current selectedFiles for cleanup on unmount
  const filesRef = useRef(selectedFiles);
  useEffect(() => {
    filesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => {
        if (f.previewUrl) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
  }, []);

  // Auto-compress image to client-side dataurl (fast, preserves text quality)
  const compressImage = (file: File): Promise<{ base64: string; sizeAfter: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Limit max dimensions to 1600px for speedy processing while preserving OCR quality
          const MAX_DIM = 1600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // 0.8 quality jpeg gives high compression ratios with zero visible text degradation
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
            // Apprx binary size of base64 string
            const approxSize = Math.round((compressedBase64.length - 814) * 0.75);
            resolve({ base64: compressedBase64, sizeAfter: approxSize });
          } else {
            resolve({ base64: e.target?.result as string, sizeAfter: file.size });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve({ base64: "", sizeAfter: 0 });
      };
      reader.readAsDataURL(file);
    });
  };

  // Check total size to trigger 500MB warning only
  const totalOriginalSize = selectedFiles.reduce((acc, f) => acc + f.sizeBefore, 0);
  const sizeWarningTriggered = totalOriginalSize > 500 * 1024 * 1024; // 500 MB

  // Process selected files, compress them immediately in the background
  const processSelectedFiles = async (files: FileList) => {
    setErrorMsg(null);
    setDuplicateWarning(null);

    const validFiles: File[] = [];
    let duplicatesCount = 0;
    let limitExceeded = false;

    // Filter duplicates and check bounds
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      // Duplicate detection based on filename and original size
      const isDuplicate = selectedFiles.some(
        (sf) => sf.file.name === file.name && sf.file.size === file.size
      );

      if (isDuplicate) {
        duplicatesCount++;
        return;
      }

      if (selectedFiles.length + validFiles.length >= MAX_IMAGES) {
        limitExceeded = true;
        return;
      }

      validFiles.push(file);
    });

    if (duplicatesCount > 0) {
      setDuplicateWarning(
        isRtl 
          ? `تم تجاهل عدد ${duplicatesCount} صورة مكررة بالفعل.` 
          : `Ignored ${duplicatesCount} duplicate images already in the list.`
      );
    }

    if (limitExceeded) {
      setErrorMsg(
        isRtl 
          ? `عذرًا، لا يمكن رفع أكثر من ${MAX_IMAGES} صورة.` 
          : `Sorry, you cannot upload more than ${MAX_IMAGES} images.`
      );
    }

    if (validFiles.length === 0) return;

    // Create temporary entries to show immediately (responsive UI)
    const newEntries: SelectedFile[] = validFiles.map((file, idx) => ({
      id: `file_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      base64: "",
      progress: 0,
      status: "compressing",
      sizeBefore: file.size,
      sizeAfter: file.size,
    }));

    // Update state to render them with a loading spinner instantly
    setSelectedFiles((prev) => [...prev, ...newEntries]);

    // Compress in parallel asynchronously without blocking main thread
    await Promise.all(
      newEntries.map(async (entry) => {
        const { base64, sizeAfter } = await compressImage(entry.file);
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? {
                  ...f,
                  base64,
                  sizeAfter,
                  status: "idle" as const,
                }
              : f
          )
        );
      })
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  // Page reordering operations
  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === selectedFiles.length - 1) return;

    const updated = [...selectedFiles];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSelectedFiles(updated);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAllSelected = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setSelectedFiles([]);
    setErrorMsg(null);
    setDuplicateWarning(null);
  };

  // Drag and drop sorting handlers for grid
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...selectedFiles];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setSelectedFiles(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Execute Parallel Promise.all uploads
  const handleParallelUploadAndMerge = async () => {
    if (selectedFiles.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    // Filter to make sure we compressed all images successfully
    const uncompressed = selectedFiles.filter((f) => !f.base64);
    if (uncompressed.length > 0) {
      setErrorMsg(
        isRtl 
          ? "يرجى الانتظار لحين انتهاء ضغط بعض الصور." 
          : "Please wait for image compression to complete."
      );
      setIsProcessing(false);
      return;
    }

    try {
      // Run parallel processing of all pages using Promise.all
      const parallelOcrPromises = selectedFiles.map(async (item, index) => {
        // Set initial status to processing
        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "processing", progress: 15 } : f))
        );

        // Periodically update progress to keep visual feedback highly active & interactive
        const progressTimer = setInterval(() => {
          setSelectedFiles((prev) =>
            prev.map((f) => {
              if (f.id === item.id && f.status === "processing" && f.progress < 90) {
                return { ...f, progress: Math.min(f.progress + 15, 90) };
              }
              return f;
            })
          );
        }, 600);

        try {
          const res = await fetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: item.base64 }),
          });

          clearInterval(progressTimer);

          if (!res.ok) {
            throw new Error(isRtl ? `فشلت معالجة الصفحة ${index + 1}` : `Failed to process Page ${index + 1}`);
          }

          const ocrResult: OcrResult = await res.json();

          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: "completed", progress: 100 } : f))
          );

          return ocrResult;
        } catch (err: any) {
          clearInterval(progressTimer);
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: "failed", error: err.message || "Error" } : f))
          );
          throw err;
        }
      });

      const ocrResults = await Promise.all(parallelOcrPromises);

      // Check if any results generated low confidence assessment
      const lowConfidencePage = ocrResults.find((r) => r.lowConfidence);
      if (lowConfidencePage) {
        // Find which index failed confidence check to show the appropriate image
        const failedIndex = ocrResults.indexOf(lowConfidencePage);
        const failedImage = selectedFiles[failedIndex]?.base64 || "";
        setLowConfidenceError({
          reason: lowConfidencePage.lowConfidenceReason || "Low confidence in handwriting or math symbols.",
          image: failedImage,
        });
        setIsProcessing(false);
        return;
      }

      // Merge all processed results into one robust, cohesive Thanaweya lesson
      const mergedResult = mergeOcrResults(ocrResults);

      // Trigger successful completion callback
      onUploadSuccess(mergedResult, selectedFiles.map((f) => f.base64));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        isRtl
          ? "حدث خطأ في معالجة إحدى الصفحات المرفوعة. يرجى مراجعة حالة الاتصال وإعادة المحاولة."
          : "An error occurred during parallel OCR. Some pages could not be analyzed."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Core merging function to bind all uploaded textbook pages into a singular session
  const mergeOcrResults = (results: OcrResult[]): OcrResult => {
    const detectedLanguage = results[0]?.detectedLanguage || currentLanguage;
    const isAr = detectedLanguage === "ar";

    // Unified title combining page ranges
    const firstTitle = results[0]?.title || (isAr ? "درس" : "Lesson");
    const totalPages = results.length;
    const title = totalPages > 1 
      ? `${firstTitle} (${isAr ? "شامل" : "Comprehensive"} - ${totalPages} ${isAr ? "صفحات" : "pages"})`
      : firstTitle;

    // Detect/Select the dominant subject
    const subjectCount: Record<string, number> = {};
    results.forEach((r) => {
      if (r.subject) {
        subjectCount[r.subject] = (subjectCount[r.subject] || 0) + 1;
      }
    });
    let subject = results[0]?.subject;
    let maxCount = 0;
    Object.entries(subjectCount).forEach(([subj, count]) => {
      if (count > maxCount) {
        maxCount = count;
        subject = subj as any;
      }
    });

    // Extracted text - preserving sequence with clean structural headers
    const extractedText = results
      .map((r, idx) => {
        const header = isAr 
          ? `\n\n--- [ الصفحة ${idx + 1} ] ---\n\n` 
          : `\n\n--- [ Page ${idx + 1} ] ---\n\n`;
        return `${header}${r.extractedText}`;
      })
      .join("");

    // Combined Study summary with beautiful section breaks
    const summary = results
      .map((r, idx) => {
        const sectionHeader = isAr
          ? `### ملخص الصفحة ${idx + 1}\n`
          : `### Page ${idx + 1} Summary\n`;
        return `${sectionHeader}${r.summary}\n`;
      })
      .join("\n");

    // Deduplicate all Key Concepts by normalized name
    const conceptMap = new Map<string, { concept: string; explanation: string }>();
    results.forEach((r) => {
      r.keyConcepts?.forEach((c) => {
        const normalized = c.concept.trim().toLowerCase();
        if (!conceptMap.has(normalized)) {
          conceptMap.set(normalized, c);
        }
      });
    });
    const keyConcepts = Array.from(conceptMap.values());

    return {
      detectedLanguage,
      subject,
      title,
      extractedText,
      summary,
      keyConcepts,
      lowConfidence: false,
      lowConfidenceReason: "",
    };
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraSelect = () => {
    cameraInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {selectedFiles.length === 0 ? (
          /* ========================================= */
          /* 1. LANDING DROPZONE AREA (NO IMAGES YET)  */
          /* ========================================= */
          <motion.div
            key="empty-dropzone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full"
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all cursor-pointer md:p-16 ${
                isDragOver
                  ? "border-indigo-600 bg-indigo-50/40"
                  : "border-gray-200 bg-white hover:border-indigo-400 hover:bg-gray-50/30"
              }`}
            >
              {/* Hidden Inputs */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <input
                type="file"
                ref={cameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="hidden"
              />

              {/* Icon Cluster */}
              <div className="mb-6 flex items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerCameraSelect();
                  }}
                  title={t.cameraHint}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 shadow-sm transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 active:scale-95"
                >
                  <Camera className="h-6 w-6" />
                </button>
              </div>

              {/* Labels */}
              <h3 className="font-sans text-lg font-bold text-gray-900 group-hover:text-indigo-600">
                {isRtl ? "رفع صفحات الكتاب المدرسي" : "Upload Textbook Pages"}
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                {isRtl 
                  ? `قم بسحب وإفلات صفحات الكتاب هنا دفعة واحدة، أو انقر للتصفح. (يدعم حتى ${MAX_IMAGES} صورة)` 
                  : `Drag & drop up to ${MAX_IMAGES} pages at once, or click to browse.`}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-medium text-gray-400">
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" />
                  {t.supportedFormats}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ========================================= */
          /* 2. DYNAMIC RICH MULTI-THUMBNAIL GRID      */
          /* ========================================= */
          <motion.div
            key="thumbnail-list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            {/* Header statistics */}
            <div className={`flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`flex flex-col ${isRtl ? "text-right" : "text-left"}`}>
                <h4 className="font-sans text-base font-bold text-gray-900">
                  📚 {isRtl ? "صفحات الامتحان المحددة" : "Selected Exam Pages"}
                </h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {selectedFiles.length} / {MAX_IMAGES} {isRtl ? "صفحات جاهزة للمعالجة" : "pages prepared"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Add More input & button */}
                <input
                  type="file"
                  ref={addMoreInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isProcessing || selectedFiles.length >= MAX_IMAGES}
                  onClick={() => addMoreInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Plus className="h-4 w-4 text-indigo-600" />
                  {isRtl ? "إضافة صفحات" : "Add Pages"}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={clearAllSelected}
                  className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100/80 px-3 py-2 text-xs font-bold text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {isRtl ? "إلغاء الكل" : "Clear All"}
                </button>
              </div>
            </div>

            {/* Warn if total size exceeds 500 MB */}
            {sizeWarningTriggered && (
              <div className={`mb-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-100 p-4 text-amber-800 text-xs font-medium ${isRtl ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1">
                  <span className="font-bold">{isRtl ? "تحذير المساحة الزائدة:" : "Warning: Large Upload Size"}</span>
                  <p className="mt-1 opacity-90 leading-relaxed">
                    {isRtl 
                      ? `إجمالي حجم الصفحات المحددة (${formatSize(totalOriginalSize)}) يتجاوز 500 ميجابايت. يرجى التأكد من استقرار شبكة الإنترنت وسرعتها.`
                      : `The total size of selected pages (${formatSize(totalOriginalSize)}) exceeds 500 MB. Please verify you have a stable network to prevent upload failure.`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Duplicate Image Warning Banner */}
            {duplicateWarning && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5 text-xs text-amber-700 font-medium text-center">
                ⚠️ {duplicateWarning}
              </div>
            )}

            {/* Drag instruction helper label */}
            <p className="text-[11px] text-gray-400 font-semibold mb-3 text-center tracking-wide uppercase">
              {isRtl ? "💡 اسحب لترتيب الصفحات حسب تسلسل الكتاب المدرسي" : "💡 Drag and drop cards to sequence pages correctly"}
            </p>

            {/* Thumbnail list grid with smooth reorder drag and drop animation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[360px] overflow-y-auto p-1.5 rounded-xl bg-gray-50/50 border border-gray-100">
              <AnimatePresence>
                {selectedFiles.map((item, idx) => {
                  const isDragging = draggedIndex === idx;
                  return (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      draggable={!isProcessing}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOverItem(e, idx)}
                      onDragEnd={handleDragEnd}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        boxShadow: isDragging ? "0 10px 15px -3px rgba(79, 70, 229, 0.2)" : "0 1px 3px 0 rgba(0,0,0,0.05)"
                      }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2 }}
                      className={`group relative flex flex-col rounded-2xl border bg-white overflow-hidden select-none ${
                        isDragging 
                          ? "border-indigo-500 ring-2 ring-indigo-500/10 cursor-grabbing" 
                          : "border-gray-100 cursor-grab"
                      }`}
                    >
                      {/* Thumbnail wrapper */}
                      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden shrink-0">
                        <img
                          src={item.previewUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 pointer-events-none"
                          referrerPolicy="no-referrer"
                        />

                        {/* Page number badge */}
                        <div className={`absolute top-2 left-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-lg bg-gray-900/80 px-1.5 text-[11px] font-bold text-white backdrop-blur-xs`}>
                          #{idx + 1}
                        </div>

                        {/* Compression and size badges */}
                        <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-col gap-1">
                          {item.status === "compressing" ? (
                            <div className="rounded-md bg-indigo-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 text-center flex items-center justify-center gap-1 backdrop-blur-xs">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              {isRtl ? "جاري الضغط..." : "Compressing..."}
                            </div>
                          ) : (
                            <div className="rounded-md bg-gray-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 text-center truncate backdrop-blur-xs">
                              {formatSize(item.sizeBefore)} → {formatSize(item.sizeAfter)}
                            </div>
                          )}
                        </div>

                        {/* Drag grip overlay */}
                        {!isProcessing && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/95 text-gray-500 shadow-xs cursor-grab">
                              <GripVertical className="h-3.5 w-3.5" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(item.id);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500 text-white shadow-xs hover:bg-red-600 transition-colors cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Upload Status Overlay per page */}
                        {(item.status === "processing" || item.status === "completed" || item.status === "failed") && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/75 p-3 text-center backdrop-blur-xs">
                            {item.status === "processing" && (
                              <>
                                <Loader2 className="h-7 w-7 text-indigo-400 animate-spin mb-2" />
                                <span className="text-[11px] font-bold text-white">
                                  {isRtl ? "جاري التحليل" : "Analyzing"} {item.progress}%
                                </span>
                                <div className="mt-1.5 h-1 w-16 bg-white/20 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                                </div>
                              </>
                            )}
                            {item.status === "completed" && (
                              <>
                                <CheckCircle2 className="h-8 w-8 text-green-400 mb-1" />
                                <span className="text-[10px] font-bold text-green-300">
                                  {isRtl ? "تم الفحص" : "Scanned"}
                                </span>
                              </>
                            )}
                            {item.status === "failed" && (
                              <>
                                <AlertTriangle className="h-8 w-8 text-red-400 mb-1" />
                                <span className="text-[9px] font-medium text-red-300 truncate max-w-full">
                                  {item.error || (isRtl ? "فشل" : "Failed")}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Manual sequential buttons for tablet/mobile accessibility */}
                      {!isProcessing && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveItem(idx, "up")}
                            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <span className="text-[10px] font-bold text-gray-400">
                            {isRtl ? "ترتيب" : "Pos"} {idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={idx === selectedFiles.length - 1}
                            onClick={() => moveItem(idx, "down")}
                            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 rounded-xl bg-red-50 p-4 text-xs font-medium text-red-600 border border-red-100 ${
                  isRtl ? "text-right" : "text-left"
                }`}
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Main call to action */}
            <div className={`mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between ${isRtl ? "sm:flex-row-reverse" : ""}`}>
              <div className={`text-xs text-gray-500 font-medium ${isRtl ? "text-right" : "text-left"}`}>
                <span className="text-indigo-600 font-bold">
                  {isRtl ? "ملاحظة الثانوية العامة:" : "Thanaweya Amma Exam Setup:"}
                </span>
                <p className="mt-1 leading-relaxed max-w-md opacity-90">
                  {isRtl 
                    ? "سيتم قراءة جميع الصفحات بشكل متوازٍ، تجميع كافة المعادلات والمسائل الكيميائية/الرياضية، ثم توليد امتحان شامل ذكي ومُصمّم خصيصًا."
                    : "All textbook pages will be parsed in parallel, merging chemical or math formulas, before compiling a singular high-stakes practice examination."
                  }
                </p>
              </div>

              <button
                type="button"
                disabled={isProcessing || selectedFiles.some(f => !f.base64)}
                onClick={handleParallelUploadAndMerge}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3.5 text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isRtl ? "جاري التحليل المتوازي..." : "Analyzing Pages Parallel..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    {isRtl ? "توليد امتحان شامل من كل الصفحات" : "Generate Comprehensive Exam"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
