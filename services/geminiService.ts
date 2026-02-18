
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { GeneratedQuiz, StudentProfile, ChatMessage, ChatPart, PracticeProblem, ProblemFeedback, GeneratedQuestion, VideoData } from "../types";
import { LEARNING_MODULES } from '../data/modules';
import { withRetry } from '../utils/apiRetry';
import { safeJsonParse } from '../utils/safeJsonParse';
import { prepareImagesForQuiz } from '../utils/imageCompression';

const API_KEY = process.env.API_KEY;

/**
 * Creates a fresh instance of GoogleGenAI to ensure it uses the latest API key.
 */
function getAiClient() {
  if (!API_KEY) {
    throw new Error("API_KEY environment variable not set. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
}

function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string; } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as base64 string."));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function handleApiError(error: unknown): string {
  console.error("Gemini API Error Detail:", error);
  const message = String((error as Error)?.message ?? "");

  if (message.toLowerCase().includes("failed to fetch") || message.includes("NetworkError")) {
    return "We couldn't reach the AI service. Please check your internet connection and try again.";
  }

  if (message.includes('429') || message.includes('rate limit')) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (message.includes('API key not found') || message.includes('invalid') || message.includes('403')) {
    return "AI service configuration error. Please check your API key.";
  }

  if (message.includes('SAFETY') || message.includes('blocked')) {
    return "This request was blocked for safety. Please try rephrasing or using different content.";
  }

  if (message.includes('invalid data') || message.includes('SyntaxError')) {
    return "The AI returned unexpected data. Please try again.";
  }

  return "Something went wrong with the AI service. Please try again.";
}

