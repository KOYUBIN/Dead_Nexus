# DEAD NEXUS — 예시 게임 narrative

> **시드**: `999` · **맵**: 11x11 · **시나리오**: S07 (정식 도전)
> **시점 인간 (P0)**: 독립 용병 · 🤝 **BROKER**
> 이 문서는 `sim-harness/narrative_trace.js`로 생성된 자동 narrative다.
> 룰을 글로 읽기 어려울 때, 한 판의 흐름을 따라가며 시스템 감각을 익히기 위한 학습 자료.

---

## 🎬 R0 — 게임 시작

**플레이어 명단**

- **P0** 🤝 BROKER ★ (독립) — 좌표 `A3` · 평판 5 · HP 6 · TL 1
- **P1** ⚔ IRONWALL (메가기업) — 좌표 `C4` · 자산 10 · NEXUS - · TL 1
- **P2** ⛽ CARBON (메가기업) — 좌표 `B3` · 자산 10 · NEXUS - · TL 1
- **P3** 💾 CIPHER (독립) — 좌표 `A1` · 평판 5 · HP 6 · TL 1

**P0 시작 손패** (6장): BASIC MOVE, DBL CONTRACT, NETWORK, CRISIS TALK, MIDDLE DEAL, BLACKMAIL

---

## R1

### 📰 시장 / 뉴스

> 📰 Bloc 연합 회의 — 📊CARBON+1 · ₵bloc+5

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🤝 BROKER ★: **BLACKMAIL + NETWORK** (TOP/BOT)
- **P1** ⚔ IRONWALL: **MARKET TRADE + ZONE FORTIFY** (MAIN/SIDE)
- **P2** ⛽ CARBON: **EXPAND OP + ZONE FORTIFY** (MAIN/SIDE)
- **P3** 💾 CIPHER: **MESH DIVE + PORT SCAN** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🏢 P2 [CARBON] · 구역 점령: A3(항구), C3(NEXUS) — 자산 +10
- 🚶 P3 [CIPHER] · A1 → A2 (폐허, 1칸 이동)

### 💰 수익

