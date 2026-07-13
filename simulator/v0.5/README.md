# DEAD NEXUS Simulator (v0.5 라인 → v1.0.5-fix)

**1~5인 플레이 가능한 웹 시뮬레이터.** 솔로(1H+봇3) / 핫시트(2~5H) / 봇 전용 모드.
React 18 + Babel Standalone, 단일 HTML, Chrome/Safari `file://` 직접 실행.

현재 라인 버전: **v1.0.5-fix** (디렉토리명만 `v0.5/` — 발전사적 유산)

## 현재 스코프 (v1.0+ 완료)

- **맵**: 🎓 5×5 튜토리얼 + 🏙 11×11 정식 (메뉴에서 선택)
- **모드**: 🎮 솔로 · 👥 핫시트 (2~5인) · 🤖 봇 전용 시뮬
- **난이도** (솔로): 🟢 EASY / 🟡 NORMAL / 🔴 HARD
- **Ghost 클래스 6**: CIPHER · BLADE · RIGGER · BROKER · DRIFTER · MOLE
- **Bloc 5**: VANTA · IRONWALL · HELIX · AXIOM · CARBON
- **시나리오**: S01 표준
- **시스템**:
  - 7페이즈 턴 (시장 거래 · 뉴스 · 계획 · 실행 · 수익 · R&D · 결산)
  - 개인 속성 풀 (플레이어별 M/I/V/S/B/A/GRID)
  - 카드 TOP/BOTTOM (Ghost) · Main/Sideways (Bloc), 사용자가 반쪽 조합 선택
  - Ghost·Bloc 모두 2장 플레이
  - 결정론 레이드 + **레이드 결정 모달** (확률/보상/위험 사전 공개)
  - **Ghost vs Ghost PvP** (같은 구역 조우 시 결투 모달)
  - 구역 장악·수입 + Bloc 패시브 확장 + 구역 첫 방문 3중 1 보너스 드래프트
  - 주식 시장 + 동적 가격 (`euro_marketTradePrice`)
  - 자원 변환 체인 (부품→장비, 데이터→인텔)
  - 뉴스 카드 35종 (블록별 호재/악재·시장 충격·공권력·자원·PvP·이동)
  - 숨은 목표 (각자 2장) · 싱글게임 업적
  - 5트랙 거리명성 (화력/그리드런/코드/인맥/그림자) + Cyberware 슬롯 (R3/R6 자동 장착)
  - TL 1~2 카드 해금 (R&D 페이즈)
  - 승리 진척 패널 + 위협 대시보드 + 타겟 알림 배너
  - LocalStorage 플레이 히스토리 (최근 50판)
  - **`MODE_CONFIG`+`euro_mode` 단일 소스** + **클래스 시그니처 13종** (RIGGER · HELIX · CARBON 11×11 · CIPHER 5×5 · GhostHustle · BLADE · BROKER · CIPHER 11×11 해킹노드 · MOLE · VANTA · IRONWALL · AXIOM) — sim-harness와 web 밸런스 레짐 통일 (v6.3)
  - **견제 토큰 3종** (무력★/정보📡/외교🎙, `SUPPRESSION_SPEC`) — 봇 AI가 매R 확률적으로(`MODE_CONFIG.suppressionProb`: 11×11 0.30 / 5×5 0.15) 최다위협 상대에 자동 부여(`euro_grantSuppression`, ₵-5) + R 시작 시 자동 페널티 적용. **양방향 라이브**: 인간도 시장 페이즈 "능동 견제" 패널에서 대상·유형 선택 후 ₵5로 직접 부여 가능(`HUMAN_SUPPRESS`, v6.5). 봇 견제엔 보복(grudge) AI 편향 적용 — 최근 2R 내 나를 견제한 상대를 확률적으로 우선 타겟(`EURO_GRUDGE_BONUS`, v6.7)
  - **결정 모달 2종 라이브**: 레이드 성공 시 ★평판 루트 vs ₵+⚙약탈 루트 선택(EV-중립, v6.6), 인간 Bloc 잉여 자본(₵≥12) 시 주가 부양 vs ₵비축 선택(점수-중립, v6.8) — v6.0 결정 골격의 두 템플릿 모두 실연결 완료

