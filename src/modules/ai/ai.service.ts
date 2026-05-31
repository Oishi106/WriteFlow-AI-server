import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env';

let genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
  if (!genAI) {
    if (!config.geminiApiKey) throw new Error('Gemini API key not configured.');
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
};

const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

// ─── Agent 1: Content Draft Agent ─────────────────────────────────────────────

export const generateContent = async (
  topic: string,
  tone: string,
  targetAudience: string,
  contentType: 'blog' | 'social' | 'email' | 'ad-copy',
  userId: string
) => {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });

  const contentTypeInstructions = {
    blog: 'a comprehensive blog post with introduction, 3-5 main sections with headings, and a conclusion',
    social: 'engaging social media captions for Instagram, Twitter/X, and LinkedIn — each optimized for that platform',
    email: 'a professional email with subject line, greeting, body, call-to-action, and sign-off',
    'ad-copy': 'compelling ad copy with headline, body text, and a strong call-to-action',
  };

  const prompt = `You are WriteFlow AI, a professional content creation assistant.

Create ${contentTypeInstructions[contentType]} about: "${topic}"

Requirements:
- Tone: ${tone}
- Target audience: ${targetAudience}
- Content type: ${contentType}

Also provide:
1. A suggested title/headline
2. A meta description (150-160 characters for SEO)
3. 5 relevant tags/keywords

Format your response as JSON with this structure:
{
  "title": "...",
  "metaDescription": "...",
  "tags": ["...", "...", "...", "...", "..."],
  "content": "...",
  "wordCount": number
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const tokensUsed = estimateTokens(prompt + text);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return { data: JSON.parse(jsonMatch[0]), tokensUsed };
  } catch {
    // Return as-is if not valid JSON
  }

  return {
    data: { title: topic, content: text, metaDescription: '', tags: [], wordCount: estimateTokens(text) * 4 },
    tokensUsed,
  };
};

// ─── Agent 2: Rewrite & Tone Agent ────────────────────────────────────────────

export const rewriteContent = async (
  content: string,
  tone: 'formal' | 'casual' | 'persuasive' | 'friendly',
  action: 'rewrite' | 'shorten' | 'expand' | 'fix-grammar' | 'improve-clarity',
  userId: string
) => {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });

  const actionInstructions = {
    rewrite: `Rewrite the following text in a ${tone} tone, maintaining the core message`,
    shorten: `Shorten the following text to 50% of its length while keeping key points, using a ${tone} tone`,
    expand: `Expand the following text to 2x its length with more detail and examples, using a ${tone} tone`,
    'fix-grammar': `Fix all grammatical errors, spelling mistakes, and punctuation issues in the following text`,
    'improve-clarity': `Improve the clarity and readability of the following text, using a ${tone} tone`,
  };

  const prompt = `You are a professional writing editor.

${actionInstructions[action]}:

"${content}"

Return ONLY the rewritten text without any explanations or formatting markers.`;

  const result = await model.generateContent(prompt);
  const rewrittenText = result.response.text();

  const tokensUsed = estimateTokens(prompt + rewrittenText);

  return { data: { rewrittenContent: rewrittenText }, tokensUsed };
};

// ─── Agent 3: AI Content Chat Assistant ───────────────────────────────────────

export const chatWithAssistant = async (
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  documentContext: string,
  userId: string
) => {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });

  const systemPrompt = `You are WriteFlow AI's writing assistant. You help users with their content creation.
${documentContext ? `\nCurrent document context:\n"${documentContext.slice(0, 500)}..."` : ''}

You can:
- Answer writing-related questions
- Suggest ideas, outlines, and improvements
- Help with research and fact-checking
- Provide feedback on writing style and structure

Be concise, helpful, and actionable.`;

  const chat = model.startChat({
    history: messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
    generationConfig: { maxOutputTokens: 1000 },
  });

  const lastMessage = messages[messages.length - 1];
  const fullPrompt = messages.length === 1 ? `${systemPrompt}\n\nUser: ${lastMessage.content}` : lastMessage.content;

  const result = await chat.sendMessage(fullPrompt);
  const response = result.response.text();

  const tokensUsed = estimateTokens(fullPrompt + response);

  return { data: { response }, tokensUsed };
};

// ─── Agent 4: Review Summariser (Admin) ───────────────────────────────────────

export const summariseReviews = async (
  reviews: Array<{ rating: number; comment: string }>,
  userId: string
) => {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });

  const reviewsText = reviews
    .map((r, i) => `Review ${i + 1} (${r.rating}/5): "${r.comment}"`)
    .join('\n');

  const prompt = `Analyze the following user reviews and provide a summary:

${reviewsText}

Return a JSON object with:
{
  "summary": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": number between 0-100,
  "averageRating": number,
  "keyThemes": ["theme1", "theme2", "theme3"],
  "recommendationRate": number percentage
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const tokensUsed = estimateTokens(prompt + text);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return { data: JSON.parse(jsonMatch[0]), tokensUsed };
  } catch {
    // fallback
  }

  return { data: { summary: [text], sentiment: 'neutral', sentimentScore: 50 }, tokensUsed };
};

// ─── Generate Description ──────────────────────────────────────────────────────

export const generateDescription = async (title: string, category: string, userId: string) => {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Generate a compelling, concise product/template description (max 150 words) for:
Title: "${title}"
Category: "${category}"

Make it engaging, specific, and highlight the value it provides.`;

  const result = await model.generateContent(prompt);
  const description = result.response.text();

  const tokensUsed = estimateTokens(prompt + description);

  return { data: { description: description.trim() }, tokensUsed };
};
