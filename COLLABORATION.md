# DEAD NEXUS — 협업 인수인계 문서 (Claude ↔ Codex)

**버전**: v6.46 기준 (2026-07-26)
**정본 원칙**: 이 리포지토리(GitHub `KOYUBIN/Dead_Nexus`, 브랜치 `main`)가 코드·규칙·작업 상태의 유일한 정본. Notion은 운영 거울(허브·밸런스 이슈 DB·협업 현황). 불일치 시 Git 우선.
**라이브**: https://dead-nexus.vercel.app (Vercel, main 자동 배포 — 머지 = 배포)

---

## 1. 프로젝트 개요 — 3트랙 체제 (2026-07-17 유저 확정)

사이버펑크 도시 **애시그리드(2091)** 세계관을 공유하는 3개 독립 트랙. 룰은 트랙별 독립.

| 트랙 | 위치 | 지위 | 상태 |
|---|---|---|---|
| 🎮 **전략 시뮬레이션** | `simulator/v0.5/` | 기함 | 시나리오 S01~S06 · 레거시 캠페인 8챕터 완결 · 협상 페이즈 · M&A · 공매도 · 레이스 HUD + NEXUS BAR |
| ⚔ **RPG — ASH & SIGNAL** | `rpg/` | 신설 (이번 스트레치에 0→완성형) | 미션 32종 · 6클래스 · 4엔딩+NG+ · Act 2 4갈래+캡스톤 · 장비/인텔 경제 · 아이소 뷰 · 픽셀 아트 · 사운드 · 오브젝티브 다양성 |
| 🖨 **보드게임 (프린트 킷)** | `print-kit/` | **v1 스냅샷 동결** | 세션 00 스코프(3~4인 대면) — 디지털 안정 후 재개 예정 |

홈 포털: 루트 `index.html` (트랙 카드 + 저장 진행 배지). 전 트랙 **외부 의존 0** (CDN·폰트 없음, vendor 로컬) · `file://` 더블클릭 호환 · 모바일 세로 우선.

---

## 2. 진행 로그 (v6.26 → v6.46, 2026-07-17 ~ 07-26)

상세는 `CHANGELOG.md`(정본). 요약 타임라인:

| 버전 | 내용 |
|---|---|
| v6.26 | 레이스 HUD (계기판 정직화) · print-kit 테이블 v1 · docs/14 현행화 |
| v6.27 | highlightPoints 승리 환산(B-06) · 선언 역전 재측정(B-07 기해소 확인) |
| v6.28 | NEXUS BAR 하단 상태 바 · 전체 검수 39건 정정 (P0 스텁 서빙 픽스 포함) · docs/25 RPG 비전 |
| v6.29 | **RPG 트랙 신설** — 챕터 1 수직 슬라이스 (GHOSTGRID 아키텍처) |
| v6.30 | 홈 포털 + 트랙 간 ⌂ 내비 |
| v6.31 | B-08 언더독 재튜닝 (밸런스 DB 클로즈) |
| v6.32 | RPG Stage 2 (BLADE·위협 게이지·시그널 다이) · 레거시 챕터 2 |
| v6.33 | **RPG 미션 팩토리** 1→16종 (미션 보드·순차 해금) · 레거시 챕터 3 (S04 미배선 완전 해소) |
| v6.34 | RPG 4클래스 (RIGGER·MOLE) — 64조합 완주 매트릭스 · 레거시 챕터 4 |
| v6.35 | **RPG 밸런스 하네스** (_balance.js — 클리어 불가 3·트리비얼 7 적발·보정) · 레거시 챕터 5 |
| v6.36 | 아이소메트릭 뷰 (projection seam, 룰 무변경 byte 증명) · 레거시 챕터 6 |
| v6.37 | **접속 안정화** — unpkg CDN 제거·부트 스플래시·실패 가시화 (유저 접속 문제 대응) |
| v6.38 | 장비 상점 10종 + 정보상 인텔 (write-only ₵ 해소) · 전 트랙 그래픽 대격변 |
| v6.39 | **레거시 캠페인 8/8 완결** (챕터 7~8 + 완주 배지) |
| v6.40 | RPG 4엔딩 + New Game+ (엔딩 기록 이월·허브 뱃지) |
| v6.41 | docs/25 현행화 (계획 대비 이탈 7건 정직 각주) |
| v6.42 | 픽셀 아트 — Kenney 1-Bit Pack CC0 (17장 2.6KB·이모지 폴백) |
| v6.43 | **RPG Act 2 "AFTER ZERO DAY"** — 미션 16→29 (엔딩 4갈래 후일담 2연전·클래스 개인 서사·MERIDIAN 신규 세력·하드모드) |
| v6.44 | 캡스톤 최종 결전 + 심연 프로토콜(무한 웨이브) · **시뮬 협상 페이즈** (docs/17 원전 배선·B-04 클로즈) · 사운드 (Kenney CC0 23종) · 홈 진행 배지 |
| v6.45 | **RPG 6클래스 완성** — BROKER·DRIFTER 플레이어블 승격(미션 32종·밸런스 252조합) · 시뮬 계기판 정직화 · 홈 PWA · 접근성 |
| v6.46 | 자율 업데이트 1차분 — **오브젝티브 다양성**(생존형 `survive:N`·HACK 전용 코어) · **S06 재건왕/청산자 타이틀** 배선 · **B-01 기각 종결**(S03 2-레버 전수 측정) · S05 뉴스 매R 2장 배선 · MOLE HELIX 태그 |

