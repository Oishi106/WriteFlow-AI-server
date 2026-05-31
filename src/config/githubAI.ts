import OpenAI from 'openai';

const githubAI = new OpenAI({
  baseURL: 'https://models.github.ai/inference',
  apiKey: process.env.GITHUB_TOKEN!,
});

export default githubAI;
