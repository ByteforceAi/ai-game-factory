/**
 * Prompt Engineering Level System
 * Rates student prompt quality and gives tips
 */

export interface PromptScore {
  score: number; // 1-5 stars
  level: string;
  feedback: string;
  tip?: string;
}

const DETAIL_KEYWORDS = [
  '만들어', '해줘', '보여줘', '적용해줘', '바꿔줘', '올려줘', '내려줘',
  '추가해줘', '넣어줘', '설명해줘', '알려줘',
];

const CONTEXT_KEYWORDS = [
  '배경', '테마', '색', '속도', '크기', '스타일', '모양',
  '위치', '방향', '타입', '종류', '효과', '모드',
];

const SPECIFICITY_KEYWORDS = [
  '우주', '네온', '레트로', '사이버펑크', '보스', '적', '플레이어',
  '점프', '슈팅', '3D', '2D', '무적', '코인', '별', '풍선',
  '테트리스', '캐릭터', '고양이', '비', '눈', '밤', '아침',
];

export function scorePrompt(text: string): PromptScore {
  const trimmed = text.trim();
  if (!trimmed) return { score: 0, level: '', feedback: '', tip: '' };

  let points = 0;
  const len = trimmed.length;

  // Length score (0-2)
  if (len >= 30) points += 2;
  else if (len >= 15) points += 1;
  else if (len >= 5) points += 0.5;

  // Has action verb (0-1)
  const hasAction = DETAIL_KEYWORDS.some(k => trimmed.includes(k));
  if (hasAction) points += 1;

  // Has context/descriptor (0-1)
  const contextCount = CONTEXT_KEYWORDS.filter(k => trimmed.includes(k)).length;
  if (contextCount >= 2) points += 1;
  else if (contextCount >= 1) points += 0.5;

  // Has specificity (0-1)
  const specCount = SPECIFICITY_KEYWORDS.filter(k => trimmed.includes(k)).length;
  if (specCount >= 2) points += 1;
  else if (specCount >= 1) points += 0.5;

  // Sentence completeness (0-1)
  if (len > 10 && (trimmed.endsWith('줘') || trimmed.endsWith('요') || trimmed.endsWith('해') || trimmed.endsWith('거'))) {
    points += 0.5;
  }

  // Multiple clauses (0-1)
  if (trimmed.includes(',') || trimmed.includes('그리고') || trimmed.includes('하고')) {
    points += 0.5;
  }

  // Convert to 1-5 stars
  const raw = Math.min(5, Math.max(1, Math.round(points)));
  const score = raw as 1 | 2 | 3 | 4 | 5;

  const levels: Record<number, { level: string; feedback: string; tip: string }> = {
    1: {
      level: '초보',
      feedback: '좀 더 구체적으로 설명해보세요!',
      tip: '어떤 것을, 어떻게 바꾸고 싶은지 알려주세요',
    },
    2: {
      level: '입문',
      feedback: '좋은 시작이에요! 디테일을 더 추가해볼까요?',
      tip: '색깔, 속도, 크기 등 구체적인 설명을 더해보세요',
    },
    3: {
      level: '중급',
      feedback: '잘하고 있어요! 핵심을 잘 전달하고 있어요.',
      tip: '조건이나 예외를 추가하면 더 정확해져요',
    },
    4: {
      level: '고급',
      feedback: '훌륭해요! 매우 구체적이고 명확해요!',
      tip: '여러 요구사항을 함께 전달해보세요',
    },
    5: {
      level: '마스터',
      feedback: '완벽한 프롬프트! AI가 정확히 이해할 수 있어요! 🎉',
      tip: '',
    },
  };

  return {
    score,
    ...levels[score],
  };
}
