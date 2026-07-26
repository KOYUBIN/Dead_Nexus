'use strict';
// ============================================================================
// rpg/_balance.js — RPG 전투 밸런스 하네스 (node 실행, 브라우저 0)
//   실행: node rpg/_balance.js            (매트릭스 전수 출력)
//         node rpg/_balance.js --json     (기계 판독 JSON)
//         node rpg/_balance.js --smoke    (결정론 재현 스모크)
// ──────────────────────────────────────────────────────────────────────────
// 전투는 결정론(주사위 0, systems/combat/* 순수 함수)이므로 브라우저·DOM 없이
// 순수 엔진(store.buildCombat + applyMove/applyAttack/applyHackObjective/runEnemyTurn)
// 만으로 자동 플레이가 가능하다. sim-e2e 의 측정 규율(매트릭스+이상치 플래그)을 RPG 로 이식.
//
// 봇 정책 3종 (결정론 → 정책당 1런이면 충분):
//   'combat'    : 전투형 — 최근접 접근 + 최대 피해 액션(전멸 승리 지향)
//   'objective' : 오브젝티브형 — 오브젝티브 인접 후 우선 차감(오브젝티브 승리 지향)
//   'survive'   : [68차] 생존형 — 엄폐 유지·거리 확보(농성). survive:N 선언 인카운터에만
//                 측정된다(SURVIVE_POLICY). 러시 정책이 '전진 중 사망'하는 방어전 유형을
//                 하네스가 클리어 판정할 수 있게 하는 대응 정책 — 미선언 인카운터의 셀
//                 형상(byPol = {combat, objective})은 byte 불변.
// 세 정책 모두 방어형 궁극(HP≤40%) · 관통 불가 시 디버프 폴백 · 최대피해 그리디 공유.
//
// 측정 지표: 승/패 · 봇 라운드 수 · 종료 HP 잔량 % · 증원 발동 여부 · 승리 경로(오브젝/전멸).
// 이상치 플래그: clearFail(양 정책 패) · trivial(≤2R 무피해) · attrition(≥10R/timeout).
// 순수성: 이 하네스는 require 로 순수 모듈만 로드(DOM 0). systems/combat·data 무편집.
// ============================================================================

var S    = require('./state/store.js');
var CAMP = require('./systems/campaign.js');
var CH   = require('./systems/character.js');
var AB   = require('./data/abilities.js');
var G    = require('./systems/combat/grid.js');
var GEAR = require('./data/gear.js');   // [V1] 장비 반영 밸런스 재측정 — 옵트인 파워 밴드.

var CLASSES = ['CIPHER', 'BLADE', 'RIGGER', 'MOLE', 'BROKER', 'DRIFTER'];   // [65차] BROKER·DRIFTER 승격 → 6클래스 재측정.
var POLICIES = ['combat', 'objective'];
// [68차] 생존형(survive:N) 인카운터에만 추가로 측정하는 정책. 기존 인카운터의 셀 형상 불변.
var SURVIVE_POLICY = 'survive';
var ROUND_CAP = 30;          // 봇 라운드 상한(무한 소모전 가드). 밴드 목표는 3~9.
var TRIVIAL_ROUNDS = 2;      // ≤2R + 무피해 = 트리비얼
var ATTRITION_ROUNDS = 10;   // ≥10R 또는 timeout = 소모전

// ---- 장비 시나리오 [V1] (옵트인 파워 밴드 측정) -----------------------------
// 전투 결정론 유지: 장비는 effectiveStats 스탯 델타만(신규 메커닉 0). 시나리오 3종:
//   base = 무장비 — equipment{null,null} → aggregateMods 전부 0 → 기존 64조합 byte 불변(재확인).
//   mid  = 가격 하위 2종(슬롯당 최저가 · classReq 없음 → 전 클래스 동일):
//          weapon SMART_LINK(₵22 ATK+1) · cyberware MOOD_CHIP(₵20 maxHp+2).
//   full = 슬롯당 최고가 장착 가능품(classReq 존중 → 클래스별 상이):
//          weapon HAIR_TRIGGER(₵40 쿨−1, 전 클래스) ·
//          cyberware NEURAL_JACK(₵42 HACK+2·maxHp−2, hack≥3 → CIPHER/RIGGER/MOLE) /
//                    BLADE(hack1)는 장착 불가 → 차순위 IRON_SKIN(₵34 DEF+2·MOV−1).
// classReq 는 base 스탯 기준(gear.canEquip) — 성장/장비 부트스트랩 순환 회피.
var GEAR_SCENARIOS = ['base', 'mid', 'full'];

// 슬롯별 최고가 장착 가능품(결정론: 최고가, 동가는 BY_SLOT 삽입순 유지).
function pickHighestEquippable(slot, ch) {
  var keys = GEAR.BY_SLOT[slot] || [], best = null, bestCost = -1;
  for (var i = 0; i < keys.length; i++) {
    var it = GEAR.ITEMS[keys[i]];
    if (!GEAR.canEquip(it, ch)) continue;
    if (it.cost > bestCost) { bestCost = it.cost; best = keys[i]; }
  }
  return best;
}

function equipFor(scenario, ch) {
  if (scenario === 'mid')  return { weapon: 'SMART_LINK', cyberware: 'MOOD_CHIP' };
  if (scenario === 'full') return { weapon: pickHighestEquippable('weapon', ch), cyberware: pickHighestEquippable('cyberware', ch) };
  return { weapon: null, cyberware: null };   // base(무장비)
}

// ---- 전장 관측 헬퍼 (순수) -------------------------------------------------
function nonStaticEnemiesAlive(c) {
  return c.units.filter(function (u) { return u.side === 'enemy' && u.hp > 0 && u.ai !== 'static'; }).length;
}
function totalEnemyHp(c) {
  var t = 0;
  for (var i = 0; i < c.units.length; i++) { var u = c.units[i]; if (u.side === 'enemy' && u.hp > 0) t += u.hp; }
  return t;
}
function aliveEnemyUnits(c) {
  return c.units.filter(function (u) { return u.side === 'enemy' && u.hp > 0; });
}
function nearestEnemyPos(c) {
  var p = S.player(c), best = null, bestD = Infinity;
  var es = aliveEnemyUnits(c);
  for (var i = 0; i < es.length; i++) {
    if (es[i].ai === 'static') continue;   // 정적 유닛은 접근 목표에서 제외
    var d = G.chebyshev(p, es[i]);
    if (d < bestD || (d === bestD && best && es[i].id < best.id)) { bestD = d; best = es[i]; }
  }
  // 정적만 남은 경우(오브젝티브 승리 대기)에도 목표는 없음 → null
  return best ? { x: best.x, y: best.y } : null;
}

function kitOfKind(kit, kinds) {
  return kit.filter(function (k) { var a = AB.ABILITIES[k]; return a && kinds.indexOf(a.kind) >= 0; });
}

// ---- 봇: 최대 피해 공격 선택 (엔진 시뮬레이션으로 실측 — 피해식 재구현 0) -------
// 각 (공격능력 × 적) 조합을 applyAttack 으로 실제 적용해 총 적HP 감소를 측정, 최대 선택.
// 무효 액션은 applyAttack 이 원본 참조를 그대로 반환 → res===c 로 판별(결정론).
function bestAttack(c) {
  var p = S.player(c);
  var atks = kitOfKind(p.kit, ['RANGED', 'MELEE']);
  var es = aliveEnemyUnits(c);
  var before = totalEnemyHp(c), best = null;
  for (var ai = 0; ai < atks.length; ai++) {
    for (var ei = 0; ei < es.length; ei++) {
      var res = S.applyAttack(c, es[ei].id, atks[ai]);
      if (res === c) continue;                       // AP/사거리/LoS/면역 등 무효
      var dmg = before - totalEnemyHp(res);
      if (!best || dmg > best.dmg) best = { combat: res, dmg: dmg };
    }
  }
  return best;
}

