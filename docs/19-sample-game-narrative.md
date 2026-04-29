# DEAD NEXUS — 예시 게임 narrative

**문서 ID**: `docs/19-sample-game-narrative.md`
**버전**: v1.0 (시뮬레이터 v1.6 narrative_trace)
**최종 수정**: 2026-04-29
**대상**: 룰북을 읽었지만 게임 흐름이 잘 안 잡히는 사람 / 핫시트 시작 전 분위기를 보고 싶은 사람

이 문서는 헤드리스 시뮬레이터(`sim-harness/narrative_trace.js`)로 한 판을 끝까지 돌린 자동 생성 narrative다. 결정론적 — 같은 시드는 같은 판을 만든다.
실전 룰은 [02-core-rules.md](02-core-rules.md), 첫 플레이 가이드는 [18-playtest-guide.md](18-playtest-guide.md) 참조.

---

## 📚 narrative 모음 — 5종

이 문서는 BLADE 11×11 표본을 본문으로 담고 있다. 다른 클래스/맵 표본은 `narratives/` 폴더에서 확인:

| 파일 | 시점 P0 | 맵 | 시드 | 결과 (R) |
|---|---|---|---|---|
| **이 문서** | ⚔ BLADE (Ghost) | 11×11 | 42 | DRIFTER 승리 R5 |
| [narratives/mole_5x5_seed100.md](narratives/mole_5x5_seed100.md) | 🕷 MOLE (Ghost) | 5×5 | 100 | IRONWALL 승리 |
| [narratives/broker_11x11_seed999.md](narratives/broker_11x11_seed999.md) | 🤝 BROKER (Ghost) | 11×11 | 999 | CARBON 승리 |
| [narratives/cipher_11x11_seed314.md](narratives/cipher_11x11_seed314.md) | 💾 CIPHER (Ghost) | 11×11 | 314 | HELIX 승리 |
| [narratives/helix_11x11_seed7.md](narratives/helix_11x11_seed7.md) | 🧬 HELIX (Bloc) | 11×11 | 7 | IRONWALL 승리 |

> **관찰**: 결정론 시드 5종에서 모두 Bloc 진영이 승리. 이는 봇 P0 자동 결정이 protective(보수적)인 영향이 큼 — 인간 플레이어의 적극적 결정은 200판 시뮬에서 Ghost 49% 승률 결과(README 참조).

---

> **시드**: `42` · **맵**: 11x11 · **시나리오**: S07 (정식 도전)
> **시점 인간 (P0)**: 독립 용병 · ⚔ **BLADE**
> 이 문서는 `sim-harness/narrative_trace.js`로 생성된 자동 narrative다.
> 룰을 글로 읽기 어려울 때, 한 판의 흐름을 따라가며 시스템 감각을 익히기 위한 학습 자료.

---

## 🎬 R0 — 게임 시작

**플레이어 명단**

- **P0** ⚔ BLADE ★ (독립) — 좌표 `A5` · 평판 5 · HP 10 · TL 1
- **P1** ⚔ IRONWALL (메가기업) — 좌표 `C4` · 자산 10 · NEXUS - · TL 1
- **P2** 🧬 HELIX (메가기업) — 좌표 `D3` · 자산 10 · NEXUS - · TL 1
- **P3** 🚛 DRIFTER (독립) — 좌표 `E1` · 평판 5 · HP 9 · TL 1

**P0 시작 손패** (6장): BERSERKER, SUPPRESSION, DOUBLE TAP, HUMAN SHIELD, BASIC MOVE, POINT BLANK

---

## R1

### 📰 시장 / 뉴스

> 📰 인수합병 열풍 — 📊전체주가+2 · ₵bloc+4

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** ⚔ BLADE ★: **BERSERKER + SUPPRESSION** (TOP/BOT)
- **P1** ⚔ IRONWALL: **EXPAND OP + ARMS SUPPLY** (MAIN/SIDE)
- **P2** 🧬 HELIX: **CRISIS RESPONSE + EXPAND OP** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **AMBUSH + FAST TRAVEL** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🏢 P1 [IRONWALL] · 구역 점령: B4(넥서스부속), D4(넥서스부속) — 자산 +10
- 🚨 공권력 -2 → 3

