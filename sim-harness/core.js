const ZONE_TYPES = {
  ruin: { name: '폐허', color: 'z-ruin', income: {}, attr: 'A', buildable: false, note: '거점 불가' },
  home: { name: '주택가', color: 'z-home', income: { credit: 1, operative: 1 }, attr: 'GRID', buildable: true },
  bank: { name: '금융가', color: 'z-bank', income: { credit: 3 }, attr: 'M', buildable: true },
  data: { name: '데이터허브', color: 'z-data', income: { data: 2 }, attr: 'M', buildable: true },
  heal: { name: '의료구역', color: 'z-heal', income: { operative: 1 }, attr: 'B', buildable: true, note: 'HP회복' },
  work: { name: '공업지구', color: 'z-work', income: { parts: 2 }, attr: 'V', buildable: true },
  arms: { name: '무기고', color: 'z-arms', income: { weapons: 2 }, attr: 'I', buildable: true, note: '방어+1' },
  club: { name: '유흥가', color: 'z-club', income: { credit: 2 }, attr: 'S', buildable: true },
  port: { name: '항구', color: 'z-port', income: { credit: 1, weapons: 1 }, attr: 'I', buildable: true },
  cop:  { name: '경찰서', color: 'z-cop', income: {}, attr: null, buildable: false, note: '점령 불가' },
  nex:  { name: 'NEXUS', color: 'z-nex', income: { credit: 3, all_attr: 1 }, attr: 'all', buildable: true, note: '2R 연속=즉시 승리(튜토)' },
  aux:  { name: '넥서스부속', color: 'z-aux', income: { credit: 2, random_attr: 1 }, attr: null, buildable: true },
};

// 구역 첫 방문 시 3중 1 드래프트용 보너스 풀 — 구역 성격에 맞춘 옵션 셋
const ZONE_BONUS_POOL = {
  ruin:  [ {k:'parts',v:2,label:'⚙️ 부품 +2'}, {k:'gen',v:'A',label:'◈A +1 (개인 풀)'}, {k:'wanted',v:-1,label:'🚨 현상수배 -1'} ],
  home:  [ {k:'credit',v:3,label:'₵ +3'}, {k:'gen',v:'GRID',label:'◈GRID +1'}, {k:'draw',v:1,label:'🂠 카드 1장 드로우'} ],
  bank:  [ {k:'credit',v:5,label:'₵ +5 (금고 탈취)'}, {k:'stock_buy',v:1,label:'📈 주식 1주 할인 매수 (1₵)'}, {k:'rep',v:1,label:'★ 렙 +1 (평판 쌓기)'} ],
  data:  [ {k:'data',v:2,label:'📡 데이터 +2'}, {k:'draw',v:2,label:'🂠 카드 2장 드로우'}, {k:'peek_news',v:1,label:'👁 다음 뉴스 미리보기'} ],
  heal:  [ {k:'heal',v:3,label:'❤️ HP +3 회복'}, {k:'full_heal',v:1,label:'❤️❤️ HP 최대치 회복'}, {k:'gen',v:'B',label:'◈B +1'} ],
  work:  [ {k:'parts',v:3,label:'⚙️ 부품 +3'}, {k:'weapons',v:1,label:'🔩 무기 +1'}, {k:'gen',v:'V',label:'◈V +1'} ],
  arms:  [ {k:'weapons',v:2,label:'🔩 무기 +2'}, {k:'atk_boost',v:2,label:'💥 다음 판정 +2 (일회성)'}, {k:'gen',v:'I',label:'◈I +1'} ],
  club:  [ {k:'credit',v:4,label:'₵ +4'}, {k:'influence',v:1,label:'🎙 인플루언스 +1'}, {k:'gen',v:'S',label:'◈S +1'} ],
  port:  [ {k:'credit',v:2,label:'₵ +2'}, {k:'weapons',v:1,label:'🔩 무기 +1'}, {k:'move_bonus',v:2,label:'🚶 다음 턴 이동 +2'} ],
  cop:   [ {k:'wanted',v:-2,label:'🚨 현상수배 -2 (해금)'}, {k:'heat_down',v:1,label:'🔥 공권력 -1'}, {k:'info',v:1,label:'👁 전체 지도 3라운드 노출'} ],
  nex:   [ {k:'all_attr',v:1,label:'◈ 전속성 +1'}, {k:'credit',v:5,label:'₵ +5 (넥서스 보상)'}, {k:'rep',v:3,label:'★ 렙 +3 (명성)'} ],
  aux:   [ {k:'credit',v:2,label:'₵ +2'}, {k:'gen',v:'GRID',label:'◈GRID +1'}, {k:'random_attr',v:1,label:'◈ 랜덤 속성 +2'} ],
};

// 5×5 tutorial map (25 cells)
const MAP_5x5 = [
  ['A1','ruin'], ['B1','home'], ['C1','bank'], ['D1','data'], ['E1','ruin'],
  ['A2','ruin'], ['B2','aux'],  ['C2','data'], ['D2','data'], ['E2','heal'],
  ['A3','port'], ['B3','work'], ['C3','nex'],  ['D3','heal'], ['E3','home'],
  ['A4','work'], ['B4','aux'],  ['C4','arms'], ['D4','aux'],  ['E4','arms'],
  ['A5','ruin'], ['B5','club'], ['C5','cop'],  ['D5','port'], ['E5','ruin'],
];

// Bloc HQ + support zones (tutorial)
const BLOC_SETUP = {
  VANTA:    { hq: 'C2', support: ['C1'],      color: '#1a1a1a' },
  AXIOM:    { hq: 'D2', support: ['D1'],      color: '#2d6fff' },
  HELIX:    { hq: 'D3', support: ['E2'],      color: '#8ab57c' },
  IRONWALL: { hq: 'C4', support: ['E4'],      color: '#4a5d23' },
  CARBON:   { hq: 'B3', support: ['A4'],      color: '#8b5a2b' },
};

// Bloc stats (for direct combat)
const BLOC_STATS = {
  VANTA:    { hp: 7,  atk: 2, def: 2, spd: 3, hack: 5, primary: 'M', secondary: 'S' },
  IRONWALL: { hp: 10, atk: 5, def: 4, spd: 3, hack: 1, primary: 'I', secondary: 'A' },
  HELIX:    { hp: 8,  atk: 3, def: 3, spd: 2, hack: 3, primary: 'B', secondary: 'V' },
  AXIOM:    { hp: 6,  atk: 2, def: 2, spd: 4, hack: 5, primary: 'M', secondary: 'V' },
  CARBON:   { hp: 9,  atk: 3, def: 4, spd: 2, hack: 2, primary: 'V', secondary: 'A' },
};

const GHOST_STATS = {
  CIPHER:  { hp: 6,  atk: 2, def: 1, spd: 4, hack: 5, primary: 'M', secondary: 'S', startZone: 'A1' },
  BLADE:   { hp: 10, atk: 5, def: 3, spd: 3, hack: 1, primary: 'I', secondary: 'A', startZone: 'A5' },
  BROKER:  { hp: 6,  atk: 2, def: 2, spd: 5, hack: 2, primary: 'S', secondary: 'GRID', startZone: 'A3' },
  RIGGER:  { hp: 7,  atk: 3, def: 4, spd: 2, hack: 3, primary: 'V', secondary: 'I', startZone: 'B5' },
  DRIFTER: { hp: 8,  atk: 2, def: 2, spd: 4, hack: 1, primary: 'A', secondary: 'GRID', startZone: 'E1' },
  MOLE:    { hp: 7,  atk: 2, def: 3, spd: 3, hack: 3, primary: 'S', secondary: 'M', startZone: 'D3' },
};

// Ghost cards (compact: tags describe effects)
// Effect tags:
//  move:N, atk:N, def:N, heal:N, scout, stealth, break_veil,
//  gen:X (generate attr), steal:X, crash_stock:N, reveal_hand,
//  raid_bonus:N, rep:N, credit:N
const GHOST_CARDS = {
  // CIPHER
  PORT_SCAN:      { name: 'PORT SCAN',      cls: 'CIPHER', init: 12, attr: ['M'],      top: { gen: 'M', move: 2, scout: 2, peek_news: 1 },       bot: { cost: ['M','S'], reveal: 'zone', break_veil: 1, sell_info: 1 } },
  DATA_SPIKE:     { name: 'DATA SPIKE',     cls: 'CIPHER', init: 22, attr: ['M'], loss: true, top: { gen: 'M', atk: 1 },                         bot: { cost: ['M','M','S'], atk: 5, def_ignore: true, steal: 'M' } },
  GHOST_ACCESS:   { name: 'GHOST ACCESS',   cls: 'CIPHER', init: 8,  attr: ['S'],      top: { gen: 'S', stealth: 1 },                            bot: { cost: ['S'], clear_wanted: true } },
  MESH_DIVE:      { name: 'MESH DIVE',      cls: 'CIPHER', init: 30, attr: ['M','S'],  top: { gen: 'GRID', move: 1, scout: 2 },                  bot: { cost: ['M','M'], draw_quest: 1 } },
  ICE_BREAK:      { name: 'ICE BREAK',      cls: 'CIPHER', init: 18, attr: ['M'],      top: { gen: 'M', break_veil: 1 },                         bot: { cost: ['M','M'], break_veil: 99 } },
  PROXY_RELAY:    { name: 'PROXY RELAY',    cls: 'CIPHER', init: 25, attr: ['S'],      top: { gen: 'S', redirect: 3 },                           bot: { cost: ['S','M'], transfer_attack: 1 } },
  STOCK_CRASH:    { name: 'STOCK CRASH',    cls: 'CIPHER', init: 35, attr: ['M'],      top: { gen: 'M', stock_op: 1 },                           bot: { cost: ['M','M','M'], crash_stock: 3 } },
  NEURAL_OVRD:    { name: 'NEURAL OVERRIDE',cls: 'CIPHER', init: 45, attr: ['M','S'], loss: true, top: { gen: 'M:S', slow_target: 20 },          bot: { cost: ['M','M','S','S'], mimic: 1 } },
  ZERO_TRACE:     { name: 'ZERO TRACE',     cls: 'CIPHER', init: 50, attr: ['S'], loss: true, top: { gen: 'S', wipe_log: 1 },                    bot: { cost: ['S','S','S'], clear_wanted: true, permanent: true } },
  BASIC_MOVE_C:   { name: 'BASIC MOVE',     cls: 'CIPHER', init: 20, attr: ['GRID'],   top: { move: 2 },                                         bot: { swap: 1 } },

  // BLADE
  QUICK_DRAW:     { name: 'QUICK DRAW',     cls: 'BLADE',  init: 5,  attr: ['I'],      top: { gen: 'I', atk: 3, always_first: true },            bot: { cost: ['I'], spd: 3 } },
  SUPPRESS_FIRE:  { name: 'SUPPRESSION',    cls: 'BLADE',  init: 18, attr: ['I'],      top: { gen: 'I', move: 1, block_adj: 1 },                 bot: { cost: ['I','I'], enemy_spd: -3 } },
  BREACHER:       { name: 'BREACHER',       cls: 'BLADE',  init: 14, attr: ['A'],      top: { gen: 'A', move: 2, break_veil: 1 },                bot: { break_veil: 99, force_enter: 1 } },
  CONTRACT_KILL:  { name: 'CONTRACT KILL',  cls: 'BLADE',  init: 28, attr: ['I','A'],  top: { gen: 'I', atk: 2, target: 1 },                     bot: { cost: ['I','I','A'], assassin: 1, rep: 3 } },
  HUMAN_SHIELD:   { name: 'HUMAN SHIELD',   cls: 'BLADE',  init: 24, attr: ['I'],      top: { gen: 'I', def: 2, protect_ally: 1 },               bot: { def: 4, absorb: 1 } },
  DOUBLE_TAP:     { name: 'DOUBLE TAP',     cls: 'BLADE',  init: 20, attr: ['I'],      top: { gen: 'I', atk_reroll: 1 },                         bot: { cost: ['I','I'], atk_twice: 1 } },
  POINT_BLANK:    { name: 'POINT BLANK',    cls: 'BLADE',  init: 10, attr: ['I'],      top: { gen: 'I', same_zone_atk: 4 },                      bot: { cost: ['I'], def_ignore: 1 } },
  BERSERKER:      { name: 'BERSERKER',      cls: 'BLADE',  init: 32, attr: ['A'], loss: true, top: { gen: 'A', atk: 3, def_penalty: 2 },         bot: { cost: ['A','A'], atk_x2: 1, def_zero: 1 } },
  LAST_STAND:     { name: 'LAST STAND',     cls: 'BLADE',  init: 40, attr: ['I','A'], loss: true, top: { def_infinite_to_1: 1 },                 bot: { cost: ['I','I','A'], atk_x3_retort: 1 } },
  BASIC_MOVE_B:   { name: 'BASIC MOVE',     cls: 'BLADE',  init: 20, attr: ['GRID'],   top: { move: 2 },                                         bot: { swap: 1 } },

  // BROKER
  NETWORK:        { name: 'NETWORK',        cls: 'BROKER', init: 15, attr: ['S'],      top: { gen: 'S', contact: 2, scout: 1, extort: 1 },       bot: { cost: ['S'], contact: 3, blackmarket: 1 } },
  BACK_DEAL:      { name: 'BACK DEAL',      cls: 'BROKER', init: 18, attr: ['S'],      top: { gen: 'S', swap_ratio: 2 },                         bot: { cost: ['S'], blackmarket: 1 } },
  BLACKMAIL:      { name: 'BLACKMAIL',      cls: 'BROKER', init: 22, attr: ['S'],      top: { gen: 'S', extort: 2 },                             bot: { cost: ['S','S'], cancel_action: 1, extort: 3 } },
  MIDDLE_DEAL:    { name: 'MIDDLE DEAL',    cls: 'BROKER', init: 25, attr: ['GRID'],   top: { gen: 'GRID', broker_fee: 10 },                     bot: { passive_ma_fee: 5 } },
  INFO_BROKER:    { name: 'INFO BROKER',    cls: 'BROKER', init: 30, attr: ['S'],      top: { gen: 'S', peek_objective: 1 },                     bot: { cost: ['S','S'], sell_info: 5, lock: 1 } },
  CRISIS_TALK:    { name: 'CRISIS TALK',    cls: 'BROKER', init: 28, attr: ['GRID'],   top: { gen: 'GRID', stop_combat: 1 },                     bot: { reward: 2, cooldown: 1 } },
  DBL_CONTRACT:   { name: 'DBL CONTRACT',   cls: 'BROKER', init: 35, attr: ['S','GRID'], top: { gen: 'S', slot_plus: 1 },                         bot: { cost: ['S','GRID'], quest_two: 1 } },
  POKER_FACE:     { name: 'POKER FACE',     cls: 'BROKER', init: 20, attr: ['S'],      top: { gen: 'S', hide_actions: 1 },                       bot: { cost: ['S'], negate_scout: 1 } },
  BURN_BRIDGE:    { name: 'BURN BRIDGE',    cls: 'BROKER', init: 45, attr: ['S'], loss: true, top: { gen: 'S', break_contract: 1 },              bot: { cost: ['S','S'], all_contracts: 1 } },
  BASIC_MOVE_R:   { name: 'BASIC MOVE',     cls: 'BROKER', init: 20, attr: ['GRID'],   top: { move: 2 },                                         bot: { swap: 1 } },

  // RIGGER
  DRONE_SCAN:     { name: 'DRONE SCAN',     cls: 'RIGGER', init: 16, attr: ['V'],      top: { gen: 'V', scout: 3 },                              bot: { cost: ['V'], scout: 5, parts: 1 } },
  TRAP_WIRE:      { name: 'TRAP WIRE',      cls: 'RIGGER', init: 25, attr: ['V'],      top: { gen: 'V', trap: 1 },                               bot: { cost: ['V','I'], trap_damage: 4 } },
  EMP_PULSE:      { name: 'EMP PULSE',      cls: 'RIGGER', init: 32, attr: ['V'], loss: true, top: { gen: 'V', disable_elec: 1 },                bot: { cost: ['V','V'], zone_disable: 1 } },
  OVERCLOCK:      { name: 'OVERCLOCK',      cls: 'RIGGER', init: 22, attr: ['V'],      top: { gen: 'V', temp_tl: 1 },                            bot: { cost: ['V','V'], stat_boost: 2 } },
  FIELD_CRAFT:    { name: 'FIELD CRAFT',    cls: 'RIGGER', init: 26, attr: ['V','I'],  top: { gen: 'V', parts: 2 },                              bot: { cost: ['V','I'], craft_item: 1 } },
  SHIELD_GEN:     { name: 'SHIELD GEN',     cls: 'RIGGER', init: 24, attr: ['V'],      top: { gen: 'V', def: 3 },                                bot: { cost: ['V','V'], zone_shield: 1 } },
  DRONE_SWARM:    { name: 'DRONE SWARM',    cls: 'RIGGER', init: 38, attr: ['V','I'],  top: { gen: 'V', atk_range: 2 },                          bot: { cost: ['V','I','I'], multi_target: 3 } },
  JURY_RIG:       { name: 'JURY RIG',       cls: 'RIGGER', init: 20, attr: ['V'],      top: { gen: 'V', repair: 3 },                             bot: { cost: ['V'], salvage: 2 } },
  TECH_BREACH:    { name: 'TECH BREACH',    cls: 'RIGGER', init: 42, attr: ['V'], loss: true, top: { gen: 'V', disable_tl: 1 },                  bot: { cost: ['V','V','V'], force_tl_down: 1 } },
  BASIC_MOVE_RG:  { name: 'BASIC MOVE',     cls: 'RIGGER', init: 20, attr: ['GRID'],   top: { move: 2 },                                         bot: { swap: 1 } },

  // DRIFTER
  FAST_TRAVEL:    { name: 'FAST TRAVEL',    cls: 'DRIFTER',init: 10, attr: ['A'],      top: { gen: 'A', move: 2 },                               bot: { cost: ['A'], move_any: 2 } },
  SUPPLY_CONV:    { name: 'SUPPLY CONVOY',  cls: 'DRIFTER',init: 20, attr: ['GRID'],   top: { gen: 'GRID', fuel: 3 },                            bot: { transfer_ally: 3 } },
  AMBUSH:         { name: 'AMBUSH',         cls: 'DRIFTER',init: 14, attr: ['A'],      top: { gen: 'A', spd: 5, atk: 2 },                        bot: { cost: ['A'], surprise: 1 } },
  STORM_RUSH:     { name: 'STORM RUSH',     cls: 'DRIFTER',init: 18, attr: ['A'], loss: true, top: { move: 2, ignore_obstacles: 1, atk: 2 },       bot: { cost: ['A','A'], move_3_nowalls: 1 } },
  BACKROADS:      { name: 'BACKROADS',      cls: 'DRIFTER',init: 28, attr: ['GRID'],   top: { gen: 'GRID', untrack: 1 },                         bot: { shortcut: 2 } },
  SCORCH_PATH:    { name: 'SCORCH PATH',    cls: 'DRIFTER',init: 34, attr: ['A'],      top: { gen: 'A', leave_fire: 1 },                         bot: { cost: ['A','A'], burn_behind: 1 } },
  CARGO_HAUL:     { name: 'CARGO HAUL',     cls: 'DRIFTER',init: 22, attr: ['A','GRID'], top: { gen: 'A', credit: 3 },                            bot: { smuggle: 1 } },
  IRON_WHEELS:    { name: 'IRON WHEELS',    cls: 'DRIFTER',init: 26, attr: ['A'],      top: { gen: 'A', def: 2, move: 1 },                       bot: { cost: ['A','A'], ram_atk: 3 } },
  GHOST_RUN:      { name: 'GHOST RUN',      cls: 'DRIFTER',init: 36, attr: ['A','GRID'], loss: true, top: { move: 2, ignore_all: 1 },           bot: { cost: ['A','A','GRID'], teleport: 1 } },
  BASIC_MOVE_D:   { name: 'BASIC MOVE',     cls: 'DRIFTER',init: 20, attr: ['GRID'],   top: { move: 2 },                                         bot: { swap: 1 } },

  // MOLE
  INNER_DOCS:     { name: 'INNER DOCS',     cls: 'MOLE',   init: 24, attr: ['S','M'],  top: { gen: 'S', peek_bloc: 1 },                          bot: { cost: ['S','M'], steal_card: 1 } },
  AUTH_ABUSE:     { name: 'AUTH ABUSE',     cls: 'MOLE',   init: 30, attr: ['S'],      top: { gen: 'S', bloc_resource: 2 },                      bot: { cost: ['S','S'], disguise: 1 } },
  CLEAN_SLATE:    { name: 'CLEAN SLATE',    cls: 'MOLE',   init: 18, attr: ['S'],      top: { gen: 'S', clear_track: 1 },                        bot: { cost: ['S'], permanent_clear: 1 } },
  FALSE_FLAG:     { name: 'FALSE FLAG',     cls: 'MOLE',   init: 26, attr: ['S','M'],  top: { gen: 'S', frame: 1 },                              bot: { cost: ['S','M'], swap_blame: 1 } },
  DISGUISE:       { name: 'DISGUISE',       cls: 'MOLE',   init: 16, attr: ['S'],      top: { gen: 'S', infiltrate: 1 },                         bot: { cost: ['S'], bypass_veil: 1 } },
  BOARD_MANIP:    { name: 'BOARD MANIP',    cls: 'MOLE',   init: 38, attr: ['M','S'],  top: { gen: 'M', influence: 3 },                          bot: { cost: ['M','S','S'], vote_flip: 1 } },
  LEAK:           { name: 'LEAK',           cls: 'MOLE',   init: 28, attr: ['S','M'],  top: { gen: 'S', scandal: 1 },                            bot: { cost: ['S','M'], stock_dmg: 2 } },
  DEEP_COVER:     { name: 'DEEP COVER',     cls: 'MOLE',   init: 32, attr: ['S'],      top: { gen: 'S', invisible: 1 },                          bot: { cost: ['S','S'], invisible_2r: 1 } },
  ID_COLLAPSE:    { name: 'ID COLLAPSE',    cls: 'MOLE',   init: 45, attr: ['S','M'], loss: true, top: { gen: 'S', burn_identity: 1 },            bot: { cost: ['S','S','M'], copy_bloc_card: 1 } },
  BASIC_MOVE_M:   { name: 'BASIC MOVE',     cls: 'MOLE',   init: 20, attr: ['GRID'],   top: { move: 2 },                                         bot: { swap: 1 } },
};

