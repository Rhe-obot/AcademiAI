import express from "express";
import multer from "multer";
import { createRequire } from "module";
import "dotenv/config";

// Lazy loader for pdf-parse — loaded on first use so module-level errors
// don’t crash unrelated AI routes (e.g. suggest-schedule, generate-study-plan)
// We import the internal lib file directly to bypass pdf-parse's self-test
// which tries to read a file from disk and crashes on Vercel's serverless runtime.
let _pdfParse: any = null;
function getPdfParse() {
  if (!_pdfParse) {
    const _require = createRequire(import.meta.url);
    _pdfParse = _require("pdf-parse/lib/pdf-parse.js");
  }
  return _pdfParse;
}

const app = express();
app.use(express.json());

  function sanitizeJSONString(str: string) {
    let isInsideString = false;
    let isEscaped = false;
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (isInsideString) {
            if (char === '"' && !isEscaped) {
                isInsideString = false;
                result += char;
            } else if (char === '\\' && !isEscaped) {
                isEscaped = true;
                result += char;
            } else {
                if (isEscaped) isEscaped = false;
                if (char === '\n') result += '\\n';
                else if (char === '\r') result += '\\r';
                else if (char === '\t') result += '\\t';
                else if (char < ' ') {} // remove other unprintable control characters
                else result += char;
            }
        } else {
            if (char === '"') {
                isInsideString = true;
                isEscaped = false;
            }
            result += char;
        }
    }
    return result;
  }

  // Helper to call OpenRouter API with automatic fallbacks for unreliable free endpoints
  async function callOpenRouter(prompt: string, expectJson: boolean = false) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not set. Please add it to your .env file.");
    }

    const freeModels = [
      "openrouter/free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "qwen/qwen3-coder:free",
      "google/gemma-4-31b-it:free",
      "nousresearch/hermes-3-llama-3.1-405b:free"
    ];

    let lastError = null;

    for (const model of freeModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            // NOTE: response_format is intentionally omitted — many free models return 406
            // JSON output is enforced via strict prompt instructions instead
            max_tokens: 8000,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API error (${model}): ${response.status} ${errText}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        if (expectJson && content) {
          content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          content = sanitizeJSONString(content);
          // Remove trailing commas to prevent JSON parse errors
          content = content.replace(/,(?=\s*[}\]])/g, "");
        }
        return content;
      } catch (err: any) {
        console.warn(`Model ${model} failed: ${err.message}. Trying next model...`);
        lastError = err;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }

    throw new Error(`All free OpenRouter models failed. Last error: ${lastError?.message || lastError}`);
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
        const pdfParse = getPdfParse();
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

      const generatedText = await callOpenRouter(prompt, false);

      res.json({ success: true, data: { notes: generatedText } });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/ai/generate-course-study-plan", async (req, res) => {
    try {
      const { text } = req.body;
      const prompt = `You are an academic planner. Based on the following material text, suggest a step-by-step study plan to master this material. Return a JSON object with a 'plan' array, where each element has 'step' (number), 'title' (string), and 'description' (string).

IMPORTANT STRICT RULES:
1. ONLY return a valid, parseable JSON object.
2. Do NOT use markdown code blocks.
3. Do NOT leave trailing commas.
4. Do NOT use unescaped double quotes inside your string values.

Text:
${text.substring(0, 30000)}`;

      const generatedText = await callOpenRouter(prompt, true);

      let parsed;
      try {
         parsed = JSON.parse(generatedText || '{}');
      } catch (e) {
         console.error("JSON PARSE FAILED (Course Plan). RAW TEXT:", generatedText);
         throw e;
      }
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
          const pdfParse = getPdfParse();
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

IMPORTANT STRICT RULES:
1. ONLY return a valid, parseable JSON object.
2. Do NOT use markdown code blocks.
3. Do NOT leave trailing commas.
4. Do NOT use unescaped double quotes inside your string values.

      Syllabus Text:
      ${syllabus_text}`;

      const generatedText = await callOpenRouter(prompt, true);
      
      if (!generatedText || generatedText.trim() === '') {
         throw new Error("AI returned empty response");
      }

      let parsed;
      try {
         parsed = JSON.parse(generatedText);
      } catch (e) {
         console.error("JSON PARSE FAILED (Syllabus). RAW TEXT:", generatedText);
         throw e;
      }
      res.json({ success: true, data: parsed });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/ai/suggest-schedule", async (req, res) => {
    try {
      const { tasks = [], user_name = 'student' } = req.body;

      const tasksSummary = tasks.length > 0
        ? tasks.map((t: any) => `- "${t.title}" (due: ${t.deadline ? new Date(t.deadline).toDateString() : 'no deadline'}, est. ${t.estimated_duration_mins || 60} mins, priority score: ${t.priority_score?.toFixed(2) || '0.50'})`).join('\n')
        : 'No pending tasks provided.';

      const prompt = `You are an academic schedule advisor. Create a personalized daily study schedule for ${user_name} based on their pending tasks below. Prioritize tasks with higher priority scores and closer deadlines. Be specific about time slots and study techniques.

Pending Tasks:
${tasksSummary}

Return a JSON object with:
- greeting: string (short motivating message to the student)
- schedule: array of objects each with { time: string, task: string, tip: string }
- daily_tip: string (one focus/productivity tip for today)

IMPORTANT STRICT RULES:
1. ONLY return a valid, parseable JSON object.
2. Do NOT use markdown code blocks.
3. Do NOT leave trailing commas.
4. Do NOT use unescaped double quotes inside your string values.`;

      const generatedText = await callOpenRouter(prompt, true);

      if (!generatedText || generatedText.trim() === '') {
         throw new Error("AI returned empty response");
      }

      let parsed;
      try {
         parsed = JSON.parse(generatedText);
      } catch (e) {
         console.error("JSON PARSE FAILED (Schedule). RAW TEXT:", generatedText);
         throw e;
      }
      res.json({ success: true, data: parsed });
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
        - name: string (e.g. "Introduction to Computer Science")
        
IMPORTANT STRICT RULES:
1. ONLY return a valid, parseable JSON object.
2. Do NOT use markdown code blocks.
3. Do NOT leave trailing commas.
4. Do NOT use unescaped double quotes inside your string values.`;
        
        const generatedText = await callOpenRouter(prompt, true);
        
        if (!generatedText || generatedText.trim() === '') {
           throw new Error("AI returned empty response");
        }

        let parsed;
        try {
           parsed = JSON.parse(generatedText);
        } catch (e) {
           console.error("JSON PARSE FAILED (Courses). RAW TEXT:", generatedText);
           throw e;
        }
        res.json({ success: true, data: parsed });
      } catch(e: any) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
      }
  });

  app.post("/api/ai/study-path/:course_id", async (req, res) => {
      try {
        const { course_id } = req.params;
        const { course_name, course_code, syllabus_summary, materials_summary } = req.body;

        const courseContext = course_name
          ? `${course_code ? course_code + ': ' : ''}${course_name}`
          : `Course ID ${course_id}`;

        const extraContext = [
          syllabus_summary ? `Syllabus overview: ${syllabus_summary}` : '',
          materials_summary ? `Available materials: ${materials_summary}` : ''
        ].filter(Boolean).join('\n');

        const prompt = `You are an academic study coach. Generate a detailed week-by-week study path for a university student enrolled in: "${courseContext}".
${extraContext ? `\nAdditional context:\n${extraContext}` : ''}

Return a JSON object with a 'weeks' array where each item has:
- week: number
- focus: string (main topic/objective for the week)
- activities: array of strings (specific study actions)
- goal: string (what the student should be able to do by week's end)

IMPORTANT STRICT RULES:
1. ONLY return a valid, parseable JSON object.
2. Do NOT include markdown code blocks.
3. Do NOT use unescaped double quotes inside your string values (e.g. use single quotes instead).`;

        const generatedText = await callOpenRouter(prompt, true);

        let parsed;
        try {
           parsed = JSON.parse(generatedText || '{}');
        } catch (parseError) {
           console.error("JSON PARSE FAILED. RAW TEXT:", generatedText);
           throw parseError;
        }
        res.json({ success: true, data: { generated_path: parsed, model_used: "llama-3.3-70b" } });
      } catch(e: any) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
      }
  });

export default app;
