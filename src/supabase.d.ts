import { SupabaseClient } from "@supabase/supabase-js";
import {
  StudyMaterial,
  StudyNotes,
  Flashcard,
  MemorisePack,
  Quiz,
  StepLesson,
  StudyPlan,
} from "./types";

export const supabase: SupabaseClient;
export const SUPABASE_URL: string;
export const SUPABASE_ANON_KEY: string;
export function isSupabaseConfigured(): boolean;

export function uploadStudyMaterialFile(
  file: File | Blob | string,
  fileName?: string,
  bucket?: string
): Promise<{
  publicUrl: string;
  path: string;
  success: boolean;
  isLocalFallback?: boolean;
  warning?: string;
  error?: string;
}>;

export function saveMaterialToDatabase(material: StudyMaterial): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  data?: any;
  error?: string;
}>;

export function saveNotesToDatabase(materialId: string, notes: StudyNotes): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  data?: any;
  error?: string;
}>;

export function saveFlashcardsToDatabase(materialId: string, flashcards: Flashcard[]): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  data?: any;
  error?: string;
}>;

export function saveQuizToDatabase(materialId: string, quiz: Quiz): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  data?: any;
  error?: string;
}>;

export function saveLessonToDatabase(materialId: string, lesson: StepLesson): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  data?: any;
  error?: string;
}>;

export function saveMemorisePackToDatabase(materialId: string, memorisePack: MemorisePack): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  data?: any;
  error?: string;
}>;

export function saveFullStudyPackageToSupabase(params: {
  file?: File | Blob | string | null;
  fileName?: string;
  material: StudyMaterial;
  notes?: StudyNotes | null;
  memorisePack?: MemorisePack | null;
  quiz?: Quiz | null;
  lesson?: StepLesson | null;
}): Promise<{
  fileUrl: string | null;
  storagePath: string | null;
  materialSaved: boolean;
  notesSaved: boolean;
  flashcardsSaved: boolean;
  quizSaved?: boolean;
  lessonSaved?: boolean;
}>;

export function fetchMaterialsFromSupabase(): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  data: StudyMaterial[];
  error?: string;
}>;

export function fetchFullStudyDataFromSupabase(): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  data: {
    materials: StudyMaterial[];
    notes: Record<string, StudyNotes>;
    memorisePacks: Record<string, MemorisePack>;
    quizzes: Record<string, Quiz>;
    lessons: Record<string, StepLesson>;
    studyPlan: StudyPlan | null;
  } | null;
  error?: string;
}>;

export function deleteMaterialFromDatabase(materialId: string): Promise<{
  success: boolean;
  isLocalFallback?: boolean;
  error?: string;
}>;

export function getSupabaseTablesSql(): string;
