import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const GAME_SYSTEM_PROMPT = `You are a game developer AI. The user will describe a game idea in Korean or English. You must generate a COMPLETE, PLAYABLE HTML5 game using only HTML, CSS, and vanilla JavaScript in a single HTML file.

CRITICAL REQUIREMENTS:
- The game MUST be a complete, single HTML file with inline CSS and JS
- Use <canvas> element for the game (id="gameCanvas")
- The canvas should be 600x400 pixels
- Include a score display
- Include game over logic with a restart button
- Use keyboard controls (arrow keys or WASD) and/or mouse/touch
- Make it fun and polished with smooth animations
- Include a brief instruction text at the start
- Use clean, colorful visuals with gradients and shadows
- The game must be immediately playable
- All text in the game should be in Korean
- DO NOT use any external libraries or CDNs
- DO NOT include any explanation text - ONLY output the raw HTML code
- Start directly with <!DOCTYPE html> and end with </html>
- Make sure the game loop uses requestAnimationFrame
- Handle edge cases (boundaries, collisions properly)

RESPOND WITH ONLY THE HTML CODE. No markdown, no backticks, no explanation.`;

// Simple in-memory rate limiting (use Vercel KV in production)
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

    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: '게임 아이디어를 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (prompt.length > 500) {
      return new Response(
        JSON.stringify({ error: '프롬프트는 500자 이내로 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: GAME_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
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
    console.error('Game generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `게임 생성 중 오류가 발생했습니다: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const maxDuration = 60;
