import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/kvStore';

export async function POST(request: NextRequest) {
  try {
    const { html, title } = await request.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: '게임 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    if (html.length > 100_000) {
      return NextResponse.json(
        { error: '게임 코드가 너무 큽니다. (최대 100KB)' },
        { status: 400 }
      );
    }

    // Generate short ID
    const id = crypto.randomUUID().slice(0, 8);
    const gameData = {
      html,
      title: title || 'AI Generated Game',
      createdAt: Date.now(),
    };

    // Store with 30-day TTL (인메모리 폴백에선 TTL 미적용)
    await store.set(`game:${id}`, JSON.stringify(gameData), { ex: 30 * 24 * 60 * 60 });

    // Add to gallery sorted set (score = timestamp)
    await store.zadd('gallery:recent', { score: Date.now(), member: id });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const url = `${baseUrl}/play/${id}`;

    return NextResponse.json({ id, url });
  } catch (error: unknown) {
    console.error('Share error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `공유 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}
