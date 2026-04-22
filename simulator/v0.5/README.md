# DEAD NEXUS Simulator v0.5

**솔로 플레이 검증용 웹 시뮬레이터.** 1인 플레이 + AI 상대로 게임 밸런스·카드 상호작용 조기 검증.

## 스코프

### Phase 1 (현재 릴리스: MVP)
- **맵**: 5×5 튜토리얼만
- **역할**: Bloc / Ghost 교체 가능
- **Ghost 클래스**: CIPHER · BLADE · BROKER (3/6)
- **Bloc**: VANTA · IRONWALL · CARBON (3/5)
- **시나리오**: S01 표준
- **AI**: 스코어 기반 (평가함수 + 그리디)
- **시스템**:
  - 7페이즈 턴
  - 공용 속성 풀 + 시그널 다이
  - 카드 TOP/BOTTOM (Ghost) · Main/Sideways (Bloc)
  - 전투 주사위 판정
  - 구역 장악·수입
  - 주식 시장·기본 거래
  - 뉴스 카드 15 (큐레이션)
  - 숨은 목표 (각자 2장, 달성 판정)
  - 싱글게임 업적 (선언 버튼)
  - TL 1~2 테크트리

### Phase 2 (v0.6 예정)
- 11×11 맵
- 6 Ghost 클래스 전부 + 5 Bloc
- 시나리오 S02~S06
- M&A 시스템 전체
- 뉴스 카드 50 전체
- 메타 업적 트래킹
- Tech Level 3~5

### Phase 3 (v0.7+)
- 레거시 캠페인 연동
- 메시 맵 (챕터 5+)
- TTS 익스포트

## 아키텍처

### 기술 스택
- **단일 HTML 파일** (React 18 + Babel Standalone CDN)
- **상태 관리**: React useReducer (중앙화)
- **UI**: CSS Grid + Flexbox, 다크 사이버펑크 테마
- **AI**: 평가함수 기반 (각 행동의 가치 점수화 후 최고점 선택)
- **영속성**: 없음 (브라우저 새로고침 시 초기화). v0.6에 LocalStorage

### 파일 구조
```
simulator/v0.5/
├── README.md          # 이 문서
├── index.html         # 엔트리 + 컴포넌트 마운트
├── sim.jsx            # 메인 시뮬레이터 (React)
├── data.js            # 카드·클래스·시나리오 데이터
└── ai.js              # AI 평가함수
```

*MVP에서는 단일 `index.html`에 전부 임베드. 커지면 분리.*

### 상태 구조

```js
{
  meta: {
    scenario: 'S01',
    mapSize: '5x5',
    round: 1,
    phase: 0,  // 0~6
    currentPlayer: 0,
  },
  players: [
    {
      id: 0,
      kind: 'human' | 'bot',
      role: 'ghost' | 'bloc',
      specific: 'CIPHER' | 'VANTA' | ...,
      hp: 6,
      resources: { credit, data, influence, weapons, parts, rep },
      stocks: { VANTA: 10, IRONWALL: 0, ... },
      deck: [cardId],
      hand: [cardId],
      discard: [cardId],
      lost: [cardId],
      contracts: [],
      objectives: [cardId, cardId],  // hidden
      achievements: [cardId],  // claimed this game
      wanted: 0,
    }
  ],
  map: {
    'A1': { zone: 'ruin', owner: null, token: 'quest' },
    // ...
  },
  pool: { M: 0, I: 0, V: 0, S: 0, B: 0, A: 0, GRID: 0 },
  stocks: { VANTA: 10, IRONWALL: 10, HELIX: 10, AXIOM: 10, CARBON: 10 },
  heat: 5,
  signalDie: 'MESH_UP',
  newsDeck: [cardId],
  log: [{ round, phase, message }],
}
```

### AI 평가 함수

각 가능한 행동에 **점수 0~100** 부여:

- **공격/레이드** 점수:
  - 성공 확률 × 보상 − 실패 비용
  - HP 낮을수록 방어 선호
- **이동** 점수:
  - 목표 구역 가치 − 이동 비용 − 공권력 리스크
- **카드 선택** 점수:
  - 자원 효율 × 상황 적합도
  - 속성 풀 상태 고려 (Surging 활용)
- **주식 거래** 점수:
  - 예상 주가 변동 × 수량 − 거래 비용

최고 점수 행동 선택. 동점 시 랜덤.

### 턴 흐름

```
Phase 1 시장   → 시그널 다이 자동 굴림 → 주가 조정 → 거래 UI
Phase 2 뉴스   → 뉴스 카드 1장 공개 → 효과 자동 적용
Phase 3 계획   → 인간: 카드 선택 UI / 봇: AI 결정
Phase 4 실행   → 이니셔티브 순 처리 → 전투 자동 주사위
Phase 5 수익   → 구역 수입 + 배당 자동 지급 → 풀 감쇠
Phase 6 R&D    → TL 대기 카운터 감소
Phase 7 결산   → 라운드 +1 → 승리 체크
```

### 승리 조건

| 역할 | 기본 | 튜토리얼 |
|---|---|---|
| Bloc | 자산 60 | **자산 40** |
| Ghost | 렙 30 + 레이드 2 | **렙 10 + 레이드 1** |
| NEXUS | 3R 연속 | **2R 연속** |
| 라운드 상한 | 12 | **8** |

## 사용 방법

1. `index.html`을 **Chrome/Safari**에서 열기 (file:// 로도 OK)
2. 역할·클래스 선택
3. 봇 2~3명 자동 설정
4. 턴 진행: UI 버튼 클릭 or 카드 드래그
5. 승리/패배 후 "다시 시작"
6. 발견한 밸런스 이슈는 **Notion 밸런스 이슈 DB**에 기록

## 검증 체크리스트 (플레이 후 확인)

- [ ] 7페이즈 순서가 혼란 없이 흘러가는가
- [ ] 속성 풀이 과하게 비거나 넘치지 않는가
- [ ] 특정 클래스·블록이 압도적인가
- [ ] 카드 조합이 무한 콤보로 이어지지 않는가
- [ ] 승리 조건 달성까지 걸리는 라운드 수가 적절한가
- [ ] AI가 의미 있는 행동을 하는가 (명백한 실수 없음)
- [ ] 레이드·M&A·공권력 상승이 고르게 발생하는가

## 버그 리포트

시뮬레이터 사용 중 발견 이슈는 Notion **밸런스 이슈 DB**에 기록:
- 제목: 간결
- Type: 규칙 / 카드 / 역할 / 맵
- Priority: Critical / High / Medium / Low
- Proposed Fix: 짧은 제안
- First Seen: 시뮬레이터 v0.5 / 턴 X

## 변경 이력

| 버전 | 변경 |
|---|---|
| v0.5 | MVP 첫 릴리스. 5×5 튜토리얼. |
