#!/usr/bin/env node
'use strict';
// ============================================================================
// rpg/_missions_check.js — 미션 데이터 파일 정적 검증기 (신규 · 엔진 무편집)
// ----------------------------------------------------------------------------
// data/missions/ch01-first-blood.js 의 구조와, 그 소비 계약(store.js·
// systems/dialogue.js·systems/campaign.js)을 근거로 미션 데이터 파일을 정적
// 검증한다. 엔진 코드는 읽기만 한다(수정 0). 순수 검증 스크립트.
//
// 사용법:
//   node rpg/_missions_check.js <미션파일> [--roster 추가ID,쉼표목록]
//   node rpg/_missions_check.js rpg/data/missions/ch01-first-blood.js
//   node rpg/_missions_check.js rpg/data/missions/ch02.js --roster AXIOM_DRONE,AXIOM_ANALYST
//
// 종료코드: 0 = PASS(에러 0), 1 = FAIL(에러 ≥1) 또는 사용법 오류.
//
// 검증 항목(과제 ①~⑥):
//   ① node --check 문법
//   ② window 전역 등록 형태 (ch01 패턴: window.RPG_MISSION_* = { MISSION } + module.exports)
//   ③ 대화 노드 그래프 — 모든 edge(goto/startCombat.onWin) 실존 노드, 도달불가 0, 종결(returnHub) 존재
//   ④ 스탯 게이트 필드 — attr∈{hack,atk,def,spd,hp}(evalGate/dialogueCtx 계약), tag/flag 문자열
//   ⑤ 인카운터 필수 필드 — buildCombat 소비 스키마(그리드·playerStart·objective·walls·cover·enemies),
//        좌표 그리드 내, 적 key 가 로스터(enemies.js ∪ 계획 로스터 ∪ --roster) 화이트리스트에 존재
//        + [68차] survive:N (선택) — 생존형 win-condition 의 범위·밴드 검증
//   ⑥ 보상 필드 타입 — applyRewards 소비(rep/karma/nuyen 수치, heatCapDelta 수치, unlocks 문자열배열)
// ============================================================================

var path = require('path');
var fs = require('fs');
var cp = require('child_process');

// ---- 소비 계약 상수 (실코드 근거) ------------------------------------------
// evalGate(dialogue.js) 는 ctx.attrs 로만 attr 게이트를 판정하고, store.dialogueCtx 는
// ctx.attrs = { hack, atk, def, spd, hp } 만 제공 → 지원 attr 게이트는 이 5종뿐.
// (karma/₵ 게이트는 미지원 = 폴백 attr 게이트 필요 — SIMPLIFIED.)
var VALID_GATE_ATTRS = ['hack', 'atk', 'def', 'spd', 'hp'];
// cover.type — store 가 field.cover 로 전달, grid.coverBonus 가 light/full 만 해석.
var VALID_COVER_TYPES = ['light', 'full'];
// 계획 로스터(통합 전) — 적 로스터 계획 20종. --roster 로 확장 가능.
var PLANNED_ROSTER = [
  'AXIOM_DRONE', 'AXIOM_ANALYST', 'POLICE_OFFICER', 'POLICE_DRONE', 'RIOT_ENFORCER',
  'HELIX_MEDIC', 'SPLICE_HOUND', 'IRONWALL_ENFORCER', 'IRONWALL_TURRET', 'CARBON_GUARD',
  'CARBON_DRONE', 'VANTA_ELITE', 'MESH_WISP', 'SIGNAL_ICE', 'GANG_THUG',
  'RIVAL_GHOST', 'KAI_MORROW', 'MARCUS_CRANE', 'VERA_ASHTON', 'NEXUS_WARDEN',
  // [61차 Act2] MERIDIAN 외부 세력 + lore 보스 신규 7종 (data/enemies.js 통합됨).
  'MERIDIAN_VANGUARD', 'MERIDIAN_STALKER', 'MERIDIAN_DRONE', 'MERIDIAN_WARLORD',
  'WARD_NODE', 'ELIA_VOSS', 'HARLAN_VOSS',
  // [v6.44 · 과제 A1] 캡스톤 최종 보스 (data/enemies.js 통합됨).
  'MERIDIAN_OVERLORD',
];

