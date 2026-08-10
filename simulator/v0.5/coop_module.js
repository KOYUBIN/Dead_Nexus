'use strict';
// ============================================================================
// coop_module.js — v6.55 협동 시나리오 모드 "INCURSION" 엔진 모듈
//
//   ▸ 담는 것
//     · COOP_SCENARIOS 레지스트리 (C01 상륙 / C02 압류 집행 / C03 정산일) — 신규
//       ⚠ 기존 SCENARIOS(S01~S07)와 **분리** — 루트 _home_check.js 가 SCENARIOS 키 집합을
//       검사하므로(가드 14) 협동 시나리오를 그 블록에 넣으면 홈 가드가 깨진다.
//     · 침공 엔진: 결정론 상륙 시간표(coop_advance) · 파멸 트랙(RECEIVERSHIP) ·
//       Ghost 거점 강습 · Bloc 자동 안정화 · 승패 판정(coop_checkEnd / coop_timeUp)
//     · 아군 봇 조준(coop_botGhostGoal / coop_scoreGhost / coop_scoreBloc) ·
//       PvP 게이트(coop_pvpBlocked / coop_effectFilter)
//     · 별점(coop_stars) · 전적 localStorage dn_coop_v1 (coop_recordGame) · C03 해금 체인
//
//   ▸ 이 파일이 babel 인라인 스크립트 밖에 있는 이유 (scenario/rules_module 과 동일)
//     index.html 의 <script type="text/babel"> 본문이 Babel 코드 생성기의 500,000자
//     deopt 임계에 근접해 있다. JSX 불필요한 순수 규칙 로직은 전부 이 모듈에 두고,
//     인라인에는 UI 배선 최소한만 남긴다.
//
//   ▸ 배선 패턴 (scenario_module / rules_module 선례 그대로)
//     · <script src> 상대경로 로드 + heal 로더 MODULES 목록 등록 + E13 marker(coop_active)
//     · 전역 window 노출, 소비처는 typeof 가드 → 미로드 시 항등 폴백(협동 버튼 비활성+사유)
//     · babel 인라인 전역(scenarioRule/logEntry/applyDamage/trackBonus = function 선언,
//       raidBonus = const 렉시컬 전역)은 **호출 시점 지연 참조** — 로드 순서 무관, file:// 호환
//     · 비협동 시나리오(S01~S07)에서는 모든 진입점이 인자 state 를 **그대로 반환**(참조 동일
//       항등) — 기존 모드 무손상 계약을 구조적으로 만족 (유닛 격리 검증)
//
//   ▸ 결정론 계약: 상륙 시간표·강습 판정·파멸 상승·안정화 전부 Math.random **0회** —
//     S07 BLACKOUT_ORDER 선례. 이 파일에서 Math.random 을 쓰지 않는다 (유닛 grep 핀 가능).
//   ▸ 외부 요청 0 — fetch/XHR/WebSocket 일절 없음.
//
//   ▸ 계보 (세계관 — 3트랙 교차: RPG Act 2~3 정본의 시뮬 역수입)
//     [계승 rpg/data/missions/a2-00·a2-99] MERIDIAN = 외부 기업 "연합" 침공군. 기함 격침 후
//       잔당이 남았다 — C01·C02 의 침공 유닛은 이 잔당(COLLECTOR 회수반·ASSESSOR 사정관).
//     [계승 rpg/data/missions/a3-00-framing] "연합이 무너지면 남는 건 시체가 아니라 **채권**"
//       — 청산관리단은 총이 아니라 장부·담보·회수 절차로 도시를 가져간다. 파멸 트랙
//       이름 RECEIVERSHIP(관리권 인도)이 이 전제의 직역이다.
//     [계승 rpg/data/missions/a3-03-finale] "도시를 빼앗는 데 함대는 필요 없다. 필요한 건
//       서명 하나" — C03 기함급 지휘 거점(LIQUIDATOR)= a3-03 결전의 시뮬 호응.
//     [계승 rpg/data/enemies.js] MERIDIAN_ASSESSOR(🧾)/COLLECTOR(⛓)/LIQUIDATOR(⚖) 명칭.
//     [계승 lore_module GHOST_IDENTITY.BROKER] SILK = "장부를 쥔 중개인" — 인트로/에필로그 화자.
//     [신규] 협동 모드 자체(전 좌석 한 팀 + 비대칭 기여) · 파멸 트랙 · 별점 · dn_coop_v1.
// ============================================================================

// ---------------------------------------------------------------------------
// 협동 시나리오 레지스트리 — 전 수치·시간표 공표 (정보 은닉 없음 = 이 모드의 정체성).
//   landings: [round, coord, tier] 리터럴 고정 (결정론). tier: 'col'(회수반 거점, ⛓)
//   / 'ass'(사정관 압류 집행소, 🧾) / 'flag'(청산인 지휘 거점, ⚖).
//   좌표 선정 원칙: 5 Bloc HQ·support 15칸 + NEXUS F6 + Ghost 시작 6칸(A6·F1·K6·F11·A1·K11)
//   전부 회피 — 어느 좌석 조합이든 시작 자산을 직접 밟지 않는다 (S07 대칭 보증 선례).
// ---------------------------------------------------------------------------
var COOP_TIERS = {
  col:  { label: '회수반 거점',       icon: '⛓', unit: 'MERIDIAN COLLECTOR' },   // [계승] enemies.js
  ass:  { label: '압류 집행소',       icon: '🧾', unit: 'MERIDIAN ASSESSOR' },    // [계승] enemies.js
  flag: { label: '청산인 지휘 거점', icon: '⚖', unit: 'MERIDIAN LIQUIDATOR' },  // [계승] a3-03 finale
};

