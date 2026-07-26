# DEAD NEXUS

> *"Ashgrid 2091 — 연결이 끊어진 그곳에서, 새로운 연결이 시작된다."*

**DEAD NEXUS**는 1~5인 전략 레거시 게임 프로젝트입니다.
디스토피아 도시 **애시그리드(Ashgrid)**를 무대로, 5대 블록(Bloc) 메가기업과 독립 고스트(Ghost)가 벌이는 권력·자원·정보 전쟁.

**현재 버전**: v6.51 (2026-07) — 3트랙 체제 (전략 시뮬 · RPG ASH & SIGNAL · 프린트 킷) + 레거시 캠페인 8챕터 완결 + RPG 32미션·6클래스·4엔딩+New Game+·Act 2 "AFTER ZERO DAY"·캡스톤+심연 프로토콜·장비 경제·아이소 뷰·사운드·오브젝티브 다양성(생존형·HACK 전용 코어) + 시뮬 협상 페이즈 배선 + S06 재건왕/청산자 타이틀 + 외부 의존 0 + NEXUS BAR/레이스 HUD + 연출 폴리시(협상 플래시·S06 타이틀 스팅·레이스 HUD juice·전투 juice, `fx_module.js`)

- **라이브 플레이**: [dead-nexus.vercel.app](https://dead-nexus.vercel.app) — 브라우저에서 바로 시작 (모바일 세로 스택 지원, v6.25)
- **레이스 HUD**: 중앙 상단 4요소 — VICTORY RACE 트랙(전 좌석 승리 진척 %) · MARKET 틱커 · THREAT 스트립 · ROUND BRIEF. 판정 코드(`getVictoryGoals`/`evalPlayerVictory`)와 동일 소스로 계기판 정직성 유지 (v6.26)
- **시나리오 S01~S06 전체 개방**: 표준·코프 대전(all-Bloc M&A)·스트리트 라이징(Ghost 주도)·계엄의 밤(모바일 경찰 NPC)·골드러시(8R 스프린트)·마켓 크래시(공매도 전성) — 시나리오별 개성 실측 검증 완료 (docs/14, v6.21)
- **레거시 캠페인 8챕터 완결**: First Blood(최초 레이드 해금, v6.24) → Zero Day까지 전체 8챕터 온라인 해금 + 도시 흉터(최다 피격 블록 다음 판 주가 −1) 영속 계층, `legacy_module.js`(`TOTAL_CHAPTERS = 8`, v6.39 완결)
- **highlightPoints 승리 환산**: 하이라이트 포인트가 판정·HUD·배지 단일 소스로 승리 임계에 직결(`EURO_HL_VICTORY_SCALE`) — 종료 선언 역전율 재측정으로 기해소 확인 포함 (v6.27)

---

## 🎮 게임 개요

| 항목 | 내용 |
|---|---|
| **플레이 인원** | 1인 (솔로 + 봇 3) / 2–5명 (핫시트) |
| **플레이 타임** | 60–90분 (11×11 정식) / 30–45분 (5×5 튜토리얼) / 캠페인 8~12 세션 |
| **추천 연령** | 16세 이상 |
| **난이도** | ★★★★☆ |
| **장르** | 전략 / 자원 관리 / 구역 장악 / 레거시 |
| **핵심 메커니즘** | 6속성 마나형 시스템 + 2카드 TOP/BOTTOM + 덱빌딩+사이드웨이 + **5트랙 거리명성** + **Phase 1.5 협상** + **NEXUS 동적 룰** + **Cyberware 슬롯** |
| **시뮬레이터** | [simulator/v0.5/index.html](simulator/v0.5/index.html) — index.html + JS 모듈 5종(euro/tutorial/lore/legacy/fx), Chrome/Safari 직접 실행 |

---

## 🚀 빠른 시작 — 첫 플레이

### 1️⃣ 솔로 모드 (1인, 추천 첫 플레이)
1. `simulator/v0.5/index.html`을 더블클릭 (또는 우클릭 → Chrome/Safari로 열기)
2. **모드 선택**: 🎮 솔로 (1인)
3. **맵 크기**: 🎓 5×5 튜토리얼 (첫 플레이 권장) / 🏙 11×11 정식 (정식 모드)
4. **난이도**: 🟢 EASY (첫 플레이) / 🟡 NORMAL / 🔴 HARD
5. **역할**: 👻 Ghost (BLADE 추천) / 🏢 Bloc (HELIX 추천)
6. ▶ START 클릭

### 2️⃣ 핫시트 모드 (2~5인, 한 기기 공유)
1. 시뮬레이터 열기 → **모드**: 👥 핫시트
2. 각 플레이어 P1~P5 역할 선택
3. PASS THE DEVICE 화면이 자동 떠서 차례 전환

### 3️⃣ 인쇄 플레이 (오프라인)
1. [print-kit/](print-kit/) 폴더 열기
2. ⭐ **최우선**: `12-quick-reference.html` (A4 1매 — 모든 플레이어 자리에 1장씩, v1.8 신규)
3. **필수**: `01b-map-11x11.html` (A3) + `06-character-sheets.html` (A4 인원수×1)
4. 카드: `02-cards-ghost.html` + `03-cards-bloc.html` (인쇄 후 슬리브 권장)
5. 자세한 안내: `print-kit/index.html`

### 4️⃣ 게임 흐름 학습 (narrative)
- [docs/19-sample-game-narrative.md](docs/19-sample-game-narrative.md) — BLADE 11×11 표본 게임 narrative
- [docs/narratives/](docs/narratives/) — MOLE / BROKER / CIPHER / HELIX 4종 추가 표본
- 결정론적 시뮬: `cd sim-harness && node narrative_trace.js [role] [class] [map] [seed]`

---

## 🗂️ 리포지토리 구조

```
dead-nexus/
│
├── README.md                          # 이 문서
├── CHANGELOG.md                       # 버전 변경 기록
├── contributing.md                    # 기여 가이드
├── git_guide.md                       # Git 워크플로 가이드
│
├── docs/                              # 핵심 설계 문서
│   ├── 00-overview.md                 # 프로젝트 전체 개요
│   ├── 01-worldbuilding.md            # 세계관·배경 설정
│   ├── 02-core-rules.md               # 핵심 규칙 & 턴 구조
│   ├── 03-factions-blocs.md           # 5대 블록 상세
│   ├── 04-characters-ghosts.md        # 6인 고스트 캐릭터
│   ├── 05-card-system.md              # 이중 카드 시스템 (Ghost/Bloc)
│   ├── 06-attribute-system.md         # 6속성 시스템
│   ├── 07-combat-stats.md             # 전투 스탯 & 해결 규칙
│   ├── 08-stock-mna.md                # 주식·지분·M&A 시스템
│   ├── 09-tech-tree.md                # 테크 레벨 1~5
│   ├── 10-map-zones.md                # 11×11 동심원 + 5×5 튜토리얼
│   ├── 11-events-quests.md            # 이벤트 토큰 & 퀘스트
│   ├── 12-legacy-campaign.md          # 레거시 8챕터 "ASH & SIGNAL"
│   ├── 13-glossary.md                 # 용어 사전
│   ├── 14-scenarios.md                # 시나리오 시스템
│   ├── 15-hidden-objectives.md        # 숨은 목표 시스템
│   ├── 16-achievements.md             # 업적 시스템
│   ├── 17-v1.0-systems.md             # v1.0 신규 시스템 통합
│   ├── 18-playtest-guide.md           # 첫 플레이 가이드
│   ├── 19-sample-game-narrative.md    # 표본 게임 narrative (BLADE 11×11)
│   ├── 20-balance-audit-v2.x.md       # 밸런스 감사 리포트
│   ├── narratives/                    # MOLE/BROKER/CIPHER/HELIX 표본
│   └── v6.0-progress-log.md           # v6.0 작업 로그
│
├── cards/                             # 카드 데이터
│   ├── ghost/                         # 고스트 클래스별 덱 (6종)
│   │   ├── cipher.md · blade.md · rigger.md
│   │   └── broker.md · drifter.md · mole.md
│   ├── bloc/                          # 블록별 덱 (5종)
│   │   ├── vanta.md · ironwall.md · helix.md
│   │   └── axiom.md · carbon.md
│   ├── events/                        # 뉴스·블랙마켓·퀘스트
│   │   ├── news-events.md
│   │   ├── black-market.md
│   │   └── quest-deck.md
│   ├── legacy/                        # 레거시 8챕터 스토리
│   │   └── chapter-01 ~ chapter-08-*.md
│   ├── objectives/                    # 숨은 목표
│   │   ├── ghost.md
│   │   └── bloc.md
│   └── achievements/                  # 업적
│       ├── in-game.md
│       └── meta.md
│
├── simulator/                         # 웹 시뮬레이터
│   └── v0.5/                          # 메인 시뮬레이터 (v6.44)
│       ├── index.html                 # React 18 + Babel · 11×11 + 5×5 · 엔트리+코어 로직
│       ├── euro_module.js             # 유로 메커닉 (web 빌드)
│       ├── tutorial_module.js         # BGA 스타일 가이드 튜토리얼 (5×5 솔로)
│       ├── lore_module.js             # 서사 표면화 (인물 11인·명대사·에필로그)
│       ├── legacy_module.js           # 레거시 캠페인 8챕터 완결 (localStorage 영속, v6.39)
│       ├── fx_module.js               # 연출 FX 판별 로직 (협상 플래시·타이틀 스팅·HUD juice, v6.50)
│       └── README.md
│
├── sim-harness/                       # 헤드리스 시뮬 + 밸런스 회귀
│   ├── core.js                        # index.html에서 추출한 게임 로직
│   ├── euro_mechanics.js              # 유로 메커닉 + 시그니처 11종
│   ├── balance_test.js                # N판 배치 + 임계 검증
│   ├── narrative_trace.js             # 결정론 시드 narrative 생성
│   └── README.md
│
├── print-kit/                         # 인쇄 플레이 세트
│   ├── 01-map.html · 01b-map-11x11.html
│   ├── 02-cards-ghost.html · 03-cards-bloc.html
│   ├── 04-news-v1.html · 05-tokens.html          # 뉴스 36장(v1 정본)
│   ├── 06-character-sheets.html · 07-reference.html
│   ├── 08-feedback-form.html · 09-scenarios.html
│   ├── 10-objectives.html · 11-achievements.html
│   ├── 12-quick-reference.html        # A4 1매 player aid (v1.8)
│   └── index.html
│
└── playtesting/                       # 플레이테스트 기록
    └── session-00-guide.md            # 첫 세션 가이드
```

---

## 📚 핵심 문서 빠른 참조

### 세계관
- **[01-worldbuilding.md](docs/01-worldbuilding.md)** — 애시그리드 도시, 2091년 배경, 블록 등장 배경

### 게임 규칙
- **[02-core-rules.md](docs/02-core-rules.md)** — 턴 구조, 기본 규칙, 승리 조건
- **[05-card-system.md](docs/05-card-system.md)** — Ghost 2카드 TOP/BOTTOM 방식 + Bloc 덱빌딩+사이드웨이 방식
- **[06-attribute-system.md](docs/06-attribute-system.md)** — 6속성(MESH/IRON/VOLT/SHADE/BIO/ASH) + GRID

### 세력 & 캐릭터
- **[03-factions-blocs.md](docs/03-factions-blocs.md)** — VANTA / IRONWALL / HELIX / AXIOM / CARBON
- **[04-characters-ghosts.md](docs/04-characters-ghosts.md)** — STATIC / RUST / PATCH / SILK / FLINT / ECHO

### 시스템
- **[07-combat-stats.md](docs/07-combat-stats.md)** — HP / ATK / DEF / SPD / HACK
- **[08-stock-mna.md](docs/08-stock-mna.md)** — 주식 트랙, 지분 권한, 적대적 인수
- **[09-tech-tree.md](docs/09-tech-tree.md)** — TL 1~5 업그레이드 트리
- **[10-map-zones.md](docs/10-map-zones.md)** — 11×11 동심원 + 5×5 튜토리얼
- **[11-events-quests.md](docs/11-events-quests.md)** — 이벤트 토큰·뉴스·퀘스트
- **[14-scenarios.md](docs/14-scenarios.md)** — 시나리오 S01~S06
- **[15-hidden-objectives.md](docs/15-hidden-objectives.md)** — 숨은 목표
- **[16-achievements.md](docs/16-achievements.md)** — 업적 (in-game / meta)
- **[17-v1.0-systems.md](docs/17-v1.0-systems.md)** — v0.6~v1.0 통합 시스템

### 플레이·검증
- **[18-playtest-guide.md](docs/18-playtest-guide.md)** — 첫 플레이 가이드
- **[19-sample-game-narrative.md](docs/19-sample-game-narrative.md)** — BLADE 11×11 표본 게임
- **[docs/narratives/](docs/narratives/)** — MOLE / BROKER / CIPHER / HELIX 추가 표본
- **[20-balance-audit-v2.1.md](docs/20-balance-audit-v2.1.md)** / **[20-balance-audit-v2.2.md](docs/20-balance-audit-v2.2.md)** — 밸런스 감사 리포트
- **[sim-harness/README.md](sim-harness/README.md)** — 헤드리스 N판 회귀 도구

### 연구·감사 (v6.x)
- **[21-design-research.md](docs/21-design-research.md)** — 기계적 설계 감사 (死코드·불일치 발굴)
- **[22-game-identity.md](docs/22-game-identity.md)** — 게임 정체성 연구 (권장 정체성 도출)
- **[23-gameplay-audit.md](docs/23-gameplay-audit.md)** — 게임성 재감사 (v6.11→v6.23 실측)
- **[24-tabletop-operations.md](docs/24-tabletop-operations.md)** — 테이블탑 운영 연구 (print-kit 테이블 에디션 v1 스코프 근거)
- **[25-rpg-mode.md](docs/25-rpg-mode.md)** — RPG 모드 비전 (신설 트랙, GHOSTGRID 아키텍처)

---

## 🎯 게임 핵심 개념 요약

### 역할 선택
게임 시작 시 두 진영 중 선택:

**🏢 BLOC (기업 플레이어)** — 5대 메가기업 중 하나를 운영  
→ 승리 조건: 주식 자산 60 달성 **or** 타 블록 2곳 인수

**👤 GHOST (독립 플레이어)** — 6개 직업군 중 하나 선택  
→ 승리 조건: 렙(Rep) 30 + 블록 레이드 2회 성공

### 이중 카드 시스템

| 시스템 | 적용 | 모티브 |
|---|---|---|
| 2카드 탑/바텀 + 소각(LOSS) | **Ghost** | 2카드 TOP/BOTTOM 방식 |
| 덱빌딩 + 사이드웨이 + 조합 | **Bloc** | 덱빌딩+사이드웨이 방식 |
| 6속성 마나 비용 | **공통** | 6속성 마나형 |

### 속성 시스템 (6+1)
- ◈**M** MESH (해킹·데이터)
- ◈**I** IRON (물리·전투)
- ◈**V** VOLT (전기·에너지)
- ◈**S** SHADE (은신·기만)
- ◈**B** BIO (생체·치유)
- ◈**A** ASH (파괴·초토화)
- ◇ GRID (무색 범용)

---

## 🗓️ 개발 로드맵

### ✅ v0.1 — 컨셉 & 세계관 (완료)
### ✅ v0.2 — 핵심 시스템 (완료)
### ✅ v0.3 — 카드 데이터 + 레거시 캠페인 (완료)
- Ghost 60장 + Bloc 30장 + 뉴스 35장 + 블랙마켓 30장 + 퀘스트 40장
- 레거시 8챕터 스토리 (First Blood → Zero Day)

### ✅ v0.4 — 맵·프린트킷 (완료)
- 11×11 동심원 맵 + 5×5 튜토리얼 맵
- 프린트 앤 플레이 세트 11종 HTML
- 레거시 챕터 prev/next 체인 1~8 연결

### ✅ v0.5–0.9 — 시뮬레이터 + 시스템 통합 (완료)
- 5×5 → 11×11 맵 확장 + 동적 그리드
- 5트랙 거리명성 + 마일스톤
- 협상 페이즈 (Phase 1.5) + truce 약속 트래킹
- 하이라이트 모먼트 12종
- BROKER 협상 특화 + NEXUS 동적 컨트롤

### ✅ v1.0–1.5 — 솔로/핫시트 + Cyberware (완료)
- 솔로 + 멀티-휴먼 (Hot-seat) 모드
- 트랙 사이버펑크 리네이밍 (화력/그리드런/코드/인맥/그림자)
- Cyberware 슬롯 시스템 (R3/R6 자동 장착)
- 카드 flavor text (Ghost 60+ / Bloc 30+)
- 5×5 BLADE/MOLE 폭주 너프 (mini-raid 발동률)
- 첫 플레이 가이드 (`docs/18-playtest-guide.md`)

### ✅ v1.6–1.8 — 학습 자료 + Player Aid (완료)
- `sim-harness/narrative_trace.js`: 결정론 시드 narrative 자동 생성
- `docs/19-sample-game-narrative.md` + `docs/narratives/` 5종 표본
- `print-kit/12-quick-reference.html`: A4 1매 player aid

### ✅ v3.x–v5.x — 클래스 시그니처 + 유로 메커닉 (완료)
- 클래스 시그니처 11종 도입 (BLADE 표적·CIPHER 해킹 노드·VANTA veil 등)
- 견제 토큰 3종(무력/정보/외교) — 평판·데이터·인플루언스 직접 압박
- 결정론 레이드 (raidBonus) + 자원 변환 체인(부품→장비, 데이터→인텔)
- 하이라이트 모먼트 30종 확장 + 최종 점수 통합

### ✅ v6.0 — 시뮬레이터 전반 리팩토링 (완료)
- 11×11 / 5×5 모드 인터페이스 통합 (`MODE_CONFIG`)
- 견제 토큰 한글 표기·트레이스 4단계 분리
- 200판 출력 포맷 개편 + 진영/클래스 표 + 시드 결정론 옵션
- RIGGER 시그니처 신규 (양 모드 양 진영 정상화)
- 결정 모달 골격 (raid_reward / bloc_invest) — 헤드리스/UI 양쪽 자기검증

### ✅ v6.1 — HELIX 시그니처 복원
- HELIX 클론 뱅크가 `hp<maxHp` 게이트라 Bloc에선 死문이던 문제 — `euro_helixSignature`로 점수 직결 보상 부활 (매R 클론+1·🎙+1, 3개마다 타사 최저가 주식 매집)
- 측정 N=600: 11×11 25%→38~43% · 5×5 16.7%→31.7% · 시그니처 발동 0→4.2/2.7
- 양 맵 위반 0 · 경고 0, 진영 균형·전 클래스 임계 내 유지

### ✅ v6.2–v6.4 — 웹 시뮬레이터 시그니처 전체 포팅 + 견제 토큰 라이브화
- `MODE_CONFIG`+`euro_mode` 및 나머지 클래스 시그니처(CARBON 11×11 · CIPHER 5×5 · GhostHustle · BLADE · BROKER · CIPHER 11×11 해킹노드 · MOLE · VANTA · IRONWALL · AXIOM)를 `simulator/v0.5/euro_module.js`에 sim-harness와 동일 공식으로 이식 — 시그니처 13종 전체 web/headless 밸런스 레짐 수렴 (v6.3)
- `SUPPRESSION_SPEC` + `euro_applySuppression`(견제 적용, 무력★/정보📡/외교🎙) web 이식 (v6.3)
- `euro_grantSuppression` — 봇 AI가 매R 확률적으로(`MODE_CONFIG.suppressionProb`: 11×11 0.30 / 5×5 0.15) 최다위협 상대에 견제 토큰 자동 부여(₵-5), 인간 타겟 시 알림 배너. 견제 시스템 완전 라이브화 (v6.4)

### ✅ v6.5–v6.8 — 결정 모달 실연결 + 견제 양방향/보복 AI
- 인간 능동 견제 UI(`HUMAN_SUPPRESS` + 시장 페이즈 견제 패널, ₵5) + `index.html` 렌더 불능 핫픽스 — 견제 양방향 라이브화 (v6.5)
- 레이드 보상 결정 모달 라이브 트리거 — ★평판 루트 vs ₵+⚙약탈 루트, EV-중립 (v6.6)
- 봇 견제 보복(grudge) AI — 최근 2R 내 나를 견제한 상대를 확률적으로 우선 타겟, 발동률/비용 불변 (v6.7)
- `bloc_invest` 결정 라이브 연결 — 인간 Bloc 잉여 자본 시 주가 부양 vs ₵비축, 점수-중립. v6.0 결정 골격 두 템플릿 모두 라이브 완주 (v6.8)

### ✅ v6.9–v6.27 — M&A 완주 + 시나리오 S02~S06 + 레거시 Stage 1 + 레이스 HUD
- **M&A 시스템 전체** — 지분 모델·11×11 게이트(Stage 1, v6.9) → 봇 능동 인수·인간 방어 4종 모달·백기사 동맹(Stage 3, v6.10) → S02(코프 대전)에서 각성(0→14.7% 승리, v6.19)
- **캠페인 시나리오 S02~S06 시뮬 통합** — 코프 대전(v6.18)·스트리트 라이징(v6.19)·골드러시·마켓 크래시(v6.20)·계엄의 밤 부분 개방(v6.21) — **v6.21에 S01~S06 전 시나리오 개방**, 시나리오별 개성 실측 검증(docs/14, docs/23)
- **레거시 캠페인 Stage 1** — First Blood 챕터 해금 + 도시 흉터 영속 계층, `legacy_module.js` (v6.24)
- **모바일 세로 스택 레이아웃** — 720px 이하 실기기 검증 (v6.25)
- **레이스 HUD + print-kit 테이블 에디션 v1** — 승리 진척 계기판 4요소 + 인쇄 세트 수치 현행화 (v6.26)
- **highlightPoints 승리 환산** — 하이라이트 포인트를 판정 임계에 직결, 종료 선언 역전 재측정 (v6.27)

### ✅ v6.28–v6.46 — RPG 모드 "ASH & SIGNAL" 신설 + 완성 (완료)
- **RPG 트랙 신설** — GHOSTGRID 아키텍처(`docs/25-rpg-mode.md`). Stage 1 수직 슬라이스(챕터 1 "First Blood", v6.29) → Stage 2(BLADE 클래스·위협 게이지·시그널 다이, v6.32) → Stage 3(아이소메트릭 뷰 v6.36·장비 경제 v6.38)
- **미션 1 → 32종**: 메인 챕터 1~8 + 사이드 8종(v6.33, 16종) → Act 2 "AFTER ZERO DAY" 확장으로 29종(v6.43) → 캡스톤 "MERIDIAN FLAGSHIP" 추가 30종(v6.44) → 클래스 사이드 2종 추가 32종(v6.45)
- **플레이어블 6클래스(전량)**: CIPHER(해킹, v6.29) · BLADE(근접, v6.32) · RIGGER·MOLE(설치/위장, v6.34) · BROKER·DRIFTER(중개/기동, v6.45)
- **4엔딩 + New Game+** (v6.40): 🏙️CORPORATE ETERNAL / 🔥STREET RISING / 🕊️NEXUS REBORN / 💀DEAD NEXUS + 회차 플레이(엔딩 기록만 이월)
- **Act 2 "AFTER ZERO DAY"** (v6.43): 엔딩 4갈래 후일담 2연전 + 클래스 전용 개인 서사(숙적 보스 4종) + 신규 외부 세력 MERIDIAN + 하드 모드
- **캡스톤 + 심연 프로토콜** (v6.44): "MERIDIAN FLAGSHIP" 3연전 최종 결전 + 무한 상승 웨이브 "심연 프로토콜"
- **RPG 6클래스 완성 + 시뮬 정직화** (v6.45): BROKER·DRIFTER 플레이어블 승격 · 밸런스 252조합 clearFail 0 · 홈 PWA + 접근성
- **오브젝티브 다양성 + S06 타이틀 + B-01 종결** (v6.46): 생존형 승리조건 `survive:N`·HACK 전용 코어(데이터 레이어만) · S06 재건왕/청산자 타이틀(하이라이트 시스템 배선) · S03 B-01 2-레버 전수 측정 기각 종결
- 픽셀 아트(Kenney CC0, v6.42) · 사운드 12종(Kenney CC0, v6.44) — rpg 유닛 321/321 · 미션 검증기 32/32 · 밸런스 하네스 252/252

### 🔄 다음 마일스톤 — 실제 미완 항목
- 대면 플레이테스트 1~3회 (실 데이터 수집, `playtesting/session-00-guide.md` 가이드 준비 완료)
- 오토마 덱 설계 (봇 3인의 테이블 번역 — `playtesting/balance-issues-digest.md` §4 로드맵)
- TTS(Tabletop Simulator) 익스포트
- 일러스트 + 공식 룰북 PDF + 카드 아트
- 킥스타터 준비

---

## 🧭 문서 작성 원칙

1. **모든 규칙은 한 문장 내에서 명확해야 한다** — 애매한 규칙은 플레이테스트 이슈
2. **용어는 13-glossary.md를 먼저 확인** — 새 용어 추가 시 반드시 등록
3. **카드 텍스트는 120자 이내** — 실제 카드 크기에 맞춰야 함
4. **버전 관리** — 규칙 변경 시 CHANGELOG.md에 반드시 기록
5. **저작권 안전** — 외부 IP/작품의 직접 명칭 사용 금지 (메커니즘 일반어로 표현)

---

## 🤝 기여하기

현재 Alpha 단계 — 작성자 중심 설계 진행 중. 외부 기여 가이드는 v0.5 이후 공개 예정.

플레이테스트 지원자는 `playtesting/feedback/` 에 이슈 등록 가능.

---

## 📜 라이선스

TBD (v1.0 릴리스 시 확정)  
현재 모든 설계·텍스트·아트 저작권은 프로젝트 메인테이너에게 있음.

---

## 📮 연락처

프로젝트 이슈·피드백: GitHub Issues 사용  
디자인 문의: 해당 문서 하단 주석 또는 Issues

---

*Dead Nexus — 죽은 것은 연결이 아니라 믿음이다.*
