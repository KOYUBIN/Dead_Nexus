'use strict';
// ============================================================================
// rpg/_unit.js — RPG 모드 Stage 1+2 순수 로직 유닛 테스트 (node 실행, 의존성 0)
//   실행: node rpg/_unit.js
//   Stage 1 (1~46): 결정론 피해식 · BFS 이동범위 · AP 소모 · 텔레그래프 예측=실행 ·
//         스탯 게이트 · 엄폐 · 상성 · 오브젝티브 · 성장 반영 · 세이브 · MFU 통합.
//   Stage 2 (47~): 시그널 다이 4상태 · BLADE 근접 킷(POINT BLANK/SUPPRESSION/DOUBLE TAP/
//         LAST STAND) · 위협/노출 게이지 실동(증원 페이싱) · 대화 분기 영속 · 로스터 선택 ·
//         오브젝티브 무력 강습 · 상성 매트릭스·SURGE 2배.
// ============================================================================
var G    = require('./systems/combat/grid.js');
var R    = require('./systems/combat/resolve.js');
var AI   = require('./systems/combat/ai.js');
var ATTR = require('./data/attributes.js');
var DLG  = require('./systems/dialogue.js');
var CH   = require('./systems/character.js');
var CAMP = require('./systems/campaign.js');
var S    = require('./state/store.js');
var SAVE = require('./state/save.js');
var SIG  = require('./data/signal.js');
var CL   = require('./data/classes.js');
var AB   = require('./data/abilities.js');
var MI   = require('./data/missions/ch01-first-blood.js');

var pass = 0, fail = 0, fails = [];
function ok(name, cond) { if (cond) { pass++; console.log('  PASS  ' + name); } else { fail++; fails.push(name); console.log('  FAIL  ' + name); } }
function eq(name, a, b) { ok(name + '  (' + JSON.stringify(a) + ' === ' + JSON.stringify(b) + ')', JSON.stringify(a) === JSON.stringify(b)); }

console.log('\n== 결정론 피해식 [G5] ==');
eq('1. 해킹샷 HACK5 vs DEF1 = 4', R.computeDamage({ atkValue: 5, def: 1 }).dmg, 4);
eq('2. 엄폐 light: HACK5 − DEF1 − 1 = 3', R.computeDamage({ atkValue: 5, def: 1, cover: 1 }).dmg, 3);
eq('3. 완전엄폐 full: HACK5 − DEF1 − 2 = 2', R.computeDamage({ atkValue: 5, def: 1, cover: 2 }).dmg, 2);
var bounce = R.computeDamage({ atkValue: 2, def: 3 });
ok('4. 튕김: ATK2 vs DEF3 = 0 & blocked', bounce.dmg === 0 && bounce.blocked === true);
eq('5. 상성 +1: HACK5 vs DEF1 상성 = 5', R.computeDamage({ atkValue: 5, def: 1, affinity: 1 }).dmg, 5);
eq('6. DATA SPIKE 관통2 vs 기계 DEF3 = (5+2)−(3−2) = 6', R.computeDamage({ atkValue: 5, def: 3, bonus: 2, pierce: 2 }).dmg, 6);
eq('7. ZERO TRACE 크리 ×2: (HACK5−DEF1)×2 = 8', R.computeDamage({ atkValue: 5, def: 1, crit: 2 }).dmg, 8);

console.log('\n== 속성 상성 [계승 docs/06 §6] ==');
eq('8. MESH ▶ SHADE = +1', ATTR.affinityMod('MESH', 'SHADE'), 1);
eq('9. 역상성 MESH←SHADE = −1', ATTR.affinityMod('IRON', 'BIO'), -1);
eq('10. 무상성 MESH vs IRON = 0', ATTR.affinityMod('MESH', 'IRON'), 0);

