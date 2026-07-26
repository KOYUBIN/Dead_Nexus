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
var GEAR = require('./data/gear.js');
var END  = require('./systems/ending.js');

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
// [48차] RIGGER·MOLE 승격 → 미해금 대조군 BROKER. [65차] BROKER·DRIFTER 도 승격(6클래스 전량)
//   → BROKER 는 "미해금→해금" 선택 경로 반전 검증, 차단 대조군은 로스터 밖 키(AXIOM 비플레이어블).
ok('65. 해금 클래스(BROKER) 선택 허용(미해금→해금 전환) · 로스터 밖 키(AXIOM) 차단(캐릭터 유지)',
  S.selectClass(rosterState, 'BROKER').save.character.classKey === 'BROKER' &&
  S.selectClass(rosterState, 'AXIOM').save.character.classKey === 'CIPHER');

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
var act2 = REG.filter(function (e) { return e.kind === 'act2'; });
// [62차/v6.44] Act2 등록 → 30. [65차] BROKER/DRIFTER 클래스 사이드 2 추가 → 레지스트리 32
//   (메인 8 + 사이드 8 + act2 16[a2-00 + 4갈래×2 + 클래스 6 + 캡스톤 1]). 메인/사이드 불변.
ok('77. 레지스트리 = 32 미션 (메인 8 + 사이드 8 + act2 16)', REG.length === 32 && mains.length === 8 && sides.length === 8 && act2.length === 16);
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
// 도달성: 빈 세이브에서 확산. Act2 갈래(endingSeen)·클래스 사이드(classKey)는 회차/클래스 전환으로
//   개방되므로, 4엔딩 전부 열람 + 6클래스 순회의 합집합으로 전 32 미션 도달을 검증(NG+/클래스 전환 완성형).
//   [v6.44] 캡스톤(a2-99)은 4갈래 종결 전부 완료 시 개방 → 4엔딩 합집합에서 도달. [65차] 6클래스 순회.
var ALL_ENDINGS = { 'corporate-eternal': 1, 'street-rising': 1, 'nexus-reborn': 1, 'dead-nexus': 1 };
var reachedUnion = {};
['CIPHER', 'BLADE', 'RIGGER', 'MOLE', 'BROKER', 'DRIFTER'].forEach(function (clsK) {
  var rsave = { missionsDone: [], flags: {}, endings: { seen: ALL_ENDINGS }, character: { classKey: clsK } };
  var changed = true, guard = 0;
  while (changed && guard++ < 60) {
    changed = false;
    REG.forEach(function (e) {
      if (rsave.missionsDone.indexOf(e.id) >= 0) return;
      if (CAMP.isUnlocked(e, rsave)) { rsave.missionsDone.push(e.id); rsave.flags.heroChoice = 'hero'; changed = true; }
    });
  }
  rsave.missionsDone.forEach(function (id) { reachedUnion[id] = 1; });
});
ok('81. 전 32 미션 도달 가능 (4엔딩 열람 + 6클래스 순회 합집합 · 해금 확산)', Object.keys(reachedUnion).length === 32);
// 단일 세이브(1엔딩·1클래스) 도달: 8 메인 + 8 사이드 + a2-00 + 해당 갈래 2 메인 + 해당 클래스 사이드 1 = 20.
var oneSave = { missionsDone: [], flags: {}, endings: { seen: { 'corporate-eternal': 1 } }, character: { classKey: 'CIPHER' } };
var chg = true, g2 = 0;
while (chg && g2++ < 60) { chg = false; REG.forEach(function (e) {
  if (oneSave.missionsDone.indexOf(e.id) >= 0) return;
  if (CAMP.isUnlocked(e, oneSave)) { oneSave.missionsDone.push(e.id); oneSave.flags.heroChoice = 'hero'; chg = true; } }); }
ok('81b. 단일 세이브(🏙️ corporate-eternal · CIPHER) 도달 = 20 (8+8+a2-00 + A갈래2 + CIPHER사이드1)',
  oneSave.missionsDone.length === 20 &&
  oneSave.missionsDone.indexOf('a2-a1-crown-breach') >= 0 && oneSave.missionsDone.indexOf('a2-a2-crown-throne') >= 0 &&
  oneSave.missionsDone.indexOf('a2-side-cipher-static') >= 0 &&
  oneSave.missionsDone.indexOf('a2-b1-barricade') < 0 && oneSave.missionsDone.indexOf('a2-side-mole-whoami') < 0);

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

console.log('\n== 6클래스 플레이어블 로스터 [48차→65차 · docs/07 §2] ==');
// [65차] BROKER·DRIFTER 승격 → 6클래스 전량 플레이어블.
ok('98. PLAYABLE = 6클래스 (CIPHER·BLADE·RIGGER·MOLE·BROKER·DRIFTER)',
  CL.PLAYABLE.length === 6 && CL.PLAYABLE.indexOf('RIGGER') >= 0 && CL.PLAYABLE.indexOf('MOLE') >= 0 &&
  CL.PLAYABLE.indexOf('BROKER') >= 0 && CL.PLAYABLE.indexOf('DRIFTER') >= 0);
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

console.log('\n== 밸런스 하네스 (_balance.js) 스모크 · 결정론 재현 · 밴드 [51차] ==');
var BAL = require('./_balance.js');
// 결정론 재현 — 같은 입력 2회 = 완전 동일 결과(JSON). 세이브/리플레이 재현성의 하네스 대응물.
var d1 = BAL.runEncounter('CIPHER', 'ch08-zero-day', 'objective');
var d2 = BAL.runEncounter('CIPHER', 'ch08-zero-day', 'objective');
ok('124. 하네스 결정론 재현 (CIPHER/objective ch08 2회 = 동일)', JSON.stringify(d1) === JSON.stringify(d2));
var e1 = BAL.runEncounter('BLADE', 'ch03-martial-night', 'combat');
var e2 = BAL.runEncounter('BLADE', 'ch03-martial-night', 'combat');
ok('125. 하네스 결정론 재현 (BLADE/combat ch03 2회 = 동일)', JSON.stringify(e1) === JSON.stringify(e2));

// 전수 매트릭스: 64조합 전원 클리어 가능 + 이상치(clearFail·attrition) 0 (밴드 상한 준수).
var mrx = BAL.runMatrix();
var nClear = 0, nFail = 0, nAttr = 0, nTotal = 0, worstRush = 0;
for (var _mi = 0; _mi < mrx.length; _mi++) {
  for (var _ci = 0; _ci < BAL.CLASSES.length; _ci++) {
    var _vd = BAL.verdict(mrx[_mi].cells[BAL.CLASSES[_ci]]);
    nTotal++;
    if (_vd.clearable) nClear++;
    if (_vd.flags.indexOf('clearFail') >= 0) nFail++;
    if (_vd.flags.indexOf('attrition') >= 0) nAttr++;
    if (_vd.clearable && _vd.rep.rounds > worstRush) worstRush = _vd.rep.rounds;
  }
}
// [62차/v6.44] 40 인카운터×4=160. [65차] 6클래스×32미션 → 42 인카운터(32미션 + enc② 키 10
//   [2연전 8×1 + 캡스톤 3연전×2])×6 = 252조합. 전원 클리어 유지.
//   멀티 인카운터 미션은 enc①(mission.combat) + 각 encounters 키를 개별 행으로 측정(하네스 encounters 순회).
var nEncKeys = 0;
REG.forEach(function (e) { var m = CAMP.missionData(e.id); if (m && m.encounters) nEncKeys += Object.keys(m.encounters).length; });
ok('126. 전 ' + nTotal + '조합 클리어 가능 (clearFail 0 · 42 인카운터×6=252)',
  nClear === nTotal && mrx.length === REG.length + nEncKeys && nTotal === (REG.length + nEncKeys) * 6 && nFail === 0 && nEncKeys === 10);
ok('127. 소모전(attrition) 이상치 0', nAttr === 0);
ok('128. 최속 승리 라운드 밴드 상한 ≤ 9 (전 조합)', worstRush <= 9);

// 보정 수치 핀 고정(51차) — 회귀 시 즉시 실패. missionData 경유로 실제 소비 값 확인.
function thr(id) { var m = CAMP.missionData(id); return m.combat.objective.threshold + (m.combat.objective.veil || 0); }
function enemyCount(id) { return CAMP.missionData(id).combat.enemies.length; }
ok('129. 핀: ch08 유효임계 10 · 적 4기 (NEXUS 러시 상한)', thr('ch08-zero-day') === 10 && enemyCount('ch08-zero-day') === 4);
ok('130. 핀: ch07 유효임계 11 · 적 3기 (관료 2→1 감축)', thr('ch07-heart-of-city') === 11 && enemyCount('ch07-heart-of-city') === 3);
ok('131. 핀: 초반 램프 ch02(8) ≤ ch04(10) ≤ ch06(11)', thr('ch02-insider-game') === 8 && thr('ch04-price-of-splice') === 10 && thr('ch06-bloc-acquisition') === 11);
ok('132. 핀: 트리비얼 방지 사이드 유효임계 11 (side-02·05·08)',
  thr('side-02-corp-breach') === 11 && thr('side-05-informant-hit') === 11 && thr('side-08-harbor-run') === 11);
ok('133. 핀: ch03 threatCap 8 (조기 증원 완화)', CAMP.missionData('ch03-martial-night').combat.threatCap === 8);

console.log('\n== Stage 3: 투영 seam (projection.js) — 룰 무관 표시층 [G1] ==');
var PROJ = require('./core/projection.js');
// 탑다운(폴백)은 슬라이스와 100% 동일 — 회귀 방어.
var _sq = PROJ.project(2, 3, 56);
ok('134. square: tx/ty = 논리좌표 (기존 슬라이스 불변)', _sq.tx === 2 && _sq.ty === 3 && _sq.mode === 'square');
eq('135. square: left/top = x·tile / y·tile', [_sq.left, _sq.top], [112, 168]);
// 아이소 2:1 다이아몬드 매핑 검증.
var _i00 = PROJ.projectIso(0, 0, 56, { cols: 6, rows: 8 });
var _i10 = PROJ.projectIso(1, 0, 56, { rows: 8 });
var _i01 = PROJ.projectIso(0, 1, 56, { rows: 8 });
ok('136. iso: (x+1) → tx +0.5 · ty +0.25 (동→우하 등축)', (_i10.tx - _i00.tx) === 0.5 && (_i10.ty - _i00.ty) === 0.25);
ok('137. iso: (y+1) → tx −0.5 · ty +0.25 (남→좌하 등축)', (_i01.tx - _i00.tx) === -0.5 && (_i01.ty - _i00.ty) === 0.25);
ok('138. iso: 좌단(x=0,y=rows−1) tx=0 (음수 오프셋 방지)', PROJ.projectIso(0, 7, 56, { rows: 8 }).tx === 0);
// z-순서 = 논리 심도(x+y) — painter(뒤→앞).
ok('139. iso: z = 5 + (x+y) painter 심도 (원거리<근거리)', PROJ.projectIso(1, 1, 56, { rows: 8 }).z === 7 && _i00.z === 5);
// 보드 크기: 아이소는 세로 압축(모바일 유리), 가로는 (cols+rows)/2.
eq('140. iso boardSize 6×8 = {w:7,h:4}', PROJ.boardSize(6, 8, 'iso'), { w: 7, h: 4 });
eq('141. square boardSize 6×8 = {w:6,h:8} (불변)', PROJ.boardSize(6, 8, 'square'), { w: 6, h: 8 });
// 순수성: project 는 같은 입력 → 같은 출력 (DOM/부수효과 0).
var _p1 = JSON.stringify(PROJ.project(3, 4, 56, { rows: 8 }, 'iso'));
var _p2 = JSON.stringify(PROJ.project(3, 4, 56, { rows: 8 }, 'iso'));
ok('142. project 순수성: 동일 입력 → 동일 출력 (결정론)', _p1 === _p2);
ok('143. MODES = [square, iso] · 기본 square (seam 계약)', JSON.stringify(PROJ.MODES) === '["square","iso"]' && PROJ.MODE === 'square');

// ============================================================================
// ============================  B1 — RPG 경제 루프 실동화 (장비 상점 + 정보상)  ===
//   장비 스탯 반영(effectiveStats 확장) · 구매 차감 · 슬롯 교체 · 클래스 제한 ·
//   쿨다운 감소 전파 · 세이브 라운드트립/마이그레이션 · 정보상 인텔 표시 플래그.
//   ★ 장비는 옵트인 파워: 무장비 기준 밸런스 불변(_balance.js byte 동일 별도 검증).
// ============================================================================

console.log('\n== 장비 데이터 무결 [B1 gear.js] ==');
ok('144. gear.js = 10종 (무기 개조 4 + 사이버웨어 6)',
  Object.keys(GEAR.ITEMS).length === 10 && GEAR.BY_SLOT.weapon.length === 4 && GEAR.BY_SLOT.cyberware.length === 6);
ok('145. 사이버웨어 6종 = simulator v1.1.2 계승 (REFLEX/IRON_SKIN/NEURAL_JACK/MYOMER/OCULAR/MOOD)',
  ['REFLEX_BOOSTER','IRON_SKIN','NEURAL_JACK','MYOMER_LEGS','OCULAR_IMPLANT','MOOD_CHIP'].every(function (k) { return GEAR.ITEMS[k] && GEAR.ITEMS[k].slot === 'cyberware'; }));
// 전 품목: slot 유효 · mods 는 허용 스탯 필드만(신규 메커닉 0) · cost>0 · lineage 존재.
var ALLOWED_MODS = { atk: 1, def: 1, spd: 1, hack: 1, mov: 1, maxHp: 1, cooldown: 1 };
var gearShapeOk = true, gearBad = [];
Object.keys(GEAR.ITEMS).forEach(function (k) {
  var it = GEAR.ITEMS[k];
  if (it.slot !== 'weapon' && it.slot !== 'cyberware') { gearShapeOk = false; gearBad.push(k + ':slot'); }
  if (!it.cost || it.cost <= 0) { gearShapeOk = false; gearBad.push(k + ':cost'); }
  if (!it.lineage) { gearShapeOk = false; gearBad.push(k + ':lineage'); }
  for (var f in it.mods) { if (!ALLOWED_MODS[f]) { gearShapeOk = false; gearBad.push(k + ':mod:' + f); } }
});
ok('146. 전 품목 효과 = 허용 스탯 보정만(atk/def/spd/hack/mov/maxHp/cooldown) · cost>0 · 계보 태그' + (gearBad.length ? ' [' + gearBad.join(',') + ']' : ''), gearShapeOk);

console.log('\n== 장비 스탯 반영 [B1 effectiveStats 확장 · karma 선례] ==');
// 무장비 기준 불변 핀 — CIPHER 2/1/4/5/12/4 · cdReduction 0 (밸런스 불변의 근거).
var g0 = CH.makeCharacter('CIPHER'); var e0g = CH.effectiveStats(g0);
ok('147. 무장비 CIPHER 유효 스탯 불변 (atk2/def1/spd4/hack5/maxHp12/mov4 · cdReduction0)',
  e0g.atk === 2 && e0g.def === 1 && e0g.spd === 4 && e0g.hack === 5 && e0g.maxHp === 12 && e0g.mov === 4 && e0g.cdReduction === 0);
ok('148. 무장비 초기 equipment/gearOwned 스키마 (weapon/cyberware null · owned [])',
  g0.equipment.weapon === null && g0.equipment.cyberware === null && Array.isArray(g0.gearOwned) && g0.gearOwned.length === 0);
// SMART_LINK(atk+1) 무기 + NEURAL_JACK(hack+2, maxHp-2) 사이버 → atk3/hack7/maxHp10.
var g1 = CH.makeCharacter('CIPHER'); g1.equipment = { weapon: 'SMART_LINK', cyberware: 'NEURAL_JACK' };
var e1g = CH.effectiveStats(g1);
ok('149. SMART_LINK(ATK+1)+NEURAL_JACK(HACK+2·maxHp−2) → atk3·hack7·maxHp10',
  e1g.atk === 3 && e1g.hack === 7 && e1g.maxHp === 10);
// MYOMER_LEGS(spd+2, mov+1): BLADE spd3→5, movFromSpd(5)=4 +1 = 5.
var g2 = CH.makeCharacter('BLADE'); g2.equipment = { weapon: null, cyberware: 'MYOMER_LEGS' };
var e2g = CH.effectiveStats(g2);
ok('150. MYOMER_LEGS(SPD+2·MOV+1) BLADE → spd5·mov5 (SPD→MOV 파생 정합)', e2g.spd === 5 && e2g.mov === 5);
// HAIR_TRIGGER(cooldown-1) → cdReduction 1.
var g3 = CH.makeCharacter('CIPHER'); g3.equipment = { weapon: 'HAIR_TRIGGER', cyberware: null };
ok('151. HAIR_TRIGGER(쿨다운−1) → effectiveStats.cdReduction = 1', CH.effectiveStats(g3).cdReduction === 1);

console.log('\n== 쿨다운 감소 전투 전파 [B1 buildCombat → applyAttack] ==');
// HAIR_TRIGGER 장착 → GLITCH(cd3) 사용 후 쿨다운 3−1=2. 무장비 대조 = 3.
function glitchCd(character) {
  var c = S.buildCombat(MI.MISSION, character, 'outro');
  var p = S.player(c); var tgt = c.units.filter(function (u) { return u.side === 'enemy' && u.ai !== 'static'; })[0];
  p.x = tgt.x; p.y = tgt.y + 1; c.signal = SIG.STATES.DOWN; // 인접·결정론
  var after = S.applyAttack(c, tgt.id, 'GLITCH');
  return S.player(after).cooldowns.GLITCH;
}
var hgChar = CH.makeCharacter('CIPHER'); hgChar.equipment = { weapon: 'HAIR_TRIGGER', cyberware: null };
ok('152. buildCombat cdReduction 전파 + GLITCH 쿨다운 3→2 (무장비 대조 3)',
  glitchCd(hgChar) === 2 && glitchCd(CH.makeCharacter('CIPHER')) === 3);
// buildCombat 이 player.cdReduction 을 실제로 실음.
var hgCombat = S.buildCombat(MI.MISSION, hgChar, 'outro');
ok('153. buildCombat player.cdReduction = 1 (무장비면 0)',
  S.player(hgCombat).cdReduction === 1 && S.player(S.buildCombat(MI.MISSION, CH.makeCharacter('CIPHER'), 'outro')).cdReduction === 0);

console.log('\n== 장비 구매 차감 · 슬롯 교체 · 소유 무료 재장착 [B1 store.buyGear] ==');
var shop0 = S.rpgInitialState(); shop0.save.character.nuyen = 60;
var shopBuy = S.buyGear(shop0, 'weapon', 'SMART_LINK');
ok('154. 구매 → ₵ 차감(60−22=38) · equipment.weapon=SMART_LINK · gearOwned 기록',
  shopBuy.save.character.nuyen === 38 && shopBuy.save.character.equipment.weapon === 'SMART_LINK' &&
  shopBuy.save.character.gearOwned.indexOf('SMART_LINK') >= 0 && shopBuy.save.nuyen === 38);
// 슬롯 교체: 다른 무기 구매 → 슬롯 교체(소유 2종).
var shopSwap = S.buyGear(shopBuy, 'weapon', 'ICE_BREAKER');
ok('155. 슬롯 교체: ICE_BREAKER 구매 → weapon 교체(₵16) · 소유 2종',
  shopSwap.save.character.equipment.weapon === 'ICE_BREAKER' && shopSwap.save.character.nuyen === 16 &&
  shopSwap.save.character.gearOwned.length === 2);
// 소유 재장착 무료: SMART_LINK 재장착 → ₵ 무변동.
var shopReeq = S.buyGear(shopSwap, 'weapon', 'SMART_LINK');
ok('156. 소유 장비 재장착 무료 (₵ 무변동 16) · 슬롯 = SMART_LINK',
  shopReeq.save.character.nuyen === 16 && shopReeq.save.character.equipment.weapon === 'SMART_LINK');
// 이미 장착 중 재구매 차단.
ok('157. 이미 장착된 장비 재선택 차단 (₵ 무변동)',
  S.buyGear(shopReeq, 'weapon', 'SMART_LINK').banner.kind === 'blocked' &&
  S.buyGear(shopReeq, 'weapon', 'SMART_LINK').save.character.nuyen === 16);

console.log('\n== 장비 클래스 제한 · ₵ 부족 · 해제 [B1] ==');
// MONO_EDGE (atk>=4): CIPHER 차단 / BLADE 허용. NEURAL_JACK (hack>=3): BLADE 차단 / CIPHER 허용.
var cipherShop = S.rpgInitialState(); cipherShop.save.character.nuyen = 99;
var bladeShop = S.rpgInitialState(); bladeShop.save.character = CH.makeCharacter('BLADE'); bladeShop.save.character.nuyen = 99;
ok('158. classReq atk≥4: MONO_EDGE CIPHER 차단 / BLADE 허용',
  S.buyGear(cipherShop, 'weapon', 'MONO_EDGE').banner.kind === 'blocked' &&
  S.buyGear(bladeShop, 'weapon', 'MONO_EDGE').save.character.equipment.weapon === 'MONO_EDGE');
ok('159. classReq hack≥3: NEURAL_JACK BLADE 차단 / CIPHER 허용',
  S.buyGear(bladeShop, 'cyberware', 'NEURAL_JACK').banner.kind === 'blocked' &&
  S.buyGear(cipherShop, 'cyberware', 'NEURAL_JACK').save.character.equipment.cyberware === 'NEURAL_JACK');
// ₵ 부족 차단 (미소유 · 잔액 부족).
var poor = S.rpgInitialState(); poor.save.character.nuyen = 5;
var poorTry = S.buyGear(poor, 'cyberware', 'NEURAL_JACK'); // ₵42 필요
ok('160. ₵ 부족 시 구매 차단 (₵ 무변동 5 · 미장착)',
  poorTry.banner.kind === 'blocked' && poorTry.save.character.nuyen === 5 && poorTry.save.character.equipment.cyberware === null);
// 해제: 슬롯 비움 · 소유 유지.
var uneq = S.unequipGear(shopReeq, 'weapon');
ok('161. 장비 해제 → 슬롯 null · 소유(gearOwned) 유지',
  uneq.save.character.equipment.weapon === null && uneq.save.character.gearOwned.indexOf('SMART_LINK') >= 0);

console.log('\n== 세이브 라운드트립 · 마이그레이션 (장비 경제) [B1 하위 호환] ==');
// 라운드트립: 장비·소유·인텔 무손실.
var rtState = S.rpgInitialState(); rtState.save.character.nuyen = 80;
rtState = S.buyGear(rtState, 'cyberware', 'MOOD_CHIP');
rtState = S.buyIntel(rtState, 'ch01-first-blood');
var rtImp = SAVE.importString(SAVE.exportString(rtState.save));
ok('162. 세이브 라운드트립: equipment/gearOwned/intel 무손실',
  rtImp.ok && rtImp.save.character.equipment.cyberware === 'MOOD_CHIP' &&
  rtImp.save.character.gearOwned.indexOf('MOOD_CHIP') >= 0 && rtImp.save.intel['ch01-first-blood'] === true);
// 마이그레이션: 구세이브(장비 필드 없음) → 무장비 기본 백필(멱등).
var legacyChar = CH.makeCharacter('CIPHER'); delete legacyChar.equipment; delete legacyChar.gearOwned;
var legacyGear = { version: 1, character: legacyChar, flags: {}, heat: 0, heatCap: 10, missionsDone: [] };
var legGImp = SAVE.importString(SAVE.exportString(legacyGear));
ok('163. 구세이브 마이그레이션 → equipment{weapon:null,cyberware:null}·gearOwned[]·intel{} 백필',
  legGImp.ok && legGImp.save.character.equipment.weapon === null && legGImp.save.character.equipment.cyberware === null &&
  Array.isArray(legGImp.save.character.gearOwned) && typeof legGImp.save.intel === 'object');
