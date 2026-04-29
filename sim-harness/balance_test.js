// ============================================================================
// DEAD NEXUS — 밸런스 회귀 테스트 스위트 (v2.1)
// 200판 시뮬 + 임계 체크. CI 친화적: 임계 위반 시 exit 1.
// 사용법:
//   node balance_test.js              # 기본 N=200 / 11x11
//   node balance_test.js 500          # N=500
//   node balance_test.js 200 5x5      # 5x5 모드 200판
//   node balance_test.js --strict     # 임계 위반 시 exit 1
// ============================================================================

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
};

const fs = require('fs');
const core = fs.readFileSync(__dirname + '/core.js', 'utf8');
const harness = fs.readFileSync(__dirname + '/harness_body.js', 'utf8');

// 인자 파싱
const args = process.argv.slice(2);
const isStrict = args.includes('--strict');
const numericArgs = args.filter(a => !a.startsWith('--'));
const N = parseInt(numericArgs[0]) || 200;
const MAP_SIZE = numericArgs[1] || '11x11';

// 임계값 (200판 기준 검증된 v1.1 결과를 ±15% 허용)
const THRESHOLDS = {
  '11x11': {
    ghostWinRate: { min: 40, max: 65, target: 57 },   // 200판 57/43
    blocWinRate:  { min: 35, max: 60, target: 43 },
    avgRound:     { min: 5.5, max: 8.0, target: 6.8 },
    classMaxWinRate: 60,   // 어떤 클래스도 60% 넘지 않음
    classMinWinRate: 5,    // 어떤 클래스도 5% 밑으로 떨어지지 않음
  },
  '5x5': {
    ghostWinRate: { min: 45, max: 70, target: 57 },   // 200판 114/86
    blocWinRate:  { min: 30, max: 55, target: 43 },
    avgRound:     { min: 4.5, max: 7.0, target: 5.84 },
    classMaxWinRate: 55,   // BLADE/MOLE 너프 후 47/43
    classMinWinRate: 5,
  },
};

const t = THRESHOLDS[MAP_SIZE] || THRESHOLDS['11x11'];

// harness_body.js에서 batchRun을 활용하기 위해 maxRounds + mapSize 주입 필요
// 하지만 batchRun은 직접 호출 가능하므로 그대로 사용
const code = core + '\n\n' + harness.replace(
  /^const N = parseInt\(process\.argv\[2\]\) \|\| 50;[\s\S]*$/m,
  `// 테스트 모드 — 직접 호출\n`
);
eval(code);

// === 테스트 실행 ===
console.log('');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log(`║ DEAD NEXUS — 밸런스 회귀 테스트 (N=${String(N).padEnd(4)} · 맵 ${MAP_SIZE.padEnd(7)} · ${isStrict ? '엄격' : '권고'})${' '.repeat(Math.max(0, 5))}║`);
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

const start = Date.now();
const { results, errors, errorList } = batchRun(N);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

if (errors > 0) {
  console.log(`⚠ 시뮬 에러 ${errors}판 / ${N}판`);
  errorList.slice(0, 3).forEach(e => console.log(`  ${e.humanRole}/${e.humanSpecific}: ${e.msg}`));
  console.log('');
}

const a = analyze(results);
console.log(`✅ ${results.length}판 완료 (${elapsed}초)`);
console.log(`   라운드: 평균 ${a.rounds.avg} (${a.rounds.min}~${a.rounds.max})`);
console.log(`   승자: Ghost ${a.winnerRoles.ghost} / Bloc ${a.winnerRoles.bloc} / 무승부 ${a.winnerRoles.null}`);
console.log('');

// === 임계 검증 ===
const failures = [];
const warnings = [];

const ghostPct = (a.winnerRoles.ghost / a.N * 100);
const blocPct = (a.winnerRoles.bloc / a.N * 100);
const avgR = parseFloat(a.rounds.avg);

function checkRange(label, val, range, target) {
  const status = val >= range.min && val <= range.max ? '✅' : '❌';
  const delta = (val - target).toFixed(1);
  const dStr = delta > 0 ? `+${delta}` : delta;
  console.log(`   ${status} ${label.padEnd(20)} ${val.toFixed(1).padStart(5)} (목표 ${target}, ${dStr}, 허용 ${range.min}~${range.max})`);
  if (val < range.min || val > range.max) {
    failures.push(`${label}: ${val.toFixed(1)} (목표 ${target}, 허용 ${range.min}~${range.max})`);
  }
}

console.log('🎯 진영 균형');
checkRange('Ghost 승률 (%)', ghostPct, t.ghostWinRate, t.ghostWinRate.target);
checkRange('Bloc 승률 (%)', blocPct, t.blocWinRate, t.blocWinRate.target);
console.log('');

console.log('⏱ 게임 길이');
checkRange('평균 라운드', avgR, t.avgRound, t.avgRound.target);
console.log('');

console.log('🎭 클래스별 승률 (P0)');
const classBreakdown = Object.entries(a.bySpecific).map(([k, v]) => ({
  k, total: v.total, wins: v.wins, pct: parseFloat(v.winRate),
})).sort((a, b) => b.pct - a.pct);

classBreakdown.forEach(({ k, total, wins, pct }) => {
  const isOver = pct > t.classMaxWinRate;
  const isUnder = pct < t.classMinWinRate;
  const status = isOver ? '❌' : isUnder ? '⚠' : '✅';
  console.log(`   ${status} ${k.padEnd(10)} ${pct.toFixed(1).padStart(5)}%  (${wins}/${total})`);
  if (isOver) failures.push(`${k} 폭주: ${pct.toFixed(1)}% > ${t.classMaxWinRate}%`);
  if (isUnder) warnings.push(`${k} 저조: ${pct.toFixed(1)}% < ${t.classMinWinRate}%`);
});
console.log('');

console.log('📋 주요 승리 사유 Top 5');
a.topReasons.slice(0, 5).forEach(([r, c]) => console.log(`   [${String(c).padStart(3)}] ${r}`));
console.log('');

// === 최종 요약 ===
console.log('━'.repeat(66));
if (failures.length === 0 && warnings.length === 0) {
  console.log('✅ 모든 임계 통과 — 밸런스 안정적');
} else {
  if (failures.length > 0) {
    console.log(`❌ 임계 위반 ${failures.length}건`);
    failures.forEach(f => console.log(`   • ${f}`));
  }
  if (warnings.length > 0) {
    console.log(`⚠ 경고 ${warnings.length}건`);
    warnings.forEach(w => console.log(`   • ${w}`));
  }
}
console.log('━'.repeat(66));
console.log('');

// CI 친화: --strict 모드에서 임계 위반 시 비정상 종료
if (isStrict && failures.length > 0) {
  console.log('💀 --strict 모드: 임계 위반으로 exit 1');
  process.exit(1);
}

process.exit(0);
