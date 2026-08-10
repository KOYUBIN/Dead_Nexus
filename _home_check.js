#!/usr/bin/env node
/* ==========================================================================
 * _home_check.js — 홈 포털 ↔ 정본 코드 드리프트 가드 [v6.45 배치 C → v6.53 확장]
 * --------------------------------------------------------------------------
 * 근거: 루트 index.html 은 file:// 인라인 제약상 rpg/systems/campaign.js ·
 *   simulator/v0.5/index.html 등을 import 할 수 없어, 미션 ID·시나리오 ID·챕터 수
 *   같은 정본 수치를 "정적 사본"으로 들고 있다. 사본은 조용히 어긋난다 —
 *   이 스크립트가 사본 ↔ 정본 대조를 강제한다. 홈에서 파생 불가한 모든 표시 수치는
 *   반드시 여기 가드가 하나씩 붙어 있어야 한다(신규 지표 추가 시 가드 동반 필수).
 *
 * 검증 항목:
 *   [RPG 캠페인]
 *   1. 홈 RPG_MISSION_IDS 집합  ===  campaign.js MISSIONS(캡스톤 제외) 집합
 *   2. 홈 개수 == campaign 비캡스톤 개수(동적), 홈 목록에 중복 없음
 *   3. 캡스톤 a2-99-flagship 은 홈 목록에서 제외 + 홈 RPG_CAPSTONE_IDS == campaign 캡스톤 집합
 *   4. 홈이 참조하는 RPG 세이브 키  ===  rpg/state/save.js KEY
 *   5. 홈 RPG_ENDING_KEYS 집합  ===  campaign.js MISSIONS 의 endingSeen 게이트 키 집합(4)
 *   6. [v6.46 · H1/M9] 진행 배지의 표시 분모가 배열 길이 파생인지 (RPG + [v6.53] 시뮬 양쪽)
 *   7. [v6.46 · M9] 홈 버전 스탬프  ===  CHANGELOG.md 최신 '### v6.NN'
 *   8. [3차 감사 D4] README.md '**현재 버전**: vX.Y'  ===  CHANGELOG.md 최신
 *   [v6.53 신규 — 카드 지표 정보 밀도]
 *   9.  카드 지표(data-metric) 정적값 == 홈 단일 소스 배열 길이 (no-JS 폴백 드리프트 차단)
 *   10. 지표 rpg-missions == campaign.MISSIONS.length (캡스톤 포함 총계)
 *   11. 홈 RPG_CLASS_KEYS 집합 == rpg/data/classes.js PLAYABLE 집합
 *   12. 홈 RPG_MAIN_CHAIN == campaign main 체인(챕터 순) + 제목 == missionData(id).title
 *   13. 메인 체인 순차 해금 그래프 (chN.unlock.missionsDone == [ch(N-1)]) — '이어하기' 전제
 *   14. 홈 SIM_SCENARIO_IDS 집합 == simulator/v0.5/index.html SCENARIOS 키 집합
 *   15. 홈 SIM_MAP_IDS 집합 == SCENARIOS[].maps 합집합
 *   16. 홈 SIM_CHAPTER_IDS 길이 == simulator/v0.5/legacy_module.js TOTAL_CHAPTERS
 *   17. 홈이 참조하는 시뮬 세이브 키 == legacy_module.js LEGACY_KEY
 *   18. 홈 KIT_SHEET_IDS == print-kit/*.html 실파일 집합(index.html 제외)
 *   19. 시뮬 카드 플레이타임 표기 == docs/22-game-identity.md 정체성 문구
 *   [v6.53 신규 — 온보딩]
 *   20. 온보딩 기본(no-JS) 뷰 = 신규 방문자 뷰 + CTA href == RPG 트랙 카드 href
 *   21. 세이브 파싱 실패 경로에 console.warn 존재 (조용한 실패 금지)
 *   22. 스크립트가 참조하는 element id 전부 HTML 에 존재 (id 드리프트)
 *   [v6.53 신규 — PWA]
 *   23. manifest icons src 파일 존재 + PNG 실측 크기 == sizes 표기
 *   24. maskable 아이콘이 any 와 별도 파일 (안전영역 전용본)
 *   25. manifest shortcuts url 집합 == 홈 트랙 카드 href 집합 + 아이콘 파일 존재/크기 일치
 *   26. manifest theme_color == 홈 <meta name="theme-color">
 *   [v6.53 신규 — 접근성]
 *   27. 대비비 AA 전수 — 홈 팔레트 기반 (전경,배경) 쌍 전부 >= 4.5:1
 *   28. 터치 타겟 44px 하한 선언 · 포커스 링 제거(outline:none) 잔존 0
 *   29. 랜드마크/헤딩 구조 — main 1 · footer(main 밖) 1 · h1 1 · 카드 h3 3 · 섹션 h2
 *
 * 실행:  node _home_check.js        (PASS→exit 0 / FAIL→exit 1)
 * 순수 node, 외부 의존 0. campaign.js/save.js/classes.js/시뮬·킷 파일은 읽기 전용 참조.
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
function numbersInArray(src, name) {
  const re = new RegExp('var\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\]');
  const m = src.match(re);
  if (!m) throw new Error('홈에서 ' + name + ' 배열을 찾지 못함');
  return (m[1].match(/-?\d+/g) || []).map(Number);
}
// { id: 'x', t: 'y' } 객체 배열 파서 (RPG_MAIN_CHAIN 전용)
function objArray(src, name) {
  const re = new RegExp('var\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\n\\s*\\];');
  const m = src.match(re);
  if (!m) throw new Error('홈에서 ' + name + ' 객체 배열을 찾지 못함');
  return [...m[1].matchAll(/\{\s*id:\s*'([^']+)'\s*,\s*t:\s*'([^']+)'\s*\}/g)]
    .map((x) => ({ id: x[1], t: x[2] }));
}

const homeMissions = stringsInArray(html, 'RPG_MISSION_IDS');
const homeEndings = stringsInArray(html, 'RPG_ENDING_KEYS');
const homeCapstones = stringsInArray(html, 'RPG_CAPSTONE_IDS');
const homeClasses = stringsInArray(html, 'RPG_CLASS_KEYS');
const homeChain = objArray(html, 'RPG_MAIN_CHAIN');
const homeScenarios = stringsInArray(html, 'SIM_SCENARIO_IDS');
const homeCoop = stringsInArray(html, 'SIM_COOP_IDS');
const homeMaps = stringsInArray(html, 'SIM_MAP_IDS');
const homeSimChapters = numbersInArray(html, 'SIM_CHAPTER_IDS');
const homeKitSheets = stringsInArray(html, 'KIT_SHEET_IDS');

// 홈이 참조하는 localStorage 키 수집
const keyMatches = [...html.matchAll(/localStorage\.getItem\(([^)]*)\)/g)].map((m) => m[1].trim());
const homeSaveKeyLiterals = [...html.matchAll(/var\s+\w*SAVE_KEY\s*=\s*'([^']+)'/g)].map((m) => m[1]);

// 카드 지표 (data-metric) 정적값 — no-JS 폴백
const metricStatic = {};
for (const m of html.matchAll(/data-metric="([\w-]+)"\s*>([^<]*)</g)) {
  metricStatic[m[1]] = m[2].trim();
}

// 트랙 카드 href
const cardHref = {};
for (const m of html.matchAll(/<a class="card (\w+)" id="card-\w+" href="([^"]+)"/g)) {
  cardHref[m[1]] = m[2];
}

// ── 정본 로드 — 읽기 전용 참조 ────────────────────────────────────────────
const campaign = require('./rpg/systems/campaign.js');
const save = require('./rpg/state/save.js');
const classes = require('./rpg/data/classes.js');

const canonMissions = campaign.MISSIONS
  .filter((m) => m.branch !== 'capstone')
  .map((m) => m.id);
const canonCapstones = campaign.MISSIONS
  .filter((m) => m.branch === 'capstone')
  .map((m) => m.id);

const canonEndings = [
  ...new Set(
    campaign.MISSIONS.flatMap((m) => (m.unlock && m.unlock.endingSeen) || [])
  ),
];

const canonMainChain = campaign.MISSIONS
  .filter((m) => m.kind === 'main')
  .sort((a, b) => a.chapter - b.chapter);

// 시뮬레이터 정본 (텍스트 파싱 — 브라우저 전용 JSX 파일이라 require 불가)
const simHtml = fs.readFileSync(path.join(ROOT, 'simulator', 'v0.5', 'index.html'), 'utf8');
function scenarioBlock(src) {
  const start = src.indexOf('const SCENARIOS = {');
  if (start < 0) throw new Error('simulator/v0.5/index.html 에서 SCENARIOS 를 찾지 못함');
  let i = src.indexOf('{', start), depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  throw new Error('SCENARIOS 블록 괄호 짝을 찾지 못함');
}
const scBlock = scenarioBlock(simHtml);
const canonScenarios = [...scBlock.matchAll(/^\s{2}(S\d+):\s*\{/gm)].map((m) => m[1]);
const canonMaps = [
  ...new Set(
    [...scBlock.matchAll(/maps:\s*\[([^\]]*)\]/g)]
      .flatMap((m) => (m[1].match(/'([^']*)'/g) || []).map((s) => s.slice(1, -1)))
  ),
];

const legacySrc = fs.readFileSync(path.join(ROOT, 'simulator', 'v0.5', 'legacy_module.js'), 'utf8');
const canonTotalChapters = Number((legacySrc.match(/var\s+TOTAL_CHAPTERS\s*=\s*(\d+)/) || [])[1]);
const canonLegacyKey = (legacySrc.match(/var\s+LEGACY_KEY\s*=\s*'([^']+)'/) || [])[1];

// 프린트 킷 정본 — 실제 인쇄물 파일 목록(index.html 제외)
const kitFiles = fs.readdirSync(path.join(ROOT, 'print-kit'))
  .filter((f) => /^\d.*\.html$/.test(f))
  .map((f) => f.replace(/\.html$/, ''))
  .sort();

// ── 검증 ──────────────────────────────────────────────────────────────────
// 1. 미션 집합 동치
check(setEq(homeMissions, canonMissions),
  '미션 ID 집합 동치 (홈 ' + homeMissions.length + ' ↔ campaign 비캡스톤 ' + canonMissions.length + ')');

// 2. 개수 + 중복 없음
check(homeMissions.length === canonMissions.length, '홈 미션 개수 == campaign 비캡스톤 개수 (홈 ' + homeMissions.length + ' ↔ campaign ' + canonMissions.length + ')');
check(new Set(homeMissions).size === homeMissions.length, '홈 미션 목록 중복 없음');
check(canonMissions.length >= 29, 'campaign 비캡스톤 개수 >= 29 (실제 ' + canonMissions.length + ' — 콘텐츠는 늘 수만 있음, 감소=회귀)');

// 3. 캡스톤 분리
check(!homeMissions.includes(CAPSTONE_ID), '홈 미션 목록에 캡스톤(' + CAPSTONE_ID + ') 미포함');
check(campaign.MISSIONS.some((m) => m.id === CAPSTONE_ID),
  'campaign 에 캡스톤(' + CAPSTONE_ID + ') 존재(비캡스톤 목록에서만 제외 대상)');
check(setEq(homeCapstones, canonCapstones),
  '홈 RPG_CAPSTONE_IDS == campaign 캡스톤 집합 (홈 ' + homeCapstones.length + ' ↔ campaign ' + canonCapstones.length + ')');

// 4. RPG 세이브 키 대조 — 상수 리터럴 + 실제 로드 경로(loadSave(RPG_SAVE_KEY)) 양쪽
check(homeSaveKeyLiterals.includes(save.KEY) &&
  /loadSave\(RPG_SAVE_KEY\)/.test(html) && keyMatches.length > 0,
  "홈이 RPG 세이브 키 '" + save.KEY + "' 를 상수로 참조·로드 (save.js KEY 와 일치)");

// 5. 엔딩 키 집합 동치
check(setEq(homeEndings, canonEndings),
  '엔딩 키 집합 동치 (홈 ' + homeEndings.length + ' ↔ campaign endingSeen ' + canonEndings.length + ')');

// ── 6. [v6.46 · H1] 표시 분모가 배열 길이 파생인가 (하드코딩 리터럴 잔존 검출) ─────
//    주석은 카운트를 서술할 수 있으므로 제거한 뒤 실행 코드만 스캔한다.
//    [v6.53] 줄 주석을 블록 주석보다 먼저 제거한다 — 줄 주석 안의 '/','*' 조합(예: 경로 글롭)이
//    가짜 블록 주석 시작으로 오인돼 뒤 코드를 통째로 삼키면, 가드가 조용히 무력화된다(실제 발생).
const homeCode = html
  .replace(/<!--[\s\S]*?-->/g, '')      // HTML 주석
  .replace(/^[ \t]*\/\/.*$/gm, '')       // JS 줄 주석(줄 전체)
  .replace(/([;{}(),])[ \t]*\/\/.*$/gm, '$1') // 코드 뒤 꼬리 주석
  .replace(/\/\*[\s\S]*?\*\//g, '');     // JS/CSS 블록 주석

const denomHardcode = [
  // 텍스트 분모:  mCount + '/31'  형태
  ...[...homeCode.matchAll(/mCount\s*\+\s*'\/\s*(\d+)/g)].map((m) => "텍스트 '/" + m[1] + "'"),
  // 바 분모:      (mCount / 29)   형태
  ...[...homeCode.matchAll(/mCount\s*\/\s*(\d+)/g)].map((m) => '바 (mCount / ' + m[1] + ')'),
  // 엔딩 분모:    eCount + '/4'   형태
  ...[...homeCode.matchAll(/eCount\s*\+\s*'\/\s*(\d+)/g)].map((m) => "엔딩 '/" + m[1] + "'"),
  // [v6.53] 시뮬 챕터 분모:  p.count + '/8' · (p.count / 8) 형태
  ...[...homeCode.matchAll(/(?:p\.)?count\s*\+\s*'\/\s*(\d+)/g)].map((m) => "시뮬 텍스트 '/" + m[1] + "'"),
  ...[...homeCode.matchAll(/(?:p\.)?count\s*\/\s*(\d+)/g)].map((m) => '시뮬 바 (count / ' + m[1] + ')'),
];
check(denomHardcode.length === 0,
  '진행 배지 표시 분모에 하드코딩 리터럴 없음(RPG+시뮬)' +
    (denomHardcode.length ? ' — 잔존: ' + denomHardcode.join(', ') : ''));

// 분모가 실제로 배열 길이에서 파생됐는지(제거만 하고 미연결인 회귀 방지)
const rpgTextStmt = (homeCode.match(/rpgText\.textContent\s*=[\s\S]*?;/) || [''])[0];
const rpgPctStmt = (homeCode.match(/var\s+rpgPct\s*=[\s\S]*?;/) || [''])[0];
const mTotalStmt = (homeCode.match(/var\s+mTotal\s*=[\s\S]*?;/) || [''])[0];
const derives = (s) => /RPG_MISSION_IDS\.length|RPG_ENDING_KEYS\.length|mTotal/.test(s);
check(derives(mTotalStmt) && derives(rpgTextStmt) && derives(rpgPctStmt),
  'RPG 표시 분모 = 배열 길이 파생 (텍스트·바 단일 소스)');

const simTotalStmt = (homeCode.match(/var\s+simTotal\s*=[\s\S]*?;/) || [''])[0];
const simTextStmt = (homeCode.match(/text\.textContent\s*=[\s\S]*?;/) || [''])[0];
const simPctStmt = (homeCode.match(/var\s+simPct\s*=[\s\S]*?;/) || [''])[0];
const derivesSim = (s) => /SIM_CHAPTER_IDS\.length|simTotal/.test(s);
check(derivesSim(simTotalStmt) && derivesSim(simTextStmt) && derivesSim(simPctStmt),
  '시뮬 표시 분모 = 배열 길이 파생 (텍스트·바 단일 소스)');

// ── 7. [v6.46 · M9] 홈 버전 스탬프 == CHANGELOG 최신 '### v6.NN' ─────────────────
const stampM = html.match(/class="stamp"[^>]*>[\s\S]*?<b>\s*(v[\d.]+)\s*<\/b>/);
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
const clM = changelog.match(/^###\s+(v6\.\d+)/m); // 최신순 문서 — 첫 매치가 최신
const homeStamp = stampM && stampM[1];
const latestVer = clM && clM[1];
check(!!homeStamp && !!latestVer && homeStamp === latestVer,
  '홈 버전 스탬프 == CHANGELOG 최신 (홈 ' + (homeStamp || '없음') + ' ↔ CHANGELOG ' + (latestVer || '없음') + ')');

// ── 8. [3차 감사 D4] README.md '현재 버전' 스탬프 == CHANGELOG 최신 ──────────────
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
const readmeM = readme.match(/\*\*현재 버전\*\*:\s*(v[\d.]+)/);
const readmeStamp = readmeM && readmeM[1];
check(!!readmeStamp && !!latestVer && readmeStamp === latestVer,
  'README 버전 스탬프 == CHANGELOG 최신 (README ' + (readmeStamp || '없음') + ' ↔ CHANGELOG ' + (latestVer || '없음') + ')');

// ══════════════════════════════════════════════════════════════════════════
// [v6.53 신규] 카드 지표 — 표시 수치는 파생이거나, 정본 대조 가드를 갖는다
// ══════════════════════════════════════════════════════════════════════════
// 9. data-metric 정적값(no-JS 폴백) == 홈 단일 소스 배열 길이
const metricExpect = {
  'sim-scenarios': homeScenarios.length,
  'sim-coop': homeCoop.length,
  'sim-chapters': homeSimChapters.length,
  'sim-maps': homeMaps.length,
  'rpg-missions': homeMissions.length + homeCapstones.length,
  'rpg-classes': homeClasses.length,
  'rpg-endings': homeEndings.length,
  'kit-sheets': homeKitSheets.length,
};
const metricDrift = Object.keys(metricExpect)
  .filter((k) => String(metricExpect[k]) !== metricStatic[k])
  .map((k) => k + '(HTML ' + (metricStatic[k] === undefined ? '없음' : metricStatic[k]) + ' ↔ 배열 ' + metricExpect[k] + ')');
check(metricDrift.length === 0,
  '카드 지표 정적값(no-JS 폴백) == 단일 소스 배열 길이 · ' + Object.keys(metricExpect).length + '종' +
    (metricDrift.length ? ' — 불일치: ' + metricDrift.join(', ') : ''));

// 10. rpg-missions 총계 == campaign.MISSIONS.length (캡스톤 포함)
check(metricExpect['rpg-missions'] === campaign.MISSIONS.length,
  '지표 rpg-missions == campaign.MISSIONS 총계 (홈 ' + metricExpect['rpg-missions'] + ' ↔ campaign ' + campaign.MISSIONS.length + ')');

// 11. 클래스 집합 == classes.js PLAYABLE
const canonPlayable = Array.isArray(classes.PLAYABLE) ? classes.PLAYABLE : Object.keys(classes.PLAYABLE || {});
check(setEq(homeClasses, canonPlayable),
  '홈 RPG_CLASS_KEYS 집합 == classes.js PLAYABLE (홈 ' + homeClasses.length + ' ↔ PLAYABLE ' + canonPlayable.length + ')');

// 12. 메인 체인 id 순서 + 제목 == 정본
const chainIdsOk = homeChain.length === canonMainChain.length &&
  homeChain.every((c, i) => c.id === canonMainChain[i].id);
check(chainIdsOk,
  '홈 RPG_MAIN_CHAIN id 순서 == campaign main 체인(챕터 순, ' + canonMainChain.length + '종)');
const titleDrift = [];
if (chainIdsOk) {
  homeChain.forEach((c) => {
    let canonTitle = '';
    try { canonTitle = (campaign.missionData(c.id) || {}).title || ''; } catch (e) { canonTitle = ''; }
    // 정본 형식: 'Chapter NN — <제목>'
    const sub = (canonTitle.split('—')[1] || '').trim();
    if (sub !== c.t) titleDrift.push(c.id + "('" + c.t + "' ↔ 정본 '" + sub + "')");
  });
}
check(chainIdsOk && titleDrift.length === 0,
  '홈 메인 체인 제목 == missionData(id).title 부제부' + (titleDrift.length ? ' — 불일치: ' + titleDrift.join(', ') : ''));

// 13. 메인 체인 순차 해금 — '이어하기 = 첫 미클리어 챕터' 산출의 전제
const chainSeq = canonMainChain.every((m, i) => {
  if (i === 0) return m.unlock == null;
  const req = m.unlock && m.unlock.missionsDone;
  return Array.isArray(req) && req.length === 1 && req[0] === canonMainChain[i - 1].id;
});
check(chainSeq, "메인 체인이 순차 해금(chN.unlock == [ch(N-1)]) — 홈 '이어하기' 산출 전제");

// 14. 시나리오 집합 == 시뮬 SCENARIOS 키
check(setEq(homeScenarios, canonScenarios),
  '홈 SIM_SCENARIO_IDS 집합 == simulator SCENARIOS 키 (홈 ' + homeScenarios.length + ' ↔ 시뮬 ' + canonScenarios.length + ')');

// 14b. [v6.55] 협동 시나리오 집합 == coop_module.js COOP_SCENARIOS 키
const coopSrc = fs.readFileSync(path.join(__dirname, 'simulator/v0.5/coop_module.js'), 'utf8');
const canonCoop = [...coopSrc.matchAll(/^\s{2}(C\d+):\s*\{/gm)].map((m) => m[1]);
check(setEq(homeCoop, canonCoop),
  '홈 SIM_COOP_IDS 집합 == coop_module COOP_SCENARIOS 키 (홈 ' + homeCoop.length + ' ↔ 협동 ' + canonCoop.length + ')');

// 15. 맵 규격 집합 == SCENARIOS[].maps 합집합
check(setEq(homeMaps, canonMaps),
  '홈 SIM_MAP_IDS 집합 == SCENARIOS maps 합집합 (' + canonMaps.join(', ') + ')');

// 16. 레거시 챕터 수 == legacy_module.js TOTAL_CHAPTERS
check(homeSimChapters.length === canonTotalChapters &&
  homeSimChapters.every((n, i) => n === i + 1),
  '홈 SIM_CHAPTER_IDS(1..N) == legacy_module TOTAL_CHAPTERS (홈 ' + homeSimChapters.length + ' ↔ 정본 ' + canonTotalChapters + ')');

// 17. 시뮬 세이브 키 == legacy_module.js LEGACY_KEY
check(homeSaveKeyLiterals.includes(canonLegacyKey),
  "홈이 시뮬 세이브 키 '" + canonLegacyKey + "' 를 상수로 참조 (legacy_module LEGACY_KEY 와 일치)");

// 18. 프린트 킷 시트 목록 == 실파일
check(setEq(homeKitSheets, kitFiles),
  '홈 KIT_SHEET_IDS == print-kit 실파일 집합 (홈 ' + homeKitSheets.length + ' ↔ 파일 ' + kitFiles.length + ')');

// 19. 시뮬 플레이타임 표기 == docs/22 정체성 문구 (홈에서 파생 불가한 수치 → 문서 대조)
const identity = fs.readFileSync(path.join(ROOT, 'docs', '22-game-identity.md'), 'utf8');
const homePlaytime = (html.match(/솔로 \+ 봇 3, ([\d~]+분)/) || [])[1];
check(!!homePlaytime && identity.includes(homePlaytime),
  '시뮬 카드 플레이타임 표기 == docs/22 정체성 문구 (홈 ' + (homePlaytime || '없음') + ')');

// ══════════════════════════════════════════════════════════════════════════
// [v6.53 신규] 온보딩(추천 진입점)
// ══════════════════════════════════════════════════════════════════════════
// 20. 기본(no-JS) 마크업 = 신규 방문자 뷰 + CTA 가 RPG 트랙을 정확히 가리킴
const obKicker = (html.match(/id="ob-kicker">([^<]*)</) || [])[1];
const obHref = (html.match(/id="ob-cta"\s+href="([^"]+)"/) || [])[1];
const obTitle = (html.match(/id="ob-title">([^<]*)</) || [])[1] || '';
check(obKicker === '처음이라면' && obHref === cardHref.rpg && homeChain.length > 0 && obTitle.includes(homeChain[0].t),
  "온보딩 기본 뷰 = 신규 방문자('" + obKicker + "' · " + obHref + " · '" + obTitle + "')" +
    ' — CTA href == RPG 카드 href, 제목 == 체인 1번 미션');

// 21. 파싱 실패 경로가 조용하지 않은가 (console.warn)
const warnPaths = (homeCode.match(/warn\(/g) || []).length;
check(/function warn\(/.test(homeCode) && /console\.warn/.test(homeCode) &&
  /JSON\.parse\(raw\)/.test(homeCode) && /파싱 실패/.test(homeCode) && warnPaths >= 5,
  '세이브 파싱 실패 시 console.warn (조용한 실패 금지 · warn 호출 ' + warnPaths + '곳)');

// 22. 스크립트가 참조하는 element id 가 전부 HTML 에 존재
const refIds = [...new Set([...homeCode.matchAll(/byId\('([^']+)'\)/g)].map((m) => m[1]))];
const missingIds = refIds.filter((id) => !new RegExp('id="' + id + '"').test(html));
check(refIds.length > 0 && missingIds.length === 0,
  '스크립트 참조 element id 전부 존재 (' + refIds.length + '종)' + (missingIds.length ? ' — 없음: ' + missingIds.join(', ') : ''));

// ══════════════════════════════════════════════════════════════════════════
// [v6.53 신규] PWA — manifest ↔ 실자산 ↔ 홈 대조
// ══════════════════════════════════════════════════════════════════════════
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
function pngSize(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  const fd = fs.openSync(p, 'r');
  const buf = Buffer.alloc(24);
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
  return buf.readUInt32BE(16) + 'x' + buf.readUInt32BE(20);
}
// 23. icons src 존재 + 실측 크기 == sizes
const iconProblems = [];
for (const ic of manifest.icons || []) {
  const real = pngSize(ic.src);
  if (real === null) iconProblems.push(ic.src + '(파일 없음/PNG 아님)');
  else if (real !== ic.sizes) iconProblems.push(ic.src + '(표기 ' + ic.sizes + ' ↔ 실측 ' + real + ')');
}
check((manifest.icons || []).length >= 3 && iconProblems.length === 0,
  'manifest icons 파일 존재 + 실측 크기 일치 (' + (manifest.icons || []).length + '종)' +
    (iconProblems.length ? ' — 문제: ' + iconProblems.join(', ') : ''));

// 24. maskable 전용본 (any 와 다른 파일 — 안전영역 축소본)
const anySrcs = (manifest.icons || []).filter((i) => /any/.test(i.purpose || 'any')).map((i) => i.src);
const maskSrcs = (manifest.icons || []).filter((i) => /maskable/.test(i.purpose || '')).map((i) => i.src);
check(maskSrcs.length >= 1 && maskSrcs.every((s) => !anySrcs.includes(s)),
  'maskable 아이콘이 any 와 별도 파일 (안전영역 전용본: ' + (maskSrcs.join(', ') || '없음') + ')');

// 25. shortcuts == 트랙 카드 href + 아이콘 자산
const shortcuts = manifest.shortcuts || [];
const scUrls = shortcuts.map((s) => s.url);
const trackHrefs = [cardHref.sim, cardHref.rpg, cardHref.kit].filter(Boolean);
const scIconProblems = [];
for (const s of shortcuts) {
  for (const ic of s.icons || []) {
    const real = pngSize(ic.src);
    if (real === null) scIconProblems.push(ic.src + '(파일 없음)');
    else if (real !== ic.sizes) scIconProblems.push(ic.src + '(표기 ' + ic.sizes + ' ↔ 실측 ' + real + ')');
  }
  if (!(s.icons || []).length) scIconProblems.push(s.url + '(아이콘 없음)');
}
check(trackHrefs.length === 3 && setEq(scUrls, trackHrefs) && scIconProblems.length === 0,
  'manifest shortcuts url 집합 == 트랙 카드 href 3종 + 아이콘 자산 일치' +
    (scIconProblems.length ? ' — 문제: ' + scIconProblems.join(', ') : ''));

// 26. theme_color 일치
const metaTheme = (html.match(/<meta name="theme-color" content="([^"]+)"/) || [])[1];
check(!!metaTheme && metaTheme.toLowerCase() === String(manifest.theme_color).toLowerCase(),
  'manifest theme_color == 홈 meta theme-color (' + metaTheme + ')');

// ══════════════════════════════════════════════════════════════════════════
// [v6.53 신규] 접근성 — 대비비 · 터치 타겟 · 랜드마크
// ══════════════════════════════════════════════════════════════════════════
// 팔레트 토큰 파싱 (:root 커스텀 프로퍼티)
const rootBlock = (html.match(/:root\s*\{([\s\S]*?)\}/) || ['', ''])[1];
const tok = {};
for (const m of rootBlock.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) tok[m[1]] = m[2];
function hex(v) { return v.startsWith('#') ? v : (tok[v] || null); }
function lum(h) {
  const c = h.replace('#', '');
  const ch = [0, 2, 4].map((i) => {
    const x = parseInt(c.slice(i, i + 2), 16) / 255;
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function ratio(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
// (용도, 전경, 배경) — 전경/배경은 팔레트 토큰명 또는 리터럴 hex.
// 전부 본문 텍스트 기준 AA 4.5:1 하한을 적용한다(대형 텍스트 예외 미적용 = 보수적).
const AA_PAIRS = [
  ['본문 텍스트/카드', 'text', 'bg2'],
  ['카드 설명', '#9a9ab0', 'bg2'],
  ['지표 라벨', 'text-mid', 'bg2'],
  ['지표 숫자(시뮬)', 'cyan', 'bg2'],
  ['지표 숫자(RPG)', 'magenta', 'bg2'],
  ['지표 숫자(킷)', 'yellow', 'bg2'],
  ['배지 텍스트', 'text-dim', 'bg3'],
  ['배지 NEW', 'magenta', 'bg3'],
  ['카드 부제(시뮬)', 'cyan', 'bg2'],
  ['카드 부제(RPG)', 'magenta', 'bg2'],
  ['카드 부제(킷)', 'yellow', 'bg2'],
  ['카드 CTA(RPG)', 'magenta', 'bg2'],
  ['진행 배지 텍스트', 'text-mid', 'bg2'],
  ['히어로 라벨', 'cyan', 'bg'],
  ['히어로 태그라인', '#b8b8d0', 'bg'],
  ['버전 스탬프 텍스트', 'text-dim', 'bg2'],
  ['버전 스탬프 버전', 'green', 'bg2'],
  ['섹션 헤딩', 'text-mid', 'bg'],
  ['온보딩 키커(신규·녹색)', 'bg', 'green'],
  ['온보딩 키커(RPG 이어하기)', 'bg', 'magenta'],
  ['온보딩 키커(시뮬 이어하기)', 'bg', 'cyan'],
  ['온보딩 제목', 'text', 'bg2'],
  ['온보딩 부제', 'text-mid', 'bg2'],
  ['온보딩 주석', 'text-dim', 'bg'],
  ['온보딩 화살표(신규)', 'green', 'bg2'],
  ['온보딩 화살표(RPG)', 'magenta', 'bg2'],
  ['오프라인 고지', 'yellow', '#1a1608'],
  ['부가 링크', 'text-dim', 'bg'],
  ['푸터', '#7a7a92', 'bg'],
  ['푸터 구분자', '#7a7a92', 'bg'],
];
const aaFails = [];
for (const [name, f, b] of AA_PAIRS) {
  const fg = hex(f), bgc = hex(b);
  if (!fg || !bgc) { aaFails.push(name + '(색 토큰 해석 실패)'); continue; }
  const r = ratio(fg, bgc);
  if (r < 4.5) aaFails.push(name + ' ' + r.toFixed(2) + ':1');
}
check(aaFails.length === 0,
  '대비비 AA(4.5:1) 전수 — ' + AA_PAIRS.length + '쌍' + (aaFails.length ? ' — 미달: ' + aaFails.join(', ') : ''));

// 28. 터치 타겟 44px + 포커스 링 제거 잔존 0
// 주석 안에서 'outline:none' 을 서술할 수 있으므로 주석 제거 후 선언부만 스캔한다.
const cssBlock = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1]
  .replace(/\/\*[\s\S]*?\*\//g, '');
const linkRule = (cssBlock.match(/\.links a \{([\s\S]*?)\}/) || ['', ''])[1];
const minH = Number((linkRule.match(/min-height:\s*(\d+)px/) || [])[1] || 0);
const outlineNone = (cssBlock.match(/outline:\s*none/g) || []).length;
check(minH >= 44 && outlineNone === 0,
  '터치 타겟 .links a min-height ' + minH + 'px(>=44) · outline:none 잔존 ' + outlineNone + '곳(0이어야 함)');
check(/:focus-visible\s*\{[^}]*outline:\s*2px/.test(cssBlock) &&
  /\.card:focus-visible\s*\{[^}]*outline:\s*2px/.test(cssBlock),
  '포커스 링 명시 — 전역 :focus-visible + 카드 focus-visible outline 2px');

// 29. 랜드마크/헤딩 구조
const mainCount = (html.match(/<main\b/g) || []).length;
const footerCount = (html.match(/<footer\b/g) || []).length;
const h1Count = (html.match(/<h1\b/g) || []).length;
const h2Count = (html.match(/<h2\b/g) || []).length;
const h3Count = (html.match(/<h3\b/g) || []).length;
const footerOutsideMain = html.indexOf('<footer') > html.indexOf('</main>');
check(mainCount === 1 && footerCount === 1 && footerOutsideMain && h1Count === 1 && h2Count >= 2 && h3Count === 3,
  '랜드마크/헤딩 — main ' + mainCount + ' · footer ' + footerCount + '(main 밖 ' + footerOutsideMain + ') · h1 ' +
    h1Count + ' · h2 ' + h2Count + ' · h3 ' + h3Count);

// ── 결과 리포트 ────────────────────────────────────────────────────────────
console.log('DEAD NEXUS — 홈 ↔ 정본 드리프트 가드 (_home_check.js)\n');
ok.forEach((m) => console.log('  PASS  ' + m));
if (fail.length) {
  console.log('');
  fail.forEach((m) => console.log('  FAIL  ' + m));
  // 진단 보조: 어긋난 원소를 명시
  const missOnlyHome = homeMissions.filter((x) => !canonMissions.includes(x));
  const missOnlyCanon = canonMissions.filter((x) => !homeMissions.includes(x));
  if (missOnlyHome.length) console.log('        홈에만 있음: ' + missOnlyHome.join(', '));
  if (missOnlyCanon.length) console.log('        campaign 에만 있음: ' + missOnlyCanon.join(', '));
  const kitOnlyHome = homeKitSheets.filter((x) => !kitFiles.includes(x));
  const kitOnlyDisk = kitFiles.filter((x) => !homeKitSheets.includes(x));
  if (kitOnlyHome.length) console.log('        킷 홈에만 있음: ' + kitOnlyHome.join(', '));
  if (kitOnlyDisk.length) console.log('        킷 디스크에만 있음: ' + kitOnlyDisk.join(', '));
  console.log('\n결과: FAIL (' + ok.length + ' pass / ' + fail.length + ' fail)');
  process.exit(1);
}
console.log('\n결과: PASS (' + ok.length + '/' + ok.length + ')');
process.exit(0);