var legGImp2 = SAVE.importString(SAVE.exportString(legGImp.save));
ok('164. 장비 마이그레이션 멱등 (재적용 no-op)',
  JSON.stringify(legGImp2.save.character.equipment) === JSON.stringify(legGImp.save.character.equipment));

console.log('\n== 정보상 인텔: 구매 · 표시 플래그 · 전투 수치 무변경 [B1] ==');
var itState = S.rpgInitialState(); itState.save.character.nuyen = 20;
var itBuy = S.buyIntel(itState, 'ch01-first-blood');
ok('165. 인텔 구매 → ₵ 차감(20−6=14) · save.intel[ch01]=true',
  itBuy.save.character.nuyen === 14 && itBuy.save.intel['ch01-first-blood'] === true && itBuy.save.nuyen === 14);
ok('166. 인텔 재구매 차단 (이미 확보 · ₵ 무변동)',
  S.buyIntel(itBuy, 'ch01-first-blood').banner.kind === 'blocked' && S.buyIntel(itBuy, 'ch01-first-blood').save.character.nuyen === 14);
ok('167. 미해금 미션 인텔 차단 (ch03 잠김)',
  S.buyIntel(itState, 'ch03-martial-night').banner.kind === 'blocked' && S.buyIntel(itState, 'ch03-martial-night').save.character.nuyen === 20);
// 인텔 구매 미션 진입 → 전투 브리핑 공개 플래그 + 브리핑 패널 데이터.
var itPlay = S.startMission(itBuy, 'ch01-first-blood');
itPlay = S.dialogueChoose(itPlay, 0);          // intro → approach
itPlay = S.dialogueChoose(itPlay, 0);          // 무력 돌파 → combat(intel 전파)
var itEnemyCount = MI.MISSION.combat.enemies.length;
ok('168. 인텔 구매 미션 전투 → combat.intel=true · 브리핑(적 배치 + 증원) 공개',
  itPlay.combat.intel === true && !!itPlay.combat.briefing &&
  itPlay.combat.briefing.enemies.length === itEnemyCount &&
  itPlay.combat.briefing.reinforcement && itPlay.combat.briefing.reinforcement.name.length > 0 &&
  itPlay.combat.briefing.threatCap === MI.MISSION.combat.threatCap);
// 인텔 미구매 미션 진입 → 브리핑 없음(플래그 false).
var noIt = S.startMission(S.rpgInitialState(), 'ch01-first-blood');
noIt = S.dialogueChoose(noIt, 0); noIt = S.dialogueChoose(noIt, 0);
ok('169. 인텔 미구매 → combat.intel=false · 브리핑 미생성', noIt.combat.intel === false && !noIt.combat.briefing);
// ★전투 수치 무변경: 인텔 유무로 유닛 스탯/오브젝티브 동일 (정보만, 수치 무개입).
var cWith = S.buildCombat(MI.MISSION, CH.makeCharacter('CIPHER'), 'outro', { intel: true });
var cNo   = S.buildCombat(MI.MISSION, CH.makeCharacter('CIPHER'), 'outro', { intel: false });
ok('170. 인텔 전투 수치 무변경 (유닛·오브젝티브 byte 동일 — 정보만 공개)',
  JSON.stringify(cWith.units) === JSON.stringify(cNo.units) &&
  JSON.stringify(cWith.objective) === JSON.stringify(cNo.objective) &&
  JSON.stringify(cWith.threat) === JSON.stringify(cNo.threat));

// ============================================================================
// ==============  V1 — 장비 반영 밸런스 재측정 (_balance.js 장비 시나리오)  ====
//   장비는 옵트인 파워: base(무장비)=기존 64조합 불변 · mid=클리어율 동일+여유↑ ·
//   full=후반 챕터(ch06~08) ≥3R 유지(트리비얼화 없음). 시나리오 핀 고정(회귀 즉시 실패).
// ============================================================================
console.log('\n== 장비 시나리오 핀 [V1 _balance.js 확장] ==');
// equipFor 결정론 — base 무장비 · mid 슬롯당 최저가(전 클래스 동일 · classReq 없음).
var scnCipher = CH.makeCharacter('CIPHER'), scnBlade = CH.makeCharacter('BLADE');
ok('171. equipFor base=무장비{null,null} · mid=SMART_LINK+MOOD_CHIP (전 클래스 동일)',
  JSON.stringify(BAL.equipFor('base', scnCipher)) === '{"weapon":null,"cyberware":null}' &&
  BAL.equipFor('mid', scnCipher).weapon === 'SMART_LINK' && BAL.equipFor('mid', scnCipher).cyberware === 'MOOD_CHIP' &&
  BAL.equipFor('mid', scnBlade).weapon === 'SMART_LINK' && BAL.equipFor('mid', scnBlade).cyberware === 'MOOD_CHIP');
// full 슬롯당 최고가 장착 가능품 — classReq(hack≥3) 존중: BLADE(hack1)는 NEURAL_JACK 불가 → IRON_SKIN.
var fCip = BAL.equipFor('full', scnCipher), fBla = BAL.equipFor('full', scnBlade);
ok('172. equipFor full: 최고가 · classReq 존중 (CIPHER=HAIR_TRIGGER+NEURAL_JACK / BLADE=HAIR_TRIGGER+IRON_SKIN)',
  fCip.weapon === 'HAIR_TRIGGER' && fCip.cyberware === 'NEURAL_JACK' &&
  fBla.weapon === 'HAIR_TRIGGER' && fBla.cyberware === 'IRON_SKIN' &&
  BAL.equipFor('full', CH.makeCharacter('RIGGER')).cyberware === 'NEURAL_JACK' &&
  BAL.equipFor('full', CH.makeCharacter('MOLE')).cyberware === 'NEURAL_JACK');
// base 시나리오 = 무인자 실행 byte 동일(무장비 델타 0 → effectiveStats 불변의 근거).
var sc0 = BAL.runEncounter('CIPHER', 'ch08-zero-day', 'objective');
var scB = BAL.runEncounter('CIPHER', 'ch08-zero-day', 'objective', 'base');
ok('173. base 시나리오 = 무인자 runEncounter byte 동일 (기존 64조합 불변 재확인)',
  JSON.stringify(sc0) === JSON.stringify(scB));
// 시나리오 매트릭스 집계 — mid 클리어율 = base(64/64) & 여유(평균종료HP) 증가.
var aggBase = BAL.aggregateScenario(BAL.runMatrix('base'));
var aggMid  = BAL.aggregateScenario(BAL.runMatrix('mid'));
var aggFull = BAL.aggregateScenario(BAL.runMatrix('full'));
var AGG_N = aggBase.total;   // [62차/v6.44] 160 → [65차] 6클래스 42 인카운터×6 = 252. 시나리오 집계 총량(하네스 encounters 순회 반영).
// 트리비얼은 enc① 워밍업/ch02 계승 베이스라인(BLADE 탱커) 3건 — 문서화 허용(51차 선례). clearFail 0 이 램프 불변식.
ok('174. base ' + AGG_N + '/' + AGG_N + ' 클리어 · clearFail 0 · trivial ≤3(enc①/베이스라인 · 무장비 밴드)',
  aggBase.clearable === AGG_N && aggBase.total === 252 && aggBase.trivial <= 3 && aggBase.fail === 0);
ok('175. mid: 클리어율 동일(' + AGG_N + '/' + AGG_N + '=base) · 여유 증가(평균종료HP mid≥base)',
  aggMid.clearable === aggBase.clearable && aggMid.clearable === AGG_N && aggMid.avgHp >= aggBase.avgHp && aggMid.fail === 0);
// ★full 후반 챕터 트리비얼화 가드 — ch06~08 최속승리 min ≥3R & 후반 트리비얼 0 = 합격(장비 하향 불요).
var guardFull = BAL.lateChapterGuard(BAL.runMatrix('full'));
ok('176. full: 후반 챕터(ch06~08) ≥3R 유지 & 트리비얼 0 — 트리비얼화 없음(가드 PASS)',
  guardFull.pass === true && guardFull.trivLate === 0 &&
  guardFull.perCh[6].min >= 3 && guardFull.perCh[7].min >= 3 && guardFull.perCh[8].min >= 3 &&
  aggFull.clearable === AGG_N && aggFull.fail === 0);

// ============================================================================
// ============  57차 — 챕터 8 완주 피날레 (엔딩 씬 · 통계 · 회차 플레이)  ======
//   엔딩 분기 판정(누적 flag) · 에필로그 발췌 · 통계 파생 · 엔딩 기록 영속 ·
//   회차 리셋 시 엔딩 기록 보존 · 마이그레이션 하위 호환 · store 에필로그 라우팅.
// ============================================================================

console.log('\n== 엔딩 분기 판정 [57차 ending.resolveEnding] ==');
// 'ending' flag(ch08 end 노드가 세움)가 최우선.
ok('177. ending flag 우선 판정 (corporate-eternal)',
  END.resolveEnding({ flags: { ending: 'corporate-eternal' } }) === 'corporate-eternal');
// ending flag 없을 때 누적 flag 파생 — ch08 endingSplit 게이트 우선순위 계승.
ok('178. 파생: endingTrack → corporate-eternal (ch07 지배 트랙)',
  END.resolveEnding({ flags: { endingTrack: 'domination' } }) === 'corporate-eternal');
ok('179. 파생 우선순위: allBlocsHostile → street-rising (endingTrack 없을 때)',
  END.resolveEnding({ flags: { allBlocsHostile: true } }) === 'street-rising' &&
  END.resolveEnding({ flags: { endingTrack: 'x', allBlocsHostile: true } }) === 'corporate-eternal');
ok('180. 파생: ascendEnding → nexus-reborn (유일 전원 생존)',
  END.resolveEnding({ flags: { ascendEnding: true } }) === 'nexus-reborn');
ok('181. 누적 flag 전무 → dead-nexus (카드 확정 기본값)',
  END.resolveEnding({ flags: {} }) === 'dead-nexus' && END.resolveEnding({}) === 'dead-nexus');

console.log('\n== 에필로그 발췌 + 통계 파생 [57차] ==');
var epC = END.epilogueFor('corporate-eternal');
ok('182. epilogueFor: 제목·스티커·산문 라인 + 발췌/각색 태그 (원전 통제)',
  epC.title === 'CORPORATE ETERNAL' && epC.sticker === 'ERA OF ONE' && epC.lines.length >= 3 &&
  epC.lines.some(function (l) { return l.indexOf('[발췌]') === 0; }) &&
  epC.lines.some(function (l) { return l.indexOf('[각색]') === 0; }));
ok('183. epilogueFor 미지 key → dead-nexus 폴백', END.epilogueFor('???').key === 'dead-nexus' && END.ORDER.length === 4);
// 당신의 선택들 — flags 파생, 값 있는 항목만.
var sumFlags = { heroChoice: 'hero', extractionStyle: 'quiet', breachMethod: 'signature', endingTrack: 'revolution' };
var summ = END.choiceSummary(sumFlags);
ok('184. choiceSummary: heroChoice/extractionStyle/breachMethod/endingTrack 회고 (4항목)',
  summ.length === 4 && summ[0].ch === 1 && summ.some(function (c) { return c.key === 'breachMethod' && c.text.indexOf('서명') >= 0; }) &&
  END.choiceSummary({}).length === 0);
// 통계 파생 — karma 지출 = growth 합, 메인/사이드 분리.
var statSave = S.newSave();
statSave.character.growth = { hp: 1, atk: 0, def: 2, spd: 0, hack: 3 }; // 지출 6
statSave.character.karma = 4; statSave.character.gearOwned = ['SMART_LINK']; statSave.character.equipment = { weapon: 'SMART_LINK', cyberware: null };
statSave.missionsDone = ['ch01-first-blood', 'ch02-insider-game', 'side-01-traitor-contract'];
var stat = END.campaignStats(statSave);
ok('185. campaignStats: 클리어 3(메인2·사이드1) · karma 지출 6 · 잔여 4 · 장비 보유 1/장착 1',
  stat.missionsCleared === 3 && stat.mainCleared === 2 && stat.sideCleared === 1 &&
  stat.karmaSpent === 6 && stat.karmaCurrent === 4 && stat.gearOwnedCount === 1 && stat.gearEquipped.length === 1);

console.log('\n== 엔딩 기록 영속 + 마이그레이션 [57차 recordEnding/migrateEndings] ==');
var rec0 = END.recordEnding(undefined, 'corporate-eternal', 'CIPHER');
ok('186. recordEnding: seen count 1 · byClass CIPHER · runs 1 (구세이브 undefined 안전)',
  rec0.seen['corporate-eternal'] === 1 && rec0.byClass.CIPHER === true && rec0.runs === 1);
var rec1 = END.recordEnding(rec0, 'corporate-eternal', 'BLADE');
ok('187. recordEnding 누적: 같은 엔딩 count 2 · byClass 2클래스 · runs 2 (순수 — 원본 불변)',
  rec1.seen['corporate-eternal'] === 2 && rec1.byClass.CIPHER === true && rec1.byClass.BLADE === true &&
  rec1.runs === 2 && rec0.runs === 1);
// [v6.44] migrateEndings 가 capstone/capstoneByClass 백필 → 정규화 기대형에 포함.
ok('188. migrateEndings: 손상/부분 스키마 정규화 + 멱등 (v6.44 capstone 백필 포함)',
  JSON.stringify(END.migrateEndings(null)) === JSON.stringify({ seen: {}, byClass: {}, runs: 0, capstone: 0, capstoneByClass: {} }) &&
  JSON.stringify(END.migrateEndings({ seen: { x: 1 } })) === JSON.stringify({ seen: { x: 1 }, byClass: {}, runs: 0, capstone: 0, capstoneByClass: {} }) &&
  JSON.stringify(END.migrateEndings(END.migrateEndings(rec1))) === JSON.stringify(END.migrateEndings(rec1)));
var seenList = END.endingsSeen(rec1);
ok('189. endingsSeen: 4엔딩 고정 목록 · corporate 열람(count2) · 나머지 미열람',
  seenList.length === 4 && seenList[0].key === 'corporate-eternal' && seenList[0].seen === true && seenList[0].count === 2 &&
  seenList[3].seen === false);

console.log('\n== 회차 플레이 — 진행 리셋 · 엔딩 기록 보존 [57차 newGamePlus] ==');
var prevSave = S.newSave();
prevSave.missionsDone = ['ch01-first-blood', 'ch08-zero-day']; prevSave.flags = { ending: 'nexus-reborn', heroChoice: 'ghost' };
prevSave.character.rep = 40; prevSave.intel = { 'ch01-first-blood': true };
prevSave.endings = END.recordEnding(undefined, 'nexus-reborn', 'CIPHER');
var ngp = END.newGamePlus(prevSave, S.newSave());
ok('190. newGamePlus: missionsDone/flags/intel/rep 리셋 (신규 진행)',
  ngp.missionsDone.length === 0 && Object.keys(ngp.flags).length === 0 &&
  Object.keys(ngp.intel).length === 0 && ngp.character.rep === 0);
ok('191. newGamePlus: 엔딩 기록(endings) 영속 — nexus-reborn seen 유지 · runs 1',
  ngp.endings.seen['nexus-reborn'] === 1 && ngp.endings.byClass.CIPHER === true && ngp.endings.runs === 1);

console.log('\n== 세이브 마이그레이션: endings 백필 [57차 하위 호환] ==');
// 구세이브(endings 필드 없음) → 빈 기록 백필 · 라운드트립 · 멱등.
var oldSave = { version: 1, character: S.newSave().character, flags: {}, heat: 0, heatCap: 10, missionsDone: [] };
var oldImp = SAVE.importString(SAVE.exportString(oldSave));
ok('192. 구세이브 마이그레이션 → endings{seen:{},byClass:{},runs:0} 백필',
  oldImp.ok && oldImp.save.endings && typeof oldImp.save.endings.seen === 'object' &&
  typeof oldImp.save.endings.byClass === 'object' && oldImp.save.endings.runs === 0);
var endSave = S.newSave(); endSave.endings = END.recordEnding(undefined, 'street-rising', 'BLADE');
var endImp = SAVE.importString(SAVE.exportString(endSave));
ok('193. endings 라운드트립 무손실 + 마이그레이션 멱등',
  endImp.ok && endImp.save.endings.seen['street-rising'] === 1 && endImp.save.endings.byClass.BLADE === true &&
  JSON.stringify(SAVE.importString(SAVE.exportString(endImp.save)).save.endings) === JSON.stringify(endImp.save.endings));

console.log('\n== ch08 완주 → 에필로그 씬 라우팅 (store 통합) [57차] ==');
// ch08 settle 선택지 = epilogue + returnHub 병기 (검증기 종결 계약 + 에필로그 라우팅).
var settleCh = CAMP.missionData('ch08-zero-day').dialogue.nodes.settle.choices[0].effect;
ok('194. ch08 settle 선택지 effect = { epilogue:true, returnHub:true } (데이터 구동)',
  settleCh.epilogue === true && settleCh.returnHub === true);
// CIPHER(HACK5) 완주: intro→approach→[HACK5]coreBreach→endingSplit→endCorporate→settle→epilogue.
var ep = S.rpgInitialState();
ep.save.missionsDone = ['ch01-first-blood', 'ch02-insider-game', 'ch03-martial-night', 'ch04-price-of-splice', 'ch05-mesh-ghost', 'ch06-bloc-acquisition', 'ch07-heart-of-city'];
ep.save.flags = { endingTrack: 'domination' };
ep = S.startMission(ep, 'ch08-zero-day');   // intro
ep = S.dialogueChoose(ep, 0);               // intro → approach
ep = S.dialogueChoose(ep, 1);               // [HACK5] 서명 직결(전투 스킵) → coreBreach
ok('195. CIPHER [HACK5] 코어 돌파 = 전투 스킵 (combat null · coreBreach)',
  ep.combat === null && ep.dialogue.nodeId === 'coreBreach');
ep = S.dialogueChoose(ep, 0);               // coreBreach → endingSplit
ep = S.dialogueChoose(ep, 0);               // [endingTrack] → endCorporate (ending flag 세움)
ep = S.dialogueChoose(ep, 0);               // endCorporate → settle (applyRewards · ch08 missionsDone)
ok('196. settle 진입 = ending flag corporate-eternal · ch08 클리어 기록',
  ep.save.flags.ending === 'corporate-eternal' && ep.save.missionsDone.indexOf('ch08-zero-day') >= 0);
var epFinal = S.dialogueChoose(ep, 0);      // settle → epilogue (엔딩 기록 영속)
ok('197. 완주 → scene epilogue · epilogue.ending corporate-eternal · 엔딩 기록 영속(seen·byClass·runs)',
  epFinal.scene === 'epilogue' && epFinal.epilogue.ending === 'corporate-eternal' &&
  epFinal.save.endings.seen['corporate-eternal'] === 1 && epFinal.save.endings.byClass.CIPHER === true &&
  epFinal.save.endings.runs === 1);

console.log('\n== 에필로그 → 허브 / 새 회차 (리듀서) [57차] ==');
var epHub = S.rpgReducer(epFinal, { type: 'EPILOGUE_CONTINUE' });
ok('198. EPILOGUE_CONTINUE → 허브 귀환 (봉인 유지 · 진행 보존)',
  epHub.scene === 'hub' && epHub.epilogue === null && epHub.save.missionsDone.indexOf('ch08-zero-day') >= 0);
var epNgp = S.rpgReducer(epFinal, { type: 'NEW_GAME_PLUS' });
ok('199. NEW_GAME_PLUS → 진행 리셋(missionsDone 0 · flags 0) · 엔딩 기록 영속(runs 1) · 허브',
  epNgp.scene === 'hub' && epNgp.save.missionsDone.length === 0 && Object.keys(epNgp.save.flags).length === 0 &&
  epNgp.save.endings.seen['corporate-eternal'] === 1 && epNgp.save.endings.runs === 1);
// 폴백 엔딩(누적 flag 없음) 완주 → dead-nexus 기록 (endingSplit ungated 폴백 경로).
var epD = S.rpgInitialState();
epD.save.missionsDone = ['ch01-first-blood', 'ch02-insider-game', 'ch03-martial-night', 'ch04-price-of-splice', 'ch05-mesh-ghost', 'ch06-bloc-acquisition', 'ch07-heart-of-city'];
epD = S.startMission(epD, 'ch08-zero-day');
epD = S.dialogueChoose(epD, 0);             // approach
epD = S.dialogueChoose(epD, 1);             // [HACK5] → coreBreach
epD = S.dialogueChoose(epD, 0);             // → endingSplit
epD = S.dialogueChoose(epD, 4);             // ungated 폴백 → endDead
epD = S.dialogueChoose(epD, 0);             // endDead → settle
var epDFinal = S.dialogueChoose(epD, 0);    // → epilogue
ok('200. 폴백 경로(누적 flag 없음) → dead-nexus 엔딩 기록 (endingSplit ungated 폴백)',
  epDFinal.epilogue.ending === 'dead-nexus' && epDFinal.save.endings.seen['dead-nexus'] === 1);

// ============================================================================
// [61차] Act 2 엔진 확장 — 멀티 인카운터 · 게이트 확장 · 하드모드 · 신규 적 · a2-00
// ============================================================================

console.log('\n== [61차] 신규 적 7종 스키마 (data/enemies.js §2 스탯표) ==');
var A2_NEW = ['MERIDIAN_VANGUARD', 'MERIDIAN_STALKER', 'MERIDIAN_DRONE', 'MERIDIAN_WARLORD', 'WARD_NODE', 'ELIA_VOSS', 'HARLAN_VOSS'];
var newSchemaOk = A2_NEW.every(function (k) {
  var t = EN.ENEMIES[k];
  return t && t.key === k && numFin(t.hp) && numFin(t.atk) && numFin(t.def) &&
    numFin(t.spd) && numFin(t.hack) && numFin(t.mov) && numFin(t.range) &&
    typeof t.attr === 'string' && typeof t.ai === 'string' && typeof t.name === 'string';
});
function numFin(v) { return typeof v === 'number' && Number.isFinite(v); }
ok('201. 신규 7종 전부 존재 + spawnEnemy 소비 스키마 완비', newSchemaOk);
var mv = EN.ENEMIES.MERIDIAN_VANGUARD;
ok('202. MERIDIAN_VANGUARD 스탯 = hp14/atk5/def4/spd2/hack0 IRON advance (§2 그대로)',
  mv.hp === 14 && mv.atk === 5 && mv.def === 4 && mv.spd === 2 && mv.hack === 0 && mv.attr === 'IRON' && mv.ai === 'advance');
var ms = EN.ENEMIES.MERIDIAN_STALKER, md = EN.ENEMIES.MERIDIAN_DRONE, mw = EN.ENEMIES.MERIDIAN_WARLORD;
ok('203. STALKER SHADE hp8 coverShooter · DRONE VOLT isMachine · WARLORD ASH hp24 보스',
  ms.attr === 'SHADE' && ms.hp === 8 && ms.ai === 'coverShooter' && md.attr === 'VOLT' && md.isMachine === true &&
  mw.attr === 'ASH' && mw.hp === 24);
var wn = EN.ENEMIES.WARD_NODE;
ok('204. WARD_NODE = GRID static · physImmune · hackOnly · ap0 (오브젝티브 수호 · ICE 차별축)',
  wn.attr === 'GRID' && wn.ai === 'static' && wn.physImmune === true && wn.hackOnly === true && wn.ap === 0);
