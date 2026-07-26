;(function () {
  'use strict';
  // ==========================================================================
  // systems/character.js — 캐릭터 시트 · karma 지출 · 유효 스탯 파생
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수 (DOM/React 무의존).
  //   makeCharacter : 클래스 기본 스탯 → 캐릭터(성장 0). 유효HP=기본×2 [계승 docs/07 §10]
  //   effectiveStats: 기본 + karma 성장. MOV=SPD 파생 [신규 docs/25 §3.1]
  //   spendKarma    : karma 1점을 스탯에 직접 지출 [각색 docs/25 §5.2, 레벨 없음]
  //   payKarma      : karma N점을 '비용'으로만 소모(성장 없음) [72차 · d45 #14 대화 비용 게이트]
  // ==========================================================================

  function getClasses() {
    if (typeof window !== 'undefined' && window.RPG_CLASSES) return window.RPG_CLASSES;
    return require('../data/classes.js');
  }
  function getAbilities() {
    if (typeof window !== 'undefined' && window.RPG_ABILITIES) return window.RPG_ABILITIES;
    return require('../data/abilities.js');
  }
  // [B1] 장비(무기 개조·사이버웨어) 모듈. 미로드 환경(구세이브·격리 테스트)에선 null → 무장비 폴백.
  function getGear() {
    if (typeof window !== 'undefined' && window.RPG_GEAR) return window.RPG_GEAR;
    try { return require('../data/gear.js'); } catch (e) { return null; }
  }
  var ZERO_MODS = { atk: 0, def: 0, spd: 0, hack: 0, mov: 0, maxHp: 0, cooldown: 0 };

  var STAT_CAP = { hp: 999, atk: 10, def: 8, spd: 8, hack: 8 }; // [계승 docs/07 §10]

  function makeCharacter(classKey) {
    var C = getClasses(), K = getAbilities();
    var base = C.CLASSES[classKey] || C.CLASSES.CIPHER;
    var kit = (K.KIT_BY_CLASS && K.KIT_BY_CLASS[base.key]) ? K.KIT_BY_CLASS[base.key].slice()
            : (base.key === 'CIPHER' ? K.CIPHER_KIT.slice() : []);
    return {
      classKey: base.key,
      base: { hp: base.hp, atk: base.atk, def: base.def, spd: base.spd, hack: base.hack },
      growth: { hp: 0, atk: 0, def: 0, spd: 0, hack: 0 }, // karma 지출 누적
      primary: base.primary, secondary: base.secondary,
      signalFavor: base.signalFavor || 'mesh',    // [계승 docs/06 §7] 시그널 다이 정렬
      icon: base.icon || '👤', codename: base.codename || base.key,
      passive: base.passive || '',
      // [48차] 클래스 위장 태그(MOLE 등) → dialogueCtx.tags 로 인물태그 게이트 판정. 없으면 [].
      tags: base.tags ? base.tags.slice() : [],
      kit: kit,
      unlocked: [],           // 보상 해금 능력 (BACKDOOR / VENDETTA / WORKSHOP / TRIPLE_AGENT 등)
      // [B1] 장비 경제: equipment=장착 슬롯(무기1·사이버1) · gearOwned=구매 이력(재구매 방지·무료 교체).
      equipment: { weapon: null, cyberware: null },
      gearOwned: [],
      karma: 0, nuyen: 0, rep: 0,
    };
  }

  // 유효 스탯 = 기본 + 성장 + 장비 (상한 클램프). 유효 maxHp = (기본hp+성장hp) × 2 + 장비maxHp.
  //   [B1] 장비 반영은 karma 성장 반영 선례를 따른다. 무장비(equipment 비었음) → gm 전부 0 →
  //   기존 수치와 완전 동일(byte 불변). cdReduction 은 쿨다운 감소(store buildCombat 전파).
  function effectiveStats(ch) {
    var C = getClasses();
    var G = getGear();
    var gm = (G && G.aggregateMods) ? G.aggregateMods(ch.equipment) : ZERO_MODS;
    var atk = clamp(ch.base.atk + ch.growth.atk + gm.atk, STAT_CAP.atk);
    var def = clamp(ch.base.def + ch.growth.def + gm.def, STAT_CAP.def);
    var spd = clamp(ch.base.spd + ch.growth.spd + gm.spd, STAT_CAP.spd);
    var hack = clamp(ch.base.hack + ch.growth.hack + gm.hack, STAT_CAP.hack);
    var baseHp = ch.base.hp + ch.growth.hp;
    return {
      atk: atk, def: def, spd: spd, hack: hack,
      maxHp: Math.max(2, C.effectiveMaxHp(baseHp) + gm.maxHp),   // [계승 docs/07 §10] ×2 + 장비(최소 2)
      mov: Math.max(1, C.movFromSpd(spd) + gm.mov),              // [신규 파생 docs/25 §3.1] + 장비(최소 1)
      ap: 2,                                                     // [신규 docs/25 §3.2]
      cdReduction: Math.max(0, -gm.cooldown),                    // [B1] 쿨다운 감소량(HAIR_TRIGGER 등)
      primary: ch.primary, secondary: ch.secondary,
    };
  }

  function clamp(v, cap) { return Math.min(v, cap); }

  // [72차 · d45 #14] karma N점 '비용' 소모 원시연산 — 성장(growth) 없음. 대화 선택지 비용 게이트용.
  //   spendKarma(성장 지출)와 karma 잔량 판정을 단일 출처로 공유한다(아래 spendKarma 가 이 함수를 경유).
  //   실패 시 { ok:false, reason, need, have } — 호출측이 사유를 표시할 수 있어야 한다(조용한 차감 실패 금지).
  function payKarma(ch, n) {
    var have = (ch && typeof ch.karma === 'number') ? ch.karma : 0;
    var cost = (n == null) ? 1 : Math.floor(n);
    if (!(cost > 0)) return { ok: false, reason: 'karma 비용 오류', need: 0, have: have };
    if (have < cost) return { ok: false, reason: 'karma 부족', need: cost, have: have };
    var next = JSON.parse(JSON.stringify(ch));
    next.karma = have - cost;
    return { ok: true, character: next, spent: cost, need: cost, have: have };
  }

  // karma 1점 → 스탯 +1 (hp 는 +1 기본HP = +2 유효HP). 실패 시 { ok:false }.
  //   [72차] 잔량 판정·차감은 payKarma 재사용(반환 reason 문자열은 기존과 byte 동일 — 39번 핀 유지).
  function spendKarma(ch, stat) {
    var paid = payKarma(ch, 1);
    if (!paid.ok) return { ok: false, reason: paid.reason };
    if (!(stat in ch.growth)) return { ok: false, reason: '알 수 없는 스탯' };
    var next = paid.character;
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
    spendKarma: spendKarma, payKarma: payKarma, unlockAbility: unlockAbility, STAT_CAP: STAT_CAP,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_CHARACTER = API;
})();