export async function analyzeAndGenerateQuestions(
  files: File[],
  profile: Pick<StudentProfile, 'grade' | 'subject'>,
  customization: { numQuestions: number; difficulty: string; numOptions: number; questionType?: string },
  topic?: string
): Promise<GeneratedQuiz> {
  const ai = getAiClient();
  // Compress and limit images for faster API response
  const preparedFiles = files.length > 0 ? await prepareImagesForQuiz(files) : [];
  const imageParts = await Promise.all(preparedFiles.map(fileToGenerativePart));

  const numDistractors = customization.numOptions - 1;
  const questionTypeInstruction = customization.questionType && customization.questionType !== 'Mixed'
    ? `Ensure ALL questions are of type '${customization.questionType}'.`
    : "Ensure a variety of question types (MCQ, True/False, Fill in Blank).";

  const contentContext = topic
    ? `generate a quiz on the topic "${topic}". ${files.length > 0 ? "Use the provided images as additional context." : ""}`
    : `analyze the provided study materials.`;

  const prompt = `You are an expert curriculum designer specializing in the Indian CBSE curriculum. ${contentContext}
  Target Audience: ${profile.grade}th standard student studying ${profile.subject}.
  
  Generate a JSON object with two keys: "topics" and "questions".
  - "topics": An array of 1-3 specific topic strings covered.
  - "questions": An array of exactly ${customization.numQuestions} questions with a difficulty of '${customization.difficulty}'.
  
  ${questionTypeInstruction}
  For Multiple Choice questions, provide exactly ${numDistractors} plausible distractors and combine them with the correct answer into a single "options" array. Follow the provided JSON schema precisely.`;

  const questionSchema = {
    type: Type.OBJECT,
    properties: {
      questionText: { type: Type.STRING },
      questionType: { type: Type.STRING, enum: ["Multiple Choice", "Short Answer", "True/False", "Fill in the Blank"] },
      options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
      correctAnswer: { type: Type.STRING },
      hint: { type: Type.STRING, nullable: true },
      difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
    },
    required: ["questionText", "questionType", "correctAnswer", "difficulty"]
  };

  try {
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [...imageParts, { text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: { type: Type.ARRAY, items: { type: Type.STRING } },
              questions: { type: Type.ARRAY, items: questionSchema }
            },
            required: ["topics", "questions"]
          },
        },
      });
    });

    const quiz = safeJsonParse<GeneratedQuiz>(response.text, "Failed to generate quiz.");

    // Post-process to shuffle options for Multiple Choice questions
    if (quiz.questions) {
      quiz.questions.forEach((q: GeneratedQuestion) => {
        if (q.questionType === 'Multiple Choice' && q.options && q.options.length > 0) {
          // Fisher-Yates shuffle
          for (let i = q.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
          }
        }
      });
    }

    return quiz;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function extractChaptersFromFile(
  file: File,
  profile: Pick<StudentProfile, 'grade' | 'subject'>
): Promise<{ title: string; description: string; keyPoints: string[] }[]> {
  const ai = getAiClient();
  const imagePart = await fileToGenerativePart(file);

  const prompt = `Analyze this uploaded file (Textbook/Syllabus Image). 
  Target Audience: Grade ${profile.grade} ${profile.subject}.
  
  Objective: Identify and extract the specific chapters or distinct topics present in this file. 
  
  **CRITICAL INSTRUCTIONS FOR IMAGE EXTRACTION:**
  1. **LOOK FOR SCANNED LISTS**: If the image contains a numbered list (e.g. "1. How Plants...", "2. Adaptations...", "8. Clothes..."), YOU MUST EXTRACT THESE EXACT TITLES.
  2. **IGNORE HANDWRITTEN MARKS**: Ignore checkmarks, circles, or scribbles. Focus on the printed text.
  3. **DETECT CONTENTS PAGES**: If the image looks like a "History", "Index", or "Contents" page, preserve the order and titles exactly as shown.
  4. **NO HALLUCINATIONS**: Do not make up chapters. Only return what is visible in the text/image.
  5. **FORMAT**: Clean up the titles (remove "Unit 1", "Chapter 5" prefixes if they are clutter, but keep the core title).
  
  Return a JSON array where each object has:
  - "title": The precise name of the chapter (e.g. "Solids, Liquids and Gases", "The Solar System").
  - "description": A short, 1-sentence summary of what this chapter covers based on subheadings if visible, or general knowledge.
  - "keyPoints": An array of 3-5 key concepts or keywords from this chapter.
  
  If the file contains a table of contents, use that. If it's a chapter text, break it down into logical sections.`;

  try {
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ parts: [imagePart, { text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description", "keyPoints"]
            }
          }
        },
      });
    });

    return safeJsonParse<{ title: string; description: string; keyPoints: string[] }[]>(response.text, "Failed to extract chapters.");
  } catch (error) {
    console.error("Failed to extract chapters:", error);
    // Fallback: return the file name as a single chapter
    return [{
      title: file.name.replace(/\.[^/.]+$/, ""),
      description: "Uploaded content",
      keyPoints: ["General Content"]
    }];
  }
}

let chatInstance: Chat | null = null;

export function startChat(profile: StudentProfile): Chat {
  const ai = getAiClient();
  const weakTopics = Object.entries(profile.topic_performance || {})
    .filter(([, perf]) => perf === 'weak')
    .map(([topic]) => topic);

  let adaptivePrompt = weakTopics.length > 0
    ? `The student is weak in: ${weakTopics.join(', ')}. Review these if relevant.`
    : '';

  const systemInstruction = `You are StudyBuddy AI, a friendly, patient AI tutor for Grade ${profile.grade} ${profile.subject}.

  **Teaching Methodology:**
  1.  **Explain Concepts Clearly**: Use simple language appropriate for a ${profile.grade} grader.
  2.  **Ask Specific Questions**: Do NOT ask generic questions like "Do you understand?". Instead, ask specific concept-checking questions.
  3.  **Check for Clarity**: "Can you explain in your own words what [concept] means?" or "What would happen if [scenario]?"
  4.  **Be Encouraging**: Celebrate correct answers and gently correct mistakes.

  ${adaptivePrompt}
  
  Always end your turn with a specific, thought-provoking question related to the topic to check the student's understanding.`;

  chatInstance = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction },
  });
  return chatInstance;
}

