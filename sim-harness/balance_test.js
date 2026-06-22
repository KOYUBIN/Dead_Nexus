// ============================================================================
// DEAD NEXUS — 밸런스 회귀 테스트 스위트 (v6.0)
// 200판 시뮬 + 임계 체크. CI 친화적: 임계 위반 시 exit 1 (--strict).
//
// 사용법:
//   node balance_test.js                  # N=200 / 11x11
//   node balance_test.js 500              # N=500
//   node balance_test.js 200 5x5          # 5x5 모드 200판
//   node balance_test.js 200 both         # 11x11 + 5x5 둘 다 (Item 3)
//   node balance_test.js 200 11x11 --strict     # 임계 위반 시 exit 1
//   node balance_test.js 200 11x11 --seed=42    # 결정론(회귀 비교용, Item 4)
//   node balance_test.js --trace 11x11 bloc AXIOM 42   # 시그니처/하이라이트/견제 발동 트레이스 (Item 4)
//
// v6.0 변경(Item 1/3/4):
//   - 임계값을 euro_mechanics.js의 MODE_CONFIG에서 파생 (단일 소스)
//   - 출력: 진영 그룹별 클래스 표 + 막대 + 시그니처 효율 + 잔여 이슈
//   - --seed 결정론 옵션(리팩토링 회귀 검증) / --trace 발동 타임라인
// ============================================================================

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
};

const fs = require('fs');
const core = fs.readFileSync(__dirname + '/core.js', 'utf8');
const euro = fs.existsSync(__dirname + '/euro_mechanics.js')
  ? fs.readFileSync(__dirname + '/euro_mechanics.js', 'utf8')
  : '';
const harness = fs.readFileSync(__dirname + '/harness_body.js', 'utf8');

// 시드 가능 RNG (Mulberry32) — narrative_trace.js와 동일
function makeSeededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 인자 파싱
const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));
const pos = args.filter(a => !a.startsWith('--'));
const isStrict = flags.includes('--strict');
const isTrace = flags.includes('--trace') || pos[0] === 'trace';
const seedFlag = flags.find(f => f.startsWith('--seed'));
const seedArg = seedFlag ? (parseInt(seedFlag.split('=')[1]) || 42) : null;

// 클래스 진영 분류 (출력 그룹화용)
const GHOST_CLASSES = ['CIPHER', 'BLADE', 'BROKER', 'RIGGER', 'DRIFTER', 'MOLE'];
const BLOC_CLASSES = ['VANTA', 'IRONWALL', 'HELIX', 'AXIOM', 'CARBON'];

// harness_body.js의 말단 standalone 실행 블록 제거 (함수 정의만 사용)
const harnessFns = harness.replace(
  /^const N = parseInt\(process\.argv\[2\]\) \|\| 50;[\s\S]*$/m,
  '// (standalone 블록 제거 — balance_test가 직접 호출)\n'
);
const code = core + '\n\n' + euro + '\n\n' + harnessFns;
eval(code);

// ---------------------------------------------------------------------------
// 막대 헬퍼 (0~100% → 길이 width 막대)
function bar(pct, width = 12, lo = 0, hi = 100) {
  const n = Math.max(0, Math.min(width, Math.round((pct - lo) / (hi - lo) * width)));
  return '█'.repeat(n) + '░'.repeat(width - n);
}

