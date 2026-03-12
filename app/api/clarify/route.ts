import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const CLARIFY_SYSTEM_PROMPT = `You are a creative game designer AI assistant. The user will describe a game idea. Your job is to ask 2-3 clarifying questions that help narrow down the game design before code generation.

Return a JSON object with this exact structure:
{
  "summary": "A one-line summary of what you understood (in Korean)",
  "questions": [
    {
      "question": "The question text (in Korean)",
      "options": [
        { "label": "Option label (in Korean)", "value": "short English keyword for prompt enrichment" },
        { "label": "...", "value": "..." }
      ]
    }
  ]
}

RULES:
- Ask 2-3 questions maximum
- Each question should have 2-4 options
- Questions should cover: visual style, core mechanic variation, difficulty/progression
- All question text and option labels must be in Korean
- Option values should be concise English keywords for prompt enrichment
- Make questions fun and engaging, not boring
- RESPOND WITH ONLY THE JSON. No markdown, no backticks, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json();

    if (!idea || typeof idea !== 'string') {
      return new Response(
        JSON.stringify({ error: '게임 아이디어를 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: CLARIFY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: idea }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response (handle possible markdown wrapping)
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Clarify error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `질문 생성 중 오류: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
