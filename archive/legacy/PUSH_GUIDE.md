# DEAD NEXUS v1.0 — Git Push 안내

Cowork 샌드박스에서 직접 push가 안 되어 (권한·연동 부재) 본인 PC에서 한 번 실행하면 끝나는 스크립트를 만들어 뒀어.

## 한 줄 요약

본인 컴퓨터에서:
```bash
cd /path/to/전략레거시보드게임
bash push_v1.0.sh
```

끝. 나머지는 자동으로 진행됨.

---

## 처음 push 하는 경우 (리포 없음)

만약 로컬에 git이 init도 안 된 상태면:

```bash
cd /path/to/전략레거시보드게임
git init -b main
git remote add origin https://github.com/KOYUBIN/Dead_Nexus.git
bash push_v1.0.sh
```

만약 GitHub 리포 자체를 새로 만들어야 한다면:
1. https://github.com/new 에서 `Dead_Nexus` 리포 생성 (private 권장)
2. 위 명령 실행

---

## 인증

GitHub Personal Access Token 또는 GitHub CLI 로그인 필요.

**옵션 1 — Personal Access Token (간단)**
1. https://github.com/settings/tokens → "Generate new token (classic)"
2. `repo` 권한 체크
3. 토큰 생성 후 push 시 비밀번호 자리에 토큰 붙여넣기

**옵션 2 — GitHub CLI**
```bash
brew install gh   # 또는 winget install GitHub.cli
gh auth login
```

---

## v1.0 변경사항 요약 (커밋 메시지에 들어감)

- **5트랙 사이버펑크 리네이밍** (무력→화력 💥 / 수송→그리드런 🌃 / 제조→코드 💾 / 파티→인맥 🤝 / 경호→그림자 🎭)
- **거리명성(Street Cred)** + 마일스톤 6/12/18
- **협상 페이즈** (Phase 1.5) + truce/BROKER 중개
- **NEXUS 동적 컨트롤** (5 Bloc별 글로벌 룰)
- **하이라이트 모먼트** 12종
- **mini-raid** 4종 클래스
- **Bloc 능동 액션 3종** (현상금/청부/추적)
- **솔로 + 핫시트(2~5인) + PASS THE DEVICE**
- **11×11 정식 모드** 메인 격상 + 5×5 튜토리얼 분리
- **최소 5R 가드**
- **print-kit 신규** (트랙 시트, 11×11 맵, NEXUS·협상 참조)
- **docs/17-v1.0-systems.md** 통합 정리

---

## 다음 push부터는 더 간단하게

매번 새 변경 push할 때:
```bash
git add -A
git commit -m "변경 내용 한 줄"
git push
```

이걸로 끝.

---

## 자동 push가 가능해지려면 (Cowork에서)

본인 Cowork 우측 상단 ⚙ 설정 → **Connectors** → "GitHub" 검색해서 연결하면 다음부터는 내가 직접 push까지 해줄 수 있어. 한 번만 연결.
