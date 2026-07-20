# DEAD NEXUS — RPG 모드 (GHOSTGRID / hybrid-scene)

**정본 스펙**: `docs/25-rpg-mode.md` (심사 만장일치 확정 아키텍처 + 이식요소 G1~G11, §7 로드맵
Stage 1~3 전부 완료 현행화).
이 디렉토리는 **Stage 1~3 전부 완료**(v6.29~v6.40) — 챕터 1~8 + 사이드 8종(총 16미션)을
CIPHER(해킹)·BLADE(근접)·RIGGER(설치)·MOLE(위장) 4클래스로 다르게 완주하고, 챕터 8 클리어 시
4엔딩 + New Game+(회차 플레이)로 이어진다.

**Stage 2 추가** (v6.32): BLADE 근접 로스터(cards/ghost/blade.md 계승) · 시그널 다이 4상태(🔵UP/🔴DOWN/
⚡SURGE/⚫BLACKOUT) · 위협/노출 게이지 실동(임계 시 증원 → 페이싱 변화, G10) · 다중 대화 노드·
분기 영속(추출 방식·영웅/유령 flag가 허브 결과 패널에 반영) · 상성 매트릭스 6종 표시 · 전투 juice(피격
플래시·부유 텍스트·게이지 연출).

**Stage 3 추가** (v6.33~v6.40, docs/25 §7 각주에 계획 대비 이탈·초과분 상술): 미션 1→**16종**(메인
챕터 1~8 + 사이드 8종, 미션 보드 UI, v6.33) · 클래스 2→**4종**(RIGGER·MOLE 추가, v6.34, 로드맵
미기술 확장) · 밸런스 하네스 64조합 전수 측정·보정(v6.35) · `projection.js` seam 아이소메트릭 뷰
스킨(룰 무변경 증명, v6.36) · 장비 상점 10종 + 정보상 경제 루프(v6.38, §8 Non-goal 대비 부분 해소) ·
4엔딩(🏙️/🔥/🕊️/💀) + New Game+(v6.40).

> RPG 모드는 세계관·인물·lore만 공유하고 룰은 독립한다. `simulator/v0.5`·`sim-harness`·
> `sim-e2e`의 어떤 파일도 수정하지 않는 **신규 트랙**이다 (vendor·lore는 이 디렉토리로 복제).

## 실행

- **오프라인**: `rpg/index.html`을 브라우저에서 더블클릭 (`file://`). CDN 0, fetch 0.
- **배포**: `dead-nexus.vercel.app/rpg/` (디렉토리 인덱스 자동 서빙, `vercel.json` 편집 불필요).
- 모든 경로 상대(`./`) → 서브패스와 `file://` 동시 성립.

## 검증

```
node rpg/_unit.js          # 순수 로직 유닛 테스트 200건 (Stage 1: 1~46 · Stage 2: 47~76 ·
                           #   46~47차 미션 16종 체제: 77~97 · 48차 4클래스 로스터: 98~123 ·
                           #   51차 밸런스 하네스 스모크/핀: 124~143(140~143 아이소 projection seam) ·
                           #   55차 B1 경제 루프(장비 상점·정보상): 144~170 ·
                           #   55차 장비 밸런스 게이트(base/mid/full 64/64): 171~176 ·
                           #   57차 4엔딩+New Game+: 177~200)
node rpg/_missions_check.js rpg/data/missions/<파일>   # 미션 스키마·대화 그래프 검증 (16/16, 16개 파일)
node rpg/_balance.js       # 전투 밸런스 매트릭스 (4클래스 × 16미션 × 2정책 = 64조합) — 아래 §밸런스 하네스
                           #   ★ 장비는 옵트인 파워 → 무장비 기준 매트릭스는 B1 전후 byte 동일
```

## 밸런스 하네스 (`_balance.js`) — 전투 난이도 전수 측정 [51차]

전투는 **결정론**(주사위 0, `systems/combat/*` 순수 함수, DOM 참조 0)이므로 브라우저 없이
순수 엔진(`store.buildCombat` + `applyMove/applyAttack/applyHackObjective/runEnemyTurn`)만으로
**자동 플레이**가 가능하다. `sim-e2e` 의 측정 규율(매트릭스 + 이상치 플래그)을 RPG 로 이식.

```
node rpg/_balance.js           # 4클래스 × 16미션 × 2정책 매트릭스 + 이상치 + 챕터 경향 + 요약
node rpg/_balance.js --json    # 기계 판독 JSON (매트릭스 원본)
node rpg/_balance.js --smoke   # 결정론 재현 스모크 (같은 입력 2회 = 같은 결과)
```

**봇 정책 2종** (결정론 → 정책당 1런이면 충분):
- `combat` — 전투형: 최대 피해 액션 우선 → 최근접 적 접근(전멸 승리 지향).
- `objective` — 오브젝티브형: 오브젝티브로 전진 → 인접 시 우선 차감(오브젝티브 승리 지향).
- 공통: 위협 예측 기반 생존 궁극(HP≤40% 또는 큰 피격 예상 시 은신/무적), 엄폐 인지 이동,
  관통 피해 0 시 디버프 폴백. 이동/공격 평가는 엔진 실측(피해식 재구현 0).