// 디버프 폴백: 관통 가능한 피해가 0일 때 DEF/엄폐를 깎아 다음 라운드 돌파구 확보.
function bestDebuff(c) {
  var p = S.player(c);
  var dbfs = kitOfKind(p.kit, ['DEBUFF']);
  var es = aliveEnemyUnits(c);
  for (var di = 0; di < dbfs.length; di++) {
    for (var ei = 0; ei < es.length; ei++) {
      if (es[ei].ai === 'static') continue;
      var res = S.applyAttack(c, es[ei].id, dbfs[di]);
      if (res !== c) return res;                      // 적용됨(0 피해라도 상태 변화)
    }
  }
  return null;
}

// 다음 적 턴 예상 피격량 (엔진으로 실측 — 은신/무적이면 0). runEnemyTurn 은 순수 클론.
function predictedIncoming(c) {
  var res = S.runEnemyTurn(c);
  return Math.max(0, S.player(c).hp - S.player(res).hp);
}

// 생존 궁극(위협 예측): 미사용 & AP충분 & 위협 잔존일 때, 이번 적 턴에 큰 피격이
// 예상되면(현재HP 60%↑ 또는 최대HP 40%↑ 상실) 또는 이미 위독(HP≤40%)하면 은신/무적 발동.
// 궁극은 미션당 1회(설계된 알파 대응 수단) — 그리디 봇이 패닉 버튼을 유능하게 소비.
function tryUltimate(c) {
  var p = S.player(c);
  if (p.ultUsed || p.ap < 2) return null;
  if (nonStaticEnemiesAlive(c) === 0) return null;
  var critical = p.hp <= p.maxHp * 0.4;
  var incoming = predictedIncoming(c);
  var bigHit = incoming >= p.hp * 0.6 || incoming >= p.maxHp * 0.4;
  if (!critical && !bigHit) return null;
  var ults = kitOfKind(p.kit, ['ULTIMATE']);
  for (var i = 0; i < ults.length; i++) {
    var res = S.applyAttack(c, p.id, ults[i]);
    if (res !== c) return res;
  }
  return null;
}

// 목표 방향 1이동(1 AP, 최대 MOV칸). 엄폐 인지 그리디: 목표로 전진하되(체비쇼프 거리 감소),
// 동거리 후보 중에서는 최근접 적에 대한 엄폐가 큰 타일 우선(맵의 '전진 거점' 엄폐 활용 = 의도된
// 최적 플레이). 진전이 없어도 현재 무엄폐 노출이면 동거리 엄폐 타일로 이동(hunker) 허용.
function nearestEnemyUnit(c, from) {
  var es = aliveEnemyUnits(c), best = null, bestD = Infinity;
  for (var i = 0; i < es.length; i++) {
    if (es[i].ai === 'static') continue;
    var d = G.chebyshev(from, es[i]);
    if (d < bestD || (d === bestD && best && es[i].id < best.id)) { bestD = d; best = es[i]; }
  }
  return best;
}
function coverAt(c, tile) {
  var ne = nearestEnemyUnit(c, tile);
  return ne ? G.coverBonus(ne, tile, c.field, false) : 0;
}
function moveToward(c, goal) {
  if (!goal) return c;
  var p = S.player(c);
  var blocked = G.buildBlocked(c.field, c.units, p.id);
  var reach = G.bfsRange({ x: p.x, y: p.y }, p.mov, blocked, c.field.cols, c.field.rows);
  var curD = G.chebyshev(p, goal);
  var curCover = coverAt(c, { x: p.x, y: p.y });
  var keys = Object.keys(reach), best = null, bestD = curD, bestCover = -1;
  for (var i = 0; i < keys.length; i++) {
    if (reach[keys[i]] === 0) continue;               // 제자리 제외
    var parts = keys[i].split(',');
    var tile = { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) };
    var d = G.chebyshev(tile, goal);
    if (d > curD) continue;                            // 목표에서 멀어지는 이동 배제
    var cov = coverAt(c, tile);
    // 우선순위: 목표 거리 감소 > 엄폐 증가 > 좌표(결정론).
    var better = d < bestD
      || (d === bestD && cov > bestCover)
      || (d === bestD && cov === bestCover && best && (tile.x < best.x || (tile.x === best.x && tile.y < best.y)));
    if (best == null || better) { bestD = d; bestCover = cov; best = tile; }
  }
  if (!best) return c;
  // 전진(거리 감소) 또는 현재 노출 상태에서 엄폐 확보(동거리) 시 이동.
  if (bestD < curD || (bestCover > curCover && curCover === 0)) return S.applyMove(c, best);
  return c;
}

// [68차 §1단계 봉인 코어 대응] 오브젝티브가 '봉인'되었는가 — 차감 사거리(체비쇼프 ≤1, 코어
//   타일 자신 포함)에 해당하는 모든 타일이 벽/엄폐/생존 유닛으로 막혀 있으면 봉인이다.
//   ★기존 30미션의 인카운터는 전부 코어 인접 타일이 열려 있으므로 이 술어는 항상 false →
//     아래 분기가 통째로 단락되어 기존 측정치는 byte 불변(회귀 방어의 근거).
function objectiveBlockers(c) {
  var o = c.objective, blockers = [], open = false;
  var blocked = G.buildBlocked(c.field, c.units, S.player(c).id);
  // 링(체비쇼프 1) 타일만 본다 — 코어 타일 자신은 링을 통과하지 않으면 도달할 수 없으므로
  //   링이 전부 막히면 코어 타일도 도달 불가(= 봉인).
  for (var dx = -1; dx <= 1 && !open; dx++) {
    for (var dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      var x = o.x + dx, y = o.y + dy;
      if (!G.inBounds(x, y, c.field.cols, c.field.rows)) continue;
      if (!blocked[G.key(x, y)]) { open = true; break; }
    }
  }
  if (open) return null;                       // 봉인 아님 → 기존 경로 그대로(단락)
  var es = aliveEnemyUnits(c);
  for (var i = 0; i < es.length; i++) if (G.chebyshev(es[i], o) <= 1) blockers.push(es[i]);
  return blockers.length ? blockers : null;
}

// 봉인 해제 시도 — 봉인 링을 이루는 유닛을 우선 타격. physImmune 링(ICE/WARD)은 useHack
//   능력을 가진 클래스만 실제 피해가 들어가므로(applyAttack 계약), 링을 뚫는 것 자체가
//   "HACK 전용 코어" 의 판정이 된다. 뚫지 못하는 클래스는 null → 전멸 경로로 폴백.
function breachSeal(c) {
  var blockers = objectiveBlockers(c);
  if (!blockers) return null;
  var p = S.player(c);
  var atks = kitOfKind(p.kit, ['RANGED', 'MELEE']);
  var before = totalEnemyHp(c), best = null;
  for (var ai = 0; ai < atks.length; ai++) {
    for (var bi = 0; bi < blockers.length; bi++) {
      var res = S.applyAttack(c, blockers[bi].id, atks[ai]);
      if (res === c) continue;
      var dmg = before - totalEnemyHp(res);
      if (dmg > 0 && (!best || dmg > best.dmg)) best = { combat: res, dmg: dmg };
    }
  }
  return best ? best.combat : null;
}

