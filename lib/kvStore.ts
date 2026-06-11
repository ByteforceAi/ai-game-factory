// ── KV 스토어 어댑터 ──
// Vercel KV 환경변수가 있으면 실제 KV, 없으면 인메모리 폴백.
// 폴백은 서버 재시작 시 소멸되고 서버리스에선 인스턴스별로 따로 논다 —
// 로컬 시연/교실 데모용이며, 영속이 필요한 운영 배포에는 KV 연결이 필요하다.
import { kv as vercelKv } from '@vercel/kv';

const hasKV =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

// globalThis 싱글톤 — Next dev/프로덕션 모두 라우트별 번들이 모듈을 따로
// 인스턴스화할 수 있어, 모듈 스코프 Map이면 라우트끼리 데이터가 갈라진다
const g = globalThis as unknown as {
  __aigfMem?: Map<string, unknown>;
  __aigfMemZ?: Map<string, Map<string, number>>;
};
const mem: Map<string, unknown> = g.__aigfMem ?? (g.__aigfMem = new Map());
// sorted set: member → score
const memZ: Map<string, Map<string, number>> =
  g.__aigfMemZ ?? (g.__aigfMemZ = new Map());

export const usingMemoryStore = !hasKV;

export const store = hasKV
  ? {
      get: <T>(key: string) => vercelKv.get<T>(key),
      set: (key: string, value: unknown, opts?: { ex?: number }) =>
        vercelKv.set(key, value, opts as { ex: number } | undefined),
      zadd: (key: string, entry: { score: number; member: string }) =>
        vercelKv.zadd(key, entry),
      zrange: (key: string, start: number, stop: number, opts?: { rev?: boolean }) =>
        vercelKv.zrange(key, start, stop, opts),
    }
  : {
      async get<T>(key: string): Promise<T | null> {
        return mem.has(key) ? (mem.get(key) as T) : null;
      },
      async set(key: string, value: unknown, _opts?: { ex?: number }) {
        mem.set(key, value);
        return 'OK' as const;
      },
      async zadd(key: string, entry: { score: number; member: string }) {
        const z = memZ.get(key) ?? new Map<string, number>();
        z.set(entry.member, entry.score);
        memZ.set(key, z);
        return 1;
      },
      async zrange(
        key: string,
        start: number,
        stop: number,
        opts?: { rev?: boolean }
      ) {
        const z = memZ.get(key);
        if (!z) return [] as string[];
        const sorted = Array.from(z.entries())
          .sort((a, b) => (opts?.rev ? b[1] - a[1] : a[1] - b[1]))
          .map(([member]) => member);
        return sorted.slice(start, stop + 1);
      },
    };