var ev = EN.ENEMIES.ELIA_VOSS, hv = EN.ENEMIES.HARLAN_VOSS;
ok('205. lore 보스 ELIA_VOSS(BIO hp18)·HARLAN_VOSS(VOLT hp20) 첫 등장',
  ev.attr === 'BIO' && ev.hp === 18 && hv.attr === 'VOLT' && hv.hp === 20);

console.log('\n== [61차 §3.4] 하드모드 적 스탯 스케일 (spawnEnemy scale) ==');
var a2m = CAMP.missionData('a2-00-framing');
var hmChar = CH.makeCharacter('CIPHER');
var cBase = S.buildCombat(a2m, hmChar, 'outro');
var cScale1 = S.buildCombat(a2m, hmChar, 'outro', { enemyScale: 1 });
ok('206. enemyScale=1 → 적 유닛 byte 불변(하위호환 불변식)',
  JSON.stringify(cBase.units.filter(function (u) { return u.side === 'enemy'; })) ===
  JSON.stringify(cScale1.units.filter(function (u) { return u.side === 'enemy'; })));
var cHard = S.buildCombat(a2m, hmChar, 'outro', { enemyScale: 1.25 });
var eB = cBase.units.filter(function (u) { return u.side === 'enemy'; })[0];
var eH = cHard.units.filter(function (u) { return u.side === 'enemy'; })[0];
ok('207. scale 1.25: hp/maxHp/atk = ceil(base×1.25) · def 원값 유지 (STALKER 8→10 · atk4→5 · def2 불변)',
  eH.hp === Math.ceil(eB.hp * 1.25) && eH.maxHp === Math.ceil(eB.maxHp * 1.25) &&
  eH.atk === Math.ceil(eB.atk * 1.25) && eH.def === eB.def && eB.hp === 8 && eH.hp === 10 && eH.atk === 5);
ok('208. buildCombat.combat 이 enemyScale 를 combat.enemyScale 로 이월(증원 스폰 동일 배율)', cHard.enemyScale === 1.25);

console.log('\n== [61차 §3.4] 하드모드 토글 (TOGGLE_HARD_MODE 리듀서) ==');
var hmState = S.rpgInitialState();
ok('209. 초기 save.flags.hardMode 미설정(기본 표준 밸런스)', !hmState.save.flags.hardMode);
var hmOn = S.rpgReducer(hmState, { type: 'TOGGLE_HARD_MODE' });
ok('210. TOGGLE_HARD_MODE → hardMode true 반전', hmOn.save.flags.hardMode === true);
var hmOff = S.rpgReducer(hmOn, { type: 'TOGGLE_HARD_MODE' });
ok('211. 재토글 → hardMode false (복원)', hmOff.save.flags.hardMode === false);

console.log('\n== [61차 §3.1] 멀티 인카운터 — buildCombat opts.combat 오버라이드 ==');
// 합성 미션: combat=enc① · encounters.stage2=enc②(다른 그리드/적) — store.buildCombat 오버라이드 계약.
var synMission = {
  id: 'syn-multi', title: 'syn', subtitle: 'syn',
  combat: { cols: 6, rows: 7, playerStart: { x: 3, y: 6 }, walls: [], cover: [],
    objective: { x: 3, y: 0, threshold: 6, label: 'enc1' }, enemies: [{ key: 'MERIDIAN_DRONE', x: 3, y: 3 }] },
  encounters: { stage2: { cols: 8, rows: 8, playerStart: { x: 4, y: 7 }, walls: [], cover: [],
    objective: { x: 4, y: 0, threshold: 11, label: 'enc2' }, enemies: [{ key: 'MERIDIAN_WARLORD', x: 4, y: 3 }, { key: 'WARD_NODE', x: 4, y: 1 }] } },
};
var enc1 = S.buildCombat(synMission, hmChar, 'interlude');
ok('212. opts 없음 → enc①=mission.combat (6×8? 실제 6×7 · MERIDIAN_DRONE · thr6) [하위호환]',
  enc1.field.cols === 6 && enc1.field.rows === 7 && enc1.objective.max === 6 &&
  enc1.units.filter(function (u) { return u.side === 'enemy'; }).length === 1);
var enc2 = S.buildCombat(synMission, hmChar, 'outro', { combat: synMission.encounters.stage2 });
ok('213. opts.combat=encounters.stage2 → enc②(8×8 · thr11 · WARLORD+WARD_NODE 2적) 오버라이드',
  enc2.field.cols === 8 && enc2.field.rows === 8 && enc2.objective.max === 11 &&
  enc2.units.filter(function (u) { return u.side === 'enemy'; }).length === 2);
ok('214. enc② missionId 는 mission.id 유지(resolveCombat 라우팅 계약 불변)', enc2.missionId === 'syn-multi');
// 인카운터 해석 표현식 계약(store.dialogueChoose): encounter 문자열 → mission.encounters[key].
function resolveEnc(mission, startCombat) {
  return (startCombat.encounter && mission.encounters) ? mission.encounters[startCombat.encounter] : null;
}
ok('215. encounter 해석: {encounter:"stage2"} → encounters.stage2 · 미지정 → null(mission.combat 폴백)',
  resolveEnc(synMission, { encounter: 'stage2', onWin: 'outro' }) === synMission.encounters.stage2 &&
  resolveEnc(synMission, { onWin: 'outro' }) === null &&
  resolveEnc({ id: 'x', combat: {} }, { encounter: 'stage2' }) === null);

console.log('\n== [61차 §3.2] 엔딩 게이트 + 클래스 게이트 해금 ==');
function mkSave(o) { var s = { missionsDone: [], flags: {}, character: { classKey: 'CIPHER' }, endings: { seen: {}, byClass: {}, runs: 0 } }; return Object.assign(s, o || {}); }
var eGate = { id: 'x', unlock: { endingSeen: ['corporate-eternal'] } };
ok('216. endingSeen 게이트: 미열람 → 잠김',
  CAMP.isUnlocked(eGate, mkSave()) === false);
ok('217. endingSeen 게이트: 열람(seen>0) → 해금',
  CAMP.isUnlocked(eGate, mkSave({ endings: { seen: { 'corporate-eternal': 1 }, byClass: {}, runs: 1 } })) === true);
var eGate2 = { id: 'x', unlock: { endingSeen: ['corporate-eternal', 'street-rising'] } };
ok('218. endingSeen AND: 일부만 열람 → 잠김',
  CAMP.isUnlocked(eGate2, mkSave({ endings: { seen: { 'corporate-eternal': 1 }, byClass: {}, runs: 1 } })) === false);
var cGate = { id: 'x', unlock: { classKey: 'MOLE' } };
ok('219. classKey 게이트: 타 클래스(CIPHER) → 잠김 · 해당 클래스(MOLE) → 해금',
  CAMP.isUnlocked(cGate, mkSave({ character: { classKey: 'CIPHER' } })) === false &&
  CAMP.isUnlocked(cGate, mkSave({ character: { classKey: 'MOLE' } })) === true);
var eHint = CAMP.unlockHint({ unlock: { endingSeen: ['nexus-reborn'] } });
var cHint = CAMP.unlockHint({ unlock: { classKey: ['MOLE'] } });
ok('220. unlockHint: endingSeen → "NEXUS REBORN 엔딩 열람" · classKey → "MOLE 클래스 편성" 힌트',
  /NEXUS REBORN/.test(eHint) && /엔딩 열람/.test(eHint) && /MOLE/.test(cHint) && /클래스 편성/.test(cHint));

console.log('\n== [61차] a2-00 프레이밍 — 레지스트리 · 보드 · 완주 경로 ==');
var a2entry = CAMP.missionById('a2-00-framing');
ok('221. a2-00 레지스트리 = kind act2 · unlock missionsDone ch08 (엔딩 무관)',
  a2entry && a2entry.kind === 'act2' && a2entry.unlock.missionsDone[0] === 'ch08-zero-day' && !a2entry.unlock.endingSeen);
var noCh8 = mkSave();
var yesCh8 = mkSave({ missionsDone: ['ch08-zero-day'] });
ok('222. a2-00 해금: ch08 미완주 → 잠김 · 완주 → 해금(엔딩 무관하게)',
  CAMP.isUnlocked(a2entry, noCh8) === false && CAMP.isUnlocked(a2entry, yesCh8) === true);
var bs = CAMP.boardState(yesCh8);   // mkSave 기본 classKey = CIPHER · endings.seen = {} (엔딩 미열람)
// [62차/v6.44] act2 그룹 14 → [65차] 16(a2-00 + 갈래 8 + 클래스 6 + 캡스톤 1). ch08 완주 + CIPHER 편성 → a2-00 + CIPHER 사이드 해금.
//   갈래 8(endingSeen 게이트) 전부 잠김 · 타 클래스 사이드 5 잠김(classKey 게이트) · 캡스톤 잠김(4갈래 종결 게이트).
var a2FramingRow = bs.act2.filter(function (r) { return r.id === 'a2-00-framing'; })[0];
var a2Unlocked = bs.act2.filter(function (r) { return r.unlocked; }).map(function (r) { return r.id; });
var branchLocked = bs.act2.filter(function (r) { return ['A', 'B', 'C', 'D'].indexOf(r.branch) >= 0 && !r.unlocked; }).length;
ok('223. boardState.act2 = 16(a2-00+갈래8+클래스6+캡스톤1) · ch08+CIPHER → a2-00·CIPHER사이드 해금 · 갈래8 잠금 · mains 8 · sides 8',
  bs.act2.length === 16 && a2FramingRow && a2FramingRow.unlocked === true &&
  a2Unlocked.length === 2 && a2Unlocked.indexOf('a2-side-cipher-static') >= 0 &&
  branchLocked === 8 && bs.mains.length === 8 && bs.sides.length === 8);
// 완주 경로(전투 경로): intro→approach→[전투]→outro→settle→returnHub. RIGGER(spd2) = 전투 폴백.
var a2 = S.rpgInitialState();
a2.save.missionsDone = ['ch08-zero-day'];
a2.save.character = CH.makeCharacter('RIGGER');
a2 = S.startMission(a2, 'a2-00-framing');
ok('224. a2-00 진입 = dialogue intro (해금 통과)', a2.scene === 'dialogue' && a2.dialogue.nodeId === 'intro');
a2 = S.dialogueChoose(a2, 0);   // intro → approach
a2 = S.dialogueChoose(a2, 0);   // approach → [전투] startCombat onWin outro
ok('225. approach 전투 선택 → scene combat · onWin outro · MERIDIAN 정찰대 3적(STALKER×2+DRONE)',
  a2.scene === 'combat' && a2.combat.onWin === 'outro' &&
  a2.combat.units.filter(function (u) { return u.side === 'enemy'; }).length === 3);
// 전투 강제 승리 → resolveCombat → outro → settle → returnHub(applyRewards).
a2.combat.objective.done = true; a2.combat.outcome = 'win';
a2 = S.resolveCombat(a2);
ok('226. 전투 승리 → outro 라우팅 (meridianKnown/act2Framed flag)', a2.dialogue.nodeId === 'outro' && a2.save.flags.meridianKnown === true);
a2 = S.dialogueChoose(a2, 0);   // outro → settle (applyRewards)
ok('227. settle applyRewards → a2-00 클리어 기록 · rep 가산(4)',
  a2.save.missionsDone.indexOf('a2-00-framing') >= 0 && a2.save.character.rep >= 4);
var a2hub = S.dialogueChoose(a2, 0);  // settle → returnHub
ok('228. settle → returnHub → 허브 귀환(미션 종결)', a2hub.scene === 'hub');

console.log('\n== [61차] a2-00 게이트 지름길 (SPD4 · flag) — skipCombat 전투 스킵 ==');
// CIPHER(spd4) → [SPD4] 우회 통과(전투 스킵) · RIGGER(spd2) → 잠김(전투 폴백).
var a2c = S.rpgInitialState(); a2c.save.missionsDone = ['ch08-zero-day']; a2c.save.character = CH.makeCharacter('CIPHER');
a2c = S.startMission(a2c, 'a2-00-framing'); a2c = S.dialogueChoose(a2c, 0);  // approach
var a2cSpd = S.dialogueChoose(a2c, 1);   // [SPD4] 우회 (CIPHER spd4 통과)
ok('229. CIPHER(spd4) [SPD4] 우회 → 전투 스킵(combat null · outro) · meridianRecon flag',
  a2cSpd.scene === 'dialogue' && a2cSpd.dialogue.nodeId === 'outro' && a2cSpd.combat === null && a2cSpd.save.flags.meridianRecon === true);
var a2r = S.rpgInitialState(); a2r.save.missionsDone = ['ch08-zero-day']; a2r.save.character = CH.makeCharacter('RIGGER');
a2r = S.startMission(a2r, 'a2-00-framing'); a2r = S.dialogueChoose(a2r, 0);  // approach
var a2rSpd = S.dialogueChoose(a2r, 1);   // [SPD4] RIGGER spd2 → blocked
ok('230. RIGGER(spd2) [SPD4] 잠김 → blocked 배너(전투 폴백 상존, MFU)',
  a2rSpd.banner && a2rSpd.banner.kind === 'blocked' && a2rSpd.scene === 'dialogue' && a2rSpd.dialogue.nodeId === 'approach');
// [flag zeroDayBreached] 지름길 — 계승 flag 보유 시 전투 스킵.
var a2f = S.rpgInitialState(); a2f.save.missionsDone = ['ch08-zero-day']; a2f.save.character = CH.makeCharacter('RIGGER');
a2f.save.flags.zeroDayBreached = true;
a2f = S.startMission(a2f, 'a2-00-framing'); a2f = S.dialogueChoose(a2f, 0);  // approach
var a2fGate = S.dialogueChoose(a2f, 2);  // [flag zeroDayBreached] → skipCombat
ok('231. [flag zeroDayBreached] 계승 지름길 → 전투 스킵(outro) · meridianDecoded flag',
  a2fGate.dialogue.nodeId === 'outro' && a2fGate.combat === null && a2fGate.save.flags.meridianDecoded === true);

console.log('\n== [61차 §3.1] 하드모드 통합 — dialogueChoose 전투 개시 시 스케일 적용 ==');
var a2h = S.rpgInitialState(); a2h.save.missionsDone = ['ch08-zero-day']; a2h.save.character = CH.makeCharacter('RIGGER');
a2h.save.flags.hardMode = true;
a2h = S.startMission(a2h, 'a2-00-framing'); a2h = S.dialogueChoose(a2h, 0);  // approach
a2h = S.dialogueChoose(a2h, 0);  // 전투 개시 (hardMode → scale 1.25)
var hEnemy = a2h.combat.units.filter(function (u) { return u.side === 'enemy' && u.key === 'MERIDIAN_STALKER'; })[0];
ok('232. hardMode ON → dialogueChoose 전투 개시 시 적 스탯 스케일(STALKER hp 8→10) · combat.enemyScale 1.25',
  hEnemy.hp === 10 && hEnemy.atk === 5 && a2h.combat.enemyScale === 1.25);

// ============================================================================
console.log('\n== [62차→65차] Act2 본편 14엔트리 — 레지스트리 · 해금 게이트 · 갈래 개방 ==');
var A2_MAIN = ['a2-a1-crown-breach', 'a2-a2-crown-throne', 'a2-b1-barricade', 'a2-b2-freeport',
  'a2-c1-first-contact', 'a2-c2-signal-war', 'a2-d1-scavenge', 'a2-d2-last-signal'];
// [65차] BROKER/DRIFTER 클래스 사이드 2 추가 → 클래스 사이드 6(6클래스 전량).
var A2_CLASS = ['a2-side-cipher-static', 'a2-side-blade-vendetta', 'a2-side-rigger-build', 'a2-side-mole-whoami',
  'a2-side-broker-ledger', 'a2-side-drifter-lastroad'];
var A2_ALL = A2_MAIN.concat(A2_CLASS);
// 233. 14 엔트리 등록 + kind act2 + order 21~34 연속 + branch 필드.
var a2entries = A2_ALL.map(function (id) { return byId[id]; });
var orders = a2entries.map(function (e) { return e && e.order; });
var orderOk = true; for (var oi = 0; oi < orders.length; oi++) if (orders[oi] !== 21 + oi) orderOk = false;
ok('233. 14 act2 엔트리 등록 · kind act2 · order 21~34 연속 · branch 부착',
  a2entries.every(function (e) { return e && e.kind === 'act2' && e.branch; }) && orderOk);
// 234. 전 14 미션 global/module 해석 + id 일치 + dialogue/combat/rewards.
var a2ResolveOk = A2_ALL.every(function (id) {
  var m = CAMP.missionData(id); var e = byId[id];
  return m && m.id === id && m.dialogue && m.combat && m.rewards && typeof window === 'undefined' && e.global && e.module;
});
ok('234. 14 미션 missionData 해석 + id 일치 + 필수 섹션 + global/module 메타', a2ResolveOk);
// 235. 갈래 A 엔딩 게이트 + 2nd 미션 체인.
var A1 = byId['a2-a1-crown-breach'], A2e = byId['a2-a2-crown-throne'];
ok('235. 갈래 A: a1 = ch08+corporate-eternal · a2 = +a1 체인(missionsDone)',
  A1.unlock.missionsDone.indexOf('ch08-zero-day') >= 0 && A1.unlock.endingSeen[0] === 'corporate-eternal' &&
  A2e.unlock.missionsDone.indexOf('a2-a1-crown-breach') >= 0 && A2e.unlock.endingSeen[0] === 'corporate-eternal');
// 236. 갈래 B/C/D 엔딩 게이트 + 2nd 체인 정합.
var BR = { 'a2-b2-freeport': ['street-rising', 'a2-b1-barricade'],
  'a2-c2-signal-war': ['nexus-reborn', 'a2-c1-first-contact'], 'a2-d2-last-signal': ['dead-nexus', 'a2-d1-scavenge'] };
var brChainOk = Object.keys(BR).every(function (id) {
  var e = byId[id]; return e.unlock.endingSeen[0] === BR[id][0] && e.unlock.missionsDone.indexOf(BR[id][1]) >= 0; });
ok('236. 갈래 B/C/D: 엔딩(street-rising/nexus-reborn/dead-nexus) 게이트 + 2nd 미션 체인', brChainOk);
// 237. 클래스 사이드 6 classKey 게이트 정합 ([65차] BROKER/DRIFTER 포함).
var CLSMAP = { 'a2-side-cipher-static': 'CIPHER', 'a2-side-blade-vendetta': 'BLADE',
  'a2-side-rigger-build': 'RIGGER', 'a2-side-mole-whoami': 'MOLE',
  'a2-side-broker-ledger': 'BROKER', 'a2-side-drifter-lastroad': 'DRIFTER' };
ok('237. 클래스 사이드 6 = classKey 게이트(CIPHER/BLADE/RIGGER/MOLE/BROKER/DRIFTER) + ch08 완주',
  Object.keys(CLSMAP).every(function (id) { var e = byId[id];
    return e.unlock.classKey === CLSMAP[id] && e.unlock.missionsDone.indexOf('ch08-zero-day') >= 0; }));
// 238. endingSeen 게이트: corporate-eternal 열람 → A갈래 개방 · B/C/D 잠김.
var seenA = { missionsDone: ['ch08-zero-day'], flags: {}, endings: { seen: { 'corporate-eternal': 1 } }, character: { classKey: 'BLADE' } };
ok('238. corporate-eternal 열람 → A갈래(a1) 해금 · B/C/D 1st 미션 잠김',
  CAMP.isUnlocked(A1, seenA) === true && CAMP.isUnlocked(byId['a2-b1-barricade'], seenA) === false &&
  CAMP.isUnlocked(byId['a2-c1-first-contact'], seenA) === false && CAMP.isUnlocked(byId['a2-d1-scavenge'], seenA) === false);
// 239. NG+ 누적: 4엔딩 전부 열람 → 갈래 8 전부 해금(2nd 미션은 선행 클리어 시).
var allSeen = { missionsDone: ['ch08-zero-day', 'a2-a1-crown-breach', 'a2-b1-barricade', 'a2-c1-first-contact', 'a2-d1-scavenge'],
  flags: {}, endings: { seen: ALL_ENDINGS }, character: { classKey: 'BLADE' } };
ok('239. 4엔딩 전부 열람 + 1st 갈래 클리어 → 갈래 메인 8 전부 해금(회차 완성)',
  A2_MAIN.every(function (id) { return CAMP.isUnlocked(byId[id], allSeen); }));
// 240. classKey 전환: BLADE 편성 → blade 사이드만 해금 · 타 클래스 사이드 잠김.
var bladeSave = { missionsDone: ['ch08-zero-day'], flags: {}, endings: { seen: {} }, character: { classKey: 'BLADE' } };
ok('240. BLADE 편성 → blade 사이드 해금 · cipher/rigger/mole/broker/drifter 사이드 잠김(classKey 게이트)',
  CAMP.isUnlocked(byId['a2-side-blade-vendetta'], bladeSave) === true &&
  CAMP.isUnlocked(byId['a2-side-cipher-static'], bladeSave) === false &&
  CAMP.isUnlocked(byId['a2-side-rigger-build'], bladeSave) === false &&
  CAMP.isUnlocked(byId['a2-side-mole-whoami'], bladeSave) === false &&
  CAMP.isUnlocked(byId['a2-side-broker-ledger'], bladeSave) === false &&
  CAMP.isUnlocked(byId['a2-side-drifter-lastroad'], bladeSave) === false);
// 241. 해금 그래프 순환 0 (29 레지스트리 · act2 체인 포함) — test80 재확인 + act2 선행 실존.
var a2ChainOk = A2_MAIN.concat(A2_CLASS).every(function (id) {
  return (byId[id].unlock.missionsDone || []).every(function (p) { return byId[p]; }); });
ok('241. act2 해금 선행(missionsDone) 전부 실존 + 그래프 순환 0(전 29)', a2ChainOk && !cyc && prereqMissing.length === 0);
// 242. boardState.act2 branch 분류 = framing 1 · A/B/C/D 각 2 · class 6 ([65차] BROKER/DRIFTER 사이드 추가).
var brCount = {}; CAMP.boardState(yesCh8).act2.forEach(function (r) { brCount[r.branch] = (brCount[r.branch] || 0) + 1; });
ok('242. boardState act2 branch = framing1 · A2·B2·C2·D2 · class6',
  brCount.framing === 1 && brCount.A === 2 && brCount.B === 2 && brCount.C === 2 && brCount.D === 2 && brCount['class'] === 6);

console.log('\n== [62차 §3.1] 하네스 encounters 순회 — 2연전 enc①+enc② 측정 ==');
// 243. encountersOf: 2연전 8미션 = 2행(enc①+stage2) · 단일 미션 = 1행.
var enc2Missions = A2_MAIN.filter(function (id) { var m = CAMP.missionData(id); return m.encounters && m.encounters.stage2; });
var singleClass = A2_CLASS.every(function (id) { return BAL.encountersOf(byId[id]).length === 1; });
ok('243. encountersOf: 갈래 메인 8 = 2연전(enc①+stage2) · 클래스 사이드 6 = 단일 전투',
  enc2Missions.length === 8 && A2_MAIN.every(function (id) { return BAL.encountersOf(byId[id]).length === 2; }) && singleClass);
