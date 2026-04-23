// localStorage 스텁
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
};

const fs = require('fs');
const core = fs.readFileSync(__dirname + '/core.js', 'utf8');
const harness = fs.readFileSync(__dirname + '/harness_body.js', 'utf8');

// 전체 코드를 하나의 함수로 감싸 실행 (최상위 const/let이 같은 블록에 있게)
const code = core + '\n\n' + harness;
// Babel 없이 node가 못 처리하는 건 없음; 그냥 eval
eval(code);