var COOP_SCENARIOS = {
  C01: {
    id: 'C01', name: '상륙 (Beachhead)', tagline: '항만의 크레인이 낯선 화물을 내린다. 송장에는 도시의 이름이 적혀 있다.',
    desc: '입문 협동. MERIDIAN 회수반이 4개 항만 구역에 상륙 — 파멸 상한 전에 거점 4개 전부 파괴.',
    locked: false, maps: ['11x11'], coopMode: true,
    startHeat: 5,
    roundLimit: 8,                 // 짧은 시간표 (입문)
    underdogRelief: false,         // 경쟁 임계 스케일 무의미(개인 승리 차단) — 명시적 off
    startWeaponsAll: 2,            // 시 방위 무기고 개방 — 강습 판정(raidBonus)의 무기 축 보강
    startPartsAll: 2,              // Bloc 안정화(⚙) 시동 자본
    // 상륙 시간표 (공표·결정론) — 항만(port) 4곳: D4·H4(북) → D8·H8(남)
    coopLandings: [[2, 'D4', 'col'], [2, 'H4', 'col'], [3, 'D8', 'col'], [3, 'H8', 'col']],
    coopObjective: 'destroy',      // 거점 전부 파괴 = 승리
    // [측정 튜닝] coopBaseHp 스윕 (n=100/셀, 봇 전용 자동 협동): hp2 → 클리어 31%(대역 40~70 미달,
    //   패인 전원 "시간표 종료 — 처리량 부족") · hp1 → 44%(대역 내). roundLimit 9 안(46%)도 대역
    //   내였으나 "짧은 시간표" 정체성(8R)을 지키는 hp1 채택 — 경량 상륙 거점 서사와도 정합.
    coopBaseHp: 1, coopBaseDef: 5, // 거점 내구/방어 (강습 임계)
    coopDoomCap: 12,               // 파멸 상한 — 도달 = 즉시 패배
    coopDoomPerBase: 1,            // 라운드마다 활성 거점당 파멸 +1 (유지 비용)
    coopDoomOnLand: 0,             // 상륙 자체는 파멸 무가산 (입문 완화)
    coopKillDoom: 1,               // 거점 파괴 시 파멸 −1 (회수 지연)
    coopStabCost: 2,               // Bloc 안정화 비용 ⚙2 → 파멸 −1 (좌석당 R1회 자동)
    // [측정 근거] 승리 판의 파멸 평균 0.07 — Bloc 안정화가 파멸을 상시 0 근방으로 눌러 파멸 기반
    //   별점이 무의미(전 승리 ★2 자동). C01 별점은 **속도 2단**으로: 빨리 끝낼수록 별이 는다.
    star2Rounds: 1, star3Rounds: 2,  // ★2: 잔여 라운드 ≥1 · ★3: 잔여 라운드 ≥2
  },
  C02: {
    id: 'C02', name: '압류 집행 (Seizure)', tagline: '사정관은 총을 겨누지 않는다. 구역의 가치를 소리 내어 읽을 뿐이다.',
    desc: '방어전 협동. 사정관이 핵심 구역 4곳(D6·H6·F5·F7)에 압류 집행소 설치 — 10R까지 도시를 사수.',
    locked: false, maps: ['11x11'], coopMode: true,
    startHeat: 5,
    roundLimit: 10,
    underdogRelief: false,
    startWeaponsAll: 2,
    startPartsAll: 2,
    // 핵심 구역 = 상륙 좌표 자체 (압류 집행소가 그 위에 선다). 파괴해도 재상륙 시간표 有.
    coopLandings: [[2, 'D6', 'ass'], [3, 'H6', 'ass'], [4, 'F5', 'ass'], [5, 'F7', 'ass'], [6, 'D6', 'ass'], [7, 'H6', 'ass'], [8, 'F5', 'ass']],
    coopObjective: 'survive',      // roundLimit 까지 생존(파멸 상한 미도달) = 승리
    // [측정 튜닝] 스윕 (n=100/셀): hp2·cap12 → 17%(파멸 폭주, 평균 파멸 11.77) · hp2·cap14 → 24%
    //   · hp1·cap12 → **41%**(대역 내) 채택. 가속(+2/거점)·재상륙 시간표는 정체성이라 유지하고,
    //   집행소 내구를 1로 내려 "즉응 탈환" 루프를 성립시켰다 (C01 과 동일 레버).
    coopBaseHp: 1, coopBaseDef: 5,
    coopDoomCap: 12,
    coopDoomPerBase: 2,            // 핵심 구역 점거 = 파멸 가속 (거점당 +2)
    coopDoomOnLand: 1,             // 압류 통지 — 상륙마다 파멸 +1 (7회 = 최저 7)
    coopKillDoom: 1,
    coopStabCost: 2,
    // [측정 근거] 승리 판 파멸 평균 1.95 (즉응 탈환 + 안정화) — 구 임계 ≤9/≤8 은 전 승리 ★3
    //   자동이라 무의미. 승자 분포에 맞춰 ≤4/≤2 로 하향 (생존전 = 파멸 여유 2단 판정 유지).
    star2Doom: 4, star3Doom: 2,    // ★2: 파멸 ≤4 · ★3: 파멸 ≤2
  },
  C03: {
    id: 'C03', name: '정산일 (Settlement Day)', tagline: '기함은 하늘에서 왔고, 청산인은 엘리베이터로 온다.',   // [계승] a3-03 OPENING
    desc: '피날레 협동. 청산인 지휘 거점(내구 10·방어 7)이 NEXUS 에 착좌 — 호위 거점을 뚫고 기함급을 격파. C01·C02 클리어 시 해금.',
    locked: false, maps: ['11x11'], coopMode: true,   // locked 는 전적 파생(coop_scenarioList) — 데이터는 상시 false (헤드리스 측정용)
    startHeat: 6,
    roundLimit: 10,
    underdogRelief: false,
    startWeaponsAll: 3,            // 결전 보급 — 저ATK 클래스도 방어 7 강습 가능선 확보
    startPartsAll: 2,
    coopLandings: [[2, 'F6', 'flag'], [3, 'E6', 'col'], [3, 'G6', 'col'], [5, 'F5', 'col'], [5, 'F7', 'col']],
    coopObjective: 'flagship',     // 기함급(tier flag) 격파 = 승리
    coopBaseHp: 1, coopBaseDef: 5, // 호위 거점 (경량)
    // [측정 튜닝] coopFlagHp 스윕 (n=100/셀): hp8 → 78% · hp9(cap14) → 80% · hp10 → **52%**
    //   (대역 내) 채택. 10R 시간표 안에서 내구 10 은 두 Ghost 의 거의 전 라운드 집중을 요구 —
    //   "피날레 = 총력전" 페이싱. 방어 7 은 유지 (저ATK 클래스의 무기 투자 동기).
    coopFlagHp: 10, coopFlagDef: 7, // 기함급 지휘 거점 (고체력·고방어)
    coopDoomCap: 16,
    coopDoomPerBase: 1,            // 기함도 +1 (호위와 동일 — 상한 16 과 정합)
    coopDoomOnLand: 1,
    coopKillDoom: 1,
    coopStabCost: 2,
    star2Doom: 10, star3Rounds: 2,
  },
};

function coop_getScenario(id) { return COOP_SCENARIOS[id] || null; }

// 시나리오 룰 지연 조회 (blackout_rule 선례) — scenarioRule 은 인라인 function 전역.
function coop_rule(state, key, fallback) {
  return (typeof scenarioRule === 'function') ? scenarioRule(state, key, fallback) : fallback;
}
// 이 판이 협동 모드인가 — E13 marker 겸용. 비협동(키 미지정) → false → 전 진입점 항등.
function coop_active(state) {
  return coop_rule(state, 'coopMode', false) === true;
}
function coop_pvpBlocked(state) { return coop_active(state); }