// Ghost class decks
const GHOST_DECKS = {
  CIPHER:  ['PORT_SCAN','DATA_SPIKE','GHOST_ACCESS','MESH_DIVE','ICE_BREAK','PROXY_RELAY','STOCK_CRASH','NEURAL_OVRD','ZERO_TRACE','BASIC_MOVE_C'],
  BLADE:   ['QUICK_DRAW','SUPPRESS_FIRE','BREACHER','CONTRACT_KILL','HUMAN_SHIELD','DOUBLE_TAP','POINT_BLANK','BERSERKER','LAST_STAND','BASIC_MOVE_B'],
  BROKER:  ['NETWORK','BACK_DEAL','BLACKMAIL','MIDDLE_DEAL','INFO_BROKER','CRISIS_TALK','DBL_CONTRACT','POKER_FACE','BURN_BRIDGE','BASIC_MOVE_R'],
  RIGGER:  ['DRONE_SCAN','TRAP_WIRE','EMP_PULSE','OVERCLOCK','FIELD_CRAFT','SHIELD_GEN','DRONE_SWARM','JURY_RIG','TECH_BREACH','BASIC_MOVE_RG'],
  DRIFTER: ['FAST_TRAVEL','SUPPLY_CONV','AMBUSH','STORM_RUSH','BACKROADS','SCORCH_PATH','CARGO_HAUL','IRON_WHEELS','GHOST_RUN','BASIC_MOVE_D'],
  MOLE:    ['INNER_DOCS','AUTH_ABUSE','CLEAN_SLATE','FALSE_FLAG','DISGUISE','BOARD_MANIP','LEAK','DEEP_COVER','ID_COLLAPSE','BASIC_MOVE_M'],
};

// Bloc cards (compact)
const BLOC_CARDS = {
  // VANTA
  SHADOW_FILE:     { name: 'SHADOW FILE',     bloc: 'VANTA',   tl: 1, main: { cost:['M','S'], peek_hand: 1 }, side: { gen: 'S' }, combo: { with: 'S', peek_full: 1 } },
  LEVERAGE:        { name: 'LEVERAGE',        bloc: 'VANTA',   tl: 1, main: { cost:['S'], cancel_card: 1 }, side: { gen: 'S' }, combo: { with: 'M', info: 1 } },
  VEIL_DEPLOY:     { name: 'VEIL DEPLOY',     bloc: 'VANTA',   tl: 2, main: { cost:['M','M'], veil_up: 2 }, side: { gen: 'M' }, combo: {} },
  GHOST_PROTOCOL:  { name: 'GHOST PROTOCOL',  bloc: 'VANTA',   tl: 3, main: { cost:['M','S','S'], hide_actions_1r: 1 }, side: { gen: 'M' }, combo: {} },
  DATA_WIPE:       { name: 'DATA WIPE',       bloc: 'VANTA',   tl: 3, main: { cost:['M','M'], clear_ghost_wanted: 1 }, side: { gen: 'M' }, combo: {} },
  ZERO_RECORD:     { name: 'ZERO RECORD',     bloc: 'VANTA',   tl: 4, main: { cost:['M','M','S'], remove_scandals: 99 }, side: { gen: 'S' }, combo: {} },
  // IRONWALL
  FORWARD_STRIKE:  { name: 'FORWARD STRIKE',  bloc: 'IRONWALL',tl: 1, main: { cost:['I'], deploy_op: 1 }, side: { gen: 'I' }, combo: { with: 'A', destroy_res: 50 } },
  ARMS_SUPPLY:     { name: 'ARMS SUPPLY',     bloc: 'IRONWALL',tl: 1, main: { cost:['I'], weapons: 3 }, side: { gen: 'I' }, combo: {} },
  FORWARD_BASE:    { name: 'FORWARD BASE',    bloc: 'IRONWALL',tl: 2, main: { cost:['I','I'], fortify: 2 }, side: { gen: 'I' }, combo: {} },
  MARTIAL_LAW:     { name: 'MARTIAL LAW',     bloc: 'IRONWALL',tl: 3, main: { cost:['I','A','A'], heat: 3, ghost_move: -1 }, side: { gen: 'I' }, combo: {} },
  MERCENARY_SURGE: { name: 'MERC SURGE',      bloc: 'IRONWALL',tl: 3, main: { cost:['I','I'], deploy_op: 3 }, side: { gen: 'I' }, combo: {} },
  SCORCHED_EARTH:  { name: 'SCORCHED EARTH',  bloc: 'IRONWALL',tl: 4, main: { cost:['I','A','A'], destroy_zone: 1 }, side: { gen: 'A' }, combo: {} },
  // HELIX (minimal, 3 for now)
  FIELD_SPLICE:    { name: 'FIELD SPLICE',    bloc: 'HELIX',   tl: 2, main: { cost:['B'], heal_all: 50 }, side: { gen: 'B' }, combo: {} },
  NEURAL_IFACE:    { name: 'NEURAL IFACE',    bloc: 'HELIX',   tl: 2, main: { cost:['B','V'], ghost_extra_card: 1 }, side: { gen: 'B' }, combo: {} },
  AUGMENTATION:    { name: 'AUGMENTATION',    bloc: 'HELIX',   tl: 2, main: { cost:['B','V'], stat_boost: 2 }, side: { gen: 'V' }, combo: {} },
  QUARANTINE:      { name: 'QUARANTINE',      bloc: 'HELIX',   tl: 3, main: { cost:['B','B'], lock_zone: 1 }, side: { gen: 'B' }, combo: {} },
  HARVEST:         { name: 'HARVEST',         bloc: 'HELIX',   tl: 3, main: { cost:['B','V','V'], steal_op: 2 }, side: { gen: 'V' }, combo: {} },
  CLONE_DECOY:     { name: 'CLONE DECOY',     bloc: 'HELIX',   tl: 4, main: { cost:['B','B','V'], revive: 1 }, side: { gen: 'B' }, combo: {} },
  // AXIOM
  PREDICTION_E:    { name: 'PREDICTION ENGINE',bloc:'AXIOM',   tl: 2, main: { cost:['M','V'], peek_news: 3 }, side: { gen: 'V' }, combo: {} },
  FLASH_CRASH:     { name: 'FLASH CRASH',     bloc: 'AXIOM',   tl: 3, main: { cost:['M','M','V'], crash_target: 4 }, side: { gen: 'V' }, combo: {} },
  ALGO_LOCK:       { name: 'ALGO LOCK',       bloc: 'AXIOM',   tl: 2, main: { cost:['M','V'], zone_hack_def: 4 }, side: { gen: 'V' }, combo: {} },
  FLASH_TRADE:     { name: 'FLASH TRADE',     bloc: 'AXIOM',   tl: 2, main: { cost:['M'], same_round_trade: 1 }, side: { gen: 'V' }, combo: {} },
  SURVEILLANCE:    { name: 'SURVEILLANCE',    bloc: 'AXIOM',   tl: 3, main: { cost:['M','V'], scout_all: 1 }, side: { gen: 'M' }, combo: {} },
  SYS_TAKEOVER:    { name: 'SYS TAKEOVER',    bloc: 'AXIOM',   tl: 4, main: { cost:['M','M','V','V'], algorithm: 1 }, side: { gen: 'V' }, combo: {} },
  // === 공통 Bloc 추가 카드: 이동·투자·용병·합병 옵션 ===
  BOARDROOM_MOVE:   { name: 'BOARDROOM MOVE',  bloc: 'any',     tl: 1, main: { move: 2 },                                  side: { gen: 'GRID' }, combo: {} },
  MARKET_TRADE:     { name: 'MARKET TRADE',    bloc: 'any',     tl: 1, main: { stock_buy_any: 2 },                         side: { gen: 'M' },    combo: {} },
  HIRE_GHOST:       { name: 'HIRE GHOST',      bloc: 'any',     tl: 2, main: { cost:['S'], hire_raid: 1 },                 side: { credit: 2 },   combo: {} },
  ZONE_FORTIFY:     { name: 'ZONE FORTIFY',    bloc: 'any',     tl: 1, main: { cost:['I'], fortify_here: 1 },              side: { gen: 'I' },    combo: {} },
  EXPAND_OP:        { name: 'EXPAND OP',       bloc: 'any',     tl: 1, main: { deploy_op: 2 },                             side: { gen: 'A' },    combo: {} },
  INVEST_HEAVY:     { name: 'INVEST HEAVY',    bloc: 'any',     tl: 2, main: { cost:['GRID'], stock_buy_any: 4 },          side: { credit: 3 },   combo: {} },
  COUNTER_INTEL:    { name: 'COUNTER INTEL',   bloc: 'any',     tl: 2, main: { cost:['M'], peek_news: 2, scout_all: 1 },   side: { gen: 'M' },    combo: {} },
  CRISIS_RESPONSE:  { name: 'CRISIS RESPONSE', bloc: 'any',     tl: 1, main: { heat: -2, credit: 3 },                      side: { gen: 'A' },    combo: {} },
  HOSTILE_BID:      { name: 'HOSTILE BID',     bloc: 'any',     tl: 3, main: { cost:['M','GRID'], crash_target: 3, credit: 4 }, side: { gen: 'M' }, combo: {} },
  SECURITY_SWEEP:   { name: 'SECURITY SWEEP',  bloc: 'any',     tl: 2, main: { cost:['I'], ghost_wanted_all: 1, heat: 1 }, side: { gen: 'I' },    combo: {} },
  // CARBON
  POWER_SURGE:     { name: 'POWER SURGE',     bloc: 'CARBON',  tl: 1, main: { cost:['V'], zone_income_2x: 1 }, side: { gen: 'V' }, combo: {} },
  BLACKOUT_C:      { name: 'BLACKOUT',        bloc: 'CARBON',  tl: 2, main: { cost:['V','A'], zero_income: 1 }, side: { gen: 'A' }, combo: {} },
  PIPELINE_LOCK:   { name: 'PIPELINE LOCK',   bloc: 'CARBON',  tl: 3, main: { cost:['V','V'], block_resource: 1 }, side: { gen: 'V' }, combo: {} },
  INFRA_BOND:      { name: 'INFRA BOND',      bloc: 'CARBON',  tl: 2, main: { cost:['V','GRID'], bond: 8 }, side: { gen: 'GRID' }, combo: {} },
  HOSTILE_DIV:     { name: 'HOSTILE DIV',     bloc: 'CARBON',  tl: 3, main: { cost:['V','A'], div_2x: 1 }, side: { gen: 'V' }, combo: {} },
  LEGACY_CONTRACT: { name: 'LEGACY CONTRACT', bloc: 'CARBON',  tl: 4, main: { cost:['V','V','A'], long_contract: 50 }, side: { gen: 'V' }, combo: {} },
};

// 모든 블록이 공통으로 받는 10장 (이동·투자·용병·요새·합병·정보 등)
const BLOC_COMMON = ['BOARDROOM_MOVE','MARKET_TRADE','HIRE_GHOST','ZONE_FORTIFY','EXPAND_OP','INVEST_HEAVY','COUNTER_INTEL','CRISIS_RESPONSE','HOSTILE_BID','SECURITY_SWEEP'];

const BLOC_DECKS = {
  VANTA: ['SHADOW_FILE','LEVERAGE','VEIL_DEPLOY','GHOST_PROTOCOL','DATA_WIPE','ZERO_RECORD', ...BLOC_COMMON],
  IRONWALL: ['FORWARD_STRIKE','ARMS_SUPPLY','FORWARD_BASE','MARTIAL_LAW','MERCENARY_SURGE','SCORCHED_EARTH', ...BLOC_COMMON],
  HELIX: ['FIELD_SPLICE','NEURAL_IFACE','AUGMENTATION','QUARANTINE','HARVEST','CLONE_DECOY', ...BLOC_COMMON],
  AXIOM: ['PREDICTION_E','FLASH_CRASH','ALGO_LOCK','FLASH_TRADE','SURVEILLANCE','SYS_TAKEOVER', ...BLOC_COMMON],
  CARBON: ['POWER_SURGE','BLACKOUT_C','PIPELINE_LOCK','INFRA_BOND','HOSTILE_DIV','LEGACY_CONTRACT', ...BLOC_COMMON],
};

// Curated news (15 for S00)
// 뉴스 이벤트 카드 — 효과 키
// heat: 공권력 ±N  / all_stock: 모든 주가 ±N  / target_stock: {bloc, delta}  / random_crash: 임의 블록 -N
// all_credit: 전 플레이어 ₵ ±N  / target_credit: {role, delta}  / all_rep: Ghost 전원 렙 ±N
// all_weapons/parts/data: 전 플레이어 자원 ±N  / signal_lock: 시그널 다이 고정  / bloc_income_2x: 1R Bloc 수입 2배
// ghost_move: 모든 Ghost 이동 +N  / wanted_all: Ghost 전원 현상수배 ±N  / map_reveal: N라운드 지도 노출
// random_zone_flip: 랜덤 구역 중립화  / stock_freeze: 주가 변동 1R 정지  / hp_all: 전 고스트 HP ±N
const NEWS = [
  // === 시장 충격 (주가 축) ===
  { id: 11, title: '주식 시장 대폭락', effect: { all_stock: -3, heat: 1 }, flavor: '패닉은 합리적이다.' },
  { id: 12, title: '월가 붐', effect: { all_stock: 2 }, flavor: '낙관주의는 위험하다.' },
  { id: 14, title: '루머 확산', effect: { random_crash: 3 }, flavor: '소문은 항상 먼저 도착한다.' },
  { id: 15, title: '인수합병 열풍', effect: { all_stock: 1, target_credit: { role: 'bloc', delta: 3 } }, flavor: '큰 생선이 작은 생선을 먹는다.' },
  { id: 16, title: '내부자 고발', effect: { random_crash: 5, heat: 2 }, flavor: '익명의 이메일 한 통.' },
  { id: 17, title: '주가 동결령', effect: { stock_freeze: 1 }, flavor: '시장을 멈추면 문제가 해결될까?' },

  // === 블록별 호재/악재 ===
  { id: 2,  title: 'AI 규제 법안 통과', effect: { target_stock: { bloc: 'AXIOM', delta: -4 } }, flavor: 'AI는 사람을 대체할 수 없다.' },
  { id: 3,  title: 'AI 윤리 허가', effect: { target_stock: { bloc: 'AXIOM', delta: 3 } }, flavor: '기계는 이제 자격증이 있다.' },
  { id: 30, title: '베일 스캔들', effect: { target_stock: { bloc: 'VANTA', delta: -3 }, map_reveal: 2 }, flavor: '사생활은 상품이었다.' },
  { id: 31, title: '바이오 혁신', effect: { target_stock: { bloc: 'HELIX', delta: 3 }, hp_all: 2 }, flavor: '살아있는 것들의 시대.' },
  { id: 37, title: '용병 수요 폭증', effect: { target_stock: { bloc: 'IRONWALL', delta: 3 }, heat: 1 }, flavor: '총성이 들려야 월급이 온다.' },
  { id: 43, title: '군수 계약 취소', effect: { target_stock: { bloc: 'IRONWALL', delta: -4 } }, flavor: '계약은 깨졌다.' },
  { id: 44, title: '정전 사태', effect: { target_stock: { bloc: 'CARBON', delta: -3 }, all_credit: -2 }, flavor: '어둠 속에서 도시가 멈췄다.' },
  { id: 45, title: '신재생 에너지 보조금', effect: { target_stock: { bloc: 'CARBON', delta: 4 } }, flavor: '정부는 녹색을 발견했다.' },

  // === 공권력·치안 축 ===
  { id: 1,  title: '계엄 부분 해제', effect: { heat: -3 }, flavor: '임시 조치였다고 정부는 말한다.' },
  { id: 21, title: '대규모 시위', effect: { heat: 3, target_stock: { bloc: 'IRONWALL', delta: 1 } }, flavor: '구호는 단순했다.' },
  { id: 26, title: '경찰 파업', effect: { heat: -4, wanted_all: -1 }, flavor: '법은 월급이 멈추면 쉰다.' },
  { id: 27, title: '드론 순찰 강화', effect: { heat: 2, wanted_all: 1 }, flavor: '하늘에서 지켜본다.' },
  { id: 28, title: '임시 사면령', effect: { wanted_all: -2 }, flavor: '선거 전이다.' },

  // === 자원·지원 축 ===
  { id: 13, title: '암시장 호황', effect: { target_credit: { role: 'ghost', delta: 4 }, all_weapons: 1 }, flavor: '공식 경제가 망가지면.' },
  { id: 18, title: '대형 거래 체결', effect: { all_credit: 3 }, flavor: '유동성이 돌아왔다.' },
  { id: 22, title: '시민 축제', effect: { target_credit: { role: 'bloc', delta: 3 }, target_stock: { bloc: 'VANTA', delta: 1 } }, flavor: '잠깐이라도 괜찮다고.' },
  { id: 25, title: '이민 물결', effect: { all_credit: 2, heat: 1 }, flavor: '더 나은 곳을 찾아온다.' },
  { id: 33, title: '드론 스웜 사고', effect: { all_parts: 2, random_zone_flip: 1 }, flavor: '세 대가 돌아왔다. 일곱 대는 아니었다.' },
  { id: 46, title: 'UFO 목격', effect: { all_data: 2, heat: 1 }, flavor: '그냥 드론이라고 정부는 말한다.' },

  // === 정보·시그널 축 ===
  { id: 50, title: '메시넷 블랙아웃', effect: { signal_lock: 'BLACKOUT', target_credit: { role: 'ghost', delta: 3 } }, flavor: '1시간. 모두 사라졌다.' },
  { id: 51, title: '메시넷 과부하', effect: { signal_lock: 'SURGE' }, flavor: '누군가 전부를 연결하려 했다.' },
  { id: 52, title: '해킹 대란', effect: { target_stock: { bloc: 'VANTA', delta: -2 }, target_stock2: { bloc: 'AXIOM', delta: -2 } }, flavor: '그들은 밤새 일했다.' },

  // === Ghost·Bloc 비대칭 이벤트 ===
  { id: 60, title: '영웅 담론', effect: { all_rep: 2, heat: -1 }, flavor: '이름을 지워도 이야기는 남는다.' },
  { id: 61, title: '마녀사냥', effect: { wanted_all: 2, target_stock: { bloc: 'IRONWALL', delta: 2 } }, flavor: '누군가 대가를 치러야 한다.' },
  { id: 62, title: 'Bloc 연합 회의', effect: { target_credit: { role: 'bloc', delta: 5 }, target_stock: { bloc: 'CARBON', delta: 1 } }, flavor: '위기는 그들을 묶었다.' },
  { id: 63, title: '고스트 사냥령', effect: { wanted_all: 3, hp_all: -1 }, flavor: '현상금이 떨어졌다.' },

  // === 이동·맵 이벤트 ===
  { id: 70, title: '도로 봉쇄', effect: { ghost_move: -1, heat: 2 }, flavor: '그들은 출구를 닫았다.' },
  { id: 71, title: '지하 통로 개통', effect: { ghost_move: 1 }, flavor: '지도에 없는 길이 하나 생겼다.' },
  { id: 72, title: '구역 점령 해제', effect: { random_zone_flip: 2 }, flavor: '한 구역, 두 구역, 세 구역.' },

  // === v0.5.11: Ghost-favorable 추가 ===
  { id: 80, title: '시민 저항 집회', effect: { all_rep: 2, heat: -1 }, flavor: '이름 없는 얼굴이 모였다.' },
  { id: 81, title: '블록 스캔들 폭로', effect: { all_stock: -2, all_rep: 1 }, flavor: '증거는 섬뜩하게 깔끔했다.' },
  { id: 82, title: '지하 정보망 활성화', effect: { target_credit: { role: 'ghost', delta: 3 }, all_data: 1 }, flavor: '말은 소문보다 빠르다.' },
  { id: 83, title: '경찰 부패 수사', effect: { heat: -3, wanted_all: -1 }, flavor: '그들의 집도 압수수색됐다.' },
  { id: 84, title: '고스트 영웅 서사', effect: { all_rep: 3 }, flavor: '이야기가 역사보다 오래 남는다.' },
];

// Hidden objectives (10 simplified for MVP)
const OBJECTIVES = [
  { id: 'B-E02', role: 'bloc', diff: 'med',  name: '포트폴리오 킹', desc: '4+ 블록 10%+ 주식', bonus: { assetBonus: 15 } },
  { id: 'B-D03', role: 'bloc', diff: 'med',  name: '구역 점거',     desc: '자사 구역 10+ 보유', bonus: { assetBonus: 15 } },
  { id: 'B-T04', role: 'bloc', diff: 'easy', name: '데이터 주권',    desc: '데이터허브 3+ 보유', bonus: { assetBonus: 10, data: 5 } },
  { id: 'B-P04', role: 'bloc', diff: 'easy', name: '뉴스 조작',      desc: '호재 뉴스 3+ 공개', bonus: { assetBonus: 10 } },
  { id: 'B-S02', role: 'bloc', diff: 'med',  name: '그림자 군단',    desc: 'Ghost 3+ 계약', bonus: { assetBonus: 15, rep: 10 } },
  { id: 'G-I01', role: 'ghost',diff: 'easy', name: '은둔자',         desc: '현상수배 0 유지', bonus: { repBonus: 5 } },
  { id: 'G-K04', role: 'ghost',diff: 'easy', name: '거리의 후원자',  desc: '타 Ghost 자원 10+ 전달', bonus: { repBonus: 5 } },
  { id: 'G-R04', role: 'ghost',diff: 'easy', name: '소각',           desc: '[LOSS] 5+ 사용', bonus: { repBonus: 5 } },
  { id: 'G-A02', role: 'ghost',diff: 'med',  name: '블랙마켓 왕',    desc: '블랙마켓 5+ 구매', bonus: { repBonus: 10 } },
  { id: 'G-K01', role: 'ghost',diff: 'med',  name: '구출자',         desc: 'NPC 5+ 구출', bonus: { repBonus: 10, influence: 3 } },
];

