// Code Streaming Simulator
// Simulates real Claude-like code generation with buffering + burst patterns

export const GENERATE_STATUS_MESSAGES = [
  'Neural Engine 초기화 중...',
  'WebGL 렌더링 컨텍스트 생성 중...',
  'HTML5 캔버스 설정 중...',
  '게임 엔진 아키텍처 설계 중...',
  '물리 엔진 파라미터 계산 중...',
  '렌더링 파이프라인 구성 중...',
  'Sprite 시스템 빌드 중...',
  '충돌 감지 알고리즘 생성 중...',
  'AABB hitbox 최적화 중...',
  '게임 로직 트리 생성 중...',
  'State machine 패턴 적용 중...',
  '입력 핸들러 연결 중...',
  '터치 이벤트 리스너 바인딩 중...',
  '키보드 입력 매핑 중...',
  'Web Audio API 초기화 중...',
  '사운드 이펙트 합성 중...',
  '파티클 시스템 생성 중...',
  '점수 시스템 설계 중...',
  'UI 오버레이 렌더링 중...',
  'HUD 컴포넌트 배치 중...',
  '게임 밸런싱 파라미터 튜닝 중...',
  '난이도 커브 계산 중...',
  '메모리 최적화 패스 실행 중...',
  'requestAnimationFrame 루프 구성 중...',
  'Garbage collection 최적화 중...',
  '터치 컨트롤 반응성 테스트 중...',
  '최종 빌드 컴파일 중...',
  '코드 minification 실행 중...',
  'Tree-shaking 최적화 중...',
  '빌드 무결성 검증 중...',
];

export const VIBE_STATUS_MESSAGES = [
  'AI가 코드를 분석 중...',
  '수정할 부분을 찾는 중...',
  '게임 로직 업그레이드 중...',
  '새로운 파라미터 적용 중...',
  '렌더링 최적화 중...',
  '변경사항 컴파일 중...',
  '테스트 실행 중...',
  '최종 빌드 완료 중...',
];

export interface SimulationCallbacks {
  onCodeChunk: (code: string) => void;
  onStatusChange: (status: string) => void;
  onProgress: (percent: number) => void;
  onComplete: (fullCode: string) => void;
}

/**
 * Tokenize HTML source into LLM-like tokens.
 * Groups: tags, attributes, strings, keywords, whitespace, words.
 */
function tokenize(source: string): string[] {
  const tokens: string[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let pos = 0;
    while (pos < line.length) {
      const remaining = line.slice(pos);

      // HTML tag opening/closing
      const tagMatch = remaining.match(/^<\/?[a-zA-Z][a-zA-Z0-9]*\s*/);
      if (tagMatch) {
        tokens.push(tagMatch[0]);
        pos += tagMatch[0].length;
        continue;
      }

      // HTML attribute like: key="value" or key='value'
      const attrMatch = remaining.match(/^[a-zA-Z\-]+\s*=\s*["'][^"']*["']\s*/);
      if (attrMatch && attrMatch[0].length <= 60) {
        const attr = attrMatch[0];
        if (attr.length > 15) {
          tokens.push(attr.slice(0, Math.ceil(attr.length / 2)));
          tokens.push(attr.slice(Math.ceil(attr.length / 2)));
        } else {
          tokens.push(attr);
        }
        pos += attr.length;
        continue;
      }

      // Closing >
      const closeTag = remaining.match(/^\/?\s*>/);
      if (closeTag) {
        tokens.push(closeTag[0]);
        pos += closeTag[0].length;
        continue;
      }

      // Leading whitespace (indent)
      const wsMatch = remaining.match(/^\s{2,}/);
      if (wsMatch) {
        tokens.push(wsMatch[0]);
        pos += wsMatch[0].length;
        continue;
      }

      // JS keywords / identifiers
      const wordMatch = remaining.match(/^(var|let|const|function|return|if|else|for|while|this|new|class|import|export|default|true|false|null|undefined|typeof|instanceof|switch|case|break|continue|throw|try|catch|finally|async|await)\b/);
      if (wordMatch) {
        tokens.push(wordMatch[0]);
        pos += wordMatch[0].length;
        continue;
      }

      // Numbers
      const numMatch = remaining.match(/^-?\d+\.?\d*/);
      if (numMatch) {
        tokens.push(numMatch[0]);
        pos += numMatch[0].length;
        continue;
      }

      // String literals (short)
      const strMatch = remaining.match(/^['"][^'"]{0,20}['"]/);
      if (strMatch) {
        tokens.push(strMatch[0]);
        pos += strMatch[0].length;
        continue;
      }

      // Operators and punctuation
      const opMatch = remaining.match(/^(===|!==|=>|<=|>=|\|\||&&|[+\-*/%=<>!&|^~?:;,.()\[\]{}])/);
      if (opMatch) {
        tokens.push(opMatch[0]);
        pos += opMatch[0].length;
        continue;
      }

      // Generic word/identifier
      const identMatch = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
      if (identMatch) {
        tokens.push(identMatch[0]);
        pos += identMatch[0].length;
        continue;
      }

      // Fallback: single character
      tokens.push(remaining[0]);
      pos += 1;
    }

    if (i < lines.length - 1) {
      tokens.push('\n');
    }
  }
  return tokens;
}