console.log('\n== 오브젝티브 threshold 누적 차감 [각색 docs/07 §변경요약] ==');
var od1 = R.objectiveDamage({ threshold: 6, veil: 0 }, 5, 0);
eq('11. thr6 − HACK5 = 1 (미도달)', [od1.threshold, od1.reached], [1, false]);
var od2 = R.objectiveDamage({ threshold: 1, veil: 0 }, 5, 0);
ok('12. thr1 − HACK5 = 0 & reached', od2.threshold === 0 && od2.reached === true);
var odB = R.objectiveDamage({ threshold: 6, veil: 0 }, 5, 1);
eq('13. BACKDOOR 보너스 +1: thr6 − 6 = 0', odB.reached, true);

console.log('\n== 상처/BLEEDING [계승 docs/07 §7] ==');
eq('14. HP 6/12 (50%) → −1 = 5', R.bleedingTick({ hp: 6, maxHp: 12 }).hp, 5);
eq('15. HP 7/12 (>50%) → 무변동', R.bleedingTick({ hp: 7, maxHp: 12 }).hp, 7);

console.log('\n== BFS 이동 범위 & 기하 [신규 §3.2] ==');
var field = { cols: 6, rows: 8, walls: [{ x: 2, y: 6 }], cover: [] };
var blocked = G.buildBlocked(field, [{ id: 'z', x: 3, y: 6, hp: 5 }], null);
var reach = G.bfsRange({ x: 2, y: 7 }, 2, blocked, 6, 8);
ok('16. BFS mov2 from (2,7): (2,5) 도달', reach['2,5'] === 2);
ok('17. BFS: 벽 (2,6) 미도달', reach['2,6'] == null);
ok('18. BFS: 점유 유닛 (3,6) 미도달', reach['3,6'] == null);
eq('19. chebyshev (0,0)-(2,3) = 3', G.chebyshev({ x: 0, y: 0 }, { x: 2, y: 3 }), 3);
var losField = { cols: 6, rows: 8, walls: [{ x: 2, y: 4 }], cover: [{ x: 2, y: 4, type: 'light' }] };
ok('20. LoS: 벽이 차단', G.lineOfSight({ x: 2, y: 7 }, { x: 2, y: 2 }, { walls: [{ x: 2, y: 4 }] }) === false);
ok('21. LoS: 엄폐는 투과(벽 없음)', G.lineOfSight({ x: 2, y: 7 }, { x: 2, y: 2 }, { walls: [] }) === true);

console.log('\n== 엄폐 플랫 보정 [신규 §3.4] ==');
var cf = { cover: [{ x: 2, y: 3, type: 'light' }, { x: 4, y: 4, type: 'full' }] };
eq('22. light 엄폐(공격자 아래): +1', G.coverBonus({ x: 2, y: 7 }, { x: 2, y: 2 }, cf, false), 1);
eq('23. full 엄폐: +2', G.coverBonus({ x: 4, y: 7 }, { x: 4, y: 3 }, cf, false), 2);
eq('24. coverNull(GLITCH): 0', G.coverBonus({ x: 2, y: 7 }, { x: 2, y: 2 }, cf, true), 0);

console.log('\n== 적 텔레그래프 [G8] 예측 = 실행 ==');
var tgState = { field: { cols: 6, rows: 8, walls: [], cover: [] }, units: [
  { id: 'cipher', side: 'player', x: 2, y: 6, hp: 12, maxHp: 12, atk: 2, def: 1, attr: 'MESH', status: {} },
  { id: 'e0', side: 'enemy', x: 2, y: 3, hp: 5, maxHp: 5, atk: 3, def: 1, spd: 4, mov: 4, ap: 2, attr: 'IRON', range: 4, ai: 'coverShooter', status: {} },
] };
var tgA = AI.telegraphFor(tgState, 'e0');
var tgB = AI.telegraphFor(tgState, 'e0');
ok('25. 텔레그래프 결정론(2회 동일)', JSON.stringify(tgA) === JSON.stringify(tgB));
ok('26. 텔레그래프: CIPHER 조준 & dmg 예측', tgA.targetId === 'cipher' && tgA.predictedDmg === 2);
// 실행: runEnemyTurn 이 예측 피해를 그대로 적용
var execCombat = { field: tgState.field, units: JSON.parse(JSON.stringify(tgState.units)),
  objective: { x: 0, y: 0, threshold: 6, done: false }, outcome: null, round: 1, log: [], floaters: [] };
