import { NextRequest } from 'next/server';
import { store } from '@/lib/kvStore';

export interface LeaderboardEntry {
  name: string;
  score: number;
  ts: number;
}

const MAX_ENTRIES = 50;

export async function GET(request: NextRequest) {
  try {
    const gameId = request.nextUrl.searchParams.get('gameId');
    if (!gameId) {
      return Response.json({ error: 'gameId is required' }, { status: 400 });
    }

    const key = `lb:${gameId}`;
    const entries = (await store.get<LeaderboardEntry[]>(key)) || [];

    return Response.json({ leaderboard: entries });
  } catch (error) {
    console.error('Leaderboard GET error:', error);
    return Response.json({ leaderboard: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { gameId, name, score } = await request.json();

    if (!gameId || !name || typeof score !== 'number') {
      return Response.json(
        { error: 'gameId, name, and score are required' },
        { status: 400 }
      );
    }

    // Sanitize name
    const cleanName = String(name).trim().slice(0, 20);
    if (!cleanName) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const key = `lb:${gameId}`;
    const current = (await store.get<LeaderboardEntry[]>(key)) || [];

    // Add new entry
    const newEntry: LeaderboardEntry = {
      name: cleanName,
      score,
      ts: Date.now(),
    };
    current.push(newEntry);

    // Sort by score descending, then by timestamp ascending (earlier = better for ties)
    current.sort((a, b) => b.score - a.score || a.ts - b.ts);

    // Keep top N
    const trimmed = current.slice(0, MAX_ENTRIES);
    await store.set(key, trimmed);

    // Find the new entry's rank
    const rank = trimmed.findIndex(
      (e) => e.name === cleanName && e.score === score && e.ts === newEntry.ts
    );

    return Response.json({
      leaderboard: trimmed.slice(0, 10),
      rank: rank + 1,
      totalPlayers: trimmed.length,
    });
  } catch (error) {
    console.error('Leaderboard POST error:', error);
    return Response.json(
      { error: '점수 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
