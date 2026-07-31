# DEAD NEXUS 헤드리스 시뮬 하네스

`simulator/v0.5/index.html` 에서 핵심 게임 로직만 추출해 Node.js로 배치 실행하는 밸런스 검증 도구.

## 사용 (검증됨 — 2026-07-30 감사 시점 실행 확인)

```bash
cd sim-harness
node run.js 200                 # 200판 시뮬 (구 진입점, 계속 동작)
node trace_broker.js            # BROKER 상세 trace (50판, 구 진입점)
node test_decisions.js          # 결정 모달 골격 회귀 테스트 (11 케이스)

# 현재 주력 도구 — package.json 스크립트가 실제 정본:
node balance_test.js                        # N=200 / 11x11
node balance_test.js 200 5x5                # 5x5 모드
node balance_test.js 200 both               # 11x11 + 5x5 둘 다
node balance_test.js 200 11x11 --strict     # 임계 위반 시 exit 1 (CI용)
node balance_test.js 200 11x11 --seed=42    # 결정론 시드 (회귀 비교)
node balance_test.js --trace 11x11 bloc AXIOM 42   # 시그니처/하이라이트/견제 발동 트레이스

node narrative_trace.js ghost BLADE 11x11 42   # 한 판 전체를 markdown 서사로 출력
node narrative_trace.js bloc HELIX 5x5         # 인자 생략 시 기본값(ghost/BLADE/11x11/랜덤시드)
```

또는 `npm test`, `npm run test:strict`, `npm run test:5x5`, `npm run test:both`, `npm run test:seed`, `npm run trace`, `npm run narrative`, `npm run test:decisions` (package.json 스크립트, 위 명령과 1:1 대응).

## 파일

- `core.js` — index.html에서 추출한 순수 JS 로직 (autogenerate, **FROZEN** — 아래 알려진 한계 참조)
- `euro_mechanics.js` — 임계값/MODE_CONFIG 등 밸런스 파라미터 (balance_test.js가 단일 소스로 참조)
- `harness_body.js` — 배치 runner + 분석 함수
- `run.js` — core + harness를 eval 로드해 실행하는 구 진입점
- `balance_test.js` — 현재 주력 밸런스 회귀 스위트 (진영/클래스 표, 트레이스, --strict CI 모드)
- `narrative_trace.js` — 한 판을 사람이 읽는 markdown 서사로 출력 (`docs/19-sample-game-narrative.md` 생성에 사용)
- `test_decisions.js` — 결정 모달(raid_reward 등) 골격 회귀 테스트
- `trace_broker.js` / `trace_rigger.js` — 특정 클래스 라운드별 trace 디버깅

## 알려진 한계 (감사 기록, core.js 자체는 수정하지 않음)

- **README 구 사용법이 실제 CLI와 괴리돼 있었다** (이번 감사에서 정정): 기존 문서는 `run.js`/`trace_broker.js`만 안내했지만, `package.json`의 실제 스크립트 정본은 `balance_test.js`(맵 크기·`--strict`·`--seed`·`--trace` 인자)와 `narrative_trace.js`(역할·클래스·맵·시드 위치 인자)가 주력이다. 위 "사용" 절을 이 감사에서 갱신함.
- **`core.js` 재추출 안내 라인 범위가 stale.** 과거 안내(`awk 'NR>=420 && NR<=2591' ../simulator/v0.5/index.html > core.js`)는 index.html이 420~2591줄이던 시점 기준. 현재 `simulator/v0.5/index.html`은 9666줄이며, 420~2591 구간은 더 이상 JS 로직이 아니라 `<style>` CSS 블록과 겹친다 — 이 명령을 그대로 재실행하면 core.js가 깨진다. 재추출이 필요하면 먼저 JS 로직 시작·종료 라인을 다시 찾아야 한다. `core.js`는 현재 FROZEN 상태이므로 이번 감사에서는 재추출을 수행하지 않고 기록만 남긴다.
- **`core.js`는 FROZEN** — 실행 결과에 결함이 발견되어도 이번 감사 범위에서는 수정하지 않는다 (결함이 있으면 별도로 기록).

## 리포트 예시

```
╔════════════════════════════════════════════════════════════════╗
║ DEAD NEXUS 밸런스 회귀 — N=20   · 11×11 (정식)     · 권고        ║
╚════════════════════════════════════════════════════════════════╝

✅ 20판 완료 (0.2초) · 평균 10.00R (10~10)

🎯 진영 균형                  승률   막대            허용
   ✅ Ghost     50.0%  ████████░░░░░░  40~65
   ✅ Bloc      50.0%  ████████░░░░░░  35~60
...
```