// ---------------------------------------------------------------------------
// 좌석 로스터 — 인간(1~4) + 아군 봇 충원 → 4석. 목표 구성 2👻+2🏢 (비대칭 협동:
//   Ghost=거점 강습, Bloc=자산·안정화). 충원 순서는 고정 리스트(결정론, Math.random 0).
//   강습 판정이 ATK·무기 기반이라 봇 Ghost 는 고ATK(BLADE·RIGGER) 우선.
// ---------------------------------------------------------------------------
var COOP_BOT_GHOSTS = ['BLADE', 'RIGGER', 'CIPHER', 'DRIFTER', 'BROKER', 'MOLE'];
var COOP_BOT_BLOCS = ['IRONWALL', 'CARBON', 'VANTA', 'HELIX', 'AXIOM'];
function coop_buildRoster(humansList, fallbackRole, fallbackSpecific) {
  var humans = (humansList && humansList.length) ? humansList.slice(0, 4)
    : [{ role: fallbackRole || 'ghost', specific: fallbackSpecific || 'CIPHER' }];
  var used = {};
  var roster = humans.map(function (h) {
    used[h.specific] = true;
    return { kind: 'human', role: h.role, specific: h.specific };
  });
  var g = roster.filter(function (r) { return r.role === 'ghost'; }).length;
  var b = roster.length - g;
  while (roster.length < 4) {
    var wantGhost = g < 2 || (b >= 2 && g < b + 2);   // 2👻 우선 충원, 이후 균형
    var pool = wantGhost ? COOP_BOT_GHOSTS : COOP_BOT_BLOCS;
    var pick = null;
    for (var i = 0; i < pool.length; i++) if (!used[pool[i]]) { pick = pool[i]; break; }
    if (!pick) { pool = wantGhost ? COOP_BOT_BLOCS : COOP_BOT_GHOSTS; wantGhost = !wantGhost; for (var j = 0; j < pool.length; j++) if (!used[pool[j]]) { pick = pool[j]; break; } }
    if (!pick) break;
    used[pick] = true;
    roster.push({ kind: 'bot', role: wantGhost ? 'ghost' : 'bloc', specific: pick });
    if (wantGhost) g++; else b++;
  }
  return roster;
}

// ---------------------------------------------------------------------------
// 내부 헬퍼 — meta.coop 상태 { doom, bases:{coord:{coord,tier,hp,hp0,def,landedR}},
//   destroyed, landed, assaults, stabilized, stabBy:{} }. 지연 init(첫 coop_advance) —
//   buildInitial 무개입 (S07 "meta 초기화는 첫 advance 가 맡는다" 선례).
// ---------------------------------------------------------------------------
function coop_initMeta() {
  return { doom: 0, bases: {}, destroyed: 0, landed: 0, assaults: 0, stabilized: 0 };
}
function coop_meta(state) { return (state.meta && state.meta.coop) || null; }
function coop_baseAt(state, coord) {
  var co = coop_meta(state);
  var b = co && co.bases && co.bases[coord];
  return (b && b.hp > 0) ? b : null;
}
// 강습 사거리 판정 — 거점 셀 또는 4방 인접("포위 강습"). 온셀 우선, 인접은 좌표 사전순(결정론).
//   [측정 근거] 온셀 한정 1차 구현은 봇 도달 정밀도 문제로 판당 강습 1.4회에 그쳤다(클리어 0%).
//   봇 이동이 목표 셀에 정확히 멈추지 못하는 라운드에도 포위망은 성립한다 — 인접 링으로 넓혀
//   강습 빈도를 이동 AI 재작성 없이 회복 (S04 "봇이 모델링하지 않는 정밀 조건은 죽는다" 교훈).
function coop_baseNear(state, coord) {
  var on = coop_baseAt(state, coord);
  if (on) return on;
  var adj = coop_adj(coord);
  for (var i = 0; i < adj.length; i++) {
    var b = coop_baseAt(state, adj[i]);
    if (b) return b;
  }
  return null;
}
function coop_activeBases(state) {
  var co = coop_meta(state);
  if (!co || !co.bases) return [];
  var out = [];
  for (var c in co.bases) if (co.bases[c].hp > 0) out.push(co.bases[c]);
  out.sort(function (a, b) { return a.coord < b.coord ? -1 : 1; });   // 결정론 순서
  return out;
}
function coop_totalLandings(sc) { return (sc && sc.coopLandings) ? sc.coopLandings.length : 0; }
// 자족 인접 계산 (coordsAdj 는 babel const 렉시컬 — 의존 회피, 11×11 A..K/1..11 고정)
function coop_adj(coord) {
  var col = coord.charCodeAt(0), row = parseInt(coord.slice(1), 10);
  var out = [];
  if (col > 65) out.push(String.fromCharCode(col - 1) + row);
  if (col < 75) out.push(String.fromCharCode(col + 1) + row);
  if (row > 1) out.push(String.fromCharCode(col) + (row - 1));
  if (row < 11) out.push(String.fromCharCode(col) + (row + 1));
  return out;
}

// 거점 점거 셀 표기 재계산 — 활성 거점 셀(merBase, 수입 몰수) + 4방 인접(merDark, 오염
//   = 수입 0). COLLECT_INCOME 이 cell.merDark 를 읽으므로 **셀 = 표시·판정 단일 소스**
//   (S07 cell.blackout 선례). 비협동 판에는 이 함수가 호출되지 않아 셀 무오염.
function coop_refreshCells(state) {
  var want = {};   // coord → 'base' | 'dark'
  coop_activeBases(state).forEach(function (b) {
    want[b.coord] = 'base';
    coop_adj(b.coord).forEach(function (a) { if (!want[a]) want[a] = 'dark'; });
  });
  var map = state.map, changed = false, newMap = null;
  for (var c in map) {
    var cell = map[c];
    var isBase = want[c] === 'base', isDark = !!want[c];
    if (!!cell.merBase !== isBase || !!cell.merDark !== isDark) {
      if (!newMap) { newMap = {}; for (var k in map) newMap[k] = map[k]; }
      newMap[c] = Object.assign({}, cell, { merBase: isBase, merDark: isDark });
      changed = true;
    }
  }
  return changed ? Object.assign({}, state, { map: newMap }) : state;
}

function coop_log(s, msg) {
  return (typeof logEntry === 'function') ? logEntry(s, msg) : s;
}

