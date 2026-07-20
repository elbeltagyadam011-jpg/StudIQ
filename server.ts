import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit for book image uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("Warning: GEMINI_API_KEY is not defined. Gemini API requests will fail.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to extract base64 components
function parseBase64Image(dataUrl: string) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

/**
 * 1. OCR & Study Guide Generation
 * Performs high-fidelity OCR on an uploaded textbook page, auto-detects language,
 * and extracts titles, verbatim text, summarizations, and key definitions.
 * It also assesses confidence, blurriness, and formula readability.
 */
app.post("/api/ocr", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const imageParts = parseBase64Image(image);
    if (!imageParts) {
      return res.status(400).json({ error: "Invalid base64 image format. Must be a valid Data URL." });
    }

    const imagePart = {
      inlineData: {
        mimeType: imageParts.mimeType,
        data: imageParts.data,
      },
    };

    const textPart = {
      text: `Perform a high-fidelity educational OCR on this textbook or book page image.
First, perform a rigorous quality and readability assessment of the image:
1. Is the image extremely blurry, pixelated, poorly lit, or cut-off?
2. Are there mathematical equations, formulas, graphs, chemical symbols, or paragraphs that are unreadable, cropped, or ambiguous?
3. If the image is illegible or has low confidence for formulas or text, set "lowConfidence" to true, and write a clear, helpful, and polite instruction in "lowConfidenceReason" (in Arabic if the book page has Arabic, or in English otherwise) explaining why and asking the user to recapture the page under better lighting/focus.
4. If the image is clear and legible, set "lowConfidence" to false and "lowConfidenceReason" to "".

If and only if the image is highly readable, perform the educational OCR:
- Identify the main language of the page (Arabic "ar" or English "en").
- Classify the textbook page into exactly one of the following subjects based on its content, symbols, vocabulary, or text: 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Arabic', 'English'.
- Extract the verbatim text with proper paragraph and formula formatting.
- Preserve mathematical formulas or chemical equations exactly (using LaTeX inline $...$ or display $$...$$ blocks where appropriate to prevent broken symbols).
- Analyze the textbook content and produce:
  - A concise, descriptive, and engaging educational title.
  - A highly informative, structured study summary of the page's core ideas, theories, reactions, or calculation steps.
  - A structured list of 'key concepts' or vocabulary words along with clear student-friendly explanations.

Provide the response strictly in the structured JSON schema format specified.
If the text is Arabic, please make sure the 'title', 'extractedText', 'summary', and 'keyConcepts' are in Arabic.
If the text is English, please make sure they are in English.
If bilingual, write the outputs in the primary dominant language.
If "lowConfidence" is true, the fields 'title', 'extractedText', 'summary', and 'keyConcepts' can be empty or simple placeholders, but they must still match the schema types.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { 
              type: Type.STRING, 
              description: "The primary detected language code: 'ar' or 'en'" 
            },
            subject: {
              type: Type.STRING,
              description: "The classified academic subject. MUST be exactly one of: 'Mathematics', 'Chemistry', 'Physics', 'Biology', 'Arabic', 'English'."
            },
            lowConfidence: {
              type: Type.BOOLEAN,
              description: "True if the image is too blurry, unreadable, poorly lit, or contains mathematical/chemical formulas that are unidentifiable. False otherwise."
            },
            lowConfidenceReason: {
              type: Type.STRING,
              description: "Clear instructions on why the image cannot be processed and asking them to recapture (Arabic or English)."
            },
            title: { 
              type: Type.STRING, 
              description: "Main title or heading for this study material" 
            },
            extractedText: { 
              type: Type.STRING, 
              description: "Complete, accurate, paragraph-formatted verbatim OCR text from the page" 
            },
            summary: { 
              type: Type.STRING, 
              description: "A comprehensive, high-quality summary explaining key study concepts and details on this page (supports markdown)" 
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING, description: "The scientific, historical, or academic concept/term" },
                  explanation: { type: Type.STRING, description: "A detailed, easy-to-understand explanation or definition" }
                },
                required: ["concept", "explanation"]
              },
              description: "An array of key concepts or vocabulary definitions found on the page"
            }
          },
          required: ["detectedLanguage", "subject", "lowConfidence", "lowConfidenceReason", "title", "extractedText", "summary", "keyConcepts"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini OCR model");
    }

    const result = JSON.parse(response.text.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("OCR API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process image and perform OCR" });
  }
});

/**
 * 2. Interactive Quiz Generation (Egyptian High School / Thanaweya Amma Exam Style)
 * Generates custom quizzes based on strict educational guidelines resembling the
 * prestigious and challenging Egyptian Ministry of Education secondary exam style.
 */
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { text, count = 5, language = "en", type = "multiple-choice", subject, difficulty = "Medium", excludeQuestions = [] } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text content provided for quiz generation" });
    }

    let subjectGuidelines = "";
    if (subject) {
      subjectGuidelines = `\n\nSUBJECT-SPECIFIC GUIDELINES FOR [${subject}]:\n`;
      switch (subject) {
        case "Mathematics":
          subjectGuidelines += `Since this is a Mathematics quiz, create highly precise, step-by-step math problems (calculus, algebra, geometry, or vectors). Focus on logical proof steps, derivative/integral rules, or geometric configurations. Make sure mathematical equations or formulas are beautifully written using LaTeX inline $...$ or display $$...$$. Distractors must represent common algebraic or sign errors.`;
          break;
        case "Chemistry":
          subjectGuidelines += `Since this is a Chemistry quiz, focus on chemical formulas, atomic structures, stoichiometry, gas laws, balancing reactions, organic chemistry pathways, or acid-base equilibria. Include chemistry notation like $H_2SO_4$, $Fe^{2+}$, or chemical equations. Distractors should represent typical stoichiometry balancing or valency mistakes.`;
          break;
        case "Physics":
          subjectGuidelines += `Since this is a Physics quiz, focus on mechanics, electricity/magnetism, light waves, thermodynamics, or atomic physics. Create calculation problems or conceptual scenarios testing Newton's laws, Ohm's law, circuit analysis, or wave equations. Distractors must represent common unit confusion or vector sign errors.`;
          break;
        case "Biology":
          subjectGuidelines += `Since this is a Biology quiz, focus on genetics, DNA/RNA processes, cell structure functions, organic pathways (photosynthesis, respiration), or endocrine hormones. Questions should test cellular structures, cause-and-effect of mutation/inhibition, or inheritance probabilities (e.g., Punnett squares). Distractors should represent common biological misunderstandings.`;
          break;
        case "Arabic":
          subjectGuidelines += `بما أن المادة هي اللغة العربية، ركز على قواعد النحو (مرفوعات، منصوبات، مجرورات، أدوات الشرط)، البلاغة (الاستعارة، التشبيه، الكناية)، والأدب أو النصوص. يجب صياغة الأسئلة بلغة عربية فصحى راقية ومحكمة، محاكية تماماً لامتحانات الثانوية العامة المصرية الوزارية.`;
          break;
        case "English":
          subjectGuidelines += `Since this is an English language quiz, focus on grammar tenses, conditional structures, active/passive voice, relative clauses, advanced vocabulary/phrasal verbs in context, or reading analysis. Questions must test correct structural usage or reading interpretation.`;
          break;
      }
    }

    let difficultyGuidelines = "";
    if (difficulty === "Easy") {
      difficultyGuidelines = `\n\nDIFFICULTY LEVEL: EASY (Focus on fundamental definitions, core formulas, clear examples, and direct applications of the concepts. Keep calculations simple and answers straightforward, testing foundational understanding. Language should be highly accessible.)`;
    } else if (difficulty === "Hard") {
      difficultyGuidelines = `\n\nDIFFICULTY LEVEL: HARD (Focus on highly challenging, complex, and conceptual problems. Include multi-step logical reasoning, subtle nuances, tricky distractors, and advanced application of formulas or concepts. This represents the top-percentile ranking questions on the official Thanaweya Amma ministerial exam.)`;
    } else {
      difficultyGuidelines = `\n\nDIFFICULTY LEVEL: MEDIUM (Standard high school level. Mix conceptual understanding with structural and logical deduction, requiring a solid grasp of the topic. Standard challenging questions with solid educational value.)`;
    }

    let excludeInstruction = "";
    if (excludeQuestions && Array.isArray(excludeQuestions) && excludeQuestions.length > 0) {
      excludeInstruction = `\n\nCRITICAL DIRECTIVE: NEVER DUPLICATE OR REPEAT PREVIOUS QUESTIONS.
You MUST NOT generate any questions that are identical, highly similar, or test the exact same numbers/scenarios as the following previously generated questions:
${excludeQuestions.map((q, i) => `${i + 1}. "${q}"`).join("\n")}
Ensure your new questions are entirely fresh, explore different sentences/concepts/details of the textbook, or use completely different numerical values or parameters so they are 100% unique.`;
    }

    const quizPrompt = `You are a prestigious Egyptian High School Exam Writer (expert senior advisor for the Ministry of Education's Thanaweya Amma exams).
Your task is to generate a highly professional, intellectually rigorous, and conceptual study exam based strictly on the following textbook content:
---
${text}
---

Generate exactly ${count} exam questions.
Quiz type: ${type === "mixed" ? "mixed (automatically mix Multiple-Choice questions with 4 unique options and True/False questions in a balanced ratio, e.g. 3 of one type and 2 of the other)" : type === "true-false" ? "True / False statements" : "Multiple-choice questions (each with exactly 4 unique options)"}.
Language: Generate the response in ${language === "ar" ? "Arabic" : "English"}.${subjectGuidelines}${difficultyGuidelines}${excludeInstruction}

You MUST adhere to the following strict Egyptian Ministry Exam guidelines:
1. THINK LIKE AN EGYPTIAN HIGH SCHOOL EXAM WRITER: Thanaweya Amma exams are famous for testing deep critical analysis. Every question must be crafted with high intellectual standards, designed to challenge students and separate different levels of academic achievement.
2. NEVER COPY SENTENCES FROM THE TEXTBOOK: You are strictly forbidden from copying any sentence or phrase word-for-word from the textbook. Rephrase every single piece of information, construct new scenarios, use synonyms, or build practical application problems.
3. TEST UNDERSTANDING, NOT MEMORIZATION: Avoid simple recall questions (e.g., "What is the definition of X?"). Instead, ask conceptual, cause-and-effect, and application questions (e.g., "If condition Y increases, what is the impact on rate X?").
4. REPLICATE OFFICIAL MINISTRY EXAMS: Model the syntax, depth, and phrasing after actual recent Thanaweya Amma ministry exams. They often use words like "What is the primary role of...", "Which of the following describes...", "Determine the relationship...", "If you know that...".
5. AVOID REPETITIVE QUESTIONS: Ensure that each of the ${count} questions targets a completely distinct concept, formula, reaction, or historical fact from the textbook. Do not repeat the same learning objective.
6. AUTOMATICALLY MIX QUESTION TYPES: If the quiz type is 'mixed', generate both multiple-choice questions (with exactly 4 options) and True/False questions (with exactly 2 options). Ensure they are mixed organically.
7. ACADEMIC AND RIGOROUS ANSWER VERIFICATION: Before finalizing your output, perform a thorough double-check verification pass on every question. Ensure that:
   - There is exactly one indisputably correct answer.
   - The distractors are highly plausible, representing realistic student misconceptions, but are factually/logically incorrect.
   - The correct answer index matches the specified option perfectly.
   - The explanation step-by-step proves why the correct option is true and why other distractors are false.
8. NOVELTY AND HIGHEST ENTROPY (DIFFERENT EXAM EVERY TIME): Every time this prompt is executed, you must choose different sub-concepts, use different random numerical values for math/science problems, and change the phrasing to guarantee that a student taking the quiz multiple times receives a totally fresh set of questions.
9. FOR MATHEMATICS & SCIENCE SYMBOLS:
   - Read all mathematical symbols accurately and keep equations intact.
   - For physics, chemistry, and biology: Create questions that require calculating stoichiometry, analyzing circuit diagrams, balancing chemical formulas, or interpreting biological functions.
   - Support standard Egyptian mathematical layout and phrasing in Arabic (e.g., "إذا كان...", "أوجد قيمة...").
10. PROVIDE STRUCTURED EXPLANATIONS FOR INCORRECT ANSWERS:
   - You MUST generate an array of explanations in 'optionsExplanations' mapping 1-to-1 to the options array. For each incorrect option, explain step-by-step why it is wrong or misleading. For the correct option, explain why it is correct.
   - You MUST extract the 'textbookParagraph' field, which is the exact verbatim, word-for-word sentence or paragraph from the uploaded textbook/lesson content that directly supports or contains the correct answer for this question. Do not modify, rephrase or translate this paragraph—it must be exactly as it appears in the textbook source.
   - You MUST provide a clear 'suggestedReview' showing what topic, equation, or section the student should study or review to master this concept if they chose a wrong answer.

Provide the response strictly in the structured JSON format specified. Do not include any conversational text or markdown code wrappers (like \`\`\`json) outside the JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: quizPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: { 
              type: Type.STRING, 
              description: "A relevant and motivating title for this exam, e.g. 'Thanaweya Amma Physics Practice' or similar" 
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique identifier, e.g. 'q1', 'q2'" },
                  questionText: { type: Type.STRING, description: "The quiz question or statement testing understanding (rephrased conceptual/application question)" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "For multiple choice: exactly 4 distinct and highly plausible options. For True/False: exactly 2 options (['True', 'False'] or ['صحيح', 'خطأ'])"
                  },
                  correctAnswerIndex: { 
                    type: Type.INTEGER, 
                    description: "Zero-based index of the correct answer within the options array" 
                  },
                  explanation: { 
                    type: Type.STRING, 
                    description: "A comprehensive, step-by-step educational explanation on why this is the correct answer and why other distractors are wrong" 
                  },
                  topic: {
                    type: Type.STRING,
                    description: "The specific subtopic or concept tested by this question. Keep it very brief, 1 to 3 words."
                  },
                  optionsExplanations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An explanation for each option matching the options array exactly in order. For each incorrect option, explain why it is wrong. For the correct option, explain why it is correct."
                  },
                  textbookParagraph: {
                    type: Type.STRING,
                    description: "The exact word-for-word, verbatim paragraph or sentence from the provided textbook text that supports this question's correct answer."
                  },
                  suggestedReview: {
                    type: Type.STRING,
                    description: "A practical recommendation of what the student should review or study to master this concept before trying again."
                  }
                },
                required: ["id", "questionText", "options", "correctAnswerIndex", "explanation", "topic", "optionsExplanations", "textbookParagraph", "suggestedReview"]
              }
            }
          },
          required: ["quizTitle", "questions"]
        },
        // High temperature ensures randomize/scramble effect on consecutive requests
        temperature: 0.95,
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini Quiz generator");
    }

    const quiz = JSON.parse(response.text.trim());
    return res.json(quiz);
  } catch (error: any) {
    console.error("Quiz Generator Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate study quiz" });
  }
});

/**
 * 3. AI Study Buddy Chat / Explanation
 * Explains textbook content and answers queries based on context.
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { contextText, messages, language = "en" } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid or empty messages list" });
    }

    // Format prompt and system instruction
    const systemInstruction = `You are "StudyMind AI Tutor", an elite Egyptian High School (Thanaweya Amma) personal tutor and academic expert.
You have access to the student's uploaded textbook lesson pages. Here is the entire lesson content (with page demarcations like "--- [ Page X ] ---" or "--- [ الصفحة X ] ---"):
---
${contextText || "No lesson content has been uploaded yet."}
---

Your absolute rules and behaviors:
1. STRICT LESSON BOUNDARY (ANSWER ONLY FROM THE LESSON): You are strictly forbidden from bringing in external knowledge, external formulas, or external facts not present or derivable from the uploaded lesson content.
   - If the student asks a question, asks to explain a paragraph, or asks about a solved example that IS NOT in the provided lesson text above, you MUST clearly and explicitly say so! (e.g., "This concept/solved example/question is not mentioned in the uploaded lesson." or in Arabic: "عذرًا، هذا السؤال/المفهوم/المثال غير مذكور في الدرس المرفوع.")
2. EXPLAIN EVERYTHING STEP-BY-STEP:
   - If asked to explain a question: Break down what the question asks, the logic, and how to arrive at the answer based on the lesson.
   - If asked to explain a paragraph: Rephrase it in simple, highly structured high-school friendly language, highlighting the main takeaways.
   - If asked to explain a solved example: Guide them step-by-step through the calculation or logic, explaining the formula used and what each symbol represents.
3. SHOW THE EXACT PAGE WHERE THE ANSWER EXISTS:
   - You MUST look up the exact section in the context text above, find the nearest page header (like "--- [ Page X ] ---" or "--- [ الصفحة X ] ---"), and state clearly at the beginning or end of your answer which page contains this information.
   - Format it boldly, e.g.: "**[موجود في الصفحة 3]**" or "**[Found on Page 3]**".
4. EDUCATION TONE & LANGUAGE:
   - Speak primarily in ${language === "ar" ? "Arabic" : "English"}, but match the student's preferred language of input.
   - Use clean, structured Markdown, LaTeX formulas ($...$ or $$...$$), and bold lists to make reading incredibly pleasant and highly educational.`;

    // Map history to generative format
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: formattedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return res.json({ response: response.text || "" });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to answer question" });
  }
});

/**
 * 4. Smart Revision Generator
 * Automatically generates flashcards, definitions, laws, formulas, one-page summary,
 * five-minute review, expected exam questions, and repeated exam ideas.
 */
app.post("/api/revision", async (req, res) => {
  try {
    const { text, language = "en" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text content provided for revision generation" });
    }

    const revisionPrompt = `You are a prestigious Egyptian High School Exam Writer and senior educational designer.
Your task is to take the following textbook lesson text and automatically produce a highly effective, rigorous "Smart Revision Pack" optimized for Thanaweya Amma.

---
${text}
---

Language: Output MUST be in ${language === "ar" ? "Arabic" : "English"}.

Please generate the following sections based STRICTLY on the text:
1. Flashcards (at least 4-6): Interactive conceptual front and back study questions.
2. Important definitions: Key technical terms, scientific or literary concepts, and their precise meanings.
3. Important laws (e.g., physical, mathematical, grammatical, or scientific laws, rules or principles): If the text doesn't contain physical laws, provide key logical rules, structural frameworks, or scientific principles described.
4. Important formulas: Any chemical formulas, math/physics equations, or structural patterns (or write 'Not applicable' conceptually for purely non-formula lessons, but try to extract relevant equations/expressions if possible).
5. One-page summary: A comprehensive, highly structured markdown summary of the whole lesson, using bullet points, tables, or sections.
6. Five-minute quick review: A bulleted list of the absolute most critical high-yield facts or key highlights to read right before entering the exam room.
7. Most expected exam questions: Challenging questions with detailed step-by-step rationales, designed like real Thanaweya Amma exam questions.
8. Most repeated ideas: The concepts/questions that are historically tested most heavily on this topic, with an explanation of why they are so important.

Think like a Thanaweya Amma expert. Avoid copying textbook sentences verbatim; rephrase conceptually to test understanding. Always ensure high academic accuracy.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: revisionPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                },
                required: ["front", "back"]
              }
            },
            definitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  meaning: { type: Type.STRING }
                },
                required: ["term", "meaning"]
              }
            },
            laws: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  equation: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            },
            formulas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  expression: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["name", "expression", "explanation"]
              }
            },
            onePageSummary: { type: Type.STRING, description: "A structured, detailed revision page in markdown" },
            quickReview: { type: Type.STRING, description: "High-yield rapid review bullet points in markdown" },
            expectedQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ["question", "answer", "rationale"]
              }
            },
            repeatedIdeas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  idea: { type: Type.STRING },
                  importance: { type: Type.STRING }
                },
                required: ["idea", "importance"]
              }
            }
          },
          required: [
            "flashcards",
            "definitions",
            "laws",
            "formulas",
            "onePageSummary",
            "quickReview",
            "expectedQuestions",
            "repeatedIdeas"
          ]
        },
        temperature: 0.7,
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini Revision generator");
    }

    const revisionData = JSON.parse(response.text.trim());
    return res.json(revisionData);
  } catch (error: any) {
    console.error("Revision Generator Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate smart revision" });
  }
});

// Configure Vite integration or Static File hosting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyMind AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