// 244. runEncounter encKey='stage2' = mission.encounters.stage2 소비(enc② 측정) · 미지정 = enc①.
var rEnc1 = BAL.runEncounter('BLADE', 'a2-a1-crown-breach', 'objective', 'base', null);
var rEnc2 = BAL.runEncounter('BLADE', 'a2-a1-crown-breach', 'objective', 'base', 'stage2');
ok('244. runEncounter encKey 분기: enc①·enc② 개별 측정(둘 다 클리어 · 서로 다른 인카운터)',
  rEnc1.win === true && rEnc2.win === true && !rEnc1.error && !rEnc2.error);
// 245. 2연전 enc② stage2 = objective(threshold>0) + enemies(≥1) 유효 · 로스터 존재.
var s2ok = A2_MAIN.every(function (id) {
  var s2 = CAMP.missionData(id).encounters.stage2;
  return s2 && s2.objective && s2.objective.threshold > 0 && (s2.enemies || []).length >= 1 &&
    s2.enemies.every(function (en) { return EN.ENEMIES[en.key]; }); });
ok('245. 2연전 enc②(stage2) objective/enemies 유효 + 로스터 존재(8미션)', s2ok);
// 246. interlude 라우팅: 2연전 대화에 startCombat.encounter='stage2' 배선 존재.
var interludeOk = A2_MAIN.every(function (id) {
  var nodes = CAMP.missionData(id).dialogue.nodes; var found = false;
  Object.keys(nodes).forEach(function (nk) { (nodes[nk].choices || []).forEach(function (ch2) {
    if (ch2.effect && ch2.effect.startCombat && ch2.effect.startCombat.encounter === 'stage2') found = true; }); });
  return found; });
ok('246. 2연전 interlude 노드 startCombat.encounter="stage2" 배선(enc② 라우팅)', interludeOk);

console.log('\n== [62차→65차] Act2 본편 밸런스 — 전 조합 클리어 + 보정 핀 ==');
// 247. 갈래 메인 8(enc①+enc②) + 클래스 사이드 6 전 조합 클리어 가능(clearFail 0) — 6클래스.
var a2Rows = mrx.filter(function (r) { return (r.baseId ? A2_ALL.indexOf(r.baseId) : A2_ALL.indexOf(r.id)) >= 0; });
var a2Clear = 0, a2Total = 0, a2Fail = 0;
a2Rows.forEach(function (r) { BAL.CLASSES.forEach(function (cl) {
  var vd = BAL.verdict(r.cells[cl]); a2Total++; if (vd.clearable) a2Clear++; if (vd.flags.indexOf('clearFail') >= 0) a2Fail++; }); });
ok('247. Act2 본편 전 조합 클리어 가능 (' + a2Clear + '/' + a2Total + ' · clearFail 0 · (enc①+enc②)×6클래스)',
  a2Clear === a2Total && a2Fail === 0 && a2Total === (8 * 2 + 6) * 6);
// 248. 밸런스 보정 핀(62차→65차 회귀 가드) — enc② 보스 threshold. [65차] BROKER(hack2) 은신 3턴
//   창 내 완주를 위해 a2-a1/a2-b2 eff 10→8 · a2-c2 eff 14→12 하향(a2-a2/a2-d2 는 10 유지).
function encThr(id, key) { var s = CAMP.missionData(id).encounters[key]; return s.objective.threshold + (s.objective.veil || 0); }
ok('248. 보정 핀: a2-a2/a2-d2 stage2 eff=10 · a2-a1/a2-b2 stage2 eff=8 · a2-c2 stage2 eff=12',
  encThr('a2-a2-crown-throne', 'stage2') === 10 && encThr('a2-d2-last-signal', 'stage2') === 10 &&
  encThr('a2-a1-crown-breach', 'stage2') === 8 && encThr('a2-b2-freeport', 'stage2') === 8 &&
  encThr('a2-c2-signal-war', 'stage2') === 12);
// 248b. [65차] 신규 보정 핀 — 클래스 사이드/최난도 사이드: vendetta thr 8 · broker-ledger thr 9 ·
//   side-07 eff 10(51차 유지) + 이동 차단 엄폐 재배치(접근 레인 개방 — 상세는 각 미션 파일 주석).
ok('248b. 65차 보정 핀: vendetta 8 · broker-ledger 9 · side-07 eff 10',
  CAMP.missionData('a2-side-blade-vendetta').combat.objective.threshold === 8 &&
  CAMP.missionData('a2-side-broker-ledger').combat.objective.threshold === 9 &&
  (function () { var o = CAMP.missionData('side-07-server-zero').combat.objective; return o.threshold + (o.veil || 0) === 10; })());
// 249. act2 보상 스키마 = rep/karma/nuyen(applyRewards 계약) 존재.
ok('249. 14 act2 미션 보상 스키마 = rep/karma/nuyen 수치 존재',
  A2_ALL.every(function (id) { var r = CAMP.missionData(id).rewards;
    return typeof r.rep === 'number' && typeof r.karma === 'number' && typeof r.nuyen === 'number'; }));
// 250. 구조 계약: 클래스 사이드 = 단일 전투(encounters 없음) · 갈래 메인 = 2연전(encounters.stage2).
ok('250. 구조: 클래스 사이드 6 = 단일 전투(encounters 미보유) · 갈래 메인 8 = encounters.stage2 보유',
  A2_CLASS.every(function (id) { return !CAMP.missionData(id).encounters; }) &&
  A2_MAIN.every(function (id) { return !!CAMP.missionData(id).encounters.stage2; }));

console.log('\n== [v6.44 · 과제 A1] 캡스톤 MERIDIAN FLAGSHIP + 심연 프로토콜 ==');
var ABX = require('./systems/abyss.js');
var CAP_ID = 'a2-99-flagship';
var CAP_FINALS = ['a2-a2-crown-throne', 'a2-b2-freeport', 'a2-c2-signal-war', 'a2-d2-last-signal'];
// 251. 캡스톤 해금 AND 게이트 — 4갈래 종결 미션 전부 완료 시 개방, 하나라도 없으면 잠김.
var capEntry = CAMP.missionById(CAP_ID);
var saveAll = S.newSave(); saveAll.missionsDone = CAP_FINALS.slice();
var save3 = S.newSave(); save3.missionsDone = CAP_FINALS.slice(0, 3);
ok('251. 캡스톤 해금: 4갈래 종결 전부 완료 → unlocked · 3개만 → locked (AND 게이트)',
  CAMP.isUnlocked(capEntry, saveAll) === true && CAMP.isUnlocked(capEntry, save3) === false);
// 252. 캡스톤 미션 데이터 = 3연전(combat=enc① · encounters.stage2/stage3) 구조.
var capM = CAMP.missionData(CAP_ID);
ok('252. 캡스톤 3연전 구조: combat(enc①) + encounters.stage2 + encounters.stage3',
  !!capM.combat && !!(capM.encounters && capM.encounters.stage2 && capM.encounters.stage3) && capM.capstone === true);
// 253. 3연전 라우팅 체인 — bridge1 이 stage2, bridge2 가 stage3 를 startCombat.encounter 로 배선.
function encEdge(nodes, encKey) { var f = false;
  Object.keys(nodes).forEach(function (nk) { (nodes[nk].choices || []).forEach(function (c2) {
    if (c2.effect && c2.effect.startCombat && c2.effect.startCombat.encounter === encKey) f = true; }); }); return f; }
ok('253. 3연전 라우팅: interlude 노드가 startCombat.encounter="stage2" · "stage3" 배선(체인)',
  encEdge(capM.dialogue.nodes, 'stage2') && encEdge(capM.dialogue.nodes, 'stage3'));
// 254. settle → capstoneEpilogue 종결 라우팅(4엔딩 epilogue 와 별개 종결 효과).
var settleCap = false;
(capM.dialogue.nodes.settle.choices || []).forEach(function (c2) { if (c2.effect && c2.effect.capstoneEpilogue) settleCap = true; });
ok('254. settle 노드에 effect.capstoneEpilogue 종결 라우팅 존재', settleCap);
// 255. OVERLORD 스키마 — WARLORD 상위(HP/ATK/DEF/HACK 전부 ≥) + GRID 축 + advance AI + 로스터 등록.
var OVL = EN.ENEMIES.MERIDIAN_OVERLORD, WLD = EN.ENEMIES.MERIDIAN_WARLORD;
ok('255. MERIDIAN_OVERLORD 스키마: WARLORD 상위(HP30>24·ATK7>6·DEF5>4·HACK4>2) · GRID · advance',
  OVL && OVL.hp === 30 && OVL.hp > WLD.hp && OVL.atk === 7 && OVL.atk > WLD.atk &&
  OVL.def === 5 && OVL.def > WLD.def && OVL.hack === 4 && OVL.hack > WLD.hack &&
  OVL.attr === 'GRID' && OVL.ai === 'advance' && OVL.bloc === 'MERIDIAN');
// 256. enc③ 결전에 OVERLORD 배치 + spawnEnemy scale 반영(스케일 배율로 hp/atk ceil 상승).
var capCh = CH.makeCharacter('CIPHER');
var enc3 = capM.encounters.stage3;
ok('256. enc③(stage3) 에 MERIDIAN_OVERLORD 배치 존재',
  (enc3.enemies || []).some(function (e) { return e.key === 'MERIDIAN_OVERLORD'; }));
// 257. 캡스톤 3연전 6클래스 전 조합 클리어 가능(clearFail 0) — enc①+stage2+stage3. [65차] 6클래스.
var capRows = mrx.filter(function (r) { return r.baseId === CAP_ID; });
var capClear = 0, capTot = 0, capFail = 0;
capRows.forEach(function (r) { BAL.CLASSES.forEach(function (cl) {
  var vd = BAL.verdict(r.cells[cl]); capTot++; if (vd.clearable) capClear++; if (vd.flags.indexOf('clearFail') >= 0) capFail++; }); });
ok('257. 캡스톤 3연전 전 조합 클리어 가능 (' + capClear + '/' + capTot + ' · clearFail 0 · 3인카운터×6클래스)',
  capClear === capTot && capFail === 0 && capTot === 3 * 6);

console.log('\n== [v6.44] 심연 프로토콜 — 웨이브 결정론 ==');
// 258. 웨이브 스케일 결정론식 1+0.05N (N=1→1.05 · N=10→1.5 · N=20→2.0).
ok('258. waveScale(N)=1+0.05N 결정론: N1=1.05 · N10=1.5 · N20=2.0',
  ABX.waveScale(1) === 1.05 && ABX.waveScale(10) === 1.5 && ABX.waveScale(20) === 2.0);
// 259. 풀 순환 선택 결정론 — poolIndex(N) 이 POOL.length 주기(N 과 N+len 동일).
var PL = ABX.POOL.length;
ok('259. 웨이브 풀 순환 결정론: poolIndex(1)===poolIndex(1+len) · 같은 N 동일 결과',
  ABX.poolIndex(1) === ABX.poolIndex(1 + PL) && ABX.poolIndex(3) === ABX.poolIndex(3 + PL) &&
  JSON.stringify(ABX.wavePlan(7)) === JSON.stringify(ABX.wavePlan(7)));
// 260. 웨이브 인카운터 해석 — 전 풀 항목이 실 인카운터 config(objective+enemies) 로 해석됨.
var waveEncOk = true;
for (var wv = 1; wv <= PL; wv++) { var cfg = ABX.waveEncounter(wv);
  if (!cfg || !cfg.objective || !(cfg.enemies || []).length) waveEncOk = false; }
ok('260. 웨이브 1..len 전부 유효 인카운터 해석(objective+enemies)', waveEncOk);
// 261. buildAbyssCombat 이 스케일 반영 — 같은 무대(N 과 N+len)에서 고 웨이브 적 HP ≥ 저 웨이브.
var cLow = S.buildAbyssCombat(capCh, 1);
var cHigh = S.buildAbyssCombat(capCh, 1 + PL); // 같은 풀 항목, 스케일만 상승
function firstEnemyHp(c) { var e = c.units.filter(function (u) { return u.side === 'enemy'; })[0]; return e ? e.maxHp : 0; }
ok('261. buildAbyssCombat 스케일 반영: 웨이브 ' + (1 + PL) + ' 적 HP ≥ 웨이브 1 (같은 무대·배율만 상승)',
  cLow && cHigh && cLow.abyss.wave === 1 && cHigh.abyss.wave === (1 + PL) && firstEnemyHp(cHigh) >= firstEnemyHp(cLow));
// 262. 심연 전투 = combat.abyss 표식 + onWin 미션 라우팅 미사용(웨이브 경로 분기 대상).
ok('262. 심연 전투 combat.abyss={wave,label,scale} 표식 + 결정론 재현(같은 N 동일 유닛수)',
  cLow.abyss && typeof cLow.abyss.wave === 'number' && typeof cLow.abyss.scale === 'number' &&
  S.buildAbyssCombat(capCh, 1).units.length === cLow.units.length);
// 263. 심연 승리 → 최고 웨이브 기록 갱신 + 다음 웨이브 전투 배선(씬 유지·페널티 경로 아님).
var stAb = S.rpgInitialState();
stAb.save.endings = END.recordCapstone(stAb.save.endings, 'CIPHER'); // 캡스톤 해금
var stW1 = S.rpgReducer(stAb, { type: 'ABYSS_START' });
stW1.combat.outcome = 'win'; // 강제 승리 후 resolve
var stW2 = S.rpgReducer(stW1, { type: 'COMBAT_RESOLVE' });
ok('263. 심연 승리: best=1 기록 + 웨이브2 전투 배선(scene combat 유지)',
  stW1.combat.abyss.wave === 1 && stW2.save.abyss.best === 1 &&
  stW2.scene === 'combat' && stW2.combat.abyss.wave === 2);
// 264. 심연 패배 → 허브 귀환 · 페널티 없음(best 불변) · missionsDone/karma 무변동.
var stLoseSrc = S.rpgReducer(stW2, { type: 'COMBAT_RESOLVE' }); // wave2 상태에서
var stLose = clone264(stW2); stLose.combat.outcome = 'lose';
function clone264(o) { return JSON.parse(JSON.stringify(o)); }
var stHub = S.rpgReducer(stLose, { type: 'COMBAT_RESOLVE' });
ok('264. 심연 패배: 허브 귀환 · best 불변(1) · 페널티 없음(missionsDone 무변동)',
  stHub.scene === 'hub' && stHub.save.abyss.best === 1 &&
  (stHub.save.missionsDone || []).length === (stLose.save.missionsDone || []).length);
// 265. 캡스톤 클리어 후 해금 게이트 — endings.capstone>0 이어야 ABYSS_START 개시(그 전엔 차단).
var stNoCap = S.rpgReducer(S.rpgInitialState(), { type: 'ABYSS_START' });
ok('265. 심연 게이트: 캡스톤 미클리어(capstone=0) → ABYSS_START 차단(scene 유지)',
  stNoCap.scene !== 'combat' && !!stNoCap.banner);
// 266. capstoneEpilogue 라우팅 — settle 선택 시 endings.capstone 증가 + 에필로그 씬(4엔딩 seen 무변동).
var stSettle = S.rpgInitialState();
stSettle.save.character.classKey = 'BLADE';
var seenBefore = JSON.stringify(END.migrateEndings(stSettle.save.endings).seen);
var epi = S.dialogueChoose({ scene: 'dialogue', save: stSettle.save,
  dialogue: { missionId: CAP_ID, nodeId: 'settle' }, combat: null, hub: { node: 'root' } }, 0);
ok('266. capstoneEpilogue: 에필로그 씬 전환 + endings.capstone 증가 + 4엔딩 seen 무변동',
  epi.scene === 'epilogue' && epi.epilogue && epi.epilogue.capstone === true &&
  END.migrateEndings(epi.save.endings).capstone === 1 &&
  JSON.stringify(END.migrateEndings(epi.save.endings).seen) === seenBefore);
// 267. 캡스톤 기록 NG+ 영속 + 최고 웨이브 기록 영속(migrateEndings 백필 · newGamePlus 이월).
var stNgSrc = S.rpgInitialState();
stNgSrc.save.endings = END.recordCapstone(stNgSrc.save.endings, 'MOLE');
stNgSrc.save.abyss = { best: 7 };
stNgSrc.save.missionsDone = ['ch01-first-blood'];
var stNg = S.rpgReducer(stNgSrc, { type: 'NEW_GAME_PLUS' });
ok('267. NG+ 영속: endings.capstone(1)·capstoneByClass(MOLE)·abyss.best(7) 이월 · 진행 리셋',
  END.migrateEndings(stNg.save.endings).capstone === 1 &&
  END.migrateEndings(stNg.save.endings).capstoneByClass.MOLE === true &&
  stNg.save.abyss.best === 7 && (stNg.save.missionsDone || []).length === 0);
// 268. save.migrate 백필(멱등) — 구세이브(endings.capstone·abyss 없음) → 기본값 백필.
var legacy = { version: 1, character: CH.makeCharacter('CIPHER'), missionsDone: [], flags: {},
  endings: { seen: {}, byClass: {}, runs: 2 } };
var mig = SAVE.migrate(JSON.parse(JSON.stringify(legacy)));
var mig2 = SAVE.migrate(mig); // 멱등 재적용
ok('268. save.migrate 백필: endings.capstone=0 · capstoneByClass={} · abyss.best=0 (멱등)',
  mig.endings.capstone === 0 && typeof mig.endings.capstoneByClass === 'object' &&
  mig.abyss.best === 0 && JSON.stringify(mig) === JSON.stringify(mig2));
// 269. capstoneRecall 회고 — 4갈래 종결 flag 반영(지난 선택), 미설정 갈래는 스킵.
var recall = END.capstoneRecall({ throneChoice: 'reveal', flagshipDown: false, signalWarCleared: true, harvesterChoice: 'destroy' });
ok('269. capstoneRecall: 설정된 갈래(A reveal·C·D destroy)만 회고, 미설정 갈래(B) 스킵',
  recall.length === 3 && recall.some(function (r) { return r.br === 'A'; }) &&
  recall.some(function (r) { return r.br === 'C'; }) && recall.some(function (r) { return r.br === 'D'; }) &&
  !recall.some(function (r) { return r.br === 'B'; }));
// 270. 캡스톤 미션 = 순수 데이터(DOM 참조 0) · window 전역 등록 형태(계약 준수).
var capSrc = require('fs').readFileSync(require('path').join(__dirname, 'data/missions/a2-99-flagship.js'), 'utf8');
ok('270. 캡스톤 미션 순수성: document 참조 0 · window.RPG_MISSION_A2_99_FLAGSHIP 등록',
  capSrc.indexOf('document') < 0 && capSrc.indexOf('window.RPG_MISSION_A2_99_FLAGSHIP') >= 0);

// ============================================================================
// ==========  65차 — BROKER + DRIFTER 로스터 확장 (6클래스 전량 플레이어블)  ====
//   BROKER 협상·중개 킷(BLACKMAIL/POKER FACE/INFO BROKER/BURN THE BRIDGE) ·
//   DRIFTER 기동·보급 킷(RAM CHARGE/AMBUSH/RAMPAGE/GHOST RUN) ·
//   미해금→해금 선택 경로 · 클래스별 해금 시그니처(OLD DEBTS/OLD ROUTES).
// ============================================================================

console.log('\n== BROKER 협상·중개 로스터 [계승 docs/07 §2 6/2/2/5/2 · cards/ghost/broker.md] ==');
var broker = CH.makeCharacter('BROKER');
var brEff = CH.effectiveStats(broker);
ok('271. BROKER 스탯 6/2/2/5/2 → 유효HP12·ATK2·DEF2·MOV4(SPD5)·HACK2 [계승 §10/§3.1]',
  brEff.maxHp === 12 && brEff.atk === 2 && brEff.def === 2 && brEff.mov === 4 && brEff.hack === 2);
eq('272. BROKER 킷 = BLACKMAIL/POKER FACE/INFO BROKER/BURN THE BRIDGE', broker.kit, AB.BROKER_KIT);
ok('273. BROKER signalFavor=iron (🔴DOWN 정렬) · 최고 SPD → [SPD 5] 게이트 통과(전용) [회피 정체성]',
  broker.signalFavor === 'iron' &&
  DLG.evalGate({ attr: 'spd', min: 5 }, S.dialogueCtx({ save: { character: broker, flags: {} } })).ok === true &&
  DLG.evalGate({ attr: 'spd', min: 5 }, S.dialogueCtx({ save: { character: CH.makeCharacter('DRIFTER'), flags: {} } })).ok === false);
// BLACKMAIL 무소음 원격 기본공격 = HACK 사용 · threat.noise 미가산(loud:false).
var bkm = S.buildCombat(MI.MISSION, broker, 'outro');
var bkmP = S.player(bkm); var bkmTgt = bkm.units.filter(function (u) { return u.side === 'enemy' && u.ai !== 'static'; })[0];
bkmP.x = bkmTgt.x; bkmP.y = bkmTgt.y + 1;   // 인접(사거리 4 내)
bkm.signal = SIG.STATES.DOWN;               // 결정론(HACK 미보정 축)
var bkmNoise0 = bkm.threat.noise || 0;
var afterBkm = S.applyAttack(bkm, bkmTgt.id, 'BLACKMAIL');
var bkmHit = S.findUnit(afterBkm, bkmTgt.id);
ok('274. BLACKMAIL: HACK 축 원격 피해 + 무소음(threat.noise 미가산) [각색 broker.md Card03]',
  bkmHit.hp < bkmTgt.hp && (afterBkm.threat.noise || 0) === bkmNoise0);
// POKER FACE 디버프: DEF−2 & 엄폐 무효(coverNull) — 무소음.
var pkf = S.buildCombat(MI.MISSION, broker, 'outro');
var pkfP = S.player(pkf); var pkfTgt = pkf.units.filter(function (u) { return u.side === 'enemy' && u.ai !== 'static'; })[0];
pkfP.x = pkfTgt.x; pkfP.y = pkfTgt.y + 1;
var afterPkf = S.applyAttack(pkf, pkfTgt.id, 'POKER_FACE');
var pkfHit = S.findUnit(afterPkf, pkfTgt.id);
ok('275. POKER FACE → 대상 DEF−2 & 엄폐 무효 2턴 [각색 broker.md Card08]',
  pkfHit.status.defDown === 2 && pkfHit.status.coverNull === true && pkfHit.status.debuffTurns === 2);
// BURN THE BRIDGE 궁극: 3턴 은신 + 재등장 크리 ×2 — [65차 밸런스] 은신 3턴 핀(ZERO TRACE 2턴 대비 +1).
var btb = S.buildCombat(MI.MISSION, broker, 'outro');
var afterBtb = S.applyAttack(btb, null, 'BURN_THE_BRIDGE');
var btbP = S.player(afterBtb);
ok('276. BURN THE BRIDGE 궁극 → 3턴 은신 + 크리 ×2 & 1회 소진 [65차 밸런스 핀 · broker.md Card09 LOSS]',
  btbP.status.stealth === true && btbP.status.stealthTurns === 3 && btbP.status.nextCrit === 2 && btbP.ultUsed === true &&
  AB.ABILITIES.BURN_THE_BRIDGE.applyStatus.turns === 3);

console.log('\n== DRIFTER 기동·보급 로스터 [계승 docs/07 §2 9/4/2/4/1 · cards/ghost/drifter.md] ==');
var drifter = CH.makeCharacter('DRIFTER');
var drEff = CH.effectiveStats(drifter);
ok('277. DRIFTER 스탯 9/4/2/4/1 → 유효HP18·ATK4·DEF2·MOV4·HACK1 [계승 §10/§3.1]',
  drEff.maxHp === 18 && drEff.atk === 4 && drEff.def === 2 && drEff.mov === 4 && drEff.hack === 1);