// ---- 결과 수집기 -----------------------------------------------------------
function Report() { this.errors = []; this.warnings = []; this.infos = []; }
Report.prototype.err = function (cat, msg) { this.errors.push('[' + cat + '] ' + msg); };
Report.prototype.warn = function (cat, msg) { this.warnings.push('[' + cat + '] ' + msg); };
Report.prototype.info = function (cat, msg) { this.infos.push('[' + cat + '] ' + msg); };

// ---- 타입 헬퍼 -------------------------------------------------------------
function isNum(v) { return typeof v === 'number' && isFinite(v); }
function isInt(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v; }
function isStr(v) { return typeof v === 'string' && v.length > 0; }
function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function isArr(v) { return Array.isArray(v); }

// ============================================================================
// 인자 파싱
// ============================================================================
function parseArgs(argv) {
  var out = { file: null, roster: [] };
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    if (a === '--roster') { out.roster = out.roster.concat(splitList(argv[++i])); }
    else if (a.indexOf('--roster=') === 0) { out.roster = out.roster.concat(splitList(a.slice(9))); }
    else if (a.indexOf('--') === 0) { /* 알 수 없는 플래그 무시 */ }
    else if (!out.file) { out.file = a; }
  }
  return out;
}
function splitList(s) {
  if (!s) return [];
  return s.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 0; });
}

// ============================================================================
// ① node --check 문법
// ============================================================================
function checkSyntax(absPath, R) {
  try {
    cp.execFileSync(process.execPath, ['--check', absPath], { stdio: ['ignore', 'ignore', 'pipe'] });
    return true;
  } catch (e) {
    var msg = (e.stderr && e.stderr.toString()) || e.message || String(e);
    R.err('syntax', 'node --check 실패:\n' + msg.trim());
    return false;
  }
}

// ============================================================================
// ② window 전역 등록 형태 (ch01 패턴 동일)
//   ch01: IIFE 가 module.exports = API 와 window.RPG_MISSION_CH01 = API 를 둘 다 등록,
//         API = { MISSION: {...} }. node 에서 window 섀도우 후 require 로 양쪽 확인.
// ============================================================================
function loadMission(absPath, R) {
  var prevWindow = global.window;
  var shim = {};
  global.window = shim;                 // 모듈 내 `typeof window` → 'object'
  var mod = null, threw = null;
  try {
    try { delete require.cache[require.resolve(absPath)]; } catch (e) { /* 미캐시 */ }
    mod = require(absPath);
  } catch (e) {
    threw = e;
  } finally {
    global.window = prevWindow;
  }
  if (threw) {
    R.err('load', 'require 중 런타임 오류: ' + (threw && threw.message ? threw.message : String(threw)));
    return null;
  }
  var winKeys = Object.keys(shim).filter(function (k) { return /^RPG_MISSION_[A-Z0-9_]+$/.test(k); });
  if (winKeys.length === 0) {
    R.err('window', 'window.RPG_MISSION_* 전역 등록 없음 (ch01 패턴: window.RPG_MISSION_XXX = { MISSION }).');
  } else if (winKeys.length > 1) {
    R.err('window', 'window.RPG_MISSION_* 전역이 여러 개(' + winKeys.join(', ') + ') — 파일당 1개여야 함.');
  }
  // module.exports 도 동일 API 여야 함.
  if (!isObj(mod)) {
    R.err('window', 'module.exports 가 객체가 아님 (API = { MISSION } 이어야 함).');
    return null;
  }
  if (winKeys.length === 1 && shim[winKeys[0]] !== mod) {
    R.err('window', 'window.' + winKeys[0] + ' 와 module.exports 가 동일 객체가 아님 (ch01: 둘 다 API).');
  }
  if (!isObj(mod.MISSION)) {
    R.err('window', 'API.MISSION 객체 없음 (module.exports = { MISSION: {...} } 이어야 함).');
    return null;
  }
  if (winKeys.length === 1) R.info('window', 'window.' + winKeys[0] + ' = { MISSION } 등록 확인.');
  return mod.MISSION;
}

// ---- enemies.js 로스터 로드 (알려진 ID) -----------------------------------
function loadKnownRoster(R) {
  var p = path.join(__dirname, 'data', 'enemies.js');
  try {
    var prevWindow = global.window; global.window = {};
    var mod;
    try { delete require.cache[require.resolve(p)]; } catch (e) {}
    try { mod = require(p); } finally { global.window = prevWindow; }
    if (mod && isObj(mod.ENEMIES)) return Object.keys(mod.ENEMIES);
  } catch (e) {
    R.warn('roster', 'data/enemies.js 로드 실패 — 알려진 ID 목록 없이 계획 로스터+인자만 사용: ' + e.message);
  }
  return [];
}

