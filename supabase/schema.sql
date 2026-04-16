-- ======================================================================================
-- SUPABASE SCHEMA SCRIPT
-- Teacher's Companion AI Database Implementation
-- Execute this entirely in the Supabase SQL Editor.
-- ======================================================================================

-- -------------------------------------------------------------
-- 1. Create Tables
-- -------------------------------------------------------------

-- A. Profiles (Extended auth.users table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  school_name TEXT,
  grade_level TEXT,
  subjects TEXT[], -- e.g. ARRAY['Math', 'Science']
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- B. Students
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT DEFAULT 'On Track' CHECK (status IN ('On Track', 'Needs Help', 'Advanced')),
  overall_grade NUMERIC(5,2) DEFAULT NULL, -- percentage
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- C. Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,
  standard_alignment TEXT,
  duration_minutes INTEGER,
  content JSONB, -- The AI generated lesson plan (stored as JSON)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- D. Assignments
--    student_id is NULLABLE so teachers can create assignments without a specific student
--    submission_text stores the student's written response for AI grading
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students (id) ON DELETE SET NULL, -- nullable
  lesson_id UUID REFERENCES public.lessons (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  submission_text TEXT,          -- Student's written answer for AI grading
  score NUMERIC(5,2),            -- e.g. 88.5
  ai_feedback TEXT,              -- AI-generated rubric feedback
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- E. AI Suggestions (Dashboard Highlights)
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('warning', 'info', 'success', 'error')),
  title TEXT NOT NULL,
  description TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- -------------------------------------------------------------
-- 2. Automatic Auth Trigger
-- -------------------------------------------------------------
-- When a user signs up on Supabase Auth, mirror their UUID instantly into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if it exists (prevents conflicts on re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Bind Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- -------------------------------------------------------------
-- 3. Row Level Security
-- -------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read and update only their own row
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING ( auth.uid() = id );
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING ( auth.uid() = id );
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );

-- Students: teachers can do everything on their own students
DROP POLICY IF EXISTS "Teachers can manage their own students" ON public.students;
CREATE POLICY "Teachers can manage their own students"
  ON public.students FOR ALL USING ( auth.uid() = teacher_id );

-- Lessons: teachers can do everything on their own lessons
DROP POLICY IF EXISTS "Teachers can manage their own lessons" ON public.lessons;
CREATE POLICY "Teachers can manage their own lessons"
  ON public.lessons FOR ALL USING ( auth.uid() = teacher_id );

-- Assignments: teachers can do everything on their own assignments
DROP POLICY IF EXISTS "Teachers can manage their own assignments" ON public.assignments;
CREATE POLICY "Teachers can manage their own assignments"
  ON public.assignments FOR ALL USING ( auth.uid() = teacher_id );

-- AI Suggestions: teachers can do everything on their own suggestions
DROP POLICY IF EXISTS "Teachers can view their own AI suggestions" ON public.ai_suggestions;
CREATE POLICY "Teachers can view their own AI suggestions"
  ON public.ai_suggestions FOR ALL USING ( auth.uid() = teacher_id );


-- -------------------------------------------------------------
-- 4. Migration helpers (run if tables already exist)
--    These are safe to run even if columns already exist.
-- -------------------------------------------------------------

-- Make student_id nullable if it was NOT NULL before
ALTER TABLE public.assignments
  ALTER COLUMN student_id DROP NOT NULL;

-- Add submission_text if it does not exist
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS submission_text TEXT;

-- Add graded_at if it does not exist
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

-- Add description if it does not exist
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add content if it does not exist
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS content JSONB;

-- -------------------------------------------------------------
-- 5. Chats
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own chats" ON public.chats FOR ALL USING ( auth.uid() = teacher_id );


-- -------------------------------------------------------------
-- 6. Student Details Additions
-- -------------------------------------------------------------
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS grade_level TEXT,
  ADD COLUMN IF NOT EXISTS parent_email TEXT,
  ADD COLUMN IF NOT EXISTS parent_phone TEXT;

-- -------------------------------------------------------------
-- 7. Profile Picture Additional Additions
-- -------------------------------------------------------------
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- -------------------------------------------------------------
-- 8. Profile Contact Details Additions
-- -------------------------------------------------------------
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS email_address TEXT;

-- -------------------------------------------------------------
-- 9. Profile Qualification Additions
-- -------------------------------------------------------------
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS qualification TEXT;

-- -------------------------------------------------------------
-- 10. Student Photo Additions
-- -------------------------------------------------------------
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;


-- =============================================================
-- 11. Library Books (User Uploaded Materials)
-- =============================================================

-- Table: library_books
-- Stores teacher-uploaded documents (PDFs, .docx, etc.) as Base64 strings.
CREATE TABLE IF NOT EXISTS public.library_books (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id  UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  file_name   TEXT        NOT NULL,
  file_data   TEXT        NOT NULL,  -- Base64 encoded file content (data URI)
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT — teachers can only view their own uploaded books
DROP POLICY IF EXISTS "Users can view their own books" ON public.library_books;
CREATE POLICY "Users can view their own books"
  ON public.library_books FOR SELECT
  USING ( auth.uid() = teacher_id );

-- Policy: INSERT — teachers can only insert books for themselves
DROP POLICY IF EXISTS "Users can insert their own books" ON public.library_books;
CREATE POLICY "Users can insert their own books"
  ON public.library_books FOR INSERT
  WITH CHECK ( auth.uid() = teacher_id );

-- Policy: UPDATE — teachers can only update their own books
DROP POLICY IF EXISTS "Users can update their own books" ON public.library_books;
CREATE POLICY "Users can update their own books"
  ON public.library_books FOR UPDATE
  USING ( auth.uid() = teacher_id );

-- Policy: DELETE — teachers can only delete their own books
DROP POLICY IF EXISTS "Users can delete their own books" ON public.library_books;
CREATE POLICY "Users can delete their own books"
  ON public.library_books FOR DELETE
  USING ( auth.uid() = teacher_id );

-- Auto-update the updated_at timestamp on any row change
CREATE OR REPLACE FUNCTION public.handle_library_book_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_library_books_updated_at ON public.library_books;
CREATE TRIGGER set_library_books_updated_at
  BEFORE UPDATE ON public.library_books
  FOR EACH ROW EXECUTE PROCEDURE public.handle_library_book_updated_at();
