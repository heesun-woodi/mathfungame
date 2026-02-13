# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

수학 히어로 (Math Hero) — 아동용(4~15세) 적응형 수학 학습 게임. Next.js App Router + Neon PostgreSQL + Vercel 배포.

## Commands

```bash
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버
npm run lint      # ESLint
npx drizzle-kit push   # DB 스키마 푸시 (Neon)
npx drizzle-kit studio # Drizzle Studio (DB 브라우저)
```

## Architecture

- **Framework:** Next.js 15 App Router (React 19)
- **Database:** Neon PostgreSQL (serverless) + Drizzle ORM (`drizzle-orm/neon-http`)
- **Styling:** Tailwind CSS v3 + Shadcn/ui 컴포넌트 (6개만 사용)
- **State:** React Query (`@tanstack/react-query`) — staleTime: Infinity, queryKey 기반 자동 fetching
- **Animation:** Framer Motion
- **Language:** 전체 UI 한국어

### DB Connection

`lib/db.ts`에서 lazy init (`getDb()`) — 빌드 시점에 DATABASE_URL 없어도 빌드 가능.

### Data Flow

- 클라이언트 → `apiRequest()` (`lib/queryClient.ts`) → Next.js API Route Handlers (`app/api/`) → `DatabaseStorage` (`lib/storage.ts`) → Neon DB
- React Query의 `queryKey`가 URL 패턴과 매칭됨 (예: `["/api/players", playerId, "stats"]`)

### Level System (10단계)

- `lib/mathEngine.ts`: 레벨별 연산자/범위 설정 + 문제 생성
- `lib/levelSystem.ts`: 최근 10문제 기준 — 정답률 ≥80% → 레벨업, ≤50% → 레벨다운
- 레벨 1(한 자릿수 덧셈) ~ 레벨 10(분수/소수 혼합 연산)

### Key Files

| 파일 | 역할 |
|------|------|
| `db/schema.ts` | Drizzle 스키마 (players, attempts) + Zod + 타입 |
| `lib/storage.ts` | DB 쿼리 클래스 (9개 메서드) |
| `lib/mathEngine.ts` | 문제 생성 엔진 |
| `lib/levelSystem.ts` | 레벨 승급/강등 로직 |
| `app/api/` | 5개 API 엔드포인트 |

### Environment

`.env.local`에 `DATABASE_URL` 필요 (Neon PostgreSQL 연결 문자열).