eq('278. DRIFTER 킷 = RAM CHARGE/AMBUSH/RAMPAGE/GHOST RUN', drifter.kit, AB.DRIFTER_KIT);
// RAM CHARGE 근접 기본공격 = ATK 사용(사거리 1).
var ram = S.buildCombat(MI.MISSION, drifter, 'outro');
var ramP = S.player(ram); var ramTgt = ram.units.filter(function (u) { return u.side === 'enemy' && u.ai !== 'static'; })[0];
ramP.x = ramTgt.x; ramP.y = ramTgt.y + 1;   // 인접(근접 사거리 1)
ram.signal = SIG.STATES.UP;                 // 결정론(iron favor 미보정 축)
var afterRam = S.applyAttack(ram, ramTgt.id, 'RAM_CHARGE');
var ramHit = S.findUnit(afterRam, ramTgt.id);
ok('279. RAM CHARGE: ATK 축 근접 피해(사거리 1) [각색 drifter.md Card08]', ramHit.hp < ramTgt.hp);
// GHOST RUN 궁극: 2턴 무적 + 재등장 크리 ×3 (LAST STAND 스키마 재사용 — 추적불가 질주).
var gr = S.buildCombat(MI.MISSION, drifter, 'outro');
var afterGr = S.applyAttack(gr, null, 'GHOST_RUN');
var grP = S.player(afterGr);
ok('280. GHOST RUN 궁극 → 2턴 무적 + 크리 ×3 & 1회 소진 [각색 drifter.md Card09 LOSS]',
  grP.status.invuln === true && grP.status.invulnTurns === 2 && grP.status.nextCrit === 3 && grP.ultUsed === true);

console.log('\n== 6클래스 선택 경로 + 해금 시그니처 [65차] ==');
// 미해금→해금 선택 경로: DRIFTER 편성 → 기동 킷 · 클래스 사이드 게이트 연동.
var toDrifter = S.selectClass(S.rpgInitialState(), 'DRIFTER');
ok('281. 로스터에서 DRIFTER 편성 → classKey=DRIFTER & 기동 킷(RAM_CHARGE)',
  toDrifter.save.character.classKey === 'DRIFTER' && toDrifter.save.character.kit.indexOf('RAM_CHARGE') >= 0);
// 클래스별 보상 해금 시그니처 일반화 — BROKER=OLD_DEBTS · DRIFTER=OLD_ROUTES (objectiveBonus PASSIVE).
var brkSave = S.newSave(); brkSave.character = CH.makeCharacter('BROKER');
var brkRew = CAMP.applyRewards(brkSave, MI.MISSION);
var drfSave = S.newSave(); drfSave.character = CH.makeCharacter('DRIFTER');
var drfRew = CAMP.applyRewards(drfSave, MI.MISSION);
ok('282. 귀환 정산 해금: BROKER→OLD DEBTS · DRIFTER→OLD ROUTES (BACKDOOR 치환 · objectiveBonus+1)',
  brkRew.character.kit.indexOf('OLD_DEBTS') >= 0 && brkRew.character.kit.indexOf('BACKDOOR') < 0 &&
  drfRew.character.kit.indexOf('OLD_ROUTES') >= 0 && drfRew.character.kit.indexOf('BACKDOOR') < 0 &&
  AB.ABILITIES.OLD_DEBTS.objectiveBonus === 1 && AB.ABILITIES.OLD_ROUTES.objectiveBonus === 1);
// 클래스 사이드 해금 경로: BROKER 편성 시 broker-ledger 만 · DRIFTER 편성 시 drifter-lastroad 만.
var brkSideSave = { missionsDone: ['ch08-zero-day'], flags: {}, endings: { seen: {} }, character: { classKey: 'BROKER' } };
var drfSideSave = { missionsDone: ['ch08-zero-day'], flags: {}, endings: { seen: {} }, character: { classKey: 'DRIFTER' } };
ok('283. BROKER 편성 → broker-ledger 해금·drifter-lastroad 잠김 (DRIFTER 편성 시 반대)',
  CAMP.isUnlocked(byId['a2-side-broker-ledger'], brkSideSave) === true &&
  CAMP.isUnlocked(byId['a2-side-drifter-lastroad'], brkSideSave) === false &&
  CAMP.isUnlocked(byId['a2-side-drifter-lastroad'], drfSideSave) === true &&
  CAMP.isUnlocked(byId['a2-side-broker-ledger'], drfSideSave) === false);

// ============================================================================
// ======  67차 — MOLE HELIX 태그 (사문 게이트 해소) + 하드모드 계기판 핀  ======
//   ① MOLE.tags 에 HELIX 추가 → a2-side-mole-whoami [HELIX] 지름길이 소유 클래스에게
//      실제 개방(67차 이전 = 어떤 클래스도 통과 불가한 도달 불가 게이트).
//      원전 = mole.md Card01 COVER IDENTITY ▼BOTTOM(위장신분 다중 보유) + ECHO=검체 E-7
//      (HELIX Dr. ELIA VOSS 설계) — 위장이 아니라 원본 소속 기록.
//   ② 태그 게이트 전수 도달성 핀 — 블록 태그축은 전량 도달 가능, 속성명 태그축 2건은
//      알려진 미도달(범위 밖)로 정직 고정. 신규 사문 게이트 유입 시 즉시 실패.
//   ③ 하드모드(scale 1.25) 실패 집합 핀 — ★게이트가 아니라 계기판(회귀 감지) 핀.
//      base 불변식(clearFail 0) 은 게이트지만, hard 는 clearFail 0 미달성 상태를
//      '하드모드 한계'로 정직 고정한다(개선/악화 양방향 회귀 즉시 노출).
// ============================================================================

console.log('\n== [67차] MOLE HELIX 태그 — 원전 정합 · 사문 게이트 해소 ==');
// MOLE.tags = 5대 블록(VANTA/IRONWALL/HELIX/AXIOM/CARBON) 중 4종. CARBON 만 미보유(태그 게이트 0건).
ok('284. MOLE.tags = [VANTA,IRONWALL,HELIX,AXIOM] (67차 HELIX 추가) · 타 5클래스는 tags 없음',
  JSON.stringify(CL.CLASSES.MOLE.tags) === '["VANTA","IRONWALL","HELIX","AXIOM"]' &&
  ['CIPHER', 'BLADE', 'RIGGER', 'BROKER', 'DRIFTER'].every(function (k) { return !CL.CLASSES[k].tags; }) &&
  CH.makeCharacter('MOLE').tags.indexOf('HELIX') >= 0);

// 사문 게이트 해소 — mole-whoami [HELIX] 가 소유 클래스(MOLE) 에서 available.
var mwMission = CAMP.missionData('a2-side-mole-whoami');
var mwHelix = mwMission.dialogue.nodes.approach.choices[2];
var mwMole = S.selectClass(S.rpgInitialState(), 'MOLE');
mwMole.save.missionsDone = ['ch08-zero-day'];
mwMole = S.startMission(mwMole, 'a2-side-mole-whoami');
var mwCtx = S.dialogueCtx(mwMole);
ok('285. a2-side-mole-whoami [HELIX 태그] 게이트 = 소유 클래스 MOLE 에서 available (67차 이전 도달불가)',
  JSON.stringify(mwHelix.gate) === '{"tag":"HELIX"}' &&
  DLG.evalGate(mwHelix.gate, mwCtx).ok === true && DLG.choiceState(mwHelix, mwCtx) === 'available' &&
  DLG.choiceState(mwMission.dialogue.nodes.approach.choices[1], mwCtx) === 'gray');   // [SPD 4] 는 성장 게이트로 잔존

// 지름길 완주 경로 — 전투 스킵 → outroGhost → settle 보상(무력 경로와 동일 계약).
var mwRun = S.dialogueChoose(mwMole, 0);          // intro → approach
mwRun = S.dialogueChoose(mwRun, 2);               // [HELIX] → skipCombat → outroGhost
var mwGhostNode = mwRun.dialogue.nodeId, mwNoCombat = mwRun.combat === null;
mwRun = S.dialogueChoose(mwRun, 0);               // outroGhost → choice
mwRun = S.dialogueChoose(mwRun, 0);               // choice A → settle (applyRewards)
ok('286. HELIX 지름길 완주: 전투 미발생 → outroGhost · helixForged/ghostedIdentity/whoAmIDone · 보상 동일(rep5·karma2)',
  mwGhostNode === 'outroGhost' && mwNoCombat === true &&
  mwRun.save.flags.helixForged === true && mwRun.save.flags.ghostedIdentity === true &&
  mwRun.save.flags.whoAmIDone === true &&
  mwRun.save.missionsDone.indexOf('a2-side-mole-whoami') >= 0 &&
  mwMission.rewards.rep === 5 && mwMission.rewards.karma === 2 &&
  mwMission.rewards.unlocks.indexOf('WHO AM I') >= 0);

// 태그 게이트 전수 도달성 — 미션 데이터의 모든 { tag } 게이트를 6클래스 기본 빌드로 판정.
//   블록 태그축(VANTA/IRONWALL/HELIX/AXIOM)은 전량 MOLE 통과. 잔존 미도달은 속성명 태그축
//   2건(a2-c2 MESH · a2-side-cipher-static SHADE) — 어떤 클래스도 속성을 tags 로 갖지 않는
//   설계상 사문(67차 범위 밖 · 정직 고정). 신규 사문 게이트가 생기면 이 핀이 즉시 실패한다.
var tagCtxs = {};
CL.PLAYABLE.forEach(function (k) {
  var tc = CH.makeCharacter(k), te = CH.effectiveStats(tc);
  tagCtxs[k] = { attrs: { hack: te.hack, atk: te.atk, def: te.def, spd: te.spd, hp: te.maxHp }, tags: tc.tags || [], flags: {}, classKey: k };
});
var tagGates = [], tagDead = [];
CAMP.MISSIONS.forEach(function (reg) {
  var mm = CAMP.missionData(reg.id); if (!mm || !mm.dialogue) return;
  Object.keys(mm.dialogue.nodes).forEach(function (nid) {
    (mm.dialogue.nodes[nid].choices || []).forEach(function (ch2) {
      if (!ch2.gate || !ch2.gate.tag) return;
      tagGates.push(reg.id + '|' + ch2.gate.tag);
      var reach = CL.PLAYABLE.some(function (k) { return DLG.evalGate(ch2.gate, tagCtxs[k]).ok; });
      if (!reach) tagDead.push(reg.id + '|' + ch2.gate.tag);
    });
  });
});
tagDead.sort();
// [68차] 태그 게이트 총량 9 → 8 (a2-side-blade-vendetta 의 [IRONWALL 태그] 를 [DEF 4] 로 교체 —
//   소유 클래스 사문 해소, 아래 294~296 참고). 블록 태그축 6건 전량 MOLE 통과 유지.
ok('287. 태그 게이트 8건 중 블록 태그축 6건 전량 도달 가능(MOLE) · 미도달 잔존 = 속성명 태그축 2건 정확히'
  + (tagDead.length ? ' [' + tagDead.join(', ') + ']' : ''),
  tagGates.length === 8 && tagDead.length === 2 &&
  tagDead[0] === 'a2-c2-signal-war|MESH' && tagDead[1] === 'a2-side-cipher-static|SHADE');

// tags 는 대화 게이트 전용 축 — 전투 상태(buildCombat)에 유입되지 않음(밸런스 불변의 구조적 근거).
var mwCombatState = S.buildCombat(mwMission, CH.makeCharacter('MOLE'), 'outro');
ok('288. tags 는 전투 상태에 유입 0 (buildCombat 산출물에 tags/HELIX 문자열 부재) — 태그 확장의 밸런스 불변 근거',
  JSON.stringify(mwCombatState).indexOf('HELIX_MEDIC') >= 0 &&        // 적 키는 존재(대조군)
  JSON.stringify(S.player(mwCombatState)).indexOf('tags') < 0 &&
  S.player(mwCombatState).tags === undefined);

console.log('\n== [67차 → 71차 갱신] 하드모드 실패 집합 계기판 핀 — 게이트 아님(하드모드 한계 정직 고정) ==');
// ★ 이 핀은 '통과 기준'이 아니라 '현재 한계의 정직한 스냅샷'이다.
// [67차] 당시엔 hard 전용 레버가 없었다(적 스탯 배율만 상이 · 오브젝티브 임계/좌표/threatCap 은
//   base 와 공유). 공유 수치를 건드리면 base 매트릭스가 반드시 변한다(v6.46 실측 — 커버 1칸
//   추가만으로 base BLADE 9R→12R · RIGGER reinforced 반전) → 27건을 그대로 고정했다.
// [71차 M6+M8] 인카운터별 옵셔널 `hardScale` 을 신설했다(store.js dialogueChoose 조회 · 하네스
//   'hard' 센티널 동일 조회). hardMode off 면 scale 1 이라 노멀 축은 구조적으로 불변이다.
//   실측 6건에 1.15~1.20 을 선별 적용 → hard×base 27→21 · hard×full 3→2 로 해소.
//   **전부 해소는 불가**: spawnEnemy 가 Math.ceil 이고 적 atk 가 3~7 의 작은 정수라 배율이 1 을
//   넘는 순간 atk 는 최소 +1 이 된다(3→4·4→5 는 1.05 든 1.25 든 동일). 최다 실패 원인인
//   '러시생존창붕괴' 는 바로 그 +1 이 만들므로, scale 1(=하드모드 무효화) 외에는 도달 불가다.
//   → 잔존 21/2 건을 집합째 고정해 회귀(악화)와 개선을 모두 노출시킨다.
var HARD_BASE_FAILS = [
  'a2-a2-crown-throne|RIGGER', 'a2-b2-freeport|BROKER', 'a2-d2-last-signal#stage2|RIGGER',
  'a2-side-blade-vendetta|RIGGER', 'a2-side-broker-ledger|BROKER', 'a2-side-cipher-static|BROKER',
  'a2-side-cipher-static|CIPHER', 'a2-side-drifter-lastroad|BROKER', 'a2-side-rigger-build|CIPHER',
  'ch01-first-blood|CIPHER', 'ch02-insider-game|BROKER', 'ch03-martial-night|BROKER',
  'ch03-martial-night|RIGGER', 'ch04-price-of-splice|BROKER', 'ch06-bloc-acquisition|BROKER',
  'ch06-bloc-acquisition|CIPHER', 'ch07-heart-of-city|BROKER', 'ch07-heart-of-city|CIPHER',
  'ch08-zero-day|BROKER', 'side-03-chemical-raid|CIPHER', 'side-07-server-zero|BROKER',
];
var HARD_FULL_FAILS = ['a2-side-blade-vendetta|RIGGER', 'ch03-martial-night|RIGGER'];
function hardFailSet(scn) {
  // [71차] 상수 1.25 가 아니라 'hard' 센티널 — 인카운터별 hardScale 을 조회해 런타임과 동일 배율로 측정.
  var rws = BAL.runMatrix(scn, 'hard'), acc = [];
  rws.forEach(function (r) {
    BAL.CLASSES.forEach(function (c) {
      if (BAL.verdict(r.cells[c]).flags.indexOf('clearFail') >= 0) acc.push(r.id + '|' + c);
    });
  });
  return acc.sort();
}
var hbSet = hardFailSet('base'), hfSet = hardFailSet('full');
ok('289. 계기판: hard×base clearFail 21건 = 고정 집합 일치 (BROKER11·CIPHER6·RIGGER4 / BLADE·MOLE·DRIFTER 0) — 71차 hardScale 로 27→21',
  hbSet.length === 21 && JSON.stringify(hbSet) === JSON.stringify(HARD_BASE_FAILS) &&
  hbSet.filter(function (x) { return /\|BROKER$/.test(x); }).length === 11 &&
  hbSet.filter(function (x) { return /\|CIPHER$/.test(x); }).length === 6 &&
  hbSet.filter(function (x) { return /\|RIGGER$/.test(x); }).length === 4 &&
  hbSet.filter(function (x) { return /\|(BLADE|MOLE|DRIFTER)$/.test(x); }).length === 0);
ok('290. 계기판: hard×full clearFail 2건 = RIGGER 전량 (최고가 장비가 21건 중 19건 흡수) — 71차 hardScale 로 3→2',
  hfSet.length === 2 && JSON.stringify(hfSet) === JSON.stringify(HARD_FULL_FAILS) &&
  hfSet.every(function (x) { return /\|RIGGER$/.test(x); }));
// hard 축이 표준 난이도를 오염시키지 않음 — base 매트릭스 clearFail 0 불변식은 게이트(174) 로 유지되고,
//   여기서는 hard 실패 집합이 base 성공 집합의 부분집합임(= 하드 전용 실패)을 고정한다.
var baseFailSet = [];
BAL.runMatrix('base').forEach(function (r) {
  BAL.CLASSES.forEach(function (c) { if (BAL.verdict(r.cells[c]).flags.indexOf('clearFail') >= 0) baseFailSet.push(r.id + '|' + c); });
});
ok('291. hard 실패 23건(base21+full2)은 전량 하드 전용 — 표준 난이도(base/full) clearFail 0 불변',
  baseFailSet.length === 0 && aggFull.fail === 0 && aggMid.fail === 0);

// ============================================================================
// ======  68차 — RPG 오브젝티브 다양성 (생존형 win-condition · HACK 전용 코어)  ======
//   ① resolve.surviveReached 순수 판정 + 하위 호환 불변식(미선언 = 완전 무영향)
//   ② buildCombat/checkOutcome 배선 + 비전환 미션 byte 불변
//   ③ side-02 HACK 전용 코어(ICE 격자 봉인) — 데이터만·엔진 무편집
//   ④ _balance survive 정책/봉인 대응 + 매트릭스 회귀(clearFail 0 · trivial 감소)
//   ⑤ blade-vendetta 사문 게이트 해소([IRONWALL 태그] → [DEF 4])
// ============================================================================
console.log('\n== [68차] 생존형 win-condition — resolve.surviveReached 순수 판정 ==');
ok('292. surviveReached: 미선언(undefined/null/0/음수) 은 항상 false — 하위 호환 불변식',
  R.surviveReached(99, undefined) === false && R.surviveReached(99, null) === false &&
  R.surviveReached(99, 0) === false && R.surviveReached(99, -3) === false);
ok('293. surviveReached: N라운드 사수 경계 — round N 이하 false, N 초과 true (round>N)',
  R.surviveReached(1, 4) === false && R.surviveReached(4, 4) === false &&
  R.surviveReached(5, 4) === true && R.surviveReached(9, 4) === true);
ok('294. surviveReached: 순수·결정론 (같은 입력 반복 = 같은 출력, 부작용 0)',
  R.surviveReached(5, 4) === R.surviveReached(5, 4) && R.surviveReached(3, 4) === R.surviveReached(3, 4));

console.log('\n== [68차] buildCombat/checkOutcome 배선 · 비전환 미션 byte 불변 ==');
var svMission = CAMP.missionData('a2-c1-first-contact');
ok('295. a2-c1 enc① 데이터: survive:4 · 임계 16 (차감 단일형 → 사수형 전환)',
  svMission.combat.survive === 4 && svMission.combat.objective.threshold === 16 &&
  (svMission.combat.objective.veil || 0) === 0);
ok('296. enc②(stage2) 는 비전환 — survive 미선언(2연전 후반은 기존 차감형 유지)',
  svMission.encounters.stage2.survive === undefined);
var svCombat = S.buildCombat(svMission, CH.makeCharacter('BLADE'), 'outro');
ok('297. buildCombat: 생존형 인카운터만 combat.survive 부착(=4)', svCombat.survive === 4);
// ★하위 호환 불변식 — survive 미선언 미션의 buildCombat 산출물에 survive 키가 존재하지 않는다.
var nonSv = S.buildCombat(CAMP.missionData('ch01-first-blood'), CH.makeCharacter('CIPHER'), 'outro');
ok('298. 비전환 미션 buildCombat 산출물에 survive 키 부재 (JSON byte 불변의 구조적 근거)',
  !('survive' in nonSv) && JSON.stringify(nonSv).indexOf('"survive"') < 0);
// 전 32미션 × 전 인카운터 중 survive 선언은 정확히 1건(a2-c1 enc①) — 확산 방지 핀.
var svDecl = [];
CAMP.MISSIONS.forEach(function (reg) {
  var m = CAMP.missionData(reg.id); if (!m) return;
  if (m.combat && m.combat.survive) svDecl.push(reg.id);
  if (m.encounters) Object.keys(m.encounters).forEach(function (k) {
    if (m.encounters[k].survive) svDecl.push(reg.id + '#' + k);
  });
});
ok('299. survive 선언 인카운터 = 정확히 1건 [a2-c1-first-contact] (엔진 확장 1종 한정 준수)',
  svDecl.length === 1 && svDecl[0] === 'a2-c1-first-contact');

// checkOutcome 실측 — 아무것도 하지 않고 라운드만 넘겨도 4라운드 사수 시 승리.
//   (BLADE 는 MERIDIAN_DRONE atk3 ≤ def3 → 피해 0 → 순수 사수 경로 관측에 적합)
var svRun = svCombat, svRounds = 0;
while (!svRun.outcome && svRounds < 12) { svRun = S.runEnemyTurn(svRun); svRounds++; }
ok('300. 무행동 사수: 4라운드 경과 시 outcome=win (오브젝티브 미완 · 위협 적 잔존)',
  svRun.outcome === 'win' && svRounds === 4 && svRun.objective.done === false &&
  svRun.units.filter(function (u) { return u.side === 'enemy' && u.hp > 0 && u.ai !== 'static'; }).length > 0);
ok('301. 사수 승리 로그 1줄 삽입 (차감/전멸 승리와 구분되는 서사 피드백)',
  svRun.log.filter(function (l) { return l.indexOf('사수 완료') >= 0; }).length === 1);
// 비전환 미션은 같은 절차로 승리하지 않는다(라운드 경과만으로는 승패 없음) — 대조군.
var nsRun = nonSv, nsRounds = 0;
while (!nsRun.outcome && nsRounds < 12) { nsRun = S.runEnemyTurn(nsRun); nsRounds++; }
ok('302. 대조군: 비전환 미션은 라운드 경과만으로 승리하지 않음 (survive 분기 미유입)',
  nsRun.outcome !== 'win' &&
  nsRun.log.filter(function (l) { return l.indexOf('사수 완료') >= 0; }).length === 0);

console.log('\n== [68차] side-02 HACK 전용 코어 (ICE 격자 봉인 · 데이터만) ==');
var s02 = CAMP.missionData('side-02-corp-breach');
var s02Ice = s02.combat.enemies.filter(function (e) { return e.key === 'ICE_NODE'; });
var s02Ring = {};
s02Ice.forEach(function (e) { s02Ring[e.x + ',' + e.y] = true; });
var ringTiles = [], oo = s02.combat.objective;
for (var rdx = -1; rdx <= 1; rdx++) for (var rdy = -1; rdy <= 1; rdy++) {
  if (rdx === 0 && rdy === 0) continue;
  var rx = oo.x + rdx, ry = oo.y + rdy;
  if (G.inBounds(rx, ry, s02.combat.cols, s02.combat.rows)) ringTiles.push(rx + ',' + ry);
}
ok('303. 캐시 인접 링 ' + ringTiles.length + '타일 전량 ICE_NODE 봉인 (HACK 전용 코어 성립 조건)',
  ringTiles.length === 5 && ringTiles.every(function (t) { return s02Ring[t]; }) && s02Ice.length === 5);
ok('304. ICE_NODE 는 physImmune·hackOnly·static — 링 돌파는 useHack 능력 보유 클래스 한정',
  EN.ENEMIES.ICE_NODE.physImmune === true && EN.ENEMIES.ICE_NODE.hackOnly === true &&
  EN.ENEMIES.ICE_NODE.ai === 'static');
