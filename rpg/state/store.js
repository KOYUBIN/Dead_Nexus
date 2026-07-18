;(function () {
  'use strict';
  // ==========================================================================
  // state/store.js — 단일 진실원천 리듀서 + 씬 라우터 + 전투 오케스트레이션
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 로직 (JSX 아님). React.useReducer 가 rpgReducer 를 구동한다(ui/App).
  // 씬: 'hub' | 'dialogue' | 'combat' | 'epilogue'
  // 전투 스텝(applyMove/applyAttack/applyHackObjective/runEnemyTurn)은 순수 함수 →
  // 유닛테스트에서 직접 검증(AP 소모·결정론 피해·텔레그래프=실행).
  // ==========================================================================

  function deps() {
    var w = (typeof window !== 'undefined') ? window : null;
    if (w && w.RPG_GRID) {
      return { G: w.RPG_GRID, R: w.RPG_RESOLVE, AI: w.RPG_AI, ATTR: w.RPG_ATTRS,
        DLG: w.RPG_DIALOGUE, CH: w.RPG_CHARACTER, CAMP: w.RPG_CAMPAIGN,
        AB: w.RPG_ABILITIES, EN: w.RPG_ENEMIES, MI: w.RPG_MISSION_CH01,
        SIG: w.RPG_SIGNAL, CL: w.RPG_CLASSES };
    }
    return { G: require('../systems/combat/grid.js'), R: require('../systems/combat/resolve.js'),
      AI: require('../systems/combat/ai.js'), ATTR: require('../data/attributes.js'),
      DLG: require('../systems/dialogue.js'), CH: require('../systems/character.js'),
      CAMP: require('../systems/campaign.js'), AB: require('../data/abilities.js'),
      EN: require('../data/enemies.js'), MI: require('../data/missions/ch01-first-blood.js'),
      SIG: require('../data/signal.js'), CL: require('../data/classes.js') };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // 플레이어 유닛 내부 id (클래스 무관 — CIPHER/BLADE 공통 핸들).
  var PLAYER_ID = 'hero';

  // ---- 초기 상태 / 새 게임 --------------------------------------------------
  function newSave() {
    var D = deps();
    var ch = D.CH.makeCharacter('CIPHER');
    return {
      version: 1,
      character: ch,
      inventory: [], flags: {}, missionsDone: [],
      heat: 0, heatCap: 10, crew: [], hubState: { node: 'root' },
      karma: ch.karma, nuyen: ch.nuyen, // §5.3 명시 필드 미러(캐릭터가 정본)
    };
  }

  function rpgInitialState() {
    return {
      scene: 'hub',
      save: newSave(),
      dialogue: null,
      combat: null,
      hub: { node: 'root' },
      banner: null,
      log: [],
    };
  }

  // ---- 전투 빌드 ------------------------------------------------------------
  function buildCombat(mission, character, onWin) {
    var D = deps();
    var eff = D.CH.effectiveStats(character);
    var c = mission.combat;
    var kit = character.kit.slice();
    // [계승 chapter-01/blade.md] 보상 해금 시그니처(무력 강습 오브젝티브 보너스).
    var objBonusAbility = kit.indexOf('BACKDOOR') >= 0 ? 'BACKDOOR'
                        : (kit.indexOf('VENDETTA') >= 0 ? 'VENDETTA' : null);
    var player = {
      id: PLAYER_ID, side: 'player', name: character.classKey, icon: character.icon || '👤',
      classKey: character.classKey, codename: character.codename || character.classKey,
      signalFavor: character.signalFavor || 'mesh',
      x: c.playerStart.x, y: c.playerStart.y,
      hp: eff.maxHp, maxHp: eff.maxHp,
      atk: eff.atk, def: eff.def, spd: eff.spd, hack: eff.hack,
      mov: eff.mov, ap: eff.ap, maxAp: eff.ap, attr: eff.primary,
      status: {}, cooldowns: {}, ultUsed: false, objBonusAbility: objBonusAbility,
      kit: kit,
    };
    var units = [player];
    for (var i = 0; i < c.enemies.length; i++) {
      var t = D.EN.ENEMIES[c.enemies[i].key];
      units.push(spawnEnemy(D, t, c.enemies[i].x, c.enemies[i].y, 'e' + i));
    }
    // 첫 공격 가능 시그니처를 기본 선택(CIPHER→해킹샷, BLADE→POINT BLANK).
    var firstAtk = kit.filter(function (k) { var a = D.AB.ABILITIES[k]; return a && a.kind !== 'PASSIVE' && a.kind !== 'ULTIMATE'; })[0] || kit[0];
    var sig1 = sigForRound(D, 1);
    var combat = {
      field: { cols: c.cols, rows: c.rows, walls: c.walls.slice(), cover: c.cover.slice() },
      units: units,
      objective: { x: c.objective.x, y: c.objective.y,
        threshold: c.objective.threshold + (c.objective.veil || 0),
        max: c.objective.threshold + (c.objective.veil || 0),
        label: c.objective.label, dataTB: c.objective.dataTB, done: false },
      turn: 'player', round: 1, selectedAbility: firstAtk,
      // [계승 docs/06 §7] 시그널 다이 4상태 (라운드 파생, 결정론).
      signal: sig1,
      // [G10, 각색 raidThreshold + docs/07 §8] 위협/노출 게이지 (전투 페이싱 실동).
      threat: { value: 0, cap: (c.threatCap || 8), alarm: false, reinforced: false,
        reinforcement: c.reinforcement || null },
      outcome: null, onWin: onWin, log: ['전투 개시 — VANTA 서버룸  ' + sig1.sym + ' ' + sig1.label],
      floaters: [],
    };
    combat.telegraphs = computeTelegraphs(combat);
    return combat;
  }

  function spawnEnemy(D, t, x, y, id) {
    return {
      id: id, side: 'enemy', key: t.key, name: t.name, icon: t.icon,
      x: x, y: y,
      hp: t.hp, maxHp: t.hp, atk: t.atk, def: t.def, spd: t.spd, hack: t.hack,
      mov: t.mov, ap: t.ap, maxAp: t.ap, attr: t.attr, range: t.range, ai: t.ai,
      isMachine: !!t.isMachine, physImmune: !!t.physImmune, hackOnly: !!t.hackOnly,
      status: {},
    };
  }

  // 시그널 다이 라운드 상태 파생 (null 가드 — SIG 미로드 시 UP 폴백).
  function sigForRound(D, round) {
    if (D.SIG && D.SIG.rollForRound) return D.SIG.rollForRound(round);
    return { key: 'UP', sym: '🔵', label: 'MESH UP', favor: 'mesh' };
  }

  function computeTelegraphs(combat) {
    var D = deps(), out = [];
    for (var i = 0; i < combat.units.length; i++) {
      var u = combat.units[i];
      if (u.side !== 'enemy' || u.hp <= 0) continue;
      if (u.status && u.status.stunTurns > 0) continue;
      var tg = D.AI.telegraphFor(stateForAI(combat), u.id);
      if (tg.attackTile || (tg.moveTile && (tg.moveTile.x !== u.x || tg.moveTile.y !== u.y))) out.push(tg);
    }
    return out;
  }

  // ai.js 가 기대하는 얕은 뷰 (field + units).
  function stateForAI(combat) { return { field: combat.field, units: combat.units }; }

  function findUnit(combat, id) { for (var i = 0; i < combat.units.length; i++) if (combat.units[i].id === id) return combat.units[i]; return null; }
  function player(combat) { return findUnit(combat, PLAYER_ID) || findUnit(combat, 'cipher'); }
  function aliveEnemies(combat) { return combat.units.filter(function (u) { return u.side === 'enemy' && u.hp > 0 && u.ai !== 'static'; }); }
  function threatEnemies(combat) { return combat.units.filter(function (u) { return u.side === 'enemy' && u.hp > 0; }); }

  // ---- 플레이어 액션 --------------------------------------------------------
  // 이동: 목적지가 이동범위(MOV칸) 내면 1 AP 소모하고 이동.
  function applyMove(combat, tile) {
    var D = deps(); var c = clone(combat); var p = player(c);
    if (c.outcome || p.ap < 1) return combat;
    var blocked = D.G.buildBlocked(c.field, c.units, p.id);
    var reach = D.G.bfsRange({ x: p.x, y: p.y }, p.mov, blocked, c.field.cols, c.field.rows);
    var k = tile.x + ',' + tile.y;
    if (reach[k] == null || reach[k] === 0) return combat; // 도달 불가
    p.x = tile.x; p.y = tile.y; p.ap -= 1;
    c.log.push('CIPHER 이동 → (' + tile.x + ',' + tile.y + ')  [AP ' + p.ap + ']');
    c.telegraphs = computeTelegraphs(c);
    return c;
  }

  // 시그널 다이 modifier 산출 (null 가드).
  function signalMods(D, c, p, useHack) {
    var sig = c.signal || sigForRound(D, c.round || 1);
    if (D.SIG && D.SIG.modifiers) return D.SIG.modifiers(sig.key, { useHack: !!useHack, favor: p.signalFavor });
    return { dmgBonus: 0, objectiveBonus: 0, affinityMult: 1, apBonus: 0, hackDisabled: false };
  }
  var HERO = function (p) { return p.codename || p.name || 'HERO'; };

  // 공격/시그니처. targetId = 적 유닛. ability = 능력 key.
  function applyAttack(combat, targetId, abilityKey) {
    var D = deps(); var c = clone(combat); var p = player(c);
    var ab = D.AB.ABILITIES[abilityKey];
    if (!ab || c.outcome) return combat;
    if (p.ap < ab.ap) return combat;
    if (p.cooldowns[abilityKey] > 0) return combat;
    if (ab.oncePerMission && p.ultUsed) return combat;

    // [계승 docs/06 §7] BLACKOUT: HACK 기반 행동 전부 불가.
    var sm = signalMods(D, c, p, ab.useHack);
    if (sm.hackDisabled) {
      c.log.push('⚫ BLACKOUT — ' + ab.name + ' (HACK) 사용 불가');
      c.floaters.push({ x: p.x, y: p.y, text: 'BLACKOUT', kind: 'miss' });
      return c;
    }

    // 궁극 (자기 대상) — 은신(ZERO TRACE) / 무적(LAST STAND). applyStatus 로 일반화.
    if (ab.kind === 'ULTIMATE') {
      var as = ab.applyStatus || {};
      if (as.stealth) { p.status.stealth = true; p.status.stealthTurns = as.turns; }
      if (as.invuln)  { p.status.invuln = true; p.status.invulnTurns = as.turns; }
      if (as.nextCrit) p.status.nextCrit = as.nextCrit;
      p.ap -= ab.ap; p.ultUsed = true;
      var ultTag = as.invuln ? (as.turns + '턴 무적') : (as.turns + '턴 은신');
      c.log.push(HERO(p) + ' ' + ab.name + ' — ' + ultTag);
      c.floaters.push({ x: p.x, y: p.y, text: as.invuln ? 'INVULN' : 'STEALTH', kind: 'buff' });
      c.telegraphs = computeTelegraphs(c);
      return c;
    }

    var tgt = findUnit(c, targetId);
    if (!tgt || tgt.side !== 'enemy' || tgt.hp <= 0) return combat;
    var dist = D.G.chebyshev(p, tgt);
    if (dist > ab.range) return combat;
    if (!D.G.lineOfSight(p, tgt, c.field)) return combat;
    if (tgt.physImmune && !ab.useHack) return combat; // ICE = 물리 무효

    // 디버프 (GLITCH / SUPPRESSION) — applyStatus 일반화 (defDown·coverNull·movDown).
    if (ab.kind === 'DEBUFF') {
      var st = ab.applyStatus || {};
      if (st.defDown)  tgt.status.defDown = (tgt.status.defDown || 0) + st.defDown;
      if (st.coverNull) tgt.status.coverNull = true;
      if (st.movDown)  tgt.status.movDown = (tgt.status.movDown || 0) + st.movDown;
      tgt.status.debuffTurns = st.turns;
      p.cooldowns[abilityKey] = ab.cooldown; p.ap -= ab.ap;
      var dparts = [];
      if (st.defDown) dparts.push('DEF−' + st.defDown);
      if (st.coverNull) dparts.push('엄폐 무효');
      if (st.movDown) dparts.push('이동−' + st.movDown);
      c.log.push(HERO(p) + ' ' + ab.name + ' → ' + tgt.name + ' ' + dparts.join(' & '));
      c.floaters.push({ x: tgt.x, y: tgt.y, text: ab.name, kind: 'debuff' });
      if (ab.loud) c.threat && (c.threat.noise = (c.threat.noise || 0) + 1);
      c.telegraphs = computeTelegraphs(c);
      return c;
    }

    // 공격 (해킹샷 / DATA SPIKE / POINT BLANK / DOUBLE TAP).
    var atkValue = ab.useHack ? p.hack : p.atk;
    var coverNull = !!tgt.status.coverNull;
    var cover = D.G.coverBonus(p, tgt, c.field, coverNull);
    // [각색 docs/06 §6 + SURGE] 상성 ±1, SURGE 시 ×2.
    var aff = D.ATTR.affinityMod(ab.attr, tgt.attr) * (sm.affinityMult || 1);
    var bonus = (ab.dmgBonus || 0) + (sm.dmgBonus || 0);   // 시그널 UP/DOWN 축 보정
    var pierce = ab.pierce || 0;
    if (ab.vsMachine && tgt.isMachine) pierce += ab.vsMachine.pierce;
    var crit = 1;
    if (p.status.nextCrit && p.status.nextCrit > 1) { crit = p.status.nextCrit; p.status.nextCrit = 1; }
    var tdef = Math.max(0, tgt.def - (tgt.status.defDown || 0));
    var res;
    if (ab.multiHit) {
      res = D.R.multiStrike({ atkValue: atkValue, def: tdef, cover: cover, affinity: aff,
        bonus: bonus, pierce: pierce, crit: crit, hits: ab.multiHit.hits, lastHitPierceAll: ab.multiHit.lastHitPierceAll });
    } else {
      res = D.R.computeDamage({ atkValue: atkValue, def: tdef, cover: cover, affinity: aff, bonus: bonus, pierce: pierce, crit: crit });
    }
    tgt.hp = Math.max(0, tgt.hp - res.dmg);
    if (ab.vsMachine && tgt.isMachine) { tgt.status.stunTurns = ab.vsMachine.stunTurns; }
    p.cooldowns[abilityKey] = ab.cooldown; p.ap -= ab.ap;
    var affTag = aff > 0 ? (' [상성+' + aff + ']') : (aff < 0 ? (' [역상성' + aff + ']') : '');
    var msg = HERO(p) + ' ' + ab.name + ' → ' + tgt.name + (res.blocked ? ' — 튕김(0)' : ' −' + res.dmg) + affTag;
    c.log.push(msg + '  (HP ' + tgt.hp + ')');
    c.floaters.push({ x: tgt.x, y: tgt.y, text: res.blocked ? 'MISS' : ('-' + res.dmg), kind: res.blocked ? 'miss' : 'dmg', crit: crit > 1, aff: aff });
    if (ab.loud && c.threat) c.threat.noise = (c.threat.noise || 0) + 1;
    if (tgt.hp <= 0) c.log.push(tgt.name + ' 파괴됨');
    c.outcome = checkOutcome(c);
    c.telegraphs = computeTelegraphs(c);
    return c;
  }

  // 서버랙(오브젝티브) 차감 — 인접 시 threshold 누적 차감.
  //   [각색 docs/07 §5.2 / docs/25 §3.5] "인접 유닛이 HACK/ATK 액션으로 차감".
  //   CIPHER 는 HACK 로 해킹, BLADE 는 ATK 로 무력 강습 → 같은 목표를 다른 축으로 완주.
  function applyHackObjective(combat) {
    var D = deps(); var c = clone(combat); var p = player(c);
    if (c.outcome || p.ap < 1 || c.objective.done) return combat;
    var dist = D.G.chebyshev(p, c.objective);
    if (dist > 1) return combat;
    var useHack = (p.hack >= p.atk);              // 더 강한 축을 자동 선택
    // [계승 docs/06 §7] BLACKOUT: HACK 해킹 불가(메시 차단) — 물리 강습은 가능.
    var sm = signalMods(D, c, p, useHack);
    if (sm.hackDisabled) {
      c.log.push('⚫ BLACKOUT — 메시 차단으로 서버 해킹 불가 (무력 강습만 가능)');
      c.floaters.push({ x: c.objective.x, y: c.objective.y, text: 'BLACKOUT', kind: 'miss' });
      return c;
    }
    var actorValue = useHack ? p.hack : p.atk;
    // 보상 해금 시그니처(BACKDOOR/VENDETTA) + 시그널 UP 오브젝티브 보너스.
    var bonus = 0;
    if (p.objBonusAbility) bonus += (D.AB.ABILITIES[p.objBonusAbility].objectiveBonus || 0);
    bonus += (sm.objectiveBonus || 0);
    var od = D.R.objectiveDamage({ threshold: c.objective.threshold, veil: 0 }, actorValue, bonus);
    c.objective.threshold = od.threshold; p.ap -= 1;
    var verb = useHack ? '서버 랙 해킹' : '서버 랙 강습';
    c.log.push(HERO(p) + ' ' + verb + ' −' + od.delta + '  (남은 방어도 ' + od.threshold + ')');
    c.floaters.push({ x: c.objective.x, y: c.objective.y, text: '-' + od.delta, kind: 'hack' });
    if (c.threat) c.threat.noise = (c.threat.noise || 0) + 1;
    if (od.reached) {
      c.objective.done = true;
      c.log.push('★ 서버 랙 돌파 — ' + c.objective.dataTB + 'TB 유출');
      c.outcome = 'win';
    }
    c.telegraphs = computeTelegraphs(c);
    return c;
  }

  function checkOutcome(c) {
    var p = player(c);
    if (p.hp <= 0) return 'lose';
    if (c.objective.done) return 'win';
    if (aliveEnemies(c).length === 0) return 'win';
    return null;
  }

  // ---- 적 턴 실행 -----------------------------------------------------------
  // planEnemyTurn(텔레그래프와 동일 소스) → 이동 적용 → 사격 적용. 결정론.
  function runEnemyTurn(combat) {
    var D = deps(); var c = clone(combat);
    if (c.outcome) return c;
    var enemies = aliveEnemies(c);
    for (var i = 0; i < enemies.length; i++) {
      var e = findUnit(c, enemies[i].id);
      if (!e || e.hp <= 0) continue;
      if (e.status.stunTurns > 0) { c.log.push(e.name + ' STUN — 행동 불가'); continue; }
      var plan = D.AI.planEnemyTurn(stateForAI(c), e.id);
      if (plan.moveTo && (plan.moveTo.x !== e.x || plan.moveTo.y !== e.y)) {
        e.x = plan.moveTo.x; e.y = plan.moveTo.y;
        c.log.push(e.name + ' 이동 → (' + e.x + ',' + e.y + ')');
      }
      if (plan.attack) {
        var p = player(c);
        // 실행 시점 재검증 — 은신(피격 회피) / 무적(피해 무효).
        if (p.status.stealth || p.hp <= 0) {
          c.log.push(e.name + ' 사격 — 대상 은신, 빗나감');
        } else if (p.status.invuln) {
          c.log.push(e.name + ' 사격 — ' + HERO(p) + ' 무적, 피해 무효');
          c.floaters.push({ x: p.x, y: p.y, text: 'BLOCK', kind: 'buff' });
        } else {
          p.hp = Math.max(0, p.hp - plan.attack.dmg);
          c.log.push(e.name + ' 사격 → ' + HERO(p) + ' −' + plan.attack.dmg + '  (HP ' + p.hp + ')');
          c.floaters.push({ x: p.x, y: p.y, text: '-' + plan.attack.dmg, kind: 'dmg' });
        }
      }
    }
    // 라운드 종료 처리: 상태 감쇠 + 상처 틱 + AP 리필 + 텔레그래프 갱신.
    tickRoundEnd(c);
    c.outcome = checkOutcome(c);
    c.telegraphs = computeTelegraphs(c);
    return c;
  }

  // [G10] 위협/노출 게이지 실동: 라운드 종료 시 노출·소음 누적, 임계 시 경보/증원.
  //   전투 페이싱을 실제로 바꾼다 — 증원 유닛이 필드에 추가되어 전투가 길어짐.
  function accrueThreat(D, c) {
    if (!c.threat) return;
    var exposed = computeExposure(D, c) ? 1 : 0;
    var surgeExtra = (c.signal && c.signal.key === 'SURGE') ? 1 : 0; // SURGE=노출 가속(2배)
    var noise = (c.threat.noise > 0) ? 1 : 0;
    var inc = exposed + surgeExtra + noise;
    c.threat.noise = 0;
    if (inc > 0) c.threat.value += inc;
    var wasAlarm = c.threat.alarm;
    c.threat.alarm = c.threat.value >= c.threat.cap;
    if (c.threat.alarm && !wasAlarm) c.log.push('⚠ 위협 임계 도달 — VANTA 경보 발령');
    // 임계 최초 도달 + 증원 정의 존재 → 1회 증원 스폰(페이싱 변화).
    if (c.threat.alarm && !c.threat.reinforced && c.threat.reinforcement) {
      var rf = c.threat.reinforcement;
      var t = D.EN.ENEMIES[rf.key];
      if (t) {
        var occupied = c.units.some(function (u) { return u.hp > 0 && u.x === rf.x && u.y === rf.y; });
        if (!occupied) {
          c.units.push(spawnEnemy(D, t, rf.x, rf.y, 'ereinf'));
          c.log.push('★ VANTA 증원 도착 — ' + t.name + ' (' + rf.x + ',' + rf.y + ')');
          c.floaters.push({ x: rf.x, y: rf.y, text: 'REINFORCE', kind: 'debuff' });
        }
      }
      c.threat.reinforced = true;
    }
  }

  // 플레이어가 라운드 종료 시 '노출' 상태인가 — 위협 있는 적의 LoS + 무엄폐.
  function computeExposure(D, c) {
    var p = player(c);
    if (!p || p.hp <= 0 || (p.status && p.status.stealth)) return false;
    for (var i = 0; i < c.units.length; i++) {
      var e = c.units[i];
      if (e.side !== 'enemy' || e.hp <= 0 || e.ai === 'static') continue;
      if (!D.G.lineOfSight(e, p, c.field)) continue;
      var cov = D.G.coverBonus(e, p, c.field, false);
      if (cov === 0) return true; // 최소 한 적에게 무엄폐 노출
    }
    return false;
  }

  function tickRoundEnd(c) {
    var D = deps();
    // 위협/노출 게이지 누적(증원 포함) — 라운드 진행 시점의 신호·노출 반영.
    accrueThreat(D, c);
    for (var i = 0; i < c.units.length; i++) {
      var u = c.units[i];
      if (u.status.debuffTurns > 0) { u.status.debuffTurns -= 1; if (u.status.debuffTurns <= 0) { u.status.defDown = 0; u.status.coverNull = false; u.status.movDown = 0; } }
      if (u.status.stunTurns > 0) u.status.stunTurns -= 1;
    }
    var p = player(c);
    // 은신 / 무적 감쇠.
    if (p.status.stealth) { p.status.stealthTurns -= 1; if (p.status.stealthTurns <= 0) p.status.stealth = false; }
    if (p.status.invuln)  { p.status.invulnTurns -= 1; if (p.status.invulnTurns <= 0) p.status.invuln = false; }
    // [계승 docs/07 §7] 상처/BLEEDING 틱.
    var bl = D.R.bleedingTick(p);
    if (bl.bleeding && bl.hp < p.hp) { c.log.push(HERO(p) + ' BLEEDING −1 (HP ' + bl.hp + ')'); }
    p.hp = bl.hp;
    // 쿨다운 감쇠 + AP 리필.
    for (var k in p.cooldowns) { if (p.cooldowns[k] > 0) p.cooldowns[k] -= 1; }
    c.round += 1;
    // [계승 docs/06 §7] 새 라운드 시그널 다이 파생.
    c.signal = sigForRound(D, c.round);
    // [계승 docs/06 §7 → 각색 §3.2] BLACKOUT & mesh 축 → AP +1 (이니셔티브 +20 각색).
    var sm = signalMods(D, c, p, true);
    p.ap = p.maxAp + (sm.apBonus || 0);
    if (sm.apBonus) c.log.push('⚫ BLACKOUT — ' + HERO(p) + ' 이니셔티브 보정 AP +' + sm.apBonus);
  }

  // ---- 대화 라우팅 ----------------------------------------------------------
  function startMission(state, missionId) {
    var D = deps(); var s = clone(state);
    var mission = D.MI.MISSION; // 슬라이스: ch01 단일
    var startNode = mission.dialogue.nodes[mission.dialogue.start];
    s.scene = 'dialogue';
    s.dialogue = { missionId: mission.id, nodeId: startNode.id };
    // onEnter 플래그.
    applyOnEnter(s, mission, startNode);
    return s;
  }

  function applyOnEnter(s, mission, node) {
    var D = deps();
    var f = D.DLG.onEnterFlags(node);
    if (f) for (var k in f) s.save.flags[k] = f[k];
    if (node.onEnter && node.onEnter.applyRewards) {
      var res = D.CAMP.applyRewards(s.save, mission);
      s.save.character = res.character; s.save.heat = res.heat; s.save.heatCap = res.heatCap;
      s.save.missionsDone = res.missionsDone;
      s.save.karma = res.character.karma; s.save.nuyen = res.character.nuyen;
      s.banner = { kind: 'rewards', lines: res.log };
    }
  }

  function dialogueChoose(state, choiceIndex) {
    var D = deps(); var s = clone(state);
    var mission = D.MI.MISSION;
    var node = mission.dialogue.nodes[s.dialogue.nodeId];
    var choice = node.choices[choiceIndex];
    if (!choice) return state;
    var ctx = dialogueCtx(s);
    var applied = D.DLG.applyChoice(choice, ctx);
    if (applied.blocked) { s.banner = { kind: 'blocked', text: '요구 조건 미충족 ' + (applied.reason || '') }; return s; }
    if (applied.setFlags) for (var k in applied.setFlags) s.save.flags[k] = applied.setFlags[k];
    var eff = applied.effect || {};
    if (typeof eff.rep === 'number') s.save.character.rep += eff.rep;

    // 전투 개시.
    if (eff.startCombat) {
      s.scene = 'combat';
      s.combat = buildCombat(mission, s.save.character, eff.startCombat.onWin);
      return s;
    }
    // 귀환.
    if (eff.returnHub) {
      s.scene = 'hub'; s.dialogue = null; s.hub = { node: 'root' };
      return s;
    }
    // 다음 노드로.
    if (applied.goto) {
      s.dialogue.nodeId = applied.goto;
      applyOnEnter(s, mission, mission.dialogue.nodes[applied.goto]);
    }
    return s;
  }

  function dialogueCtx(s) {
    var D = deps();
    var eff = D.CH.effectiveStats(s.save.character);
    return {
      attrs: { hack: eff.hack, atk: eff.atk, def: eff.def, spd: eff.spd, hp: eff.maxHp },
      tags: s.save.character.tags || [],
      flags: s.save.flags,
      classKey: s.save.character.classKey,
    };
  }

  // 전투 종료 후 대화 재개(승리) 또는 허브 귀환(패배/재시도).
  function resolveCombat(state) {
    var D = deps(); var s = clone(state);
    var mission = D.MI.MISSION;
    if (!s.combat) return state;
    if (s.combat.outcome === 'win') {
      s.save.flags.firstBlood = true;
      s.scene = 'dialogue';
      s.dialogue = { missionId: mission.id, nodeId: s.combat.onWin };
      applyOnEnter(s, mission, mission.dialogue.nodes[s.combat.onWin]);
      s.combat = null;
    } else {
      // 패배 → 허브 귀환(재시도 가능).
      s.scene = 'hub'; s.combat = null; s.hub = { node: 'root' };
      s.banner = { kind: 'fail', text: '미션 실패 — 안전가옥으로 귀환' };
    }
    return s;
  }

  // ---- 성장 / 허브 ----------------------------------------------------------
  function spendKarma(state, stat) {
    var D = deps(); var s = clone(state);
    var res = D.CH.spendKarma(s.save.character, stat);
    if (res.ok) { s.save.character = res.character; s.save.karma = res.character.karma;
      s.banner = { kind: 'growth', text: stat.toUpperCase() + ' +1 (karma 잔여 ' + res.character.karma + ')' }; }
    else s.banner = { kind: 'blocked', text: res.reason };
    return s;
  }

  function hubNav(state, node) { var s = clone(state); s.hub = { node: node }; s.banner = null; return s; }

  // 로스터: 플레이어블 클래스 선택 → 해당 빌드로 신규 캐릭터 편성(성장 초기화).
  //   캠페인 진행(flags·missionsDone·heat)은 유지 → 같은 미션을 다른 빌드로 재완주.
  function selectClass(state, classKey) {
    var D = deps(); var s = clone(state);
    var playable = (D.CL && D.CL.PLAYABLE) || ['CIPHER', 'BLADE'];
    if (playable.indexOf(classKey) < 0) { s.banner = { kind: 'blocked', text: '해금되지 않은 클래스' }; return s; }
    if (s.save.character.classKey === classKey) { s.banner = { kind: 'growth', text: classKey + ' — 이미 편성됨' }; return s; }
    var ch = D.CH.makeCharacter(classKey);
    s.save.character = ch; s.save.karma = ch.karma; s.save.nuyen = ch.nuyen;
    s.hub = { node: 'root' };
    s.banner = { kind: 'growth', text: (ch.codename || classKey) + ' 편성 — ' + classKey + ' 빌드로 전환' };
    return s;
  }

  // ---- 리듀서 ---------------------------------------------------------------
  function rpgReducer(state, action) {
    switch (action.type) {
      case 'NEW_GAME': return rpgInitialState();
      case 'LOAD_SAVE': {
        var s = clone(state); s.save = action.save; s.scene = 'hub'; s.combat = null; s.dialogue = null;
        s.hub = { node: 'root' }; s.banner = { kind: 'load', text: '세이브 복원됨' }; return s;
      }
      case 'START_MISSION': return startMission(state, action.missionId);
      case 'DIALOGUE_CHOOSE': return dialogueChoose(state, action.index);
      case 'COMBAT_SELECT': { var s2 = clone(state); if (s2.combat) s2.combat.selectedAbility = action.ability; return s2; }
      case 'COMBAT_MOVE': { var s3 = clone(state); s3.combat = applyMove(state.combat, action.tile); return s3; }
      case 'COMBAT_ATTACK': { var s4 = clone(state); s4.combat = applyAttack(state.combat, action.targetId, action.ability); return s4; }
      case 'COMBAT_HACK': { var s5 = clone(state); s5.combat = applyHackObjective(state.combat); return s5; }
      case 'COMBAT_END_TURN': { var s6 = clone(state); s6.combat = runEnemyTurn(state.combat); return s6; }
      case 'COMBAT_CLEAR_FLOATERS': { if (!state.combat || !state.combat.floaters || !state.combat.floaters.length) return state; var s6b = clone(state); s6b.combat.floaters = []; return s6b; }
      case 'COMBAT_RESOLVE': return resolveCombat(state);
      case 'SPEND_KARMA': return spendKarma(state, action.stat);
      case 'SELECT_CLASS': return selectClass(state, action.classKey);
      case 'HUB_NAV': return hubNav(state, action.node);
      case 'CLEAR_BANNER': { var s7 = clone(state); s7.banner = null; return s7; }
      default: return state;
    }
  }

  var API = {
    rpgInitialState: rpgInitialState, rpgReducer: rpgReducer, newSave: newSave,
    buildCombat: buildCombat, applyMove: applyMove, applyAttack: applyAttack,
    applyHackObjective: applyHackObjective, runEnemyTurn: runEnemyTurn,
    computeTelegraphs: computeTelegraphs, findUnit: findUnit, player: player,
    startMission: startMission, dialogueChoose: dialogueChoose, resolveCombat: resolveCombat,
    spendKarma: spendKarma, dialogueCtx: dialogueCtx, selectClass: selectClass,
    PLAYER_ID: PLAYER_ID,
    exposure: function (combat) { return computeExposure(deps(), combat); },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_STORE = API;
})();