export function startDirectQAChat(profile: StudentProfile): Chat {
  const ai = getAiClient();
  const systemInstruction = `You are StudyBuddy AI, an expert AI tutor. 
  When answering the student's questions:
  1.  **Be Direct & Concise**: Get straight to the point.
  2.  **Use Point-Wise Format**: breakdown complex explanations into bullet points or numbered lists.
  3.  **ChatGPT Style**: Use clear headings, bold text for emphasis, and structured formatting to make the answer easy to read.
  4.  **No Fluff**: Avoid unnecessary pleasantries; focus on the solution.
  
  Solve the student's issue effectively using this structured approach.`;

  chatInstance = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction },
  });
  return chatInstance;
}

export function startTimeTravelChat(figure: any, profile: StudentProfile): Chat {
  const ai = getAiClient();
  const systemInstruction = `You are ${figure.name}, the ${figure.role}. 
  Personality: ${figure.personality}.
  Knowledge: You have deep knowledge of ${figure.knowledge}.
  Context: You are speaking to a ${profile.grade}th grade student named ${profile.name}.
  Tone: Stay in character. Be inspiring, era-appropriate, and educational. Answer as if you are actually that person in their time, or looking back from history. 
  Encourage the student to ask about your life, work, or the world you lived in.`;

  chatInstance = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction },
  });
  return chatInstance;
}

export async function continueChat(message: string): Promise<GenerateContentResponse> {
  if (!chatInstance) throw new Error("Chat not initialized.");
  try {
    return await withRetry(() => chatInstance!.sendMessage({ message }));
  } catch (e) {
    throw new Error(handleApiError(e));
  }
}

export async function generateContentWithSearch(history: ChatMessage[], message: string): Promise<GenerateContentResponse> {
  const ai = getAiClient();
  const contents = history.map(msg => ({
    role: msg.role,
    parts: msg.parts.map(p => 'text' in p ? { text: p.text } : p)
  }));
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    return await withRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents,
      config: { tools: [{ googleSearch: {} }] },
    }));
  } catch (e) {
    throw new Error(handleApiError(e));
  }
}

export async function findEducationalVideo(
  topic: string,
  profile: Pick<StudentProfile, 'grade' | 'subject'>
): Promise<VideoData[]> {
  const ai = getAiClient();
  const prompt = `Perform a Google Search for "youtube educational video ${topic} class ${profile.grade} CBSE India". 
  From the SEARCH RESULTS, identify 5 REAL, working YouTube videos specifically for Indian students (CBSE/ICSE context).
  CRITICAL: 
  1. PRIORITIZE Indian educational channels (e.g., Physics Wallah, Vedantu, Byju's, Unacademy, ExamFear, TicTacLearn, Bodhaguru, LearnFatafat).
  2. Do NOT fabricate video IDs. Use ONLY URLs found in the search results.
  3. Ensure the video is likely to be embeddable.
  
  Return strictly valid JSON with a "videos" key containing an array of objects, where each object has: "youtubeUrl", "title", "description".`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: { tools: [{ googleSearch: {} }] },
    }));

    const text = response.text.trim();
    const match = text.match(/{[\s\S]*}/);
    if (!match) throw new Error("Could not parse AI video recommendations.");

    const parsed = safeJsonParse<{ videos?: { youtubeUrl?: string; title?: string; description?: string }[] }>(match[0], "Could not parse video recommendations.");
    const videos = parsed.videos || [];

    const getYouTubeIdFromUrl = (url: string | null): string | null => {
      if (!url) return null;
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    };

    return videos.map((video: any): VideoData | null => {
      const id = getYouTubeIdFromUrl(video.youtubeUrl);
      if (!id) return null;
      return {
        youtubeId: id,
        title: video.title || 'Untitled Video',
        description: video.description || 'No description available.',
        thumbnailUrl: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      };
    }).filter((v: any): v is VideoData => !!v);

  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function generateProgressReport(
  chatHistory: ChatMessage[],
  profile: StudentProfile
): Promise<string> {
  const ai = getAiClient();
  const transcript = chatHistory.map(item => {
    const text = item.parts.map(p => 'text' in p ? p.text : '[image]').join(' ');
    return `${item.role === 'model' ? 'StudyBuddy AI' : 'Student'}: ${text}`;
  }).join('\n');

  const prompt = `Generate a parent's progress report for a ${profile.grade}th grade student in ${profile.subject}. Summarize topics, strengths, and review needs from transcript:\n${transcript}`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    }));
    return response.text;
  } catch (error) {
    return "Failed to generate report. Please try again.";
  }
}