// 클래스별 링 돌파 가능성 = 킷에 useHack 공격 능력이 있는가 (applyAttack: physImmune && !useHack → 무효).
function canBreach(k) {
  return CH.makeCharacter(k).kit.some(function (a) {
    var ab = AB.ABILITIES[a];
    return ab && ab.useHack && (ab.kind === 'RANGED' || ab.kind === 'MELEE');
  });
}
var breachers = CL.PLAYABLE.filter(canBreach).sort();
ok('305. 링 돌파 가능 = HACK 축 3클래스 [BROKER,CIPHER,MOLE] · 물리축 3클래스는 전멸 승리로 완주'
  + ' [' + breachers.join(',') + ']',
  JSON.stringify(breachers) === JSON.stringify(['BROKER', 'CIPHER', 'MOLE']));
// 실측: 봉인 이후에도 6클래스 전원 클리어 가능(전멸 폴백) · CIPHER 는 오브젝티브 축으로 완주.
var s02Cells = {};
BAL.CLASSES.forEach(function (cl) {
  s02Cells[cl] = { combat: BAL.runEncounter(cl, 'side-02-corp-breach', 'combat'),
                   objective: BAL.runEncounter(cl, 'side-02-corp-breach', 'objective') };
});
ok('306. 봉인 후 6클래스 전원 클리어 가능(clearFail 0) — 전멸 승리축이 물리 클래스 폴백',
  BAL.CLASSES.every(function (cl) { return BAL.verdict(s02Cells[cl]).clearable; }));
ok('307. CIPHER 는 봉인을 뚫고 objective 경로로 완주(winBy=objective) — HACK 축 우대 실증',
  s02Cells.CIPHER.objective.win === true && s02Cells.CIPHER.objective.winBy === 'objective');
ok('308. BLADE(물리축)는 objective 정책으로도 전멸 승리로만 완주(winBy=eliminate) — 코어 접근 차단 실증',
  s02Cells.BLADE.combat.win === true && s02Cells.BLADE.combat.winBy === 'eliminate' &&
  (!s02Cells.BLADE.objective.win || s02Cells.BLADE.objective.winBy === 'eliminate'));

console.log('\n== [68차] 하네스 대응 — survive 정책 · 봉인 코어 · 매트릭스 회귀 ==');
var svPolRes = BAL.runEncounter('CIPHER', 'a2-c1-first-contact', 'survive');
ok('309. survive 정책(농성) 자체 결정론 + 생존형 인카운터 클리어',
  svPolRes.win === true &&
  JSON.stringify(svPolRes) === JSON.stringify(BAL.runEncounter('CIPHER', 'a2-c1-first-contact', 'survive')));
ok('310. survive 정책은 6클래스 전원 사수 완주 (신규 유형의 하네스 클리어 판정 성립)',
  BAL.CLASSES.every(function (cl) { return BAL.runEncounter(cl, 'a2-c1-first-contact', 'survive').win; }));
// 셀 형상 — 생존형 행만 3정책, 그 외 전 행은 2정책(기존 --json 형상 byte 불변).
var mrx68 = BAL.runMatrix();
var pol3 = [], pol2 = 0;
mrx68.forEach(function (r) {
  var keys = Object.keys(r.cells.CIPHER).sort();
  if (keys.length === 3) pol3.push(r.id); else pol2++;
});
ok('311. 3정책 측정 행 = 생존형 1행 [a2-c1-first-contact] · 나머지 ' + pol2 + '행은 2정책(형상 불변)',
  pol3.length === 1 && pol3[0] === 'a2-c1-first-contact' && pol2 === mrx68.length - 1);
// 매트릭스 회귀 — 전 조합 클리어 유지 + 트리비얼 램프: 65차 3 → 68차 2(a2-c1 BLADE) → 71차 0.
//   [71차 L5] 잔존 2건(ch02·a2-d1 의 BLADE 2R 무피해 러시)을 배치 레버로 해소:
//   코어가 이미 그리드 최원거리라 '코어 이설' 은 무효(BLADE mov3×ap2 = 6칸/R 이 거리를 덮음) →
//   직선 진입 레인을 격벽/붕괴잔해로 막아 우회를 강제(러시 2R→3R). survive:N 전환은 서사 부적합으로 배제.
var agg68 = BAL.aggregateScenario(mrx68);
ok('312. 71차 후 base 매트릭스: 252/252 클리어 · clearFail 0 · trivial 0 · 전 조합 무플래그(bandOk 252)',
  agg68.total === 252 && agg68.clearable === 252 && agg68.fail === 0 && agg68.trivial === 0 &&
  agg68.attrition === 0 && agg68.bandOk === 252);
ok('313. 해소된 트리비얼 3건 [a2-c1-first-contact(68차) · ch02-insider-game · a2-d1-scavenge(71차)] 전량 flagged 부재',
  ['a2-c1-first-contact', 'ch02-insider-game', 'a2-d1-scavenge'].every(function (id) {
    return agg68.flagged.filter(function (f) { return f.id === id; }).length === 0;
  }));

console.log('\n== [68차] blade-vendetta 사문 게이트 해소 ([IRONWALL 태그] → [DEF 4]) ==');
var bvM = CAMP.missionData('a2-side-blade-vendetta');
var bvChoices = bvM.dialogue.nodes.approach.choices;
ok('314. approach 3출구 유지 · IRONWALL 태그 게이트 소멸 · [DEF 4] attr 게이트로 교체',
  bvChoices.length === 3 &&
  bvChoices.every(function (ch3) { return !(ch3.gate && ch3.gate.tag); }) &&
  bvChoices.filter(function (ch3) { return ch3.gate && ch3.gate.attr === 'def' && ch3.gate.min === 4; }).length === 1);
// 소유 클래스(BLADE) 기준 도달성 — 무장비는 잠김(회색 광고), IRON_SKIN 장착 시 개방.
var bvBase = CH.makeCharacter('BLADE');
var bvGeared = CH.makeCharacter('BLADE'); bvGeared.equipment = { weapon: null, cyberware: 'IRON_SKIN' };
function defCtx(chx) { var ef = CH.effectiveStats(chx); return { attrs: { hack: ef.hack, atk: ef.atk, def: ef.def, spd: ef.spd, hp: ef.maxHp }, tags: chx.tags || [], flags: {} }; }
var bvGate = { attr: 'def', min: 4 };
ok('315. 소유 클래스 BLADE: 무장비 DEF3 → 잠김(gray 광고) · IRON_SKIN(DEF+2) → 개방 (사문 아님)',
  DLG.evalGate(bvGate, defCtx(bvBase)).ok === false &&
  DLG.evalGate(bvGate, defCtx(bvGeared)).ok === true &&
  DLG.choiceState(bvChoices[2], defCtx(bvBase)) === 'gray' &&
  DLG.choiceState(bvChoices[2], defCtx(bvGeared)) === 'available');
ok('316. IRON_SKIN 은 BLADE 장착 가능(classReq 통과) — 개방 경로가 실제 경제 루프로 도달 가능',
  GEAR.canEquip(GEAR.ITEMS.IRON_SKIN, bvBase) === true && GEAR.ITEMS.IRON_SKIN.mods.def === 2);
ok('317. [DEF 4] 는 karma 성장 축으로도 도달 (장비 없이도 def+1 1회 지출로 개방)',
  DLG.evalGate(bvGate, defCtx(CH.spendKarma(
    (function () { var t = CH.makeCharacter('BLADE'); t.karma = 1; return t; })(), 'def').character)).ok === true);

// ★소유 클래스 사문 전수 — unlock.classKey 가 걸린 클래스 전용 사이드의 모든 게이트를
//   그 소유 클래스 기준으로 판정한다. 두 축을 나눠 본다:
//     · attr 게이트 : karma 성장(STAT_CAP 이내) 또는 장비로 언제나 도달 가능 → 사문 아님.
//     · tag  게이트 : 성장·장비로 얻을 수 없는 고정 축 → 소유 클래스가 태그를 갖지 못하면 사문.
//   68차에서 blade-vendetta 의 [IRONWALL 태그] 를 attr 축으로 옮겨 소유 사문 2건 → 1건.
//   잔존 1건은 "속성명(SHADE) 을 태그로 쓴" 설계상 사문(어떤 클래스도 속성을 tags 로 갖지
//   않음, 287 과 동일 근거)이며 67차와 마찬가지로 집합째 정직 고정한다.
var ownerAttrDead = [], ownerTagDead = [];
CAMP.MISSIONS.forEach(function (reg) {
  var mm = CAMP.missionData(reg.id);
  var ownerKey = reg.unlock && reg.unlock.classKey;
  if (!mm || !mm.dialogue || !ownerKey) return;
  var oc = CH.makeCharacter(ownerKey);
  Object.keys(mm.dialogue.nodes).forEach(function (nid) {
    (mm.dialogue.nodes[nid].choices || []).forEach(function (ch4) {
      var g4 = ch4.gate;
      if (!g4 || g4.flag) return;                       // flag 게이트는 前 미션 계승축(범위 밖)
      if (g4.attr) {                                    // 성장 상한 안이면 도달 가능
        var capKey = g4.attr === 'hp' ? 'hp' : g4.attr;
        if (!(CH.STAT_CAP[capKey] >= g4.min)) ownerAttrDead.push(reg.id + '|' + g4.attr + g4.min);
        return;
      }
      if (g4.tag && !DLG.evalGate(g4, defCtx(oc)).ok) ownerTagDead.push(reg.id + '|' + g4.tag);
    });
  });
});
ok('318. 클래스 전용 사이드의 attr 게이트 전량 성장 상한(STAT_CAP) 이내 — 성장 도달 불가 0'
  + (ownerAttrDead.length ? ' [' + ownerAttrDead.join(', ') + ']' : ''), ownerAttrDead.length === 0);
ok('319. 소유 클래스 tag 사문 = 1건 [a2-side-cipher-static|SHADE] 정확히 (68차 blade-vendetta 해소분 제외)'
  + (ownerTagDead.length ? ' [' + ownerTagDead.join(', ') + ']' : ''),
  ownerTagDead.length === 1 && ownerTagDead[0] === 'a2-side-cipher-static|SHADE');

// ============================================================================
// ======  71차 — 하드모드 전용 레버 hardScale (M6+M8)  ========================
//   인카운터별 옵셔널 배율. store.js dialogueChoose 가 ((encCfg||mission.combat).hardScale
//   || 1.25) 로 조회하고, _balance 하네스는 'hard' 센티널로 동일 규칙을 재현한다.
//   핵심 불변식: hardMode OFF 면 hardScale 선언 여부와 무관하게 scale 1 → 노멀 매트릭스 불변.
// ============================================================================
console.log('\n== [71차 M6+M8] 하드모드 전용 레버 hardScale — 선언/폴백/노멀 불변 ==');

// hardScale 을 선언한 인카운터 목록(측정 근거로 6건 선별 적용). 미선언은 기본 1.25 폴백.
var HS_DECLARED = {
  'ch08-zero-day': 1.20, 'a2-b2-freeport': 1.20, 'a2-b2-freeport#stage2': 1.15,
  'a2-d1-scavenge#stage2': 1.20, 'a2-side-blade-vendetta': 1.20, 'a2-side-rigger-build': 1.20,
};
var hsFound = {};
CAMP.MISSIONS.forEach(function (reg) {
  var mm = CAMP.missionData(reg.id);
  if (!mm) return;
  if (mm.combat && mm.combat.hardScale) hsFound[reg.id] = mm.combat.hardScale;
  if (mm.encounters) Object.keys(mm.encounters).forEach(function (k) {
    if (mm.encounters[k].hardScale) hsFound[reg.id + '#' + k] = mm.encounters[k].hardScale;
  });
});
ok('320. hardScale 선언 인카운터 = 6건 정확히 (ch08 1.20 · freeport 1.20/stage2 1.15 · scavenge#stage2 1.20 · blade-vendetta 1.20 · rigger-build 1.20)',
  JSON.stringify(Object.keys(hsFound).sort()) === JSON.stringify(Object.keys(HS_DECLARED).sort()) &&
  Object.keys(HS_DECLARED).every(function (k) { return hsFound[k] === HS_DECLARED[k]; }));

// 선언 배율이 실제 전투 빌드에 반영되는가 — hardScale 1.20 인 ch08 enc① 을 직접 빌드해 대조.
var ch08m = CAMP.missionData('ch08-zero-day');
var hsOn  = S.buildCombat(ch08m, CH.makeCharacter('RIGGER'), 'outro', { enemyScale: ch08m.combat.hardScale });
var hs125 = S.buildCombat(ch08m, CH.makeCharacter('RIGGER'), 'outro', { enemyScale: 1.25 });
function enemyAtks(c) { return c.units.filter(function (u) { return u.side === 'enemy'; }).map(function (u) { return u.atk; }); }
ok('321. hardScale 1.20 빌드 ≠ 1.25 빌드 (ceil 양자화가 실제로 한 스텝 낮아짐 — 레버가 무의미하지 않음)',
  JSON.stringify(enemyAtks(hsOn)) !== JSON.stringify(enemyAtks(hs125)));

// ★ 핵심 불변식: hardMode OFF 면 hardScale 선언 인카운터도 scale 1 → 노멀 전투 byte 불변.
var nmOff = S.rpgInitialState(); nmOff.save.character = CH.makeCharacter('RIGGER');
var plain = S.buildCombat(ch08m, CH.makeCharacter('RIGGER'), 'outro');
var plain2 = S.buildCombat(ch08m, CH.makeCharacter('RIGGER'), 'outro', { enemyScale: 1 });
ok('322. hardMode OFF → hardScale 선언 미션도 scale 1 · buildCombat 산출물 byte 불변(노멀 밸런스 무영향)',
  JSON.stringify(plain) === JSON.stringify(plain2) &&
  plain.enemyScale === 1 && enemyAtks(plain).join() !== enemyAtks(hsOn).join());

// dialogueChoose 경로 실측 — hardScale 미선언 미션은 기존 1.25 폴백을 그대로 유지(하위호환).
var hsFb = S.rpgInitialState(); hsFb.save.missionsDone = ['ch08-zero-day']; hsFb.save.character = CH.makeCharacter('RIGGER');
hsFb.save.flags.hardMode = true;
hsFb = S.startMission(hsFb, 'a2-00-framing'); hsFb = S.dialogueChoose(hsFb, 0); hsFb = S.dialogueChoose(hsFb, 0);
ok('323. hardScale 미선언 미션(a2-00-framing) 은 기본 1.25 폴백 유지 — 232 핀과 동일 수치(하위호환)',
  hsFb.combat.enemyScale === 1.25 &&
  !(CAMP.missionData('a2-00-framing').combat.hardScale));

// ============================================================================
// ======  72차 — d45 잔존 소항목 3건 (spendKarma 배선 · 심연 기록 · 온보딩)  ====
// ============================================================================
var ABX = require('./systems/abyss.js');

console.log('\n== [72차 · d45 #14] 대화 선택지 karma 비용 — 게이트 + 실차감 ==');

// ① 원시연산 payKarma — 비용 소모 전용(성장 없음). spendKarma 와 karma 판정 단일 출처.
var pkCh = CH.makeCharacter('CIPHER'); pkCh.karma = 2;
var pk1 = CH.payKarma(pkCh, 1);
ok('324. payKarma(1): karma 2→1 · growth 무변동(비용은 성장이 아니다) · 인자 무변경(순수)',
  pk1.ok === true && pk1.character.karma === 1 && pk1.spent === 1 &&
  JSON.stringify(pk1.character.growth) === JSON.stringify(pkCh.growth) && pkCh.karma === 2);
var pk2 = CH.payKarma(pkCh, 3);
ok('325. payKarma 부족: karma 2 < 3 → ok:false + 사유·필요/보유 노출(조용한 실패 금지)',
  pk2.ok === false && pk2.reason === 'karma 부족' && pk2.need === 3 && pk2.have === 2 && pk2.character === undefined);
ok('326. spendKarma 회귀: payKarma 경유 후에도 39번 계약 불변 (karma 0 → reason "karma 부족" byte 동일)',
  CH.spendKarma(CH.makeCharacter('CIPHER'), 'hack').ok === false &&
  CH.spendKarma(CH.makeCharacter('CIPHER'), 'hack').reason === 'karma 부족' &&
  CH.spendKarma(Object.assign({}, pkCh, { karma: 1 }), 'hack').character.growth.hack === 1);

// ② dialogue.evalCost / choiceState — 비용 미선언 선택지는 판정 불변(무해).
var kcChoice = { label: 'x', effect: { skipCombat: true, spendKarma: 1 }, show: 'gray' };
ok('327. evalCost: karma 부족 → ok:false + 사유, 충족 → ok:true (비용 미선언 선택지는 항상 ok)',
  DLG.evalCost(kcChoice, { karma: 0 }).ok === false &&
  DLG.evalCost(kcChoice, { karma: 1 }).ok === true &&
  DLG.evalCost({ label: 'y' }, { karma: 0 }).ok === true &&
  DLG.evalCost({ label: 'y', effect: { startCombat: {} } }, {}).ok === true);
ok('328. choiceState: 비용 미충족 → gray(+choiceReason 사유), 충족 → available',
  DLG.choiceState(kcChoice, { karma: 0 }) === 'gray' &&
  DLG.choiceState(kcChoice, { karma: 1 }) === 'available' &&
  /karma 1 지출/.test(DLG.choiceReason(kcChoice, { karma: 0 })) &&
  DLG.choiceReason(kcChoice, { karma: 1 }) === null);

// ③ ch07 approach#1 실경로 — HACK4 게이트 AND karma 1. karma 0 이면 gray + blocked(무료 통과 불가).
var ch07m = CAMP.missionData('ch07-heart-of-city');
var ch07Choice = ch07m.dialogue.nodes.approach.choices[1];
ok('329. ch07 카드 키 출구가 effect.spendKarma:1 을 실제로 보유 (배선 대상 데이터 핀)',
  ch07Choice.effect.spendKarma === 1 && ch07Choice.gate.attr === 'hack' && ch07Choice.gate.min === 4);

function ch07State(karma) {
  var st = S.rpgInitialState();
  st.save.character = CH.makeCharacter('CIPHER');
  st.save.character.growth.hack = 1;         // CIPHER hack 3 → 4 (게이트 충족)
  st.save.character.karma = karma; st.save.karma = karma;
  st.save.missionsDone = ['ch06-bloc-acquisition'];
  return S.startMission(st, 'ch07-heart-of-city');
}
var k0 = ch07State(0); k0 = S.dialogueChoose(k0, 0);              // intro → approach
var k0ctx = S.dialogueCtx(k0);
ok('330. dialogueCtx 가 karma 잔량을 노출 (비용 게이트 판정 입력)', k0ctx.karma === 0);
ok('331. karma 0 · HACK4 충족 → 선택지 gray (게이트는 통과해도 비용이 잠근다)',
  DLG.evalGate(ch07Choice.gate, k0ctx).ok === true && DLG.choiceState(ch07Choice, k0ctx) === 'gray');
var k0after = S.dialogueChoose(k0, 1);
ok('332. karma 0 로 진입 시도 → blocked 반려 · 노드 이동 0 · flag 미설정 · karma 무변동 (조용한 차감 실패 없음)',
  k0after.banner.kind === 'blocked' && k0after.dialogue.nodeId === 'approach' &&
  !k0after.save.flags.signalCardKey && k0after.save.character.karma === 0);

var k1 = ch07State(1); k1 = S.dialogueChoose(k1, 0);
ok('333. karma 1 → 선택지 available', DLG.choiceState(ch07Choice, S.dialogueCtx(k1)) === 'available');
var k1after = S.dialogueChoose(k1, 1);
ok('334. karma 1 충족 → 실차감(1→0) · save.karma 미러 동기 · outroChosen 라우팅 · signalCardKey 설정',
  k1after.save.character.karma === 0 && k1after.save.karma === 0 &&
  k1after.dialogue.nodeId === 'outroChosen' && k1after.save.flags.signalCardKey === true &&
  k1after.save.character.growth.hack === 1);   // 비용 지출은 성장이 아니다(growth 무증가)
// 재클리어 farming — 지출은 단방향. karma 보상은 재클리어 시 0 지급(applyRewards firstClear 가드).
var reFarm = CAMP.applyRewards({ character: CH.makeCharacter('CIPHER'), missionsDone: ['ch07-heart-of-city'] }, ch07m);
ok('335. 재클리어 farming 불가: 2회차 ch07 정산 karma +0 (지출만 단방향 → 같은 선택지 반복해도 순환 이득 0)',
  reFarm.firstClear === false && reFarm.character.karma === 0 && ch07m.rewards.karma === 3);
// 비용 미선언 선택지 전량 회귀 — 32미션 판정 불변(evalCost 도입이 기존 선택지를 건드리지 않는다).
var costFree = 0, costGated = [];
CAMP.MISSIONS.forEach(function (reg) {
  var mm = CAMP.missionData(reg.id); if (!mm || !mm.dialogue) return;
  Object.keys(mm.dialogue.nodes).forEach(function (nid) {
    (mm.dialogue.nodes[nid].choices || []).forEach(function (cc, ci) {
      var need = (cc.effect && cc.effect.spendKarma) || 0;
      if (need) { costGated.push(reg.id + '/' + nid + '#' + ci); return; }
      costFree++;
      if (DLG.choiceState(cc, { attrs: {}, tags: [], flags: {}, karma: 0 }) !==
          DLG.choiceState(cc, { attrs: {}, tags: [], flags: {} })) costFree = -99999;
    });
  });
});
ok('336. 전 미션 spendKarma 선언 = ch07 approach#1 정확히 1건 (grep 전수) · 비용 미선언 선택지 ' + costFree
  + '건은 karma 유무와 무관하게 판정 불변', costGated.length === 1 &&
  costGated[0] === 'ch07-heart-of-city/approach#1' && costFree > 200);

console.log('\n== [72차 · d45 #4] 심연 기록 확장 { best, byClass, lastRun } ==');

ok('337. migrateAbyss 구세이브 무손상: { best:7 } → best 7 보존 + byClass {} + lastRun null (날조 없음)',
  JSON.stringify(ABX.migrateAbyss({ best: 7 })) === JSON.stringify({ best: 7, byClass: {}, lastRun: null }));
ok('338. migrateAbyss 부재/오염 방어: undefined·null·배열·문자열 best → 기본 기록',
  JSON.stringify(ABX.migrateAbyss(undefined)) === JSON.stringify({ best: 0, byClass: {}, lastRun: null }) &&
  JSON.stringify(ABX.migrateAbyss(null)) === JSON.stringify({ best: 0, byClass: {}, lastRun: null }) &&
  JSON.stringify(ABX.migrateAbyss([1, 2])) === JSON.stringify({ best: 0, byClass: {}, lastRun: null }) &&
  ABX.migrateAbyss({ best: 'x', byClass: 'y', lastRun: 3 }).best === 0);
var mig1 = ABX.migrateAbyss({ best: 4, byClass: { CIPHER: 4, BLADE: 'x', MOLE: 0 }, lastRun: { classKey: 'CIPHER', wave: 5, cleared: false } });
ok('339. migrateAbyss 멱등: migrate(migrate(x)) === migrate(x) · 오염 byClass 항목 제거',
  JSON.stringify(ABX.migrateAbyss(mig1)) === JSON.stringify(mig1) &&
  mig1.byClass.BLADE === undefined && mig1.byClass.MOLE === undefined && mig1.byClass.CIPHER === 4);
ok('340. migrateAbyss 불변식: best >= max(byClass) — 구세이브가 낮은 best 를 들고 와도 클래스 기록으로 승격',
  ABX.migrateAbyss({ best: 2, byClass: { RIGGER: 9 } }).best === 9);

