;(function () {
  'use strict';
  // ==========================================================================
  // core/loader.js — window 전역 heal 로더 [G11] (시뮬 lore_module 패턴 계승)
  // ──────────────────────────────────────────────────────────────────────────
  // 호스팅이 /rpg (슬래시 없음)로 서빙하면 상대경로 src 가 상위로 풀려 404 → 모듈
  // 전역이 없으면 디렉토리 경로를 보정해 재주입. file://·정상 URL 에선 no-op.
  // core/ 는 combat/·data/ 순수성 grep 대상이 아니므로 DOM 접근 허용.
  // ==========================================================================

  function heal(relPath, marker) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (typeof window[marker] !== 'undefined') return;
    // 이 페이지는 rpg/index.html → pathname 은 .../rpg | .../rpg/ | .../index(.html).
    var dir = location.pathname.replace(/index(\.html?)?$/, '');
    if (dir.charAt(dir.length - 1) !== '/') dir += '/';
    var s = document.createElement('script');
    s.src = dir + relPath;
    document.head.appendChild(s);
  }

  // 전 모듈 마커 목록 — 인덱스 셸이 DOMContentLoaded 에서 호출.
  function healAll() {
    heal('core/projection.js', 'RPG_PROJECTION');
    heal('core/sound.js', 'RPG_SOUND');
    heal('data/attributes.js', 'RPG_ATTRS');
    heal('data/signal.js', 'RPG_SIGNAL');
    heal('data/classes.js', 'RPG_CLASSES');
    heal('data/abilities.js', 'RPG_ABILITIES');
    heal('data/enemies.js', 'RPG_ENEMIES');
    heal('data/weapons.js', 'RPG_WEAPONS');
    heal('data/gear.js', 'RPG_GEAR');
    // 미션 데이터 (32종: 메인 8 + 사이드 8 + Act 2 15 + 캡스톤 1) — 각 전역 마커별 개별 heal.
    heal('data/missions/ch01-first-blood.js', 'RPG_MISSION_CH01');
    heal('data/missions/ch02-insider-game.js', 'RPG_MISSION_CH02');
    heal('data/missions/ch03-martial-night.js', 'RPG_MISSION_CH03');
    heal('data/missions/ch04-price-of-splice.js', 'RPG_MISSION_CH04');
    heal('data/missions/ch05-mesh-ghost.js', 'RPG_MISSION_CH05');
    heal('data/missions/ch06-bloc-acquisition.js', 'RPG_MISSION_CH06');
    heal('data/missions/ch07-heart-of-city.js', 'RPG_MISSION_CH07');
    heal('data/missions/ch08-zero-day.js', 'RPG_MISSION_CH08');
    heal('data/missions/side-01-traitor-contract.js', 'RPG_MISSION_SIDE01_TRAITOR_CONTRACT');
    heal('data/missions/side-02-corp-breach.js', 'RPG_MISSION_SIDE02_CORP_BREACH');
    heal('data/missions/side-03-chemical-raid.js', 'RPG_MISSION_SIDE03_CHEMICAL_RAID');
    heal('data/missions/side-04-medbay-heist.js', 'RPG_MISSION_SIDE04_MEDBAY_HEIST');
    heal('data/missions/side-05-informant-hit.js', 'RPG_MISSION_SIDE05_INFORMANT_HIT');
    heal('data/missions/side-06-rival-duel.js', 'RPG_MISSION_SIDE06_RIVAL_DUEL');
    heal('data/missions/side-07-server-zero.js', 'RPG_MISSION_SIDE07_SERVER_ZERO');
    heal('data/missions/side-08-harbor-run.js', 'RPG_MISSION_SIDE08_HARBOR_RUN');
    // [61/62차] ACT 2 (프레이밍 1 + 4갈래 메인 8 + 클래스 사이드 4 = 13) — 각 전역 마커별 heal.
    heal('data/missions/a2-00-framing.js', 'RPG_MISSION_A2_00_FRAMING');
    heal('data/missions/a2-a1-crown-breach.js', 'RPG_MISSION_A2_A1_CROWN_BREACH');
    heal('data/missions/a2-a2-crown-throne.js', 'RPG_MISSION_A2_A2_CROWN_THRONE');
    heal('data/missions/a2-b1-barricade.js', 'RPG_MISSION_A2_B1_BARRICADE');
    heal('data/missions/a2-b2-freeport.js', 'RPG_MISSION_A2_B2_FREEPORT');
    heal('data/missions/a2-c1-first-contact.js', 'RPG_MISSION_A2_C1_FIRST_CONTACT');
    heal('data/missions/a2-c2-signal-war.js', 'RPG_MISSION_A2_C2_SIGNAL_WAR');
    heal('data/missions/a2-d1-scavenge.js', 'RPG_MISSION_A2_D1_SCAVENGE');
    heal('data/missions/a2-d2-last-signal.js', 'RPG_MISSION_A2_D2_LAST_SIGNAL');
    heal('data/missions/a2-side-cipher-static.js', 'RPG_MISSION_A2_SIDE_CIPHER_STATIC');
    heal('data/missions/a2-side-blade-vendetta.js', 'RPG_MISSION_A2_SIDE_BLADE_VENDETTA');
    heal('data/missions/a2-side-rigger-build.js', 'RPG_MISSION_A2_SIDE_RIGGER_BUILD');
    heal('data/missions/a2-side-mole-whoami.js', 'RPG_MISSION_A2_SIDE_MOLE_WHOAMI');
    heal('data/missions/a2-side-broker-ledger.js', 'RPG_MISSION_A2_SIDE_BROKER_LEDGER');
    heal('data/missions/a2-side-drifter-lastroad.js', 'RPG_MISSION_A2_SIDE_DRIFTER_LASTROAD');
    heal('data/missions/a2-99-flagship.js', 'RPG_MISSION_A2_99_FLAGSHIP');   // [v6.44] 캡스톤
    heal('systems/abyss.js', 'RPG_ABYSS');                                    // [v6.44] 심연 프로토콜
    heal('systems/combat/grid.js', 'RPG_GRID');
    heal('systems/combat/resolve.js', 'RPG_RESOLVE');
    heal('systems/combat/ai.js', 'RPG_AI');
    heal('systems/dialogue.js', 'RPG_DIALOGUE');
    heal('systems/character.js', 'RPG_CHARACTER');
    heal('systems/campaign.js', 'RPG_CAMPAIGN');
    heal('state/save.js', 'RPG_SAVE');
    heal('state/store.js', 'RPG_STORE');
    heal('lore/lore_module.snapshot.js', 'loreEpilogue');
    heal('lore/lore-adapter.js', 'RPG_LORE');
  }

  if (typeof window !== 'undefined') { window.rpgHeal = heal; window.rpgHealAll = healAll; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { heal: heal, healAll: healAll };
})();
