import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Teachers Companion API is running.' });
});

// ── AI Chat reply ─────────────────────────────────────────────────────────────
// Generates a contextual reply using Gemini based on the message content.
app.post('/api/ai/suggest', async (req, res) => {
  try {
    const msg = (req.body.message || '').trim();
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.json({ reply: "⚠️ Please configure the GEMINI_API_KEY in the server/.env file to enable actual AI responses." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a helpful, professional, and empathetic AI teaching assistant named Teachers Companion. The user is a teacher asking for advice, ideas, or help. Keep your responses concise (under 100 words), practical, and friendly.\n\nTeacher says: "${msg}"`;
    
    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error("AI Suggest Error:", err);
    res.status(500).json({ reply: "Sorry, I ran into an issue connecting to the AI service. Please try again later." });
  }
});

// ── AI Lesson Plan Generator ──────────────────────────────────────────────────
app.post('/api/ai/lesson', async (req, res) => {
  try {
    const { topic = 'the topic', grade = 'Grade 5', duration = 45, standard = '' } = req.body;
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(400).json({ error: "Please configure GEMINI_API_KEY in the server to generate actual lesson plans." });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are an expert curriculum designer. Create a highly structured lesson plan.
Topic: ${topic}
Grade: ${grade}
Duration: ${duration} minutes
Standard/Alignment: ${standard}

You must return ONLY a valid JSON object with EXACTLY this structure:
{
  "objective": "A clear, student-facing learning objective",
  "materials": ["Item 1", "Item 2"],
  "standard": "The standard addressed, or a brief mention if not specified",
  "sections": [
    { "title": "Section Name (e.g., Warm-Up)", "duration": "X min", "activity": "Detailed description..." }
  ],
  "differentiation": {
    "support": "Strategies for struggling learners",
    "extension": "Strategies for advanced learners",
    "ell": "Strategies for English Language Learners"
  },
  "assessment": "Formative or summative assessment ideas"
}

Ensure the total duration of all sections adds up exactly to ${duration} minutes. Content must be highly specific to the given topic and grade level.`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const lessonPlan = JSON.parse(rawText);
    res.json({ lessonPlan });
  } catch (err) {
    console.error("AI Lesson Error:", err);
    res.status(500).json({ error: "Failed to generate lesson plan" });
  }
});

// ── AI Assignment Generator ──────────────────────────────────────────────────
app.post('/api/ai/assignment', async (req, res) => {
  try {
    const { topic = 'the topic', grade = 'Grade 5', type = 'Worksheet' } = req.body;
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(400).json({ error: "Please configure GEMINI_API_KEY in the server to generate assignments." });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are an expert curriculum designer. Create an assignment or worksheet.\nTopic: ${topic}\nGrade: ${grade}\nType: ${type}\n\nYou must return ONLY a valid JSON object with EXACTLY this structure:\n{\n  "instructions": "Overall instructions for the student",\n  "questions": [\n    { "type": "multiple_choice | short_answer | essay", "question": "The question text", "options": ["Option A", "Option B"] (only if multiple choice), "answer": "The correct answer or rubric expectations" }\n  ]\n}\nCreate 4 engaging and grade-appropriate questions.`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const assignmentContent = JSON.parse(rawText);
    res.json({ assignmentContent });
  } catch (err) {
    console.error("AI Assignment Error:", err);
    res.status(500).json({ error: "Failed to generate assignment" });
  }
});

// ── AI Auto-Grading ───────────────────────────────────────────────────────────
app.post('/api/ai/grade', async (req, res) => {
  try {
    const { title = 'Assignment', submission = '', rubric = '' } = req.body;
    const wordCount = submission.trim().split(/\s+/).filter(Boolean).length;
    
    if (!submission) {
      return res.json({ score: 0, grade: 'F', feedback: 'No submission provided.', wordCount: 0 });
    }
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(400).json({ error: "Please configure GEMINI_API_KEY in the server to enable AI grading." });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are a strict but constructive teacher grading a student's assignment.
Assignment Title: "${title}"
Student Submission:
"""
${submission}
"""
Grading Rubric or Criteria: ${rubric || "Grade based on general clarity, accuracy, and thoroughness."}

Evaluate the submission. You must return ONLY a valid JSON object with EXACTLY this structure:
{
  "score": <A number between 0 and 100>,
  "grade": "<A letter grade like A, B, C, D, or F>",
  "feedback": "<A paragraph of constructive feedback explaining the score and how to improve>"
}`;

    const result = await model.generateContent(prompt);
    let rawText = result.response.text();
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(rawText);

    res.json({
      score: data.score,
      grade: data.grade,
      feedback: data.feedback,
      wordCount
    });
  } catch (err) {
    console.error("AI Grading Error:", err);
    res.status(500).json({ error: "Failed to grade assignment. Please try again or provide a simpler submission." });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✅ Teachers Companion API running on http://localhost:${port}`);
});