**셀 표기**: `W5·88% CO` = 승리·5라운드·종료HP88% / 승리 정책 `C`(combat)·`O`(objective).
`L3`=패(3R) · `T`=timeout. `⚑`=이상치.

**이상치 플래그**: `clearFail`(양 정책 패) · `trivial`(최속 승리 ≤2R 무피해) · `attrition`(최속 승리 ≥10R/timeout).
종합 판정 = **어느 정책이든 승리면 클리어 가능**, 대표 라운드 = 최속(최적) 승리 정책.

**밴드 목표**(51차 보정 후 충족): 64조합 전원 클리어 가능 · clearFail/attrition 0 · 최속 승리 ≤9R ·
챕터 순 난이도 상승 경향. 보정은 **미션 파일의 전투 수치만**(적 배치·오브젝티브 임계·증원 임계) —
`enemies.js`(공유 로스터)·엔진·대화/보상/서사 무편집. 회귀 방어는 `_unit.js` 124~133 이 핀 고정.

빌드 스텝 0. React 18 + Babel Standalone(브라우저 내 JSX 트랜스파일). 상태 = 단일
`useReducer`(`state/store.js`) + 씬 라우터(hub / dialogue / combat).

## 아키텍처 (docs/25 §6)

| 층 | 파일 | 순도 |
|---|---|---|
| `core/` | `loader.js`(heal 로더 G11) · `projection.js`(좌표→스크린 seam G1) | 순수/DOM(loader만) |
| `data/` | `attributes·signal·classes·abilities·enemies·weapons·gear`(장비 10종, B1) + `missions/`(ch01~ch08 + side-01~08, 16개) | 순수 리터럴 (DOM/리액트 0) |
| `systems/combat/` | `grid`(BFS·LoS·엄폐) · `resolve`(결정론 피해 G5) · `ai`(유틸리티 트리+텔레그래프 G8/G9) | 순수 함수 (DOM/리액트 0, G2) |
| `systems/` | `dialogue`(게이트) · `character`(karma) · `campaign`(보상·위협 G10) · `ending`(4엔딩 판정·에필로그·New Game+, 57차) | 순수 함수 |
| `state/` | `store`(리듀서+전투 오케스트레이션) · `save`(localStorage+base64 export/import G11) | 순수 로직 |
| `lore/` | `lore_module.snapshot.js`(read-only 벤더링 G3) · `lore-adapter.js`(`window.RPG_LORE` 유일 seam) | 어댑터 |
| `ui` | `index.html`의 단일 `text/babel` 블록 (App/Hub/Dialogue/Combat/Sheet/SaveMenu) | JSX (트랜스파일 표면 한정 G4) |

**모듈 경계 (린트 규율)**: `systems/combat/*`·`data/*`에 `document`/`React` 참조 **0** →
`grep -rE 'document|window.document|React' rpg/systems/combat rpg/data` 는 0건. `window` 전역
노출만 허용. 이 순도가 유닛테스트 가능성과 회귀 방어(G2)의 전제이며, Stage 3 아이소 뷰
교체(G1)를 `core/projection.js` seam 한 곳으로 국소화한다.

## MFU (재미의 심장)

> **"전투 빌드와 사회/해킹 빌드가 같은 문제를 다르게 푼다."**

`data/missions/ch01-first-blood.js`의 `approach` 노드가 3출구를 연다:
1. **무력 돌파** → VANTA 서버룸 전투 (Drone×2 + Corp Security + ICE Node, 서버랙 오브젝티브).
2. **`[HACK 4]` 우회** → CIPHER HACK5로 잠금 개방 → 전투 **완전 제거**, 잠입 추출(대체 결과).
3. **`[VANTA 태그]`** → 슬라이스 CIPHER로는 잠김(회색) — 미래 빌드 축 광고(48차 RIGGER/MOLE 편입 이후
   `[VANTA 태그]` 계열 인물태그 게이트는 MOLE 위장 신분으로 통과 가능해짐).

4클래스 편입(v6.34) 이후 챕터 1을 완주하는 경로가 4가지로 갈린다 — CIPHER 해킹 우회 / BLADE 강습 /
RIGGER 전투 돌파(DEF4 활용) / MOLE 무전투 위장 침투(인물태그 게이트 자연 통과) — Playwright로 4경로
전부 실증됨(v6.34).

## UI 인라인 결정 (정직 보고)

`docs/25 §6` 파일트리는 `ui/App.js` 등 개별 파일을 상정하나, **`fetch/XHR 전면 금지 +
file:// 호환`** 제약과 충돌한다: Babel-standalone은 외부 `text/babel src`를 XHR로 가져오므로
`file://`에서 깨진다. 따라서 UI JSX는 `index.html`의 **단일 `text/babel` 블록**에 인라인했다
(검증 항목 "index.html의 text/babel 블록 transformSync 0 에러"와 정합). 컴포넌트는 블록
내부에서 App/Hub/Dialogue/Combat/CharacterSheet/SaveMenu로 분리돼 있다.

## 계보 태깅

모든 `data/*`·`systems/*` 파일 주석에 `[계승 docs/NN §M]` / `[각색 …]` / `[신규]` 표를
유지한다 (창작 무단 혼입 금지). 명대사·슬로건은 원문 고정, 산문만 톤 재구성.
