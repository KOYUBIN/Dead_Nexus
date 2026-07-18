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
var EN   = require('./data/enemies.js');

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
// [48차] RIGGER·MOLE 이 플레이어블로 승격 → 미해금 대조군을 BROKER(비플레이어블)로 교체.
ok('65. 미해금 클래스(BROKER) 선택 차단(캐릭터 유지)', S.selectClass(rosterState, 'BROKER').save.character.classKey === 'CIPHER');

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

// ============================================================================
// ============================  STAGE 3  ======================================
//   통합: 미션 레지스트리 · 해금 그래프 · 최초/재클리어 보상 · 세이브 마이그레이션 ·
//         멀티미션 store 배선 (오프닝 1회 · combat.missionId · 승리 라우팅).
// ============================================================================

console.log('\n== 미션 레지스트리 무결 [통합 §2] ==');
var REG = CAMP.MISSIONS;
var mains = REG.filter(function (e) { return e.kind === 'main'; });
var sides = REG.filter(function (e) { return e.kind === 'side'; });
ok('77. 레지스트리 = 16 미션 (메인 8 + 사이드 8)', REG.length === 16 && mains.length === 8 && sides.length === 8);
// 전 미션 데이터 해석 + id 일치 + 필수 섹션.
var resolveOk = true, resolveBad = [];
REG.forEach(function (e) {
  var m = CAMP.missionData(e.id);
  if (!m || m.id !== e.id || !m.dialogue || !m.combat || !m.rewards) { resolveOk = false; resolveBad.push(e.id); }
});
ok('78. 전 미션 missionData 해석 + id 일치 + dialogue/combat/rewards 존재' + (resolveBad.length ? ' [' + resolveBad.join(',') + ']' : ''), resolveOk);
// 전 미션 적 key + 증원 key ∈ ENEMIES 화이트리스트.
var rosterOk = true, rosterBad = [];
REG.forEach(function (e) {
  var m = CAMP.missionData(e.id); if (!m || !m.combat) return;
  (m.combat.enemies || []).forEach(function (en) { if (!EN.ENEMIES[en.key]) { rosterOk = false; rosterBad.push(e.id + ':' + en.key); } });
  if (m.combat.reinforcement && !EN.ENEMIES[m.combat.reinforcement.key]) { rosterOk = false; rosterBad.push(e.id + ':RF:' + m.combat.reinforcement.key); }
});
ok('79. 전 미션 적/증원 key 가 enemies.js 로스터에 존재' + (rosterBad.length ? ' [' + rosterBad.join(',') + ']' : ''), rosterOk);

console.log('\n== 해금 그래프: 순환 없음 + 도달 가능 [통합 §4] ==');
var byId = {}; REG.forEach(function (e) { byId[e.id] = e; });
function prereqs(e) { return (e.unlock && e.unlock.missionsDone) ? e.unlock.missionsDone : []; }
// DFS 순환 탐지.
var color = {}, cyc = false, prereqMissing = [];
function dfs(id) {
  color[id] = 1;
  var e = byId[id];
  if (e) prereqs(e).forEach(function (p) {
    if (!byId[p]) { prereqMissing.push(id + '→' + p); return; }
    if (color[p] === 1) cyc = true;
    else if (color[p] !== 2) dfs(p);
  });
  color[id] = 2;
}
REG.forEach(function (e) { if (!color[e.id]) dfs(e.id); });
ok('80. 해금 선행(missionsDone) 그래프 순환 없음 + 선행 실존', !cyc && prereqMissing.length === 0);
// 도달성: 빈 세이브에서 확산(메인 클리어 시 heroChoice 획득 가정 → side-06 flag 조건 충족).
var rsave = { missionsDone: [], flags: {} };
var changed = true, guard = 0;
while (changed && guard++ < 50) {
  changed = false;
  REG.forEach(function (e) {
    if (rsave.missionsDone.indexOf(e.id) >= 0) return;
    if (CAMP.isUnlocked(e, rsave)) { rsave.missionsDone.push(e.id); rsave.flags.heroChoice = 'hero'; changed = true; }
  });
}
ok('81. 빈 세이브에서 전 16 미션 도달 가능 (해금 확산)', rsave.missionsDone.length === 16);

