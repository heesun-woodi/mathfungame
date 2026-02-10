# 수학 히어로 - Math Hero

## Overview
어린이를 위한 적응형 사칙연산 학습 게임 웹 애플리케이션. 나이에 따른 초기 레벨 설정, 정답률 기반 자동 난이도 조절, 학습 현황 대시보드 기능을 제공합니다.

## Project Architecture
- **Frontend**: React + Tailwind CSS + Framer Motion (client/src/)
- **Backend**: Express.js (server/)
- **Database**: PostgreSQL with Drizzle ORM
- **Shared**: TypeScript types and schemas (shared/schema.ts)

## Key Files
- `shared/schema.ts` - Data models (players, attempts)
- `client/src/pages/welcome.tsx` - Player registration/selection
- `client/src/pages/game.tsx` - Math quiz game with number pad
- `client/src/pages/dashboard.tsx` - Learning stats and wrong problem review
- `client/src/lib/mathEngine.ts` - Problem generation engine and level descriptions
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database storage layer
- `server/levelSystem.ts` - Level evaluation logic

## Level System
- Levels 1-10 based on age (age 5 = Lv1, age 6 = Lv2, etc.)
- Auto level-up at 80%+ accuracy (recent 10 problems)
- Auto level-down at 50% or lower accuracy (recent 10 problems)

## API Endpoints
- GET /api/players - List all players
- POST /api/players - Create player (name, age)
- GET /api/players/:id/stats - Get player stats
- GET /api/players/:id/wrong-attempts - Get wrong attempts for review
- POST /api/attempts - Submit answer attempt

## Recent Changes
- 2026-02-10: Initial MVP implementation with player registration, adaptive quiz game, and learning dashboard
