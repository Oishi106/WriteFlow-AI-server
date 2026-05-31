import { Response } from 'express';
import githubAI from '../config/githubAI';
import { AILog } from '../models/ailog.model';
import { Review } from '../modules/reviews/review.model';
import { AuthRequest } from '../types';

const writeAILog = async (
  req: AuthRequest,
  agentUsed: 'Chat Assistant' | 'Content Draft' | 'Rewrite & Tone' | 'Review Summariser',
  prompt: string,
  tokensUsed: number
): Promise<void> => {
  try {
    await AILog.create({
      userId: req.user?._id || req.user?.id,
      agentUsed,
      prompt: prompt.substring(0, 200),
      tokensUsed,
    });
  } catch (_) {
    // no-op
  }
};

export const chat = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful writing assistant for a content creation platform. Help users with writing, content ideas, travel suggestions, restaurant recommendations, and general questions.',
      },
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: h.role === 'ai' ? 'assistant' : 'user',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await githubAI.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || '';

    await writeAILog(
      req,
      'Chat Assistant',
      (req.body.message || req.body.topic || req.body.title || req.body.text || '').substring(0, 200),
      response.usage?.total_tokens || 0
    );

    return res.status(200).json({ success: true, data: { reply } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, message: 'AI chat failed', error: message });
  }
};

export const generateDescription = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { title, topic, tone, audience } = req.body;

    if (!title && !topic) {
      return res.status(400).json({ success: false, message: 'Title or topic is required' });
    }

    const subject = topic || title;
    const prompt = `You are a professional content writer. Write a detailed, engaging ${tone || 'professional'} piece of content about: "${subject}".
Target audience: ${audience || 'general readers'}.
Requirements:
- Write exactly 3 well-structured paragraphs
- Start with a compelling introduction paragraph
- Use ${tone || 'professional'} language throughout
- Make it original and informative
- Do not include any meta-commentary, just the content itself`;

    const response = await githubAI.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '';

    await writeAILog(
      req,
      'Content Draft',
      (req.body.message || req.body.topic || req.body.title || req.body.text || '').substring(0, 200),
      response.usage?.total_tokens || 0
    );

    return res.status(200).json({ success: true, data: { content } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, message: 'Content generation failed', error: message });
  }
};

export const rewriteContent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { text, tone } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const toneMap: Record<string, string> = {
      formal: 'in a formal, professional tone',
      casual: 'in a casual, friendly conversational tone',
      persuasive: 'in a persuasive tone designed to motivate action',
      friendly: 'in a warm, approachable, friendly tone',
      shorter: 'more concisely - reduce the length by half while keeping all key points',
      longer: 'in more detail - expand with additional examples and explanations, doubling the length',
      'fix-grammar': 'with all grammar, spelling, punctuation, and sentence structure errors corrected',
    };

    const instruction = toneMap[tone] || 'in a clear, professional tone';
    const prompt = `Rewrite the following text ${instruction}. Return only the rewritten text, no explanations:\n\n${text}`;

    const response = await githubAI.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';

    await writeAILog(
      req,
      'Rewrite & Tone',
      (req.body.message || req.body.topic || req.body.title || req.body.text || '').substring(0, 200),
      response.usage?.total_tokens || 0
    );

    return res.status(200).json({ success: true, data: { content } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, message: 'Rewrite failed', error: message });
  }
};

export const reviewSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { itemId, reviews } = req.body;

    let fetchedReviews: Array<{ rating: number; comment: string }> = reviews || [];

    if (!fetchedReviews.length) {
      if (!itemId) {
        return res.status(200).json({
          success: true,
          data: { summary: 'No reviews available to summarize.' },
        });
      }

      fetchedReviews = await Review.find({ itemId, approved: true })
        .select('rating comment')
        .lean();
    }

    if (!fetchedReviews.length) {
      return res.status(200).json({
        success: true,
        data: { summary: 'No reviews available to summarize.' },
      });
    }

    const reviewLines = fetchedReviews
      .map((r, i) => `Review ${i + 1} (${r.rating}/5 stars): ${r.comment}`)
      .join('\n');

    const prompt = `Analyze these customer reviews and provide a structured 3-bullet-point summary:\n\n${reviewLines}\n\nFormat your response as exactly 3 bullet points:\n• Overall sentiment and what customers love most\n• Main concerns or areas for improvement  \n• Key recommendation for potential customers\n\nReturn only the 3 bullet points, nothing else.`;

    const response = await githubAI.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    });

    const summary = response.choices[0]?.message?.content || '';

    await writeAILog(
      req,
      'Review Summariser',
      (req.body.message || req.body.topic || req.body.title || req.body.text || '').substring(0, 200),
      response.usage?.total_tokens || 0
    );

    return res.status(200).json({ success: true, data: { summary } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, message: 'Review summary failed', error: message });
  }
};
