# DEAD NEXUS 헤드리스 시뮬 하네스

`simulator/v0.5/index.html` 에서 핵심 게임 로직만 추출해 Node.js로 배치 실행하는 밸런스 검증 도구.

## 사용

```bash
cd sim-harness
# core.js를 index.html에서 재추출 (밸런스 수정 후)
awk 'NR>=420 && NR<=2591' ../simulator/v0.5/index.html > core.js
# 실행
node run.js 200   # 200판 시뮬
node trace_broker.js   # BROKER 상세 trace
```

## 파일

- `core.js` — index.html에서 추출한 순수 JS 로직 (autogenerate)
- `harness_body.js` — 배치 runner + 분석 함수
- `run.js` — core + harness를 eval 로드해 실행
- `trace_broker.js` — 특정 클래스 trace 디버깅

## 리포트 예시

```
판수: 200
라운드: 평균 4.84 (2~9)
승자 역할: Ghost 72 / Bloc 128 / 없음 0

클래스/블록별 P0 승률:
  DRIFTER   66.7%  (22/33)
  BROKER     9.1%  (3/33)
  ...
```
