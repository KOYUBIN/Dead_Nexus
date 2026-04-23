# CHANGELOG

DEAD NEXUS 프로젝트의 모든 주요 변경사항을 기록합니다.  
형식: [Keep a Changelog](https://keepachangelog.com/)  
버전 체계: [Semantic Versioning](https://semver.org/) 준용

---

## [Unreleased] — 작업 중

### Planned
- 11×11 맵 시뮬레이터 확장 (v0.6)
- Bloc 덱 확장 + 드래프트 규칙

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
    - 평판 루트 (신규): 렙 18 단독 (레이드 0~∞)
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
