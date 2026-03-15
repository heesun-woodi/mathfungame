# 🚀 배포 가이드 - 새 기능 추가 완료

## ✅ 완료된 작업

### 1️⃣ 목표 달성 후 선택지 추가
- **위치**: `app/game/[id]/page.tsx`
- **기능**:
  - ✅ **계속 더 풀기**: 목표 초과해서 계속 연습 (dailyLimit 무시)
  - ✅ **레벨 올리기**: 현재 레벨 +1하고 새 문제 생성 (최대 레벨 10)
  - ✅ **홈으로 / 학습 현황 보기**: 기존 동작 유지

### 2️⃣ 연산자 집중 연습 기능
- **위치**: `app/settings/[id]/page.tsx`
- **기능**:
  - ✅ 덧셈(+), 뺄셈(-), 곱셈(×), 나눗셈(÷) 선택
  - ✅ 최소 1개 선택 필수
  - ✅ 기본값: 모든 연산자 활성화
  - ✅ 선택한 연산자만 문제에 출제

## 📝 변경된 파일
- `db/schema.ts` - operators 컬럼 추가
- `lib/storage.ts` - updatePlayerOperators 메서드 추가
- `lib/mathEngine.ts` - generateProblem에 operators 필터 추가
- `app/game/[id]/page.tsx` - 목표 달성 후 3가지 선택지 UI
- `app/settings/[id]/page.tsx` - 연산자 선택 UI
- `app/api/players/[id]/route.ts` - PATCH에 operators 처리
- `migrations/0001_add_operators.sql` - DB 마이그레이션 SQL

## 🗄️ DB 마이그레이션 필수!

**Vercel 배포 후 반드시 DB 마이그레이션을 실행하세요!**

### 방법 1: Neon Console (추천)
1. [Neon Dashboard](https://console.neon.tech) 접속
2. 프로젝트 선택 → SQL Editor
3. 아래 SQL 실행:

```sql
-- Add operators column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS operators TEXT NOT NULL DEFAULT '["add","subtract","multiply","divide"]';

-- Update existing players to have all operators by default
UPDATE players 
SET operators = '["add","subtract","multiply","divide"]'
WHERE operators IS NULL OR operators = '';
```

### 방법 2: Drizzle Kit (선택)
```bash
# DATABASE_URL 환경변수 설정 후
npx drizzle-kit push
```

## 🧪 테스트 방법

### 1. 연산자 선택 기능 테스트
1. 설정 페이지 접속
2. "연습할 연산 선택" 카드 확인
3. 연산자 버튼 클릭해서 선택/해제
   - ✅ 선택: 체크 아이콘, 파란색 배경
   - ❌ 해제: X 아이콘, 회색 테두리
4. 모두 해제 시도 → "최소 1개 선택 필요" 토스트 확인
5. 게임 페이지로 이동
6. 선택한 연산자만 문제에 나오는지 확인
   - 예: 덧셈만 선택 → 모든 문제가 덧셈

### 2. 목표 달성 후 선택지 테스트
1. 설정에서 일일 목표 10문제로 설정
2. 문제 10개 풀기
3. 10번째 문제 정답 제출 후 화면 확인:
   - 🏆 "오늘 목표를 달성했어요!" 메시지
   - 3개 버튼:
     - **계속 더 풀기** (파란색, Zap 아이콘)
     - **레벨 올리기** (회색, ChevronUp 아이콘)
     - **홈으로 / 학습 현황 보기** (작은 회색 버튼)

4. "계속 더 풀기" 클릭
   - ✅ 새 문제 생성
   - ✅ 11번째 문제 풀 수 있음

5. 다시 목표 달성 화면으로 돌아간 후 "레벨 올리기" 클릭
   - ✅ 레벨 +1 (예: Lv.2 → Lv.3)
   - ✅ 새 문제 생성 (상위 레벨 난이도)
   - ✅ 최대 레벨(10)일 경우 "이미 최대 레벨입니다!" alert

6. "홈으로" / "학습 현황 보기" 클릭
   - ✅ 각각 해당 페이지로 이동

## ⚠️ 주의사항

### 기존 사용자 호환성
- DB 마이그레이션 실행 전: `operators` 컬럼이 없으므로 기본값(전체 연산자) 사용
- DB 마이그레이션 실행 후: 기존 사용자는 자동으로 전체 연산자 할당

### 최대 레벨 확인
- 현재 최대 레벨: **Lv.10** (1000 이하 사칙연산)
- 레벨 올리기 버튼은 Lv.10에서 비활성화 또는 alert 표시

### 연산자 선택 제한
- 최소 1개 선택 필수 (모두 해제 불가)
- 레벨 설정에 없는 연산자 선택 시: 레벨 범위 내 연산자로 자동 필터링
  - 예: Lv.1 (덧셈만), 나눗셈 선택 → 무시됨

## 📊 Vercel 배포 확인

- **프로젝트**: mathfungame
- **자동 배포**: GitHub main 브랜치 push → Vercel 자동 빌드
- **배포 URL**: https://mathfungame.vercel.app (또는 커스텀 도메인)

### 배포 상태 확인
1. [Vercel Dashboard](https://vercel.com/) 접속
2. mathfungame 프로젝트 선택
3. Deployments 탭에서 최근 배포 확인
4. Build Logs 확인 (빌드 성공 여부)

## 🎯 다음 단계

1. ✅ **Vercel 배포 완료 확인** (자동, 약 2-3분 소요)
2. ✅ **DB 마이그레이션 실행** (Neon Console에서 SQL 실행)
3. ✅ **테스트** (위 "테스트 방법" 참고)
4. ✅ **우디에게 보고** (테스트 완료 후)

---

## 🐛 문제 발생 시

### DB 마이그레이션 실패
- Neon Console에서 `players` 테이블 확인
- `operators` 컬럼 있는지 확인:
  ```sql
  SELECT column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'players';
  ```

### 빌드 실패
- Vercel Build Logs 확인
- TypeScript 에러: `npm run build` 로컬 테스트
- ESLint 경고는 무시 가능 (빌드는 성공)

### 기능 동작 안 함
- 브라우저 개발자 도구 Console 확인
- Network 탭에서 API 호출 상태 확인
- DB에 `operators` 컬럼 있는지 재확인

---

**작업 완료 시간**: 2026-03-15 17:04 (KST)
**커밋 해시**: 91efbca
**빌드 상태**: ✅ 성공 (0 errors, 0 warnings)
