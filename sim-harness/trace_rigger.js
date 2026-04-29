// 5 RIGGER 게임 추적 — v2.3 디버그용
global.localStorage = { _store: {}, getItem(k){return this._store[k]||null;}, setItem(k,v){this._store[k]=String(v);}, removeItem(k){delete this._store[k];} };
const fs = require('fs');
const core = fs.readFileSync(__dirname + '/core.js', 'utf8');
const harness = fs.readFileSync(__dirname + '/harness_body.js', 'utf8');
// 자동 실행 부분 제거 (const N = ... 부터 끝까지)
const stripped = harness.replace(/const N = parseInt[\s\S]*$/m, '');
const code = core + '\n\n' + stripped;
eval(code);

console.log('=== RIGGER 5판 trace ===');
let wins = 0;
for (let i = 0; i < 5; i++) {
  const r = runOneGame({ humanRole: 'ghost', humanSpecific: 'RIGGER', maxRounds: 8 });
  console.log(`\n판 ${i+1}: 승자=P${r.winner} (${r.winnerSpecific}) · 사유=${r.reason} · R${r.round}`);
  console.log(`  P0 RIGGER: 렙=${r.p0Rep} 레이드=${r.p0Raids} TL=${r.p0Tl} HP=${r.p0Hp} 사망=${r.p0Defeated}`);
  if (r.winner === 0) wins++;
  console.log('  P0 관련 로그:');
  r.finalState.log.filter(l => /P0|RIGGER/i.test(l.message)).slice(-8).forEach(l =>
    console.log(`    R${l.round}P${l.phase}: ${l.message.slice(0,90)}`));
}
console.log(`\n결과: ${wins}/5 승`);