// ---------------------------------------------------------------------------
// 트레이스 모드 (Item 4): 한 판 시드 고정 + 발동 타임라인 출력
function runTrace() {
  const mapSize = pos.find(p => p === '11x11' || p === '5x5') || '11x11';
  const role = pos.find(p => p === 'ghost' || p === 'bloc') || 'ghost';
  const allCls = [...GHOST_CLASSES, ...BLOC_CLASSES];
  const cls = pos.find(p => allCls.includes(p)) || (role === 'ghost' ? 'BLADE' : 'AXIOM');
  const seed = seedArg || parseInt(pos[pos.length - 1]) || 42;

  Math.random = makeSeededRng(seed);
  if (typeof EURO_TRACE_DETAIL !== 'undefined') EURO_TRACE_DETAIL = true;

  const mc = euro_mode(mapSize);
  const r = runOneGame({ humanRole: role, humanSpecific: cls, mapSize, maxRounds: mc.safetyRounds });

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`║ 발동 트레이스 — P0 ${role}/${cls} · ${mc.label} · seed ${seed}`.padEnd(66) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  const tl = (typeof EURO_TRACE !== 'undefined' && EURO_TRACE.timeline) || [];
  if (tl.length === 0) {
    console.log('  (발동 기록 없음 — EURO_TRACE_DETAIL 미지원?)');
  } else {
    const KIND = { signature: '🎭 시그니처', highlight: '✨ 하이라이트', suppression: '🚧 견제' };
    let curR = -1;
    for (const ev of tl) {
      if (ev.round !== curR) { curR = ev.round; console.log(`\n  ── R${curR} ──`); }
      console.log(`    ${KIND[ev.kind] || ev.kind}  ${ev.msg}`);
    }
  }
  console.log('');
  console.log(`  결과: 승자 P${r.winner} (${r.winnerSpecific || '-'}) · ${r.round}R · ${r.reason || ''}`);
  console.log(`  집계: 시그니처 ${JSON.stringify(r.signatureTriggers)} · 하이라이트 ${r.highlightTriggers} · 견제 ${r.suppressionCount}`);
  console.log('');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 단일 모드 측정 + 출력. failures/warnings 누적 반환.
function runMode(N, MAP_SIZE) {
  const mc = euro_mode(MAP_SIZE);
  // Item 1: 임계값을 MODE_CONFIG에서 파생
  const t = {
    ghostWinRate: mc.faction.ghost,
    blocWinRate: mc.faction.bloc,
    avgRound: mc.avgRound,
    classMaxWinRate: mc.classWinRate.max,
    classMinWinRate: mc.classWinRate.min,
  };

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`║ DEAD NEXUS 밸런스 회귀 — N=${String(N).padEnd(4)} · ${mc.label.padEnd(14)} · ${isStrict ? '엄격' : '권고'}`.padEnd(66) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const start = Date.now();
  const { results, errors, errorList } = batchRun(N, MAP_SIZE, mc.safetyRounds);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (errors > 0) {
    console.log(`⚠ 시뮬 에러 ${errors}판 / ${N}판`);
    errorList.slice(0, 3).forEach(e => console.log(`  ${e.humanRole}/${e.humanSpecific}: ${e.msg}`));
  }

  const a = analyze(results);
  const ghostPct = a.winnerRoles.ghost / a.N * 100;
  const blocPct = a.winnerRoles.bloc / a.N * 100;
  const avgR = parseFloat(a.rounds.avg);

  console.log(`\n✅ ${results.length}판 완료 (${elapsed}초) · 평균 ${a.rounds.avg}R (${a.rounds.min}~${a.rounds.max})`);

  const failures = [];
  const warnings = [];

  // 진영 균형 ------------------------------------------------------------
  console.log('\n🎯 진영 균형                  승률   막대            허용');
  function factionLine(label, val, range) {
    const ok = val >= range.min && val <= range.max;
    const flag = ok ? '✅' : '❌';
    console.log(`   ${flag} ${label.padEnd(8)} ${val.toFixed(1).padStart(5)}%  ${bar(val, 14, 20, 70)}  ${range.min}~${range.max}`);
    if (!ok) failures.push(`${label} 진영 ${val.toFixed(1)}% (허용 ${range.min}~${range.max})`);
  }
  factionLine('Ghost', ghostPct, t.ghostWinRate);
  factionLine('Bloc', blocPct, t.blocWinRate);
  const avgOk = avgR >= t.avgRound.min && avgR <= t.avgRound.max;
  console.log(`   ${avgOk ? '✅' : '❌'} 평균라운드  ${avgR.toFixed(1).padStart(5)}   (목표 ${t.avgRound.target}, 허용 ${t.avgRound.min}~${t.avgRound.max})`);
  if (!avgOk) failures.push(`평균 라운드 ${avgR.toFixed(1)} (허용 ${t.avgRound.min}~${t.avgRound.max})`);

  // 클래스별 (진영 그룹) -------------------------------------------------
  const sigAvg = (a.trace && a.trace.avgSignaturePerGame) || {};
  function classRow(k) {
    const v = a.bySpecific[k];
    if (!v) return;
    const pct = parseFloat(v.winRate);
    const over = pct > t.classMaxWinRate;
    const under = pct < t.classMinWinRate;
    const flag = over ? '❌' : under ? '⚠ ' : '✅';
    const sig = sigAvg[k] != null ? String(sigAvg[k]).padStart(5) : '    —';
    console.log(`   ${flag} ${k.padEnd(9)} ${pct.toFixed(1).padStart(5)}%  ${bar(pct, 12, 0, t.classMaxWinRate)}  sig ${sig}  (${v.wins}/${v.total})`);
    if (over) failures.push(`${k} 폭주 ${pct.toFixed(1)}% > ${t.classMaxWinRate}%`);
    if (under) warnings.push(`${k} 저조 ${pct.toFixed(1)}% < ${t.classMinWinRate}%`);
  }
  console.log(`\n👻 Ghost 클래스 (P0)        승률   막대(상한 ${t.classMaxWinRate})    시그니처  승/판`);
  GHOST_CLASSES.slice().sort((x, y) => parseFloat((a.bySpecific[y] || {}).winRate || 0) - parseFloat((a.bySpecific[x] || {}).winRate || 0)).forEach(classRow);
  console.log(`\n🏢 Bloc 클래스 (P0)         승률   막대(상한 ${t.classMaxWinRate})    시그니처  승/판`);
  BLOC_CLASSES.slice().sort((x, y) => parseFloat((a.bySpecific[y] || {}).winRate || 0) - parseFloat((a.bySpecific[x] || {}).winRate || 0)).forEach(classRow);

  // 트레이스 -------------------------------------------------------------
  if (a.trace) {
    const supAvg = parseFloat(a.trace.avgSuppressionPerGame);
    console.log(`\n🔍 발동(게임당): 하이라이트 ${a.trace.avgHighlightsPerGame} · 견제 ${a.trace.avgSuppressionPerGame}회 (≈₵${(supAvg * 5).toFixed(0)}/판)`);
  }

  // 잔여 이슈 ------------------------------------------------------------
  console.log('\n' + '━'.repeat(66));
  if (failures.length === 0 && warnings.length === 0) {
    console.log('✅ 모든 임계 통과 — 밸런스 안정적');
  } else {
    console.log(`📌 잔여 이슈 (위반 ${failures.length} · 경고 ${warnings.length})`);
    [...failures.map(f => `   ❌ ${f}`), ...warnings.map(w => `   ⚠ ${w}`)].slice(0, 5).forEach(l => console.log(l));
    const extra = failures.length + warnings.length - 5;
    if (extra > 0) console.log(`   … 외 ${extra}건`);
  }

  // 다음 사이클 추천 ------------------------------------------------------
  const ranked = Object.entries(a.bySpecific).map(([k, v]) => ({ k, pct: parseFloat(v.winRate) })).sort((x, y) => y.pct - x.pct);
  const top = ranked[0], bottom = ranked[ranked.length - 1];
  let rec = '데이터 부족';
  if (top && top.pct > t.classMaxWinRate) rec = `${top.k} ${MAP_SIZE} ${top.pct.toFixed(1)}% — 1순위 너프 후보`;
  else if (bottom && bottom.pct < t.classMinWinRate) rec = `${bottom.k} ${MAP_SIZE} ${bottom.pct.toFixed(1)}% — 1순위 버프 후보`;
  else if (top) rec = `${top.k} ${MAP_SIZE} ${top.pct.toFixed(1)}% (최고) — 관찰`;
  console.log(`💡 다음: ${rec}`);
  console.log('━'.repeat(66));

  return { failures, warnings, MAP_SIZE };
}

// ---------------------------------------------------------------------------
// main
if (isTrace) runTrace();

const N = parseInt(pos[0]) || 200;
const MAP_ARG = pos[1] || '11x11';
if (seedArg) Math.random = makeSeededRng(seedArg);

const modes = MAP_ARG === 'both' ? ['11x11', '5x5'] : [MAP_ARG];
let totalFail = 0;
const summaries = [];
for (const m of modes) {
  const res = runMode(N, m);
  totalFail += res.failures.length;
  summaries.push(res);
}

if (modes.length > 1) {
  console.log('\n📊 종합');
  summaries.forEach(s => console.log(`   ${s.MAP_SIZE.padEnd(6)} 위반 ${s.failures.length} · 경고 ${s.warnings.length}`));
}
console.log('');

if (isStrict && totalFail > 0) {
  console.log('💀 --strict: 임계 위반으로 exit 1');
  process.exit(1);
}
process.exit(0);