var rec0 = ABX.recordAbyss(undefined, 'CIPHER', 3, true);
var rec1 = ABX.recordAbyss(rec0, 'BLADE', 5, true);
var rec2 = ABX.recordAbyss(rec1, 'BLADE', 2, true);      // 낮은 웨이브는 최고 기록을 낮추지 않는다
var rec3 = ABX.recordAbyss(rec2, 'MOLE', 8, false);      // 패배 — lastRun 만 갱신
ok('341. recordAbyss: 클래스별 최고 독립 갱신 · 전체 best = 최댓값 · 낮은 웨이브 미갱신',
  rec0.best === 3 && rec0.byClass.CIPHER === 3 &&
  rec1.best === 5 && rec1.byClass.BLADE === 5 && rec1.byClass.CIPHER === 3 &&
  rec2.byClass.BLADE === 5 && rec2.best === 5);
ok('342. recordAbyss 패배: best/byClass 무갱신(패배 웨이브는 완주가 아니다) · lastRun 은 승패 무관 항상 갱신',
  rec3.best === 5 && rec3.byClass.MOLE === undefined &&
  JSON.stringify(rec3.lastRun) === JSON.stringify({ classKey: 'MOLE', wave: 8, cleared: false }) &&
  JSON.stringify(rec2.lastRun) === JSON.stringify({ classKey: 'BLADE', wave: 2, cleared: true }) &&
  JSON.stringify(rec1) !== JSON.stringify(rec2));   // 순수 — 인자 객체 무변경
var bbc = ABX.bestByClass(rec3);
ok('343. bestByClass: 6클래스 전량 고정 순서(PLAYABLE) · 미기록 클래스 0/played:false (리플레이 후크)',
  bbc.length === 6 && bbc.map(function (r) { return r.classKey; }).join() === CL.PLAYABLE.join() &&
  bbc[0].best === 3 && bbc[0].played === true && bbc[1].best === 5 &&
  bbc[3].best === 0 && bbc[3].played === false);

// 세이브 마이그레이션 — 구세이브(abyss 부재 / 구 스칼라) 무손상 백필 + 멱등.
var oldSave = { version: 1, character: CH.makeCharacter('CIPHER'), flags: {}, missionsDone: [] };
var m1 = SAVE.migrate(JSON.parse(JSON.stringify(oldSave)));
var legacySave = SAVE.migrate({ version: 1, character: CH.makeCharacter('BLADE'), flags: {}, missionsDone: [], abyss: { best: 12 } });
ok('344. save.migrate 백필: abyss 부재 → 기본 기록 / 구 스칼라 { best:12 } → best 12 무손상 보존',
  JSON.stringify(m1.abyss) === JSON.stringify({ best: 0, byClass: {}, lastRun: null }) &&
  legacySave.abyss.best === 12 && JSON.stringify(legacySave.abyss.byClass) === JSON.stringify({}) &&
  legacySave.abyss.lastRun === null);
ok('345. save.migrate 멱등 + export/import 왕복 무손실 (확장 기록이 base64 왕복을 견딘다)',
  JSON.stringify(SAVE.migrate(JSON.parse(JSON.stringify(legacySave)))) === JSON.stringify(legacySave) &&
  JSON.stringify(SAVE.importString(SAVE.exportString(rec3 && legacySave)).save.abyss) === JSON.stringify(legacySave.abyss));

// store 경로 — 심연 승/패 해소가 기록을 갱신하는가 (전투 엔진 무편집, 기록만).
function abyssState(classKey, wave, outcome, prevAbyss) {
  var st = S.rpgInitialState();
  st.save.character = CH.makeCharacter(classKey);
  st.save.endings = END.recordCapstone(st.save.endings, classKey);
  if (prevAbyss) st.save.abyss = prevAbyss;
  st = S.startAbyss(st);
  st.combat.abyss.wave = wave; st.combat.outcome = outcome;
  return S.resolveCombat(st);
}
var aw = abyssState('RIGGER', 4, 'win');
ok('346. store 심연 승리 → best/byClass 갱신 + lastRun(cleared) · 다음 웨이브 계속',
  aw.save.abyss.best === 4 && aw.save.abyss.byClass.RIGGER === 4 &&
  JSON.stringify(aw.save.abyss.lastRun) === JSON.stringify({ classKey: 'RIGGER', wave: 4, cleared: true }) &&
  aw.scene === 'combat' && aw.combat.abyss.wave === 5);
var al = abyssState('MOLE', 6, 'lose', aw.save.abyss);
ok('347. store 심연 패배 → 페널티 0 · best 무변동 · lastRun 만 갱신 · 허브 귀환',
  al.save.abyss.best === 4 && al.save.abyss.byClass.MOLE === undefined &&
  JSON.stringify(al.save.abyss.lastRun) === JSON.stringify({ classKey: 'MOLE', wave: 6, cleared: false }) &&
  al.scene === 'hub' && al.combat === null);
// NG+ 이월 — 확장 기록 통째 영속(구현 전에는 best 만 이월됐다).
var ngp = S.rpgInitialState();
ngp.save.abyss = ABX.recordAbyss(undefined, 'BROKER', 9, true);
ngp.save.endings = END.recordEnding(ngp.save.endings, 'nexus-reborn', 'BROKER');
var ngpAfter = S.newGamePlus(ngp);
ok('348. NG+ 회차 이월: best·byClass·lastRun 전부 영속 (캠페인 진행만 리셋)',
  JSON.stringify(ngpAfter.save.abyss) === JSON.stringify(ngp.save.abyss) &&
  ngpAfter.save.abyss.byClass.BROKER === 9 && ngpAfter.save.missionsDone.length === 0);
// startAbyss 가 구세이브를 진입 시점에 백필하는가(멱등).
var legacyEntry = S.rpgInitialState();
legacyEntry.save.character = CH.makeCharacter('DRIFTER');
legacyEntry.save.endings = END.recordCapstone(legacyEntry.save.endings, 'DRIFTER');
legacyEntry.save.abyss = { best: 3 };            // 구 스칼라 스키마
legacyEntry = S.startAbyss(legacyEntry);
ok('349. startAbyss 진입 백필: 구 스칼라 세이브가 확장 스키마로 정규화 · best 무손상 · 웨이브 1 개시',
  legacyEntry.save.abyss.best === 3 && JSON.stringify(legacyEntry.save.abyss.byClass) === JSON.stringify({}) &&
  legacyEntry.save.abyss.lastRun === null && legacyEntry.combat.abyss.wave === 1);
// newSave 기본값 — 신규 진행도 확장 스키마.
ok('350. newSave 기본 abyss = 확장 스키마 { best:0, byClass:{}, lastRun:null } (migrate 멱등 대상)',
  JSON.stringify(S.newSave().abyss) === JSON.stringify({ best: 0, byClass: {}, lastRun: null }));

console.log('\n== [72차 · d45 #5] 온보딩 오버레이 — 표시층 계약 ==');
// 온보딩은 index.html 표시층(localStorage 플래그) — 엔진 무관. 여기선 '엔진을 건드리지 않았다'와
// survive 조건 1줄의 데이터 출처(combat.survive)가 살아있는지를 핀으로 고정한다.
var obFs = require('fs').readFileSync(__dirname + '/index.html', 'utf8');
ok('351. 온보딩 플래그 rpg.onboardSeen 이 localStorage 로 1회성 억제 · 5줄 규칙 + survive 1줄 분기 존재',
  /ONBOARD_KEY\s*=\s*'rpg\.onboardSeen'/.test(obFs) &&
  /localStorage\.setItem\(ONBOARD_KEY, '1'\)/.test(obFs) &&
  ONBOARD_RULES_COUNT(obFs) === 5 && /combat && combat\.survive/.test(obFs));
