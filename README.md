# 🎮 바이브코딩 아레나 (AI Game Factory)

> AI와 대화하며 나만의 게임을 만드는 **AI 체험형 코딩 커리큘럼** 플랫폼

**말하기 → 만들어짐 → 말로 고치기**

학생이 "우주 슈팅 게임 만들어줘"라고 입력하면 코드가 생성되는 과정을 눈으로 보고,
"속도 올려줘" · "비 오게 해줘" 같은 말로 게임을 실시간 수정하는 경험을 제공합니다.

> **제품 철학 — 통제된 시뮬레이션**: 생성 과정은 정교하게 설계된 시나리오 엔진으로,
> 외부 LLM API를 호출하지 않습니다. 덕분에 ① 수업 결과가 항상 예측 가능하고
> ② 부적절한 콘텐츠가 원천 차단되며 ③ API 비용·지연·장애가 없습니다.
> 교실에서 필요한 건 "AI와 협업하는 경험의 설계"이고, 이 제품은 그 경험을 전달합니다.

## 🚀 Quick Start

```bash
git clone <repo-url>
cd ai-game-factory
npm install
npm run dev
# http://localhost:3000
```

**환경변수 없이 그대로 동작합니다.** (API 키 불필요)

## 🔑 환경변수 (전부 선택사항)

| 변수 | 용도 | 없으면 |
|------|------|--------|
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Vercel KV — 리더보드/공유/갤러리 영속 저장 | 인메모리 폴백 (서버 재시작 시 초기화 — 데모/수업엔 충분) |
| `NEXT_PUBLIC_INSTRUCTOR_PIN` | 교사 패널(`/instructor`) 접근 PIN | 기본값 `0608` |
| `NEXT_PUBLIC_BASE_URL` | OG 메타데이터 기준 URL | 기본 도메인 사용 |

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + 디자인 토큰(CSS 변수) |
| 콘텐츠 엔진 | 시나리오 매칭 + 큐레이션 게임 12종 (`lib/scenarios.ts`, `lib/games/`) |
| 저장소 | Vercel KV (선택) → 인메모리 폴백 (`lib/kvStore.ts`) |
| Hosting | Vercel |

## 📁 구조

```
├── app/
│   ├── page.tsx               # 메인 플로우 (온보딩 → 웰컴 → 채팅)
│   ├── instructor/            # 교사 패널 (PIN 보호)
│   ├── play/[id]/             # 공유된 게임 플레이어
│   ├── gallery/ leaderboard/  # 갤러리 · 리더보드
│   └── api/                   # share / gallery / leaderboard
├── components/                # Onboarding, Welcome, ArtifactPanel, AIMessage ...
├── lib/
│   ├── scenarios.ts           # 시나리오 엔진 (프롬프트 → 응답/게임)
│   ├── games/                 # 게임 12종 소스
│   ├── vibeCommands.ts        # "속도 올려줘" 등 실시간 수정 명령
│   ├── visualThemes.ts        # 테마/날씨 오버레이
│   └── kvStore.ts             # KV ↔ 인메모리 폴백 어댑터
└── docs/
    ├── teacher-starter-kit.md # 강사 스타터 키트 (수업안·멘트·FAQ)
    ├── deployment-guide.md    # 배포·운영 가이드
    ├── feature-inventory.md   # 기능 인벤토리
    └── program-onepager.md    # 영업용 원페이저
```

## 🧑‍🏫 교실 기능

- **교사 패널** `/instructor?pin=PIN`: 학생 기기에서 이름 프리셋 · 게임 강제 지정 · 부팅 연출 생략
- **수업 기록**: 학생 화면 우하단 `수업 기록 N건 ⤓` → JSON 다운로드
- **세션 복원**: 새로고침해도 이어짐 (탭을 닫으면 초기화 — 공용 태블릿 안전)
- **태블릿 대응**: 900px 미만에서 게임 위 + 채팅 아래 분할 — 게임 보며 말로 수정

## 📋 로드맵 현황

- [x] Phase 0 — 대청소·디자인 기반 (죽은 코드 -8.5k줄, 토큰 시스템)
- [x] Phase 1 — 태블릿·노트북 대응 (드로어, 터치 타겟, dvh)
- [x] Phase 2 — 딥스페이스 디자인 통일 + 분할 레이아웃
- [x] Phase 2.5 — 교육용 톤 + 마이크로인터랙션
- [x] Phase 3 — 교사 패널 실연결 + KV 폴백 + PWA manifest
- [ ] Phase 4 — 사운드/빈·에러 상태 마감, 오프라인(SW) 설계

---

**Built by BYTEFORCE**