### 다음 사이클 (v0.6+ 예정)
- 시나리오 S02~S06 시뮬 통합
- M&A 시스템 전체 (적대적 인수·방어 라운드·백기사 동맹)
- 뉴스 카드 50+ (현재 35)
- Tech Level 3~5 전용 카드 해금

### v0.7+
- 레거시 캠페인 연동
- 메시 맵 (챕터 5+)
- TTS(Tabletop Simulator) 익스포트

## 아키텍처

### 기술 스택
- **단일 HTML 파일** (React 18 + Babel Standalone CDN) — 빌드 없이 file:// 에서도 실행
- **상태 관리**: React useReducer (중앙화)
- **UI**: CSS Grid + Flexbox, 다크 사이버펑크 테마 (Rajdhani + Share Tech Mono)
- **AI**: 평가함수 기반 (각 행동의 가치 점수화 후 최고점 선택)
- **영속성**: LocalStorage 플레이 히스토리 (v0.5.4+)

### 파일 구조
```
simulator/v0.5/
├── README.md          # 이 문서
└── index.html         # 엔트리 + 모든 로직 (≈150KB)
```

*모든 코드·카드 데이터·UI가 단일 `index.html`에 임베드. v0.6에서 분리 예정.*

### 상태 구조 (요약)

```js
{
  meta: {
    scenario: 'S01', mapSize: '5x5', round, phase,
    raidsThisGame: { 0:0, 1:0, 2:0, 3:0 },
    zonesVisited, visitedBonusZones,           // 첫 방문 트래킹
    claimedAchievements,
    pendingMoveTarget, awaitingMoveTarget,     // 클릭-이동 UI
    pendingRaid,                               // 레이드 결정 모달
    pendingGhostDuel,                          // PvP 결투 모달
    zoneBonusPending,                          // 구역 보너스 3중 1 모달
    lastTargetedBy,                            // "당신이 타겟됨" 배너
    turnSnapshot, turnDiff,                    // 턴 전후 변화 요약
  },
  players: [
    {
      kind: 'human' | 'bot', role: 'ghost' | 'bloc', specific,
      hp, stats, resources, stocks,
      deck, hand, discard, lost,
      plannedCards, plannedHalves,             // 2장 + 반쪽 선택
      pool,                                    // 개인 속성 풀 (v0.5.3+)
      position, tl, tlProgress,
      wanted, objectives, achievements, defeated,
    }
  ],
  map, stocks, heat, signalDie, currentNews, log,
}
```

### 결정 지점 (사용자 개입이 필요한 모달)

| 순간 | 모달 | 핵심 정보 |
|---|---|---|
| 계획 단계 | 카드 반쪽 선택 | 각 카드 ▲/▼ 영역 클릭으로 TOP/BOT 전환 |
| 계획 확정 후 | 클릭-이동 | BFS 반경 내 셀 + 결과 미리보기 태그 (`🗡️ 84%` / `🌟 보너스` / `🏠 내 땅` / `✓ 방문`) |
| 이동 도착 | Ghost PvP 결투 | 개략 승률 + 보상/위험 · 선제 공격/회피 |
| 이동 도착 | 레이드 결정 | d6+ATK ≥ 5 확률 바 + 즉시 승리 배지 |
| 이동 도착 | 구역 첫 방문 | 3중 1 보너스 드래프트 (구역별 옵션 풀) |
| 시장 페이즈 | 주식 매수/매도 | 블록별 큰 카드 + 보유 수 + 매수/매도 버튼 |
| 레이드 성공 | 레이드 보상 선택 | ★ 평판 루트 vs ₵+⚙ 약탈 루트 (EV-중립, v6.6) |
| 시장 페이즈 (인간 Bloc, 잉여 ₵≥12) | Bloc 투자 결정 | 주가 부양 +1 vs 운영비 비축 ₵+1 (점수-중립, v6.8) |
| 시장 페이즈 | 능동 견제 패널 | 대상 선택 → 무력🔥/정보📡/외교🤝 택1 → 견제(₵5, v6.5) |

### AI 평가 함수

각 가능한 행동에 **점수** 부여 후 최고점 선택. 동점 시 랜덤.
- **Ghost**: 이동+공격 카드 우대, HP 낮으면 방어 카드 선호, 속성 보급 활성
- **Bloc**: 자사 TL 이하 카드 우대, 자원 비용 지불 가능성 확인, 공격적 카드 점수 +