---

## 3. 개발 원칙 (위반 금지 — 전 스트레치에서 검증된 규율)

1. **창작 통제**: 룰·수치·서사는 원전(docs/·cards/) 근거 필수. 계보 태그 `[그대로/계승/각색/신규]`를 코드 주석·미션 데이터에 유지. 원전에 없는 시스템은 **No-op 정직 보고** (조용히 생략 금지).
2. **계기판 정직화**: UI 표시값 = 판정 코드 단일 소스. 시뮬 = `getVictoryGoals`/`evalPlayerVictory`/`hudRaceProgress`. RPG = 세이브 파생만 표시. 독자 임계값 하드코딩 금지.
3. **측정 게이트**: 밸런스 변경은 측정 필수. 시뮬 = sim-e2e n=300+, **S01 11×11 ghost 40~60% 밴드**. RPG = `_balance.js` 전 조합 클리어 가능 + 챕터 난이도 램프. 무효 노브는 데이터와 함께 기각 기록 (기각도 정상 결과 — 선례 7건).
4. **조용한 실패 금지**: 자산/모듈 로드 실패는 가시화 (부트 스플래시 실패 UI·이모지 폴백·typeof 가드는 무해화지 은폐가 아님).
5. **하위 호환**: 세이브(dn_rpg·dn_legacy_v1) 스키마 변경 시 마이그레이션 + 구세이브 유닛. 모듈 외부 시그니처 불변 (옵셔널 필드 확장만).
6. **엔진 순수성 (RPG)**: `systems/combat/`·`data/`에 DOM/React 참조 0 (grep 게이트). 전투는 결정론 (Math.random/Date.now 금지). 사운드·그래픽은 표시층 훅만.
7. **라이선스**: 외부 자산은 **CC0만** (현재 전부 Kenney). 증빙을 `*/LICENSE.md`에 기록 (팩명·URL·원문 인용·일자).
8. **FROZEN**: `sim-harness/core.js` 수정 금지 (헤드리스 회귀 기준).

---

## 4. 검증 인프라 — 머지 전 필수 게이트

```bash
# 시뮬레이터 (327 유닛)
cd sim-e2e && node _unit.js                 # ALL PASSED 필수
node run.js 5 5x5                            # e2e 스모크 — errors (none)
node run.js 300 11x11                        # 밸런스 측정 (밴드 확인용)

# RPG (271 유닛 + 검증기 + 하네스)
node rpg/_unit.js                            # PASS 전수
for f in rpg/data/missions/*.js; do node rpg/_missions_check.js "$f"; done   # 30/30
node rpg/_balance.js --smoke                 # 결정론 재현 8/8
node rpg/_balance.js                         # 전 조합 클리어 (160/160)

# 공통
node -c <모듈>                               # 문법
# babel: /tmp/node_modules/@babel/core 로 index.html 최대 text/babel 블록 transformSync (preset-react)
# Playwright: /opt/pw-browsers/chromium (playwright install 금지 — vendor 오프라인 주입)
```

`sim-e2e/results/`는 gitignore (리포 비대화 방지 — 대표 수치는 CHANGELOG/다이제스트에 기록).

---

## 5. 협업 규칙 (Git 흐름)

1. `main` 직접 푸시 금지 — 별도 브랜치 → PR → **Vercel 상태 success 확인 후** 스쿼시 머지 → 브랜치를 main에 동기화.
2. 커밋·PR에 검증 결과 명기 (유닛 수·측정치·에러 0). CHANGELOG `[Unreleased]`→릴리스 이력에 버전 항목 추가.
3. **파일 도메인 분리로 병렬 작업**: simulator/ ↔ rpg/ ↔ 루트/docs는 독립 — 서로 다른 도메인이면 동시 작업 안전. 같은 파일(특히 각 트랙의 index.html)은 반드시 순차.
4. 머지 후 Notion 거울 갱신 (허브 "현재 버전"·밸런스 이슈 DB·협업 작업현황) — 연결 안 되면 `playtesting/balance-issues-digest.md`의 "Notion 동기화 대기" 섹션에 명세만 남겨도 됨 (다음 연결 세션이 적용).

---

## 6. 목표 & 로드맵

**확정 방향** (유저 결정): 전략 시뮬 = 기함 · RPG = BG3/섀도우런 스코프 완성형 유지·심화 · 보드게임 = v1 동결 후 추후 재개.

