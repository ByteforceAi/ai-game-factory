// Code Streaming Simulator
// Simulates LLM-style token-by-token code generation

export const GENERATE_STATUS_MESSAGES = [
  '게임 엔진 초기화 중...',
  'HTML5 캔버스 설정 중...',
  '렌더링 파이프라인 구성 중...',
  '게임 로직 생성 중...',
  '충돌 감지 시스템 구축 중...',
  '입력 핸들러 연결 중...',
  '사운드 시스템 초기화 중...',
  '점수 시스템 설계 중...',
  '터치 컨트롤 최적화 중...',
  '최종 빌드 컴파일 중...',
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
  // Split into lines first, then tokenize each line
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Tokenize the line into small chunks (2-6 chars) to simulate token output
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
        // Split long attributes into smaller pieces
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

    // Add newline between lines (except last)
    if (i < lines.length - 1) {
      tokens.push('\n');
    }
  }
  return tokens;
}

/**
 * Simulate LLM-style code generation with variable-speed token streaming.
 * - Fast for whitespace, tags, boilerplate
 * - Slower for logic, function bodies
 * - Occasional "thinking" pauses
 */
export function simulateCodeGeneration(
  gameHtml: string,
  callbacks: SimulationCallbacks,
  durationMs: number = 6000,
  statusMessages: string[] = GENERATE_STATUS_MESSAGES
): { cancel: () => void } {
  const tokens = tokenize(gameHtml);
  const totalTokens = tokens.length;
  let cancelled = false;
  let currentToken = 0;
  let accumulated = '';
  let startTime = 0;
  let statusIndex = 0;
  let lineCount = 1;

  // Status message rotation
  const statusInterval = setInterval(() => {
    if (cancelled) return;
    statusIndex = (statusIndex + 1) % statusMessages.length;
    callbacks.onStatusChange(statusMessages[statusIndex]);
  }, 800);

  callbacks.onStatusChange(statusMessages[0]);

  // Easing function for overall progress
  function easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  function tick(timestamp: number) {
    if (cancelled) return;
    if (!startTime) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / durationMs, 1);
    const easedProgress = easeInOutQuart(rawProgress);

    // Target token based on eased progress
    const targetToken = Math.floor(easedProgress * totalTokens);

    // Emit tokens up to target, batching a few at a time for performance
    const batchSize = Math.max(1, Math.min(8, targetToken - currentToken));
    const emitUntil = Math.min(currentToken + batchSize, targetToken, totalTokens);

    while (currentToken < emitUntil) {
      const token = tokens[currentToken];
      accumulated += token;
      if (token === '\n') lineCount++;
      currentToken++;
    }

    callbacks.onCodeChunk(accumulated);
    callbacks.onProgress(Math.round(rawProgress * 100));

    if (rawProgress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Ensure all tokens emitted
      while (currentToken < totalTokens) {
        accumulated += tokens[currentToken];
        if (tokens[currentToken] === '\n') lineCount++;
        currentToken++;
      }
      accumulated = gameHtml; // Ensure exact match
      callbacks.onCodeChunk(accumulated);
      callbacks.onProgress(100);
      clearInterval(statusInterval);
      callbacks.onComplete(gameHtml);
    }
  }

  requestAnimationFrame(tick);

  return {
    cancel: () => {
      cancelled = true;
      clearInterval(statusInterval);
    },
  };
}
