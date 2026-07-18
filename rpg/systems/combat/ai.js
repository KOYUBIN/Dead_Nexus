;(function () {
  'use strict';
  // ==========================================================================
  // systems/combat/ai.js — 적 유틸리티 트리 + 종료성 가드 + 텔레그래프 [G8/G9]
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수만. 리액트/DOM/문서객체 참조 0 (G2).
  //   planEnemyTurn : 결정론 의도 산출 (매 호출 동일 입력 → 동일 출력)  [G9 종료성]
  //   telegraphFor  : planEnemyTurn 결과에서 표시용 셀 파생
  //                   → 예측 = 실행 이 '동일 plan 소비'로 구조적으로 보장 [G8]
  // 유틸리티 트리 (docs/25 §3.7):
  //   1) 이번 턴 처치 가능 → 공격
  //   2) 비엄폐 + 사거리 내 적 → LoS/사거리 유지 최근접 엄폐 타일 이동 후 사격
  //   3) 그 외 → 최근접 플레이어로 BFS 전진, AP 남으면 사격
  // 종료성: 도달 타일 유한집합 위 탐색 + no-path 가드.
  // ==========================================================================

  function getDeps() {
    if (typeof window !== 'undefined' && window.RPG_GRID) {
      return { G: window.RPG_GRID, R: window.RPG_RESOLVE, A: window.RPG_ATTRS };
    }
    return {
      G: require('./grid.js'),
      R: require('./resolve.js'),
      A: require('../../data/attributes.js'),
    };
  }

  function alivePlayers(state) {
    return state.units.filter(function (u) {
      return u.side === 'player' && u.hp > 0 && !(u.status && u.status.stealth);
    });
  }

  function effDef(unit) {
    var d = unit.def || 0;
    if (unit.status && unit.status.defDown) d -= unit.status.defDown;
    return Math.max(0, d);
  }

  // tile 에서 대상들에게 가능한 최고 사격. 반환 { targetId, targetTile, dmg, targetHp } 또는 null.
  function bestShotFrom(enemy, tile, players, field, deps) {
    var G = deps.G, R = deps.R, A = deps.A;
    var best = null;
    for (var i = 0; i < players.length; i++) {
      var p = players[i];
      var dist = G.chebyshev(tile, p);
      if (dist > (enemy.range || 1)) continue;
      if (!G.lineOfSight(tile, p, field)) continue;
      var coverNull = enemy.ignoreCover ? true : false;
      var cover = G.coverBonus(tile, p, field, coverNull);
      var aff = A.affinityMod(enemy.attr, p.attr);
      var res = R.computeDamage({ atkValue: enemy.atk, def: effDef(p), cover: cover, affinity: aff });
      var cand = { targetId: p.id, targetTile: { x: p.x, y: p.y }, dmg: res.dmg, targetHp: p.hp };
      if (isBetterShot(cand, best)) best = cand;
    }
    return best;
  }

  function isBetterShot(a, b) {
    if (!b) return true;
    if (a.dmg !== b.dmg) return a.dmg > b.dmg;         // 최대 피해
    if (a.targetHp !== b.targetHp) return a.targetHp < b.targetHp; // 낮은 HP 우선
    return a.targetId < b.targetId;                    // 안정적 tie-break
  }

  // 후보 타일(사격 가능) 우열: 처치 > 엄폐(생존) > 피해 > 근접 > 좌표.  [결정론]
  function isBetterTile(a, b) {
    if (!b) return true;
    if (a.lethal !== b.lethal) return a.lethal;
    if (a.cover !== b.cover) return a.cover > b.cover;
    if (a.shot.dmg !== b.shot.dmg) return a.shot.dmg > b.shot.dmg;
    if (a.dist !== b.dist) return a.dist < b.dist;
    if (a.tile.x !== b.tile.x) return a.tile.x < b.tile.x;
    return a.tile.y < b.tile.y;
  }

  function nearestPlayer(from, players, deps) {
    var G = deps.G, best = null, bestD = Infinity;
    for (var i = 0; i < players.length; i++) {
      var d = G.chebyshev(from, players[i]);
      if (d < bestD || (d === bestD && best && players[i].id < best.id)) { bestD = d; best = players[i]; }
    }
    return best;
  }

  // ★핵심: 결정론 의도 산출. moveTo(이동 후 위치) + attack(사격 의도) + path.
  function planEnemyTurn(state, enemyId) {
    var deps = getDeps(), G = deps.G;
    var enemy = null, i;
    for (i = 0; i < state.units.length; i++) if (state.units[i].id === enemyId) enemy = state.units[i];
    var plan = { unitId: enemyId, moveTo: null, path: null, attack: null };
    if (!enemy || enemy.hp <= 0) return plan;
    plan.moveTo = { x: enemy.x, y: enemy.y };
    if (enemy.ai === 'static' || enemy.mov == null || enemy.ap <= 0) return plan; // ICE 등 무행동

    var players = alivePlayers(state);
    if (!players.length) return plan;

    // [각색 blade.md Card02 SUPPRESSION] 이동 저지: 유효 mov = mov − movDown (0 하한).
    var effMov = Math.max(0, (enemy.mov || 0) - ((enemy.status && enemy.status.movDown) || 0));

    var field = state.field;
    var blocked = G.buildBlocked(field, state.units, enemyId);
    var reach = G.bfsRange({ x: enemy.x, y: enemy.y }, effMov, blocked, field.cols, field.rows);

    // 1~3) 사격 가능한 도달 타일 중 최적 선택.
    var bestTile = null;
    var keys = Object.keys(reach);
    for (i = 0; i < keys.length; i++) {
      var parts = keys[i].split(',');
      var tile = { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) };
      var shot = bestShotFrom(enemy, tile, players, field, deps);
      if (!shot) continue;
      // 이 타일에서 enemy 자신이 받는 엄폐(생존성) — 최근접 플레이어 기준.
      var np = nearestPlayer(tile, players, deps);
      var selfCover = np ? G.coverBonus(np, tile, field, false) : 0;
      var cand = { tile: tile, dist: reach[keys[i]], shot: shot, cover: selfCover, lethal: shot.dmg >= shot.targetHp };
      if (isBetterTile(cand, bestTile)) bestTile = cand;
    }

    if (bestTile) {
      plan.moveTo = bestTile.tile;
      plan.attack = bestTile.shot;
      plan.path = bestTile.dist > 0 ? G.bfsPath({ x: enemy.x, y: enemy.y }, bestTile.tile, blocked, field.cols, field.rows) : [{ x: enemy.x, y: enemy.y }];
      return plan;
    }

    // 3) 사격 불가 → 최근접 플레이어로 전진 (no-path 가드).
    var target = nearestPlayer({ x: enemy.x, y: enemy.y }, players, deps);
    var path = G.bfsPath({ x: enemy.x, y: enemy.y }, target, blocked, field.cols, field.rows);
    if (path && path.length > 1) {
      // 목적지 직전(플레이어 타일 제외)까지 유효 mov 칸 전진.
      var maxIdx = Math.min(effMov, path.length - 2); // path[last]=플레이어 타일
      if (maxIdx >= 1) {
        plan.moveTo = { x: path[maxIdx].x, y: path[maxIdx].y };
        plan.path = path.slice(0, maxIdx + 1);
      }
    }
    return plan;
  }

  // 텔레그래프: plan 에서 표시 셀 파생. 예측=실행 이 동일 plan 소비로 보장 [G8].
  function telegraphFor(state, enemyId) {
    var plan = planEnemyTurn(state, enemyId);
    return {
      unitId: enemyId,
      moveTile: plan.moveTo,
      attackTile: plan.attack ? plan.attack.targetTile : null,
      predictedDmg: plan.attack ? plan.attack.dmg : 0,
      targetId: plan.attack ? plan.attack.targetId : null,
    };
  }

  var API = { planEnemyTurn: planEnemyTurn, telegraphFor: telegraphFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_AI = API;
})();
