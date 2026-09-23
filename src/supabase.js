import { createClient } from "@supabase/supabase-js";

// Safe Vite / Vercel Environment Variable access
export const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  (typeof process !== "undefined" && process.env && (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  "";

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY)) ||
  (typeof process !== "undefined" && process.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY)) ||
  "";

export const isSupabaseConfigured = () => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("placeholder") &&
    !SUPABASE_ANON_KEY.includes("placeholder") &&
    (SUPABASE_URL.startsWith("https://") || SUPABASE_URL.startsWith("http://"))
  );
};

// Safe client initializer (never crashes the app if keys are not yet provided)
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient(
      "https://xyzcompany.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder_key"
    );

const BUCKET_NAME = "study-materials";

/**
 * Uploads an uploaded study file to Supabase Storage bucket 'study-materials'.
 * If Supabase is not configured or bucket has permission restrictions, provides a resilient client-side URL
 * so study generation and learning are never interrupted.
 */
export async function uploadStudyMaterialFile(
  file,
  fileName,
  bucket = BUCKET_NAME
) {
  const timestamp = Date.now();
  const safeName = (fileName || "material_document")
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "_");
  const filePath = `uploads/${timestamp}_${safeName}`;

  const createLocalFallbackUrl = () => {
    if (file instanceof Blob || (typeof File !== "undefined" && file instanceof File)) {
      return URL.createObjectURL(file);
    } else if (typeof file === "string") {
      return `data:text/plain;charset=utf-8,${encodeURIComponent(file.slice(0, 5000))}`;
    }
    return filePath;
  };

  if (!isSupabaseConfigured()) {
    console.info(
      "[Supabase] Supabase credentials not configured in VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. Using local URL."
    );
    const fallbackUrl = createLocalFallbackUrl();
    return {
      publicUrl: fallbackUrl || filePath,
      path: filePath,
      success: true,
      isLocalFallback: true,
    };
  }

  try {
    // 1. Upload to Supabase Storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.warn(
        `[Supabase Storage Notice] Upload to bucket "${bucket}" returned: ${uploadError.message}. Using resilient fallback URL so studying proceeds uninterrupted.`,
        `Tip: Run the SQL schema in Supabase SQL editor to create the "${bucket}" public bucket.`
      );
      const fallbackUrl = createLocalFallbackUrl();
      return {
        publicUrl: fallbackUrl,
        path: filePath,
        success: true,
        isLocalFallback: true,
        warning: uploadError.message,
      };
    }

    // 2. Get Public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl || createLocalFallbackUrl();

    return {
      publicUrl,
      path: uploadData?.path || filePath,
      success: true,
      isLocalFallback: false,
    };
  } catch (err) {
    console.warn("[Supabase Storage] Exception during upload, using fallback URL:", err);
    const fallbackUrl = createLocalFallbackUrl();
    return {
      publicUrl: fallbackUrl,
      path: filePath,
      success: true,
      isLocalFallback: true,
      warning: err?.message || "Storage upload exception",
    };
  }
}

/**
 * Saves study material record to Supabase Database table 'study_materials'.
 */
export async function saveMaterialToDatabase(material) {
  if (!isSupabaseConfigured()) {
    return { success: true, isLocalFallback: true, data: material };
  }

  try {
    const payload = {
      id: material.id,
      title: material.title,
      subject: material.subject,
      source_type: material.sourceType,
      source_url: material.sourceUrl || null,
      file_url: material.fileUrl || null,
      storage_path: material.storagePath || null,
      raw_text: material.rawText ? material.rawText.slice(0, 50000) : null,
      summary: material.summary || "",
      main_topics: material.mainTopics || [],
      subtopics: material.subtopics || [],
      key_concepts: material.keyConcepts || [],
      definitions: material.definitions || [],
      formulas: material.formulas || [],
      potential_exam_questions: material.potentialExamQuestions || [],
      progress_percent: material.progressPercent || 0,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("study_materials")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) {
      console.warn("[Supabase DB] saveMaterial error:", error.message);
      return { success: false, error: error.message, isLocalFallback: true };
    }

    return { success: true, data };
  } catch (err) {
    console.warn("[Supabase DB] saveMaterial exception:", err);
    return { success: true, isLocalFallback: true, error: err?.message };
  }
}

/**
 * Saves structured notes to Supabase Database table 'generated_notes'.
 */
