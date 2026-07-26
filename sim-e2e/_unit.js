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
  // ---- v6.46 (66차): S05 뉴스 매 R 2장 드로우 (docs/14 §S05 원안 확장) ----
  //   기존 DRAW_NEWS 경로 N회 재적용 — 게이팅(newsDrawCount)·2장 실드로우·타 시나리오 1장 불변을 핀.
  {
    const R5=window.reducer;
    ok('S05 newsDrawCount=2 (원안 배선)',SR(s5,'newsDrawCount',1)===2,`got ${SR(s5,'newsDrawCount',1)}`);
    const d5=R5(s5,{type:'DRAW_NEWS'});
    ok('S05 DRAW_NEWS → meta.newsDrawn 2장',(d5.meta.newsDrawn||[]).length===2,`got ${(d5.meta.newsDrawn||[]).length}`);
    ok('S05 currentNews = 마지막 장(뉴스박스 헤드라인)',!!d5.currentNews&&d5.meta.newsDrawn[1].id===d5.currentNews.id,`cur ${d5.currentNews&&d5.currentNews.id}`);
    const news5Logs=d5.log.filter(l=>String(l.message||'').startsWith('📰')).length
                   -s5.log.filter(l=>String(l.message||'').startsWith('📰')).length;
    ok('S05 뉴스 로그 2줄 (효과 순차 적용 = 기존 경로 2회)',news5Logs===2,`got ${news5Logs}`);
    // 타 시나리오 무영향 — S01/S03/S06 은 newsDrawCount 미지정 → 1장 + newsDrawn 미설정
    for (const sid of ['S01','S03','S06']) {
      const sx=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:sid});
      ok(`${sid} newsDrawCount 미지정 → 폴백 1`,SR(sx,'newsDrawCount',1)===1);
      const dx=R5(sx,{type:'DRAW_NEWS'});
      const nLogs=dx.log.filter(l=>String(l.message||'').startsWith('📰')).length
                 -sx.log.filter(l=>String(l.message||'').startsWith('📰')).length;
      ok(`${sid} DRAW_NEWS 1줄 · newsDrawn 미설정 (2장 배선 무영향)`,nLogs===1&&dx.meta.newsDrawn===undefined,`logs ${nLogs} drawn ${JSON.stringify(dx.meta.newsDrawn)}`);
      // 격리 byte 동일성: 동일 시드에서 (a) 신규 게이트를 통과한 DRAW_NEWS 와 (b) __newsOne 로 게이트를
      //   강제 우회한 DRAW_NEWS(=패치 이전 코드 경로)의 결과 상태가 완전 동일 — 분기 미진입 실증.
      const seedRun=(act)=>{const real=Math.random;let t=0x9e3779b9;Math.random=()=>{t=(t*1664525+1013904223)>>>0;return t/4294967296;};
        try{return JSON.stringify(R5(sx,act));}finally{Math.random=real;}};
      ok(`${sid} 격리 byte 동일 (게이트 통과 == 우회 경로, 동일 시드)`,seedRun({type:'DRAW_NEWS'})===seedRun({type:'DRAW_NEWS',__newsOne:true}));
    }
  }
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
  // ==== v6.46 [69차]: S06 원전 특수 승리 루트 — 재건왕/청산자 하이라이트 배선 (docs/14 §S06 원안) ====
  //   원전: 재건왕 = 파산(주가 0) 블록을 주가 10↑로 복구한 플레이어 ★ 타이틀 + 렙/자산 +5
  //         청산자 = 2개 이상 블록 파산 유도 Ghost 렙 +10
  //   엔진 매핑: 주가 하한이 1(Math.max(1,…)) → "파산(0)"=crashBottomThresh(1). 보상은 하이라이트 rep.
  const MCB=window.s06MarkCrashBottom, CRK=window.s06CheckReconstructor, NLQ=window.s06NoteLiquidation;
  const HD=(typeof HIGHLIGHT_DEFS!=='undefined')?HIGHLIGHT_DEFS:null;
  ok('S06 crashBottomThresh=1 (원전 "파산(주가 0)" → 엔진 주가 하한)',SR(s6,'crashBottomThresh',0)===1);
  ok('S06 reconstructThresh=10 (원전 "주가 10↑로 복구")',SR(s6,'reconstructThresh',0)===10);
  ok('S06 liquidatorBlocs=2 (원전 "2개 이상 블록 파산 유도")',SR(s6,'liquidatorBlocs',0)===2);
  ok('S06 HIGHLIGHT_DEFS reconstructor(rep5)/liquidator(rep10) 등록',!!HD&&!!HD.reconstructor&&HD.reconstructor.rep===5&&!!HD.liquidator&&HD.liquidator.rep===10,JSON.stringify(HD&&{r:HD.reconstructor,l:HD.liquidator}));
  ok('S06 헬퍼 3종 window 노출',typeof MCB==='function'&&typeof CRK==='function'&&typeof NLQ==='function');
  // ---- 파산(바닥) 이력 기록 ----
  const s6crash={...s6,stocks:{...s6.stocks,VANTA:1}};
  const mcb1=MCB(s6crash);
  ok('S06 파산 이력: 주가1 블록 기록',!!(mcb1.meta.s06CrashedBlocs&&mcb1.meta.s06CrashedBlocs.VANTA===true),JSON.stringify(mcb1.meta.s06CrashedBlocs));
  ok('S06 파산 이력: 멱등 재호출 항등(참조 동일)',MCB(mcb1)===mcb1);
  ok('S06 파산 이력: 바닥 미도달(주가5) 항등(참조 동일)',MCB(s6)===s6);
  // ---- 재건왕 ----
  const b6=s6.players[0].specific;  // P0 = 인간 Bloc 좌석 (CARBON)
  const s6rec={...s6,stocks:{...s6.stocks,[b6]:10},meta:{...s6.meta,s06CrashedBlocs:{[b6]:true},highlights:[]}};
  const rec1=CRK(s6rec);
  const recHl=(rec1.meta.highlights||[]).filter(h=>h.key==='reconstructor');
  ok('S06 재건왕: 파산 이력 블록 주가10 회복 → 자사 Bloc 좌석 하이라이트 1건',recHl.length===1&&recHl[0].playerIdx===0,JSON.stringify(recHl));
  ok('S06 재건왕: ★+5 지급 (원전 렙 +5)',rec1.players[0].resources.rep===s6.players[0].resources.rep+5,`got ${rec1.players[0].resources.rep}`);
  ok('S06 재건왕: 1회성 (재호출 무증분)',(CRK(rec1).meta.highlights||[]).filter(h=>h.key==='reconstructor').length===1);
  const s6noHist={...s6,stocks:{...s6.stocks,[b6]:10},meta:{...s6.meta,s06CrashedBlocs:{},highlights:[]}};
  ok('S06 재건왕: 파산 이력 없으면 주가10 이어도 미발동',((CRK(s6noHist).meta.highlights)||[]).length===0);
  const s6partial={...s6,stocks:{...s6.stocks,[b6]:9},meta:{...s6.meta,s06CrashedBlocs:{[b6]:true},highlights:[]}};
  ok('S06 재건왕: 회복 임계 미달(주가9) 미발동',((CRK(s6partial).meta.highlights)||[]).length===0);
  // ---- 청산자 ----
  const pre6={...s6.stocks};  // 전 블록 5 (S06 시작가)
  const s6liq={...s6g,stocks:{...s6g.stocks,VANTA:1,IRONWALL:1},meta:{...s6g.meta,highlights:[],s06LiquidatedBy:{}}};
  const liq1=NLQ(s6liq,0,pre6);
  const liqHl=(liq1.meta.highlights||[]).filter(h=>h.key==='liquidator');
  ok('S06 청산자: Ghost 1행동으로 2블록 바닥 유도 → 하이라이트 1건',liqHl.length===1&&liqHl[0].playerIdx===0,JSON.stringify(liqHl));
  ok('S06 청산자: ★+10 지급 (원전 렙 +10)',liq1.players[0].resources.rep===s6g.players[0].resources.rep+10,`got ${liq1.players[0].resources.rep}`);
  ok('S06 청산자: 귀속 누적 2블록 기록',((liq1.meta.s06LiquidatedBy||{})[0]||[]).length===2,JSON.stringify(liq1.meta.s06LiquidatedBy));
  const step1=NLQ({...s6g,stocks:{...s6g.stocks,VANTA:1},meta:{...s6g.meta,highlights:[],s06LiquidatedBy:{}}},0,pre6);
  ok('S06 청산자: 1블록만이면 미발동(누적만)',((step1.meta.highlights)||[]).length===0&&((step1.meta.s06LiquidatedBy||{})[0]||[]).length===1);
  const step2=NLQ({...step1,stocks:{...step1.stocks,IRONWALL:1}},0,step1.stocks);
  ok('S06 청산자: 후속 행동으로 2번째 블록 누적 → 발동',((step2.meta.highlights)||[]).filter(h=>h.key==='liquidator').length===1);
  const s6liqBloc={...s6,stocks:{...s6.stocks,VANTA:1,IRONWALL:1},meta:{...s6.meta,highlights:[],s06LiquidatedBy:{}}};
  ok('S06 청산자: Bloc 좌석은 귀속 제외(항등·참조 동일)',NLQ(s6liqBloc,0,pre6)===s6liqBloc);
  const s6liqNoDrop={...s6g,meta:{...s6g.meta,highlights:[],s06LiquidatedBy:{}}};
  ok('S06 청산자: 바닥 유도 없으면 항등(참조 동일)',NLQ(s6liqNoDrop,0,pre6)===s6liqNoDrop);
  // ---- 격리: 타 시나리오 무영향 (키 미지정 → 0 폴백 → 헬퍼 첫 줄 항등) ----
  ok('S01 crashBottomThresh fallback 0',SR(s1,'crashBottomThresh',0)===0);
  ok('S01 reconstructThresh fallback 0',SR(s1,'reconstructThresh',0)===0);
  ok('S01 liquidatorBlocs fallback 0',SR(s1,'liquidatorBlocs',0)===0);
  const s1bot={...s1,stocks:Object.fromEntries(Object.keys(s1.stocks).map(k=>[k,1])),meta:{...s1.meta,highlights:[]}};
  ok('S01 s06MarkCrashBottom 항등(참조 동일)',MCB(s1bot)===s1bot);
  ok('S01 s06CheckReconstructor 항등(참조 동일)',CRK(s1bot)===s1bot);
  ok('S01 s06NoteLiquidation 항등(참조 동일)',NLQ(s1bot,0,s1.stocks)===s1bot);
  for(const sid of ['S02','S03','S04','S05']){
    const sx=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'VANTA',humans:null,scenario:sid});
    const xb={...sx,stocks:Object.fromEntries(Object.keys(sx.stocks).map(k=>[k,1])),meta:{...sx.meta,highlights:[]}};
    ok(`${sid} S06 타이틀 룰 미침투 (3키 0 폴백 + 헬퍼 3종 항등)`,SR(sx,'crashBottomThresh',0)===0&&SR(sx,'reconstructThresh',0)===0&&SR(sx,'liquidatorBlocs',0)===0&&MCB(xb)===xb&&CRK(xb)===xb&&NLQ(xb,0,sx.stocks)===xb);
  }
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
  // ============================================================
  // v6.33 (레거시 Stage 3): 챕터 3 "Martial Night"(계엄의 밤) — 계엄 해금·martial 흉터·하위 호환
  //   원전 해금 "공권력 트랙 10 도달(계엄선포)" → 게임 종료 신호 martialLaw 파생(옵셔널 필드).
  //   흉터 채널은 여전히 단 하나 — kind 'martial'(특정 블록 없음 → 시작 공권력 +1). 우선순위 martial>prey>raid.
  // ============================================================
  const LU3=window.legacyUnlockChapter3;
  ok('LEG3 fns exposed (unlockChapter3)', typeof LU3==='function');
  // (1) CHAPTER_META[3] 원전 메타 — 봉투 C · 제목 · 해금 조건 · 3문장(원문 발췌)
  const cm3=LCM(3);
  ok('LEG3 ch3 meta id/envelope/title', !!cm3&&cm3.id===3&&cm3.envelope==='C'&&cm3.title==='Martial Night', JSON.stringify(cm3&&{id:cm3.id,e:cm3.envelope,t:cm3.title}));
  ok('LEG3 ch3 unlockCond=공권력 트랙 최고조(계엄 선포)', !!cm3&&cm3.unlockCond==='공권력 트랙 최고조(계엄 선포)', cm3&&cm3.unlockCond);
  ok('LEG3 ch3 story 3문장 + 원문 발췌("블록보다 강한 것은 국가다")', !!cm3&&Array.isArray(cm3.story)&&cm3.story.length===3&&cm3.story.some(s=>s.indexOf('블록보다 강한 것은 국가다')!==-1));
  ok('LEG3 ch1·ch2 메타 회귀 불변·TOTAL=8', LCM(1).title==='First Blood'&&LCM(2).title==='Insider Game'&&LTC()===8);
  // (2) 미해금: martialLaw 없음 → ch3 잠금 (chapter3Newly=false)
  LRS();
  const l30=LRG({anyRaid:false, anyMna:false});
  ok('LEG3 미해금: martialLaw 미공급 → ch3 잠금 · chapter3Newly=false', l30.state.chaptersUnlocked.indexOf(3)===-1&&l30.chapter3Newly===false);
  ok('LEG3 반환에 chapter3Newly(boolean) 존재', typeof l30.chapter3Newly==='boolean');
  // (3) 해금: 계엄(martialLaw) → ch3 해금 (chapter3Newly=true) · 레이드·M&A 없어도 독립 해금
  LRS();
  const l31=LRG({martialLaw:true});
  ok('LEG3 해금: martialLaw=true → ch3 해금 + chapter3Newly=true', l31.state.chaptersUnlocked.indexOf(3)!==-1&&l31.chapter3Newly===true);
  ok('LEG3 해금: ch1·ch2 독립(미해금)', l31.state.chaptersUnlocked.indexOf(1)===-1&&l31.state.chaptersUnlocked.indexOf(2)===-1);
  // (4) 멱등: 이미 해금 후 재계엄 → chapter3Newly=false
  const l32=LRG({martialLaw:true});
  ok('LEG3 멱등: 재계엄 chapter3Newly=false (해금 유지)', l32.chapter3Newly===false&&l32.state.chaptersUnlocked.indexOf(3)!==-1);
  // (5) 영속: ch3 해금 + 계엄 → martial 흉터 (bloc=null · kind=martial · heatDelta=1 = 시작 공권력 +1)
  LRS();
  LRG({martialLaw:true});           // 해금
  LRG({martialLaw:true});           // 계엄 흉터 발원
  const scarM=LAS();
  ok('LEG3 영속: martial 흉터 kind=martial · bloc=null · heatDelta=1', !!scarM&&scarM.kind==='martial'&&scarM.bloc===null&&scarM.heatDelta===1, JSON.stringify(scarM));
  // (6) 우선순위 martial > prey > raid — 셋 공존 → 흉터=martial (가장 최근·도시 전역 상처)
  LRS();
  const l33=LRG({anyRaid:true, topRaidBloc:'HELIX', anyMna:true, mnaPreyBloc:'AXIOM', martialLaw:true});
  const scarPri=LAS();
  ok('LEG3 우선: raid+prey+martial 공존 → 흉터=martial', !!scarPri&&scarPri.kind==='martial'&&scarPri.bloc===null, JSON.stringify(scarPri));
  ok('LEG3 동일판: ch1·ch2·ch3 모두 신규 해금(Newly 3개 true)', l33.chapter1Newly===true&&l33.chapter2Newly===true&&l33.chapter3Newly===true);
  // (7) 흉터 폴백: ch3 해금됐지만 이번 판 계엄 없음(+ prey 존재) → 흉터=prey (martial 미발원)
  LRS();
  LRG({martialLaw:true, anyMna:true});                   // ch2·ch3 해금
  LRG({anyMna:true, mnaPreyBloc:'VANTA'});               // 계엄 없는 판 → prey 흉터
  const scarFb=LAS();
  ok('LEG3 폴백: ch3 해금+계엄없음 → 흉터=prey(VANTA)', !!scarFb&&scarFb.kind==='prey'&&scarFb.bloc==='VANTA', JSON.stringify(scarFb));
  // (8) ch3 단독 해금(ch1·ch2 없이)도 흉터 활성 — activeScar 게이트 ch1|ch2|ch3 확장 검증
  LRS();
  const l34=LRG({martialLaw:true});    // ch3 만 해금 + martial 흉터 동시
  const scarSolo=LAS();
  ok('LEG3 단독: ch3 만 해금 → 흉터 활성(ch1·ch2 게이트 비의존)', l34.state.chaptersUnlocked.indexOf(1)===-1&&l34.state.chaptersUnlocked.indexOf(2)===-1&&!!scarSolo&&scarSolo.kind==='martial', JSON.stringify(scarSolo));
  // (9) 하위 호환: 챕터 1~2 세이브 로드 — ch3/martialLaw 개념 없던 구세이브 무손상
  LRS();
  LSV({chaptersUnlocked:[1,2], chapterProgress:{1:{unlockedAt:1},2:{unlockedAt:2}}, cityScars:[{bloc:'CARBON', kind:'prey'}]});
  const oldLoad2=LLD();
  ok('LEG3 하위호환: 챕터1~2 세이브 로드 정규화(ch3 미해금)', oldLoad2.chaptersUnlocked.indexOf(1)!==-1&&oldLoad2.chaptersUnlocked.indexOf(2)!==-1&&oldLoad2.chaptersUnlocked.indexOf(3)===-1);
  const oldScar2=LAS();
  ok('LEG3 하위호환: 기존 prey 흉터 로드 유지(bloc=CARBON·heatDelta=0)', !!oldScar2&&oldScar2.kind==='prey'&&oldScar2.bloc==='CARBON'&&oldScar2.heatDelta===0, JSON.stringify(oldScar2));
  // (10) 하위 호환: martialLaw 미공급(구 index.html 시그니처)이면 ch3 미해금 — 신필드 옵셔널
  LRS();
  const l35=LRG({anyRaid:true, topRaidBloc:'VANTA'});   // 구 시그니처 그대로
  ok('LEG3 시그니처 불변: martialLaw 미공급 → ch3 미해금·ch1만 해금', l35.state.chaptersUnlocked.indexOf(3)===-1&&l35.state.chaptersUnlocked.indexOf(1)!==-1&&l35.chapter3Newly===false);
  // (11) legacyUnlockChapter3 직접 멱등 — 이미 해금 배열에 3 있으면 newly=false
  const u3a=LU3({chaptersUnlocked:[], chapterProgress:{}, cityScars:[]});
  ok('LEG3 unlock3 직접: 신규 newly=true·배열에 3', u3a.newly===true&&u3a.state.chaptersUnlocked.indexOf(3)!==-1);
  const u3b=LU3(u3a.state);
  ok('LEG3 unlock3 직접: 멱등 newly=false', u3b.newly===false&&u3b.state.chaptersUnlocked.indexOf(3)!==-1);
  // ============================================================
  // v6.34 (레거시 Stage 4): 챕터 4 "Price of Splice"(스플라이스의 대가) — TL4 해금·splice 흉터·하위 호환
  //   원전 해금 "임의 Bloc 테크 레벨(TL) 4 달성 OR Ghost 스플라이스 3개" → 첫 분기(Bloc TL4)만 실존 신호로
  //   spliceTech/spliceBloc 파생(옵셔널 필드); Ghost 스플라이스 집계는 엔진 부재 → No-op.
  //   흉터 채널은 여전히 단 하나 — kind 'splice'(그 블록 시작 주가 -1). 우선순위 splice>martial>prey>raid.
  // ============================================================
  const LU4=window.legacyUnlockChapter4;
  ok('LEG4 fns exposed (unlockChapter4)', typeof LU4==='function');
  // (1) CHAPTER_META[4] 원전 메타 — 봉투 D · 제목 · 해금 조건 · 3문장(원문 발췌)
  const cm4=LCM(4);
  ok('LEG4 ch4 meta id/envelope/title', !!cm4&&cm4.id===4&&cm4.envelope==='D'&&cm4.title==='Price of Splice', JSON.stringify(cm4&&{id:cm4.id,e:cm4.envelope,t:cm4.title}));
  ok('LEG4 ch4 unlockCond=임의 Bloc 테크 레벨(TL) 4 달성', !!cm4&&cm4.unlockCond==='임의 Bloc 테크 레벨(TL) 4 달성', cm4&&cm4.unlockCond);
  ok('LEG4 ch4 story 3문장 + 원문 발췌("몸이 무기가 되면, 몸도 적이 된다")', !!cm4&&Array.isArray(cm4.story)&&cm4.story.length===3&&cm4.story.some(s=>s.indexOf('몸이 무기가 되면, 몸도 적이 된다')!==-1));
  ok('LEG4 ch1·ch2·ch3 메타 회귀 불변·TOTAL=8', LCM(1).title==='First Blood'&&LCM(2).title==='Insider Game'&&LCM(3).title==='Martial Night'&&LTC()===8);
  // (2) 미해금: spliceTech 없음 → ch4 잠금 (chapter4Newly=false)
  LRS();
  const l40=LRG({anyRaid:false, anyMna:false});
  ok('LEG4 미해금: spliceTech 미공급 → ch4 잠금 · chapter4Newly=false', l40.state.chaptersUnlocked.indexOf(4)===-1&&l40.chapter4Newly===false);
  ok('LEG4 반환에 chapter4Newly(boolean) 존재', typeof l40.chapter4Newly==='boolean');
  // (3) 해금: 임의 Bloc TL4(spliceTech) → ch4 해금 (chapter4Newly=true) · 레이드·M&A·계엄 없어도 독립 해금
  LRS();
  const l41=LRG({spliceTech:true});
  ok('LEG4 해금: spliceTech=true → ch4 해금 + chapter4Newly=true', l41.state.chaptersUnlocked.indexOf(4)!==-1&&l41.chapter4Newly===true);
  ok('LEG4 해금: ch1·ch2·ch3 독립(미해금)', l41.state.chaptersUnlocked.indexOf(1)===-1&&l41.state.chaptersUnlocked.indexOf(2)===-1&&l41.state.chaptersUnlocked.indexOf(3)===-1);
  // (4) 멱등: 이미 해금 후 재달성 → chapter4Newly=false
  const l42=LRG({spliceTech:true});
  ok('LEG4 멱등: 재달성 chapter4Newly=false (해금 유지)', l42.chapter4Newly===false&&l42.state.chaptersUnlocked.indexOf(4)!==-1);
  // (5) 영속: ch4 해금 + spliceBloc → splice 흉터 (bloc · kind=splice · heatDelta=0 = 시작 주가 -1)
  LRS();
  LRG({spliceTech:true});                        // 해금(표적 블록 없음)
  LRG({spliceTech:true, spliceBloc:'HELIX'});    // TL4 과잉 개조 블록 발생
  const scarS=LAS();
  ok('LEG4 영속: splice 흉터 kind=splice · bloc=HELIX · heatDelta=0', !!scarS&&scarS.kind==='splice'&&scarS.bloc==='HELIX'&&scarS.heatDelta===0, JSON.stringify(scarS));
  // (6) 우선순위 splice > martial > prey > raid — 넷 공존 → 흉터=splice (챕터 순 최신 상처)
  LRS();
  const l43=LRG({anyRaid:true, topRaidBloc:'HELIX', anyMna:true, mnaPreyBloc:'AXIOM', martialLaw:true, spliceTech:true, spliceBloc:'CARBON'});
  const scarPri4=LAS();
  ok('LEG4 우선: raid+prey+martial+splice 공존 → 흉터=splice(CARBON)', !!scarPri4&&scarPri4.kind==='splice'&&scarPri4.bloc==='CARBON', JSON.stringify(scarPri4));
  ok('LEG4 동일판: ch1·ch2·ch3·ch4 모두 신규 해금(Newly 4개 true)', l43.chapter1Newly===true&&l43.chapter2Newly===true&&l43.chapter3Newly===true&&l43.chapter4Newly===true);
  // (7) 흉터 폴백: ch4 해금됐지만 이번 판 spliceBloc 없음(+ martial 존재) → 흉터=martial (splice 미발원)
  LRS();
  LRG({spliceTech:true, martialLaw:true});               // ch3·ch4 해금
  LRG({martialLaw:true});                                // TL4 블록 없는 판 → martial 흉터
  const scarFb4=LAS();
  ok('LEG4 폴백: ch4 해금+splice블록없음 → 흉터=martial', !!scarFb4&&scarFb4.kind==='martial'&&scarFb4.bloc===null, JSON.stringify(scarFb4));
  // (8) ch4 단독 해금(ch1·ch2·ch3 없이)도 흉터 활성 — activeScar 게이트 ch1|ch2|ch3|ch4 확장 검증
  LRS();
  const l44=LRG({spliceTech:true, spliceBloc:'VANTA'});    // ch4 만 해금 + splice 흉터 동시
  const scarSolo4=LAS();
  ok('LEG4 단독: ch4 만 해금 → 흉터 활성(ch1·ch2·ch3 게이트 비의존)', l44.state.chaptersUnlocked.indexOf(1)===-1&&l44.state.chaptersUnlocked.indexOf(2)===-1&&l44.state.chaptersUnlocked.indexOf(3)===-1&&!!scarSolo4&&scarSolo4.kind==='splice'&&scarSolo4.bloc==='VANTA', JSON.stringify(scarSolo4));
  // (9) 하위 호환: 챕터 1~3 세이브 로드 — ch4/spliceTech 개념 없던 구세이브 무손상
  LRS();
  LSV({chaptersUnlocked:[1,2,3], chapterProgress:{1:{unlockedAt:1},2:{unlockedAt:2},3:{unlockedAt:3}}, cityScars:[{bloc:null, kind:'martial'}]});
  const oldLoad3=LLD();
  ok('LEG4 하위호환: 챕터1~3 세이브 로드 정규화(ch4 미해금)', oldLoad3.chaptersUnlocked.indexOf(1)!==-1&&oldLoad3.chaptersUnlocked.indexOf(3)!==-1&&oldLoad3.chaptersUnlocked.indexOf(4)===-1);
  const oldScar3=LAS();
  ok('LEG4 하위호환: 기존 martial 흉터 로드 유지(bloc=null·heatDelta=1)', !!oldScar3&&oldScar3.kind==='martial'&&oldScar3.bloc===null&&oldScar3.heatDelta===1, JSON.stringify(oldScar3));
  // (10) 하위 호환: spliceTech 미공급(구 index.html 시그니처)이면 ch4 미해금 — 신필드 옵셔널
  LRS();
  const l45=LRG({anyRaid:true, topRaidBloc:'VANTA'});   // 구 시그니처 그대로
  ok('LEG4 시그니처 불변: spliceTech 미공급 → ch4 미해금·ch1만 해금', l45.state.chaptersUnlocked.indexOf(4)===-1&&l45.state.chaptersUnlocked.indexOf(1)!==-1&&l45.chapter4Newly===false);
  // (11) legacyUnlockChapter4 직접 멱등 — 이미 해금 배열에 4 있으면 newly=false
  const u4a=LU4({chaptersUnlocked:[], chapterProgress:{}, cityScars:[]});
  ok('LEG4 unlock4 직접: 신규 newly=true·배열에 4', u4a.newly===true&&u4a.state.chaptersUnlocked.indexOf(4)!==-1);
  const u4b=LU4(u4a.state);
  ok('LEG4 unlock4 직접: 멱등 newly=false', u4b.newly===false&&u4b.state.chaptersUnlocked.indexOf(4)!==-1);
  // ============================================================
  // v6.35 (레거시 Stage 5): 챕터 5 "Mesh Ghost"(메시 고스트) — CIPHER TL5/해킹노드3 해금·mesh 흉터·하위 호환
  //   원전 해금 "CIPHER 테크 레벨 5 달성 OR 메시 노드 3개 이상 침입 성공" → 두 분기 모두 실존 신호
  //   (p.tl≥5 · p.hackNodes≥3) 로 meshTech 파생(옵셔널 필드); 흉터 대상 meshBloc=종가 최저 블록.
  //   흉터 채널은 여전히 단 하나 — kind 'mesh'(그 블록 시작 주가 -1). 우선순위 mesh>splice>martial>prey>raid.
  // ============================================================
  const LU5=window.legacyUnlockChapter5;
  ok('LEG5 fns exposed (unlockChapter5)', typeof LU5==='function');
  // (1) CHAPTER_META[5] 원전 메타 — 봉투 E · 제목 · 해금 조건 · 3문장(원문 발췌)
  const cm5=LCM(5);
  ok('LEG5 ch5 meta id/envelope/title', !!cm5&&cm5.id===5&&cm5.envelope==='E'&&cm5.title==='Mesh Ghost', JSON.stringify(cm5&&{id:cm5.id,e:cm5.envelope,t:cm5.title}));
  ok('LEG5 ch5 unlockCond=CIPHER TL5 또는 메시 노드 3개 침입', !!cm5&&cm5.unlockCond==='CIPHER 테크 레벨 5 달성 또는 메시 노드 3개 이상 침입 성공', cm5&&cm5.unlockCond);
  ok('LEG5 ch5 story 3문장 + 원문 발췌("메시는 단순한 네트워크가 아니다")', !!cm5&&Array.isArray(cm5.story)&&cm5.story.length===3&&cm5.story.some(s=>s.indexOf('메시는 단순한 네트워크가 아니다')!==-1));
  ok('LEG5 ch1~4 메타 회귀 불변·TOTAL=8', LCM(1).title==='First Blood'&&LCM(2).title==='Insider Game'&&LCM(3).title==='Martial Night'&&LCM(4).title==='Price of Splice'&&LTC()===8);
  // (2) 미해금: meshTech 없음 → ch5 잠금 (chapter5Newly=false)
  LRS();
  const l50=LRG({anyRaid:false, anyMna:false});
  ok('LEG5 미해금: meshTech 미공급 → ch5 잠금 · chapter5Newly=false', l50.state.chaptersUnlocked.indexOf(5)===-1&&l50.chapter5Newly===false);
  ok('LEG5 반환에 chapter5Newly(boolean) 존재', typeof l50.chapter5Newly==='boolean');
  // (3) 해금: CIPHER TL5/해킹노드3(meshTech) → ch5 해금 (chapter5Newly=true) · 다른 챕터 없어도 독립 해금
  LRS();
  const l51=LRG({meshTech:true});
  ok('LEG5 해금: meshTech=true → ch5 해금 + chapter5Newly=true', l51.state.chaptersUnlocked.indexOf(5)!==-1&&l51.chapter5Newly===true);
  ok('LEG5 해금: ch1·ch2·ch3·ch4 독립(미해금)', l51.state.chaptersUnlocked.indexOf(1)===-1&&l51.state.chaptersUnlocked.indexOf(2)===-1&&l51.state.chaptersUnlocked.indexOf(3)===-1&&l51.state.chaptersUnlocked.indexOf(4)===-1);
  // (4) 멱등: 이미 해금 후 재달성 → chapter5Newly=false
  const l52=LRG({meshTech:true});
  ok('LEG5 멱등: 재달성 chapter5Newly=false (해금 유지)', l52.chapter5Newly===false&&l52.state.chaptersUnlocked.indexOf(5)!==-1);
  // (5) 영속: ch5 해금 + meshBloc → mesh 흉터 (bloc · kind=mesh · heatDelta=0 = 시작 주가 -1)
  LRS();
  LRG({meshTech:true});                       // 해금(표적 블록 없음)
  LRG({meshTech:true, meshBloc:'AXIOM'});      // 종가 최저 노드 발생
  const scarMesh=LAS();
  ok('LEG5 영속: mesh 흉터 kind=mesh · bloc=AXIOM · heatDelta=0', !!scarMesh&&scarMesh.kind==='mesh'&&scarMesh.bloc==='AXIOM'&&scarMesh.heatDelta===0, JSON.stringify(scarMesh));
  // (6) 우선순위 mesh > splice > martial > prey > raid — 다섯 공존 → 흉터=mesh (챕터 순 최신 상처)
  LRS();
  const l53=LRG({anyRaid:true, topRaidBloc:'HELIX', anyMna:true, mnaPreyBloc:'AXIOM', martialLaw:true, spliceTech:true, spliceBloc:'CARBON', meshTech:true, meshBloc:'VANTA'});
  const scarPri5=LAS();
  ok('LEG5 우선: raid+prey+martial+splice+mesh 공존 → 흉터=mesh(VANTA)', !!scarPri5&&scarPri5.kind==='mesh'&&scarPri5.bloc==='VANTA', JSON.stringify(scarPri5));
  ok('LEG5 동일판: ch1~5 모두 신규 해금(Newly 5개 true)', l53.chapter1Newly===true&&l53.chapter2Newly===true&&l53.chapter3Newly===true&&l53.chapter4Newly===true&&l53.chapter5Newly===true);
  // (7) 흉터 폴백: ch5 해금됐지만 이번 판 meshBloc 없음(+ splice 존재) → 흉터=splice (mesh 미발원)
  LRS();
  LRG({meshTech:true, spliceTech:true});                     // ch4·ch5 해금
  LRG({spliceTech:true, spliceBloc:'HELIX'});                // 메시 신호 없는 판 → splice 흉터
  const scarFb5=LAS();
  ok('LEG5 폴백: ch5 해금+mesh블록없음 → 흉터=splice(HELIX)', !!scarFb5&&scarFb5.kind==='splice'&&scarFb5.bloc==='HELIX', JSON.stringify(scarFb5));
  // (8) ch5 단독 해금(ch1~4 없이)도 흉터 활성 — activeScar 게이트 ch1|ch2|ch3|ch4|ch5 확장 검증
  LRS();
  const l54=LRG({meshTech:true, meshBloc:'CARBON'});          // ch5 만 해금 + mesh 흉터 동시
  const scarSolo5=LAS();
  ok('LEG5 단독: ch5 만 해금 → 흉터 활성(ch1~4 게이트 비의존)', l54.state.chaptersUnlocked.indexOf(1)===-1&&l54.state.chaptersUnlocked.indexOf(4)===-1&&!!scarSolo5&&scarSolo5.kind==='mesh'&&scarSolo5.bloc==='CARBON', JSON.stringify(scarSolo5));
  // (9) 하위 호환: 챕터 1~4 세이브 로드 — ch5/meshTech 개념 없던 구세이브 무손상
  LRS();
  LSV({chaptersUnlocked:[1,2,3,4], chapterProgress:{1:{unlockedAt:1},2:{unlockedAt:2},3:{unlockedAt:3},4:{unlockedAt:4}}, cityScars:[{bloc:'CARBON', kind:'splice'}]});
  const oldLoad4=LLD();
  ok('LEG5 하위호환: 챕터1~4 세이브 로드 정규화(ch5 미해금)', oldLoad4.chaptersUnlocked.indexOf(1)!==-1&&oldLoad4.chaptersUnlocked.indexOf(4)!==-1&&oldLoad4.chaptersUnlocked.indexOf(5)===-1);
  const oldScar4=LAS();
  ok('LEG5 하위호환: 기존 splice 흉터 로드 유지(bloc=CARBON·heatDelta=0)', !!oldScar4&&oldScar4.kind==='splice'&&oldScar4.bloc==='CARBON'&&oldScar4.heatDelta===0, JSON.stringify(oldScar4));
  // (10) 하위 호환: meshTech 미공급(구 index.html 시그니처)이면 ch5 미해금 — 신필드 옵셔널
  LRS();
  const l55=LRG({anyRaid:true, topRaidBloc:'VANTA'});   // 구 시그니처 그대로
  ok('LEG5 시그니처 불변: meshTech 미공급 → ch5 미해금·ch1만 해금', l55.state.chaptersUnlocked.indexOf(5)===-1&&l55.state.chaptersUnlocked.indexOf(1)!==-1&&l55.chapter5Newly===false);
  // (11) legacyUnlockChapter5 직접 멱등 — 이미 해금 배열에 5 있으면 newly=false
  const u5a=LU5({chaptersUnlocked:[], chapterProgress:{}, cityScars:[]});
  ok('LEG5 unlock5 직접: 신규 newly=true·배열에 5', u5a.newly===true&&u5a.state.chaptersUnlocked.indexOf(5)!==-1);
  const u5b=LU5(u5a.state);
  ok('LEG5 unlock5 직접: 멱등 newly=false', u5b.newly===false&&u5b.state.chaptersUnlocked.indexOf(5)!==-1);
  // ============================================================
  // v6.36 (레거시 Stage 6): 챕터 6 "Bloc Acquisition"(블록 인수) — M&A 인수 완결 해금·acquired 흉터·하위 호환
  //   원전 해금 "Bloc 1곳 완전 흡수(지분 51%+ 이사회 3R 장악)" → 엔진 인수 완결(meta.acquisitions 기록/
  //   피인수 p.acquiredBy 마커)에서 blocAbsorbed 파생(옵셔널 필드); 흉터 대상 absorbedBloc=흡수된 블록.
  //   흉터 채널은 여전히 단 하나 — kind 'acquired'(그 블록 시작 주가 -1). 우선순위 acquired>mesh>splice>martial>prey>raid.
  //   챕터 2("최초 M&A 선언"=mnaCount) 와 구분: ch6 은 선언 아닌 인수 완결만 트리거.
  // ============================================================
  const LU6=window.legacyUnlockChapter6;
  ok('LEG6 fns exposed (unlockChapter6)', typeof LU6==='function');
  // (1) CHAPTER_META[6] 원전 메타 — 봉투 F · 제목 · 해금 조건 · 3문장(원문 발췌)
  const cm6=LCM(6);
  ok('LEG6 ch6 meta id/envelope/title', !!cm6&&cm6.id===6&&cm6.envelope==='F'&&cm6.title==='Bloc Acquisition', JSON.stringify(cm6&&{id:cm6.id,e:cm6.envelope,t:cm6.title}));
  ok('LEG6 ch6 unlockCond=완전 흡수(51%+이사회 3R)', !!cm6&&cm6.unlockCond==='Bloc 1곳 완전 흡수 (지분 51% 이상 + 이사회 3라운드 장악)', cm6&&cm6.unlockCond);
  ok('LEG6 ch6 story 3문장 + 원문 발췌("블록은 죽지 않는다")', !!cm6&&Array.isArray(cm6.story)&&cm6.story.length===3&&cm6.story.some(s=>s.indexOf('블록은 죽지 않는다')!==-1));
  ok('LEG6 ch1~5 메타 회귀 불변·TOTAL=8', LCM(1).title==='First Blood'&&LCM(2).title==='Insider Game'&&LCM(3).title==='Martial Night'&&LCM(4).title==='Price of Splice'&&LCM(5).title==='Mesh Ghost'&&LTC()===8);
  // (2) 미해금: blocAbsorbed 없음 → ch6 잠금 (chapter6Newly=false)
  LRS();
  const l60=LRG({anyRaid:false, anyMna:false});
  ok('LEG6 미해금: blocAbsorbed 미공급 → ch6 잠금 · chapter6Newly=false', l60.state.chaptersUnlocked.indexOf(6)===-1&&l60.chapter6Newly===false);
  ok('LEG6 반환에 chapter6Newly(boolean) 존재', typeof l60.chapter6Newly==='boolean');
  // (3) 해금: M&A 인수 완결(blocAbsorbed) → ch6 해금 (chapter6Newly=true) · 다른 챕터 없어도 독립 해금
  LRS();
  const l61=LRG({blocAbsorbed:true});
  ok('LEG6 해금: blocAbsorbed=true → ch6 해금 + chapter6Newly=true', l61.state.chaptersUnlocked.indexOf(6)!==-1&&l61.chapter6Newly===true);
  ok('LEG6 해금: ch1~5 독립(미해금)', l61.state.chaptersUnlocked.indexOf(1)===-1&&l61.state.chaptersUnlocked.indexOf(2)===-1&&l61.state.chaptersUnlocked.indexOf(5)===-1);
  // (4) 챕터 2 vs 챕터 6 구분(핵심) — M&A 선언만(anyMna)이고 인수 미완결(blocAbsorbed 없음) → ch2 해금·ch6 미해금
  LRS();
  const l6d=LRG({anyMna:true, mnaPreyBloc:'AXIOM'});   // 선언·표적만, 완결 없음
  ok('LEG6 구분: anyMna(선언)만 → ch2 해금·ch6 미해금', l6d.state.chaptersUnlocked.indexOf(2)!==-1&&l6d.state.chaptersUnlocked.indexOf(6)===-1&&l6d.chapter6Newly===false);
  // (5) 멱등: 이미 해금 후 재달성 → chapter6Newly=false
  LRS();
  LRG({blocAbsorbed:true});                          // 최초 해금(chapter6Newly=true)
  const l62=LRG({blocAbsorbed:true});                // 재달성
  ok('LEG6 멱등: 재달성 chapter6Newly=false (해금 유지)', l62.chapter6Newly===false&&l62.state.chaptersUnlocked.indexOf(6)!==-1);
  // (6) 영속: ch6 해금 + absorbedBloc → acquired 흉터 (bloc · kind=acquired · heatDelta=0 = 시작 주가 -1)
  LRS();
  LRG({blocAbsorbed:true});                          // 해금(표적 블록 없음)
  LRG({blocAbsorbed:true, absorbedBloc:'HELIX'});     // 완전 흡수된 블록 발생
  const scarAcq=LAS();
  ok('LEG6 영속: acquired 흉터 kind=acquired · bloc=HELIX · heatDelta=0', !!scarAcq&&scarAcq.kind==='acquired'&&scarAcq.bloc==='HELIX'&&scarAcq.heatDelta===0, JSON.stringify(scarAcq));
  // (7) 우선순위 acquired > mesh > splice > martial > prey > raid — 여섯 공존 → 흉터=acquired (챕터 순 최신 상처)
  LRS();
  const l63=LRG({anyRaid:true, topRaidBloc:'HELIX', anyMna:true, mnaPreyBloc:'AXIOM', martialLaw:true, spliceTech:true, spliceBloc:'CARBON', meshTech:true, meshBloc:'VANTA', blocAbsorbed:true, absorbedBloc:'IRONWALL'});
  const scarPri6=LAS();
  ok('LEG6 우선: raid+prey+martial+splice+mesh+acquired 공존 → 흉터=acquired(IRONWALL)', !!scarPri6&&scarPri6.kind==='acquired'&&scarPri6.bloc==='IRONWALL', JSON.stringify(scarPri6));
  ok('LEG6 동일판: ch1~6 모두 신규 해금(Newly 6개 true)', l63.chapter1Newly===true&&l63.chapter2Newly===true&&l63.chapter3Newly===true&&l63.chapter4Newly===true&&l63.chapter5Newly===true&&l63.chapter6Newly===true);
  // (8) 흉터 폴백: ch6 해금됐지만 이번 판 absorbedBloc 없음(+ mesh 존재) → 흉터=mesh (acquired 미발원)
  LRS();
  LRG({blocAbsorbed:true, meshTech:true});                   // ch5·ch6 해금
  LRG({meshTech:true, meshBloc:'VANTA'});                     // 인수 완결 없는 판 → mesh 흉터
  const scarFb6=LAS();
  ok('LEG6 폴백: ch6 해금+흡수블록없음 → 흉터=mesh(VANTA)', !!scarFb6&&scarFb6.kind==='mesh'&&scarFb6.bloc==='VANTA', JSON.stringify(scarFb6));
  // (9) ch6 단독 해금(ch1~5 없이)도 흉터 활성 — activeScar 게이트 ch1|…|ch6 확장 검증
  LRS();
  const l64=LRG({blocAbsorbed:true, absorbedBloc:'AXIOM'});   // ch6 만 해금 + acquired 흉터 동시
  const scarSolo6=LAS();
  ok('LEG6 단독: ch6 만 해금 → 흉터 활성(ch1~5 게이트 비의존)', l64.state.chaptersUnlocked.indexOf(1)===-1&&l64.state.chaptersUnlocked.indexOf(5)===-1&&!!scarSolo6&&scarSolo6.kind==='acquired'&&scarSolo6.bloc==='AXIOM', JSON.stringify(scarSolo6));
  // (10) 하위 호환: 챕터 1~5 세이브 로드 — ch6/blocAbsorbed 개념 없던 구세이브 무손상
  LRS();
  LSV({chaptersUnlocked:[1,2,3,4,5], chapterProgress:{1:{unlockedAt:1},5:{unlockedAt:5}}, cityScars:[{bloc:'VANTA', kind:'mesh'}]});
  const oldLoad5=LLD();
  ok('LEG6 하위호환: 챕터1~5 세이브 로드 정규화(ch6 미해금)', oldLoad5.chaptersUnlocked.indexOf(1)!==-1&&oldLoad5.chaptersUnlocked.indexOf(5)!==-1&&oldLoad5.chaptersUnlocked.indexOf(6)===-1);
  const oldScar5=LAS();
  ok('LEG6 하위호환: 기존 mesh 흉터 로드 유지(bloc=VANTA·heatDelta=0)', !!oldScar5&&oldScar5.kind==='mesh'&&oldScar5.bloc==='VANTA'&&oldScar5.heatDelta===0, JSON.stringify(oldScar5));
  // (11) 하위 호환: blocAbsorbed 미공급(구 index.html 시그니처)이면 ch6 미해금 — 신필드 옵셔널
  LRS();
  const l65=LRG({anyRaid:true, topRaidBloc:'VANTA'});   // 구 시그니처 그대로
  ok('LEG6 시그니처 불변: blocAbsorbed 미공급 → ch6 미해금·ch1만 해금', l65.state.chaptersUnlocked.indexOf(6)===-1&&l65.state.chaptersUnlocked.indexOf(1)!==-1&&l65.chapter6Newly===false);
  // (12) legacyUnlockChapter6 직접 멱등 — 이미 해금 배열에 6 있으면 newly=false
  const u6a=LU6({chaptersUnlocked:[], chapterProgress:{}, cityScars:[]});
  ok('LEG6 unlock6 직접: 신규 newly=true·배열에 6', u6a.newly===true&&u6a.state.chaptersUnlocked.indexOf(6)!==-1);
  const u6b=LU6(u6a.state);
  ok('LEG6 unlock6 직접: 멱등 newly=false', u6b.newly===false&&u6b.state.chaptersUnlocked.indexOf(6)!==-1);
  // ============================================================
  // v6.39 (레거시 Stage 7): 챕터 7 "Heart of the City"(도시의 심장) — NEXUS 종료 장악 해금·nexus 흉터·하위 호환
  //   원전 해금 "어느 세력이든 NEXUS(F6) 3라운드 연속 장악" → 엔진 실존 신호 = 게임 종료 시점 NEXUS 소유자
  //   (getNexusController)에서 nexusHeld 파생(옵셔널). "3R 연속" 정밀 카운터는 死필드(No-op) → 종료 장악으로 근사.
  //   흉터 대상 nexusBloc=장악 Bloc(Ghost 장악 시 null). kind 'nexus'(그 블록 시작 주가 -1). 우선순위 nexus>acquired>…>raid.
  // ============================================================
  const LU7=window.legacyUnlockChapter7, LU8=window.legacyUnlockChapter8, LCC=window.legacyCampaignComplete;
  ok('LEG7/8 fns exposed (unlock7/unlock8/campaignComplete)', typeof LU7==='function'&&typeof LU8==='function'&&typeof LCC==='function');
  // (1) CHAPTER_META[7] 원전 메타 — 봉투 G · 제목 · 해금 조건 · 3문장(원문 발췌)
  const cm7=LCM(7);
  ok('LEG7 ch7 meta id/envelope/title', !!cm7&&cm7.id===7&&cm7.envelope==='G'&&cm7.title==='Heart of the City', JSON.stringify(cm7&&{id:cm7.id,e:cm7.envelope,t:cm7.title}));
  ok('LEG7 ch7 unlockCond=NEXUS(F6) 3라운드 연속 장악', !!cm7&&cm7.unlockCond==='어느 세력이든 NEXUS (F6) 3라운드 연속 장악 달성', cm7&&cm7.unlockCond);
  ok('LEG7 ch7 story 3문장 + 원문 발췌("왕관이 있는 자리가 무겁다")', !!cm7&&Array.isArray(cm7.story)&&cm7.story.length===3&&cm7.story.some(s=>s.indexOf('왕관이 있는 자리가 무겁다')!==-1));
  ok('LEG7 ch1~6 메타 회귀 불변·TOTAL=8', LCM(1).title==='First Blood'&&LCM(4).title==='Price of Splice'&&LCM(6).title==='Bloc Acquisition'&&LTC()===8);
  // (2) 미해금: nexusHeld 없음 → ch7 잠금 (chapter7Newly=false)
  LRS();
  const l70=LRG({anyRaid:false, anyMna:false});
  ok('LEG7 미해금: nexusHeld 미공급 → ch7 잠금 · chapter7Newly=false', l70.state.chaptersUnlocked.indexOf(7)===-1&&l70.chapter7Newly===false);
  ok('LEG7 반환에 chapter7Newly/chapter8Newly(boolean) 존재', typeof l70.chapter7Newly==='boolean'&&typeof l70.chapter8Newly==='boolean');
  // (3) 해금: NEXUS 종료 장악(nexusHeld) → ch7 해금 (chapter7Newly=true) · 다른 챕터 없어도 독립 해금
  LRS();
  const l71=LRG({nexusHeld:true});
  ok('LEG7 해금: nexusHeld=true → ch7 해금 + chapter7Newly=true', l71.state.chaptersUnlocked.indexOf(7)!==-1&&l71.chapter7Newly===true);
  ok('LEG7 해금: ch1~6 독립(미해금)·ch8 미해금(선행 미충족)', l71.state.chaptersUnlocked.indexOf(1)===-1&&l71.state.chaptersUnlocked.indexOf(6)===-1&&l71.state.chaptersUnlocked.indexOf(8)===-1&&l71.chapter8Newly===false);
  // (4) 멱등: 이미 해금 후 재장악 → chapter7Newly=false
  const l72=LRG({nexusHeld:true});
  ok('LEG7 멱등: 재장악 chapter7Newly=false (해금 유지)', l72.chapter7Newly===false&&l72.state.chaptersUnlocked.indexOf(7)!==-1);
  // (5) 영속: ch7 해금 + nexusBloc → nexus 흉터 (bloc · kind=nexus · heatDelta=0 = 시작 주가 -1)
  LRS();
  LRG({nexusHeld:true});                          // 해금(Bloc 미지정)
  LRG({nexusHeld:true, nexusBloc:'IRONWALL'});     // NEXUS 장악 Bloc 발생
  const scarNex=LAS();
  ok('LEG7 영속: nexus 흉터 kind=nexus · bloc=IRONWALL · heatDelta=0', !!scarNex&&scarNex.kind==='nexus'&&scarNex.bloc==='IRONWALL'&&scarNex.heatDelta===0, JSON.stringify(scarNex));
  // (6) Ghost 장악(nexusHeld=true·nexusBloc=null=중립) → ch7 해금하되 nexus 흉터 미발원 (흉터 없음)
  LRS();
  const l73=LRG({nexusHeld:true, nexusBloc:null});
  ok('LEG7 Ghost 장악: ch7 해금·nexus 흉터 미발원(NEXUS 중립)', l73.state.chaptersUnlocked.indexOf(7)!==-1&&LAS()===null);
  // (7) 우선순위 nexus > acquired > mesh > splice > martial > prey > raid — 일곱 공존(ch8 완주 아님) → 흉터=nexus
  //     ch8 완주를 피하려고 ch1 만 빼고 ch2~7 신호 공급 → chapter8Newly=false → nexus 최상위
  LRS();
  const l74=LRG({anyMna:true, mnaPreyBloc:'AXIOM', martialLaw:true, spliceTech:true, spliceBloc:'CARBON', meshTech:true, meshBloc:'VANTA', blocAbsorbed:true, absorbedBloc:'IRONWALL', nexusHeld:true, nexusBloc:'HELIX'});
  const scarPri7=LAS();
  ok('LEG7 우선: prey+martial+splice+mesh+acquired+nexus 공존(ch1 제외) → 흉터=nexus(HELIX)', !!scarPri7&&scarPri7.kind==='nexus'&&scarPri7.bloc==='HELIX'&&l74.chapter8Newly===false, JSON.stringify(scarPri7));
  // (8) 흉터 폴백: ch7 해금됐지만 이번 판 nexusBloc 없음(+ acquired 존재) → 흉터=acquired (nexus 미발원)
  LRS();
  LRG({nexusHeld:true, blocAbsorbed:true});                   // ch6·ch7 해금
  LRG({blocAbsorbed:true, absorbedBloc:'CARBON'});            // NEXUS 신호 없는 판 → acquired 흉터
  const scarFb7=LAS();
  ok('LEG7 폴백: ch7 해금+NEXUS블록없음 → 흉터=acquired(CARBON)', !!scarFb7&&scarFb7.kind==='acquired'&&scarFb7.bloc==='CARBON', JSON.stringify(scarFb7));
  // (9) ch7 단독 해금(ch1~6 없이)도 흉터 활성 — activeScar 게이트 ch1|…|ch8 확장 검증
  LRS();
  const l75=LRG({nexusHeld:true, nexusBloc:'AXIOM'});         // ch7 만 해금 + nexus 흉터 동시
  const scarSolo7=LAS();
  ok('LEG7 단독: ch7 만 해금 → 흉터 활성(ch1~6 게이트 비의존)', l75.state.chaptersUnlocked.indexOf(1)===-1&&l75.state.chaptersUnlocked.indexOf(6)===-1&&!!scarSolo7&&scarSolo7.kind==='nexus'&&scarSolo7.bloc==='AXIOM', JSON.stringify(scarSolo7));
  // (10) 하위 호환: nexusHeld 미공급(구 index.html 시그니처)이면 ch7 미해금 — 신필드 옵셔널
  LRS();
  const l76=LRG({anyRaid:true, topRaidBloc:'VANTA'});   // 구 시그니처 그대로
  ok('LEG7 시그니처 불변: nexusHeld 미공급 → ch7 미해금·ch1만 해금', l76.state.chaptersUnlocked.indexOf(7)===-1&&l76.state.chaptersUnlocked.indexOf(1)!==-1&&l76.chapter7Newly===false);
  // (11) legacyUnlockChapter7 직접 멱등
  const u7a=LU7({chaptersUnlocked:[], chapterProgress:{}, cityScars:[]});
  ok('LEG7 unlock7 직접: 신규 newly=true·배열에 7', u7a.newly===true&&u7a.state.chaptersUnlocked.indexOf(7)!==-1);
  ok('LEG7 unlock7 직접: 멱등 newly=false', LU7(u7a.state).newly===false);
  // ============================================================
  // v6.39 (레거시 Stage 8): 챕터 8 "Zero Day"(제로 데이, 완결 8/8) — 파생 해금(챕터 1~7 전부)·완주 상태·zeroday 흉터
  //   원전 해금 "Chapter 07 완료"이나 최종 챕터 서사가 전 여정 귀결 → 구현: 챕터 1~7 전부 해금 시 자동 해금 = 캠페인 완주.
  //   legacyCampaignComplete()=8/8. kind 'zeroday'(도시 전역 공권력 +1, 완주 판 1회성). 우선순위 zeroday 최상위.
  // ============================================================
  // (12) CHAPTER_META[8] 원전 메타 — 봉투 H · 제목 · 해금 조건 · epilogue(원문 발췌) · 3문장
  const cm8=LCM(8);
  ok('LEG8 ch8 meta id/envelope/title', !!cm8&&cm8.id===8&&cm8.envelope==='H'&&cm8.title==='Zero Day', JSON.stringify(cm8&&{id:cm8.id,e:cm8.envelope,t:cm8.title}));
  ok('LEG8 ch8 unlockCond=챕터 1~7 전부 해금 자동(완결)', !!cm8&&cm8.unlockCond==='챕터 1~7 전부 해금 시 자동 해금 (캠페인 완결)', cm8&&cm8.unlockCond);
  ok('LEG8 ch8 story 3문장 + 원문 발췌("이 도시의 마지막 이름을 정하는 것은 우리다")', !!cm8&&Array.isArray(cm8.story)&&cm8.story.length===3&&cm8.story.some(s=>s.indexOf('이 도시의 마지막 이름을 정하는 것은 우리다')!==-1));
  ok('LEG8 ch8 epilogue 원문 발췌("마지막 이름을 정하는 건 언제나 우리였다")', !!cm8&&typeof cm8.epilogue==='string'&&cm8.epilogue.indexOf('마지막 이름을 정하는 건 언제나 우리였다')!==-1, cm8&&cm8.epilogue);
  // (13) 파생 해금: 챕터 1~6 만 해금 → ch8 미해금(선행 ch7 미충족). legacyUnlockChapter8 직접 unlocked=false·newly=false
  const u8no=LU8({chaptersUnlocked:[1,2,3,4,5,6], chapterProgress:{}, cityScars:[]});
  ok('LEG8 파생: ch1~6만 → ch8 미해금(unlocked=false·newly=false·8 미추가)', u8no.unlocked===false&&u8no.newly===false&&u8no.state.chaptersUnlocked.indexOf(8)===-1);
  // (14) 파생 해금: 한 판에 ch1~7 신호 전부 → ch8 자동 해금 chapter8Newly=true + campaignComplete=true
  LRS();
  const lFin=LRG({anyRaid:true, topRaidBloc:'HELIX', anyMna:true, mnaPreyBloc:'AXIOM', martialLaw:true, spliceTech:true, spliceBloc:'CARBON', meshTech:true, meshBloc:'VANTA', blocAbsorbed:true, absorbedBloc:'IRONWALL', nexusHeld:true, nexusBloc:'HELIX'});
  ok('LEG8 파생: ch1~7 신호 전부 → ch8 자동 해금·chapter8Newly=true', lFin.state.chaptersUnlocked.indexOf(8)!==-1&&lFin.chapter8Newly===true);
  ok('LEG8 완주: 반환 campaignComplete=true (8/8)', lFin.campaignComplete===true&&lFin.state.chaptersUnlocked.length===8);
  // (15) legacyCampaignComplete: 8/8 → true; 7/8 → false
  ok('LEG8 완주 헬퍼: 8/8 → true', LCC(lFin.state)===true);
  ok('LEG8 완주 헬퍼: 7/8(8 제외) → false', LCC({chaptersUnlocked:[1,2,3,4,5,6,7]})===false);
  // (16) 우선순위 zeroday 최상위: 완주 판(chapter8Newly)에 모든 신호 공존 → 흉터=zeroday (도시 전역·bloc=null·heatDelta=1)
  const scarZd=LAS();
  ok('LEG8 우선: 완주 판 모든 신호 공존 → 흉터=zeroday(도시 전역·heatDelta=1·bloc=null)', !!scarZd&&scarZd.kind==='zeroday'&&scarZd.bloc===null&&scarZd.heatDelta===1, JSON.stringify(scarZd));
  // (17) zeroday 1회성: 완주 다음 판(chapter8Newly=false, nexusBloc 공급) → 흉터=nexus 재평가 (zeroday 미재발원)
  const lAfter=LRG({nexusHeld:true, nexusBloc:'VANTA'});
  const scarAfter=LAS();
  ok('LEG8 1회성: 완주 다음 판 chapter8Newly=false → 흉터=nexus(VANTA) 재평가', lAfter.chapter8Newly===false&&lAfter.campaignComplete===true&&!!scarAfter&&scarAfter.kind==='nexus'&&scarAfter.bloc==='VANTA', JSON.stringify(scarAfter));
  // (18) legacyUnlockChapter8 직접 멱등 — 이미 8 있으면 newly=false
  const u8a=LU8({chaptersUnlocked:[1,2,3,4,5,6,7], chapterProgress:{}, cityScars:[]});
  ok('LEG8 unlock8 직접: 선행 충족 신규 newly=true·배열에 8', u8a.unlocked===true&&u8a.newly===true&&u8a.state.chaptersUnlocked.indexOf(8)!==-1);
  ok('LEG8 unlock8 직접: 멱등 newly=false', LU8(u8a.state).newly===false);
  // (19) 하위 호환: 챕터 1~6 세이브 로드 — ch7/ch8/nexus/zeroday 개념 없던 구세이브 무손상
  LRS();
  LSV({chaptersUnlocked:[1,2,3,4,5,6], chapterProgress:{1:{unlockedAt:1},6:{unlockedAt:6}}, cityScars:[{bloc:'IRONWALL', kind:'acquired'}]});
  const oldLoad6=LLD();
  ok('LEG8 하위호환: 챕터1~6 세이브 로드 정규화(ch7·ch8 미해금)', oldLoad6.chaptersUnlocked.indexOf(6)!==-1&&oldLoad6.chaptersUnlocked.indexOf(7)===-1&&oldLoad6.chaptersUnlocked.indexOf(8)===-1);
  const oldScar6=LAS();
  ok('LEG8 하위호환: 기존 acquired 흉터 로드 유지(bloc=IRONWALL·heatDelta=0)', !!oldScar6&&oldScar6.kind==='acquired'&&oldScar6.bloc==='IRONWALL'&&oldScar6.heatDelta===0, JSON.stringify(oldScar6));
  ok('LEG8 하위호환: ch1~6 세이브 완주 아님(campaignComplete=false)', LCC(oldLoad6)===false);
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