// ============================================================================
// ③ 대화 노드 그래프
// ============================================================================
function checkDialogue(M, R) {
  var d = M.dialogue;
  if (!isObj(d)) { R.err('dialogue', 'MISSION.dialogue 객체 없음.'); return; }
  if (!isObj(d.nodes)) { R.err('dialogue', 'dialogue.nodes 객체 없음.'); return; }
  if (!isStr(d.start)) { R.err('dialogue', 'dialogue.start 노드 id(문자열) 없음.'); return; }

  var nodeIds = Object.keys(d.nodes);
  if (nodeIds.indexOf(d.start) < 0) {
    R.err('dialogue', 'dialogue.start="' + d.start + '" 가 nodes 에 없음.');
    return;
  }

  // 미션 내에서 설정되는 플래그 집합(게이트 flag 검증에 사용).
  var flagsSet = collectFlagsSet(d);

  // 노드별 edge/terminal 산출 + 필드 검증.
  var edgeMap = {};      // nodeId -> [target...]
  var terminalNodes = [];
  var startCombatSeen = false;

  nodeIds.forEach(function (nid) {
    var node = d.nodes[nid];
    edgeMap[nid] = [];
    if (!isObj(node)) { R.err('dialogue', 'node "' + nid + '" 가 객체가 아님.'); return; }
    if (node.id && node.id !== nid) {
      R.warn('dialogue', 'node "' + nid + '" 의 node.id="' + node.id + '" 가 키와 불일치.');
    }
    var choices = node.choices;
    if (!isArr(choices) || choices.length === 0) {
      R.err('dialogue', 'node "' + nid + '" 에 choices 배열이 없음(빈 노드=진행 불가 소프트락).');
      return;
    }
    choices.forEach(function (ch, ci) {
      var where = 'node "' + nid + '" choice[' + ci + ']';
      if (!isObj(ch)) { R.err('dialogue', where + ' 가 객체가 아님.'); return; }
      var eff = ch.effect || {};
      var routes = 0;

      // startCombat.onWin
      if (eff.startCombat) {
        startCombatSeen = true;
        if (!isObj(eff.startCombat) || !isStr(eff.startCombat.onWin)) {
          R.err('dialogue', where + ' 의 effect.startCombat.onWin(문자열) 없음 — 전투 승리 후 라우팅 크래시.');
        } else {
          edgeMap[nid].push(eff.startCombat.onWin);
          routes++;
        }
        // [61차 §3.5] startCombat.encounter(문자열)를 엣지처럼 참조 검증 — M.encounters[key] 실존 필수.
        //   store.dialogueChoose: encCfg = mission.encounters[encounter]. 오타/미정의 시 buildCombat 이
        //   mission.combat 폴백(enc② 소실) → 조용한 버그. 참조 무결을 정적 검증한다.
        if (eff.startCombat.encounter != null) {
          if (!isStr(eff.startCombat.encounter)) {
            R.err('dialogue', where + ' 의 startCombat.encounter 가 문자열이 아님.');
          } else if (!isObj(M.encounters) || !isObj(M.encounters[eff.startCombat.encounter])) {
            R.err('dialogue', where + ' 의 startCombat.encounter "' + eff.startCombat.encounter +
              '" 가 MISSION.encounters 에 정의되지 않음 — buildCombat 이 mission.combat 로 조용히 폴백(enc② 소실).');
          }
        }
        if (ch.goto) {
          R.warn('dialogue', where + ' 가 startCombat 과 goto 를 동시 보유 — store 는 startCombat 후 return, goto 무시.');
        }
      }
      // goto
      if (ch.goto) {
        if (!isStr(ch.goto)) R.err('dialogue', where + ' 의 goto 가 문자열이 아님.');
        else { edgeMap[nid].push(ch.goto); routes++; }
      }
      // 잘못된 필드명(to) — store 는 goto 만 소비.
      if (ch.to && !ch.goto) {
        R.warn('dialogue', where + " 가 'to' 를 사용 — 엔진은 'goto' 만 소비함(라우팅 누락 위험).");
      }
      // returnHub = 종결
      if (eff.returnHub) { terminalNodes.push(nid); routes++; }
      // [57차/v6.44] 에필로그 종결 — store.dialogueChoose 는 epilogue(캠페인 완주)·
      //   capstoneEpilogue(캡스톤 완주)를 종결 씬(scene='epilogue')으로 라우팅(허브 귀환과 동격 종결).
      if (eff.epilogue) { terminalNodes.push(nid); routes++; }
      if (eff.capstoneEpilogue) { terminalNodes.push(nid); routes++; }

      if (routes === 0) {
        R.err('dialogue', where + ' 에 라우팅 없음(goto/startCombat.onWin/returnHub/epilogue/capstoneEpilogue 중 하나 필요) — 죽은 선택지.');
      }

      // ④ 게이트 검증 (선택지 단위)
      if (ch.gate) checkGate(ch.gate, where, flagsSet, R);
    });
  });

  // edge 대상 실존 검증
  nodeIds.forEach(function (nid) {
    edgeMap[nid].forEach(function (tgt) {
      if (nodeIds.indexOf(tgt) < 0) {
        R.err('dialogue', 'node "' + nid + '" 의 edge → "' + tgt + '" 가 실존하지 않는 노드.');
      }
    });
  });

  // 도달성 BFS (start 에서 goto + startCombat.onWin 따라감)
  var reachable = {};
  var queue = [d.start];
  reachable[d.start] = true;
  while (queue.length) {
    var cur = queue.shift();
    (edgeMap[cur] || []).forEach(function (tgt) {
      if (!reachable[tgt] && nodeIds.indexOf(tgt) >= 0) { reachable[tgt] = true; queue.push(tgt); }
    });
  }
  var unreachable = nodeIds.filter(function (n) { return !reachable[n]; });
  if (unreachable.length) {
    R.err('dialogue', '도달 불가 노드 ' + unreachable.length + '개: ' + unreachable.join(', '));
  }

  // 종결 노드(returnHub) 존재 + 도달 가능해야 함
  var reachableTerminal = terminalNodes.filter(function (n) { return reachable[n]; });
  if (terminalNodes.length === 0) {
    R.err('dialogue', '종결 노드 없음 — effect.returnHub 로 미션을 끝내는 선택지가 최소 1개 필요.');
  } else if (reachableTerminal.length === 0) {
    R.err('dialogue', '종결 노드(' + terminalNodes.join(', ') + ')가 start 에서 도달 불가.');
  }

  return { startCombatSeen: startCombatSeen };
}

