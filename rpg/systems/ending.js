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

  // [3차 발굴 F2/F11] 소극 의존 헬퍼 — abyss.js deps 선례를 따른 지연 해석(순수성 유지, 미로드
  //   환경에선 null 폴백). 브라우저=window 전역 · node=require. 호출 시점 해석이라 로드 순서 무관.
  function getClasses() {
    if (typeof window !== 'undefined' && window.RPG_CLASSES) return window.RPG_CLASSES;
    try { return require('../data/classes.js'); } catch (e) { return null; }
  }
  function getCampaign() {
    if (typeof window !== 'undefined' && window.RPG_CAMPAIGN) return window.RPG_CAMPAIGN;
    try { return require('./campaign.js'); } catch (e) { return null; }
  }

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
  // ---- [신규 v6.44 — 과제 A1] 캡스톤 에필로그 "ASHGRID PREVAILS" ----------------
  //   4갈래 종결 미션 전부 클리어 → a2-99-flagship(MERIDIAN FLAGSHIP) 격파 시 전용 피날레.
  //   4엔딩과 별개 기록(endings.capstone). 산문 = 원전 리프레인 "블록은 불사신이 아니다"
  //   변주 각색([신규] 태그) — 성벽 안의 체제도, 성벽 밖의 침공도 불사신이 아니었다는 수렴.
  var CAPSTONE = {
    key: 'ashgrid-prevails', title: 'ASHGRID PREVAILS', icon: '🌃',
    sticker: 'THE CITY REMAINS', accent: 'cyan',
    cond: '4갈래 종결전 수렴 → MERIDIAN FLAGSHIP · OVERLORD 격파',
    lines: [
      '[신규] 네 개의 전선이 하나로 모였다. 왕관도, 자유항도, 재건된 넥서스도, 폐허의 신호도 — 오늘 밤 같은 하늘 아래 섰다.',
      '[신규 · 리프레인 변주] 블록은 불사신이 아니었다. 그리고 오늘, 성벽 너머에서 온 것들도 불사신이 아니라는 것이 증명됐다.',
      '[신규] MERIDIAN 기함이 애시그리드의 스카이라인 아래로 가라앉는다. OVERLORD는 도시의 이름조차 발음하지 못한 채 꺼졌다.',
      '[신규] 도시는 승리하지 않았다 — 도시는 살아남았다. 그 둘의 차이를 아는 자들만이 이 재를 상속한다.',
      '[신규] 레거시 상자에 "THE CITY REMAINS" 스티커가 붙는다. 애시그리드는, 여전히, 애시그리드다.',
    ],
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
  // [신규 v6.44] 캡스톤 에필로그 메타 접근자 (에필로그 씬 capstone 분기 소비).
  function capstoneEpilogue() { return CAPSTONE; }

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

  // [신규 v6.44] Act2 4갈래 종결 선택 회고 스펙 — 캡스톤 에필로그 "지난 선택 반영" 카드.
  //   4갈래 종결 미션의 최종 서사 분기 flag. 값 있는 항목만 노출(choiceSummary 계약 공유).
  var CAPSTONE_RECALL_SPEC = [
    { key: 'throneChoice', br: 'A', label: 'IRON CROWN', map: { seal: '👑 왕관 봉인 — 체제 질서 유지', reveal: '📜 원장 공개 — 도시 각성' } },
    { key: 'freeportStance', br: 'B', label: 'ASH REPUBLIC', map: { open: '🏴 자유항 개항 — 개방 무역', smuggle: '🚢 밀수로 존속 — 지하 경제' } },
    { key: 'signalWarCleared', br: 'C', label: 'COUNCIL OF ASH', map: { true: '🕊️ 근원 코어 정지 — 재건 도시 방어' } },
    { key: 'harvesterChoice', br: 'D', label: 'RUIN SURVIVORS', map: { destroy: '💥 하베스터 파괴 — 잔해 봉인', warn: '📡 경고 발신 — 억지 신호' } },
  ];
  // 캡스톤 회고 — 4갈래 종결 flag → 갈래별 회고 라인(지난 선택 반영). 미설정 갈래는 스킵.
  function capstoneRecall(flags) {
    flags = flags || {};
    var out = [];
    for (var i = 0; i < CAPSTONE_RECALL_SPEC.length; i++) {
      var spec = CAPSTONE_RECALL_SPEC[i];
      var v = flags[spec.key];
      if (v == null || v === false) continue;
      var text = (spec.map && spec.map[String(v)]) || (v === true ? spec.label : (spec.label + ': ' + v));
      out.push({ br: spec.br, key: spec.key, label: spec.label, text: text });
    }
    return out;
  }
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
  //   [3차 발굴 F11] 메인/사이드 분리를 campaign 레지스트리 기반으로 정정 — 'side' 접두사
  //   휴리스틱은 'a2-side-*'(클래스 사이드)를 메인으로 오분류했다. 레지스트리 kind='side' 또는
  //   act2 branch='class'(클래스 전용 사이드) = 사이드, 그 외(main·act2 갈래/framing/capstone) =
  //   메인. 레지스트리 미해석 id 만 접두사 폴백(side-* / a2-side-*). karma 지출 = growth 합.
  //   [v6.54 Act3] 동일 계약을 kind='act3' 로 확장 — act3 branch='class'(a3-side-*) = 사이드,
  //   그 외(framing/main/finale) = 메인. 폴백 접두사에도 'a3-side-' 추가(레지스트리 미로드 환경).
  //   Act1/Act2 판정 경로는 무변경 → 기존 세이브의 mainCleared/sideCleared 집계 byte 불변.
  function campaignStats(save) {
    save = save || {};
    var done = (save.missionsDone || []);
    var CAMP = getCampaign();
    var mainCleared = 0, sideCleared = 0;
    for (var i = 0; i < done.length; i++) {
      var entry = (CAMP && CAMP.missionById) ? CAMP.missionById(done[i]) : null;
      var isSide = entry
        ? (entry.kind === 'side' ||
           ((entry.kind === 'act2' || entry.kind === 'act3') && entry.branch === 'class'))
        : (done[i].indexOf('side') === 0 || done[i].indexOf('a2-side-') === 0 ||
           done[i].indexOf('a3-side-') === 0);
      if (isSide) sideCleared++; else mainCleared++;
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
    // [3차 발굴 F2] 플레이어블 로스터 = classes.PLAYABLE 단일 출처(abyss.bestByClass 선례) —
    //   4클래스 하드코딩이 BROKER/DRIFTER(v6.45 승격) 완주 표시를 누락하던 결함 보정.
    var CL = getClasses();
    var playable = (CL && CL.PLAYABLE) || ['CIPHER', 'BLADE', 'RIGGER', 'MOLE'];
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
      capstoneCleared: e.capstone || 0,                                  // [신규 v6.44] 캡스톤 격파 횟수
      capstoneClasses: playable.filter(function (k) { return !!e.capstoneByClass[k]; }),
    };
  }

  // ---- 엔딩 기록 영속 (마이그레이션 하위 호환) --------------------------------
  //   endings = { seen: { key: count }, byClass: { CLS: true }, runs: N }.
  function migrateEndings(endings) {
    var e = (endings && typeof endings === 'object') ? clone(endings) : {};
    if (!e.seen || typeof e.seen !== 'object') e.seen = {};
    if (!e.byClass || typeof e.byClass !== 'object') e.byClass = {};
    if (typeof e.runs !== 'number' || !isFinite(e.runs)) e.runs = 0;
    // [신규 v6.44] 캡스톤 기록 백필(멱등) — 4엔딩 기록과 별개. capstone=격파 횟수, capstoneByClass=완주 클래스.
    if (typeof e.capstone !== 'number' || !isFinite(e.capstone)) e.capstone = 0;
    if (!e.capstoneByClass || typeof e.capstoneByClass !== 'object') e.capstoneByClass = {};
    return e;
  }
  // [신규 v6.44] 캡스톤 1회 기록 — capstone count 증가 · 완주 클래스 표시. 4엔딩 seen/runs 와 독립.
  //   순수(새 객체 반환). NG+ 회차를 넘어 endings 로 영속(migrateEndings 백필 보장).
  function recordCapstone(endings, classKey) {
    var e = migrateEndings(endings);
    e.capstone = (e.capstone || 0) + 1;
    if (classKey) e.capstoneByClass[classKey] = true;
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
    CAPSTONE: CAPSTONE,
    resolveEnding: resolveEnding, epilogueFor: epilogueFor, capstoneEpilogue: capstoneEpilogue,
    choiceSummary: choiceSummary, capstoneRecall: capstoneRecall, campaignStats: campaignStats,
    migrateEndings: migrateEndings, recordEnding: recordEnding, recordCapstone: recordCapstone,
    endingsSeen: endingsSeen, newGamePlus: newGamePlus,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ENDING = API;
})();