var afterEnemy = S.runEnemyTurn(execCombat);
var pAfter = S.player(afterEnemy);
eq('27. 예측 피해(2) = 실행 피해(12→10)', 12 - pAfter.hp, tgA.predictedDmg);

console.log('\n== AP 소모 [신규 §3.2] ==');
var st = S.rpgInitialState();
st = S.startMission(st, 'ch01-first-blood');
st = S.dialogueChoose(st, 0); // intro -> approach
st = S.dialogueChoose(st, 0); // approach(무력) -> combat
var c0 = st.combat; var p0 = S.player(c0);
eq('28. 전투 시작 AP = 2', p0.ap, 2);
// (1,6)=개방 타일 (시작 정면 (2,6)/(3,6)은 완전엄폐 크레이트라 진입 불가 — 의도된 설계).
var c1 = S.applyMove(c0, { x: 1, y: 6 });
eq('29. 이동 후 AP = 1', S.player(c1).ap, 1);
ok('30. 이동으로 위치 변경 (1,6)', S.player(c1).x === 1 && S.player(c1).y === 6);
var c2 = S.applyHackObjective(c1); // 서버랙(2,0) 미인접 → no-op (AP 유지)
eq('31. 오브젝티브 미인접 시 no-op(AP 1 유지)', S.player(c2).ap, 1);

console.log('\n== 스탯 게이트 판정 [MFU §4.2] ==');
var ctxHi = { attrs: { hack: 5 }, tags: [], flags: {} };
var ctxLo = { attrs: { hack: 3 }, tags: [], flags: {} };
ok('32. [HACK 4] 충족(HACK5)', DLG.evalGate({ attr: 'hack', min: 4 }, ctxHi).ok === true);
ok('33. [HACK 4] 미충족(HACK3)', DLG.evalGate({ attr: 'hack', min: 4 }, ctxLo).ok === false);
ok('34. [VANTA 태그] 미충족(태그 없음)', DLG.evalGate({ tag: 'VANTA' }, ctxHi).ok === false);
eq('35. 미충족 선택지 표시=gray', DLG.choiceState({ gate: { tag: 'VANTA' }, show: 'gray' }, ctxHi), 'gray');

console.log('\n== 캐릭터/성장 반영 [각색 §5.2] ==');
var cipher = CH.makeCharacter('CIPHER');
var eff = CH.effectiveStats(cipher);
eq('36. 유효 maxHp = 기본6 ×2 = 12 [계승 §10]', eff.maxHp, 12);
eq('37. MOV = SPD4 파생 = 4', eff.mov, 4);
var sp = CH.spendKarma(Object.assign({}, cipher, { karma: 1 }), 'hack');
ok('38. karma 지출 성공 & HACK 성장 +1', sp.ok && CH.effectiveStats(sp.character).hack === 6);
ok('39. karma 0 → 지출 실패', CH.spendKarma(cipher, 'hack').ok === false);

console.log('\n== 보상 정산 [계승 chapter-01 §챕터 효과] ==');
var baseSave = S.newSave();
var rew = CAMP.applyRewards(baseSave, require('./data/missions/ch01-first-blood.js').MISSION);
ok('40. 렙+3 / karma+2 / heatCap→11 / BACKDOOR 해금',
  rew.character.rep === 3 && rew.character.karma === 2 && rew.heatCap === 11 && rew.character.kit.indexOf('BACKDOOR') >= 0);

console.log('\n== 세이브 문자열 export/import [G11] ==');
var sv = S.newSave(); sv.character.rep = 7; sv.character.growth.hack = 1; sv.flags.firstBlood = true;
var str = SAVE.exportString(sv);
var imp = SAVE.importString(str);
ok('41. base64 라운드트립 무손실', imp.ok && imp.save.character.rep === 7 && imp.save.character.growth.hack === 1 && imp.save.flags.firstBlood === true);
ok('42. version 필드 보존/보정', imp.save.version === 1);
ok('43. 손상 문자열 → ok:false 안전', SAVE.importString('!!!not-base64-json!!!').ok === false);

