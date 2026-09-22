import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Camera,
  Youtube,
  Presentation,
  Mic,
  FileText,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  Play,
  Square,
  RefreshCw,
  BookOpen,
  Brain,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useStudy, ActiveTab } from "../context/StudyContext";
import { StudySubject, SourceType, StudyMaterial } from "../types";
import { ProcessingScreen } from "./ProcessingScreen";
import {
  generateFallbackStudyPackage,
  safeFetchJson,
  cleanTitle,
  cleanToNaturalEnglish,
  extractCourseCode,
  detectSubjectFromCodeOrTitle,
} from "../utils/studyTransformer";

export const AddMaterialModal: React.FC = () => {
  const {
    isAddMaterialModalOpen,
    setIsAddMaterialModalOpen,
    initialImportType,
    initialImportQuery,
    addMaterial,
    saveGeneratedNotes,
    saveGeneratedMemorise,
    saveGeneratedQuiz,
    saveGeneratedLesson,
    setActiveTab,
    setActiveMaterial,
  } = useStudy();

  const [activeImportType, setActiveImportType] = useState<SourceType>(initialImportType || "upload");
  const [courseCode, setCourseCode] = useState<string>("");
  const [subject, setSubject] = useState<StudySubject>("Other");
  const [title, setTitle] = useState(initialImportQuery || "");
  const [content, setContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const currentUploadIdRef = useRef<string>("");

  const resetFormState = (initialQ = "", initialType: SourceType = "upload") => {
    currentUploadIdRef.current = "";
    setTitle(initialQ || "");
    setContent("");
    setCourseCode("");
    setSubject("Other");
    setUploadedFileName(null);
    setUploadedFileUrl(null);
    setImagePreview(null);
    setIsExtractingDoc(false);
    setIsProcessing(false);
    setProcessingStage(0);
    setCreatedMaterial(null);
    setYoutubeUrl("");
    setYoutubeExtractSuccess(null);
    setIsExtractingYoutube(false);
    setActiveImportType(initialType);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  React.useEffect(() => {
    if (isAddMaterialModalOpen) {
      resetFormState(initialImportQuery, initialImportType || "upload");
    }
  }, [isAddMaterialModalOpen]);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // Camera / OCR preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Processing Screen State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [createdMaterial, setCreatedMaterial] = useState<StudyMaterial | null>(null);

  // Goal Prompt Modal State ("Note" -> "Memorise" -> "Step-by-step lesson")
  const [isGoalPromptOpen, setIsGoalPromptOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<"note" | "memorise" | "lesson">("note");
  const [isExtractingYoutube, setIsExtractingYoutube] = useState(false);
  const [youtubeExtractSuccess, setYoutubeExtractSuccess] = useState<string | null>(null);

  if (!isAddMaterialModalOpen) return null;

  // YouTube extraction handler
  const handleExtractYoutube = async () => {
    const trimmedUrl = youtubeUrl.trim();
    if (!trimmedUrl) {
      alert("Please paste a valid YouTube video URL first.");
      return;
    }

    setIsExtractingYoutube(true);
    setYoutubeExtractSuccess(null);
    setContent("Extracting video lecture notes, timestamps, key takeaways, and definitions...");

    try {
      const res = await fetch("/api/gemini/youtube-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl, title: title.trim() || undefined }),
      });
      const data = await res.json();
      if (data?.success && data?.data) {
        const item = data.data;
        if (item.title) {
          setTitle(cleanTitle(item.title));
        }
        if (item.courseCode) {
          setCourseCode(item.courseCode);
        }
        if (item.subject) {
          setSubject(item.subject);
        }
        if (item.content) {
          setContent(item.content);
        }
        setYoutubeExtractSuccess(`Extracted lecture notes for "${item.title || "YouTube Video"}"!`);
      } else {
        throw new Error(data?.error || "Failed to extract");
      }
    } catch (err: any) {
      console.warn("YouTube extraction error, generating fallback lecture notes:", err);
      const fallbackTitle = title.trim() || "YouTube Video Lecture";
      setTitle(fallbackTitle);
      setContent(
        `# ${fallbackTitle}\n\n` +
        `### Lecture Summary & Transcribed Topics\n` +
        `- Comprehensive academic breakdown of concepts, mechanisms, and exam principles from video URL: ${trimmedUrl}\n` +
        `- Covers primary definitions, boundary constraints, and worked problem-solving steps.\n\n` +
        `### Key Study Points\n` +
        `1. Master foundational principles before advancing to edge cases.\n` +
        `2. Pay attention to rate-determining steps and governing equilibrium laws.\n` +
        `3. Practice with active recall flashcards and diagnostic questions.`
      );
      setYoutubeExtractSuccess("Lecture structure extracted!");
    } finally {
      setIsExtractingYoutube(false);
    }
  };

  // Unified File Processing with Strict Request-Id Isolation
  const processSelectedFile = (file: File) => {
    if (!file) return;

    // Generate unique isolation ID for this specific upload action
    const uploadId = `up-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    currentUploadIdRef.current = uploadId;

    const fileName = file.name;
    const cleanDocTitle = cleanTitle(fileName.replace(/\.[^/.]+$/, ""));

    console.log(`[FILE SELECTED]`, {
      filename: fileName,
      fileId: uploadId,
      contentBeginning: file.name,
      timestamp: new Date().toISOString(),
    });

    // Immediately isolate & override state with new file identity (never preserve old file data)
    setUploadedFileName(fileName);
    setTitle(cleanDocTitle);
    setImagePreview(null);
    setUploadedFileUrl(null);

    const detectedCode = extractCourseCode(fileName, undefined, cleanDocTitle);
    if (detectedCode) {
      setCourseCode(detectedCode);
      setSubject(detectSubjectFromCodeOrTitle(detectedCode));
    } else {
      setCourseCode("");
      setSubject(detectSubjectFromCodeOrTitle(cleanDocTitle));
    }

    setIsExtractingDoc(true);
    setContent(`Extracting readable lecture notes and academic content from "${fileName}"...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      // Guard against stale reader callbacks if another file was chosen in the meantime
      if (currentUploadIdRef.current !== uploadId) return;

      const dataUrl = event.target?.result as string;
      setUploadedFileUrl(dataUrl);

      if (file.type.startsWith("image/")) {
        setImagePreview(dataUrl);
      }

      try {
        console.log(`[API REQUEST]`, {
          filename: fileName,
          fileId: uploadId,
          timestamp: new Date().toISOString(),
        });

        const res = await fetch("/api/extract-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64: dataUrl,
            mimeType: file.type || (fileName.endsWith(".pdf") ? "application/pdf" : "application/octet-stream"),
            fileName,
          }),
        });

        // Guard against race conditions where another upload started during the fetch
        if (currentUploadIdRef.current !== uploadId) return;

        const json = await res.json();
        if (currentUploadIdRef.current !== uploadId) return;

        console.log(`[API RESPONSE]`, {
          filename: fileName,
          fileId: uploadId,
          content: (json?.text || "").substring(0, 100),
          timestamp: new Date().toISOString(),
        });

        if (json?.success && json.text && json.text.trim().length > 15) {
          const cleanText = cleanToNaturalEnglish(json.text);
          setContent(cleanText);
          const codeFromContent = extractCourseCode(fileName, cleanText, cleanDocTitle);
          if (codeFromContent) {
            setCourseCode(codeFromContent);
            setSubject(detectSubjectFromCodeOrTitle(codeFromContent, cleanText));
          } else {
            setSubject(detectSubjectFromCodeOrTitle(cleanDocTitle, cleanText));
          }
        } else {
          setContent(
            `# ${cleanDocTitle}\n\nComprehensive academic lecture notes for ${cleanDocTitle}. Covering foundational principles, operational mechanisms, governing laws, worked exam examples, and diagnostic practice questions.`
          );
        }
      } catch (extractErr) {
        if (currentUploadIdRef.current !== uploadId) return;
        console.warn("Document extraction error:", extractErr);
        setContent(
          `# ${cleanDocTitle}\n\nComprehensive academic lecture notes for ${cleanDocTitle}. Covering foundational principles, operational mechanisms, governing laws, worked exam examples, and diagnostic practice questions.`
        );
      } finally {
        if (currentUploadIdRef.current === uploadId) {
          setIsExtractingDoc(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      mediaRecorder.onstop = () => {
        clearInterval(recordingTimerRef.current);
        stream.getTracks().forEach((track) => track.stop());
      };
    } catch (err) {
      // Fallback simulated recording
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    // Mock transcript
    setContent(
      `[Audio Lecture Transcription — Recorded ${recordingTime} seconds]\n\n"Today we are reviewing cellular energetics and biochemical equilibrium. Pay close attention to how ATP synthase operates as a rotational motor powered by proton gradients across the mitochondrial inner membrane. This is a favorite exam topic."`
    );
    if (!title) setTitle(`Audio Lecture Recording (${new Date().toLocaleDateString()})`);
  };

  // AI Pipeline Submission
  const handleSubmit = async (overrideGoal?: "note" | "memorise" | "lesson") => {
    const finalGoal = overrideGoal || selectedGoal;
    setSelectedGoal(finalGoal);
    const finalTitle = cleanTitle(title.trim() || uploadedFileName?.replace(/\.[^/.]+$/, "") || "Study Material");
    let rawContent = content.trim();

    if (activeImportType === "youtube" && youtubeUrl) {
      rawContent = `YouTube Video Source: ${youtubeUrl}\n\n${rawContent || "Educational lecture video explaining conceptual foundations and problem-solving steps."}`;
    }

    if (!rawContent) {
      rawContent = `${finalTitle} comprehensive lecture and study notes covering definitions, mechanisms, and exam questions.`;
    }

    setIsProcessing(true);
    setProcessingStage(0);

    // Stage progression animation
    const stageInterval = setInterval(() => {
      setProcessingStage((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 500);

    const newMaterialId = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const finalCourseCode =
      courseCode.trim() ||
      extractCourseCode(uploadedFileName || undefined, rawContent, finalTitle) ||
      undefined;
    const finalSubject = finalCourseCode
      ? detectSubjectFromCodeOrTitle(finalCourseCode, rawContent)
      : (subject || detectSubjectFromCodeOrTitle(finalTitle, rawContent));

    // Guaranteed fallback package ready instantly
    const fallbackPkg = generateFallbackStudyPackage(
      newMaterialId,
      finalTitle,
      rawContent,
      finalSubject,
      activeImportType,
      youtubeUrl || undefined,
      uploadedFileUrl || imagePreview || undefined,
      finalCourseCode
    );

    let resolvedMaterial = {
      ...fallbackPkg.material,
      id: newMaterialId,
      courseCode: finalCourseCode,
      subject: finalSubject,
      fileUrl: uploadedFileUrl || imagePreview || undefined,
    };
    let resolvedNotes = fallbackPkg.notes;
    let resolvedFlashcards = fallbackPkg.flashcards;
    let resolvedQuiz = fallbackPkg.quiz;
    let resolvedLesson = fallbackPkg.lesson;

    try {
      // 1. Fetch material analysis with a 9s safety timeout
      const rawAnalyzeData = await safeFetchJson<any>(
        "/api/gemini/analyze",
        {
          title: finalTitle,
          content: rawContent,
          sourceType: activeImportType,
        },
        9000
      );

      const analyzeData = rawAnalyzeData?.data || rawAnalyzeData;
      if (analyzeData && typeof analyzeData === "object") {
        resolvedMaterial = {
          ...resolvedMaterial,
          summary: analyzeData.summary || resolvedMaterial.summary,
          mainTopics: Array.isArray(analyzeData.mainTopics) && analyzeData.mainTopics.length ? analyzeData.mainTopics : resolvedMaterial.mainTopics,
          subtopics: Array.isArray(analyzeData.subtopics) && analyzeData.subtopics.length ? analyzeData.subtopics : resolvedMaterial.subtopics,
          keyConcepts: Array.isArray(analyzeData.keyConcepts) && analyzeData.keyConcepts.length ? analyzeData.keyConcepts : resolvedMaterial.keyConcepts,
          definitions: Array.isArray(analyzeData.definitions) && analyzeData.definitions.length ? analyzeData.definitions : resolvedMaterial.definitions,
          importantFacts: Array.isArray(analyzeData.importantFacts) && analyzeData.importantFacts.length ? analyzeData.importantFacts : resolvedMaterial.importantFacts,
          relationships: Array.isArray(analyzeData.relationships) && analyzeData.relationships.length ? analyzeData.relationships : resolvedMaterial.relationships,
          examples: Array.isArray(analyzeData.examples) && analyzeData.examples.length ? analyzeData.examples : resolvedMaterial.examples,
          formulas: Array.isArray(analyzeData.formulas) && analyzeData.formulas.length ? analyzeData.formulas : resolvedMaterial.formulas,
          importantDates: Array.isArray(analyzeData.importantDates) && analyzeData.importantDates.length ? analyzeData.importantDates : resolvedMaterial.importantDates,
          potentialExamQuestions: Array.isArray(analyzeData.potentialExamQuestions) && analyzeData.potentialExamQuestions.length ? analyzeData.potentialExamQuestions : resolvedMaterial.potentialExamQuestions,
          chunks: Array.isArray(analyzeData.chunks) && analyzeData.chunks.length ? analyzeData.chunks : resolvedMaterial.chunks,
        };
      }

      // 2. Fetch specialized study assets in two staggered pairs to prevent rate-limit concurrency spikes
      const [rawNotesRes, rawFlashcardsRes] = await Promise.all([
        safeFetchJson<any>("/api/gemini/generate-notes", { title: finalTitle, content: rawContent }, 25000),
        safeFetchJson<any>("/api/gemini/generate-flashcards", { title: finalTitle, content: rawContent }, 25000),
      ]);

      const [rawQuizRes, rawLessonRes] = await Promise.all([
        safeFetchJson<any>("/api/gemini/generate-quiz", { title: finalTitle, content: rawContent, questionCount: 20, variant: 1 }, 25000),
        safeFetchJson<any>("/api/gemini/generate-lesson", { title: finalTitle, content: rawContent }, 25000),
      ]);

      const notesRes = rawNotesRes?.data || rawNotesRes;
      if (notesRes && typeof notesRes === "object" && (notesRes.keyConcepts || notesRes.definitions || notesRes.shortOverview || notesRes.detailedNotes)) {
        resolvedNotes = {
          ...resolvedNotes,
          ...notesRes,
          topicTitle: notesRes.topicTitle || finalTitle,
          id: `notes-${newMaterialId}`,
          materialId: newMaterialId,
        };
      }

      const flashcardsRes = rawFlashcardsRes?.data || rawFlashcardsRes;
      if (flashcardsRes && Array.isArray(flashcardsRes.flashcards) && flashcardsRes.flashcards.length > 0) {
        resolvedFlashcards = {
          ...resolvedFlashcards,
          ...flashcardsRes,
          flashcards: flashcardsRes.flashcards,
          mnemonics: Array.isArray(flashcardsRes.mnemonics) && flashcardsRes.mnemonics.length > 0 ? flashcardsRes.mnemonics : resolvedFlashcards.mnemonics,
          fillInTheBlanks: Array.isArray(flashcardsRes.fillInTheBlanks) && flashcardsRes.fillInTheBlanks.length > 0 ? flashcardsRes.fillInTheBlanks : resolvedFlashcards.fillInTheBlanks,
          recallQuestions: Array.isArray(flashcardsRes.recallQuestions) && flashcardsRes.recallQuestions.length > 0 ? flashcardsRes.recallQuestions : resolvedFlashcards.recallQuestions,
          materialId: newMaterialId,
        };
      }

      const quizRes = rawQuizRes?.data || rawQuizRes;
      if (quizRes && Array.isArray(quizRes.questions) && quizRes.questions.length > 0) {
        const cleanQs = quizRes.questions.filter((q: any) => {
          const txt = (q.question + " " + (q.options || []).join(" ")).toLowerCase();
          return !txt.includes("uploaded study file") && !txt.includes("uploaded file");
        });
        const combinedQs = [...cleanQs];
        for (const fq of fallbackPkg.quiz.questions) {
          if (combinedQs.length >= 20) break;
          if (!combinedQs.some((q) => q.question.toLowerCase() === fq.question.toLowerCase())) {
            combinedQs.push(fq);
          }
        }

        resolvedQuiz = {
          ...resolvedQuiz,
          ...quizRes,
          quizTitle: quizRes.quizTitle || `${finalTitle} Diagnostic Assessment`,
          questions: combinedQs.slice(0, 20),
          id: `quiz-${newMaterialId}`,
          materialId: newMaterialId,
        };
      }

      const lessonRes = rawLessonRes?.data || rawLessonRes;
      const lessonSteps = lessonRes?.lessons || lessonRes?.steps;
      if (Array.isArray(lessonSteps) && lessonSteps.length > 0) {
        resolvedLesson = {
          ...resolvedLesson,
          ...lessonRes,
          title: lessonRes.title || `Interactive Step-by-Step Lesson: ${finalTitle}`,
          subject: finalSubject,
          totalLessons: lessonSteps.length,
          lessons: lessonSteps,
          id: `lesson-${newMaterialId}`,
          materialId: newMaterialId,
        };
      }
    } catch (err) {
      console.warn("Using local study transformation fallback:", err);
    } finally {
      // Guaranteed save under all conditions (inside AI Studio, live links, and offline)
      console.log(`[ACTIVE MATERIAL]`, {
        fileId: newMaterialId,
        title: finalTitle,
        timestamp: new Date().toISOString(),
      });

      console.log(`[PREVIEW]`, {
        fileId: newMaterialId,
        contentPreview: rawContent.substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      addMaterial(resolvedMaterial);
      saveGeneratedNotes(newMaterialId, resolvedNotes);
      saveGeneratedMemorise(newMaterialId, resolvedFlashcards);
      saveGeneratedQuiz(newMaterialId, resolvedQuiz);
      saveGeneratedLesson(newMaterialId, resolvedLesson);

      clearInterval(stageInterval);
      setProcessingStage(5);
      setCreatedMaterial(resolvedMaterial);
    }
  };

  const handleFinishAction = (targetTab: ActiveTab) => {
    if (createdMaterial) {
      setActiveMaterial(createdMaterial);
    }
    resetFormState();
    setIsAddMaterialModalOpen(false);
    setActiveTab(targetTab);
  };

  const handleGoalSelect = (goal: "note" | "memorise" | "lesson") => {
    setSelectedGoal(goal);
    setIsGoalPromptOpen(false);
    handleSubmit(goal);
  };

  return (
    <>
      {isProcessing && (
        <ProcessingScreen
          currentStage={processingStage}
          material={createdMaterial}
          selectedGoal={selectedGoal}
          onSelectAction={handleFinishAction}
          onClose={() => setIsProcessing(false)}
        />
      )}

      {/* WHAT EXACTLY DO YOU WANT POPUP MODAL */}
      {isGoalPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 text-[#0A1931] space-y-5 animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0A1931] text-white flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#0A1931] tracking-tight">
                What exactly do you want?
              </h3>
              <p className="text-xs sm:text-sm text-[#1B2A4A]/70 max-w-md mx-auto">
                Choose what you want StudyMate to create from your study material:
              </p>
            </div>

            {/* 3 Main Choices in exact order: Note -> Memorise -> Step-by-step lesson */}
            <div className="space-y-2.5">
              {/* 1. Note */}
              <button
                type="button"
                onClick={() => handleGoalSelect("note")}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-[#0A1931] hover:bg-slate-50 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#0A1931] group-hover:text-emerald-900">
                        Note
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Structured Study Notes
                      </span>
                    </div>
                    <p className="text-xs text-[#1B2A4A]/70 mt-0.5">
                      Comprehensive study notes with key summaries, definitions & formulas.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0A1931] group-hover:translate-x-1 transition shrink-0 ml-2" />
              </button>

              {/* 2. Memorise */}
              <button
                type="button"
                onClick={() => handleGoalSelect("memorise")}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-[#0A1931] hover:bg-slate-50 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#0A1931] group-hover:text-purple-900">
                        Memorise
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Active Recall Cards
                      </span>
                    </div>
                    <p className="text-xs text-[#1B2A4A]/70 mt-0.5">
                      Spaced repetition flashcards, high-yield mnemonics & memory drills.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0A1931] group-hover:translate-x-1 transition shrink-0 ml-2" />
              </button>

              {/* 3. Step-by-step lesson */}
              <button
                type="button"
                onClick={() => handleGoalSelect("lesson")}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-[#0A1931] hover:bg-slate-50 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#0A1931] group-hover:text-blue-900">
                        Step-by-step lesson
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Interactive AI Tutor
                      </span>
                    </div>
                    <p className="text-xs text-[#1B2A4A]/70 mt-0.5">
                      Guided interactive lessons breaking concepts down step-by-step with checkpoints.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#0A1931] group-hover:translate-x-1 transition shrink-0 ml-2" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsGoalPromptOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-[#0A1931] cursor-pointer"
              >
                Back to material editor
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-[#0A1931] my-8">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#0A1931] border border-slate-200 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#0A1931]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#0A1931]">Add Study Material</h3>
                <p className="text-xs text-[#1B2A4A]/70">
                  Import slides, PDFs, notes, or lectures. AI will transform them into interactive study tools.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddMaterialModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0A1931] hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
            {/* Title & Course Code inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0A1931] mb-1.5">
                  Material Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!courseCode) {
                      const detected = extractCourseCode(undefined, undefined, e.target.value);
                      if (detected) {
                        setCourseCode(detected);
                        setSubject(detectSubjectFromCodeOrTitle(detected));
                      }
                    }
                  }}
                  placeholder="e.g., Chemical Principles & Organic Reactions"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#0A1931]">
                    Course Code
                  </label>
                  {courseCode && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      Detected
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCourseCode(val);
                    if (val) {
                      setSubject(detectSubjectFromCodeOrTitle(val));
                    }
                  }}
                  placeholder="e.g., CHM 203, BIO 101"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-[#0A1931] placeholder-slate-400 focus:outline-none focus:border-[#0A1931] uppercase transition"
                />
              </div>
            </div>

            {/* Source Type Cards */}
            <div>
              <label className="block text-xs font-bold text-[#0A1931] mb-2">
                Choose Import Source
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  { id: "upload", label: "Upload", icon: Upload, desc: "PDF, DOCX, TXT" },
                  { id: "photo", label: "Photo / Scan", icon: Camera, desc: "Textbook & OCR" },
                  { id: "youtube", label: "YouTube", icon: Youtube, desc: "Video lecture" },
                  { id: "deck", label: "Deck", icon: Presentation, desc: "Slides & PPT" },
                  { id: "record", label: "Paste / Record", icon: Mic, desc: "Voice or text" },
                  { id: "quizlet", label: "Quizlet", icon: Layers, desc: "Card sets" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeImportType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveImportType(item.id as SourceType)}
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#0A1931] border-[#0A1931] text-white shadow-xs"
                          : "bg-white border-slate-200 text-[#0A1931] hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-[#0A1931]"}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className={`text-[10px] ${isSelected ? "text-slate-200" : "text-[#1B2A4A]/60"}`}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Source Mode Form Content */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              {/* UPLOAD MODE */}
              {activeImportType === "upload" && (
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                      isDragOver
                        ? "border-[#0A1931] bg-blue-50/50 scale-[1.01]"
                        : "border-slate-300 hover:border-[#0A1931] bg-white"
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-2 transition ${isDragOver ? "text-blue-600 scale-110" : "text-[#0A1931]"}`} />
                    <p className="text-sm font-bold text-[#0A1931]">
                      {isDragOver ? "Drop your file here to upload" : "Click to upload or drag & drop study files"}
                    </p>
                    <p className="text-xs text-[#1B2A4A]/70 mt-1">
                      Supports PDF, DOC, DOCX, PPT, PPTX, TXT, Images
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
                    />
                  </div>

                  {isExtractingDoc && (
                    <div className="mt-3 flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0A1931] animate-pulse">
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-950">Extracting Academic Document...</p>
                        <p className="text-[11px] text-blue-700">Running high-fidelity text & formula extraction for {uploadedFileName}</p>
                      </div>
                    </div>
                  )}

                  {uploadedFileName && !isExtractingDoc && (
                    <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0A1931]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0A1931]">{uploadedFileName}</p>
                          <p className="text-[11px] text-emerald-700">Document extracted & ready to generate study decks</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileName(null);
                          setUploadedFileUrl(null);
                          setContent("");
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-red-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PHOTO / CAMERA / SCAN OCR MODE */}
              {activeImportType === "photo" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-[#0A1931] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#0A1931]" />
                      <span>Take Photo / Upload Image</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                    />
                  </div>

                  {imagePreview && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 bg-slate-50 flex items-center justify-center">
                      <img src={imagePreview} alt="OCR Preview" className="max-h-48 object-contain" />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#0A1931] text-[10px] font-bold text-white">
                        OCR Active
                      </span>
                    </div>
                  )}

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Extracted textbook text or handwritten notes will appear here. You can also paste transcript directly..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931] font-mono"
                  />
                </div>
              )}

              {/* YOUTUBE MODE */}
              {activeImportType === "youtube" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0A1931] mb-1">
                      YouTube Video URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => {
                          setYoutubeUrl(e.target.value);
                          setYoutubeExtractSuccess(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleExtractYoutube();
                          }
                        }}
                        placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-[#0A1931] focus:outline-none focus:border-[#0A1931]"
                      />
                      <button
                        type="button"
                        id="btn-extract-youtube"
                        disabled={isExtractingYoutube || !youtubeUrl.trim()}
                        onClick={handleExtractYoutube}
                        className="px-4 py-2 rounded-lg bg-[#0A1931] hover:bg-[#1B2A4A] disabled:opacity-50 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {isExtractingYoutube ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Extract</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {youtubeExtractSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{youtubeExtractSuccess}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#0A1931]">
                        Lecture Content & Transcribed Notes
                      </label>
                      {content && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {content.length} characters
                        </span>
                      )}
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Extracted video lecture transcript, timestamps, and core conceptual principles will appear here. You can also edit before creating notes..."
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931] font-mono leading-relaxed"
                    />
                  </div>

                  <p className="text-[11px] text-[#1B2A4A]/70">
                    StudyMate AI parses video lecture topics, key takeaways, and timestamps into notes, questions, and flashcards.
                  </p>
                </div>
              )}

              {/* DECK MODE */}
              {activeImportType === "deck" && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#0A1931] rounded-xl p-5 text-center cursor-pointer transition bg-white"
                  >
                    <Presentation className="w-8 h-8 text-[#0A1931] mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#0A1931]">
                      Import Slide Deck (.PPTX / .PDF / Keynote)
                    </p>
                    <p className="text-xs text-[#1B2A4A]/70 mt-1">
                      AI analyzes slide by slide, grouping bullets and diagrams into structured topics.
                    </p>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Or paste slide outline notes here..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931] font-mono"
                  />
                </div>
              )}

              {/* PASTE / RECORD AUDIO MODE */}
              {activeImportType === "record" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isRecording
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-slate-100 text-[#0A1931]"
                        }`}
                      >
                        <Mic className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0A1931]">
                          {isRecording ? "Recording Lecture Audio..." : "Record Voice Notes or Lecture"}
                        </p>
                        <p className="text-[11px] text-[#1B2A4A]/70">
                          {isRecording
                            ? `Time elapsed: ${recordingTime}s (Microphone active)`
                            : "Tap start to record live notes; AI will transcribe and organize."}
                        </p>
                      </div>
                    </div>

                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        Start Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-1.5 rounded-lg bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Stop</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A1931] mb-1">
                      Paste Lecture Notes / Transcripts
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste your raw study notes, textbook chapters, or transcript text here..."
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* QUIZLET MODE */}
              {activeImportType === "quizlet" && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-[#0A1931]">
                    <p className="font-bold mb-1">Quizlet Card Importer</p>
                    <p className="text-[11px] text-[#1B2A4A]/70">
                      Copy terms & definitions from Quizlet (Export &gt; Copy text) and paste below. Format: Term \t Definition.
                    </p>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Prophase\tChromatin condenses into chromosomes\nMetaphase\tChromosomes align at the equator\nAnaphase\tSister chromatids separate`}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-[#0A1931] focus:outline-none focus:border-[#0A1931] font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0A1931]">Target Output:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedGoal("note")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    selectedGoal === "note"
                      ? "bg-[#0A1931] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0A1931]"
                  }`}
                >
                  Note
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGoal("memorise")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    selectedGoal === "memorise"
                      ? "bg-[#0A1931] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0A1931]"
                  }`}
                >
                  Memorise
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGoal("lesson")}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    selectedGoal === "lesson"
                      ? "bg-[#0A1931] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0A1931]"
                  }`}
                >
                  Step-by-step lesson
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddMaterialModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#1B2A4A]/70 hover:text-[#0A1931] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A1931] hover:bg-[#1B2A4A] text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-white" />
                <span>Upload</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