// Single-game achievements (10 simplified for MVP — claim buttons)
const ACHIEVEMENTS_IN = [
  { id: 'I-B01', tier: 'bronze', name: '첫 발',          cond: '첫 공격·레이드·M&A 첫 번째', reward: { res: 3 } },
  { id: 'I-B03', tier: 'bronze', name: '수집가',         cond: '구역 5곳 방문', reward: { parts: 3 } },
  { id: 'I-B05', tier: 'bronze', name: '조각 모으기',     cond: '4종+ 속성 동시 보유', reward: { attr: 2 } },
  { id: 'I-B10', tier: 'bronze', name: '데이터 주니어',   cond: '데이터 누적 10', reward: { data: 3 } },
  { id: 'I-B20', tier: 'bronze', name: '끝까지',         cond: '10R 이상 생존/참여', reward: { rep: 2 } },
  { id: 'I-S07', tier: 'silver', name: '속성 절정',       cond: 'Surging 3R 유지', reward: { attr: 5 } },
  { id: 'I-S09', tier: 'silver', name: 'NPC 구출자',     cond: 'NPC 3명 구출', reward: { rep: 5, contact: 3 } },
  { id: 'I-S10', tier: 'silver', name: '테크 우위',       cond: 'TL 3 도달', reward: { res: 5 } },
  { id: 'I-G01', tier: 'gold',   name: '무전투 승리',     cond: '공격 카드 0회 + 승리', reward: { rep: 10, meta: 'BLOODLESS' } },
  { id: 'I-G02', tier: 'gold',   name: '넥서스 그림자',   cond: 'NEXUS 1R+ 장악 + 승리', reward: { res: 10, meta: 'NEXUS_TOUCHED' } },
];

const PHASE_NAMES = ['시장', '뉴스', '계획', '실행', '수익', 'R&D', '결산'];
const PHASE_EN = ['MARKET', 'NEWS', 'PLAN', 'EXECUTE', 'INCOME', 'R&D', 'ROUND'];

// ============================================================================
// UTILITIES
// ============================================================================

const d6 = () => Math.floor(Math.random() * 6) + 1;
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[r[i], r[j]] = [r[j], r[i]]; } return r; };

const rollSignalDie = () => {
  const r = d6();
  if (r <= 2) return 'MESH_UP';
  if (r <= 4) return 'MESH_DOWN';
  if (r === 5) return 'SURGE';
  return 'BLACKOUT';
};

const getCard = (id) => GHOST_CARDS[id] || BLOC_CARDS[id];

// ============================================================================
// 캐릭터 상성 시스템 (v0.5.13)
// ============================================================================
// Ghost vs Ghost: 6-방향 사이클 (카운터 시 +2 atk)
//   BLADE → CIPHER → MOLE → BROKER → DRIFTER → RIGGER → BLADE
// 해석:
//   BLADE(물리) > CIPHER(해커)      : 물리력이 원격 해킹 압도
//   CIPHER(정보) > MOLE(침투)       : 해킹으로 내부자 탐지
//   MOLE(내부자) > BROKER(중개)     : 위장이 협상 테이블 엎어놓음
//   BROKER(협상) > DRIFTER(기동)    : 교섭으로 이동 경로 봉쇄
//   DRIFTER(기동) > RIGGER(기술)    : 기동성이 느린 기술자 농락
//   RIGGER(기술) > BLADE(물리)      : 드론·함정이 단독 전투원 무력화
const GHOST_COUNTERS = {
  BLADE:   { beats: 'CIPHER',  bloc: 'IRONWALL' },  // 물리 대 물리 공방
  CIPHER:  { beats: 'MOLE',    bloc: 'VANTA' },     // 정보 대 정보
  BROKER:  { beats: 'DRIFTER', bloc: 'CARBON' },    // 중개 대 자원 독점
  MOLE:    { beats: 'BROKER',  bloc: 'HELIX' },     // 잠입 대 생체
  DRIFTER: { beats: 'RIGGER',  bloc: 'AXIOM' },     // 기동 대 AI 예측
  RIGGER:  { beats: 'BLADE',   bloc: 'CARBON' },    // 기술 대 인프라 (CARBON 공동 타겟)
};

const countersGhost = (attacker, defender) => GHOST_COUNTERS[attacker]?.beats === defender;
const countersBloc  = (ghost, bloc) => GHOST_COUNTERS[ghost]?.bloc === bloc;

// ============================================================================
// 레이드 풀세트 시스템 (v0.5.22)
// ============================================================================
const RAID_TYPES = {
  violent: {
    name: '폭력형', icon: '🗡',
    desc: '정면 돌격. 큰 보상, 큰 위험',
    useStat: 'atk',
    threshold: 5,
    success: { rep: 4, stockHit: 3, wanted: 2, heat: 1 },
    failure: { hp: 2, wanted: 1, heat: 1 },
  },
  stealth: {
    name: '은밀형', icon: '🕶',
    desc: '조용히 털기. 보상 낮지만 안전',
    useStat: 'spd',
    threshold: 5,
    success: { rep: 2, stockHit: 2, wanted: 0, heat: 0 },
    failure: { hp: 0, wanted: 1, heat: 0 },
  },
  hack: {
    name: '해킹형', icon: '💾',
    desc: '원격 타격. 경제 큰 타격, HP 안전',
    useStat: 'hack',
    threshold: 5,
    success: { rep: 2, stockHit: 4, wanted: 1, heat: 0, data: 2 },
    failure: { hp: 0, wanted: 0, heat: 2, data: -1 },
  },
  infiltrate: {
    name: '잠입형', icon: '🕷',
    desc: 'MOLE 전용. 방어 완전 무시. 정보 탈취',
    useStat: 'hack',
    threshold: 3,        // v0.5.24: 4→3 (거의 자동)
    success: { rep: 4, stockHit: 2, wanted: 0, heat: 0, data: 3 },  // rep 3→4
    failure: { hp: 1, wanted: 1, heat: 0 },
    bypass_defense: true,
    requiresClass: 'MOLE',
  },
  negotiate: {
    name: '협상형', icon: '🤝',
    desc: 'BROKER 전용. 크레딧 지불로 안전 합의',
    useStat: 'spd',
    threshold: 2,        // v0.5.24: 3→2 (사실상 자동)
    cost: { credit: 4 }, // 5→4
    success: { rep: 4, stockHit: 1, wanted: 0, heat: -1, influence: 2 },  // rep 3→4, inf+2
    failure: { hp: 0, wanted: 0, heat: 0 },
    requiresClass: 'BROKER',
  },
};

// 구역 타입별 추가 전리품 (성공 시 합산)
const ZONE_LOOT = {
  bank:  { credit: 5, label: '₵+5' },
  data:  { data: 3, peek_news: 1, label: '데이터+3 · 뉴스 미리보기' },
  arms:  { weapons: 3, label: '🔩+3' },
  work:  { parts: 3, label: '⚙+3' },
  heal:  { full_heal: 1, label: 'HP 완전 회복' },
  club:  { credit: 3, influence: 1, label: '₵+3 · 🎙+1' },
  home:  { credit: 2, parts: 1, label: '₵+2 · ⚙+1' },
  aux:   { credit: 2, all_attr: 1, label: '₵+2 · 전속성+1' },
  nex:   { rep: 3, all_attr: 1, label: '★+3 추가 · 전속성+1' },
  port:  { weapons: 2, credit: 2, label: '🔩+2 · ₵+2' },
  ruin:  { parts: 5, label: '⚙+5 (잡동사니 탈취)' },
  cop:   { wanted: -2, label: '수배-2 (압수 기록 훔침)' },
};

// Bloc별 자동 반격 (구역 방어 시 자동 소비)
const BLOC_DEFENSE = {
  VANTA:    { detect: 1 },        // 감지 → 접근 판정에 -2
  IRONWALL: { threshold_plus: 1 }, // 무장 → 실행 threshold +1 (완화 v0.5.22)
  HELIX:    { threshold_plus: 0 }, // 거의 없음
  AXIOM:    { all_plus: 1 },       // AI 보조 → 판정 -1 (약간)
  CARBON:   { threshold_plus: 0 }, // 방어 없음
};

// ============================================================================
// 맵 크기별 특수 규칙 (v0.5.13)
// ============================================================================
// 5×5 튜토리얼: 좁은 맵 → 이동 가치 상향 / DRIFTER HP·ATK 보정 (이미 적용)
// 11×11 표준: 이동 가치 정상 / DRIFTER 원래 스탯 복원 / 추가 공권력 감쇠
// 13×13 확장: 하이웨이 강화 / M&A 빈도 증가
const MAP_RULES = {
  '5x5': {
    roundLimit: 10,
    moveMultiplier: 1.0,      // 이동 카드 기본 효율
    driftAtkOverride: 2,       // DRIFTER atk (튜토리얼)
    driftHpOverride: 8,
    assetGoal: 50,
    repGoal: { battle: 14, repOnly: 20 },
    raidGoal: 2,
  },
  '11x11': {
    roundLimit: 12,
    moveMultiplier: 1.0,
    driftAtkOverride: 4,       // DRIFTER 원래 스탯 (넓은 맵에서 이동 가치 정상)
    driftHpOverride: 9,
    assetGoal: 60,
    repGoal: { battle: 30, repOnly: 40 },
    raidGoal: 2,
  },
};
const getMapRules = (mapSize) => MAP_RULES[mapSize] || MAP_RULES['5x5'];

// TL 승급 비용: v0.5.21 — 전 레벨 5pt 균일 (1칸=1pt 직관 보장)
const tlCostFor = (curTl) => {
  if (curTl >= 5) return 99;
  return 5;
};

