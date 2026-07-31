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
    const news5Logs=d5.log.filter(l=>String(l.message||'').startsWith('📰')&&!String(l.message||'').includes('덱 오염')).length
                   -s5.log.filter(l=>String(l.message||'').startsWith('📰')&&!String(l.message||'').includes('덱 오염')).length;
    ok('S05 뉴스 로그 2줄 (효과 순차 적용 = 기존 경로 2회)',news5Logs===2,`got ${news5Logs}`);
    // 타 시나리오 무영향 — S01/S03/S06 은 newsDrawCount 미지정 → 1장 + newsDrawn 미설정
    for (const sid of ['S01','S03','S06']) {
      const sx=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:sid});
      ok(`${sid} newsDrawCount 미지정 → 폴백 1`,SR(sx,'newsDrawCount',1)===1);
      const dx=R5(sx,{type:'DRAW_NEWS'});
      const nLogs=dx.log.filter(l=>String(l.message||'').startsWith('📰')&&!String(l.message||'').includes('덱 오염')).length
                 -sx.log.filter(l=>String(l.message||'').startsWith('📰')&&!String(l.message||'').includes('덱 오염')).length;
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
  // v6.53 [3차 감사 #26]: 결정론 헬퍼 — Math.random 상수 스텁(호출부 한정 복원 보장).
  //   0.99 고정: 확률 게이트(suppression 0.3·leaderBreak 0.6·botProb 0.5)를 전부 "스킵" 쪽으로
  //   고정해 라운드 파이프라인을 결정론화한다 (기존 seedRun 패턴의 상수판).
  const withRand=(v,fn)=>{const real=Math.random;Math.random=()=>v;try{return fn();}finally{Math.random=real;}};
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
  // v6.53 [3차 감사 #26 ⑦]: 동어반복 교정 — 기존 테스트는 divMult 를 프로덕션 식 그대로 재계산해
  //   자기검증이었다. 교체: COLLECT_INCOME 를 실제 실행하고 배당 수령액을 수동 계산 리터럴로 핀.
  //   픽스처: map 비움(구역·건물·확장 노이즈 0) · P0(CARBON) 보유 자사 CARBON 10주 + VANTA 4주 · 트랙 없음.
  //   저가(합 5×5=25, 배수 1): floor(10×0.5)+floor(4×0.5) = 5+2 = ₵+7
  //   회복(합 11×5=55, 배수 2): floor(10×0.5×2)+floor(4×0.5×2) = 10+4 = ₵+14
  const s6divFix=(prices)=>({...s6,stocks:Object.fromEntries(Object.keys(s6.stocks).map(k=>[k,prices])),map:{},
    players:s6.players.map((p,i)=>i===0?{...p,tracks:{},pool:{},stocks:{CARBON:10,VANTA:4}}:p)});
  const s6divGain=(st)=>{const r=withRand(0.99,()=>R(st,{type:'COLLECT_INCOME'}));return r.players[0].resources.credit-st.players[0].resources.credit;};
  ok('S06 붕괴(합25) 배당 무배수 — COLLECT_INCOME 실측 ₵+7',s6divGain(s6divFix(5))===7,`got ${s6divGain(s6divFix(5))}`);
  ok('S06 회복(합55) 배당 2배 — COLLECT_INCOME 실측 ₵+14',s6divGain(s6divFix(11))===14,`got ${s6divGain(s6divFix(11))}`);
  // 격리: 동일 픽스처를 S01 로 옮기면(임계 폴백 Infinity) 합 55 여도 무배수 ₵+7
  const s1divFix={...s6divFix(11),meta:{...s6.meta,scenario:'S01'}};
  ok('S01 동일 픽스처(합55) 배당 무배수 ₵+7 (S06 전용 게이트)',s6divGain(s1divFix)===7,`got ${s6divGain(s1divFix)}`);
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
  // ============================================================
  // v6.51 [3차 감사 1파] E1~E14 회귀 — rules_module + 리듀서 배선
  //   러너는 실패 시 케이스명을 항상 출력(FAIL <name> [extra]) — 플레이키 재현용 (E15①).
  // ============================================================
  const RVP=window.rules_victoryByPoints, RVRt=window.rules_victoryRatio, CVPt=window.checkVictoryByPoints,
        TVX=window.rules_truceViolationFx, TAB=window.rules_truceActiveBetween, RFX=window.rules_raidSuccessFx,
        NCPI=window.rules_negoCapInfo, AEFF=window.applyEffect, NAPP=window.negoApply, INSC=window.insertScandal,
        MNAC=window.euro_declareMnaCheck;
  ok('E51 core fns exposed',[RVP,RVRt,CVPt,TVX,TAB,RFX,NCPI,AEFF,NAPP,INSC,MNAC].every(f=>typeof f==='function'));
  ok('E51 NEGO_MAX 단일 소스 =2',window.RULES_NEGO_MAX===2);
  // ---- E1: 타임아웃 승자 = 정규화 진척 비교 (필터·hlBonus·동률) ----
  const e1b=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:'S01'});
  const mkG=(over)=>({...e1b.players[0],role:'ghost',isNpc:false,defeated:false,highlightPoints:0,...over,resources:{...e1b.players[0].resources,...(over.resources||{})}});
  const e1All=(ps,extraMeta)=>({...e1b,players:ps,meta:{...e1b.meta,raidsThisGame:{},...(extraMeta||{})}});
  const e1=e1All([mkG({resources:{rep:200}}),mkG({resources:{rep:100}}),mkG({isNpc:true,resources:{rep:9999}}),mkG({defeated:true,resources:{rep:9999}})]);
  const e1r=RVP(e1);
  ok('E1 승자 = 진척 1위 (NPC·defeated 제외)',e1r.meta.gameOver===true&&e1r.meta.winner===0,`winner ${e1r.meta.winner} (${e1r.meta.winReason})`);
  ok('E1 winReason 정규화 표기',String(e1r.meta.winReason||'').indexOf('목표 진척')>=0,e1r.meta.winReason);
  // hlBonus 가산: P1 rep 100 + hl(round(hp×0.3)) 가 P0 rep 200 을 역전
  const e1hl=e1All([mkG({resources:{rep:200}}),mkG({resources:{rep:100},highlightPoints:400})]);
  ok('E1 hlBonus 가산 역전 (100+120✨ > 200)',RVP(e1hl).meta.winner===1,`winner ${RVP(e1hl).meta.winner}`);
  // 렙배틀 경로(min 성분): 레이드 충족 + 렙배틀 초과 > 렙온리 경로
  const gE1=GVG(e1);
  const e1bt=e1All([mkG({resources:{rep:gE1.ghostRepOnly}}),mkG({resources:{rep:Math.ceil(gE1.ghostRepBattle*1.3)}})],{raidsThisGame:{1:gE1.ghostRaids*2}});
  ok('E1 렙배틀 경로 min(렙,레이드) 반영',RVP(e1bt).meta.winner===1,`winner ${RVP(e1bt).meta.winner} goals ${JSON.stringify(gE1)}`);
  // 동률 규칙: 완전 동률 → 무승부 (배열 순서로 승자 갈리지 않음)
  const e1t=e1All([mkG({resources:{rep:120}}),mkG({resources:{rep:120}})]);
  const e1tr=RVP(e1t);
  ok('E1 동률 → 무승부 (winner null)',e1tr.meta.gameOver===true&&e1tr.meta.winner===null&&String(e1tr.meta.winReason).indexOf('무승부')>=0,e1tr.meta.winReason);
  ok('E1 checkVictoryByPoints 위임 동일',CVPt(e1).meta.winner===0&&CVPt(e1t).meta.winner===null);
  ok('E1 rules_victoryRatio NPC/defeated=-Inf',RVRt(e1.players[2],2,e1,gE1)===-Infinity&&RVRt(e1.players[3],3,e1,gE1)===-Infinity);
  // ---- E2: effect 키당 1회 발동 + heal_all 대상 필터 ----
  const h3=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:'S03'});
  const hGj=h3.players.findIndex((p,i)=>i>0&&!p.isNpc&&p.role==='ghost');
  const hBj=h3.players.findIndex(p=>!p.isNpc&&p.role==='bloc');
  const hNj=h3.players.findIndex(p=>p.isNpc);
  const hDmg={...h3,players:h3.players.map(p=>({...p,hp:1}))};
  const hRes=AEFF(hDmg,0,{heal_all:50},'main',null);
  const hExp=(p)=>Math.min(p.maxHp,1+Math.max(1,Math.floor(p.maxHp*0.5)));
  ok('E2 heal_all 50%: 시전 Ghost 회복(1회만, 고정+3 중복 없음)',hRes.players[0].hp===hExp(h3.players[0]),`got ${hRes.players[0].hp} exp ${hExp(h3.players[0])}`);
  ok('E2 heal_all: 같은 진영 Ghost 회복',hGj>0&&hRes.players[hGj].hp===hExp(h3.players[hGj]),`got ${hRes.players[hGj]&&hRes.players[hGj].hp}`);
  ok('E2 heal_all: 타 진영(Bloc) 비회복',hBj>=0&&hRes.players[hBj].hp===1,`got ${hRes.players[hBj]&&hRes.players[hBj].hp}`);
  ok('E2 heal_all: NPC 비회복',hNj>=0&&hRes.players[hNj].hp===1);
  const hDef={...hDmg,players:hDmg.players.map((p,i)=>i===hGj?{...p,defeated:true}:p)};
  ok('E2 heal_all: 탈락자 비회복',AEFF(hDef,0,{heal_all:50},'main',null).players[hGj].hp===1);
  const h2=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'VANTA',humans:null,scenario:'S02'});
  const h2b=h2.players.findIndex((p,i)=>i>0&&!p.isNpc&&p.role==='bloc');
  const h2r=AEFF({...h2,players:h2.players.map(p=>({...p,hp:1}))},0,{heal_all:99},'main',null);
  ok('E2 heal_all 99%: Bloc 시전 → 자기 진영 Bloc 회복·NPC 제외',h2r.players[0].hp===h2.players[0].maxHp&&(h2b<0||h2r.players[h2b].hp===h2.players[h2b].maxHp)&&h2r.players.every((p,i)=>!p.isNpc||p.hp===1),`p0 ${h2r.players[0].hp}/${h2.players[0].maxHp}`);
  // crash_target: 총 주가 하락 = 정확히 amt (중복 분기 2회 하락 봉합) + CIPHER 보너스 1회
  const cr0=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'CIPHER',humans:null,scenario:'S01'});
  const cr1={...cr0,players:cr0.players.map((p,i)=>i===0?{...p,tracks:{}}:p)};
  const crSum=st=>Object.values(st.stocks).reduce((a,v)=>a+v,0);
  const crR=AEFF(cr1,0,{crash_target:3},'main',null);
  ok('E2 crash_target: 총 주가 하락 정확히 3 (1회 발동)',crSum(cr1)-crSum(crR)===3,`drop ${crSum(cr1)-crSum(crR)}`);
  ok('E2 crash_target: Ghost 보너스 ★+3 📡+1 (1회)',crR.players[0].resources.rep-cr1.players[0].resources.rep===3&&crR.players[0].resources.data-cr1.players[0].resources.data===1,`rep+${crR.players[0].resources.rep-cr1.players[0].resources.rep} data+${crR.players[0].resources.data-cr1.players[0].resources.data}`);
  // swap_ratio: 1:2 실환전만 (₵+3 폴백 중복 없음)
  const sw1={...cr0,players:cr0.players.map((p,i)=>i===0?{...p,tracks:{},resources:{...p.resources,data:5}}:p)};
  const swR=AEFF(sw1,0,{swap_ratio:2},'main',null);
  ok('E2 swap_ratio: 📡-2 → ₵+4 정확 (중복 ₵+3 없음)',swR.players[0].resources.data===3&&swR.players[0].resources.credit-sw1.players[0].resources.credit===4,`data ${swR.players[0].resources.data} ₵diff ${swR.players[0].resources.credit-sw1.players[0].resources.credit}`);
  // force_enter: BLADE 폴백 번들 1회 (★+3, 구 ★+2 분기 제거) — 인접 Bloc 없는 칸에서
  const feFree=Object.keys(cr0.map).find(c=>cr0.map[c].owner==null&&coordsAdj(c).every(a=>!cr0.map[a]||cr0.map[a].owner==null));
  const fe1={...cr0,players:cr0.players.map((p,i)=>i===0?{...p,tracks:{},position:feFree}:p)};
  const feR=AEFF(fe1,0,{force_enter:1},'main',null);
  ok('E2 force_enter: ★+3 정확 (1회 발동, +2 중복 없음)',feR.players[0].resources.rep-fe1.players[0].resources.rep===3,`rep+${feR.players[0].resources.rep-fe1.players[0].resources.rep} at ${feFree}`);
  // ---- E3: 인간 협상 라운드당 캡 (봇 NEGO_MAX=2 동일) ----
  const n0raw=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BROKER',humans:null,scenario:'S01'});
  const n0={...n0raw,players:n0raw.players.map((p,i)=>i===0?{...p,tracks:{}}:p)};  // 트랙 마일스톤 ★ 노이즈 차단
  const nTo=n0.players.findIndex((p,i)=>i>0&&!p.isNpc&&!p.defeated);
  const nProp={from:0,to:nTo,type:'broker_deal',give:{},get:{rep:1,credit:1},value:3};
  let nS=n0;
  nS=R(nS,{type:'PROPOSE_NEGOTIATION',prop:nProp});
  nS=R(nS,{type:'PROPOSE_NEGOTIATION',prop:nProp});
  const nRep2=nS.players[0].resources.rep;
  ok('E3 캡 전 2회 제안 정상 처리 (broker ★+2)',nRep2-n0.players[0].resources.rep===2&&(nS.meta.negoStats||{}).proposed===2,`rep+${nRep2-n0.players[0].resources.rep} proposed ${(nS.meta.negoStats||{}).proposed}`);
  ok('E3 rules_negoCapInfo 도달 판정',NCPI(nS,0).ok===false&&NCPI(nS,0).used===2&&NCPI(n0,0).ok===true,JSON.stringify(NCPI(nS,0)));
  const nS3=R(nS,{type:'PROPOSE_NEGOTIATION',prop:nProp});
  ok('E3 캡 도달 3회째 거부 (자원 불변+로그, 조용한 거부 금지)',nS3.players[0].resources.rep===nRep2&&(nS3.meta.negoStats||{}).proposed===2&&String((nS3.log[nS3.log.length-1]||{}).message).indexOf('협상 제안 거부')>=0,String((nS3.log[nS3.log.length-1]||{}).message));
  const nNext={...nS,meta:{...nS.meta,round:nS.meta.round+1}};
  ok('E3 라운드 전환 시 캡 리셋',NCPI(nNext,0).ok===true&&NCPI(nNext,0).used===0);
  // ---- E4: truce 위반 공통 헬퍼 (attacker,target 인자 — 봇↔봇 포함) ----
  const t0={...n0,meta:{...n0.meta,promises:[{from:1,to:2,type:'truce',expiresR:n0.meta.round+1,status:'active'}]}};
  const tV=TVX(t0,2,1);
  ok('E4 위반: 공격자 ★-2(하한0)·피해자 ★+2·broken',tV.meta.promises[0].status==='broken'&&tV.players[1].resources.rep-t0.players[1].resources.rep===2&&tV.players[2].resources.rep===Math.max(0,t0.players[2].resources.rep-2),`att ${tV.players[2].resources.rep} vic ${tV.players[1].resources.rep}`);
  ok('E4 무관 쌍 항등(참조 동일)',TVX(t0,0,3)===t0&&TVX(t0,1,1)===t0);
  ok('E4 만료 truce 비위반(항등)',TVX({...t0,meta:{...t0.meta,promises:[{from:1,to:2,type:'truce',expiresR:n0.meta.round-1,status:'active'}]}},2,1).meta.promises[0].status==='active');
  // ---- E7: 레이드 성공 부작용 공통화 (카운터 불변·스캔들·truce·하이라이트) ----
  const rBj=n0.players.findIndex(p=>!p.isNpc&&p.role==='bloc');
  const rq0={...n0,meta:{...n0.meta,promises:[{from:0,to:rBj,type:'truce',expiresR:n0.meta.round+1,status:'active'}],highlights:[]}};
  const rqR=RFX(rq0,0,rBj,n0.players[rBj].specific);
  ok('E7 카운터: raidsThisGame·raidDmgByBloc +1 (불변 갱신)',rqR.meta.raidsThisGame[0]===(rq0.meta.raidsThisGame[0]||0)+1&&rqR.meta.raidDmgByBloc[n0.players[rBj].specific]===1&&rq0.meta.raidsThisGame[0]===(n0.meta.raidsThisGame[0]||0),JSON.stringify(rqR.meta.raidDmgByBloc));
  ok('E7 스캔들 오염 적용',(rqR.players[rBj].discard||[]).filter(c=>c==='SCANDAL').length===1);
  ok('E7 truce 위반 판정 통과 경로 포함',rqR.meta.promises[0].status==='broken');
  ok('E7 첫 레이드 하이라이트 기록',(rqR.meta.highlights||[]).some(h=>h.key==='first_raid_success'&&h.playerIdx===0));
  // ---- E8: 동일 쌍 truce 중복 등록 거부 ----
  let u1=NAPP(n0,{from:0,to:nTo,type:'truce',give:{},get:{},expiresR:n0.meta.round+1});
  ok('E8 truce 1차 등록 성사',(u1.meta.promises||[]).length===1&&TAB(u1,0,nTo)===true&&TAB(u1,nTo,0)===true);
  const u2=NAPP(u1,{from:nTo,to:0,type:'truce',give:{},get:{},expiresR:u1.meta.round+1});
  ok('E8 동일 쌍(역방향 포함) 재등록 거부+로그',(u2.meta.promises||[]).length===1&&u2.meta.negoStats.rejected===u1.meta.negoStats.rejected+1&&String((u2.log[u2.log.length-1]||{}).message).indexOf('재등록 거부')>=0,String((u2.log[u2.log.length-1]||{}).message));
  // ---- E9: S06 시드 스캔들 카운터 기록 (POLLUTION_CAP 우회 봉합) ----
  const e9=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'CARBON',humans:null,scenario:'S06'});
  ok('E9 S06 시드 오염 카운터=1 (전 Bloc 좌석)',e9.players.every((p,i)=>p.role!=='bloc'||(e9.meta.scandalsThisGame||{})[i]===1),JSON.stringify(e9.meta.scandalsThisGame));
  const e9b=e9.players.findIndex(p=>p.role==='bloc');
  const e9one=INSC(e9,e9b,'test');
  const e9two=INSC(e9one,e9b,'test');
  ok('E9 시드 1 + 삽입 1 = CAP(2) 도달 → 3번째 차단',(e9one.meta.scandalsThisGame||{})[e9b]===2&&e9two===e9one&&(e9one.players[e9b].discard||[]).filter(c=>c==='SCANDAL').length===2,`cnt ${(e9one.meta.scandalsThisGame||{})[e9b]}`);
  ok('E9 타 시나리오 카운터 0 시작 (S01)',JSON.stringify(n0.meta.scandalsThisGame)==='{}');
  // ---- E5: mna_freeze 게이트 = check 함수 (UI 자동 비활성+사유) ----
  const m2=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'VANTA',humans:null,scenario:'S02'});
  const mTb=m2.players.find((p,i)=>i>0&&p.role==='bloc'&&!p.isNpc);
  const mFz={...m2,meta:{...m2.meta,mnaFrozenRound:m2.meta.round}};
  const mChk=MNAC(mFz,0,mTb?mTb.specific:'HELIX');
  ok('E5 freeze check: ok=false + 사유 문자열',mChk.ok===false&&String(mChk.reason).indexOf('위원회')>=0,JSON.stringify(mChk));
  ok('E5 비동결 라운드는 freeze 사유 아님',String(MNAC(m2,0,mTb?mTb.specific:'HELIX').reason).indexOf('위원회')<0);
  // ---- E14ⓓ: 흡수된 블록 재인수 차단 (check 에 유효 대상 검사) ----
  const mAb={...m2,players:m2.players.map(p=>(mTb&&p.id===mTb.id)?{...p,acquiredBy:3}:p)};
  const mAbChk=MNAC(mAb,0,mTb?mTb.specific:'HELIX');
  ok('E14ⓓ 흡수(acquiredBy) 블록 재인수 거부',!mTb||mAbChk.ok===false&&String(mAbChk.reason).indexOf('흡수')>=0,JSON.stringify(mAbChk));
  // ============================================================
  // v6.52 [3차 감사 2파] V1~V13 표시↔판정 정직성 회귀 (rules_module 파생 함수)
  // ============================================================
  const REE=window.rules_raidExecEst,RSP=window.rules_shortPayout,SSP=window.settleShortPositions;
  // (HRP/EPV/HLB 는 L388 기존 바인딩 재사용 — hudRaceProgress/evalPlayerVictory/euro_hlVictoryBonus)
  const EHB=HLB;
  ok('V52 fns exposed',[REE,RSP,HRP,EHB,EPV,SSP].every(f=>typeof f==='function'));
  // ---- V2: 레이드 실행 성공률 단일 식 — 실판정(RESOLVE_RAID) 성분 실측 ----
  ok('V2 기본: thr5 stat3 → needed2 → 5/6=83%',REE({threshold:5,stat:3}).faces===5&&REE({threshold:5,stat:3}).pct===83,JSON.stringify(REE({threshold:5,stat:3})));
  ok('V2 트랙 LV5(+4): thr8 stat2 — 트랙 유 5/6 vs 무 1/6',REE({threshold:8,stat:2,track:4}).faces===5&&REE({threshold:8,stat:2}).faces===1);
  ok('V2 MOLE 위장 -2 = 성공면 +2',REE({threshold:5,stat:2}).faces-REE({threshold:7,stat:2}).faces===2);
  ok('V2 critImmune 상한 6/6=100% (비면역 5/6)',REE({threshold:1,stat:5,critImmune:true}).pct===100&&REE({threshold:1,stat:5}).faces===5);
  ok('V2 atkOnce 가산 = 동가 stat 동일 (thr6: 4/6)',REE({threshold:6,stat:1,atkOnce:2}).faces===REE({threshold:6,stat:3}).faces&&REE({threshold:6,stat:3}).faces===4);
  ok('V2 allPlus 감산 needed 산식',REE({threshold:5,stat:3,allPlus:2}).needed===4);
  // ---- V6: 숏 정산 배수 파생 (표시=정산 동일 식) ----
  const v6m={...sg,meta:{...sg.meta,shortMultRound:sg.meta.round,shortMultVal:2}};
  ok('V6 변동성×2 파생 (기본 ×1)',RSP(v6m,'VANTA',3,1,2).payout===12&&RSP(sg,'VANTA',3,1,2).payout===6);
  const e9lo={...e9,stocks:{...e9.stocks,VANTA:4}},e9hi={...e9,stocks:{...e9.stocks,VANTA:9}};
  ok('V6 S06 저가(≤5) crashBonus ×2 / 고가 ×1',RSP(e9lo,'VANTA',2,1,2).payout===8&&RSP(e9lo,'VANTA',2,1,2).crashBonus===2&&RSP(e9hi,'VANTA',2,1,2).payout===4);
  const stS={...e9lo,players:e9lo.players.map((p,i)=>i===0?{...p,role:'ghost',shortPositions:{VANTA:1}}:p),meta:{...e9lo.meta,lastStockSnapshot:{...e9lo.stocks,VANTA:e9lo.stocks.VANTA+2}}};
  const stR=SSP(stS);
  const stGain=stR.players[0].resources.credit-stS.players[0].resources.credit;
  ok('V6 정산 실지급 = rules_shortPayout 파생값 (S06 저가 ₵+8)',stGain===RSP(stS,'VANTA',2,1,window.SHORT_CONFIG?window.SHORT_CONFIG.payoutPerPt:2).payout&&stGain===8,`gain ${stGain}`);
  // ---- V1: 표시 = 판정 동치 핀 (rep_eff/asset_eff = base + hlBonus✨) ----
  const gV=GVG(sg);
  const v1p={...sg.players[0],resources:{...sg.players[0].resources,rep:gV.ghostRepOnly-3},highlightPoints:10};
  const v1s={...sg,players:[v1p,...sg.players.slice(1)],meta:{...sg.meta,raidsThisGame:{}}};
  ok('V1 Ghost rep_eff=rep+hl✨: 판정 충족 ⇔ HRP 100',EHB(v1p)===3&&!!EPV(v1p,0,v1s,gV)&&HRP(v1p,0,v1s,gV)===100,`hl ${EHB(v1p)} hrp ${HRP(v1p,0,v1s,gV)}`);
  const v1q={...v1p,highlightPoints:0};
  ok('V1 hl 미가산이면 미충족 (base -3)',!EPV(v1q,0,{...v1s,players:[v1q,...sg.players.slice(1)]},gV));
  const gB=GVG(m2);
  const avB=assetValue(m2.players[0],m2.stocks,m2);
  const v1b={...m2.players[0],highlightPoints:Math.ceil((gB.blocAsset-avB)/0.3)+4};
  const v1bs={...m2,players:[v1b,...m2.players.slice(1)]};
  ok('V1 Bloc asset_eff=asset+hl✨: 판정 충족 ⇔ HRP 100',!!EPV(v1b,0,v1bs,gB)&&HRP(v1b,0,v1bs,gB)===100,`av ${avB} hl ${EHB(v1b)} goal ${gB.blocAsset}`);
  // ---- V3: Ghost 진척 바 = hudRaceProgress — 렙배틀 렙 충족·레이드 0 은 min 게이트로 100% 미만 ----
  const v3p={...sg.players[0],resources:{...sg.players[0].resources,rep:gV.ghostRepBattle},highlightPoints:0};
  const v3s={...sg,players:[v3p,...sg.players.slice(1)],meta:{...sg.meta,raidsThisGame:{}}};
  const v3exp=Math.min(100,Math.round(Math.max(0,gV.ghostRepBattle/gV.ghostRepOnly*100)));
  ok('V3 min 게이트: 렙=배틀목표·레이드0 → 진척=repOnly 경로(<100, 구 표시 100 오류 핀)',HRP(v3p,0,v3s,gV)===v3exp&&v3exp<100,`hrp ${HRP(v3p,0,v3s,gV)} exp ${v3exp}`);
  // ---- V13ⓐ: stock_buy_any 3주+ 시장 충격 (BUY_STOCK 동일 규칙) ----
  const mbP={...m2.players[0],resources:{...m2.players[0].resources,credit:200}};
  const mbS={...m2,players:[mbP,...m2.players.slice(1)]};
  const mbEnt=Object.entries(mbS.stocks).filter(([bl])=>bl!==mbP.specific).sort((a,b)=>a[1]-b[1]);
  const cheap=mbEnt[0][0];
  const mb4=AEFF(mbS,0,{stock_buy_any:4},'main',null);
  ok('V13ⓐ 4주 자동 매수 → 최저가 블록 주가+1(상한20)',mb4.stocks[cheap]===Math.min(20,mbS.stocks[cheap]+1)&&mb4.players[0].stocks[cheap]===(mbP.stocks[cheap]||0)+4,`${cheap} ${mbS.stocks[cheap]}→${mb4.stocks[cheap]}`);
  const mb2=AEFF(mbS,0,{stock_buy_any:2},'main',null);
  ok('V13ⓐ 2주 매수는 무충격',mb2.stocks[cheap]===mbS.stocks[cheap]);
  // ============================================================
  // v6.53 [3차 감사 #26]: 시뮬 유닛 커버리지 공백 보강
  //   ① 승리 파이프라인(applyVictoryDeclaration/checkInstantVictory)
  //   ② M&A 엔진(declare/resolve/방어 모달 5종/지분 분기)
  //   ③ 협상(NEGOTIATE_PHASE 봇 경로·negoEvalAccept·negoApply)
  //   ④ insertScandal 항등·settleShortPositions 전체 흐름
  //   ⑤ assetValue 구역·건물 가산 분기
  //   ⑥ 리듀서 핵심 액션(EXECUTE_TURN 이동/레이드·DECLARE_MNA·NEXT_ROUND·카드 효과)
  //   ⑦ S02 정체성 룰 동작 어서션 (값 어서션 → 배선 실증)
  //   주의: 감사 목록의 DECLARE_VICTORY/USE_CARD 액션은 리듀서에 실존하지 않음(39액션 목록 밖 명칭)
  //   → 실제 대응 경로인 승리 선언 파이프라인(NEXT_ROUND 내 applyVictoryDeclaration)과
  //     카드 사용 경로(EXECUTE_TURN→executeCards→applyEffect)로 봉합.
  // ============================================================
  const AVD=window.applyVictoryDeclaration, CKIV=window.checkInstantVictory,
        EDM=window.euro_declareMna, ERM=window.euro_resolveMna, EDB=window.euro_declareMnaBots,
        AMD=window.euro_applyMnaDefenseChoice, AMDD=window.euro_applyMnaDefenseDefault,
        NEA=window.negoEvalAccept, EEQ=window.euro_equityPct;
  ok('CV53 fns exposed',[AVD,CKIV,EDM,ERM,EDB,AMD,AMDD,NEA,EEQ].every(f=>typeof f==='function'));
  // ---- ① 승리 파이프라인: 선언 → 유예 → 확정 ----
  // sg = S01 solo ghost BLADE (1g3b) — GVG(sg).ghostRepOnly=48 (기존 gv13 핀과 동일 구성)
  const vGoals=GVG(sg);
  const sv1={...sg,meta:{...sg.meta,round:6,raidsThisGame:{}},players:sg.players.map((p,i)=>i===0?{...p,resources:{...p.resources,rep:999}}:p)};
  const sv1r=AVD(sv1);
  ok('VP 선언: R6 임계 도달 → victoryDeclaration {idx:0, round:6}',!!sv1r.meta.victoryDeclaration&&sv1r.meta.victoryDeclaration.idx===0&&sv1r.meta.victoryDeclaration.round===6,JSON.stringify(sv1r.meta.victoryDeclaration));
  ok('VP 선언: declarationCounts 증가 + 📢 로그',sv1r.meta.declarationCounts[0]===1&&sv1r.log.slice(-3).some(l=>String(l.message).indexOf('📢')>=0));
  ok('VP 선언: 선언만으로는 gameOver 아님 (유예 1R)',!sv1r.meta.gameOver);
  const sv2={...sv1,meta:{...sv1.meta,declarationCounts:{0:2}}};
  ok('VP 선언 캡: 게임당 2회 소진 → 재선언 없음(참조 동일)',AVD(sv2)===sv2);
  const sv0={...sv1,meta:{...sv1.meta,round:4}};
  ok('VP 선언: R<5 가드 → 항등(참조 동일)',AVD(sv0)===sv0);
  const sv3={...sg,meta:{...sg.meta,round:7,raidsThisGame:{},victoryDeclaration:{idx:0,route:'repOnly',reason:'x',round:6}}};
  const sv3r=AVD(sv3);
  ok('VP 해제: 선언자 조건 이탈 → 선언 해제 + 견제 성공 로그',sv3r.meta.victoryDeclaration===null&&sv3r.log.slice(-2).some(l=>String(l.message).indexOf('종료 선언 해제')>=0),JSON.stringify(sv3r.meta.victoryDeclaration));
  const sv4={...sv1,meta:{...sv1.meta,round:7,victoryDeclaration:{idx:0,route:'repOnly',reason:'Ghost 승리 (평판)',round:6}}};
  const sv4r=CKIV(sv4);
  ok('VP 확정: R6 선언 → R7 유지 → gameOver winner 0',sv4r.meta.gameOver===true&&sv4r.meta.winner===0&&String(sv4r.meta.winReason).indexOf('종료 선언 확정')>=0,sv4r.meta.winReason);
  const sv5={...sv1,meta:{...sv1.meta,round:6,victoryDeclaration:{idx:0,route:'repOnly',reason:'x',round:6}}};
  ok('VP 확정 게이트: 선언 라운드 == 현재 라운드 → 미확정',!CKIV(sv5).meta.gameOver);
  ok('VP 즉시승리 금지: 신규 도달(선언 없음)은 checkInstantVictory 로 즉시 승리 불가',!CKIV(sv1).meta.gameOver);
  const sv6={...sv1,meta:{...sv1.meta,round:4}};
  ok('VP R<5: checkInstantVictory 항등(참조 동일)',CKIV(sv6)===sv6);
  const sv7={...sg,meta:{...sg.meta,round:2,acquisitions:{1:['AXIOM','HELIX']}}};
  const sv7r=CKIV(sv7);
  ok('VP M&A 즉시 승리: 2블록 인수 → 5R 가드 우회 확정',sv7r.meta.gameOver===true&&sv7r.meta.winner===1&&String(sv7r.meta.winReason).indexOf('M&A 승리')>=0,sv7r.meta.winReason);
  // 통합: NEXT_ROUND 가 선언을 남기고, 다음 라운드 checkInstantVictory 가 확정 (실배선 경로)
  const svi={...sg,meta:{...sg.meta,round:6,raidsThisGame:{}},players:sg.players.map((p,i)=>i===0?{...p,resources:{...p.resources,rep:100}}:p)};
  const svir=withRand(0.99,()=>R(svi,{type:'NEXT_ROUND'}));
  ok('VP 통합: NEXT_ROUND(R6) → 선언 기록·round 7·미확정',svir.meta.round===7&&!!svir.meta.victoryDeclaration&&svir.meta.victoryDeclaration.idx===0&&svir.meta.victoryDeclaration.round===6&&!svir.meta.gameOver,JSON.stringify(svir.meta.victoryDeclaration));
  const svic=CKIV(svir);
  ok('VP 통합: R7 checkInstantVictory → 종료 선언 확정',svic.meta.gameOver===true&&svic.meta.winner===0&&String(svic.meta.winReason).indexOf('종료 선언 확정')>=0,svic.meta.winReason);
  // ---- ② M&A 엔진 ----
  // (a) 선언 게이트 통과 + 리듀서 DECLARE_MNA (S02: float 3 → 14/(10+14+3)=51%)
  const m2d={...m2,players:m2.players.map((p,i)=>i===0?{...p,stocks:{...p.stocks,HELIX:14}}:p)};
  ok('MNA check ok: 지분 51% 도달 (S02 float 3)',MNAC(m2d,0,'HELIX').ok===true&&EEQ(m2d,0,'HELIX')===51,JSON.stringify(MNAC(m2d,0,'HELIX')));
  const md1=R(m2d,{type:'DECLARE_MNA',playerIdx:0,bloc:'HELIX'});
  ok('MNA 선언: pendingMna 설정 + 카운트/라운드 트래킹',!!md1.meta.pendingMna&&md1.meta.pendingMna.attacker===0&&md1.meta.pendingMna.target==='HELIX'&&md1.meta.mnaCount[0]===1&&md1.meta.mnaLastRound[0]===m2d.meta.round,JSON.stringify(md1.meta.pendingMna));
  ok('MNA 선언 로그: 적대적 인수 선언',md1.log.slice(-3).some(l=>String(l.message).indexOf('적대적 인수 선언')>=0));
  const md2=R(md1,{type:'DECLARE_MNA',playerIdx:0,bloc:'AXIOM'});
  ok('MNA 중복 선언 거부: 진행 중 M&A → 거부 로그·카운트 불변',md2.meta.pendingMna.target==='HELIX'&&md2.meta.mnaCount[0]===1&&String((md2.log[md2.log.length-1]||{}).message).indexOf('거부')>=0);
  ok('MNA check 거부: 횟수 소진(3/3)',MNAC({...m2d,meta:{...m2d.meta,mnaCount:{0:3}}},0,'HELIX').ok===false&&String(MNAC({...m2d,meta:{...m2d.meta,mnaCount:{0:3}}},0,'HELIX').reason).indexOf('소진')>=0);
  ok('MNA check 거부: 지분 미달(<51%)',(c=>c.ok===false&&String(c.reason).indexOf('지분')>=0)(MNAC(m2,0,'HELIX')));
  // 쿨다운 배선: mnaNoCooldown(S02)=게이트 무시 · false 면 2R 대기 사유
  const mcd={...m2d,meta:{...m2d.meta,mnaLastRound:{0:m2d.meta.round-1}}};
  ok('MNA 쿨다운: S02(mnaNoCooldown) → 직전 R 선언에도 ok',MNAC(mcd,0,'HELIX').ok===true);
  ok('MNA 쿨다운: 무쿨다운 해제 시 2R 대기 거부',(c=>c.ok===false&&String(c.reason).indexOf('대기')>=0)(MNAC({...mcd,meta:{...mcd.meta,mnaNoCooldown:false}},0,'HELIX')));
  // (b) euro_resolveMna — 상호파괴(₵<10) → 인수 완료 (자산 30% 흡수·acquiredBy·스캔들·구역 이전)
  const mhIdx=md1.players.findIndex(p=>p.role==='bloc'&&p.specific==='HELIX');
  const zonesOf=(st,idx)=>Object.values(st.map).filter(c=>c.owner===idx).length;
  const mrs={...md1,players:md1.players.map((p,i)=>i===mhIdx?{...p,kind:'bot',resources:{...p.resources,credit:4}}:p)};
  const mrsZ0=zonesOf(mrs,0),mrsZh=zonesOf(mrs,mhIdx);
  const mr1=ERM(mrs);
  ok('MNA resolve(상호파괴→인수): 주가 -3 (8→5)',mr1.stocks.HELIX===5,`got ${mr1.stocks.HELIX}`);
  ok('MNA resolve(인수): acquiredBy 마커 + acquisitions 기록 + pendingMna 소거',mr1.players[mhIdx].acquiredBy===0&&JSON.stringify(mr1.meta.acquisitions[0])==='["HELIX"]'&&mr1.meta.pendingMna===null);
  ok('MNA resolve(인수): 크레딧 30% 흡수 (₵4→1 이전)',mr1.players[mhIdx].resources.credit===3&&mr1.players[0].resources.credit===mrs.players[0].resources.credit+1,`tgt ${mr1.players[mhIdx].resources.credit} atk +${mr1.players[0].resources.credit-mrs.players[0].resources.credit}`);
  ok('MNA resolve(인수): 구역 30% 이전 (floor)',zonesOf(mr1,0)===mrsZ0+Math.floor(mrsZh*0.3)&&zonesOf(mr1,mhIdx)===mrsZh-Math.floor(mrsZh*0.3),`0:${zonesOf(mr1,0)} h:${zonesOf(mr1,mhIdx)}`);
  ok('MNA resolve(인수): 피인수 덱 스캔들 오염',(mr1.players[mhIdx].discard||[]).includes('SCANDAL')&&(mr1.meta.scandalsThisGame||{})[mhIdx]===1);
  ok('MNA resolve(인수 1곳): 즉시 승리 아님 (2곳 임계)',!mr1.meta.gameOver);
  // (c) euro_resolveMna — 재매입 방어(₵≥10) → 지분 50%<51 → 방어 성공 (강제 매도 + 주가 +2)
  const mrb={...md1,players:md1.players.map((p,i)=>i===mhIdx?{...p,kind:'bot',resources:{...p.resources,credit:20}}:p)};
  const mr2=ERM(mrb);
  ok('MNA resolve(재매입→방어 성공): 대상 ₵-10',mr2.players[mhIdx].resources.credit===10,`got ${mr2.players[mhIdx].resources.credit}`);
  ok('MNA resolve(방어 성공): 공격자 재매입1+판정매도2 = 14→11주 · ₵+24 환급',mr2.players[0].stocks.HELIX===11&&mr2.players[0].resources.credit===mrb.players[0].resources.credit+24,`held ${mr2.players[0].stocks.HELIX} ₵+${mr2.players[0].resources.credit-mrb.players[0].resources.credit}`);
  ok('MNA resolve(방어 성공): 주가 +2 (8→10) · pendingMna 소거 · 인수 없음',mr2.stocks.HELIX===10&&mr2.meta.pendingMna===null&&!(mr2.meta.acquisitions&&mr2.meta.acquisitions[0])&&!mr2.players[mhIdx].acquiredBy);
  // (d) NPC 껍데기 (무좌석 블록): ₵+10 + 주가 -5
  const ubBloc=['VANTA','IRONWALL','HELIX','AXIOM','CARBON'].find(b=>!sg.players.some(p=>p.specific===b));
  const mnp={...sg,players:sg.players.map((p,i)=>i===0?{...p,stocks:{...p.stocks,[ubBloc]:30}}:p),meta:{...sg.meta,pendingMna:{attacker:0,target:ubBloc,declaredRound:1,defense:null}}};
  const mr3=ERM(mnp);
  ok(`MNA resolve(NPC 껍데기 ${ubBloc}): ₵+10 · 주가 8→3 · 인수 기록`,mr3.players[0].resources.credit===mnp.players[0].resources.credit+10&&mr3.stocks[ubBloc]===3&&JSON.stringify(mr3.meta.acquisitions[0])===JSON.stringify([ubBloc])&&mr3.meta.pendingMna===null,`₵+${mr3.players[0].resources.credit-mnp.players[0].resources.credit} px ${mr3.stocks[ubBloc]}`);
  // (e) 공격자 부재 → 무산
  const mgone={...mnp,players:mnp.players.map((p,i)=>i===0?{...p,defeated:true}:p)};
  const mr4=ERM(mgone);
  ok('MNA resolve(공격자 탈락): 무산 — pendingMna 소거·인수 없음',mr4.meta.pendingMna===null&&!(mr4.meta.acquisitions&&mr4.meta.acquisitions[0])&&mr4.log.slice(-2).some(l=>String(l.message).indexOf('무산')>=0));
  // (f) 지분 계산 분기 — defeated 보유분 분모 제외 · whiteKnight 분모 가산
  const mvS=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'VANTA',humans:null,scenario:'S01'});
  const etsDef={...mvS,players:mvS.players.map((p,i)=>i===1?{...p,stocks:{...p.stocks,VANTA:22},defeated:true}:p)};
  ok('ETS defeated 제외: 탈락자 22주 분모 제외 (10+10)',ETS(etsDef,'VANTA')===20,`got ${ETS(etsDef,'VANTA')}`);
  // (g) 인간 방어 결정 모달 효과 5종 (P0 VANTA · 공격자 P1 22주 · total 42 · eq 52%)
  const mkDef=(credit,infl,extraP0)=>({...mvS,players:mvS.players.map((p,i)=>i===0?{...p,resources:{...p.resources,credit,influence:infl},...(extraP0||{})}:i===1?{...p,stocks:{...p.stocks,VANTA:22}}:p),meta:{...mvS.meta,pendingMna:{attacker:1,target:'VANTA',declaredRound:1,defense:null,awaitingHuman:true}}});
  const defDecision={id:'mna_defense_VANTA_r1',type:'mna_defense',playerIdx:0,context:{round:1,bloc:'VANTA',attacker:1}};
  const dRb=AMD(mkDef(15,3),defDecision,'rebuy');
  ok('MNA 방어① 재매입: P0 ₵-10 · 공격자 22→16주(재매입2+판정매도4) · ₵+48 · 방어 성공',dRb.players[0].resources.credit===5&&dRb.players[1].stocks.VANTA===16&&dRb.players[1].resources.credit===mkDef(15,3).players[1].resources.credit+48&&dRb.meta.pendingMna===null&&!dRb.players[0].acquiredBy,`₵${dRb.players[0].resources.credit} held ${dRb.players[1].stocks.VANTA}`);
  ok('MNA 방어① 재매입: 방어 성공 주가 +2 (8→10)',dRb.stocks.VANTA===10);
  const dWk=AMD(mkDef(8,3),defDecision,'whiteknight');
  ok('MNA 방어② 백기사: 🎙3 소모 · whiteKnight 11주 발행 · 지분 희석 → 방어 성공',dWk.players[0].resources.influence===0&&(dWk.meta.whiteKnight||{}).VANTA===11&&dWk.meta.pendingMna===null&&!dWk.players[0].acquiredBy,JSON.stringify(dWk.meta.whiteKnight));
  ok('MNA 방어② 백기사: euro_totalShares 분모 가산 (10+17+10+11=48)',ETS(dWk,'VANTA')===48,`got ${ETS(dWk,'VANTA')}`);
  const dLg=AMD(mkDef(8,5),defDecision,'legal');
  ok('MNA 방어③ 법적 대응: 🎙5 소모 · 판정 1R 지연 (pendingMna 유지)',dLg.players[0].resources.influence===0&&dLg.meta.pendingMna.defense==='legal'&&dLg.meta.pendingMna.delayedUntil===2&&!dLg.meta.gameOver,JSON.stringify(dLg.meta.pendingMna));
  ok('MNA 방어③ 법적 대응: 지연 중 resolveMna 대기(참조 동일)',ERM(dLg)===dLg);
  const dLg2={...dLg,meta:{...dLg.meta,round:2},players:dLg.players.map((p,i)=>i===0?{...p,stocks:{...p.stocks,VANTA:15}}:p)};
  const dLg2r=ERM(dLg2);
  ok('MNA 방어③ 지연 만료: 그 사이 매집(10→15주) → 지분 46% → 방어 성공',dLg2r.meta.pendingMna===null&&!dLg2r.players[0].acquiredBy&&dLg2r.players[1].stocks.VANTA===18&&dLg2r.stocks.VANTA===10,`held ${dLg2r.players[1].stocks.VANTA}`);
  const dSc=AMD(mkDef(8,3),defDecision,'scorched');
  ok('MNA 방어④ 상호 파괴: 주가 -3 (8→5) · 인수는 진행 (acquiredBy=1)',dSc.stocks.VANTA===5&&dSc.players[0].acquiredBy===1&&JSON.stringify(dSc.meta.acquisitions[1])==='["VANTA"]'&&dSc.meta.pendingMna===null,JSON.stringify(dSc.meta.acquisitions));
  ok('MNA 방어④ 상호 파괴: ₵30% 흡수(8→6, 공격자 +2) + 스캔들 오염',dSc.players[0].resources.credit===6&&dSc.players[1].resources.credit===mkDef(8,3).players[1].resources.credit+2&&(dSc.players[0].discard||[]).includes('SCANDAL'));
  const dDf1=AMDD(mkDef(15,3),defDecision);
  ok('MNA 방어⑤ 만료 기본: ₵≥10 → 재매입 자동 적용',dDf1.players[0].resources.credit===5&&dDf1.meta.pendingMna===null&&!dDf1.players[0].acquiredBy);
  const dDf2=AMDD(mkDef(8,3),defDecision);
  ok('MNA 방어⑤ 만료 기본: ₵<10 → 상호 파괴 폴백',dDf2.stocks.VANTA===5&&dDf2.players[0].acquiredBy===1);
  // ---- ⑦ S02 정체성 룰 — 값 핀에 동작 어서션 추가 ----
  // mnaBotProb=1.0 배선: rand 0.99 에서 S02 봇은 선언(0.99<1.0), S01 기본(0.5)은 스킵(항등)
  const s2npc=m2.players.find(p=>p.isNpc);
  const s2bot=m2.players.findIndex(p=>p.kind==='bot'&&p.role==='bloc');
  const m2b={...m2,players:m2.players.map((p,i)=>i===s2bot?{...p,stocks:{...p.stocks,[s2npc.specific]:20}}:p)};
  const m2br=withRand(0.99,()=>EDB(m2b));
  ok('S02 mnaBotProb=1.0 동작: rand .99 에도 봇 선언 발생',!!m2br.meta.pendingMna&&m2br.meta.pendingMna.attacker===s2bot&&m2br.meta.pendingMna.target===s2npc.specific,JSON.stringify(m2br.meta.pendingMna));
  const sgBot=sg.players.findIndex(p=>p.kind==='bot'&&p.role==='bloc');
  const sgb={...sg,players:sg.players.map((p,i)=>i===sgBot?{...p,stocks:{...p.stocks,[ubBloc]:20}}:p)};
  ok('S01 mnaBotProb 폴백 0.5 동작: rand .99 → 선언 스킵(참조 동일)',withRand(0.99,()=>EDB(sgb))===sgb);
  // mnaSerial=true 동작: 인수 완료 목표는 BOT_MARKET 에서 해제 → 재지정 (S01 은 유지)
  const m2ser={...m2,players:m2.players.map((p,i)=>i===s2bot?{...p,mnaTarget:'HELIX',resources:{...p.resources,credit:10}}:p),meta:{...m2.meta,acquisitions:{[s2bot]:['HELIX']}}};
  const m2serR=withRand(0.99,()=>R(m2ser,{type:'BOT_MARKET'}));
  ok('S02 mnaSerial 동작: 인수 완료 목표 해제 → 신규 목표 재지정(₵10≥8)',!!m2serR.players[s2bot].mnaTarget&&m2serR.players[s2bot].mnaTarget!=='HELIX',`target ${m2serR.players[s2bot].mnaTarget}`);
  const sgser={...sg,players:sg.players.map((p,i)=>i===sgBot?{...p,mnaTarget:'HELIX',resources:{...p.resources,credit:20}}:p),meta:{...sg.meta,acquisitions:{[sgBot]:['HELIX']}}};
  ok('S01 mnaSerial 폴백 동작: 인수 완료 목표 유지 (재지정 없음)',withRand(0.99,()=>R(sgser,{type:'BOT_MARKET'})).players[sgBot].mnaTarget==='HELIX');
  // mnaDesignateCredit=8 동작: 같은 ₵10 이 S02 에선 지정, S01(기본 14)에선 미지정
  const sgdc={...sg,players:sg.players.map((p,i)=>i===sgBot?{...p,resources:{...p.resources,credit:10}}:p)};
  ok('S01 mnaDesignateCredit 폴백 14 동작: ₵10 → 목표 미지정',withRand(0.99,()=>R(sgdc,{type:'BOT_MARKET'})).players[sgBot].mnaTarget==null,`target ${withRand(0.99,()=>R(sgdc,{type:'BOT_MARKET'})).players[sgBot].mnaTarget}`);
  // ---- ③ 협상: NEGOTIATE_PHASE 봇 경로 + negoEvalAccept + negoApply ----
  ok('NEG eval: 스왑 순가치 +2 → 수락',(e=>e.accept===true&&e.acceptValue===2)(NEA({type:'swap',give:{credit:4},get:{weapons:2}},{resources:{weapons:2}})));
  ok('NEG eval: 지불분 미보유 → canAfford=false 거절',(e=>e.accept===false&&e.canAfford===false)(NEA({type:'swap',give:{credit:4},get:{weapons:2}},{resources:{weapons:1}})));
  ok('NEG eval: truce 자체 가치 +2 → 수락',(e=>e.accept===true&&e.acceptValue===2)(NEA({type:'truce',give:{},get:{}},{resources:{}})));
  const negRej=NAPP(sg,{from:1,to:2,type:'swap',give:{},get:{credit:5},value:0});
  ok('NEG apply 거절: EV<0 → rejected 계측·자원 불변·로그',negRej.meta.negoStats.rejected===1&&negRej.meta.negoStats.accepted===0&&negRej.players[1].resources.credit===sg.players[1].resources.credit&&negRej.players[2].resources.credit===sg.players[2].resources.credit&&String((negRej.log[negRej.log.length-1]||{}).message).indexOf('협상 거절')>=0);
  // NEGOTIATE_PHASE: 봇↔봇 스왑 1건 (P1 ₵10↔P2 🔩3 · P2는 ₵5 로 자체 후보 없음 · P3 무자원)
  const mkNegRes=(o)=>({credit:0,weapons:0,data:0,parts:0,influence:0,rep:0,...o});
  const negS={...sg,players:sg.players.map((p,i)=>i===1?{...p,tracks:{},resources:mkNegRes({credit:10})}:i===2?{...p,tracks:{},resources:mkNegRes({credit:5,weapons:3})}:i===3?{...p,tracks:{},resources:mkNegRes({})}:p)};
  const negR=R(negS,{type:'NEGOTIATE_PHASE'});
  ok('NEG phase: 봇↔봇 스왑 성사 — P1 ₵10→6·🔩0→2 / P2 ₵5→9·🔩3→1',negR.players[1].resources.credit===6&&negR.players[1].resources.weapons===2&&negR.players[2].resources.credit===9&&negR.players[2].resources.weapons===1,JSON.stringify([negR.players[1].resources,negR.players[2].resources]));
  ok('NEG phase: 계측 proposed/accepted/swaps=1 + 인맥 트랙 +1',negR.meta.negoStats.proposed===1&&negR.meta.negoStats.accepted===1&&negR.meta.negoStats.swaps===1&&(negR.players[1].tracks||{}).party===1,JSON.stringify(negR.meta.negoStats));
  ok('NEG phase: 인간(P0) 좌석 비관여 (봇 전용 경로)',negR.players[0].resources.credit===negS.players[0].resources.credit&&negR.players[0].resources.rep===negS.players[0].resources.rep);
  // [v6.52 결함 수정 회귀] 커버리지 감사가 발견한 stale 스냅샷 결함: 후보 생성이 페이즈 시작 스냅샷
  //   기준이라 선행 스왑으로 자원이 바뀐 봇이 보유량 초과 give 제안을 낼 수 있었다(음수 자원 경로).
  //   수정 후: 후보 생성이 매 반복 최신 s.players 기준 → 2번째 제안도 현재 자원으로 성립하고,
  //   어떤 경로에서도 자원 음수가 없어야 한다.
  const negStale={...sg,players:sg.players.map((p,i)=>i===1?{...p,tracks:{},resources:mkNegRes({credit:10})}:i===2?{...p,tracks:{},resources:mkNegRes({weapons:3})}:i===3?{...p,tracks:{},resources:mkNegRes({})}:p)};
  const negStR=R(negStale,{type:'NEGOTIATE_PHASE'});
  const negNoNeg=negStR.players.every(p=>Object.values(p.resources||{}).every(v=>typeof v!=='number'||v>=0));
  ok('NEG phase [v6.52 수정]: stale 보유량 초과 제안 소멸·재스왑 차단 — 순 스왑 1건·자원 음수 0',negStR.meta.negoStats.swaps===1&&negStR.meta.negoStats.rejected===0&&negNoNeg&&negStR.players[1].resources.credit===6&&negStR.players[1].resources.weapons===2&&negStR.players[2].resources.credit===4&&negStR.players[2].resources.weapons===1,JSON.stringify([negStR.meta.negoStats,negStR.players[1].resources,negStR.players[2].resources]));
  // [v6.52 방어층] negoApply: from 측이 give 를 실보유하지 않으면 수락 전 무산 (음수 차감 원천 차단)
  //   픽스처: toP EV 는 +1(수락권)이지만 fromP 가 give 🔩2 를 미보유 → 방어층에서 무산되어야 함
  const negShort=NAPP({...sg,players:sg.players.map((p,i)=>i===1?{...p,resources:mkNegRes({weapons:1})}:i===2?{...p,resources:mkNegRes({credit:9,weapons:0})}:p)},{from:1,to:2,type:'swap',give:{weapons:2},get:{credit:1},value:5});
  ok('NEG apply [v6.52 방어층]: give 보유 부족 → 무산 로그·자원 불변·rejected 계측',negShort.meta.negoStats.rejected===1&&negShort.meta.negoStats.accepted===0&&negShort.players[1].resources.weapons===1&&negShort.players[2].resources.credit===9&&String((negShort.log[negShort.log.length-1]||{}).message).indexOf('협상 무산')>=0,JSON.stringify(negShort.meta.negoStats));
  // NEGO_MAX 캡: 3봇 전원 후보 보유 — 라운드당 2건에서 차단 (P3 제안 미발동)
  const negC={...sg,players:sg.players.map((p,i)=>i===1?{...p,tracks:{},resources:mkNegRes({credit:10})}:i===2?{...p,tracks:{},resources:mkNegRes({credit:10})}:i===3?{...p,tracks:{},resources:mkNegRes({weapons:9})}:p)};
  const negCr=R(negC,{type:'NEGOTIATE_PHASE'});
  ok('NEG phase 캡: 후보 3건 중 NEGO_MAX(2)건만 발동 (전부 수락 스왑)',negCr.meta.negoStats.proposed===2&&negCr.meta.negoStats.accepted===2&&negCr.meta.negoStats.swaps===2,JSON.stringify(negCr.meta.negoStats));
  // ---- ④ insertScandal 가드 + settleShortPositions 전체 흐름 ----
  ok('SCND ghost 대상 항등(참조 동일)',INSC(sg,0,'t')===sg);
  const scndDef={...mvS,players:mvS.players.map((p,i)=>i===0?{...p,defeated:true}:p)};
  ok('SCND 탈락 Bloc 항등(참조 동일)',INSC(scndDef,0,'t')===scndDef);
  const shS={...sg,stocks:{...sg.stocks,VANTA:5,IRONWALL:9},meta:{...sg.meta,lastStockSnapshot:{...sg.stocks}},players:sg.players.map((p,i)=>i===0?{...p,shortPositions:{VANTA:2,IRONWALL:1}}:i===1?{...p,shortPositions:{VANTA:9}}:p)};
  const shR=SSP(shS);
  ok('SHORT 정산: 하락 3pt×2계약×₵2 = ₵+12 (상승 IRONWALL 0)',shR.players[0].resources.credit===shS.players[0].resources.credit+12,`+${shR.players[0].resources.credit-shS.players[0].resources.credit}`);
  ok('SHORT 정산: Ghost 전용 — Bloc 좌석 계약 미정산',shR.players[1].resources.credit===shS.players[1].resources.credit);
  ok('SHORT 정산: 스냅샷 현재 종가로 갱신',shR.meta.lastStockSnapshot.VANTA===5&&shR.meta.lastStockSnapshot.IRONWALL===9);
  ok('SHORT 정산 로그: 📉 숏 정산',shR.log.slice(-2).some(l=>String(l.message).indexOf('숏 정산')>=0&&String(l.message).indexOf('₵+12')>=0));
  const shUp={...sg,stocks:{...sg.stocks,VANTA:10},meta:{...sg.meta,lastStockSnapshot:{...sg.stocks}},players:sg.players.map((p,i)=>i===0?{...p,shortPositions:{VANTA:2}}:p)};
  const shUpR=SSP(shUp);
  ok('SHORT 정산: 상승 시 무지급(옵션형) + 스냅샷만 갱신',shUpR.players[0].resources.credit===shUp.players[0].resources.credit&&shUpR.meta.lastStockSnapshot.VANTA===10);
  const shDefd={...shS,players:shS.players.map((p,i)=>i===0?{...p,defeated:true}:p)};
  ok('SHORT 정산: 탈락 Ghost 미정산',SSP(shDefd).players[0].resources.credit===shDefd.players[0].resources.credit);
  // ---- ⑤ assetValue 구역·건물 가산 분기 (기존 픽스처 map:{} 사각 해소) ----
  const avP={id:0,role:'bloc',specific:'VANTA',stocks:{VANTA:10,IRONWALL:2,HELIX:3}};
  const avStocks={VANTA:8,IRONWALL:7,HELIX:4,AXIOM:9,CARBON:9};
  const avState={map:{A1:{zone:'bank',owner:0,building:'hq'},A2:{zone:'club',owner:0,building:'trading'},B1:{zone:'home',owner:0},C3:{zone:'bank',owner:1,building:'factory'}}};
  ok('AV Bloc: 타블록 주식26 + 구역15 + 건물8(자사주 제외·타인 건물 제외) = 49',assetValue(avP,avStocks,avState)===49,`got ${assetValue(avP,avStocks,avState)}`);
  const avG={id:2,role:'ghost',specific:'BLADE',stocks:{VANTA:2}};
  ok('AV Ghost: 주식16 + 구역5 + media4 = 25 (ghost 는 자사 제외 없음)',assetValue(avG,avStocks,{map:{A1:{zone:'bank',owner:2,building:'media'}}})===25,`got ${assetValue(avG,avStocks,{map:{A1:{zone:'bank',owner:2,building:'media'}}})}`);
  const avAllB={map:{A1:{owner:0,building:'hq'},A2:{owner:0,building:'trading'},A3:{owner:0,building:'factory'},A4:{owner:0,building:'security'},A5:{owner:0,building:'media'}}};
  ok('AV 건물 5종 전액: 구역25 + (5+3+2+2+4)=41',assetValue({id:0,role:'bloc',specific:'VANTA',stocks:{}},avStocks,avAllB)===41,`got ${assetValue({id:0,role:'bloc',specific:'VANTA',stocks:{}},avStocks,avAllB)}`);
  // ---- ⑥ 리듀서 핵심 액션 ----
  // EXECUTE_TURN — 봇 Ghost 이동(BFS)→레이드 성공 (D2 → VANTA HQ C2)
  const mkRaidSt=(atk)=>({...mvS,players:mvS.players.map((p,i)=>i===1?{...p,role:'ghost',position:'D2',hp:8,maxHp:8,stats:{...p.stats,atk},tracks:{},converted:{gear:0,intel:0},resources:{...p.resources,weapons:0},plannedCards:['BASIC_MOVE_B'],plannedHalves:['top']}:p)});
  const rdOk=withRand(0.99,()=>R(mkRaidSt(50),{type:'EXECUTE_TURN'}));
  ok('EXEC 이동: D2→C2 (최근접 Bloc 구역 1스텝) + zonesVisited 기록',rdOk.players[1].position==='C2'&&rdOk.meta.zonesVisited[1]&&rdOk.meta.zonesVisited[1].has('C2'),`pos ${rdOk.players[1].position}`);
  ok('EXEC 레이드 성공: 구역 중립화 + VANTA 주가 -3 (8→5)',rdOk.map.C2.owner===null&&rdOk.stocks.VANTA===5,`owner ${rdOk.map.C2.owner} px ${rdOk.stocks.VANTA}`);
  ok('EXEC 레이드 성공: 렙+4 + 첫 레이드 하이라이트 ★+2 = +6 · 수배+1 · 공권력+1',rdOk.players[1].resources.rep===mvS.players[1].resources.rep+6&&rdOk.players[1].wanted===(mvS.players[1].wanted||0)+1&&rdOk.heat===mvS.heat+1,`rep ${rdOk.players[1].resources.rep} (before ${mvS.players[1].resources.rep})`);
  ok('EXEC 레이드 성공: 카운터·스캔들·피격 배너 (rules_raidSuccessFx 경유)',rdOk.meta.raidsThisGame[1]===1&&rdOk.meta.raidDmgByBloc.VANTA===1&&(rdOk.players[0].discard||[]).includes('SCANDAL')&&(rdOk.meta.lastTargetedBy||{}).effectKey==='raid');
  ok('EXEC 실행 후 plannedCards 전원 클리어',rdOk.players.every(p=>(p.plannedCards||[]).length===0));
  const rdNo=withRand(0.99,()=>R(mkRaidSt(-50),{type:'EXECUTE_TURN'}));
  ok('EXEC 레이드 실패: 구역·주가 불변 + HP-3 (8→5)',rdNo.map.C2.owner===0&&rdNo.stocks.VANTA===8&&rdNo.players[1].hp===5,`hp ${rdNo.players[1].hp}`);
  ok('EXEC 레이드 실패: 렙 불변·수배+1·레이드 카운터 0',rdNo.players[1].resources.rep===mvS.players[1].resources.rep&&rdNo.players[1].wanted===(mvS.players[1].wanted||0)+1&&((rdNo.meta.raidsThisGame||{})[1]||0)===0);
  ok('EXEC 공(空)실행: E14ⓐ 신규 참조 반환 (in-place 변이 아님)',R(sg,{type:'EXECUTE_TURN'})!==sg);
  // EXECUTE_TURN — 카드 효과 대표: 비용 지불(main {cost I, weapons 3}) + 비용 부족 불발 + gen
  const armSt={...mvS,players:mvS.players.map((p,i)=>i===0?{...p,pool:{I:1},plannedCards:['ARMS_SUPPLY'],plannedHalves:['main']}:p)};
  const armR=withRand(0.99,()=>R(armSt,{type:'EXECUTE_TURN'}));
  ok('EXEC 카드(ARMS_SUPPLY main): ◈I 지불 → 🔩+3 · 카드 discard',armR.players[0].resources.weapons===3&&armR.players[0].pool.I===0&&(armR.players[0].discard||[]).includes('ARMS_SUPPLY'),`w ${armR.players[0].resources.weapons} I ${armR.players[0].pool.I}`);
  const armFz={...mvS,players:mvS.players.map((p,i)=>i===0?{...p,pool:{},plannedCards:['ARMS_SUPPLY'],plannedHalves:['main']}:p)};
  const armFzR=withRand(0.99,()=>R(armFz,{type:'EXECUTE_TURN'}));
  ok('EXEC 카드 비용 부족: 효과 불발 (🔩0 유지 + 불발 로그)',armFzR.players[0].resources.weapons===(mvS.players[0].resources.weapons||0)&&armFzR.log.some(l=>String(l.message).indexOf('효과 불발')>=0));
  const genR=AEFF(mvS,0,{gen:'M:S'},'main',null);
  ok('EXEC 카드 gen: 개인 풀 M+1 S+1',genR.players[0].pool.M===((mvS.players[0].pool||{}).M||0)+1&&genR.players[0].pool.S===((mvS.players[0].pool||{}).S||0)+1);
  // NEXT_ROUND — 라운드 전환 + truce 만료 보상 + 만료 정리
  const nrS={...sg,meta:{...sg.meta,promises:[{from:0,to:1,type:'truce',expiresR:sg.meta.round,status:'active'}]}};
  const nrR=withRand(0.99,()=>R(nrS,{type:'NEXT_ROUND'}));
  ok('NR 전환: round+1 · phase 0 · currentNews 리셋',nrR.meta.round===sg.meta.round+1&&nrR.meta.phase===0&&nrR.currentNews===null);
  ok('NR truce 만료: 지킴 양측 ★+1 (P0 +2=지킴+허슬, P1 +1)',nrR.players[0].resources.rep===sg.players[0].resources.rep+2&&nrR.players[1].resources.rep===sg.players[1].resources.rep+1,`p0 ${nrR.players[0].resources.rep} p1 ${nrR.players[1].resources.rep}`);
  ok('NR truce 만료: promises 정리(제거)',(nrR.meta.promises||[]).length===0);
  ok('NR 손패 리필: 전원 6장 유지',nrR.players.every(p=>p.defeated||p.hand.length===6));
  // NEXT_ROUND — 라운드 상한 도달 → checkVictoryByPoints 위임 (타임아웃 종료)
  const nrLim={...sg,meta:{...sg.meta,round:12,raidsThisGame:{}},players:sg.players.map((p,i)=>i===0?{...p,resources:{...p.resources,rep:200}}:p)};
  const nrLimR=withRand(0.99,()=>R(nrLim,{type:'NEXT_ROUND'}));
  ok('NR 상한(11×11 R12): 타임아웃 판정 위임 → gameOver·진척 1위 승자',nrLimR.meta.gameOver===true&&nrLimR.meta.winner===0&&String(nrLimR.meta.winReason).indexOf('시간 종료')>=0,nrLimR.meta.winReason);
  // COLLECT_INCOME — 구역 수입 + 트랙 패시브 + 건물 수익 (NR 항목의 "트랙 수입" 배선)
  const ciSt={...m2,map:{A1:{zone:'bank',owner:0},A2:{zone:'club',owner:0,building:'trading'}},players:m2.players.map((p,i)=>i===0?{...p,tracks:{party:4},stocks:{},pool:{}}:p)};
  const ciR=withRand(0.99,()=>R(ciSt,{type:'COLLECT_INCOME'}));
  ok('CI 수입: 금융가3+유흥가2+거래소2+파티LV4트랙3 = ₵+10',ciR.players[0].resources.credit===ciSt.players[0].resources.credit+10,`+${ciR.players[0].resources.credit-ciSt.players[0].resources.credit}`);
  ok('CI 구역 속성 풀 적립: M+1(금융가) S+1(유흥가)',ciR.players[0].pool.M===1&&ciR.players[0].pool.S===1,JSON.stringify(ciR.players[0].pool));
  ok('CI 픽스처 assetValue: 구역10+거래소3 = 13 (구역·건물 분기 실행)',assetValue(ciSt.players[0],ciSt.stocks,ciSt)===13,`got ${assetValue(ciSt.players[0],ciSt.stocks,ciSt)}`);
  // ==== v6.53 [S07]: 블랙아웃 카스케이드 — 정체성 룰 5종 수치 핀 (docs/14 확장 슬롯) ====
  //   원칙(S02 정체성 룰 선례): 프로덕션 식을 재구현하지 않는다. 기대값은 전부 손계산 리터럴.
  const s7=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'VANTA',humans:null,scenario:'S07'});
  const BOA=window.BLACKOUT_ORDER, BSCH=window.blackout_scheduled, BADV=window.blackout_advance;
  const BDC=window.blackout_darkCount, BHC=window.blackout_hardenedCount, BACT=window.blackout_active;
  ok('S07 meta.scenario=S07',s7.meta.scenario==='S07');
  ok('S07 startHeat=5',s7.heat===5,`got ${s7.heat}`);
  ok('S07 locked=false · 11×11 전용',SCEN7L()===false&&SCEN7M(),'UI 노출 가능');
  function SCEN7L(){return SR(s7,'locked',true);}
  function SCEN7M(){const m=SR(s7,'maps',null);return !!m&&m.length===1&&m[0]==='11x11';}

  // ---- 값 핀 (2번째 인자 = S01 기본값 → 키 부재 시 자동 실패) ----
  ok('S07 blackoutCascade=true',SR(s7,'blackoutCascade',false)===true);
  ok('S07 blackoutStart=2',SR(s7,'blackoutStart',0)===2);
  ok('S07 blackoutPerRound=2',SR(s7,'blackoutPerRound',0)===2);
  ok('S07 blackoutRaidMod=-2',SR(s7,'blackoutRaidMod',0)===-2);
  ok('S07 blackoutRepairParts=3',SR(s7,'blackoutRepairParts',0)===3);
  ok('S07 blackoutRepairCredit=8',SR(s7,'blackoutRepairCredit',0)===8);
  ok('S07 blackoutHeatPer=4',SR(s7,'blackoutHeatPer',0)===4);
  ok('S07 roundLimit=10 (HUD R표기와 동일 소스)',SR(s7,'roundLimit',12)===10);
  ok('S07 blocAssetBonus=25 (측정 튜닝값)',SR(s7,'blocAssetBonus',0)===25);
  ok('S07 underdogRelief=false (의도적 편향 — S02~S06 선례)',SR(s7,'underdogRelief',true)===false);
  const nonNpc7=s7.players.filter(p=>!p.isNpc).length;
  const adj7=(nonNpc7===2?-2:nonNpc7===3?-1:0);
  const g7=GVG(s7);
  ok('S07 blocAsset = 100+adj+25 (승리 판정 = HUD 목표 동일 소스)',g7.blocAsset===100+adj7+25,`got ${g7.blocAsset} (adj ${adj7}, 기대 ${100+adj7+25})`);

  // ---- 정체성 룰 ① 결정론적 캐스케이드 시간표 (손계산: (R-2+1)*2, 18 캡) ----
  ok('S07 BLACKOUT_ORDER 길이=18',BOA.length===18,`got ${BOA.length}`);
  ok('S07 캐스케이드 순서 좌표가 전부 맵에 존재',BOA.every(c=>!!s7.map[c]),BOA.filter(c=>!s7.map[c]).join(','));
  ok('S07 캐스케이드 좌표 중복 없음',new Set(BOA).size===18);
  ok('S07 캐스케이드가 5 Bloc HQ·support 를 전부 비껴감 (시작 소유 0칸)',BOA.every(c=>s7.map[c].owner==null),BOA.filter(c=>s7.map[c].owner!=null).join(','));
  ok('S07 스케줄 R1 = 0칸 (blackoutStart 2 이전)',BSCH(s7,1)===0);
  ok('S07 스케줄 R2 = 2칸',BSCH(s7,2)===2,`got ${BSCH(s7,2)}`);
  ok('S07 스케줄 R4 = 6칸',BSCH(s7,4)===6,`got ${BSCH(s7,4)}`);
  ok('S07 스케줄 R10 = 18칸 (roundLimit 에 정확히 소진)',BSCH(s7,10)===18,`got ${BSCH(s7,10)}`);
  ok('S07 스케줄 R20 = 18칸 (순서 배열 길이에서 캡)',BSCH(s7,20)===18,`got ${BSCH(s7,20)}`);
  const s7r2=BADV({...s7,meta:{...s7.meta,round:2}});
  ok('S07 R2 소등 = 정확히 2칸',BDC(s7r2)===2,`got ${BDC(s7r2)}`);
  ok('S07 R2 소등 대상이 결정론적으로 F6·F5 (무작위 아님)',!!s7r2.map.F6.blackout&&!!s7r2.map.F5.blackout&&!s7r2.map.C4.blackout);
  const s7r4=BADV({...s7r2,meta:{...s7r2.meta,round:4}});
  ok('S07 R4 누적 소등 = 6칸 (C4·I4·C8·I8 추가)',BDC(s7r4)===6&&!!s7r4.map.C4.blackout&&!!s7r4.map.I8.blackout,`got ${BDC(s7r4)}`);

  // ---- 정체성 룰 ② 정전 구역 수입 0 (손계산: 금융가 income.credit = 3) ----
  const incBase={...s7,map:{Z9:{zone:'bank',owner:0}},players:s7.players.map((p,i)=>i===0?{...p,role:'bloc',tracks:{},stocks:{},pool:{}}:p)};
  const incLit=withRand(0.99,()=>R(incBase,{type:'COLLECT_INCOME'}));
  const incDark=withRand(0.99,()=>R({...incBase,map:{Z9:{zone:'bank',owner:0,blackout:true,boDef:-2}}},{type:'COLLECT_INCOME'}));
  const c0=incBase.players[0].resources.credit;
  ok('S07 점등 금융가 1칸 수입 = ₵+3',incLit.players[0].resources.credit===c0+3,`got +${incLit.players[0].resources.credit-c0}`);
  ok('S07 정전 금융가 1칸 수입 = ₵+0 (정전 구역 수입 0)',incDark.players[0].resources.credit===c0,`got +${incDark.players[0].resources.credit-c0}`);

  // ---- 정체성 룰 ③ 정전 구역 레이드 방어 −2 · 표시=판정 (손계산: d6 눈 수) ----
  ok('S07 정상 구역 raidThreshold = 5',raidThreshold({})===5,`got ${raidThreshold({})}`);
  ok('S07 정전 구역 raidThreshold = 3 (5 + boDef −2)',raidThreshold({boDef:-2})===3,`got ${raidThreshold({boDef:-2})}`);
  ok('S07 소등 셀에 boDef=-2 기입',s7r2.map.F6.boDef===-2,`got ${s7r2.map.F6.boDef}`);
  const RV=window.raidExecPctView, gp7=s7r2.players.find(p=>p.role==='ghost')||s7r2.players[0];
  const vLit=RV(s7r2,gp7,raidThreshold({}),{stat:0,track:0,critImmune:false});
  const vDark=RV(s7r2,gp7,raidThreshold(s7r2.map.F6),{stat:0,track:0,critImmune:false});
  ok('S07 표시=판정 · 점등 구역 성공률 = 눈 5·6 → 2/6 = 33%',vLit.needed===5&&vLit.faces===2&&vLit.pct===33,JSON.stringify(vLit));
  ok('S07 표시=판정 · 정전 구역 성공률 = 눈 3~6 → 4/6 = 67%',vDark.needed===3&&vDark.faces===4&&vDark.pct===67,JSON.stringify(vDark));

  // ---- 정체성 룰 ④ Bloc 복구 (손계산: ⚙5−3=2 · ₵+8 · 무주 F6 귀속 · 경화) ----
  //   G6 은 캐스케이드 순서에 없는 F6 인접 칸 → 소유시키면 F6 복구 자격이 선다.
  const repBase={...s7r2,
    map:{...s7r2.map,G6:{...s7r2.map.G6,owner:0}},
    players:s7r2.players.map((p,i)=>i===0?{...p,role:'bloc',isNpc:false,defeated:false,resources:{...p.resources,parts:5,credit:0}}:{...p,role:'ghost'})};
  const repDone=BADV({...repBase,meta:{...repBase.meta,round:2}});
  ok('S07 복구: ⚙ 5→2 (blackoutRepairParts 3 지불)',repDone.players[0].resources.parts===2,`got ${repDone.players[0].resources.parts}`);
  ok('S07 복구: ₵ 0→8 (blackoutRepairCredit)',repDone.players[0].resources.credit===8,`got ${repDone.players[0].resources.credit}`);
  ok('S07 복구: 해당 칸 점등 (blackout false · boDef 0)',repDone.map.F6.blackout===false&&repDone.map.F6.boDef===0);
  ok('S07 복구: 무주 구역이 복구자에게 귀속 (원안 "복구 = 자산 가치")',repDone.map.F6.owner===0,`got ${repDone.map.F6.owner}`);
  ok('S07 복구: 경화 1칸 · 좌석당 라운드 1칸 제한',BHC(repDone)===1&&repDone.meta.blackout.repaired===1,`hard ${BHC(repDone)} repaired ${repDone.meta.blackout.repaired}`);
  const repAgain=BADV({...repDone,meta:{...repDone.meta,round:3}});
  ok('S07 경화 칸은 재정전 없음 (F6 은 R3 캐스케이드에서 제외)',!repAgain.map.F6.blackout);
  ok('S07 복구 부품 부족 시 무발동 (⚙2 < 3 → 경화 증가 0)',BHC(repAgain)===1,`got ${BHC(repAgain)}`);

  // ---- 정체성 룰 ⑤ 붕괴 압력 계단식 공권력 (손계산: floor(dark/4) 의 새 단계마다 +1) ----
  ok('S07 R2 정전 2칸 → floor(2/4)=0 단계 → 공권력 불변 5',s7r2.heat===5&&(s7r2.meta.blackout.heatSteps||0)===0,`heat ${s7r2.heat}`);
  const s7r3=BADV({...s7r2,meta:{...s7r2.meta,round:3}});
  ok('S07 R3 정전 4칸 → floor(4/4)=1 단계 → 공권력 5→6',s7r3.heat===6&&s7r3.meta.blackout.heatSteps===1,`heat ${s7r3.heat} steps ${s7r3.meta.blackout.heatSteps}`);
  const s7r4b=BADV({...s7r3,meta:{...s7r3.meta,round:4}});
  ok('S07 R4 정전 6칸 → floor(6/4)=1 (단계 불변) → 공권력 6 유지',s7r4b.heat===6&&s7r4b.meta.blackout.heatSteps===1,`heat ${s7r4b.heat}`);
  const s7r5=BADV({...s7r4b,meta:{...s7r4b.meta,round:5}});
  ok('S07 R5 정전 8칸 → floor(8/4)=2 단계 → 공권력 6→7',s7r5.heat===7&&s7r5.meta.blackout.heatSteps===2,`heat ${s7r5.heat}`);

  // ---- S01~S06 불변 증명: 7키 폴백 + 헬퍼 항등(참조 동일) + 셀 무오염 ----
  for(const sid of ['S01','S02','S03','S04','S05','S06']){
    const sx=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'bloc',specific:'VANTA',humans:null,scenario:sid});
    const keysOff=SR(sx,'blackoutCascade',false)===false&&SR(sx,'blackoutStart',0)===0&&SR(sx,'blackoutPerRound',0)===0
      &&SR(sx,'blackoutRaidMod',0)===0&&SR(sx,'blackoutRepairParts',0)===0&&SR(sx,'blackoutRepairCredit',0)===0&&SR(sx,'blackoutHeatPer',0)===0;
    const xr={...sx,meta:{...sx.meta,round:5}};
    ok(`${sid} S07 정전 룰 미침투 (7키 0/false 폴백 · blackout_active false · blackout_advance 항등)`,
      keysOff&&BACT(sx)===false&&BADV(xr)===xr&&BSCH(sx,9)===0);
    ok(`${sid} 맵 셀에 blackout/boDef 오염 없음 (raidThreshold 불변)`,
      Object.keys(sx.map).every(c=>sx.map[c].blackout===undefined&&sx.map[c].boDef===undefined)&&raidThreshold(sx.map.F6)===5);
  }
  // 인접 판정 헬퍼 (손계산: F6 의 4방 = E6·G6·F5·F7)
  const BAJ=window.blackout_adjacentTo;
  const adjMap={E6:{owner:null},G6:{owner:3},F5:{owner:null},F7:{owner:null},F6:{owner:null},H6:{owner:3}};
  ok('S07 blackout_adjacentTo: F6 4방에 owner3 존재(G6) → true',BAJ(adjMap,'F6',3)===true);
  ok('S07 blackout_adjacentTo: 대각·2칸(H6)은 인접 아님 → owner4 false',BAJ(adjMap,'F6',4)===false);

  // ==== v6.53 [B]: 봇 승리 진척 우선순위 — rules_botGoalGap (근시안 스코어링 교정) ====
  //   종전 scoreGhostCard 는 rep16/raid2 하드코딩으로 승리 근접을 판정했다. 실임계(11×11
  //   ghostRepOnly 70 / ghostRaids 2, S03 은 25/3)와 무관해 상시 참에 가까웠던 것을 정직화.
  const BGG=window.rules_botGoalGap;
  ok('B RULES_BOT_CLOSE_PCT=0.72',window.RULES_BOT_CLOSE_PCT===0.72,`got ${window.RULES_BOT_CLOSE_PCT}`);
  const s1b=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:'S01'});
  const g1b=GVG(s1b), gi=s1b.players.findIndex(p=>p.role==='ghost');
  const gz={...s1b.players[gi],resources:{...s1b.players[gi].resources,rep:0},highlightPoints:0};
  const gapZero=BGG({...s1b,players:s1b.players.map((p,i)=>i===gi?gz:p),meta:{...s1b.meta,raidsThisGame:{}}},gz,gi);
  ok('B 렙0·레이드0 Ghost → 진척 0 · close false',gapZero.pct===0&&gapZero.close===false,JSON.stringify(gapZero));
  ok('B raidNeed = 실목표 ghostRaids (S01 11×11 = 2)',gapZero.raidNeed===2&&g1b.ghostRaids===2,`raidNeed ${gapZero.raidNeed} goal ${g1b.ghostRaids}`);
  // 회귀 핀: 종전 하드코딩 16 은 실임계의 23% — close 가 켜지면 안 된다.
  //   [S04 를 쓰는 이유] S01 은 underdogRelief 기본 true 라 euro_underdogGoalScale 이 임계를
  //   구성에 따라 스케일한다(= 손계산 리터럴이 성립 안 함). S04 는 underdogRelief:false 이고
  //   ghostRep* 오버라이드도 없어 ghostRepOnly = base 70 + adj(4좌석 → 0) = 70 이 확정된다.
  //   구 하드코딩이 무시하던 것이 바로 이 스케일·오버라이드 계층이라는 점도 함께 드러난다.
  const s4b=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:'S04'});
  const g4b=GVG(s4b), gi4=s4b.players.findIndex(p=>p.role==='ghost'&&!p.isNpc);
  ok('B S04 ghostRepOnly=70 (언더독 항등 → 손계산 리터럴 성립)',g4b.ghostRepOnly===70,`got ${g4b.ghostRepOnly}`);
  const g16={...s4b.players[gi4],resources:{...s4b.players[gi4].resources,rep:16},highlightPoints:0};
  const gap16=BGG({...s4b,players:s4b.players.map((p,i)=>i===gi4?g16:p),meta:{...s4b.meta,raidsThisGame:{}}},g16,gi4);
  ok('B 회귀: 렙 16(구 하드코딩 임계)은 close 아님 — 16/70 = 23%',gap16.close===false&&Math.round(gap16.pct*100)===23,`pct ${Math.round(gap16.pct*100)}%`);
  // 렙온리 목표 도달 → 진척 100% → close
  const gFull={...gz,resources:{...gz.resources,rep:g1b.ghostRepOnly}};
  const gapFull=BGG({...s1b,players:s1b.players.map((p,i)=>i===gi?gFull:p),meta:{...s1b.meta,raidsThisGame:{}}},gFull,gi);
  ok('B 렙온리 임계 도달 → 진척 1.0 · close true',gapFull.pct===1&&gapFull.close===true,`pct ${gapFull.pct}`);
  // 핵심 결함 핀: S03 은 ghostRaidsOverride 3 — 구 하드코딩 2 는 이 값을 볼 수 없었다.
  const s3b=B({mode:'solo',mapSize:'11x11',difficulty:'normal',role:'ghost',specific:'BLADE',humans:null,scenario:'S03'});
  const g3b=GVG(s3b), gi3=s3b.players.findIndex(p=>p.role==='ghost'&&!p.isNpc);
  const gap3=BGG({...s3b,meta:{...s3b.meta,raidsThisGame:{}}},s3b.players[gi3],gi3);
  ok('B S03 raidNeed = 3 (ghostRaidsOverride — 구 하드코딩 2 가 놓치던 값)',gap3.raidNeed===3&&g3b.ghostRaids===3,`raidNeed ${gap3.raidNeed} goal ${g3b.ghostRaids}`);
  // Bloc 측: 종전 scoreBlocCard 에는 승리 인지 항이 전무했다.
  const bi=s1b.players.findIndex(p=>p.role==='bloc'&&!p.isNpc);
  const gapB=BGG(s1b,s1b.players[bi],bi);
  ok('B Bloc assetNeed = blocAsset − (assetValue + hp환산)',gapB.assetNeed===Math.max(0,g1b.blocAsset-(assetValue(s1b.players[bi],s1b.stocks,s1b)+window.euro_hlVictoryBonus(s1b.players[bi]))),`got ${gapB.assetNeed} goal ${g1b.blocAsset}`);
  ok('B rules_botGoalGap 은 rules_victoryRatio(타임아웃 판정)와 동일 진척값 — 단일 소스',
    gapB.pct===window.rules_victoryRatio(s1b.players[bi],bi,s1b,g1b),`gap ${gapB.pct} ratio ${window.rules_victoryRatio(s1b.players[bi],bi,s1b,g1b)}`);

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
