# 21. 설계 연구 보고서 — 4도메인 감사 (전투 · 클래스 개성 · 카드 · 스토리)

**문서 ID**: `docs/21-design-research.md`
**버전**: v1.0 (시뮬레이터 v6.11.2 / CHANGELOG `[Unreleased]` 기준)
**최종 수정**: 2026-07-14
**관련 문서**: `03-factions-blocs.md`, `04-characters-ghosts.md`, `05-card-system.md`, `07-combat-stats.md`, `12-legacy-campaign.md`, `13-glossary.md`, `20-balance-audit-v2.2.md`, `CHANGELOG.md`

---

## 0. 개요

### 0.1 연구 범위와 방법

- **범위**: 4개 도메인 병렬 심층 연구 — ① 전투 로직, ② 직업 캐릭터 개성(Ghost 6클래스 + Bloc 5블록), ③ 카드 시스템(TOP/BOT · 덱빌딩 · 뉴스 · 덱 오염), ④ 스토리·세계관(레거시 8챕터 포함) — 그리고 4개 연구 결과에 대한 **교차 감사**(모순·중복·공백 검출).
- **방법**: 보드게임 설계 문서(`docs/`, `cards/`)와 웹 시뮬레이터 실구현(`simulator/v0.5/index.html`, `euro_module.js`), 헤드리스 harness(`sim-harness/`)의 3원 대조. 모든 갭 주장은 파일:라인 근거를 병기했고, 근거가 약한 항목은 **(추정)** 으로 표기했다. 승률 등 측정치는 `CHANGELOG.md` 및 balance_test 기록의 인용이다.
- **읽는 법**: 문서와 구현의 괴리 자체가 이 보고서의 핵심 발견이다. "문서에 있는데 웹에 없음"과 "웹에 있는데 문서에 없음" 양방향을 모두 다룬다.

### 0.2 핵심 결론 (3줄)

1. **핵심 긴장 장치가 봇/카드 경로에서 죽어 있다** — 봇/카드 레이드는 구조적으로 100% 성공(threshold 5 고정 vs 최소 합 5)이라 인간 Bloc이 받는 레이드는 순수 필연이고, HP0·상처/스캔들 덱 오염·휴식/소진 등 문서가 약속한 리스크(docs/05 §1.5~1.7, docs/07 STEP F)가 웹에 없다.
2. **개성 자산이 write-only다** — 시그니처 13종 중 3종(veil/garrison/MOLE 위장)은 부여만 되고 소비처가 없으며, 인물 11인(코드네임 6 + 수장 5)은 웹에 0회 등장, 클래스 특기 4종·블록 패시브 5종은 문서 전용이고, 다수 카드 텍스트가 ★/₵ 정액 폴백으로 평면화됐다.
3. **3원장(문서–웹–harness) 드리프트가 광범위하다** — DRIFTER 스탯 3값, 덱 목록·덱 크기 4곳 상이, 레이드 threshold 공식 불일치, 뉴스 수 4원 불일치, 레거시 문서 모순 3건. 단일 "정본 감사" + harness 기준선 1회 재측정으로 묶지 않으면 이후 밸런스 작업의 오차원이 된다.

---

## 1. 전투 로직

### 1.1 현황

웹 전투는 3계층으로 나뉜다.

| 계층 | 판정 방식 | 근거 |
|---|---|---|
| **인간 레이드** | 모달에서 6타입(기본 3 + 트랙 해금 3, useStat atk/spd/hack) 선택 + 무기/데이터/속성풀 3축 투자 → 접근→실행(d6=1 크리 실패)→도주 3단계 d6 판정. 성공 시 렙 vs 약탈 선택 모달(v6.5) | `index.html:5601~5763`, `:1979~1991`, `:2124~2145` |
| **봇/카드 레이드** | 결정론 raidBonus(3+⌊무기/3⌋+gear)+atk vs **고정 threshold 5**, 주사위 0% | `index.html:868`, `:3534`, `:3708` |
| **듀얼/직접공격** | 양측 d6+ATK vs d6+DEF, ±2 마진 승패, 고정 HP-2 또는 피해=공격-방어 | `index.html:2224~2229`, `:3492~3499` |

이니셔티브는 카드 init / TL×10 오름차순 정렬(`getInitiative`, `index.html:3247~3256`). 스탯 5종은 인간 레이드에서만 전부 사용되고, 봇 Ghost는 atk/def/hp만, Bloc 임원 스탯은 사실상 미사용. docs/07 STEP C~F(무기 +0.5, 속성풀 보너스 4종, HP0 시 30% 약탈+시작구역 리스폰, 상처/스캔들 카드, 메시 전투, CONTRACT KILL SPD 즉사 판정)는 웹 미구현이며, 전투계 카드 효과 대부분이 렙+N·트랙+1·mini-raid 플랫 보상으로 흡수됐다(`index.html:4386~4418`).

### 1.2 강점

- **인간 레이드 결정공간이 풍부** — 타입 6종 × 투자 3축(무기=실행+1, 데이터=접근+1, 속성풀 매치+2) × 실행/후퇴. 사전 선택 7개 이상, UI가 방어 정보·성공률을 결정 전에 공개 (`index.html:5601~5763`).
- **크리티컬 실패**(d6=1 자동 실패, v0.5.25) + combat LV4/LV5 면역으로 리스크 커브와 성장 보상이 연결됨 (`index.html:1983~1986`).
- **상성 이중 사이클**(Ghost 6방향 카운터 +2, Ghost→Bloc 카운터 +1)이 레이드·듀얼 양쪽에 일관 적용되고 UI에 표시됨 (`index.html:894~904`, `:1920`, `:2223`).
- **레이드 성공 보상의 EV-중립 선택화**(렙 루트 vs 약탈 루트, v6.5) — 전투 결과가 승리 루트 선택과 연결 (`index.html:2124~2145`, `euro_module.js:784`).
- **봇 raidBonus 공식이 `sim-harness/core.js:442`와 동일** — 봇 레짐은 웹·헤드리스 수렴 (v5.2.0 포팅).
- 듀얼 회피 옵션과 무승부 밴드(±2)가 저코스트 조우를 허용 — 강제 전투 없음.

### 1.3 갭

1. **봇/카드 레이드 100% 성공 — 실패 분기 死코드.** raidBonus 최소 3 + Ghost atk 최소 2 = 5 ≥ 고정 threshold 5. 인간이 Bloc일 때 받는 모든 레이드가 이 경로라, Bloc 입장에서 레이드는 긴장·드라마가 0인 필연이다.
   **근거**: `index.html:868`(raidBonus), `:3534`/`:3708`(`const threshold = 5`), `:3582~3592`(도달 불가능한 실패 분기), `:603~608`(atk 최소 2)
2. **Bloc 방어 수단 전부가 봇 레이드에 무효.** fortify 카드·보안센터 건물(fortified+2)·IRONWALL garrison·VANTA veil이 봇 경로 threshold에 미반영. harness는 `threshold = 5 + fortified + garrison + veil`(`core.js:1736, 1881`)인데 웹만 flat 5. garrison/veil은 웹에서 쌓이기만 하고 소비처 0건 — "raid 시 자동 반격" 로그는 허위.
   **근거**: `sim-harness/core.js:1736,1881` vs `index.html:3534,3708`; `euro_module.js:453~469`(부여만)
3. **인간 Ghost의 atk 카드 레이드 우회 익스플로잇.** Bloc 구역 위에서 atk 효과 카드 사용 시 playerIdx 구분 없이 결정론 100% 성공 레이드(렙+3, 주가-3)가 발동 — 리스크 있는 3단계 모달이 무의미해진다.
   **근거**: `index.html:3702~3736`
4. **`rtype.id` 참조 버그.** RAID_TYPES 정의(`index.html:909~968`)에 id 필드가 없어 잠입형 security 트랙/협상형 party 트랙 보상이 영구 미발동.
   **근거**: `index.html:2076~2077` vs RAID_TYPES 정의