**단기 (실플레이 피드백 대기 — 최우선 입력원)**
- 유저 실플레이 → 난이도·재미·UX 피드백 수집이 다음 사이클의 재료
- 밸런스 DB 잔여 B-01~B-05 전부 "인간 플레이 데이터 필요" 상태 (봇 측정 한계 도달)

**중기 후보 (원전 소재 남아 있음)**
- RPG: 챕터별 신규 무대 확장 · BROKER/DRIFTER 플레이어블 승격 (data-only 휴면 중) · 심연 프로토콜 리더보드류
- 시뮬: docs/17 잔여 시스템 점검 (NEXUS 동적 컨트롤 등 부분 배선분 심화) · S03 avgR 구조 트레이드오프 재도전 (B-01)
- 보드게임 재개 시: 오토마 덱 설계 (봇 3인 테이블 번역) · 세션 00 실시 · docs/24 ⚠️ 8종 기법

**항시**
- 유닛·검증기·하네스 게이트 유지 (총 598 유닛 + 30 미션 검증 + 160 조합)

---

## 7. 개선사항 / 알려진 이슈

| # | 항목 | 상태 |
|---|---|---|
| B-01 | S03 평균 라운드 7.59 (기준 8~11 미달) | 구조적 트레이드오프 — 단일 레버 공집합 실증. 실플레이 후 재판단 |
| B-02 | S04 전원 구출률 0% | 의도된 희소성 — 관찰 유지 |
| B-03 | MOLE 위장 발각 0회 (e2e) | 인간 경로 배선됨 — 실플레이 확인 대기 |
| B-05 | 언더독 스케일링 실플레이 검증 부재 | 봇 측정만 완료 |
| — | RPG ch07 "3R 연속 NEXUS 장악"은 종료 장악으로 근사 (레거시 챕터 7) | 정밀 카운터는 시뮬 엔진 死필드 — 필요 시 카운터 신설 검토 |
| — | MOLE 위장 태그는 VANTA/IRONWALL/AXIOM 3종 (HELIX/CARBON 태그 게이트는 회색 폴백) | 확장 검토 가능 (`rpg/data/classes.js`) |
| — | 시뮬 index.html 단일 파일 ~9,000줄 | 작동엔 문제없으나 편집 시 앵커 텍스트로 위치 탐색 권장 (라인 번호 금방 어긋남) |

전체 이슈 이력: `playtesting/balance-issues-digest.md` (해결 12건 포함, Notion 동기화 정본).

---

## 8. 핵심 파일 맵

```
index.html                     홈 포털 (순수 HTML/CSS+최소 JS, 진행 배지)
CHANGELOG.md                   릴리스 정본 (v6.x 전 이력)
COLLABORATION.md               이 문서
vercel.json                    배포 설정 (trailingSlash·리다이렉트·캐시)
simulator/v0.5/
  index.html                   메인 앱 (React+Babel 단일 파일) — 리듀서·SCENARIOS·VICTORY_GOALS·협상·HUD
  euro_module.js               M&A·견제·시그니처·마일스톤 (외부 시그니처 불변)
  legacy_module.js             레거시 캠페인 영속 (dn_legacy_v1, 챕터 1~8)
  tutorial_module.js / lore_module.js   튜토리얼 / 인물·명대사
  vendor/ audio/               로컬 react·babel / CC0 SFX (+LICENSE.md)
rpg/
  index.html                   셸 + UI (단일 text/babel 블록 — file:// 제약상 인라인)
  state/store.js               리듀서·씬 라우터·buildCombat (멀티 인카운터·하드모드)
  state/save.js                dn_rpg 세이브·마이그레이션
  systems/combat/{grid,resolve,ai}.js   순수 전투 엔진 (DOM 0·결정론)
  systems/{campaign,dialogue,character,ending,abyss}.js  해금 그래프·게이트·karma·엔딩·심연
  data/missions/ (30)          미션 = 데이터 파일 1개 원칙
  data/{classes,abilities,enemies,gear,...}.js
  core/{projection,sound,loader}.js     아이소 seam · 사운드 · 자가복구 로더
  assets/ (sprites·audio·LICENSE.md)    CC0 자산
  _unit.js / _missions_check.js / _balance.js   검증 3종
sim-e2e/                       Playwright 측정 러너 (+_unit.js)
sim-harness/                   헤드리스 (core.js FROZEN)
docs/ (00~25)                  설계 원전 · 연구 (21~24) · RPG 비전 (25)
cards/                         카드·레거시 챕터 원전
playtesting/balance-issues-digest.md   이슈 DB + Notion 동기화 정본
```

---

*작성: Claude (2026-07-21, v6.44 머지 직후). 갱신 규칙: 큰 마일스톤마다 §2 로그·§6 로드맵·§7 이슈를 현행화하고, 세부는 CHANGELOG에 위임.*
