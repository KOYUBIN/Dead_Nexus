;(function () {
  'use strict';
  // ==========================================================================
  // core/projection.js — 좌표→스크린 순수 투영 seam [G1]
  // ──────────────────────────────────────────────────────────────────────────
  // combat/grid/ai 는 사각 논리좌표만 다룬다. 논리(x,y)→스크린 매핑은 이 seam 에만
  // 격리 → 슬라이스는 사각 탑다운으로 출하하고, Stage 3 에서 룰 무변경으로 이 파일만
  // 아이소 투영으로 교체(docs/25 §7 Stage 3, §8). 리액트/DOM 참조 0 (순수 함수).
  //   projectSquare : 탑다운(기존 슬라이스, 폴백 뷰).
  //   projectIso    : 2:1 다이아몬드 아이소(기본 뷰, 섀도우런 룩). 표시층 CSS 는 clip-path.
  // 반환 tx/ty 는 '타일 단위'(--tile 배수) 병진 → CSS 가 var(--tile) 로 실제 스케일
  //   (반응형 유지, 라이브러리 0·캔버스 0·DOM 유지). z 는 painter 심도(뒤→앞).
  // ==========================================================================

  var MODES = ['square', 'iso'];
  // [M7 v6.46] seam 기본값 — 불변 상수. 활성 뷰는 항상 호출부가 project(...,mode) 로 명시한다.
  //   이전에는 setMode(m) 가 이 변수를 재대입할 수 있었는데, API 는 원시값 'square' 를
  //   복사해 내보내므로(var MODE 는 스냅샷) setMode 이후 API.MODE 가 갱신되지 않는
  //   값-복사 결함이 있었다. setMode 는 소비처 0(리포 전역 grep)이라 제거했고,
  //   그 결과 MODE 는 재대입 경로가 없는 상수가 되어 복사본과 원본이 영구히 일치한다.
  //   (게터 노출 대신 상수화를 택한 이유: 소비처 0 인 새 export 를 만들지 않기 위함.
  //    런타임 뷰 전환이 필요해지면 project(...,mode) 인자로 전달하고, 모드를 상태로
  //    보관해야 할 때 비로소 게터/세터 쌍을 함께 도입한다.)
  var MODE = 'square';

  // 논리 (col x, row y) → 탑다운 배치.
  //   tx/ty : var(--tile) 배수 병진 (반응형).  left/top/cx/cy : tile 픽셀 인자 기반.
  function projectSquare(x, y, tile, dim) {
    return {
      mode: 'square',
      tx: x, ty: y,
      gridColumn: x + 1, gridRow: y + 1,
      left: x * tile, top: y * tile,
      cx: x * tile + tile / 2, cy: y * tile + tile / 2,
      z: 5,
    };
  }

  // 논리 (x,y) → 아이소 2:1 다이아몬드 (타일 폭 W=tile, 다이아 높이 H=W/2).
  //   화면 중심:  cxT = (x−y)/2 + (rows−1)/2 ,  cyT = (x+y)/4   (타일 단위)
  //   요소는 W×W 박스로 배치하고 표시층에서 다이아 clip → 박스 좌상단 = 중심 − (0.5,0.5)W.
  //   음수 방지 오프셋으로 좌단(x=0,y=rows−1)이 tx=0. z-순서 = 논리 심도(x+y) painter.
  function projectIso(x, y, tile, dim) {
    var rows = (dim && dim.rows) || 1;
    var tx = (x - y) * 0.5 + (rows - 1) * 0.5; // 요소 박스 좌(타일 단위)
    var ty = (x + y) * 0.25;                    // 요소 박스 상(타일 단위)
    return {
      mode: 'iso',
      tx: tx, ty: ty,
      gridColumn: x + 1, gridRow: y + 1,
      left: tx * tile, top: ty * tile,
      cx: (tx + 0.5) * tile, cy: (ty + 0.5) * tile, // 다이아 중심 픽셀
      z: 5 + x + y,
    };
  }

  // seam 분기점: 아이소 스킨은 여기서만 교체. mode 미지정 시 MODE(기본 square).
  function project(x, y, tile, dim, mode) {
    var m = mode || MODE;
    return m === 'iso' ? projectIso(x, y, tile, dim) : projectSquare(x, y, tile, dim);
  }

  // 보드 논리 크기(타일 단위) — 래퍼 width/height 계산용.
  //   iso: 가로 (cols+rows)/2, 세로 (cols+rows)/4 + 0.5 (박스 여백 포함).
  function boardSize(cols, rows, mode) {
    if (mode === 'iso') return { w: (cols + rows) / 2, h: (cols + rows) / 4 + 0.5 };
    return { w: cols, h: rows };
  }

  var API = {
    MODE: MODE, MODES: MODES,   // MODE 는 상수 — 재대입 경로 없음(위 주석 참조).
    project: project, projectSquare: projectSquare, projectIso: projectIso,
    boardSize: boardSize,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_PROJECTION = API;
})();