export async function saveNotesToDatabase(materialId, notes) {
  if (!isSupabaseConfigured() || !notes) {
    return { success: true, isLocalFallback: true };
  }

  try {
    const payload = {
      id: notes.id || `notes-${materialId}`,
      material_id: materialId,
      topic_title: notes.topicTitle || "",
      subject: notes.subject || "",
      short_overview: notes.shortOverview || "",
      key_concepts: notes.keyConcepts || [],
      definitions: notes.definitions || [],
      important_details: notes.importantDetails || [],
      examples: notes.examples || [],
      formulas: notes.formulas || [],
      common_mistakes: notes.commonMistakes || [],
      quick_recap: notes.quickRecap || [],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("generated_notes")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) {
      console.warn("[Supabase DB] saveNotes error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.warn("[Supabase DB] saveNotes exception:", err);
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Saves flashcards to Supabase Database table 'flashcards'.
 */
export async function saveFlashcardsToDatabase(materialId, flashcards) {
  if (!isSupabaseConfigured() || !flashcards || !flashcards.length) {
    return { success: true, isLocalFallback: true };
  }

  try {
    const rows = flashcards.map((fc, idx) => ({
      id: fc.id || `fc-${materialId}-${idx}`,
      material_id: materialId,
      front: fc.front,
      back: fc.back,
      hint: fc.hint || "",
      difficulty: fc.difficulty || "medium",
      category: fc.category || "General",
      review_count: fc.reviewCount || 0,
      mastered: Boolean(fc.mastered),
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("flashcards")
      .upsert(rows, { onConflict: "id" })
      .select();

    if (error) {
      console.warn("[Supabase DB] saveFlashcards error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.warn("[Supabase DB] saveFlashcards exception:", err);
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Convenience workflow method:
 * Takes the material, generated notes, and flashcards, and persists them into Supabase
 * Storage and Database tables before advancing the UI loading screen.
 */
export async function saveFullStudyPackageToSupabase({
  file,
  fileName,
  material,
  notes,
  memorisePack,
}) {
  const result = {
    fileUrl: null,
    storagePath: null,
    materialSaved: false,
    notesSaved: false,
    flashcardsSaved: false,
  };

  // 1. Upload original file to Supabase Storage if file is present
  if (file) {
    try {
      const storageResult = await uploadStudyMaterialFile(
        file,
        fileName || material.title || "study_document"
      );
      result.fileUrl = storageResult.publicUrl;
      result.storagePath = storageResult.path;
      if (material) {
        material.fileUrl = storageResult.publicUrl;
        material.storagePath = storageResult.path;
      }
    } catch (e) {
      console.warn("[Supabase] Storage upload failed:", e);
    }
  }

  // 2. Save material metadata to 'study_materials' table
  if (material) {
    try {
      await saveMaterialToDatabase(material);
      result.materialSaved = true;
    } catch (e) {
      console.warn("[Supabase] Material DB save error:", e);
    }
  }

  // 3. Save generated notes to 'generated_notes' table
  if (material && notes) {
    try {
      await saveNotesToDatabase(material.id, notes);
      result.notesSaved = true;
    } catch (e) {
      console.warn("[Supabase] Notes DB save error:", e);
    }
  }

  // 4. Save flashcards to 'flashcards' table
  if (material && memorisePack?.flashcards) {
    try {
      await saveFlashcardsToDatabase(material.id, memorisePack.flashcards);
      result.flashcardsSaved = true;
    } catch (e) {
      console.warn("[Supabase] Flashcards DB save error:", e);
    }
  }

  return result;
}

/**
 * Fetch all study materials from Supabase Database table 'study_materials'.
 */
export async function fetchMaterialsFromSupabase() {
  if (!isSupabaseConfigured()) {
    return { success: false, isLocalFallback: true, data: [] };
  }

  try {
    const { data, error } = await supabase
      .from("study_materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Supabase DB] fetchMaterials error:", error.message);
      return { success: false, error: error.message, data: [] };
    }

    // Map database snake_case columns back to StudyMaterial camelCase
    const formatted = (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      fileUrl: row.file_url,
      storagePath: row.storage_path,
      rawText: row.raw_text || "",
      summary: row.summary || "",
      dateAdded: (row.created_at || "").split("T")[0] || new Date().toISOString().split("T")[0],
      mainTopics: row.main_topics || [],
      subtopics: row.subtopics || [],
      keyConcepts: row.key_concepts || [],
      definitions: row.definitions || [],
      importantFacts: [],
      relationships: [],
      examples: [],
      formulas: row.formulas || [],
      importantDates: [],
      potentialExamQuestions: row.potential_exam_questions || [],
      chunks: [],
      progressPercent: row.progress_percent || 0,
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.warn("[Supabase DB] fetchMaterials exception:", err);
    return { success: false, error: err?.message, data: [] };
  }
}

/**
 * Deletes a study material and its linked records from Supabase
 */
export async function deleteMaterialFromDatabase(materialId) {
  if (!isSupabaseConfigured() || !materialId) {
    return { success: true, isLocalFallback: true };
  }
  try {
    const { error } = await supabase
      .from("study_materials")
      .delete()
      .eq("id", materialId);
    if (error) {
      console.warn("[Supabase DB] deleteMaterial error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn("[Supabase DB] deleteMaterial exception:", err);
    return { success: true, isLocalFallback: true, error: err?.message };
  }
}

/**
 * Returns clean SQL statements for users to set up their Supabase tables in SQL Editor.
 */
export function getSupabaseTablesSql() {
  return `
-- ==============================================================================
-- STUDYMATE DATABASE SCHEMA (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. Storage Bucket for uploaded files (PDFs, Images, Audio, Docs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Bucket Policies (Allow public reads and uploads)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;
CREATE POLICY "Allow Public Uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'study-materials');

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  avatar TEXT,
  bio TEXT,
  education_level TEXT,
  institution TEXT,
  enrolled_subjects JSONB DEFAULT '[]'::jsonb,
  study_goals TEXT,
  study_preference TEXT DEFAULT 'both',
  xp INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  is_profile_public BOOLEAN DEFAULT true,
  allow_friend_requests BOOLEAN DEFAULT true,
  allow_group_invites BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Study Materials Table
CREATE TABLE IF NOT EXISTS public.study_materials (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  file_url TEXT,
  storage_path TEXT,
  raw_text TEXT,
  summary TEXT,
  main_topics JSONB DEFAULT '[]'::jsonb,
  subtopics JSONB DEFAULT '[]'::jsonb,
  key_concepts JSONB DEFAULT '[]'::jsonb,
  definitions JSONB DEFAULT '[]'::jsonb,
  formulas JSONB DEFAULT '[]'::jsonb,
  potential_exam_questions JSONB DEFAULT '[]'::jsonb,
  progress_percent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Generated Notes Table
CREATE TABLE IF NOT EXISTS public.generated_notes (
  id TEXT PRIMARY KEY,
  material_id TEXT REFERENCES public.study_materials(id) ON DELETE CASCADE,
  topic_title TEXT,
  subject TEXT,
  short_overview TEXT,
  key_concepts JSONB DEFAULT '[]'::jsonb,
  definitions JSONB DEFAULT '[]'::jsonb,
  important_details JSONB DEFAULT '[]'::jsonb,
  examples JSONB DEFAULT '[]'::jsonb,
  formulas JSONB DEFAULT '[]'::jsonb,
  common_mistakes JSONB DEFAULT '[]'::jsonb,
  quick_recap JSONB DEFAULT '[]'::jsonb,
  user_highlights JSONB DEFAULT '[]'::jsonb,
  personal_notes TEXT,
  is_bookmarked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Flashcards Table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id TEXT PRIMARY KEY,
  material_id TEXT REFERENCES public.study_materials(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  difficulty TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'General',
  review_count INT DEFAULT 0,
  last_rating TEXT,
  next_review_date TIMESTAMPTZ,
  mastered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  material_id TEXT REFERENCES public.study_materials(id) ON DELETE CASCADE,
  quiz_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  best_score NUMERIC DEFAULT 0,
  attempts_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id TEXT PRIMARY KEY,
  quiz_id TEXT REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  score INT NOT NULL,
  total_questions INT NOT NULL,
  user_answers JSONB DEFAULT '{}'::jsonb,
  wrong_question_ids JSONB DEFAULT '[]'::jsonb,
  weak_topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Step-by-Step Lessons Table
CREATE TABLE IF NOT EXISTS public.step_lessons (
  id TEXT PRIMARY KEY,
  material_id TEXT REFERENCES public.study_materials(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  total_lessons INT DEFAULT 0,
  current_step_index INT DEFAULT 0,
  lessons JSONB DEFAULT '[]'::jsonb,
  is_finished BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Study Groups Table
CREATE TABLE IF NOT EXISTS public.study_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  exam_date DATE,
  progress_percent INT DEFAULT 0,
  members JSONB DEFAULT '[]'::jsonb,
  shared_material_ids JSONB DEFAULT '[]'::jsonb,
  pinned_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Group Messages Table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  reply_to_id TEXT,
  reactions JSONB DEFAULT '{}'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON public.study_materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON public.study_materials(subject);
CREATE INDEX IF NOT EXISTS idx_notes_material_id ON public.generated_notes(material_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_material_id ON public.flashcards(material_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_material_id ON public.quizzes(material_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages(group_id, created_at ASC);

-- Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon / authenticated roles
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'user_profiles', 'study_materials', 'generated_notes',
      'flashcards', 'quizzes', 'quiz_attempts', 'step_lessons',
      'study_groups', 'group_messages', 'notifications'
    )
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Public full access %I" ON public.%I;
      CREATE POLICY "Public full access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;
`;
}