export async function analyzeHandwrittenWork(file: File, lastQuestion: string): Promise<string> {
  const ai = getAiClient();
  const imagePart = await fileToGenerativePart(file);
  const prompt = `Analyze handwritten work for: "${lastQuestion}". Praise effort, find logical mistakes, guide correctly without just giving the answer. Supportive tone.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [imagePart, { text: prompt }] }],
    }));
    return response.text;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function generatePracticeProblem(
  profile: StudentProfile,
  topic?: string
): Promise<PracticeProblem> {
  const ai = getAiClient();
  const weakTopics = Object.entries(profile.topic_performance || {})
    .filter(([, perf]) => perf === 'weak').map(([t]) => t);

  const context = topic
    ? `on the specific topic: "${topic}"`
    : `${weakTopics.length ? 'Prioritizing these weak areas: ' + weakTopics.join(', ') : ''}`;

  const prompt = `Generate a single practice problem for a ${profile.grade}th standard student in ${profile.subject} ${context}.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            question: { type: Type.STRING }
          },
          required: ["topic", "question"]
        },
      },
    }));

    return safeJsonParse<PracticeProblem>(response.text, "Failed to generate practice problem.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function evaluatePracticeAnswer(
  problem: PracticeProblem,
  answer: string,
  profile: StudentProfile
): Promise<ProblemFeedback> {
  const ai = getAiClient();
  const prompt = `Evaluate answer for: "${problem.question}". Student's answer: "${answer}". Grade ${profile.grade} subject ${profile.subject}.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedbackText: { type: Type.STRING }
          },
          required: ["isCorrect", "feedbackText"]
        },
      },
    }));

    return safeJsonParse<ProblemFeedback>(response.text, "Failed to evaluate answer.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function evaluateAnswerSemantically(
  params: { questionText: string, userAnswer: string, correctAnswer: string }
): Promise<{ isCorrect: boolean }> {
  const ai = getAiClient();
  const prompt = `Is "${params.userAnswer}" correct for "${params.questionText}" given the key is "${params.correctAnswer}"? Respond JSON {"isCorrect": boolean}.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN }
          },
          required: ["isCorrect"]
        },
      },
    }));

    return safeJsonParse<{ isCorrect: boolean }>(response.text, "Failed to evaluate answer.");
  } catch (error) {
    return { isCorrect: false };
  }
}

