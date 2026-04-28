# DEAD NEXUS — Git 업로드 가이드 & 문서 인덱스

> ⚠️ **HISTORICAL DOCUMENT** — v0.1~v0.3 마이그레이션 시점 기록. `dn_*`·`cartel_rulebook` 참조는 **구형 Notion 아티팩트 식별자**이지 파일 경로가 아님. 현재 구조는 모든 파일이 최종 경로에 배치된 상태.

**이 문서의 목적**: 지금까지 작성된 모든 artifact를 실제 git 리포지토리에 어떻게 배치할지, 어떤 파일이 어디에 들어가는지 정리합니다.

---

## 📋 현재 작성된 문서 → 파일 매핑

| 현재 Artifact ID | 최종 파일 경로 | 상태 |
|---|---|---|
| `dn_readme` | `README.md` | ✅ 완성 |
| `dn_changelog` | `CHANGELOG.md` | ✅ 완성 |
| `dn_core_rules` | `docs/02-core-rules.md` | ✅ 완성 |
| `cartel_rulebook` | `docs/01-worldbuilding.md` + `docs/07-combat-stats.md` + 분리 필요 | ⚠ 분할 필요 |
| `dn_factions` | `docs/03-factions-blocs.md` + `docs/04-characters-ghosts.md` | ⚠ 분할 필요 |
| `dn_bloc_cards` | `cards/bloc/` 하위 5개 파일 | ⚠ 분할 필요 |
| `dn_card_system` | `docs/05-card-system.md` | ✅ 완성 |
| `dn_attribute_system` | `docs/06-attribute-system.md` | ✅ 완성 |

---

## 🎯 git 리포 초기화 단계

### Step 1: 로컬 리포 생성
```bash
mkdir dead-nexus
cd dead-nexus
git init
git branch -M main
```

### Step 2: 디렉토리 구조 생성
```bash
mkdir -p docs cards/ghost cards/bloc cards/events cards/quests cards/black-market cards/data
mkdir -p legacy assets/maps assets/icons assets/card-templates assets/logos
mkdir -p prototypes/web-simulator prototypes/print-and-play/v0.1
mkdir -p playtesting/reports playtesting/feedback
```

### Step 3: 필수 루트 파일 생성
```bash
touch README.md CHANGELOG.md CONTRIBUTING.md LICENSE .gitignore
```

### Step 4: .gitignore 기본 내용
```gitignore
# OS
.DS_Store
Thumbs.db

# Editors
.vscode/
.idea/
*.swp

# Build
node_modules/
dist/
build/
*.log

# Playtesting 개인 메모
playtesting/feedback/*.private.md

# 임시 파일
*~
*.tmp
```

### Step 5: 첫 커밋
```bash
git add .
git commit -m "chore: initialize repo structure with DEAD NEXUS v0.2 docs"
```

### Step 6: 원격 저장소 연결
```bash
git remote add origin https://github.com/YOUR-USERNAME/dead-nexus.git
git push -u origin main
```

---

## 📁 전체 파일 트리 (목표 상태)