// [68차 생존형 대응 정책] 농성 이동 — 도달 타일 중 '최근접 적 기준 엄폐 최대 → 적과의 거리
//   최대 → 좌표'(결정론) 순으로 고른다. 현재 타일보다 나은 후보가 없으면 제자리(무이동).
//   러시 정책의 moveToward 와 정반대 목적함수 = 방어전 유형의 클리어 경로를 하네스가 재현.
function hunker(c) {
  var p = S.player(c);
  var ne = nearestEnemyUnit(c, { x: p.x, y: p.y });
  if (!ne) return c;
  var blocked = G.buildBlocked(c.field, c.units, p.id);
  var reach = G.bfsRange({ x: p.x, y: p.y }, p.mov, blocked, c.field.cols, c.field.rows);
  var curCover = coverAt(c, { x: p.x, y: p.y });
  var curDist = G.chebyshev(p, ne);
  var keys = Object.keys(reach), best = null, bestCover = curCover, bestDist = curDist;
  for (var i = 0; i < keys.length; i++) {
    if (reach[keys[i]] === 0) continue;
    var parts = keys[i].split(',');
    var tile = { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) };
    var cov = coverAt(c, tile);
    var d = G.chebyshev(tile, ne);
    var better = cov > bestCover
      || (cov === bestCover && d > bestDist)
      || (cov === bestCover && d === bestDist && best && (tile.x < best.x || (tile.x === best.x && tile.y < best.y)));
    if (better) { bestCover = cov; bestDist = d; best = tile; }
  }
  if (!best) return c;
  return S.applyMove(c, best);
}

// ---- 봇 1턴 (결정론 그리디, 정책별 우선순위) --------------------------------
// 공통: 위협 예측 시 생존 궁극. 이후 정책이 액션 우선순위를 가른다.
//   combat    : 최대 피해 > 디버프 폴백 > 최근접 적 전진 > (교착 시 오브젝티브 차감).
//   objective : 인접 차감 > 오브젝티브로 전진 > (차단 시)공격/디버프 > 차감.
// 은신/무적 궁극이 오브젝티브 러시의 생존 수단(설계된 대체 승리 경로)이 되도록 objective 는
// '적 교전'보다 '전진·차감'을 우선한다.
function playerTurn(c, policy) {
  var guard = 0;
  while (!c.outcome && guard++ < 40) {
    var p = S.player(c);
    if (p.ap < 1) break;

    // 0) 생존 궁극 (양 정책 공통).
    var u = tryUltimate(c);
    if (u) { c = u; continue; }

    // [68차] 생존형 정책 — 버티는 것이 승리 조건이므로 전진 0. 엄폐 확보 → 사거리 안이면
    //   반격 → 인접이면 오브젝티브 차감(부가 승리 경로도 막지 않음).
    if (policy === SURVIVE_POLICY) {
      var hk = hunker(c);
      if (hk !== c) { c = hk; continue; }
      var atkS = bestAttack(c);
      if (atkS && atkS.dmg > 0) { c = atkS.combat; continue; }
      var dbfS = bestDebuff(c);
      if (dbfS) { c = dbfS; continue; }
      if (!c.objective.done && G.chebyshev(p, c.objective) <= 1) {
        var hS = S.applyHackObjective(c);
        if (hS !== c) { c = hS; continue; }
      }
      break;
    }

    if (policy === 'objective') {
      // 1) 인접이면 우선 차감.
      if (!c.objective.done && G.chebyshev(p, c.objective) <= 1) {
        var h = S.applyHackObjective(c);
        if (h !== c) { c = h; continue; }
      }
      // 1.5) [68차] 코어가 봉인된 인카운터 — 링을 먼저 뚫는다(뚫을 수단이 없으면 null → 폴백).
      //      기존 30미션은 objectiveBlockers 가 null → 이 분기 자체가 존재하지 않던 것과 동일.
      if (!c.objective.done) {
        var brc = breachSeal(c);
        if (brc) { c = brc; continue; }
      }
      // 2) 오브젝티브로 전진(적 교전 회피 — 은신으로 관통).
      if (!c.objective.done) {
        var mvO = moveToward(c, { x: c.objective.x, y: c.objective.y });
        if (mvO !== c) { c = mvO; continue; }
      }
      // 3) 전진 불가(차단) → 경로상 적 제거 시도.
      var atkO = bestAttack(c);
      if (atkO && atkO.dmg > 0) { c = atkO.combat; continue; }
      var dbfO = bestDebuff(c);
      if (dbfO) { c = dbfO; continue; }
      // 4) 오브젝티브 완료됨/전멸 대기 → 최근접 적 처리.
      var mvE = moveToward(c, nearestEnemyPos(c));
      if (mvE !== c) { c = mvE; continue; }
      break;
    }

    // combat 정책.
    // 1) 최대 피해 공격.
    var atk = bestAttack(c);
    if (atk && atk.dmg > 0) { c = atk.combat; continue; }
    // 2) 피해 0 → 디버프 폴백(DEF/엄폐 깎기).
    var dbf = bestDebuff(c);
    if (dbf) { c = dbf; continue; }
    // 3) 최근접 적으로 전진(없으면 오브젝티브로).
    var goal = nearestEnemyPos(c) || (!c.objective.done ? { x: c.objective.x, y: c.objective.y } : null);
    var mv = moveToward(c, goal);
    if (mv !== c) { c = mv; continue; }
    // 4) 전멸 불가 교착 → 인접 시 오브젝티브 차감(대체 승리).
    if (!c.objective.done && G.chebyshev(p, c.objective) <= 1) {
      var h2 = S.applyHackObjective(c);
      if (h2 !== c) { c = h2; continue; }
    }
    break;
  }
  return c;
}

// ---- 단일 인카운터 자동 플레이 ---------------------------------------------
// [62차] encKey 옵션 — 지정 시 mission.encounters[encKey] 을 buildCombat 오버라이드(enc②/2연전).
//   미지정 시 mission.combat(enc①) — 하위호환 100%. 엔진 무변경(buildCombat opts.combat 소비).
function runEncounter(classKey, missionId, policy, scenario, encKey, enemyScale) {
  var ch = CH.makeCharacter(classKey);
  // [V1] 장비 시나리오 반영(기본 base=무장비). base 는 equipment{null,null} → effectiveStats
  //   델타 0 → 반환 객체 byte 불변(기존 조합 재확인의 근거). scenario 필드는 미부착(셀 순도 유지).
  ch.equipment = equipFor(scenario || 'base', ch);
  var mission = CAMP.missionData(missionId);
  if (!mission || !mission.combat) return { error: 'no combat', missionId: missionId };
  var encCfg = encKey ? (mission.encounters && mission.encounters[encKey]) : null;
  if (encKey && !encCfg) return { error: 'no encounter ' + encKey, missionId: missionId };
  // [65차 하드모드 축] enemyScale 미지정(1) → buildCombat scale 1 → 반환 객체 byte 불변(base/mid/full
  //   회귀 방어). store.js 하드모드(save.flags.hardMode → scale 1.25)를 하네스로 실측 —
  //   기존 runEncounter 가 enemyScale 미전달로 scale=1 만 측정하던 '측정 사각' 제거.
  var es = enemyScale || 1;
  var opts = (encCfg || es !== 1) ? { combat: encCfg || undefined, enemyScale: es } : undefined;
  var c = S.buildCombat(mission, ch, 'outro', opts);
  var startEnemyHp = totalEnemyHp(c);
  var reinforcedEver = false, rounds = 0, guard = 0;
  while (!c.outcome && rounds < ROUND_CAP && guard++ < 400) {
    c = playerTurn(c, policy);
    rounds++;
    if (c.outcome) break;
    c = S.runEnemyTurn(c);
    if (c.threat && c.threat.reinforced) reinforcedEver = true;
  }
  var p = S.player(c);
  var win = c.outcome === 'win';
  // [68차] 생존형 승리 경로 식별 — 오브젝티브 미완 + 위협 적 잔존인데 승리 = survive:N 도달.
  //   survive 미선언 인카운터(c.survive undefined)에서는 기존 2값('objective'|'eliminate') 불변.
  var winBy = win ? (c.objective.done ? 'objective'
    : ((c.survive && nonStaticEnemiesAlive(c) > 0) ? 'survive' : 'eliminate')) : null;
  return {
    classKey: classKey, missionId: missionId, policy: policy,
    outcome: c.outcome || 'timeout',
    win: win,
    winBy: winBy,
    rounds: rounds,
    hpPct: Math.round(100 * Math.max(0, p.hp) / p.maxHp),
    reinforced: reinforcedEver,
    objDone: !!c.objective.done,
    startEnemyHp: startEnemyHp,
    endEnemyHp: totalEnemyHp(c),
  };
}

