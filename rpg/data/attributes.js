;(function () {
  'use strict';
  // ==========================================================================
  // data/attributes.js — 6+1 속성 색·기호·상성 (순수 리터럴 + 상성 헬퍼)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §3.1 규약 — data 파일 주석에도 상시 유지):
  //   [계승 docs/06 §1] 6+1 속성 색상·기호 (원전 HEX 그대로)
  //   [계승 docs/06 §6] 6속성 상성 6쌍 (원전 관계 그대로)
  //   [각색 docs/06 §6] 상성 피해 보정을 ±1 로 단순화 (docs/25 §3.3)
  // 순수 데이터 — DOM/리액트/문서 객체 참조 0.
  // ==========================================================================

  // [계승 docs/06 §1]
  var ATTRS = {
    MESH:  { key: 'MESH',  sym: '◈M', color: '#185FA5', label: 'MESH'  },
    IRON:  { key: 'IRON',  sym: '◈I', color: '#888780', label: 'IRON'  },
    VOLT:  { key: 'VOLT',  sym: '◈V', color: '#854F0B', label: 'VOLT'  },
    SHADE: { key: 'SHADE', sym: '◈S', color: '#534AB7', label: 'SHADE' },
    BIO:   { key: 'BIO',   sym: '◈B', color: '#1D9E75', label: 'BIO'   },
    ASH:   { key: 'ASH',   sym: '◈A', color: '#C04828', label: 'ASH'   },
    GRID:  { key: 'GRID',  sym: '◇',  color: '#888888', label: 'GRID'  },
  };

  // [계승 docs/06 §6] key ▶ beats(약점). MESH▶SHADE, IRON▶ASH, VOLT▶BIO,
  //                    SHADE▶MESH, ASH▶VOLT, BIO▶IRON
  var BEATS = { MESH: 'SHADE', IRON: 'ASH', VOLT: 'BIO', SHADE: 'MESH', ASH: 'VOLT', BIO: 'IRON' };

  // [각색 docs/06 §6 → docs/25 §3.3] 상성 피해 보정: 공격속성이 방어속성을 상성 → +1,
  // 역상성 → -1, 그 외 0. (풀 매트릭스 대신 ±1 단순화.)
  function affinityMod(atkAttr, defAttr) {
    if (!atkAttr || !defAttr) return 0;
    if (BEATS[atkAttr] === defAttr) return 1;
    if (BEATS[defAttr] === atkAttr) return -1;
    return 0;
  }

  // [계승 docs/06 §6] 상성 6쌍 전체 매트릭스 (표시용). Stage 2 "6종 전체 체감 확대".
  //   반환 [{ atk, def, sym }] 6쌍 (MESH▶SHADE, IRON▶ASH, VOLT▶BIO, SHADE▶MESH, ASH▶VOLT, BIO▶IRON).
  function matrix() {
    var order = ['MESH', 'IRON', 'VOLT', 'SHADE', 'ASH', 'BIO'];
    var out = [];
    for (var i = 0; i < order.length; i++) {
      var a = order[i], d = BEATS[a];
      out.push({ atk: a, atkSym: ATTRS[a].sym, atkColor: ATTRS[a].color,
                 def: d, defSym: ATTRS[d].sym, defColor: ATTRS[d].color });
    }
    return out;
  }

  var API = { ATTRS: ATTRS, BEATS: BEATS, affinityMod: affinityMod, matrix: matrix };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ATTRS = API;
})();