```
dead-nexus/
│
├── README.md                              [완성됨 — dn_readme]
├── CHANGELOG.md                           [완성됨 — dn_changelog]
├── CONTRIBUTING.md                        [다음 작성]
├── LICENSE                                [TBD]
├── .gitignore                             [위 내용]
│
├── docs/
│   ├── 00-overview.md                     [다음 작성 — 요약 문서]
│   ├── 01-worldbuilding.md                [분할 필요 — cartel_rulebook에서 추출]
│   ├── 02-core-rules.md                   [완성됨 — dn_core_rules]
│   ├── 03-factions-blocs.md               [분할 필요 — dn_factions에서 추출]
│   ├── 04-characters-ghosts.md            [분할 필요 — dn_factions에서 추출]
│   ├── 05-card-system.md                  [완성됨 — dn_card_system]
│   ├── 06-attribute-system.md             [완성됨 — dn_attribute_system]
│   ├── 07-combat-stats.md                 [분할 필요 — cartel_rulebook에서 추출]
│   ├── 08-stock-mna.md                    [분할 필요 — cartel_rulebook에서 추출]
│   ├── 09-tech-tree.md                    [분할 필요 — cartel_rulebook에서 추출]
│   ├── 10-map-zones.md                    [v0.4에 작성]
│   ├── 11-events-quests.md                [분할 필요 — cartel_rulebook에서 추출]
│   ├── 12-legacy-campaign.md              [v0.4에 상세 작성]
│   └── 13-glossary.md                     [다음 작성 — 용어 사전]
│
├── cards/
│   ├── README.md                          [카드 데이터 구조 설명]
│   │
│   ├── ghost/                             [고스트 클래스별 10장 덱]
│   │   ├── _template.md                   [덱 문서 템플릿]
│   │   ├── cipher.md                      [v0.3 작성]
│   │   ├── blade.md                       [v0.3 작성]
│   │   ├── rigger.md                      [v0.3 작성]
│   │   ├── broker.md                      [v0.3 작성]
│   │   ├── drifter.md                     [v0.3 작성]
│   │   └── mole.md                        [v0.3 작성]
│   │
│   ├── bloc/                              [블록별 6장씩]
│   │   ├── vanta.md                       [분할 필요 — dn_bloc_cards]
│   │   ├── ironwall.md                    [분할 필요 — dn_bloc_cards]
│   │   ├── helix.md                       [분할 필요 — dn_bloc_cards]
│   │   ├── axiom.md                       [분할 필요 — dn_bloc_cards]
│   │   └── carbon.md                      [분할 필요 — dn_bloc_cards]
│   │
│   ├── events/
│   │   └── news-events.md                 [v0.3 작성 — 50장]
│   │
│   ├── quests/
│   │   └── quest-deck.md                  [v0.3 작성 — 40장]
│   │
│   ├── black-market/
│   │   └── black-market.md                [v0.3 작성 — 30장]
│   │
│   └── data/                              [자동 파싱용 JSON]
│       ├── ghost-cards.json
│       ├── bloc-cards.json
│       └── events.json
│
├── legacy/
│   ├── README.md                          [캠페인 진행 가이드]
│   ├── chapter-01-first-blood.md          [v0.4]
│   ├── chapter-02-insider-game.md         [v0.4]
│   ├── chapter-03-martial-night.md        [v0.4]
│   ├── chapter-04-price-of-splice.md      [v0.4]
│   ├── chapter-05-mesh-ghost.md           [v0.4]
│   ├── chapter-06-bloc-acquisition.md     [v0.4]
│   ├── chapter-07-heart-of-city.md        [v0.4]
│   └── chapter-08-zero-day.md             [v0.4]
│
├── assets/
│   ├── maps/
│   │   └── ashgrid-36-zones.svg           [v0.4]
│   ├── icons/
│   │   ├── attributes/                    [6개 속성 아이콘]
│   │   └── resources/                     [자원 아이콘]
│   ├── card-templates/
│   │   ├── ghost-card-template.svg
│   │   └── bloc-card-template.svg
│   └── logos/
│       ├── vanta.svg
│       ├── ironwall.svg
│       ├── helix.svg
│       ├── axiom.svg
│       └── carbon.svg
│
├── prototypes/
│   ├── web-simulator/
│   │   ├── src/                           [React 시뮬레이터]
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── print-and-play/
│       └── v0.1/
│           ├── cards-ghost.pdf            [v0.5]
│           ├── cards-bloc.pdf             [v0.5]
│           ├── board.pdf                  [v0.5]
│           └── rulebook-summary.pdf       [v0.5]
│
└── playtesting/
    ├── session-00-guide.md                [v0.5]
    ├── reports/
    │   └── _template.md                   [리포트 템플릿]
    └── feedback/
        └── .gitkeep
```

---

## 📝 카드 데이터 파일 형식 표준

### 카드 마크다운 형식 (ghost 예시)

```markdown
# CIPHER — 기본 덱 (10장)

**클래스**: CIPHER (정보전·해킹)  
**주 속성**: ◈M MESH  
**부 속성**: ◈S SHADE  
**패 크기**: 6장 / 라운드

---

## Card 01: PORT SCAN

**Type**: Class (CIPHER)  
**Initiative**: 12  
**Attribute Tag**: ◈M  
**Tags**: 첩보, 정찰

### ▲ TOP Action
**Generates**: ◈M  
**Effect**: MOVE 3 + 대상 구역 베일 강도 확인

### ▼ BOTTOM Action
**Cost**: ◈M ◈S  
**Effect**: 구역 내 모든 플레이어 위치 공개. 다음 턴 해당 구역 베일 해제.

### Flavor
> *"베일이 당신을 숨겨주는 게 아니야. 나한테 어디 있는지 알려줄 뿐이지."*  
> — STATIC

### Design Notes
- 초반 정찰 카드. 비용 저렴, 정보 우위 초석
- BOTTOM은 2속성 필요 → 같은 턴 SHADE 카드 조합 중요
```

### JSON 데이터 형식

```json
{
  "id": "cipher_01_port_scan",
  "class": "CIPHER",
  "name": "PORT SCAN",
  "initiative": 12,
  "attributeTag": "M",
  "tags": ["첩보", "정찰"],
  "top": {
    "generates": ["M"],
    "effect": "MOVE 3 + 대상 구역 베일 강도 확인"
  },
  "bottom": {
    "cost": ["M", "S"],
    "effect": "구역 내 모든 플레이어 위치 공개. 다음 턴 해당 구역 베일 해제.",
    "isLoss": false
  },
  "flavor": "베일이 당신을 숨겨주는 게 아니야. 나한테 어디 있는지 알려줄 뿐이지.",
  "flavorAttrib": "STATIC",
  "version": "0.2.0"
}
```