export async function generateProblemSolution(
  problem: PracticeProblem,
  profile: StudentProfile
): Promise<string> {
  const ai = getAiClient();
  const prompt = `Provide step-by-step solution for: "${problem.question}". Grade ${profile.grade} ${profile.subject}.`;
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    }));
    return response.text;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function generateAnswerExplanation(
  question: GeneratedQuestion,
  userAnswer: string | undefined
): Promise<string> {
  const ai = getAiClient();
  const prompt = `Explain why "${question.correctAnswer}" is correct for "${question.questionText}". User answered "${userAnswer || 'nothing'}".`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    }));
    return response.text;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function getMathStepByStepSolution(
  problem: string,
  profile: StudentProfile
): Promise<string[]> {
  const ai = getAiClient();
  const prompt = `Solve this math problem step-by-step for a ${profile.grade}th grade student: "${problem}". 
  Break it down into clear, simple steps. Use emojis for each step. 
  Include a "Final Answer" at the end. 
  Format as a JSON array of strings, where each string is one step.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    }));

    return safeJsonParse<string[]>(response.text, "Failed to generate solution steps.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

/**
 * Generates an image based on a user-provided text prompt.
 * Uses gemini-2.5-flash-image for general image generation tasks.
 */
export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      // Note: Do NOT set responseMimeType or responseSchema for nano banana series models as per guidelines.
    });

    // The output response may contain both image and text parts; iterate through all parts to find the image part.
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          // Return the base64 encoded string from inlineData.data
          return part.inlineData.data;
        }
      }
    }

    throw new Error("No image was generated in the response. The model might have returned text instead.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}
// ... (existing code)

export async function generateStudyPlan(
  profile: StudentProfile,
  goals: string,
  days: number = 7,
  modules: any[] = []
): Promise<any> {
  const ai = getAiClient();
  const weakTopics = Object.entries(profile.topic_performance || {})
    .filter(([, perf]) => perf === 'weak')
    .map(([topic]) => topic);

  const prompt = `Create a ${days}-day study plan for a ${profile.grade}th grade student in ${profile.subject}.
    Goals/Exams: ${goals}.
    Weak Areas to Prioritize: ${weakTopics.join(', ') || 'General Review'}.
    ${modules.length > 0 ? `Available Syllabus Chapters: ${modules.map(m => m.title).join(', ')}.` : ''}
    
    Return a JSON object with a "schedule" key, which is an array of objects.
    Each object representing a day must have:
    - "day": number (1 to ${days})
    - "focus_topic": string
    - "activities": array of strings (specific tasks like "Read Chapter 5", "Solve 10 problems", "Watch video on X")
    - "priority_question": string (A specific practice question related to the focus topic)
    - "estimated_time_minutes": number
    
    Ensure the plan is balanced and realistic.`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  focus_topic: { type: Type.STRING },
                  activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  priority_question: { type: Type.STRING },
                  estimated_time_minutes: { type: Type.NUMBER }
                },
                required: ["day", "focus_topic", "activities", "priority_question", "estimated_time_minutes"]
              }
            }
          },
          required: ["schedule"]
        }
      },
    }));
    return safeJsonParse(response.text, "Failed to generate study plan.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function generatePerformancePrediction(
  profile: StudentProfile,
  history: any[]
): Promise<{ prediction: string; insights: string[]; recommendedFocus: string }> {
  const ai = getAiClient();
  const historySummary = history.map(h => ({
    subject: h.subject,
    score: h.score,
    total: h.total_questions,
    date: h.created_at,
    topics: h.topics
  }));

  const prompt = `Analyze this student's quiz history and profile.
  Grade: ${profile.grade}, Subject: ${profile.subject}.
  History: ${JSON.stringify(historySummary.slice(0, 5))}.
  Current Weak Application Areas: ${JSON.stringify(profile.topic_performance)}.

  Predict future performance trends.
  Return JSON:
  {
      "prediction": "Short 1-sentence prediction (e.g. 'On track to score A' or 'Risk of falling behind in Algebra').",
      "insights": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
      "recommendedFocus": "Specific topic to focus on next."
  }`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING },
            insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedFocus: { type: Type.STRING }
          },
          required: ["prediction", "insights", "recommendedFocus"]
        }
      }
    }));
    return safeJsonParse<{ prediction: string; insights: string[]; recommendedFocus: string }>(response.text, "Failed to generate prediction.");
  } catch (error) {
    return {
      prediction: "Data insufficient for prediction.",
      insights: ["Keep practicing to generate more data."],
      recommendedFocus: "General Review"
    };
  }
}

export interface Atom {
  element: string;
  position: [number, number, number];
  color: string;
  size: number;
}

export interface MoleculeData {
  name: string;
  description: string;
  atoms: Atom[];
  bonds: [number, number][]; // Indices of connected atoms
}

export async function generate3DMolecule(
  moleculeName: string
): Promise<MoleculeData> {
  const ai = getAiClient();
  const prompt = `Generate a 3D structural model for the molecule: "${moleculeName}".
  Provide approximate 3D coordinates for visualization.
  Return JSON:
  {
      "name": "Formal Name",
      "description": "Short 1-sentence description (e.g. 'Found in coffee, acts as a stimulant').",
      "atoms": [
          { "element": "C", "position": [x, y, z], "color": "hex code (e.g. #333333 for Carbon)", "size": 0.8 }
      ],
      "bonds": [[index1, index2], ...]
  }
  Ensure coordinates are centered around 0,0,0 and scaled reasonably (e.g. within -3 to 3 range).`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            atoms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  element: { type: Type.STRING },
                  position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  color: { type: Type.STRING },
                  size: { type: Type.NUMBER }
                },
                required: ["element", "position", "color", "size"]
              }
            },
            bonds: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              }
            }
          },
          required: ["name", "description", "atoms", "bonds"]
        }
      }
    }));

    return safeJsonParse<MoleculeData>(response.text, "Failed to generate molecule data.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export async function getSubjectChapters(profile: StudentProfile, board: string = 'CBSE'): Promise<string[]> {
  // First, check if we have predefined modules for this subject
  // First, check if we have predefined modules for this subject
  const localModules = LEARNING_MODULES.filter(m => {
    const mSub = (m.subject || "").toLowerCase().trim();
    const pSub = (profile.subject || "").toLowerCase().trim();

    // Handle Math variations
    const isMath = (s: string) => s === 'math' || s === 'maths' || s === 'mathematics';
    if (isMath(mSub) && isMath(pSub)) return true;

    return mSub === pSub || pSub.includes(mSub);
  });

  if (localModules.length > 0) {
    return localModules.map(m => m.title);
  }

  const ai = getAiClient();

  // Special handling for language subjects
  const isLanguageSubject = profile.subject.toLowerCase().includes('english') ||
    profile.subject.toLowerCase().includes('hindi') ||
    profile.subject.toLowerCase().includes('language');

  const prompt = isLanguageSubject
    ? `You are an expert academic counselor for Indian schools.
  List the GRAMMAR and LITERATURE topics covered in ${board} Class ${profile.grade} ${profile.subject} syllabus.
  
  For GRAMMAR, include topics like:
  - Tenses (Present, Past, Future)
  - Parts of Speech (Nouns, Pronouns, Verbs, Adjectives, Adverbs)
  - Sentence Structure
  - Active and Passive Voice
  - Direct and Indirect Speech
  - Clauses and Phrases
  
  For LITERATURE, include:
  - Prose chapters from the textbook
  - Poetry chapters
  - Supplementary reader chapters
  
  Return a JSON array with ALL topics in the order they appear in the syllabus.
  Example: ["Tenses", "Nouns and Pronouns", "The Lost Child (Prose)", "The Road Not Taken (Poem)"]`
    : `You are an expert academic counselor for Indian schools.
  Retrieve the PRECISE, OFFICIAL list of chapters for:
  Board: ${board}
  Class: ${profile.grade}
  Subject: ${profile.subject}
 
  Rules:
  1. Use the EXACT names as found in the NCERT textbooks (for CBSE) or official ICSE textbooks.
  2. Do not summarize or abbreviate.
  3. Order them correctly as they appear in the syllabus.
  4. Return ONLY a JSON array of strings.
 
  Example Output:
  ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals"]`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    }));

    return safeJsonParse<string[]>(response.text, "Failed to fetch chapters.");
  } catch (error) {
    console.error("Failed to fetch chapters:", error);
    return [`Chapter 1: ${profile.subject} Basics`, `Chapter 2: Advanced ${profile.subject}`, "Chapter 3: Application", "Chapter 4: Case Studies"];
  }
}