console.log('\n== MFU 통합: 사회 게이트가 전투 제거 [§1·§4.4] ==');
var m = S.rpgInitialState();
m = S.startMission(m, 'ch01-first-blood');
m = S.dialogueChoose(m, 0); // -> approach
var bypass = S.dialogueChoose(m, 1); // [HACK4] 우회
ok('44. 우회 시 전투 미발생(combat=null) & skipGuardFight', bypass.scene === 'dialogue' && bypass.combat === null && bypass.save.flags.skipGuardFight === true);
ok('45. 우회로도 firstBlood 달성(대체 결과)', bypass.save.flags.firstBlood === true);
var lock = S.dialogueChoose(m, 2); // [VANTA tag] 잠김
ok('46. [VANTA 태그] 선택 차단(노드 유지)', lock.dialogue.nodeId === 'approach' && lock.banner && lock.banner.kind === 'blocked');

// ============================================================================
// ============================  STAGE 2  ======================================
// ============================================================================

console.log('\n== 시그널 다이 4상태 전체 [계승 docs/06 §7] ==');
var sigKeys = {}; for (var sr = 1; sr <= 6; sr++) sigKeys[SIG.rollForRound(sr).key] = true;
ok('47. 라운드 1~6 파생이 4상태 전체 노출(UP·DOWN·SURGE·BLACKOUT)',
  sigKeys.UP && sigKeys.DOWN && sigKeys.SURGE && sigKeys.BLACKOUT);
ok('48. 결정론: rollForRound 재호출 동일', SIG.rollForRound(3).key === SIG.rollForRound(3).key && SIG.rollForRound(3).key === 'DOWN');
var mUp = SIG.modifiers('UP', { useHack: true, favor: 'mesh' });
ok('49. 🔵UP + mesh/HACK → dmg+1 & 오브젝티브+1', mUp.dmgBonus === 1 && mUp.objectiveBonus === 1);
eq('50. 🔴DOWN + iron/물리 → dmg+1', SIG.modifiers('DOWN', { useHack: false, favor: 'iron' }).dmgBonus, 1);
eq('51. ⚡SURGE → 상성 배율 2배', SIG.modifiers('SURGE', {}).affinityMult, 2);
var mBk = SIG.modifiers('BLACKOUT', { useHack: true, favor: 'mesh' });
ok('52. ⚫BLACKOUT → HACK 불가 & mesh AP+1', mBk.hackDisabled === true && mBk.apBonus === 1);

console.log('\n== BLADE 근접 로스터 [계승 docs/07 §2 · cards/ghost/blade.md] ==');
var blade = CH.makeCharacter('BLADE');
var beff = CH.effectiveStats(blade);
ok('53. BLADE 스탯 10/5/3/3/1 → 유효HP20·ATK5·MOV3 [계승 §10/§3.1]',
  beff.maxHp === 20 && beff.atk === 5 && beff.mov === 3 && beff.hack === 1);
eq('54. BLADE 킷 = POINT BLANK/SUPPRESSION/DOUBLE TAP/LAST STAND', blade.kit, AB.BLADE_KIT);
ok('55. BLADE signalFavor=iron (🔴DOWN 정렬) [계승 docs/06 §7]', blade.signalFavor === 'iron');
// POINT BLANK 근접 기본공격 = ATK 사용
eq('56. POINT BLANK ATK5 vs DEF1 = 4 [각색 blade.md Card07]', R.computeDamage({ atkValue: 5, def: 1 }).dmg, 4);
// DOUBLE TAP 2연타, 2번째 DEF 무시
var dt = R.multiStrike({ atkValue: 5, def: 3, hits: 2, lastHitPierceAll: true });
ok('57. DOUBLE TAP ATK5 vs DEF3: 2연타 [2,5]=7 (2번째 DEF무시) [각색 blade.md Card06]',
  dt.dmg === 7 && dt.hits[0] === 2 && dt.hits[1] === 5);