console.log('\n== 해금 조건 판정 [통합 §3] ==');
var emptySave = { missionsDone: [], flags: {} };
ok('82. ch01 상시 개방 (unlock null)', CAMP.isUnlocked(byId['ch01-first-blood'], emptySave) === true);
ok('83. ch02 빈세이브 잠김 / ch01 클리어 후 해금',
  CAMP.isUnlocked(byId['ch02-insider-game'], emptySave) === false &&
  CAMP.isUnlocked(byId['ch02-insider-game'], { missionsDone: ['ch01-first-blood'], flags: {} }) === true);
// side-06 = ch05 클리어 AND heroChoice flag (둘 다 필요).
var s6 = byId['side-06-rival-duel'];
ok('84. side-06 = ch05 클리어 + heroChoice flag 둘 다 필요 (AND)',
  CAMP.isUnlocked(s6, { missionsDone: ['ch05-mesh-ghost'], flags: {} }) === false &&
  CAMP.isUnlocked(s6, { missionsDone: [], flags: { heroChoice: 'ghost' } }) === false &&
  CAMP.isUnlocked(s6, { missionsDone: ['ch05-mesh-ghost'], flags: { heroChoice: 'ghost' } }) === true);

console.log('\n== 최초/재클리어 보상 분기 [통합 §3 핵심 처방] ==');
var ch01M = CAMP.missionData('ch01-first-blood');
var freshSave = S.newSave();
var rFirst = CAMP.applyRewards(freshSave, ch01M);
ok('85. 최초 클리어 = 전액 + 챕터효과 + 해금 (렙+3·karma+2·heatCap11·BACKDOOR)',
  rFirst.firstClear === true && rFirst.character.rep === 3 && rFirst.character.karma === 2 &&
  rFirst.heatCap === 11 && rFirst.character.kit.indexOf('BACKDOOR') >= 0);
// 재클리어: 동일 미션이 missionsDone 에 이미 있음.
var reSave = S.newSave();
reSave.missionsDone = ['ch01-first-blood'];
reSave.character.rep = 3; reSave.character.karma = 2; reSave.character.nuyen = 8; reSave.heatCap = 11;
var rRe = CAMP.applyRewards(reSave, ch01M);
ok('86. 재클리어 = 렙 50%(3→+1)·₵ 50%(8→+4)·karma +0·heatCap 무변동·해금 없음',
  rRe.firstClear === false &&
  rRe.character.rep === 4 && rRe.character.karma === 2 && rRe.character.nuyen === 12 &&
  rRe.heatCap === 11 && rRe.character.kit.indexOf('BACKDOOR') < 0);
ok('87. firstClear 판정 = missionsDone 포함 여부', rFirst.firstClear === true && rRe.firstClear === false);

console.log('\n== 세이브 마이그레이션 (레거시 무손상) [통합 §3] ==');
// 레거시(챕터1 전용 시절): firstBlood flag 만, missionsDone/openingsSeen 없음.
var legacy = { version: 1, character: S.newSave().character, flags: { firstBlood: true, heroChoice: 'ghost' }, heat: 0, heatCap: 11 };
var legImp = SAVE.importString(SAVE.exportString(legacy));
ok('88. 레거시 firstBlood → ch01 클리어 추론 (missionsDone 에 ch01 주입)',
  legImp.ok && legImp.save.missionsDone.indexOf('ch01-first-blood') >= 0);
ok('89. 클리어 미션의 오프닝 = 열람 완료 병합 (재열람 방지)',
  legImp.save.openingsSeen.indexOf('ch01-first-blood') >= 0);
var legImp2 = SAVE.importString(SAVE.exportString(legImp.save));
ok('90. 마이그레이션 멱등 (재적용 no-op)',
  JSON.stringify(legImp2.save.missionsDone) === JSON.stringify(legImp.save.missionsDone) &&
  JSON.stringify(legImp2.save.openingsSeen) === JSON.stringify(legImp.save.openingsSeen));
ok('91. 마이그레이션 후 ch02 해금 (추론된 ch01 클리어 반영)',
  CAMP.isUnlocked(byId['ch02-insider-game'], legImp.save) === true);

console.log('\n== 멀티미션 store 배선 [통합 §2·§3] ==');
// 미해금 미션 진입 차단.
var st0 = S.rpgInitialState();
var blocked = S.startMission(st0, 'ch03-martial-night');
ok('92. 미해금 미션 startMission 차단 (banner blocked · 허브 유지)',
  blocked.scene === 'hub' && blocked.banner && blocked.banner.kind === 'blocked');