5. **死스탯.** 봇 Ghost는 hack/spd 미사용(레이드에 atk만), Bloc은 hack 5(VANTA/AXIOM) 포함 5종 스탯 전부 미사용(메시 전투·베일 판정 부재). SPD는 이니셔티브에 미관여 — docs/07 STEP B 동점 규칙(BLADE 선공·SPD 비교) 미구현. 도주 판정도 spd 2 + d6 최소 1 = 3 ≥ 3이라 거의 실패 불가.
   **근거**: `index.html:3564`(봇 stats.atk만), `:3247~3256`, `:1988~1991`
6. **HP0 처리 파편화.** defeated 설정은 직접공격 경로 1곳뿐. 레이드 실패/듀얼/청부(HP-4)는 HP0로 만들어도 매R +1 재생으로 부활 → docs/07 STEP F(30% 약탈+시작구역 복귀) 미구현, HP의 전략적 무게 상실.
   **근거**: `index.html:3688`(유일한 `defeated:true`), `:4144`(청부), `:2616`(+1/R 재생)
7. **성공률 표기 3중 불일치.** 지도 프리뷰는 (2+atk)/6 구식 공식, 모달 estPct는 trackBonus·접근 실패 -2 누락, 실제 판정식은 둘 다와 다름 — 플레이어가 보는 확률이 체계적으로 부정확.
   **근거**: `index.html:6219` vs `:5620~5631` vs `:1979~1986`
8. **죽은 전투 장치들.** attackBonusOnce는 3곳에서 기록만 되고 소비 0("다음 판정 +N" 로그는 허위); once-ability reroll/droneFree/teleport는 LV5 해금만 되고 사용처 없음; 레거시 RESOLVE_RAID_YES는 신형 pendingRaid에 threshold/atk 필드가 없어 호출 시 항상 실패; mood_chip "결투 -1" 단점 미구현; 시그널 다이는 표시 전용(docs/06 §7 미반영).
   **근거**: `index.html:1681/3880/3983/4577`(attackBonusOnce), `:1104~1110`(소비처 0), `:2149~2158` vs `:3542~3555`, `:1218`; signalDie 소비처 grep 0건
9. **인간/봇 듀얼 비대칭.** 인간 경로(RESOLVE_DUEL_YES)는 trackBonus 미적용, 봇 자동 듀얼은 적용.
   **근거**: `index.html:2224~2225` vs `:3492~3493`
10. **harness에 3단계 레이드가 없음** → N=600 밸런스 측정이 인간 전투 경로(타입 선택·투자·3판정)를 전혀 검증하지 못함.
    **근거**: `sim-harness/core.js`에서 RAID_TYPES/approach/escape 검색 0건 (인간 경로는 결정론 legacy만: `core.js:846~870`)

### 1.4 개선 제안

| # | 제안 | 요지 | Impact | Effort | 대상 파일 |
|---|---|---|---|---|---|
| C1 | 봇/카드 레이드 threshold를 harness와 정합 | `:3534`·`:3708`을 `5 + fortified + garrison + veil`로 (`core.js:1736` 동일식). 봇 레이드 실패가 가능해지고 Bloc 방어 투자·garrison·veil·보안센터가 전부 부활 | high | S | `simulator/v0.5/index.html` |
| C2 | atk 카드 레이드 우회 차단 | `:3702` 분기에서 인간은 pendingRaid 모달로 라우팅 — 100% 성공 익스플로잇 제거 (§5 교차 이슈 X1과 통합 설계 필요) | high | S | `simulator/v0.5/index.html` |
| C3 | `rtype.id` 버그 수정 | `:2076~2077`을 `pr.selectedType` 참조로 — 잠입/협상 트랙 보상 복구 | mid | S | `simulator/v0.5/index.html` |
| C4 | HP0 통합 처리 헬퍼(applyDamage) | 산재한 피해 처리 6곳(`:3677, :2229/:3499, :2025/:3586, :4144`)을 단일 함수로 통합, HP0 시 docs/07 STEP F 일관 적용 | high | M | `simulator/v0.5/index.html` |
| C5 | 성공률 표기 단일화 | estPct에 trackBonus·접근 실패 기대치 반영, 지도 프리뷰(`:6219`)가 같은 함수를 재사용 | mid | S | `simulator/v0.5/index.html` |
| C6 | 死 once-ability 3종 구현 | reroll(레이드 리롤 1회)/droneFree(parts 비용 면제)/teleport(이동 무제한 1회) — LV5 보상 공약 이행 | mid | M | `simulator/v0.5/index.html` |
| C7 | 듀얼 대칭화 + 결정공간 확장 | 인간 경로에 trackBonus 적용, mood_chip 결투-1 반영, 무기 투자 미니축 추가 | mid | M | `simulator/v0.5/index.html` |
| C8 | 시그널 다이–전투 연결 | docs/06 §7대로 BLACKOUT=hack계 잠금, MESH_UP=hack +1, SURGE=크리 실패 1~2 확대 | mid | S | `simulator/v0.5/index.html` |
| C9 | harness에 3단계 레이드 이식 | RAID_TYPES·3단계 판정·투자축 이식 + 타입별 성공률·EV 리포트 | mid | M | `sim-harness/euro_mechanics.js`, `sim-harness/balance_test.js` |
| C10 | attackBonusOnce 소비 구현 | 레이드 실행·듀얼 판정에서 가산 후 리셋 — 허위 로그 해소 | low | S | `simulator/v0.5/index.html` |

---

## 2. 직업 캐릭터 개성 (Ghost 6클래스 + Bloc 5블록)

### 2.1 현황

문서층은 풍부하다: docs/04에 Ghost 6인(STATIC·RUST·PATCH·SILK·FLINT·ECHO)의 외모·성격·배경·특기·명대사·관계 매트릭스, docs/03에 Bloc 5수장(VERA ASHTON 등)·문화·플레이스타일·TL1~5 테크트리·패시브 5종이 정의됨. `cards/`는 클래스별 10장으로 개성을 반영. 웹은 `euro_module.js`에 시그니처 13종(v6.3)·견제 토큰·결정 모달 6타입·M&A 3단계가 라이브. 클래스 차별화 장치: GHOST_COUNTERS 6상성, CLASS_STARTING_TRACKS, 클래스 특화 레이드 3종(MOLE 잠입/BROKER 협상/RIGGER 드론), mini-raid 트리거.

그러나 시그니처 13종 중 웹에서 실효과가 있는 것은 8종뿐 — VANTA veil·IRONWALL garrison 토큰은 소비처 부재(로그만), MOLE 위장은 웹·harness 양쪽 모두 write-only, DRIFTER는 유일하게 페널티 시그니처만 보유. 인물 캐릭터(코드네임·수장)는 웹에 0회 등장. 밸런스는 CHANGELOG 기록 기준 N=600에서 전 클래스 5~60% 임계 내(HELIX 38~43%, RIGGER 38%, AXIOM 31~62% 진폭 — 측정치 인용).

### 2.2 강점

- **문서의 서사 밀도** — docs/04는 클래스별 말투·배경·명대사("I don't pick sides. I pick rates.")와 6×6 관계 매트릭스, docs/03은 블록별 실존 모티브·문화·수장 인물까지 정의.
- **카드 덱이 개성을 실제로 반영** — BLADE 저이니셔티브 선공형(QUICK DRAW init 5), CIPHER HACK 5+주가조작, BROKER 전투카드 0장+수수료 경제 등 덱 구조와 서사가 일치.
- **작동하는 시그니처 8종** — BLADE 표적(★+8/-3 스윙)·BROKER 메모·HELIX 클론 매집·AXIOM 마켓 틱·CARBON 그리드·CIPHER 해킹노드가 점수에 실제 연결된 "매R 개성 리듬"을 만듦 (`euro_module.js:325~500`).
- **클래스 특화 레이드 3종**(`index.html:934~967`)과 6상성 사이클(`:894~901`), 클래스별 시작 트랙(`:1023~1036`)이 플레이 감각 차별화에 기여.
- **밸런스 프로세스가 개성 문제를 실제로 발견·수정해 온 이력** — RIGGER 함정망 신설(20%→38%), HELIX 클론 매집 소생(25%→38~43%) (`CHANGELOG.md:139~142, 169`).
- `balance_test.js`가 클래스별 승률 허용폭과 시그니처 발동률을 함께 측정 — 개성 장치의 실발동 여부가 관측 가능.

