import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const REMIX_SYSTEM_PROMPT = `You are a game developer AI that MODIFIES existing HTML5 games. The user will provide existing game HTML code and a modification request.

CRITICAL REQUIREMENTS:
- You MUST return the COMPLETE modified HTML file (not just the changed parts)
- Keep all existing game logic intact unless the modification specifically changes it
- The game MUST remain a complete, single HTML file with inline CSS and JS
- Use <canvas> element for the game (id="gameCanvas")
- DO NOT use any external libraries or CDNs
- DO NOT include any explanation text - ONLY output the raw HTML code
- Start directly with <!DOCTYPE html> and end with </html>
- Make sure the game loop uses requestAnimationFrame
- Handle edge cases (boundaries, collisions properly)
- All text in the game should be in Korean

IMPORTANT - GLOBAL VARIABLES (must keep these):
- var score = 0; var gameOver = false;
- var keys = {};
- These allow the parent page to detect game over and inject mobile touch controls.

RESPOND WITH ONLY THE MODIFIED HTML CODE. No markdown, no backticks, no explanation.`;

// Rate limiting shared with generate
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: '요청 제한에 도달했습니다. 1분 후 다시 시도해주세요.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { html, prompt } = await request.json();

    if (!html || typeof html !== 'string') {
      return new Response(
        JSON.stringify({ error: '게임 코드가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: '수정 요청을 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const userMessage = `Here is the current game HTML code:

\`\`\`html
${html}
\`\`\`

Please modify this game with the following request: ${prompt}`;

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
      system: REMIX_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    console.error('Remix error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `게임 수정 중 오류가 발생했습니다: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const maxDuration = 60;
