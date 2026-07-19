;(function () {
  'use strict';
  // ==========================================================================
  // systems/ending.js — 캠페인 엔딩 분기 판정 · 에필로그 · 통계 파생 · 회차/엔딩 기록
  //   (57차 — 챕터 8 완주 피날레. 엔진 무편집으로 추가되는 순수 로직 모듈.)
  //   순수 함수 (DOM/React 무의존). 산문 = cards/legacy/chapter-08-zero-day.md 발췌·각색.
  // ──────────────────────────────────────────────────────────────────────────
  //   resolveEnding : 누적 flag 조합 → 엔딩 key (ch08 endingSplit 게이트 우선순위 계승)
  //   epilogueFor   : 엔딩 key → 에필로그 메타(제목·스티커·아이콘) + 산문 라인
  //   choiceSummary : 세이브 flags → "당신의 선택들" 7챕터 회고(heroChoice·extractionStyle …)
  //   campaignStats : 세이브 파생 통계(클리어 수·karma 지출·장비 보유·클래스별 완주)
  //   recordEnding  : 엔딩 기록 영속(seen count·byClass·runs) — 마이그레이션 하위 호환
  //   migrateEndings: endings 필드 정규화(구세이브 무손실)
  //   newGamePlus   : 캠페인 진행 리셋하되 엔딩 기록(endings) 영속 — 회차 플레이
  //   endingsSeen   : 허브 뱃지용 엔딩 열람 목록
  // ==========================================================================

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // [그대로] cards/legacy/chapter-08-zero-day.md §SIGNAL의 최종 출력 3행 — 원문 인용.
  var SIGNAL_FINAL = [
    '[SIGNAL] THANK YOU FOR PLAYING.',
    '[SIGNAL] THE CITY WILL REMEMBER.',
    '[SIGNAL] ...AND SO WILL I.',
  ];

  // ---- 엔딩 레지스트리 (key = ch08 'ending' flag 값) ---------------------------
  //   산문 lines = chapter-08 §봉투 H 엔딩 카드 4종 발췌·각색([발췌]/[각색] 태그).
  var ENDINGS = {
    'corporate-eternal': {
      key: 'corporate-eternal', title: 'CORPORATE ETERNAL', icon: '🏙️',
      sticker: 'ERA OF ONE', accent: 'orange',
      cond: 'ch07 블록 지배 트랙 (flag endingTrack)',
      // [발췌 chapter-08 §엔딩1] 승자 블록이 국가를 흡수 + [각색] 잔여 블록/고스트의 운명.
      lines: [
        '[발췌] 승자 블록이 애시그리드의 새 이름이 된다. 블록 하나가 국가를 흡수한다.',
        '[각색] 남은 블록은 자산 50%를 압류당하고 강제 합병되었다. 거리는 지하로 잠복한다.',
        '[각색] 넥서스 의장실의 불은 다시는 꺼지지 않는다 — 그 방에 주인이 생겼다.',
        '[발췌] 레거시 상자에 "ERA OF ONE" 스티커가 영구히 부착된다.',
      ],
    },
    'street-rising': {
      key: 'street-rising', title: 'STREET RISING', icon: '🔥',
      sticker: 'NEW CITY', accent: 'magenta',
      cond: 'ch01 영웅 경로 (flag allBlocsHostile)',
      // [발췌 chapter-08 §엔딩2] 거리가 도시를 되찾고 블록 체제 해체.
      lines: [
        '[발췌] 거리가 도시를 되찾는다. 블록 체제가 해체된다.',
        '[각색] 네가 이름을 공개한 그 밤부터 모든 블록이 너를 적으로 삼았고 — 그 적의가 오늘 봉기가 되었다.',
        '[각색] 넥서스 코어는 이제 누구의 것도 아니다. 고스트들이 무정부/협동의 새 도시를 세운다.',
        '[발췌] 레거시 상자에 "NEW CITY" 스티커가 부착된다.',
      ],
    },
    'nexus-reborn': {
      key: 'nexus-reborn', title: 'NEXUS REBORN', icon: '🕊️',
      sticker: 'BALANCED', accent: 'green',
      cond: 'ch05 SIGNAL 합일 (flag ascendEnding)',
      // [발췌 chapter-08 §엔딩3] 평의회 재건 · 유일한 전원 승리 · After Zero Day 해금.
      lines: [
        '[발췌] 평의회가 재구성된다. 완벽한 해피엔딩은 아니지만, 도시는 살아남는다.',
        '[발췌] 전원 공동 승리 — 이 캠페인의 유일한 전원 생존 엔딩.',
        '[각색] 메시로 올라간 네 의식이 SIGNAL 과 합일했고, 그 우호가 코어를 파괴가 아닌 재건으로 돌렸다.',
        '[발췌] 레거시 상자에 "BALANCED" 스티커 — "After Zero Day" 확장으로의 문이 하나 남는다.',
      ],
    },
    'dead-nexus': {
      key: 'dead-nexus', title: 'DEAD NEXUS', icon: '💀',
      sticker: 'DEAD NEXUS', accent: 'text-dim',
      cond: 'ch04 PURIST 또는 누적 flag 없음 (카드 확정 기본값)',
      // [발췌 chapter-08 §엔딩4] 전원 패배이나 실패가 아닌 선택.
      lines: [
        '[발췌] 아무도 승리하지 못한다. 애시그리드는 도시이기를 멈춘다.',
        '[발췌] 그러나 이것은 실패가 아니라 선택이었다 — 어떤 이름에도 굴하지 않은 마지막 선택.',
        '[각색] 제로데이 코어가 무너지고, 그 위로 도시의 불빛이 하나씩 꺼진다.',
        '[발췌] 레거시 상자에 "DEAD NEXUS" 스티커가 영구히 부착된다 — 게임의 제목과 같은 이름으로.',
      ],
    },
  };
  // ch08 endingSplit 게이트 우선순위(계승) — 게이트 truthy flag → 엔딩 key.
  var DERIVE_ORDER = [
    { flag: 'endingTrack',     key: 'corporate-eternal' },
    { flag: 'allBlocsHostile', key: 'street-rising' },
    { flag: 'ascendEnding',    key: 'nexus-reborn' },
    { flag: 'puristFlag',      key: 'dead-nexus' },
  ];
  var ORDER = ['corporate-eternal', 'street-rising', 'nexus-reborn', 'dead-nexus'];

  // 엔딩 분기 판정 — ch08 end 노드가 세운 'ending' flag 우선, 없으면 누적 flag 조합에서 파생.
  //   파생 순서는 ch08 endingSplit 의 게이트 우선순위(endingTrack→allBlocsHostile→ascendEnding→
  //   puristFlag→기본값 dead-nexus)와 정합. 누적 flag 전무 시 DEAD NEXUS(카드 기본값).
  function resolveEnding(save) {
    var flags = (save && save.flags) || {};
    if (flags.ending && ENDINGS[flags.ending]) return flags.ending;
    for (var i = 0; i < DERIVE_ORDER.length; i++) {
      if (flags[DERIVE_ORDER[i].flag]) return DERIVE_ORDER[i].key;
    }
    return 'dead-nexus';
  }

  function epilogueFor(key) { return ENDINGS[key] || ENDINGS['dead-nexus']; }

  // ---- "당신의 선택들" — 지난 7챕터 + ch08 선택 회고 (세이브 flags 파생) --------
  //   flag 별 서사 라벨. 값이 있는 항목만 노출. (data/missions/*.js setFlags 값 기준)
  var CHOICE_SPEC = [
    { key: 'heroChoice', ch: 1, label: '정체', map: { hero: '★ 영웅 — 정체 공개 (전 블록 적대)', ghost: '👻 유령 — 은폐' } },
    { key: 'extractionStyle', ch: 1, label: '추출', map: { quiet: '🕊 무흔적 추출', loud: '🔊 소란한 강습' } },
    { key: 'insiderChoice', ch: 2, label: '내부자', map: { cover: '🎭 은폐 — 내부자 보호', expose: '📡 폭로 — 내부자 공개' } },
    { key: 'curfewChoice', ch: 3, label: '계엄', map: { evade: '🌫 회피 — 검문 우회', resist: '✊ 저항 — 계엄 돌파' } },
    { key: 'meshChoice', ch: 5, label: '메시', map: { flesh: '🩸 육신 — 접속 거부', ascend: '🕸 승천 — SIGNAL 합일' } },
    { key: 'acquisitionChoice', ch: 6, label: '인수', map: { disrupt: '💥 교란 — 인수 저지', reclaim: '🏴 탈환 — 블록 접수' } },
    { key: 'endingTrack', ch: 7, label: '기여 트랙', map: { collapse: '⛓ 붕괴', council: '🕊 평의회', domination: '👑 지배', revolution: '🔥 혁명' } },
    { key: 'breachMethod', ch: 8, label: '코어 돌파', map: { assault: '⚔ 정면 결전', signature: '💻 제로데이 서명', breach: '🗡 격벽 관통' } },
  ];
  function choiceSummary(flags) {
    flags = flags || {};
    var out = [];
    for (var i = 0; i < CHOICE_SPEC.length; i++) {
      var spec = CHOICE_SPEC[i];
      var v = flags[spec.key];
      if (v == null || v === false) continue;
      var text = (spec.map && spec.map[v]) || (v === true ? spec.label : (spec.label + ': ' + v));
      out.push({ ch: spec.ch, key: spec.key, label: spec.label, text: text });
    }
    return out;
  }

  // ---- 캠페인 통계 카드 (세이브에서 파생 가능한 것만) ---------------------------
  //   missionsDone id 접두사로 메인/사이드 분리(엔진 무의존). karma 지출 = growth 합.
  function campaignStats(save) {
    save = save || {};
    var done = (save.missionsDone || []);
    var mainCleared = 0, sideCleared = 0;
    for (var i = 0; i < done.length; i++) {
      if (done[i].indexOf('side') === 0) sideCleared++; else mainCleared++;
    }
    var ch = save.character || {};
    var growth = ch.growth || {};
    var karmaSpent = 0;
    for (var g in growth) { if (Object.prototype.hasOwnProperty.call(growth, g)) karmaSpent += (growth[g] || 0); }
    var owned = (ch.gearOwned || []).slice();
    var eq = ch.equipment || { weapon: null, cyberware: null };
    var equipped = [];
    if (eq.weapon) equipped.push(eq.weapon);
    if (eq.cyberware) equipped.push(eq.cyberware);
    var e = migrateEndings(save.endings);
    var playable = ['CIPHER', 'BLADE', 'RIGGER', 'MOLE'];
    var classClears = playable.map(function (k) { return { classKey: k, done: !!e.byClass[k] }; });
    return {
      missionsCleared: done.length,
      mainCleared: mainCleared,
      sideCleared: sideCleared,
      karmaSpent: karmaSpent,
      karmaCurrent: (ch.karma != null ? ch.karma : (save.karma || 0)),
      nuyen: (ch.nuyen != null ? ch.nuyen : (save.nuyen || 0)),
      rep: ch.rep || 0,
      gearOwnedCount: owned.length,
      gearOwned: owned,
      gearEquipped: equipped,
      intelCount: Object.keys(save.intel || {}).length,
      classKey: ch.classKey || 'CIPHER',
      classClears: classClears,
      runs: e.runs,
      endingsSeen: endingsSeen(e),
    };
  }

  // ---- 엔딩 기록 영속 (마이그레이션 하위 호환) --------------------------------
  //   endings = { seen: { key: count }, byClass: { CLS: true }, runs: N }.
  function migrateEndings(endings) {
    var e = (endings && typeof endings === 'object') ? clone(endings) : {};
    if (!e.seen || typeof e.seen !== 'object') e.seen = {};
    if (!e.byClass || typeof e.byClass !== 'object') e.byClass = {};
    if (typeof e.runs !== 'number' || !isFinite(e.runs)) e.runs = 0;
    return e;
  }
  // 엔딩 1회 기록 — seen count 증가 · 완주 클래스 표시 · 총 회차 증가. 순수(새 객체 반환).
  function recordEnding(endings, key, classKey) {
    var e = migrateEndings(endings);
    if (!ENDINGS[key]) key = 'dead-nexus';
    e.seen[key] = (e.seen[key] || 0) + 1;
    if (classKey) e.byClass[classKey] = true;
    e.runs = (e.runs || 0) + 1;
    return e;
  }
  // 허브 뱃지용 — 4엔딩 각각의 열람 여부/횟수 (ORDER 고정).
  function endingsSeen(endings) {
    var e = migrateEndings(endings);
    return ORDER.map(function (k) {
      var meta = ENDINGS[k];
      return { key: k, title: meta.title, icon: meta.icon, count: e.seen[k] || 0, seen: (e.seen[k] || 0) > 0 };
    });
  }

  // ---- 회차 플레이 — 캠페인 진행 리셋하되 엔딩 기록 영속 -----------------------
  //   freshSave = store.newSave() 결과(신규 진행). endings 만 이월(어느 엔딩 봤는지 영속).
  function newGamePlus(prevSave, freshSave) {
    var next = clone(freshSave);
    next.endings = migrateEndings(prevSave && prevSave.endings);
    return next;
  }

  var API = {
    SIGNAL_FINAL: SIGNAL_FINAL, ENDINGS: ENDINGS, ORDER: ORDER,
    resolveEnding: resolveEnding, epilogueFor: epilogueFor,
    choiceSummary: choiceSummary, campaignStats: campaignStats,
    migrateEndings: migrateEndings, recordEnding: recordEnding,
    endingsSeen: endingsSeen, newGamePlus: newGamePlus,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ENDING = API;
})();
