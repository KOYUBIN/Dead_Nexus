# DEAD NEXUS — 예시 게임 narrative

> **시드**: `7` · **맵**: 11x11 · **시나리오**: S07 (정식 도전)
> **시점 인간 (P0)**: 메가기업 · 🧬 **HELIX**
> 이 문서는 `sim-harness/narrative_trace.js`로 생성된 자동 narrative다.
> 룰을 글로 읽기 어려울 때, 한 판의 흐름을 따라가며 시스템 감각을 익히기 위한 학습 자료.

---

## 🎬 R0 — 게임 시작

**플레이어 명단**

- **P0** 🧬 HELIX ★ (메가기업) — 좌표 `D3` · 자산 10 · NEXUS - · TL 1
- **P1** 🚛 DRIFTER (독립) — 좌표 `E1` · 평판 5 · HP 9 · TL 1
- **P2** 🚛 DRIFTER (독립) — 좌표 `E1` · 평판 5 · HP 9 · TL 1
- **P3** ⚔ IRONWALL (메가기업) — 좌표 `C4` · 자산 10 · NEXUS - · TL 1

**P0 시작 손패** (6장): BOARDROOM MOVE, AUGMENTATION, HIRE GHOST, CLONE DECOY, CRISIS RESPONSE, HARVEST

---

## R1

### 📰 시장 / 뉴스

> 📰 주식 시장 대폭락 — 🔥공권력+1 · 📊전체주가-4

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🧬 HELIX ★: **CRISIS RESPONSE + BOARDROOM MOVE** (MAIN/SIDE)
- **P1** 🚛 DRIFTER: **AMBUSH + IRON WHEELS** (TOP/BOT)
- **P2** 🚛 DRIFTER: **AMBUSH + FAST TRAVEL** (TOP/BOT)
- **P3** ⚔ IRONWALL: **BOARDROOM MOVE + ARMS SUPPLY** (MAIN/SIDE)

### ⚡ 실행 — 주요 사건

- 🚨 공권력 -2 → 4
- 🚶 P3 [IRONWALL] · C4 → D4 → D5 (항구, 2칸 이동)
- 💥 P1 → P2 (DRIFTER) · 공격 4+2+🎲4=10 vs 방어 2+🎲5=7 → 피해 3
- 💥 P2 → P1 (DRIFTER) · 공격 4+2+🎲6=12 vs 방어 2+🎲3=5 → 피해 7

### 💰 수익