### 2.3 갭

1. **인물 캐릭터가 게임플레이에 전무.** Ghost 코드네임 6종과 블록 수장 5인(VERA ASHTON·MARCUS CRANE·ELIA VOSS·KAI MORROW·HARLAN VOSS)이 웹 시뮬레이터에 0회 출현. 웹 CARD_FLAVOR 약 90종도 docs/04 명대사를 재사용하지 않고 익명 문장으로 새로 작성됨.
   **근거**: grep `'STATIC|RUST|SILK|FLINT|ECHO|VERA|CRANE|MORROW|VOSS'` → `index.html` 매치 0건(LEVERAGE의 부분 문자열 오탐만); `index.html:4734~4841` vs docs/04 명대사 전부 불일치
2. **시그니처 13종 중 3종이 로그 전용.** VANTA veil·IRONWALL garrison 토큰을 웹 레이드 판정이 읽지 않음(harness는 threshold에 가산). MOLE 위장(disguiseBloc)은 웹·harness 양쪽 모두 설정만 하고 소비처 없음.
   **근거**: 부여 `euro_module.js:446, 464, 428`; 웹 판정 `index.html:1950~1961`(fortified+BLOC_DEFENSE만); harness `core.js:1736,1881`; disguiseBloc 소비처 양 코드베이스 grep 0건
3. **DRIFTER가 가장 밋밋한 클래스.** 유일하게 웹 시그니처가 페널티뿐(5×5 매R ★-1)이고 양(+)의 시그니처 부재. harness extraMove도 write-only. 이동 판타지 카드(GHOST_RUN 텔레포트, BACKROADS 등)는 전부 "수배-1 ★+2"류 평면 폴백으로 수렴.
   **근거**: `euro_module.js:198~211`, `sim-harness/core.js:696·2509`, `index.html:4613~4619`
4. **docs/04 클래스 특기 4종 미구현** — BLADE 동점 자동 선공, MOLE 능력 복사(게임 1회), DRIFTER 봉쇄·함정 통과(R당 1회), BROKER 계약 슬롯+1·수수료 면제.
   **근거**: `docs/04-characters-ghosts.md:94, 174~176, 217, 256~258`; 웹 실행 순서는 init 정렬만(`index.html:2849`)
5. **docs/03 블록 패시브 5종(경제·수입 계열)이 웹에 없음** — 대신 전 블록 공통의 무차별 랜덤 "패시브 확장"으로 대체. 블록별 TL1~5 테크트리도 미구현(TL1~2 카드 해금만). **단, 뉘앙스**: 방어 측 개성은 BLOC_DEFENSE 테이블(`index.html:987~993` — VANTA detect -2, IRONWALL threshold +1, AXIOM 보정)이 **인간 레이드 한정으로 이미 구현**되어 있다. 정확한 진단은 "없다"가 아니라 "봇 경로와 경제 패시브에 미적용"이다.
   **근거**: `docs/03-factions-blocs.md:18~24, 66~73` vs `index.html:3005~3037, 987~993`
6. **블록 덱의 공용 카드 비중이 개성 희석.** 문서 "전용 6 + 공용 3 = 9장" vs 웹 "전용 6 + 공용 13 = 19장" — 덱의 68%가 5블록 동일.
   **근거**: `cards/bloc/vanta.md:13` vs `index.html:755, 757~763`
7. **클래스 고유 자원 6종 붕괴.** 데이터 샤드·바디카운트·부품·접선·연료셀·위장신분이 웹에선 역할 공통 자원으로 수렴 — initResources는 role만 분기, fuel은 "₵+4 ⚙+2" 폴백, 위장신분은 자원으로 부재.
   **근거**: docs/04 각 프로필 vs `index.html:1498~1500, 4605~4612`
8. **범용 폴백이 카드 판타지를 평면화.** mimic(적 카드 복사)→"★+5 ₵+3", wipe_log→"수배0 ★+4", vote_flip(이사회 조작)→"★+5 ₵+5" 등.
   **근거**: `index.html:4343~4470`(v0.6.6c 폴백 주석 블록)
9. **DRIFTER 스탯이 3원장에서 3값.** docs HP9/ATK4, harness HP9/ATK2(주석 "atk 4→3"는 stale), 웹 HP8/ATK2 — 밸런스 너프가 문서에 역반영되지 않음.
   **근거**: `docs/07-combat-stats.md:47` vs `sim-harness/core.js:64` vs `index.html:607`
10. **웹 덱과 `cards/*.md`가 클래스별 최대 4장 상이** (RIGGER·MOLE·DRIFTER). docs/04와 `cards/drifter.md` 간에도 STORM RUSH vs GHOST RUN 불일치.
    **근거**: `cards/ghost/rigger.md:13~24`, `mole.md:13~24`, `drifter.md:13~25` vs `index.html:691~698`; `docs/04:224~228`
11. **결정 모달 6타입 전부 클래스 무관** — BLADE 표적·MOLE 위장 대상·HELIX 클론 사용처가 모두 자동 휴리스틱. 클래스 개성이 "선택"으로 표현되는 지점이 없음.
    **근거**: `euro_module.js:746~753, 350~357, 424~428`
12. **관계 매트릭스·캠페인 관계 선택(동맹/빚/적대) 미반영** — 협상 페이즈는 자원 스왑/휴전만.
    **근거**: `docs/04-characters-ghosts.md:277~303` vs `index.html:2405~2446`

### 2.4 개선 제안

| # | 제안 | 요지 | Impact | Effort | 대상 파일 |
|---|---|---|---|---|---|
| P1 | 죽은 시그니처 3종 실효화 | 웹 레이드 판정에 garrison/veil 가산(=C1과 동일 수술) + MOLE 위장 소비처 신설(threshold -2, 수입 빼돌리기 ₵1, 발각 시 해제) | high | S | `simulator/v0.5/index.html`, `simulator/v0.5/euro_module.js` |
| P2 | DRIFTER 양(+)의 시그니처 "보급로" | 방문 구역 수 기반 보상(RIGGER 함정망 공식의 이동 버전, zonesVisited 메타 재사용) + extraMove 실소비. 기존 5×5 너프와 상쇄 측정 | high | M | `simulator/v0.5/euro_module.js`, `sim-harness/euro_mechanics.js`, `sim-harness/balance_test.js` |
| P3 | 클래스별 고유 결정 모달 | BLADE 표적/MOLE 위장 대상/HELIX 클론 사용처를 인간 한정 선택으로, 만료 시 기존 휴리스틱 폴백(bloc_invest v6.8 패턴) | high | M | `simulator/v0.5/euro_module.js`, `simulator/v0.5/index.html` |
| P4 | 인물 표면화 | 플레이어 라벨 "RUST (BLADE)"·수장 병기, CARD_FLAVOR에 docs/04 명대사 이식, 이벤트 훅 대사 — 데이터 테이블 1개, 리듀서 무변경 | mid | S | `simulator/v0.5/index.html` |
| P5 | docs/03 블록 패시브 5종 차별 구현 | VANTA 📡+2/R, IRONWALL 방어 d6+1, HELIX 고용 -2, AXIOM 주가 ±1 선택, CARBON 자원 수입 +1. **기존 BLOC_DEFENSE와의 스택 정리 필수** (§5 X3) | high | M | `simulator/v0.5/index.html`, `simulator/v0.5/euro_module.js`, `docs/03-factions-blocs.md` |
| P6 | 범용 폴백에 클래스 게이트 | teleport/ignore_all은 DRIFTER 사용 시 실제 이동 +2, mimic은 CIPHER 사용 시 실복제, frame은 MOLE 전용 수배 전가 — 폴백 블록에 specific 분기만 추가 | mid | M | `simulator/v0.5/index.html` |
| P7 | 3원장 정합화 감사 | DRIFTER 스탯 확정값 역반영, 덱 목록 정본 결정 후 동기화, 공용 카드 13종 문서화 | mid | L | `docs/04`, `docs/07`, `cards/ghost/rigger.md`·`mole.md`·`drifter.md`, `simulator/v0.5/index.html`, `sim-harness/core.js` |
| P8 | balance_test에 "개성 지표" | 시그니처 유/무 A-B 승률 델타(±3pt 미만 경고), 클래스별 자원 프로필 분산 — veil/garrison류 "발동하되 무효인 死문" 회귀 방지 | mid | M | `sim-harness/balance_test.js`, `sim-harness/euro_mechanics.js` |