- 💰 P1 [IRONWALL] · 2구역 수입 ₵+5
- 💰 P2 [CARBON] · 4구역 수입 ₵+9
- 📈 P1 [IRONWALL] 영향권 확장 → B4 (넥서스부속) · 자산 +5
- 📈 P2 [CARBON] 영향권 확장 → B2 (넥서스부속) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [BROKER] R&D +2pt (렙⅓2 +레이드×20 +풀½0) → 2/4
- 🧪 P1 [IRONWALL] R&D +4pt (구역3 +풀½1) → 0/7 · ⚡TL UP → TL 2
- 🧪 P2 [CARBON] R&D +10pt (구역5 +풀½5) → 6/7 · ⚡TL UP → TL 2
- 🧪 P3 [CIPHER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 1/4

### 📊 R1 종료 시점 스냅샷

- **P0** 🤝 BROKER ★: 평판 **7** · HP 6 · 레이드 0회 · TL 1 (2xp)
- **P1** ⚔ IRONWALL: 자산 **25** · NEXUS - · TL 2 (0xp)
- **P2** ⛽ CARBON: 자산 **25** · NEXUS - · TL 2 (6xp)
- **P3** 💾 CIPHER: 평판 **5** · HP 6 · 레이드 0회 · TL 1 (1xp)

---

## R2

### 📰 시장 / 뉴스

> 📰 UFO 목격 — 🔥공권력+1 · 📡전체+2

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🤝 BROKER ★: **INFO BROKER + MIDDLE DEAL** (TOP/BOT)
- **P1** ⚔ IRONWALL: **INVEST HEAVY + FORWARD BASE** (MAIN/SIDE)
- **P2** ⛽ CARBON: **MARKET TRADE + SECURITY SWEEP** (MAIN/SIDE)
- **P3** 💾 CIPHER: **BASIC MOVE + GHOST ACCESS** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚶 P3 [CIPHER] · A2 → B2 (넥서스부속, 1칸 이동)
- ❌ 레이드 실패 P3 [B2 넥서스부속] 🎲1+2=3 < 5 — HP-3, 수배+1

### 💰 수익

- 💰 P1 [IRONWALL] · 3구역 수입 ₵+7
- 💰 P2 [CARBON] · 5구역 수입 ₵+12
- 📈 P1 [IRONWALL] 영향권 확장 → D4 (넥서스부속) · 자산 +5
- 📈 P2 [CARBON] 영향권 확장 → C2 (데이터허브) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [BROKER] R&D +3pt (렙⅓3 +레이드×20 +풀½0) → 1/7 · ⚡TL UP → TL 2
- 🧪 P1 [IRONWALL] R&D +7pt (구역4 +풀½3) → 0/10 · ⚡TL UP → TL 3
- 🧪 P2 [CARBON] R&D +15pt (구역6 +풀½9) → 4/14 · ⚡TL UP → TL 4
- 🧪 P3 [CIPHER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 2/4

### 📊 R2 종료 시점 스냅샷

- **P0** 🤝 BROKER ★: 평판 **9** · HP 6 · 레이드 0회 · TL 2 (1xp)
- **P1** ⚔ IRONWALL: 자산 **30** · NEXUS - · TL 3 (0xp)
- **P2** ⛽ CARBON: 자산 **50** · NEXUS - · TL 4 (4xp)
- **P3** 💾 CIPHER: 평판 **5** · HP 3 · 레이드 0회 · TL 1 (2xp)

---

## R3

### 📰 시장 / 뉴스

> 📰 경찰 파업 — 🔥공권력-4 · 🚨Ghost수배-1

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🤝 BROKER ★: **CRISIS TALK + BASIC MOVE** (TOP/BOT)
- **P1** ⚔ IRONWALL: **CRISIS RESPONSE + MERC SURGE** (MAIN/SIDE)
- **P2** ⛽ CARBON: **INVEST HEAVY + POWER SURGE** (MAIN/SIDE)
- **P3** 💾 CIPHER: **ZERO TRACE + ICE BREAK** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚨 공권력 -2 → 1

### 💰 수익

- 💰 P1 [IRONWALL] · 4구역 수입 ₵+9
- 💰 P2 [CARBON] · 6구역 수입 ₵+12
- 📈 P1 [IRONWALL] 영향권 확장 → B5 (유흥가) · 자산 +5
- 📈 P2 [CARBON] 영향권 확장 → D3 (의료구역) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [BROKER] R&D +3pt (렙⅓3 +레이드×20 +풀½0) → 4/7
- 🧪 P1 [IRONWALL] R&D +9pt (구역5 +풀½4) → 9/10
- 🧪 P2 [CARBON] R&D +18pt (구역7 +풀½11) → 8/99 · ⚡TL UP → TL 5
- 🧪 P3 [CIPHER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 3/4

### 📊 R3 종료 시점 스냅샷

- **P0** 🤝 BROKER ★: 평판 **11** · HP 6 · 레이드 0회 · TL 2 (4xp)
- **P1** ⚔ IRONWALL: 자산 **35** · NEXUS - · TL 3 (9xp)
- **P2** ⛽ CARBON: 자산 **55** · NEXUS - · TL 5 (8xp)
- **P3** 💾 CIPHER: 평판 **5** · HP 3 · 레이드 0회 · TL 1 (3xp)

---

## R4

### 📰 시장 / 뉴스

> 📰 고스트 사냥령 — 🚨Ghost수배+3 · ❤️Ghost HP-1

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🤝 BROKER ★: **BLACKMAIL + POKER FACE** (TOP/BOT)
- **P1** ⚔ IRONWALL: **EXPAND OP + MARTIAL LAW** (MAIN/SIDE)
- **P2** ⛽ CARBON: **CRISIS RESPONSE + COUNTER INTEL** (MAIN/SIDE)
- **P3** 💾 CIPHER: **MESH DIVE + NEURAL OVERRIDE** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚨 공권력 -2 → 0

### 💰 수익

- 💰 P1 [IRONWALL] · 5구역 수입 ₵+11
- 💰 P2 [CARBON] · 7구역 수입 ₵+13
- 📈 P1 [IRONWALL] 영향권 확장 → E3 (주택가) · 자산 +5
- 📈 P2 [CARBON] 영향권 확장 → C1 (금융가) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [BROKER] R&D +4pt (렙⅓4 +레이드×20 +풀½0) → 1/10 · ⚡TL UP → TL 3
- 🧪 P1 [IRONWALL] R&D +12pt (구역6 +풀½6) → 11/14 · ⚡TL UP → TL 4
- 🧪 P2 [CARBON] R&D +21pt (구역8 +풀½13) → 29/99
- 🧪 P3 [CIPHER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 0/7 · ⚡TL UP → TL 2

### 🏆 즉시 승리!

****P2** ⛽ CARBON** — Bloc 승리: 자산 60 (≥60)

## 🏁 게임 종료

**승자**: **P2** ⛽ CARBON (메가기업)

**사유**: Bloc 승리: 자산 60 (≥60)

### 최종 상태

- **P0** 🤝 BROKER ★ (독립) — 좌표 `A3` · 평판 14 · HP 5 · TL 3
- **P1** ⚔ IRONWALL (메가기업) — 좌표 `C4` · 자산 40 · NEXUS - · TL 4
- **P2** ⛽ CARBON (메가기업) — 좌표 `B3` · 자산 60 · NEXUS - · TL 5
- **P3** 💾 CIPHER (독립) — 좌표 `B2` · 평판 5 · HP 2 · TL 2

---

### 이 문서 다시 생성하기

```bash
cd sim-harness/
node narrative_trace.js ghost BROKER 11x11 999 > ../docs/19-sample-game-narrative.md
```

*⚙ 이 narrative는 결정론적이다 — 같은 시드는 같은 게임을 재생성한다.*
