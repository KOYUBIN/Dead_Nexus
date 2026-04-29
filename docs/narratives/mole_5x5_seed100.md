# DEAD NEXUS — 예시 게임 narrative

> **시드**: `100` · **맵**: 5x5 · **시나리오**: S01 (튜토리얼)
> **시점 인간 (P0)**: 독립 용병 · 🕷 **MOLE**
> 이 문서는 `sim-harness/narrative_trace.js`로 생성된 자동 narrative다.
> 룰을 글로 읽기 어려울 때, 한 판의 흐름을 따라가며 시스템 감각을 익히기 위한 학습 자료.

---

## 🎬 R0 — 게임 시작

**플레이어 명단**

- **P0** 🕷 MOLE ★ (독립) — 좌표 `D3` · 평판 5 · HP 7 · TL 1
- **P1** 📊 AXIOM (메가기업) — 좌표 `D2` · 자산 10 · NEXUS - · TL 1
- **P2** ⚔ IRONWALL (메가기업) — 좌표 `C4` · 자산 10 · NEXUS - · TL 1
- **P3** 🚛 DRIFTER (독립) — 좌표 `E1` · 평판 5 · HP 9 · TL 1

**P0 시작 손패** (6장): ID COLLAPSE, INNER DOCS, DEEP COVER, FALSE FLAG, BASIC MOVE, BOARD MANIP

---

## R1

### 📰 시장 / 뉴스

> 📰 해킹 대란 — 📊VANTA-2 · 📊AXIOM-2

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🕷 MOLE ★: **ID COLLAPSE + BASIC MOVE** (TOP/BOT)
- **P1** 📊 AXIOM: **BOARDROOM MOVE + MARKET TRADE** (MAIN/SIDE)
- **P2** ⚔ IRONWALL: **CRISIS RESPONSE + ARMS SUPPLY** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **AMBUSH + FAST TRAVEL** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚶 P1 [AXIOM] · D2 → D3 → E3 (주택가, 2칸 이동)
- 🚨 공권력 -2 → 3

### 💰 수익