// ---- 전수 매트릭스 (4클래스 × 16미션 × 2정책) ------------------------------
function orderedMissions() {
  var ms = CAMP.MISSIONS.slice();
  ms.sort(function (a, b) { return (a.chapter || 99) - (b.chapter || 99) || a.order - b.order; });
  return ms;
}

// [62차] 미션 → 측정 인카운터 목록. enc①(mission.combat) + 각 encounters 키(2연전 enc②).
//   각 인카운터가 개별 행이 되어 전 조합(30미션 · 8미션은 enc①+enc② · 캡스톤은 enc①+stage2+stage3)이 매트릭스에 노출된다.
function encountersOf(e) {
  var m = CAMP.missionData(e.id);
  var list = [{ id: e.id, encKey: null, encLabel: '' }];
  if (m && m.encounters) {
    var keys = Object.keys(m.encounters);
    for (var k = 0; k < keys.length; k++) list.push({ id: e.id, encKey: keys[k], encLabel: '#' + keys[k] });
  }
  return list;
}

// [68차] 인카운터가 소비할 정책 목록. survive:N 선언 인카운터만 'survive' 정책을 추가로
//   측정한다 — 미선언 인카운터는 POLICIES 그대로(셀 byPol 형상 byte 불변 → --json 회귀 방어).
function policiesFor(missionId, encKey) {
  var cfg = encConfig(missionId, encKey);
  return (cfg && cfg.survive) ? POLICIES.concat([SURVIVE_POLICY]) : POLICIES;
}

// 인카운터 config 조회 — enc②(encounters[key]) 우선, 미지정 시 enc①(mission.combat).
function encConfig(missionId, encKey) {
  var m = CAMP.missionData(missionId);
  return encKey ? (m && m.encounters && m.encounters[encKey]) : (m && m.combat);
}

// [71차 M6+M8] 하드모드 배율의 per-encounter 조회 — store.js dialogueChoose 와 동일 규칙
//   ((encCfg || mission.combat).hardScale || 1.25). 하네스가 하드 축을 실측할 때 이 값을
//   enemyScale 로 주입하므로, 미션 데이터의 hardScale 선언이 곧 실측 대상이 된다(표시=판정).
var HARD_SCALE_DEFAULT = 1.25;
function hardScaleFor(missionId, encKey) {
  var cfg = encConfig(missionId, encKey);
  return (cfg && cfg.hardScale) || HARD_SCALE_DEFAULT;
}

// enemyScale 인자는 3형태를 받는다:
//   미지정/1  → scale 1 (노멀 매트릭스 · byte 불변)
//   숫자      → 전 인카운터 동일 배율 (구 하드 축 호출 형태 — 하위호환)
//   'hard'    → [71차] 인카운터별 hardScale 조회(hardScaleFor) = 런타임 store.js 와 동일 규칙
function runMatrix(scenario, enemyScale) {
  var ms = orderedMissions();
  var rows = [];
  for (var mi = 0; mi < ms.length; mi++) {
    var e = ms[mi];
    var encs = encountersOf(e);
    for (var ei = 0; ei < encs.length; ei++) {
      var enc = encs[ei];
      var cells = {};
      var pols = policiesFor(e.id, enc.encKey);   // [68차] 생존형만 3정책, 그 외 2정책(형상 불변).
      var es = (enemyScale === 'hard') ? hardScaleFor(e.id, enc.encKey) : enemyScale;
      for (var ci = 0; ci < CLASSES.length; ci++) {
        var cls = CLASSES[ci];
        var byPol = {};
        // [65차] enemyScale 미지정 → runEncounter es=1 → byte 불변(runMatrix() 무인자 회귀 방어).
        for (var pi = 0; pi < pols.length; pi++) byPol[pols[pi]] = runEncounter(cls, e.id, pols[pi], scenario, enc.encKey, es);
        cells[cls] = byPol;
      }
      // 시나리오는 행에 부착하지 않는다 — base(runMatrix()) 의 JSON 형상 byte 불변 유지(--json 회귀 방어).
      //   enc② 행은 order 를 +0.5 하여 enc① 직후에 정렬(id 에 #encKey 접미).
      rows.push({ id: e.id + enc.encLabel, baseId: e.id, encKey: enc.encKey,
        kind: e.kind, chapter: e.chapter, order: e.order + (enc.encKey ? 0.5 : 0), cells: cells });
    }
  }
  return rows;
}

// (class,mission) 종합 판정: 어느 정책이든 승리면 클리어 가능.
// 대표 = 최적(최소 라운드) 승리 정책 — 이중승리(오브젝/전멸) 미션에서 합리적 플레이어의
// 실제 체감 난이도. trivial/attrition 은 이 '최적 경로' 기준(느린 정책 grind 는 플레이어 선택).
function verdict(byPol) {
  var combat = byPol.combat, obj = byPol.objective;
  // [68차] surv = 생존형 정책 결과(있을 때만). 미선언 인카운터에서는 undefined → 아래
  //   분기가 전부 단락되어 기존 2정책 판정과 완전 동일(하위 호환 불변식).
  var surv = byPol[SURVIVE_POLICY];
  var wins = [];
  if (combat.win) wins.push(combat);
  if (obj.win) wins.push(obj);
  if (surv && surv.win) wins.push(surv);
  var clearable = wins.length > 0;
  var rep = clearable
    ? wins.reduce(function (a, b) { return b.rounds < a.rounds ? b : a; })
    : (combat.rounds >= obj.rounds ? combat : obj);
  var flags = [];
  if (!clearable) flags.push('clearFail');
  else {
    if (rep.rounds <= TRIVIAL_ROUNDS && rep.hpPct >= 100) flags.push('trivial');
    if (rep.rounds >= ATTRITION_ROUNDS || rep.outcome === 'timeout') flags.push('attrition');
  }
  return { clearable: clearable, rep: rep, combat: combat, obj: obj, surv: surv || null, flags: flags };
}

// ---- 출력 ------------------------------------------------------------------
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function padL(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }

// [71차 H4] 계기판 열 폭 — 라벨 32 는 최장 행(a2-side-drifter-lastroad#stage2 = 30자)을 자르지 않는 폭.
var LABEL_W = 32, CELL_W = 14, FLAG_W = 12;

