# CHANGELOG

DEAD NEXUS 프로젝트의 모든 주요 변경사항을 기록합니다.  
형식: [Keep a Changelog](https://keepachangelog.com/)  
버전 체계: [Semantic Versioning](https://semver.org/) 준용

---

## [Unreleased] — 작업 중

### Planned
- 플레이테스트 세션 00 실시 (5×5 튜토리얼 맵 + 프린트킷 기반)

---

## [0.4.1] — 프린트킷 (2026-04-22)

### Added
- **`print-kit/` 디렉토리** — Session 00 실시용 프린트 컴포넌트 9개 HTML
  - `index.html` — 프린트킷 허브 (인쇄 설정 가이드 포함)
  - `01-map.html` — 5×5 튜토리얼 보드 (A4 가로 1매)
  - `02-cards-ghost.html` — Ghost 3덱 × 10장 = 30장 (CIPHER·BLADE·BROKER, A4 세로 4매)
  - `03-cards-bloc.html` — Bloc 3세력 × 6장 = 18장 (VANTA·IRONWALL·CARBON, A4 세로 2매)
  - `04-news-15.html` — Session 00 큐레이션 뉴스 15장 (A4 세로 2매)
  - `05-tokens.html` — 속성 풀 토큰 60개 + 자원 토큰 48개 + 이벤트 토큰 24개 + 블록 마커 25개 + 시그널 다이 대응표
  - `06-character-sheets.html` — Ghost 3종 + Bloc 공용 블랭크 시트 (HP·자원·덱·구역 추적)
  - `07-reference.html` — 턴·전투·속성·맵 퀵룩 참조 카드 (A4 세로 2매)
  - `08-feedback-form.html` — 플레이어 피드백 양식 (6문항 + 자유 기술)

### Design Notes
- 브라우저 렌더링 (Noto Sans KR + JetBrains Mono via Google Fonts CDN)
- `@page` CSS로 용지 크기·여백 제어
- 카드 표준 사이즈 63×88mm (포커 카드 호환)
- 프린트 친화 색상 팔레트 (저잉크 파스텔)
- `Ctrl+P → PDF 저장`으로 배포 가능
- 피드백 기반 v0.4.1 밸런스 패치
- 변형 시나리오 문서 (`legacy/after-zero-day.md` — 엔딩 3/4 해금 후)
- VOSS Chronicles 확장 아웃라인
- Nexus Underground (고스트 중심 확장) 아웃라인
- 디지털 TTS 프로토타입 사양서
- Notion 규칙북 페이지 v0.4 재동기화

---

## [0.4.0] — 맵 대개편 (2026-04-21)

### Added
- **11×11 동심원 맵** 전면 도입 (`docs/10-map-zones.md` v0.3)
  - 121 구역 (기존 36의 3.4배)
  - Chebyshev 거리 기준 6링 구조: NEXUS (F6) → Ring 1 블록 HQ → Ring 2 업타운 → Ring 3 미드타운 → Ring 4 다운타운 → Ring 5 비통제구역 접경
  - 블록 본사 동서남북·NE 대칭 배치 (VANTA 북 / AXIOM NE / HELIX 동 / IRONWALL 남 / CARBON 서)
  - NEXUS 부속시설 3곳 (E5·E7·G7, 공용)
  - 경찰서 4곳 십자 배치 (F3·C6·I6·F9) — 점령 불가
  - 플레이 타임 목표 **3시간** (기존 2시간)
- **방사형 하이웨이** — NEXUS에서 8방위 축 이동 시 1포인트 = 2칸 점프
- **5×5 튜토리얼 맵** (`docs/10-map-zones.md` §15, v0.3.1)
  - 25구역, Session 00 공식 세팅
  - 간소화: 6~8라운드, Bloc 자산 25 / Ghost 렙 10+레이드 1, TL 2 상한, M&A·레거시·메시 비활성
  - Session 00 가이드와 직접 연동
- **맵 사이즈 옵션 3종** — 튜토리얼 5×5 / 표준 11×11 / 확장 13×13 (6~8인용)
- Ring 기반 방어 보정 (Ring 1 +2, Ring 2 +1, Ring 5 −1)
- 비통제구역 출입구 4곳 (F1, F11, A6, K6) — 레거시 챕터 3 이후 탈출 가능

### Changed
- **블록 시작 구역**: 2구역 → **3구역** (HQ + Ring 2 지원 2)
- 시작 구역 보호: 3라운드 → **4라운드** (표준) / 2라운드 (튜토리얼)
- Ghost 시작 위치 고정: Ring 5 변두리 (STATIC A2, BROKER B2, DRIFTER K1, RIGGER J10, BLADE K11, MOLE H6 HELIX 내부 위장)
- 이벤트 토큰: 36개 → **120개** (표준) / 24개 (튜토리얼), 비율은 유지
- 기존 "남북 분할 업/미드/다운타운" → **동심원 구조**로 테마 재정의

### Documentation
- `docs/10-map-zones.md` v0.3 전면 개정
- `docs/01-worldbuilding.md` — 격자 크기 갱신
- `docs/02-core-rules.md` §2.2, §2.3 — 시작 셋업 갱신
- `docs/03-factions-blocs.md` — 5 블록 시작 구역 좌표 명시
- `docs/11-event-quests.md` — 토큰 구성 2 사이즈 버전
- `cards/legacy/chapter-03-martial-night.md` — 병영 구역 (경찰서 4곳 주변)
- `cards/legacy/chapter-04-price-of-splice.md` — B6 → B8 불법 시술소
- `cards/legacy/chapter-05-mesh-ghost.md` — 메시 레이어 격자 갱신
- `cards/legacy/chapter-06-bloc-acquisition.md` — D4 → F6 타워
- `cards/legacy/chapter-07-heart-of-city.md` — D4 → F6 NEXUS 2회
- `cards/events/quest-deck.md` — D4 → F6 (Q01, Q25)
- `playtesting/session-00-guide.md` — 5×5 튜토리얼 맵 채택

---

## [0.3.0] — 레거시 캠페인 8챕터 완성 (2026-04-21)

### Added
- **레거시 챕터 2 "Insider Game"** — 최초 M&A 선언 해금
  - 봉투 B 내용물, 배신 기록 시스템, 상호 지분 상한 50%
  - Bloc 6종 M&A 카드, Ghost 2종 내부자 카드
- **레거시 챕터 3 "Martial Night"** — 공권력 트랙 10 해금
  - 병영 구역·지하 저항소 타일, 검문소 시스템
  - 정부 계약 이벤트, 현상수배 영구화 옵션
- **레거시 챕터 4 "Price of Splice"** — TL4 또는 스플라이스 3개 해금
  - **사이버사이코시스 트랙** (0~10) 도입, Psychosis 시 NPC 전환
  - 스플라이스 강화 카드 6종, HELIX 특수 이벤트
  - "PURIST" 영구 스티커 (스플라이스 거부 엔딩 조건)
- **레거시 챕터 5 "Mesh Ghost"** — CIPHER TL5 또는 메시 3침입 해금
  - **메시 확장 맵 영구 공개**
  - AI 의식체 NPC **SIGNAL** 등장
  - ASCEND 카드 (Ghost 의식 업로드, 영구 육신 포기)
- **레거시 챕터 6 "Bloc Acquisition"** — Bloc 1곳 완전 흡수 해금
  - "ACQUIRED" 블록 NPC화 규칙, 전직 직원 Ghost 고용 풀
  - VOSS 가문 혈연 공개 (HELIX–CARBON 연결)
  - 남은 블록 수장별 특수 능력 자동 부여
- **레거시 챕터 7 "Heart of the City"** — 넥서스 3라운드 장악 해금
  - 블록 5수장 **보스 카드** (HP 20, 블록 고유 능력)
  - 넥서스 타워 3구획 (로비/집행부/의장실) 전장화
  - **기여 트랙 4종** (지배/혁명/평의회/공멸) — 엔딩 분기 축적
- **레거시 챕터 8 "Zero Day"** — 최종 챕터, 챕터 7 완료 시 자동 해금
  - 엔딩 4종 카드 (CORPORATE ETERNAL / STREET RISING / NEXUS REBORN / DEAD NEXUS)
  - 플레이어 최후 선택 시트, SIGNAL 최종 메시지
  - 박스 봉인 의례, 미개봉 엔딩 3장 영구 보관
  - 후속 확장 해금 경로 (After Zero Day / 폐허 생존)

### Documentation
- `legacy/chapter-02-insider-game.md` 신규
- `legacy/chapter-03-martial-night.md` 신규
- `legacy/chapter-04-price-of-splice.md` 신규
- `legacy/chapter-05-mesh-ghost.md` 신규
- `legacy/chapter-06-bloc-acquisition.md` 신규
- `legacy/chapter-07-heart-of-city.md` 신규
- `legacy/chapter-08-zero-day.md` 신규
- 각 챕터: 오프닝 내러티브 → 봉투 내용물 → 영구/임시 효과 → 플레이어 선택지 → 레거시 기록 → 다음 챕터 힌트 → 교차 참조

### Changed
- 엔딩 조건을 **기여 트랙 축적 모델**로 전환 (기존: 단일 수치 기준)
  - 블록 지배 / 혁명 / 평의회 재건 / 공멸 4트랙 동시 추적
- Bloc 수장 NPC가 챕터 7에서 직접 전투 가능한 보스로 승격
- "사이버사이코시스"를 정식 시스템화 (기존: 단순 위험 태그)

---

## [0.2.0] — 핵심 시스템 확정

### Added
- **이중 카드 시스템** 설계 완료
  - Ghost: Gloomhaven식 2카드 TOP/BOTTOM 액션, [LOSS] 소각 카드
  - Bloc: Mage Knight식 덱빌딩, 사이드웨이 플레이, 콤보 조합
  - 교차점: Ghost-Bloc 계약 시 카드 1라운드 임대 가능
- **MTG식 6속성 시스템**
  - ◈M MESH (해킹·데이터)
  - ◈I IRON (물리·전투)
  - ◈V VOLT (전기·에너지)
  - ◈S SHADE (은신·기만)
  - ◈B BIO (생체·치유)
  - ◈A ASH (파괴·초토화)
  - ◇ GRID (무색 범용)
- **공용 속성 풀(Attribute Pool)** — 모든 플레이어 공유 자원
- **속성 강도 시스템** — Dim / Active / Surging 3단계
- **속성 연쇄(Chain)** — 같은 속성 2연속 시 보너스
- **속성 상성** — MESH→SHADE, IRON→ASH 등 6개 상성 관계
- **시그널 다이(Signal Die)** — 매 라운드 메시 상태 결정
  - MESH UP / MESH DOWN / SURGE / BLACKOUT
- **전투 스탯 5종** — HP / ATK / DEF / SPD / HACK
- **상처 카드(Wound)** — Ghost HP 50% 이하 시 덱 오염
- **스캔들 카드(Scandal)** — Bloc 피해 시 덱 오염

### Changed
- Ghost 전투 시스템을 단순 d6에서 글룸헤이븐식 이니셔티브로 변경
- Bloc 카드 비용 체계를 크레딧 단일 → 속성 다중 체계로 전환
- 주식 변동 요인에 속성 풀 상태 반영

### Documentation
- `docs/05-card-system.md` 신규 작성
- `docs/06-attribute-system.md` 신규 작성
- 속성 풀 시뮬레이션 인터랙티브 위젯 추가

---

## [0.1.5] — 세력·캐릭터 상세화

### Added
- **5대 블록 상세 설정**
  - VANTA (보안·정보) — 디렉터 VERA ASHTON
  - IRONWALL (군사·무기) — 제너럴-디렉터 MARCUS CRANE
  - HELIX (생체공학) — 박사 DR. ELIA VOSS
  - AXIOM (AI·스마트 시스템) — KAI MORROW
  - CARBON (에너지·인프라) — 엘더 HARLAN VOSS
- **각 블록 정체성** — 실존 기업 모티브 + 픽션 설정 혼합
- **블록 간 관계도** — 5 × 5 매트릭스 (동맹·적대·중립)
- **수장 프로필** — 이름·나이·외모·성격·배경·명대사
- **6인 고스트 NPC급 설정**
  - CIPHER: **STATIC** (LENA GREY, 27세)
  - BLADE: **RUST** (COLE HARKER, 34세)
  - RIGGER: **PATCH** (CASS WIRE, 22세)
  - BROKER: **SILK** (SERA HOLT, 39세)
  - DRIFTER: **FLINT** (DANE CROSS, 41세)
  - MOLE: **ECHO** (MIRA SHADE, 31세)
- **고스트 간 관계도** — 6 × 6 매트릭스
- **숨겨진 복선** — VOSS 성씨 연결(HELIX·CARBON 혈연 가능성)

### Changed
- 모든 캐릭터 이름을 한국어에서 **영어 전용**으로 교체
- 명대사도 영어 원문 + 한국어 번역 병기

---

## [0.1.4] — Bloc 전용 액션카드 설계

### Added
- **블록별 전용 카드 30장** (5블록 × 6장)
  - VANTA: Shadow File, Leverage, Veil Deployment, Ghost Protocol, Data Wipe, Zero Record
  - IRONWALL: Forward Strike, Arms Supply, Forward Base, Martial Law, Mercenary Surge, Scorched Earth
  - HELIX: Field Splice, Neural Override, Augmentation, Quarantine Zone, Harvest Protocol, Clone Decoy
  - AXIOM: Prediction Engine, Flash Crash, Algorithm Lock, Flash Trade, Surveillance Net, System Takeover
  - CARBON: Power Surge, Blackout, Pipeline Lock, Infrastructure Bond, Hostile Dividend, Legacy Contract
- **카드 해금 조건** — TL 1~4 단계별 해금
- **블록 플레이스타일 정의**
  - VANTA: 정보 우위 → 선제 대응 → 기록 말소
  - IRONWALL: 충돌 강제 → 거점 강화 → 전장 지배
  - HELIX: 아군 회복 → 스탯 강화 → 생체 교란
  - AXIOM: 예측 → 주가 붕괴 → 알고리즘 방어
  - CARBON: 수입 증폭 → 접근 차단 → 장기 계약

---

## [0.1.3] — 타이틀 & 용어 체계 확정

### Added
- **프로젝트 정식 명칭**: **DEAD NEXUS**
- **세계관 도시명**: **Ashgrid** (애시그리드)
- **독자 용어 체계** — 저작권 회피를 위한 완전 재구성
  - Bloc (기업)
  - Ghost (독립 플레이어)
  - The Mesh (메시 — 구 넷스페이스)
  - Veil (베일 — 구 ICE)
  - Splice (스플라이스 — 구 사이버웨어)
  - Cortex Wire (코어텍스 와이어 — 구 신경 임플란트)
  - Rep (렙 — 평판)

### Changed
- 모든 카드·규칙 텍스트를 신 용어로 일괄 교체
- 파일·문서 전체에서 Cyberpunk 2077 용어 제거

### Removed
- Netrunner, Cyberware, Night City, ICE, MegaCorp 등 저작권 위험 용어

---

## [0.1.2] — 액션카드 & 퀘스트 시스템

### Added
- **공용 액션카드 3장** — 거점 구축, 자원 거래, 긴급 탈출
- **클래스별 전용 카드 6장 × 6클래스 = 36장**
- **맵 이벤트 토큰 시스템**
  - 즉발 이벤트 40%
  - 퀘스트 35%
  - 발견 15%
  - 공백 10%
- **퀘스트 유형 8종** — 배달·암살·해킹·협상·탐사·레이드·생존·밀수
- **전투 스탯 시스템 도입** — HP / ATK / DEF / SPD / HACK

---

## [0.1.1] — 역할·승리 조건 이원화

### Added
- **Bloc / Ghost 이원 선택 시스템**
- **Bloc 승리 조건**: 주식 자산 60 OR 타 블록 2곳 인수
- **Ghost 승리 조건**: 렙 30 + 블록 레이드 2회 성공
- **레거시 캠페인 구조** — 8챕터 "ASH & SIGNAL"
- **봉투 해금 시스템** — 조건 달성 시 봉투 개봉
- **공권력 트랙** — 0~10 단계, 계엄 선포 조건

---

## [0.1.0] — 초기 프로토타입

### Added
- 게임 초기 컨셉 — 4인 전략 현대 범죄 보드게임
- 자원 4종 (자금·조직원·정보·무기)
- 도시 구역 타일 시스템 (6×6 = 36구역)
- 기본 턴 구조 5단계 (사건·계획·실행·수익·유지)
- 레거시 챕터 7개 봉투 시스템
- 최초 규칙서 초안 작성

### Context
- 프로젝트 최초 발상
- 4인 현대 범죄 조직 전쟁 컨셉으로 시작
- 이후 사이버펑크 기업전쟁으로 방향 전환

---

## 버전 규칙

| 형태 | 조건 |
|---|---|
| **MAJOR** (1.0.0) | 게임 전체 구조 변경, 하위 호환 깨짐 |
| **MINOR** (0.X.0) | 핵심 시스템 추가, 기존 규칙 중대 변경 |
| **PATCH** (0.0.X) | 카드 텍스트 수정, 밸런스 조정, 오타 |

---

## 변경 유형

- `Added` — 새로 추가된 기능·규칙·카드
- `Changed` — 기존 내용 변경
- `Deprecated` — 곧 제거될 예정 (다음 MAJOR에서)
- `Removed` — 삭제된 내용
- `Fixed` — 오류·버그 수정
- `Security` — 보안·저작권 관련 수정
- `Documentation` — 문서 관련 변경만 (규칙 변경 없음)