---

## 3. 카드 시스템

### 3.1 현황

웹(v6.11.2)은 Ghost 6클래스×10장(`index.html:616~698`), Bloc 5블록×(전용 6+공통 13)=19장(`:701~763`), 뉴스 40종(`:772~828` — README의 "35종" 표기는 stale)을 구현. Ghost 턴당 2장 TOP/BOT 반쪽 선택(`:3263~3288`), Bloc MAIN/SIDE 2장(`:3289~3307`)으로 docs/05 v0.3의 골격은 살아 있다. BOT/MAIN 비용은 개인 속성 풀 지불, 부족 시 카드만 소모되고 효과 불발(`:3396~3405`). [LOSS]는 lost 더미로 영구 소각(`:3283~3287`), 손패는 매R 6장 자동 리필+재셔플(`:2646~2665`). 반면 상처/스캔들 덱 오염, Short/Long Rest·소진, 콤보(⊕) 엔진, 덱 성장/가지치기, 퀘스트·블랙마켓 실덱은 전부 미구현이고, 다수 카드 효과가 ★/₵ 정액 폴백(v0.5.10, `:3793~`)으로 치환된 상태다.

### 3.2 강점

- **듀얼 카드 아키텍처의 핵심이 실구현** — TOP/BOT·MAIN/SIDE 반쪽 선택, 기본값 1번=top·2번=bot, UI 클릭 전환 (`index.html:3263~3307, 6286~6355`).
- **"비용 부족 시 카드만 소모" 규칙**(`:3396~3405`)이 계획 단계에 실질 리스크를 만듦 — 문서에 없는 긴장 장치를 구현이 오히려 추가.
- **[LOSS] 영구 제거가 실압박** — 재셔플 대상 아님(`:2655~2657`), 히든 목표 G-R04(`:839`)와 AI의 저HP LOSS 회피(`:5042~5046`)로 사용/보존 딜레마 설계.
- **뉴스 40종이 8개 축으로 정리**되어 확장 용이 — v0.5.11 Ghost 호재 5종처럼 진영 밸런스 레버로 이미 활용 중.
- **폴백 보상 체계(v0.5.10)가 "죽은 카드"를 제거** — 모든 반쪽이 최소한의 가치를 지님 (BROKER/CIPHER/MOLE 언더파워 해소 이력).
- **이니셔티브 규칙이 docs/05 §3 그대로 구현** (`:2844~2849, :3247~3256`).

### 3.3 갭

1. **상처·스캔들 덱 오염 전면 미구현.** docs/05 §1.7(HP 50% 이하 상처 삽입)·§2.7(스캔들)의 핵심 긴장 메커니즘 부재. 스캔들은 즉발 "주가-3·★+4"로 치환, ZERO_RECORD(remove_scandals:99)는 제거할 대상이 없어 "★+2 정액"으로 퇴화한 죽은 플래그십(TL4·게임 1회).
   **근거**: `index.html` 'wound/상처' 검색 0건, `:4489~4499`(스캔들 즉발), `:4230~4236`(폴백) vs `docs/05-card-system.md` §1.7·§2.7
2. **휴식·소진 시스템 부재.** Short Rest(랜덤 1장 영구 파기)·Long Rest·소진(2장 미만) 규칙이 없고 매R 자동 재셔플 리필로 "카드=체력" 압박 소멸. 대신 LOSS 소각이 문서보다 가혹(복구 불가)해져 균형이 어긋남.
   **근거**: `index.html:2646~2665`; 'Rest' 검색은 UI 문구 `:6864` 1건뿐 vs docs/05 §1.5~1.6
3. **LOSS 소각이 반쪽 무관 발동.** TOP만 사용해도 소각 — 문서는 BOTTOM [LOSS] 사용 시에만. 이 차이로 LOSS 카드 6종의 TOP 반쪽이 사실상 사용 불가.
   **근거**: `index.html:3283~3287`(halves 확인 없이 `c?.loss`면 lost) vs docs/05 §1.2 카드 해부도
4. **TOP/BOT 한쪽 완전 우월 사례.** ① ICE_BREAK — bot(비용 M M)과 top(무료)의 폴백 보상이 동일해 top 완전 우월. ② QUICK_DRAW bot(spd:3)은 effect.spd 핸들러 부재로 no-op인데 비용 지불 — bot 완전 열등. ③ 레이드 판정이 카드 atk 수치를 무시(stats.atk만 사용)해 DATA_SPIKE bot(atk5·3속성+소각) 대신 top(atk1·무료)으로 동일 레이드 성립.
   **근거**: `index.html:4645~4651`, `:630`(spd:3, 핸들러 0건), `:3702~3707`(`raidTotal = raidRoll + stats.atk`)
5. **문서–구현 수치·효과 괴리 (대표 3종).** QUICK_DRAW 반쪽 뒤바뀜(문서 TOP=SPD+2/BOT=ATK+3 ↔ 구현 top=atk3/bot=spd3), BERSERKER bot 비용 "HP 3"→['A','A'], LAST_STAND 문서 BOT 효과가 구현 top으로 이동, LEVERAGE 효과 자체 상이(강제 징수 ↔ cancel_card), DATA_WIPE(퀘스트 파기 ↔ clear_ghost_wanted), VEIL_DEPLOY ₵3 추가 비용 누락. **Bloc 덱 크기가 4곳에서 전부 다름**(docs/05 "16장" / vanta.md "9장" / 구현 19장 / docs/05 §2.1 "12장").
   **근거**: `cards/ghost/blade.md:29~44·155~189`, `cards/bloc/vanta.md:41~61·110~129` vs `index.html:630, 637~638, 704~707, 755`(주석 "10장", 실제 13장)
6. **콤보(⊕) 엔진 부재.** BLOC_CARDS 중 3장에만 combo 데이터, 실행 코드 0건 — docs/05 §2.3 "플레이 방식 3종" 중 1종이 통째로 죽어 있음.
   **근거**: `index.html:703~751`(combo 필드), `.combo` 사용처 grep 0건
7. **뉴스가 덱이 아니라 복원추출.** 문서의 "셔플→하단 재순환" 대신 매R `rand(NEWS)` — 연속 중복 가능, "예언자 출현"류 덱 조작 카드가 구조적으로 구현 불가. 40종 전부 즉발 효과라 지속(3R)·조건부·덱 오염(023/048)·폐허 전환(047) 유형 부재.
   **근거**: `index.html:2712~2713` vs `cards/events/news-events.md:246~261`
8. **뉴스와 v6.x 신규 시스템의 상호작용 0장.** equity/suppression/mna 계열 효과 키 0건 — M&A가 봇 플레이에서 완전 휴면(32판 선언 0회, CHANGELOG 기록)인 상황에서 뉴스가 촉매 역할을 전혀 못함.
   **근거**: `index.html:772~828`, `CHANGELOG.md [Unreleased]` "핵심 발견 ①"