- 💰 P0 [HELIX] · 2구역 수입 ₵+7
- 💰 P3 [IRONWALL] · 2구역 수입 ₵+5
- 📈 P0 [HELIX] 영향권 확장 → D2 (데이터허브) · 자산 +5
- 📈 P3 [IRONWALL] 영향권 확장 → C3 (NEXUS) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [HELIX] R&D +4pt (구역3 +풀½1) → 0/7 · ⚡TL UP → TL 2
- 🧪 P1 [DRIFTER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 1/4
- 🧪 P2 [DRIFTER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 1/4
- 🧪 P3 [IRONWALL] R&D +4pt (구역3 +풀½1) → 0/7 · ⚡TL UP → TL 2

### 📊 R1 종료 시점 스냅샷

- **P0** 🧬 HELIX ★: 자산 **15** · NEXUS - · TL 2 (0xp)
- **P1** 🚛 DRIFTER: 평판 **5** · HP 2 · 레이드 0회 · TL 1 (1xp)
- **P2** 🚛 DRIFTER: 평판 **5** · HP 6 · 레이드 0회 · TL 1 (1xp)
- **P3** ⚔ IRONWALL: 자산 **15** · NEXUS - · TL 2 (0xp)

---

## R2

### 📰 시장 / 뉴스

> 📰 마녀사냥 — 📊IRONWALL+2 · 🚨Ghost수배+2

**봇 거래**

- 📈 P3 [IRONWALL] · VANTA 2주 매수 (₵12) — 주가 6→7
- 📈 P3 [IRONWALL] · AXIOM 2주 매수 (₵12) — 주가 6→7

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🧬 HELIX ★: **MARKET TRADE + HIRE GHOST** (MAIN/SIDE)
- **P1** 🚛 DRIFTER: **FAST TRAVEL + BASIC MOVE** (TOP/BOT)
- **P2** 🚛 DRIFTER: **IRON WHEELS + BASIC MOVE** (TOP/BOT)
- **P3** ⚔ IRONWALL: **FORWARD STRIKE + HIRE GHOST** (MAIN/SIDE)

### ⚡ 실행 — 주요 사건

- 🚶 P1 [DRIFTER] · E1 → E2 (의료구역, 1칸 이동)
- 🗡️ 레이드 성공! P1 → [E2 의료구역] 🎲4+4=8 ≥ 5 — HELIX 주가-3, 구역 중립화, 렙+3
- 🏢 P3 [IRONWALL] · 구역 점령: D4(넥서스부속) — 자산 +5
- 🚶 P2 [DRIFTER] · E1 → D1 → D2 (데이터허브, 2칸 이동)
- 🗡️ 레이드 성공! P2 → [D2 데이터허브] 🎲2+4=6 ≥ 5 — HELIX 주가-3, 구역 중립화, 렙+3

### 💰 수익

- 💰 P0 [HELIX] · 1구역 수입 ₵+7
- 💰 P3 [IRONWALL] · 4구역 수입 ₵+12
- 📈 P0 [HELIX] 영향권 확장 → D2 (데이터허브) · 자산 +5
- 📈 P3 [IRONWALL] 영향권 확장 → B3 (공업지구) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [HELIX] R&D +3pt (구역2 +풀½1) → 3/7
- 🧪 P1 [DRIFTER] R&D +5pt (렙⅓2 +레이드×22 +풀½1) → 2/7 · ⚡TL UP → TL 2
- 🧪 P2 [DRIFTER] R&D +4pt (렙⅓2 +레이드×22 +풀½0) → 1/7 · ⚡TL UP → TL 2
- 🧪 P3 [IRONWALL] R&D +10pt (구역5 +풀½5) → 3/10 · ⚡TL UP → TL 3

### 📊 R2 종료 시점 스냅샷

- **P0** 🧬 HELIX ★: 자산 **22** · NEXUS - · TL 2 (3xp)
- **P1** 🚛 DRIFTER: 평판 **8** · HP 2 · 레이드 1회 · TL 2 (2xp)
- **P2** 🚛 DRIFTER: 평판 **8** · HP 6 · 레이드 1회 · TL 2 (1xp)
- **P3** ⚔ IRONWALL: 자산 **53** · NEXUS - · TL 3 (3xp)

---

## R3

### 📰 시장 / 뉴스

> 📰 영웅 담론 — 🔥공권력-1 · ★Ghost렙+2

**봇 거래**

- 📈 P3 [IRONWALL] · HELIX 2주 매수 (₵2) — 주가 1→2

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🧬 HELIX ★: **INVEST HEAVY + AUGMENTATION** (MAIN/SIDE)
- **P1** 🚛 DRIFTER: **SCORCH PATH + CARGO HAUL** (TOP/BOT)
- **P2** 🚛 DRIFTER: **STORM RUSH + GHOST RUN** (TOP/BOT)
- **P3** ⚔ IRONWALL: **MERC SURGE + MARTIAL LAW** (MAIN/SIDE)

### ⚡ 실행 — 주요 사건

*조용한 라운드 — 주요 액션 없음.*

### 💰 수익

- 💰 P0 [HELIX] · 2구역 수입 ₵+8
- 💰 P3 [IRONWALL] · 5구역 수입 ₵+13
- 📈 P0 [HELIX] 영향권 확장 → E2 (의료구역) · 자산 +5
- 📈 P3 [IRONWALL] 영향권 확장 → C2 (데이터허브) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [HELIX] R&D +5pt (구역3 +풀½2) → 1/10 · ⚡TL UP → TL 3
- 🧪 P1 [DRIFTER] R&D +6pt (렙⅓3 +레이드×22 +풀½1) → 1/10 · ⚡TL UP → TL 3
- 🧪 P2 [DRIFTER] R&D +5pt (렙⅓3 +레이드×22 +풀½0) → 6/7
- 🧪 P3 [IRONWALL] R&D +14pt (구역6 +풀½8) → 7/14 · ⚡TL UP → TL 4

### 🏆 즉시 승리!

****P3** ⚔ IRONWALL** — Bloc 승리: 자산 62 (≥60)

## 🏁 게임 종료

**승자**: **P3** ⚔ IRONWALL (메가기업)

**사유**: Bloc 승리: 자산 62 (≥60)

### 최종 상태

- **P0** 🧬 HELIX ★ (메가기업) — 좌표 `D3` · 자산 39 · NEXUS - · TL 3
- **P1** 🚛 DRIFTER (독립) — 좌표 `E2` · 평판 10 · HP 2 · TL 3
- **P2** 🚛 DRIFTER (독립) — 좌표 `D2` · 평판 10 · HP 6 · TL 2
- **P3** ⚔ IRONWALL (메가기업) — 좌표 `D5` · 자산 62 · NEXUS - · TL 4

---

### 이 문서 다시 생성하기

```bash
cd sim-harness/
node narrative_trace.js bloc HELIX 11x11 7 > ../docs/19-sample-game-narrative.md
```

*⚙ 이 narrative는 결정론적이다 — 같은 시드는 같은 게임을 재생성한다.*