// ============================================================================
// 게임 히스토리 (LocalStorage) — 브라우저 로컬에만 저장, 서버 전송 없음
// ============================================================================
const HISTORY_KEY = 'dn_sim_history_v053';
const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const saveGameRecord = (rec) => {
  try {
    const h = loadHistory();
    h.unshift(rec);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));  // 최근 50판만
  } catch (e) { console.warn('history save failed', e); }
};
const clearHistory = () => {
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
};
const buildGameRecord = (state) => {
  const me = state.players[0];
  const iWon = state.meta.winner === 0;
  return {
    ts: Date.now(),
    round: state.meta.round,
    role: me.role,
    specific: me.specific,
    won: iWon,
    winner: state.meta.winner,
    winnerSpecific: state.meta.winner != null ? state.players[state.meta.winner]?.specific : null,
    reason: state.meta.winReason,
    hp: me.hp,
    rep: me.resources.rep,
    asset: assetValue(me, state.stocks, state),
    raids: state.meta.raidsThisGame?.[0] || 0,
    tl: me.tl,
    achievements: me.achievements.length,
    zones: Object.values(state.map).filter(c => c.owner === 0).length,
  };
};
const formatHistoryTime = (ts) => {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const coord = (col, row) => String.fromCharCode(65 + col) + (row + 1);
const coordsAdj = (c) => {
  const col = c.charCodeAt(0) - 65;
  const row = parseInt(c.slice(1)) - 1;
  return [
    col > 0     ? coord(col - 1, row) : null,
    col < 4     ? coord(col + 1, row) : null,
    row > 0     ? coord(col, row - 1) : null,
    row < 4     ? coord(col, row + 1) : null,
  ].filter(Boolean);
};

// 자기 블록 주식: 통제권 표시, 자산 X
// 자산 = Σ(타 블록 주식 × 주가) + 구역 수 × 5
// 크레딧은 유동 자원이라 자본에 안 넣음 (자산 인플레 방지)
const assetValue = (p, stocks, state) => {
  // v0.5.16: Bloc 경제 개선
  // - 구역 가치 5 → 7 (구역 확장 가속)
  // - 크레딧 1/3 반영 (현금 보유도 자산의 일부, 단 유동성 할인)
  // - 무기/부품/데이터도 소액 자산화 (각 1pt)
  let total = 0;
  for (const [bl, qty] of Object.entries(p.stocks)) {
    const isOwn = p.role === 'bloc' && p.specific === bl;
    if (isOwn) continue;
    const price = stocks[bl] ?? 10;
    total += qty * price;
  }
  if (state?.map) {
    const zonesOwned = Object.values(state.map).filter(c => c.owner === p.id).length;
    total += zonesOwned * 5;
  }
  // v0.5.16 결론: 자산 구성은 순수하게 (타 블록 주식 + 구역)만 유지.
  // Bloc/Ghost P0 격차는 assetGoal 이 아닌 Ghost 승리 루트 수 문제.
  return Math.floor(total);
};

// Resource init
const initResources = (role) => role === 'bloc'
  ? { credit: 8, data: 2, influence: 3, weapons: 0, parts: 0, rep: 0 }
  : { credit: 5, data: 0, influence: 0, weapons: 0, parts: 0, rep: 5 };

// Initial stocks for bloc player
const initStocks = (role, specific) => {
  const base = { VANTA: 0, IRONWALL: 0, HELIX: 0, AXIOM: 0, CARBON: 0 };
  if (role === 'bloc') base[specific] = 10;
  return base;
};

// ============================================================================
// GAME STATE + REDUCER
// ============================================================================

function initGame(humanRole, humanSpecific) {
  // Build 5x5 map
  const map = {};
  MAP_5x5.forEach(([c, z]) => {
    map[c] = { zone: z, owner: null, token: Math.random() < 0.6 ? 'quest' : (Math.random() < 0.5 ? 'instant' : 'discovery'), tokenRevealed: false };
  });

  // Build players: 1 human + 3 bots
  const players = [];
  const allBlocs = ['VANTA', 'IRONWALL', 'HELIX', 'AXIOM', 'CARBON'];
  const allGhosts = ['CIPHER', 'BLADE', 'BROKER', 'RIGGER', 'DRIFTER', 'MOLE'];

  // Human first
  players.push(buildPlayer(0, 'human', humanRole, humanSpecific));

  // 3 bots: mixed roles opposite of human
  const botSpecs = [];
  if (humanRole === 'bloc') {
    // 2 Ghost bots + 1 Bloc bot
    botSpecs.push({ role: 'ghost', sp: rand(allGhosts.filter(g => g !== humanSpecific)) });
    botSpecs.push({ role: 'ghost', sp: rand(allGhosts) });
    const remaining = allBlocs.filter(b => b !== humanSpecific);
    botSpecs.push({ role: 'bloc', sp: rand(remaining) });
  } else {
    // 2 Bloc bots + 1 Ghost bot
    botSpecs.push({ role: 'bloc', sp: rand(allBlocs) });
    botSpecs.push({ role: 'bloc', sp: rand(allBlocs.filter(b => b !== botSpecs[0].sp)) });
    botSpecs.push({ role: 'ghost', sp: rand(allGhosts.filter(g => g !== humanSpecific)) });
  }
  botSpecs.forEach((bs, i) => players.push(buildPlayer(i + 1, 'bot', bs.role, bs.sp)));

  // Set bloc HQ zones as owned
  players.forEach(p => {
    if (p.role === 'bloc') {
      const setup = BLOC_SETUP[p.specific];
      map[setup.hq].owner = p.id;
      setup.support.forEach(s => { map[s].owner = p.id; });
      p.position = setup.hq;
    } else {
      p.position = GHOST_STATS[p.specific].startZone;
    }
  });

  // Deal objectives
  const objBloc = shuffle(OBJECTIVES.filter(o => o.role === 'bloc'));
  const objGhost = shuffle(OBJECTIVES.filter(o => o.role === 'ghost'));
  let bi = 0, gi = 0;
  players.forEach(p => {
    if (p.role === 'bloc') {
      p.objectives = [objBloc[bi++ % objBloc.length], objBloc[bi++ % objBloc.length]];
    } else {
      p.objectives = [objGhost[gi++ % objGhost.length], objGhost[gi++ % objGhost.length]];
    }
  });

  return {
    meta: {
      scenario: 'S01',
      mapSize: '5x5',
      round: 1,
      phase: 0,
      currentPlayer: 0,
      humanPlayer: 0,
      turnInit: null,
      gameOver: false,
      winner: null,
      winReason: null,
      newsSinceStart: 0,
      raidsThisGame: { 0:0, 1:0, 2:0, 3:0 },
      zonesVisited: { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() },
      attacksUsed: { 0:0, 1:0, 2:0, 3:0 },
      lostCardsUsed: { 0:0, 1:0, 2:0, 3:0 },
      nexusHolder: null,
      nexusStreak: 0,
      claimedAchievements: {},  // id => playerIdx
      pendingMoveTarget: null,   // 사용자가 지도에서 찍은 목표 좌표 (Ghost/Bloc 둘 다)
      awaitingMoveTarget: false, // true면 UI에서 목표 클릭 대기
      moveBudget: 0,             // 이번 턴 총 이동 칸 수 (BFS 반경)
      turnSnapshot: null,        // 턴 전 상태 스냅샷 (변화 요약용)
      turnDiff: null,            // 턴 후 계산된 변화 요약
      zoneBonusPending: null,    // { zone: 'home', coord: 'B3', options: [{...},{...},{...}] }
      visitedBonusZones: {},     // { playerIdx: { coord: true } } — 보너스를 이미 받은 구역
      pendingRaid: null,         // { coord, bloc, zoneNm, atk, threshold } — 사용자 레이드 결정 대기
      chosenTargets: [],         // [ { cardIdx, half, targetPlayerIdx } ] — 사용자가 지정한 공격 타겟들
      pendingTargetSelect: null, // { cardId, half, effectKey, candidates, cardIdx } — UI가 타겟 고를 수 있게
      pendingGhostDuel: null,    // { coord, atkGhostIdx, defGhostIdx } — Ghost PvP 결정 대기
      lastTargetedBy: null,      // { attacker, effectKey, detail } — 봇이 P0 타겟했을 때 표시
      attackBonusOnce: 0,        // 일회성 공격 판정 보너스
      peekNews: 0,               // 남은 peek 카운트 (cop/data 보너스)
      mapReveal: 0,              // 남은 전체 지도 노출 라운드
      moveBonusNext: 0,          // 다음 턴 이동 보너스 (port 보너스)
      atkBonusOnce: 0,           // 일회성 공격 판정 보너스 (arms 보너스)
    },
    players,
    map,
    pool: { M: 0, I: 0, V: 0, S: 0, B: 0, A: 0, GRID: 0 },
    stocks: { VANTA: 8, IRONWALL: 8, HELIX: 8, AXIOM: 8, CARBON: 8 },
    heat: 5,
    signalDie: rollSignalDie(),
    currentNews: null,
    log: [{ round: 0, phase: 0, message: '🎮 게임 시작. 튜토리얼 5×5 · 시나리오 S01' }],
  };
}

function buildPlayer(id, kind, role, specific) {
  const deck = role === 'bloc' ? BLOC_DECKS[specific] : GHOST_DECKS[specific];
  const stats = role === 'bloc' ? BLOC_STATS[specific] : GHOST_STATS[specific];
  return {
    id, kind, role, specific,
    hp: stats.hp,
    maxHp: stats.hp,
    stats,
    resources: initResources(role),
    stocks: initStocks(role, specific),
    deck: shuffle(deck),
    hand: [],
    discard: [],
    lost: [],
    contracts: [],
    wanted: 0,
    tl: 1,
    tlProgress: 0,
    position: null,
    zonesOwned: [],
    pool: { M: 0, I: 0, V: 0, S: 0, B: 0, A: 0, GRID: 0 },  // 개인 속성 풀
    objectives: [],
    achievements: [],
    defeated: false,
    plannedCards: [],  // for phase 3->4
    plannedHalves: [], // top/bot 또는 main/side — 각 카드의 어느 반쪽을 쓸지
  };
}

// Reducer actions
function reducer(state, action) {
  switch (action.type) {
    case 'DRAW_INITIAL': {
      // Draw hand size depending on role
      const ps = state.players.map(p => {
        const handSize = 6;
        const newHand = p.deck.slice(0, handSize);
        const newDeck = p.deck.slice(handSize);
        return { ...p, hand: newHand, deck: newDeck };
      });
      return { ...state, players: ps };
    }

    case 'LOG':
      return { ...state, log: [...state.log, { round: state.meta.round, phase: state.meta.phase, message: action.msg }].slice(-150) };

    case 'SET_PHASE':
      return { ...state, meta: { ...state.meta, phase: action.phase } };

    case 'REQUEST_MOVE_TARGET':
      return { ...state, meta: { ...state.meta, awaitingMoveTarget: true, moveBudget: action.budget || 0, pendingMoveTarget: null } };

    case 'SET_MOVE_TARGET':
      return { ...state, meta: { ...state.meta, awaitingMoveTarget: false, pendingMoveTarget: action.coord } };

    case 'CLEAR_MOVE_TARGET':
      return { ...state, meta: { ...state.meta, awaitingMoveTarget: false, pendingMoveTarget: null, moveBudget: 0 } };

    case 'APPLY_ZONE_BONUS': {
      // action.opt: 선택된 옵션 객체 {k, v, label}
      const pending = state.meta.zoneBonusPending;
      if (!pending) return state;
      const opt = action.opt;
      let s = { ...state };
      const me = s.players[0];
      let res = { ...me.resources };
      let pool = { ...(me.pool || {}) };
      let hp = me.hp;
      let maxHp = me.maxHp;
      let wanted = me.wanted || 0;
      let heat = s.heat;
      let metaPatch = {};
      const logLines = [];
      switch (opt.k) {
        case 'credit': res.credit = (res.credit || 0) + opt.v; logLines.push(`₵ +${opt.v}`); break;
        case 'data': res.data = (res.data || 0) + opt.v; logLines.push(`📡 데이터 +${opt.v}`); break;
        case 'weapons': res.weapons = (res.weapons || 0) + opt.v; logLines.push(`🔩 무기 +${opt.v}`); break;
        case 'parts': res.parts = (res.parts || 0) + opt.v; logLines.push(`⚙️ 부품 +${opt.v}`); break;
        case 'influence': res.influence = (res.influence || 0) + opt.v; logLines.push(`🎙 인플루언스 +${opt.v}`); break;
        case 'rep': res.rep = (res.rep || 0) + opt.v; logLines.push(`★ 렙 +${opt.v}`); break;
        case 'heal': hp = Math.min(maxHp, hp + opt.v); logLines.push(`❤️ HP +${opt.v} (→${hp})`); break;
        case 'full_heal': hp = maxHp; logLines.push(`❤️❤️ HP 완전 회복 (→${hp})`); break;
        case 'wanted': wanted = Math.max(0, wanted + opt.v); logLines.push(`🚨 현상수배 ${opt.v > 0 ? '+' : ''}${opt.v} (→${wanted})`); break;
        case 'heat_down': heat = Math.max(0, heat - opt.v); logLines.push(`🔥 공권력 -${opt.v} (→${heat})`); break;
        case 'gen': pool[opt.v] = (pool[opt.v] || 0) + 1; logLines.push(`◈${opt.v} +1 (개인 풀)`); break;
        case 'all_attr':
          ['M','I','V','S','B','A'].forEach(a => { pool[a] = (pool[a] || 0) + opt.v; });
          logLines.push(`◈ 전속성 +${opt.v}`);
          break;
        case 'random_attr': {
          const pick = rand(['M','I','V','S','B','A']);
          pool[pick] = (pool[pick] || 0) + opt.v;
          logLines.push(`◈${pick} +${opt.v} (랜덤)`);
          break;
        }
        case 'draw': {
          const deck = [...(me.deck || [])];
          const handAdd = deck.splice(0, opt.v);
          const newHand = [...(me.hand || []), ...handAdd];
          // 플레이어에 반영 예약 (아래에서 한 번에 저장)
          metaPatch._drawNew = { deck, hand: newHand };
          logLines.push(`🂠 카드 ${handAdd.length}장 드로우`);
          break;
        }
        case 'stock_buy': {
          // 임의 선택 불가라 랜덤 블록 1주 할인 매수
          const blocs = Object.keys(s.stocks);
          const pick = rand(blocs);
          const cost = Math.max(1, s.stocks[pick] - opt.v);
          if (res.credit >= cost) {
            res.credit -= cost;
            const newStocks = { ...me.stocks, [pick]: (me.stocks[pick] || 0) + 1 };
            metaPatch._stocksNew = newStocks;
            logLines.push(`📈 ${pick} 주식 1주 매수 (₵${cost})`);
          } else {
            logLines.push(`📈 주식 할인 매수 — ₵부족 (필요 ${cost})`);
          }
          break;
        }
        case 'peek_news':
          metaPatch.peekNews = (s.meta.peekNews || 0) + opt.v;
          logLines.push(`👁 다음 뉴스 ${opt.v}장 미리보기 적립`);
          break;
        case 'info':
          metaPatch.mapReveal = (s.meta.mapReveal || 0) + 3;
          logLines.push(`👁 지도 3R 노출`);
          break;
        case 'move_bonus':
          metaPatch.moveBonusNext = (s.meta.moveBonusNext || 0) + opt.v;
          logLines.push(`🚶 다음 턴 이동 +${opt.v}`);
          break;
        case 'atk_boost':
          metaPatch.atkBonusOnce = (s.meta.atkBonusOnce || 0) + opt.v;
          logLines.push(`💥 다음 판정 +${opt.v} (일회성)`);
          break;
        default:
          logLines.push(`(${opt.k} 미구현)`);
      }
      // 플레이어 상태 병합
      let ps = [...s.players];
      const p0Next = {
        ...me,
        resources: res,
        pool,
        hp,
        wanted,
      };
      if (metaPatch._drawNew) {
        p0Next.deck = metaPatch._drawNew.deck;
        p0Next.hand = metaPatch._drawNew.hand;
        delete metaPatch._drawNew;
      }
      if (metaPatch._stocksNew) {
        p0Next.stocks = metaPatch._stocksNew;
        delete metaPatch._stocksNew;
      }
      ps[0] = p0Next;
      const meta2 = { ...s.meta, zoneBonusPending: null, ...metaPatch };
      s = { ...s, players: ps, heat, meta: meta2 };
      s = logEntry(s, `⭐ 당신 🌟 ${pending.coord} 보너스 획득 · ${opt.label}${logLines.length > 1 ? ` [${logLines.join(', ')}]` : ''}`);
      return s;
    }

    case 'SKIP_ZONE_BONUS':
      return { ...state, meta: { ...state.meta, zoneBonusPending: null } };

    case 'RAID_SELECT_TYPE': {
      const pr = state.meta.pendingRaid;
      if (!pr) return state;
      return { ...state, meta: { ...state.meta, pendingRaid: { ...pr, selectedType: action.raidType, phase: 'invest' } } };
    }

    case 'RAID_INVEST': {
      // action.item: 'weapons' | 'data' | 'poolAttr' (with action.attr for pool)
      const pr = state.meta.pendingRaid;
      if (!pr) return state;
      const me = state.players[0];
      const inv = { ...pr.invested };
      if (action.item === 'weapons' && (me.resources.weapons || 0) > inv.weapons) {
        inv.weapons++;
      } else if (action.item === 'data' && (me.resources.data || 0) > inv.data) {
        inv.data++;
      } else if (action.item === 'poolAttr' && action.attr) {
        if ((me.pool?.[action.attr] || 0) > 0 && !inv.poolAttr) {
          inv.poolAttr = action.attr;
        }
      } else if (action.item === 'unset_pool') {
        inv.poolAttr = null;
      } else if (action.item === 'reset') {
        inv.weapons = 0; inv.data = 0; inv.poolAttr = null;
      }
      return { ...state, meta: { ...state.meta, pendingRaid: { ...pr, invested: inv } } };
    }

    case 'RAID_EXECUTE': {
      const pr = state.meta.pendingRaid;
      if (!pr || !pr.selectedType) return state;
      let s = { ...state };
      const me = s.players[0];
      const rtype = RAID_TYPES[pr.selectedType];
      const zoneLoot = ZONE_LOOT[pr.zoneType] || {};
      const bloc = pr.bloc;
      const counterBonus = countersBloc(me.specific, bloc) ? 1 : 0;

      // 투자 자원 소비
      const inv = pr.invested;
      const newRes = { ...me.resources };
      if (inv.weapons > 0) newRes.weapons = Math.max(0, (newRes.weapons || 0) - inv.weapons);
      if (inv.data > 0) newRes.data = Math.max(0, (newRes.data || 0) - inv.data);
      const newPool = { ...(me.pool || {}) };
      if (inv.poolAttr) newPool[inv.poolAttr] = Math.max(0, (newPool[inv.poolAttr] || 0) - 1);

      // 레이드 타입별 비용 선지불 (협상형 등)
      if (rtype.cost) {
        if (rtype.cost.credit && (newRes.credit || 0) >= rtype.cost.credit) {
          newRes.credit -= rtype.cost.credit;
        } else {
          // 비용 부족 시 실패 처리
          s = logEntry(s, `⭐ 당신 ${rtype.icon} ${rtype.name} 실패 (비용 ₵${rtype.cost.credit} 부족)`);
          return { ...s, meta: { ...s.meta, pendingRaid: null } };
        }
      }

      // Bloc 자동 반격 (잠입형은 bypass)
      const defense = rtype.bypass_defense ? {} : (BLOC_DEFENSE[bloc] || {});
      let thresholdMod = 0;
      let approachMod = 0;
      let executeMod = 0;
      let escapeMod = 0;
      const defenseLogs = [];
      if (rtype.bypass_defense) defenseLogs.push('🕷 방어 우회');
      if (defense.threshold_plus) { thresholdMod += defense.threshold_plus; defenseLogs.push(`${bloc} 방어 +${defense.threshold_plus} threshold`); }
      if (defense.detect) { approachMod -= 2; defenseLogs.push(`${bloc} 센서 감지 (접근 -2)`); }
      if (defense.all_plus) { approachMod += 0 - defense.all_plus; executeMod -= defense.all_plus; escapeMod -= defense.all_plus; defenseLogs.push(`${bloc} AI 보조 (전 판정 ${-defense.all_plus})`); }
      if (pr.fortified > 0 && !rtype.bypass_defense) { thresholdMod += pr.fortified; defenseLogs.push(`요새화 +${pr.fortified}`); }

      const finalThreshold = rtype.threshold + thresholdMod;

      // 투자 보너스
      const zoneAttr = ZONE_TYPES[pr.zoneType]?.attr;
      const poolBonus = inv.poolAttr === zoneAttr ? 2 : (inv.poolAttr ? 1 : 0);
      const execBonus = inv.weapons + counterBonus + executeMod;
      const approachBonus = inv.data + approachMod;
      const escapeBonus = escapeMod;

      // === 3단계 판정 ===
      // 1. Approach (접근) — d6 + SHADE 속성 투자 (data) vs 4
      const approachRoll = d6();
      const approachTotal = approachRoll + approachBonus + (inv.poolAttr === 'S' ? 2 : 0);
      const approachOK = approachTotal >= 4;

      // 2. Execute (실행) — d6 + 선택한 스탯 + 투자 + 상성 vs threshold
      const execRoll = d6();
      const statVal = me.stats[rtype.useStat] || 0;
      const execTotal = execRoll + statVal + execBonus + poolBonus + (approachOK ? 0 : -2);
      const execOK = execTotal >= finalThreshold;

      // 3. Escape (도주) — d6 + SPD vs 3
      const escapeRoll = d6();
      const escapeTotal = escapeRoll + me.stats.spd + escapeBonus;
      const escapeOK = escapeTotal >= 3;

      // 결과 적용
      const cell = s.map[pr.coord];
      let rewards = rtype.success;
      let outcome = 'success';
      if (!execOK) {
        rewards = rtype.failure;
        outcome = 'failure';
      }

      const ps = [...s.players];
      let updatedP = { ...me, resources: newRes, pool: newPool };

      // 보상/페널티 적용
      if (outcome === 'success') {
        updatedP.resources.rep = (updatedP.resources.rep || 0) + (rewards.rep || 0);
        if (rewards.data) updatedP.resources.data = (updatedP.resources.data || 0) + rewards.data;
        updatedP.wanted = (updatedP.wanted || 0) + (rewards.wanted || 0);
        // 구역 차등 전리품
        if (zoneLoot.credit) updatedP.resources.credit = (updatedP.resources.credit || 0) + zoneLoot.credit;
        if (zoneLoot.data) updatedP.resources.data = (updatedP.resources.data || 0) + zoneLoot.data;
        if (zoneLoot.weapons) updatedP.resources.weapons = (updatedP.resources.weapons || 0) + zoneLoot.weapons;
        if (zoneLoot.parts) updatedP.resources.parts = (updatedP.resources.parts || 0) + zoneLoot.parts;
        if (zoneLoot.influence) updatedP.resources.influence = (updatedP.resources.influence || 0) + zoneLoot.influence;
        if (zoneLoot.rep) updatedP.resources.rep += zoneLoot.rep;
        if (zoneLoot.wanted) updatedP.wanted = Math.max(0, (updatedP.wanted || 0) + zoneLoot.wanted);
        if (zoneLoot.full_heal) updatedP.hp = updatedP.maxHp;
        if (zoneLoot.all_attr) ['M','I','V','S','B','A'].forEach(a => { updatedP.pool[a] = (updatedP.pool[a] || 0) + 1; });
        if (zoneLoot.peek_news) s = { ...s, meta: { ...s.meta, peekNews: (s.meta.peekNews || 0) + 1 } };
      } else {
        updatedP.hp = Math.max(0, updatedP.hp - (rewards.hp || 0));
        updatedP.wanted = (updatedP.wanted || 0) + (rewards.wanted || 0);
        if (rewards.data) updatedP.resources.data = Math.max(0, (updatedP.resources.data || 0) + rewards.data);
      }

      // Escape 실패 추가 페널티
      if (!escapeOK && outcome === 'success') {
        updatedP.wanted = (updatedP.wanted || 0) + 1;
      }

      // 맵/주식 업데이트 (성공 시)
      let newMap = s.map;
      let newStocks = s.stocks;
      if (outcome === 'success') {
        newMap = { ...s.map, [pr.coord]: { ...cell, owner: null, fortified: 0 } };
        newStocks = { ...s.stocks, [bloc]: Math.max(1, s.stocks[bloc] - (rewards.stockHit || 0)) };
      }

      ps[0] = updatedP;
      const newHeat = Math.min(10, Math.max(0, s.heat + (rewards.heat || 0)));
      s = { ...s, players: ps, map: newMap, stocks: newStocks, heat: newHeat };

      // 레이드 카운트 증가 (성공만)
      if (outcome === 'success') {
        s.meta = { ...s.meta, raidsThisGame: { ...s.meta.raidsThisGame, 0: (s.meta.raidsThisGame[0] || 0) + 1 } };
      }

      // 결과 상세 로그
      const cbStr = counterBonus > 0 ? ` +상성${counterBonus}` : '';
      const invStr = [
        inv.weapons ? `🔩×${inv.weapons}` : null,
        inv.data ? `📡×${inv.data}` : null,
        inv.poolAttr ? `◈${inv.poolAttr}${poolBonus>1?'(매치+2)':'+1'}` : null,
      ].filter(Boolean).join(' ');
      const defStr = defenseLogs.length > 0 ? ` | 🛡 ${defenseLogs.join(', ')}` : '';
      const rtn = rtype.name;
      s = logEntry(s, `⭐ 당신 ${rtype.icon} ${rtn} 레이드 [${pr.coord} ${pr.zoneNm}] — ${pr.bloc}${defStr}`);
      if (invStr) s = logEntry(s, `  투자: ${invStr}`);
      s = logEntry(s, `  🎲 접근 ${approachRoll}+${approachBonus}=${approachTotal} ${approachOK ? '✓' : '✗(실행-2)'} · 실행 ${execRoll}+${statVal}${cbStr}+${execBonus+poolBonus}=${execTotal} vs ${finalThreshold} ${execOK ? '✓' : '✗'} · 도주 ${escapeRoll}+${me.stats.spd}=${escapeTotal} ${escapeOK ? '✓' : '✗(수배+1)'}`);
      if (outcome === 'success') {
        const lootStr = Object.values(zoneLoot).length > 0 ? ` + ${zoneLoot.label}` : '';
        s = logEntry(s, `  ✅ 성공 · 렙+${rewards.rep} · ${bloc} 주가-${rewards.stockHit} · 중립화${lootStr}`);
      } else {
        s = logEntry(s, `  ❌ 실패 · HP-${rewards.hp || 0} · 수배+${rewards.wanted || 0}`);
      }

      s.meta = { ...s.meta, pendingRaid: null };
      return s;
    }

    case 'RESOLVE_RAID_YES': {
      // 레거시 호환 — 아직 호출되는 코드 있으면 즉시 새 EXECUTE로 위임
      const pr = state.meta.pendingRaid;
      if (!pr) return state;
      let s = { ...state };
      const raidRoll = d6();
      const me = s.players[0];
      // 상성 보너스: Ghost 클래스가 타겟 Bloc 카운터면 atk +1
      const counterBonus = countersBloc(me.specific, pr.bloc) ? 1 : 0;
      const raidTotal = raidRoll + pr.atk + counterBonus;
      const cell = s.map[pr.coord];
      if (raidTotal >= pr.threshold) {
        const newStocks = { ...s.stocks, [pr.bloc]: Math.max(1, s.stocks[pr.bloc] - 3) };
        const ps = [...s.players];
        ps[0] = {
          ...me,
          resources: { ...me.resources, rep: (me.resources.rep || 0) + 3 },
          wanted: (me.wanted || 0) + 1,
        };
        const newMap = { ...s.map, [pr.coord]: { ...cell, owner: null } };
        s = { ...s, players: ps, stocks: newStocks, map: newMap, heat: Math.min(10, s.heat + 1) };
        s.meta = { ...s.meta, pendingRaid: null, raidsThisGame: { ...s.meta.raidsThisGame, 0: (s.meta.raidsThisGame[0] || 0) + 1 } };
        const cbStr = counterBonus > 0 ? ` +상성${counterBonus}` : '';
        s = logEntry(s, `⭐ 당신 🗡️ 레이드 성공! [${pr.coord} ${pr.zoneNm}] 🎲${raidRoll}+${pr.atk}${cbStr}=${raidTotal} ≥ ${pr.threshold} — ${pr.bloc} 주가-3, 중립화, 렙+3 (누적 ${ps[0].resources.rep})`);
      } else {
        const ps = [...s.players];
        ps[0] = {
          ...me,
          hp: Math.max(0, me.hp - 3),
          wanted: (me.wanted || 0) + 1,
        };
        s = { ...s, players: ps, heat: Math.min(10, s.heat + 1), meta: { ...s.meta, pendingRaid: null } };
        s = logEntry(s, `⭐ 당신 ❌ 레이드 실패 [${pr.coord} ${pr.zoneNm}] 🎲${raidRoll}+${pr.atk}=${raidTotal} < ${pr.threshold} — HP-3, 수배+1`);
      }
      return s;
    }

    case 'RESOLVE_RAID_NO': {
      const pr = state.meta.pendingRaid;
      if (!pr) return state;
      let s = { ...state, meta: { ...state.meta, pendingRaid: null } };
      s = logEntry(s, `⭐ 당신 🕶 레이드 포기 [${pr.coord} ${pr.zoneNm}] — 정찰만 하고 물러남`);
      return s;
    }

    case 'RESOLVE_DUEL_YES': {
      const d = state.meta.pendingGhostDuel;
      if (!d) return state;
      let s = { ...state };
      const atkRoll = d6();
      const defRoll = d6();
      const ps = [...s.players];
      const atkP = ps[d.atkGhostIdx];
      const defP = ps[d.defGhostIdx];
      // 상성 보너스: 공격자 → 방어자 카운터 관계면 atk +2
      const counterBonus = countersGhost(atkP.specific, defP.specific) ? 2 : 0;
      const atkTotal = d.atkStat + atkRoll + counterBonus;
      const defTotal = d.defStat + defRoll;
      if (atkTotal >= defTotal + 2) {
        const loot = Math.min(3, defP.resources.credit || 0);
        ps[d.atkGhostIdx] = { ...atkP, resources: { ...atkP.resources, rep: (atkP.resources.rep || 0) + 2, credit: (atkP.resources.credit || 0) + loot } };
        ps[d.defGhostIdx] = { ...defP, resources: { ...defP.resources, credit: Math.max(0, (defP.resources.credit || 0) - loot) }, hp: Math.max(0, defP.hp - 2) };
        s = { ...s, players: ps, meta: { ...s.meta, pendingGhostDuel: null } };
        const cbStr = counterBonus > 0 ? ` +상성${counterBonus}` : '';
        s = logEntry(s, `⭐ 당신 ⚔️ Ghost 결투 승리! → P${d.defGhostIdx} ${defP.specific} | 🎲${atkRoll}+${d.atkStat}${cbStr}=${atkTotal} vs ${defTotal} | 렙+2, ₵+${loot} 탈취`);
      } else if (defTotal >= atkTotal + 2) {
        ps[d.atkGhostIdx] = { ...atkP, hp: Math.max(0, atkP.hp - 2) };
        s = { ...s, players: ps, meta: { ...s.meta, pendingGhostDuel: null } };
        s = logEntry(s, `⭐ 당신 ⚔️ Ghost 결투 반격당함! P${d.defGhostIdx} ${defP.specific} | 🎲${atkTotal} vs ${defTotal} | HP-2`);
      } else {
        s = { ...s, meta: { ...s.meta, pendingGhostDuel: null } };
        s = logEntry(s, `⭐ 당신 ⚔️ Ghost 결투 무승부 P${d.defGhostIdx} | 🎲${atkTotal} vs ${defTotal}`);
      }
      return s;
    }

    case 'RESOLVE_DUEL_NO': {
      const d = state.meta.pendingGhostDuel;
      if (!d) return state;
      let s = { ...state, meta: { ...state.meta, pendingGhostDuel: null } };
      const defP = s.players[d.defGhostIdx];
      s = logEntry(s, `⭐ 당신 🕶 결투 회피 — P${d.defGhostIdx} ${defP.specific}와 잠시 공존`);
      return s;
    }

    case 'DISMISS_TARGETED':
      return { ...state, meta: { ...state.meta, lastTargetedBy: null } };

    case 'BUY_STOCK': {
      // action.playerIdx, action.bloc, action.qty
      const price = state.stocks[action.bloc];
      if (!price) return state;
      const cost = price * action.qty;
      const ps = [...state.players];
      const p = ps[action.playerIdx];
      if ((p.resources.credit || 0) < cost) return state;
      ps[action.playerIdx] = {
        ...p,
        resources: { ...p.resources, credit: p.resources.credit - cost },
        stocks: { ...p.stocks, [action.bloc]: (p.stocks[action.bloc] || 0) + action.qty },
      };
      // Bloc 본인 매수 유동성 부여: 주가 +1 (매수세)
      const newStocks = { ...state.stocks, [action.bloc]: Math.min(20, price + (action.qty >= 3 ? 1 : 0)) };
      const marker = action.playerIdx === 0 ? '⭐ 당신 ' : '';
      return {
        ...state,
        players: ps,
        stocks: newStocks,
        log: [...state.log, { round: state.meta.round, phase: 1, message: `📈 ${marker}P${action.playerIdx} · ${action.bloc} ${action.qty}주 매수 (₵${cost}) — 주가 ${price}${newStocks[action.bloc] !== price ? `→${newStocks[action.bloc]}` : ''}` }].slice(-150),
      };
    }

    case 'SELL_STOCK': {
      const price = state.stocks[action.bloc];
      if (!price) return state;
      const ps = [...state.players];
      const p = ps[action.playerIdx];
      const have = p.stocks[action.bloc] || 0;
      const qty = Math.min(have, action.qty);
      if (qty === 0) return state;
      const earn = price * qty;
      ps[action.playerIdx] = {
        ...p,
        resources: { ...p.resources, credit: (p.resources.credit || 0) + earn },
        stocks: { ...p.stocks, [action.bloc]: have - qty },
      };
      const newStocks = { ...state.stocks, [action.bloc]: Math.max(1, price - (qty >= 3 ? 1 : 0)) };
      const marker = action.playerIdx === 0 ? '⭐ 당신 ' : '';
      return {
        ...state,
        players: ps,
        stocks: newStocks,
        log: [...state.log, { round: state.meta.round, phase: 1, message: `📉 ${marker}P${action.playerIdx} · ${action.bloc} ${qty}주 매도 (₵+${earn}) — 주가 ${price}${newStocks[action.bloc] !== price ? `→${newStocks[action.bloc]}` : ''}` }].slice(-150),
      };
    }

    case 'SHOP_BUY': {
      // 공용 상점 — 누구나 Phase 1에 구매 가능
      // action.playerIdx, action.item
      const items = {
        medical:   { cost: 5, name: '의료 치료',   apply: p => ({ ...p, hp: p.maxHp }) },
        arms:      { cost: 4, name: '무기상',      apply: p => ({ ...p, resources: { ...p.resources, weapons: (p.resources.weapons||0) + 2 } }) },
        info:      { cost: 3, name: '정보상',      apply: p => ({ ...p, resources: { ...p.resources, data: (p.resources.data||0) + 2, rep: (p.resources.rep||0) + 1 } }) },
        bribe:     { cost: 3, name: '뇌물',        apply: p => ({ ...p, wanted: Math.max(0, (p.wanted||0) - 2) }) },
        bounty:    { cost: 4, name: '현상금 청구', apply: p => ({ ...p, resources: { ...p.resources, rep: (p.resources.rep||0) + 2 } }) },
        recruit:   { cost: 6, name: '용병 영입',   apply: p => ({ ...p, resources: { ...p.resources, weapons: (p.resources.weapons||0) + 3, parts: (p.resources.parts||0) + 1 } }) },
      };
      const it = items[action.item];
      if (!it) return state;
      const p = state.players[action.playerIdx];
      if ((p.resources.credit||0) < it.cost) return state;
      const ps = [...state.players];
      let updated = { ...p, resources: { ...p.resources, credit: p.resources.credit - it.cost } };
      updated = it.apply(updated);
      ps[action.playerIdx] = updated;
      let s = { ...state, players: ps };
      if (action.item === 'bribe') s = { ...s, heat: Math.max(0, s.heat - 1) };
      const marker = action.playerIdx === 0 ? '⭐ 당신 ' : '';
      s = logEntry(s, `🏪 ${marker}P${action.playerIdx} · 상점: ${it.name} (₵-${it.cost})`);
      return s;
    }

    case 'BOT_SHOP': {
      // 봇 상점 AI — 상황에 맞게 자동 구매
      let s = { ...state };
      const ps = [...state.players];
      state.players.forEach((p, pi) => {
        if (p.kind !== 'bot' || p.defeated) return;
        const credit = p.resources.credit || 0;
        // 우선순위: HP 낮으면 의료 > 수배 높으면 뇌물 > 무기 부족하면 무기상 > 렙 < 10이면 정보상/현상금
        const actions = [];
        if (p.hp < p.maxHp * 0.5 && credit >= 5) actions.push('medical');
        if ((p.wanted||0) >= 3 && credit >= 3) actions.push('bribe');
        if (p.role === 'ghost' && (p.resources.rep||0) < 12 && credit >= 4) actions.push('bounty');
        if ((p.resources.weapons||0) < 2 && credit >= 4) actions.push('arms');
        if (p.role === 'ghost' && (p.resources.data||0) < 2 && credit >= 3) actions.push('info');
        if (actions.length === 0) return;
        const item = actions[0];
        const items = {
          medical: { cost: 5, apply: pp => ({ ...pp, hp: pp.maxHp }) },
          arms:    { cost: 4, apply: pp => ({ ...pp, resources: { ...pp.resources, weapons: (pp.resources.weapons||0) + 2 } }) },
          info:    { cost: 3, apply: pp => ({ ...pp, resources: { ...pp.resources, data: (pp.resources.data||0) + 2, rep: (pp.resources.rep||0) + 1 } }) },
          bribe:   { cost: 3, apply: pp => ({ ...pp, wanted: Math.max(0, (pp.wanted||0) - 2) }) },
          bounty:  { cost: 4, apply: pp => ({ ...pp, resources: { ...pp.resources, rep: (pp.resources.rep||0) + 2 } }) },
        };
        const it = items[item];
        let upd = { ...p, resources: { ...p.resources, credit: p.resources.credit - it.cost } };
        upd = it.apply(upd);
        ps[pi] = upd;
        s = logEntry({ ...s, players: ps }, `🏪 P${pi} [${p.specific}] · 상점 구매 (${item}, ₵-${it.cost})`);
        if (item === 'bribe') s = { ...s, heat: Math.max(0, s.heat - 1) };
      });
      return s;
    }

    case 'BOT_MARKET': {
      // 봇들 자동 거래 (간단 AI)
      let s = { ...state };
      const ps = [...state.players];
      state.players.forEach((p, pi) => {
        if (p.kind !== 'bot' || p.defeated) return;
        const credit = p.resources.credit || 0;
        const blocs = Object.keys(s.stocks);
        // 주가 낮고 본인 자산에 들어갈 주식 매수 (Bloc은 자사 제외)
        blocs.forEach(bl => {
          if (p.role === 'bloc' && p.specific === bl) return;  // 자사 매수 X
          const price = s.stocks[bl];
          if (price <= 7 && credit >= price * 2 && Math.random() < 0.5) {
            const qty = 2;
            const cost = price * qty;
            ps[pi] = {
              ...ps[pi],
              resources: { ...ps[pi].resources, credit: ps[pi].resources.credit - cost },
              stocks: { ...ps[pi].stocks, [bl]: (ps[pi].stocks[bl] || 0) + qty },
            };
            s = { ...s, stocks: { ...s.stocks, [bl]: Math.min(20, s.stocks[bl] + 1) } };
            s = logEntry(s, `📈 P${pi} [${p.specific}] · ${bl} ${qty}주 매수 (₵${cost}) — 주가 ${price}→${s.stocks[bl]}`);
          }
        });
        // 주가 높은 보유 종목은 매도
        Object.entries(p.stocks).forEach(([bl, qty]) => {
          if (p.role === 'bloc' && p.specific === bl) return;
          const price = s.stocks[bl];
          if (price >= 15 && qty >= 2 && Math.random() < 0.6) {
            const sellQty = Math.min(qty, 2);
            const earn = price * sellQty;
            ps[pi] = {
              ...ps[pi],
              resources: { ...ps[pi].resources, credit: (ps[pi].resources.credit || 0) + earn },
              stocks: { ...ps[pi].stocks, [bl]: qty - sellQty },
            };
            s = { ...s, stocks: { ...s.stocks, [bl]: Math.max(1, s.stocks[bl] - 1) } };
            s = logEntry(s, `📉 P${pi} [${p.specific}] · ${bl} ${sellQty}주 매도 (₵+${earn}) — 주가 ${price}→${s.stocks[bl]}`);
          }
        });
      });
      s = { ...s, players: ps };
      return s;
    }

    case 'SNAPSHOT_TURN': {
      const snap = state.players.map(p => ({
        hp: p.hp,
        rep: p.resources.rep,
        credit: p.resources.credit,
        asset: assetValue(p, state.stocks, state),
        pool: { ...(p.pool || {}) },
        position: p.position,
        zones: Object.values(state.map).filter(c => c.owner === p.id).length,
        wanted: p.wanted || 0,
      }));
      return { ...state, meta: { ...state.meta, turnSnapshot: snap, turnDiff: null } };
    }

    case 'COMPUTE_TURN_DIFF': {
      const prev = state.meta.turnSnapshot;
      if (!prev) return state;
      const diff = state.players.map((p, i) => {
        const o = prev[i] || {};
        return {
          specific: p.specific,
          hp: p.hp - (o.hp ?? p.hp),
          rep: p.resources.rep - (o.rep ?? 0),
          credit: p.resources.credit - (o.credit ?? 0),
          asset: assetValue(p, state.stocks, state) - (o.asset ?? 0),
          zones: Object.values(state.map).filter(c => c.owner === i).length - (o.zones ?? 0),
          wanted: (p.wanted||0) - (o.wanted ?? 0),
          moved: p.position !== o.position ? `${o.position}→${p.position}` : null,
          poolDelta: ['M','I','V','S','B','A','GRID'].map(k => {
            const d = (p.pool?.[k] || 0) - (o.pool?.[k] || 0);
            return d !== 0 ? `${k}${d>0?'+':''}${d}` : null;
          }).filter(Boolean).join(' '),
        };
      });
      return { ...state, meta: { ...state.meta, turnDiff: diff } };
    }

    case 'NEXT_PHASE': {
      const cur = state.meta.phase;
      if (cur < 6) return { ...state, meta: { ...state.meta, phase: cur + 1 } };
      // End of round
      return state;  // handled elsewhere
    }

    case 'NEXT_ROUND': {
      const newRound = state.meta.round + 1;
      if (newRound > 10) {
        return checkVictoryByPoints(state);
      }
      const nd = rollSignalDie();
      // === 손패 리필 + 개인 풀 감쇠 ===
      const refilledPlayers = state.players.map(p => {
        if (p.defeated) return p;
        const handMax = 6;
        const needed = Math.max(0, handMax - p.hand.length);
        let newDeck = [...p.deck];
        let newDiscard = [...p.discard];
        let newHand = [...p.hand];
        for (let i = 0; i < needed; i++) {
          if (newDeck.length === 0) {
            if (newDiscard.length === 0) break;
            newDeck = shuffle(newDiscard);
            newDiscard = [];
          }
          newHand.push(newDeck.shift());
        }
        // 개인 풀 감쇠 (ceil로 시드 보존)
        const decayedPool = {};
        for (const [k, v] of Object.entries(p.pool || {})) decayedPool[k] = Math.ceil(v / 2);
        return { ...p, hand: newHand, deck: newDeck, discard: newDiscard, pool: decayedPool };
      });
      // === 이전 라운드 요약 ===
      const summaryLines = [];
      summaryLines.push({ round: state.meta.round, phase: 6, message: `━━━━━━━━━━━ R${state.meta.round} 요약 ━━━━━━━━━━━` });
      state.players.forEach((p, i) => {
        if (p.defeated) { summaryLines.push({ round: state.meta.round, phase: 6, message: `  P${i} [${p.specific}] · 💀 쓰러짐` }); return; }
        const marker = i === 0 ? '⭐ 당신 ' : '   ';
        if (p.role === 'ghost') {
          const raidsTotal = state.meta.raidsThisGame[i] || 0;
          summaryLines.push({ round: state.meta.round, phase: 6, message: `  ${marker}P${i} [${p.specific}] 👻 · HP ${p.hp}/${p.maxHp} · 렙 ${p.resources.rep} · 누적 레이드 ${raidsTotal}회 · ${p.position || '?'} 위치` });
        } else {
          const av = assetValue(p, state.stocks, state);
          const ownZones = Object.values(state.map).filter(c => c.owner === i).length;
          summaryLines.push({ round: state.meta.round, phase: 6, message: `  ${marker}P${i} [${p.specific}] 🏢 · 자산 ${av}/55 · 구역 ${ownZones}곳 · ₵${p.resources.credit}` });
        }
      });
      // 개인 풀 요약
      state.players.forEach((p, i) => {
        if (p.defeated) return;
        const poolStr = Object.entries(p.pool || {}).filter(([,v]) => v>0).map(([k,v])=>`${k}${v}`).join(' ') || '(비어있음)';
        const marker = i === 0 ? '⭐ ' : '   ';
        summaryLines.push({ round: state.meta.round, phase: 6, message: `  ${marker}P${i} 풀: ${poolStr}` });
      });
      summaryLines.push({ round: state.meta.round, phase: 6, message: `  공권력 ${state.heat}/10` });

      const finalLog = [
        ...state.log,
        ...summaryLines,
        { round: newRound, phase: 0, message: `🔄 R${newRound} 시작 · 시그널 ${nd} · 손패 리필 · 개인 풀 절반 감쇠` }
      ].slice(-150);

      return {
        ...state,
        meta: { ...state.meta, round: newRound, phase: 0 },
        signalDie: nd,
        currentNews: null,
        players: refilledPlayers,
        log: finalLog,
      };
    }

    case 'DRAW_NEWS': {
      const news = rand(NEWS);
      const eff = news.effect;
      let newStocks = { ...state.stocks };
      let newHeat = state.heat;
      let newSignal = state.signalDie;
      let ps = [...state.players];
      const logMsgs = [];

      // Heat
      if (eff.heat) { newHeat += eff.heat; logMsgs.push(`🔥공권력${eff.heat > 0 ? '+' : ''}${eff.heat}`); }
      // Stock: all
      if (eff.all_stock) {
        Object.keys(newStocks).forEach(k => newStocks[k] = Math.max(1, Math.min(20, newStocks[k] + eff.all_stock)));
        logMsgs.push(`📊전체주가${eff.all_stock > 0 ? '+' : ''}${eff.all_stock}`);
      }
      // Stock: target
      if (eff.target_stock) {
        const { bloc, delta } = eff.target_stock;
        if (newStocks[bloc] != null) {
          newStocks[bloc] = Math.max(1, Math.min(20, newStocks[bloc] + delta));
          logMsgs.push(`📊${bloc}${delta > 0 ? '+' : ''}${delta}`);
        }
      }
      if (eff.target_stock2) {
        const { bloc, delta } = eff.target_stock2;
        if (newStocks[bloc] != null) {
          newStocks[bloc] = Math.max(1, Math.min(20, newStocks[bloc] + delta));
          logMsgs.push(`📊${bloc}${delta > 0 ? '+' : ''}${delta}`);
        }
      }
      // Random crash
      if (eff.random_crash) {
        const blocs = Object.keys(newStocks);
        const pick = blocs[Math.floor(Math.random() * blocs.length)];
        newStocks[pick] = Math.max(1, newStocks[pick] - eff.random_crash);
        logMsgs.push(`📉${pick}-${eff.random_crash}`);
      }
      // Signal lock
      if (eff.signal_lock) { newSignal = eff.signal_lock; logMsgs.push(`📡고정${eff.signal_lock}`); }
      // Credit: all
      if (eff.all_credit) {
        ps = ps.map(p => ({ ...p, resources: { ...p.resources, credit: Math.max(0, (p.resources.credit || 0) + eff.all_credit) } }));
        logMsgs.push(`₵전체${eff.all_credit > 0 ? '+' : ''}${eff.all_credit}`);
      }
      // Credit: targeted by role
      if (eff.target_credit) {
        const { role, delta } = eff.target_credit;
        ps = ps.map(p => p.role === role ? { ...p, resources: { ...p.resources, credit: Math.max(0, (p.resources.credit || 0) + delta) } } : p);
        logMsgs.push(`₵${role}${delta > 0 ? '+' : ''}${delta}`);
      }
      // All rep (Ghost only)
      if (eff.all_rep) {
        ps = ps.map(p => p.role === 'ghost' ? { ...p, resources: { ...p.resources, rep: Math.max(0, (p.resources.rep || 0) + eff.all_rep) } } : p);
        logMsgs.push(`★Ghost렙${eff.all_rep > 0 ? '+' : ''}${eff.all_rep}`);
      }
      // All weapons/parts/data
      if (eff.all_weapons) { ps = ps.map(p => ({ ...p, resources: { ...p.resources, weapons: Math.max(0, (p.resources.weapons || 0) + eff.all_weapons) } })); logMsgs.push(`🔩전체${eff.all_weapons > 0 ? '+' : ''}${eff.all_weapons}`); }
      if (eff.all_parts)   { ps = ps.map(p => ({ ...p, resources: { ...p.resources, parts:   Math.max(0, (p.resources.parts   || 0) + eff.all_parts)   } })); logMsgs.push(`⚙️전체${eff.all_parts > 0 ? '+' : ''}${eff.all_parts}`); }
      if (eff.all_data)    { ps = ps.map(p => ({ ...p, resources: { ...p.resources, data:    Math.max(0, (p.resources.data    || 0) + eff.all_data)    } })); logMsgs.push(`📡전체${eff.all_data > 0 ? '+' : ''}${eff.all_data}`); }
      // Wanted all (ghost)
      if (eff.wanted_all) {
        ps = ps.map(p => p.role === 'ghost' ? { ...p, wanted: Math.max(0, (p.wanted || 0) + eff.wanted_all) } : p);
        logMsgs.push(`🚨Ghost수배${eff.wanted_all > 0 ? '+' : ''}${eff.wanted_all}`);
      }
      // HP all ghost
      if (eff.hp_all) {
        ps = ps.map(p => p.role === 'ghost' ? { ...p, hp: Math.max(0, Math.min(p.maxHp, p.hp + eff.hp_all)) } : p);
        logMsgs.push(`❤️Ghost HP${eff.hp_all > 0 ? '+' : ''}${eff.hp_all}`);
      }
      // Random zone flip
      if (eff.random_zone_flip) {
        const newMap = { ...state.map };
        const owned = Object.entries(newMap).filter(([c, cell]) => cell.owner !== null && cell.owner !== undefined);
        for (let i = 0; i < eff.random_zone_flip && owned.length > 0; i++) {
          const idx = Math.floor(Math.random() * owned.length);
          const [coord] = owned.splice(idx, 1)[0];
          newMap[coord] = { ...newMap[coord], owner: null };
          logMsgs.push(`🗺️${coord}중립화`);
        }
        return {
          ...state, players: ps, stocks: newStocks, map: newMap, signalDie: newSignal,
          heat: Math.max(0, Math.min(10, newHeat)),
          currentNews: news,
          log: [...state.log, { round: state.meta.round, phase: 1, message: `📰 ${news.title} — ${logMsgs.join(' · ')}` }].slice(-150),
        };
      }
      // Map reveal
      let mapReveal = state.meta.mapReveal || 0;
      if (eff.map_reveal) { mapReveal += eff.map_reveal; logMsgs.push(`👁지도${eff.map_reveal}R노출`); }
      // Ghost move boost
      let moveBonusNext = state.meta.moveBonusNext || 0;
      if (eff.ghost_move) { moveBonusNext += eff.ghost_move; logMsgs.push(`🚶이동${eff.ghost_move > 0 ? '+' : ''}${eff.ghost_move}`); }

      return {
        ...state,
        currentNews: news,
        stocks: newStocks,
        signalDie: newSignal,
        heat: Math.max(0, Math.min(10, newHeat)),
        players: ps,
        meta: { ...state.meta, mapReveal, moveBonusNext },
        log: [...state.log, { round: state.meta.round, phase: 1, message: `📰 ${news.title} — ${logMsgs.join(' · ') || '효과 없음'}` }].slice(-150),
      };
    }

    case 'PLAN_CARDS': {
      // action.playerIdx, action.cards, action.halves (optional)
      const ps = state.players.map((p, i) => {
        if (i === action.playerIdx) {
          return { ...p, plannedCards: action.cards, plannedHalves: action.halves || [] };
        }
        return p;
      });
      return { ...state, players: ps };
    }

    case 'EXECUTE_TURN': {
      // Order players by initiative
      const pOrder = state.players
        .map((p, i) => ({ p, i, init: getInitiative(p) }))
        .filter(x => !x.p.defeated && x.p.plannedCards.length > 0)
        .sort((a, b) => a.init - b.init);

      let s = state;
      for (const { p, i } of pOrder) {
        s = executeCards(s, i);
      }
      // Clear planned
      s.players = s.players.map(p => ({ ...p, plannedCards: [] }));
      return s;
    }

    case 'COLLECT_INCOME': {
      let s = { ...state };
      const newLog = [...s.log];

      const newPlayers = state.players.map((p, pi) => {
        if (p.defeated) return p;
        const res = { ...p.resources };
        const pool = { ...(p.pool || { M:0,I:0,V:0,S:0,B:0,A:0,GRID:0 }) };
        const ownedCoords = Object.entries(state.map).filter(([c, cell]) => cell.owner === pi).map(([c]) => c);

        ownedCoords.forEach(c => {
          const cell = state.map[c];
          const z = ZONE_TYPES[cell.zone];
          if (!z) return;
          for (const [k, v] of Object.entries(z.income)) {
            if (k === 'all_attr') {
              ['M','I','V','S','B','A'].forEach(a => { pool[a] = (pool[a] || 0) + v; });
            } else if (k === 'random_attr') {
              const rnd = rand(['M','I','V','S','B','A']);
              pool[rnd] = (pool[rnd] || 0) + v;
            } else if (k === 'operative') {
              res.credit = (res.credit || 0) + v;
            } else {
              res[k] = (res[k] || 0) + v;
            }
          }
          // 구역 생산 속성 — 개인 풀에 적립
          if (z.attr && z.attr !== 'all' && z.attr !== null) {
            pool[z.attr] = (pool[z.attr] || 0) + 1;
          }
        });

        for (const [bl, qty] of Object.entries(p.stocks)) {
          if (qty >= 2) {
            const divPerShare = state.stocks[bl] >= 15 ? 1 : 0.5;
            const div = Math.floor(qty * divPerShare);
            if (div > 0) res.credit = (res.credit || 0) + div;
          }
        }

        if (ownedCoords.length > 0) {
          const summary = `💰 P${pi} [${p.specific}] · ${ownedCoords.length}구역 수입 ₵+${res.credit - (p.resources.credit || 0)}`;
          newLog.push({ round: s.meta.round, phase: s.meta.phase, message: summary });
        }

        return { ...p, resources: res, pool };
      });

      s = { ...s, players: newPlayers, log: newLog.slice(-150) };

      // === Bloc 패시브 확장: 매 라운드 자동 점령 (v0.5.19 롤백 - Bloc 너무 약해짐) ===
      const expandedMap = { ...s.map };
      const expandLog = [];
      for (let pi = 0; pi < s.players.length; pi++) {
        const p = s.players[pi];
        if (p.role !== 'bloc' || p.defeated) continue;
        const myZones = Object.entries(expandedMap).filter(([c, cell]) => cell.owner === pi).map(([c]) => c);
        const candidates = new Set();
        myZones.forEach(c => {
          coordsAdj(c).forEach(adj => {
            const cell = expandedMap[adj];
            if (cell && cell.owner === null && ZONE_TYPES[cell.zone]?.buildable) candidates.add(adj);
          });
        });
        if (candidates.size > 0) {
          const picks = [...candidates];
          const target = picks[Math.floor(Math.random() * picks.length)];
          expandedMap[target] = { ...expandedMap[target], owner: pi };
          const zName = ZONE_TYPES[expandedMap[target].zone]?.name || target;
          expandLog.push({ round: s.meta.round, phase: s.meta.phase, message: `📈 P${pi} [${p.specific}] 영향권 확장 → ${target} (${zName}) · 자산 +5` });
        }
      }
      if (expandLog.length > 0) {
        s = { ...s, map: expandedMap, log: [...s.log, ...expandLog].slice(-150) };
      }
      return s;
    }

    case 'RESEARCH_PHASE': {
      // R&D: 각 플레이어가 tlProgress 축적 + 승급 판정
      // Bloc 공식: 구역수 + ⌊풀/2⌋  (구역 확장으로 자연 축적)
      // Ghost 공식: ⌊렙/3⌋ + 레이드×2 + ⌊풀/2⌋  (렙·레이드로 축적 — Bloc 대비 비대칭)
      let s = { ...state };
      const newLog = [...s.log];
      const newPlayers = state.players.map((p, pi) => {
        if (p.defeated) return p;
        const poolSum = ['M','I','V','S','B','A'].reduce((a,k) => a + (p.pool?.[k] || 0), 0);
        const poolHalf = Math.floor(poolSum / 2);
        const raids = state.meta.raidsThisGame?.[pi] || 0;
        const ownCount = Object.values(state.map).filter(c => c.owner === pi).length;
        let gain = 0;
        let breakdown = '';
        // v0.5.21: 5pt 균일 비용에 맞춰 공식 축소 (속도 조정)
        if (p.role === 'ghost') {
          const repPart = Math.floor((p.resources.rep || 0) / 5);  // ⅓ → ⅕
          const raidPart = raids;                                  // ×2 → ×1
          const poolPart = Math.floor(poolSum / 3);                // ½ → ⅓
          gain = repPart + raidPart + poolPart;
          breakdown = `렙⅕${repPart} +레이드${raidPart} +풀⅓${poolPart}`;
        } else {
          const zonePart = Math.floor(ownCount / 2);               // 구역 → ½
          const poolPart = Math.floor(poolSum / 3);                // ½ → ⅓
          gain = zonePart + poolPart;
          breakdown = `구역½${zonePart} +풀⅓${poolPart}`;
        }
        let tl = p.tl || 1;
        let tlProgress = (p.tlProgress || 0) + gain;
        const events = [];
        while (tl < 5 && tlProgress >= tlCostFor(tl)) {
          tlProgress -= tlCostFor(tl);
          tl += 1;
          events.push(tl);
        }
        if (gain > 0 || events.length > 0) {
          const marker = pi === 0 ? '⭐ 당신 ' : '';
          const upMsg = events.length > 0 ? ` · ⚡TL UP → TL ${tl}` : '';
          newLog.push({ round: s.meta.round, phase: 5, message: `🧪 ${marker}P${pi} [${p.specific}] R&D +${gain}pt (${breakdown}) → ${tlProgress}/${tlCostFor(tl)}${upMsg}` });
        }
        return { ...p, tl, tlProgress };
      });
      return { ...s, players: newPlayers, log: newLog.slice(-150) };
    }

    case 'CLAIM_ACHIEVEMENT': {
      // action.playerIdx, action.achievementId
      if (state.meta.claimedAchievements[action.achievementId] !== undefined) return state;
      const achv = ACHIEVEMENTS_IN.find(a => a.id === action.achievementId);
      if (!achv) return state;
      const ps = state.players.map((p, i) => {
        if (i !== action.playerIdx) return p;
        const res = { ...p.resources };
        if (achv.reward.res) res.credit += achv.reward.res;
        if (achv.reward.rep) res.rep += achv.reward.rep;
        if (achv.reward.parts) res.parts += achv.reward.parts;
        if (achv.reward.data) res.data += achv.reward.data;
        if (achv.reward.contact) res.influence += achv.reward.contact;
        return { ...p, resources: res, achievements: [...p.achievements, action.achievementId] };
      });
      return {
        ...state,
        players: ps,
        meta: { ...state.meta, claimedAchievements: { ...state.meta.claimedAchievements, [action.achievementId]: action.playerIdx } },
        log: [...state.log, { round: state.meta.round, phase: state.meta.phase, message: `🏆 P${action.playerIdx} 업적 달성: ${achv.name}` }].slice(-150),
      };
    }

    case 'MOVE_PLAYER': {
      // action.playerIdx, action.to
      const ps = state.players.map((p, i) => {
        if (i !== action.playerIdx) return p;
        return { ...p, position: action.to };
      });
      return {
        ...state,
        players: ps,
        log: [...state.log, { round: state.meta.round, phase: state.meta.phase, message: `P${action.playerIdx} 이동 → ${action.to}` }].slice(-150),
      };
    }

    case 'VICTORY':
      return { ...state, meta: { ...state.meta, gameOver: true, winner: action.winner, winReason: action.reason } };

    case 'RESET':
      return initGame(action.humanRole, action.humanSpecific);

    default:
      return state;
  }
}

function getInitiative(p) {
  if (p.role === 'ghost' && p.plannedCards[0]) {
    const c = getCard(p.plannedCards[0]);
    return c?.init ?? 50;
  }
  if (p.role === 'bloc' && p.plannedCards[0]) {
    return (p.tl || 1) * 10;
  }
  return 50;
}

function executeCards(state, playerIdx) {
  let s = { ...state };
  const p = s.players[playerIdx];
  if (!p.plannedCards || p.plannedCards.length === 0) return s;

  if (p.role === 'ghost') {
    // plannedHalves[i] = 'top' | 'bot' — 각 카드에서 어느 반쪽을 쓸지
    // 기본: 1번 카드=top, 2번 카드=bot. 사용자가 선택 가능
    const halves = p.plannedHalves && p.plannedHalves.length === p.plannedCards.length
      ? p.plannedHalves
      : p.plannedCards.map((_, i) => i === 0 ? 'top' : 'bot');
    // 실행: 선택 순서대로 (top 먼저 → bot 나중, 하지만 둘 다 top이면 0번→1번 순)
    const order = [...p.plannedCards.keys()].sort((a, b) => {
      const ha = halves[a], hb = halves[b];
      if (ha === hb) return a - b;
      return ha === 'top' ? -1 : 1;  // top 먼저
    });
    for (const idx of order) {
      const c = getCard(p.plannedCards[idx]);
      const half = halves[idx];
      if (c && c[half]) s = applyEffect(s, playerIdx, c[half], half, c);
    }
    const newHand = p.hand.filter(h => !p.plannedCards.includes(h));
    const newDiscard = [...p.discard];
    const newLost = [...p.lost];
    p.plannedCards.forEach((cid) => {
      const c = getCard(cid);
      if (c?.loss) newLost.push(cid);
      else newDiscard.push(cid);
    });
    s.players = s.players.map((pp, j) => j === playerIdx ? { ...pp, hand: newHand, discard: newDiscard, lost: newLost, plannedHalves: [] } : pp);
  } else {
    // Bloc: Ghost와 동일하게 2장 × main/side 조합
    const halves = p.plannedHalves && p.plannedHalves.length === p.plannedCards.length
      ? p.plannedHalves
      : p.plannedCards.map((_, i) => i === 0 ? 'main' : 'side');
    const order = [...p.plannedCards.keys()].sort((a, b) => {
      const ha = halves[a], hb = halves[b];
      if (ha === hb) return a - b;
      return ha === 'main' ? -1 : 1;
    });
    for (const idx of order) {
      const c = getCard(p.plannedCards[idx]);
      const half = halves[idx];
      if (c && c[half]) s = applyEffect(s, playerIdx, c[half], half, c);
    }
    const newHand = p.hand.filter(h => !p.plannedCards.includes(h));
    const newDiscard = [...p.discard, ...p.plannedCards];
    s.players = s.players.map((pp, j) => j === playerIdx ? { ...pp, hand: newHand, discard: newDiscard, plannedHalves: [] } : pp);
  }
  return s;
}

// ============================================================================
// 경로 탐색: 가장 가까운 Bloc 소유 구역 찾기 (BFS, Chebyshev 4-방향)
// ============================================================================
function bfsDistance(state, from, to) {
  if (from === to) return 0;
  const visited = new Set([from]);
  let frontier = [from];
  let dist = 0;
  while (frontier.length > 0) {
    dist++;
    const next = [];
    for (const c of frontier) {
      for (const a of coordsAdj(c)) {
        if (!state.map[a] || visited.has(a)) continue;
        if (a === to) return dist;
        visited.add(a);
        next.push(a);
      }
    }
    frontier = next;
  }
  return Infinity;
}

function findNearestBlocZone(state, fromCoord, excludeOwnBloc = null) {
  const visited = new Set([fromCoord]);
  let frontier = [fromCoord];
  while (frontier.length > 0) {
    const next = [];
    for (const c of frontier) {
      const cell = state.map[c];
      if (!cell) continue;
      if (cell.owner !== null && cell.owner !== undefined) {
        const owner = state.players[cell.owner];
        if (owner?.role === 'bloc' && owner.specific !== excludeOwnBloc) {
          return c; // Found bloc zone
        }
      }
      for (const adj of coordsAdj(c)) {
        if (!visited.has(adj)) { visited.add(adj); next.push(adj); }
      }
    }
    frontier = next;
  }
  return null;
}

// 현재 위치에서 목표 방향으로 한 칸 이동 (BFS 기반)
function stepToward(state, fromCoord, toCoord) {
  if (fromCoord === toCoord) return fromCoord;
  // BFS로 경로 찾기
  const parent = { [fromCoord]: null };
  const queue = [fromCoord];
  while (queue.length > 0) {
    const c = queue.shift();
    if (c === toCoord) {
      // Backtrack to find first step
      let step = c;
      while (parent[step] !== fromCoord && parent[step] !== null) step = parent[step];
      return step === toCoord ? toCoord : step;
    }
    for (const adj of coordsAdj(c)) {
      if (!(adj in parent)) { parent[adj] = c; queue.push(adj); }
    }
  }
  return fromCoord;
}

function applyEffect(state, playerIdx, effect, kind, card) {
  let s = state;
  const p = s.players[playerIdx];

  // 속성 생성 (개인 풀)
  if (effect.gen) {
    const curPool = { ...(s.players[playerIdx].pool || {}) };
    const keys = effect.gen.split(':');
    keys.forEach(k => { curPool[k] = (curPool[k] || 0) + 1; });
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], pool: curPool };
    s = { ...s, players: ps };
    const meTag = playerIdx === 0 ? '⭐ 당신 ' : '';
    s = logEntry(s, `${meTag}P${playerIdx} [${p.specific}] · 속성 ${keys.join('+')} +1 (개인 풀)`);
  }

  // 비용 지불 (개인 풀에서)
  if (effect.cost) {
    const curPool = { ...(s.players[playerIdx].pool || {}) };
    for (const a of effect.cost) {
      if (curPool[a] > 0) curPool[a]--;
      else if (curPool.GRID > 0) curPool.GRID--;
      else {
        const meTag = playerIdx === 0 ? '⭐ 당신 ' : '';
        s = logEntry(s, `${meTag}P${playerIdx} · ${a} 부족 — 효과 불발 (${cardDisplayName(card) || card?.name})`);
        return s;
      }
    }
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], pool: curPool };
    s = { ...s, players: ps };
  }

  // === 이동 (스마트 라우팅, effect.move 스텝만큼 반복) ===
  if (effect.move) {
    const meTag = playerIdx === 0 ? '⭐ 당신 ' : '';
    const startPos = s.players[playerIdx].position;
    let current = startPos;
    const path = [startPos];
    // 사람(P0)이 지도에서 직접 목표를 찍었으면 그 좌표를 우선 사용
    const userGoal = (playerIdx === 0 && s.meta.pendingMoveTarget) ? s.meta.pendingMoveTarget : null;
    for (let step = 0; step < effect.move; step++) {
      let nextStep = null;
      const pNow = s.players[playerIdx];
      if (userGoal) {
        if (current === userGoal) break;
        nextStep = stepToward(s, current, userGoal);
      } else if (pNow.role === 'ghost') {
        const goal = findNearestBlocZone(s, current);
        if (goal && goal !== current) {
          nextStep = stepToward(s, current, goal);
        } else if (goal === current) {
          break; // 이미 목표 도착, 남은 이동은 보존
        } else {
          const adj = coordsAdj(current);
          if (adj.length) nextStep = rand(adj);
        }
      } else {
        // Bloc: 빈 buildable 구역 선호
        const adj = coordsAdj(current);
        const empty = adj.filter(c => s.map[c] && s.map[c].owner === null && ZONE_TYPES[s.map[c].zone]?.buildable);
        if (empty.length > 0) nextStep = rand(empty);
        else if (adj.length > 0) nextStep = rand(adj);
      }
      if (!nextStep || nextStep === current) break;
      current = nextStep;
      path.push(current);
      // 각 스텝마다 s.players 업데이트
      const ps = [...s.players];
      ps[playerIdx] = { ...ps[playerIdx], position: current };
      const v = new Set(s.meta.zonesVisited[playerIdx] || []);
      v.add(current);
      s = { ...s, players: ps, meta: { ...s.meta, zonesVisited: { ...s.meta.zonesVisited, [playerIdx]: v } } };
    }
    if (path.length > 1) {
      const finalPos = current;
      const zName = ZONE_TYPES[s.map[finalPos].zone]?.name || finalPos;
      const pathStr = path.join(' → ');
      s = logEntry(s, `${meTag}🚶 P${playerIdx} [${p.specific}] · ${pathStr} (${zName}, ${path.length - 1}칸 이동)`);

      // === Ghost가 다른 Ghost와 같은 구역에 있음 → PvP 옵션 ===
      const pAfterMove = s.players[playerIdx];
      if (pAfterMove.role === 'ghost') {
        const rivalGhosts = s.players.filter((pp, i) => i !== playerIdx && !pp.defeated && pp.role === 'ghost' && pp.position === pAfterMove.position);
        if (rivalGhosts.length > 0) {
          const rival = rivalGhosts[0];
          const rivalIdx = s.players.indexOf(rival);
          if (playerIdx === 0) {
            // 사용자에게 결투 선택 모달
            s = {
              ...s,
              meta: {
                ...s.meta,
                pendingGhostDuel: {
                  coord: pAfterMove.position,
                  atkGhostIdx: 0,
                  defGhostIdx: rivalIdx,
                  atkStat: pAfterMove.stats.atk,
                  defStat: rival.stats.def,
                  zoneNm: ZONE_TYPES[s.map[pAfterMove.position].zone]?.name || '',
                },
              },
            };
            s.meta._didAutoRaid = true;
          } else {
            // 봇이 P0를 공격하는 경우: 자동 결투 (상성 적용)
            const atkRoll = d6();
            const defRoll = d6();
            const counterBonus = countersGhost(pAfterMove.specific, rival.specific) ? 2 : 0;
            const atkTotal = pAfterMove.stats.atk + atkRoll + counterBonus;
            const defTotal = rival.stats.def + defRoll;
            const ps = [...s.players];
            if (atkTotal >= defTotal + 2) {
              // 공격자 승리: 렙+2, 방어자 자원 일부 탈취
              const loot = Math.min(3, rival.resources.credit || 0);
              ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2, credit: (ps[playerIdx].resources.credit || 0) + loot } };
              ps[rivalIdx] = { ...ps[rivalIdx], resources: { ...ps[rivalIdx].resources, credit: Math.max(0, (ps[rivalIdx].resources.credit || 0) - loot) }, hp: Math.max(0, ps[rivalIdx].hp - 2) };
              s = { ...s, players: ps };
              s = logEntry(s, `⚔️ Ghost 결투: P${playerIdx} → P${rivalIdx} · ${atkTotal} vs ${defTotal} · 승리 · 렙+2, ₵+${loot}, 상대 HP-2`);
              if (rivalIdx === 0) s.meta = { ...s.meta, lastTargetedBy: { attacker: playerIdx, effectKey: 'ghost_pvp', detail: `HP-2, ₵-${loot}` } };
            } else if (defTotal >= atkTotal + 2) {
              // 방어자 반격
              ps[playerIdx] = { ...ps[playerIdx], hp: Math.max(0, ps[playerIdx].hp - 2) };
              s = { ...s, players: ps };
              s = logEntry(s, `⚔️ Ghost 결투: P${playerIdx} → P${rivalIdx} · ${atkTotal} vs ${defTotal} · 반격당함 · HP-2`);
            } else {
              s = logEntry(s, `⚔️ Ghost 결투: P${playerIdx} → P${rivalIdx} · ${atkTotal} vs ${defTotal} · 무승부 (양측 무사)`);
            }
            s.meta._didAutoRaid = true;
          }
        }
      }

      // === Ghost가 Bloc 소유 구역에 도착 → 레이드 시도 ===
      // P0: 모달로 명시 선택 (Raid? / Stand down?) — 확률·보상·위험 공개
      // 봇: 기존 자동 시도 유지
      if (pAfterMove.role === 'ghost' && !s.meta._didAutoRaid) {
        const cellThere = s.map[pAfterMove.position];
        if (cellThere?.owner !== null && cellThere?.owner !== undefined && s.players[cellThere.owner]?.role === 'bloc') {
          const blocIdx = cellThere.owner;
          const bloc = s.players[blocIdx].specific;
          const zoneNm = ZONE_TYPES[cellThere.zone]?.name || '';
          const threshold = 5;
          if (playerIdx === 0) {
            // v0.5.22: 확장된 레이드 상태 — 타입 선택 + 자원 투자 + 3단계 판정
            const zoneType = cellThere.zone;
            s = {
              ...s,
              meta: {
                ...s.meta,
                pendingRaid: {
                  coord: pAfterMove.position,
                  bloc,
                  zoneNm,
                  zoneType,
                  blocIdx,
                  stats: { atk: pAfterMove.stats.atk, spd: pAfterMove.stats.spd, hack: pAfterMove.stats.hack },
                  fortified: cellThere.fortified || 0,
                  // 사용자가 단계적으로 채움
                  selectedType: null,
                  invested: { weapons: 0, data: 0, poolAttr: null },
                  executed: false,
                  phase: 'type',  // 'type' | 'invest' | 'done'
                },
              },
            };
            s.meta._didAutoRaid = true;
          } else {
            // 봇: 기존 자동 로직 + 상성 보너스
            const raidRoll = d6();
            const counterBonus = countersBloc(pAfterMove.specific, bloc) ? 1 : 0;
            const raidTotal = raidRoll + pAfterMove.stats.atk + counterBonus;
            if (raidTotal >= threshold) {
              const newStocks = { ...s.stocks, [bloc]: Math.max(1, s.stocks[bloc] - 3) };
              const ps = [...s.players];
              ps[playerIdx] = {
                ...ps[playerIdx],
                resources: { ...ps[playerIdx].resources, rep: ps[playerIdx].resources.rep + 3 },
                wanted: ps[playerIdx].wanted + 1,
              };
              const newMap = { ...s.map, [pAfterMove.position]: { ...cellThere, owner: null } };
              s = { ...s, players: ps, stocks: newStocks, map: newMap, heat: Math.min(10, s.heat + 1) };
              s.meta.raidsThisGame[playerIdx] = (s.meta.raidsThisGame[playerIdx] || 0) + 1;
              s = logEntry(s, `🗡️ 레이드 성공! P${playerIdx} → [${pAfterMove.position} ${zoneNm}] 🎲${raidRoll}+${pAfterMove.stats.atk}=${raidTotal} ≥ ${threshold} — ${bloc} 주가-3, 구역 중립화, 렙+3`);
              s.meta._didAutoRaid = true;
              if (blocIdx === 0 && playerIdx !== 0) {
                s.meta = { ...s.meta, lastTargetedBy: { attacker: playerIdx, effectKey: 'raid', detail: `${pAfterMove.position} 잃음, ${bloc} 주가-3` } };
              }
            } else {
              const ps = [...s.players];
              ps[playerIdx] = {
                ...ps[playerIdx],
                hp: Math.max(0, ps[playerIdx].hp - 3),
                wanted: ps[playerIdx].wanted + 1,
              };
              s = { ...s, players: ps, heat: Math.min(10, s.heat + 1) };
              s = logEntry(s, `❌ 레이드 실패 P${playerIdx} [${pAfterMove.position} ${zoneNm}] 🎲${raidRoll}+${pAfterMove.stats.atk}=${raidTotal} < ${threshold} — HP-3, 수배+1`);
              s.meta._didAutoRaid = true;
            }
          }
        }
      }
    }
    // 사용자 지정 목표를 사용했으면 소비 (1회 사용)
    if (playerIdx === 0 && s.meta.pendingMoveTarget) {
      s = { ...s, meta: { ...s.meta, pendingMoveTarget: null, moveBudget: 0 } };
    }

    // === 구역 첫 방문 보너스 (P0 전용, 실제로 이동한 경우만, 자동 레이드 발생 시 스킵) ===
    if (playerIdx === 0 && !s.meta._didAutoRaid && path.length > 1) {
      const pNow = s.players[0];
      const cellThere = s.map[pNow.position];
      const visitedMap = s.meta.visitedBonusZones || {};
      const visitedByMe = visitedMap[0] || {};
      if (cellThere && !visitedByMe[pNow.position]) {
        const zoneKind = cellThere.zone;
        const pool = ZONE_BONUS_POOL[zoneKind];
        if (pool && pool.length > 0) {
          const shuffled = [...pool].sort(() => Math.random() - 0.5);
          const options = shuffled.slice(0, Math.min(3, pool.length));
          const newVisited = { ...visitedByMe, [pNow.position]: true };
          s = {
            ...s,
            meta: {
              ...s.meta,
              zoneBonusPending: { zone: zoneKind, coord: pNow.position, options },
              visitedBonusZones: { ...visitedMap, 0: newVisited },
            },
          };
          const zName = ZONE_TYPES[zoneKind]?.name || zoneKind;
          s = logEntry(s, `⭐ 당신 🌟 ${pNow.position} (${zName}) 첫 방문 — 보너스 3중 1 선택`);
        }
      }
    }
    // 다음 턴 쓸 수 있게 플래그 초기화
    s = { ...s, meta: { ...s.meta, _didAutoRaid: false } };
  }

  // === OPERATIVE 배치 (Bloc 구역 확장) ===
  if (effect.deploy_op && p.role === 'bloc') {
    const curPos = s.players[playerIdx].position;
    const adj = coordsAdj(curPos);
    const empty = adj.filter(c => s.map[c] && s.map[c].owner === null && ZONE_TYPES[s.map[c].zone]?.buildable);
    const count = Math.min(effect.deploy_op, empty.length);
    if (count > 0) {
      const newMap = { ...s.map };
      const captured = [];
      for (let i = 0; i < count; i++) {
        const target = empty[i];
        newMap[target] = { ...newMap[target], owner: playerIdx };
        captured.push(target);
      }
      s = { ...s, map: newMap };
      const names = captured.map(c => `${c}(${ZONE_TYPES[s.map[c].zone]?.name || ''})`).join(', ');
      s = logEntry(s, `🏢 P${playerIdx} [${p.specific}] · 구역 점령: ${names} — 자산 +${count * 5}`);
    } else {
      s = logEntry(s, `🏢 P${playerIdx} [${p.specific}] · 인접 빈 구역 없음 (OPERATIVE 불발)`);
    }
  }

  // === 공격 (같은 구역 적) ===
  if (effect.atk || effect.atk_x2 || effect.atk_x3_retort) {
    const curP = s.players[playerIdx];
    const atkVal = effect.atk || (effect.atk_x2 ? curP.stats.atk : 0) || 0;
    const enemies = s.players.filter((pp, i) => i !== playerIdx && !pp.defeated && pp.position === curP.position);
    if (enemies.length > 0) {
      const target = enemies[0];
      const tIdx = s.players.indexOf(target);
      const atkRoll = d6();
      const defRoll = d6();
      const atkTotal = curP.stats.atk + atkVal + atkRoll;
      const defTotal = target.stats.def + defRoll;
      const dmg = Math.max(0, atkTotal - defTotal);
      s = logEntry(s, `💥 P${playerIdx} → P${tIdx} (${target.specific}) · 공격 ${curP.stats.atk}+${atkVal}+🎲${atkRoll}=${atkTotal} vs 방어 ${target.stats.def}+🎲${defRoll}=${defTotal} → 피해 ${dmg}`);
      const ps = [...s.players];
      ps[tIdx] = { ...ps[tIdx], hp: Math.max(0, ps[tIdx].hp - dmg) };
      if (ps[tIdx].hp === 0) {
        ps[tIdx] = { ...ps[tIdx], defeated: true };
        s = logEntry(s, `⚰️ P${tIdx} (${target.specific}) 쓰러짐`);
      }
      s = { ...s, players: ps };
      s.meta.attacksUsed[playerIdx] = (s.meta.attacksUsed[playerIdx] || 0) + 1;
    }
  }

  // === 레이드 (Ghost + Bloc 구역에서 공격 카드 사용 시) ===
  // ⚠ 중요: p는 시작 시점 기준이라 이동 후 무효. 현재 위치 재읽기 필수
  const curP2 = s.players[playerIdx];
  const atCell = s.map[curP2.position];
  const isBlocOwnedZone = atCell?.owner !== null && atCell?.owner !== undefined && s.players[atCell.owner]?.role === 'bloc';
  if (curP2.role === 'ghost' && effect.atk && isBlocOwnedZone) {
    const blocIdx = atCell.owner;
    const bloc = s.players[blocIdx].specific;
    const zName = ZONE_TYPES[atCell.zone]?.name || '';
    const raidRoll = d6();
    const raidTotal = raidRoll + curP2.stats.atk;
    const threshold = 5;
    if (raidTotal >= threshold) {
      // 성공 — 주가 -3, 렙 +3, 구역 점령 여부 선택
      const newStocks = { ...s.stocks, [bloc]: Math.max(1, s.stocks[bloc] - 3) };
      s = { ...s, stocks: newStocks };
      const ps = [...s.players];
      ps[playerIdx] = {
        ...ps[playerIdx],
        resources: { ...ps[playerIdx].resources, rep: ps[playerIdx].resources.rep + 3 },
        wanted: ps[playerIdx].wanted + 1,
      };
      const newMap = { ...s.map, [curP2.position]: { ...atCell, owner: null } };
      s = { ...s, players: ps, map: newMap, heat: Math.min(10, s.heat + 1) };
      s.meta.raidsThisGame[playerIdx] = (s.meta.raidsThisGame[playerIdx] || 0) + 1;
      const meTag = playerIdx === 0 ? '⭐ 당신 ' : '';
      s = logEntry(s, `${meTag}🗡️ 레이드 성공! [${curP2.position} ${zName}] 🎲${raidRoll}+${curP2.stats.atk}=${raidTotal} — ${bloc} 주가-3, 구역 중립화, P${playerIdx} 렙+3 (누적 ${ps[playerIdx].resources.rep}), 현상수배+1`);
    } else {
      const ps = [...s.players];
      ps[playerIdx] = {
        ...ps[playerIdx],
        hp: Math.max(0, ps[playerIdx].hp - 3),
        wanted: ps[playerIdx].wanted + 1,
      };
      s = { ...s, players: ps, heat: Math.min(10, s.heat + 1) };
      const meTag = playerIdx === 0 ? '⭐ 당신 ' : '';
      s = logEntry(s, `${meTag}❌ 레이드 실패 [${curP2.position} ${zName}] 🎲${raidRoll}+${curP2.stats.atk}=${raidTotal} < ${threshold} — P${playerIdx} HP-3, 현상수배+1`);
    }
  }

  // === 회복 (아군 Ghost 50%) ===
  if (effect.heal_all) {
    const ps = s.players.map(pp => pp.role === 'bloc' ? pp : { ...pp, hp: Math.min(pp.maxHp, pp.hp + Math.floor(pp.maxHp * 0.5)) });
    s = { ...s, players: ps };
    s = logEntry(s, `💚 P${playerIdx} [${p.specific}] · 아군 Ghost 전원 HP 50% 회복`);
  }

  if (card?.loss) {
    s.meta.lostCardsUsed[playerIdx] = (s.meta.lostCardsUsed[playerIdx] || 0) + 1;
  }

  // === 주가 조작 ===
  if (effect.crash_stock || effect.crash_target) {
    // 자기 블록 외 랜덤
    const candidates = Object.keys(s.stocks).filter(b => !(p.role === 'bloc' && p.specific === b));
    const target = rand(candidates);
    const amt = effect.crash_stock || effect.crash_target || 3;
    const newStocks = { ...s.stocks, [target]: Math.max(1, s.stocks[target] - amt) };
    s = { ...s, stocks: newStocks };
    s = logEntry(s, `📉 P${playerIdx} [${p.specific}] · ${target} 주가 -${amt} (${s.stocks[target]} → ${newStocks[target]})`);
  }

  // === 무기·자원 지급 ===
  if (effect.weapons) {
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, weapons: (ps[playerIdx].resources.weapons || 0) + effect.weapons } };
    s = { ...s, players: ps };
    s = logEntry(s, `🔩 P${playerIdx} · 무기 +${effect.weapons}`);
  }
  if (effect.credit) {
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + effect.credit } };
    s = { ...s, players: ps };
    s = logEntry(s, `₵ P${playerIdx} · 크레딧 +${effect.credit}`);
  }
  if (effect.parts) {
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, parts: (ps[playerIdx].resources.parts || 0) + effect.parts } };
    s = { ...s, players: ps };
    s = logEntry(s, `⚙️ P${playerIdx} · 부품 +${effect.parts}`);
  }

  // === 공권력 변동 ===
  if (effect.heat) {
    const newHeat = Math.max(0, Math.min(10, s.heat + effect.heat));
    s = { ...s, heat: newHeat };
    s = logEntry(s, `🚨 공권력 ${effect.heat > 0 ? '+' : ''}${effect.heat} → ${newHeat}`);
  }

  // === v0.5.10: 미구현 효과 키 폴백 보상 (BROKER·CIPHER·MOLE 언더파워 해소) ===
  // 원래 카드 텍스트에 있던 효과가 구현 안 됐으면 최소 자원/렙 보상 부여해 Ghost 비대칭 전략 루트 강화
  if (effect.contact) {
    const ps = [...s.players];
    const add = effect.contact * 2;
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, influence: (ps[playerIdx].resources.influence || 0) + effect.contact, credit: (ps[playerIdx].resources.credit || 0) + add } };
    s = { ...s, players: ps };
    s = logEntry(s, `🎙️ P${playerIdx} · 접선 +${effect.contact} · ₵+${add}`);
  }
  if (effect.blackmarket) {
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, weapons: (ps[playerIdx].resources.weapons || 0) + effect.blackmarket, credit: (ps[playerIdx].resources.credit || 0) + effect.blackmarket * 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🕶 P${playerIdx} · 블랙마켓 구매 (무기+${effect.blackmarket}, ₵+${effect.blackmarket * 2})`);
  }
  if (effect.extort) {
    // 정보 착취: rep + credit (BROKER 렙 루트 주력)
    const repGain = Math.ceil(effect.extort * 1.5);
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + repGain, credit: (ps[playerIdx].resources.credit || 0) + effect.extort } };
    s = { ...s, players: ps };
    s = logEntry(s, `💼 P${playerIdx} · 협박 · ★+${repGain}, ₵+${effect.extort}`);
  }
  if (effect.peek_objective || effect.sell_info || effect.peek_hand || effect.peek_full || effect.peek_news) {
    // v0.5.18: 정보 수집/판매 → rep + data + 크레딧 (Bloc의 경우 자산 직결)
    const amount = effect.sell_info ? 3 : 2;
    const isBloc = p.role === 'bloc';
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + amount, data: (ps[playerIdx].resources.data || 0) + amount, credit: (ps[playerIdx].resources.credit || 0) + (isBloc ? amount * 2 : 0) } };
    s = { ...s, players: ps };
    s = logEntry(s, `👁 P${playerIdx} · 정보 행동 · ★+${amount}, 📡+${amount}${isBloc ? `, ₵+${amount*2}` : ''}`);
  }
  if (effect.scout || effect.scout_all || effect.drone_scan) {
    // v0.5.17: 정찰 → data + 렙 (RIGGER 구제)
    const amount = effect.scout_all ? 2 : 1;
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, data: (ps[playerIdx].resources.data || 0) + amount, rep: (ps[playerIdx].resources.rep || 0) + amount } };
    s = { ...s, players: ps };
    s = logEntry(s, `🛰 P${playerIdx} · 정찰 · 📡+${amount}, ★+${amount}`);
  }
  if (effect.broker_fee) {
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + effect.broker_fee, rep: (ps[playerIdx].resources.rep || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🤝 P${playerIdx} · 중개 수수료 ₵+${effect.broker_fee}, ★+1`);
  }
  if (effect.stop_combat || effect.cancel_card || effect.cancel_action) {
    // 중단·취소 → rep 평판 (실제로는 다른 플레이어 타겟팅 필요하지만 여기선 보너스로)
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🛑 P${playerIdx} · 개입 · ★+2`);
  }
  if (effect.invisible || effect.invisible_2r || effect.stealth || effect.hide_actions || effect.hide_actions_1r || effect.negate_scout) {
    // 은신/은폐 → 수배 감소 + rep
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], wanted: Math.max(0, (ps[playerIdx].wanted || 0) - 1), resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🕶 P${playerIdx} · 은신 · 수배-1, ★+1`);
  }
  if (effect.clear_wanted || effect.burn_identity) {
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], wanted: 0 };
    s = { ...s, players: ps };
    s = logEntry(s, `🧹 P${playerIdx} · 수배 초기화`);
  }
  if (effect.heal) {
    const curP = s.players[playerIdx];
    const healed = Math.min(curP.maxHp, curP.hp + effect.heal);
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], hp: healed };
    s = { ...s, players: ps };
    s = logEntry(s, `❤️ P${playerIdx} · HP +${effect.heal} (→${healed})`);
  }
  if (effect.stat_boost) {
    // 일회성 판정 보너스 누적
    s = { ...s, meta: { ...s.meta, attackBonusOnce: (s.meta.attackBonusOnce || 0) + effect.stat_boost } };
    s = logEntry(s, `💪 P${playerIdx} · 다음 판정 +${effect.stat_boost}`);
  }
  if (effect.swap || effect.swap_ratio) {
    // 자원 교환 → credit 전환
    const add = 3;
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + add } };
    s = { ...s, players: ps };
    s = logEntry(s, `🔄 P${playerIdx} · 거래 교환 ₵+${add}`);
  }
  if (effect.draw_quest || effect.quest_two || effect.slot_plus) {
    // 퀘스트 수령 → rep + credit
    const cnt = effect.quest_two ? 2 : 1;
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + cnt, credit: (ps[playerIdx].resources.credit || 0) + cnt * 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `📜 P${playerIdx} · 퀘스트 수주 ★+${cnt}, ₵+${cnt * 2}`);
  }
  if (effect.deploy_trap || effect.trap || effect.trap_damage) {
    // v0.5.17: 함정 설치 → 방어 +1 + 렙+2 + 크레딧+2 (RIGGER 구제)
    const curPos = s.players[playerIdx].position;
    if (curPos && s.map[curPos]) {
      const newMap = { ...s.map, [curPos]: { ...s.map[curPos], fortified: (s.map[curPos].fortified || 0) + 1 } };
      const ps = [...s.players];
      ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2, credit: (ps[playerIdx].resources.credit || 0) + 2 } };
      s = { ...s, map: newMap, players: ps };
      s = logEntry(s, `🪤 P${playerIdx} · 함정 설치 (${curPos} 방어+1, ★+2, ₵+2)`);
    }
  }
  if (effect.cargo_haul || effect.supply_drop || effect.haul) {
    // 화물 운반 → 다량 credit + parts
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + 3, parts: (ps[playerIdx].resources.parts || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `📦 P${playerIdx} · 화물 운반 ₵+3, ⚙+2`);
  }
  if (effect.ambush) {
    // 매복 → 다음 공격 보너스 + rep
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 1 } };
    s = { ...s, players: ps, meta: { ...s.meta, attackBonusOnce: (s.meta.attackBonusOnce || 0) + 2 } };
    s = logEntry(s, `🎯 P${playerIdx} · 매복 준비 (다음 판정+2, ★+1)`);
  }
  if (effect.copy_bloc_card) {
    // 블록 카드 복사 → credit + rep
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + 4, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🎭 P${playerIdx} · 신분 위장 ₵+4, ★+2`);
  }
  if (effect.reward) {
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + effect.reward, rep: (ps[playerIdx].resources.rep || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `💰 P${playerIdx} · 보상 ₵+${effect.reward}, ★+1`);
  }
  // === CARBON/HELIX/AXIOM Bloc 미구현 효과 폴백 ===
  if (effect.zone_income_2x || effect.div_2x) {
    // v0.5.17: 자사 구역 수입 2배 → 크레딧 구역×4 + 부품+2 (CARBON 구제)
    const pNow = s.players[playerIdx];
    const ownCount = Object.values(s.map).filter(c => c.owner === playerIdx).length;
    const bonus = ownCount * 4;
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (pNow.resources.credit || 0) + bonus, parts: (pNow.resources.parts || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `⚡ P${playerIdx} [${p.specific}] · 수입 2배 ₵+${bonus} ⚙+2 (${ownCount}구역)`);
  }
  if (effect.zero_income || effect.block_resource) {
    // 적 1회 수입 차단 시뮬: 랜덤 경쟁자 크레딧 -3
    const rivals = s.players.filter((pp, i) => i !== playerIdx && !pp.defeated);
    if (rivals.length > 0) {
      const target = rand(rivals);
      const tIdx = s.players.indexOf(target);
      const ps = [...s.players];
      ps[tIdx] = { ...ps[tIdx], resources: { ...ps[tIdx].resources, credit: Math.max(0, (target.resources.credit || 0) - 3) } };
      s = { ...s, players: ps };
      s = logEntry(s, `⛔ P${playerIdx} [${p.specific}] · P${tIdx} 수입 봉쇄 ₵-3`);
      if (tIdx === 0 && playerIdx !== 0) s.meta = { ...s.meta, lastTargetedBy: { attacker: playerIdx, effectKey: 'block_resource', detail: `₵-3` } };
    }
  }
  if (effect.fortify || effect.veil_up) {
    // 방어 강화: 모든 자사 구역 fortified +1
    const newMap = { ...s.map };
    let count = 0;
    Object.entries(newMap).forEach(([coord, cell]) => {
      if (cell.owner === playerIdx) {
        newMap[coord] = { ...cell, fortified: (cell.fortified || 0) + 1 };
        count++;
      }
    });
    if (count > 0) {
      s = { ...s, map: newMap };
      s = logEntry(s, `🛡 P${playerIdx} [${p.specific}] · 자사 ${count}구역 방어+1`);
    }
  }
  if (effect.heal_all) {
    // HELIX 아군 전체 힐
    const ps = s.players.map(pp => pp.role === 'ghost' && !pp.defeated ? { ...pp, hp: Math.min(pp.maxHp, pp.hp + 3) } : pp);
    s = { ...s, players: ps };
    s = logEntry(s, `❤️ P${playerIdx} [${p.specific}] · Ghost 전원 HP+3`);
  }
  if (effect.ghost_extra_card || effect.contracts_boost) {
    // Ghost 카드 드로우 보너스 → 크레딧 + data
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + 3, data: (ps[playerIdx].resources.data || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `📄 P${playerIdx} [${p.specific}] · 계약 보너스 ₵+3, 📡+1`);
  }
  if (effect.same_round_trade || effect.flash_trade) {
    // AXIOM FLASH TRADE → 크레딧 보너스
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + 4 } };
    s = { ...s, players: ps };
    s = logEntry(s, `⚡ P${playerIdx} · 플래시 트레이드 ₵+4`);
  }
  if (effect.algorithm || effect.long_contract) {
    // 대형 계약: 크레딧 + 자산 연상
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + 6, influence: (ps[playerIdx].resources.influence || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `📊 P${playerIdx} · 대형 계약 ₵+6, 🎙+2`);
  }
  if (effect.bond) {
    // v0.5.18: 채권 → 크레딧 + 타 블록 주식 1주 자동 매수 (CARBON 자산 가속)
    const pNow = s.players[playerIdx];
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (pNow.resources.credit || 0) + effect.bond } };
    // 저가 타 블록 주식 1주 매수
    const blocs = Object.entries(s.stocks).filter(([bl]) => !(pNow.role === 'bloc' && pNow.specific === bl));
    blocs.sort((a, b) => a[1] - b[1]);
    if (blocs.length > 0) {
      const [bl, price] = blocs[0];
      if (ps[playerIdx].resources.credit >= price) {
        ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: ps[playerIdx].resources.credit - price }, stocks: { ...ps[playerIdx].stocks, [bl]: (ps[playerIdx].stocks[bl] || 0) + 1 } };
        s = { ...s, players: ps };
        s = logEntry(s, `🏦 P${playerIdx} · 채권 ₵+${effect.bond} + ${bl} 1주 자동매수`);
      } else {
        s = { ...s, players: ps };
        s = logEntry(s, `🏦 P${playerIdx} · 채권 ₵+${effect.bond}`);
      }
    } else {
      s = { ...s, players: ps };
      s = logEntry(s, `🏦 P${playerIdx} · 채권 ₵+${effect.bond}`);
    }
  }
  if (effect.destroy_zone) {
    // IRONWALL SCORCHED — 타 블록 구역 1곳 파괴
    const targets = Object.entries(s.map).filter(([c, cell]) => cell.owner !== null && cell.owner !== undefined && cell.owner !== playerIdx);
    if (targets.length > 0) {
      const [coord, cell] = rand(targets);
      const targetP = s.players[cell.owner];
      const newMap = { ...s.map, [coord]: { ...cell, owner: null, destroyed: true } };
      s = { ...s, map: newMap };
      s = logEntry(s, `💥 P${playerIdx} [${p.specific}] · ${coord} 파괴 (P${cell.owner} ${targetP.specific})`);
      if (cell.owner === 0 && playerIdx !== 0) s.meta = { ...s.meta, lastTargetedBy: { attacker: playerIdx, effectKey: 'destroy_zone', detail: `${coord} 파괴` } };
    }
  }
  if (effect.remove_scandals || effect.clear_ghost_wanted) {
    // 평판 청소 → 자신 or 아군 쿨
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🧹 P${playerIdx} · 평판 청소 ★+2`);
  }

  // === v0.5.13: BLADE/MOLE/RIGGER 미구현 효과 폴백 ===
  // BLADE — 처형·저항 계열
  if (effect.execute) {
    // 처형: 즉시 렙+4 + 수배+1 (강력한 hit)
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 4 }, wanted: (ps[playerIdx].wanted || 0) + 1 };
    s = { ...s, players: ps };
    s = logEntry(s, `🔪 P${playerIdx} · 처형 · ★+4, 수배+1`);
  }
  if (effect.frenzy || effect.atk_per_hp) {
    // 광폭화: 남은 HP 비례 보너스 공격 → 렙+2 + 수배+1
    const curP = s.players[playerIdx];
    const bonus = Math.floor((curP.hp / curP.maxHp) * 3);
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + bonus + 1 }, wanted: (ps[playerIdx].wanted || 0) + 1 };
    s = { ...s, players: ps };
    s = logEntry(s, `🩸 P${playerIdx} · 광폭 (HP%) · ★+${bonus+1}`);
  }
  if (effect.hp_to_1 || effect.last_stand) {
    // 최후 저항: HP 1까지 낮추고 대신 렙+5 수배+2
    const curP = s.players[playerIdx];
    if (curP.hp > 1) {
      const ps = [...s.players];
      ps[playerIdx] = { ...ps[playerIdx], hp: 1, resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 5 }, wanted: (ps[playerIdx].wanted || 0) + 2 };
      s = { ...s, players: ps };
      s = logEntry(s, `⚰️ P${playerIdx} · 최후 저항 · HP→1, ★+5`);
    }
  }
  if (effect.negate || effect.shield || effect.human_shield) {
    // 방어: HP 회복 + 한 번 판정 감면
    const curP = s.players[playerIdx];
    const healed = Math.min(curP.maxHp, curP.hp + 2);
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], hp: healed };
    s = { ...s, players: ps };
    s = logEntry(s, `🛡 P${playerIdx} · 방어 태세 · HP+2 (→${healed})`);
  }
  if (effect.point_blank || effect.surprise) {
    // 근거리·기습: 렙+2 + 크레딧+2
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2, credit: (ps[playerIdx].resources.credit || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🎯 P${playerIdx} · 근거리 공격 · ★+2, ₵+2`);
  }
  // MOLE — 내부 침투 계열
  if (effect.peek_bloc || effect.steal_card) {
    // 블록 내부 엿보기 → 렙+3 + 크레딧+4 (v0.5.14 강화)
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 3, credit: (ps[playerIdx].resources.credit || 0) + 4 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🕵 P${playerIdx} · 내부 엿보기 · ★+3, ₵+4`);
  }
  if (effect.bloc_resource || effect.vote_flip) {
    // Bloc 자원 탈취·투표 조작 → 렙+4 + 크레딧+5 (v0.5.14 강화)
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 4, credit: (ps[playerIdx].resources.credit || 0) + 5 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🗳 P${playerIdx} · Bloc 자원/투표 조작 · ★+4, ₵+5`);
  }
  if (effect.frame || effect.swap_blame) {
    // 누명 씌우기 → 수배-2 + 렙+3 (v0.5.14 강화)
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], wanted: Math.max(0, (ps[playerIdx].wanted || 0) - 2), resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 3 } };
    s = { ...s, players: ps };
    s = logEntry(s, `👺 P${playerIdx} · 누명 · 수배-2, ★+3`);
  }
  if (effect.infiltrate || effect.disguise || effect.bypass_veil) {
    // 침투: 지도 3R 노출 + 렙+1
    s = { ...s, meta: { ...s.meta, mapReveal: (s.meta.mapReveal || 0) + 3 } };
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🎭 P${playerIdx} · 위장 침투 · 지도 3R 노출, ★+1`);
  }
  if (effect.scandal || effect.stock_dmg) {
    // 스캔들 심기 → 타겟 블록 주가-2 + 렙+2
    const blocs = Object.keys(s.stocks);
    const pick = rand(blocs);
    const newStocks = { ...s.stocks, [pick]: Math.max(1, s.stocks[pick] - 2) };
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, stocks: newStocks, players: ps };
    s = logEntry(s, `💣 P${playerIdx} · ${pick} 스캔들 · 주가-2, ★+2`);
  }
  if (effect.permanent_clear) {
    // 영구 흔적 삭제: 수배 완전 초기화 + 렙+2
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], wanted: 0, resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🧹 P${playerIdx} · 영구 삭제 · 수배→0, ★+2`);
  }
  // RIGGER — 기술·제작 계열
  if (effect.emp_pulse || effect.tech_breach) {
    // EMP/해킹: 타겟 주가-3 + 데이터+2 + 렙+2 (v0.5.14)
    const blocs = Object.keys(s.stocks);
    const pick = rand(blocs);
    const newStocks = { ...s.stocks, [pick]: Math.max(1, s.stocks[pick] - 3) };
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, data: (ps[playerIdx].resources.data || 0) + 2, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, stocks: newStocks, players: ps };
    s = logEntry(s, `⚡ P${playerIdx} · EMP/브리치 · ${pick} 주가-3, 📡+2, ★+2`);
  }
  if (effect.field_craft || effect.jury_rig) {
    // 현장 제작: 부품+4 + 무기+2 + 렙+2 (v0.5.14 강화)
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, parts: (ps[playerIdx].resources.parts || 0) + 4, weapons: (ps[playerIdx].resources.weapons || 0) + 2, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🔧 P${playerIdx} · 현장 제작 · ⚙+4, 🔩+2, ★+2`);
  }
  if (effect.shield_gen || effect.drone_swarm || effect.overclock) {
    // 드론·차폐: 다음 판정 +2 + 렙+3 (v0.5.14 강화)
    s = { ...s, meta: { ...s.meta, attackBonusOnce: (s.meta.attackBonusOnce || 0) + 2 } };
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 3 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🛰 P${playerIdx} · 드론/차폐 · 다음 판정+2, ★+3`);
  }
  if (effect.disable_tl || effect.force_tl_down) {
    // TL 방해 → 랜덤 Bloc TL 1 하락 + 렙+3
    const rivalBlocs = s.players.filter((pp, i) => i !== playerIdx && !pp.defeated && pp.role === 'bloc' && pp.tl > 1);
    if (rivalBlocs.length > 0) {
      const target = rand(rivalBlocs);
      const tIdx = s.players.indexOf(target);
      const ps = [...s.players];
      ps[tIdx] = { ...ps[tIdx], tl: Math.max(1, (ps[tIdx].tl || 1) - 1) };
      ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 3 } };
      s = { ...s, players: ps };
      s = logEntry(s, `📉 P${playerIdx} · P${tIdx} TL 방해 (→${ps[tIdx].tl}), ★+3`);
    }
  }
  if (effect.temp_tl) {
    // 일시 TL+1 → 렙+2
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `⚡ P${playerIdx} · 일시 TL+1, ★+2`);
  }
  if (effect.transfer_ally || effect.fuel) {
    // 보급·연료 → 크레딧+2 + 부품+1
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + 2, parts: (ps[playerIdx].resources.parts || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `⛽ P${playerIdx} · 보급 · ₵+2, ⚙+1`);
  }
  if (effect.untrack || effect.shortcut || effect.ignore_obstacles || effect.ignore_all || effect.move_3_nowalls || effect.move_any || effect.teleport) {
    // 경로 우회 → 렙+1 + 수배-1
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], wanted: Math.max(0, (ps[playerIdx].wanted || 0) - 1), resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🚶 P${playerIdx} · 경로 우회 · 수배-1, ★+1`);
  }
  if (effect.leave_fire || effect.burn_behind || effect.smuggle) {
    // 흔적 남기기/밀수 → 크레딧+3 + 렙+1
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: (ps[playerIdx].resources.credit || 0) + 3, rep: (ps[playerIdx].resources.rep || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🔥 P${playerIdx} · 밀수/방화 · ₵+3, ★+1`);
  }
  if (effect.break_veil) {
    // 베일 해제 → 데이터+1 + 렙+1
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, data: (ps[playerIdx].resources.data || 0) + 1, rep: (ps[playerIdx].resources.rep || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🔓 P${playerIdx} · 베일 해제 · 📡+1, ★+1`);
  }
  if (effect.force_enter) {
    // 강제 진입 → 크레딧+1 + 렙+2
    const ps = [...s.players];
    ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, rep: (ps[playerIdx].resources.rep || 0) + 2 } };
    s = { ...s, players: ps };
    s = logEntry(s, `🚪 P${playerIdx} · 강제 진입 · ★+2`);
  }

  // === Bloc 신규 효과들 ===
  // 임의 블록 N주 자동 매수 (저가 순)
  if (effect.stock_buy_any) {
    const pNow = s.players[playerIdx];
    const blocs = Object.entries(s.stocks).filter(([bl]) => !(pNow.role === 'bloc' && pNow.specific === bl));
    blocs.sort((a, b) => a[1] - b[1]);
    let bought = 0;
    let newPlayerStocks = { ...pNow.stocks };
    let remainingCredit = pNow.resources.credit || 0;
    for (const [bl, price] of blocs) {
      while (bought < effect.stock_buy_any && remainingCredit >= price) {
        newPlayerStocks[bl] = (newPlayerStocks[bl] || 0) + 1;
        remainingCredit -= price;
        bought++;
      }
      if (bought >= effect.stock_buy_any) break;
    }
    if (bought > 0) {
      const ps = [...s.players];
      ps[playerIdx] = { ...ps[playerIdx], resources: { ...ps[playerIdx].resources, credit: remainingCredit }, stocks: newPlayerStocks };
      s = { ...s, players: ps };
      s = logEntry(s, `📈 P${playerIdx} [${p.specific}] · ${bought}주 자동 매수 (잔액 ₵${remainingCredit})`);
    } else {
      s = logEntry(s, `📈 P${playerIdx} · 매수 실패 (₵ 부족)`);
    }
  }

  // 현위치 요새화 — 방어력 +1 플래그 (단순화: 다음 레이드 threshold +1)
  if (effect.fortify_here) {
    const pNow = s.players[playerIdx];
    const cellHere = s.map[pNow.position];
    if (cellHere && cellHere.owner === playerIdx) {
      const newMap = { ...s.map, [pNow.position]: { ...cellHere, fortified: (cellHere.fortified || 0) + 1 } };
      s = { ...s, map: newMap };
      s = logEntry(s, `🛡 P${playerIdx} [${p.specific}] · ${pNow.position} 요새화 (방어 +1)`);
    } else {
      s = logEntry(s, `🛡 P${playerIdx} · 요새화 실패 (자사 구역 아님)`);
    }
  }

  // 용병 고용 — 랜덤 Bloc 구역(자사 제외) 주가 -3
  if (effect.hire_raid) {
    const targets = Object.entries(s.map).filter(([c, cell]) => cell.owner !== null && cell.owner !== undefined && cell.owner !== playerIdx && s.players[cell.owner]?.role === 'bloc');
    if (targets.length > 0) {
      const [coord, cell] = rand(targets);
      const targetBloc = s.players[cell.owner].specific;
      const targetIdx = cell.owner;
      const newStocks = { ...s.stocks, [targetBloc]: Math.max(1, s.stocks[targetBloc] - 3) };
      const newMap = { ...s.map, [coord]: { ...cell, owner: null } };
      s = { ...s, stocks: newStocks, map: newMap };
      s = logEntry(s, `🗡 P${playerIdx} [${p.specific}] · 용병 고용 → ${coord} ${targetBloc} 타격 (주가-3, 중립화)`);
      if (targetIdx === 0 && playerIdx !== 0) {
        s.meta = { ...s.meta, lastTargetedBy: { attacker: playerIdx, effectKey: 'hire_raid', detail: `${coord} 잃음, 주가-3` } };
      }
    } else {
      s = logEntry(s, `🗡 P${playerIdx} · 용병 고용 실패 (타 Bloc 구역 없음)`);
    }
  }

  // Ghost 전원 수배 +N
  if (effect.ghost_wanted_all) {
    const ps = s.players.map(pp => pp.role === 'ghost' && !pp.defeated ? { ...pp, wanted: (pp.wanted || 0) + effect.ghost_wanted_all } : pp);
    s = { ...s, players: ps };
    s = logEntry(s, `🚨 P${playerIdx} [${p.specific}] · Ghost 전원 수배 +${effect.ghost_wanted_all}`);
    if (s.players[0].role === 'ghost' && playerIdx !== 0) {
      s.meta = { ...s.meta, lastTargetedBy: { attacker: playerIdx, effectKey: 'ghost_wanted_all', detail: `수배 +${effect.ghost_wanted_all}` } };
    }
  }

  return s;
}