console.log('\n== SUPPRESSION 이동 저지 → AI 페이싱 변화 [각색 blade.md Card02] ==');
var supField = { cols: 6, rows: 8, walls: [], cover: [] };
function supEnemy(movDown) {
  return { field: supField, units: [
    { id: 'hero', side: 'player', x: 2, y: 7, hp: 20, maxHp: 20, atk: 5, def: 3, attr: 'IRON', status: {} },
    { id: 'e0', side: 'enemy', x: 2, y: 0, hp: 12, maxHp: 12, atk: 4, def: 3, spd: 3, mov: 4, ap: 2, attr: 'VOLT', range: 3, ai: 'advance', status: movDown ? { movDown: 3 } : {} },
  ] };
}
var planFree = AI.planEnemyTurn(supEnemy(false), 'e0');
var planSupp = AI.planEnemyTurn(supEnemy(true), 'e0');
var advFree = planFree.moveTo.y, advSupp = planSupp.moveTo.y; // 위→아래 전진(y 증가)
ok('58. movDown 없으면 4칸 전진 / SUPPRESSION(−3) 시 1칸만 (페이싱 변화)',
  advFree === 4 && advSupp === 1);

console.log('\n== LAST STAND 무적 [각색 blade.md Card09] ==');
var lsCombat = { field: supField, units: [
    { id: 'hero', side: 'player', x: 2, y: 5, hp: 20, maxHp: 20, atk: 5, def: 3, spd: 3, mov: 3, ap: 2, maxAp: 2, attr: 'IRON', status: { invuln: true, invulnTurns: 2 }, cooldowns: {} },
    { id: 'e0', side: 'enemy', x: 2, y: 3, hp: 12, maxHp: 12, atk: 6, def: 3, spd: 3, mov: 3, ap: 2, maxAp: 2, attr: 'VOLT', range: 4, ai: 'advance', status: {} },
  ],
  objective: { x: 0, y: 0, threshold: 6, done: false }, threat: { value: 0, cap: 8, alarm: false, reinforced: false, reinforcement: null },
  signal: SIG.rollForRound(1), outcome: null, round: 1, log: [], floaters: [] };
var lsAfter = S.runEnemyTurn(lsCombat);
eq('59. 무적(invuln) 중 적 사격 피해 무효 (HP 20 유지)', S.player(lsAfter).hp, 20);

console.log('\n== 위협/노출 게이지 실동 [G10] ==');
// 노출 판정: 개방 타일 + 적 LoS = 노출 / 엄폐 시 비노출.
var exField = { cols: 6, rows: 8, walls: [], cover: [{ x: 2, y: 6, type: 'full' }] };
var exCombatOpen = { field: exField, units: [
  { id: 'hero', side: 'player', x: 4, y: 7, hp: 20, maxHp: 20, def: 3, attr: 'IRON', status: {} },
  { id: 'e0', side: 'enemy', x: 4, y: 3, hp: 5, maxHp: 5, atk: 3, def: 1, spd: 4, mov: 4, ap: 2, attr: 'IRON', range: 5, ai: 'coverShooter', status: {} },
] };
ok('60. 개방 타일 + 적 LoS → 노출 true', S.exposure(exCombatOpen) === true);
var exCombatCover = JSON.parse(JSON.stringify(exCombatOpen));
exCombatCover.units[0].x = 2; exCombatCover.units[0].y = 7; // (2,7) = (2,6) full 엄폐 뒤
exCombatCover.units[1].x = 2;
ok('61. 완전 엄폐 뒤 → 비노출 false', S.exposure(exCombatCover) === false);
eq('62. threatGauge 임계 도달 시 alarm [계승 raidThreshold]', CAMP.threatGauge(8, 0, 8).alarm, true);