// 해금된 비-ch01 미션 진입 → 활성 미션 = 해당 미션.
var st1 = S.rpgInitialState();
st1.save.missionsDone = ['ch01-first-blood', 'ch02-insider-game', 'ch03-martial-night', 'ch04-price-of-splice'];
var st5 = S.startMission(st1, 'ch05-mesh-ghost');
ok('93. 해금 미션(ch05) 진입 → dialogue scene · missionId=ch05 · combat null',
  st5.scene === 'dialogue' && st5.dialogue.missionId === 'ch05-mesh-ghost' && st5.combat === null);
// 오프닝 1회: 최초 openingSeen=false, 재진입 openingSeen=true.
var stO1 = S.startMission(S.rpgInitialState(), 'ch01-first-blood');
var stO2 = S.startMission(stO1, 'ch01-first-blood');
ok('94. 오프닝 최초=전문(openingSeen false) / 재시작=요약(openingSeen true)',
  stO1.dialogue.openingSeen === false && stO2.dialogue.openingSeen === true &&
  stO1.save.openingsSeen.indexOf('ch01-first-blood') >= 0);
// buildCombat missionId 배선.
var c08 = S.buildCombat(CAMP.missionData('ch08-zero-day'), CH.makeCharacter('CIPHER'), 'x');
ok('95. buildCombat 이 combat.missionId 배선 + objective threshold 정상',
  c08.missionId === 'ch08-zero-day' && typeof c08.objective.threshold === 'number' && c08.objective.threshold > 0);
// 멀티미션 전투 승리 라우팅: ch02 강행 돌파 → outroLoud 노드 + insiderBreach flag(하드코딩 firstBlood 제거 검증).
var m2 = S.rpgInitialState(); m2.save.missionsDone = ['ch01-first-blood'];
m2 = S.startMission(m2, 'ch02-insider-game');
m2 = S.dialogueChoose(m2, 0);           // intro → approach
m2 = S.dialogueChoose(m2, 0);           // 강행 돌파 → startCombat onWin outroLoud
var combatOk = m2.scene === 'combat' && m2.combat.missionId === 'ch02-insider-game';
m2.combat.outcome = 'win';               // 승리 강제(라우팅 검증)
var m2win = S.resolveCombat(m2);
ok('96. ch02 전투 승리 → outroLoud 라우팅 + insiderBreach flag (미션별 flag, 하드코딩 firstBlood 제거)',
  combatOk && m2win.scene === 'dialogue' && m2win.dialogue.nodeId === 'outroLoud' && m2win.save.flags.insiderBreach === true);

// 서사 선택 렙(+5 영웅)은 최초 완주만 — 재클리어 farming 방지.
function playCh01Bypass(seed) {
  var st = seed;
  st = S.dialogueChoose(S.startMission(st, 'ch01-first-blood'), 0); // intro→approach
  st = S.dialogueChoose(st, 1); // [HACK4] 우회 → outroStealth
  st = S.dialogueChoose(st, 0); // 탈출 → aftermathQuiet
  st = S.dialogueChoose(st, 0); // 신호 안남김 → choice
  st = S.dialogueChoose(st, 0); // 영웅(+5, effect.rep) → settle(applyRewards)
  st = S.dialogueChoose(st, 0); // 귀환 → hub
  return st;
}
var run1 = playCh01Bypass(S.rpgInitialState());
var repA = run1.save.character.rep;                 // 5(영웅) + 3(정산) = 8
var run2 = playCh01Bypass(run1);
var gain2 = run2.save.character.rep - repA;          // 재클리어: 영웅 +5 미적용, 정산 렙 50%(3→1)
ok('97. 재클리어 렙 = 축소만(+1) · 영웅 +5 재적용 안 됨(farming 방지)', repA === 8 && gain2 === 1);

// ============================================================================
// ============================  48차 — RIGGER + MOLE 로스터 확장  ==============
//   4클래스 플레이어블 무결 · RIGGER 설치/제어 킷 · MOLE 위장/침투 킷 ·
//   위장 태그 게이트 통과 · 무소음(발각 리스크 관리) · 클래스별 해금 시그니처 일반화.
// ============================================================================

console.log('\n== 4클래스 플레이어블 로스터 [48차 · docs/07 §2] ==');
ok('98. PLAYABLE = 4클래스 (CIPHER·BLADE·RIGGER·MOLE)',
  CL.PLAYABLE.length === 4 && CL.PLAYABLE.indexOf('RIGGER') >= 0 && CL.PLAYABLE.indexOf('MOLE') >= 0 &&
  CL.PLAYABLE.indexOf('BROKER') < 0 && CL.PLAYABLE.indexOf('DRIFTER') < 0);
