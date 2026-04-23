// BROKER 플레이어 10판 trace — 뭐가 잘못되는지 보기
global.localStorage = { _store: {}, getItem(k){return this._store[k]||null;}, setItem(k,v){this._store[k]=String(v);}, removeItem(k){delete this._store[k];} };
const fs = require('fs');
const core = fs.readFileSync(__dirname + '/core.js', 'utf8');
const harness = fs.readFileSync(__dirname + '/harness_body.js', 'utf8');
// trace 옵션 활성화
const code = core + '\n\n' + harness.replace('maxRounds = 8,', 'maxRounds = 10, ').replace('trace = false', 'trace = true');
eval(code);

console.log('\n=== BROKER 3판 trace ===');
for (let i = 0; i < 3; i++) {
  console.log(`\n--- 판 ${i+1} ---`);
  const r = runOneGame({ humanRole: 'ghost', humanSpecific: 'BROKER' });
  console.log(`결과: ${r.reason}`);
  console.log(`P0 BROKER 최종: HP${r.p0Hp}, 렙${r.p0Rep}, 레이드${r.p0Raids}, 사망${r.p0Defeated}`);
  // 전체 로그 마지막 20줄
  console.log('--- 로그 tail 15 ---');
  r.finalState.log.slice(-15).forEach(l => console.log(`  R${l.round}P${l.phase}: ${l.message.slice(0,100)}`));
}