- 💰 P1 [AXIOM] · 2구역 수입 ₵+5
- 💰 P2 [IRONWALL] · 2구역 수입 ₵+5
- 📈 P1 [AXIOM] 영향권 확장 → E2 (의료구역) · 자산 +5
- 📈 P2 [IRONWALL] 영향권 확장 → E3 (주택가) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [MOLE] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 1/4
- 🧪 P1 [AXIOM] R&D +4pt (구역3 +풀½1) → 0/7 · ⚡TL UP → TL 2
- 🧪 P2 [IRONWALL] R&D +4pt (구역3 +풀½1) → 0/7 · ⚡TL UP → TL 2
- 🧪 P3 [DRIFTER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 1/4

### 📊 R1 종료 시점 스냅샷

- **P0** 🕷 MOLE ★: 평판 **5** · HP 7 · 레이드 0회 · TL 1 (1xp)
- **P1** 📊 AXIOM: 자산 **15** · NEXUS - · TL 2 (0xp)
- **P2** ⚔ IRONWALL: 자산 **15** · NEXUS - · TL 2 (0xp)
- **P3** 🚛 DRIFTER: 평판 **5** · HP 9 · 레이드 0회 · TL 1 (1xp)

---

## R2

### 📰 시장 / 뉴스

> 📰 구역 점령 해제 — 🗺️E4중립화 · 🗺️E2중립화

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🕷 MOLE ★: **DEEP COVER + INNER DOCS** (TOP/BOT)
- **P1** 📊 AXIOM: **SECURITY SWEEP + INVEST HEAVY** (MAIN/SIDE)
- **P2** ⚔ IRONWALL: **ZONE FORTIFY + FORWARD BASE** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **IRON WHEELS + GHOST RUN** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚶 P3 [DRIFTER] · E1 → D1 (데이터허브, 1칸 이동)
- 🗡️ 레이드 성공! P3 → [D1 데이터허브] 🎲6+4=10 ≥ 5 — AXIOM 주가-3, 구역 중립화, 렙+3

### 💰 수익

- 💰 P1 [AXIOM] · 1구역 수입 ₵+5
- 💰 P2 [IRONWALL] · 2구역 수입 ₵+7
- 📈 P1 [AXIOM] 영향권 확장 → E2 (의료구역) · 자산 +5
- 📈 P2 [IRONWALL] 영향권 확장 → D3 (의료구역) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [MOLE] R&D +3pt (렙⅓2 +레이드×20 +풀½1) → 0/7 · ⚡TL UP → TL 2
- 🧪 P1 [AXIOM] R&D +3pt (구역2 +풀½1) → 3/7
- 🧪 P2 [IRONWALL] R&D +4pt (구역3 +풀½1) → 4/7
- 🧪 P3 [DRIFTER] R&D +4pt (렙⅓2 +레이드×22 +풀½0) → 1/7 · ⚡TL UP → TL 2

### 📊 R2 종료 시점 스냅샷

- **P0** 🕷 MOLE ★: 평판 **6** · HP 7 · 레이드 0회 · TL 2 (0xp)
- **P1** 📊 AXIOM: 자산 **10** · NEXUS - · TL 2 (3xp)
- **P2** ⚔ IRONWALL: 자산 **15** · NEXUS - · TL 2 (4xp)
- **P3** 🚛 DRIFTER: 평판 **8** · HP 9 · 레이드 1회 · TL 2 (1xp)

---

## R3

### 📰 시장 / 뉴스

> 📰 군수 계약 취소 — 📊IRONWALL-4

**봇 거래**

- 📈 P2 [IRONWALL] · AXIOM 2주 매수 (₵10) — 주가 5→6

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🕷 MOLE ★: **CLEAN SLATE + AUTH ABUSE** (TOP/BOT)
- **P1** 📊 AXIOM: **PREDICTION ENGINE + FLASH TRADE** (MAIN/SIDE)
- **P2** ⚔ IRONWALL: **HIRE GHOST + COUNTER INTEL** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **BASIC MOVE + STORM RUSH** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🗡 P2 [IRONWALL] · 용병 고용 → D2 AXIOM 타격 (주가-3, 중립화)
- 🚶 P3 [DRIFTER] · D1 → E1 → E2 (의료구역, 2칸 이동)
- 🗡️ 레이드 성공! P3 → [E2 의료구역] 🎲2+4=6 ≥ 5 — AXIOM 주가-3, 구역 중립화, 렙+3

### 💰 수익

- 💰 P2 [IRONWALL] · 3구역 수입 ₵+9
- 📈 P2 [IRONWALL] 영향권 확장 → D2 (데이터허브) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [MOLE] R&D +2pt (렙⅓2 +레이드×20 +풀½0) → 2/7
- 🧪 P1 [AXIOM] R&D +1pt (구역0 +풀½1) → 4/7
- 🧪 P2 [IRONWALL] R&D +6pt (구역4 +풀½2) → 3/10 · ⚡TL UP → TL 3
- 🧪 P3 [DRIFTER] R&D +7pt (렙⅓3 +레이드×24 +풀½0) → 1/10 · ⚡TL UP → TL 3

### 📊 R3 종료 시점 스냅샷

- **P0** 🕷 MOLE ★: 평판 **6** · HP 7 · 레이드 0회 · TL 2 (2xp)
- **P1** 📊 AXIOM: 자산 **0** · NEXUS - · TL 2 (4xp)
- **P2** ⚔ IRONWALL: 자산 **22** · NEXUS - · TL 3 (3xp)
- **P3** 🚛 DRIFTER: 평판 **11** · HP 9 · 레이드 2회 · TL 3 (1xp)

---

## R4

### 📰 시장 / 뉴스

> 📰 드론 순찰 강화 — 🔥공권력+2 · 🚨Ghost수배+1

**봇 거래**

- 📈 P2 [IRONWALL] · AXIOM 2주 매수 (₵2) — 주가 1→2

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🕷 MOLE ★: **BASIC MOVE + DISGUISE** (TOP/BOT)
- **P1** 📊 AXIOM: **CRISIS RESPONSE + HIRE GHOST** (MAIN/SIDE)
- **P2** ⚔ IRONWALL: **MARKET TRADE + MARTIAL LAW** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **AMBUSH + IRON WHEELS** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚨 공권력 -2 → 5

### 💰 수익

- 💰 P2 [IRONWALL] · 4구역 수입 ₵+11
- 📈 P2 [IRONWALL] 영향권 확장 → B4 (넥서스부속) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [MOLE] R&D +2pt (렙⅓2 +레이드×20 +풀½0) → 4/7
- 🧪 P1 [AXIOM] R&D +1pt (구역0 +풀½1) → 5/7
- 🧪 P2 [IRONWALL] R&D +9pt (구역5 +풀½4) → 2/14 · ⚡TL UP → TL 4
- 🧪 P3 [DRIFTER] R&D +7pt (렙⅓3 +레이드×24 +풀½0) → 8/10

### 📊 R4 종료 시점 스냅샷

- **P0** 🕷 MOLE ★: 평판 **6** · HP 7 · 레이드 0회 · TL 2 (4xp)
- **P1** 📊 AXIOM: 자산 **0** · NEXUS - · TL 2 (5xp)
- **P2** ⚔ IRONWALL: 자산 **37** · NEXUS - · TL 4 (2xp)
- **P3** 🚛 DRIFTER: 평판 **11** · HP 9 · 레이드 2회 · TL 3 (8xp)

---

## R5

### 📰 시장 / 뉴스

> 📰 월가 붐 — 📊전체주가+3

**봇 거래**

- 📈 P2 [IRONWALL] · AXIOM 2주 매수 (₵10) — 주가 5→6

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 🕷 MOLE ★: **INNER DOCS + FALSE FLAG** (TOP/BOT)
- **P1** 📊 AXIOM: **EXPAND OP + ALGO LOCK** (MAIN/SIDE)
- **P2** ⚔ IRONWALL: **EXPAND OP + FORWARD STRIKE** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **BASIC MOVE + FAST TRAVEL** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🏢 P1 [AXIOM] · 구역 점령: E2(의료구역), E4(무기고) — 자산 +10
- 🏢 P2 [IRONWALL] · 구역 점령: D4(넥서스부속), C3(NEXUS) — 자산 +10

### 💰 수익

- 💰 P1 [AXIOM] · 2구역 수입 ₵+6
- 💰 P2 [IRONWALL] · 7구역 수입 ₵+19
- 📈 P2 [IRONWALL] 영향권 확장 → C2 (데이터허브) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [MOLE] R&D +2pt (렙⅓2 +레이드×20 +풀½0) → 6/7
- 🧪 P1 [AXIOM] R&D +4pt (구역2 +풀½2) → 2/10 · ⚡TL UP → TL 3
- 🧪 P2 [IRONWALL] R&D +16pt (구역8 +풀½8) → 4/99 · ⚡TL UP → TL 5
- 🧪 P3 [DRIFTER] R&D +7pt (렙⅓3 +레이드×24 +풀½0) → 5/14 · ⚡TL UP → TL 4

### 🏆 즉시 승리!

****P2** ⚔ IRONWALL** — Bloc 승리: 자산 88 (≥60)

## 🏁 게임 종료

**승자**: **P2** ⚔ IRONWALL (메가기업)

**사유**: Bloc 승리: 자산 88 (≥60)

### 최종 상태

- **P0** 🕷 MOLE ★ (독립) — 좌표 `D3` · 평판 6 · HP 7 · TL 2
- **P1** 📊 AXIOM (메가기업) — 좌표 `E3` · 자산 10 · NEXUS - · TL 3
- **P2** ⚔ IRONWALL (메가기업) — 좌표 `C4` · 자산 88 · NEXUS - · TL 5
- **P3** 🚛 DRIFTER (독립) — 좌표 `E2` · 평판 11 · HP 9 · TL 4

---

### 이 문서 다시 생성하기

```bash
cd sim-harness/
node narrative_trace.js ghost MOLE 5x5 100 > ../docs/19-sample-game-narrative.md
```

*⚙ 이 narrative는 결정론적이다 — 같은 시드는 같은 게임을 재생성한다.*