// ---------------------------------------------------------------------------
// 강습 판정 — 기존 레이드 판정 성분 재사용(결정론 봇 공식): raidBonus(무기 기반) +
//   ATK + 전투 트랙. d6 없음 → 표시(맵 툴팁·셋업 공표)와 판정이 같은 식.
//   성공: 피해 1 (+1 if 총합 ≥ 방어+4) · ★+2 (+파괴 ★+3 / 기함 ★+6) · 파괴 시 파멸 −1.
//   실패: HP −1 (경쟁 레이드 −3 대비 완화 — 협동 리트라이 페이싱).
// ---------------------------------------------------------------------------
function coop_assaultPower(p) {
  var rb = (typeof raidBonus === 'function') ? raidBonus(p) : 3;
  var tb = (typeof trackBonus === 'function') ? trackBonus(p, 'atk') : 0;
  return rb + ((p.stats && p.stats.atk) || 0) + tb;
}
function coop_assault(state, gi, label) {
  var p = state.players[gi];
  if (!p || p.defeated || p.role !== 'ghost') return state;
  var b = coop_baseNear(state, p.position);   // 온셀 + 4방 인접 (포위 강습)
  if (!b) return state;
  var co = coop_meta(state);
  var total = coop_assaultPower(p);
  var tier = COOP_TIERS[b.tier] || COOP_TIERS.col;
  var s = state;
  if (total >= b.def) {
    var dmg = 1 + (total >= b.def + 4 ? 1 : 0);
    var hp2 = Math.max(0, b.hp - dmg);
    var kill = hp2 <= 0;
    var bases = Object.assign({}, co.bases);
    bases[b.coord] = Object.assign({}, b, { hp: hp2 });
    var rep = 2 + (kill ? (b.tier === 'flag' ? 6 : 3) : 0);
    var ps = s.players.slice();
    ps[gi] = Object.assign({}, p, { resources: Object.assign({}, p.resources, { rep: (p.resources.rep || 0) + rep }) });
    s = Object.assign({}, s, {
      players: ps,
      meta: Object.assign({}, s.meta, {
        coop: Object.assign({}, co, {
          bases: bases,
          doom: kill ? Math.max(0, (co.doom || 0) - coop_rule(s, 'coopKillDoom', 1)) : (co.doom || 0),
          destroyed: (co.destroyed || 0) + (kill ? 1 : 0),
          assaults: (co.assaults || 0) + 1,
        }),
      }),
    });
    s = coop_log(s, (kill ? '💥 ' : '🗡 ') + label + ' 성공 — P' + gi + ' [' + p.specific + '] → ' + tier.icon + ' ' + b.coord + ' ' + tier.label +
      ' (' + total + ' ≥ ' + b.def + ' · 피해 ' + dmg + (kill ? ' · 파괴! ★+' + rep + ' · 파멸 −' + coop_rule(s, 'coopKillDoom', 1) : ' · 잔여 ' + hp2 + '/' + b.hp0 + ' · ★+' + rep) + ')');
    if (kill) s = coop_refreshCells(s);
  } else {
    s = Object.assign({}, s, { meta: Object.assign({}, s.meta, { coop: Object.assign({}, co, { assaults: (co.assaults || 0) + 1 }) }) });
    s = coop_log(s, '🛡 ' + label + ' 실패 — P' + gi + ' [' + p.specific + '] → ' + tier.icon + ' ' + b.coord + ' (' + total + ' < ' + b.def + ' · HP −1)');
    if (typeof applyDamage === 'function') s = applyDamage(s, gi, 1, { label: 'MERIDIAN 거점 방어' });
  }
  return s;
}

// atk 카드 → 추가 강습 변환 + 아군 적대 효과 무력화 (applyEffect 단일 훅).
//   비협동 → 인자 그대로 반환(항등). 협동: ① atk 계열은 거점 위에서 추가 강습으로 변환,
//   거점 밖에선 무발동(아군 오사 차단) ② 적대 키는 효과 객체에서 제거(자기강화 반쪽은 유지).
var COOP_HOSTILE_KEYS = [
  'atk', 'atk_x2', 'atk_x3_retort', 'always_first', 'target', 'ram_atk', 'assassin', 'atk_twice',
  'atk_reroll', 'force_enter', 'point_blank', 'surprise', 'execute', 'def_ignore', 'steal',
  'infiltrate', 'disguise', 'bypass_veil', 'copy_bloc_card', 'scandal', 'stock_dmg', 'emp_pulse',
  'tech_breach', 'frame', 'swap_blame', 'steal_card', 'bloc_resource', 'vote_flip', 'crash_stock',
  'crash_target', 'hire_raid', 'bounty_post', 'assassin_contract', 'ghost_track', 'ghost_wanted_all',
  'steal_op', 'zero_income', 'block_resource', 'disable_tl', 'force_tl_down', 'atk_range',
  'multi_target', 'disable_elec', 'zone_disable', 'transfer_attack', 'redirect', 'mimic',
  'slow_target', 'def_penalty', 'def_zero', 'enemy_spd', 'block_adj',
];
function coop_effectFilter(state, playerIdx, effect) {
  if (!coop_active(state) || !effect) return { s: state, effect: effect };
  var s = state;
  var p = s.players[playerIdx];
  // atk 계열 = 거점 강습으로 전용 (카드 비용을 낸 만큼 추가 타격 기회)
  if (p && p.role === 'ghost' && (effect.atk || effect.atk_x2 || effect.atk_x3_retort) && coop_baseNear(s, p.position)) {
    s = coop_assault(s, playerIdx, '카드 강습');
  }
  var hit = false;
  for (var i = 0; i < COOP_HOSTILE_KEYS.length; i++) if (effect[COOP_HOSTILE_KEYS[i]]) { hit = true; break; }
  if (!hit) return { s: s, effect: effect };
  var eff = Object.assign({}, effect);
  for (var j = 0; j < COOP_HOSTILE_KEYS.length; j++) delete eff[COOP_HOSTILE_KEYS[j]];
  return { s: s, effect: eff };
}

// ---------------------------------------------------------------------------
// 목표·파멸 — 표시(HUD·셋업)와 판정(승패)이 전부 이 두 함수에서 파생 (v6.51 계약).
// ---------------------------------------------------------------------------
function coop_doom(state) {
  var co = coop_meta(state);
  return { val: (co && co.doom) || 0, cap: coop_rule(state, 'coopDoomCap', 12) };
}
function coop_objective(state) {
  var sc = coop_getScenario(state.meta && state.meta.scenario);
  if (!sc) return null;
  var co = coop_meta(state) || coop_initMeta();
  var kind = sc.coopObjective;
  if (kind === 'destroy') {
    var total = coop_totalLandings(sc);
    return { kind: kind, label: '거점 파괴 ' + (co.destroyed || 0) + '/' + total, done: co.destroyed || 0, total: total,
      pct: total ? Math.min(100, Math.round((co.destroyed || 0) / total * 100)) : 0 };
  }
  if (kind === 'flagship') {
    var hp0 = sc.coopFlagHp, left = hp0, landed = false;
    var bases = (co.bases || {});
    for (var c in bases) if (bases[c].tier === 'flag') { landed = true; left = bases[c].hp; }
    var done = landed ? hp0 - left : 0;
    return { kind: kind, label: '기함급 격파 ' + done + '/' + hp0, done: done, total: hp0,
      pct: Math.min(100, Math.round(done / hp0 * 100)) };
  }
  // survive — roundLimit 까지 버티기 (판정은 coop_timeUp, 진척 = 경과 라운드)
  var lim = sc.roundLimit || 10;
  var r = Math.min((state.meta.round || 1) - 1, lim);
  return { kind: 'survive', label: '사수 ' + r + '/' + lim + 'R', done: r, total: lim,
    pct: Math.min(100, Math.round(r / lim * 100)) };
}