/* ═══════════════════════════════════════════════
   Claude-like burst/pause schedule generator
   Real LLM output pattern: fast burst → buffer pause → fast burst
   ═══════════════════════════════════════════════ */
interface BurstSegment {
  startToken: number;
  endToken: number;
  duration: number;      // ms for this burst
  pauseAfter: number;    // ms pause after burst
}

function generateBurstSchedule(totalTokens: number, totalDuration: number): BurstSegment[] {
  const segments: BurstSegment[] = [];
  const avgBurstSize = Math.floor(totalTokens / 20); // ~20 bursts
  let tokenPos = 0;

  // Reserve ~25% of total time for pauses
  const activeDuration = totalDuration * 0.72;
  const pauseBudget = totalDuration * 0.28;

  // Generate bursts with varying sizes
  const bursts: number[] = [];
  while (tokenPos < totalTokens) {
    // Vary burst size: small (0.4x) to large (2x)
    const variance = 0.4 + Math.random() * 1.6;
    const size = Math.min(
      Math.floor(avgBurstSize * variance),
      totalTokens - tokenPos
    );
    bursts.push(size);
    tokenPos += size;
  }

  // Distribute time proportionally
  const totalBurstTokens = bursts.reduce((a, b) => a + b, 0);
  tokenPos = 0;

  // Create pause distribution — some long (thinking), some short (buffering)
  const numPauses = bursts.length;
  const pauses: number[] = [];
  let pauseUsed = 0;

  for (let i = 0; i < numPauses; i++) {
    const progress = i / numPauses;
    let pause: number;

    // Major thinking pauses at ~15%, ~40%, ~65%, ~85%
    if (Math.abs(progress - 0.15) < 0.04 ||
        Math.abs(progress - 0.40) < 0.04 ||
        Math.abs(progress - 0.65) < 0.04 ||
        Math.abs(progress - 0.85) < 0.04) {
      pause = 800 + Math.random() * 1200; // 0.8-2s thinking pause
    }
    // Minor buffer pauses
    else if (Math.random() < 0.35) {
      pause = 200 + Math.random() * 500; // 0.2-0.7s buffer
    }
    // Tiny micro-pauses
    else {
      pause = 30 + Math.random() * 120; // 30-150ms
    }

    pauses.push(pause);
    pauseUsed += pause;
  }

  // Scale pauses to fit budget
  const pauseScale = pauseBudget / (pauseUsed || 1);
  for (let i = 0; i < pauses.length; i++) {
    pauses[i] = Math.max(20, pauses[i] * pauseScale);
  }

  // Last burst has no pause after
  if (pauses.length > 0) pauses[pauses.length - 1] = 0;

  // Build segments
  for (let i = 0; i < bursts.length; i++) {
    const burstTokens = bursts[i];
    const burstDuration = (burstTokens / totalBurstTokens) * activeDuration;

    segments.push({
      startToken: tokenPos,
      endToken: tokenPos + burstTokens,
      duration: Math.max(100, burstDuration),
      pauseAfter: pauses[i] || 0,
    });

    tokenPos += burstTokens;
  }

  return segments;
}

