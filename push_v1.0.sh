#!/bin/bash
# DEAD NEXUS v1.0 — GitHub push 스크립트
# 사용법: 본인 컴퓨터에서 프로젝트 폴더로 이동 → bash push_v1.0.sh
#
# 전제 조건:
# - GitHub 리포: KOYUBIN/Dead_Nexus
# - origin remote 설정되어 있음 (없으면 아래 주석 해제)
# - main 브랜치

set -e

cd "$(dirname "$0")"

echo "=== DEAD NEXUS v1.0 push 스크립트 ==="
echo ""

# 0. (필요 시) 원격 origin 추가 — 처음 한 번만
# git remote add origin https://github.com/KOYUBIN/Dead_Nexus.git
# git branch -M main

# 1. 상태 확인
echo "▶ git status"
git status --short
echo ""

# 2. 변경사항 모두 stage
echo "▶ git add (CHANGELOG, docs, simulator, print-kit, sim-harness)"
git add CHANGELOG.md
git add docs/
git add simulator/v0.5/index.html
git add print-kit/
git add sim-harness/
git add README.md 2>/dev/null || true
echo ""

# 3. v1.0 통합 커밋
echo "▶ git commit"
git commit -m "$(cat <<'EOF'
v1.0 - 11×11 메인 + 트랙 사이버펑크 + 협상 + 솔로/핫시트 모드

주요 변경 (v0.6.3 ~ v1.0.x 통합):
- 5트랙 사이버펑크 리네이밍: 화력/그리드런/코드/인맥/그림자
- 거리명성(Street Cred) = 5트랙 합 + 마일스톤 6/12/18
- 협상 페이즈 (Phase 1.5): 자원 스왑/truce/BROKER 중개
- NEXUS 동적 컨트롤: 5 Bloc별 글로벌 룰
- 하이라이트 모먼트 12종 (게임 중 기억할 한 수)
- mini-raid 4종 (MOLE/RIGGER/BLADE/CIPHER atk 카드 없는 raid)
- Bloc 능동 액션 3종: 현상금/청부/추적
- Bloc 건물 5종 + 방어 비용 시스템
- SETI 시그널 (NPC 블록 점진 공개)
- 11×11 정식 모드 (메인) + 5×5 튜토리얼
- 솔로 (easy/normal/hard) + 핫시트 (2~5인) + PASS THE DEVICE
- 최소 5R 가드 (조기 승리 차단)
- 트랙 시트 / 11×11 맵 / NEXUS 협상 참조 print-kit 추가
- docs/17-v1.0-systems.md 통합 정리

검증 (200판 시뮬):
- 11×11: 평균 7.23R, Ghost 61/Bloc 39, P0 17%
- 5×5: 평균 5.42R, Ghost 128/Bloc 72, P0 33%/5%
EOF
)"
echo ""

# 4. push
echo "▶ git push origin main"
git push origin main
echo ""

echo "✅ 완료. https://github.com/KOYUBIN/Dead_Nexus 에서 확인"
