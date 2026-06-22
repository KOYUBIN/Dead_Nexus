// ============================================================================
// DEAD NEXUS — 결정 모달 골격 자기검증 (v6.0 / Item 6)
// 사용법: node test_decisions.js
// request → (auto)resolve → 효과 적용 + pendingDecision 해제를 검증한다.
// ============================================================================
global.localStorage = { _store:{}, getItem(k){return this._store[k]||null;}, setItem(k,v){this._store[k]=String(v);}, removeItem(k){delete this._store[k];} };
const fs = require('fs');
const code = fs.readFileSync(__dirname+'/core.js','utf8') + '\n\n'
           + fs.readFileSync(__dirname+'/euro_mechanics.js','utf8') + '\n\n'
           + fs.readFileSync(__dirname+'/harness_body.js','utf8').replace(/^const N = parseInt\(process\.argv\[2\]\)[\s\S]*$/m,'');
eval(code);

let pass = 0, fail = 0;
function check(name, cond) { console.log(`  ${cond?'✅':'❌'} ${name}`); cond?pass++:fail++; }

console.log('\n=== 결정 모달 골격 검증 ===\n');

// 0) 인프라 존재
check('템플릿 raid_reward 동작', (() => { let t = initGame('ghost','BLADE','5x5'); t = euro_requestDecision(t,'raid_reward',0); return !!t.meta.pendingDecision && t.meta.pendingDecision.prompt === '레이드 성공 — 보상 선택'; })());
check('euro_requestDecision 함수', typeof euro_requestDecision === 'function');
check('euro_resolveDecision 함수', typeof euro_resolveDecision === 'function');
check('euro_autoResolveDecision 함수', typeof euro_autoResolveDecision === 'function');

// 1) request → pendingDecision 설정
let s = initGame('ghost','RIGGER','11x11');
s = reducer(s,{type:'DRAW_INITIAL'});
const repBefore = s.players[0].resources.rep || 0;
s = euro_requestDecision(s, 'raid_reward', 0);
check('request 후 pendingDecision 존재', !!s.meta.pendingDecision);
check('옵션 2개 노출', s.meta.pendingDecision.options.length === 2);

// 2) 명시적 resolve('rep') → 평판 +3, pendingDecision 해제
s = euro_resolveDecision(s, 'rep');
check('resolve 후 pendingDecision 해제', !s.meta.pendingDecision);
check('rep 옵션 효과 적용 (+3)', (s.players[0].resources.rep||0) === repBefore + 3);

// 3) 중복 request 무시 (1개만)
let s2 = euro_requestDecision(s, 'raid_reward', 0);
s2 = euro_requestDecision(s2, 'bloc_invest', 0);
check('동시 1개만 처리 (중복 무시)', s2.meta.pendingDecision.templateId === 'raid_reward');

// 4) auto-resolve → weight 최고 옵션 자동 선택 + 해제
let s3 = initGame('bloc','AXIOM','11x11');
s3 = reducer(s3,{type:'DRAW_INITIAL'});
s3 = euro_requestDecision(s3, 'bloc_invest', 0);
s3 = euro_autoResolveDecision(s3);
check('auto-resolve 후 해제', !s3.meta.pendingDecision);

// 5) 헤드리스 1판이 결정 주입 후에도 끝까지 진행 (안전장치)
let s4 = initGame('ghost','BLADE','5x5');
s4 = reducer(s4,{type:'DRAW_INITIAL'});
s4 = euro_requestDecision(s4, 'raid_reward', 0);
s4 = euro_autoResolveDecision(s4);
check('주입된 결정 정상 해소', !s4.meta.pendingDecision);

console.log(`\n결과: ${pass} pass / ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
