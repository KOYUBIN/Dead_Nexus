'use strict';
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ROOT='/home/user/Dead_Nexus',VENDOR='/home/user/Dead_Nexus/sim-e2e/vendor';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function srv(){return new Promise(r=>{const s=http.createServer((q,res)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const fp=path.join(ROOT,p);if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);res.end('nf');return;}res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream'});fs.createReadStream(fp).pipe(res);});s.listen(0,'127.0.0.1',()=>r(s));});}
function tests(){
  const out=[];const ok=(n,c,extra)=>out.push({n,pass:!!c,extra});
  const B=window.buildInitial,GVG=window.getVictoryGoals,SR=window.scenarioRule,ETS=window.euro_totalShares;
  // ---- S02 ----
  const s2=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'VANTA',humans:null,scenario:'S02'});
  const nonNpc2=s2.players.filter(p=>!p.isNpc).length;
  const g2=GVG(s2);
  const base=100,adj=(nonNpc2===2?-2:nonNpc2===3?-1:0);
  ok('S02 meta.scenario=S02',s2.meta.scenario==='S02');
  ok('S02 mnaNoCooldown=true',s2.meta.mnaNoCooldown===true);
  ok('S02 startHeat=3',s2.heat===3);
  ok('S02 allBloc (all seats bloc)',s2.players.filter(p=>!p.isNpc).every(p=>p.role==='bloc'));
  ok('S02 blocAssetBonus=175',SR(s2,'blocAssetBonus',0)===175); ok('S02 blocAsset = base+adj+bonus',g2.blocAsset===base+adj+SR(s2,'blocAssetBonus',0),`got ${g2.blocAsset} (base ${base} adj ${adj} bonus ${SR(s2,'blocAssetBonus',0)})`);
  ok('S02 scenarioRule mnaFloat=3',SR(s2,'mnaFloat',10)===3);
  ok('S02 scenarioRule mnaSerial=true',SR(s2,'mnaSerial',false)===true);
  ok('S02 scenarioRule mnaBotProb=1.0',SR(s2,'mnaBotProb',0.5)===1.0);
  ok('S02 scenarioRule mnaDesignateCredit=8',SR(s2,'mnaDesignateCredit',14)===8);
  // euro_totalShares uses float 3 for S02: bloc VANTA shares held by seats + 3
  const heldV=s2.players.reduce((a,p)=>a+((p.stocks&&p.stocks.VANTA)||0),0);
  ok('S02 euro_totalShares(VANTA)=held+3',ETS(s2,'VANTA')===heldV+3,`got ${ETS(s2,'VANTA')} held ${heldV}`);
  // ---- S03 ----
  const s3=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:'S03'});
  const real=s3.players.filter(p=>!p.isNpc);
  const realBloc=real.filter(p=>p.role==='bloc');
  const realGhost=real.filter(p=>p.role==='ghost');
  const npcBloc=s3.players.filter(p=>p.isNpc&&p.role==='bloc');
  const g3=GVG(s3);
  ok('S03 meta.scenario=S03',s3.meta.scenario==='S03');
  ok('S03 startHeat=4',s3.heat===4);
  ok('S03 startStock=12 (all blocs)',['VANTA','IRONWALL','HELIX','AXIOM','CARBON'].every(b=>s3.stocks[b]===12),JSON.stringify(s3.stocks));
  ok('S03 lastStockSnapshot=12',s3.meta.lastStockSnapshot.VANTA===12);
  ok('S03 exactly 1 real Bloc',realBloc.length===1,`got ${realBloc.length}`);
  ok('S03 real Ghosts >=2',realGhost.length>=2,`got ${realGhost.length}`);
  ok('S03 NPC Bloc count=4',npcBloc.length===4,`got ${npcBloc.length}`);
  ok('S03 ghost rep bonus (rep=8: base5+3)',realGhost.every(p=>p.resources.rep>=8),`sample ${realGhost[0]&&realGhost[0].resources.rep}`);
  ok('S03 ghost credit bonus (+2 over 11x11 base)',realGhost.every(p=>p.resources.credit>=12),`sample ${realGhost[0]&&realGhost[0].resources.credit}`);
  ok('S03 real bloc influence +2 (=5)',realBloc[0]&&realBloc[0].resources.influence===5,`got ${realBloc[0]&&realBloc[0].resources.influence}`);
  ok('S03 ghostRepBattle=25',g3.ghostRepBattle===25,`got ${g3.ghostRepBattle}`);
  ok('S03 ghostRaids=3',g3.ghostRaids===3,`got ${g3.ghostRaids}`);
  ok('S03 SCENARIOS unlocked (selectable)',SR(s3,'ghostRising',false)===true);
  // ---- S04 계엄의 밤 (v6.21 부분 구현 해금 — 모바일 경찰 NPC 엔진) ----
  const s4=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'CIPHER',humans:null,scenario:'S04'});
  const S04Z=['F3','C6','I6','F9'];
  ok('S04 unlocked (locked=false)',SR(s4,'locked',null)===false);
  ok('S04 startHeat=7',s4.heat===7);
  ok('S04 startWeaponsAll=-2 rule',SR(s4,'startWeaponsAll',0)===-2);
  const s4police=(s4.meta.npcs||[]).filter(n=>n.type==='police');  // v6.23: npcs 는 police+captive 혼재 → police 필터
  ok('S04 police=3 at start',s4police.length===3,`got ${s4police.length}`);
  ok('S04 police type hp8 atk4',s4police.every(n=>n.type==='police'&&n.hp===8&&n.atk===4),JSON.stringify(s4police));
  ok('S04 police positions ⊆ F3/C6/I6/F9',s4police.every(n=>S04Z.includes(n.position)),JSON.stringify(s4police.map(n=>n.position)));
  ok('S04 police positions distinct',new Set(s4police.map(n=>n.position)).size===3);
  ok('S04 policeSpawned=true (no heat9 double-spawn)',s4.meta.policeSpawned===true);
  // ---- NPC 엔진: 스폰 헬퍼 ----
  const spEnts=window.spawnPoliceEntities(s4.map,S04Z,3);
  ok('spawnPoliceEntities count=3',spEnts.length===3);
  ok('spawnPoliceEntities all police hp8/atk4/maxHp8',spEnts.every(n=>n.type==='police'&&n.hp===8&&n.atk===4&&n.maxHp===8));
  ok('spawnPoliceEntities positions from candidates',spEnts.every(n=>S04Z.includes(n.position)));
  // ---- NPC 엔진: 매 라운드 이동 (S04 patrolGuard=구금 NPC 로 수호 순찰, 여전히 1칸) ----
  const isAdj=(a,b)=>{const c1=a.charCodeAt(0)-65,r1=+a.slice(1),c2=b.charCodeAt(0)-65,r2=+b.slice(1);return Math.abs(c1-c2)+Math.abs(r1-r2)===1;};
  const beforePolById=Object.fromEntries(s4police.map(n=>[n.id,n.position]));
  const beforeCapById=Object.fromEntries((s4.meta.npcs||[]).filter(n=>n.type==='captive').map(n=>[n.id,n.position]));
  // P0(ghost)를 어떤 경찰의 1칸 반경에도 없는 빈 칸으로 옮겨 이동 검증에 조우 노이즈 배제
  const s4occ=new Set((s4.meta.npcs||[]).map(n=>n.position));
  const s4free=Object.keys(s4.map).find(c=>s4.map[c].zone!=='nex'&&!s4occ.has(c)&&!s4police.some(pp=>isAdj(c,pp.position)))||s4.players[0].position;
  const s4mv={...s4,players:s4.players.map((p,i)=>i===0?{...p,position:s4free}:p)};
  const mv=window.updatePoliceForRound(s4mv);
  const mvPol=(mv.meta.npcs||[]).filter(n=>n.type==='police');
  const mvCap=(mv.meta.npcs||[]).filter(n=>n.type==='captive');
  ok('movement keeps 3 police on valid cells',mvPol.length===3&&mvPol.every(n=>!!mv.map[n.position]));
  ok('movement = 1 adjacent step each police',mvPol.every(n=>isAdj(n.position,beforePolById[n.id])),`before ${JSON.stringify(beforePolById)} after ${JSON.stringify(mvPol.map(n=>[n.id,n.position]))}`);
  ok('movement captives stay fixed (비이동)',mvCap.length===5&&mvCap.every(n=>n.position===beforeCapById[n.id]));
  // ---- NPC 엔진: 조우 전투 — 승리 (Ghost atk 압도 → NPC 격파·렙+2·디스폰) ----
  const sg=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:'S01'});
  const gpos=sg.players[0].position;
  let win={...sg,meta:{...sg.meta,npcs:[{id:0,type:'police',position:gpos,hp:8,maxHp:8,atk:4}],policeKills:0,policeFights:0}};
  win={...win,players:win.players.map((p,i)=>i===0?{...p,stats:{...p.stats,atk:50},tracks:{}}:p)};
  const repB=win.players[0].resources.rep, hpB=win.players[0].hp;
  const wr=window.resolvePoliceCombat(win,0,0,'unit');
  ok('combat WIN despawns NPC',(wr.meta.npcs||[]).length===0);
  ok('combat WIN rep +2',wr.players[0].resources.rep===repB+2,`got ${wr.players[0].resources.rep} (before ${repB})`);
  ok('combat WIN policeKills=1',wr.meta.policeKills===1);
  ok('combat WIN ghost undamaged',wr.players[0].hp===hpB,`got ${wr.players[0].hp} (before ${hpB})`);
  // ---- NPC 엔진: 조우 전투 — 패배 (Ghost atk 열세 → NPC 잔존·applyDamage STEP F) ----
  let lose={...sg,meta:{...sg.meta,npcs:[{id:0,type:'police',position:sg.players[0].position,hp:8,maxHp:8,atk:4}],policeKills:0,policeFights:0}};
  lose={...lose,players:lose.players.map((p,i)=>i===0?{...p,stats:{...p.stats,atk:-10},tracks:{},hp:6,maxHp:6}:p)};
  const lr=window.resolvePoliceCombat(lose,0,0,'unit');
  ok('combat LOSE keeps NPC',(lr.meta.npcs||[]).some(n=>n.id===0));
  ok('combat LOSE NPC hp intact (8)',((lr.meta.npcs||[]).find(n=>n.id===0)||{}).hp===8);
  ok('combat LOSE policeFights=1',lr.meta.policeFights===1);
  ok('combat LOSE ghost STEP F respawn (hp≤3, 미격침)',lr.players[0].hp<=3&&lr.players[0].hp>=1&&!lr.players[0].defeated,`got hp ${lr.players[0].hp}`);
  // ---- NPC 엔진: 공권력 9 트리거 (코어 규칙, S01 포함) ----
  let h9={...sg,heat:9,meta:{...sg.meta,npcs:[],policeSpawned:false,policeKills:0,policeFights:0}};
  // P0 BLADE(F1)를 경찰 스폰과 겹치지 않게 원격 이동 — 스폰 검증에 조우 노이즈 배제
  h9={...h9,players:h9.players.map((p,i)=>i===0?{...p,position:'A1'}:p)};
  const h9r=window.updatePoliceForRound(h9);
  ok('heat9 spawns police (≥1) + policeSpawned',(h9r.meta.npcs||[]).length>=1&&h9r.meta.policeSpawned===true,`spawned ${(h9r.meta.npcs||[]).length}`);
  let h8={...sg,heat:8,meta:{...sg.meta,npcs:[],policeSpawned:false}};
  const h8r=window.updatePoliceForRound(h8);
  ok('heat8 no spawn (<9)',(h8r.meta.npcs||[]).length===0&&h8r.meta.policeSpawned===false);
  // ---- S01 회귀: NPC 엔진 비활성 (npcs 빈 배열) ----
  ok('S01 npcs empty (no police at start)',(sg.meta.npcs||[]).length===0&&sg.meta.policeSpawned===false);
  // ==== v6.23: S04 구출 퀘스트 (구금 NPC · docs/14 §S04) ====
  const RCR=window.resolveCaptiveRescue, SCE=window.spawnCaptiveEntities, FRT=window.findRescueTargetZone, SRH=window.scenRaidHeat, UPR=window.updatePoliceForRound;
  const s4caps=(s4.meta.npcs||[]).filter(n=>n.type==='captive');
  const s4pol=(s4.meta.npcs||[]).filter(n=>n.type==='police');
  ok('S04 captives=5 at start',s4caps.length===5,`got ${s4caps.length}`);
  ok('S04 npcs total=8 (3 police + 5 captive)',(s4.meta.npcs||[]).length===8,`got ${(s4.meta.npcs||[]).length}`);
  ok('S04 captive type + no combat fields',s4caps.every(n=>n.type==='captive'&&n.hp===undefined&&n.atk===undefined));
  ok('S04 captive ids ≥100 (police id 격리)',s4caps.every(n=>n.id>=100));
  ok('S04 captive positions distinct & non-nexus',new Set(s4caps.map(n=>n.position)).size===5&&s4caps.every(n=>s4.map[n.position]&&s4.map[n.position].zone!=='nex'));
  ok('S04 captive not colocated with police',s4caps.every(n=>!s4pol.some(p=>p.position===n.position)));
  ok('S04 rescue meta init (0/{}/{})',s4.meta.rescues===0&&JSON.stringify(s4.meta.rescuesByPlayer)==='{}'&&JSON.stringify(s4.meta.captiveBonusAwarded)==='{}');
  ok('S04 captiveStart=5 / patrolGuard=true / raidHeatBonus=1',SR(s4,'captiveStart',0)===5&&SR(s4,'patrolGuard',false)===true&&SR(s4,'raidHeatBonus',0)===1);
  // spawnCaptiveEntities 헬퍼
  const spCaps=SCE(s4.map,5,[]);
  ok('spawnCaptiveEntities count=5 type captive id≥100',spCaps.length===5&&spCaps.every(n=>n.type==='captive'&&n.id>=100));
  const exCoords=Object.keys(s4.map).filter(c=>s4.map[c].zone!=='nex').slice(0,3);
  ok('spawnCaptiveEntities excludes given coords',SCE(s4.map,5,exCoords).every(n=>!exCoords.includes(n.position)));
  // 개별 구출: ghost P0 를 구금 칸으로 → 디스폰 + ★+1 + 카운트 (경찰 제거)
  const capPos0=s4caps[0].position;
  const rs={...s4,players:s4.players.map((p,i)=>i===0?{...p,role:'ghost',defeated:false,position:capPos0}:p),meta:{...s4.meta,npcs:s4.meta.npcs.filter(n=>!(n.type==='police'&&n.position===capPos0))}};
  const repR0=rs.players[0].resources.rep;
  const rr=RCR(rs,0);
  ok('rescue despawns captive at tile',!(rr.meta.npcs||[]).some(n=>n.type==='captive'&&n.position===capPos0));
  ok('rescue rep +1 (개별 보상)',rr.players[0].resources.rep===repR0+1,`got ${rr.players[0].resources.rep} (before ${repR0})`);
  ok('rescue count 1/5',rr.meta.rescues===1&&(rr.meta.rescuesByPlayer||{})[0]===1);
  ok('rescue no all-bonus at 1',!(rr.meta.captiveBonusAwarded||{})[0]);
  // 경찰이 지키면 구출 보류 (경찰 우선 — state 불변)
  const guarded={...s4,players:s4.players.map((p,i)=>i===0?{...p,role:'ghost',position:'A1'}:p),meta:{...s4.meta,npcs:[{id:0,type:'police',position:'A1',hp:8,maxHp:8,atk:4},{id:100,type:'captive',position:'A1'}]}};
  ok('rescue blocked by police on tile (불변)',RCR(guarded,0)===guarded);
  // 전원 구출 보너스: 4→5번째 구출 시 개별 ★+1 + 전원 ★+10
  const capPosB=s4caps[1].position;
  const near5={...s4,players:s4.players.map((p,i)=>i===0?{...p,role:'ghost',position:capPosB}:p),meta:{...s4.meta,rescues:4,rescuesByPlayer:{0:4},captiveBonusAwarded:{},npcs:s4.meta.npcs.filter(n=>!(n.type==='police'&&n.position===capPosB))}};
  const repB0=near5.players[0].resources.rep;
  const b5=RCR(near5,0);
  ok('5th rescue count 5/5',b5.meta.rescues===5&&b5.meta.rescuesByPlayer[0]===5);
  ok('5th rescue rep +1+10 (개별+전원)',b5.players[0].resources.rep===repB0+11,`got ${b5.players[0].resources.rep} (before ${repB0})`);
  ok('5th rescue all-bonus awarded',b5.meta.captiveBonusAwarded[0]===true);
  // 보너스 1회성: 전원 달성 후 재구출은 개별 ★+1 만
  const capPosC=s4caps[2].position;
  const after5={...b5,players:b5.players.map((p,i)=>i===0?{...p,position:capPosC}:p),meta:{...b5.meta,npcs:(b5.meta.npcs||[]).filter(n=>!(n.type==='police'&&n.position===capPosC))}};
  const repC0=after5.players[0].resources.rep;
  ok('post-전원 재구출 rep +1 only (보너스 1회)',RCR(after5,0).players[0].resources.rep===repC0+1);
  // 레이드 공권력 +2 (scenRaidHeat)
  ok('S04 scenRaidHeat(1)=2 (레이드 성공 공권력+2)',SRH(s4,1)===2);
  ok('S01 scenRaidHeat(1)=1 (기본)',SRH(sg,1)===1);
  // findRescueTargetZone: 최근접 구금 NPC
  const frt=FRT(s4,capPos0);
  ok('findRescueTargetZone dist0 at unguarded captive tile',frt&&frt.dist===0&&frt.coord===capPos0);
  ok('S01 findRescueTargetZone null (captive 없음)',FRT(sg,sg.players[0].position)===null);
  // 경찰이 착석(수호)한 구금 NPC 는 봇 구출 목표에서 제외 (자살 우회 방지)
  const onlyGuarded={...s4,meta:{...s4.meta,npcs:[{id:0,type:'police',position:'A1',hp:8,maxHp:8,atk:4},{id:100,type:'captive',position:'A1'}]}};
  ok('findRescueTargetZone excludes police-guarded captive',FRT(onlyGuarded,'K11')===null);
  const mixGuard={...s4,meta:{...s4.meta,npcs:[{id:0,type:'police',position:'A1',hp:8,maxHp:8,atk:4},{id:100,type:'captive',position:'A1'},{id:101,type:'captive',position:'B1'}]}};
  ok('findRescueTargetZone picks unguarded over guarded',(FRT(mixGuard,'A2')||{}).coord==='B1');
  // 경찰 우선 순찰(patrolGuard): 경찰이 가장 가까운 구금 NPC 로 접근/착석
  const patrolS={...s4,players:s4.players.map((p,i)=>i===0?{...p,position:'K11'}:p),meta:{...s4.meta,npcs:[{id:0,type:'police',position:'A2',hp:8,maxHp:8,atk:4},{id:100,type:'captive',position:'A1'}]}};
  const pr1=UPR(patrolS);
  ok('patrolGuard: 경찰이 구금 NPC 칸으로 1칸 접근',(pr1.meta.npcs||[]).find(n=>n.type==='police').position==='A1',`got ${(pr1.meta.npcs||[]).find(n=>n.type==='police').position}`);
  ok('patrolGuard: 구금 NPC 고정(이동 없음)',(pr1.meta.npcs||[]).some(n=>n.type==='captive'&&n.position==='A1'));
  const campS={...s4,players:s4.players.map((p,i)=>i===0?{...p,position:'K11'}:p),meta:{...s4.meta,npcs:[{id:0,type:'police',position:'A1',hp:8,maxHp:8,atk:4},{id:100,type:'captive',position:'A1'}]}};
  ok('patrolGuard: 구금칸 착석 경찰은 수호(정지)',(UPR(campS).meta.npcs||[]).find(n=>n.type==='police').position==='A1');
  // ---- S01 회귀: captive 시스템 미발동 ----
  ok('S01 no captives in npcs',!(sg.meta.npcs||[]).some(n=>n.type==='captive'));
  ok('S01 resolveCaptiveRescue no-op (captive 없음 → 불변)',RCR(sg,0)===sg);
  ok('S01 rescue counters init (rescues 0)',sg.meta.rescues===0);
  ok('S01 captiveStart/patrolGuard/raidHeatBonus fallback',SR(sg,'captiveStart',0)===0&&SR(sg,'patrolGuard',false)===false&&SR(sg,'raidHeatBonus',0)===0);
  // ---- S05 골드러시 ----
  const s5=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'AXIOM',humans:null,scenario:'S05'});
  const g5=GVG(s5);
  const nn5=s5.players.filter(p=>!p.isNpc).length;const adj5=(nn5===2?-2:nn5===3?-1:0);
  const bloc5=s5.players.find(p=>p.role==='bloc'&&!p.isNpc);
  ok('S05 meta.scenario=S05',s5.meta.scenario==='S05');
  ok('S05 startHeat=5',s5.heat===5);
  ok('S05 startStock=13 (all blocs)',['VANTA','IRONWALL','HELIX','AXIOM','CARBON'].every(b=>s5.stocks[b]===13),JSON.stringify(s5.stocks));
  ok('S05 lastStockSnapshot=13',s5.meta.lastStockSnapshot.VANTA===13);
  ok('S05 roundLimit override=8',SR(s5,'roundLimit',12)===8);
  ok('S05 zoneIncomeBonus=1',SR(s5,'zoneIncomeBonus',0)===1);
  ok('S05 blocAsset=base+adj+25',g5.blocAsset===100+adj5+25,`got ${g5.blocAsset} (adj ${adj5})`);
  ok('S05 all-seat credit +5 (bloc 8+5=13)',bloc5&&bloc5.resources.credit>=13,`got ${bloc5&&bloc5.resources.credit}`);
  ok('S05 ghostRepBattle standard (no override)',g5.ghostRepBattle===45+Math.floor(adj5/2),`got ${g5.ghostRepBattle}`);
  // ---- S06 마켓 크래시 ----
  const s6=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'CARBON',humans:null,scenario:'S06'});
  const g6=GVG(s6);
  const nn6=s6.players.filter(p=>!p.isNpc).length;const adj6=(nn6===2?-2:nn6===3?-1:0);
  const bloc6=s6.players.find(p=>p.role==='bloc'&&!p.isNpc);
  ok('S06 meta.scenario=S06',s6.meta.scenario==='S06');
  ok('S06 startHeat=6',s6.heat===6);
  ok('S06 startStock=5 (all blocs)',['VANTA','IRONWALL','HELIX','AXIOM','CARBON'].every(b=>s6.stocks[b]===5),JSON.stringify(s6.stocks));
  ok('S06 lastStockSnapshot=5',s6.meta.lastStockSnapshot.VANTA===5);
  ok('S06 all-seat credit -3 (bloc 8-3=5)',bloc6&&bloc6.resources.credit===5,`got ${bloc6&&bloc6.resources.credit}`);
  ok('S06 all-seat influence -1 (bloc 3-1=2)',bloc6&&bloc6.resources.influence===2,`got ${bloc6&&bloc6.resources.influence}`);
  ok('S06 shortLowPriceMult=2 (원전 값)',SR(s6,'shortLowPriceMult',1)===2);
  ok('S06 each bloc seeded SCANDAL card',s6.players.filter(p=>p.role==='bloc').every(p=>(p.discard||[]).includes('SCANDAL')),`sample discard ${JSON.stringify(bloc6&&bloc6.discard)}`);
  ok('S06 blocAsset=base+adj+30 (iter2 방향 보정)',g6.blocAsset===100+adj6+SR(s6,'blocAssetBonus',0)&&SR(s6,'blocAssetBonus',0)===30,`got ${g6.blocAsset} bonus ${SR(s6,'blocAssetBonus',0)}`);
  // ---- v6.22: S06 심층 룰 배선 (뉴스 배율·거래 동결·회복 배당) ----
  const R=window.reducer, SND=window.scenNewsStockDelta;
  // 시나리오 룰 키 존재
  ok('S06 newsStockUpMult=0.5',SR(s6,'newsStockUpMult',1)===0.5);
  ok('S06 newsStockDownMult=1.5',SR(s6,'newsStockDownMult',1)===1.5);
  ok('S06 tradeFreezeRounds=2',SR(s6,'tradeFreezeRounds',0)===2);
  ok('S06 divRecoveryMult=2',SR(s6,'divRecoveryMult',1)===2);
  ok('S06 divRecoveryThresh=50',SR(s6,'divRecoveryThresh',0)===50);
  // 뉴스 주가 방향 배율 (상승 −50% / 하락 +50%)
  ok('S06 news UP delta ×0.5 (+4→+2)',SND(s6,4)===2,`got ${SND(s6,4)}`);
  ok('S06 news DOWN delta ×1.5 (−4→−6)',SND(s6,-4)===-6,`got ${SND(s6,-4)}`);
  ok('S06 news zero delta identity',SND(s6,0)===0);
  // 거래 동결 게이트: R≤2 매수/매도/숏 no-op(동일 참조 반환), R3 정상
  const s6r1={...s6,meta:{...s6.meta,round:1}};
  const s6r2={...s6,meta:{...s6.meta,round:2}};
  const s6r3={...s6,meta:{...s6.meta,round:3}};
  ok('S06 R1 BUY_STOCK frozen (no-op)',R(s6r1,{type:'BUY_STOCK',playerIdx:0,bloc:'VANTA',qty:1})===s6r1);
  ok('S06 R2 BUY_STOCK frozen (no-op)',R(s6r2,{type:'BUY_STOCK',playerIdx:0,bloc:'VANTA',qty:1})===s6r2);
  const buyR3=R(s6r3,{type:'BUY_STOCK',playerIdx:0,bloc:'VANTA',qty:1});
  ok('S06 R3 BUY_STOCK allowed',buyR3!==s6r3&&(buyR3.players[0].stocks.VANTA||0)===1,`VANTA held ${buyR3.players[0].stocks.VANTA}`);
  const s6sell1={...s6,meta:{...s6.meta,round:1},players:s6.players.map((p,i)=>i===0?{...p,stocks:{...p.stocks,VANTA:2}}:p)};
  const s6sell3={...s6,meta:{...s6.meta,round:3},players:s6.players.map((p,i)=>i===0?{...p,stocks:{...p.stocks,VANTA:2}}:p)};
  ok('S06 R1 SELL_STOCK frozen (no-op)',R(s6sell1,{type:'SELL_STOCK',playerIdx:0,bloc:'VANTA',qty:1})===s6sell1);
  ok('S06 R3 SELL_STOCK allowed',R(s6sell3,{type:'SELL_STOCK',playerIdx:0,bloc:'VANTA',qty:1})!==s6sell3);
  // 숏 진입 동결 (Ghost 좌석 필요)
  const s6g=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'CIPHER',humans:null,scenario:'S06'});
  const s6gRich=s6g.players.map((p,i)=>i===0?{...p,resources:{...p.resources,credit:20}}:p);
  const s6gR1={...s6g,meta:{...s6g.meta,round:1},players:s6gRich};
  const s6gR3={...s6g,meta:{...s6g.meta,round:3},players:s6gRich};
  ok('S06 R1 BUY_SHORT frozen (no-op)',R(s6gR1,{type:'BUY_SHORT',playerIdx:0,bloc:'VANTA',qty:1})===s6gR1);
  ok('S06 R3 BUY_SHORT allowed',R(s6gR3,{type:'BUY_SHORT',playerIdx:0,bloc:'VANTA',qty:1})!==s6gR3);
  // 회복 배당 배수: 주가 합계 임계 도달 시 divMult 적용 (COLLECT_INCOME divMult 로직 항등 검증)
  const stockSumLow=Object.values(s6.stocks).reduce((a,v)=>a+v,0); // 5×5=25 (붕괴 — 미도달)
  ok('S06 붕괴 시작 주가합=25 (<50 → 배당 미배수)',stockSumLow===25,`got ${stockSumLow}`);
  const s6recov={...s6,stocks:Object.fromEntries(Object.keys(s6.stocks).map(k=>[k,11]))}; // 5×11=55 (회복)
  const recSum=Object.values(s6recov.stocks).reduce((a,v)=>a+v,0);
  const recMult=(recSum>=SR(s6recov,'divRecoveryThresh',Infinity))?SR(s6recov,'divRecoveryMult',1):1;
  ok('S06 회복 주가합≥50 → 배당 배수=2',recSum>=50&&recMult===2,`sum ${recSum} mult ${recMult}`);
  // ---- S01 unchanged (fallbacks) ----
  const s1=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'CIPHER',humans:null,scenario:'S01'});
  const g1=GVG(s1);
  const nn1=s1.players.filter(p=>!p.isNpc).length;const adj1=(nn1===2?-2:nn1===3?-1:0);
  // v6.25: S01 은 언더독 임계 스케일 적용 대상 (solo=1g3b → Ghost 완화·Bloc 지연). 원시값에 배수 반영.
  const ud1=window.euro_underdogGoalScale(s1);
  ok('S01 blocAsset = round((base+adj)*blocMult) [언더독]',g1.blocAsset===Math.round((100+adj1)*ud1.blocMult),`got ${g1.blocAsset} bm ${ud1.blocMult}`);
  ok('S01 ghostRepBattle = round((45+adj/2)*ghostMult) [언더독]',g1.ghostRepBattle===Math.round((45+Math.floor(adj1/2))*ud1.ghostMult),`got ${g1.ghostRepBattle} gm ${ud1.ghostMult}`);
  ok('S01 euro_totalShares uses float 10',ETS(s1,'VANTA')===s1.players.reduce((a,p)=>a+((p.stocks&&p.stocks.VANTA)||0),0)+10);
  ok('S01 heat=5',s1.heat===5);
  ok('S01 startStock=8',s1.stocks.VANTA===8);
  // ---- v6.22: S06 심층 룰이 타 시나리오로 새지 않는지 항등 폴백 검증 (S01) ----
  ok('S01 tradeFreezeRounds fallback 0',SR(s1,'tradeFreezeRounds',0)===0);
  ok('S01 newsStockUpMult fallback 1',SR(s1,'newsStockUpMult',1)===1);
  ok('S01 newsStockDownMult fallback 1',SR(s1,'newsStockDownMult',1)===1);
  ok('S01 divRecoveryMult fallback 1',SR(s1,'divRecoveryMult',1)===1);
  ok('S01 news delta identity (+4→+4)',SND(s1,4)===4,`got ${SND(s1,4)}`);
  ok('S01 news delta identity (−4→−4)',SND(s1,-4)===-4,`got ${SND(s1,-4)}`);
  // S01 R1 거래 비동결 — 거래가 정상 동작해야 함(회귀 불변)
  const s1r1={...s1,meta:{...s1.meta,round:1},players:s1.players.map((p,i)=>i===0?{...p,resources:{...p.resources,credit:50}}:p)};
  const s1buy=R(s1r1,{type:'BUY_STOCK',playerIdx:0,bloc:'VANTA',qty:1});
  ok('S01 R1 BUY_STOCK not frozen (works)',s1buy!==s1r1&&(s1buy.players[0].stocks.VANTA||0)===1,`VANTA ${s1buy.players[0].stocks.VANTA}`);
  // ==== v6.25: 언더독 승리 임계 스케일 (docs/23 갭#1 — 구성 결정론 완화) ====
  const UDS=window.euro_underdogGoalScale;
  const mkS=(roles,scen)=>({players:roles.map((r,i)=>({role:r,defeated:false,isNpc:false,id:i})),meta:{scenario:scen||'S01',mapSize:'11x11'}});
  // (1) 스케일 방향 — 1g3b: Ghost 소수 → 임계 완화(<1) + Bloc 다수 → 임계 지연(>1)
  const ud13=UDS(mkS(['ghost','bloc','bloc','bloc']));
  ok('UD 1g3b d=2 / applied',ud13.d===2&&ud13.applied===true);
  ok('UD 1g3b ghostMult=0.68 [B-08: GHOST_STEP 0.08→0.04, hp double-dip 상쇄]',ud13.ghostMult<1&&ud13.ghostMult>=0.50&&Math.abs(ud13.ghostMult-0.68)<1e-9,`gm ${ud13.ghostMult}`);
  ok('UD 1g3b blocMult>1 (다수 Bloc 임계 지연)',ud13.blocMult>1&&ud13.blocMult<=1.95,`bm ${ud13.blocMult}`);
  // (2) 3g1b: Bloc 소수 → 임계 완화(<1) + Ghost 다수 → 임계 지연(>1)
  const ud31=UDS(mkS(['ghost','ghost','ghost','bloc']));
  ok('UD 3g1b d=-2',ud31.d===-2&&ud31.applied===true);
  ok('UD 3g1b blocMult<1 (소수 Bloc 임계 완화)',ud31.blocMult<1&&ud31.blocMult>=0.58,`bm ${ud31.blocMult}`);
  ok('UD 3g1b ghostMult>1 (다수 Ghost 임계 지연)',ud31.ghostMult>1&&ud31.ghostMult<=1.45,`gm ${ud31.ghostMult}`);
  // (3) 2:2 동수 — 교차보유 시너지 상쇄 위해 Ghost 쪽 tilt (진단 근거; 실측 baseline bloc 94%)
  const ud22=UDS(mkS(['ghost','ghost','bloc','bloc']));
  ok('UD 2:2 d=0 / ghostMult=0.76 (parity tilt; B-08 불변 — d=0 은 GHOST_STEP*0)',ud22.d===0&&ud22.ghostMult<1&&Math.abs(ud22.ghostMult-0.76)<1e-9,`gm ${ud22.ghostMult}`);
  ok('UD 2:2 blocMult>1 (parity tilt)',ud22.blocMult>1,`bm ${ud22.blocMult}`);
  // (4) 항등 폴백 — 단일 진영 판(gc·bc 중 0)
  const udAll=UDS(mkS(['bloc','bloc','bloc','bloc']));
  ok('UD all-bloc identity (gc=0 → 무보정)',udAll.ghostMult===1&&udAll.blocMult===1&&udAll.applied===false);
  // (5) 카운트는 NPC·defeated 제외
  const udNpc=UDS({players:[{role:'ghost',isNpc:false,defeated:false},{role:'bloc',isNpc:false,defeated:false},{role:'bloc',isNpc:true,defeated:false},{role:'ghost',isNpc:false,defeated:true}],meta:{scenario:'S01'}});
  ok('UD counts exclude NPC+defeated (1g1b → d=0, gc=bc=1)',udNpc.d===0&&udNpc.gc===1&&udNpc.bc===1);
  // (6) 시나리오 제외 (scenarioRule underdogRelief=false) → 항등
  ok('UD S02 excluded → identity',(u=>u.applied===false&&u.ghostMult===1&&u.blocMult===1)(UDS(mkS(['ghost','bloc','bloc','bloc'],'S02'))));
  ok('UD S03 excluded → identity',(u=>u.applied===false&&u.blocMult===1&&u.ghostMult===1)(UDS(mkS(['ghost','ghost','ghost','bloc'],'S03'))));
  ok('UD S04 excluded → identity',UDS(mkS(['ghost','bloc','bloc','bloc'],'S04')).applied===false);
  ok('UD S05 excluded → identity',UDS(mkS(['ghost','bloc','bloc','bloc'],'S05')).applied===false);
  ok('UD S06 excluded → identity',UDS(mkS(['ghost','bloc','bloc','bloc'],'S06')).applied===false);
  ok('UD S01 included (relief on)',UDS(mkS(['ghost','bloc','bloc','bloc'],'S01')).applied===true);
  // (7) getVictoryGoals 통합 — 임계에 배수 반영
  const gv13=GVG(mkS(['ghost','bloc','bloc','bloc']));
  ok('GVG 1g3b blocAsset=166 (Bloc 지연; B-08 불변 — Ghost 만 재튜닝, Bloc 임계 그대로)',gv13.blocAsset===166,`got ${gv13.blocAsset}`);
  ok('GVG 1g3b ghostRepBattle=31 & repOnly=48 (B-08 재튜닝 0.68×; hp 채널 상쇄)',gv13.ghostRepBattle===31&&gv13.ghostRepOnly===48,`got ${gv13.ghostRepBattle}/${gv13.ghostRepOnly}`);
  ok('GVG 1g3b underdog meta attached',gv13.underdog&&gv13.underdog.applied===true);
  const gv31=GVG(mkS(['ghost','ghost','ghost','bloc']));
  ok('GVG 3g1b blocAsset=80 (Bloc 완화; B-08 불변 — d<0 는 GHOST_STEP 무관)',gv31.blocAsset===80,`got ${gv31.blocAsset}`);
  ok('GVG 3g1b ghostRepBattle=52 (Ghost 지연; B-08 불변 — d<0 는 GHOST_STEP 무관)',gv31.ghostRepBattle===52,`got ${gv31.ghostRepBattle}`);
  // ============================================================
  // B-06 (docs/22 P1-6): highlightPoints 승리 환산 — write-only 통화 회생
  //   판정(evalPlayerVictory)·HUD(hudRaceProgress)·표시가 동일 asset_eff/rep_eff 를 읽는지,
  //   역할 대칭·정직성 계약·언더독 순서 독립을 검증.
  // ============================================================
  const EPV=window.evalPlayerVictory, HRP=window.hudRaceProgress, HLB=window.euro_hlVictoryBonus;
  ok('B06 fns exposed (EPV/HRP/HLB)', typeof EPV==='function'&&typeof HRP==='function'&&typeof HLB==='function');
  // 환산 계수 round(hp*0.3)
  ok('B06 hlVictoryBonus(10)=3', HLB({highlightPoints:10})===3, `got ${HLB({highlightPoints:10})}`);
  ok('B06 hlVictoryBonus(0)=0', HLB({highlightPoints:0})===0);
  ok('B06 hlVictoryBonus(null)=0', HLB(null)===0);
  ok('B06 hlVictoryBonus(7)=round(2.1)=2', HLB({highlightPoints:7})===2, `got ${HLB({highlightPoints:7})}`);
  // 상태 빌더: 자사=VANTA, 교차보유 IRONWALL(qty×price=10) 로 assetValue 제어, map 비움
  const mkState6=(over)=>Object.assign({stocks:{VANTA:10,IRONWALL:10,HELIX:10,AXIOM:10,CARBON:10},map:{},meta:{mapSize:'11x11',raidsThisGame:{},scenario:'S01'},players:[]},over||{});
  const mkBloc6=(hp,ironQty)=>({role:'bloc',specific:'VANTA',isNpc:false,defeated:false,highlightPoints:hp,resources:{rep:0},stocks:{VANTA:10,IRONWALL:ironQty}});
  const mkGhost6=(hp,rep)=>({role:'ghost',specific:'BLADE',isNpc:false,defeated:false,highlightPoints:hp,resources:{rep},stocks:{}});
  // Bloc: assetValue=ironQty×10 → 100. 임계 103. hp0 → 100<103(패); hp10(+3) → 103(승)
  const gBloc6={blocAsset:103,ghostRepBattle:42,ghostRepOnly:70,ghostRaids:1,nonNpcCount:4};
  const st6=mkState6();
  ok('B06 bloc av100 no-hp <103 → no win', EPV(mkBloc6(0,10),0,st6,gBloc6)===null);
  ok('B06 bloc av100 +hp10(=+3) ≥103 → asset win', (v=>!!v&&v.route==='asset')(EPV(mkBloc6(10,10),0,st6,gBloc6)), JSON.stringify(EPV(mkBloc6(10,10),0,st6,gBloc6)));
  // Ghost 대칭: rep_eff=rep+bonus. rep40, raids2, battle42 → hp0 패 / hp10(+3)=43 승(repBattle)
  const gG6={blocAsset:100,ghostRepBattle:42,ghostRepOnly:70,ghostRaids:1,nonNpcCount:4};
  const stG6=mkState6({meta:{mapSize:'11x11',raidsThisGame:{0:2},scenario:'S01'}});
  ok('B06 ghost rep40 no-hp <42 → no win', EPV(mkGhost6(0,40),0,stG6,gG6)===null);
  ok('B06 ghost rep40 +hp10(=+3) ≥42 & raids2 → repBattle win', (v=>!!v&&v.route==='repBattle')(EPV(mkGhost6(10,40),0,stG6,gG6)), JSON.stringify(EPV(mkGhost6(10,40),0,stG6,gG6)));
  // 역할 대칭: 동일 hp → 동일 bonus (Bloc·Ghost 모두 환산)
  ok('B06 role symmetry: same bonus both roles', HLB(mkBloc6(10,10))===HLB(mkGhost6(10,40))&&HLB(mkBloc6(10,10))===3);
  // HUD 정직성: hudRaceProgress 가 동일 asset_eff 반영 (hp 있는 쪽 진척 ↑)
  const gHud6={blocAsset:200,ghostRepBattle:42,ghostRepOnly:70,ghostRaids:1,nonNpcCount:4};
  const hud0=HRP(mkBloc6(0,10),0,st6,gHud6), hudH=HRP(mkBloc6(10,10),0,st6,gHud6);
  ok('B06 HUD reflects hp (progress↑)', hudH>hud0, `no-hp ${hud0} hp ${hudH}`);
  // 정직성 계약: 승리 상태 → HUD=100
  const winBloc6=mkBloc6(10,10);
  ok('B06 honesty contract: win → HUD=100', EPV(winBloc6,0,st6,gBloc6)!==null && HRP(winBloc6,0,st6,gBloc6)===100, `hud ${HRP(winBloc6,0,st6,gBloc6)}`);
  // 언더독 순서 독립: hp 는 달성값에만 가산 → getVictoryGoals 임계는 hp 와 무관
  const udB=mkS(['ghost','bloc','bloc','bloc']);
  const gvNoHp=GVG(udB); udB.players[1].highlightPoints=50; const gvHp=GVG(udB);
  ok('B06 order-indep: hp 는 임계(getVictoryGoals) 불변', gvNoHp.blocAsset===gvHp.blocAsset&&gvNoHp.ghostRepBattle===gvHp.ghostRepBattle, `${gvNoHp.blocAsset}/${gvHp.blocAsset}`);
  // ============================================================
  // v6.28: NEXUS BAR — nextAction 단일 헬퍼(하단 NEXT의 진행 로직 정본) 정합성
  //   기존 dispatch(SET_PHASE)/confirmPlan 미러링·결정 게이트·페이즈 라벨을 검증(신규 게임 로직 0).
  // ============================================================
  const NA=window.nextAction;
  ok('NB nextAction exposed', typeof NA==='function');
  const nbS=B({mode:'solo',mapSize:'5x5',difficulty:'normal',role:'ghost',specific:'CIPHER',humans:null,scenario:'S01'});
  const mkCtx=(over)=>Object.assign({canPlan:true,needCards:2,selectedCards:[],confirmPlan:()=>'CONFIRM',dispatch:()=>{},meIdx:0},over||{});
  // (1) 결정 큐 게이트 — pendingDecisions 있으면 진행 차단 (honesty 비용 0, 원시 state 카운트)
  const rPend=NA({...nbS,meta:{...nbS.meta,phase:0,pendingDecisions:[{a:1},{b:2}]}},mkCtx());
  ok('NB pending gate: disabled + 결정 필요 N + onClick null', rPend.disabled===true&&rPend.label==='결정 필요 2'&&rPend.onClick===null, `label ${rPend.label}`);
  // (2) phase0 → SET_PHASE 1 (기존 버튼 미러)
  let disp0=null; const r0=NA({...nbS,meta:{...nbS.meta,phase:0,pendingDecisions:[]}},mkCtx({dispatch:(a)=>{disp0=a;}}));
  r0.onClick(); ok('NB ph0 → dispatch SET_PHASE phase:1', r0.disabled===false&&disp0&&disp0.type==='SET_PHASE'&&disp0.phase===1, JSON.stringify(disp0));
  // (3) phase1 → SET_PHASE 2
  let disp1=null; const r1=NA({...nbS,meta:{...nbS.meta,phase:1,pendingDecisions:[]}},mkCtx({dispatch:(a)=>{disp1=a;}}));
  r1.onClick(); ok('NB ph1 → dispatch SET_PHASE phase:2', disp1&&disp1.phase===2, JSON.stringify(disp1));
  // (4) phase2 미완성 카드 → 비활성 '카드 x/2'
  const r2a=NA({...nbS,meta:{...nbS.meta,phase:2,pendingDecisions:[],awaitingMoveTarget:false}},mkCtx({selectedCards:['X']}));
  ok('NB ph2 미완성 → disabled + 카드 1/2', r2a.disabled===true&&r2a.label==='카드 1/2', `label ${r2a.label}`);
  // (5) phase2 완성 → '✓ 확정' + onClick===confirmPlan 참조 (판정 이원화 방지)
  const cpRef=()=>'CONFIRM';
  const r2b=NA({...nbS,meta:{...nbS.meta,phase:2,pendingDecisions:[],awaitingMoveTarget:false}},mkCtx({selectedCards:['X','Y'],confirmPlan:cpRef}));
  ok('NB ph2 완성 → ✓ 확정 · onClick===confirmPlan', r2b.disabled===false&&r2b.label==='✓ 확정'&&r2b.onClick===cpRef);
  // (6) 이동 목표 대기 → '🎯 이동 목표' 비활성 (지도 클릭 유도)
  const r2c=NA({...nbS,meta:{...nbS.meta,phase:2,pendingDecisions:[],awaitingMoveTarget:true}},mkCtx());
  ok('NB ph2 awaitingMoveTarget → 🎯 이동 목표 disabled', r2c.disabled===true&&r2c.label==='🎯 이동 목표');
  // (7) 종료 선언 유지 톤 — 내 선언이면 tone=won (meIdx 기준, players[0] 하드코딩 아님)
  ok('NB decl tone=won when decl.idx===meIdx', NA({...nbS,meta:{...nbS.meta,phase:0,pendingDecisions:[],victoryDeclaration:{idx:0}}},mkCtx({meIdx:0})).tone==='won');
  ok('NB decl tone≠won when decl.idx≠meIdx', NA({...nbS,meta:{...nbS.meta,phase:0,pendingDecisions:[],victoryDeclaration:{idx:1}}},mkCtx({meIdx:0})).tone!=='won');
  // ============================================================
  // v6.31 (레거시 Stage 2): 챕터 2 "Insider Game" — 해금 트리거·PREY 흉터·하위 호환
  //   legacy_module.js 순수 로직(localStorage 가드). 시나리오 간 legacyReset 로 격리.
  //   신규 게임 로직 0 — 단일 흉터 채널이 챕터 2 해금 후 M&A 표적으로도 발원함을 검증.
  // ============================================================
  const LRG=window.legacyRecordGame, LAS=window.legacyActiveScar, LCM=window.legacyChapterMeta,
        LRS=window.legacyReset, LLD=window.legacyLoad, LSV=window.legacySave,
        LTC=window.legacyTotalChapters, LU2=window.legacyUnlockChapter2;
  ok('LEG fns exposed (record/scar/meta/reset/load/save/total/unlock2)', [LRG,LAS,LCM,LRS,LLD,LSV,LTC,LU2].every(f=>typeof f==='function'));
  // (1) CHAPTER_META[2] 원전 메타 — 봉투 B · 제목 · 해금 조건 · 3문장 스토리(원문 발췌)
  const cm2=LCM(2);
  ok('LEG ch2 meta id/envelope/title', !!cm2&&cm2.id===2&&cm2.envelope==='B'&&cm2.title==='Insider Game', JSON.stringify(cm2&&{id:cm2.id,e:cm2.envelope,t:cm2.title}));
  ok('LEG ch2 unlockCond=최초 M&A 선언', !!cm2&&cm2.unlockCond==='최초 M&A 선언', cm2&&cm2.unlockCond);
  ok('LEG ch2 story 3문장 + 원문 발췌("블록끼리도 블록을 먹는다")', !!cm2&&Array.isArray(cm2.story)&&cm2.story.length===3&&cm2.story.some(s=>s.indexOf('블록끼리도 블록을 먹는다')!==-1));
  ok('LEG ch1 메타·TOTAL_CHAPTERS 회귀 불변(8)', LCM(1)&&LCM(1).title==='First Blood'&&LTC()===8);
  // (2) 미해금: raid/M&A 없음 → 챕터 2 잠금 (chapter2Newly=false · 흉터 null)
  LRS();
  const lr0=LRG({anyRaid:false, anyMna:false});
  ok('LEG 미해금: anyMna=false → ch2 잠금 · newly=false', lr0.state.chaptersUnlocked.indexOf(2)===-1&&lr0.chapter2Newly===false);
  ok('LEG 미해금: activeScar null (ch1·ch2 모두 잠금)', LAS()===null);
  // (3) 해금: 최초 M&A 선언 → 챕터 2 해금 (chapter2Newly=true) · 레이드 없어도 독립 해금
  LRS();
  const lr1=LRG({anyMna:true});
  ok('LEG 해금: anyMna=true → ch2 해금 + chapter2Newly=true', lr1.state.chaptersUnlocked.indexOf(2)!==-1&&lr1.chapter2Newly===true);
  ok('LEG 해금: ch1 독립(레이드 없음 → ch1 미해금)', lr1.state.chaptersUnlocked.indexOf(1)===-1);
  ok('LEG 해금: 반환에 chapter1Newly/chapter2Newly 둘 다 존재', typeof lr1.chapter1Newly==='boolean'&&typeof lr1.chapter2Newly==='boolean');
  // (4) 멱등: 이미 해금 후 재선언 → chapter2Newly=false
  const lr2=LRG({anyMna:true});
  ok('LEG 멱등: 재선언 chapter2Newly=false (해금 유지)', lr2.chapter2Newly===false&&lr2.state.chaptersUnlocked.indexOf(2)!==-1);
  // (5) 영속효과: 챕터 2 해금 후 M&A PREY(표적) → 다음 게임 흉터=PREY 블록 (start stock -1 근거)
  LRS();
  LRG({anyMna:true});                        // 해금(표적 없음)
  LRG({anyMna:true, mnaPreyBloc:'VANTA'});    // PREY 표적 발생
  const scarP=LAS();
  ok('LEG 영속: PREY 흉터 bloc=VANTA · kind=prey', !!scarP&&scarP.bloc==='VANTA'&&scarP.kind==='prey', JSON.stringify(scarP));
  // (6) PREY 우선: 레이드 피해 + M&A 표적 공존 → 흉터=PREY(가장 신선한 상처)
  LRS();
  LRG({anyRaid:true, topRaidBloc:'HELIX'});    // ch1 해금 + raid 흉터
  const lr3=LRG({anyRaid:true, topRaidBloc:'HELIX', anyMna:true, mnaPreyBloc:'AXIOM'}); // ch2 해금 + 둘 다
  const scarPr=LAS();
  ok('LEG PREY 우선: raid+mna 공존 → 흉터=AXIOM(prey)', !!scarPr&&scarPr.bloc==='AXIOM'&&scarPr.kind==='prey', JSON.stringify(scarPr));
  ok('LEG 동일판: ch1 기해금(newly=false)·ch2 신규(newly=true)', lr3.chapter1Newly===false&&lr3.chapter2Newly===true);
  // (7) 챕터1 폴백: ch2 미해금 시 raid 흉터만 (PREY 경로 비활성 · Stage 1 동작 불변)
  LRS();
  LRG({anyRaid:true, topRaidBloc:'IRONWALL'});
  const lr4=LRG({anyRaid:true, topRaidBloc:'IRONWALL', anyMna:false});
  const scarR=LAS();
  ok('LEG ch1 폴백: raid 흉터 bloc=IRONWALL · kind=raid', !!scarR&&scarR.bloc==='IRONWALL'&&scarR.kind==='raid', JSON.stringify(scarR));
  ok('LEG ch1 폴백: ch2 미해금 유지', lr4.state.chaptersUnlocked.indexOf(2)===-1);
  // (8) 선언만(표적 없음): ch2 해금되되 흉터 미기록
  LRS();
  const lr5=LRG({anyMna:true});
  ok('LEG 선언만: ch2 해금 · 흉터 없음(PREY null)', lr5.state.chaptersUnlocked.indexOf(2)!==-1&&LAS()===null);
  // (9) ch2 단독 해금(ch1 없이)도 흉터 활성 — activeScar 게이트 ch1|ch2 확장 검증
  LRS();
  const lr6=LRG({anyMna:true, mnaPreyBloc:'HELIX'}); // ch2 해금 + PREY 흉터 동시(ch1 없음)
  const scar6=LAS();
  ok('LEG ch2 단독: 흉터 활성(ch1 게이트 비의존)', lr6.state.chaptersUnlocked.indexOf(1)===-1&&!!scar6&&scar6.bloc==='HELIX'&&scar6.kind==='prey', JSON.stringify(scar6));
  // (10) 하위 호환: 구버전 세이브({chaptersUnlocked:[1],cityScars:[{bloc}]} — kind/ch2 없음) 로드 무손상
  LRS();
  LSV({chaptersUnlocked:[1], chapterProgress:{1:{unlockedAt:1}}, cityScars:[{bloc:'CARBON'}]});
  const oldLoad=LLD();
  ok('LEG 하위호환: 구세이브 정규화(ch1만·ch2 없음)', oldLoad.chaptersUnlocked.indexOf(1)!==-1&&oldLoad.chaptersUnlocked.indexOf(2)===-1);
  const oldScar=LAS();
  ok('LEG 하위호환: kind 없는 구흉터 → kind 기본 raid', !!oldScar&&oldScar.bloc==='CARBON'&&oldScar.kind==='raid', JSON.stringify(oldScar));
  // (11) 챕터1 시그니처 불변(하위호환): anyRaid/topRaidBloc 만으로 기존 Stage 1 동작 그대로
  LRS();
  const lr7=LRG({anyRaid:true, topRaidBloc:'VANTA'});
  ok('LEG 시그니처 불변: anyRaid→ch1 해금·chapter1Newly·raid 흉터', lr7.state.chaptersUnlocked.indexOf(1)!==-1&&lr7.chapter1Newly===true&&LAS().bloc==='VANTA'&&LAS().kind==='raid');
  LRS(); // 테스트 격리 — 프로덕션 키 오염 방지(다음 실행 clean start)
  return out;
}
(async()=>{const server=await srv();const port=server.address().port;const br=await chromium.launch({headless:true,executablePath:'/opt/pw-browsers/chromium'});const pg=await br.newPage();
await pg.route('**/*',route=>{const u=route.request().url();const send=f=>route.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:fs.readFileSync(path.join(VENDOR,f))});if(u.includes('unpkg.com')&&u.includes('react-dom'))return send('react-dom.production.min.js');if(u.includes('unpkg.com')&&u.includes('/react@'))return send('react.production.min.js');if(u.includes('unpkg.com')&&u.includes('babel'))return send('babel.min.js');if(u.includes('fonts.g'))return route.fulfill({status:200,contentType:'text/css',body:''});return route.continue();});
await pg.goto(`http://127.0.0.1:${port}/simulator/v0.5/`,{waitUntil:'load',timeout:30000});
await pg.waitForFunction(()=>typeof window.reducer==='function'&&typeof window.buildInitial==='function'&&typeof window.getVictoryGoals==='function'&&typeof window.scenarioRule==='function'&&typeof window.euro_totalShares==='function',{timeout:45000});
const res=await pg.evaluate(tests);
let fail=0;for(const t of res){console.log((t.pass?'  PASS ':'  FAIL ')+t.n+(t.extra?'  ['+t.extra+']':''));if(!t.pass)fail++;}
console.log('\n'+(fail===0?'ALL '+res.length+' UNIT TESTS PASSED':fail+' / '+res.length+' FAILED'));
await br.close();server.close();process.exit(fail===0?0:1);})();