// 별점 (판정식 공개 · coop_setupInfo 에 동일 문구 공표):
//   ★1 = 클리어 · ★2 = 파멸 ≤ star2Doom · ★3 = star3Rounds 지정 시 "잔여 라운드 ≥ N",
//   아니면 "파멸 ≤ star3Doom" (생존전 C02). 잔여 라운드 = roundLimit − 판정 시점 라운드.
function coop_stars(state) {
  var sc = coop_getScenario(state.meta && state.meta.scenario);
  if (!sc) return 0;
  var d = coop_doom(state).val;
  var roundsLeft = Math.max(0, (sc.roundLimit || 0) - (state.meta.round || 0));
  var stars = 1;
  if (sc.star2Rounds != null ? roundsLeft >= sc.star2Rounds : d <= sc.star2Doom) stars++;
  if (sc.star3Rounds != null ? roundsLeft >= sc.star3Rounds : d <= sc.star3Doom) stars++;
  return stars;
}
function coop_starText(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }

// ---------------------------------------------------------------------------
// 승패 판정 3진입점 — 전부 비협동 항등(참조 동일).
// ---------------------------------------------------------------------------
// phase 6 / coop_advance 공용: 목표 완수(C01 전파괴 · C03 기함 격파) → 팀 승리.
function coop_checkEnd(state) {
  if (!coop_active(state) || (state.meta && state.meta.gameOver)) return state;
  var obj = coop_objective(state);
  if (!obj || obj.kind === 'survive' || obj.pct < 100) return state;
  var d = coop_doom(state);
  var stars = coop_stars(state);
  return Object.assign({}, state, {
    meta: Object.assign({}, state.meta, {
      gameOver: true, winner: 0,
      winReason: '🤝 협동 승리 — ' + obj.label + ' · ' + coop_starText(stars) + ' (파멸 ' + d.val + '/' + d.cap + ' · R' + state.meta.round + ')',
    }),
  });
}
// roundLimit 도달 (NEXT_ROUND): 마지막 라운드의 주둔 강습을 정산한 뒤 —
//   survive → 팀 승리 · destroy/flagship → 미완수 시 팀 패배.
function coop_timeUp(state) {
  if (!coop_active(state)) return state;
  var s = state;
  for (var gi = 0; gi < s.players.length; gi++) {
    var p = s.players[gi];
    if (p && p.role === 'ghost' && !p.defeated && coop_baseNear(s, p.position)) s = coop_assault(s, gi, '최종 라운드 강습');
  }
  var end = coop_checkEnd(s);
  if (end !== s) return end;
  var sc = coop_getScenario(s.meta.scenario);
  var d = coop_doom(s);
  if (sc.coopObjective === 'survive') {
    var stars = coop_stars(s);
    return Object.assign({}, s, {
      meta: Object.assign({}, s.meta, {
        gameOver: true, winner: 0,
        winReason: '🤝 협동 승리 — ' + sc.roundLimit + 'R 사수 완료 · ' + coop_starText(stars) + ' (파멸 ' + d.val + '/' + d.cap + ') · [SILK] "장부는 우리가 다시 썼다."',
      }),
    });
  }
  var obj = coop_objective(s);
  return Object.assign({}, s, {
    meta: Object.assign({}, s.meta, {
      gameOver: true, winner: null,
      winReason: '⏳ 협동 패배 — 시간표 종료, 목표 미완수 (' + (obj ? obj.label : '') + ') · 청산 절차 완료. [계승 a3-03] "이의 제기 창구: 없음."',
    }),
  });
}