// [71차 H4] 표 제목의 수치는 전부 매트릭스에서 파생한다 — 클래스/미션/인카운터 수 하드코딩 0.
//   (구 제목은 '4클래스 × 30미션 … 40 인카운터' 로 고정돼 6클래스·32미션·42인카운터 확장 후 오표기였다.)
function matrixShape(rows) {
  var missions = {}, extra = 0;
  for (var i = 0; i < rows.length; i++) { missions[rows[i].baseId] = true; if (rows[i].encKey) extra++; }
  var nm = Object.keys(missions).length;
  return { classes: CLASSES.length, missions: nm, encounters: rows.length, extra: extra,
           cells: rows.length * CLASSES.length };
}
function shapeCaption(rows) {
  var s = matrixShape(rows);
  return s.classes + '클래스 × ' + s.encounters + ' 인카운터(' + s.missions + '미션 enc① + 추가 enc '
    + s.extra + ') = ' + s.cells + '셀';
}

// [71차 L1+L3] 행 종류 라벨 — 구 로직은 kind!=='main' 을 전부 'side' 로 찍어 Act 2 16미션이
//   사이드로 오표기됐다. act2 는 act2, 그중 branch 'capstone' 은 cap 으로 분리 표기한다.
//   행 객체에 branch 를 부착하지 않고 campaign 에서 조회 — runMatrix 반환 형상 byte 불변 유지.
function rowTag(kind, chapter, id) {
  if (kind === 'main') return 'ch' + (chapter < 10 ? '0' + chapter : chapter);
  if (kind !== 'act2') return kind;
  var m = CAMP.missionData(String(id).split('#')[0]);
  return (m && m.branch === 'capstone') ? 'cap' : 'act2';
}

function cellStr(v) {
  // W=승 L=패 T=timeout. 예: "W5·88%" (승리·5R·HP88%) / "L3" (패·3R)
  if (v.win) return 'W' + v.rounds + '·' + v.hpPct + '%';
  if (v.outcome === 'timeout') return 'T' + v.rounds;
  return 'L' + v.rounds;
}

function printMatrix(rows) {
  var line = '';
  console.log('\n================ 전투 밸런스 매트릭스 (' + shapeCaption(rows) + ') ================');
  console.log('셀 = 종합판정(승리 정책 대표). W=승 L=패 T=timeout · R수 · 종료HP%. ⚑=이상치. #stage2=2연전 enc②.');
  console.log('행 접두 chNN=메인 · side=사이드 · act2=Act 2 · cap=캡스톤.');
  console.log('C=combat정책 승 / O=objective정책 승 / S=survive정책 승(생존형 인카운터 전용, 68차).\n');
  console.log(pad('MISSION', LABEL_W) + CLASSES.map(function (c) { return pad(c, CELL_W); }).join('') + '  FLAGS');
  console.log('-'.repeat(LABEL_W + CELL_W * CLASSES.length + FLAG_W));
  var outliers = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var tag = rowTag(r.kind, r.chapter, r.baseId);
    var label = pad(tag + ' ' + r.id.replace(/^(ch\d\d|side|a2)-/, ''), LABEL_W);
    var cols = '', rowFlags = {};
    for (var ci = 0; ci < CLASSES.length; ci++) {
      var vd = verdict(r.cells[CLASSES[ci]]);
      var path = (vd.combat.win ? 'C' : '') + (vd.obj.win ? 'O' : '') + (vd.surv && vd.surv.win ? 'S' : '');
      var mark = vd.flags.length ? '⚑' : ' ';
      cols += pad(cellStr(vd.rep) + ' ' + pad(path, 3) + mark, CELL_W);
      for (var f = 0; f < vd.flags.length; f++) rowFlags[vd.flags[f]] = true;
      if (vd.flags.length) outliers.push({ mission: r.id, cls: CLASSES[ci], flags: vd.flags.slice(), rep: vd.rep, combat: vd.combat, obj: vd.obj });
    }
    console.log(label + cols + '  ' + Object.keys(rowFlags).join(','));
  }
  return outliers;
}

function printOutliers(outliers) {
  console.log('\n================ 이상치 목록 ================');
  if (!outliers.length) { console.log('  (이상치 0 — 전 조합 밴드 충족)'); return; }
  for (var i = 0; i < outliers.length; i++) {
    var o = outliers[i];
    console.log('  ⚑ ' + pad(o.mission, 24) + pad(o.cls, 8) + '[' + o.flags.join(',') + ']'
      + '  combat=' + cellStr(o.combat) + ' obj=' + cellStr(o.obj)
      + '  reinf=' + (o.rep.reinforced ? 'Y' : 'N'));
  }
}

// 챕터 순 난이도 경향(메인 8). 두 축을 함께 보고:
//   rushR = 최적(최속) 승리 라운드 클래스 평균 — 오브젝티브 러시 지배(저HP 클래스 캡 반영).
//   fightR= 전투 정책(전멸)이 승리한 클래스의 라운드 평균 — 적 강도에 따른 '실전투' 난이도.
// 러시는 오브젝티브 임계에 캡되고(저HP 생존창), 전투는 적 HP/구성에 비례해 상승 — 후자가
// 챕터 순 난이도 상승을 더 직접 반영한다(NEXUS ch08 이 최장 전투).
// [71차 H4] 한 행(인카운터)의 rush/fight 집계 — 메인 챕터 행과 Act 2 램프 행이 공유한다.
function trendAgg(rowsIn) {
  var a = { rSum: 0, rN: 0, worst: 0, fSum: 0, fN: 0, fWorst: 0, cells: 0 };
  for (var i = 0; i < rowsIn.length; i++) {
    for (var ci = 0; ci < CLASSES.length; ci++) {
      var byPol = rowsIn[i].cells[CLASSES[ci]];
      var vd = verdict(byPol);
      a.cells++;
      if (vd.clearable) { a.rSum += vd.rep.rounds; a.rN++; if (vd.rep.rounds > a.worst) a.worst = vd.rep.rounds; }
      if (byPol.combat.win) { a.fSum += byPol.combat.rounds; a.fN++; if (byPol.combat.rounds > a.fWorst) a.fWorst = byPol.combat.rounds; }
    }
  }
  return a;
}
function trendLine(label, a) {
  var rAvg = a.rN ? (a.rSum / a.rN).toFixed(1) : 'NA';
  var fAvg = a.fN ? (a.fSum / a.fN).toFixed(1) : 'NA';
  // [71차 L1] 분모는 '/4' 하드코딩이 아니라 실제 집계 셀 수(클래스 수 × 행 수) 파생.
  return '  ' + pad(label, 10)
    + '  rushR=' + pad(rAvg, 5) + '(worst' + pad(a.worst, 2) + ')  fightR=' + pad(fAvg, 5)
    + '(worst' + pad(a.fWorst, 2) + ',win' + frac(a.fN, a.cells) + ')'
    + '  clear=' + frac(a.rN, a.cells);
}
function frac(n, d) { return n + '/' + d; }

