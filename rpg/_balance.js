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
// 봇 정책 2종 (결정론 → 정책당 1런이면 충분):
//   'combat'    : 전투형 — 최근접 접근 + 최대 피해 액션(전멸 승리 지향)
//   'objective' : 오브젝티브형 — 오브젝티브 인접 후 우선 차감(오브젝티브 승리 지향)
// 두 정책 모두 방어형 궁극(HP≤40%) · 관통 불가 시 디버프 폴백 · 최대피해 그리디 공유.
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

var CLASSES = ['CIPHER', 'BLADE', 'RIGGER', 'MOLE'];
var POLICIES = ['combat', 'objective'];
var ROUND_CAP = 30;          // 봇 라운드 상한(무한 소모전 가드). 밴드 목표는 3~9.
var TRIVIAL_ROUNDS = 2;      // ≤2R + 무피해 = 트리비얼
var ATTRITION_ROUNDS = 10;   // ≥10R 또는 timeout = 소모전

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

    if (policy === 'objective') {
      // 1) 인접이면 우선 차감.
      if (!c.objective.done && G.chebyshev(p, c.objective) <= 1) {
        var h = S.applyHackObjective(c);
        if (h !== c) { c = h; continue; }
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
function runEncounter(classKey, missionId, policy) {
  var ch = CH.makeCharacter(classKey);
  var mission = CAMP.missionData(missionId);
  if (!mission || !mission.combat) return { error: 'no combat', missionId: missionId };
  var c = S.buildCombat(mission, ch, 'outro');
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
  var winBy = win ? (c.objective.done ? 'objective' : 'eliminate') : null;
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

function runMatrix() {
  var ms = orderedMissions();
  var rows = [];
  for (var mi = 0; mi < ms.length; mi++) {
    var e = ms[mi];
    var cells = {};
    for (var ci = 0; ci < CLASSES.length; ci++) {
      var cls = CLASSES[ci];
      var byPol = {};
      for (var pi = 0; pi < POLICIES.length; pi++) byPol[POLICIES[pi]] = runEncounter(cls, e.id, POLICIES[pi]);
      cells[cls] = byPol;
    }
    rows.push({ id: e.id, kind: e.kind, chapter: e.chapter, order: e.order, cells: cells });
  }
  return rows;
}

// (class,mission) 종합 판정: 어느 정책이든 승리면 클리어 가능.
// 대표 = 최적(최소 라운드) 승리 정책 — 이중승리(오브젝/전멸) 미션에서 합리적 플레이어의
// 실제 체감 난이도. trivial/attrition 은 이 '최적 경로' 기준(느린 정책 grind 는 플레이어 선택).
function verdict(byPol) {
  var combat = byPol.combat, obj = byPol.objective;
  var wins = [];
  if (combat.win) wins.push(combat);
  if (obj.win) wins.push(obj);
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
  return { clearable: clearable, rep: rep, combat: combat, obj: obj, flags: flags };
}

// ---- 출력 ------------------------------------------------------------------
function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
function padL(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }

function cellStr(v) {
  // W=승 L=패 T=timeout. 예: "W5·88%" (승리·5R·HP88%) / "L3" (패·3R)
  if (v.win) return 'W' + v.rounds + '·' + v.hpPct + '%';
  if (v.outcome === 'timeout') return 'T' + v.rounds;
  return 'L' + v.rounds;
}

function printMatrix(rows) {
  var line = '';
  console.log('\n================ 전투 밸런스 매트릭스 (4클래스 × 16미션) ================');
  console.log('셀 = 종합판정(승리 정책 대표). W=승 L=패 T=timeout · R수 · 종료HP%. ⚑=이상치.');
  console.log('C=combat정책 승 / O=objective정책 승 (승리 경로 표기).\n');
  console.log(pad('MISSION', 26) + CLASSES.map(function (c) { return pad(c, 14); }).join('') + '  FLAGS');
  console.log('-'.repeat(26 + 14 * 4 + 12));
  var outliers = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var tag = r.kind === 'main' ? ('ch' + (r.chapter < 10 ? '0' + r.chapter : r.chapter)) : 'side';
    var label = pad(tag + ' ' + r.id.replace(/^(ch\d\d|side)-/, ''), 26);
    var cols = '', rowFlags = {};
    for (var ci = 0; ci < CLASSES.length; ci++) {
      var vd = verdict(r.cells[CLASSES[ci]]);
      var path = (vd.combat.win ? 'C' : '') + (vd.obj.win ? 'O' : '');
      var mark = vd.flags.length ? '⚑' : ' ';
      cols += pad(cellStr(vd.rep) + ' ' + pad(path, 2) + mark, 14);
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
function printTrend(rows) {
  console.log('\n================ 메인 챕터 난이도 경향 (rush=최속승리 · fight=전멸승리 라운드) ================');
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.kind !== 'main') continue;
    var rSum = 0, rN = 0, worst = 0, fSum = 0, fN = 0, fWorst = 0;
    for (var ci = 0; ci < CLASSES.length; ci++) {
      var byPol = r.cells[CLASSES[ci]];
      var vd = verdict(byPol);
      if (vd.clearable) { rSum += vd.rep.rounds; rN++; if (vd.rep.rounds > worst) worst = vd.rep.rounds; }
      if (byPol.combat.win) { fSum += byPol.combat.rounds; fN++; if (byPol.combat.rounds > fWorst) fWorst = byPol.combat.rounds; }
    }
    var rAvg = rN ? (rSum / rN).toFixed(1) : 'NA';
    var fAvg = fN ? (fSum / fN).toFixed(1) : 'NA';
    console.log('  ch' + (r.chapter < 10 ? '0' + r.chapter : r.chapter)
      + '  rushR=' + pad(rAvg, 5) + '(worst' + pad(worst, 2) + ')  fightR=' + pad(fAvg, 5) + '(worst' + pad(fWorst, 2) + ',win' + fN + '/4)'
      + '  clear=' + rN + '/4');
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

function main() {
  var args = process.argv.slice(2);
  if (args.indexOf('--smoke') >= 0) { return smoke(); }
  var rows = runMatrix();
  if (args.indexOf('--json') >= 0) {
    console.log(JSON.stringify(rows, null, 0));
    return;
  }
  var outliers = printMatrix(rows);
  printOutliers(outliers);
  printTrend(rows);
  var sum = summarize(rows);
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
  runEncounter: runEncounter, runMatrix: runMatrix, verdict: verdict,
  CLASSES: CLASSES, POLICIES: POLICIES, orderedMissions: orderedMissions,
};

if (require.main === module) main();