// ---------------------------------------------------------------------------
// 라운드 훅 — NEXT_ROUND 말미 1회 (blackout_advance 직후 체인). 처리 순서:
//   ① 주둔 강습(활성 거점 위 Ghost 자동 1회) ② 목표 완수 체크 ③ 유지 파멸(생존 거점)
//   ④ 시간표 상륙(+상륙 파멸) ⑤ Bloc 자동 안정화(⚙→파멸−1, 좌석당 1) ⑥ 파멸 상한 패배
//   ⑦ 셀 표기 재계산. 전 단계 Math.random 0 — 결정론 계약.
//   자동인 이유(①⑤): 봇이 목표화하지 않는 선택 액션은 죽는다 — docs/14 §S04 교훈,
//   S07 복구 자동화 선례 그대로.
// ---------------------------------------------------------------------------
function coop_advance(state) {
  if (!coop_active(state)) return state;
  var sc = coop_getScenario(state.meta.scenario);
  if (!sc) return state;
  var s = state;
  if (!coop_meta(s)) s = Object.assign({}, s, { meta: Object.assign({}, s.meta, { coop: coop_initMeta() }) });
  var round = s.meta.round || 0;
  // ① 주둔 강습 — 라운드 종료 정산 (이동으로 거점에 도착해 있으면 자동 타격)
  for (var gi = 0; gi < s.players.length; gi++) {
    var p = s.players[gi];
    if (p && p.role === 'ghost' && !p.defeated && coop_baseNear(s, p.position)) s = coop_assault(s, gi, '주둔 강습');
  }
  // ② 목표 완수 → 즉시 팀 승리 (이하 파멸·상륙 처리 불필요)
  var end = coop_checkEnd(s);
  if (end !== s) return end;
  // ③ 유지 파멸 — 강습 정산 후 생존 거점만 과금 (상륙 라운드 내 즉살 = 유지 비용 0 보상)
  var co = coop_meta(s);
  var upkeep = 0;
  var per = coop_rule(s, 'coopDoomPerBase', 1);
  coop_activeBases(s).forEach(function () { upkeep += per; });
  // ④ 상륙 — 시간표의 이번 라운드분. 동일 좌표 활성 거점 존재 시 스킵(중복 없음).
  var bases = null, landedNow = [], landDoom = 0;
  var onLand = coop_rule(s, 'coopDoomOnLand', 0);
  (sc.coopLandings || []).forEach(function (L) {
    if (L[0] !== round) return;
    var coord = L[1], tier = L[2];
    if (coop_baseAt(s, coord) || (bases && bases[coord] && bases[coord].hp > 0)) return;
    if (!bases) { bases = Object.assign({}, co.bases); }
    var hp = tier === 'flag' ? (sc.coopFlagHp || 8) : (sc.coopBaseHp || 2);
    var def = tier === 'flag' ? (sc.coopFlagDef || 7) : (sc.coopBaseDef || 5);
    bases[coord] = { coord: coord, tier: tier, hp: hp, hp0: hp, def: def, landedR: round };
    landedNow.push((COOP_TIERS[tier] || COOP_TIERS.col).icon + coord);
    landDoom += onLand;
  });
  var doom = (co.doom || 0) + upkeep + landDoom;
  s = Object.assign({}, s, {
    meta: Object.assign({}, s.meta, {
      coop: Object.assign({}, co, {
        doom: doom,
        bases: bases || co.bases,
        landed: (co.landed || 0) + landedNow.length,
      }),
    }),
  });
  if (landedNow.length) s = coop_log(s, '🛳 MERIDIAN 상륙 — ' + landedNow.join('·') + ' (구역 수입 몰수 · 인접 오염' + (landDoom ? ' · 파멸 +' + landDoom : '') + ') · [ASSESSOR] "평가를 시작합니다."');
  if (upkeep) s = coop_log(s, '☠ 청산 절차 진행 — 활성 거점 유지, 파멸 +' + upkeep + ' (→' + doom + ')');
  // ⑤ Bloc 자동 안정화 — ⚙coopStabCost 지불 → 파멸 −1 (좌석당 라운드 1회, 파멸 0 이면 무발동)
  var stabCost = coop_rule(s, 'coopStabCost', 2);
  for (var bi = 0; bi < s.players.length; bi++) {
    var bp = s.players[bi];
    var coNow = coop_meta(s);
    if (!bp || bp.role !== 'bloc' || bp.defeated || bp.isNpc) continue;
    if ((coNow.doom || 0) <= 0) break;
    if ((bp.resources.parts || 0) < stabCost) continue;
    var ps = s.players.slice();
    ps[bi] = Object.assign({}, bp, { resources: Object.assign({}, bp.resources, { parts: bp.resources.parts - stabCost }) });
    s = Object.assign({}, s, {
      players: ps,
      meta: Object.assign({}, s.meta, { coop: Object.assign({}, coNow, { doom: coNow.doom - 1, stabilized: (coNow.stabilized || 0) + 1 }) }),
    });
    s = coop_log(s, '🏢 장부 방어 — P' + bi + ' [' + bp.specific + '] ⚙' + stabCost + ' 지불 · 파멸 −1 (→' + coop_meta(s).doom + ')');
  }
  // ⑥ 파멸 상한 → 즉시 팀 패배
  var d = coop_doom(s);
  if (d.val >= d.cap) {
    return Object.assign({}, coop_refreshCells(s), {
      meta: Object.assign({}, coop_refreshCells(s).meta, {
        gameOver: true, winner: null,
        winReason: '☠ RECEIVERSHIP — 파멸 ' + d.val + '/' + d.cap + ' 도달 · 도시 관리권 인도. [LIQUIDATOR] "서명은 필요 없습니다. 기한이 곧 서명입니다."',
      }),
    });
  }
  // ⑦ 셀 표기 재계산 (상륙 반영)
  return coop_refreshCells(s);
}

// ---------------------------------------------------------------------------
// 아군 봇 조준 — rules_botGoalGap 선례: 시나리오 목표 함수(coop_objective)에서 파생.
// ---------------------------------------------------------------------------
// Ghost 이동 목표 — 활성 거점 **분담 배정** (맨해튼 거리, 격자 전칸 통행이라 BFS 와 동치).
//   [측정 근거] 최근접 단독 배정 1차 구현은 두 Ghost 가 같은 거점에 몰려(트레이스: 목표
//   D4·D4 → D8·D8) 처리량이 절반이 됐다. 좌석 인덱스 오름차순으로 각자 "아직 배정되지 않은"
//   최근접 거점을 집는 그리디 분담 — 전부 배정되면 최근접 낙수. 전 과정 결정론(동률 사전순).
//   활성 거점 없음 → 현위치 유지. 비협동 → null(기존 타겟팅 그대로).
function coop_botGhostGoal(state, fromCoord, selfIdx) {
  if (!coop_active(state)) return null;
  var bases = coop_activeBases(state);
  if (!bases.length) return fromCoord;
  var dist = function (from, coord) {
    return Math.abs(coord.charCodeAt(0) - from.charCodeAt(0)) + Math.abs(parseInt(coord.slice(1), 10) - parseInt(from.slice(1), 10));
  };
  var nearest = function (from, taken) {
    var best = null, bestD = Infinity;
    bases.forEach(function (b) {
      if (taken && taken[b.coord]) return;
      var d = dist(from, b.coord);
      if (d < bestD) { bestD = d; best = b.coord; }
    });
    return best;
  };
  if (selfIdx == null) return nearest(fromCoord, null) || fromCoord;
  var taken = {};
  for (var i = 0; i < state.players.length; i++) {
    var p = state.players[i];
    if (!p || p.role !== 'ghost' || p.defeated) continue;
    var from = (i === selfIdx) ? fromCoord : (p.position || fromCoord);
    var pick = nearest(from, taken) || nearest(from, null);
    if (i === selfIdx) return pick || fromCoord;
    if (pick) taken[pick] = true;
  }
  return nearest(fromCoord, null) || fromCoord;
}
// 카드 스코어 보정 — 비협동 0(항등). 협동: 적대 반쪽 −15(무력화돼 낭비) ·
//   Ghost 는 이동/atk(=강습 연료) 가점 · Bloc 은 경제(=⚙·안정화 연료) 가점.
function coop_halfHostile(h) {
  if (!h) return false;
  for (var i = 0; i < COOP_HOSTILE_KEYS.length; i++) if (h[COOP_HOSTILE_KEYS[i]]) return true;
  return false;
}
function coop_scoreGhost(state, p, c) {
  if (!coop_active(state) || !c) return 0;
  var d = 0, bases = coop_activeBases(state).length;
  [c.top, c.bot].forEach(function (h) {
    if (!h) return;
    if (coop_halfHostile(h) && !(h.atk || h.atk_x2 || h.atk_x3_retort)) d -= 15;
    if (h.move && bases) d += 10;   // 이동 = 강습 사거리 확보 (측정상 병목)
    if ((h.atk || h.atk_x2 || h.atk_x3_retort) && bases) d += 4;   // 거점 위 카드 강습 연료
  });
  return d;
}
// 봇 반쪽 선택 최적화 — executeCards 의 봇 기본 반쪽(1번=top·2번=bot 고정)을 협동에서만
//   목표 정렬로 교체: 거점에서 멀면 move 반쪽(사거리 확보), 거점 사거리 안이면 atk 반쪽
//   (카드 강습 연료). [측정 근거] 기본 반쪽 고정 탓에 고ATK 봇(BLADE)이 이동 반쪽을 한 번도
//   내지 못하고 7R 를 제자리에서 소모하는 트레이스가 관측됐다. 비협동/인간/Bloc → null(기존 그대로).
function coop_botHalves(state, playerIdx, cards) {
  if (!coop_active(state)) return null;
  var p = state.players[playerIdx];
  if (!p || p.kind !== 'bot' || p.role !== 'ghost' || !cards || !cards.length) return null;
  var near = coop_baseNear(state, p.position);
  var GC = (typeof getCard === 'function') ? getCard : null;
  if (!GC) return null;
  return cards.map(function (cid, i) {
    var c = GC(cid);
    var def = i === 0 ? 'top' : 'bot';
    if (!c) return def;
    var score = function (h) {
      if (!h) return -1;
      var v = 0;
      if (h.move) v += (near ? 2 : 10) + h.move;                        // 원거리 = 이동 우선
      if (h.atk || h.atk_x2 || h.atk_x3_retort) v += near ? 12 : 0;     // 사거리 안 = 카드 강습
      if (h.gen) v += 1;
      return v;
    };
    var st = score(c.top), sb = score(c.bot);
    if (st === sb) return def;
    return st > sb ? 'top' : 'bot';
  });
}