function printTrend(rows) {
  console.log('\n================ 메인 챕터 난이도 경향 (rush=최속승리 · fight=전멸승리 라운드) ================');
  console.log('  분모 = 해당 구간의 집계 셀 수(클래스 ' + CLASSES.length + ' × 인카운터 행 수).');
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.kind !== 'main') continue;
    console.log(trendLine('ch' + (r.chapter < 10 ? '0' + r.chapter : r.chapter), trendAgg([r])));
  }
  // [71차 H4] Act 2 램프 — Act 2 16미션(42 인카운터 중 act2 행)이 계기판에서 완전히 누락돼
  //   있었다(메인 8챕터만 출력). 분기(framing/A~D/class/capstone) 단위로 램프를 노출한다.
  var branches = [], byBr = {};
  for (var j = 0; j < rows.length; j++) {
    if (rows[j].kind !== 'act2') continue;
    var m = CAMP.missionData(rows[j].baseId);
    var br = (m && m.branch) || '?';
    if (!byBr[br]) { byBr[br] = []; branches.push(br); }
    byBr[br].push(rows[j]);
  }
  if (!branches.length) return;
  console.log('\n---- Act 2 분기 램프 (kind=act2 · 챕터 없음 → branch 단위 집계) ----');
  for (var k = 0; k < branches.length; k++) {
    console.log(trendLine(branches[k], trendAgg(byBr[branches[k]])) + '  (' + byBr[branches[k]].length + ' 인카운터)');
  }
}

function summarize(rows) {
  var total = 0, clearable = 0, trivial = 0, attrition = 0, fail = 0, bandOk = 0;
  for (var i = 0; i < rows.length; i++) {
    for (var ci = 0; ci < CLASSES.length; ci++) {
      var vd = verdict(rows[i].cells[CLASSES[ci]]);
      total++;
      if (vd.clearable) clearable++;
      if (vd.flags.indexOf('clearFail') >= 0) fail++;
      if (vd.flags.indexOf('trivial') >= 0) trivial++;
      if (vd.flags.indexOf('attrition') >= 0) attrition++;
      if (vd.clearable && vd.flags.length === 0) bandOk++;
    }
  }
  console.log('\n================ 요약 (' + total + '조합) ================');
  console.log('  클리어 가능      : ' + clearable + '/' + total);
  console.log('  밴드 충족(무플래그): ' + bandOk + '/' + total);
  console.log('  이상치 clearFail : ' + fail);
  console.log('  이상치 trivial   : ' + trivial);
  console.log('  이상치 attrition : ' + attrition);
  return { total: total, clearable: clearable, bandOk: bandOk, fail: fail, trivial: trivial, attrition: attrition };
}

// ---- 장비 시나리오 비교 [V1] -----------------------------------------------
// 순수 집계(출력 없음) — base/mid/full 매트릭스를 동일 지표로 요약. verdict 재사용.
function aggregateScenario(rows) {
  var s = { total: 0, clearable: 0, bandOk: 0, trivial: 0, attrition: 0, fail: 0, hpSum: 0, repRSum: 0, flagged: [] };
  for (var i = 0; i < rows.length; i++) {
    for (var ci = 0; ci < CLASSES.length; ci++) {
      var vd = verdict(rows[i].cells[CLASSES[ci]]);
      s.total++;
      if (vd.clearable) { s.clearable++; s.hpSum += vd.rep.hpPct; s.repRSum += vd.rep.rounds; }
      if (vd.flags.indexOf('clearFail') >= 0) s.fail++;
      if (vd.flags.indexOf('trivial') >= 0) s.trivial++;
      if (vd.flags.indexOf('attrition') >= 0) s.attrition++;
      if (vd.clearable && vd.flags.length === 0) s.bandOk++;
      if (vd.flags.length) s.flagged.push({ id: rows[i].id, kind: rows[i].kind, chapter: rows[i].chapter, cls: CLASSES[ci], flags: vd.flags.slice(), rep: vd.rep });
    }
  }
  s.avgHp = s.clearable ? s.hpSum / s.clearable : 0;
  s.avgRepR = s.clearable ? s.repRSum / s.clearable : 0;
  return s;
}

// 후반 챕터(ch06~08) 트리비얼화 가드: 최속승리 라운드 min ≥ 3 & 트리비얼 0 이면 합격.
//   장비 옵트인 파워가 엔드게임을 무의미화하지 않는지의 판정(표시=판정 규율).
function lateChapterGuard(rows) {
  var perCh = {}, trivLate = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.kind !== 'main' || r.chapter < 6) continue;
    for (var ci = 0; ci < CLASSES.length; ci++) {
      var vd = verdict(r.cells[CLASSES[ci]]);
      if (!perCh[r.chapter]) perCh[r.chapter] = { min: 99, trivial: 0 };
      if (vd.clearable && vd.rep.rounds < perCh[r.chapter].min) perCh[r.chapter].min = vd.rep.rounds;
      if (vd.flags.indexOf('trivial') >= 0) { perCh[r.chapter].trivial++; trivLate++; }
    }
  }
  var pass = trivLate === 0;
  var chs = Object.keys(perCh).sort();
  for (var k = 0; k < chs.length; k++) if (perCh[chs[k]].min < 3) pass = false;
  return { perCh: perCh, chs: chs, trivLate: trivLate, pass: pass };
}

// ---- [67차 → 71차 개정] 하드모드 실패 분류표 (정직 계기판) --------------------
// [67차 진단] 하드는 spawnEnemy 의 hp/maxHp/atk 만 ceil(×scale) 하고 def·좌표·오브젝티브
//   임계·threatCap 은 base 와 100% 공유하므로, 당시엔 '하드 전용 보정 레버가 없다' 고 기록했다.
//   · 오브젝티브 러시 비용(= ceil(threshold / max(HACK,ATK)))은 scale 무관 → 임계를 건드리면
//     base 도 반드시 같은 비율로 변한다(base 불변 제약과 양립 불가).
//   · 좌표/배치/엄폐/threatCap 변경은 base 의 combat 정책 궤적을 즉시 바꾼다(실측: freeport 에
//     엄폐 1칸 추가 → base BLADE 9R→12R · RIGGER reinforced 반전 · MOLE 86%→100%, 그럼에도
//     hard RIGGER 는 여전히 패). 증원 축도 무력 — hard 에서 발동하는 미션은 base 에서도 전부 발동.
// [71차 M6+M8 개정] 그 레버를 신설했다 — 인카운터별 옵셔널 `hardScale`(store.js dialogueChoose
//   가 조회, 이 하네스가 'hard' 센티널로 동일 조회). hardMode off 면 scale 1 이므로 base/mid/full
//   매트릭스는 구조적으로 불변이고, 하드 축만 인카운터 단위로 낮출 수 있다.
//   그러나 레버의 **유효 해상도가 낮다**: spawnEnemy 가 Math.ceil 을 쓰고 적 atk 가 3~7 의
//   작은 정수라서, (1.0, 1.25] 구간의 어떤 배율도 atk 를 최소 +1 올린다(3→4·4→5 는 1.05 든
//   1.25 든 동일). 실패 원인 1위인 '러시생존창붕괴' 는 바로 그 +1 ATK 가 만드는 것이므로,
//   배율을 낮춰도 scale 을 1(=하드모드 무효화)로 만들지 않는 한 해소되지 않는다.
//   → hardScale 로 실제 해소되는 건은 상단 양자화 스텝(atk 5→7·6→8 이나 hp 큰 값)이 원인인
//     소수 셀뿐이다. 해소분은 미션 데이터에 반영했고, 잔존분은 아래 표에 정직 고정한다.
// 분류 기준(base 대응 셀과 대조):
//   러시생존창붕괴 : base 승리가 오브젝티브 러시 + 잔여HP ≤ 40% → 하드 ATK 가 생존창을 잠식.
//   DEF임계붕괴    : base 무피해(100%) → 하드 ATK 가 DEF+엄폐 문턱을 넘어 0 피해가 유피해로 전환.
//   마진잠식       : base 잔여HP 41~99% → 중간 마진이 잠식된 경우.
//   교착(관통실패) : 하드 combat 정책이 timeout — 피해 관통 불가 소모전.
function classifyHardFail(baseRep, hardCells) {
  if (hardCells.combat.outcome === 'timeout' || hardCells.objective.outcome === 'timeout') return '교착(관통실패)';
  if (!baseRep.win) return '기타(base 미승리)';
  if (baseRep.hpPct >= 100) return 'DEF임계붕괴';
  if (baseRep.hpPct <= 40) return '러시생존창붕괴';
  return '마진잠식';
}

