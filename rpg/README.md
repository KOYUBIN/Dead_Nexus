# DEAD NEXUS — RPG 모드 (GHOSTGRID / hybrid-scene)

**정본 스펙**: `docs/25-rpg-mode.md` (심사 만장일치 확정 아키텍처 + 이식요소 G1~G11).
이 디렉토리는 **Stage 1 수직 슬라이스** — 챕터 1 "First Blood" 한 바퀴다.

> RPG 모드는 세계관·인물·lore만 공유하고 룰은 독립한다. `simulator/v0.5`·`sim-harness`·
> `sim-e2e`의 어떤 파일도 수정하지 않는 **신규 트랙**이다 (vendor·lore는 이 디렉토리로 복제).

## 실행

- **오프라인**: `rpg/index.html`을 브라우저에서 더블클릭 (`file://`). CDN 0, fetch 0.
- **배포**: `dead-nexus.vercel.app/rpg/` (디렉토리 인덱스 자동 서빙, `vercel.json` 편집 불필요).
- 모든 경로 상대(`./`) → 서브패스와 `file://` 동시 성립.

## 검증

```
node rpg/_unit.js      # 순수 로직 유닛 테스트 46건 (결정론 피해·BFS·AP·텔레그래프·게이트·세이브·MFU)
```

빌드 스텝 0. React 18 + Babel Standalone(브라우저 내 JSX 트랜스파일). 상태 = 단일
`useReducer`(`state/store.js`) + 씬 라우터(hub / dialogue / combat).

## 아키텍처 (docs/25 §6)

| 층 | 파일 | 순도 |
|---|---|---|
| `core/` | `loader.js`(heal 로더 G11) · `projection.js`(좌표→스크린 seam G1) | 순수/DOM(loader만) |
| `data/` | `attributes·classes·abilities·enemies·weapons` + `missions/ch01-first-blood` | 순수 리터럴 (DOM/리액트 0) |
| `systems/combat/` | `grid`(BFS·LoS·엄폐) · `resolve`(결정론 피해 G5) · `ai`(유틸리티 트리+텔레그래프 G8/G9) | 순수 함수 (DOM/리액트 0, G2) |
| `systems/` | `dialogue`(게이트) · `character`(karma) · `campaign`(보상·위협 G10) | 순수 함수 |
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
3. **`[VANTA 태그]`** → 슬라이스 CIPHER로는 잠김(회색) — 미래 빌드 축 광고.

## UI 인라인 결정 (정직 보고)

`docs/25 §6` 파일트리는 `ui/App.js` 등 개별 파일을 상정하나, **`fetch/XHR 전면 금지 +
file:// 호환`** 제약과 충돌한다: Babel-standalone은 외부 `text/babel src`를 XHR로 가져오므로
`file://`에서 깨진다. 따라서 UI JSX는 `index.html`의 **단일 `text/babel` 블록**에 인라인했다
(검증 항목 "index.html의 text/babel 블록 transformSync 0 에러"와 정합). 컴포넌트는 블록
내부에서 App/Hub/Dialogue/Combat/CharacterSheet/SaveMenu로 분리돼 있다.

## 계보 태깅

모든 `data/*`·`systems/*` 파일 주석에 `[계승 docs/NN §M]` / `[각색 …]` / `[신규]` 표를
유지한다 (창작 무단 혼입 금지). 명대사·슬로건은 원문 고정, 산문만 톤 재구성.
