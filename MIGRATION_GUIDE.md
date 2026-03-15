# 빙고 게임 마이그레이션 가이드

## 🚀 배포 단계

### 1. Git Push 완료 ✅
- 코드가 GitHub에 push되었습니다.
- Vercel이 자동으로 배포를 시작합니다.

### 2. DB 마이그레이션 실행 (필수!)

**방법 1: 자동 마이그레이션 (권장)**

Vercel 배포 완료 후, 아래 URL에 접속하세요:
```
https://your-app.vercel.app/api/migrate
```

응답이 `{"status":"migrated"}` 또는 `{"status":"already_migrated"}`이면 성공입니다.

**방법 2: 수동 마이그레이션**

Neon DB 콘솔에 접속해서 아래 SQL을 실행하세요:

```sql
-- Add bingo game tables
CREATE TABLE IF NOT EXISTS bingo_sessions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id),
  level INTEGER NOT NULL,
  animal_name TEXT NOT NULL,
  animal_image_url TEXT NOT NULL,
  board_state TEXT NOT NULL DEFAULT '["locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked","locked"]',
  completed_lines INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  guessed_correctly BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bingo_attempts (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES bingo_sessions(id),
  cell_index INTEGER NOT NULL,
  operand1 INTEGER NOT NULL,
  operand2 INTEGER NOT NULL,
  operator TEXT NOT NULL,
  correct_answer INTEGER NOT NULL,
  user_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bingo_sessions_player ON bingo_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_bingo_attempts_session ON bingo_attempts(session_id);
```

### 3. Vercel 배포 확인

1. Vercel 대시보드 확인: https://vercel.com/
2. 배포 상태 확인 (Building → Deploying → Ready)
3. 배포 완료 후 Production URL 방문

### 4. 테스트 시나리오

#### 기본 게임 플레이
1. 플레이어 선택
2. 빙고 보드 확인 (5×5 그리드, 모두 잠금 상태)
3. 임의의 칸 클릭
4. 문제 풀기
5. 정답 입력 → 칸 오픈 확인
6. 여러 칸 풀어서 그림 드러나는지 확인

#### 빙고 완성
1. 5줄 완성까지 플레이
2. "동물 맞추기" 단계 진입 확인
3. 힌트 버튼 클릭 (3번까지)
4. 동물 이름 입력 및 정답 확인

#### 완료 후 선택
1. "레벨 올리기" 버튼 동작 확인
2. "같은 레벨 더 하기" 버튼 동작 확인
3. "그만하기" 버튼 → 홈 이동 확인

#### 설정 페이지
1. 설정 아이콘 클릭
2. "일일 빙고 수 설정" 확인 (1빙고, 2빙고, 3빙고, 무제한)
3. 설정 변경 후 저장 확인

### 5. 체크리스트

- [ ] DB 마이그레이션 SQL 실행 완료
- [ ] Vercel 배포 완료
- [ ] 빙고 보드 UI 정상 표시
- [ ] 칸 클릭 → 문제 출제 정상 동작
- [ ] 정답 시 칸 오픈 및 그림 공개 확인
- [ ] 5줄 완성 감지 정상 동작
- [ ] 동물 맞추기 단계 진입 확인
- [ ] 힌트 기능 동작 확인
- [ ] 동물 이름 정답 체크 정상 동작
- [ ] 완료 후 선택지 동작 확인
- [ ] 설정 페이지 변경 확인 (빙고 수)

## 📝 주요 변경사항

1. **게임 플로우**: 문제 하나씩 풀기 → 빙고 보드에서 칸 선택해서 풀기
2. **일일 목표**: 문제 수 (10/20/30) → 빙고 수 (1/2/3)
3. **새 테이블**: bingo_sessions, bingo_attempts
4. **새 API**: /api/bingo/start, /api/bingo/[sessionId]/attempt, /api/bingo/[sessionId]/guess
5. **새 UI**: 5×5 빙고 보드, 숨겨진 동물 그림, 동물 맞추기 모달

## 🐛 알려진 이슈 & TODO

- [ ] 동물 이미지 로딩 실패 시 placeholder 처리 추가
- [ ] 모바일 최적화 (반응형 그리드 조정)
- [ ] 빙고 완성 시 축하 애니메이션 (confetti) 추가
- [ ] 완료한 빙고 갤러리 기능 추가
- [ ] 동물 맞추기 재시도 제한 (3번?) 추가

## 💬 보고 메시지 (우디에게)

```
🎉 mathfungame 빙고 리뉴얼 완료!

✅ 구현 완료:
- 5×5 빙고 보드 게임 시스템
- 숨겨진 동물 그림 공개 메커니즘
- 5줄 완성 시 동물 맞추기
- 일일 목표: 빙고 수로 변경 (1/2/3/무제한)

📋 다음 단계:
1. Neon DB 콘솔에서 마이그레이션 SQL 실행 (MIGRATION_GUIDE.md 참고)
2. Vercel 배포 완료 대기 (자동)
3. 테스트 시나리오 실행

🔗 참고:
- 마이그레이션 SQL: migrations/0002_add_bingo.sql
- 가이드: MIGRATION_GUIDE.md
```
