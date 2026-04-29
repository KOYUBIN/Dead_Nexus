# DEAD NEXUS — 예시 게임 narrative

> **시드**: `314` · **맵**: 11x11 · **시나리오**: S07 (정식 도전)
> **시점 인간 (P0)**: 독립 용병 · 💾 **CIPHER**
> 이 문서는 `sim-harness/narrative_trace.js`로 생성된 자동 narrative다.
> 룰을 글로 읽기 어려울 때, 한 판의 흐름을 따라가며 시스템 감각을 익히기 위한 학습 자료.

---

## 🎬 R0 — 게임 시작

**플레이어 명단**

- **P0** 💾 CIPHER ★ (독립) — 좌표 `A1` · 평판 5 · HP 6 · TL 1
- **P1** 📊 AXIOM (메가기업) — 좌표 `D2` · 자산 10 · NEXUS - · TL 1
- **P2** 🧬 HELIX (메가기업) — 좌표 `D3` · 자산 10 · NEXUS - · TL 1
- **P3** 🚛 DRIFTER (독립) — 좌표 `E1` · 평판 5 · HP 9 · TL 1

**P0 시작 손패** (6장): PORT SCAN, PROXY RELAY, MESH DIVE, ZERO TRACE, DATA SPIKE, BASIC MOVE

---

## R1

### 📰 시장 / 뉴스

> 📰 루머 확산 — 📉CARBON-5

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 💾 CIPHER ★: **DATA SPIKE + MESH DIVE** (TOP/BOT)
- **P1** 📊 AXIOM: **EXPAND OP + SECURITY SWEEP** (MAIN/SIDE)
- **P2** 🧬 HELIX: **MARKET TRADE + QUARANTINE** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **IRON WHEELS + BASIC MOVE** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🏢 P1 [AXIOM] · 구역 점령: C2(데이터허브) — 자산 +5
- 🚶 P3 [DRIFTER] · E1 → D1 (데이터허브, 1칸 이동)
- 🗡️ 레이드 성공! P3 → [D1 데이터허브] 🎲4+4=8 ≥ 5 — AXIOM 주가-3, 구역 중립화, 렙+3

### 💰 수익

- 💰 P1 [AXIOM] · 2구역 수입 ₵+5
- 💰 P2 [HELIX] · 2구역 수입 ₵+7
- 📈 P1 [AXIOM] 영향권 확장 → B2 (넥서스부속) · 자산 +5
- 📈 P2 [HELIX] 영향권 확장 → C3 (NEXUS) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [CIPHER] R&D +1pt (렙⅓1 +레이드×20 +풀½0) → 1/4
- 🧪 P1 [AXIOM] R&D +4pt (구역3 +풀½1) → 0/7 · ⚡TL UP → TL 2
- 🧪 P2 [HELIX] R&D +4pt (구역3 +풀½1) → 0/7 · ⚡TL UP → TL 2
- 🧪 P3 [DRIFTER] R&D +4pt (렙⅓2 +레이드×22 +풀½0) → 0/7 · ⚡TL UP → TL 2

### 📊 R1 종료 시점 스냅샷

- **P0** 💾 CIPHER ★: 평판 **5** · HP 6 · 레이드 0회 · TL 1 (1xp)
- **P1** 📊 AXIOM: 자산 **15** · NEXUS - · TL 2 (0xp)
- **P2** 🧬 HELIX: 자산 **20** · NEXUS - · TL 2 (0xp)
- **P3** 🚛 DRIFTER: 평판 **8** · HP 9 · 레이드 1회 · TL 2 (0xp)

---

## R2

### 📰 시장 / 뉴스

> 📰 주가 동결령 — 효과 없음

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 💾 CIPHER ★: **PORT SCAN + BASIC MOVE** (TOP/BOT)
- **P1** 📊 AXIOM: **ALGO LOCK + PREDICTION ENGINE** (MAIN/SIDE)
- **P2** 🧬 HELIX: **CRISIS RESPONSE + NEURAL IFACE** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **FAST TRAVEL + STORM RUSH** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚶 P3 [DRIFTER] · D1 → D2 (데이터허브, 1칸 이동)
- 🗡️ 레이드 성공! P3 → [D2 데이터허브] 🎲2+4=6 ≥ 5 — AXIOM 주가-3, 구역 중립화, 렙+3
- ⭐ 당신 🚶 P0 [CIPHER] · A1 → B1 → B2 (넥서스부속, 2칸 이동)
- 🚨 공권력 -2 → 5
- ⭐ 당신 🗡️ 레이드 성공! [B2 넥서스부속] 🎲3+2=5 ≥ 5 — AXIOM 주가-3, 중립화, 렙+3 (누적 8)

### 💰 수익

- 💰 P1 [AXIOM] · 1구역 수입 ₵+5
- 💰 P2 [HELIX] · 3구역 수입 ₵+10
- 📈 P1 [AXIOM] 영향권 확장 → B2 (넥서스부속) · 자산 +5
- 📈 P2 [HELIX] 영향권 확장 → C4 (무기고) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [CIPHER] R&D +5pt (렙⅓2 +레이드×22 +풀½1) → 2/7 · ⚡TL UP → TL 2
- 🧪 P1 [AXIOM] R&D +4pt (구역2 +풀½2) → 4/7
- 🧪 P2 [HELIX] R&D +9pt (구역4 +풀½5) → 2/10 · ⚡TL UP → TL 3
- 🧪 P3 [DRIFTER] R&D +7pt (렙⅓3 +레이드×24 +풀½0) → 0/10 · ⚡TL UP → TL 3