// 카드 한글 이름 매핑 (표시용)
const CARD_NAMES_KR = {
  PORT_SCAN: '포트 스캔', DATA_SPIKE: '데이터 스파이크', GHOST_ACCESS: '유령 접속',
  MESH_DIVE: '메시 다이브', ICE_BREAK: '아이스 브레이크', PROXY_RELAY: '프록시 릴레이',
  STOCK_CRASH: '주식 크래시', NEURAL_OVRD: '뉴럴 오버라이드', ZERO_TRACE: '제로 트레이스',
  BASIC_MOVE_C: '기본 이동', BASIC_MOVE_B: '기본 이동', BASIC_MOVE_R: '기본 이동',
  BASIC_MOVE_RG: '기본 이동', BASIC_MOVE_D: '기본 이동', BASIC_MOVE_M: '기본 이동',
  QUICK_DRAW: '퀵 드로우', SUPPRESS_FIRE: '제압 사격', BREACHER: '브리처',
  CONTRACT_KILL: '계약 처형', HUMAN_SHIELD: '인간 방패', DOUBLE_TAP: '더블 탭',
  POINT_BLANK: '포인트 블랭크', BERSERKER: '버서커', LAST_STAND: '최후 저항',
  NETWORK: '네트워크', BACK_DEAL: '백 딜', BLACKMAIL: '블랙메일',
  MIDDLE_DEAL: '중개 딜', INFO_BROKER: '정보 브로커', CRISIS_TALK: '위기 협상',
  DBL_CONTRACT: '이중 계약', POKER_FACE: '포커 페이스', BURN_BRIDGE: '다리 소각',
  DRONE_SCAN: '드론 스캔', TRAP_WIRE: '트랩 와이어', EMP_PULSE: 'EMP 펄스',
  OVERCLOCK: '오버클록', FIELD_CRAFT: '현장 제작', SHIELD_GEN: '실드 제너레이터',
  DRONE_SWARM: '드론 스웜', JURY_RIG: '즉석 수리', TECH_BREACH: '테크 브리치',
  FAST_TRAVEL: '고속 이동', SUPPLY_CONV: '보급 호송', AMBUSH: '매복',
  STORM_RUSH: '스톰 러시', BACKROADS: '뒷길', SCORCH_PATH: '화염 자취',
  CARGO_HAUL: '화물 운송', IRON_WHEELS: '강철 바퀴', GHOST_RUN: '유령 질주',
  INNER_DOCS: '내부 문서', AUTH_ABUSE: '권한 남용', CLEAN_SLATE: '백지화',
  FALSE_FLAG: '가짜 깃발', DISGUISE: '위장', BOARD_MANIP: '이사회 조작',
  LEAK: '유출', DEEP_COVER: '심층 잠입', ID_COLLAPSE: '정체성 붕괴',
  SHADOW_FILE: '섀도우 파일', LEVERAGE: '레버리지', VEIL_DEPLOY: '베일 전개',
  GHOST_PROTOCOL: '유령 프로토콜', DATA_WIPE: '데이터 삭제', ZERO_RECORD: '제로 레코드',
  FORWARD_STRIKE: '전진 타격', ARMS_SUPPLY: '무기 보급', FORWARD_BASE: '전방 기지',
  MARTIAL_LAW: '계엄령', MERCENARY_SURGE: '용병 증원', SCORCHED_EARTH: '초토화',
  FIELD_SPLICE: '필드 스플라이스', NEURAL_IFACE: '신경 인터페이스', AUGMENTATION: '증강',
  QUARANTINE: '격리', HARVEST: '수확', CLONE_DECOY: '클론 디코이',
  PREDICTION_E: '예측 엔진', FLASH_CRASH: '플래시 크래시', ALGO_LOCK: '알고리즘 잠금',
  FLASH_TRADE: '플래시 트레이드', SURVEILLANCE: '감시', SYS_TAKEOVER: '시스템 탈취',
  POWER_SURGE: '전력 서지', BLACKOUT_C: '블랙아웃', PIPELINE_LOCK: '파이프라인 봉쇄',
  INFRA_BOND: '인프라 채권', HOSTILE_DIV: '적대 배당', LEGACY_CONTRACT: '레거시 계약',
  BOARDROOM_MOVE: '이사회 이동', MARKET_TRADE: '시장 거래', HIRE_GHOST: '고스트 고용',
  ZONE_FORTIFY: '구역 요새화', EXPAND_OP: '작전 확장', INVEST_HEAVY: '대규모 투자',
  COUNTER_INTEL: '방첩', CRISIS_RESPONSE: '위기 대응', HOSTILE_BID: '적대적 매수',
  SECURITY_SWEEP: '치안 소탕',
};