function collectFlagsSet(d) {
  var set = {};
  Object.keys(d.nodes).forEach(function (nid) {
    var node = d.nodes[nid];
    if (!isObj(node)) return;
    if (node.onEnter && isObj(node.onEnter.setFlags)) {
      Object.keys(node.onEnter.setFlags).forEach(function (k) { set[k] = true; });
    }
    if (isArr(node.choices)) node.choices.forEach(function (ch) {
      if (ch && isObj(ch.setFlags)) Object.keys(ch.setFlags).forEach(function (k) { set[k] = true; });
    });
  });
  return set;
}

// ============================================================================
// ④ 스탯 게이트 필드
// ============================================================================
function checkGate(gate, where, flagsSet, R) {
  if (!isObj(gate)) { R.err('gate', where + ' 의 gate 가 객체가 아님.'); return; }
  var keys = ['attr', 'tag', 'flag'].filter(function (k) { return gate[k] != null; });
  if (keys.length === 0) {
    R.err('gate', where + ' 의 gate 에 attr/tag/flag 중 하나도 없음(빈 게이트).');
    return;
  }
  if (keys.length > 1) {
    R.warn('gate', where + ' 의 gate 가 ' + keys.join('+') + ' 다중 보유 — evalGate 는 attr>tag>flag 우선 1개만 판정.');
  }
  if (gate.attr != null) {
    if (VALID_GATE_ATTRS.indexOf(gate.attr) < 0) {
      R.err('gate', where + ' 의 attr 게이트 "' + gate.attr + '" 는 미지원 스탯 — 지원: ' + VALID_GATE_ATTRS.join('/') +
        (['karma', 'nuyen', 'rep'].indexOf(gate.attr) >= 0 ? ' (karma/₵ 지출 게이트는 엔진 미지원 → 폴백 attr 게이트 필요, SIMPLIFIED).' : '.'));
    }
    if (!isNum(gate.min)) R.err('gate', where + ' 의 attr 게이트에 수치 min 없음.');
  }
  if (gate.tag != null && !isStr(gate.tag)) {
    R.err('gate', where + ' 의 tag 게이트 값이 비어있거나 문자열이 아님.');
  }
  if (gate.flag != null) {
    if (!isStr(gate.flag)) {
      R.err('gate', where + ' 의 flag 게이트 값이 비어있거나 문자열이 아님.');
    } else if (!flagsSet[gate.flag]) {
      R.info('gate', where + ' 의 flag "' + gate.flag + '" 는 이 미션에서 설정되지 않음 — 前 미션/분기 계승 플래그로 가정.');
    }
  }
}