function printHardFailures(scnRows, hardRows) {
  ['base', 'full'].forEach(function (key) {
    var baseIdx = {};
    scnRows[key].forEach(function (r) { baseIdx[r.id] = r; });
    var list = [];
    hardRows[key].forEach(function (r) {
      for (var ci = 0; ci < CLASSES.length; ci++) {
        var cls = CLASSES[ci];
        var vd = verdict(r.cells[cls]);
        if (vd.flags.indexOf('clearFail') < 0) continue;
        var bRep = verdict(baseIdx[r.id].cells[cls]).rep;
        list.push({ id: r.id, cls: cls, kind: classifyHardFail(bRep, r.cells[cls]), bRep: bRep, h: r.cells[cls],
          scale: hardScaleFor(r.baseId, r.encKey) });
      }
    });
    console.log('\n---- [71차] hard×' + key + ' clearFail ' + list.length + '건 분류표 (hardScale 적용 후 잔존 · 정직 고정) ----');
    if (!list.length) { console.log('  (없음)'); return; }
    var byKind = {}, byCls = {};
    list.forEach(function (x) { byKind[x.kind] = (byKind[x.kind] || 0) + 1; byCls[x.cls] = (byCls[x.cls] || 0) + 1; });
    console.log('  ' + pad('미션', LABEL_W) + pad('클래스', 9) + pad('배율', 7) + pad('원인', 16) + pad('base 대응셀', 22) + 'hard(combat / objective)');
    list.forEach(function (x) {
      console.log('  ' + pad(x.id, LABEL_W) + pad(x.cls, 9) + pad(x.scale.toFixed(2), 7) + pad(x.kind, 16)
        + pad((x.bRep.win ? 'W' : 'L') + x.bRep.rounds + 'R·잔여' + x.bRep.hpPct + '%·' + (x.bRep.winBy || '-'), 22)
        + x.h.combat.outcome + x.h.combat.rounds + 'R / ' + x.h.objective.outcome + x.h.objective.rounds + 'R');
    });
    console.log('  원인 분포: ' + Object.keys(byKind).map(function (k) { return k + ' ' + byKind[k]; }).join(' · '));
    console.log('  클래스 분포: ' + CLASSES.map(function (c) { return c + ' ' + (byCls[c] || 0); }).join(' · '));
  });
  // [71차] hardScale 선언 현황 — 어떤 인카운터가 기본 1.25 를 벗어났는지 계기판에 노출.
  var tuned = [];
  hardRows.base.forEach(function (r) {
    var s = hardScaleFor(r.baseId, r.encKey);
    if (s !== HARD_SCALE_DEFAULT) tuned.push(r.id + ' ' + s.toFixed(2));
  });
  console.log('\n  ● hardScale 선언 인카운터 ' + tuned.length + '건 (미선언 = 기본 ' + HARD_SCALE_DEFAULT.toFixed(2) + '): '
    + (tuned.length ? tuned.join(' · ') : '(없음)'));
  console.log('\n  ★ 하드모드 한계(정직 표기 · 71차 개정): 하드 전용 레버 hardScale 은 신설됐고 노멀 축은');
  console.log('    구조적으로 불변이다(hardMode off → scale 1). 다만 spawnEnemy 의 Math.ceil 양자화 때문에');
  console.log('    적 atk(3~7 의 작은 정수)는 배율이 1 을 넘는 순간 최소 +1 이 되고, 이 +1 이 최다 실패 원인인');
  console.log('    러시생존창붕괴를 그대로 만든다 — 즉 배율을 낮춰서 해소되는 셀은 상단 양자화 스텝이 원인인');
  console.log('    소수뿐이며, 나머지는 scale 1(=하드모드 무효화) 외에 미션 데이터로 도달할 수 없다.');
  console.log('    잔존분의 해소 경로는 여전히 데이터 밖 — 저HP 클래스 생존 킷 보강 또는 스케일 정수화 규칙');
  console.log('    (ceil → round/floor) 변경이며, 둘 다 엔진/능력치 변경을 수반해 본 차수 범위 밖이다.');
  console.log('    현재 상태는 rpg/_unit.js 289~291 핀으로 집합째 고정(악화·개선 양방향 회귀 즉시 노출).');
}