function cardDisplayName(card) {
  if (!card) return '?';
  return CARD_NAMES_KR[card.id] || card.name || '?';
}

function logEntry(s, msg) {
  return { ...s, log: [...s.log, { round: s.meta.round, phase: s.meta.phase, message: msg }].slice(-150) };
}

function checkVictoryByPoints(state) {
  // Find winner by asset (bloc) or rep (ghost)
  let winner = null;
  let topAsset = -Infinity;
  let topRep = -Infinity;
  state.players.forEach((p, i) => {
    if (p.role === 'bloc') {
      const av = assetValue(p, state.stocks, state);
      if (av > topAsset) { topAsset = av; winner = { idx: i, reason: `시간 종료 · 최고 자산 ${av}` }; }
    } else {
      if (p.resources.rep > topRep) { topRep = p.resources.rep; winner = { idx: i, reason: `시간 종료 · 최고 렙 ${p.resources.rep}` }; }
    }
  });
  return { ...state, meta: { ...state.meta, gameOver: true, winner: winner?.idx, winReason: winner?.reason || '무승부' } };
}

function checkInstantVictory(state) {
  // Tutorial victory conditions (v0.5.10 headless-sim balance pass)
  // Bloc: asset >= 55
  // Ghost 듀얼 경로: (a) 렙 13 + 레이드 2  OR  (b) 렙 18 (비전투 평판 루트 — BROKER/CIPHER/MOLE 구제)
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (p.defeated) continue;
    if (p.role === 'bloc') {
      const av = assetValue(p, state.stocks, state);
      if (av >= 55) {
        return { ...state, meta: { ...state.meta, gameOver: true, winner: i, winReason: `Bloc 승리: 자산 ${av} (≥55)` } };
      }
    } else {
      const rep = p.resources.rep || 0;
      const raids = state.meta.raidsThisGame[i] || 0;
      if (rep >= 16 && raids >= 2) {
        return { ...state, meta: { ...state.meta, gameOver: true, winner: i, winReason: `Ghost 승리 (전투 루트): 렙 ${rep} + 레이드 ${raids}회` } };
      }
      if (rep >= 24) {
        return { ...state, meta: { ...state.meta, gameOver: true, winner: i, winReason: `Ghost 승리 (평판 루트): 렙 ${rep} (≥24)` } };
      }
    }
  }
  return state;
}