### 턴 흐름 (v0.5.9)

```
Phase 1 시장     → 시그널 다이 자동 → 뉴스 카드 공개 (35종) → 봇 자동 거래
                   → 사용자 매수/매도 → "거래 끝" 클릭
Phase 2 계획     → 인간: 2장 + 반쪽 선택 → 이동 있으면 클릭-이동
                   봇: AI 자동 선택 (상위 2장)
Phase 3 실행     → 이니셔티브 순 처리 → 이동 → 결투/레이드/보너스 모달 (P0)
Phase 4 수익     → 구역 수입 + 배당 (개인 풀) + Bloc 패시브 확장 1구역
Phase 5 R&D      → 역할별 tlProgress 축적 + 자동 TL 승급 판정
Phase 6 결산     → 승리 체크 → 다음 라운드
```

### 승리 조건 (튜토리얼)

| 역할 | 기본 | 튜토리얼 |
|---|---|---|
| Bloc | 자산 60 | **자산 40** (자기 블록 주식·크레딧 제외) |
| Ghost | 렙 30 + 레이드 2 | **렙 10 + 레이드 1** |
| NEXUS | 3R 연속 | **2R 연속** |
| 라운드 상한 | 12 | **8** |

자산 계산: `Σ(타 블록 주식 × 주가) + 구역 수 × 5` — 자기 블록 주식과 크레딧 제외로 "적극적 시장 참여"를 강제.

## 사용 방법

