#!/usr/bin/env node
/* ==========================================================================
 * _home_check.js — 홈 포털 ↔ RPG 캠페인 드리프트 가드 [신규 v6.45 · 배치 C]
 * --------------------------------------------------------------------------
 * 근거: 루트 index.html 의 진행 배지 스크립트는 RPG 미션 ID 29종을 하드코딩한
 *   정적 사본이다(file:// 인라인 제약상 rpg/systems/campaign.js 를 import 할 수
 *   없어 사본 유지가 현실적). campaign.js MISSIONS 가 정본 — 미션이 추가/개명되면
 *   홈 사본이 조용히 어긋나 진행률(n/29)이 틀려진다. 이 스크립트가 회귀를 잡는다.
 *
 * 검증 항목:
 *   1. 홈 RPG_MISSION_IDS 집합  ===  campaign.js MISSIONS(캡스톤 제외) 집합
 *   2. 개수 정확히 29, 홈 목록에 중복 없음
 *   3. 캡스톤 a2-99-flagship 은 홈 목록에서 제외돼 있어야 함
 *   4. 홈이 참조하는 RPG 세이브 키  ===  rpg/state/save.js KEY
 *   5. 홈 RPG_ENDING_KEYS 집합  ===  campaign.js MISSIONS 의 endingSeen 게이트 키 집합(4)
 *
 * 실행:  node _home_check.js        (PASS→exit 0 / FAIL→exit 1)
 * 순수 node, 외부 의존 0. campaign.js/save.js 는 읽기 전용 참조.
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HOME = path.join(ROOT, 'index.html');
const CAPSTONE_ID = 'a2-99-flagship';

const fail = [];
const ok = [];
function check(cond, msg) { (cond ? ok : fail).push(msg); }
function setEq(a, b) {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x));
}

// ── 홈 index.html 파싱 ────────────────────────────────────────────────────
const html = fs.readFileSync(HOME, 'utf8');

function stringsInArray(src, name) {
  const re = new RegExp('var\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\]');
  const m = src.match(re);
  if (!m) throw new Error('홈에서 ' + name + ' 배열을 찾지 못함');
  const items = m[1].match(/'([^']*)'/g) || [];
  return items.map((s) => s.slice(1, -1));
}

const homeMissions = stringsInArray(html, 'RPG_MISSION_IDS');
const homeEndings = stringsInArray(html, 'RPG_ENDING_KEYS');

// 홈이 참조하는 localStorage 키 수집
const keyMatches = [...html.matchAll(/localStorage\.getItem\('([^']+)'\)/g)].map((m) => m[1]);

// ── 정본(campaign.js / save.js) 로드 — 읽기 전용 참조 ─────────────────────
const campaign = require('./rpg/systems/campaign.js');
const save = require('./rpg/state/save.js');

const canonMissions = campaign.MISSIONS
  .filter((m) => m.branch !== 'capstone')
  .map((m) => m.id);

const canonEndings = [
  ...new Set(
    campaign.MISSIONS.flatMap((m) => (m.unlock && m.unlock.endingSeen) || [])
  ),
];

// ── 검증 ──────────────────────────────────────────────────────────────────
// 1. 미션 집합 동치
check(setEq(homeMissions, canonMissions),
  '미션 ID 집합 동치 (홈 ' + homeMissions.length + ' ↔ campaign 비캡스톤 ' + canonMissions.length + ')');

// 2. 개수 29 + 중복 없음
check(homeMissions.length === 29, '홈 미션 개수 == 29 (실제 ' + homeMissions.length + ')');
check(new Set(homeMissions).size === homeMissions.length, '홈 미션 목록 중복 없음');
check(canonMissions.length === 29, 'campaign 비캡스톤 개수 == 29 (실제 ' + canonMissions.length + ')');

// 3. 캡스톤 제외
check(!homeMissions.includes(CAPSTONE_ID), '홈 목록에 캡스톤(' + CAPSTONE_ID + ') 미포함');
check(campaign.MISSIONS.some((m) => m.id === CAPSTONE_ID),
  'campaign 에 캡스톤(' + CAPSTONE_ID + ') 존재(29종에서만 제외 대상)');

// 4. 세이브 키 대조
check(keyMatches.includes(save.KEY),
  "홈이 RPG 세이브 키 '" + save.KEY + "' 참조 (save.js KEY 와 일치)");

// 5. 엔딩 키 집합 동치
check(setEq(homeEndings, canonEndings),
  '엔딩 키 집합 동치 (홈 ' + homeEndings.length + ' ↔ campaign endingSeen ' + canonEndings.length + ')');

// ── 결과 리포트 ────────────────────────────────────────────────────────────
console.log('DEAD NEXUS — 홈 ↔ campaign 드리프트 가드 (_home_check.js)\n');
ok.forEach((m) => console.log('  PASS  ' + m));
if (fail.length) {
  console.log('');
  fail.forEach((m) => console.log('  FAIL  ' + m));
  // 진단 보조: 어긋난 원소를 명시
  const missOnlyHome = homeMissions.filter((x) => !canonMissions.includes(x));
  const missOnlyCanon = canonMissions.filter((x) => !homeMissions.includes(x));
  if (missOnlyHome.length) console.log('        홈에만 있음: ' + missOnlyHome.join(', '));
  if (missOnlyCanon.length) console.log('        campaign 에만 있음: ' + missOnlyCanon.join(', '));
  console.log('\n결과: FAIL (' + ok.length + ' pass / ' + fail.length + ' fail)');
  process.exit(1);
}
console.log('\n결과: PASS (' + ok.length + '/' + ok.length + ')');
process.exit(0);