export interface ChapterQAItem {
  question: string;
  answer: string;
  type: 'VSA' | 'SA' | 'LA'; // Very Short Answer, Short Answer, Long Answer
  marks: number;
}

export async function generateChapterQA(
  profile: StudentProfile,
  chapterName: string
): Promise<{ chapterName: string; questions: ChapterQAItem[] }> {
  const ai = getAiClient();
  const prompt = `Generate a comprehensive Question & Answer set for the chapter: "${chapterName}".
  Grade: ${profile.grade}, Subject: ${profile.subject}.
  
  Include:
  1. 5 Very Short Answer (VSA) questions (1 mark).
  2. 5 Short Answer (SA) questions (3 marks).
  3. 2 Long Answer (LA) questions (5 marks).
  
  Return JSON:
  {
      "chapterName": "${chapterName}",
      "questions": [
          { "question": "...", "answer": "...", "type": "VSA", "marks": 1 }
      ]
  }`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chapterName: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["VSA", "SA", "LA"] },
                  marks: { type: Type.NUMBER }
                },
                required: ["question", "answer", "type", "marks"]
              }
            }
          },
          required: ["chapterName", "questions"]
        }
      }
    }));

    return safeJsonParse<{ chapterName: string; questions: ChapterQAItem[] }>(response.text, "Failed to generate chapter Q&A.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export interface Flashcard {
  front: string;
  back: string;
  category: string;
}