/**
 * Simulate Claude-like code generation with:
 * - Burst → pause → burst pattern (like real LLM streaming)
 * - Variable speed (fast for boilerplate, slow for logic)
 * - "Buffering" pauses where cursor blinks but nothing writes
 * - Gradual ramp-up at start, sprint at end
 */
export function simulateCodeGeneration(
  gameHtml: string,
  callbacks: SimulationCallbacks,
  durationMs: number = 20000,
  statusMessages: string[] = GENERATE_STATUS_MESSAGES
): { cancel: () => void } {
  const tokens = tokenize(gameHtml);
  const totalTokens = tokens.length;
  let cancelled = false;
  let currentToken = 0;
  let accumulated = '';
  let statusIndex = 0;

  // Generate burst schedule
  const schedule = generateBurstSchedule(totalTokens, durationMs);
  let currentSegment = 0;
  let segmentStartTime = 0;
  let inPause = false;
  let pauseEndTime = 0;

  // Status message rotation (variable interval for realism)
  let nextStatusTime = 1200 + Math.random() * 800;
  let totalElapsed = 0;

  callbacks.onStatusChange(statusMessages[0]);

  // Initial delay — simulates "thinking before coding"
  const initialDelay = 600 + Math.random() * 400;
  let started = false;
  let globalStartTime = 0;

  function tick(timestamp: number) {
    if (cancelled) return;

    if (!globalStartTime) globalStartTime = timestamp;
    const elapsed = timestamp - globalStartTime;
    totalElapsed = elapsed;

    // Initial thinking delay
    if (!started) {
      if (elapsed < initialDelay) {
        requestAnimationFrame(tick);
        return;
      }
      started = true;
      segmentStartTime = timestamp;
    }

    // Status rotation
    if (elapsed > nextStatusTime) {
      statusIndex = (statusIndex + 1) % statusMessages.length;
      callbacks.onStatusChange(statusMessages[statusIndex]);
      nextStatusTime = elapsed + 1200 + Math.random() * 1500;
    }

    // Handle pause between bursts
    if (inPause) {
      if (timestamp < pauseEndTime) {
        // Still pausing — emit current state so cursor keeps blinking
        callbacks.onProgress(Math.round((currentToken / totalTokens) * 100));
        requestAnimationFrame(tick);
        return;
      }
      // Pause ended
      inPause = false;
      currentSegment++;
      if (currentSegment >= schedule.length) {
        // All done
        finalize();
        return;
      }
      segmentStartTime = timestamp;
    }

    // Current burst segment
    if (currentSegment >= schedule.length) {
      finalize();
      return;
    }

    const seg = schedule[currentSegment];
    const segElapsed = timestamp - segmentStartTime;
    const segProgress = Math.min(segElapsed / seg.duration, 1);

    // Ease: slow start, fast middle, slow end within each burst
    const easedProgress = segProgress < 0.5
      ? 2 * segProgress * segProgress
      : 1 - Math.pow(-2 * segProgress + 2, 2) / 2;

    const targetToken = seg.startToken + Math.floor(easedProgress * (seg.endToken - seg.startToken));

    // Emit tokens up to target
    const batchLimit = Math.min(targetToken, seg.endToken, totalTokens);
    while (currentToken < batchLimit) {
      accumulated += tokens[currentToken];
      currentToken++;
    }

    callbacks.onCodeChunk(accumulated);
    callbacks.onProgress(Math.round((currentToken / totalTokens) * 100));

    // Check if burst is complete
    if (segProgress >= 1) {
      if (seg.pauseAfter > 0) {
        inPause = true;
        pauseEndTime = timestamp + seg.pauseAfter;
      } else {
        currentSegment++;
        segmentStartTime = timestamp;
      }
    }

    if (currentToken < totalTokens) {
      requestAnimationFrame(tick);
    } else {
      finalize();
    }
  }

  function finalize() {
    if (cancelled) return;
    // Ensure all tokens are emitted
    while (currentToken < totalTokens) {
      accumulated += tokens[currentToken];
      currentToken++;
    }
    accumulated = gameHtml;
    callbacks.onCodeChunk(accumulated);
    callbacks.onProgress(100);
    callbacks.onComplete(accumulated);
  }

  requestAnimationFrame(tick);

  return {
    cancel: () => {
      cancelled = true;
    },
  };
}