function ONBOARD_RULES_COUNT(src) {
  var m = /const ONBOARD_RULES = \[([\s\S]*?)\n\];/.exec(src);
  return m ? (m[1].match(/\{ ic:/g) || []).length : -1;
}
ok('352. 온보딩은 표시층 전용 — 전투 엔진(systems/combat/·store 전투 스텝)에 온보딩 참조 0 · reduced-motion 존중',
  ['./systems/combat/grid.js', './systems/combat/resolve.js', './systems/combat/ai.js', './state/store.js']
    .every(function (f) { return !/onboard/i.test(require('fs').readFileSync(__dirname + '/' + f, 'utf8')); }) &&
  /onboard-scrim' \+ \(reducedMotion \? ' still' : ''\)/.test(obFs));
// survive 선언 인카운터가 실제로 존재해야 '사수 1줄'이 사문이 아니다.
var survCount = 0;
CAMP.MISSIONS.forEach(function (reg) {
  var mm = CAMP.missionData(reg.id); if (!mm) return;
  if (mm.combat && mm.combat.survive) survCount++;
  if (mm.encounters) Object.keys(mm.encounters).forEach(function (k) { if (mm.encounters[k].survive) survCount++; });
});
ok('353. survive 선언 인카운터 ' + survCount + '건 존재 — 온보딩 사수 1줄이 실제로 도달 가능(사문 아님)', survCount > 0);

// ============================================================================
// ======  73차 — 미소비 대화 효과 6건 배선 (spendNuyen 비용 1 · karma 지급 4 · ₵ 지급 1)  ==
// ============================================================================

console.log('\n== [73차] 대화 선택지 ₵ 비용 (effect.spendNuyen) — 게이트 + 실차감 ==');

// ① 원시연산 payNuyen — payKarma 와 동일 계약. 성장/보상 무관 단방향 지출.
var pnCh = CH.makeCharacter('BLADE'); pnCh.nuyen = 5;
var pn1 = CH.payNuyen(pnCh, 3);
ok('354. payNuyen(3): ₵ 5→2 · growth/karma 무변동 · 인자 무변경(순수)',
  pn1.ok === true && pn1.character.nuyen === 2 && pn1.spent === 3 &&
  pn1.character.karma === pnCh.karma &&
  JSON.stringify(pn1.character.growth) === JSON.stringify(pnCh.growth) && pnCh.nuyen === 5);
var pn2 = CH.payNuyen(pnCh, 9);
ok('355. payNuyen 부족: ₵ 5 < 9 → ok:false + 사유 "₵ 부족" · need/have 노출 · character 미반환(무차감)',
  pn2.ok === false && pn2.reason === '₵ 부족' && pn2.need === 9 && pn2.have === 5 && pn2.character === undefined);
ok('356. payKarma 회귀(73차 공통 몸통 payResource 경유 후에도 byte 불변): 사유 문자열·0 방어·성장 지출',
  CH.payKarma(CH.makeCharacter('CIPHER'), 1).ok === false &&
  CH.payKarma(CH.makeCharacter('CIPHER'), 1).reason === 'karma 부족' &&
  CH.payKarma(CH.makeCharacter('CIPHER'), 0).reason === 'karma 비용 오류' &&
  CH.payNuyen(CH.makeCharacter('CIPHER'), 0).reason === '₵ 비용 오류' &&
  CH.spendKarma(CH.makeCharacter('CIPHER'), 'hack').reason === 'karma 부족');

// ② dialogue.evalCost 확장 — karma 사유 표기 byte 불변 + ₵ 신규.
var nc = { label: 'x', effect: { skipCombat: true, spendNuyen: 3 }, show: 'gray' };
ok('357. evalCost: ₵ 부족 → ok:false, 충족 → ok:true · cost {karma,nuyen} 노출 · 미선언은 항상 ok',
  DLG.evalCost(nc, { nuyen: 2 }).ok === false && DLG.evalCost(nc, { nuyen: 3 }).ok === true &&
  DLG.evalCost(nc, {}).ok === false &&                       // 구 컨텍스트(₵ 미제공) → 부족 판정(안전)
  DLG.evalCost(nc, { nuyen: 3 }).cost.nuyen === 3 && DLG.evalCost(nc, { nuyen: 3 }).cost.karma === 0 &&
  DLG.evalCost({ label: 'y' }, { nuyen: 0 }).ok === true &&
  DLG.evalCost({ label: 'y' }, { nuyen: 0 }).cost.nuyen === 0);
ok('358. choiceState/Reason ₵: 미충족 → gray + "[₵ 3 지출] (보유 2)" · 충족 → available/null · karma 사유 byte 불변',
  DLG.choiceState(nc, { nuyen: 2 }) === 'gray' && DLG.choiceState(nc, { nuyen: 3 }) === 'available' &&
  DLG.choiceReason(nc, { nuyen: 2 }) === '[₵ 3 지출] (보유 2)' &&
  DLG.choiceReason(nc, { nuyen: 3 }) === null &&
  DLG.choiceReason({ label: 'z', effect: { spendKarma: 1 } }, { karma: 0 }) === '[karma 1 지출] (보유 0)');

// ③ side-08 실경로 — 폴백 gate{def3} 회수 후 ₵3 단독 판정.
var s08 = CAMP.missionData('side-08-harbor-run');
var s08Choice = s08.dialogue.nodes.approach.choices[2];
ok('359. side-08 뇌물 출구 데이터 핀: effect.spendNuyen:3 보유 · 폴백 gate(def3) 제거됨(라벨=₵3 와 판정 일치)',
  s08Choice.effect.spendNuyen === 3 && s08Choice.gate === undefined && s08Choice.show === 'gray' &&
  s08Choice.effect.skipCombat === true && s08Choice.goto === 'outro');

// 대화 노드 직접 진입 헬퍼 — 해금/전투를 거치지 않고 선택 시점 상태만 세운다(라우팅 계약 검사용).
function atNode(missionId, nodeId, classKey, mut) {
  var st = S.rpgInitialState();
  st.save.character = CH.makeCharacter(classKey || 'CIPHER');
  st.save.karma = st.save.character.karma; st.save.nuyen = st.save.character.nuyen;
  st.dialogue = { missionId: missionId, nodeId: nodeId, openingSeen: true };
  st.scene = 'dialogue';
  if (mut) mut(st);
  return st;
}
var n0 = atNode('side-08-harbor-run', 'approach', 'CIPHER', function (st) {
  st.save.character.nuyen = 2; st.save.nuyen = 2;
});
ok('360. dialogueCtx 가 ₵ 잔량을 노출 · ₵ 2 < 3 → 선택지 gray (DEF 무관 — CIPHER DEF1 도 돈만 있으면 열린다)',
  S.dialogueCtx(n0).nuyen === 2 && DLG.choiceState(s08Choice, S.dialogueCtx(n0)) === 'gray' &&
  DLG.choiceState(s08Choice, S.dialogueCtx(atNode('side-08-harbor-run', 'approach', 'CIPHER',
    function (st) { st.save.character.nuyen = 3; st.save.nuyen = 3; }))) === 'available');
var n0after = S.dialogueChoose(n0, 2);
ok('361. ₵ 2 로 진입 시도 → blocked 반려 · 노드 이동 0 · flag 미설정 · ₵ 무변동 (조용한 차감 실패 없음)',
  n0after.banner.kind === 'blocked' && n0after.dialogue.nodeId === 'approach' &&
  !n0after.save.flags.checkpointBribed && n0after.save.character.nuyen === 2 && n0after.save.nuyen === 2);
var n1 = atNode('side-08-harbor-run', 'approach', 'CIPHER', function (st) {
  st.save.character.nuyen = 4; st.save.nuyen = 4;
});
var n1after = S.dialogueChoose(n1, 2);
ok('362. ₵ 4 충족 → 실차감(4→1) · save.nuyen 미러 동기 · outro 라우팅 · checkpointBribed 설정 · karma 무변동',
  n1after.save.character.nuyen === 1 && n1after.save.nuyen === 1 &&
  n1after.dialogue.nodeId === 'outro' && n1after.save.flags.checkpointBribed === true &&
  n1after.save.character.karma === 0);

console.log('\n== [73차] 대화 선택지 karma/₵ 지급 (effect.karma · effect.nuyen) — firstRun 가드 ==');

// ④ 데이터 핀 — 배선 대상 5건이 실제로 선언돼 있는지(사문 아님) + 전수 스캔 개수 일치.
var GIVE = [
  { id: 'a2-d2-last-signal', node: 'choice', idx: 1, res: 'karma', n: 1 },
  { id: 'a2-side-mole-whoami', node: 'choice', idx: 0, res: 'karma', n: 1 },
  { id: 'a2-side-broker-ledger', node: 'choice', idx: 0, res: 'karma', n: 1 },
  { id: 'a2-side-drifter-lastroad', node: 'choice', idx: 1, res: 'karma', n: 1 },
  { id: 'a2-d1-scavenge', node: 'choice', idx: 1, res: 'nuyen', n: 6 },
];
ok('363. 지급 5건 데이터 핀: karma 4건(d2/mole/broker/drifter) + ₵ 1건(d1-scavenge) · 선언 수치 그대로',
  GIVE.every(function (g) {
    var c = CAMP.missionData(g.id).dialogue.nodes[g.node].choices[g.idx];
    return c && c.effect && c.effect[g.res] === g.n && c.goto === 'settle';
  }));

// 전 미션 전수 — 비용/지급 선언 집합이 정확히 6건(72차 karma 비용 1건 + 73차 6건 중 비용 1은 중복 제외).
var costGated73 = [], giveGated73 = [], costFree73 = 0;
CAMP.MISSIONS.forEach(function (reg) {
  var mm = CAMP.missionData(reg.id); if (!mm || !mm.dialogue) return;
  Object.keys(mm.dialogue.nodes).forEach(function (nid) {
    (mm.dialogue.nodes[nid].choices || []).forEach(function (cc, ci) {
      var e = cc.effect || {}, where = reg.id + '/' + nid + '#' + ci;
      if (e.spendKarma || e.spendNuyen) costGated73.push(where);
      if (typeof e.karma === 'number' || typeof e.nuyen === 'number') giveGated73.push(where);
      if (e.spendKarma || e.spendNuyen) return;
      costFree73++;
      // 비용 미선언 선택지는 karma/₵ 보유량과 무관하게 판정 불변(evalCost 확장이 기존 판정을 안 건드린다).
      if (DLG.choiceState(cc, { attrs: {}, tags: [], flags: {}, karma: 0, nuyen: 0 }) !==
          DLG.choiceState(cc, { attrs: {}, tags: [], flags: {} })) costFree73 = -99999;
    });
  });
});
ok('364. 전 미션 비용 선언 = 2건(ch07 spendKarma · side-08 spendNuyen) · 지급 선언 = 5건 (grep 전수 일치)',
  costGated73.length === 2 && costGated73.indexOf('ch07-heart-of-city/approach#1') >= 0 &&
  costGated73.indexOf('side-08-harbor-run/approach#2') >= 0 && giveGated73.length === 5);
ok('365. 비용 미선언 선택지 ' + costFree73 + '건은 karma/₵ 보유량과 무관하게 판정 불변 (기존 32미션 회귀)',
  costFree73 > 200);

// ⑤ 실지급 — karma 4건 · ₵ 1건. 선택 직후 settle(applyRewards)가 미션 정산을 얹으므로
//   '지급 배선'만 분리 측정한다: 같은 노드의 형제 선택지(지급 미선언)와의 델타 = 선언 수치.
function pickDelta(id, node, giveIdx, siblingIdx, res, replay) {
  function run(i) {
    return S.dialogueChoose(atNode(id, node, 'CIPHER', function (st) {
      if (replay) st.save.missionsDone = [id];
    }), i);
  }
  var a = run(giveIdx), b = run(siblingIdx);
  return { delta: a.save.character[res] - b.save.character[res], state: a, sibling: b };
}
var gk = pickDelta('a2-d2-last-signal', 'choice', 1, 0, 'karma');
ok('366. a2-d2-last-signal B → karma 델타 정확히 +1 (형제 선택지 대비) · save.karma 미러 · ruinDeterrent · settle 라우팅',
  gk.delta === 1 && gk.state.save.karma === gk.state.save.character.karma &&
  gk.state.save.flags.ruinDeterrent === true && gk.state.dialogue.nodeId === 'settle');
var gn = pickDelta('a2-d1-scavenge', 'choice', 1, 0, 'nuyen');
ok('367. a2-d1-scavenge B → ₵ 델타 정확히 +6 (선언 수치 그대로, 가감 0) · save.nuyen 미러 · ruinExitFund',
  gn.delta === 6 && gn.state.save.nuyen === gn.state.save.character.nuyen &&
  gn.state.save.flags.ruinExitFund === true &&
  CAMP.missionData('a2-d1-scavenge').dialogue.nodes.choice.choices[1].effect.nuyen === 6);
// 지급 4건 전량 실동 — karma 선언 미션 4종이 모두 실제로 +1 델타를 남긴다(배선 누락 1건도 없음).
var KARMA_GIVE = [
  { id: 'a2-d2-last-signal', give: 1, sib: 0 }, { id: 'a2-side-mole-whoami', give: 0, sib: 1 },
  { id: 'a2-side-broker-ledger', give: 0, sib: 1 }, { id: 'a2-side-drifter-lastroad', give: 1, sib: 0 },
];
ok('368. karma 지급 4건 전량 실동: d2-last-signal · mole-whoami · broker-ledger · drifter-lastroad 각 델타 +1',
  KARMA_GIVE.every(function (g) { return pickDelta(g.id, 'choice', g.give, g.sib, 'karma').delta === 1; }));

// ⑥ farming 차단 — 재클리어(missionsDone 포함) 시 지급 생략 + 로그 1줄. rep 선례와 동일 가드.
var rk = pickDelta('a2-d2-last-signal', 'choice', 1, 0, 'karma', true);
var rn = pickDelta('a2-d1-scavenge', 'choice', 1, 0, 'nuyen', true);
ok('369. 재클리어 farming 차단: 대화 재통과해도 karma/₵ 델타 0 (missionsDone 포함 → firstRun false)',
  rk.delta === 0 && rn.delta === 0 &&
  KARMA_GIVE.every(function (g) { return pickDelta(g.id, 'choice', g.give, g.sib, 'karma', true).delta === 0; }));
//   [74차 개정] 형제 선택지(rep 4 선언)도 이제 같은 고지를 받는다 — 73차엔 rep 이 표 밖이라
//   0줄이었다. '지급 선언이 있는 모든 선택지는 정확히 1줄' 이 74차 통일 후의 계약이다.
ok('370. 재클리어 시 조용한 무시 금지 — 지급 선언 선택지는 정산 로그에 "재클리어 … 미지급" 정확히 1줄',
  !!rk.state.banner && Array.isArray(rk.state.banner.lines) &&
  rk.state.banner.lines.filter(function (l) { return /재클리어 — 대화 선택 보상 미지급/.test(l); }).length === 1 &&
  rk.sibling.banner.lines.filter(function (l) { return /재클리어 — 대화 선택 보상 미지급/.test(l); }).length === 1);
ok('371. 지급은 flag/라우팅과 독립 — 재클리어에서도 서사 flag·settle 라우팅은 그대로 (분기 소실 없음)',
  rk.state.save.flags.ruinDeterrent === true && rk.state.dialogue.nodeId === 'settle' &&
  rn.state.save.flags.ruinExitFund === true && rn.state.dialogue.nodeId === 'settle');
ok('372. 지급 로그가 settle 정산 배너에 흡수되지 않고 맨 앞에 합류 (얻은 것/낸 것이 화면에서 사라지지 않음)',
  Array.isArray(gk.state.banner.lines) && /^◈ karma \+1 \(→/.test(gk.state.banner.lines[0]) &&
  gk.state.banner.lines.length > 1 &&
  /^◈ ₵ \+6 \(→6\)$/.test(gn.state.banner.lines[0]));
// rep 선례 회귀 — 73차 firstRun 공용화 후에도 rep 지급 가드가 그대로.
var repD = pickDelta('a2-d2-last-signal', 'choice', 0, 1, 'rep');
var repR = pickDelta('a2-d2-last-signal', 'choice', 0, 1, 'rep', true);
ok('373. rep 선례 회귀: 최초 완주 델타 +4 · 재클리어 델타 0 (73차 firstRun 공용화가 기존 rep 가드를 안 바꾼다)',
  repD.delta === 4 && repR.delta === 0);

// ⑦ 마이그레이션 무관 — 73차 배선은 세이브 스키마를 늘리지 않는다(기존 필드만 소비).
var m73 = SAVE.migrate(JSON.parse(JSON.stringify(gk.state.save)));
ok('374. 마이그레이션 무관: 지급 후 세이브가 migrate 멱등 · karma/₵ 무손상 · export/import 왕복 동일',
  JSON.stringify(SAVE.migrate(JSON.parse(JSON.stringify(m73)))) === JSON.stringify(m73) &&
  m73.character.karma === gk.state.save.character.karma && m73.karma === m73.character.karma &&
  JSON.stringify(SAVE.importString(SAVE.exportString(m73)).save) === JSON.stringify(m73));
var newKeys = Object.keys(S.rpgInitialState().save).sort().join(',');
ok('375. 세이브 스키마 무증설: newSave 최상위 키 집합에 73차 신규 필드 0 (karma/nuyen 기존 미러만 사용)',
  newKeys === Object.keys(SAVE.migrate(JSON.parse(JSON.stringify(S.rpgInitialState().save)))).sort().join(',') &&
  newKeys.indexOf('karma') >= 0 && newKeys.indexOf('nuyen') >= 0);

// ⑧ 원자성 — 한 자원이라도 모자라면 어떤 자원도 깎이지 않는다(반쪽 차감 금지).
var bothCh = CH.makeCharacter('CIPHER'); bothCh.karma = 5; bothCh.nuyen = 1;
var bothCost = DLG.applyChoice({ label: 'b', effect: { spendKarma: 1, spendNuyen: 3 } },
  { attrs: {}, karma: 5, nuyen: 1 });
ok('376. 복합 비용 원자성: karma 충족 + ₵ 부족 → applyChoice blocked (부족한 쪽 사유) · 어느 자원도 미차감',
  bothCost.blocked === true && bothCost.reason === '[₵ 3 지출] (보유 1)' &&
  bothCh.karma === 5 && bothCh.nuyen === 1 &&
  DLG.applyChoice({ label: 'b', effect: { spendKarma: 1, spendNuyen: 3 } },
    { attrs: {}, karma: 5, nuyen: 3 }).cost.nuyen === 3);

// ⑨ UI 계약 핀 — 지출/지급 태그와 재클리어 표기가 표시층에 실재(사문 아님).
var uiFs = require('fs').readFileSync(__dirname + '/index.html', 'utf8');
ok('377. UI 태그 실재: 지출 태그(◈ … 지출) · 지급 태그(gain-tag ◈) · 재클리어 미지급 표기 · ₵/karma 양자 처리',
  /cost-tag/.test(uiFs) && /gain-tag/.test(uiFs) && /재클리어 미지급/.test(uiFs) &&
  /ce\.spendNuyen/.test(uiFs) && /ce\.spendKarma/.test(uiFs) &&
  /'₵ \+' \+ ce\.nuyen/.test(uiFs) && /'karma \+' \+ ce\.karma/.test(uiFs));

// ======  74차 — 대화 effect.rep 지급 로그 통일 (73차 잔여: 실지급 O · 로그 X)  ==============
console.log('\n== [74차] 대화 선택지 rep 지급 로그 — karma/₵ 와 동일 경로 통일 ==');

// ① 전수 스캔 — effect.rep 을 선언한 선택지 집합(데이터가 정본, 하드코딩 목록 금지).
var REP_GIVES = [];
CAMP.MISSIONS.forEach(function (reg) {
  var mm = CAMP.missionData(reg.id); if (!mm || !mm.dialogue) return;
  Object.keys(mm.dialogue.nodes).forEach(function (nid) {
    (mm.dialogue.nodes[nid].choices || []).forEach(function (cc, ci) {
      if (cc.effect && typeof cc.effect.rep === 'number' && cc.effect.rep)
        REP_GIVES.push({ id: reg.id, node: nid, idx: ci, n: cc.effect.rep });
    });
  });
});
function repRun(g, replay) {
  return S.dialogueChoose(atNode(g.id, g.node, 'CIPHER', function (st) {
    if (replay) st.save.missionsDone = [g.id];
  }), g.idx);
}
function bannerLines(st) {
  if (!st.banner) return [];
  return Array.isArray(st.banner.lines) ? st.banner.lines : (st.banner.text ? [st.banner.text] : []);
}
ok('378. effect.rep 선언 전수 = ' + REP_GIVES.length + '건 (73차까지 전량 무로그) · 모두 지급 노드로 라우팅',
  REP_GIVES.length === 12 && REP_GIVES.every(function (g) {
    return CAMP.missionData(g.id).dialogue.nodes[g.node].choices[g.idx].goto === 'settle';
  }));

// ② 최초 완주 — 지급 수치 무변경 + karma/₵ 와 동일한 ★ 태그 1줄 + 정산 로그 맨 앞 합류.
var repFail = REP_GIVES.filter(function (g) {
  var st = repRun(g, false), ls = bannerLines(st);
  return !(st.save.character.rep >= g.n && ls[0] === '◈ ★ +' + g.n + ' (→' + g.n + ')' && ls.length > 1);
}).map(function (g) { return g.id + '/' + g.node + '#' + g.idx; });
ok('379. rep 지급 ' + REP_GIVES.length + '건 전량 로그 실동: 배너 첫 줄이 "◈ ★ +n (→n)" · 정산 로그 앞에 합류 (누락 '
  + repFail.length + '건)', repFail.length === 0);
ok('380. 지급 수치 무변경 — 로그 통일이 rep 델타를 건드리지 않는다 (73차 회귀: d2 +4 · ch03 +10)',
  repRun({ id: 'a2-d2-last-signal', node: 'choice', idx: 0 }, false).save.character.rep >= 4 &&
  /^◈ ★ \+10 \(→10\)$/.test(bannerLines(repRun({ id: 'ch03-martial-night', node: 'choice', idx: 1 }, false))[0]));

// ③ 재클리어 — 취소선 고지(로그 1줄) + 델타 0. karma/₵ 와 완전 동일한 firstRun 가드.
var repReplayFail = REP_GIVES.filter(function (g) {
  var ls = bannerLines(repRun(g, true));
  return !(ls.filter(function (l) { return l === '↻ 재클리어 — 대화 선택 보상 미지급 (★ +0)'; }).length === 1 &&
           ls.filter(function (l) { return /^◈ ★ \+/.test(l); }).length === 0);
}).map(function (g) { return g.id + '/' + g.node + '#' + g.idx; });
ok('381. 재클리어 고지 ' + REP_GIVES.length + '건 전량: "↻ 재클리어 … 미지급 (★ +0)" 1줄 · ★ 지급줄 0 (누락 '
  + repReplayFail.length + '건)', repReplayFail.length === 0);

// ④ 재클리어 고지의 자원 목록은 '선언된 자원'만 — rep 합류로 karma/₵ 고정 문구를 쓸 수 없게 됐다.
//    (73차엔 선언과 무관하게 항상 '(karma/₵ +0)'. 74차는 선언 집합으로 좁혀 정직하게 표기.)
function replayNotice(id, node, idx) {
  return bannerLines(repRun({ id: id, node: node, idx: idx }, true)).filter(function (l) {
    return /^↻ 재클리어 — 대화 선택/.test(l); })[0];   // settle 정산의 '축소 보상' 줄과 구분
}
ok('382. 재클리어 고지가 선언 자원만 나열: rep 단독 "(★ +0)" · karma 단독 "(karma +0)" · ₵ 단독 "(₵ +0)"',
  replayNotice('a2-d2-last-signal', 'choice', 0) === '↻ 재클리어 — 대화 선택 보상 미지급 (★ +0)' &&
  replayNotice('a2-d2-last-signal', 'choice', 1) === '↻ 재클리어 — 대화 선택 보상 미지급 (karma +0)' &&
  replayNotice('a2-d1-scavenge', 'choice', 1) === '↻ 재클리어 — 대화 선택 보상 미지급 (₵ +0)');

// ⑤ 지급 미선언 선택지는 여전히 무로그 — 통일이 '모든 선택지에 잡음'을 뿌리지 않는다.
//    (ch03 잠행 = effect.wantedZero 만 선언 — rep/karma/₵ 어느 것도 없는 순수 서사 선택지)
var quiet = repRun({ id: 'ch03-martial-night', node: 'choice', idx: 0 }, false);
var quietR = repRun({ id: 'ch03-martial-night', node: 'choice', idx: 0 }, true);
ok('383. 지급 미선언 선택지는 지급/재클리어 줄 0 (조용함이 정상인 경로 무변경) · 정산 로그는 그대로',
  bannerLines(quiet).filter(function (l) { return /^◈ ★|^↻ 재클리어 — 대화 선택/.test(l); }).length === 0 &&
  bannerLines(quietR).filter(function (l) { return /^◈ ★|^↻ 재클리어 — 대화 선택/.test(l); }).length === 0 &&
  bannerLines(quiet).length > 0 && quiet.dialogue.nodeId === 'settle');

// ⑥ 서사 flag·라우팅 독립 — 로그 통일이 분기를 건드리지 않는다(재클리어에서도 flag 그대로).
var repFlagged = repRun({ id: 'a2-d2-last-signal', node: 'choice', idx: 0 }, true);
ok('384. rep 재클리어에서도 서사 flag(ruinSealed·harvesterChoice)·settle 라우팅 무손상 (분기 소실 0)',
  repFlagged.save.flags.ruinSealed === true && repFlagged.save.flags.harvesterChoice === 'destroy' &&
  repFlagged.dialogue.nodeId === 'settle');

// ⑦ UI 계약 핀 — ★ 태그와 재클리어 취소선이 표시층에 실재(사문 아님).
ok('385. UI 태그 실재: 선택지 지급 태그에 ★ 합류(★ +n) · 재클리어 미지급 취소선(.gain-tag.spent line-through)',
  /'★ \+' \+ ce\.rep/.test(uiFs) && /gain-tag\.spent[^}]*line-through/.test(uiFs) &&
  /재클리어 미지급/.test(uiFs));

// ⑧ 74차 juice — 전투 연출은 표시층 전용. CSS 실재 + reduced-motion 차단 + transform/opacity 한정.
var cssFs = require('fs').readFileSync(__dirname + '/styles/app.css', 'utf8');
var juice74 = cssFs.slice(cssFs.indexOf('[74차] 전투 juice'));
ok('386. juice CSS 실재: 사수 펄스(survTick) · 오브젝티브 롤다운(objRoll) · 시그널 플립(sigFlip) · 파편(shardOut/shardIn)',
  /@keyframes survTick/.test(cssFs) && /@keyframes objRoll/.test(cssFs) &&
  /@keyframes sigFlip/.test(cssFs) && /@keyframes shardOut/.test(cssFs) && /@keyframes shardIn/.test(cssFs) &&
  /sigFlip .38s ease-out, surgeGlow/.test(cssFs));
ok('387. juice 재생 트리거는 React key(값 변화 프레임에만 1회) — JS 타이머/상태 0',
  /key=\{'sv' \+ survHeld\}/.test(uiFs) && /key=\{'sg' \+ sig\.key\}/.test(uiFs) &&
  /key=\{'ob' \+ objShown\}/.test(uiFs) && /key=\{'oh' \+ objShown\}/.test(uiFs));
ok('388. juice reduced-motion 전면 차단 (74차 4종 전부 prefers-reduced-motion 블록에 등재)',
  /prefers-reduced-motion/.test(juice74) &&
  /\.combat-top \.obj\.surv, \.objnum, \.sigpill, \.sigpill\.sig-SURGE,\s*\n\s*\.dissolve::before, \.dissolve::after \{ animation: none !important; \}/.test(juice74));
//    키프레임 본문만 떼어 검사한다(@keyframes … 부터 열 0 의 닫는 중괄호까지 — 퍼센트 블록은 한 줄).
var kfBodies74 = juice74.match(/@keyframes\s+\w+\s*\{[\s\S]*?\n\}/g) || [];
ok('389. juice 키프레임 ' + kfBodies74.length + '종의 애니메이션 속성이 transform/opacity 한정 (레이아웃/페인트 유발 0 — 모바일 60fps)',
  kfBodies74.length === 5 &&
  ['width','height','margin','padding','top:','left:','right:','bottom:','filter','box-shadow','clip-path','background']
    .every(function (prop) {
      return kfBodies74.every(function (kf) { return kf.indexOf(prop) < 0; });
    }));

// ============================================================================
// ======  [3차 발굴 감사] F1~F13 수정 회귀 — 부트 하이드레이트 · Heat 경제 · 레지스트리 정합  ==
// ============================================================================
console.log('\n== [3차 발굴] LOAD_SAVE 리듀서 — 구세이브 마이그레이션 하이드레이트 ==');
// ① LOAD_SAVE: 진행 중 씬 무관 허브 복귀 + 세이브 치환 + 복원 배너(조용한 복원 금지).
var loadSrc = S.rpgInitialState();
loadSrc.scene = 'dialogue'; loadSrc.dialogue = { missionId: 'ch01-first-blood', nodeId: 'intro' };
var loadedSave = SAVE.migrate({ version: 1, character: CH.makeCharacter('BLADE'), flags: { firstBlood: true } });
var loadedSt = S.rpgReducer(loadSrc, { type: 'LOAD_SAVE', save: loadedSave });
ok('390. LOAD_SAVE 리듀서: 허브 복귀 · dialogue/combat 해제 · 세이브 치환 · 복원 배너',
  loadedSt.scene === 'hub' && loadedSt.dialogue === null && loadedSt.combat === null &&
  loadedSt.save.character.classKey === 'BLADE' && loadedSt.banner && loadedSt.banner.kind === 'load');
ok('391. LOAD_SAVE 구세이브 경로: migrate 백필(firstBlood→ch01 추론 · heat 0/heatCap 10 · endings/intel/abyss)',
  loadedSt.save.missionsDone.indexOf('ch01-first-blood') >= 0 && loadedSt.save.heat === 0 &&
  loadedSt.save.heatCap === 10 && typeof loadedSt.save.endings === 'object' &&
  typeof loadedSt.save.intel === 'object' && loadedSt.save.abyss.best === 0);

console.log('\n== [3차 발굴 F1] 부트 하이드레이트 — 자동세이브 덮어쓰기 방지 (localStorage mock) ==');
(function () {
  var mockStore = {};
  global.localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mockStore, k) ? mockStore[k] : null; },
    setItem: function (k, v) { mockStore[k] = String(v); },
    removeItem: function (k) { delete mockStore[k]; },
  };
  try {
    // 이전 세션: 진행된 자동세이브 존재.
    var prev = S.newSave(); prev.missionsDone = ['ch01-first-blood']; prev.character.rep = 9;
    ok('392. (사전) localStorage mock 에 이전 세션 자동세이브 기록', SAVE.saveLocal(prev) === true);
    // index.html App 부트 시퀀스 재현: loadLocal 성공 → LOAD_SAVE 하이드레이트 → 마운트 자동세이브.
    var boot = S.rpgInitialState();
    var disk = SAVE.loadLocal();
    var hydrated = disk ? S.rpgReducer(boot, { type: 'LOAD_SAVE', save: disk }) : boot;
    SAVE.saveLocal(hydrated.save);          // 자동세이브 useEffect(scene==='hub') 재현
    var after = SAVE.loadLocal();
    ok('393. F1 회귀: 부트 하이드레이트 후 자동세이브가 이전 진행 보존(newSave 덮어쓰기 소실 0)',
      hydrated.scene === 'hub' && after.missionsDone.indexOf('ch01-first-blood') >= 0 && after.character.rep === 9);
  } finally { delete global.localStorage; }
})();
// UI 계약 핀 — App 부트 초기화가 loadLocal 하이드레이트 + "자동 불러오기" 배너를 실제 보유(사문 아님).
var fixFs = require('fs').readFileSync(__dirname + '/index.html', 'utf8');
ok('394. F1 UI 계약: App 초기화에 SAVE.loadLocal → LOAD_SAVE 하이드레이트 + 자동 불러오기 배너 실재',
  /const s = SAVE\.loadLocal\(\);/.test(fixFs) && /\{ type: 'LOAD_SAVE', save: s \}/.test(fixFs) &&
  /자동 불러오기/.test(fixFs));

console.log('\n== [3차 발굴 F3] Heat 경제 배선 — 정산 +1 · cap 클램프 · wantedZero 소거 ==');
var heatSave = S.newSave();
var heatR1 = CAMP.applyRewards(heatSave, CAMP.missionData('ch01-first-blood'));
ok('395. 미션 정산 heat +1 (계승 docs/07 §8 "레이드 성공: 공권력 +1") + 정산 로그 1줄',
  heatR1.heat === 1 && heatR1.log.some(function (l) { return l.indexOf('공권력(Heat) +1') >= 0; }));
var heatSave2 = S.newSave(); heatSave2.heat = 99; heatSave2.heatCap = 10; heatSave2.missionsDone = ['ch01-first-blood'];
ok('396. heat cap 클램프 — 정산이 heatCap 을 초과하지 않음("96/10" 류 표기 원천 차단)',
  CAMP.applyRewards(heatSave2, CAMP.missionData('ch01-first-blood')).heat === 10);
// wantedZero 실배선: ch01 유령 선택(B)이 heat 를 0 으로 소거(가시 로그) → settle 정산 +1 이 위에 얹힘.
var wzSt = atNode('ch01-first-blood', 'choice', 'CIPHER', function (st) { st.save.heat = 7; st.save.heatCap = 11; });
var wzAfter = S.dialogueChoose(wzSt, 1);
ok('397. effect.wantedZero 실배선: heat 7 → 소거 0 → settle 정산 +1 = 1 · "현상수배 소거" 로그(미배선 해소)',
  wzAfter.save.heat === 1 &&
  bannerLines(wzAfter).some(function (l) { return l.indexOf('현상수배 소거') >= 0; }));
ok('398. wantedZero heat 0 경로 잡음 0 — heat 0 이면 소거 로그 미출력(기존 배너 계약 불변)',
  bannerLines(S.dialogueChoose(atNode('ch01-first-blood', 'choice', 'CIPHER'), 1))
    .every(function (l) { return l.indexOf('현상수배 소거') < 0; }));
// 구세이브 백필 — heat/heatCap 부재 → 0/10, 초과분 cap 클램프(멱등).
var heatLegacy = SAVE.migrate({ version: 1, character: S.newSave().character, flags: {} });
var heatOver = SAVE.migrate({ version: 1, character: S.newSave().character, flags: {}, heat: 96, heatCap: 10 });
ok('399. migrate 백필: heat/heatCap 부재 → 0/10 · 초과분 cap 클램프 · 멱등',
  heatLegacy.heat === 0 && heatLegacy.heatCap === 10 && heatOver.heat === 10 &&
  SAVE.migrate(JSON.parse(JSON.stringify(heatOver))).heat === 10);

console.log('\n== [3차 발굴 F2/F4/F11] 레지스트리 정합 회귀 ==');
// F2 — 에필로그 클래스별 완주 표 = classes.PLAYABLE 6종 전량(BROKER/DRIFTER 하드코딩 누락 복원).
var f2Save = S.newSave();
f2Save.endings = END.recordEnding(undefined, 'dead-nexus', 'BROKER');
var f2Stat = END.campaignStats(f2Save);
ok('400. F2 회귀: classClears = PLAYABLE ' + CL.PLAYABLE.length + '종 전량 · BROKER 완주 표시 복원',
  f2Stat.classClears.length === CL.PLAYABLE.length &&
  f2Stat.classClears.some(function (c) { return c.classKey === 'BROKER' && c.done === true; }) &&
  f2Stat.classClears.some(function (c) { return c.classKey === 'DRIFTER' && c.done === false; }));
// F4 — 정보상 목록에 board.act2 합류(UI 계약 핀) + 해금 Act2 미션 인텔 구매 실동.
var f4St = S.rpgInitialState();
f4St.save.missionsDone = ['ch01-first-blood', 'ch02-insider-game', 'ch03-martial-night', 'ch04-price-of-splice',
  'ch05-mesh-ghost', 'ch06-bloc-acquisition', 'ch07-heart-of-city', 'ch08-zero-day'];
f4St.save.character.nuyen = 50; f4St.save.nuyen = 50;
var f4After = S.buyIntel(f4St, 'a2-00-framing');
ok('401. F4 회귀: 해금 Act2 미션 인텔 구매 실동 + 정보상 행 목록에 board.act2 합류(UI 핀)',
  f4After.save.intel['a2-00-framing'] === true &&
  /board\.mains\.concat\(board\.sides\)\.concat\(board\.act2 \|\| \[\]\)/.test(fixFs));
// F11 — 메인/사이드 분류 레지스트리 기반: a2-side-*(branch class) = 사이드, a2 갈래/framing = 메인.
var f11Stat = END.campaignStats({ missionsDone: ['ch01-first-blood', 'side-01-traitor-contract',
  'a2-side-cipher-static', 'a2-00-framing', 'a2-a1-crown-breach'] });
ok('402. F11 회귀: a2-side-* 사이드 분류(side 2) · a2 갈래/framing 메인 분류(main 3)',
  f11Stat.mainCleared === 3 && f11Stat.sideCleared === 2);

console.log('\n== [3차 발굴 F14] resolveCombat 패배 분기 · accrueThreat SURGE 가속 ==');
// 일반 미션 패배 → 허브 귀환(재시도) + 안전가옥 배너(조용한 실패 금지).
var loseSt = S.rpgInitialState();
loseSt.scene = 'combat';
loseSt.combat = S.buildCombat(MI.MISSION, CH.makeCharacter('CIPHER'), 'outro');
loseSt.combat.outcome = 'lose';
var loseAfter = S.resolveCombat(loseSt);
ok('403. 일반 미션 lose 분기: 허브 귀환 · combat 해제 · "미션 실패 — 안전가옥으로 귀환" 배너',
  loseAfter.scene === 'hub' && loseAfter.combat === null &&
  loseAfter.banner && loseAfter.banner.kind === 'fail' &&
  loseAfter.banner.text === '미션 실패 — 안전가옥으로 귀환');
// SURGE 가속: 동일 노출 상황에서 UP 대비 위협 +1 추가(노출 2배 가속 분기).
function threatAfterOneRound(sigState) {
  var c = S.buildCombat(MI.MISSION, CH.makeCharacter('BLADE'), 'outro');
  var p = S.player(c); p.x = 4; p.y = 7; p.hp = 99; p.maxHp = 99; // 개방 타일 노출 · 생존 고정
  c.signal = sigState;
  return S.runEnemyTurn(c).threat.value;
}
var thUp = threatAfterOneRound(SIG.STATES.UP);
var thSurge = threatAfterOneRound(SIG.STATES.SURGE);
ok('404. accrueThreat ⚡SURGE 가속: 동일 노출 라운드 UP +' + thUp + ' 대비 SURGE +' + thSurge + ' (= +1 가속)',
  thUp >= 1 && thSurge === thUp + 1);

console.log('\n== 결과 ==');
console.log('PASS ' + pass + ' / FAIL ' + fail + (fail ? ('  →  ' + fails.join('; ')) : ''));
process.exit(fail ? 1 : 0);
