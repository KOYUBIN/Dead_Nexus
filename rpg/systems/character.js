;(function () {
  'use strict';
  // ==========================================================================
  // systems/character.js — 캐릭터 시트 · karma 지출 · 유효 스탯 파생
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수 (DOM/React 무의존).
  //   makeCharacter : 클래스 기본 스탯 → 캐릭터(성장 0). 유효HP=기본×2 [계승 docs/07 §10]
  //   effectiveStats: 기본 + karma 성장. MOV=SPD 파생 [신규 docs/25 §3.1]
  //   spendKarma    : karma 1점을 스탯에 직접 지출 [각색 docs/25 §5.2, 레벨 없음]
  // ==========================================================================

  function getClasses() {
    if (typeof window !== 'undefined' && window.RPG_CLASSES) return window.RPG_CLASSES;
    return require('../data/classes.js');
  }
  function getAbilities() {
    if (typeof window !== 'undefined' && window.RPG_ABILITIES) return window.RPG_ABILITIES;
    return require('../data/abilities.js');
  }

  var STAT_CAP = { hp: 999, atk: 10, def: 8, spd: 8, hack: 8 }; // [계승 docs/07 §10]

  function makeCharacter(classKey) {
    var C = getClasses(), K = getAbilities();
    var base = C.CLASSES[classKey];
    return {
      classKey: classKey,
      base: { hp: base.hp, atk: base.atk, def: base.def, spd: base.spd, hack: base.hack },
      growth: { hp: 0, atk: 0, def: 0, spd: 0, hack: 0 }, // karma 지출 누적
      primary: base.primary, secondary: base.secondary,
      kit: (classKey === 'CIPHER') ? K.CIPHER_KIT.slice() : [],
      unlocked: [],           // 보상 해금 능력 (BACKDOOR 등)
      karma: 0, nuyen: 0, rep: 0,
    };
  }

  // 유효 스탯 = 기본 + 성장 (상한 클램프). 유효 maxHp = (기본hp+성장hp) × 2.
  function effectiveStats(ch) {
    var C = getClasses();
    var atk = clamp(ch.base.atk + ch.growth.atk, STAT_CAP.atk);
    var def = clamp(ch.base.def + ch.growth.def, STAT_CAP.def);
    var spd = clamp(ch.base.spd + ch.growth.spd, STAT_CAP.spd);
    var hack = clamp(ch.base.hack + ch.growth.hack, STAT_CAP.hack);
    var baseHp = ch.base.hp + ch.growth.hp;
    return {
      atk: atk, def: def, spd: spd, hack: hack,
      maxHp: C.effectiveMaxHp(baseHp),   // [계승 docs/07 §10] ×2
      mov: C.movFromSpd(spd),            // [신규 파생 docs/25 §3.1]
      ap: 2,                             // [신규 docs/25 §3.2]
      primary: ch.primary, secondary: ch.secondary,
    };
  }

  function clamp(v, cap) { return Math.min(v, cap); }

  // karma 1점 → 스탯 +1 (hp 는 +1 기본HP = +2 유효HP). 실패 시 { ok:false }.
  function spendKarma(ch, stat) {
    if (ch.karma < 1) return { ok: false, reason: 'karma 부족' };
    if (!(stat in ch.growth)) return { ok: false, reason: '알 수 없는 스탯' };
    var next = JSON.parse(JSON.stringify(ch));
    next.karma -= 1;
    next.growth[stat] += 1;
    return { ok: true, character: next };
  }

  function unlockAbility(ch, abilityKey) {
    var next = JSON.parse(JSON.stringify(ch));
    if (next.unlocked.indexOf(abilityKey) < 0) next.unlocked.push(abilityKey);
    if (next.kit.indexOf(abilityKey) < 0) next.kit.push(abilityKey);
    return next;
  }

  var API = {
    makeCharacter: makeCharacter, effectiveStats: effectiveStats,
    spendKarma: spendKarma, unlockAbility: unlockAbility, STAT_CAP: STAT_CAP,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_CHARACTER = API;
})();