function printScenarios() {
  var scn = {}, scnRows = {};
  for (var i = 0; i < GEAR_SCENARIOS.length; i++) {
    scnRows[GEAR_SCENARIOS[i]] = runMatrix(GEAR_SCENARIOS[i]);          // [67차] 행 보존(하드 실패 대조용)
    scn[GEAR_SCENARIOS[i]] = aggregateScenario(scnRows[GEAR_SCENARIOS[i]]);
  }
  var b = scn.base, m = scn.mid, f = scn.full;

  console.log('\n================ 장비 시나리오 매트릭스 [V1] (base · mid · full — 각 ' + shapeCaption(scnRows.base) + ') ================');
  console.log('base=무장비(불변 재확인) · mid=슬롯당 최저가(SMART_LINK+MOOD_CHIP) · full=슬롯당 최고가(HAIR_TRIGGER+NEURAL_JACK/BLADE는 IRON_SKIN).');
  console.log(pad('시나리오', 16) + pad('클리어', 9) + pad('밴드무플래그', 14) + pad('트리비얼', 10) + pad('소모전', 8) + pad('clearFail', 11) + pad('평균종료HP%', 13) + '평균최속R');
  console.log('-'.repeat(94));
  GEAR_SCENARIOS.forEach(function (key) {
    var s = scn[key];
    var label = key === 'base' ? 'base(무장비)' : key === 'mid' ? 'mid(하위2종)' : 'full(최고가)';
    console.log(pad(label, 16) + pad(s.clearable + '/' + s.total, 9) + padL(String(s.bandOk), 6) + pad('', 8)
      + padL(String(s.trivial), 5) + pad('', 5) + padL(String(s.attrition), 4) + pad('', 4) + padL(String(s.fail), 6) + pad('', 5)
      + padL(s.avgHp.toFixed(1), 8) + pad('', 5) + padL(s.avgRepR.toFixed(2), 6));
  });

  // [65차 하드모드 축] hard×base · hard×full (적 스탯 배율 = store.js save.flags.hardMode 실측).
  //   측정 사각 제거 — runEncounter 가 enemyScale 미전달로 scale=1 만 측정하던 것을 하드 배율로 실측.
  //   [71차] 배율은 더 이상 상수 1.25 가 아니라 인카운터별 hardScale 조회('hard' 센티널) —
  //   store.js dialogueChoose 와 동일 규칙이므로 하네스 수치 = 런타임 수치(표시=판정).
  //   오브젝티브 임계는 scale 무영향(spawnEnemy 는 hp/atk 만) → 오브젝티브 러시 경로 불변, 전멸·생존만 가중.
  // [67차] 행(rows)을 보존해 실패 셀을 base 대응 셀과 대조 분류한다(아래 하드 실패 분류표).
  var hardRows = { base: runMatrix('base', 'hard'), full: runMatrix('full', 'hard') };
  var hardScn = { base: aggregateScenario(hardRows.base), full: aggregateScenario(hardRows.full) };
  console.log('  ' + '-'.repeat(92));
  [['hard×base(무장비)', hardScn.base], ['hard×full(최고가)', hardScn.full]].forEach(function (pair) {
    var s = pair[1];
    console.log(pad(pair[0], 16) + pad(s.clearable + '/' + s.total, 9) + padL(String(s.bandOk), 6) + pad('', 8)
      + padL(String(s.trivial), 5) + pad('', 5) + padL(String(s.attrition), 4) + pad('', 4) + padL(String(s.fail), 6) + pad('', 5)
      + padL(s.avgHp.toFixed(1), 8) + pad('', 5) + padL(s.avgRepR.toFixed(2), 6));
  });

  var guard = lateChapterGuard(runMatrix('full'));
  var hardGuardBase = lateChapterGuard(runMatrix('base', 'hard'));
  console.log('\n---- 수용 판정 (docs/25 §8 정직화 · 표시=판정) ----');
  // [62차] base 수용 = 무장비 전 인카운터 클리어 가능 + clearFail 0(램프 불변식). 트리비얼은
  //   전량 enc① 워밍업/ch02 계승 베이스라인(BLADE 탱커) — 문서화 허용(51차 선례).
  console.log('  base : 무장비 전 조합 클리어(' + b.clearable + '/' + b.total + ') · clearFail ' + b.fail
    + ' · 트리비얼 ' + b.trivial + '(enc① 워밍업/ch02 계승 · 허용) — ' + (b.clearable === b.total && b.fail === 0 ? 'PASS' : 'CHECK'));
  var midMargin = (m.clearable === b.clearable) && (m.avgHp >= b.avgHp);
  console.log('  mid  : 클리어율 동일(' + m.clearable + '/' + m.total + '=base) · 여유 증가(평균종료HP ' + b.avgHp.toFixed(1) + '→' + m.avgHp.toFixed(1) + '%) — ' + (midMargin ? 'PASS' : 'CHECK'));
  var chStr = guard.chs.map(function (c) { return 'ch0' + c + ' min=' + guard.perCh[c].min; }).join(' · ');
  console.log('  full : 후반 챕터 최속승리 라운드 ' + chStr + ' · 후반 트리비얼 ' + guard.trivLate + ' — ' + (guard.pass ? 'PASS(≥3R 유지 · 트리비얼화 없음 → 장비 하향 불요)' : 'FAIL(<3R → 장비 수치 하향 보정 필요)'));
  // [65차 하드모드] hard×base = 무장비 +25% 적, 전 조합 클리어 가능 + clearFail 0(하드모드 램프 불변식).
  //   hard×full = 최고가 장비로 하드모드 상쇄 → clearFail 0 + 후반 트리비얼 게이트(≥3R 유지). 하드는 트리비얼을
  //   줄이므로(전멸·생존 가중) 후반 게이트는 여유로 통과 — 판정은 clearFail 0 이 핵심.
  console.log('  hard×base : 하드 배율 적 무장비 전 조합 클리어(' + hardScn.base.clearable + '/' + hardScn.base.total + ') · clearFail ' + hardScn.base.fail
    + ' · 후반 트리비얼 ' + hardGuardBase.trivLate + ' — ' + (hardScn.base.clearable === hardScn.base.total && hardScn.base.fail === 0 ? 'PASS(하드모드 클리어 보장 · 오브젝티브 러시 불변)' : 'FAIL(하드모드 한계 — 71차: hardScale 레버 신설·적용 후 잔존 · ceil 양자화 하한 · 아래 분류표 · 유닛 289 집합 핀)'));
  console.log('  hard×full : 하드 배율 적 최고가 상쇄 클리어(' + hardScn.full.clearable + '/' + hardScn.full.total + ') · clearFail ' + hardScn.full.fail
    + ' · 평균종료HP ' + hardScn.full.avgHp.toFixed(1) + '% — ' + (hardScn.full.clearable === hardScn.full.total && hardScn.full.fail === 0 ? 'PASS(장비로 하드모드 흡수)' : 'FAIL(하드모드 한계 — 장비가 hard×base 실패 대부분을 흡수하나 잔여분 존재 · 유닛 290 집합 핀)'));

  printHardFailures(scnRows, hardRows);

  console.log('\n---- 장비 유발 이상치(신규, base 대비) ----');
  var baseSet = {};
  b.flagged.forEach(function (x) { baseSet[x.id + '|' + x.cls] = true; });
  [['mid', m], ['full', f]].forEach(function (pair) {
    var key = pair[0], s = pair[1];
    var news = s.flagged.filter(function (x) { return !baseSet[x.id + '|' + x.cls]; });
    console.log('  ' + key + ' 신규 이상치 ' + news.length + '건 (후반 ch06~08: ' + news.filter(function (x) { return x.kind === 'main' && x.chapter >= 6; }).length + '건):');
    news.forEach(function (x) {
      var loc = rowTag(x.kind, x.chapter, x.id);   // [71차 L1] act2/cap 을 side 로 뭉개던 표기 분리.
      console.log('    ' + pad(loc + ' ' + x.id, LABEL_W + 4) + pad(x.cls, 8) + '[' + x.flags.join(',') + '] rep=' + cellStr(x.rep));
    });
  });
  console.log('  해설: 트리비얼은 전량 초반/사이드(엔드게임 장비의 정상적 하위콘텐츠 파워) · 후반 챕터 0.');
  console.log('        full CIPHER ch06 attrition = NEURAL_JACK maxHp−2 로 러시 사망→전멸 그라인드(옵트인 글래스캐논 대가, 트리비얼의 반대). 장비 무변경.');
  return { scn: scn, guard: guard };
}

function main() {
  var args = process.argv.slice(2);
  if (args.indexOf('--smoke') >= 0) { return smoke(); }
  if (args.indexOf('--scenarios') >= 0) { printScenarios(); process.exit(0); }
  var rows = runMatrix();
  if (args.indexOf('--json') >= 0) {
    console.log(JSON.stringify(rows, null, 0));
    return;
  }
  var outliers = printMatrix(rows);
  printOutliers(outliers);
  printTrend(rows);
  var sum = summarize(rows);
  printScenarios();   // [V1] 장비 3시나리오 비교 + 후반 챕터 트리비얼화 가드.
  process.exit(0);
}

// 결정론 재현 스모크 (같은 입력 2회 = 같은 결과).
function smoke() {
  var okAll = true;
  for (var ci = 0; ci < CLASSES.length; ci++) {
    for (var pi = 0; pi < POLICIES.length; pi++) {
      var a = runEncounter(CLASSES[ci], 'ch01-first-blood', POLICIES[pi]);
      var b = runEncounter(CLASSES[ci], 'ch01-first-blood', POLICIES[pi]);
      var same = JSON.stringify(a) === JSON.stringify(b);
      okAll = okAll && same;
      console.log('  ' + (same ? 'PASS' : 'FAIL') + '  ' + CLASSES[ci] + '/' + POLICIES[pi] + ' 결정론 재현');
    }
  }
  process.exit(okAll ? 0 : 1);
}

module.exports = {
  runEncounter: runEncounter, runMatrix: runMatrix, verdict: verdict, playerTurn: playerTurn,
  encountersOf: encountersOf,
  CLASSES: CLASSES, POLICIES: POLICIES, orderedMissions: orderedMissions,
  // [V1] 장비 시나리오 API (유닛 핀 고정용).
  GEAR_SCENARIOS: GEAR_SCENARIOS, equipFor: equipFor,
  aggregateScenario: aggregateScenario, lateChapterGuard: lateChapterGuard,
};

if (require.main === module) main();