// ============================================================================
// AI (Score-based greedy)
// ============================================================================

function botPickCards(state, playerIdx) {
  const p = state.players[playerIdx];
  if (p.hand.length === 0) return [];

  if (p.role === 'ghost') {
    // Pick 2 cards if possible
    const scored = p.hand.map(cid => ({ cid, score: scoreGhostCard(state, playerIdx, cid) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, Math.min(2, p.hand.length)).map(x => x.cid);
  } else {
    // Bloc: 2장 선택 (상위 2장)
    const scored = p.hand.map(cid => ({ cid, score: scoreBlocCard(state, playerIdx, cid) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, Math.min(2, p.hand.length)).map(x => x.cid);
  }
}

function scoreGhostCard(state, pIdx, cid) {
  const c = getCard(cid);
  const p = state.players[pIdx];
  if (!c) return 0;
  let score = 10;

  const rep = p.resources.rep || 0;
  const raids = state.meta.raidsThisGame?.[pIdx] || 0;
  const repNeeded = Math.max(0, 16 - rep);
  const raidNeeded = Math.max(0, 2 - raids);
  const closeToWin = repNeeded <= 3 && raidNeeded <= 1;

  // 두 반쪽을 합쳐 카드 가치 평가 (하나만 쓰겠지만 잠재 기여도 둘 다 합산 X, 최대값)
  const halves = [c.top, c.bot].filter(Boolean);
  for (const h of halves) {
    // 공격·이동: 기존 점수
    if (h.atk || h.atk_x2 || h.atk_x3_retort) score += (p.hp > p.maxHp * 0.5 ? 12 : -5);
    if (h.move) score += p.role === 'ghost' ? (raidNeeded > 0 ? 8 : 3) : 8;
    // 속성 생성
    if (h.gen) score += 4;
    // === 신규: 폴백 보상 효과들 점수화 (BROKER/CIPHER/MOLE 살리기) ===
    if (h.extort) score += h.extort * 5;       // rep + credit
    if (h.contact) score += h.contact * 3;
    if (h.blackmarket) score += h.blackmarket * 4;
    if (h.peek_objective || h.sell_info) score += 6;  // rep + data
    if (h.peek_hand || h.peek_full || h.peek_news) score += 3;
    if (h.scout || h.scout_all || h.drone_scan) score += 2;
    if (h.broker_fee) score += h.broker_fee;  // 중개 수수료는 credit + rep
    if (h.stop_combat || h.cancel_card || h.cancel_action) score += 7;  // 개입 → rep +2
    if (h.invisible || h.invisible_2r || h.stealth || h.hide_actions || h.hide_actions_1r) score += (p.wanted > 2 ? 8 : 3);
    if (h.clear_wanted || h.burn_identity) score += (p.wanted > 3 ? 10 : 1);
    if (h.heal) score += (p.hp < p.maxHp * 0.5 ? 10 : 2);
    if (h.stat_boost) score += h.stat_boost * 2;
    if (h.ambush) score += 6;
    if (h.copy_bloc_card) score += 8;
    if (h.reward) score += h.reward;
    if (h.draw_quest || h.quest_two) score += 5;
    if (h.cargo_haul || h.supply_drop || h.haul) score += 4;
    if (h.deploy_trap || h.trap) score += 3;
    if (h.swap || h.swap_ratio) score += 2;
    // === v0.5.13: BLADE/MOLE/RIGGER 효과 점수 ===
    if (h.execute) score += 12;            // 즉시 렙+4
    if (h.frenzy || h.atk_per_hp) score += (p.hp > p.maxHp * 0.6 ? 10 : 3);
    if (h.hp_to_1 || h.last_stand) score += (p.hp > p.maxHp * 0.7 ? 8 : -5);
    if (h.negate || h.shield || h.human_shield) score += (p.hp < p.maxHp * 0.5 ? 8 : 2);
    if (h.point_blank || h.surprise) score += 6;
    if (h.peek_bloc || h.steal_card) score += 7;
    if (h.bloc_resource || h.vote_flip) score += 10;
    if (h.frame || h.swap_blame) score += (p.wanted > 2 ? 8 : 4);
    if (h.infiltrate || h.disguise || h.bypass_veil) score += 4;
    if (h.scandal || h.stock_dmg) score += 7;
    if (h.permanent_clear) score += (p.wanted > 3 ? 12 : 2);
    if (h.emp_pulse || h.tech_breach) score += 8;
    if (h.field_craft || h.jury_rig) score += 6;
    if (h.shield_gen || h.drone_swarm || h.overclock) score += 5;
    if (h.disable_tl || h.force_tl_down) score += 9;
    if (h.temp_tl) score += 5;
    if (h.transfer_ally || h.fuel) score += 3;
    if (h.leave_fire || h.burn_behind || h.smuggle) score += 4;
    if (h.break_veil) score += 3;
    if (h.force_enter) score += 4;
  }

  // LOSS 회피
  if (c.loss) {
    if (p.hp < p.maxHp * 0.3) score -= 15;
    else score += (c.bot?.atk || 0);
  }

  // 승리 근접 시 공격·이동 선호
  if (closeToWin) {
    if (halves.some(h => h.atk || h.move || h.extort)) score += 10;
  }

  return score + Math.random() * 3;
}

function scoreBlocCard(state, pIdx, cid) {
  const c = getCard(cid);
  const p = state.players[pIdx];
  if (!c) return 0;
  let score = 10;

  // Prefer own TL or lower
  if (c.tl <= p.tl) score += 15;
  if (c.tl > p.tl) score -= 20;

  // === v0.5.11: 신규 구현 효과들 점수 ===
  const m = c.main || {};
  if (m.move) score += 8;
  if (m.deploy_op) score += 12;
  if (m.hire_raid) score += 10;
  if (m.stock_buy_any) score += m.stock_buy_any * 3;
  if (m.crash_target || m.destroy_zone) score += 8;
  if (m.zone_income_2x || m.div_2x) score += 10;
  if (m.zero_income || m.block_resource) score += 6;
  if (m.fortify || m.veil_up || m.fortify_here) score += 5;
  if (m.heal_all) score += 7;
  if (m.same_round_trade || m.flash_trade) score += 6;
  if (m.algorithm || m.long_contract) score += 10;
  if (m.bond) score += m.bond;
  if (m.ghost_wanted_all) score += 5;
  if (m.heat && m.heat < 0) score += 5;
  if (m.peek_news || m.scout_all) score += 4;
  if (m.credit) score += m.credit;

  // Resource efficiency
  const costLen = c.main?.cost?.length || 0;
  if (costLen > 0) {
    let payable = true;
    const poolCopy = { ...(p.pool || {}) };
    for (const a of c.main.cost) {
      if (poolCopy[a] > 0) poolCopy[a]--;
      else if (poolCopy.GRID > 0) poolCopy.GRID--;
      else { payable = false; break; }
    }
    if (!payable) score -= 30;
  }

  // Reward aggressive cards for attackers
  if (c.main?.deploy_op || c.main?.heat) score += 10;

  return score + Math.random() * 2;
}
