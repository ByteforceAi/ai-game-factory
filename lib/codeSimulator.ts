// Code Streaming Simulator
// Simulates AI code generation by streaming pre-built HTML line by line

const STATUS_MESSAGES = [
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

export interface SimulationCallbacks {
  onCodeChunk: (code: string) => void;
  onStatusChange: (status: string) => void;
  onProgress: (percent: number) => void;
  onComplete: (fullCode: string) => void;
}

export function simulateCodeGeneration(
  gameHtml: string,
  callbacks: SimulationCallbacks,
  durationMs: number = 6000
): { cancel: () => void } {
  const lines = gameHtml.split('\n');
  const totalLines = lines.length;
  let cancelled = false;
  let currentLine = 0;
  let accumulated = '';
  let startTime = 0;
  let statusIndex = 0;

  const statusInterval = setInterval(() => {
    if (cancelled) return;
    statusIndex = (statusIndex + 1) % STATUS_MESSAGES.length;
    callbacks.onStatusChange(STATUS_MESSAGES[statusIndex]);
  }, 800);

  callbacks.onStatusChange(STATUS_MESSAGES[0]);

  function easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function tick(timestamp: number) {
    if (cancelled) return;
    if (!startTime) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(elapsed / durationMs, 1);
    const easedProgress = easeInOut(rawProgress);
    const targetLine = Math.floor(easedProgress * totalLines);

    while (currentLine < targetLine && currentLine < totalLines) {
      accumulated += (currentLine > 0 ? '\n' : '') + lines[currentLine];
      currentLine++;
    }

    callbacks.onCodeChunk(accumulated);
    callbacks.onProgress(Math.round(rawProgress * 100));

    if (rawProgress < 1) {
      requestAnimationFrame(tick);
    } else {
      // Ensure we emit all lines
      accumulated = gameHtml;
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
