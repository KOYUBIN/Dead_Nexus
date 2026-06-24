# DEAD NEXUS

> *"Ashgrid 2091 — 연결이 끊어진 그곳에서, 새로운 연결이 시작된다."*

**DEAD NEXUS**는 1~5인 전략 레거시 게임 프로젝트입니다.
디스토피아 도시 **애시그리드(Ashgrid)**를 무대로, 5대 블록(Bloc) 메가기업과 독립 고스트(Ghost)가 벌이는 권력·자원·정보 전쟁.

**현재 버전**: v6.1 (2026-06) — HELIX 시그니처 복원 + 시뮬레이터 v1.0.5-fix

- **헤드리스 하네스 (N=600)**: 11×11 / 5×5 양 모드 위반 0 · 경고 0, 진영 균형 안정
- **HELIX 시그니처 死문 수정**: 6클래스 중 유일하게 발동률 0이던 클론 뱅크를 `euro_helixSignature`로 복원 (양 맵 최저 → 중위권)
- **웹 시뮬레이터 v1.0.5-fix**: 11×11 정식 + 5×5 튜토리얼 통합, 솔로/핫시트/봇 모드, EASY/NORMAL/HARD 난이도

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
| **시뮬레이터** | [simulator/v0.5/index.html](simulator/v0.5/index.html) — 단일 HTML, Chrome/Safari 직접 실행 |

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
│   ├── index.html                     # (스캐폴드)
│   └── v0.5/                          # 메인 시뮬레이터 (단일 HTML, v1.0.5-fix)
│       ├── index.html                 # React 18 + Babel · 11×11 + 5×5
│       ├── euro_module.js             # 유로 메커닉 (web 빌드)
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
│   ├── 04-news-15.html · 05-tokens.html
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
- **[14-scenarios.md](docs/14-scenarios.md)** — 시나리오 S01~S08
- **[15-hidden-objectives.md](docs/15-hidden-objectives.md)** — 숨은 목표
- **[16-achievements.md](docs/16-achievements.md)** — 업적 (in-game / meta)
- **[17-v1.0-systems.md](docs/17-v1.0-systems.md)** — v0.6~v1.0 통합 시스템

### 플레이·검증
- **[18-playtest-guide.md](docs/18-playtest-guide.md)** — 첫 플레이 가이드
- **[19-sample-game-narrative.md](docs/19-sample-game-narrative.md)** — BLADE 11×11 표본 게임
- **[docs/narratives/](docs/narratives/)** — MOLE / BROKER / CIPHER / HELIX 추가 표본
- **[20-balance-audit-v2.x.md](docs/)** — 밸런스 감사 리포트 (v2.1 / v2.2)
- **[sim-harness/README.md](sim-harness/README.md)** — 헤드리스 N판 회귀 도구

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

### ✅ v6.1 — HELIX 시그니처 복원 (이번 사이클)
- HELIX 클론 뱅크가 `hp<maxHp` 게이트라 Bloc에선 死문이던 문제 — `euro_helixSignature`로 점수 직결 보상 부활 (매R 클론+1·🎙+1, 3개마다 타사 최저가 주식 매집)
- 측정 N=600: 11×11 25%→38~43% · 5×5 16.7%→31.7% · 시그니처 발동 0→4.2/2.7
- 양 맵 위반 0 · 경고 0, 진영 균형·전 클래스 임계 내 유지

### 🔄 v2.0+ — 다음 마일스톤
- 대면 플레이테스트 1~3회 (실 데이터 수집)
- 결정 모달 라이브 트리거(harness raid_reward 실연결) — 결정 깊이 확장
- 웹 시뮬레이터에 시그니처/`MODE_CONFIG` 포팅 — 1차 완료(MODE_CONFIG + RIGGER/HELIX 시그니처). 나머지 9개 시그니처·견제 토큰·점수 통합 잔여
- TTS(Tabletop Simulator) 익스포트
- 캠페인 시나리오 S02~S08 시뮬 통합
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