9. **카드 플레이와 시그니처 게이지의 단절.** TRAP_WIRE가 rigTraps 카운터에 미기여, ICE_BREAK/PORT_SCAN이 hackNodes에 미기여, NETWORK/BACK_DEAL이 BROKER 메모에 미기여 — 시그니처는 전부 라운드 자동 진행.
   **근거**: `index.html:3958~3968` vs `euro_module.js:221~225, 363~378, 385~409`

### 3.4 개선 제안

| # | 제안 | 요지 | Impact | Effort | 대상 파일 |
|---|---|---|---|---|---|
| K1 | 덱 오염 최소 구현 (상처·스캔들 실카드화) | WOUND(HP≤50% 시 discard 삽입, 상점 치료로 제거)·SCANDAL(레이드 피격/뉴스 삽입, PR 액션·ZERO_RECORD로 제거) — 죽은 텍스트 6곳 동시 부활, docs/05 §1.7/§2.7 정합. **C4(applyDamage) 선행 필요** (§5 X4) | high | M | `simulator/v0.5/index.html`, `docs/05-card-system.md` |
| K2 | LOSS 소각 BOT 한정 + 레이드에 카드 atk 반영 | `:3283` 분기를 `halves==='bot' && c.loss`로, `:3707`에 effect.atk 가산(임계 재튜닝, harness 동시 수정) — 두 수정 모두 승률 재측정 필요 | high | S | `simulator/v0.5/index.html`, `sim-harness/core.js` |
| K3 | TOP/BOT 도미넌스 5종 리밸런스 | ICE_BREAK bot 수치 비례 보상, QUICK_DRAW 반쪽 원복 또는 spd 핸들러 신설, LAST_STAND 분리, POINT_BLANK atk 키 통일, BASIC_MOVE swap 실구현 | mid | S | `simulator/v0.5/index.html`, `cards/ghost/blade.md` |
| K4 | 뉴스 rand→셔플 덱 순환 + 15종 확장 | M&A 축 4(감독 위원회·매수 규제 완화·백기사 펀드·독점 심사) + 견제 축 3 + 사회 축 4(문서 이식) + 사건 축 4 — 부족한 "Ghost 악재"·"중립 대사건" 보충, 휴면 M&A 촉매 | high | M | `simulator/v0.5/index.html`, `cards/events/news-events.md`, `simulator/v0.5/README.md` |
| K5 | 클래스 카드→시그니처 게이지 훅 6건 | TRAP_WIRE→rigTraps, ICE_BREAK/PORT_SCAN→hackNodes, NETWORK/BACK_DEAL→메모, CONTRACT_KILL×BLADE 표적 렙 2배, DISGUISE→위장 재선택, ID_COLLAPSE 실복제 — "내 카드 선택이 필살기를 당긴다" (§5 X8: P3과 통합 설계) | mid | M | `simulator/v0.5/index.html`, `simulator/v0.5/euro_module.js` |
| K6 | 콤보 엔진 실장 또는 필드 삭제 + 수치 정합화 | combo.with 일치 시 추가 효과(데이터 3장뿐이라 리스크 최소) 또는 필드 삭제. 병행: Bloc 덱 크기 단일화, README "뉴스 35종"→40, stale 주석 정리 | low | S | `simulator/v0.5/index.html`, `docs/05-card-system.md`, `cards/bloc/vanta.md`, `simulator/v0.5/README.md` |

---

## 4. 스토리·세계관

### 4.1 현황

세계관(docs/01: 2091 Ashgrid, 5 Bloc/Ghost, Mesh·Splice·Nexus 평의회)과 레거시 8챕터(ASH & SIGNAL, 봉투 A~H·4엔딩·기여 트랙)는 문서로는 완결적. 각 챕터는 오프닝 내러티브·봉투 내용물·영구/임시 효과·선택·다음 챕터 힌트의 동일 골격 + "도시가 N번째로 깨달은 사실" 리프레인으로 2091-03→2092-06 연대기적 에스컬레이션을 이룬다. 웹은 스토리 채널로 뉴스 flavor(40종 전원 flavor 보유 — 교차 감사 실측, "35종"은 README stale 수치), 카드 flavor 약 90종, 하이라이트 13종, NEXUS 컨트롤 룰 5종을 보유하나, 레거시 캠페인·SIGNAL·평의회·수장 5인은 전무하고 셋업/튜토리얼/승리 화면은 순수 기계적. signalDie(메시 상태 4종)는 매R 굴려 표시만 하고 효과 0. 저작권 안전 원칙은 코어 문서에선 지켜지나 v1.0+ 추가분과 achievements 등에 금지어 위반이 잔존한다.

### 4.2 강점

- **8챕터 에스컬레이션 아크가 구조적으로 견고** — 외부(레이드)→내부(M&A)→국가(계엄)→신체(스플라이스)→정신(메시)→체제(흡수)→중심(넥서스)→수렴(제로데이)으로 층위 상승, 챕터 말미 힌트가 다음 해금을 서사적으로 예고.
- **리프레인·연대기가 캠페인에 일관된 목소리 부여** — 오프닝 내러티브 품질이 높음(ch3 계엄 방송의 어긋난 입, ch6 기억 시술 콜센터).
- **해금 조건이 서로 다른 게임 시스템에 1:1 대응** — 플레이 스타일이 개봉 순서를 결정하는 레거시다운 설계.
- **웹 flavor 문체가 통일된 하드보일드 단문**으로 실제 UI에 표시됨 — 이미 작동하는 스토리 채널.
- **NEXUS 컨트롤 룰 5종**(`index.html:1292~1298`) — 블록 정체성을 글로벌 룰로 번역한 테마-메커닉 결합.
- **뉴스가 docs/01 "게임 시작 시점 상황"을 실반영** (CARBON 정전, VANTA 베일 스캔들, AXIOM 규제 법안) — 세계관과 이벤트 덱의 접지.
- **저작권 방어 장치 자체가 존재** — docs/13 구 용어 대조표(15항목), 코어 문서는 독자 용어(Bloc/Ghost/Mesh/Veil/Splice/Ashgrid) 일관 사용.

### 4.3 갭

1. **챕터 5 해금이 사실상 CIPHER 존재에 종속.** 대체 조건 "메시 노드 3개 침입"의 메시 노드는 챕터 5 봉투가 처음 공개하는 구성물(닭-달걀), 기본 룰의 메시 진입도 CIPHER 전용 — CIPHER 없는 그룹은 캠페인 표제 장치 SIGNAL을 영구히 못 만날 수 있는 구조적 리스크.
   **근거**: `cards/legacy/chapter-05-mesh-ghost.md:6` + `docs/02-core-rules.md:275`
2. **비순차 개봉 vs 챕터 의존.** ch7 오프닝("하나는 흡수됐고"), SIGNAL'S CHOSEN, ch8 엔딩3 조건 "SIGNAL 우호도 5+"가 SIGNAL 미도입 캠페인에서 공중에 뜸. "SIGNAL 우호도"는 ch5 어디에도 축적 방법이 정의되지 않은 유령 수치.
   **근거**: `cards/legacy/chapter-08-zero-day.md:69`; chapter-05 상호작용 규칙에 우호도 트랙 부재
3. **엔딩 3 조건 문서 간 모순.** docs/12 "5대 블록 모두 생존" vs 챕터 8 "3개 이상 블록 생존" — 챕터 6(블록 1곳 완전 흡수)을 거친 캠페인에서 docs/12 조건은 달성 불가. VOSS 혈연 공개 챕터도 docs/03·13은 "챕터 5", 실제 VOSS DOSSIER는 챕터 6.
   **근거**: `docs/12-legacy-campaign.md:203` vs `chapter-08-zero-day.md:69`; `docs/03-factions-blocs.md:255`·`docs/13-glossary.md:308` vs `chapter-06-bloc-acquisition.md:55`
