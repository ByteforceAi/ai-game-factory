import { NextRequest, NextResponse } from 'next/server';
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

// Simple in-memory rate limiting (use Upstash Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

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
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: '요청 제한에 도달했습니다. 1분 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    const { prompt } = await request.json();

    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '게임 아이디어를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: '프롬프트는 500자 이내로 입력해주세요.' },
        { status: 400 }
      );
    }

    // Claude API call
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: GAME_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract HTML from response
    let html = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Clean up if wrapped in markdown code blocks
    if (html.includes('```html')) {
      html = html.split('```html')[1].split('```')[0];
    } else if (html.includes('```')) {
      html = html.split('```')[1].split('```')[0];
    }
    html = html.trim();

    // Validate output
    if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html') && !html.startsWith('<')) {
      return NextResponse.json(
        { error: '유효한 게임 코드를 생성하지 못했습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ html });
  } catch (error: unknown) {
    console.error('Game generation error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `게임 생성 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}

// Vercel serverless function config
export const maxDuration = 60; // 60 second timeout for game generation