// ============================================================================
// ⑤ 인카운터 필수 필드
// ============================================================================
function checkCombat(M, R, roster, startCombatSeen) {
  // enc① = MISSION.combat (기존 스키마 · startCombat→M.combat 필수 계약 유지).
  var c = M.combat;
  if (!isObj(c)) {
    if (startCombatSeen) R.err('combat', 'startCombat 선택지가 있으나 MISSION.combat 이 없음 — buildCombat 크래시.');
    else R.info('combat', 'MISSION.combat 없음(전투 없는 미션으로 간주).');
  } else {
    checkEncounterConfig(c, 'combat', R, roster);
  }

  // [61차 §3.5] enc② 이상 — MISSION.encounters 맵의 각 값에 동일 인카운터 검증 재귀 적용.
  //   store.buildCombat 은 opts.combat 오버라이드로 이 config 를 combat 과 동일 스키마로 소비.
  if (M.encounters != null) {
    if (!isObj(M.encounters)) {
      R.err('combat', 'MISSION.encounters 가 객체(맵)가 아님 — buildCombat 이 mission.encounters[key] 참조.');
    } else {
      Object.keys(M.encounters).forEach(function (k) {
        var ec = M.encounters[k];
        if (!isObj(ec)) { R.err('combat', 'encounters["' + k + '"] 가 객체가 아님(combat 동일 스키마 필요).'); return; }
        checkEncounterConfig(ec, 'encounters.' + k, R, roster);
      });
    }
  }
}