// 증원 페이싱: 노출 상태로 라운드 반복 → 임계 → 증원 스폰(전투 유닛 증가).
var rfCombat = S.buildCombat(MI.MISSION, CH.makeCharacter('BLADE'), 'outro');
var pRf = S.player(rfCombat); pRf.x = 4; pRf.y = 7;   // 엄폐 밖 개방 타일로 이동(노출 유지)
var enemyStart = rfCombat.units.filter(function (u) { return u.side === 'enemy'; }).length;
var guard = 0;
while (!rfCombat.threat.reinforced && !rfCombat.outcome && guard++ < 15) {
  var pp = S.player(rfCombat); pp.x = 4; pp.y = 7; pp.hp = 20; // 노출 유지 & 생존 고정(게이지 격리 검증)
  rfCombat = S.runEnemyTurn(rfCombat);
}
var enemyNow = rfCombat.units.filter(function (u) { return u.side === 'enemy'; }).length;
ok('63. 노출 누적 → 임계 시 VANTA 증원 스폰 (전투 페이싱 변화)',
  rfCombat.threat.reinforced === true && enemyNow === enemyStart + 1 && !!S.findUnit(rfCombat, 'ereinf'));

console.log('\n== 로스터 선택 [Stage 2 다른 빌드] ==');
var rosterState = S.rpgInitialState();
var toBlade = S.selectClass(rosterState, 'BLADE');
ok('64. 로스터에서 BLADE 편성 → classKey=BLADE & 근접 킷', toBlade.save.character.classKey === 'BLADE' && toBlade.save.character.kit.indexOf('POINT_BLANK') >= 0);
ok('65. 미해금 클래스 선택 차단(캐릭터 유지)', S.selectClass(rosterState, 'RIGGER').save.character.classKey === 'CIPHER');

console.log('\n== 오브젝티브 무력 강습 vs 해킹 [각색 docs/25 §3.5] ==');
// BLADE(ATK5/HACK1) 인접 → 강습에 ATK5 사용.
var brCombat = S.buildCombat(MI.MISSION, CH.makeCharacter('BLADE'), 'outro');
var bp = S.player(brCombat); bp.x = brCombat.objective.x + 1; bp.y = brCombat.objective.y; // 인접(3,0)
brCombat.signal = SIG.STATES.DOWN; // BLADE 우호(HACK 미보정), 결정론
var brAfter = S.applyHackObjective(brCombat);
ok('66. BLADE 서버랙 강습: ATK5 차감 (thr6→1) & 로그 "강습"',
  brAfter.objective.threshold === 1 && brAfter.log.join('|').indexOf('강습') >= 0);
// BLACKOUT: CIPHER(mesh/HACK) 해킹 불가.
var bkCombat = S.buildCombat(MI.MISSION, CH.makeCharacter('CIPHER'), 'outro');
var cp = S.player(bkCombat); cp.x = bkCombat.objective.x + 1; cp.y = bkCombat.objective.y;
bkCombat.signal = SIG.STATES.BLACKOUT;
var bkAfter = S.applyHackObjective(bkCombat);
ok('67. ⚫BLACKOUT: CIPHER 서버 해킹 불가(방어도 무변동)', bkAfter.objective.threshold === bkCombat.objective.threshold);

console.log('\n== 상성 매트릭스 6종 + SURGE 2배 [계승 docs/06 §6 · 각색 §3.3] ==');
var mtx = ATTR.matrix();
ok('68. 상성 매트릭스 6쌍 전체 (MESH▶SHADE … BIO▶IRON)',
  mtx.length === 6 && mtx[0].atk === 'MESH' && mtx[0].def === 'SHADE' && mtx[5].atk === 'BIO' && mtx[5].def === 'IRON');
