#!/bin/bash
# DEAD NEXUS v3.0 + v2.4 — Git push 스크립트
# 사용법: bash push_v3.0.sh

set -e

cd "$(dirname "$0")"

echo "=== DEAD NEXUS v3.0 + v2.4 push ==="
echo ""

# Git 상태 확인
if [ ! -d .git ]; then
  echo "❌ .git 없음. git init 먼저 실행"
  echo "   git init -b main"
  echo "   git remote add origin https://github.com/KOYUBIN/Dead_Nexus.git"
  exit 1
fi

# remote 확인
if ! git remote get-url origin > /dev/null 2>&1; then
  echo "❌ origin remote 없음"
  echo "   git remote add origin https://github.com/KOYUBIN/Dead_Nexus.git"
  exit 1
fi

# 변경 사항 staging
echo "📦 변경 파일 staging..."
git add sim-harness/core.js
git add sim-harness/harness_body.js
git add sim-harness/balance_test.js
git add CHANGELOG.md
git add README.md
git add push_v3.0.sh

echo ""
echo "=== Staged 파일 ==="
git diff --cached --stat
echo ""

# 커밋
echo "💾 커밋 작성..."
git commit -m "v3.0 + v2.4: headless/simulator 분기 통합 + 밸런스 너프

v3.0 — simulator v1.1.x → headless 포팅
- Cyberware 시스템 6종 + applyCyberware + R3/R6 자동 장착
- Bloc 능동 액션 3종 (BOUNTY_POST/ASSASSIN_HIRE/GHOST_TRACKER)
- execute 효과 + BLADE/CIPHER/RIGGER/MOLE mini-raid 통합 헬퍼
- mapSize 인자 전파 (initGame/batchRun/balance_test) — 이전 headless가
  항상 5×5 하드코딩이던 중요 버그 수정. 11×11 룰 분기 실제 활성화

v2.4 — 측정 후 너프 패키지
- DRIFTER atk 4→2 (5×5 75% / 11×11 56% 폭주 → 31% / 19%)
- Bloc 자산 임계 60→70 (5×5/11×11 모두)
- BOUNTY_POST ₵+3→+2 수배+3→+2
- GHOST_TRACKER 📡+3→+2 mapReveal+5R→+3R
- MOLE mini-raid 트리거 확대 (infiltrate/steal_card/bloc_resource)
- RIGGER mini-raid 트리거 확대 (zone_disable/force_tl_down/craft_item/zone_shield)

200판 검증 (11×11): Ghost 43-50% / Bloc 50-57%, 평균 5.9R, 임계 위반 0건
200판 검증 (5×5): Ghost 40.5% / Bloc 59.5%, 평균 5.1R

다음 사이클 (v3.1): Terraforming Mars 스타일 마일스톤+어워드 시스템 도입
"

# 푸시
echo ""
echo "🚀 origin/main 푸시..."
git push origin main

echo ""
echo "✅ push 완료!"
echo "   리포: https://github.com/KOYUBIN/Dead_Nexus"