ok('99. RIGGER/MOLE 이 passive 보유(로스터 UI·시트 표기)',
  !!CL.CLASSES.RIGGER.passive && !!CL.CLASSES.MOLE.passive);

console.log('\n== RIGGER 설치·제어 로스터 [계승 docs/07 §2 7/3/4/2/3 · cards/ghost/rigger.md] ==');
var rigger = CH.makeCharacter('RIGGER');
var reff = CH.effectiveStats(rigger);
ok('100. RIGGER 스탯 7/3/4/2/3 → 유효HP14·ATK3·DEF4·MOV2·HACK3 [계승 §10/§3.1]',
  reff.maxHp === 14 && reff.atk === 3 && reff.def === 4 && reff.mov === 2 && reff.hack === 3);
eq('101. RIGGER 킷 = SENTRY GUN/TRAP WIRE/EMP PULSE/OVERLOAD', rigger.kit, AB.RIGGER_KIT);
ok('102. RIGGER 최고 DEF(4) → [DEF 3] 대화 게이트 통과 (CIPHER DEF1 불가) [수비 정체성]',
  DLG.evalGate({ attr: 'def', min: 3 }, S.dialogueCtx({ save: { character: rigger, flags: {} } })).ok === true &&
  DLG.evalGate({ attr: 'def', min: 3 }, S.dialogueCtx({ save: { character: CH.makeCharacter('CIPHER'), flags: {} } })).ok === false);
// SENTRY GUN 기본공격 = ATK 사용(VOLT 원거리). ATK3 vs DEF1 = 2.
eq('103. SENTRY GUN ATK3 vs DEF1 = 2 [각색 rigger.md Card08]', R.computeDamage({ atkValue: 3, def: 1 }).dmg, 2);
// TRAP WIRE 디버프: DEF−1 & 이동 −3칸(강한 고정) — applyAttack DEBUFF 경로.
var trapCombat = S.buildCombat(MI.MISSION, rigger, 'outro');
var trapP = S.player(trapCombat); var trapTgt = trapCombat.units.filter(function (u) { return u.side === 'enemy' && u.ai !== 'static'; })[0];
trapP.x = trapTgt.x; trapP.y = trapTgt.y + 1; // 인접(사거리 2 내)
var afterTrap = S.applyAttack(trapCombat, trapTgt.id, 'TRAP_WIRE');
var trappedTgt = S.findUnit(afterTrap, trapTgt.id);
ok('104. TRAP WIRE → 대상 DEF−1 & 이동−3(지역 장악) [각색 rigger.md Card02]',
  trappedTgt.status.defDown === 1 && trappedTgt.status.movDown === 3 && trappedTgt.status.debuffTurns === 2);
// EMP PULSE vs 기계(VANTA_DRONE): 관통2 + STUN. dmg = (ATK3+1) − max(0,DEF1−2)=4, 그리고 stunTurns.
var empCombat = S.buildCombat(MI.MISSION, rigger, 'outro');
var empP = S.player(empCombat); var drone = empCombat.units.filter(function (u) { return u.key === 'VANTA_DRONE'; })[0];
empP.x = drone.x; empP.y = drone.y + 1; // 인접(사거리 4)
empCombat.signal = SIG.STATES.DOWN; // 결정론(HACK 미보정 · RIGGER는 물리축)
var afterEmp = S.applyAttack(empCombat, drone.id, 'EMP_PULSE');
var stunnedDrone = S.findUnit(afterEmp, drone.id);
ok('105. EMP PULSE vs 드론(기계): 관통 피해 + 1턴 STUN [각색 rigger.md Card07]',
  stunnedDrone.hp < drone.hp && stunnedDrone.status.stunTurns === 1);
// OVERLOAD 궁극: 2턴 무적 + nextCrit2 (자기 대상 applyStatus).
var ovCombat = S.buildCombat(MI.MISSION, rigger, 'outro');
var afterOv = S.applyAttack(ovCombat, null, 'OVERLOAD');
var ovP = S.player(afterOv);
ok('106. OVERLOAD 궁극 → 2턴 무적 + 해제 후 크리 ×2 & 1회 소진 [각색 rigger.md Card09 LOSS]',
  ovP.status.invuln === true && ovP.status.invulnTurns === 2 && ovP.status.nextCrit === 2 && ovP.ultUsed === true);

