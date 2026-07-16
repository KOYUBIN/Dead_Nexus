'use strict';
// ============================================================================
// lore_module.js — 서사 표면화 (docs/22 §5·§6)
//   문서에만 존재하던 인물 11인(코드네임 6 + 수장 5)과 명대사·슬로건을
//   실플레이 표시 레이어에 이식한다. 전량 표시 전용 — 게임 로직 무변경.
//   원자산 출처: docs/04-characters-ghosts.md, docs/03-factions-blocs.md
//   (창작 금지 원칙 — 명대사·슬로건은 원문 그대로, 에필로그 산문만 docs 정체성 톤 재구성).
//
//   euro_module 패턴 판단: 데이터 상수 + 순수 헬퍼는 리듀서/렌더 양쪽에서 쓰이고
//   게임 상태에 의존하지 않으므로 별도 모듈이 index.html 편집을 최소화한다.
//   전역은 window에 노출하고, 소비처(index.html)는 typeof 가드로 미로드 시 무해.
//   로드는 <script src> + 자가복구 heal 로더(euro_module과 동일 경로 보정).
// ============================================================================
(function (glob) {

  // --- 고스트 6인 (docs/04) : 클래스 → 코드네임·본명·명대사 --------------------
  var LORE_GHOSTS = {
    CIPHER:  { codename: 'STATIC', realName: 'LENA GREY',   quote: "The Veil doesn't hide you. It just tells me where to look." },
    BLADE:   { codename: 'RUST',   realName: 'COLE HARKER',  quote: "I don't pick sides. I pick rates." },
    RIGGER:  { codename: 'PATCH',  realName: 'CASS WIRE',    quote: "Give me twenty minutes and whatever's broken will be worse — then better." },
    BROKER:  { codename: 'SILK',   realName: 'SERA HOLT',    quote: "Everyone wants something. I just help them want it faster." },
    DRIFTER: { codename: 'FLINT',  realName: 'DANE CROSS',   quote: "Ashgrid isn't a city. It's a cage with good lighting." },
    MOLE:    { codename: 'ECHO',   realName: 'MIRA SHADE',   quote: "I've been five different people this week. None of them were lying." },
  };

  // --- 5대 블록 (docs/03) : 블록 → 수장·직함·슬로건·명대사 ---------------------
  var LORE_BLOCS = {
    VANTA:    { leader: 'VERA ASHTON',  title: 'DIRECTOR',          slogan: "We don't watch. We remember.",       quote: "There are no secrets. Only prices that haven't been met." },
    IRONWALL: { leader: 'MARCUS CRANE', title: 'GENERAL-DIRECTOR',  slogan: "Peace is our product. War is our proof.", quote: "The negotiation table is just another name for the battlefield." },
    HELIX:    { leader: 'ELIA VOSS',    title: 'DR.',               slogan: "Better by design.",                  quote: "Pain is data. Don't waste it." },
    AXIOM:    { leader: 'KAI MORROW',   title: '',                  slogan: "We already know what you'll do next.", quote: "If you're surprised, it means my model predicted you would be." },
    CARBON:   { leader: 'HARLAN VOSS',  title: 'ELDER',             slogan: "Everything runs on us.",             quote: "The impatient always lose. They always have." },
  };

  // --- 정체성 스니펫 (docs 원문 톤 재구성 — 에필로그 본문용, 외부 IP 없음) -------
  var BLOC_IDENTITY = {
    VANTA:    '데이터가 무기였다. 누가 무엇을 아는지 아무도 몰랐고, 그래서 모두가 무너졌다.',
    IRONWALL: '안보를 팔고, 안보가 필요한 상황을 직접 만들었다. 애시그리드의 모든 충돌 뒤에 IRONWALL이 있었다.',
    HELIX:    '생명에 가격표를 붙였다. 아프면 갈 곳은 하나뿐이었고, 그 문을 HELIX가 쥐고 있었다.',
    AXIOM:    '미래를 안다는 확신을 팔았다. 모델은 틀린 적이 없다고 했고 — 이번에도 그랬다.',
    CARBON:   '전력망과 수도관을 깐 가장 오래된 손. 다른 블록이 흥망을 반복하는 동안 50년 계획이 결실을 맺었다.',
  };
  var GHOST_IDENTITY = {
    CIPHER:  '베일 코드를 지문처럼 읽는 정보전의 유령. VANTA가 지운 이름이 거리의 전설로 되살아났다.',
    BLADE:   '243건을 처리하고 244번째에 표적이 됐던 집행관. 이제 그의 이름값은 거리가 매긴다.',
    RIGGER:  '쓰레기더미에서 첫 드론을 조립한 손. 부서진 모든 것을 더 나쁘게, 그다음 더 낫게 만들었다.',
    BROKER:  '누가 누구에게 무엇을 빚졌는지 완벽한 장부를 쥔 중개인. 애시그리드의 큰 거래는 그녀를 거쳤다.',
    DRIFTER: '멈추면 표적이 되는 밀수 루트의 운전자. 우리 안에서, 좋은 조명 아래서, 끝내 살아남았다.',
    MOLE:    '자신이 제품이었음을 깨닫고 사라진 침투 요원. 다섯 개의 얼굴 중 어느 것도 거짓이 아니었다.',
  };

  function isGhost(spec) { return !!LORE_GHOSTS[spec]; }
  function isBloc(spec)  { return !!LORE_BLOCS[spec]; }

  // 카드 병기용 짧은 태그 — 고스트=코드네임, 블록=수장명. 없으면 null.
  function loreTag(spec) {
    if (LORE_GHOSTS[spec]) return LORE_GHOSTS[spec].codename;
    if (LORE_BLOCS[spec])  return LORE_BLOCS[spec].leader;
    return null;
  }

  // 로그 첨가용 명대사 1줄 — { line, by } 또는 null.
  //   kind는 표시 아이콘 뉘앙스만 좌우(선택). 문구는 docs 원문.
  function loreQuote(spec) {
    if (LORE_GHOSTS[spec]) {
      var g = LORE_GHOSTS[spec];
      return { by: g.codename + ' (' + g.realName + ')', line: '🎭 ' + g.codename + ': "' + g.quote + '"' };
    }
    if (LORE_BLOCS[spec]) {
      var b = LORE_BLOCS[spec];
      var who = (b.title ? b.title + ' ' : '') + b.leader;
      return { by: who, line: '🎙 ' + who + ': "' + b.quote + '"' };
    }
    return null;
  }

  // 엔딩 에필로그 — 승자 role×specific×승리경로(route)로 2~3문장 + 명대사 마무리.
  //   route: 'asset' | 'mna' | 'assetPoint' (블록) / 'repBattle' | 'repOnly' | 'repPoint' (고스트)
  //   반환: { lines: [문장...], quote, quoteBy } 또는 null.
  function loreEpilogue(role, spec, route) {
    if (isBloc(spec)) {
      var b = LORE_BLOCS[spec];
      var frameB;
      if (route === 'mna')        frameB = '적대적 인수로 두 블록을 삼킨 ' + spec + ' — 흡수된 이름 위에 ACQUIRED 스티커가 박혔다.';
      else if (route === 'assetPoint') frameB = '시간이 다했고, 최후의 장부에서 가장 무거운 자산을 쥔 것은 ' + spec + '였다.';
      else                        frameB = spec + '가 자산 임계를 넘어 애시그리드의 지배권을 확정했다.';
      var whoB = (b.title ? b.title + ' ' : '') + b.leader;
      return {
        lines: [ frameB, BLOC_IDENTITY[spec] || '', '슬로건은 이제 경고가 아니라 사실이다 — "' + b.slogan + '"' ],
        quote: b.quote,
        quoteBy: whoB,
      };
    }
    if (isGhost(spec)) {
      var g = LORE_GHOSTS[spec];
      var frameG;
      if (route === 'repBattle')      frameG = '레이드와 결투로 거리의 이름을 얻은 ' + g.codename + ' (' + g.realName + ').';
      else if (route === 'repPoint')  frameG = '시간이 다했고, 애시그리드가 가장 크게 부른 이름은 ' + g.codename + ' (' + g.realName + ')였다.';
      else                            frameG = '총성 없이 애시그리드의 전설이 된 ' + g.codename + ' (' + g.realName + ').';
      return {
        lines: [ frameG, GHOST_IDENTITY[spec] || '', '거리는 이름을 지워도 이야기는 남긴다.' ],
        quote: g.quote,
        quoteBy: g.codename + ' (' + g.realName + ')',
      };
    }
    return null;
  }

  // winReason 문자열 → 승리 경로 태그 (리듀서 상태 무변경 — 파싱으로 해결).
  function loreRouteFromReason(reason, role) {
    var r = reason || '';
    if (/M&A 승리/.test(r))            return 'mna';
    if (/최고 자산/.test(r))           return 'assetPoint';
    if (/최고 렙/.test(r))             return 'repPoint';
    if (/Bloc 승리/.test(r) || /자산/.test(r)) return 'asset';
    if (/전투/.test(r))                return 'repBattle';
    if (/평판/.test(r))                return 'repOnly';
    return role === 'bloc' ? 'asset' : 'repOnly';
  }

  glob.LORE_GHOSTS = LORE_GHOSTS;
  glob.LORE_BLOCS = LORE_BLOCS;
  glob.loreTag = loreTag;
  glob.loreQuote = loreQuote;
  glob.loreEpilogue = loreEpilogue;
  glob.loreRouteFromReason = loreRouteFromReason;

})(typeof window !== 'undefined' ? window : this);