1. `index.html`을 **Chrome/Safari**에서 열기 (file:// 도 OK)
2. **모드** 선택: 🎮 솔로 (1H+봇3) · 👥 핫시트 (2~5H) · 🤖 봇 전용
3. **맵 크기**: 🎓 5×5 튜토리얼 (첫 플레이 권장) · 🏙 11×11 정식
4. (솔로) **난이도** 🟢 EASY · 🟡 NORMAL · 🔴 HARD
5. **역할** 👻 Ghost (BLADE 추천) · 🏢 Bloc (HELIX/AXIOM 추천) + 클래스/블록
6. ▶ `🎮 START SIMULATION` 클릭
7. 턴 진행:
   - Phase 0 → `▶ 시장 → 뉴스` 클릭
   - Phase 1 (시장) → 주식 거래 → `▶ 거래 끝` 클릭
   - Phase 2 (계획) → 카드 2장 선택 + ▲/▼ 반쪽 선택 → `✓ 확정`
   - 이동 있으면 지도에서 노란 ◎ 셀 클릭 (BFS 반경 + 결과 미리보기 태그)
   - 레이드/결투/구역 보너스 모달 순서대로 결정
   - (핫시트) PASS THE DEVICE 화면이 자동으로 차례 전환
8. 승리/패배 후 `🔄 다시` 또는 `📊 메뉴 & 히스토리`
9. 게임 종료 로그는 `📋 로그 복사` 버튼으로 클립보드 복사
10. 밸런스 이슈는 Notion 밸런스 이슈 DB에 기록 (시뮬 버전·턴 명시)

## 검증 체크리스트 (플레이 후 확인)

- [ ] 7페이즈 순서가 혼란 없이 흘러가는가
- [ ] 개인 속성 풀이 과하게 비거나 넘치지 않는가
- [ ] 특정 클래스·블록이 압도적인가
- [ ] 카드 조합이 무한 콤보로 이어지지 않는가
- [ ] 승리 조건 달성까지 걸리는 라운드 수가 적절한가 (목표: 5~7R)
- [ ] AI가 의미 있는 행동을 하는가 (명백한 실수 없음)
- [ ] 레이드·M&A·공권력 상승이 고르게 발생하는가
- [ ] **승리 시 "이래서 이겼다"가 설명되는가** (결정감 v0.5.7+)
- [ ] **Bloc 턴이 Ghost 턴만큼 결정 부담이 있는가** (v0.5.8+)
- [ ] **상대 존재감이 느껴지는가** (위협 배지, 타겟 알림 — v0.5.9+)

## 버그 리포트

시뮬레이터 사용 중 발견 이슈는 Notion **밸런스 이슈 DB**에 기록:
- 제목: 간결
- Type: 규칙 / 카드 / 역할 / 맵 / UI
- Priority: Critical / High / Medium / Low
- Proposed Fix: 짧은 제안
- First Seen: 시뮬레이터 v0.5.X / 턴 X

## 변경 이력

| 버전 | 변경 요약 |
|---|---|
| v0.5 | MVP 첫 릴리스. 5×5 튜토리얼. |
| v0.5.1 | 교차참조 감사 & 파일 리네이밍 |
| v0.5.2 | 한글화, 카드 매핑, 로그 강화 |
| v0.5.3 | 클릭-이동 UI + 매턴 변화 요약 패널 + 개인 속성 풀 |
| v0.5.4 | TL 시스템 복구 + R&D 페이즈 + LocalStorage 히스토리 |
| v0.5.5 | Ghost TL 재조정 + 승리 진척 패널 + 구역 첫 방문 드래프트 |
| v0.5.6 | 카드 TOP/BOT 선택 UI + 시장 거래 UI + 뉴스 35종 강화 |
| v0.5.7 | 레이드 확정 모달 + 승리 예측 + 이동 셀 미리보기 |
| v0.5.8 | Bloc 2카드 운용 + 공통 덱 10장 + Bloc 이동 카드 |
| v0.5.9 | 위협 대시보드 + Ghost vs Ghost PvP + 타겟 알림 |
| v0.6+  | 11×11 정식 맵 통합, 동적 그리드 |
| v0.7+  | 5트랙 거리명성 + 마일스톤 |
| v0.8+  | 협상 페이즈(Phase 1.5) + NEXUS 동적 컨트롤 + 하이라이트 12종 |
| v1.0   | 솔로/핫시트 모드 분기, Cyberware 슬롯(R3/R6), 트랙 사이버펑크 리네이밍 |
| v1.0.5-fix | 11×11 맵 손패 가림 방지, 카드 flavor text Ghost 60+ / Bloc 30+ |
| v3.x~v5.x | 클래스 시그니처 11종 + 견제 토큰 3종 + 결정론 레이드 + 자원 변환 점수 (주로 sim-harness 측, web 측 v5.2.1로 부분 포팅) |
| v6.0   | 시뮬레이터 전반 리팩토링 + RIGGER 시그니처 + 결정 모달 골격 (web/headless) |
| v6.1   | (sim-harness) HELIX 시그니처 死문 수정 — 클론 뱅크 자동 매집으로 자산 직결화. 양 맵 위반 0·경고 0 유지 |
| v6.3   | 웹 시뮬레이터에 sim-harness 시그니처/`MODE_CONFIG` 전체 포팅 — `MODE_CONFIG`+`euro_mode`, 클래스 시그니처 13종(RIGGER/HELIX/CARBON11×11/CIPHER5×5/GhostHustle/BLADE/BROKER/CIPHER11×11/MOLE/VANTA/IRONWALL/AXIOM), `SUPPRESSION_SPEC`+`euro_applySuppression`(견제 적용) |
| v6.4   | 견제 토큰 봇 AI 부여 로직(`euro_grantSuppression`) web 포팅 — 매R 확률적으로(`MODE_CONFIG.suppressionProb`) 봇이 최다위협 상대에게 견제 부여(₵-5), 인간 타겟 시 알림 배너. 견제 시스템 완전 라이브화 |
| v6.5   | 인간 능동 견제 UI (`HUMAN_SUPPRESS` 리듀서 + 시장 페이즈 견제 패널, ₵5) + `index.html` 렌더 불능 핫픽스(`App()` 브레이스 불균형 1줄 복원) — 견제 양방향 라이브화 |
| v6.6   | 레이드 보상 결정 모달 라이브 트리거(`type:'raid_reward'`) — ★ 평판 루트 vs ₵+⚙ 약탈 루트, `euro_raidLootBundle` units 완전보존 환산으로 EV-중립 |
| v6.7   | 봇 견제 보복(grudge) AI — `lastSuppressedBy` 기억, 최근 2R(`EURO_GRUDGE_WINDOW`) 내 나를 견제한 상대를 확률적으로 우선 타겟(`EURO_GRUDGE_BONUS`), 발동률/비용/토큰 수 불변 |
| v6.8   | `bloc_invest` 결정 라이브 연결 — 인간 Bloc 잉여 자본(₵≥12) 시 주가 부양 vs ₵비축 선택(점수-중립). v6.0 결정 골격 두 템플릿(raid_reward·bloc_invest) 모두 라이브 완주 |