### 💰 수익

- 💰 P1 [IRONWALL] · 4구역 수입 ₵+9
- 💰 P2 [HELIX] · 2구역 수입 ₵+7
- 📈 P1 [IRONWALL] 영향권 확장 → A4 (공업지구) · 자산 +5
- 📈 P2 [HELIX] 영향권 확장 → C3 (NEXUS) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [BLADE] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 1/4
- 🧪 P1 [IRONWALL] R&D +7pt (구역5 +풀½2) → 3/7 · ⚡TL UP → TL 2
- 🧪 P2 [HELIX] R&D +4pt (구역3 +풀½1) → 0/7 · ⚡TL UP → TL 2
- 🧪 P3 [DRIFTER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 1/4

### 📊 R1 종료 시점 스냅샷

- **P0** ⚔ BLADE ★: 평판 **5** · HP 10 · 레이드 0회 · TL 1 (1xp)
- **P1** ⚔ IRONWALL: 자산 **25** · NEXUS - · TL 2 (3xp)
- **P2** 🧬 HELIX: 자산 **15** · NEXUS - · TL 2 (0xp)
- **P3** 🚛 DRIFTER: 평판 **5** · HP 9 · 레이드 0회 · TL 1 (1xp)

---

## R2

### 📰 시장 / 뉴스

> 📰 Bloc 연합 회의 — 📊CARBON+1 · ₵bloc+5

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** ⚔ BLADE ★: **QUICK DRAW + CONTRACT KILL** (TOP/BOT)
- **P1** ⚔ IRONWALL: **SECURITY SWEEP + INVEST HEAVY** (MAIN/SIDE)
- **P2** 🧬 HELIX: **SECURITY SWEEP + AUGMENTATION** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **IRON WHEELS + GHOST RUN** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚨 공권력 +1 → 4
- 🚶 P3 [DRIFTER] · E1 → E2 (의료구역, 1칸 이동)
- 🗡️ 레이드 성공! P3 → [E2 의료구역] 🎲3+4=7 ≥ 5 — HELIX 주가-3, 구역 중립화, 렙+3

### 💰 수익

- 💰 P1 [IRONWALL] · 5구역 수입 ₵+9
- 💰 P2 [HELIX] · 2구역 수입 ₵+9
- 📈 P1 [IRONWALL] 영향권 확장 → B3 (공업지구) · 자산 +5
- 📈 P2 [HELIX] 영향권 확장 → E3 (주택가) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [BLADE] R&D +2pt (렙⅓1 +레이드×20 +풀½1) → 3/4
- 🧪 P1 [IRONWALL] R&D +10pt (구역6 +풀½4) → 6/10 · ⚡TL UP → TL 3
- 🧪 P2 [HELIX] R&D +8pt (구역3 +풀½5) → 1/10 · ⚡TL UP → TL 3
- 🧪 P3 [DRIFTER] R&D +4pt (렙⅓2 +레이드×22 +풀½0) → 1/7 · ⚡TL UP → TL 2

### 📊 R2 종료 시점 스냅샷

- **P0** ⚔ BLADE ★: 평판 **5** · HP 10 · 레이드 0회 · TL 1 (3xp)
- **P1** ⚔ IRONWALL: 자산 **30** · NEXUS - · TL 3 (6xp)
- **P2** 🧬 HELIX: 자산 **15** · NEXUS - · TL 3 (1xp)
- **P3** 🚛 DRIFTER: 평판 **8** · HP 9 · 레이드 1회 · TL 2 (1xp)

---

## R3

### 📰 시장 / 뉴스

> 📰 암시장 호황 — ₵ghost+4 · 🔩전체+1

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** ⚔ BLADE ★: **LAST STAND + BREACHER** (TOP/BOT)
- **P1** ⚔ IRONWALL: **BOARDROOM MOVE + MERC SURGE** (MAIN/SIDE)
- **P2** 🧬 HELIX: **HOSTILE BID + QUARANTINE** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **BASIC MOVE + STORM RUSH** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚶 P3 [DRIFTER] · E2 → E3 (주택가, 1칸 이동)
- 🗡️ 레이드 성공! P3 → [E3 주택가] 🎲6+4=10 ≥ 5 — HELIX 주가-3, 구역 중립화, 렙+3
- 🚶 P1 [IRONWALL] · C4 → C5 → B5 (유흥가, 2칸 이동)

### 💰 수익

- 💰 P1 [IRONWALL] · 6구역 수입 ₵+9
- 💰 P2 [HELIX] · 2구역 수입 ₵+9
- 📈 P1 [IRONWALL] 영향권 확장 → E3 (주택가) · 자산 +5
- 📈 P2 [HELIX] 영향권 확장 → C2 (데이터허브) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [BLADE] R&D +2pt (렙⅓1 +레이드×20 +풀½1) → 1/7 · ⚡TL UP → TL 2
- 🧪 P1 [IRONWALL] R&D +13pt (구역7 +풀½6) → 9/14 · ⚡TL UP → TL 4
- 🧪 P2 [HELIX] R&D +10pt (구역3 +풀½7) → 1/14 · ⚡TL UP → TL 4
- 🧪 P3 [DRIFTER] R&D +7pt (렙⅓3 +레이드×24 +풀½0) → 1/10 · ⚡TL UP → TL 3

### 📊 R3 종료 시점 스냅샷

- **P0** ⚔ BLADE ★: 평판 **5** · HP 10 · 레이드 0회 · TL 2 (1xp)
- **P1** ⚔ IRONWALL: 자산 **35** · NEXUS - · TL 4 (9xp)
- **P2** 🧬 HELIX: 자산 **15** · NEXUS - · TL 4 (1xp)
- **P3** 🚛 DRIFTER: 평판 **11** · HP 9 · 레이드 2회 · TL 3 (1xp)

---

## R4

### 📰 시장 / 뉴스

> 📰 월가 붐 — 📊전체주가+3

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** ⚔ BLADE ★: **QUICK DRAW + SUPPRESSION** (TOP/BOT)
- **P1** ⚔ IRONWALL: **FORWARD STRIKE + ZONE FORTIFY** (MAIN/SIDE)
- **P2** 🧬 HELIX: **MARKET TRADE + ZONE FORTIFY** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **AMBUSH + FAST TRAVEL** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🗡️ 레이드 성공! [E3 주택가] 🎲4+4=8 — IRONWALL 주가-3, 구역 중립화, P3 렙+3 (누적 14), 현상수배+1

### 💰 수익

- 💰 P1 [IRONWALL] · 6구역 수입 ₵+9
- 💰 P2 [HELIX] · 3구역 수입 ₵+10
- 📈 P1 [IRONWALL] 영향권 확장 → E3 (주택가) · 자산 +5
- 📈 P2 [HELIX] 영향권 확장 → D2 (데이터허브) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [BLADE] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 2/7
- 🧪 P1 [IRONWALL] R&D +14pt (구역7 +풀½7) → 9/99 · ⚡TL UP → TL 5
- 🧪 P2 [HELIX] R&D +12pt (구역4 +풀½8) → 13/14
- 🧪 P3 [DRIFTER] R&D +10pt (렙⅓4 +레이드×26 +풀½0) → 1/14 · ⚡TL UP → TL 4

### 🏆 즉시 승리!

****P3** 🚛 DRIFTER** — Ghost 승리 (전투 루트): 렙 14 + 레이드 3회

## 🏁 게임 종료

**승자**: **P3** 🚛 DRIFTER (독립)

**사유**: Ghost 승리 (전투 루트): 렙 14 + 레이드 3회

### 최종 상태

- **P0** ⚔ BLADE ★ (독립) — 좌표 `A5` · 평판 5 · HP 10 · TL 2
- **P1** ⚔ IRONWALL (메가기업) — 좌표 `B5` · 자산 35 · NEXUS - · TL 5
- **P2** 🧬 HELIX (메가기업) — 좌표 `D3` · 자산 44 · NEXUS - · TL 4
- **P3** 🚛 DRIFTER (독립) — 좌표 `E3` · 평판 14 · HP 9 · TL 4

---

### 이 문서 다시 생성하기

```bash
cd sim-harness/
node narrative_trace.js ghost BLADE 11x11 42 > ../docs/19-sample-game-narrative.md
```

*⚙ 이 narrative는 결정론적이다 — 같은 시드는 같은 게임을 재생성한다.*
