#!/usr/bin/env node
/* ==========================================================================
 * rpg/_wiring_check.js — 미션 배선 4집합 동치 가드 [신규 v6.46 · 71차-B/H5]
 * --------------------------------------------------------------------------
 * 미션 1종을 추가하려면 서로 다른 4곳을 동시에 고쳐야 한다. 한 곳이라도 빠지면
 * 브라우저에서만(또는 /rpg 무슬래시 호스팅에서만) 조용히 사라진다 —
 * v6.45 핫픽스 #50(BROKER/DRIFTER 사이드 2종 브라우저 배선 누락)이 정확히 이 형태였다.
 *
 * 검증하는 4집합:
 *   ① rpg/data/missions/*.js                       — 실제 미션 데이터 파일
 *   ② rpg/index.html  <script src="./data/missions/…">  — 브라우저 로드 목록
 *   ③ rpg/core/loader.js  heal('data/missions/…', 'MARKER')  — /rpg 무슬래시 heal 재주입
 *   ④ rpg/systems/campaign.js MISSIONS  { module, global }   — 레지스트리 정본
 *
 * 검증 항목:
 *   1. ①②③④ 의 미션 파일명 집합이 모두 동일 (어긋난 원소를 집합별로 명시)
 *   2. 마커(전역명) 집합 동치: ③ heal 마커 === ④ MISSIONS.global
 *   3. 파일명↔마커 짝 동치: 같은 파일에 대해 ③ 과 ④ 가 같은 마커를 가리킴
 *   4. 각 미션 파일이 ④ 가 선언한 전역명을 실제로 등록(window.<global> = …)
 *
 * 실행:  node rpg/_wiring_check.js       (GREEN/PASS→exit 0 / FAIL→exit 1)
 * 순수 node 정규식 파싱, 외부 의존 0. 대상 파일은 전부 읽기 전용.
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const RPG = __dirname;
const MISSION_DIR = path.join(RPG, 'data', 'missions');
const INDEX_HTML = path.join(RPG, 'index.html');
const LOADER_JS = path.join(RPG, 'core', 'loader.js');
const CAMPAIGN_JS = path.join(RPG, 'systems', 'campaign.js');

const fail = [];
const ok = [];
function check(cond, msg, detail) {
  if (cond) ok.push(msg);
  else fail.push({ msg, detail: detail || [] });
}
const read = (p) => fs.readFileSync(p, 'utf8');
const uniq = (a) => [...new Set(a)];
const diff = (a, b) => a.filter((x) => !b.includes(x));

// ── ① 파일 시스템 ─────────────────────────────────────────────────────────
const setFile = fs.readdirSync(MISSION_DIR).filter((f) => f.endsWith('.js')).sort();

// ── ② rpg/index.html <script src> ────────────────────────────────────────
const html = read(INDEX_HTML);
const setHtml = uniq(
  [...html.matchAll(/<script\s+src=["']\.\/data\/missions\/([\w.-]+\.js)["']/g)].map((m) => m[1])
).sort();

// ── ③ rpg/core/loader.js heal(경로, 마커) 쌍 ──────────────────────────────
const loader = read(LOADER_JS);
const healPairs = [...loader.matchAll(
  /heal\(\s*['"]data\/missions\/([\w.-]+\.js)['"]\s*,\s*['"]([A-Za-z0-9_$]+)['"]\s*\)/g
)].map((m) => ({ file: m[1], global: m[2] }));
const setLoader = uniq(healPairs.map((p) => p.file)).sort();

// ── ④ campaign.js MISSIONS { module, global } ────────────────────────────
const campaign = read(CAMPAIGN_JS);
// global 과 module 은 같은 엔트리 안에 인접해 등장 (global 먼저).
const campPairs = [...campaign.matchAll(
  /global:\s*['"]([A-Za-z0-9_$]+)['"]\s*,\s*module:\s*['"]\.\.\/data\/missions\/([\w.-]+\.js)['"]/g
)].map((m) => ({ file: m[2], global: m[1] }));
const setCampaign = uniq(campPairs.map((p) => p.file)).sort();

// ── 파싱 자체가 실패했는지 먼저 확인(정규식 침묵 회귀 방지) ────────────────
check(setFile.length > 0, '① data/missions/*.js 파일 발견 (' + setFile.length + '종)');
check(setHtml.length > 0, '② index.html <script src> 파싱 성공 (' + setHtml.length + '종)');
check(setLoader.length > 0, '③ loader.js heal 쌍 파싱 성공 (' + healPairs.length + '쌍)');
check(setCampaign.length > 0, '④ campaign.js MISSIONS 파싱 성공 (' + campPairs.length + '엔트리)');

// ── 1. 4집합 파일명 동치 ──────────────────────────────────────────────────
const SETS = [
  ['① 파일', setFile],
  ['② index.html', setHtml],
  ['③ loader.js', setLoader],
  ['④ campaign.js', setCampaign],
];
const base = setFile;
let allEq = true;
const setDetail = [];
for (const [name, s] of SETS) {
  const only = diff(s, base);
  const missing = diff(base, s);
  if (only.length || missing.length) {
    allEq = false;
    if (missing.length) setDetail.push(name + ' 에 누락: ' + missing.join(', '));
    if (only.length) setDetail.push(name + ' 에만 있음(파일 없음): ' + only.join(', '));
  }
}
check(allEq,
  '4집합 미션 파일명 동치 (① ' + setFile.length + ' / ② ' + setHtml.length +
    ' / ③ ' + setLoader.length + ' / ④ ' + setCampaign.length + ')',
  setDetail);

// 중복 배선(같은 파일 2회 로드) 검출
const dupHtml = [...html.matchAll(/<script\s+src=["']\.\/data\/missions\/([\w.-]+\.js)["']/g)].map((m) => m[1]);
check(dupHtml.length === setHtml.length, '② index.html 미션 <script> 중복 없음',
  [dupHtml.filter((f, i) => dupHtml.indexOf(f) !== i).join(', ')]);
check(healPairs.length === setLoader.length, '③ loader.js heal 중복 없음');
check(campPairs.length === setCampaign.length, '④ campaign.js MISSIONS 중복 없음');

// ── 2·3. 마커 집합 동치 + 파일↔마커 짝 동치 ───────────────────────────────
const loaderByFile = Object.fromEntries(healPairs.map((p) => [p.file, p.global]));
const campByFile = Object.fromEntries(campPairs.map((p) => [p.file, p.global]));
const markerLoader = uniq(healPairs.map((p) => p.global)).sort();
const markerCamp = uniq(campPairs.map((p) => p.global)).sort();
const markerDetail = [];
if (diff(markerLoader, markerCamp).length) markerDetail.push('③ loader 에만: ' + diff(markerLoader, markerCamp).join(', '));
if (diff(markerCamp, markerLoader).length) markerDetail.push('④ campaign 에만: ' + diff(markerCamp, markerLoader).join(', '));
check(markerDetail.length === 0,
  '마커 집합 동치 (③ heal ' + markerLoader.length + ' ↔ ④ MISSIONS.global ' + markerCamp.length + ')',
  markerDetail);

const pairDetail = [];
for (const f of base) {
  const a = loaderByFile[f];
  const b = campByFile[f];
  if (a && b && a !== b) pairDetail.push(f + ': ③ ' + a + ' ≠ ④ ' + b);
}
check(pairDetail.length === 0, '파일↔마커 짝 동치 (③ heal 마커 == ④ MISSIONS.global)', pairDetail);

// ── 4. 각 미션 파일이 선언된 전역명을 실제로 등록하는가 ────────────────────
const regDetail = [];
for (const f of setFile) {
  const g = campByFile[f];
  if (!g) continue; // 집합 동치 실패로 이미 보고됨
  const src = read(path.join(MISSION_DIR, f));
  const re = new RegExp('window\\.' + g.replace(/\$/g, '\\$') + '\\s*=');
  if (!re.test(src)) regDetail.push(f + ' 이 window.' + g + ' 를 등록하지 않음');
}
check(regDetail.length === 0, '미션 파일이 선언된 전역명을 실제 등록 (' + setFile.length + '종)', regDetail);

// ── 결과 리포트 ────────────────────────────────────────────────────────────
console.log('DEAD NEXUS — 미션 배선 4집합 동치 가드 (rpg/_wiring_check.js)\n');
ok.forEach((m) => console.log('  PASS  ' + m));
if (fail.length) {
  console.log('');
  fail.forEach((f) => {
    console.log('  FAIL  ' + f.msg);
    f.detail.filter(Boolean).forEach((d) => console.log('        ' + d));
  });
  console.log('\n결과: RED / FAIL (' + ok.length + ' pass / ' + fail.length + ' fail)');
  process.exit(1);
}
console.log('\n결과: GREEN / PASS (' + ok.length + '/' + ok.length + ') — 미션 ' + setFile.length + '종 4집합 일치');
process.exit(0);