function coop_scoreBloc(state, p, c) {
  if (!coop_active(state) || !c) return 0;
  var d = 0;
  [c.main, c.side].forEach(function (h) {
    if (!h) return;
    if (coop_halfHostile(h)) d -= 15;
    if (h.credit || h.stock_buy_any || h.zone_income_2x || h.div_2x || h.bond) d += 6;   // 경제 → ⚙/안정화
    if (h.fortify || h.heal_all) d += 2;
  });
  return d;
}

// ---------------------------------------------------------------------------
// 표시 모델 — HUD(파멸 트랙+목표 진척, 레이스 HUD 대체)·좌측 패널·게임오버가 사용.
//   전부 판정 소스(coop_doom/coop_objective/meta.coop) 파생 — 별도 수치 없음.
// ---------------------------------------------------------------------------
function coop_hudModel(state) {
  if (!coop_active(state)) return null;
  var sc = coop_getScenario(state.meta.scenario);
  var d = coop_doom(state);
  var obj = coop_objective(state);
  var co = coop_meta(state) || coop_initMeta();
  var round = state.meta.round || 1;
  var upcoming = [];
  (sc.coopLandings || []).forEach(function (L) {
    if (L[0] > round && upcoming.length < 3) upcoming.push('R' + L[0] + ' ' + (COOP_TIERS[L[2]] || COOP_TIERS.col).icon + L[1]);
  });
  var alive = coop_activeBases(state);
  return {
    scenId: sc.id, roundLimit: sc.roundLimit,
    doom: d.val, cap: d.cap,
    objLabel: obj ? obj.label : '', objPct: obj ? obj.pct : 0,
    basesAlive: alive.map(function (b) { return (COOP_TIERS[b.tier] || COOP_TIERS.col).icon + b.coord + ' ' + b.hp + '/' + b.hp0; }).join(' · ') || '없음',
    nextLanding: upcoming.join(' · ') || '없음',
    stabCost: coop_rule(state, 'coopStabCost', 2),
    stabilized: co.stabilized || 0, destroyed: co.destroyed || 0,
    starNow: coop_stars(state),
  };
}
function coop_seatLabel(state, i) {
  var p = state.players[i];
  if (!p) return '';
  if (p.role === 'ghost') return '👻 강습력 ' + coop_assaultPower(p) + ' · ★' + (p.resources.rep || 0);
  return '🏢 ⚙' + (p.resources.parts || 0) + '/' + coop_rule(state, 'coopStabCost', 2) + ' 안정화 · ₵' + (p.resources.credit || 0);
}

// 게임 종료 요약 — 게임오버 화면·전적 기록 공용 (승패·별점 전부 최종 state 에서 재계산
//   가능하도록 설계 — VICTORY 액션이 winner/reason 만 보존하는 리듀서 계약 대응).
function coop_result(state) {
  if (!coop_active(state) || !state.meta || !state.meta.gameOver) return null;
  var sc = coop_getScenario(state.meta.scenario);
  var d = coop_doom(state);
  var win = state.meta.winner === 0;
  var stars = win ? coop_stars(state) : 0;
  var co = coop_meta(state) || coop_initMeta();
  return {
    scenId: sc.id, win: win, stars: stars, starText: coop_starText(stars),
    doom: d.val, cap: d.cap, round: state.meta.round,
    roundsLeft: Math.max(0, (sc.roundLimit || 0) - (state.meta.round || 0)),
    destroyed: co.destroyed || 0, landed: co.landed || 0, assaults: co.assaults || 0, stabilized: co.stabilized || 0,
    formula: coop_starFormula(sc),
    epilogue: win
      ? '[SILK] "청구서는 아직 온다. 하지만 오늘 밤, 서명란은 비어 있다." — 도시는 살아남았고, 이번에는 값을 치르지 않았다.'   // [계승] a3-00 REFRAIN 반전
      : '[SILK] "장부가 닫혔어. 다음 장은… 우리 것이 아니야." — 애시그리드 관리권, MERIDIAN 청산관리단 귀속.',
  };
}
function coop_starFormula(sc) {
  return '★1 클리어 · ★2 ' + (sc.star2Rounds != null ? '잔여 라운드 ≥ ' + sc.star2Rounds : '파멸 ≤ ' + sc.star2Doom) +
    ' · ★3 ' + (sc.star3Rounds != null ? '잔여 라운드 ≥ ' + sc.star3Rounds : '파멸 ≤ ' + sc.star3Doom);
}