4. **죽은 설정 다수.** SIGNAL(캠페인 표제인데 glossary 미등재·웹 0회), Mindloop(대조표 1회가 전부), 비통제구역(웹 0회), 사이버사이코시스(ch4 전용, 웹 cyberware엔 폭주 없음), 코어텍스 와이어·Nexus 평의회·계급 6단계(게임플레이 부재), 블록 수장 5인(웹 0회).
   **근거**: grep 검증 — SIGNAL은 docs/12+chapter 05~08+docs/10:492에만 존재, `docs/13-glossary.md` 미등재; simulator/v0.5 3개 파일에서 '비통제/코어텍스/사이코시스/평의회/VOSS' 전부 0건
5. **signalDie는 순수 장식 + "시그널" 명칭 3중 충돌.** docs/01:110~118의 상태별 효과 미구현. 동시에 "시그널"이 ①이 다이 ②NPC 정보 공개 시스템(SIGNAL_INVEST) ③캠페인 AI 개체로 3중 충돌.
   **근거**: `index.html:872~878`(rollSignalDie)·`:6649~6650`(표시), 분기 효과 코드 0건; `:1164~1184`(NPC 시그널 시스템)
6. **시작·종료 프레임에 서사 0.** 승리 화면은 "VICTORY/DEFEAT + 기계적 winReason"뿐 — 4엔딩 세계관과 단절. 튜토리얼 8스텝도 세계관 단어를 한 번도 쓰지 않음.
   **근거**: `index.html:5543~5594`, `tutorial_module.js:82~151`
7. **저작권 잔존 — 대표 5건 + 범위 확대 필요.** ①meta.md "나이트 시티" ②R&D 트랙 UI desc의 "솔로/킬러·노매드·넷러너·픽서 라이프패스"(UI 실노출) ③"거리명성(Street Cred)" 병기·"Cyberpunk RPG" 주석 ④Cyberware 시스템명 재사용(docs/17·18·README) ⑤ICE→Veil 치환 후 ICE_BREAK 잔존. 교차 감사 결과 실제 범위는 이보다 넓다: `docs/02-core-rules.md:12`, CHANGELOG, print-kit(`12-quick-reference.html` "픽서", `06-character-sheets.html` Street Cred)까지 — **일소 패스의 실규모는 M이 아니라 L급**.
   **근거**: `cards/achievements/meta.md:171`; `index.html:1003~1010`(L5921 tn.desc로 UI 노출); `docs/17-v1.0-systems.md:24`; `index.html:740`
8. **시그니처·M&A 로그가 기계 문구 위주.** ch2/ch6의 강한 flavor 소스(이사회 옆방, 기억 시술, ACQUIRED)가 웹 M&A 완주(v6.10)에 미이식. 표본 서사(docs/19)도 수치 나열형.
   **근거**: `euro_module.js:1133` vs `chapter-06-bloc-acquisition.md:20`
9. **공권력 트랙 cap 충돌 예정 지점.** ch1이 최대치 10→11, ch3이 12로 상향하지만 기본 룰·웹 모두 cap 10 고정 — 웹 레거시 연동 시 하드코딩 충돌.
   **근거**: `chapter-01-first-blood.md:69`·`chapter-03-martial-night.md:74` vs `index.html:2052` 등 `Math.min(10, …)` 다수

### 4.4 개선 제안

| # | 제안 | 요지 | Impact | Effort | 대상 파일 |
|---|---|---|---|---|---|
| S1 | 4엔딩 에필로그 주입 | winReason을 챕터 8 4엔딩 톤에 매핑, VICTORY/DEFEAT 아래 2~3문장 + 승자 클래스 "마지막 대사"(CARD_FLAVOR 재사용) — 로직은 문자열 분기 하나 | high | S | `simulator/v0.5/index.html`, `cards/legacy/chapter-08-zero-day.md` |
| S2 | 라운드 시작 내레이션 1줄 | signalDie·heat·round 조합 템플릿을 news-box 위에 표시 — 효과 없는 signalDie에 처음으로 서사적 역할 | high | S | `simulator/v0.5/index.html` |
| S3 | SIGNAL 뉴스 이벤트 2~3종 | "[SIGNAL] HELLO AGAIN." 계열, 기존 effect 스키마 재사용, flavor는 ch5 인용 — 캠페인 표제 장치의 웹 최초 노출 | mid | S | `simulator/v0.5/index.html`, `cards/legacy/chapter-05-mesh-ghost.md` |
| S4 | 저작권 금지어 일소 + "시그널" 충돌 해소 | 나이트 시티→애시그리드, 트랙 desc 자체 클래스명 재작성, Street Cred/Cyberpunk 주석 삭제, ICE_BREAK→VEIL_BREAK, Cyberware→Splice, NPC "시그널"→"정보망(intel)" 개명. 범위는 docs/02·CHANGELOG·print-kit까지 (실규모 L) | high | M~L | `cards/achievements/meta.md`, `simulator/v0.5/index.html`, `docs/02-core-rules.md`, `docs/17-v1.0-systems.md`, `docs/18-playtest-guide.md`, `simulator/v0.5/README.md`, `docs/13-glossary.md`, `print-kit/` |
| S5 | 레거시 정합성 패치 | ch5 비CIPHER 해금 경로 추가, SIGNAL 우호도 +1/-1 규칙 정의 + ch8 연결 + 미도입 캠페인용 대체 조건, docs/12 엔딩3 통일, VOSS 챕터 번호 정정 — 전부 문서 수정 | high | M | `cards/legacy/chapter-05-mesh-ghost.md`, `cards/legacy/chapter-08-zero-day.md`, `docs/12-legacy-campaign.md`, `docs/03-factions-blocs.md`, `docs/13-glossary.md` |
| S6 | 튜토리얼 welcome에 세계관 훅 2문장 | "2091년 애시그리드. 넥서스 평의회가 멈춘 지 3개월—" + 역할별 승리조건을 "기업의 논리/거리의 생존" 프레임으로 — 표시 레이어만 | mid | S | `simulator/v0.5/tutorial_module.js` |
| S7 | 시그니처·M&A 로그에 flavor 필드 | EURO_SIG_FLAVOR 사전 추가 (예: M&A 완료 "그 블록의 전 수장은 오늘 자신의 이름을 잊었다") — 로그 재열람 화면에서 "판의 이야기"가 자동으로 남음 | mid | S | `simulator/v0.5/euro_module.js`, `simulator/v0.5/index.html` |
| S8 | 죽은 설정 처분 — glossary 상태 태그 | docs/13에 핵심/레거시 전용/미사용 열 추가, SIGNAL·평의회·사이코시스 정식 등재, Mindloop 삭제 또는 뉴스 1건 회수, 비통제구역은 외곽 4출구 셀 툴팁 1줄로 부활 | low | M | `docs/13-glossary.md`, `simulator/v0.5/index.html`, `cards/events/news-events.md` |

---

## 5. 교차 일관성 발견

### 5.1 도메인 간 모순·충돌·중복·시너지 (10건)

