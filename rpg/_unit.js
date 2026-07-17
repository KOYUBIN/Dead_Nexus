'use strict';
// ============================================================================
// rpg/_unit.js — RPG 모드 Stage 1 순수 로직 유닛 테스트 (node 실행, 의존성 0)
//   실행: node rpg/_unit.js
//   대상: 결정론 피해식 · BFS 이동범위 · AP 소모 · 텔레그래프 예측=실행 일치 ·
//         스탯 게이트 · 엄폐 · 상성 · 오브젝티브 · 성장 반영 · 세이브 라운드트립 ·
//         MFU(사회 게이트가 전투 제거) 통합.
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

console.log('\n== 결과 ==');
console.log('PASS ' + pass + ' / FAIL ' + fail + (fail ? ('  →  ' + fails.join('; ')) : ''));
process.exit(fail ? 1 : 0);