// ---------------------------------------------------------------------------
// 전적 — localStorage dn_coop_v1 { v:1, scens: { C01: { best, clears, plays } } }.
//   실패 무해(try/catch — file://·헤드리스). C03 해금 = C01·C02 클리어 각 1회 이상.
// ---------------------------------------------------------------------------
var COOP_LS_KEY = 'dn_coop_v1';
function coop_loadRec() {
  try {
    var raw = localStorage.getItem(COOP_LS_KEY);
    if (raw) { var o = JSON.parse(raw); if (o && o.scens) return o; }
  } catch (e) {}
  return { v: 1, scens: {} };
}
function coop_saveRec(rec) { try { localStorage.setItem(COOP_LS_KEY, JSON.stringify(rec)); } catch (e) {} }
function coop_resetRec() { try { localStorage.removeItem(COOP_LS_KEY); } catch (e) {} }
function coop_recordGame(state) {
  var res = coop_result(state);
  if (!res) return null;
  var rec = coop_loadRec();
  var sr = rec.scens[res.scenId] || { best: 0, clears: 0, plays: 0 };
  sr.plays += 1;
  if (res.win) { sr.clears += 1; sr.best = Math.max(sr.best || 0, res.stars); }
  rec.scens[res.scenId] = sr;
  coop_saveRec(rec);
  return sr;
}
function coop_isUnlocked(id) {
  if (id !== 'C03') return true;
  var rec = coop_loadRec();
  return ((rec.scens.C01 || {}).clears || 0) >= 1 && ((rec.scens.C02 || {}).clears || 0) >= 1;
}
// 셋업 화면용 목록 — locked 는 전적 파생, recLine 은 전적 표시 문자열.
function coop_scenarioList() {
  var rec = coop_loadRec();
  return ['C01', 'C02', 'C03'].map(function (id) {
    var sc = COOP_SCENARIOS[id];
    var sr = rec.scens[id] || { best: 0, clears: 0, plays: 0 };
    var locked = !coop_isUnlocked(id);
    return Object.assign({}, sc, {
      locked: locked,
      lockReason: locked ? 'C01·C02 클리어 시 해금' : '',
      recLine: sr.plays ? coop_starText(sr.best || 0) + ' · 클리어 ' + sr.clears + '/' + sr.plays + '판' : '미도전',
    });
  });
}

// 셋업 공표 문구 — 목표/패배/시간표/판정식/별점식 전부 노출 (정보 은닉 없음).
//   문구가 실제 상수를 참조(리터럴 중복 없음) — S07 blackout_orderLen 선례.
function coop_setupInfo(id) {
  var sc = COOP_SCENARIOS[id];
  if (!sc) return [];
  var tt = (sc.coopLandings || []).map(function (L) { return 'R' + L[0] + ' ' + (COOP_TIERS[L[2]] || COOP_TIERS.col).icon + L[1]; }).join(' · ');
  var objTxt = sc.coopObjective === 'destroy' ? '🎯 목표: 거점 ' + coop_totalLandings(sc) + '개 전부 파괴 (' + sc.roundLimit + 'R 이내)'
    : sc.coopObjective === 'survive' ? '🎯 목표: ' + sc.roundLimit + 'R 종료까지 사수 (파멸 상한 미도달)'
    : '🎯 목표: ⚖ 청산인 지휘 거점(내구 ' + sc.coopFlagHp + '·방어 ' + sc.coopFlagDef + ') 격파 (' + sc.roundLimit + 'R 이내)';
  return [
    '🤝 ' + sc.id + ' ' + sc.name + ' — 전 좌석 한 팀 (👻 강습 / 🏢 경제·안정화 비대칭 협동). 정보 은닉 없음: 아래가 전부다.',
    objTxt + ' · ☠ 패배: 파멸 트랙 ' + sc.coopDoomCap + ' 도달 또는 시간표 내 목표 미완수' + (sc.coopObjective === 'survive' ? '(=파멸 상한 도달)' : ''),
    '🛳 상륙 시간표(고정·무작위 없음): ' + tt + ' · 점거 구역 수입 몰수 + 인접 오염(수입 0)',
    '☠ 파멸: 라운드마다 활성 거점당 +' + sc.coopDoomPerBase + (sc.coopDoomOnLand ? ' · 상륙마다 +' + sc.coopDoomOnLand : '') + ' · 거점 파괴 시 −' + sc.coopKillDoom + ' · 🏢 장부 방어(⚙' + sc.coopStabCost + ' 자동 지불, 좌석당 R1회) −1',
    '🗡 강습(자동·공개 판정식): 무기보정+ATK+전투트랙 ≥ 방어 ' + sc.coopBaseDef + (sc.coopFlagDef ? '(기함 ' + sc.coopFlagDef + ')' : '') + ' → 피해 1(+1 if 초과 ≥4) · 실패 HP−1 · 거점 내구 ' + sc.coopBaseHp + (sc.coopFlagHp ? '(기함 ' + sc.coopFlagHp + ')' : ''),
    '⭐ 별점: ' + coop_starFormula(sc) + ' · 전적은 이 기기(dn_coop_v1)에 기록',
    '🚫 협동 게이트: PvP 레이드·적대 M&A·아군 견제·적대 카드 효과 전부 비활성',
  ];
}

// HTML 글로벌 노출 (scenario_module 패턴)
if (typeof window !== 'undefined') {
  window.COOP_SCENARIOS = COOP_SCENARIOS;
  window.COOP_TIERS = COOP_TIERS;
  window.COOP_HOSTILE_KEYS = COOP_HOSTILE_KEYS;
  window.coop_getScenario = coop_getScenario;
  window.coop_active = coop_active;
  window.coop_pvpBlocked = coop_pvpBlocked;
  window.coop_buildRoster = coop_buildRoster;
  window.coop_initMeta = coop_initMeta;
  window.coop_baseAt = coop_baseAt;
  window.coop_activeBases = coop_activeBases;
  window.coop_adj = coop_adj;
  window.coop_refreshCells = coop_refreshCells;
  window.coop_assaultPower = coop_assaultPower;
  window.coop_assault = coop_assault;
  window.coop_effectFilter = coop_effectFilter;
  window.coop_doom = coop_doom;
  window.coop_objective = coop_objective;
  window.coop_stars = coop_stars;
  window.coop_starText = coop_starText;
  window.coop_starFormula = coop_starFormula;
  window.coop_checkEnd = coop_checkEnd;
  window.coop_timeUp = coop_timeUp;
  window.coop_advance = coop_advance;
  window.coop_botGhostGoal = coop_botGhostGoal;
  window.coop_scoreGhost = coop_scoreGhost;
  window.coop_scoreBloc = coop_scoreBloc;
  window.coop_botHalves = coop_botHalves;
  window.coop_baseNear = coop_baseNear;
  window.coop_hudModel = coop_hudModel;
  window.coop_seatLabel = coop_seatLabel;
  window.coop_result = coop_result;
  window.coop_loadRec = coop_loadRec;
  window.coop_resetRec = coop_resetRec;
  window.coop_recordGame = coop_recordGame;
  window.coop_isUnlocked = coop_isUnlocked;
  window.coop_scenarioList = coop_scenarioList;
  window.coop_setupInfo = coop_setupInfo;
}