console.log('\n== MOLE 위장·침투 로스터 [계승 docs/07 §2 7/2/3/3/3 · cards/ghost/mole.md] ==');
var mole = CH.makeCharacter('MOLE');
var meff = CH.effectiveStats(mole);
ok('107. MOLE 스탯 7/2/3/3/3 → 유효HP14·ATK2·DEF3·MOV3·HACK3 [계승 §10/§3.1]',
  meff.maxHp === 14 && meff.atk === 2 && meff.def === 3 && meff.mov === 3 && meff.hack === 3);
eq('108. MOLE 킷 = AUTH ABUSE/CLEARANCE/BOARD MANIP/IDENTITY COLLAPSE', mole.kit, AB.MOLE_KIT);
// 위장 신분 태그 → 인물태그 게이트 통과 (COVER IDENTITY 계승).
ok('109. MOLE 위장 태그(VANTA/IRONWALL/AXIOM) 보유 → [VANTA 태그] 게이트 통과 [침투 정체성]',
  DLG.evalGate({ tag: 'VANTA' }, S.dialogueCtx({ save: { character: mole, flags: {} } })).ok === true &&
  DLG.evalGate({ tag: 'IRONWALL' }, S.dialogueCtx({ save: { character: mole, flags: {} } })).ok === true);
ok('110. 위장 없는 클래스(BLADE)는 [VANTA 태그] 게이트 잠김 (대조)',
  DLG.evalGate({ tag: 'VANTA' }, S.dialogueCtx({ save: { character: CH.makeCharacter('BLADE'), flags: {} } })).ok === false);
// AUTH ABUSE 기본공격 = HACK 사용(무소음). HACK3 vs DEF1 = 2.
eq('111. AUTH ABUSE HACK3 vs DEF1 = 2 [각색 mole.md Card03]', R.computeDamage({ atkValue: 3, def: 1 }).dmg, 2);
// BOARD MANIP 강공: (HACK3+2) − (DEF3−pierce2)=5−1=4.
eq('112. BOARD MANIP HACK3+2 관통2 vs DEF3 = 4 [각색 mole.md Card05]',
  R.computeDamage({ atkValue: 3, def: 3, bonus: 2, pierce: 2 }).dmg, 4);
// CLEARANCE 디버프: DEF−2 & 엄폐 무효.
var clrCombat = S.buildCombat(MI.MISSION, mole, 'outro');
var clrP = S.player(clrCombat); var clrTgt = clrCombat.units.filter(function (u) { return u.side === 'enemy' && u.ai !== 'static'; })[0];
clrP.x = clrTgt.x; clrP.y = clrTgt.y + 1;
var afterClr = S.applyAttack(clrCombat, clrTgt.id, 'CLEARANCE');
var clearedTgt = S.findUnit(afterClr, clrTgt.id);
ok('113. CLEARANCE → 대상 DEF−2 & 엄폐 무효(베일 무시) [각색 mole.md Card04]',
  clearedTgt.status.defDown === 2 && clearedTgt.status.coverNull === true);
// IDENTITY COLLAPSE 궁극: 2턴 은신 + nextCrit3.
var icCombat = S.buildCombat(MI.MISSION, mole, 'outro');
var afterIc = S.applyAttack(icCombat, null, 'IDENTITY_COLLAPSE');
var icP = S.player(afterIc);
ok('114. IDENTITY COLLAPSE 궁극 → 2턴 은신 + 급습 크리 ×3 & 1회 소진 [각색 mole.md Card09 LOSS]',
  icP.status.stealth === true && icP.status.stealthTurns === 2 && icP.status.nextCrit === 3 && icP.ultUsed === true);
// 무소음(loud:false) → 위협/노출 게이지 미가산(발각 리스크 관리). AUTH ABUSE 로 검증.
var qCombat = S.buildCombat(MI.MISSION, mole, 'outro');
var qP = S.player(qCombat); var qTgt = qCombat.units.filter(function (u) { return u.side === 'enemy' && u.ai !== 'static'; })[0];
qP.x = qTgt.x; qP.y = qTgt.y + 1;
var afterQ = S.applyAttack(qCombat, qTgt.id, 'AUTH_ABUSE');
ok('115. AUTH ABUSE 무소음(loud:false) → threat.noise 미가산 (발각 리스크 관리)',
  (afterQ.threat.noise || 0) === 0 && S.findUnit(afterQ, qTgt.id).hp < qTgt.hp);