---

## 🌱 브랜치 전략

### 기본 브랜치
- `main` — 릴리스된 안정 버전만
- `develop` — 작업 중인 최신 통합 브랜치
- `feature/*` — 개별 기능/문서 작업 브랜치

### 예시 브랜치 이름
```
feature/ghost-cipher-deck
feature/event-cards-50
feature/legacy-chapter-01
fix/attribute-pool-balance
docs/update-rulebook-v03
```

---

## 📌 커밋 메시지 규칙

**형식**: `<type>(<scope>): <subject>`

### Type
- `feat`: 새 규칙/카드/기능 추가
- `fix`: 버그·오류 수정
- `docs`: 문서만 변경
- `refactor`: 구조 변경 (규칙 의미 변화 없음)
- `balance`: 밸런스 조정
- `chore`: 기타 (빌드·설정)

### 예시
```
feat(cards): add CIPHER class 10-card deck
fix(rules): clarify 3-player combat resolution
docs(readme): update roadmap for v0.3
balance(attributes): reduce SURGE cost from 5 to 4
chore(repo): add .gitignore for node_modules
```

---

## 🏷️ 태그 & 릴리스

### 버전 태그 규칙
```bash
# Minor 버전 태그
git tag -a v0.2.0 -m "Core systems finalized: dual card + 6속성 마나형 attributes"

# Patch 태그
git tag -a v0.2.1 -m "Combat resolution clarifications"

# 원격 푸시
git push origin --tags
```

### 릴리스 단계
- **Alpha (v0.x)** — 내부 설계·프로토타입
- **Beta (v0.9)** — 외부 플레이테스트
- **RC** — 킥스타터 준비
- **1.0** — 정식 공개

---

## ✅ 다음 작업 우선순위

### 즉시 진행 가능 (분할만 하면 됨)
1. `cartel_rulebook` → 4개 파일로 분할
   - `01-worldbuilding.md`
   - `07-combat-stats.md`
   - `08-stock-mna.md`
   - `09-tech-tree.md`
   - `11-events-quests.md`
2. `dn_factions` → 2개 파일로 분할
   - `03-factions-blocs.md`
   - `04-characters-ghosts.md`
3. `dn_bloc_cards` → 5개 파일로 분할
   - `cards/bloc/vanta.md`
   - `cards/bloc/ironwall.md`
   - `cards/bloc/helix.md`
   - `cards/bloc/axiom.md`
   - `cards/bloc/carbon.md`

### 신규 작성 필요 (v0.3)
4. `docs/00-overview.md` — 1페이지 전체 개요
5. `docs/13-glossary.md` — 용어 사전
6. `CONTRIBUTING.md` — 기여 가이드
7. `cards/ghost/*.md` — 6개 클래스 덱 (각 10장)
8. `cards/events/news-events.md` — 뉴스 50장
9. `cards/events/quest-deck.md` — 퀘스트 40장
10. `cards/events/black-market.md` — 블랙마켓 30장

### v0.4 작성 예정
11. `docs/10-map-zones.md` — 맵 구역 상세
12. `docs/12-legacy-campaign.md` — 레거시 통합 가이드
13. `legacy/chapter-0X-*.md` — 챕터별 상세 스토리

---

## 💡 팁: 대형 아티팩트 관리

지금까지 artifact로 작성된 문서가 여러 개 있습니다. git에 업로드하려면:

1. **복사 & 붙여넣기** — 각 artifact 내용을 로컬 파일로 옮기기
2. **GitHub Gist 활용** — 임시 공유용으로 먼저 업로드
3. **GitHub CLI 사용** — `gh repo create dead-nexus --public`로 한 번에 처리

### 한번에 올리는 bash 스크립트 (참고용)
```bash
#!/bin/bash
# dead-nexus 초기 업로드 스크립트

PROJECT="dead-nexus"
mkdir -p $PROJECT && cd $PROJECT

# 디렉토리 구조
mkdir -p docs cards/{ghost,bloc,events,quests,black-market,data}
mkdir -p legacy assets/{maps,icons,card-templates,logos}
mkdir -p prototypes/{web-simulator,print-and-play/v0.1}
mkdir -p playtesting/{reports,feedback}

# 기본 파일
touch README.md CHANGELOG.md CONTRIBUTING.md LICENSE .gitignore

# 이후 각 artifact 내용을 해당 파일에 붙여넣기

git init
git add .
git commit -m "chore: initialize DEAD NEXUS v0.2 repository"

echo "✅ 리포 초기화 완료. 이제 각 artifact를 해당 파일에 복사하세요."
```

---

## 📖 관련 문서

- **프로젝트 개요**: `README.md`
- **변경 이력**: `CHANGELOG.md`
- **핵심 규칙**: `docs/02-core-rules.md`
- **카드 시스템**: `docs/05-card-system.md`
- **속성 시스템**: `docs/06-attribute-system.md`