| # | 유형 | 내용 | 관련 도메인 |
|---|---|---|---|
| X1 | **모순** | 카드 K2("레이드에 카드 atk 반영")와 전투 C2("atk 카드 우회 차단")가 같은 코드 경로(`index.html:3702~3736`)에 정반대 수술을 요구. 독립 구현 시 K2가 C2가 막으려는 100% 성공 익스플로잇을 증폭 → **atk 카드를 3단계 모달 레이드의 투자 보너스로 흡수하는 통합 설계 필요** | 전투·카드 |
| X2 | **중복/시너지** | veil·garrison 소비처 구현이 전투 C1과 클래스 P1에서 중복 — `core.js:1736` 공식 하나로 동시 해결. 단 인간 레이드 경로(`:1950~1961`)도 함께 패치해야 시그니처가 진짜 살아남 | 전투·클래스 |
| X3 | **충돌 위험** | 클래스 P5(블록 패시브 5종)가 기존 BLOC_DEFENSE 테이블(`index.html:987~993`)과 중첩 — 그대로 구현하면 IRONWALL 이중 방어 스택. C1(봇 threshold 정합)까지 겹치면 Bloc 방어 3중 강화 → Ghost 승률 급락 위험. **세 변경의 합산 밸런스를 N=600으로 재검증 필수** | 클래스·전투 |
| X4 | **순서 의존** | 카드 K1(덱 오염)은 전투 C4(applyDamage 헬퍼)가 선행돼야 함 — 상처 삽입 트리거(HP 50%)는 파편화된 5개 피해 경로를 단일 지점으로 모아야 정확히 발동. **전투→카드 순의 의존 사슬로 로드맵화** | 카드·전투 |
| X5 | **3중 충돌** | "시그널" 장치를 세 도메인이 서로 다른 방향으로 확장(C8 다이-전투 연결, S3 SIGNAL 뉴스, 뉴스에 signal_lock 효과 기존재) — **S4의 명칭 정리를 선행**하지 않으면 같은 단어가 4번째 의미를 획득 | 전투·스토리·카드 |
| X6 | **중복** | 문서-구현 정합화가 3개 도메인에 분산(P7 스탯·덱 목록 / K6 카드 수치·덱 크기 4원 / S5 레거시 모순 3건) — **단일 "정본 감사" 과제로 통합**하지 않으면 같은 파일을 세 번 고침 | 클래스·카드·스토리 |
| X7 | **시너지** | ICE_BREAK가 두 도메인의 수술 대상(S4 저작권 리네이밍 + K3 top 우월 리밸런스) — 한 커밋으로 처리 가능 | 스토리·카드 |
| X8 | **시너지** | K5(카드→게이지 훅)와 P3(클래스 결정 모달)은 같은 목표 — 함께 설계하면 "카드 선택→게이지 축적→모달 발동"의 단일 개성 루프. 별도 구현 시 반쪽짜리 시스템 2개 | 카드·클래스 |
| X9 | **데이터 불일치** | 스토리 연구 "뉴스 flavor 35종" vs 카드 연구 "40종" — 실측 결과 **NEWS 40종 전원 flavor 보유**. 35는 README:214의 stale 수치 답습 | 스토리·카드 |
| X10 | **harness 마일스톤 충돌** | C9(3단계 레이드 이식) + P8(개성 지표) + K4(뉴스 rand→덱)가 모두 sim-harness 개조 — 특히 뉴스 덱화는 rand 호출 순서를 바꿔 시드 재현성·N=600 기준선을 무효화 → **하나의 harness 마일스톤으로 묶어 기준선 재측정을 1회로** | 전투·클래스·카드 |

### 5.2 이번 연구가 다루지 못한 공백 (후속 연구 대상)

- **경제 엔진 감사 부재** — 주가 시스템(docs/08) 루프 자체와 폴백 정액 보상(★/₵ 다수)의 인플레이션 효과 미정량. M&A는 "봇 휴면 32판"만 지적, 지분/float/백기사 경제 미검토.
- **맵·이동 시스템(docs/10) 공백** — 구역 타입별 가치 편차, 봉쇄/하이웨이, 5×5/11×11/13×13 스케일링, NEXUS 컨트롤 룰 실효성 미분석. 이동 도착이 레이드 자동 트리거(`index.html:3516~`)라는 점에서 전투와 직결.
- **봇 AI 품질 평가 부재** — 휴리스틱 점수표(`index.html:5017~5075`)는 존재하나 "봇이 재미있는 적수인가"(M&A 32판 미선언의 원인이 AI인지 게이트 설계인지) 미평가.
- **페이싱·승리 조건 감사 부재** — 자산/렙 도달 곡선, 조기 종료 가드(5R), 스노우볼 대 역전 가능성.
- **물리 킷(print-kit/) 정합 미감사** — 뉴스 수만 해도 print-kit 15장 / README 35 / 웹 40 / docs 50의 **4원 불일치**. 저작권 잔존도 print-kit에 존재.
- **캠페인 영속성 인프라 공백** — localStorage는 전적 50판 기록뿐(`index.html:1415~1424`), 중간 세이브·봉투 개봉 상태 저장 부재 — 스토리 도메인의 레거시 웹 연동 제안들이 전제하는 선행 과제.
- **퀘스트·블랙마켓(docs/11), 시나리오(docs/14), 업적 25종(docs/16), 히든 목표(docs/15) 감사 부재** — 히든 목표는 웹 구현(`:839~`)이 있어 실효성 검증 가능한데 누락.
- **코드 구조·버전 스프롤** — 단일 6993줄 index.html, 구버전 파일·패치 파일·스크립트 공존. 4개 연구가 발견한 死코드 다수(attackBonusOnce, once-ability, RESOLVE_RAID_YES, combo:{})의 근본 원인일 가능성 **(추정)** — 아키텍처 리스크로서 별도 검토 필요.

---

## 6. 우선순위 로드맵

> 원칙: P0은 "다음 사이클에 끝나는 소규모 수술 + P1의 선행 의존". 밸런스에 닿는 변경(C1·K2·P5)은 반드시 harness/sim-e2e 재측정을 동반한다.

### P0 — 다음 사이클 (핵심 긴장 복원 + 표시 신뢰)

| # | 항목 | 내용 | 대상 파일 |
|---|---|---|---|
| P0-1 | **레이드 판정 단일화 + Bloc 방어 실효화** (C1+C2+P1 통합, X1·X2 반영) | 봇/카드 threshold를 `5+fortified+garrison+veil`로 정합(인간 경로 `:1950~1961` 동시 패치), atk 카드는 인간에게 3단계 모달로 라우팅하고 카드 atk를 모달 투자 보너스로 흡수. 死토큰(veil/garrison)·익스플로잇을 한 묶음 해결 | `simulator/v0.5/index.html`, `simulator/v0.5/euro_module.js` |
| P0-2 | **rtype.id 버그 수정** (C3) | 잠입형 security/협상형 party 트랙 보상 복구 | `simulator/v0.5/index.html` |
| P0-3 | **표시 정보 신뢰 회복 S 묶음** (C5+C10+K3②) | 성공률 3중 불일치 단일화, 허위 로그 제거(garrison "자동 반격"·attackBonusOnce "다음 판정 +N"), QUICK_DRAW bot no-op 해소 | `simulator/v0.5/index.html` |
| P0-4 | **applyDamage 통합 헬퍼 + HP0 STEP F** (C4) | 피해 경로 6곳 통합, HP0 시 30% 약탈+시작구역 리스폰 — P1 덱 오염의 선행 의존 | `simulator/v0.5/index.html` |
| P0-5 | **LOSS 소각 BOT 한정** (K2①) | `:3283`을 bot 반쪽 사용 시로 한정 — LOSS 6종 TOP 반쪽 부활, 문서 시맨틱 복원 | `simulator/v0.5/index.html` |
| P0-6 | **P0 합산 밸런스 재측정** (X3 가드) | C1(+BLOC_DEFENSE 기존 스택)로 Bloc 방어가 강화되므로 sim-e2e 20판+ 및 harness N=600으로 Ghost 승률 확인 | `sim-e2e/`(별도 작업 중 — 조율 필요), `sim-harness/balance_test.js` |

### P1 — 개성 루프·덱 오염·서사 표면화