export async function generateFlashcards(
  topic: string,
  profile: Pick<StudentProfile, 'grade' | 'subject'>
): Promise<Flashcard[]> {
  const ai = getAiClient();
  const prompt = `Create 10 study flashcards for the topic: "${topic}".
    Target: Grade ${profile.grade} ${profile.subject} student.
    
    The cards should cover key definitions, formulas, important dates, or core concepts.
    "Front" should be the term, question, or concept.
    "Back" should be the clear, concise definition, answer, or explanation.
    
    Return JSON array of objects:
    [
        { "front": "Photosynthesis", "back": "The process by which plants make food using sunlight.", "category": "Definition" }
    ]`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["front", "back", "category"]
          }
        }
      }
    }));

    return safeJsonParse<Flashcard[]>(response.text, "Failed to generate flashcards.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}


export interface PodcastSegment {
  speaker: 'Host' | 'Expert';
  content: string;
}

export async function generatePodcastScript(
  files: File[],
  profile: StudentProfile
): Promise<{ title: string; segments: PodcastSegment[] }> {
  const ai = getAiClient();
  const imageParts = files.length > 0 ? await Promise.all(files.map(fileToGenerativePart)) : [];

  const prompt = `You are an expert audio producer for a educational podcast series. 
  Your goal is to transform the provided study materials into a 5-minute engaging, conversational deep-dive podcast script.
  
  The Podcast features two speakers:
  1. The Host (Alex): Energetic, curious, asks many 'why' and 'how' questions, relates things to everyday life.
  2. The Expert (Dr. Sam): Calm, brilliant, uses simple analogies to explain complex topics, patient and thorough.
  
  Format the script as a dynamic conversation where they build on each other's points.
  The total script should be about 10-15 segments.
  
  Student Info: Grade ${profile.grade}, Subject ${profile.subject}.
  
  Return strictly valid JSON:
  {
      "title": "An engaging title for this episode",
      "segments": [
          { "speaker": "Host", "content": "..." },
          { "speaker": "Expert", "content": "..." }
      ]
  }`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, enum: ['Host', 'Expert'] },
                  content: { type: Type.STRING }
                },
                required: ["speaker", "content"]
              }
            }
          },
          required: ["title", "segments"]
        }
      }
    }));

    return safeJsonParse<{ title: string; segments: PodcastSegment[] }>(response.text, "Failed to generate podcast script.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

export interface PatternGame {
  sequence: string[];
  missingIndex: number;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export async function generatePatternGame(
  grade: number,
  topic: string
): Promise<PatternGame> {
  const ai = getAiClient();
  const prompt = `Create a "Find the Pattern" logic game for Grade ${grade} Math.
    Topic: ${topic} (e.g., Arithmetic Sequences, Geometric Progressions, Fibonacci, Prime Numbers, Square Numbers).
    
    1. specific math sequence with ONE missing number represented by "?".
    2. Provide 4 options.
    3. Explain the logic clearly.
    
    Return JSON:
    {
        "sequence": ["2", "4", "8", "?", "32"],
        "missingIndex": 3,
        "options": ["12", "16", "24", "10"],
        "correctAnswer": "16",
        "explanation": "Multiply previous number by 2.",
        "difficulty": "Medium"
    }`;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sequence: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingIndex: { type: Type.NUMBER },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
          },
          required: ["sequence", "missingIndex", "options", "correctAnswer", "explanation", "difficulty"]
        }
      }
    }));

    return safeJsonParse<PatternGame>(response.text, "Failed to generate pattern game.");
  } catch (error) {
    throw new Error(handleApiError(error));
  }
}

