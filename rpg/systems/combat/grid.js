;(function () {
  'use strict';
  // ==========================================================================
  // systems/combat/grid.js — 그리드 기하: BFS 이동범위 · 인접 · LoS · 엄폐 [G2]
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수만. 리액트/DOM/문서객체 참조 0 (G2 규율 — 린트 항목화, 유닛테스트 대상).
  //   bfsRange   : 8방 BFS 도달 타일 (벽/유닛 차단)  [신규 docs/25 §3.2]
  //   chebyshev  : 8방 사거리(체비쇼프 거리)
  //   lineOfSight: 벽만 불투명, 엄폐는 투과            [신규 docs/25 §3.4]
  //   coverBonus : SR식 플랫 엄폐 (light+1/full+2)     [신규 docs/25 §3.4]
  //   종료성: 유한 타일집합 위 BFS + no-path 가드       [G9]
  // ==========================================================================

  var DIRS8 = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  function key(x, y) { return x + ',' + y; }

  function inBounds(x, y, cols, rows) {
    return x >= 0 && y >= 0 && x < cols && y < rows;
  }

  // 8방 사거리 (대각 = 1). 원거리 무기 사거리 판정에 사용.
  function chebyshev(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  // 차단 집합 빌드: 벽 + (제외 유닛 뺀) 살아있는 유닛 점유. 엄폐 크레이트도 이동 차단.
  function buildBlocked(field, units, exceptId) {
    var blocked = {};
    var i;
    for (i = 0; i < field.walls.length; i++) blocked[key(field.walls[i].x, field.walls[i].y)] = true;
    for (i = 0; i < field.cover.length; i++) blocked[key(field.cover[i].x, field.cover[i].y)] = true;
    if (units) {
      for (i = 0; i < units.length; i++) {
        var u = units[i];
        if (u.hp <= 0) continue;
        if (exceptId != null && u.id === exceptId) continue;
        blocked[key(u.x, u.y)] = true;
      }
    }
    return blocked;
  }

  // 8방 BFS 도달 타일. 반환: { "x,y": distance } (start 포함, distance 0).
  //   mov: 최대 이동 칸수. blocked: 차단 맵. [G9 유한집합 탐색 — 종료 보장]
  function bfsRange(start, mov, blocked, cols, rows) {
    var dist = {};
    var sk = key(start.x, start.y);
    dist[sk] = 0;
    var frontier = [{ x: start.x, y: start.y }];
    while (frontier.length) {
      var cur = frontier.shift();
      var d = dist[key(cur.x, cur.y)];
      if (d >= mov) continue;
      for (var i = 0; i < DIRS8.length; i++) {
        var nx = cur.x + DIRS8[i][0];
        var ny = cur.y + DIRS8[i][1];
        if (!inBounds(nx, ny, cols, rows)) continue;
        var nk = key(nx, ny);
        if (blocked[nk]) continue;
        if (dist[nk] != null) continue;      // 방문 완료 (유한집합 → 종료성)
        dist[nk] = d + 1;
        frontier.push({ x: nx, y: ny });
      }
    }
    return dist;
  }

  // 최단 경로(도달 타일 목록의 이전 노드 추적). goal 미도달 시 null (no-path 가드, G9).
  function bfsPath(start, goal, blocked, cols, rows) {
    if (start.x === goal.x && start.y === goal.y) return [{ x: start.x, y: start.y }];
    var prev = {};
    var sk = key(start.x, start.y);
    var seen = {}; seen[sk] = true;
    var frontier = [{ x: start.x, y: start.y }];
    while (frontier.length) {
      var cur = frontier.shift();
      for (var i = 0; i < DIRS8.length; i++) {
        var nx = cur.x + DIRS8[i][0];
        var ny = cur.y + DIRS8[i][1];
        if (!inBounds(nx, ny, cols, rows)) continue;
        var nk = key(nx, ny);
        if (seen[nk]) continue;
        // goal 은 blocked(유닛 점유)여도 목적지로 허용 — 인접 도달 판정에 쓰임.
        var isGoal = (nx === goal.x && ny === goal.y);
        if (blocked[nk] && !isGoal) continue;
        seen[nk] = true;
        prev[nk] = { x: cur.x, y: cur.y };
        if (isGoal) {
          var path = [{ x: nx, y: ny }];
          var p = prev[nk];
          while (p) { path.unshift({ x: p.x, y: p.y }); p = prev[key(p.x, p.y)]; }
          return path;
        }
        frontier.push({ x: nx, y: ny });
      }
    }
    return null; // no-path
  }

  // LoS: 벽만 불투명. 엄폐 크레이트·유닛은 투과(사격 가능). Bresenham 근사.
  function lineOfSight(a, b, field) {
    var wallSet = {};
    for (var i = 0; i < field.walls.length; i++) wallSet[key(field.walls[i].x, field.walls[i].y)] = true;
    var x0 = a.x, y0 = a.y, x1 = b.x, y1 = b.y;
    var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    var err = dx - dy;
    var x = x0, y = y0;
    var guard = 0;
    while (guard++ < 1000) {
      if (x === x1 && y === y1) return true;
      // 시작/끝 타일 자체는 벽 검사 제외 (끝점은 대상 위치).
      if (!(x === x0 && y === y0) && wallSet[key(x, y)]) return false;
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return false;
  }

  // 엄폐 보정: 대상에 직교 인접한 엄폐 크레이트가 '공격자 쪽'에 있으면 DEF 보정.
  //   light=+1, full=+2. 여러 개면 최대값. coverNull(GLITCH)이면 0.
  function coverBonus(attacker, target, field, coverNull) {
    if (coverNull) return 0;
    var best = 0;
    for (var i = 0; i < field.cover.length; i++) {
      var c = field.cover[i];
      var adjOrtho = (Math.abs(c.x - target.x) + Math.abs(c.y - target.y)) === 1;
      if (!adjOrtho) continue;
      // 엄폐물이 공격자 방향(대상→공격자)과 같은 축 방향인가?
      var towardX = (c.x - target.x) !== 0 && sign(c.x - target.x) === sign(attacker.x - target.x);
      var towardY = (c.y - target.y) !== 0 && sign(c.y - target.y) === sign(attacker.y - target.y);
      if (towardX || towardY) {
        var v = c.type === 'full' ? 2 : 1;
        if (v > best) best = v;
      }
    }
    return best;
  }

  function sign(n) { return n > 0 ? 1 : (n < 0 ? -1 : 0); }

  var API = {
    DIRS8: DIRS8, key: key, inBounds: inBounds, chebyshev: chebyshev,
    buildBlocked: buildBlocked, bfsRange: bfsRange, bfsPath: bfsPath,
    lineOfSight: lineOfSight, coverBonus: coverBonus,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_GRID = API;
})();
