import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Get latest 30 game IDs from sorted set (newest first)
    const ids = await kv.zrange('gallery:recent', 0, 29, { rev: true }) as string[];

    if (!ids || ids.length === 0) {
      return NextResponse.json({ games: [] });
    }

    // Fetch game data for each ID
    const games = await Promise.all(
      ids.map(async (id) => {
        const raw = await kv.get(`game:${id}`) as string | null;
        if (!raw) return null;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return {
          id,
          title: data.title || 'AI Generated Game',
          createdAt: data.createdAt,
        };
      })
    );

    return NextResponse.json({
      games: games.filter(Boolean),
    });
  } catch (error: unknown) {
    console.error('Gallery error:', error);
    return NextResponse.json({ games: [] });
  }
}
