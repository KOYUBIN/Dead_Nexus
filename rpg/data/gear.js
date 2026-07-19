;(function () {
  'use strict';
  // ==========================================================================
  // data/gear.js — 허브 상점 장비 (무기 개조 · 사이버웨어, 순수 리터럴 + 헬퍼)
  // ──────────────────────────────────────────────────────────────────────────
  // 경제 루프 실동: 미션 보상 ₵의 소비처. write-only 통화 금지 원칙(시뮬 B-06 교훈).
  // 슬롯 2종 — weapon(무기 개조 1) · cyberware(사이버웨어 1). 아이템 10종.
  //   효과 = 기존 엔진 스탯 보정만(atk/def/spd/hack/mov/maxHp/cooldown 델타). 신규 메커닉 0.
  //   장비는 옵트인 파워 — character.equipment 비었으면 aggregateMods 전부 0 → 기본 밸런스 불변.
  //
  // 계보 표:
  //   사이버웨어 6종  [계승/각색 simulator/v0.5 index.html v1.1.2 CYBERWARE_DEFS] —
  //     reflex_booster/iron_skin/neural_jack/myomer_legs/ocular_implant/mood_chip.
  //     사회·정찰·유지비 등 시뮬 전용 효과는 이 엔진 미지원 → 스탯 보정으로 SIMPLIFIED(정직 표기).
  //   무기 개조 4종  [각색 cards/ghost/blade.md·cipher.md 원전 카드명] — 카드 효과를 스탯 델타로 각색.
  //   가격 근거: 미션 보상 스케일(최초 ₵8~14 · 재클리어 50%) — 최저가 20 ≈ 2~3미션,
  //             풀셋(양 슬롯 상위) ≈ 8~10미션. 클래스 제한(classReq)은 기본(base) 스탯 기준.
  //   순수 데이터 — DOM/리액트 참조 0 (data 순도 규율). window 전역 노출만.
  // ==========================================================================

  var SLOTS = ['weapon', 'cyberware'];

  // mods 델타 필드: atk/def/spd/hack/mov/maxHp/cooldown (cooldown<0 = 쿨다운 감소).
  //   classReq: { stat, min } — character.base[stat] >= min 인 클래스만 장착(예: 해킹 개조=HACK 보유).
  var ITEMS = {
    // ── 무기 개조 (weapon) — cards/ghost 원전 카드 각색 ──
    SMART_LINK: {
      key: 'SMART_LINK', name: '스마트 링크', icon: '🎯', slot: 'weapon',
      mods: { atk: 1 }, cost: 22,
      desc: 'ATK +1 — 신경 연동 조준기. 지정 표적 명중 우위.',
      lineage: '[각색 cards/ghost/blade.md Card04 CONTRACT KILL 지정 우선공격 ATK+2 → ATK+1]',
    },
    ICE_BREAKER: {
      key: 'ICE_BREAKER', name: '아이스 브레이커', icon: '🧊', slot: 'weapon',
      mods: { hack: 1 }, cost: 22, classReq: { stat: 'hack', min: 3 },
      desc: 'HACK +1 — 방벽 침투 모듈. 해킹 스탯 보유 클래스 전용.',
      lineage: '[각색 cards/ghost/cipher.md Card05 ICE BREAK 베일 돌파 → HACK+1]',
    },
    MONO_EDGE: {
      key: 'MONO_EDGE', name: '모노 엣지', icon: '🔪', slot: 'weapon',
      mods: { atk: 2, def: -1 }, cost: 34, classReq: { stat: 'atk', min: 4 },
      desc: 'ATK +2 · DEF −1 — 단분자 날. 근접 화력 특화(무방비 리스크). 근접 클래스 전용.',
      lineage: '[각색 cards/ghost/blade.md Card07 POINT BLANK ATK+5·DEF무시·반격+2 → ATK+2/DEF−1]',
    },
    HAIR_TRIGGER: {
      key: 'HAIR_TRIGGER', name: '헤어 트리거', icon: '⚙', slot: 'weapon',
      mods: { cooldown: -1 }, cost: 40,
      desc: '쿨다운 −1 — 격발 감도 개조. 시그니처 재사용 대기 1턴 단축.',
      lineage: '[각색 cards/ghost/blade.md Card01 QUICK DRAW "이미 뽑혀 있다" 즉발 → 쿨다운−1]',
    },

    // ── 사이버웨어 (cyberware) — simulator/v0.5 v1.1.2 CYBERWARE_DEFS 계승/각색 ──
    MOOD_CHIP: {
      key: 'MOOD_CHIP', name: '무드 칩', icon: '💊', slot: 'cyberware',
      mods: { maxHp: 2 }, cost: 20,
      desc: 'maxHP +2 — 신경계 안정 임플란트. 압박 하 침착 유지.',
      lineage: '[각색 simulator v1.1.2 mood_chip 협상/인맥 → maxHp+2 · 사회 트랙 엔진 미지원 SIMPLIFIED]',
    },
    OCULAR_IMPLANT: {
      key: 'OCULAR_IMPLANT', name: '광학 임플란트', icon: '👁', slot: 'cyberware',
      mods: { hack: 1 }, cost: 24,
      desc: 'HACK +1 — 시각 데이터 오버레이. 정보 우위.',
      lineage: '[각색 simulator v1.1.2 ocular_implant 정찰/데이터 → HACK+1 · 정찰 엔진 미지원 SIMPLIFIED]',
    },
    REFLEX_BOOSTER: {
      key: 'REFLEX_BOOSTER', name: '리플렉스 부스터', icon: '⚡', slot: 'cyberware',
      mods: { atk: 1, maxHp: -2 }, cost: 26,
      desc: 'ATK +1 · maxHP −2 — 신경 반응 가속(내구 부담).',
      lineage: '[계승 simulator v1.1.2 reflex_booster ATK+1 / HP−1(유효 −2)]',
    },
    MYOMER_LEGS: {
      key: 'MYOMER_LEGS', name: '미오머 다리', icon: '🦿', slot: 'cyberware',
      mods: { spd: 2, mov: 1 }, cost: 32,
      desc: 'SPD +2 · MOV +1 — 인공근섬유 다리. 기동 특화.',
      lineage: '[계승 simulator v1.1.2 myomer_legs SPD+2·이동+1]',
    },
    IRON_SKIN: {
      key: 'IRON_SKIN', name: '강철 피부', icon: '🛡', slot: 'cyberware',
      mods: { def: 2, mov: -1 }, cost: 34,
      desc: 'DEF +2 · MOV −1 — 피하 장갑 이식(둔중).',
      lineage: '[계승 simulator v1.1.2 iron_skin DEF+2·이동−1]',
    },
    NEURAL_JACK: {
      key: 'NEURAL_JACK', name: '뉴럴 잭', icon: '🧠', slot: 'cyberware',
      mods: { hack: 2, maxHp: -2 }, cost: 42, classReq: { stat: 'hack', min: 3 },
      desc: 'HACK +2 · maxHP −2 — 직결 신경 인터페이스(과부하 취약). 해킹 클래스 전용.',
      lineage: '[계승 simulator v1.1.2 neural_jack HACK+2 · EMP 취약을 maxHp−2 로 SIMPLIFIED]',
    },
  };

  // 슬롯별 품목 키 목록 (상점 UI 소비). 삽입 순서 유지.
  var BY_SLOT = { weapon: [], cyberware: [] };
  for (var k in ITEMS) { if (BY_SLOT[ITEMS[k].slot]) BY_SLOT[ITEMS[k].slot].push(k); }

  // 장착 가능 판정 — classReq 없으면 상시 가능. 있으면 기본(base) 스탯 >= min.
  //   기본 스탯 기준 → 성장/장비 부트스트랩 순환 없음(effectiveStats 재귀 회피).
  function canEquip(item, character) {
    if (!item) return false;
    var req = item.classReq;
    if (!req) return true;
    var base = (character && character.base) ? (character.base[req.stat] || 0) : 0;
    return base >= req.min;
  }

  // 장착 장비 → 스탯 델타 합산. equipment = { weapon:key|null, cyberware:key|null }.
  //   빈 장비 → 전부 0 (옵트인 파워: 기본 밸런스 불변 보장의 근거).
  function aggregateMods(equipment) {
    var m = { atk: 0, def: 0, spd: 0, hack: 0, mov: 0, maxHp: 0, cooldown: 0 };
    if (!equipment) return m;
    for (var s = 0; s < SLOTS.length; s++) {
      var key = equipment[SLOTS[s]];
      if (!key) continue;
      var it = ITEMS[key];
      if (!it || !it.mods) continue;
      for (var f in m) { if (typeof it.mods[f] === 'number') m[f] += it.mods[f]; }
    }
    return m;
  }

  function priceOf(key) { var it = ITEMS[key]; return it ? it.cost : 0; }

  // 미션 인텔 정찰 가격 (정보상). 전투 수치 무변경 — 사전 브리핑 공개만. 재구매 없음(1회 영구).
  var INTEL_PRICE = 6;

  var API = {
    SLOTS: SLOTS, ITEMS: ITEMS, BY_SLOT: BY_SLOT, INTEL_PRICE: INTEL_PRICE,
    canEquip: canEquip, aggregateMods: aggregateMods, priceOf: priceOf,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_GEAR = API;
})();