console.log('\n== 클래스 편성 & 해금 시그니처 일반화 [48차] ==');
var rs = S.rpgInitialState();
var toRig = S.selectClass(rs, 'RIGGER');
ok('116. 로스터에서 RIGGER 편성 → classKey=RIGGER & 설치 킷', toRig.save.character.classKey === 'RIGGER' && toRig.save.character.kit.indexOf('SENTRY_GUN') >= 0);
var toMole = S.selectClass(rs, 'MOLE');
ok('117. 로스터에서 MOLE 편성 → classKey=MOLE & 침투 킷 & 위장 태그', toMole.save.character.classKey === 'MOLE' && toMole.save.character.kit.indexOf('AUTH_ABUSE') >= 0 && toMole.save.character.tags.indexOf('VANTA') >= 0);
// 보상 해금: RIGGER→WORKSHOP, MOLE→TRIPLE_AGENT (BACKDOOR 치환, UNLOCK_BY_CLASS 일반화).
var rigSave = S.newSave(); rigSave.character = CH.makeCharacter('RIGGER');
var rigRew = CAMP.applyRewards(rigSave, MI.MISSION);
ok('118. RIGGER 귀환 정산 → WORKSHOP 해금 (BACKDOOR 치환)',
  rigRew.character.kit.indexOf('WORKSHOP') >= 0 && rigRew.character.kit.indexOf('BACKDOOR') < 0);
var moleSave = S.newSave(); moleSave.character = CH.makeCharacter('MOLE');
var moleRew = CAMP.applyRewards(moleSave, MI.MISSION);
ok('119. MOLE 귀환 정산 → TRIPLE AGENT 해금 (BACKDOOR 치환)',
  moleRew.character.kit.indexOf('TRIPLE_AGENT') >= 0 && moleRew.character.kit.indexOf('BACKDOOR') < 0);
// objBonusAbility 일반화: WORKSHOP 장착 시 오브젝티브 차감 +1 (buildCombat 탐지).
var wsCombat = S.buildCombat(MI.MISSION, rigRew.character, 'outro');
ok('120. buildCombat objBonusAbility 일반화 → RIGGER WORKSHOP 탐지', wsCombat.units[0].objBonusAbility === 'WORKSHOP');
var wsP = S.player(wsCombat); wsP.x = wsCombat.objective.x + 1; wsP.y = wsCombat.objective.y; // 인접
wsCombat.signal = SIG.STATES.DOWN; // 결정론
var wsAfter = S.applyHackObjective(wsCombat);
// RIGGER HACK3 == ATK3 → 해킹(useHack), WORKSHOP +1 → 차감 4 (thr6→2).
ok('121. RIGGER 서버랙 해킹 + WORKSHOP 보너스: 차감 4 (thr6→2)',
  wsAfter.objective.threshold === 2);

console.log('\n== ch01 4클래스 완주 경로 (RIGGER=전투 / MOLE=위장 우회) [48차 · 미션 호환] ==');
// RIGGER: 위장/해킹 우회 불가 → 무력 돌파(전투) 경로.
var rgCh01 = S.rpgInitialState(); rgCh01.save.character = CH.makeCharacter('RIGGER');
rgCh01 = S.startMission(rgCh01, 'ch01-first-blood');
rgCh01 = S.dialogueChoose(rgCh01, 0);      // intro → approach
var rgCombat = S.dialogueChoose(rgCh01, 0); // 무력 돌파 → combat
ok('122. RIGGER ch01 = 전투 경로 진입 (combat scene · SENTRY GUN 기본선택)',
  rgCombat.scene === 'combat' && rgCombat.combat.selectedAbility === 'SENTRY_GUN');
// MOLE: 위장 태그 → [VANTA 태그] 사원증 위조 우회(전투 스킵) → outroStealth.
var mlCh01 = S.rpgInitialState(); mlCh01.save.character = CH.makeCharacter('MOLE');
mlCh01 = S.startMission(mlCh01, 'ch01-first-blood');
mlCh01 = S.dialogueChoose(mlCh01, 0);      // intro → approach
var mlBypass = S.dialogueChoose(mlCh01, 2); // [VANTA 태그] 위장 우회 → outroStealth
ok('123. MOLE ch01 = 위장 우회 경로 (전투 미발생 · forgedPass · firstBlood 대체 달성)',
  mlBypass.scene === 'dialogue' && mlBypass.combat === null &&
  mlBypass.save.flags.forgedPass === true && mlBypass.save.flags.firstBlood === true);

console.log('\n== 결과 ==');
console.log('PASS ' + pass + ' / FAIL ' + fail + (fail ? ('  →  ' + fails.join('; ')) : ''));
process.exit(fail ? 1 : 0);