// SURGE: CIPHER(MESH) HACK_SHOT vs ICE(SHADE) → 상성 +1 이 ×2 = +2.
function icAtk(sigState) {
  var c = S.buildCombat(MI.MISSION, CH.makeCharacter('CIPHER'), 'outro');
  var ice = c.units.filter(function (u) { return u.key === 'ICE_NODE'; })[0];
  var p = S.player(c); p.x = ice.x; p.y = ice.y + 1; // ICE 인접(사거리·LoS OK)
  c.signal = sigState;
  return S.applyAttack(c, ice.id, 'HACK_SHOT');
}
var upHit = icAtk(SIG.STATES.UP);      // UP: mesh/HACK dmg+1, 상성 +1  → HACK5 −DEF0 +1(sig) +1(aff)=7
var surgeHit = icAtk(SIG.STATES.SURGE); // SURGE: 상성 ×2 = +2         → HACK5 −DEF0 +0 +2 = 7
var iceUp = upHit.units.filter(function (u) { return u.key === 'ICE_NODE'; })[0];
var iceSg = surgeHit.units.filter(function (u) { return u.key === 'ICE_NODE'; })[0];
ok('69. SURGE 상성 ×2 vs ICE(SHADE): 로그에 [상성+2] 표기',
  surgeHit.log.join('|').indexOf('[상성+2]') >= 0);
ok('70. 상성 실제 피해 반영 (ICE HP 감소)', iceSg.hp < 3 && iceUp.hp < 3);

console.log('\n== 대화 분기 영속 [docs/25 §4.2 · 수용기준 3] ==');
var pm = S.rpgInitialState();
pm = S.startMission(pm, 'ch01-first-blood');
pm = S.dialogueChoose(pm, 0);            // approach
var pbypass = S.dialogueChoose(pm, 1);   // [HACK4] 우회 → outroStealth
var pquiet = S.dialogueChoose(pbypass, 0); // 탈출 → aftermathQuiet
ok('71. 우회 경로 후일담 진입(aftermathQuiet)', pquiet.dialogue.nodeId === 'aftermathQuiet');
// aftermathQuiet 의 flag 게이트 선택지: skipGuardFight 세팅 시에만 available.
var aqNode = MI.MISSION.dialogue.nodes.aftermathQuiet;
var ctxQuiet = S.dialogueCtx(pquiet);
eq('72. [flag skipGuardFight] 선택지 = available (앞선 선택이 뒤 노드를 연다)', DLG.choiceState(aqNode.choices[1], ctxQuiet), 'available');
var ctxNoFlag = { attrs: {}, tags: [], flags: {} };
eq('73. 동일 선택지 = gray (flag 미설정 시 잠김 — 분기 영속 증명)', DLG.choiceState(aqNode.choices[1], ctxNoFlag), 'gray');
var pplant = S.dialogueChoose(pquiet, 1);   // 백도어 심기 → choice
ok('74. plantedBackdoor·extractionStyle 세이브 영속', pplant.save.flags.plantedBackdoor === true && pplant.save.flags.extractionStyle === 'quiet');
var phero = S.dialogueChoose(pplant, 0);    // 영웅 선택 → settle(applyRewards)
// 렙 = 5(영웅 영구) + 3(챕터 귀환 정산) = 8. heroChoice·적대 flag 영속.
ok('75. 영웅/유령 선택 flag 영속 (heroChoice=hero, 렙 5+3=8, 적대 flag)',
  phero.save.flags.heroChoice === 'hero' && phero.save.character.rep === 8 && phero.save.flags.allBlocsHostile === true);

console.log('\n== BLADE 보상 해금 = VENDETTA [계승 blade.md 레거시 해금] ==');
var bladeSave = S.newSave(); bladeSave.character = CH.makeCharacter('BLADE');
var bladeRew = CAMP.applyRewards(bladeSave, MI.MISSION);
ok('76. BLADE 귀환 정산 → VENDETTA 해금(BACKDOOR 치환)', bladeRew.character.kit.indexOf('VENDETTA') >= 0 && bladeRew.character.kit.indexOf('BACKDOOR') < 0);

console.log('\n== 결과 ==');
console.log('PASS ' + pass + ' / FAIL ' + fail + (fail ? ('  →  ' + fails.join('; ')) : ''));
process.exit(fail ? 1 : 0);
