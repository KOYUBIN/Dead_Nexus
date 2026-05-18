# DEAD NEXUS v3.0 + v2.4 — Git Push 안내

Cowork 샌드박스에 GitHub 인증이 없어서 직접 푸시가 안 됨.
본인 Windows 컴퓨터에서 둘 중 하나를 골라 실행하면 됨.

## 방법 A: push_v3.0.sh 사용 (권장)

**Git Bash 또는 WSL에서:**

```bash
cd "C:\Users\user\OneDrive\바탕 화면\임시\새 폴더\전략레거시보드게임"
bash push_v3.0.sh
```

이미 워크스페이스에 적용된 변경사항을 그대로 staging → commit → push 합니다.

## 방법 B: patch 파일 적용 (.git가 깨진 경우)

워크스페이스의 `.git/` 폴더가 손상되어 있어서 위 방법이 실패하면, 별도 위치에 fresh clone 후 patch 적용:

**Git Bash 또는 PowerShell에서:**

```bash
# 1. 별도 임시 폴더에 fresh clone
cd %TEMP%   # 또는 cd $HOME (Git Bash)
git clone https://github.com/KOYUBIN/Dead_Nexus.git Dead_Nexus_push
cd Dead_Nexus_push

# 2. patch 적용
git am "C:\Users\user\OneDrive\바탕 화면\임시\새 폴더\전략레거시보드게임\v3.0-v2.4.patch"

# 3. push
git push origin main
```

## 방법 C: GitHub Desktop (GUI 선호 시)

1. GitHub Desktop에서 KOYUBIN/Dead_Nexus 리포 클론
2. 다음 5개 파일을 워크스페이스에서 클론 위치로 복사:
   - `sim-harness/core.js`
   - `sim-harness/harness_body.js`
   - `sim-harness/balance_test.js`
   - `CHANGELOG.md`
   - `README.md`
   - `push_v3.0.sh` (선택, 다음 사이클용)
3. GitHub Desktop에서 변경사항 보임 → 커밋 메시지 붙여넣기 → "Commit to main" → "Push origin"

**커밋 메시지 (복붙용):**

```
v3.0 + v2.4: headless/simulator 분기 통합 + 밸런스 너프

v3.0 — simulator v1.1.x → headless 포팅
- Cyberware 시스템 6종 + applyCyberware + R3/R6 자동 장착
- Bloc 능동 액션 3종 (BOUNTY_POST/ASSASSIN_HIRE/GHOST_TRACKER)
- execute 효과 + BLADE/CIPHER/RIGGER/MOLE mini-raid 통합 헬퍼
- mapSize 인자 전파 — 이전 headless가 항상 5x5 하드코딩이던 중요 버그 수정

v2.4 — 측정 후 너프 패키지
- DRIFTER atk 4->2 (5x5 75% / 11x11 56% 폭주 -> 31% / 19%)
- Bloc 자산 임계 60->70 (5x5/11x11 모두)
- BOUNTY_POST/GHOST_TRACKER 보상 너프
- MOLE/RIGGER mini-raid 트리거 확대

200판 검증 (11x11): Ghost 43-50% / Bloc 50-57%, 평균 5.9R, 임계 위반 0건
200판 검증 (5x5): Ghost 40.5% / Bloc 59.5%, 평균 5.1R

다음 사이클 (v3.1): Terraforming Mars 스타일 마일스톤+어워드 도입
```

---

## 푸시 후 확인

- 리포: https://github.com/KOYUBIN/Dead_Nexus
- 최신 커밋 메시지가 "v3.0 + v2.4: headless/simulator 분기 통합..."로 시작하면 성공