// 단일 인카운터 config 검증 (enc①=combat · enc②=encounters[key] 공용 · buildCombat 소비 스키마).
function checkEncounterConfig(c, prefix, R, roster) {
  // 그리드 크기
  var P = prefix + '.';
  var cols = c.cols, rows = c.rows;
  if (!isInt(cols) || cols < 1) R.err('combat', P + 'cols 가 양의 정수가 아님.');
  if (!isInt(rows) || rows < 1) R.err('combat', P + 'rows 가 양의 정수가 아님.');
  var gridOk = isInt(cols) && cols >= 1 && isInt(rows) && rows >= 1;

  function inGrid(pt, label) {
    if (!isObj(pt) || !isInt(pt.x) || !isInt(pt.y)) { R.err('combat', P + label + ' 좌표 {x,y} 정수 아님.'); return false; }
    if (!gridOk) return false;
    if (pt.x < 0 || pt.x >= cols || pt.y < 0 || pt.y >= rows) {
      R.err('combat', P + label + ' 좌표 (' + pt.x + ',' + pt.y + ') 가 그리드 ' + cols + '×' + rows + ' 범위 밖.');
      return false;
    }
    return true;
  }

  // playerStart (필수)
  if (!isObj(c.playerStart)) R.err('combat', P + 'playerStart {x,y} 없음.');
  else inGrid(c.playerStart, 'playerStart');

  // objective (필수 — 없으면 buildCombat 참조 크래시)
  var o = c.objective;
  if (!isObj(o)) {
    R.err('combat', P + 'objective 없음 — buildCombat 이 c.objective.threshold 참조로 크래시(★필수).');
  } else {
    inGrid(o, 'objective');
    if (!isNum(o.threshold)) R.err('combat', P + 'objective.threshold 수치 없음.');
    else if (o.threshold < 0) R.err('combat', P + 'objective.threshold 가 음수.');
    if (o.veil != null && !isNum(o.veil)) R.err('combat', P + 'objective.veil 이 수치가 아님.');
    if (o.label != null && !isStr(o.label)) R.warn('combat', P + 'objective.label 이 문자열이 아님(UI/로그 표기).');
    if (o.dataTB != null && !isNum(o.dataTB)) R.warn('combat', P + 'objective.dataTB 가 수치가 아님(로그 표기).');
  }

  // walls (필수 배열 — buildCombat: c.walls.slice())
  checkTileArray(c.walls, 'walls', R, inGrid, false, P);
  // cover (필수 배열 — buildCombat: c.cover.slice())
  checkTileArray(c.cover, 'cover', R, inGrid, true, P);

  // threatCap (선택 — 기본 8)
  if (c.threatCap != null && (!isNum(c.threatCap) || c.threatCap < 1)) {
    R.err('combat', P + 'threatCap 이 양수가 아님.');
  }

  // [68차] survive (선택 — 생존형 win-condition). N라운드 사수 시 승리.
  //   store.buildCombat 이 truthy 일 때만 combat.survive 로 부착하고
  //   store.checkOutcome 이 resolve.surviveReached(round, N) 으로 소비한다.
  //   미지정 = 기존 동작(차감/전멸 승리만) — 필드가 없는 미션은 완전 무영향.
  if (c.survive != null) {
    if (!isInt(c.survive) || c.survive < 1) {
      R.err('combat', P + 'survive 가 1 이상 정수가 아님 — 생존형 라운드 수(N라운드 사수 시 승리).');
    } else {
      if (c.survive < 3) R.warn('combat', P + 'survive=' + c.survive + ' — 2라운드 이하 사수는 트리비얼 이상치 위험(밴드 목표 3~9).');
      if (c.survive > 9) R.warn('combat', P + 'survive=' + c.survive + ' — 10라운드 이상 사수는 소모전(attrition) 이상치 위험.');
      R.info('combat', P + 'survive=' + c.survive + ' (생존형 인카운터 — 차감/전멸에 더해 N라운드 사수 승리축 추가).');
    }
  }

  // enemies (필수 배열)
  if (!isArr(c.enemies)) {
    R.err('combat', P + 'enemies 배열 없음 — buildCombat 이 c.enemies.length 참조.');
  } else {
    var occupancy = {};
    c.enemies.forEach(function (e, i) {
      var w = P + 'enemies[' + i + ']';
      if (!isObj(e)) { R.err('combat', w + ' 가 객체가 아님.'); return; }
      if (!isStr(e.key)) R.err('combat', w + ' 의 key(문자열) 없음.');
      else if (roster.set.indexOf(e.key) < 0) {
        R.err('combat', w + ' 적 key "' + e.key + '" 가 로스터 화이트리스트에 없음 (--roster 로 추가 가능).');
      }
      if (inGrid(e, w)) {
        var tk = e.x + ',' + e.y;
        if (occupancy[tk]) R.warn('combat', w + ' 좌표 (' + tk + ') 가 ' + occupancy[tk] + ' 와 중복(같은 타일 다중 유닛).');
        else occupancy[tk] = w;
      }
    });
  }

  // reinforcement (선택 — {key,x,y})
  if (c.reinforcement != null) {
    var rf = c.reinforcement;
    if (!isObj(rf)) R.err('combat', P + 'reinforcement 이 객체가 아님.');
    else {
      if (!isStr(rf.key)) R.err('combat', P + 'reinforcement.key(문자열) 없음.');
      else if (roster.set.indexOf(rf.key) < 0) {
        R.err('combat', P + 'reinforcement 적 key "' + rf.key + '" 가 로스터 화이트리스트에 없음 (--roster 로 추가 가능).');
      }
      inGrid(rf, 'reinforcement');
    }
  }
}

function checkTileArray(arr, name, R, inGrid, isCover, prefix) {
  var P = prefix || 'combat.';
  if (!isArr(arr)) {
    R.err('combat', P + name + ' 배열 없음 — buildCombat: c.' + name + '.slice() (빈 배열이라도 필수).');
    return;
  }
  arr.forEach(function (t, i) {
    var w = P + name + '[' + i + ']';
    if (!isObj(t)) { R.err('combat', w + ' 가 객체가 아님.'); return; }
    inGrid(t, w);
    if (isCover) {
      if (VALID_COVER_TYPES.indexOf(t.type) < 0) {
        R.err('combat', w + ' 의 type "' + t.type + '" 무효 — 지원: ' + VALID_COVER_TYPES.join('/') + '.');
      }
    }
  });
}