| # | 항목 | 내용 | 대상 파일 |
|---|---|---|---|
| P1-1 | 상처·스캔들 덱 오염 실카드화 (K1, P0-4 후행) | WOUND/SCANDAL 실카드 삽입·제거 경로, ZERO_RECORD 정방향 복구 | `simulator/v0.5/index.html`, `docs/05-card-system.md` |
| P1-2 | 클래스 개성 선택화 루프 (P2+P3+K5, X8 통합) | DRIFTER "보급로" 시그니처, MOLE 위장 소비처, 카드→게이지 훅 6건, 클래스별 결정 모달을 단일 루프로 설계 | `simulator/v0.5/euro_module.js`, `simulator/v0.5/index.html`, `sim-harness/euro_mechanics.js` |
| P1-3 | 블록 패시브 5종 차별 구현 (P5, X3 스택 정리 포함) | BLOC_DEFENSE와의 중첩 정리 후 경제 패시브 구현 + N=600 재검증 | `simulator/v0.5/index.html`, `simulator/v0.5/euro_module.js`, `docs/03-factions-blocs.md` |
| P1-4 | 서사 표면화 S 묶음 (S1+S2+S6+S7+P4) | 4엔딩 에필로그, 라운드 내레이션, 튜토리얼 훅, 시그니처/M&A flavor, 인물(코드네임·수장·명대사) UI 주입 | `simulator/v0.5/index.html`, `simulator/v0.5/euro_module.js`, `simulator/v0.5/tutorial_module.js` |
| P1-5 | 저작권 일소 패스 + "시그널" 명칭 정리 (S4, X5 선행 조건) | 범위를 docs/02·CHANGELOG·print-kit까지 확대(실규모 L), NPC "시그널"→"정보망" 개명 후에야 C8/S3의 시그널 확장 착수 | `cards/achievements/meta.md`, `simulator/v0.5/index.html`, `docs/02-core-rules.md`, `docs/17-v1.0-systems.md`, `docs/18-playtest-guide.md`, `docs/13-glossary.md`, `print-kit/`, `simulator/v0.5/README.md` |
| P1-6 | 뉴스 덱 순환 + 15종 확장 (K4, X10 harness 마일스톤과 조율) | rand→셔플 덱, M&A 촉매·견제·사회·사건 4축 15종 — 휴면 M&A의 촉매 | `simulator/v0.5/index.html`, `cards/events/news-events.md`, `simulator/v0.5/README.md` |

### P2 — 정본·harness·레거시·확장

| # | 항목 | 내용 | 대상 파일 |
|---|---|---|---|
| P2-1 | 정본(source of truth) 통합 감사 (P7+K6+X6+X9) | DRIFTER 스탯 3원장, 덱 목록·덱 크기 4원, 뉴스 수 4원(print-kit 포함), stale 주석 일괄 정리 | `docs/04`, `docs/05`, `docs/07`, `cards/ghost/*.md`, `cards/bloc/vanta.md`, `simulator/v0.5/index.html`, `sim-harness/core.js`, `print-kit/`, `simulator/v0.5/README.md` |
| P2-2 | harness 마일스톤 (C9+P8+K4 harness분, X10) | 3단계 레이드 이식 + 개성 지표(시그니처 유/무 델타) + 뉴스 덱화를 한 번에 적용하고 기준선 재측정 1회 | `sim-harness/euro_mechanics.js`, `sim-harness/balance_test.js`, `sim-harness/core.js` |
| P2-3 | 레거시 정합성 패치 (S5) | ch5 비CIPHER 해금, SIGNAL 우호도 정의, 엔딩3 조건 통일, VOSS 챕터 정정, 공권력 cap 확장 여지(`Math.min(10,…)` 하드코딩) 검토 | `cards/legacy/chapter-05·08`, `docs/12`, `docs/03`, `docs/13`, `simulator/v0.5/index.html` |
| P2-4 | 시그널 다이 실효화 (C8+S3, P1-5 후행) | BLACKOUT hack 잠금·SURGE 크리 확대 + SIGNAL 뉴스 2~3종 | `simulator/v0.5/index.html`, `cards/legacy/chapter-05-mesh-ghost.md` |
| P2-5 | 전투 심화 (C6+C7) | 死 once-ability 3종 구현, 듀얼 대칭화+투자축 | `simulator/v0.5/index.html` |
| P2-6 | 콤보 엔진 실장/삭제 결정 (K6) + 죽은 설정 처분 (S8) | combo 3장 실장 또는 필드 삭제; glossary 상태 태그·SIGNAL 등재·비통제구역 툴팁 | `simulator/v0.5/index.html`, `docs/05`, `docs/13`, `cards/events/news-events.md` |
| P2-7 | 후속 연구 4건 발주 | 경제 엔진·맵/이동·봇 AI 품질·페이싱 감사 + 캠페인 영속성(세이브) 인프라 설계 — §5.2 공백 해소 | (연구 과제 — `docs/`) |

---

## 7. 부록: 근거 파일 맵

| 파일 | 이 보고서에서의 역할 (주요 참조 지점) |
|---|---|
| `simulator/v0.5/index.html` | 웹 본체 (~6993줄). 레이드: `:868, :909~968, :1979~1991, :3534, :3702~3736, :5601~5763` / 듀얼: `:2224~2229, :3492~3499` / HP·재생: `:2616, :3688, :4144` / 카드: `:616~763, :3263~3307, :3396~3405, :4343~4620` / 뉴스: `:772~828, :2712~2713` / BLOC_DEFENSE: `:987~993` / 死장치: `:1104~1110, :1218, :2149~2158` / 표시: `:5620~5631, :6219` / AI: `:5017~5075` / 트랙 desc(저작권): `:1003~1010` |
| `simulator/v0.5/euro_module.js` | 시그니처 13종·견제·결정 모달·M&A. 시그니처: `:198~211, :325~500`(veil `:446`, garrison `:464`, disguise `:428`) / 모달 resolve: `:746~753` / M&A 로그: `:1133` |
| `simulator/v0.5/tutorial_module.js` | 튜토리얼 8스텝 (`:82~151`) — 세계관 단어 0 |
| `sim-harness/core.js` | 헤드리스 정본 대조. threshold 공식: `:1736, :1881` / raidBonus: `:442` / DRIFTER 스탯: `:64` / disguiseBloc: `:699, :2552~2557` / legacy 인간 경로: `:846~870` |
| `sim-harness/balance_test.js`, `euro_mechanics.js` | N=600 측정 도구 — 3단계 레이드·개성 지표 부재 (P2-2) |
| `docs/03-factions-blocs.md` | 블록 패시브 표(`:18~24`)·테크트리·수장 5인·VOSS 챕터 표기(`:255`) |
| `docs/04-characters-ghosts.md` | 코드네임 6인·특기(`:94, :174~176, :217, :256~258`)·관계 매트릭스(`:277~303`) |
| `docs/05-card-system.md` | TOP/BOT 해부도·휴식/소진(§1.5~1.6)·덱 오염(§1.7/§2.7)·콤보(§2.3)·덱 크기 표기 |
| `docs/07-combat-stats.md` | STEP B~F 전투 절차·DRIFTER 스탯(`:47`) |
| `docs/12-legacy-campaign.md` | 4엔딩·기여 트랙 — 엔딩3 조건(`:203`) 모순 |
| `docs/13-glossary.md` | 구 용어 대조표 15항목 — SIGNAL 미등재, VOSS 표기(`:308`) |
| `cards/ghost/*.md`, `cards/bloc/vanta.md` | 인쇄 카드 정본 — 웹 덱과 4장 상이, 덱 크기 표기 상이 |
| `cards/events/news-events.md` | 뉴스 50종 원장 — 덱 순환 규칙(`:246~261`), 미이식 유형(지속·조건부·오염·폐허) |
| `cards/legacy/chapter-01~08` | 8챕터 봉투 — 해금 조건(ch5 `:6`), 엔딩 조건(ch8 `:69`), 공권력 cap(ch1 `:69`, ch3 `:74`) |
| `cards/achievements/meta.md` | 저작권 잔존(`:171` "나이트 시티") |
| `CHANGELOG.md` | 측정치 원장 — M&A 봇 휴면 32판(`[Unreleased]`), RIGGER/HELIX 소생 이력(`:139~142, :169`) |
| `print-kit/` | 물리 킷 — 뉴스 15장·저작권 잔존(§5.2, 미감사 영역) |

---

*이 문서는 2026-07-14 4도메인 병렬 연구 + 교차 감사의 종합본이다. 갭 항목의 라인 번호는 v6.11.2 시점 기준이며, 코드 수정 후에는 어긋날 수 있다. 밸런스에 닿는 모든 제안(C1·K2·P5·K4)은 X3·X10 가드에 따라 합산 재측정을 동반해야 한다.*