### 📊 R2 종료 시점 스냅샷

- **P0** 💾 CIPHER ★: 평판 **8** · HP 6 · 레이드 1회 · TL 2 (2xp)
- **P1** 📊 AXIOM: 자산 **10** · NEXUS - · TL 2 (4xp)
- **P2** 🧬 HELIX: 자산 **25** · NEXUS - · TL 3 (2xp)
- **P3** 🚛 DRIFTER: 평판 **11** · HP 9 · 레이드 2회 · TL 3 (0xp)

---

## R3

### 📰 시장 / 뉴스

> 📰 베일 스캔들 — 📊VANTA-3 · 👁지도2R노출

**봇 거래**

- 📈 P2 [HELIX] · VANTA 2주 매수 (₵14) — 주가 7→8
- 📈 P2 [HELIX] · CARBON 2주 매수 (₵10) — 주가 5→6

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 💾 CIPHER ★: **GHOST ACCESS + ZERO TRACE** (TOP/BOT)
- **P1** 📊 AXIOM: **MARKET TRADE + FLASH TRADE** (MAIN/SIDE)
- **P2** 🧬 HELIX: **BOARDROOM MOVE + COUNTER INTEL** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **AMBUSH + GHOST RUN** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 💥 P3 → P1 (AXIOM) · 공격 4+2+🎲3=9 vs 방어 2+🎲1=3 → 피해 6
- 🚶 P2 [HELIX] · D3 → E3 → E4 (무기고, 2칸 이동)

### 💰 수익

- 💰 P2 [HELIX] · 4구역 수입 ₵+12
- 📈 P2 [HELIX] 영향권 확장 → B4 (넥서스부속) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [CIPHER] R&D +6pt (렙⅓3 +레이드×22 +풀½1) → 1/10 · ⚡TL UP → TL 3
- 🧪 P2 [HELIX] R&D +14pt (구역5 +풀½9) → 6/14 · ⚡TL UP → TL 4
- 🧪 P3 [DRIFTER] R&D +7pt (렙⅓3 +레이드×24 +풀½0) → 7/10

### 📊 R3 종료 시점 스냅샷

- **P0** 💾 CIPHER ★: 평판 **9** · HP 6 · 레이드 1회 · TL 3 (1xp)
- **P1** 📊 AXIOM: 자산 **22** · NEXUS - · TL 2 (4xp)
- **P2** 🧬 HELIX: 자산 **59** · NEXUS - · TL 4 (6xp)
- **P3** 🚛 DRIFTER: 평판 **11** · HP 9 · 레이드 2회 · TL 3 (7xp)

---

## R4

### 📰 시장 / 뉴스

> 📰 신재생 에너지 보조금 — 📊CARBON+4

**봇 거래**

- 📈 P2 [HELIX] · AXIOM 2주 매수 (₵2) — 주가 1→2

### 🃏 계획

*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*

- **P0** 💾 CIPHER ★: **PORT SCAN + BASIC MOVE** (TOP/BOT)
- **P2** 🧬 HELIX: **SECURITY SWEEP + CLONE DECOY** (MAIN/SIDE)
- **P3** 🚛 DRIFTER: **IRON WHEELS + FAST TRAVEL** (TOP/BOT)

### ⚡ 실행 — 주요 사건

- 🚶 P3 [DRIFTER] · D2 → C2 (데이터허브, 1칸 이동)
- 🗡️ 레이드 성공! P3 → [C2 데이터허브] 🎲3+4=7 ≥ 5 — AXIOM 주가-3, 구역 중립화, 렙+3
- 🚨 공권력 +1 → 8

### 💰 수익

- 💰 P2 [HELIX] · 5구역 수입 ₵+15
- 📈 P2 [HELIX] 영향권 확장 → B3 (공업지구) · 자산 +5

### 🔬 R&D

- 🧪 ⭐ 당신 P0 [CIPHER] R&D +6pt (렙⅓3 +레이드×22 +풀½1) → 7/10
- 🧪 P2 [HELIX] R&D +16pt (구역6 +풀½10) → 8/99 · ⚡TL UP → TL 5
- 🧪 P3 [DRIFTER] R&D +10pt (렙⅓4 +레이드×26 +풀½0) → 7/14 · ⚡TL UP → TL 4

### 🏆 즉시 승리!

****P2** 🧬 HELIX** — Bloc 승리: 자산 78 (≥60)

## 🏁 게임 종료

**승자**: **P2** 🧬 HELIX (메가기업)

**사유**: Bloc 승리: 자산 78 (≥60)

### 최종 상태

- **P0** 💾 CIPHER ★ (독립) — 좌표 `B2` · 평판 9 · HP 6 · TL 3
- **P1** 📊 AXIOM (메가기업) — 좌표 `D2` · 자산 25 · NEXUS - · TL 2
- **P2** 🧬 HELIX (메가기업) — 좌표 `E4` · 자산 78 · NEXUS - · TL 5
- **P3** 🚛 DRIFTER (독립) — 좌표 `C2` · 평판 14 · HP 9 · TL 4

---

### 이 문서 다시 생성하기

```bash
cd sim-harness/
node narrative_trace.js ghost CIPHER 11x11 314 > ../docs/19-sample-game-narrative.md
```

*⚙ 이 narrative는 결정론적이다 — 같은 시드는 같은 게임을 재생성한다.*
