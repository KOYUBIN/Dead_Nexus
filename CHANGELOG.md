# CHANGELOG

DEAD NEXUS 프로젝트의 모든 주요 변경사항을 기록합니다.  
형식: [Keep a Changelog](https://keepachangelog.com/)  
버전 체계: [Semantic Versioning](https://semver.org/) 준용

---

## [Unreleased] — 작업 중

---

## [1.1] — 5×5 폭주 너프 + Cyberware + Flavor text (2026-04-29)

### v1.1.1 — 5×5 BLADE/MOLE 폭주 너프
- mini-raid 발동률 5×5 한정 너프: MOLE 50%→33%, BLADE/CIPHER/RIGGER 100%→50%
- execute (BLADE) 평판 보상 5×5 한정 ★+5 → ★+3
- 5×5 평판 임계 +5 (battle 37→42 / alone 55→60)
- 결과 (200판): BLADE 70.6→47%, MOLE 68.8→43%, 11×11 균형 유지

### v1.1.2 — Cyberware 슬롯 시스템 (RPG식 캐릭터 발전)
- `CYBERWARE_DEFS` 6종: reflex_booster / iron_skin / ocular_implant / neural_jack / myomer_legs / mood_chip
- 각 임플란트 = pro (영구 보너스) + con (단점) + cost (자원)
- 슬롯 최대 3개, R&D 페이즈 R3·R6에 자동 1개씩 장착 (게임당 2개)
- 클래스별 추천 매핑 (BLADE→reflex_booster, IRONWALL→iron_skin 등)
- player.cyberware[] 배열, applyCyberware() 헬퍼, install_ware 효과 키
- UI: 플레이어 카드에 청록 임플란트 토큰 (hover로 효과/단점 표시)
- 결과: P0 승률 9% → 21% (인간이 사이버웨어로 더 많이 승리)

### v1.1.3 — 카드 flavor text (몰입감)
- 60+ Ghost 카드에 1줄 flavor text 추가 (CARD_FLAVOR)
- "포트 0번. 거기 항상 누가 있어" / "먼저 쏘는 자가 마지막 말을 한다" 등 캐릭터 톤
- UI: 카드 제목 아래 마젠타 이탤릭 1줄로 표시

### 검증 (200판 시뮬)
- **5×5 튜토리얼**: 평균 5.84R, Ghost 114/Bloc 86, BLADE 41% / MOLE 43%
- **11×11 정식**: 평균 6.80R, Ghost 57/Bloc 43, P0 11~21%

---

### Planned
- 5×5 BLADE/MOLE 폭주 너프 (소규모 보드 mini-raid 빈도)
- 사람용 협상 UI 모달 (자유 거래 제안/수락)
- Cyberware 슬롯 시스템 (RPG식 character 발전)
- 캠페인 시나리오 간 영구 변화 누적
- 사람 플레이테스트 1회 (솔로 normal + 핫시트 3인)

---

## [1.0] — 트랙 사이버펑크 리네이밍 + 솔로/핫시트 모드 + 룰북·프린트킷 갱신 (2026-04-28)

### v1.0.0 — 트랙 사이버펑크 정체성 (악명형 → DEAD NEXUS)
사용자 피드백: 기존 트랙명(무력/수송/제조/파티/경호 + 악명)이 악명형와 동일.
사이버펑크 RPG/Ashgrid 2091 분위기로 전면 리네이밍:

| 내부 키 | 기존 | 신규 (v1.0) | 라이프패스 | 아이콘 |
|---|---|---|---|---|
| combat | 무력 | **화력 (Firepower)** | Solo/킬러 | 💥 |
| transport | 수송 | **그리드런 (Grid Run)** | Nomad | 🌃 |
| mfg | 제조 | **코드 (Code)** | 해커/제작자 | 💾 |
| party | 파티 | **인맥 (Network)** | Fixer | 🤝 |
| security | 경호 | **그림자 (Shadow)** | 첩보 | 🎭 |

**총합 지표 변경**: 악명 → **거리명성 (Street Cred)** — Cyberpunk RPG 핵심 용어 차용.
- 모든 로그/UI/모달 라벨 일괄 갱신
- HIGHLIGHT_DEFS / 마일스톤 메시지 / RAID_TYPES desc 동기화
- 내부 키(`combat`/`transport`/`mfg`/`party`/`security`)는 호환성 유지

### v1.0.1 — 솔로 모드 (1인 플레이)
- SetupScreen 신규: **모드 선택** (솔로 / 핫시트), **난이도** (easy/normal/hard, 솔로 한정)
- 난이도 보정:
  - **easy**: 인간 시작 자원 ₵+5 무기/부품/데이터+1 / Bloc 자동확장 50%
  - **normal**: 표준 (5×5 100% / 11×11 75%)
  - **hard**: 봇 시작 자원 ₵+5 무기+1 / Bloc 자동확장 100%

### v1.0.2 — 멀티-휴먼 핫시트 모드 (2~5인)
- 한 기기에서 2~5명 차례 플레이
- SetupScreen에서 인간 P1~P5 역할/클래스 개별 지정 (인간 추가/제거 버튼)
- 빈 자리는 봇 자동 보충 (4인 기준 균형)
- **PASS THE DEVICE 가림막**: Plan phase에서 활성 인간 변경 시 자동 표시 (이전 인간 손패 가림)
- 신규 액션 `NEXT_HUMAN`: Plan 확정 후 다음 인간으로 자동 전환
- `state.meta.activePlayer` — 현재 차례 인간 인덱스 트래킹
- GameScreen `meIdx = state.meta.activePlayer` (멀티) / 0 (솔로)

### v1.0.3 — 룰북 docs 업데이트
- **신규** `docs/17-v1.0-systems.md` — v0.6~v1.0 시스템 통합 정리
  - 5트랙·거리명성·마일스톤
  - 협상 시스템 (3종 거래)
  - NEXUS 동적 컨트롤 (5 Bloc별 룰)
  - 시그널 점진 공개 / 건물 / 하이라이트 / mini-raid / Bloc 능동 / 방어 비용
  - 5×5 vs 11×11 비교표
  - 게임 모드 (솔로/핫시트/봇 시뮬)
- `docs/00-overview.md` — v1.0 시스템 doc 링크 추가
- `docs/02-core-rules.md` — v1.0 신규 시스템 11개 요약 + 임계값 갱신

### v1.0.4 — print-kit 업데이트
- **신규** `print-kit/06-character-sheets.html` 추가 시트 2매:
  - **v1.0 STREET CRED 시트**: 5트랙 LV 0~5 체크박스 + 거리명성 총합 + 마일스톤 6/12/18 + truce 약속 박스 3개 + 하이라이트 12 토큰 그리드
  - **v1.0 NEXUS · 협상 참조 시트**: NEXUS 룰 5종 표 / 협상 거래 3종 / Bloc 능동 액션 카드 3종
- **신규** `print-kit/01b-map-11x11.html` — 121 셀 정식 맵 (A3 권장, JS 자동 렌더, zone 색 + Bloc HQ + Ghost 시작 + NEXUS 룰 표 + zone 범례 12종)
- `print-kit/index.html` 갱신 — 11×11 맵 + v1.0 시트 항목 추가

### 검증 (200판 시뮬)
- **5×5 튜토리얼**: 평균 5.54R, Ghost 128/Bloc 72, P0 33%/5%
- **11×11 정식**: 평균 7.23R (5~12R), Ghost 61/Bloc 39, P0 17%
- 무에러, 사이버펑크 리네이밍 완전 호환

---

## [0.9] — Above-the-Table 인터랙션 + 하이라이트 + NEXUS 동적 (2026-04-28)

보드게임 커뮤니티 트렌드 조사 결과 반영: **협상/약속, 기억할 만한 한 수, 동적 컨트롤 포인트**

### v0.9.1 — 하이라이트 모먼트 시스템
- `HIGHLIGHT_DEFS` — 12종 정의: 첫 NEXUS 도달/점령, 첫 raid 성공, 첫 잠입형, 첫 건물 파괴, 첫 mini-raid, 악명 18, 최후 저항, deathSave, CLONE_DECOY 부활, 현상금 명중, 10구역 점유
- `recordHighlight(state, key, playerIdx)` — 1회성, 평판 보상 +1~+5
- `meta.highlights[]` 기록
- 7개 트리거 hook 적용 (movement→NEXUS, raid 성공, infiltrate, 건물 파괴, mini-raid, last stand, deathSave, 마일스톤 18, clone revive)
- UI: 플레이어 카드에 노란 하이라이트 토큰 배지 (hover로 라벨/라운드 표시)

### v0.9.2 — 협상 페이즈 (Phase 1.5 NEGOTIATE)
- 신규 액션 `NEGOTIATE_PHASE` — Phase 1 직후 자동 발동
- 3종 거래: **자원 스왑** (credit↔weapons, data↔parts), **비공격 약속(truce)** (1R 유효), **BROKER 중개**
- 봇 AI: 거래 net-value 평가, canAfford 체크, 작은 음수 가치는 수락 (외교 가치)
- `meta.promises[]` — 약속 트래킹 (from/to/type/expiresR/status)
- **약속 위반 페널티**: truce 무시 raid 시 위반자 ★-2, 피해자 ★+2 (관계 트래킹)
- **약속 지킴 보상**: NEXT_ROUND에서 만료된 active truce → 양측 ★+1
- 하네스에 `NEGOTIATE_PHASE` 호출 추가

### v0.9.3 — BROKER 협상 특화 + NEXUS 동적 컨트롤
- BROKER 협상 시 매 R **★+1 ₵+1 + party 트랙** (클래스 정체성 회복)
- **`NEXUS_RULES`** — Bloc별 5종 글로벌 룰:
  - VANTA `info_open`: 모든 NPC 시그널 +1, 정찰 +1
  - IRONWALL `martial`: ATK +1, Ghost 전원 수배 +1/R
  - HELIX `biocode`: 모든 플레이어 HP +1/R
  - AXIOM `algo_market`: 데이터 +1/R, 주식 변동 ×2
  - CARBON `energy_grid`: 자사 구역 수입 +1 크레딧
- `getNexusController(state)` / `getActiveNexusRule(state)` 헬퍼
- NEXT_ROUND에서 NEXUS 룰 자동 적용 (라운드 시작)
- COLLECT_INCOME에 CARBON energy_grid 보너스
- UI: top-bar에 NEXUS 룰 활성 배지 (점유 Bloc 명 표시)

### 버그 수정
- `applyEffect` deathSave 핸들러의 `const ps` 재할당 에러 → `let psMut` 변수 도입

### 검증 (200판 5×5 + 100판 11×11)
- **11×11 정식**: Ghost 62 / Bloc 38, **평균 7.29R (5~12)** ✅ 무에러
- **5×5 튜토리얼**: Ghost 127 / Bloc 73, 평균 5.42R, MOLE 81% 폭주 (다음 사이클 과제)

### 게임성 임팩트
- 협상으로 *사이드 게임* 발생 → "이번 R 너 안 치면" 같은 미니 외교
- 하이라이트 토큰으로 매 게임 *"오늘의 한 수"* 4~7개 자동 마킹
- NEXUS 컨트롤이 *동적 룰 변경 포인트*로 작동 — 후반 집중 발생 예상
- BROKER 클래스가 처음으로 *명목적 협상가*에서 *기능적 협상가*로

---

## [0.8] — 11×11 메인 격상 + UI 동적 + 카드 정체성 + Bloc 능동 액션 (2026-04-28)

### v0.8.1 — 11×11 메인 모드 격상
- SetupScreen에 맵 사이즈 선택 (11×11 정식 / 5×5 튜토리얼)
- 기본값 **11×11** (5×5는 학습용 옵션)
- `buildInitial(role, specific, mapSize)` 인자 추가
- RESET 액션도 mapSize 받음

### v0.8.2 — 11×11 UI 그리드 동적 렌더링
- `.map-board.size-11` CSS 클래스 (22px 라벨, 11×11 그리드, 720px 최대)
- 셀/좌표/zone 폰트 축소 (8px/7px) — 121 셀 압축 표시
- 맵 렌더 JSX를 `cols`/`rows` 동적 배열로 (5×5 / 11×11 자동 분기)

### v0.8.3 — 맵 크기별 임계/룰 분리
- 5×5: 자산 65 / 평판 32·50 / maxRounds 8 (튜토리얼)
- **11×11: 자산 95 / 평판 45·70 / maxRounds 12** (정식)
- `R{round}/X` 헤더 표시도 맵별 분기

### v0.8.4 — 11×11 균형 (Bloc 71/29 → 59/41)
- `BLOC_SETUP_11x11`: 시작 구역 4 → 3 (support 3→2)
- 11×11 한정 Bloc 자동 확장 100% → **50% 확률** (5×5는 100% 유지)
- 11×11 Ghost 시작 자원 보강: ₵+5, 무기+1, 데이터+1, 부품+1, transport 트랙 +1

### v0.8.5 — 카드 정체성 복원 (5종 distinct 효과)
- `stat_boost`: 일회성 판정 보너스 + 다음 R 카드+1 (extraDrawNext)
- `always_first` (BLADE QUICK_DRAW): 적 1명 HP-2 + 자기 ★+2 + combat 트랙
- `target` (BLADE CONTRACT_KILL): hp 최고 적 HP-3 + ★+5
- `reveal: 'zone'` (CIPHER PORT_SCAN): 한 구역 토큰 즉시 공개 + 📡+2
- `swap_ratio` (BROKER BACK_DEAL): data 1 → credit 2 환전
- `temp_tl` (RIGGER OVERCLOCK): 다음 R 카드+1, ⚙+2, ★+2
- `NEXT_ROUND` 핸들러: P0가 `extraDrawNext` 만큼 추가 카드 드로우

### v0.8.6 — Bloc 능동 액션 3종 (반응형 → 능동형)
- **`bounty_post`** (BOUNTY POST 카드, TL1): 평판 1위 Ghost 수배+3, 자기 ₵+3 🎙+1
- **`assassin_contract`** (ASSASSIN HIRE 카드, TL2): HP 1위 Ghost HP-4, 비용 ₵-3, 자기 ★+2
- **`ghost_track`** (GHOST TRACKER 카드, TL2): 모든 Ghost 수배+1, 지도 5R 노출, 자기 📡+3 🎙+1
- 3장 모두 BLOC_COMMON에 추가 (모든 Bloc 사용 가능)
- 봇 점수: bounty +12, assassin +14, ghost_track +10
- effectSummary에 한글 설명 추가

### 검증 (스모크 테스트)
- **5×5 튜토리얼 50판**: Ghost 31 / Bloc 19, 평균 5.54R, P0 28%/4%
- **11×11 정식 100판**: Ghost 59 / Bloc 41, **평균 8.03R (5~12R)** ✅ 6~8R 목표 달성
- 11×11 균형 71/29 → 59/41 (큰 개선)
- 11×11 게임 길이 4.82R → 8.03R (+66%)

---

## [0.7.5] — 최소 5R 가드 (조기 승리 방지) (2026-04-28)

### 추가
- `checkInstantVictory(state)` 진입 시 `state.meta.round < 5` 가드 추가
- 5R 종료 전엔 자산/평판 임계 도달해도 즉시 승리 X (모든 임계 게임 5R 이후 발효)
- maxRounds(8) 한계 내에서 라운드 범위 확정: **5~9R**

### 검증 (200판 시뮬)
- 라운드 범위: **5~9 (최소 5R 보장)** ✅
- 평균 라운드: 5.49 (이전 4.92 → +12%)
- Ghost 114 / Bloc 86 — Ghost 약간 강세 (5R 가드 동안 봇 Ghost 평판 추가 누적)
- P0 승률: Ghost 20% / Bloc 6%

### 알려진 영향
- Ghost 평판 평균 28.2로 상승 (이전 23) — 5R 가드로 누적 시간 증가
- BROKER 여전히 0% (다음 사이클)

---

## [0.7] — MOLE 회복 + 게임 길이 + 11×11 + 방어 비용 (2026-04-28)

### v0.7.1 — MOLE 디버깅 (botPickCards 트레이스)
- 트레이스 결과: MOLE이 카드는 잘 사용하지만 평판 13~21에서 멈춤 (게임 4R로 너무 짧음)
- `tryMoleMiniRaid()` 헬퍼 신설 — 50% 확률 발동 (mini-raid) / 50% 확률 정찰(★+1)
- MOLE mini-raid 트리거 효과 확장: `peek_bloc`/`steal_card`, `copy_bloc_card`, `scandal`/`stock_dmg`
- `bloc_resource`/`vote_flip`, `frame`/`swap_blame`은 mini-raid 제거 (너무 잦음)
- 결과: MOLE 0% → 31.3% (목표 5~25% 진입)

### v0.7.2 — 게임 길이 연장
- 임계 상향: Bloc 자산 50→65, Ghost battle 24→32, alone 34→50
- Bloc 자동 점령 빈도 100% 유지 (75%/50% 시도 실패 — Bloc 약화)
- 결과: 평균 라운드 3.81 → 5.04 (32% 연장, 일부 게임 9R 도달). 6R 목표는 부분 달성.

### v0.7.3 — 11×11 맵 인프라
- `MAP_11x11_ZONES` (121 cells, 중앙 F6 NEXUS) + `MAP_11x11` 자동 생성
- `BLOC_SETUP_11x11` — 5 Bloc 외곽 4방 분산 (각 4구역 시작)
- `coordsAdj(c, maxIdx)` 인자 추가 (기본 10 = 11×11 호환)
- `initGame(humanRole, humanSpecific, playerCount, mapSize)` mapSize 인자 추가
- 11×11에서 Ghost 시작 위치 외곽 분산 (CIPHER A6, BLADE F1, BROKER K6, RIGGER F11, DRIFTER A1, MOLE K11)
- Optional chain 안전 처리 (`s.map[c]?.zone`)
- 5×5 회귀: 200판 무에러, Ghost 103/Bloc 97 균형
- 11×11: 100판 무에러, 평균 4.82R, Bloc 71/29 (별도 튜닝 필요)

### v0.7.4 — Bloc 방어 비용 시스템 (악명형, 완화 버전)
- 매 라운드 phase 4 전 발동
- 4구역까지 무료, 5구역째부터 추가 1구역당 무기 1 OR 크레딧 1 소모 (무기 우선)
- 자원 부족 시 가장 약한 구역(요새화 0, 건물 없음, HQ 외) 잃음
- 결과: 큰 Bloc 자연적 견제, 균형 안 깨짐

### 최종 검증 (200판 시뮬, 5×5)
- 총 승자: Ghost 106 / Bloc 94 (적정 균형)
- P0 승률: Ghost 12% / Bloc 6% (Bloc 약간 약화)
- 평균 라운드: 4.92 (2~9)
- 클래스별: BLADE/RIGGER 23.5%, MOLE 18.8%, VANTA/IRONWALL/CARBON 10%, CIPHER 5.9%
- 잔여 0%: BROKER, HELIX, AXIOM (다음 사이클 과제)

---

## [0.6.6] — 카드 효과 광역 강화 + 4종 mini-raid 도입 (2026-04-27)

### v0.6.6 — RIGGER/CARBON 강화
- `field_craft`/`jury_rig` ★+2→+4, ⚙+4→+5, 🔩+2→+3, mfg 트랙 +1
- 신규 RIGGER 폴백: `repair`/`salvage`/`craft_item`/`zone_shield`/`atk_range`/`multi_target`/`disable_elec`/`zone_disable`
- **드론 mini-raid**: atk_range/multi_target 등 효과 발동 시 인접 Bloc 자동 중립화 + raid count +1
- `cargo_haul`/`supply_drop` ₵+3→+5 ⚙+2→+3 ★+0→+3 + transport+mfg 트랙
- `deploy_trap` 요새+1→+2 ★+2→+4
- `zone_income_2x` 구역×4→×6 ⚙+2→+3 (CARBON)

### v0.6.6b — Bloc 카드 효과 강화
- `deploy_op`: 점령 시 ₵+3 추가, 점령 실패해도 ₵+2 위로금
- `algorithm`/`long_contract`: ₵+6→+8, 🎙+2→+3, Bloc은 자사 주식 +1
- `heal_all` (HELIX): Ghost HP+3 + 자기 ₵+5 🎙+2 + party 트랙
- `ghost_extra_card`/`contracts_boost`: ₵+3→+5 📡+1→+2 + mfg 트랙
- `destroy_zone` (IRONWALL): + 자기 ₵+5 🔩+2 + combat 트랙
- 신규 Bloc 폴백: `lock_zone`/`quarantine`, `steal_op`, `revive` (Ghost 부활), `ghost_move` (계엄령), `crash_target`

### v0.6.6c — CIPHER/BLADE/DRIFTER 효과 강화 + 신규 mini-raid 3종
- **BLADE mini-raid** (`execute`): 인접 Bloc 자동 중립화
- **CIPHER mini-raid** (`def_ignore`/`steal`): 해킹형 인접 Bloc 자동 중립화
- BLADE 신규 폴백: `assassin`/`atk_twice`/`atk_x3_retort`/`atk_reroll`/`force_enter`/`protect_ally`/`absorb`/`block_adj`/`enemy_spd`/`def_penalty`/`def_zero`
- CIPHER 신규 폴백: `mimic`/`transfer_attack`/`redirect`/`wipe_log`/`slow_target`
- DRIFTER 강화: `transfer_ally`/`fuel`, `untrack`/`shortcut`, `leave_fire`/`smuggle`, 신규 `ram_atk`
- `crash_stock`: Ghost인 경우 ★+amt 📡+1 추가
- `execute` ★+4→+5 + combat 트랙
- `frenzy` bonus +1→+3
- `last_stand` ★+5→+8 + raid count +1
- `point_blank`/`surprise`/`same_zone_atk` ★+2→+5 ₵+2→+3

### v0.6.6d — 임계값 + Bloc/Ghost 균형 재조정
- Bloc 자산 임계 60 → 52
- Ghost 평판 battle 18 → 20, alone 26 → 28

### v0.6.6e — 봇 카드 점수 시스템 광역 보강
- `scoreGhostCard`: mini-raid 트리거 효과(infiltrate +14, def_ignore +12, atk_range +12, execute +12) 점수 대폭 상향
- 신규 효과 점수 추가: assassin/atk_twice/atk_x3_retort/atk_reroll/force_enter, repair/salvage, craft_item/zone_shield, mimic/transfer_attack/redirect, wipe_log/slow_target, protect_ally/absorb, block_adj/enemy_spd/def_penalty/def_zero, ram_atk
- `scoreBlocCard`: deploy_op +14, crash_target/destroy_zone +10, zone_income_2x +12, heal_all +9, algorithm/long_contract +12, lock_zone/quarantine +7, steal_op +10, revive +5, ghost_move +6
- 결과: RIGGER 0% → 41%, MOLE 0% → 25% (한 사이클에서 최대 변화)

### v0.6.6f — 최종 임계 + mini-raid 점수 미세 조정
- 평판 임계 32→34 / 22→24, Bloc 임계 56→50
- mini-raid 점수 너프: infiltrate 14→12, def_ignore 10→8, atk_range 12→8, execute 12→8

### 최종 검증 (200판 시뮬)
- 총 승자: **Ghost 98 / Bloc 102** (완벽 대칭)
- P0 승률: Ghost 10% / Bloc 12% (대칭)
- 평균 라운드: 3.88 (2~7)
- **클래스별 최종**:
  - DRIFTER 25%, VANTA/IRONWALL/HELIX 15%, CIPHER/RIGGER 11.8%, CARBON 10%, BLADE/BROKER 5.9%, AXIOM 5%
  - **MOLE 0%** (잔여 바닥권 — 봇 카드 사용 패턴 별도 분석 필요)
- **누적 진전 vs v0.6.4 시작 시점**:
  - 0% 클래스: 4개 → 1개
  - 모든 클래스 0~5% 분포 → 5~25% 분포로 정상화

### 핵심 발견
**4종 mini-raid 패턴 확립** — atk 카드 없는 클래스들이 raid count를 채울 수 있는 결정적 메커니즘:
- MOLE 침투형 (`infiltrate`/`disguise`)
- RIGGER 드론형 (`atk_range`/`multi_target`)
- BLADE 처형형 (`execute`)
- CIPHER 해킹형 (`def_ignore`/`steal`)

각 mini-raid: 인접 Bloc 자동 중립화 + 주가-2 + ★+2 + raidsThisGame +1

---

## [0.6.5] — 바닥권 클래스 종합 리워크 (MOLE/BROKER 회복) (2026-04-27)

### 추가 / 변경
**v0.6.5a — 시작 트랙 리워크**
- CIPHER, BLADE: transport 1 추가
- RIGGER: security → transport (드론 클래스 이동력 보강)
- BROKER: party 2 + transport 2 + security 1 (협상가 발 빠르게)
- MOLE: security 2 + transport 2 + party 1 (잠입가 발 빠르게)

**v0.6.5b — 봇 R&D AI 회전 + pref 5트랙 확장**
- prefByClass를 모든 11개 클래스에 5트랙 풀 명시
- 매 라운드 `round % length`만큼 pref 시작점을 회전 → 한 트랙 몰빵 방지
- 하네스 P0 AI 동일 적용 + transport 0 우선 룰 유지

**v0.6.5c — 게임 길이 임계 +5 / +2**
- Bloc 자산 임계 55 → 60
- Ghost 평판 battle 16 → 18, alone 24 → 26
- 평균 라운드 3.86 → 3.96

**v0.6.5d — MOLE/BROKER 카드 효과 강화**
- `infiltrate` / `disguise` 효과: ★+1 → ★+3 + 📡+2 + security 트랙 + NPC 시그널 +1
  - **신규 mini-raid**: 인접/현재 Bloc 구역 자동 잠입 → 중립화 + 주가-2 + ★+2 + raidsThisGame +1
  - 이로써 MOLE이 atk 카드 없이도 raid 카운트 누적 가능
- `contact`: ★+contact 추가, party 트랙 +1
- `extort`: 렙 ratio 1.5x → 2x
- `broker_fee`: ★+broker_fee/3
- `peek_bloc`/`steal_card`: ★+3 → ★+5
- `bloc_resource`/`vote_flip`: ★+4 → ★+5
- `frame`/`swap_blame`: ★+3 → ★+4
- `copy_bloc_card`: ★+2 → ★+4

### 검증 (200판 시뮬)
- 총 승자: Ghost 106 / Bloc 94
- P0 승률: Ghost 17% / Bloc 11%
- 평균 라운드: 3.96 (2~7)
- **클래스별 (이전 → 지금)**:
  - MOLE: 0% → 18.8% ✅
  - BROKER: 0% → 35.3% ✅
  - BLADE: 0% → 11.8%
  - AXIOM: 5% → 20%
  - DRIFTER: 25% → 18.8%
  - 새 바닥권: RIGGER 0%, CARBON 0% (다음 v0.6.6 과제)

---

## [0.6.4] — LV4-5 고급 효과 + LV5 궁극 능력 (2026-04-27)

### 추가
- **트랙 LV5 궁극 능력 (`onceAbilities`, 게임당 1회)**
  - 무력 LV5 → `critFailImmunity` (크리티컬 실패 영구 면역)
  - 수송 LV5 → `teleport` (구역 직행)
  - 제조 LV5 → `droneFree` (1회 무료 드론)
  - 파티 LV5 → `reroll` (주사위 1회 리롤)
  - 경호 LV5 → `deathSave` (HP 0→1 부활)
- `deathSave` 발동 로직: PvP 공격으로 HP=0 시 onceAbilities 소진하며 회복
- `trackBonus` LV4(+2) / LV5(+1) 추가 가산 → 총 +1/+3/+4 단계
- `trackIncomeBonus` 마찬가지로 LV4/LV5 가산

### 검증 (200판 시뮬)
- 총 승자 분포: Ghost 101 / Bloc 99 (균형)
- P0 승률: Ghost 15% / Bloc 14% (대칭)
- 평균 라운드: 3.90 (2~8)
- 클래스별: DRIFTER 37.5% (강), MOLE 0% (바닥)

---

## [0.6.3e] — Bloc 건물 건설 시스템 (산업 트랙형 + Gallerist 영감) (2026-04-27)

### 추가
- **5종 건물** (자사 빈 구역에 1개씩 건설 가능)
  - 🏭 공장 (TL1, ₵4 ⚙2): 매 라운드 부품 +2
  - 🛡 보안센터 (TL1, ₵3 ⚙1): 구역 요새화 +2 영구
  - 🏢 사옥 (TL2, ₵6): 자산 +5 영구, 인플루언스 +1/R
  - 📈 거래소 (TL2, ₵5): 매 라운드 자사 ₵+2
  - 📡 미디어허브 (TL3, ₵5 ⚙2): 뉴스 효과 -50%
- `BUILD_BUILDING` 액션, `canBuildBuilding` 검증
- Bloc 봇 자동 건설 AI (수익 페이즈 종료 시)
- Ghost 레이드 성공 시 건물 파괴 → ★+2 ₵+3 보너스
- `assetValue`에 건물 가치 추가 합산 (hq+5, trading+3, 등)
- 맵 셀에 건물 아이콘 배지, P0 Bloc 패널에 건설 버튼

---

## [0.6.3d] — 시그널 점진 공개 시스템 (NPC 블록 정보 점진 공개) (2026-04-27)

### 추가
- NPC 블록에 `signal: { revealed, max }` 필드 (0~3 단계)
- 시그널 0=정체 미상(???) → 1=정체 → 2=특성 → 3=완전 노출
- `SIGNAL_INVEST` 액션: data 3 → 시그널 +1
- 정찰(scout) 카드 효과 → 자동 시그널 +1
- 잠입형 레이드 → +2, 일반 레이드 → +1
- 시그널 LV3 도달 후 레이드 → ₵+5 📡+2 보너스 약탈
- 플레이어 카드 헤더: 시그널 0이면 specific을 ??? 로 가림
- NPC 패널에 시그널 게이지 + 즉시 투자 버튼

---

## [0.6.3c] — 트랙 LV2 패시브 + 레이드 타입 트랙 해금 (2026-04-27)

### 추가
- `trackBonus(p, kind)` 헬퍼: combat→atk, transport→spd, security→def, mfg→hack
  - LV2 +1 / LV4 +3 / LV5 +4
- `trackIncomeBonus`: party LV2+ → 크레딧 / mfg LV2+ → 부품 패시브 수익
- 레이드 실행: `trackBonus(me, useStat)` 가산 적용
- Escape: `trackBonus(me, 'spd')` 가산 적용
- Ghost PvP 결투, 봇 자동 레이드, 카드 공격 효과: 모두 트랙 보너스 반영
- COLLECT_INCOME에 트랙 패시브 수익 가산

### 변경 — 레이드 타입 잠금 시스템
- 클래스 전용(`requiresClass`) → 트랙 LV(`requiresTrack`)로 전환
  - infiltrate: security LV3 (MOLE classAffinity)
  - negotiate: party LV3 (BROKER classAffinity)
  - drone: mfg LV4 (RIGGER classAffinity)
- `RAID_SELECT_TYPE` reducer에 트랙 검증 추가
- 레이드 모달에 잠금 표시(🔒) + LV 충족 안내
- 하네스 봇 AI도 트랙 LV 기반 선택으로 변경

---

## [0.6.3b-2] — 악명 자동 누적 + 마일스톤 트리거 (2026-04-27)

### 추가
- `raiseTrack(state, idx, key, n)` — 자원 비용 없이 카드/액션 결과로 트랙 자동 +1
- 자동 상승 트리거:
  - 레이드 성공 → useStat에 따라 combat/transport/mfg +1
  - 레이드 실패 → security +1 (방어 학습)
  - 3칸 이상 이동 → transport +1
  - 정찰/은신/수배 초기화/요새화 → security +1
  - 상점 구매 → 무기/용병이면 combat, 그 외 party +1
  - 큰 수입 라운드 (구역 ≥3) → party +1, (구역 ≥5) → mfg +1
- 총악명 마일스톤 시스템 (`INFAMY_MILESTONES = [6, 12, 18]`)
  - 6: Ghost ★+1 ₵+2 / Bloc ₵+3 ⚙+1
  - 12: TL Progress +3 + 자원 약간
  - 18: Ghost ★+3 / Bloc ₵+5 영향력+1
- `meta.milestonesAwarded` 마일스톤 기록 추가 (중복 방지)
- 플레이어 카드 헤더에 마일스톤 도장 (6/12/18) 표시

---

## [0.6.3b] — 트랙 시스템 (악명형 악명식, 직접 투자형) (2026-04-27)

### 추가
**5트랙 진척 시스템 — 악명형 악명 + 사이버펑크 라이프패스 융합**

- **5트랙**: 무력(💪) · 수송(🚚) · 제조(⚙) · 파티(🎉) · 경호(🛡), 각 0~5 LV
- **총악명(Infamy)** = 5트랙 합계 (단일 지표 — 악명형 트랙 시스템 차용)
- **클래스 시작 트랙** — 사이버펑크 라이프패스 풍 비대칭 시작점
  - BLADE: 무력 2 + 경호 1 / CIPHER: 경호 1 + 제조 1
  - BROKER: 파티 2 + 경호 1 + 수송 1 / DRIFTER: 수송 2 + 무력 1 + 제조 1
  - RIGGER: 제조 2 + 경호 1 + 무력 1 / MOLE: 경호 2 + 파티 1
  - VANTA: 파티 1 + 경호 2 / IRONWALL: 무력 2 + 경호 1
  - HELIX: 제조 1 + 파티 1 + 경호 1 / AXIOM: 제조 2 + 경호 1 / CARBON: 제조 1 + 수송 1 + 파티 1
- **레벨업 = 직접 투자** (XP 누적 방식 폐기): R&D 페이즈마다 트랙 1개 무료 +1
- **트랙별 자원 비용 정의** (v0.6.3c 카드 추가 시 사용 예정):
  - 무력: 무기 2 / 수송: ₵3 / 제조: 부품 2 / 파티: ₵3 / 경호: 정보 2

### 설계 결정
- **왜 XP→투자형 전환?** 플레이어가 "어떤 트랙에 무엇을 투자할지" 명시적 선택 → 전략 결정의 명료화. XP 자동 누적은 "그냥 플레이만 해도 다 차오르는" 무의미한 진척 → 폐기
- **봇 휴리스틱**: 클래스별 선호 트랙 우선 (예: BLADE→combat>security>transport)
- LV 임계 효과는 v0.6.3c~v0.6.4에서 단계적 적용

### UI
- 플레이어 카드 하단: **☠ 악명 N/25** 헤더 + 5트랙 라인 (LV 도트 0~5)
- R&D 페이즈 종료 시 P0 모달: 5개 트랙 카드형 버튼 (MAX 도달 시 비활성)

### 시뮬 200판 결과 (4인 모드 기준)

| 클래스 | 승률 | | 블록 | 승률 |
|---|---|---|---|---|
| BROKER | 41.2% | | IRONWALL | 40.0% |
| BLADE | 23.5% | | VANTA | 30.0% |
| CIPHER | 23.5% | | HELIX | 30.0% |
| DRIFTER | 6.3% | | CARBON | 30.0% |
| MOLE | 6.3% | | AXIOM | 5.0% |
| RIGGER | 5.9% | | | |

**Ghost 18% / Bloc 27%** — BROKER 바닥권→최상위 점프(파티 트랙 선투자 효과 중첩). DRIFTER/MOLE/RIGGER/AXIOM 바닥권 잔존 → v0.6.3c LV2 패시브로 복구 예정.

---

## [0.6.3a] — 5트랙 데이터 + UI 골격 (2026-04-27)

### 추가
- `TRACK_KEYS`, `TRACK_NAMES`, `CLASS_STARTING_TRACKS` 데이터 구조
- `initTracks(specific)` — 클래스별 시작 LV 부여
- `buildPlayer`에 `tracks` 필드 통합
- 플레이어 카드 5트랙 게이지 (초기 XP바 형식 — v0.6.3b에서 도트 형식으로 교체됨)

### 의도
v0.5 후반의 클래스간 깊이 격차(BLADE 33% / MOLE 0%) 해소를 위해 사이버펑크 라이프패스식 비대칭 시작점 + 악명형 점진 진척 시스템 도입의 첫 단계.

---

## [0.6.2] — 인원수별 승리 임계 동적 연동 (2026-04-23)

### 변경
`checkInstantVictory`에서 비-NPC 인원수에 따라 승리 임계값 동적 조정:
- **2인**: 임계 -2 (게임 짧음 보정 → Bloc 53, 렙 14+2/22)
- **3인**: 임계 -1 (Bloc 54, 렙 15+2/23)
- **4인**: 기본 (Bloc 55, 렙 16+2/24)
- **5인**: 기본 (이전 +3 시도는 Bloc 폭락으로 롤백)

### 결과 (각 100판)

| 인원 | Ghost | Bloc | 격차 | 평균R |
|---|---|---|---|---|
| 2인 | 36% | 42% | 6pt | 4.63 |
| **3인** | **24%** | **24%** | **0** | 4.46 |
| 4인 | 12% | 14% | 2pt | 4.32 |
| 5인 | 18% | 8% | 10pt (Ghost 강세) | 3.84 |

**3인 정확 평형**, 4인 ±2pt, 2인 ±6pt. 5인은 별도 조정 필요 (v0.6.3+).

---

## [0.6.1] — 2인 모드 NPC 중립 블록 2개 (2026-04-23)

### 문제 (v0.5.26 발견)
2인 모드 P0 Ghost 30% / Bloc 56% — 봇 Ghost 1명으로는 Bloc 자동 확장 못 막아 Bloc 26pt 편향.

### 해결: NPC 블록 2개 자동 추가
2인 모드일 때 `initGame`에서 NPC 블록 2개 자동 배치:
- `kind: 'npc'` + `isNpc: true` 플래그
- 시작 구역만 차지, **자동 확장 X, 카드 X**
- Ghost가 레이드 가능한 추가 표적 역할
- P0 Bloc의 자동 확장 공간을 막아줌

### 결과
**2인 P0 Ghost / Bloc**: 30/56 → **20/34** (편향 26pt → 14pt, 절반)
- 게임 길이 5.23 → 4.88 라운드 (자연스러운 단축)

---

## [0.6.0] — v0.6 밸런스 시즌 시작: RIGGER 드론 레이드 (2026-04-23)

### v0.6 로드맵
v0.7로 밀어둔 섭외/실제 플레이테스트 전에 밸런스 완전 정착. v0.6.x는 시뮬 기반 반복 튜닝.

**계획**:
- **v0.6.0**: RIGGER 원격 드론 레이드 ✅
- **v0.6.1**: 2인 모드 NPC 중립 블록 2개 (Bloc 편향 해소)
- **v0.6.2**: 인원수별 승리 임계 연동 (5인 빠름·2인 짧음)
- **v0.6.3**: 바닥권 안정화 (BROKER fallback·CARBON bond 파워)
- **v0.6.4**: 11×11 맵 시뮬 구현 + DRIFTER 원복
- **v0.6.5**: 전체 검증 (400판 × 각 인원)

### v0.6.0 — 🛰 RIGGER 드론 레이드
6번째 레이드 타입. RIGGER의 "원격 기술자" 정체성 살림.

| 속성 | 값 |
|---|---|
| 스탯 | HACK |
| Threshold | 4 |
| 비용 | 부품 2개 (드론 기체) |
| 성공 | 렙+3, 주가-3, 수배+0 (원격이라 추적 불가), 부품-1 (드론 1 소실) |
| 실패 | HP-0 (본인 안전), 공권력+1, 부품-2 (드론 2 소실) |
| 특이 | **이동 불필요** — RIGGER가 인접 Bloc 구역 자동 타겟팅 |

### 원격 타격 구조
RIGGER가 현재 위치에 Bloc 구역 없어도, **인접 1칸 내 Bloc 구역이 있으면 자동으로 타겟팅**. 즉 RIGGER는 자기 안전한 구역에 머무르면서 주변 Bloc 구역을 순차 파괴. 이동 카드 압박 없음.

### AI 우선순위 (v0.6.0)
```
MOLE → infiltrate
RIGGER + 부품 2+ → drone
RIGGER + 부품 부족 → hack
BROKER + 크레딧 4+ → negotiate
BROKER + 크레딧 부족 → stealth
HP<40% → stealth
HACK≥3 → hack
그 외 → violent
```

### 400판 결과
- **RIGGER 0% → 9.1%** (드론 효과)
- Ghost 12.5% / Bloc 14% (평형)
- 평균 4.42 라운드 (범위 2~8)
- 격차 24pt → 21pt (DRIFTER 24.2 vs MOLE 3)

---

## [0.5.26] — 인원수 2~5인 지원 + 인원별 밸런스 측정 (2026-04-23)

### 변경
- `initGame(humanRole, humanSpecific, playerCount)` — 세 번째 파라미터로 총 인원수 지정 (2~5)
- 봇 역할 할당 로직 동적화:
  - 2인: 봇 1 (반대 역할)
  - 3인: 봇 2 (둘 다 반대 역할)
  - 4인: 봇 3 (반대 2 + 같은 1)
  - 5인: 봇 4 (교차 균형)
- `raidsThisGame`/`zonesVisited`/`attacksUsed`/`lostCardsUsed` 배열 크기 4 → 5로 확장
- 하네스에 `run_playercount.js` 추가 — 2~5인 각 100판 돌려 비교

### 인원별 밸런스 (각 100판)

| 인원 | 평균R | P0 Ghost | P0 Bloc | 비고 |
|---|---|---|---|---|
| 2인 | 5.23 | 30% | 56% | **Bloc 편향** (유일한 Ghost 봇 고립) |
| 3인 | 4.71 | 8% | 20% | Bloc 유리 |
| **4인** | **4.46** | **20%** | **22%** | **골드 스탠다드** |
| 5인 | 4.08 | 10% | 10% | 가장 빠름·평형 |

### 핵심 발견
- **4인이 가장 균형** 잡힌 구도 (Ghost/Bloc ≈ 동점)
- **2인 모드**: 봇 Ghost 1명으로는 Bloc 자동 확장 봉쇄 어려움 → Bloc 편향
- **5인 모드**: 경쟁 밀도 상승 → 게임 속도 가속, 4라운드 내 종결
- 인원 많을수록 평균 라운드 짧아지는 정방향 추세

### 남은 과제
- 2인 모드 별도 규칙 검토: Bloc 자산 목표 상향 or NPC 중립 블록 2개 배치
- 5인 모드 플레이 타임 유지 위한 임계값 조정

---

## [0.5.25] — 크리티컬 실패 도입 (BLADE·CIPHER 자동성공 문제 해결) (2026-04-23)

### 문제
사용자 질문 "블레이드가 왜 이렇게 강력해?" → 분석 결과:
- BLADE ATK 5 + violent threshold 5 → d6+5 ≥ 5 = **100% 자동 성공**
- CIPHER HACK 5 + hack threshold 5 → 동일 문제
- 둘 다 레이드 실패 확률 0%라 안정적 렙 축적

시도한 수치 조정 (threshold 5→6→7):
- 6: d6 최소 1이라도 1+5=6 ≥ 6 → 여전히 100%
- 7: 83% 성공이지만 다른 클래스까지 크게 너프됨

### 해결: 크리티컬 실패 규칙 (TRPG 표준)
**실행 판정 d6 = 1이 나오면 스탯·투자·상성 무관 즉시 실패.**
threshold는 원래 5로 복원. 최대 성공률은 **83.3% (5/6)**.

이제 BLADE(ATK5)도 CIPHER(HACK5)도 주사위 1이 나오면 실패 가능. "운의 여지" 확보.

### 결과 (300판)
| 클래스 | v0.5.22 → v0.5.25 |
|---|---|
| BLADE | 55% → **16%** |
| CIPHER | 40% → 24% |
| DRIFTER | 28% → 24% |
| HELIX/IRONWALL/VANTA/AXIOM | ~13~17% |
| BROKER/MOLE | 4% |
| RIGGER | 0% |

**Ghost 12% vs Bloc 12% 정확히 평형**, 평균 4.09 라운드, 격차 24pt 유지.

### UI
- 예상 성공률 계산 식 수정: `min(5, 6-needed) / 6` (crit fail 반영)
- 로그: `🎲 실행 1+... (💀 크리티컬 실패)` 표기 가능

---

## [0.5.24] — MOLE 잠입형·BROKER 협상형 레이드 추가 (2026-04-23)

### 레이드 타입 3종 → 5종 확장

**🕷 잠입형 (MOLE 전용)**
- HACK 스탯, threshold 3 (거의 자동 성공)
- **방어 완전 무시** (요새화, 센서, AI 전부 bypass)
- 성공: 렙+4, 주가-2, 데이터+3, 수배+0
- 실패: HP-1, 수배+1
- MOLE 클래스에게 "방어 우회하면서 정보 확보" 플레이 루트 제공

**🤝 협상형 (BROKER 전용)**
- SPD 스탯, threshold 2 (사실상 자동)
- **비용 ₵4 선지불** (없으면 실행 불가)
- 성공: 렙+4, 주가-1, 수배+0, 공권력-1, 인플루언스+2
- 실패: 피해 없음 (협상 결렬)
- BROKER에게 "돈 써서 안전하게 렙 쌓기" 루트

### AI 자동 선택 (시뮬용)
```
if class === 'MOLE'           → infiltrate
else if class === 'BROKER' + credit≥4 → negotiate
else if HP < 40%              → stealth
else if HACK ≥ 3              → hack
else                          → violent
```

### 100판 결과

| 클래스 | 승률 | 변화 |
|---|---|---|
| BLADE | 55.6% | 폭력형 특화 |
| HELIX | 30% | Bloc 평균 |
| DRIFTER | 25% | — |
| **MOLE** | **25%** | 0% → 25% (잠입형 효과) |
| CIPHER | 22.2% | 해킹형 유지 |
| AXIOM | 20% | 복귀 |
| CARBON | 20% | — |
| VANTA | 0% | 변동성 |
| BROKER | 0% | 1회성 negotiate 후 고갈 |
| RIGGER | 0% | 추가 조정 필요 |

- **Ghost 22% vs Bloc 16%** (거의 평형)
- 평균 4.03 라운드, 범위 2~7
- 격차 56pt (변동성 크지만 100판이라 노이즈 포함)

### 남은 이슈
- BROKER: negotiate 1회 후 크레딧 고갈 → 이후 stealth/violent로 fallback 필요 (AI 개선)
- RIGGER: 전용 레이드 타입 없음 (drone 레이드 추가 검토)

---

## [0.5.22] — 레이드 풀세트: 타입 × 자원 투자 × 3단계 판정 × 방어 × 구역 차등 (2026-04-23)

### 문제
기존 레이드는 "도착 → 모달 → 주사위 1번" 구조. 결정감·전술성 부족. 한 번의 운에 모든 게 좌우돼 재미 떨어짐.

### ① 레이드 타입 3종 선택
같은 구역이라도 세 가지 방식 중 선택:

| 타입 | 스탯 | threshold | 성공 | 실패 |
|---|---|---|---|---|
| 🗡 폭력형 | ATK | 5 | 렙+4, 주가-3, 수배+2 | HP-2, 수배+1 |
| 🕶 은밀형 | SPD | 5 | 렙+2, 주가-2, 수배+0 | HP-0, 수배+1 |
| 💾 해킹형 | HACK | 5 | 렙+2, 주가-4, 데이터+2, 수배+1 | HP-0, 공권력+2, 데이터-1 |

### ② 사전 자원 투자
실행 전 자원 1개씩 투자 가능:
- 🔩 무기: 실행 +1 (개당)
- 📡 데이터: 접근 +1 (개당)
- ◈ 풀 속성: 1개 선택 → 실행 +1, 구역 속성과 **매치** 시 +2

투자는 실행 즉시 소모. 확률 UI가 실시간 반영.

### ③ 3단계 판정
단일 주사위 → 세 번의 의미 있는 굴림:
- **🚶 접근**: d6 + 데이터 투자 vs 4 — 실패 시 실행 threshold +2 ('감지됨')
- **⚔️ 실행**: d6 + 선택 스탯 + 무기 + 속성 + 상성 vs threshold — 본 판정
- **🏃 도주**: d6 + SPD vs 3 — 실패 시 수배 +1 추가

### ④ Bloc 자동 반격
구역 주인에 따라 다른 방어:
- **VANTA**: 센서 감지 → 접근 -2
- **IRONWALL**: 무장 → threshold +1
- **AXIOM**: AI 보조 → 전 판정 -1
- **요새화 구역**: 요새화 수치만큼 threshold +N

### ⑤ 구역 타입별 차등 전리품
성공 시 기본 보상 + 구역별 추가:
- 🏦 금융가: ₵+5
- 💾 데이터허브: 데이터+3, 뉴스 미리보기
- 🔫 무기고: 무기+3
- 🏭 공업지구: 부품+3
- ❤️ 의료: HP 완전 회복
- 🎲 유흥가: ₵+3, 인플루언스+1
- 🏠 주택가: ₵+2, 부품+1
- ⚪ 넥서스부속: ₵+2, 전속성+1
- 🌟 NEXUS: 렙+3 추가, 전속성+1
- ⚓ 항구: 무기+2, ₵+2
- 🪨 폐허: 부품+5
- 🚨 경찰서: 수배-2

### 시뮬 (300판 v0.5.22)

| 클래스 | 승률 | 특이 |
|---|---|---|
| CIPHER | 24% | HACK 3+ → 해킹형 우대 |
| BLADE | 20% | ATK 5 → 폭력형 우대 |
| DRIFTER | 16% | 평균 |
| VANTA/IRONWALL/HELIX | 13% | Bloc 평균 |
| BROKER/MOLE | 8% | 비전투 클래스 |
| CARBON/AXIOM/RIGGER | 0~4% | 추가 튜닝 필요 |

- Ghost 13.3% / Bloc 9.3% (평형)
- 평균 라운드 4.15, 범위 2~7
- 격차 24pt 유지

### AI 행동 규칙 (시뮬용)
- HP < 40% → stealth
- HACK ≥ 3 → hack
- 그 외 → violent

### UI
- 3단계 모달: 타입 선택 → 자원 투자 → 실행
- 실시간 예상 성공률 % 표시
- 구역 추가 전리품 미리보기
- Bloc 방어 효과 사전 공개

---

## [0.5.21] — TL 비용 균일화 + 5칸 시각 게이지 (2026-04-23)

### 문제
TL 비용이 레벨별 다름 (1→2: 4pt, 2→3: 7pt, 3→4: 10pt, 4→5: 14pt). 시각 게이지 5칸이면 1칸 가치가 레벨마다 달라 직관 어긋남.

### 변경
- **TL 비용 전 레벨 5pt 균일**: 1칸 = 1pt 보장
- **R&D 공식 비례 축소** (속도 맞춤):
  - **Ghost**: `⌊렙/3⌋ + 레이드×2 + ⌊풀/2⌋` → `⌊렙/5⌋ + 레이드 + ⌊풀/3⌋`
  - **Bloc**: `구역수 + ⌊풀/2⌋` → `⌊구역수/2⌋ + ⌊풀/3⌋`
- **플레이어 카드 TL 게이지**: 숫자 `2/4` → **5칸 시각 막대**
  - 녹색 채움 + 글로우, 빈 칸은 회색
  - TL 5 도달 시 "MAX" 표시

### 결과 (200판 시뮬)
- DRIFTER 39% → **25%** (v0.5.19 대비 -14pt)
- 격차 34pt → 25pt (재수렴)
- 평균 라운드 4.04 → 4.12 (거의 동일)

---

## [0.5.19] — 플레이 타임 연장: 승리 임계값 일괄 상향 (2026-04-23)

### 문제
v0.5.18 기준 평균 3.5라운드에 게임 종료. 사용자 피드백: "너무 빨리 끝난다 그래도 8턴은 걸리는게 좋은데". 특히 Bloc이 R2에 자산 42/48, R4에 54+ 찍어 결판.

### 변경
- **Bloc 자산 목표**: 48 → **55** (UI·reducer 전역 갱신)
- **Ghost 전투 루트**: 렙 14+레이드 2 → **렙 16+레이드 2**
- **Ghost 평판 루트**: 렙 20 → **렙 24**
- **레이드 모달 wouldWin 계산**도 새 임계값 반영

### 실험했다가 롤백
**Bloc 패시브 확장 격년 (2R마다)**: Bloc 3.5%까지 폭락해서 매 라운드 확장으로 복원. 확장 자체가 Bloc의 주요 자산 축적 경로라 제거하면 성립 안 됨.

### 결과 (400판 시뮬)

| 지표 | v0.5.18 | v0.5.19 |
|---|---|---|
| 평균 라운드 | 3.5 | **4.04** |
| 최대 라운드 | 8 | **8** (범위 2~8 활용) |
| Ghost 승률 (P0) | 19% | 18% |
| Bloc 승률 (P0) | 10% | 12% |
| DRIFTER | 36% | 39% |
| 격차 | 28pt | 34pt |

**플레이 타임 목표 달성** (8라운드까지 돌아감). 격차 재확대는 다음 패치로 넘김.

### 남은 과제 (v0.5.20+)
- VANTA/AXIOM 바닥권 (0~5%) 추가 버프
- 격차 34pt → 25pt 이하로 재수렴

---

## [0.5.18] — 클래스별 폴백 수치 반복 튜닝 (2026-04-23)

### 방법론
v0.5.13 이후 하네스로 반복 배치 시뮬(400판/회)을 돌려가며 바닥권 클래스의 효과 수치를 단계적으로 상향. 한 사이클에 한 이슈씩 찍어서 소규모 변경 → 재시뮬 → 다음으로.

### v0.5.14 — MOLE/RIGGER 수치 강화
- `peek_bloc`/`steal_card`: 렙+2·₵+3 → **렙+3·₵+4**
- `bloc_resource`/`vote_flip`: 렙+3·₵+4 → **렙+4·₵+5**
- `frame`/`swap_blame`: 렙+2 → **렙+3** (수배-2 유지)
- `emp_pulse`/`tech_breach`: 렙+1 → **렙+2** (주가-3·데이터+2 유지)
- `field_craft`/`jury_rig`: 부품+3·무기+1·렙+1 → **부품+4·무기+2·렙+2**
- `shield_gen`/`drone_swarm`/`overclock`: 렙+2 → **렙+3**

### v0.5.15 — AXIOM V 속성 공급 재설계
AXIOM HQ(데이터허브)가 M만 생산해 V 부족 문제 있었음. AXIOM 카드 3장의 `side.gen` 전환:
- `PREDICTION_E` side: `gen M` → **`gen V`**
- `FLASH_CRASH` side: `gen M` → **`gen V`**
- `FLASH_TRADE` side: `gen M` → **`gen V`**
- `ALGO_LOCK`·`SYS_TAKEOVER` 기존 V 유지 (합 5장)

400판 결과: AXIOM 5% → 10%.

### v0.5.16 — Bloc P0 승률 개선
Bloc P0가 Ghost P0보다 일관되게 열세였음. 두 단계 실험:
1. 자산 계산에 구역 가치 5→7, 크레딧 1/3 포함 → **오버버프** (Bloc 59%·Ghost 4%) → 전면 롤백
2. Bloc 자산 임계값만 50 → **48** 소폭 완화 (승리 UI 전체 48로 연쇄 갱신)
3. `peek_*` 정보 행동이 Bloc일 때 **크레딧 +amount×2** 추가 보너스 (v0.5.18 적용)

400판 결과: Ghost 14% vs Bloc 15% — 거의 평형.

### v0.5.17 — RIGGER/CARBON 바닥권 구제
- RIGGER `trap`/`deploy_trap`: 현위치 요새화 → **요새화 + 렙+2 + ₵+2**
- RIGGER `scout`/`drone_scan`: 데이터만 → **데이터 + 렙** (동량)
- CARBON `zone_income_2x`/`div_2x`: 구역×3 → **구역×4 + 부품+2**

400판 결과: RIGGER 3% → 9%, CARBON 변동성 높음 (7.5~15%).

### v0.5.18 — CARBON 자산 가속·Bloc 정보 보너스
- `bond` (CARBON INFRA_BOND): 기존 ₵+N → **₵+N + 최저가 타 블록 주식 1주 자동 매수** (채권이 자산 가속기로)
- `peek_*` 정보 행동: Bloc이 사용 시 **추가 크레딧 +amount×2** (Bloc 자산 루트 강화)

### 📊 누적 결과 (v0.5.9 → v0.5.18, 400판 시뮬)

| 클래스 | v0.5.9 | v0.5.13 | v0.5.18 | 누적 변화 |
|---|---|---|---|---|
| DRIFTER | **62.5%** | 30.3% | 36.4% | -26pt |
| BLADE | — (미측정) | 20.6% | 20.6% | 측정 시작 |
| HELIX | 10% | 12.5% | 20% | +10pt |
| MOLE | — | 6.1% | **18.2%** | 정상화 |
| CIPHER | 17.6% | 20.6% | 17.6% | ≈ |
| IRONWALL | 0% | 17.5% | 15% | +15pt |
| BROKER | **0%** | 9.1% | 12.1% | +12pt |
| RIGGER | — | 3% | **9.1%** | 정상화 |
| CARBON | 5% | 10% | 7.5% | +2.5pt |
| VANTA | 10% | 12.5% | 7.5% | -2.5pt |
| AXIOM | 20% | 7.5% | — | V 공급 수정 반영 중 |

- **최대-최소 격차**: v0.5.9 **62pt** → v0.5.18 **~27pt** (절반)
- **평균 라운드**: 2.86 → 3.5~3.7 (+24~29%)
- **P0 Ghost/Bloc 균형**: 거의 평형 (14~19% / 10~15%)

### 🧰 도구 개선
- `sim-harness/harness_body.js`: `i % 6` → `Math.floor(i/2) % 6` 버그 수정 (v0.5.13 포함)
- `sim-harness/core.js`: index.html에서 추출하는 범위를 자동 추적하도록 README 갱신

### 남은 과제 (v0.6 전)
- DRIFTER 30%대 유지 — 5×5 맵 특수 규칙 세밀 조정 필요
- 변동성 큰 분산 — 동일 시드 재현성 위해 PRNG 고정 옵션 검토
- 11×11 맵 시뮬레이터 구현 (데이터만 있고 동작 X)
- MOLE/RIGGER 효과 중 여전히 덜 구현된 키 있음 (`smuggle`·`swap_blame` 등 추적)

---

## [0.5.13] — 캐릭터 상성 + BLADE/MOLE/RIGGER 부활 + 맵 규칙 프레임워크 (2026-04-23)

### 🐛 하네스 버그 수정
v0.5.9~0.5.12 시뮬에 **BLADE/RIGGER/MOLE이 한 번도 P0로 배정 안 되던 버그**. `ghostClasses[i % 6]`에서 i가 짝수일 때만 ghost 턴이라 0,2,4 (CIPHER/BROKER/DRIFTER)만 뽑혔음. `Math.floor(i/2) % 6`로 수정. 드러난 진짜 현실:
- BLADE 2.9% (v0.5.12 시뮬 첫 정확한 데이터)
- MOLE 0~6% 
- RIGGER 0~3%

이유: 세 클래스 고유 효과 키(`execute`, `peek_bloc`, `frame`, `emp_pulse`, `shield_gen` 등 **22종**)가 `applyEffect`에 미구현. 카드 내면서 아무 일도 안 일어남.

### 🎯 캐릭터 상성 시스템 (신규)

**Ghost 6-방향 사이클**: 공격자가 방어자를 카운터하면 결투 atk +2
```
BLADE → CIPHER → MOLE → BROKER → DRIFTER → RIGGER → BLADE
```
테마: 물리>해킹, 해킹>잠입, 잠입>협상, 협상>기동, 기동>기술, 기술>물리

**Ghost → Bloc 카운터**: Ghost 클래스가 타겟 Bloc과 상성 시 레이드 atk +1
- BLADE → IRONWALL (물리 대 물리)
- CIPHER → VANTA (정보 대 정보)
- BROKER → CARBON (중개 대 자원)
- MOLE → HELIX (잠입 대 생체)
- DRIFTER → AXIOM (기동 대 AI 예측)
- RIGGER → CARBON (기술 대 인프라)

UI 반영: 결투 모달·레이드 모달에 "🎯 상성 유리" 녹색 배지 + 보너스 수치 표시, 로그에 `🎲5+4+상성2=11` 형식 출력.

### 🔧 BLADE/MOLE/RIGGER 효과 22종 폴백 구현

**BLADE 전투 계열**: `execute` (렙+4), `frenzy`/`atk_per_hp` (HP비례 렙), `hp_to_1`/`last_stand` (HP→1 후 렙+5), `negate`/`shield` (HP+2), `point_blank`/`surprise` (렙+2·₵+2)

**MOLE 침투 계열**: `peek_bloc`/`steal_card` (렙+2·₵+3), `bloc_resource`/`vote_flip` (렙+3·₵+4), `frame`/`swap_blame` (수배-2·렙+2), `infiltrate`/`disguise` (지도 3R 노출·렙+1), `scandal`/`stock_dmg` (타겟 주가-2·렙+2), `permanent_clear` (수배→0·렙+2)

**RIGGER 기술 계열**: `emp_pulse`/`tech_breach` (주가-3·데이터+2·렙+1), `field_craft`/`jury_rig` (부품+3·무기+1·렙+1), `shield_gen`/`drone_swarm`/`overclock` (판정+2·렙+2), `disable_tl`/`force_tl_down` (적 TL-1·렙+3), `temp_tl` (렙+2), `transfer_ally`/`fuel` (₵+2·부품+1)

**공통**: `break_veil`, `force_enter`, `leave_fire`/`burn_behind`/`smuggle` 등 경로·잠입 관련

### 🗺️ 맵 크기별 규칙 프레임워크 (신규)

```js
MAP_RULES = {
  '5x5':   { roundLimit: 10, driftAtkOverride: 2, driftHpOverride: 8, assetGoal: 50, repGoal: 20 },
  '11x11': { roundLimit: 12, driftAtkOverride: 4, driftHpOverride: 9, assetGoal: 60, repGoal: 40 },
}
```

DRIFTER 너프는 **5×5 튜토리얼 전용**, 11×11 표준에선 원래 HP 9·ATK 4 유지. 맵이 넓으면 이동 카드 가치가 자연 하락하므로 풀 파워 정상.

### 📊 결과 (400판 시뮬)

| 클래스 | v0.5.9 | v0.5.12 | v0.5.13 | 변화 (v0.5.9→v0.5.13) |
|---|---|---|---|---|
| DRIFTER | 62.5% | 47% | **30.3%** | -32pt |
| CIPHER | 17.6% | 16.4% | 20.6% | +3pt |
| BLADE | — (측정 불가) | 2.9% | **20.6%** | 정상화 |
| IRONWALL | 0% | 10% | 17.5% | +17.5pt |
| VANTA | 10% | 10% | 12.5% | +2.5pt |
| HELIX | 10% | 22.5% | 12.5% | +2.5pt |
| CARBON | 5% | 7.5% | 10% | +5pt |
| BROKER | 0% | 22.4% | 9.1% | +9pt |
| AXIOM | 20% | 10% | 7.5% | -12.5pt |
| MOLE | — | — | 6.1% | 측정 시작 |
| RIGGER | — | — | 3% | 측정 시작 |

**격차 개선**: v0.5.9 DRIFTER 62%와 BROKER 0%의 62pt 격차 → v0.5.13에서 30%와 3%의 **27pt로 절반**. 평균 라운드 2.86 → 3.74 유지.

### 남은 과제 (v0.5.14+)
- MOLE·RIGGER 6%·3%로 여전히 저조 — 효과 폴백 금액 상향 or 클래스 전용 보너스
- AXIOM 7.5% — V 속성 공급 구조 개편 필요
- 11×11 맵 시뮬레이터 구현 (현재는 데이터만)

---

## [0.5.12] — DRIFTER 너프 + 전역 이동 수치 재조정 + BROKER 복구 (2026-04-23)

### 발견
v0.5.11 시뮬 결과 DRIFTER 47%로 여전히 톱, BROKER 9%로 저조. 사용자 피드백: "맵이 5×5로 작아서 이동 3+ 카드가 너무 강력". 시뮬 + 피드백 교차 검증.

### 변경
- **DRIFTER 스탯 너프**:
  - HP 9 → 8
  - ATK 4 → 2 (레이드 성공률 84% → 67%)
- **전역 이동 카드 수치 max 2 통일** (5×5 맵 기준 과도한 커버리지 제거):
  - `FAST_TRAVEL` 이동 3 → 2
  - `STORM_RUSH` 이동 3 → 2 (대신 atk 2 추가로 공격성 유지)
  - `GHOST_RUN` 이동 3 → 2
  - `IRON_WHEELS` 이동 2 → 1 (방어 def 2는 유지)
- **BROKER 렙 수급 재조정**:
  - `extort` 보상: rep 2x + credit 2x → rep 1.5x(올림) + credit 1x (오버버프 방지)
  - `BLACKMAIL` top.extort 1 → 2, bot.extort 2 → 3
  - `NETWORK` top에 extort 1 추가 + contact 값 상향
- **평판 루트 승리 임계 18 → 20** (너무 빨리 도달하는 것 방지)

### 결과 (400판 시뮬)

| 지표 | v0.5.11 | v0.5.12 | 변화 |
|---|---|---|---|
| DRIFTER 승률 | 47% | 47% | — (nerf 했지만 AI 편애 지속) |
| BROKER 승률 | 9% | 22.4% | +13.4pt (복구) |
| CIPHER | 19.4% | 16.4% | -3pt |
| HELIX | 20% | 22.5% | +2.5pt |
| CARBON | 10% | 7.5% | -2.5pt |
| 평균 라운드 | 3.74 | 3.77 | ≈ |

DRIFTER는 레이드 성공률 하락에도 이동 우위와 AI 선호 편향으로 여전히 47%. 다만 BROKER(22%)·HELIX(22%)가 추격권 내 들어옴. 실제 사람 플레이에서는 전략 다양화로 격차 더 줄어들 가능성.

### 남은 과제 (v0.5.13+)
- Bloc 전체 P0 승률 12%로 Ghost 28.5% 대비 열세 — Bloc 경제 시스템 강화 필요
- AXIOM 10%, CARBON 7.5% 여전히 저조 — V 속성 공급 구조 재설계
- DRIFTER AI 편애 제거 — scoreGhostCard에서 이동 가중치 재조정 또는 맵 크기 변경

---

## [0.5.11] — 경제·공용 시스템·카드 밸런스 종합 패스 (2026-04-23)

### 방법론
v0.5.10 하네스로 추가 200판·400판 시뮬 돌려 경제·뉴스·클래스별 세부 불균형을 식별하고 동시 조정.

### 주가 경제 재설계
- **시작 주가 10 → 8**: 진입 장벽 완화, 초반 매수 유입 유도
- **Bloc 자산 목표 60 → 50**: 낮은 시작가에 맞춰 조정 (UI·reducer·승리 패널 전부 반영)
- **거래 변동 민감도 2주 → 3주**: 개별 소액 거래는 주가 고정, 대량 거래만 시장 움직임

### 🏪 공용 상점 시스템 (신규)
Phase 1 시장 페이즈에서 캐릭터와 무관하게 누구나 이용 가능한 6종 서비스:

| 상점 | 비용 | 효과 |
|---|---|---|
| ❤️ 의료 | ₵5 | HP 완전 회복 |
| 🔩 무기상 | ₵4 | 무기 +2 |
| 📡 정보상 | ₵3 | 데이터 +2, 렙 +1 |
| 💸 뇌물 | ₵3 | 수배 -2, 공권력 -1 |
| 🎯 현상금 청구 | ₵4 | 렙 +2 |
| 🪖 용병 영입 | ₵6 | 무기 +3, 부품 +1 |

봇도 상황별 AI로 자동 구매 (HP 낮으면 의료, 수배 높으면 뇌물, 렙 부족하면 현상금 등).

### 카드 밸런스
- **DRIFTER 너프**: `FAST_TRAVEL` top.move 4→3, `STORM_RUSH` top.move 5→3 (이동 편중 완화)
- **CIPHER 버프**: `PORT_SCAN` 에 peek_news + sell_info 추가 (렙·데이터 동시 생성)
- **CARBON·HELIX·AXIOM Bloc 카드 폴백 효과 11종 구현**:
  - `zone_income_2x`/`div_2x` → 즉시 크레딧 (구역수×3)
  - `zero_income`/`block_resource` → 랜덤 적 크레딧 -3
  - `fortify`/`veil_up` → 자사 전 구역 방어+1
  - `heal_all` → Ghost 전원 HP+3
  - `ghost_extra_card`/`contracts_boost` → 크레딧+3, 데이터+1
  - `same_round_trade`/`flash_trade` → 크레딧+4
  - `algorithm`/`long_contract` → 크레딧+6, 인플루언스+2
  - `bond` → 크레딧+N
  - `destroy_zone` → 타 블록 구역 1곳 파괴
  - `remove_scandals`/`clear_ghost_wanted` → 렙+2
- **scoreBlocCard 확장**: 신규 효과 13종의 AI 평가 가중치 추가 (Bloc AI가 공격적 카드 선호)
- `p.pool` 레퍼런스 수정 (이전 `state.pool` → 개인 풀 반영)

### 뉴스 이벤트 극단값 완화
- `주식 시장 대폭락` all_stock -4→-3
- `월가 붐` +3→+2
- `루머 확산` -5→-3
- `인수합병 열풍` all_stock +2→+1, 크레딧 +4→+3
- `내부자 고발` random_crash -8→-5
- **Ghost-favorable 뉴스 5종 추가** (total 35→40):
  - 시민 저항 집회 (all_rep+2, heat-1)
  - 블록 스캔들 폭로 (all_stock-2, all_rep+1)
  - 지하 정보망 활성화 (Ghost credit+3, data+1)
  - 경찰 부패 수사 (heat-3, wanted_all-1)
  - 고스트 영웅 서사 (all_rep+3)

### 결과 (400판 시뮬 · v0.5.9 대비)

| 지표 | v0.5.9 | v0.5.11 | 변화 |
|---|---|---|---|
| 평균 라운드 | 2.86 | 3.74 | +31% |
| DRIFTER 승률 | 62.5% | 47% | **-15.5pt** (nerf 성공) |
| CIPHER | 17.6% | 19.4% | +1.8pt |
| CARBON | 5% | 10% | +5pt |
| BROKER | 0% | 9% | +9pt (부활) |
| HELIX | 10% | 20% | +10pt |
| VANTA | 10% | 17.5% | +7.5pt |
| IRONWALL | 0% | 12.5% | +12.5pt |
| AXIOM | 20% | 5% | **-15pt** (V 속성 공급 부족) |

### 남은 과제 (v0.5.12+)
- AXIOM: HQ 구역이 M 주력(데이터허브)이라 V 속성 부족. AXIOM 시작 지원 구역 중 하나를 V 생산 구역으로 교체 검토
- DRIFTER 여전히 47%로 톱 — 추가 조정 or 다른 클래스 승리 루트 다양화

---

## [0.5.10] — 헤드리스 배치 시뮬 기반 밸런스 패스 (2026-04-23)

### 방법론

봇 vs 봇으로 **200판 헤드리스 시뮬**을 돌려 승률·라운드·클래스 불균형 데이터를 수집하고 수정 반복. 하네스는 `/sim-harness/` 에 있음 (Node.js 전용, brainstorming / balance tool).

### 발견된 문제 (v0.5.9 기준)

1. **게임이 너무 짧음**: 평균 2.86R에 종료. 설계 의도(5~7R)의 절반
2. **BROKER 0% 승률** (0/17): 이론상 비전투 클래스인데 승리 조건이 전투 2회 강제
3. **DRIFTER 62.5%** 과강세: 이동 카드 과다
4. **미구현 효과 키 9개**: `contact`, `blackmarket`, `extort`, `peek_objective`, `broker_fee`, `scout_all`, `stop_combat` 등이 applyEffect에 없음 → BROKER/CIPHER/MOLE 카드 대부분이 "속성만 생성"하는 무효 카드

### 변경 (v0.5.10)

- **승리 조건 전면 조정**:
  - Bloc 자산 40 → **60** (튜토리얼)
  - Ghost **듀얼 경로** 신설:
    - 전투 루트: 렙 14 + 레이드 2
    - 평판 비대칭 팩션형 (신규): 렙 18 단독 (레이드 0~∞)
- **라운드 상한 8 → 10**
- **미구현 효과 키 16개 구현** (applyEffect 폴백 보상):
  - `contact`: 인플루언스 + 크레딧
  - `blackmarket`: 무기 + 크레딧
  - `extort`: 렙 ×2 + 크레딧 ×2 (BROKER 렙 루트 주력)
  - `peek_*`/`sell_info`: 렙 +2~3, 데이터 +2~3
  - `broker_fee`: 크레딧 + 렙
  - `scout_all`/`drone_scan`: 데이터
  - `stop_combat`/`cancel_*`: 렙 +2
  - `invisible`/`stealth`/`hide_actions`: 수배 -1, 렙 +1
  - `clear_wanted`/`burn_identity`: 수배 초기화
  - `heal`: HP 회복
  - `stat_boost`: 다음 판정 보너스 누적
  - `swap`/`swap_ratio`: 크레딧 +3
  - `draw_quest`/`quest_two`/`slot_plus`: 렙 + 크레딧
  - `deploy_trap`/`trap`: 현위치 요새화
  - `cargo_haul`/`supply_drop`: 크레딧 + 부품
  - `ambush`: 다음 판정+2 + 렙
  - `copy_bloc_card`: 크레딧 + 렙
  - `reward`: 크레딧 + 렙
- **scoreGhostCard 확장**: 16종 신규 효과의 AI 평가 가중치 추가 (BROKER/CIPHER/MOLE 카드를 AI가 제대로 선택)
- **승리 근접 휴리스틱**: 렙·레이드 목표 근접 시 공격/이동/협박 카드 점수 +10
- **UI 갱신**: 우측 승리 진척 패널 표기, 레이드 모달 즉시 승리 계산, 위협 대시보드 목표값 조정

### 결과 (200판 시뮬 기준)

| 지표 | v0.5.9 | v0.5.10 | 변화 |
|---|---|---|---|
| 평균 라운드 | 2.86 | 4.84 | +69% |
| 최대 라운드 | 5 | 9 | 10R 상한 활용 |
| BROKER 승률 | 0% | 9.1% | 부활 |
| CIPHER 승률 | 17.6% | 11.8% | (소폭 하향) |
| DRIFTER 승률 | 62.5% | 66.7% | 여전히 높음 (차후 과제) |

### 남은 과제 (v0.5.11+)

- DRIFTER 이동 3칸 카드 너무 강력 → 비용 부여 검토
- Bloc 전체 P0 승률 15% (Ghost 29% 대비 열세) — Bloc AI/경제 시스템 보강 필요
- CARBON 5% 최약 — 전용 카드 밸런스 재점검

---

## [0.5.9] — 플레이어간 인터랙션: 위협 대시보드 + Ghost PvP + 타겟 알림 (2026-04-22)

### Design Intent
"플레이어간 인터렉션이 많이 없는것같네" 피드백 대응. 상대 존재감 부각 + 직접 충돌 지점 추가.

### Added
- **위협 대시보드 (좌측 플레이어 카드 강화)**:
  - 각 플레이어의 승리까지 남은 수치 + 프로그레스 바
  - "⚠ 한 턴 남음" 배지 (렙 3 이하 남거나 자산 5 이하 남으면 자주색 글로우)
  - "🏆" 배지 (승리 조건 충족)
  - "🔴" 표식 (최근 P0를 공격한 플레이어)
  - 위협 수준별 카드 외곽선 색상 (자주=위험 / 노랑=경계 / 시안=기본)
- **⚔️ Ghost vs Ghost 결투 모달**: 두 Ghost가 같은 구역에 있을 때 P0에게:
  - 개략 승률 표시 (내 ATK vs 상대 DEF 기반)
  - 승리 시: 렙+2, ₵최대 3 탈취, 상대 HP-2
  - 반격 시: 내 HP-2
  - 무승부: 피해 없음 (공존)
  - [⚔️ 선제 공격] / [🕶 회피] 선택
- **🔴 타겟 당함 알림** (우상단 배너):
  - 봇이 P0를 레이드·용병 공격·Ghost 결투·Ghost 수배령 등으로 타격하면 알림
  - 공격자·효과 키·피해 내용 표시
  - 확인 버튼으로 dismiss

### Changed
- `pAfterMove.role === 'ghost'` 블록 이전에 PvP 검사 삽입 (레이드 판정보다 PvP 우선)
- 봇 Ghost 간 충돌은 자동 결투 (ATK+roll vs DEF+roll, 2점 이상 차이로 승패)

---

## [0.5.8] — Bloc 2카드 운용 + 공통 덱 10장 + 이동 카드 (2026-04-22)

### Design Intent
Bloc 피드백 "할수있는 행동들이 너무적네? 이동도안되네" 대응. Bloc이 한 턴에 카드 1장 + 자동 확장만 가능하던 구조에서 Ghost와 동등한 2장 플레이(main/side 조합) 체계로 확장.

### Added
- **모든 블록 공통 10장 카드 풀**:
  - BOARDROOM_MOVE (이사회 이동): main = 이동 2칸
  - MARKET_TRADE (시장 거래): main = 자동 2주 매수 (저가 우선)
  - HIRE_GHOST (고스트 고용): main = 타 Bloc 구역 랜덤 1곳 타격 (주가-3, 중립화)
  - ZONE_FORTIFY (구역 요새화): 현위치 방어 +1
  - EXPAND_OP (작전 확장): 인접 2구역 자동 점령
  - INVEST_HEAVY (대규모 투자): GRID 1 지불, 4주 자동 매수
  - COUNTER_INTEL (방첩): 뉴스 2장 미리보기 + 지도 3R 노출
  - CRISIS_RESPONSE (위기 대응): 공권력 -2, ₵+3
  - HOSTILE_BID (적대적 매수): 지정 블록 주가 -3 + ₵+4
  - SECURITY_SWEEP (치안 소탕): Ghost 전원 수배 +1
- **Bloc도 2장 플레이 + main/side 반쪽 선택** (Ghost와 동일 UI)
- **Bloc 손패 5장 → 6장**으로 증가

### Changed
- Bloc 덱: 고유 6장 + 공통 10장 = 16장
- 봇 Bloc AI도 상위 2장 선택
- Bloc 결과 확장: 일회성 요새화(fortified 플래그), 자동 매수, 용병 공격 등

---

## [0.5.7] — 결정감 대수정: 레이드 확정 모달·승리 예측·이동 셀 미리보기 (2026-04-22)

### Design Intent
"이기긴 하는데 왜 이겼는지 모르겠다"는 피드백에 대응. 자동화된 액션(auto-raid, auto-계산)을 사용자 결정 지점으로 전환해 "84% 확률에 베팅해서 이겼다"는 이야기가 만들어지도록 설계.

### Added
- **🗡️ 레이드 결정 모달**: Ghost(P0)가 Bloc 구역 도착 시 자동 레이드 대신 모달 팝업으로:
  - 성공 확률 바 (66%+ 녹색, 33~65% 노랑, 33% 미만 자주)
  - d6 + ATK ≥ threshold 수식 표시
  - "성공 시" 박스: 렙+3, 주가-3, 중립화, 수배+1 · 즉시 승리 가능 시 🏆 배지
  - "실패 시" 박스: HP-3, 수배+1, 공권력+1 · 전사 위험 시 ⚰️ 배지
  - [🗡️ 레이드! (XX%)] / [🕶 물러나기 (피해 없음)] 이분 선택
- **🎯 승리 패널 전술 예측**: Ghost 패널에 "가장 가까운 Bloc 구역, 거리, 레이드 성공률" 표시. "한 턴 남음" 조건 충족 시 자주색 글로우 + 배지
  - 예: "C1 레이드 성공 시 즉시 승리 (성공률 84%, 거리 2칸)"
- **🔍 이동 셀 미리보기 태그**: 이동 목표 선택 화면에서 각 도달 가능 셀에:
  - Bloc 소유 → `🗡️ 84%` (레이드 성공률, 색깔로 위험도)
  - 빈 구역 + 미방문 → `🌟 보너스` (첫 방문 드래프트 가능)
  - 내 땅 → `🏠 내 땅`
  - 방문 완료 → `✓ 방문`
  - 셀 외곽선도 예상 결과에 맞춰 색상 변경
- `bfsDistance` 헬퍼 (두 좌표 간 최단 거리)

### Changed
- 봇(Ghost)은 기존 자동 레이드 유지 (속도 & 봇 AI 단순화)
- P0 레이드는 `pendingRaid` 상태에 저장 → 사용자가 선택할 때까지 대기

---

## [0.5.6] — 카드 반쪽 선택 + 시장 거래 + 뉴스 강화 (2026-04-22)

### Added
- **카드 TOP/BOT 명시 선택 UI**: 2장 선택 후 각 카드의 상단/하단 영역을 클릭해 실제로 발동할 반쪽 전환. 시안=top, 노랑=bot 외곽선으로 시각 확인. 기본값은 "카드1=top, 카드2=bot" 유지.
- **시장 페이즈 주식 거래 UI**: Phase 1에서 주가 박스에 매수(녹)/매도(자주) 버튼. 1주 단위, 자기 블록 주식은 거래 불가. 시장 단계는 "거래 끝" 버튼을 눌러야 계획 단계로 진행.
- **봇 간이 AI 거래**: 봇은 저가 주식(≤7)을 매수, 고가(≥15) 보유분을 매도. 거래량이 2주 이상이면 주가도 ±1 변동.
- **뉴스 카드 15장 → 35장 확장 + 효과 키 대폭 추가**:
  - 시장 충격 6종 (all_stock·random_crash·stock_freeze 등)
  - 블록별 호재/악재 8종 (target_stock 기반)
  - 공권력/치안 5종 (heat·wanted_all)
  - 자원/지원 6종 (all_credit·target_credit·all_weapons/parts/data)
  - 정보/시그널 3종 (signal_lock·map_reveal)
  - Ghost/Bloc 비대칭 4종 (all_rep·wanted_all)
  - 이동/맵 3종 (ghost_move·random_zone_flip)

### Changed
- 카드 실행 순서: `top → bot` 보장 (같은 반쪽 선택 시 선택 순서)
- NEXT_ROUND에서 `plannedHalves` 초기화

---

## [0.5.5] — Ghost TL 재조정 + 승리 진척 패널 + 구역 첫 방문 드래프트 (2026-04-22)

### Fixed
- **Ghost TL 진척 불균형**: 기존 공식(`구역 + ⌊풀/2⌋ + 레이드`)에서는 Ghost가 구역을 소유하지 않아 Bloc 대비 5~10배 느렸음 → 역할별 공식 분리
  - Ghost: `⌊렙/3⌋ + 레이드×2 + ⌊풀/2⌋` — 렙 축적과 레이드로 자연 누적
  - Bloc: `구역 + ⌊풀/2⌋` (유지)

### Added
- **🎯 승리 진척 패널 (상시 표시)**: 우측 최상단에 내 역할 기준 목표 대비 현재 진척도를 프로그레스 바·다음 행동 힌트와 함께 노출
  - Ghost: 렙 X/10 · 누적 레이드 Y/1 (튜토리얼 기준)
  - Bloc: 자산 X/40 + "구역 N곳 확장 또는 주식 매수" 같은 실행 팁
- **🌟 구역 첫 방문 3중 1 드래프트**: 처음 밟는 구역마다 해당 구역 성격에 맞춘 3개 옵션 중 하나를 선택해 일회성 보너스 획득 (모달 팝업)
  - 폐허: 부품+2 / 속성A / 현상수배-1
  - 주택가: ₵+3 / GRID / 드로우 1
  - 금융가: ₵+5 / 주식 할인 매수 / 렙+1
  - 데이터허브: 데이터+2 / 드로우 2 / 뉴스 미리보기
  - 의료: 회복 3 / 풀회복 / 속성B
  - 공업: 부품+3 / 무기+1 / 속성V
  - 무기고: 무기+2 / 다음 판정 +2 / 속성I
  - 유흥가: ₵+4 / 인플루언스+1 / 속성S
  - 항구: ₵+2 / 무기+1 / 다음 턴 이동+2
  - 경찰서: 수배-2 / 공권력-1 / 지도 3R 노출
  - NEXUS: 전속성+1 / ₵+5 / 렙+3
  - 넥서스부속: ₵+2 / GRID / 랜덤속성+2
- Ghost 도착 자동 레이드 발생 구역에서는 보너스 드래프트 스킵 (이중 보상 방지)

---

## [0.5.4] — TL 시스템 + LocalStorage 히스토리 (2026-04-22)

### Added
- **⚡TL(테크 레벨) UI**: 플레이어 카드에 현재 TL·tlProgress / 승급비용 표시
- **R&D 페이즈 복구**: Phase 5(R&D) 자동 진행 — `구역수 + ⌊풀½⌋ + (Ghost 한정) 누적 레이드` 만큼 tlProgress 축적, 비용 도달 시 TL↑
- **TL 승급 비용표**: 1→2=4pt, 2→3=7pt, 3→4=10pt, 4→5=14pt
- **LocalStorage 플레이 히스토리**: 게임 종료 시 자동 저장 (최근 50판)
  - 시작 화면에 총 판수·승률·최고 렙·최고 자산·최고 TL 요약
  - 판별 상세 로그: 일시·결과·클래스·라운드·렙/자산·레이드·TL·업적·사유
  - 초기화 버튼 (확인 프롬프트)
- **"메뉴 & 히스토리" 버튼**: 게임 종료 화면에서 셋업 화면으로 돌아가 히스토리 확인 가능

### Changed
- 게임 종료 화면 버튼 3개로 확장 (다시 / 메뉴 & 히스토리 / 로그 복사)

---

## [0.5.3] — 시뮬레이터 UX 대수정 (2026-04-22)

### Added
- **클릭-이동 UI**: 인간 플레이어가 이동 카드를 내면 BFS 반경 내 도달 가능 칸이 노란 ◎ 로 하이라이트되고, 직접 클릭해 목적지 선택 가능 ("AI에게 맡기기" 버튼도 제공)
- **매턴 변화 요약 패널**: 실행 단계 직후 우측 패널에 P0~P3 각자의 HP/렙/₵/자산/구역/수배/이동/속성 풀 ± 차이를 컬러로 표시
- **도착 시 자동 레이드** (Ghost): atk 없는 이동 카드라도 Bloc 소유 구역에 발을 디디면 d6+atk ≥ 5 판정으로 레이드 시도 → Ghost가 카드로 레이드에 묶이지 않고 순수 기동으로도 렙/레이드 적립 가능
- **게임 종료 후 로그 잔존**: 승리/패배 화면에 전체 로그 패널 유지 + 클립보드 복사 버튼

### Changed
- **속성 풀 공용 → 개인 풀**: 각 플레이어가 자기 M/I/V/S/B/A/GRID 풀을 독립 운영. 매 라운드 ½ 감쇠 (올림). 공용 풀 혼선 해소
- **자산 계산**: 자기 블록 주식 완전 제외 (기존 50% 할인), 크레딧 제외 — Bloc 승리를 타 블록 주식 매수·구역 확장·M&A 중심으로 재정렬
- **승리 기준 (튜토리얼)**: 자산 25 → **40**, 라운드 상한 6 → **8**
- **손패 리필**: NEXT_ROUND 마다 덱에서 부족분 자동 보충 (Ghost 6장, Bloc 5장)
- **Bloc 패시브 확장**: 수익 단계에서 자동으로 인접 빈 buildable 구역 1개 점령

### Fixed
- LEVERAGE 카드 `info: 1` 구문 오류 (`+ 'info'` 오작성)
- `startSimulation` 버튼이 null 상태에서 진행 안 되던 문제
- `effect.move = 3` 인데 실제로는 1칸만 이동하던 버그 — 스텝 루프 전체를 실제로 반복하도록 수정
- Ghost 본인만 렙이 안 오르던 문제 (p.position 참조가 이동 전 좌표를 쓰고 있었음)

### UX
- 내 말(⭐) 현재 칸에 시안 3px 외곽선 + ★ 마커
- 로그에 `⭐ 당신` 접두어 자동 추가
- 카드-버튼 겹침 제거 (레이아웃 flex 재구성)
- 카드 한글명 매핑 (`CARD_NAMES_KR`) + 효과 요약 전체 한글화

---

## [0.5.2] — 교차참조 감사 & 리네이밍 (2026-04-22)

### Fixed
- **파일명 오타 수정**:
  - `docs/03-fractions-blocs.md` → `docs/03-factions-blocs.md` (fraction → faction)
  - `docs/11-event-quests.md` → `docs/11-events-quests.md` (복수형 통일)
- **폴더명 일관성**:
  - `cards/block/` → `cards/bloc/` (Bloc 게임 용어와 일치)
- **깨진 파일 참조 8건** 정정:
  - `docs/11-events-quests.md`의 `cards/quests/quest-deck.md` → `cards/events/quest-deck.md`
  - `cards/legacy/chapter-06`의 `03-fractions-blocs.md` → `03-factions-blocs.md`
  - `git_guide.md`의 `cards/quests/`·`cards/black-market/` → `cards/events/`
  - `docs/10-map-zones.md`의 `11-event-quests.md` → `11-events-quests.md` (3곳)

### Changed
- `git_guide.md` 상단에 **HISTORICAL** 마크 추가 — `dn_*`·`cartel_rulebook` 참조가 구형 Notion 아티팩트 식별자임을 명시
- docs 버전 태그 갱신:
  - `docs/01-worldbuilding.md` v0.2 → v0.3
  - `docs/02-core-rules.md` v0.2 → v0.3
  - `docs/03-factions-blocs.md` v0.2 → v0.4
  - `docs/11-events-quests.md` v0.2 → v0.4

### Audit Summary
- 총 파일 참조: 51개
- 깨진 참조: **0건** (실제 파일 기준)
- 의도된 미래 참조: 1건 (`playtesting/session-01-guide.md` — "(예정)" 태그)
- 히스토리 참조: 5건 (`dn_*`·`cartel_rulebook` — HISTORICAL 마크)
- 봉투 레이블 A~H: 전부 정확
- 레거시 챕터 prev/next 체인: 1~7번 모두 연결 (8번은 최종)
- 11×11 맵 시뮬레이터 확장 (v0.6)
- Bloc 덱 확장 (블록당 6 → 10장) + 드래프트 규칙
- 시나리오 S02~S06 시뮬레이터 지원
- 레거시 캠페인 확장 (v0.7+)

---

## [0.5.1] — 솔로 시뮬레이터 MVP (2026-04-22)

### Added
- **`simulator/v0.5/`** 디렉토리 신규 — 단독 플레이 검증용 웹 시뮬레이터
  - `index.html` — React 18 단일 HTML 엔드투엔드 게임 (~1400줄)
  - `README.md` — 설계 문서 + 사용법 + 검증 체크리스트
- **게임 루프 구현**:
  - 5×5 튜토리얼 맵 전체 연동 (25구역, 블록 HQ 배치, Ghost 시작 위치)
  - 7페이즈 턴 자동 진행
  - Ghost 2카드 TOP/BOTTOM 선택 + Bloc 1카드 Main
  - 공용 속성 풀 + 감쇠
  - 시그널 다이 (MESH UP/DOWN/SURGE/BLACKOUT)
  - 뉴스 15장 큐레이션 자동 드로우
  - 전투 판정 (d6 + 스탯 + 속성 보너스)
  - 레이드 성공/실패 처리
  - 주식 시장 + 자동 배당
  - 구역 수입 계산
- **6 Ghost 클래스 전체 덱** (60장 간소화 태그 구조)
- **5 Bloc 덱 전체** (30장)
- **역할 교체 가능** 셋업 화면 (12 옵션 중 선택)
- **3 봇 AI** (스코어 기반 카드 선택 + 휴리스틱)
- **숨은 목표 시스템** (10장 샘플, 각자 2장 비밀 배부)
- **싱글게임 업적** (10장, 선언 버튼)
- **튜토리얼 승리 조건** (자산 25 / 렙 10+레이드 1 / 8R 타임리밋)

### Design Decisions
- **단일 HTML** — 빌드 도구 없이 file:// 또는 정적 호스팅으로 실행
- **React via Babel Standalone** — CDN 기반, 설치 불필요
- **다크 사이버펑크 테마** — 기존 시뮬레이터 비주얼 계승
- **봇 결정 딜레이** (300~500ms) — 플레이어 관찰 시간 확보
- **로그 패널** — 모든 액션 기록, 최근 20줄 표시

### Known Limitations (v0.6에서 개선 예정)
- 카드 효과는 태그 기반 단순화 (텍스트 해석 미구현)
- 인간 이동 UI 없음 (자동 랜덤 이동)
- 주식 거래 UI 없음 (뉴스 이벤트로만 변동)
- M&A 미구현
- 11×11 맵 미지원
- S01만 지원 (시나리오 시스템 UI 미포함)
- 메타 업적 추적 없음 (세션 단위 리셋)

### Usage
1. `simulator/v0.5/index.html` Chrome/Safari 열기
2. 역할·클래스 선택 → START
3. 7페이즈 진행 관찰, 계획 단계에서 카드 선택
4. 발견한 밸런스 이슈는 Notion 밸런스 이슈 DB에 기록

---

## [0.5.0] — 리플레이성 4층 시스템 (2026-04-22)

### Added

**기본 게임 리플레이성 완성**. 4층 변주 시스템으로 매 판 완전히 다른 경험:

- **🎲 시나리오 시스템** (`docs/14-scenarios.md`)
  - 6개 공식 시나리오: S01 표준 · S02 코프 대전 · S03 스트리트 라이징 · S04 계엄의 밤 · S05 골드러시 · S06 마켓 크래시
  - 각 시나리오 시작 조건·특수 규칙·플레이 시간 차별화
  - 커스텀 시나리오 가이드
- **🎯 숨은 목표 시스템** (`docs/15-hidden-objectives.md`)
  - Bloc 20장 + Ghost 20장 = 40장 비밀 목표 덱
  - 난이도 3단계 (🟢 쉬움 / 🟡 보통 / 🔴 어려움)
  - 5종 대체 승리 카드 포함 (Bloc 3 + Ghost 2)
  - 카테고리: 경제·정치·기술·파괴·비밀 / 복수·축적·정체성·도망·카르마
- **🏆 싱글게임 업적** (`docs/16-achievements.md`, `cards/achievements/in-game.md`)
  - 35장 (브론즈 20 + 실버 10 + 골드 5)
  - 한 판 내부 공개 도전. 선착순 달성
  - 메타 포인트 적립 (1/2/5pt)
- **🎖 메타 업적** (`cards/achievements/meta.md`)
  - 25장 여러 판 누적 수집 시스템
  - 카테고리: 🎓 마스터리 8 + 🏆 트로피 6 + ⚡ 극한 6 + 📚 컬렉션 3 + 💀 어두운 훈장 2
  - 포인트 타이틀: CASUAL → DEDICATED → MASTER → LEGEND → ARCHITECT

**프린트킷 확장 (v0.4.1 → v0.5)**:
- `print-kit/09-scenarios.html` — 시나리오 카드 6장 (A4 2매)
- `print-kit/10-objectives.html` — 숨은 목표 40장 (A4 5매)
- `print-kit/11-achievements.html` — 싱글+메타 업적 참조 시트 + 플레이어 프로필 (A4 3매)

### Design Philosophy

**4층 스태킹**:
```
🎖 메타 업적 (계정 평생)
🏆 싱글 업적 (한 판 공개)
🎯 숨은 목표 (한 판 비공개)
🎲 시나리오 (판 시작 조건)
```
각 층은 독립 ON/OFF. 입문 = 모두 OFF. 정규 = 전부 ON.

### Changed
- 기본 게임 승리 조건에 "숨은 목표 대체 승리" 옵션 추가
- Ghost/Bloc 덱 선택 시 클래스 모순 리드로우 권장 규칙

### Documentation
- `docs/14-scenarios.md` 신규 (6 시나리오 상세)
- `docs/15-hidden-objectives.md` 신규 (시스템 + 40장 index)
- `docs/16-achievements.md` 신규 (싱글+메타 통합)
- `cards/objectives/bloc.md` + `cards/objectives/ghost.md` 신규
- `cards/achievements/in-game.md` + `cards/achievements/meta.md` 신규

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
- `docs/11-events-quests.md` — 토큰 구성 2 사이즈 버전
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
  - Ghost: 2카드 TOP/BOTTOM형 2카드 TOP/BOTTOM 액션, [LOSS] 소각 카드
  - Bloc: 덱빌딩+사이드웨이형 덱빌딩, 사이드웨이 플레이, 콤보 조합
  - 교차점: Ghost-Bloc 계약 시 카드 1라운드 임대 가능
- **6속성 마나형 6속성 시스템**
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
- Ghost 전투 시스템을 단순 d6에서 2카드 TOP/BOTTOM 방식식 이니셔티브로 변경
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
- 파일·문서 전체에서 동명 라이선스 게임 용어 제거

### Removed
- 동명 외부 IP, Cyberware, Night City, ICE, MegaCorp 등 저작권 위험 용어

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
