;(function () {
  'use strict';
  // ==========================================================================
  // core/projection.js — 좌표→스크린 순수 투영 seam [G1]
  // ──────────────────────────────────────────────────────────────────────────
  // combat/grid/ai 는 사각 논리좌표만 다룬다. 논리(x,y)→스크린 매핑은 이 seam 에만
  // 격리 → 슬라이스는 사각 탑다운으로 출하하고, Stage 3 에서 룰 무변경으로 이 파일만
  // 아이소 투영으로 교체(docs/25 §7 Stage 3). 리액트/DOM 참조 0.
  //   projectSquare : CSS Grid 탑다운 (기본, 슬라이스).
  //   MODE 는 향후 'iso' 확장 지점. 지금은 'square' 고정.
  // ==========================================================================

  var MODE = 'square';

  // 논리 타일 (col x, row y) → CSS Grid 배치 { col, row } (1-index) + 픽셀 오프셋.
  function projectSquare(x, y, tile) {
    return {
      gridColumn: x + 1,
      gridRow: y + 1,
      left: x * tile,
      top: y * tile,
      cx: x * tile + tile / 2,
      cy: y * tile + tile / 2,
    };
  }

  function project(x, y, tile) {
    // seam: MODE 분기점. 아이소 스킨은 여기서만 교체.
    return projectSquare(x, y, tile);
  }

  var API = { MODE: MODE, project: project, projectSquare: projectSquare };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_PROJECTION = API;
})();