// ============================================================================
// ⑥ 보상 필드 타입
// ============================================================================
function checkRewards(M, R) {
  // rewards 는 onEnter.applyRewards 노드가 있을 때 필수(applyRewards 가 r.rep 등 참조).
  var usesRewards = false;
  if (M.dialogue && isObj(M.dialogue.nodes)) {
    Object.keys(M.dialogue.nodes).forEach(function (nid) {
      var n = M.dialogue.nodes[nid];
      if (n && n.onEnter && n.onEnter.applyRewards) usesRewards = true;
    });
  }
  var r = M.rewards;
  if (!isObj(r)) {
    if (usesRewards) R.err('rewards', 'onEnter.applyRewards 노드가 있으나 MISSION.rewards 없음 — applyRewards 크래시.');
    else R.info('rewards', 'MISSION.rewards 없음(정산 노드도 없음).');
    return;
  }
  // applyRewards: ch.rep += r.rep / ch.karma += r.karma / ch.nuyen += r.nuyen → 수치 필수.
  ['rep', 'karma', 'nuyen'].forEach(function (k) {
    if (!isNum(r[k])) R.err('rewards', 'rewards.' + k + ' 가 수치가 아님(applyRewards 가 가산 참조).');
  });
  if (r.heatCapDelta != null && !isNum(r.heatCapDelta)) R.err('rewards', 'rewards.heatCapDelta 가 수치가 아님.');
  if (r.unlocks != null) {
    if (!isArr(r.unlocks)) R.err('rewards', 'rewards.unlocks 가 배열이 아님.');
    else r.unlocks.forEach(function (u, i) {
      if (!isStr(u)) R.err('rewards', 'rewards.unlocks[' + i + '] 가 문자열이 아님.');
    });
  }
}

// ---- MISSION 최상위 필드 (가벼운 검증) ------------------------------------
function checkMissionShell(M, R) {
  if (!isStr(M.id)) R.err('mission', 'MISSION.id(문자열) 없음.');
  if (M.title != null && !isStr(M.title)) R.warn('mission', 'MISSION.title 이 문자열이 아님.');
}

// ============================================================================
// 메인
// ============================================================================
function main() {
  var args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error('사용법: node rpg/_missions_check.js <미션파일> [--roster 추가ID,쉼표목록]');
    process.exit(1);
  }
  var absPath = path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(absPath)) {
    console.error('파일 없음: ' + absPath);
    process.exit(1);
  }

  var R = new Report();

  // ① 문법
  var syntaxOk = checkSyntax(absPath, R);

  // 로스터 화이트리스트 구성: enemies.js(알려진) ∪ 계획 로스터 ∪ --roster
  var known = loadKnownRoster(R);
  var rosterSet = uniq(known.concat(PLANNED_ROSTER).concat(args.roster));
  var roster = { set: rosterSet, known: known, planned: PLANNED_ROSTER, extra: args.roster };

  if (syntaxOk) {
    // ② 로드 + window 등록
    var M = loadMission(absPath, R);
    if (M) {
      checkMissionShell(M, R);
      // ③ 대화 그래프
      var dres = checkDialogue(M, R) || {};
      // ⑤ 인카운터
      checkCombat(M, R, roster, !!dres.startCombatSeen);
      // ⑥ 보상
      checkRewards(M, R);
    }
  }

  // ---- 출력 ----
  print(args.file, R, roster);
  process.exit(R.errors.length ? 1 : 0);
}

function uniq(arr) {
  var seen = {}, out = [];
  arr.forEach(function (x) { if (x && !seen[x]) { seen[x] = true; out.push(x); } });
  return out;
}

function print(file, R, roster) {
  console.log('미션 검증: ' + file);
  console.log('로스터 화이트리스트: 알려진 ' + roster.known.length + '종 + 계획 ' + roster.planned.length +
    '종' + (roster.extra.length ? ' + 인자 ' + roster.extra.length + '종' : '') + ' = ' + roster.set.length + '종');
  console.log('');
  if (R.infos.length) { R.infos.forEach(function (m) { console.log('  info ' + m); }); }
  if (R.warnings.length) { R.warnings.forEach(function (m) { console.log('  WARN ' + m); }); }
  if (R.errors.length) { R.errors.forEach(function (m) { console.log('  FAIL ' + m); }); }
  console.log('');
  if (R.errors.length === 0) {
    console.log('PASS — 에러 0' + (R.warnings.length ? (', 경고 ' + R.warnings.length) : '') +
      (R.infos.length ? (', info ' + R.infos.length) : ''));
  } else {
    console.log('FAIL — 에러 ' + R.errors.length + (R.warnings.length ? (', 경고 ' + R.warnings.length) : ''));
  }
}

main();
