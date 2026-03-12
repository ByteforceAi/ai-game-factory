# 🎮 AI Game Factory

> 프롬프트로 게임을 만드는 AI 게임 생성 플랫폼

**PROMPT → GENERATE → PLAY**

자연어로 게임 아이디어를 입력하면 AI(Claude)가 즉시 플레이 가능한 HTML5 Canvas 게임을 생성합니다.

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/hangyeolalmighty/ai-game-factory.git
cd ai-game-factory
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### 3. Run Dev Server
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel
```bash
npm i -g vercel
vercel
# Set ANTHROPIC_API_KEY in Vercel Dashboard → Settings → Environment Variables
```

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Anthropic Claude API (claude-sonnet-4) |
| Hosting | Vercel |
| Rate Limit | In-memory (→ Upstash Redis for production) |

## 📁 Project Structure

```
ai-game-factory/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # Claude API endpoint
│   ├── globals.css            # Cyber theme styles
│   ├── layout.tsx             # Root layout + metadata
│   └── page.tsx               # Main 3-step UI
├── .env.example               # Environment template
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 🎯 Features

- **프롬프트 기반 게임 생성**: 한국어/영어 자연어 입력
- **즉시 플레이**: iframe 샌드박스에서 안전하게 실행
- **HITECH CYBER 디자인**: 네온 글로우, 스캔라인, HUD 인터페이스
- **Rate Limiting**: API 남용 방지
- **보안**: 서버사이드 API 키 관리, CSP 헤더

## 📋 Roadmap

- [x] Phase 1: MVP (프롬프트 → 생성 → 플레이)
- [ ] Phase 2: 게임 저장 & 공유 (Supabase)
- [ ] Phase 2: 갤러리 & 리더보드
- [ ] Phase 3: Pro 구독 모델

---

**Built by BYTEFORCE** | Powered by Claude AI
