# DEAD NEXUS

> *"Ashgrid 2091 — 연결이 끊어진 그곳에서, 새로운 연결이 시작된다."*

**DEAD NEXUS**는 5인 전략 레거시 게임 프로젝트입니다.
디스토피아 도시 **애시그리드(Ashgrid)**를 무대로, 5대 블록(Bloc) 메가기업과 독립 고스트(Ghost)가 벌이는 권력·자원·정보 전쟁.

**현재 버전**: v1.8 (2026-04-29) — 11×11 정식 + 5트랙·거리명성 + 협상 + NEXUS 룰 + Cyberware + narrative trace + 퀵 레퍼런스

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
├── CONTRIBUTING.md                    # 기여 가이드
├── LICENSE                            # 라이선스 (TBD)
│
├── docs/                              # 핵심 설계 문서
│   ├── 00-overview.md                 # 프로젝트 전체 개요
│   ├── 01-worldbuilding.md            # 세계관·배경 설정
│   ├── 02-core-rules.md               # 핵심 규칙 & 턴 구조
│   ├── 03-factions-blocs.md           # 5대 블록 상세
│   ├── 04-characters-ghosts.md        # 6인 고스트 캐릭터
│   ├── 05-card-system.md              # 이중 카드 시스템 (Ghost/Bloc)
│   ├── 06-attribute-system.md         # MTG식 6속성 시스템
│   ├── 07-combat-stats.md             # 전투 스탯 & 해결 규칙
│   ├── 08-stock-mna.md                # 주식·지분·M&A 시스템
│   ├── 09-tech-tree.md                # 테크 레벨 1~5
│   ├── 10-map-zones.md                # 애시그리드 맵 & 36 구역
│   ├── 11-events-quests.md            # 이벤트 토큰 & 퀘스트
│   ├── 12-legacy-campaign.md          # 레거시 8챕터 "ASH & SIGNAL"
│   └── 13-glossary.md                 # 용어 사전
│
├── cards/                             # 카드 데이터 (마크다운 + JSON)
│   ├── ghost/                         # 고스트 클래스별 덱
│   │   ├── cipher.md
│   │   ├── blade.md
│   │   ├── rigger.md
│   │   ├── broker.md
│   │   ├── drifter.md
│   │   └── mole.md
│   ├── bloc/                          # 블록별 덱
│   │   ├── vanta.md
│   │   ├── ironwall.md
│   │   ├── helix.md
│   │   ├── axiom.md
│   │   └── carbon.md
│   ├── events/                        # 뉴스 이벤트 카드 50장
│   │   └── news-events.md
│   ├── quests/                        # 퀘스트 카드
│   │   └── quest-deck.md
│   ├── black-market/                  # 블랙마켓 덱 30장
│   │   └── black-market.md
│   └── data/                          # JSON 원본 데이터
│       ├── ghost-cards.json
│       ├── bloc-cards.json
│       └── events.json
│
├── legacy/                            # 레거시 캠페인 스토리
│   ├── chapter-01-first-blood.md
│   ├── chapter-02-insider-game.md
│   ├── chapter-03-martial-night.md
│   ├── chapter-04-price-of-splice.md
│   ├── chapter-05-mesh-ghost.md
│   ├── chapter-06-bloc-acquisition.md
│   ├── chapter-07-heart-of-city.md
│   └── chapter-08-zero-day.md
│
├── assets/                            # 시각 자료
│   ├── maps/                          # 맵 이미지·SVG
│   ├── icons/                         # 속성·자원 아이콘
│   ├── card-templates/                # 카드 디자인 템플릿
│   └── logos/                         # 블록 로고·심볼
│
├── prototypes/                        # 프로토타입 & 시뮬레이터
│   ├── web-simulator/                 # React 웹 시뮬레이터
│   │   ├── src/
│   │   └── README.md
│   └── print-and-play/                # PnP PDF 세트
│       └── v0.1/
│
└── playtesting/                       # 플레이테스트 기록
    ├── session-00-guide.md            # 첫 세션 가이드
    ├── reports/                       # 세션별 리포트
    └── feedback/                      # 피드백·밸런스 이슈
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

### 🔄 v2.0+ — 다음 마일스톤
- 대면 플레이테스트 1~3회 (실 데이터 수집)
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
