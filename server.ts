import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import { createRequire } from "module";
import "dotenv/config";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialization for Gemini AI
  let aiInstance: GoogleGenAI | null = null;
  
  function getAI() {
    if (!aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set. Please add it to your Secrets in AI Studio Settings.");
      }
      aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
  }

  const upload = multer({ storage: multer.memoryStorage() });

  // AI Routes
  app.post("/api/ai/parse-pdf", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file provided" });
      }

      let extracted_text = "";
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        extracted_text = pdfData.text;
      } else {
        extracted_text = req.file.buffer.toString('utf-8');
      }

      res.json({ success: true, data: { text: extracted_text } });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/ai/generate-course-notes", async (req, res) => {
    try {
      const { text, major } = req.body;
      const prompt = `You are a helpful study assistant. Create personalized summary notes from the following text for a student majoring in ${major || 'a related field'}. Structure it with headers and bullet points.\n\nText:\n${text.substring(0, 30000)}`;

      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ success: true, data: { notes: response.text } });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/ai/generate-course-study-plan", async (req, res) => {
    try {
      const { text } = req.body;
      const prompt = `You are an academic planner. Based on the following material text, suggest a step-by-step study plan to master this material. Return a JSON object with a 'plan' array, where each element has 'step' (number), 'title' (string), and 'description' (string).\n\nText:\n${text.substring(0, 30000)}`;

      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, data: { plan: parsed.plan || [] } });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/ai/parse-syllabus", upload.single("syllabus_file"), async (req, res) => {
    try {
      let syllabus_text = req.body.syllabus_text;

      if (req.file) {
        if (req.file.mimetype === 'application/pdf') {
          const pdfData = await pdfParse(req.file.buffer);
          syllabus_text = pdfData.text;
        } else {
          syllabus_text = req.file.buffer.toString('utf-8');
        }
      }

      if (!syllabus_text) {
        return res.status(400).json({ success: false, error: "No syllabus text or file provided" });
      }

      const prompt = `You are an academic assistant. Parse the following syllabus and return a JSON object with:
      - course_title (string)
      - topics (array of strings)
      - suggestions (array of strings)
      - assessments: array of objects with title, type (assignment/exam/quiz/project), weight (string), due_date (string)
      - weekly_plan: array of objects with week (number), topic (string)
      
      Syllabus Text:
      ${syllabus_text}`;

      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
      });
      
      const text = response.text;
      let parsed = {};
      if (text) {
          parsed = JSON.parse(text);
      }
      res.json({ success: true, data: parsed });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/ai/suggest-schedule", async (req, res) => {
    try {
      const response = await getAI().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Suggest a productive study schedule for a busy university student.",
      });
      res.json({ success: true, data: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/ai/suggest-courses", async (req, res) => {
      try {
        const { major } = req.body;
        const prompt = `You are an academic advisor. Suggest a typical list of 5 course modules for a student studying ${major}.
        Return a JSON object with a 'courses' array, where each object has:
        - code: string (e.g. "CS 101")
        - name: string (e.g. "Introduction to Computer Science")`;
        
        const response = await getAI().models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        
        const text = response.text;
        res.json({ success: true, data: JSON.parse(text || '{}') });
      } catch(e: any) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
      }
  });

  app.post("/api/ai/study-path/:course_id", async (req, res) => {
      try {
        const response = await getAI().models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Generate a week-by-week study path for a university course. Keep it concise.",
        });
        res.json({ success: true, data: { generated_path: response.text, model_used: "gemini-3-flash-preview" } });
      } catch(e: any) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
      }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
